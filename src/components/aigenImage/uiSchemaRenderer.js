import { createUiSchemaStateOwner, firstNonEmptyString } from './uiSchemaStateOwner.js';
import { resolveAudioVoiceCompositeState } from './audioVoiceCompositeState.js';
import {
  getModelManifest,
  normalizeUiSchemaFieldValue,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import { escapeHtmlAttr } from './uiModuleModelHelpers.js';
import { t } from '../../i18n/index.js';
import { translateManifestText } from '../../i18n/manifestText.js';
export { sanitizeModelUiSchemaParams };
const SUPPORTED_CONTROL_TYPES = new Set([
    'segmented',
    'select',
    'slider',
    'stepper',
    'toggle',
    'text',
    'textarea',
    'image input',
    'video input',
    'audio input',
  ]),
  ALLOWED_PLACEMENTS = new Set([
    'mode',
    'resolution',
    'advanced',
    'videoadvanced',
    'videoparams',
    'instance',
    'batch',
  ]),
  RANDOM_SEED_DEFAULT_MIN = 0,
  RANDOM_SEED_DEFAULT_MAX = 0x7fffffff;
function manifestText(_0x4917c2) {
  return translateManifestText(_0x4917c2);
}
function getDisplayLabelFromOption(_0x2b41fc, _0x44cfa6 = '') {
  return manifestText(_0x2b41fc?.displayLabel ?? _0x2b41fc?.selectedLabel ?? _0x2b41fc?.label ?? _0x44cfa6);
}
function formatMetricLabel(_0x6be8c5, _0x5edcba) {
  const _0x20b2a9 = manifestText(_0x6be8c5),
    _0x9e6d24 = String(_0x5edcba ?? '');
  return _0x20b2a9 === String(_0x6be8c5) ? '' + _0x20b2a9 + _0x9e6d24 : _0x20b2a9 + ' ' + _0x9e6d24;
}
function joinMetricLabels(_0x59b165) {
  return _0x59b165
    .filter((_0x5a2122) => Array.isArray(_0x5a2122) && _0x5a2122.length >= 2 && _0x5a2122[1] !== '')
    .map(([_0x2baf0d, _0x15e7fd]) => formatMetricLabel(_0x2baf0d, _0x15e7fd))
    .join('·');
}
function escapeCssString(_0x84ef5f) {
  return String(_0x84ef5f ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}
function normalizePlacement(_0x250d97) {
  const _0xa34e01 = String(_0x250d97 || '')
    .trim()
    .toLowerCase();
  return ALLOWED_PLACEMENTS.has(_0xa34e01) ? _0xa34e01 : '';
}
function filterUiSchemaFields(
  _0x92f100,
  {
    placement: _0x467f24,
    excludeFieldIds: _0x276af0,
    ignorePlacementFilter: ignorePlacementFilter = false,
  } = {},
) {
  if (!Array.isArray(_0x92f100)) return [];
  const _0x16b695 = String(_0x467f24 ?? '').trim() !== '',
    _0x871db1 = normalizePlacement(_0x467f24),
    _0x484dd8 = new Set(
      (Array.isArray(_0x276af0) ? _0x276af0 : []).map((_0x5bb701) => String(_0x5bb701 || '').trim()),
    );
  return _0x92f100.filter((_0x2cfb86) => {
    const _0x40b61a = String(_0x2cfb86?.id || '').trim();
    if (_0x484dd8.has(_0x40b61a)) return false;
    if (_0x16b695 && !_0x871db1 && !ignorePlacementFilter) return false;
    if (!_0x871db1 || ignorePlacementFilter) return true;
    return normalizePlacement(_0x2cfb86?.placement) === _0x871db1;
  });
}
function getUiSchemaFields(_0xaada73, { placement: _0x838f9b, excludeFieldIds: _0x442558 } = {}) {
  const _0x1b49dc = getModelManifest(_0xaada73);
  return filterUiSchemaFields(_0x1b49dc?.uiSchema?.fields, {
    placement: _0x838f9b,
    excludeFieldIds: _0x442558,
  });
}
function getUiSchemaModelIdForNode(_0x5ea9d7 = {}) {
  const _0x389d9b = String(_0x5ea9d7?.model || '').trim();
  if (!_0x389d9b) return '';
  if (getModelManifest(_0x389d9b)) return _0x389d9b;
  const _0x4af0cf =
    resolveModelExecution(_0x389d9b, { providerHint: _0x5ea9d7?.provider }) ||
    resolveModelExecution(_0x389d9b);
  return String(_0x4af0cf?.canonicalModelId || _0x4af0cf?.modelManifest?.modelId || _0x389d9b).trim();
}
function assertSupportedField(_0x3abf9d) {
  const _0x2cdd4d = String(_0x3abf9d?.id || '').trim(),
    _0xae207 = normalizeControlType(_0x3abf9d?.type);
  if (!_0x2cdd4d) throw new Error('[uiSchema] field id is required');
  if (!SUPPORTED_CONTROL_TYPES.has(_0xae207))
    throw new Error('[uiSchema] unsupported control type for ' + _0x2cdd4d + ': ' + _0x3abf9d?.type);
  if (_0x3abf9d?.defaultValue === undefined)
    throw new Error('[uiSchema] defaultValue is required for ' + _0x2cdd4d);
  if (
    (_0xae207 === 'segmented' || _0xae207 === 'select') &&
    (!Array.isArray(_0x3abf9d?.options) || _0x3abf9d.options.length === 0)
  )
    throw new Error('[uiSchema] options are required for ' + _0x2cdd4d);
}
function getFieldValue(_0x16c134, _0x21d136) {
  const _0x5726d9 = String(_0x21d136?.id || '').trim();
  if (!_0x5726d9) return _0x21d136?.defaultValue ?? '';
  const _0x3d54d5 = getUiSchemaParamContext(_0x16c134),
    _0x272753 = _0x16c134?.generationParams;
  if (
    _0x272753 &&
    typeof _0x272753 === 'object' &&
    !Array.isArray(_0x272753) &&
    _0x272753[_0x5726d9] !== undefined
  )
    return normalizeUiSchemaFieldValue(_0x21d136, _0x272753[_0x5726d9], { params: _0x3d54d5 });
  if (
    _0x16c134 &&
    typeof _0x16c134 === 'object' &&
    !Array.isArray(_0x16c134) &&
    _0x16c134[_0x5726d9] !== undefined
  )
    return normalizeUiSchemaFieldValue(_0x21d136, _0x16c134[_0x5726d9], { params: _0x3d54d5 });
  return normalizeUiSchemaFieldValue(_0x21d136, _0x21d136?.defaultValue, { params: _0x3d54d5 });
}
function getNodeFieldValue(_0x2aa9db, _0x3c2984, _0x3abb3e = '') {
  const _0x38d997 = String(_0x3c2984 || '').trim();
  if (!_0x38d997) return _0x3abb3e;
  const _0x5ab246 = _0x2aa9db?.generationParams;
  if (
    _0x5ab246 &&
    typeof _0x5ab246 === 'object' &&
    !Array.isArray(_0x5ab246) &&
    _0x5ab246[_0x38d997] !== undefined
  )
    return _0x5ab246[_0x38d997];
  if (
    _0x2aa9db &&
    typeof _0x2aa9db === 'object' &&
    !Array.isArray(_0x2aa9db) &&
    _0x2aa9db[_0x38d997] !== undefined
  )
    return _0x2aa9db[_0x38d997];
  return _0x3abb3e;
}
function getPlainGenerationParams(_0x70da3e) {
  return _0x70da3e && typeof _0x70da3e === 'object' && !Array.isArray(_0x70da3e) ? { ..._0x70da3e } : {};
}
function getUiSchemaParamContext(_0x24d7e5 = {}) {
  const _0x2251d2 = getPlainGenerationParams(_0x24d7e5?.generationParams),
    _0x28f00b = _0x24d7e5 && typeof _0x24d7e5 === 'object' && !Array.isArray(_0x24d7e5) ? _0x24d7e5 : {};
  return { ..._0x28f00b, ..._0x2251d2 };
}
function getGenerationParamsMemoryKey(_0x1daf7a) {
  return String(_0x1daf7a?.model || '').trim();
}
function normalizeControlType(_0x3d22fa) {
  return String(_0x3d22fa || '')
    .trim()
    .toLowerCase();
}
function getRenderableOptions(_0x154c89) {
  const _0x15c5d4 = Array.isArray(_0x154c89?.options) ? _0x154c89.options : [],
    _0x491dde =
      Array.isArray(_0x154c89?.advancedOptions) && globalThis.window?.ADVANCED_MODE
        ? _0x154c89.advancedOptions
        : [];
  return [..._0x15c5d4, ..._0x491dde];
}
function getOptionHideWhen(_0x3390ea) {
  if (!_0x3390ea || typeof _0x3390ea !== 'object' || Array.isArray(_0x3390ea)) return null;
  const _0x4912ca = _0x3390ea.hideWhen;
  return _0x4912ca &&
    (Array.isArray(_0x4912ca) || (typeof _0x4912ca === 'object' && !Array.isArray(_0x4912ca)))
    ? _0x4912ca
    : null;
}
function isOptionHidden(_0x136e1c, _0x3b915f = {}) {
  if (_0x136e1c?.hidden === true) return true;
  const _0x497659 = getOptionHideWhen(_0x136e1c);
  return _0x497659 ? uiSchemaConditionMatches(_0x497659, _0x3b915f) : false;
}
function getVisibleOptions(_0x5bb78b, _0x47aa52 = {}) {
  return getRenderableOptions(_0x5bb78b).filter((_0x41c7ba) => !isOptionHidden(_0x41c7ba, _0x47aa52));
}
function renderOptions(_0xf0d251, _0x4be3cf, _0x146f45 = {}) {
  const _0x3f830b = getVisibleOptions(_0xf0d251, _0x146f45);
  return _0x3f830b
    .map((_0x1e28b4) => {
      const _0x3d5cad = _0x1e28b4 && typeof _0x1e28b4 === 'object' && !Array.isArray(_0x1e28b4),
        _0x292fcb = String(_0x3d5cad ? (_0x1e28b4.value ?? '') : _0x1e28b4),
        _0x5b79a2 = manifestText(_0x3d5cad ? (_0x1e28b4.label ?? _0x292fcb) : _0x292fcb),
        _0x22b125 = manifestText(_0x3d5cad ? _0x1e28b4.tooltip || '' : '').trim(),
        _0x52c023 = String(_0x4be3cf ?? '') === _0x292fcb,
        _0x5cc70e = isOptionDisabled(_0xf0d251, _0x1e28b4, _0x146f45),
        _0x1097a9 = _0x22b125
          ? ' title="' + escapeHtmlAttr(_0x22b125) + '" data-tooltip="' + escapeHtmlAttr(_0x22b125) + '"'
          : '';
      return (
        '<button type="button" class="img-rp-quality-item ui-schema-option ' +
        (_0x52c023 ? 'active' : '') +
        ' ' +
        (_0x5cc70e ? 'disabled' : '') +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(_0x292fcb) +
        '"' +
        _0x1097a9 +
        getOptionDisabledAttrs(_0xf0d251, _0x1e28b4, { nodeData: _0x146f45 }) +
        '>' +
        escapeHtmlAttr(_0x5b79a2) +
        '</button>'
      );
    })
    .join('');
}
function renderControl(_0x400326, _0x57b8a5, _0x8f65ad, _0x317412 = {}) {
  if (_0x8f65ad === 'segmented') {
    if (_0x317412?.advanced)
      return renderAdvancedSelectionControl(_0x400326, _0x57b8a5, _0x317412?.nodeData || {});
    const _0x36d45e = _0x317412?.advanced ? ' rh-adv-seg rh-v5-fps-seg' : '';
    return (
      '<div class="img-rp-quality-segmented ui-schema-segmented' +
      _0x36d45e +
      '">' +
      renderOptions(_0x400326, _0x57b8a5, _0x317412?.nodeData || {}) +
      '</div>'
    );
  }
  if (_0x8f65ad === 'select') return renderSelect(_0x400326, _0x57b8a5, _0x317412?.nodeData || {});
  if (_0x8f65ad === 'slider' || _0x8f65ad === 'stepper')
    return renderRange(_0x400326, _0x57b8a5, _0x8f65ad, _0x317412?.nodeData || {});
  if (_0x8f65ad === 'toggle')
    return renderAdvancedSelectionControl(_0x400326, _0x57b8a5, _0x317412?.nodeData || {});
  if (_0x8f65ad === 'text' || _0x8f65ad === 'textarea')
    return renderTextInput(_0x400326, _0x57b8a5, _0x8f65ad);
  return renderAssetInput(_0x400326, _0x8f65ad);
}
function getOptionLabel(_0x10200a, _0xb34709) {
  const _0x74f684 = getRenderableOptions(_0x10200a),
    _0x37257a = String(_0xb34709 ?? ''),
    _0x48f369 = _0x74f684.find((_0x5c99d0) => String(_0x5c99d0?.value ?? _0x5c99d0) === _0x37257a);
  return getDisplayLabelFromOption(_0x48f369, _0x37257a);
}
function getFieldById(_0x44cd46, _0x292ad5) {
  return (Array.isArray(_0x44cd46) ? _0x44cd46 : []).find(
    (_0x1e87de) => String(_0x1e87de?.id || '').trim() === _0x292ad5,
  );
}
function getFieldByDisplayRole(_0x1494be, _0x4ef8de) {
  const _0x6b7e35 = String(_0x4ef8de || '').trim();
  if (!_0x6b7e35) return null;
  return (Array.isArray(_0x1494be) ? _0x1494be : []).find(
    (_0x1907cf) => String(_0x1907cf?.displayRole || '').trim() === _0x6b7e35,
  );
}
function getOptionValue(_0x3120bc) {
  return String(_0x3120bc?.value ?? _0x3120bc);
}
function isFieldDisabled(_0x111d92) {
  return _0x111d92?.disabled === true || _0x111d92?.readOnly === true;
}
function normalizeCompareValue(_0x176821) {
  return String(_0x176821 ?? '')
    .trim()
    .toLowerCase();
}
function getOptionDisableWhen(_0x4d8b2c) {
  if (!_0x4d8b2c || typeof _0x4d8b2c !== 'object' || Array.isArray(_0x4d8b2c)) return null;
  const _0x58f7c6 = _0x4d8b2c.disableWhen || _0x4d8b2c.disabledWhen;
  return _0x58f7c6 &&
    (Array.isArray(_0x58f7c6) || (typeof _0x58f7c6 === 'object' && !Array.isArray(_0x58f7c6)))
    ? _0x58f7c6
    : null;
}
function optionDisableWhenMatches(_0x39b443, _0x48b9b0 = {}) {
  if (Array.isArray(_0x39b443))
    return _0x39b443.some((_0x17bcf1) => optionDisableWhenMatches(_0x17bcf1, _0x48b9b0));
  if (!_0x39b443 || typeof _0x39b443 !== 'object') return false;
  if (Array.isArray(_0x39b443.any))
    return _0x39b443.any.some((_0x3b1188) => optionDisableWhenMatches(_0x3b1188, _0x48b9b0));
  if (Array.isArray(_0x39b443.all))
    return _0x39b443.all.every((_0x10ee49) => optionDisableWhenMatches(_0x10ee49, _0x48b9b0));
  const _0x59ee14 = String(_0x39b443?.field || _0x39b443?.param || '').trim();
  if (!_0x59ee14) return false;
  const _0x4ace92 = _0x39b443.values !== undefined ? _0x39b443.values : _0x39b443.value,
    _0x5c0a86 = Array.isArray(_0x4ace92) ? _0x4ace92 : [_0x4ace92],
    _0x1ed8b3 = _0x5c0a86.map(normalizeCompareValue);
  return _0x1ed8b3.includes(normalizeCompareValue(getNodeFieldValue(_0x48b9b0, _0x59ee14, '')));
}
function uiSchemaConditionMatches(_0x5826de, _0x225638 = {}) {
  if (Array.isArray(_0x5826de))
    return _0x5826de.some((_0x21faeb) => uiSchemaConditionMatches(_0x21faeb, _0x225638));
  if (!_0x5826de || typeof _0x5826de !== 'object') return false;
  if (Array.isArray(_0x5826de.any))
    return _0x5826de.any.some((_0x346922) => uiSchemaConditionMatches(_0x346922, _0x225638));
  if (Array.isArray(_0x5826de.all))
    return _0x5826de.all.every((_0xf19674) => uiSchemaConditionMatches(_0xf19674, _0x225638));
  const _0x4cf6fe = String(_0x5826de?.field || _0x5826de?.param || '').trim();
  if (!_0x4cf6fe) return false;
  const _0x3125f3 = _0x5826de.values !== undefined ? _0x5826de.values : _0x5826de.value,
    _0x2935f0 = Array.isArray(_0x3125f3) ? _0x3125f3 : [_0x3125f3],
    _0x4910a0 = _0x2935f0.map(normalizeCompareValue);
  return _0x4910a0.includes(normalizeCompareValue(getNodeFieldValue(_0x225638, _0x4cf6fe, '')));
}
function filterVisibleUiSchemaFields(_0x22162c = [], _0x1caf33 = {}) {
  return (Array.isArray(_0x22162c) ? _0x22162c : []).filter((_0xb7472) => {
    if (_0xb7472?.showWhen && !uiSchemaConditionMatches(_0xb7472.showWhen, _0x1caf33)) return false;
    if (_0xb7472?.hideWhen && uiSchemaConditionMatches(_0xb7472.hideWhen, _0x1caf33)) return false;
    return true;
  });
}
function getOptionDisableWhenAttrs(_0x37d17f) {
  const _0x35d6ea = getOptionDisableWhen(_0x37d17f);
  if (!_0x35d6ea) return '';
  if (Array.isArray(_0x35d6ea) || Array.isArray(_0x35d6ea.any) || Array.isArray(_0x35d6ea.all))
    return ' data-ui-schema-disable-when-json="' + escapeHtmlAttr(JSON.stringify(_0x35d6ea)) + '"';
  const _0x4a9c33 = String(_0x35d6ea.field || _0x35d6ea.param || '').trim(),
    _0x24dd60 = _0x35d6ea.values !== undefined ? _0x35d6ea.values : _0x35d6ea.value,
    _0x5047c7 = Array.isArray(_0x24dd60) ? _0x24dd60 : [_0x24dd60];
  if (!_0x4a9c33 || _0x5047c7.length === 0) return '';
  return (
    ' data-ui-schema-disable-when-field="' +
    escapeHtmlAttr(_0x4a9c33) +
    '" data-ui-schema-disable-when-values="' +
    escapeHtmlAttr(_0x5047c7.join(',')) +
    '"'
  );
}
function getFieldDefaultAliasAttrs(_0x3867f3) {
  const _0x340e80 = (Array.isArray(_0x3867f3?.defaultValueAliases) ? _0x3867f3.defaultValueAliases : [])
    .map((_0x3de4ff) => String(_0x3de4ff ?? '').trim())
    .filter(Boolean);
  return _0x340e80.length
    ? ' data-ui-schema-default-aliases="' + escapeHtmlAttr(JSON.stringify(_0x340e80)) + '"'
    : '';
}
function isOptionDisabled(_0x29dda3, _0x298ff0, _0x362010 = {}) {
  return (
    isFieldDisabled(_0x29dda3) ||
    (_0x298ff0 &&
      typeof _0x298ff0 === 'object' &&
      !Array.isArray(_0x298ff0) &&
      (_0x298ff0.disabled === true || optionDisableWhenMatches(getOptionDisableWhen(_0x298ff0), _0x362010)))
  );
}
function getOptionDisabledAttrs(
  _0x4e9a86,
  _0x2daa1e,
  { button: button = true, nodeData: nodeData = {} } = {},
) {
  const _0x172112 = getOptionDisableWhenAttrs(_0x2daa1e),
    _0x4bb2e9 =
      isFieldDisabled(_0x4e9a86) ||
      (_0x2daa1e &&
        typeof _0x2daa1e === 'object' &&
        !Array.isArray(_0x2daa1e) &&
        _0x2daa1e.disabled === true),
    _0x2623b5 = isOptionDisabled(_0x4e9a86, _0x2daa1e, nodeData);
  if (!_0x2623b5) return _0x172112;
  const _0x1d5bb9 = _0x4bb2e9 ? ' data-ui-schema-static-disabled="true"' : '',
    _0x3f5abe = button
      ? ' data-ui-schema-disabled="true" disabled aria-disabled="true"'
      : ' data-ui-schema-disabled="true" aria-disabled="true"';
  return '' + _0x172112 + _0x1d5bb9 + _0x3f5abe;
}
function isAdaptiveRatioOption(_0x436e64, _0x1abba4) {
  const _0x34dbac = getOptionValue(_0x1abba4).trim(),
    _0x25ac05 = String(_0x1abba4?.label ?? _0x34dbac).trim(),
    _0x5ab9cb = _0x34dbac.toLowerCase(),
    _0x521748 = _0x25ac05.toLowerCase();
  return (
    _0x5ab9cb === 'auto' ||
    _0x5ab9cb === 'adaptive' ||
    _0x5ab9cb === '自适应' ||
    _0x521748 === 'auto' ||
    _0x521748 === 'adaptive' ||
    _0x521748 === '自适应' ||
    (_0x34dbac === String(_0x436e64?.defaultValue ?? '') && _0x521748 === 'auto')
  );
}
function getRatioOptionLabel(_0x3bf7a6, _0x481b91) {
  const _0x29978a = getRenderableOptions(_0x3bf7a6),
    _0x58ce4e = String(_0x481b91 ?? ''),
    _0x43dd90 = _0x29978a.find((_0x3dc5c1) => getOptionValue(_0x3dc5c1) === _0x58ce4e);
  if (_0x43dd90 && isAdaptiveRatioOption(_0x3bf7a6, _0x43dd90)) return t('videoNode.parameterPanel.adaptive');
  if (!_0x43dd90 && isAdaptiveRatioOption(_0x3bf7a6, _0x58ce4e))
    return t('videoNode.parameterPanel.adaptive');
  return getDisplayLabelFromOption(_0x43dd90, _0x58ce4e);
}
function getRatioIconClass(_0x249354) {
  const _0x372aec = String(_0x249354 || '').trim(),
    _0x24886d = {
      '1:1': 'img-rp-sq',
      '9:16': 'img-rp-tall',
      '16:9': 'img-rp-wide',
      '3:4': 'img-rp-p34',
      '4:3': 'img-rp-l43',
      '1:4': 'img-rp-p14',
      '4:1': 'img-rp-l41',
      '1:8': 'img-rp-p18',
      '8:1': 'img-rp-l81',
      '3:2': 'img-rp-l32',
      '2:3': 'img-rp-p23',
      '5:4': 'img-rp-l54',
      '4:5': 'img-rp-p45',
      '21:9': 'img-rp-ultra',
    };
  if (_0x24886d[_0x372aec]) return _0x24886d[_0x372aec];
  const _0x18a88d = _0x372aec.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/);
  if (!_0x18a88d) return 'img-rp-sq';
  const _0x53edf2 = Number(_0x18a88d[1]),
    _0x4b9f15 = Number(_0x18a88d[2]);
  if (!Number.isFinite(_0x53edf2) || !Number.isFinite(_0x4b9f15) || _0x53edf2 === _0x4b9f15)
    return 'img-rp-sq';
  return _0x53edf2 > _0x4b9f15 ? 'img-rp-wide' : 'img-rp-tall';
}
function renderQualityButtons(_0x32fb05, _0x3f777c, _0x404add = {}) {
  assertSupportedField(_0x32fb05);
  const _0x1a7fd6 = _0x32fb05?.displayRole
      ? ' data-ui-schema-display-role="' + escapeHtmlAttr(_0x32fb05.displayRole) + '"'
      : '',
    _0x2d7811 =
      String(_0x32fb05?.id || '').trim() === 'imageSize'
        ? manifestText('画质')
        : manifestText(_0x32fb05?.label || '画质'),
    _0x37493f = manifestText(_0x32fb05?.description || _0x32fb05?.tooltip || '').trim(),
    _0x22cb45 = String(_0x32fb05?.variant || '').trim() === 'sectionMenu' || _0x32fb05?.showInfoTip === true,
    _0x4fb518 =
      _0x37493f && _0x22cb45
        ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' + escapeHtmlAttr(_0x37493f) + '">!</span>'
        : '',
    _0x4d1928 = getVisibleOptions(_0x32fb05, _0x404add),
    _0x143631 = _0x4d1928.some((_0x51f74b) =>
      String(_0x51f74b?.groupLabel || _0x51f74b?.sectionLabel || '').trim(),
    );
  if (_0x143631) {
    const _0x36e449 = [];
    return (
      _0x4d1928.forEach((_0x2e724b) => {
        const _0x2eaa02 = manifestText(_0x2e724b?.groupLabel || _0x2e724b?.sectionLabel || _0x2d7811).trim();
        let _0x2ad636 = _0x36e449.find((_0x1e42d9) => _0x1e42d9.label === _0x2eaa02);
        (!_0x2ad636 && ((_0x2ad636 = { label: _0x2eaa02, options: [] }), _0x36e449.push(_0x2ad636)),
          _0x2ad636.options.push(_0x2e724b));
      }),
      '<div class="img-rp-quality-area" data-ui-schema-field="' +
        escapeHtmlAttr(_0x32fb05.id) +
        '" data-ui-schema-type="segmented" data-ui-schema-default="' +
        escapeHtmlAttr(_0x32fb05?.defaultValue ?? '') +
        '"' +
        _0x1a7fd6 +
        '>\n      ' +
        _0x36e449
          .map(
            (_0x5a5565) =>
              '<div class="img-rp-section-label">' +
              escapeHtmlAttr(_0x5a5565.label) +
              (_0x5a5565.label === _0x2d7811 ? _0x4fb518 : '') +
              '</div>\n            <div class="img-rp-quality-segmented">\n              ' +
              _0x5a5565.options
                .map((_0x2e9014) => {
                  const _0x3750e6 = getOptionValue(_0x2e9014),
                    _0x4fc8d6 = manifestText(_0x2e9014?.label ?? _0x3750e6),
                    _0x151cca = getDisplayLabelFromOption(_0x2e9014, _0x4fc8d6),
                    _0x47a8f2 = String(_0x3f777c ?? '') === _0x3750e6,
                    _0x51e5d1 = isOptionDisabled(_0x32fb05, _0x2e9014, _0x404add);
                  return (
                    '<button type="button" class="img-rp-quality-item ui-schema-option ' +
                    (_0x47a8f2 ? 'active' : '') +
                    ' ' +
                    (_0x51e5d1 ? 'disabled' : '') +
                    '" data-ui-schema-value="' +
                    escapeHtmlAttr(_0x3750e6) +
                    '" data-ui-schema-option-label="' +
                    escapeHtmlAttr(_0x151cca) +
                    '"' +
                    getOptionDisabledAttrs(_0x32fb05, _0x2e9014, { nodeData: _0x404add }) +
                    '>' +
                    escapeHtmlAttr(_0x4fc8d6) +
                    '</button>'
                  );
                })
                .join('') +
              '\n            </div>',
          )
          .join('') +
        '\n    </div>'
    );
  }
  return (
    '<div class="img-rp-quality-area" data-ui-schema-field="' +
    escapeHtmlAttr(_0x32fb05.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x32fb05?.defaultValue ?? '') +
    '"' +
    _0x1a7fd6 +
    '>\n    <div class="img-rp-section-label">' +
    escapeHtmlAttr(_0x2d7811) +
    _0x4fb518 +
    '</div>\n    <div class="img-rp-quality-segmented">\n      ' +
    _0x4d1928
      .map((_0x39c9fd) => {
        const _0x1a23ec = getOptionValue(_0x39c9fd),
          _0x1eef71 = manifestText(_0x39c9fd?.label ?? _0x1a23ec),
          _0x56dca6 = getDisplayLabelFromOption(_0x39c9fd, _0x1eef71),
          _0x580ec8 = String(_0x3f777c ?? '') === _0x1a23ec,
          _0x2d04ab = isOptionDisabled(_0x32fb05, _0x39c9fd, _0x404add);
        return (
          '<button type="button" class="img-rp-quality-item ui-schema-option ' +
          (_0x580ec8 ? 'active' : '') +
          ' ' +
          (_0x2d04ab ? 'disabled' : '') +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(_0x1a23ec) +
          '" data-ui-schema-option-label="' +
          escapeHtmlAttr(_0x56dca6) +
          '"' +
          getOptionDisabledAttrs(_0x32fb05, _0x39c9fd, { nodeData: _0x404add }) +
          '>' +
          escapeHtmlAttr(_0x1eef71) +
          '</button>'
        );
      })
      .join('') +
    '\n    </div>\n  </div>'
  );
}
function renderSectionMenuField(_0x2b7530, _0x3d897c) {
  const _0x4e9ce9 = String(_0x2b7530?.id || '').trim(),
    _0x5cf421 = getFieldValue(_0x3d897c, _0x2b7530),
    _0x157f9e = getOptionLabel(_0x2b7530, _0x5cf421);
  return (
    '<div class="ui-schema-field ui-schema-section-menu" data-ui-schema-field="' +
    escapeHtmlAttr(_0x4e9ce9) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x2b7530?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(_0x4e9ce9) +
    '">\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(_0x157f9e) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-section-menu-popup" style="display:none;">\n      ' +
    renderQualityButtons(_0x2b7530, _0x5cf421, _0x3d897c) +
    '\n    </div>\n  </div>'
  );
}
function renderRatioButtons(_0x3208a8, _0x595a48, _0x4c74dc = {}) {
  assertSupportedField(_0x3208a8);
  const _0x2aba42 = _0x3208a8?.displayRole
      ? ' data-ui-schema-display-role="' + escapeHtmlAttr(_0x3208a8.displayRole) + '"'
      : '',
    _0xbee601 = getVisibleOptions(_0x3208a8, _0x4c74dc),
    _0x42261e = _0xbee601.find((_0x366850) => isAdaptiveRatioOption(_0x3208a8, _0x366850)),
    _0x2d26a3 = _0xbee601.filter((_0x5bf948) => !isAdaptiveRatioOption(_0x3208a8, _0x5bf948)),
    _0x454612 = String(_0x595a48 ?? ''),
    _0x39956e = _0x42261e ? getOptionValue(_0x42261e) : '',
    _0x541c1e = _0x42261e && String(_0x454612) === String(_0x39956e),
    _0x5c794e = _0x42261e
      ? '<button type="button" class="img-rp-large-adaptive ui-schema-option ' +
        (_0x541c1e ? 'active' : '') +
        '" data-label="自适应" data-ui-schema-value="' +
        escapeHtmlAttr(_0x39956e) +
        '">\n        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n        <span>' +
        escapeHtmlAttr(t('videoNode.parameterPanel.adaptive')) +
        '</span>\n      </button>'
      : '',
    _0x3bf12e = _0x42261e ? 'img-rp-ratio-split has-adaptive' : 'img-rp-ratio-split';
  return (
    '<div class="img-rp-ratio-area" data-ui-schema-field="' +
    escapeHtmlAttr(_0x3208a8.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x3208a8?.defaultValue ?? '') +
    '"' +
    _0x2aba42 +
    '>\n    <div class="img-rp-section-label">' +
    escapeHtmlAttr(manifestText('比例')) +
    '</div>\n    <div class="' +
    _0x3bf12e +
    '">\n      ' +
    (_0x42261e ? '<div class="img-rp-ratio-left">' + _0x5c794e + '</div>' : '') +
    '\n      <div class="img-rp-ratio-right">\n        ' +
    _0x2d26a3
      .map((_0xe13331) => {
        const _0x257250 = getOptionValue(_0xe13331),
          _0x4ed0eb = manifestText(_0xe13331?.label ?? _0x257250),
          _0x2a4bb1 = _0x454612 === _0x257250,
          _0x3e0c8c = isOptionDisabled(_0x3208a8, _0xe13331, _0x4c74dc);
        return (
          '<button type="button" class="img-rp-ratio-item ui-schema-option ' +
          (_0x2a4bb1 ? 'active' : '') +
          ' ' +
          (_0x3e0c8c ? 'disabled' : '') +
          '" data-label="' +
          escapeHtmlAttr(_0x257250) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(_0x257250) +
          '"' +
          getOptionDisabledAttrs(_0x3208a8, _0xe13331, { nodeData: _0x4c74dc }) +
          '><span class="img-rp-icon ' +
          getRatioIconClass(_0x257250) +
          '"></span><span>' +
          escapeHtmlAttr(_0x4ed0eb) +
          '</span></button>'
        );
      })
      .join('') +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderQualityRatioField(_0x4ddf93, _0x466a05, _0x471f86) {
  const _0x4521e5 = (Array.isArray(_0x4ddf93) ? _0x4ddf93 : [_0x4ddf93]).filter(Boolean);
  (_0x4521e5.forEach(assertSupportedField), assertSupportedField(_0x466a05));
  const _0x432f32 = getFieldValue(_0x471f86, _0x466a05),
    _0x1bda66 = _0x4521e5.map((_0x705281) => getOptionLabel(_0x705281, getFieldValue(_0x471f86, _0x705281))),
    _0x18e440 = getRatioOptionLabel(_0x466a05, _0x432f32),
    _0x4e459d = String(
      _0x4521e5[0]?.qualityRatioLabelOrder || _0x4521e5[0]?.compositeLabelOrder || '',
    ).trim(),
    _0x26e8bf =
      _0x1bda66.length > 1
        ? [..._0x1bda66, _0x18e440].join(' · ')
        : _0x4e459d === 'fieldFirst'
          ? (_0x1bda66[0] || '') + ' · ' + _0x18e440
          : _0x18e440 + ' · ' + (_0x1bda66[0] || ''),
    _0x19dc68 = _0x4e459d ? ' data-ui-schema-label-order="' + escapeHtmlAttr(_0x4e459d) + '"' : '';
  return (
    '<div class="ui-schema-quality-ratio-pill" data-ui-schema-composite-field="qualityRatio"' +
    _0x19dc68 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="qualityRatio">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n      <span class="ui-schema-pill-label ui-schema-quality-ratio-label">' +
    escapeHtmlAttr(_0x26e8bf) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-quality-ratio-popup" style="display:none;">\n      ' +
    _0x4521e5
      .map((_0x22393f) => renderQualityButtons(_0x22393f, getFieldValue(_0x471f86, _0x22393f), _0x471f86))
      .join('') +
    '\n      ' +
    renderRatioButtons(_0x466a05, _0x432f32, _0x471f86) +
    '\n    </div>\n  </div>'
  );
}
function renderAspectRatioPillField(_0x3c60b2, _0x560454) {
  assertSupportedField(_0x3c60b2);
  const _0x3eced3 = String(_0x3c60b2?.id || '').trim(),
    _0x36243b = getFieldValue(_0x560454, _0x3c60b2),
    _0x767372 = getRatioOptionLabel(_0x3c60b2, _0x36243b);
  return (
    '<div class="ui-schema-aspect-ratio-pill" data-ui-schema-field="' +
    escapeHtmlAttr(_0x3eced3) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x3c60b2?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(_0x3eced3) +
    '">\n      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>\n      <span class="ui-schema-pill-label ui-schema-aspect-ratio-label">' +
    escapeHtmlAttr(_0x767372) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-aspect-ratio-popup" style="display:none;">\n      ' +
    renderRatioButtons(_0x3c60b2, _0x36243b, _0x560454) +
    '\n    </div>\n  </div>'
  );
}
function renderSectionPairField(_0x29118f, _0x13807e) {
  const _0x53da48 = (Array.isArray(_0x29118f) ? _0x29118f : []).filter(Boolean);
  _0x53da48.forEach(assertSupportedField);
  const _0x33fe3d = _0x53da48
      .map((_0x4ef09c) => getOptionLabel(_0x4ef09c, getFieldValue(_0x13807e, _0x4ef09c)))
      .join(' · '),
    _0x75a91b = _0x53da48.map((_0x5062a2) => String(_0x5062a2?.id || '').trim()).filter(Boolean),
    _0x36ddca = _0x75a91b[0] || '',
    _0x28d895 = _0x75a91b[1] || '';
  return (
    '<div class="ui-schema-section-pair-pill" data-ui-schema-composite-field="sectionPair" data-ui-schema-primary-field="' +
    escapeHtmlAttr(_0x36ddca) +
    '" data-ui-schema-secondary-field="' +
    escapeHtmlAttr(_0x28d895) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="sectionPair">\n      <span class="ui-schema-pill-label ui-schema-section-pair-label">' +
    escapeHtmlAttr(_0x33fe3d) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-section-pair-popup" style="display:none;">\n      ' +
    _0x53da48
      .map((_0x1d0957) => renderQualityButtons(_0x1d0957, getFieldValue(_0x13807e, _0x1d0957), _0x13807e))
      .join('') +
    '\n    </div>\n  </div>'
  );
}
function renderVideoResolutionField(_0x1f8977, _0x1f7200) {
  const _0xed56f9 =
    getFieldById(_0x1f8977, 'rhVideoResolution') || getFieldById(_0x1f8977, 'videoResolution');
  if (!_0xed56f9) return '';
  assertSupportedField(_0xed56f9);
  const _0x1282af = getFieldById(_0x1f8977, 'rhVideoFps'),
    _0xa9faf7 = getFieldById(_0x1f8977, 'rhVideoFrames');
  if (_0x1282af) assertSupportedField(_0x1282af);
  if (_0xa9faf7) assertSupportedField(_0xa9faf7);
  const _0x4a81e7 = getFieldValue(_0x1f7200, _0xed56f9),
    _0x2b3986 = _0x1282af ? getFieldValue(_0x1f7200, _0x1282af) : '',
    _0x4de6d6 = _0xa9faf7 ? getFieldValue(_0x1f7200, _0xa9faf7) : '',
    _0xcb60a8 = Number(_0x4de6d6) === 0 ? t('aigenImage.uiSchema.fullLength') : String(_0x4de6d6 || ''),
    _0x2ea904 =
      _0x1282af && _0xa9faf7
        ? joinMetricLabels([
            ['帧数', _0xcb60a8],
            ['帧率', _0x2b3986],
            ['分辨率', _0x4a81e7],
          ])
        : formatMetricLabel('分辨率', _0x4a81e7);
  return (
    '<div class="ui-schema-video-resolution-pill" data-ui-schema-composite-field="videoResolution">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="videoResolution">\n      <span class="ui-schema-pill-label ui-schema-video-resolution-label">' +
    escapeHtmlAttr(_0x2ea904) +
    '</span>\n    </button>\n    <div class="img-ratio-popup ui-schema-popup ui-schema-video-resolution-popup" style="display:none;">\n      ' +
    renderQualityButtons({ ..._0xed56f9, label: '分辨率' }, _0x4a81e7, _0x1f7200) +
    '\n      ' +
    (_0x1282af
      ? '<div class="rh-v5-meta-panel"><div class="rh-vram-adv-row"><div class="rh-vram-adv-label"><span>' +
        escapeHtmlAttr(manifestText('帧率')) +
        '</span></div><div class="img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg" data-ui-schema-field="' +
        escapeHtmlAttr(_0x1282af.id) +
        '" data-ui-schema-type="segmented" data-ui-schema-default="' +
        escapeHtmlAttr(_0x1282af.defaultValue ?? '') +
        '">' +
        renderOptions(_0x1282af, _0x2b3986, _0x1f7200) +
        '</div></div></div>'
      : '') +
    '\n    </div>\n  </div>'
  );
}
function normalizeNumberValue(_0x2c8b11, _0x3c41cc, { min: min = -Infinity, max: max = Infinity } = {}) {
  const _0x470aed = Number(_0x2c8b11),
    _0xf570be = Number.isFinite(_0x470aed) ? Math.trunc(_0x470aed) : _0x3c41cc;
  return Math.max(min, Math.min(max, _0xf570be));
}
export function evaluateUiSchemaNumberExpression(_0x55fbed) {
  if (typeof _0x55fbed === 'number') return Number.isFinite(_0x55fbed) ? _0x55fbed : NaN;
  const _0x293e89 = String(_0x55fbed ?? '').trim();
  if (!_0x293e89) return NaN;
  let _0x4371dc = 0;
  const _0x4da266 = () => {
      while (/\s/.test(_0x293e89[_0x4371dc] || '')) _0x4371dc += 1;
    },
    _0x7f583f = () => {
      _0x4da266();
      const _0x3124cd = _0x4371dc;
      let _0x253bf6 = false;
      while (/\d/.test(_0x293e89[_0x4371dc] || '')) {
        ((_0x253bf6 = true), (_0x4371dc += 1));
      }
      if (_0x293e89[_0x4371dc] === '.') {
        _0x4371dc += 1;
        while (/\d/.test(_0x293e89[_0x4371dc] || '')) {
          ((_0x253bf6 = true), (_0x4371dc += 1));
        }
      }
      if (!_0x253bf6) return NaN;
      return Number(_0x293e89.slice(_0x3124cd, _0x4371dc));
    },
    _0x2c7010 = () => {
      _0x4da266();
      const _0x2498b6 = _0x293e89[_0x4371dc];
      if (_0x2498b6 === '+' || _0x2498b6 === '-') {
        _0x4371dc += 1;
        const _0xed18a1 = _0x2c7010();
        return _0x2498b6 === '-' ? -_0xed18a1 : _0xed18a1;
      }
      if (_0x293e89[_0x4371dc] === '(') {
        _0x4371dc += 1;
        const _0x50c786 = _0x248d11();
        _0x4da266();
        if (_0x293e89[_0x4371dc] !== ')') return NaN;
        return ((_0x4371dc += 1), _0x50c786);
      }
      return _0x7f583f();
    },
    _0x23bc69 = () => {
      let _0x3f92fe = _0x2c7010();
      while (true) {
        _0x4da266();
        const _0x4a7a84 = _0x293e89[_0x4371dc];
        if (_0x4a7a84 !== '*' && _0x4a7a84 !== '/') return _0x3f92fe;
        _0x4371dc += 1;
        const _0x57a4dc = _0x2c7010();
        if (!Number.isFinite(_0x3f92fe) || !Number.isFinite(_0x57a4dc)) return NaN;
        if (_0x4a7a84 === '/' && _0x57a4dc === 0) return NaN;
        _0x3f92fe = _0x4a7a84 === '*' ? _0x3f92fe * _0x57a4dc : _0x3f92fe / _0x57a4dc;
      }
    };
  function _0x248d11() {
    let _0x378483 = _0x23bc69();
    while (true) {
      _0x4da266();
      const _0x2fe748 = _0x293e89[_0x4371dc];
      if (_0x2fe748 !== '+' && _0x2fe748 !== '-') return _0x378483;
      _0x4371dc += 1;
      const _0xa1ca3d = _0x23bc69();
      if (!Number.isFinite(_0x378483) || !Number.isFinite(_0xa1ca3d)) return NaN;
      _0x378483 = _0x2fe748 === '+' ? _0x378483 + _0xa1ca3d : _0x378483 - _0xa1ca3d;
    }
  }
  const _0x370498 = _0x248d11();
  return (_0x4da266(), _0x4371dc === _0x293e89.length && Number.isFinite(_0x370498) ? _0x370498 : NaN);
}
function renderRhVideoParamsIcon() {
  return '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M7 6V4"/><path d="M12 6V4"/><path d="M17 6V4"/><path d="M8 10h1"/><path d="M8 14h1"/><path d="M8 18h1"/><path d="M15 12l4 2-4 2z"/></svg>';
}
function getRhVideoParamsKind(_0x1c5389) {
  if (getFieldById(_0x1c5389, 'rhVideoSeconds')) return 'seconds';
  if (getFieldById(_0x1c5389, 'rhVideoFrames')) return 'frames';
  return 'resolution';
}
function buildRhVideoParamsLabel(_0x497702, _0x110d01) {
  const _0x344882 = getFieldById(_0x497702, 'rhVideoResolution'),
    _0x73e8eb = getFieldById(_0x497702, 'rhVideoFps'),
    _0xd9c9a1 = getFieldById(_0x497702, 'rhVideoFrames'),
    _0xc38b54 = getFieldById(_0x497702, 'rhVideoSeconds'),
    _0x939b91 = _0x344882
      ? normalizeNumberValue(getFieldValue(_0x110d01, _0x344882), Number(_0x344882.defaultValue ?? 0x340), {
          min: 0x340,
        })
      : 0x340;
  if (_0xc38b54) {
    const _0x3b8b77 = _0x73e8eb
        ? normalizeNumberValue(getFieldValue(_0x110d01, _0x73e8eb), Number(_0x73e8eb.defaultValue ?? 24))
        : 24,
      _0x22023e = normalizeNumberValue(
        getFieldValue(_0x110d01, _0xc38b54),
        Number(_0xc38b54.defaultValue ?? 5),
        { min: Number(_0xc38b54.min ?? 1), max: Number(_0xc38b54.max ?? 0x258) },
      );
    return joinMetricLabels([
      ['秒数', _0x22023e],
      ['帧率', _0x3b8b77],
      ['分辨率', _0x939b91],
    ]);
  }
  if (_0xd9c9a1) {
    const _0x5a75e6 = normalizeNumberValue(
        getFieldValue(_0x110d01, _0xd9c9a1),
        Number(_0xd9c9a1.defaultValue ?? 77),
        { min: Number(_0xd9c9a1.min ?? 0), max: Number(_0xd9c9a1.max ?? 0xf423f) },
      ),
      _0x16388e = _0x5a75e6 === 0 ? t('aigenImage.uiSchema.fullLength') : String(_0x5a75e6);
    if (!_0x73e8eb)
      return joinMetricLabels([
        ['帧数', _0x16388e],
        ['分辨率', _0x939b91],
      ]);
    const _0x4076aa = normalizeNumberValue(
      getFieldValue(_0x110d01, _0x73e8eb),
      Number(_0x73e8eb.defaultValue ?? 24),
    );
    return joinMetricLabels([
      ['帧数', _0x16388e],
      ['帧率', _0x4076aa],
      ['分辨率', _0x939b91],
    ]);
  }
  return formatMetricLabel('分辨率', _0x939b91);
}
function getRhVideoParamsAspectRatioField(_0xce5d03) {
  return (
    getFieldById(_0xce5d03, 'rhBerniniAspectRatio') ||
    getFieldById(_0xce5d03, 'aspectRatio') ||
    getFieldByDisplayRole(_0xce5d03, 'aspectRatio')
  );
}
function getRhVideoFpsOptions(_0xc23023, _0x51be7b = {}) {
  if (Array.isArray(_0x51be7b?.rhVideoFpsOptions) && _0x51be7b.rhVideoFpsOptions.length)
    return _0x51be7b.rhVideoFpsOptions
      .map((_0x13773f) => Number(_0x13773f))
      .filter(Number.isFinite)
      .map((_0xbab6ff) => Object.freeze({ value: _0xbab6ff, label: _0xbab6ff + '帧' }));
  return getRenderableOptions(_0xc23023);
}
function renderRhVideoParamsResolutionField(_0x248d58, _0x450325, { buttonClass: _0x1649f0 }) {
  assertSupportedField(_0x248d58);
  const _0x26ebef = normalizeNumberValue(
    getFieldValue(_0x450325, _0x248d58),
    Number(_0x248d58.defaultValue ?? 0x340),
    { min: 0x340 },
  );
  return (
    '<div class="img-rp-quality-area" data-ui-schema-field="' +
    escapeHtmlAttr(_0x248d58.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(_0x248d58?.defaultValue ?? '') +
    '">\n                  <div class="img-rp-section-label">' +
    escapeHtmlAttr(manifestText('分辨率')) +
    '<span class="rh-tip" data-tooltip="' +
    escapeHtmlAttr(manifestText('分辨率越高细节越清晰、边缘更稳定。\n同时显存占用与生成耗时会明显增加。')) +
    '">!</span></div>\n                  <div class="img-rp-quality-segmented rh-video-resolution-seg">\n                    ' +
    (Array.isArray(_0x248d58?.options) ? _0x248d58.options : [])
      .map((_0x3ecf42) => {
        const _0x1648ce = Number(getOptionValue(_0x3ecf42)),
          _0x120168 = Number(_0x26ebef) === Number(_0x1648ce),
          _0x14ef1a =
            _0x248d58?.showHighResolutionOptions === true || Number(_0x1648ce) <= 0x5a0
              ? ''
              : ' dev-mode-only';
        return (
          '<button type="button" class="img-rp-quality-item' +
          _0x14ef1a +
          ' ' +
          (_0x120168 ? 'active' : '') +
          ' ' +
          _0x1649f0 +
          ' ui-schema-option" data-value="' +
          escapeHtmlAttr(_0x1648ce) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(_0x1648ce) +
          '">' +
          escapeHtmlAttr(_0x1648ce) +
          '</button>'
        );
      })
      .join('') +
    '\n                  </div>\n                </div>'
  );
}
function renderRhVideoParamsFpsRow(_0x2ab827, _0x26fe7b, _0x252b12 = {}) {
  assertSupportedField(_0x2ab827);
  const _0x5d6384 = normalizeNumberValue(
      getFieldValue(_0x26fe7b, _0x2ab827),
      Number(_0x2ab827.defaultValue ?? 24),
    ),
    _0x20eee6 = _0x252b12?.buttonClass || 'rh-v5-fps-btn',
    _0x5cac27 = _0x252b12?.hidden ? ' hidden' : '';
  return (
    '<div class="rh-vram-adv-row"' +
    _0x5cac27 +
    '>\n                    <div class="rh-vram-adv-label">\n                      <span>' +
    escapeHtmlAttr(manifestText('帧率')) +
    '</span>\n                      <span class="rh-tip" data-tooltip="' +
    escapeHtmlAttr(
      manifestText(
        '帧率越高运动更顺滑、动作更连贯。\n但生成更慢、成本更高。\n常用 24 帧；想更快或更省可选 16 帧。',
      ),
    ) +
    '">!</span>\n                    </div>\n                    <div class="img-rp-quality-segmented rh-adv-seg rh-v5-fps-seg" data-ui-schema-field="' +
    escapeHtmlAttr(_0x2ab827.id) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(_0x2ab827?.defaultValue ?? '') +
    '">\n                      ' +
    getRhVideoFpsOptions(_0x2ab827, _0x252b12)
      .map((_0x2d318e) => {
        const _0x181cc2 = Number(getOptionValue(_0x2d318e)),
          _0x3e58b8 = manifestText(_0x2d318e?.label ?? _0x181cc2 + '帧');
        return (
          '<button type="button" class="img-rp-quality-item ' +
          _0x20eee6 +
          ' ' +
          (Number(_0x5d6384) === Number(_0x181cc2) ? 'active' : '') +
          ' ui-schema-option" data-value="' +
          escapeHtmlAttr(_0x181cc2) +
          '" data-ui-schema-value="' +
          escapeHtmlAttr(_0x181cc2) +
          '">' +
          escapeHtmlAttr(_0x3e58b8) +
          '</button>'
        );
      })
      .join('') +
    '\n                    </div>\n                  </div>'
  );
}
function renderRhVideoParamsStepperRow(_0x16df03, _0x2430dd, _0x4c5de7 = {}) {
  assertSupportedField(_0x16df03);
  const _0x1a713f = String(_0x16df03?.id || '').trim(),
    _0x13e046 = _0x1a713f === 'rhVideoFrames',
    _0x225e8f = Number(_0x16df03?.min ?? (_0x13e046 ? 0 : 1)),
    _0x39ed45 = Number(_0x16df03?.max ?? (_0x13e046 ? 0xf423f : 0x258)),
    _0x36c35c = Number(_0x16df03?.defaultValue ?? (_0x13e046 ? 77 : 5)),
    _0x289481 = normalizeNumberValue(getFieldValue(_0x2430dd, _0x16df03), _0x36c35c, {
      min: _0x225e8f,
      max: _0x39ed45,
    }),
    _0x212cfa = Number(_0x2430dd?.rhVideoSourceFrameCount || 0),
    _0x5ec95c = _0x13e046 ? 'rh-v5-frames-stepper' : 'rh-ltx-seconds-stepper',
    _0x3ddad2 = manifestText(_0x13e046 ? '生成时长（帧数）' : '生成秒数'),
    _0x4fe969 = manifestText(
      _0x13e046
        ? '帧数决定生成片段的长度：数值越大视频越长、耗时越高。\n填 0 表示按源视频全长处理（适合整段替换）。'
        : '秒数决定生成视频的时长：数值越大视频越长、耗时与成本越高。',
    ),
    _0x4141c9 = _0x13e046 && _0x289481 === 0 ? t('aigenImage.uiSchema.fullLength') : String(_0x289481);
  return (
    '<div class="rh-vram-adv-row ui-schema-rh-video-stepper" data-ui-schema-field="' +
    escapeHtmlAttr(_0x1a713f) +
    '" data-ui-schema-type="stepper" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(_0x16df03?.defaultValue ?? '') +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(_0x225e8f) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(_0x39ed45) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(_0x16df03?.step ?? 1) +
    '">\n                    <div class="rh-vram-adv-label">\n                      <span>' +
    _0x3ddad2 +
    '</span>\n                      <span class="rh-tip" data-tooltip="' +
    _0x4fe969 +
    '">!</span>\n                    </div>\n                    <div class="rh-stepper ' +
    _0x5ec95c +
    '">\n                      ' +
    (_0x13e046
      ? '<div class="rh-v5-source-framecount" aria-label="' +
        escapeHtmlAttr(manifestText('源视频总帧数')) +
        '">' +
        (_0x212cfa ? String(_0x212cfa) : '—') +
        '</div>'
      : '') +
    '\n                      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
    escapeHtmlAttr(manifestText(_0x13e046 ? '生成帧数' : '生成秒数')) +
    '" aria-valuenow="' +
    escapeHtmlAttr(_0x289481) +
    '" tabindex="0">' +
    escapeHtmlAttr(_0x4141c9) +
    '</div>\n                    </div>\n                  </div>'
  );
}
function renderRhVideoParamsPlacementFields(_0x3c689c, _0x375aac, _0x12e8c6 = {}) {
  const _0x7c5da0 = getFieldById(_0x3c689c, 'rhVideoResolution');
  if (!_0x7c5da0) return _0x3c689c.map((_0x4f891b) => renderField(_0x4f891b, _0x375aac, _0x12e8c6)).join('');
  const _0x7d1bef = getFieldById(_0x3c689c, 'rhVideoFps'),
    _0x150b36 = getFieldById(_0x3c689c, 'rhVideoFrames'),
    _0x162b61 = getFieldById(_0x3c689c, 'rhVideoSeconds'),
    _0x499446 = getRhVideoParamsAspectRatioField(_0x3c689c),
    _0x2ce743 = getRhVideoParamsKind(_0x3c689c),
    _0x3c56b6 = _0x2ce743 === 'seconds',
    _0x3ce786 = Boolean(_0x150b36 && !_0x7d1bef),
    _0x3d21a7 = _0x3c56b6 ? 'rh-ltx-res-btn' : 'rh-v5-res-btn',
    _0xc31cb0 = _0x3c56b6 ? 'rh-ltx-fps-btn' : 'rh-v5-fps-btn',
    _0x159d27 = buildRhVideoParamsLabel(_0x3c689c, _0x375aac),
    _0x3d516e = _0x3c56b6 ? 'rh-ltx-meta-panel' : 'rh-v5-meta-panel',
    _0x441acf = _0x3c56b6
      ? '' +
        (_0x7d1bef
          ? renderRhVideoParamsFpsRow(_0x7d1bef, _0x375aac, { ..._0x12e8c6, buttonClass: _0xc31cb0 })
          : '') +
        (_0x162b61 ? renderRhVideoParamsStepperRow(_0x162b61, _0x375aac, _0x12e8c6) : '')
      : '' +
        (_0x7d1bef
          ? renderRhVideoParamsFpsRow(_0x7d1bef, _0x375aac, { ..._0x12e8c6, buttonClass: _0xc31cb0 })
          : '') +
        (_0x3ce786 && _0x12e8c6?.preserveHiddenFpsRow ? '' : '') +
        (_0x150b36 ? renderRhVideoParamsStepperRow(_0x150b36, _0x375aac, _0x12e8c6) : ''),
    _0x33c40f = new Set(['rhVideoResolution', 'rhVideoFps', 'rhVideoFrames', 'rhVideoSeconds']),
    _0x54d46d = String(_0x499446?.id || '').trim();
  if (_0x54d46d) _0x33c40f.add(_0x54d46d);
  const _0x19d71a = _0x3c689c.filter((_0x5806b3) => !_0x33c40f.has(String(_0x5806b3?.id || '').trim())),
    _0x2bf992 =
      _0x3ce786 && _0x12e8c6?.preserveHiddenFpsRow
        ? renderRhVideoParamsFpsRow(
            {
              id: 'rhVideoFps',
              type: 'segmented',
              label: '帧率',
              defaultValue: 24,
              options: Object.freeze([
                Object.freeze({ value: 16, label: '16帧' }),
                Object.freeze({ value: 24, label: '24帧' }),
              ]),
            },
            { generationParams: { rhVideoFps: 24 } },
            { ..._0x12e8c6, buttonClass: _0xc31cb0, hidden: true },
          )
        : '',
    _0x5c8408 =
      '<div class="img-ratio-wrap ui-schema-rh-video-params" style="position:relative;" data-ui-schema-composite-field="rhVideoParams">\n              <button type="button" class="img-pill-btn img-ratio-btn">\n                <span class="img-ratio-icon-slot">' +
      renderRhVideoParamsIcon() +
      '</span>\n                <span class="img-ratio-label">' +
      escapeHtmlAttr(_0x159d27) +
      '</span>\n              </button>\n              <div class="img-ratio-popup" style="display:none;">\n                ' +
      renderRhVideoParamsResolutionField(_0x7c5da0, _0x375aac, { buttonClass: _0x3d21a7 }) +
      '\n                <div class="' +
      _0x3d516e +
      '" style="display:flex;flex-direction:column;gap:10px;">\n                  ' +
      _0x2bf992 +
      _0x441acf +
      '\n                </div>\n                ' +
      (_0x499446 ? renderRatioButtons(_0x499446, getFieldValue(_0x375aac, _0x499446), _0x375aac) : '') +
      '\n              </div>\n            </div>';
  return [..._0x19d71a.map((_0x3f8672) => renderField(_0x3f8672, _0x375aac, _0x12e8c6)), _0x5c8408].join('');
}
function renderFloatingMenuItems(_0x3bb464, _0x1fe866, _0x86245e = {}) {
  const _0x2a7e24 = getVisibleOptions(_0x3bb464, _0x86245e);
  return _0x2a7e24
    .map((_0x306a15) => {
      const _0x38fc44 = String(_0x306a15?.value ?? _0x306a15),
        _0x2e3b47 = manifestText(_0x306a15?.label ?? _0x38fc44),
        _0x48c3af = getDisplayLabelFromOption(_0x306a15, _0x2e3b47),
        _0x1d6ab5 = manifestText(_0x306a15?.tooltip || '').trim(),
        _0x4014f0 = String(_0x1fe866 ?? '') === _0x38fc44,
        _0x4ddc80 = isOptionDisabled(_0x3bb464, _0x306a15, _0x86245e),
        _0x2d2fc4 = _0x1d6ab5
          ? ' title="' + escapeHtmlAttr(_0x1d6ab5) + '" data-tooltip="' + escapeHtmlAttr(_0x1d6ab5) + '"'
          : '',
        _0x2f0e8d = _0x1d6ab5
          ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' +
            escapeHtmlAttr(_0x1d6ab5) +
            '">!</span>'
          : '';
      return (
        '<div class="floating-menu-item ' +
        (_0x4014f0 ? 'active' : '') +
        ' ' +
        (_0x4ddc80 ? 'disabled' : '') +
        '" data-ui-schema-value="' +
        escapeHtmlAttr(_0x38fc44) +
        '" data-ui-schema-option-label="' +
        escapeHtmlAttr(_0x48c3af) +
        '"' +
        _0x2d2fc4 +
        getOptionDisabledAttrs(_0x3bb464, _0x306a15, { button: false, nodeData: _0x86245e }) +
        '><span class="floating-menu-label">' +
        escapeHtmlAttr(_0x2e3b47) +
        '</span>' +
        _0x2f0e8d +
        '</div>'
      );
    })
    .join('');
}
function renderPillMenuField(_0x1aeadb, _0x224b94) {
  const _0x1cf508 = String(_0x1aeadb?.id || '').trim(),
    _0x4ab894 = getFieldValue(_0x224b94, _0x1aeadb),
    _0x37d2d9 = getOptionLabel(_0x1aeadb, _0x4ab894),
    _0x3ad4dd = manifestText(_0x1aeadb?.menuTitle || '').trim(),
    _0x3d0bca =
      _0x3ad4dd || (_0x1aeadb?.showMenuTitle === true ? manifestText(_0x1aeadb?.label || '').trim() : ''),
    _0x18c3ef = _0x1aeadb?.menuTooltipByValue,
    _0x402ce3 = String(_0x1aeadb?.menuTooltipField || '').trim(),
    _0x5cdb88 = _0x402ce3 ? String(getNodeFieldValue(_0x224b94, _0x402ce3, '') || '').trim() : '',
    _0x43c093 =
      _0x18c3ef && typeof _0x18c3ef === 'object' && !Array.isArray(_0x18c3ef) ? _0x18c3ef[_0x5cdb88] : '',
    _0x16279f = manifestText(_0x43c093 || _0x1aeadb?.menuTooltip || _0x1aeadb?.tooltip || '').trim(),
    _0x33aaaf = _0x16279f
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' + escapeHtmlAttr(_0x16279f) + '">!</span>'
      : '',
    _0x5da4c9 = _0x3d0bca
      ? '<div class="floating-menu-title ui-schema-floating-menu-title">' +
        escapeHtmlAttr(_0x3d0bca) +
        _0x33aaaf +
        '</div>'
      : '',
    _0x2ed913 = isFieldDisabled(_0x1aeadb)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : '';
  return (
    '<div class="ui-schema-field ui-schema-pill-menu" data-ui-schema-field="' +
    escapeHtmlAttr(_0x1cf508) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x1aeadb?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(_0x1cf508) +
    '"' +
    _0x2ed913 +
    '>\n      <span class="ui-schema-pill-label">' +
    escapeHtmlAttr(_0x37d2d9) +
    '</span>\n    </button>\n    <div class="floating-menu ui-schema-floating-menu">\n      ' +
    _0x5da4c9 +
    '\n      ' +
    renderFloatingMenuItems(_0x1aeadb, _0x4ab894, _0x224b94) +
    '\n    </div>\n  </div>'
  );
}
function renderResolutionPillField(_0x482cf6, _0x1d918d) {
  const _0x4ee37e = String(_0x482cf6?.id || '').trim(),
    _0x4eaeaf = getFieldValue(_0x1d918d, _0x482cf6),
    _0x27bdfa = getVisibleOptions(_0x482cf6, _0x1d918d),
    _0x979a96 = _0x27bdfa.map((_0x1f2124) => Number(_0x1f2124?.value ?? _0x1f2124)).filter(Number.isFinite),
    _0x8e66b8 = Number.isFinite(Number(_0x4eaeaf))
      ? Number(_0x4eaeaf)
      : Number(_0x482cf6?.defaultValue ?? _0x979a96[0] ?? 0),
    _0x1f0427 = Math.max(0, _0x979a96.indexOf(_0x8e66b8)),
    _0x1584bd = Math.max(0, _0x979a96.length - 1),
    _0x1f5003 = manifestText(_0x482cf6?.label || 'Resolution'),
    _0x50620d = manifestText(_0x482cf6?.description || _0x482cf6?.tooltip || '').trim(),
    _0x3c32e9 =
      _0x50620d && _0x482cf6?.showInfoTip === true
        ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' + escapeHtmlAttr(_0x50620d) + '">!</span>'
        : '';
  return (
    '<div class="ui-schema-field ui-schema-resolution-pill" data-ui-schema-field="' +
    escapeHtmlAttr(_0x4ee37e) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(_0x482cf6?.defaultValue ?? '') +
    '" data-ui-schema-range-values="' +
    escapeHtmlAttr(_0x979a96.join(',')) +
    '">\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(_0x4ee37e) +
    '">\n      <span class="ui-schema-pill-label ui-schema-resolution-label">\n        <span class="ui-schema-resolution-title">' +
    escapeHtmlAttr(_0x1f5003) +
    '</span>\n        <span class="ui-schema-resolution-value">' +
    escapeHtmlAttr(_0x8e66b8) +
    '</span>\n      </span>\n    </button>\n    <div class="rh-res-popup ui-schema-popup" style="display:none;">\n      <div class="rh-res-title">' +
    escapeHtmlAttr(_0x1f5003) +
    _0x3c32e9 +
    '</div>\n      <input type="range" class="rh-res-slider ui-schema-range-index" data-ui-schema-input="' +
    escapeHtmlAttr(_0x4ee37e) +
    '" min="0" max="' +
    escapeHtmlAttr(_0x1584bd) +
    '" step="1" value="' +
    escapeHtmlAttr(_0x1f0427) +
    '">\n      <div class="rh-res-ticks">' +
    _0x979a96.map((_0x32076f) => '<span>' + escapeHtmlAttr(_0x32076f) + '</span>').join('') +
    '</div>\n    </div>\n  </div>'
  );
}
function findRangeValueIndex(_0x5f2930, _0x5d9799) {
  const _0x37066a = Number(_0x5d9799);
  if (!Number.isFinite(_0x37066a) || !Array.isArray(_0x5f2930)) return -1;
  return _0x5f2930.findIndex((_0x49c5b3) => Math.abs(Number(_0x49c5b3) - _0x37066a) < 0.000001);
}
function parseRangeValuesFromFieldEl(_0x42d99e) {
  const _0x221ae7 = String(_0x42d99e?.dataset?.uiSchemaRangeValues || '').trim();
  if (!_0x221ae7) return [];
  return _0x221ae7
    .split(',')
    .map((_0x5c6d0d) => Number(_0x5c6d0d))
    .filter(Number.isFinite);
}
function parseRangeLabelsFromFieldEl(_0x4b49ab) {
  const _0x39277a = String(_0x4b49ab?.dataset?.uiSchemaRangeLabels || '').trim();
  if (!_0x39277a) return [];
  try {
    const _0x496801 = JSON.parse(_0x39277a);
    return Array.isArray(_0x496801) ? _0x496801.map((_0x3fc104) => String(_0x3fc104)) : [];
  } catch {
    return [];
  }
}
function getRangeValueDisplayLabel(_0x230c16, _0x15619e, _0x483437 = '') {
  const _0x1aab90 = parseRangeLabelsFromFieldEl(_0x230c16);
  if (_0x1aab90.length === 0) return _0x483437 || String(_0x15619e ?? '');
  const _0x12e2a0 = parseRangeValuesFromFieldEl(_0x230c16),
    _0x174dd4 = findRangeValueIndex(_0x12e2a0, _0x15619e);
  return _0x174dd4 >= 0 && _0x1aab90[_0x174dd4] ? _0x1aab90[_0x174dd4] : _0x483437 || String(_0x15619e ?? '');
}
function getDurationOptionEntries(_0x114bd8, _0x989396 = {}) {
  return getVisibleOptions(_0x114bd8, _0x989396)
    .map((_0xa7758c) => {
      const _0x270bc = _0xa7758c && typeof _0xa7758c === 'object' && !Array.isArray(_0xa7758c),
        _0x53dfd3 = Number(_0x270bc ? _0xa7758c.value : _0xa7758c);
      if (!Number.isFinite(_0x53dfd3)) return null;
      const _0x290112 = String(
        _0x270bc ? getDisplayLabelFromOption(_0xa7758c, _0x53dfd3 + 'S') : _0x53dfd3 + 'S',
      );
      return { value: _0x53dfd3, label: _0x290112 };
    })
    .filter(Boolean);
}
function renderDurationPillField(_0x64d767, _0x2bec89) {
  const _0x4f9811 = String(_0x64d767?.id || '').trim(),
    _0x596309 = getFieldValue(_0x2bec89, _0x64d767),
    _0x4890c6 = getDurationOptionEntries(_0x64d767, _0x2bec89),
    _0x624afb = _0x4890c6.map((_0x4304b9) => _0x4304b9.value),
    _0x15c6f6 = _0x624afb.length > 0,
    _0x1b4e4a = Number(_0x64d767?.min ?? 1),
    _0x493fd5 = Number(_0x64d767?.max ?? 15),
    _0x135d58 = Number(_0x64d767?.step ?? 1),
    _0x2992ee = Number.isFinite(Number(_0x596309))
      ? Number(_0x596309)
      : Number(_0x64d767?.defaultValue ?? _0x1b4e4a),
    _0x570480 = Math.max(0, findRangeValueIndex(_0x624afb, _0x2992ee)),
    _0x3939f6 = _0x15c6f6 ? 0 : _0x1b4e4a,
    _0x281bfc = _0x15c6f6 ? Math.max(0, _0x624afb.length - 1) : _0x493fd5,
    _0x3cd0a0 = _0x15c6f6 ? 1 : _0x135d58,
    _0x554f9d = _0x15c6f6 ? _0x570480 : _0x2992ee,
    _0xd8010 = _0x15c6f6 && _0x4890c6[_0x570480]?.label ? _0x4890c6[_0x570480].label : _0x2992ee + 'S',
    _0x1f1757 = _0x15c6f6 ? _0x4890c6[0]?.label : _0x1b4e4a + 'S',
    _0x19e6d1 = _0x15c6f6 ? _0x4890c6[_0x4890c6.length - 1]?.label : _0x493fd5 + 'S',
    _0x31c449 = _0x15c6f6 ? ' data-ui-schema-range-values="' + escapeHtmlAttr(_0x624afb.join(',')) + '"' : '',
    _0x5d56f6 = _0x15c6f6
      ? ' data-ui-schema-range-labels="' +
        escapeHtmlAttr(JSON.stringify(_0x4890c6.map((_0x2ffab9) => _0x2ffab9.label))) +
        '"'
      : '',
    _0x330228 = isFieldDisabled(_0x64d767)
      ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"'
      : '';
  return (
    '<div class="ui-schema-field ui-schema-duration-pill" data-ui-schema-field="' +
    escapeHtmlAttr(_0x4f9811) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(_0x64d767?.defaultValue ?? '') +
    '"' +
    _0x31c449 +
    _0x5d56f6 +
    '>\n    <button type="button" class="img-pill-btn ui-schema-menu-trigger" data-ui-schema-menu-trigger="' +
    escapeHtmlAttr(_0x4f9811) +
    '"' +
    _0x330228 +
    '>\n      <span class="ui-schema-pill-label ui-schema-duration-label">' +
    escapeHtmlAttr(_0xd8010) +
    '</span>\n    </button>\n    <div class="floating-menu ui-schema-popup ui-schema-duration-pop">\n      <div class="ui-schema-duration-title">' +
    escapeHtmlAttr(manifestText(_0x64d767?.label || '视频时长')) +
    '</div>\n      <input type="range" class="ui-schema-range ui-schema-duration-slider" data-ui-schema-input="' +
    escapeHtmlAttr(_0x4f9811) +
    '" min="' +
    escapeHtmlAttr(_0x3939f6) +
    '" max="' +
    escapeHtmlAttr(_0x281bfc) +
    '" step="' +
    escapeHtmlAttr(_0x3cd0a0) +
    '" value="' +
    escapeHtmlAttr(_0x554f9d) +
    '">\n      <div class="ui-schema-duration-bounds">\n        <span>' +
    escapeHtmlAttr(_0x1f1757) +
    '</span>\n        <span>' +
    escapeHtmlAttr(_0x19e6d1) +
    '</span>\n      </div>\n    </div>\n  </div>'
  );
}
function renderInstanceToggleField(_0x28ec08, _0x1d7bab) {
  const _0x2fb0ca = String(_0x28ec08?.id || '').trim(),
    _0x92ce38 = String(getFieldValue(_0x1d7bab, _0x28ec08) || _0x28ec08?.defaultValue || ''),
    _0x736e0e = getVisibleOptions(_0x28ec08, _0x1d7bab),
    _0x3d194f = Math.max(
      0,
      _0x736e0e.findIndex((_0x4263c2) => String(_0x4263c2?.value ?? _0x4263c2) === _0x92ce38),
    ),
    _0x3e5ca5 = _0x736e0e[_0x3d194f] || _0x736e0e[0] || {},
    _0x234b84 = _0x736e0e[(_0x3d194f + 1) % Math.max(1, _0x736e0e.length)] || _0x3e5ca5;
  return (
    '<div class="ui-schema-field rh-vram-wrap ui-schema-instance-toggle" data-ui-schema-field="' +
    escapeHtmlAttr(_0x2fb0ca) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x28ec08?.defaultValue ?? '') +
    '">\n    <button type="button" class="img-pill-btn rh-vram-btn" data-ui-schema-value="' +
    escapeHtmlAttr(_0x234b84?.value ?? _0x234b84) +
    '">\n      <span class="rh-vram-label ui-schema-pill-label">' +
    escapeHtmlAttr(_0x3e5ca5?.label ?? _0x3e5ca5?.value ?? _0x92ce38) +
    '</span>\n    </button>\n  </div>'
  );
}
function syncInstanceToggleField(_0x3b1f6a, _0x10f868) {
  if (!_0x3b1f6a?.classList?.contains('ui-schema-instance-toggle')) return;
  const _0x2eaf24 = String(_0x10f868) === 'plus',
    _0x3f04c3 = _0x3b1f6a.querySelector('.ui-schema-pill-label');
  if (_0x3f04c3) _0x3f04c3.textContent = _0x2eaf24 ? '48G' : '24G';
  const _0x4f617f = _0x3b1f6a.querySelector('[data-ui-schema-value]');
  if (_0x4f617f) _0x4f617f.dataset.uiSchemaValue = _0x2eaf24 ? 'default' : 'plus';
}
function syncStepperField(_0x28a415, _0x358496) {
  if (!_0x28a415?.classList?.contains('ui-schema-rh-video-stepper')) return;
  const _0x16f1e0 = Number(_0x28a415.dataset.uiSchemaDefault ?? 0),
    _0x55bc1b = _0x28a415.dataset.uiSchemaMin,
    _0x184f4a = _0x28a415.dataset.uiSchemaMax,
    _0x347554 = normalizeNumberValue(_0x358496, Number.isFinite(_0x16f1e0) ? _0x16f1e0 : 0, {
      min: _0x55bc1b === undefined ? -Infinity : Number(_0x55bc1b),
      max: _0x184f4a === undefined ? Infinity : Number(_0x184f4a),
    }),
    _0x2bb178 = _0x28a415.querySelector('.rh-stepper-value');
  if (!_0x2bb178) return;
  const _0x2cd496 = String(_0x28a415.dataset.uiSchemaField || '').trim();
  ((_0x2bb178.textContent =
    _0x2cd496 === 'rhVideoFrames' && _0x347554 === 0
      ? t('aigenImage.uiSchema.fullLength')
      : String(_0x347554)),
    _0x2bb178.setAttribute('aria-valuenow', String(_0x347554)));
}
function renderSelect(_0x3b2cc1, _0x5b69ff, _0x202dd3 = {}) {
  const _0x1202e8 = getVisibleOptions(_0x3b2cc1, _0x202dd3);
  return (
    '<select class="ui-schema-select" data-ui-schema-input="' +
    escapeHtmlAttr(_0x3b2cc1.id) +
    '">\n    ' +
    _0x1202e8
      .map((_0x4d32e4) => {
        const _0x35e543 = String(_0x4d32e4?.value ?? ''),
          _0x55d52a = String(_0x5b69ff ?? '') === _0x35e543 ? ' selected' : '';
        return (
          '<option value="' +
          escapeHtmlAttr(_0x35e543) +
          '"' +
          _0x55d52a +
          '>' +
          escapeHtmlAttr(_0x4d32e4?.label ?? _0x35e543) +
          '</option>'
        );
      })
      .join('') +
    '\n  </select>'
  );
}
function renderRange(_0x5303f6, _0x18174b, _0x261763, _0x49a2f9 = {}) {
  const _0x16d096 = getVisibleOptions(_0x5303f6, _0x49a2f9),
    _0x47967d = _0x16d096.map((_0x42e5ec) => Number(_0x42e5ec?.value ?? _0x42e5ec)).filter(Number.isFinite),
    _0x2f8308 = Number(_0x5303f6?.defaultValue ?? _0x47967d[0] ?? 0),
    _0x58acb6 = Number.isFinite(Number(_0x18174b)) ? Number(_0x18174b) : _0x2f8308;
  if (_0x261763 === 'stepper') {
    const _0x40a96b = _0x5303f6?.ariaLabel
      ? manifestText(_0x5303f6.ariaLabel)
      : t('aigenImage.uiSchema.numericValueAria', { label: manifestText(_0x5303f6?.label || _0x5303f6.id) });
    return (
      '<div class="rh-stepper" data-key="' +
      escapeHtmlAttr(_0x5303f6.id) +
      '">\n      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
      escapeHtmlAttr(_0x40a96b) +
      '" aria-valuenow="' +
      escapeHtmlAttr(_0x58acb6) +
      '" tabindex="0">' +
      escapeHtmlAttr(_0x58acb6) +
      '</div>\n    </div>'
    );
  }
  const _0x5dea49 = Number(_0x5303f6?.min ?? _0x47967d[0] ?? 0),
    _0x3bba4e = Number(_0x5303f6?.max ?? _0x47967d[_0x47967d.length - 1] ?? _0x5dea49),
    _0x57867d = Number(_0x5303f6?.step ?? 1);
  return (
    '<div class="ui-schema-range-line">\n    <input class="ui-schema-range" data-ui-schema-input="' +
    escapeHtmlAttr(_0x5303f6.id) +
    '" type="range" min="' +
    escapeHtmlAttr(_0x5dea49) +
    '" max="' +
    escapeHtmlAttr(_0x3bba4e) +
    '" step="' +
    escapeHtmlAttr(_0x57867d) +
    '" value="' +
    escapeHtmlAttr(_0x58acb6) +
    '">\n    <span class="ui-schema-value">' +
    escapeHtmlAttr(_0x58acb6) +
    '</span>\n  </div>'
  );
}
function renderStepperAttrs(_0xbb12d3, _0x1b597a) {
  if (_0x1b597a !== 'stepper') return '';
  const _0xe7d3d5 = [];
  return (
    _0xbb12d3?.min !== undefined &&
      _0xbb12d3?.min !== null &&
      _0xe7d3d5.push(' data-ui-schema-min="' + escapeHtmlAttr(_0xbb12d3.min) + '"'),
    _0xbb12d3?.max !== undefined &&
      _0xbb12d3?.max !== null &&
      _0xe7d3d5.push(' data-ui-schema-max="' + escapeHtmlAttr(_0xbb12d3.max) + '"'),
    _0xe7d3d5.push(' data-ui-schema-step="' + escapeHtmlAttr(_0xbb12d3?.step ?? 1) + '"'),
    _0xe7d3d5.join('')
  );
}
function renderTextInput(_0x1db76e, _0x52ff69, _0x192ec0) {
  if (_0x192ec0 === 'textarea')
    return (
      '<textarea class="ui-schema-textarea" data-ui-schema-input="' +
      escapeHtmlAttr(_0x1db76e.id) +
      '">' +
      escapeHtmlAttr(_0x52ff69) +
      '</textarea>'
    );
  return (
    '<input class="ui-schema-text" data-ui-schema-input="' +
    escapeHtmlAttr(_0x1db76e.id) +
    '" type="text" value="' +
    escapeHtmlAttr(_0x52ff69) +
    '">'
  );
}
function renderAssetInput(_0x372464, _0x5196a7) {
  const _0x47bb4b =
    _0x5196a7 === 'video input'
      ? t('aigenImage.uiSchema.assetInput.video')
      : _0x5196a7 === 'audio input'
        ? t('aigenImage.uiSchema.assetInput.audio')
        : t('aigenImage.uiSchema.assetInput.image');
  return (
    '<button type="button" class="img-rp-quality-item ui-schema-asset-input" data-ui-schema-input="' +
    escapeHtmlAttr(_0x372464.id) +
    '" data-ui-schema-asset-kind="' +
    escapeHtmlAttr(_0x5196a7.split(' ')[0]) +
    '">' +
    _0x47bb4b +
    '</button>'
  );
}
function renderAdvancedRowField(_0x4b6414, _0x5a71c7) {
  assertSupportedField(_0x4b6414);
  const _0x18d483 = String(_0x4b6414?.id || '').trim(),
    _0x2c4a61 = normalizeControlType(_0x4b6414?.type),
    _0x5cd81d = getFieldValue(_0x5a71c7, _0x4b6414),
    _0x1a686d = manifestText(_0x4b6414?.label || _0x18d483),
    _0x59aceb = manifestText(_0x4b6414?.description || _0x4b6414?.tooltip || '').trim(),
    _0x3f79b2 = _0x59aceb
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' + escapeHtmlAttr(_0x59aceb) + '">!</span>'
      : '',
    _0x28f114 =
      typeof _0x4b6414?.defaultValue === 'boolean'
        ? ' data-ui-schema-value-type="boolean"'
        : _0x2c4a61 === 'stepper'
          ? ' data-ui-schema-value-type="number"'
          : '',
    _0x37d9e4 = _0x2c4a61 === 'stepper' ? ' ui-schema-rh-video-stepper' : '';
  return (
    '<div class="ui-schema-field rh-vram-adv-row' +
    _0x37d9e4 +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(_0x18d483) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(_0x2c4a61) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(_0x4b6414?.defaultValue ?? '') +
    '"' +
    getFieldDefaultAliasAttrs(_0x4b6414) +
    _0x28f114 +
    renderStepperAttrs(_0x4b6414, _0x2c4a61) +
    '>\n    <div class="rh-vram-adv-label">\n      <span class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(_0x1a686d) +
    '</span>\n      ' +
    _0x3f79b2 +
    '\n    </div>\n    <div class="rh-adv-control-line">' +
    renderControl(_0x4b6414, _0x5cd81d, _0x2c4a61, { advanced: true, nodeData: _0x5a71c7 }) +
    '</div>\n  </div>'
  );
}
function getRandomSeedAttrs(_0x4435e9) {
  const _0x3135b7 = Number.isFinite(Number(_0x4435e9?.randomSeedMin))
      ? Math.trunc(Number(_0x4435e9.randomSeedMin))
      : RANDOM_SEED_DEFAULT_MIN,
    _0xd2dcc1 = Number.isFinite(Number(_0x4435e9?.randomSeedMax))
      ? Math.trunc(Number(_0x4435e9.randomSeedMax))
      : RANDOM_SEED_DEFAULT_MAX,
    _0x45b333 = Math.min(_0x3135b7, _0xd2dcc1),
    _0x1583e6 = Math.max(_0x3135b7, _0xd2dcc1),
    _0x59e806 = String(_0x4435e9?.randomSeedModeField || '').trim(),
    _0x3e424e = String(_0x4435e9?.randomSeedDefaultMode || 'fixed').trim() || 'fixed',
    _0x3b39fe = _0x59e806
      ? ' data-ui-schema-random-seed-mode-field="' +
        escapeHtmlAttr(_0x59e806) +
        '" data-ui-schema-random-seed-mode-default="' +
        escapeHtmlAttr(_0x3e424e) +
        '"'
      : '';
  return (
    ' data-ui-schema-random-seed-min="' +
    escapeHtmlAttr(_0x45b333) +
    '" data-ui-schema-random-seed-max="' +
    escapeHtmlAttr(_0x1583e6) +
    '"' +
    _0x3b39fe
  );
}
function normalizeRandomSeedMode(_0x235e5d, _0x24d12c = 'fixed') {
  const _0x3fcc53 = String(_0x235e5d ?? _0x24d12c)
    .trim()
    .toLowerCase();
  return _0x3fcc53 === 'random' ? 'random' : 'fixed';
}
function getRandomSeedModeFromNodeData(_0x361084, _0x1e5863) {
  const _0x275d16 = String(_0x1e5863?.randomSeedModeField || '').trim();
  return normalizeRandomSeedMode(
    _0x275d16
      ? getNodeFieldValue(_0x361084, _0x275d16, _0x1e5863?.randomSeedDefaultMode || 'fixed')
      : 'fixed',
    _0x1e5863?.randomSeedDefaultMode || 'fixed',
  );
}
function renderRandomSeedModeButtons(_0x49965a, _0x50394c, _0x1db85a) {
  const _0x559dcf = String(_0x49965a?.randomSeedModeField || '').trim(),
    _0x29360a = t('aigenImage.uiSchema.random'),
    _0x58be28 = t('aigenImage.uiSchema.fixed');
  if (!_0x559dcf)
    return (
      '<button type="button" class="img-rp-quality-item ui-schema-random-seed-btn" data-ui-schema-random-seed="true" aria-label="' +
      escapeHtmlAttr(t('aigenImage.uiSchema.randomAria', { label: _0x1db85a })) +
      '">' +
      escapeHtmlAttr(_0x29360a) +
      '</button>'
    );
  const _0x402b6a = [
    { value: 'random', label: _0x29360a },
    { value: 'fixed', label: _0x58be28 },
  ];
  return _0x402b6a
    .map(
      (_0x185a66) =>
        '<button type="button" class="img-rp-quality-item ui-schema-random-seed-mode-btn ' +
        (_0x50394c === _0x185a66.value ? 'active' : '') +
        '" data-ui-schema-random-seed-mode="' +
        escapeHtmlAttr(_0x185a66.value) +
        '" data-ui-schema-random-seed-mode-field="' +
        escapeHtmlAttr(_0x559dcf) +
        '" aria-label="' +
        escapeHtmlAttr('' + _0x1db85a + _0x185a66.label) +
        '">' +
        escapeHtmlAttr(_0x185a66.label) +
        '</button>',
    )
    .join('');
}
function syncRandomSeedField(_0x129c29, _0x2e53e1 = {}) {
  if (!_0x129c29?.classList?.contains?.('ui-schema-random-seed-row')) return;
  const _0x4aba02 = String(_0x129c29.dataset.uiSchemaRandomSeedModeField || '').trim();
  if (!_0x4aba02) return;
  const _0x1102c2 = normalizeRandomSeedMode(
    getNodeFieldValue(_0x2e53e1, _0x4aba02, _0x129c29.dataset.uiSchemaRandomSeedModeDefault || 'fixed'),
    _0x129c29.dataset.uiSchemaRandomSeedModeDefault || 'fixed',
  );
  _0x129c29.querySelectorAll('[data-ui-schema-random-seed-mode]').forEach((_0x3bbeed) => {
    _0x3bbeed.classList.toggle(
      'active',
      String(_0x3bbeed.dataset.uiSchemaRandomSeedMode || '') === _0x1102c2,
    );
  });
}
function renderRandomSeedRowField(_0x1b1d47, _0xef6a99) {
  assertSupportedField(_0x1b1d47);
  const _0x1ebf59 = String(_0x1b1d47?.id || '').trim(),
    _0x822c9d = normalizeControlType(_0x1b1d47?.type),
    _0x43f432 = getFieldValue(_0xef6a99, _0x1b1d47),
    _0x2af153 = getRandomSeedModeFromNodeData(_0xef6a99, _0x1b1d47),
    _0x255a06 = manifestText(_0x1b1d47?.label || _0x1ebf59),
    _0x4679ce = manifestText(_0x1b1d47?.description || _0x1b1d47?.tooltip || '').trim(),
    _0x255ac9 = _0x4679ce
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' + escapeHtmlAttr(_0x4679ce) + '">!</span>'
      : '',
    _0x5d1919 = _0x822c9d === 'stepper' ? ' data-ui-schema-value-type="number"' : '',
    _0x33e6cf = _0x822c9d === 'stepper' ? ' ui-schema-rh-video-stepper' : '';
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-random-seed-row' +
    _0x33e6cf +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(_0x1ebf59) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(_0x822c9d) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(_0x1b1d47?.defaultValue ?? '') +
    '"' +
    getFieldDefaultAliasAttrs(_0x1b1d47) +
    _0x5d1919 +
    renderStepperAttrs(_0x1b1d47, _0x822c9d) +
    getRandomSeedAttrs(_0x1b1d47) +
    '>\n    <div class="rh-vram-adv-label">\n      <span class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(_0x255a06) +
    '</span>\n      ' +
    _0x255ac9 +
    '\n    </div>\n    <div class="rh-adv-control-line">\n      ' +
    renderRandomSeedModeButtons(_0x1b1d47, _0x2af153, _0x255a06) +
    '\n      ' +
    renderControl(_0x1b1d47, _0x43f432, _0x822c9d, { advanced: true, nodeData: _0xef6a99 }) +
    '\n    </div>\n  </div>'
  );
}
function normalizeRhV54SinglePreset(_0x18ce6a, _0x9df433 = 'efficiency') {
  const _0x5e5494 = String(_0x18ce6a ?? '').trim();
  return _0x5e5494 === 'efficiency' || _0x5e5494 === 'stable' || _0x5e5494 === 'quality'
    ? _0x5e5494
    : _0x9df433;
}
function normalizeRhV54SpecialMode(_0x19ced5) {
  const _0x4fee77 = String(_0x19ced5 ?? '').trim();
  return _0x4fee77 === 'longVideoOverlay' || _0x4fee77 === 'cameraMove' ? _0x4fee77 : '';
}
function normalizeRhV54MaskExpand(_0x31ad75, _0x1c3ab8 = 25) {
  const _0xfa079f = Number(_0x31ad75);
  return Number.isFinite(_0xfa079f) ? Math.max(-0x270f, Math.min(0x270f, Math.trunc(_0xfa079f))) : _0x1c3ab8;
}
function getStepPrecision(_0x10faad) {
  const _0x43ae60 = String(_0x10faad ?? ''),
    _0x3d5010 = _0x43ae60.includes('.') ? _0x43ae60.split('.')[1] : '';
  return Math.min(Math.max(_0x3d5010.length, 0), 8);
}
function normalizeRhV54BreastJiggle(
  _0x4433dd,
  { min: min = 0, max: max = 1, step: step = 0.05, fallback: fallback = 0 } = {},
) {
  const _0x13c669 = Number(_0x4433dd),
    _0x336f73 = Number(fallback),
    _0x1394fd = Number(min),
    _0x31ff53 = Number(max),
    _0x3fe7f4 = Number(step),
    _0x4dce3b = Number.isFinite(_0x1394fd) ? _0x1394fd : 0,
    _0x4f3d35 = Number.isFinite(_0x31ff53) ? _0x31ff53 : 1,
    _0x2381a7 = Number.isFinite(_0x336f73) ? _0x336f73 : _0x4dce3b,
    _0x452ec1 = Math.max(
      Math.min(_0x4dce3b, _0x4f3d35),
      Math.min(Math.max(_0x4dce3b, _0x4f3d35), Number.isFinite(_0x13c669) ? _0x13c669 : _0x2381a7),
    );
  if (!Number.isFinite(_0x3fe7f4) || _0x3fe7f4 <= 0) return _0x452ec1;
  const _0x1b6bd6 = _0x4dce3b + Math.round((_0x452ec1 - _0x4dce3b) / _0x3fe7f4) * _0x3fe7f4;
  return Math.max(Math.min(_0x4dce3b, _0x4f3d35), Math.min(Math.max(_0x4dce3b, _0x4f3d35), _0x1b6bd6));
}
function formatRhV54BreastJiggle(_0x12f748, _0x3a8106 = {}) {
  const _0x51e789 = normalizeRhV54BreastJiggle(_0x12f748, _0x3a8106);
  return String(Number(_0x51e789.toFixed(getStepPrecision(_0x3a8106.step ?? 0.05))));
}
function getRhV54BreastJiggleRangeFromFieldEl(_0x4e44d5) {
  const _0x1cb564 = Number(_0x4e44d5?.dataset?.uiSchemaMin ?? 0),
    _0x1436c5 = Number(_0x4e44d5?.dataset?.uiSchemaMax ?? 1),
    _0x1771f5 = Number(_0x4e44d5?.dataset?.uiSchemaStep ?? 0.05),
    _0x459c33 = Number(_0x4e44d5?.dataset?.uiSchemaDefault ?? _0x1cb564);
  return { min: _0x1cb564, max: _0x1436c5, step: _0x1771f5, fallback: _0x459c33 };
}
function renderRhV54FieldLabel(_0x34ebd6) {
  const _0x1225d5 = String(_0x34ebd6?.id || '').trim(),
    _0x792b52 = manifestText(_0x34ebd6?.label || _0x1225d5),
    _0x2d0704 = manifestText(_0x34ebd6?.description || _0x34ebd6?.tooltip || '').trim(),
    _0x4fc041 = _0x2d0704
      ? '<span class="rh-tip ui-schema-info-tip" data-tooltip="' + escapeHtmlAttr(_0x2d0704) + '">!</span>'
      : '';
  return (
    '<div class="rh-vram-adv-label"><span>' + escapeHtmlAttr(_0x792b52) + '</span>' + _0x4fc041 + '</div>'
  );
}
function renderRhV54SegmentButton({
  key: _0x28d76e,
  value: _0x16df83,
  label: _0x271375,
  active: _0x526b28,
  disabled: disabled = false,
  attrs: attrs = '',
}) {
  const _0x48a253 =
      attrs || (disabled ? ' disabled aria-disabled="true" data-ui-schema-disabled="true"' : ''),
    _0xaefb66 = [
      'img-rp-quality-item',
      'rh-adv-seg-btn',
      _0x526b28 ? 'active' : '',
      disabled ? 'disabled' : '',
    ]
      .filter(Boolean)
      .join(' ');
  return (
    '<button type="button" class="' +
    _0xaefb66 +
    '" data-key="' +
    escapeHtmlAttr(_0x28d76e) +
    '" data-value="' +
    escapeHtmlAttr(_0x16df83) +
    '" data-ui-schema-value="' +
    escapeHtmlAttr(_0x16df83) +
    '"' +
    _0x48a253 +
    '>' +
    escapeHtmlAttr(_0x271375) +
    '</button>'
  );
}
function renderAdvancedSelectionControl(_0x3721a4, _0x4fc75b, _0x216acf = {}) {
  const _0x5d4727 = String(_0x3721a4?.id || '').trim(),
    _0x147ccd = normalizeControlType(_0x3721a4?.type),
    _0x54660b = [
      Object.freeze({ value: true, label: t('aigenImage.uiSchema.yes') }),
      Object.freeze({ value: false, label: t('aigenImage.uiSchema.no') }),
    ],
    _0x4edf30 =
      _0x147ccd === 'toggle' && !Array.isArray(_0x3721a4?.options)
        ? _0x54660b
        : getVisibleOptions(_0x3721a4, _0x216acf),
    _0x3d3434 = _0x4edf30.length ? _0x4edf30 : _0x54660b;
  return (
    '<div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    _0x3d3434
      .map((_0x2e847a) => {
        const _0x229f67 = getOptionValue(_0x2e847a),
          _0x49c348 = manifestText(_0x2e847a?.label ?? _0x229f67),
          _0x2ca18b = String(_0x4fc75b ?? '') === _0x229f67,
          _0x108ed6 = isOptionDisabled(_0x3721a4, _0x2e847a, _0x216acf);
        return renderRhV54SegmentButton({
          key: _0x5d4727,
          value: _0x229f67,
          label: _0x49c348,
          active: _0x2ca18b,
          disabled: _0x108ed6,
          attrs: getOptionDisabledAttrs(_0x3721a4, _0x2e847a, { nodeData: _0x216acf }),
        });
      })
      .join('') +
    '\n    </div>'
  );
}
function renderRhV54ControlModeField(_0x24f8a1, _0x44bce8) {
  assertSupportedField(_0x24f8a1);
  const _0x4e4817 = String(_0x24f8a1?.id || '').trim(),
    _0x10d38c = String(getNodeFieldValue(_0x44bce8, 'rhControlMode', 'single') || 'single'),
    _0xd99159 = normalizeRhV54SinglePreset(
      getNodeFieldValue(_0x44bce8, 'rhSingleControlPreset', _0x24f8a1?.defaultValue),
      String(_0x24f8a1?.defaultValue || 'efficiency'),
    ),
    _0x88a435 = _0x10d38c === 'multi' ? 'multi' : _0xd99159;
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-control-mode" data-ui-schema-field="' +
    escapeHtmlAttr(_0x4e4817) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x24f8a1?.defaultValue ?? '') +
    '">\n    ' +
    renderRhV54FieldLabel(_0x24f8a1) +
    '\n    <div class="rh-adv-control-line">\n      <div class="rh-adv-single-group ' +
    (_0x10d38c !== 'multi' ? 'active' : '') +
    '">\n        <span class="rh-adv-single-title">' +
    escapeHtmlAttr(t('aigenImage.uiSchema.singleControl')) +
    '</span>\n        <span class="rh-adv-single-colon" aria-hidden="true">' +
    escapeHtmlAttr(t('aigenImage.uiSchema.controlColon')) +
    '</span>\n        <div class="img-rp-quality-segmented rh-adv-seg rh-adv-control-seg">\n          ' +
    renderRhV54SegmentButton({
      key: 'rhSingleControlPreset',
      value: 'efficiency',
      label: t('aigenImage.uiSchema.efficiency'),
      active: _0x88a435 === 'efficiency',
    }) +
    '\n          ' +
    renderRhV54SegmentButton({
      key: 'rhSingleControlPreset',
      value: 'stable',
      label: t('aigenImage.uiSchema.stable'),
      active: _0x88a435 === 'stable',
    }) +
    '\n        </div>\n      </div>\n      <span class="rh-adv-control-split" aria-hidden="true"></span>\n      <div class="rh-adv-multi-group ' +
    (_0x10d38c === 'multi' ? 'active' : '') +
    '">\n        ' +
    renderRhV54SegmentButton({
      key: 'rhControlMode',
      value: 'multi',
      label: t('aigenImage.uiSchema.multiControl'),
      active: _0x88a435 === 'multi',
    }) +
    '\n      </div>\n    </div>\n  </div>'
  );
}
function renderRhV54BooleanRowField(_0x37f363, _0x17b68e) {
  assertSupportedField(_0x37f363);
  const _0x3b1346 = String(_0x37f363?.id || '').trim(),
    _0x48428 =
      _0x37f363?.disableWhenSpecialMode === 'cameraMove' &&
      normalizeRhV54SpecialMode(getNodeFieldValue(_0x17b68e, 'rhSpecialMode', '')) === 'cameraMove',
    _0x281162 = _0x3b1346 === 'rhSubtractSubject' && _0x17b68e?.rhV54HasMaskVideo === true,
    _0x265f6d = _0x281162 ? false : getNodeFieldValue(_0x17b68e, _0x3b1346, _0x37f363?.defaultValue) === true;
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-boolean-row ' +
    (_0x48428 || _0x281162 ? 'is-rh-disabled' : '') +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(_0x3b1346) +
    '" data-ui-schema-type="segmented" data-ui-schema-value-type="boolean" data-ui-schema-default="' +
    escapeHtmlAttr(_0x37f363?.defaultValue ?? '') +
    '"' +
    (_0x37f363?.disableWhenSpecialMode
      ? ' data-rh-v54-disable-on-special="' + escapeHtmlAttr(_0x37f363.disableWhenSpecialMode) + '"'
      : '') +
    (_0x281162 ? ' data-rh-v54-disable-on-mask-video="true"' : '') +
    '>\n    ' +
    renderRhV54FieldLabel(_0x37f363) +
    '\n    <div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    renderRhV54SegmentButton({
      key: _0x3b1346,
      value: 'true',
      label: t('aigenImage.uiSchema.yes'),
      active: _0x265f6d,
    }) +
    '\n      ' +
    renderRhV54SegmentButton({
      key: _0x3b1346,
      value: 'false',
      label: t('aigenImage.uiSchema.no'),
      active: !_0x265f6d,
    }) +
    '\n    </div>\n  </div>'
  );
}
function renderRhV54MaskExpandField(_0x2ee7e1, _0x7eb77a) {
  assertSupportedField(_0x2ee7e1);
  const _0x259a57 = String(_0x2ee7e1?.id || '').trim(),
    _0x361660 = getNodeFieldValue(_0x7eb77a, _0x259a57, _0x2ee7e1?.defaultValue ?? 25),
    _0x2aafef = normalizeRhV54MaskExpand(_0x361660, Number(_0x2ee7e1?.defaultValue ?? 25)),
    _0x46ba09 = _0x2ee7e1?.ariaLabel
      ? manifestText(_0x2ee7e1.ariaLabel)
      : t('aigenImage.uiSchema.numericValueAria', { label: manifestText(_0x2ee7e1?.label || _0x259a57) }),
    _0x1aa44b =
      _0x2ee7e1?.disableWhenSpecialMode === 'cameraMove' &&
      normalizeRhV54SpecialMode(getNodeFieldValue(_0x7eb77a, 'rhSpecialMode', '')) === 'cameraMove';
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-mask-expand ' +
    (_0x1aa44b ? 'is-rh-disabled' : '') +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(_0x259a57) +
    '" data-ui-schema-type="stepper" data-ui-schema-value-type="number" data-ui-schema-default="' +
    escapeHtmlAttr(_0x2ee7e1?.defaultValue ?? '') +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(_0x2ee7e1?.min ?? -0x270f) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(_0x2ee7e1?.max ?? 0x270f) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(_0x2ee7e1?.step ?? 1) +
    '"' +
    (_0x2ee7e1?.disableWhenSpecialMode
      ? ' data-rh-v54-disable-on-special="' + escapeHtmlAttr(_0x2ee7e1.disableWhenSpecialMode) + '"'
      : '') +
    '>\n    ' +
    renderRhV54FieldLabel(_0x2ee7e1) +
    '\n    <div class="rh-stepper" data-key="' +
    escapeHtmlAttr(_0x259a57) +
    '">\n      <div class="rh-stepper-value" role="spinbutton" aria-label="' +
    escapeHtmlAttr(_0x46ba09) +
    '" aria-valuenow="' +
    escapeHtmlAttr(_0x2aafef) +
    '" tabindex="0">' +
    escapeHtmlAttr(_0x2aafef) +
    '</div>\n    </div>\n  </div>'
  );
}
function renderRhV54SpecialModeField(_0x490ae1, _0x5cc14e) {
  assertSupportedField(_0x490ae1);
  const _0x52a3de = String(_0x490ae1?.id || '').trim(),
    _0x4d60a8 = normalizeRhV54SpecialMode(getNodeFieldValue(_0x5cc14e, _0x52a3de, '')),
    _0x29c38e = getRenderableOptions(_0x490ae1).filter((_0x4c3bf9) => _0x4c3bf9?.hidden !== true);
  return (
    '<div class="ui-schema-field rh-vram-adv-row ui-schema-rh-v54-special-mode" data-ui-schema-field="' +
    escapeHtmlAttr(_0x52a3de) +
    '" data-ui-schema-type="segmented" data-ui-schema-default="' +
    escapeHtmlAttr(_0x490ae1?.defaultValue ?? '') +
    '">\n    ' +
    renderRhV54FieldLabel(_0x490ae1) +
    '\n    <div class="img-rp-quality-segmented rh-adv-seg">\n      ' +
    _0x29c38e
      .map((_0x206725) => {
        const _0x44f1ec = getOptionValue(_0x206725);
        return renderRhV54SegmentButton({
          key: _0x52a3de,
          value: _0x44f1ec,
          label: manifestText(_0x206725?.label ?? _0x44f1ec),
          active: _0x4d60a8 === _0x44f1ec,
        });
      })
      .join('') +
    '\n    </div>\n  </div>'
  );
}
function renderRhV54BreastJiggleField(_0x3ee4ad, _0x3ac17e) {
  assertSupportedField(_0x3ee4ad);
  const _0x3f873a = String(_0x3ee4ad?.id || '').trim(),
    _0x540f00 = Number(_0x3ee4ad?.min ?? 0),
    _0x34f5f1 = Number(_0x3ee4ad?.max ?? 1),
    _0x47909b = Number(_0x3ee4ad?.step ?? 0.05),
    _0x2eb4f7 = Number(_0x3ee4ad?.defaultValue ?? _0x540f00),
    _0x2a5421 = formatRhV54BreastJiggle(
      getNodeFieldValue(_0x3ac17e, _0x3f873a, _0x3ee4ad?.defaultValue ?? 0),
      { min: _0x540f00, max: _0x34f5f1, step: _0x47909b, fallback: _0x2eb4f7 },
    );
  return (
    '<div class="ui-schema-field rh-vram-adv-row rh-breast-jiggle-row ui-schema-rh-v54-breast-jiggle" data-ui-schema-field="' +
    escapeHtmlAttr(_0x3f873a) +
    '" data-ui-schema-type="slider" data-ui-schema-default="' +
    escapeHtmlAttr(_0x3ee4ad?.defaultValue ?? '') +
    '" data-ui-schema-min="' +
    escapeHtmlAttr(_0x540f00) +
    '" data-ui-schema-max="' +
    escapeHtmlAttr(_0x34f5f1) +
    '" data-ui-schema-step="' +
    escapeHtmlAttr(_0x47909b) +
    '">\n    ' +
    renderRhV54FieldLabel(_0x3ee4ad) +
    '\n    <div class="rh-breast-jiggle-control">\n      <input type="range" class="rh-breast-jiggle-slider" data-ui-schema-input="' +
    escapeHtmlAttr(_0x3f873a) +
    '" min="' +
    escapeHtmlAttr(_0x540f00) +
    '" max="' +
    escapeHtmlAttr(_0x34f5f1) +
    '" step="' +
    escapeHtmlAttr(_0x47909b) +
    '" value="' +
    escapeHtmlAttr(_0x2a5421) +
    '" aria-label="' +
    escapeHtmlAttr(manifestText(_0x3ee4ad?.ariaLabel || _0x3ee4ad?.label || _0x3f873a)) +
    '">\n      <span class="rh-breast-jiggle-value">' +
    escapeHtmlAttr(_0x2a5421) +
    '</span>\n    </div>\n  </div>'
  );
}
function renderField(_0x5e5463, _0x496d15, _0x2036fb = {}) {
  assertSupportedField(_0x5e5463);
  const _0x3cfac7 = String(_0x5e5463?.id || '').trim(),
    _0x31c219 = normalizeControlType(_0x5e5463?.type),
    _0x2844af = _0x5e5463?.variant || _0x2036fb?.variant;
  if (_0x2844af === 'rhV54ControlMode') return renderRhV54ControlModeField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'rhV54BooleanRow') return renderRhV54BooleanRowField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'rhV54MaskExpand') return renderRhV54MaskExpandField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'rhV54SpecialMode') return renderRhV54SpecialModeField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'rhV54BreastJiggle') return renderRhV54BreastJiggleField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'advancedRow') return renderAdvancedRowField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'randomSeedRow') return renderRandomSeedRowField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'pillMenu' && _0x31c219 === 'segmented') return renderPillMenuField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'ratioPill' && _0x31c219 === 'segmented')
    return renderAspectRatioPillField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'sectionMenu' && _0x31c219 === 'segmented')
    return renderSectionMenuField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'resolutionPill' && _0x31c219 === 'segmented')
    return renderPillMenuField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'resolutionPill' && _0x31c219 === 'slider')
    return renderResolutionPillField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'durationPill' && _0x31c219 === 'slider')
    return renderDurationPillField(_0x5e5463, _0x496d15);
  if (_0x2844af === 'instanceToggle' && _0x31c219 === 'segmented')
    return renderInstanceToggleField(_0x5e5463, _0x496d15);
  const _0x1c9549 = getFieldValue(_0x496d15, _0x5e5463),
    _0x15ba05 = manifestText(_0x5e5463?.label || _0x3cfac7),
    _0x386cc6 = _0x5e5463?.defaultValue ?? '',
    _0x5796ae = renderControl(_0x5e5463, _0x1c9549, _0x31c219, { nodeData: _0x496d15 }),
    _0x2b7cef = _0x31c219 === 'stepper' ? ' ui-schema-rh-video-stepper' : '',
    _0x3bde9c = _0x31c219 === 'stepper' ? ' data-ui-schema-value-type="number"' : '';
  return (
    '<div class="ui-schema-field' +
    _0x2b7cef +
    '" data-ui-schema-field="' +
    escapeHtmlAttr(_0x3cfac7) +
    '" data-ui-schema-type="' +
    escapeHtmlAttr(_0x31c219) +
    '" data-ui-schema-default="' +
    escapeHtmlAttr(_0x386cc6) +
    '"' +
    _0x3bde9c +
    renderStepperAttrs(_0x5e5463, _0x31c219) +
    '>\n    <div class="rh-adv-title ui-schema-field-label">' +
    escapeHtmlAttr(_0x15ba05) +
    '</div>\n    <div class="ui-schema-field-control">' +
    _0x5796ae +
    '</div>\n  </div>'
  );
}
function renderResolutionPlacementFields(_0x1f19e5, _0x298b3f, _0x294405 = {}) {
  const _0xcd0a7a =
    getFieldById(_0x1f19e5, 'rhVideoResolution') || getFieldById(_0x1f19e5, 'videoResolution');
  if (_0xcd0a7a) {
    const _0x1f0f6f = new Set(['rhVideoResolution', 'videoResolution', 'rhVideoFps', 'rhVideoFrames']),
      _0x5b1e70 = _0x1f19e5.filter((_0x220b17) => !_0x1f0f6f.has(String(_0x220b17?.id || '').trim()));
    return [
      renderVideoResolutionField(_0x1f19e5, _0x298b3f),
      ..._0x5b1e70.map((_0x421745) => renderField(_0x421745, _0x298b3f, _0x294405)),
    ].join('');
  }
  const _0x2d3342 = new Set(['imageSize', 'resolution', 'videoSize', 'quality']),
    _0x46d4d0 = _0x1f19e5.filter((_0x4908a7) => {
      const _0x50a128 = String(_0x4908a7?.id || '').trim(),
        _0x5db6c3 = String(_0x4908a7?.displayRole || '').trim();
      return _0x5db6c3 === 'resolution' || _0x2d3342.has(_0x50a128);
    }),
    _0x2706aa = _0x46d4d0[0] || null,
    _0x442307 = getFieldById(_0x1f19e5, 'aspectRatio') || getFieldByDisplayRole(_0x1f19e5, 'aspectRatio');
  if (_0x2706aa && _0x442307) {
    const _0x521ae0 = _0x1f19e5.filter((_0x1855fc) => {
      const _0x1686ab = String(_0x1855fc?.id || '').trim();
      return (
        !_0x46d4d0.some((_0x397cf2) => String(_0x397cf2?.id || '').trim() === _0x1686ab) &&
        _0x1686ab !== 'aspectRatio'
      );
    });
    return [
      renderQualityRatioField(_0x46d4d0, _0x442307, _0x298b3f),
      ..._0x521ae0.map((_0x3c1e3b) => renderField(_0x3c1e3b, _0x298b3f, _0x294405)),
    ].join('');
  }
  return _0x1f19e5.map((_0x502287) => renderField(_0x502287, _0x298b3f, _0x294405)).join('');
}
function renderModePlacementFields(_0xf3964f, _0x181309, _0x351ea5 = {}) {
  const _0x403299 = _0xf3964f.filter(
    (_0x3ef6da) => String(_0x3ef6da?.variant || '').trim() === 'sectionMenu',
  );
  if (_0x403299.length >= 2) {
    const _0x32e50a = new Set(_0x403299.map((_0x39741c) => String(_0x39741c?.id || '').trim())),
      _0x1b35a2 = _0xf3964f.filter((_0x357d83) => !_0x32e50a.has(String(_0x357d83?.id || '').trim()));
    return [
      renderSectionPairField(_0x403299, _0x181309),
      ..._0x1b35a2.map((_0x285353) => renderField(_0x285353, _0x181309, _0x351ea5)),
    ].join('');
  }
  return _0xf3964f.map((_0xf7bacf) => renderField(_0xf7bacf, _0x181309, _0x351ea5)).join('');
}
export function hasModelUiSchema(_0x51abeb, _0xf67792 = {}) {
  const _0x53d9eb = getUiSchemaFields(_0x51abeb, _0xf67792);
  return (_0x53d9eb.forEach(assertSupportedField), _0x53d9eb.length > 0);
}
function renderUiSchemaControls(_0x4fa4b0, _0x24dff4 = {}, _0x4aa7c1 = {}) {
  const _0x1618bc = filterVisibleUiSchemaFields(filterUiSchemaFields(_0x4fa4b0, _0x4aa7c1), _0x24dff4);
  if (!_0x1618bc.length) return '';
  const _0x310de5 = normalizePlacement(_0x4aa7c1?.placement),
    _0x12adf2 =
      _0x310de5 === 'resolution'
        ? renderResolutionPlacementFields(_0x1618bc, _0x24dff4, _0x4aa7c1)
        : _0x310de5 === 'mode'
          ? renderModePlacementFields(_0x1618bc, _0x24dff4, _0x4aa7c1)
          : _0x310de5 === 'videoparams'
            ? renderRhVideoParamsPlacementFields(_0x1618bc, _0x24dff4, _0x4aa7c1)
            : _0x1618bc.map((_0x3b5aea) => renderField(_0x3b5aea, _0x24dff4, _0x4aa7c1)).join('');
  if (!_0x12adf2) return '';
  if (_0x4aa7c1?.unwrap === true) return _0x12adf2;
  const _0x970a92 = _0x310de5 ? ' data-ui-schema-placement="' + escapeHtmlAttr(_0x310de5) + '"' : '',
    _0x5c6ff8 = _0x4aa7c1?.modelId ? ' data-ui-schema-model="' + escapeHtmlAttr(_0x4aa7c1.modelId) + '"' : '',
    _0xca5dec = _0x4aa7c1?.sourceId
      ? ' data-ui-schema-source="' + escapeHtmlAttr(_0x4aa7c1.sourceId) + '"'
      : '';
  return '<div class="ui-schema-renderer"' + _0x5c6ff8 + _0xca5dec + _0x970a92 + '>' + _0x12adf2 + '</div>';
}
export function renderModelUiSchemaControls(_0x4a1940, _0x469379 = {}, _0x158659 = {}) {
  const _0x2da752 = getUiSchemaFields(_0x4a1940, _0x158659);
  return renderUiSchemaControls(_0x2da752, _0x469379, { ..._0x158659, modelId: _0x4a1940 });
}
export function renderUiSchemaFields(_0x57c742, _0x2d86e9 = {}, _0x39b41e = {}) {
  return renderUiSchemaControls(_0x57c742, _0x2d86e9, { ..._0x39b41e, ignorePlacementFilter: true });
}
export function buildUiSchemaParamPatch(_0xe99fc7 = {}, _0x179641 = '', _0x20d67c = '') {
  const _0x5938c2 = String(_0x179641 || '').trim();
  if (!_0x5938c2) return {};
  const _0x339b48 = getUiSchemaModelIdForNode(_0xe99fc7),
    _0x24cdf = getModelManifest(_0x339b48),
    _0x13de20 = Array.isArray(_0x24cdf?.uiSchema?.fields)
      ? _0x24cdf.uiSchema.fields.find((_0x31d795) => String(_0x31d795?.id || '').trim() === _0x5938c2)
      : null,
    _0x39c2e5 = _0x13de20 ? normalizeUiSchemaFieldValue(_0x13de20, _0x20d67c) : _0x20d67c,
    _0x5689fc = getPlainGenerationParams(_0xe99fc7.generationParams);
  _0x5689fc[_0x5938c2] = _0x39c2e5;
  const _0x53d62e = sanitizeModelUiSchemaParams(_0x339b48 || _0xe99fc7?.model, _0x5689fc, {
      includeDefaults: false,
    }),
    _0x1248bf = { generationParams: _0x53d62e },
    _0x58042f = getGenerationParamsMemoryKey(_0xe99fc7);
  return (
    _0x58042f &&
      (_0x1248bf.generationParamsByModel = {
        ...getPlainGenerationParams(_0xe99fc7.generationParamsByModel),
        [_0x58042f]: _0x53d62e,
      }),
    _0x1248bf
  );
}
export function buildModelUiSchemaDefaultParams(_0x582a59) {
  const _0x3ecd08 = getUiSchemaFields(_0x582a59);
  return (_0x3ecd08.forEach(assertSupportedField), sanitizeModelUiSchemaParams(_0x582a59));
}
function bindUiSchemaControls(_0x350eee, { getNodeData: _0x172699, commitFieldValue: _0x38a81e } = {}) {
  if (!_0x350eee || typeof _0x38a81e !== 'function') return () => {};
  const _0x28636b = (_0x24bde1, _0x1c37d0) => {
    const _0x1187d3 = typeof _0x172699 === 'function' ? _0x172699() || {} : {},
      _0x288e7c = _0x38a81e(_0x24bde1, _0x1c37d0, _0x1187d3),
      _0x46a13e =
        _0x288e7c && typeof _0x288e7c === 'object'
          ? _0x288e7c
          : typeof _0x172699 === 'function'
            ? _0x172699() || _0x1187d3
            : _0x1187d3;
    syncModelUiSchemaControls(_0x350eee, { ..._0x1187d3, ..._0x46a13e });
  };
  let _0x6ae39e = null,
    _0x57a345 = false,
    _0x37d6f7 = null,
    _0x2a6046 = false;
  const _0x5cfcef = new Map(),
    _0x3e37b4 = (_0x400f57) => {
      const _0x59400d = _0x5cfcef.get(_0x400f57);
      if (_0x59400d?.timer) clearTimeout(_0x59400d.timer);
      _0x5cfcef.delete(_0x400f57);
    },
    _0x37cf3e = () => {
      Array.from(_0x5cfcef.entries()).forEach(([_0x176e6f, _0x4a0c5a]) => {
        if (_0x4a0c5a?.timer) clearTimeout(_0x4a0c5a.timer);
        (_0x5cfcef.delete(_0x176e6f), _0x28636b(_0x176e6f, _0x4a0c5a?.value ?? ''));
      });
    },
    _0x1d5aca = (_0x33faff, _0x4d7fd5) => {
      _0x3e37b4(_0x33faff);
      const _0x599571 = setTimeout(() => {
        (_0x5cfcef.delete(_0x33faff), _0x28636b(_0x33faff, _0x4d7fd5));
      }, 180);
      _0x5cfcef.set(_0x33faff, { timer: _0x599571, value: _0x4d7fd5 });
    },
    _0x367496 = (_0x1c87e6) => {
      const _0xe00967 = String(_0x1c87e6?.closest?.('[data-ui-schema-field]')?.dataset?.uiSchemaType || '')
          .trim()
          .toLowerCase(),
        _0x277895 = String(_0x1c87e6?.tagName || '')
          .trim()
          .toLowerCase(),
        _0x30be96 = String(_0x1c87e6?.type || '')
          .trim()
          .toLowerCase();
      return (
        _0xe00967 === 'text' || _0xe00967 === 'textarea' || _0x277895 === 'textarea' || _0x30be96 === 'text'
      );
    },
    _0x2cc82c = (_0x22bafa) => {
      if (!_0x22bafa?.addEventListener) return false;
      let _0x1136e2 = null;
      const _0x19b9df = () => {
          (_0x22bafa.removeEventListener('click', _0x327a6a, true),
            _0x1136e2 && (clearTimeout(_0x1136e2), (_0x1136e2 = null)));
        },
        _0x327a6a = (_0x489213) => {
          (_0x489213.preventDefault?.(),
            _0x489213.stopPropagation?.(),
            _0x489213.stopImmediatePropagation?.(),
            _0x19b9df());
        };
      return (
        _0x22bafa.addEventListener('click', _0x327a6a, true),
        (_0x1136e2 = setTimeout(_0x19b9df, 0x15e)),
        true
      );
    },
    _0x2f7e5e = (_0xc9cd5b, _0x5c83b4) => {
      const _0x145678 = Number(_0xc9cd5b);
      return Number.isFinite(_0x145678) ? _0x145678 : _0x5c83b4;
    },
    _0x5c20e8 = () => {
      const _0xa2b6d1 = globalThis.crypto || globalThis.window?.crypto;
      if (_0xa2b6d1?.getRandomValues) {
        const _0x1cbbba = new Uint32Array(1);
        return (_0xa2b6d1.getRandomValues(_0x1cbbba), _0x1cbbba[0] / 0x100000000);
      }
      return Math.random();
    },
    _0x25f391 = (_0x576652) => {
      const _0x5f1c55 = Math.trunc(
          _0x2f7e5e(_0x576652?.dataset?.uiSchemaRandomSeedMin, RANDOM_SEED_DEFAULT_MIN),
        ),
        _0x451024 = Math.trunc(_0x2f7e5e(_0x576652?.dataset?.uiSchemaRandomSeedMax, RANDOM_SEED_DEFAULT_MAX)),
        _0x1bb757 = Math.min(_0x5f1c55, _0x451024),
        _0x213483 = Math.max(_0x5f1c55, _0x451024);
      return String(_0x1bb757 + Math.floor(_0x5c20e8() * (_0x213483 - _0x1bb757 + 1)));
    },
    _0x37b30e = (_0x1bbf71, _0x24b89f) => {
      const _0x1a189e = _0x2f7e5e(_0x1bbf71?.dataset?.uiSchemaDefault, 0),
        _0x343342 = _0x2f7e5e(_0x1bbf71?.dataset?.uiSchemaMin, -Infinity),
        _0x3bb9dd = _0x2f7e5e(_0x1bbf71?.dataset?.uiSchemaMax, Infinity),
        _0x5edc16 = evaluateUiSchemaNumberExpression(_0x24b89f),
        _0x2c63af = Number.isFinite(_0x5edc16) ? Math.trunc(_0x5edc16) : _0x1a189e;
      return Math.max(_0x343342, Math.min(_0x3bb9dd, _0x2c63af));
    },
    _0x5d4a21 = (_0x34a1ab, _0x5b1cf9) => {
      const _0x478606 = String(_0x34a1ab?.dataset?.uiSchemaField || '').trim();
      return _0x478606 === 'rhVideoFrames' && Number(_0x5b1cf9) === 0
        ? t('aigenImage.uiSchema.fullLength')
        : String(_0x5b1cf9);
    },
    _0xd3a3d7 = (_0x56bae3, _0x4f8cff) => {
      const _0x240997 = _0x37b30e(_0x56bae3, _0x4f8cff),
        _0x5a3bb3 = _0x56bae3?.querySelector?.('.rh-stepper-value');
      return (
        _0x5a3bb3 &&
          ((_0x5a3bb3.textContent = _0x5d4a21(_0x56bae3, _0x240997)),
          _0x5a3bb3.setAttribute('aria-valuenow', String(_0x240997))),
        _0x240997
      );
    },
    _0x4b5071 = (_0x468451) => {
      const _0x1228a5 = String(_0x468451?.dataset?.uiSchemaField || '').trim(),
        _0x176d45 = typeof _0x172699 === 'function' ? _0x172699() || {} : {};
      return _0x37b30e(
        _0x468451,
        getNodeFieldValue(_0x176d45, _0x1228a5, _0x468451?.dataset?.uiSchemaDefault ?? 0),
      );
    },
    _0xf30d0a = (_0x5d39bb) => {
      const _0xb799dc = _0x5d39bb?.closest?.('.ui-schema-rh-video-stepper'),
        _0x1a3c4b = String(_0xb799dc?.dataset?.uiSchemaField || '').trim();
      if (!_0xb799dc || !_0x1a3c4b) return;
      const _0x27d1e5 = _0x4b5071(_0xb799dc),
        _0x3317da = _0x350eee.ownerDocument?.createElement?.('input');
      if (!_0x3317da) return;
      ((_0x3317da.className = 'rh-stepper-input'),
        (_0x3317da.type = 'text'),
        (_0x3317da.autocomplete = 'off'),
        (_0x3317da.step = String(_0xb799dc.dataset.uiSchemaStep || '1')),
        (_0x3317da.min = String(_0xb799dc.dataset.uiSchemaMin || '0')),
        (_0x3317da.max = String(_0xb799dc.dataset.uiSchemaMax || '')),
        (_0x3317da.value = String(_0x27d1e5)));
      let _0x4f9b36 = false;
      const _0x637d28 = (_0x359d0d) => {
        if (_0x4f9b36) return;
        _0x4f9b36 = true;
        const _0x39282b = _0x359d0d ? _0x37b30e(_0xb799dc, _0x3317da.value) : _0x27d1e5,
          _0x11596e = _0x350eee.ownerDocument.createElement('div');
        ((_0x11596e.className = 'rh-stepper-value'),
          _0x11596e.setAttribute('role', 'spinbutton'),
          _0x11596e.setAttribute('tabindex', '0'),
          _0x11596e.setAttribute(
            'aria-label',
            _0x5d39bb.getAttribute('aria-label') ||
              _0xb799dc.querySelector('.rh-vram-adv-label span')?.textContent ||
              _0x1a3c4b,
          ),
          (_0x11596e.textContent = _0x5d4a21(_0xb799dc, _0x39282b)),
          _0x11596e.setAttribute('aria-valuenow', String(_0x39282b)),
          _0x3317da.replaceWith(_0x11596e));
        if (_0x359d0d) _0x28636b(_0x1a3c4b, _0x39282b);
      };
      (_0x3317da.addEventListener('click', (_0x37d122) => _0x37d122.stopPropagation()),
        _0x3317da.addEventListener('mousedown', (_0x3f09d4) => _0x3f09d4.stopPropagation()),
        _0x3317da.addEventListener('keydown', (_0x2f0563) => {
          if (_0x2f0563.key === 'Enter') _0x637d28(true);
          if (_0x2f0563.key === 'Escape') _0x637d28(false);
        }),
        _0x3317da.addEventListener('blur', () => _0x637d28(true)),
        _0x5d39bb.replaceWith(_0x3317da),
        _0x3317da.focus(),
        _0x3317da.select());
    },
    _0x16fc0b = () => {
      if (!_0x37d6f7) return;
      (_0x37d6f7.el?.classList?.remove('is-dragging'),
        _0x37d6f7.doc?.removeEventListener?.('mousemove', _0x3300e0),
        _0x37d6f7.doc?.removeEventListener?.('mouseup', _0x414379),
        (_0x37d6f7 = null));
    },
    _0x3300e0 = (_0x3253be) => {
      if (!_0x37d6f7) return;
      const _0x543e07 = _0x3253be.clientX - _0x37d6f7.x;
      if (Math.abs(_0x543e07) >= 2) _0x37d6f7.dragged = true;
      const _0x355358 = Math.trunc(_0x543e07 / 6),
        _0x28b0fb = _0x37b30e(_0x37d6f7.fieldEl, _0x37d6f7.base + _0x355358);
      _0x28b0fb !== _0x37d6f7.last &&
        ((_0x37d6f7.moved = true), (_0x37d6f7.last = _0x28b0fb), _0xd3a3d7(_0x37d6f7.fieldEl, _0x28b0fb));
    },
    _0x414379 = () => {
      if (!_0x37d6f7) return;
      const _0x382a2f = _0x37d6f7;
      (_0x16fc0b(),
        (_0x382a2f.dragged || _0x382a2f.moved) && (_0x2a6046 = !_0x2cc82c(_0x382a2f.doc)),
        _0x382a2f.moved && _0x28636b(_0x382a2f.fieldId, _0x382a2f.last));
    },
    _0x694a0 = (_0x4017b4, _0x4c6c06) => {
      const _0x5dfc13 = _0x2f7e5e(_0x4017b4?.dataset?.uiSchemaDefault, 25),
        _0x161b17 = _0x2f7e5e(_0x4017b4?.dataset?.uiSchemaMin, -0x270f),
        _0x5542b8 = _0x2f7e5e(_0x4017b4?.dataset?.uiSchemaMax, 0x270f),
        _0xb16bd0 = normalizeRhV54MaskExpand(_0x4c6c06, _0x5dfc13);
      return Math.max(_0x161b17, Math.min(_0x5542b8, _0xb16bd0));
    },
    _0x2ac6ad = (_0x3ddbde, _0x24a7e8) => {
      const _0x49d91f = _0x694a0(_0x3ddbde, _0x24a7e8),
        _0x149770 = _0x3ddbde?.querySelector?.('.rh-stepper-value');
      return (
        _0x149770 &&
          ((_0x149770.textContent = String(_0x49d91f)),
          _0x149770.setAttribute('aria-valuenow', String(_0x49d91f))),
        _0x49d91f
      );
    },
    _0x11f8c9 = (_0x5bfe2f) => {
      const _0x322544 = String(_0x5bfe2f?.dataset?.uiSchemaField || '').trim(),
        _0x438462 = typeof _0x172699 === 'function' ? _0x172699() || {} : {};
      return _0x694a0(
        _0x5bfe2f,
        getNodeFieldValue(_0x438462, _0x322544, _0x5bfe2f?.dataset?.uiSchemaDefault ?? 25),
      );
    },
    _0x8340ca = (_0x43ed0d) => {
      const _0x33c82d = _0x43ed0d?.closest?.('.ui-schema-rh-v54-mask-expand'),
        _0xe3f032 = String(_0x33c82d?.dataset?.uiSchemaField || '').trim();
      if (!_0x33c82d || !_0xe3f032 || _0x33c82d.classList?.contains('is-rh-disabled')) return;
      const _0x2ca71c = _0x11f8c9(_0x33c82d),
        _0x34e875 = _0x350eee.ownerDocument?.createElement?.('input');
      if (!_0x34e875) return;
      ((_0x34e875.className = 'rh-stepper-input'),
        (_0x34e875.type = 'number'),
        (_0x34e875.step = String(_0x33c82d.dataset.uiSchemaStep || '1')),
        (_0x34e875.min = String(_0x33c82d.dataset.uiSchemaMin || '-9999')),
        (_0x34e875.max = String(_0x33c82d.dataset.uiSchemaMax || '9999')),
        (_0x34e875.value = String(_0x2ca71c)));
      let _0x5968ec = false;
      const _0xf8bda = (_0xf2d8a9) => {
        if (_0x5968ec) return;
        _0x5968ec = true;
        const _0x48d0af = _0xf2d8a9 ? _0x694a0(_0x33c82d, _0x34e875.value) : _0x2ca71c,
          _0x237ef1 = _0x350eee.ownerDocument.createElement('div');
        ((_0x237ef1.className = 'rh-stepper-value'),
          _0x237ef1.setAttribute('role', 'spinbutton'),
          _0x237ef1.setAttribute('tabindex', '0'),
          _0x237ef1.setAttribute(
            'aria-label',
            _0x43ed0d.getAttribute('aria-label') || t('aigenImage.uiSchema.maskExpandValue'),
          ),
          (_0x237ef1.textContent = String(_0x48d0af)),
          _0x237ef1.setAttribute('aria-valuenow', String(_0x48d0af)),
          _0x34e875.replaceWith(_0x237ef1));
        if (_0xf2d8a9) _0x28636b(_0xe3f032, _0x48d0af);
      };
      (_0x34e875.addEventListener('click', (_0xa6e7cb) => _0xa6e7cb.stopPropagation()),
        _0x34e875.addEventListener('mousedown', (_0x372c1d) => _0x372c1d.stopPropagation()),
        _0x34e875.addEventListener('keydown', (_0xc5fded) => {
          if (_0xc5fded.key === 'Enter') _0xf8bda(true);
          if (_0xc5fded.key === 'Escape') _0xf8bda(false);
        }),
        _0x34e875.addEventListener('blur', () => _0xf8bda(true)),
        _0x43ed0d.replaceWith(_0x34e875),
        _0x34e875.focus(),
        _0x34e875.select());
    },
    _0x546795 = () => {
      if (!_0x6ae39e) return;
      (_0x6ae39e.el?.classList?.remove('is-dragging'),
        _0x6ae39e.doc?.removeEventListener?.('mousemove', _0x38ce6b),
        _0x6ae39e.doc?.removeEventListener?.('mouseup', _0x3e17ef),
        (_0x6ae39e = null));
    },
    _0x38ce6b = (_0x588314) => {
      if (!_0x6ae39e) return;
      const _0x5d74b0 = _0x588314.clientX - _0x6ae39e.x;
      if (Math.abs(_0x5d74b0) >= 2) _0x6ae39e.dragged = true;
      const _0x37e4b5 = Math.trunc(_0x5d74b0 / 6),
        _0x2a3d6c = _0x694a0(_0x6ae39e.fieldEl, _0x6ae39e.base + _0x37e4b5);
      _0x2a3d6c !== _0x6ae39e.last &&
        ((_0x6ae39e.moved = true), (_0x6ae39e.last = _0x2a3d6c), _0x2ac6ad(_0x6ae39e.fieldEl, _0x2a3d6c));
    },
    _0x3e17ef = () => {
      if (!_0x6ae39e) return;
      const _0x4ac1aa = _0x6ae39e;
      (_0x546795(),
        (_0x4ac1aa.dragged || _0x4ac1aa.moved) && (_0x57a345 = !_0x2cc82c(_0x4ac1aa.doc)),
        _0x4ac1aa.moved && _0x28636b(_0x4ac1aa.fieldId, _0x4ac1aa.last));
    },
    _0x2c6925 = (_0x2c3224) => {
      const _0x3027c2 = _0x2c3224.target?.closest?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (_0x3027c2 && _0x2c3224.button === 0) {
        const _0x2d8ac8 = _0x3027c2.closest('.ui-schema-rh-video-stepper'),
          _0x802b59 = String(_0x2d8ac8?.dataset?.uiSchemaField || '').trim();
        if (!_0x2d8ac8 || !_0x802b59) return;
        const _0xbb6dc3 = _0x350eee.ownerDocument || globalThis.document;
        if (!_0xbb6dc3) return;
        (_0x2c3224.preventDefault(), _0x2c3224.stopPropagation());
        const _0xa87224 = _0x4b5071(_0x2d8ac8);
        (_0x16fc0b(),
          (_0x37d6f7 = {
            x: _0x2c3224.clientX,
            base: _0xa87224,
            last: _0xa87224,
            moved: false,
            dragged: false,
            fieldEl: _0x2d8ac8,
            fieldId: _0x802b59,
            el: _0x3027c2,
            doc: _0xbb6dc3,
          }),
          _0x3027c2.classList.add('is-dragging'),
          _0xbb6dc3.addEventListener('mousemove', _0x3300e0),
          _0xbb6dc3.addEventListener('mouseup', _0x414379));
        return;
      }
      const _0x89ff73 = _0x2c3224.target?.closest?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (!_0x89ff73 || _0x2c3224.button !== 0) return;
      const _0x4193ab = _0x89ff73.closest('.ui-schema-rh-v54-mask-expand'),
        _0x4848df = String(_0x4193ab?.dataset?.uiSchemaField || '').trim();
      if (!_0x4193ab || !_0x4848df || _0x4193ab.classList?.contains('is-rh-disabled')) return;
      const _0x246437 = _0x350eee.ownerDocument || globalThis.document;
      if (!_0x246437) return;
      (_0x2c3224.preventDefault(), _0x2c3224.stopPropagation());
      const _0x50cacc = _0x11f8c9(_0x4193ab);
      (_0x546795(),
        (_0x6ae39e = {
          x: _0x2c3224.clientX,
          base: _0x50cacc,
          last: _0x50cacc,
          moved: false,
          dragged: false,
          fieldEl: _0x4193ab,
          fieldId: _0x4848df,
          el: _0x89ff73,
          doc: _0x246437,
        }),
        _0x89ff73.classList.add('is-dragging'),
        _0x246437.addEventListener('mousemove', _0x38ce6b),
        _0x246437.addEventListener('mouseup', _0x3e17ef));
    },
    _0x9332e4 = (_0x40fde2) => {
      const _0x515504 = _0x40fde2.target?.closest?.('[data-ui-schema-random-seed-mode]');
      if (_0x515504) {
        (_0x40fde2.preventDefault?.(), _0x40fde2.stopPropagation?.());
        const _0x4723e6 = _0x515504.closest('[data-ui-schema-field]'),
          _0x3b1cbe = String(
            _0x515504.dataset.uiSchemaRandomSeedModeField ||
              _0x4723e6?.dataset?.uiSchemaRandomSeedModeField ||
              '',
          ).trim(),
          _0x555586 = normalizeRandomSeedMode(_0x515504.dataset.uiSchemaRandomSeedMode, 'fixed');
        if (!_0x3b1cbe) return;
        _0x28636b(_0x3b1cbe, _0x555586);
        if (_0x555586 === 'random' && _0x4723e6) {
          const _0x5696f2 = String(_0x4723e6.dataset.uiSchemaField || '').trim(),
            _0x450b62 = _0x25f391(_0x4723e6);
          _0x4723e6.classList?.contains('ui-schema-rh-video-stepper') && _0xd3a3d7(_0x4723e6, _0x450b62);
          const _0x4a41e4 = _0x4723e6.querySelector('[data-ui-schema-input]');
          if (_0x4a41e4) _0x4a41e4.value = _0x450b62;
          if (_0x5696f2) _0x28636b(_0x5696f2, _0x450b62);
        }
        return;
      }
      const _0x2d8de8 = _0x40fde2.target?.closest?.('[data-ui-schema-random-seed]');
      if (_0x2d8de8) {
        (_0x40fde2.preventDefault?.(), _0x40fde2.stopPropagation?.());
        const _0x5c1c63 = _0x2d8de8.closest('[data-ui-schema-field]'),
          _0x1563fc = String(_0x5c1c63?.dataset?.uiSchemaField || '').trim();
        if (!_0x1563fc) return;
        const _0x4101b = _0x25f391(_0x5c1c63);
        _0x5c1c63.classList?.contains('ui-schema-rh-video-stepper') && _0xd3a3d7(_0x5c1c63, _0x4101b);
        const _0x55d7f6 = _0x5c1c63.querySelector('[data-ui-schema-input]');
        if (_0x55d7f6) _0x55d7f6.value = _0x4101b;
        _0x28636b(_0x1563fc, _0x4101b);
        return;
      }
      const _0x4af916 = _0x40fde2.target?.closest?.('.ui-schema-rh-video-stepper .rh-stepper-value');
      if (_0x4af916) {
        _0x40fde2.stopPropagation();
        if (_0x2a6046) {
          _0x2a6046 = false;
          return;
        }
        _0xf30d0a(_0x4af916);
        return;
      }
      const _0x74d708 = _0x40fde2.target?.closest?.('.ui-schema-rh-v54-mask-expand .rh-stepper-value');
      if (_0x74d708) {
        _0x40fde2.stopPropagation();
        if (_0x57a345) {
          _0x57a345 = false;
          return;
        }
        _0x8340ca(_0x74d708);
        return;
      }
      const _0x5c92b7 = _0x40fde2.target?.closest?.('[data-ui-schema-menu-trigger]');
      if (_0x5c92b7) {
        _0x40fde2.stopPropagation();
        const _0x1aa58d = _0x5c92b7.closest('[data-ui-schema-field], [data-ui-schema-composite-field]'),
          _0x28186f =
            _0x1aa58d?.querySelector('.ui-schema-floating-menu') ||
            _0x1aa58d?.querySelector('.ui-schema-popup'),
          _0x49b2ea = _0x28186f?.classList?.contains('floating-menu')
            ? !_0x28186f.classList.contains('show')
            : _0x28186f
              ? _0x28186f.style.display === 'none'
              : false;
        (_0x350eee.dispatchEvent(
          new CustomEvent('ui-schema-menu-before-open', {
            detail: { fieldEl: _0x1aa58d, popup: _0x28186f, shouldOpen: _0x49b2ea },
          }),
        ),
          _0x350eee.querySelectorAll('.ui-schema-floating-menu').forEach((_0x241444) => {
            if (_0x241444 !== _0x28186f) _0x241444.classList.remove('show');
          }),
          _0x350eee.querySelectorAll('.ui-schema-popup').forEach((_0x562599) => {
            if (_0x562599 === _0x28186f) return;
            if (_0x562599.classList?.contains('floating-menu')) {
              (_0x562599.classList.remove('show'), (_0x562599.style.display = ''));
              return;
            }
            _0x562599.style.display = 'none';
          }));
        if (_0x28186f?.classList?.contains('floating-menu'))
          ((_0x28186f.style.display = ''), _0x28186f.classList.toggle('show', _0x49b2ea));
        else
          _0x28186f &&
            (_0x28186f.style.display = _0x49b2ea
              ? _0x28186f.classList?.contains('ui-schema-duration-pop')
                ? 'flex'
                : 'block'
              : 'none');
        return;
      }
      _0x40fde2.target?.closest?.(
        '.ui-schema-popup, .ui-schema-floating-menu, .img-ratio-popup, .rh-res-popup',
      ) && _0x40fde2.stopPropagation();
      const _0x3652d2 = _0x40fde2.target?.closest?.('[data-ui-schema-field]');
      if (!_0x3652d2) return;
      const _0x11b4db = String(_0x3652d2.dataset.uiSchemaField || '').trim();
      if (!_0x11b4db) return;
      const _0x78c7ef = _0x40fde2.target.closest('[data-ui-schema-value]');
      if (!_0x78c7ef) return;
      if (_0x78c7ef.dataset.uiSchemaDisabled === 'true' || _0x78c7ef.disabled === true) return;
      _0x40fde2.stopPropagation();
      const _0x2d6aec = String(_0x3652d2.dataset.uiSchemaType || ''),
        _0x56f881 = _0x78c7ef.dataset.uiSchemaValue,
        _0x411f42 =
          _0x3652d2.dataset.uiSchemaValueType === 'boolean'
            ? _0x56f881 === 'true'
            : _0x3652d2.dataset.uiSchemaValueType === 'number'
              ? Number(_0x56f881)
              : _0x2d6aec === 'toggle'
                ? _0x56f881 === 'true'
                : _0x56f881;
      (_0x3652d2
        .querySelectorAll('[data-ui-schema-value]')
        .forEach((_0x2aa7d1) => _0x2aa7d1.classList.remove('active')),
        _0x78c7ef.classList.add('active'));
      const _0x5da76a = _0x3652d2.querySelector('.ui-schema-menu-trigger .ui-schema-pill-label');
      if (_0x5da76a) {
        const _0x32f40f =
          _0x78c7ef.dataset.uiSchemaOptionLabel || _0x78c7ef.textContent?.trim?.() || String(_0x411f42);
        _0x5da76a.textContent = _0x32f40f;
      }
      (syncInstanceToggleField(_0x3652d2, _0x411f42),
        _0x28636b(_0x11b4db, _0x411f42),
        _0x78c7ef.closest('.floating-menu')?.classList.remove('show'));
    },
    _0x1107c4 = (_0x463c84) => {
      const _0x41e4d2 = _0x463c84.target?.closest?.('[data-ui-schema-input]');
      if (!_0x41e4d2) return;
      const _0x41327f = String(_0x41e4d2.dataset.uiSchemaInput || '').trim();
      if (!_0x41327f) return;
      const _0x199579 = _0x41e4d2.closest('[data-ui-schema-range-values]'),
        _0x11931d = parseRangeValuesFromFieldEl(_0x199579),
        _0x57cd21 =
          _0x41e4d2.type === 'range' && _0x11931d?.length
            ? _0x11931d[Math.max(0, Math.min(_0x11931d.length - 1, Number(_0x41e4d2.value)))]
            : _0x41e4d2.type === 'range' || _0x41e4d2.type === 'number'
              ? Number(_0x41e4d2.value)
              : _0x41e4d2.value,
        _0x273930 = _0x41e4d2.closest('.ui-schema-field')?.querySelector('.ui-schema-value');
      if (_0x273930) _0x273930.textContent = String(_0x57cd21);
      const _0xd23753 = _0x41e4d2.closest('.ui-schema-rh-v54-breast-jiggle'),
        _0x6d33e5 = _0xd23753?.querySelector('.rh-breast-jiggle-value');
      _0x6d33e5 &&
        (_0x6d33e5.textContent = formatRhV54BreastJiggle(
          _0x57cd21,
          getRhV54BreastJiggleRangeFromFieldEl(_0xd23753),
        ));
      const _0x22a6b3 = _0x41e4d2
        .closest('.ui-schema-duration-pill')
        ?.querySelector('.ui-schema-duration-label');
      _0x22a6b3 && (_0x22a6b3.textContent = getRangeValueDisplayLabel(_0x199579, _0x57cd21, _0x57cd21 + 'S'));
      const _0x2315f2 = _0x41e4d2.closest('.ui-schema-field')?.querySelector('.ui-schema-pill-label'),
        _0x232603 = _0x41e4d2.closest('.ui-schema-field')?.querySelector('.rh-res-title');
      if (_0x2315f2 && _0x232603) {
        const _0x59e242 = _0x2315f2.querySelector('.ui-schema-resolution-value');
        _0x59e242
          ? (_0x59e242.textContent = String(_0x57cd21))
          : (_0x2315f2.textContent = (_0x232603.textContent || 'Resolution') + ' ' + _0x57cd21);
      }
      if (_0x367496(_0x41e4d2)) {
        _0x463c84.type === 'input'
          ? _0x1d5aca(_0x41327f, _0x57cd21)
          : (_0x3e37b4(_0x41327f), _0x28636b(_0x41327f, _0x57cd21));
        return;
      }
      _0x28636b(_0x41327f, _0x57cd21);
    };
  return (
    _0x350eee.addEventListener('click', _0x9332e4, true),
    _0x350eee.addEventListener('mousedown', _0x2c6925, true),
    _0x350eee.addEventListener('input', _0x1107c4),
    _0x350eee.addEventListener('change', _0x1107c4),
    () => {
      (_0x37cf3e(),
        _0x546795(),
        _0x16fc0b(),
        _0x350eee.removeEventListener('click', _0x9332e4, true),
        _0x350eee.removeEventListener('mousedown', _0x2c6925, true),
        _0x350eee.removeEventListener('input', _0x1107c4),
        _0x350eee.removeEventListener('change', _0x1107c4));
    }
  );
}
export function bindModelUiSchemaControls(
  _0x287c4d,
  {
    nodeId: _0x4aca45,
    nodeData: _0x16cc3e,
    store: _0x1f91ba,
    buildPatch: _0x4ed68d,
    decorateNodeData: _0x2785f0,
    afterCommit: _0x25f849,
  } = {},
) {
  if (!_0x287c4d || !_0x1f91ba || !_0x4aca45) return () => {};
  const _0x554549 = () => {
    const _0x46b4ca = _0x1f91ba.getState?.().nodes?.[_0x4aca45] || _0x16cc3e || {};
    return typeof _0x2785f0 === 'function' ? _0x2785f0(_0x46b4ca) : _0x46b4ca;
  };
  return bindUiSchemaControls(_0x287c4d, {
    getNodeData: _0x554549,
    commitFieldValue: (_0x1fb9a7, _0xc82221, _0x6b21aa) => {
      const _0x1c979f = buildUiSchemaParamPatch(_0x6b21aa, _0x1fb9a7, _0xc82221),
        _0x28a69a =
          typeof _0x4ed68d === 'function' ? _0x4ed68d(_0x6b21aa, _0x1fb9a7, _0xc82221, _0x1c979f) : {},
        _0x5d5c5d = { ..._0x1c979f, ...(_0x28a69a && typeof _0x28a69a === 'object' ? _0x28a69a : {}) };
      _0x1f91ba.updateNodeData(_0x4aca45, _0x5d5c5d);
      const _0x1535d4 = { ..._0x6b21aa, ..._0x5d5c5d },
        _0x3a92b2 = typeof _0x2785f0 === 'function' ? _0x2785f0(_0x1535d4) : _0x1535d4;
      return (
        _0x25f849?.(_0x1fb9a7, _0xc82221, _0x3a92b2, { latest: _0x6b21aa, patch: _0x5d5c5d }),
        _0x3a92b2
      );
    },
  });
}
export function bindUiSchemaFieldControls(
  _0x17bebc,
  { getNodeData: _0x14b454, commitFieldValue: _0x490347 } = {},
) {
  return bindUiSchemaControls(_0x17bebc, { getNodeData: _0x14b454, commitFieldValue: _0x490347 });
}
export function syncModelUiSchemaControls(_0x56d7b8, _0x39e1c6 = {}) {
  if (!_0x56d7b8) return;
  (syncDynamicOptionDisabled(_0x56d7b8, _0x39e1c6),
    _0x56d7b8.querySelectorAll('[data-ui-schema-field]').forEach((_0x236f1b) => {
      const _0x3ee4b0 = String(_0x236f1b.dataset.uiSchemaField || '').trim();
      if (!_0x3ee4b0) return;
      let _0x1fa72f = getNodeFieldValue(_0x39e1c6, _0x3ee4b0, _0x236f1b.dataset.uiSchemaDefault);
      const _0x4a1b19 = String(_0x236f1b.dataset.uiSchemaDefaultAliases || '').trim();
      if (_0x4a1b19)
        try {
          const _0x3f85a8 = JSON.parse(_0x4a1b19)
            .map((_0x5c21f1) =>
              String(_0x5c21f1 ?? '')
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean);
          _0x3f85a8.includes(
            String(_0x1fa72f ?? '')
              .trim()
              .toLowerCase(),
          ) && (_0x1fa72f = _0x236f1b.dataset.uiSchemaDefault);
        } catch {}
      const _0x4c0449 = _0x236f1b.querySelector(
        '[data-ui-schema-value="' + escapeCssString(_0x1fa72f) + '"]',
      );
      if (_0x4c0449?.dataset?.uiSchemaDisabled === 'true') {
        const _0x5da249 = _0x236f1b.dataset.uiSchemaDefault,
          _0x588058 = _0x236f1b.querySelector('[data-ui-schema-value="' + escapeCssString(_0x5da249) + '"]'),
          _0x27160f =
            _0x588058?.dataset?.uiSchemaDisabled === 'true'
              ? _0x236f1b.querySelector('[data-ui-schema-value]:not([data-ui-schema-disabled="true"])')
              : _0x588058;
        _0x27160f?.dataset?.uiSchemaValue !== undefined && (_0x1fa72f = _0x27160f.dataset.uiSchemaValue);
      }
      _0x236f1b.querySelectorAll('[data-ui-schema-value]').forEach((_0x261714) => {
        _0x261714.classList.toggle('active', String(_0x261714.dataset.uiSchemaValue) === String(_0x1fa72f));
      });
      const _0x1ea501 = _0x236f1b.querySelector(
          '[data-ui-schema-value="' + escapeCssString(_0x1fa72f) + '"]',
        ),
        _0xcda931 = _0x236f1b.querySelector('.ui-schema-pill-label');
      _0xcda931 &&
        _0x1ea501?.dataset?.uiSchemaOptionLabel &&
        (_0xcda931.textContent = _0x1ea501.dataset.uiSchemaOptionLabel);
      (syncInstanceToggleField(_0x236f1b, _0x1fa72f), syncStepperField(_0x236f1b, _0x1fa72f));
      const _0x31961b = _0x236f1b.querySelector('[data-ui-schema-input]');
      if (_0x31961b && _0x1fa72f !== undefined) {
        const _0x525335 = parseRangeValuesFromFieldEl(_0x236f1b),
          _0x4c084f = findRangeValueIndex(_0x525335, _0x1fa72f);
        _0x31961b.value = _0x525335?.length ? String(Math.max(0, _0x4c084f)) : String(_0x1fa72f);
        const _0x4be2da = _0x236f1b.querySelector('.ui-schema-value');
        if (_0x4be2da) _0x4be2da.textContent = String(_0x1fa72f);
        const _0x120a57 = _0x236f1b.querySelector('.ui-schema-duration-label');
        _0x120a57 &&
          (_0x120a57.textContent = getRangeValueDisplayLabel(_0x236f1b, _0x1fa72f, _0x1fa72f + 'S'));
        const _0x2149f7 = _0x236f1b.querySelector('.ui-schema-pill-label'),
          _0x5712d8 = _0x2149f7?.querySelector('.ui-schema-resolution-value');
        if (_0x5712d8) _0x5712d8.textContent = String(_0x1fa72f);
        else {
          if (_0x236f1b.classList?.contains('ui-schema-resolution-pill')) {
            const _0x4589ca = _0x236f1b.querySelector('.rh-res-title')?.textContent || 'Resolution';
            if (_0x2149f7) _0x2149f7.textContent = _0x4589ca + ' ' + _0x1fa72f;
          }
        }
      }
      (syncRhV54CustomField(_0x236f1b, _0x39e1c6), syncRandomSeedField(_0x236f1b, _0x39e1c6));
    }),
    syncCompositeUiSchemaControls(_0x56d7b8, _0x39e1c6));
}
function syncDynamicOptionDisabled(_0xa85516, _0x1850dd = {}) {
  _0xa85516
    .querySelectorAll('[data-ui-schema-disable-when-field], [data-ui-schema-disable-when-json]')
    .forEach((_0x47e99c) => {
      const _0x5393a5 = String(_0x47e99c.dataset.uiSchemaDisableWhenField || '').trim(),
        _0x46af1f = String(_0x47e99c.dataset.uiSchemaDisableWhenValues || '')
          .split(',')
          .map(normalizeCompareValue)
          .filter(Boolean);
      let _0x154c99 = false;
      const _0x2fbc5e = String(_0x47e99c.dataset.uiSchemaDisableWhenJson || '').trim();
      if (_0x2fbc5e)
        try {
          _0x154c99 = optionDisableWhenMatches(JSON.parse(_0x2fbc5e), _0x1850dd);
        } catch {
          _0x154c99 = false;
        }
      else
        _0x154c99 =
          _0x5393a5 && _0x46af1f.includes(normalizeCompareValue(getNodeFieldValue(_0x1850dd, _0x5393a5, '')));
      const _0x1e103b =
          _0x47e99c.dataset.uiSchemaStaticDisabled === 'true' ||
          _0x47e99c.hasAttribute('data-ui-schema-static-disabled'),
        _0x44dd66 = Boolean(_0x1e103b || _0x154c99);
      _0x47e99c.classList?.toggle('disabled', _0x44dd66);
      if (_0x44dd66) {
        ((_0x47e99c.dataset.uiSchemaDisabled = 'true'), _0x47e99c.setAttribute('aria-disabled', 'true'));
        if ('disabled' in _0x47e99c) _0x47e99c.disabled = true;
      } else {
        (delete _0x47e99c.dataset.uiSchemaDisabled,
          _0x47e99c.removeAttribute('data-ui-schema-disabled'),
          _0x47e99c.removeAttribute('aria-disabled'));
        if ('disabled' in _0x47e99c) _0x47e99c.disabled = false;
      }
    });
}
function syncRhV54CustomField(_0x476977, _0xa750f2 = {}) {
  const _0x25e031 = String(_0x476977?.dataset?.uiSchemaField || '').trim(),
    _0x459557 = String(_0x476977?.dataset?.rhV54DisableOnSpecial || '').trim(),
    _0x4e1827 =
      _0x459557 && normalizeRhV54SpecialMode(getNodeFieldValue(_0xa750f2, 'rhSpecialMode', '')) === _0x459557,
    _0x21e128 = _0x25e031 === 'rhSubtractSubject' && _0xa750f2?.rhV54HasMaskVideo === true;
  (_0x459557 || _0x21e128) && _0x476977.classList.toggle('is-rh-disabled', Boolean(_0x4e1827 || _0x21e128));
  if (_0x476977.classList?.contains('ui-schema-rh-v54-control-mode')) {
    const _0xc63b27 = String(getNodeFieldValue(_0xa750f2, 'rhControlMode', 'single') || 'single'),
      _0x2925eb = normalizeRhV54SinglePreset(
        getNodeFieldValue(_0xa750f2, 'rhSingleControlPreset', 'efficiency'),
      );
    (_0x476977
      .querySelectorAll('[data-key="rhSingleControlPreset"]')
      .forEach((_0x409b20) =>
        _0x409b20.classList.toggle('active', _0xc63b27 !== 'multi' && _0x409b20.dataset.value === _0x2925eb),
      ),
      _0x476977
        .querySelectorAll('[data-key="rhControlMode"]')
        .forEach((_0x4b9ae7) =>
          _0x4b9ae7.classList.toggle('active', _0xc63b27 === 'multi' && _0x4b9ae7.dataset.value === 'multi'),
        ),
      _0x476977.querySelector('.rh-adv-single-group')?.classList.toggle('active', _0xc63b27 !== 'multi'),
      _0x476977.querySelector('.rh-adv-multi-group')?.classList.toggle('active', _0xc63b27 === 'multi'));
  }
  if (_0x476977.classList?.contains('ui-schema-rh-v54-mask-expand')) {
    const _0x3885a1 = normalizeRhV54MaskExpand(
        getNodeFieldValue(_0xa750f2, 'rhMaskExpand', _0x476977.dataset.uiSchemaDefault || 25),
        Number(_0x476977.dataset.uiSchemaDefault || 25),
      ),
      _0x401c23 = _0x476977.querySelector('.rh-stepper-value');
    _0x401c23 &&
      ((_0x401c23.textContent = String(_0x3885a1)),
      _0x401c23.setAttribute('aria-valuenow', String(_0x3885a1)));
  }
  if (_0x476977.classList?.contains('ui-schema-rh-v54-breast-jiggle')) {
    const _0x1cf052 = String(_0x476977.dataset.uiSchemaField || '').trim(),
      _0x3e4bd4 = formatRhV54BreastJiggle(
        getNodeFieldValue(_0xa750f2, _0x1cf052, _0x476977.dataset.uiSchemaDefault || 0),
        getRhV54BreastJiggleRangeFromFieldEl(_0x476977),
      ),
      _0x4bdb43 = _0x476977.querySelector('.rh-breast-jiggle-slider');
    if (_0x4bdb43) _0x4bdb43.value = _0x3e4bd4;
    const _0x255d70 = _0x476977.querySelector('.rh-breast-jiggle-value');
    if (_0x255d70) _0x255d70.textContent = _0x3e4bd4;
  }
}
function getSyncedFieldValue(_0x53b6aa, _0x2aebea = {}) {
  const _0x304583 = String(_0x53b6aa?.dataset?.uiSchemaField || '').trim();
  if (!_0x304583) return '';
  const _0x2cd4e8 = getNodeFieldValue(_0x2aebea, _0x304583, _0x53b6aa?.dataset?.uiSchemaDefault ?? ''),
    _0x306474 = _0x53b6aa?.querySelector?.('[data-ui-schema-value="' + escapeCssString(_0x2cd4e8) + '"]');
  if (_0x306474?.dataset?.uiSchemaDisabled !== 'true') return _0x2cd4e8;
  const _0x482fec = _0x53b6aa?.dataset?.uiSchemaDefault ?? '',
    _0x52f0ba = _0x53b6aa?.querySelector?.('[data-ui-schema-value="' + escapeCssString(_0x482fec) + '"]');
  if (_0x52f0ba?.dataset?.uiSchemaDisabled !== 'true') return _0x482fec;
  const _0x3ced07 = _0x53b6aa?.querySelector?.(
    '[data-ui-schema-value]:not([data-ui-schema-disabled="true"])',
  );
  return _0x3ced07?.dataset?.uiSchemaValue ?? _0x2cd4e8;
}
function getSyncedOptionLabel(_0x5647b9, _0xf0ca91, { adaptive: adaptive = false } = {}) {
  const _0x2904f0 = _0x5647b9?.querySelector?.('[data-ui-schema-value="' + escapeCssString(_0xf0ca91) + '"]'),
    _0x47592c = String(
      _0x2904f0?.dataset?.uiSchemaOptionLabel || _0x2904f0?.textContent || _0xf0ca91 || '',
    ).trim(),
    _0x1e0d7e = _0x47592c.toLowerCase(),
    _0x4980b8 = String(_0xf0ca91 || '')
      .trim()
      .toLowerCase();
  if (
    adaptive &&
    (_0x1e0d7e === 'auto' ||
      _0x1e0d7e === 'adaptive' ||
      _0x1e0d7e === '自适应' ||
      _0x4980b8 === 'auto' ||
      _0x4980b8 === 'adaptive' ||
      _0x4980b8 === '自适应')
  )
    return '自适应';
  return _0x47592c;
}
function syncQualityRatioComposite(_0x818fa2, _0xca50dc = {}) {
  const _0x598bc4 =
      _0x818fa2?.querySelector?.('[data-ui-schema-field="aspectRatio"]') ||
      _0x818fa2?.querySelector?.('[data-ui-schema-display-role="aspectRatio"]'),
    _0xb5ddc2 =
      _0x818fa2?.querySelector?.('[data-ui-schema-field="imageSize"]') ||
      _0x818fa2?.querySelector?.('[data-ui-schema-field="resolution"]') ||
      _0x818fa2?.querySelector?.('[data-ui-schema-field="videoSize"]') ||
      _0x818fa2?.querySelector?.('[data-ui-schema-field="quality"]') ||
      _0x818fa2?.querySelector?.('[data-ui-schema-display-role="resolution"]'),
    _0x2751b5 = Array.from(_0x818fa2?.querySelectorAll?.('[data-ui-schema-field]') || []).filter(
      (_0x3a9f33) => _0x3a9f33 !== _0x598bc4,
    );
  _0x2751b5.length === 0 && _0xb5ddc2 && _0x2751b5.push(_0xb5ddc2);
  const _0x1bd56b = _0x818fa2?.querySelector?.('.ui-schema-quality-ratio-label');
  if (!_0x2751b5.length || !_0x598bc4 || !_0x1bd56b) return;
  const _0x7f8563 = getSyncedFieldValue(_0x598bc4, _0xca50dc),
    _0x14fa6f = _0x2751b5.map((_0x2cde56) =>
      getSyncedOptionLabel(_0x2cde56, getSyncedFieldValue(_0x2cde56, _0xca50dc)),
    ),
    _0x1eadac = getSyncedOptionLabel(_0x598bc4, _0x7f8563, { adaptive: true });
  _0x1bd56b.textContent =
    _0x14fa6f.length > 1
      ? [..._0x14fa6f, _0x1eadac].join(' · ')
      : String(_0x818fa2?.dataset?.uiSchemaLabelOrder || '').trim() === 'fieldFirst'
        ? (_0x14fa6f[0] || '') + ' · ' + _0x1eadac
        : _0x1eadac + ' · ' + (_0x14fa6f[0] || '');
}
function syncSectionPairComposite(_0xa877b, _0x54b54a = {}) {
  const _0x1fe3ff = Array.from(_0xa877b?.querySelectorAll?.('[data-ui-schema-field]') || []),
    _0x581a1e = _0xa877b?.querySelector?.('.ui-schema-section-pair-label');
  if (_0x1fe3ff.length < 2 || !_0x581a1e) return;
  const _0x1e6bda = _0x1fe3ff
    .map((_0x59f198) => getSyncedOptionLabel(_0x59f198, getSyncedFieldValue(_0x59f198, _0x54b54a)))
    .filter(Boolean);
  _0x1e6bda.length >= 2 && (_0x581a1e.textContent = _0x1e6bda.join(' · '));
}
function syncVideoResolutionComposite(_0x4af87f, _0x24c963 = {}) {
  const _0x108b31 =
      _0x4af87f?.querySelector?.('[data-ui-schema-field="rhVideoResolution"]') ||
      _0x4af87f?.querySelector?.('[data-ui-schema-field="videoResolution"]'),
    _0x2e4595 = _0x4af87f?.querySelector?.('.ui-schema-video-resolution-label');
  if (!_0x108b31 || !_0x2e4595) return;
  const _0x150e47 = _0x4af87f.querySelector('[data-ui-schema-field="rhVideoFps"]'),
    _0x3643ce = _0x4af87f.querySelector('[data-ui-schema-field="rhVideoFrames"]'),
    _0x54175c = getSyncedFieldValue(_0x108b31, _0x24c963);
  if (!_0x150e47 || !_0x3643ce) {
    _0x2e4595.textContent = formatMetricLabel('分辨率', _0x54175c);
    return;
  }
  const _0x3eeb1f = getSyncedFieldValue(_0x150e47, _0x24c963),
    _0x1cc76f = getSyncedFieldValue(_0x3643ce, _0x24c963),
    _0x44e897 = Number(_0x1cc76f) === 0 ? t('aigenImage.uiSchema.fullLength') : String(_0x1cc76f || '');
  _0x2e4595.textContent = joinMetricLabels([
    ['帧数', _0x44e897],
    ['帧率', _0x3eeb1f],
    ['分辨率', _0x54175c],
  ]);
}
function syncRhVideoParamsComposite(_0x1f2878, _0x5d89d0 = {}) {
  const _0x50357b = _0x1f2878?.querySelector?.('.img-ratio-label'),
    _0x18adc3 = Array.from(_0x1f2878?.querySelectorAll?.('[data-ui-schema-field]') || []).map(
      (_0x2ef004) => ({
        id: _0x2ef004.dataset.uiSchemaField,
        defaultValue: _0x2ef004.dataset.uiSchemaDefault,
        min: _0x2ef004.dataset.uiSchemaMin,
        max: _0x2ef004.dataset.uiSchemaMax,
      }),
    ),
    _0x3b0e03 = (_0x157298) => _0x18adc3.find((_0x39db2e) => _0x39db2e.id === _0x157298),
    _0x320d93 = _0x3b0e03('rhVideoResolution'),
    _0x174a14 = _0x3b0e03('rhVideoFps'),
    _0x2186a9 = _0x3b0e03('rhVideoFrames'),
    _0xde0468 = _0x3b0e03('rhVideoSeconds'),
    _0x27940c = (_0x7a360d, _0x22b41e, _0x4135c3 = {}) =>
      normalizeNumberValue(
        getNodeFieldValue(_0x5d89d0, _0x7a360d?.id, _0x7a360d?.defaultValue ?? _0x22b41e),
        Number(_0x22b41e),
        _0x4135c3,
      ),
    _0x134e54 = _0x320d93 ? _0x27940c(_0x320d93, _0x320d93.defaultValue || 0x340, { min: 0x340 }) : 0x340;
  if (_0x50357b && _0xde0468) {
    const _0x2a1cef = _0x174a14 ? _0x27940c(_0x174a14, _0x174a14.defaultValue || 24) : 24,
      _0x433940 = _0x27940c(_0xde0468, _0xde0468.defaultValue || 5, {
        min: Number(_0xde0468.min || 1),
        max: Number(_0xde0468.max || 0x258),
      });
    _0x50357b.textContent = joinMetricLabels([
      ['秒数', _0x433940],
      ['帧率', _0x2a1cef],
      ['分辨率', _0x134e54],
    ]);
  } else {
    if (_0x50357b && _0x2186a9) {
      const _0x3064f4 = _0x27940c(_0x2186a9, _0x2186a9.defaultValue || 77, {
          min: Number(_0x2186a9.min || 0),
          max: Number(_0x2186a9.max || 0xf423f),
        }),
        _0x2f3fac = _0x3064f4 === 0 ? t('aigenImage.uiSchema.fullLength') : String(_0x3064f4);
      if (_0x174a14) {
        const _0x3f10b7 = _0x27940c(_0x174a14, _0x174a14.defaultValue || 24);
        _0x50357b.textContent = joinMetricLabels([
          ['帧数', _0x2f3fac],
          ['帧率', _0x3f10b7],
          ['分辨率', _0x134e54],
        ]);
      } else
        _0x50357b.textContent = joinMetricLabels([
          ['帧数', _0x2f3fac],
          ['分辨率', _0x134e54],
        ]);
    } else _0x50357b && (_0x50357b.textContent = formatMetricLabel('分辨率', _0x134e54));
  }
  const _0x2f79c5 = _0x1f2878?.querySelector?.('[data-ui-schema-field="rhVideoFrames"] .rh-stepper-value');
  if (_0x2186a9 && _0x2f79c5) {
    const _0x39a2fc = _0x27940c(_0x2186a9, _0x2186a9.defaultValue || 77, {
      min: Number(_0x2186a9.min || 0),
      max: Number(_0x2186a9.max || 0xf423f),
    });
    ((_0x2f79c5.textContent = _0x39a2fc === 0 ? t('aigenImage.uiSchema.fullLength') : String(_0x39a2fc)),
      _0x2f79c5.setAttribute('aria-valuenow', String(_0x39a2fc)));
  }
  const _0x5491b3 = _0x1f2878?.querySelector?.('[data-ui-schema-field="rhVideoSeconds"] .rh-stepper-value');
  if (_0xde0468 && _0x5491b3) {
    const _0x3ba66a = _0x27940c(_0xde0468, _0xde0468.defaultValue || 5, {
      min: Number(_0xde0468.min || 1),
      max: Number(_0xde0468.max || 0x258),
    });
    ((_0x5491b3.textContent = String(_0x3ba66a)), _0x5491b3.setAttribute('aria-valuenow', String(_0x3ba66a)));
  }
  const _0x8eeec6 = _0x1f2878?.querySelector?.('.rh-v5-source-framecount');
  if (_0x8eeec6) {
    const _0x560fa6 = Number(_0x5d89d0?.rhVideoSourceFrameCount || 0);
    _0x8eeec6.textContent = _0x560fa6 ? String(_0x560fa6) : '—';
  }
}
function syncCompositeUiSchemaControls(_0x3a273a, _0x50af9c = {}) {
  (_0x3a273a
    .querySelectorAll('[data-ui-schema-composite-field="qualityRatio"]')
    .forEach((_0x552606) => syncQualityRatioComposite(_0x552606, _0x50af9c)),
    _0x3a273a
      .querySelectorAll('[data-ui-schema-composite-field="sectionPair"]')
      .forEach((_0x6e8580) => syncSectionPairComposite(_0x6e8580, _0x50af9c)),
    _0x3a273a
      .querySelectorAll('[data-ui-schema-composite-field="videoResolution"]')
      .forEach((_0x2097cb) => syncVideoResolutionComposite(_0x2097cb, _0x50af9c)),
    _0x3a273a
      .querySelectorAll('[data-ui-schema-composite-field="rhVideoParams"]')
      .forEach((_0x1e4cf3) => syncRhVideoParamsComposite(_0x1e4cf3, _0x50af9c)));
}

