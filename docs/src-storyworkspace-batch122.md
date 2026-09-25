# 第122批：`src/modules/storyWorkspace/` 纯叶（分 122a / 122b / 122c，落地不接线）

批次：第 122 批（纯新增落地，零消费方不接线），按件数拆三段：122a、122b、122c 均已交付，第 122 批完成
能力区：R06（剧本工作室：素材提取续跑、首页改写与拖放、复刻角色身份与参考素材、工作区表面切换等）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\src\modules\storyWorkspace\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b122\port\src\modules\storyWorkspace\`（24 件源码已全部暂存并 prettier 格式化）、`b122\tests\src\modules\storyWorkspace\`（测试，prettier 用）
前置：无。24 件都是 0 条 import 的纯叶（`b95/deps-ast.mjs src/modules/storyWorkspace`：镜像 141 件，LEAF 24 / OK 8 / BLK 109）

---

## 1. 分段

| 段 | 内容 | 状态 |
| --- | --- | --- |
| 122a | 11 件小纯叶：`storyAssetExtractionRunner`、`storyAsyncButtonPresentation`、`storyCanvasBinding`、`storyCollaborationPolicy`、`storyEpisodeSplitPresentationPolicy`、`storyHomeRewrite`、`storyProjectNavigation`、`storyReplicationAssetIdentity`、`storyReplicationDefinitions`、`storyTaskBatchCancellation`、`storyWorkspaceSurface` | **已交付**（#0019 源码、#0020 测试） |
| 122b | 6 件中等数据 / 逻辑件：`storyEpisodeSplitBatchExecution`、`storyWorkspacePersistence`、`storySummaryRun`、`storyScriptImport`、`storyStyleCatalog`、`storyWorkspaceData` | **已交付**（#0024 源码、#0025 测试） |
| 122c | 大件 `storyAssetExtractionDraft`（22 KB）和 6 个 DOM 控制器：`storyAssetHoverPreviewController`、`storyClipVideoResultDom`、`storySpeechGapEditor`、`storyLibraryAppearanceMenuPortal`、`storyOutlineNavigation`、`storyClipPromptReferences` | **已交付**（#0027 源码、#0028 测试） |

- 另有 8 件依赖已齐（OK）：`storyClipExport`、`storyClipFrameCapture`、`storyClipFrames`、`storyClipInputSlots`、`storyReplicationCardMotion`、`storyReplicationVideoLimits`、`storyVideoThumbnailBackfill`、`storyWorkspaceDeveloperDiagnostics`。第 122 批之后再评估，先过导出闸门。
- 仓库里已有的 53 个 `storyWorkspace` 文件是 0.4.12 旧件，和这 24 件不重名。

---

## 2. 122a 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyAssetExtractionRunner.js` | 87 / 3 798 | 3 219 | `runStoryAssetExtractionToCompletion` |
| `storyAsyncButtonPresentation.js` | 18 / 853 | 752 | `renderStoryGenerationSpinner`、`syncStoryAsyncButton` |
| `storyCanvasBinding.js` | 27 / 1 055 | 888 | `buildStoryLinkedCanvasName`、`buildStoryClipCanvasBindingKey` |
| `storyCollaborationPolicy.js` | 4 / 196 | 179 | `isStoryCollaborationProject` |
| `storyEpisodeSplitPresentationPolicy.js` | 37 / 1 777 | 1 584 | 4 个：付费重试选项、实验分镜可用 / 是否使用、实验报错文案 |
| `storyHomeRewrite.js` | 65 / 3 264 | 2 955 | 9 个：提示常量、参考剧本判断、能否开始、生成模式、清除参考、任务文案、3 个拖放处理 |
| `storyProjectNavigation.js` | 15 / 736 | 629 | `openStoryProjectPage` |
| `storyReplicationAssetIdentity.js` | 80 / 3 797 | 3 066 | `reconcileStoryReplicationAssetIdentity` |
| `storyReplicationDefinitions.js` | 118 / 5 298 | 3 950 | `completeReplicationScenePropUsages`、`defineReplicationPromptMaterials` |
| `storyTaskBatchCancellation.js` | 21 / 667 | 551 | `createStoryTaskBatchCancellationRegistry` |
| `storyWorkspaceSurface.js` | 42 / 1 804 | 1 529 | 4 个：复刻模式常量、项目模式、表面项目过滤、`selectStoryWorkspaceSurface` |

