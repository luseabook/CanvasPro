# 第 125b 批 · `src/modules/personReplacement/` 12 件零依赖纯叶

> 承接 `docs/src-modules-app-batch125.md`（125a）。这批从重跑后的 `b125/deps-modules.txt`（`LEAF 99 / OK 95 / BLK 333`）里取 `personReplacement` 的 12 件 LEAF，逐件过导出闸门、prettier 暂存、逐字节落地、配同名 `node:test` 测试，**落地不接线**。
> 落地日期：2026-09-28。仓库文件路径一律 `src/modules/personReplacement/<name>.js`。

## 1. 落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 1 | `personReplacementAssetPackage.js` | 8684 / 217 | `70f628d0be42` | 25 |
| 2 | `personReplacementBoxDragPreview.js` | 1952 / 48 | `4e44f5c5d625` | 11 |
| 3 | `personReplacementCompletionNavigation.js` | 903 / 25 | `4217af482030` | 6 |
| 4 | `personReplacementExportSubmenuController.js` | 5214 / 127 | `5c074c375e5c` | 14 |
| 5 | `personReplacementManualBox.js` | 3560 / 72 | `a680d2ea165d` | 17 |
| 6 | `personReplacementResultHistoryLayout.js` | 1809 / 42 | `0d6001db3437` | 11 |
| 7 | `personReplacementSlideTransition.js` | 2536 / 63 | `6ccc3dc7153e` | 11 |
| 8 | `personReplacementSourceDescriptions.js` | 6556 / 134 | `c5d867ef5150` | 13 |
| 9 | `personReplacementSourcePlayback.js` | 3282 / 88 | `3ed815cc9aa4` | 11 |
| 10 | `personReplacementStableDom.js` | 3152 / 75 | `9e2f9e6227d1` | 8 |
| 11 | `personReplacementVideoSyncPlayback.js` | 7541 / 189 | `e664009ac499` | 14 |
| 12 | `personReplacementWorkspaceIntentPort.js` | 4701 / 98 | `8fd3b286235b` | 8 |

合计新增 24 个文件（12 源 + 12 测试），**149 例**离线测试。

## 2. 依赖与闸门

- 12 件在 `deps-ast` 分级里都是 LEAF（0 条相对 import），导出闸门报告「无相对依赖」，`MISSING_TOTAL=0`。
- 暂存用 `deobf-tools/b125/stage.mjs --check` 复核：12/12 `prettier(mirror)==staged:true`，SHA256 与 §1 一致。
- 落地用 `cmp` 与暂存产物逐字节比对，`staged-identical` 12/12；镜像原文（未格式化）与仓库不同是预期，闸门比的是 `prettier(mirror)`。
- `node --check` 对 24 个文件全部通过。
- 只新增文件，未覆盖任何在用件。

## 3. 冻结行为与接入契约

