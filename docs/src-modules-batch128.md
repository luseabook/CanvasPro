# 第 128 批：首波小件 10 件（`src/modules`）

> 第 127 批把全仓欠账摸清后（未落地 771、首波 260），本批是**新口径下的第一批**：从首波里取 `src/modules` 最小的一批整组落地。
> 沿用 §4 单批工序，**落地不接线**。源 10 件共 5 779 B / 143 行；测试 10 个同名件共 23 717 B / 643 行、**48 例**。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | --- | --- | --- | --- |
| `storyWorkspace/storyAssetSettingsShell` | 160/4 | 9cd916fdc252 | 2 | 815/18 |
| `storyWorkspace/storyMediaHistory` | 199/4 | a511bffdf707 | 2 | 946/19 |
| `imageCropSourceUrl` | 250/4 | da6adfe99ea2 | 5 | 1226/35 |
| `tutorials/tutorialContentCache` | 481/16 | 07381546c126 | 6 | 2578/82 |
| `personReplacement/personReplacementPromptEnhancementIntegration` | 589/14 | ebe33e5c4d33 | 6 | 2872/66 |
| `modelProviderProfiles` | 552/12 | 7ea265c08116 | 5 | 2048/43 |
| `app/canvasWorkspacePresentation` | 636/18 | d78571a84b08 | 5 | 3217/98 |
| `storyWorkspace/replicationWorkspaceBetaNotice` | 787/14 | 9ec5d7f26d89 | 5 | 3844/131 |
| `storyWorkspace/storyWorkspaceIcons` | 865/30 | f4b9675165dd | 3 | 1832/49 |
| `storyboard3d/characterActionSampling` | 1260/27 | 0d0cb5bd540f | 9 | 4339/102 |

## 2. 冻结的端口行为（写测试时的契约）

**纯别名件（3 件）**——`storyAssetSettingsShell`、`storyMediaHistory`、`storyWorkspaceIcons`。契约是「别名与源实现是**同一函数引用**」，而不是「输出相同」：

- `storyAssetSettingsShell` → `workspaceAssetSettingsShell.renderWorkspaceAssetSettingsShell`（两个导出名指向同一引用）。
- `storyMediaHistory` → `workspaceMediaHistory` 的 `createWorkspaceMediaHistoryMenuController` / `renderWorkspaceMediaHistoryMenu`。
- `storyWorkspaceIcons` → `workspaceActionIcons` 的 7 个渲染器，逐一原样转发；不同图标产出不同字符串（防串线）。

**`imageCropSourceUrl`**：`resolveImageCropSourceUrl(node)` = `resolveImageNodePreviewUrl(node) || resolveImageNodeOriginalUrl(node)`。预览侧优先 `displayLocalPath/displayUrl/previewLocalPath/previewUrl`，原始侧优先 `originalLocalPath/localPath/src/sourceUrl`；本地路径必须落在合法前缀（`data/uploads/`、`data/assets/`、`output/`）才会转成站点地址，否则该字段被忽略；两侧都空则返回空串。

**`tutorialContentCache`**：storage key 固定为 `aicanvas.tutorial-content.v1`。

- `writeTutorialCache(storage, catalog)`：先过 `normalizeTutorialCatalog`，成功写入返回 `true`；内容不合规或 storage 抛错返回 `false`，且**不落盘**。
- `readTutorialCache(storage)`：JSON 坏了、内容不合规、storage 抛错，一律返回 `null`（不抛）。
- `normalizeTutorialCatalog` 的硬要求：`schemaVersion === 1`、`revision` 为非负整数、`guide.enabled` 必须是布尔、四个内置分类（`guide`/`basic`/`play`/`updates`）一个都不能缺；`guide.enabled` 为真时 `url` 必须是合法 https。

**`personReplacementPromptEnhancementIntegration`**：返回 `Object.freeze` 的 `{ enhancePrompt, getPromptEnhancementModel }`。

- `enhancePrompt` 是包装器：调用时把**当前设置**以 `settings` 键注入载荷，**同名键会被当前设置覆盖**（不吃调用方传入的陈旧 settings）；非函数入参时该字段为 `null`。
- `getPromptEnhancementModel` 每次都重新调 `getSettings()`，不吃快照。
- 默认设置下解析出 `configured: false`、`displayName: '未配置'`、`supportsImage: false`、`maxImages: 0`。

**`modelProviderProfiles`**：`MODEL_PROVIDER_PROFILES` 是冻结的合并表（RunningHub + Agnes + MiniMax，共 6 个键），每个条目与其源档案**同一引用**；`getModelProviderProfile(id)` 去首尾空白后查表，未知/空/`null` 一律 `null`，非字符串按字符串处理（`{toString}` 也能命中）。