const UI_SCHEMA_POPUP_EXIT_MS = 0xa0;

function getUiSchemaValueOptions(_0x2e97c5){return Array["from"](_0x2e97c5?.["querySelectorAll"]?.("[data-ui-schema-value]")||[]);}

function findUiSchemaValueOption(_0x2e5a01,_0x42bb62){const _0x193fdd=String(_0x42bb62??'');return getUiSchemaValueOptions(_0x2e5a01)["find"](_0xad3a74=>String(_0xad3a74?.['dataset']?.['uiSchemaValue']??'')===_0x193fdd)||null;}

function findFirstEnabledUiSchemaValueOption(_0x3285fe){return getUiSchemaValueOptions(_0x3285fe)['find'](_0x321169=>_0x321169?.["dataset"]?.["uiSchemaDisabled"]!=="true")||null;}

function isFieldDisabledByCondition(_0x13df35,_0x1943aa){if(!_0x13df35||!_0x1943aa)return![];const _0x3dd5b5=_0x13df35?.["disableWhen"];if(!_0x3dd5b5||typeof _0x3dd5b5!=="object")return![];return optionDisableWhenMatches(_0x3dd5b5,_0x1943aa);}

function isFieldDisabledByUiState(_0x5f4165,_0x40d239){const _0x49f032=String(_0x5f4165?.['id']||'')["trim"]();if(!_0x49f032||!_0x40d239)return![];const _0x11d016=_0x40d239?.["uiSchemaFieldState"]?.[_0x49f032];return _0x11d016===!![]||_0x11d016?.["disabled"]===!![]||_0x11d016?.["readOnly"]===!![];}

