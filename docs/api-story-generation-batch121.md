# 第121批：`api/story-generation/` 第二批（分 121a / 121b / 121c，落地不接线）

批次：第 121 批（纯新增落地，零消费方不接线），按件数拆三段：121a、121b、121c 均已交付
能力区：R06（剧本生成链路：审片协议、复刻补片、调用证据、摘要蓝图、资产提取结果与引用合同、资产需求证据与输出预算、分集剧本审时、分集大纲规划、三路并行资产提取）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\api\story-generation\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b121\port\api\story-generation\`（121a 源码）、`b121\tests\…`（121a 测试）；121b 用 `b121b\port\…` 和 `b121b\tests\…`；121c 用 `b121c\port\…` 和 `b121c\tests\…`
前置：第 119 批 `api/utils/`、第 120 批同目录 10 件，见 `docs/api-story-generation-leaves.md`

---

## 1. 分段

| 段 | 件 | 状态 |
| --- | --- | --- |
| 121a | 第 120 批解阻的 7 件，加链式解阻的 `storyAssetReferenceContract`（需 `storyAssetExtractionResult`，同批先落） | **已交付**（#0010 源码、#0011 测试） |
| 121b | `storyAssetRequirementEvidence`（大纯叶）、`storyEpisodeScriptTiming`（需 `storyInvocationEvidence`）、`storyAssetHybridBudget`（需 `storyAssetRequirementEvidence`） | **已交付**（#0013 源码、#0014 测试），见 §6–§8 |
| 121c | `storyEpisodeOutlinePlanning`（大纯叶）、`storyAssetParallelExtraction`（需 `storyAssetHybridBudget`） | **已交付**（#0016 源码、#0017 测试），见 §9–§11 |

其余件依赖本仓没有的 `src/domain/storyGeneration/*` 或 `api/storyGenerationApi.js`，不在第 121 批范围。

---

## 2. 121a 落地清单

- 8 件全部先过 `b100/verify-exports.mjs`（具名导入逐个核验存在于 `F:/CanvasPro`）。依赖只指向 `api/utils/`（第 119 批）和同目录已落件。

| 文件 | 行 / 字节 | 镜像字节 | 依赖 | 具名导出 |
| --- | --- | --- | --- | --- |
| `storyReviewRequestJournal.js` | 59 / 2 200 | 1 825 | storyTextRequest | `requestStoryReviewRepairs`、`invokeCheckpointedStoryReview`、`assertStoryReviewResolved` |
| `storyReplicationMissingClips.js` | 73 / 3 549 | 3 076 | strictJson、storyTextRequest | `completeReplicationMissingClips` |
| `storyInvocationEvidence.js` | 104 / 3 766 | 3 102 | storyRequestPolicy | `createStoryInvocationLifecycle`、`invokeStoryGenerationRequest` |
| `storyReplicationAssetFrames.js` | 82 / 3 785 | 3 176 | strictJson、storyTextRequest | `addReplicationAssetFrameContract`、`addReplicationAssetFrameSchema`、`attachReplicationAssetFrames` |
| `storyReviewOutputContract.js` | 214 / 9 092 | 7 377 | strictJson、storyTextRequest | `parseReviewResponse`、`parseRepairResponse`、`requestStoryReviewOutput` |
| `storySummaryBlueprint.js` | 377 / 19 231 | 15 963 | strictJson、storyTextRequest | `STORY_SUMMARY_SCHEMA_VERSION`、`STORY_SUMMARY_MAX_CORE_CHARACTERS`、`STORY_SUMMARY_MAX_PLOT_BEATS`、`STORY_SUMMARY_SYSTEM_PROMPT`、`createStorySummaryBlueprint` |
| `storyAssetExtractionResult.js` | 585 / 26 071 | 19 646 | storyAssetPublicText、storyGenerationValues、strictJson、storyAssetExtractionRequest、storyTextRequest | 8 个：两个常量、`mergeStoryAssetVisualPromptRepair`、`normalizeStoryAssetReference`、两个 schema 工厂、两个 parse |
| `storyAssetReferenceContract.js` | 35 / 1 879 | 1 697 | storyAssetExtractionResult | `resolveStoryGenerationAssetRef`、`resolveStoryGenerationAppearanceRef`、`normalizeStoryGenerationAssetReferences`、`STORY_ASSET_REFERENCE_RULES`、`buildStoryAssetReferenceContract` |

- 合计 **1529 行 / 69 573 B / 30 个具名导出**（镜像 55 862 B，差额来自 prettier 格式化）。另有 8 个同名测试文件（82 例）。

---

## 3. 121a 冻结的端口行为（只记录，不打补丁）

- **`strictJson.parseStrictJson`**（第 119 批件，本批依赖面）：空输入抛调用方给的兜底文案；非空但不是 JSON 一律抛「Agent 未返回有效的 JSON。」，不用兜底文案；传入对象原样返回。
- **`storyReviewRequestJournal`**：修复请求每 2 个片段一块，只有超过 2 个片段时 stepId 才加 `:chunk-N`；审片响应按 key 写入 `draft.responses`（写的是文本不是对象），命中缓存直接回放不再请求；请求失败把草稿置 `failed_retryable`、给错误打 `storyReviewInterrupted`、先存检查点再抛出；`assertStoryReviewResolved` 在有未通过片段时清空 `responses`、把含未通过片段的批次按有无 `assessments` 重置为 `reviewed` / `pending`，然后抛错。
- **`storyReviewOutputContract`**：
  - 审片解析按 `clipRefs` 顺序输出；issue 的 `code` 缺省为 `other`，既无 reason 也无 repairInstruction 的 issue 被丢弃。
  - 分集 / 批次不符、`assessments` 不是数组、出现批次外片段是**直接抛出**；遗漏、重复、结论无效、repair 无 issue、pass 带 issue、issues 不是数组是**逐片段收集后用「；」拼接**。
  - 小坑：`pass` 配 `issues: [{}]` 也判「矛盾」，因为矛盾判定看的是原始数组长度，不是过滤后的。
  - 协议补全最多 3 轮，进度存在 `draft.protocolProgress[key]`（accepted / attempt / errors），每轮后存检查点，可断点续跑；只有带错误的轮次才发 `onProgress`；失败错误码 `STORY_REVIEW_PROTOCOL` 且保留进度；成功删掉该 key。修复任务的模板片段 ref 为 `<ref>-part-1`，不带 batchRef。
- **`storyReplicationMissingClips`**：只补一次，不重试。无法分析（请求或响应不是 JSON、没有 segmentPlan、clips 为空、有未知或重复编号、没有缺失）时原样返回；补生成请求改 task 为 `complete_missing_replication_clips`，同步裁剪 segmentPlan、timingContract 和 schema 的 min/max/enum，不改原请求；合并按计划顺序。三种失败都带 `code: REPLICATION_MISSING_CLIPS`、`partialResponse`、`missingClipRefs`。
- **`storyInvocationEvidence`**：`finishReason` 为 `content_filter` / `incomplete` 时无条件拒收；`length` / `max_tokens` / `max_output_tokens`（不分大小写）默认按截断拒收（`type: OUTPUT_TRUNCATED`，带 `partialText`），`allowTruncatedOutput` 才放行。请求失败按 `safeToRetry` 或 `requestSubmitted === false` 记 `not-submitted`，其余记 `outcome-unknown`。指标里 `responseBytes` 按 UTF-8 计（「你好」= 6）。
- **`storyReplicationAssetFrames`**：只给 scene / prop 挂原片代表画面；返回里找不到或有多条同 ref+kind 的帧即抛错；`sourceFrame: null` 不抛错，记 `frameError`；时间要求落在出场事件 `[start, end)` 内、且小于视频时长（时长 > 0 时），来源视频必须在资产的 `sourceChapterIds` 里。
- **`storySummaryBlueprint`**：依赖注入工厂，缺两个函数之一抛 TypeError，返回冻结对象；解析时剧情节点、人物各截到 8 个，连续性事实截到 `continuityMaxFacts`（默认 12）；少于 4 个完整剧情节点即失败；改写模式比其他模式多 1 条「执行优先级」要求（12 条对 11 条）；未知模式按 `generate` 处理。
- **`storyAssetExtractionResult`**：
  - 顶层兼容数组、`assets`、`result.assets`、`data.assets` 以及按类别的别名键（`characters` / `locations` / `道具` 等）；注意 `items`、`objects` 是**道具**别名，只请求场景时不会被识别。
  - 名称上限：角色 12 字、场景和道具 20 字，含逗号、句号、分号、换行或「角色名：」前缀即判为说明文字；角色 role 只能是主角 / 配角 / 反派 / 路人。
  - 多形象道具合并成一个 `<ref>-base`「基础形象」；结果为空时默认抛错并附 `raw` 诊断，只请求道具或 `allowEmptyResult` 时放行。
  - 紧凑协议：合同快照版本不等于 `STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION` 时改用 `createStoryAssetPromptContracts` 现算；必需资产不能排除；非角色不得带 voiceDescription；集数显示为「第1集」，无章节时为「第相关集」。
- **`storyAssetReferenceContract`**：资产 ref 优先 `ref`，形象 ref 优先 `planningRef`（两者顺序相反）；传 `null` 给 `buildStoryAssetReferenceContract` 会抛 TypeError（只有省略参数才走默认空数组）。

---

## 4. 121a 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 开工补记 `track.mjs --by session-start` | 无会话外改动 |
| 跨树具名导出闸门 `b100/verify-exports.mjs` | 8/8 通过 |
| 暂存 ↔ 仓库逐字节比对 | 源码 8/8 SHA256 一致；测试 8/8 与 `apply_patch` 返回哈希一致 |
| `node --check` | 仓库内 `api/story-generation/` 源码 18/18 通过 |
| `prettier --check`（`prettierrc.json`） | 16/16 |
| 自研测试 | **82 例**（ExtractionResult 19、InvocationEvidence 11、ReviewOutputContract 11、SummaryBlueprint 11、ReviewRequestJournal 8、ReplicationAssetFrames 8、ReplicationMissingClips 8、ReferenceContract 6）。沙箱 Node 20 先跑时有 2 例因测试数据写错（名称未超长、用了道具别名键）失败，改测试数据后全绿，实现未改；落地后本机 Node 24 首跑 82/82 |
| `api/**` sweep | **628 / 628 / 0 ⇒ 710 / 710 / 0**（+82） |
| `src/**` sweep | **3 587 / 3 544 / 43** 未变；失败名集合与第 120 批留存名单逐条一致 |
| 消费方反向 grep | `api`/`src`/`electron`/`backend`（排除本目录）对 8 个模块名 **0 命中** ⇒ 落地不接线 |
| git_status | 0/68/861/0 ⇒ 源码与测试落地后 0/68/877/0（+16）；本文档落地后 0/68/878/0 |
| 受保护文件 | `api/freeImageHostApi.js` md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

**未执行 / 边界**：没有启动应用或 Electron，没有发真实模型请求 ⇒ 真实模型能否遵守审片协议、补片效果、截断判定在各厂商上的表现都**未验证**，只证静态契约和离线单测。

---

## 5. 接线观察（本批不动）

- 本仓 0 个消费方。0.7.16 里这些件由 `storyEpisodeSplitQualityReview`、`storyAssetParallelExtraction` 等同目录件和 `api/storyGenerationApi.js` 组装；前者依赖 `src/domain/storyGeneration/*`，本仓没有。
- `storySummaryBlueprint` 是第 120 批 `storySummaryGeneration` 需要的协作者之一，两者现在都在仓内，但组装还缺 `validateStoryPlanningConstraints` 等来自 `src/domain/storyGeneration` 的函数。
- 接线会改变剧本生成行为，按 TRACKING §7.4 须单独成批、写清差异、用户授权后真机验证。

---

## 6. 121b 落地清单

- `storyAssetRequirementEvidence` 是 0 import 大纯叶；`storyEpisodeScriptTiming` 过了导出闸门；`storyAssetHybridBudget` 首跑闸门时同段前置件还没落地（DEP-FAIL 属预期），本地沙箱核对具名导入存在，前置件落地后在仓库复跑闸门通过。

| 文件 | 行 / 字节 | 镜像字节 | 依赖 | 具名导出 |
| --- | --- | --- | --- | --- |
| `storyAssetRequirementEvidence.js` | 765 / 34 424 | 28 565 | 无 | 10 个：schema 版本常量、`createStoryAssetRequirementEvidencePlan`、`createStoryAssetActionPropCandidates`、可选候选两版（对象 / 名称）、3 个 `getHardRequired*`、上传回退角色、`isNarrativeStoryCharacterFragment` |
| `storyEpisodeScriptTiming.js` | 430 / 21 912 | 18 415 | storyGenerationValues、strictJson、storyTextRequest、storyInvocationEvidence | 7 个：运行时指引、`inspectStoryEpisodeScriptTiming`、分镜预算的 resolve / assert、`requestStoryEpisodeScriptTimingReview`、`preserveStoryEpisodeScriptWithoutTimingReview`、`ensureStoryEpisodeScriptTiming` |
| `storyAssetHybridBudget.js` | 406 / 17 384 | 13 954 | storyAssetRequirementEvidence、storyAssetExtractionRequest、storyAssetPublicText | 10 个：4 个常量、`createBudgetedStoryAssetEvidenceProject`、`createStoryAssetAuthoritativeSourceFingerprint`、两个 token 估算、`resolveStoryAssetFocusedOutputMode`、`assertStoryAssetFocusedOutputCapacity` |

- 合计 **1601 行 / 73 720 B / 27 个具名导出**（镜像 60 934 B）。另有 3 个同名测试文件（47 例）。

---

## 7. 121b 冻结的端口行为（只记录，不打补丁）

- **`storyEpisodeScriptTiming`**：
  - 对白下限只数「说话人：“引号内文字”」和旁白 / VO / OS / 画外音整行；说话人前缀超过 24 字、或是字幕 / 屏幕 / 文字 / 音效的行不算。汉字按字、英文数字按词，每秒 5 个。
  - 小坑：`inspectStoryEpisodeScriptTiming` 没有大纲时长时返回 `outlineEstimateSeconds: 0`，而 `createStoryEpisodeScriptRuntimeGuidance` 返回 `null`。
  - 分镜预算：制作浮动区间 = 审时区间 ×0.8 / ×1.2；目标时长取自然时长（落在区间内时），否则取区间中点；超出即抛 `STORY_EPISODE_SPLIT_TIMING_MISMATCH`。
  - 审时请求固定 `temperature 0.1`、关闭 thinking、`maxOutputTokens 8192`；无效 verdict 按 `needs_revision` 处理，此时必须有 reason 和 findings；逐场账本分项合计容差 max(2 秒, 5%)，场次总和对整集容差 max(5 秒, 5%)。
  - `ensureStoryEpisodeScriptTiming`：首审不通过、或首审上限低于对白下限时再审一次；结论分 single-pass / overlapping-ranges / quality-disagreement / below-spoken-floor / conflicting-ranges；**任何异常都不阻塞**，改为保留正文并标 `timing_uncertain`（review-unavailable）。
- **`storyAssetRequirementEvidence`**：
  - 三级：hard-required / optional-candidate / ignored，同名同类合并时取最高级，contexts 最多 3 条。
  - 结构化场景标题和出场角色 → hard；`source: upload-fallback` 的 → optional；本地实体候选要在正文里找得到原文才算 optional；动作直宾道具（取出 / 拿起 / 把…交给 等）→ hard。
  - 《》书名：前面紧跟「第N集 / 本章 / 标题」等结构前缀 → ignored；附近有翻开、签署等物理动作或「一本 / 原件」等实物线索 → hard；其余 → optional。
  - 小坑：「拿起这些材料」会抽出「些材料」（先去掉「这」，再按「这些材料」判非资产时对不上）。
  - 同名跨类别候选要最高置信度 ≥ 0.75 且领先 ≥ 0.15 才归类，否则丢弃；hard 名单里的类别优先。
  - 预算抽样按场景「首、中、尾、再取最远」轮转，字符预算按 JSON 序列化长度计；每个候选最多保留 3 个分散的来源场景。
- **`storyAssetHybridBudget`**：
  - 每类 ≤ 16 项且详细输出估算 ≤ 上限 80% 用 verbose，否则用 compact；compact 候选同时受 token 上限和合同序列化 8000 字符约束；必需资产本身超出 compact 预算时在调 API 前抛 `ASSET_OUTPUT_CAPACITY`。
  - 候选与必需名去重按 NFKC、去掉非字母数字后比较。
  - 小坑：正文预算在**全部**场景间平分，没有 `episodeRef` 的场景也占份额，但不会出现在任何章节里。
  - 源指纹是 UTF-16 码元上的 FNV-1a，格式 `source-v1-<场景数>-<总长>-<hex>`。

---

## 8. 121b 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b100/verify-exports.mjs` | 3/3（HybridBudget 在前置件落地后复跑） |
| 暂存 ↔ 仓库逐字节比对 | 源码 3/3 SHA256 一致；测试 3/3 与 `apply_patch` 返回哈希一致 |
| `node --check` | 3/3 |
| `prettier --check` | 6/6 |
| 自研测试 | **47 例**（ScriptTiming 20、RequirementEvidence 16、HybridBudget 11）。沙箱预跑时 1 例因期望算错（1000 token 上限下空类别仍走 verbose）失败，改期望后全绿，实现未改；落地后本机 Node 24 首跑 47/47 |
| 源指纹金标值 | `source-v1-2-13-debc6686` 由独立 Python FNV-1a 算出 |
| `api/**` sweep | **710 / 710 / 0 ⇒ 757 / 757 / 0**（+47） |
| `src/**` sweep | **3 587 / 3 544 / 43** 未变，失败名集合一致 |
| 消费方反向 grep | 3 个模块名在本目录外 **0 命中** |
| git_status | 0/68/878/0 ⇒ 0/68/884/0（+6；本段文档是更新已有文件，不增加未跟踪数） |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

**未执行 / 边界**：没有真实模型请求，双审时长协议在真实模型上的一致性、候选预算对提取质量的影响都**未验证**。

---

## 9. 121c 落地清单

- 两件都只有一个具名导出，是工厂函数：其余依赖都靠调用方注入，所以本批不引入对 `src/domain` 的 import。

| 文件 | 行 / 字节 | 镜像字节 | 相对 import | 具名导出 |
| --- | --- | --- | --- | --- |
| `storyEpisodeOutlinePlanning.js` | 940 / 45 609 | 37 147 | 无（28 项依赖全部注入） | `createStoryEpisodeOutlinePlanningApi`：返回 8 个函数和 `STORY_EPISODE_OUTLINE_CHECKPOINT_VERSION`（=1） |
| `storyAssetParallelExtraction.js` | 1079 / 48 231 | 35 271 | storyRequestPolicy、storyAssetHybridBudget、storyAssetExtractionRequest | `createParallelStoryAssetExtractor`：10 项注入依赖，返回一个 async 提取函数 |

- 合计 **2019 行 / 93 840 B / 2 个具名导出**（镜像 72 418 B）。另有 2 个同名测试文件（34 例）。

---

## 10. 121c 冻结的端口行为（只记录，不打补丁）

- **`storyEpisodeOutlinePlanning`**：
  - 工厂不校验注入依赖，返回普通对象（未冻结）；骨架提示词的构造函数没有导出。
  - 不超过 20 集时一次请求出完整大纲（temperature 0.35，最多 2 次，修复重试用 0.15）；这时如果传入断点，直接抛 `CHECKPOINT_INCOMPATIBLE`。
  - 超过 20 集时，先请求全剧骨架（修复重试 0.2），再按注入的 batchSize 分批细化（0.3，修复重试 0.15）。骨架完成和每批完成后都调用 `onCheckpoint`（version 1）。
  - 续跑时，下面几种情况都抛「分集大纲断点版本或输入不兼容」：版本不符、episodeCount 不符、缺 `skeleton.episodes`、缺 `plannedEpisodes`。`nextBatchIndex` 超出批数，或已规划集数和已完成批次对不上，抛「断点内容不完整」。
  - `previousEndingState` 缺省时，取已规划最后一集的 endingState。`resumeResponses` 按 `complete` / `skeleton` / `detail:N` 回放。
  - 解析：骨架解析和完整解析都按下标重编 number；批次解析沿用骨架的 number，ref 必须和骨架逐位一致。完整解析会静默丢掉缺 title、synopsis 或 hook 的集。
  - 批次提示词里的人物，只保留本批和下一集 activeCharacters 里出现的；空的 endingState 按 null 传。
  - 只有 `project.originalCreative` 非空时才追加审时复核（temperature 0.1，只请求 1 次，不重试）。复核给出的自然时长会覆盖 estimatedDurationSeconds。
  - verdict 在本地重算：原估算落在复核给出的区间内才算 consistent，不采信模型自己给的结论。findings 最多保留 8 条，对象格式化为「[ref] issue 证据：evidence」。
  - `onInvocation` 的状态有 prepared、completed、not-submitted、outcome-unknown 四种；`safeToRetry === true` 或 `requestSubmitted === false` 视为未提交。
- **`storyAssetParallelExtraction`**：
  - 草稿策略名是 `kind-detailed-parallel-v1`。源指纹是 JSON 串的 32 位 FNV-1a，格式为 `<schemaVersion>-<8 位 hex>-<长度>`；每类资产另有一份合同指纹。
  - 角色、场景、道具三类用 `Promise.allSettled` 并行。compact 通道如果必需名是空数组、又没有候选，就在本地直接完成，不发请求；verbose 通道没有这个待遇。
  - 付费保护：
    - 一拿到响应就记下 `paidResponseReceived` 和原文。
    - 空响应或校验失败 → `blocked-paid-response`。
    - 请求报错且 status 是 400/401/403/404/409/422/429 → 视为确认未计费，状态记为 failed。
    - 其他异常 → `blocked-ambiguous-submission`。
    - 整体报错取第一个失败类别的原因。type 先看有没有 `ASSET_PAID_RESULT_BLOCKED`，其次看 `ASSET_SUBMISSION_AMBIGUOUS`。
  - 续跑：先在本地重放已保存的原文，不发请求；然后只请求还没成功的类别。quality-rerun、incompatible、ambiguous 三种阻断都在发请求前抛出。
  - 授权重跑要求 `paidRerunAuthorization.confirmed === true`，并且类别在 `authorizedKinds` 里；重跑前先把旧结果归档到 `paidResponseHistoryByKind`。
  - 剧本来源变了（新指纹不在别名集里）时，所有留有付费痕迹的类别都会被阻断。`requiredAssetsByKind` 变了只阻断对应类别，可以用 `allowSavedPaidResultContractRevalidation` 放行。
  - 视频复刻（`sourceMode: video-replication`）的请求会套上 `withStoryRequestPolicy`（stream，空闲 3 分钟 / 总计 30 分钟）。
  - 小坑：引用冲突时，后缀加在兜底引用上，例如 `scene-1-2`、`scene-a-appearance-1-2`，而不是加在原引用上。
  - 小坑：即使被阻断，草稿的 sourceFingerprint 也会改写成当前指纹。拿这份阻断草稿再续跑，仍然会被阻断，但错误文案会变成「缺少其原始合同快照」。

---

## 11. 121c 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b100/verify-exports.mjs` | 2/2（Parallel 的 3 条具名导入全部 ok） |
| 暂存 ↔ 仓库逐字节比对 | 源码 2/2 SHA256 一致；测试 2/2 与 `apply_patch` 返回的哈希一致 |
| `node --check` | 2/2 |
| `prettier --check` | 4/4 |
| 自研测试 | **34 例**（Outline 18、Parallel 16）。沙箱预跑时 Parallel 有 4 例期望写错（引用冲突的后缀、重放优先于授权重跑、阻断后指纹被改写），改了期望后全绿，实现没动；落地后远端首跑 34/34 |
| 测试替身 | `src/domain` 缺失的连续性归一化、规划约束、剧本模式、项目输入归一化，用测试内替身注入；其余用仓内真实 helper（storyTextRequest、storySummaryBlueprint、storyAssetExtractionResult 等）；没有落任何 shim |
| `api/**` sweep | **757 / 757 / 0 ⇒ 791 / 791 / 0**（+34） |
| `src/**` sweep | **3 587 / 3 544 / 43** 未变，失败名集合一致 |
| 消费方反向 grep | 2 个模块名在本目录外 **0 命中** |
| git_status | 0/68/884/0 ⇒ 0/68/888/0（+4） |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

**未执行 / 边界**：没有发过真实模型请求。分批大纲在真实模型上是否连贯，并行提取的计费保护遇到真实厂商错误码时表现如何，都**未验证**。两个工厂目前也没有调用方，真正装配要等 `src/domain/storyGeneration` 就位。


