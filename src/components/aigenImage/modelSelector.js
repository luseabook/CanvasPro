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
function escapeHtml(_0xfb33a9) {
  return String(_0xfb33a9 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function getPlainObject(_0x6ecb11) {
  return _0x6ecb11 && typeof _0x6ecb11 === 'object' && !Array['isArray'](_0x6ecb11) ? { ..._0x6ecb11 } : {};
}
function renderStandaloneSchemaControls(_0x5bb340, _0x85a6a9 = {}, _0x66b1a2 = []) {
  const _0x252283 = renderModelUiSchemaControls(_0x5bb340, _0x85a6a9, {
      placement: 'mode',
      variant: 'pillMenu',
      excludeFieldIds: _0x66b1a2,
    }),
    _0x5e52cf = renderModelUiSchemaControls(_0x5bb340, _0x85a6a9, {
      placement: 'resolution',
      variant: 'resolutionPill',
      excludeFieldIds: _0x66b1a2,
    }),
    _0x52d72d = renderModelUiSchemaControls(_0x5bb340, _0x85a6a9, {
      placement: 'advanced',
      variant: 'advancedRow',
      excludeFieldIds: _0x66b1a2,
    }),
    _0x691619 = renderModelUiSchemaControls(_0x5bb340, _0x85a6a9, {
      placement: 'instance',
      variant: 'instanceToggle',
      excludeFieldIds: _0x66b1a2,
    });
  return { mode: _0x252283, resolution: _0x5e52cf, advanced: _0x52d72d, instance: _0x691619 };
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
  const _0x2243f7 = String(modelId || '')['trim'](),
    _0x490d92 = {
      model: _0x2243f7,
      provider: provider,
      generationParams: getPlainObject(generationParams),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    _0x21b6d8 = showSchemaControls
      ? renderStandaloneSchemaControls(_0x2243f7, _0x490d92, excludeFieldIds)
      : { mode: '', resolution: '', advanced: '', instance: '' },
    _0x276814 = escapeHtml(t('aigenImage.controls.advancedSettings'));
  return (
    '<div class="img-model-pills aigen-image-model-selector ' +
    escapeHtml(className) +
    '" data-aigen-image-model-selector>\n    <div class="img-model-wrap">\n      <button type="button" class="img-pill-btn img-model-btn-trigger" aria-expanded="false">\n        ' +
    renderImageModelTriggerIconHTML({ model: _0x2243f7, provider: provider }) +
    '\n        <span class="img-model-label">' +
    escapeHtml(getDisplayModelName(_0x2243f7)) +
    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    (showCaret
      ? '<svg class="image-model-selector-caret" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
      : '') +
    '\n      </button>\n      ' +
    (Array['isArray'](modelMenuGroups)
      ? renderNodeModelMenu({ groups: modelMenuGroups, activeModel: _0x2243f7, kind: 'image' })
      : buildImageModelMenuHTML({
          activeModel: _0x2243f7,
          excludeRunningHubWorkflowModels: excludeRunningHubWorkflowModels,
          runningHubWorkflowModelIds: runningHubWorkflowModelIds,
          allowedWorkflowModelIds: allowedWorkflowModelIds,
        })) +
    '\n    </div>\n    ' +
    (showSchemaControls
      ? '<div class="ui-schema-placement ui-schema-mode-slot" style="' +
        (_0x21b6d8['mode'] ? '' : 'display:none;') +
        '\x22>' +
        _0x21b6d8['mode'] +
        '</div>\n    <div class="ui-schema-placement ui-schema-resolution-slot" style="' +
        (_0x21b6d8['resolution'] ? '' : 'display:none;') +
        '\x22>' +
        _0x21b6d8['resolution'] +
        '</div>\x0a\x20\x20\x20\x20<div\x20class=\x22rh-adv-wrap\x22\x20style=\x22position:relative;' +
        (_0x21b6d8['advanced'] ? '' : 'display:none;') +
        '">\n      <button type="button" class="img-pill-btn rh-adv-btn advanced-settings-icon-button" data-tooltip="' +
        _0x276814 +
        '\x22\x20aria-label=\x22' +
        _0x276814 +
        '" aria-expanded="false">' +
        ADVANCED_SETTINGS_TUNE_ICON_MARKUP +
        '</button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20ui-schema-instance-slot\x22\x20style=\x22' +
        (_0x21b6d8['instance'] ? '' : 'display:none;') +
        '\x22>' +
        _0x21b6d8['instance'] +
        '</div>\n    <div class="rh-adv-panel">' +
        _0x21b6d8['advanced'] +
        '</div>'
      : '') +
    '\n  </div>'
  );
}
export function bindAIGenImageModelSelector(
  _0x330a1a,
  {
    modelId: modelId = '',
    provider: provider = '',
    generationParams: generationParams = {},
    generationParamsByModel: generationParamsByModel = {},
    providerProfileId: providerProfileId = '',
    providerProfileIdByModel: providerProfileIdByModel = {},
    showSchemaControls: showSchemaControls = ![],
    onChange: _0x6c7e2a,
    documentObject: documentObject = globalThis['document'],
    windowObject: windowObject = globalThis['window'],
    floatingMenuHost: floatingMenuHost = null,
    modelSubmenuPlacement: modelSubmenuPlacement = 'viewport-auto',
    schemaPopupPlacement: schemaPopupPlacement = 'inline',
    excludeFieldIds: excludeFieldIds = [],
  } = {},
) {
  const _0x1423d9 = _0x330a1a?.['matches']?.('[data-aigen-image-model-selector]')
    ? _0x330a1a
    : _0x330a1a?.['querySelector']?.('[data-aigen-image-model-selector]');
  if (!_0x1423d9 || !documentObject) return { destroy() {} };
  const _0x25bfad = _0x1423d9['querySelector']('.img-model-btn-trigger'),
    _0x5172e7 = _0x1423d9['querySelector']('.img-model-label'),
    _0x2987c7 = _0x1423d9['querySelector']('.img-model-menu'),
    _0xb0f8e6 = createFloatingModelMenuPortal({
      menu: _0x2987c7,
      trigger: _0x25bfad,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      portalClass: 'aigen-image-model-menu-portal',
      submenuPlacement: modelSubmenuPlacement,
    }),
    _0x353e94 = createFloatingUiSchemaPopupPortal({
      selector: _0x1423d9,
      host: floatingMenuHost,
      documentObject: documentObject,
      windowObject: windowObject,
      placement: schemaPopupPlacement,
      contextClass: 'aigen-image-menu-context',
    });
  let _0x2c9c79 = String(modelId || '')['trim'](),
    _0x3def92 = String(provider || '')['trim']();
  const _0x112cac = 'standalone-image-model-selector';
  let _0x3a6474 = {
      model: _0x2c9c79,
      provider: _0x3def92,
      generationParams: getPlainObject(generationParams),
      generationParamsByModel: getPlainObject(generationParamsByModel),
      providerProfileId: String(providerProfileId || '')['trim'](),
      providerProfileIdByModel: getPlainObject(providerProfileIdByModel),
    },
    _0xba182a = null,
    _0x522fef = '';
  const _0x1733a5 = () => {
      if (_0x5172e7) _0x5172e7['textContent'] = getDisplayModelName(_0x2c9c79);
      const _0x1e7029 = documentObject['createElement']('template');
      _0x1e7029['innerHTML'] = renderImageModelTriggerIconHTML({ model: _0x2c9c79, provider: _0x3def92 })[
        'trim'
      ]();
      const _0x42a5ab = _0x1e7029['content']['firstElementChild'];
      if (_0x42a5ab && _0x25bfad?.['firstElementChild'])
        _0x25bfad['firstElementChild']['replaceWith'](_0x42a5ab);
    },
    _0x3690aa = (_0x337373) => _0x337373['stopPropagation'](),
    _0x325f55 = () => {
      (_0x353e94['close'](),
        _0x1423d9['querySelectorAll']('.ui-schema-floating-menu')['forEach']((_0x2265ce) =>
          _0x2265ce['classList']['remove']('show'),
        ),
        _0x1423d9['querySelectorAll']('.ui-schema-popup')['forEach']((_0x558a3b) => {
          _0x558a3b['style']['display'] = 'none';
        }));
    },
    _0x289386 = (_0x1211dd) => {
      _0x1211dd['stopPropagation']();
      const _0x344c29 = !_0xb0f8e6['isOpen']();
      (_0x325f55(),
        _0x1423d9['querySelector']('.rh-adv-panel')?.['classList']['remove']('show'),
        _0x1423d9['querySelector']('.rh-adv-btn')?.['setAttribute']('aria-expanded', 'false'),
        _0x344c29 ? (_0xb0f8e6['open'](), activateMenuKeyboard(_0x2987c7)) : _0xb0f8e6['close']());
    },
    _0x4111cd = (_0x422ec8) => {
      if (
        _0x1423d9['contains'](_0x422ec8['target']) ||
        _0xb0f8e6['contains'](_0x422ec8['target']) ||
        _0x353e94['contains'](_0x422ec8['target'])
      )
        return;
      (_0xb0f8e6['close'](),
        _0x325f55(),
        _0x1423d9['querySelector']('.rh-adv-panel')?.['classList']['remove']('show'),
        _0x1423d9['querySelector']('.rh-adv-btn')?.['setAttribute']('aria-expanded', 'false'));
    },
    _0xed4784 = (_0x3f5192, _0x3afef3, _0x24aaf9, _0x53ccc3 = {}) => {
      const _0x4cbf1f = String(_0x3f5192?.['model'] || '')['trim'](),
        _0xf8578c = String(_0x3afef3 || '')['trim'](),
        _0x4f6887 = getPlainObject(_0x3f5192?.['generationParamsByModel']);
      _0x4cbf1f && (_0x4f6887[_0x4cbf1f] = getPlainObject(_0x3f5192?.['generationParams']));
      const _0x1ec40f = _0xf8578c ? _0x4f6887[_0xf8578c] : undefined,
        _0x6cd43 = buildModelUiSchemaDefaultParams(_0xf8578c),
        _0x5a1698 = new Set(
          (getModelManifest(_0xf8578c)?.['uiSchema']?.['fields'] || [])['map']((_0x4994d9) =>
            String(_0x4994d9?.['id'] || '')['trim'](),
          ),
        ),
        _0x48ee67 = {};
      _0x5a1698['forEach']((_0x29d5ff) => {
        Object['prototype']['hasOwnProperty']['call'](_0x53ccc3, _0x29d5ff) &&
          (_0x48ee67[_0x29d5ff] = _0x53ccc3[_0x29d5ff]);
      });
      const _0x441183 = sanitizeModelUiSchemaParams(_0xf8578c, {
          ..._0x6cd43,
          ...getPlainObject(_0x1ec40f),
          ...getPlainObject(_0x53ccc3['generationParams']),
          ..._0x48ee67,
        }),
        { generationParams: _0x51eacd, ..._0x313821 } = _0x53ccc3;
      _0x5a1698['forEach']((_0x9a7f58) => delete _0x313821[_0x9a7f58]);
      const _0x3d6b3c = buildModelProviderProfileSelectionPatch(
        _0x3f5192,
        _0xf8578c,
        _0x53ccc3?.['providerProfileId'],
      );
      return {
        ..._0x313821,
        ..._0x3d6b3c,
        model: _0xf8578c,
        provider: _0x24aaf9,
        generationParams: _0x441183,
        generationParamsByModel: _0x4f6887,
      };
    },
    _0x4d76d9 = () => {
      if (!showSchemaControls) return;
      (_0x353e94['close'](), (_0x522fef = buildUiSchemaVisibilitySignature(_0x2c9c79, _0x3a6474)));
      const _0x3dc642 = renderStandaloneSchemaControls(_0x2c9c79, _0x3a6474, excludeFieldIds),
        _0x11e9fc = (_0x5045f0, _0x3d4c19) => {
          const _0x50f298 = _0x1423d9['querySelector'](_0x5045f0);
          if (!_0x50f298) return;
          ((_0x50f298['innerHTML'] = _0x3d4c19), (_0x50f298['style']['display'] = _0x3d4c19 ? '' : 'none'));
        };
      (_0x11e9fc('.ui-schema-mode-slot', _0x3dc642['mode']),
        _0x11e9fc('.ui-schema-resolution-slot', _0x3dc642['resolution']),
        _0x11e9fc('.ui-schema-instance-slot', _0x3dc642['instance']));
      const _0x588624 = _0x1423d9['querySelector']('.rh-adv-panel');
      if (_0x588624) _0x588624['innerHTML'] = _0x3dc642['advanced'];
      const _0x28c4f8 = _0x1423d9['querySelector']('.rh-adv-wrap');
      if (_0x28c4f8) _0x28c4f8['style']['display'] = _0x3dc642['advanced'] ? '' : 'none';
      (!_0x3dc642['advanced'] &&
        (_0x588624?.['classList']['remove']('show'),
        _0x1423d9['querySelector']('.rh-adv-btn')?.['setAttribute']('aria-expanded', 'false')),
        _0xba182a?.(),
        (_0xba182a = bindModelUiSchemaControls(_0x1423d9, {
          nodeId: _0x112cac,
          nodeData: _0x3a6474,
          store: _0x22bb66,
        })));
    },
    _0x22bb66 = {
      getState: () => ({ nodes: { [_0x112cac]: _0x3a6474 } }),
      updateNodeData: (_0x15b0ec, _0x324f5c = {}) => {
        ((_0x3a6474 = { ..._0x3a6474, ..._0x324f5c }),
          (_0x2c9c79 = String(_0x3a6474['model'] || _0x2c9c79)['trim']()),
          (_0x3def92 = String(_0x3a6474['provider'] || _0x3def92)['trim']()),
          _0x1733a5());
        const _0x215c01 = buildUiSchemaVisibilitySignature(_0x2c9c79, _0x3a6474);
        (_0x215c01 !== _0x522fef && _0x4d76d9(),
          _0x6c7e2a?.({
            modelId: _0x2c9c79,
            provider: _0x3def92,
            generationParams: getPlainObject(_0x3a6474['generationParams']),
            generationParamsByModel: getPlainObject(_0x3a6474['generationParamsByModel']),
            providerProfileId: String(_0x3a6474['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(_0x3a6474['providerProfileIdByModel']),
            patch: { ..._0x324f5c },
          }));
      },
    };
  bindImageModelMenuGroups({
    modelMenu: _0x2987c7,
    modelTrigger: _0x25bfad,
    modelLabel: _0x5172e7,
    nodeId: _0x112cac,
    store: _0x22bb66,
    fallbackNodeData: _0x3a6474,
    buildModelPatch: _0xed4784,
    afterSelect: () => _0xb0f8e6['close'](),
  });
  const _0x2d5408 = bindModelCredentialMenu(_0x2987c7, {
    documentObject: documentObject,
    getProviderProfileId: () =>
      String(_0x3a6474['providerProfileId'] || _0x3a6474['rhProviderProfileId'] || '')['trim'](),
  });
  (_0x1423d9['addEventListener']('pointerdown', _0x3690aa),
    _0x2987c7?.['addEventListener']('pointerdown', _0x3690aa),
    _0x25bfad?.['addEventListener']('click', _0x289386));
  const _0x7f76a9 = _0x1423d9['querySelector']('.rh-adv-btn'),
    _0x31f42e = _0x1423d9['querySelector']('.rh-adv-panel'),
    _0x19dc79 = (_0x41b13d) => {
      (_0x41b13d['stopPropagation'](), _0x325f55());
      const _0x52e41c = _0x31f42e?.['classList']['toggle']('show') === !![];
      (_0x7f76a9?.['setAttribute']('aria-expanded', String(_0x52e41c)), _0xb0f8e6['close']());
    },
    _0x5db2b1 = (_0x5e82b6) => {
      (_0xb0f8e6['close'](),
        closeNodeFooterMenus(_0x1423d9, null, {
          preserveAdvPanel: _0x5e82b6?.['detail']?.['fieldEl'] || null,
        }),
        _0x7f76a9?.['setAttribute'](
          'aria-expanded',
          String(_0x31f42e?.['classList']['contains']('show') === !![]),
        ));
    };
  return (
    _0x7f76a9?.['addEventListener']('click', _0x19dc79),
    _0x31f42e?.['addEventListener']('click', _0x3690aa),
    _0x1423d9['addEventListener']('ui-schema-menu-before-open', _0x5db2b1),
    documentObject['addEventListener']('click', _0x4111cd),
    _0x4d76d9(),
    {
      closeMenus() {
        (_0xb0f8e6['close'](),
          _0x325f55(),
          _0x31f42e?.['classList']['remove']('show'),
          _0x7f76a9?.['setAttribute']('aria-expanded', 'false'));
      },
      applyProviderProfilePatch(_0x3d398a = {}) {
        return (
          _0x22bb66['updateNodeData'](_0x112cac, {
            providerProfileId: String(_0x3d398a['providerProfileId'] || '')['trim'](),
            providerProfileIdByModel: getPlainObject(
              _0x3d398a['providerProfileIdByModel'] || _0x3a6474['providerProfileIdByModel'],
            ),
          }),
          void syncModelCredentialMenu(_0x2987c7, {
            documentObject: documentObject,
            getProviderProfileId: () => String(_0x3a6474['providerProfileId'] || '')['trim'](),
          }),
          !![]
        );
      },
      destroy() {
        (_0x353e94['destroy'](),
          _0xba182a?.(),
          _0x2d5408?.(),
          _0xb0f8e6['destroy'](),
          _0x1423d9['removeEventListener']('pointerdown', _0x3690aa),
          _0x2987c7?.['removeEventListener']('pointerdown', _0x3690aa),
          _0x25bfad?.['removeEventListener']('click', _0x289386),
          _0x7f76a9?.['removeEventListener']('click', _0x19dc79),
          _0x31f42e?.['removeEventListener']('click', _0x3690aa),
          _0x1423d9['removeEventListener']('ui-schema-menu-before-open', _0x5db2b1),
          documentObject['removeEventListener']('click', _0x4111cd));
      },
    }
  );
}
