# 第85批专题：替换工作室（人物替换）自洽核心 `src/modules/personReplacement/`（9 件零依赖落地不接线）

本批属于 **R08（人物检测、识别、替换、素材库、框选与结果回写）** 行。0.7.16 端口里 `src/modules/personReplacement/` 有 **110 件**，本仓此前**该目录整体不存在**（45 个审计口径下的 0 件）。本批把其中**依赖完全闭合、彼此协作**的 9 件**逐字节**落地并配离线测试：任务身份、提示词编号身份、输出血缘状态机、工程库归一化、声音库绑定、工作区输入解析，以及它们共同依赖的两个常量源。其余受阻部分按证据记账。

---

## 1. 本批要补的缺口

开工前实测：`src/modules/personReplacement/` 与 `src/modules/workspaceStudioModes.js` 在本仓**均不存在**（逐个 `ls` 得 `NEW`），且全仓对 9 个模块名 **0 命中**（`grep -rl "<name>" src electron api main.js`，排除自身与测试后全部为 0；唯一非零的 `workspaceStudioModes` 计 2，其实是本批自带的 `replacementStudioTerminology.js` 与 2 个本批测试文件）。即既无源码、也无任何引用点。

`docs/missing-features-inventory.md` 附录把该目录列为「缺失 110 件」；B 类功能明细表把**人物替换**列为「缺失前端主目录 `src/modules/personReplacement/`」。本批取其中**自足**的一片。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/workspaceStudioModes.js` | 2 | 122 | 0 | 工作区模式常量：`REPLACEMENT_STUDIO_MODE_ID='person-replacement'`、`REPLACEMENT_STUDIO_NAME='替换工作室'` |
| `src/modules/personReplacement/replacementStudioTerminology.js` | 1 | 98 | 1（上件） | 纯再导出上件两常量（端口即 `export … from`） |
| `src/modules/personReplacement/personReplacementCapabilities.js` | 1 | 59 | 0 | 能力开关常量：`PERSON_REPLACEMENT_ORIENTATION_ENABLED = ![]` |
| `src/modules/personReplacement/personReplacementGenerationTaskIdentity.js` | 86 | 3 721 | 0 | 生成任务身份：字段集冻结、活跃态判定、身份归一化/投影/变更比较、可恢复任务提取 |
| `src/modules/personReplacement/personReplacementPromptIdentity.js` | 47 | 2 185 | 0 | 提示词编号身份：`人物A..Z/AA` 标签生成、标签解析、按框中心排序补号 |
| `src/modules/personReplacement/personReplacementOutputLineage.js` | 108 | 4 283 | 0 | 输出血缘状态机：失效/合成成功/终混成功转移与不变量校验 |
| `src/modules/personReplacement/personReplacementProjectLibrary.js` | 88 | 3 848 | 0 | 工程库归一化：多形状收集/按 id 去重保留新者/按 `updatedAt` 倒序/当前工程回退 |
| `src/modules/personReplacement/personReplacementVoiceLibrary.js` | 104 | 4 862 | 0 | 声音库：音频引用取名、通用名回退、绑定人设查询、引用构造与绑定（含 4 处 toast 文案） |
| `src/modules/personReplacement/personReplacementWorkspaceInput.js` | 37 | 1 605 | 0 | 工作区输入：contenteditable 提示词读取与净化、视频/图片/音频文件判定 |
| `src/modules/workspaceStudioModes.test.js` | 8 | 381 | — | 1 项 |
| `src/modules/personReplacement/replacementStudioTerminology.test.js` | 13 | 620 | — | 1 项 |
| `src/modules/personReplacement/personReplacementCapabilities.test.js` | 7 | 304 | — | 1 项 |
| `src/modules/personReplacement/personReplacementGenerationTaskIdentity.test.js` | 132 | 5 709 | — | 7 项 |
| `src/modules/personReplacement/personReplacementPromptIdentity.test.js` | 77 | 3 472 | — | 5 项 |
| `src/modules/personReplacement/personReplacementOutputLineage.test.js` | 175 | 6 354 | — | 8 项 |
| `src/modules/personReplacement/personReplacementProjectLibrary.test.js` | 151 | 5 534 | — | 9 项 |
| `src/modules/personReplacement/personReplacementVoiceLibrary.test.js` | 178 | 7 160 | — | 10 项 |
| `src/modules/personReplacement/personReplacementWorkspaceInput.test.js` | 82 | 3 938 | — | 6 项 |

9 件源码合计 **474 行 / 20 783 B**；9 件测试合计 **823 行 / 33 472 B**（`workspaceStudioModes.test.js` 8 行 / 381 B + 8 件 815 行 / 33 091 B）；新增总计 **1 297 行 / 54 255 B**。

9 件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`，见 §5）。保留原地反混淆的 `_0x` 局部名与端口书写风格（`![]`、`!![]`、`Object['freeze']`、`Math['max']`、`0x` 十六进制、逗号表达式）。

