# 全量审查修复 · 交付说明

- 交付日期：2026-10-12
- 变更范围：`f1cffbd9`（本轮起点）→ `fd05c8da`（本轮终点），共 **25 个提交**
- 总变更：**31 个文件，+5152 / −2616 行**
- 依据：`test-artifacts/code-review-report.md`（2026-10-11 全量审查报告）
- 计划与明细：`docs/code-review-fix-plan.md`

---

## 1. 交付内容（按主题）

### P0 依赖安全（收敛）
| 项 | 结果 | 提交 |
| --- | --- | --- |
| `npm audit fix`（非破坏性）+ electron 同 major 升级 | 漏洞 **16 → 9**；electron `42.4.1 → 42.11.12` | `d0ab7c1f` |
| `extract-zip` 路径穿越（无官方修复） | 保留依赖，新增解包前校验 `electron/zipEntrySafety.js` | `d5def8ac` |
| P0 复核 | 9 项 = 1 high（extract-zip，已隔离校验）+ 8 moderate（仅 dev 构建链） | `fd05c8da` |

### 质量门禁（新增）
| 项 | 结果 | 提交 |
| --- | --- | --- |
| ESLint + Prettier + 覆盖率脚本 + CI 接入 | `lint` / `format:check` / `test:js:cov` 三个脚本，CI 加 ESLint 步骤 | `a9f13796` |
| 可达性脚本 + 防新增门禁 | 仓内重建 `tools/reachability.mjs`（scope 2066 / 可达 1893 / 孤立 173 / 断链 0），CI 加 Reachability 步骤 | `573a75fc` |

### 巨型文件拆分（批 6）
| 文件 | 行数变化 | 新模块 | 提交 |
| --- | --- | --- | --- |
| `src/modules/storyboard3d/editorWorkspace.js` | 6817 → 5217 | `editorLayoutMetrics.js`、`storyboard3DRenderHelpers.js` | `be2cf2d7` `6aca37cf` |
| `src/modules/personReplacement/personReplacementWorkspace.js` | 7187 → 6992 | `personReplacementWorkspacePresentation.js` | `d2b4a75b` |
| `src/modules/storyWorkspace/storyWorkspace.js` | 9495 → 9285 | `storyWorkspaceSharedHelpers.js`、`storyWorkspaceAssetPresentation.js`、`storyWorkspaceModelPickerPresentation.js` | `2940e7eb` `d983c20f` `810bccf3` |
| `src/modules/AssetManager.js` | 4719 → 4629 | `assetManagerHelpers.js` | `202fb2e8` |
| `api/storyGenerationApi.js` | 7677 → 7572 | `storyGenerationInputHelpers.js`（其余**存档为领域重写候选**） | `bb687c1e` |

拆分均**原样搬迁、不改行为**，对外导出面不变；每步用**临时 `no-undef` 配置**校验搬迁闭包（0 undefined）。

### 测试补齐（拆分前置安全网）
| 新增测试 | 覆盖 | 提交 |
| --- | --- | --- |
| `api/storyGenerationApi.test.js` | 分块/解析边界、缺字段、章节数/字数边界 | `73311883` |
| `src/modules/storyboard3d/editorWorkspace.test.js` | 4 个纯尺寸函数钳制 | `73311883` |
| `src/modules/AssetManager.test.js` | jsdom 导入 + 公开方法面 | `73311883` |
| `api/storyGenerationApi.episodeSplit.test.js` | 剧集拆分 5 个纯函数（9 项） | `abf96a7d` |
| `electron/zipEntrySafety.test.js` | ZIP 条目安全校验（8 项） | `d5def8ac` |

### 文档与工作区
| 项 | 提交 |
| --- | --- |
| `README.md` 重写为面向开发者文档 | `8e5804bd` |
| `docs/code-review-fix-plan.md`（复核 + 分级计划 + 执行进展 + 债务登记） | 多提交 |
| 恢复被误删的 `release_notes.txt` / `COMMERCIAL-LICENSE.md`（构建与更新说明仍引用） | `8e5804bd` |

