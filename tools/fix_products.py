"""修复商品数据——直接插入10条商品到MongoDB（不删除现有数据）"""
import sys
import os
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from pymongo import MongoClient

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hearing_aid_mall')
DB_NAME = 'hearing_aid_mall'

BRAND_EN_MAP = {
    '峰力': 'phonak',
    '奥迪康': 'oticon',
    '瑞声达': 'resound',
    '西嘉': 'signia',
    '斯达克': 'starkey',
    '唯听': 'widex',
    '优利康': 'unitron',
    '西门子': 'siemens',
}

PRODUCTS = [
    {
        "name": "峰力 Audeo Paradise P90 智能助听器",
        "brand": "峰力",
        "category": "耳背式",
        "description": "峰力旗舰款智能助听器，搭载PRISM芯片，支持蓝牙直连iOS/Android，双耳12通道精细调节，自适应降噪技术，IP68防水防尘，续航最长24小时。",
        "price": 32800.00,
        "stock": 50,
        "status": "on_sale",
        "filename": "phonak_p90.jpg"
    },
    {
        "name": "奥迪康 Oticon More 1 智能助听器",
        "brand": "奥迪康",
        "category": "耳背式",
        "description": "奥迪康旗舰产品，搭载深度神经网络(DNN)技术，360度全景声音处理，支持无线充电，自动场景识别切换，超低延迟音频传输。",
        "price": 35800.00,
        "stock": 35,
        "status": "on_sale",
        "filename": "oticon_more.jpg"
    },
    {
        "name": "瑞声达 ReSound ONE 9 全向助听器",
        "brand": "瑞声达",
        "category": "耳内式",
        "description": "瑞声达M&RIE技术，麦克风置于耳道内实现自然收音，支持免提通话，可充电款，搭配Smart 3D APP个性化调节。",
        "price": 29800.00,
        "stock": 40,
        "status": "on_sale",
        "filename": "resound_one.jpg"
    },
    {
        "name": "西嘉 Signia Styletto X 纤薄助听器",
        "brand": "西嘉",
        "category": "充电款",
        "description": "西嘉时尚纤薄设计，搭载Xperience平台，动态声景处理技术，锂离子充电电池，便携充电盒，一次充电续航19小时。",
        "price": 26800.00,
        "stock": 60,
        "status": "on_sale",
        "filename": "signia_styletto.jpg"
    },
    {
        "name": "斯达克 Starkey Evolv AI 2400 智能助听器",
        "brand": "斯达克",
        "category": "耳背式",
        "description": "斯达克AI智能助听器，集成跌倒检测与活动追踪，支持语音转文字，Thrive APP健康监测，双向音频流传输。",
        "price": 26800.00,
        "stock": 45,
        "status": "on_sale",
        "filename": "starkey_evolv.jpg"
    },
    {
        "name": "唯听 Widex Moment 440 极速助听器",
        "brand": "唯听",
        "category": "隐形式",
        "description": "唯听ZeroDelay极速处理技术，声音延迟仅0.5ms，纯音输入自然无金属感，PureSound程序，支持手机APP微调。",
        "price": 32800.00,
        "stock": 25,
        "status": "on_sale",
        "filename": "widex_moment.jpg"
    },
    {
        "name": "优利康 Unitron Moxi Blu 蓝牙助听器",
        "brand": "优利康",
        "category": "充电款",
        "description": "优利康Moxi Blu系列，双耳直连蓝牙，免提通话，智能环境适应，锂电充电续航24小时，搭配Remote Plus APP。",
        "price": 18800.00,
        "stock": 55,
        "status": "on_sale",
        "filename": "unitron_moxi.jpg"
    },
    {
        "name": "奥迪康 Oticon Opn S 2 降噪助听器",
        "brand": "奥迪康",
        "category": "耳背式",
        "description": "奥迪康Opn S系列，开放声音体验，多说话者噪声环境轻松应对，TwinLink双无线技术，兼容电视适配器和遥控器。",
        "price": 16800.00,
        "stock": 70,
        "status": "on_sale",
        "filename": "oticon_opn.jpg"
    },
    {
        "name": "峰力 Virto Paradise P70 定制式助听器",
        "brand": "峰力",
        "category": "隐形式",
        "description": "峰力定制式深耳道助听器，完全隐形佩戴，基于3D耳道扫描定制，自适应降噪，蓝牙连接，适合轻度至中度听力损失。",
        "price": 21800.00,
        "stock": 30,
        "status": "on_sale",
        "filename": "phonak_virto.jpg"
    },
    {
        "name": "西门子 Lotus Pro 经济型助听器",
        "brand": "西门子",
        "category": "耳背式",
        "description": "西门子经典可靠款，4通道数字信号处理，智能反馈抑制，自适应方向性麦克风，操作简单，适合初次使用者，性价比之选。",
        "price": 3880.00,
        "stock": 100,
        "status": "on_sale",
        "filename": "siemens_lotus.jpg"
    }
]

def main():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    db = client[DB_NAME]

    before = db.products.count_documents({})
    print(f"当前商品数: {before}")

    now = datetime.now(timezone.utc)
    inserted = 0
    for p in PRODUCTS:
        filename = p.pop('filename', '')
        doc = {
            **p,
            "image_url": f"/static/products/{filename}",
            "created_at": now,
            "updated_at": now,
        }
        db.products.insert_one(doc)
        inserted += 1
        print(f"  ✓ {doc['name'][:40]}")

    after = db.products.count_documents({})
    print(f"\n插入: {inserted} 条")
    print(f"最终商品数: {after}")
    client.close()
    return 0

if __name__ == '__main__':
    sys.exit(main())
