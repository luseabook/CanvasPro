# 第 134 批：首波第七批（src/core 绘制、视口与状态基础件 10 件）

> 第 127 批首波 260 件里的第七批，沿用 §4 单批工序，**落地不接线**。
> 源 10 件共 **17 372 B / 428 行**；测试 10 个同名件共 **21 601 B / 675 行**、**25 例**。
> 本批把首波 `src/core` 候选从 26 件降至 16 件。

## 1. 落地清单

| 模块 | 源 B/行 | sha256 前 12 | 用例 | 测试 B/行 |
| --- | ---: | --- | ---: | ---: |
| `nodeGeometryOverlay` | 1320/30 | 13c860f007bb | 2 | 1299/36 |
| `rendererRasterPaintSurface` | 1500/42 | 7fc1d1ea4e8e | 2 | 2035/71 |
| `stores/storyboard3dProjectState` | 1343/28 | b6254e539b82 | 3 | 2334/75 |
| `rendererRasterPaintPlan` | 1464/30 | ef6343e5e5ec | 2 | 1883/67 |
| `rendererPresentationSubscription` | 1778/56 | 1db9e8bd3155 | 3 | 3972/130 |
| `mediaSelectionMath` | 1749/39 | e858f4cec17b | 2 | 1291/43 |
| `nodeGeometryPreview` | 1755/40 | 2e89722ad78a | 3 | 2559/75 |
| `stores/nodeFieldSubscriptions` | 2238/59 | a03bf40a8b6b | 2 | 1641/45 |
| `rotationMath` | 2025/47 | 022acc778405 | 3 | 1541/48 |
| `stores/modelMenuPreferenceStore` | 2200/57 | 91720fc1b0e9 | 3 | 3046/85 |

## 2. 冻结的端口行为（写测试时的契约，摘要）

- **`nodeGeometryOverlay`**：只覆盖已有节点，合法覆盖项可分别更新尺寸或坐标；通过原型链生成新对象，源对象和未覆盖条目保持原引用；没有合法覆盖时返回源对象。
- **`rendererRasterPaintSurface`**：有可用的离屏后备画布时，绘制上下文切到后备画布，缩放同步主画布与后备尺寸，`present` 使用 `copy` 且关闭平滑，`release` 将后备画布缩为 1×1；后备创建失败时退回主上下文。
- **`stores/storyboard3DProjectState`**：项目集合只接受数组；按规范化 id 定位并更新或前插，写入独立集合；删除只接受存在的项目，非数组或未命中时返回 `false`。
- **`rendererRasterPaintPlan`**：绘制计划只在比例键、世界边界、调色板、准入来源集合及条目字段和来源序列全部一致时复用；条目上的额外字段不参与比较。
- **`rendererPresentationSubscription`**：原始订阅快照可合并到一帧，同帧内保留最后一次；选择刷新可以拦截快照；暂停只停止渲染调度，恢复时会重放最近快照；销毁取消帧并解除订阅。
- **`mediaSelectionMath`**：归一化裁剪用向下取整定位、四舍五入取尺寸并保证至少 1 像素；拖动矩形会夹到 `0..1`，支持反向拖动并返回标准化矩形。
- **`nodeGeometryPreview`**：全局与分层几何预览分开存储，只保留 `x/y/width/height` 中的有限数值；读取时全局优先、再按图层回退；设置和实际删除会通知订阅者。
- **`stores/nodeFieldSubscriptions`**：订阅时立即发送当前字段值；`touch` 和 `reload` 标脏，`flush` 只向存活的监听器发送变更；取消最后一个监听器会移除字段状态。
- **`rotationMath`**：角度归一到 `[-180, 180)` 并保留一位小数；旋转尺寸按正角计算；图片布局可选缩放到原画幅；逆变换使用反向旋转。
- **`stores/modelMenuPreferenceStore`**：偏好按版本存储在 `localStorage`，版本前导 `v` 会去掉；只有布尔 `true` 会打开隐藏未配置项；状态冻结、变更通知和窗口事件在存储失败时仍继续。

## 3. 验证结果（全部实跑）

| 检查 | 结果 |
| --- | --- |
| Prettier（`prettierrc.json`） | 20/20 通过 |
| 源文件与外部暂存产物逐字节比对 | 10/10 相同 |
| `node --check` | 20/20 通过 |
| 导出闸门 `b123-gate.mjs` | 10/10，`MISSING_TOTAL=0` |
| bare node 导入 | 10/10 成功，无顶层 DOM 副作用 |
| 本组单测 | **25 / 25 / 0** |
| 消费方反查 | 真实命中 **0**，确认仍是“落地不接线” |
| src 全量回归 | **7231 / 7188 / 43**（新增 25 例） |
| src 失败名单 | 43 项与 `b85-fails.txt` **逐条一致**，新增 0、消失 0 |
| api 全量回归 | 791 / 791 / 0（未变） |
| 受保护文件 | `api/freeImageHostApi.js` MD5 仍为 `1e0458013f5341c99f21faefc1d34d3f` |

首跑 25 例中 **3 例失败**，全部是测试侧问题：暂停态实际上仍会接收并缓存快照但不安排渲染；角度 `359.94°` 归一为 `-0.1°` 而不是 `180°`；字符串 `'true'` 不应按布尔 `true` 处理。修正测试后 25/25 全绿，未改移植实现。

## 4. 未执行项与边界

- 未启动应用、未构建、未做真机验收；本批全部是**落地不接线**，运行时行为零变化。
- 离屏画布、帧调度、几何预览和节点字段订阅均只使用内存替身，真实浏览器绘制、帧时序与节点存储未验收。
- 媒体裁剪、旋转和模型菜单偏好没有连接真实媒体元素、画布指针和目标设置面板。
- 未提交、未推送。

## 5. 下一批口径

第 128–134 批累计落首波 **69 件、315 例**。全仓未落地件由 771 降至 **702 件**；首波过闸门 260 件中已落 69、余 **191 件**。该 191 件为 `src/core` 16、`src/components` 61、`src/manifests` 20、`api` 直属 41、`src/domain` 14、`api/adapters` 12、`src/services` 10、`src/utils` 8、`vendor/three` 4、`api/errors` 3、`vendor/mediapipe` 2。下一批继续做 `src/core` 的纯新增件。

## 6. 证据文件

`deobf-tools/b134/port/src/core/`（10 件格式化产物）；回归证据来自本次实跑的 `b131/sweep-raw.mjs` 输出。导出闸门结果来自 `b123-gate.mjs` 的本次实跑输出。
