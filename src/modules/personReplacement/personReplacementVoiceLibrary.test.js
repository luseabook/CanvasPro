import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPersonReplacementLibraryAudioRef,
  getPersonReplacementAudioSavedName,
  getPersonReplacementProjectAudioAssets,
  getPersonReplacementVoiceLibraryBoundCharacters,
  buildPersonReplacementLibraryVoiceReference,
  bindPersonReplacementCharacterVoice,
} from './personReplacementVoiceLibrary.js';

test('voiceLibrary: 音频引用按 audioUrl > sourceUrl > url 取首个非空，并去空白', () => {
  assert.equal(getPersonReplacementLibraryAudioRef({ audioUrl: ' a ' }), 'a');
  assert.equal(getPersonReplacementLibraryAudioRef({ sourceUrl: 's', url: 'u' }), 's');
  assert.equal(getPersonReplacementLibraryAudioRef({ url: 'u' }), 'u');
  assert.equal(getPersonReplacementLibraryAudioRef({}), '');
  assert.equal(getPersonReplacementLibraryAudioRef(), '');
});

test('voiceLibrary: 保存名优先 savedName；通用名让位于 assetName；全空回落未命名音频', () => {
  assert.equal(getPersonReplacementAudioSavedName({ savedName: ' s ', name: 'n' }), 's');
  assert.equal(getPersonReplacementAudioSavedName({ name: '人声', assetName: '作品名' }), '作品名');
  assert.equal(getPersonReplacementAudioSavedName({ name: 'AI 音频', assetName: '作品名' }), '作品名');
  assert.equal(getPersonReplacementAudioSavedName({ name: '自定义' }), '自定义');
  assert.equal(getPersonReplacementAudioSavedName({ name: '人声' }), '人声');
  assert.equal(getPersonReplacementAudioSavedName({ assetName: 'A' }), 'A');
  assert.equal(getPersonReplacementAudioSavedName({}), '未命名音频');
});

test('voiceLibrary: 只收 mediaKind/type 归一为 audio 的素材', () => {
  const items = [
    { id: 1, mediaKind: 'Audio' },
    { id: 2, type: ' AUDIO ' },
    { id: 3, mediaKind: 'video' },
    { id: 4 },
  ];
  assert.deepEqual(
    getPersonReplacementProjectAudioAssets({ audioAssets: items }).map((x) => x.id),
    [1, 2],
  );
  assert.deepEqual(getPersonReplacementProjectAudioAssets({}), []);
  assert.deepEqual(getPersonReplacementProjectAudioAssets({ audioAssets: 'x' }), []);
});

test('voiceLibrary: 绑定角色按 libraryAssetId 或 源资产键 命中，非 library 来源排除', () => {
  const project = {
    characters: [
      { id: 'c1', voiceReference: { source: 'library', libraryAssetId: 'A1' } },
      { id: 'c2', voiceReference: { source: 'library', sourceAssetId: 'S1', sourceItemIndex: 0 } },
      { id: 'c3', voiceReference: { source: 'project', libraryAssetId: 'A1' } },
      { id: 'c4' },
    ],
  };
  assert.deepEqual(
    getPersonReplacementVoiceLibraryBoundCharacters(project, {
      id: 'A1',
      sourceAssetId: 'S1',
      sourceItemIndex: 0,
    }).map((c) => c.id),
    ['c1', 'c2'],
  );
  assert.deepEqual(getPersonReplacementVoiceLibraryBoundCharacters(project, {}), []);
  assert.deepEqual(getPersonReplacementVoiceLibraryBoundCharacters({}, { id: 'A1' }), []);
});

test('voiceLibrary: build 引用缺地址即抛错，否则归一 sourceItemIndex 并带 library 标记', () => {
  assert.throws(() => buildPersonReplacementLibraryVoiceReference({}), {
    message: '所选音频缺少可用地址。',
  });
  assert.deepEqual(
    buildPersonReplacementLibraryVoiceReference(
      {
        id: 'A1',
        sourceAssetId: 'S1',
        sourceItemIndex: 2.7,
        savedName: ' x.mp3 ',
        audioUrl: ' http://x/a.mp3 ',
      },
      { localPath: ' l ', updatedAt: 5 },
    ),
    {
      audioUrl: 'http://x/a.mp3',
      localPath: 'l',
      fileName: 'x.mp3',
      source: 'library',
      libraryAssetId: 'A1',
      sourceAssetId: 'S1',
      sourceItemIndex: 2,
      updatedAt: 5,
    },
  );
});

