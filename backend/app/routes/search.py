from flask import Blueprint, request
from ..extensions import mongo
from ..utils.response import ApiResponse

search_bp = Blueprint('search', __name__)

@search_bp.route('/query', methods=['GET'])
def query():
    """
    搜索产品接口
    GET /api/search/query?q=...
    Query Params: q (搜索关键词)
    """
    q = request.args.get('q', '')
    if not q:
        return ApiResponse.success({"results": []})
        
    # 基于名称和描述的简单正则搜索
    results = list(mongo.db.products.find({
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}}
        ]
    }))
    
    for r in results:
        r['_id'] = str(r['_id'])
        
    return ApiResponse.success({"results": results})
