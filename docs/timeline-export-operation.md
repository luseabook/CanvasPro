# 时间线导出宿主操作层（R02）— 移植说明与验收欠项

本文对应交接台账 R02（`node-export/save-timeline` 路由与 `nodeExport:saveTimeline` IPC），记录第39批交付。时间线导出本身（R01–R26 之外的既有能力，见 `timeline-export.md` 第11批）不在 R22 范围内，R22 仅含画布引导/快捷键/节点管理/视频重拍。**结论先行：`createTimelineExportOperation` 已按新版同名工厂的可读形态移植并接线，`/api/v2/desktop/node-export/save-timeline` 与 `nodeExport:saveTimeline` IPC 首次同时可用；但本批**复用本仓既有 `timelineExportService`**（FCP7 XML），新版 `timelinePlan.js`/`jianyingDraft.js`/`jianyingDraftLocation.js`/`toolCapture.js` 与「剪映草稿」格式未移植，因此这是"路由不再空转 + 外壳契约对齐"，不是"新版时间线实现已补齐"。**

## 1. 缺口（第39批之前）

- `electron/desktopHttpBridge.js` 自第30批就声明 `/api/v2/desktop/node-export/save-timeline`，处理器为 `(payload) => context.saveTimeline?.(payload || {})`。
- `electron/ipc/nodeExportIpc.js`（第37批）声明 `nodeExport:saveTimeline`，并从依赖对象读 `saveTimeline`，缺函数时抛"当前环境不支持导出剪辑工程"。
- `buildMainIpcHandlerDeps` 自第30批起就没有产出 `saveTimeline` 键，`createNodeExportController`（第37批）也**刻意**只返回五个键。

于是同一缺陷**横跨两层**：桥路由恒 `undefined`，IPC 恒抛错。而本仓其实早在第11批就有可用且经过加固的导出引擎（`electron/timelineExport/timelineExportService.js` + `premiereXml.js` + `probeTimelineMedia.js`，含源哈希复核、2 GiB 上限、原子发布、`timelineExport.test.js` 11 项离线测试），只是没接上这两层入口。

## 2. 本批交付

| 文件 | 作用 |
| --- | --- |
| `electron/timelineExport/timelineExportOperation.js`（新） | `createTimelineExportOperation({dialog,getWindow,showOpenDialog,showMessageBox,getDefaultDirectory,rememberDirectory,getRoots,resolveLocalVirtualPath,getRuntimeToolOrFallback,probe,confirmExport})`；`buildTimelineExportConfirmation({directory,plan,totalBytes})` 抽出确认文案（"不是成片"、段数、分辨率/帧率/时长、媒体副本大小、逐段源帧与时间线帧、不覆盖/不联网/不转码/无执行中取消） |
| `electron/nodeExportController.js`（改） | 增参 `getNodeExportRoots`/`getRuntimeToolOrFallback`；返回对象补第六个键 `saveTimeline`，内部 `createTimelineExportOperation({dialog,getWindow:getMainWindow,showOpenDialog:injectedShowOpenDialog,getDefaultDirectory,rememberDirectory,getRoots:getNodeExportRoots,resolveLocalVirtualPath,getRuntimeToolOrFallback})` |
| `electron/ipc/timelineExportIpc.js`（改） | 确认对话框改为复用 `buildTimelineExportConfirmation`（消除重复文案）；仍保留 `dialog`、`assertNodeExportSender`、`assertActive(event)` 的发送方与窗口失效校验 |
| `electron/main.js`（改） | 抽出 `getNodeExportRoots()` 供控制器与 IPC context 共用；`createNodeExportController` 增传两个新依赖 |
| `electron/ipc/mainIpcSetup.js`（改） | 扁平对象补 `saveTimeline` 键 |
| `electron/timelineExport/timelineExportOperation.test.js`（新） | 10 项离线测试（见第4节） |
| `electron/nodeExportController.test.js`（改） | +1 项 `saveTimeline` 接线验证；暴露断言补 `saveTimeline` |
| `electron/ipc/mainIpcSetup.test.js`（改） | +1 条路由存在性断言；既有 node-export 桥验证扩展 `save-timeline` |

