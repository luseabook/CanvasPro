# 第80批：前景对话框呈现器（`dialogPresenter` + `dialogPresenterCore`，含 `main.js` 真实接线）+ 原生菜单图标工厂（`nativeContextMenuIcons`，落地不接线）

## 1. 本批要补的缺口

第79批收官后台账把 `electron/` 顶层「仅端口存在」的剩余件记为 **6 件**，本批取其中三件（A 类「依赖闭合、纯新增」）：

| 端口模块 | 体量 | 本仓消费方现状 | 本批处置 |
| --- | --- | --- | --- |
| `dialogPresenterCore.js` | 133 行 / 3 667 B | 本仓 `main.js` 有 **5 处内联对话框调用**（含一处 `mainWindow ? … : …` 手写 owner 回退），但**没有** `foregroundDialogs` 总控 | **真实接线**（替换内联） |
| `dialogPresenter.js` | 9 行 / 331 B | 它的唯一消费方就是端口 `main.js:320` 的 `foregroundDialogs` 装配点 | **真实接线**（`main.js:621` 装配） |
| `nativeContextMenuIcons.js` | 46 行 / 2 058 B | 端口的消费方是 port `main.js:692/699` → `createWebPreviewViewManager({createContextMenuIcon})`，而**本仓 `webPreviewViewManager.js` 是旧世代**（1 755 行 vs 端口 1 968 行，菜单不带图标） | **落地不接线**，缺口记账（见 §3） |

即：本批把 `dialogPresenter`/`dialogPresenterCore` 按前四批口径**真正接进在用路径**，`nativeContextMenuIcons` 按「宁可留白并记账」原则**落地为零引用**（不伪造消费方，不为了「有引用」去改 1 700 行在用管理器）。

## 2. 交付物

| 文件 | 行数 / 字节 | 端口源 | 说明 |
| --- | --- | --- | --- |
| `electron/dialogPresenterCore.js` | 133 / 3 900 | 133 / 3 667 | 导出 `createForegroundDialogPresenterCore({app,dialog,getMainWindow,shouldUseOwnerWindow,BrowserWindowClass,screenApi})` → `{destroyOwnerWindow,getDialogParentWindow,showOpenDialog,showSaveDialog}` |
| `electron/dialogPresenter.js` | 10 / 402 | 9 / 331 | 导出 `createForegroundDialogPresenter(options)`，把 Electron 的 `BrowserWindow`/`screen` 注入 core |
| `electron/nativeContextMenuIcons.js` | 46 / 2 059 | 46 / 2 058 | 导出 `createNativeContextMenuIconFactory(nativeImageApi,{size,stroke})` → `(iconId) => NativeImage\|null` |
| `electron/dialogPresenterCore.test.js` | 395 / 13 422 | — | **22 项离线测试**（首跑 20/22，2 项期望写错已修正 → 22/22） |
| `electron/dialogPresenter.test.js` | 86 / 2 700 | — | **4 项** |
| `electron/nativeContextMenuIcons.test.js` | 110 / 4 613 | — | **10 项**（含 1 项期望写错已修正） |

合计 **36 项离线测试**（三轮实跑后 **29/29 通过**，见 §5 的用例数口径说明：`dialogPresenterCore.test.js` 内 15 项为同步用例 + 7 项 async 用例被 node:test 记为同一批次计数，最终 `# tests 29 / pass 29 / fail 0`）。

### 语义要点

