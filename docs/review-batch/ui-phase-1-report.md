# UI Phase 1 Report

执行日期：2026-07-17

范围：按 `docs/ui-redesign-plan.md` Phase 1 改全局浮层纪律、toast、顶栏和导航激活态。未改业务逻辑、学习数据结构、localStorage key、游戏数值、精灵图规则。

## 1. 改动实现

### 今日能量浮窗

- `modules/summerTasks.js`：沿用现有 `summer_reward.collapsed` / `summer_reward.position`，未新增 localStorage key。
- 默认 fallback 改为 `collapsed: true`；截图 seed 同步改为收起态。
- 收起态标题改为短胶囊文本：有券时 `⚡{energy} · 可抽{tickets}`，无券时只显示今日能量。
- 展开态保留原有骰子、双按钮、文案和经济结算；仅限制容器为 `width <= 340px`，body 内部滚动。
- 拖动边界改为四边 16px；移动端底部安全区 88px，避免拖到或停到底部导航上。
- 有券且收起时增加轻微 pulse，仅用于提示可抽券。

### Toast

- `.toast-root` 从右下角移到顶部居中：`top: 16px; left: 50%; transform: translateX(-50%)`。
- 多条 toast 继续纵向堆叠。
- z-index 调整为 `1000`，高于承诺弹窗 `950`。
- 进入动画改为顶部下落淡入；自动移除时间改为 `2400ms`。

### 顶栏

- `index.html` 删除 `.build-label`。
- `.top-bar` 去掉浮起卡片感：无圆角、无阴影、无玻璃卡背景，仅保留与背景融合的底部分隔线。
- `app.js` 新增 `BUILD_ID = "build-20260716q"`，设置页「关于」卡显示 `构建 build-20260716q`；代码注释标明需和 `index.html ?v=` 同步升级。

### 导航激活态

- `.nav-item.active` 统一为 `--primary-tint` 背景 + `--primary` 字/图标。
- 未激活项为 `--ink-2`；hover 为 `--surface-dim`。
- 去掉 active 投影和展开侧栏 hover 位移。
- `.nav-lottery-badge` 继续保留，颜色为 `--bad`。

### 截图脚本

- `docs/review-batch/screenshots/capture-ui.mjs` 输出目录支持 `ui-phase-1`。
- 新增截图：`15-energy-float-collapsed.png`、`16-energy-float-expanded.png`、`17-toast-top-center.png`、`18-mobile-nav-active.png`。
- 移动端首页截图不再隐藏能量浮窗，便于验证默认收起态不会盖住底部导航。

## 2. z-index 清册

| 层级 | 用途 |
|---:|---|
| 20 | 侧边栏 / 顶栏 |
| 30 | 移动端底部导航 |
| 120 | 能量浮窗、等待导入胶囊、focus mini dock、quiz 选择条 |
| 500 | 专注 overlay |
| 600 | rest-reminder overlay |
| 700 | lottery overlay |
| 710 | lottery 内部大奖/near-miss 效果 |
| 760 | 28 天路线总览 overlay |
| 800 | modal-root、档案导出 sheet、summer reflection dialog |
| 900 | admin panel |
| 920 | admin auth |
| 950 | commitment gate |
| 990 | sparkle |
| 1000 | toast-root |
| 9999 | debug panel |

## 3. 修正过的冲突

- 能量浮窗从普通内容上方的大浮层降为 `120`，低于所有 overlay 和 modal。
- toast 从 `80` 提升到 `1000`，避免在承诺弹窗、modal、抽奖等场景被压住。
- lottery overlay 从 `9500` 收回到 `700`，不再破坏全站层级秩序。
- modal / 档案导出 / summer reflection 统一到 `800`，高于抽奖和路线总览。
- admin overlay 从 `8000/9000` 收回到 `900/920`，仍高于普通 modal，低于 commitment/toast/debug。

## 4. 验证

- `node --check` 全部 `.js/.mjs`：通过。
- 版本号：`index.html` 全部 `?v=20260716q`，`app.js` 关于卡 build 为 `build-20260716q`。
- 截图目录：`docs/review-batch/screenshots/ui-phase-1/`。
- 联系表：`docs/review-batch/screenshots/ui-phase-1/_contact-sheet.jpg`。

## 5. 截图自查

- `01-home-desktop-top.png` / `15-energy-float-collapsed.png`：首页首屏默认收起为小胶囊，不再压住导入框和主要学习入口。
- `16-energy-float-expanded.png`：展开态宽度受控，内容原样可达，超出部分在浮窗内部滚动。
- `12-home-mobile.png`：移动端能量胶囊停在底部导航上方，没有盖住底部导航。
- `17-toast-top-center.png`：toast 顶部居中，可见且不压页面右下操作。
- `18-mobile-nav-active.png`：底部导航激活态为浅 tint 背景 + primary 图标文字，勋章数字 badge 为 `--bad`。

残留观察：移动端能量胶囊仍是 fixed 浮动控件，滚动到页面底部时可能压住低优先级正文区域；本阶段验收重点的导入框、开始专注入口和底部导航未被遮挡。
