# 第54批 · 媒体任务队列代际升级（`electron/mediaTaskQueue.js`）

> 本批把本仓 `MediaTaskQueue` 从 0.4.12 代际升到 0.7.16 代际：补上**优先级调度**、**迁移任务去重**、**spawn 启动重试**、**`spawnImpl` 注入**、**`stage` 阶段名**，以及 `cancel(id, { onlyIfWaiting })`。
> 同时**保留**本仓独有的 5 处增强（历史观察者 `onSnapshot`、enqueue ID 校验、`list({taskId})` 精确查询等）。
> 本批同时闭合了多份既有文档记为「欠项」的两处缺口：`emitProgress` 第 4 参 `{ stage }` 被忽略、以及 `_pump` 无优先级调度。
> 全部验证为**离线**：`node --check` + `node --test`。未联网、未启动应用、未执行真实 ffmpeg。

---

## 1 · 缺口（第54批之前）

| # | 缺什么 | 依据 |
| --- | --- | --- |
| 1 | `cancel(id, { onlyIfWaiting })` 的第二参 | **本仓有活的消费点但选项被静默丢弃**：`electron/desktopHttpBridge.js:308` 已经在传 `queue?.cancel(taskId, { onlyIfWaiting: true })`，而 1 参的 `cancel` 忽略它 → `/api/v2/desktop/media-task/cancel` 带 `onlyIfWaiting: true` 时**仍会杀掉正在跑的任务**，与调用方语义相反 |
| 2 | `_pump` 优先级调度 | 本仓 `_pump` 用 `shift()` 纯 FIFO；新版按 `priority` 选最大者出队 |
| 3 | 迁移任务去重 | 本仓无 `buildActiveMigrationIdentity`/`activeMigrationTasks`；同一 `(kind, purpose, migrationKey)` 并发入队会产生**重复任务**（同一资产被并发迁移/覆盖） |
| 4 | spawn 启动重试 | 本仓 `runProcess` 一次 `spawn` 失败即结算；新版对 `UNKNOWN`/`EBUSY`/`EACCES` 重试（`spawnMaxAttempts` 默认 2、`spawnRetryDelayMs` 默认 180 ms），且**同步 `throw` 与 `'error'` 事件两条路径都重试** |
| 5 | `spawnImpl` 注入 | 本仓直接调 `spawn`，无法在离线测试里替换子进程实现 |
| 6 | `stage` 阶段名 | 本仓 `emitProgress` 3 参、任务无 `stage` 字段 → 第44–53批多次记下的「`{ stage }` 第 4 参被忽略」 |
| 7 | 快照字段不足 | 本仓 `_snapshot` 无 `purpose`/`cancellable`/`priority`/`stage` → 任务中心无法区分可取消性与调度优先级 |

---

## 2 · 本批交付

**修改 1 个既有文件 + 新增 1 个测试文件 + 改 1 个既有测试文件**（未新增 npm 包，仍只 `import { spawn } from 'node:child_process'` 与 `node:path`）：

| 文件 | 变化 | 说明 |
| --- | --- | --- |
| `electron/mediaTaskQueue.js` | 333 → **461 行** / 14 274 → **19 895 B** | 9 处外科式改动，见下表 |
| `electron/mediaTaskQueue.test.js` | **新增** 556 行 / 22 063 B / **28 项用例** | 该模块此前**零测试** |
| `electron/desktopHttpBridge.test.js` | +1 项用例（11 → **12**） | 用**真实队列**验证桥的 `onlyIfWaiting` 透传（第 1 号缺口的活消费点） |

九处改动（逐项对齐新版；`_0x` 形参/局部名沿用本仓既有风格，逻辑与字符串逐字不变）：

