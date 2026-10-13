# 全量审查问题修复计划

> 来源：`test-artifacts/code-review-report.md`（审查日期 2026-10-11，只读审查）。
> 本计划日期：2026-10-12。制定前已对报告每一条**重新取证**，现状与报告口径的差异在 §0 标注。
> 性质：**计划文档**，尚未执行任何修复。执行时遵循仓库 `AGENTS.md`：先读再改、逐项验证、不擅自扩大范围。

---

## 0. 复核结论（报告项 vs 当前实测）

| # | 报告项 | 报告级别 | 当前实测 | 状态 |
| --- | --- | --- | --- | --- |
| A | npm 漏洞 | 高（报告称 4 个） | **`npm audit` 实测 16 个：8 high / 8 moderate / 0 critical** | **未修，且范围大于报告** |
| B | 孤立模块 | 高（127） | 127（口径 1991，断链 0），但**重算脚本已不在仓库** | 未修，且无法按文档重算 |
| C | 巨型文件 | 高 | 复核行数见 §3（`storyWorkspace.js` 9495 等） | 未修 |
| D | 无 lint / 覆盖率 | 中 | 确认：仅 `.editorconfig`，无 ESLint/Prettier/Biome/Stylelint；无 c8/nyc | 未修 |
| E | CSS 双轨 | 中 | `style.css` + `styles/` 41 个 css 并存 | 未修 |
| F | innerHTML 411 处 | 中 | 实测 411（src 非测试） | 未修 |
| G | console.log 噪音 | 低 | 复核：JS 源码 ≈11–16 处，Python 0 处（报告 130 含测试/更宽口径） | 未修，量小 |
| H | 未启用 ASAR | 低 | 确认 `electron-builder.win.cjs:8` `asar: false` | 未修 |
| I | 3 处未提交改动 | 低 | `D COMMERCIAL-LICENSE.md`、`D release_notes.txt`、`M README.md` | 未处理 |

> 结论：审查问题**均未修复**；其中 P0 依赖安全的实际面（16 项）比报告更大。

---

## 1. P0 — 生产依赖安全（16 个漏洞）

### 1.1 实测清单

生产/开发依赖链现状（`npm ls`）：

```
canvas@0.4.12
├─ dependencies: electron-updater@6.8.9, extract-zip@2.0.1, yazl@3.3.1
└─ devDependencies: electron@42.4.1, electron-builder@26.15.3, jsdom, knex, better-sqlite3, @playwright/test
```

| 包 | 严重度 | 关系 | 修复可用性 | 归属链 |
| --- | --- | --- | --- | --- |
| `extract-zip@2.0.1` | high | 直接生产依赖 | **无修复版** | 直接依赖（symlink 路径穿越） |
| `js-yaml@4.3.2` | high | 传递 | 有 | `electron-builder`(dev) + `electron-updater`(prod) |
| `electron-updater` | high | 直接 | 有 | 直接依赖 |
| `builder-util-runtime` | high | 传递 | 有 | electron-builder 链 |
| `http-cache-semantics` | high | 传递 | 有 | electron-updater 链 |
| `source-map-js` / `undici` | high | 传递 | 有 | dev 链 |
| `@electron/get`/`app-builder-lib`/`dmg-builder`/`global-agent`/`roarr`/`sprintf-js` | moderate | 传递 | 需 electron-builder 升级 | dev 链 |
| `electron` | high | 直接(dev) | 有（同 major：42.4.1 → 42.11.x） | 直接依赖 |

### 1.2 修复步骤（分三档，风险递增）

**A 档 · 自动可修（低风险）**
1. `npm audit fix`（**不加 `--force`**）。
2. 预期消解：`js-yaml`、`undici`、`source-map-js`、`http-cache-semantics`、`builder-util-runtime`、`electron-updater`。
3. 验证：`npm audit` 复查剩余项；`npm test`（四道门禁）；`npm run check:package`。

**B 档 · electron 同 major 升级**
1. `electron` `42.4.1` → 审计建议的 `42.11.x`（同 major，非破坏）。
2. 验证：`npm run test:desktop` + `npm run verify:startup` + `npm run check:package`。

