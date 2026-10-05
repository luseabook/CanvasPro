# 第 158 批：版本重定基线（应用已升 0.8.0）

> 本批**未改动仓库任何源码**，全部是只读侦察 + 一次镜像重取（产物落在 `deobf-tools` 之外的新暂存目录）。
> 起因：用户告知已安装的 SHUO Canvas 已从 0.7.16 升级到 **0.8.0**。

## 1. 事实核验（已确认）

| 项 | 实测值 |
| --- | --- |
| `resources/webapp/package.json` | `"version": "0.8.0"` |
| `release_notes.txt` 首条 | `🎉 V0.8.0 版本更新啦！`（复刻工作室上线、账号/积分系统、官方模型目录） |
| Electron 版本（根 `version` 文件） | `43.1.0` |
| 安装落地时间 | 2026-10-03 21:52（应用内文件为 10-02 19:59 构建） |
| 源码混淆形态 | **与旧版同法**：1938 个 src+api JS 中 1936 个含 `_0x` |

结论：**整个搬迁战役的对照标尺已经从 0.7.16 移到 0.8.0。**

## 2. 0.8.0 镜像重取（已完成）

用既有工具链 `deobf-tools/deobf.cjs` 直接对 `D:/shuocancas/SHUO Canvas/resources/webapp` 跑全量（只读源目录，产物单独输出）：

- 产物：`C:/Users/luobote/.qoder/tmp/shuo-deobf-080`
- 报告：`total 1952 / deobfuscated 1948 / skipped 4 / failed 0 / unresolved 0 / replacements 338506`
- 4 件跳过原因均为 `no-rotation-iife`；耗时 57 秒
- **既有反混淆工具链无需任何改动即可处理 0.8.0**（这是本次最有价值的可行性结论之一）

旧镜像 `C:/Users/luobote/.qoder/tmp/shuo-deobf`（0.7.16）保留，作差分与已落件溯源用。

## 3. 0.7.16 → 0.8.0 真实差异

方法：**两侧同法反混淆后逐字节比对**（`diff -rq` 两份镜像）。

### 3.1 文件清单

| 域 | 0.7.16 | 0.8.0 | 新增 | 删除 |
| --- | --- | --- | --- | --- |
| `src` | 1549 共同 | 1702 | 153 | 0 |
| `api` | 大 | 236 | 32 | 0 |
| `src`+`api` 合计 | 1754 | **1938** | **184** | **0** |

**纯增量：0 个文件被删除，184 个新文件。**

### 3.2 共同件内容差异

**455 件内容有变化**，幅度分布：

| 幅度 | 件数 |
| --- | --- |
| `\|Δ\| ≤ 1%` | 143 |
| `≤ 5%` | 128 |
| `> 5%` | 184 |

变化最大的 15 件（全部对应 V0.8.0 发布说明的新功能）：

| 件 | 变化 |
| --- | --- |
| `api/storyWorkspaceApi.js` | 386 → 2093 B（+442%） |
| `src/core/stores/modelMenuPreferenceStore.js` | 1774 → 4368 B（+146%） |
| `src/modules/storyWorkspace/storyClipQualityPresentation.js` | 2635 → 5995 B（+128%） |
| `src/services/modelPricingInputs.js` | 1766 → 3832 B（+117%） |
| `src/modules/storyWorkspace/storyReplicationAssetReuse.js` | 2670 → 5763 B（+116%） |
| `src/modules/workspaceBetaNotice.js` | 2743 → 5710 B（+108%） |
| `src/modules/tutorials/tutorialPanel.js` | 9493 → 19610 B（+107%） |
| `src/services/binghuoPricingPresentation.js` | 1306 → 2658 B（+104%） |
| `api/story-generation/storyReplicationFlowPrompts.js` | 9156 → 16942 B（+85%） |

### 3.3 新增 184 件的分布

`storyWorkspace` 61、`api`（直属）25、`settings` 18、`src/modules` 直属 15、`domain/storyGeneration` 8、
`agent` 7、`components/aigenText` 5、`services` 4、`manifests/*/modelApi` 5（含官方模型目录）、
`api/story-generation` 3、`tutorials` 3、`collaboration` 3。

与发布说明一一对应：复刻工作室、账号/积分与官方模型目录、教程面板、模型菜单可见性/偏好。

## 4. 对战役的影响

1. **第 156 批的待裁决项作废。** 当时的问题是「要不要采纳 0.7.16 模型规格」——出厂版本已是 0.8.0，
   采纳 0.7.16 规格已无意义。正确问法是「要不要采纳 0.8.0 规格」。**用户无需再按原题拍板。**
2. **仓库在文件层面已对 0.7.16 满格。** 0.7.16 的 1754 件 `src`+`api` 文件，仓库 **100% 都有、缺 0**；
   剩余欠账是「接线」（201 个未接线孤立模块 / 483 口径 403），不是「缺文件」。
3. **0.8.0 的 184 个新文件仓库一个都没有** —— 这是本次新暴露的缺口。
4. **455 件在 0.8.0 有内容变化** —— 凡按 0.7.16 落地的消费方，现均落后一代，需要复核。

## 5. 方法学更正（重要）

本批一开始用「**已反混淆的 0.7.16 镜像** vs **仍混淆的 0.8.0 应用原文**」比字节数，得出
「抽查 8 件已落地文件 8/8 都涨了 15–25%」——**这是混淆开销造成的假象**。

两侧同法反混淆后真相：

| 件 | 假象 | 真值 |
| --- | --- | --- |
| `src/core/renderer.js` | 108673 → 124472（+14%） | 108673 → 109192（**+0.5%**） |
| `src/components/nodeToolbar/imageToolbar.js` | 11669 → 13651（+17%） | **完全相同** |

**规则：跨版本比对必须两侧同法反混淆，不得用「镜像 vs 原文」比字节。**

## 6. 待决

基线切换方式需用户裁决：

- **A. 全面切到 0.8.0**：重算全仓欠账口径（未落地/孤立/可达性）→ 先落 184 新件 → 再复核 455 变更件。
- **B. 先落 184 新件**：只补新缺口，455 变更件留作后续。
- **C. 暂不切基线**：把本条结论存档，先继续按 0.7.16 接线。

未决定前，不再按 0.7.16 口径推进任何批次。
