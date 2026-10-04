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
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryAssetBatchGenerationController({
  state: state,
  windowObject: windowObject = globalThis,
  cancellationRegistry: cancellationRegistry,
  hasImageGenerator: hasImageGenerator = () => ![],
  createProjectToken: createProjectToken,
  isProjectTaskLive: isProjectTaskLive,
  isProjectTaskCurrent: isProjectTaskCurrent,
  createTaskBatch: createTaskBatch,
  syncTaskBatch: syncTaskBatch,
  updateBackgroundTaskBatch: updateBackgroundTaskBatch,
  requestAppearanceImage: requestAppearanceImage,
  requestVoiceGeneration: requestVoiceGeneration,
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
  if (!state || !cancellationRegistry)
    throw new TypeError(
      'Story\x20asset\x20batch\x20generation\x20requires\x20state\x20and\x20cancellation\x20owners.',
    );
  if (
    typeof createProjectToken !== 'function' ||
    typeof isProjectTaskLive !== 'function' ||
    typeof isProjectTaskCurrent !== 'function' ||
    typeof createTaskBatch !== 'function' ||
    typeof syncTaskBatch !== 'function' ||
    typeof updateBackgroundTaskBatch !== 'function' ||
    typeof requestAppearanceImage !== 'function' ||
    typeof requestVoiceGeneration !== 'function'
  )
    throw new TypeError('Story\x20asset\x20batch\x20generation\x20requires\x20task\x20adapters.');
  const getActiveTargets = (item, key) => {
      const text = normalizeText(key),
        tasks = getStoryBackgroundTasks(item)['filter'](
          (index) => isStoryBackgroundTaskActive(index) && normalizeText(index['batch']?.['id']) === text,
        ),
        result = tasks['filter']((data) => data['type'] === 'asset-image')
          ['map']((options) =>
            getStoryAssetAppearanceGenerationKey(
              options['scope']?.['assetId'],
              options['scope']?.['appearanceId'],
            ),
          )
          ['filter'](Boolean),
        target = tasks['filter']((source) => source['type'] === 'asset-voice')
          ['map']((next) => normalizeText(next['scope']?.['assetId']))
          ['filter'](Boolean);
      return {
        tasks: tasks,
        appearanceKeys: [...new Set(result)],
        voiceAssetIds: [...new Set(target)],
        assetIds: [
          ...new Set(
            tasks['filter']((current) => current['type'] === 'asset-image')
              ['map']((entry) => normalizeText(entry['scope']?.['assetId']))
              ['filter'](Boolean),
          ),
        ],
      };
    },
    cancel = () => {
      if (!state['isBatchGenerating'] || state['assetBatchCancelRequested']) return ![];
      const storyBackgroundTasks = getStoryBackgroundTasks(state['data'])['find'](
          (record) => isStoryBackgroundTaskActive(record) && record['batch']?.['type'] === 'asset-generation',
        ),
        text2 = normalizeText(state['assetBatchId'] || storyBackgroundTasks?.['batch']?.['id']),
        enabled = storyBackgroundTasks?.['batch'];
      if (!text2 || !enabled) return ![];
      const payload = getActiveTargets(state['data'], text2),
        cancelledAppearanceKeys = buildStoryAssetBatchCancellationUpdate(enabled, payload);
      if (!cancelledAppearanceKeys['canCancel'])
        return (showToast('当前任务正在生成，暂无可取消的后续任务。', 'info'), ![]);
      if (!cancellationRegistry['request'](text2)) return ![];
      return (
        updateBackgroundTaskBatch(createProjectToken(), text2, {
          cancelRequested: !![],
          cancelledAppearanceKeys: cancelledAppearanceKeys['cancelledAppearanceKeys'],
          cancelledVoiceAssetIds: cancelledAppearanceKeys['cancelledVoiceAssetIds'],
          pendingAssetIds: cancelledAppearanceKeys['pendingAssetIds'],
          pendingAppearanceKeys: cancelledAppearanceKeys['pendingAppearanceKeys'],
          pendingVoiceAssetIds: cancelledAppearanceKeys['pendingVoiceAssetIds'],
          label: cancelledAppearanceKeys['label'],
        }),
        (state['assetBatchId'] = text2),
        (state['assetBatchCancelRequested'] = !![]),
        (state['batchGeneratingAssetIds'] = cancelledAppearanceKeys['pendingAssetIds']),
        (state['batchGeneratingAppearanceKeys'] = cancelledAppearanceKeys['pendingAppearanceKeys']),
        (state['batchGeneratingVoiceAssetIds'] = cancelledAppearanceKeys['pendingVoiceAssetIds']),
        (state['batchGenerationLabel'] = cancelledAppearanceKeys['label']),
        render(),
        showToast(
          '已取消后续 ' + cancelledAppearanceKeys['cancelledCount'] + ' 项生成；当前任务会继续完成。',
          'info',
        ),
        !![]
      );
    },
    generate = async (handle = 'all') => {
      if (state['isBatchGenerating']) return;
      const assetId = state['data']['assets']['filter'](
          (enabled2) => state['selectedAssetIds']['includes'](enabled2['id']) && !enabled2['isLibraryAsset'],
        ),
        total = buildStoryAssetBatchGenerationPlan(assetId, handle);
      if (total['imageTasks']['length'] && !hasImageGenerator()) {
        showToast('图像生成服务尚未初始化。', 'error');
        return;
      }
      if (!total['totalTasks']) {
        showToast(
          total['mode'] === 'image'
            ? '所选项目没有待生成形象。'
            : total['mode'] === 'voice'
              ? '所选项目没有待生成语音。'
              : '所选项目没有待生成内容。',
          'info',
        );
        return;
      }
      const map = new Set(
          Array['isArray'](state['generatingAppearanceKeys']) ? state['generatingAppearanceKeys'] : [],
        ),
        list = total['imageTasks']
          ['map'](({ asset: asset, appearance: appearance }) =>
            getStoryAssetAppearanceGenerationKey(asset['id'], appearance['id']),
          )
          ['filter'](Boolean),
        list2 = [
          ...new Set(
            total['voiceAssets']['map']((config) => normalizeText(config?.['id']))['filter'](Boolean),
          ),
        ],
        map2 = new Set(
          (Array['isArray'](state['generatingVoiceAssetIds']) ? state['generatingVoiceAssetIds'] : [])
            ['map'](normalizeText)
            ['filter'](Boolean),
        ),
        scope = list['some']((input) => map['has'](input)) || list2['some']((output) => map2['has'](output));
      if (scope) {
        showToast('所选素材已有生成任务正在运行。', 'info');
        return;
      }
      const projectToken = createProjectToken();
      ((state['isBatchGenerating'] = !![]),
        (state['batchGeneratingAssetIds'] = [
          ...new Set(total['imageTasks']['map'](({ asset: asset2 }) => asset2['id'])),
        ]),
        (state['batchGeneratingAppearanceKeys'] = [...list]),
        (state['batchGeneratingVoiceAssetIds'] = [...list2]),
        (state['assetBatchCancelRequested'] = ![]),
        (state['batchGenerationLabel'] = '批量生成 0/' + total['totalTasks']));
      const map3 = new Set(list),
        map4 = new Set(list2),
        pendingAssetIds = () => [
          ...new Set(
            total['imageTasks']
              ['filter'](({ asset: asset3, appearance: appearance2 }) =>
                map3['has'](getStoryAssetAppearanceGenerationKey(asset3['id'], appearance2['id'])),
              )
              ['map'](({ asset: asset4 }) => normalizeText(asset4['id']))
              ['filter'](Boolean),
          ),
        ],
        batch = createTaskBatch('asset-generation', {
          total: total['totalTasks'],
          completed: 0x0,
          pendingAssetIds: pendingAssetIds(),
          pendingAppearanceKeys: [...map3],
          pendingVoiceAssetIds: [...map4],
          cancelRequested: ![],
          label: state['batchGenerationLabel'],
        });
      state['assetBatchId'] = batch['id'];
      const value2 = {
        projectToken: projectToken,
        batch: batch,
        modelId: state['models']['image'],
        provider: state['imageProvider'],
        generationParams: { ...state['imageGenerationParams'] },
        promptPresetId: state['assetPromptPresetId'],
        scenePromptPresetId: state['sceneAssetPromptPresetId'],
      };
      let value3 = 0x0,
        value4 = 0x0,
        tone = 0x0,
        completed = 0x0,
        value5 = ![],
        showTaskApiKeyError2 = ![],
        enabled3 = ![],
        enabled4 = ![];
      const run = () => {
        const cancelRequested = cancellationRegistry['isRequested'](batch['id']),
          value6 = cancelRequested ? getActiveTargets(projectToken['data'], batch['id']) : null,
          pendingAssetIds2 = value6?.['assetIds'] || pendingAssetIds(),
          pendingAppearanceKeys = value6?.['appearanceKeys'] || [...map3],
          pendingVoiceAssetIds = value6?.['voiceAssetIds'] || [...map4],
          value7 = pendingAppearanceKeys['length'] + pendingVoiceAssetIds['length'],
          label = cancelRequested
            ? value7
              ? '已取消后续生成 · 正在完成 ' + value7 + '\x20项'
              : '已取消后续生成'
            : '批量生成 ' + completed + '/' + total['totalTasks'];
        syncTaskBatch(projectToken, batch, {
          completed: completed,
          cancelRequested: cancelRequested,
          pendingAssetIds: pendingAssetIds2,
          pendingAppearanceKeys: pendingAppearanceKeys,
          pendingVoiceAssetIds: pendingVoiceAssetIds,
          label: label,
        });
        if (!isProjectTaskCurrent(projectToken)) return;
        ((state['batchGenerationLabel'] = label), refreshBatchLabel());
      };
      (render(),
        await runStoryAssetBatchGenerationPhases(
          async () => {
            (await runStoryAssetAppearanceGenerationTasks(
              total['imageTasks'],
              async ({ asset: asset5, appearance: appearance3 }, { remainingTasks: remainingTasks }) => {
                if (!isProjectTaskLive(projectToken)) return;
                const storyAssetAppearanceGenerationKey = getStoryAssetAppearanceGenerationKey(
                  asset5['id'],
                  appearance3['id'],
                );
                if (value5) {
                  ((tone += 0x1),
                    (completed += 0x1),
                    map3['delete'](storyAssetAppearanceGenerationKey),
                    (appearance3['error'] = '缺少 API Key，已跳过当前形象。'));
                  isProjectTaskCurrent(projectToken) &&
                    ((state['batchGeneratingAppearanceKeys'] = state['batchGeneratingAppearanceKeys'][
                      'filter'
                    ]((value8) => value8 !== storyAssetAppearanceGenerationKey)),
                    settleStoryAssetBatchLoading(state, asset5, remainingTasks, { failed: !![] }),
                    refreshAssetCard(asset5['id']));
                  run();
                  return;
                }
                appearance3['error'] = '';
                isProjectTaskCurrent(projectToken) &&
                  state['selectedAssetId'] === asset5['id'] &&
                  refreshSelectedAsset();
                let failed = ![];
                try {
                  if (shouldGenerateStoryAssetBaseAppearanceFirst(asset5, appearance3))
                    throw new Error('基础形象尚未生成，已跳过当前形象。');
                  await requestAppearanceImage(asset5, appearance3, value2);
                  if (!isProjectTaskLive(projectToken)) return;
                  value3 += 0x1;
                } catch (error) {
                  if (!isProjectTaskLive(projectToken)) return;
                  ((failed = !![]),
                    (tone += 0x1),
                    (appearance3['error'] =
                      error?.['getUserMessage']?.() || error?.['message'] || '生成失败'),
                    (value5 = value5 || showAssetGenerationError(error, { showFallbackToast: ![] })),
                    (enabled3 = enabled3 || value5));
                }
                ((completed += 0x1), map3['delete'](storyAssetAppearanceGenerationKey));
                if (isProjectTaskCurrent(projectToken)) {
                  ((state['batchGeneratingAppearanceKeys'] = state['batchGeneratingAppearanceKeys']['filter'](
                    (value9) => value9 !== storyAssetAppearanceGenerationKey,
                  )),
                    settleStoryAssetBatchLoading(
                      state,
                      asset5,
                      cancellationRegistry['isRequested'](batch['id']) ? [] : remainingTasks,
                      { failed: failed },
                    ),
                    refreshAssetCard(asset5['id']));
                  if (state['selectedAssetId'] === asset5['id']) refreshSelectedAsset();
                }
                (run(), schedulePersistence({ immediate: !![] }));
              },
              { shouldStop: () => cancellationRegistry['isRequested'](batch['id']) },
            ),
              isProjectTaskCurrent(projectToken) &&
                ((state['batchGeneratingAssetIds'] = []), (state['batchGeneratingAppearanceKeys'] = [])));
          },
          async () => {
            for (const asset6 of total['voiceAssets']) {
              if (!isProjectTaskLive(projectToken)) return;
              if (cancellationRegistry['isRequested'](batch['id'])) break;
              if (showTaskApiKeyError2) {
                ((tone += 0x1), (completed += 0x1), map4['delete'](normalizeText(asset6['id'])));
                isProjectTaskCurrent(projectToken) &&
                  (state['batchGeneratingVoiceAssetIds'] = state['batchGeneratingVoiceAssetIds']['filter'](
                    (value10) => normalizeText(value10) !== normalizeText(asset6['id']),
                  ));
                run();
                continue;
              }
              let modelId = null;
              const value11 =
                isProjectTaskCurrent(projectToken) &&
                state['characterVoiceEditor']?.['assetId'] === asset6['id'];
              value11 && ((state['characterVoiceEditor']['isGenerating'] = !![]), render());
              try {
                const editor = value11
                  ? state['characterVoiceEditor']
                  : createStoryCharacterVoiceEditorDraft({ asset: asset6, data: projectToken['data'] });
                modelId = getStoryCharacterVoiceWorkflow(editor['nodeData']?.['model']);
                if (!modelId) throw new Error('当前没有可用的音频模型。');
                if (modelId['vip'] === !![]) {
                  const run2 = windowObject?.['isModelAllowedBySubscription'],
                    enabled5 = typeof run2 === 'function' ? run2(modelId['key'], modelId['provider']) : !![];
                  if (!enabled5) {
                    !enabled4 &&
                      isProjectTaskCurrent(projectToken) &&
                      (windowObject?.['openSubscriptionDialog']?.({
                        modelId: modelId['key'],
                        provider: modelId['provider'],
                      }),
                      (enabled4 = !![]));
                    throw new Error('当前声音模型需要高级会员。已停止批量语音生成。');
                  }
                }
                const installId =
                  modelId['vip'] === !![] &&
                  typeof windowObject?.['ensureSubscriptionInstallId'] === 'function'
                    ? await windowObject['ensureSubscriptionInstallId']()
                    : windowObject?.['__aicInstallId'] || '';
                if (!isProjectTaskLive(projectToken)) return;
                const enabled6 = await requestVoiceGeneration({
                  asset: asset6,
                  editor: editor,
                  installId: installId,
                  projectToken: projectToken,
                  batch: batch,
                });
                if (!isProjectTaskLive(projectToken)) return;
                if (!enabled6) throw new Error('音频模型没有返回可用的声音结果。');
                if (isProjectTaskCurrent(projectToken)) stopVoicePreview();
                replaceStoryCharacterVoiceReference(asset6, enabled6);
                if (value11) state['characterVoiceEditor']['error'] = '';
                value4 += 0x1;
              } catch (error2) {
                if (!isProjectTaskLive(projectToken)) return;
                ((tone += 0x1),
                  (showTaskApiKeyError2 = showTaskApiKeyError(error2, {
                    provider: modelId?.['provider'],
                    modelId: modelId?.['key'],
                  })),
                  (enabled3 = enabled3 || showTaskApiKeyError2),
                  !showTaskApiKeyError2 &&
                    notifyTaskResult(
                      null,
                      error2?.['message'] ||
                        '角色“' + (normalizeText(asset6['name']) || asset6['id']) + '”声音生成失败。',
                      'error',
                      { details: { assetId: asset6['id'], error: error2 } },
                    ));
              }
              if (value11) state['characterVoiceEditor']['isGenerating'] = ![];
              map4['delete'](normalizeText(asset6['id']));
              isProjectTaskCurrent(projectToken) &&
                (state['batchGeneratingVoiceAssetIds'] = state['batchGeneratingVoiceAssetIds']['filter'](
                  (value12) => normalizeText(value12) !== normalizeText(asset6['id']),
                ));
              ((completed += 0x1), run());
              if (value11) render();
              else {
                if (isProjectTaskCurrent(projectToken)) {
                  refreshAssetCard(asset6['id']);
                  if (state['selectedAssetId'] === asset6['id']) refreshSelectedAsset();
                }
              }
              schedulePersistence({ immediate: !![] });
              if (enabled4) break;
            }
          },
        ));
      const value13 = cancellationRegistry['isRequested'](batch['id']),
        value14 = value13 ? map3['size'] + map4['size'] : 0x0;
      value13 &&
        syncTaskBatch(projectToken, batch, {
          completed: completed,
          cancelRequested: !![],
          cancelledAppearanceKeys: [...map3],
          cancelledVoiceAssetIds: [...map4],
          pendingAssetIds: [],
          pendingAppearanceKeys: [],
          pendingVoiceAssetIds: [],
          label: '已取消后续\x20' + value14 + ' 项生成',
        });
      cancellationRegistry['clear'](batch['id']);
      if (!isProjectTaskLive(projectToken)) return ![];
      isProjectTaskCurrent(projectToken) &&
        ((state['isBatchGenerating'] = ![]),
        (state['batchGeneratingAssetIds'] = []),
        (state['batchGeneratingAppearanceKeys'] = []),
        (state['batchGeneratingVoiceAssetIds'] = []),
        (state['assetBatchId'] = ''),
        (state['assetBatchCancelRequested'] = ![]),
        (state['batchGenerationLabel'] = ''),
        render());
      schedulePersistence({ immediate: !![] });
      const value15 = [
        total['mode'] !== 'voice' ? '图片\x20' + value3 : '',
        total['mode'] !== 'image' ? '语音 ' + value4 : '',
      ]
        ['filter'](Boolean)
        ['join']('，');
      if (value13)
        return (
          showNavigableTaskResultToast(
            tone
              ? '已取消后续 ' + value14 + ' 项生成；' + value15 + '，失败 ' + tone + '。'
              : '已取消后续 ' + value14 + ' 项生成；' + value15 + '。',
            tone ? 'warn' : 'info',
            projectToken,
            { step: 0x2, assetId: assetId[0x0]?.['id'] },
          ),
          !![]
        );
      return (
        notifyNavigableGenerationComplete(
          tone ? '批量生成完成：' + value15 + '，失败 ' + tone + '。' : '批量生成完成：' + value15 + '。',
          projectToken,
          { step: 0x2, assetId: assetId[0x0]?.['id'] },
          { tone: tone ? 'warn' : 'success', showResultToast: !enabled3 },
        ),
        !![]
      );
    };
  return Object['freeze']({ cancel: cancel, generate: generate, getActiveTargets: getActiveTargets });
}