**C 档 · electron-builder 升级（破坏性）**
1. 审计建议 `electron-builder@26.5.0`，但**当前已装 26.15.3 高于该建议值**——需人工核实最新版与实际 advisory 区间，不要盲信 `npm audit` 的建议版本。
2. 升级后重跑 `npm run check:package` 与 `npm run build:win`（本地不发布、不签名）。
3. 风险：打包产物结构变化、`extraResources`/`files` 白名单需复核。

**D 档 · `extract-zip`（无官方修复，需替换）**
- 两处生产用法：
  - `electron/projectPackageService.js`（工程包 `.aicpkg` 解包）
  - `electron/mediaTasks/asrRuntimeInstallTask.js`（ASR 运行时安装包解压）
  - 测试：`electron/nodeExportService.test.js` 用其做 ZIP 往返校验
- 方案（比 1.3 的"加固"更彻底）：
  1. 改用已在依赖树中的 **`yauzl`**（`extract-zip` 的底层）直接解包；
  2. 逐条在**落盘前**校验：拒绝符号链接/硬链接、目录穿越、重复或大小写冲突条目、超清单条目（`projectPackageService` 已有类似校验，先确认复用面）；
  3. 两处都核对现有校验，只在缺校验处补齐；
  4. 完成后从 `package.json` 移除 `extract-zip`，`npm audit` 应少一项 high。
- 备选方案（若替换风险过高）：保留 `extract-zip` 但在调用侧强制"解到隔离临时目录 + 白名单条目 + 逐字节校验后再搬运"，并以 `ponytail:` 注释记录该风险上限。
- 验证：`electron/**` 相关单测（尤其工程包往返、`asrRuntimeInstall`）+ `npm test`。

### 1.3 验收门槛
`npm audit` 归零，或仅剩"无修复版且已用隔离校验缓解"的项（需在本文附录记录）。

---

## 2. P1 — 架构债

### 2.1 孤立模块 127（接线 or 删除）

- 现状：`docs/tracking/orphans.md` 记 `scope 1991 / 可达 1864 / 孤立 127 / 断链 0`。
- **阻塞点**：文档所依赖的重算脚本 `deobf-tools/b126/reach.mjs` **已不在仓库**；`tools/porting-wiring-plan.mjs` 依赖外部路径 `C:/Users/luobote/.qoder/tmp/`（mirror + `reach-orphans.json`），仓内不可复现。
- 计划：
  1. **先恢复可复现性**：把 reachability 遍历脚本重新纳入 `tools/`（不依赖外部 mirror），能把 127 这个数字重算出来，作为后续改动的基线。
  2. **防膨胀（先做）**：CI 增加"孤立模块数不得增加"的门禁（基线白名单），杜绝继续膨胀。
  3. **分类处置**（可分批）：
     - **有明确消费方**（`objectPath` 在 mirror 中存在可达 importer）→ 按 `tools/porting-wiring-plan.mjs` 给出的精确 import 边接线；
     - **纯遗留/重复**→ 删除；
     - 按目录分批：`electron/`(17)、`src/modules/`(12)、`src/manifests/video/modelApi/`(11)、`api/adapters/`(9)、`src/components/aigenImage/`(9)……
  4. 每批次后重算 reachability 并同步 `docs/TRACKING.md` §5 计数。
- 需决策：本期目标是"冻结基线"还是"逐簇清零"。（建议先冻结，再按目录分批）

### 2.2 引入 lint + 覆盖率

- 现状：无任何 lint/format 配置；`test:js` 为 `node --test`，无覆盖率。
- 计划：
  1. 加 **ESLint（flat config）+ Prettier**，**仅对新增/改动文件生效**（存量不重排，避免 40 万行噪声 diff）。
  2. 可选 Stylelint（与 §2.3 CSS 双轨一并处理）。
  3. 加覆盖率上报：`node --test --experimental-test-coverage` 或 `c8`，输出到 `coverage/`（加入 `.gitignore`）。
  4. 接入 `.github/workflows/ci.yml`：lint 作为一道非阻塞→阻塞渐进门禁。
