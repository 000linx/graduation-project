"""
用户相关 API 路由（/api/user）。

职责：
- 用户注册/登录/登出
- 邮箱验证码发送与校验
- 查询个人信息与修改密码

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask Blueprint
- Flask-JWT-Extended（jwt_required 等）
- User 模型与 JwtUtil 工具
"""

import re
import os
import logging
from flask import Blueprint, current_app, request
from ..models.user_model import User
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from ..utils.mail_util import send_verification_code_email, generate_verify_code
from ..utils import verify_code_store
from flask_jwt_extended import decode_token, get_jwt, jwt_required, set_access_cookies, set_refresh_cookies, unset_jwt_cookies, verify_jwt_in_request
import time
from datetime import datetime, timedelta
from .. import extensions
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError
from ..services.hearing_test_service import HearingTestService

user_bp = Blueprint('user', __name__)
logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
VERIFY_CODE_TTL = 300
VERIFY_RATE_LIMIT_TTL = 60


@user_bp.route('/send_verify_code', methods=['POST'])
def send_verify_code():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip()

    if not email:
        return ApiResponse.error('请输入邮箱地址')
    if not EMAIL_RE.match(email):
        return ApiResponse.error('邮箱格式不正确')

    remaining = verify_code_store.check_rate_limit(email)
    if remaining > 0:
        return ApiResponse.error(f'发送过于频繁，请 {remaining} 秒后再试', 429)

    existing = User.find_by_email(email)
    if existing:
        return ApiResponse.error('该邮箱已被注册', 409)

    code = generate_verify_code()

    try:
        ok = send_verification_code_email(email, code)
    except Exception as exc:
        logger.error(f"Failed to send verification code to {email}: {exc}")
        return ApiResponse.error('邮件发送失败，请稍后重试', 500)

    if not ok:
        return ApiResponse.error('邮件发送失败，请检查邮箱地址', 500)

    verify_code_store.set_code(email, code, VERIFY_CODE_TTL)

    return ApiResponse.success(None, '验证码已发送，5分钟内有效')


