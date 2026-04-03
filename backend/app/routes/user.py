from flask import Blueprint, request
from ..models.user_model import User
from ..utils.response import ApiResponse
from ..utils.jwt_util import JwtUtil
from flask_jwt_extended import jwt_required

user_bp = Blueprint('user', __name__)

@user_bp.route('/register', methods=['POST'])
def register():
    """
    用户注册接口
    POST /api/user/register
    Body: { "username": "...", "email": "...", "password": "..." }
    """
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    # 验证必填字段
    if not username or not email or not password:
        return ApiResponse.error("Missing fields")
        
    # 检查邮箱是否已存在
    if User.find_by_email(email):
        return ApiResponse.error("Email already exists")
        
    # 创建新用户
    user_id = User.create(username, email, password)
    return ApiResponse.success({"user_id": str(user_id)}, "Registration successful", 201)

@user_bp.route('/login', methods=['POST'])
def login():
    """
    用户登录接口
    POST /api/user/login
    Body: { "email": "...", "password": "..." }
    """
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    # 查找用户并验证密码
    user = User.find_by_email(email)
    if not user or not User.verify_password(user['password_hash'], password):
        return ApiResponse.error("Invalid credentials", 401)
        
    # 生成 JWT Tokens
    tokens = JwtUtil.create_tokens(user['_id'])
    return ApiResponse.success({
        "tokens": tokens,
        "user": {
            "username": user['username'],
            "email": user['email']
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
        "email": user['email'],
        "created_at": user['created_at']
    })
