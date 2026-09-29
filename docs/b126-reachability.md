# 第 126 批：全图可达性重算（把孤立台账从估算换成实测）

> 目的：`docs/tracking/orphans.md` 此前一直是**按批次增量累加**的估算（每落一批就往计数里加，从不重算）。
> 本批从仓库入口做一次**全图遍历**，用实测数据替换估算，并顺手修掉台账里「大段清单被 300 字符截断」的缺陷。
> 本批**不改仓库源码**，只改跟踪文档；脚本放在 `deobf-tools/b126/`。

## 1. 方法与口径

**入口**（从代码里实测得到，不靠人工记忆）：

| 来源 | 入口 |
| --- | --- |
| `index.html` 的 `<script type="module" src>` | `main.js` |
| `package.json` 的 `main` | `electron/main.js` |
| 运行期按路径加载（不是 import） | `electron/preload.cjs`、`electron/globalCaptureWindowPreload.cjs`、`electron/screenshotOverlayPreload.cjs`、`db/migrations/001_short_drama_core.cjs`、`knexfile.cjs`、`main.js` |

**遍历规则**：沿相对 `import`、`export … from`、动态 `import()`、`new URL("…js", import.meta.url)` 逐个展开；带 `?query`/`#hash` 的规格先剥掉；只跟相对路径（裸模块名与外链视为外部依赖）。

**scope**（分母）：`src/`、`api/`、`electron/`、`db/` 加根级 `*.js`/`*.cjs`，排除 `*.test.js` / `*_test.js` / `*.spec.js`、`node_modules/`、`deobfuscated/`、`vendor/`、`user/`、`data/`、`output/`、`build/`、`dist/`、`tools/`、`backend/`。

**脚本与证据**：`deobf-tools/b126/reach.mjs`（遍历 + 统计 + 在用触达）、`gen-orphans.mjs`（生成台账）、`reach-report.txt`、`reach-orphans.json`、`orphans.txt`、`touch.txt`、`missing.txt`。

## 2. 实测结果

| 指标 | 值 |
| --- | --- |
| scope（非测试 JS 模块） | **1208** |
| 可达（从入口走得到） | **755** |
| **孤立（入口不可达）** | **453** |
| 断链（相对 import 指向不存在的文件） | **0** |
| 解析失败（AST 解析不了的模块） | **0** |
| 范围外可达（`vendor/three/**`，不计入 scope） | 5 |

**断链 0 是一条此前从未验证过的事实**：整个仓库所有可达模块的相对 import 都能解析到实际文件，也就是说第 124–125 批「只新增不覆盖」的落地方式没有制造悬空引用。

## 3. 与旧估算的差异

台账旧值 447（估算）/ 总数 1209，实测 453 / 1208。逐目录差异：

| 目录 | 旧估算 | 实测 | 差 | 说明 |
| --- | --- | --- | --- | --- |
| `src/modules/storyboard3d/` | 43 | 45 | +2 | 补上 `geometryImportWorkerCore.js` 与 `modelGeometryImport.worker.js`（早期批次落地、从未编目） |
| `electron/` | 16 | 18 | +2 | 补上 chrome-shell 族里的零星件 |
| `src/modules/interaction/` | 5 | 6 | +1 | 补上 `contextMenuIcons.js` |
| `src/utils/` | 3 | 4 | +1 | 补上 contextMenu 图标/快捷键目录表 |
| `src/components/` | 1 | 2 | +1 | 补上 `contextMenuIcon.js` 与 `sharedIconMarkup.js` 里的漏记项 |
| `db/migrations/` | 1 | 0 | −1 | 迁移 `.cjs` 由后端 runner 按路径加载，口径上算入口，不再计为孤立 |
| 其余 30 个目录 | — | — | 0 | 与旧值一致 |
| **合计** | **447** | **453** | **+6** | 旧值系统性偏低 |

偏差的根因有两条，都值得记下来：

1. **增量累加天然只增不减、只记「本批落的」**：第 124–125 批之前就存在的孤立件（contextMenu 族、geometry-import worker 族等）从来没进过台账。
2. **旧台账里若干大段的清单行被写成 300 字符截断**（末尾断在文件名中间、无省略号），所以即便条目数对得上，清单也是不全的——本批重算后每段清单都是完整的。

