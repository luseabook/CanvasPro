import { onLocaleChange, t } from '../../i18n/index.js';
import { activateMenuKeyboard } from '../../modules/floatingMenuKeyboard.js';
import {
  bindNodeFooterController,
  bindNodeModelMenuTrigger,
  closeNodeFooterMenus,
} from '../shared/nodeFooterControls.js';
import { escapeNodeMenuHtml } from '../shared/nodeModelMenu.js';
import {
  buildTextModelSmallIconHTML,
  buildTextProviderMenuGroupsHTML,
  findTextModelMenuItem,
} from './apimartTextModelMenu.js';
import { getCustomTextModels, saveCustomTextModels } from './customTextModels.js';
import { API_CONFIG_CHANGED_EVENT } from '../../../api/configApi.js';
import {
  buildModelProviderProfileSelectionPatch,
  getModelProviderProfileIds,
  getNextModelProviderProfileId,
  resolveModelProviderProfileId,
} from '../../modules/modelProviderProfileSelection.js';
import {
  getModelProviderProfileReadiness,
  getModelProviderProfileShortLabel,
  getModelProviderProfileStyleId,
  requestModelProviderProfileSelection,
  resolveConfiguredModelProviderProfileId,
} from '../shared/modelProviderProfileControl.js';
import { bindModelCredentialMenu, syncModelCredentialMenu } from '../../modules/modelCredentialUi.js';
export const DEFAULT_AIGEN_TEXT_MODEL_ID = 'apimart/kimi-k2-instruct';
const CARET_HTML =
    '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="node-menu-caret"><polyline points="6 9 12 15 18 9"></polyline></svg>',
  FALLBACK_ICON_HTML =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
