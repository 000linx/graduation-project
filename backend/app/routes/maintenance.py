from __future__ import annotations

from flask import Blueprint, Response, request
from flask_jwt_extended import jwt_required

from ..services.maintenance_service import MaintenanceService
from ..services.maintenance_pdf_service import MaintenancePdfService
from ..utils.jwt_util import JwtUtil
from ..utils.response import ApiResponse
from ..utils.serialize import to_safe_json


maintenance_bp = Blueprint("maintenance", __name__)


@maintenance_bp.route("/eligible", methods=["GET"])
@jwt_required()
def eligible_orders():
    user_id = JwtUtil.get_current_user_id()
    data = MaintenanceService.list_eligible_orders(user_id)
    return ApiResponse.success(to_safe_json(data))


@maintenance_bp.route("/slots", methods=["GET"])
@jwt_required(optional=True)
def slots():
    day = request.args.get("date") or ""
    limit = int(request.args.get("limit") or 12)
    data = MaintenanceService.recommend_slots(day, limit=limit)
    return ApiResponse.success(to_safe_json({"date": day, "slots": data}))


@maintenance_bp.route("/appointments", methods=["POST"])
@jwt_required()
def create_appointment():
    user_id = JwtUtil.get_current_user_id()
    body = request.get_json(silent=True) or {}
    appointment_id = MaintenanceService.create_appointment(
        user_id=user_id,
        order_id=body.get("order_id"),
        product_id=body.get("product_id"),
        contact_name=(body.get("contact_name") or "").strip(),
        contact_phone=(body.get("contact_phone") or "").strip(),
        preferred_start_iso=(body.get("preferred_start") or "").strip(),
        notes=body.get("notes"),
    )
    return ApiResponse.success({"appointment_id": appointment_id}, "Appointment created", 201)


@maintenance_bp.route("/appointments", methods=["GET"])
@jwt_required()
def list_appointments():
    user_id = JwtUtil.get_current_user_id()
    page = int(request.args.get("page") or 1)
    page_size = int(request.args.get("page_size") or 20)
    rows, total = MaintenanceService.list_user_appointments(user_id, page, page_size)
    return ApiResponse.success({"items": to_safe_json(rows), "total": total, "page": page, "page_size": page_size})


@maintenance_bp.route("/appointments/<appointment_id>", methods=["PUT"])
@jwt_required()
def update_appointment(appointment_id: str):
    user_id = JwtUtil.get_current_user_id()
    body = request.get_json(silent=True) or {}
    ok = MaintenanceService.update_appointment(
        user_id=user_id,
        appointment_id=appointment_id,
        contact_name=body.get("contact_name"),
        contact_phone=body.get("contact_phone"),
        notes=body.get("notes"),
    )
    return ApiResponse.success({"updated": bool(ok)})


@maintenance_bp.route("/appointments/<appointment_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_appointment(appointment_id: str):
    user_id = JwtUtil.get_current_user_id()
    body = request.get_json(silent=True) or {}
    MaintenanceService.cancel_appointment(user_id=user_id, appointment_id=appointment_id, reason=body.get("reason"))
    return ApiResponse.success({"cancelled": True})


@maintenance_bp.route("/records", methods=["GET"])
@jwt_required()
def list_records():
    user_id = JwtUtil.get_current_user_id()
    page = int(request.args.get("page") or 1)
    page_size = int(request.args.get("page_size") or 20)
    rows, total = MaintenanceService.list_user_records(user_id, page, page_size)
    return ApiResponse.success({"items": to_safe_json(rows), "total": total, "page": page, "page_size": page_size})


@maintenance_bp.route("/notifications", methods=["GET"])
@jwt_required()
def list_notifications():
    user_id = JwtUtil.get_current_user_id()
    page = int(request.args.get("page") or 1)
    page_size = int(request.args.get("page_size") or 20)
    rows, total = MaintenanceService.list_notifications(user_id, page, page_size)
    return ApiResponse.success({"items": to_safe_json(rows), "total": total, "page": page, "page_size": page_size})


@maintenance_bp.route("/records/<record_id>/pdf", methods=["GET"])
@jwt_required()
def record_pdf(record_id: str):
    user_id = JwtUtil.get_current_user_id()
    pdf_bytes, filename = MaintenancePdfService.export_record_pdf_for_user(user_id, record_id)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

