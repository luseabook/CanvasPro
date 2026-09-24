# R02/R16 本地预览协议运行时（第77批）

## 1. 本批要补的缺口

`electron/main.js` 里仍留着**旧世代的本地预览协议内联实现**（自建 token Map + 手写 Range 解析 + 手写 `protocol.handle` 回调），端口源已把这套逻辑抽成独立模块 `electron/localPreviewProtocolRuntime.js`。

| 内联对应物（本仓位置，接线前） | 行数 | 现状 |
| --- | --- | --- |
| `isPreviewableLocalMedia`(842) | 8 | 删除，改用模块导出 |
| `getMimeTypeForPreview`(850) | 26 | 删除，改用模块导出 `getLocalPreviewMimeType` |
| `resolveLocalPreviewSourcePath`(876) | 4 | 删除，退化为模块内部 `resolveSourcePath` |
| `cleanupLocalPreviewEntries`(880) | 6 | 删除，改为 `runtime.clearExpired` |
| `parseRangeHeader`(886) | 15 | 删除，改为模块导出 `parseLocalPreviewRange` |
| `createLocalPreviewUrl`(901) | 20 | 改为 `runtime.createUrl` 转调 |
| `installLocalPreviewProtocol`(921) | 46 | 改为 `runtime.install` 转调 |
| 模块级状态 `localPreviewProtocolInstalled`(171) / `localPreviewEntries`(194) | 2 | 删除，状态收进 runtime 闭包 |

模块的**生产消费方在本仓真实存在**（`electron/main.js:673` 注入 `createLocalPreviewUrl`，经 `electron/ipc/mainIpcSetup.js:40,165` → `electron/ipc/fileIpc.js:49` 落到 `file:preview-url` 路径；`main.js:2344` 调用 `installLocalPreviewProtocol()` 完成 scheme 注册），故本批**接线**（口径同第70/71/75/76批），无伪造消费方。

端口源仍在的差异（本批**未**改动，仅记账）：端口把 `resolveSourcePath` 与 `parseLocalPreviewRange` 一起收进模块，但不导出 `resolveSourcePath`；本模块同样不导出，`main.js` 内的 `resolveLocalVirtualPath` 保持原样。

## 2. 交付物

| 文件 | 行/字节 | import | 导出 |
| --- | --- | --- | --- |
| `electron/localPreviewProtocolRuntime.js` | 175 / 7 389（端口源 178 / 7 648） | `node:crypto`(`randomBytes`) / `node:fs`(`createReadStream`,`realpathSync`,`statSync`) / `node:path` / `node:stream`(`Readable`) | `parseLocalPreviewRange` / `isPreviewableLocalMedia` / `getLocalPreviewMimeType` / `createLocalPreviewProtocolRuntime` |
| `electron/localPreviewProtocolRuntime.test.js` | 324 / 13 986 | `node:test` / `node:assert/strict` / `node:path` / 被测模块 | 25 个用例 |

命名口径：`electron/**` 新移植文件用**全语义名**（0 个 `_0x`），保留 `![]`/`!![]`、`Object['freeze']`、括号成员访问（`path['basename']`）、十六进制字面量（`0x0`/`0xa`/`0x18`/`0x3e8`/`0xc8`/`0xce`/`0x194`/`0x1f4`）与 `\x20` 等转义；返回值对象沿用显式键值对（`{ clearExpired: clearExpired, createUrl: createUrl, install: install }`）。

### 语义要点

