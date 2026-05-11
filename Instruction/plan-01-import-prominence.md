# 第一轮：首页导入入口权重调整（已完成）

## 问题

首页右侧列原顺序：农场 → 今日目标 → 今日复习 → 导入框。
导入 MOCHI-RECORD 是学生每天最高频的操作，却排在最后，视觉权重最低。

## 改动（modules/farm.js + style.css）

1. 右侧列顺序改为：农场 → 导入框 → 今日目标 → 今日复习
2. 导入框标题行改为 h3 + 副标题（`import-header-hint`）：
   "把 AI 家教输出的 MOCHI-RECORD 粘贴进来"
3. textarea placeholder 改为：
   "粘贴 ---MOCHI-RECORD-START--- 到 ---MOCHI-RECORD-END--- 之间的完整内容"
4. `.import-header` 对齐改为 `align-items: flex-start`，支持多行副标题
5. 新增 `.import-header-hint` CSS 样式

## 设计原则

学生拿到 MOCHI-RECORD 后第一反应是找粘贴框，不应该向下滚动才能找到。
导入是驱动一切的动作：驱动农场成长、卡片沉淀、复习排期。
