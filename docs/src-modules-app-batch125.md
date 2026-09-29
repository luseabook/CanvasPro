# src/modules/app 13 件零依赖纯叶（第 125a 批）

> 承接 `docs/src-collaboration-batch124.md` 的「下一段」。协作镜像里文件存在性 OK 的件已全部落完，本批转入 `src/modules` 纯叶队列，先按 TRACKING §7.2 的要求重跑 `deps-ast` 重算分组，再取 `src/modules/app` 的 13 件零相对依赖纯叶成组落地。
> 全部**未接线**：模块与同名单测进了仓库，但从 `index.html`/`main.js`/`renderer.js`/`electron/main.js` 等入口走不到。

## 1. 落地清单

13 件源码 + 13 个同名 `node:test` 测试，共 26 个文件、195 例。源码合计 26 890 B / 650 行，测试合计 90 216 B / 2 615 行。

| 模块（`src/modules/app/`） | 源码 B / 行 | 源码 SHA256（前 12） | 测试 B / 行 | 例数 |
| --- | --- | --- | --- | --- |
| `agentMaterialUpload.js` | 853 / 19 | `25112512d8ba` | 4 731 / 122 | 13 |
| `apiConfigAutoSave.js` | 1 813 / 59 | `0edac714c410` | 8 304 / 269 | 17 |
| `appActivityTracking.js` | 1 723 / 42 | `a398b681eb07` | 7 366 / 216 | 18 |
| `appDebugApis.js` | 2 501 / 56 | `d101ee69fc6b` | 5 570 / 152 | 13 |
| `appTopbarCustomProviderPresentation.js` | 2 483 / 50 | `ae3522c3fb63` | 6 527 / 180 | 10 |
| `comfyUiConnectionSettings.js` | 2 399 / 49 | `b59a00a0fcc2` | 6 311 / 160 | 18 |
| `iconButtonMotion.js` | 2 688 / 66 | `36cd23622ec0` | 9 961 / 309 | 19 |
| `nativeContextMenuGuard.js` | 385 / 12 | `41b2bd99ce89` | 3 174 / 95 | 8 |
| `projectContext.js` | 585 / 12 | `a283e472bc06` | 3 153 / 75 | 11 |
| `providerStatusTooltipController.js` | 3 038 / 70 | `34d7bcf8ec0f` | 10 348 / 285 | 17 |
| `sourceNodeNameBackfill.js` | 2 799 / 75 | `ac21689304fc` | 7 761 / 236 | 16 |
| `subscriptionStateWatcher.js` | 809 / 14 | `3c1152456e82` | 4 736 / 132 | 10 |
| `workspaceCacheIdleScheduler.js` | 4 814 / 126 | `6604f157ce39` | 12 274 / 384 | 25 |

`src/modules/app` 目录此前已有在用件（如 `projectLifecycle.js`），本批只新增这 26 个文件，未改动该目录任何既有文件。

## 2. 依赖与闸门

- 13 件在 `deps-ast`（`b125/deps-modules.txt`，`scope=src/modules  port=915`，`LEAF(0 deps)=99`、`OK(has deps, all present)=95`、`BLK=333`）里全部归入 `LEAF`，本批即取自该 99 件中的 13 件。
- 导出闸门（`b123/b123-gate.mjs`，AST 版）对 13 件逐个报告 `(no relative dependencies)`，`MISSING_TOTAL=0`，退出码 0。与纯叶定义一致，无跨树依赖、无需升代任何在用件。
- 暂存核对（`b125/stage.mjs --check`，用 `deobf-tools/prettierrc.json` 格式化镜像后逐字节比）：13 件全部 `prettier(mirror)==staged:true`；暂存产物与仓库文件 `cmp` 逐字节相同 13/13。
- 未加 shim，未改任何在用文件，未新建共享测试辅助模块（避免多出一个非测试孤立件）。

## 3. 冻结行为与接入契约

以下行为均已在同名测试里固定；接线时若发现与 `D:\shuocancas` 的真实调用方不一致，按「接线批」单独写清差异，不要就地改这些契约。