- 验证：`npx eslint <changed files>` 通过；覆盖率报告可生成。

### 2.3 CSS 双轨

- 现状：`style.css`（单文件）+ `styles/` 41 个模块 css 并存。
- 计划：确定单一约定（建议"新样式一律进 `styles/`，`style.css` 只做聚合"），加一条 lint/约定检查防回退；存量不做一次性大搬迁。

---

## 3. P2 — 巨型文件与 innerHTML

### 3.1 巨型文件拆分（复核行数）

| 文件 | 行数 |
| --- | --- |
| `src/modules/storyWorkspace/storyWorkspace.js` | 9495 |
| `api/storyGenerationApi.js` | 7677 |
| `src/modules/personReplacement/personReplacementWorkspace.js` | 7187 |
| `src/modules/storyboard3d/editorWorkspace.js` | 6817 |
| `src/modules/AssetManager.js` | 4719 |

- 计划：**纯搬迁式拆分**（不改行为、不改导出面），每拆一步即跑该文件对应 `*.test.js`。优先 `storyWorkspace.js`、`storyGenerationApi.js`。
- 风险：巨型文件多为单职责过载，拆分需先补"公开接口"清单，避免拆出新的循环依赖/孤立模块（与 §2.1 联动校验）。

### 3.2 innerHTML 收敛（411 处）

- 现状：411 处（src 非测试），集中在 `storyWorkspace.js`(34)、`AssetManager.js`(23)、`AIGenAudioNode.js`(22)。
- 计划：逐点确认插值来源；用户数据/可注入内容一律改 `textContent` 或统一走 `escapeHtml`/`sanitizePromptHtmlForCommit`；静态模板保留但加注释说明来源可信。
- 验证：改动点补/跑相关单测；`npm run check:csp` 保持 PASS。

---

## 4. P3 — 清理

| 项 | 现状 | 计划 |
| --- | --- | --- |
| 未提交改动 | `D COMMERCIAL-LICENSE.md`、`D release_notes.txt`、`M README.md` | ⚠ 见下方风险，**先核实再决定提交/恢复** |
| `console.log` | JS ≈11–16 处 | 逐处改为 debug/移除；量小，可一并做 |
| ASAR | `asar: false` | 评估启用 ASAR（注意原生模块与相对路径访问），单独一次打包验证后再定；**不在其他批次顺带改** |

**⚠ 未提交删动的风险（已取证）**：
- `release_notes.txt` 被 **`electron-builder.win.cjs:36`（`files` 白名单）**、**`electron/main.js:1967`（`readFileSync`）**、`backend/services/hot_update_service.py` 引用 —— 直接删除会破坏打包清单与更新说明读取。
- `COMMERCIAL-LICENSE.md` 被 `tools/run-full-tests.mjs` 的根文件检查列表引用。
- 处置二选一：**恢复文件**，或**同步修改上述引用后**再删除。二者都必须过 `npm run check:package` 与 `tools/run-full-tests.mjs`。
- `M README.md` 是本会话的开发者版 README 重写，确认后单独提交。

---

## 5. 执行顺序（建议批次）与验证矩阵

建议顺序（每批独立可验证、可回滚）：

1. **批 1（P0-A/B）**：`npm audit fix` + electron 同 major 升级 → 门禁全绿。
2. **批 2（P0-D）**：`extract-zip` 替换为 yauzl + 校验 → 相关单测 + `npm test`。
3. **批 3（P3 未提交改动）**：核实/恢复 `release_notes.txt`、`COMMERCIAL-LICENSE.md`；提交 README。
4. **批 4（P1-2.2）**：ESLint+Prettier+覆盖率 + CI 接入。
5. **批 5（P1-2.1）**：恢复 reachability 脚本 + 冻结门禁 → 再逐簇接线/删除。
6. **批 6（P2）**：巨型文件搬迁式拆分；innerHTML 收敛。
7. **批 7（P0-C/P3 其余）**：electron-builder 升级、console.log、ASAR、CSS 双轨约定。

**门禁矩阵（每批收尾至少跑）**

