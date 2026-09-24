# 第118批：`src/services` 图片快预览与视频首帧呈现两件零 import 纯叶（落地不接线）

批次：第 118 批（纯新增落地，零消费方不接线）
能力区：R15（渲染器首屏/预览生命周期一侧的图像与视频呈现原语）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\src\services\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b118\port\`

---

## 1. 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `src/services/fastImagePreviewService.js` | 205 / 8 352 | 6 980 | `readImageHeaderSize`、`readImageFileHeaderSize`、`createImagePreviewFromDecodedImage`、`createFastImagePreview` |
| `src/services/videoFramePresentation.js` | 217 / 8 784 | 7 322 | `getVideoPresentationSource`、`resetVideoFramePresentation`、`hasPresentedVideoFrame`、`watchVideoFramePresentation`、`__videoFramePresentationForTest` |

合计 **422 行 / 17 136 B / 9 具名导出**（镜像 14 302 B）。两件均为 **0 条相对 import 的纯叶**，按第 116 批固化的口径可直接排期（无需跨树导出闸门即可判定安全）。

注意：`__videoFramePresentationForTest` 是**端口自带**的测试面（镜像里就有），非本批自研；本批按逐字节保真要求原样保留。

---

## 2. 冻结的端口行为（只记录，不打补丁）

### 2.1 `fastImagePreviewService.js`

模块级常量属行为一部分但未导出：`DEFAULT_PREVIEW_MAX_DIMENSION = 0x400`（1024）、`DEFAULT_HEADER_BYTES = 0x200 * 0x400`（524 288）、`JPEG_SOF_MARKERS` 为 12 元素集合（`0xc0-0xc3`、`0xc5-0xc7`、`0xc9-0xcb`、`0xcd-0xcf`，即跳过 `0xc4` DHT 与 `0xc8/0xcc` 保留段）。

1. **`positiveInteger` 是一切尺寸的入口闸**：`Math.round(Number(x) || 0)`，非正归 0；因此 `'4096'` 这类字符串可用，`NaN`/`null`/负数一律 0。
2. **`readImageHeaderSize` 的尝试顺序固定为 PNG ⇒ JPEG ⇒ WebP ⇒ GIF**，且入参非 `Uint8Array` 时走 `new Uint8Array(入参 || 0x0)` —— 传 `ArrayBuffer` 可用，传 `null`/数字得到空数组并返回 `null`（不抛）。
3. **JPEG 扫描的窗口条件 `p + 8 < length`**：文件尾 8 字节内出现的 SOF 永远读不到；`FF D8/FF D9` 被 `continue` 跳过、`FF DA`（SOS）直接 `break`；段长 `< 2` 或 `p + len > length` 也 `break`（**是终止而非跳过**）；SOF 命中但段长 `< 7` 时继续往后扫；宽或高为 0 ⇒ **立即 `null`**（不再回退到别的分支）。
4. **PNG** 要求 `length >= 0x18`、前 4 字节 `89 50 4E 47`，用 `DataView` 大端读偏移 `0x10/0x14`，**不校验 `IHDR` 四字串**；子数组场景靠 `byteOffset` 保证正确。
5. **GIF** 要求 `length >= 0xa` 且版本串严格等于 `GIF87a`/`GIF89a`（`GIF89b` 不认），宽高小端。
6. **WebP 顶部 `length >= 0x1e` 使 `VP8L` 分支自带的 `>= 0x19` 判定成为死代码**；`VP8X` 读 24 位小端后 **各 +1**；`VP8 `（有损）对 16 位值做 `& 0x3fff` 掩码，宽高为 0 ⇒ `null`；`VP8L` 要求签名字节 `0x14 === 0x2f`，且**没有** 0 值保护（无条件 `1 + bits`）。
7. **`readImageFileHeaderSize`**：假值入参直接 `null`；有 `slice` 才切，切区间为 `(0, max(0x20, positiveInteger(maxHeaderBytes)))` ⇒ **显式过小值被抬到 32**，默认则用 524 288；无 `slice` 的对象原样使用；`arrayBuffer` 不是函数 ⇒ `null`；读取抛错被 `catch` 吞成 `null`。
8. **缩放不放大**：`getPreviewDimensions` 的 `scale = Math.min(1, maxDimension / Math.max(w, h))`，输出再经 `Math.max(1, Math.round(...))` ⇒ 极小图至少留 1 像素；`w`/`h` 任一为 0 ⇒ `null`。`maxDimension` 传 0 会回落到默认 1024（`|| DEFAULT`），**不是**关闭预览。
9. **`createPreviewCanvas` 写完再读**：`canvas.width/height = positiveInteger(...)` 后重新取值判正 ⇒ 真实宿主吞掉写入才可能触发该 `null` 分支（公开调用链下 `getPreviewDimensions` 恒 ≥1，本批以吞写 `Proxy` 桩覆盖）；`getContext('2d', { alpha: true })`；`drawImage(源图, 0, 0, w, h)`；`toDataURL('image/webp', 0.72)` 包在 `try{}catch{}` 里 ⇒ **污染画布抛错时 `thumbnailDataUrl` 退化为空串而 `image` 仍返回**。
10. **返回值尺寸语义差**：结果对象的 `width/height` 是**源**尺寸，`image.width/height` 才是预览画布尺寸。
11. **`createFastImagePreview` 的三段守卫**（无源对象 / `createImageBitmap` 非函数 / `documentRef.createElement` 非函数）全在**读头之前**；头尺寸非法 ⇒ **解码器一次都不会被调用**；解码参数固定 `imageOrientation:'from-image'`、`resizeQuality:'low'`、目标尺寸取头算值；最终画布尺寸优先用**位图实际**宽高，为 0 时回落算出的目标尺寸。
12. **`finally` 的 `close()` 只在位图已分配时执行**：`createImageBitmapImpl` 抛错时局部句柄仍为 `null` ⇒ 不会 close；而建画布失败（返回 `null`）时**照样 close**。

### 2.2 `videoFramePresentation.js`

1. **两套源访问器优先级不一致**是本文件最易踩的点：呈现源 `dataset.desktopMediaSourceUrl > currentSrc > getAttribute('src') > src`，声明源 `getAttribute('src') > src > currentSrc`。二者对同一元素可能给出不同组合 ⇒ 状态重建判据是「呈现源**或**声明源任一变化」。
2. **`normalizeSource`**：`String(x || '').trim()`；空 ⇒ `''`；否则 `new URL(值, globalThis.location?.href || globalThis.window?.location?.href)`，**构造失败时回落为 trim 后的原值** ⇒ Node 环境（无 `location`）下相对路径原样返回，绝对 URL 会被归一（`//` 不折叠、`..` 会折叠）。
3. **状态挂在 `WeakMap`**，键为元素对象；`getState` 对未登记对象返回 `null`。
4. **当前帧有效性 `isCurrentPresentedFrameValid`** 要求：元素存在、源匹配、`isConnected !== false`（**只挡显式 `false`**，`undefined` 视为在树内）、声明源仍匹配、`readyState >= 阈值`、`videoWidth > 0`、`videoHeight > 0`、`!error`。阈值按调用方不同：**`watchVideoFramePresentation` 用 2，`hasPresentedVideoFrame` 用 1** ⇒ 已呈现但 `readyState` 掉到 1 的视频，`hasPresentedVideoFrame` 说「是」，`watch` 却认为当前帧无效并**重新登记一次帧回调**。
5. **帧回调只登记一条**：`callbackId != null` 时后续 `watch` 直接返回 `true` 而不重复登记；回调一旦被触发就把 `callbackId` 置 `null` ⇒ **此后源切换无 id 可撤**（`cancelVideoFrameCallback` 只在待决期发生），且 `callbackId == null` 早退于 `cancelPendingFrameCallback`。
6. **回调内二次校验**：`videoWidth` 取 `元素 || meta.width || 0`，故元素尺寸为 0 而元数据带尺寸时仍会记 `frameCallbackObserved`，但随后 `isCurrentPresentedFrameValid` 失败 ⇒ 只打 `video-frame-presentation:invalid` 标记、**不置 `presented`、不写 dataset**。
7. **呈现成功写三个 dataset 键**（`firstFramePresented='1'`、`firstFramePresentedAt=String(ms)`、`firstFramePresentedSource=<归一源>`），并在通知前 **`listeners.clear()`**；`dataset` 缺失时整段写入被 `&&` 跳过（不抛）。
8. **监听者遍历带状态守卫**：`for` 循环内每次比对 `WeakMap.get(el) !== state` 即 `break` ⇒ 状态被替换/重置后旧回调不再骚扰新监听者。
9. **`createSourceState` 会 `addEventListener('emptied', reset)` 并存对应 `cleanup`**；重建时先撤旧回调、跑旧 `cleanup` 再挂新监听 ⇒ `emptied` 监听数恒为 1（**幂等由 cleanup 保证，不是由去重保证**）。
10. **`resetVideoFramePresentation`** 取消待决回调 + 摘监听 + 删状态 + 清 dataset；假值入参直接返回 `undefined`。`clearPresentedDataset` 用 `delete` ⇒ 键彻底消失，而非置 `undefined`。
11. **`globalThis.window?.['__runtimeCompareMark']?.(...)`** 是可选观测钩子，宿主不提供时静默。
12. **`hasPresentedVideoFrame(el, expectedSource)`**：元素假值、无呈现源、或显式期望源归一后与呈现源不符 ⇒ `false`；否则要求 `presented === true` 且状态记录的源仍等于当前呈现源且当前帧有效（阈值 1）。