### 行为要点

- **返回契约与既有 `timelineExport:export` 完全一致**：`{status:'complete', directory, xmlFile, xmlSha256, manifestSaved, results, frames, fps}` / `{status:'cancelled', directory:'', results:[]}` / `{status:'failed', error, directory, results}`。不新增 `success`/`format`/`path` 字段，避免同一功能两条入口返回不同结构。
- **只记忆用户所选父目录**：导出目录是父目录下新建的 `CanvasPro-timeline-XXXXXX`；`rememberDirectory` 收到的是对话框选中的父目录（与媒体另存为共用同一份 `node-export-state.json` 记忆，与新版行为一致）。
- **记忆失败不吞结果**：`rememberDirectory` 抛错时仍返回 `complete`（导出已在磁盘上发布）。
- **对话框回落**：未注入 `showOpenDialog`/`showMessageBox` 时回落 `dialog.*(getWindow(), options)`；`getWindow()` 返回 `null` 或抛错时退化为**单参**调用（不会因窗口已销毁而崩）。
- **不存在隐式导出**：任何校验/探测失败都发生在选择目录之前，`directory` 保持空串。

## 3. 安全边界（已实现，须验收）

- 目标目录只能来自**原生对话框**，不接受渲染器传入的任意路径；导出写入 `mkdtemp` 新建子目录，**不覆盖**既有文件。
- 导入前有用户确认对话框（默认按钮"取消"），取消即不写任何字节。
- 源解析复用 `resolveExportSource`：必须在配置根目录白名单内、逐级 `lstat` 拒符号链接/目录跳转、`realpath` 后仍在根内、单文件 ≤ 512 MiB、必须为普通文件且非空；每段复制前**重新解析并比对 dev/ino/size/mtime/ctime**，确认后源变化即整批失败。
- 媒体副本总量 ≤ 2 GiB；整批元数据预检 120 s 超时；`ffprobe` 以固定可执行名 + 常量参数数组、`shell:false`、`windowsHide:true`、协议/格式白名单调用，不联网、不自动安装运行时。
- XML 与 `export-manifest.json` 用 `.part` + `COPYFILE_EXCL`/`wx` 原子发布，`timeline.xml` **最后**写入；任一段复制失败即整批 `failed` 并保留已写结果，不静默丢镜头。
- 桥 token 仍是本机渲染器同进程凭据；IPC 侧仍经 `assertNodeExportSender` fail-closed 校验发送方与窗口失效。

## 4. 已执行的验证（离线）

命令：

```
node --check electron/timelineExport/timelineExportOperation.js \
  electron/timelineExport/timelineExportOperation.test.js electron/ipc/timelineExportIpc.js \
  electron/nodeExportController.js electron/ipc/mainIpcSetup.js electron/main.js

node --test electron/timelineExport/timelineExportOperation.test.js electron/timelineExport/timelineExport.test.js \
  electron/nodeExportController.test.js electron/ipc/mainIpcSetup.test.js

node --test $(find electron -name '*.test.js')
```

结果：`node --check` 六个文件全部退出 0；第39批新增测试 **11 项全部通过**（`timelineExportOperation` 10 / `nodeExportController` +1），既有 `timelineExport.test.js` **11 项**、`nodeExportController.test.js` **7 项**、`mainIpcSetup.test.js` 全部仍通过；`electron/**` 合计 **318 项 / 317 通过 / 1 失败**（较第38批 +11）。唯一失败是既有 `electron/fullProjectPackageService.test.js`（归 R14 第17批），与本次改动无关。

覆盖点：

