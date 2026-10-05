# 第 163 批：整代升代第一步（T/R/S 对齐）与分类修正

> 承接 `docs/b162-video-domain-adjudication.md` §6 的三步走路径。本批执行**第一步（T+R+S）**，
> 同时修正 b162 中两处被实验推翻的初判。**已提交并双推**（2026-10-05，见 §9）。

## 1. 范围与口径

| 项 | 值 |
| --- | --- |
| 落地件 | b157 回滚的 12 件中的 **11 件**（排除受保护件 `src/components/aigenText/uiModule.js`，属第三步） |
| 暂存件 | `deobf-tools/b157/port/`（与 b161/b162 同源） |
| 落地脚本 | `deobf-tools/b163/land11.sh`（含备份到 `b163/backup/`）；回滚 `revert11.sh` |
| 基线 | `run-Znrjcn`：11193 / 11190 / 3 |
| **11 件落地、测试未改** | `run-vAeyQo`：**11147 / 11080 / 67**（净增 **64**） |

**跨件耦合体检**：11 件（不含受保护件）落地后失败数 = 12 件口径的 71 − uiModule 的 4 = 67，
**逐条对应、无跨件新失败**。说明「少落受保护件」不会污染其余域。

> 由此还纠正一处归属：b162 §3 把 #42（`outputScrollTop`）记在 `aigenText/uiModule.test.js`。
> 实测**不落 uiModule.js 时它依然失败**，故其因是 `aigenText/stateSyncModule.js`（本批已落），非受保护件。

## 2. 分类修正（b162 的两处初判被实验推翻）

### 2.1 #5 `APIMart omni-flash-ext` 是 **A（装配失配）**，不是 T

现象：`Gemini Omni 1.1 Flash Ext frame mode supports at most 1 image`（3 图无 `generation_type` 即抛）。

根因链：

- `vendorVideoModelApiShared.js`（0.7.16）里 `APIMART_VIDEO_OMNI_FLASH_BODY_MAPPING` **含** `APIMART_VIDEO_GENERATION_TYPE_ENTRY`；
- 但 `vendorVideoModelApiManifests.js`（仓库仍是 **0.4.12**）**本地重定义**了同名 mapping，**不含**该项；
- `apimart/omni-flash-ext` 走的是后者 → `generation_type` 恒为默认 `frame` → 3 图必抛。

佐证：镜像 `vendorVideoModelApiManifests.js` 中 `generation_type` 出现 **0 次**（已改用共享版），
而仓库版有 25 处本地定义。→ 必须与 `modelRegistry` 同批升代（与 b156 的 manifests 聚合层结论同构）。

**已顺手把测试改成前向正确**：`aiVideoApi.test.js` 的 dom17 补 `generation_type: 'reference'`
（当前不生效，闭包升代后即成为正确断言）。

### 2.2 `AIGenAudioNode` 整组（含 b162 记为 T 的 #17–20）是 **A**

现象：`audioRefs: []`（应为槽位数组）、文本引用未替换（`'旁白 @文本1 开场'` 原样）、
`validation.ok` 由 `true` 变 `false`（因音频槽为空而校验失败）。

根因：`src/modules/nodePromptShared.js` 仍是 **0.4.12**——其依赖面与镜像**完全不同**：

| | 引入的协作模块 |
| --- | --- |
| 镜像（0.7.16） | `mentionMenu.js`、`nodeEditorCommit.js`、`editableText.js`、`nodePromptPaste.js`、`promptMentionSelection.js`、`promptReferenceSignature.js` |
| 仓库（0.4.12） | `promptAssetInputRefs.js`、`promptPasteVirtualization.js` |

→ 引用/槽位采集链路整体未升代，**同域 #12–16 与本组同一根因**，须成组升代。

## 3. 本批已改（全部为「断言对齐到 0.7.16 实测值」）

