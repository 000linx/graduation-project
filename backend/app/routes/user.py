from flask import Blueprint, request
from ..models.user_model import User
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required, get_jwt, decode_token
import time
from .. import extensions
from bson.errors import InvalidId

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册接口
    POST /api/user/register
    Body: { "username": "...", "phone": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    username = data.get('username')
    phone = data.get('phone')
    password = data.get('password')
    
    # 验证必填字段
    if not username or not phone or not password:
        return ApiResponse.error("Missing fields")
        
    # 检查手机号是否已存在
    if User.find_by_phone(phone):
        return ApiResponse.error("Phone already exists")
        
    # 创建新用户
    user_id = User.create(username, phone, password)
    return ApiResponse.success({"user_id": str(user_id)}, "Registration successful", 201)

@user_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录接口
    POST /api/user/login
    Body: { "phone": "...", "password": "..." }
    """
    data = request.get_json(silent=True) or {}
    phone = data.get('phone')
    password = data.get('password')

    if not phone or not password:
        return ApiResponse.error("Missing fields")
    
    # 查找用户并验证密码
    user = User.find_by_phone(phone)
    if not user or not User.verify_password(user['password_hash'], password):
        return ApiResponse.error("Invalid credentials", 401)
        
    # 生成 JWT Tokens
    tokens = JwtUtil.create_tokens(user['_id'])
    return ApiResponse.success({
        "tokens": tokens,
        "user": {
            "username": user['username'],
            "phone": user.get('phone')
        }
    })

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
        "created_at": user['created_at']
    })

@user_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    payload = get_jwt()
    jti = payload.get("jti")
    exp = payload.get("exp")
    try:
        if extensions.redis_client is not None and jti and exp:
            ttl = max(int(exp - time.time()), 1)
            extensions.redis_client.setex(f"bl:{jti}", ttl, "1")
    except Exception:
        pass

    data = request.get_json(silent=True) or {}
    refresh_token = data.get("refresh_token")
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

    return ApiResponse.success(message="Logged out")


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