function resolveFieldDisabled(_0x78089b,_0x5057d0){if(!_0x78089b)return![];if(isFieldDisabled(_0x78089b))return!![];return isFieldDisabledByUiState(_0x78089b,_0x5057d0||{})||isFieldDisabledByCondition(_0x78089b,_0x5057d0||{});}

const BUILTIN_ADAPTIVE_RATIO_OPTION=Object["freeze"]({'value':"自适应",'label':"自适应"});

function getRatioOptions(_0x2dba21,_0x2f3436={}){const _0x83238c=getVisibleOptions(_0x2dba21,_0x2f3436);return _0x83238c["some"](_0x1f658f=>isAdaptiveRatioOption(_0x2dba21,_0x1f658f))?_0x83238c:[BUILTIN_ADAPTIVE_RATIO_OPTION,..._0x83238c];}

function getVoiceCompositeModeField(_0x59d595={},_0x3a13d5={}){return firstNonEmptyString(_0x59d595?.['modeField'],_0x3a13d5?.["modeField"],_0x59d595?.['voiceModeField'],_0x3a13d5?.["voiceModeField"],'voiceMode');}

function getVoiceCompositeDefaultModeValue(_0x114211={},_0x4725e6={}){return firstNonEmptyString(_0x114211?.["modeValue"],_0x114211?.["defaultModeValue"],_0x4725e6?.["defaultModeValue"],'default');}

