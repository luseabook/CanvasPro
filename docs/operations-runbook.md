# 统一运维手册（CanvasPro + canvas-admin）

本手册把**两个独立仓库**的运维动作收在一处，内容具体到可照做（含真实路径与命令）。
两个仓库各自独立构建、独立部署；本手册只统一“怎么看、怎么发、怎么回滚、怎么对齐契约”。

- 客户端仓库：`F:\CanvasPro`（Electron 桌面端）
- 服务端仓库：`F:\canvas-admin`（授权/CDKEY 服务 + 管理后台，Docker Compose）

---

## 1. 两仓定位

| | CanvasPro（客户端） | canvas-admin（服务端） |
| --- | --- | --- |
| 形态 | Electron 桌面应用 | Docker Compose（PostgreSQL + Redis + license-api + admin-api + nginx） |
| 出包/发布 | electron-builder 出包 → GitHub Releases → `electron-updater` 自动更新 | 构建镜像 → 容器上线 |
| 生产主机 | ——（分发到用户端） | `14.103.49.35` |
| 域名 | 更新源 `github.com/luseaer-ship-it/CanvasPro/releases/latest/download/latest.json` | license 面 `api.1e1e.cn`；管理面 `canvas.1e1e.cn` |
| 关键入口 | `electron/main.js` | `deploy/deploy.sh`、`deploy/docker-compose.yml` |

单个仓库的详细说明见各自 README：`F:\CanvasPro\README.md`、`F:\canvas-admin\README.md`。

---

## 2. 客户端发布（CanvasPro）

```bash
cd F:\CanvasPro

# 1) 门禁：反混淆 + CSP（两者必须为绿）
npm run check:obfuscation      # node tools/deobf-gate.mjs
npm run check:csp              # node tools/check-csp.mjs

# 2) 出包（Windows；electron-builder --publish never：只出本地产物，不上传）
npm run build:win

# 3) 打包内容校验
npm run check:package          # node tools/check-package.mjs

# 4) 发布：把 build:win 产物上传为 GitHub Release，
#    并确保 Release 附带 latest.json（electron-updater 的更新清单）
```

发布后确认更新源可用：`https://github.com/luseaer-ship-it/CanvasPro/releases/latest/download/latest.json`。

**回滚方式**：客户端只信任更新清单指向的版本。回滚时**不要删旧 Release**，而是
发布一个版本号更高的补丁版本（含回滚后的代码）走同一条发布链路；旧的安装包/Release
保留以便人工下载。切勿引导用户“降级安装”——`electron-updater` 默认不降级。

> 版本号在 `F:\CanvasPro\package.json` 的 `version` 字段维护，发版时同步提升。

---

## 3. 后台上线（canvas-admin）

```bash
cd F:\canvas-admin\deploy

# 首次：cp env.example .env 并填强随机值（禁止提交 .env）
./deploy.sh
```

`deploy.sh` 会（见脚本注释）：

- 校验 `.env` 必填项（`POSTGRES_PASSWORD` / `JWT_SECRET` / `CDKEY_HMAC_KEY` /
  `CDKEY_ENC_KEY` / `OWNER_USERNAME` / `OWNER_PASSWORD`）与最小长度，拒绝 `REPLACE_*` 占位值；
- 校验 `CDKEY_ENC_KEY` 为恰好 32 字节的 base64；
- 探测主机 nginx 形态（`standalone` 裸机 / `panel` 宝塔面板）并分别处理；
- `docker compose up -d --build`（含 `migrate` 服务：`alembic upgrade head`）；
- 轮询 `http://127.0.0.1:18080/healthz`（Host: `api.1e1e.cn`）直到就绪；
- 创建 owner（`docker compose run --rm ... admin-api python -m app.bootstrap_owner`，仅账号不存在时创建）。

**迁移**：由 Compose 的 `migrate` 服务在启动前执行 `alembic upgrade head`；手工执行：
`docker compose run --rm migrate`。

**冒烟**：脚本内已包含 `curl -H 'Host: api.1e1e.cn' http://127.0.0.1:18080/healthz`
与 `canvas.1e1e.cn` 的检查；standalone 模式还会用 `--resolve` 校验 443 端口。