- 合计 **514 行 / 23 245 B / 28 个具名导出**（镜像 19 302 B）。另有 11 个同名测试文件（37 例）。

---

## 3. 122a 冻结的端口行为（只记录，不打补丁）

- **`storyAssetExtractionRunner`**：只在错误 `type === 'ASSET_EXTRACTION_CONTINUE_REQUIRED'` 且 `isContinuation === true` 时续跑，其他错误原样抛出。
  - 进度键只看 strategy、status、phase、progress（stage / current / total，取整）、清点批次、已完成素材引用和细化批次；引用都排序后比较，所以顺序变化不算新进度。
  - 续跑返回的检查点和上一轮进度键相同 → 抛 `ASSET_EXTRACTION_CONTINUATION_STALLED`，避免重复计费；没有检查点 → `…_DRAFT_MISSING`；每次执行前检查 `isActive()`，否则抛 `ASSET_EXTRACTION_ABORTED`。
- **`storyEpisodeSplitPresentationPolicy`**：`shouldUseStoryEpisodeExperimentalSplit` 恒为 false，实验分镜在端口里等于关闭；可用性只认 `window.DEV_MODE === true`。
  - 报错文案：命中密钥 / 额度 / 登录，或缺素材 / 缺模型这类可操作错误时原样显示，并把「资产」换成「素材」；其余统一提示「已保存当前进度，请稍后再次点击…继续」。
- **`storyProjectNavigation`**：大纲 stale 只在 step > 0 时重置；重置目标是协作写作阶段 0，否则 1；剧集视图进不去第 3 步时退回项目视图。
- **`storyAsyncButtonPresentation`**：只有字面量 `true` 算忙碌。
- **`storyHomeRewrite`**：复刻页签不看 `isParsingDocument`；生成页签有文件名但正文为空时不能开始；生成页签带参考剧本时模式变为 `rewrite`；已创建项目后清除参考剧本不动 `sourceDocument`。
- **`storyWorkspaceSurface`**：只有当前项目属于旧表面时才记住它的视图 / 步骤；切回时只在同一项目 id 下恢复；切换会清空搜索词、待删除项目和打开的菜单。
- **`storyReplicationAssetIdentity`**：只在某主体的名字在同一集里唯一时合并同名复刻角色。
  - 胜者按带图数量，平手时选当前已绑定的；外观按 id 合并（胜者优先），subjectKeys 取并集。
  - 然后在 episodes 和 characterBindings 里改写旧 id / planningRef / ref。
  - 小坑：它**原地修改** data，返回的是过滤后的素材数组，调用方要自己赋回。
  - 小坑：改写范围包括 episodes 里任何「整串等于旧 id」的字符串，以及 `story-asset:<编码后的旧 id>:` 前缀。
- **`storyReplicationDefinitions`**：推断场景 / 道具用法时，素材必须只有一个外观。名字后缀要至少 2 字，而且在场景 / 道具里唯一，才能当简称用。
  - 提示词里的 `@名称 · 外观` 按长度从长到短替换成别名；引号「“…”」内的文字和「画面文字：」开头的行不替换。多外观角色才附「用于第 N 个镜头」。

---

## 4. 122a 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b100/verify-exports.mjs` | 11/11（均为 0 import） |
| 暂存 ↔ 仓库逐字节比对 | 源码 11/11、测试 11/11 与 `apply_patch` 返回的 SHA256 一致 |
| `node --check` | 11/11 |
| `prettier --check` | 22/22 |
| 自研测试 | **37 例**，沙箱和本机都是首跑全绿。DOM 相关函数用最小假元素对象测（按钮、拖放区），不引入 jsdom |
| `src/**` sweep | **3 587 / 3 544 / 43 ⇒ 3 624 / 3 581 / 43**（+37），失败名集合一致 |
| `api/**` sweep | 791 / 791 / 0 未变 |
| 消费方反向 grep | 11 个模块名在 api、src、electron、入口文件里 **0 命中** |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

**未执行 / 边界**：没有启动应用，也没有真机验证；这些件都没有调用方。

---

## 5. 接线观察（本批不动）

- 122a 的调用方大多在 BLK 件里，例如 `storyAssetExtractionWorkspaceController` 依赖 Runner，同时还依赖 `storyScriptImport`、`storyStyleCatalog` 等 16 个缺件。要等依赖补齐后，单独成批接线。

---

