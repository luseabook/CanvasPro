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
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
function getRuntimeOptions(options = {}) {
  const item = options?.['extensions']?.['runtimeOptions'];
  return isPlainObject(item) ? item : null;
}
function getRuntimeParameterContract(key = '') {
  const modelId2 = String(key || '')['trim']();
  if (!modelId2) return null;
  let modelExecution = null;
  try {
    modelExecution = resolveModelExecution(modelId2);
  } catch {
    modelExecution = null;
  }
  const index = modelExecution?.['modelManifest'] || getModelManifest(modelId2),
    fields = (Array['isArray'](index?.['uiSchema']?.['fields']) ? index['uiSchema']['fields'] : [])['filter'](
      (result) => result['placement'] === 'mode',
    );
  if (!fields['length']) return null;
  const cliProvider = String(modelExecution?.['executionManifest']?.['extensions']?.['cliProvider'] || '')[
    'trim'
  ]();
  return { modelId: modelId2, cliProvider: cliProvider, fields: fields };
}
function captureOpenRuntimeParameterMenu(el) {
  const data = el?.['querySelectorAll']?.('[data-ui-schema-field]') || [];
  for (const el2 of data) {
    const el3 =
      el2?.['__uiSchemaPortaledPopup'] ||
      el2?.['querySelector']?.('.ui-schema-floating-menu.show, .ui-schema-popup.show');
    if (!el3?.['classList']?.['contains']?.('show')) continue;
    const el4 = el3['ownerDocument']?.['activeElement'],
      focusedValue = el3['contains']?.(el4)
        ? String(el4?.['dataset']?.['uiSchemaValue'] || '')['trim']()
        : '';
    return {
      fieldId: String(el2?.['dataset']?.['uiSchemaField'] || '')['trim'](),
      focusedValue: focusedValue,
      scrollLeft: Number(el3['scrollLeft']) || 0,
      scrollTop: Number(el3['scrollTop']) || 0,
    };
  }
  return null;
}
function restoreRuntimeParameterMenu(el5, target) {
  const enabled2 = String(target?.['fieldId'] || '')['trim']();
  if (!enabled2) return;
  const el6 = Array['from'](el5?.['querySelectorAll']?.('[data-ui-schema-field]') || [])['find'](
      (el7) => String(el7?.['dataset']?.['uiSchemaField'] || '')['trim']() === enabled2,
    ),
    el8 = el6?.['querySelector']?.('[data-ui-schema-menu-trigger]');
  if (!el8 || el8['disabled'] === !![]) return;
  el8['click']?.();
  const el9 =
    el6?.['__uiSchemaPortaledPopup'] ||
    el6?.['querySelector']?.('.ui-schema-floating-menu.show, .ui-schema-popup.show');
  if (!el9?.['classList']?.['contains']?.('show')) return;
  ((el9['scrollLeft'] = Number(target?.['scrollLeft']) || 0),
    (el9['scrollTop'] = Number(target?.['scrollTop']) || 0));
  const enabled3 = String(target?.['focusedValue'] || '')['trim']();
  if (!enabled3) return;
  const el10 = Array['from'](el9['querySelectorAll']?.('[data-ui-schema-value]') || [])['find'](
    (el11) => String(el11?.['dataset']?.['uiSchemaValue'] || '')['trim']() === enabled3,
  );
  el10?.['focus']?.({ preventScroll: !![] });
}
function normalizeCatalogModels(options2 = {}) {
  const list = Array['isArray'](options2?.['models']) ? options2['models'] : [],
    map = new Set();
  return list['reduce']((list2, isDefault) => {
    if (!isPlainObject(isDefault)) return list2;
    const id = String(isDefault['id'] || isDefault['model'] || '')['trim']();
    if (!id || map['has'](id)) return list2;
    map['add'](id);
    const source = (
      Array['isArray'](isDefault['supportedReasoningEfforts']) ? isDefault['supportedReasoningEfforts'] : []
    )
      ['map']((el12) =>
        String(
          isPlainObject(el12) ? el12['reasoningEffort'] || el12['effort'] || el12['value'] || '' : el12 || '',
        )
          ['trim']()
          ['toLowerCase'](),
      )
      ['filter'](Boolean);
    return (
      list2['push']({
        id: id,
        model: String(isDefault['model'] || id)['trim']() || id,
        displayName: String(isDefault['displayName'] || isDefault['name'] || id)['trim']() || id,
        isDefault: isDefault['isDefault'] === !![],
        defaultReasoningEffort: String(isDefault['defaultReasoningEffort'] || '')
          ['trim']()
          ['toLowerCase'](),
        supportedReasoningEfforts: Array['from'](new Set(source)),
      }),
      list2
    );
  }, []);
}
function findDefaultCatalogModel(next, list3) {
  const current = String(next?.['defaultModel'] || '')['trim']();
  return (
    list3['find']((entry) => current && entry['id'] === current) ||
    list3['find']((record) => record['isDefault']) ||
    null
  );
}
function ensureSelectedOption(list4, payload, selectedLabel = '') {
  const value2 = String(payload || '')['trim']();
  if (!value2 || list4['some']((el13) => String(el13?.['value'] || '') === value2)) return list4;
  return [
    ...list4,
    {
      value: value2,
      label: value2,
      selectedLabel: selectedLabel || value2,
      subtitle: '当前保存值（目录中暂不可用）',
    },
  ];
}
function appendCatalogStatusOption(args, handle = '') {
  const label = String(handle || '')['trim'](),
    value3 = CATALOG_STATUS_OPTION_VALUES[label];
  if (!value3) return args;
  return [
    ...args,
    {
      value: value3,
      label: label === 'loading' ? '正在读取模型…' : '模型列表读取失败',
      disabled: !![],
    },
  ];
}
function buildModelOptions(state, config, list5, scope, input) {
  const subtitle = findDefaultCatalogModel(config, list5),
    args2 =
      (Array['isArray'](state?.['options']) ? state['options'] : [])['find'](
        (el14) => String(el14?.['value'] || '') === AUTO_VALUE,
      ) || {},
    output = {
      ...args2,
      value: AUTO_VALUE,
      label: '自动',
      selectedLabel: '模型：自动',
      subtitle: subtitle
        ? '跟随 CLI 默认模型：' + subtitle['displayName']
        : '跟随 OpenAI CLI 默认模型',
    },
    value4 = [
      output,
      ...list5['map']((value5) => ({
        value: value5['id'],
        label: value5['displayName'],
        selectedLabel: value5['displayName'],
        subtitle: [
          value5['displayName'] === value5['id'] ? '' : value5['id'],
          value5['isDefault'] ? 'CLI 默认' : '',
        ]
          ['filter'](Boolean)
          ['join'](' · '),
      })),
    ];
  return appendCatalogStatusOption(ensureSelectedOption(value4, scope), input);
}
function buildReasoningOptions(value6, value7, list6, value8, value9, value10) {
  const defaultCatalogModel = findDefaultCatalogModel(value7, list6),
    value11 =
      value8 && value8 !== AUTO_VALUE
        ? list6['find']((value12) => value12['id'] === value8 || value12['model'] === value8) || null
        : defaultCatalogModel,
    args3 =
      (Array['isArray'](value6?.['options']) ? value6['options'] : [])['find'](
        (el15) => String(el15?.['value'] || '') === AUTO_VALUE,
      ) || {},
    value13 = [
      { ...args3, value: AUTO_VALUE, label: '自动', selectedLabel: '推理：自动' },
      ...(value11?.['supportedReasoningEfforts'] || [])['map']((value14) => {
        const label2 = REASONING_EFFORT_LABELS[value14] || value14;
        return { value: value14, label: label2, selectedLabel: '推理：' + label2 };
      }),
    ];
  return appendCatalogStatusOption(
    ensureSelectedOption(value13, value9, '推理：' + (REASONING_EFFORT_LABELS[value9] || value9)),
    value10,
  );
}
export function buildAIGenTextRuntimeParameterFields(
  value15,
  value16 = {},
  value17 = {},
  { catalogStatus: catalogStatus = '' } = {},
) {
  const runtimeParameterContract = getRuntimeParameterContract(value15);
  if (!runtimeParameterContract) return [];
  const generationParams = normalizeGenerationParams(value16?.['generationParams']),
    catalogModels = normalizeCatalogModels(value17),
    value18 = String(generationParams['cliModel'] || AUTO_VALUE)['trim'](),
    value19 = String(generationParams['reasoningEffort'] || AUTO_VALUE)['trim']();
  return runtimeParameterContract['fields']['map']((args4) => {
    const runtimeOptions = getRuntimeOptions(args4);
    if (runtimeOptions?.['source'] !== RUNTIME_OPTIONS_SOURCE) return args4;
    const value20 = String(runtimeOptions?.['kind'] || '')['trim'](),
      options3 =
        value20 === 'model'
          ? buildModelOptions(args4, value17, catalogModels, value18, catalogStatus)
          : value20 === 'reasoningEffort'
            ? buildReasoningOptions(args4, value17, catalogModels, value18, value19, catalogStatus)
            : Array['isArray'](args4?.['options'])
              ? [...args4['options']]
              : [];
    return { ...args4, options: options3 };
  });
}
export function renderAIGenTextRuntimeParameterMarkup(value21, value22 = {}, value23 = {}, value24 = {}) {
  const sourceId = buildAIGenTextRuntimeParameterFields(value21, value22, value23, value24);
  if (!sourceId['length']) return '';
  const fieldOverrides = Object['fromEntries'](
    sourceId['map']((value25) => [
      String(value25?.['id'] || '')['trim'](),
      { options: Array['isArray'](value25?.['options']) ? value25['options'] : [] },
    ]),
  );
  return renderModelUiSchemaControls(value21, value22, {
    placement: 'mode',
    fieldOverrides: fieldOverrides,
    sourceId: sourceId['some']((value26) => getRuntimeOptions(value26)?.['source'] === RUNTIME_OPTIONS_SOURCE)
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
  const args5 = { ...nodeData, model: String(modelId || nodeData?.['model'] || '')['trim']() };
  let args6 = buildActiveModelGenerationParamPatch(args5, fieldId, value);
  if (!Object['keys'](args6)['length'] || fieldId !== 'cliModel') return args6;
  const value27 = { ...args5, ...args6 },
    list7 = normalizeCatalogModels(catalog),
    value28 = String(value27?.['generationParams']?.['cliModel'] || AUTO_VALUE)['trim'](),
    args7 =
      value28 === AUTO_VALUE
        ? findDefaultCatalogModel(catalog, list7)
        : list7['find']((value29) => value29['id'] === value28 || value29['model'] === value28) || null;
  if (!args7) return args6;
  const map2 = new Set([AUTO_VALUE, ...args7['supportedReasoningEfforts']]),
    value30 = String(value27?.['generationParams']?.['reasoningEffort'] || AUTO_VALUE);
  if (map2['has'](value30)) return args6;
  const args8 = buildActiveModelGenerationParamPatch(value27, 'reasoningEffort', AUTO_VALUE);
  return ((args6 = { ...args6, ...args8 }), args6);
}
export function bindAIGenTextRuntimeParameterControls(
  el16,
  {
    modelId: modelId = '',
    nodeId: nodeId = '',
    store: store = null,
    getState: getState,
    onChange: onChange,
    windowObject: windowObject = globalThis['window'],
  } = {},
) {
  const value31 =
      el16?.['matches']?.('[data-aigen-text-ui-schema-mode-slot]') ||
      el16?.['dataset']?.['aigenTextUiSchemaModeSlot'] !== undefined,
    el17 = value31 ? el16 : el16?.['querySelector']?.('[data-aigen-text-ui-schema-mode-slot]');
  if (!el17) return { destroy() {}, setModel() {}, sync() {} };
  const enabled4 = String(nodeId || '')['trim'](),
    nodeId2 = enabled4 || 'aigen-text-runtime-schema',
    value32 =
      !!enabled4 &&
      !!store &&
      typeof store['getState'] === 'function' &&
      typeof store['updateNodeData'] === 'function',
    value33 = getState?.();
  let isPlainObject2 = isPlainObject(value33) ? value33 : {};
  const run = () => {
      if (value32) {
        const value34 = store['getState']?.()?.['nodes']?.[enabled4];
        if (isPlainObject(value34)) return value34;
      }
      const value35 = getState?.();
      if (isPlainObject(value35)) return ((isPlainObject2 = value35), value35);
      return isPlainObject2;
    },
    store2 = value32
      ? store
      : {
          getState: () => ({ nodes: { [nodeId2]: run() } }),
          updateNodeData: (value36, args9 = {}) => {
            const args10 = run(),
              value37 = onChange?.(args9);
            isPlainObject2 = isPlainObject(value37) ? value37 : { ...args10, ...args9 };
          },
        };
  let modelId3 = String(modelId || run()?.['model'] || '')['trim'](),
    catalog2 = {},
    bindModelUiSchemaControls2 = () => {},
    value38 = ![],
    value39 = 0,
    enabled5 = ![],
    enabled6 = ![],
    value40 = '';
  const run2 = () => {
      if (value38) return;
      const captureOpenRuntimeParameterMenu2 = captureOpenRuntimeParameterMenu(el17);
      bindModelUiSchemaControls2?.();
      const nodeData2 = run(),
        catalogStatus2 = enabled5 ? 'loading' : enabled6 ? 'error' : '',
        list8 = buildAIGenTextRuntimeParameterFields(modelId3, nodeData2, catalog2, {
          catalogStatus: catalogStatus2,
        }),
        enabled7 = list8['length'] > 0;
      ((el17['hidden'] = !enabled7),
        (el17['innerHTML'] = enabled7
          ? renderAIGenTextRuntimeParameterMarkup(modelId3, nodeData2, catalog2, {
              catalogStatus: catalogStatus2,
            })
          : ''),
        (value40 = String(nodeData2?.['generationParams']?.['cliModel'] || AUTO_VALUE)['trim']()));
      if (!enabled7) {
        bindModelUiSchemaControls2 = () => {};
        return;
      }
      ((bindModelUiSchemaControls2 = bindModelUiSchemaControls(el17, {
        nodeId: nodeId2,
        nodeData: nodeData2,
        store: store2,
        buildPatch: (nodeData3, fieldId2, value41) =>
          buildAIGenTextRuntimeParameterPatch({
            modelId: modelId3,
            nodeData: nodeData3,
            fieldId: fieldId2,
            value: value41,
            catalog: catalog2,
          }),
        afterCommit: (value42) => {
          if (value42 === 'cliModel') {
            const run3 = globalThis['queueMicrotask'] || ((value43) => Promise['resolve']()['then'](value43));
            run3(run2);
          }
        },
      })),
        restoreRuntimeParameterMenu(el17, captureOpenRuntimeParameterMenu2));
    },
    handler = async ({ force: force = ![] } = {}) => {
      const value44 = ++value39;
      ((enabled5 = !![]), (enabled6 = ![]), (catalog2 = {}), run2());
      const runtimeParameterContract2 = getRuntimeParameterContract(modelId3);
      if (!runtimeParameterContract2?.['cliProvider']) {
        enabled5 = ![];
        return;
      }
      try {
        const fetchCliProviderModels2 = await fetchCliProviderModels(
          runtimeParameterContract2['cliProvider'],
          { force: force },
        );
        if (value38 || value44 !== value39) return;
        catalog2 = isPlainObject(fetchCliProviderModels2) ? fetchCliProviderModels2 : {};
      } catch {
        if (value38 || value44 !== value39) return;
        ((catalog2 = {}), (enabled6 = !![]));
      }
      ((enabled5 = ![]), run2());
    },
    value45 = () => {
      const runtimeParameterContract3 = getRuntimeParameterContract(modelId3);
      if (!runtimeParameterContract3?.['cliProvider']) return;
      const cachedCliProviderStatus = getCachedCliProviderStatus(runtimeParameterContract3['cliProvider']),
        enabled8 =
          cachedCliProviderStatus?.['loggedIn'] === !![] ||
          cachedCliProviderStatus?.['authConfigured'] === !![];
      if (!enabled8) return;
      !enabled5 && normalizeCatalogModels(catalog2)['length'] === 0 && void handler({ force: !![] });
    };
  return (
    windowObject?.['addEventListener']?.(CLI_PROVIDER_STATUS_CHANGED_EVENT, value45),
    void handler(),
    {
      setModel(value46) {
        const value47 = String(value46 || '')['trim']();
        if (value47 === modelId3) {
          this['sync'](run());
          return;
        }
        ((modelId3 = value47), void handler());
      },
      sync(value48 = run()) {
        if (value38) return;
        const value49 = String(value48?.['model'] || modelId3)['trim']();
        if (value49 !== modelId3) {
          ((modelId3 = value49), void handler());
          return;
        }
        const value50 = String(value48?.['generationParams']?.['cliModel'] || AUTO_VALUE)['trim']();
        if (value50 !== value40) {
          run2();
          return;
        }
        syncModelUiSchemaControls(el17, value48);
      },
      destroy() {
        ((value38 = !![]),
          (value39 += 1),
          bindModelUiSchemaControls2?.(),
          windowObject?.['removeEventListener']?.(CLI_PROVIDER_STATUS_CHANGED_EVENT, value45),
          el17['replaceChildren']?.());
      },
    }
  );
}
