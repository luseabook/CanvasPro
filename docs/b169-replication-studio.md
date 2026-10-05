# 169 批：复刻工作室落地

> 2026-10-05。范围由用户裁决：**0.8.0 不用全量，只要复刻工作室**。本文是 `docs/TRACKING.md` §11 该条目的细节。

## 1. 先纠正两处认知

### 1.1 复刻工作室 ≠ 替换工作室

用户两次纠正。第一次把它误认成 `storyReplication*` 提示词子系统；第二次给出截图，指出它是**与剧本工作室、画布模式同级的功能界面**。
代码互证：`src/modules/workspaceModeCoordinator.js` 注册 5 个平级模式，截图与之一一对应：

| 截图卡片 | 模式 id | 实现 |
|---|---|---|
| 画布模式 | `canvas` | `canvasWorkspacePresentation` |
| 剧本工作室（beta 限免） | `story` | `storyWorkspaceApi` |
| 替换工作室（beta VIP） | `workspaceStudioModes.js` | `personReplacement/` **独立模块** |
| 3D场景穿梭（灰） | `storyboard3d` | `storyboard3DWorkspaceController` |
| **复刻工作室（beta VIP）** | `replication` | **`storyWorkspaceApi` 的一个 surface** |

复刻工作室走 `main.js:582-586`：`replicationWorkspace.activate()` → `storyWorkspaceApi.activate({ surface: "replication" })`，
所以代码落在 `src/modules/storyWorkspace/`，与剧本工作室共用一套工作区。替换工作室则是 `personReplacement` 的独立应用，两者无共用关系。

### 1.2 授权不用另建：项目现有的就够

原判断「复刻工作室是 VIP 付费功能，仓库缺账号/积分层，需另做官网账号子系统」**作废**。实测仓库里授权链路本来就全在：

- `src/modules/app/appPanels.js:634` — `window.isModelAllowedBySubscription(modelId, provider)`，读 store 里的 subscription 状态
- `src/modules/app/appPanels.js:624` — `window.openSubscriptionDialog(...)`，输授权码的弹窗
- `src/modules/subscriptionAccess.js` — gate 清单 + `submitCdkey` / `pullSubscriptionState`
- `src/modules/subscriptionAccess.js` 里**替换工作室**（`replacementStudio`）的 gate 条目早已在跑

替换工作室与复刻工作室是**不同的功能**，但**同一套门控形态**——所以先例成立：复刻工作室只需照同一条路走。
0.8.0 给 `replicationStudio` 的配置是 `allowAnyActiveSubscription: true`，即**任何有效订阅**可进，非专属权益（与 0.8.0 保持一致）。

## 2. 仓库原本已有什么

复刻工作室不是从零开始，骨架早就在：

- 5 个模式注册、切换器 UI 卡片、`workspace-mode-icon--replication` 图标、body class 全有
- `main.js:582` 已传入 `replicationWorkspace` 路由
- 数据层已有：`episode.replication.sourceAnalysis`、`videoReplication*.js`（ASR / 语言 / 提示词策略）
- beta 提示已有：`showReplicationWorkspaceBetaNotice`

缺的只有三样：可见性、VIP gate、实现文件。

## 3. 改动清单（3 改 + 62 新）

### 3.1 改

| 文件 | 改动 |
|---|---|
| `src/modules/subscriptionAccess.js` | gate 清单加 `replicationStudio`（`feature/replication_studio`、providers `["aicanvas"]`、`allowAnyActiveSubscription: true`）；导出 `REPLICATION_STUDIO_VIP_MODEL_ID` |
| `src/modules/workspaceModeCoordinator.js` | 删掉复刻的 dev 门；卡片徽章 `beta 限免` → `beta` + `VIP`，补副标题「复刻短剧、二创出海」 |
| `src/modules/subscriptionAccess.test.js` | gate key 精确列表断言补 `replicationStudio` |

**关于 dev 门**：仓库的 `mode()` 里对 `REPLICATION_MODE_ID` 加了一道 `AI_CANVAS_IS_DEV_BUILD && DEV_MODE` 判断，正常版永远不显示。
0.8.0 **从无此门**——是仓库自己加的。同一道门在 0.8.0 里属于 `isStoryboard3DWorkspaceAvailable()`（3D场景穿梭），
而仓库的该函数本来就正确带着 dev 判断，故未动。**修的是「多了一道门」，不是「门被删了」**。

