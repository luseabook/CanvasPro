# 第 127 批：全仓移植欠账清点（未落地 771 件 / 首波 260 件可落）

> 目的：把「还剩多少要移植」从**局部估算**换成**全仓实测**。
> 此前队列（LEAF/OK/BLK）只覆盖 `src/modules` **直属**一层，其余范围（`src/components`、`src/core`、`src/manifests`、`src/domain`、`api/`、`vendor/` 等）从未做过同类清点；OK 队列清零被误读成「快没活干了」。
> 本批**未改动任何仓库源码**，全部是只读分析。脚本与证据在 `deobf-tools/b127/`。

## 1. 方法与口径

- **镜像**：`C:/Users/luobote/.qoder/tmp/shuo-deobf`（0.7.16 反混淆源码），非测试 JS 模块 **1767** 个。
- **仓库**：`F:/CanvasPro` 的 `src/ api/ electron/ vendor/ db/` 加根级 `main.js`、`knexfile.cjs`，非测试模块 **1212** 个。
- **未落地** = 镜像有、仓库无：**771** 个。
- 排除项：`node_modules/`、`.git/`；测试文件按三种命名约定一并排除：`*.test.js`、`*_test.js`、`*.spec.js`（`*_test.js` 是本仓旧命名，只认 `*.test.js` 的工具会漏掉）。
- 依赖解析：AST 级提取 `import ... from`、`export ... from`、`export *`、动态 `import()`、`new URL('...js', import.meta.url)`（worker 资源引用），只跟**相对说明符**。
- 说明符补全：无扩展名时依次试 `+'.js'`、`+'/index.js'`。

## 2. 实测数字

| 项 | 值 |
| --- | --- |
| 镜像非测试模块 | 1767 |
| 仓库非测试模块 | 1212 |
| **未落地** | **771** |
| 现在就能落（相对依赖全在仓库） | **326**（其中零依赖 119） |
| 后续波次 | 445 |
| 循环依赖 | **0** |
| AST 解析失败 | **0** |
| 真断链（依赖在镜像与仓库都不存在） | **0** |

**断链 0** 说明：771 个未落地件的每一个相对依赖，都能在镜像或仓库里找到实际文件——移植源是**依赖闭合**的，不存在「源头就缺文件」的情况。

## 3. 依赖波次（第 k 波 = 前 k−1 波落完后即可落）

第 1 波 326、第 2 波 150、第 3 波 84、第 4 波 29、第 5 波 25、第 6 波 22、第 7 波 24、第 8 波 16、第 9 波 20、第 10 波 19、第 11 波 14、第 12 波 12、第 13 波 9、第 14 波 12、第 15 波 6、第 16–18 波各 1（最深 18 波，末端是 `storyWorkspace/storyWorkspace.js`）。

## 4. 首波 326 件的真实闸门结果

对 326 件逐件跑 `b123-gate.mjs`（静态依赖 + 动态导入核对具名导出）：

| 结果 | 件数 |
| --- | --- |
| **通过**（无 MISSING、无 DEP-FAIL） | **260** |
| 受阻 | **66** |
| 其中：只有 MISSING（依赖在仓库但缺具名导出） | 66 |
| 其中：DEP-FAIL（依赖导入即失败） | **0** |

**DEP-FAIL 为 0** 是个有用的事实：首波件的每一个相对依赖都能在 bare node 下成功导入，说明这批件不引入新的运行时装配问题。

通过件按范围：`src/components` 61、`src/modules` 49、`src/core` 36、`src/manifests` 20、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2、`api/` 直属 41。

## 5. 66 件受阻件的解阻清单（关键产出）

把每条 MISSING 的相对 spec 解析成仓库绝对路径后：**105 条缺失导出，涉及 40 个仓库文件**。

**105 条全部在 0.7.16 镜像的同路径文件里存在**（镜像有同名导出 105 / 没有 0 / 解析失败 0）。也就是说，这 66 件受阻的根因统一是：**仓库里的被依赖文件是旧世代，缺少 0.7.16 新增的导出**；解阻手段就是**升代这些既有件**（不是新写实现）。

