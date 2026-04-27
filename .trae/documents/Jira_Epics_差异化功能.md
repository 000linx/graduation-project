# Jira Epic 清单（差异化核心功能）

说明：
- 结构：Epic → 用户故事（User Story）→ 验收准则（AC）→ 测试用例（Test Cases）
- 命名建议：`EPIC-<模块>-<编号>`

---

## EPIC-FIT-01：FitMatch 可解释适配推荐 v2
### User Story 1：作为用户，我希望填写更完整画像，以获得更贴合的适配推荐
AC：
- 推荐页表单支持：听损等级、预算区间、使用场景、外观偏好（可选）
- 提交后展示“筛选摘要 chips”，可一键清空/修改
Test Cases：
- 表单必填校验与错误提示（键盘可操作）
- 修改任意字段会触发重新推荐（含 loading 状态）
- 空态有示例配置按钮，点击可自动填充并触发推荐

### User Story 2：作为用户，我希望每个推荐商品都有明确推荐理由与风险提示
AC：
- 每个商品展示 FitScore（0-100）与 3 条理由（可展开）
- 当画像与商品存在冲突时展示 warnings（不夸大、不作诊断）
Test Cases：
- reasons/warnings 字段为空时 UI 不崩溃
- reasons 展示与“展开/收起”可用键盘操作
- 读屏能读出 FitScore 与理由标题（aria-label/aria-describedby）

### User Story 3：作为产品/运营，我希望可以做 A/B 实验并查看转化差异
AC：
- 支持实验开关（server-config 或 query param），记录分组
- 埋点：曝光/点击/加购/下单（含 experiment_id）
Test Cases：
- 同一用户分组稳定（hash）
- 埋点请求失败不影响主流程

---

## EPIC-CARE-01：CareFlow 智能售后与争议处理
### User Story 1：作为用户，我希望快速发起售后并上传证据
AC：
- 售后类型：物流/质量/适配/退款退货
- 证据上传支持图片（可扩展视频），显示上传进度与结果
Test Cases：
- 文件大小/类型限制提示
- 上传失败可重试，不丢失表单内容
- WCAG：上传按钮命中区≥48px，焦点可见

### User Story 2：作为客服/管理员，我希望基于类型自动分流并按 SLA 处理
AC：
- 后台列表按类型/状态筛选
- 展示 SLA 到期时间与超时标记
Test Cases：
- 非管理员访问后台售后页面被拒绝（前后端双重校验）
- SLA 计算正确（边界：跨天/时区）

### User Story 3：作为系统，我希望关键动作都有审计记录
AC：
- 售后创建/审核/退款等写入审计日志（含 actor/状态码）
Test Cases：
- 审计读权限控制有效（audit_viewer 可读、普通管理员按权限）

---

## EPIC-REFILL-01：Refill+ 耗材订阅与提醒
### User Story 1：作为用户，我希望在订单完成后看到耗材补给建议并一键加入购物车
AC：
- 订单完成页/个人中心展示“耗材建议卡”
- 一键加入购物车成功后有可读屏提示
Test Cases：
- 加购失败时提示原因（库存/网络）
- 推荐耗材与主机品类匹配（规则可先简单）

### User Story 2：作为用户，我希望设置提醒周期并管理订阅状态
AC：
- 支持创建/暂停/恢复/取消
- next_run_at 显示清晰（本地化）
Test Cases：
- 取消后不再发送提醒（mock 通知队列）
- 权限：只能管理自己的订阅

---

## EPIC-TEL-01：Tele-Audio 远程顾问与试戴任务（可选）
### User Story 1：作为用户，我希望能发起咨询并提交结构化问题
AC：
- 咨询入口在商品详情可见
- 结构化字段 + 自由文本可并存
Test Cases：
- 内容安全：敏感词/外链提示（策略可先弱）

### User Story 2：作为用户，我希望创建试戴任务并收到提醒
AC：
- 任务状态机：created → scheduled → feedback → done
- 到期提醒（站内通知/短信可二期）
Test Cases：
- 状态流转与回滚保护

---

## EPIC-CIRCLE-01：CareCircle 照护协同（可选）
### User Story 1：作为购买者，我希望邀请照护者协助查看订单与提醒
AC：
- 邀请链接一次性 token + 过期
- 可随时解除绑定
Test Cases：
- 权限边界：照护者默认不可查看地址/电话（除非授权）
- 风控：异常多次邀请触发限流

