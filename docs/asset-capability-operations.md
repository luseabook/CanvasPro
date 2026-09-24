# 第51批 · 资产能力操作层（`assetCapabilityOperations` + 5 个资产子模块 + `imageDerivativeWorker`）

> 本批闭合 R02 最后一个缺口：0.7.16 构建里 21 KB 的 `assetCapabilityOperations.js` 及其 5 个未移植依赖。
> 交付物：7 个新模块（41 967 B 源码）+ 7 个离线测试文件（83 个用例）+ `main.js` 去内联化接线。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未启动应用、未执行真实 ffmpeg/ASR、未提交。

---

## 1 · 缺口（第51批之前）

第50批交付后，`electron/main.js` 仍内联持有整套资产导入链，而 0.7.16 构建已把它拆成模块。缺口有两点：

1. **能力操作层缺失**——本仓没有 `assetCapabilityOperations.js`。`main.js` 里 `importAssetToLibrary` 是一个 113 行的内联函数体，配合 `getAssetOriginalDir` / `getAssetIndexPath` / `getSafeOriginalExtension` / `classifyAssetKind` / `hashBuffer` / `readAssetIndex` / `writeAssetIndex` / `toAssetLocalPath` / `buildAssetResponse` / `writeAssetImageDerivatives` / `bufferFromImportPayload` / `hashFileSha256` / `copyFileStreaming` 等十余个内联辅助函数。扩容只能改 `main.js`，且与新建构建持续发散。
2. **五个依赖模块缺失**——0.7.16 的该模块 `import` 了 `keyedOperationQueue`、`assetIndexFileStore`、`assetIndexCoordinator`、`assetOriginalStore`、`assetDerivativeScheduler`、`imageDerivativeWorker`；本仓一个都没有。因此本批必须**同时**移植 6 个模块（能力层 + 5 依赖），否则能力层无法 `import`。
3. **`needsBrowserVideoProxy` 第 4 个消费点**——第50批落了 `videoPlaybackProxy.js`，但本仓还没人 `import` 它的 `needsBrowserVideoProxy`/`getVideoPlaybackProxyFilename`/`isCurrentVideoPlaybackProxyLocalPath`；本批的能力层正是这组函数的消费方。

---

## 2 · 本批交付

7 个新模块（无新增 npm 依赖；仅用 `node:crypto` / `node:fs` / `node:fs/promises` / `node:path` / `node:stream`）：

| 模块 | 字节 | 导出 |
| --- | --- | --- |
| `electron/keyedOperationQueue.js` | 1 377 | `createKeyedOperationQueue`、`createCaseInsensitivePathKey` |
| `electron/assetIndexFileStore.js` | 1 922 | `readAssetIndexFile`、`writeAssetIndexFile`、`AssetIndexReadError`、`emptyIndex` |
| `electron/assetIndexCoordinator.js` | 2 226 | `createAssetIndexCoordinator`、`normalizeAssetId`、`nextAssetRevision` |
| `electron/assetOriginalStore.js` | 10 337 | `materializeAssetOriginal`、`createAssetOriginalStore`、`getExistingAssetOriginalFilename`、`AssetOriginalIntegrityError` |
| `electron/assetDerivativeScheduler.js` | 2 292 | `createAssetDerivativeScheduler` |
| `electron/imageDerivativeWorker.js` | 3 435 | `createImageDerivativeWorker`、`renderImageDerivativePayload` |
| `electron/assetCapabilityOperations.js` | 20 378 | `createAssetCapabilityOperations`、`buildAssetCapabilityResponse` |

**关键契约（可离线验证的部分）**：

