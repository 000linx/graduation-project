from pymongo import MongoClient
from werkzeug.security import generate_password_hash

c = MongoClient('mongodb://localhost:27017')
db = c.hearing_aid_mall

total = db.users.count_documents({})
print(f'Total users: {total}')
for u in db.users.find():
    print(f'  {u.get("username","?"):12s} | phone={u.get("phone","?")} | role={u.get("role","user")}')
c.close()