function getVoiceCompositeCustomModeValue(_0x39fd1d={},_0x411afb={}){return firstNonEmptyString(_0x411afb?.["modeValue"],_0x411afb?.["filledModeValue"],_0x411afb?.["customModeValue"],_0x39fd1d?.["customModeValue"],"custom");}

function renderVoiceQualityRatioField(_0x2199e0,_0x4d22d7){const _0x58a14c=(Array["isArray"](_0x2199e0)?_0x2199e0:[])["filter"](Boolean);if(_0x58a14c["length"]<0x2)return'';const _0x451195=_0x58a14c[0x0],_0x1ec3e1=_0x58a14c[0x1];assertSupportedField(_0x451195),assertSupportedField(_0x1ec3e1);const _0x5f0801=getVoiceCompositeModeField(_0x451195,_0x1ec3e1),_0x2868b9=getVoiceCompositeDefaultModeValue(_0x451195,_0x1ec3e1),_0x1c1c7b=getVoiceCompositeCustomModeValue(_0x451195,_0x1ec3e1),_0x5172dc=getFieldValue(_0x4d22d7,_0x451195),_0x37dd26=String(getFieldValue(_0x4d22d7,_0x1ec3e1)||'')["trim"](),_0x2d6d21=_0x5f0801?String(getNodeFieldValue(_0x4d22d7,_0x5f0801,'')||'')["trim"]():'',_0x90bf25=getOptionLabel(_0x451195,_0x5172dc),_0x5bfcb0=resolveAudioVoiceCompositeState({'voiceTypeValue':_0x5172dc,'voiceTypeLabel':_0x90bf25,'speakerIdValue':_0x37dd26,'voiceModeValue':_0x2d6d21,'defaultModeValue':_0x2868b9,'customModeValue':_0x1c1c7b}),_0x8d283c=_0x5bfcb0["speakerIdValue"],_0x105eaf=_0x5bfcb0["triggerLabel"],_0x45dd51=_0x5bfcb0['customAreaClassName'],_0x832c94=_0x5bfcb0["defaultAreaClassName"],_0x25a453=manifestText(_0x1ec3e1?.["label"]||"自定义音色ID"),_0x10f025=String(_0x1ec3e1?.['placeholder']||"留空使用预设音色")['trim'](),_0x1a8859=String(_0x1ec3e1?.["helpUrl"]||'')['trim'](),_0x426b42=_0x1a8859?"<span class=\"rh-tip ui-schema-info-tip\" data-tooltip=\""+escapeHtmlAttr(_0x1ec3e1?.["description"]||"填写后覆盖预设音色，默认音色将不可选。点击旁边链接可跳转音色库获取完整音色ID。")+"\">!</span><a href=\"#\" class=\"ui-schema-help-link img-rp-voice-help-link\" data-ui-schema-field-help-url=\""+escapeHtmlAttr(_0x1a8859)+'\x22\x20title=\x22打开火山音色库\x22\x20onclick=\x22return\x20false;\x22><svg\x20width=\x2212\x22\x20height=\x2212\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22><path\x20d=\x22M18\x2013v6a2\x202\x200\x200\x201-2\x202H5a2\x202\x200\x200\x201-2-2V8a2\x202\x200\x200\x201\x202-2h6\x22/><polyline\x20points=\x2215\x203\x2021\x203\x2021\x209\x22/><line\x20x1=\x2210\x22\x20y1=\x2214\x22\x20x2=\x2221\x22\x20y2=\x223\x22/></svg></a>':'',_0x2b68aa="<div class=\"img-rp-quality-area img-rp-voice-custom-area"+_0x45dd51+"\" data-ui-schema-field=\""+escapeHtmlAttr(_0x1ec3e1['id'])+'\x22\x20data-ui-schema-type=\x22text\x22\x20data-ui-schema-default=\x22'+escapeHtmlAttr(_0x1ec3e1?.["defaultValue"]??'')+'\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22img-rp-section-label\x22>'+escapeHtmlAttr(_0x25a453)+_0x426b42+"</div>\n      <div class=\"img-rp-voice-input-wrap\">\n        <input type=\"text\" class=\"img-rp-voice-input\" data-ui-schema-input=\""+escapeHtmlAttr(_0x1ec3e1['id'])+"\" data-ui-schema-field=\""+escapeHtmlAttr(_0x1ec3e1['id'])+"\" data-ui-schema-value=\""+escapeHtmlAttr(_0x8d283c)+"\" placeholder=\""+escapeHtmlAttr(_0x10f025)+"\" value=\""+escapeHtmlAttr(_0x8d283c)+"\" />\n      </div>\n    </div>",_0x161a5f=manifestText(_0x451195?.["label"]||"默认音色"),_0x31fefb=getVisibleOptions(_0x451195,_0x4d22d7),_0x35e75a=_0x31fefb["map"](_0x33dc44=>{const _0x2be507=getOptionValue(_0x33dc44),_0x4018d8=manifestText(_0x33dc44?.["label"]??_0x2be507),_0x48799e=String(_0x5172dc??'')===String(_0x2be507);return "<button type=\"button\" class=\"img-rp-ratio-item ui-schema-option "+(_0x48799e?"active":'')+"\" data-label=\""+escapeHtmlAttr(_0x2be507)+'\x22\x20data-ui-schema-value=\x22'+escapeHtmlAttr(_0x2be507)+'\x22><span>'+escapeHtmlAttr(_0x4018d8)+"</span></button>";})['join'](''),_0xf95b7a="<div class=\"img-rp-ratio-area img-rp-voice-default-area"+_0x832c94+"\" data-ui-schema-field=\""+escapeHtmlAttr(_0x451195['id'])+"\" data-ui-schema-type=\"segmented\" data-ui-schema-default=\""+escapeHtmlAttr(_0x451195?.['defaultValue']??'')+"\">\n      <div class=\"img-rp-section-label\">"+escapeHtmlAttr(_0x161a5f)+"</div>\n      <div class=\"img-rp-ratio-split\">\n        <div class=\"img-rp-ratio-right\">\n          "+_0x35e75a+"\n        </div>\n      </div>\n    </div>";return "<div class=\"ui-schema-voice-quality-ratio-pill\" data-ui-schema-composite-field=\"voiceQualityRatio\" data-ui-schema-primary-field=\""+escapeHtmlAttr(_0x451195['id'])+"\" data-ui-schema-secondary-field=\""+escapeHtmlAttr(_0x1ec3e1['id'])+'\x22\x20data-ui-schema-mode-field=\x22'+escapeHtmlAttr(_0x5f0801)+"\" data-ui-schema-default-mode-value=\""+escapeHtmlAttr(_0x2868b9)+'\x22\x20data-ui-schema-custom-mode-value=\x22'+escapeHtmlAttr(_0x1c1c7b)+"\">\n    <button type=\"button\" class=\"img-pill-btn ui-schema-menu-trigger\" data-ui-schema-menu-trigger=\"voiceQualityRatio\">\n      <svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z\"/><path d=\"M19 10v2a7 7 0 0 1-14 0v-2\"/><line x1=\"12\" y1=\"19\" x2=\"12\" y2=\"23\"/><line x1=\"8\" y1=\"23\" x2=\"16\" y2=\"23\"/></svg>\n      <span class=\"ui-schema-pill-label ui-schema-voice-quality-ratio-label\">"+escapeHtmlAttr(_0x105eaf)+"</span>\n    </button>\n    <div class=\"img-ratio-popup ui-schema-popup ui-schema-voice-quality-ratio-popup\" style=\"display:none;\">\n      "+_0x2b68aa+"\n      "+_0xf95b7a+"\n    </div>\n  </div>";}

