# 第83批专题：节点批量导出 + 下载保存链 `src/modules/nodeBatchExport.js`（5 件落地不接线）

本批属于 **R22（交互/节点管理/画布快捷操作）** 行，是第82批「节点管理器无头内核」的下游续接。0.7.16 端口里，节点管理器面板的**下载/导出**这一侧由 5 个模块组成：批量导出编排（`nodeBatchExport.js`）、下载落盘服务（`downloadSaveService.js`）、下载命名偏好（`downloadNamingService.js`）、媒体文件名解析（`mediaDownloadFilename.js`）、共享图标字面量（`sharedIconMarkup.js`）。本批把这 5 件**依赖已闭合、可离线验证**的模块原文落地，面板本体（`NodeManagerPanel.js`）仍按闭合证据延后。

---

## 1. 本批要补的缺口

端口这 5 个路径在本仓**均不存在**；开工前实测（`git ls-files --others` 显示 10 个新文件，`git diff --name-only` 为 0）：

- `ls src/services/downloadSaveService.js src/services/downloadNamingService.js src/components/sharedIconMarkup.js src/components/nodeToolbar/mediaDownloadFilename.js src/modules/nodeBatchExport.js` → 全部不存在；
- `grep -rn "nodeBatchExport\|sharedIconMarkup\|mediaDownloadFilename\|downloadSaveService\|downloadNamingService" src api electron main.js preload.js index.html`（排除自身）→ **全仓 0 命中**。

即这 5 件在本仓既无源码、也无任何外部引用点。本批目标是把其中**依赖闭合**的部分先原文落地并配离线测试。

## 2. 交付物

| 文件 | 行数 | 字节 | 依赖闭合 | 说明 |
| --- | --- | --- | --- | --- |
| `src/services/downloadNamingService.js` | 17 | 546 | 0 依赖 | `DOWNLOAD_ORIGINAL_FILENAME_STORAGE_KEY = 'v2-download-use-original-filename'`、`get/setDownloadUseOriginalFilename`（读写 `localStorage`，`try/catch` 兜底为 `false`） |
| `src/services/downloadSaveService.js` | 229 | 10 390 | 3（`api/projectsV2Api.js`、同族 `desktopBridge.js`、`utils/localMediaPath.js`，均已存在） | `saveTextDownload` / `saveMediaDownload` / `saveMediaFilesDownload`；桌面桥可用时走原生保存，否则回退 Blob/`<a download>`；blob 来源先 `saveOutputToServer` 暂存到 `desktop-save-staging` 再清理 |
| `src/components/sharedIconMarkup.js` | 14 | 2 972 | 0 依赖 | 7 个纯字符串常量（更多/批注/GIF/素材树 chevron/文件夹双态/面板收起等 SVG 与 mark 片段） |
| `src/components/nodeToolbar/mediaDownloadFilename.js` | 97 | 3 897 | 1（`services/downloadNamingService.js`，同批） | `resolveNodeMediaDownloadFilename({nodeName, fileName, kind, sources, fallbackBase, useOriginalFilename})`：按 kind 白名单扩展名、清洗非法字符、截断到 160 字节级基名、缺省回退 `media.<ext>` |
| `src/modules/nodeBatchExport.js` | 451 | 16 266 | 4（`i18n/index.js`、同族 `registry.js`、`services/desktopBridge.js`、`services/canvasMediaLocalService.js`，均已存在；另引同批 3 件） | 选择集→导出项收敛（文本/图片/视频/音频四类）、单节点下载 `downloadNodeOutput`、批量导出 `exportSelectedNodesBatch`（重入保护 + 跳过项合并） |
| `src/services/downloadNamingService.test.js` | 106 | 3 398 | — | 8 项 |
| `src/services/downloadSaveService.test.js` | 368 | 12 921 | — | 23 项 |
| `src/components/sharedIconMarkup.test.js` | 80 | 3 202 | — | 9 项 |
| `src/components/nodeToolbar/mediaDownloadFilename.test.js` | 270 | 7 684 | — | 18 项 |
| `src/modules/nodeBatchExport.test.js` | 643 | 22 840 | — | 42 项 |

五件源码**逐字节等于端口**（`cmp` 全 `IDENTICAL`），保留 `_0x` 局部名与端口书写风格（`!![]`、`Object['freeze']`、`0x` 十六进制、逗号表达式/返回元组）。合计源码 808 行 / 34 071 B，测试 1 467 行 / 50 045 B，测试 **100** 项。

### 2.1 关键行为（供 b84 面板接线时对照）