1. **`nativeContextMenuGuard`**：`installNativeContextMenuGuard(target = globalThis.window)` 返回一个解除器；`target` 无 `addEventListener` 时直接返回空操作解除器。否则以 `contextmenu` + 内部 handler 注册，解除时调 `target.removeEventListener?.('contextmenu', handler)`（可选链，缺失不抛）。handler 只做 `event.preventDefault?.()`。
2. **`projectContext`**：`DEFAULT_APP_PROJECT_ID = 'default_v2_project'`（非冻结对象，仅字符串常量）。`createAppProjectContext({windowObject, defaultProjectId})` 返回 `{getCurrentProjectId, getCurrentProjectIdOrNull}`；读取的是 `windowObject.currentProjectId` 的**即时值**，取 `String(...).trim()`，空串按未设置处理。`getCurrentProjectIdOrNull` 返回 `readProjectId || null`，`getCurrentProjectId` 再兜底为 `String(defaultProjectId).trim() || DEFAULT_APP_PROJECT_ID`。
3. **`subscriptionStateWatcher`**：`subscribeToStateSlice(store, selector, callback)` 优先用 `store.subscribeSelector(selector, callback)`，否则退化为「先同步用 `store.getStateRaw?.()` 调一次 `callback`，再 `store.subscribe(s => callback(selector(s)))`」；回调非函数、`store.subscribe` 缺失时返回空操作解除器。`subscribeToSubscriptionState`/`subscribeToModelCatalogState` 分别取 state 的 `.subscription`/`.modelCatalog`，缺失按 `{}`。
4. **`agentMaterialUpload`**：`createAgentMaterialUploader({canvasNodeFlows, graphStore, getBaseName})` 返回异步函数；`blob.type` 缺失直接返回 `null`。否则以 `placement:'viewport-center-sequence'`、`sequenceKey:'agent-upload'`、`name: getBaseName?.(blob.name) || blob.name || ''` 调 `createMediaNodeFromBlob(blob, type, ...)`；创建无返回值时返回 `null`。随后按 `graphStore.getState?.() || getStateRaw?.() || {}` 的 `selectedNodeIds` **取最后一个 id** 去 `state.nodes[id]` 找节点返回，取不到返回 `null`。
5. **`apiConfigAutoSave`**：`createApiConfigAutoSaveController({beforePersist, collectConfig, saveConfig, onSaved, onError, onStateChange, timerHost, delay=600})` 返回 `{persist, schedule, flush}`。内部有一个自增世代号，`persist` 快照当前世代，异步回来后世代不等则整段丢弃（连 `onSaved`/`onError` 都不发）；`saveConfig` 的回调结果经同一条 promise 链串行化。在途计数非 0 且定时器存在时 `schedule` 会把状态重新播报为 `'scheduled'`；`flush` = 有定时器则 `persist()`，否则返回当前链（`_0x50f203`）。`cancel` 只在定时器非空时清除。
6. **`appActivityTracking`**：`detectClientOperatingSystem(navigatorObject = globalThis.navigator)` 先看 `userAgentData.platform`，再退 `platform`，再退 `userAgent`，全部小写后依次匹配 `windows|win32|win64` → `'windows'`、`macintosh|macintel|mac os|darwin` → `'macos'`、`cros|chrome os` → `'chromeos'`、`linux|x11` → `'linux'`，否则 `'other'`。`initAppActivityTracking({runtimeInfoPromise, ensureDeviceId, reportStartupActivity})` 返回 `{success, recorded, reason}`：两个回调任一非函数 → `{false,false,'unavailable'}`；设备 id trim 后为空 → `'missing_device_id'`；上报抛错 → `'report_failed'`；版本取 `String(v||'').trim().slice(0,64)`。
7. **`appDebugApis`**：`createCanvasCommandsDebugApi` / `createCanvasAgentDebugApi` 只做前向转发（后者的 `getSessionState/listSkills/getSkillState/refreshSkills` 补默认值 `|| []`/`|| null`）。`installAppDebugApis({windowObject, canvasCommands, canvasAgent})` 要求 `windowObject?.DEV_MODE === true`（严格），否则返回 `false`；通过则把 `__aiCanvasDebug` 与既有 `windowObject.__aiCanvasDebug` 展开合并后写回，返回 `true`。
8. **`appTopbarCustomProviderPresentation`**：`CUSTOM_PROVIDER_TUTORIAL_ID = 'api-guide'`。`createCustomProviderEditorShell({documentObject, editorId, tutorialLabel, discoverLabel, deleteAriaLabel})` 在 `documentObject?.createElement` 缺失时抛 `TypeError`。`createElement` 调用顺序为 `div, div, button, span, div, button, button, button`；根 `div.custom-provider-editor-item[data-custom-provider-editor-id=editorId]`，head 内是 tab 按钮（`aria-selected="false"`、`data-custom-provider-editor-tab`）与标题 `span`，actions 内按「教程按钮、发现按钮」（`append(教程, 发现)`）再被 head 以 `append(tab, 删除)` 收尾；删除按钮 `aria-label = deleteAriaLabel`、文案 `×`。
9. **`comfyUiConnectionSettings`**：冻结的 `COMFYUI_CONNECTION_TARGETS = ['local','cloud']`、`COMFYUI_LOCAL_DEFAULT_URL = '127.0.0.1:8188'`。`normalizeComfyUiFormUrl(url, fallback='')` 的 fallback 只对**假值**主参数生效（空串/null/undefined 才回退；纯空白主参数得到 `''`）；有 scheme 时只去掉尾部斜杠与 query/hash（`'http://'` → `'http:'`），无 scheme 时补 `http://`。`normalizeComfyUiConnectionTarget` 小写后只认两个目标，否则 `''`。`isComfyUiEndpointConfigured` 对纯空白 URL 判为未配置。`getComfyUiEndpointStatusEntries` 按「未配置 / 成功 `passed` / 危险 `failed` / 已配置」给 `tone` 与 `textKey`。
10. **`iconButtonMotion`**：`ICON_BUTTON_ACTIVATION_CLASS='is-icon-activating'`、`ICON_BUTTON_ACTIVATION_ANIMATION='canvas-chrome-icon-activate'`，默认 `durationMs=320`。逐元素维护世代号，超时/帧回调用世代号与当前值比对，不等就丢弃。`prefersReducedMotion` 读 `globalThis.matchMedia('(prefers-reduced-motion: reduce)')?.matches === true`；`disabled` 或减动效时只做清理、不加类也不设定时器。`animationend` 只在 `animationName` 与常量相等时复位。
11. **`providerStatusTooltipController`**：`createProviderStatusTooltipController()` 返回 `{bind, hide}`。首次 `bind` 才懒建 `div.settings-provider-test-tooltip[role=tooltip]` 挂到 `document.body`；`document.body` 缺失时返回 `null`。`bind({})` 因读 `el.dataset[...]` 抛 `TypeError`；同一元素已绑（`dataset.providerTestTooltipBound === '1'`）则跳过。定位用 24 的边距、对 `.settings-modal` 顶部做钳制，箭头用 `--settings-provider-test-tooltip-arrow-left` 限制在 14…宽−14。`hide(owner)` 只在该 owner 仍是当前持有者时清 `is-visible` 并置 `hidden`。
12. **`sourceNodeNameBackfill`**：`createSourceNodeNameBackfill({graphStore, getBaseName, translate})` 返回 `{applySourceNamesFromFileNameToCanvas, patchStoreSourceNodeNamesFromFileName}`。默认名基为 `图片/视频/音频/文本/节点`；`kind` 从**类型 token** 推出（`source-` 前缀 + `includes('image'|'video'|'audio'|'text')`）。默认 `translate` 取文件名最后一个点号后的扩展段。`patch` 只重命名「仍为默认名」的 source 节点（`renameNode`），节点集合支持数组与对象两种形态。
13. **`workspaceCacheIdleScheduler`**：`isWorkspaceCacheInteractionBusy({documentRef, CanvasTabManager})` 先看 `CanvasTabManager._isVisualSnapshotInteractionBusy?.()`，再看 5 个 body 类（`is-dragging/is-panning/is-zooming/is-viewport-animating/pick-connect-active`）加 `is-connecting-mode` 与 `v2-canvas.is-connecting`。`createWorkspaceCacheIdleScheduler({...})` 返回冻结对象 `{schedule, cancel, isPending, getGeneration}`，默认 `retryDelayMs=250`、`minIdleBudgetMs=12`、`idleTimeoutMs=1500`。`hasIdleBudget` 把非对象 deadline 视为有预算、`didTimeout === true` 视为无预算。忙碌时退到 `setTimeout`，无 `requestIdleCallback` 时用其兜底；每次 `schedule` 自增世代，`cancel` 清两种句柄。