## 6. 122b 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyEpisodeSplitBatchExecution.js` | 184 / 6 582 | 5 171 | 4 个：`resetStoryEpisodeSplitBatchState`、`runStoryEpisodeSplitBatchQueue`、`cancelStoryEpisodeSplitBatch`、`finalizeStoryEpisodeSplitBatch` |
| `storyWorkspacePersistence.js` | 181 / 8 402 | 7 165 | 7 个：版本常量、创建 / 规整 / 解析快照、空载荷判断、合并补水工程、快照变化判断 |
| `storySummaryRun.js` | 238 / 9 284 | 7 402 | `normalizeStorySummaryRun`、`createStorySummaryRunRecorder` |
| `storyScriptImport.js` | 269 / 10 617 | 8 781 | `parseUploadedStoryScript`、`parseUploadedStoryEpisodeScenes`、`attachUploadedStoryAssetsToEpisodes` |
| `storyStyleCatalog.js` | 141 / 9 498 | 8 827 | 5 个：自定义 id、分类表、预设表、`getStoryStylePreset`、`resolveStoryStyleSelection` |
| `storyWorkspaceData.js` | 234 / 10 800 | 9 153 | `DEMO_STORY_PROJECTS`、`createDemoStoryWorkspaceData` |

- 合计 **1 247 行 / 55 183 B / 23 个具名导出**（镜像 46 499 B）。另有 6 个同名测试文件（1 192 行，46 例，依表中顺序为 11 / 6 / 6 / 13 / 5 / 5）。
- 测试来源：BatchExecution、SummaryRun、Persistence 三个以暂存区 `b122\tests\` 里 07:48 的草稿为底稿。草稿出自前一个中断的会话，没有交接记录；逐条对照实现核对后采用，补了断言和 1 个用例，原稿备份在 `b122\tests-prev-0748\`。其余三个是本次新写的。

---

## 7. 122b 冻结的端口行为（只记录，不打补丁）

- **`storyEpisodeSplitBatchExecution`**：队列串行执行。每件开跑前先看 `isLive()`、再看取消，结算后再看一次取消。
  - `runTarget` 返回假值或中途失活时结果为 `interrupted`：当前件仍留在 `pendingTargets`，结果里没有 `cancelled` 字段。
  - 找不到目标、`runTarget` 抛错都记进 `failures`，队列继续；结尾有取消请求时为 `cancelled`，`cancelled` 是剩余件数。
  - 同一轮里「结算后取消」和「失活」同时出现时取消优先，结果为 `cancelled`。
  - 取消只砍排队的集，当前集继续跑完；没有可砍的排队集时只提示「当前集正在拆分，暂无可取消的排队分集。」并返回 false。
  - 收尾只报第一条失败原因，按实验 / 普通模式加前缀；成功文案分「全部」和「选中」两种。
- **`storyWorkspacePersistence`**：快照 `schemaVersion` 为 1。
  - 视频复刻工程存档时删掉工程和各集的 `replication.requirements`；`clipFrames` 里待保存、临时、或任一地址以 `blob:` 开头的帧不存。先深拷贝再过滤，不改入参。
  - `step` 只有字面量 0 保留为 0，其余转数字，失败回 1；`characterVoiceEditor` 存档时强制 `isGenerating: false`。
  - 读档时，不是对象、版本不是 1、缺 `currentData.project` 或 `episodes` 数组都判无效；未知顶层字段原样保留，`ui.replicationRequirements` 删除。
  - 空载荷（null、undefined、`{}`）返回 null，其他无效载荷抛「剧本工作室存档格式无效」。比较快照时忽略 `savedAt`，无法序列化（例如循环引用）一律当作有变化。
- **`storySummaryRun`**：运行记录 id 为 `story-summary:<项目 id 或 project>:<时间戳>:<序号>`，序号是模块级计数器。
  - 输入指纹是按键排序序列化后的 FNV-1a；只有 running、failed_retryable、ready_to_commit 三种状态能续跑。
  - 续跑时用**存档里的**模型、厂商和配置重算指纹，所以只换模型不影响续跑，续跑后也沿用旧模型；改了创意、原文等输入就新开一条。
  - 调用日志只留最后 8 条，原始响应截到 120 000 字。有 prepared、outcome-unknown 或 completed 状态且没授权重试的调用时，要求付费重试授权；已 ready_to_commit 且有候选稿时例外。
  - `start()` 不会重置已 ready_to_commit 的运行；`onChange` 收到的是深拷贝。
- **`storyScriptImport`**：分集标题认「第 N 集 / 话 / 回」（中文数字、两、零、全角数字）和 `Episode N`、`EP.N`，可带 Markdown `#` 以及冒号、句点、横线、间隔号、竖线等分隔符。
  - 首个分集标题之前的文字归第 1 集；解析出的集号为 0（如「第零集」）时按位置编号。
  - 剧本标题依次取：文件名（去掉路径和 txt、doc、docx、pdf、md、rtf 扩展名，「粘贴文本」不算）→ 首个非空行（不超过 80 字、不等于首个分集标题，去掉首尾的书名号、方括号和引号）→ 首集标题 → 「未命名剧本」。
  - 小坑：去壳字符里没有右书名号「》」，所以 `《星河》` 会变成 `星河》`。
  - 只有一段时集标题等于剧本标题；多段且标题为空时用「第 N 集」。
  - 场景标题认 Fountain 的 INT、EXT、EST、I/E，「第 N 场」「场景 N」，以及可带时间前缀的「内景 / 外景 / 内外景 / 内 / 外」，单行最多 120 字。
  - 集标题行和首个场景标题之前的文字不进任何场次；空正文的场次会被丢掉，但 ref 仍按标题位置编号；一个场景标题都没有时，整集作为一个 `upload-fallback` 场次。
  - 角色取对白前缀「名字（注）：」、`@名字`，以及前面是空行、后面有正文的全大写名字行；旁白、画外音、VO、OS 排除，名字超过 24 字忽略，结果去重。
  - 挂素材时按 `sourceChapterIds`（含各外观的）匹配集 id；没有 id 的素材不进 `assetRefs`、`assetIds`，但仍计入对应类别的数量。
