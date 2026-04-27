import pytest


def test_reco_metrics_service_clamps_days_and_computes_rates(monkeypatch):
    from app.admin_v2.services import reco_metrics_service as mod

    class _RecoEvents:
        def aggregate(self, pipeline):
            assert pipeline[0]["$match"]["created_at"]["$gte"] is not None
            return [
                {"_id": {"variant": "A", "event": "reco_response"}, "count": 100},
                {"_id": {"variant": "A", "event": "click"}, "count": 10},
                {"_id": {"variant": "A", "event": "add_to_cart"}, "count": 5},
                {"_id": {"variant": "A", "event": "purchase"}, "count": 2},
                {"_id": {"variant": "B", "event": "reco_response"}, "count": 50},
            ]

    class _DB:
        reco_events = _RecoEvents()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())

    res = mod.RecoMetricsService.metrics(days=999)
    assert res["days"] == 90
    assert res["variants"]["A"]["requests"] == 100
    assert res["variants"]["A"]["clicks"] == 10
    assert res["variants"]["A"]["ctr"] == 0.1
    assert res["variants"]["A"]["add_to_cart_rate"] == 0.05
    assert res["variants"]["A"]["cvr"] == 0.02
    assert res["variants"]["B"]["requests"] == 50
    assert res["variants"]["B"]["ctr"] == 0.0


def test_sales_service_helpers_parse_bucket_range():
    from app.admin_v2.services.sales_service import _bucket_range, _parse_date_like

    assert _parse_date_like(None) is None
    assert _parse_date_like("  ") is None
    assert _parse_date_like("2026-04-26").year == 2026
    assert _parse_date_like("2026-04-26T00:00:00Z").year == 2026
    assert _parse_date_like("bad") is None

    s, e = _bucket_range("day", "2026-04-01")
    assert (e - s).days == 1
    s, e = _bucket_range("month", "2026-04")
    assert s.day == 1 and e.day == 1
    s, e = _bucket_range("year", "2026")
    assert s.month == 1 and e.year == 2027
    s, e = _bucket_range("quarter", "2026-Q2")
    assert s.month == 4 and e.month == 7
    s, e = _bucket_range("week", "2026-W01")
    assert (e - s).days == 7


def test_sales_service_series_and_detail_category_branch(monkeypatch):
    from app.admin_v2.services import sales_service as mod

    class _Orders:
        def aggregate(self, pipeline):
            assert pipeline[0]["$match"]["status"]["$in"]
            if any(stage.get("$group", {}).get("_id") == {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}} for stage in pipeline):
                return [{"_id": "2026-04-01", "total": 100, "cnt": 2}, {"_id": "2026-04-02", "total": 10, "cnt": 1}, {"_id": "2026-04-03", "total": 1, "cnt": 1}]
            return [{"_id": "o1", "created_at": None, "status": "paid", "user_id": "u1", "order_total": 120, "category_total": 20}]

        def find(self, q, projection=None):
            raise AssertionError("should not hit find in category branch")

    class _DB:
        orders = _Orders()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())

    out = mod.SalesService.series("day", None, None, "耳背式", page=1, page_size=2)
    assert out["page"] == 1 and out["page_size"] == 2
    assert out["has_more"] is True
    assert len(out["items"]) == 2

    det = mod.SalesService.detail("day", "2026-04-01", "耳背式", page=1, page_size=10)
    assert det["items"][0]["_id"] == "o1"
    assert det["items"][0]["category_total"] == 20.0


def test_sales_service_detail_non_category_branch(monkeypatch):
    from app.admin_v2.services import sales_service as mod

    class _Cursor:
        def __init__(self):
            self._rows = [{"_id": "o1", "created_at": None, "status": "paid", "user_id": "u1", "total_amount": 100}]

        def sort(self, *_a, **_k):
            return self

        def skip(self, *_a, **_k):
            return self

        def limit(self, n):
            self._limit = n
            return self

        def __iter__(self):
            return iter(self._rows)

    class _Orders:
        def aggregate(self, pipeline):
            raise AssertionError("should not hit aggregate in non-category branch")

        def find(self, q, projection=None):
            assert "created_at" in q and "$gte" in q["created_at"] and "$lt" in q["created_at"]
            return _Cursor()

    class _DB:
        orders = _Orders()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())

    det = mod.SalesService.detail("day", "2026-04-01", None, page=1, page_size=10)
    assert det["has_more"] is False
    assert det["items"][0]["_id"] == "o1"
    assert det["items"][0]["order_total"] == 100.0

