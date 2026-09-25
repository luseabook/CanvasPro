# 会话日志归档

> 由 `docs/TRACKING.md` §9 第 4 条维护：TRACKING.md §11 只保留最新 10 条，挤出来的旧日志移到这里，最新的在上。
> 只追加，不改写已有内容。

- 2026-09-25（第五次）：交付第 121a 批，`api/story-generation/` 再落 8 件（第 120 批解阻的 7 件 + 链式解阻的 `storyAssetReferenceContract`），落地不接线。
  - 8 件全部过导出闸门；源码 30 个导出，与暂存逐字节一致；`node --check` 18/18。
  - 自研 82 例测试落地后首跑全绿（沙箱预跑时 2 例测试数据写错，改测试不改实现）；api sweep 628→710（+82）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md`；orphans 210→218；git 0/68/861/0 → 0/68/878/0；变更 #0010、#0011。
- 2026-09-25（第四次）：交付第 120 批，`api/story-generation/` 首批 10 件（8 纯叶 + 2 件依赖 `api/utils/`），落地不接线。
  - 镜像目录实有 32 件（LEAF 10 / OK 2 / BLK 20）；2 个 OK 件过了导出闸门；两个大纯叶留给第 121 批。源码 29 个导出，与暂存逐字节一致。
  - 自研 96 例测试首跑全绿；api sweep 532→628（+96）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合与 `b85-fails.txt` 一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-leaves.md`；orphans 200→210；git 0/68/840/0 → 0/68/861/0；变更 #0007、#0008。
- 2026-09-25（第三次）：交付第 119 批，`api/` 请求响应工具区 7 个零 import 纯叶，落地不接线。
  - 新建 `api/utils/`，落了 strictJson、storyGenerationValues、storySceneIdentity、storyAssetPublicText，另有 `api/` 下 mediaUploadErrors、runningHubWorkflowPollingPolicy、runningHubUploadResponse；共 25 个导出，与暂存逐字节一致。
  - 自研 57 例测试首跑全绿；api sweep 475→532（+57）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合与 `b85-fails.txt` 一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-request-response-utils.md`；orphans 193→200；git 0/68/825/0 → 0/68/840/0。
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