- `createKeyedOperationQueue()`：按归一化 key 串行化；跨 key 并行；`pendingKeyCount` getter；`createCaseInsensitivePathKey` 仅在 win32/darwin 降为小写。
- `readAssetIndexFile`：`ENOENT` → 空索引 `{version:1, assets:{}}`；数组根 → `TypeError('Asset index root must be an object')`；`assets` 非对象 → `TypeError('Asset index assets must be an object')`；其余读错误包成 `AssetIndexReadError`（`code: 'ASSET_INDEX_READ_FAILED'`）。
- `writeAssetIndexFile`：`mkdir` 递归；临时文件 `<index>.<pid>.<ts>.<hex6>.tmp` → `rename`；`finally` 清残留临时文件。
- `createAssetIndexCoordinator({readIndex, writeIndex, now})`：`commit(assetId, updater)` 读索引 → 调 updater → updater 返回 thenable 时抛 `TypeError('asset index updater must be synchronous')` → 假值返回 `null` → 否则打 `{assetId, assetRevision: nextAssetRevision(existing?.assetRevision), updatedAt}` 并写回；`patch(assetId, fields, {expectedMediaTaskId})` 在记录缺失或 `mediaTaskId` 不匹配时返回 `null`。
- `materializeAssetOriginal`：`targetPath` / 64-hex `expectedSha256` / 非负安全整数 `expectedSize` + **恰好一个** `sourcePath|sourceBuffer|sourceStream|createSourceStream`；写 `<target>.<pid>.<ts>.<hex8>.part`（`open 'wx'`, 0o600），流式校验 sha256 与字节数，`handle.sync()` 后 `rename`；尺寸偏大在 Transform 里提前中止（`actualSha256: null`）；同 target 并发按 `targetQueueKey` 串行；返回 `{reused, repaired, created}`。
- `createAssetDerivativeScheduler`：`status === 'ready'` / 非 video|audio 直接返回 `undefined`；video → `videoPoster`，audio → `audioWaveform`；`record.mediaTaskId && record.mediaTaskKind === kind` 且队列中 `waiting|processing` 时复用；enqueue 抛错 → 回写 `status:'partial'` + `mediaTaskStatus:'failed'`（带 `expectedMediaTaskId` 保护）并重新抛出。
- `createImageDerivativeWorker({BrowserWindow, timeoutMs = 30000})`：`show:false` / 1×1 / `sandbox:true` / `contextIsolation:true` / `nodeIntegration:false` / `backgroundThrottling:false`；`loadURL` 锁定 CSP 的 data URL；按扩展名给 mime（`.svg/.jpg/.jpeg/.webp/.gif/.avif/.bmp`，否则 `image/png`）；`renderImageDerivativePayload` 经 `.toString()` 注入 `executeJavaScript`，输出 display(1280) + thumb(320) 的 base64 PNG；`Promise.race` 超时 → `Error('Image derivative worker timed out')`；`finally` 清定时器 + 销毁窗口；同一 key 串行。
- `assetCapabilityOperations`：`buildAssetCapabilityResponse` 输出 30+ 字段（`assetRevision` 取整且 ≥0、`assetUpdatedAt`、proxy 版本/状态、原图/缩略图/波形/海报 URL、`url` 选路：image|video 走 `displayLocalPath || originalLocalPath`，其它走 `originalLocalPath`；`thumbUrl` 回退到海报）。导入路径保留原中文错误：`'缺少文件路径或文件内容'`、`'文件路径必须是绝对路径'`、`'只支持导入文件'`；图片派生物失败 → `status:'partial'`、`imageDerivativeVersion:0`、`logWarning('[electron] image asset derivative failed:', error)`；视频探针失败 → `logWarning('[electron] video asset metadata probe failed:', error)`；注入 `createImageDerivatives` 时版本号 = 2，否则 = 1。

---

## 3 · 接线现状与可达性

`main.js` 侧（本批 `git diff --stat`：267 插入 / 723 删除，净 −456 行）：

- 新增 `import { createAssetCapabilityOperations } from './assetCapabilityOperations.js';` 与 `import { createImageDerivativeWorker } from './imageDerivativeWorker.js';`；`import { randomBytes } from 'node:crypto';` 收窄；删除已无消费者的 `createHash` 与 `node:stream/promises` 的 `pipeline`。
- 以惰性单例取代整条内联链，并保留 4 个同名委派（`toAssetLocalPath` / `updateAssetRecord` / `sendAssetUpdated` / `importAssetToLibrary`），使既有 IPC 调用点零改动：

