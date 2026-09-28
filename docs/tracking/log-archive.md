# 会话日志归档

> 由 `docs/TRACKING.md` §9 第 4 条维护：TRACKING.md §11 只保留最新 10 条，挤出来的旧日志移到这里，最新的在上。
> 只追加，不改写已有内容。

- 2026-09-25（第十次）：交付第 122b 批，`src/modules/storyWorkspace/` 再落 6 个 0 import 数据 / 逻辑件（分集批量拆分执行、工作区存档快照、摘要运行记录、上传剧本解析、视频风格目录、演示数据），落地不接线。
  - 开工核对：session-start 无变化；本地领先 20 条，比旧 §5 多出的是 `842782e` 台账提交，已在远端分支上。暂存区有前一会话 07:48 留下的 3 个测试草稿（无交接记录），核对后作为底稿采用，原稿备份在 `b122\tests-prev-0748\`。
  - 6 件 prettier(镜像)==暂存，与暂存逐字节一致；`node --check` 12/12，prettier 12/12；自研 46 例沙箱和本机首跑全绿，变异抽查 13/13（首轮 12/13，补 1 例）。
  - src sweep 3624→3670 / 3581→3627 / 43（失败名集合一致）；api 791 未变；受保护文件 MD5 不变；消费方 0 命中。0.7.16 里的 11 个引用方都还没进仓库；`images/story-styles/` 的 94 张缩略图仓库里没有。
  - 专题文档 `docs/src-storyworkspace-batch122.md` 增 §6–§9；orphans 234→240 / 1002；变更 #0024、#0025。
- 2026-09-25（第九次）：经用户授权做分组提交——第 1–121 批遗留的 956 个未提交文件按功能目录切成 17 条 `A.0:` 提交，第 122a 批 27 件和第 122a 收工后的台账各成 1 条，共 19 条；随后按用户指示**只推到新分支 `port/batches-1-122a`**，`origin/master` 仍为 `e12ecd1`，故未触发 mac-arm64 构建（该工作流只监听 master 和手动触发）。
  - 逐批归属先做过测算，结论是不可靠：专题文档互相引用导致命中仅 477/956（49.9%），且 91.6% 的命中文件被多批同时认领，最早认领法把绝大部分文件吸进 2 个批次。按计划预先约定的降级方案改为按功能目录分组，分桶规则与清单可复现。
  - 核对：17 桶逐条 `committed=list` 全等；`git diff --name-only e12ecd1..HEAD` 去重后 956 件全覆盖、无残差；`git status` 为 0/0/0。
  - 受保护件 `api/freeImageHostApi.js` MD5 不变且无任何提交触及；未提交集合内无凭据、无二进制（扫出的 `apiKey`／`mcp-session-id` 字样均为测试假值与文档正文）。
  - 提交期间另一会话交付第 122a 批（变更 #0019–#0021），其 27 个文件未被卷进前 17 条提交，单独成条。
  - 推送走 `http.proxy`（127.0.0.1:7890）；`git ls-remote` 核对远端只有两条分支：`refs/heads/port/batches-1-122a` 等于本地 HEAD，`refs/heads/master` 未变。工作树始终停在 master，未做任何 checkout。
- 2026-09-25（第八次）：交付第 122a 批，`src/modules/storyWorkspace/` 落 11 个 0 import 纯叶，落地不接线。24 件纯叶已全部暂存格式化，按 122a / 122b / 122c 分段。
  - 11 件与暂存逐字节一致，`node --check` 11/11，prettier 22/22；自研 37 例测试沙箱和本机首跑全绿。
  - src sweep 3587→3624 / 3544→3581 / 43（失败名集合一致）；api 791 未变；受保护文件 MD5 不变；消费方 0 命中。
  - 期间用户开始按目录分组提交（`A.0:` 系列），git 计数随之变化；专题文档 `docs/src-storyworkspace-batch122.md`；orphans 223→234；变更 #0019、#0020。
- 2026-09-25（第七次）：交付第 121c 批，`api/story-generation/` 再落 2 件（`storyEpisodeOutlinePlanning`、`storyAssetParallelExtraction`，均为依赖注入工厂），落地不接线；第 121 批至此完成。
  - 2 件过导出闸门，与暂存逐字节一致；`src/domain` 缺失的依赖只在测试里用替身注入，没有落 shim。
  - 自研 34 例测试落地后首跑全绿（沙箱预跑 4 例期望写错，改测试不改实现）；api sweep 757→791（+34）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md` 增 §9–§11；orphans 221→223；git 0/68/884/0 → 0/68/888/0；变更 #0016、#0017。
- 2026-09-25（第六次）：交付第 121b 批，`api/story-generation/` 再落 3 件（`storyAssetRequirementEvidence`、`storyEpisodeScriptTiming`、`storyAssetHybridBudget`），落地不接线。
  - 3 件过导出闸门（HybridBudget 在同段前置件落地后复跑）；27 个导出，与暂存逐字节一致。
  - 自研 47 例测试落地后首跑全绿（沙箱预跑 1 例期望算错，改测试不改实现）；api sweep 710→757（+47）/ 失败 0；src sweep 3587/3544/43 未变，失败名集合一致；受保护文件 MD5 不变。
  - 专题文档 `docs/api-story-generation-batch121.md` 增 §6–§8；orphans 218→221；git 0/68/878/0 → 0/68/884/0；变更 #0013、#0014。
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
