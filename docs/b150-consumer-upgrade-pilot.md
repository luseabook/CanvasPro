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