### 2.1 关键行为（供接线时对照）

- **任务身份字段集**：`PERSON_REPLACEMENT_GENERATION_TASK_IDENTITY_FIELDS` 冻结为 `['taskId','modelId','provider','providerProfileId','executionId']`（**5 个字段**，冻结后用 `Object['freeze']`，测试断言写改抛错）。
- **活跃态判定**：`isPersonReplacementGenerationTaskActive` 的 `Set` 为 `['queued','submitting','running']`；入参先 `trim + toLowerCase`，既接受裸状态串、也接受 `{status}`。
- **身份归一化**：`normalizePersonReplacementGenerationTaskIdentity` 把**数组归为 `{}`**（非对象亦归空）、丢弃空串字段、`startedAt` 仅接受有限正数、`useOpenapiQuery` 仅接受**严格 `true`**。
- **身份投影优先级**：`projectPersonReplacementGenerationTaskIdentity({taskId, meta, defaults})` 取 `meta` > 入参 > `defaults`；`providerProfileId` 亦接受别名 `rhProviderProfileId`；`taskId` 由入参决定，不从 `meta` 取。
- **身份变更比较**：`hasPersonReplacementGenerationTaskIdentityChanged` 对 **5 个字段 + `startedAt` + `useOpenapiQuery`** 逐项 `Object.is`。
- **可恢复任务**：`getRecoverablePersonReplacementGenerationTask` 要求**活跃态 + 有 `taskId` + 有 `modelId`** 三者齐备，返回 `{status, …identity, requestId}`（`requestId` 直通，不做归一化）。
- **提示词标签**：`formatPersonReplacementPersonLabel(n)` 是**双射 26 进制**（0→`A`、25→`Z`、26→`AA`），前缀 `'人物'`。
- **标签解析**：`resolvePersonReplacementPromptLabel({label, promptMarkerIndex})` **显式标签文本优先**，其次由 `label` 用 `/^人物([A-Z]+)$/u` 反解 `labelIndex`；`promptMarkerIndex` 也参与。
- **补号顺序**：`assignPersonReplacementPromptIndexes(items)` 分两遍（先认 `promptMarkerIndex`、再认 `label` 文本），剩余新号从 `max+1` 起发，**发号顺序按 `initialPosition = bbox ? bbox.x + bbox.width/2 : Infinity` 升序**（无框者 `Infinity` 排最后，稳定）；返回**新对象**不改入参。
- **输出血缘转移**：`PERSON_REPLACEMENT_OUTPUT_TRANSITIONS` 冻结五事件 `INVALIDATE`/`FINAL_MUX_INVALIDATE`/`SOURCE_GRAPH_CHANGED`/`COMPOSITION_SUCCEEDED`/`FINAL_MUX_SUCCEEDED`。`transitionPersonReplacementOutput(state, {type,…})`：`INVALIDATE` 依「两母版是否齐备」分支；`COMPOSITION_SUCCEEDED` 缺任一母版抛 `TypeError('Replacement Studio composition requires original and visual masters')`，`composedShotIds` 经 `map(trim).filter(Boolean)` 归一（非数组→`[]`）；`FINAL_MUX_SUCCEEDED` 要求存在视频轨与音频轨且音频轨 ∈ `['original','replacement']`，否则抛 `TypeError('Replacement Studio final mux requires a video and audio track')`；未知类型抛 `TypeError('Unknown Replacement Studio output transition: ' + type)`。
- **工程库归一化**：`PERSON_REPLACEMENT_LIBRARY_SCHEMA_VERSION = 0x2`（即 `2`）；`normalizePersonReplacementProjectLibrary` 收集 `projects`/`project`/`currentProject`/`data`/裸形状，**按 id 去重保留 `updatedAt` 较新者**（`>=` 时取后者）、按 `updatedAt` 倒序，剥离 `libraryProjects`/`libraryAssets`/`sourcePreviewRefs`，丢弃无 id/非对象/数组条目；`currentProjectId` 依次取 `currentProjectId` → `project.id` → `currentProject.id`，**必须存在于列表中否则退第一件**。`removePersonReplacementProject` 删当前工程后回退第一件或 `''`。
- **声音库引用**：`getPersonReplacementLibraryAudioRef` 取 `audioUrl` → `sourceUrl` → `url`；`getPersonReplacementAudioSavedName` 优先 `savedName`，否则 `name`（若 `name` ∈ 通用集 `['人声','声音','音频','源音频','生成音频','AI音频','AI 音频']` 则改用 `assetName`），最终兜底 `'未命名音频'`。
- **声音绑定**：`bindPersonReplacementCharacterVoice({project, request, showToast, addLibraryAssetsToProject, normalizeLocalPath, resolveMediaUrl, setProject})` 三处拒绝 toast：人设不存在 `'要添加声音的人设不存在。'`、非音频素材 `'请选择音频素材。'`、缺地址 `'所选音频缺少可用地址。'`；成功 toast 为 `'已为「' + name + '」添加声音。'`、`kind='success'`。工程内已存在同引用音频时**不重复入库**；写回字段为 `voiceRef`（本地路径或引用）+ `voiceReference`（构造对象）。
- **工作区输入**：`readPersonReplacementVideoPromptEditor(el)` 对 `[contenteditable="true"]` 优先取 `innerText`（须为 string），否则净化 `innerHTML`：`<br>`→`\n`、**仅闭合**块级标签（`div|p|section|article|blockquote|li`）→`\n`、再去标签，最后依次还原 `&nbsp; &lt; &gt; &quot; &#39;|&apos; &amp;`；非 contenteditable 走 `String(el.value || '')`（**故 `{value: 0}` 得 `''`**）。
- **文件判定**：视频 `video/` 或 `mkv|mov|mp4|webm`；图片 `image/` 或 `avif|gif|jpe?g|png|webp`；音频 `audio/` 或 `aac|flac|m4a|mp3|ogg|opus|wav`。三者均以 `type` 前缀（`toLowerCase`）或 `name` 扩展名匹配。