## 4. 验证结果

| 检查 | 结果 | 证据（外部 `b125/` 下） |
| --- | --- | --- |
| 导出闸门 | 13 件全 `(no relative dependencies)`，`MISSING_TOTAL=0`，退出 0 | 主机实跑 `b123/b123-gate.mjs` |
| 暂存一致 | `prettier(mirror)==staged:true` 13/13 | `b125/stage.mjs --check` |
| 字节一致 | 暂存与仓库 `cmp` 相同 13/13 | 主机实跑 `cmp` |
| 定向首跑 | 195/195，0 失败 0 跳过，无首跑修正 | 主机实跑显式 TAP；格式化后复跑仍 195/195 |
| 语法 | 源码 + 测试 `node --check` 26/26 | 主机实跑 |
| 格式 | 13 个测试经 prettier 3.9.8 重排；源码本已合规 | `b125/stage.mjs` |
| 变异抽查 | 63 个语法有效变异，63 检出、0 存活、0 跳过；13 个基线全绿、13 个副本 `restored=true` | `b125/mutate.mjs`、`b125/mutation/results.json`；只改外部副本 |
| src 全量 | 4 535 总 / 4 492 通过 / 43 失败，退出码 1 | `b125/b125-src-raw.tap` |
| 失败名基线 | 与 b85 的 43 项完全一致，新增 0、消失 0 | `b125/b125-failure-comparison.json`、`b125/b125-src-fails-raw.txt` |
| api 全量 | 791 / 791 / 0，退出码 0 | `b125/b125-api-raw.tap` |
| 受保护文件 | `api/freeImageHostApi.js` MD5 不变 | `1E0458013F5341C99F21FAEFC1D34D3F` |
| 消费方反查 | src/api/electron 非测试 JS 与 `main.js`、`renderer.js` 共 1 048 件中，28 个模块名/导出名 token 命中 0 | `b125/consumers.mjs`（`TOTAL_CONSUMER_HITS=0`） |

