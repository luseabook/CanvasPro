# 第 138 批：首波第十一批（`src/components` 第二批 10 件）

> 第 127 批首波 260 件里的第十一批，沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **13 541 B / 328 行**；测试 10 个同名件共 **22 279 B / 748 行**、**28 例**。
> 本批把 `src/components` 首波候选从 51 件降至 41 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | --- |
| `aigenImage/selectionStateModule` | 1075/21 | 3ddc0484dd4a | 3 | 2226/63 |
| `nodeToolbar/audioActions/voiceStudioAction` | 1035/23 | 064adf08f798 | 3 | 1847/71 |
| `nodeToolbar/mediaDownloadFeedback` | 1035/28 | 460c4e150575 | 3 | 1747/60 |
| `nodeToolbar/videoActions/voiceReplaceAction` | 1223/33 | 36abfff74be2 | 2 | 2547/89 |
| `audio-node/audioWorkflowImageInputs` | 1235/25 | b95024495876 | 3 | 1749/51 |
| `aigenImage/storedThumbObjectUrl` | 1541/44 | 1c86dcc7fa15 | 3 | 2733/100 |
| `sharedProjectIcon` | 1505/37 | 2315ead3f789 | 3 | 2295/69 |
| `video-node/legacyVideoRatioPopup` | 1510/36 | 42c3b78ece8e | 3 | 2960/98 |
| `audio-node/audioWorkflowGenerationParams` | 1597/33 | 71f50912c159 | 3 | 1428/44 |
| `promptExpansionFloatingSurfaces` | 1785/48 | 100a8fd243f6 | 2 | 2747/103 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`selectionStateModule`**：AI 生成节点的参考图栏只在选中、匹配拾取连线源或模型策略要求常显时补渲染；隐藏、媒体延后或未选中时记录 pending，重复同步不重复渲染。
- **`voiceStudioAction`**：点击按钮时阻止默认与冒泡，取当前节点 ID，trim 后派发 `audioVoicePanel:open`；无节点或窗口不可派发时静默返回。
- **`mediaDownloadFeedback`**：仅对 image/video/audio 的成功保存结果提示；文件名优先取结果字段，否则从路径取 basename，并以 success 类型调用 `showToast`。
- **`voiceReplaceAction`**：抠像或视频剪辑处于活动态时只提示先退出；否则静默退出剪辑/抠像控制器并派发语音面板打开事件，携带节点 ID。
- **`audioWorkflowImageInputs`**：模型 fixedSlots 中必须存在 image 槽；边源节点类型包含 image 时收集，默认 refSlot 取首个 image 固定槽，并解析生成输入图片 URL。
- **`storedThumbObjectUrl`**：同一 thumbId 只加载一次；成功创建托管 object URL 后发布，过期或并发竞争时立即撤销；无论成功失败都清 pending，重复命中已有 URL 或 pending 时跳过。
- **`sharedProjectIcon`**：创建 24x24 的 shared/host SVG 图标路径；shared 或 shared-host 徽标追加固定 class、data-badge、aria-label 并移除 aria-hidden，其他徽标返回 null。
- **`legacyVideoRatioPopup`**：旧视频比例弹层同步后立即添加 show，并在下一帧再次添加；标签与图标优先走 legacy wrap，缺失时使用兼容回退节点。
- **`audioWorkflowGenerationParams`**：合并 schema 默认、已保存参数和额外参数；移除原 speaker 字段后按当前参数或持久参数解析 speakerId/voiceMode，仅在目标支持 speakerId 时注入。
- **`promptExpansionFloatingSurfaces`**：把 body 中匹配的提示词浮层移入容器并保留注释位；监听新增节点，命中外部弹窗选择器时回调；销毁时断开 observer 并把已托管节点还原到原位置。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 20/20 通过 |
| 源文件与外部暂存产物逐字节比对 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **28 / 28 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7324 / 7281 / 43**（新增 28 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 28 例中仅 `selectionStateModule` 2 例为测试前置状态笔误；补齐 pending 后 28/28 全绿，移植实现未改动以迁就测试。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 选择状态、GIF/语音动作、媒体保存提示和浮层宿主只验证回调与事件契约，不验证真实节点装配和浏览器布局。
- object URL 测试只验证调度、竞争与撤销状态，不验证真实浏览器 Blob 生命周期。
- 音频 workflow 输入与参数件只验证固定槽、URL 解析和参数合并，不发起真实生成请求。

## 5. 下一批口径

第 128–138 批累计落首波 **105 件、408 例**。全仓未落地件由 771 降至 **666 件**；首波过闸门 260 件中已落 105、余 **155 件**。该 155 件为 `src/components` 41、`src/manifests` 20、`api` 直属 41、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2。下一批继续做 `src/components`。

## 6. 证据文件

`deobf-tools/b138/port/src/components/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