## 3. 接线状态（零生产消费方，记账）

本批 9 件**全部落地不接线**，本仓**零生产消费方**（逐名 `grep` 均为 0，详见 §1）。原因：端口里这批是「替换工作室」工作区的**底层纯函数集**，其调用方是未移植的工作区控制器、应用装配（`personReplacementApplication.js`、`personReplacementWorkspace.js`、各 `*Controller.js`）与工程/结果编排层；本仓这些宿主**整体不存在**。

按既定纪律：**不为「有引用」而擅自接线**，也不伪造消费方。缺口如实记账于本节与台账第85批记录。

## 4. 依赖闭合与目标选择审计

本批的选目标是「窄扇面 + 多次过滤」的结果，证据如下。

**(a) 端口该目录整体体量大但绝大多数受阻**：`src/modules/personReplacement/` 端口 110 件里绝大多数 `import` 命中本仓**不存在**的兄弟（工作区控制器、渲染器、媒体播放控制器等），逐件闭合扫描后仅剩少数**自足**件。本批的 9 件即是这批自足件里**彼此协作成链**的一片（`replacementStudioTerminology` → `workspaceStudioModes`；其余 7 件零 import）。

**(b) 扫描器盲点（本批暴露，必须记住）**：`b82/scan-closure.mjs` **只统计 `import` 声明，不识别 `export … from` 再导出**。故 `replacementStudioTerminology.js` 在扫描里报 `deps:0`，实际却依赖 `../workspaceStudioModes.js`（该文件本仓此前不存在）。发现方式：对所有候选件直接 `grep -n "^import|from '"` 复核端口导入面。**修正动作**：把 b85 从 8 件扩到 **9 件**，补入 `workspaceStudioModes.js`，使依赖链**真正闭环**。此后每批候选件都必须**直接 grep 复核导入**，不采信 `deps===0`。

