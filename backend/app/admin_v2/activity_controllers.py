from __future__ import annotations

from flask import g, request

from ..services.activity_service import ActivityService
from ..utils.response import ApiResponse
from ..utils.serialize import to_safe_json
from .controllers import _load_json, _load_query, audit, require_permission
from .schemas import ListActivitiesQuerySchema, PublishActivitySchema, RollbackActivitySchema, SaveActivitySchema


def register_admin_activity_routes(admin_bp):
    @admin_bp.route("/activities", methods=["GET"])
    @require_permission("admin.activities.read")
    @audit(action="admin.activities.read", resource_type="activity")
    def list_activities():
        q = _load_query(ListActivitiesQuerySchema())
        rows, total = ActivityService.admin_list(q)
        return ApiResponse.success({"items": to_safe_json(rows), "total": total, "page": q["page"], "page_size": q["page_size"]})

    @admin_bp.route("/activities", methods=["POST"])
    @require_permission("admin.activities.manage")
    @audit(action="admin.activities.create", resource_type="activity")
    def create_activity():
        actor = str(g.admin_user["_id"])
        activity_id = ActivityService.admin_create_draft(actor)
        return ApiResponse.success({"activity_id": activity_id}, "Created", 201)

    @admin_bp.route("/activities/<activity_id>", methods=["GET"])
    @require_permission("admin.activities.read")
    @audit(action="admin.activities.detail", resource_type="activity", resource_id_kw="activity_id")
    def get_activity(activity_id: str):
        a = ActivityService.admin_get(activity_id)
        return ApiResponse.success(to_safe_json(a))

    @admin_bp.route("/activities/<activity_id>/draft", methods=["PUT"])
    @require_permission("admin.activities.manage")
    @audit(action="admin.activities.draft_save", resource_type="activity", resource_id_kw="activity_id")
    def save_draft(activity_id: str):
        actor = str(g.admin_user["_id"])
        body = request.get_json(silent=True) or {}
        a = ActivityService.admin_update(activity_id, actor, body, mode="draft")
        return ApiResponse.success(to_safe_json(a))

    @admin_bp.route("/activities/<activity_id>", methods=["PUT"])
    @require_permission("admin.activities.manage")
    @audit(action="admin.activities.save", resource_type="activity", resource_id_kw="activity_id")
    def save_activity(activity_id: str):
        actor = str(g.admin_user["_id"])
        body = _load_json(SaveActivitySchema(), request.get_json(silent=True))
        a = ActivityService.admin_update(activity_id, actor, body, mode="save")
        return ApiResponse.success(to_safe_json(a))

    @admin_bp.route("/activities/<activity_id>/publish", methods=["POST"])
    @require_permission("admin.activities.manage")
    @audit(action="admin.activities.publish", resource_type="activity", resource_id_kw="activity_id")
    def publish_activity(activity_id: str):
        actor = str(g.admin_user["_id"])
        body = _load_json(PublishActivitySchema(), request.get_json(silent=True))
        a = ActivityService.admin_publish(activity_id, actor, mode=body["mode"], publish_at=body.get("publish_at"))
        return ApiResponse.success(to_safe_json(a))

    @admin_bp.route("/activities/<activity_id>/offline", methods=["POST"])
    @require_permission("admin.activities.manage")
    @audit(action="admin.activities.offline", resource_type="activity", resource_id_kw="activity_id")
    def offline_activity(activity_id: str):
        actor = str(g.admin_user["_id"])
        a = ActivityService.admin_offline(activity_id, actor)
        return ApiResponse.success(to_safe_json(a))

    @admin_bp.route("/activities/<activity_id>/versions", methods=["GET"])
    @require_permission("admin.activities.read")
    @audit(action="admin.activities.versions", resource_type="activity", resource_id_kw="activity_id")
    def versions(activity_id: str):
        rows = ActivityService.admin_versions(activity_id)
        return ApiResponse.success(to_safe_json(rows))

    @admin_bp.route("/activities/<activity_id>/rollback", methods=["POST"])
    @require_permission("admin.activities.manage")
    @audit(action="admin.activities.rollback", resource_type="activity", resource_id_kw="activity_id")
    def rollback(activity_id: str):
        actor = str(g.admin_user["_id"])
        body = _load_json(RollbackActivitySchema(), request.get_json(silent=True))
        a = ActivityService.admin_rollback(activity_id, actor, version_id=body["version_id"])
        return ApiResponse.success(to_safe_json(a))

