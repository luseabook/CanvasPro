import {
  getModelManifest,
  normalizeUiSchemaFieldValue,
  resolveModelExecution,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import {
  getUiSchemaFieldAdapterDefinition,
  resolveUiSchemaFieldAdapterDefinition,
} from './uiSchemaControlAdapters.js';
import { resolveAudioVoiceCompositeState } from './audioVoiceCompositeState.js';
import { t } from '../../i18n/index.js';
export function getNodeFieldValue(_0x47692b, _0x20c1fd, _0x1f106b = '') {
  const _0x3818c1 = String(_0x20c1fd || '')['trim']();
  if (!_0x3818c1) return _0x1f106b;
  const _0x270cf7 = _0x47692b?.['generationParams'];
  if (
    _0x270cf7 &&
    typeof _0x270cf7 === 'object' &&
    !Array['isArray'](_0x270cf7) &&
    _0x270cf7[_0x3818c1] !== undefined
  )
    return _0x270cf7[_0x3818c1];
  if (
    _0x47692b &&
    typeof _0x47692b === 'object' &&
    !Array['isArray'](_0x47692b) &&
    _0x47692b[_0x3818c1] !== undefined
  )
    return _0x47692b[_0x3818c1];
  return _0x1f106b;
}
function getPlainGenerationParams(_0x1b56e4) {
  return _0x1b56e4 && typeof _0x1b56e4 === 'object' && !Array['isArray'](_0x1b56e4) ? { ..._0x1b56e4 } : {};
}
export function getUiSchemaParamContext(_0x204c06 = {}) {
  const _0x512601 = getPlainGenerationParams(_0x204c06?.['generationParams']),
    _0x2e390d = _0x204c06 && typeof _0x204c06 === 'object' && !Array['isArray'](_0x204c06) ? _0x204c06 : {};
  return { ..._0x2e390d, ..._0x512601 };
}
export function firstNonEmptyString(..._0x1bd8d5) {
  for (const _0x13fc6a of _0x1bd8d5) {
    const _0x49428a = String(_0x13fc6a ?? '')['trim']();
    if (_0x49428a) return _0x49428a;
  }
  return '';
}
function normalizeControlType(_0x51966e) {
  return String(_0x51966e || '')
    ['trim']()
    ['toLowerCase']();
}
function normalizeCompareValue(_0x3f05cc) {
  return String(_0x3f05cc ?? '')
    ['trim']()
    ['toLowerCase']();
}
export function getRenderedOptionDisableWhen(_0x38a315) {
  const _0x3808f6 = String(_0x38a315?.['dataset']?.['uiSchemaDisableWhenJson'] || '')['trim']();
  if (_0x3808f6)
    try {
      const _0x6457ce = JSON['parse'](_0x3808f6);
      return _0x6457ce && typeof _0x6457ce === 'object' ? _0x6457ce : null;
    } catch {
      return null;
    }
  const _0xb1e87c = String(_0x38a315?.['dataset']?.['uiSchemaDisableWhenField'] || '')['trim'](),
    _0x3f3cd1 = String(_0x38a315?.['dataset']?.['uiSchemaDisableWhenValues'] || '')
      ['split'](',')
      ['map']((_0x2686b4) => _0x2686b4['trim']())
      ['filter'](Boolean);
  return _0xb1e87c && _0x3f3cd1['length'] > 0x0 ? { field: _0xb1e87c, values: _0x3f3cd1 } : null;
}
export function optionDisableWhenMatches(_0x3367ff, _0x62087f = {}) {
  if (Array['isArray'](_0x3367ff))
    return _0x3367ff['some']((_0x162add) => optionDisableWhenMatches(_0x162add, _0x62087f));
  if (!_0x3367ff || typeof _0x3367ff !== 'object') return ![];
  if (Array['isArray'](_0x3367ff['any']))
    return _0x3367ff['any']['some']((_0x4d87eb) => optionDisableWhenMatches(_0x4d87eb, _0x62087f));
  if (Array['isArray'](_0x3367ff['all']))
    return _0x3367ff['all']['every']((_0x36b52c) => optionDisableWhenMatches(_0x36b52c, _0x62087f));
  const _0x25fa00 = String(_0x3367ff?.['field'] || _0x3367ff?.['param'] || '')['trim']();
  if (!_0x25fa00) return ![];
  const _0x207bad = _0x3367ff['values'] !== undefined ? _0x3367ff['values'] : _0x3367ff['value'],
    _0x5ed303 = Array['isArray'](_0x207bad) ? _0x207bad : [_0x207bad],
    _0x4ab83d = _0x5ed303['map'](normalizeCompareValue),
    _0x3d6601 = _0x4ab83d['includes'](normalizeCompareValue(getNodeFieldValue(_0x62087f, _0x25fa00, '')));
  return _0x3367ff['not'] ? !_0x3d6601 : _0x3d6601;
}
function mergeUiSchemaRepairPatches(_0x12cfce = {}, _0x20884a = {}) {
  const _0x186987 = { ..._0x12cfce };
  for (const [_0x52fcd8, _0x559bd5] of Object['entries'](_0x20884a)) {
    if (
      Object['prototype']['hasOwnProperty']['call'](_0x186987, _0x52fcd8) &&
      normalizeCompareValue(_0x186987[_0x52fcd8]) !== normalizeCompareValue(_0x559bd5)
    )
      return null;
    _0x186987[_0x52fcd8] = _0x559bd5;
  }
  return _0x186987;
}
function resolveMatchingOptionDisableRepair(_0x4637b3, _0x413135 = {}) {
  if (Array['isArray'](_0x4637b3) || Array['isArray'](_0x4637b3?.['any'])) {
    const _0x5496f9 = Array['isArray'](_0x4637b3) ? _0x4637b3 : _0x4637b3['any'];
    let _0x543225 = {};
    for (const _0x39c1bc of _0x5496f9) {
      if (!optionDisableWhenMatches(_0x39c1bc, _0x413135)) continue;
      const _0x4a6689 = resolveMatchingOptionDisableRepair(_0x39c1bc, _0x413135);
      if (!_0x4a6689) return null;
      _0x543225 = mergeUiSchemaRepairPatches(_0x543225, _0x4a6689);
      if (!_0x543225) return null;
    }
    return Object['keys'](_0x543225)['length'] > 0x0 ? _0x543225 : null;
  }
  if (Array['isArray'](_0x4637b3?.['all'])) {
    for (const _0x540ba6 of _0x4637b3['all']) {
      if (!optionDisableWhenMatches(_0x540ba6, _0x413135)) continue;
      const _0x4d1511 = resolveMatchingOptionDisableRepair(_0x540ba6, _0x413135);
      if (_0x4d1511 && Object['keys'](_0x4d1511)['length'] > 0x0) return _0x4d1511;
    }
    return null;
  }
  if (!_0x4637b3 || typeof _0x4637b3 !== 'object' || _0x4637b3['not'] !== !![]) return null;
  const _0x28b476 = String(_0x4637b3['field'] || _0x4637b3['param'] || '')['trim'](),
    _0x1fc783 = _0x4637b3['values'] !== undefined ? _0x4637b3['values'] : _0x4637b3['value'],
    _0x1d7182 = Array['isArray'](_0x1fc783) ? _0x1fc783 : [_0x1fc783];
  if (!_0x28b476 || _0x1d7182['length'] === 0x0) return null;
  const _0x4096de = getNodeFieldValue(_0x413135, _0x28b476, ''),
    _0x1bfebd = _0x1d7182['find'](
      (_0x271e24) => normalizeCompareValue(_0x271e24) !== normalizeCompareValue(_0x4096de),
    );
  return _0x1bfebd === undefined ? null : { [_0x28b476]: _0x1bfebd };
}
export function getOptionDisableRepairPatch(_0x1c6ff7, _0x4666e9 = {}) {
  if (!optionDisableWhenMatches(_0x1c6ff7, _0x4666e9)) return null;
  return resolveMatchingOptionDisableRepair(_0x1c6ff7, _0x4666e9);
}
export function uiSchemaConditionMatches(_0x1ae2ad, _0x18e496 = {}) {
  if (Array['isArray'](_0x1ae2ad))
    return _0x1ae2ad['some']((_0x3e9d06) => uiSchemaConditionMatches(_0x3e9d06, _0x18e496));
  if (!_0x1ae2ad || typeof _0x1ae2ad !== 'object') return ![];
  if (Array['isArray'](_0x1ae2ad['any']))
    return _0x1ae2ad['any']['some']((_0x319402) => uiSchemaConditionMatches(_0x319402, _0x18e496));
  if (Array['isArray'](_0x1ae2ad['all']))
    return _0x1ae2ad['all']['every']((_0x40c238) => uiSchemaConditionMatches(_0x40c238, _0x18e496));
  const _0x39c384 = String(_0x1ae2ad?.['field'] || _0x1ae2ad?.['param'] || '')['trim']();
  if (!_0x39c384) return ![];
  const _0x367bb0 = _0x1ae2ad['values'] !== undefined ? _0x1ae2ad['values'] : _0x1ae2ad['value'],
    _0x287a67 = Array['isArray'](_0x367bb0) ? _0x367bb0 : [_0x367bb0],
    _0x1c40b6 = _0x287a67['map'](normalizeCompareValue);
  return _0x1c40b6['includes'](normalizeCompareValue(getNodeFieldValue(_0x18e496, _0x39c384, '')));
}
export function filterVisibleUiSchemaFields(_0x45f676 = [], _0x21ad0d = {}) {
  return (Array['isArray'](_0x45f676) ? _0x45f676 : [])['filter']((_0x2b6cad) => {
    if (_0x2b6cad?.['showWhen'] && !uiSchemaConditionMatches(_0x2b6cad['showWhen'], _0x21ad0d)) return ![];
    if (_0x2b6cad?.['hideWhen'] && uiSchemaConditionMatches(_0x2b6cad['hideWhen'], _0x21ad0d)) return ![];
    return !![];
  });
}
function getUiSchemaModelIdForNode(_0x50cb39 = {}) {
  const _0x267c22 = String(_0x50cb39?.['model'] || '')['trim']();
  if (!_0x267c22) return '';
  if (getModelManifest(_0x267c22)) return _0x267c22;
  const _0x4c79d2 =
    resolveModelExecution(_0x267c22, { providerHint: _0x50cb39?.['provider'] }) ||
    resolveModelExecution(_0x267c22);
  return String(_0x4c79d2?.['canonicalModelId'] || _0x4c79d2?.['modelManifest']?.['modelId'] || _0x267c22)[
    'trim'
  ]();
}
function getUiSchemaFieldModePatch(_0x5165e0 = {}, _0x376a4e = '') {
  const _0x59c21f = firstNonEmptyString(_0x5165e0?.['modeField'], _0x5165e0?.['voiceModeField']);
  if (!_0x59c21f) return null;
  const _0x32e008 = firstNonEmptyString(_0x5165e0?.['modeValue']);
  if (_0x32e008) return { field: _0x59c21f, value: _0x32e008 };
  const _0xe69a59 = firstNonEmptyString(_0x5165e0?.['filledModeValue'], _0x5165e0?.['customModeValue']),
    _0x4bcad6 = firstNonEmptyString(_0x5165e0?.['emptyModeValue'], _0x5165e0?.['defaultModeValue']);
  if (!_0xe69a59 && !_0x4bcad6) return null;
  const _0x70c867 = String(_0x376a4e ?? '')['trim']() !== '';
  return { field: _0x59c21f, value: _0x70c867 ? _0xe69a59 : _0x4bcad6 };
}
export function buildUiSchemaParamPatch(_0x4b0bdb = {}, _0x1c7528 = '', _0xa210ca = '') {
  const _0x36ca54 = String(_0x1c7528 || '')['trim']();
  if (!_0x36ca54) return {};
  const _0x262a14 = getUiSchemaModelIdForNode(_0x4b0bdb),
    _0xa9e37b = getModelManifest(_0x262a14),
    _0x28c07c = Array['isArray'](_0xa9e37b?.['uiSchema']?.['fields'])
      ? _0xa9e37b['uiSchema']['fields']['find'](
          (_0x11c57d) => String(_0x11c57d?.['id'] || '')['trim']() === _0x36ca54,
        )
      : null,
    _0x4f45ec = _0x28c07c
      ? resolveUiSchemaFieldAdapterDefinition(_0x28c07c, {
          type: normalizeControlType(_0x28c07c?.['type']),
          variant: _0x28c07c?.['variant'],
        })
      : null,
    _0x1aa0d9 = { ...getUiSchemaParamContext(_0x4b0bdb), [_0x36ca54]: _0xa210ca },
    _0x583c9f = (_0x4f516c, _0x443adf, _0x1b1257 = {}) =>
      normalizeUiSchemaFieldValue(_0x4f516c, _0x443adf, {
        ..._0x1b1257,
        params: _0x1b1257?.['params'] || _0x1aa0d9,
      }),
    _0x3c641c =
      _0x4f45ec && typeof _0x4f45ec['normalize'] === 'function'
        ? _0x4f45ec['normalize']({
            field: _0x28c07c,
            value: _0xa210ca,
            nodeData: _0x4b0bdb,
            phase: 'commit',
            helpers: { normalizeUiSchemaFieldValue: _0x583c9f },
          })
        : _0x28c07c
          ? _0x583c9f(_0x28c07c, _0xa210ca)
          : _0xa210ca,
    _0x21ae2f = getPlainGenerationParams(_0x4b0bdb['generationParams']);
  _0x21ae2f[_0x36ca54] = _0x3c641c;
  const _0x3ded09 = _0x28c07c ? getUiSchemaFieldModePatch(_0x28c07c, _0x3c641c) : null;
  _0x3ded09?.['field'] && (_0x21ae2f[_0x3ded09['field']] = _0x3ded09['value']);
  const _0x4da2af = sanitizeModelUiSchemaParams(_0x262a14 || _0x4b0bdb?.['model'], _0x21ae2f, {
    includeDefaults: ![],
  });
  for (const _0x39df40 of Object['keys'](_0x21ae2f)) {
    !(_0x39df40 in _0x4da2af) && (_0x4da2af[_0x39df40] = _0x21ae2f[_0x39df40]);
  }
  const _0x28c511 = { generationParams: _0x4da2af },
    _0x3b09b8 = String(_0x4b0bdb?.['model'] || '')['trim']();
  return (
    _0x3b09b8 &&
      (_0x28c511['generationParamsByModel'] = {
        ...getPlainGenerationParams(_0x4b0bdb['generationParamsByModel']),
        [_0x3b09b8]: _0x4da2af,
      }),
    _0x28c511
  );
}
export function evaluateUiSchemaNumberExpression(_0x590134) {
  if (typeof _0x590134 === 'number') return Number['isFinite'](_0x590134) ? _0x590134 : NaN;
  const _0x5e485c = String(_0x590134 ?? '')['trim']();
  if (!_0x5e485c) return NaN;
  let _0x285ae1 = 0x0;
  const _0x31bdc0 = () => {
      while (/\s/['test'](_0x5e485c[_0x285ae1] || '')) _0x285ae1 += 0x1;
    },
    _0x502382 = () => {
      _0x31bdc0();
      const _0x503945 = _0x285ae1;
      let _0x543a33 = ![];
      while (/\d/['test'](_0x5e485c[_0x285ae1] || '')) {
        ((_0x543a33 = !![]), (_0x285ae1 += 0x1));
      }
      if (_0x5e485c[_0x285ae1] === '.') {
        _0x285ae1 += 0x1;
        while (/\d/['test'](_0x5e485c[_0x285ae1] || '')) {
          ((_0x543a33 = !![]), (_0x285ae1 += 0x1));
        }
      }
      if (!_0x543a33) return NaN;
      return Number(_0x5e485c['slice'](_0x503945, _0x285ae1));
    },
    _0x9d1f73 = () => {
      _0x31bdc0();
      const _0x396675 = _0x5e485c[_0x285ae1];
      if (_0x396675 === '+' || _0x396675 === '-') {
        _0x285ae1 += 0x1;
        const _0x1d0071 = _0x9d1f73();
        return _0x396675 === '-' ? -_0x1d0071 : _0x1d0071;
      }
      if (_0x5e485c[_0x285ae1] === '(') {
        _0x285ae1 += 0x1;
        const _0x759dae = _0x11d79b();
        _0x31bdc0();
        if (_0x5e485c[_0x285ae1] !== ')') return NaN;
        return ((_0x285ae1 += 0x1), _0x759dae);
      }
      return _0x502382();
    },
    _0x2eefe6 = () => {
      let _0x38f7c4 = _0x9d1f73();
      while (!![]) {
        _0x31bdc0();
        const _0x23ff8a = _0x5e485c[_0x285ae1];
        if (_0x23ff8a !== '*' && _0x23ff8a !== '/') return _0x38f7c4;
        _0x285ae1 += 0x1;
        const _0x35bd0a = _0x9d1f73();
        if (!Number['isFinite'](_0x38f7c4) || !Number['isFinite'](_0x35bd0a)) return NaN;
        if (_0x23ff8a === '/' && _0x35bd0a === 0x0) return NaN;
        _0x38f7c4 = _0x23ff8a === '*' ? _0x38f7c4 * _0x35bd0a : _0x38f7c4 / _0x35bd0a;
      }
    };
  function _0x11d79b() {
    let _0x5b22c0 = _0x2eefe6();
    while (!![]) {
      _0x31bdc0();
      const _0x162e03 = _0x5e485c[_0x285ae1];
      if (_0x162e03 !== '+' && _0x162e03 !== '-') return _0x5b22c0;
      _0x285ae1 += 0x1;
      const _0x30c97e = _0x2eefe6();
      if (!Number['isFinite'](_0x5b22c0) || !Number['isFinite'](_0x30c97e)) return NaN;
      _0x5b22c0 = _0x162e03 === '+' ? _0x5b22c0 + _0x30c97e : _0x5b22c0 - _0x30c97e;
    }
  }
  const _0x170381 = _0x11d79b();
  return (_0x31bdc0(), _0x285ae1 === _0x5e485c['length'] && Number['isFinite'](_0x170381) ? _0x170381 : NaN);
}
export function createUiSchemaStateOwner({
  getUiSchemaValueOptions: _0x15bbc,
  findUiSchemaValueOption: _0x3920b1,
  findFirstEnabledUiSchemaValueOption: _0x2126df,
  syncInstanceToggleField: _0x2ad868,
  syncStepperField: _0x8b7c0e,
  syncRhAiAppFooterParamField: _0x266feb,
  parseRangeValuesFromFieldEl: _0x4fc6ee,
  findRangeValueIndex: _0x1bd368,
  normalizeRhV54SpecialMode: _0xb6297a,
  normalizeRhV54SinglePreset: _0xb84a08,
  normalizeRhV54MaskExpand: _0x2d9148,
  formatRhV54BreastJiggle: _0x2959a6,
  getRhV54BreastJiggleRangeFromFieldEl: _0x420a90,
  normalizeNumberValue: _0x4c922b,
  formatMetricLabel: _0x301d94,
  joinMetricLabels: _0x2bb3d7,
} = {}) {
  function _0x5241b9(_0x3eec28) {
    const _0x4aa912 = String(_0x3eec28?.['dataset']?.['uiSchemaAdapter'] || '')['trim']();
    if (_0x4aa912) return _0x4aa912;
    if (_0x3eec28?.['classList']?.['contains']?.('ui-schema-duration-pill'))
      return 'field.durationPill.slider';
    if (_0x3eec28?.['classList']?.['contains']?.('ui-schema-resolution-pill'))
      return 'field.resolutionPill.slider';
    return '';
  }
  function _0x315e67(_0x4a8f0a, _0x34eefd = {}) {
    const _0x22976d = _0x5241b9(_0x4a8f0a);
    if (!_0x22976d) return;
    const _0x4eb232 = getUiSchemaFieldAdapterDefinition(_0x22976d);
    if (!_0x4eb232 || typeof _0x4eb232['sync'] !== 'function') return;
    _0x4eb232['sync']({
      fieldEl: _0x4a8f0a,
      nodeData: _0x34eefd,
      helpers: { getNodeFieldValue: getNodeFieldValue },
    });
  }
  function _0x483131(_0xe54d04, _0x416baa = {}) {
    _0xe54d04['querySelectorAll']('[data-ui-schema-disable-when-field], [data-ui-schema-disable-when-json]')[
      'forEach'
    ]((_0x4166d1) => {
      const _0x19dcbf = getRenderedOptionDisableWhen(_0x4166d1),
        _0x3e2ac2 = optionDisableWhenMatches(_0x19dcbf, _0x416baa),
        _0x4ccacb = _0x3e2ac2 ? getOptionDisableRepairPatch(_0x19dcbf, _0x416baa) : null,
        _0x557b1a = _0x3e2ac2 && !_0x4ccacb,
        _0x1e8a1e =
          _0x4166d1['dataset']['uiSchemaStaticDisabled'] === 'true' ||
          _0x4166d1['hasAttribute']('data-ui-schema-static-disabled'),
        _0x53a082 = Boolean(_0x1e8a1e || _0x557b1a);
      _0x4166d1['classList']?.['toggle']('disabled', _0x53a082);
      if (_0x53a082) {
        ((_0x4166d1['dataset']['uiSchemaDisabled'] = 'true'),
          _0x4166d1['setAttribute']('aria-disabled', 'true'));
        if ('disabled' in _0x4166d1) _0x4166d1['disabled'] = !![];
      } else {
        (delete _0x4166d1['dataset']['uiSchemaDisabled'],
          _0x4166d1['removeAttribute']('data-ui-schema-disabled'),
          _0x4166d1['removeAttribute']('aria-disabled'));
        if ('disabled' in _0x4166d1) _0x4166d1['disabled'] = ![];
      }
    });
  }
  function _0x281fce(_0x29d642, _0x3117bc = {}) {
    const _0x417a5f = String(_0x29d642?.['dataset']?.['uiSchemaField'] || '')['trim'](),
      _0x5deb0c = String(_0x29d642?.['dataset']?.['rhV54DisableOnSpecial'] || '')['trim'](),
      _0x4cee59 = _0x5deb0c && _0xb6297a(getNodeFieldValue(_0x3117bc, 'rhSpecialMode', '')) === _0x5deb0c,
      _0x4d3b18 = _0x417a5f === 'rhSubtractSubject' && _0x3117bc?.['rhV54HasMaskVideo'] === !![];
    (_0x5deb0c || _0x4d3b18) &&
      _0x29d642['classList']['toggle']('is-rh-disabled', Boolean(_0x4cee59 || _0x4d3b18));
    if (_0x29d642['classList']?.['contains']('ui-schema-rh-v54-control-mode')) {
      const _0x7c15c8 = String(getNodeFieldValue(_0x3117bc, 'rhControlMode', 'single') || 'single'),
        _0x2869c8 = _0xb84a08(getNodeFieldValue(_0x3117bc, 'rhSingleControlPreset', 'efficiency'));
      (_0x29d642['querySelectorAll']('[data-key=\x22rhSingleControlPreset\x22]')['forEach']((_0x66fc4f) =>
        _0x66fc4f['classList']['toggle'](
          'active',
          _0x7c15c8 !== 'multi' && _0x66fc4f['dataset']['value'] === _0x2869c8,
        ),
      ),
        _0x29d642['querySelectorAll']('[data-key=\x22rhControlMode\x22]')['forEach']((_0x13e2d6) =>
          _0x13e2d6['classList']['toggle'](
            'active',
            _0x7c15c8 === 'multi' && _0x13e2d6['dataset']['value'] === 'multi',
          ),
        ),
        _0x29d642['querySelector']('.rh-adv-single-group')?.['classList']['toggle'](
          'active',
          _0x7c15c8 !== 'multi',
        ),
        _0x29d642['querySelector']('.rh-adv-multi-group')?.['classList']['toggle'](
          'active',
          _0x7c15c8 === 'multi',
        ));
    }
    if (_0x29d642['classList']?.['contains']('ui-schema-rh-v54-mask-expand')) {
      const _0x2aa0f1 = _0x2d9148(
          getNodeFieldValue(_0x3117bc, 'rhMaskExpand', _0x29d642['dataset']['uiSchemaDefault'] || 0x19),
          Number(_0x29d642['dataset']['uiSchemaDefault'] || 0x19),
        ),
        _0x259fe4 = _0x29d642['querySelector']('.rh-stepper-value');
      _0x259fe4 &&
        ((_0x259fe4['textContent'] = String(_0x2aa0f1)),
        _0x259fe4['setAttribute']('aria-valuenow', String(_0x2aa0f1)));
    }
    if (_0x29d642['classList']?.['contains']('ui-schema-rh-v54-breast-jiggle')) {
      const _0x15b519 = _0x2959a6(
          getNodeFieldValue(_0x3117bc, _0x417a5f, _0x29d642['dataset']['uiSchemaDefault'] || 0x0),
          _0x420a90(_0x29d642),
        ),
        _0x23a52b = _0x29d642['querySelector']('.rh-breast-jiggle-slider');
      if (_0x23a52b) _0x23a52b['value'] = _0x15b519;
      const _0x43744c = _0x29d642['querySelector']('.rh-breast-jiggle-value');
      if (_0x43744c) _0x43744c['textContent'] = _0x15b519;
    }
  }
  function _0x310110(_0x423316, _0x226c1b = {}) {
    const _0x1b7844 = String(_0x423316?.['dataset']?.['uiSchemaField'] || '')['trim']();
    if (!_0x1b7844) return '';
    const _0x251767 =
        _0x423316?.['dataset']?.['uiSchemaLockedValue'] ??
        getNodeFieldValue(_0x226c1b, _0x1b7844, _0x423316?.['dataset']?.['uiSchemaDefault'] ?? ''),
      _0x139ed0 = _0x3920b1(_0x423316, _0x251767);
    if (_0x139ed0?.['dataset']?.['uiSchemaDisabled'] !== 'true') return _0x251767;
    const _0x39ba8f = _0x423316?.['dataset']?.['uiSchemaDefault'] ?? '',
      _0x48fae2 = _0x3920b1(_0x423316, _0x39ba8f);
    if (_0x48fae2?.['dataset']?.['uiSchemaDisabled'] !== 'true') return _0x39ba8f;
    const _0x54c47f = _0x2126df(_0x423316);
    return _0x54c47f?.['dataset']?.['uiSchemaValue'] ?? _0x251767;
  }
  function _0x1cebf5(_0x542fd6, _0x1abc6c, { adaptive: adaptive = ![] } = {}) {
    const _0x24ef90 = _0x3920b1(_0x542fd6, _0x1abc6c),
      _0x2718ab = String(
        _0x24ef90?.['dataset']?.['uiSchemaOptionLabel'] || _0x24ef90?.['textContent'] || _0x1abc6c || '',
      )['trim'](),
      _0xae2e73 = _0x2718ab['toLowerCase'](),
      _0x38ced7 = String(_0x1abc6c || '')
        ['trim']()
        ['toLowerCase']();
    if (
      adaptive &&
      (_0xae2e73 === 'auto' ||
        _0xae2e73 === 'adaptive' ||
        _0xae2e73 === '自适应' ||
        _0x38ced7 === 'auto' ||
        _0x38ced7 === 'adaptive' ||
        _0x38ced7 === '自适应')
    )
      return '自适应';
    return _0x2718ab;
  }
  function _0x5d1071(_0x1995cc, _0x4987e7 = {}) {
    const _0x4c7c3a =
        _0x1995cc?.['querySelector']?.('[data-ui-schema-field=\x22aspectRatio\x22]') ||
        _0x1995cc?.['querySelector']?.('[data-ui-schema-display-role="aspectRatio"]'),
      _0x5836a1 =
        _0x1995cc?.['querySelector']?.('[data-ui-schema-field="imageSize"]') ||
        _0x1995cc?.['querySelector']?.('[data-ui-schema-field="resolution"]') ||
        _0x1995cc?.['querySelector']?.('[data-ui-schema-field="videoSize"]') ||
        _0x1995cc?.['querySelector']?.('[data-ui-schema-field="quality"]') ||
        _0x1995cc?.['querySelector']?.('[data-ui-schema-display-role="resolution"]'),
      _0x2e1935 = Array['from'](_0x1995cc?.['querySelectorAll']?.('[data-ui-schema-field]') || [])['filter'](
        (_0xcdc19e) => _0xcdc19e !== _0x4c7c3a,
      );
    _0x2e1935['length'] === 0x0 && _0x5836a1 && _0x2e1935['push'](_0x5836a1);
    const _0x1578ab = _0x1995cc?.['querySelector']?.('.ui-schema-quality-ratio-label');
    if (!_0x2e1935['length'] || !_0x4c7c3a || !_0x1578ab) return;
    const _0x235b80 = _0x310110(_0x4c7c3a, _0x4987e7),
      _0x46a7a7 = _0x2e1935['map']((_0x3358c0) => _0x1cebf5(_0x3358c0, _0x310110(_0x3358c0, _0x4987e7))),
      _0x2e9cd3 = _0x1cebf5(_0x4c7c3a, _0x235b80, { adaptive: !![] });
    _0x1578ab['textContent'] =
      _0x46a7a7['length'] > 0x1
        ? [..._0x46a7a7, _0x2e9cd3]['join']('\x20·\x20')
        : String(_0x1995cc?.['dataset']?.['uiSchemaLabelOrder'] || '')['trim']() === 'fieldFirst'
          ? (_0x46a7a7[0x0] || '') + ' · ' + _0x2e9cd3
          : _0x2e9cd3 + '\x20·\x20' + (_0x46a7a7[0x0] || '');
  }
  function _0x190ba7(_0x2df763, _0xca9dc6 = {}) {
    const _0x289b54 = Array['from'](_0x2df763?.['querySelectorAll']?.('[data-ui-schema-field]') || []),
      _0x443082 = _0x2df763?.['querySelector']?.('.ui-schema-section-pair-label');
    if (_0x289b54['length'] < 0x2 || !_0x443082) return;
    const _0x29f2d0 = _0x289b54['map']((_0x4ee159) => _0x1cebf5(_0x4ee159, _0x310110(_0x4ee159, _0xca9dc6)))[
      'filter'
    ](Boolean);
    _0x29f2d0['length'] >= 0x2 && (_0x443082['textContent'] = _0x29f2d0['join'](' · '));
  }
  function _0x4c7da0(_0x55796d, _0xb28502 = {}) {
    const _0x5009d3 =
        _0x55796d?.['querySelector']?.('[data-ui-schema-field="rhVideoResolution"]') ||
        _0x55796d?.['querySelector']?.('[data-ui-schema-field="videoResolution"]'),
      _0x4f7652 = _0x55796d?.['querySelector']?.('.ui-schema-video-resolution-label');
    if (!_0x5009d3 || !_0x4f7652) return;
    const _0x254a46 = _0x55796d['querySelector']('[data-ui-schema-field="rhVideoFps"]'),
      _0x4a62b5 = _0x55796d['querySelector']('[data-ui-schema-field=\x22rhVideoFrames\x22]'),
      _0x32bbf6 = _0x310110(_0x5009d3, _0xb28502);
    if (!_0x254a46 || !_0x4a62b5) {
      _0x4f7652['textContent'] = _0x301d94('分辨率', _0x32bbf6);
      return;
    }
    const _0x569acf = _0x310110(_0x254a46, _0xb28502),
      _0x3292c9 = _0x310110(_0x4a62b5, _0xb28502),
      _0x1fe53f = Number(_0x3292c9) === 0x0 ? t('aigenImage.uiSchema.fullLength') : String(_0x3292c9 || '');
    _0x4f7652['textContent'] = _0x2bb3d7([
      ['帧数', _0x1fe53f],
      ['帧率', _0x569acf],
      ['分辨率', _0x32bbf6],
    ]);
  }
  function _0x218397(_0x53fb68, _0x484471 = {}) {
    const _0x58e9fa = _0x53fb68?.['querySelector']?.('.img-ratio-label'),
      _0x60b696 = Array['from'](_0x53fb68?.['querySelectorAll']?.('[data-ui-schema-field]') || [])['map'](
        (_0x2445f2) => ({
          id: _0x2445f2['dataset']['uiSchemaField'],
          defaultValue: _0x2445f2['dataset']['uiSchemaDefault'],
          min: _0x2445f2['dataset']['uiSchemaMin'],
          max: _0x2445f2['dataset']['uiSchemaMax'],
        }),
      ),
      _0x34e4fc = (_0x43c876) => _0x60b696['find']((_0x580350) => _0x580350['id'] === _0x43c876),
      _0x299777 = _0x34e4fc('rhVideoResolution'),
      _0x353001 = _0x34e4fc('rhVideoFps'),
      _0x4c9ec6 = _0x34e4fc('rhVideoFrames'),
      _0x1d70bb = _0x34e4fc('rhVideoSeconds'),
      _0x2482f4 = (_0x5d3ec6, _0x4aa845, _0x1977e5 = {}) =>
        _0x4c922b(
          getNodeFieldValue(_0x484471, _0x5d3ec6?.['id'], _0x5d3ec6?.['defaultValue'] ?? _0x4aa845),
          Number(_0x4aa845),
          _0x1977e5,
        ),
      _0x54a120 = _0x299777
        ? _0x2482f4(_0x299777, _0x299777['defaultValue'] || 0x340, { min: 0x340 })
        : 0x340;
    if (_0x58e9fa && _0x1d70bb) {
      const _0x14778e = _0x353001 ? _0x2482f4(_0x353001, _0x353001['defaultValue'] || 0x18) : 0x18,
        _0x130685 = _0x2482f4(_0x1d70bb, _0x1d70bb['defaultValue'] || 0x5, {
          min: Number(_0x1d70bb['min'] || 0x1),
          max: Number(_0x1d70bb['max'] || 0x258),
        });
      _0x58e9fa['textContent'] = _0x2bb3d7([
        ['秒数', _0x130685],
        ['帧率', _0x14778e],
        ['分辨率', _0x54a120],
      ]);
    } else {
      if (_0x58e9fa && _0x4c9ec6) {
        const _0xa4f418 = _0x2482f4(_0x4c9ec6, _0x4c9ec6['defaultValue'] || 0x4d, {
            min: Number(_0x4c9ec6['min'] || 0x0),
            max: Number(_0x4c9ec6['max'] || 0xf423f),
          }),
          _0x90f5a2 = _0xa4f418 === 0x0 ? t('aigenImage.uiSchema.fullLength') : String(_0xa4f418);
        if (_0x353001) {
          const _0x30b7b4 = _0x2482f4(_0x353001, _0x353001['defaultValue'] || 0x18);
          _0x58e9fa['textContent'] = _0x2bb3d7([
            ['帧数', _0x90f5a2],
            ['帧率', _0x30b7b4],
            ['分辨率', _0x54a120],
          ]);
        } else
          _0x58e9fa['textContent'] = _0x2bb3d7([
            ['帧数', _0x90f5a2],
            ['分辨率', _0x54a120],
          ]);
      } else _0x58e9fa && (_0x58e9fa['textContent'] = _0x301d94('分辨率', _0x54a120));
    }
    const _0xa9db1c = _0x53fb68?.['querySelector']?.(
      '[data-ui-schema-field="rhVideoFrames"] .rh-stepper-value',
    );
    if (_0x4c9ec6 && _0xa9db1c) {
      const _0x3b6709 = _0x2482f4(_0x4c9ec6, _0x4c9ec6['defaultValue'] || 0x4d, {
        min: Number(_0x4c9ec6['min'] || 0x0),
        max: Number(_0x4c9ec6['max'] || 0xf423f),
      });
      ((_0xa9db1c['textContent'] =
        _0x3b6709 === 0x0 ? t('aigenImage.uiSchema.fullLength') : String(_0x3b6709)),
        _0xa9db1c['setAttribute']('aria-valuenow', String(_0x3b6709)));
    }
    const _0x4996a5 = _0x53fb68?.['querySelector']?.(
      '[data-ui-schema-field="rhVideoSeconds"] .rh-stepper-value',
    );
    if (_0x1d70bb && _0x4996a5) {
      const _0x410f44 = _0x2482f4(_0x1d70bb, _0x1d70bb['defaultValue'] || 0x5, {
        min: Number(_0x1d70bb['min'] || 0x1),
        max: Number(_0x1d70bb['max'] || 0x258),
      });
      ((_0x4996a5['textContent'] = String(_0x410f44)),
        _0x4996a5['setAttribute']('aria-valuenow', String(_0x410f44)));
    }
    const _0x2a70d0 = _0x53fb68?.['querySelector']?.('.rh-v5-source-framecount');
    if (_0x2a70d0) {
      const _0x14290e = Number(_0x484471?.['rhVideoSourceFrameCount'] || 0x0);
      _0x2a70d0['textContent'] = _0x14290e ? String(_0x14290e) : '—';
    }
  }
  function _0x5db038(_0x4eb783, _0x1aa017 = {}) {
    const _0x15f1c1 = String(_0x4eb783?.['dataset']?.['uiSchemaPrimaryField'] || 'voiceType')['trim'](),
      _0x267f51 = String(_0x4eb783?.['dataset']?.['uiSchemaSecondaryField'] || 'speakerId')['trim'](),
      _0x5b8983 = String(_0x4eb783?.['dataset']?.['uiSchemaModeField'] || 'voiceMode')['trim'](),
      _0x45e6a9 = String(_0x4eb783?.['dataset']?.['uiSchemaDefaultModeValue'] || 'default')['trim'](),
      _0x35279b = String(_0x4eb783?.['dataset']?.['uiSchemaCustomModeValue'] || 'custom')['trim'](),
      _0x8e23e7 = _0x4eb783?.['querySelector']?.('.img-rp-voice-default-area'),
      _0x2d13d2 = _0x4eb783?.['querySelector']?.('.img-rp-voice-custom-area'),
      _0x2cc31e = _0x4eb783?.['querySelector']?.('.ui-schema-voice-quality-ratio-label');
    if (!_0x8e23e7 || !_0x2d13d2 || !_0x2cc31e) return;
    const _0x4672d5 = _0x8e23e7['dataset']['uiSchemaDefault']
        ? (getNodeFieldValue(_0x1aa017, _0x15f1c1) ?? _0x8e23e7['dataset']['uiSchemaDefault'])
        : getNodeFieldValue(_0x1aa017, _0x15f1c1),
      _0x6fae8a = String(getNodeFieldValue(_0x1aa017, _0x267f51) || '')['trim'](),
      _0x5f3d4f = String(getNodeFieldValue(_0x1aa017, _0x5b8983, '') || '')['trim'](),
      _0x1a86b5 = _0x8e23e7['dataset']['uiSchemaDefault'] ? (_0x1cebf5(_0x8e23e7, _0x4672d5) ?? '') : '',
      _0x368434 = resolveAudioVoiceCompositeState({
        voiceTypeValue: _0x4672d5,
        voiceTypeLabel: _0x1a86b5 || _0x45e6a9,
        speakerIdValue: _0x6fae8a,
        voiceModeValue: _0x5f3d4f,
        defaultModeValue: _0x45e6a9,
        customModeValue: _0x35279b,
      });
    (_0x8e23e7['classList']['toggle']('is-disabled', _0x368434['defaultAreaDisabled']),
      _0x2d13d2['classList']['toggle']('is-disabled', _0x368434['customAreaDisabled']),
      (_0x2cc31e['textContent'] = _0x368434['triggerLabel']));
  }
  function _0x4c74c7(_0x37a8be, _0x5d6f44 = {}) {
    (_0x37a8be['querySelectorAll']('[data-ui-schema-composite-field="qualityRatio"]')['forEach'](
      (_0x30b7d3) => _0x5d1071(_0x30b7d3, _0x5d6f44),
    ),
      _0x37a8be['querySelectorAll']('[data-ui-schema-composite-field="sectionPair"]')['forEach'](
        (_0x337755) => _0x190ba7(_0x337755, _0x5d6f44),
      ),
      _0x37a8be['querySelectorAll']('[data-ui-schema-composite-field="videoResolution"]')['forEach'](
        (_0x578fcb) => _0x4c7da0(_0x578fcb, _0x5d6f44),
      ),
      _0x37a8be['querySelectorAll']('[data-ui-schema-composite-field="rhVideoParams"]')['forEach'](
        (_0x4e010a) => _0x218397(_0x4e010a, _0x5d6f44),
      ),
      _0x37a8be['querySelectorAll']('[data-ui-schema-composite-field="voiceQualityRatio"]')['forEach'](
        (_0x5cb318) => _0x5db038(_0x5cb318, _0x5d6f44),
      ));
  }
  function _0x27e0f2(_0x5f583f, _0x4ea6ec = {}) {
    if (!_0x5f583f) return;
    (_0x483131(_0x5f583f, _0x4ea6ec),
      _0x5f583f['querySelectorAll']('[data-ui-schema-field]')['forEach']((_0x49f3c5) => {
        const _0x5f21b4 = String(_0x49f3c5['dataset']['uiSchemaField'] || '')['trim']();
        if (!_0x5f21b4) return;
        let _0x5e7342 =
          _0x49f3c5['dataset']['uiSchemaLockedValue'] ??
          getNodeFieldValue(_0x4ea6ec, _0x5f21b4, _0x49f3c5['dataset']['uiSchemaDefault']);
        const _0x9f34d4 = String(_0x49f3c5['dataset']['uiSchemaDefaultAliases'] || '')['trim']();
        if (_0x9f34d4)
          try {
            const _0xbf0ba0 = JSON['parse'](_0x9f34d4)
              ['map']((_0x1d2049) =>
                String(_0x1d2049 ?? '')
                  ['trim']()
                  ['toLowerCase'](),
              )
              ['filter'](Boolean);
            _0xbf0ba0['includes'](
              String(_0x5e7342 ?? '')
                ['trim']()
                ['toLowerCase'](),
            ) && (_0x5e7342 = _0x49f3c5['dataset']['uiSchemaDefault']);
          } catch {}
        const _0x1edfb4 = _0x3920b1(_0x49f3c5, _0x5e7342);
        if (_0x1edfb4?.['dataset']?.['uiSchemaDisabled'] === 'true') {
          const _0x2370f8 = _0x49f3c5['dataset']['uiSchemaDefault'],
            _0x4a7e8b = _0x3920b1(_0x49f3c5, _0x2370f8),
            _0x474795 =
              _0x4a7e8b?.['dataset']?.['uiSchemaDisabled'] === 'true' ? _0x2126df(_0x49f3c5) : _0x4a7e8b;
          _0x474795?.['dataset']?.['uiSchemaValue'] !== undefined &&
            (_0x5e7342 = _0x474795['dataset']['uiSchemaValue']);
        }
        _0x15bbc(_0x49f3c5)['forEach']((_0x15a651) => {
          _0x15a651['classList']['toggle'](
            'active',
            String(_0x15a651['dataset']['uiSchemaValue']) === String(_0x5e7342),
          );
        });
        const _0x2787e5 = _0x3920b1(_0x49f3c5, _0x5e7342),
          _0x1524d9 = _0x49f3c5['querySelector']('.ui-schema-pill-label');
        _0x1524d9 &&
          _0x2787e5?.['dataset']?.['uiSchemaOptionLabel'] &&
          (_0x1524d9['textContent'] = _0x2787e5['dataset']['uiSchemaOptionLabel']);
        (_0x2ad868(_0x49f3c5, _0x5e7342), _0x8b7c0e(_0x49f3c5, _0x5e7342), _0x266feb(_0x49f3c5, _0x5e7342));
        const _0x204392 = _0x49f3c5['querySelector']('[data-ui-schema-input]'),
          _0x33dc56 = typeof document !== 'undefined' ? document['activeElement'] : null;
        if (_0x204392 && _0x5e7342 !== undefined && _0x33dc56 !== _0x204392) {
          const _0x1bb32e = String(_0x49f3c5['dataset']['uiSchemaType'] || '')
              ['trim']()
              ['toLowerCase'](),
            _0x4d3147 =
              _0x1bb32e === 'text' ||
              _0x1bb32e === 'textarea' ||
              String(_0x204392['tagName'] || '')
                ['trim']()
                ['toLowerCase']() === 'textarea' ||
              String(_0x204392['type'] || '')
                ['trim']()
                ['toLowerCase']() === 'text';
          if (!_0x4d3147) {
            const _0x5d82b3 = _0x4fc6ee(_0x49f3c5),
              _0x2c5c76 = _0x1bd368(_0x5d82b3, _0x5e7342);
            _0x204392['value'] = _0x5d82b3?.['length']
              ? String(Math['max'](0x0, _0x2c5c76))
              : String(_0x5e7342);
          }
          const _0x56cfe1 = _0x49f3c5['querySelector']('.ui-schema-value');
          if (_0x56cfe1) _0x56cfe1['textContent'] = String(_0x5e7342);
        }
        (_0x281fce(_0x49f3c5, _0x4ea6ec), _0x315e67(_0x49f3c5, _0x4ea6ec));
      }),
      _0x4c74c7(_0x5f583f, _0x4ea6ec));
  }
  return Object['freeze']({ syncModelUiSchemaControls: _0x27e0f2 });
}