1. **顶部常量 + 4 个助手**：`RETRYABLE_SPAWN_ERROR_CODES = Set(['UNKNOWN','EBUSY','EACCES'])`、`DEFAULT_SPAWN_RETRY_DELAY_MS = 180`、`DEFAULT_SPAWN_MAX_ATTEMPTS = 2`、`MIN_TASK_PRIORITY = -100`、`MAX_TASK_PRIORITY = 100`；`normalizeTaskPriority`（`isFinite` 守卫 → `trunc` → 夹到 ±100）、`buildActiveMigrationIdentity(kind, payload)`（`migrationKey` 为空即 `''`，否则 `JSON.stringify([kind, purpose, migrationKey])`）、`delay`、`shouldRetrySpawnError(error, attempt, max)`（`attempt >= max` 先短路，再查 `code.toUpperCase()`）。
2. **构造器**：新增 `spawnImpl` 选项（`this.spawnImpl`，非函数回落 `spawn`）与 `this.activeMigrationTasks = new Map()`。
3. **`enqueue`**：先算迁移身份——同身份且未终结则**直接返回既有快照**（不入队、不重复执行），已终结则清掉登记；任务对象新增 `cancellable`（严格 `=== true`）、`priority`（归一）、`stage: ''`、`migrationIdentity`；登记进 `activeMigrationTasks`。
4. **`cancel(id, { onlyIfWaiting })`**：`onlyIfWaiting === true` 且任务非 `waiting` 时返回 `{ ok: true, skipped: true, reason: 'task-already-finished' | 'task-already-started', task }`，**既不置 `cancelRequested` 也不 kill**。
5. **`emitProgress(task, progress, message, { stage })`**：第 4 参 `stage != null` 时写入 `task.stage`（第 6 号缺口闭合）。
6. **`runProcess` 重写**：`spawnMaxAttempts`/`spawnRetryDelayMs` 归一（注意 `?? DEFAULT` 保证显式传 0 生效）；`stdio` 只在 `input !== null && input !== undefined` 时改 `'pipe'`；`settle` 守卫保证**只结算一次**（含跨重试）；子进程一律经 `this.spawnImpl`；**同步 `throw` 与 `'error'` 事件**两条路径都按 `shouldRetrySpawnError` 重试，用尽后统一以 `createProcessStartError(..., attempt)` 结算；`'error'` 路径启用重试前额外要求 `!this.isCancelled(task)`。
7. **`_pump`**：改为「先扫出 `priority` 最大者的下标，再 `splice` 出队」。
8. **`_finish`**：终结时按身份**只清除属于自己的登记**（避免把后来者的登记误删），并支持 `{ stage }`。
9. **`_snapshot`**：新增 `purpose`（取自 `payload.purpose`）、`cancellable`、`priority`（归一）、`stage`。

---

## 3 · 接线现状与可达性

**这是本批唯一有真实收益的接线点，且是修一个既有缺陷**：

```js
// electron/desktopHttpBridge.js:303-309
[
  '/api/v2/desktop/media-task/cancel',
  (payload) => {
    const queue = context.getMediaTaskQueue?.(),
      taskId = payload?.taskId || '';
    if (payload?.onlyIfWaiting === true) return queue?.cancel(taskId, { onlyIfWaiting: true });
    return queue?.cancel(taskId);
  },
],
```

- 路由**本来就分了两条分支**，但第 2 参在第54批之前不被读取 → 带 `onlyIfWaiting: true` 的取消**实际上和普通取消完全一样**（正在跑的任务会被 kill）。第54批之后该分支才真正生效。
- 队列经 `electron/ipc/mediaTaskIpc.js` 的 `mediaTask:enqueue`/`mediaTask:cancel` 与桥两条入口共用同一实例（`main.js` 的 `getMediaTaskQueue()` 单例），因此该修复对**渲染器与桥两侧同时生效**。

其余新能力（优先级、迁移去重、spawn 重试、`spawnImpl`、`stage`）在本仓**当前无调用点传参**——它们是**新版已有的队列能力**，本批按「先补齐队列代际，再谈调用方」的顺序落地；`getMediaTaskQueue()` 的 `new MediaTaskQueue({ concurrency: 2, ... })` 未传 `priority`/`migrationKey`，故行为与升级前**逐字相同**（见下）。

---

## 4 · 已执行的验证（全部离线，本窗口实测）

| 命令 | 结果 |
| --- | --- |
| `node --check electron/mediaTaskQueue.js` | 退出 0 |
| `node --check electron/mediaTaskQueue.test.js` / `electron/desktopHttpBridge.test.js` | 退出 0 |
| `node --test electron/mediaTaskQueue.test.js` | **28/28** |
| `node --test electron/desktopHttpBridge.test.js` | **12/12**（+1） |
| `node --test $(find electron -name '*.test.js')` | **823 / 822 / 1**（第53批为 794/793/1，净增 **29**） |
| `node --test $(find api -name '*.test.js')` | **446/446/0**（本批未触碰 `api/` 面） |

- 唯一失败仍是既有 `electron/fullProjectPackageService.test.js` 用例 `missing manifest coverage cannot bind to an existing unrelated local file`（归 R14 第17批），**未新增、未变化**。
- 快照 `0/56/322/0`（第53批为 `0/56/321/0`）：**+1 untracked 已逐一归因** = `electron/mediaTaskQueue.test.js`；`modified` 与第53批同为 56（`electron/mediaTaskQueue.js` 与 `electron/desktopHttpBridge.test.js` 本就在该集合内，故编辑它们不移动计数）。
- 测试**不产生真实子进程**：`spawnImpl` 注入内存 double（`EventEmitter` + 假 `stdin/stdout/stderr/kill`），仅 `__parseFfmpegTimeSecondsForTest` 与错误类断言不涉及 spawn。真实 `spawn` 一次都没跑。

**忠实性核对方法（本批工具化，非目测）**：`C:\Users\luobote\.qoder\tmp\deobf-tools\cmp-tokens.mjs` 把两文件归一（去注释、`['x']`→`.x`、`!![]`/`![]`→`true`/`false`、`0x..`→十进制、`_0x..`→`V`、`\x20`→空格）后**按 token 做最长公共子序列比对**。结果：port **3 830** token / repo **3 969** token / **匹配 3 644**；「只在 port 出现」的 186 个 token **无一是缺失逻辑**——它们是 (a) `delay`/`shouldRetrySpawnError`/两个错误类在文件中的**声明顺序不同**造成的对齐残差，(b) 本仓把 `(this.onUpdate(this._snapshot(x)), …)` 写成 `const snapshot = …` 两行的**等价形式**，(c) 既有顶层助手里本仓用**语义名**而新版用 `_0x` 名。

