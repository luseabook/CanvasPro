import { activateMenuKeyboard } from '../../modules/floatingMenuKeyboard.js';
import { t } from '../../i18n/index.js';
import { getDisplayModelName, PROVIDERS_META } from '../../modules/providers.js';
import { getModelManifest, resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import {
  buildUiSchemaParamPatch,
  bindUiSchemaFieldControls,
  bindModelUiSchemaControls,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
} from '../aigenImage/uiSchemaRenderer.js';
import { buildUiSchemaVisibilitySignature } from '../aigenImage/uiSchemaVisibility.js';
import { renderNodeModelTrigger } from '../shared/nodeModelMenu.js';
import {
  bindNodeSubmenus,
  closeNodeFooterMenus,
  createFloatingModelMenuPortal,
  createFloatingUiSchemaPopupPortal,
} from '../shared/nodeFooterControls.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../sharedIconMarkup.js';
import {
  buildVideoModelMenuHTML,
  renderVideoModelTriggerIconHTML,
} from '../video-node/modelSelectorShared.js';
import {
  buildRhWorkflowFieldPatch,
  buildVideoModelApiModelSelectionPatch,
} from '../video-node/parameterPanelModelSelectionPolicy.js';
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  buildVideoWorkflowReferenceSummaryParamsPatch,
  getRunningHubVideoWorkflowFpsOptions,
  hasRunningHubVideoWorkflowUiPlacement,
  isRunningHubVideoWorkflowManifest,
} from '../video-node/runningHubVideoUiSchema.js';
import { resolveVideoAdvancedSchemaTarget } from '../video-node/videoAdvancedSchemaTarget.js';
import {
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamPatch,
  buildDreaminaParamSchemaFields,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from '../video-node/dreaminaParameterSchema.js';
import {
  buildDreaminaTaskModelMenuHtml,
  getDreaminaTaskModelMenuMeta,
  getRhV54FpsOptions,
} from '../video-node/parameterPanelModelHelpers.js';
import {
  ensureDreaminaStyleVideoModelForTask,
  getDreaminaStyleVideoDurationRange,
  getDreaminaStyleVideoResolutionOptions,
  getDreaminaVideoTaskParamVisibility,
  isDreaminaStyleVideoModel,
  normalizeDreaminaStyleVideoDuration,
  normalizeDreaminaStyleVideoResolution,
  normalizeDreaminaVideoAspectRatio,
  normalizeDreaminaVideoRouteMode,
  resolveDreaminaStyleVideoProvider,
  resolveDreaminaVideoTaskType,
} from '../../modules/dreaminaVideoModelHelper.js';
import { bindModelCredentialMenu, syncModelCredentialMenu } from '../../modules/modelCredentialUi.js';
import { buildModelProviderProfileSelectionPatch } from '../../modules/modelProviderProfileSelection.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function getPlainObject(args) {
  return args && typeof args === 'object' && !Array['isArray'](args) ? { ...args } : {};
}
function normalizeAllowedModelIds(list = []) {
  return [
    ...new Set(
      (Array['isArray'](list) ? list : [])['map']((item) => String(item || '')['trim']())['filter'](Boolean),
    ),
  ];
}
function resolveAllowedModelId(key, list2 = []) {
  const index = String(key || '')['trim']();
  return list2['length'] && !list2['includes'](index) ? list2[0] : index;
}
function resolveRunningHubWorkflowAllowedModelId(result, list3 = []) {
  const data = String(result || '')['trim'](),
    modelManifest = getModelManifest(data);
  return list3['length'] &&
    modelManifest?.['provider'] === 'runninghubwf' &&
    modelManifest?.['adapterType'] === 'workflow' &&
    !list3['includes'](data)
    ? list3[0]
    : data;
}
const DEFAULT_VIDEO_FOOTER_PLACEMENT_ORDER = Object['freeze'](['resolution', 'mode']);
function normalizeReferenceCounts(options = {}) {
  return {
    imageCount: Math['max'](0, Number(options?.['imageCount']) || 0),
    videoCount: Math['max'](0, Number(options?.['videoCount']) || 0),
    audioCount: Math['max'](0, Number(options?.['audioCount']) || 0),
  };
}
function wrapSchemaPlacement(target, source) {
  return source ? '<div class="ui-schema-placement ' + target + '">' + source + '</div>' : '';
}
function renderVideoAdvancedControlsMarkup(enabled) {
  if (!enabled) return '';
  const escapeHtml2 = escapeHtml(t('videoNode.parameterPanel.advancedSettings'));
  return (
    '<div class="rh-adv-wrap"><button type="button" class="img-pill-btn rh-adv2-btn advanced-settings-icon-button" data-tooltip="' +
    escapeHtml2 +
    '" aria-label="' +
    escapeHtml2 +
    '" aria-expanded="false">' +
    ADVANCED_SETTINGS_TUNE_ICON_MARKUP +
    '</button></div>\n    <div class="rh-vram-adv-panel">' +
    enabled +
    '</div>'
  );
}
function getDreaminaProviderLabel(next) {
  const current = String(next || '')
    ['trim']()
    ['toLowerCase']();
  if (current === 'dreamina') return t('videoNode.parameterPanel.providers.dreamina');
  if (current === 'volcengine') return t('videoNode.parameterPanel.providers.volcengine');
  return t('videoNode.parameterPanel.providers.default');
}
function resolveDreaminaSelectorLayout(entry, record) {
  const args2 = getDreaminaEffectiveNodeData(entry),
    provider2 = resolveDreaminaStyleVideoProvider(args2['model'], args2['provider']),
    routeMode = normalizeDreaminaVideoRouteMode(args2['dreaminaRouteMode'], args2['mode']),
    taskType = resolveDreaminaVideoTaskType({
      routeMode: routeMode,
      ...normalizeReferenceCounts(record),
    }),
    model = ensureDreaminaStyleVideoModelForTask(taskType, args2['model'], provider2),
    resolution = normalizeDreaminaStyleVideoResolution(
      taskType,
      model,
      args2['resolution'] || args2['videoSize'],
      provider2,
    ),
    aspectRatio = normalizeDreaminaVideoAspectRatio(args2['aspectRatio'], { preserveAdaptive: !![] }),
    duration = normalizeDreaminaStyleVideoDuration(taskType, model, args2['duration'], provider2),
    generationParams2 = {
      ...getPlainObject(args2['generationParams']),
      dreaminaRouteMode: routeMode,
      aspectRatio: aspectRatio,
      duration: duration,
      ...(resolution ? { resolution: resolution } : {}),
    },
    nodeData = {
      ...args2,
      model: model,
      provider: provider2,
      dreaminaRouteMode: routeMode,
      aspectRatio: aspectRatio,
      duration: duration,
      ...(resolution ? { resolution: resolution, videoSize: resolution } : {}),
      generationParams: generationParams2,
    },
    dreaminaVideoTaskParamVisibility = getDreaminaVideoTaskParamVisibility(taskType),
    dreaminaParamSchemaFields = buildDreaminaParamSchemaFields({
      routeMode: routeMode,
      currentRatio: aspectRatio,
      currentResolution: resolution,
      currentDuration: duration,
      durationRange: getDreaminaStyleVideoDurationRange(taskType, model, provider2),
      resolutionOptions: getDreaminaStyleVideoResolutionOptions(taskType, model, provider2),
    }),
    handler = (list4, args3 = {}) =>
      renderUiSchemaFields(list4['filter'](Boolean), nodeData, {
        sourceId: 'dreamina-video-normal-params',
        ...args3,
      }),
    dreaminaTaskModelMenuMeta = getDreaminaTaskModelMenuMeta(model, provider2),
    payload =
      '<div class="dreamina-task-model-wrap">\n    <button type="button" class="img-pill-btn dreamina-task-model-btn">\n      <span class="dreamina-task-model-label">' +
      escapeHtml(dreaminaTaskModelMenuMeta?.['title'] || getDisplayModelName(model)) +
      '</span>\n    </button>\n    <div class="floating-menu dreamina-task-model-menu">' +
      buildDreaminaTaskModelMenuHtml(model, taskType, provider2) +
      '</div>\n  </div>',
    controlsHtml = [
      payload,
      dreaminaVideoTaskParamVisibility['mode']
        ? wrapSchemaPlacement(
            'ui-schema-mode-slot dreamina-video-mode-schema',
            handler([dreaminaParamSchemaFields['mode']]),
          )
        : '',
      dreaminaVideoTaskParamVisibility['ratio']
        ? wrapSchemaPlacement(
            'ui-schema-resolution-slot dreamina-video-ratio-schema',
            handler([dreaminaParamSchemaFields['resolution'], dreaminaParamSchemaFields['aspectRatio']], {
              placement: 'resolution',
            }),
          )
        : '',
      dreaminaVideoTaskParamVisibility['duration']
        ? wrapSchemaPlacement(
            'ui-schema-duration-slot dreamina-video-duration-schema',
            handler([dreaminaParamSchemaFields['duration']]),
          )
        : '',
    ]['join']('');
  return {
    kind: 'dreamina',
    model: model,
    provider: provider2,
    modelLabel: getDreaminaProviderLabel(provider2),
    nodeData: nodeData,
    taskType: taskType,
    controlsHtml: controlsHtml,
    advanced: '',
  };
}
export function resolveVideoSelectorSchemaLayout(
  handle,
  args4 = {},
  { referenceCounts: referenceCounts = {} } = {},
) {
  const model2 = String(handle || args4?.['model'] || '')['trim'](),
    provider3 = resolveModelProvider(model2, args4?.['provider'] || ''),
    args5 = { ...args4, model: model2, provider: provider3 };
  if (isDreaminaStyleVideoModel(model2, provider3))
    return resolveDreaminaSelectorLayout(args5, referenceCounts);
  const modelExecution =
      resolveModelExecution(model2, { providerHint: provider3 }) || resolveModelExecution(model2),
    state = modelExecution?.['modelManifest'] || getModelManifest(model2),
    model3 = String(modelExecution?.['canonicalModelId'] || state?.['modelId'] || model2)['trim'](),
    kind = isRunningHubVideoWorkflowManifest(model3);
  let fallbackNodeData = { ...args5, model: model3 };
  if (kind) {
    const videoWorkflowReferenceSummaryParamsPatch = buildVideoWorkflowReferenceSummaryParamsPatch(
        fallbackNodeData,
        model3,
        referenceCounts,
      ),
      args6 = buildVideoWorkflowGenerationParamsPatch(
        fallbackNodeData,
        model3,
        videoWorkflowReferenceSummaryParamsPatch,
      );
    fallbackNodeData = {
      ...fallbackNodeData,
      ...args6,
      ...buildVideoWorkflowDisplayParamsPatch(model3, args6['generationParams'], {
        v54FpsOptions: getRhV54FpsOptions(),
      }),
    };
  }
  const run = (placement2, args7 = {}) =>
      renderModelUiSchemaControls(model3, fallbackNodeData, { placement: placement2, ...args7 }),
    controlsHtml2 = [];
  if (kind) {
    const run2 = (config) =>
      hasRunningHubVideoWorkflowUiPlacement(model3, config, { includeToolbarOnly: !![] });
    (run2('mode') && controlsHtml2['push'](wrapSchemaPlacement('ui-schema-mode-slot', run('mode'))),
      run2('videoParams') &&
        controlsHtml2['push'](
          wrapSchemaPlacement(
            'ui-schema-video-params-slot',
            run('videoParams', {
              unwrap: !![],
              rhVideoFpsOptions: getRunningHubVideoWorkflowFpsOptions(model3, {
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            }),
          ),
        ),
      run2('resolution') &&
        controlsHtml2['push'](wrapSchemaPlacement('ui-schema-resolution-slot', run('resolution'))),
      controlsHtml2['push'](
        wrapSchemaPlacement('ui-schema-instance-slot', run('instance', { variant: 'instanceToggle' })),
      ));
  } else {
    if (state?.['adapterType'] === 'modelApi' && state?.['kind'] === 'video') {
      const list5 = Array['isArray'](state?.['uiSchema']?.['footerPlacementOrder'])
          ? state['uiSchema']['footerPlacementOrder']
          : [],
        list6 = [
          ...list5['filter']((scope) =>
            DEFAULT_VIDEO_FOOTER_PLACEMENT_ORDER['includes'](String(scope || '')['trim']()),
          ),
          ...DEFAULT_VIDEO_FOOTER_PLACEMENT_ORDER,
        ]['filter']((input, output, list7) => list7['indexOf'](input) === output);
      list6['forEach']((value2) => {
        controlsHtml2['push'](wrapSchemaPlacement('ui-schema-' + value2 + '-slot', run(value2)));
      });
    }
  }
  const placement3 = resolveVideoAdvancedSchemaTarget(fallbackNodeData, {
      fallbackNodeData: fallbackNodeData,
      buildRunningHubNodeData: (value3) => value3,
    }),
    advanced = placement3
      ? renderModelUiSchemaControls(placement3['modelId'], placement3['nodeData'], {
          placement: placement3['placement'],
        })
      : '';
  return {
    kind: kind ? 'workflow' : 'modelApi',
    model: model3,
    provider: provider3,
    modelLabel: getDisplayModelName(model3),
    nodeData: fallbackNodeData,
    controlsHtml: controlsHtml2['join'](''),
    advanced: advanced,
  };
}
export function renderAIGenVideoModelSelectorMarkup({
  modelId: modelId = '',
  provider: provider = '',
  className: className = '',
  generationParams: generationParams = {},
  generationParamsByModel: generationParamsByModel = {},
  uiSchemaFieldState: uiSchemaFieldState = {},
  providerProfileId: providerProfileId = '',
  providerProfileIdByModel: providerProfileIdByModel = {},
  referenceCounts: referenceCounts = {},
  showSchemaControls: showSchemaControls = !![],
  allowedModelIds: allowedModelIds = [],
  runningHubWorkflowAllowedModelIds: runningHubWorkflowAllowedModelIds = [],
} = {}) {
  const allowedModelIds2 = normalizeAllowedModelIds(allowedModelIds),
    runningHubWorkflowAllowedModelIds2 = normalizeAllowedModelIds(runningHubWorkflowAllowedModelIds),
    model4 = resolveRunningHubWorkflowAllowedModelId(
      resolveAllowedModelId(modelId, allowedModelIds2),
      runningHubWorkflowAllowedModelIds2,
    ),
    value4 = {
      model: model4,
      provider: provider,
      generationParams: getPlainObject(generationParams),
      generationParamsByModel: getPlainObject(generationParamsByModel),
      uiSchemaFieldState: getPlainObject(uiSchemaFieldState),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    model5 = resolveVideoSelectorSchemaLayout(model4, value4, { referenceCounts: referenceCounts });
  return (
    '<div class="img-model-pills aigen-video-model-selector ' +
    escapeHtml(className) +
    '" data-aigen-video-model-selector>\n    <div class="img-model-wrap">\n      ' +
    renderNodeModelTrigger({
      iconHtml: renderVideoModelTriggerIconHTML({
        model: model5['model'],
        provider: model5['provider'],
        providersMeta: PROVIDERS_META,
      }),
      label: model5['modelLabel'],
    }) +
    '\n      ' +
    buildVideoModelMenuHTML({
      activeModel: model5['model'],
      provider: model5['provider'],
      allowedModelIds: allowedModelIds2,
      runningHubWorkflowAllowedModelIds: runningHubWorkflowAllowedModelIds2,
    }) +
    '\n    </div>\n    ' +
    (showSchemaControls
      ? '<div class="aigen-video-schema-controls">' +
        model5['controlsHtml'] +
        '</div>\n    ' +
        renderVideoAdvancedControlsMarkup(model5['advanced'])
      : '') +
    '\n  </div>'
  );
}
function createVideoModelMenuPortal({
  menu: menu,
  trigger: trigger,
  host: host,
  documentObject: documentObject2,
  windowObject: windowObject2,
  submenuPlacement: submenuPlacement = 'viewport-auto',
} = {}) {
  return createFloatingModelMenuPortal({
    menu: menu,
    trigger: trigger,
    host: host,
    documentObject: documentObject2,
    windowObject: windowObject2,
    portalClass: 'aigen-video-model-menu-portal',
    submenuPlacement: submenuPlacement,
  });
}
function createSchemaPopupViewportPositioner({
  selector: selector,
  documentObject: documentObject3,
  windowObject: windowObject3,
  placement: placement = 'inline',
} = {}) {
  if (!selector || placement !== 'viewport-auto-up') return { destroy() {} };
  let el = null,
    el2 = null,
    value5 = 0;
  const value6 = 16,
    value7 = 8,
    value8 = () => {
      value5 = 0;
      if (!el?.['isConnected'] || !el['classList']?.['contains']?.('show')) return;
      const el3 = el2?.['querySelector']?.('[data-ui-schema-menu-trigger]') || el2,
        box = el3?.['getBoundingClientRect']?.(),
        box2 = el['getBoundingClientRect']?.(),
        count =
          Number(windowObject3?.['innerWidth']) ||
          Number(documentObject3?.['documentElement']?.['clientWidth']) ||
          0,
        count2 =
          Number(windowObject3?.['innerHeight']) ||
          Number(documentObject3?.['documentElement']?.['clientHeight']) ||
          0;
      if (!box || !box2 || count <= 0 || count2 <= 0) return;
      const value9 = Math['max'](value6, count - value6 - box2['width']),
        value10 = Math['min'](Math['max'](box['right'] - box2['width'], value6), value9),
        value11 = Math['max'](value6, count2 - value6 - box2['height']),
        value12 = box['top'] - value7 - box2['height'],
        value13 = box['bottom'] + value7,
        value14 =
          value12 >= value6
            ? Math['min'](value12, value11)
            : Math['min'](Math['max'](value13, value6), value11);
      (el['style']?.['setProperty']?.('position', 'fixed'),
        el['style']?.['setProperty']?.('left', Math['round'](value10) + 'px'),
        el['style']?.['setProperty']?.('top', Math['round'](value14) + 'px'),
        el['style']?.['setProperty']?.('right', 'auto'),
        el['style']?.['setProperty']?.('bottom', 'auto'));
    },
    handler2 = () => {
      value5 && windowObject3?.['cancelAnimationFrame']?.(value5);
      const run3 =
        windowObject3?.['requestAnimationFrame']?.['bind']?.(windowObject3) ||
        ((value15) => windowObject3?.['setTimeout']?.(value15, 0));
      value5 = run3(value8);
    },
    value16 = (enabled2) => {
      const enabled3 = enabled2?.['detail']?.['popup'] || null,
        enabled4 = enabled2?.['detail']?.['fieldEl'] || null;
      if (!enabled3 || !enabled4 || !selector['contains']?.(enabled4)) return;
      if (!enabled2['detail']?.['shouldOpen']) {
        enabled3 === el && ((el = null), (el2 = null));
        return;
      }
      ((el = enabled3), (el2 = enabled4), handler2());
    };
  return (
    selector['addEventListener']?.('ui-schema-menu-before-open', value16),
    documentObject3?.['addEventListener']?.('scroll', handler2, !![]),
    windowObject3?.['addEventListener']?.('resize', handler2),
    {
      destroy() {
        (value5 && (windowObject3?.['cancelAnimationFrame']?.(value5), (value5 = 0)),
          selector['removeEventListener']?.('ui-schema-menu-before-open', value16),
          documentObject3?.['removeEventListener']?.('scroll', handler2, !![]),
          windowObject3?.['removeEventListener']?.('resize', handler2),
          (el = null),
          (el2 = null));
      },
    }
  );
}
export function bindAIGenVideoModelSelector(
  el4,
  {
    modelId: modelId = '',
    provider: provider = '',
    generationParams: generationParams = {},
    generationParamsByModel: generationParamsByModel = {},
    uiSchemaFieldState: uiSchemaFieldState = {},
    providerProfileId: providerProfileId = '',
    providerProfileIdByModel: providerProfileIdByModel = {},
    referenceCounts: referenceCounts = {},
    showSchemaControls: showSchemaControls = !![],
    allowedModelIds: allowedModelIds = [],
    runningHubWorkflowAllowedModelIds: runningHubWorkflowAllowedModelIds = [],
    onChange: onChange,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
    floatingMenuHost: floatingMenuHost = null,
    modelSubmenuPlacement: modelSubmenuPlacement = 'viewport-auto',
    schemaPopupPlacement: schemaPopupPlacement = 'inline',
  } = {},
) {
  const selector2 = el4?.['matches']?.('[data-aigen-video-model-selector]')
    ? el4
    : el4?.['querySelector']?.('[data-aigen-video-model-selector]');
  if (!selector2 || !documentObject) return { destroy() {} };
  const trigger2 = selector2['querySelector']('.img-model-btn-trigger'),
    el5 = selector2['querySelector']('.img-model-label'),
    menu2 = selector2['querySelector']('.img-model-menu'),
    videoModelMenuPortal = createVideoModelMenuPortal({
      menu: menu2,
      trigger: trigger2,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      submenuPlacement: modelSubmenuPlacement,
    }),
    schemaPopupViewportPositioner = createSchemaPopupViewportPositioner({
      selector: selector2,
      documentObject: documentObject,
      windowObject: windowObject,
      placement: schemaPopupPlacement,
    }),
    floatingUiSchemaPopupPortal = createFloatingUiSchemaPopupPortal({
      selector: selector2,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      placement: schemaPopupPlacement,
    }),
    nodeId = 'standalone-video-model-selector',
    allowedModelIds3 = normalizeAllowedModelIds(allowedModelIds),
    runningHubWorkflowAllowedModelIds3 = normalizeAllowedModelIds(runningHubWorkflowAllowedModelIds);
  let model6 = resolveRunningHubWorkflowAllowedModelId(
      resolveAllowedModelId(modelId, allowedModelIds3),
      runningHubWorkflowAllowedModelIds3,
    ),
    provider4 = String(provider || '')['trim'](),
    nodeData2 = {
      model: model6,
      provider: provider4,
      generationParams: getPlainObject(generationParams),
      generationParamsByModel: getPlainObject(generationParamsByModel),
      uiSchemaFieldState: getPlainObject(uiSchemaFieldState),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    referenceCounts2 = normalizeReferenceCounts(referenceCounts),
    activeModel = resolveVideoSelectorSchemaLayout(model6, nodeData2, { referenceCounts: referenceCounts2 }),
    bindUiSchemaFieldControls2 = null,
    uiSchemaVisibilitySignature = '',
    bindNodeSubmenus2 = null;
  const run4 = () => {
      const el6 = documentObject['createElement']('template');
      el6['innerHTML'] = buildVideoModelMenuHTML({
        activeModel: activeModel?.['model'] || model6,
        provider: activeModel?.['provider'] || provider4,
        subscriptionState:
          typeof windowObject?.['getSubscriptionState'] === 'function'
            ? windowObject['getSubscriptionState']()
            : {},
        allowedModelIds: allowedModelIds3,
        runningHubWorkflowAllowedModelIds: runningHubWorkflowAllowedModelIds3,
      })['trim']();
      const el7 = el6['content']['firstElementChild'];
      if (menu2 && el7) menu2['innerHTML'] = el7['innerHTML'];
      (bindNodeSubmenus2?.(),
        (bindNodeSubmenus2 = bindNodeSubmenus(menu2)),
        void syncModelCredentialMenu(menu2, {
          documentObject: documentObject,
          getProviderProfileId: () => String(nodeData2['providerProfileId'] || '')['trim'](),
        }));
    },
    handler3 = () => {
      if (el5) el5['textContent'] = activeModel?.['modelLabel'] || getDisplayModelName(model6);
      const el8 = documentObject['createElement']('template');
      el8['innerHTML'] = renderVideoModelTriggerIconHTML({
        model: activeModel?.['model'] || model6,
        provider: activeModel?.['provider'] || provider4,
        providersMeta: PROVIDERS_META,
      })['trim']();
      const value17 = el8['content']['firstElementChild'];
      if (
        value17 &&
        trigger2?.['firstElementChild'] &&
        trigger2['firstElementChild']['outerHTML'] !== value17['outerHTML']
      )
        trigger2['firstElementChild']['replaceWith'](value17);
    },
    store = {
      getState: () => ({ nodes: { [nodeId]: nodeData2 } }),
      getIncomingEdges: () => [],
      updateNodeData: (value18, args8 = {}) => {
        ((nodeData2 = { ...nodeData2, ...args8 }),
          (model6 = String(nodeData2['model'] || model6)['trim']()),
          (provider4 = String(nodeData2['provider'] || provider4)['trim']()));
        const uiSchemaVisibilitySignature2 = buildUiSchemaVisibilitySignature(model6, nodeData2);
        (args8?.['model'] || uiSchemaVisibilitySignature2 !== uiSchemaVisibilitySignature
          ? handler4()
          : ((activeModel = resolveVideoSelectorSchemaLayout(model6, nodeData2, {
              referenceCounts: referenceCounts2,
            })),
            handler3()),
          onChange?.({
            modelId: model6,
            provider: provider4,
            generationParams: getPlainObject(nodeData2['generationParams']),
            generationParamsByModel: getPlainObject(nodeData2['generationParamsByModel']),
            providerProfileId: String(nodeData2['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(nodeData2['providerProfileIdByModel']),
            patch: { ...args8 },
          }));
      },
    },
    handler4 = () => {
      if (!showSchemaControls) return;
      (floatingUiSchemaPopupPortal['close'](),
        (activeModel = resolveVideoSelectorSchemaLayout(model6, nodeData2, {
          referenceCounts: referenceCounts2,
        })),
        (nodeData2 = {
          ...nodeData2,
          ...activeModel['nodeData'],
          generationParamsByModel: getPlainObject(
            activeModel['nodeData']?.['generationParamsByModel'] || nodeData2['generationParamsByModel'],
          ),
        }),
        (model6 = String(activeModel['model'] || model6)['trim']()),
        (provider4 = String(activeModel['provider'] || provider4)['trim']()),
        (uiSchemaVisibilitySignature = buildUiSchemaVisibilitySignature(model6, nodeData2)),
        handler3());
      const el9 = selector2['querySelector']('.aigen-video-schema-controls');
      if (el9) el9['innerHTML'] = activeModel['controlsHtml'];
      (selector2['querySelectorAll'](':scope > .rh-adv-wrap, :scope > .rh-vram-adv-panel')['forEach'](
        (el10) => el10['remove'](),
      ),
        el9 &&
          activeModel['advanced'] &&
          el9['insertAdjacentHTML']('afterend', renderVideoAdvancedControlsMarkup(activeModel['advanced'])),
        bindUiSchemaFieldControls2?.(),
        activeModel['kind'] === 'dreamina'
          ? (bindUiSchemaFieldControls2 = bindUiSchemaFieldControls(selector2, {
              getNodeData: () => nodeData2,
              commitFieldValue: (value19, value20, value21) => {
                const value22 = String(value19 || '')['trim'](),
                  args9 = getDreaminaEffectiveNodeData(value21),
                  provider5 = resolveDreaminaStyleVideoProvider(args9['model'], args9['provider']),
                  routeMode2 =
                    value22 === 'dreaminaRouteMode'
                      ? normalizeDreaminaVideoRouteMode(value20)
                      : normalizeDreaminaVideoRouteMode(args9['dreaminaRouteMode'], args9['mode']),
                  taskType2 = resolveDreaminaVideoTaskType({ routeMode: routeMode2, ...referenceCounts2 });
                let value23;
                if (value22 === 'dreaminaRouteMode') {
                  const model7 = ensureDreaminaStyleVideoModelForTask(taskType2, args9['model'], provider5);
                  value23 = {
                    ...buildDreaminaModelSelectionParamPatch(
                      {
                        ...args9,
                        generationParams: {
                          ...getPlainObject(args9['generationParams']),
                          dreaminaRouteMode: routeMode2,
                        },
                      },
                      {
                        model: model7,
                        provider: provider5,
                        taskType: taskType2,
                        fallbackValues: { dreaminaRouteMode: routeMode2 },
                      },
                    ),
                    model: model7,
                    provider: provider5,
                  };
                } else {
                  let dreaminaStyleVideoResolution = value20;
                  if (value22 === 'resolution')
                    dreaminaStyleVideoResolution = normalizeDreaminaStyleVideoResolution(
                      taskType2,
                      args9['model'],
                      value20,
                      provider5,
                    );
                  else {
                    if (value22 === 'duration')
                      dreaminaStyleVideoResolution = normalizeDreaminaStyleVideoDuration(
                        taskType2,
                        args9['model'],
                        value20,
                        provider5,
                      );
                    else
                      value22 === 'aspectRatio' &&
                        (dreaminaStyleVideoResolution = normalizeDreaminaVideoAspectRatio(value20, {
                          preserveAdaptive: !![],
                        }));
                  }
                  value23 = ['resolution', 'duration', 'aspectRatio']['includes'](value22)
                    ? buildDreaminaParamPatch(args9, { [value22]: dreaminaStyleVideoResolution })
                    : buildUiSchemaParamPatch(args9, value22, dreaminaStyleVideoResolution);
                }
                return (store['updateNodeData'](nodeId, value23), nodeData2);
              },
            }))
          : (bindUiSchemaFieldControls2 = bindModelUiSchemaControls(selector2, {
              nodeId: nodeId,
              nodeData: nodeData2,
              store: store,
              buildPatch: (value24, value25, value26, value27) =>
                buildRhWorkflowFieldPatch(value24, value25, value26, value27),
            })));
    },
    value28 = (event) => event['stopPropagation'](),
    handler5 = () => {
      const el11 = selector2['querySelector']('.rh-vram-adv-panel');
      selector2['querySelector']('.rh-adv2-btn')?.['setAttribute'](
        'aria-expanded',
        String(el11?.['classList']['contains']('show') === !![]),
      );
    },
    value29 = (event2) => {
      event2['stopPropagation']();
      const value30 = !videoModelMenuPortal['isOpen']();
      (floatingUiSchemaPopupPortal['close'](),
        closeNodeFooterMenus(selector2, menu2),
        handler5(),
        value30
          ? (run4(), videoModelMenuPortal['open'](), activateMenuKeyboard(menu2))
          : videoModelMenuPortal['close']());
    },
    value31 = (event3) => {
      const el12 = event3['target']['closest']?.('.node-menu-item[data-value]');
      if (!el12 || el12['dataset']['disabled'] === 'true') return;
      const enabled5 = String(el12['dataset']['value'] || '')['trim']();
      if (!enabled5) return;
      if (allowedModelIds3['length'] && !allowedModelIds3['includes'](enabled5)) return;
      const modelManifest2 = getModelManifest(enabled5);
      if (
        runningHubWorkflowAllowedModelIds3['length'] &&
        modelManifest2?.['provider'] === 'runninghubwf' &&
        modelManifest2?.['adapterType'] === 'workflow' &&
        !runningHubWorkflowAllowedModelIds3['includes'](enabled5)
      )
        return;
      const provider6 = resolveModelProvider(enabled5, el12['dataset']['provider'] || provider4);
      let model8;
      if (isDreaminaStyleVideoModel(enabled5, provider6)) {
        const dreaminaEffectiveNodeData = getDreaminaEffectiveNodeData(nodeData2),
          routeMode3 = normalizeDreaminaVideoRouteMode(
            dreaminaEffectiveNodeData['dreaminaRouteMode'],
            dreaminaEffectiveNodeData['mode'],
          ),
          taskType3 = resolveDreaminaVideoTaskType({ routeMode: routeMode3, ...referenceCounts2 }),
          fallbackModel = ensureDreaminaStyleVideoModelForTask(taskType3, enabled5, provider6),
          dreaminaRememberedRouteModel = resolveDreaminaRememberedRouteModel(nodeData2, {
            provider: provider6,
            routeMode: routeMode3,
            taskType: taskType3,
            fallbackModel: fallbackModel,
          }),
          model9 =
            allowedModelIds3['length'] && !allowedModelIds3['includes'](dreaminaRememberedRouteModel)
              ? fallbackModel
              : dreaminaRememberedRouteModel || fallbackModel;
        if (allowedModelIds3['length'] && !allowedModelIds3['includes'](model9)) return;
        model8 = {
          ...buildDreaminaModelSelectionParamPatch(nodeData2, {
            model: model9,
            provider: provider6,
            taskType: taskType3,
          }),
          model: model9,
          provider: provider6,
        };
      } else
        model8 = isRunningHubVideoWorkflowManifest(enabled5)
          ? buildVideoWorkflowModelSelectionPatch(nodeData2, enabled5)
          : buildVideoModelApiModelSelectionPatch(nodeData2, enabled5, provider6);
      const modelId2 = [enabled5, model8['model'] || enabled5]['find'](
        (value32) =>
          getModelManifest(value32)?.['vip'] === !![] &&
          typeof windowObject?.['isModelAllowedBySubscription'] === 'function' &&
          !windowObject['isModelAllowedBySubscription'](value32, provider6),
      );
      if (modelId2) {
        windowObject['openSubscriptionDialog']?.({ modelId: modelId2, provider: provider6 });
        return;
      }
      const args10 = buildModelProviderProfileSelectionPatch(
        nodeData2,
        model8['model'] || enabled5,
        el12['dataset']['credentialResolvedProviderProfileId'],
      );
      (store['updateNodeData'](nodeId, {
        ...model8,
        ...args10,
        model: model8['model'] || enabled5,
        provider: model8['provider'] || provider6,
      }),
        videoModelMenuPortal['close'](),
        run4());
    },
    value33 = (event4) => {
      const value34 = event4['target']['closest']?.('.dreamina-task-model-btn');
      if (value34) {
        event4['stopPropagation']();
        const el13 = value34['parentElement']?.['querySelector']?.('.dreamina-task-model-menu'),
          value35 = !el13?.['classList']['contains']('show');
        (closeNodeFooterMenus(selector2, el13), handler5(), el13?.['classList']['toggle']('show', value35));
        if (value35) activateMenuKeyboard(el13);
        return;
      }
      const el14 = event4['target']['closest']?.('.dreamina-task-model-menu .node-menu-item[data-value]');
      if (!el14 || el14['dataset']['disabled'] === 'true') return;
      event4['stopPropagation']();
      const modelId3 = String(el14['dataset']['value'] || '')['trim']();
      if (!modelId3) return;
      const provider7 = resolveDreaminaStyleVideoProvider(modelId3, el14['dataset']['provider'] || provider4);
      if (
        getModelManifest(modelId3)?.['vip'] === !![] &&
        typeof windowObject?.['isModelAllowedBySubscription'] === 'function' &&
        !windowObject['isModelAllowedBySubscription'](modelId3, provider7)
      ) {
        windowObject['openSubscriptionDialog']?.({ modelId: modelId3, provider: provider7 });
        return;
      }
      const taskType4 =
        activeModel?.['taskType'] ||
        resolveDreaminaVideoTaskType({
          routeMode: nodeData2?.['generationParams']?.['dreaminaRouteMode'],
          ...referenceCounts2,
        });
      (store['updateNodeData'](nodeId, {
        ...buildDreaminaModelSelectionParamPatch(nodeData2, {
          model: modelId3,
          provider: provider7,
          taskType: taskType4,
        }),
        ...buildModelProviderProfileSelectionPatch(nodeData2, modelId3),
        model: modelId3,
        provider: provider7,
      }),
        run4());
    },
    value36 = (event5) => {
      const enabled6 = event5['target']['closest']?.('.rh-adv2-btn');
      if (!enabled6 || !selector2['contains'](enabled6)) return;
      event5['stopPropagation']();
      const el15 = selector2['querySelector']('.rh-vram-adv-panel');
      (floatingUiSchemaPopupPortal['close'](),
        closeNodeFooterMenus(selector2, el15),
        el15?.['classList']['toggle']('show'),
        handler5(),
        videoModelMenuPortal['close']());
    },
    value37 = (event6) => {
      if (
        selector2['contains'](event6['target']) ||
        videoModelMenuPortal['contains'](event6['target']) ||
        floatingUiSchemaPopupPortal['contains'](event6['target'])
      )
        return;
      (videoModelMenuPortal['close'](),
        floatingUiSchemaPopupPortal['close'](),
        closeNodeFooterMenus(selector2),
        handler5());
    },
    value38 = () => videoModelMenuPortal['close']();
  (selector2['addEventListener']('pointerdown', value28),
    menu2?.['addEventListener']('pointerdown', value28),
    trigger2?.['addEventListener']('click', value29),
    menu2?.['addEventListener']('click', value31),
    selector2['addEventListener']('click', value33),
    selector2['addEventListener']('click', value36),
    selector2['addEventListener']('ui-schema-menu-before-open', value38),
    documentObject['addEventListener']('click', value37));
  const bindModelCredentialMenu2 = bindModelCredentialMenu(menu2, {
    documentObject: documentObject,
    getProviderProfileId: () => String(nodeData2['providerProfileId'] || '')['trim'](),
  });
  return (
    run4(),
    handler4(),
    {
      syncContext(options2 = {}) {
        const generationParams3 = getPlainObject(
            options2['generationParams'] ?? nodeData2['generationParams'],
          ),
          uiSchemaFieldState2 = getPlainObject(
            options2['uiSchemaFieldState'] ?? nodeData2['uiSchemaFieldState'],
          ),
          referenceCounts3 = normalizeReferenceCounts(options2['referenceCounts'] ?? referenceCounts2);
        if (
          JSON['stringify']([generationParams3, uiSchemaFieldState2, referenceCounts3]) ===
          JSON['stringify']([
            nodeData2['generationParams'],
            nodeData2['uiSchemaFieldState'],
            referenceCounts2,
          ])
        )
          return;
        ((nodeData2 = {
          ...nodeData2,
          generationParams: generationParams3,
          uiSchemaFieldState: uiSchemaFieldState2,
        }),
          (referenceCounts2 = referenceCounts3),
          handler4());
      },
      applyProviderProfilePatch(options3 = {}) {
        return (
          store['updateNodeData'](nodeId, {
            providerProfileId: String(options3['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(
              options3['providerProfileIdByModel'] || nodeData2['providerProfileIdByModel'],
            ),
          }),
          void syncModelCredentialMenu(menu2, {
            documentObject: documentObject,
            getProviderProfileId: () => String(nodeData2['providerProfileId'] || '')['trim'](),
          }),
          !![]
        );
      },
      destroy() {
        (floatingUiSchemaPopupPortal['destroy'](),
          bindUiSchemaFieldControls2?.(),
          bindNodeSubmenus2?.(),
          bindModelCredentialMenu2?.(),
          videoModelMenuPortal['destroy'](),
          schemaPopupViewportPositioner['destroy'](),
          selector2['removeEventListener']('pointerdown', value28),
          menu2?.['removeEventListener']('pointerdown', value28),
          trigger2?.['removeEventListener']('click', value29),
          menu2?.['removeEventListener']('click', value31),
          selector2['removeEventListener']('click', value33),
          selector2['removeEventListener']('click', value36),
          selector2['removeEventListener']('ui-schema-menu-before-open', value38),
          documentObject['removeEventListener']('click', value37));
      },
    }
  );
}