1. **AssetPackage**：`buildPersonReplacementAssetPackageItemRequest` 只读 `appearance.imageUrl` 与显式 `image` 对象的 `imageUrl/displayUrl/url`，**不读** `appearance.url`、`appearance.displayUrl`；`packageKey='person-replacement-project:'+projectId`、`itemKey='person-replacement-appearance:'+characterId+':'+appearanceId`、`itemName='人物｜'+character+'｜'+appearance`，缺省名分别回退「未命名人物替换项目 / 未命名人物 / 基础形象」，`category` 固定 `替换工作室`，metadata 的 `sourceKind` 固定 `person-replacement-workspace`。`savePersonReplacementAppearanceToAssetPackage` 在形象不存在或 `imageUrl` 为空时抛「当前形象不可加入总素材。」/「请先生成或上传当前形象。」，`saveAssetPackageItem` 非函数时抛「总素材服务尚未初始化。」；仅当 image 无本地路径且 URL 是 `http(s):/blob:/data:` 且 `persistOutputFromUrl` 可用时才走持久化，缺稳定地址抛「保存当前形象失败：缺少稳定图片地址。」；返回的 `totalAssetRef.itemIndex = max(0, trunc(Number(itemIndex)||0))`，`itemCreated` 仅在结果字段严格不等于 `false` 时为真。`readPersonReplacementLibraryAssets` 非函数入参返回 `[]`，只保留 `type||mediaKind` 归一后属于 `image`、`audio` 的项，异常走 `console.warn` 后返回 `[]`。`createPersonReplacementAppearanceAssetLibraryOperation` 用 `Set` 以 `projectId:characterId:appearanceId` 去重（重入返回 `null`），写回前复核工程 id 未变、且确实命中形象，否则返回 `null`；成功 toast 区分「当前形象已加入总素材。」与「已更新总素材中的当前形象。」。
2. **BoxDragPreview**：`applyManualBoxPreview` 写 `--box-x/--box-y/--box-width/--box-height`，值为比例 `*100 + '%'`（`0x64`）。`getPersonReplacementBoxDragDistance` 用 `Math.hypot`，任一坐标非有限时返回 `0`。`createPersonReplacementBoxDragPreview` 的 `schedule` 在无会话时直接返回；超过阈值（`>=`，非 `>`）置 `session.hasDragged = true`；同帧内重复调用只保留最后一次指针位置，用 `requestAnimationFrame` 合并（无 rAF 时同步 flush），flush 仅当会话对象仍与登记时同一引用才 `applyPreview`；`cancel` 撤销待执行帧并清空登记。
3. **CompletionNavigation**：空 `projectId` 返回 `false`；当前工程 id 不同时，先查工程列表，不存在则 toast「对应的替换工作室项目已不存在。」并返回 `false`，`openProject` 返回假值也返回 `false`；`step` 归一为 `max(1, min(5, trunc(Number(step)||1)))`，写回 `workspace.step` 后调用 `showProject()` 并返回 `true`。
4. **ExportSubmenuController**：三个选择器常量 `[data-person-replacement-export-group]`、`-submenu-trigger`、`-submenu`。`close(except)` 关闭除 `except` 外所有组的 `is-open` 并复位 `aria-expanded=false`、`aria-hidden=true`。`handleClick` 要求触发按钮在组内、组属于 root 且未被 `disabled`，命中则 `preventDefault` 并开组。键盘：`ArrowRight`/`Enter`/空格在触发按钮上开组并把焦点移到第一个可用选项；`ArrowLeft`/`Escape` 关组并把焦点还给触发按钮；`ArrowDown`/`ArrowUp` 在可用选项间环形移动，`Home`/`End` 到首尾，`indexOf` 不在列表（`<0`）或选项为空时不处理。`handlePointerOver`/`handleFocusIn` 开组，`handlePointerOut`/`handleFocusOut` 在 `relatedTarget` 仍在组内时不关。返回对象 `Object.freeze`。
5. **ManualBox**：`normalizePersonReplacementManualSelection` 两个角点各自 clamp 到 `[0,1]`，`width/height` 取绝对差，六位小数（`*1e6` 四舍五入），小于默认最小尺寸 `0.025 × 0.05`（可覆盖）时返回 `null`。`resolvePersonReplacementSourceImageSize` 优先 `naturalWidth/Height`（都需 `>0`），否则退到 `frame.width/height`，都不可用给 `{0,0}`。`normalizePersonReplacementManualBoxEdit` 默认 `mode='move'`（`x/y` 位移、尺寸不变），`mode` 用 `includes` 匹配 `w/e/n/s` 四边（`w`/`n` 移动起始边、`e`/`s` 移动终止边），各边保留最小尺寸且不越界，未知方向（如 `x`）等于不缩放。
6. **ResultHistoryLayout**：`SIZE='--person-replacement-results-height'`。`show(el)` 在 `closest('.person-replacement-middle-layout')` 与已跟踪布局不同时先 `disconnect` 再以 `animate=false` 写 `0px`（该写入在首次 `show` 时是 no-op，因为跟踪布局尚为 `null`），然后 `closest` 命中的内容节点变化时重建 `ResizeObserver`（来自 `ownerDocument.defaultView`）并 `observe`；末尾按被测元素 `getBoundingClientRect().height`（有限才写）同步尺寸。`hide({animate})` 断开观察并写 `0px`。`destroy` 断开、写 `0px`、清空布局引用。`_0x17ca06` 内部会过滤 `getAnimations()` 中 `transitionProperty === SIZE` 的动画，但该返回值对外不可观察。
7. **SlideTransition**：动画 id 前缀 `person-replacement-slide-`，时长 `380`（`0x17c`），缓动 `cubic-bezier(0.22, 0.72, 0.2, 1)`。`startPersonReplacementSlideTransition` 先取消两侧带前缀的动画；`matchMedia('(prefers-reduced-motion: reduce)').matches === true` 时时长为 `0`；入场 keyframes 从 `100%/-100%` 平移到 `0`，出场从 `0` 平移到 `-100%/100%`（`previous` 取反）；元素无 `animate` 方法时返回 `null` 动画，`finished` 退化为已 resolve 的 Promise；`anim.id` 为前缀 + `incoming`/`outgoing`。`cancelPersonReplacementSlideTransition` 取消 handle 上的两个动画，空 handle 安全。
8. **SourceDescriptions**：`usesSourceDescriptions` 要求 `promptMode ∈ {positioning, regular}` 且 `bindings.length > 0`。`sourceDescriptionIdentity` 返回 `{evidenceVersion: 2, source: 关键帧 ref, people: [{personId, markerLabel, bbox}]}`。`buildSourceDescriptionRequest` 缺关键帧抛「原人物识别缺少原图」，`imageRefs` 数与 binding 数不等抛「原人物识别图不完整」，`structuredOutput.schema` 的 `minItems/maxItems`、`label.enum`、`description.maxLength=40` 都由 binding 决定，`items.required` 为 `['label','description','ambiguous']`。`parseSourceDescriptions` 在 `people` 非数组或数量不符时抛「原人物识别不完整，请调整选框后重试」；每个 binding 必须恰好一条同名 label、`ambiguous !== false` 时抛、description 去空格后非空且 `<=40` 且不匹配 `/[\r\n]|图\s*\d|替换|忽略|指令|→/`，否则抛「无法明确识别<label>框中的原人物，请调整选框后重试」；成功返回 `{kind:'source-descriptions-v1', people:[{personId,markerLabel,description}]}`。`compileSourceDescriptions` 先按 `{personId,markerLabel}` 配对，缺描述抛「原人物描述与当前选框不匹配，请重新识别」；描述拼成 `图1<描述>`（`positioning` 追加「（定位图<label>框）」），`full-person` 生成「把…替换成<参考图>中的人物，包含外观和服装。」，其余范围按 `visible-part/clothing/arm-hand/face-hair/feet` 映射到「当前可见部分/服装/手臂和手部/脸部和头发/脚部」生成「把…的<部位>替换成<参考图>中人物的对应部分。」，未知范围抛「不支持的人物替换范围」；末尾固定加字幕/LOGO 清理句与背景句（有 `sceneReferenceSlot` 用「把图1的背景替换成图<n>的场景，保持人物光线与场景协调。」，否则「背景和光线保持不变。」）。
9. **SourcePlayback**：`CANONICAL_ASSET_ID_RE=/^[a-f0-9]{64}$/iu`，`CANONICAL_ORIGINAL_REF_RE` 认 `(可选)data/assets/original/<64hex>.<ext>(可选 ?#后缀)`。`getPersonReplacementSourceAssetId` 先看 64 位十六进制 `assetId`（转小写），否则从 `videoRef` 抽捕获组，都没有给 `''`。`buildPersonReplacementSourcePlaybackProxyRef` 生成 `data/assets/derived/video/<id>.proxy-v2-1280.mp4`。`resolvePersonReplacementSourcePlaybackRef` 优先级 `runtimePreviewRef → playbackVideoRef → displayLocalPath → videoRef → sourceShot.sourceVideoRef`。`hydratePersonReplacementSourcePlaybackRefs` 在入参不合格（非对象、`sources` 非数组、`checkMediaExists` 非函数）时原样返回 `{project, changed:false}`；按代理 ref 记忆化存在性检查（结果强制 `=== true`，异常算不存在）；存在且当前无 `playbackVideoRef` 时补 `assetId` 与代理 ref 并 `changed=true`，已有引用（含带前导斜杠或反斜杠写法）不动；不存在且当前引用正是代理时清空并 `changed=true`；只有真发生变化才返回新工程对象，未变化返回原引用。
10. **StableDom**：`reconcilePersonReplacementStableDom(current, next, {preserveSelector, syncAttributes, syncImage})` 递归对账，始终返回 `true`。两侧都匹配 `preserveSelector` 时整棵子树跳过；文本节点（`nodeType !== 1`）只同步 `nodeValue`；`IMG` 交给 `syncImage(current, next)` 且不再下钻；其余元素先 `syncAttributes(current, next)`，再按 `nodeKey` 配对子节点、删除多余旧子节点、用 `insertBefore` 重排（相同 key 复用同一 DOM 对象）。`nodeKey`：空白文本节点折叠为 `space:<后继 key>`；非元素为 `String(nodeType)`；`.story-asset-card-shell` 用 `:scope > [data-story-asset-id]` 的 `storyAssetId`；否则 key 源依次为 `personReplacementShotCard==='true'` 时的 `shotId`、`personReplacementImportSource`、`storyAssetId`、`personReplacementVideoReferenceKey`、`slot`，动作为 `personReplacementAction || storyAction`，最终 `tagName + ':item:'+key` 或 `':action:'+action+':'+(characterId||sourceId||shotId||'')` 或 `id` 或首个非 `is-` 类名。
11. **VideoSyncPlayback**：`createPersonReplacementVideoSyncPlayback` 要求原视频与结果视频都在，否则抛「同步播放需要原视频和替换结果视频」；容差 `max(0.02, Number(driftToleranceSec)||0.08)`。启用后按钮切 `is-active`、`aria-pressed` 同步为 `String(enabled && !destroyed)`、`aria-label` 为「关闭同步播放/开启同步播放」，`onEnabledChange(enabled)` 在 try/catch 内回调。`togglePlayback({master='result'})` 在已播放或未启用时返回 `false`；播放时以 master 对齐另一侧并 `Promise.allSettled` 同时 `play`，任一失败或随后任一侧不在播放即 `pause()` 并返回 `false`。两侧都监听 `playing/timeupdate/seeking/seeked`（推进对账，仅 master 侧触发同步，`seeking` 事件更新 master）与 `pause/ended/emptied`（拆对）。`destroy` 先暂停、清监听、置 destroyed，之后所有操作返回 `false`；`shouldReusePersonReplacementVideoPlaybackStage(a,b)` 要求两侧 `personReplacementVideoPlaybackStage` 与 `personReplacementVideoUrl` 都非空且相等，且 `personReplacementVideoPoster`、`personReplacementVideoReversed` 相等。
12. **WorkspaceIntentPort**：`PERSON_REPLACEMENT_WORKSPACE_INTENTS` 为冻结的 62 项字符串常量表。`createPersonReplacementWorkspaceIntentPort({handlers})` 在 `handlers` 非普通对象时抛 `TypeError`「Replacement Studio workspace intent handlers must be an object.」；未登记的 intent 名抛「Unsupported Replacement Studio workspace intent: <key>」，非函数 handler 抛「Replacement Studio workspace intent handler must be a function: <key>」；键会 `trim`。返回冻结对象：`supports(intent)` = 已知且已登记；`request(intent, ...args)` 对未知 intent 抛同类 `TypeError`，已知但未登记返回 `undefined`，已登记则原样转发全部实参。