### 3.2 新增 45 件（复刻工作室生产文件）

0.8.0 镜像里复刻相关生产文件共 74 件，落地 45 件后仓库数量与之相同。

落地前**先量后做**，这是本批最关键的判断：

| 指标 | 值 |
|---|---|
| 合计体积 | 227 KB |
| `_0x` 标识符出现 | 7,490 处 |
| `![]` / `!![]` | 286 处 |
| **字符串数组解码器** | **0 件** |
| 自防护代码 | 0 件 |

**没有字符串数组解码器**，意味着不需要求值型去混淆（不必把混淆代码当程序跑）。45 件全是「标识符改名 + 布尔字面量」两层轻混淆，
正好落在既有流水线的覆盖范围内。于是每件依次过四道闸门：

```
deobf-bool.mjs --write   →  ![] / !![]  →  false / true
deobf-auto.mjs           →  按用法证据推导表意名（JSON 输出，不落盘）
deobf-rename.mjs         →  应用改名；map 必须覆盖全部 _0x 名，否则拒写
deobf-verify.mjs         →  改名闸门：token 流必须完全一致
node --check             →  语法
```

结果 **45/45 PASS**。

### 3.3 新增 17 件（传递闭包）

45 件落地后做 import 解析，发现引用了 13 个仓库没有的模块（`replicationTiers.js`、`storyReplicationTaskApi.js`、
`canvasAccountApi.js`、`officialPromptEnhancementPolicy.js` 等）。写了个**传递闭包**脚本：落地一批 → 扫相对 import →
把新的缺失项入队 → 循环，直到收敛。**两轮收敛，再落 17 件，0 失败**，其中包括 `api/officialAccountRuntime.js`。

最终从复刻入口出发的闭包覆盖 **570 件、1309 条相对 import、0 解析失败**。

## 4. 验证

| 项 | 结果 |
|---|---|
| 混淆闸门 `tools/deobf-gate.mjs` | 3208 件扫描 **PASS** |
| 落地后 `_0x` / `![]` 残留 | **0 / 0** |
| 复刻入口传递闭包 | 570 件 / 1309 条相对 import / **0 解析失败** |
| `node --check`（74 件复刻 + 17 件依赖） | 全过 |
| 受保护文件 `api/freeImageHostApi.js` MD5 | `1E0458013F5341C99F21FAEFC1D34D3F` 未变 |
| `npm test` | **11215 / 11186 / 28**，与基线逐条一致 |

### 4.1 回归怎么比出来的

只比总数会骗人（+1 和 −1 可能抵消）。按仓库惯例做**回退重跑比对**：

1. 备份全部 64 件改动
2. `git stash -u` 回退到 HEAD，跑 `npm test` 取基线 → **11215 / 11186 / 28**
3. `git stash pop` 恢复，按备份逐件校验 → 0 缺失 / 0 内容不符
4. 带改动再跑 → 29 条失败
5. 取失败集差集 → **只多一条** `subscription access: VIP gate 清单来自共享 manifest`
6. 该条是加 gate 后的断言失配（T 类：断言需随预期行为更新），更新断言后定向 11/11 通过
7. 全量再跑 → 回到 **11215 / 11186 / 28**，失败集与基线**逐条一致**

**零回归。**

## 5. 没做的

- **没启动过应用**，所以「点进去能不能用」没有真机证据。已证明的只是：模块能加载、依赖闭合、门控走项目现有授权码链路。
- 74 件里另有 **29 件仍是 0.7.16 代**，未升到 0.8.0。
- 45 件新文件**没有配套测试**。

## 6. 工具脚本

本批用的脚本都在 `C:\Users\luobote\.qoder\tmp\deobf-tools\b169\`（仓库外，不进 git）：
传递闭包 `closure.cjs`、闭包校验 `closurecheck.cjs`、批量流水线 `run45.cjs`、失败集比对 `base-fails.txt` / `new-fails.txt`。