- **`storyStyleCatalog`**：4 个分类、94 个预设（真人 35、2D 30、3D 29），提示词就是标签，缩略图路径为 `images/story-styles/<id>.webp`。
  - 不是预设 id 的一律按自定义处理，提示词取 `stylePrompt || videoStyle` 再 trim；所以只含空白的 `stylePrompt` 会挡住 `videoStyle`，结果为空。
- **`storyWorkspaceData`**：演示工程 `story-demo-main`，3 集、7 个素材（4 个角色、3 个场景），第 1 集 6 个片段合计 28 秒。
  - 每次调用都返回全新副本，没有共享引用；没有外观的素材也带 `appearances` 键，值为 undefined；`DEMO_STORY_PROJECTS` 只冻结了数组本身。

---

## 8. 122b 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 暂存核对 | 镜像经 prettier 3.9.8（`prettierrc.json`）格式化后与暂存逐字节一致 6/6，脚本 `b122\b122b-check.mjs` |
| 导出闸门 `b100/verify-exports.mjs` | 6/6（均为 0 import） |
| 暂存 ↔ 仓库逐字节比对 | 源码 6/6、测试 6/6，`apply_patch` 返回的 SHA256 与 `Get-FileHash` 一致 |
| `node --check` | 12/12 |
| `prettier --check` | 12/12 |
| 自研测试 | **46 例**，沙箱（Node 20）预跑和本机（Node 24）首跑全绿；变异抽查 13 处，首轮测出 12 处，补 1 例后 13/13 |
| `src/**` sweep | **3 624 / 3 581 / 43 ⇒ 3 670 / 3 627 / 43**（+46），失败名集合与 `b85-fails.txt` 一致 |
| `api/**` sweep | 791 / 791 / 0 未变 |
| 消费方反向 grep | api、src、electron 和入口文件共 1 486 个文件，6 个模块名 **0 命中** |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

- 比对失败名单时注意：用 `FullName` 跑 sweep，10 个文件级失败名会带 `F:\\CanvasPro\\` 前缀，去掉后才和 `b85-fails.txt` 一致。TAP 原文和失败名单在 `b122\b122b-src-sweep.tap`、`b122\b122b-src-fails.txt`。

---

## 9. 未执行项、缺口与下一段