| 文件 | 处 | 改动 |
| --- | --- | --- |
| `api/adapters/modelApiMappingEngine.test.js` | 1 | `data.imageSize` `2K` → `4K` |
| `api/aiImageApi.routing.test.js` | 2 | `dom13`/`dom17` `imageSize` `2K` → `4K` |
| `api/aiVideoApi.test.js` | 2 | `dom8.body.seed` `42` → `undefined`；dom17 补 `generation_type: 'reference'`（前向） |
| `src/components/video-node/taskOrchestrationModule.test.js` | 10 | 自适应比例组 7 例解析为具体比例 + `resolvedRatioLabel`／`happyhorse_mode` 3 例 |
| `src/components/video-node/parameterPanelModule.officialLabel.test.js` | 5 | 被删导出改从新模块 import + `store` 桩补 `getStateRaw/getState` + 标签 `RunningHUB模型` → `RunningHub模型` |

**为什么 `2K → 4K` 是真规格**：0.4.12 的 `GRSAI_NANO_BANANA_IMAGE_SIZE_SET = {'1K','2K'}` **忽略**
manifest 的 `allow4KSelection`；0.7.16 会尊重之（镜像 `allow4KSelection: true` 在案）。
`nano-banana-2` 用 SELECTOR 4K 策略 → 选 `4K` 被保留。

**为什么 `seed` 消失是真规格**：`volcengine/seedance-2.0` 无 `supportsSeedParam`
（只有 `seedance-2.5` 有）；`volcengineVideoModelApiManifests.js` 与镜像**逐字节一致**（仅 hex/dec）。

**为什么自适应比例是真规格**：`videoNodeAdaptiveAspectRatio.js` 与镜像**逐字节一致**（仅改名/hex），
解析结果即 0.7.16 真值；改变来自 0.7.16 的 `taskOrchestrationModule.js` 才走该链路。

### 3.1 #43 已解：被删导出只是「依赖搬家」

`parameterPanelModule.js` 升代后删掉 3 个导出，测试仍静态 import → ESM 整文件加载失败（吞 46 例）。
3 个导出在新模块中均**存在**：

| 被删导出 | 新址 |
| --- | --- |
| `resolveVideoPromptPlaceholder` | `video-node/parameterPanelPresentationPolicy.js` |
| `shouldShowVideoPromptInput` | 同上 |
| `buildVideoModelApiModelSelectionPatch` | `video-node/parameterPanelModelSelectionPolicy.js` |

改 import 源 + 修 2 处桩/标签后，该文件 **47/47 全绿**（不是功能回归）。

## 4. 验证

| 状态 | tests / pass / fail |
| --- | --- |
| 基线 `run-Znrjcn` | 11193 / 11190 / **3** |
| 11 件落地、测试未改 `run-vAeyQo` | 11147 / 11080 / **67**（净增 64） |
| 本批（11 件 + 13 处断言 + #43 修复）`run-mm5qVZ` | 11193 / 11138 / **55**（净增 **52**） |

`tests` 从 11147 回到 11193：`parameterPanelModule.officialLabel.test.js` 恢复加载，
其 46 个内部用例重新计入（47/47 全绿）。净失败 64 → **52**（−12：11 处断言 + 1 例文件级）。

逐文件定向复跑均通过（`modelApiMappingEngine` / `aiImageApi.routing` / `aiVideoApi` / 
`taskOrchestrationModule` / `parameterPanelModule.officialLabel` 全部改后重跑）。

## 5. 52 例逐条分类（T = 19 已改 / A = 33 登记）

判据：**产生该行为的源码件是否已是目标版本**——镜像件 prettier 后与仓库 diff，过滤 `_0x` 标识符名与
十六进制↔十进制差异。**一致 → T**（断言对齐到实际值）；**有实质差异 → A**（登记，待成组升代）。

### 5.1 T（19 例，已改断言并逐文件复跑通过）

| 文件 | 例数 | 要点 |
| --- | --- | --- |
| `src/components/SourceVideoNode.test.js` | 8 | 媒体加载**延迟化**（`preload:'none'`、不再同步 `load()`）；首帧就绪改由 **rVFC 呈现帧**门控 |
| `src/components/aigenImage/stateSyncModule.test.js` | 2 | 旧式 `_maybeResume*` / `_stopDreaminaRecovery` 收敛为统一 `resumeGeneration` |
| `src/components/aigenText/uiModule.test.js` | 1 | `_renderOutputText` 调用计数 `0 → 1` |
| `src/components/video-node/referenceInputModule.test.js` | 3 | 目标不再写 `btnEl.style.cursor`（镜像该文件 `cursor` 出现 **0 次**） |
| `src/modules/promptPresets.test.js` | 5 | 目标改用 `insertBefore/childNodes/firstChild/nextSibling` 复用 DOM（夹具补齐这些能力）；tab 数 `4 → 5`（镜像 `PRESET_MANAGER_TABS` 5 项） |