function resolveModelLabel(value, item) {
  return item?.(value) || findTextModelMenuItem(value)?.['title'] || value || '选择模型';
}
function resolveTriggerIcon(key, index) {
  const textModelSmallIconHTML = buildTextModelSmallIconHTML(key);
  if (textModelSmallIconHTML) return textModelSmallIconHTML;
  if (['custom', 'openai']['includes'](String(index || '')['toLowerCase']()))
    return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
  return FALLBACK_ICON_HTML;
}
export function buildAIGenTextModelMenuMarkup({
  activeModel: activeModel = DEFAULT_AIGEN_TEXT_MODEL_ID,
  allowedModelIds: allowedModelIds,
} = {}) {
  const result = Array['isArray'](allowedModelIds),
    data = result
      ? ''
      : '<div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu" data-credential-provider="openai">\n          <div class="text-model-icon text-model-icon-badge">OA</div>\n          <div class="fmi-content">\n            <div class="fmi-title" data-aigen-text-locale="customModelTitle">' +
        t('aigenText.customModelTitle') +
        '</div>\n            <div class="fmi-sub" data-aigen-text-locale="customModelSubtitle">' +
        t('aigenText.customModelSubtitle') +
        '</div>\n          </div>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="custom-submenu node-model-submenu node-menu-submenu"></div>';
  return (
    data +
    '\n        ' +
    buildTextProviderMenuGroupsHTML(activeModel, { allowedModelIds: allowedModelIds })
  );
}
export function renderAIGenTextModelSelectorMarkup({
  modelId: modelId = DEFAULT_AIGEN_TEXT_MODEL_ID,
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  includeRunningHubInternational: includeRunningHubInternational = false,
  getDisplayModelName: getDisplayModelName,
  className: className = '',
  allowedModelIds: allowedModelIds2,
} = {}) {
  const model = String(modelId || DEFAULT_AIGEN_TEXT_MODEL_ID),
    modelProviderProfileId = resolveModelProviderProfileId({
      model: model,
      providerProfileId: providerProfileId,
    }),
    options = includeRunningHubInternational
      ? '<button type="button" class="model-provider-profile-selector-toggle' +
        (getModelProviderProfileIds(model)['length'] > 1 ? '' : ' is-hidden') +
        '" data-provider-profile-id="' +
        escapeNodeMenuHtml(getModelProviderProfileStyleId(modelProviderProfileId)) +
        '" data-provider-profile-value="' +
        escapeNodeMenuHtml(modelProviderProfileId) +
        '">' +
        escapeNodeMenuHtml(getModelProviderProfileShortLabel(modelProviderProfileId)) +
        '</button>'
      : '',
    target = ['img-model-pills', 'aigen-text-model-selector', className]['filter'](Boolean)['join'](' ');
  return (
    '<div class="' +
    escapeNodeMenuHtml(target) +
    '" data-aigen-text-model-selector>\n    <div class="img-model-wrap">\n      <button type="button" class="img-pill-btn img-model-btn-trigger">\n        ' +
    resolveTriggerIcon(model, provider) +
    '\n        <span class="img-model-label">' +
    escapeNodeMenuHtml(resolveModelLabel(model, getDisplayModelName)) +
    '</span>\n        ' +
    CARET_HTML +
    '\n      </button>\n      <div class="floating-menu img-model-menu node-model-menu">\n        ' +
    buildAIGenTextModelMenuMarkup({ activeModel: model, allowedModelIds: allowedModelIds2 }) +
    '\n      </div>\n    </div>\n    ' +
    options +
    '\n    <div class="ui-schema-placement ui-schema-mode-slot" data-aigen-text-ui-schema-mode-slot hidden></div>\n  </div>'
  );
}
function createCustomModelItem(el, source, next) {
  const item2 = el['createElement']('div');
  ((item2['className'] = 'floating-menu-item custom-model-item' + (next === source ? ' active' : '')),
    (item2['dataset']['value'] = source),
    (item2['dataset']['provider'] = 'custom'));
  const el2 = el['createElement']('div');
  ((el2['className'] = 'text-model-icon text-model-icon-badge custom-model-icon'),
    (el2['textContent'] = 'OA'));
  const el3 = el['createElement']('span');
  ((el3['className'] = 'custom-model-label'), (el3['textContent'] = source));
  const remove = el['createElement']('span');
  return (
    (remove['className'] = 'custom-model-del'),
    (remove['textContent'] = '×'),
    item2['addEventListener']('mouseenter', () => remove['classList']['add']('show')),
    item2['addEventListener']('mouseleave', () => remove['classList']['remove']('show')),
    item2['append'](el2, el3, remove),
    { item: item2, remove: remove }
  );
}
export function bindAIGenTextModelSelector(
  el4,
  {
    modelId: modelId = DEFAULT_AIGEN_TEXT_MODEL_ID,
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    providerProfileIdByModel: providerProfileIdByModel = {},
    getDisplayModelName: getDisplayModelName2,
    onChange: onChange,
    getProfileReadiness: getProfileReadiness = getModelProviderProfileReadiness,
    ensureProfileReady: ensureProfileReady,
    onProfileUnavailable: onProfileUnavailable,
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  const current =
      el4?.['matches']?.('[data-aigen-text-model-selector]') ||
      el4?.['dataset']?.['aigenTextModelSelector'] !== undefined,
    root = current ? el4 : el4?.['querySelector']?.('[data-aigen-text-model-selector]');
  if (!root || !documentObject) return { destroy() {} };
  const modelWrap = root['querySelector']('.img-model-wrap'),
    trigger = root['querySelector']('.img-model-btn-trigger'),
    menu = root['querySelector']('.img-model-menu'),
    el5 = root['querySelector']('.img-model-label'),
    el6 = root['querySelector']('.custom-submenu'),
    el7 = root['querySelector']('.model-provider-profile-selector-toggle');
  let model2 = String(modelId || DEFAULT_AIGEN_TEXT_MODEL_ID),
    provider2 = String(provider || findTextModelMenuItem(model2)?.['provider'] || ''),
    providerProfileIdByModel2 =
      providerProfileIdByModel && typeof providerProfileIdByModel === 'object'
        ? { ...providerProfileIdByModel }
        : {},
    providerProfileId2 = resolveModelProviderProfileId({
      model: model2,
      providerProfileId: providerProfileId,
    });
  const list = [],
    entry = (event) => event['stopPropagation']();
  (root['addEventListener']('pointerdown', entry),
    list['push'](() => root['removeEventListener']('pointerdown', entry)));
  const run = () => {
      if (el5) el5['textContent'] = resolveModelLabel(model2, getDisplayModelName2);
      const triggerIcon = resolveTriggerIcon(model2, provider2),
        el8 = documentObject['createElement']('template');
      el8['innerHTML'] = triggerIcon['trim']();
      const record = el8['content']?.['firstElementChild'],
        payload = trigger?.['firstElementChild'];
      if (payload && record) payload['replaceWith'](record);
    },
    handler = () => {
      if (!el7) return;
      const list2 = getModelProviderProfileIds(model2),
        enabled = list2['length'] > 1;
      el7['classList']['toggle']('is-hidden', !enabled);
      if (!enabled) return;
      const args = {
          model: model2,
          providerProfileId: providerProfileId2,
          providerProfileIdByModel: providerProfileIdByModel2,
        },
        modelProviderProfileId2 = resolveModelProviderProfileId(args),
        configuredModelProviderProfileId = resolveConfiguredModelProviderProfileId(args, getProfileReadiness);
      let handle = args;
      if (configuredModelProviderProfileId && configuredModelProviderProfileId !== modelProviderProfileId2) {
        const args2 = buildModelProviderProfileSelectionPatch(args, model2, configuredModelProviderProfileId);
        ((providerProfileId2 = args2['providerProfileId']),
          (providerProfileIdByModel2 = args2['providerProfileIdByModel'] || {}),
          (handle = { ...args, ...args2 }));
      }
      const nextModelProviderProfileId = getNextModelProviderProfileId(handle),
        modelProviderProfileShortLabel = getModelProviderProfileShortLabel(configuredModelProviderProfileId),
        modelProviderProfileShortLabel2 = getModelProviderProfileShortLabel(nextModelProviderProfileId);
      ((el7['textContent'] = modelProviderProfileShortLabel),
        (el7['dataset']['providerProfileId'] = getModelProviderProfileStyleId(
          configuredModelProviderProfileId,
        )),
        (el7['dataset']['providerProfileValue'] = configuredModelProviderProfileId),
        (el7['title'] =
          '当前' + modelProviderProfileShortLabel + '线路，点击切换到' + modelProviderProfileShortLabel2),
        el7['setAttribute'](
          'aria-label',
          '当前' + modelProviderProfileShortLabel + '线路，点击切换到' + modelProviderProfileShortLabel2,
        ));
    },
    handler2 = (state, config, scope) => {
      const enabled2 = String(state || '')['trim']();
      if (!enabled2) return;
      const modelProviderProfileSelectionPatch = buildModelProviderProfileSelectionPatch(
        {
          model: model2,
          providerProfileId: providerProfileId2,
          providerProfileIdByModel: providerProfileIdByModel2,
        },
        enabled2,
        scope,
      );
      ((model2 = enabled2),
        (provider2 = String(config || findTextModelMenuItem(enabled2)?.['provider'] || '')['trim']()),
        (providerProfileId2 = modelProviderProfileSelectionPatch['providerProfileId']),
        (providerProfileIdByModel2 = modelProviderProfileSelectionPatch['providerProfileIdByModel'] || {}),
        menu?.['querySelectorAll']('.floating-menu-item[data-value]')['forEach']((el9) => {
          el9['classList']['toggle']('active', el9['dataset']['value'] === model2);
        }),
        menu?.['classList']['remove']('show'),
        run(),
        handler(),
        onChange?.({
          modelId: model2,
          provider: provider2,
          providerProfileId: providerProfileId2,
          providerProfileIdByModel: providerProfileIdByModel2,
        }));
    },
    handler3 = () => {
      if (!el6) return;
      el6['replaceChildren']();
      const list3 = getCustomTextModels();
      list3['forEach']((input, output) => {
        const { item: item3, remove: remove2 } = createCustomModelItem(documentObject, input, model2);
        (remove2['addEventListener']('click', (event2) => {
          (event2['preventDefault'](),
            event2['stopPropagation'](),
            saveCustomTextModels(list3['filter']((value2, value3) => value3 !== output)),
            handler3());
        }),
          el6['appendChild'](item3));
      });
      if (list3['length']) {
        const value4 = documentObject['createElement']('div');
        ((value4['className'] = 'custom-model-separator'), el6['appendChild'](value4));
      }
      const el10 = documentObject['createElement']('div');
      ((el10['className'] = 'floating-menu-item custom-model-add'),
        (el10['innerHTML'] =
          '<svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span class="custom-model-add-label">' +
          t('aigenText.customModel.addModel') +
          '</span>'),
        el10['addEventListener']('click', (event3) => {
          (event3['preventDefault'](),
            event3['stopPropagation'](),
            el10['replaceChildren'](),
            el10['classList']['add']('editing'));
          const el11 = documentObject['createElement']('input');
          ((el11['type'] = 'text'),
            (el11['className'] = 'custom-model-input'),
            (el11['placeholder'] = t('aigenText.customModel.namePlaceholder')));
          const el12 = documentObject['createElement']('button');
          ((el12['type'] = 'button'),
            (el12['className'] = 'custom-model-confirm'),
            (el12['textContent'] = t('aigenText.customModel.confirm')));
          const run2 = () => {
            const enabled3 = el11['value']['trim']();
            if (!enabled3) return;
            const list4 = getCustomTextModels();
            if (!list4['includes'](enabled3)) saveCustomTextModels([...list4, enabled3]);
            handler3();
          };
          (el11['addEventListener']('keydown', (event4) => {
            event4['stopPropagation']();
            if (event4['key'] === 'Enter') run2();
          }),
            el11['addEventListener']('click', (event5) => event5['stopPropagation']()),
            el12['addEventListener']('click', (event6) => {
              (event6['stopPropagation'](), run2());
            }),
            el10['append'](el11, el12),
            el11['focus']());
        }),
        el6['appendChild'](el10));
    },
    value5 = (event7) => {
      const el13 = event7['target']?.['closest']?.('.floating-menu-item[data-value]');
      if (!el13 || !menu?.['contains'](el13) || el13['dataset']['disabled'] === 'true') return;
      (event7['stopPropagation'](),
        handler2(
          el13['dataset']['value'],
          el13['dataset']['provider'],
          el13['dataset']['credentialResolvedProviderProfileId'],
        ));
    };
  (menu?.['addEventListener']('click', value5),
    list['push'](() => menu?.['removeEventListener']('click', value5)));
  const value6 = (event8) => {
    (event8['preventDefault'](), event8['stopPropagation']());
    const nodeData = {
        model: model2,
        providerProfileId: providerProfileId2,
        providerProfileIdByModel: providerProfileIdByModel2,
      },
      targetProfileId = getNextModelProviderProfileId(nodeData);
    if (!targetProfileId) return;
    void requestModelProviderProfileSelection({
      nodeData: nodeData,
      targetProfileId: targetProfileId,
      getProfileReadiness: getProfileReadiness,
      ensureProfileReady: ensureProfileReady,
      onUnavailable: onProfileUnavailable,
      onChange: (value7) => {
        ((providerProfileId2 = value7['providerProfileId']),
          (providerProfileIdByModel2 = value7['providerProfileIdByModel'] || {}),
          handler(),
          void syncModelCredentialMenu(menu, {
            documentObject: documentObject,
            getProviderProfileId: () => providerProfileId2,
          }),
          onChange?.({
            modelId: model2,
            provider: provider2,
            providerProfileId: providerProfileId2,
            providerProfileIdByModel: providerProfileIdByModel2,
          }));
      },
    });
  };
  (el7?.['addEventListener']('click', value6),
    list['push'](() => el7?.['removeEventListener']('click', value6)),
    list['push'](bindNodeFooterController(root)),
    list['push'](
      bindNodeModelMenuTrigger({
        root: root,
        trigger: trigger,
        menu: menu,
        closeOthers: () => closeNodeFooterMenus(root, menu),
        activateMenuKeyboard: activateMenuKeyboard,
      }),
    ));
  const onLocaleChange2 = onLocaleChange(() => {
    (root['querySelector']('[data-aigen-text-locale="customModelTitle"]')?.['replaceChildren'](
      documentObject['createTextNode'](t('aigenText.customModelTitle')),
    ),
      root['querySelector']('[data-aigen-text-locale="customModelSubtitle"]')?.['replaceChildren'](
        documentObject['createTextNode'](t('aigenText.customModelSubtitle')),
      ),
      handler3(),
      run());
  });
  list['push'](onLocaleChange2);
  const value8 = () => {
    handler();
  };
  (globalThis['window']?.['addEventListener']?.(API_CONFIG_CHANGED_EVENT, value8),
    list['push'](() => globalThis['window']?.['removeEventListener']?.(API_CONFIG_CHANGED_EVENT, value8)),
    handler3(),
    run(),
    handler());
  const bindModelCredentialMenu2 = bindModelCredentialMenu(menu, {
    documentObject: documentObject,
    getProviderProfileId: () => providerProfileId2,
  });
  return {
    modelWrap: modelWrap,
    trigger: trigger,
    menu: menu,
    getSelection: () => ({
      modelId: model2,
      provider: provider2,
      providerProfileId: providerProfileId2,
      providerProfileIdByModel: providerProfileIdByModel2,
    }),
    setSelection: ({
      modelId: modelId2,
      provider: provider3,
      providerProfileId: providerProfileId3,
      providerProfileIdByModel: providerProfileIdByModel3,
    } = {}) => {
      const model3 = model2;
      ((model2 = String(modelId2 || model2)),
        (provider2 = String(provider3 || findTextModelMenuItem(model2)?.['provider'] || provider2)));
      const modelProviderProfileSelectionPatch2 = buildModelProviderProfileSelectionPatch(
        {
          model: model3,
          providerProfileId: providerProfileId2,
          providerProfileIdByModel: providerProfileIdByModel3 || providerProfileIdByModel2,
        },
        model2,
        providerProfileId3,
      );
      ((providerProfileId2 = modelProviderProfileSelectionPatch2['providerProfileId']),
        (providerProfileIdByModel2 = modelProviderProfileSelectionPatch2['providerProfileIdByModel'] || {}),
        handler3(),
        run(),
        handler());
    },
    destroy() {
      (bindModelCredentialMenu2?.(), list['forEach']((value9) => value9?.()));
    },
  };
}
