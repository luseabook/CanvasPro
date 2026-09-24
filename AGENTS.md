# AGENTS.md · 本仓库的强制规则

> 适用于所有 AI 助手（Qoder、Codex、Cursor、Claude、Copilot，以及通过 MCP 接入的任何智能体）和开发者。
> 这些规则**强制执行**，用户不会逐条提醒。与其他说明冲突时，以本文件和 `docs/TRACKING.md` 为准。

## 1. 开工（每个新对话都要做，按顺序）

1. **补记会话外的改动**：运行 `node tools/tracking/track.mjs --by session-start`。
   它会把上次记录之后发生的所有文件变化（包括用户手动改的）写进变更记录。
2. **读跟踪文档**：读 `docs/TRACKING.md`（一次就能读完），按它的 §1 开工。
   - 想知道最近发生了什么，就看当月变更记录 `docs/tracking/changes/` 里最新那个文件的末尾几条。
   - **不要通读整个项目**。需要细节时，按 TRACKING.md 给的路径去读。

## 2. 改动必须留痕

3. 只按 `docs/TRACKING.md` §2 的硬规则改动仓库。
4. **每完成一项改动**（一批移植、一次修复、一次文档调整），立刻运行：
   `node tools/tracking/track.mjs --by agent --note "<改了什么、为什么>"`
   - 脚本会比对文件快照，把新增、修改、删除的文件和行数变化追加到 `docs/tracking/changes/<年-月>.md`。
   - 后台自动监视可能已经先记下了文件清单。这时脚本会追加一条「说明」，把原因补上。

## 3. 收工

5. 按 `docs/TRACKING.md` §9 更新该文件，再运行一次第 4 步的命令，说明写「收工：……」。

## 4. 例外与禁止

- **不能运行命令时**：照样读 `docs/TRACKING.md` 并遵守规则；改完后在 TRACKING.md §11 手写一条记录。文件级的变化会在下一次有人运行脚本时自动补记，不会丢。
- **禁止**：
  - 修改或删除 `docs/tracking/changes/` 里已有的记录；
  - 手改 `docs/tracking/state/`；
  - 停用自动监视任务（`.vscode/tasks.json` 里的「CanvasPro 变更跟踪」），除非用户明确要求。

## 5. 主机提示

- Windows，工作区 `F:\CanvasPro`，shell 是 PowerShell 5.1：命令用 `;` 分隔，不支持 `&&`。
- 通过 MCP 接入时，上面的命令用 `run_command` 执行，建议参数 `execution:"direct"`、`background:false`。
