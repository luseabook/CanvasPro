# 第 140 批：首波第十三批（`src/components` 第四批 10 件）

> 第 127 批首波 260 件里的第十三批，沿用 §4 单批工序：**落地不接线**。
> 源 10 件共 **29 483 B / 710 行**；测试 10 个同名件共 **26 031 B / 839 行**，**37 例**。
> 本批把 `src/components` 首波候选从 31 件降到 21 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | --- |
| `media-clip/videoRangeTimelineView` | 2486/56 | 8d10e893575f | 3 | 1882/65 |
| `generationErrorCard` | 2601/60 | 47af18c966aa | 3 | 1947/62 |
| `shared/customAiAppLogo` | 2545/51 | 2f1cb2a0f3da | 3 | 1645/42 |
| `shared/hoverVideoPlaybackLifecycle` | 2938/83 | 0c8d6376db85 | 4 | 3768/99 |
| `shared/mentionMenu` | 2874/62 | 040a0aca8e25 | 4 | 3358/115 |
| `shared/randomSeedPolicy` | 2795/70 | cc73a98f6aa4 | 5 | 1990/56 |
| `aigenImage/uiSchemaVisibility` | 3040/71 | 8747b459ad51 | 2 | 1600/41 |
| `video-node/videoNodeAdaptiveAspectRatio` | 3178/88 | 1ee0da3b3467 | 3 | 2611/95 |
| `shared/canvasEditorSurface` | 3375/78 | 3fb827f6ee07 | 5 | 3783/129 |
| `source-video/sourceVideoUploadMedia` | 3651/91 | 30ee6daa3597 | 5 | 3447/135 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`videoRangeTimelineView`**：用注入的 document 构建轨道、ticks、缩略图、区间、左右手柄、播放头和标签；缺 document 抛错，thumbnailCount 至少为 1。
- **`generationErrorCard`**：同时提供 DOM 卡片与 HTML 字符串；标题和详情按回退规则取值，HTML 对文本、class 与 role 转义。
- **`customAiAppLogo`**：生成 RunningHub、ComfyUI 本地/云端/通用 Logo；class token 过滤非法字符，再按 icon kind 分派。
- **`hoverVideoPlaybackLifecycle`**：用 WeakMap 记录外部播放所有权；判断悬停接管与手动/外部播放保留，切换播放控件显示，并用代次号取消过期的延迟释放。
- **`mentionMenu`**：创建 mention 项结构和 modifier class；按窗口边界夹紧位置，空间不足时向上翻转并设置 `maxHeight`。
- **`randomSeedPolicy`**：归一 fixed/random 模式；legacy 数字 seed 固定为 fixed；从 params 及 nodeData/generationParams 两层解析并区分“存在但为空”。
- **`uiSchemaVisibility`**：递归收集 manifest 字段的 `showWhen`、`hideWhen`、`any`、`all` 与 option 条件，按稳定字段顺序生成 JSON 依赖签名。
- **`videoNodeAdaptiveAspectRatio`**：从输入边选择图片/视频尺寸，按 manifest 的 kind/slot/index 偏好取值，图片优先于视频，再交给 `applyVideoAdaptiveAspectRatio`。
- **`canvasEditorSurface`**：创建标注 overlay/container/stage；媒体聚焦层可 update/release；编辑器按画布变换定位；提交按钮与工具栏边界均做转义或夹紧。
- **`sourceVideoUploadMedia`**：生成上传尺寸 patch；用 object URL 读取视频 metadata 并清理和超时；生成视频预览 URL；等待下一帧或退回宏任务。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 20/20 通过 |
| 源文件与外部暂存产物逐字节比对 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **37 / 37 / 0** |
| 消费方导入反查 | 真实命中 **0**，确认仍是「落地不接线」 |
| src 全量回归 | **7389 / 7346 / 43**（本批新增 37 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` 逐条一致，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 10/10 均因目标模块不存在而失败；落地后 37 例有 2 例为测试侧状态与默认值预期，改正后 37/37 全绿，移植实现未为测试改写。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 时间线、菜单、错误卡、标注表面与视频上传只验证公开函数的结构、状态或回调契约，不验证真实节点装配、浏览器布局或媒体解码。
- `uiSchemaVisibility` 使用真实 Bernini manifest 验证依赖字段与签名稳定性；比例源使用真实 LTX manifest 配置加最小节点数据验证优先级。
- `readVideoFileNaturalSize` 的 timeout 和媒体加载失败路径没有占用真实 3 秒等待，仅验证 object URL、metadata 成功与清理路径。

## 5. 下一批口径

第 128–140 批累计落首波 **125 件 / 473 例**。全仓未落地件由 771 降到 **646 件**；首波过闸门 260 件中已落 125、余 **135 件**。`src/components` 还有 **21 件**，下一批继续按同工序清该目录。

## 6. 证据文件

`deobf-tools/b140/port/src/components/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
