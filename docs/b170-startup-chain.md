# 170 批：启动链排障 + 方案二收窄

> 2026-10-06。承接 169 批（复刻工作室落地）。本文是 `docs/TRACKING.md` §11 该条目的细节。

## 1. 真机验证查出了什么

169 批（`7aebcc69`）跑完 `npm test` 是零回归，但**真机启动直接失败**。原因是 `npm test` 只执行仓库里已有的测试文件；
**具名导出缺失**这类问题单元测试抓不到，只有真正加载模块才暴露：

```
The requested module './replicationWorkspaceBetaNotice.js'
does not provide an export named 'hasAcceptedReplicationBetaNotice'
```

169 批的验证只查了 import **路径**存不存在，没查具名**导出**存不存在。补齐这个检查后查出 **35 处具名导出缺失 + 2 个缺失文件**。

## 2. 三处根因（全部早于本批）

### 2.1 `tools/deobf-bool.mjs` 缺 token 分隔

镜像里是 `return![]`（合法 JS：`return (![])`）。布尔层改写把 `![]` 换成 `false` 时没保留分隔，产出 `returnfalse`——
**一个合法标识符**，所以 `node --check` 查不出来。全仓 **18 文件 66 处**（`returnfalse`×56、`returntrue`×10）。

修复：`applyEdits` 在前一字节是 `[A-Za-z0-9_$.]` 时插入空格。注意更早的 b166 用它改过 1,044 个文件却没出事——
那是因 b166 的输入是已格式化的仓库文件（有空格），本批的输入是压缩过的镜像，才让这个潜伏缺陷显形。

验证（双保险）：

1. 用修好的工具从镜像**重新生成**这 18 件 → token 数差**恰好等于修复处数**（每处 `returnfalse` 1 token → `return false` 2 tokens）
2. 反向把重新生成件的修复回退 → **18/18 与仓库逐 token 完全一致**，证明差异仅此一处

### 2.2 `projectBootstrap.js` 调不存在的方法

`src/modules/app/projectBootstrap.js:39` 调 `onBeforeUnload.bindLogoProjectSave()`，但 `createProjectLifecycle`
（`src/modules/app/projectLifecycle.js:2846-2847`）只返回 `bindPersistRevisionAutoSave`、`bindHeaderProjectNameAutoSave`，
**从来没有 `bindLogoProjectSave`**；该名字在 0.8.0 全镜像 **0 次出现**。这行由 `ff93b3da`（batch 5）引入。

同行的 `bindHeaderProjectNameAutoSave` **保留**——0.8.0 里该函数存在，只是把调用挪去了 `main.js`。

### 2.3 `history.js` 被去混淆截断

| | 字节 |
|---|---|
| 仓库版 | 3270 |
| 0.7.16 镜像 | 5119 |
| 0.8.0 镜像 | 5119（与 0.7.16 **MD5 相同**）|

`createHistory` 的返回对象少了 `reset` / `createCheckpoint` / `undoToCheckpoint`，而**同一文件**的模块级函数
（`resetHistory` / `createHistoryCheckpoint` / `undoToHistoryCheckpoint`）正在调它们，`CanvasTabManager.js` 更调了 4 次 `resetHistory()`。
两代镜像该文件字节完全相同，故可作恢复基准。

## 3. 方案二：为什么不做整文件替换

为补缺失导出，最初把 9 个**共用文件**整个换成 0.8.0 版。问题：0.8.0 版除所需函数外**夹带**了**产品级变更**——

- `promptModes.js`：默认提示词模式 Seedance 2.0 → **2.5**
- `storyReplicationDefinitions.js`：提示词文案模板被重写（多「中的角色」、少「【分镜与声音】」小标题）
- `replicationWorkspaceBetaNotice.js`：改用共享模块 + 存储键 `v1` → `v2`

这些与「让复刻工作室跑起来」无关，却会让 9 条测试断言变红。用户裁决走**方案二**：回退整文件升级，**只补缺失的导出**。

### 3.1 实际改动（13 个导出，8 个文件）

