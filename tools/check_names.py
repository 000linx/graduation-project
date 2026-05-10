from pymongo import MongoClient
c=MongoClient('mongodb://localhost:27017')
db=c.hearing_aid_mall
for p in db.products.find():
    n=p.get('name','?')
    b=p.get('brand','?')
    u=p.get('image_url','?')
    print(f"REPR: {repr(n)}")
    print(f"  品牌: {b}")
    print(f"  图片: {u}")
    print()
