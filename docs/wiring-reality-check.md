# 接线实况核查（第 143 批）

> 结论先行：**「只补 import、不动逻辑」这批任务没有有效目标。** 433 条接线边里，0 条能靠「补一行 import」修好。
> 真正要做的动作是**升代在用消费方文件**，属于改在用文件、有回归风险的工种，必须单独授权。

## 1. 为什么会有「接线」这个说法

第 142 批确认文件级移植欠账已归零（1754 个镜像模块全部在仓库里），余下问题只剩：**368 个孤立模块**——
仓库有这些文件，但没有任何入口通过相对导入触达它们。0.7.16 镜像里有原始导入图，于是可以反推
「谁本该 import 它」。据此产出 `docs/porting-closure-and-wiring-plan.md`。

当时的假设是：仓库那份消费方只是**旧一代、少了一行 import**，补上即可。本次实测推翻了这个假设。

## 2. 实测方法

对全部 `(孤立模块 → 消费方)` 边逐条判定：

1. 从镜像消费方抽出它 import 该孤立件的**具名符号**；
2. 到仓库同名消费方里查这些符号是否出现、出现方式是「引用」还是「本地声明」。

分类口径：

- `unused`——仓库消费方**完全没出现**这些符号；
- `LOCAL-DECL`——仓库消费方**自己声明了**同名符号（多声明式 `const A=1, B=2`、解构赋值等）；
- `GENUINE`——出现且未声明，即真缺 import。

## 3. 结果

| 分类 | 边数 | 含义 |
| --- | --- | --- |
| unused | 293 | 消费方是旧一代，符号连同用它的逻辑都不存在 → 需升代 |
| LOCAL-DECL | 115 | 仓库已自带同名本地实现 → 补 import 会 `SyntaxError`（重复声明） |
| GENUINE | 4 | 初步命中，复核后**全部为误报** |
| 动态 import 边 | 19 | `await import(...)`，另需处理 |

`GENUINE` 的 4 条复核结论：

- `src/manifests/video/modelApi/vendorVideoModelApiManifests.js`：`RUNNINGHUB_VIDEO_MODELS` 等 3 个符号在
  第 3633 行起是**多声明式 `const` 的后续声明项**，初判正则只认 `const NAME` 故漏判。
- `src/modules/panoramaSceneNode/scene3dBridge.js`：11 个 `GIZMO_*` 常量在第 41–61 行的
  `const GRID_MINOR_STEP = 1, …, GIZMO_BASE_AXIS_LENGTH = 1.35, …` 里一次性声明。

结论：**433 条边 = 293 需升代 + 115 本地已实现 + 19 动态 + 6 归类待定。真缺 import 的边为 0。**

## 4. 更关键的一层：两棵树是双向分叉，不是「旧→新」直线

`NEEDS-PORT` 消费方共 104 个。把 specifier 解析成真实路径再比对：

- **74 个**仓库导入目标是镜像的子集（换装不会丢仓库侧导入）——其中 33 个体量差 <5%；
- **30 个**仓库导入了镜像没导的东西；
- **8 个**仓库导入的目标**在 0.7.16 里根本不存在**，换装会删掉仓库独有功能：
  `interaction.js`（whiteboard / comfyui / storyWorkspace / nodeExport / timelineExport 五个模型）、
  `WhiteboardNode.js`（whiteboardModel / whiteboardDrawing / whiteboard.css）、
  `TaskCenterManager.js`（MediaTaskHistoryPanel / mediaTaskRecoveryCanvas / mediaTaskRecoveryModel）、
  `appTopbarAndConfig.js`（providerModelListApi / providerModelCatalog 等 4 件）、
  `CanvasProjectDropdownManager.js`、`projectLifecycle.js`、`imageToolbar.js`、
  `taskOrchestrationModule.js`（storyReferenceVideo）。

规模佐证：仓库 `src/modules` 有 **420** 个条目，镜像只有 **273**；仓库独有 `projectPackage`、`timelineExport`、
`nodeExport` 等目录；镜像把 whiteboard 重构成了 5 个不同名的模块。**两棵树互相都有对方没有的东西。**

体量偏差也能看出方向：`vendorVideoModelApiManifests.js` 镜像只有仓库的 **2%**（仓库把散装模型数据全内联了，
镜像拆成了 10 个兄弟模块）；`agentActionExecutor.js` 镜像则是仓库的 **7.4 倍**（0.7.16 功能更多）。

## 5. 授权范围的重算

原授权：`src/modules`(47) + `src/components`(27) 非受保护消费方共 74 个，只补 import。

实测该范围实为 **72 个非受保护 NEEDS-PORT 消费方**（另 1 个受保护 `uiSchemaRenderer.js`）：

- **46 个**是「干净」的（仓库导入 ⊆ 镜像导入）；
- **26 个**是「脏」的（有仓库独有导入，需逐件人工合并，不能整件换装）。

授权范围外还有 **27 个**干净消费方（`src/core` 6、`api` 11、`src/manifests` 5、`src/services` 3、`src/ui` 1）。

## 6. 可选路径

1. **小样试跑**（推荐先做）：挑 3–5 个干净件（优先 `vendorVideoModelApiManifests.js`、
   `taskOrchestrationModule.impl.js`、`uiModule.impl.js`）整件升代，走全流程闸门 + 全量回归，
   用真实回归数据判断整批可行性。
2. **干净 46 件整批升代**：范围限定在授权目录内的干净子集，逐件过闸门，失败即回滚。
3. **全树对齐 104 件**：含 26 个脏件与 8 个功能分叉件，需逐功能人工合并决策，工作量与风险最高。
4. **暂缓接线**：把孤立件当参考实现留存，先推进其它追平项，接线留待单独排期。

## 7. 边界

- 本核查全程只读，未改动任何在用文件。
- 升代在用文件超出常设授权（常设授权只允许**只新增**落地），须用户单独授权。
- 受保护装配件（含 `uiSchemaRenderer.js`）仍须单独成批、真机验证。
