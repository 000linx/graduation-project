"""
商品数据清理脚本
职责：
1. 备份现有所有商品数据到 JSON 文件
2. 删除所有商品记录
3. 插入 10 条符合要求的助听器商品数据
4. 验证数据完整性（图片可访问、品牌白名单、价格区间）
5. 生成操作日志

Author: Agent
Created: 2026-05-09
"""
import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from pymongo import MongoClient
from bson import ObjectId

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hearing_aid_mall')
DB_NAME = 'hearing_aid_mall'
BACKUP_DIR = os.path.join(os.path.dirname(__file__), '..', 'tools', 'backups')
LOG_PATH = os.path.join(os.path.dirname(__file__), '..', 'tools', 'cleanup_log.txt')

BRAND_WHITELIST = {
    '峰力', '奥迪康', '瑞声达', '西嘉', '斯达克',
    '唯听', '优利康', '贝尔通', '西门子', '力斯顿',
    '欧仕达', '新声', '丽声', '万聆', '爱可声'
}

CATEGORIES = ['耳背式', '耳内式', '隐形式', '充电款']

NEW_PRODUCTS = [
    {
        "name": "峰力 Audeo Paradise P90 智能助听器",
        "brand": "峰力",
        "category": "耳背式",
        "description": "峰力旗舰款智能助听器，搭载PRISM芯片，支持蓝牙直连iOS/Android，双耳12通道精细调节，自适应降噪技术，IP68防水防尘，续航最长24小时。",
        "price": 32800.00,
        "stock": 50,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/phonak-p90/800/800"
    },
    {
        "name": "奥迪康 Oticon More 1 智能助听器",
        "brand": "奥迪康",
        "category": "耳背式",
        "description": "奥迪康旗舰产品，搭载深度神经网络(DNN)技术，360度全景声音处理，支持无线充电，自动场景识别切换，超低延迟音频传输。",
        "price": 35800.00,
        "stock": 35,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/oticon-more/800/800"
    },
    {
        "name": "瑞声达 ReSound ONE 9 全向助听器",
        "brand": "瑞声达",
        "category": "耳内式",
        "description": "瑞声达M&RIE技术，麦克风置于耳道内实现自然收音，支持免提通话，可充电款，搭配Smart 3D APP个性化调节。",
        "price": 29800.00,
        "stock": 40,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/resound-one/800/800"
    },
    {
        "name": "西嘉 Signia Styletto X 纤薄助听器",
        "brand": "西嘉",
        "category": "充电款",
        "description": "西嘉时尚纤薄设计，搭载Xperience平台，动态声景处理技术，锂离子充电电池，便携充电盒，一次充电续航19小时。",
        "price": 26800.00,
        "stock": 60,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/signia-styletto/800/800"
    },
    {
        "name": "斯达克 Starkey Evolv AI 2400 智能助听器",
        "brand": "斯达克",
        "category": "耳背式",
        "description": "斯达克AI智能助听器，集成跌倒检测与活动追踪，支持语音转文字，Thrive APP健康监测，双向音频流传输。",
        "price": 26800.00,
        "stock": 45,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/starkey-evolv/800/800"
    },
    {
        "name": "唯听 Widex Moment 440 极速助听器",
        "brand": "唯听",
        "category": "隐形式",
        "description": "唯听ZeroDelay极速处理技术，声音延迟仅0.5ms，纯音输入自然无金属感，PureSound程序，支持手机APP微调。",
        "price": 32800.00,
        "stock": 25,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/widex-moment/800/800"
    },
    {
        "name": "优利康 Unitron Moxi Blu 蓝牙助听器",
        "brand": "优利康",
        "category": "充电款",
        "description": "优利康Moxi Blu系列，双耳直连蓝牙，免提通话，智能环境适应，锂电充电续航24小时，搭配Remote Plus APP。",
        "price": 18800.00,
        "stock": 55,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/unitron-moxi/800/800"
    },
    {
        "name": "奥迪康 Oticon Opn S 2 降噪助听器",
        "brand": "奥迪康",
        "category": "耳背式",
        "description": "奥迪康Opn S系列，开放声音体验，多说话者噪声环境轻松应对，TwinLink双无线技术，兼容电视适配器和遥控器。",
        "price": 16800.00,
        "stock": 70,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/oticon-opn/800/800"
    },
    {
        "name": "峰力 Virto Paradise P70 定制式助听器",
        "brand": "峰力",
        "category": "隐形式",
        "description": "峰力定制式深耳道助听器，完全隐形佩戴，基于3D耳道扫描定制，自适应降噪，蓝牙连接，适合轻度至中度听力损失。",
        "price": 21800.00,
        "stock": 30,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/phonak-virto/800/800"
    },
    {
        "name": "西门子 Lotus Pro 经济型助听器",
        "brand": "西门子",
        "category": "耳背式",
        "description": "西门子经典可靠款，4通道数字信号处理，智能反馈抑制，自适应方向性麦克风，操作简单，适合初次使用者，性价比之选。",
        "price": 3880.00,
        "stock": 100,
        "status": "on_sale",
        "image_url": "https://picsum.photos/seed/siemens-lotus/800/800"
    }
]


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


