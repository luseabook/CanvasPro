# 消费方升代小样试跑（第 150 批）

> 前置：`docs/wiring-reality-check.md` 已证明「只补 import」没有有效目标，真动作是**升代在用消费方文件**。
> 本批是用户选的**小样试跑**（并单独授权覆盖在用文件），目的不是追求数量，而是
> **用真实回归数据回答：整批能不能推**。

## 1. 工序

按 `docs/deobfuscation-workflow.md` §3.2「落件时顺手改名」执行——**这一步不能省**：
反混淆镜像本身仍带 `_0x` 名，直接拷进仓库会把混淆灌回来。

```
镜像件 --prettier--> 暂存件
暂存件 --deobf 改名--> 暂存件        # 此时消费方尚未接入，最安全
闸门：deobf-verify <改名前的自己> <改名后的自己>   必须 PASS
落地 --> node --check --> bare 导入 --> 目录测试 --> 全量回归
```

闸门比较对象选择「改名前的自己」而非「镜像原文」，是因为两者同为 prettier 输出，
token 流可直接比对；而 prettier 本身 token 不保等，不能用原文做基线。

## 2. 试跑集合

从 `docs/wiring-reality-check.md` 认定的**干净候选**（仓库导入集 ⊆ 镜像导入集）中挑选，
刻意横跨三个目录与两类风险路径：

| 文件 | 孤立件 | skew | 路径类别 | 下游消费方数 |
| --- | --- | --- | --- | --- |
| `src/manifests/video/modelApi/vendorVideoModelApiManifests.js` | 5 | ×0.02 | unused（极端抽取） | 2 |
| `src/components/aigenImage/uiModule.impl.js` | 7 | ×0.89 | unused | 1（受保护 `uiModule.js`） |
| `src/components/aigenImage/taskOrchestrationModule.impl.js` | 6 | ×0.81 | unused | 1 |
| `src/modules/canvasCommands/index.js` | 6 | ×1.29 | unused | 9（含 `main.js`） |
| `src/modules/panoramaSceneNode/scene3dBridge.js` | 3 | ×0.93 | LOCAL-DECL→import | 2 |

## 3. 机械工序结果：5/5 全过

| 检查项 | 结果 |
| --- | --- |
| prettier 归一化 | 5/5 ok |
| `_0x` 改名（共 **2081** 个标识符） | 5/5 闸门 PASS，token 流逐一相同 |
| `_0x` 残留 | 5/5 为 **0** |
| 导出面（仓库 ⊆ 镜像，0 丢弃） | 5/5 完全一致，且**均为 0 新增** |
| `node --check` | 5/5 ok |
| bare 导入 | 3/5 ok（另 1 件见 §4，它把另外 3 件连带拖垮） |

导出面「完全一致且无新增」是最理想的情形：**对外 API 不变，内部换成新一代实现**。

## 4. 两处硬失败（均已回滚）

### 4.1 `vendorVideoModelApiManifests.js`：不能单件升代

单独升代该文件会让 `src/manifests/modelRegistry.js` 在**模块求值期**抛异常，
从而拖垮所有传递依赖它的导入链（包括 `canvasCommands/index.js`）。逐层定位到一行：

```
[manifest] model manifest uiSchema.fields[1] missing required fields: defaultValue
modelId=apimart/gemini-omni-flash
fields[1] = { id: 'extend_from_task_id', type: 'text', defaultValue: '', allowEmpty: true, … }
```

`modelRegistry.assertRequiredFields` 的判定为
`target[k] === undefined || target[k] === null || target[k] === ''`，**空串也算缺失**。

排除了以下可能：

- `createVideoModelApiManifest`：仓库版与镜像版**逐字同构**（连 `fields` 默认值都一样）；
- `freezeFields`：两版同为 `list.map(Object.freeze)` 的直传；
- 校验器 `assertRequiredFields`：两版同为含 `=== ''` 的三条件判定；
- 字段常量 `GEMINI_OMNI_FLASH_EXTEND_TASK_FIELD`：两版逐字相同；
- `apimartVideoModelApiManifests.js`：`gemini-omni-flash`、该字段名出现次数两版一致。

结论：**差异在两个版本的聚合层**，因此这个文件**不存在单件升代的解法**，必须连同依赖闭包一起评估。
按「失败即回滚」保留 HEAD。

