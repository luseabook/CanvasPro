# 第120批：`api/story-generation/` 首批 10 件（8 纯叶 + 2 件依赖 `api/utils/`，落地不接线）

批次：第 120 批（纯新增落地，零消费方不接线）
能力区：R06（剧本生成链路：请求策略、严格 JSON 请求、摘要生成、分集剧本提示词、口播时长、复刻流程提示词、资产合同）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\api\story-generation\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b120\port\api\story-generation\`（源码）、`b120\tests\api\story-generation\`（测试，prettier 用）

---

## 1. 选件与落地清单

- 镜像目录实有 **32 件**（不是 §7.1 预估的 10 件），全部是单行压缩代码。`b95/deps-ast.mjs` 分级：LEAF 10、OK 2、BLK 20。
- 本批取 **8 个小纯叶 + 2 个 OK 件**。两个大纯叶 `storyAssetRequirementEvidence`（28 565 B）和 `storyEpisodeOutlinePlanning`（37 147 B）留给第 121 批。
- 两个 OK 件先过了跨树导出闸门 `b100/verify-exports.mjs`：
  - `storyAssetExtractionRequest` ⇐ `../utils/storyGenerationValues.js` :: `normalizeStringArray`、`normalizeText`
  - `storyAssetRequiredContracts` ⇐ `../utils/storySceneIdentity.js` :: `getStorySceneIdentityKey`

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyRequestPolicy.js` | 8 / 382 | 339 | `withStoryRequestPolicy`、`withReplicationRequestPolicy` |
| `storyAssetVoicePolicy.js` | 2 / 625 | 620 | `STORY_ASSET_VOICE_DESCRIPTION_RULE` |
| `storyEpisodeScriptResponseRecovery.js` | 22 / 898 | 774 | `repairStoryEpisodeScriptMissingBodyTerminators` |
| `storyTextRequest.js` | 80 / 3 174 | 2 670 | `buildStoryTextProviderProfilePayload`、`assertPlanningModel`、`getResultText`、`requestStrictResult` |
| `storySummaryGeneration.js` | 117 / 4 755 | 3 847 | `createStorySummaryGenerationApi` |
| `storyEpisodeSpokenTiming.js` | 170 / 7 278 | 6 025 | `STORY_MAX_SPOKEN_UNITS_PER_SECOND`、`countStorySpokenUnits`、`normalizeStoryEpisodeSpokenTiming` |
| `storyReplicationFlowPrompts.js` | 103 / 9 577 | 9 156 | `flowObservationPrompt`、`flowReviewPrompt`、`flowSpeechRecoveryPrompt`、`flowRepairPrompt`、`flowVerifyPrompt` |
| `storyEpisodeScriptPrompt.js` | 265 / 16 442 | 14 286 | `STORY_EPISODE_SCRIPT_SYSTEM_PROMPT`、`STORY_EPISODE_SCRIPT_REPAIR_SYSTEM_PROMPT`、`STORY_EPISODE_SCRIPT_CONTENT_REVISION_SYSTEM_PROMPT`、`createStoryEpisodeScriptPromptApi` |
| `storyAssetExtractionRequest.js` | 155 / 6 810 | 5 404 | `STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION`、`createStoryAssetContractClientKey`、`createStoryAssetPromptContracts`、`createStoryAssetExtractionStructuredOutput` |
| `storyAssetRequiredContracts.js` | 160 / 6 915 | 5 417 | `createStoryAssetRequiredContractsByKind`、`lockStoryAssetRequiredSourceChapterIds` |

- 合计 **1082 行 / 56 856 B / 29 个具名导出**（镜像 48 538 B，差额全部来自 prettier 格式化）。`api/story-generation/` 是本批新建目录。
- 另有 10 个同名测试文件（见 §3），同目录存放。

---

## 2. 冻结的端口行为（只记录，不打补丁）

### 2.1 `storyRequestPolicy.js`

1. `withStoryRequestPolicy(p = {})` 返回新对象 `{...p, stream: true, streamTimeouts: {idleMs: 180000, totalMs: 1800000}}`（空闲 3 分钟、总计 30 分钟），调用方自带的 `streamTimeouts` 被整体覆盖。
2. `withReplicationRequestPolicy(fn, opts = {})`：只有 `opts.sourceMode === 'video-replication'` 时返回包装函数；其他情况返回**同一个 `fn` 引用**。显式传 `null` 会抛 `TypeError`。

