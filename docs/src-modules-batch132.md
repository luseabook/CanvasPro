# 第 132 批：首波第五批（语音片段编辑、画布编辑命令、协作面板、替换剪辑交互等 9 件）

> 第 127 批首波 260 件里的第五批，沿用 §4 单批工序，**落地不接线**。
> 源 9 件共 **155 282 B / 3 700 行**；测试 9 个同名件共 **66 037 B / 2 043 行**、**47 例**。
> 本批落地后，首波过闸门的 `src/modules` 候选清零。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | --- | --- | ---: | --- |
| `audioVoicePanelSegmentEditing` | 18373/438 | 1a2923c1fcc9 | 7 | 9062/283 |
| `canvasCommands/editingCommands` | 14028/329 | 53830fe5f1ad | 6 | 6044/190 |
| `collaboration/collaborationPanel` | 21270/501 | de9b855c783e | 2 | 13581/442 |
| `personReplacement/personReplacementShotCutInteractionController` | 23235/524 | 1321d2d4b922 | 5 | 8029/274 |
| `personReplacement/personReplacementShotSelectionRendering` | 22927/508 | 8b5d2a36ecd1 | 5 | 6280/183 |
| `runninghubAiApp/rhAiAppConfigRepository` | 13525/344 | f76f5e2056d1 | 4 | 6848/226 |
| `whiteboard/whiteboardBackgroundInput` | 12070/327 | 4ad9afa86bea | 6 | 4791/152 |
| `whiteboard/whiteboardLayerTransform` | 12666/299 | 245d6752c601 | 6 | 5005/139 |
| `workspaceAssetPresentation` | 17188/430 | 299eec9b93c3 | 6 | 6397/154 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`audioVoicePanelSegmentEditing`**：相邻片段合并以第一段 id、起点和媒体信息为基础，文本拼接、合并区间，并清空转换音频与任务状态；当前合并是否有效按两段完整快照指纹判断。异步源音频合并把两段时间长度相加后交给 `composeAudio`，并写入新的源剪辑基准。提交区间编辑会裁切显式范围、保留基准时间；文本和翻译结果变更会清除已转换音频。
- **`canvasCommands/editingCommands`**：注册 `node.group`、`node.ungroup`、`clipboard.copy`、`clipboard.paste`、`collage.createFromSelection` 五条命令。分组只接受仍存在的节点 id，在单次 `batch` 内建组、绑定节点并选中新组；解组只处理 group 类型，把子节点移出后删除组壳。复制与粘贴复用剪贴板图快照，拼图只接受有效图片节点。
- **`collaboration/collaborationPanel`**：面板包含授权入口、协作大厅、房间现状、成员、邀请、活动、冲突与离线任务区。未认证时显示授权入口，有会话时显示房间体；结束联机先进入二次确认，再按房主身份显示“保存并确定”。外部指针事件、取消和 `destroy` 会解除监听及模态交互作用域。
- **`personReplacementShotCutInteractionController`**：把指针位置换算到镜头切口时间，边界拖动按左右片段同步修改区间与时长。智能检测会请求设置和项目上下文、替换草稿、切回首个片段并提示结果；提交失败可恢复调用方传入的草稿与撤销栈。重置和撤回会同步倒放草稿与项目，并处理同步异常。
- **`personReplacementShotSelectionRendering`**：按稳定键增量协调元素树、镜头卡、时间线卡、参考输入槽和视频镜头选择页。同键文本节点原位更新，结构不匹配时替换整棵树；参考输入使用槽位 id 保留未变化节点，镜头卡和时间线在缺少任一侧时拒绝执行。
- **`rhAiAppConfigRepository`**：本地种子会归一来源类型、应用类型、名称、描述、提示工具和厂商档案，过滤无 id 或无输入记录；面板草稿按类型键归一。保存应用记录保留 id 与创建时间并刷新更新时间。外部文件桥异步回读后应用快照；写回通过 250ms 去重定时器调度，可立即 flush，并在销毁时清理定时器。
- **`whiteboardBackgroundInput`**：背景输入只接受图片和视频类型，拒绝文本；从页面结构中寻找最近的有效图片或视频边，并归一出显示地址、缩略图、封面和缓存身份。世界矩形按视口与缩放投影到画布，保持比例并回落到默认画幅；背景尺寸按面积计算，不超过原始尺寸且保证最小边。
- **`whiteboardLayerTransform`**：白板图层变换支持画笔、橡皮、矩形、形状、箭头和编号标签。几何层按类型计算包围盒、四角与控制柄，命中半径按屏幕像素换算到世界坐标；会话支持移动、缩放和旋转，缩放夹在 5% 到 40 倍，矩形和形状的旋转写回角度，原始基准对象保持不变。
- **`workspaceAssetPresentation`**：素材表现层负责删除控件、图片动作、声音状态、页签图标、加载浮层、切换箭头和完整素材卡 HTML，所有属性与文本均转义。滚轮方向支持像素、行和页三种单位并带方向锁；页签切换方向按给定顺序判断；悬停预览过滤有图外观，输出列数、声音引用状态和网格 HTML。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 18/18 通过 |
| 源文件与外部暂存产物逐字节比对 | 9/9 相同 |
| `node --check` | 18/18 通过 |
| 导出闸门 `b123-gate.mjs` | 9/9，`MISSING_TOTAL=0` |
| bare node 导入 | 9/9 成功，无顶层 DOM 副作用 |
| 本组单测 | **47 / 47 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7185 / 7142 / 43**（新增 47 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 47 例中 **14 例失败**，全部是测试侧问题，未改移植实现。主要原因是协作面板假 DOM 的 `querySelectorAll` 只支持类名而不支持 `button` 标签选择，替换渲染测试在断言前已被 `replaceChildren` 移动了期望节点引用，`resetDraft` 夹具缺少 `project.workspace.selectedShotId`，另有若干期望把实现契约写错：源音频合并是两段长度相加而不是区间并集，`saveSavedApps` 不返回布尔值，舞厅隐藏态实际由授权入口承担，旋转柄偏移是 24 世界像素。其余失败是数组包裹层、提交态初值和 CSS 类名空白量。修正测试后 47/47 全绿。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 协作面板、素材卡和稳定 DOM 协调使用假 DOM，真实浏览器布局、焦点和指针行为未验收。
- 白板变换只覆盖纯函数与会话；真实画布事件、触摸指针和渲染结果未验收。
- RunningHub 外部文件桥只使用内存替身，未连接真实桌面桥或自定义 AI 应用目录。
- 未提交、未推送。

## 5. 下一批口径

第 128–132 批累计落首波 **49 件、269 例**。全仓未落地件由 771 降至 **722 件**；首波过闸门 260 件中已落 49、余 **211 件**。该 211 件为 `src/core` 36、`src/components` 61、`src/manifests` 20、`api` 直属 41、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2。下一批转 `src/core`，先做不改变在用行为的纯新增件。

## 6. 证据文件

`deobf-tools/b132/port/`（9 件格式化产物）；回归证据 `b131-src-raw.tap`、`b131-src-raw.err`、`b131-src-fails-raw.txt`、`b131-failure-comparison.json`、`b131-api-raw.tap`、`b131-api-raw.err`。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
