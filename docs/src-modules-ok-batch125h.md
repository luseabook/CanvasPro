# 125h：`src/modules` OK 队列第 3 组落地记录

> 本专题记录 OK 队列第 3 组的成组落地。判据同前两组：每件模块的相对 import 目标都能在本仓找到，且导出闸门 `MISSING_TOTAL=0`。**全部落地不接线**：从入口沿相对 import 走不到它们，运行时行为、UI、联调一概未变；本批没有提交、没有推送。
>
> 第 1 组（125f）见 `docs/src-modules-ok-batch125.md`，第 2 组（125g）见 `docs/src-modules-ok-batch125g.md`。本组是 125g 专题 §6 预筛出来的「14 件候选里的 10 件可落件」。

## 1. 第 3 组：落地清单

| # | 模块 | 字节 / 行 | SHA256 前 12 | 测试数 |
| --- | --- | --- | --- | --- |
| 1 | assetPackageMedia | 9764/253 | bf398e31e528 | 8 |
| 2 | audioVoiceLocalAsrRuntime | 4390/102 | 731dae744074 | 7 |
| 3 | audioVoicePanelGenerationFeedback | 2451/55 | a1aa7555d193 | 7 |
| 4 | audioVoicePanelPickSession | 17624/425 | 6ca3a4b20cf6 | 10 |
| 5 | audioVoicePanelSegmentState | 10189/231 | d6848a7c3b41 | 11 |
| 6 | audioVoicePlaybackSession | 9962/250 | e7275737a8f6 | 9 |
| 7 | audioVoiceTranslation | 7536/155 | 5b964c22b8e5 | 6 |
| 8 | canvasProjectSaveTransaction | 2245/53 | 0a853af9e3f1 | 9 |
| 9 | collaboration/collaborationInvitation | 5573/129 | 394985787062 | 9 |
| 10 | collaboration/collaborationMembers | 8582/193 | 1d3bc2af5773 | 7 |

合计：10 件（源 78 316 字节 / 1846 行；测试 77 526 字节 / 1870 行，共 83 例）。

## 2. 第 3 组：依赖与闸门

- 闸门 10/10 `MISSING_TOTAL=0`，共核对 26 条具名导入/再导出全部命中（证据 `b125h-gate.txt`）。
- 相对依赖全部已在 0.7.16 基线：`api/localMediaTaskApi.js`、`api/userSettingsApi.js`、`api/utils/strictJson.js`；`src/services/` 的 `canvasProjectAccess`、`completionNotificationService`、`completionSoundService`、`desktopBridge`、`desktopMediaBlobSource`、`fileService`、`audioMetadataService`；`src/utils/localMediaPath`；`src/i18n/index`；`src/components/sharedIconMarkup`；组内 `collaboration/collaborationSelect`、`collaboration/collaborationMemberColor`、`collaboration/collaborationNicknameEditor`、`audioPlaybackCoordinator`、`cursorUtils`。
- prettier 暂存核对：本机 prettier 3.9.8 + `deobf-tools/prettierrc.json`，镜像格式化产物与仓库文件 **10/10 逐字节相同**（暂存目录 `deobf-tools/b125h/port/`）。
- `node --check` 20/20 通过（10 实现 + 10 测试）。
- bare node 下 `import` 10/10 成功，无顶层 DOM 副作用（`audioVoicePanelPickSession`、`collaborationInvitation`、`collaborationMembers` 触达 `document`，但都走注入的工厂或惰性取用）。

## 3. 第 3 组：冻结行为与接入契约

1. `assetPackageMedia`
   - 主要导出：`upsertImageAssetPackage`、`upsertMediaAssetPackage`（音频分支走内部 `upsertAudioAssetPackage`）。
   - 冻结行为：四项必填（`packageKey`、`packageName`、`itemKey`、`itemName`）trim 后为空即抛「加入素材包失败：缺少素材包标识/名称/素材标识/素材名称。」；图片无可用地址抛「…图片缺少可用地址。」，音频同理。图片节点固定 `type: 'source-image'`，音频固定 `source-audio`；节点合并顺序是「既有节点 → 图片/音频对象 → itemMetadata」，所以后两者能覆盖既有字段，但 `id` 只在既有节点有 id 时保留、否则用 `createId('source-image'/'source-audio')` 现生成。`x`/`y` 只在新建时按 4 列网格给出（`(i%4)*552`、`floor(i/4)*328`；音频 `(i%4)*360`、`floor(i/4)*180`），有既有节点就沿用其坐标。`src`/`imageUrl`/`audioUrl` 用「displayUrl → imageUrl/audioUrl → url → src → localPath 转 URL → sourceUrl → originalUrl」的先后顺序取首个非空。条目按 `packageItemKey`（或既有 `nodeData.assetPackageItemKey`）匹配后原地更新，返回 `{ asset, item, itemIndex, packageCreated, itemCreated }`；入参包对象不被就地改动（items/nodes/edges 都是浅拷贝）。
   - 接线时须接素材包「加入素材包」入口（画布节点右键与素材库）。