### 5.2 A（33 例，只登记不改）

| 组 | 例数 | 待升代的件 |
| --- | --- | --- |
| `api/aiVideoApi.test.js` | 3 | `vendorVideoModelApiManifests.js` + `modelRegistry` 聚合层（**同名遮蔽**，见 §2.1） |
| `src/components/AIGenAudioNode.test.js` | 12 | `modules/nodePromptShared.js` 引用链（见 §2.2） |
| `src/components/AIGenVideoNode.test.js` | 1 | `video-node/resultRenderModule.js`（缺 `_mustRenderTerminalVideoState`） |
| `src/components/SourceVideoNode.test.js` | 4 | `modules/videoKeyingTaskRuntime.js` + `videoToolbar` / `keyingAction`（`_rhTasks` 已被移除） |
| `src/components/video-node/referenceInputModule.test.js` | 2 | `modules/generationPromptPolicy.js`、`modules/fixedInputAssetRefs.js`、model registry |
| `src/components/video-node/taskOrchestrationModule.test.js` | 5 | `video-node/modelApiVideoSubmitCompiler.js`（时长/素材预校验改由它承担） |
| `src/modules/app/projectLifecycleRecovery.test.js` | 6 | **需产品/安全裁决**（见 §7.1） |

**两处"名实不符"的断言已收口**（避免把回归伪装成规格）：`播放首帧…隐藏封面层` 与
`paused video at first frame keeps poster fallback visible` 原判为夹具伪影 → 已补 `markVideoFramePresented()`
喂真实 rVFC 呈现帧信号，**恢复正向断言**；`clears stale running timer` 属真行为变更 → 用例名改为
`update 不再清理陈旧计时器（改由渲染/水合路径清理）` 并加一句注释。

## 6. 验证（全量 `run-IHSJsM`）

| 状态 | tests / pass / fail |
| --- | --- |
| 基线 `run-Znrjcn` | 11193 / 11190 / **3** |
| 11 件落地、测试未改 `run-vAeyQo` | 11147 / 11080 / **67** |
| 断言对齐前 `run-mm5qVZ` | 11193 / 11138 / **55** |
| **本批最终 `run-IHSJsM`** | **11193 / 11159 / 33**（另 1 skip） |

失败 **33 例逐条等于 §5.2 的 A 组**，无多无缺。基线 3 例 `installerSafety` 本轮在全量里**全过**
（单独跑才复现，属宿主/沙箱敏感），故 fail 由账面 36 落到 33，**非回归**。

QA 独立验证（`deobf-tools/b163/qa-report.md`）：受保护件 MD5 未变；11 件落地源码与 `b157/port`
**逐字节相同**、mtime 证明无源码被本轮再改；**对抗性抽查 4 条**（rVFC 门控 / `update` 不再清计时器 /
`cursor` 0 次 / tab=5）全部证实为真目标行为；**未发现掩盖回归，亦无有意义的断言被换成恒真**。裁定：**通过**。

## 7. 裁决与下一步（2026-10-05 收到裁决：不回退 / 提交双推 / 授权）

1. **恢复快照保护（6 例，`projectLifecycleRecovery`）—— 裁决「不回退」，判为能力回退缺陷**。目标版本不含
   `RECOVERY_SNAPSHOT_PROTECTED` / `UNSAFE_PROJECT_RECOVERY` / `writeRecoverySnapshotIfCompatible`
   （本仓 4 处、镜像 0 处），已按 0.4.12 语义移植回 0.8.0 结构，见 **§9.2**。
2. **时长/素材预校验（5 例，`taskOrchestration`）**：预校验已从该文件移出，改由未升代的
   `modelApiVideoSubmitCompiler.js` 承担 → 判 A，先升代再评估语义是否保留。