**(c) 结论**：本仓自带一致性——**没有任何一条缺失但闭合的模块被现有仓库文件 import**。因此每批只能以「特性区自洽 + 可离线验证」立批，并把「未接线」如实记账，而不是靠修一条断链来立批。

## 5. 已执行的离线验证

全部为**离线静态检查**，未联网、未跑 Electron、未起服务、未打开真实窗口、未写任何仓库外运行状态：

- `node --check` × 9 源码 → 全 `exit 0`。
- 纯 Node `import()` 冒烟 × 9 → 导出名清单与预期一致，导出计数 2 / 2 / 1 / 6 / 3 / 2 / 4 / 6 / 4（共 **30** 个导出名）。
- 忠实性：`cmp` × 9 对端口（`deobf-tools/b85/port/` 预格式化副本）**逐字节一致**（9/9 `IDENTICAL`）。对称字面量集合差分（`b85/litset.mjs`，端口原始反混淆件 vs 本仓件）：6 件 `OK`（字面量集合完全相同，`|P|=|R|` = 1/0/25/24/25 等），3 件因 **Prettier `quoteProps:'as-needed'` 去掉冗余对象键引号**而出现 `onlyRepo=[]` + `onlyPort` 全为对象键（`personReplacementOutputLineage` 的 `compositePreviewMode`/`originalAudioRef`/`status`；`personReplacementProjectLibrary` 的 `schemaVersion`；`personReplacementVoiceLibrary` 的 `localPath`/`fileName`/`updatedAt`/`targetKind`/`sourceAssets`/`assetRefs`/`notify`/`voiceRef`）——**逐键 grep 复核，均在本仓件以裸 `key:` 形式存在**（如 `voiceRef: _0x658db || _0x438f451`、`notify: ![]`），属预期良性差异。
- 测试：`node --test --test-timeout=25000 --test-reporter=tap <9 个测试文件>` → **46/46 全绿**（1+1+1+7+5+8+9+10+6）。首跑 **42/46**，4 处**期望写错**已修正、**实现未改**：①`projectPersonReplacementGenerationTaskIdentity` 的 `defaults.provider` 会填入（`meta.provider` 为 `undefined` 时走默认），期望漏写 `provider`；②`assignPersonReplacementPromptIndexes` 新号**按框中心 x 升序**发放（`near/far` 有框者先得 4/5，`x/y/z` 后得 3/6/7，`noBox` 的 `Infinity` 排最后得 8），我原先按输入顺序预期有误；③`readPersonReplacementVideoPromptEditor({value: 0})` 返回 `''`（`String(0 || '')`），非 `'0'`；④`'x<p>y</p>z<span>w</span>'` → `'xy\nzw'`（**仅闭合**标签映射为 `\n`，开头 `<p>` 只是被剥离）。
- 回归：`src/**` 全量 **1 794/1 751/43 → 1 840/1 797/43**（恰好 +46/+46/0）；43 项失败的**名字集合**与 b83、b85 基线**逐行 `diff` 一致**（全部仍归属缺失夹具 `tests/testPreviewDom.js`，**不伪造**）。本批**未触碰 `electron/`**（7 分钟窄窗 `find -mmin` 命中 0 个 electron 文件；沿用 **1 649/1 648/1**）。
- 快照：`0/67/522/0 → 0/67/523/0`（+18 = 9 源码 + 9 测试；专题文档另计 +1 ⇒ 523；`modified=67` 稳定）。
- `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` **未变**。

