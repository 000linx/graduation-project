import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import mongo
from app.services.product_stream_service import ProductStreamService


def main():
    app = create_app("development")
    with app.app_context():
        now = datetime.now()
        products = [
            {
                "name": "智听A1（耳背式）",
                "description": "适用于轻度听力损失；支持降噪与蓝牙连接。",
                "price": 1999.0,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1585386959984-a41552262a0a?auto=format&fit=crop&w=800&q=80&fm=webp",
                "status": "on_sale",
                "category": "耳背式",
            },
            {
                "name": "静音B2（耳内式）",
                "description": "隐蔽佩戴；清晰语音增强；适合会议与室内场景。",
                "price": 2599.0,
                "stock": 30,
                "image_url": "https://images.unsplash.com/photo-1585386959984-a41552262a0a?auto=format&fit=crop&w=800&q=80&fm=webp",
                "status": "on_sale",
                "category": "耳内式",
            },
            {
                "name": "轻隐C3（隐形式）",
                "description": "体积更小；舒适佩戴；支持多档增益调节。",
                "price": 3299.0,
                "stock": 20,
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80&fm=webp",
                "status": "on_sale",
                "category": "隐形式",
            },
            {
                "name": "续航D4（充电款）",
                "description": "磁吸充电；续航更长；适合日常通勤与户外。",
                "price": 2899.0,
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80&fm=webp",
                "status": "on_sale",
                "category": "充电款",
            },
        ]

        inserted = 0
        for p in products:
            existing = mongo.db.products.find_one({"name": p["name"]})
            if existing:
                continue
            doc = dict(p)
            doc["created_at"] = now
            doc["updated_at"] = now
            mongo.db.products.insert_one(doc)
            inserted += 1

        if inserted > 0:
            ProductStreamService.bump_version()

        print(f"OK inserted={inserted}")


if __name__ == "__main__":
    main()

