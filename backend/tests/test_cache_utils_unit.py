def test_make_cache_key_stable_and_short():
    from app.utils.cache import make_cache_key

    k1 = make_cache_key("pfx", {"b": 2, "a": 1})
    k2 = make_cache_key("pfx", {"a": 1, "b": 2})
    assert k1 == k2
    assert k1.startswith("pfx:")
    assert len(k1) > len("pfx:")


def test_get_json_returns_none_without_redis(monkeypatch):
    import app.utils.cache as cache

    monkeypatch.setattr(cache.extensions, "redis_client", None)
    assert cache.get_json("k") is None


def test_get_json_decodes_bytes_and_parses(monkeypatch):
    import app.utils.cache as cache

    class _Redis:
        def get(self, _k):
            return b'{"a":1}'

    monkeypatch.setattr(cache.extensions, "redis_client", _Redis())
    assert cache.get_json("k") == {"a": 1}


def test_get_json_handles_invalid_json(monkeypatch):
    import app.utils.cache as cache

    class _Redis:
        def get(self, _k):
            return "not-json"

    monkeypatch.setattr(cache.extensions, "redis_client", _Redis())
    assert cache.get_json("k") is None


def test_set_json_returns_false_without_redis(monkeypatch):
    import app.utils.cache as cache

    monkeypatch.setattr(cache.extensions, "redis_client", None)
    assert cache.set_json("k", {"a": 1}, 10) is False


def test_set_json_writes_with_ttl_floor(monkeypatch):
    import app.utils.cache as cache

    called = {}

    class _Redis:
        def setex(self, key, ttl, value):
            called["key"] = key
            called["ttl"] = ttl
            called["value"] = value

    monkeypatch.setattr(cache.extensions, "redis_client", _Redis())
    assert cache.set_json("k", {"a": 1}, 0) is True
    assert called["key"] == "k"
    assert called["ttl"] == 1
    assert called["value"] == '{"a":1}'