@user_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册接口
    POST /api/user/register
    Body: { "username": "...", "phone": "...", "password": "...", "email?": "...", "verify_code?": "..." }
    """
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    phone = data.get('phone')
    password = data.get('password')
    email = (data.get('email') or '').strip()
    verify_code = (data.get('verify_code') or '').strip()

    username = (username or "").strip()
    phone = (phone or "").strip()
    if not username or not phone or not password:
        return ApiResponse.error("Missing fields")

    if email:
        if not EMAIL_RE.match(email):
            return ApiResponse.error("邮箱格式不正确")
        if verify_code:
            existing = User.find_by_email(email)
            if existing:
                return ApiResponse.error("该邮箱已被注册", 409)
            stored = verify_code_store.get_code(email)
            if not stored:
                return ApiResponse.error("验证码已过期，请重新获取")
            if stored != verify_code:
                return ApiResponse.error("验证码错误")
            verify_code_store.delete_code(email)
        else:
            return ApiResponse.error("请输入邮箱验证码")

    try:
        user_id = User.create(username, phone, password, email=email or None)
    except DuplicateKeyError:
        return ApiResponse.error("Phone already exists", 409)
    return ApiResponse.success({"user_id": str(user_id)}, "Registration successful", 201)

@user_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录接口
    POST /api/user/login
    Body: { "phone": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    phone = (data.get('phone') or '').strip()
    password = data.get('password')

    if not phone or not password:
        return ApiResponse.error("Missing fields")
    
    # 查找用户并验证密码
    user = User.find_by_phone(phone)
    if not user or not User.verify_password(user['password_hash'], password):
        return ApiResponse.error("Invalid credentials", 401)

    account_status = user.get("account_status", "active")
    if account_status == "deleted":
        return ApiResponse.error("该账户已注销，无法登录", 403)
    if account_status == "pending_deletion":
        return ApiResponse.error("该账户已申请注销，处于冷静期，无法登录", 403)

    # 生成 JWT Tokens
    tokens = JwtUtil.create_tokens(user['_id'])
    notif = user.get("notification_settings")
    if not isinstance(notif, dict):
        notif = User.DEFAULT_NOTIFICATION_SETTINGS
    resp, status = ApiResponse.success(
        {
            "tokens": tokens,
            "user": {"username": user['username'], "phone": user.get('phone'), "notification_settings": notif},
        }
    )
    set_access_cookies(resp, tokens["access_token"])
    set_refresh_cookies(resp, tokens["refresh_token"])
    return resp, status


@user_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = JwtUtil.get_current_user_id()
    tokens = JwtUtil.create_tokens(user_id)
    resp, status = ApiResponse.success({"tokens": tokens}, "Refreshed")
    set_access_cookies(resp, tokens["access_token"])
    set_refresh_cookies(resp, tokens["refresh_token"])
    return resp, status

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """
    获取用户个人信息接口 (需要登录)
    GET /api/user/profile
    Headers: Authorization: Bearer <token>
    """
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")
        
    return ApiResponse.success({
        "username": user['username'],
        "phone": user.get('phone'),
        "created_at": user['created_at'],
        "notification_settings": User.get_notification_settings(user_id)
    })

@user_bp.route('/logout', methods=['POST'])
def logout():
    refresh_cookie_name = current_app.config.get("JWT_REFRESH_COOKIE_NAME", "refresh_token_cookie")
    try:
        verify_jwt_in_request(optional=True)
        payload = get_jwt()
        if payload:
            jti = payload.get("jti")
            exp = payload.get("exp")
            try:
                if extensions.redis_client is not None and jti and exp:
                    ttl = max(int(exp - time.time()), 1)
                    extensions.redis_client.setex(f"bl:{jti}", ttl, "1")
            except Exception:
                pass
    except Exception:
        pass

    refresh_token = request.cookies.get(refresh_cookie_name)
    if refresh_token:
        try:
            decoded = decode_token(refresh_token)
            rjti = decoded.get("jti")
            rexp = decoded.get("exp")
            if extensions.redis_client is not None and rjti and rexp:
                ttl = max(int(rexp - time.time()), 1)
                extensions.redis_client.setex(f"bl:{rjti}", ttl, "1")
        except Exception:
            pass

    resp, status = ApiResponse.success(message="Logged out")
    unset_jwt_cookies(resp)
    return resp, status


@user_bp.route('/change_password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json(silent=True) or {}
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')

    if not old_password or not new_password:
        return ApiResponse.error("Missing fields")
    if confirm_password is not None and confirm_password != new_password:
        return ApiResponse.error("Passwords do not match")
    if len(str(new_password)) < 6:
        return ApiResponse.error("Password too short")

    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")
    if not User.verify_password(user['password_hash'], old_password):
        return ApiResponse.error("Invalid credentials", 401)

    updated = User.update_password(user_id, new_password)
    if not updated or updated.matched_count == 0:
        return ApiResponse.error("Failed to update password")

    return ApiResponse.success(message="Password updated")


@user_bp.route('/addresses', methods=['GET'])
@jwt_required()
def list_addresses():
    user_id = JwtUtil.get_current_user_id()
    try:
        addresses = User.list_addresses(user_id)
        return ApiResponse.success({"addresses": addresses})
    except Exception:
        return ApiResponse.error("Failed to load addresses", 500)


@user_bp.route('/addresses', methods=['POST'])
@jwt_required()
def create_address():
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json(silent=True) or {}
    required_fields = ["receiver", "phone", "province", "city", "district", "detail"]
    for f in required_fields:
        if not data.get(f):
            return ApiResponse.error("Missing fields")
    try:
        addr_id = User.add_address(user_id, data)
        return ApiResponse.success({"address_id": addr_id}, "Address created", 201)
    except Exception:
        return ApiResponse.error("Failed to create address", 500)


@user_bp.route('/addresses/<address_id>', methods=['PUT'])
@jwt_required()
def update_address(address_id):
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json(silent=True) or {}
    allowed = {"receiver", "phone", "province", "city", "district", "detail", "label", "is_default"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if not updates:
        return ApiResponse.error("No updates")
    try:
        ok = User.update_address(user_id, address_id, updates)
        if not ok:
            return ApiResponse.not_found("Address not found")
        return ApiResponse.success({"address_id": address_id}, "Address updated")
    except InvalidId:
        return ApiResponse.error("Invalid id")
    except Exception:
        return ApiResponse.error("Failed to update address", 500)


@user_bp.route('/addresses/<address_id>', methods=['DELETE'])
@jwt_required()
def delete_address(address_id):
    user_id = JwtUtil.get_current_user_id()
    try:
        ok = User.delete_address(user_id, address_id)
        if not ok:
            return ApiResponse.not_found("Address not found")
        return ApiResponse.success({"address_id": address_id}, "Address deleted")
    except InvalidId:
        return ApiResponse.error("Invalid id")
    except Exception:
        return ApiResponse.error("Failed to delete address", 500)


@user_bp.route('/addresses/<address_id>/default', methods=['PUT'])
@jwt_required()
def set_default_address(address_id):
    user_id = JwtUtil.get_current_user_id()
    try:
        ok = User.set_default_address(user_id, address_id)
        if not ok:
            return ApiResponse.not_found("Address not found")
        return ApiResponse.success({"address_id": address_id}, "Default updated")
    except InvalidId:
        return ApiResponse.error("Invalid id")
    except Exception:
        return ApiResponse.error("Failed to set default", 500)


@user_bp.route('/hearing_profile', methods=['GET'])
@jwt_required()
def get_hearing_profile():
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")
    profile = user.get("hearing_profile")
    return ApiResponse.success({"hearing_profile": profile})


@user_bp.route('/hearing_profile', methods=['PUT'])
@jwt_required()
def update_hearing_profile():
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")

    data = request.get_json(silent=True) or {}
    profile = data.get("hearing_profile") if isinstance(data, dict) else None
    if not isinstance(profile, dict):
        return ApiResponse.error("Missing fields")

    allowed = {"hearing_level", "scenes", "budget_min", "budget_max", "brands"}
    payload = {k: profile.get(k) for k in allowed if k in profile}

    try:
        User.set_hearing_profile(user_id, payload)
    except Exception:
        return ApiResponse.error("Failed to update", 500)

    return ApiResponse.success({"hearing_profile": payload}, "Updated")


@user_bp.route('/hearing_tests', methods=['POST'])
@jwt_required()
def create_hearing_test():
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json(silent=True) or {}
    thresholds = data.get("thresholds") if isinstance(data, dict) else None
    meta = data.get("meta") if isinstance(data, dict) else None
    if not isinstance(thresholds, dict):
        return ApiResponse.error("Missing fields")
    if not isinstance(meta, dict):
        meta = {}

    left = thresholds.get("left")
    right = thresholds.get("right")
    if not isinstance(left, dict) or not isinstance(right, dict):
        return ApiResponse.error("Invalid fields")

    allowed = {str(x) for x in HearingTestService.STANDARD_FREQS}
    for ear_obj in [left, right]:
        for k, v in ear_obj.items():
            if str(k) not in allowed:
                return ApiResponse.error("Invalid fields")
            if not isinstance(v, (int, float)):
                return ApiResponse.error("Invalid fields")
            if float(v) < 0 or float(v) > 120:
                return ApiResponse.error("Invalid fields")

    try:
        created = HearingTestService.create_test(user_id, thresholds, meta=meta)
        return ApiResponse.success({"hearing_test": created}, "Created", 201)
    except Exception:
        return ApiResponse.error("Failed to create", 500)


@user_bp.route('/hearing_tests/latest', methods=['GET'])
@jwt_required()
def get_latest_hearing_test():
    user_id = JwtUtil.get_current_user_id()
    try:
        doc = HearingTestService.get_latest(user_id)
        return ApiResponse.success({"hearing_test": doc})
    except Exception:
        return ApiResponse.error("Failed to load", 500)


@user_bp.route('/notification_settings', methods=['GET'])
@jwt_required()
def get_notification_settings():
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")
    return ApiResponse.success({"notification_settings": User.get_notification_settings(user_id)})


@user_bp.route('/notification_settings', methods=['PUT'])
@jwt_required()
def update_notification_settings():
    user_id = JwtUtil.get_current_user_id()
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return ApiResponse.error("Missing fields")

    allowed = {"email_notifications", "in_app_notifications", "activity_reminders"}
    updates = {k: data.get(k) for k in allowed if k in data}
    for k, v in updates.items():
        if not isinstance(v, bool):
            return ApiResponse.error("Invalid fields")

    res = User.set_notification_settings(user_id, updates)
    if not res or getattr(res, "matched_count", 0) == 0:
        return ApiResponse.not_found("User not found")
    return ApiResponse.success({"notification_settings": User.get_notification_settings(user_id)}, "Updated")


@user_bp.route('/deletion/request', methods=['POST'])
@jwt_required()
def request_account_deletion():
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")

    status = user.get("account_status", "active")
    if status == "deleted":
        return ApiResponse.error("该账户已注销", 400)
    if status == "pending_deletion":
        return ApiResponse.error("该账户已处于注销冷静期中", 400)

    data = request.get_json(silent=True) or {}
    password = data.get("password")

    if not password:
        return ApiResponse.error("请输入密码以确认身份")

    if not User.verify_password(user['password_hash'], password):
        return ApiResponse.error("密码错误，身份验证失败", 401)

    result = User.request_deletion(user_id)
    if not result or result.matched_count == 0:
        return ApiResponse.error("操作失败", 500)

    cooling_until = datetime.now() + timedelta(days=User.DELETION_COOLING_DAYS)
    return ApiResponse.success({
        "account_status": "pending_deletion",
        "deletion_cooling_until": cooling_until.isoformat(),
        "cooling_days": User.DELETION_COOLING_DAYS,
        "message": f"注销申请已提交，冷静期为{User.DELETION_COOLING_DAYS}天，期间可随时撤销"
    })


@user_bp.route('/deletion/cancel', methods=['POST'])
@jwt_required()
def cancel_account_deletion():
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")

    status = user.get("account_status", "active")
    if status != "pending_deletion":
        return ApiResponse.error("当前账户不在注销冷静期中", 400)

    result = User.cancel_deletion(user_id)
    if not result or result.matched_count == 0:
        return ApiResponse.error("操作失败", 500)

    return ApiResponse.success({
        "account_status": "active",
        "message": "注销申请已撤销，账户恢复正常"
    })


@user_bp.route('/deletion/status', methods=['GET'])
@jwt_required()
def get_deletion_status():
    user_id = JwtUtil.get_current_user_id()
    status_data = User.get_deletion_status(user_id)
    if not status_data:
        return ApiResponse.not_found("User not found")
    return ApiResponse.success(status_data)


@user_bp.route('/deletion/export', methods=['GET'])
@jwt_required()
def export_user_data():
    user_id = JwtUtil.get_current_user_id()
    user = User.find_by_id(user_id)
    if not user:
        return ApiResponse.not_found("User not found")

    data = User.export_user_data(user_id)
    if data is None:
        return ApiResponse.error("导出失败", 500)

    return ApiResponse.success({
        "user_data": data,
        "exported_at": datetime.now().isoformat(),
        "notice": "根据GDPR规定，您有权获取您的个人数据副本"
    })
