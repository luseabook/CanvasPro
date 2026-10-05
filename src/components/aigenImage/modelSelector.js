import { getDisplayModelName } from '../../modules/providers.js';
import { activateMenuKeyboard } from '../../modules/floatingMenuKeyboard.js';
import { getModelManifest } from '../../manifests/index.js';
import { t } from '../../i18n/index.js';
import { bindImageModelMenuGroups } from './imageModelMenuBinding.js';
import {
  bindModelUiSchemaControls,
  buildModelUiSchemaDefaultParams,
  renderModelUiSchemaControls,
  sanitizeModelUiSchemaParams,
} from './uiSchemaRenderer.js';
import { buildUiSchemaVisibilitySignature } from './uiSchemaVisibility.js';
import {
  closeNodeFooterMenus,
  createFloatingModelMenuPortal,
  createFloatingUiSchemaPopupPortal,
} from '../shared/nodeFooterControls.js';
import { ADVANCED_SETTINGS_TUNE_ICON_MARKUP } from '../sharedIconMarkup.js';
import { renderNodeModelMenu } from '../shared/nodeModelMenu.js';
import { buildModelProviderProfileSelectionPatch } from '../../modules/modelProviderProfileSelection.js';
import { bindModelCredentialMenu, syncModelCredentialMenu } from '../../modules/modelCredentialUi.js';
import { buildImageModelMenuHTML, renderImageModelTriggerIconHTML } from './uiModuleModelHelpers.js';
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
function renderStandaloneSchemaControls(item, key = {}, excludeFieldIds2 = []) {
  const mode = renderModelUiSchemaControls(item, key, {
      placement: 'mode',
      variant: 'pillMenu',
      excludeFieldIds: excludeFieldIds2,
    }),
    resolution = renderModelUiSchemaControls(item, key, {
      placement: 'resolution',
      variant: 'resolutionPill',
      excludeFieldIds: excludeFieldIds2,
    }),
    advanced = renderModelUiSchemaControls(item, key, {
      placement: 'advanced',
      variant: 'advancedRow',
      excludeFieldIds: excludeFieldIds2,
    }),
    instance = renderModelUiSchemaControls(item, key, {
      placement: 'instance',
      variant: 'instanceToggle',
      excludeFieldIds: excludeFieldIds2,
    });
  return { mode: mode, resolution: resolution, advanced: advanced, instance: instance };
}
export function renderAIGenImageModelSelectorMarkup({
  modelId: modelId = '',
  provider: provider = '',
  className: className = '',
  generationParams: generationParams = {},
  providerProfileId: providerProfileId = '',
  providerProfileIdByModel: providerProfileIdByModel = {},
  showSchemaControls: showSchemaControls = ![],
  excludeRunningHubWorkflowModels: excludeRunningHubWorkflowModels = ![],
  runningHubWorkflowModelIds: runningHubWorkflowModelIds = null,
  allowedWorkflowModelIds: allowedWorkflowModelIds = null,
  modelMenuGroups: modelMenuGroups = null,
  excludeFieldIds: excludeFieldIds = [],
  showCaret: showCaret = ![],
} = {}) {
  const model = String(modelId || '')['trim'](),
    index = {
      model: model,
      provider: provider,
      generationParams: getPlainObject(generationParams),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    result = showSchemaControls
      ? renderStandaloneSchemaControls(model, index, excludeFieldIds)
      : { mode: '', resolution: '', advanced: '', instance: '' },
    escapeHtml2 = escapeHtml(t('aigenImage.controls.advancedSettings'));
  return (
    '<div class="img-model-pills aigen-image-model-selector ' +
    escapeHtml(className) +
    '" data-aigen-image-model-selector>\n    <div class="img-model-wrap">\n      <button type="button" class="img-pill-btn img-model-btn-trigger" aria-expanded="false">\n        ' +
    renderImageModelTriggerIconHTML({ model: model, provider: provider }) +
    '\n        <span class="img-model-label">' +
    escapeHtml(getDisplayModelName(model)) +
    '</span>\n        ' +
    (showCaret
      ? '<svg class="image-model-selector-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
      : '') +
    '\n      </button>\n      ' +
    (Array['isArray'](modelMenuGroups)
      ? renderNodeModelMenu({ groups: modelMenuGroups, activeModel: model, kind: 'image' })
      : buildImageModelMenuHTML({
          activeModel: model,
          excludeRunningHubWorkflowModels: excludeRunningHubWorkflowModels,
          runningHubWorkflowModelIds: runningHubWorkflowModelIds,
          allowedWorkflowModelIds: allowedWorkflowModelIds,
        })) +
    '\n    </div>\n    ' +
    (showSchemaControls
      ? '<div class="ui-schema-placement ui-schema-mode-slot" style="' +
        (result['mode'] ? '' : 'display:none;') +
        '">' +
        result['mode'] +
        '</div>\n    <div class="ui-schema-placement ui-schema-resolution-slot" style="' +
        (result['resolution'] ? '' : 'display:none;') +
        '">' +
        result['resolution'] +
        '</div>\n    <div class="rh-adv-wrap" style="position:relative;' +
        (result['advanced'] ? '' : 'display:none;') +
        '">\n      <button type="button" class="img-pill-btn rh-adv-btn advanced-settings-icon-button" data-tooltip="' +
        escapeHtml2 +
        '" aria-label="' +
        escapeHtml2 +
        '" aria-expanded="false">' +
        ADVANCED_SETTINGS_TUNE_ICON_MARKUP +
        '</button>\n    </div>\n    <div class="ui-schema-placement ui-schema-instance-slot" style="' +
        (result['instance'] ? '' : 'display:none;') +
        '">' +
        result['instance'] +
        '</div>\n    <div class="rh-adv-panel">' +
        result['advanced'] +
        '</div>'
      : '') +
    '\n  </div>'
  );
}
export function bindAIGenImageModelSelector(
  el,
  {
    modelId: modelId = '',
    provider: provider = '',
    generationParams: generationParams = {},
    generationParamsByModel: generationParamsByModel = {},
    providerProfileId: providerProfileId = '',
    providerProfileIdByModel: providerProfileIdByModel = {},
    showSchemaControls: showSchemaControls = ![],
    onChange: onChange,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
    floatingMenuHost: floatingMenuHost = null,
    modelSubmenuPlacement: modelSubmenuPlacement = 'viewport-auto',
    schemaPopupPlacement: schemaPopupPlacement = 'inline',
    excludeFieldIds: excludeFieldIds = [],
  } = {},
) {
  const selector = el?.['matches']?.('[data-aigen-image-model-selector]')
    ? el
    : el?.['querySelector']?.('[data-aigen-image-model-selector]');
  if (!selector || !documentObject) return { destroy() {} };
  const trigger = selector['querySelector']('.img-model-btn-trigger'),
    modelLabel = selector['querySelector']('.img-model-label'),
    menu = selector['querySelector']('.img-model-menu'),
    floatingModelMenuPortal = createFloatingModelMenuPortal({
      menu: menu,
      trigger: trigger,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      portalClass: 'aigen-image-model-menu-portal',
      submenuPlacement: modelSubmenuPlacement,
    }),
    floatingUiSchemaPopupPortal = createFloatingUiSchemaPopupPortal({
      selector: selector,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      placement: schemaPopupPlacement,
      contextClass: 'aigen-image-menu-context',
    });
  let model2 = String(modelId || '')['trim'](),
    provider2 = String(provider || '')['trim']();
  const nodeId = 'standalone-image-model-selector';
  let nodeData = {
      model: model2,
      provider: provider2,
      generationParams: getPlainObject(generationParams),
      generationParamsByModel: getPlainObject(generationParamsByModel),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    bindModelUiSchemaControls2 = null,
    uiSchemaVisibilitySignature = '';
  const run = () => {
      if (modelLabel) modelLabel['textContent'] = getDisplayModelName(model2);
      const el2 = documentObject['createElement']('template');
      el2['innerHTML'] = renderImageModelTriggerIconHTML({ model: model2, provider: provider2 })['trim']();
      const data = el2['content']['firstElementChild'];
      if (data && trigger?.['firstElementChild']) trigger['firstElementChild']['replaceWith'](data);
    },
    options = (event) => event['stopPropagation'](),
    handler = () => {
      (floatingUiSchemaPopupPortal['close'](),
        selector['querySelectorAll']('.ui-schema-floating-menu')['forEach']((el3) =>
          el3['classList']['remove']('show'),
        ),
        selector['querySelectorAll']('.ui-schema-popup')['forEach']((el4) => {
          el4['style']['display'] = 'none';
        }));
    },
    target = (event2) => {
      event2['stopPropagation']();
      const source = !floatingModelMenuPortal['isOpen']();
      (handler(),
        selector['querySelector']('.rh-adv-panel')?.['classList']['remove']('show'),
        selector['querySelector']('.rh-adv-btn')?.['setAttribute']('aria-expanded', 'false'),
        source
          ? (floatingModelMenuPortal['open'](), activateMenuKeyboard(menu))
          : floatingModelMenuPortal['close']());
    },
    next = (event3) => {
      if (
        selector['contains'](event3['target']) ||
        floatingModelMenuPortal['contains'](event3['target']) ||
        floatingUiSchemaPopupPortal['contains'](event3['target'])
      )
        return;
      (floatingModelMenuPortal['close'](),
        handler(),
        selector['querySelector']('.rh-adv-panel')?.['classList']['remove']('show'),
        selector['querySelector']('.rh-adv-btn')?.['setAttribute']('aria-expanded', 'false'));
    },
    buildModelPatch = (current, entry, provider3, record = {}) => {
      const payload = String(current?.['model'] || '')['trim'](),
        model3 = String(entry || '')['trim'](),
        generationParamsByModel2 = getPlainObject(current?.['generationParamsByModel']);
      payload && (generationParamsByModel2[payload] = getPlainObject(current?.['generationParams']));
      const handle = model3 ? generationParamsByModel2[model3] : undefined,
        args2 = buildModelUiSchemaDefaultParams(model3),
        list = new Set(
          (getModelManifest(model3)?.['uiSchema']?.['fields'] || [])['map']((state) =>
            String(state?.['id'] || '')['trim'](),
          ),
        ),
        args3 = {};
      list['forEach']((config) => {
        Object['prototype']['hasOwnProperty']['call'](record, config) && (args3[config] = record[config]);
      });
      const generationParams2 = sanitizeModelUiSchemaParams(model3, {
          ...args2,
          ...getPlainObject(handle),
          ...getPlainObject(record['generationParams']),
          ...args3,
        }),
        { generationParams: generationParams3, ...args4 } = record;
      list['forEach']((scope) => delete args4[scope]);
      const args5 = buildModelProviderProfileSelectionPatch(current, model3, record?.['providerProfileId']);
      return {
        ...args4,
        ...args5,
        model: model3,
        provider: provider3,
        generationParams: generationParams2,
        generationParamsByModel: generationParamsByModel2,
      };
    },
    handler2 = () => {
      if (!showSchemaControls) return;
      (floatingUiSchemaPopupPortal['close'](),
        (uiSchemaVisibilitySignature = buildUiSchemaVisibilitySignature(model2, nodeData)));
      const renderStandaloneSchemaControls2 = renderStandaloneSchemaControls(
          model2,
          nodeData,
          excludeFieldIds,
        ),
        handler3 = (input, output) => {
          const el5 = selector['querySelector'](input);
          if (!el5) return;
          ((el5['innerHTML'] = output), (el5['style']['display'] = output ? '' : 'none'));
        };
      (handler3('.ui-schema-mode-slot', renderStandaloneSchemaControls2['mode']),
        handler3('.ui-schema-resolution-slot', renderStandaloneSchemaControls2['resolution']),
        handler3('.ui-schema-instance-slot', renderStandaloneSchemaControls2['instance']));
      const el6 = selector['querySelector']('.rh-adv-panel');
      if (el6) el6['innerHTML'] = renderStandaloneSchemaControls2['advanced'];
      const el7 = selector['querySelector']('.rh-adv-wrap');
      if (el7) el7['style']['display'] = renderStandaloneSchemaControls2['advanced'] ? '' : 'none';
      (!renderStandaloneSchemaControls2['advanced'] &&
        (el6?.['classList']['remove']('show'),
        selector['querySelector']('.rh-adv-btn')?.['setAttribute']('aria-expanded', 'false')),
        bindModelUiSchemaControls2?.(),
        (bindModelUiSchemaControls2 = bindModelUiSchemaControls(selector, {
          nodeId: nodeId,
          nodeData: nodeData,
          store: store,
        })));
    },
    store = {
      getState: () => ({ nodes: { [nodeId]: nodeData } }),
      updateNodeData: (value2, args6 = {}) => {
        ((nodeData = { ...nodeData, ...args6 }),
          (model2 = String(nodeData['model'] || model2)['trim']()),
          (provider2 = String(nodeData['provider'] || provider2)['trim']()),
          run());
        const uiSchemaVisibilitySignature2 = buildUiSchemaVisibilitySignature(model2, nodeData);
        (uiSchemaVisibilitySignature2 !== uiSchemaVisibilitySignature && handler2(),
          onChange?.({
            modelId: model2,
            provider: provider2,
            generationParams: getPlainObject(nodeData['generationParams']),
            generationParamsByModel: getPlainObject(nodeData['generationParamsByModel']),
            providerProfileId: String(nodeData['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(nodeData['providerProfileIdByModel']),
            patch: { ...args6 },
          }));
      },
    };
  bindImageModelMenuGroups({
    modelMenu: menu,
    modelTrigger: trigger,
    modelLabel: modelLabel,
    nodeId: nodeId,
    store: store,
    fallbackNodeData: nodeData,
    buildModelPatch: buildModelPatch,
    afterSelect: () => floatingModelMenuPortal['close'](),
  });
  const bindModelCredentialMenu2 = bindModelCredentialMenu(menu, {
    documentObject: documentObject,
    getProviderProfileId: () =>
      String(nodeData['providerProfileId'] || nodeData['rhProviderProfileId'] || '')['trim'](),
  });
  (selector['addEventListener']('pointerdown', options),
    menu?.['addEventListener']('pointerdown', options),
    trigger?.['addEventListener']('click', target));
  const el8 = selector['querySelector']('.rh-adv-btn'),
    el9 = selector['querySelector']('.rh-adv-panel'),
    value3 = (event4) => {
      (event4['stopPropagation'](), handler());
      const value4 = el9?.['classList']['toggle']('show') === !![];
      (el8?.['setAttribute']('aria-expanded', String(value4)), floatingModelMenuPortal['close']());
    },
    value5 = (preserveAdvPanel) => {
      (floatingModelMenuPortal['close'](),
        closeNodeFooterMenus(selector, null, {
          preserveAdvPanel: preserveAdvPanel?.['detail']?.['fieldEl'] || null,
        }),
        el8?.['setAttribute']('aria-expanded', String(el9?.['classList']['contains']('show') === !![])));
    };
  return (
    el8?.['addEventListener']('click', value3),
    el9?.['addEventListener']('click', options),
    selector['addEventListener']('ui-schema-menu-before-open', value5),
    documentObject['addEventListener']('click', next),
    handler2(),
    {
      closeMenus() {
        (floatingModelMenuPortal['close'](),
          handler(),
          el9?.['classList']['remove']('show'),
          el8?.['setAttribute']('aria-expanded', 'false'));
      },
      applyProviderProfilePatch(options2 = {}) {
        return (
          store['updateNodeData'](nodeId, {
            providerProfileId: String(options2['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(
              options2['providerProfileIdByModel'] || nodeData['providerProfileIdByModel'],
            ),
          }),
          void syncModelCredentialMenu(menu, {
            documentObject: documentObject,
            getProviderProfileId: () => String(nodeData['providerProfileId'] || '')['trim'](),
          }),
          !![]
        );
      },
      destroy() {
        (floatingUiSchemaPopupPortal['destroy'](),
          bindModelUiSchemaControls2?.(),
          bindModelCredentialMenu2?.(),
          floatingModelMenuPortal['destroy'](),
          selector['removeEventListener']('pointerdown', options),
          menu?.['removeEventListener']('pointerdown', options),
          trigger?.['removeEventListener']('click', target),
          el8?.['removeEventListener']('click', value3),
          el9?.['removeEventListener']('click', options),
          selector['removeEventListener']('ui-schema-menu-before-open', value5),
          documentObject['removeEventListener']('click', next));
      },
    }
  );
}
