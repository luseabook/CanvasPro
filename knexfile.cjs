// Short-drama SQLite migration config (A.0 foundation).
// Standalone runner — does NOT touch obfuscated renderer/main bundles.
// DB lives under userData so it survives app updates. Path overridable for CI.
const path = require('node:path');

// 换牌：数据库落在新的 OneFrame 目录；旧 CanvasPro 目录存在时回退复用，
// 避免老用户升级后看到一个空库（不复制数据库文件：SQLite 运行中复制可能拿到半写状态）。
function resolveAppDataDir() {
  const fs = require('node:fs');
  const base = process.env.APPDATA || process.cwd();
  const brand = path.join(base, 'OneFrame');
  if (fs.existsSync(brand)) return brand;
  for (const legacy of ['CanvasPro', 'AI CanvasPro']) {
    const candidate = path.join(base, legacy);
    if (fs.existsSync(candidate)) return candidate;
  }
  return brand;
}

const dbFile = process.env.SHORTDRAMA_DB || path.join(resolveAppDataDir(), 'shortdrama.db');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: { filename: dbFile },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    pool: {
      // better-sqlite3 exec is synchronous — run PRAGMA then signal done.
      afterCreate: (conn, done) => {
        conn.exec('PRAGMA foreign_keys = ON;');
        done(null, conn);
      },
    },
  },
};
