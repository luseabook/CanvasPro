# Agnes 视频轮询线路修复 + 「余额不足」结论更正（第 182 批）

> 起因：用户指出「Agnes 模型都是免费的，余额 0 也能用」。复核后发现第 180 批把 ③ 视频终态 url 判为
> 「余额 ￥0 BLOCKED」**归因错误**，并且顺带查出一个**真实缺陷**：只配国内档时，视频任务在**轮询**阶段
> 丢掉 API Key，创建成功后立刻失败。本批修掉该缺陷，并用真机把 ③ 跑到 **PASS**。起点 `c898d19c`。

## 1. 先更正结论：Agnes 免费档到底能用什么

对国内 `https://api.agnes-ai.cn` 与国际 `https://apihub.agnes-ai.com` 两条线路直接实测（两账户余额均 **￥0**）：

| 能力 | 国内 | 国际 | 备注 |
| --- | --- | --- | --- |
| 文本 `agnes-2.5-flash` | **可用** | 可用 | 返回正常 `chat.completion` |
| 图像 `agnes-image-2.5-flash` | **可用** | **可用** | 返回真实 COS 图片 URL |
| 视频 `agnes-video-2.5-flash` | **可用** | 可用 | 创建 → 轮询 → 终态 mp4，**全程 ¥0** |
| 视频 `agnes-video-2.5`（非 flash） | **不可用** | 不可用 | 稳定返回 `insufficient_user_quota`（剩余 ￥0.000000），**可复现 2 次** |
| 视频 `agnes-video-v2.0` | 受免费速率限制 | 未测 | `rate_limit_exceeded` |

**所以：免费档确实能用（文本/图像/flash 视频），但「所有模型都免费」不成立——非 flash 的
`agnes-video-2.5` 需要付费额度。** 免费档另有**按时间的速率限制**（`rate_limit_exceeded`），
短时间内连打会触发，等待后自动恢复；这与额度无关，不要混为一谈。

### 第 180 批为什么判错
`test-artifacts/qa-src-video.result.json` 显示当时测的是 `agnes/agnes-video-2.5`（**非 flash**）+ **国际**线路，
拿到 `账户余额不足` 就下了「两线路余额为 0 → BLOCKED」的结论，**没有换 flash 模型验证**。
`test-artifacts/qa-agnesapi-probe.py` 那组探测用的是假 ID（`video_probe_0000`），只证明了路由形状，证明不了可用性。

## 2. 缺陷：轮询丢 Key（只配国内档时必现）

### 现象（真机，源码启动）
只把 Key 写进 `agnes-domestic`（国内档），跑 `agnes/agnes-video-2.5-flash`：

```
POST /api/v2/proxy/image                                                    -> 200   （任务已创建 task_0Pfktpji…）
GET  /api/v2/proxy/task?apiUrl=…%2Fagnesapi%3Fvideo_id%3Dtask_0Pfktpji…      -> 400   {"error": "Missing apiUrl or apiKey"}
```

`generateVideo` 在 **3.1s** 就失败，报 `Missing apiUrl or apiKey`——**创建成功、轮询立刻被打回**。

### 根因
Agnes 清单声明了两条线路（`providerProfiles: ['agnes-domestic', 'agnes']`），而清单里写死的
`provider` 恒为 `'agnes'`（`vendorVideoModelApiManifests.js`，2.5 的 `modelId`/`provider` 定义处）。

- **创建**走 `ModelApiManifestNormalizer` → `resolveProviderProfileConfig()`：按「用户选中的、且**确实配了 Key** 的档」
  取 `apiUrl`/`apiKey` → 国内档命中，正确。
- **轮询**（`api/aiVideoApi.js` 的异步任务分支）却写的是 `getProviderConfig(provider7)`，
  而 `provider7 = resolveVideoProviderId(...) = manifest.provider = 'agnes'`。
  只配国内档时 `apiConfig.providers['agnes']` 不存在 → `apiKey` 为空 → `pollVideoTask()` 发出
  `Authorization: 'Bearer '`（`:480`）→ 后端 `_handle_task_proxy` 认为缺 Key → 400。

**创建与轮询用了两套密钥解析，这就是缺口。** 第 180 批 ② 已经把「按声明档选线路」接进创建与文本，
唯独漏了视频轮询。

### 修法（最小改动，`api/aiVideoApi.js`）
1. 引入 `resolveProviderProfileConfig`（与 `aiTextApi.js` 第 180 批 ② 的写法一致）。
2. 新增 `resolveVideoPollingProviderConfig(options, providerId)`，直接复用创建请求那套「按声明档 + 档位就绪」解析。
3. `resolveVideoProviderConfig(options, providerId)` 在**非 runninghub** 分支改为委托给上面这个新函数
   （runninghub 分支原样保留，`resolveRunningHubModelApiBaseUrl` 行为不变）。
