# 适老化与听障无障碍升级报告

## 目标与范围

本次改造聚焦在前端用户端的全局视觉/交互无障碍能力建设，并提供可扩展到管理端的统一机制：

- 高对比度模式：通过 `html.hc` + 语义化 CSS 变量覆盖，便于持续把页面迁移到 AAA 级对比度体系。
- 大字体模式：基于 rem + CSS 变量实现一键大字（基准 18px）与 200% 放大（无失真）。
- 动态内容播报：通过 ARIA-live 实现关键提示即时播报，并同时提供横幅视觉提示。
- 语音输入/输出：引入 Web Speech API（搜索场景优先），并提供实时字幕叠加与降级提示。
- 触控面积与焦点可见：在大字体模式下强制最小触控高度 48px，并统一 `:focus-visible` 样式。

## 关键实现

### 1) 偏好设置与持久化

- Store： [a11y.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/stores/a11y.ts)
- localStorage：`a11y_prefs_v1`
- 写入 DOM：
  - `html.hc`：高对比度开关
  - `--a11y-font-scale`：字号缩放（100%~200%）
  - `data-a11y-large="1|0"`：大字模式标识（用于 48px 触控与 Element Plus 组件尺寸）

### 2) 全局样式体系（rem + 语义化变量 + 双轨模式）

- 入口： [style.css](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/style.css)
- 双轨：
  - `prefers-color-scheme`：系统深浅色偏好
  - `html.hc`：强制高对比度模式（独立于系统偏好）
- 统一焦点：`:focus-visible` 使用 `--focus-ring`
- 大字模式触控：`html[data-a11y-large="1"]` 下对常见控件设置 `min-height: 48px`

### 3) 无障碍工具条（用户可一键切换）

- 组件： [A11yToolbar.vue](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/components/a11y/A11yToolbar.vue)
- 入口：Header 右侧固定展示
- 能力：高对比度 / 大字体 / 语音输入 / 语音播报 / 字幕叠加 / 字号 100%~200% / 交互反馈偏好

### 4) 动态内容可视化提示 + ARIA-live

- ARIA-live： [A11yLiveRegion.vue](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/components/a11y/A11yLiveRegion.vue)
- 横幅： [A11yBanner.vue](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/components/a11y/A11yBanner.vue)
- 统一出口： [notify.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/utils/notify.ts)
  - 仍使用 Element Plus Toast 作为基础提示
  - 同步写入 ARIA-live 与顶部横幅（听障用户可视化提示）
  - 开启“语音播报”后，同步 TTS 播报

### 5) 语音交互与实时字幕

- Hook： [useSpeechRecognition.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/hooks/useSpeechRecognition.ts)
- 场景：Header 搜索框右侧麦克风按钮
  - 识别结束自动执行搜索
  - 识别过程中显示字幕叠加层（可在工具条关闭）

## 使用说明

- 高对比度：Header 右上角“无障碍” → 开启“高对比度”
- 一键大字体：Header 右上角“无障碍” → 开启“大字体”（基准 18px）
- 200% 放大：Header 右上角“无障碍” → 调整“字号（100% - 200%）”
- 语音输入：集成在“无障碍与适老化设置”中，提供开始/停止控制，并在页面顶部以字幕叠加展示识别结果

## 自动化测试与结果

- 单元测试（Vitest）：新增 [a11yStore.spec.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/tests/a11yStore.spec.ts)  
  - `npx vitest run`：通过
- 端到端测试（Playwright）：新增 [a11y-modes.spec.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/src/tests/e2e/a11y-modes.spec.ts)  
  - `npx playwright test`：通过
- 去重策略：为避免 `.spec.js/.spec.ts` 重复执行
  - Playwright 仅匹配 `.spec.ts`（[playwright.config.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/playwright.config.ts)）
  - Vitest 仅包含 `src/**/*.spec.ts`（[vitest.config.ts](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/frontend/vitest.config.ts)）

## 已知限制与后续建议

- 真实用户可用性测试（≥30 名 60-80 岁用户、≥10 名听障用户）与 GB/T 37668-2019 等级三认证属于线下评测/第三方测评工作，无法仅靠代码直接“完成”。本仓库已提供落地机制与自检清单，便于后续组织评测。
- 页面级 AAA 对比度需要持续将 Tailwind 固定色值迁移为语义化变量（本次已在 Header/Home/ProductCard/Login/Checkout 等核心页面启动迁移）。