function renderDropdownControl(_0x423ffc,_0x3fb940,_0x3b157d,_0x57f5b1={}){const _0x37c627=String(_0x423ffc?.['id']||'')["trim"](),_0x33447d=getOptionLabel(_0x423ffc,_0x3fb940),_0xb86433=_0x57f5b1?.["advanced"]?" ui-schema-advanced-dropdown":'',_0x56d998=String(_0x57f5b1?.['titleHtml']||''),_0x9c94a2=_0x57f5b1?.['advanced']?'<svg\x20class=\x22ui-schema-dropdown-chevron\x22\x20width=\x2212\x22\x20height=\x2212\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x222\x22\x20aria-hidden=\x22true\x22><polyline\x20points=\x226\x209\x2012\x2015\x2018\x209\x22></polyline></svg>':'',_0x1e0d51=resolveFieldDisabled(_0x423ffc,_0x3b157d)?'\x20disabled\x20aria-disabled=\x22true\x22\x20data-ui-schema-disabled=\x22true\x22':'';return "<div class=\"ui-schema-pill-menu"+_0xb86433+"\" data-ui-schema-dropdown>\n    <button type=\"button\" class=\"img-pill-btn ui-schema-menu-trigger\" data-ui-schema-menu-trigger=\""+escapeHtmlAttr(_0x37c627)+"\" aria-haspopup=\"listbox\" aria-expanded=\"false\""+_0x1e0d51+'>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22ui-schema-pill-label\x22>'+escapeHtmlAttr(_0x33447d)+"</span>\n      "+_0x9c94a2+"\n    </button>\n    <div class=\"floating-menu ui-schema-floating-menu\" role=\"listbox\" aria-hidden=\"true\">\n      "+_0x56d998+"\n      "+renderFloatingMenuItems(_0x423ffc,_0x3fb940,_0x3b157d)+"\n    </div>\n  </div>";}

