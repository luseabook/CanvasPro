# 第 139 批：首波第十二批（`src/components` 第三批 10 件）

> 第 127 批首波 260 件里的第十二批，沿用 §4 单批工序：**落地不接线**。
> 源 10 件共 **20 663 B / 439 行**；测试 10 个同名件共 **26 193 B / 812 行**，**28 例**。
> 本批把 `src/components` 首波候选从 41 件降到 31 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | --- |
| `media-clip/mediaClipReverseControl` | 1687/46 | e618117e4e6c | 3 | 1936/57 |
| `nodeToolbar/imageActions/localEditAction` | 1739/42 | e4767ddb98fc | 2 | 3060/111 |
| `promptExpansionMotion` | 2182/61 | c345705f472a | 3 | 3252/112 |
| `source-video/sourceVideoManualPlayback` | 1990/47 | e7cdb63d78b4 | 3 | 3841/111 |
| `aigenImage/imageModelMenuBinding` | 2067/52 | 6286be09391a | 2 | 2754/96 |
| `source-video/sourceVideoPlaybackFeedback` | 2157/43 | 7a3226df3719 | 4 | 3347/109 |
| `shared/openAiLogo` | 1955/15 | 72ffb45bf822 | 2 | 801/20 |
| `aigenImage/uiSchemaParameterGroups` | 2363/56 | b89bb4763ea8 | 3 | 1914/54 |
| `audio-node/audioWorkflowRefSlots` | 2308/43 | d3320390bf95 | 3 | 1679/40 |
| `video-node/footerShell` | 2215/34 | 2bcacf6c8fdb | 3 | 3609/102 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`mediaClipReverseControl`**：反转状态决定标签与 ARIA，pending 时显示倒放中；时间区间按媒体总时长镜像并夹紧；图标 HTML 使用固定三路径。
- **`localEditAction`**：绑定 `.act-local-edit` 到 RunningHub 任务按钮；点击或 `image-local-edit-open` 时聚焦节点并以 `repaint`、`erase` 或 `local-edit` 打开图像标注控制器。
- **`promptExpansionMotion`**：读取源/目标矩形与 overlay 透明度，用 Web Animations 做展开/关闭动画；reduced motion、缺尺寸和完成回调走短路或收尾分支。
- **`sourceVideoManualPlayback`**：手动播放切换维护 loop、剪切片复位和恢复播放；播放失败回滚手动 loop 状态，再次切换时暂停并恢复悬停状态。
- **`imageModelMenuBinding`**：扫描声明了子菜单的节点菜单，分别绑定 Dreamina、Grsai、Apimart、Volcengine、RunningHub 与通用解析器，选择后更新触发图标。
- **`sourceVideoPlaybackFeedback`**：源未就绪时显示 loading 和 `aria-busy`，恢复播放统一走 `playVideoWithRecovery`，无论结果都在 `finally` 清理反馈。
- **`openAiLogo`**：过滤 class 中的非法 token，生成固定 OpenAI 路径和 SVG 属性，不注入调用方提供的 HTML。
- **`uiSchemaParameterGroups`**：按 `footerGroup.id` 聚合字段并保持首次出现顺序；无组字段直接渲染，组内字段使用 `groupRow`。
- **`audioWorkflowRefSlots`**：从 manifest 的 `fixedSlots` 解析音频/图片槽、输入上限和多音频能力，并修复重复或无效的 `refSlot`。
- **`footerShell`**：先解析视频模型类型，清理旧 UI schema 与底栏控制器，再渲染模型触发器和生成按钮并缓存按钮节点。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 20/20 通过 |
| 源文件与外部暂存产物逐字节比对 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **28 / 28 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是「落地不接线」 |
| src 全量回归 | **7352 / 7309 / 43**（本批新增 28 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` 逐条一致，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 10/10 均因目标模块不存在而失败；落地后 28 例有 4 例为测试侧顺序或前置状态预期，改正后 28/28 全绿，移植实现未为测试改写。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 图像标注、菜单绑定、底栏壳和播放反馈只验证回调与状态契约，不验证真实节点装配、浏览器布局或媒体解码。
- 反转区间和参数组排序只覆盖纯函数分支；真实视频元素、Web Animations 和 DOM 属性同步仍留待接线验收。
- 音频 workflow 参考槽只验证 manifest 读取与 `refSlot` 归一，不发起真实生成请求。

## 5. 下一批口径

第 128–139 批累计落首波 **115 件 / 436 例**。全仓未落地件由 771 降到 **656 件**；首波过闸门 260 件中已落 115、余 **145 件**。`src/components` 还有 **31 件**，下一批继续按同工序清该目录。

## 6. 证据文件

`deobf-tools/b139/port/src/components/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
