# 第 141 批：首波第十四批（`src/components` 第五批 10 件）

> 第 127 批首波 260 件里的第十四批，沿用 §4 单批工序：**落地不接线**。
> 源 10 件共 **126 294 B / 2945 行**；测试 10 个同名件共 **31 936 B / 1062 行**，**37 例**。
> 本批把 `src/components` 首波候选从 21 件降到 11 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | --- |
| `aigenImage/imageGenerationExecutionOwner` | 10544/257 | dad5a70f24d4 | 4 | 3146/115 |
| `aigenImage/imageGenerationPresentation` | 2833/66 | 27cc2e4333c8 | 3 | 3747/135 |
| `aigenImage/imageObjectUrlLifecycle` | 3858/78 | 8a9711596baf | 3 | 3990/116 |
| `aigenImage/manifestInputRequirements` | 4584/109 | 141dea39c66d | 4 | 2289/83 |
| `aigenImage/runningHubInstanceControl` | 4783/103 | 6a1d2b6e2d22 | 2 | 3150/96 |
| `aigenImage/uiSchemaControlAdapters` | 10167/273 | c36fb645ebb4 | 3 | 2370/63 |
| `media-clip/mediaClipPreviewView` | 12836/273 | fc639df12d56 | 3 | 3000/100 |
| `media-clip/mediaClipTimelineEditController` | 39419/906 | 88892eae54ba | 4 | 3611/128 |
| `media-clip/mediaClipTimelineViewportController` | 18448/423 | 34a649d5a99a | 6 | 3258/115 |
| `shared/generationDisplayPolicy` | 18822/457 | 1d47a7269fe5 | 5 | 3375/111 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`imageGenerationExecutionOwner`**：按画布 scope 隔离节点运行器；scope 变化后拒绝旧 payload 和生成请求；presentation attach/detach 可重入；dispose 后 owner 拒绝新运行器。
- **`imageGenerationPresentation`**：把节点运行器挂到组件表现层；将生成状态映射到提交中和加载态；unmount 时按 flush、detach、基类 unmount 顺序清理。
- **`imageObjectUrlLifecycle`**：按存储缩略图键缓存 object URL；重复 hydrate 只创建一次；过期键或 dispose 时同时撤销缓存与待处理 URL。
- **`manifestInputRequirements`**：只统计 manifest 支持的输入 kind；显式 `refSlot` 优先于 kind 回退；固定槽或 `minByKind` 未满足时返回缺失描述。
- **`runningHubInstanceControl`**：渲染普通与开发者选项并过滤隐藏值；普通按钮显示当前值，同时预置下一个循环选项；同步函数更新标签和下一普通值。
- **`uiSchemaControlAdapters`**：维护字段适配器与控件适配器的稳定注册表；提供内置 ratio、instanceToggle、textarea 等映射和 `renderAssetInputControl` 兜底；支持自定义注册与配置回滚。
- **`mediaClipPreviewView`**：按宽高比区分横屏、竖屏和窄竖屏；应用布局 class 与 `--media-clip-preview-aspect-ratio`；生成图片或空视频占位 DOM。
- **`mediaClipTimelineEditController`**：解析视频/音频 trim 与 move 预览；滚动视频左裁在非首片时走 roll 路径；提交事务后按剪辑 id 查找活动索引；拖拽期间维护 pending range、播放头和自动滚动状态。
- **`mediaClipTimelineViewportController`**：合并视频与音频材料范围；钳制时间线滚动；把滚动位移计入拖拽 delta；计算边缘自动滚动速度并切换右侧溢出渐隐。
- **`generationDisplayPolicy`**：解析自适应比例和精确比例；生成居中缩放尺寸 patch；按模型 manifest 解析比例字段；挂载 resize 动画并处理 preview transform 与 timer 清理。

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
| src 全量回归 | **7426 / 7383 / 43**（本批新增 37 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` 逐条一致，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 29/37，通过；8 例失败均是测试侧对返回值、DOM 状态、索引或尺寸重算的预期不准。改正测试后 37/37 全绿，移植实现未为测试改写。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 执行 owner、表现层、时间线编辑、预览布局和 resize 动画只验证公开函数的结构、状态或回调契约，不验证真实节点装配、浏览器布局、指针拖拽或媒体解码。
- `runningHubInstanceControl` 的开发者菜单只验证传入 dropdown renderer 的输出拼接，不验证真实菜单挂载。
- 时间线提交只验证单剪辑重算路径；多剪辑 roll、跨轨排版、真实滚动容器与自动滚动帧调度仍留给运行时验收。

## 5. 下一批口径

第 128–141 批累计落首波 **135 件 / 510 例**。全仓未落地件由 771 降到 **636 件**；首波过闸门 260 件中已落 135、余 **125 件**。`src/components` 还有 **11 件**，下一批继续按同工序清该目录。

## 6. 证据文件

`deobf-tools/b141/port/src/components/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