| 命令 | 用途 |
| --- | --- |
| `npm test` | 去混淆 + JS 单测 + CSP + 后端测试 |
| `npm run test:migrations` | 17 表 schema |
| `npm run check:package` | 打包结构（含打包 Python 依赖） |
| `npm audit` | 依赖安全（P0 批） |
| `npm run test:desktop` / `verify:startup` | Electron 相关改动（P0-B/C、ASAR） |
| `npm run test:e2e` | 涉及 UI/交互改动时 |

---

## 6. 待决策清单

1. **执行范围**：全部按批次推进，还是先做 P0 + P3（低风险、见效快）？
2. **`extract-zip`**：替换为 yauzl（彻底，改动大）还是保留 + 隔离校验（保守）？
3. **127 孤立模块**：先"冻结基线"还是直接"逐簇清零"？
4. **electron-builder**：是否接受跨 major 升级（需回归打包）？

---

## 7. 边界与不做

- 本计划**不改**任何源码/配置；仅新增本文件。执行时按批单独提交。
- 不逐行重审 40 万行代码（沿用报告三层抽样口径）。
- 不跑真实模型/云服务调用、不做性能剖析。
- 依赖升级涉及的破坏性变更（electron-builder major、ASAR）不在"顺手一起改"，各自独立批次验证。

---

## 8. 已定决策（2026-10-12）

| 决策点 | 结论 |
| --- | --- |
| 执行范围 | **全部按批次推进**（§5 批 1 → 批 7） |
| `extract-zip` | **保留 + 隔离校验**（不替换依赖；解包隔离临时目录 + 白名单 + 落盘前逐条校验，`ponytail:` 注释记录风险上限） |
| 127 孤立模块 | **直接逐簇清零**（接线或删除，按目录分批）；**前置**先恢复可复现的 reachability 脚本，否则无法判定"清零" |
| electron-builder | **接受跨 major 升级**，作为独立批次回归打包 |

---

## 9. 执行进展（2026-10-12）

| 批次 | 状态 | 证据 |
| --- | --- | --- |
| 批 1 · P0 依赖 | ✅ 完成 | 漏洞 16 → 9；electron 42.4.1 → 42.11.12；提交 `d0ab7c1f` |
| 批 2 · extract-zip | ✅ 完成 | 新增 `electron/zipEntrySafety.js` + 解包前校验；提交 `d5def8ac` |
| 批 3 · 未提交改动 | ✅ 完成 | 恢复 `release_notes.txt` / `COMMERCIAL-LICENSE.md`；README/计划提交 `8e5804bd` |
| 批 4 · lint/覆盖率 | ✅ 完成 | ESLint + Prettier + `test:js:cov` + CI 步骤；提交 `a9f13796` |
| 批 5 · 孤立模块 | 🟡 前置+门禁完成 | `tools/reachability.mjs` + 基线门禁（实测 scope 2061/可达 1888/孤立 173）；提交 `573a75fc` |
| 批 6 · 巨型文件/innerHTML | 🟡 editorWorkspace 已拆 | 6817 → 5217 行（抽 2 个模块，`be2cf2d7`/`6aca37cf`）；其余文件待做 |
| 批 7 · electron-builder/清理 | ✅ 评估完成（多数"不改"） | 结论见下（无修复版/保持现状） |

### 逐批门禁结果（本机实测）
`test:js` 11283 / 0 fail / 1 skip；`check:csp` PASS；`check:obfuscation` PASS；`test:backend` 223 OK（skip 3）；`test:migrations` PASS（17 表）；`check:package` PASS（electron 42.11.12）；`lint` 0 error（52 warn 存量）；`check:reachability` PASS。

### 批 5 清零分析（173 个孤立模块）
用 `test-artifacts/orphan-importers.mjs`（一次性工具）把孤立模块按引用来源分三类：

