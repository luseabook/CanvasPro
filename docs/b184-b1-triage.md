# B-1 官方目录簇：落库与 T/A 收编台账（184 批）

> 状态：**代码在分支 `b184-b1-catalog`（未合入 master）**；master 保持绿。
> 上游标尺 0.8.9，镜像 `shuo-deobf-089` / `shuo-electron-deobf-089`。
> 差距总账见 `docs/upstream-0.8.9-gap.md`。

## 1. 本批落了什么

| 类别 | 件数 | 说明 |
| --- | --- | --- |
| 新增 | 67 | `manifests/official/*`、`video/modelApi/*`、`dreamina/*`、`api/errors/*`、`modelApiResolvers/*`、`runninghubWorkflowResolvers/*` |
| 修改 | 131 | 厂商适配器、错误解析器、注册聚合器、既有清单叶子；含补齐的 2 件同层依赖 |
| 删除 | 2 | `image/dreamina/dreaminaImageManifest.js`、`video/dreamina/dreaminaVideoManifest.js`（已迁至 `manifests/dreamina/`，全仓无引用） |

工序：`bool → auto-map → rename → verify → node --check` 四闸门全 PASS、传递闭包 0 断链。

补齐的两件同层依赖（B-1 闭包当年漏掉的原因：它们在仓库里已存在，闭包只拉「仓库缺」的文件）：

- `src/modules/modelMediaInputLimits.js`：193 → 374 行，新增 `resolveModelMediaInputParams` /
  `resolveModelMediaInputSlots` / `getModelMediaInputExtension`，是超集。
- `api/officialAccountRuntime.js`：单行压缩版 → 79 行可读版，新增 `getOfficialAccountIdentity` 等，是超集。

保留的仓库自有能力（**不要跟着上游删**）：`api/adapters/ModelApiManifestNormalizer.js` 末尾的
`resolveProviderProfileConfig` + `isProviderProfileReady` 兼容块。0.8.9 把这段「按 Key 可用性选线」
内联成不导出的 `resolveProviderConfig` 且**不再判断线路是否配了 Key**；仓库 0.4.12 血统的
`aiTextApi` / `aiVideoApi` 仍导入旧名，`providerProfile.test.js` 6 例锁定该语义。
待这两个 API 升到 0.8.9 后可整块删除。

## 2. 三个落地配置的实验结论（重要）

| 配置 | 结果 | 结论 |
| --- | --- | --- |
| A 全量 B-1（代码新 + 数据新） | 11313 例 / 152 失败 | 唯一可用配置 |
| B 代码新 + 既有清单叶子回退旧版 | 9734 例 / 346 失败（1579 例整文件加载失败） | ✗ 新版校验器直接拒收旧清单 |
| C 只留新增件 + 聚合器，回退其余 127 件 | 校验器抛 `uiSchema randomSeedRow field seed must use the stepper control`，注册表加载即失败 | ✗ |

**结论：B-1 是全有或全无的一代**，无法切成「只加不改」的子批；后续必须整簇收编，或整簇回退。

## 3. 收编进度

- 收编前：**11313 / 11134 / 179**
- 当前：**11313 / 11161 / 152**（基线 14，净增 138）

已收编（27 例，均属 T）：

1. `src/modules/modelMediaInputLimits.test.js`（10 例）：条目新增 `width`/`height`/`extension`；
   违规对象新增 `index`（1-based）；`maxByKind` 的 `0` 语义收紧为「该类型一个都不允许」，
   只有非有限值（负数 / NaN / 非数字串 / 缺省 / 对象）才算未设限。
2. `api/adapters/RunningHubAdapter.test.js`（17 例）：`runninghub-model/rhart-image-v1|g|g-2|g-2-official`、
   `youchuan v6/v7/v81` 的期望域名 `.cn → .ai`。这些模型本就在
   `RUNNINGHUB_INTERNATIONAL_ONLY_MODEL_IDS` 里，旧断言沿用的是旧清单**未声明线路**时的默认站点。

## 4. 剩余 152 例的根因与处置

### 4.1 A 类：接线缺口（约 20 例，需补文件而非改断言）

`dreamina` 整族模型在注册表里**不存在**（`getModelsByKind('image')` 无任何 `dreamina/*`）。原因：
0.8.9 把 dreamina 改成「目录编译 + 运行时发现」两段式，注册发生在
`src/modules/dreaminaModelCatalogService.js`（仓库**没有这个文件**，它不在任何 staged 文件的导入闭包里）。
该服务调用 `createDreaminaCatalogBundle()` / `createDreaminaDiscoveryBundle()` 并
`registerManifestBundle()`，还依赖 `api/dreaminaCliApi.js` 的快照能力。

处置：下批把这 2 个文件按工序落地并在启动路径接线，`taskOrchestrationModule`（15）、
`aiVideoApi` 的 dreamina 用例（3）会随之恢复。

### 4.2 A 类：模型 id 迁移（约 12 例）

旧 id 只存在于**测试**里（生产代码 0 引用），说明消费者按清单动态解析、无需改代码：

| 旧 id（仅测试用） | 0.8.9 现役 id |
| --- | --- |
| `dreamina/3.5pro` `dreamina/4.1` `dreamina/4.5` `dreamina/5.0` | `dreamina/image/*`、`dreamina/video/*`（discovery 编目） |
| `runninghub-model/hailuo-02` | `runninghub-model/hailuo-2.3` |
| `apimart/grok-imagine-1.0` | `apimart/grok-imagine-1.5` |
| `runninghub/2039336644536442882`（LTX2.3） | `runninghub/2073900179945771009`（displayName 改为 `LTX2.3 文/图生视频全功能`） |

