# 自定义 AI 应用 IPC 与 preload 能力组（R02/R12 第42批）

本文对应交接台账 R02（`customAiApps:read|write` IPC）与 R12（Agent 会话/技能管理/自定义 AI 应用），记录第42批交付。**结论先行：本树自己的渲染器（`window.electronAPI`）此前完全无法触达 `customAiApps` / `agentInformation` / `agentSkills` 三组能力；`customAiApps:read|write` 两个 IPC 通道在旧树里根本不存在。本批补齐通道与 preload 暴露，但三组能力当前仍无渲染器消费者。**

## 1. 缺口（第42批之前）

这是**与第34–41批不同的一类缺陷**。此前八次命中都是"桥读了某个键、宿主从未产出该键"；本批是**通道已注册但从未暴露给渲染器**：

- `registerIpcHandlers.js`（旧树）从未 import/调用任何 `registerCustomAiAppIpcHandlers`，故 `customAiApps:read|write` **两个通道不存在**——渲染器 `invoke('customAiApps:read')` 会得到 Electron 的 "No handler registered" 拒绝。
- `electron/preload.cjs` 的 `electronAPI` 扁平对象里**没有** `customAiApps`、`agentInformation`、`agentSkills` 三个键，故即使第31批已注册 `agentInformation:readUrl`、第32批已注册 `agentSkills:list|openRoot|installFromFolder|saveManaged|deleteInstalled`，**渲染器也无从调用**（`window.electronAPI.agentSkills === undefined`）。
- 第40批虽然接通了 `/api/v2/desktop/custom-ai-apps/read|write` 两条**桥**路由，但桥的消费者是 chrome-shell 外部运行时（未移植，R15）；本树渲染器走的是 `window.electronAPI`，是**另一条路径**。
- 实测：`grep -rn "customAiApps\|agentInformation\|agentSkills" src/` 在旧树**零命中**（无任何渲染器引用）。

## 2. 本批交付

| 文件 | 作用 |
| --- | --- |
| `electron/ipc/customAiAppIpc.js`（新） | `registerCustomAiAppIpcHandlers({ ipcMain, getCustomAiAppStorage, getDataDir })`：内部 `let storage = null`；`resolveStorage()` **优先**用注入的 `getCustomAiAppStorage()`，否则**首次调用时**懒建 `createCustomAiAppStorage({ getDataDir })` 并复用同一实例。注册 `customAiApps:read` = `resolveStorage().read()`、`customAiApps:write` = `(_event, payload = {}) => resolveStorage().write(payload || {})` |
| `electron/ipc/registerIpcHandlers.js`（改） | import `registerCustomAiAppIpcHandlers`；在 `registerCanvasVisualSnapshotIpcHandlers` 之后、`registerSecureSettingsIpcHandlers` 之前调用（与新版调用顺序一致），入参 `_0x14a149`（`ipcMain` + 全部 context 键，故 `getDataDir` 可被通道读到） |
| `electron/preload.cjs`（改） | 在 `secureSettings` 之后、`importAsset` 之前补三组（字段与通道名逐一对应新版 `buildElectronCapability()` / `buildCustomAiAppCapability()` / `buildAgentInformationCapability()` / `buildAgentSkillsCapability()`）：`customAiApps: { read, write }`、`agentInformation: { readUrl }`、`agentSkills: { list, openRoot, installFromFolder, saveManaged, deleteInstalled }` |
| `electron/ipc/customAiAppIpc.test.js`（新） | 6 项离线测试（见第4节） |

### 行为要点

- **零新增 context 键**：`getDataDir` 在旧树由 `main.js` 的既有 `getDataDir()` 提供（第40批已进 IPC context，`mainIpcSetup` 亦已透出），故本批**未改动** `main.js`、`mainIpcSetup.js`、`desktopHttpBridge.js`。本批只补"末端暴露"。
- **两个存储实例不构成数据竞争**：桥侧 `desktopHttpBridge.js` 的访问器（自身 memoize + `context.getDataDir` 回落）已与新版 `desktopHttpBridge.js` 逐字符一致，故不改。IPC 侧与桥侧各持一个 `createCustomAiAppStorage` 实例，但 `read()`/`write()` **每次都重新读盘**，`write` 为逐文件 `.tmp` + `rename` 原子写，实例内不缓存任何状态，故两侧交替写不会互相覆盖或读到半成品。
- **懒建时机**：`createCustomAiAppStorage` 只在**首次调用**通道时才构造；构造本身不读盘、不建目录，`getStorageRoot()` 在 `read`/`write` 内才解析 `getDataDir`。故 `getDataDir` 返回空串时**同步抛** `Custom AI app storage data directory is unavailable`（诚实失败，不静默返回空库）。
- **写入目标**：`<dataDir>/custom-ai-apps/<sourceType>/saved-apps.json` 与 `panel-draft.json`（`sourceType` ∈ `runninghub-ai-app` / `comfyui-local-workflow` / `comfyui-cloud-workflow`），与第40批桥路由写的是**同一批文件**。