**`canvasWorkspacePresentation`**：`setPresentationActive(value)` 同时通知渲染器与（可省的）预热器，并驱动 `workspacePresentationLifecycle` 把 `root.hidden` 与 `aria-hidden` 同步为 `false`/`'false'`（激活）或 `true`/`'true'`（停用）；`destroy()` 收尾并把根节点置为隐藏。

**`replicationWorkspaceBetaNotice`**：固定 `storageKey = aicanvas.replicationWorkspace.betaNoticeSeen.v1`，标题「复刻工作室 Beta 测试版」，正文为固定的 Beta 说明。无 `document.body` 直接 `false`；已读（storage 为 `'1'`）再调返回 `false` 且不建 DOM；窗口没有 `localStorage` 时仍会展示一次（标记失败不阻断）。

**`characterActionSampling`**：`sampleCharacterActionPose(node, timeSec)`。

- `node.id` 不匹配 `/^(walking|running)-(left|right)$/` → **原样返回** `findMannequinPosePreset(node.poseId)`（含 `category`/`id`/`name`/`tags`，不是只包 `bones`）；预设不存在时返回 `null`。
- 匹配时按 `walking`→`walk`、`running`→`run` 取左右两个预设，用 `a + (b − a) · t`、`t = (1 − cos φ)/2`、`φ = (time/duration)·2π + (id 以 right 结尾 ? π : 0)` 插值；骨头键取左右预设的并集，缺轴按 `0` 兜底。
- `timeSec` 不可用（`undefined`/`null`/非数字）按 `0` 处理。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| prettier(镜像) 逐字节 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10 `MISSING_TOTAL=0`（21 条具名导入全命中） |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **48 / 48 / 0** |
| 消费方反查 | 真实命中 **0** → 确认「落地不接线」 |
| src 全量回归 | **6964 / 6921 / 43**（+48，与新增用例数吻合） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 48 例中 **3 例失败**，全部是测试侧问题，未动移植实现：

1. 把回落分支的契约写成 `{ bones: preset.bones }`，实际是**整份预设原样返回**（含 `category`/`id`/`name`/`tags`）——改断言为与 `findMannequinPosePreset` 结果整体相等。
2. 姿态插值在 `t → 1` 时是 `a + (b − a) · 1`，**带浮点误差**（`0.42` 变 `0.41999999999999993`），精确 `deepEqual` 必然失败——改为容差 1e-9 比较。

## 4. 接线相关（本批新增的两条）与坑

- **`modelProviderProfiles` 有同名近邻但不是消费方**：`src/modules/modelProviderProfileSelection.js` 自带 `getModelProviderProfileIds` / `getModelProviderProfileMemoryKey` 的**私有实现**，与 `getModelProviderProfile` 不是一回事。接线时要逐条比对，不能按名字替换。
- **`canvasWorkspacePresentation` 接线的硬前提**：`workspacePresentationLifecycle.deactivate()` 写的是 `root?.querySelectorAll?.('video, audio')['forEach'](...)`——**可选调用后面直接取 `['forEach']`，root 一旦提供了 `querySelectorAll` 就必须返回数组**；返回 `null`/`undefined` 会在停用路径抛 TypeError。接线时传真实根节点没问题，写替身要返回数组。
- 生命周期对象在 `getRoot()` 换根时会自动摘挂 `play` 监听，`dispose()` 后 `isActive()` 恒假——接线时不要在 dispose 后复用。

## 5. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批是**落地不接线**，运行时行为零变化。
- 未提交、未推送。
- 本批只覆盖首波 260 件里的 10 件；`src/modules` 首波还剩 39 件，其它范围（`src/core` 36、`src/components` 61、`src/manifests` 20 等）未动。
- 66 件受阻件（105 个缺失导出 / 40 个文件）未处理，其中 5 个受保护装配件须先经用户授权。

## 6. 下一段

- 继续按 §7.2 的队列推进首波剩余件（`src/modules` 余 39 → `src/core` 36 → `src/components` 61）。
- 或转去处理 §7.6 的解阻批（35 个普通文件补导出可直接做；5 个受保护装配件需授权）。

## 7. 证据文件

`deobf-tools/b128/`：`port/`（10 件 prettier 产物，与仓库逐字节一致）。回归证据：`b128-src-raw.tap`、`b128-src-raw.err`、`b128-fails.txt`、`b128-api-raw.tap`、`b128-gate.txt`。