其中 5 个仓库文件是 `docs/TRACKING.md` §2.3 列的**受保护装配件**（升代须单独成批、经用户授权）：

- `api/configApi.js`（缺 5）
- `src/manifests/index.js`（缺 1）
- `src/components/shared/nodeFooterControls.js`（缺 1）
- `src/core/rendererVirtualization.js`（缺 3）
- `src/services/storeRuntimeEffectsService.js`（缺 1）

其余 35 个普通文件缺导出最多的几个（完整清单见 `deobf-tools/b127/unblock.md`）：

| 仓库文件 | 缺导出数 | 说明 |
| --- | --- | --- |
| `src/services/canvasMediaLocalService.js` | 10 | 画布视频代理升格、显示地址与封面地址解析 |
| `src/components/video-node/parameterPanelModelHelpers.js` | 9 | 各厂商视频菜单/Logo HTML 构建 |
| `src/manifests/shared/runningHubImageManifestShared.js` | 8 | RunningHub 实例类型允许值等 |
| `src/core/math.js` | 8 | 视口/NDC 互转、射线与轴平面求交、矩形组约束平移 |
| `src/modules/settings/panelSettings.js` | 7 | 打开设置面板到指定字段等 |
| `src/core/rendererNodePresentation.js` | 6 | 节点标签/计时文本、组色透明度、拖拽变换同步 |
| `api/adapters/ModelApiManifestNormalizer.js` | 4 | manifest 映射请求体、模型令牌、API 地址解析 |
| `src/services/mediaTaskService.js` | 4 | 视频代理迁移任务组 |
| `src/modules/panoramaSceneNode/sceneNodeActions.js` | 4 | 全景相机关键帧、人偶姿态、场景合成 |

**注意**：`clampRectGroupTranslation`、`clientToViewportNdc` 等落在 `src/core/math.js`——这是**在用核心文件**。升代它是把 0.7.16 新增的纯函数补进去，风险低于装配件，但仍属「改在用文件」，须与移植批分开登记。

## 6. 与原队列口径的关系

- 旧队列（LEAF/OK/BLK）只算 `src/modules` **直属**，已全部落完并于 125l 清零——那个「清零」是**局部**的。
- 本批口径覆盖全仓，`src/modules` 的**全部子目录**也算进来：未落地 359，其中首波 86、过闸门 49。
- 结论修正：**还剩 771 件要移植，其中 260 件现在就能落**；不是「只剩 28 件受阻件」。

## 7. 下一步排期建议

1. **第 128 批起，按首波 260 件推进**（沿用 §4 单批工序：prettier(镜像) 逐字节 → 落地 → 同名测试 → 闸门/静态/bare 导入/消费方反查 → 全量回归）。建议按范围成批：先 `src/modules` 的 49 件（与既有批次同构），再 `src/core` 36、`src/components` 61。
2. **66 件受阻件单独成批解阻**：35 个普通文件可直接升代（补导出 + 校验），5 个受保护装配件**须先经用户授权**。
3. `vendor/mediapipe` 2 件是 322 KB 级 wasm 加载器，体积大但无依赖，可随任意批落地。

## 8. 边界说明（不要误读）

- 「通过闸门」只证明**静态依赖闭合、具名导出齐备**，不等于运行时可用。
- 落在本批件与目标 R01–R26 的对应关系需在落地批里逐件标注，本批不做归属判定。
- 波次是针对**未落地件之间**的依赖算的；它们落到仓库后是否被入口可达，是**另一件事**（见 `docs/b126-reachability.md`）。

## 9. 证据文件

`deobf-tools/b127/`：`plan.mjs`、`plan-report.txt`、`plan.json`、`now-landable.txt`、`later-waves.txt`、`unblock.mjs`、`unblock.md`、`unblock.json`、`gate-now.txt`、`gate-now.json`、`gate-now-pass.txt`、`missing-exports.json`。

重算命令：

```
node C:/Users/luobote/.qoder/tmp/deobf-tools/b127/plan.mjs
node C:/Users/luobote/.qoder/tmp/deobf-tools/b123/b123-gate.mjs <接首波清单>
node C:/Users/luobote/.qoder/tmp/deobf-tools/b127/unblock.mjs
```