## 4. 在用触达分析（本批新增的接线优先级指标）

对每个孤立件做一次前向闭包，统计闭包里**属于可达集合**的模块数（触达即停、不再展开）：

| 分组 | 数量 |
| --- | --- |
| 触达 > 0（引用了在用代码，通常是从在用文件抽出来的） | **114 / 453** |
| 触达 = 0（自成一体的孤岛，接线要先补外部装配） | **339 / 453** |

触达 > 0 的按目录分布：`src/modules/` 30、`agent/` 19、`personReplacement/` 10、`storyboard3d/` 9、`storyWorkspace/` 9、`electron/` 7、`panoramaSceneNode/` 4、`canvasCommands/` 4、`hooks/` 4，其余零星。

触达数最高的 20 件（越靠前越像「已经和在用链路咬合、只差一个 import」）：

| 触达 | 模块 |
| --- | --- |
| 8 | `src/modules/ImageExpandController_lf.js` |
| 8 | `src/modules/canvasCommands/nodeExportCommands.js` |
| 6 | `src/core/stores/index.js` |
| 6 | `src/modules/ProjectManager.js` |
| 6 | `src/modules/nodeBatchExport.js` |
| 5 | `src/hooks/index.js` |
| 4 | `src/hooks/useViewport.js` |
| 4 | `src/modules/canvasCommands/storyboardCommands.js` |
| 4 | `src/modules/storyboard3d/exportController.js` |
| 4 | `src/modules/videoTimelineThumbnails.js` |
| 3 | `api/adapters/ApimartAdapter.js` |
| 3 | `src/modules/agent/agentConversationPresentation.js` |
| 3 | `src/modules/audioVoiceLocalAsrRuntime.js` |
| 3 | `src/modules/audioVoicePanelGenerationFeedback.js` |
| 3 | `src/modules/interaction/dropTargetSpatialQuery.js` |
| 3 | `src/modules/personReplacement/personReplacementExport.js` |
| 3 | `src/modules/promptAssetInputRefs.js` |
| 3 | `src/modules/storyWorkspace/storyReplicationRepresentativeFrames.js` |
| 3 | `src/modules/workspaceMediaDownload.js` |
| 3 | `src/services/downloadSaveService.js` |

注意这条指标只说明「引用关系上已经咬合」，**不等于接线安全**：这些件里有很多是从受保护装配件里抽出来的（例如 `promptAssetInputRefs` 的抽取源是 `src/modules/nodePromptShared.js`），接线仍然要逐条比对行为差异并做真机验收。

## 5. 接线分批建议（按触达与依赖闭合度，供授权后执行）

1. **钩子与核心桶**：`src/hooks/{index,useHistory,useSelection,useViewport}.js`（4 件）与 `src/core/stores/index.js`（触达 6）——体量小、依赖闭合、触达高，是风险最低的第一批。
2. **画布命令**：`src/modules/canvasCommands/{nodeExportCommands,storyboardCommands,taskCommands,mediaToolCommands}.js`（4 件，其中两件触达 8/4）——需要接进在用的 `shortcuts.js`/命令注册处。
3. **分镜 3D**：`src/modules/storyboard3d/` 45 件里触达 >0 的 9 件，先从 `exportController.js`（触达 4）开始。
4. **Agent 层**：`src/modules/agent/` 67 件里触达 >0 的 19 件；这一块依赖渲染器消费方，最大也最难。
5. **剩余 339 个孤岛**：没有引用在用代码，接线等于「新建整块装配」，必须连同外部装配一起设计。

## 6. 未执行项与边界

- **没有改任何仓库源码**；本批只重算了台账并新增一份方法与结论记录。
- **没有启动应用或构建**，所以「可达」只代表静态 import 图上可达，**不代表运行时真的被调用**；真实装配仍需真机验收。
- 遍历是 AST 级的静态分析，`new URL(...)` 这类动态资源引用已覆盖，但通过变量拼接构造的路径（如 `import(\`./\${x}.js\`)`）无法识别——本仓未发现此类写法。
- 台账口径里的「入口」包含按运行期约定加载的 preload / 迁移 / knexfile；若换一套口径（例如不认后端 runner），`db/migrations/` 的 1 件要重新计为孤立。
