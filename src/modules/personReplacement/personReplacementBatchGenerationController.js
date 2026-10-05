import { createTaskBatchCancellationController, runTaskBatchQueue } from '../../core/taskBatchExecution.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function isSameShotSelection(list, map) {
  return list['length'] === map['size'] && list['every']((item) => map['has'](item));
}
export function createPersonReplacementBatchGenerationController({
  getProject: getProject,
  buildImagePresentation: buildImagePresentation,
  getCharacterAppearance: getCharacterAppearance,
  runRequest: runRequest,
  requestRender: requestRender,
  refreshShotSelectionControls: refreshShotSelectionControls,
  resolveCharacterImageBatchConcurrency: resolveCharacterImageBatchConcurrency,
  onGenerateReplacementImageRequested: onGenerateReplacementImageRequested,
  onCancelReplacementImageRequested: onCancelReplacementImageRequested,
  onGenerateReplacementVideoRequested: onGenerateReplacementVideoRequested,
  onCancelReplacementVideoRequested: onCancelReplacementVideoRequested,
  onGenerateCharacterImageRequested: onGenerateCharacterImageRequested,
  onGenerationBatchCompleted: onGenerationBatchCompleted,
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof getProject !== 'function' ||
    typeof buildImagePresentation !== 'function' ||
    typeof getCharacterAppearance !== 'function' ||
    typeof runRequest !== 'function' ||
    typeof requestRender !== 'function' ||
    typeof refreshShotSelectionControls !== 'function' ||
    typeof resolveCharacterImageBatchConcurrency !== 'function'
  )
    throw new TypeError(
      'Person replacement batch generation requires project and task adapters.',
    );
  const map2 = new Map();
  let key = 0,
    active = false,
    label = '',
    map3 = new Set(),
    map4 = new Set(),
    cancelRequested = null;
  const run = () => {
      if (!refreshShotSelectionControls()) requestRender();
    },
    handler = () => {
      const index = getProject();
      return new Set(
        Array['isArray'](index['workspace']['selectedShotIds'])
          ? index['workspace']['selectedShotIds']['map'](normalizeText)['filter'](Boolean)
          : [],
      );
    },
    getMatchingShotSession = () => {
      const result = getProject(),
        text = normalizeText(result['id']),
        data = result['workspace']['step'] === 3 ? 'video' : 'image',
        enabled = handler();
      if (!text || !enabled['size']) return null;
      return (
        [...map2['values']()]['find'](
          (options) =>
            options['projectId'] === text &&
            options['kind'] === data &&
            isSameShotSelection(options['targetShotIds'], enabled),
        ) || null
      );
    },
    generatingShotIds = () => {
      const target = getProject(),
        text2 = normalizeText(target['id']),
        source = target['workspace']['step'] === 3 ? 'video' : 'image';
      return [
        ...new Set(
          [...map2['values']()]
            ['filter']((next) => next['projectId'] === text2 && next['kind'] === source)
            ['flatMap']((args) => [...args['generatingShotIds']]),
        ),
      ];
    },
    getShotRenderState = () => {
      const label2 = getMatchingShotSession();
      return {
        active: Boolean(label2),
        label: label2?.['label'] || '',
        generatingShotIds: generatingShotIds(),
        cancelRequested: label2?.['cancellation']?.['isRequested']?.() === true,
      };
    },
    getAssetRenderState = () => ({
      active: active,
      label: label,
      generatingCharacterIds: [...map3],
      cancelRequested: cancelRequested?.['isRequested']?.() === true,
    }),
    isShotBatchForCurrentProject = () => Boolean(getMatchingShotSession()),
    runShotBatch = (current = 'image') => {
      const args2 = getProject(),
        list2 = [...new Set(args2['workspace']['selectedShotIds']['map'](normalizeText)['filter'](Boolean))];
      if (!list2['length']) return false;
      const text3 = normalizeText(args2['workspace']['selectedShotId']),
        targetShotIds = list2['includes'](text3)
          ? [text3, ...list2['filter']((entry) => entry !== text3)]
          : list2,
        kind = current === 'video',
        projectId = normalizeText(args2['id']),
        record = [...map2['values']()]['find'](
          (payload) =>
            payload['projectId'] === projectId &&
            payload['kind'] === current &&
            isSameShotSelection(payload['targetShotIds'], new Set(targetShotIds)),
        );
      if (record) return false;
      const list3 = kind
        ? []
        : targetShotIds['map']((handle) => args2['shots']['find']((state) => state['id'] === handle))[
            'filter'
          ]((enabled2) => {
            if (!enabled2) return false;
            const enabled3 = buildImagePresentation({
              ...args2,
              workspace: { ...args2['workspace'], selectedShotId: normalizeText(enabled2['id']) },
            });
            return !enabled3['gate']['sceneOnly'] && enabled3['gate']['duplicateRoleLabels']['length'] > 0;
          });
      if (list3['length'])
        return (
          windowObject?.['showToast']?.(
            '有 ' + list3['length'] + ' 个镜头存在重复角色名，请先修改红色框中的角色。',
            'warn',
          ),
          false
        );
      const config = kind ? onGenerateReplacementVideoRequested : onGenerateReplacementImageRequested,
        label3 = kind ? '批量生成视频' : '批量生成',
        cancellation = createTaskBatchCancellationController(),
        id = 'shot-batch-' + ++key,
        scope = {
          id: id,
          projectId: projectId,
          kind: kind ? 'video' : 'image',
          targetShotIds: targetShotIds,
          generatingShotIds: new Set(targetShotIds),
          activeShotIds: new Set(),
          cancellation: cancellation,
          label: label3 + ' 0/' + targetShotIds['length'],
        };
      (map2['set'](id, scope), run());
      let input = 0;
      return (
        void runTaskBatchQueue({
          targets: targetShotIds,
          concurrency: targetShotIds['length'],
          shouldStop: cancellation['isRequested'],
          onTargetStart: ({ target: target2 }) => {
            scope['activeShotIds']['add'](target2);
          },
          runTarget: (shotId) =>
            runRequest(
              config,
              { projectId: projectId, shotId: shotId, notifyCompletion: false },
              {},
              { applyCallbackResult: !kind },
            ),
          onTargetSettled: ({ target: target3 }) => {
            (scope['activeShotIds']['delete'](target3),
              scope['generatingShotIds']['delete'](target3),
              (input += 1),
              (scope['label'] = cancellation['isRequested']()
                ? '正在停止批量生成 · 已结束 ' + input + '/' + targetShotIds['length']
                : label3 + ' ' + input + '/' + targetShotIds['length']),
              run());
          },
        })
          ['then']((cancelledCount) => {
            const totalCount = cancelledCount['filter']((response) => response['status'] !== 'cancelled'),
              successCount = totalCount['filter'](
                (el) => el['status'] === 'fulfilled' && el['value']?.['ok'] === true,
              )['length'];
            runRequest(
              onGenerationBatchCompleted,
              {
                kind: kind ? 'video' : 'image',
                projectId: projectId,
                shotIds: targetShotIds,
                totalCount: totalCount['length'],
                successCount: successCount,
                failureCount: totalCount['length'] - successCount,
                ...(cancelledCount['length'] > totalCount['length']
                  ? { cancelledCount: cancelledCount['length'] - totalCount['length'] }
                  : {}),
              },
              {},
              { applyCallbackResult: false },
            );
          })
          ['finally'](() => {
            if (map2['get'](id) !== scope) return;
            (map2['delete'](id), run());
          }),
        true
      );
    },
    cancelShotBatch = () => {
      const projectId2 = getMatchingShotSession(),
        enabled4 = projectId2?.['cancellation'];
      if (!projectId2 || !enabled4?.['request']?.()) return false;
      const list4 = [...projectId2['activeShotIds']];
      ((projectId2['generatingShotIds'] = new Set(list4)), (projectId2['label'] = '正在停止批量生成'), run());
      const output =
        projectId2['kind'] === 'video'
          ? onCancelReplacementVideoRequested
          : onCancelReplacementImageRequested;
      return (
        void Promise['allSettled'](
          list4['map']((shotId2) =>
            Promise['resolve'](
              runRequest(
                output,
                { projectId: projectId2['projectId'], shotId: shotId2 },
                {},
                { applyCallbackResult: false },
              ),
            ),
          ),
        ),
        true
      );
    },
    runAssetBatch = () => {
      if (active) return false;
      const modelId = getProject(),
        targetCount = [
          ...new Set(
            modelId['workspace']['selectedAssetIds']
              ['map'](normalizeText)
              ['filter'](
                (value2) => value2 && modelId['characters']['some']((value3) => value3['id'] === value2),
              ),
          ),
        ];
      if (!targetCount['length']) return false;
      const shouldStop = createTaskBatchCancellationController();
      ((cancelRequested = shouldStop),
        (active = true),
        (map3 = new Set(targetCount)),
        (map4 = new Set()),
        (label = '批量生成 0/' + targetCount['length']),
        requestRender());
      let value4 = 0;
      const concurrency = resolveCharacterImageBatchConcurrency({
        targetCount: targetCount['length'],
        modelId: modelId['settings']['characterImageModelId'],
        provider: modelId['settings']['characterImageProvider'],
        providerProfileId: modelId['settings']['characterImageProviderProfileId'],
      });
      return (
        void runTaskBatchQueue({
          targets: targetCount,
          concurrency: concurrency,
          shouldStop: shouldStop['isRequested'],
          onTargetStart: ({ target: target4 }) => {
            map4['add'](target4);
          },
          runTarget: (characterId) => {
            const promptPresetId = getProject(),
              prompt = promptPresetId['characters']['find']((value5) => value5['id'] === characterId);
            return runRequest(onGenerateCharacterImageRequested, {
              characterId: characterId,
              appearanceId: getCharacterAppearance(prompt)?.['id'],
              prompt: prompt?.['description'],
              promptPresetId: promptPresetId['workspace']['assetPromptPresetId'],
              modelId: promptPresetId['settings']['characterImageModelId'],
              provider: promptPresetId['settings']['characterImageProvider'],
              providerProfileId: promptPresetId['settings']['characterImageProviderProfileId'],
              generationParams: promptPresetId['settings']['characterImageGenerationParams'],
              notifyCompletion: false,
            });
          },
          onTargetSettled: ({ target: target5 }) => {
            (map4['delete'](target5),
              map3['delete'](target5),
              (value4 += 1),
              (label = shouldStop['isRequested']()
                ? '已取消后续生成 · 正在完成 ' + map4['size'] + ' 项'
                : '批量生成 ' + value4 + '/' + targetCount['length']),
              requestRender());
          },
        })
          ['then']((cancelledCount2) => {
            const totalCount2 = cancelledCount2['filter']((response2) => response2['status'] !== 'cancelled'),
              successCount2 = totalCount2['filter'](
                (el2) => el2['status'] === 'fulfilled' && el2['value']?.['ok'] === true,
              )['length'];
            runRequest(
              onGenerationBatchCompleted,
              {
                kind: 'asset',
                characterIds: targetCount,
                totalCount: totalCount2['length'],
                successCount: successCount2,
                failureCount: totalCount2['length'] - successCount2,
                ...(cancelledCount2['length'] > totalCount2['length']
                  ? { cancelledCount: cancelledCount2['length'] - totalCount2['length'] }
                  : {}),
              },
              {},
              { applyCallbackResult: false },
            );
          })
          ['finally'](() => {
            if (cancelRequested !== shouldStop) return;
            ((active = false),
              (label = ''),
              (map3 = new Set()),
              (map4 = new Set()),
              (cancelRequested = null),
              requestRender());
          }),
        true
      );
    },
    cancelAssetBatch = () => {
      const enabled5 = cancelRequested;
      if (!active || !enabled5?.['request']?.()) return false;
      return (
        (map3 = new Set(map4)),
        (label = map4['size']
          ? '已取消后续生成 · 正在完成 ' + map4['size'] + ' 项'
          : '已取消后续生成'),
        requestRender(),
        true
      );
    },
    destroy = () => {
      (map2['forEach']((value6) => value6['cancellation']?.['request']?.()),
        cancelRequested?.['request']?.());
    };
  return Object['freeze']({
    cancelAssetBatch: cancelAssetBatch,
    cancelShotBatch: cancelShotBatch,
    destroy: destroy,
    getAssetRenderState: getAssetRenderState,
    getMatchingShotSession: getMatchingShotSession,
    getShotRenderState: getShotRenderState,
    isShotBatchForCurrentProject: isShotBatchForCurrentProject,
    runAssetBatch: runAssetBatch,
    runShotBatch: runShotBatch,
  });
}