### 2.2 `storyAssetVoicePolicy.js`

- 一条提示词规则常量：`voiceDescription` 可选，没有声音证据的角色、场景和道具留空字符串，不根据外貌编造声音。

### 2.3 `storyEpisodeScriptResponseRecovery.js`

1. 非字符串或空串 ⇒ `{text: '', repairedCount: 0}`。
2. 只修一种截断：`"body":"…}` 缺了收尾引号，且后面紧跟 `,{"ref|sceneRef|scene_ref|id":`（下一场）或 `],"continuityFacts|facts|continuity_facts|endingState|finalState|continuityState|ending_state":`（尾部状态字段）。每修一处计数加 1，正文里的 `\"` 转义能正确跳过。
3. 其他形态（包括 `}` 后跟未知键）原样返回、计数 0。

### 2.4 `storyTextRequest.js`

1. `buildStoryTextProviderProfilePayload(id)`：trim 后非空 ⇒ `{providerProfileId}`，否则 `{}`。
2. `assertPlanningModel(model, provider)`：任一 trim 后为空 ⇒ 抛 `请先选择可用的文本模型。`。
3. `getResultText`：字符串原样返回；否则依次取 `text`、`outputText`、`content`；`null`/`undefined`/`0` ⇒ `''`；**其他对象（如 `{foo: 1}`）原样返回对象本身**（怪癖）。
4. `requestStrictResult`：
   - `maxAttempts` 默认 2，按 `max(1, floor(Number(x) || 1))` 归一，`0`、`'abc'` 都当 1 次。
   - 解析失败且还有次数时重试，载荷为 `{...原载荷, temperature?, prompt: 修复提示 JSON}`。修复提示字段依次为 `task: 'repair_invalid_agent_response'`、`originalRequest`（`JSON.parse(原 prompt)`）、`rejectionReason`、`validationDetails`（错误对象有才带）、`rejectedResponse`（`getResultText` 后 trim）、`instruction`（默认 `重新执行原任务，只返回符合要求的严格 JSON 对象。`）、`outputContract`。
   - **原 prompt 不是 JSON 时，重试路径抛 `SyntaxError`**。
   - `retryTemperature` 为 `undefined` 时保留原温度；**为 `null` 时变成 0**（`Number(null)` 是有限数，怪癖）。
   - 次数用尽时重抛最后一次解析错误；`request` 自身抛错时先调 `onRequestError({attempt, error, requestPayload})` 再重抛，不重试。
   - `onRequest({attempt, requestPayload})`、`onResponse({attempt, response, requestPayload})` 在每次请求前后触发。
   - 续跑 `resumeResponse: {attempt, response}`：attempt 截到 `[0, maxAttempts]`；为 0 时忽略；否则先解析已存响应、不发请求。截断后等于上限且解析失败 ⇒ 直接抛解析错误；等于上限但没有 response ⇒ 抛 `Agent 返回结果校验失败。`。

### 2.5 `storySummaryGeneration.js`

1. `createStorySummaryGenerationApi(deps)` 返回**冻结的** `{generateStorySummary}`，全部协作者靠注入（`generateText`、`requestStrictResult`、`storySummaryBlueprint` 等 17 项），本身不 import 任何模块。
2. 先调 `assertPlanningModel(model, provider)`；模式只认 `upload`、`rewrite`，其余都当 `generate`。
3. **只有 upload/rewrite** 且归一后原文长度 **大于** `sourceChunkCharacters` 时才分块摘要：逐块发 `requestStrictResult`（温度 0.1、`sourceDigestSystemPrompt`、生命周期标签 `source-digest:N`），进度文案 `正在整理原始剧本 i/n`（rewrite 为 `正在整理参考剧本 i/n`）；结果以 `{part, ...digest}` 收集，随后**把原文清空**，只把摘要交给蓝图提示词。
4. 最终请求：进度 `summarizing / 正在生成剧本摘要`；载荷带 `structuredOutput`、`thinking: {type: 'disabled'}`，温度 upload 0.25、rewrite 0.45、generate 0.65；`retryTemperature` 0.2；`repairInstruction` 要求只修故事蓝图 JSON；生命周期标签 `summary`，`serializeResponse` 用注入的 `getResultText`。