- `parseLocalPreviewRange(rangeHeader, size)`：仅接受 `^bytes=(\d*)-(\d*)$`；`size` 需为安全正整数；支持闭区间、开区间、后缀区间（`bytes=-N`），越界右端夹到 `size-1`。
- `isPreviewableLocalMedia(fileInfo, filePath)`：`image/`/`video/`/`audio/` 前缀直通，否则按扩展名（png/jpe?g/webp/gif/bmp/avif/mp4/webm/mov/m4v/mp3/wav/m4a/aac/ogg/flac）判定。
- `getLocalPreviewMimeType(filePath, type)`：显式 mime 优先，其次扩展名映射，最后 `application/octet-stream`。
- `createLocalPreviewProtocolRuntime({protocol, scheme, appOrigin, ttlMs, resolveLocalVirtualPath, now, createToken, resolveRealPath, statFile, createFileReadStream, toWebStream, ResponseCtor, URLCtor, logWarning})`：**全部协作者可注入**，因此可完全离线测试。`createUrl` 校验绝对路径→真实路径→普通文件→可预览媒体→非空 token，注册 `{path, mimeType, size, expiresAt}` 并返回 `<scheme>://preview/<token>/<basename>`；`install()` 幂等注册 `protocol.handle`，命中 token 后按 `Range` 头返回 206（含 `Content-Range`/`Content-Length`）或 200（含 `Content-Length`）。

## 3. 接线状态

`electron/main.js`：

- 新增 import（第 61 行）：`import { createLocalPreviewProtocolRuntime } from './localPreviewProtocolRuntime.js';`
- 第 840–852 行替换原 842–966 的 125 行内联实现：

```js
const localPreviewProtocolRuntime = createLocalPreviewProtocolRuntime({
  protocol: protocol,
  scheme: LOCAL_PREVIEW_SCHEME,
  appOrigin: APP_ORIGIN,
  ttlMs: LOCAL_PREVIEW_TTL_MS,
  resolveLocalVirtualPath: resolveLocalVirtualPath,
});
function createLocalPreviewUrl(_0x5199a4 = {}) {
  return localPreviewProtocolRuntime['createUrl'](_0x5199a4);
}
function installLocalPreviewProtocol() {
  localPreviewProtocolRuntime['install']();
}
```

- 删除模块级状态 `localPreviewProtocolInstalled`(171)、`localPreviewEntries`(194)；删除仅被内联实现使用的 `import { Readable } from 'node:stream'`(44) 与 `createReadStream` 具名导入（`node:fs` 导入表内）。
- 调用点未变：`main.js:673` 注入 `createLocalPreviewUrl`、`main.js:2344` 调 `installLocalPreviewProtocol()`；`protocol.registerSchemesAsPrivileged`(main.js:198–203) 保持原样（scheme 特权声明与本模块无关）。
- 模块加载期即构造 runtime（端口源同位置同写法）；`resolveLocalVirtualPath` 是函数声明（main.js:1738），提升后可用，无 TDZ。
- `git diff --numstat electron/main.js` = `379 1047`（含第 75/76 批累计未提交改动）。

## 4. 本批已执行的离线验证

| 项目 | 命令 | 结果 |
| --- | --- | --- |
| 语法 | `node --check electron/localPreviewProtocolRuntime.js` / `.../main.js` | 通过 |
| 格式 | `prettier --config deobf-tools/prettierrc.json --check`（新模块、测试、`main.js`） | 全部通过 |
| 新模块单测 | `node --test electron/localPreviewProtocolRuntime.test.js` | **25/25 通过**（首次运行即全绿） |
| `electron/**` 全量 | `node --test --test-timeout=25000 --test-reporter=tap $(find electron -name '*.test.js')` | **1537 / 1536 通过 / 1 失败**（较第 76 批基线 1512/1511/1 净增 25，均为本批新增） |
| 令牌保真 | `cmp-tokens.mjs` | port 1384 / repo 1386，matched 1202；差异全为标识符改名（`V` → 语义名）+ Prettier 括号（`return` 表达式外层） |
| 字面量保真 | `litdiff2.mjs` | port 158 / repo 158，`onlyPort(0)=[]` / `onlyRepo(0)=[]`（字面量逐字节一致） |
| 工作区快照 | `git status` 计数 | `0 / 67 / 449 / 0`（较第 76 批 `0/67/447/0`：+2 为本批新增模块与测试） |