---

## 2. 新增文件清单

| 类别 | 文件 |
| --- | --- |
| 安全 | `electron/zipEntrySafety.js`(+test) |
| 工具 | `tools/reachability.mjs`、`tools/check-reachability.mjs`、`tools/reachability-baseline.json` |
| 配置 | `eslint.config.mjs`、`.prettierrc.json`、`.prettierignore` |
| 拆分模块 | `storyboard3DRenderHelpers.js`、`editorLayoutMetrics.js`、`personReplacementWorkspacePresentation.js`、`storyWorkspaceSharedHelpers.js`、`storyWorkspaceAssetPresentation.js`、`storyWorkspaceModelPickerPresentation.js`、`assetManagerHelpers.js`、`storyGenerationInputHelpers.js` |
| 测试 | `api/storyGenerationApi.test.js`、`api/storyGenerationApi.episodeSplit.test.js`、`electron/zipEntrySafety.test.js`、`src/modules/AssetManager.test.js`、`src/modules/storyboard3d/editorWorkspace.test.js` |
| 文档 | `docs/code-review-fix-plan.md`、本文件 |

---

## 3. 验证证据（本机实测，终点状态）

| 门禁 | 结果 |
| --- | --- |
| `npm run test:js` | **11304 tests / 0 fail / 1 skip** |
| `npm run test:backend` | 223 OK（skip 3） |
| `npm run test:migrations` | PASS（17 表，重跑保留数据） |
| `npm run check:csp` | PASS |
| `npm run check:obfuscation` | PASS |
| `npm run check:package` | PASS（electron 42.11.12） |
| `npm run lint` | 0 error（52 warn 存量） |
| `npm run check:reachability` | OK（scope 2066 / 可达 1893 / 孤立 173，未退化） |
| `npm audit` | 9 项（1 high 无修复 + 8 moderate dev 链） |

---

## 4. 未做 / 风险（如实）

| 项 | 状态 | 说明 |
| --- | --- | --- |
| `api/storyGenerationApi.js` 拆分 | **存档** | 顶层「常量 → 工厂实例 → 函数」求值期依赖图，任何机械切口都触发 TDZ；需领域重写（§10） |
| 批 5 孤立模块接线 | 未做 | 需 0.7.16 镜像对照消费方才能接线；无镜像时只能删除（13 个真零引用，全是移植簇，故未删） |
| electron-builder 8 moderate | 不改 | 无可用修复版（仅 27-alpha），构建链不上 alpha |
| 批 2 innerHTML 收敛（411 处） | 未做 | 计划 §3.2 |
| ASAR / CSS 双轨 / console.log | 保留现状 | 经核实为有意设计或低价值高回归风险 |
| 未跑 | E2E / 桌面 / 真实模型调用 | 与审查报告口径一致（未覆盖项） |

---

## 5. 复现与验收

```sh
npm ci
npm test                    # 去混淆 + JS 单测 + CSP + 后端
npm run test:migrations
npm run check:package
npm run lint
npm run check:reachability
npm audit                   # 期望 9 项（1 high + 8 moderate）
```

