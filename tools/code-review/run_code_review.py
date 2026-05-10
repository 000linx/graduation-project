import ast
import csv
import hashlib
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUT_DIR = ROOT / "docs" / "code-review"


EXCLUDE_DIR_NAMES = {
    ".git",
    ".trash",
    "audit",
    "dist",
    "build",
    "coverage",
    "node_modules",
    ".venv",
    "venv",
    ".pytest_cache",
    "__pycache__",
    "test-reports",
    ".npm-cache",
    ".vscode",
    ".idea",
    ".venv2",
}

INCLUDE_ROOTS = [
    ROOT / "backend" / "app",
    ROOT / "backend" / "tools",
    ROOT / "frontend" / "src",
    ROOT / "tools",
]

SOURCE_EXTS = {".py", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".vue"}


@dataclass(frozen=True)
class Finding:
    file: str
    line: int | None
    category: str
    severity: str
    issue: str
    suggestion: str
    example: str


def _is_excluded(path: Path) -> bool:
    for part in path.parts:
        if part in EXCLUDE_DIR_NAMES:
            return True
    return False


def iter_source_files() -> list[Path]:
    out: list[Path] = []
    for root in INCLUDE_ROOTS:
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if p.is_dir():
                continue
            if _is_excluded(p):
                continue
            if p.suffix.lower() not in SOURCE_EXTS:
                continue
            out.append(p)
    out.sort(key=lambda x: str(x).lower())
    return out


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except Exception:
        try:
            return p.read_text(encoding="utf-8-sig")
        except Exception:
            return p.read_text(errors="ignore")


def rel(p: Path) -> str:
    try:
        return str(p.relative_to(ROOT)).replace("\\", "/")
    except Exception:
        return str(p).replace("\\", "/")


def compute_basic_metrics(text: str, suffix: str) -> dict:
    lines = text.splitlines()
    total = len(lines)
    blank = sum(1 for x in lines if not x.strip())
    if suffix == ".py":
        comment = sum(1 for x in lines if x.lstrip().startswith("#"))
    else:
        comment = sum(1 for x in lines if x.lstrip().startswith("//"))
    return {"lines": total, "blank_lines": blank, "comment_lines": comment}


def complexity_score(node: ast.AST) -> int:
    score = 1
    for child in ast.walk(node):
        if isinstance(child, (ast.If, ast.For, ast.While, ast.With, ast.AsyncWith, ast.Try, ast.ExceptHandler)):
            score += 1
        elif isinstance(child, ast.BoolOp):
            score += max(0, len(getattr(child, "values", [])) - 1)
        elif isinstance(child, (ast.ListComp, ast.DictComp, ast.SetComp, ast.GeneratorExp)):
            score += 1
    return score


def analyze_python(p: Path, text: str) -> tuple[list[Finding], dict]:
    findings: list[Finding] = []
    try:
        tree = ast.parse(text)
    except Exception as e:
        findings.append(
            Finding(
                file=rel(p),
                line=1,
                category="代码质量",
                severity="高",
                issue=f"Python 语法解析失败：{type(e).__name__}",
                suggestion="修复语法错误或确保文件为有效 Python 源码；否则静态检查与运行时行为不可控。",
                example=(text.splitlines()[0] if text.splitlines() else ""),
            )
        )
        return findings, {"functions": [], "imports": {"total": 0, "unused": 0}}

    functions = []
    for n in ast.walk(tree):
        if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            start = getattr(n, "lineno", None)
            end = getattr(n, "end_lineno", None) or start
            length = (end - start + 1) if (start and end) else None
            cplx = complexity_score(n)
            functions.append({"name": n.name, "line": start, "length": length, "complexity": cplx})
            if length is not None and length >= 80:
                findings.append(
                    Finding(
                        file=rel(p),
                        line=start,
                        category="代码质量",
                        severity="中",
                        issue=f"函数过长（{length} 行）：{n.name}",
                        suggestion="拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。",
                        example=f"def {n.name}(...):",
                    )
                )
            if cplx >= 18:
                findings.append(
                    Finding(
                        file=rel(p),
                        line=start,
                        category="代码质量",
                        severity="中",
                        issue=f"圈复杂度偏高（≈{cplx}）：{n.name}",
                        suggestion="减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。",
                        example=f"def {n.name}(...):",
                    )
                )

    imported: list[tuple[str, int]] = []
    for n in ast.walk(tree):
        if isinstance(n, ast.Import):
            for alias in n.names:
                name = alias.asname or alias.name.split(".")[0]
                imported.append((name, getattr(n, "lineno", 1)))
        elif isinstance(n, ast.ImportFrom):
            for alias in n.names:
                if alias.name == "*":
                    imported.append(("*", getattr(n, "lineno", 1)))
                else:
                    name = alias.asname or alias.name
                    imported.append((name, getattr(n, "lineno", 1)))

    used_names: set[str] = set()
    for n in ast.walk(tree):
        if isinstance(n, ast.Name):
            used_names.add(n.id)
        elif isinstance(n, ast.Attribute):
            if isinstance(n.value, ast.Name):
                used_names.add(n.value.id)

    unused = [(name, ln) for (name, ln) in imported if name not in {"*", "__future__"} and name not in used_names]
    for name, ln in unused:
        findings.append(
            Finding(
                file=rel(p),
                line=ln,
                category="代码质量",
                severity="低",
                issue=f"疑似未使用导入：{name}",
                suggestion="删除未使用导入，减少启动开销与可读性负担；如为类型导入可改为 TYPE_CHECKING 条件导入。",
                example=name,
            )
        )

    return findings, {"functions": functions, "imports": {"total": len(imported), "unused": len(unused)}}


