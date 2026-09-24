# 资产更新事件缓冲与自定义 AI 应用存储数据目录（R02 第40批）

本文对应交接台账 R02（`asset/consume-updates` 与 `custom-ai-apps/read|write` 路由），记录第40批交付。**结论先行：`/api/v2/desktop/asset/consume-updates` 不再是恒空的占位符，`/api/v2/desktop/custom-ai-apps/read|write` 也不再因缺数据目录而必然报错；但两者都仍**只有宿主侧**，新版渲染器（chrome-shell 运行时 + `src/services/desktopBridge.js`）未移植，未做真实桌面联调。**

## 1. 缺口（第40批之前）

- `electron/desktopHttpBridge.js` 自第30批声明 `/api/v2/desktop/asset/consume-updates`，处理器为 `() => context.consumeAssetUpdateEvents?.() || []`；`mainIpcSetup`/`main.js` 从未产出该键，路由**恒返回 `[]`**（不是报错，而是永远拿不到任何事件）。
- 同批声明的 `/api/v2/desktop/custom-ai-apps/read|write` 读 `context.getDataDir` 构造 `createCustomAiAppStorage({ getDataDir })`；`getDataDir` 未接线时 `getStorageRoot()` 直接抛 `Custom AI app storage data directory is unavailable`，两条路由**必然失败**。
- 新版把资产更新事件放在 `assetCapabilityOperations.js` 内部：`sendAssetUpdated(record)` → `buildAssetCapabilityResponse(record)` → `shouldBufferAssetUpdates()` 为真时压入一个 **200 条上限**的数组（超限 `shift` 丢最旧）→ 同时 `publishAssetUpdate(event)` 通知实时消费者；`consumeAssetUpdateEvents()` = `splice(0, length)` 取走即清。
- 本仓其实已有同样的实时通道：`main.js` 的 `sendAssetUpdated` 早就 `mainWindow.webContents.send('asset:updated', buildAssetResponse(record))`，渲染器经 `electron/preload.cjs` 订阅（`src/services/fileService.js`）。缺的只是**桥这一侧的缓冲队列**。

## 2. 本批交付

| 文件 | 作用 |
| --- | --- |
| `electron/assetUpdateEventBuffer.js`（新，**零 import**） | `ASSET_UPDATE_EVENT_LIMIT = 200`；`createAssetUpdateEventBuffer({ limit = 200 })` 返回 `{ push(event), consume() }`：`push` 忽略假值（与新版 `if (!asset) return` 一致）、超限丢最旧；`consume()` 取走即清；非法/非正 `limit` 回落 200 |
| `electron/main.js`（改） | import 新模块；`let` 状态区新增 `assetUpdateEvents = createAssetUpdateEventBuffer()`；`sendAssetUpdated` 只构造一次 `buildAssetResponse(record)`，**同一对象**既推入缓冲又发 IPC（不重复构造）；IPC context 增 `consumeAssetUpdateEvents: () => assetUpdateEvents.consume()` 与 `getDataDir: getDataDir`（既有 `getDataDir()`，模块作用域） |
| `electron/ipc/mainIpcSetup.js`（改） | 扁平对象补 `consumeAssetUpdateEvents` 与 `getDataDir` 两个 pass-through 键，桥从同一份依赖对象取到 |
| `electron/assetUpdateEventBuffer.test.js`（新） | 5 项离线测试（见第4节） |
| `electron/ipc/mainIpcSetup.test.js`（改） | +3 条路由存在性断言；+2 项真实走桥测试（真实缓冲 + 真实数据目录；未接线时的诚实降级） |

### 行为要点

- **事件形状与 IPC 完全一致**：推入缓冲的对象就是 `buildAssetResponse(record)` 的返回值，也就是 `asset:updated` 发出去的那一份（`success/assetId/kind/url/originalLocalPath/displayLocalPath/status/mediaTask*/videoProxyStatus/...`），因此同一份事件经 IPC 与经桥得到相同结构。
- **有界**：上限 200 条，超出丢**最旧**；`push` 不因假值产生空洞。桥的消费者按需 drain，不 drain 也不会无限增长。
- **默认行为不变**：`consumeAssetUpdateEvents` 未接线时路由仍是 `[]`（`?.() || []`），不抛错；`getDataDir` 未接线时 `custom-ai-apps/*` 仍**明确报错**而不是静默返回空数据。
- **一次构造**：改动前 `sendAssetUpdated` 为 IPC 构造一次响应；改动后仍只构造一次并复用，未引入额外对象分配。

### 与新版的有意差异

