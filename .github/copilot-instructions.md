# Copilot 指令

本仓库的规则写在根目录的 `AGENTS.md`，必须遵守。要点：

1. 开工先运行 `node tools/tracking/track.mjs --by session-start`，再读 `docs/TRACKING.md`，按它的 §1 开工。
2. 每完成一项改动，运行 `node tools/tracking/track.mjs --by agent --note "<改了什么、为什么>"` 登记。
3. 收工时按 `docs/TRACKING.md` §9 更新该文件。