def connect_mongo():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    db = client[DB_NAME]
    return client, db


def main():
    log_lines = []
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    log_lines.append(f"========== 数据库清理操作日志 ==========")
    log_lines.append(f"操作时间: {now_str}")
    log_lines.append(f"数据库: {MONGO_URI}")
    log_lines.append("")

    # --- 连接 ---
    client, db = connect_mongo()
    log_lines.append("[INFO] MongoDB 连接成功")
    print("[INFO] MongoDB 连接成功")

    # --- 备份 ---
    before_count = db.products.count_documents({})
    log_lines.append(f"[备份] 操作前商品总数: {before_count}")
    print(f"[备份] 操作前商品总数: {before_count}")

    os.makedirs(BACKUP_DIR, exist_ok=True)
    backup_path = os.path.join(BACKUP_DIR, f'products_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')

    all_products = list(db.products.find())
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(all_products, f, cls=DateTimeEncoder, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(backup_path)
    log_lines.append(f"[备份] 备份文件: {backup_path}")
    log_lines.append(f"[备份] 备份记录数: {len(all_products)}")
    log_lines.append(f"[备份] 文件大小: {file_size} bytes")
    log_lines.append("")
    print(f"[备份] 已备份 {len(all_products)} 条记录到 {backup_path} ({file_size} bytes)")

    # --- 删除所有 ---
    if before_count > 0:
        result = db.products.delete_many({})
        log_lines.append(f"[删除] 已删除 {result.deleted_count} 条记录")
        print(f"[删除] 已删除 {result.deleted_count} 条记录")
    else:
        log_lines.append("[删除] 无记录需要删除")

    after_delete = db.products.count_documents({})
    log_lines.append(f"[删除] 删除后商品总数: {after_delete}")
    print(f"[删除] 删除后商品总数: {after_delete}")
    log_lines.append("")

    # --- 插入新数据 ---
    now = datetime.now(timezone.utc)
    products_to_insert = []
    for i, p in enumerate(NEW_PRODUCTS):
        if p.get("brand") not in BRAND_WHITELIST:
            log_lines.append(f"[警告] 品牌不在白名单: {p.get('brand')} (产品: {p.get('name')})")
        doc = {
            **p,
            "created_at": now,
            "updated_at": now,
        }
        products_to_insert.append(doc)

    if products_to_insert:
        result = db.products.insert_many(products_to_insert)
        log_lines.append(f"[插入] 已插入 {len(result.inserted_ids)} 条新记录")
        print(f"[插入] 已插入 {len(result.inserted_ids)} 条新记录")

    after_count = db.products.count_documents({})
    log_lines.append(f"[插入] 插入后商品总数: {after_count}")
    log_lines.append("")
    print(f"[插入] 插入后商品总数: {after_count}")

    # --- 验证 ---
    log_lines.append("========== 验证阶段 ==========")
    print("\n========== 验证阶段 ==========")

    # 验证1: 数据总量
    check_count = after_count == 10
    log_lines.append(f"[验证1-数量] 商品总数: {after_count} {'✓ 通过' if check_count else '✗ 失败 - 期望10条'}")
    print(f"[验证1-数量] 商品总数: {after_count} {'✓ 通过' if check_count else '✗ 失败'}")

    # 验证2: 图片链接可访问
    log_lines.append("[验证2-图片] 检测图片URL可访问性...")
    print("[验证2-图片] 检测图片URL可访问性...")
    all_images_ok = True
    products = list(db.products.find())
    for p in products:
        url = p.get('image_url', '')
        name = p.get('name', '?')
        try:
            req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            resp = urlopen(req, timeout=15)
            status = resp.status
            if status == 200:
                log_lines.append(f"  ✓ {name[:30]:30s} | {url[:60]} | HTTP {status}")
                print(f"  ✓ {name[:30]:30s} | HTTP {status}")
            else:
                log_lines.append(f"  ✗ {name[:30]:30s} | {url[:60]} | HTTP {status}")
                print(f"  ✗ {name[:30]:30s} | HTTP {status}")
                all_images_ok = False
        except HTTPError as e:
            log_lines.append(f"  ✗ {name[:30]:30s} | {url[:60]} | HTTP {e.code}")
            print(f"  ✗ {name[:30]:30s} | HTTP {e.code}")
            all_images_ok = False
        except URLError as e:
            log_lines.append(f"  ✗ {name[:30]:30s} | {url[:60]} | {e.reason}")
            print(f"  ✗ {name[:30]:30s} | {e.reason}")
            all_images_ok = False

    log_lines.append(f"[验证2-图片] 结果: {'✓ 全部通过' if all_images_ok else '✗ 存在不可访问的图片'}")
    print(f"[验证2-图片] 结果: {'✓ 全部通过' if all_images_ok else '✗ 存在不可访问的图片'}")

    # 验证3: 品牌白名单
    log_lines.append("[验证3-品牌] 品牌白名单校验...")
    print("[验证3-品牌] 品牌白名单校验...")
    all_brands_ok = True
    for p in products:
        brand = p.get('brand', '')
        name = p.get('name', '?')
        if brand in BRAND_WHITELIST:
            log_lines.append(f"  ✓ {name[:30]:30s} | 品牌: {brand}")
        else:
            log_lines.append(f"  ✗ {name[:30]:30s} | 品牌: {brand} - 不在白名单")
            print(f"  ✗ {name}: 品牌 {brand} 不在白名单")
            all_brands_ok = False

    log_lines.append(f"[验证3-品牌] 结果: {'✓ 全部通过' if all_brands_ok else '✗ 存在无效品牌'}")
    print(f"[验证3-品牌] 结果: {'✓ 全部通过' if all_brands_ok else '✗ 存在无效品牌'}")

    # 验证4: 价格区间
    log_lines.append("[验证4-价格] 价格区间校验 (1000-50000元)...")
    print("[验证4-价格] 价格区间校验...")
    all_prices_ok = True
    for p in products:
        price = p.get('price', 0)
        name = p.get('name', '?')
        try:
            price_float = float(price)
            if 1000 <= price_float <= 50000:
                log_lines.append(f"  ✓ {name[:30]:30s} | ¥{price_float:,.2f}")
            else:
                log_lines.append(f"  ✗ {name[:30]:30s} | ¥{price_float:,.2f} - 价格超出范围")
                print(f"  ✗ {name}: ¥{price_float:,.2f} 超出范围")
                all_prices_ok = False
        except (TypeError, ValueError):
            log_lines.append(f"  ✗ {name[:30]:30s} | 价格: {price} - 不是有效数字")
            print(f"  ✗ {name}: 价格 {price} 不是有效数字")
            all_prices_ok = False

    log_lines.append(f"[验证4-价格] 结果: {'✓ 全部通过' if all_prices_ok else '✗ 存在无效价格'}")
    print(f"[验证4-价格] 结果: {'✓ 全部通过' if all_prices_ok else '✗ 存在无效价格'}")

    # --- 摘要 ---
    log_lines.append("")
    log_lines.append("========== 操作摘要 ==========")
    log_lines.append(f"操作前数据量: {before_count}")
    log_lines.append(f"操作后数据量: {after_count}")
    log_lines.append(f"变化: {before_count} -> {after_count} (净变化: {after_count - before_count})")
    log_lines.append(f"备份文件: {backup_path}")
    log_lines.append(f"验证结果: 数量={'✓' if check_count else '✗'} | 图片={'✓' if all_images_ok else '✗'} | 品牌={'✓' if all_brands_ok else '✗'} | 价格={'✓' if all_prices_ok else '✗'}")
    all_pass = check_count and all_images_ok and all_brands_ok and all_prices_ok
    log_lines.append(f"总体状态: {'✓ 全部验证通过' if all_pass else '✗ 存在未通过的验证项'}")
    log_lines.append("==================================")
    log_lines.append("")

    # --- 写日志 ---
    log_content = '\n'.join(log_lines)
    with open(LOG_PATH, 'w', encoding='utf-8') as f:
        f.write(log_content)

    print(f"\n[日志] 操作日志已写入: {LOG_PATH}")
    print(f"[摘要] 总体状态: {'✓ 全部验证通过' if all_pass else '✗ 存在未通过的验证项'}")

    client.close()
    return 0 if all_pass else 1

if __name__ == '__main__':
    sys.exit(main())