## 4. 验证结果

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 导出闸门 | `MISSING_TOTAL=0`（12 件均为 LEAF） | `b125/b125-gate.mjs` |
| prettier 暂存 | `prettier(mirror)==staged:true` 12/12 | `b125b/stage --check` 输出 |
| 逐字节落地 | `staged-identical` 12/12 | `cmp` |
| 语法 | `node --check` 24/24 | — |
| 首跑 | 12 个同名测试全绿，合计 149 例（0 失败） | `b125b/b125b-src-raw.tap` |
| 变异抽查 | 61 个变异全部检出、0 存活、0 跳过；12 个外部副本基线全绿、`restored=true` | `b125b/mutation/results.json` |
| src 回归 | 4684 / 4641 / 43（125b 新增 149）；43 项失败名与 `b85-fails.txt` 完全一致、新增 0 消失 0 | `b125b/b125b-src-raw.tap`、`b125b/b125b-failure-comparison.json` |
| api 回归 | 791 / 791 / 0 | `b125b/b125b-api-raw.tap` |
| 受保护文件 | `api/freeImageHostApi.js` MD5 = `1e0458013f5341c99f21faefc1d34d3f`（未变） | — |
| 消费方反查 | 1060 个非测试 JS 文件中，12 件模块名与 27 个导出名 token 全部 0 命中 | `b125b/consumers.mjs` |