2. `audioVoiceLocalAsrRuntime`
   - 主要导出：`AUDIO_VOICE_ASR_RUNTIME_INSTALL_TIMEOUT_MS`（5 400 000 ms = 90 分钟）、`createAudioVoiceTaskProgressTracker`、`ensureAudioVoiceLocalAsrRuntime`、`isAudioVoiceLocalAsrRuntimeFailure`、`prepareAudioVoiceLocalAsr`、`repairAudioVoiceLocalAsrRuntime`。
   - 冻结行为：引擎归一只有 `gpu`/`cpu` 两种（`trim().toLowerCase()` 严格等于 `gpu` 才算 gpu）。`ensure` 入队固定 `kind: 'asrRuntimeInstall'`，`args` 恒带 `engine`，只有 `forceRepair === true`（严格）才补 `forceRepair`；宿主没回非空 `taskId` 抛「Subtitle recognition runtime task did not return a task ID」，且**不进入等待**；有 taskId 才先 `onTaskStarted(id)` 再 `waitForTask(id, { timeout, diagnosticPayload: { kind, nodeId } })`（默认超时即上面那个常量）。失败识别用一条大正则覆盖 `python runtime is unavailable`、`funasr runtime is not bundled`、`nvidia nemo is not installed`、`sortformer runtime is unavailable`、`no module named`、`modulenotfounderror`、`importerror`、`dll load failed`、`cannot import name`、`specified module could not be found`；入参可以是错误对象（取 `message`）或字符串。`prepare` 从设置 `subtitleRecognition.engine` 读引擎并保证运行时就绪，返回固定 `{ diarizationProvider: 'sortformer', downloadModelIfMissing: true, engine }`；`repair` 同一来源但强制 `forceRepair: true`；两者读取设置失败都静默回落 `cpu`。`createAudioVoiceTaskProgressTracker().install(taskId, { progressOffset, progressScale })` 只认 taskId 完全相同的事件，进度 = `clamp(offset) + clamp(progress) * clamp(scale)`（三个 clamp 都是 `[0,1]`，非有限数按 0），重复 install 会先卸载上一次。
   - 接线时须接语音工作室「识别字幕」前的运行时装机与失败修复链。
3. `audioVoicePanelGenerationFeedback`
   - 主要导出：`summarizeAudioVoiceGenerationResults`、`buildAudioVoiceGenerationCompletionMessage`、`notifyAudioVoiceGenerationComplete`。
   - 冻结行为：汇总只把 `status === 'fulfilled'` 且内部 `value.status` 为空或等于 `success` 的结果算成功；`total` 取「数组长度」与「入参 total 截断后」的较大值且不接受负数。完成文案三分支：`incomplete > 0` → 批量结算文案；否则 `total === 1` → 单条完成文案，其余 → 批量完成文案。`total` 下限是 1（非法值等同单条）；`incomplete` 只有**不是有限数**时才补算 `total - succeeded`，显式传 0 就是 0。`notify` 只在 `succeeded > 0` 时放提示音（`playSound('generation-success')`），通知始终发出（`showNotification({ body })`），两条都包在 `Promise.allSettled` 里，任何一条抛错或拒绝都不会让函数 reject。
   - 接线时须接语音生成批次的完成提示宿主（toast + 提示音）。
