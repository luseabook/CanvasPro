# 第122批：`src/modules/storyWorkspace/` 纯叶（分 122a / 122b / 122c，落地不接线）

批次：第 122 批（纯新增落地，零消费方不接线），按件数拆三段：122a 已交付，122b、122c 待做
能力区：R06（剧本工作室：素材提取续跑、首页改写与拖放、复刻角色身份与参考素材、工作区表面切换等）
源：`C:\Users\luobote\.qoder\tmp\shuo-deobf\src\modules\storyWorkspace\`（0.7.16 反混淆镜像，只读）
暂存：`C:\Users\luobote\.qoder\tmp\deobf-tools\b122\port\src\modules\storyWorkspace\`（24 件源码已全部暂存并 prettier 格式化）、`b122\tests\src\modules\storyWorkspace\`（测试，prettier 用）
前置：无。24 件都是 0 条 import 的纯叶（`b95/deps-ast.mjs src/modules/storyWorkspace`：镜像 141 件，LEAF 24 / OK 8 / BLK 109）

---

## 1. 分段

| 段 | 内容 | 状态 |
| --- | --- | --- |
| 122a | 11 件小纯叶：`storyAssetExtractionRunner`、`storyAsyncButtonPresentation`、`storyCanvasBinding`、`storyCollaborationPolicy`、`storyEpisodeSplitPresentationPolicy`、`storyHomeRewrite`、`storyProjectNavigation`、`storyReplicationAssetIdentity`、`storyReplicationDefinitions`、`storyTaskBatchCancellation`、`storyWorkspaceSurface` | **已交付**（#0019 源码、#0020 测试） |
| 122b | 6 件中等数据 / 逻辑件：`storyEpisodeSplitBatchExecution`、`storyWorkspacePersistence`、`storySummaryRun`、`storyScriptImport`、`storyStyleCatalog`、`storyWorkspaceData` | 待做 |
| 122c | 大件 `storyAssetExtractionDraft`（22 KB）和 6 个 DOM 控制器：`storyAssetHoverPreviewController`、`storyClipVideoResultDom`、`storySpeechGapEditor`、`storyLibraryAppearanceMenuPortal`、`storyOutlineNavigation`、`storyClipPromptReferences` | 待做 |

- 另有 8 件依赖已齐（OK）：`storyClipExport`、`storyClipFrameCapture`、`storyClipFrames`、`storyClipInputSlots`、`storyReplicationCardMotion`、`storyReplicationVideoLimits`、`storyVideoThumbnailBackfill`、`storyWorkspaceDeveloperDiagnostics`。第 122 批之后再评估，先过导出闸门。
- 仓库里已有的 53 个 `storyWorkspace` 文件是 0.4.12 旧件，和这 24 件不重名。

---

## 2. 122a 落地清单

| 文件 | 行 / 字节 | 镜像字节 | 具名导出 |
| --- | --- | --- | --- |
| `storyAssetExtractionRunner.js` | 87 / 3 798 | 3 219 | `runStoryAssetExtractionToCompletion` |
| `storyAsyncButtonPresentation.js` | 18 / 853 | 752 | `renderStoryGenerationSpinner`、`syncStoryAsyncButton` |
| `storyCanvasBinding.js` | 27 / 1 055 | 888 | `buildStoryLinkedCanvasName`、`buildStoryClipCanvasBindingKey` |
| `storyCollaborationPolicy.js` | 4 / 196 | 179 | `isStoryCollaborationProject` |
| `storyEpisodeSplitPresentationPolicy.js` | 37 / 1 777 | 1 584 | 4 个：付费重试选项、实验分镜可用 / 是否使用、实验报错文案 |
| `storyHomeRewrite.js` | 65 / 3 264 | 2 955 | 9 个：提示常量、参考剧本判断、能否开始、生成模式、清除参考、任务文案、3 个拖放处理 |
| `storyProjectNavigation.js` | 15 / 736 | 629 | `openStoryProjectPage` |
| `storyReplicationAssetIdentity.js` | 80 / 3 797 | 3 066 | `reconcileStoryReplicationAssetIdentity` |
| `storyReplicationDefinitions.js` | 118 / 5 298 | 3 950 | `completeReplicationScenePropUsages`、`defineReplicationPromptMaterials` |
| `storyTaskBatchCancellation.js` | 21 / 667 | 551 | `createStoryTaskBatchCancellationRegistry` |
| `storyWorkspaceSurface.js` | 42 / 1 804 | 1 529 | 4 个：复刻模式常量、项目模式、表面项目过滤、`selectStoryWorkspaceSurface` |

- 合计 **514 行 / 23 245 B / 28 个具名导出**（镜像 19 302 B）。另有 11 个同名测试文件（37 例）。

---

## 3. 122a 冻结的端口行为（只记录，不打补丁）

- **`storyAssetExtractionRunner`**：只在错误 `type === 'ASSET_EXTRACTION_CONTINUE_REQUIRED'` 且 `isContinuation === true` 时续跑，其他错误原样抛出。
  - 进度键只看 strategy、status、phase、progress（stage / current / total，取整）、清点批次、已完成素材引用和细化批次；引用都排序后比较，所以顺序变化不算新进度。
  - 续跑返回的检查点和上一轮进度键相同 → 抛 `ASSET_EXTRACTION_CONTINUATION_STALLED`，避免重复计费；没有检查点 → `…_DRAFT_MISSING`；每次执行前检查 `isActive()`，否则抛 `ASSET_EXTRACTION_ABORTED`。
- **`storyEpisodeSplitPresentationPolicy`**：`shouldUseStoryEpisodeExperimentalSplit` 恒为 false，实验分镜在端口里等于关闭；可用性只认 `window.DEV_MODE === true`。
  - 报错文案：命中密钥 / 额度 / 登录，或缺素材 / 缺模型这类可操作错误时原样显示，并把「资产」换成「素材」；其余统一提示「已保存当前进度，请稍后再次点击…继续」。
- **`storyProjectNavigation`**：大纲 stale 只在 step > 0 时重置；重置目标是协作写作阶段 0，否则 1；剧集视图进不去第 3 步时退回项目视图。
- **`storyAsyncButtonPresentation`**：只有字面量 `true` 算忙碌。
- **`storyHomeRewrite`**：复刻页签不看 `isParsingDocument`；生成页签有文件名但正文为空时不能开始；生成页签带参考剧本时模式变为 `rewrite`；已创建项目后清除参考剧本不动 `sourceDocument`。
- **`storyWorkspaceSurface`**：只有当前项目属于旧表面时才记住它的视图 / 步骤；切回时只在同一项目 id 下恢复；切换会清空搜索词、待删除项目和打开的菜单。
- **`storyReplicationAssetIdentity`**：只在某主体的名字在同一集里唯一时合并同名复刻角色。
  - 胜者按带图数量，平手时选当前已绑定的；外观按 id 合并（胜者优先），subjectKeys 取并集。
  - 然后在 episodes 和 characterBindings 里改写旧 id / planningRef / ref。
  - 小坑：它**原地修改** data，返回的是过滤后的素材数组，调用方要自己赋回。
  - 小坑：改写范围包括 episodes 里任何「整串等于旧 id」的字符串，以及 `story-asset:<编码后的旧 id>:` 前缀。
- **`storyReplicationDefinitions`**：推断场景 / 道具用法时，素材必须只有一个外观。名字后缀要至少 2 字，而且在场景 / 道具里唯一，才能当简称用。
  - 提示词里的 `@名称 · 外观` 按长度从长到短替换成别名；引号「“…”」内的文字和「画面文字：」开头的行不替换。多外观角色才附「用于第 N 个镜头」。

---

## 4. 122a 实际做过的检查

| 检查 | 结果 |
| --- | --- |
| 导出闸门 `b100/verify-exports.mjs` | 11/11（均为 0 import） |
| 暂存 ↔ 仓库逐字节比对 | 源码 11/11、测试 11/11 与 `apply_patch` 返回的 SHA256 一致 |
| `node --check` | 11/11 |
| `prettier --check` | 22/22 |
| 自研测试 | **37 例**，沙箱和本机都是首跑全绿。DOM 相关函数用最小假元素对象测（按钮、拖放区），不引入 jsdom |
| `src/**` sweep | **3 587 / 3 544 / 43 ⇒ 3 624 / 3 581 / 43**（+37），失败名集合一致 |
| `api/**` sweep | 791 / 791 / 0 未变 |
| 消费方反向 grep | 11 个模块名在 api、src、electron、入口文件里 **0 命中** |
| 受保护文件 | md5 仍为 `1E0458013F5341C99F21FAEFC1D34D3F` |

**未执行 / 边界**：没有启动应用，也没有真机验证；这些件都没有调用方。

---

## 5. 接线观察（本批不动）

- 122a 的调用方大多在 BLK 件里，例如 `storyAssetExtractionWorkspaceController` 依赖 Runner，同时还依赖 `storyScriptImport`、`storyStyleCatalog` 等 16 个缺件。要等依赖补齐后，单独成批接线。
