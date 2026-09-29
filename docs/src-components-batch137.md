# 第 137 批：首波第十批（`src/components` 首批 10 件）

> 第 127 批首波 260 件里的第十批，沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **11 020 B / 293 行**；测试 10 个同名件共 **17 813 B / 538 行**、**24 例**。
> 本批开始清 `src/components` 首波候选，已由 61 件降至 51 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | --- |
| `video-node/mediaPlaybackStallProgress` | 512/11 | 9b81e0faa01b | 2 | 917/21 |
| `aigenImage/uiSchemaFieldOverrides` | 574/12 | dfe7e71ab40a | 3 | 1360/39 |
| `shared/inputSlotLabelFormatter` | 863/25 | 01e6515e0839 | 3 | 890/21 |
| `shared/rendererMediaPlaybackPin` | 1008/26 | 62b16fd2b36a | 2 | 2008/70 |
| `nodeToolbar/videoActions/toGifAction` | 1111/33 | a7993f514da4 | 2 | 2443/76 |
| `nodeToolbar/fullscreenOverlayToggle` | 1096/31 | 2a5cc55af8fc | 2 | 2019/55 |
| `video-node/videoNodeUpdatePerf` | 1305/38 | 6a85994ee6b5 | 2 | 1430/40 |
| `aigenImage/audioVoiceCompositeState` | 1288/32 | b430b3c1eb67 | 3 | 1806/55 |
| `aigenImage/runningHubInstanceDevModeBinding` | 1595/36 | 3ebb65e75db8 | 2 | 2549/79 |
| `shared/mediaProgressDragSession` | 1668/49 | a899b2040bbe | 3 | 2391/82 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`mediaPlaybackStallProgress`**：以 `src/currentTime/buffered` 的 JSON 签名判断播放进度；签名变化时重置卡顿时点，返回值从 `stallTimeoutMs` 倒数并以 0 为下限；未配置时默认 4000 ms。
- **`uiSchemaFieldOverrides`**：字段表按 `id` 匹配覆盖项；只接受普通对象覆盖，返回新数组并对命中字段做浅合并，未知字段、非数组输入和非对象覆盖保持原引用。
- **`inputSlotLabelFormatter`**：标签做 HTML 转义；四字纯中文按 2+2、五字纯中文按 3+2 换行；其他文本先 trim，再把连续空白折叠为 `<br>`，空标签返回空串。
- **`rendererMediaPlaybackPin`**：媒体播放时调用渲染器 `pinNode`，暂停、结束、清空或销毁时调用 `unpinNode`；重复事件不重复切换，无媒体元素或无节点 ID 时返回空操作。
- **`toGifAction`**：点击 GIF 按钮时关闭更多菜单，依次静默退出视频剪辑、抠像和 GIF 控制器，再用当前视频地址、本地路径和远程保存函数初始化 GIF 控制器；controller 缺失的边界由消费方保证。
- **`fullscreenOverlayToggle`**：全屏浮层把关闭函数挂到固定属性；Escape 关闭时先移除 keydown 监听，再执行关闭回调并移除节点，重复关闭为幂等；已有浮层可优先通过挂载的关闭函数关闭。
- **`videoNodeUpdatePerf`**：仅在 `window.__perfProbeEnabled === true` 时创建探针；记录不超过 500 字的详情，分节耗时过滤 0.05 ms 以下项，按耗时降序取前 12 项，并返回总耗时。
- **`audioVoiceCompositeState`**：音色标签取自显式 label，空字符串不回退；显式 voiceMode 优先，否则有 speakerId 即自定义模式；返回自定义/默认区域的禁用态、类名和触发标签。
- **`runningHubInstanceDevModeBinding`**：根据 `dev-mode-changed` 更新 RunningHub 实例开关的可用值标记；退出开发模式且当前值属于开发者值时提交普通默认值；非法 JSON 按空列表处理，销毁时移除监听。
- **`mediaProgressDragSession`**：按 pointerId 过滤移动与结束事件；结束、取消或 dispose 均只清理一次；blur 走取消回调，dispose 不触发 onEnd，active 状态只读。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 20/20 通过 |
| 源文件与外部暂存产物逐字节比对 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **24 / 24 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7296 / 7253 / 43**（新增 24 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑在第 136 批后确认 5 件实现缺失；补齐后为 22/24，三处测试侧假设修正后 24/24：
`toGifAction` 的错误 Promise 实例比较、空 `voiceTypeLabel` 的被测契约、和全屏查询桩未按选择器返回空值。移植实现未改动以迁就测试。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 媒体卡顿、播放固定、拖拽会话只验证事件和状态边界，不验证真实媒体解码、浏览器指针捕获或渲染器接线。
- 全屏、GIF、RunningHub 开发模式和字段覆盖只验证最小 DOM/回调契约，不验证真实装配与埋点上报。
- 未提交、未推送。

## 5. 下一批口径

第 128–137 批累计落首波 **95 件、380 例**。全仓未落地件由 771 降至 **676 件**；首波过闸门 260 件中已落 95、余 **165 件**。该 165 件为 `src/components` 51、`src/manifests` 20、`api` 直属 41、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2。下一批继续做 `src/components`。

## 6. 证据文件

`deobf-tools/b137/port/src/components/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