function syncDurationPillField(_0x5edc03,_0x3d5188){if(!_0x5edc03?.["classList"]?.["contains"]("ui-schema-duration-pill"))return;const _0x3ae489=_0x5edc03["querySelector"](".ui-schema-duration-label");if(!_0x3ae489)return;_0x3ae489['textContent']=getRangeValueDisplayLabel(_0x5edc03,_0x3d5188,_0x3d5188+'S');}

function syncResolutionPillField(_0x5c602c,_0x36c455){if(!_0x5c602c?.["classList"]?.['contains']("ui-schema-resolution-pill"))return;const _0x1ad78f=_0x5c602c["querySelector"](".ui-schema-pill-label"),_0x5b5a77=_0x1ad78f?.["querySelector"]('.ui-schema-resolution-value');if(_0x5b5a77){_0x5b5a77['textContent']=String(_0x36c455);return;}const _0x592f5f=_0x5c602c["querySelector"](".rh-res-title")?.["textContent"]||'Resolution';if(_0x1ad78f)_0x1ad78f["textContent"]=_0x592f5f+'\x20'+_0x36c455;}

function formatRhAiAppFooterParamLabel(_0x3b604d,_0xf96ed0){const _0x454b32=String(_0x3b604d?.["dataset"]?.['uiSchemaFooterLabel']||_0x3b604d?.["dataset"]?.["uiSchemaField"]||'参数')["trim"](),_0x2baf5c=String(_0x3b604d?.["dataset"]?.['uiSchemaType']||'')['trim'](),_0x3695de=formatRhAiAppFooterParamValue(_0x2baf5c,_0xf96ed0);return _0x3695de?_0x454b32+" · "+_0x3695de:_0x454b32;}