> 注：electron 二进制若需重装且 GitHub release 下载受限，可设 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/` 后执行 `node node_modules/electron/install.js`。

---

## 6. 收口补记（2026-10-12 后半程）

> 本节覆盖 §1–§5 之后继续完成的工作；§1 的"范围/统计"是当时口径，最新口径见本节。

### 6.1 累计口径（终点）
- 提交：`f1cffbd9 .. 1917ece4`，共 **43 个提交**
- 变更：**75 文件，+7340 / −3794 行**
- 门禁（终点实测）：`test:js` **11313 / 0 fail / 1 skip**；`lint` **0 error**（45 warn 全在测试/工具）；`check:reachability` OK（scope 2073 / 可达 1902 / **孤立 171**）；`check:innerhtml` **346**；`check:css-budget` style.css 26765（= 预算）

### 6.2 巨型文件拆分（累计）
| 文件 | 原 → 现 | 新模块 |
| --- | --- | --- |
| `editorWorkspace.js` | 6817 → 5217 | `editorLayoutMetrics.js`、`storyboard3DRenderHelpers.js` |
| `storyWorkspace.js` | 9495 → 9285 | `storyWorkspaceSharedHelpers.js`、`storyWorkspaceAssetPresentation.js`、`storyWorkspaceModelPickerPresentation.js` |
| `personReplacementWorkspace.js` | 7187 → 6992 | `personReplacementWorkspacePresentation.js` |
| `AssetManager.js` | 4719 → 4629 | `assetManagerHelpers.js` |
| `storyGenerationApi.js` | 7677 → 7572（其余**存档**为领域重写候选） | `storyGenerationInputHelpers.js` |
| `WhiteboardNode.js` | 3933 → 3576 | `whiteboardNodeToolbar.js` |
| `storyAssetExperimentalApi.js` | 5048 → 4704 | `storyAssetSourceNormalization.js` |
| `audioVoicePanel.js` | 4213 → 3994 | `audioVoicePanelHelpers.js` |
| `RunningHubAiAppManager.js` | 3656 → 3606 | `runningHubAiAppHelpers.js` |

### 6.3 innerHTML 收敛（378 → 346）
按"先补等价测试、再改行为"的方式逐点收敛，累计 **-32 处**，并保留门禁防止回升：
- 27 处 `X.innerHTML = ''` → `clearElement(X)`（`src/utils/dom.js` 的 `clearElement` 增加 DOM 桩回退）
- refBar 骨架、Rh 换人固定槽、单图上传槽、manifest 固定槽空槽标签 → DOM 构造（新增 `refAttachmentButton.js#createPromptAttachmentButtonElement`、`refBarUiHelpers.js#createRefUploadSlot / createFixedEmptySlot / createUploadThumbSlot / appendRefUploadLabel` 等）
- 配套等价测试：`refBarUiHelpers.test.js`、`refAttachmentButton.test.js`、`stateSyncModule.uploadSlot.test.js`、`stateSyncModule.fixedSlots.test.js`
- **仍保留**：缩略图分支依赖共享 `thumbHTML` builder（已留 ponytail 注释）

### 6.4 lint 收紧（P1）
`eslint.config.mjs` 拆为 `strictInProduction` + `testRelaxed`：7 条规则（`no-dupe-keys` / `no-unreachable` / `no-cond-assign` / `no-empty-pattern` / `no-regex-spaces` / `no-misleading-character-class` / `no-compare-neg-zero`）在**生产代码**恢复 `error`，测试/e2e/tools 仍 `warn`。生产存量命中已清零（含 2 处重复键、1 处不可达块，及 3 处有意零宽/emoji 类的定向 disable）。

### 6.5 新增门禁（CI）
`check:innerhtml`（计数只降不升，基线 346）、`check:css-budget`（style.css 只减不增）、`check:reachability`（孤立模块不得新增，基线 171）。

### 6.6 孤立模块接线：**证伪，维持现状**
用 0.7.16 镜像做过一次接线分析（`test-artifacts/wire-probe.mjs` / `wire-apply.mjs`）：报告"48 个孤立模块在镜像里有已可达的消费方"，看似只差一行 import。但逐簇交叉验证（manifests 簇）发现：**镜像消费方来自另一代实现**（本仓同名文件自带等价常量/数组，并不缺那些 import），照补会**重复注册**。结论：
> 孤立模块清零**不能靠机械接线**，需要按簇做产品判断；reachability 门禁已保证**不再增长**（本次入口集修正另使孤立由 173 降至 171）。

（这两个探针脚本位于被 gitignore 的 `test-artifacts/`，不影响仓库。）

### 6.7 明确不做（经核实的取舍）
ASAR 保持 `asar:false`、`debug`/`once` 重复依赖不动、`storyGenerationApi.js` 其余部分存档为领域重写候选、测试 warn 不硬清。
