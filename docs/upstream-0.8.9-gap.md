# 上游 0.8.9 差距分析（2026-10-22）

已装 SHUO Canvas 升级到 **0.8.9**（2026-10-19 安装包，`package.json` version 0.8.9）。
仓库基线仍是 0.4.12 血统 + 部分 0.8.0 代移植件 → 本文档记录新镜像、差异台账与补齐批次计划。

## 1. 镜像标尺升级（0.8.0 → 0.8.9）

| 产物 | 位置 | 状态 |
| --- | --- | --- |
| webapp 镜像 | `C:/Users/luobote/.qoder/tmp/shuo-deobf-089` | 2468/2472 件去混淆（40.17 万处字符串还原，0 失败） |
| electron 镜像 | `C:/Users/luobote/.qoder/tmp/shuo-electron-deobf-089` | 158 件（自 app.asar 提取，1.37 万处还原） |
| diff 工具 | `C:/Users/luobote/.qoder/tmp/deobf-tools/diff089.mjs` | 输出 `d089-{summary.json,onlyMirror,diff,onlyRepo}.txt` |
| asar 提取 | `deobf-tools/asar-extract-tree.mjs` | 整树提取 asar 子树（新增工具） |

镜像已跑完：`deobf.cjs` → prettier → `deobf-unescape.mjs --write --numbers`（15 件 9755 转义 + 300 数字）
→ `deobf-bool.mjs --write`（12 件 309 处）。**rename 层未做**（逐文件语义命名，随各批落地时处理，
与当年「改名」批工序一致）。残留水位与仓库基线同形：bracket-member/char-concat/hex-literal 均为
移植件风格或刻意常量，非残留；`void 0`（159 处）为上游写法，行为等价。

vendor：three 双方均为 **0.180.0 持平**；0.8.9 新带 `vendor/mediapipe/tasks-vision`
（pose landmarker，随人体姿态相关功能批次引入）。

## 2. 差异台账（层清理后最终数）

| 层 | 镜像件数 | 相同 | 有差异 | 仅镜像有 | 仅仓库有(非测试) |
| --- | --- | --- | --- | --- | --- |
| api | 402 | 5 | 205 | **192** | 15 |
| src | 2056 | 20 | 1571 | **465** | 104 |
| electron | 163 | 4 | 131 | **28** | 24 |
| styles(css) | 244 | — | — | **203** | 0 |
| backend(py) | 6 | 2* | 1* | 1（shot_detection_worker） | — |

\* funasr/sortformer 仅品牌描述串差异；`outbound_http_transport.py` **仓库版反而更新**
（多出 98 行 SSRF 加固），上游是旧版，不动作。

注意：`diff` 桶含改名层噪音（镜像未语义改名，与仓库可读名无法逐字节对齐），
文件级取舍以 onlyMirror/onlyRepo 清单为准。

## 3. 功能 → 代码映射（仅镜像有新件聚类）

| 功能簇（版本） | 新件数 | 主要位置 |
| --- | --- | --- |
| 复刻工作室（0.8.0–0.8.9 持续演进） | ≈342 | `src/modules/storyWorkspace`(195)、`api/story-generation`(116)、`src/domain/storyGeneration`(26)、`electron/mediaTasks/replication*`(5) |
| 官方模型目录/计费（0.8.0–0.8.5） | ≈44 | `src/manifests/official`(17+officialMediaCatalog)、`manifests/video/modelApi`(13)、`manifests/dreamina`(5)、`api/adapters`(9) |
| 设置/公告/官方消息/教程（0.8.3–0.8.7） | ≈38 | `src/modules/settings`(24)、`announcements`(3)、`tutorials`(5)、`api/errors`(10) |
| 替换工作室演进（0.8.2–0.8.9） | ≈17 | `src/modules/personReplacement` |
| electron 新能力（0.8.1–0.8.9） | 28 | 浏览器守护/窗口所有权（win/mac）、`timelineExport/jianyingDraft*`（剪映草稿导出）、`projectPackageArchive`、`desktopEventPoll`、`agentWebSearchCapability` 等 |
| 组件增量 | ≈34 | `components/shared`(13)、`audio-node`(7)、`learning-route`(6)、`video-node`(5)、`aigenText`(5)、`nodeToolbar`(3) |
| styles 全量拆分 | 203 | `styles/`（上游把 41 个 css 拆成 244 个） |

仓库自有、升代须保留的资产：backend 50 件自有服务（订阅门/热更/SSRF 等）、
`main.js` 自有导入（ComfyWorkflowNode、StoryWorkspaceNode、snapGrid、cleanupSteps、
dreamina headless 登录等）、CSP 闸门、`check-csp.mjs`、E2E 与离线测试防线。

## 4. 建议批次计划（整代升代 + 依赖闭包，沿 b163 路线）

1. **B-0（本批已完成）**：镜像标尺升到 0.8.9 + 本台账。
2. **B-1 官方目录簇**：`manifests/official` + `video/modelApi` + `dreamina` + `api/adapters`
   + 聚合器升代（modelRegistry / vendor*ModelApiManifests / Normalizer / RunningHubAdapter）。
   聚合层是规格变更型，须一次性接通 0.8.9 规格，禁止逐件。
3. **B-2 electron 能力簇**：28 件新 electron 模块与渲染侧调用点配对落地
   （browserGuardian/ownership 三件套、jianyingDraft、desktopEventPoll 等）。
4. **B-3 复刻工作室**：≈342 件全量（依赖 B-1/B-2），含 `shot_detection_worker.py`
   （TransNetV2 镜头切分，自包含 worker）与 mediapipe vendor。
5. **B-4 设置/消息/教程簇**：settings 24 + announcements 3 + tutorials 5 + api/errors 10。
6. **B-5 styles 收尾**：CSS 全量重构随 B-1..B-4 各自带入，本批对齐目录结构并清理旧样式。

每批沿用：镜像件过四层工序 → 落地改名（`deobf-verify` PASS）→ 同名测试（node:test，
只从公开导出进入）→ 闸门/全量回归 → T/A 判据改断言 → 记账 + 双推。
受保护装配件与 fail-closed 恢复防线（`projectLifecycle.js`、`desktopBridge.js`）按记忆红线处理。