---

## 5 · 本仓独有增量（**必须保留**，三份账目都不得删）

新版源码里**没有**以下 5 处，任何后续「按新版覆盖」都会把它们改坏：

| # | 本仓独有 | 作用 |
| --- | --- | --- |
| 1 | 构造器 `onSnapshot` 选项 + `_emit` 里的 `try { this.onSnapshot(snapshot, task) } catch {}` | 媒体任务**历史观察者**：观察者/存储失败**不得**影响任务执行或触发重试（历史服务自己暴露失败状态） |
| 2 | `enqueue` 的 `/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,255}$/` 校验 | 拒绝非法 `taskId`（含空格/前导 `-`），并强制 `String(this.idFactory() || '').trim()` |
| 3 | `enqueue` 的重复 ID 守卫：`Duplicate media task ID; inspect the existing task instead of retrying` | 「重试」不会静默覆盖仍在运行的第一个任务 |
| 4 | `list({ limit, taskId })` 的 `taskId` 精确查询分支 | 精确查询复用**本进程队列**，并拒绝空/非串/控制字符/超长 `taskId`（`Invalid media task ID`） |
| 5 | `list` 的 `taskId !== undefined` 与 100/500 夹取 | 同上 |

**零行为变更证明**：未注入时，`_pump` 全部优先级为 0 → 最大值取下标 0（即 FIFO），与旧 `shift()` 等价；`spawnMaxAttempts` 缺省 2，但只有在 `code ∈ {UNKNOWN, EBUSY, EACCES}` 时才重试，旧行为下这些错误**本来就以 `'error'` 事件直接结算**，此差异**已由第 2 号测试固定**；`emitProgress` 第 4 参缺省 `{}`，不写 `stage`。

---

## 6 · 验收欠项（仍未执行，须授权）

- **真实应用内**带 `onlyIfWaiting: true` 的 `/api/v2/desktop/media-task/cancel`：本批只证明**桥→队列**的透传与返回值（离线、真实 `MediaTaskQueue`）。**真实渲染器是否真的会发这个标志、以及 UI 是否据此提示"任务已开始，无法取消"**未验证。
- **真实 ffmpeg**：`spawnMaxAttempts`/`spawnRetryDelayMs` 在 Windows 上对 **`EBUSY`（文件被占用，本仓最可能命中的重试码）** 的真实重试效果未验证；重试期间旧子进程的清理是否干净未验证。
- **优先级调度**：本仓**无人传 `priority`**，故真实应用内调度顺序不会变化；新版是否有调用方依赖该顺序未核对。
- **迁移去重**：本仓**无人传 `migrationKey`**，去重分支在生产**不可达**（仅测试可达）；新版哪个调用方用它未核对。
- **`spawnImpl`**：仅测试注入，生产恒为真 `spawn`。
- `cancel` 对**正在跑的真实 ffmpeg** 仍是 `child.kill()`（Windows 上不含进程树），未验证子进程孙子进程是否残留。

---

## 7 · 剩余工作（不在本批）

- R02 其余：`legacyStorageMigration.html`、`text-preset` 浮动捕获面板、`contextMenuShortcutCatalog.js`、渲染器 `completionNotificationService.js`/`desktopBridge.js`、新时间线链（`timelinePlan.js`/`jianyingDraft.js`/`jianyingDraftLocation.js`）、`chromeShell*` 簇、`globalCaptureWindow*`。
- R16 其余：渲染器 `audioVoicePanel.js`(142 KB)/`audioVoiceAsrProviders.js`/`audioVoiceLocalAsrRuntime.js` 与 5 个 funasr kind + `videoToGif`/`audioVoiceCompose`/`audioVoiceAnalyze` + 8 个本地 kind 的**渲染器调用点**（全仓 0 命中）、`/api/v2/video-gif`、`runtime/ffmpeg/` + `runtime/python/` 打包。
- R01 验收（新增用例全量 + 7 个 Python 测试文件）仍需先列命令/依赖/耗时并**取得授权**。

---

## 8 · 约束复核

- 未改授权校验，未动安装版资源，未自动提交/推送，未触发发布；**未推送 `master`**（推送会触发 `mac-arm64-build.yml` 构建并 `gh release upload v0.4.12 --clobber`）。
- `api/freeImageHostApi.js` **未被触碰**（本批只改 `electron/` 下 3 个文件 + 4 份文档）。
- 未 `git reset --hard`/`git clean`/批量 checkout/整目录覆盖；未清理任何 untracked 交付物。
- **零新增 npm 依赖**；未把反混淆临时目录或绝对开发机路径写成运行依赖（比对脚本只存在于 `~/.qoder/tmp`，**不在仓内**）。
