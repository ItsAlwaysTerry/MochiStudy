# Codex 分工协议（Claude 指挥 + Codex 干杂活）

目的：把"读文件、查资料、扒资源、机械执行"这类**低端但耗 token** 的活交给本机的 Codex CLICLI，Claude 只负责**做计划、写任务、审查产物**，省 Claude 的 token。

已验证环境：`codex-cli 0.137.0`，`codex exec` 可无头运行、能读图(`-i`)、能联网(B 站有反爬会降级)、`-o` 只把最终一句话写文件。

## 核心省 token 原理

Codex 干 N 步(读文件/搜网/扒数据)全在**它自己**的上下文里；Claude 不看它的过程,只读它**最终写进文件的产物**。所以：

- Codex 的完整过程 → 重定向进日志文件,Claude **不读**。
- Codex 的成果 → 写成结构化文件(表格/JSON),Claude **只读这个**。

## 调用模板（Claude 用 Bash 跑）

```bash
cd "D:/Agent工作区/mochistudy-v34/mochistudy" && \
timeout 600 codex exec -s workspace-write \
  -o /tmp/codex-last.txt \
  [-i 截图1.png -i 截图2.png] \
  "任务说明……把结果写成 <约定格式> 保存到 docs/resources/xxx.md，只输出这一件事。" \
  > /tmp/codex-run.log 2>&1
echo "exit=$?"; cat /tmp/codex-last.txt        # 只看一句话汇报
# 然后 Claude 只 Read docs/resources/xxx.md 这个产物，不看 /tmp/codex-run.log
```

沙箱级别：
- `read-only`：纯查资料/读代码/搜网，不写盘（最安全，默认优先）。
- `workspace-write`：需要它产出文件时用（写在 repo 内）。
- 不用 `--dangerously-bypass-approvals-and-sandbox`，除非明确要它连续改代码且我会审 diff。

## 分工边界

| 交给 Codex（杂活） | Claude 自己做（高端） |
|---|---|
| 读截图提取 B 站视频标题/时长/博主 | 定 28 天路线怎么排、哪个知识点缺 |
| 判断每个视频覆盖哪个知识点（给它预设知识点列表） | 审查 Codex 交的资源表，决定收录哪些 |
| 去 B 站核对 BV 号/分集/时长（能连但会打折） | 把资源填进 `ROUTE_VIDEO_LIBRARY` / `ROUTE_DAYS` 的代码改动 |
| 批量读文件、grep、整理清单 | 架构决策、状态机重构、UI 逻辑 |
| 机械重复的文件改写（我审 diff） | 任何涉及数据结构/备份/农场的改动 |

## 资源采集这类任务的标准流程（你的主用例）

1. 你把小红书截图 + B 站链接丢进一个文件夹，例如 `docs/resources/_inbox/`。
2. 告诉 Claude "物理第 X 天要补资源，素材在 _inbox"。
3. Claude 写一段任务，用 `codex exec -i 截图...` 让 Codex：
   - 读截图里的所有视频标题；
   - 对每个标题按**预设知识点列表**(见 CLAUDE.md)判断覆盖点；
   - 能连网就去核对 BV/时长/博主；
   - 输出成固定表格 `docs/resources/物理-第X天.md`：
     `| 标题 | 博主 | 时长 | BV | 覆盖知识点 | 建议放第几天 | 备注(是否核实) |`
4. Codex 写好，Claude **只读这张表**，审查、挑选、填进代码。

## 审查纪律（重要）

- Codex 说"已核实"的 BV/时长，Claude 抽查几条，不全信（B 站反爬 + 模型可能编）。
- Codex 若被允许改代码，Claude 一律看 `git diff` 后再决定要不要留，绝不盲信。
- 表格里没把握的行让 Codex 标"待核实"，不许编造（和网站"不出现半成品"原则一致）。

## 局限（诚实）

- Claude 读 Codex 的产物**仍花 token**，只是比自己跑 N 步省得多；小任务不值当,直接 Claude 干。
- B 站反爬：live 抓取富数据(时长/BV)不稳，**截图里能看到的信息最可靠**，优先让 Codex 读图。
- 小红书基本没法 live 抓（登录墙）——一律走"你截图 → Codex 读图"。
- Codex 是另一个模型(OpenAI)，用的是你的 Codex 额度，不是 Claude 额度。