function isRhAiAppFooterToggleOn(_0x13c632){if(_0x13c632===!![])return!![];if(_0x13c632===![])return![];const _0x1c7f0c=String(_0x13c632??'')["trim"]()['toLowerCase']();return["true",'1',"yes",'on']['includes'](_0x1c7f0c);}

function syncRhAiAppFooterParamField(_0x47ac12,_0xb7aac7){if(!_0x47ac12?.['classList']?.["contains"]("ui-schema-rh-aiapp-footer-param"))return;const _0x501dc3=_0x47ac12["querySelector"]("[data-ui-schema-rh-aiapp-footer-toggle]");if(_0x501dc3){const _0x392889=isRhAiAppFooterToggleOn(_0xb7aac7);_0x501dc3["dataset"]["uiSchemaValue"]=_0x392889?"false":"true",_0x501dc3["setAttribute"]("aria-pressed",String(_0x392889));const _0x5bba8d=_0x501dc3["querySelector"](".ui-schema-rh-aiapp-footer-value");if(_0x5bba8d)_0x5bba8d["textContent"]=formatRhAiAppFooterParamValue("toggle",_0x392889);const _0x207e1b=_0x501dc3["querySelector"](".ui-schema-pill-label");_0x207e1b&&(_0x207e1b["textContent"]=String(_0x47ac12?.["dataset"]?.["uiSchemaFooterLabel"]||_0x47ac12?.["dataset"]?.["uiSchemaField"]||'参数')['trim']());return;}const _0x2a1473=_0x47ac12["querySelector"]('.ui-schema-pill-label');if(!_0x2a1473)return;_0x2a1473["textContent"]=formatRhAiAppFooterParamLabel(_0x47ac12,_0xb7aac7);}

