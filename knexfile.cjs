// Short-drama SQLite migration config (A.0 foundation).
// Standalone runner — does NOT touch obfuscated renderer/main bundles.
// DB lives under userData so it survives app updates. Path overridable for CI.
const path = require('node:path');

const dbFile =
  process.env.SHORTDRAMA_DB ||
  path.join(process.env.APPDATA || process.cwd(), 'CanvasPro', 'shortdrama.db');

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: { filename: dbFile },
    useNullAsDefault: true,
    migrations: { directory: path.join(__dirname, 'db', 'migrations') },
    pool: {
      // better-sqlite3 exec is synchronous — run PRAGMA then signal done.
      afterCreate: (conn, done) => { conn.exec('PRAGMA foreign_keys = ON;'); done(null, conn); },
    },
  },
};
