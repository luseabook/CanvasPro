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
