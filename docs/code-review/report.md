# 系统性代码审查与性能优化分析报告

- 生成时间: 2026-05-04T19:41:26
- 扫描范围文件数: 159

## 结论摘要

- 代码质量：存在少量大文件/复杂函数与疑似重复片段；前端部分页面与 store 存在重复请求与逻辑堆叠。
- 性能瓶颈：推荐/搜索与购物车补全存在全量拉取与 N+1；SSE 长连接对 worker 压力较大；部分关键路径缺少请求级去重与缓存策略。
- 安全：token 主要存 localStorage（XSS 风险放大）；部分公共入口需限流与字段白名单；生产配置需确保 CORS/密钥校验严格启用。

## 按文件问题清单（问题-风险等级-优化建议-示例代码）

| 文件 | 问题 | 风险等级 | 优化建议 | 示例代码 |
|---|---|---:|---|---|
| backend/app/__init__.py:66 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | jk = str(app.config.get("JWT_SECRET_KEY") or "") |
| backend/app/__init__.py:68 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | raise RuntimeError("JWT_SECRET_KEY must be set in production") |
| backend/app/config.py:20 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-me-please-32bytes')  # 应用密钥 |
| backend/app/config.py:22 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key-change-me-please-32bytes')  # JWT 签名密钥 |
| backend/app/utils/distributed_lock.py:32 | 危险执行（eval/exec） | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return bool(self.redis.eval(lua, 1, key, token)) |
| backend/tools/seed_api_test_data.py:20 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | admin_password = "Passw0rd!test" |
| backend/tools/seed_api_test_data.py:21 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | user_password = "Passw0rd!test" |
| frontend/src/views/UserCenter.vue:1350 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | pwdForm.old_password = '' |
| frontend/src/views/UserCenter.vue:1351 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | pwdForm.new_password = '' |
| frontend/src/views/UserCenter.vue:1352 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | pwdForm.confirm_password = '' |
| tools/code-review/run_code_review.py:211 | 疑似硬编码密钥/口令 | 高 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | ("安全漏洞", "高", "疑似硬编码密钥/口令", re.compile(r"(AKIA[0-9A-Z]{16} SECRET_KEY\s*= JWT_SECRET PRIVATE_KEY BEGIN\s+PRIVATE\s+KEY password\s*=\s*['\"])")), |
| backend/app/__init__.py:32 | 函数过长（84 行）：create_app | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def create_app(...): |
| backend/app/__init__.py:32 | 圈复杂度偏高（≈22）：create_app | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def create_app(...): |
| backend/app/admin_v2/controllers.py:235 | 函数过长（538 行）：register_admin_routes | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def register_admin_routes(...): |
| backend/app/admin_v2/controllers.py:235 | 圈复杂度偏高（≈62）：register_admin_routes | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def register_admin_routes(...): |
| backend/app/admin_v2/controllers.py:657 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:657, backend/app/routes/user.py:101 |
| backend/app/admin_v2/controllers.py:658 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:658, backend/app/routes/user.py:102 |
| backend/app/admin_v2/controllers.py:659 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:659, backend/app/routes/user.py:103 |
| backend/app/admin_v2/controllers.py:660 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:660, backend/app/routes/user.py:104 |
| backend/app/admin_v2/controllers.py:661 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:661, backend/app/routes/user.py:105 |
| backend/app/admin_v2/controllers.py:662 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:662, backend/app/routes/user.py:106 |
| backend/app/admin_v2/controllers.py:663 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:663, backend/app/routes/user.py:107 |
| backend/app/admin_v2/controllers.py:664 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:664, backend/app/routes/user.py:108 |
| backend/app/admin_v2/controllers.py:665 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:665, backend/app/routes/user.py:109 |
| backend/app/admin_v2/controllers.py:666 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:666, backend/app/routes/user.py:110 |
| backend/app/admin_v2/controllers.py:667 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:667, backend/app/routes/user.py:111 |
| backend/app/admin_v2/daos/rbac_dao.py:68 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db[RbacDao.PERMS].find({}, projection={"_id": 0}).sort("name", 1)) |
| backend/app/admin_v2/daos/rbac_dao.py:99 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db[RbacDao.ROLES].find().sort("name", 1)) |
| backend/app/admin_v2/daos/rbac_dao.py:153 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db[RbacDao.ROLES].find({"_id": {"$in": role_ids}})) |
| backend/app/admin_v2/services/sales_service.py:155 | 函数过长（81 行）：detail | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def detail(...): |
| backend/app/models/maintenance_model.py:56 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db[MaintenanceAppointment.COL].find(q, projection={"_id": 1, "scheduled_start": 1, "scheduled_end": 1, "status": 1})) |
| backend/app/models/maintenance_model.py:68 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db[MaintenanceAppointment.COL].find(q, projection={"_id": 1, "scheduled_start": 1, "scheduled_end": 1, "status": 1})) |
| backend/app/models/order_model.py:74 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.orders.find({"user_id": ObjectId(user_id)})) |
| backend/app/models/order_model.py:87 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.orders.find()) |
| backend/app/models/product_model.py:56 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.products.find()) |
| backend/app/models/product_model.py:72 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.products.find({"_id": {"$in": ids}})) |
| backend/app/models/product_model.py:81 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.products.find({"category": category})) |
| backend/app/models/product_model.py:117 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | items = list(mongo.db.products.find(query).sort(sort_spec).skip(skip).limit(page_size)) |
| backend/app/models/product_model.py:146 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.products.find(query).sort([("created_at", -1)]).limit(lim)) |
| backend/app/models/user_model.py:85 | 潜在全量拉取/物化（list(find)/toArray） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return list(mongo.db.users.find()) |
| backend/app/routes/order.py:43 | 圈复杂度偏高（≈29）：create_order | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def create_order(...): |
| backend/app/routes/product.py:183 | 圈复杂度偏高（≈19）：reco_event | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def reco_event(...): |
| backend/app/routes/user.py:101 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:657, backend/app/routes/user.py:101 |
| backend/app/routes/user.py:102 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:658, backend/app/routes/user.py:102 |
| backend/app/routes/user.py:103 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:659, backend/app/routes/user.py:103 |
| backend/app/routes/user.py:104 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:660, backend/app/routes/user.py:104 |
| backend/app/routes/user.py:105 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:661, backend/app/routes/user.py:105 |
| backend/app/routes/user.py:106 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:662, backend/app/routes/user.py:106 |
| backend/app/routes/user.py:107 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:663, backend/app/routes/user.py:107 |
| backend/app/routes/user.py:108 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:664, backend/app/routes/user.py:108 |
| backend/app/routes/user.py:109 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:665, backend/app/routes/user.py:109 |
| backend/app/routes/user.py:110 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:666, backend/app/routes/user.py:110 |
| backend/app/routes/user.py:111 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: backend/app/admin_v2/controllers.py:667, backend/app/routes/user.py:111 |
| backend/app/services/activity_service.py:86 | 函数过长（103 行）：validate_activity | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def validate_activity(...): |
| backend/app/services/activity_service.py:86 | 圈复杂度偏高（≈58）：validate_activity | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def validate_activity(...): |
| backend/app/services/activity_service.py:466 | 圈复杂度偏高（≈18）：public_list | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def public_list(...): |
| backend/app/services/activity_service.py:537 | 圈复杂度偏高（≈27）：register | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def register(...): |
| backend/app/services/maintenance_pdf_service.py:21 | 函数过长（89 行）：export_record_pdf_for_user | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def export_record_pdf_for_user(...): |
| backend/app/services/maintenance_pdf_service.py:21 | 圈复杂度偏高（≈22）：export_record_pdf_for_user | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def export_record_pdf_for_user(...): |
| backend/app/services/maintenance_service.py:181 | 函数过长（80 行）：create_appointment | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def create_appointment(...): |
| backend/app/services/maintenance_service.py:181 | 圈复杂度偏高（≈22）：create_appointment | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def create_appointment(...): |
| backend/app/services/recommender.py:84 | 函数过长（124 行）：_score_product | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def _score_product(...): |
| backend/app/services/recommender.py:84 | 圈复杂度偏高（≈48）：_score_product | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def _score_product(...): |
| frontend/src/components/auth/AdminLogin.vue:28 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:28, frontend/src/components/auth/UserLogin.vue:17 |
| frontend/src/components/auth/AdminLogin.vue:29 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:29, frontend/src/components/auth/UserLogin.vue:18, frontend/src/components/auth/UserRegister.vue:24 |
| frontend/src/components/auth/AdminLogin.vue:30 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:30, frontend/src/components/auth/UserRegister.vue:25 |
| frontend/src/components/auth/UserLogin.vue:17 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:28, frontend/src/components/auth/UserLogin.vue:17 |
| frontend/src/components/auth/UserLogin.vue:18 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:29, frontend/src/components/auth/UserLogin.vue:18, frontend/src/components/auth/UserRegister.vue:24 |
| frontend/src/components/auth/UserLogin.vue:32 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/UserLogin.vue:32, frontend/src/components/auth/UserRegister.vue:48 |
| frontend/src/components/auth/UserLogin.vue:77 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/UserLogin.vue:77, frontend/src/components/auth/UserRegister.vue:103 |
| frontend/src/components/auth/UserRegister.vue:24 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:29, frontend/src/components/auth/UserLogin.vue:18, frontend/src/components/auth/UserRegister.vue:24 |
| frontend/src/components/auth/UserRegister.vue:25 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/AdminLogin.vue:30, frontend/src/components/auth/UserRegister.vue:25 |
| frontend/src/components/auth/UserRegister.vue:48 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/UserLogin.vue:32, frontend/src/components/auth/UserRegister.vue:48 |
| frontend/src/components/auth/UserRegister.vue:103 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/components/auth/UserLogin.vue:77, frontend/src/components/auth/UserRegister.vue:103 |
| frontend/src/hooks/useSpeechRecognition.ts:36 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:36, frontend/src/stores/speech.ts:41 |
| frontend/src/hooks/useSpeechRecognition.ts:37 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:37, frontend/src/stores/speech.ts:42 |
| frontend/src/hooks/useSpeechRecognition.ts:38 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:38, frontend/src/stores/speech.ts:43 |
| frontend/src/hooks/useSpeechRecognition.ts:39 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:39, frontend/src/stores/speech.ts:44 |
| frontend/src/hooks/useSpeechRecognition.ts:40 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:40, frontend/src/stores/speech.ts:45 |
| frontend/src/hooks/useSpeechRecognition.ts:41 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:41, frontend/src/stores/speech.ts:46 |
| frontend/src/hooks/useSpeechRecognition.ts:60 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:60, frontend/src/stores/speech.ts:73 |
| frontend/src/hooks/useSpeechRecognition.ts:61 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:61, frontend/src/stores/speech.ts:74 |
| frontend/src/hooks/useSpeechRecognition.ts:62 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:62, frontend/src/stores/speech.ts:75 |
| frontend/src/hooks/useSpeechRecognition.ts:63 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:63, frontend/src/stores/speech.ts:76 |
| frontend/src/stores/a11y.ts:77 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)) |
| frontend/src/stores/a11y.ts:81 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const raw = localStorage.getItem(STORAGE_KEY) |
| frontend/src/stores/cart.ts:41 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(CACHE_KEY, JSON.stringify(payload)) |
| frontend/src/stores/cart.ts:45 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const raw = localStorage.getItem(CACHE_KEY) |
| frontend/src/stores/cover.ts:26 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const rm = localStorage.getItem(REDUCE_KEY) |
| frontend/src/stores/cover.ts:28 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const ps = Number(localStorage.getItem(PARTICLE_SCALE_KEY) ?? '1') |
| frontend/src/stores/cover.ts:44 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(REDUCE_KEY, reduceMotion.value ? '1' : '0') |
| frontend/src/stores/cover.ts:54 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(PARTICLE_SCALE_KEY, String(particleScale.value)) |
| frontend/src/stores/reco.ts:47 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const existing = localStorage.getItem(key) |
| frontend/src/stores/reco.ts:53 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(key, id) |
| frontend/src/stores/reco.ts:84 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const cached = safeParse<HearingProfile>(localStorage.getItem(PROFILE_KEY)) |
| frontend/src/stores/reco.ts:102 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(PROFILE_KEY, JSON.stringify(payload)) |
| frontend/src/stores/speech.ts:41 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:36, frontend/src/stores/speech.ts:41 |
| frontend/src/stores/speech.ts:42 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:37, frontend/src/stores/speech.ts:42 |
| frontend/src/stores/speech.ts:43 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:38, frontend/src/stores/speech.ts:43 |
| frontend/src/stores/speech.ts:44 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:39, frontend/src/stores/speech.ts:44 |
| frontend/src/stores/speech.ts:45 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:40, frontend/src/stores/speech.ts:45 |
| frontend/src/stores/speech.ts:46 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:41, frontend/src/stores/speech.ts:46 |
| frontend/src/stores/speech.ts:73 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:60, frontend/src/stores/speech.ts:73 |
| frontend/src/stores/speech.ts:74 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:61, frontend/src/stores/speech.ts:74 |
| frontend/src/stores/speech.ts:75 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:62, frontend/src/stores/speech.ts:75 |
| frontend/src/stores/speech.ts:76 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/hooks/useSpeechRecognition.ts:63, frontend/src/stores/speech.ts:76 |
| frontend/src/tests/a11yStore.spec.ts:15 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem( |
| frontend/src/tests/cartStore.spec.ts:34 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | expect(localStorage.getItem('cart_cache_v1')).toBeTruthy() |
| frontend/src/tests/cartStore.spec.ts:53 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem( |
| frontend/src/tests/cartStore.spec.ts:69 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | expect(localStorage.getItem('cart_cache_v1')).toBeNull() |
| frontend/src/tests/cartStore.spec.ts:74 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem( |
| frontend/src/tests/cartStore.spec.ts:84 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | expect(localStorage.getItem('cart_cache_v1')).toBeNull() |
| frontend/src/tests/coverEntry.spec.ts:15 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('cover_seen_v1', getCoverSessionId()) |
| frontend/src/tests/e2e/a11y-modes.spec.ts:6 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:6, frontend/src/tests/e2e/admin-access.spec.ts:14, frontend/src/tests/e2e/admin-return-from-home.spec.ts:8, frontend/src/tests/e2e/logout-cart-badge.spec.ts:7 |
| frontend/src/tests/e2e/a11y-modes.spec.ts:7 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:7, frontend/src/tests/e2e/admin-access.spec.ts:15, frontend/src/tests/e2e/admin-return-from-home.spec.ts:9, frontend/src/tests/e2e/logout-cart-badge.spec.ts:8 |
| frontend/src/tests/e2e/a11y-modes.spec.ts:8 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:8, frontend/src/tests/e2e/admin-access.spec.ts:16, frontend/src/tests/e2e/admin-return-from-home.spec.ts:10, frontend/src/tests/e2e/logout-cart-badge.spec.ts:9 |
| frontend/src/tests/e2e/a11y-modes.spec.ts:9 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:9, frontend/src/tests/e2e/admin-access.spec.ts:17, frontend/src/tests/e2e/admin-return-from-home.spec.ts:11, frontend/src/tests/e2e/logout-cart-badge.spec.ts:10 |
| frontend/src/tests/e2e/a11y-modes.spec.ts:10 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:10, frontend/src/tests/e2e/admin-access.spec.ts:18, frontend/src/tests/e2e/admin-return-from-home.spec.ts:12, frontend/src/tests/e2e/logout-cart-badge.spec.ts:11 |
| frontend/src/tests/e2e/a11y-modes.spec.ts:11 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:11, frontend/src/tests/e2e/admin-access.spec.ts:19 |
| frontend/src/tests/e2e/admin-access.spec.ts:14 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:6, frontend/src/tests/e2e/admin-access.spec.ts:14, frontend/src/tests/e2e/admin-return-from-home.spec.ts:8, frontend/src/tests/e2e/logout-cart-badge.spec.ts:7 |
| frontend/src/tests/e2e/admin-access.spec.ts:15 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:7, frontend/src/tests/e2e/admin-access.spec.ts:15, frontend/src/tests/e2e/admin-return-from-home.spec.ts:9, frontend/src/tests/e2e/logout-cart-badge.spec.ts:8 |
| frontend/src/tests/e2e/admin-access.spec.ts:16 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:8, frontend/src/tests/e2e/admin-access.spec.ts:16, frontend/src/tests/e2e/admin-return-from-home.spec.ts:10, frontend/src/tests/e2e/logout-cart-badge.spec.ts:9 |
| frontend/src/tests/e2e/admin-access.spec.ts:17 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:9, frontend/src/tests/e2e/admin-access.spec.ts:17, frontend/src/tests/e2e/admin-return-from-home.spec.ts:11, frontend/src/tests/e2e/logout-cart-badge.spec.ts:10 |
| frontend/src/tests/e2e/admin-access.spec.ts:18 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:10, frontend/src/tests/e2e/admin-access.spec.ts:18, frontend/src/tests/e2e/admin-return-from-home.spec.ts:12, frontend/src/tests/e2e/logout-cart-badge.spec.ts:11 |
| frontend/src/tests/e2e/admin-access.spec.ts:19 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:11, frontend/src/tests/e2e/admin-access.spec.ts:19 |
| frontend/src/tests/e2e/admin-authorization.spec.ts:16 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('admin_access_token', 'fake-user-jwt') |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:6 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('admin_access_token', 'admin-token') |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:7 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:7, frontend/src/tests/e2e/logout-cart-badge.spec.ts:6 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:8 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:6, frontend/src/tests/e2e/admin-access.spec.ts:14, frontend/src/tests/e2e/admin-return-from-home.spec.ts:8, frontend/src/tests/e2e/logout-cart-badge.spec.ts:7 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:9 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:7, frontend/src/tests/e2e/admin-access.spec.ts:15, frontend/src/tests/e2e/admin-return-from-home.spec.ts:9, frontend/src/tests/e2e/logout-cart-badge.spec.ts:8 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:10 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:8, frontend/src/tests/e2e/admin-access.spec.ts:16, frontend/src/tests/e2e/admin-return-from-home.spec.ts:10, frontend/src/tests/e2e/logout-cart-badge.spec.ts:9 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:11 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:9, frontend/src/tests/e2e/admin-access.spec.ts:17, frontend/src/tests/e2e/admin-return-from-home.spec.ts:11, frontend/src/tests/e2e/logout-cart-badge.spec.ts:10 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:12 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:10, frontend/src/tests/e2e/admin-access.spec.ts:18, frontend/src/tests/e2e/admin-return-from-home.spec.ts:12, frontend/src/tests/e2e/logout-cart-badge.spec.ts:11 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:25 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:25, frontend/src/tests/e2e/admin-sales-chart.spec.ts:7 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:26 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:26, frontend/src/tests/e2e/admin-sales-chart.spec.ts:8 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:27 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:27, frontend/src/tests/e2e/admin-sales-chart.spec.ts:9 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:28 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:28, frontend/src/tests/e2e/admin-sales-chart.spec.ts:10 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:29 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:29, frontend/src/tests/e2e/admin-sales-chart.spec.ts:11 |
| frontend/src/tests/e2e/admin-return-from-home.spec.ts:30 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:30, frontend/src/tests/e2e/admin-sales-chart.spec.ts:12 |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:6 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('admin_access_token', 'admin-token') |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:7 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:25, frontend/src/tests/e2e/admin-sales-chart.spec.ts:7 |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:8 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:26, frontend/src/tests/e2e/admin-sales-chart.spec.ts:8 |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:9 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:27, frontend/src/tests/e2e/admin-sales-chart.spec.ts:9 |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:10 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:28, frontend/src/tests/e2e/admin-sales-chart.spec.ts:10 |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:11 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:29, frontend/src/tests/e2e/admin-sales-chart.spec.ts:11 |
| frontend/src/tests/e2e/admin-sales-chart.spec.ts:12 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:30, frontend/src/tests/e2e/admin-sales-chart.spec.ts:12 |
| frontend/src/tests/e2e/cart-sync.spec.ts:6 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('access_token', 'fake-user-token') |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:6 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('access_token', 't') |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:6 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/admin-return-from-home.spec.ts:7, frontend/src/tests/e2e/logout-cart-badge.spec.ts:6 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:7 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:6, frontend/src/tests/e2e/admin-access.spec.ts:14, frontend/src/tests/e2e/admin-return-from-home.spec.ts:8, frontend/src/tests/e2e/logout-cart-badge.spec.ts:7 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:8 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:7, frontend/src/tests/e2e/admin-access.spec.ts:15, frontend/src/tests/e2e/admin-return-from-home.spec.ts:9, frontend/src/tests/e2e/logout-cart-badge.spec.ts:8 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:9 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:8, frontend/src/tests/e2e/admin-access.spec.ts:16, frontend/src/tests/e2e/admin-return-from-home.spec.ts:10, frontend/src/tests/e2e/logout-cart-badge.spec.ts:9 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:10 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:9, frontend/src/tests/e2e/admin-access.spec.ts:17, frontend/src/tests/e2e/admin-return-from-home.spec.ts:11, frontend/src/tests/e2e/logout-cart-badge.spec.ts:10 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:11 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/a11y-modes.spec.ts:10, frontend/src/tests/e2e/admin-access.spec.ts:18, frontend/src/tests/e2e/admin-return-from-home.spec.ts:12, frontend/src/tests/e2e/logout-cart-badge.spec.ts:11 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:46 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:46, frontend/src/tests/e2e/register-flow.spec.ts:25 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:47 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:47, frontend/src/tests/e2e/register-flow.spec.ts:26 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:48 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:48, frontend/src/tests/e2e/register-flow.spec.ts:27 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:49 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:49, frontend/src/tests/e2e/register-flow.spec.ts:28 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:50 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:50, frontend/src/tests/e2e/register-flow.spec.ts:29 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:51 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:51, frontend/src/tests/e2e/register-flow.spec.ts:30 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:52 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:52, frontend/src/tests/e2e/register-flow.spec.ts:31 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:53 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:53, frontend/src/tests/e2e/register-flow.spec.ts:32 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:54 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:54, frontend/src/tests/e2e/register-flow.spec.ts:33 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:55 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:55, frontend/src/tests/e2e/register-flow.spec.ts:34 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:56 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:56, frontend/src/tests/e2e/register-flow.spec.ts:35 |
| frontend/src/tests/e2e/logout-cart-badge.spec.ts:57 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:57, frontend/src/tests/e2e/register-flow.spec.ts:36 |
| frontend/src/tests/e2e/product-detail-add-cart.spec.ts:6 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('access_token', 't') |
| frontend/src/tests/e2e/recommendations-flow.spec.ts:8 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem('access_token', 't') |
| frontend/src/tests/e2e/register-flow.spec.ts:25 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:46, frontend/src/tests/e2e/register-flow.spec.ts:25 |
| frontend/src/tests/e2e/register-flow.spec.ts:26 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:47, frontend/src/tests/e2e/register-flow.spec.ts:26 |
| frontend/src/tests/e2e/register-flow.spec.ts:27 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:48, frontend/src/tests/e2e/register-flow.spec.ts:27 |
| frontend/src/tests/e2e/register-flow.spec.ts:28 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:49, frontend/src/tests/e2e/register-flow.spec.ts:28 |
| frontend/src/tests/e2e/register-flow.spec.ts:29 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:50, frontend/src/tests/e2e/register-flow.spec.ts:29 |
| frontend/src/tests/e2e/register-flow.spec.ts:30 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:51, frontend/src/tests/e2e/register-flow.spec.ts:30 |
| frontend/src/tests/e2e/register-flow.spec.ts:31 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:52, frontend/src/tests/e2e/register-flow.spec.ts:31 |
| frontend/src/tests/e2e/register-flow.spec.ts:32 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:53, frontend/src/tests/e2e/register-flow.spec.ts:32 |
| frontend/src/tests/e2e/register-flow.spec.ts:33 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:54, frontend/src/tests/e2e/register-flow.spec.ts:33 |
| frontend/src/tests/e2e/register-flow.spec.ts:34 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:55, frontend/src/tests/e2e/register-flow.spec.ts:34 |
| frontend/src/tests/e2e/register-flow.spec.ts:35 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:56, frontend/src/tests/e2e/register-flow.spec.ts:35 |
| frontend/src/tests/e2e/register-flow.spec.ts:36 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/e2e/logout-cart-badge.spec.ts:57, frontend/src/tests/e2e/register-flow.spec.ts:36 |
| frontend/src/tests/e2e/register-flow.spec.ts:69 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const token = await page.evaluate(() => localStorage.getItem('access_token')) |
| frontend/src/tests/recoStore.spec.ts:23 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem( |
| frontend/src/tests/recoStore.spec.ts:113 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | expect(localStorage.getItem('hearing_profile_v1')).toContain('重度') |
| frontend/src/tests/recoStore.spec.ts:124 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | expect(localStorage.getItem('hearing_profile_v1')).toContain('中度') |
| frontend/src/tests/speechStore.spec.ts:3 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/speechStore.spec.ts:3, frontend/src/tests/useSpeechRecognition.spec.ts:4 |
| frontend/src/tests/speechStore.spec.ts:4 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/speechStore.spec.ts:4, frontend/src/tests/useSpeechRecognition.spec.ts:5 |
| frontend/src/tests/useSpeechRecognition.spec.ts:4 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/speechStore.spec.ts:3, frontend/src/tests/useSpeechRecognition.spec.ts:4 |
| frontend/src/tests/useSpeechRecognition.spec.ts:5 | 疑似重复代码片段 | 中 | 抽取为共享函数/组件/DAO 方法；统一校验与错误处理以减少漂移。 | 重复片段位置: frontend/src/tests/speechStore.spec.ts:4, frontend/src/tests/useSpeechRecognition.spec.ts:5 |
| frontend/src/utils/coverEntry.ts:31 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | const v = localStorage.getItem(ALWAYS_KEY) |
| frontend/src/utils/coverEntry.ts:41 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(ALWAYS_KEY, v ? '1' : '0') |
| frontend/src/utils/coverEntry.ts:47 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | localStorage.setItem(SEEN_KEY, getCoverSessionId()) |
| frontend/src/utils/coverEntry.ts:53 | localStorage 保存 token（XSS 风险放大） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | return localStorage.getItem(SEEN_KEY) === getCoverSessionId() |
| frontend/src/views/UserCenter.vue:1 | 单文件过大（1389 行） | 中 | 按功能拆分模块/组件；拆分后引入单元测试与契约测试减少回归风险。 | frontend/src/views/UserCenter.vue |
| tools/code-review/run_code_review.py:120 | 函数过长（88 行）：analyze_python | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def analyze_python(...): |
| tools/code-review/run_code_review.py:120 | 圈复杂度偏高（≈25）：analyze_python | 中 | 减少嵌套与分支；采用早返回/策略表/状态机；为分支路径补单测。 | def analyze_python(...): |
| tools/code-review/run_code_review.py:218 | 可能的 HTML 注入（v-html） | 中 | 需要人工复核上下文：确认是否为误报；如属实则按安全基线整改。 | ("安全漏洞", "中", "可能的 HTML 注入（v-html）", re.compile(r"\bv-html\b")), |
| tools/code-review/run_code_review.py:299 | 函数过长（91 行）：main | 中 | 拆分为更小的函数/提取校验与持久化逻辑，降低圈复杂度与测试成本。 | def main(...): |
| tools/repo-audit.mjs:1 | 单文件过大（981 行） | 中 | 按功能拆分模块/组件；拆分后引入单元测试与契约测试减少回归风险。 | tools/repo-audit.mjs |
| backend/app/admin_v2/activity_controllers.py:1 | 疑似未使用导入：annotations | 低 | 删除未使用导入，减少启动开销与可读性负担；如为类型导入可改为 TYPE_CHECKING 条件导入。 | annotations |
| backend/app/admin_v2/controllers.py:10 | 疑似未使用导入：annotations | 低 | 删除未使用导入，减少启动开销与可读性负担；如为类型导入可改为 TYPE_CHECKING 条件导入。 | annotations |

## 输出文件

- findings.csv / findings.json：逐条问题（可用于二次加工或导入 Sonar/Excel）
- metrics.json：基础度量与 Python 函数级分析
