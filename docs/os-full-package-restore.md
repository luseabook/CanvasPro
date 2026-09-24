# 第二十二批：系统打开 `.aicpkg` → 独立恢复完整工程

更新：2026-09-24。R14 有限源码增量，**未执行测试、构建、桌面应用、真实工程包恢复或保存重开验收**。本批补第21批记录的系统包直达缺口；不迁移本机任务历史、不改安装目录。

## 已核对的原链路

- 系统 `open-file`、启动参数及第二实例已通过 `electron/main.js` 把 `.aicpkg` 放入外部打开队列；第21批限定主窗口消费并串行处理。但当时通知携带真实路径，前端调用原 `importPackage`，只把包内**活动画布**加入当前工程。
- 第17批已有另一个“恢复完整工程包（独立工程）”菜单：宿主严格读 ZIP/路径/容量与 SHA-256，原生确认后独占落盘新的 `.aicanvas` 和素材目录；前端再次确认是否切换，拒绝切换也保留文件。其原 IPC 故意不接受渲染器给的任意文件路径。本批复用这条链路，不重造解包或另造项目格式。

## 新接线与保护

1. 主进程仅在自己收到有效绝对 `.aicpkg` 路径时签发192位随机票据，`externalPackageTickets.js` 内存保存真实路径。队列交付 `{kind:'fullProjectPackage', externalPackageTicket, filename, source}`，成功或签发失败的包通知**不再附带真实路径**；原主进程诊断日志仍可能包含原路径。票据十分钟过期、最多32个在途、仅能消费一次；无宿主持久投递或自动恢复承诺。
2. 前端收到新通知，要求合法票据及宿主 `externalPackageTickets:1` 能力，复用 `runFullProjectPackage` 现有画布快照与切换守卫；不回退旧 `importPackage`、不让旧宿主偷偷只导入一张画布。若收到旧宿主的 `kind:'projectPackage'`，显示改用“恢复完整工程包（独立工程）”原生选包菜单的提示，不自动追加当前画布。
3. `project:restoreFullPackage` 仍仅允许主应用窗口主 frame/本地 app URL 调用。菜单恢复**没有票据时照旧弹原生选包**；有票据时宿主核销并取回原系统路径，忽略渲染器夹带的 `path`，无效/重放/过期票据直接拒绝，不回退到选择器或旧单画布导入。
4. 原宿主先严格校验包及内容，再在原生确认框中显示系统包来源路径与画布/节点/素材汇总；用户确认后才写入**新的**工程及素材目录，不覆盖现有文件。当前工程的原生二次切换确认及完整数据守卫保留；切换被拒绝时给出已落盘独立文件的可复制路径。原“加载项目包”菜单/拖入单包的活动画布追加行为不变。

## 明确保留的边界

- 操作系统须先把 `.aicpkg` 路径交给应用的打开事件/命令行；此批**不注册 Windows/macOS 文件关联或修改安装器**。无系统关联时仍用已有菜单原生选包。
- 票据不是文件真实性签名或崩溃恢复队列，文件在签发与读取间仍可变化；ZIP 哈希只校验包内一致性。校验/取消/失败后票据不复用，需重新从系统打开或用菜单；窗口未就绪/已有完整包操作/超过十分钟可能拒绝，且原外部打开通知队列仍非 durable/exactly-once。
- 原服务 10 GiB 包/展开总量、64 MiB 工程正文、100 张画布等容量规则不变；素材复制后当前工程可不切换，但独立落盘文件保留。当前工程在途状态或超限会被原完整恢复会话拒绝，不自动保存、不自动重发任务；系统打开 **不**替代原单包菜单。
- 未引入浏览器任意路径授权，也未搬迁旧存储/宿主任务历史。`desktopProjectFileStore.readProjectJson()` 无体积上限的旧问题与系统文件关联缺口另行跟进。

## 文件、检查与待授权验收

新增 `electron/externalPackageTickets.js`、`electron/externalPackageTickets.test.js`；修改 `electron/main.js`、`electron/projectPackageController.js`、`electron/fullProjectPackageController.js`、`electron/ipc/projectIpc.js`、`src/modules/projectPackage/fullProjectPackageSession.js`、`src/modules/CanvasProjectDropdownManager.js`，并在原 `electron/fullProjectPackageController.test.js`、`src/modules/projectPackage/fullProjectPackageSession.test.js` 补案例。共新增**13项离线测试源码**（票据5、宿主控制器4、前端会话4），**未执行**；旧完整包测试也未执行。

实际仅做目标机10个相关JS的纯语法 `node --check`（exit0）、10处现有编辑器error诊断0、交付SHA/Git核对；静态检查不证明恢复成功。待授权后先运行（本批未运行）：
```powershell
node --test electron/externalPackageTickets.test.js electron/fullProjectPackageController.test.js src/modules/projectPackage/fullProjectPackageSession.test.js
```

仍需真实多画布包往返、OS传参/双击/第二实例、包内素材与最近工程记录、主窗口关闭/渲染器重载、十分钟过期与并发、原生确认拒绝/已落盘保留、旧宿主/错版本/伪造票据、损坏或替换的包、原单画布菜单/拖包和保存重开回归。**没有这些运行证据，不宣称功能已验收。**
