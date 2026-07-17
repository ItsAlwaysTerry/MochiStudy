# UI Phase 0 Report

执行日期：2026-07-17

范围：按 `docs/ui-redesign-plan.md` Phase 0 落地 token、组件基础类、机械迁移硬编码样式、迁移静态 inline style。未改业务逻辑、数据结构、localStorage key。

## 1. Token / 组件落地

- `:root` 新增第三节要求的色彩、圆角、阴影、间距、字号 token。
- 旧 token 未删除，已改为新 token 的别名：如 `--radius-card: var(--r-lg)`、`--radius-small: var(--r-md)`、`--muted: var(--ink-2)`、`--outline: var(--line)`。
- `--study-reading-*` 阅读字号系统原样保留。
- `.btn` / `.btn-primary` / `.btn-soft` 就地改造；`.btn-soft` 按 tonal 规范保留类名；新增 `.btn-tonal`、`.btn-ghost`、`.btn-sm`。
- 新增基础类：`.seg` / `.seg-item`、`.chip`、`.card-sub`、`.field` 统一样式基础。
- `.card` 统一为白底、`--r-lg`、`--shadow-1`、无边框。保留 `.home-status-body > .card` 的内嵌边框，原因是它是折叠抽屉内的内容分隔，不是页面级 `.card`。

## 2. 映射表

### 圆角

| 改前值 | token / 处理 | 迁移处数 |
|---|---:|---:|
| `999px` | `var(--r-full)` | 64 |
| `50%` | `var(--r-full)` | 13 |
| `20px` | `var(--r-lg)` / pill 语境改 `--r-full` | 6 |
| `24px` / `28px` / `30px` / `36px` 多值 | `var(--r-lg)`，方向性保留为多值 token | 5 |
| `16px` / `18px` | `var(--r-lg)` | 27 |
| `8px` / `10px` / `12px` / `14px` | `var(--r-md)` | 107 |
| `3px` / `5px` / `6px` | `var(--r-xs)` | 9 |
| 方向性圆角如 `0 8px 8px 0` | `0 var(--r-md) var(--r-md) 0` | 1 |

### 字号

| 改前值 | token / 处理 | 迁移处数 |
|---|---:|---:|
| `9px` / `10px` / `11px` / `12px` | `var(--fs-xs)` | 183 |
| `13px` | `var(--fs-sm)` | 70 |
| `14px` / `15px` | `var(--fs-base)` | 56 |
| `16px` / `17px` / `18px` | `var(--fs-md)` | 52 |
| `20px` / `21px` / `22px` | `var(--fs-lg)` | 31 |
| `24px` / `25px` / `26px` / `28px` / `30px` | `var(--fs-xl)` | 24 |
| `32px` / `34px` / `36px` / `38px` / `40px` | `var(--fs-num)` | 9 |
| `46px+` / 番茄钟大数字 / 抽奖大数字 | 保留专用大字号 | 未迁移 |
| `--study-reading-*` / 数学 inline `em` | 保留 | 未迁移 |

### 颜色

| 改前值 | token / 处理 | 迁移处数 |
|---|---:|---:|
| `#fff` / `#ffffff` | `var(--surface)` 或 `var(--primary-ink)` 语境 | 84 |
| `#fff9f0` / `#f9f3ea` / `#f3ede4` / `#e7e2d9` | `var(--bg)` / `var(--surface-dim)` | 3+ |
| `#864d61` / `#6a364a` / `#9d4258` / `#9f314f` | `var(--primary)` | 9 |
| `#2f6a3f` | `var(--chem)` / `var(--tertiary)` | 5 |
| `#4a4580` | `var(--physics)` | 2 |
| `#4caf7d` / `#4caf50` / `#50b070` / `#27ae60` / `#2ea843` | `var(--good)` | 5 |
| `#e0a93a` | `var(--warn)` | 1 |
| `#c96b6b` / `#e53935` / `#c0392b` / `#b23336` | `var(--bad)` | 4 |
| `#f5c518` / `#ffd76a` | `var(--gold)` in non-skipped UI | 7 |
| `#9e9e9e` / `#b9a9ad` / `#a08a90` | `var(--ink-3)` | 6 |
| `#514347` / `#6b5b60` / `#3a2c30` | `var(--ink-2)` / `var(--ink)` | 5 |