- **四类导出项收敛**：`collectSelectedNodeExportItems({nodes, selectedNodeIds})` → `{items, skipped}`。文本类（`source-text`/`text`/`ai-text`）取 `content`（前两类）或 `outputText`→`resultText`（`ai-text`），**全空白即视为不可导出**，不产出项；媒体类产出 `{nodeId, nodeName, nodeType, kind, localPath, url, filenameHint}`，`localPath` 走存储前缀守卫、`url` 仅收 `https?://`。`skipped` 仅在**节点对象存在**时压入 `{nodeId, nodeName, nodeType, reason:'NO_EXPORTABLE_CONTENT'}`；选中 id 在 `nodes` 中找不到节点时**既不产出也不计跳过**。
- **本地优先**：图片/视频/音频三类的 `localPath` 有值时**不再**回退远端 `url`（`localPath` 与 `url` 互斥）。
- **文本落盘命名**：`nodeName`→`nodeId`→`'text'` 回退，`[\\/:*?"<>|\x00-\x1F]`→`_`，去尾部 `[. ]`，剥 `.txt` 后缀再补 `.txt`，基名截断至 156 字符。
- **媒体落盘命名**：`useOriginalFilename` 关闭时优先 `nodeName`（这是保守默认：节点名可预期、避免远端文件名泄漏）；开启时优先 `fileName`/来源 basename。视频扩展名白名单**含 `mkv`**（故「首个可识别扩展名」可能不是 `mp4`）。
- **批量重入保护**：`batchExportPending` 期间再次调用返回 `{success:false, code:'EXPORT_IN_PROGRESS'}`；`finally` 必复位，故异常路径不会卡住标志。订阅 `subscribeNodeBatchExportPending(fn)` 会**立即**以当前值回调一次，返回退订函数。
- **跳过项合并**：批量结果 `skipped` = 选择期跳过项 ∪ 桌面桥返回的 `skipped`（`flatMap` 拼接，顺序为「选择期在前」）。
- **能力探测**：`canUseCapability(dep, 'canSaveText', 'saveText')` —— 桥接对象同时提供 `canSave*()` 与 `save*()` 时才走原生路径；仅提供 `save*()` 亦视为可用。

## 3. 接线状态（零外部消费方，链内自洽）

本批 5 件**零生产消费方**，如实记账。但链内引用是**完整**的：

```
nodeBatchExport.js ──┬─→ downloadSaveService.js ──→ api/projectsV2Api.js / desktopBridge.js / utils/localMediaPath.js
                     ├─→ mediaDownloadFilename.js ──→ downloadNamingService.js
                     └─→ downloadNamingService.js
sharedIconMarkup.js  ─── (0 依赖，纯字面量，待面板)
```

外部缺口是**同一个**：`NodeManagerPanel.js`（34 037 B，b84 目标）与 `src/modules/nodeManager/nodeManagerPanel.js` 的行级消费，以及 `main.js` 中 `createNodeManagerPanel({...})` 的装配宿主——两者在本仓均不存在。

按既定纪律：**不为「有引用」而擅自接线**，也不伪造消费方。缺口如实记账于本节与台账第83批记录。

## 4. 依赖闭合审计（受阻件：面板本体）

| 受阻件 | 行数 | 缺失依赖 | 受阻证据 |
| --- | --- | --- | --- |
| `src/modules/nodeManager/NodeManagerPanel.js` | 34 037 B | `./nodeManagerListSnapshot.js` → `../assetCoverResolver.js` → `../services/canvasMediaLocalService.js` 的 `resolveCanvasVideoDisplayUrl` / `resolveCanvasVideoPosterUrl` | 见第82批专题 §4：该两条导出在本仓 `grep` **0 命中**，且 `canvasMediaLocalService.js` 已分叉为**不同世代**（421 行 vs 端口 1 行；`litdiff2` `onlyPort(72)`/`onlyRepo(32)` 互非超集，**28 个消费方**） |

⇒ 面板装配的前置是 **`canvasMediaLocalService.js` 世代升代**，属「在用模块升代」类行为变更，须单独成批 + 真机验证，本批不做。因此本批只交付**不经过该服务**的下载/导出侧 5 件。

### 4.1 另一处如实记录的缺口：i18n 词条缺失（不可自查修复）

`nodeBatchExport.js` 通过 `t()` 使用 `nodeBatchExport.toasts.*` 共 **7 个键**：`started`、`completed`、`completedWithSkipped`、`noExportable`、`unsupported`、`failed`、`failedWithMessage`。

- 0.7.16 端口 `src/i18n/messages/{zh-CN,en-US}.js` **确有**该词条块（zh-CN 位于偏移 111 633，en-US 位于 160 306），内容形如 `'completed':"批量下载完成：已导出 {count} 个"`。
- 本仓 `src/i18n/` 全目录 `grep "nodeBatchExport"` → **0 命中**，即 7 键 × 2 语言 = 14 条词条缺失。
- 本仓 `t()` 对未命中键**回退为键名本身**（`readPath(...) ?? key`），故当前行为是**不崩溃、但提示文案显示原始键名**。
- **本批不修**：既有纪律明令「不得修改 `src/i18n/messages/*.js`」。故此项作为**已知缺口**记账，留待获得授权后单独补齐（同时应把该块按 `Object.freeze` 嵌套结构写入两个语言文件，并跑 `src/i18n` 既有测试）。

## 5. 已执行的离线验证

全部为**离线静态检查 + 离线单元测试**，未联网、未跑 Electron、未起服务、未打开真实窗口、未写任何仓库外运行状态：