变异按模块分布：`agentMaterialUpload` 5、`apiConfigAutoSave` 5、`appActivityTracking` 5、`appDebugApis` 5、`appTopbarCustomProviderPresentation` 6、`comfyUiConnectionSettings` 5、`iconButtonMotion` 5、`nativeContextMenuGuard` 3、`projectContext` 4、`providerStatusTooltipController` 5、`sourceNodeNameBackfill` 5、`subscriptionStateWatcher` 5、`workspaceCacheIdleScheduler` 5。本批**没有存活变异**，因此不需要「死分支」说明。

首轮变异脚本有 2 个因「目标串不是唯一/不完全匹配」被跳过（`iconButtonMotion` 的 `setTimer` 能力判断因该行收尾括号数与撰写不符、`providerStatusTooltipController` 的双绑守卫因漏写行首 `!_0x4eb80b ||`），改准后两者均成功加入并检出；`skipped=0` 的最终结果即上表。

## 5. 未执行项与边界

- 未启动应用、未构建、未安装依赖、未调用任何真实服务、未做浏览器/多人/真机验收。
- 未接线：13 件均为入口不可达的孤立模块（见 `docs/tracking/orphans.md`），本批只交付源码与单测。
- 单测的 DOM/事件适配器各自内嵌，不引共享辅助模块；异步等待用 `setImmediate` 而非 `await Promise.resolve()`，以固定真实微/宏任务顺序。
- 冻结契约里若出现「模块内不可观测的默认值」，本批已通过断言或直接不测的方式处理，未留下无法观测的分支。

## 6. 收尾与下一段

- 增量孤立台账 **279 → 292 / 1 041 → 1 054**（本批 13 件，非全图重算）。
- `src/modules` 纯叶队列（`b125/deps-modules.txt`）现余 **86 件 LEAF**（原 99 减本批 13）与 **95 件 OK**。下一段 125b 按 TRACKING §7.2 的顺序取 `personReplacement`（12 件 LEAF）、`runninghubAiApp`（6 件）、`panoramaSceneNode`（5 件）等成组落地；`src/modules` 直属目录下还有 47 件零依赖叶，以及 95 件 OK 件需先过导出闸门。
- R10 的 API/服务端、Session/Application 装配与真实多人运行验收仍未完成；R01–R26 不因本批落地变成完成。