唯一失败用例仍为长期已知项：`fullProjectPackageService.test.js` → `missing manifest coverage cannot bind to an existing unrelated local file`（第 14 批起登记的永久失败，与本批无关）。

## 5. 未执行的验收项（不得当作已完成）

以下均为**行为差异 / 真机项**，本批只做静态与离线验证，**未运行 Electron、未打包、未起真实服务**：

1. `Access-Control-Allow-Origin` 响应头：内联实现**没有**该头，端口模块补上了 `appOrigin`。渲染层经 `aic-local-preview://` 取流时的 CORS 行为需真机验证（预期更宽松，不应回归）。
2. `parseLocalPreviewRange` 的 `isSafeInteger(size) && size > 0` 与后缀区间整数校验：内联 `parseRangeHeader` 没有。理论上更严，需真机确认视频拖动播放（seek）不受影响。
3. `install()` 的幂等由返回值表达（第二次返回 `false`），内联实现靠模块级布尔提前 return；调用点忽略返回值，行为等价，但需在真机上确认 `protocol.handle` 未被重复注册（重复注册会抛错）。
4. `ttlMs` 参数化（`Math['max'](0x1, Number(ttlMs) || 0x1)`）：本仓传 `LOCAL_PREVIEW_TTL_MS`（12h），与内联一致；`Cache-Control: max-age` 换算值不变。
5. 大文件流式与 206 分片在真实 `Response`/`Readable.toWeb` 下的行为（离线测试使用注入的 stub，只验证分支与头部，不验证真实流）。

## 6. 约束复核

- 未触碰 `api/freeImageHostApi.js`（md5 仍为 `1e0458013f5341c99f21faefc1d34d3f`，与工作区手写版一致）。
- 未自动提交、未推送、未触发任何 release；`staged=0`。
- 未改动 `D:\shuocancas` 安装包资源（本批未读 asar）。
- 未新增 npm 依赖；未改 `src/i18n/messages/*.js`；未改任何鉴权检查。
- 未把反混淆临时目录或本机绝对路径写成运行时依赖（模块只依赖 `node:*` 与注入项）。
- 无 `git reset --hard` / `git clean` / 批量 checkout / 目录覆盖；未清理任何未跟踪文件。
- 未伪造消费方：模块的两个生产调用点（`mainIpcSetup` → `fileIpc` 的 `file:preview-url`；`main.js` 的 scheme 注册）在本仓原本就存在，本批只是把内联实现换成模块实现。

## 7. 下一批建议

1. **`electron/nativeContextMenuIcons.js`**（46 行）：依赖 `src/utils/contextMenuIconCatalog.js`（本仓已存在，导出 `resolveContextMenuIconDefinition`），但**消费方需先确认**——若 `main.js` 没有内联对应物，则按“宁可留白并记账”原则不强行接线。
2. `electron/dialogPresenter.js`(331) / `dialogPresenterCore.js`(3667) / `diagnosticsEvidence.js`(2058) / `diagnosticsLaunchVersion.js`(1307) / `mediaTaskRuntime.js`(19065)：其中 `diagnostics*` 两个的消费方是**旧世代** `electron/diagnostics.js`（268 行 vs 端口 663 行，且依赖本仓不存在的 `src/utils/diagnosticError.js`）——**已于第79批完成**（`diagnostics.js` 升到 663 行 / 27 495 B，三件缺失依赖全部落地，57 项离线测试通过，`main.js` 零改动；详见 `docs/diagnostics-generation.md`）；`mediaTaskRuntime` **已于第78批完成**（详见 `docs/media-task-runtime.md`）。
3. 渲染层遗留：`src/core/rendererPanPreviewReconcile.js`（11 189 B，需与其 3 个缺失依赖成组移植）；`b74-scan.mjs` 的 481 个“无级联”渲染层候选；`web-preview/*` 5 条路由的渲染层消费方；`storage-migration/prepare`；`styles/variables.css` 中 44 个 0.7.16 未映射 CSS 自定义属性。
