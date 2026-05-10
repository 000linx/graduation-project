# 系统性代码审查与性能优化分析

## 自动化扫描

在仓库根目录执行：

```bash
python tools/code-review/run_code_review.py
```

可选：指定输出目录（默认 `docs/code-review`）：

```bash
$env:OUT_DIR="docs/code-review"; python tools/code-review/run_code_review.py
```

## 产出

- `report.md`：摘要 + 按文件四列表格（问题/风险等级/优化建议/示例）
- `final-report.md`：详细报告（质量/性能/安全/可维护性）
- `tasks.md`：按优先级的优化任务清单与验收标准
- `findings.csv` / `findings.json`：逐条问题清单
- `metrics.json`：基础度量与 Python 函数级分析（长度/圈复杂度近似/疑似未使用导入）
