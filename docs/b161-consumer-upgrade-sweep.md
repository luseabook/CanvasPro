# 消费方升代清扫与可行性判定（第 161 批）

> 第 150–157 批靠「逐件升代在用消费方」接线，接了 167 件。本批问一个更根本的问题：
> **这条路还能不能继续走下去**。答案是不能——除 1 件外，剩余候选升代全部带回归。
> 本批只落 1 件，其余都是**负结果的定量证据**。工序见 `docs/b150-consumer-upgrade-pilot.md` §1。

## 1. 起点

可达性重算（`deobf-tools/b126/reach.mjs`）：scope 1992 / 可达 1791 / **孤立 201** / 断链 0。
接线清单（`tools/porting-wiring-plan.mjs`）：201 件中 **102 件有可达消费方**，涉及消费方 30 余个。
把它们按「目标目录 + 风险类别」分组后，剔除三类不可碰的目标：

| 类别 | 例子 | 为什么不碰 |
| --- | --- | --- |
| manifests 聚合层 | `modelRegistry`、`vendor*ModelApiManifests`、`ModelApiManifestNormalizer` | b156 实证：规格变更型，落一次改全部请求 body |
| 受保护装配件 | `uiSchemaRenderer.js`、`aigenText/uiModule.js` | §2.3，须单独成批 + 用户授权 |
| api 域 | `aiAudioApi` / `aiImageApi` / `aiVideoApi` / `aiTextApi` | b152 实证：十取七败 |

剩下两个可评估集合：**b157 回滚的 12 件**、**13 件从未评估的新候选**。

## 2. 实验一：b157 的 12 件能否作为整体落地

b157 用 leave-one-out 判定这 12 件「致回归」后回滚。但 b156 的教训是**闭包耦合会让
leave-one-out 失真**（单件回滚引入自身错配），所以要重做一次「整体落地」实验。

| 状态 | tests | pass | fail |
| --- | --- | --- | --- |
| 基线（12 件回滚） | 420 | 417 | **3** |
| 12 件整体升代 | 420 | 350 | **70** |

**净增 67 例**：54 例断言值不匹配 + 13 例抛异常/挂起（另 3 例是 `installerSafety` 的基线失败）。
断言形态全部是「实现已按新规格取值、测试仍断言旧值」：

```
not ok 338 - video task orchestration: modelApi adaptive ratio uses source media size
  '9:16' !== '自适应'          expected: '自适应'   actual: '9:16'
```

结论：**这不是闭包耦合，是真实的规格变更**。b157 的判定成立，12 件不可整体落地。

## 3. 实验二：13 件从未评估的新候选

选法：非受保护、非 manifests 聚合层、非 api 域，且有明确接线收益（能接通 ≥1 个孤立件）。

| 文件 | 可接通孤立件 |
| --- | --- |
| `src/components/video-node/resultRenderModule.js` | 2 |
| `src/components/video-node/mediaPlaybackRecovery.js` | 1 |
| `src/components/video-node/previewControlsModule.js` | 1 |
| `src/components/SourceImageNode.js` | 1 |
| `src/components/aigenImage/uiModule.impl.js` | 7 |
| `src/components/aigenImage/taskOrchestrationModule.impl.js` | 6 |
| `src/modules/nodePromptShared.js` | 3 |
| `src/components/nodeToolbar/videoToolbar.js` | 5 |
| `src/core/generationTaskRuntime.js` | 2 |
| `src/components/nodeToolbar/videoActions/keyingAction.js` | 1 |
| `src/components/nodeToolbar/videoActions/removeAction.js` | 1 |
| `src/modules/interaction/DragController.js` | 1 |
| `src/manifests/video/dreamina/dreaminaVideoManifest.js` | 1 |

机械工序 13/13 通过（改名 4,476 个标识符、闸门 PASS、`node --check` ok）。

**整体落地后跑 15 个相关测试文件**：

| 文件 | tests | pass | fail | cancelled | 失败性质 |
| --- | --- | --- | --- | --- | --- |
| `generationTaskRuntime.js` | 114 | 90 | 2 | 22 | 2 断言 + **22 挂起** |
| `DragController.js` | 114 | 104 | 10 | 0 | 断言 |
| `resultRenderModule.js` | 114 | 109 | 5 | 0 | 断言 |
| `SourceImageNode.js` | 114 | 110 | 4 | 0 | 断言 |
| `previewControlsModule.js` | 114 | 113 | 1 | 0 | 断言 |
| `mediaPlaybackRecovery.js` | 114 | 113 | 1 | 0 | 断言 |

基线是 114/114/0。**这 6 件单件落地就挂自己的同名测试**，且不波及别的文件（总数恒为 114）。

