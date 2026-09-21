// 17 短剧表，按 01-architecture.md §3.1 原文建表,依赖序:project/user/setting →
// novel/event/eventChapter → script → assets/scriptAssets/role2audio →
// storyboard/assets2storyboard → image/video/videoTrack → tasks/agentWorkData.
// 用 raw SQL 1:1 平移文档,避免 builder 描述偏差。
exports.up = async function up(knex) {
  const sql = `
CREATE TABLE o_project (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  projectType TEXT NOT NULL DEFAULT 'freeform', artStyle TEXT, storyStyle TEXT,
  imageModel TEXT, videoModel TEXT, videoRatio TEXT, mode TEXT, directorManual TEXT,
  intro TEXT, userId INTEGER, createTime INTEGER, updateTime INTEGER);
CREATE INDEX idx_project_type ON o_project(projectType);
CREATE INDEX idx_project_user ON o_project(userId);

CREATE TABLE o_user (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
  password TEXT, role TEXT DEFAULT 'editor', createTime INTEGER);

CREATE TABLE o_setting (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE o_novel (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER NOT NULL,
  chapter TEXT, chapterData TEXT, chapterIndex INTEGER, eventState INTEGER DEFAULT 0,
  errorReason TEXT, createTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE);
CREATE INDEX idx_novel_project ON o_novel(projectId);

CREATE TABLE o_event (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, detail TEXT, createTime INTEGER);

CREATE TABLE o_eventChapter (id INTEGER PRIMARY KEY AUTOINCREMENT, eventId INTEGER NOT NULL,
  novelId INTEGER NOT NULL, FOREIGN KEY (eventId) REFERENCES o_event(id) ON DELETE CASCADE,
  FOREIGN KEY (novelId) REFERENCES o_novel(id) ON DELETE CASCADE);

CREATE TABLE o_script (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER NOT NULL,
  name TEXT, content TEXT, extractState INTEGER DEFAULT 0, errorReason TEXT,
  episodeIndex INTEGER, createTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE);
CREATE INDEX idx_script_project ON o_script(projectId);

CREATE TABLE o_assets (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER NOT NULL,
  assetsId INTEGER, type TEXT NOT NULL, name TEXT NOT NULL, prompt TEXT, describe TEXT,
  imageId INTEGER, promptState TEXT DEFAULT '未生成', promptErrorReason TEXT,
  audioBindState INTEGER DEFAULT 0, startTime INTEGER, remark TEXT,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE,
  FOREIGN KEY (assetsId) REFERENCES o_assets(id) ON DELETE SET NULL);
CREATE INDEX idx_assets_project ON o_assets(projectId);
CREATE INDEX idx_assets_parent ON o_assets(assetsId);

CREATE TABLE o_scriptAssets (scriptId INTEGER NOT NULL, assetId INTEGER NOT NULL,
  PRIMARY KEY (scriptId, assetId),
  FOREIGN KEY (scriptId) REFERENCES o_script(id) ON DELETE CASCADE,
  FOREIGN KEY (assetId) REFERENCES o_assets(id) ON DELETE CASCADE);

CREATE TABLE o_assetsRole2Audio (assetsRoleId INTEGER NOT NULL, assetsAudioId INTEGER NOT NULL,
  PRIMARY KEY (assetsRoleId, assetsAudioId));

CREATE TABLE o_storyboard (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER NOT NULL,
  scriptId INTEGER NOT NULL, index_ INTEGER, videoDesc TEXT, prompt TEXT, track TEXT,
  trackId INTEGER, duration TEXT, state TEXT DEFAULT '未生成', shouldGenerateImage INTEGER DEFAULT 1,
  filePath TEXT, flowId INTEGER, reason TEXT, createTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE,
  FOREIGN KEY (scriptId) REFERENCES o_script(id) ON DELETE CASCADE);
CREATE INDEX idx_storyboard_script ON o_storyboard(scriptId);
CREATE INDEX idx_storyboard_track ON o_storyboard(scriptId, track, index_);

CREATE TABLE o_assets2Storyboard (storyboardId INTEGER NOT NULL, assetId INTEGER NOT NULL,
  PRIMARY KEY (storyboardId, assetId),
  FOREIGN KEY (storyboardId) REFERENCES o_storyboard(id) ON DELETE CASCADE,
  FOREIGN KEY (assetId) REFERENCES o_assets(id) ON DELETE CASCADE);

CREATE TABLE o_image (id INTEGER PRIMARY KEY AUTOINCREMENT, assetsId INTEGER, filePath TEXT,
  model TEXT, resolution TEXT, type TEXT, state TEXT DEFAULT '未生成', errorReason TEXT, createTime INTEGER);
CREATE INDEX idx_image_assets ON o_image(assetsId);

CREATE TABLE o_video (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER, scriptId INTEGER,
  videoTrackId INTEGER, filePath TEXT, state TEXT DEFAULT '未生成', errorReason TEXT, time INTEGER);
CREATE INDEX idx_video_script ON o_video(scriptId);

CREATE TABLE o_videoTrack (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER, scriptId INTEGER,
  videoId INTEGER, selectVideoId INTEGER, prompt TEXT, duration INTEGER, state TEXT DEFAULT '未生成', reason TEXT);

CREATE TABLE o_tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, taskClass TEXT NOT NULL, projectId INTEGER,
  scriptId INTEGER, relatedObjects TEXT, describe TEXT, model TEXT, state TEXT NOT NULL DEFAULT 'pending',
  reason TEXT, legacySource TEXT, startTime INTEGER, endTime INTEGER);
CREATE INDEX idx_tasks_state ON o_tasks(state);
CREATE INDEX idx_tasks_project ON o_tasks(projectId);

CREATE TABLE o_agentWorkData (id INTEGER PRIMARY KEY AUTOINCREMENT, projectId INTEGER NOT NULL,
  episodesId INTEGER, key TEXT, data TEXT, createTime INTEGER, updateTime INTEGER,
  FOREIGN KEY (projectId) REFERENCES o_project(id) ON DELETE CASCADE,
  UNIQUE (projectId, episodesId, key));
CREATE INDEX idx_workdata_episode ON o_agentWorkData(episodesId);
`;
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