```js
let assetCapabilityOperations = null;
function getAssetCapabilityOperations() {
  if (assetCapabilityOperations) return assetCapabilityOperations;
  return (
    (assetCapabilityOperations = createAssetCapabilityOperations({
      getAssetsDir: getAssetsDir,
      getMediaTaskQueue: getMediaTaskQueue,
      createImageFromPath: (_0x77de3b) => nativeImage.createFromPath(_0x77de3b),
      createImageDerivatives: createImageDerivativeWorker({ BrowserWindow: BrowserWindow }),
      probeVideoPlaybackInfo: ffprobeVideoPlaybackInfoForImport,
      publishAssetUpdate: (_0x32e876) => {
        assetUpdateEvents.push(_0x32e876);
        mainWindow?.webContents?.send('asset:updated', _0x32e876);
      },
      shouldBufferAssetUpdates: () => false,
      isImportLoggingEnabled: isAssetImportLoggingEnabled,
    })),
    assetCapabilityOperations
  );
}
```

**可达性**：`electron/ipc/*` 的 `asset:import` 等入口 → `main.js` 委派 → 能力层 → 各子模块。`registerLocalMediaTaskHandlers` / `registerSharedMediaTaskHandlers` 仍以 `{sendAssetUpdated, toAssetLocalPath, updateAssetRecord}` 注入，签名未变。

**有意偏差（1 处）**：0.7.16 用 `shouldBufferAssetUpdates()`（接 chrome-shell 运行时）来闸门**模块内部**的 200 条缓冲；本仓第40批已有 `assetUpdateEvents` 缓冲，供 `/api/v2/desktop/asset/consume-updates` 与 `mainIpcSetup` 的 context key 消费。为避免出现第二个活缓冲、并保证第40批行为不回归，本仓固定 `shouldBufferAssetUpdates: () => false`，以 `assetUpdateEvents.push` 作为唯一发布汇聚点，同时保留模块自身的 `consumeAssetUpdateEvents`（已被测试覆盖，但仓内未接线）。

---

## 4 · 已执行的验证（离线）

| 命令 | 结果 |
| --- | --- |
| `node --check` × 8（7 个新模块 + `main.js`） | 8/8 exit 0 |
| `node --test electron/keyedOperationQueue.test.js` | **9/9 通过** |
| `node --test electron/assetIndexFileStore.test.js` | **7/7 通过** |
| `node --test electron/assetIndexCoordinator.test.js` | **12/12 通过** |
| `node --test electron/assetOriginalStore.test.js` | **14/14 通过** |
| `node --test electron/assetDerivativeScheduler.test.js` | **9/9 通过** |
| `node --test electron/imageDerivativeWorker.test.js` | **9/9 通过** |
| `node --test electron/assetCapabilityOperations.test.js` | **23/23 通过** |
| `node --test $(find electron -name '*.test.js')` | **734/733/1** |
| `node --test $(find api -name '*.test.js')` | **446/446/0** |
| `git diff --cached/--name-only` 快照 | `0/55/312/0`（第50批为 `0/55/298/0`，**+14** = 7 模块 + 7 测试文件） |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 的用例 `missing manifest coverage cannot bind to an existing unrelated local file`（R14 第17批遗留），与第43–50批一致，未新增、未变化。
- 相对第50批 651/650/1：本批 **+83**（9+7+12+14+9+9+23），全量 **734/733/1**；`api` 面 446/446/0 证明本批未触碰 `api/` 面。

**首跑修正 4 处测试期望（均为测试写错，实现未改）**：

1. 过度缩放的断言我写成 `response.width === 4000`；实际记录的字段是 `originalWidth`/`originalHeight`（响应 `width` 只读 `width || videoWidth`，图片路径不下发），已改为读索引断言 4000/2000。对照 0.7.16 原始实现（`originalWidth` 同样只在索引落盘）确认一致。
2. `relative/a.png` 我期望 `'文件路径必须是绝对路径'`；实际先 `realpathSync` 再 `isAbsolute`，不存在路径先抛 `ENOENT`（与 0.7.16 第 364–368 行顺序一致）。已改为断言 `/ENOENT/`。
3. "已有当前代理 → generated" 用例沿用了默认的 h264 探针，命中 `not_required` 分支；已改为 hevc 探针 + 预置当前版本代理文件，真正走 `generated`。
4. 缓冲用例我期望导入即发布 2 条；实际 `file` kind 不进 `assetDerivativeScheduler`（返回 `undefined`），导入期间发布 0 条。已改为显式两次 `sendAssetUpdated` 并断言 2 条。

