# 第三轮：首页空状态新用户引导（已完成）

## 问题

study_log 为空时，首页右侧显示空的今日目标（三个空圈）和
"今天没有特别紧急的薄弱点"。对第一次打开网站的学生没有任何引导价值。

## 改动（modules/farm.js + style.css）

1. renderFarm 里读取 `(window.MochiApp?.readStudyLogs?.() || []).length > 0` → `hasRecords`
2. 新增 `renderGuideCard()` 函数，输出三步引导卡：
   - 第一步：打开 AI 私教，做一道题
   - 第二步：AI 输出 MOCHI-RECORD → 复制
   - 第三步：粘贴到下面的导入框 → 导入
3. 无记录时：今日目标和今日复习替换为引导卡，导入框保留
4. 有记录后：恢复正常今日目标 + 今日复习
5. 新增 `.home-guide-card` / `.home-guide-head` / `.home-guide-steps` CSS 样式

## 设计原则

新用户第一眼看到的是"要做什么"，而不是空数据。
导入框留在引导卡下方，因为那就是第一步的操作区。