| 类别 | 数量 | 含义与处置 |
| --- | --- | --- |
| 全仓零引用 | 54 | 多数是**约定式入口**（`eslint.config.mjs`、`playwright*.js`、`electron-builder.win.dev.cjs`、`globalCaptureWindow.js`、`screenshotOverlay.js`），并非死代码；其余（如 `ProjectManager.js`、`*_lf.js`、若干 `index.js` 桶文件）才是删除候选 |
| 仅被自身测试引用 | 45 | **接线缺口**：实现已落地并有单测，只差一个消费方 import（如 `chromeShell*`、各类 modelApi manifest）；删除即删测试 |
| 仅被其它孤立模块引用 | 74 | 需按"孤立簇"整体接线或整体删除，不能单删 |

> **结论**：批 5 的"逐簇清零"不能按列表盲删——先把"约定式入口"补进 `tools/reachability.mjs` 的入口集合并重算基线，再逐簇接线/删除。`electron-builder.win.dev.cjs`、`#` 桶文件等需与 0.7.16 镜像的消费方对照后才能定夺（镜像不在仓库内）。**该步拆为后续专用批次执行。**

### 批 5 补充分析（2026-10-12，第二轮）
对 173 个孤立模块做"整仓文本引用扫描"（`test-artifacts/orphan-refscan.mjs`）：仅 **14 个**模块的基名在全仓（js/cjs/mjs/html/json）任何位置都不出现。剔除 `eslint.config.mjs`（约定式入口）后，剩余 **13 个全是 `src/modules/storyWorkspace/storyReplication*` 成簇文件**——它们是 0.7.16 移植代码，本仓正处于"落地不接线"的既有状态，**删除会毁掉移植成果**。因此批 5 无可安全删除项，接线需镜像对照，**维持"拆后续专用批次"**。

### 批 7 结论（2026-10-12）
| 子项 | 结论 | 依据 |
| --- | --- | --- |
| electron-builder 升级 | **不改** | 已装 26.15.3 即 latest；26.17.0 仍依赖 `@electron/get@^3`（仍在漏洞区间）；只有 `27.0.0-alpha.10` 可能换代——构建链上 alpha 不可接受 |
| ASAR | **保持 `asar: false`** | 当前配置使用自定义未打包 Electron + 需从磁盘 spawn Python 运行时，启用 ASAR 属破坏性变更且收益有限 |
| console.log | **保留** | 实测源码仅 ~10 处，多为 `AIC_DRAG_IMPORT_PROFILING` 门控或性能/历史诊断信息，属可用日志而非噪音；清理收益低于回归风险 |
| CSS 双轨 | 待定 | 约定见 §2.3，存量不搬迁 |

### 批 6 评估（2026-10-12）
| 巨型文件 | 行数 | 相关测试覆盖 |
| --- | --- | --- |
| `src/modules/storyWorkspace/storyWorkspace.js` | 9495 | 有（storyWorkspaceChromePresentation 等） |
| `api/storyGenerationApi.js` | 7677 | **无** |
| `src/modules/personReplacement/personReplacementWorkspace.js` | 7187 | 有 |
| `src/modules/storyboard3d/editorWorkspace.js` | 6817 | **无** |
| `src/modules/AssetManager.js` | 4719 | **无** |

