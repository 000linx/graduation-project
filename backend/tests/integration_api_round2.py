import json
import os
import random
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime


BASE_BACKEND = os.getenv("TEST_BACKEND_BASE", "http://127.0.0.1:5000")
BASE_FRONTEND = os.getenv("TEST_FRONTEND_BASE", "http://127.0.0.1:5173")
BOOTSTRAP_SECRET = os.getenv("ADMIN_BOOTSTRAP_SECRET", "dev-bootstrap-secret")


def now_iso():
    return datetime.now().isoformat(timespec="seconds")


def http_json(method, base, path, token=None, headers=None, body=None):
    url = base + path
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    if token:
        h["Authorization"] = f"Bearer {token}"

    data = None
    if body is not None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        return e.code, raw


def parse_json(raw):
    try:
        return json.loads(raw)
    except Exception:
        return None


def has_path(obj, path):
    cur = obj
    for p in path.split("."):
        if cur is None:
            return False
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return False
    return True


def assert_expected(case, status, payload):
    exp = case["expect"]
    ok = True
    reasons = []

    if status != exp["status"]:
        ok = False
        reasons.append(f"status expected {exp['status']} got {status}")

    if exp.get("envelope", True):
        if not isinstance(payload, dict):
            ok = False
            reasons.append("response is not json object")
        else:
            if payload.get("code") != exp.get("code", exp["status"]):
                ok = False
                reasons.append(f"code expected {exp.get('code', exp['status'])} got {payload.get('code')}")

            for p in exp.get("has", []):
                if not has_path(payload, p):
                    ok = False
                    reasons.append(f"missing field: {p}")

            for p in exp.get("absent", []):
                if has_path(payload, p):
                    ok = False
                    reasons.append(f"should not have field: {p}")

    return ok, reasons


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    out_dir = os.path.join(root, "test_artifacts")
    os.makedirs(out_dir, exist_ok=True)

    run_id = datetime.now().strftime("%Y%m%d-%H%M%S")
    result_path = os.path.join(out_dir, f"api-integration-round2-{run_id}.json")
    report_path = os.path.join(out_dir, f"api-integration-round2-{run_id}.md")

    ts = int(time.time())
    phone_user = "138" + str(ts)[-8:] + str(random.randint(0, 9))
    pass_user = "Pass123!"
    phone_admin = os.getenv("TEST_ADMIN_PHONE", "13900000000")
    pass_admin = os.getenv("TEST_ADMIN_PASSWORD", "Admin123!")

    ctx = {
        "admin_token": None,
        "user_token": None,
        "product_id": None,
        "order_id": None,
        "phone_user": phone_user,
        "pass_user": pass_user
    }

    cases = [
        {
            "id": "P-001",
            "name": "前端代理 /api/product/list",
            "req": {"method": "GET", "base": "frontend", "path": "/api/product/list"},
            "expect": {"status": 200, "envelope": True, "has": ["data.products"]}
        },
        {
            "id": "A-001",
            "name": "管理员 bootstrap（允许重复执行时返回 409）",
            "req": {
                "method": "POST",
                "base": "backend",
                "path": "/api/admin/bootstrap",
                "headers": {"X-Admin-Bootstrap-Secret": BOOTSTRAP_SECRET},
                "body": {"username": "admin", "phone": phone_admin, "password": pass_admin}
            },
            "expect": {"status": 201, "envelope": True, "has": ["data.user_id"], "code": 201},
            "allow_alt": [{"status": 409, "envelope": True, "code": 409}]
        },
        {
            "id": "A-002",
            "name": "管理员登录",
            "req": {"method": "POST", "base": "backend", "path": "/api/user/login", "body": {"phone": phone_admin, "password": pass_admin}},
            "expect": {"status": 200, "envelope": True, "has": ["data.tokens.access_token"]}
        },
        {
            "id": "A-003",
            "name": "管理员创建商品",
            "req": {
                "method": "POST",
                "base": "backend",
                "path": "/api/admin/products",
                "auth": "admin",
                "body": {"name": f"对接测试商品-{run_id}", "category": "耳背式", "price": 1999, "stock": 20, "description": "desc"}
            },
            "expect": {"status": 201, "envelope": True, "has": ["data.product_id"], "code": 201}
        },
        {
            "id": "U-001",
            "name": "用户注册（手机号）",
            "req": {"method": "POST", "base": "backend", "path": "/api/user/register", "body": {"username": f"u{run_id}", "phone": phone_user, "password": pass_user}},
            "expect": {"status": 201, "envelope": True, "has": ["data.user_id"], "code": 201}
        },
        {
            "id": "U-002",
            "name": "用户登录（手机号）",
            "req": {"method": "POST", "base": "backend", "path": "/api/user/login", "body": {"phone": phone_user, "password": pass_user}},
            "expect": {"status": 200, "envelope": True, "has": ["data.tokens.access_token"]}
        },
        {
            "id": "C-001",
            "name": "加入购物车（库存足够）",
            "req": {"method": "POST", "base": "backend", "path": "/api/cart/add", "auth": "user", "body": {"product_id": "${product_id}", "quantity": 2}},
            "expect": {"status": 200, "envelope": True}
        },
        {
            "id": "C-002",
            "name": "查看购物车",
            "req": {"method": "GET", "base": "backend", "path": "/api/cart/items", "auth": "user"},
            "expect": {"status": 200, "envelope": True, "has": ["data.items"]}
        },
        {
            "id": "O-001",
            "name": "创建订单（后端计算金额+扣库存+清购物车）",
            "req": {
                "method": "POST",
                "base": "backend",
                "path": "/api/order/create",
                "auth": "user",
                "body": {"shipping_address": "上海市xx路1号", "items": [{"product_id": "${product_id}", "quantity": 2}]}
            },
            "expect": {"status": 201, "envelope": True, "has": ["data.order_id", "data.total_amount"], "code": 201}
        },
        {
            "id": "O-002",
            "name": "订单列表（支持状态筛选）",
            "req": {"method": "GET", "base": "backend", "path": "/api/order/history?status=pending", "auth": "user"},
            "expect": {"status": 200, "envelope": True, "has": ["data.orders"]}
        },
        {
            "id": "O-003",
            "name": "订单详情（仅本人可见）",
            "req": {"method": "GET", "base": "backend", "path": "/api/order/${order_id}", "auth": "user"},
            "expect": {"status": 200, "envelope": True, "has": ["data._id", "data.items", "data.shipping_address"]}
        },
        {
            "id": "O-004",
            "name": "订单支付",
            "req": {"method": "POST", "base": "backend", "path": "/api/order/${order_id}/pay", "auth": "user", "body": {"payment_method": "wechat"}},
            "expect": {"status": 200, "envelope": True}
        },
        {
            "id": "O-005",
            "name": "提交取消申请",
            "req": {"method": "PUT", "base": "backend", "path": "/api/order/${order_id}/cancel", "auth": "user", "body": {"reason": "不想要了"}},
            "expect": {"status": 200, "envelope": True}
        },
        {
            "id": "A-004",
            "name": "管理员更新订单状态为 delivered",
            "req": {"method": "PUT", "base": "backend", "path": "/api/admin/orders/${order_id}/status", "auth": "admin", "body": {"status": "delivered"}},
            "expect": {"status": 200, "envelope": True}
        },
        {
            "id": "O-006",
            "name": "订单评价（delivered 后允许）",
            "req": {"method": "POST", "base": "backend", "path": "/api/order/${order_id}/review", "auth": "user", "body": {"rating": 5, "content": "很好"}},
            "expect": {"status": 200, "envelope": True}
        },
        {
            "id": "O-007",
            "name": "售后申请",
            "req": {"method": "POST", "base": "backend", "path": "/api/order/${order_id}/after_sale", "auth": "user", "body": {"type": "refund", "reason": "质量问题"}},
            "expect": {"status": 200, "envelope": True}
        },
        {
            "id": "A-005",
            "name": "管理员处理售后（approved）",
            "req": {"method": "PUT", "base": "backend", "path": "/api/admin/orders/${order_id}/after_sale", "auth": "admin", "body": {"status": "approved", "remark": "同意退款"}},
            "expect": {"status": 200, "envelope": True}
        }
    ]

    results = {
        "run_id": run_id,
        "started_at": now_iso(),
        "backend": BASE_BACKEND,
        "frontend": BASE_FRONTEND,
        "cases": []
    }

    def resolve_path(path):
        path = path.replace("${product_id}", str(ctx["product_id"] or ""))
        path = path.replace("${order_id}", str(ctx["order_id"] or ""))
        return path

    def resolve_body(body):
        if body is None:
            return None
        raw = json.dumps(body, ensure_ascii=False)
        raw = raw.replace("${product_id}", str(ctx["product_id"] or ""))
        raw = raw.replace("${order_id}", str(ctx["order_id"] or ""))
        return json.loads(raw)

    passed = 0
    failed = 0

    for case in cases:
        req_def = case["req"]
        base = BASE_BACKEND if req_def["base"] == "backend" else BASE_FRONTEND
        method = req_def["method"]
        path = resolve_path(req_def["path"])
        body = resolve_body(req_def.get("body"))
        headers = req_def.get("headers")

        token = None
        if req_def.get("auth") == "admin":
            token = ctx["admin_token"]
        elif req_def.get("auth") == "user":
            token = ctx["user_token"]

        status, raw = http_json(method, base, path, token=token, headers=headers, body=body)
        payload = parse_json(raw)

        ok, reasons = assert_expected(case, status, payload)
        if not ok and case.get("allow_alt"):
            for alt in case["allow_alt"]:
                alt_case = {"expect": alt}
                ok2, _ = assert_expected(alt_case, status, payload)
                if ok2:
                    ok = True
                    reasons = []
                    break

        results["cases"].append({
            "id": case["id"],
            "name": case["name"],
            "time": now_iso(),
            "request": {
                "method": method,
                "url": base + path,
                "headers": {"Authorization": "Bearer ***" if token else None, **(headers or {})},
                "body": body
            },
            "expected": case["expect"],
            "actual": {
                "status": status,
                "json": payload,
                "raw": raw if payload is None else None
            },
            "pass": ok,
            "reasons": reasons
        })

        if case["id"] == "A-002" and status == 200 and isinstance(payload, dict):
            ctx["admin_token"] = payload.get("data", {}).get("tokens", {}).get("access_token")
        if case["id"] == "A-003" and status in (200, 201) and isinstance(payload, dict):
            ctx["product_id"] = payload.get("data", {}).get("product_id")
        if case["id"] == "U-002" and status == 200 and isinstance(payload, dict):
            ctx["user_token"] = payload.get("data", {}).get("tokens", {}).get("access_token")
        if case["id"] == "O-001" and status in (200, 201) and isinstance(payload, dict):
            ctx["order_id"] = payload.get("data", {}).get("order_id")

        if ok:
            passed += 1
        else:
            failed += 1

    results["finished_at"] = now_iso()
    results["summary"] = {"passed": passed, "failed": failed, "total": len(cases)}
    results["context"] = {k: (v if k in ("phone_user", "pass_user") else ("***" if "token" in k else v)) for k, v in ctx.items()}

    with open(result_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    lines = []
    lines.append(f"# 前后端接口对接测试（二轮）报告\n")
    lines.append(f"- run_id: {run_id}")
    lines.append(f"- started_at: {results['started_at']}")
    lines.append(f"- finished_at: {results['finished_at']}")
    lines.append(f"- backend: {BASE_BACKEND}")
    lines.append(f"- frontend: {BASE_FRONTEND}\n")
    lines.append(f"## 汇总")
    lines.append(f"- total: {len(cases)}")
    lines.append(f"- passed: {passed}")
    lines.append(f"- failed: {failed}\n")
    lines.append("## 明细")
    for c in results["cases"]:
        status_text = "PASS" if c["pass"] else "FAIL"
        lines.append(f"- {c['id']} {c['name']}：{status_text} (HTTP {c['actual']['status']})")
        if not c["pass"]:
            for r in c["reasons"]:
                lines.append(f"  - {r}")
    lines.append("\n## 产物")
    lines.append(f"- 结果 JSON：{os.path.relpath(result_path, root)}")
    lines.append(f"- 报告 MD：{os.path.relpath(report_path, root)}")

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(json.dumps({"passed": passed, "failed": failed, "result": result_path, "report": report_path}, ensure_ascii=False))
    if failed:
        raise SystemExit(2)


if __name__ == "__main__":
    main()

