"""
初始化示例商品数据（开发环境脚本）。

职责：
- 向 products 集合写入一批示例商品（可重复执行：会以 name 为键做 upsert/覆盖策略）
- 更新商品流版本（用于前端首页 SSE/轮询刷新）

Author: Graduation Project Team
Created: 2026-04-26
Dependencies:
- Flask app factory: app.create_app
- MongoDB collection: products
- ProductStreamService.bump_version
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.extensions import mongo
from app.services.product_stream_service import ProductStreamService


def main():
    """
    脚本入口：在 development 配置下写入示例商品数据。

    Raises:
        Exception: 当应用初始化或数据库写入失败时抛出。
    """
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
                "name": "峰力 Audéo P30-312（耳背式）",
                "description": "RIC 312 电池；多麦克风降噪与言语增强；适合轻-中度听力损失，日常通勤与对话场景更清晰。",
                "price": 6980.0,
                "stock": 26,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=premium+behind+the+ear+hearing+aid+product+photography+white+background&image_size=square",
                "status": "on_sale",
                "category": "耳背式",
            },
            {
                "name": "奥迪康 Ruby 2 miniRITE（耳背式）",
                "description": "小巧 RIC 外观；针对多人对话的自适应降噪；支持手机直连（依机型而定），适合初次配戴用户。",
                "price": 7680.0,
                "stock": 18,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=modern+ric+hearing+aid+studio+product+photo+white+background&image_size=square",
                "status": "on_sale",
                "category": "耳背式",
            },
            {
                "name": "西嘉 Motion X 3X（耳背式）",
                "description": "BTE 机身更易操作；稳健增益与反馈抑制；适合中度听力损失与户外活动场景。",
                "price": 4980.0,
                "stock": 32,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=behind+the+ear+hearing+aid+product+photo+neutral+background&image_size=square",
                "status": "on_sale",
                "category": "耳背式",
            },
            {
                "name": "瑞声达 Key KE361-DRWC（耳背式）",
                "description": "RIC 外形；自动环境识别与基础言语增强；适合家庭交流、看电视等日常使用。",
                "price": 5580.0,
                "stock": 22,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hearing+aid+closeup+product+photography+white+background&image_size=square",
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
                "name": "奥迪康 Own 2 ITC（耳内式）",
                "description": "ITC 耳内式外观更隐蔽；语音增强与反馈抑制；适合轻-中度听力损失，室内沟通更自然。",
                "price": 9280.0,
                "stock": 14,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=in+the+ear+hearing+aid+product+photo+white+background&image_size=square",
                "status": "on_sale",
                "category": "耳内式",
            },
            {
                "name": "斯达克 Evolv AI ITE（耳内式）",
                "description": "ITE 定制机壳贴合耳型；多环境自动调节；适合日常社交与家庭对话场景。",
                "price": 10800.0,
                "stock": 10,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=custom+in+the+ear+hearing+aid+studio+photo&image_size=square",
                "status": "on_sale",
                "category": "耳内式",
            },
            {
                "name": "西嘉 Insio 2NX ITC（耳内式）",
                "description": "ITC 机身；针对噪声环境的言语清晰度优化；适合通话与室内办公场景。",
                "price": 8680.0,
                "stock": 12,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=itc+hearing+aid+product+photography+white+background&image_size=square",
                "status": "on_sale",
                "category": "耳内式",
            },
            {
                "name": "唯听 Moment 110 ITE（耳内式）",
                "description": "舒适佩戴与平衡音质；基础降噪与回声抑制；适合家庭交流、看电视与轻度户外场景。",
                "price": 7580.0,
                "stock": 16,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=in+the+ear+hearing+aid+product+photo+clean+white+background&image_size=square",
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
                "name": "峰力 Virto P-10 NW O（隐形式）",
                "description": "近深耳道隐形款；10 号电池；适合追求隐蔽佩戴的用户，提供稳定增益与反馈抑制。",
                "price": 9880.0,
                "stock": 9,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=invisible+hearing+aid+iic+product+photo+white+background&image_size=square",
                "status": "on_sale",
                "category": "隐形式",
            },
            {
                "name": "奥迪康 Own SI IIC（隐形式）",
                "description": "IIC 级别更深置入；轻度-中度听力损失可选；日常对话更自然，外观更不易察觉。",
                "price": 11280.0,
                "stock": 8,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=iic+hearing+aid+studio+product+photo+white+background&image_size=square",
                "status": "on_sale",
                "category": "隐形式",
            },
            {
                "name": "西嘉 Silk 3X（隐形式）",
                "description": "即戴型隐形款；柔软耳塞更舒适；适合初次体验隐形佩戴，室内交流更清晰。",
                "price": 6280.0,
                "stock": 20,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=small+invisible+hearing+aid+product+photo&image_size=square",
                "status": "on_sale",
                "category": "隐形式",
            },
            {
                "name": "斯达克 SoundLens Synergy（隐形式）",
                "description": "深耳道定制；加强风噪与啸叫控制；适合对外观要求较高的日常佩戴。",
                "price": 11800.0,
                "stock": 7,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=deep+canal+hearing+aid+product+photography+white+background&image_size=square",
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
            {
                "name": "峰力 Audéo Lumity L70-R（充电款）",
                "description": "充电式 RIC；支持手机蓝牙直连与应用调节；续航约一整天（随使用强度变化），适合通勤与社交场景。",
                "price": 13800.0,
                "stock": 11,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=rechargeable+hearing+aid+with+charging+case+product+photo&image_size=square",
                "status": "on_sale",
                "category": "充电款",
            },
            {
                "name": "奥迪康 More 1 miniRITE R（充电款）",
                "description": "充电式 miniRITE；多场景自动适配与言语增强；支持无线配件与远程调节（需配套服务）。",
                "price": 15800.0,
                "stock": 8,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=rechargeable+ric+hearing+aid+premium+product+photo+white+background&image_size=square",
                "status": "on_sale",
                "category": "充电款",
            },
            {
                "name": "西嘉 Pure Charge&Go 5AX（充电款）",
                "description": "充电式 RIC；语音与环境声分离处理；配充电盒更便携，适合经常外出的用户。",
                "price": 12800.0,
                "stock": 9,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=rechargeable+hearing+aid+charging+case+studio+photo&image_size=square",
                "status": "on_sale",
                "category": "充电款",
            },
            {
                "name": "瑞声达 OMNIA RIE 61（充电款）",
                "description": "充电式 RIE；支持蓝牙音频与通话；针对复杂噪声环境的清晰度优化，适合餐厅与聚会场景。",
                "price": 13280.0,
                "stock": 10,
                "image_url": "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=hearing+aid+with+case+product+photography+clean+background&image_size=square",
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

