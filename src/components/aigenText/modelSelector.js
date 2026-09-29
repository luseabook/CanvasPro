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
    '<svg\x20width=\x2212\x22\x20height=\x2212\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><polygon\x20points=\x2213\x202\x203\x2014\x2012\x2014\x2011\x2022\x2021\x2010\x2012\x2010\x2013\x202\x22/></svg>';
function resolveModelLabel(_0x406f4f, _0x4724d4) {
  return _0x4724d4?.(_0x406f4f) || findTextModelMenuItem(_0x406f4f)?.['title'] || _0x406f4f || '选择模型';
}
function resolveTriggerIcon(_0xdcfa4f, _0x1fb0fa) {
  const _0x1d22f4 = buildTextModelSmallIconHTML(_0xdcfa4f);
  if (_0x1d22f4) return _0x1d22f4;
  if (['custom', 'openai']['includes'](String(_0x1fb0fa || '')['toLowerCase']()))
    return '<div class="text-model-icon-small text-model-icon-badge">OA</div>';
  return FALLBACK_ICON_HTML;
}
export function buildAIGenTextModelMenuMarkup({
  activeModel: activeModel = DEFAULT_AIGEN_TEXT_MODEL_ID,
  allowedModelIds: _0x44ccd2,
} = {}) {
  const _0x44484a = Array['isArray'](_0x44ccd2),
    _0x1ee28b = _0x44484a
      ? ''
      : '<div class="custom-group-header floating-menu-item node-menu-group-header" data-custom-toggle data-node-menu-submenu=".custom-submenu" data-credential-provider="openai">\n          <div class="text-model-icon text-model-icon-badge">OA</div>\n          <div class="fmi-content">\n            <div class="fmi-title" data-aigen-text-locale="customModelTitle">' +
        t('aigenText.customModelTitle') +
        '</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22fmi-sub\x22\x20data-aigen-text-locale=\x22customModelSubtitle\x22>' +
        t('aigenText.customModelSubtitle') +
        '</div>\n          </div>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="node-menu-caret"><polyline points="9 18 15 12 9 6"></polyline></svg>\n        </div>\n        <div class="custom-submenu node-model-submenu node-menu-submenu"></div>';
  return (
    _0x1ee28b +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    buildTextProviderMenuGroupsHTML(activeModel, { allowedModelIds: _0x44ccd2 })
  );
}
export function renderAIGenTextModelSelectorMarkup({
  modelId: modelId = DEFAULT_AIGEN_TEXT_MODEL_ID,
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  includeRunningHubInternational: includeRunningHubInternational = ![],
  getDisplayModelName: _0x1eb56e,
  className: className = '',
  allowedModelIds: _0x2742ab,
} = {}) {
  const _0x2f6ba8 = String(modelId || DEFAULT_AIGEN_TEXT_MODEL_ID),
    _0x4a1e92 = resolveModelProviderProfileId({ model: _0x2f6ba8, providerProfileId: providerProfileId }),
    _0x5abde1 = includeRunningHubInternational
      ? '<button type="button" class="model-provider-profile-selector-toggle' +
        (getModelProviderProfileIds(_0x2f6ba8)['length'] > 0x1 ? '' : ' is-hidden') +
        '\x22\x20data-provider-profile-id=\x22' +
        escapeNodeMenuHtml(getModelProviderProfileStyleId(_0x4a1e92)) +
        '" data-provider-profile-value="' +
        escapeNodeMenuHtml(_0x4a1e92) +
        '\x22>' +
        escapeNodeMenuHtml(getModelProviderProfileShortLabel(_0x4a1e92)) +
        '</button>'
      : '',
    _0x2ea3b6 = ['img-model-pills', 'aigen-text-model-selector', className]
      ['filter'](Boolean)
      ['join']('\x20');
  return (
    '<div\x20class=\x22' +
    escapeNodeMenuHtml(_0x2ea3b6) +
    '" data-aigen-text-model-selector>\n    <div class="img-model-wrap">\n      <button type="button" class="img-pill-btn img-model-btn-trigger">\n        ' +
    resolveTriggerIcon(_0x2f6ba8, provider) +
    '\n        <span class="img-model-label">' +
    escapeNodeMenuHtml(resolveModelLabel(_0x2f6ba8, _0x1eb56e)) +
    '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
    CARET_HTML +
    '\n      </button>\n      <div class="floating-menu img-model-menu node-model-menu">\n        ' +
    buildAIGenTextModelMenuMarkup({ activeModel: _0x2f6ba8, allowedModelIds: _0x2742ab }) +
    '\n      </div>\n    </div>\n    ' +
    _0x5abde1 +
    '\x0a\x20\x20\x20\x20<div\x20class=\x22ui-schema-placement\x20ui-schema-mode-slot\x22\x20data-aigen-text-ui-schema-mode-slot\x20hidden></div>\x0a\x20\x20</div>'
  );
}
function createCustomModelItem(_0x1d6494, _0x827f14, _0x946960) {
  const _0x5e3ded = _0x1d6494['createElement']('div');
  ((_0x5e3ded['className'] =
    'floating-menu-item\x20custom-model-item' + (_0x946960 === _0x827f14 ? ' active' : '')),
    (_0x5e3ded['dataset']['value'] = _0x827f14),
    (_0x5e3ded['dataset']['provider'] = 'custom'));
  const _0x31ab84 = _0x1d6494['createElement']('div');
  ((_0x31ab84['className'] = 'text-model-icon text-model-icon-badge custom-model-icon'),
    (_0x31ab84['textContent'] = 'OA'));
  const _0x3ec11c = _0x1d6494['createElement']('span');
  ((_0x3ec11c['className'] = 'custom-model-label'), (_0x3ec11c['textContent'] = _0x827f14));
  const _0x52e3d3 = _0x1d6494['createElement']('span');
  return (
    (_0x52e3d3['className'] = 'custom-model-del'),
    (_0x52e3d3['textContent'] = '×'),
    _0x5e3ded['addEventListener']('mouseenter', () => _0x52e3d3['classList']['add']('show')),
    _0x5e3ded['addEventListener']('mouseleave', () => _0x52e3d3['classList']['remove']('show')),
    _0x5e3ded['append'](_0x31ab84, _0x3ec11c, _0x52e3d3),
    { item: _0x5e3ded, remove: _0x52e3d3 }
  );
}
export function bindAIGenTextModelSelector(
  _0x4c862e,
  {
    modelId: modelId = DEFAULT_AIGEN_TEXT_MODEL_ID,
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    providerProfileIdByModel: _0x5416a8 = {},
    getDisplayModelName: _0x2b50e9,
    onChange: _0x47b0fc,
    getProfileReadiness: getProfileReadiness = getModelProviderProfileReadiness,
    ensureProfileReady: _0x3bc313,
    onProfileUnavailable: _0xff46d2,
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  const _0x122a0d =
      _0x4c862e?.['matches']?.('[data-aigen-text-model-selector]') ||
      _0x4c862e?.['dataset']?.['aigenTextModelSelector'] !== undefined,
    _0x1ca3b1 = _0x122a0d ? _0x4c862e : _0x4c862e?.['querySelector']?.('[data-aigen-text-model-selector]');
  if (!_0x1ca3b1 || !documentObject) return { destroy() {} };
  const _0x13663e = _0x1ca3b1['querySelector']('.img-model-wrap'),
    _0x8a92db = _0x1ca3b1['querySelector']('.img-model-btn-trigger'),
    _0x3974fc = _0x1ca3b1['querySelector']('.img-model-menu'),
    _0x4db79e = _0x1ca3b1['querySelector']('.img-model-label'),
    _0x4ace00 = _0x1ca3b1['querySelector']('.custom-submenu'),
    _0x28d475 = _0x1ca3b1['querySelector']('.model-provider-profile-selector-toggle');
  let _0x2c4415 = String(modelId || DEFAULT_AIGEN_TEXT_MODEL_ID),
    _0x197af9 = String(provider || findTextModelMenuItem(_0x2c4415)?.['provider'] || ''),
    _0x255a30 = _0x5416a8 && typeof _0x5416a8 === 'object' ? { ..._0x5416a8 } : {},
    _0x16d2ee = resolveModelProviderProfileId({ model: _0x2c4415, providerProfileId: providerProfileId });
  const _0x333f8c = [],
    _0x1a3dcf = (_0x6a0e6c) => _0x6a0e6c['stopPropagation']();
  (_0x1ca3b1['addEventListener']('pointerdown', _0x1a3dcf),
    _0x333f8c['push'](() => _0x1ca3b1['removeEventListener']('pointerdown', _0x1a3dcf)));
  const _0x466fce = () => {
      if (_0x4db79e) _0x4db79e['textContent'] = resolveModelLabel(_0x2c4415, _0x2b50e9);
      const _0x28cdb7 = resolveTriggerIcon(_0x2c4415, _0x197af9),
        _0x17b906 = documentObject['createElement']('template');
      _0x17b906['innerHTML'] = _0x28cdb7['trim']();
      const _0x4626e2 = _0x17b906['content']?.['firstElementChild'],
        _0x110880 = _0x8a92db?.['firstElementChild'];
      if (_0x110880 && _0x4626e2) _0x110880['replaceWith'](_0x4626e2);
    },
    _0x214207 = () => {
      if (!_0x28d475) return;
      const _0x2b533b = getModelProviderProfileIds(_0x2c4415),
        _0x2b7749 = _0x2b533b['length'] > 0x1;
      _0x28d475['classList']['toggle']('is-hidden', !_0x2b7749);
      if (!_0x2b7749) return;
      const _0x277d55 = {
          model: _0x2c4415,
          providerProfileId: _0x16d2ee,
          providerProfileIdByModel: _0x255a30,
        },
        _0x159aea = resolveModelProviderProfileId(_0x277d55),
        _0x58ffd4 = resolveConfiguredModelProviderProfileId(_0x277d55, getProfileReadiness);
      let _0x29e0a9 = _0x277d55;
      if (_0x58ffd4 && _0x58ffd4 !== _0x159aea) {
        const _0x5be6bb = buildModelProviderProfileSelectionPatch(_0x277d55, _0x2c4415, _0x58ffd4);
        ((_0x16d2ee = _0x5be6bb['providerProfileId']),
          (_0x255a30 = _0x5be6bb['providerProfileIdByModel'] || {}),
          (_0x29e0a9 = { ..._0x277d55, ..._0x5be6bb }));
      }
      const _0x24362a = getNextModelProviderProfileId(_0x29e0a9),
        _0x320d0d = getModelProviderProfileShortLabel(_0x58ffd4),
        _0x4d819c = getModelProviderProfileShortLabel(_0x24362a);
      ((_0x28d475['textContent'] = _0x320d0d),
        (_0x28d475['dataset']['providerProfileId'] = getModelProviderProfileStyleId(_0x58ffd4)),
        (_0x28d475['dataset']['providerProfileValue'] = _0x58ffd4),
        (_0x28d475['title'] = '当前' + _0x320d0d + '线路，点击切换到' + _0x4d819c),
        _0x28d475['setAttribute']('aria-label', '当前' + _0x320d0d + '线路，点击切换到' + _0x4d819c));
    },
    _0x5a2aa7 = (_0xb9ae0d, _0x43e666, _0x3f29db) => {
      const _0x3d9e0c = String(_0xb9ae0d || '')['trim']();
      if (!_0x3d9e0c) return;
      const _0x3d6711 = buildModelProviderProfileSelectionPatch(
        { model: _0x2c4415, providerProfileId: _0x16d2ee, providerProfileIdByModel: _0x255a30 },
        _0x3d9e0c,
        _0x3f29db,
      );
      ((_0x2c4415 = _0x3d9e0c),
        (_0x197af9 = String(_0x43e666 || findTextModelMenuItem(_0x3d9e0c)?.['provider'] || '')['trim']()),
        (_0x16d2ee = _0x3d6711['providerProfileId']),
        (_0x255a30 = _0x3d6711['providerProfileIdByModel'] || {}),
        _0x3974fc?.['querySelectorAll']('.floating-menu-item[data-value]')['forEach']((_0x56c441) => {
          _0x56c441['classList']['toggle']('active', _0x56c441['dataset']['value'] === _0x2c4415);
        }),
        _0x3974fc?.['classList']['remove']('show'),
        _0x466fce(),
        _0x214207(),
        _0x47b0fc?.({
          modelId: _0x2c4415,
          provider: _0x197af9,
          providerProfileId: _0x16d2ee,
          providerProfileIdByModel: _0x255a30,
        }));
    },
    _0x25cf48 = () => {
      if (!_0x4ace00) return;
      _0x4ace00['replaceChildren']();
      const _0x5cb439 = getCustomTextModels();
      _0x5cb439['forEach']((_0x204151, _0x4bf661) => {
        const { item: _0x316758, remove: _0x45cf0e } = createCustomModelItem(
          documentObject,
          _0x204151,
          _0x2c4415,
        );
        (_0x45cf0e['addEventListener']('click', (_0x491b22) => {
          (_0x491b22['preventDefault'](),
            _0x491b22['stopPropagation'](),
            saveCustomTextModels(_0x5cb439['filter']((_0x5691a6, _0x4e77ae) => _0x4e77ae !== _0x4bf661)),
            _0x25cf48());
        }),
          _0x4ace00['appendChild'](_0x316758));
      });
      if (_0x5cb439['length']) {
        const _0x5b0064 = documentObject['createElement']('div');
        ((_0x5b0064['className'] = 'custom-model-separator'), _0x4ace00['appendChild'](_0x5b0064));
      }
      const _0x59a227 = documentObject['createElement']('div');
      ((_0x59a227['className'] = 'floating-menu-item custom-model-add'),
        (_0x59a227['innerHTML'] =
          '<svg class="custom-model-add-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span class="custom-model-add-label">' +
          t('aigenText.customModel.addModel') +
          '</span>'),
        _0x59a227['addEventListener']('click', (_0x2c9305) => {
          (_0x2c9305['preventDefault'](),
            _0x2c9305['stopPropagation'](),
            _0x59a227['replaceChildren'](),
            _0x59a227['classList']['add']('editing'));
          const _0x940386 = documentObject['createElement']('input');
          ((_0x940386['type'] = 'text'),
            (_0x940386['className'] = 'custom-model-input'),
            (_0x940386['placeholder'] = t('aigenText.customModel.namePlaceholder')));
          const _0x45a220 = documentObject['createElement']('button');
          ((_0x45a220['type'] = 'button'),
            (_0x45a220['className'] = 'custom-model-confirm'),
            (_0x45a220['textContent'] = t('aigenText.customModel.confirm')));
          const _0x33f141 = () => {
            const _0x506761 = _0x940386['value']['trim']();
            if (!_0x506761) return;
            const _0x28aea0 = getCustomTextModels();
            if (!_0x28aea0['includes'](_0x506761)) saveCustomTextModels([..._0x28aea0, _0x506761]);
            _0x25cf48();
          };
          (_0x940386['addEventListener']('keydown', (_0xa1d09c) => {
            _0xa1d09c['stopPropagation']();
            if (_0xa1d09c['key'] === 'Enter') _0x33f141();
          }),
            _0x940386['addEventListener']('click', (_0x54194d) => _0x54194d['stopPropagation']()),
            _0x45a220['addEventListener']('click', (_0x1be8f0) => {
              (_0x1be8f0['stopPropagation'](), _0x33f141());
            }),
            _0x59a227['append'](_0x940386, _0x45a220),
            _0x940386['focus']());
        }),
        _0x4ace00['appendChild'](_0x59a227));
    },
    _0x4cd850 = (_0x487a05) => {
      const _0x2234a0 = _0x487a05['target']?.['closest']?.('.floating-menu-item[data-value]');
      if (!_0x2234a0 || !_0x3974fc?.['contains'](_0x2234a0) || _0x2234a0['dataset']['disabled'] === 'true')
        return;
      (_0x487a05['stopPropagation'](),
        _0x5a2aa7(
          _0x2234a0['dataset']['value'],
          _0x2234a0['dataset']['provider'],
          _0x2234a0['dataset']['credentialResolvedProviderProfileId'],
        ));
    };
  (_0x3974fc?.['addEventListener']('click', _0x4cd850),
    _0x333f8c['push'](() => _0x3974fc?.['removeEventListener']('click', _0x4cd850)));
  const _0x571c03 = (_0x53b5ea) => {
    (_0x53b5ea['preventDefault'](), _0x53b5ea['stopPropagation']());
    const _0x1a2c97 = { model: _0x2c4415, providerProfileId: _0x16d2ee, providerProfileIdByModel: _0x255a30 },
      _0x101bb4 = getNextModelProviderProfileId(_0x1a2c97);
    if (!_0x101bb4) return;
    void requestModelProviderProfileSelection({
      nodeData: _0x1a2c97,
      targetProfileId: _0x101bb4,
      getProfileReadiness: getProfileReadiness,
      ensureProfileReady: _0x3bc313,
      onUnavailable: _0xff46d2,
      onChange: (_0x351f2a) => {
        ((_0x16d2ee = _0x351f2a['providerProfileId']),
          (_0x255a30 = _0x351f2a['providerProfileIdByModel'] || {}),
          _0x214207(),
          void syncModelCredentialMenu(_0x3974fc, {
            documentObject: documentObject,
            getProviderProfileId: () => _0x16d2ee,
          }),
          _0x47b0fc?.({
            modelId: _0x2c4415,
            provider: _0x197af9,
            providerProfileId: _0x16d2ee,
            providerProfileIdByModel: _0x255a30,
          }));
      },
    });
  };
  (_0x28d475?.['addEventListener']('click', _0x571c03),
    _0x333f8c['push'](() => _0x28d475?.['removeEventListener']('click', _0x571c03)),
    _0x333f8c['push'](bindNodeFooterController(_0x1ca3b1)),
    _0x333f8c['push'](
      bindNodeModelMenuTrigger({
        root: _0x1ca3b1,
        trigger: _0x8a92db,
        menu: _0x3974fc,
        closeOthers: () => closeNodeFooterMenus(_0x1ca3b1, _0x3974fc),
        activateMenuKeyboard: activateMenuKeyboard,
      }),
    ));
  const _0x17fe11 = onLocaleChange(() => {
    (_0x1ca3b1['querySelector']('[data-aigen-text-locale=\x22customModelTitle\x22]')?.['replaceChildren'](
      documentObject['createTextNode'](t('aigenText.customModelTitle')),
    ),
      _0x1ca3b1['querySelector']('[data-aigen-text-locale="customModelSubtitle"]')?.['replaceChildren'](
        documentObject['createTextNode'](t('aigenText.customModelSubtitle')),
      ),
      _0x25cf48(),
      _0x466fce());
  });
  _0x333f8c['push'](_0x17fe11);
  const _0x23e121 = () => {
    _0x214207();
  };
  (globalThis['window']?.['addEventListener']?.(API_CONFIG_CHANGED_EVENT, _0x23e121),
    _0x333f8c['push'](() =>
      globalThis['window']?.['removeEventListener']?.(API_CONFIG_CHANGED_EVENT, _0x23e121),
    ),
    _0x25cf48(),
    _0x466fce(),
    _0x214207());
  const _0x34c1a7 = bindModelCredentialMenu(_0x3974fc, {
    documentObject: documentObject,
    getProviderProfileId: () => _0x16d2ee,
  });
  return {
    modelWrap: _0x13663e,
    trigger: _0x8a92db,
    menu: _0x3974fc,
    getSelection: () => ({
      modelId: _0x2c4415,
      provider: _0x197af9,
      providerProfileId: _0x16d2ee,
      providerProfileIdByModel: _0x255a30,
    }),
    setSelection: ({
      modelId: _0x4cf2e9,
      provider: _0x1f9f8d,
      providerProfileId: _0x30dac2,
      providerProfileIdByModel: _0xbdca17,
    } = {}) => {
      const _0x1c5692 = _0x2c4415;
      ((_0x2c4415 = String(_0x4cf2e9 || _0x2c4415)),
        (_0x197af9 = String(_0x1f9f8d || findTextModelMenuItem(_0x2c4415)?.['provider'] || _0x197af9)));
      const _0x4acc46 = buildModelProviderProfileSelectionPatch(
        { model: _0x1c5692, providerProfileId: _0x16d2ee, providerProfileIdByModel: _0xbdca17 || _0x255a30 },
        _0x2c4415,
        _0x30dac2,
      );
      ((_0x16d2ee = _0x4acc46['providerProfileId']),
        (_0x255a30 = _0x4acc46['providerProfileIdByModel'] || {}),
        _0x25cf48(),
        _0x466fce(),
        _0x214207());
    },
    destroy() {
      (_0x34c1a7?.(), _0x333f8c['forEach']((_0x4ec3e0) => _0x4ec3e0?.()));
    },
  };
}
