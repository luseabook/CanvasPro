import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_WORKSPACE_PERSISTENCE_VERSION,
  createStoryWorkspaceSnapshot,
  hasStoryWorkspaceSnapshotChanged,
  isEmptyStoryWorkspaceSnapshotPayload,
  mergeStoryWorkspaceHydratedProjects,
  normalizeStoryWorkspaceSnapshot,
  parseStoryWorkspaceSnapshotPayload,
} from './storyWorkspacePersistence.js';

const replicationData = () => ({
  project: { id: 'p1', sourceMode: 'video-replication', replication: { requirements: ['r'], keep: 1 } },
  episodes: [{ id: 'e1', replication: { requirements: ['x'], keep: 2 } }],
  clipFrames: [
    { id: 'ok', imageUrl: 'file:///a.png' },
    { id: 'pending', captureSavePending: true },
    { id: 'transient', isTransient: true },
    { id: 'blob', thumbUrl: ' blob:abc' },
  ],
});

test('snapshots use defaults for unset workspace state', () => {
  const snapshot = createStoryWorkspaceSnapshot();
  assert.equal(STORY_WORKSPACE_PERSISTENCE_VERSION, 1);
  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(typeof snapshot.savedAt, 'number');
  assert.equal(snapshot.activeProjectId, '');
  assert.deepEqual(snapshot.projects, []);
  assert.equal(snapshot.currentData, undefined);
  assert.deepEqual(snapshot.modelProviders, { text: '', image: '', video: '' });
  assert.deepEqual(snapshot.modelProviderProfiles, { text: '', video: '', videoByModel: {} });
  assert.deepEqual(snapshot.models, {});
  assert.deepEqual(snapshot.modelParams, { image: {}, imageByModel: {}, video: {}, videoByModel: {} });
  assert.deepEqual(snapshot.ui, {
    view: 'home',
    step: 1,
    homeTab: 'upload',
    replicationTargetLocale: 'zh-CN',
    replicationAsrProvider: 'volcengine-speech',
    scriptMode: 'plot',
    uploadInputMode: 'file',
    idea: '',
    scriptFileName: '',
    scriptText: '',
    scriptCharacterCount: null,
    assetFilter: 'character',
    assetSplitRatio: 50,
    assetDetailSplitRatio: 50,
    episodeAssetPanelRatio: 22,
    episodeEditorPanelRatio: 34,
    episodeAssetRailTab: 'assets',
    assetAppearanceIndexes: {},
    outlineSectionOpenState: {},
    pageScrollPositions: {},
    experimentalSplitMode: false,
    selectedAssetId: '',
    selectedEpisodeId: '',
    selectedClipId: '',
    characterVoiceEditor: null,
  });
});

test('snapshots copy state and drop transient replication and frame data', () => {
  const data = replicationData();
  const state = {
    data,
    projects: [{ id: 'p1', data: replicationData() }, { id: 'p2' }],
    hasCreatedProject: true,
    step: 0,
    homeTab: 'replication',
    scriptMode: 'narration',
    uploadInputMode: 'paste',
    scriptCharacterCount: 12,
    episodeAssetRailTab: 'frames',
    textProvider: ' openai ',
    videoProviderProfileIdByModel: { m: 'x' },
    characterVoiceEditor: { assetId: 'a', isGenerating: true },
  };
  const snapshot = createStoryWorkspaceSnapshot(state);
  assert.equal(snapshot.activeProjectId, 'p1');
  assert.equal(snapshot.hasCreatedProject, true);
  assert.equal(snapshot.projectTitleEdited, false);
  assert.deepEqual(snapshot.currentData.project.replication, { keep: 1 });
  assert.deepEqual(snapshot.currentData.episodes[0].replication, { keep: 2 });
  assert.deepEqual(
    snapshot.currentData.clipFrames.map((frame) => frame.id),
    ['ok'],
  );
  assert.deepEqual(
    snapshot.projects[0].data.clipFrames.map((frame) => frame.id),
    ['ok'],
  );
  assert.deepEqual(snapshot.projects[1], { id: 'p2' });
  assert.equal(snapshot.modelProviders.text, 'openai');
  assert.deepEqual(snapshot.modelProviderProfiles.videoByModel, { m: 'x' });
  assert.equal(snapshot.ui.step, 0);
  assert.equal(snapshot.ui.homeTab, 'replication');
  assert.equal(snapshot.ui.scriptMode, 'narration');
  assert.equal(snapshot.ui.uploadInputMode, 'paste');
  assert.equal(snapshot.ui.scriptCharacterCount, 12);
  assert.equal(snapshot.ui.episodeAssetRailTab, 'frames');
  assert.deepEqual(snapshot.ui.characterVoiceEditor, { assetId: 'a', isGenerating: false });
  assert.equal(data.project.replication.requirements.length, 1);
  assert.equal(data.clipFrames.length, 4);
  const fallback = createStoryWorkspaceSnapshot({ homeTab: 'weird', episodeAssetRailTab: 'x', step: '3' }).ui;
  assert.deepEqual([fallback.homeTab, fallback.episodeAssetRailTab, fallback.step], ['upload', 'assets', 3]);
});