### 与新版的有意差异

**无功能性差异。** 新版 `ipc/customAiAppIpc.js` 原样移植（含 `getCustomAiAppStorage` 优先 / 懒建回落两条分支）；新版 preload 的三个能力组原样移植。唯一差异是本仓 `preload.cjs` 为手写扁平对象、新版为 `buildXxxCapability()` 工厂函数——字段名、通道名、参数透传逐一对应。

## 3. 安全边界

- 新增的两条 IPC 通道只读写 `<dataDir>/custom-ai-apps` 下的固定文件，路径不含渲染器可控片段；`sourceType`/`kind` 经 `normalizeSourceType`/`normalizeKind` 白名单收敛（未知值不扩展 schema）。
- 未新增 IPC 通道之外的能力：`agentInformation:readUrl`/`agentSkills:*` 的注册与校验沿用第31/32批实现（SSRF 加固、路径越界守卫）；本批只是把它们暴露到 `electronAPI`。
- 不改授权校验，不新增 `ipcMain.on` 监听，不扩大 preload 的 `webUtils`/`shell` 暴露面。

## 4. 已执行的验证（离线）

命令：

```
node --check electron/ipc/customAiAppIpc.js electron/ipc/customAiAppIpc.test.js \
  electron/ipc/registerIpcHandlers.js electron/preload.cjs

node --test electron/ipc/customAiAppIpc.test.js
node --test $(find electron -name '*.test.js')
```

结果：`node --check` 四个文件全部退出 0；本批新增测试 **6 项全部通过**；`electron/**` 合计 **388 项 / 387 通过 / 1 失败**（较第41批 +6）。唯一失败是既有 `electron/fullProjectPackageService.test.js`（归 R14 第17批），与本次改动无关。

覆盖点：

- 注册面：恰好 `['customAiApps:read', 'customAiApps:write']`。
- 注入优先：传入 `getCustomAiAppStorage` 时 read/write 都走注入实例，且 `getDataDir` **一被调用即抛错**以证明回落分支未被走。
- 归一：`write` 无参 / `null` / `{}` 一律以 `{}` 调用底层 `write`。
- 懒建回落（**真实临时目录**）：`read` 初始 `ok:true` / `storageRoot=<dataDir>/custom-ai-apps` / `hasData:false` / `savedApps:[]`；`write` 落盘 `comfyui-local-workflow/saved-apps.json` 且返回 `{ ok:true, version:1, storageRoot }`；再次 `read` 回读到写入项（`hasData:true`）。
- 诚实失败：`getDataDir: () => ''` 时 `read`/`write` 均**同步抛** `data directory is unavailable`。
- 降级：`runninghub-ai-app/saved-apps.json` 内容为 `{ not json` 时 `read` 仍 `ok:true` 且 `savedApps: []`。

## 5. 验收欠项（须授权后执行）

- [ ] 真实应用内从**渲染器**调用 `window.electronAPI.customAiApps.read/write`，确认自定义 AI 应用面板草稿/已存应用确实回读，且 `<dataDir>/custom-ai-apps` 目录结构与新版一致。
- [ ] `window.electronAPI.agentSkills.list/openRoot/installFromFolder/saveManaged/deleteInstalled` 端到端（含原生选目录取消、Windows 打开 explorer 回退）。
- [ ] `window.electronAPI.agentInformation.readUrl` 经渲染进程的返回结构、超时与取消传播。
- [ ] 确认 IPC 与桥两条路径交替写同一批文件时**互不覆盖**（`write` 为全量重写，两次不同 `sourceType` 的写入应各自独立）。

## 6. 已知未完成（不计入本批）

- **`preload.cjs` 无法离线测试**：CommonJS + `require('electron')`，纯 Node 下 `require('electron')` 返回字符串路径而非 API，故三个能力组只做**源码级静态核对**（与新版 preload 逐字段比对），未执行任何运行时验证。
- **三组能力当前无渲染器消费者**：本仓 `src/` 零引用；新版消费方是 `src/services/desktopBridge.js` 与 chrome-shell 运行时（R15/R12 未移植）。
- **R12 其余缺口**：Agent 会话本体、能力发现（技能目录浏览/元数据呈现）、自定义 AI 应用面板与 RunningHub 应用调用闭环。
- 未做真实桌面联调，未跑构建/打包。
