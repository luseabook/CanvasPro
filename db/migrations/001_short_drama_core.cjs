// 17 短剧表，按 01-architecture.md §3.1 原文建表,依赖序:project/user/setting →
// novel/event/eventChapter → script → assets/scriptAssets/role2audio →
// storyboard/assets2storyboard → image/video/videoTrack → tasks/agentWorkData.
// 用 raw SQL 1:1 平移文档,避免 builder 描述偏差。
exports.up = async function up(knex) {
  const sql = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'shortdrama-schema.sql'), 'utf8');
  // better-sqlite3 执行单条语句,逐条跑;包一层事务保证 17 表原子建成。
  await knex.transaction(async (trx) => {
    for (const stmt of sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)) {
      await trx.raw(stmt);
    }
  });
};

exports.down = async function down(knex) {
  for (const t of [
    'o_agentWorkData',
    'o_tasks',
    'o_videoTrack',
    'o_video',
    'o_image',
    'o_assets2Storyboard',
    'o_storyboard',
    'o_assetsRole2Audio',
    'o_scriptAssets',
    'o_assets',
    'o_script',
    'o_eventChapter',
    'o_event',
    'o_novel',
    'o_setting',
    'o_user',
    'o_project',
  ])
    await knex.raw(`DROP TABLE IF EXISTS ${t}`);
};
