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
