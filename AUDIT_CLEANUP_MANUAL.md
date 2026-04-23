# 文件审计与清理操作手册

## 交付物位置

- 审计报告（Markdown）：[audit/report.md](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/audit/report.md)
- 审计报告（CSV）：[audit/report.csv](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/audit/report.csv)
- 审计/清理脚本：[tools/repo-audit.mjs](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/tools/repo-audit.mjs)
- 脚本配置：[tools/repo-audit.config.json](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/tools/repo-audit.config.json)
- 回收站目录：`.trash/`（默认保留 7 天）

## 一键审计

在仓库根目录执行：

```bash
node tools/repo-audit.mjs scan
```

输出：
- `audit/report.md`
- `audit/report.csv`

## 一键清理（支持 dry-run + 备份）

### 1) 预览（dry-run）

仅输出“立即删除”候选文件列表，不做任何修改：

```bash
node tools/repo-audit.mjs dry-run --recommendation immediate
```

### 2) 执行清理（apply）

把候选文件移动到 `.trash/<时间戳>/...`，原路径会被清空；默认保留 7 天：

```bash
node tools/repo-audit.mjs apply --recommendation immediate
```

产物：
- `audit/delete-plan.json`：本次清理计划文件列表
- `audit/last-manifest.json`：本次清理移动清单（用于回滚）
- `audit/apply-log.txt`：跳过/异常记录（如文件被占用）

说明：
- Windows 上日志文件可能被占用（EBUSY/EPERM），脚本会记录为 `skipped` 并继续处理其它文件。

## 回滚（必须项）

按 manifest 逐文件恢复到原位置：

```bash
node tools/repo-audit.mjs rollback --manifest audit/last-manifest.json
```

如果某次清理因异常中断且缺失 manifest，但 `.trash/<时间戳>/` 已生成，可先重建 manifest：

```bash
node tools/repo-audit.mjs rebuild-manifest --trash .trash/<时间戳>
node tools/repo-audit.mjs rollback --manifest audit/rebuilt-manifest.json
```

## 垃圾保留策略（7 天）

手动触发回收站清理：

```bash
node tools/repo-audit.mjs prune-trash
```

## 质量门禁（本地验证）

建议顺序：

### 前端

```bash
cd frontend
npm ci
npm run build
npx vitest run
```

### 后端

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m pytest -q
```

### Docker

如果仓库未来需要容器化，需要提供 `Dockerfile` 后才能执行：

```bash
docker build .
```

## CI 结果截图

当前仓库未发现 CI 配置（如 `.github/workflows/*`、`.gitlab-ci.yml`、`Jenkinsfile`）。建议将本手册中的质量门禁命令写入 CI 后再生成“全绿截图”。