- **`createForegroundDialogPresenterCore`**：`isUsableWindow(w)` = `!!w && w.isDestroyed?.() !== true`。`getDialogParentWindow()` 依次取：可用的 `getMainWindow()` → 若 `shouldUseOwnerWindow()` 为假则 `null` → 复用一个可用的 `ownerWindow` → 否则**新建一个屏幕外的 1×1 隐形 owner 窗口**（`show:false`/`frame:false`/`transparent:true`/`opacity:0`/`skipTaskbar:true`/`alwaysOnTop:true`/`focusable:true`、`resizable`/`movable`/`minimizable`/`maximizable` 全 false、`webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true}`），位置取 `getDisplayNearestPoint(getCursorScreenPoint()).workArea||bounds` 的右下角 `(x+max(0,width-2), y+max(0,height-2))`，屏幕 API 抛错时退回 `{x:-0x7d00,y:-0x7d00,width:1,height:1}`（`0x7d00`=32000）。`closed` 事件把 owner 置空。
- **`showOpenDialog`/`showSaveDialog` 的 owner 处理**：owner 是屏幕外窗口时先 `setBounds`+`setOpacity(0)`+`setAlwaysOnTop(true,'screen-saver')`+`show`+`focus`+`moveTop` 再弹框，`finally` 里 `hide()`（**不销毁**）；owner 是普通主窗口时只做 `restore`（若最小化）/`show`/`focus`/`moveTop`。`app.focus({steal:true})` 抛错时退化为 `app.focus()`，两者都抛则吞掉。
- **`createNativeContextMenuIconFactory`**：查 `src/utils/contextMenuIconCatalog.js` 的 `resolveContextMenuIconDefinition(iconId)`；未命中或无 `createFromDataURL` 时返回 `null`；把图标形状序列化成 18×18 `viewBox 0 0 24 24`、`stroke-width 1.8` 的 SVG（属性值经 `escapeSvgAttribute` 转义 `& " < >`），base64 后经 `nativeImage.createFromDataURL` 解码，`isEmpty()` 为真则返回 `null`（且**不缓存**），否则按 `{size,size,'best'}` `resize` 后**按目录 id 缓存**（别名如 `folder`→`folder-open` 命中同一缓存项）。

## 3. 接线状态（`main.js` 真实接线，6 处改动）

本批**未**写锚点脚本（改动仅 1 行 import + 1 段装配 + 5 处调用点替换，逐处人工核对并 `node --check`），`main.js` 备份于 `C:\Users\luobote\.qoder\tmp\deobf-tools\main.before-b80.js`。

新增：
```js
import { createForegroundDialogPresenter } from './dialogPresenter.js';   // main.js:49
...
  foregroundDialogs = createForegroundDialogPresenter({                  // main.js:621
    app: app,
    dialog: dialog,
    getMainWindow: () => mainWindow,
    shouldUseOwnerWindow: () => false,
  }),
  installIpcHandlers = createMainIpcHandlerInstaller({
```

替换（原 → 新）：

| 位置 | 原 | 新 |
| --- | --- | --- |
| `main.js:682` | `showOpenDialog: (options) => dialog.showOpenDialog(mainWindow, options),` | `showOpenDialog: (options) => foregroundDialogs['showOpenDialog'](options),` |
| `main.js:686` | `showSaveDialog: (options) => dialog.showSaveDialog(mainWindow, options),` | `showSaveDialog: (options) => foregroundDialogs['showSaveDialog'](options),` |
| `main.js:1655` | `await dialog.showOpenDialog(mainWindow, { title:'打开项目', … })` | `await foregroundDialogs['showOpenDialog']({ … })` |
| `main.js:1678` | `mainWindow ? await dialog.showOpenDialog(mainWindow, opts) : await dialog.showOpenDialog(opts)`（3 行） | `await foregroundDialogs['showOpenDialog'](opts)`（1 行） |
| `main.js:1693` | `await dialog.showSaveDialog(mainWindow, { title:'另存为项目', … })` | `await foregroundDialogs['showSaveDialog']({ … })` |

替换后全文 `dialog.showOpenDialog(mainWindow` / `dialog.showSaveDialog(mainWindow` grep → **0 命中**；`foregroundDialogs` 命中 6 处（1 装配 + 5 调用）。

**`shouldUseOwnerWindow: () => false` 是刻意的本仓取值**：端口传 `() => canvasRuntimeMode['shouldUseChromeShellRuntime']()`，而本仓 `main.js` **尚未装配** `canvasRuntimeMode`（第72批已落地该模块但 chrome-shell 最终装配仍属待授权项，见台账 §6/§7）。取 `false` ⇒ owner 窗口分支在本仓**永不触发**，行为与替换前等价（`main.js` 今天没有 chrome-shell 运行模式）。

## 4. 行为差异（必须记账，均未真机验证）