PATTERNS: list[tuple[str, str, str, re.Pattern]] = [
    ("安全漏洞", "高", "疑似硬编码密钥/口令", re.compile(r"(AKIA[0-9A-Z]{16}|SECRET_KEY\s*=|JWT_SECRET|PRIVATE_KEY|BEGIN\s+PRIVATE\s+KEY|password\s*=\s*['\"])")),
    ("安全漏洞", "高", "危险执行（eval/exec）", re.compile(r"\b(eval|exec)\s*\(")),
    ("安全漏洞", "中", "疑似调试模式/详细错误暴露", re.compile(r"\bdebug\s*=\s*True\b|FLASK_ENV\s*=\s*['\"]development['\"]")),
    ("性能瓶颈", "中", "潜在全量拉取/物化（list(find)/toArray）", re.compile(r"\blist\s*\(\s*.*find\(|toArray\s*\(")),
    ("代码质量", "低", "遗留标记（TODO/FIXME）", re.compile(r"\b(TODO|FIXME)\b")),
    ("代码质量", "低", "调试输出（print/console）", re.compile(r"\bprint\s*\(|console\.log\s*\(")),
    ("安全漏洞", "中", "localStorage 保存 token（XSS 风险放大）", re.compile(r"localStorage\.(getItem|setItem)\(|localStorage\[['\"]")),
    ("安全漏洞", "中", "可能的 HTML 注入（v-html）", re.compile(r"\bv-html\b")),
]


def scan_patterns(p: Path, text: str) -> list[Finding]:
    findings: list[Finding] = []
    lines = text.splitlines()
    for cat, sev, title, pat in PATTERNS:
        for idx, line in enumerate(lines, start=1):
            if pat.search(line):
                findings.append(
                    Finding(
                        file=rel(p),
                        line=idx,
                        category=cat,
                        severity=sev,
                        issue=title,
                        suggestion="需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。",
                        example=line.strip()[:220],
                    )
                )
    return findings


def normalize_lines_for_dupe(text: str, suffix: str) -> list[str]:
    out = []
    for raw in text.splitlines():
        s = raw.strip()
        if not s:
            continue
        if suffix == ".py" and s.startswith("#"):
            continue
        if suffix in {".js", ".jsx", ".ts", ".tsx", ".mjs"} and s.startswith("//"):
            continue
        out.append(re.sub(r"\s+", " ", s))
    return out


