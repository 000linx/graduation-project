from __future__ import annotations

from datetime import datetime, timedelta

from ...extensions import mongo


PAID_STATUSES = {"paid", "shipped", "delivered", "completed"}


def _parse_date_like(value: str | None):
    if not value:
        return None
    v = str(value).strip()
    if not v:
        return None
    try:
        if len(v) == 10 and v[4] == "-" and v[7] == "-":
            return datetime(int(v[0:4]), int(v[5:7]), int(v[8:10]))
        return datetime.fromisoformat(v.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


def _bucket_expr(granularity: str):
    if granularity == "day":
        return {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}
    if granularity == "week":
        return {"$dateToString": {"format": "%G-W%V", "date": "$created_at"}}
    if granularity == "month":
        return {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}}
    if granularity == "year":
        return {"$dateToString": {"format": "%Y", "date": "$created_at"}}
    if granularity == "quarter":
        return {
            "$concat": [
                {"$toString": {"$year": "$created_at"}},
                "-Q",
                {
                    "$toString": {
                        "$ceil": {
                            "$divide": [
                                {"$toDouble": {"$month": "$created_at"}},
                                3,
                            ]
                        }
                    }
                },
            ]
        }
    return {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}}


def _bucket_range(granularity: str, bucket: str):
    b = str(bucket)
    if granularity == "day":
        start = datetime(int(b[0:4]), int(b[5:7]), int(b[8:10]))
        end = start + timedelta(days=1)
        return start, end
    if granularity == "month":
        start = datetime(int(b[0:4]), int(b[5:7]), 1)
        if start.month == 12:
            end = datetime(start.year + 1, 1, 1)
        else:
            end = datetime(start.year, start.month + 1, 1)
        return start, end
    if granularity == "year":
        start = datetime(int(b[0:4]), 1, 1)
        end = datetime(start.year + 1, 1, 1)
        return start, end
    if granularity == "quarter":
        year = int(b[0:4])
        q = int(b.split("-Q")[1])
        month = (q - 1) * 3 + 1
        start = datetime(year, month, 1)
        if month == 10:
            end = datetime(year + 1, 1, 1)
        else:
            end = datetime(year, month + 3, 1)
        return start, end
    if granularity == "week":
        year = int(b[0:4])
        week = int(b.split("-W")[1])
        start = datetime.fromisocalendar(year, week, 1)
        end = start + timedelta(days=7)
        return start, end
    start = datetime(int(b[0:4]), int(b[5:7]), int(b[8:10]))
    end = start + timedelta(days=1)
    return start, end


class SalesService:
    @staticmethod
    def series(granularity: str, start: str | None, end: str | None, category: str | None, page: int, page_size: int):
        start_dt = _parse_date_like(start)
        end_dt = _parse_date_like(end)
        if end_dt:
            end_dt = end_dt + timedelta(days=1)

        q = {"status": {"$in": list(PAID_STATUSES)}}
        if start_dt or end_dt:
            q["created_at"] = {}
            if start_dt:
                q["created_at"]["$gte"] = start_dt
            if end_dt:
                q["created_at"]["$lt"] = end_dt

        bucket_expr = _bucket_expr(granularity)
        skip = max(0, (int(page) - 1) * int(page_size))
        limit = int(page_size) + 1

        if category:
            pipeline = [
                {"$match": q},
                {"$unwind": "$items"},
                {
                    "$lookup": {
                        "from": "products",
                        "localField": "items.product_id",
                        "foreignField": "_id",
                        "as": "p",
                    }
                },
                {"$unwind": "$p"},
                {"$match": {"p.category": category}},
                {
                    "$project": {
                        "created_at": 1,
                        "amount": {"$multiply": ["$items.unit_price", "$items.quantity"]},
                    }
                },
                {"$group": {"_id": bucket_expr, "total": {"$sum": "$amount"}, "cnt": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
                {"$skip": skip},
                {"$limit": limit},
            ]
        else:
            pipeline = [
                {"$match": q},
                {"$group": {"_id": bucket_expr, "total": {"$sum": "$total_amount"}, "cnt": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
                {"$skip": skip},
                {"$limit": limit},
            ]

        rows = list(mongo.db.orders.aggregate(pipeline))
        has_more = len(rows) > page_size
        if has_more:
            rows = rows[:page_size]

        items = [{"bucket": r["_id"], "total_sales": float(r.get("total") or 0), "count": int(r.get("cnt") or 0)} for r in rows]
        return {"items": items, "page": page, "page_size": page_size, "has_more": has_more}

    @staticmethod
    def detail(granularity: str, bucket: str, category: str | None, page: int, page_size: int):
        start_dt, end_dt = _bucket_range(granularity, bucket)
        q = {"status": {"$in": list(PAID_STATUSES)}, "created_at": {"$gte": start_dt, "$lt": end_dt}}
        skip = max(0, (int(page) - 1) * int(page_size))
        limit = int(page_size) + 1

        if category:
            pipeline = [
                {"$match": q},
                {"$unwind": "$items"},
                {
                    "$lookup": {
                        "from": "products",
                        "localField": "items.product_id",
                        "foreignField": "_id",
                        "as": "p",
                    }
                },
                {"$unwind": "$p"},
                {"$match": {"p.category": category}},
                {
                    "$project": {
                        "created_at": 1,
                        "status": 1,
                        "user_id": 1,
                        "order_total": "$total_amount",
                        "amount": {"$multiply": ["$items.unit_price", "$items.quantity"]},
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "created_at": {"$first": "$created_at"},
                        "status": {"$first": "$status"},
                        "user_id": {"$first": "$user_id"},
                        "order_total": {"$first": "$order_total"},
                        "category_total": {"$sum": "$amount"},
                    }
                },
                {"$sort": {"created_at": -1}},
                {"$skip": skip},
                {"$limit": limit},
            ]
            rows = list(mongo.db.orders.aggregate(pipeline))
            has_more = len(rows) > page_size
            if has_more:
                rows = rows[:page_size]
            items = [
                {
                    "_id": str(r["_id"]),
                    "created_at": r.get("created_at"),
                    "status": r.get("status"),
                    "user_id": str(r.get("user_id")) if r.get("user_id") else None,
                    "order_total": float(r.get("order_total") or 0),
                    "category_total": float(r.get("category_total") or 0),
                }
                for r in rows
            ]
            return {"items": items, "page": page, "page_size": page_size, "has_more": has_more}

        cursor = (
            mongo.db.orders.find(q, projection={"items": 0})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        rows = list(cursor)
        has_more = len(rows) > page_size
        if has_more:
            rows = rows[:page_size]
        items = [
            {
                "_id": str(r.get("_id")),
                "created_at": r.get("created_at"),
                "status": r.get("status"),
                "user_id": str(r.get("user_id")) if r.get("user_id") else None,
                "order_total": float(r.get("total_amount") or 0),
            }
            for r in rows
        ]
        return {"items": items, "page": page, "page_size": page_size, "has_more": has_more}