**回滚方式**：保留上一版**镜像 tag**。容器重建前记录当前镜像 tag，回滚时把
`docker-compose.yml` 指向上一 tag 后 `docker compose up -d`。数据库如需回退：
`alembic downgrade <revision>`，或用 `deploy/restore.sh` 恢复备份（见第 6 节）。

---

## 4. 契约变更流程（跨仓对齐）

两侧的**契约版本**由各自代码声明：

- 后台：`F:\canvas-admin\backend\app\services\client_config_service.py` 的
  `CONTRACT_VERSION`，经 `/api/client-config` 以顶层系统字段 `contractVersion` 下发；
- 客户端：`F:\CanvasPro\backend\services\subscription_client.py` 的
  `SUPPORTED_CONTRACT_VERSIONS`（声明客户端支持的集合）。

### 改契约字段的正确顺序

1. **先升** `CONTRACT_VERSION`（后台），并在客户端 `SUPPORTED_CONTRACT_VERSIONS`
   中同步支持该版本（若客户端已能兼容则加入集合）；
2. 跑**两侧契约测试**：
   - 后台：`cd F:\canvas-admin\backend && .venv\Scripts\python.exe -m pytest tests -q`
   - 客户端：`cd F:\CanvasPro && node tools\run-backend-tests.mjs`
   - 并在 `F:\CanvasPro` 跑 `node tools\canvas-workspace.mjs status` 确认“✅ 契约版本一致”；
3. **后台上线**（第 3 节）；
4. 确认**客户端向后兼容**（旧客户端遇到新后台：`contractVersion` 超出支持集合时只打
   WARNING，不阻断授权，见 `subscription_client._normalize_client_config`）；
5. **再发客户端版本**（第 2 节）。

> 原则：后台先行走兼容变更，客户端随后跟进；任何一侧都不得因契约不匹配而阻断授权，
> 客户端必须继续按宽限/离线逻辑工作。

### 手动演练步骤（验证漂移检测真的会响）

```bash
# 1) 临时把后台契约版本改成一个客户端**不支持**的值
#    编辑 F:\canvas-admin\backend\app\services\client_config_service.py
#    将 CONTRACT_VERSION = "2026.10" 改为例如 "2026.11"

# 2) 期望：总览工具报漂移，且以非 0 退出码结束
cd F:\CanvasPro
node tools\canvas-workspace.mjs status
#   → ❌ 契约版本漂移：后台 2026.11 不在客户端支持集合 [2026.10] 内

# 3) 期望：CanvasPro 契约测试变红（后台版本不在客户端支持集合）
node tools\run-backend-tests.mjs
#   → backend.services.test_subscription_contract_version
#     SubscriptionContractVersionCrossRepoTests
#     .test_backend_declared_version_is_in_client_supported_set 失败

# 4) 改回 CONTRACT_VERSION = "2026.10"，重跑上两步 → 恢复绿
```

### 为什么暂不加自动触发的 GitHub Actions 门禁

跨仓自动触发需要在一个仓库的 workflow 里用 `PAT` 触发另一个仓库的
`repository_dispatch`，或在两侧分别拉取对方仓库。这需要配置**跨仓访问密钥/secret**，
而本机环境**无法验证**这些 secret 的真实行为（触发链路依赖 GitHub 侧凭证），
直接写进仓库会有“看似自动化、实则从未被触发过”的假保证风险。

因此**先以本手册 + `canvas-workspace.mjs` + 两侧契约测试固化**。若将来要自动化，
所需材料清单：

- 一个具备 `repo`（或细粒度 `contents:read` + `actions:write`）权限的 **PAT**，
  存为**发送方仓库**的 Actions secret（例如 `CANVASPRO_DISPATCH_TOKEN`）；
- 接收方仓库配置 `repository_dispatch` 触发的 workflow；
- workflow 草稿建议位置：发送方 `.github/workflows/`（例如
  `canvas-admin` 仓库根下的 `.github/workflows/`），内容为“升版本后向对端
  `repository_dispatch` 发事件，对端跑契约测试”。

---

## 5. 密钥轮换

> 以下流程**照抄并指向** `F:\canvas-admin\README.md` 已有章节，不自创流程。

### CDKEY 查找键 `CDKEY_HMAC_KEY`

轮换时需**先把旧值放入 `CDKEY_HMAC_PREVIOUS_KEYS`（逗号分隔）**，以继续查找既有
CDKEY；更换后重启服务。（见 `README.md` “本地开发”小节末段。）