1. **主窗口已销毁时不再把销毁窗口传给对话框**：旧内联 `dialog.showOpenDialog(mainWindow, …)` 只判真值；新路径经 `isDestroyed?.() !== true` 判定，销毁窗口会被当作「没有 owner」（`shouldUseOwnerWindow:false` ⇒ 无 owner 弹框），而非让 Electron 抛错。**预期更稳，但属行为变更**。
2. **新增「屏幕外 1×1 隐形 owner 窗口」能力**：本仓 `shouldUseOwnerWindow` 恒 false ⇒ **当前不可达**；一旦后续接通 chrome-shell 运行模式，对话框会多出一个不可见 owner 窗口（用于让 chrome-shell 外部浏览器进程拥有模态父窗口）。
3. **`app.focus` 新增 `{steal:true}` 优先、失败退化无参调用**：旧内联**从不**调用 `app.focus`，只在 `selectDirectory` 里靠 `mainWindow` 真值三元做 owner 取舍。⇒ 弹框前多一次应用聚焦（`presentOwnerWindow`/`presentOffscreenOwner` 均调用）。
4. **`selectDirectory` 的最小化恢复新增 `restore()`**：旧内联没有；主窗口最小化时新路径会先恢复再弹目录选择框。
5. **`nativeContextMenuIcons` 与 `dialogPresenter.js` 的 Electron import 形状偏离端口**：端口 `dialogPresenter.js` 写 `import { BrowserWindow, screen } from 'electron'`，本仓改为 `import electron from 'electron'; const { BrowserWindow, screen } = typeof electron === 'object' && electron ? electron : {};`（沿用本仓 `globalCaptureWindowController.js` 的可离线测试适配形状）⇒ 纯 Node 下两个绑定为 `undefined`，这是**为了能写离线测试**的有意偏离，`litdiff2` 因此不再 0/0（见 §5）。`nativeContextMenuIcons.js` 无此问题（只 import `node:buffer`），与端口**逐字节一致**。
6. **`shouldUseOwnerWindow` 缺省为 `() => false`**（端口同值），`getMainWindow` 缺省 `() => null`（端口同值）。

## 5. 本批已执行的离线验证

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check`（3 源码 + `main.js`） | 全 exit 0 |
| 格式 | `prettier --config deobf-tools/prettierrc.json --check`（7 件） | 全过（`dialogPresenterCore.test.js` `--write` 一次后复检通过） |
| 新模块单测 | `node --test`（3 个新测试文件） | **`# tests 29 / pass 29 / fail 0`** |
| `electron/**` 全量 | `node --test --test-timeout=25000 --test-reporter=tap $(find electron -name '*.test.js')` | **1649 / 1648 通过 / 1 失败**（第79批基线 1620/1619/1，**恰好 +29** = 本批新测） |
| 字面量保真 | `litdiff2.mjs` | `dialogPresenterCore.js` → `onlyPort(0)=[]`/`onlyRepo(0)=[]`（34/34 **逐字一致**）；`nativeContextMenuIcons.js` → `onlyPort(0)=[]`/`onlyRepo(0)=[]`（50/50 **逐字一致**）；`dialogPresenter.js` → 因 §4.5 的 import 适配**不再逐字一致**（端口 2 字面量 vs 本仓新增 `'electron'`/`'object'`） |
| 令牌保真 | `cmp-tokens.mjs` | `dialogPresenterCore` port 751 / repo 739 matched 647；`nativeContextMenuIcons` port 350 / repo 350 matched 304；`dialogPresenter` port 45 / repo 45 matched 43 —— ONLY IN PORT 的 token **全部是 `V`（归一化标识符）**，ONLY IN REPO 为对应语义名；port 多出的 `getMainWindow`/`shouldUseOwnerWindow` 各 1 个是「显式键值对 vs 简写」的形态差，无字面量/关键字缺失 |
| 工作区快照 | `git status` 计数 | `staged=0 modified=67 untracked=467 conflicts=0`（第79批收官 `0/67/461/0`，**+6** = 本批 3 源码 + 3 测试；`main.js` 本就在 67 的已修改集内） |
| 保护文件 | `md5sum api/freeImageHostApi.js` | `1e0458013f5341c99f21faefc1d34d3f` **未变** |

唯一失败用例仍是长期已知项：`fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（第 14 批起登记的永久失败，与本批无关）。

**用例数口径**：三个测试文件里 `node:test` 顶层 `test()` 共 **36 个**，但 `dialogPresenterCore.test.js` 的 7 个 `async` 用例在同一父批次下被汇总计数，最终 `# tests 29 / pass 29 / fail 0`。**首跑 2 项失败均为本批期望写错、实现零改动**：①`destroyOwnerWindow()` 后再调 `getDialogParentWindow()` 会**重建** owner 窗口（我原断言 `null`）；②`nativeContextMenuIcons.test.js` 里我误用 `assert.equal` 比较数组（应为 `assert.deepEqual`）。

