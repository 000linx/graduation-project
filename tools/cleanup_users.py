"""
用户数据清理脚本：保留10个用户，1超级管理员+9普通用户，密码统一123456
"""
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from datetime import datetime

c = MongoClient('mongodb://localhost:27017')
db = c.hearing_aid_mall

before = db.users.count_documents({})
print(f'操作前用户数: {before}')

# 1. 备份所有用户
db.users_backup.drop()
all_users = list(db.users.find())
if all_users:
    db.users_backup.insert_many(all_users)
    print(f'已备份 {len(all_users)} 条到 users_backup')

# 2. 删除所有用户
db.users.delete_many({})
print('已清空 users 集合')

# 3. 插入10个新用户
now = datetime.now()
pwd_hash = generate_password_hash('123456')

users = [
    {'username': 'admin', 'phone': '13800000001', 'role': 'super_admin', 'is_admin': True},
    {'username': 'user01', 'phone': '13800000002', 'role': 'user'},
    {'username': 'user02', 'phone': '13800000003', 'role': 'user'},
    {'username': 'user03', 'phone': '13800000004', 'role': 'user'},
    {'username': 'user04', 'phone': '13800000005', 'role': 'user'},
    {'username': 'user05', 'phone': '13800000006', 'role': 'user'},
    {'username': 'user06', 'phone': '13800000007', 'role': 'user'},
    {'username': 'user07', 'phone': '13800000008', 'role': 'user'},
    {'username': 'user08', 'phone': '13800000009', 'role': 'user'},
    {'username': 'user09', 'phone': '13800000010', 'role': 'user'},
]

for u in users:
    doc = {
        'username': u['username'],
        'phone': u['phone'],
        'password_hash': pwd_hash,
        'role': u['role'],
        'addresses': [],
        'hearing_profile': None,
        'notification_settings': {'email_notifications': True, 'in_app_notifications': True, 'activity_reminders': True},
        'created_at': now,
    }
    if u.get('is_admin'):
        doc['is_admin'] = True
    db.users.insert_one(doc)

# 4. 验证
after = db.users.count_documents({})
print(f'操作后用户数: {after}')
print(f'变化: {before} → {after}')

print('\n当前用户列表:')
for u in db.users.find():
    role = u.get('role', '?')
    print(f'  {u["username"]:10s} | {u["phone"]} | {role} | pwd=123456')

c.close()
print('\n完成!')
