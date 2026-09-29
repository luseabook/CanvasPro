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
function escapeHtml(_0x505f65) {
  return String(_0x505f65 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function getPlainObject(_0x45dc73) {
  return _0x45dc73 && typeof _0x45dc73 === 'object' && !Array['isArray'](_0x45dc73) ? { ..._0x45dc73 } : {};
}
function normalizeAllowedModelIds(_0xe6460f = []) {
  return [
    ...new Set(
      (Array['isArray'](_0xe6460f) ? _0xe6460f : [])
        ['map']((_0x346b4f) => String(_0x346b4f || '')['trim']())
        ['filter'](Boolean),
    ),
  ];
}
function resolveAllowedModelId(_0x3f4980, _0x570647 = []) {
  const _0x343318 = String(_0x3f4980 || '')['trim']();
  return _0x570647['length'] && !_0x570647['includes'](_0x343318) ? _0x570647[0x0] : _0x343318;
}
function resolveRunningHubWorkflowAllowedModelId(_0x2d0954, _0x185ea2 = []) {
  const _0x1435c7 = String(_0x2d0954 || '')['trim'](),
    _0x11be61 = getModelManifest(_0x1435c7);
  return _0x185ea2['length'] &&
    _0x11be61?.['provider'] === 'runninghubwf' &&
    _0x11be61?.['adapterType'] === 'workflow' &&
    !_0x185ea2['includes'](_0x1435c7)
    ? _0x185ea2[0x0]
    : _0x1435c7;
}
const DEFAULT_VIDEO_FOOTER_PLACEMENT_ORDER = Object['freeze'](['resolution', 'mode']);
function normalizeReferenceCounts(_0x278e13 = {}) {
  return {
    imageCount: Math['max'](0x0, Number(_0x278e13?.['imageCount']) || 0x0),
    videoCount: Math['max'](0x0, Number(_0x278e13?.['videoCount']) || 0x0),
    audioCount: Math['max'](0x0, Number(_0x278e13?.['audioCount']) || 0x0),
  };
}
function wrapSchemaPlacement(_0x1521f8, _0x37cd6b) {
  return _0x37cd6b ? '<div class="ui-schema-placement ' + _0x1521f8 + '\x22>' + _0x37cd6b + '</div>' : '';
}
function renderVideoAdvancedControlsMarkup(_0x5c34d7) {
  if (!_0x5c34d7) return '';
  const _0x1ec200 = escapeHtml(t('videoNode.parameterPanel.advancedSettings'));
  return (
    '<div class="rh-adv-wrap"><button type="button" class="img-pill-btn rh-adv2-btn advanced-settings-icon-button" data-tooltip="' +
    _0x1ec200 +
    '" aria-label="' +
    _0x1ec200 +
    '" aria-expanded="false">' +
    ADVANCED_SETTINGS_TUNE_ICON_MARKUP +
    '</button></div>\x0a\x20\x20\x20\x20<div\x20class=\x22rh-vram-adv-panel\x22>' +
    _0x5c34d7 +
    '</div>'
  );
}
function getDreaminaProviderLabel(_0x4feb61) {
  const _0x59ea99 = String(_0x4feb61 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x59ea99 === 'dreamina') return t('videoNode.parameterPanel.providers.dreamina');
  if (_0x59ea99 === 'volcengine') return t('videoNode.parameterPanel.providers.volcengine');
  return t('videoNode.parameterPanel.providers.default');
}
function resolveDreaminaSelectorLayout(_0x184467, _0x2a941e) {
  const _0xa361bf = getDreaminaEffectiveNodeData(_0x184467),
    _0x3d10f7 = resolveDreaminaStyleVideoProvider(_0xa361bf['model'], _0xa361bf['provider']),
    _0x29b748 = normalizeDreaminaVideoRouteMode(_0xa361bf['dreaminaRouteMode'], _0xa361bf['mode']),
    _0x1e528c = resolveDreaminaVideoTaskType({
      routeMode: _0x29b748,
      ...normalizeReferenceCounts(_0x2a941e),
    }),
    _0x5eb56e = ensureDreaminaStyleVideoModelForTask(_0x1e528c, _0xa361bf['model'], _0x3d10f7),
    _0x3b8270 = normalizeDreaminaStyleVideoResolution(
      _0x1e528c,
      _0x5eb56e,
      _0xa361bf['resolution'] || _0xa361bf['videoSize'],
      _0x3d10f7,
    ),
    _0x350836 = normalizeDreaminaVideoAspectRatio(_0xa361bf['aspectRatio'], { preserveAdaptive: !![] }),
    _0x225848 = normalizeDreaminaStyleVideoDuration(_0x1e528c, _0x5eb56e, _0xa361bf['duration'], _0x3d10f7),
    _0x9327c0 = {
      ...getPlainObject(_0xa361bf['generationParams']),
      dreaminaRouteMode: _0x29b748,
      aspectRatio: _0x350836,
      duration: _0x225848,
      ...(_0x3b8270 ? { resolution: _0x3b8270 } : {}),
    },
    _0x32ee01 = {
      ..._0xa361bf,
      model: _0x5eb56e,
      provider: _0x3d10f7,
      dreaminaRouteMode: _0x29b748,
      aspectRatio: _0x350836,
      duration: _0x225848,
      ...(_0x3b8270 ? { resolution: _0x3b8270, videoSize: _0x3b8270 } : {}),
      generationParams: _0x9327c0,
    },
    _0x505edf = getDreaminaVideoTaskParamVisibility(_0x1e528c),
    _0x28f93b = buildDreaminaParamSchemaFields({
      routeMode: _0x29b748,
      currentRatio: _0x350836,
      currentResolution: _0x3b8270,
      currentDuration: _0x225848,
      durationRange: getDreaminaStyleVideoDurationRange(_0x1e528c, _0x5eb56e, _0x3d10f7),
      resolutionOptions: getDreaminaStyleVideoResolutionOptions(_0x1e528c, _0x5eb56e, _0x3d10f7),
    }),
    _0x187ee8 = (_0x459b64, _0x28a239 = {}) =>
      renderUiSchemaFields(_0x459b64['filter'](Boolean), _0x32ee01, {
        sourceId: 'dreamina-video-normal-params',
        ..._0x28a239,
      }),
    _0x3badf0 = getDreaminaTaskModelMenuMeta(_0x5eb56e, _0x3d10f7),
    _0x3c265c =
      '<div class="dreamina-task-model-wrap">\n    <button type="button" class="img-pill-btn dreamina-task-model-btn">\n      <span class="dreamina-task-model-label">' +
      escapeHtml(_0x3badf0?.['title'] || getDisplayModelName(_0x5eb56e)) +
      '</span>\n    </button>\n    <div class="floating-menu dreamina-task-model-menu">' +
      buildDreaminaTaskModelMenuHtml(_0x5eb56e, _0x1e528c, _0x3d10f7) +
      '</div>\x0a\x20\x20</div>',
    _0x383ada = [
      _0x3c265c,
      _0x505edf['mode']
        ? wrapSchemaPlacement(
            'ui-schema-mode-slot\x20dreamina-video-mode-schema',
            _0x187ee8([_0x28f93b['mode']]),
          )
        : '',
      _0x505edf['ratio']
        ? wrapSchemaPlacement(
            'ui-schema-resolution-slot dreamina-video-ratio-schema',
            _0x187ee8([_0x28f93b['resolution'], _0x28f93b['aspectRatio']], { placement: 'resolution' }),
          )
        : '',
      _0x505edf['duration']
        ? wrapSchemaPlacement(
            'ui-schema-duration-slot dreamina-video-duration-schema',
            _0x187ee8([_0x28f93b['duration']]),
          )
        : '',
    ]['join']('');
  return {
    kind: 'dreamina',
    model: _0x5eb56e,
    provider: _0x3d10f7,
    modelLabel: getDreaminaProviderLabel(_0x3d10f7),
    nodeData: _0x32ee01,
    taskType: _0x1e528c,
    controlsHtml: _0x383ada,
    advanced: '',
  };
}
export function resolveVideoSelectorSchemaLayout(
  _0x26bad0,
  _0x217267 = {},
  { referenceCounts: referenceCounts = {} } = {},
) {
  const _0xdd7c10 = String(_0x26bad0 || _0x217267?.['model'] || '')['trim'](),
    _0x11d2dc = resolveModelProvider(_0xdd7c10, _0x217267?.['provider'] || ''),
    _0x4ad0b2 = { ..._0x217267, model: _0xdd7c10, provider: _0x11d2dc };
  if (isDreaminaStyleVideoModel(_0xdd7c10, _0x11d2dc))
    return resolveDreaminaSelectorLayout(_0x4ad0b2, referenceCounts);
  const _0x14de16 =
      resolveModelExecution(_0xdd7c10, { providerHint: _0x11d2dc }) || resolveModelExecution(_0xdd7c10),
    _0x5502fd = _0x14de16?.['modelManifest'] || getModelManifest(_0xdd7c10),
    _0x35cf87 = String(_0x14de16?.['canonicalModelId'] || _0x5502fd?.['modelId'] || _0xdd7c10)['trim'](),
    _0x466530 = isRunningHubVideoWorkflowManifest(_0x35cf87);
  let _0x83aca4 = { ..._0x4ad0b2, model: _0x35cf87 };
  if (_0x466530) {
    const _0x5a9fe2 = buildVideoWorkflowReferenceSummaryParamsPatch(_0x83aca4, _0x35cf87, referenceCounts),
      _0x6ac523 = buildVideoWorkflowGenerationParamsPatch(_0x83aca4, _0x35cf87, _0x5a9fe2);
    _0x83aca4 = {
      ..._0x83aca4,
      ..._0x6ac523,
      ...buildVideoWorkflowDisplayParamsPatch(_0x35cf87, _0x6ac523['generationParams'], {
        v54FpsOptions: getRhV54FpsOptions(),
      }),
    };
  }
  const _0xc857a = (_0xdce7a4, _0x28b39c = {}) =>
      renderModelUiSchemaControls(_0x35cf87, _0x83aca4, { placement: _0xdce7a4, ..._0x28b39c }),
    _0x42ee65 = [];
  if (_0x466530) {
    const _0x1b2e70 = (_0x115e47) =>
      hasRunningHubVideoWorkflowUiPlacement(_0x35cf87, _0x115e47, { includeToolbarOnly: !![] });
    (_0x1b2e70('mode') && _0x42ee65['push'](wrapSchemaPlacement('ui-schema-mode-slot', _0xc857a('mode'))),
      _0x1b2e70('videoParams') &&
        _0x42ee65['push'](
          wrapSchemaPlacement(
            'ui-schema-video-params-slot',
            _0xc857a('videoParams', {
              unwrap: !![],
              rhVideoFpsOptions: getRunningHubVideoWorkflowFpsOptions(_0x35cf87, {
                v54FpsOptions: getRhV54FpsOptions(),
              }),
            }),
          ),
        ),
      _0x1b2e70('resolution') &&
        _0x42ee65['push'](wrapSchemaPlacement('ui-schema-resolution-slot', _0xc857a('resolution'))),
      _0x42ee65['push'](
        wrapSchemaPlacement('ui-schema-instance-slot', _0xc857a('instance', { variant: 'instanceToggle' })),
      ));
  } else {
    if (_0x5502fd?.['adapterType'] === 'modelApi' && _0x5502fd?.['kind'] === 'video') {
      const _0x466470 = Array['isArray'](_0x5502fd?.['uiSchema']?.['footerPlacementOrder'])
          ? _0x5502fd['uiSchema']['footerPlacementOrder']
          : [],
        _0x2adec1 = [
          ..._0x466470['filter']((_0x10393a) =>
            DEFAULT_VIDEO_FOOTER_PLACEMENT_ORDER['includes'](String(_0x10393a || '')['trim']()),
          ),
          ...DEFAULT_VIDEO_FOOTER_PLACEMENT_ORDER,
        ]['filter']((_0x2989b5, _0x142294, _0x1db490) => _0x1db490['indexOf'](_0x2989b5) === _0x142294);
      _0x2adec1['forEach']((_0x40a0c9) => {
        _0x42ee65['push'](wrapSchemaPlacement('ui-schema-' + _0x40a0c9 + '-slot', _0xc857a(_0x40a0c9)));
      });
    }
  }
  const _0x3fde3a = resolveVideoAdvancedSchemaTarget(_0x83aca4, {
      fallbackNodeData: _0x83aca4,
      buildRunningHubNodeData: (_0x4a2e29) => _0x4a2e29,
    }),
    _0xbe6553 = _0x3fde3a
      ? renderModelUiSchemaControls(_0x3fde3a['modelId'], _0x3fde3a['nodeData'], {
          placement: _0x3fde3a['placement'],
        })
      : '';
  return {
    kind: _0x466530 ? 'workflow' : 'modelApi',
    model: _0x35cf87,
    provider: _0x11d2dc,
    modelLabel: getDisplayModelName(_0x35cf87),
    nodeData: _0x83aca4,
    controlsHtml: _0x42ee65['join'](''),
    advanced: _0xbe6553,
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
  const _0x54c156 = normalizeAllowedModelIds(allowedModelIds),
    _0x26f7e1 = normalizeAllowedModelIds(runningHubWorkflowAllowedModelIds),
    _0x1af6ac = resolveRunningHubWorkflowAllowedModelId(resolveAllowedModelId(modelId, _0x54c156), _0x26f7e1),
    _0x12b79a = {
      model: _0x1af6ac,
      provider: provider,
      generationParams: getPlainObject(generationParams),
      generationParamsByModel: getPlainObject(generationParamsByModel),
      uiSchemaFieldState: getPlainObject(uiSchemaFieldState),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    _0xe26543 = resolveVideoSelectorSchemaLayout(_0x1af6ac, _0x12b79a, { referenceCounts: referenceCounts });
  return (
    '<div\x20class=\x22img-model-pills\x20aigen-video-model-selector\x20' +
    escapeHtml(className) +
    '\x22\x20data-aigen-video-model-selector>\x0a\x20\x20\x20\x20<div\x20class=\x22img-model-wrap\x22>\x0a\x20\x20\x20\x20\x20\x20' +
    renderNodeModelTrigger({
      iconHtml: renderVideoModelTriggerIconHTML({
        model: _0xe26543['model'],
        provider: _0xe26543['provider'],
        providersMeta: PROVIDERS_META,
      }),
      label: _0xe26543['modelLabel'],
    }) +
    '\n      ' +
    buildVideoModelMenuHTML({
      activeModel: _0xe26543['model'],
      provider: _0xe26543['provider'],
      allowedModelIds: _0x54c156,
      runningHubWorkflowAllowedModelIds: _0x26f7e1,
    }) +
    '\n    </div>\n    ' +
    (showSchemaControls
      ? '<div class="aigen-video-schema-controls">' +
        _0xe26543['controlsHtml'] +
        '</div>\x0a\x20\x20\x20\x20' +
        renderVideoAdvancedControlsMarkup(_0xe26543['advanced'])
      : '') +
    '\x0a\x20\x20</div>'
  );
}
function createVideoModelMenuPortal({
  menu: _0x4cabf6,
  trigger: _0x277c92,
  host: _0x59b627,
  documentObject: _0x40cb3c,
  windowObject: _0x308c7d,
  submenuPlacement: submenuPlacement = 'viewport-auto',
} = {}) {
  return createFloatingModelMenuPortal({
    menu: _0x4cabf6,
    trigger: _0x277c92,
    host: _0x59b627,
    documentObject: _0x40cb3c,
    windowObject: _0x308c7d,
    portalClass: 'aigen-video-model-menu-portal',
    submenuPlacement: submenuPlacement,
  });
}
function createSchemaPopupViewportPositioner({
  selector: _0x39376c,
  documentObject: _0x555365,
  windowObject: _0x123a77,
  placement: placement = 'inline',
} = {}) {
  if (!_0x39376c || placement !== 'viewport-auto-up') return { destroy() {} };
  let _0x229f73 = null,
    _0x3b5b3b = null,
    _0x1f944c = 0x0;
  const _0x345adf = 0x10,
    _0x3be96e = 0x8,
    _0x1bec21 = () => {
      _0x1f944c = 0x0;
      if (!_0x229f73?.['isConnected'] || !_0x229f73['classList']?.['contains']?.('show')) return;
      const _0x4d52e1 = _0x3b5b3b?.['querySelector']?.('[data-ui-schema-menu-trigger]') || _0x3b5b3b,
        _0xb10801 = _0x4d52e1?.['getBoundingClientRect']?.(),
        _0xa88fa7 = _0x229f73['getBoundingClientRect']?.(),
        _0x73fa1f =
          Number(_0x123a77?.['innerWidth']) || Number(_0x555365?.['documentElement']?.['clientWidth']) || 0x0,
        _0x1c5623 =
          Number(_0x123a77?.['innerHeight']) ||
          Number(_0x555365?.['documentElement']?.['clientHeight']) ||
          0x0;
      if (!_0xb10801 || !_0xa88fa7 || _0x73fa1f <= 0x0 || _0x1c5623 <= 0x0) return;
      const _0x8ffcfc = Math['max'](_0x345adf, _0x73fa1f - _0x345adf - _0xa88fa7['width']),
        _0x233bca = Math['min'](Math['max'](_0xb10801['right'] - _0xa88fa7['width'], _0x345adf), _0x8ffcfc),
        _0x1f89c6 = Math['max'](_0x345adf, _0x1c5623 - _0x345adf - _0xa88fa7['height']),
        _0x7da842 = _0xb10801['top'] - _0x3be96e - _0xa88fa7['height'],
        _0x36f332 = _0xb10801['bottom'] + _0x3be96e,
        _0x24b6d6 =
          _0x7da842 >= _0x345adf
            ? Math['min'](_0x7da842, _0x1f89c6)
            : Math['min'](Math['max'](_0x36f332, _0x345adf), _0x1f89c6);
      (_0x229f73['style']?.['setProperty']?.('position', 'fixed'),
        _0x229f73['style']?.['setProperty']?.('left', Math['round'](_0x233bca) + 'px'),
        _0x229f73['style']?.['setProperty']?.('top', Math['round'](_0x24b6d6) + 'px'),
        _0x229f73['style']?.['setProperty']?.('right', 'auto'),
        _0x229f73['style']?.['setProperty']?.('bottom', 'auto'));
    },
    _0x19016a = () => {
      _0x1f944c && _0x123a77?.['cancelAnimationFrame']?.(_0x1f944c);
      const _0x41e91f =
        _0x123a77?.['requestAnimationFrame']?.['bind']?.(_0x123a77) ||
        ((_0x2fe3df) => _0x123a77?.['setTimeout']?.(_0x2fe3df, 0x0));
      _0x1f944c = _0x41e91f(_0x1bec21);
    },
    _0x279c87 = (_0x3e167d) => {
      const _0x4ad98a = _0x3e167d?.['detail']?.['popup'] || null,
        _0x343f97 = _0x3e167d?.['detail']?.['fieldEl'] || null;
      if (!_0x4ad98a || !_0x343f97 || !_0x39376c['contains']?.(_0x343f97)) return;
      if (!_0x3e167d['detail']?.['shouldOpen']) {
        _0x4ad98a === _0x229f73 && ((_0x229f73 = null), (_0x3b5b3b = null));
        return;
      }
      ((_0x229f73 = _0x4ad98a), (_0x3b5b3b = _0x343f97), _0x19016a());
    };
  return (
    _0x39376c['addEventListener']?.('ui-schema-menu-before-open', _0x279c87),
    _0x555365?.['addEventListener']?.('scroll', _0x19016a, !![]),
    _0x123a77?.['addEventListener']?.('resize', _0x19016a),
    {
      destroy() {
        (_0x1f944c && (_0x123a77?.['cancelAnimationFrame']?.(_0x1f944c), (_0x1f944c = 0x0)),
          _0x39376c['removeEventListener']?.('ui-schema-menu-before-open', _0x279c87),
          _0x555365?.['removeEventListener']?.('scroll', _0x19016a, !![]),
          _0x123a77?.['removeEventListener']?.('resize', _0x19016a),
          (_0x229f73 = null),
          (_0x3b5b3b = null));
      },
    }
  );
}
export function bindAIGenVideoModelSelector(
  _0x4b4411,
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
    onChange: _0x2d5c00,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
    floatingMenuHost: floatingMenuHost = null,
    modelSubmenuPlacement: modelSubmenuPlacement = 'viewport-auto',
    schemaPopupPlacement: schemaPopupPlacement = 'inline',
  } = {},
) {
  const _0x353d0e = _0x4b4411?.['matches']?.('[data-aigen-video-model-selector]')
    ? _0x4b4411
    : _0x4b4411?.['querySelector']?.('[data-aigen-video-model-selector]');
  if (!_0x353d0e || !documentObject) return { destroy() {} };
  const _0x1135b6 = _0x353d0e['querySelector']('.img-model-btn-trigger'),
    _0x1631a4 = _0x353d0e['querySelector']('.img-model-label'),
    _0x35452c = _0x353d0e['querySelector']('.img-model-menu'),
    _0x282836 = createVideoModelMenuPortal({
      menu: _0x35452c,
      trigger: _0x1135b6,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      submenuPlacement: modelSubmenuPlacement,
    }),
    _0x232a57 = createSchemaPopupViewportPositioner({
      selector: _0x353d0e,
      documentObject: documentObject,
      windowObject: windowObject,
      placement: schemaPopupPlacement,
    }),
    _0x272a96 = createFloatingUiSchemaPopupPortal({
      selector: _0x353d0e,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      placement: schemaPopupPlacement,
    }),
    _0x1f51e0 = 'standalone-video-model-selector',
    _0x3647d0 = normalizeAllowedModelIds(allowedModelIds),
    _0x55d5f0 = normalizeAllowedModelIds(runningHubWorkflowAllowedModelIds);
  let _0x1546e0 = resolveRunningHubWorkflowAllowedModelId(
      resolveAllowedModelId(modelId, _0x3647d0),
      _0x55d5f0,
    ),
    _0x17e676 = String(provider || '')['trim'](),
    _0xee1167 = {
      model: _0x1546e0,
      provider: _0x17e676,
      generationParams: getPlainObject(generationParams),
      generationParamsByModel: getPlainObject(generationParamsByModel),
      uiSchemaFieldState: getPlainObject(uiSchemaFieldState),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    _0x3d1062 = normalizeReferenceCounts(referenceCounts),
    _0x292e8e = resolveVideoSelectorSchemaLayout(_0x1546e0, _0xee1167, { referenceCounts: _0x3d1062 }),
    _0x458b97 = null,
    _0x415b31 = '',
    _0x528165 = null;
  const _0xd228b3 = () => {
      const _0x5d800d = documentObject['createElement']('template');
      _0x5d800d['innerHTML'] = buildVideoModelMenuHTML({
        activeModel: _0x292e8e?.['model'] || _0x1546e0,
        provider: _0x292e8e?.['provider'] || _0x17e676,
        subscriptionState:
          typeof windowObject?.['getSubscriptionState'] === 'function'
            ? windowObject['getSubscriptionState']()
            : {},
        allowedModelIds: _0x3647d0,
        runningHubWorkflowAllowedModelIds: _0x55d5f0,
      })['trim']();
      const _0x33986f = _0x5d800d['content']['firstElementChild'];
      if (_0x35452c && _0x33986f) _0x35452c['innerHTML'] = _0x33986f['innerHTML'];
      (_0x528165?.(),
        (_0x528165 = bindNodeSubmenus(_0x35452c)),
        void syncModelCredentialMenu(_0x35452c, {
          documentObject: documentObject,
          getProviderProfileId: () => String(_0xee1167['providerProfileId'] || '')['trim'](),
        }));
    },
    _0x104ea7 = () => {
      if (_0x1631a4) _0x1631a4['textContent'] = _0x292e8e?.['modelLabel'] || getDisplayModelName(_0x1546e0);
      const _0x4ead2b = documentObject['createElement']('template');
      _0x4ead2b['innerHTML'] = renderVideoModelTriggerIconHTML({
        model: _0x292e8e?.['model'] || _0x1546e0,
        provider: _0x292e8e?.['provider'] || _0x17e676,
        providersMeta: PROVIDERS_META,
      })['trim']();
      const _0x20dfb5 = _0x4ead2b['content']['firstElementChild'];
      if (
        _0x20dfb5 &&
        _0x1135b6?.['firstElementChild'] &&
        _0x1135b6['firstElementChild']['outerHTML'] !== _0x20dfb5['outerHTML']
      )
        _0x1135b6['firstElementChild']['replaceWith'](_0x20dfb5);
    },
    _0x4aa3c7 = {
      getState: () => ({ nodes: { [_0x1f51e0]: _0xee1167 } }),
      getIncomingEdges: () => [],
      updateNodeData: (_0x3feef9, _0x3ed0dd = {}) => {
        ((_0xee1167 = { ..._0xee1167, ..._0x3ed0dd }),
          (_0x1546e0 = String(_0xee1167['model'] || _0x1546e0)['trim']()),
          (_0x17e676 = String(_0xee1167['provider'] || _0x17e676)['trim']()));
        const _0x514a58 = buildUiSchemaVisibilitySignature(_0x1546e0, _0xee1167);
        (_0x3ed0dd?.['model'] || _0x514a58 !== _0x415b31
          ? _0x256c17()
          : ((_0x292e8e = resolveVideoSelectorSchemaLayout(_0x1546e0, _0xee1167, {
              referenceCounts: _0x3d1062,
            })),
            _0x104ea7()),
          _0x2d5c00?.({
            modelId: _0x1546e0,
            provider: _0x17e676,
            generationParams: getPlainObject(_0xee1167['generationParams']),
            generationParamsByModel: getPlainObject(_0xee1167['generationParamsByModel']),
            providerProfileId: String(_0xee1167['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(_0xee1167['providerProfileIdByModel']),
            patch: { ..._0x3ed0dd },
          }));
      },
    },
    _0x256c17 = () => {
      if (!showSchemaControls) return;
      (_0x272a96['close'](),
        (_0x292e8e = resolveVideoSelectorSchemaLayout(_0x1546e0, _0xee1167, { referenceCounts: _0x3d1062 })),
        (_0xee1167 = {
          ..._0xee1167,
          ..._0x292e8e['nodeData'],
          generationParamsByModel: getPlainObject(
            _0x292e8e['nodeData']?.['generationParamsByModel'] || _0xee1167['generationParamsByModel'],
          ),
        }),
        (_0x1546e0 = String(_0x292e8e['model'] || _0x1546e0)['trim']()),
        (_0x17e676 = String(_0x292e8e['provider'] || _0x17e676)['trim']()),
        (_0x415b31 = buildUiSchemaVisibilitySignature(_0x1546e0, _0xee1167)),
        _0x104ea7());
      const _0x4745fc = _0x353d0e['querySelector']('.aigen-video-schema-controls');
      if (_0x4745fc) _0x4745fc['innerHTML'] = _0x292e8e['controlsHtml'];
      (_0x353d0e['querySelectorAll'](':scope > .rh-adv-wrap, :scope > .rh-vram-adv-panel')['forEach'](
        (_0x389404) => _0x389404['remove'](),
      ),
        _0x4745fc &&
          _0x292e8e['advanced'] &&
          _0x4745fc['insertAdjacentHTML'](
            'afterend',
            renderVideoAdvancedControlsMarkup(_0x292e8e['advanced']),
          ),
        _0x458b97?.(),
        _0x292e8e['kind'] === 'dreamina'
          ? (_0x458b97 = bindUiSchemaFieldControls(_0x353d0e, {
              getNodeData: () => _0xee1167,
              commitFieldValue: (_0x44bb57, _0x2dd061, _0x5bdbe5) => {
                const _0x7be334 = String(_0x44bb57 || '')['trim'](),
                  _0x466cf7 = getDreaminaEffectiveNodeData(_0x5bdbe5),
                  _0x587bb7 = resolveDreaminaStyleVideoProvider(_0x466cf7['model'], _0x466cf7['provider']),
                  _0x46cdda =
                    _0x7be334 === 'dreaminaRouteMode'
                      ? normalizeDreaminaVideoRouteMode(_0x2dd061)
                      : normalizeDreaminaVideoRouteMode(_0x466cf7['dreaminaRouteMode'], _0x466cf7['mode']),
                  _0x5ed069 = resolveDreaminaVideoTaskType({ routeMode: _0x46cdda, ..._0x3d1062 });
                let _0x250c24;
                if (_0x7be334 === 'dreaminaRouteMode') {
                  const _0x3902bc = ensureDreaminaStyleVideoModelForTask(
                    _0x5ed069,
                    _0x466cf7['model'],
                    _0x587bb7,
                  );
                  _0x250c24 = {
                    ...buildDreaminaModelSelectionParamPatch(
                      {
                        ..._0x466cf7,
                        generationParams: {
                          ...getPlainObject(_0x466cf7['generationParams']),
                          dreaminaRouteMode: _0x46cdda,
                        },
                      },
                      {
                        model: _0x3902bc,
                        provider: _0x587bb7,
                        taskType: _0x5ed069,
                        fallbackValues: { dreaminaRouteMode: _0x46cdda },
                      },
                    ),
                    model: _0x3902bc,
                    provider: _0x587bb7,
                  };
                } else {
                  let _0x2795d5 = _0x2dd061;
                  if (_0x7be334 === 'resolution')
                    _0x2795d5 = normalizeDreaminaStyleVideoResolution(
                      _0x5ed069,
                      _0x466cf7['model'],
                      _0x2dd061,
                      _0x587bb7,
                    );
                  else {
                    if (_0x7be334 === 'duration')
                      _0x2795d5 = normalizeDreaminaStyleVideoDuration(
                        _0x5ed069,
                        _0x466cf7['model'],
                        _0x2dd061,
                        _0x587bb7,
                      );
                    else
                      _0x7be334 === 'aspectRatio' &&
                        (_0x2795d5 = normalizeDreaminaVideoAspectRatio(_0x2dd061, {
                          preserveAdaptive: !![],
                        }));
                  }
                  _0x250c24 = ['resolution', 'duration', 'aspectRatio']['includes'](_0x7be334)
                    ? buildDreaminaParamPatch(_0x466cf7, { [_0x7be334]: _0x2795d5 })
                    : buildUiSchemaParamPatch(_0x466cf7, _0x7be334, _0x2795d5);
                }
                return (_0x4aa3c7['updateNodeData'](_0x1f51e0, _0x250c24), _0xee1167);
              },
            }))
          : (_0x458b97 = bindModelUiSchemaControls(_0x353d0e, {
              nodeId: _0x1f51e0,
              nodeData: _0xee1167,
              store: _0x4aa3c7,
              buildPatch: (_0x12d17c, _0xbed78, _0x381598, _0x14fc26) =>
                buildRhWorkflowFieldPatch(_0x12d17c, _0xbed78, _0x381598, _0x14fc26),
            })));
    },
    _0x1ec823 = (_0x30061d) => _0x30061d['stopPropagation'](),
    _0x913f46 = () => {
      const _0x1c413d = _0x353d0e['querySelector']('.rh-vram-adv-panel');
      _0x353d0e['querySelector']('.rh-adv2-btn')?.['setAttribute'](
        'aria-expanded',
        String(_0x1c413d?.['classList']['contains']('show') === !![]),
      );
    },
    _0x2dae99 = (_0x49881a) => {
      _0x49881a['stopPropagation']();
      const _0x2892b7 = !_0x282836['isOpen']();
      (_0x272a96['close'](),
        closeNodeFooterMenus(_0x353d0e, _0x35452c),
        _0x913f46(),
        _0x2892b7
          ? (_0xd228b3(), _0x282836['open'](), activateMenuKeyboard(_0x35452c))
          : _0x282836['close']());
    },
    _0x3071f3 = (_0x249c2f) => {
      const _0x1ed291 = _0x249c2f['target']['closest']?.('.node-menu-item[data-value]');
      if (!_0x1ed291 || _0x1ed291['dataset']['disabled'] === 'true') return;
      const _0x3f3877 = String(_0x1ed291['dataset']['value'] || '')['trim']();
      if (!_0x3f3877) return;
      if (_0x3647d0['length'] && !_0x3647d0['includes'](_0x3f3877)) return;
      const _0x3b60c6 = getModelManifest(_0x3f3877);
      if (
        _0x55d5f0['length'] &&
        _0x3b60c6?.['provider'] === 'runninghubwf' &&
        _0x3b60c6?.['adapterType'] === 'workflow' &&
        !_0x55d5f0['includes'](_0x3f3877)
      )
        return;
      const _0x19d3e4 = resolveModelProvider(_0x3f3877, _0x1ed291['dataset']['provider'] || _0x17e676);
      let _0x1f59da;
      if (isDreaminaStyleVideoModel(_0x3f3877, _0x19d3e4)) {
        const _0x268b89 = getDreaminaEffectiveNodeData(_0xee1167),
          _0x269d28 = normalizeDreaminaVideoRouteMode(_0x268b89['dreaminaRouteMode'], _0x268b89['mode']),
          _0x4f33ff = resolveDreaminaVideoTaskType({ routeMode: _0x269d28, ..._0x3d1062 }),
          _0x3e3404 = ensureDreaminaStyleVideoModelForTask(_0x4f33ff, _0x3f3877, _0x19d3e4),
          _0x4e531d = resolveDreaminaRememberedRouteModel(_0xee1167, {
            provider: _0x19d3e4,
            routeMode: _0x269d28,
            taskType: _0x4f33ff,
            fallbackModel: _0x3e3404,
          }),
          _0x53ca97 =
            _0x3647d0['length'] && !_0x3647d0['includes'](_0x4e531d) ? _0x3e3404 : _0x4e531d || _0x3e3404;
        if (_0x3647d0['length'] && !_0x3647d0['includes'](_0x53ca97)) return;
        _0x1f59da = {
          ...buildDreaminaModelSelectionParamPatch(_0xee1167, {
            model: _0x53ca97,
            provider: _0x19d3e4,
            taskType: _0x4f33ff,
          }),
          model: _0x53ca97,
          provider: _0x19d3e4,
        };
      } else
        _0x1f59da = isRunningHubVideoWorkflowManifest(_0x3f3877)
          ? buildVideoWorkflowModelSelectionPatch(_0xee1167, _0x3f3877)
          : buildVideoModelApiModelSelectionPatch(_0xee1167, _0x3f3877, _0x19d3e4);
      const _0x30866f = [_0x3f3877, _0x1f59da['model'] || _0x3f3877]['find'](
        (_0xdb5db0) =>
          getModelManifest(_0xdb5db0)?.['vip'] === !![] &&
          typeof windowObject?.['isModelAllowedBySubscription'] === 'function' &&
          !windowObject['isModelAllowedBySubscription'](_0xdb5db0, _0x19d3e4),
      );
      if (_0x30866f) {
        windowObject['openSubscriptionDialog']?.({ modelId: _0x30866f, provider: _0x19d3e4 });
        return;
      }
      const _0x2acf64 = buildModelProviderProfileSelectionPatch(
        _0xee1167,
        _0x1f59da['model'] || _0x3f3877,
        _0x1ed291['dataset']['credentialResolvedProviderProfileId'],
      );
      (_0x4aa3c7['updateNodeData'](_0x1f51e0, {
        ..._0x1f59da,
        ..._0x2acf64,
        model: _0x1f59da['model'] || _0x3f3877,
        provider: _0x1f59da['provider'] || _0x19d3e4,
      }),
        _0x282836['close'](),
        _0xd228b3());
    },
    _0x30b5 = (_0x3109d3) => {
      const _0x31004d = _0x3109d3['target']['closest']?.('.dreamina-task-model-btn');
      if (_0x31004d) {
        _0x3109d3['stopPropagation']();
        const _0x5997d2 = _0x31004d['parentElement']?.['querySelector']?.('.dreamina-task-model-menu'),
          _0x5c1952 = !_0x5997d2?.['classList']['contains']('show');
        (closeNodeFooterMenus(_0x353d0e, _0x5997d2),
          _0x913f46(),
          _0x5997d2?.['classList']['toggle']('show', _0x5c1952));
        if (_0x5c1952) activateMenuKeyboard(_0x5997d2);
        return;
      }
      const _0x143812 = _0x3109d3['target']['closest']?.(
        '.dreamina-task-model-menu .node-menu-item[data-value]',
      );
      if (!_0x143812 || _0x143812['dataset']['disabled'] === 'true') return;
      _0x3109d3['stopPropagation']();
      const _0x4121fd = String(_0x143812['dataset']['value'] || '')['trim']();
      if (!_0x4121fd) return;
      const _0x1d1dd0 = resolveDreaminaStyleVideoProvider(
        _0x4121fd,
        _0x143812['dataset']['provider'] || _0x17e676,
      );
      if (
        getModelManifest(_0x4121fd)?.['vip'] === !![] &&
        typeof windowObject?.['isModelAllowedBySubscription'] === 'function' &&
        !windowObject['isModelAllowedBySubscription'](_0x4121fd, _0x1d1dd0)
      ) {
        windowObject['openSubscriptionDialog']?.({ modelId: _0x4121fd, provider: _0x1d1dd0 });
        return;
      }
      const _0x5e5fde =
        _0x292e8e?.['taskType'] ||
        resolveDreaminaVideoTaskType({
          routeMode: _0xee1167?.['generationParams']?.['dreaminaRouteMode'],
          ..._0x3d1062,
        });
      (_0x4aa3c7['updateNodeData'](_0x1f51e0, {
        ...buildDreaminaModelSelectionParamPatch(_0xee1167, {
          model: _0x4121fd,
          provider: _0x1d1dd0,
          taskType: _0x5e5fde,
        }),
        ...buildModelProviderProfileSelectionPatch(_0xee1167, _0x4121fd),
        model: _0x4121fd,
        provider: _0x1d1dd0,
      }),
        _0xd228b3());
    },
    _0x3a9221 = (_0x3fed0f) => {
      const _0x7ff0c7 = _0x3fed0f['target']['closest']?.('.rh-adv2-btn');
      if (!_0x7ff0c7 || !_0x353d0e['contains'](_0x7ff0c7)) return;
      _0x3fed0f['stopPropagation']();
      const _0x33d4a3 = _0x353d0e['querySelector']('.rh-vram-adv-panel');
      (_0x272a96['close'](),
        closeNodeFooterMenus(_0x353d0e, _0x33d4a3),
        _0x33d4a3?.['classList']['toggle']('show'),
        _0x913f46(),
        _0x282836['close']());
    },
    _0x4b3596 = (_0x142c4a) => {
      if (
        _0x353d0e['contains'](_0x142c4a['target']) ||
        _0x282836['contains'](_0x142c4a['target']) ||
        _0x272a96['contains'](_0x142c4a['target'])
      )
        return;
      (_0x282836['close'](), _0x272a96['close'](), closeNodeFooterMenus(_0x353d0e), _0x913f46());
    },
    _0x49999c = () => _0x282836['close']();
  (_0x353d0e['addEventListener']('pointerdown', _0x1ec823),
    _0x35452c?.['addEventListener']('pointerdown', _0x1ec823),
    _0x1135b6?.['addEventListener']('click', _0x2dae99),
    _0x35452c?.['addEventListener']('click', _0x3071f3),
    _0x353d0e['addEventListener']('click', _0x30b5),
    _0x353d0e['addEventListener']('click', _0x3a9221),
    _0x353d0e['addEventListener']('ui-schema-menu-before-open', _0x49999c),
    documentObject['addEventListener']('click', _0x4b3596));
  const _0x25914a = bindModelCredentialMenu(_0x35452c, {
    documentObject: documentObject,
    getProviderProfileId: () => String(_0xee1167['providerProfileId'] || '')['trim'](),
  });
  return (
    _0xd228b3(),
    _0x256c17(),
    {
      syncContext(_0x2edb2a = {}) {
        const _0xcd7bb1 = getPlainObject(_0x2edb2a['generationParams'] ?? _0xee1167['generationParams']),
          _0x415d3f = getPlainObject(_0x2edb2a['uiSchemaFieldState'] ?? _0xee1167['uiSchemaFieldState']),
          _0x3083cc = normalizeReferenceCounts(_0x2edb2a['referenceCounts'] ?? _0x3d1062);
        if (
          JSON['stringify']([_0xcd7bb1, _0x415d3f, _0x3083cc]) ===
          JSON['stringify']([_0xee1167['generationParams'], _0xee1167['uiSchemaFieldState'], _0x3d1062])
        )
          return;
        ((_0xee1167 = { ..._0xee1167, generationParams: _0xcd7bb1, uiSchemaFieldState: _0x415d3f }),
          (_0x3d1062 = _0x3083cc),
          _0x256c17());
      },
      applyProviderProfilePatch(_0x156e94 = {}) {
        return (
          _0x4aa3c7['updateNodeData'](_0x1f51e0, {
            providerProfileId: String(_0x156e94['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(
              _0x156e94['providerProfileIdByModel'] || _0xee1167['providerProfileIdByModel'],
            ),
          }),
          void syncModelCredentialMenu(_0x35452c, {
            documentObject: documentObject,
            getProviderProfileId: () => String(_0xee1167['providerProfileId'] || '')['trim'](),
          }),
          !![]
        );
      },
      destroy() {
        (_0x272a96['destroy'](),
          _0x458b97?.(),
          _0x528165?.(),
          _0x25914a?.(),
          _0x282836['destroy'](),
          _0x232a57['destroy'](),
          _0x353d0e['removeEventListener']('pointerdown', _0x1ec823),
          _0x35452c?.['removeEventListener']('pointerdown', _0x1ec823),
          _0x1135b6?.['removeEventListener']('click', _0x2dae99),
          _0x35452c?.['removeEventListener']('click', _0x3071f3),
          _0x353d0e['removeEventListener']('click', _0x30b5),
          _0x353d0e['removeEventListener']('click', _0x3a9221),
          _0x353d0e['removeEventListener']('ui-schema-menu-before-open', _0x49999c),
          documentObject['removeEventListener']('click', _0x4b3596));
      },
    }
  );
}
