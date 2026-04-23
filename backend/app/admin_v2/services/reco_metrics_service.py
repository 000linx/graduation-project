from datetime import datetime, timedelta

from ...extensions import mongo


class RecoMetricsService:
    @staticmethod
    def metrics(days: int = 7):
        d = max(min(int(days), 90), 1)
        start = datetime.now() - timedelta(days=d)

        pipeline = [
            {"$match": {"created_at": {"$gte": start}}},
            {
                "$group": {
                    "_id": {"variant": "$variant", "event": "$event"},
                    "count": {"$sum": 1},
                }
            },
        ]

        agg = list(mongo.db.reco_events.aggregate(pipeline))
        by_variant = {}
        for row in agg:
            key = row.get("_id") or {}
            v = key.get("variant") or "unknown"
            e = key.get("event") or "unknown"
            by_variant.setdefault(v, {})[e] = int(row.get("count") or 0)

        result = {}
        for v, counts in by_variant.items():
            requests = int(counts.get("reco_response") or 0)
            clicks = int(counts.get("click") or 0)
            add_to_cart = int(counts.get("add_to_cart") or 0)
            purchases = int(counts.get("purchase") or 0)

            ctr = (clicks / requests) if requests else 0.0
            atc_rate = (add_to_cart / requests) if requests else 0.0
            cvr = (purchases / requests) if requests else 0.0

            result[v] = {
                "requests": requests,
                "clicks": clicks,
                "add_to_cart": add_to_cart,
                "purchases": purchases,
                "ctr": round(ctr, 6),
                "add_to_cart_rate": round(atc_rate, 6),
                "cvr": round(cvr, 6),
            }

        return {"days": d, "variants": result}
