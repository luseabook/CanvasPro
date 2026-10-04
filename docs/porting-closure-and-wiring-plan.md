# 移植欠账清零复核 + 接线方案（第 142 批）

> 本批**未改动任何仓库源码**，全部是只读复算与方案编制。纠正了 `TRACKING.md` 里已失效的
> 「尚余 636 件」口径，并把下一步（接线）从模糊的「还没接通」变成可执行的清单。

## 1. 结论：文件级移植欠账已清零

第 127 批口径是「原未落地 771，尚余 636」（首波过闸门余 125、受阻 66、后续波次 445）。
第 128–141 批之后停用了跟踪机制，该口径一直没再更新。本批复算结果：

| 复核项 | 方法 | 结果 |
| --- | --- | --- |
| 镜像范围内是否有未落地件 | 直接按文件存在性比对：镜像 `api/ src/ vendor/ main.js` 的非测试模块 vs 仓库 | **1754 件全部存在，0 缺失** |
| 是否还有依赖未闭合 | 重跑 `b127/plan.mjs` | **未落地 0 / 循环 0 / 断链 0 / 解析失败 0** |
| 原有 66 件受阻件是否解阻 | 对首波 326 件重跑 `b123/b123-gate.mjs` | **`MISSING_TOTAL=0`**（既有件升代已补齐那 105 个具名导出） |

所以 `TRACKING.md` 的「尚余 636」是**停用跟踪后的陈旧数字**，已按本批结果改写。
`docs/b127-porting-backlog.md` 作为第 127 批的历史报告保留原样（其自身注明「未改动任何仓库源码」）。

**注意**：这只证明**文件都在、依赖闭合、具名导出齐备**，不证明运行期可用。已落地件绝大多数
**仍未接线**，这正是下面的剩余工作。

## 2. 真正剩余：368 个未接线孤立模块

可达性重算（`b126/reach.mjs`，入口 = 各入口沿相对 import 可达）：

| 项 | 值 |
| --- | --- |
| scope（非测试 JS，src/api/electron/db + 根级） | 1992 |
| 可达 | 1624 |
| **孤立** | **368**（第 130 批为 483，确实在下降） |
| 断链 / 解析失败 | 0 / 0 |

## 3. 接线方案：用镜像的 import 图反查「本该谁 import 它」

0.7.16 镜像保留了**原始 import 图**。对一个孤立件问「镜像里谁 import 了它」，再看那个消费方
在仓库里是否存在、是否可达 —— 就能把接线从「猜」变成**确定的编辑**：
仓库里的那个消费方是**旧世代**，缺的就是这条 import。

脚本：`tools/porting-wiring-plan.mjs`（落地在仓库内，便于复算），产物写到 `%TEMP%` 外的
`.workbuddy` 暂存区，不进版本库。

| 分类 | 件数 | 含义 |
| --- | --- | --- |
| **有可达消费方 → 可直接接线** | **245** | 改一个可达消费方即接通 |
| 只有孤立消费方 | 80 | 需先接通上游，属链式第二批 |
| 消费方在仓库中不存在 | 0 | 无此情况 |
| 0.7.16 里也无人 import（死件） | 43 | 上游自身就是死代码，不必接 |

### 工作量与风险面

- 需要修改的消费方文件（去重）：**108 个**
  - `src/modules` 47、`src/components` 27、`api` 15、`src/core` 8、`src/manifests` 7、
    `src/services` 3、`src/ui` 1
- 其中**受保护装配件只有 1 个**：`src/components/aigenImage/uiSchemaRenderer.js`
  （`docs/TRACKING.md` §2.3）。其余 107 个是普通在用文件。

### 收益最高的入口（改一个文件能接通的孤立件数）

| 消费方 | 可接通 |
| --- | --- |
| `src/core/renderer.js` | 13 |
| `src/components/video-node/parameterPanelModule.js` | 11 |
| `src/components/video-node/taskOrchestrationModule.js` | 11 |
| `src/components/AIGenVideoNode.js` | 9 |
| `src/components/SourceVideoNode.js` | 9 |
| `src/manifests/video/modelApi/vendorVideoModelApiManifests.js` | 9 |
| `src/modules/agent/agentRuntime.js` | 9 |
| `api/aiAudioApi.js` | 7 |
| `src/components/aigenImage/uiModule.impl.js` | 7 |
| `src/components/AIGenAudioNode.js` | 7 |

## 4. 授权边界（必须说明）

本项目常设授权是**「只新增文件」**的移植落地。接线不是那类改动：

- 它**改在用文件**（108 个消费方）；
- 其中 1 个是**受保护装配件**，按 §2.3 须单独成批并经用户授权；
- 真正的功能验收需要**启动应用**，也在「必须先问」清单内。

因此本批**不擅自接线**，只交付方案。开工建议切片（由易到难、风险由低到高）：

1. **第一批（低风险）**：`src/modules` 与 `src/components` 里非装配件的消费方，
   只补 import（不动逻辑），逐件用 `node --check` + bare 导入 + 该目录既有测试 + 全量回归把关；
2. **第二批**：`api/*` 的消费方；
3. **第三批**：涉及 `src/manifests` 的消费方（可能连带 `src/manifests/index.js` 受保护件）；
4. **最后**：`uiSchemaRenderer.js` 等受保护装配件，单独成批、单独授权；
5. 链式 80 件随上游接通自动进入可达集，不必单独派活。

## 5. 复算命令

```bash
node C:/Users/luobote/.qoder/tmp/deobf-tools/b127/plan.mjs                       # 未落地复算
node C:/Users/luobote/.qoder/tmp/deobf-tools/b126/reach.mjs                       # 可达性/孤立重算
node C:/Users/luobote/.qoder/tmp/deobf-tools/b123/b123-gate.mjs <清单...>          # 导出闸门
node tools/porting-wiring-plan.mjs                              # 接线方案
```