> **结论**：搬迁式拆分**只对已有测试覆盖的文件安全**（`storyWorkspace.js` / `personReplacementWorkspace.js`）。其余三个需先补测试。拆分量大，需**逐文件、逐次提交**，每次跑对应 `*.test.js`。
>
> **进度（2026-10-12）**：三个原无测试文件的**安全网已补**（提交 `73311883`）——`api/storyGenerationApi.test.js`（分块/解析边界）、`src/modules/storyboard3d/editorWorkspace.test.js`（纯函数钳制）、`src/modules/AssetManager.test.js`（jsdom 导入 + 方法面）。`test:js` 11296 / 0 fail。
>
> **搬迁拆分（2026-10-12）**：分两刀抽离，每刀都用**临时 `no-undef` 配置**校验搬迁闭包（0 undefined），导入导出面不变：
> 1. `editorWorkspace.js` **6817 → 5217 行**：`editorLayoutMetrics.js`（常量 + 纯函数，`be2cf2d7`）、`storyboard3DRenderHelpers.js`（45 个渲染函数，`6aca37cf`）
> 2. `personReplacementWorkspace.js` **7187 → 6992 行**：`personReplacementWorkspacePresentation.js`（20 个展示函数 + 2 常量，`d2b4a75b`）
> 3. `storyWorkspace.js` **9495 → 9285 行**（3 步各一提交）：`storyWorkspaceSharedHelpers.js`（`2940e7eb`）、`storyWorkspaceAssetPresentation.js`（`d983c20f`）、`storyWorkspaceModelPickerPresentation.js`（`810bccf3`）
> 4. `AssetManager.js` **4719 → 4629 行**：`assetManagerHelpers.js`（13 函数 + 1 常量，`202fb2e8`）
> 5. `storyGenerationApi.js` **7677 → 7572 行**：`storyGenerationInputHelpers.js`（11 函数 + 5 常量，`bb687c1e`）
>
> `test:js` / `lint` / `check:reachability` 全绿。
>
> **注**：`storyGenerationApi.js` 的其余辅助函数呈**级联耦合**（一个切口会引出一串本地依赖），继续深挖需要更大范围的成组搬迁或先补更多测试，暂缓；剩余可拆文件见上表。
>
> 6. 已补剧集拆分段**行为测试** `api/storyGenerationApi.episodeSplit.test.js`（9 项，`abf96a7d`）。**但实测该段仍不可安全切分**：把「剧集拆分清洗/蓝图」簇整段（约 950 行）抽出后，`no-undef` 仍报出 **31 项**依赖（含刚抽出的 `storyGenerationInputHelpers` 与 `normalizeStoryEpisodeSplitSourceBeats` 等跨段引用），实际闭包接近整文件一半。**结论：该文件不宜再按簇切分**，除非接受一次搬走约 3500 行的半文件级改动；建议保持现状。
>
> 7. **半文件级搬迁实测失败（已回滚，未提交）**：按 [376..5089] 抽出约 4700 行后，`storyGenerationSplitSupport.js` 自身仅在**模块求值期**就触发 `Cannot access 'STORY_SOURCE_CHUNK_CHARACTERS' before initialization`——因为该区间里混有**模块顶层工厂实例 `const`**（如 `storySummaryGenerationApi = createStorySummaryGenerationApi({... sourceChunkCharacters: STORY_SOURCE_CHUNK_CHARACTERS ...})`），它们在 import/求值阶段就要用到源模块的顶层常量，形成**求值期循环依赖**（function 循环可 hoist 规避，顶层 const 不行）。要消除必须把源模块几乎全部顶层常量/工厂实例一并搬走——等价于搬走整个配置层。**最终判定：`storyGenerationApi.js` 的拆分需要领域级重写，机械搬迁在任何切口都会撞上求值期循环依赖。保持现状。**
>
> **另注**：lint 报出的 3 处 `no-misleading-character-class` 均为**故意的零宽字符检测正则**（ZWJ/ZWNJ/BOM），属误报，已按存量降为 warn。

---

## 10. 技术债登记（archive，2026-10-12）

| 项 | 结论 | 证据 |
| --- | --- | --- |
| `api/storyGenerationApi.js` **拆分** | **存档：领域重写候选，不做机械搬迁** | 顶层是「常量 → 工厂实例 → 函数」的**求值期依赖图**；任何切口都会触发 `Cannot access '...' before initialization`（两次实测：按簇切分闭包≈半文件；半文件搬迁 [376..5089] 求值期 TDZ）。正确路径是按配置层/工厂层/纯函数层重写，非搬迁 |
| 已完成的搬迁拆分 | 见 §9 第 1–5 条 | `editorWorkspace.js` / `personReplacementWorkspace.js` / `storyWorkspace.js` / `AssetManager.js` 均已完成 |

## 11. P0 复核（2026-10-12）