3. **A 闭包成组升代**（每组独立全量回归）：`nodePromptShared` 引用链、`resultRenderModule`、
   `videoKeyingTaskRuntime`、`modelApiVideoSubmitCompiler`、manifests 聚合层、preset 闭包。
4. **受保护件 `aigenText/uiModule.js`**：**已授权** → 单独成批 + 真机验证。
5. 本批 WIP **已提交并双推** `origin` / `luseabook`。

## 8. 复现

```bash
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b163/land11.sh   # 落地 11 件（含备份）
node tools/run-full-tests.mjs --js-only                        # 全量回归
bash C:/Users/luobote/.qoder/tmp/deobf-tools/b163/revert11.sh  # 回滚 11 件（测试改动需 git checkout 单独处理）
```

脚本（不入库）：`land11.sh`、`revert11.sh`、`edit-ratio.mjs`、`edit-ratio2.mjs`。

## 9. 裁决落实（164 批，2026-10-05）

三条裁决「不回退 / 提交双推 / 授权」的落地记录。

### 9.1 补齐去转义（本轮新发现）

b163 落地的 11 件里，有 **10 件带着混淆残留**：`src`/`api`/`electron` 全仓跑
`tools/deobf-unescape.mjs --numbers` 干跑逐条点名（转义 **1,031** 处 + 十六进制 **1,232** 处），
而其余 **3,107 件全部「无需改动」**——即 158b/159/160 三批清出的「零混淆残留」被本次落地打破。

处置：先备份到 `deobf-tools/b163/pre-unescape/`，对 10 件跑
`node tools/deobf-unescape.mjs --write --numbers`，再用
`node tools/deobf-unescape-verify.mjs --numbers <备份件> <现件>` **逐件校验 10/10 PASS**
（非字面量区逐字节、token 流、每个字面量解码值、文件不变长，四道检查）。之后全仓干跑回到
**0 件待改**，全量测试与去转义前逐条一致（无损）。

> 「避免任何混淆或压缩处理」是硬要求，故并入本批，未单独成批。

### 9.2 回移恢复快照防线

0.8.0 把 0.4.12 的 fail-closed 安全子系统整体拆掉（0.8.0 镜像**全仓 0 处**命中那三个标识）。
按裁决「不回退」，把它们移植回 0.8.0 的结构：

| # | 落点 | 回移内容 |
| --- | --- | --- |
| 1 | `restoreWorkspacePayloadFromShardRecords` | 严格位置化校验：坏 shard 判 `null`，不再被净化成空画布 |
| 2 | `V2LocalCache.load` | meta 存在但格式坏 → 抛出；legacy 分支补 `requireProjectDocument`；catch 一律 fail-closed |
| 3 | `run19`（读恢复快照） | `invalid`/`error`/`exists` 非布尔 → 抛出；不再自动删除旧恢复文件 |
| 4 | `initApp` | 两个持久化来源**都校验**（不再短路）；catch 清空工程身份并按 `UNSAFE` 分支换文案 |
| 5 | `run14`（写恢复快照） | 宿主无守门能力 → `{code:'RECOVERY_SNAPSHOT_PROTECTED', reason:'guard-unavailable'}` + 一次性警告 |
| 6 | `desktopBridge.project` | 补 `writeRecoverySnapshotIfCompatible` getter（宿主未实现时为 `undefined`，守门据此判「宿主太老」） |

另新增 `unsafeRecoveryError()` 统一错误码，并引入 `requireProjectDocument`。

### 9.3 验证

| 状态 | tests / pass / fail |
| --- | --- |
| 去转义后基线 `run-TITmeF` | 11193 / 11159 / **33** |
| **本批最终 `run-aTRsAJ`** | **11193 / 11165 / 27** |

失败 **33 → 27**（净 −6，正是 `projectLifecycleRecovery` 6 例复绿），余下 27 例逐条仍等于 §5.2 的
A 组，**零新增失败**。定向复跑：该件 **6/6**、相邻 `desktopBridge.test.js` **6/6**。

### 9.4 提交

已提交并双推 `origin` / `luseabook`（见 `docs/TRACKING.md` §11 的 164 条）。