4. `audioVoicePanelPickSession`
   - 主要导出：`AUDIO_VOICE_BATCH_AUDIO_PICK_ID`（`'__audioVoiceSelectedSegments__'`）、`isAudioVoiceVideoNode`、`isAudioVoiceAudioNode`、`isAudioVoiceSourceNode`、`resolveAudioVoiceSelectionTargetIds`、`createAudioVoicePanelPickSession`。
   - 冻结行为：节点类型判定按**小写白名单**严格匹配（video/audio 各三种，source 为两者并集），非字符串类型归假。目标解析：点中的 id 等于批量哨兵时返回「选中集合 ∩ 句子清单」；点中的 id 在选中集合里且交集多于一条时同样返回交集；否则该 id 在句子清单里就返回单元素数组，不然返回空数组。会话两个状态机互斥：进源节点选择会先关掉音频选择并关掉 store 里另一种连线模式，进音频选择同理。进入时若目标为空提示「先选句子」，若存在不支持参考音频的句子提示「不支持声音克隆」；再次点击同一句等于取消。应用参考音频要求 `applyAudioReference` 返回非空 `appliedIds` 才算成功，成功才提示（多条走批量文案）并退出选择态，失败则留在选择态并回传原因。`stopAll` 是静默收尾（不弹提示），`destroy` 再额外断开 DOM 观察器；两者都幂等。
   - 接线时须接语音工作室的「选择参考音频 / 选择音源节点」两个入口。
5. `audioVoicePanelSegmentState`
   - 主要导出：`firstNonEmptyString`、`resolveSegmentLocalAudioUrl`、`normalizeAudioVoiceHistory`、`buildAudioVoiceHistoryEntry`、`prependAudioVoiceHistory`、`prependAudioVoiceHistoryEntries`、`createAudioVoicePayloadError`、`getVisibleAudioVoiceSegments`、`normalizeAudioVoiceSegmentModelSelection`、`cloneAudioVoiceSegment`、`createAudioVoiceSegmentAfter`。
   - 冻结行为：历史条目按 `localPath + '::' + audioUrl` 去重（保留先出现的），按 `createdAt` 倒序后**截前 5 条**；没有可用地址的条目直接丢弃。`buildAudioVoiceHistoryEntry` 没地址返回 `null`，有时间戳则用时间戳生成 `audio-voice-history-<ts>-<rand>` 形式 id。模型选择模式只有 `segment`/`global` 两种（大小写与空白容错）；显式给模式就照做，未给时若 `voiceModelId` 等于默认模型且存在生成记录（`isGenerating`、`status: generating`、有开始时间、有 `rhTaskId`，或历史里出现过同模型）则判为全局模式并把 `voiceModelId` 清空，否则按段落级。`cloneAudioVoiceSegment` 只认严格 `true` 的布尔字段，`generationDuration` 与 `jobError` 保留 `null`/`undefined` 语义，`activeAudio` 只有 `'converted'` 才算替换音轨，`sourceAudioReady` 有源地址即真；新增句子 `id` 形如 `segment-<ts>`，状态默认 `detected`。`createAudioVoiceSegmentAfter` 无下一句时给 `endMs + 1500`，有下一句时取「`endMs + 200`」与「`endMs` 与下一句起点的中点」的较大值。
   - 接线时须接语音工作室的段落列表与音轨状态宿主。
6. `audioVoicePlaybackSession`
   - 主要导出：`prepareAudioVoicePlaybackElement`、`isAudioVoicePreviewControlTarget`、`createAudioVoicePlaybackSession`。
   - 冻结行为：预览控件只认 `data-audio-voice-action` 为 `play-source`/`play-converted`/`play-history` 之一。`prepare` 在缺元素或地址为空时直接返回空串且不碰 `src`；`preload` 只在 `auto`/`metadata` 间取，一旦元素曾经要过 `auto` 就不再降级；有 `attachSource` 时交给它，返回真值且要过 `auto` 时再补一次 `load()`；没有 `attachSource` 时走 `shouldAssign` 守卫再直写 `src`。会话内部按规范化地址缓存音频元素（默认上限 16，可配），超限淘汰最旧且**不淘汰正在播放的那个**，淘汰时清 `src`、清元数据并把 `preload` 置 `none`。`play` 返回 `{ status, audioEl }`，状态取值 `missing`/`unavailable`/`stale`/`playing`/`failed`；每次播放自增序号，异步过程中被顶替或销毁就返回 `stale`，不会误当成功。`stop` 暂停当前元素（没有活动元素时不重复调 `pause`），`destroy` 先暂停再逐个释放缓存并封死后续分配。
   - 接线时须接语音工作室的试听按钮与音频元素宿主。
