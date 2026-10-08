# Agnes 图生图与 CSP 本地保存修复（第 181 批）

> 承接第 180 批「Agnes 国内/国际双档生成链路」的**真机复跑**。复跑确认 ①②④ 通过、③ 因账户余额
> BLOCKED（非代码），并暴露出**两个先前未知的缺陷**：
> **A** Agnes 图生图（i2i）不可用（base64 响应未被提取）；**B** `data:`/`blob:` 本地保存被 CSP 拦截。
> 两者均已修好并**真机验证到 PASS**（③ 除外，受余额所限）。起点 `cd4ee3c8`。
> 第 180 批的专题是 `agnes-provider-line-fix.md`；本篇只记本批新增的两个缺陷。

## 1. 缺陷 A：Agnes 图生图不可用（base64 响应未被提取）

### 现象
`generateImage({ model: 'agnes/agnes-image-2.5-flash', inputUrls: ['data:image/png;base64,…'] })` 抛
`[Agnes AI] {"data":[{"url":"","b64_json":"iVBORw0KGgo…"}]}`。

### 根因链（三步，缺一不可）
1. `api/adapters/modelApiResolvers/agnesResolvers.js:45`：**有参考图时**把请求 `extra_body.response_format`
   设为 `'b64_json'`（上游意图，**保留不动**）→ 供应商回 `b64_json`、`url` 为空。
2. `src/manifests/image/modelApi/agnesImageModelApiManifests.js` 的 `AGNES_IMAGE_RESPONSE_MAPPING`
   **缺** `base64Paths` / `base64DefaultMimeType`（**上游 0.7.16 与 0.8.0 的同一文件都有**）→ 需补齐。
3. **关键（真正的堵点）**：`api/aiImageApi.js` 的真实提取器只调
   `resolveMappedResponseValues(response, mapping?.resultPaths)`——**从不读 `base64Paths`**；
   而会解码 base64 的 `resolveMappedImageResponseValues` 只被**未接线**的 `api/adapters/ManifestResultRenderer.js`
   使用（该模块仅被自己的 `.test.js` 引用）。→ 把 `extractImageUrls`(:216) 与
   `extractImageResultRecords`(:425) 改用 `resolveMappedImageResponseValues(response, mapping)`。

### 改动
| 文件 | 改动 |
| --- | --- |
| `src/manifests/image/modelApi/agnesImageModelApiManifests.js` | `AGNES_IMAGE_RESPONSE_MAPPING` 增 `base64Paths: ['data[].b64_json']`、`base64DefaultMimeType: 'image/png'` |
| `api/aiImageApi.js` | import 由 `resolveMappedResponseValues`（复数）改为 `resolveMappedImageResponseValues`；`:216`、`:425` 两处改用它并**传整个 mapping 对象** |

**注意**：传整个 mapping（而非 `.resultPaths`）与上游一致——`resolveMappedImageResponseValues` 内部用
`value27?.resultPaths \|\| value27?.paths` 再走原 url 提取，所以 **url-only 厂商行为不变**（`aiImageApi.routing.test.js` 88/88 佐证）。

### ⚠ 本轮最大教训：「绿单测掩盖未接线」
第 1 版（只改 manifest + 一个**直接调 `resolveMappedImageResponseValues`** 的单测）→ 单测 4/4 绿，
但**真机 i2i 报逐字相同的错误**。是 QA 抓出：该测试**测的不是生产路径**。
第 2 版补齐提取器接线后，新增 `api/aiImageApi.agnes.test.js`——打桩 `globalThis.fetch`、驱动**真实导出**
`generateImage`、喂**真机同款** `{"data":[{"url":"","b64_json":"<真实1×1 PNG>"}]}`；并做**负向对照**
（把 `api/aiImageApi.js` 三处改回原样 → 该测试报 `generateImage must not reject: [Agnes AI] 无法从服务器响应中提取图片地址`，
**与真机报错逐字一致**）→ 这才可信。**结论：打桩单测不能替代真机链路验证。**

## 2. 缺陷 B：`data:` URL 本地保存被 CSP 拦截

### 现象
缺陷 A 修好后，真机 i2i 的错误**前移**为「保存到本地失败，请重试生成」——即提取已成功，卡在落盘。

### 根因
`src/services/projectService.js:648-665` 的 `data:`/`blob:` 分支走 `fetchRemoteBlob` →
渲染端 `fetch('data:image/png;base64,…')` 被 `index.html` 的 CSP 拦截（`connect-src 'self' http: https:` **不含 `data:`**）。
镜像交叉核对：**上游 `projectService.js` 同样用 `fetchRemoteBlob` 读 `data:`/`blob:`**（0.7.16 与 0.8.0 一致、无 `atob`）——
上游能跑是因为它**没有这条 CSP**。**这不是移植漏项，是我们自己的 CSP 加固与上游实现方式的冲突。**

