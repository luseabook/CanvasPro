# 会话日志归档

> 由 `docs/TRACKING.md` §9 第 4 条维护：TRACKING.md §11 只保留最新 10 条，挤出来的旧日志移到这里，最新的在上。
> 只追加，不改写已有内容。

- 2026-09-25（第二次）：上线全自动跟踪机制。
  - 新增 `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`；`README.md` 顶部加入口提示。（试过在 `.agents/skills/` 放项目技能，MCP 桥不会扫描，已删除。）
  - 新增 `tools/tracking/track.mjs`（零依赖的变更记录脚本）和 `.vscode/tasks.json`（打开文件夹时自动启动监视）；已建立基线并启动监视。
  - 本文件新增 §1.1 常设授权和 §12 变更记录机制；§1、§2、§3.3、§9 相应调整。
  - git：改动前 0/67/820/0，改动后 0/68/825/0。监视进程已自动记下 #0002（入口文件和本文件的改动），端到端验证通过。
- 2026-09-25：通读全项目（1674 个文件）后建立本跟踪体系。
  - 新增 `docs/TRACKING.md`，以及 `docs/tracking/` 下的 project-map、batches、orphans 三份文档。
  - 在 `docs/next-session-prompt.md` 顶部加了一段说明，指向本文件。
  - 没有改业务代码，没有跑测试。
  - git：改动前 0/67/816/0，改动后 0/67/820/0。