## 3. 改后统计

基线：

- `style.css` hex：309 处 / 116 种
- `style.css` `border-radius`：294 处 / 26 种
- `style.css` `font-size`：539 处 / 41 种
- inline style：115 处

改后：

- `style.css` hex：176 处 / 98 种；排除 `:root` token 定义后为 153 处 / 80 种
- `style.css` 剩余硬编码圆角：46 处 / 11 种，主要在跳过区
- `style.css` 剩余硬编码字号：101 处 / 26 种，主要在跳过区和专用大数字
- inline style：26 处，均为动态样式

## 4. Inline Style 迁移

| 文件 | 改前 | 改后 | 说明 |
|---|---:|---:|---|
| `index.html` | 2 | 0 | `build-label`、`debug-panel` 静态样式迁入 CSS |
| `app.js` | 77 | 11 | 静态 margin/full-width/flex/text 样式迁入类 |
| `modules/farm.js` | 10 | 4 | 保留 crop sprite / progress 动态样式 |
| `modules/knowledgeMap.js` | 6 | 3 | 保留 subject color 动态变量 |
| `modules/pet.js` | 6 | 1 | 保留休息进度宽度 |
| `modules/reviewPage.js` | 6 | 1 | 保留 subject color 动态变量 |
| `modules/summerTasks.js` | 5 | 3 | 保留 reward angle / width 动态值 |
| `modules/todayStudy.js` | 3 | 3 | 保留 subject color / value 动态变量 |

保留的动态样式类型：

- 进度宽度：`width:${pct}%`、`width:${stagePct}%`、`width:${harvestPct}%`
- CSS 变量：`--subject-color`、`--item-color`、`--reward-angle`
- 动画/随机值：`animation-delay:${i * 55}ms`、随机 pile transform
- SVG / canvas / lottery 运行态颜色：`color:${typeColor}`、`background:${typeColor}22`
- sprite 动态定位：`style="${cropSpriteStyle(subject, stage)}"`

## 5. 跳过未动

- 抽奖 overlay 深色牌桌主题：按计划 Phase 5 统一，不在 Phase 0 改。
- 今日能量 / 暑假奖励金黄与橙色体系：保留奖励语境，Phase 5 再桥接。
- 农场精灵图本体：保留 PNG sprite、`image-rendering: pixelated` / `crisp-edges`，并明确补上 `mix-blend-mode: screen`。
- 科目色大面积用法：不在 Phase 0 改布局/语义，后续 Phase 3/5 处理。
- `--study-reading-*` 与数学公式 `em` 字号：用户可配置阅读系统，原样保留。
- 番茄钟、抽奖、奖励大数字：保留专用展示字号，未强压到 32px。

## 6. 验证

- `node --check app.js`
- `node --check modules/*.js`
- `node --check docs/review-batch/screenshots/capture-ui.mjs`
- 截图脚本：`docs/review-batch/screenshots/capture-ui.mjs`，默认输出 `ui-phase-0`；后续可传参数复用，例如 `node docs/review-batch/screenshots/capture-ui.mjs ui-phase-1`
- 截图目录：`docs/review-batch/screenshots/ui-phase-0/`
- 联系表：`docs/review-batch/screenshots/ui-phase-0/_contact-sheet.jpg`

截图结果：生成 19 张 PNG，覆盖旧 manifest 的 01~14 编号视角。首次截图时 Material Symbols 字体未等待完成，脚本已修正为截图前等待 `document.fonts.ready` 并重拍。

QA 结论：未发现由 token/inline 迁移导致的明显布局破坏。`10-today-energy-float-crop.png` 仍显示能量浮窗尺寸偏大、遮挡主页面，这是旧审计已记录的 Phase 1 问题；本阶段未调整位置或布局。
