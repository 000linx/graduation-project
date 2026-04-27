from bson import ObjectId


class _Cursor:
    def __init__(self, rows):
        self._rows = rows
        self._ops = []

    def sort(self, field, direction):
        self._ops.append(("sort", field, direction))
        return self

    def skip(self, n):
        self._ops.append(("skip", n))
        return self

    def limit(self, n):
        self._ops.append(("limit", n))
        return self

    def __iter__(self):
        return iter(self._rows)


def test_admin_order_dao_list_orders_builds_query_and_paging(monkeypatch):
    from app.admin_v2.daos import order_dao as mod

    uid = str(ObjectId())

    class _Orders:
        def count_documents(self, q):
            assert q["status"] == "paid"
            assert q["user_id"] == ObjectId(uid)
            return 10

        def find(self, q):
            return _Cursor([{"_id": "o1"}])

        def create_index(self, *_a, **_k):
            return None

    class _DB:
        orders = _Orders()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())

    items, total = mod.AdminOrderDao.list_orders(status="paid", user_id=uid, page=2, page_size=3, sort="created_at_asc")
    assert total == 10
    assert items[0]["_id"] == "o1"


def test_admin_order_dao_ensure_indexes_best_effort(monkeypatch):
    from app.admin_v2.daos import order_dao as mod

    class _Orders:
        def create_index(self, *_a, **_k):
            raise RuntimeError("x")

    class _DB:
        orders = _Orders()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())
    mod.AdminOrderDao.ensure_indexes()


def test_admin_user_dao_list_users_and_create_admin(monkeypatch):
    from app.admin_v2.daos import user_dao as mod

    inserted = {"doc": None}

    class _Users:
        def create_index(self, *_a, **_k):
            return None

        def find_one(self, q):
            return {"_id": q["_id"]}

        def update_one(self, *_a, **_k):
            return {"ok": 1}

        def count_documents(self, q):
            assert q["role"] == "admin"
            assert "$or" in q
            return 2

        def find(self, q, projection=None):
            assert projection == {"password_hash": 0}
            return _Cursor([{"_id": "u1"}, {"_id": "u2"}])

        def insert_one(self, doc):
            inserted["doc"] = doc

            class _Res:
                inserted_id = "newid"

            return _Res()

    class _DB:
        users = _Users()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())

    items, total = mod.AdminUserDao.list_users(q="abc", role="admin", page=1, page_size=10, sort="username_desc")
    assert total == 2
    assert len(items) == 2

    new_id = mod.AdminUserDao.create_admin_user("u", "p", "hash")
    assert new_id == "newid"
    assert inserted["doc"]["role"] == "admin"
    assert inserted["doc"]["rbac_version"] == 0


def test_admin_user_dao_ensure_indexes_best_effort(monkeypatch):
    from app.admin_v2.daos import user_dao as mod

    class _Users:
        def create_index(self, *_a, **_k):
            raise RuntimeError("x")

    class _DB:
        users = _Users()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())
    mod.AdminUserDao.ensure_indexes()