- 确认文案：按钮顺序 `['取消','确认导出工程']`、`defaultId`/`cancelId`/`noLink`、段数与 `1920×1080，30.000 fps，2.000 秒`、`媒体副本 2.0 MiB`、逐段"源帧 30–90，时间线 0–60"、不含原始 `localPath`、静音与保留音轨文案互斥。
- 真实导出（临时目录 + 注入对话框）：`status:'complete'`、`timeline.xml` 的 SHA-256 与 `xmlSha256` 一致、媒体副本落到新建子目录、**源文件未被改动**、探针只调用一次、确认只弹一次、`rememberDirectory` 收到所选父目录而非新建子目录。
- `defaultPath`：有记忆目录时透传；为空时**不出现该键**。
- 失败与取消：取消目录选择不弹确认也不写文件；拒绝确认不留痕；元数据不支持时两个对话框都不弹且 `directory` 为空；`rememberDirectory` 抛错仍返回 `complete`；成功后再取消不追加第二次记忆。
- 对话框回落：未注入时用 `dialog.showOpenDialog(getWindow(), options)` 且 `window` 为活动窗口；`getWindow()` 为 `null`/抛错时退化为单参调用（以 `arguments.length` 断言）。
- 控制器与桥：`saveTimeline` 为函数；空 payload 命中真实模型校验（`/1–32 个本地视频节点/`）；无可用 ffprobe 时在**选择目录之前**失败（`showOpenDialog` 零调用）；桥 `save-timeline` 先返回模型校验错误、再对合法片段返回 `第 1 段：未找到 ffprobe`。

## 5. 验收欠项（须授权后执行）

- [ ] 装好 ffprobe 的机器上，从节点选区经**渲染进程 IPC** 与**桥**各导出一次，用 Premiere/FCP 实际导入 `timeline.xml`，核对：单视频轨 + 单音轨（或明确静音时不含 `<audio>`）、入出点按最近帧量化、`file://` 绝对路径与 `%20` 转义、`media/` 内为完整源副本（含未选片段与原音轨、未转码）。
- [ ] 核对 `export-manifest.json` 的 `xmlSha256`/`results[].inFrame`/`outFrame`/`start`/`end` 与 XML 一致。
- [ ] 核对两个原生对话框的文案与取消分支（父目录选择、确认导出工程），以及取消后目标目录**零新增**。
- [ ] 核对导出到只读目录、磁盘空间不足、源文件在确认后被替换/删除三种失败路径的中文文案，且不留下 `timeline.xml`。
- [ ] 核对导出成功后 `node-export-state.json` 记录的是**所选父目录**，并成为下一次媒体另存为/时间线导出的 `defaultPath`。
- [ ] 若需新版语义（剪映草稿、`format`/`name`/`media[]` 请求形态、草稿目录自动探测），须先移植 `timelinePlan.js`/`jianyingDraft.js`/`jianyingDraftLocation.js`/`toolCapture.js` 并设计请求形态兼容，见下节。

## 6. 已知未完成（不计入本批）

- **新版实现未移植**：`electron/timelineExport/timelinePlan.js`（`validateTimelineRequest`/`normalizeTimelineMediaMetadata`/`resolveTimelinePlan`）、`jianyingDraft.js`（`draft_content.json`）、`jianyingDraftLocation.js`（剪映草稿目录探测）、`../toolCapture.js`，以及新版 `timelineExportOperation.js` 中的工程目录自动创建（`safeName` 去非法字符、Windows 保留名加 `_`、同名 ` (2)` 递进）、`format: 'jianying-draft'` 分支、`AbortSignal.timeout(25 min)`、`导入说明.txt`。本仓 `save-timeline` 只接受既有 `{title,includeAudio,clips[]}` 请求形态，不产出剪映草稿。
- **请求形态差异**：新版渲染器（`src/services/desktopBridge.js`，属 R15/R02 渲染器侧，未移植）调用 `save-timeline` 时带 `format`/`name`/`media[]`；本仓引擎会以"请选择 1–32 个本地视频节点"拒绝。这不构成静默错误，但**渲染器侧接入前必须先统一契约**。
- **渲染器消费方未移植**：本仓 `src/modules/timelineExport/TimelineExportDialog.js` 走的是 IPC `timelineExport:export`；`save-timeline` 目前由桥与新渲染器消费，本仓渲染器未改造成走 `nodeExport:saveTimeline`。
- 未做真实桌面联调，未跑构建/打包；`ffprobe` 真实探测、真实媒体复制与 Premiere 导入**完全未验证**。
