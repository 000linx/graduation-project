from flask import Blueprint, request
from ..models.product_model import Product
from ..utils.response import ApiResponse
from ..services.recommender import RecommenderService

product_bp = Blueprint('product', __name__)

@product_bp.route('/list', methods=['GET'])
def list_products():
    """
    获取产品列表接口
    GET /api/product/list?category=...
    Query Params: category (可选)
    """
    category = request.args.get('category')
    if category:
        products = Product.find_by_category(category)
    else:
        products = Product.find_all()
        
    # 将 ObjectId 转换为字符串以便 JSON 序列化
    for p in products:
        p['_id'] = str(p['_id'])
        
    return ApiResponse.success({"products": products})

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