### 2.6 `storyEpisodeSpokenTiming.js`

1. `STORY_MAX_SPOKEN_UNITS_PER_SECOND = 4`。
2. `countStorySpokenUnits`：每行先去掉 1–20 字的 `名字：`/`name:` 说话人前缀，再数汉字加拉丁字母或数字词（撇号连接的算一个词）；标点不计。
3. `normalizeStoryEpisodeSpokenTiming(clips, {maxClipDurationSeconds = 15, maxSpokenUnitsPerSecond = 4})`：
   - 镜头只有同时满足以下条件才拆：`dialogue`/`voiceover` **恰好一个**非空、`durationSec > 0`、口播单位 ≥ 8、单位/时长 > 速率。
   - 按 `。！？!?；;，,…—` 断句，每段上限 `floor(maxDur × rate)` 单位，超长段按字或词硬切；每段保留说话人前缀，时长为 `max(1, ceil(单位/速率))`。
   - 没有变化的片段**原引用返回**；有变化的按 `maxDur` 重新分组：一组时沿用 `ref`（缺省 `clip-N`），多组时 `ref-timing-K`；`script` 是各镜头 visual/dialogue/voiceover 用 `；` 连接；`durationSec` 为镜头时长之和；`contentDurationSec` 只在原片段有这个键时才写；`assetRefs` 去重；原镜头带 `startSec`/`endSec` 的在每组内从 0 起累计重算。

### 2.7 `storyReplicationFlowPrompts.js`

- 5 个构造器都返回 `{systemPrompt, prompt}` 两个中文字符串，JSON 片段一律 `JSON.stringify`。
- `flowObservationPrompt({durationSec, cutHints, invalid, error})` **必须传对象**（不传抛 `TypeError`）；有 `cutHints` 才加切镜候选行，有 `invalid` 才加「唯一一次结构纠正」行并附上次结果。
- `flowRepairPrompt(ledger, issues, windows)` 只暴露 `issues[].sourceIds` 引用到的 shots/speech。
- `flowVerifyPrompt(candidate, issues, windows)` 只保留与任一窗口**严格重叠**的记录（`end > sourceStartSec` 且 `start < sourceEndSec`，端点相接不算）。

### 2.8 `storyEpisodeScriptPrompt.js`

1. 三个系统提示词分别是 13、5、5 条规则用换行连接。
2. `createStoryEpisodeScriptPromptApi(deps)` 返回**未冻结的** `{buildPrompt, buildContentRevisionPrompt}`；归一函数、运行时指引、`schemaVersion`、`narrationMode` 全靠注入。
3. `buildPrompt({project, episode, previousEpisode, nextEpisode})` 返回 JSON 字符串：
   - 摘要缺 `title`、`summary`（或 `storySummary`）、`logline` 任一 ⇒ 抛 `请先生成剧本摘要。`；分集缺标题或简介 ⇒ 抛 `当前分集缺少标题或简介，无法生成完整剧本。`；第 N>1 集没有上一集全文 ⇒ 抛 `必须先完成第 N-1 集剧本，才能生成第 N 集。`。
   - 分集 `ref` 依次取 `ref`、`planningRef`、`id`，否则 `episode-N`；集号 `max(1, trunc(number) || 1)`。
   - 上一集取最后一个正文非空的场次，正文只留**末尾 800 字**；没有场次就给 `endingExcerpt`；上一集缺集号时用 `N-1`，下一集缺集号时用 `N+1`。
   - `requirements` 为 14 条通用规则加 1 条对白模式规则（共 15 条），旁白模式换成 7 条旁白规则（共 21 条）；`outputSchema` 的正文示例随模式切换。
4. `buildContentRevisionPrompt({grounding, script, timingReview})`：`grounding` 只挑 5 个键（缺的在 JSON 里消失），`naturalDurationSeconds` 非正时为 `null`，固定 5 条要求。

### 2.9 `storyAssetExtractionRequest.js`

