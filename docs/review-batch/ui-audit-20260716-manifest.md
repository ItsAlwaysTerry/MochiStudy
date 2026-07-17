# UI Audit Screenshot Manifest - 2026-07-16

采集说明：站点通过本机 Chrome/CDP 打开 `file:///D:/Agent工作区/mochistudy-v34/mochistudy/index.html`。`study_log` 为空时已注入指定 8 条 demo；页面运行时的 `todayKey()` 返回 `2026-07-17`，所以补充的 `focus_log` 今日记录写入 `2026-07-17`。移动首页为满足“含底部导航”，截图时运行态隐藏了今日能量浮窗；该浮窗展开态另见 `10-today-energy-float-crop.png`。

## 截图清单

- `01-home-desktop-top.png` - 桌面首页首屏；信息密度很高，暑假任务、农场、导入框、能量浮窗同时抢主视线，能量浮窗压住右侧操作区。
- `01-home-desktop-bottom.png` - 桌面首页下半屏；右栏折叠项、专注卡、导入卡和能量浮窗层级混杂，浮窗继续遮挡内容。
- `02-learn-review-desktop.png` - 学习页复习 tab；列表可读，但顶部“晒卷子/出测验”按钮与说明文字分离，层级略松散。
- `03-learn-archive-expanded-desktop.png` - 学习档案 tab，展开“数列”知识点并打开一张卡片详情；按钮、徽章、摘要、卡片操作同时出现，局部层级偏忙，卡片详情延伸到首屏外。
- `04-learn-today-desktop.png` - 学习页今日 tab；统计清楚，但下方留白过大，0 张导入卡片与 25 分钟专注的关系解释偏弱。
- `05-achievements-desktop.png` - 勋章页；toast 覆盖右下角列表内容，勋章条目底色偏灰，和页面主色关系弱。
- `06-settings-desktop-top.png` - 设置页顶部；阅读外观/提醒设置清楚，但右下 toast 覆盖 AI 使用指南按钮，页面开始就出现浮层干扰。
- `06-settings-desktop-part2.png` - 设置页 AI Prompt/API/备份区域；表单和说明文字偏密，右侧备份卡显得孤立，toast 继续遮挡底部。
- `06-settings-desktop-part3.png` - 设置页数据管理/假期管理区域；滚动分段顶部被 sticky header 截断，上方残留按钮让截图状态显得不完整。
- `06-settings-desktop-part4.png` - 设置页假期表/更新说明区域；假期表行距大但信息少，更新说明段落和代码块较重。
- `06-settings-desktop-bottom.png` - 设置页底部更新/关于区域；关于卡只占半宽，右侧大面积空白，toast 仍压在右下。
- `07-focus-commitment-modal-desktop.png` - 首页开始专注后的承诺弹窗；弹窗主体清晰，背景内容较复杂但遮罩足够压暗。
- `08-focus-overlay-running-desktop.png` - 25 分钟专注开始后的沉浸 overlay；核心计时清楚，但“放弃本轮”和底部导入入口对比度偏低。
- `09-focus-deciding-desktop.png` - 点击“结束这一轮”后的 deciding 屏；状态正确，按钮换行成两行后视觉重心略散；0 分钟是自动化立即结束造成。
- `10-today-energy-float-crop.png` - 右下角今日能量浮窗展开态局部；浮窗自身可读，但尺寸足以遮挡页面主按钮。
- `11-lottery-overlay-desktop.png` - 勋章页进入的抽奖界面；状态已截到，视觉风格与主站浅色学习工具差异很大，下半屏留白明显。
- `12-home-mobile.png` - 移动首页，底部导航可见；暑假任务卡在窄屏里横向信息拥挤，任务步骤和按钮接近底部导航。
- `13-learn-review-mobile.png` - 移动学习页复习 tab；底部导航正常，但每行右侧“开始”按钮占宽较大，原因文本被截断。
- `14-achievements-mobile.png` - 移动勋章页；结构清楚，但大标题和统计卡占用首屏过多，底部导航遮住列表继续浏览的空间。

## 最影响观感的 10 个问题

1. 浮层遮挡核心操作：今日能量浮窗和 toast 多次压住导入、设置和列表内容。证据：`01-home-desktop-top.png`、`01-home-desktop-bottom.png`、`05-achievements-desktop.png`、`06-settings-desktop-bottom.png`、`10-today-energy-float-crop.png`。
2. 首页首屏目标过多：暑假任务、农场、导入、专注、复习、能量奖励都在抢主任务，学生很难一眼判断“现在该做什么”。证据：`01-home-desktop-top.png`、`12-home-mobile.png`。
3. 移动首页横向拥挤：任务卡、三科 tab、步骤条和操作按钮在 390px 宽度下显得压迫，底部导航附近尤其紧。证据：`12-home-mobile.png`。
4. 设置页过长且密度不均：有的卡片文字很密，有的区域大面积留白，滚动分段还会被 sticky header 截断。证据：`06-settings-desktop-part2.png`、`06-settings-desktop-part3.png`、`06-settings-desktop-bottom.png`。
5. 视觉风格不统一：浅色学习工具、像素农场、橙色能量奖励、深色抽奖牌局之间切换强烈，整体品牌感被分散。证据：`01-home-desktop-top.png`、`10-today-energy-float-crop.png`、`11-lottery-overlay-desktop.png`。
6. Toast 位置不够安全：toast 固定右下会覆盖主要内容，尤其在设置、勋章、长页面底部。证据：`05-achievements-desktop.png`、`06-settings-desktop-top.png`、`06-settings-desktop-bottom.png`。
7. 学习档案详情层级偏忙：摘要、状态、测验、导出、卡片操作、星级和删除按钮同时出现，注意力被分散。证据：`03-learn-archive-expanded-desktop.png`。
8. 移动复习列表信息被截断：复习原因是决策依据，但在移动端被压缩成省略号，右侧按钮权重过高。证据：`13-learn-review-mobile.png`。
9. 勋章页有效内容下沉：大号抽奖机会和统计卡占首屏，真正的勋章列表只能看到开头。证据：`05-achievements-desktop.png`、`14-achievements-mobile.png`。
10. 专注 overlay 的次要操作可见性偏低：“放弃本轮”和导入入口在暗色背景里弱到接近不可见，可能影响紧急退出和记录入口发现。证据：`08-focus-overlay-running-desktop.png`。