1. **未执行 / 边界**：没有启动应用，也没有真机验证；这 6 件都没有调用方。
2. **0.7.16 里的引用方**（都是 BLK 件，仓库里都还没有）：
   - `storyEpisodeSplitBatchExecution` ← `storyEpisodeSplitWorkspaceController`
   - `storyWorkspacePersistence` ← `storyProjectDataOwner`、`storyWorkspace`
   - `storySummaryRun` ← `storySummaryGenerationWorkspaceController`
   - `storyScriptImport` ← `storyAssetExtractionWorkspaceController`、`storyProjectPlanning`、`storyScriptRevision`、`storyVideoReplication`
   - `storyStyleCatalog` ← `storyAssetExtractionWorkspaceController`、`storyAssetSettingsProjection`、`storyHomePresentation`、`storyProjectPlanning`、`storyWorkspace`
   - `storyWorkspaceData` ← `storyHomeWorkspaceController`、`storyProjectPlanning`、`storyWorkspace`
   - §5 提到的 `storyAssetExtractionWorkspaceController` 缺件里，`storyScriptImport`、`storyStyleCatalog` 已由本段补上，其余仍缺。
3. **资源缺口**：`storyStyleCatalog` 引用的 `images/story-styles/*.webp` 仓库里没有；0.7.16 安装目录下有 94 张，共 1 067 428 B。接线时要一并处理，复制二进制资源需另行确认。
4. **122c 口径**：大件 `storyAssetExtractionDraft`（22 KB）和 6 个 DOM 控制器（`storyAssetHoverPreviewController`、`storyClipVideoResultDom`、`storySpeechGapEditor`、`storyLibraryAppearanceMenuPortal`、`storyOutlineNavigation`、`storyClipPromptReferences`）。都已暂存格式化，均为 0 import；DOM 件沿用 122a 的最小假元素测法，不引入 jsdom。

---

## 10. 122c 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyAssetExtractionDraft.js` | 516 / 22 407 | 17 924 | 8 个：阻断线路、换模型重跑类别、阻断批次、重跑确认描述、确认闸门、计划续跑判断、实验草稿展示、本地质量复验判断 |
| `storyAssetHoverPreviewController.js` | 163 / 6 684 | 5 050 | `createStoryAssetHoverPreviewController` |
| `storyClipVideoResultDom.js` | 56 / 2 439 | 2 105 | `findStoryClipCardShell`、`syncStoryClipCardVideoInPlace`、`syncSelectedClipVideoMetadataInPlace` |
| `storySpeechGapEditor.js` | 57 / 2 726 | 2 326 | `mountStorySpeechGapEditor` |
| `storyLibraryAppearanceMenuPortal.js` | 177 / 8 153 | 6 694 | `createStoryLibraryAssignmentMenuPortal`（导出名与文件名不一致，照镜像保留） |
| `storyOutlineNavigation.js` | 114 / 4 395 | 3 477 | `jumpToStoryOutlineSection`、`bindStoryOutlineNavigation` |
| `storyClipPromptReferences.js` | 139 / 5 655 | 4 081 | `protectStoryPromptPills`、`syncStoryClipPromptReferences` |

- 合计 **1 222 行 / 52 459 B / 18 个具名导出**（镜像 41 657 B）。另有 7 个同名测试文件（2 905 行，73 例，依表中顺序为 16 / 10 / 8 / 6 / 14 / 9 / 10）。
- 4 个 DOM 件（ClipVideoResultDom、SpeechGapEditor、LibraryAppearanceMenuPortal、OutlineNavigation）的测试各自内联同一份最小假 DOM（节点树、简单选择器、dataset、classList、style、事件、TreeWalker），每份约 330 行。这样每个测试文件都能单独跑；如果以后想抽成共用夹具，要另行决定，不能冒充缺失的 `tests/testPreviewDom.js`。
- `storyClipPromptReferences` 第 25 行的占位符两端是私用区字符 U+E000 / U+E001，编辑器里看不见，改这一行前要精确重读。

---

## 11. 122c 冻结的端口行为（只记录，不打补丁）

