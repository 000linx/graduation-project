"""
商品相关 API 路由（/api/product）。

职责：
- 商品列表/详情查询
- 商品实时更新（SSE）与版本控制
- 推荐与行为事件记录（部分接口会调用推荐/事件服务）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask Blueprint / Response
- Product 模型
- ProductStreamService / RecommenderService / RecoEventService
"""

import json
import time

from flask import Blueprint, request, Response
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from .. import extensions
from ..models.product_model import Product
from ..utils.response import ApiResponse
from ..utils.serialize import to_safe_json
from ..services.product_stream_service import ProductStreamService
from ..services.recommender import RecommenderService
from ..services.reco_event_service import RecoEventService

product_bp = Blueprint('product', __name__)

@product_bp.route('/list', methods=['GET'])
def list_products():
    """
    获取产品列表接口（支持筛选与搜索）
    GET /api/product/list?category=...&q=...&page=1&page_size=20&sort=newest
    Query Params:
    - category: 分类（可选）
    - q: 关键词（可选，搜索 name/description）
    - min_price/max_price: 价格区间（可选）
    - sort: newest|price_asc|price_desc（可选）
    - page/page_size: 分页参数（可选）
    """
    category = request.args.get('category')
    q = request.args.get('q')
    sort = request.args.get('sort', 'newest')

    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')

    page = request.args.get('page', 1)
    page_size = request.args.get('page_size', 20)

    try:
        min_price_val = float(min_price) if min_price is not None and str(min_price).strip() != "" else None
        max_price_val = float(max_price) if max_price is not None and str(max_price).strip() != "" else None
        page_val = int(page)
        page_size_val = int(page_size)
    except Exception:
        return ApiResponse.error("Invalid query params")

    products, total, page_val, page_size_val = Product.query(
        category=category,
        q=q,
        min_price=min_price_val,
        max_price=max_price_val,
        sort=sort,
        page=page_val,
        page_size=page_size_val
    )

    total_pages = (total + page_size_val - 1) // page_size_val if page_size_val else 1
    return ApiResponse.success({
        "products": to_safe_json(products),
        "pagination": {
            "page": page_val,
            "page_size": page_size_val,
            "total": total,
            "total_pages": total_pages
        }
    })

@product_bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    """
    获取单个产品详情接口
    GET /api/product/<product_id>
    """
    product = Product.find_by_id(product_id)
    if not product:
        return ApiResponse.not_found("Product not found")
        
    return ApiResponse.success(to_safe_json(product))

@product_bp.route('/recommend', methods=['GET'])
def recommend():
    """
    获取推荐产品接口
    GET /api/product/recommend?loss_degree=...
    Query Params: loss_degree (可选，听力损失程度)
    """
    loss_degree = request.args.get('loss_degree')
    if loss_degree:
        products = RecommenderService.recommend_by_hearing_loss(loss_degree)
    else:
        products = RecommenderService.get_recommendations()
        
    return ApiResponse.success({"products": to_safe_json(products)})


@product_bp.route('/recommendations', methods=['GET'])
def recommendations_v2():
    anon_id = request.headers.get("X-Anonymous-Id") or request.args.get("anon_id")
    session_id = request.headers.get("X-Reco-Session") or request.args.get("session_id")
    ab_override = request.args.get("ab") or request.headers.get("X-Ab-Variant")

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        user_id = None

    profile = {
        "hearing_level": request.args.get("hearing_level") or request.args.get("loss_degree") or "",
        "scenes": request.args.get("scenes") or "",
        "brands": request.args.get("brands") or "",
        "budget_min": request.args.get("budget_min"),
        "budget_max": request.args.get("budget_max"),
    }

    limit = request.args.get("limit", 12)
    try:
        limit_val = int(limit)
    except Exception:
        limit_val = 12

    result = RecommenderService.recommend_v2(profile, user_id=user_id, anon_id=anon_id, limit=limit_val, ab_override=ab_override)

    try:
        RecoEventService.log_event(
            {
                "event": "reco_response",
                "user_id": user_id,
                "anon_id": anon_id,
                "session_id": session_id,
                "variant": result.get("variant"),
                "profile": profile,
                "count": len(result.get("items") or []),
            }
        )
    except Exception:
        pass

    return ApiResponse.success(result)


@product_bp.route('/batch', methods=['GET'])
def batch_products():
    ids_raw = request.args.get("ids") or ""
    parts = [x.strip() for x in str(ids_raw).split(",") if x.strip()]
    ids = parts[:100]
    if not ids:
        return ApiResponse.success({"items": []})
    rows = Product.find_by_ids(ids)
    items = []
    for p in rows:
        pid = str(p.get("_id"))
        items.append(
            {
                "_id": pid,
                "name": p.get("name"),
                "price": p.get("price"),
                "image_url": p.get("image_url"),
                "category": p.get("category"),
                "stock": p.get("stock"),
            }
        )
    return ApiResponse.success({"items": to_safe_json(items)})


@product_bp.route('/reco/event', methods=['POST'])
def reco_event():
    data = request.get_json(silent=True) or {}
    anon_id = request.headers.get("X-Anonymous-Id") or data.get("anon_id")
    session_id = request.headers.get("X-Reco-Session") or data.get("session_id")

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except Exception:
        user_id = None

    event = {
        "event": data.get("event"),
        "user_id": user_id,
        "anon_id": anon_id,
        "session_id": session_id,
        "variant": data.get("variant"),
        "product_id": data.get("product_id"),
        "rank": data.get("rank"),
        "meta": data.get("meta") or {},
    }

    if request.content_length is not None and int(request.content_length) > 12 * 1024:
        return ApiResponse.error("Payload too large", 413)

    if not event.get("event"):
        return ApiResponse.error("Missing fields")

    try:
        key = f"reco_event:{anon_id or user_id or 'anon'}"
        if extensions.redis_client is not None:
            try:
                n = extensions.redis_client.incr(key)
                if int(n) == 1:
                    extensions.redis_client.expire(key, 60)
                if int(n) > 120:
                    return ApiResponse.error("Too many requests", 429)
            except Exception:
                pass
        RecoEventService.log_event(event)
    except Exception:
        return ApiResponse.error("Failed to log event", 500)

    return ApiResponse.success({"ok": True})


@product_bp.route('/stream', methods=['GET'])
def product_stream():
    def gen():
        last = ProductStreamService.get_version()
        yield f"event: products\ndata: {json.dumps({'version': last}, ensure_ascii=False)}\n\n"
        start = time.time()
        while True:
            current = ProductStreamService.get_version()
            if current != last:
                last = current
                yield f"event: products\ndata: {json.dumps({'version': last}, ensure_ascii=False)}\n\n"
            else:
                yield "event: ping\ndata: {}\n\n"
            if time.time() - start > 55:
                break
            time.sleep(0.8)

    return Response(gen(), mimetype='text/event-stream')
