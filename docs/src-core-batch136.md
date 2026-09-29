# 第 136 批：首波第九批（src/core 收尾 6 件）

> 第 127 批首波 260 件里的第九批，沿用 §4 单批工序，**落地不接线**。
> 源 6 件共 **41 546 B / 1 039 行**；测试 6 个同名件共 **20 596 B / 598 行**、**15 例**。
> 本批把首波 `src/core` 候选从 6 件降至 0 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | --- |
| `edgePathGeometry` | 6371/210 | cf6df7923800 | 2 | 2371/93 |
| `generationTaskProtocolAdapters` | 7047/181 | bc4130038753 | 3 | 3628/108 |
| `rendererBridge` | 7030/143 | 49e0d08f8a59 | 2 | 4110/109 |
| `rendererMediaSlotLifecycle` | 8445/204 | ab0ce523eefc | 3 | 4572/128 |
| `rendererNodeLifecyclePerf` | 5512/135 | 1695cf60d7cd | 3 | 2587/72 |
| `rendererSelectionFastPath` | 7141/166 | 446cdad43456 | 2 | 3328/88 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`edgePathGeometry`**：连接线样式只认 straight、orthogonal、curve，未知样式回落 curve；端点按水平相对位置选左右锚点并给出正交路由 Y，重叠时使用下方兜底路由；三种样式分别生成直线、分段正交或三次曲线路径，正交路径对反向连接插入绕行段。
- **`generationTaskProtocolAdapters`**：支持 workflow、asyncModelApi、dreamina 三种协议及 runninghub、rh、modelApi 等别名；显式协议优先，其次按节点任务字段、适配器类型和厂商证据推断；补丁字段分别使用 rhTask、asyncTask、dreaminaTask 前缀，未知协议抛错。
- **`rendererBridge`**：把组件、包装节点、挂载集合和边索引适配成渲染器 getter；支持元素查询、拖放槽高亮、边 ID 与边层统计；拖拽预览会捕获光栅帧并同步快速预览代理，单元格交换可回滚，生成调用返回 started 与 result 分离的结果。
- **`rendererMediaSlotLifecycle`**：固定可见层级、驻留状态、就绪状态和表面枚举；媒体槽按 sourceKey/sourceEpoch 拒绝过期请求，只有 DOM、尺寸、无错误、rVFC、CSS 可见且无遮罩的完整事实才进入 frameReady；已呈现活动槽不能退回 poster 或 park，远离视口后才允许驻留并回到 poster。
- **`rendererNodeLifecyclePerf`**：计数器对数量和布尔值做归一；创建、重挂、驻留和更新分别累计次数、总耗时与最大耗时，并按节点规范类型分桶；更新可标记隐藏，跳过更新单独计数，慢更新只保留最慢 8 条，负耗时不会污染统计。
- **`rendererSelectionFastPath`**：相同选择快照直接复用；选择变化时合并旧、新选择及相关节点和边；有待处理渲染时默认拒绝，显式允许并取消待处理 RAF 后可继续；重置会清空快照，缺失节点或边修订号时不做快速路径。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 12/12 通过 |
| 源文件与外部暂存产物逐字节比对 | 6/6 相同 |
| `node --check` | 12/12 通过 |
| 导出闸门 `b123-gate.mjs` | 6/6，`MISSING_TOTAL=0` |
| bare node 导入 | 6/6 成功，无顶层 DOM 副作用 |
| 本组单测 | **15 / 15 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7272 / 7229 / 43**（新增 15 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

6 个测试文件首跑即 **15/15** 全绿，未修改移植实现。`rendererNodeLifecyclePerf.js` 依赖现有 `nodeMeta.js :: normalizeNodeType`，其余 5 件没有相对依赖。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- `rendererBridge` 和选择快速路径只使用内存组件、Map、Set 与调用记录替身，不验证真实 DOM 事件、渲染循环或画布接线。
- `rendererMediaSlotLifecycle` 只验证状态机与严格帧事实判定，不验证真实媒体解码、rVFC、CSS 合成或 GPU 呈现。
- 生命周期性能件只验证确定性计数和排序，不测量真实浏览器耗时；连接几何和任务协议件只覆盖公开纯函数。
- 未提交、未推送。

## 5. 下一批口径

第 128–136 批累计落首波 **85 件、356 例**。全仓未落地件由 771 降至 **686 件**；首波过闸门 260 件中已落 85、余 **175 件**。该 175 件为 `src/components` 61、`src/manifests` 20、`api` 直属 41、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2。下一批开始做 `src/components`。

## 6. 证据文件

`deobf-tools/b136/port/src/core/`（6 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
