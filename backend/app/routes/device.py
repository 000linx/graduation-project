"""
用户设备管理 API 路由（/api/user/devices）

职责：
- 绑定/解绑用户助听器设备
- 设备列表与详情查询
- 设备状态更新

Author: Graduation Project Team
Created: 2026-05-09
Dependencies:
- Flask Blueprint
- Flask-JWT-Extended
- DeviceModel
"""

from flask import Blueprint, request
from ..models.device_model import DeviceModel
from ..utils.jwt_util import JwtUtil
from ..utils.response import ApiResponse
from flask_jwt_extended import jwt_required
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError

device_bp = Blueprint("device", __name__)


@device_bp.route("", methods=["GET"])
@jwt_required()
def list_devices():
    user_id = JwtUtil.get_current_user_id()
    if not user_id:
        return ApiResponse.unauthorized("Missing identity")
    try:
        devices = DeviceModel.list_devices(user_id)
        return ApiResponse.success({"devices": devices})
    except Exception:
        return ApiResponse.error("Failed to load devices", 500)


@device_bp.route("", methods=["POST"])
@jwt_required()
def bind_device():
    user_id = JwtUtil.get_current_user_id()
    if not user_id:
        return ApiResponse.unauthorized("Missing identity")
    data = request.get_json(silent=True) or {}
    model = (data.get("model") or "").strip()
    serial_no = (data.get("serial_no") or "").strip()
    if not model or not serial_no:
        return ApiResponse.error("Missing model or serial_no")
    try:
        doc = DeviceModel.bind_device(user_id, data)
        return ApiResponse.success({"device": doc}, "Device bound", 201)
    except DuplicateKeyError:
        return ApiResponse.error("Device already bound", 409)
    except Exception:
        return ApiResponse.error("Failed to bind device", 500)


@device_bp.route("/<device_id>", methods=["GET"])
@jwt_required()
def get_device(device_id):
    user_id = JwtUtil.get_current_user_id()
    if not user_id:
        return ApiResponse.unauthorized("Missing identity")
    try:
        doc = DeviceModel.get_device(user_id, device_id)
        if not doc:
            return ApiResponse.not_found("Device not found")
        return ApiResponse.success({"device": doc})
    except InvalidId:
        return ApiResponse.error("Invalid device id")
    except Exception:
        return ApiResponse.error("Failed to load device", 500)


@device_bp.route("/<device_id>", methods=["DELETE"])
@jwt_required()
def unbind_device(device_id):
    user_id = JwtUtil.get_current_user_id()
    if not user_id:
        return ApiResponse.unauthorized("Missing identity")
    try:
        ok = DeviceModel.unbind_device(user_id, device_id)
        if not ok:
            return ApiResponse.not_found("Device not found")
        return ApiResponse.success(message="Device unbound")
    except InvalidId:
        return ApiResponse.error("Invalid device id")
    except Exception:
        return ApiResponse.error("Failed to unbind device", 500)


@device_bp.route("/<device_id>/status", methods=["PUT"])
@jwt_required()
def update_device_status(device_id):
    user_id = JwtUtil.get_current_user_id()
    if not user_id:
        return ApiResponse.unauthorized("Missing identity")
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).strip()
    if status not in ("online", "offline", "maintenance"):
        return ApiResponse.error("Invalid status")
    try:
        doc = DeviceModel.get_device(user_id, device_id)
        if not doc:
            return ApiResponse.not_found("Device not found")
        DeviceModel.update_device_status(device_id, status)
        return ApiResponse.success({"status": status}, "Status updated")
    except InvalidId:
        return ApiResponse.error("Invalid device id")
    except Exception:
        return ApiResponse.error("Failed to update status", 500)
