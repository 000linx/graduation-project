from bson import ObjectId


class _Res:
    def __init__(self, matched_count=0):
        self.matched_count = matched_count


def test_cart_add_item_updates_then_pushes_when_missing(monkeypatch):
    from app.models import cart_model as mod

    uid = str(ObjectId())
    pid = str(ObjectId())

    calls = {"update_one": []}

    class _CartColl:
        def update_one(self, q, u, upsert=False):
            calls["update_one"].append((q, u, upsert))
            if len(calls["update_one"]) == 1:
                return _Res(matched_count=0)
            return _Res(matched_count=1)

        def find_one(self, q):
            raise AssertionError("not used")

    class _DB:
        cart = _CartColl()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())

    assert mod.Cart.add_item(uid, pid, 2) is True
    assert len(calls["update_one"]) == 2
    q1, _u1, _ = calls["update_one"][0]
    assert q1["user_id"] == ObjectId(uid)


def test_cart_find_by_user_id_formats_items(monkeypatch):
    from app.models import cart_model as mod

    uid = str(ObjectId())
    pid = ObjectId()

    class _CartColl:
        def find_one(self, q):
            return {"_id": ObjectId(), "user_id": ObjectId(uid), "items": [{"product_id": pid, "quantity": 3}]}

    class _DB:
        cart = _CartColl()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())
    items = mod.Cart.find_by_user_id(uid)
    assert items[0]["quantity"] == 3
    assert str(items[0]["product_id"]) == str(pid)


def test_cart_find_by_user_id_returns_empty_when_missing(monkeypatch):
    from app.models import cart_model as mod

    class _CartColl:
        def find_one(self, q):
            return None

    class _DB:
        cart = _CartColl()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())
    assert mod.Cart.find_by_user_id(str(ObjectId())) == []


def test_cart_update_item_removes_when_quantity_zero(monkeypatch):
    from app.models import cart_model as mod

    uid = str(ObjectId())
    pid = str(ObjectId())

    called = {"rm": False}

    def _rm(_uid, _pid):
        called["rm"] = True
        return _Res(matched_count=1)

    monkeypatch.setattr(mod.Cart, "remove_item", staticmethod(_rm))
    mod.Cart.update_item(uid, pid, 0)
    assert called["rm"] is True


def test_cart_update_item_returns_false_when_not_found(monkeypatch):
    from app.models import cart_model as mod

    uid = str(ObjectId())
    pid = str(ObjectId())

    class _CartColl:
        def update_one(self, q, u):
            return _Res(matched_count=0)

    class _DB:
        cart = _CartColl()

    class _Mongo:
        db = _DB()

    monkeypatch.setattr(mod, "mongo", _Mongo())
    assert mod.Cart.update_item(uid, pid, 2) is False