test('normalizing rejects incompatible snapshots and filters stored data again', () => {
  assert.equal(normalizeStoryWorkspaceSnapshot(null), null);
  assert.equal(normalizeStoryWorkspaceSnapshot([]), null);
  assert.equal(
    normalizeStoryWorkspaceSnapshot({ schemaVersion: 2, currentData: { project: {}, episodes: [] } }),
    null,
  );
  assert.equal(normalizeStoryWorkspaceSnapshot({ schemaVersion: 1, currentData: { project: {} } }), null);
  const normalized = normalizeStoryWorkspaceSnapshot({
    schemaVersion: '1',
    savedAt: 5,
    currentData: replicationData(),
    models: 'bad',
    ui: { view: 'project', replicationRequirements: ['x'] },
    extra: 'kept',
  });
  assert.equal(normalized.savedAt, 5);
  assert.equal(normalized.extra, 'kept');
  assert.deepEqual(normalized.projects, []);
  assert.deepEqual(normalized.models, {});
  assert.deepEqual(normalized.modelParams, {});
  assert.deepEqual(normalized.ui, { view: 'project' });
  assert.deepEqual(
    normalized.currentData.clipFrames.map((frame) => frame.id),
    ['ok'],
  );
});

test('empty payloads are allowed but malformed ones throw', () => {
  assert.equal(isEmptyStoryWorkspaceSnapshotPayload(null), true);
  assert.equal(isEmptyStoryWorkspaceSnapshotPayload(undefined), true);
  assert.equal(isEmptyStoryWorkspaceSnapshotPayload({}), true);
  assert.equal(isEmptyStoryWorkspaceSnapshotPayload([]), false);
  assert.equal(isEmptyStoryWorkspaceSnapshotPayload({ a: 1 }), false);
  assert.equal(parseStoryWorkspaceSnapshotPayload({}), null);
  assert.throws(() => parseStoryWorkspaceSnapshotPayload({ schemaVersion: 1 }), {
    message: '剧本工作室存档格式无效',
  });
  assert.throws(() => parseStoryWorkspaceSnapshotPayload([]), { message: '剧本工作室存档格式无效' });
  const snapshot = createStoryWorkspaceSnapshot({ data: { project: { id: 'p' }, episodes: [] } });
  assert.equal(parseStoryWorkspaceSnapshotPayload(snapshot).activeProjectId, 'p');
});

test('hydrated projects are appended only when their id is new', () => {
  const existing = [{ id: 'a' }, { data: { project: { id: 'b' } } }];
  const merged = mergeStoryWorkspaceHydratedProjects(existing, [
    { id: 'b', title: 'dup' },
    { id: 'c' },
    { id: ' ' },
    { data: { project: { id: 'c' } } },
    null,
  ]);
  assert.deepEqual(merged, [{ id: 'a' }, { data: { project: { id: 'b' } } }, { id: 'c' }]);
  assert.equal(existing.length, 2);
  assert.deepEqual(mergeStoryWorkspaceHydratedProjects('x', 'y'), []);
});

test('snapshot change detection ignores savedAt', () => {
  const first = { savedAt: 1, ui: { view: 'home' } };
  assert.equal(hasStoryWorkspaceSnapshotChanged(first, first), false);
  assert.equal(hasStoryWorkspaceSnapshotChanged(first, { savedAt: 2, ui: { view: 'home' } }), false);
  assert.equal(hasStoryWorkspaceSnapshotChanged(first, { savedAt: 1, ui: { view: 'project' } }), true);
  assert.equal(hasStoryWorkspaceSnapshotChanged(null, first), true);
  const circular = { savedAt: 1 };
  circular.self = circular;
  assert.equal(hasStoryWorkspaceSnapshotChanged(circular, first), true);
});
