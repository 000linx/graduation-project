"""
搜索相关 API 路由（/api/search）。

职责：
- 提供简单的商品搜索接口（名称/描述关键字匹配）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask Blueprint
- MongoDB（products 集合）
"""

from flask import Blueprint, request
from ..utils.response import ApiResponse
from ..models.product_model import Product
from ..utils.serialize import to_safe_json

search_bp = Blueprint('search', __name__)

@search_bp.route('/query', methods=['GET'])
def query():
    """
    搜索产品接口
    GET /api/search/query?q=...
    Query Params: q (搜索关键词)
    """
    q = request.args.get('q', '')
    q = str(q or '').strip()
    if not q:
        return ApiResponse.success({"results": []})

    if len(q) > 64:
        q = q[:64]

    items, total, page, page_size = Product.query(q=q, page=1, page_size=20, sort="newest")
    return ApiResponse.success({"results": to_safe_json(items), "total": total, "page": page, "page_size": page_size})