`generationTaskRuntime` 的 22 例是 `failureType: 'cancelledByParent'`、
`Promise resolution is still pending but the event loop has already resolved`
——**不是断言失败，是 Promise 永不 settle**，即升代件期望的依赖/回调在旧环境里不存在。这是第二类失败形态。

### 3.1 第一次 add-one 探测是**假阴性**

剩下 7 件没有同名测试。第一次 add-one 只跑那 6 个同名测试文件，得到「7 件全部 0 失败」。
但整体落这 7 件后跑**全量回归**：**11,157 pass / 36 fail**（基线 11,190 / 3）——**净增 33 例**。

教训（已写入 `docs/b150-consumer-upgrade-pilot.md` §14.1）：
**add-one / leave-one-out 的测试集合必须包含「交叉影响测试」，只跑同名测试会得出假阴性。**
定位交叉影响的办法：从全量分片的 `failures[]` 名字反查测试文件：

```
buildGenerateVideoRequest should build Dreamina route-specific request  -> api/aiVideoApi.test.js
GRSAI 有参考图+自适应时透传 API auto                                     -> aigenImage/taskOrchestrationModule.test.js
官方即梦和 APIMart 即梦显示名分离                                        -> video-node/parameterPanelModule.officialLabel.test.js
…
```

共 9 个交叉影响文件，与 6 个同名文件合并成 15 个文件的**可靠探测集**。

### 3.2 可靠的 add-one 结果

| 文件 | 15 文件下失败数 |
| --- | --- |
| `videoActions/removeAction.js` | **0** |
| `nodePromptShared.js` | 1 |
| `videoActions/keyingAction.js` | 1 |
| `videoToolbar.js` | 3 |
| `aigenImage/uiModule.impl.js` | 3 |
| `video/dreamina/dreaminaVideoManifest.js` | 10 |
| `aigenImage/taskOrchestrationModule.impl.js` | 14 |

leave-one-out（同一 15 文件集）的相互印证：`removeAction` 与 `keyingAction` 回滚后失败数不变（零责），
`taskOrchestrationModule.impl`（-14）与 `dreaminaVideoManifest`（-10）是主责件。两种方法一致。

## 4. 结果

| 项 | 值 |
| --- | --- |
| 落地 | **1 件**：`src/components/nodeToolbar/videoActions/removeAction.js` |
| 该件验证 | 15 文件 0 失败；全量 **11193 / 11190 / 3** 与基线逐条一致 |
| 孤立模块 | **201 → 200**（断链 0） |
| 其余 12 件 | 全部回滚，工作区干净 |
| 未落地的 19 件（12 + 7） | 见上文失败矩阵 |

## 5. 结论：为什么剩余件接不动

两类失败贯穿全部实验：

1. **契约/规格变更**（断言值不匹配）：如 `'9:16' !== '自适应'`。0.7.16 改了解析与规格，
   测试断言的是 0.4.12 的行为。改测试才能落。
2. **装配失配**（Promise 永不 settle / 抛异常）：升代件期望同代的其他件、回调或注入，
   孤立升代时它们不存在。

两者都指向同一件事：**这批消费方与 0.7.16 的其他件是一个整体，不能按件切**。
「逐件接线」在 b150–b157 的干净件阶段有效，到本批**已到收益极限**。

## 6. 路径选项（需用户裁决）

| 路径 | 内容 | 代价 |
| --- | --- | --- |
| **A. 整代升代** | 按闭包成组升代，同步更新受影响的测试（把断言改到新规格） | 工作量最大，但这是「追平」唯一完整的路；需要产品侧对规格变更逐条裁决 |
| **B. 真机验证驱动** | 启动应用，按实际功能缺口接线，用**运行期**而非测试断言判定 | 需要授权启动 Electron；测试失败不等于功能坏，可能更省 |
| **C. 停止消费方升代** | 已落孤立件定位为「参考实现」；接线欠账改记为「规格欠账」，等产品决策 | 零风险，但「实际接入」目标暂停 |

## 7. 复现

```bash
node C:/Users/luobote/.qoder/tmp/deobf-tools/b126/reach.mjs        # 可达性 / 孤立重算
node tools/porting-wiring-plan.mjs                                  # 接线清单
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b161/mech.sh           # 机械工序（13 件）
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b161/trial-all.sh      # 实验一：12 件整体
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b161/trial-base.sh     # 实验一基线
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b161/addone7.sh        # 可靠 add-one（15 文件）
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b161/attribute7.sh     # leave-one-out 归因
```

暂存件与逐件日志在 `C:/Users/luobote/.qoder/tmp/deobf-tools/b161/`（不入库）。