- **`storyAssetExtractionDraft`**：阻断线路按角色、场景、道具的顺序列出。
  - 5 种阻断状态各有固定原因文案；状态或 errorType 为 ambiguous-submission、authoritative-source-changed 时，分别归为「计费不明确」和「正文已变化」。
  - 质量复核要求付费重跑（recoveryMode 为 paid-rerun-required）时，列出的类别标为 blocked-quality-rerun，但各类自己的阻断状态优先。非字符串状态一律忽略。
  - 换模型重跑只认 blocked-paid-response 且 repairCount 取整后大于 0 的类别。
  - 阻断批次按键名排序；键名为空时用记录里的 batchKey。submitted、ambiguous 类状态归为「计费不明确」；response-received 但没有原始响应时归为 blocked-paid-response，并用单独的原因文案。标签按阶段分为清单、提示词、归并、素材批次。
  - 确认对话框：有批次时计数单位是「项」，否则是「路」；空标签的项不进说明文字，但仍计入 N。
  - 确认闸门同一时间只处理一次，等待中再调用返回 busy；选择后 `isCurrent()` 为假则返回 stale。
  - 只有每个阻断项都是 blocked-paid-response 且本地存有原始响应时，才提供免费本地重校验；否则选了也按取消处理。
  - 付费重跑授权只列出实际阻断的类别和批次键；`requestChoice` 抛错时也会复位忙碌标记。
  - 计划续跑：evidence-batched-api-vN、状态 partial、没有失败和阻断、还有剩余件数。清单和归并阶段按进度的 current / total 计数，细化阶段按清单素材数和已完成数计数。
  - 展示文案分 4 种策略，失败摘要最多列前 3 条；inventory-only 按窗口去重计数。按类别展示时，按钮优先级依次为：换模型（阻断全部可换模型时）、处理阻断、本地复验、重试失败、继续提取、开始提取。
  - 本地质量复验：只要有 qualityReview 对象且不要求付费重跑就算（空对象也算）；否则要求各类都成功，或是校验失败但存有素材，且至少有一类属于后者。
- **`storyAssetHoverPreviewController`**：4 个展示适配器缺一个就抛错。触屏指针、音频素材不预览。素材 id 和签名都没变时不重绘；签名由外观、选中外观、基础外观、配音标记和各外观图片组成。
  - 定位偏移 14、边距 10；视口尺寸先取 window，再取 documentElement，最后按 1024 × 768。
  - 悬停在 `.at-mention-menu` 上时，依次尝试菜单右侧、菜单左侧、指针居中的菜单下方或上方；放在菜单两侧时，顶部对齐到指针 y - 18。
  - 连续移动共用一帧，以最后的指针位置为准；`destroy()` 会取消待执行的帧，之后 `show()` 不再生效。
  - 已加载的图片立即标横竖；未加载的在 load 时（once）再标，并在预览可见时重新定位。
- **`storyClipVideoResultDom`**：按 trim 后的 `data-story-clip-id` 找卡片；结果数大于 1 时 `storyVideoHistory` 为 true。
  - 刷新缩略图时，把新建的媒体节点插在 `.story-clip-card-copy` 之前。小坑：卡片里没有 copy 节点时，新节点不会挂上去，但仍会加 has-video-thumbnail。没有缩略图 markup 时删掉媒体节点并去掉该类。
  - 结果序号写到结果节点和其下所有带序号属性的节点；计数文字是 `index + 1` 加总数，所以 index 必须传数字，传字符串会变成「11/3」。总数小于 2 时删掉切换按钮。
- **`storySpeechGapEditor`**：`[听不清]`、`【听不清】`、`[无法听清]` 会变成可点的 `story-speech-gap` 标记（不可编辑、可聚焦、role=button，带提示文案）。
  - 在微任务里装饰，而且只处理已挂到文档上的编辑器；引用胶囊、已有标记、input、textarea 里的文字跳过；标记前后即使没有文字也会插入空文本节点。
  - 每次调用都会重新装饰，但每个元素只绑一次监听（click、keydown，捕获阶段）。只有编辑器 contenteditable 为 true 时才响应，键盘只认 Enter 和空格；响应时选中整个标记，接着打字就会替换它。
- **`storyLibraryAppearanceMenuPortal`**：目标菜单挪到故事根节点下，右对齐到所在 wrap，放在它下方，放不下就放上方，四边都与视口保持 16 px。
  - 再点一次已打开的菜单会关闭它，并返回 false；关闭时放回原 wrap，wrap 已经脱离文档时直接移除菜单。
  - 外观菜单放在目标菜单右侧，放不下就放左侧，顶部对齐触发按钮；关闭目标菜单前会先关外观菜单。
  - 小坑：打开另一个 wrap 的目标菜单时，不会收回前一个；前一个仍留在根节点下，之后 `closeTarget()` 也只把它隐藏，不放回原处。调用方应先 `closeTarget()`。
  - 窗口 resize 时立即重排，下一帧再排一次（会取消上一帧）；根节点滚动（捕获阶段）时也重排；`destroy()` 关闭菜单并解绑。
