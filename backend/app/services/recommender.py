"""
推荐服务（Recommender）。

职责：
- 提供通用推荐与按画像（听损/预算/场景等）推荐的入口
- 生成可复用的推荐缓存 key（用于避免重复计算）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Product 模型（商品数据查询）
"""

import hashlib
import time
import json

from ..models.product_model import Product

class RecommenderService:
    """
    推荐服务，负责商品推荐逻辑
    """
    @staticmethod
    def get_recommendations(user_id=None):
        """
        获取通用推荐列表
        :param user_id: 用户 ID (可选，用于个性化推荐)
        :return: 推荐产品列表
        """
        # 复杂推荐逻辑占位符 (例如：协同过滤，基于历史记录)
        # 目前简单返回库存最多或最新的产品
        all_products = Product.find_all()
        # 返回前 5 个产品
        return all_products[:5]

    @staticmethod
    def recommend_by_hearing_loss(loss_degree):
        """
        根据听力损失程度推荐助听器
        :param loss_degree: 听力损失程度 (mild, moderate, severe, profound)
        :return: 匹配的产品列表
        """
        profile = {"hearing_level": loss_degree}
        return [x.get("product") for x in RecommenderService.recommend_v2(profile, limit=8).get("items", [])]

    @staticmethod
    def _normalize_hearing_level(level):
        raw = (level or "").strip().lower()
        cn_map = {"轻度": "mild", "中度": "moderate", "重度": "severe", "极重度": "profound", "极重": "profound"}
        if raw in cn_map:
            return cn_map[raw]
        alias = {
            "mild": "mild",
            "moderate": "moderate",
            "medium": "moderate",
            "severe": "severe",
            "profound": "profound",
            "very_severe": "profound",
        }
        return alias.get(raw, "")

    @staticmethod
    def _parse_list(value):
        if value is None:
            return []
        if isinstance(value, list):
            return [str(x).strip() for x in value if str(x).strip()]
        s = str(value).strip()
        if not s:
            return []
        parts = [x.strip() for x in s.split(",")]
        return [x for x in parts if x]

    @staticmethod
    def _stable_variant(user_id=None, anon_id=None, ab_override=None):
        if ab_override in ("A", "B"):
            return ab_override
        key = str(user_id or anon_id or "anon").encode("utf-8")
        h = hashlib.sha256(key).hexdigest()
        return "A" if int(h[:2], 16) < 128 else "B"

    @staticmethod
    def _score_product(p: dict, profile: dict, variant: str):
        name = str(p.get("name") or "")
        desc = str(p.get("description") or "")
        text = f"{name} {desc} {p.get('category') or ''}".lower()
        price = float(p.get("price") or 0)
        category = str(p.get("category") or "")

        hearing = RecommenderService._normalize_hearing_level(profile.get("hearing_level"))
        scenes = RecommenderService._parse_list(profile.get("scenes"))
        brands = RecommenderService._parse_list(profile.get("brands"))
        budget_min = profile.get("budget_min")
        budget_max = profile.get("budget_max")
        try:
            budget_min = float(budget_min) if budget_min is not None and str(budget_min).strip() != "" else None
        except Exception:
            budget_min = None
        try:
            budget_max = float(budget_max) if budget_max is not None and str(budget_max).strip() != "" else None
        except Exception:
            budget_max = None

        weights = {
            "hearing": 3.0,
            "scene": 2.0,
            "budget": 2.0,
            "brand": 1.0,
            "fresh": 0.6,
        }
        if variant == "B":
            weights = {**weights, "budget": 2.8, "brand": 1.4, "scene": 1.6}

        reasons = []
        score = 0.0

        hearing_kw = {
            "mild": ["隐形", "轻便", "小巧", "隐形式", "耳内", "耳道", "cic", "itc", "ite"],
            "moderate": ["降噪", "智能", "通话", "蓝牙", "耳背", "耳内", "ite", "bte"],
            "severe": ["大功率", "功率", "耳背", "bte", "power"],
            "profound": ["超大功率", "大功率", "远程麦克风", "fm", "辅听", "无障碍", "power"],
        }
        if hearing:
            kws = hearing_kw.get(hearing, [])
            hit = sum(1 for k in kws if k.lower() in text or k in category)
            if hit:
                v = min(1.0, hit / 4.0) * weights["hearing"]
                score += v
                reasons.append({"factor": "hearing_level", "weight": v, "detail": f"匹配听力等级（{hearing}）"})

        scene_kw = {
            "日常交流": ["人声", "降噪", "智能"],
            "看电视": ["电视", "蓝牙", "无线"],
            "电话": ["电话", "通话", "蓝牙"],
            "会议": ["远程麦克风", "麦克风", "fm", "会议"],
            "课堂": ["远程麦克风", "麦克风", "fm", "学习"],
            "户外": ["防水", "风噪", "户外", "耐用"],
        }
        if scenes:
            total = 0.0
            for s in scenes:
                kws = scene_kw.get(s, [])
                hit = sum(1 for k in kws if k.lower() in text or k in category)
                if hit:
                    total += min(1.0, hit / 3.0)
            if total > 0:
                v = min(1.0, total) * weights["scene"]
                score += v
                reasons.append({"factor": "scene", "weight": v, "detail": "匹配使用场景"})

        if budget_min is not None or budget_max is not None:
            in_range = True
            if budget_min is not None and price < budget_min:
                in_range = False
            if budget_max is not None and price > budget_max:
                in_range = False
            if in_range:
                v = weights["budget"]
                score += v
                reasons.append({"factor": "budget", "weight": v, "detail": "在预算区间内"})
            else:
                mid = None
                if budget_min is not None and budget_max is not None:
                    mid = (budget_min + budget_max) / 2.0
                elif budget_min is not None:
                    mid = budget_min
                elif budget_max is not None:
                    mid = budget_max
                if mid:
                    dist = abs(price - mid) / max(mid, 1.0)
                    v = max(0.0, 1.0 - dist) * (weights["budget"] * 0.5)
                    score += v
                    reasons.append({"factor": "budget", "weight": v, "detail": "接近预算区间"})

        if brands:
            b = str(p.get("brand") or "").strip()
            hit = 0
            for pref in brands:
                if not pref:
                    continue
                if b and pref.lower() == b.lower():
                    hit += 2
                elif pref.lower() in text:
                    hit += 1
            if hit:
                v = min(1.0, hit / 2.0) * weights["brand"]
                score += v
                reasons.append({"factor": "brand", "weight": v, "detail": "匹配品牌偏好"})

        created_at = p.get("created_at")
        ts = None
        try:
            ts = created_at.timestamp() if created_at else None
        except Exception:
            ts = None
        if ts:
            age_days = max((time.time() - ts) / 86400.0, 0.0)
            freshness = max(0.0, 1.0 - min(age_days / 90.0, 1.0))
            v = freshness * weights["fresh"]
            score += v
            if v > 0.15:
                reasons.append({"factor": "fresh", "weight": v, "detail": "近期上新"})

        reasons_sorted = sorted(reasons, key=lambda x: float(x.get("weight") or 0), reverse=True)
        top = reasons_sorted[:3]
        return score, top

    @staticmethod
    def recommend_v2(profile: dict, user_id=None, anon_id=None, limit=12, ab_override=None):
        variant = RecommenderService._stable_variant(user_id=user_id, anon_id=anon_id, ab_override=ab_override)

        cache_key = None
        try:
            payload = json.dumps(profile or {}, ensure_ascii=False, sort_keys=True)
            cache_key = hashlib.sha256(f"{variant}:{payload}".encode("utf-8")).hexdigest()
        except Exception:
            cache_key = None

        now = time.time()
        if cache_key:
            cached = getattr(RecommenderService, "_cache", {}).get(cache_key)
            if cached and isinstance(cached, dict):
                if now - float(cached.get("ts") or 0) <= 30:
                    data = cached.get("data")
                    if isinstance(data, dict):
                        data = dict(data)
                        data["variant"] = variant
                        return data

        hearing = RecommenderService._normalize_hearing_level(profile.get("hearing_level"))
        base_categories = []
        if hearing in ("mild", "moderate"):
            base_categories = ["隐形式", "耳内式", "耳背式", "耳道式"]
        elif hearing in ("severe", "profound"):
            base_categories = ["耳背式", "辅听设备", "无障碍配件"]

        budget_min = profile.get("budget_min")
        budget_max = profile.get("budget_max")

        candidates = Product.find_reco_candidates(
            category_in=base_categories or None,
            min_price=budget_min,
            max_price=budget_max,
            limit=300,
        )

        scored = []
        for p in candidates:
            s, reasons = RecommenderService._score_product(p, profile, variant)
            scored.append((s, p, reasons))

        scored.sort(key=lambda x: x[0], reverse=True)
        topn = max(min(int(limit), 30), 1)
        items = []
        for idx, (s, p, reasons) in enumerate(scored[:topn]):
            p = dict(p)
            p["_id"] = str(p.get("_id"))
            items.append(
                {
                    "rank": idx + 1,
                    "score": round(float(s), 6),
                    "reasons": reasons,
                    "product": p,
                }
            )

        data = {
            "variant": variant,
            "items": items,
        }

        if cache_key:
            cache = getattr(RecommenderService, "_cache", None)
            if not isinstance(cache, dict):
                cache = {}
                setattr(RecommenderService, "_cache", cache)
            cache[cache_key] = {"ts": now, "data": data}

        return data