---

## 3. 本批实际做过的检查

| 检查 | 结果 |
| --- | --- |
| `cmp` 暂存 ↔ 仓库 | 2/2 逐字节一致（`prettier --write` 对两件源码均报 `unchanged`） |
| `node --check` | 源码 2/2、测试 2/2 |
| `prettier --check` | 4/4（两件源码本就合规；两件自研测试先 `--write` 后复检通过） |
| 跨树具名导出闸门 `b100/verify-exports.mjs` | 2/2 —— 纯叶，无相对 import 可校验（0 缺失） |
| 自研测试 | **50 例**，首跑 **48/50**，2 处均为**我方期望写错、实现未改一字**：①把默认切片上限写成 `0x20*0x400`（实为 `0x200*0x400` = 524 288）；②以为 `URL` 归一会折叠 `//`（实际只折叠 `..`）。修正后 **50/50 全绿** |
| `src/**` sweep | **3 537 / 3 494 / 43 ⇒ 3 587 / 3 544 / 43**（+50 / +50 / 失败数不变） |
| 失败名集合 `diff` vs `b85-fails.txt` | **exit 0**（43 项仍全部归属缺失夹具 `tests/testPreviewDom.js`，未伪造） |
| `api/**` sweep | **475 / 475 / 0** 未变 |
| 消费方反向 grep | `api`/`src`/`electron`/`main.js`/`renderer.js` 对两个模块名 **0 命中** ⇒ 落地不接线 |
| `src/services` 零依赖纯叶缺口 | **2 ⇒ 0（该目录纯叶清零）** |
| 快照 `git status --porcelain` | 落盘后 **700**（67 修改 / 633 未跟踪），本专题文档落盘后 **701** |
| 受保护文件 | `api/freeImageHostApi.js` md5 仍 `1e0458013f5341c99f21faefc1d34d3f`；批量操作仅按名复制这两件，未触碰在用装配 |