7. `audioVoiceTranslation`
   - 主要导出：`AUDIO_VOICE_TRANSLATION_LANGUAGES`（冻结 8 项：`zh-CN`/`en`/`ja`/`ko`/`es`/`fr`/`de`/`pt`）、`classifyAudioVoiceTranslationConfigFailure`、`getAudioVoiceTranslationLanguage`、`resolveAudioVoiceTranslationTargets`、`buildAudioVoiceTranslationPrompt`、`createAudioVoiceTranslationStructuredOutput`、`parseAudioVoiceTranslationResult`。
   - 冻结行为：配置失败分类返回 `missing`（提示里出现「api key 未配置/missing」）、`invalid`（`AUTH_ERROR`/`FORBIDDEN`/`MODEL_UNAVAILABLE` 或提示里出现 key 失效、未授权、模型未开通等）、或空串（网络类错误）。目标解析先剔除 `status === 'removed'` 的句子，再按选中集合过滤；选中集为空或等于全量时 `scope` 为 `all`，否则 `selected`；没有文本的句子不进候选。提示词里嵌目标语言与句子 JSON（**紧凑无空格**），非法语言抛「不支持的目标语言。」，没有可翻译句子抛「没有可翻译的句子文本。」。结构化输出固定 `name: 'audio_voice_translation'`、`strict: true`、`fallback: 'prompt'`，`translations` 的 `minItems`/`maxItems` 等于句子数、`id` 用枚举限定。解析结果要求条数与 ID 集合都完整：数量不符、未知 ID、重复 ID、空译文、缺 ID 各有独立文案；入参是 `{ text }` 对象时取 `text` 解析。
   - 接线时须接语音工作室的翻译面板与模型请求宿主。
8. `canvasProjectSaveTransaction`
   - 主要导出：`captureCanvasProjectSaveTransaction`、`commitCanvasProjectSave`、`releaseCanvasProjectSave`。
   - 冻结行为：`capture` 先跑 `assertCanvasProjectSaveAllowed`（遍历 `multiData.canvases`，`canSave === false` 就抛 `PROJECT_SAVE_FORBIDDEN`），再冻结一份事务：随机 `Symbol` 作 token、当前活动画布 id、工程上下文（优先 `manager.getCanvasProjectContext(canvasId)`，否则用调用方给的默认值）、原画布名与保存检查点（`rename` 为真时把 `exportSource.projectName` 带进检查点）。同一 manager 同一画布后发的快照会顶掉先发的：`commit` 与 `release` 都只在 token 仍是该画布最新时才生效，所以旧事务提交直接返回 `false`，不会写坏状态。`commit` 成功路径固定为「释放自己 → 写工程上下文 → 必要时改名（仅当画布名仍等于快照时的名字）→ 标记干净（带检查点）→ 重绘标签页」，返回 `true`。
   - 接线时须接画布工程保存入口（替换 `CanvasTabManager` 里手写的保存流程）。
9. `collaboration/collaborationInvitation`
   - 主要导出：`createCollaborationInvitation({ root, element, button, input, actions, getState, feedback })`，返回 `{ setBusy, invalidate, close, render }`。
   - 冻结行为：权限按钮在「可编辑/只读」间切换并写 `aria-pressed`，切换、有效期变更、地址变更都会作废已取到的邀请（清空输入并把按钮文案退回「获取邀请」）。按钮文案 `获取邀请` 与 `复制邀请` 是状态机：输入为空时调 `actions.invite(role, hostAddress, expiry)` 取新邀请并回填；输入非空时调 `actions.copy(value)`。取邀请前记录当时的 `roomId` 与失效计数，返回后若两者变了就抛「邀请设置已变化，请重新获取邀请」（避免把过期邀请写进输入框）。`render` 只让 `owner`/`admin` 看见整块内容；`roomId` 或 `role` 变化会作废旧邀请并收起局域网折叠区；`hosting` 为假时隐藏地址区；`hostAddresses` 变化会重建下拉，为空时插入「未发现局域网地址，仅限本机测试」占位项，且能保留用户已选的地址。`setBusy` 只切按钮 `disabled`。
   - 接线时须接协作面板的邀请区宿主。