### 4.2 行为回归：2 件必须回滚

4 件落地后的全量回归：**11185 tests / 11163 pass / 22 fail**，而基线为 **11182/3**，
即**新增 19 个失败**。逐件归因（回滚一件重跑一次 `src/components/aigenImage` 目录测试）：

| 文件 | 归因新增失败 | 处理 |
| --- | --- | --- |
| `src/components/aigenImage/taskOrchestrationModule.impl.js` | **16** | 回滚 |
| `src/components/aigenImage/uiModule.impl.js` | **3** | 回滚 |
| `src/modules/canvasCommands/index.js` | **0** | 保留 |
| `src/modules/panoramaSceneNode/scene3dBridge.js` | **0** | 保留 |

16 个集中在 `taskOrchestrationModule.test.js` 与 `storyMediaBatchRecovery.test.js`；
3 个为 `multiResultStackBackplates.test.js` 两例 + `stateSyncModule.test.js` 一例。

回滚两件后 `src/components/aigenImage` 目录 **174/174 全绿**；
保留两件的目录测试 `canvasCommands` **64/64**、`panoramaSceneNode` **140/140**。

## 5. 最终状态与收益

落地 2 件（`canvasCommands/index.js`、`scene3dBridge.js`），共计改名 828 个标识符：

- **孤立模块 368 → 356**，接通 12 件：6 个 `canvasCommands/*` 子命令模块 +
  6 个 `panoramaSceneNode/scene3d*` 模块。
- 全量回归回到基线：**11185 tests / 11182 pass / 3 fail**（3 个为 `electron/installerSafety.test.js`
  里改动前就存在的失败；Python 132 测例中亦有 3 个改动前既存失败），**零新增失败**。

> 注：试跑中途曾以 5 件状态跑过一次全量回归，得到 22 失败。那份数据用于归因，
> 最终定稿以 §5 的 2 件状态为准。

## 6. 结论：整批不能按「机械 replacements」推进

1. **升代会改行为**，不等价于重构。`taskOrchestrationModule.impl.js` 一件就带来 16 个回归——
   新一代实现改变了既有可观测行为，现有测试正是照旧行为写的。
2. **存在依赖闭包约束**。`vendorVideoModelApiManifests.js` 单件必挂，且排查后确认
   不是它自身或任一被比较文件的局部差异，必须按闭包整体评估。
3. **退而形成的 Counter-example 也很值钱**：干净候选里确实有一批（本批 2/4 通过率）
   能零回归完成升代 —— `canvasCommands/index.js` 下游 9 个消费方（含 `main.js`）依然全绿。

因此整批若要继续，必须：**逐件验证 + 失败即回滚 + 按依赖闭包分组**，
而不是把 104 件当作一次批量替换。

## 7. 第 151 批续：`src/core` 干净件（6 取 5）

按同一工序对 `src/core` 的 6 个干净候选（onlyRepo=0、非受保护）升代：

| 文件 | 改名 | 结果 |
| --- | --- | --- |
| `rendererResizePreview.js` | 23 | 保留 |
| `viewportFocus.js` | 79 | 保留 |
| `viewportPanPreview.js` | 32 | 保留 |
| `stores/legacyKernelStore.js` | 664 | 保留 |
| `stores/facadeStore.js` | 5 | 保留 |
| `generationTaskRuntime.js` | 289 | **回滚**（自身测试约 24 例回归，同 §4.2 性质） |

机械工序 6/6 全过（导出面 6/6 完全一致、`_0x` 残留 0）。保留 5 件后：
core 目录 266/266、stores 目录 21/21；孤立模块再接通 **11 件**（368 口径 356 → 345）：
`canvasZoom`、`nodeGeometryOverlay`、`rendererGeometryPreview`、`rendererViewportTransform`、
`viewportGridDots`、`interaction/previewCommitSession` 与 stores 族 5 件
（`generationHistoryState`、`graphMutationBoundary`、`graphMutationImpact`、`rendererStateRevisions`、`viewportScreenFrame`）。