4. 异步任务轮询分支的 `getProviderConfig(provider7)` → `resolveVideoProviderConfig(args10, provider7)`。

**对未声明线路的厂商（apimart / grsai / minimax …）行为完全不变**：`resolveProviderProfileConfig`
在没有声明档位时原样返回 `getProviderConfig(provider)`。

### 为什么不是「退回取 `list[0]`」
`resolveVideoRuntimeProviderKey()` 已存在，但它只按清单顺序取**第一档**（`normalizeModelProviderProfileId`
不检查档位是否配了 Key）。**只配国际档**的用户会被它误判到 `agnes-domestic` 而拿到空 Key。
所以这里必须用**就绪感知**的 `resolveProviderProfileConfig`（内部 `isProviderProfileReady`）。

## 3. 验证

### 单测（先证明会失败）
`api/aiVideoApi.agnesProfilePoll.test.js`（新增，2 例）：打桩 `globalThis.fetch`、只放开**一个**档位的
`/api/config`、驱动**真实导出**的 `generateVideo`，断言创建体与**轮询请求头**上的 Key。

- 修复前（红）：`poll must carry the domestic profile key (got: "Bearer")` —— 与真机 400 同源。
- 修复后（绿）：2/2。

| 场景 | 断言 |
| --- | --- |
| 只配 `agnes-domestic` | 轮询 `Authorization: Bearer sk-domestic` |
| 只配 `agnes`（国际） | 轮询 `Authorization: Bearer sk-intl`（防止将来退回「取第一档」） |

### 真机（源码启动 Electron，隔离 profile，真 Agnes Key）

| 场景 | 结果 | 证据 |
| --- | --- | --- |
| 只配国内档（**修复前**） | **FAIL** | `POST /api/v2/proxy/image` 200 → `GET /api/v2/proxy/task` **400** `Missing apiUrl or apiKey`，3.1s |
| 只配国内档（**修复后**） | **PASS** | `ok:true, 152.4s`，`/output/gen_20261009_0001.mp4`，`sourceUrl=…/task_Wq2vUgaOlJWktdiRmsP1e6dQuzuGTAmz.mp4` |
| 两档都配（回归） | PASS | `ok:true, 126.3s`，`sourceUrl=…/task_jHwkptfy0ic2QHJnWDs8HcDOKU3VFWot.mp4` |

应用侧身体核对无误：`{ apiUrl, apiKey, model, prompt, mode:'text', seconds:'5', size:'720P', aspect_ratio:'16:9', seed, n:1 }`，
轮询模板 `…/agnesapi?video_id={taskId}&model_name=agnes-video-2.5-flash`，`headersMode: 'bearer'`。
`mode` 由 `agnesResolvers.js:152` 自动从无图的 `keyframe` 降级为 `text`，符合官方要求（`keyframe` 需首/尾帧，
`reference` 需参考素材）。

## 4. 检查结果

| 项 | 结果 |
| --- | --- |
| 视频相关套件 | `api/aiVideoApi.test.js` + `agnesProfilePoll` + `src/components/video-node/*` + `src/manifests/video/modelApi/*`：**314/314** |
| 全量 JS 回归 | `run-full-tests.mjs --js-only` **11244 / 11230 / 14**（14 例既有失败：`electron/installerSafety` 3 + `tools/deobf-gate` 11，与第 180/181 批**失败集完全一致**，零引用本改文件）。较 181 批 **+2 例全过**（本批新测试） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 未变 |

## 5. 未执行项与边界

- **非 flash `agnes-video-2.5` 仍不可用**（免费档额度不足）。这不是代码缺陷；但 UI 目前不会预告，
  用户选中它只会看到官方报错。是否隐藏/标注该模型需另议。
- **国际线路视频**未跑到成片：`video_queue_full`（队列繁忙，临时性）。国内线路已全链路跑通，轮询路由两线路相同。
- 免费档**速率限制**（`rate_limit_exceeded`）未做退避/提示；短时间连续生成时用户会看到该原始报错。
- 「503 队列满 / 队列繁忙」等原始错误透传到 UI 仍是既有欠账。

## 6. 下一批口径

- 把「免费档速率限制」「视频队列繁忙」这类可重试错误做成明确的 UI 提示 + 自动退避。
- 非 flash 视频模型在免费档下的可用性标注。
- 更广的接线欠账见 `docs/TRACKING.md` §7。