### CDKEY 加密密钥 `CDKEY_ENC_KEY`

见 `README.md` → “CDKEY 加密密钥轮换”：

1. 先验证数据库备份可恢复；把旧 `CDKEY_ENC_KEY` 放入 `CDKEY_ENC_PREVIOUS_KEYS`；
2. 配置新的 32 字节 base64 `CDKEY_ENC_KEY`，重启服务；
3. 在 `backend/` 执行 **只读预检**：`python scripts/reencrypt_cdkeys.py`；
4. 确认失败数为 0 后执行 `python scripts/reencrypt_cdkeys.py --apply --confirm-backup`；
5. 抽样验证查看/导出，完成备份轮换后删除旧环境密钥。

脚本在任何一行无法解密时**整体回滚**，不允许带失败记录提交部分迁移。

### `JWT_SECRET`

轮换会使**旧 JWT 立即失效**（见 `README.md`：轮换 JWT_SECRET 会立即使旧 JWT 失效）。

### 离线缓存私钥 `OFFLINE_CACHE_PRIVATE_KEY_B64`

见 `README.md` → “离线授权缓存签名（发版前必须配置）”：

- 在可信终端运行 `python backend/scripts/generate_offline_cache_key.py`；
- 把 `OFFLINE_CACHE_PRIVATE_KEY_B64` 放入部署密钥管理器 / `.env`；
- 将输出的**公钥模数**固定到 CanvasPro `backend/services/offline_cache_verifier.py`
  **之后**再构建客户端；私钥绝不可提交或发到聊天中。

---

## 6. 监控与备份（`F:\canvas-admin\deploy\`）

仓库中**已存在**的脚本与建议周期（不在本手册发明新脚本）：

| 脚本 | 用途 | 建议周期 |
| --- | --- | --- |
| `backup.sh` | PostgreSQL 全量备份 + 保留期清理 + 失败告警（`BACKUP_DIR` 默认 `/var/backups/canvas-admin`，`BACKUP_RETENTION_DAYS` 默认 30） | 每日（脚本注释示例：`15 3 * * *`） |
| `restore.sh` | 从 `.sql.gz` 备份恢复数据库（覆盖式，执行前先备份当前库并停写入方） | 按需 |
| `alert.sh` | 把一句告警发到 `ALERT_WEBHOOK_URL`（兼容企业微信/飞书/Slack）；未配置时静默退出 | 被 `backup.sh` / `renew-certs.sh` 调用 |
| `renew-certs.sh` | 续期 `api.1e1e.cn` / `canvas.1e1e.cn` 两张证书并 reload nginx | 主机 cron 定期执行 |

> 注意（来自 `backup.sh` 注释）：`backup.sh` **只备份 PostgreSQL 数据**；
> `CDKEY_ENC_KEY` / `JWT_SECRET` / `CDKEY_HMAC_KEY` 等密钥必须**单独备份**
> （见 `deploy/RESTORE.md`），否则即使有数据也无法解密 CDKEY 明文。

---

## 7. 红线清单

- **密钥绝不进客户端安装包**：`CDKEY_HMAC_KEY` / `CDKEY_ENC_KEY` / `JWT_SECRET` /
  `OFFLINE_CACHE_PRIVATE_KEY_B64` 只存在于服务端部署环境；客户端只保留由后台下发的
  公开配置与固定的离线缓存**公钥模数**。
- **`appId` 保持 `com.aicanvaspro.editor` 不变**：`electron-builder.win.cjs` 源码注释明确
  “Preserve the existing bundle identity so installs upgrade in place”——改动会破坏
  就地升级。
- **`F:\CanvasPro\api\freeImageHostApi.js` MD5 不变**：保持
  `1e0458013f5341c99f21faefc1d34d3f`（受保护装配件，本方案未触碰）。
- **契约版本与测试联动**：改动契约字段必须同步升 `CONTRACT_VERSION`、同步客户端
  `SUPPORTED_CONTRACT_VERSIONS`，并跑两侧契约测试（第 4 节）。
- **不物理合并两个仓库**：`.code-workspace` / submodule 聚合仓都只是视图，
  两个仓库仍独立构建、独立部署（见 `docs/单仓工作流.md`）。