**既有雷（非本批引入）**：`stores/runtime.js` 第 1 行以本地名 `legacyKernelStore_2` 导入
`legacyKernelStore.js` 并在第 3 行顶层急切解引用，而 `legacyKernelStore.js` 的依赖链可达
`runtime.js`——以任一文件为**直接入口**做 bare 导入必触发 TDZ
（`Cannot access 'legacyKernelStore_2' before initialization`）。
HEAD 原件同样必挂，属循环导入 + 求值顺序的环境性产物；应用内入口顺序不同所以不炸。
修复需改在用 `runtime.js` 初始化顺序，须单独授权。bare 导入闸门对 stores 件以目录测试替代。

## 8. 第 152 批续：`api` 干净件（10 取 3）

对 `api` 的 10 个干净候选（onlyRepo=0、非受保护、无受保护下游）升代，逐件落地逐件归因：

| 文件 | 改名 | 归因失败 | 结果 |
| --- | --- | --- | --- |
| `imageUploadApi.js` | 136 | 0 | **保留** |
| `runninghubWorkflowApi.js` | 53 | 0 | **保留** |
| `sceneDetectionApi.js` | 42 | 0 | **保留** |
| `adapters/ModelApiManifestNormalizer.js` | 883 | 50 | **回滚** |
| `aiImageApi.js` | 628 | 38 | **回滚** |
| `aiVideoApi.js` | 522 | 9 | **回滚** |
| `adapters/runninghubWorkflowResolvers/index.js` | 240 | +7 | **回滚** |
| `aiTextApi.js` | 447 | 6 | **回滚** |
| `providerConnectionTestApi.js` | 379 | 6 | **回滚** |
| `aiAudioApi.js` | 465 | 1 | **回滚** |

机械工序 10/10 全过（共改名 3,795、闸门 PASS、导出面 0 丢弃、`_0x` 残留 0）。
保留 3 件后 api 目录 658/658；再接通孤立 **4 件**（368 口径 345 → 341）：
`api/customProviderAssetUploadApi`、`api/runninghubTaskLifecycle`、
`api/runningHubUploadResponse`、`api/runningHubWorkflowPollingPolicy`。
全量 11185/11182/3，失败名单与基线逐条一致，零新增。

**关键结论：`api` 域回归密度远高于 `core`/`commands`**——10 取 7 败 vs core 的 6 取 1 败。
新代 api 层包含密集真实行为变化（轮询策略、错误分类、请求体组装、探针顺序），
其单测恰好逐条编码了旧行为。**后续 api 消费方升代（含 `api/index.js` 门面）必须按依赖闭包
分组推进，先把行为差异当作规格差异逐条裁决，而不是当作「测试侧预期」修正。**

## 9. 第 153 批续：授权目录干净件（7 取 4）

对 `src/modules` + `src/components` 剩余干净候选取收益最高的 7 件升代：

| 文件 | 改名 | 归因失败 | 结果 |
| --- | --- | --- | --- |
| `components/MediaClipNode.js` | 1,034 | 0 | **保留** |
| `components/PanoramaSceneNode.js` | 527 | 0 | **保留** |
| `modules/SettingsManager.js` | 1 | 0 | **保留** |
| `modules/app/appPanels.js` | 264 | 0 | **保留** |
| `modules/interaction/DragController.js` | 693 | 10 | **回滚** |
| `components/nodeToolbar/videoToolbar.js` | 134 | 3 | **回滚** |
| `modules/nodePromptShared.js` | 833 | 1 | **回滚**（aigenImage stateSync 连带） |

机械工序 7/7 全过（共改名 3,486、闸门 PASS、导出面 0 丢弃、`_0x` 残留 0）。
保留 4 件后：孤立 341 → **313**（368 口径累计接通 55）；483 口径删 11 件为 461/1238，
`canvasShortcuts` 与 `tutorials` 两组清零。全量 11185/11181/4，唯一新增失败即 nodePromptShared
归因件，回滚后复验绿、失败名单与基线一致。

**两条新教训**：
1. **目录测试必须覆盖全部受影响子目录**——nodePromptShared 下游 31 个导入方含
   `aigenImage/` 子目录，首轮目录测试只跑了顶层 glob，漏网 1 例，靠全量回归兜住。
   后续升代批的目录测试按「落地文件的全部下游所在目录」枚举。
2. **`window is not defined`（bare 导入）是浏览器目标文件的既有环境特征**——HEAD 同样
   必挂（videoToolbar 18 处、interaction.js 60 处 window 引用），不作为闸门失败依据。

