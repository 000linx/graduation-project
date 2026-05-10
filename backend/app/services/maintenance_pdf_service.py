from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from ..extensions import mongo
from ..utils.errors import AppError, ForbiddenError, NotFoundError


class MaintenancePdfService:
    @staticmethod
    def _require_reportlab():
        try:
            from reportlab.lib.pagesizes import A4  # noqa: F401
            return True
        except Exception:
            raise AppError("PDF export not available (missing reportlab)", 501)

    @staticmethod
    def export_record_pdf_for_user(user_id: str, record_id: str):
        MaintenancePdfService._require_reportlab()
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas

        record = mongo.db["maintenance_records"].find_one({"_id": ObjectId(record_id)})
        if not record:
            raise NotFoundError("Record not found")
        if str(record.get("user_id")) != str(ObjectId(user_id)):
            raise ForbiddenError("Forbidden")

        import io

        bio = io.BytesIO()
        c = canvas.Canvas(bio, pagesize=A4)
        w, h = A4

        y = h - 20 * mm
        c.setFont("Helvetica-Bold", 14)
        c.drawString(20 * mm, y, "Maintenance Report")

        y -= 10 * mm
        c.setFont("Helvetica", 10)
        c.drawString(20 * mm, y, f"Record ID: {record_id}")
        y -= 6 * mm
        c.drawString(20 * mm, y, f"Appointment ID: {str(record.get('appointment_id') or '')}")
        y -= 6 * mm
        created_at = record.get("created_at")
        if isinstance(created_at, datetime):
            created_at_str = created_at.isoformat(sep=" ", timespec="seconds")
        else:
            created_at_str = str(created_at or "")
        c.drawString(20 * mm, y, f"Created At: {created_at_str}")
        y -= 10 * mm

        tech = record.get("technician") or {}
        c.drawString(20 * mm, y, f"Technician: {tech.get('name') or ''}")
        y -= 8 * mm
        c.drawString(20 * mm, y, f"Total Cost: {record.get('total_cost')}")
        y -= 10 * mm

        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, y, "Items")
        y -= 7 * mm
        c.setFont("Helvetica", 10)
        for it in (record.get("items") or [])[:30]:
            if y < 20 * mm:
                c.showPage()
                y = h - 20 * mm
            name = (it or {}).get("name") if isinstance(it, dict) else str(it)
            fee = (it or {}).get("fee") if isinstance(it, dict) else ""
            c.drawString(22 * mm, y, f"- {name}  fee={fee}")
            y -= 5 * mm

        y -= 6 * mm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, y, "Replaced Parts")
        y -= 7 * mm
        c.setFont("Helvetica", 10)
        for p in (record.get("replaced_parts") or [])[:30]:
            if y < 20 * mm:
                c.showPage()
                y = h - 20 * mm
            name = (p or {}).get("name") if isinstance(p, dict) else str(p)
            qty = (p or {}).get("qty") if isinstance(p, dict) else ""
            unit_price = (p or {}).get("unit_price") if isinstance(p, dict) else ""
            c.drawString(22 * mm, y, f"- {name}  qty={qty}  unit={unit_price}")
            y -= 5 * mm

        y -= 6 * mm
        c.setFont("Helvetica-Bold", 11)
        c.drawString(20 * mm, y, "Report")
        y -= 7 * mm
        c.setFont("Helvetica", 10)
        report = str(record.get("report") or "")
        for line in report.splitlines()[:80]:
            if y < 20 * mm:
                c.showPage()
                y = h - 20 * mm
            c.drawString(22 * mm, y, line[:120])
            y -= 5 * mm

        c.showPage()
        c.save()
        pdf_bytes = bio.getvalue()

        filename = f"maintenance-record-{record_id}.pdf"
        return pdf_bytes, filename