### 4.3 B 类：线路 profile 取不到 Key（约 13 例）

测试夹具用 `getProviderConfig: () => ({ modelApiKey: 'mk' })` 这类「一把钥匙通吃」的桩，
而新代码先解析 `providerProfileId`（如 `agnes-international`、`runninghub-international`）再取配置，
夹具未按 profile 返回 → 报 `API Key 未配置`。属**夹具伪影**，应补夹具（按 profile id 返回配置）
后**恢复正向断言**，不可放宽断言。

### 4.4 C 类：工作流节点结构变更（约 30 例）

`LTX2.3`（347/346/349/269 → 403/369/366/400/387）、`Hailuo H3`、`BERNINI`、`Scail V2`、
`视频编辑V5.4`（新增「请接入参考图」前置校验）等 runninghub 工作流的 nodeInfoList 与
前置校验整体换代。必须逐例读新清单重写断言（约 7 例/小时），不可批量替换。

### 4.5 D 类：UI 菜单/参数面板（约 40 例）

`video-node/parameterPanelModule`（16）、`referenceInputModule`（7）、`aigenImage/taskOrchestration`（15）、
`aigenText/uiModule`（2）、`generationNodeHelpTip`（2）等：面板从清单读菜单与 `uiSchema`，
新目录带来模型增删与字段变化。其中一部分需**改断言**，另一部分要确认**消费方是否跟上了新 uiSchema 契约**。

## 5. 剩余清单（按文件）

```
 21  api/aiImageApi.agnes.test.js
 16  src/components/video-node/parameterPanelModule.officialLabel.test.js
 15  api/aiVideoApi.test.js
 15  src/components/aigenImage/taskOrchestrationModule.test.js
 13  api/aiTextApi.test.js
  7  src/components/video-node/referenceInputModule.test.js
  7  src/modules/modelProviderProfileSelection.test.js
  6  api/adapters/RunningHubAdapter.test.js
  6  api/dreaminaGenApi.test.js
  6  src/modules/dreaminaVideoModelHelper.test.js
  4  api/adapters/ApimartAdapter.test.js
  3  api/aiVideoApi.agnesProfilePoll.test.js
  3  src/modules/imageFreeAngleAspectRatio.test.js
  3  src/components/video-node/taskOrchestrationModule.test.js
  3  src/modules/modelInputPolicy.test.js
  2  api/aiAudioApi.test.js
  2  src/components/aigenText/uiModule.test.js
  2  src/components/generationNodeHelpTip.test.js
  2  src/modules/personReplacement/personReplacementImageGeneration.test.js
  2  src/modules/storyWorkspace/storyWorkspaceModelCatalog.test.js
  2  src/modules/videoRetake/segmentRetakeModelPreference.test.js
  1  api/adapters/modelApiMappingEngine.test.js
  1  api/adapters/modelApiResolvers/imageResolvers.test.js
  1  src/components/AIGenAudioNode.test.js
  1  src/components/audio-node/audioWorkflowRefSlots.test.js
  1  src/manifests/video/runninghub/runningHubVideoHailuoH3DualSamplingX2Manifest.test.js
  1  src/manifests/video/runninghub/runningHubVideoHailuoH3OmniManifest.test.js
  1  src/modules/characterAssets/characterAssetImageGeneration.test.js
  1  src/modules/personReplacement/personReplacementImageGate.test.js
  1  src/modules/storyWorkspace/storyClipInputSlots.test.js
  1  src/modules/storyboard3d/modelSelection.test.js
  1  src/modules/videoRetake/segmentRetakeModelPolicy.test.js
```

## 6. 下批动作（建议顺序）

1. **接线 dreamina 目录服务**（4.1）：落 `src/modules/dreaminaModelCatalogService.js` +
   `api/dreaminaCliApi.js` 快照能力，接到启动路径；验证 `getModelsByKind` 出现 dreamina 族。
   → 预期消掉 ≈18 例。
2. **B 类夹具修正**（4.3）：改 `getProviderConfig` 桩为按 profile 返回，恢复正向断言。→ ≈13 例。
3. **A 类 id 迁移**（4.2）：按上表替换测试输入的模型 id。→ ≈12 例。
4. **C 类逐例重写**（4.4）：runninghub 工作流节点映射。→ ≈30 例。
5. **D 类面板断言**（4.5）：→ ≈40 例。
6. 全绿后合并 `b184-b1-catalog` → master，跑后端全量与 `check:csp`，双推。

## 7. 操作坑（本批踩到，务必记住）

- `cp -r port/src/. src/` 会用 staging **原件覆盖**手工改过的文件。本批因此丢掉
  `ModelApiManifestNormalizer` 的兼容块，导致 119 例整文件加载失败（152 → 241）。
  **重落 staging 后必须重新施加所有手工编辑**，并跑 `namecheck` 复核具名导出。
- `git status --porcelain` 默认把全新目录折叠成 `?? dir/`，逐件核对要加 `-uall`。
- `deobf-rename` 会在 staging 目录留下 `*.map.json` 中间产物，落库后必须清理，否则显示为未跟踪文件。
- 诊断断链优先用「导入解析 + 具名导出」两个脚本（本会话临时脚本在
  `deobf-tools/b184/namecheck.mjs`），比跑全量快两个数量级。
