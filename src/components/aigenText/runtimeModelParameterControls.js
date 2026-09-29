import {
  CLI_PROVIDER_STATUS_CHANGED_EVENT,
  fetchCliProviderModels,
  getCachedCliProviderStatus,
} from '../../../api/cliProviderApi.js';
import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
import {
  buildActiveModelGenerationParamPatch,
  normalizeGenerationParams,
} from '../../modules/modelGenerationParamMemory.js';
import {
  bindModelUiSchemaControls,
  renderModelUiSchemaControls,
  syncModelUiSchemaControls,
} from '../aigenImage/uiSchemaRenderer.js';
const RUNTIME_OPTIONS_SOURCE = 'cliProviderModelCatalog',
  AUTO_VALUE = 'auto',
  CATALOG_STATUS_OPTION_VALUES = Object['freeze']({
    loading: '__cli_catalog_loading__',
    error: '__cli_catalog_error__',
  }),
  REASONING_EFFORT_LABELS = Object['freeze']({
    none: '无',
    minimal: '最低',
    low: '低',
    medium: '中',
    high: '高',
    xhigh: '极高',
    max: '最大',
    ultra: '极致',
  });
function isPlainObject(_0x1237ec) {
  return !!_0x1237ec && typeof _0x1237ec === 'object' && !Array['isArray'](_0x1237ec);
}
function getRuntimeOptions(_0x262f30 = {}) {
  const _0x93076e = _0x262f30?.['extensions']?.['runtimeOptions'];
  return isPlainObject(_0x93076e) ? _0x93076e : null;
}
function getRuntimeParameterContract(_0x457587 = '') {
  const _0x2a77b6 = String(_0x457587 || '')['trim']();
  if (!_0x2a77b6) return null;
  let _0x210996 = null;
  try {
    _0x210996 = resolveModelExecution(_0x2a77b6);
  } catch {
    _0x210996 = null;
  }
  const _0x5476b7 = _0x210996?.['modelManifest'] || getModelManifest(_0x2a77b6),
    _0x14189c = (
      Array['isArray'](_0x5476b7?.['uiSchema']?.['fields']) ? _0x5476b7['uiSchema']['fields'] : []
    )['filter']((_0x545f11) => _0x545f11['placement'] === 'mode');
  if (!_0x14189c['length']) return null;
  const _0x4597f2 = String(_0x210996?.['executionManifest']?.['extensions']?.['cliProvider'] || '')['trim']();
  return { modelId: _0x2a77b6, cliProvider: _0x4597f2, fields: _0x14189c };
}
function captureOpenRuntimeParameterMenu(_0x15d78a) {
  const _0x1e160b = _0x15d78a?.['querySelectorAll']?.('[data-ui-schema-field]') || [];
  for (const _0x14e8a6 of _0x1e160b) {
    const _0x3c4235 =
      _0x14e8a6?.['__uiSchemaPortaledPopup'] ||
      _0x14e8a6?.['querySelector']?.('.ui-schema-floating-menu.show, .ui-schema-popup.show');
    if (!_0x3c4235?.['classList']?.['contains']?.('show')) continue;
    const _0x3ce50c = _0x3c4235['ownerDocument']?.['activeElement'],
      _0x1ebbaf = _0x3c4235['contains']?.(_0x3ce50c)
        ? String(_0x3ce50c?.['dataset']?.['uiSchemaValue'] || '')['trim']()
        : '';
    return {
      fieldId: String(_0x14e8a6?.['dataset']?.['uiSchemaField'] || '')['trim'](),
      focusedValue: _0x1ebbaf,
      scrollLeft: Number(_0x3c4235['scrollLeft']) || 0x0,
      scrollTop: Number(_0x3c4235['scrollTop']) || 0x0,
    };
  }
  return null;
}
function restoreRuntimeParameterMenu(_0x3b860a, _0x52a13b) {
  const _0x50b895 = String(_0x52a13b?.['fieldId'] || '')['trim']();
  if (!_0x50b895) return;
  const _0x103c8b = Array['from'](_0x3b860a?.['querySelectorAll']?.('[data-ui-schema-field]') || [])['find'](
      (_0x3defac) => String(_0x3defac?.['dataset']?.['uiSchemaField'] || '')['trim']() === _0x50b895,
    ),
    _0x2c3e1a = _0x103c8b?.['querySelector']?.('[data-ui-schema-menu-trigger]');
  if (!_0x2c3e1a || _0x2c3e1a['disabled'] === !![]) return;
  _0x2c3e1a['click']?.();
  const _0xc6fd3 =
    _0x103c8b?.['__uiSchemaPortaledPopup'] ||
    _0x103c8b?.['querySelector']?.('.ui-schema-floating-menu.show, .ui-schema-popup.show');
  if (!_0xc6fd3?.['classList']?.['contains']?.('show')) return;
  ((_0xc6fd3['scrollLeft'] = Number(_0x52a13b?.['scrollLeft']) || 0x0),
    (_0xc6fd3['scrollTop'] = Number(_0x52a13b?.['scrollTop']) || 0x0));
  const _0xc33461 = String(_0x52a13b?.['focusedValue'] || '')['trim']();
  if (!_0xc33461) return;
  const _0x1b1ad7 = Array['from'](_0xc6fd3['querySelectorAll']?.('[data-ui-schema-value]') || [])['find'](
    (_0x16fd81) => String(_0x16fd81?.['dataset']?.['uiSchemaValue'] || '')['trim']() === _0xc33461,
  );
  _0x1b1ad7?.['focus']?.({ preventScroll: !![] });
}
function normalizeCatalogModels(_0x15ff57 = {}) {
  const _0x217f04 = Array['isArray'](_0x15ff57?.['models']) ? _0x15ff57['models'] : [],
    _0x177d5b = new Set();
  return _0x217f04['reduce']((_0x58acbe, _0x48418f) => {
    if (!isPlainObject(_0x48418f)) return _0x58acbe;
    const _0x5edb7a = String(_0x48418f['id'] || _0x48418f['model'] || '')['trim']();
    if (!_0x5edb7a || _0x177d5b['has'](_0x5edb7a)) return _0x58acbe;
    _0x177d5b['add'](_0x5edb7a);
    const _0x36a071 = (
      Array['isArray'](_0x48418f['supportedReasoningEfforts']) ? _0x48418f['supportedReasoningEfforts'] : []
    )
      ['map']((_0x114d39) =>
        String(
          isPlainObject(_0x114d39)
            ? _0x114d39['reasoningEffort'] || _0x114d39['effort'] || _0x114d39['value'] || ''
            : _0x114d39 || '',
        )
          ['trim']()
          ['toLowerCase'](),
      )
      ['filter'](Boolean);
    return (
      _0x58acbe['push']({
        id: _0x5edb7a,
        model: String(_0x48418f['model'] || _0x5edb7a)['trim']() || _0x5edb7a,
        displayName:
          String(_0x48418f['displayName'] || _0x48418f['name'] || _0x5edb7a)['trim']() || _0x5edb7a,
        isDefault: _0x48418f['isDefault'] === !![],
        defaultReasoningEffort: String(_0x48418f['defaultReasoningEffort'] || '')
          ['trim']()
          ['toLowerCase'](),
        supportedReasoningEfforts: Array['from'](new Set(_0x36a071)),
      }),
      _0x58acbe
    );
  }, []);
}
function findDefaultCatalogModel(_0x35532b, _0x1a55b) {
  const _0x1a6abb = String(_0x35532b?.['defaultModel'] || '')['trim']();
  return (
    _0x1a55b['find']((_0x1db80c) => _0x1a6abb && _0x1db80c['id'] === _0x1a6abb) ||
    _0x1a55b['find']((_0x2661ac) => _0x2661ac['isDefault']) ||
    null
  );
}
function ensureSelectedOption(_0x16d2b6, _0x2b0f07, _0x49dc80 = '') {
  const _0x3f100e = String(_0x2b0f07 || '')['trim']();
  if (!_0x3f100e || _0x16d2b6['some']((_0x10618a) => String(_0x10618a?.['value'] || '') === _0x3f100e))
    return _0x16d2b6;
  return [
    ..._0x16d2b6,
    {
      value: _0x3f100e,
      label: _0x3f100e,
      selectedLabel: _0x49dc80 || _0x3f100e,
      subtitle: '当前保存值（目录中暂不可用）',
    },
  ];
}
function appendCatalogStatusOption(_0x4ec65c, _0x4c97f4 = '') {
  const _0x28916e = String(_0x4c97f4 || '')['trim'](),
    _0x491264 = CATALOG_STATUS_OPTION_VALUES[_0x28916e];
  if (!_0x491264) return _0x4ec65c;
  return [
    ..._0x4ec65c,
    {
      value: _0x491264,
      label: _0x28916e === 'loading' ? '正在读取模型…' : '模型列表读取失败',
      disabled: !![],
    },
  ];
}
function buildModelOptions(_0x3c377f, _0x2cd0ad, _0x364429, _0x5e861b, _0x4e5317) {
  const _0x5350f1 = findDefaultCatalogModel(_0x2cd0ad, _0x364429),
    _0x235a5d =
      (Array['isArray'](_0x3c377f?.['options']) ? _0x3c377f['options'] : [])['find'](
        (_0x488c29) => String(_0x488c29?.['value'] || '') === AUTO_VALUE,
      ) || {},
    _0x2ccba8 = {
      ..._0x235a5d,
      value: AUTO_VALUE,
      label: '自动',
      selectedLabel: '模型：自动',
      subtitle: _0x5350f1
        ? '跟随 CLI 默认模型：' + _0x5350f1['displayName']
        : '跟随\x20OpenAI\x20CLI\x20默认模型',
    },
    _0x25db61 = [
      _0x2ccba8,
      ..._0x364429['map']((_0x193315) => ({
        value: _0x193315['id'],
        label: _0x193315['displayName'],
        selectedLabel: _0x193315['displayName'],
        subtitle: [
          _0x193315['displayName'] === _0x193315['id'] ? '' : _0x193315['id'],
          _0x193315['isDefault'] ? 'CLI\x20默认' : '',
        ]
          ['filter'](Boolean)
          ['join'](' · '),
      })),
    ];
  return appendCatalogStatusOption(ensureSelectedOption(_0x25db61, _0x5e861b), _0x4e5317);
}
function buildReasoningOptions(_0x1ef7b2, _0x1f3865, _0x9a922b, _0x2e2763, _0x3de17e, _0x3a567f) {
  const _0xebebf1 = findDefaultCatalogModel(_0x1f3865, _0x9a922b),
    _0x4a413e =
      _0x2e2763 && _0x2e2763 !== AUTO_VALUE
        ? _0x9a922b['find'](
            (_0x5f5403) => _0x5f5403['id'] === _0x2e2763 || _0x5f5403['model'] === _0x2e2763,
          ) || null
        : _0xebebf1,
    _0x3379e9 =
      (Array['isArray'](_0x1ef7b2?.['options']) ? _0x1ef7b2['options'] : [])['find'](
        (_0x39d0c3) => String(_0x39d0c3?.['value'] || '') === AUTO_VALUE,
      ) || {},
    _0xf61c35 = [
      { ..._0x3379e9, value: AUTO_VALUE, label: '自动', selectedLabel: '推理：自动' },
      ...(_0x4a413e?.['supportedReasoningEfforts'] || [])['map']((_0x27cf67) => {
        const _0x48e54e = REASONING_EFFORT_LABELS[_0x27cf67] || _0x27cf67;
        return { value: _0x27cf67, label: _0x48e54e, selectedLabel: '推理：' + _0x48e54e };
      }),
    ];
  return appendCatalogStatusOption(
    ensureSelectedOption(_0xf61c35, _0x3de17e, '推理：' + (REASONING_EFFORT_LABELS[_0x3de17e] || _0x3de17e)),
    _0x3a567f,
  );
}
export function buildAIGenTextRuntimeParameterFields(
  _0x2b7733,
  _0x4943fc = {},
  _0x386c20 = {},
  { catalogStatus: catalogStatus = '' } = {},
) {
  const _0x5368dc = getRuntimeParameterContract(_0x2b7733);
  if (!_0x5368dc) return [];
  const _0x720d16 = normalizeGenerationParams(_0x4943fc?.['generationParams']),
    _0x3a4341 = normalizeCatalogModels(_0x386c20),
    _0x75f89c = String(_0x720d16['cliModel'] || AUTO_VALUE)['trim'](),
    _0x37de7b = String(_0x720d16['reasoningEffort'] || AUTO_VALUE)['trim']();
  return _0x5368dc['fields']['map']((_0x34a051) => {
    const _0x90daef = getRuntimeOptions(_0x34a051);
    if (_0x90daef?.['source'] !== RUNTIME_OPTIONS_SOURCE) return _0x34a051;
    const _0x41f059 = String(_0x90daef?.['kind'] || '')['trim'](),
      _0x480f3a =
        _0x41f059 === 'model'
          ? buildModelOptions(_0x34a051, _0x386c20, _0x3a4341, _0x75f89c, catalogStatus)
          : _0x41f059 === 'reasoningEffort'
            ? buildReasoningOptions(_0x34a051, _0x386c20, _0x3a4341, _0x75f89c, _0x37de7b, catalogStatus)
            : Array['isArray'](_0x34a051?.['options'])
              ? [..._0x34a051['options']]
              : [];
    return { ..._0x34a051, options: _0x480f3a };
  });
}
export function renderAIGenTextRuntimeParameterMarkup(
  _0x32129a,
  _0x2edd44 = {},
  _0x33bc55 = {},
  _0x1dc7f1 = {},
) {
  const _0x7b3a7d = buildAIGenTextRuntimeParameterFields(_0x32129a, _0x2edd44, _0x33bc55, _0x1dc7f1);
  if (!_0x7b3a7d['length']) return '';
  const _0x228f07 = Object['fromEntries'](
    _0x7b3a7d['map']((_0x5f283b) => [
      String(_0x5f283b?.['id'] || '')['trim'](),
      { options: Array['isArray'](_0x5f283b?.['options']) ? _0x5f283b['options'] : [] },
    ]),
  );
  return renderModelUiSchemaControls(_0x32129a, _0x2edd44, {
    placement: 'mode',
    fieldOverrides: _0x228f07,
    sourceId: _0x7b3a7d['some'](
      (_0x403cc7) => getRuntimeOptions(_0x403cc7)?.['source'] === RUNTIME_OPTIONS_SOURCE,
    )
      ? RUNTIME_OPTIONS_SOURCE
      : 'manifest',
  });
}
export function buildAIGenTextRuntimeParameterPatch({
  modelId: modelId = '',
  nodeData: nodeData = {},
  fieldId: fieldId = '',
  value: value = '',
  catalog: catalog = {},
} = {}) {
  const _0x35e4b3 = { ...nodeData, model: String(modelId || nodeData?.['model'] || '')['trim']() };
  let _0x2f75 = buildActiveModelGenerationParamPatch(_0x35e4b3, fieldId, value);
  if (!Object['keys'](_0x2f75)['length'] || fieldId !== 'cliModel') return _0x2f75;
  const _0x1abe7e = { ..._0x35e4b3, ..._0x2f75 },
    _0x201159 = normalizeCatalogModels(catalog),
    _0x5d51f2 = String(_0x1abe7e?.['generationParams']?.['cliModel'] || AUTO_VALUE)['trim'](),
    _0x3110b3 =
      _0x5d51f2 === AUTO_VALUE
        ? findDefaultCatalogModel(catalog, _0x201159)
        : _0x201159['find'](
            (_0x14bfe4) => _0x14bfe4['id'] === _0x5d51f2 || _0x14bfe4['model'] === _0x5d51f2,
          ) || null;
  if (!_0x3110b3) return _0x2f75;
  const _0x2d41c3 = new Set([AUTO_VALUE, ..._0x3110b3['supportedReasoningEfforts']]),
    _0xefabd4 = String(_0x1abe7e?.['generationParams']?.['reasoningEffort'] || AUTO_VALUE);
  if (_0x2d41c3['has'](_0xefabd4)) return _0x2f75;
  const _0x256b14 = buildActiveModelGenerationParamPatch(_0x1abe7e, 'reasoningEffort', AUTO_VALUE);
  return ((_0x2f75 = { ..._0x2f75, ..._0x256b14 }), _0x2f75);
}
export function bindAIGenTextRuntimeParameterControls(
  _0x3c815d,
  {
    modelId: modelId = '',
    nodeId: nodeId = '',
    store: store = null,
    getState: _0x4bb5a2,
    onChange: _0x402ab7,
    windowObject: windowObject = globalThis['window'],
  } = {},
) {
  const _0x482683 =
      _0x3c815d?.['matches']?.('[data-aigen-text-ui-schema-mode-slot]') ||
      _0x3c815d?.['dataset']?.['aigenTextUiSchemaModeSlot'] !== undefined,
    _0x4b8860 = _0x482683
      ? _0x3c815d
      : _0x3c815d?.['querySelector']?.('[data-aigen-text-ui-schema-mode-slot]');
  if (!_0x4b8860) return { destroy() {}, setModel() {}, sync() {} };
  const _0x2f5656 = String(nodeId || '')['trim'](),
    _0x53dc77 = _0x2f5656 || 'aigen-text-runtime-schema',
    _0x4bcd16 =
      !!_0x2f5656 &&
      !!store &&
      typeof store['getState'] === 'function' &&
      typeof store['updateNodeData'] === 'function',
    _0x566ad8 = _0x4bb5a2?.();
  let _0x1ded22 = isPlainObject(_0x566ad8) ? _0x566ad8 : {};
  const _0x54b058 = () => {
      if (_0x4bcd16) {
        const _0x32d22d = store['getState']?.()?.['nodes']?.[_0x2f5656];
        if (isPlainObject(_0x32d22d)) return _0x32d22d;
      }
      const _0x2392d0 = _0x4bb5a2?.();
      if (isPlainObject(_0x2392d0)) return ((_0x1ded22 = _0x2392d0), _0x2392d0);
      return _0x1ded22;
    },
    _0xee6afc = _0x4bcd16
      ? store
      : {
          getState: () => ({ nodes: { [_0x53dc77]: _0x54b058() } }),
          updateNodeData: (_0x199fe0, _0x4491f3 = {}) => {
            const _0x266318 = _0x54b058(),
              _0x474001 = _0x402ab7?.(_0x4491f3);
            _0x1ded22 = isPlainObject(_0x474001) ? _0x474001 : { ..._0x266318, ..._0x4491f3 };
          },
        };
  let _0x3e7390 = String(modelId || _0x54b058()?.['model'] || '')['trim'](),
    _0x840c60 = {},
    _0x156157 = () => {},
    _0x27c363 = ![],
    _0x929bdf = 0x0,
    _0x4addf5 = ![],
    _0x1dbda1 = ![],
    _0x52739f = '';
  const _0x3203e7 = () => {
      if (_0x27c363) return;
      const _0xc3c715 = captureOpenRuntimeParameterMenu(_0x4b8860);
      _0x156157?.();
      const _0x19d8e4 = _0x54b058(),
        _0x4bbe0a = _0x4addf5 ? 'loading' : _0x1dbda1 ? 'error' : '',
        _0x407fa2 = buildAIGenTextRuntimeParameterFields(_0x3e7390, _0x19d8e4, _0x840c60, {
          catalogStatus: _0x4bbe0a,
        }),
        _0x18be4a = _0x407fa2['length'] > 0x0;
      ((_0x4b8860['hidden'] = !_0x18be4a),
        (_0x4b8860['innerHTML'] = _0x18be4a
          ? renderAIGenTextRuntimeParameterMarkup(_0x3e7390, _0x19d8e4, _0x840c60, {
              catalogStatus: _0x4bbe0a,
            })
          : ''),
        (_0x52739f = String(_0x19d8e4?.['generationParams']?.['cliModel'] || AUTO_VALUE)['trim']()));
      if (!_0x18be4a) {
        _0x156157 = () => {};
        return;
      }
      ((_0x156157 = bindModelUiSchemaControls(_0x4b8860, {
        nodeId: _0x53dc77,
        nodeData: _0x19d8e4,
        store: _0xee6afc,
        buildPatch: (_0x24bd77, _0x252162, _0x4cdc3b) =>
          buildAIGenTextRuntimeParameterPatch({
            modelId: _0x3e7390,
            nodeData: _0x24bd77,
            fieldId: _0x252162,
            value: _0x4cdc3b,
            catalog: _0x840c60,
          }),
        afterCommit: (_0x46a7d) => {
          if (_0x46a7d === 'cliModel') {
            const _0x52f689 =
              globalThis['queueMicrotask'] || ((_0x3755f7) => Promise['resolve']()['then'](_0x3755f7));
            _0x52f689(_0x3203e7);
          }
        },
      })),
        restoreRuntimeParameterMenu(_0x4b8860, _0xc3c715));
    },
    _0x501ac3 = async ({ force: force = ![] } = {}) => {
      const _0x747fb4 = ++_0x929bdf;
      ((_0x4addf5 = !![]), (_0x1dbda1 = ![]), (_0x840c60 = {}), _0x3203e7());
      const _0x1f3aaf = getRuntimeParameterContract(_0x3e7390);
      if (!_0x1f3aaf?.['cliProvider']) {
        _0x4addf5 = ![];
        return;
      }
      try {
        const _0x11afdf = await fetchCliProviderModels(_0x1f3aaf['cliProvider'], { force: force });
        if (_0x27c363 || _0x747fb4 !== _0x929bdf) return;
        _0x840c60 = isPlainObject(_0x11afdf) ? _0x11afdf : {};
      } catch {
        if (_0x27c363 || _0x747fb4 !== _0x929bdf) return;
        ((_0x840c60 = {}), (_0x1dbda1 = !![]));
      }
      ((_0x4addf5 = ![]), _0x3203e7());
    },
    _0x5b8fe4 = () => {
      const _0x37d406 = getRuntimeParameterContract(_0x3e7390);
      if (!_0x37d406?.['cliProvider']) return;
      const _0x51d7d4 = getCachedCliProviderStatus(_0x37d406['cliProvider']),
        _0xa220d6 = _0x51d7d4?.['loggedIn'] === !![] || _0x51d7d4?.['authConfigured'] === !![];
      if (!_0xa220d6) return;
      !_0x4addf5 && normalizeCatalogModels(_0x840c60)['length'] === 0x0 && void _0x501ac3({ force: !![] });
    };
  return (
    windowObject?.['addEventListener']?.(CLI_PROVIDER_STATUS_CHANGED_EVENT, _0x5b8fe4),
    void _0x501ac3(),
    {
      setModel(_0x534429) {
        const _0x40ffca = String(_0x534429 || '')['trim']();
        if (_0x40ffca === _0x3e7390) {
          this['sync'](_0x54b058());
          return;
        }
        ((_0x3e7390 = _0x40ffca), void _0x501ac3());
      },
      sync(_0xe002e8 = _0x54b058()) {
        if (_0x27c363) return;
        const _0x966c92 = String(_0xe002e8?.['model'] || _0x3e7390)['trim']();
        if (_0x966c92 !== _0x3e7390) {
          ((_0x3e7390 = _0x966c92), void _0x501ac3());
          return;
        }
        const _0x12c58d = String(_0xe002e8?.['generationParams']?.['cliModel'] || AUTO_VALUE)['trim']();
        if (_0x12c58d !== _0x52739f) {
          _0x3203e7();
          return;
        }
        syncModelUiSchemaControls(_0x4b8860, _0xe002e8);
      },
      destroy() {
        ((_0x27c363 = !![]),
          (_0x929bdf += 0x1),
          _0x156157?.(),
          windowObject?.['removeEventListener']?.(CLI_PROVIDER_STATUS_CHANGED_EVENT, _0x5b8fe4),
          _0x4b8860['replaceChildren']?.());
      },
    }
  );
}
