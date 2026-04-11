# 管理员后台 V2 高保真原型（HTML）

## 说明
由于无法直接在文档中嵌入 Figma 等在线原型，本项目提供“可打开的本地 HTML 高保真原型”，用于论文评审展示与交互走查。

## 原型入口
- 原型首页（Dashboard）：[index.html](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/.trae/prototypes/admin_v2/index.html)
- 用户管理：[users.html](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/.trae/prototypes/admin_v2/users.html)
- 商品管理：[products.html](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/.trae/prototypes/admin_v2/products.html)
- 订单与售后：[orders.html](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/.trae/prototypes/admin_v2/orders.html)
- 角色与权限：[roles.html](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/.trae/prototypes/admin_v2/roles.html)
- 审计日志：[audit.html](file:///e:/%E6%AF%95%E8%AE%BE1/%E5%9F%BA%E4%BA%8EFlask%E7%9A%84%E5%8A%A9%E5%90%AC%E5%99%A8%E8%B4%AD%E7%89%A9%E5%95%86%E5%9F%8E%E8%AE%BE%E8%AE%A1%E4%B8%8E%E5%AE%9E%E7%8E%B0/.trae/prototypes/admin_v2/audit.html)

## 交互约定（原型级）
- 搜索/筛选：展示组合筛选栏（关键词、状态、时间范围）并提供“保存筛选/重置”。  
- 批量操作：表格支持多选，顶部展示批量按钮（批量改角色/批量改状态/批量上下架）。  
- 高风险操作：删除/批量改状态均有二次确认弹窗与“原因输入框”。  
- 审计：每次操作对应“审计日志”记录，可在 audit 页通过 actor/资源/时间过滤查看。  

## 备注
该原型用于“信息架构 + 交互流程 + 视觉风格统一”的评审展示；与最终实现存在数据联通与权限校验差异，API 以《AdminV2_API接口变更说明》为准。