变异抽查按模块分布：AssetPackage 5、BoxDragPreview 4、CompletionNavigation 4、ExportSubmenuController 5、ManualBox 5、ResultHistoryLayout 4、SlideTransition 5、SourceDescriptions 6、SourcePlayback 5、StableDom 6、VideoSyncPlayback 7、WorkspaceIntentPort 5。

## 5. 未执行项与边界

- 没有接线：12 件的模块名与导出名在 `api`、`src`、`electron`、`main.js`、`renderer.js` 中 0 命中，记为「落地不接线」。
- 没有启动应用、Electron、构建、真机联调，也没有发起任何真实模型或云服务请求。
- 未提交、未推送。
- 三个初判存活的变异按真实缺口处理，没有以「死分支」解释掉：
  - `ManualBox` 默认 `mode` 此前无断言覆盖（既有用例都显式传 `move`），补「不传 mode 且位移非零」的断言后转为检出；镜像里默认值与 `resize` 分支在零位移下结果相同，属真实覆盖缺口。
  - `ResultHistoryLayout` 的动画过滤（`transitionProperty === SIZE`）**对外不可观察**（过滤结果被丢弃），故换成同类可观察变异（`is-results-layout-static` 的 add/remove）重测并在 §3 第 6 条写明该内部行为不可断言。
  - `StableDom` 的「配对后从待删集合移除」在纯序意义上不可观察（先删再按目标顺序重插结果相同），换成子节点 key 匹配谓词取反后检出。
- `personReplacement` 队列里这 12 件落完后，该目录的 LEAF 已清零；其余仍留在 OK/BLK。

## 6. 收尾与下一段

- 孤立台账 292 → 304 / 1054 → 1066；`src/modules/personReplacement/` 计数 8 → 20。
- `src/modules` 纯叶队列：`LEAF 99 → 87`（125a 13 + 125b 12 已落），仍余 87 LEAF（`runninghubAiApp` 6、`panoramaSceneNode` 5、`canvasShortcuts` 1、`promptPresetCatalog` 1、`imageAnnotate` 2、`interaction` 3、`whiteboard` 2、`tutorials` 2、`settings` 2、`canvasMcp` 2、`videoRetake` 1，以及 `src/modules` 直属目录 47 件等）与 95 件 OK。
- 下一段（125c）按 §7.2 顺序取 `runninghubAiApp` 6 件、`panoramaSceneNode` 5 件成组落地；OK 件须先过 `b123-gate.mjs`。
- R01–R26 仍**都没有完成**；本批只是把 12 件落地为可维护源码，尚未接入运行时。