1. `STORY_ASSET_COMPACT_RESPONSE_SCHEMA_VERSION = 2`。
2. `createStoryAssetContractClientKey({kind, tier, name, sourceSceneRefs})` = `kind 首字母（空则 a）+ tier 首字母（required 为 r，其余都是 o）+ '-' + 8 位十六进制`。哈希是 **FNV-1a 32 位，按 UTF-16 码元**计算，输入为 `[kind, tier, 归一名, ...归一并排序的场次 ref]` 用 `\0` 连接；名字归一为 NFKC、去空白和非字母数字、转小写，所以大小写、全半角、标点和 ref 顺序都不影响结果。
3. `createStoryAssetPromptContracts(kinds, namesByKind, candidatesByKind, detailsByKind, {includeClientKeys})`：
   - 必需资产按 kind 顺序展开、同名去重；只有 `includeClientKeys` 时才附 `clientKey` 和明细（`role`、`fixedTraits` 只给人物）。
   - 候选按 trim 后的名字**先到先得**，`sourceSceneRefs`/`sourceChapterIds` 各最多 3 个。
   - `includeClientKeys` 时如果 clientKey 撞车（例如候选 `长剑` 和 `长 剑`），抛 `资产合同生成了重复 clientKey，已在调用 API 前安全停止。`；不带 key 时两者都保留。
   - `requirements` 按「必需、候选」顺序各给一段固定说明，没有就不给。
4. `createStoryAssetExtractionStructuredOutput`：`strict` 恒为 `true`；`fallback` 只认 `'none'`，其余都是 `'prompt'`；名字为 `story_asset_<kinds 或 all>_compact_v2` 或 `_detailed_v2`（kinds 先去重）。

### 2.10 `storyAssetRequiredContracts.js`

1. 文件里**自带一份** `normalizeText`（只接受字符串，数字变 `''`），和 `api/utils/storyGenerationValues.js` 的同名函数行为不同（那边 `12` 会变 `'12'`）；只从 utils 引了 `getStorySceneIdentityKey`。
2. 名字匹配先精确、后模糊：
   - 精确：场景比身份键；其他去掉 30 字以内的括号注释、NFKC、去非字母数字后比较（`张三（少年）` 等于 `张三`）。
   - 模糊：场景身份键互相包含；人物额外去掉职业前缀（房东、编辑、医生、护士、警察、老师、老板、经理、店员、保安、司机、队长、主任、主管），有一个别名相同即可；道具仍按精确。
3. `createStoryAssetRequiredContractsByKind` 对 character/scene/prop 三类逐名生成 `{name, sourceSceneRefs, sourceChapterIds}`：`hardSourceSceneRefs` 优先于 `sourceSceneRefs`；章节由 `sourceScenes` 的 `ref ⇒ episodeRef` 映射得出。人物另加 `role`（主角/反派/路人，其余一律配角，中英文别名都认）和截到 160 字的 `fixedTraits`（数组用 `、` 连接）。
4. `lockStoryAssetRequiredSourceChapterIds(result, contractsA, contractsB)`：两份合同合并匹配，命中且有章节 ID 时覆盖资产和每个 appearance 的 `sourceChapterIds`；人物角色只在命中合同带合法角色时覆盖。**场景没有精确命中、模糊命中又落到多个不同身份键时拒绝锁定**；没有可用命中的资产原引用返回。

---