## 10. 第 154 批续：gain≥2 干净件全取（13 取 11）

候选重算（`deobf-tools/b154/find-candidates.mjs`）：排除已归因失败件 / 受保护件 / 不可单件后，
剩余干净候选 45 件；取授权目录内 gain≥2（可接通孤立件数）的全部 13 件。

| 文件 | 改名 | 归因失败 | 结果 |
| --- | --- | --- | --- |
| `components/aigenText/textGenerationResultRenderer.js` | 28 | 0 | **保留** |
| `components/SourceAudioNode.js` | 136 | 0 | **保留** |
| `components/video-node/resultRenderModule.js` | 525 | 7 | **回滚**（video result render 6 + AIGenVideoNode 连带 1） |
| `components/video-node/previewControlsModule.js` | 202 | 1 | **回滚** |
| `modules/agent/agentActionExecutor.js` | 63 | 0 | **保留** |
| `modules/agent/agentContextBuilder.js` | 104 | 0 | **保留** |
| `modules/AssetManager.js` | 1,062 | 0 | **保留** |
| `modules/imageAnnotate/rendering.js` | 185 | 0 | **保留** |
| `modules/ImageCropController.js` | 261 | 0 | **保留**（导出超集 +4） |
| `modules/ImageFreeAngleController.js` | 171 | 0 | **保留** |
| `modules/ImageMattingController.js` | 327 | 0 | **保留** |
| `modules/panoramaSceneNode/sceneNodeActions.js` | 682 | 0 | **保留** |
| `modules/shortcuts.js` | 253 | 0 | **保留** |

机械工序 13/13 全过（共改名 3,999、闸门 PASS、导出面 0 丢弃、`_0x` 残留 0）。
保留 11 件后：孤立 313 → **291**（368 口径累计接通 **77**）；483 口径删 16 件为 **445/1238**，
`imageAnnotate` 组清零。全量 **11185/11184/0**——零失败，连基线 3 例 installerSafety 偶发也未复现。

**两条新经验**：
1. **目录测试既有失败要先用 stash 在 HEAD 上复核**——`src/services/desktopProjectFileStore`
   5 例在该目录测试跑法下 HEAD 同挂（全量沙箱跑法可通过），属于环境性既有失败，
   不能记到本批头上。
2. **`node --check` 暂存件要先补 `{"type":"module"}` 标记**——裸暂存目录里 ESM 文件会全部
   误报语法错误（import 语句不被识别），与文件本身无关。

**口径提示**：483 口径（scope 1238）为手工维护账，与 reach 脚本现口径（scope 1992，
孤立 291）已不同源；组表历史欠账（b150–153 的 22 件未逐组摊销）已在合计行一次理平（445），
组间分布以头部叙述为准。

## 11. 第 155 批续：干净件 gain≥1 清尾（21 取 17）

候选重算后取授权目录 gain≥1 全部 18 件 + `src/ui/rendererUiEvents`（gain 2）+
`src/services`（keyboardService、toastService 各 gain 1），共 21 件。
manifests 聚合件（modelRegistry gain 5、vendorTextModelApiManifests gain 4 等）与 api 域
仍按闭包分组原则留待规格裁决。

| 归因失败 | 处理 |
| --- | --- |
| `SourceImageNode.js`（4 例：mount 起始/hydration/预载限额/缩略图保持） | **回滚** |
| `video-node/mediaPlaybackRecovery.js`（2 例：loading feedback 跳过、stalled reload 延迟） | **回滚** |
| `nodeToolbar/videoActions/keyingAction.js` + `removeAction.js`（SourceVideoNode 抠像按钮取消 1 例） | **回滚** |
| 其余 17 件 | **保留**（0 失败） |

机械工序 21/21 全过（共改名 3,840、闸门 PASS、`node --check` 21/21、导出面 0 丢弃、
3 件超集：CanvasTabManager +2、EdgeController +4、rendererUiEvents +1）。
保留 17 件后：孤立 291 → **272**（直接 16 + 链式 3：materialComparisonImageCache/Playback/Viewport；
368 口径累计接通 **96**）；483 口径删 8 件为 **437/1238**。
全量 **11185/11182/3**，失败名单与基线逐条一致（3 例 installerSafety 偶发复现，属基线内）。

