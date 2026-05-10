"""
商品图片统一命名与存放脚本
1. 从数据库读取10个商品的品牌和当前图片URL
2. 下载当前占位图片到 backend/static/products/ 目录
3. 按统一命名规则重命名: {brand}_{short_keyword}.jpg
4. 更新数据库 image_url 为本地静态路径
5. 确保 Flask 静态资源路由可正确访问
"""
import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from pymongo import MongoClient
from bson import ObjectId

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/hearing_aid_mall')
DB_NAME = 'hearing_aid_mall'
BACKEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'backend')
STATIC_DIR = os.path.join(BACKEND_DIR, 'static', 'products')
LOG_PATH = os.path.join(os.path.dirname(__file__), 'image_sync_log.txt')

BRAND_EN_MAP = {
    '峰力': 'phonak',
    '奥迪康': 'oticon',
    '瑞声达': 'resound',
    '西嘉': 'signia',
    '斯达克': 'starkey',
    '唯听': 'widex',
    '优利康': 'unitron',
    '西门子': 'siemens',
    '贝尔通': 'beltone',
    '力斯顿': 'liston',
}


def make_filename(product):
    brand = product.get('brand', '')
    name = product.get('name', '')
    image_url = product.get('image_url', '')

    eng_brand = BRAND_EN_MAP.get(brand, brand.lower())

    # 从图片URL中提取 seed 作为关键词
    keyword = ''
    if '/seed/' in image_url:
        seed = image_url.split('/seed/')[1].split('/')[0]
        # 去掉品牌前缀后作为关键词
        parts = seed.split('-')
        # 跳过可能匹配品牌名的前缀
        brand_lower = eng_brand.lower()
        if parts[0] == brand_lower:
            keyword = '-'.join(parts[1:])
        else:
            keyword = seed

    if not keyword:
        import re
        keyword = re.sub(r'[^a-zA-Z0-9_-]', '', name.split()[-1].lower()) if name else 'product'

    filename = f"{eng_brand}_{keyword}.jpg"
    return filename, eng_brand

def main():
    log_lines = []
    now_str = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    log_lines.append(f"========== 商品图片统一处理日志 ==========")
    log_lines.append(f"操作时间: {now_str}")
    log_lines.append(f"静态资源目录: {STATIC_DIR}")
    log_lines.append("")

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    client.admin.command('ping')
    db = client[DB_NAME]
    log_lines.append("[INFO] MongoDB 连接成功")
    print("[INFO] MongoDB 连接成功")

    os.makedirs(STATIC_DIR, exist_ok=True)
    log_lines.append(f"[INFO] 静态目录已就绪: {STATIC_DIR}")
    print(f"[INFO] 静态目录已就绪: {STATIC_DIR}")

    products = list(db.products.find().sort('price', 1))
    log_lines.append(f"[INFO] 数据库商品总数: {len(products)}")
    print(f"[INFO] 数据库商品总数: {len(products)}")

    log_lines.append("")
    log_lines.append("========== 下载与命名 ==========")
    print("\n========== 下载与命名 ==========")

    updated = 0
    for p in products:
        name = p.get('name', '')
        brand = p.get('brand', '')
        old_url = p.get('image_url', '')
        pid = str(p['_id'])

        filename, eng_brand = make_filename(p)
        dest_path = os.path.join(STATIC_DIR, filename)
        new_url = f"/static/products/{filename}"

        log_lines.append(f"  商品: {name}")
        log_lines.append(f"  品牌: {brand} | 英文标识: {eng_brand}")
        log_lines.append(f"  旧URL: {old_url}")
        log_lines.append(f"  新文件名: {filename}")
        print(f"  {name}")
        print(f"    英文标识: {eng_brand} → {filename}")

        try:
            req = Request(old_url, headers={'User-Agent': 'Mozilla/5.0'})
            resp = urlopen(req, timeout=30)
            img_data = resp.read()
            with open(dest_path, 'wb') as f:
                f.write(img_data)
            size_kb = len(img_data) / 1024
            log_lines.append(f"  下载成功: {size_kb:.1f} KB → {dest_path}")
            print(f"    下载成功: {size_kb:.1f} KB")

            db.products.update_one(
                {'_id': p['_id']},
                {'$set': {
                    'image_url': new_url,
                    'updated_at': datetime.now(timezone.utc),
                }}
            )
            log_lines.append(f"  数据库已更新: image_url → {new_url}")
            print(f"    数据库已更新: {new_url}")
            updated += 1

        except URLError as e:
            log_lines.append(f"  [失败] 下载错误: {e.reason}")
            print(f"    [失败] 下载错误: {e.reason}")

        log_lines.append("")

    log_lines.append(f"[结果] 成功更新: {updated}/{len(products)}")
    print(f"\n[结果] 成功更新: {updated}/{len(products)}")

    log_lines.append("")
    log_lines.append("========== 数据库验证 ==========")
    print("========== 数据库验证 ==========")
    for p in db.products.find().sort('price', 1):
        url = p.get('image_url', '?')
        status = '✓ 本地' if url.startswith('/static/') else '✗ 远程'
        log_lines.append(f"  {status} | {p['brand']:6s} | {url}")
        print(f"  {status} | {p['brand']:6s} | {url}")

    log_lines.append("")
    log_lines.append("========== 文件系统验证 ==========")
    print("========== 文件系统验证 ==========")
    all_exist = True
    for fname in os.listdir(STATIC_DIR):
        fpath = os.path.join(STATIC_DIR, fname)
        size = os.path.getsize(fpath)
        log_lines.append(f"  {'✓' if size > 0 else '✗'} {fname} ({size} bytes)")
        print(f"  {'✓' if size > 0 else '✗'} {fname} ({size} bytes)")
        if size == 0:
            all_exist = False

    file_count = len(os.listdir(STATIC_DIR))
    log_lines.append(f"[文件] 静态目录文件数: {file_count}")
    log_lines.append(f"[文件] 完整性: {'✓ 全部存在' if all_exist else '✗ 存在空文件'}")
    print(f"[文件] 静态目录文件数: {file_count}")
    print(f"[文件] 完整性: {'✓ 全部存在' if all_exist else '✗ 存在空文件'}")

    log_lines.append("")
    log_lines.append("========== 操作摘要 ==========")
    log_lines.append(f"处理商品数: {len(products)}")
    log_lines.append(f"成功更新: {updated}")
    log_lines.append(f"静态目录: {STATIC_DIR}")
    log_lines.append(f"文件数量: {file_count}")
    log_lines.append(f"访问路径: http://localhost:5000/static/products/<filename>")
    log_lines.append("==================================")

    log_content = '\n'.join(log_lines)
    with open(LOG_PATH, 'w', encoding='utf-8') as f:
        f.write(log_content)
    print(f"\n[日志] 已写入: {LOG_PATH}")

    client.close()
    return 0 if (updated == len(products) and all_exist) else 1


if __name__ == '__main__':
    sys.exit(main())