- `node --check` × 5 源码 → 全 `exit 0`（另做纯 Node 冒烟 import × 5，均成功加载）。
- `prettier --check` × 10（5 源码 + 5 测试）→ 5 源码本就合规；4 个测试文件先 `--write` 一次，随后复查 **全过**。
- 忠实性：`cmp` 5 源码对端口 **逐字节一致**（`IDENTICAL`）；`litdiff2` `onlyPort(0)=[]`/`onlyRepo(0)=[]` 全空（portLits 192 / 8 / 7 / 99 / 238，unique 105 / 6 / 7 / 59 / 106）；`cmp-tokens` port=repo 且 matched 全等（1929/1929、75/75、42/42、777/777、2901/2901）。
- 测试：`node --test` 本批 5 个测试文件 → **100/100 全绿**（8 + 23 + 9 + 18 + 42）。首跑 94/100，6 处**期望写错**已修正，**实现未改**：
  1. `MATERIAL_FOLDER_ICON_MARKUP` 结尾断言写成 `'</svg>\n  '`，实为 `'</svg>\n'`（该常量以 `\x0a` 收尾，行首缩进只在开头）；
  2. `Set(['n2','n1'])` 的插入序期望写成 `['n1','n2']`，实为 **`['n2','n1']`**（`Set` 保持插入序）；
  3–5. 三处「失败/不支持」用例误读 `toast.calls[0]`（那是 `toasts.started` 的 `info` 提示），应取 `at(-1)`；
  6. 「无 `fetchRemoteBlob` 时抛错」用例未显式注入 `{fetchRemoteBlob: null}`，导致走了本仓真实 `fetchRemoteBlob` 并触发网络失败。
- 回归：`src/**` 全量 **1 635/1 592/43 → 1 735/1 692/43**（恰好 +100/+100/0）。43 项失败名集合与 b81 基线**逐条相同**（`diff` 空），**未新增任何失败**，全部为既有缺失夹具 `tests/testPreviewDom.js` 相关用例，不伪造。本批**未触碰 `electron/`**（沿用 1 649/1 648/1）。
- 快照：`0/67/480/0 → 0/67/491/0`（+11 = 5 源码 + 5 测试 + 1 专题文档）。
- `api/freeImageHostApi.js` md5 `1e0458013f5341c99f21faefc1d34d3f` **未变**。

## 6. 未执行的验收项

- 未做 UI 接线，故**未做**任何面板/工具栏级验收：未验证下载按钮的实际挂载、`showToast` 的真实宿主、`desktopBridge.nodeExport` 原生保存对话框、暂存目录 `desktop-save-staging` 的真实生成与清理。
- `desktopBridge['nodeExport']['isAvailable']()` 的真机返回值仅以 `hasBatchExportableSelection` 等纯函数路径离线覆盖；桥接真机分支（`canSaveText`/`canSaveMedia`/`canSaveMediaFiles`）**未**在 Electron 中验证。
- `api/projectsV2Api.js` 的 `saveOutputToServer`/`fetchRemoteBlob`/`deleteOutputFilesFromServer` 在测试中**全部注入替身**，未走真实后端（无联网授权）。
- i18n 7 键缺失（§4.1）导致真机提示文案会显示键名；本批未修。
- 未真机运行 Electron/未做构建。

## 7. 约束复核

- 未改 `api/freeImageHostApi.js`（md5 不变）；未改 `style.css`；未改 `src/i18n/messages/*`（§4.1 缺口因此留存）；未新增 npm 依赖。
- 未做批量覆盖式操作：本批为 10 件**新建**（`cp` 逐件指定文件名），开工前已 `git status` 记基线 `0/67/480/0`。
- 未 `git reset/clean/checkout`；未动 `D:\shuocancas`（仅只读取端口源码）。
- 未伪造消费方（§3）；未把去混淆临时目录或绝对开发机路径写入运行时代码。

## 8. 下一批建议

1. **b84：节点管理器面板装配**——`src/modules/nodeManager/NodeManagerPanel.js`（34 037 B）+ `main.js` 中 `createNodeManagerPanel({graphStore, wrap, canvasStage, executeCanvasCommand, ...})`。这是本批 5 件与第82批 4 件**共同的**外部消费方；但它被 `nodeManagerListSnapshot.js` → `assetCoverResolver.js` 阻塞（§4）。
2. **解阻路径（须单独成批 + 真机验证）**：对 `canvasMediaLocalService.js`（**28 个消费方**）做 0.7.16 世代升代，补齐 `resolveCanvasVideoDisplayUrl` / `resolveCanvasVideoPosterUrl` 等 72 个字面量差分。与 pan-preview 家族的 `rendererVirtualization.js` 升代同属「在用模块升代」一类，**不得**折进「纯新增」批次。
3. **i18n 补词**：待授权后把 `nodeBatchExport.toasts.*` 7 键 × 2 语言写入 `src/i18n/messages/{zh-CN,en-US}.js`（§4.1），并补 i18n 侧测试。
4. 其余不变：`rendererVirtualization.js` 0.7.16 升代仍是渲染器池的前置网关。