10. `collaboration/collaborationMembers`
    - 主要导出：`onlineCollaborationActors`、`createCollaborationMembers({ root, element, button, run, actions, confirmAction, getState })`，返回 `{ render, close, destroy }`。
    - 冻结行为：在线判定 = presence 里未过期（`expiresAt * 1000 > now`，无 `expiresAt` 视为永久）的 actorId 集合，再加上自己（条件是会话存在且 `status` 不是 `offline`/`blocked`）。`render` 用「房间 + 自己 + 角色 + 成员表」的 JSON 串做缓存键，键没变就不重建行，只更新在线点与跟随按钮；成员离场时会先销毁其权限下拉与昵称编辑器再摘掉行，成员顺序与成员表一致。可管理判定：非自己、非房主，且（当前是房主，或当前是管理员且对方不是管理员）——只有可管理时才给权限下拉与移除按钮，否则只显示角色文案；跟随按钮对非自己成员一律出现，离线时禁用，`followActorId` 指向自己时文案变「中止跟随」。`destroy` 只解绑权限与昵称控件并清空缓存表，**不摘行**（行由下一次键变化的 `render` 重建）。
    - 接线时须接协作面板的成员列表宿主。

## 4. 第 3 组：验证结果

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 导出闸门 | 10/10 `MISSING_TOTAL=0`（26 条命中） | `b125h-gate.txt` |
| prettier 逐字节 | 10/10 与 prettier(镜像) 相同 | `b125h/port/` |
| `node --check` | 20/20 通过 | 本机实跑 |
| bare node 导入 | 10/10 成功、无顶层 DOM 副作用 | 本机实跑 |
| 本组单测 | 83 / 83 / 0 | 本机实跑 |
| src 全量回归 | 6580 / 6537 / 43（125g 后为 6497/6454/43） | `b125h-src-raw.tap` |
| src 失败名单 | 43 项与 `b85-fails.txt` 逐条相同，新增 0 消失 0 | `b125h-fails.txt` |
| api 全量回归 | 791 / 791 / 0（未变） | `b125h-api-raw.tap` |
| 消费方反查 | 真实命中 0（仅匹配到 10 个模块自身） | 本机扫描 |
| 受保护文件 | `api/freeImageHostApi.js` 未被触碰 | 本批只新增文件 |

首跑记录：本组 10 个测试文件首跑 83 例中 13 例失败，全部定为**测试侧期望问题**（测试数据漏字段、把「stopAll 静默」误当成会提示、把「键未变不重建」误当成会重建、把 DOM 假件的 `createElement` 参数写漏），逐条改正后复跑 83/83 全绿，**未改动任何移植实现**。

## 5. 第 3 组：未执行项与边界

- 本体未接线：10 件都没有接入任何入口，从入口沿相对 import 走不到，运行时零影响。
- 未跑变异测试。前两组（125f/125g）也没有做完整变异收口以外的额外验证。
- 已知边界（不改移植实现，仅记录）：`audioVoicePanelSegmentState.normalizeAudioVoiceHistory` 传入 `null` 条目会抛 `TypeError`（`undefined` 有其他分支兜底）；`collaborationMembers.destroy` 不会摘掉已渲染的行。
- 未启动应用、未构建、未联调、未提交推送。
- 两个协作模块的测试用最小 DOM 假件驱动（`document.createElement`、`crypto.randomUUID` 等由测试内注入并在结束后还原），**不代表真实浏览器行为已验收**。

## 6. 第 3 组：收尾与下一段

- 本批落地不接线，代码与 `docs/tracking/` 只做记录，不提交不推送。
- 同批候选里另有 3 件受阻，已并入 `docs/TRACKING.md` §7.3：`app/appTopbarCustomProviderPolicy` 缺 `../subscriptionAccess.js :: CUSTOM_PROVIDER_VIP_MODEL_ID`；`assetCoverResolver` 缺 `../services/canvasMediaLocalService.js :: resolveCanvasVideoDisplayUrl` **与** `:: resolveCanvasVideoPosterUrl`；`cliLoginMissingToast` 缺 `./settings/panelSettings.js :: openSettingsPanelToField`。
  - 更正：本专题初版把 `characterAssets/characterAssetImageGeneration` 也列为受阻件，2026-09-28 用闸门逐件复核后确认它 `MISSING_TOTAL=0`、属**可落**件，此前的归因来自把两条 `MISSING` 行误配到不同模块。
- 下一段转 **OK 队列第 4 组**，从余下约 41 件可落件里按能力区成组取件。
- R01–R26 未完成，仍待后续批次逐条清账。
