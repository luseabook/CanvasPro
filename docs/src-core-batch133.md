# 第 133 批：首波第六批（src/core 基础件 10 件）

> 第 127 批首波 260 件里的第六批，沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **8 098 B / 201 行**；测试 10 个同名件共 **13 277 B / 406 行**、**21 例**。
> 本批把首波 `src/core` 候选从 36 件降至 26 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | ---: |
| `generationExecutionPolicy` | 436/12 | a84cde5d4b3a | 2 | 1308/35 |
| `nodeEditorCommit` | 474/10 | a71cf3389d09 | 2 | 1193/44 |
| `generationTaskErrorState` | 544/12 | 52b7bdfdc150 | 2 | 1036/19 |
| `nodeDeletionEvents` | 630/17 | 72d9700d5b4c | 2 | 1140/32 |
| `rendererCommitHints` | 755/19 | 906099d4c21d | 2 | 847/25 |
| `stores/viewportScreenFrame` | 875/25 | 7b18f3b60c59 | 2 | 1117/37 |
| `rendererViewportJumpDetector` | 1011/30 | b4e136872185 | 2 | 1160/24 |
| `rendererViewportCommitGate` | 978/22 | be3a63e2c27d | 2 | 1276/34 |
| `nodeEditInteraction` | 1131/24 | cc6a1f28725d | 3 | 3036/118 |
| `rendererPickerCatalog` | 1264/30 | 05e4def81b14 | 2 | 1164/38 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`generationExecutionPolicy`**：策略按宿主对象存放在 `WeakMap`，每次获取执行器时使用最新策略；策略可被后续版本替换，释放回调只删除仍然匹配的绑定，未注册策略时返回新的无操作函数。
- **`nodeEditorCommit`**：提交编辑器值时分发可取消、可冒泡的 `CustomEvent`，携带提交详情并返回目标是否未取消；目标缺少 `dispatchEvent` 时按可提交处理。
- **`generationTaskErrorState`**：从错误对象的 `name`、消息文本和取消词组合识别任务取消；错误消息依次读取 Error 与基础值，必要时回落到统一文案。
- **`nodeDeletionEvents`**：删除批次监听器需要有效回调；空批次忽略，批次会广播给所有存活监听器，单个监听器异常不会阻止其他监听器。
- **`rendererCommitHints`**：拖拽提交提示是带存活时间的一次性信号，清除或 TTL 小于等于零都会阻止提示；读取后立即失效。
- **`stores/viewportScreenFrame`**：屏幕帧只记录最近一次有限数值的视口原点，读取一次即消耗；剥离时只移除私有的原点字段，保留其他状态。
- **`rendererViewportJumpDetector`**：首次采样建立基线，后续按平移和缩放阈值判断跳变，使用严格大于；非法数值归一为 `0,0,1`，任何采样都会刷新基线，`reset` 清零。
- **`rendererViewportCommitGate`**：仅当平移或缩放修订号与当前提交匹配时放行，一次性锁存；`reset` 同时清空修订号和锁存状态。
- **`nodeEditInteraction`**：交互态由图变更策略推导；完成回调会等待交互结算，就绪后解析成功并返回结果。
- **`rendererPickerCatalog`**：返回五类渲染选择器条目及目录尺寸；画板放在末尾并保留默认名称；目录读取通过节点创建菜单和国际化服务完成。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 20/20 通过 |
| 源文件与外部暂存产物逐字节比对 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **21 / 21 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7206 / 7163 / 43**（新增 21 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 21 例中 **3 例失败**，全部是测试侧问题：空策略断言误把每次新建的无操作函数当成同一引用；视口跳变用例误把无参采样与后续采样当成同一条基线，并漏算了每次采样都会更新基线。修正测试期望后 21/21 全绿，未改移植实现。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- `nodeEditorCommit` 与 `nodeEditInteraction` 的事件和交互只覆盖离线替身，真实 DOM 焦点、取消路径和图存储接线未验收。
- `rendererViewportJumpDetector`、`rendererViewportCommitGate` 和 `stores/viewportScreenFrame` 只验证纯状态机，未接真实平移、缩放和提交链。
- `rendererPickerCatalog` 只验证条目形状和顺序，真实节点创建菜单、国际化资源和渲染器消费方未验收。
- 未提交、未推送。

## 5. 下一批口径

第 128–133 批累计落首波 **59 件、290 例**。全仓未落地件由 771 降至 **712 件**；首波过闸门 260 件中已落 59、余 **201 件**。该 201 件为 `src/core` 26、`src/components` 61、`src/manifests` 20、`api` 直属 41、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2。下一批继续做 `src/core` 的纯新增件。

## 6. 证据文件

`deobf-tools/b133/port/src/core/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
