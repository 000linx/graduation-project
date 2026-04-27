# RICE 评分表（差异化核心功能）

评分口径：
- Reach（触达）：预计 90 天内影响用户数（相对评分：1/2/3/5）
- Impact（影响）：对核心指标的影响强度（0.25/0.5/1/2/3）
- Confidence（信心）：把握程度（0.5/0.7/0.8/0.9）
- Effort（投入）：人周（越高越难）（1/2/3/5/8）
- RICE = Reach * Impact * Confidence / Effort

| 功能 | Reach | Impact | Confidence | Effort | RICE | 主要拉动指标 | 备注 |
|---|---:|---:|---:|---:|---:|---|---|
| FitMatch 可解释适配引擎 | 5 | 2 | 0.8 | 5 | 1.60 | 推荐页加购/下单转化 | 依赖推荐页与商品字段完善 |
| CareFlow 智能售后 | 3 | 2 | 0.7 | 5 | 0.84 | 纠纷率下降、NPS提升 | 附件存储与审核需合规 |
| Refill+ 耗材订阅 | 3 | 1 | 0.7 | 3 | 0.70 | 复购率、LTV | 自动扣款可延后 |
| Tele-Audio 远程顾问 | 2 | 3 | 0.6 | 8 | 0.45 | 支付转化、退货率下降 | 音视频/客服系统成本较高 |
| CareCircle 照护协同 | 2 | 1 | 0.6 | 5 | 0.24 | 复购与留存 | 权限与隐私边界要严格 |

推荐优先级（按 RICE）：FitMatch > CareFlow > Refill+ > Tele-Audio > CareCircle

