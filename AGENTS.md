# AGENTS.md · 本仓库的强制规则

> 适用于所有 AI 助手（Qoder、Codex、Cursor、Claude、Copilot，以及通过 MCP 接入的任何智能体）和开发者。
> 这些规则**强制执行**，用户不会逐条提醒。与其他说明冲突时，以本文件和 `docs/TRACKING.md` 为准。

## 0. 当前状态：跟踪机制已暂停

用户已于 2026-09-29 明确要求停用跟踪机制。

- 不要运行 `node tools/tracking/track.mjs --by session-start`、`--by agent`、`--watch` 或同类登记命令。
- 不要恢复 `.vscode/tasks.json` 的 `folderOpen` 自动启动。
- 改代码或文档后照常完成开发与验证，但不要等待跟踪脚本补记。
- 只有用户明确要求「恢复跟踪机制」时，才恢复上述命令和自动监视。

## 1. 开工（每个新对话都要做，按顺序）

1. **补记会话外的改动（当前暂停）**：用户未要求恢复跟踪时，不要运行 `node tools/tracking/track.mjs --by session-start`。
   它会把上次记录之后发生的所有文件变化（包括用户手动改的）写进变更记录。
2. **读跟踪文档**：读 `docs/TRACKING.md`（一次就能读完），按它的 §1 开工。
   - 想知道最近发生了什么，就看当月变更记录 `docs/tracking/changes/` 里最新那个文件的末尾几条。
   - **不要通读整个项目**。需要细节时，按 TRACKING.md 给的路径去读。

## 2. 改动必须留痕

3. 只按 `docs/TRACKING.md` §2 的硬规则改动仓库。
4. **每完成一项改动（当前暂停）**：用户未要求恢复跟踪时，不要运行：
   `node tools/tracking/track.mjs --by agent --note "<改了什么、为什么>"`
   - 脚本会比对文件快照，把新增、修改、删除的文件和行数变化追加到 `docs/tracking/changes/<年-月>.md`。
   - 后台自动监视可能已经先记下了文件清单。这时脚本会追加一条「说明」，把原因补上。

## 3. 收工

5. **当前暂停**：不要按 `docs/TRACKING.md` §9 运行第 4 步的登记命令；按常规开发流程完成收尾即可。

## 4. 例外与禁止

- **不能运行命令时**：照样读 `docs/TRACKING.md` 并遵守规则；改完后在 TRACKING.md §11 手写一条记录。文件级的变化会在下一次有人运行脚本时自动补记，不会丢。
- **禁止**：
  - 修改或删除 `docs/tracking/changes/` 里已有的记录；
  - 手改 `docs/tracking/state/`；
  - 停用自动监视任务（`.vscode/tasks.json` 里的「CanvasPro 变更跟踪」），除非用户明确要求。
- **当前暂停状态**：用户已于 2026-09-29 明确要求停用跟踪机制，因此本地 `.vscode/tasks.json` 的跟踪任务已清空；恢复前不要重建或运行。

## 5. 主机提示

- Windows，工作区 `F:\CanvasPro`，shell 是 PowerShell 5.1：命令用 `;` 分隔，不支持 `&&`。
- 通过 MCP 接入时，上面的命令用 `run_command` 执行，建议参数 `execution:"direct"`、`background:false`。