**新经验：`execFileSync`/`spawnSync` 在沙箱里会被静默杀掉（`status=null signal=null`，stdout 空）**
——大批量目录测试（737 文件）必须用 shell 分批循环跑（每批 ≤150 文件避免 E2BIG），
而不是 Node 脚本聚合调用。此前手工批次未踩到是因为文件数少、直接命令行传参。

## 12. 第 156 批：manifests/api 聚合层侦察（规格变更型，仅落 1 件）

干净候选清尾后，剩余可接通孤立件 >0 的件全部落在 **manifests 聚合层与 api/adapters**。
本批取 11 件（含 b150 记录的"不可单件" `vendorVideoModelApiManifests`）：

| 件 | 镜像-仓库导入 | 性质 |
| --- | --- | --- |
| `src/manifests/modelRegistry.js` | 25→46 | 聚合 + 校验器升级 |
| `src/manifests/video/modelApi/vendorVideoModelApiManifests.js` | 0→10 | 内联→拆分聚合 |
| `src/manifests/text/modelApi/vendorTextModelApiManifests.js` | 1→6 | 聚合 |
| `src/manifests/image/modelApi/index.js` | 13→17 | barrel |
| `src/manifests/image/modelApi/apimartImageModelApiManifests.js` | 1→3 | 聚合 |
| `src/manifests/image/modelApi/grsaiImageModelApiManifests.js` | 1→2 | 聚合 |
| `src/manifests/video/dreamina/dreaminaVideoManifest.js` | 0→1 | 聚合 |
| `api/adapters/RunningHubAdapter.js` | 13→14 | 行为 |
| `api/adapters/ModelApiManifestNormalizer.js` | 9→13 | 规格归一 |
| `api/adapters/runninghubWorkflowResolvers/index.js` | 0→4 | 解析器注册 |
| `api/errors/ErrorParser.js` | 7→10 | **纯新增** |

### 闭包对（实测）

`modelRegistry` 与 `vendorVideoModelApiManifests` **必须同批**：新版 `modelRegistry` 求值期校验器
（`randomSeedRow` 的 `seed` 字段必须用 `stepper` 控件）会拒绝旧版内联的
`VIDEO_SEED_FIELD = { type: 'text', variant: 'randomSeedRow' }`，二者单落必崩（`pass=0`）。
批内同时升代后，11 件裸导入（`import('file:///F:/CanvasPro/…')`）**全部通过**。

### 结论：10/11 属「规格变更型」

机械工序 11/11 全过（闸门 PASS、导出面 0 丢弃），但全量 api 域（1000 例）出现 **67 例失败**
（HEAD 基线 1000/1000 全绿）——全部集中在模型请求构造断言，例如
`Volcengine Seedance` 的 `body.seed` 由 `42` 变为 `undefined`、`RunningHub 视频擦除/抠像/V5.4`
的 `nodeInfoList` 映射、`apimart gpt-image-2 4K` 比例回退、`grsai nanobanana` 枚举等。

根因：仓库里 **0.7.16 的叶子 manifest 文件早已作为孤立件落地**，而聚合器
（`modelRegistry`/`vendor*ModelApiManifests`/`ModelApiManifestNormalizer`）仍是 0.4.12。
升代聚合器 = 一次性接通 0.7.16 的模型规格 → 请求 body 改变 → 断言 0.4.12 旧规格的测试失败。
**逐件回滚归因因闭包耦合而失效**（单件回滚会引入自身错配：回滚 `RunningHubAdapter` 反使失败数上升到 55）。

### 逐件实测（8 个失败测试文件，全落地 = 51 失败）

| 单独落地 | 失败数 | 判定 |
| --- | --- | --- |
| `api/errors/ErrorParser.js` | **0** | 纯新增，安全 |
| `api/adapters/runninghubWorkflowResolvers/index.js` | 7 | 规格变更（改动既有 RunningHub 视频工作流解析） |
| 其余 9 件（含 modelRegistry 闭包对） | 41–55 | 规格变更 |

**b156 最终交付：只落 `api/errors/ErrorParser.js`**（+3 个错误解析器
`ComfyUiErrorParser`/`VolcengineErrorParser`/`VolcengineSpeechErrorParser`，0 回归），
孤立 272→**269**，全量 **11185/11182/3**。余 10 件原地待命，是否采纳 0.7.16 模型规格需产品侧裁决。