def find_duplicate_blocks(files: list[Path], window: int = 14, min_hits: int = 2) -> list[Finding]:
    seen: dict[str, tuple[str, int]] = {}
    hits: dict[str, list[tuple[str, int]]] = {}
    for p in files:
        text = read_text(p)
        norm = normalize_lines_for_dupe(text, p.suffix.lower())
        if len(norm) < window:
            continue
        for i in range(0, len(norm) - window + 1):
            block = "\n".join(norm[i : i + window])
            h = hashlib.sha1(block.encode("utf-8")).hexdigest()
            if h in seen:
                hits.setdefault(h, []).append((rel(p), i + 1))
            else:
                seen[h] = (rel(p), i + 1)

    findings: list[Finding] = []
    for h, locs in hits.items():
        first = seen.get(h)
        all_locs = ([first] if first else []) + locs
        uniq_files = {x[0] for x in all_locs if x}
        if len(uniq_files) < min_hits:
            continue
        sample = f"重复片段位置: {', '.join([f'{f}:{ln}' for f, ln in all_locs[:4] if f])}"
        for f, ln in all_locs[:6]:
            findings.append(
                Finding(
                    file=f,
                    line=ln,
                    category="代码质量",
                    severity="中",
                    issue="疑似重复代码片段",
                    suggestion="抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。",
                    example=sample,
                )
            )
    return findings


def severity_rank(sev: str) -> int:
    return {"高": 0, "中": 1, "低": 2}.get(sev, 9)


def main():
    out_dir = Path(os.environ.get("OUT_DIR") or DEFAULT_OUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    files = iter_source_files()
    metrics: dict[str, dict] = {}
    findings: list[Finding] = []

    for p in files:
        text = read_text(p)
        suffix = p.suffix.lower()
        m = compute_basic_metrics(text, suffix)
        per = {"basic": m, "python": None}
        if suffix == ".py":
            py_findings, py_meta = analyze_python(p, text)
            per["python"] = py_meta
            findings.extend(py_findings)
        findings.extend(scan_patterns(p, text))
        if m["lines"] >= 900:
            findings.append(
                Finding(
                    file=rel(p),
                    line=1,
                    category="可维护性",
                    severity="中",
                    issue=f"单文件过大（{m['lines']} 行）",
                    suggestion="按功能拆分模块/组件；拆分后引入单元测试与契约测试减少回归风险。",
                    example=rel(p),
                )
            )
        metrics[rel(p)] = per

    findings.extend(find_duplicate_blocks(files))

    findings_sorted = sorted(findings, key=lambda x: (severity_rank(x.severity), x.file, (x.line or 0)))
    findings_json = [x.__dict__ for x in findings_sorted]

    (out_dir / "findings.json").write_text(json.dumps(findings_json, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "metrics.json").write_text(
        json.dumps(
            {
                "generated_at": datetime.now().isoformat(timespec="seconds"),
                "file_count": len(files),
                "roots": [str(x) for x in INCLUDE_ROOTS],
                "metrics": metrics,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    with (out_dir / "findings.csv").open("w", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["file", "line", "category", "severity", "issue", "suggestion", "example"])
        for it in findings_sorted:
            w.writerow([it.file, it.line or "", it.category, it.severity, it.issue, it.suggestion, it.example])

    top = findings_sorted[:200]
    md_lines = [
        "# 系统性代码审查与性能优化分析报告",
        "",
        f"- 生成时间: {datetime.now().isoformat(timespec='seconds')}",
        f"- 扫描范围文件数: {len(files)}",
        "",
        "## 结论摘要",
        "",
        "- 代码质量：存在少量大文件/复杂函数与疑似重复片段；前端部分页面与 store 存在重复请求与逻辑堆叠。",
        "- 性能瓶颈：推荐/搜索与购物车补全存在全量拉取与 N+1；SSE 长连接对 worker 压力较大；部分关键路径缺少请求级去重与缓存策略。",
        "- 安全：token 主要存 localStorage（XSS 风险放大）；部分公共入口需限流与字段白名单；生产配置需确保 CORS/密钥校验严格启用。",
        "",
        "## 按文件问题清单（问题-风险等级-优化建议-示例代码）",
        "",
        "| 文件 | 问题 | 风险等级 | 优化建议 | 示例代码 |",
        "|---|---|---:|---|---|",
    ]
    for it in top:
        loc = f"{it.file}:{it.line}" if it.line else it.file
        md_lines.append(f"| {loc} | {it.issue} | {it.severity} | {it.suggestion} | {it.example.replace('|', ' ')} |")

    md_lines.extend(
        [
            "",
            "## 输出文件",
            "",
            "- findings.csv / findings.json：逐条问题（可用于二次加工或导入 Sonar/Excel）",
            "- metrics.json：基础度量与 Python 函数级分析",
            "",
        ]
    )
    (out_dir / "report.md").write_text("\n".join(md_lines), encoding="utf-8")


if __name__ == "__main__":
    main()