- **不移植 `publishAssetUpdate` 实时订阅**：新版有 `publishAssetUpdate(event)` 直推实时消费者（chrome-shell 流式通道），本仓的实时路径是 `webContents.send('asset:updated')` → preload → `fileService`，再加一层订阅只会重复投递。故只移植**有界缓冲 + drain**。
- **不移植 `shouldBufferAssetUpdates()` 开关**：新版用它避免"无人消费的运行时也常驻缓冲"；本仓缓冲对象小（≤200 条响应对象）且有界，无条件缓冲更简单；若未来接入 chrome-shell，可再按新版加门控。
- **不移植新版 `assetCapabilityOperations` 其余部分**（`importAssetToLibrary` 的派生图/索引协调/视频代理/队列等 ~21 KB + 六个依赖模块）：本仓已有等价且更早的资产导入链路（`main.js` 的 `importAssetToLibrary`/`importRemoteAssetToLibrary`/`buildAssetResponse`/`readAssetIndex`/`writeAssetIndex`），其返回值已满足 `asset/import`、`asset/import-remote` 两条路由；整体重写会与本仓既有索引/清理/恢复逻辑冲突，属**有意不移植**。

## 3. 安全边界

- 缓冲只保存宿主已构造好的响应对象，不含路径解析、文件读写或网络访问；不新增 IPC 通道，不改变 `assert*Sender` 校验。
- `getDataDir` 用的是既有 `getDataDir()`（与 `assets`/`uploads`/`workflows` 同源），未新增目录白名单或用户可传路径；`custom-ai-apps` 仍由 `createCustomAiAppStorage` 的固定子目录 + 原子 `rename` 写入，路径不受渲染器控制。
- 桥的 token/回环/POST-only 约束不变。

## 4. 已执行的验证（离线）

命令：

```
node --check electron/assetUpdateEventBuffer.js electron/assetUpdateEventBuffer.test.js \
  electron/ipc/mainIpcSetup.js electron/ipc/mainIpcSetup.test.js electron/main.js

node --test electron/assetUpdateEventBuffer.test.js electron/ipc/mainIpcSetup.test.js
node --test $(find electron -name '*.test.js')
```

结果：`node --check` 五个文件全部退出 0；本批新增测试 **7 项全部通过**（`assetUpdateEventBuffer` 5 项 + `mainIpcSetup` 2 项）；`electron/**` 合计 **325 项 / 324 通过 / 1 失败**（较第39批 +7）。唯一失败是既有 `electron/fullProjectPackageService.test.js`（归 R14 第17批），与本次改动无关。

覆盖点：

- 缓冲：顺序保持、`consume` 取走即清（第二次为空）、忽略 `null`/`undefined`/`''`、上限 200 丢最旧（压 205 条后首条为第 6 条）、`limit:0`/`NaN` 回落 200、实例之间互不共享。
- 真实走桥（临时目录）：`asset/consume-updates` 一次 drain 出两条真实事件、再次 drain 为空；`custom-ai-apps/read` 初始 `ok:true`/`storageRoot=<dataDir>/custom-ai-apps`/`hasData:false`/`savedApps:[]`；`custom-ai-apps/write` 落盘 `comfyui-local-workflow/saved-apps.json` 且 `ok:true`；再次 `read` 回读到写入项。
- 未接线降级：`asset/consume-updates` 返回 `[]`；`custom-ai-apps/read` 抛 `data directory is unavailable`（诚实失败，不静默返回空数据）。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内导入一张图片/一个视频，确认 `asset:updated` 仍照常驱动渲染器（本批改动了 `sendAssetUpdated` 的构造路径）。
- [ ] 在 `asset/consume-updates` 上验证：一次连续导入 N 个文件后 drain 出 N 条（按完成顺序），跨派生任务更新（poster/waveform/proxy）各自产生独立事件。
- [ ] 验证上限行为：连续产生 >200 条事件时旧事件被丢弃且进程内存不增长。
- [ ] `custom-ai-apps/write` 后用真实自定义 AI 应用面板确认面板草稿/已存应用确实回读；核对 `<dataDir>/custom-ai-apps` 下的目录结构与新版一致。
- [ ] 确认桥与 IPC 两条通道同时对同一资产更新**不重复投递**到渲染器（本仓渲染器只订阅 IPC）。

## 6. 已知未完成（不计入本批）

- **新版 `assetCapabilityOperations.js` 未移植**：`assetDerivativeScheduler`/`assetIndexCoordinator`/`assetIndexFileStore`/`assetOriginalStore`/`keyedOperationQueue`/`videoPlaybackProxy` 六个模块与 `assetRevision`/`assetUpdatedAt`/`videoProxyVersion` 字段；本仓 `buildAssetResponse` 无这三个字段。
- **渲染器侧未移植**：新版 `src/services/desktopBridge.js`（chrome-shell 客户端）未移植，`asset/consume-updates` 与 `custom-ai-apps/*` 目前无渲染器消费者；本仓渲染器仍走 `window.electronAPI`。
- **`text-preset/*` 五条路由仍恒不可用**：需 `globalTextPresetShortcutController.js` + `selectedTextCapture.js` + `selection-hook` 原生模块，非离线可移植。
- 未做真实桌面联调，未跑构建/打包，未验证 chrome-shell 运行时下的桥行为。