| 文件 | 补什么 | 方式 |
|---|---|---|
| `workspaceBetaNotice.js` | 可选 `onConfirm` 回调（默认 null，对既有调用方零影响）| 新增参数 |
| `replicationWorkspaceBetaNotice.js` | `REPLICATION_BETA_NOTICE_STORAGE_KEY`、`hasAcceptedReplicationBetaNotice` | 复用已有 `hasSeenBetaNotice`；沿用仓库原存储键 `v1` 保持自洽 |
| `workspaceVideoPlaybackControls.js` | `WORKSPACE_VIDEO_REPEAT_ICON` | 新增 SVG 常量 |
| `promptModes.js` | `STORY_DEFAULT_PROMPT_MODE`、`isStoryPromptModeSelectable`、`getStoryPromptModeMaxClipSeconds` | 默认值指向**仓库现有的 2.0**，不引入 2.5 |
| `storyPlanningData.js` | `hasStoryClipVideoResult` | 仅加 `export`（实现已存在且语义一致）|
| `storyClipMentions.js` | `protectStoryH3LiteralTags` | 仅加 `export`（同上）|
| `storyReplicationDefinitions.js` | `collectReplicationPromptMaterialEntries`、`completeReplicationSourceFrameUsages`、`briefReplicationSceneStyle` + 私有 `occursInSourceShot` | 从 0.8.0 逐函数移植（该文件被共用的 `storyPlanningData.js` 引用，不可整件替换）|
| `storyHomePresentation.js` | `STORY_REPLICATION_PROMPT_MODE_HINT`、`renderStoryPromptModePicker` | 从 0.8.0 移植，补 2 个 import |

`storyHomeCreationOptions.js`（0.8.0 新增件）**不再需要**——它只被回退掉的 `storyHomePresentation` 0.8.0 版引用。

## 4. 验证

| 项 | 结果 |
|---|---|
| 具名导出闭包 | 512 件 / **0 缺失文件 / 0 缺失导出** |
| 混淆闸门 | 3208 件 **PASS** |
| 受保护文件 `api/freeImageHostApi.js` MD5 | `1E0458013F5341C99F21FAEFC1D34D3F` 未变 |
| `npm test` | **11215 / 11186 / 28**，失败集与基线**逐条一致，零回归** |
| 关键字粘连复扫 | 全仓仅剩 1 处，位于 `tools/deobf-bool.mjs` 的说明性注释内 |

## 5. 仍未解决的：应用还起不来

修完上述三处后启动大幅推进：**模式切换器已经能渲染出来**（实测 `P_SWITCHER = true`），但 `Object.init()` 仍中断在
`initEmptyCanvasShortcuts` → `createShortcutLibraryView`：

```
ownerRoot.querySelector('.canvas-shortcuts-rail')  // -> null
ownerElement.classList.add(...)                    // 崩
```

`.canvas-shortcuts-rail` 全仓库**只有这一处引用**，没有任何代码创建它，CSS 里也没有它的样式；而 0.8.0 的同一函数
代码**一模一样、同样没有 null 保护**——说明该元素本该存在于 DOM 里，是 `index.html` 丢了它。
**两个镜像都不带 `index.html`**，因此没有比对基准。这是下一批的入口。

## 6. 复刻工作室当前状态

- 模式已注册、入口已接、卡片与徽章与 0.8.0 对齐、VIP 门走项目现有授权码链路
- 依赖闭包完整（512 件 / 0 缺失）
- 但**没有真机证据**——应用尚未完成启动，界面看不到

## 7. 工具脚本

均在 `C:\Users\luobote\.qoder\tmp\deobf-tools\b169\`（仓库外）：
`merged.cjs`（粘连扫描）、`regen.cjs` / `verifydelta.cjs` / `backcheck.cjs`（双重验证）、`fullcheck.cjs`（文件+导出闭包）、
`extract*.cjs`（从 0.8.0 逐函数提取）、`up80/`（9 件 0.8.0 版留档，供抄函数）。
