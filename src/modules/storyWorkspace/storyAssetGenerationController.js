import {
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { resolveModelExecution } from '../../manifests/index.js';
import {
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from '../../../api/aiImageApi.js';
import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import {
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearanceReferenceUrls,
  getStoryAssetAppearances,
  shouldGenerateStoryAssetBaseAppearanceFirst,
} from './storyAssetAppearances.js';
import {
  buildStoryAssetGenerationPayload,
  isStoryAssetAppearanceLoading,
  setStoryAssetAppearanceGenerating,
  setStoryAssetVoiceGenerating,
} from './storyAssetGenerationState.js';
import { createStoryAssetImageLocalization } from './storyAssetImageOutputLocalization.js';
import {
  applyStoryCharacterAssetPromptPreset,
  applyStorySceneAssetPromptPreset,
} from './storyAssetPromptPresets.js';
import { replaceStoryCharacterVoiceReference, resumeStoryCharacterVoice } from './storyCharacterVoice.js';
import { sanitizeStoryTaskResumePayload } from './storyProjectTaskToken.js';
function normalizeText(_0x55ed5a) {
  return String(_0x55ed5a ?? '')['trim']();
}
export function createStoryAssetGenerationController({
  state: _0x16e813,
  activeRecoveries: _0xa0dbbf,
  activeExecutions: _0x2fea6c,
  isWorkspaceDestroyed: isWorkspaceDestroyed = () => ![],
  hasImageGenerator: hasImageGenerator = () => ![],
  generateImage: _0x1eeac7,
  createProjectToken: _0xc0adb9,
  createProjectTokenForData: _0x4613b8,
  isProjectTaskLive: _0x537777,
  isProjectTaskCurrent: _0x54b1cb,
  registerProjectData: registerProjectData = () => {},
  waitForRecoveryManifest: _0x5a57e6,
  startBackgroundTask: _0x32cf33,
  updateBackgroundTask: _0x46cc2e,
  finishBackgroundTask: _0x33741f,
  schedulePersistence: schedulePersistence = () => {},
  render: render = () => {},
  findAsset: _0x34378d,
  getSelectedAppearance: _0x508136,
  showToast: showToast = () => {},
  showTaskApiKeyError: showTaskApiKeyError = () => ![],
  showTaskResultToast: showTaskResultToast = () => {},
  notifyTaskResult: notifyTaskResult = () => {},
  showNavigableTaskResultToast: showNavigableTaskResultToast = () => {},
} = {}) {
  if (!_0x16e813 || !_0xa0dbbf || !_0x2fea6c)
    throw new TypeError('Story asset generation requires state and recovery owners.');
  if (
    typeof _0x1eeac7 !== 'function' ||
    typeof _0xc0adb9 !== 'function' ||
    typeof _0x4613b8 !== 'function' ||
    typeof _0x537777 !== 'function' ||
    typeof _0x54b1cb !== 'function' ||
    typeof _0x5a57e6 !== 'function' ||
    typeof _0x32cf33 !== 'function' ||
    typeof _0x46cc2e !== 'function' ||
    typeof _0x33741f !== 'function' ||
    typeof _0x34378d !== 'function' ||
    typeof _0x508136 !== 'function'
  )
    throw new TypeError('Story asset generation requires task and asset adapters.');
  const _0x215079 = (_0x3c976e, _0x50529c, _0x213070 = {}) => {
      const _0x2c3cbf = normalizeText(_0x213070['modelId']) || _0x16e813['models']['image'],
        _0x55cb57 = normalizeText(_0x213070['provider']) || _0x16e813['imageProvider'],
        _0x41aad7 =
          _0x213070['generationParams'] && typeof _0x213070['generationParams'] === 'object'
            ? _0x213070['generationParams']
            : _0x16e813['imageGenerationParams'],
        _0x742263 = normalizeText(_0x213070['promptPresetId']) || _0x16e813['assetPromptPresetId'],
        _0x98e208 = normalizeText(_0x213070['scenePromptPresetId']) || _0x16e813['sceneAssetPromptPresetId'],
        _0x1b22a4 =
          _0x3c976e['kind'] === 'character'
            ? applyStoryCharacterAssetPromptPreset(_0x742263, _0x50529c['prompt'])
            : _0x3c976e['kind'] === 'scene'
              ? applyStorySceneAssetPromptPreset(_0x98e208, _0x50529c['prompt'])
              : _0x50529c['prompt'],
        _0xb2d30c = Boolean(normalizeText(_0x50529c['referenceImageUrl'])),
        _0x59822d = buildStoryAssetGenerationPayload({
          asset: { ..._0x50529c, prompt: _0x1b22a4 },
          modelId: _0x2c3cbf,
          provider: _0x55cb57,
          generationParams: _0x41aad7,
          referenceImageUrls: getStoryAssetAppearanceReferenceUrls(_0x3c976e, _0x50529c),
          mapReferenceImageToImage2: _0xb2d30c,
        });
      return {
        payload: _0x59822d,
        execution: resolveModelExecution(_0x59822d['model'], { providerHint: _0x59822d['provider'] }),
      };
    },
    _0x2736c1 = (_0x410176, _0x45f34e, _0x56c1ea) => {
      const _0x5aa537 = normalizeImageGenerationResult(_0x56c1ea),
        _0x315f8e = getSuccessfulImageGenerationItems(_0x5aa537),
        _0x16471f = _0x315f8e[0x0],
        _0x854b29 = normalizeText(
          _0x16471f?.['imageUrl'] ||
            _0x16471f?.['url'] ||
            _0x16471f?.['sourceUrl'] ||
            _0x16471f?.['thumbUrl'],
        );
      if (!_0x854b29) throw new Error(getImageGenerationResultError(_0x5aa537) || '图像生成结果缺少可用图片');
      return (
        (_0x45f34e['imageUrl'] = _0x854b29),
        (_0x45f34e['generatedImage'] = { ..._0x16471f }),
        (_0x45f34e['generatedImages'] = _0x315f8e['map']((_0x23ff99) => ({ ..._0x23ff99 }))),
        (_0x45f34e['activeIndex'] = 0x0),
        (_0x45f34e['error'] = ''),
        ensureStoryAssetBaseAppearance(_0x410176),
        _0x16471f
      );
    },
    _0xcf6a51 = (_0x1a7988 = {}) => {
      const _0xc37895 = _0x1a7988['execution']?.['modelManifest'],
        _0x3f936e = _0x1a7988['execution']?.['executionManifest'];
      return Boolean(
        _0x3f936e?.['adapterType'] === 'workflow' ||
        _0xc37895?.['async'] === !![] ||
        _0x3f936e?.['extensions']?.['taskPolling'],
      );
    },
    _0x3de53a = async (_0x435dfb, _0x415021, _0x284a8a = {}) => {
      const _0x52133b = _0x215079(_0x435dfb, _0x415021, _0x284a8a),
        _0x36e0c4 = _0x284a8a['projectToken'] || _0xc0adb9(),
        _0x4470b6 = createStoryAssetImageLocalization({
          asset: _0x435dfb,
          appearance: _0x415021,
          projectToken: _0x36e0c4,
          isLive: _0x537777,
          applyResult: _0x2736c1,
          onLocalized: () => schedulePersistence({ immediate: !![] }),
        }),
        _0x45e6ed = buildStoryBackgroundTaskId('asset-image', {
          assetId: _0x435dfb?.['id'],
          appearanceId: _0x415021?.['id'],
        });
      _0x32cf33(_0x36e0c4, {
        id: _0x45e6ed,
        type: 'asset-image',
        scope: { assetId: _0x435dfb?.['id'], appearanceId: _0x415021?.['id'] },
        label: '生成' + (normalizeText(_0x435dfb?.['name']) || '素材') + '形象',
        message: '正在等待图片生成结果',
        modelId: _0x52133b['payload']?.['model'],
        provider: _0x52133b['payload']?.['provider'],
        providerProfileId:
          _0x52133b['payload']?.['providerProfileId'] || _0x52133b['payload']?.['rhProviderProfileId'],
        executionId: _0x52133b['execution']?.['executionManifest']?.['id'],
        resumePayload: sanitizeStoryTaskResumePayload(_0x52133b['payload']),
        batch: _0x284a8a['batch'],
      });
      try {
        const _0x5c71ec = (_0x4addf3) => {
            const _0x2a85ca = normalizeText(_0x4addf3);
            if (!_0x2a85ca || !_0x537777(_0x36e0c4)) return;
            _0x46cc2e(_0x36e0c4, _0x45e6ed, {
              status: 'running',
              message: '图片任务已提交，正在等待结果',
              resumable: _0xcf6a51(_0x52133b),
              remoteTaskId: _0x2a85ca,
              resumePayload: sanitizeStoryTaskResumePayload(_0x52133b['payload']),
            });
          },
          _0x4e3aa9 = await _0x1eeac7(_0x52133b['payload'], {
            ..._0x4470b6['options'],
            onTaskId: _0x5c71ec,
            onTaskMeta: ({ taskId: _0x27b031 } = {}) => _0x5c71ec(_0x27b031),
          });
        if (!_0x537777(_0x36e0c4)) return ![];
        return (
          _0x2736c1(_0x435dfb, _0x415021, _0x4e3aa9),
          _0x4470b6['commitRemote'](),
          _0x33741f(_0x36e0c4, _0x45e6ed, { status: 'succeeded', message: '素材图片生成完成' }),
          !![]
        );
      } catch (_0x1d157f) {
        _0x537777(_0x36e0c4) &&
          _0x33741f(_0x36e0c4, _0x45e6ed, {
            status: 'failed',
            message: '素材图片生成失败',
            error: _0x1d157f?.['getUserMessage']?.() || _0x1d157f?.['message'] || '图像生成失败。',
          });
        _0x1d157f['storyAssetGenerationContext'] = _0x52133b;
        throw _0x1d157f;
      }
    },
    _0x5a8cc6 = async (_0x2a6bf6, _0x5a5910 = _0xc0adb9()) => {
      const _0x1fe0ad = _0x5a5910['projectId'] + ':' + _0x2a6bf6['id'];
      if (_0xa0dbbf['has'](_0x1fe0ad) || _0x2fea6c['has'](_0x1fe0ad) || isWorkspaceDestroyed()) return ![];
      (_0xa0dbbf['add'](_0x1fe0ad), _0x2fea6c['add'](_0x1fe0ad), registerProjectData(_0x5a5910));
      if (_0x54b1cb(_0x5a5910)) {
        setStoryAssetAppearanceGenerating(
          _0x16e813,
          _0x2a6bf6['scope']?.['assetId'],
          _0x2a6bf6['scope']?.['appearanceId'],
          !![],
        );
        if (_0x16e813['view'] === 'project' && _0x16e813['step'] === 0x2) render();
      }
      try {
        const _0x598a42 = await _0x5a57e6({ modelId: _0x2a6bf6['modelId'], provider: _0x2a6bf6['provider'] });
        if (!_0x537777(_0x5a5910) || isWorkspaceDestroyed()) return ![];
        if (!_0x598a42)
          throw new Error('图片模型缺少\x20manifest\x20或\x20execution\x20manifest：' + _0x2a6bf6['modelId']);
        const _0x17d12a = _0x5a5910['data']?.['assets']?.['find'](
            (_0x5aee77) =>
              normalizeText(_0x5aee77?.['id']) === normalizeText(_0x2a6bf6['scope']?.['assetId']),
          ),
          _0x29a4fc = getStoryAssetAppearances(_0x17d12a)['find'](
            (_0x5b5904) =>
              normalizeText(_0x5b5904?.['id']) === normalizeText(_0x2a6bf6['scope']?.['appearanceId']),
          );
        if (!_0x17d12a || !_0x29a4fc) throw new Error('素材图片任务对应的角色或形象已不存在。');
        const _0x274d54 = createStoryAssetImageLocalization({
            asset: _0x17d12a,
            appearance: _0x29a4fc,
            projectToken: _0x5a5910,
            isLive: _0x537777,
            applyResult: _0x2736c1,
            onLocalized: () => schedulePersistence({ immediate: !![] }),
          }),
          _0x123036 = {
            ...(_0x2a6bf6['resumePayload'] && typeof _0x2a6bf6['resumePayload'] === 'object'
              ? _0x2a6bf6['resumePayload']
              : {}),
            model: _0x2a6bf6['modelId'],
            provider: _0x2a6bf6['provider'],
          },
          _0x4d5471 = resolveModelExecution(_0x2a6bf6['modelId'], { providerHint: _0x2a6bf6['provider'] });
        let _0x4f1fbc = null;
        if (_0x2a6bf6['provider'] === 'dreamina')
          _0x4f1fbc = await resumeDreaminaImageTask(
            _0x2a6bf6['remoteTaskId'],
            _0x123036,
            _0x274d54['options'],
          );
        else
          _0x4d5471?.['executionManifest']?.['adapterType'] === 'workflow' ||
          ['runninghub', 'runninghubwf']['includes'](_0x2a6bf6['provider'])
            ? (_0x4f1fbc = await resumeRunningHubImageTask(
                _0x2a6bf6['remoteTaskId'],
                _0x123036,
                _0x274d54['options'],
              ))
            : (_0x4f1fbc = await resumeAsyncImageTask(
                _0x2a6bf6['remoteTaskId'],
                _0x123036,
                _0x274d54['options'],
              ));
        if (!_0x537777(_0x5a5910)) return ![];
        return (
          _0x2736c1(_0x17d12a, _0x29a4fc, _0x4f1fbc),
          _0x274d54['commitRemote'](),
          _0x33741f(_0x5a5910, _0x2a6bf6['id'], {
            status: 'succeeded',
            message: '素材图片任务已恢复并生成完成',
          }),
          schedulePersistence({ immediate: !![] }),
          _0x54b1cb(_0x5a5910) && _0x16e813['view'] === 'project' && _0x16e813['step'] === 0x2 && render(),
          showNavigableTaskResultToast('素材图片任务已恢复并生成完成。', 'success', _0x5a5910, {
            step: 0x2,
            assetId: _0x2a6bf6['scope']?.['assetId'],
          }),
          !![]
        );
      } catch (_0x46549d) {
        if (!_0x537777(_0x5a5910)) return ![];
        return (
          _0x33741f(_0x5a5910, _0x2a6bf6['id'], {
            status: 'failed',
            message: '素材图片任务恢复失败',
            error: _0x46549d?.['message'] || '素材图片任务恢复失败。',
          }),
          showTaskResultToast(_0x46549d?.['message'] || '素材图片任务恢复失败。', 'error', _0x46549d),
          ![]
        );
      } finally {
        (_0xa0dbbf['delete'](_0x1fe0ad), _0x2fea6c['delete'](_0x1fe0ad));
        if (_0x54b1cb(_0x5a5910)) {
          setStoryAssetAppearanceGenerating(
            _0x16e813,
            _0x2a6bf6['scope']?.['assetId'],
            _0x2a6bf6['scope']?.['appearanceId'],
            ![],
          );
          if (_0x16e813['view'] === 'project' && _0x16e813['step'] === 0x2) render();
        }
      }
    },
    _0x16ed6f = async (_0x2ae637, _0x33fa45 = _0xc0adb9()) => {
      const _0x106710 = _0x33fa45['projectId'] + ':' + _0x2ae637['id'];
      if (_0xa0dbbf['has'](_0x106710) || _0x2fea6c['has'](_0x106710) || isWorkspaceDestroyed()) return ![];
      (_0xa0dbbf['add'](_0x106710), _0x2fea6c['add'](_0x106710), registerProjectData(_0x33fa45));
      if (_0x54b1cb(_0x33fa45)) {
        setStoryAssetVoiceGenerating(_0x16e813, _0x2ae637['scope']?.['assetId'], !![]);
        if (_0x16e813['view'] === 'project' && _0x16e813['step'] === 0x2) render();
      }
      try {
        const _0x52bf37 = await _0x5a57e6({ modelId: _0x2ae637['modelId'], provider: _0x2ae637['provider'] });
        if (!_0x537777(_0x33fa45) || isWorkspaceDestroyed()) return ![];
        if (!_0x52bf37)
          throw new Error('声音模型缺少\x20manifest\x20或\x20execution\x20manifest：' + _0x2ae637['modelId']);
        const _0x480204 = _0x33fa45['data']?.['assets']?.['find'](
          (_0x321689) => normalizeText(_0x321689?.['id']) === normalizeText(_0x2ae637['scope']?.['assetId']),
        );
        if (!_0x480204) throw new Error('角色声音任务对应的角色已不存在。');
        const _0x8f444a = await resumeStoryCharacterVoice({
          asset: _0x480204,
          taskId: _0x2ae637['remoteTaskId'],
          payload: _0x2ae637['resumePayload'] || {},
        });
        if (!_0x8f444a || !_0x537777(_0x33fa45)) return ![];
        return (
          replaceStoryCharacterVoiceReference(_0x480204, _0x8f444a),
          _0x33741f(_0x33fa45, _0x2ae637['id'], {
            status: 'succeeded',
            message: '角色声音任务已恢复并生成完成',
          }),
          schedulePersistence({ immediate: !![] }),
          _0x54b1cb(_0x33fa45) && _0x16e813['view'] === 'project' && _0x16e813['step'] === 0x2 && render(),
          showNavigableTaskResultToast('角色声音任务已恢复并生成完成。', 'success', _0x33fa45, {
            step: 0x2,
            assetId: _0x2ae637['scope']?.['assetId'],
          }),
          !![]
        );
      } catch (_0x1250e5) {
        if (!_0x537777(_0x33fa45)) return ![];
        return (
          _0x33741f(_0x33fa45, _0x2ae637['id'], {
            status: 'failed',
            message: '角色声音任务恢复失败',
            error: _0x1250e5?.['message'] || '角色声音任务恢复失败。',
          }),
          showTaskResultToast(_0x1250e5?.['message'] || '角色声音任务恢复失败。', 'error', _0x1250e5),
          ![]
        );
      } finally {
        (_0xa0dbbf['delete'](_0x106710), _0x2fea6c['delete'](_0x106710));
        if (_0x54b1cb(_0x33fa45)) {
          setStoryAssetVoiceGenerating(_0x16e813, _0x2ae637['scope']?.['assetId'], ![]);
          normalizeText(_0x16e813['characterVoiceEditor']?.['assetId']) ===
            normalizeText(_0x2ae637['scope']?.['assetId']) &&
            (_0x16e813['characterVoiceEditor']['isGenerating'] = ![]);
          if (_0x16e813['view'] === 'project' && _0x16e813['step'] === 0x2) render();
        }
      }
    },
    _0x2afc9a = (_0x53bd61 = _0x16e813['data']) => {
      const _0x183e1b = _0x4613b8(_0x53bd61),
        _0x3bd484 = getStoryBackgroundTasks(_0x53bd61)['filter'](
          (_0x1b51df) =>
            ['asset-image', 'asset-voice']['includes'](_0x1b51df['type']) &&
            _0x1b51df['resumable'] &&
            _0x1b51df['remoteTaskId'] &&
            ['queued', 'submitting', 'pending', 'running', 'recovering']['includes'](_0x1b51df['status']),
        );
      return (
        _0x3bd484['forEach']((_0x572ba3) => {
          _0x572ba3['type'] === 'asset-voice'
            ? void _0x16ed6f(_0x572ba3, _0x183e1b)
            : void _0x5a8cc6(_0x572ba3, _0x183e1b);
        }),
        _0x3bd484['length']
      );
    },
    _0x1a8569 = (_0x517e72, { showFallbackToast: showFallbackToast = !![] } = {}) => {
      const _0x43bd20 = _0x517e72?.['storyAssetGenerationContext'] || {},
        _0xe5aea = showTaskApiKeyError(_0x517e72, {
          providerId: _0x43bd20['payload']?.['provider'] || _0x16e813['imageProvider'],
          model: _0x43bd20['payload']?.['model'] || _0x16e813['models']['image'],
          adapterType: _0x43bd20['execution']?.['executionManifest']?.['adapterType'] || '',
        });
      if (!_0xe5aea && showFallbackToast)
        showTaskResultToast(
          _0x517e72?.['getUserMessage']?.() || _0x517e72?.['message'] || '图像生成失败，请稍后重试。',
          'error',
          _0x517e72,
        );
      else
        !_0xe5aea &&
          notifyTaskResult(
            null,
            _0x517e72?.['getUserMessage']?.() || _0x517e72?.['message'] || '图像生成失败，请稍后重试。',
            'error',
            { details: _0x517e72 },
          );
      return _0xe5aea;
    },
    _0x24682a = async () => {
      const _0x2a8da6 = _0x34378d(_0x16e813['selectedAssetId']),
        _0x3dd16b = _0x2a8da6 ? _0x508136(_0x16e813, _0x2a8da6) : null;
      if (
        !_0x2a8da6 ||
        !_0x3dd16b ||
        _0x2a8da6['isLibraryAsset'] ||
        isStoryAssetAppearanceLoading(_0x16e813, _0x2a8da6['id'], _0x3dd16b['id'])
      )
        return;
      if (!normalizeText(_0x3dd16b['prompt'])) {
        showToast('请先填写提示词。', 'warn');
        return;
      }
      if (shouldGenerateStoryAssetBaseAppearanceFirst(_0x2a8da6, _0x3dd16b)) {
        showToast('请先生成基础形象，再生成其他形象。', 'warn');
        return;
      }
      if (!hasImageGenerator()) {
        showToast('图像生成服务尚未初始化。', 'error');
        return;
      }
      const _0x47e789 = _0xc0adb9();
      (setStoryAssetAppearanceGenerating(_0x16e813, _0x2a8da6['id'], _0x3dd16b['id'], !![]),
        (_0x3dd16b['error'] = ''),
        render());
      try {
        await _0x3de53a(_0x2a8da6, _0x3dd16b, { projectToken: _0x47e789 });
        if (!_0x537777(_0x47e789)) return ![];
        return (
          showNavigableTaskResultToast('当前形象已生成。', 'success', _0x47e789, {
            step: 0x2,
            assetId: _0x2a8da6['id'],
          }),
          schedulePersistence({ immediate: !![] }),
          !![]
        );
      } catch (_0x96bacf) {
        if (!_0x537777(_0x47e789)) return ![];
        return (
          (_0x3dd16b['error'] = _0x96bacf?.['getUserMessage']?.() || _0x96bacf?.['message'] || '生成失败'),
          _0x1a8569(_0x96bacf),
          ![]
        );
      } finally {
        _0x54b1cb(_0x47e789) &&
          (setStoryAssetAppearanceGenerating(_0x16e813, _0x2a8da6['id'], _0x3dd16b['id'], ![]), render());
      }
    };
  return Object['freeze']({
    previewSelected: () => {
      const _0x337e09 = _0x34378d(_0x16e813['selectedAssetId']),
        _0x4d36c6 = _0x337e09 ? _0x508136(_0x16e813, _0x337e09) : null;
      if (!_0x337e09 || !_0x4d36c6) throw new Error('请先选择素材形象');
      return _0x215079(_0x337e09, _0x4d36c6);
    },
    applyImageResult: _0x2736c1,
    canResumeImageTask: _0xcf6a51,
    generateSelected: _0x24682a,
    getAppearanceGenerationContext: _0x215079,
    requestAppearanceImage: _0x3de53a,
    resumeImageTask: _0x5a8cc6,
    resumePersistedTasks: _0x2afc9a,
    resumeVoiceTask: _0x16ed6f,
    showGenerationError: _0x1a8569,
  });
}