function makeHarness(projectOverrides = {}, assetOverrides = {}) {
  const toasts = [];
  const state = { addCalls: 0, setCalls: [] };
  const project = { characters: [], audioAssets: [], ...projectOverrides };
  const result = bindPersonReplacementCharacterVoice({
    project,
    request: {
      characterId: 'c1',
      asset: {
        id: 'A1',
        mediaKind: 'audio',
        audioUrl: 'http://x/a.mp3',
        sourceAssetId: 'S1',
        sourceItemIndex: 0,
        savedName: 'a.mp3',
        ...assetOverrides,
      },
    },
    showToast: (message, kind) => toasts.push([message, kind]),
    addLibraryAssetsToProject: ({ targetKind, sourceAssets, assetRefs, notify }) => {
      state.addCalls += 1;
      state.lastAdd = { targetKind, sourceAssets, assetRefs, notify };
      return {
        project: {
          ...project,
          audioAssets: [...project.audioAssets, { audioUrl: 'http://x/a.mp3' }],
        },
      };
    },
    normalizeLocalPath: (url) => 'local:' + url,
    resolveMediaUrl: (url) => 'resolved:' + url,
    setProject: (next) => {
      state.setCalls.push(next);
      return next;
    },
  });
  return { result, toasts, state, project };
}

test('voiceLibrary: 绑定成功时补登素材、注入引用、回写项目并提示角色名', () => {
  const { result, toasts, state } = makeHarness({ characters: [{ id: 'c1', name: '小明' }] });
  assert.deepEqual(toasts, [['已为「小明」添加声音。', 'success']]);
  assert.equal(state.addCalls, 1);
  assert.deepEqual(state.lastAdd.assetRefs, [{ assetId: 'S1', itemIndex: 0 }]);
  assert.equal(state.lastAdd.targetKind, 'audio');
  assert.equal(state.lastAdd.notify, false);
  assert.equal(state.lastAdd.sourceAssets.length, 1);
  assert.equal(state.lastAdd.sourceAssets[0].id, 'A1');
  assert.equal(state.setCalls.length, 1);
  const bound = result.project.characters[0];
  assert.equal(bound.voiceRef, 'local:http://x/a.mp3');
  assert.equal(bound.voiceReference.audioUrl, 'resolved:http://x/a.mp3');
  assert.equal(bound.voiceReference.fileName, 'a.mp3');
  assert.equal(bound.voiceReference.source, 'library');
  assert.equal(bound.voiceReference.libraryAssetId, 'A1');
  assert.equal(typeof bound.voiceReference.updatedAt, 'number');
});

test('voiceLibrary: 素材已在项目音频列表时不再补登，直接绑定', () => {
  const { toasts, state } = makeHarness({
    characters: [{ id: 'c1', name: '小明' }],
    audioAssets: [{ audioUrl: 'http://x/a.mp3' }],
  });
  assert.equal(state.addCalls, 0);
  assert.deepEqual(toasts, [['已为「小明」添加声音。', 'success']]);
});

test('voiceLibrary: 人设不存在 / 非音频 / 缺地址三种拒绝各带提示且不写项目', () => {
  const missing = makeHarness({ characters: [] });
  assert.equal(missing.result, null);
  assert.deepEqual(missing.toasts, [['要添加声音的人设不存在。', 'warn']]);
  assert.equal(missing.state.setCalls.length, 0);

  const notAudio = makeHarness({ characters: [{ id: 'c1', name: '小明' }] }, { mediaKind: 'video' });
  assert.equal(notAudio.result, null);
  assert.deepEqual(notAudio.toasts, [['请选择音频素材。', 'warn']]);

  const noUrl = makeHarness(
    { characters: [{ id: 'c1', name: '小明' }] },
    { audioUrl: '', sourceUrl: '', url: '' },
  );
  assert.equal(noUrl.result, null);
  assert.deepEqual(noUrl.toasts, [['所选音频缺少可用地址。', 'warn']]);
  assert.equal(noUrl.state.setCalls.length, 0);
});