- **`storyOutlineNavigation`**：跳转按章节 id 精确匹配，有 requestAnimationFrame 时下一帧再平滑滚动；根节点必须能 `querySelectorAll`，传 null 会抛错。
  - 悬停展开，离开 180 ms 后收起（固定时不收）；点开关按钮固定。aria-expanded 综合悬停、固定、:hover 和焦点状态。
  - 点导航外部或按 Escape 都会取消悬停和固定，Escape 还会让当前焦点失焦；点导航目标跳到对应章节；`destroy()` 清掉定时器和监听。
- **`storyClipPromptReferences`**：引用胶囊指 class 含 ref-pill 的 span，按嵌套 span 配对找结尾；遇到没闭合的胶囊就停止处理，后面原样保留。
  - 同时含【参考素材】和【分镜与声音】的提示词原样返回；有复刻素材时删掉「保留原视频的视觉风格、场景和道具」这一行。
  - 素材库角色（有图）的定义行，无论纯文本还是胶囊形式，都会补上「人物外观、发型和服装以该参考图为准。」，重复处理不会叠加；同时删掉该角色的「声音设定（名字）：」行。
  - 没有图的复刻场景和道具：提及后面是标点、空白或结尾时，替换成「名称（描述）」，后面紧跟文字时不替换；对应的胶囊换成转义后的文字。结果会 trim。

---

## 12. 122c 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 暂存核对 | 镜像经 prettier 3.9.8 格式化后与暂存逐字节一致 7/7（`b122\b122b-check.mjs`） |
| 导出闸门 `b100/verify-exports.mjs` | 7/7（均为 0 import） |
| 暂存 ↔ 仓库逐字节比对 | 源码 7/7、测试 7/7，`apply_patch` 返回的 SHA256 与 `Get-FileHash` 一致 |
| `node --check` | 14/14 |
| `prettier --check` | 14/14 |
| 自研测试 | **73 例**，沙箱（Node 20）预跑和本机（Node 24）首跑全绿；变异抽查 18 处，首轮测出 17 处，补强 1 例后 18/18 |
| `src/**` sweep | **3 670 / 3 627 / 43 ⇒ 3 743 / 3 700 / 43**（+73），失败名集合与 `b85-fails.txt` 一致 |
| `api/**` sweep | 791 / 791 / 0 未变 |
| 消费方反向 grep | api、src、electron 和入口文件共 1 493 个文件，7 个模块名 **0 命中** |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

- 自查时改掉 1 处自己写错的断言（用 deepEqual 比较了两个不同的函数），没有进入首跑。变异抽查漏掉的那处是 SpeechGapEditor 的跳过选择器，原断言只比较文字内容；已补上「标记总数」和「胶囊内无标记」两条断言。
- sweep 原文和失败名单在 `b122\b122c-src-sweep.tap`、`b122\b122c-src-fails.txt`。

---

## 13. 未执行项、缺口与下一批

1. **未执行 / 边界**：没有启动应用，也没有真机验证。DOM 件的行为只在假 DOM 上验证过，真实浏览器里的布局、焦点和选区要等接线后真机验收。
2. **0.7.16 里的引用方**（都是 BLK 件，仓库里都还没有）：
   - 主装配 `storyWorkspace` 引用了 HoverPreview、SpeechGapEditor、LibraryAppearanceMenuPortal、OutlineNavigation、AssetExtractionDraft 这 5 件。
   - `storyAssetExtractionDraft` 另被 `storyAssetExtractionWorkspaceController` 引用；`storyClipVideoResultDom` 被 `storyClipResultSelectionController` 引用。
   - `storyClipPromptReferences` 被 `storyClipMentions`、`storyPlanningData`、`storyReplicationPromptReferences` 引用。
3. **第 122 批完成**：`storyWorkspace` 的 24 件纯叶全部落地，均未接线。
4. **第 123 批口径**：先重跑 `b95/deps-ast.mjs src/modules/storyWorkspace` 重新分级，因为 24 件落地后部分 BLK 件可能已转 OK。然后对 §1 的 8 件 OK 件和新解阻的件逐件过导出闸门再落地。不够一批时，按 TRACKING §7.2 转 `collaboration` 的 13 个纯叶。（已执行：第 123 批见 `docs/src-storyworkspace-batch123.md`。）