### 修复（用户裁决：放宽 CSP）
- `index.html` 的 CSP：`connect-src 'self' http: https:` → **`connect-src 'self' data: blob: http: https:`**（**仅此一处**，其余指令未动）。
  - 依据：`img-src` / `media-src` **早已**允许 `data: blob:`；`data:`/`blob:` 是**本地 URL、无网络外发**，与既有放行保持一致；**不改变** `script-src`/`default-src`/`object-src` 等。
- **门禁加固**：`tools/check-csp.mjs` 新增断言「`connect-src` 必须包含 `data:` 与 `blob:`」（附中文注释说明用途与安全边界），
  防止将来再收紧 CSP 时**静默**破坏本地图片保存。已**自证红/绿**（把 `connect-src` 改回原样 → 门禁报两条失败、exit=1）。

### 另两个覆盖窗口（复核结论：**无需**放行）
- `electron/screenshotOverlay.html`：截图走 `<img src=data:>`（`img-src 'self' data:` 覆盖），`canvas.toDataURL` 只读画布、经 IPC 回传，**无 fetch** → 不需要。
- `electron/globalCaptureWindow.html`：纯 UI，**无 fetch/XHR/媒体保存** → 不需要。

## 3. 真机验证（源码启动 Electron，隔离 profile 且不注入离线钩子）

| 项 | 结论 | 关键证据 |
| --- | --- | --- |
| i2i 端到端 | **PASS** | `ok:true, 22.6s`，返回 `url:/output/_derived/display/gen_….display.jpg` + `sourceUrl:data:image/png;base64,…`；**无**「保存到本地失败」 |
| `fetch('data:…')` | PASS | 修复前 `Failed to fetch` → 修复后 `ok:true, 200, image/png` |
| `saveRemoteImageLocallyDetailed('data:…')` | PASS | 修复前「保存到本地失败」→ 修复后 `ok:true, 647ms, /output/gen_….png` |
| t2i 无回归 | PASS | `sourceUrl:https://cos-platform-outputs.agnes-ai.cn/…png` |
| ① 后端不误伤同步图像 | 仍 PASS | 复跑再证 url 路径 |
| ② 国内档文本 | 仍 PASS | 第 1 轮结论 |
| ④ 2.5 视频模型 | 仍 PASS | 第 1 轮结论 |
| ③ 视频终态 url | **BLOCKED** | 国内/国际账户余额均 **￥0**，创建被拒 → 拿不到 `video_id`。轮询路由本身已证实（`/agnesapi?video_id=` 认 video_id；`task_id` → `400 缺少 video_id`） |

## 4. 检查结果

| 项 | 结果 |
| --- | --- |
| 全量 JS 回归 | `run-full-tests.mjs --js-only` **11242 / 11228 / 14**（1163 文件）。14 例既有失败：`electron/installerSafety` 3（`null !== 0`，沙箱禁从 Bash/Node 调外部 shell 解释器）+ `tools/deobf-gate` 11（签名自我检测所致），**零引用本改文件**，与第 180 批基线 `11237/11223/14` **失败集完全一致**。较 180 批 **+5 例全过**（本批两个新测试文件） |
| 新增/改单测 | `api/aiImageApi.agnes.test.js`（真实链路打桩 + 负向对照）、`src/manifests/image/modelApi/agnesImageModelApiManifests.test.js`（真实 PNG）；`aiImageApi.routing.test.js` **88/88**、`modelApiMappingEngine.test.js` **6/6**、`aiImageApi.test.js` 通过 |
| CSP 门禁 | `node tools/check-csp.mjs` → **PASS，exit=0**（含新增 `connect-src` 断言） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 = `1e0458013f5341c99f21faefc1d34d3f`（未变） |

## 5. 未执行项与边界

- **③ 视频终态 url 未实测**：受账户余额限制（￥0）。**需充值后补跑一次**才能闭环。
- 视频 2.5 三模式（`text`/`keyframe`/`reference`）的**参数面板联动**与逐值实测仍未做。
- 服务端图像接口高峰期仍可能返 `503 文生图队列已满`，应用会退化成通用「无法提取图片地址」，**真实原因被吞**（既有现象，未处理）。
- 覆盖窗口的 CSP 目前**不校验** `connect-src`；若将来它们开始 `fetch(data:/blob:)`，需同步放行并补门禁。

## 6. 下一批口径

- 充值后补跑 ③ 的视频终态，闭环第 180 批四缺陷。
- 「503 队列满」原始错误透传到 UI。
- 更广的接线欠账（约 200 个孤立模块）见 `docs/TRACKING.md` §7。