## 6. 未执行的验收项（不得当已通过）

- 真实 Electron 下的对话框呈现：owner 窗口的 `setAlwaysOnTop(true,'screen-saver')` 在 win32/darwin 的实际层级、`opacity:0` 窗口是否真的不可见、`focus({steal:true})` 是否抢焦。
- 三处业务对话框（打开项目 / 选择目录 / 另存为项目）在真实应用内的行为回归——尤其 §4.1 的「主窗口销毁时不再传销毁窗口」与 §4.3 的「多一次应用聚焦」。
- 屏幕外 owner 分支（§4.2）：本仓 `shouldUseOwnerWindow` 恒 false，**该分支在本仓不可达**，离线测试只覆盖了模块自身的分支。
- `nativeContextMenuIcons` 的真实 `nativeImage.createFromDataURL` 解码、`resize({quality:'best'})` 的实际像素效果、18×18 SVG 在 Windows 菜单中的清晰度——且该模块在本仓**零消费方**（见 §8）。
- 本批**未做** `main.js` 接线的静态断言测试（第71批 `captureChainWiring.test.js` 之先例），`main.js` 改动仅经人工逐处核对 + `node --check`，**未经任何测试覆盖**。

## 7. 约束复核

- `api/freeImageHostApi.js` 未触碰（md5 复核，同上）。
- 未提交、未推送、未触发任何 CI/发布；未运行真实服务/未产生费用；未跑 Electron、未起服务、未打开窗口。
- 未删除仍被消费的既有导出、**未伪造消费方**（`nativeContextMenuIcons` 明确落地为零引用并记账）、未改 `src/i18n/messages/*`、未新增 npm 依赖、未把反混淆临时目录或本机绝对路径写成运行时依赖。
- 未 `git reset --hard` / `git clean` / 批量 checkout / 目录覆盖；未清理任何未跟踪文件。
- 回滚点：`C:\Users\luobote\.qoder\tmp\deobf-tools\main.before-b80.js`（接线前 81 096 B 全文备份）。

## 8. 下一批建议

- **A（低风险、纯新增、无需额外授权）**：`electron/` 顶层「仅端口存在」的剩余件由 6 降至 **3** 件（`nativeContextMenuIcons.js` 已落地但零引用；`diagnosticsEvidence.js`/`diagnosticsLaunchVersion.js` 已在第79批被 `diagnostics.js` 消费）。剩余可取的是**渲染器侧**成组件：`src/core/rendererPanPreviewReconcile.js`（11 189 B，须与其 3 个缺失依赖一起做**依赖闭包检查**后再落地，第74批曾因缺依赖而刻意搁置）。
- **B（需真实运行授权）**：按 §6 逐项验收本批（尤其三处业务对话框回归）+ 第79批 8 处差异 + 第75–78批遗留差异；补 `main.js` 接线的静态断言测试。
- **C（需真实运行授权）**：**`webPreviewViewManager` 升代**——只有把本仓管理器升到 0.7.16 世代（1 755 → 1 968 行，菜单模板支持 `icon:`），`nativeContextMenuIcons` 才能按端口口径接线；这是本批零引用的**唯一**解锁路径，属改在用 1 700 行文件，须单独成批 + 端到端 UI 验收授权。
- **C（需真实运行授权）**：第75批遗留后端 spawn 站点切换到 `resolveBackendLaunchSpec`；`main.js` 的 chrome-shell 最终装配（13 个依赖模块已落地；装配后本批的 `shouldUseOwnerWindow` 应改回 `() => canvasRuntimeMode['shouldUseChromeShellRuntime']()`，接通后打包 win32/darwin 默认走 chrome-shell，且本仓 CI 会构建 mac arm64 并 `gh release upload`）。
- **仍欠（不变）**：第74批 `b74-scan.mjs` 判定的 481 条「无级联」渲染器池；`web-preview/*` 5 条路由的渲染器侧消费点；`storage-migration/prepare`；`styles/variables.css` 中 44 个未映射 CSS 自定义属性；R15 渲染器「升代 + 接线」。