## 3. 本批实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 开工补记 `track.mjs --by session-start` | 无会话外改动（「无变化，未写记录」）；git 0/68/840/0 与 §5 快照一致 |
| 选件 `b95/deps-ast.mjs` | 32 件：LEAF 10、OK 2、BLK 20；本批取 8 个小 LEAF 和 2 个 OK |
| 跨树具名导出闸门 `b100/verify-exports.mjs` | 2 个 OK 件共 3 个具名导入全部真实存在 |
| 暂存 ↔ 仓库逐字节比对 | 源码 10/10、测试 10/10 一致（`apply_patch` 返回的 sha256 与暂存哈希逐一相同） |
| 单行长度 | 20 个文件都没有超过 3000 字符的行 |
| `node --check` | 仓库内源码 10/10 通过 |
| `prettier --check`（`prettierrc.json`） | 20/20。测试在暂存目录先用 prettier 格式化再落地 |
| 自研测试 | **96 例**（storyTextRequest 18、ExtractionRequest 13、RequiredContracts 13、ScriptPrompt 12、SpokenTiming 9、SummaryGeneration 9、FlowPrompts 8、ResponseRecovery 6、RequestPolicy 6、VoicePolicy 2），**首跑 96/96 全绿**（落地前在沙箱 Node 20、落地后在本机 Node 24 各跑一次），期望未改、实现未改 |
| clientKey 金标值 | `cr-bcbbca2d`、`so-49cc41e3`、`ao-e37ed925` 由独立的 Python FNV-1a 实现算出，不是从端口实现反抄 |
| `api/**` sweep | **532 / 532 / 0 ⇒ 628 / 628 / 0**（+96，失败数不变） |
| `src/**` sweep | **3 587 / 3 544 / 43** 未变（本批不涉及 src，按工序照跑） |
| 失败名集合 vs `b85-fails.txt` | 43 = 43，**集合完全一致**（路径分隔符归一后比对） |
| 消费方反向 grep | `api`/`src`/`electron`/`main.js`/`renderer.js`（排除本目录）对 10 个模块名及 `story-generation/` **0 命中** ⇒ 落地不接线 |
| git_status | 落地前 0/68/840/0 ⇒ 源码与测试落地后 0/68/860/0（+20）；本文档落地后 0/68/861/0 |
| 受保护文件 | `api/freeImageHostApi.js` md5 前后均为 `1E0458013F5341C99F21FAEFC1D34D3F`；本批只新增文件 |
| 变更登记 | #0007（源码 10 件）、#0008（测试 10 件），文档在收工时登记 |

**未执行 / 边界**：没有启动应用或 Electron，没有发任何真实模型请求 ⇒ 真实模型的 JSON 输出、流式超时、摘要分块阈值的实际效果、提示词质量都**未验证**，本批只证静态契约和离线单测。

---

## 4. 接线观察（本批不动）

- 本仓 0 个消费方。0.7.16 里这些件由同目录的 BLK 件和 `api/storyGenerationApi.js` 组装；本仓的 `api/storyAiApi.js` 是 0.4.12 自己的剧本 AI 链路，与这里不是同一套接口，**不能直接替换**。
- `storySummaryGeneration` 和 `storyEpisodeScriptPrompt` 是依赖注入工厂，接线前需要先有 `storySummaryBlueprint`（第 121 批候选）等协作者，以及 `src/domain/storyGeneration/*`（本仓不存在）。
- 接线会改变剧本生成行为，按 §7.4 须单独成批、写清差异、用户授权后真机验证（会产生模型费用）。

---

## 5. 第 121 批口径

1. **两个大纯叶**：`storyAssetRequirementEvidence`（28 565 B）、`storyEpisodeOutlinePlanning`（37 147 B）。0 条相对 import，可直接排期。
2. **本批解阻的 BLK 件**（`deps-ast` 里缺的同目录文件本批已全部落地）：
   - 只缺 `storyTextRequest`：`storyReplicationAssetFrames`、`storyReplicationMissingClips`、`storyReviewOutputContract`、`storyReviewRequestJournal`、`storySummaryBlueprint`；
   - 只缺 `storyRequestPolicy`：`storyInvocationEvidence`；
   - 缺 `storyAssetExtractionRequest` 和 `storyTextRequest`：`storyAssetExtractionResult`。
3. **链式解阻**（同批先落前置件后才可做，或顺延）：`storyEpisodeScriptTiming`（需 `storyInvocationEvidence`）、`storyAssetHybridBudget`（需 `storyAssetRequirementEvidence`）、`storyAssetReferenceContract`（需 `storyAssetExtractionResult`）、`storyAssetParallelExtraction`（需 `storyAssetHybridBudget`）。
4. **仍受阻**：其余件依赖 `src/domain/storyGeneration/*`（promptModes、promptModeRules、videoReplication* 等，本仓没有这个目录）或 `../storyGenerationApi.js`，要等 `src/domain/storyGeneration` 先成批落地。
5. 每件都要**先跑 `b100/verify-exports.mjs`**：`deps-ast` 的 missing 列表只列缺的文件，已存在的依赖（如 `api/utils/*`）里的具名导出仍需核验。件数多时拆成 121a/121b。
6. 小坑：
   - 本机 Node 24 的 `node --test` 默认 spec 输出，没有 `# pass` 行，要数用例时加 `--test-reporter=tap`；传目录参数也不可靠，一律传文件清单。
   - PowerShell 5.1 下不要在 `run_command` 里再套一层 `powershell -Command`，引号会被拆坏。
