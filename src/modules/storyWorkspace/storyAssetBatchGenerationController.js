import { getStoryBackgroundTasks, isStoryBackgroundTaskActive } from './storyBackgroundTasks.js';
import {
  runStoryAssetAppearanceGenerationTasks,
  shouldGenerateStoryAssetBaseAppearanceFirst,
} from './storyAssetAppearances.js';
import {
  buildStoryAssetBatchCancellationUpdate,
  buildStoryAssetBatchGenerationPlan,
  runStoryAssetBatchGenerationPhases,
  settleStoryAssetBatchLoading,
} from './storyAssetGenerationState.js';
import {
  createStoryCharacterVoiceEditorDraft,
  getStoryCharacterVoiceWorkflow,
  replaceStoryCharacterVoiceReference,
} from './storyCharacterVoice.js';
import { getStoryAssetAppearanceGenerationKey } from './storyProjectTaskState.js';
function normalizeText(_0x363c1d) {
  return String(_0x363c1d ?? '')['trim']();
}
export function createStoryAssetBatchGenerationController({
  state: _0x51162e,
  windowObject: windowObject = globalThis,
  cancellationRegistry: _0x560d8c,
  hasImageGenerator: hasImageGenerator = () => ![],
  createProjectToken: _0x416dbc,
  isProjectTaskLive: _0x51bce5,
  isProjectTaskCurrent: _0x3b35ca,
  createTaskBatch: _0x246263,
  syncTaskBatch: _0x196432,
  updateBackgroundTaskBatch: _0xdd6491,
  requestAppearanceImage: _0x4bda4a,
  requestVoiceGeneration: _0x37b18b,
  stopVoicePreview: stopVoicePreview = () => {},
  render: render = () => {},
  refreshBatchLabel: refreshBatchLabel = () => {},
  refreshAssetCard: refreshAssetCard = () => {},
  refreshSelectedAsset: refreshSelectedAsset = () => {},
  schedulePersistence: schedulePersistence = () => {},
  showToast: showToast = () => {},
  showAssetGenerationError: showAssetGenerationError = () => ![],
  showTaskApiKeyError: showTaskApiKeyError = () => ![],
  notifyTaskResult: notifyTaskResult = () => {},
  showNavigableTaskResultToast: showNavigableTaskResultToast = () => {},
  notifyNavigableGenerationComplete: notifyNavigableGenerationComplete = () => {},
} = {}) {
  if (!_0x51162e || !_0x560d8c)
    throw new TypeError(
      'Story\x20asset\x20batch\x20generation\x20requires\x20state\x20and\x20cancellation\x20owners.',
    );
  if (
    typeof _0x416dbc !== 'function' ||
    typeof _0x51bce5 !== 'function' ||
    typeof _0x3b35ca !== 'function' ||
    typeof _0x246263 !== 'function' ||
    typeof _0x196432 !== 'function' ||
    typeof _0xdd6491 !== 'function' ||
    typeof _0x4bda4a !== 'function' ||
    typeof _0x37b18b !== 'function'
  )
    throw new TypeError('Story\x20asset\x20batch\x20generation\x20requires\x20task\x20adapters.');
  const _0x1795d4 = (_0x4222a9, _0xa9347b) => {
      const _0x54b0a1 = normalizeText(_0xa9347b),
        _0x29115b = getStoryBackgroundTasks(_0x4222a9)['filter'](
          (_0x29bd1c) =>
            isStoryBackgroundTaskActive(_0x29bd1c) && normalizeText(_0x29bd1c['batch']?.['id']) === _0x54b0a1,
        ),
        _0x4eebdf = _0x29115b['filter']((_0x4d6c47) => _0x4d6c47['type'] === 'asset-image')
          ['map']((_0x324591) =>
            getStoryAssetAppearanceGenerationKey(
              _0x324591['scope']?.['assetId'],
              _0x324591['scope']?.['appearanceId'],
            ),
          )
          ['filter'](Boolean),
        _0x4e10df = _0x29115b['filter']((_0x5aca26) => _0x5aca26['type'] === 'asset-voice')
          ['map']((_0x10932f) => normalizeText(_0x10932f['scope']?.['assetId']))
          ['filter'](Boolean);
      return {
        tasks: _0x29115b,
        appearanceKeys: [...new Set(_0x4eebdf)],
        voiceAssetIds: [...new Set(_0x4e10df)],
        assetIds: [
          ...new Set(
            _0x29115b['filter']((_0x466f66) => _0x466f66['type'] === 'asset-image')
              ['map']((_0x44ba1b) => normalizeText(_0x44ba1b['scope']?.['assetId']))
              ['filter'](Boolean),
          ),
        ],
      };
    },
    _0x11689e = () => {
      if (!_0x51162e['isBatchGenerating'] || _0x51162e['assetBatchCancelRequested']) return ![];
      const _0x5039e3 = getStoryBackgroundTasks(_0x51162e['data'])['find'](
          (_0x556617) =>
            isStoryBackgroundTaskActive(_0x556617) && _0x556617['batch']?.['type'] === 'asset-generation',
        ),
        _0x15c8a6 = normalizeText(_0x51162e['assetBatchId'] || _0x5039e3?.['batch']?.['id']),
        _0x38d98a = _0x5039e3?.['batch'];
      if (!_0x15c8a6 || !_0x38d98a) return ![];
      const _0xa94b64 = _0x1795d4(_0x51162e['data'], _0x15c8a6),
        _0x1cb5b4 = buildStoryAssetBatchCancellationUpdate(_0x38d98a, _0xa94b64);
      if (!_0x1cb5b4['canCancel'])
        return (showToast('当前任务正在生成，暂无可取消的后续任务。', 'info'), ![]);
      if (!_0x560d8c['request'](_0x15c8a6)) return ![];
      return (
        _0xdd6491(_0x416dbc(), _0x15c8a6, {
          cancelRequested: !![],
          cancelledAppearanceKeys: _0x1cb5b4['cancelledAppearanceKeys'],
          cancelledVoiceAssetIds: _0x1cb5b4['cancelledVoiceAssetIds'],
          pendingAssetIds: _0x1cb5b4['pendingAssetIds'],
          pendingAppearanceKeys: _0x1cb5b4['pendingAppearanceKeys'],
          pendingVoiceAssetIds: _0x1cb5b4['pendingVoiceAssetIds'],
          label: _0x1cb5b4['label'],
        }),
        (_0x51162e['assetBatchId'] = _0x15c8a6),
        (_0x51162e['assetBatchCancelRequested'] = !![]),
        (_0x51162e['batchGeneratingAssetIds'] = _0x1cb5b4['pendingAssetIds']),
        (_0x51162e['batchGeneratingAppearanceKeys'] = _0x1cb5b4['pendingAppearanceKeys']),
        (_0x51162e['batchGeneratingVoiceAssetIds'] = _0x1cb5b4['pendingVoiceAssetIds']),
        (_0x51162e['batchGenerationLabel'] = _0x1cb5b4['label']),
        render(),
        showToast('已取消后续 ' + _0x1cb5b4['cancelledCount'] + ' 项生成；当前任务会继续完成。', 'info'),
        !![]
      );
    },
    _0x4eaa2e = async (_0x18e732 = 'all') => {
      if (_0x51162e['isBatchGenerating']) return;
      const _0x40012f = _0x51162e['data']['assets']['filter'](
          (_0x3b7add) =>
            _0x51162e['selectedAssetIds']['includes'](_0x3b7add['id']) && !_0x3b7add['isLibraryAsset'],
        ),
        _0x4a74ed = buildStoryAssetBatchGenerationPlan(_0x40012f, _0x18e732);
      if (_0x4a74ed['imageTasks']['length'] && !hasImageGenerator()) {
        showToast('图像生成服务尚未初始化。', 'error');
        return;
      }
      if (!_0x4a74ed['totalTasks']) {
        showToast(
          _0x4a74ed['mode'] === 'image'
            ? '所选项目没有待生成形象。'
            : _0x4a74ed['mode'] === 'voice'
              ? '所选项目没有待生成语音。'
              : '所选项目没有待生成内容。',
          'info',
        );
        return;
      }
      const _0x57166c = new Set(
          Array['isArray'](_0x51162e['generatingAppearanceKeys'])
            ? _0x51162e['generatingAppearanceKeys']
            : [],
        ),
        _0x4f7d1c = _0x4a74ed['imageTasks']
          ['map'](({ asset: _0x528b7e, appearance: _0x48ce4a }) =>
            getStoryAssetAppearanceGenerationKey(_0x528b7e['id'], _0x48ce4a['id']),
          )
          ['filter'](Boolean),
        _0x4d083f = [
          ...new Set(
            _0x4a74ed['voiceAssets']
              ['map']((_0x191cad) => normalizeText(_0x191cad?.['id']))
              ['filter'](Boolean),
          ),
        ],
        _0x84092a = new Set(
          (Array['isArray'](_0x51162e['generatingVoiceAssetIds']) ? _0x51162e['generatingVoiceAssetIds'] : [])
            ['map'](normalizeText)
            ['filter'](Boolean),
        ),
        _0x380f5e =
          _0x4f7d1c['some']((_0x27d7b1) => _0x57166c['has'](_0x27d7b1)) ||
          _0x4d083f['some']((_0xfb87a9) => _0x84092a['has'](_0xfb87a9));
      if (_0x380f5e) {
        showToast('所选素材已有生成任务正在运行。', 'info');
        return;
      }
      const _0x434af6 = _0x416dbc();
      ((_0x51162e['isBatchGenerating'] = !![]),
        (_0x51162e['batchGeneratingAssetIds'] = [
          ...new Set(_0x4a74ed['imageTasks']['map'](({ asset: _0x6c69b2 }) => _0x6c69b2['id'])),
        ]),
        (_0x51162e['batchGeneratingAppearanceKeys'] = [..._0x4f7d1c]),
        (_0x51162e['batchGeneratingVoiceAssetIds'] = [..._0x4d083f]),
        (_0x51162e['assetBatchCancelRequested'] = ![]),
        (_0x51162e['batchGenerationLabel'] = '批量生成 0/' + _0x4a74ed['totalTasks']));
      const _0x4ffc12 = new Set(_0x4f7d1c),
        _0x42c62b = new Set(_0x4d083f),
        _0x1eb456 = () => [
          ...new Set(
            _0x4a74ed['imageTasks']
              ['filter'](({ asset: _0x3a4634, appearance: _0x115547 }) =>
                _0x4ffc12['has'](getStoryAssetAppearanceGenerationKey(_0x3a4634['id'], _0x115547['id'])),
              )
              ['map'](({ asset: _0x563556 }) => normalizeText(_0x563556['id']))
              ['filter'](Boolean),
          ),
        ],
        _0x336e96 = _0x246263('asset-generation', {
          total: _0x4a74ed['totalTasks'],
          completed: 0x0,
          pendingAssetIds: _0x1eb456(),
          pendingAppearanceKeys: [..._0x4ffc12],
          pendingVoiceAssetIds: [..._0x42c62b],
          cancelRequested: ![],
          label: _0x51162e['batchGenerationLabel'],
        });
      _0x51162e['assetBatchId'] = _0x336e96['id'];
      const _0x11b99b = {
        projectToken: _0x434af6,
        batch: _0x336e96,
        modelId: _0x51162e['models']['image'],
        provider: _0x51162e['imageProvider'],
        generationParams: { ..._0x51162e['imageGenerationParams'] },
        promptPresetId: _0x51162e['assetPromptPresetId'],
        scenePromptPresetId: _0x51162e['sceneAssetPromptPresetId'],
      };
      let _0x164830 = 0x0,
        _0x1d8799 = 0x0,
        _0x51cb3c = 0x0,
        _0x29c0f1 = 0x0,
        _0xd3e224 = ![],
        _0x33d1dc = ![],
        _0xb3d7b9 = ![],
        _0x21f402 = ![];
      const _0x40ac92 = () => {
        const _0x8e9e0 = _0x560d8c['isRequested'](_0x336e96['id']),
          _0x3d084a = _0x8e9e0 ? _0x1795d4(_0x434af6['data'], _0x336e96['id']) : null,
          _0x19b5cb = _0x3d084a?.['assetIds'] || _0x1eb456(),
          _0x28a84d = _0x3d084a?.['appearanceKeys'] || [..._0x4ffc12],
          _0x596905 = _0x3d084a?.['voiceAssetIds'] || [..._0x42c62b],
          _0x359332 = _0x28a84d['length'] + _0x596905['length'],
          _0x118a86 = _0x8e9e0
            ? _0x359332
              ? '已取消后续生成 · 正在完成 ' + _0x359332 + '\x20项'
              : '已取消后续生成'
            : '批量生成 ' + _0x29c0f1 + '/' + _0x4a74ed['totalTasks'];
        _0x196432(_0x434af6, _0x336e96, {
          completed: _0x29c0f1,
          cancelRequested: _0x8e9e0,
          pendingAssetIds: _0x19b5cb,
          pendingAppearanceKeys: _0x28a84d,
          pendingVoiceAssetIds: _0x596905,
          label: _0x118a86,
        });
        if (!_0x3b35ca(_0x434af6)) return;
        ((_0x51162e['batchGenerationLabel'] = _0x118a86), refreshBatchLabel());
      };
      (render(),
        await runStoryAssetBatchGenerationPhases(
          async () => {
            (await runStoryAssetAppearanceGenerationTasks(
              _0x4a74ed['imageTasks'],
              async ({ asset: _0x4a2673, appearance: _0x5cb74f }, { remainingTasks: _0x2f0292 }) => {
                if (!_0x51bce5(_0x434af6)) return;
                const _0x2f5738 = getStoryAssetAppearanceGenerationKey(_0x4a2673['id'], _0x5cb74f['id']);
                if (_0xd3e224) {
                  ((_0x51cb3c += 0x1),
                    (_0x29c0f1 += 0x1),
                    _0x4ffc12['delete'](_0x2f5738),
                    (_0x5cb74f['error'] = '缺少 API Key，已跳过当前形象。'));
                  _0x3b35ca(_0x434af6) &&
                    ((_0x51162e['batchGeneratingAppearanceKeys'] = _0x51162e['batchGeneratingAppearanceKeys'][
                      'filter'
                    ]((_0x385473) => _0x385473 !== _0x2f5738)),
                    settleStoryAssetBatchLoading(_0x51162e, _0x4a2673, _0x2f0292, { failed: !![] }),
                    refreshAssetCard(_0x4a2673['id']));
                  _0x40ac92();
                  return;
                }
                _0x5cb74f['error'] = '';
                _0x3b35ca(_0x434af6) &&
                  _0x51162e['selectedAssetId'] === _0x4a2673['id'] &&
                  refreshSelectedAsset();
                let _0x215731 = ![];
                try {
                  if (shouldGenerateStoryAssetBaseAppearanceFirst(_0x4a2673, _0x5cb74f))
                    throw new Error('基础形象尚未生成，已跳过当前形象。');
                  await _0x4bda4a(_0x4a2673, _0x5cb74f, _0x11b99b);
                  if (!_0x51bce5(_0x434af6)) return;
                  _0x164830 += 0x1;
                } catch (_0x492331) {
                  if (!_0x51bce5(_0x434af6)) return;
                  ((_0x215731 = !![]),
                    (_0x51cb3c += 0x1),
                    (_0x5cb74f['error'] =
                      _0x492331?.['getUserMessage']?.() || _0x492331?.['message'] || '生成失败'),
                    (_0xd3e224 =
                      _0xd3e224 || showAssetGenerationError(_0x492331, { showFallbackToast: ![] })),
                    (_0xb3d7b9 = _0xb3d7b9 || _0xd3e224));
                }
                ((_0x29c0f1 += 0x1), _0x4ffc12['delete'](_0x2f5738));
                if (_0x3b35ca(_0x434af6)) {
                  ((_0x51162e['batchGeneratingAppearanceKeys'] = _0x51162e['batchGeneratingAppearanceKeys'][
                    'filter'
                  ]((_0x2123b0) => _0x2123b0 !== _0x2f5738)),
                    settleStoryAssetBatchLoading(
                      _0x51162e,
                      _0x4a2673,
                      _0x560d8c['isRequested'](_0x336e96['id']) ? [] : _0x2f0292,
                      { failed: _0x215731 },
                    ),
                    refreshAssetCard(_0x4a2673['id']));
                  if (_0x51162e['selectedAssetId'] === _0x4a2673['id']) refreshSelectedAsset();
                }
                (_0x40ac92(), schedulePersistence({ immediate: !![] }));
              },
              { shouldStop: () => _0x560d8c['isRequested'](_0x336e96['id']) },
            ),
              _0x3b35ca(_0x434af6) &&
                ((_0x51162e['batchGeneratingAssetIds'] = []),
                (_0x51162e['batchGeneratingAppearanceKeys'] = [])));
          },
          async () => {
            for (const _0x3ca27b of _0x4a74ed['voiceAssets']) {
              if (!_0x51bce5(_0x434af6)) return;
              if (_0x560d8c['isRequested'](_0x336e96['id'])) break;
              if (_0x33d1dc) {
                ((_0x51cb3c += 0x1), (_0x29c0f1 += 0x1), _0x42c62b['delete'](normalizeText(_0x3ca27b['id'])));
                _0x3b35ca(_0x434af6) &&
                  (_0x51162e['batchGeneratingVoiceAssetIds'] = _0x51162e['batchGeneratingVoiceAssetIds'][
                    'filter'
                  ]((_0x2990d7) => normalizeText(_0x2990d7) !== normalizeText(_0x3ca27b['id'])));
                _0x40ac92();
                continue;
              }
              let _0x2dac81 = null;
              const _0x26f8b7 =
                _0x3b35ca(_0x434af6) && _0x51162e['characterVoiceEditor']?.['assetId'] === _0x3ca27b['id'];
              _0x26f8b7 && ((_0x51162e['characterVoiceEditor']['isGenerating'] = !![]), render());
              try {
                const _0x1237b3 = _0x26f8b7
                  ? _0x51162e['characterVoiceEditor']
                  : createStoryCharacterVoiceEditorDraft({ asset: _0x3ca27b, data: _0x434af6['data'] });
                _0x2dac81 = getStoryCharacterVoiceWorkflow(_0x1237b3['nodeData']?.['model']);
                if (!_0x2dac81) throw new Error('当前没有可用的音频模型。');
                if (_0x2dac81['vip'] === !![]) {
                  const _0x2592ac = windowObject?.['isModelAllowedBySubscription'],
                    _0x417f07 =
                      typeof _0x2592ac === 'function'
                        ? _0x2592ac(_0x2dac81['key'], _0x2dac81['provider'])
                        : !![];
                  if (!_0x417f07) {
                    !_0x21f402 &&
                      _0x3b35ca(_0x434af6) &&
                      (windowObject?.['openSubscriptionDialog']?.({
                        modelId: _0x2dac81['key'],
                        provider: _0x2dac81['provider'],
                      }),
                      (_0x21f402 = !![]));
                    throw new Error('当前声音模型需要高级会员。已停止批量语音生成。');
                  }
                }
                const _0x2ec1d5 =
                  _0x2dac81['vip'] === !![] &&
                  typeof windowObject?.['ensureSubscriptionInstallId'] === 'function'
                    ? await windowObject['ensureSubscriptionInstallId']()
                    : windowObject?.['__aicInstallId'] || '';
                if (!_0x51bce5(_0x434af6)) return;
                const _0xd63de9 = await _0x37b18b({
                  asset: _0x3ca27b,
                  editor: _0x1237b3,
                  installId: _0x2ec1d5,
                  projectToken: _0x434af6,
                  batch: _0x336e96,
                });
                if (!_0x51bce5(_0x434af6)) return;
                if (!_0xd63de9) throw new Error('音频模型没有返回可用的声音结果。');
                if (_0x3b35ca(_0x434af6)) stopVoicePreview();
                replaceStoryCharacterVoiceReference(_0x3ca27b, _0xd63de9);
                if (_0x26f8b7) _0x51162e['characterVoiceEditor']['error'] = '';
                _0x1d8799 += 0x1;
              } catch (_0x141b50) {
                if (!_0x51bce5(_0x434af6)) return;
                ((_0x51cb3c += 0x1),
                  (_0x33d1dc = showTaskApiKeyError(_0x141b50, {
                    provider: _0x2dac81?.['provider'],
                    modelId: _0x2dac81?.['key'],
                  })),
                  (_0xb3d7b9 = _0xb3d7b9 || _0x33d1dc),
                  !_0x33d1dc &&
                    notifyTaskResult(
                      null,
                      _0x141b50?.['message'] ||
                        '角色“' + (normalizeText(_0x3ca27b['name']) || _0x3ca27b['id']) + '”声音生成失败。',
                      'error',
                      { details: { assetId: _0x3ca27b['id'], error: _0x141b50 } },
                    ));
              }
              if (_0x26f8b7) _0x51162e['characterVoiceEditor']['isGenerating'] = ![];
              _0x42c62b['delete'](normalizeText(_0x3ca27b['id']));
              _0x3b35ca(_0x434af6) &&
                (_0x51162e['batchGeneratingVoiceAssetIds'] = _0x51162e['batchGeneratingVoiceAssetIds'][
                  'filter'
                ]((_0x577871) => normalizeText(_0x577871) !== normalizeText(_0x3ca27b['id'])));
              ((_0x29c0f1 += 0x1), _0x40ac92());
              if (_0x26f8b7) render();
              else {
                if (_0x3b35ca(_0x434af6)) {
                  refreshAssetCard(_0x3ca27b['id']);
                  if (_0x51162e['selectedAssetId'] === _0x3ca27b['id']) refreshSelectedAsset();
                }
              }
              schedulePersistence({ immediate: !![] });
              if (_0x21f402) break;
            }
          },
        ));
      const _0x4f0968 = _0x560d8c['isRequested'](_0x336e96['id']),
        _0x38f8c8 = _0x4f0968 ? _0x4ffc12['size'] + _0x42c62b['size'] : 0x0;
      _0x4f0968 &&
        _0x196432(_0x434af6, _0x336e96, {
          completed: _0x29c0f1,
          cancelRequested: !![],
          cancelledAppearanceKeys: [..._0x4ffc12],
          cancelledVoiceAssetIds: [..._0x42c62b],
          pendingAssetIds: [],
          pendingAppearanceKeys: [],
          pendingVoiceAssetIds: [],
          label: '已取消后续\x20' + _0x38f8c8 + ' 项生成',
        });
      _0x560d8c['clear'](_0x336e96['id']);
      if (!_0x51bce5(_0x434af6)) return ![];
      _0x3b35ca(_0x434af6) &&
        ((_0x51162e['isBatchGenerating'] = ![]),
        (_0x51162e['batchGeneratingAssetIds'] = []),
        (_0x51162e['batchGeneratingAppearanceKeys'] = []),
        (_0x51162e['batchGeneratingVoiceAssetIds'] = []),
        (_0x51162e['assetBatchId'] = ''),
        (_0x51162e['assetBatchCancelRequested'] = ![]),
        (_0x51162e['batchGenerationLabel'] = ''),
        render());
      schedulePersistence({ immediate: !![] });
      const _0x5aed13 = [
        _0x4a74ed['mode'] !== 'voice' ? '图片\x20' + _0x164830 : '',
        _0x4a74ed['mode'] !== 'image' ? '语音 ' + _0x1d8799 : '',
      ]
        ['filter'](Boolean)
        ['join']('，');
      if (_0x4f0968)
        return (
          showNavigableTaskResultToast(
            _0x51cb3c
              ? '已取消后续 ' + _0x38f8c8 + ' 项生成；' + _0x5aed13 + '，失败 ' + _0x51cb3c + '。'
              : '已取消后续 ' + _0x38f8c8 + ' 项生成；' + _0x5aed13 + '。',
            _0x51cb3c ? 'warn' : 'info',
            _0x434af6,
            { step: 0x2, assetId: _0x40012f[0x0]?.['id'] },
          ),
          !![]
        );
      return (
        notifyNavigableGenerationComplete(
          _0x51cb3c
            ? '批量生成完成：' + _0x5aed13 + '，失败 ' + _0x51cb3c + '。'
            : '批量生成完成：' + _0x5aed13 + '。',
          _0x434af6,
          { step: 0x2, assetId: _0x40012f[0x0]?.['id'] },
          { tone: _0x51cb3c ? 'warn' : 'success', showResultToast: !_0xb3d7b9 },
        ),
        !![]
      );
    };
  return Object['freeze']({ cancel: _0x11689e, generate: _0x4eaa2e, getActiveTargets: _0x1795d4 });
}
