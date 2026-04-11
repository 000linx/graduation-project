from flask import Blueprint, request
from ..models.product_model import Product
from ..utils.response import ApiResponse
from ..services.recommender import RecommenderService

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

    for p in products:
        p['_id'] = str(p['_id'])

    total_pages = (total + page_size_val - 1) // page_size_val if page_size_val else 1
    return ApiResponse.success({
        "products": products,
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
        
    product['_id'] = str(product['_id'])
    return ApiResponse.success(product)

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
        
    for p in products:
        p['_id'] = str(p['_id'])
        
    return ApiResponse.success({"products": products})
