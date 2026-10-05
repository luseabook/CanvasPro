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
function normalizeText(value) {
  return String(value || '')['trim']();
}
function findCharacterAsset(item, key) {
  return (
    (Array['isArray'](item?.['data']?.['assets']) ? item['data']['assets'] : [])['find'](
      (index) => normalizeText(index?.['id']) === normalizeText(key),
    ) || null
  );
}
export function syncStoryCharacterVoicePlayerPreviewUi(
  el,
  { audioEl: audioEl = null, assetId: assetId = '' } = {},
) {
  const count = Number(audioEl?.['duration']),
    result = Number(audioEl?.['currentTime']),
    data =
      Number['isFinite'](count) && count > 0 ? Math['max'](0, Math['min'](1, result / count)) : 0,
    options = Boolean(audioEl && audioEl['paused'] === ![] && audioEl['ended'] !== !![]);
  el?.['querySelectorAll']?.('[data-story-character-voice-player]')?.['forEach']?.((el2) => {
    const enabled = el2['dataset']['storyCharacterVoicePlayer'] === assetId,
      el3 = el2['querySelector']("[data-story-action='play-character-voice']"),
      el4 = el2['querySelector']('[data-story-character-voice-waveform]');
    (el2['classList']['toggle']('is-active', enabled),
      el2['classList']['toggle']('is-playing', enabled && options));
    el3 && el3['setAttribute']('aria-label', enabled && options ? '暂停声音参考' : '播放声音参考');
    if (el4) {
      el4['hidden'] = !enabled;
      const list = el4['querySelectorAll']('i');
      list['forEach']((el5, target) => {
        el5['classList']['toggle']('is-played', enabled && data >= (target + 1) / list['length']);
      });
    }
  });
}
export function createStoryCharacterVoiceWorkspaceController({
  state: state,
  root: root,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  projectTasks: projectTasks = {},
  findAsset: findAsset = (source) => findCharacterAsset(state, source),
  render: render = () => {},
  schedulePersistence: schedulePersistence = () => {},
  showToast: showToast = () => {},
  showTaskApiKeyError: showTaskApiKeyError = () => ![],
  showTaskResultToast: showTaskResultToast = () => ![],
  showNavigableTaskResultToast: showNavigableTaskResultToast = () => ![],
  isEditorSurfaceActive: isEditorSurfaceActive = () => ![],
} = {}) {
  let audioEl2 = null,
    next = '',
    assetId2 = '',
    enabled2 = null,
    enabled3 = ![];
  const storyCharacterVoicePreviewGuard = createStoryCharacterVoicePreviewGuard(),
    handler = projectTasks['createToken'] || (() => createStoryProjectTaskToken(state)),
    handler2 =
      projectTasks['isCurrent'] || ((current) => isStoryProjectTaskTokenCurrent(state, current) && !enabled3),
    handler3 = projectTasks['isLive'] || ((entry) => isStoryProjectTaskTokenLive(state, entry) && !enabled3),
    handler4 = projectTasks['start'] || (() => null),
    handler5 = projectTasks['update'] || (() => null),
    handler6 = projectTasks['finish'] || (() => null);
  function syncPlayerUi() {
    syncStoryCharacterVoicePlayerPreviewUi(root, { audioEl: audioEl2, assetId: assetId2 });
  }
  function run(el6) {
    PREVIEW_EVENT_NAMES['forEach']((record) => {
      el6['addEventListener'](record, syncPlayerUi);
    });
  }
  function stopPreview() {
    storyCharacterVoicePreviewGuard['invalidate']();
    if (audioEl2)
      try {
        (audioEl2['pause']?.(), (audioEl2['currentTime'] = 0));
      } catch {}
    ((assetId2 = ''), syncPlayerUi());
  }
  async function playPreview(assetId3, payload = null) {
    const asset = findAsset(assetId3),
      storyCharacterVoiceReference = normalizeStoryCharacterVoiceReference(
        payload || asset?.['voiceReference'],
      ),
      source2 = normalizeText(
        storyCharacterVoiceReference?.['audioUrl'] || storyCharacterVoiceReference?.['localPath'],
      );
    if (!source2) {
      showToast('当前角色还没有声音参考。', 'warn');
      return;
    }
    let audioEl3 = null,
      handle = null,
      config = ![];
    try {
      root?.['querySelectorAll']?.('[data-story-character-voice-audio]')?.['forEach']?.((scope) => {
        scope['pause']?.();
      });
      const enabled4 = audioEl2 && next === source2 && assetId2 === assetId3;
      if (enabled4 && audioEl2['paused'] === ![]) {
        (audioEl2['pause']?.(), syncPlayerUi());
        return;
      }
      if (!enabled4) stopPreview();
      (!audioEl2 || next !== source2) &&
        ((audioEl2 = documentObject['createElement']('audio')),
        (audioEl2['preload'] = 'auto'),
        (next = source2),
        run(audioEl2),
        (config = !![]));
      ((audioEl3 = audioEl2),
        (handle = storyCharacterVoicePreviewGuard['begin']({
          assetId: assetId3,
          source: source2,
          audioEl: audioEl3,
        })));
      config &&
        (await attachMediaElementPlaybackSource(audioEl3, source2, {
          preload: 'auto',
          shouldAssign: () => storyCharacterVoicePreviewGuard['isCurrent'](handle),
        }));
      if (!storyCharacterVoicePreviewGuard['isCurrent'](handle)) return;
      if (audioEl3['ended']) audioEl3['currentTime'] = 0;
      ((assetId2 = assetId3), syncPlayerUi());
      const promise = audioEl3['play']?.();
      if (promise && typeof promise['then'] === 'function') await promise;
      if (!storyCharacterVoicePreviewGuard['isCurrent'](handle)) {
        audioEl3['pause']?.();
        return;
      }
      syncPlayerUi();
    } catch {
      if (handle && !storyCharacterVoicePreviewGuard['isCurrent'](handle)) {
        audioEl3?.['pause']?.();
        return;
      }
      (storyCharacterVoicePreviewGuard['invalidate'](),
        (audioEl2 = null),
        (next = ''),
        (assetId2 = ''),
        syncPlayerUi(),
        showToast('声音参考播放失败。', 'warn'));
    }
  }
  async function playHistory(input, output) {
    const asset2 = findAsset(input),
      storyCharacterVoiceHistory = normalizeStoryCharacterVoiceHistory(asset2?.['voiceReferenceHistory']),
      enabled5 = storyCharacterVoiceHistory[Math['trunc'](Number(output))];
    if (!enabled5) {
      showToast('历史音频不可用。', 'warn');
      return;
    }
    await playPreview(input, enabled5);
  }
  function restoreHistory(value2, value3) {
    const asset3 = findAsset(value2);
    if (!asset3) return;
    const restoreStoryCharacterVoiceHistoryReference2 = restoreStoryCharacterVoiceHistoryReference(
      asset3,
      value3,
    );
    if (!restoreStoryCharacterVoiceHistoryReference2) {
      showToast('历史音频不可用。', 'warn');
      return;
    }
    (stopPreview(),
      schedulePersistence({ immediate: !![] }),
      render(),
      showToast('已恢复历史声音参考。', 'success'));
  }
  function run2() {
    if (!enabled2) return;
    (windowObject['clearTimeout'](enabled2), (enabled2 = null));
  }
  function openEditor(value4) {
    const asset4 = findAsset(value4);
    if (!asset4 || asset4['kind'] !== 'character') {
      showToast('当前角色不可用。', 'warn');
      return;
    }
    ((state['characterVoiceEditor'] = createStoryCharacterVoiceEditorDraft({
      asset: asset4,
      data: state['data'],
    })),
      (state['characterVoicePanelMotion'] = 'to-voice'),
      render(),
      schedulePersistence(),
      run2(),
      (enabled2 = windowObject['setTimeout'](() => {
        if (state['characterVoicePanelMotion'] === 'to-voice') {
          state['characterVoicePanelMotion'] = '';
          if (isEditorSurfaceActive()) render();
        }
        enabled2 = null;
      }, 560)));
  }
  function closeEditor() {
    if (!state['characterVoiceEditor']) return;
    ((state['pendingCharacterVoiceAssetId'] = ''),
      (state['characterVoicePanelMotion'] = 'to-asset'),
      render(),
      run2(),
      (enabled2 = windowObject['setTimeout'](() => {
        if (state['characterVoicePanelMotion'] === 'to-asset') {
          ((state['characterVoiceEditor'] = null),
            (state['characterVoicePanelMotion'] = ''),
            schedulePersistence());
          if (isEditorSurfaceActive()) render();
        }
        enabled2 = null;
      }, 560)));
  }
  function resetEditor() {
    (run2(),
      (state['characterVoiceEditor'] = null),
      (state['characterVoicePanelMotion'] = ''),
      (state['pendingCharacterVoiceAssetId'] = ''));
  }
  async function requestGeneration({
    asset: asset5,
    editor: editor,
    installId: installId = '',
    projectToken: projectToken = handler(),
    batch: batch = null,
  } = {}) {
    const modelId = getStoryCharacterVoiceWorkflow(editor?.['nodeData']?.['model']),
      id = buildStoryBackgroundTaskId('asset-voice', { assetId: asset5?.['id'] });
    handler4(projectToken, {
      id: id,
      type: 'asset-voice',
      scope: { assetId: asset5?.['id'] },
      label: '生成' + (normalizeText(asset5?.['name']) || '角色') + '声音',
      message: '正在等待声音生成结果',
      modelId: modelId?.['key'],
      provider: modelId?.['provider'],
      executionId: modelId?.['executionId'],
      batch: batch,
    });
    try {
      const generateStoryCharacterVoice2 = await generateStoryCharacterVoice({
        asset: asset5,
        editor: editor,
        installId: installId,
        onTaskMeta: ({ taskId: taskId, payload: payload2, workflow: workflow } = {}) => {
          const remoteTaskId = normalizeText(taskId);
          if (!remoteTaskId || !handler3(projectToken)) return;
          const resumable = Boolean(
            workflow?.['adapterType'] === 'workflow' ||
            ['runninghub', 'runninghubwf']['includes'](normalizeText(payload2?.['provider'])),
          );
          handler5(projectToken, id, {
            status: 'running',
            message: '声音任务已提交，正在等待结果',
            resumable: resumable,
            remoteTaskId: remoteTaskId,
            resumePayload: sanitizeStoryTaskResumePayload(payload2),
          });
        },
      });
      return (
        handler3(projectToken) &&
          handler6(projectToken, id, { status: 'succeeded', message: '角色声音生成完成' }),
        generateStoryCharacterVoice2
      );
    } catch (error) {
      handler3(projectToken) &&
        handler6(projectToken, id, {
          status: 'failed',
          message: '角色声音生成失败',
          error: error?.['message'] || '声音参考生成失败。',
        });
      throw error;
    }
  }
  async function generateSelected() {
    const editor2 = state['characterVoiceEditor'],
      asset6 = findAsset(editor2?.['assetId']);
    if (!editor2 || !asset6 || isStoryAssetVoiceLoading(state, asset6['id'])) return;
    const modelId2 = getStoryCharacterVoiceWorkflow(editor2['nodeData']?.['model']);
    if (!modelId2) {
      ((editor2['error'] = '当前没有可用的音频模型。'), render());
      return;
    }
    if (modelId2['vip'] === !![]) {
      const run3 = windowObject?.['isModelAllowedBySubscription'],
        enabled6 = typeof run3 === 'function' ? run3(modelId2['key'], modelId2['provider']) : !![];
      if (!enabled6) {
        windowObject?.['openSubscriptionDialog']?.({
          modelId: modelId2['key'],
          provider: modelId2['provider'],
        });
        return;
      }
    }
    const projectToken2 = handler();
    (setStoryAssetVoiceGenerating(state, asset6['id'], !![]),
      (editor2['isGenerating'] = !![]),
      (editor2['error'] = ''),
      render());
    try {
      const installId2 =
        modelId2['vip'] === !![] && typeof windowObject?.['ensureSubscriptionInstallId'] === 'function'
          ? await windowObject['ensureSubscriptionInstallId']()
          : windowObject?.['__aicInstallId'] || '';
      if (!handler3(projectToken2)) return ![];
      const enabled7 = await requestGeneration({
        asset: asset6,
        editor: editor2,
        installId: installId2,
        projectToken: projectToken2,
      });
      if (!handler3(projectToken2)) return ![];
      if (!enabled7) throw new Error('音频模型没有返回可用的声音结果。');
      if (handler2(projectToken2)) stopPreview();
      return (
        replaceStoryCharacterVoiceReference(asset6, enabled7),
        (editor2['error'] = ''),
        schedulePersistence({ immediate: !![] }),
        showNavigableTaskResultToast('角色声音参考已生成。', 'success', projectToken2, {
          step: 2,
          assetId: asset6['id'],
        }),
        !![]
      );
    } catch (error2) {
      if (!handler3(projectToken2)) return ![];
      editor2['error'] = error2?.['message'] || '声音参考生成失败。';
      const showTaskApiKeyError2 = showTaskApiKeyError(error2, {
        provider: modelId2['provider'],
        modelId: modelId2['key'],
      });
      if (!showTaskApiKeyError2) showTaskResultToast(editor2['error'], 'error', error2);
      return ![];
    } finally {
      handler2(projectToken2) &&
        (setStoryAssetVoiceGenerating(state, asset6['id'], ![]), (editor2['isGenerating'] = ![]), render());
    }
  }
  function destroy() {
    if (enabled3) return;
    ((enabled3 = !![]), run2(), stopPreview(), (audioEl2 = null), (next = ''));
  }
  return Object['freeze']({
    closeEditor: closeEditor,
    destroy: destroy,
    previewSelected: () => {
      const editor3 = state['characterVoiceEditor'],
        asset7 = findAsset(editor3?.['assetId']);
      if (!editor3 || !asset7) throw new Error('请先选择角色声音');
      return buildStoryCharacterVoicePayload({ asset: asset7, editor: editor3 });
    },
    generateSelected: generateSelected,
    openEditor: openEditor,
    playHistory: playHistory,
    playPreview: playPreview,
    requestGeneration: requestGeneration,
    resetEditor: resetEditor,
    restoreHistory: restoreHistory,
    stopPreview: stopPreview,
    syncPlayerUi: syncPlayerUi,
  });
}
