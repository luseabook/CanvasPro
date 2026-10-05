import { t } from '../../../i18n/index.js';
import {
  createToolbarActionPopupAnchorPositionGetter,
  positionToolbarActionSubmenuAbove,
} from '../actionMenu.js';
import { showProviderApiKeyMissingToastForError } from '../../../modules/providerApiKeyMissingToast.js';
const APIMART_MIDJOURNEY_MODEL_ID = 'apimart/midjourney',
  MJ_SECONDARY_ACTION_POLL_OPTIONS = Object['freeze']({ maxPolls: 900, pollIntervalMs: 2000 }),
  MJ_VARIATION_OPTIONS = Object['freeze']([
    Object['freeze']({ mode: 'weak', labelKey: 'variationWeakAction' }),
    Object['freeze']({ mode: 'medium', labelKey: 'variationMediumAction' }),
    Object['freeze']({ mode: 'strong', labelKey: 'variationStrongAction' }),
  ]),
  MJ_REMIX_VARIATION_OPTIONS = Object['freeze']([
    Object['freeze']({ mode: 'weak', labelKey: 'variationWeakAction' }),
    Object['freeze']({ mode: 'strong', labelKey: 'variationStrongAction' }),
  ]);
function midjourneyText(value, item = {}) {
  return t('nodeToolbar.midjourney.' + value, item);
}
function clampMainImageIndex(options = {}) {
  const list = Array['isArray'](options?.['images']) ? options['images'] : [];
  if (list['length'] === 0) return 0;
  const key = Number['parseInt'](options?.['mainImageIndex'], 10);
  if (!Number['isFinite'](key)) return 0;
  return Math['max'](0, Math['min'](list['length'] - 1, key));
}
function normalizeMjIndex(result, count = 0) {
  const count2 = Number['parseInt'](result, 10);
  if (Number['isFinite'](count2) && count2 >= 1 && count2 <= 4) return count2;
  return count >= 1 && count <= 4 ? count : 0;
}
function normalizeMjModelVersion(data) {
  return String(data || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/^v/, '');
}
function normalizeMjSpeed(target, source = 'relax') {
  const next = String(target || '')
    ['trim']()
    ['toLowerCase']();
  if (next === 'relax' || next === 'fast' || next === 'turbo') return next;
  return source;
}
function normalizeBooleanFlag(current) {
  if (current === !![] || current === ![]) return current;
  const enabled = String(current ?? '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled) return ![];
  return enabled === 'true' || enabled === '1' || enabled === 'yes';
}
export function isApimartMidjourneyHdSupported(entry = '') {
  const mjModelVersion = normalizeMjModelVersion(entry);
  return mjModelVersion !== '8.2' && mjModelVersion !== '8.1';
}
function isApimartMidjourneyRemixModel(record = '') {
  const mjModelVersion2 = normalizeMjModelVersion(record);
  return mjModelVersion2 === '8.2' || mjModelVersion2 === '8.1';
}
export function getApimartMidjourneyVariationOptions(payload = '') {
  return isApimartMidjourneyRemixModel(payload) ? MJ_REMIX_VARIATION_OPTIONS : MJ_VARIATION_OPTIONS;
}
function normalizeButtons(list2) {
  if (!Array['isArray'](list2)) return [];
  return list2['map']((error) => {
    if (!error || typeof error !== 'object') return null;
    const customId2 = String(error['customId'] || error['custom_id'] || '')['trim'](),
      label = String(error['label'] || error['name'] || error['text'] || '')['trim']();
    if (!customId2 && !label) return null;
    return { ...(customId2 ? { customId: customId2 } : {}), ...(label ? { label: label } : {}) };
  })['filter'](Boolean);
}
function getCurrentImage(options2 = {}) {
  const list3 = Array['isArray'](options2?.['images']) ? options2['images'] : [];
  if (list3['length'] === 0) return options2 || {};
  return list3[clampMainImageIndex(options2)] || {};
}
function getCurrentImageUrl(options3 = {}, handler = null) {
  const currentImage = getCurrentImage(options3),
    handle = String(currentImage?.['localPath'] || options3?.['localPath'] || '')['trim'](),
    state = typeof handler === 'function' ? handler(handle) : '';
  return String(
    state ||
      currentImage?.['thumbUrl'] ||
      currentImage?.['imageUrl'] ||
      currentImage?.['sourceUrl'] ||
      currentImage?.['src'] ||
      options3?.['thumbUrl'] ||
      options3?.['imageUrl'] ||
      options3?.['sourceUrl'] ||
      options3?.['src'] ||
      '',
  )['trim']();
}
function isApimartMidjourneyNode(options4 = {}, config = {}) {
  const enabled2 = String(
      config?.['metadata']?.['provider'] ||
        config?.['provider'] ||
        options4?.['provider'] ||
        options4?.['taskProvider'] ||
        '',
    )
      ['trim']()
      ['toLowerCase'](),
    list4 = [
      config?.['metadata']?.['model'],
      config?.['model'],
      options4?.['model'],
      options4?.['modelId'],
      options4?.['taskModelId'],
      options4?.['executionId'],
      options4?.['taskExecutionId'],
    ],
    scope = list4['some']((input) => {
      const list5 = String(input || '')
        ['trim']()
        ['toLowerCase']();
      return list5 === APIMART_MIDJOURNEY_MODEL_ID || list5['includes']('midjourney');
    });
  return scope && (!enabled2 || enabled2 === 'apimart');
}
export function resolveApimartMidjourneyToolbarContext(options5 = {}) {
  const image = getCurrentImage(options5),
    output =
      image?.['metadata']?.['apimartMidjourney'] ||
      image?.['apimartMidjourney'] ||
      options5?.['metadata']?.['apimartMidjourney'] ||
      null;
  if (!isApimartMidjourneyNode(options5, image)) return { enabled: ![] };
  const value2 = output && typeof output === 'object' ? output : {},
    list6 = Array['isArray'](options5?.['images']) ? options5['images'] : [],
    clampMainImageIndex2 = clampMainImageIndex(options5),
    index2 = normalizeMjIndex(value2['index'], clampMainImageIndex2 + 1),
    taskId = String(value2['taskId'] || options5?.['asyncTaskId'] || options5?.['taskId'] || '')['trim'](),
    buttons = normalizeButtons(value2['buttons']),
    list7 = String(value2['action'] || '')
      ['trim']()
      ['toUpperCase']();
  if (list7['includes']('UPSCALE')) return { enabled: ![] };
  const enabled3 =
    buttons['length'] > 0 ||
    String(value2['gridImageUrl'] || '')['trim']() ||
    list7['includes']('IMAGINE') ||
    list6['length'] >= 4;
  if (!taskId || !index2 || !enabled3) return { enabled: ![] };
  const mjModel = String(
      value2['mjModel'] ||
        image?.['metadata']?.['mjModel'] ||
        options5?.['generationParams']?.['mjModel'] ||
        options5?.['mjModel'] ||
        '',
    )['trim'](),
    speed = normalizeMjSpeed(
      value2['speed'] ||
        image?.['metadata']?.['speed'] ||
        options5?.['generationParams']?.['speed'] ||
        options5?.['speed'] ||
        '',
    ),
    prompt = String(
      value2['prompt'] ||
        image?.['metadata']?.['prompt'] ||
        options5?.['prompt'] ||
        options5?.['generationParams']?.['prompt'] ||
        '',
    )['trim'](),
    hd = normalizeBooleanFlag(
      value2['hd'] ??
        image?.['metadata']?.['hd'] ??
        options5?.['generationParams']?.['hd'] ??
        options5?.['hd'],
    ),
    supportsHd = isApimartMidjourneyHdSupported(mjModel) && hd !== !![];
  return {
    enabled: !![],
    taskId: taskId,
    index: index2,
    buttons: buttons,
    image: image,
    supportsHd: supportsHd,
    mjModel: mjModel,
    speed: speed,
    prompt: prompt,
    hd: hd,
  };
}
function resolveHdCommand(value3 = '') {
  const list8 = String(value3 || '')
    ['trim']()
    ['toLowerCase']();
  if (list8['includes']('5.')) return 'upsample_v5_2x';
  if (list8['includes']('6')) return 'upsample_v6_2x_subtle';
  return 'upsample_v7_2x_subtle';
}
export function buildApimartMidjourneyHdCustomId(list9 = [], value4 = 0, value5 = '') {
  const mjIndex = normalizeMjIndex(value4);
  if (!mjIndex) return '';
  if (!isApimartMidjourneyHdSupported(value5)) return '';
  const hdCommand = resolveHdCommand(value5);
  for (const value6 of normalizeButtons(list9)) {
    const enabled4 = String(value6?.['customId'] || '')['trim']();
    if (!enabled4) continue;
    const list10 = enabled4['split']('::');
    if (list10['length'] < 5) continue;
    if (String(list10[0])['toUpperCase']() !== 'MJ') continue;
    if (String(list10[1])['toUpperCase']() !== 'JOB') continue;
    if (!String(list10[2] || '')['startsWith']('upsample')) continue;
    if (Number['parseInt'](list10[3], 10) !== mjIndex) continue;
    return ((list10[2] = hdCommand), list10['join']('::'));
  }
  return '';
}
function midjourneyOutputText({ actionLabel: actionLabel = '', index: index = 0 } = {}) {
  return midjourneyText('outputText', {
    model: midjourneyText('modelLabel'),
    action: actionLabel,
    index: index,
  });
}
function getPlainObject(value7) {
  return value7 && typeof value7 === 'object' && !Array['isArray'](value7) ? value7 : {};
}
export function buildApimartMidjourneyTargetNodePayload({
  id: id = '',
  x: x = 0,
  y: y = 0,
  width: width = 288,
  height: height = 288,
  name: name = '',
  outputText: outputText = '',
  fileName: fileName = '',
  generationParams: generationParams = {},
  startedAt: startedAt = 0,
  startPatch: startPatch = {},
  protocolPatch: protocolPatch = {},
} = {}) {
  return {
    id: id,
    type: 'ai-image',
    x: Number(x) || 0,
    y: Number(y) || 0,
    width: Math['max'](1, Math['round'](Number(width) || 288)),
    height: Math['max'](1, Math['round'](Number(height) || 288)),
    needsAutoResize: ![],
    name: name,
    prompt: '',
    src: '',
    imageUrl: '',
    sourceUrl: '',
    thumbUrl: '',
    localPath: '',
    fileName: fileName,
    outputText: outputText,
    provider: 'apimart',
    model: APIMART_MIDJOURNEY_MODEL_ID,
    adapterType: 'modelApi',
    generationParams: { ...getPlainObject(generationParams) },
    ...getPlainObject(startPatch),
    ...getPlainObject(protocolPatch),
    generationStartTime: startedAt,
  };
}
function normalizeVariationMode(value8) {
  const value9 = String(value8 || '')
    ['trim']()
    ['toLowerCase']();
  if (value9 === 'weak' || value9 === 'strong') return value9;
  return 'medium';
}
export function buildApimartMidjourneyActionPayload({
  kind: kind = '',
  actionContext: actionContext = {},
  customId: customId = '',
  variationMode: variationMode = '',
  outputText: outputText = '',
} = {}) {
  const value10 = String(kind || '') === 'variation';
  return {
    parentTaskId: String(actionContext?.['taskId'] || '')['trim'](),
    index: actionContext?.['index'],
    customId: String(customId || ''),
    speed: normalizeMjSpeed(actionContext?.['speed']),
    prompt: String(actionContext?.['prompt'] || '')['trim'](),
    actionKind: kind,
    mjModel: String(actionContext?.['mjModel'] || '')['trim'](),
    ...(value10 ? { variationMode: normalizeVariationMode(variationMode) } : {}),
    outputText: outputText,
  };
}
function getVariationActionLabel(value11) {
  switch (normalizeVariationMode(value11)) {
    case 'weak':
      return midjourneyText('variationWeakAction');
    case 'strong':
      return midjourneyText('variationStrongAction');
    default:
      return midjourneyText('variationMediumAction');
  }
}
function normalizeResumedImages(value12) {
  if (value12?.['isBatch'] && Array['isArray'](value12['images'])) return value12['images'];
  return value12 ? [value12] : [];
}
function getResultUrlFromImage(response = {}) {
  return String(
    response?.['sourceUrl'] ||
      response?.['imageUrl'] ||
      response?.['thumbUrl'] ||
      response?.['src'] ||
      response?.['url'] ||
      '',
  )['trim']();
}
function setButtonVisible(el, enabled5) {
  if (!el) return;
  ((el['hidden'] = !enabled5),
    el['classList']['toggle']('is-hidden', !enabled5),
    el['setAttribute']('aria-hidden', enabled5 ? 'false' : 'true'));
}
function setBusy(el2, value13) {
  if (!el2) return;
  el2['classList']['toggle']('is-task-running', value13);
  const el3 = el2['querySelector']('svg');
  if (!el3) return;
  if (value13) el3['classList']['add']('v2-spinning');
  else el3['classList']['remove']('v2-spinning');
}
function openVariationSubmenu(el4, value14, list11 = MJ_VARIATION_OPTIONS) {
  const el5 = document['querySelector']('.v2-mj-variation-submenu');
  if (el5) {
    const value15 = el5['__v2MjVariationAnchorBtn'] && el5['__v2MjVariationAnchorBtn'] === el4,
      handler2 =
        typeof el5['__v2MjVariationClose'] === 'function'
          ? el5['__v2MjVariationClose']
          : () => el5['remove']();
    handler2();
    if (value15) return () => {};
  }
  const el6 = document['createElement']('div');
  ((el6['className'] = 'v2-mj-variation-submenu node-toolbar-action-submenu'),
    (el6['__v2MjVariationAnchorBtn'] = el4),
    el6['setAttribute']('role', 'menu'));
  const el7 = document['createElement']('div');
  ((el7['className'] = 'node-toolbar-action-menu-title'),
    (el7['textContent'] = midjourneyText('chooseVariation')),
    el6['appendChild'](el7));
  const value16 = Array['isArray'](list11) && list11['length'] > 0 ? list11 : MJ_VARIATION_OPTIONS;
  for (const value17 of value16) {
    const el8 = document['createElement']('div');
    ((el8['className'] = 'node-toolbar-action-menu-item node-toolbar-action-submenu-item'),
      el8['setAttribute']('role', 'menuitem'),
      (el8['tabIndex'] = 0),
      (el8['textContent'] = midjourneyText(value17['labelKey'])));
    const run = (event) => {
      (event['stopPropagation'](), event['preventDefault'](), handler3(), value14?.(value17['mode']));
    };
    (el8['addEventListener']('click', run),
      el8['addEventListener']('keydown', (event2) => {
        if (event2['key'] !== 'Enter' && event2['key'] !== ' ') return;
        run(event2);
      }),
      el6['appendChild'](el8));
  }
  const run2 = createToolbarActionPopupAnchorPositionGetter(el4, { gap: 10 }),
    handler4 = () => {
      const value18 = run2();
      positionToolbarActionSubmenuAbove(value18, el6);
    };
  (handler4(), Object['assign'](el6['style'], { opacity: '0', pointerEvents: 'none' }));
  const value19 = (event3) => {
      const value20 = event3['target'];
      if (el6['contains'](value20) || el4['contains'](value20)) return;
      handler3();
    },
    value21 = (event4) => {
      if (event4['key'] === 'Escape') handler3();
    },
    value22 = () => handler4(),
    handler3 = () => {
      (document['removeEventListener']('pointerdown', value19, !![]),
        document['removeEventListener']('keydown', value21, !![]),
        window['removeEventListener']('resize', value22, !![]),
        window['removeEventListener']('scroll', value22, !![]),
        el4['classList']['remove']('is-active'));
      if (document['body']['contains'](el6)) el6['remove']();
    };
  ((el6['__v2MjVariationClose'] = handler3),
    document['body']['appendChild'](el6),
    el4['classList']['add']('is-active'));
  const run3 =
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame
      : (value23) => setTimeout(value23, 0);
  return (
    run3(() => {
      (handler4(), (el6['style']['opacity'] = '1'), (el6['style']['pointerEvents'] = 'auto'));
    }),
    document['addEventListener']('pointerdown', value19, !![]),
    document['addEventListener']('keydown', value21, !![]),
    window['addEventListener']('resize', value22, !![]),
    window['addEventListener']('scroll', value22, !![]),
    handler3
  );
}
export function bindApimartMidjourneyActions(value24) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getNodeData: getNodeData,
      store: store,
      submitTask: submitTask,
      buildImageGenerationFailurePatch: buildImageGenerationFailurePatch,
      buildImageGenerationResultPatch: buildImageGenerationResultPatch,
      calcDisplaySizeByMedia: calcDisplaySizeByMedia,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      localPathToUrl: localPathToUrl,
      resolveApiInputRatioBasis: resolveApiInputRatioBasis,
      resolveFinalResultDisplaySize: resolveFinalResultDisplaySize,
      saveOutputImageResult: saveOutputImageResult,
      buildToolbarImageFields: buildToolbarImageFields,
      submitApimartMidjourneyUpscaleRequest: submitApimartMidjourneyUpscaleRequest,
      submitApimartMidjourneyVariationRequest: submitApimartMidjourneyVariationRequest,
      resumeApimartMidjourneyUpscaleTask: resumeApimartMidjourneyUpscaleTask,
      createLocalSaveFailureError: createLocalSaveFailureError,
      isLocalSaveFailure: isLocalSaveFailure,
      buildClearedImageMediaFields: buildClearedImageMediaFields,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
      selectToolbarTaskNode: selectToolbarTaskNode,
      notifyImageToolbarTaskChange: notifyImageToolbarTaskChange,
    } = value24,
    el9 = toolbarEl['querySelector']('.act-mj-variation'),
    el10 = toolbarEl['querySelector']('.act-mj-hd');
  if (!el9 && !el10) return;
  let run4 = () => {};
  const run5 = () => {
    const apimartMidjourneyToolbarContext = resolveApimartMidjourneyToolbarContext(getNodeData());
    (setButtonVisible(el9, apimartMidjourneyToolbarContext['enabled']),
      setButtonVisible(
        el10,
        apimartMidjourneyToolbarContext['enabled'] && apimartMidjourneyToolbarContext['supportsHd'] !== ![],
      ),
      !apimartMidjourneyToolbarContext['enabled'] && (run4(), (run4 = () => {})));
  };
  run5();
  let value25 = '';
  const run6 = (kind2, value26, value27 = {}) => {
    if (value25) {
      window['showToast']?.(midjourneyText('busy'), 'info');
      return;
    }
    void (async () => {
      let box = null,
        width2 = null,
        sourceUrl = '',
        imageUrl = '',
        localPath = '',
        fileName2 = null;
      const name2 = kind2 === 'hd',
        executionId = kind2 === 'variation',
        variationMode2 = normalizeVariationMode(value27?.['variationMode']),
        actionLabel2 = name2 ? midjourneyText('hdAction') : getVariationActionLabel(variationMode2);
      try {
        ((value25 = kind2), setBusy(value26, !![]));
        const value28 = getNodeData() || {},
          index3 = resolveApimartMidjourneyToolbarContext(value28);
        if (!index3['enabled']) {
          window['showToast']?.(midjourneyText('missingContext'), 'error');
          return;
        }
        if (name2 && index3['supportsHd'] === ![]) {
          window['showToast']?.(midjourneyText('hdUnsupported'), 'info');
          return;
        }
        const customId3 = name2
          ? buildApimartMidjourneyHdCustomId(index3['buttons'], index3['index'], index3['mjModel'])
          : '';
        if (name2 && !customId3) {
          window['showToast']?.(midjourneyText('hdCustomIdMissing'), 'error');
          return;
        }
        const sourceNodeId = store['getState']()['nodes'][nodeId] || value28;
        if (!sourceNodeId) {
          window['showToast']?.(midjourneyText('sourceNodeMissing'), 'error');
          return;
        }
        const currentImageUrl = getCurrentImageUrl(value28, localPathToUrl);
        box = await resolveApiInputRatioBasis(sourceNodeId, currentImageUrl);
        const { width: width3, height: height2 } = calcDisplaySizeByMedia(box['width'], box['height']),
          { x: x2, y: y2 } = calcSafeSpawnPosNearNode(
            store['getState']()['nodes'],
            sourceNodeId,
            width3,
            height2,
          ),
          id2 =
            'ai-image-apimart-mj-' +
            kind2 +
            '-' +
            Date['now']() +
            '-' +
            Math['random']()['toString'](36)['slice'](2, 6),
          outputText2 = midjourneyOutputText({ actionLabel: actionLabel2, index: index3['index'] }),
          generationParams2 = {
            ...getPlainObject(value28?.['generationParams']),
            ...(index3['mjModel'] ? { mjModel: index3['mjModel'] } : {}),
            ...(index3['speed'] ? { speed: index3['speed'] } : {}),
          },
          payload2 = buildApimartMidjourneyActionPayload({
            kind: kind2,
            actionContext: index3,
            customId: customId3,
            variationMode: variationMode2,
            outputText: outputText2,
          }),
          response2 = await submitTask({
            sourceNodeId: sourceNodeId['id'],
            trigger: 'toolbar',
            taskType: 'apimart-midjourney-' + kind2,
            provider: 'apimart',
            adapterType: 'modelApi',
            async: !![],
            modelId: APIMART_MIDJOURNEY_MODEL_ID,
            executionId: executionId
              ? 'apimart.model-api.midjourney.variation'
              : 'apimart.model-api.midjourney.upscale',
            payload: payload2,
            cancellable: !![],
            resumable: !![],
            onTaskChange: notifyImageToolbarTaskChange,
            createTargetNode: ({
              startedAt: startedAt2,
              startPatch: startPatch2,
              protocolPatch: protocolPatch2,
            }) =>
              buildApimartMidjourneyTargetNodePayload({
                id: id2,
                x: x2,
                y: y2,
                width: width3,
                height: height2,
                needsAutoResize: ![],
                name: name2 ? midjourneyText('hdProcessingName') : midjourneyText('variationProcessingName'),
                outputText: outputText2,
                fileName: 'apimart_midjourney_' + kind2 + '_' + Date['now']() + '.png',
                generationParams: generationParams2,
                startedAt: startedAt2,
                startPatch: startPatch2,
                protocolPatch: protocolPatch2,
              }),
            submit: async (taskId2, signal) => {
              selectToolbarTaskNode(signal['targetNodeId']);
              const run7 = executionId
                  ? submitApimartMidjourneyVariationRequest
                  : submitApimartMidjourneyUpscaleRequest,
                taskId3 = await run7({
                  taskId: taskId2['parentTaskId'],
                  index: taskId2['index'],
                  customId: taskId2['customId'],
                  speed: taskId2['speed'],
                  prompt: taskId2['prompt'],
                  mjModel: taskId2['mjModel'],
                  variationMode: taskId2['variationMode'],
                  signal: signal['signal'],
                });
              if (taskId3?.['taskId']) signal['onTaskId'](taskId3['taskId']);
              return { taskId: taskId3?.['taskId'] || '' };
            },
            poll: async ({ taskId: taskId4, signal: signal2 }) => {
              const value29 = await resumeApimartMidjourneyUpscaleTask(
                taskId4,
                { provider: 'apimart', model: APIMART_MIDJOURNEY_MODEL_ID },
                {
                  ...MJ_SECONDARY_ACTION_POLL_OPTIONS,
                  apimartMidjourneySource: {
                    action: executionId ? 'VARIATION' : 'UPSCALE',
                    ...(payload2['mjModel'] ? { mjModel: payload2['mjModel'] } : {}),
                    ...(payload2['speed'] ? { speed: payload2['speed'] } : {}),
                    ...(payload2['prompt'] ? { prompt: payload2['prompt'] } : {}),
                    ...(name2 ? { hd: !![] } : {}),
                  },
                  signal: signal2,
                },
              );
              if (value29?.['pending']) return value29;
              const resultImages = normalizeResumedImages(value29)['filter'](
                  (enabled6) => enabled6 && !enabled6['error'] && getResultUrlFromImage(enabled6),
                ),
                resumedImage = resultImages[0] || null;
              if (!resumedImage || resumedImage['error'])
                throw new Error(String(resumedImage?.['error'] || midjourneyText('missingResultImage')));
              const resultUrl = getResultUrlFromImage(resumedImage);
              if (!resultUrl) throw new Error(midjourneyText('missingResultImage'));
              return { resultUrl: resultUrl, resumedImage: resumedImage, resultImages: resultImages };
            },
            resultBuilder: async (value30, startedAt3) => {
              const sourceUrl2 = String(value30?.['resultUrl'] || '')['trim']();
              if (!sourceUrl2) throw new Error(midjourneyText('missingResultImage'));
              ((sourceUrl = sourceUrl2), (fileName2 = value30?.['resumedImage'] || null));
              const images = Array['isArray'](value30?.['resultImages']) ? value30['resultImages'] : [];
              if (executionId && images['length'] > 1) {
                ((imageUrl = fileName2?.['thumbUrl'] || fileName2?.['imageUrl'] || sourceUrl2),
                  (localPath = fileName2?.['localPath'] || ''),
                  (width2 = await resolveFinalResultDisplaySize(box, {
                    localPath: localPath,
                    imageUrl: imageUrl,
                    sourceUrl: sourceUrl2,
                    thumbUrl: imageUrl,
                    src: imageUrl,
                  })));
                if (!localPath) throw createLocalSaveFailureError();
                return {
                  name: midjourneyText('variationResultName'),
                  ...buildImageGenerationResultPatch(
                    { isBatch: !![], images: images },
                    { startedAt: startedAt3['startedAt'] },
                  ),
                  fileName:
                    fileName2?.['fileName'] || 'apimart_midjourney_' + kind2 + '_' + Date['now']() + '.png',
                  width: width2['width'],
                  height: width2['height'],
                  outputText: outputText2,
                };
              }
              let value31;
              try {
                value31 = await saveOutputImageResult(sourceUrl2, {
                  resumedImage: fileName2,
                  ext: 'png',
                  includeSrc: !![],
                  taskKey: startedAt3['taskId'] ? 'apimart:image:' + startedAt3['taskId'] : '',
                });
              } catch (value32) {
                (console['warn']('[ApimartMJ] saveOutputFromUrlToServer failed:', value32),
                  (value31 = {
                    localPath: '',
                    thumbUrl: sourceUrl2,
                    fields: buildToolbarImageFields({
                      localPath: '',
                      resultUrl: sourceUrl2,
                      thumbUrl: sourceUrl2,
                      includeSrc: !![],
                    }),
                  }));
              }
              ((imageUrl = value31['thumbUrl'] || sourceUrl2), (localPath = value31['localPath'] || ''));
              const args = value31['fields'];
              width2 = await resolveFinalResultDisplaySize(box, {
                localPath: localPath,
                imageUrl: imageUrl || sourceUrl2,
                sourceUrl: sourceUrl2,
                thumbUrl: imageUrl,
                src: imageUrl || sourceUrl2,
              });
              if (!localPath) throw createLocalSaveFailureError();
              return {
                name: name2 ? midjourneyText('hdResultName') : midjourneyText('variationResultName'),
                ...buildImageGenerationResultPatch(args, { startedAt: startedAt3['startedAt'] }),
                ...args,
                sourceUrl: sourceUrl2 || args['sourceUrl'] || '',
                fileName:
                  fileName2?.['fileName'] ||
                  args['fileName'] ||
                  'apimart_midjourney_' + kind2 + '_' + Date['now']() + '.png',
                width: width2['width'],
                height: width2['height'],
                outputText: outputText2,
              };
            },
            failureBuilder: async (error2, startedAt4) => {
              const error3 =
                error2 instanceof Error
                  ? error2['message']
                  : String(error2 || midjourneyText('unknownError'));
              if (isLocalSaveFailure(error2))
                return (
                  (width2 ||= await resolveFinalResultDisplaySize(box, {
                    localPath: localPath,
                    imageUrl: imageUrl || sourceUrl,
                    sourceUrl: sourceUrl,
                    thumbUrl: imageUrl,
                    src: imageUrl || sourceUrl,
                  })),
                  {
                    name: name2 ? midjourneyText('hdResultName') : midjourneyText('variationResultName'),
                    ...buildClearedImageMediaFields(),
                    fileName: 'apimart_midjourney_' + kind2 + '_' + Date['now']() + '.png',
                    width: width2['width'],
                    height: width2['height'],
                    outputText: outputText2,
                    ...buildImageGenerationFailurePatch({
                      error: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                      startedAt: startedAt4['startedAt'],
                    }),
                    rhStatusMessage: IMAGE_LOCAL_SAVE_FAILURE_MESSAGE,
                  }
                );
              return {
                name: midjourneyText('failedName'),
                ...buildImageGenerationFailurePatch({ error: error3, startedAt: startedAt4['startedAt'] }),
                outputText: midjourneyText('outputTextWithError', {
                  outputText: outputText2,
                  error: error3,
                }),
              };
            },
            cancelledBuilder: () => ({
              name: midjourneyText('cancelledName'),
              outputText: midjourneyText('outputTextWithStatus', {
                outputText: outputText2,
                status: midjourneyText('status.cancelled'),
              }),
            }),
          });
        if (response2['status'] === 'success')
          window['showToast']?.(midjourneyText('successToast'), 'success');
        else {
          if (response2['status'] === 'failed') {
            if (isLocalSaveFailure(response2['error']))
              window['showToast']?.('⚠️ ' + IMAGE_LOCAL_SAVE_FAILURE_MESSAGE, 'warn');
            else {
              const error4 =
                  response2['error'] instanceof Error
                    ? response2['error']['message']
                    : String(response2['error'] || midjourneyText('unknownError')),
                showProviderApiKeyMissingToastForError2 = showProviderApiKeyMissingToastForError(
                  response2['error'],
                  {
                    providerId: 'apimart',
                    model: APIMART_MIDJOURNEY_MODEL_ID,
                    type: 'error',
                    message: midjourneyText('failedWithError', { error: error4 }),
                  },
                );
              !showProviderApiKeyMissingToastForError2 &&
                window['showToast']?.(midjourneyText('failedWithError', { error: error4 }), 'error');
            }
          } else {
            if (response2['status'] === 'cancelled')
              window['showToast']?.(midjourneyText('cancelledToast'), 'info');
            else
              response2['status'] === 'pending' &&
                window['showToast']?.(midjourneyText('pendingToast'), 'info');
          }
        }
      } catch (error5) {
        const error6 =
            error5 instanceof Error ? error5['message'] : String(error5 || midjourneyText('unknownError')),
          showProviderApiKeyMissingToastForError3 = showProviderApiKeyMissingToastForError(error5, {
            providerId: 'apimart',
            model: APIMART_MIDJOURNEY_MODEL_ID,
            type: 'error',
            message: midjourneyText('failedWithError', { error: error6 }),
          });
        !showProviderApiKeyMissingToastForError3 &&
          window['showToast']?.(midjourneyText('failedWithError', { error: error6 }), 'error');
      } finally {
        ((value25 = ''), setBusy(value26, ![]), run5());
      }
    })();
  };
  (el9?.['addEventListener']('click', (event5) => {
    (event5['stopPropagation'](), event5['preventDefault']());
    if (value25) {
      window['showToast']?.(midjourneyText('busy'), 'info');
      return;
    }
    const apimartMidjourneyToolbarContext2 = resolveApimartMidjourneyToolbarContext(getNodeData());
    run4 = openVariationSubmenu(
      el9,
      (variationMode3) => {
        run6('variation', el9, { variationMode: variationMode3 });
      },
      getApimartMidjourneyVariationOptions(apimartMidjourneyToolbarContext2['mjModel']),
    );
  }),
    el10?.['addEventListener']('click', (event6) => {
      (event6['stopPropagation'](), event6['preventDefault'](), run4(), (run4 = () => {}), run6('hd', el10));
    }));
}
