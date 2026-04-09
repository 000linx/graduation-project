from flask import Blueprint, request
from ..models.user_model import User
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required, get_jwt, decode_token
import time
from .. import extensions

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