| 检查 | 结果 | 说明 |
| --- | --- | --- |
| `npm audit` | **9 项**（8 moderate / 1 high / 0 critical） | 较审查时的 16 项（8 high/8 moderate）已消除 7 项 |
| `extract-zip@2.0.1` | 1 high，**无官方修复** | 按决策保留；已接 `electron/zipEntrySafety.js` 解包前校验（`asrRuntimeInstallTask.js:277`），且只解到新建空目录 |
| electron-builder 链（8 moderate） | 均为 **dev 构建工具**依赖 | 已装 26.15.3 即 latest；26.17.0 仍依赖有漏洞的 `@electron/get@3`；仅 27-alpha 换代——构建链不上 alpha，**不改** |
| `electron` | 42.11.12（同 major 升级） | `npx electron --version` 可验证 |
| 缓解有效性 | `check:csp` / `test:backend` / `check:package` 全绿 | `zipEntrySafety` 有 8 项单测（`electron/zipEntrySafety.test.js`） |

> **P0 结论**：可利用的生产依赖漏洞已从 16 项收敛到 **仅剩 1 项无修复版且已加隔离校验**（`extract-zip`）；其余 8 项是仅影响本地打包的 dev 工具链 moderate。**P0 视为收敛。**

---

## 12. 统筹收尾（2026-10-12）

对照审查报告的每一条，最终状态：

| 报告项 | 状态 | 处理 |
| --- | --- | --- |
| 生产依赖漏洞（4 个） | ✅ 收敛 | 16 → 9（1 high 无修复 + 隔离校验；8 moderate 为 dev 构建链） |
| 无 lint / 覆盖率 | ✅ 完成 | ESLint+Prettier+覆盖率脚本；7 条规则**全局 error**（测试/e2e 定点说明）；CI 接入 |
| 巨型文件（5 个） | ✅ 完成 | 9 个文件已拆，`storyGenerationApi.js` 存档 |
| 3 处未提交改动 | ✅ 完成 | 恢复 + 提交 |
| innerHTML 411 处 | 🟡 收敛 + 门禁 | 378 → 346，增量冻结（缩略图分支依赖共享 builder） |
| CSS 双轨 | 🟡 门禁 | style.css 预算只减不增 |
| 孤立模块 127 | ✅ 定调：接受现状 | 机械接线三簇实测均被证伪（另一代实现 / 会重复注册 / 有可达无行为）。**不再追求清零**，仅保留 check:reachability 门禁防增长（当前 171） |
| ASAR / 重复依赖 | ✅ 处置 | ASAR 保持（有意）；`npm dedupe` 收敛重复依赖 |
| console.log | ✅ 处置 | 实测仅 11 处、可用诊断，保留 |
| `debug`/`once` 重复 | ✅ 处置 | 随 `npm dedupe` 收敛 |
| 测试覆盖率门槛 | ✅ 完成 | `test:js:cov` 加 60% 行覆盖阈值并接入 CI（排除 i18n 文案与 manifests 数据目录；实测 70.63%） |
| E2E（浏览器，本地环境、不碰真实模型） | 🟡 8 passed / 1 failed | 修好 HEAD 无 body（server）与 toast 文本上限；仅余 node-parameters 的 hover 预览播放链未移植 |

---

## 13. E2E 结论（2026-10-12）

- 结果：**8 passed / 1 failed**（`npm run test:e2e`，本地自建服务 127.0.0.1:18779，不触发真实模型）。
- 已修（各一提交）：
  1. **HEAD 响应带 body**（违反 HTTP，导致 Playwright 解析失败）：server.py 新增 do_HEAD + `_HeadBodySink`，响应头先放行、`end_headers` 之后丢弃消息体。
  2. **toast 文本无上限**：toastService.js 增加 320 字符上限（带省略号）。
- 未修（**功能级移植缺口**）：node-parameters 失败在 AIGenVideoNode 调用了从未移植的 activatePreviewHoverPlayback / _deactivatePreviewHoverPlayback。核对镜像后确认其依赖在本仓缺 5 个 helper（_schedulePreviewHoverPlaybackWhenVideoReady / _isPreviewPosterClearedForPlayback / _schedulePreviewHoverTimer / _markPreviewPosterClearedForPlayback / 字段 _previewHoverRetryTimers），且镜像实现里仍含未解析闭包变量。属独立特性排期，非一行接线。