## 6. 未执行的验收项

- 未做工作区接线，故**未做**任何 UI 级验收：未验证提示词编号是否真的与画布框选联动、输出血缘状态机是否真的驱动了合成/终混按钮、工程库归一化是否真的修好了历史工程载入、声音绑定是否真的把音频加进工程并写回人设。
- 未真机运行 Electron、未做构建、未做「替换工作室」整页流程压测。
- `bindPersonReplacementCharacterVoice` 的四个注入依赖（`showToast`/`addLibraryAssetsToProject`/`normalizeLocalPath`/`resolveMediaUrl`/`setProject`）在本仓**无真实宿主**，测试以 `makeHarness()` 工装注入并断言调用序列与写回对象；真宿主契约未对照验收。
- `personReplacementGenerationTaskIdentity` 的 `requestId`/`meta.rhProviderProfileId` 等字段在真实任务中心侧的取值来源未对照。

## 7. 约束复核

- 未改 `api/freeImageHostApi.js`（md5 不变）；未改 `style.css`；未改 `src/i18n/messages/*`；未新增 npm 依赖。
- 未做批量覆盖式操作：本批为 9 件**新建**（`cp` 逐件指定文件名，且开工前逐个 `ls` 确认目标 `NEW`）+ 9 件**新建**测试；开工前已 `git status` 记基线 `0/67/522/0`。
- 未 `git reset/clean/checkout`；未动 `D:\shuocancas`（端口资源仅只读；移植副本取自临时反混淆树 `C:\Users\luobote\.qoder\tmp\shuo-deobf\`）。
- 未伪造消费方（§3）。未把临时目录或开发机绝对路径写入本仓运行时代码。

## 8. 下一批建议

1. **b86 候选（同为闭零依赖簇）**：继续在零依赖闭合模块里按特性区成批落地。本仓尚未开口的零依赖大簇：`src/modules/storyboard3d`（30 件 / 172 165 B）、`src/modules` 顶层（50 / 163 271）、`src/core`（32 / 126 784，b84 已取其 6）、`src/modules/storyWorkspace`（30 / 109 606）、`src/modules/agent`（26 / 108 613）、`src/modules/collaboration`（13 / 32 392）、`src/components/aigenImage`（6 / 18 839）、`src/modules/panoramaSceneNode`（5 / 38 363）。**每件都必须直接 grep 复核导入面**（`scan-closure` 不认 `export … from`，见 §4(b)）。
2. **personReplacement 区可继续收窄推进**：本批只取 9 件；该目录仍有若干自足件（如纯常量/纯文本映射类），可按同样三步（导出名对照 + 世代对照 + 逐字节落地）续批，但**工作区编排层**须等工作区宿主零件齐备后才谈接线。
3. **受阻解阻路径（均须单独成批 + 真机验证）**：①`rendererVirtualization.js` 升代 → 解 pan-preview 家族 2 名导入；②`canvasMediaLocalService.js` 升代（28 消费方）→ 解 `assetCoverResolver.js`/`nodeManagerListSnapshot.js`/`NodeManagerPanel.js`；③`src/components/media-clip` 6 件（同名兄弟升代）与 `mediaClipMaterialMenuView.js`（`shortcuts.js` 缺 `getShortcutLabel` 导出）。
4. 不变项：`main.js` chrome-shell 最终装配、`nodeBatchExport.toasts.*` 7 键 × 2 locale 补词（需授权改 `src/i18n/messages/*`）、后端 spawn 点切 `resolveBackendLaunchSpec`。
