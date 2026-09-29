import { attachMediaElementPlaybackSource } from '../../services/desktopMediaBlobSource.js';
import { buildStoryBackgroundTaskId } from './storyBackgroundTasks.js';
import { isStoryAssetVoiceLoading, setStoryAssetVoiceGenerating } from './storyAssetGenerationState.js';
import {
  createStoryCharacterVoiceEditorDraft,
  buildStoryCharacterVoicePayload,
  createStoryCharacterVoicePreviewGuard,
  generateStoryCharacterVoice,
  getStoryCharacterVoiceWorkflow,
  normalizeStoryCharacterVoiceHistory,
  normalizeStoryCharacterVoiceReference,
  replaceStoryCharacterVoiceReference,
  restoreStoryCharacterVoiceHistoryReference,
} from './storyCharacterVoice.js';
import {
  createStoryProjectTaskToken,
  isStoryProjectTaskTokenCurrent,
  isStoryProjectTaskTokenLive,
  sanitizeStoryTaskResumePayload,
} from './storyProjectTaskToken.js';
const PREVIEW_EVENT_NAMES = Object['freeze']([
  'play',
  'pause',
  'timeupdate',
  'loadedmetadata',
  'durationchange',
  'ended',
]);
function normalizeText(_0x2bc0d8) {
  return String(_0x2bc0d8 || '')['trim']();
}
function findCharacterAsset(_0x2e2612, _0x4fd1db) {
  return (
    (Array['isArray'](_0x2e2612?.['data']?.['assets']) ? _0x2e2612['data']['assets'] : [])['find'](
      (_0x4f879d) => normalizeText(_0x4f879d?.['id']) === normalizeText(_0x4fd1db),
    ) || null
  );
}
export function syncStoryCharacterVoicePlayerPreviewUi(
  _0xe6aa03,
  { audioEl: audioEl = null, assetId: assetId = '' } = {},
) {
  const _0x34fabc = Number(audioEl?.['duration']),
    _0x22b636 = Number(audioEl?.['currentTime']),
    _0x2eee55 =
      Number['isFinite'](_0x34fabc) && _0x34fabc > 0x0
        ? Math['max'](0x0, Math['min'](0x1, _0x22b636 / _0x34fabc))
        : 0x0,
    _0x2c4321 = Boolean(audioEl && audioEl['paused'] === ![] && audioEl['ended'] !== !![]);
  _0xe6aa03?.['querySelectorAll']?.('[data-story-character-voice-player]')?.['forEach']?.((_0x34db70) => {
    const _0x3086db = _0x34db70['dataset']['storyCharacterVoicePlayer'] === assetId,
      _0x5820ed = _0x34db70['querySelector']("[data-story-action='play-character-voice']"),
      _0x23e7c0 = _0x34db70['querySelector']('[data-story-character-voice-waveform]');
    (_0x34db70['classList']['toggle']('is-active', _0x3086db),
      _0x34db70['classList']['toggle']('is-playing', _0x3086db && _0x2c4321));
    _0x5820ed &&
      _0x5820ed['setAttribute']('aria-label', _0x3086db && _0x2c4321 ? '暂停声音参考' : '播放声音参考');
    if (_0x23e7c0) {
      _0x23e7c0['hidden'] = !_0x3086db;
      const _0x51e3c7 = _0x23e7c0['querySelectorAll']('i');
      _0x51e3c7['forEach']((_0x2157e2, _0x1212c8) => {
        _0x2157e2['classList']['toggle'](
          'is-played',
          _0x3086db && _0x2eee55 >= (_0x1212c8 + 0x1) / _0x51e3c7['length'],
        );
      });
    }
  });
}
export function createStoryCharacterVoiceWorkspaceController({
  state: _0x400a90,
  root: _0x1d63e2,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  projectTasks: projectTasks = {},
  findAsset: findAsset = (_0x58f1ee) => findCharacterAsset(_0x400a90, _0x58f1ee),
  render: render = () => {},
  schedulePersistence: schedulePersistence = () => {},
  showToast: showToast = () => {},
  showTaskApiKeyError: showTaskApiKeyError = () => ![],
  showTaskResultToast: showTaskResultToast = () => ![],
  showNavigableTaskResultToast: showNavigableTaskResultToast = () => ![],
  isEditorSurfaceActive: isEditorSurfaceActive = () => ![],
} = {}) {
  let _0x4473a1 = null,
    _0x312fef = '',
    _0x333268 = '',
    _0x24ee22 = null,
    _0x502cf0 = ![];
  const _0x1f860c = createStoryCharacterVoicePreviewGuard(),
    _0x22183b = projectTasks['createToken'] || (() => createStoryProjectTaskToken(_0x400a90)),
    _0x3caf4c =
      projectTasks['isCurrent'] ||
      ((_0x99e7c6) => isStoryProjectTaskTokenCurrent(_0x400a90, _0x99e7c6) && !_0x502cf0),
    _0x26e2c2 =
      projectTasks['isLive'] ||
      ((_0x3e6e07) => isStoryProjectTaskTokenLive(_0x400a90, _0x3e6e07) && !_0x502cf0),
    _0x1f4a47 = projectTasks['start'] || (() => null),
    _0x3fbc79 = projectTasks['update'] || (() => null),
    _0x13e560 = projectTasks['finish'] || (() => null);
  function _0xe25350() {
    syncStoryCharacterVoicePlayerPreviewUi(_0x1d63e2, { audioEl: _0x4473a1, assetId: _0x333268 });
  }
  function _0x177982(_0x501778) {
    PREVIEW_EVENT_NAMES['forEach']((_0x1d2085) => {
      _0x501778['addEventListener'](_0x1d2085, _0xe25350);
    });
  }
  function _0x32450a() {
    _0x1f860c['invalidate']();
    if (_0x4473a1)
      try {
        (_0x4473a1['pause']?.(), (_0x4473a1['currentTime'] = 0x0));
      } catch {}
    ((_0x333268 = ''), _0xe25350());
  }
  async function _0xcac470(_0x5c6683, _0x3511de = null) {
    const _0x31fdbe = findAsset(_0x5c6683),
      _0x40c528 = normalizeStoryCharacterVoiceReference(_0x3511de || _0x31fdbe?.['voiceReference']),
      _0x408cdb = normalizeText(_0x40c528?.['audioUrl'] || _0x40c528?.['localPath']);
    if (!_0x408cdb) {
      showToast('当前角色还没有声音参考。', 'warn');
      return;
    }
    let _0x5e531a = null,
      _0x3c4722 = null,
      _0x1a6cbf = ![];
    try {
      _0x1d63e2?.['querySelectorAll']?.('[data-story-character-voice-audio]')?.['forEach']?.((_0x235a97) => {
        _0x235a97['pause']?.();
      });
      const _0x19a7d1 = _0x4473a1 && _0x312fef === _0x408cdb && _0x333268 === _0x5c6683;
      if (_0x19a7d1 && _0x4473a1['paused'] === ![]) {
        (_0x4473a1['pause']?.(), _0xe25350());
        return;
      }
      if (!_0x19a7d1) _0x32450a();
      (!_0x4473a1 || _0x312fef !== _0x408cdb) &&
        ((_0x4473a1 = documentObject['createElement']('audio')),
        (_0x4473a1['preload'] = 'auto'),
        (_0x312fef = _0x408cdb),
        _0x177982(_0x4473a1),
        (_0x1a6cbf = !![]));
      ((_0x5e531a = _0x4473a1),
        (_0x3c4722 = _0x1f860c['begin']({ assetId: _0x5c6683, source: _0x408cdb, audioEl: _0x5e531a })));
      _0x1a6cbf &&
        (await attachMediaElementPlaybackSource(_0x5e531a, _0x408cdb, {
          preload: 'auto',
          shouldAssign: () => _0x1f860c['isCurrent'](_0x3c4722),
        }));
      if (!_0x1f860c['isCurrent'](_0x3c4722)) return;
      if (_0x5e531a['ended']) _0x5e531a['currentTime'] = 0x0;
      ((_0x333268 = _0x5c6683), _0xe25350());
      const _0x591bd5 = _0x5e531a['play']?.();
      if (_0x591bd5 && typeof _0x591bd5['then'] === 'function') await _0x591bd5;
      if (!_0x1f860c['isCurrent'](_0x3c4722)) {
        _0x5e531a['pause']?.();
        return;
      }
      _0xe25350();
    } catch {
      if (_0x3c4722 && !_0x1f860c['isCurrent'](_0x3c4722)) {
        _0x5e531a?.['pause']?.();
        return;
      }
      (_0x1f860c['invalidate'](),
        (_0x4473a1 = null),
        (_0x312fef = ''),
        (_0x333268 = ''),
        _0xe25350(),
        showToast('声音参考播放失败。', 'warn'));
    }
  }
  async function _0x2f4683(_0x477cc5, _0x3f83c9) {
    const _0x334cd5 = findAsset(_0x477cc5),
      _0x11ba71 = normalizeStoryCharacterVoiceHistory(_0x334cd5?.['voiceReferenceHistory']),
      _0x181c24 = _0x11ba71[Math['trunc'](Number(_0x3f83c9))];
    if (!_0x181c24) {
      showToast('历史音频不可用。', 'warn');
      return;
    }
    await _0xcac470(_0x477cc5, _0x181c24);
  }
  function _0xc79034(_0x1ff167, _0x16bb30) {
    const _0x7dacc2 = findAsset(_0x1ff167);
    if (!_0x7dacc2) return;
    const _0x4e011e = restoreStoryCharacterVoiceHistoryReference(_0x7dacc2, _0x16bb30);
    if (!_0x4e011e) {
      showToast('历史音频不可用。', 'warn');
      return;
    }
    (_0x32450a(),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('已恢复历史声音参考。', 'success'));
  }
  function _0x448b51() {
    if (!_0x24ee22) return;
    (windowObject['clearTimeout'](_0x24ee22), (_0x24ee22 = null));
  }
  function _0x1efad1(_0x56de17) {
    const _0x3bf848 = findAsset(_0x56de17);
    if (!_0x3bf848 || _0x3bf848['kind'] !== 'character') {
      showToast('当前角色不可用。', 'warn');
      return;
    }
    ((_0x400a90['characterVoiceEditor'] = createStoryCharacterVoiceEditorDraft({
      asset: _0x3bf848,
      data: _0x400a90['data'],
    })),
      (_0x400a90['characterVoicePanelMotion'] = 'to-voice'),
      render(),
      schedulePersistence(),
      _0x448b51(),
      (_0x24ee22 = windowObject['setTimeout'](() => {
        if (_0x400a90['characterVoicePanelMotion'] === 'to-voice') {
          _0x400a90['characterVoicePanelMotion'] = '';
          if (isEditorSurfaceActive()) render();
        }
        _0x24ee22 = null;
      }, 0x230)));
  }
  function _0x431785() {
    if (!_0x400a90['characterVoiceEditor']) return;
    ((_0x400a90['pendingCharacterVoiceAssetId'] = ''),
      (_0x400a90['characterVoicePanelMotion'] = 'to-asset'),
      render(),
      _0x448b51(),
      (_0x24ee22 = windowObject['setTimeout'](() => {
        if (_0x400a90['characterVoicePanelMotion'] === 'to-asset') {
          ((_0x400a90['characterVoiceEditor'] = null),
            (_0x400a90['characterVoicePanelMotion'] = ''),
            schedulePersistence());
          if (isEditorSurfaceActive()) render();
        }
        _0x24ee22 = null;
      }, 0x230)));
  }
  function _0x50b86b() {
    (_0x448b51(),
      (_0x400a90['characterVoiceEditor'] = null),
      (_0x400a90['characterVoicePanelMotion'] = ''),
      (_0x400a90['pendingCharacterVoiceAssetId'] = ''));
  }
  async function _0x3b41d6({
    asset: _0x489f91,
    editor: _0x49fb49,
    installId: installId = '',
    projectToken: projectToken = _0x22183b(),
    batch: batch = null,
  } = {}) {
    const _0x2d60ec = getStoryCharacterVoiceWorkflow(_0x49fb49?.['nodeData']?.['model']),
      _0x1d3627 = buildStoryBackgroundTaskId('asset-voice', { assetId: _0x489f91?.['id'] });
    _0x1f4a47(projectToken, {
      id: _0x1d3627,
      type: 'asset-voice',
      scope: { assetId: _0x489f91?.['id'] },
      label: '生成' + (normalizeText(_0x489f91?.['name']) || '角色') + '声音',
      message: '正在等待声音生成结果',
      modelId: _0x2d60ec?.['key'],
      provider: _0x2d60ec?.['provider'],
      executionId: _0x2d60ec?.['executionId'],
      batch: batch,
    });
    try {
      const _0x260885 = await generateStoryCharacterVoice({
        asset: _0x489f91,
        editor: _0x49fb49,
        installId: installId,
        onTaskMeta: ({ taskId: _0x4e38b4, payload: _0x3ff85b, workflow: _0x2b0baa } = {}) => {
          const _0x208c17 = normalizeText(_0x4e38b4);
          if (!_0x208c17 || !_0x26e2c2(projectToken)) return;
          const _0x177530 = Boolean(
            _0x2b0baa?.['adapterType'] === 'workflow' ||
            ['runninghub', 'runninghubwf']['includes'](normalizeText(_0x3ff85b?.['provider'])),
          );
          _0x3fbc79(projectToken, _0x1d3627, {
            status: 'running',
            message: '声音任务已提交，正在等待结果',
            resumable: _0x177530,
            remoteTaskId: _0x208c17,
            resumePayload: sanitizeStoryTaskResumePayload(_0x3ff85b),
          });
        },
      });
      return (
        _0x26e2c2(projectToken) &&
          _0x13e560(projectToken, _0x1d3627, { status: 'succeeded', message: '角色声音生成完成' }),
        _0x260885
      );
    } catch (_0x4bf6ac) {
      _0x26e2c2(projectToken) &&
        _0x13e560(projectToken, _0x1d3627, {
          status: 'failed',
          message: '角色声音生成失败',
          error: _0x4bf6ac?.['message'] || '声音参考生成失败。',
        });
      throw _0x4bf6ac;
    }
  }
  async function _0x3d89f() {
    const _0x57aeb5 = _0x400a90['characterVoiceEditor'],
      _0x15da16 = findAsset(_0x57aeb5?.['assetId']);
    if (!_0x57aeb5 || !_0x15da16 || isStoryAssetVoiceLoading(_0x400a90, _0x15da16['id'])) return;
    const _0x313c21 = getStoryCharacterVoiceWorkflow(_0x57aeb5['nodeData']?.['model']);
    if (!_0x313c21) {
      ((_0x57aeb5['error'] = '当前没有可用的音频模型。'), render());
      return;
    }
    if (_0x313c21['vip'] === !![]) {
      const _0x2c9733 = windowObject?.['isModelAllowedBySubscription'],
        _0x10dbe5 =
          typeof _0x2c9733 === 'function' ? _0x2c9733(_0x313c21['key'], _0x313c21['provider']) : !![];
      if (!_0x10dbe5) {
        windowObject?.['openSubscriptionDialog']?.({
          modelId: _0x313c21['key'],
          provider: _0x313c21['provider'],
        });
        return;
      }
    }
    const _0x22e183 = _0x22183b();
    (setStoryAssetVoiceGenerating(_0x400a90, _0x15da16['id'], !![]),
      (_0x57aeb5['isGenerating'] = !![]),
      (_0x57aeb5['error'] = ''),
      render());
    try {
      const _0x4a9aa8 =
        _0x313c21['vip'] === !![] && typeof windowObject?.['ensureSubscriptionInstallId'] === 'function'
          ? await windowObject['ensureSubscriptionInstallId']()
          : windowObject?.['__aicInstallId'] || '';
      if (!_0x26e2c2(_0x22e183)) return ![];
      const _0x3da4bd = await _0x3b41d6({
        asset: _0x15da16,
        editor: _0x57aeb5,
        installId: _0x4a9aa8,
        projectToken: _0x22e183,
      });
      if (!_0x26e2c2(_0x22e183)) return ![];
      if (!_0x3da4bd) throw new Error('音频模型没有返回可用的声音结果。');
      if (_0x3caf4c(_0x22e183)) _0x32450a();
      return (
        replaceStoryCharacterVoiceReference(_0x15da16, _0x3da4bd),
        (_0x57aeb5['error'] = ''),
        schedulePersistence({ immediate: !![] }),
        showNavigableTaskResultToast('角色声音参考已生成。', 'success', _0x22e183, {
          step: 0x2,
          assetId: _0x15da16['id'],
        }),
        !![]
      );
    } catch (_0x48e63c) {
      if (!_0x26e2c2(_0x22e183)) return ![];
      _0x57aeb5['error'] = _0x48e63c?.['message'] || '声音参考生成失败。';
      const _0x12574f = showTaskApiKeyError(_0x48e63c, {
        provider: _0x313c21['provider'],
        modelId: _0x313c21['key'],
      });
      if (!_0x12574f) showTaskResultToast(_0x57aeb5['error'], 'error', _0x48e63c);
      return ![];
    } finally {
      _0x3caf4c(_0x22e183) &&
        (setStoryAssetVoiceGenerating(_0x400a90, _0x15da16['id'], ![]),
        (_0x57aeb5['isGenerating'] = ![]),
        render());
    }
  }
  function _0x2d7504() {
    if (_0x502cf0) return;
    ((_0x502cf0 = !![]), _0x448b51(), _0x32450a(), (_0x4473a1 = null), (_0x312fef = ''));
  }
  return Object['freeze']({
    closeEditor: _0x431785,
    destroy: _0x2d7504,
    previewSelected: () => {
      const _0x40e681 = _0x400a90['characterVoiceEditor'],
        _0x46d07c = findAsset(_0x40e681?.['assetId']);
      if (!_0x40e681 || !_0x46d07c) throw new Error('请先选择角色声音');
      return buildStoryCharacterVoicePayload({ asset: _0x46d07c, editor: _0x40e681 });
    },
    generateSelected: _0x3d89f,
    openEditor: _0x1efad1,
    playHistory: _0x2f4683,
    playPreview: _0xcac470,
    requestGeneration: _0x3b41d6,
    resetEditor: _0x50b86b,
    restoreHistory: _0xc79034,
    stopPreview: _0x32450a,
    syncPlayerUi: _0xe25350,
  });
}
