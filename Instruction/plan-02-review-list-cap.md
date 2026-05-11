# 第二轮：复习页"待处理"列表默认折叠超出项（已完成）

## 问题

复习页"待处理"区域展示所有非稳定知识点，积累后可能超过 10 条。
与"今日建议只推 1-2 个"的低压力原则矛盾，容易让学生产生焦虑逃避。

## 改动（modules/reviewPage.js + style.css）

1. 新增常量 `PENDING_VISIBLE_CAP = 4`
2. STATE 新增 `pendingExpanded: false`
3. 新增 `renderPendingList(items)` 函数：
   - ≤4 条：全部显示，无按钮
   - >4 条且未展开：显示前 4 条 + 虚线按钮"还有 N 项待处理 — 显示全部"
   - 展开后：全部显示 + "收起"按钮
4. 切换科目/状态筛选时自动重置 `pendingExpanded = false`
5. 新增 `.review-pending-toggle` 样式（虚线边框，hover 变色）

## 设计原则

"今日建议"负责精准推送；"待处理"是补充台账，不应变成压力列表。
学生每天只需要处理 1-2 个，看到"还有 N 项"是安全信息，不是任务清单。
