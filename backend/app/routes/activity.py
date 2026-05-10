from __future__ import annotations

from flask import Blueprint, request
from flask_jwt_extended import jwt_required

from ..services.activity_service import ActivityService
from ..utils.jwt_util import JwtUtil
from ..utils.response import ApiResponse
from ..utils.serialize import to_safe_json


activity_bp = Blueprint("activity", __name__)


@activity_bp.route("/list", methods=["GET"])
def list_activities():
    q = {
        "q": request.args.get("q"),
        "status": request.args.get("status"),
        "start": request.args.get("start"),
        "end": request.args.get("end"),
        "sort_by": request.args.get("sort_by"),
        "sort_dir": request.args.get("sort_dir"),
        "page": request.args.get("page") or 1,
        "page_size": request.args.get("page_size") or 12,
    }
    rows, total = ActivityService.public_list(q)
    return ApiResponse.success({"items": to_safe_json(rows), "total": total, "page": int(q["page"]), "page_size": int(q["page_size"])})


@activity_bp.route("/<activity_id>", methods=["GET"])
def get_activity(activity_id: str):
    a = ActivityService.public_detail(activity_id)
    return ApiResponse.success(to_safe_json(a))


@activity_bp.route("/<activity_id>/register", methods=["POST"])
@jwt_required()
def register(activity_id: str):
    user_id = JwtUtil.get_current_user_id()
    body = request.get_json(silent=True) or {}
    ActivityService.register(activity_id, user_id, body)
    return ApiResponse.success({"registered": True}, "Registered", 201)