function formatRhAiAppFooterParamValue(_0x908890,_0x5b9247){if(_0x908890==="toggle")return isRhAiAppFooterToggleOn(_0x5b9247)?'是':'否';return String(_0x5b9247??'')["trim"]();}

function renderRhAiAppFooterDirectNumberField({field:_0xceb260,id:_0xa9ff,type:_0x166816,value:_0x220100,label:_0x5b81e7,defaultValue:_0xf960d8,valueTypeAttr:_0x2ab674,nodeData:_0x5b9cfb}){const _0x268f05=String(_0xceb260?.["valueType"]||_0xceb260?.["numberMode"]||'')["trim"]()["toLowerCase"](),_0x5d96d7=_0x268f05==="float"||_0x268f05==="decimal"?'decimal':'numeric',_0x55079e=[];_0xceb260?.['min']!==undefined&&_0xceb260?.["min"]!==null&&_0x55079e['push']('\x20min=\x22'+escapeHtmlAttr(_0xceb260["min"])+'\x22');_0xceb260?.['max']!==undefined&&_0xceb260?.["max"]!==null&&_0x55079e["push"]('\x20max=\x22'+escapeHtmlAttr(_0xceb260["max"])+'\x22');_0x55079e['push']('\x20step=\x22'+escapeHtmlAttr(_0xceb260?.["step"]??(_0x5d96d7==="decimal"?'any':0x1))+'\x22');const _0x1423ca=resolveFieldDisabled(_0xceb260,_0x5b9cfb)?" disabled aria-disabled=\"true\" data-ui-schema-disabled=\"true\"":'';return "<div class=\"ui-schema-field ui-schema-rh-aiapp-footer-param ui-schema-rh-aiapp-footer-param--input\" data-ui-schema-field=\""+escapeHtmlAttr(_0xa9ff)+'\x22\x20data-ui-schema-type=\x22'+escapeHtmlAttr(_0x166816)+"\" data-ui-schema-default=\""+escapeHtmlAttr(_0xf960d8)+'\x22\x20data-ui-schema-footer-label=\x22'+escapeHtmlAttr(_0x5b81e7)+'\x22'+_0x2ab674+renderStepperAttrs(_0xceb260,_0x166816)+'>\x0a\x20\x20\x20\x20<label\x20class=\x22ui-schema-rh-aiapp-footer-inline\x22>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22ui-schema-rh-aiapp-footer-inline-label\x22\x20data-tooltip=\x22'+escapeHtmlAttr(_0x5b81e7)+'\x22>'+escapeHtmlAttr(_0x5b81e7)+"</span>\n      <span class=\"ui-schema-rh-aiapp-footer-inline-separator\">·</span>\n      <input class=\"ui-schema-rh-aiapp-footer-input\" data-ui-schema-input=\""+escapeHtmlAttr(_0xa9ff)+'\x22\x20type=\x22number\x22\x20inputmode=\x22'+escapeHtmlAttr(_0x5d96d7)+"\" value=\""+escapeHtmlAttr(_0x220100)+"\" aria-label=\""+escapeHtmlAttr(_0x5b81e7)+'\x22'+_0x55079e['join']('')+_0x1423ca+">\n    </label>\n  </div>";}

function renderRhAiAppFooterToggleField({field:_0x268c92,id:_0x23986c,type:_0x3c4e94,value:_0x2f1612,label:_0x45ca5d,defaultValue:_0x16f7e0,valueTypeAttr:_0x55b2e3,nodeData:_0x55ca58}){const _0x988448=isRhAiAppFooterToggleOn(_0x2f1612),_0x1b3313=resolveFieldDisabled(_0x268c92,_0x55ca58)?" disabled aria-disabled=\"true\" data-ui-schema-disabled=\"true\"":'',_0x4fed07=formatRhAiAppFooterParamValue(_0x3c4e94,_0x988448);return "<div class=\"ui-schema-field ui-schema-rh-aiapp-footer-param ui-schema-rh-aiapp-footer-param--toggle\" data-ui-schema-field=\""+escapeHtmlAttr(_0x23986c)+"\" data-ui-schema-type=\""+escapeHtmlAttr(_0x3c4e94)+"\" data-ui-schema-default=\""+escapeHtmlAttr(_0x16f7e0)+'\x22\x20data-ui-schema-footer-label=\x22'+escapeHtmlAttr(_0x45ca5d)+'\x22'+_0x55b2e3+">\n    <button type=\"button\" class=\"img-pill-btn ui-schema-rh-aiapp-footer-toggle\" data-ui-schema-rh-aiapp-footer-toggle=\"true\" data-ui-schema-value=\""+escapeHtmlAttr(_0x988448?"false":"true")+'\x22\x20aria-pressed=\x22'+escapeHtmlAttr(_0x988448)+'\x22'+_0x1b3313+">\n      <span class=\"ui-schema-pill-label\">"+escapeHtmlAttr(_0x45ca5d)+"</span>\n      <span class=\"ui-schema-rh-aiapp-footer-separator\" aria-hidden=\"true\">·</span>\n      <span class=\"ui-schema-rh-aiapp-footer-value\">"+escapeHtmlAttr(_0x4fed07)+"</span>\n    </button>\n  </div>";}

function renderRhAiAppFooterParamField(_0x333569,_0x2faf78){assertSupportedField(_0x333569);const _0x4453c1=String(_0x333569?.['id']||'')["trim"](),_0x261928=normalizeControlType(_0x333569?.["type"]),_0x4990bc=getFieldValue(_0x2faf78,_0x333569),_0x14d106=manifestText(_0x333569?.['label']||_0x4453c1),_0x397b9e=_0x333569?.["defaultValue"]??'',_0x22dea2=typeof _0x333569?.["defaultValue"]==='boolean'?" data-ui-schema-value-type=\"boolean\"":_0x261928==="stepper"?" data-ui-schema-value-type=\"number\"":'',_0x23b6f3=_0x261928==="stepper"?" ui-schema-rh-video-stepper":'';if(_0x261928==="stepper")return renderRhAiAppFooterDirectNumberField({'field':_0x333569,'id':_0x4453c1,'type':_0x261928,'value':_0x4990bc,'label':_0x14d106,'defaultValue':_0x397b9e,'valueTypeAttr':_0x22dea2,'nodeData':_0x2faf78});if(_0x261928==='toggle')return renderRhAiAppFooterToggleField({'field':_0x333569,'id':_0x4453c1,'type':_0x261928,'value':_0x4990bc,'label':_0x14d106,'defaultValue':_0x397b9e,'valueTypeAttr':_0x22dea2,'nodeData':_0x2faf78});const _0x23e6df=renderControl(_0x333569,_0x4990bc,_0x261928,{'nodeData':_0x2faf78,'advanced':!![]}),_0x59802c=formatRhAiAppFooterParamValue(_0x261928,_0x4990bc),_0x58649d=_0x59802c?_0x14d106+" · "+_0x59802c:_0x14d106;return "<div class=\"ui-schema-field ui-schema-pill-menu ui-schema-rh-aiapp-footer-param"+_0x23b6f3+"\" data-ui-schema-field=\""+escapeHtmlAttr(_0x4453c1)+"\" data-ui-schema-type=\""+escapeHtmlAttr(_0x261928)+"\" data-ui-schema-default=\""+escapeHtmlAttr(_0x397b9e)+"\" data-ui-schema-footer-label=\""+escapeHtmlAttr(_0x14d106)+'\x22'+_0x22dea2+renderStepperAttrs(_0x333569,_0x261928)+'>\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22img-pill-btn\x20ui-schema-menu-trigger\x22\x20data-ui-schema-menu-trigger=\x22'+escapeHtmlAttr(_0x4453c1)+"\">\n      <span class=\"ui-schema-pill-label\">"+escapeHtmlAttr(_0x58649d)+"</span>\n    </button>\n    <div class=\"floating-menu ui-schema-floating-menu ui-schema-rh-aiapp-footer-menu\">\n      <div class=\"ui-schema-floating-menu-title\">"+escapeHtmlAttr(_0x14d106)+"</div>\n      <div class=\"ui-schema-rh-aiapp-footer-control\">"+_0x23e6df+"</div>\n    </div>\n  </div>";}

function isStandaloneResolutionField(_0xfb65fd){if(_0xfb65fd?.["standaloneInResolution"]===!![])return!![];return String(_0xfb65fd?.['resolutionComposite']||'')['trim']()["toLowerCase"]()==="standalone";}

export function hasVisibleModelUiSchema(_0x158bf5,_0x279c86={},_0x1ab86d={}){const _0x3045e8=getUiSchemaFields(_0x158bf5,_0x1ab86d);return _0x3045e8['forEach'](assertSupportedField),filterVisibleUiSchemaFields(_0x3045e8,_0x279c86)["length"]>0x0;}

function handleRandomSeedRowBindEvent({event:_0x350783,eventName:_0x75eb85,fieldEl:_0x1edde2,helpers:helpers={}}={}){if(_0x75eb85!=="click"||!_0x1edde2)return![];const _0x3a0141=helpers["commitValue"];if(typeof _0x3a0141!=="function")return![];const _0x179e57=typeof helpers["setRhVideoStepperValueEl"]==='function'?helpers["setRhVideoStepperValueEl"]:()=>{},_0x33466d=typeof helpers['generateRandomSeedForField']==='function'?helpers['generateRandomSeedForField']:()=>'',_0x3632c5=_0x350783?.["target"]?.["closest"]?.('[data-ui-schema-random-seed-mode]');if(_0x3632c5&&_0x1edde2["contains"](_0x3632c5)){_0x350783["preventDefault"]?.(),_0x350783["stopPropagation"]?.();const _0x55bda8=String(_0x3632c5['dataset']['uiSchemaRandomSeedModeField']||_0x1edde2["dataset"]?.["uiSchemaRandomSeedModeField"]||'')['trim'](),_0x4d4ee6=normalizeRandomSeedMode(_0x3632c5['dataset']["uiSchemaRandomSeedMode"],"fixed");if(!_0x55bda8)return!![];_0x3a0141(_0x55bda8,_0x4d4ee6);if(_0x4d4ee6==="random"){const _0x16e7bf=String(_0x1edde2['dataset']["uiSchemaField"]||'')["trim"](),_0x443850=_0x33466d(_0x1edde2);_0x1edde2['classList']?.["contains"]("ui-schema-rh-video-stepper")&&_0x179e57(_0x1edde2,_0x443850);const _0x348ed0=_0x1edde2['querySelector']('[data-ui-schema-input]');if(_0x348ed0)_0x348ed0['value']=_0x443850;if(_0x16e7bf)_0x3a0141(_0x16e7bf,_0x443850);}return!![];}const _0x3cab5f=_0x350783?.["target"]?.["closest"]?.("[data-ui-schema-random-seed]");if(_0x3cab5f&&_0x1edde2["contains"](_0x3cab5f)){_0x350783['preventDefault']?.(),_0x350783["stopPropagation"]?.();const _0x5b503e=String(_0x1edde2?.["dataset"]?.["uiSchemaField"]||'')['trim']();if(!_0x5b503e)return!![];const _0x14ef38=_0x33466d(_0x1edde2);_0x1edde2["classList"]?.['contains']('ui-schema-rh-video-stepper')&&_0x179e57(_0x1edde2,_0x14ef38);const _0x424787=_0x1edde2['querySelector']("[data-ui-schema-input]");if(_0x424787)_0x424787["value"]=_0x14ef38;return _0x3a0141(_0x5b503e,_0x14ef38),!![];}return![];}

const uiSchemaStateOwner=createUiSchemaStateOwner({'getUiSchemaValueOptions':getUiSchemaValueOptions,'findUiSchemaValueOption':findUiSchemaValueOption,'findFirstEnabledUiSchemaValueOption':findFirstEnabledUiSchemaValueOption,'syncInstanceToggleField':syncInstanceToggleField,'syncStepperField':syncStepperField,'syncRhAiAppFooterParamField':syncRhAiAppFooterParamField,'parseRangeValuesFromFieldEl':parseRangeValuesFromFieldEl,'findRangeValueIndex':findRangeValueIndex,'normalizeRhV54SpecialMode':normalizeRhV54SpecialMode,'normalizeRhV54SinglePreset':normalizeRhV54SinglePreset,'normalizeRhV54MaskExpand':normalizeRhV54MaskExpand,'formatRhV54BreastJiggle':formatRhV54BreastJiggle,'getRhV54BreastJiggleRangeFromFieldEl':getRhV54BreastJiggleRangeFromFieldEl,'normalizeNumberValue':normalizeNumberValue,'formatMetricLabel':formatMetricLabel,'joinMetricLabels':joinMetricLabels});