**未执行 / 边界**：未运行应用、未起 Electron、未开浏览器窗口 ⇒ **真实图片解码（`createImageBitmap`、真实 canvas 的 `toDataURL` 污染行为）、真实 `<video>` 的 `requestVideoFrameCallback` 时序与 `emptied` 事件流全部未验证**；`Blob/File.slice` 与 `arrayBuffer()` 的真实语义以桩替代；两件在端口的消费方（预览节点、媒体节点渲染层）本仓世代不同 ⇒ 真实调用序列未验证，本批只证静态契约。测试环境无 `globalThis.location`，`normalizeSource` 的相对解析分支只能靠临时注入基址覆盖，真实宿主行为未验证。

---

## 4. 第 119 批口径

1. `src/services` 的**零依赖纯叶已清零**：此后该目录的候选全部带相对 import，**必须先跑 `b100/verify-exports.mjs` 再排期**，不得把 `deps-ast` 的 OK 当可落地清单。
2. 主候选转向 **`api/` 纯叶 41** 与 **`src/modules` 纯叶 136**（全树纯叶 286），按能力区成组落地。
3. 两件「导出受阻」件维持不解阻：`providerConnectionAutoVerification.js`（缺 `api/configApi.js :: getApiConfigSnapshot`）、`initialThemeBootstrap.js`（缺 `storeRuntimeEffectsService.js :: applyStoredThemeToDom`）—— 前置都是在用受保护装配的升代，须单独成批 + 真机验证 + 运行授权，批量操作排除 `api/freeImageHostApi.js`。
4. `modelGenerationReadiness.js` 仍卡 `api/cliTextStream.js` → `api/cliProviderApi.js` 这一对缺失件。
5. 沿用的口径：桩覆盖一律 `'k' in over ? over.k : default`；台账表行内禁止裸竖线；不伪造 shim、不伪造消费方、不伪造缺失夹具 `tests/testPreviewDom.js`。
