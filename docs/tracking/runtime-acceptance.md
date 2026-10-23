# 运行时验收台账（196 批起）

> 目的：把「代码搬了但没在真机跑过」的欠账显式登记，避免下次开工靠回忆推。
> 状态含义：**已验** = 真实 Electron 里跑过且断言通过；**待验** = 需要真实交互/环境，尚未跑；**受阻** = 依赖未移植的运行时（R15 chrome-shell）。
> 复跑方式：`node test-artifacts/accept-196-217.mjs`（探针，不启动打包版；`test-artifacts/` 被 gitignore，属本机临时工具，丢了按下表重建即可）+ `npx playwright test --config playwright.desktop.config.js`（桌面生命周期 e2e，4 例）。

## 2026-10-23 一轮（217 批）

| 批次 | 改动 | 状态 | 证据 / 缺口 |
|---|---|---|---|
| 启动 | 全部 196–217 改动后能否正常起 | 已验 | 桌面 e2e 4/4：真实启动、受保护媒体、关停、显式丢弃；探针 `boot` 两项：`_isAppLoaded` + `pageerror=0` + 无新增 `console.error` |
| 217 / 212 | 事件批量轮询 | 已验（服务端半程） | 探针在**应用自己的 bridge**（真实 `capabilityHandlers`）上跑通：快照 revision、`known` 去重、事件路径、白名单越界被拒。**客户端半程受阻**：`chrome-shell` 宿主未移植（R15），渲染器无法真的走 HTTP 桥 |
| 209 | 提示词模式按钮 → 下拉 | 已验 | 真实渲染器里 `renderPersonReplacementPromptModeControl` 出的是 `<select>`，常态 3 档（指定替换/全部替换/手动），`bind…` 返回绑定、`sync…` 反向同步生效 |
| 213 | 手打 `@名字` 也算提及 | 已验 | 真实渲染器：`@小明` 命中，`@小明明` 不误判为前缀命中 |
| 215 | 生成按钮图标去抖 | 已验 + **修 bug** | 探针抓到去抖在浏览器里完全没生效（`innerHTML` 与源字符串永远不等）；改为按 `<template>` 规范化后的形态比较，补了模拟序列化的单测 |
| 208 | 官方模型菜单分组 | 待验 | 桌面 e2e 只覆盖菜单开合与 provider 项存在；分组顺序/`data-official-model-catalog` 未断言 |
| 196–198 | 预览同步 27 函数 | 待验 | 需要真实预览面板 + 遮挡场景 |
| 199–200 | 画布滚轮路由 / 拖拽复制 | 待验 | 需要真实缩放/平移/修饰键交互 |
| 205 | 视频节点元信息（fps/帧数） | 待验 | 需要真实视频文件 + 节点信息面板 |
| 206 | `generation.runBatch` | 待验 | 需要 Agent 真正下发批量生成 |
| 207 | 提示音走 desktopBridge | 待验 | 需要在 http-shim 运行时下听声音 |
| 210 | 图片批量张数回退 | 待验 | 需要 modelApi 清单模型 + 未声明 batchSize |
| 214 | 剪辑状态重试 | 待验 | 需要人为制造超时/断网 |
| 216 | 保存失败文案 | 待验 | 需要构造磁盘满/只读目录 |

## 结论与死线

- **能离线验的都已经验了**：协议层用真 bridge + 真 fetch（`electron/desktopEventPoll.integration.test.js`），UI/绑定层用真渲染器（探针）。
- **剩下 8 项都要「点得出来的真实交互」**，靠单测与离线探针替代不了，只能在应用里手工过或补 e2e。
- **客户端半程（212/217）不是代码问题而是宿主问题**：本仓没有 chrome-shell 运行时，`desktopBridge.isChromeShell` 分支在桌面版永不激活。要真正跑到，需要先移植 R15。
- 已知缺陷不在此表：`core/math.js` 的 `findAvailablePosition` 死循环（需单独授权）。
