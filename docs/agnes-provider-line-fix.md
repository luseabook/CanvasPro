# Agnes 国内/国际双档生成链路修复（第 180 批）

> 背景：用 Agnes（国内档 `api.agnes-ai.cn`）逐项验收「文本 / 文生图 / 图生图 / 视频」四条链路时，
> 确认四个真实缺陷（另见 `docs/TRACKING.md` §11 与本地工作日志）。本批把它们修好并配回归。
> 起点 `6da9bdf2`（CSP 加固）。**改的是在用生成链路，不是「落地不接线」。**

## 1. 落地清单

| 文件 | 改动 |
| --- | --- |
| `server.py` | 代理路由的 task_id body-probe 短路，按 **host** 豁免 Agnes 同步图像端点（`/v1/images/generations`、`/v1/images/edits`） |
| `src/modules/modelProviderProfileSelection.js` | 新增 `getDeclaredModelProviderProfileIds`（只读 `extensions.providerProfiles`）、`resolveDeclaredProviderProfileId`（按声明档解析线路） |
| `api/adapters/ModelApiManifestNormalizer.js` | `resolveApiKey` 增第 4 参（provider 配置覆盖）；新增 `resolveProviderProfileConfig` + 内部 `isProviderProfileReady`；三处基址构建改走它；`normalizeStringParam` 登记为 `BODY_MAPPING_TRANSFORMS.stringParam` |
| `api/aiTextApi.js` | `formatTextProviderLabel` 增 `agnes-domestic → 'Agnes AI（国内）'`；`buildGenerateTextRequest` 走 `resolveProviderProfileConfig` |
| `src/manifests/video/modelApi/vendorVideoModelApiManifests.js` | Agnes 响应映射改认 `video_id`；轮询改官方 `/agnesapi`；新增 `agnes-video-2.5`/`2.5-flash`；v2.0 声明 `providerProfiles`；修复 `createVideoInputSlots` 静默丢弃参数 |
| `api/aiVideoApi.js` | 真正读取 manifest 的 `pollIntervalMs`/`pollAttempts`；遵守 `continuePollingOnSuccessWithoutResult` |

新增/修改测试：`api/adapters/ModelApiManifestNormalizer.providerProfile.test.js`（新，6 例）、
`backend/services/test_server_proxy_image_task_probe.py`（新，5 例）、`api/aiVideoApi.test.js`（改断言）、
`src/modules/modelProviderProfileSelection.test.js`（+3，共 31 例）。

## 2. 冻结的契约与行为

### 2.1 Agnes 官方接口契约（两线一致，实测）

- **图像 `POST /v1/images/generations`、`/v1/images/edits` 是同步接口**：一次响应即返回 `data[0].url`，同时**顶层也带 `task_id`**。
  `response_format` 必须放进 `extra_body`。
- **视频**：`POST /v1/videos` → 拿 **`video_id`** → 轮询 `GET /agnesapi?video_id=<VIDEO_ID>&model_name=<model>` → 完成响应含**顶层 `url`**。
  `id`/`task_id` 只是任务号，**用 `task_id` 查询会 404「任务不存在」**。`keyframe`/`reference` 模式必须带 `model_name`。
- **文本**：`/v1/chat/completions`，模型名**不带前缀**（如 `agnes-3.0-flash`）。`agnes-2.0-flash` 已废弃。

### 2.2 短路豁免必须按域名，不能按路径

`allow_task_probe_short_circuit` 的豁免**按 host**判定（`api.agnes-ai.cn` / `apihub.agnes-ai.com`）：
APIMart 也走 `/v1/images/generations` 路径，但它是**异步**的，必须保留 task_id 快速探测。
只按路径豁免会误伤 APIMart。见 `test_server_proxy_image_task_probe.py` 的两个反例用例。

### 2.3 线路解析优先级（`resolveDeclaredProviderProfileId`）

1. 若模型未声明 `extensions.providerProfiles` → 不改（保持原行为）；
2. `runninghub`/`runninghubwf` 自管理档案 → 不参与；
3. 请求里选中的档若在声明列表内 → 用它；
4. 否则若某条声明档**已配好 Key**（`!!apiKey`）→ 用它（自动落到可用线路）；
5. 都没有 → 取声明列表第一条（保持可用的报错信息）。

### 2.4 线路可用性差异（不是清单过期）

| 模型 | 国内 `api.agnes-ai.cn` | 国际 `apihub.agnes-ai.com` |
| --- | --- | --- |
| `agnes-image-2.0-flash` | 无 | 有 |
| 其余（3.0 文、2.1/2.5 图、video-2.5/2.5-flash/v2.0） | 有 | 有 |

跨线 Key 严格不互通（国际 Key 打国内 `/v1/models` → 无效令牌）。面板按线路拉实时目录，逐线过滤在那里处理。

## 3. 检查结果

| 项 | 结果 |
| --- | --- |
| 全量 JS 回归 `tools/run-full-tests.mjs --js-only` | **11237 / 11223 / 14** |
| 14 例失败归因 | 全部**既有环境性**、与本改无关：`electron/installerSafety.test.js` 3 + `tools/deobf-gate.test.js` 11（两文件只 import Node 内置模块，对本次改动文件零引用） |
| 新增 Python | `test_server_proxy_image_task_probe` **5/5 OK** |
| 新增/改 JS | `ModelApiManifestNormalizer.providerProfile` **6/6**、`modelProviderProfileSelection` **31/31**、`aiVideoApi` 通过 |
| `node --check` | 8 个改动 JS 文件全过；`server.py` `ast.parse` 过 |
| 受保护文件 | `api/freeImageHostApi.js` MD5 = `1e0458013f5341c99f21faefc1d34d3f`（未变） |

## 4. 未执行项与边界

- **未真机端到端复跑**四条链路（需应用 + 真实计费请求）：本批以离线单测 + 契约核对为准。
  建议下一步在应用里对国内档逐条点一次「文本 / 文生图 / 图生图 / 视频」。
- 服务端图像接口高峰期可能返 `503 文生图队列已满`；应用会把它显示为「无法提取图片地址」，
  真实原因被吞（既有现象，本批未处理）。
- `agnes-video-2.5` 的 `mode`/`size`/`aspect_ratio` 白名单按文档冻结；未逐值实测。
- 本批已提交 `f834fb27` 并双推 `origin` + `luseabook`（用户授权）。

## 5. 下一批口径

- 若要继续 Agnes：补「视频 2.5 三模式」的参数面板联动与真机验收；把 503 队列满的原始错误透传到 UI。
- 更广的接线欠账（200 个孤立模块）见 `docs/TRACKING.md` §7。