---

## 5 · 验收欠项（仍未执行，须授权）

- **真实应用内图片导入**：`nativeImage.createFromPath` 对真实 PNG/JPEG/WebP/AVIF 的 `getSize`/`isEmpty`/`resize` 行为，以及 `<assetsDir>/derived/image/*.display.png|*.thumb.png` 的真实落盘与画布渲染。
- **`imageDerivativeWorker` 的真实 BrowserWindow 路径**：隐藏窗口的 `loadURL`/`executeJavaScript` 在打包产物里是否受 CSP/沙箱影响；超时 30 s 在超大图上的实际表现。
- **真实视频导入**：hevc / yuv444p / vp9-in-mp4 是否真正落到 `videoProxyStatus:'processing'` 并等 `videoPoster` 任务；旧 `<key>.proxy.mp4` 资产的画布表现。
- **真实 ffmpeg 代理产物**：`materializeAssetOriginal` 的 `repaired`（同尺寸损坏）与超大源提前中止，只在内存/临时文件上验证过。
- **`/api/v2/desktop/asset/consume-updates`**：第40批缓冲与本批 `shouldBufferAssetUpdates:false` 的协同，未在真实 Electron 主进程跑过。
- 大文件（GB 级）导入的 `hashFileSha256` 流式耗时与 `keyedOperationQueue` 的并发行为未实测。

---

## 6 · 剩余工作

| 项 | 规模 | 状态 |
| --- | --- | --- |
| 资产能力操作层（`assetCapabilityOperations` + 5 依赖 + `imageDerivativeWorker`） | 41 967 B | ✅ **本批** |
| 本地句柄层（8 kind）+ 播放代理共享模块 + 队列 `timeoutMs` | 20 146 B | ✅ 第50批 |
| `runProcess` 启动重试（`spawnMaxAttempts`/`spawnRetryDelayMs`）、`_pump` 优先级、`spawnImpl` 注入 | — | ❌ 未移植（R02） |
| `ffmpegVideoEncoderRuntime.js`（`runFfmpegTask` + 编码器运行时） | — | ❌ 未移植（R02） |
| 渲染器 `audioVoicePanel.js`(142 KB) / `audioVoiceAsrProviders.js` / `audioVoiceLocalAsrRuntime.js` 及 `videoToGif`/`audioVoiceCompose`/`audioVoiceAnalyze`/4 funasr/8 local kind 的调用点 | — | ❌ 未移植（R16） |
| `text-preset` 浮动采集面板、`contextMenuShortcutCatalog.js`、`completionNotificationService.js`、`desktopBridge.js`、新时间线链（`timelinePlan`/`jianyingDraft`/`toolCapture`）、`chromeShell*` 簇、`globalCaptureWindow*` | — | ❌ 未移植 |
| `runtime/ffmpeg/` + `runtime/python/` 打包、`/api/v2/video-gif`、`backend/services/*.py` 随包核实 | — | ❌ 未做 |
| R01 验收（609+ 新用例 + 全量回归 + 其余 6 个 Python 测试文件） | — | ❌ 须列命令/依赖/费用并授权 |

---

## 7 · 约束复核

- 未触碰 `api/freeImageHostApi.js`（本批未改动该文件，`api` 面 446/446/0）。
- 未新增 npm 依赖（7 个新模块仅用 Node 内置模块）。
- 未改授权检查、未改安装目录、未改 `style.css`；未改能力层以外的既有方法签名。
- 删除的是 `main.js` 中**已被同名模块取代**的内联资产链；删除前逐一确认无其它引用，`createHash` / `pipeline` 因唯一消费者被删而一并收窄 import。
- `main.js` 净删 456 行；未删除任何仍被引用的函数。
- 未联网、未启动应用、未执行真实 ffmpeg、未调用真实 ASR、未提交/推送。
