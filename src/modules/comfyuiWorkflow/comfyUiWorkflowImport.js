import { buildManifestDraftBundle } from '../../manifests/index.js';
import { getParameterFooterFields } from '../../domain/customAiApp/parameterLayout.js';
export const COMFYUI_WORKFLOW_DISPLAY_NAME = 'ComfyUI\x20工作流';
const MEDIA_COMPONENT_KINDS = new Set(['image', 'video', 'audio']),
  COMPONENT_KINDS = new Set(['image', 'video', 'audio', 'prompt', 'param']),
  CONTROL_TYPES = new Set(['text', 'textarea', 'stepper', 'float', 'toggle', 'prompt']),
  OUTPUT_KINDS = new Set(['image', 'video', 'audio']),
  BASE_URL_MODES = new Set(['local', 'cloud']),
  COMPONENT_SELECTION_MODES = new Set(['auto', 'manual']),
  SCALAR_INPUT_TYPES = new Set(['string', 'number', 'boolean']),
  TEXT_CONTROL_OPTIONS = Object['freeze'](['text', 'textarea', 'prompt']),
  AMBIGUOUS_ZERO_CONTROL_OPTIONS = Object['freeze'](['text', 'stepper', 'float']),
  TEXT_COMPONENT_KIND_OPTIONS = Object['freeze'](['param', 'prompt']);
export const COMFYUI_GENERATION_COUNT_FIELD_ID = 'batchSize';
export const COMFYUI_GENERATION_COUNT_OPTIONS = Object['freeze']([0x1, 0x2, 0x4, 0x6, 0x8, 0xa, 0xc]);
const COMFYUI_GENERATION_COUNT_FIELD = Object['freeze']({
  id: COMFYUI_GENERATION_COUNT_FIELD_ID,
  type: 'segmented',
  placement: 'batch',
  label: '生成数量',
  defaultValue: 0x1,
  options: Object['freeze'](
    COMFYUI_GENERATION_COUNT_OPTIONS['map']((_0x5e45df) =>
      Object['freeze']({ value: _0x5e45df, label: _0x5e45df + 'x', selectedLabel: _0x5e45df + 'x' }),
    ),
  ),
  comfyUiSystemField: !![],
});
function normalizeText(_0x4c2143, _0x1ed8d8 = '') {
  const _0x35f27f = String(_0x4c2143 ?? '')['trim']();
  return _0x35f27f || _0x1ed8d8;
}
function normalizeOutputKind(_0x58b725) {
  const _0x1094ed = String(_0x58b725 || '')
    ['trim']()
    ['toLowerCase']();
  return OUTPUT_KINDS['has'](_0x1094ed) ? _0x1094ed : 'image';
}
function normalizeBaseUrlMode(_0x2371b6) {
  const _0x4274ff = String(_0x2371b6 || '')
    ['trim']()
    ['toLowerCase']();
  return BASE_URL_MODES['has'](_0x4274ff) ? _0x4274ff : 'local';
}
function normalizeComponentSelectionMode(_0x44c166) {
  const _0x48b6c1 = String(_0x44c166 || '')
    ['trim']()
    ['toLowerCase']();
  return COMPONENT_SELECTION_MODES['has'](_0x48b6c1) ? _0x48b6c1 : 'auto';
}
function sanitizeIdentifierPart(_0x3b4b94, _0x1c2473 = 'field') {
  const _0x365d4d = String(_0x3b4b94 || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/[^a-z0-9_-]+/g, '_')
    ['replace'](/^_+|_+$/g, '');
  return _0x365d4d || _0x1c2473;
}
function createStableHash(_0x1aa53e) {
  const _0x3c90d5 = String(_0x1aa53e || '');
  let _0x1f0e81 = 0x811c9dc5;
  for (let _0x4c8fe7 = 0x0; _0x4c8fe7 < _0x3c90d5['length']; _0x4c8fe7 += 0x1) {
    ((_0x1f0e81 ^= _0x3c90d5['charCodeAt'](_0x4c8fe7)), (_0x1f0e81 = Math['imul'](_0x1f0e81, 0x1000193)));
  }
  return (_0x1f0e81 >>> 0x0)['toString'](0x24)['padStart'](0x7, '0')['slice'](0x0, 0x8);
}
function extractFirstJsonObject(_0x56d2f0) {
  const _0x29b6b8 = String(_0x56d2f0 || ''),
    _0x227d18 = _0x29b6b8['indexOf']('{');
  if (_0x227d18 < 0x0) return '';
  let _0x4509d8 = 0x0,
    _0x5ce28d = ![],
    _0x312c3b = '',
    _0xc5df19 = ![];
  for (let _0x599c5a = _0x227d18; _0x599c5a < _0x29b6b8['length']; _0x599c5a += 0x1) {
    const _0x1c73cb = _0x29b6b8[_0x599c5a];
    if (_0x5ce28d) {
      if (_0xc5df19) {
        _0xc5df19 = ![];
        continue;
      }
      if (_0x1c73cb === '\x5c') {
        _0xc5df19 = !![];
        continue;
      }
      _0x1c73cb === _0x312c3b && ((_0x5ce28d = ![]), (_0x312c3b = ''));
      continue;
    }
    if (_0x1c73cb === '\x22' || _0x1c73cb === '\x27') {
      ((_0x5ce28d = !![]), (_0x312c3b = _0x1c73cb));
      continue;
    }
    if (_0x1c73cb === '{') _0x4509d8 += 0x1;
    if (_0x1c73cb === '}') {
      _0x4509d8 -= 0x1;
      if (_0x4509d8 === 0x0) return _0x29b6b8['slice'](_0x227d18, _0x599c5a + 0x1);
    }
  }
  return '';
}
function parseJsonPayload(_0x3cb3e6) {
  try {
    return JSON['parse'](_0x3cb3e6);
  } catch (_0x40b0e2) {
    throw new Error('ComfyUI 工作流 JSON 解析失败：' + (_0x40b0e2?.['message'] || '格式错误'));
  }
}
function isComfyUiApiNode(_0x50856d) {
  return Boolean(
    _0x50856d &&
    typeof _0x50856d === 'object' &&
    !Array['isArray'](_0x50856d) &&
    _0x50856d['inputs'] &&
    typeof _0x50856d['inputs'] === 'object' &&
    !Array['isArray'](_0x50856d['inputs']),
  );
}
function normalizeComfyUiWorkflowGraph(_0x3a335b) {
  const _0xcdf978 =
    _0x3a335b?.['prompt'] && typeof _0x3a335b['prompt'] === 'object' && !Array['isArray'](_0x3a335b['prompt'])
      ? _0x3a335b['prompt']
      : _0x3a335b?.['workflow'] &&
          typeof _0x3a335b['workflow'] === 'object' &&
          !Array['isArray'](_0x3a335b['workflow'])
        ? _0x3a335b['workflow']
        : _0x3a335b;
  if (!_0xcdf978 || typeof _0xcdf978 !== 'object' || Array['isArray'](_0xcdf978))
    throw new Error('ComfyUI 工作流 API JSON 必须是节点对象');
  const _0x3f952f = Object['entries'](_0xcdf978)['filter'](([, _0x51671f]) => isComfyUiApiNode(_0x51671f));
  if (_0x3f952f['length'] === 0x0)
    throw new Error('未找到 ComfyUI API 格式节点，请导出 API format workflow JSON');
  return _0x3f952f['reduce']((_0x68d7d9, [_0x4b69f6, _0xdfb201]) => {
    return (
      (_0x68d7d9[String(_0x4b69f6)] = { ..._0xdfb201, inputs: { ...(_0xdfb201['inputs'] || {}) } }),
      _0x68d7d9
    );
  }, {});
}
export function parseComfyUiWorkflowApiInput(_0x44cc46) {
  const _0xa23b69 = String(_0x44cc46 || '')['trim']();
  if (!_0xa23b69) throw new Error('请粘贴 ComfyUI API workflow JSON');
  const _0x4c6c12 = _0xa23b69['startsWith']('{') ? _0xa23b69 : extractFirstJsonObject(_0xa23b69);
  if (!_0x4c6c12) throw new Error('未找到 ComfyUI workflow JSON');
  const _0x4c5ca5 = parseJsonPayload(_0x4c6c12),
    _0x10fc2d = normalizeComfyUiWorkflowGraph(_0x4c5ca5);
  return { body: _0x4c5ca5, workflow: _0x10fc2d, sourceText: _0xa23b69 };
}
function isConnectionValue(_0x13a20e) {
  return (
    Array['isArray'](_0x13a20e) &&
    _0x13a20e['length'] >= 0x2 &&
    (typeof _0x13a20e[0x0] === 'string' || typeof _0x13a20e[0x0] === 'number') &&
    typeof _0x13a20e[0x1] === 'number'
  );
}
function isScalarValue(_0x4f9fbb) {
  return SCALAR_INPUT_TYPES['has'](typeof _0x4f9fbb) || _0x4f9fbb === null;
}
function isComfyUiMediaUiInputName(_0x328daf) {
  const _0x41ccbf = String(_0x328daf || '')
    ['trim']()
    ['toLowerCase']();
  return _0x41ccbf === 'imageui' || _0x41ccbf === 'videoui' || _0x41ccbf === 'audioui';
}
function sortNodeEntries(_0x4585f3) {
  return Object['entries'](_0x4585f3)['sort'](([_0x2b0ef6], [_0x4bb35a]) => {
    const _0x3abf83 = Number(_0x2b0ef6),
      _0x1dae54 = Number(_0x4bb35a);
    if (Number['isFinite'](_0x3abf83) && Number['isFinite'](_0x1dae54) && _0x3abf83 !== _0x1dae54)
      return _0x3abf83 - _0x1dae54;
    return String(_0x2b0ef6)['localeCompare'](String(_0x4bb35a));
  });
}
function isMediaInput(_0x2d85f1, _0x26637b) {
  const _0xb4d48c = String(_0x2d85f1 || '')['toLowerCase'](),
    _0x2deb92 = String(_0x26637b || '')['toLowerCase']();
  if (isComfyUiMediaUiInputName(_0x2deb92)) return '';
  if (_0xb4d48c['includes']('loadimage') && _0x2deb92 === 'image') return 'image';
  if (
    (_0xb4d48c['includes']('loadvideo') || _0xb4d48c['includes']('videoload')) &&
    _0x2deb92['includes']('video')
  )
    return 'video';
  if (
    (_0xb4d48c['includes']('loadaudio') || _0xb4d48c['includes']('audioload')) &&
    _0x2deb92['includes']('audio')
  )
    return 'audio';
  if (_0x2deb92 === 'image' || _0x2deb92['endsWith']('_image')) return 'image';
  if (_0x2deb92 === 'video' || _0x2deb92['endsWith']('_video')) return 'video';
  if (_0x2deb92 === 'audio' || _0x2deb92['endsWith']('_audio')) return 'audio';
  return '';
}
function isPromptInput(_0x4b892a, _0x347206, _0x4fdf4c) {
  const _0x532b8d = String(_0x4b892a || '')['toLowerCase'](),
    _0x3b189a = String(_0x347206 || '')['toLowerCase']();
  if (typeof _0x4fdf4c !== 'string') return ![];
  if (_0x532b8d['includes']('cliptextencode') && _0x3b189a === 'text') return !![];
  return (
    /prompt|positive|negative|text|caption|description/['test'](_0x3b189a) &&
    looksLikeStructuredText(_0x4fdf4c)
  );
}
function containsCjkText(_0x229e2c) {
  return /[\u3400-\u9fff]/u['test'](String(_0x229e2c ?? ''));
}
function looksLikeLongEnglishText(_0x19834c) {
  const _0xb1aad1 = String(_0x19834c ?? '')['trim'](),
    _0xe85bfe = _0xb1aad1['match'](/[A-Za-z][A-Za-z'-]*/g) || [],
    _0x251e42 = (_0xb1aad1['match'](/[A-Za-z]/g) || [])['length'];
  return _0xe85bfe['length'] >= 0x4 || _0x251e42 >= 0x1c;
}
function looksLikeStructuredText(_0x301d66) {
  const _0x2b4a70 = String(_0x301d66 ?? '')['trim']();
  if (!_0x2b4a70) return !![];
  return (
    containsCjkText(_0x2b4a70) ||
    looksLikeLongEnglishText(_0x2b4a70) ||
    _0x2b4a70['length'] > 0x2a ||
    /[\s,.;:!?，。；：！？、]/['test'](_0x2b4a70)
  );
}
function isBooleanLiteral(_0x2957ab) {
  const _0x1df18e = String(_0x2957ab ?? '')
    ['trim']()
    ['toLowerCase']();
  return _0x1df18e === 'true' || _0x1df18e === 'false';
}
function isIntegerLiteral(_0x472da1) {
  return /^[+-]?\d+$/['test'](String(_0x472da1 ?? '')['trim']());
}
function isDecimalLiteral(_0x4326ce) {
  return /^[+-]?(?:\d+\.\d+|\.\d+)$/['test'](String(_0x4326ce ?? '')['trim']());
}
function isAmbiguousZeroLiteral(_0x1b0833) {
  return /^[+-]?0+$/['test'](String(_0x1b0833 ?? '')['trim']());
}
function inferTextControlType(_0x420567, _0x38fe4e) {
  const _0x14638c = String(_0x38fe4e || '')['toLowerCase']();
  if (/prompt|positive|negative|text|caption|description/['test'](_0x14638c)) return 'textarea';
  return looksLikeStructuredText(_0x420567) ? 'textarea' : 'text';
}
function inferComponentConfig({ classType: _0x2109cc, inputName: _0x53d1f5, value: _0x46a206 }) {
  const _0xfa55d0 = isMediaInput(_0x2109cc, _0x53d1f5);
  if (_0xfa55d0)
    return {
      componentKind: _0xfa55d0,
      componentKindLocked: !![],
      componentKindOptions: [_0xfa55d0],
      controlType: 'text',
      controlTypeLocked: !![],
      controlTypeOptions: [],
    };
  if (isPromptInput(_0x2109cc, _0x53d1f5, _0x46a206))
    return {
      componentKind: 'prompt',
      componentKindLocked: ![],
      componentKindOptions: TEXT_COMPONENT_KIND_OPTIONS['slice'](),
      controlType: 'prompt',
      controlTypeLocked: ![],
      controlTypeOptions: TEXT_CONTROL_OPTIONS['slice'](),
    };
  if (typeof _0x46a206 === 'boolean' || isBooleanLiteral(_0x46a206))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'toggle',
      controlTypeLocked: !![],
      controlTypeOptions: ['toggle'],
    };
  if (typeof _0x46a206 === 'number' && Number['isInteger'](_0x46a206))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: _0x46a206 !== 0x0,
      controlTypeOptions: _0x46a206 === 0x0 ? AMBIGUOUS_ZERO_CONTROL_OPTIONS['slice']() : ['stepper'],
    };
  if (typeof _0x46a206 === 'number' || isDecimalLiteral(_0x46a206))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'float',
      controlTypeLocked: !![],
      controlTypeOptions: ['float'],
    };
  if (isIntegerLiteral(_0x46a206))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: !isAmbiguousZeroLiteral(_0x46a206),
      controlTypeOptions: isAmbiguousZeroLiteral(_0x46a206)
        ? AMBIGUOUS_ZERO_CONTROL_OPTIONS['slice']()
        : ['stepper'],
    };
  return {
    componentKind: 'param',
    componentKindLocked: ![],
    componentKindOptions: TEXT_COMPONENT_KIND_OPTIONS['slice'](),
    controlType: inferTextControlType(_0x46a206, _0x53d1f5),
    controlTypeLocked: ![],
    controlTypeOptions: TEXT_CONTROL_OPTIONS['slice'](),
  };
}
export function formatComfyUiComponentLabel(_0x83a9b8 = {}) {
  const _0x474359 = normalizeText(_0x83a9b8?.['inputName'], 'value'),
    _0x9fa5d =
      normalizeText(_0x83a9b8?.['nodeTitle']) ||
      normalizeText(_0x83a9b8?.['classType']) ||
      normalizeText(_0x83a9b8?.['nodeId']);
  return _0x9fa5d ? (_0x83a9b8['inputCount'] === 0x1 ? _0x9fa5d : _0x9fa5d + '.' + _0x474359) : _0x474359;
}
function createComponentLabel({
  nodeId: _0x501ca8,
  nodeTitle: _0x5636ef,
  classType: _0x10c205,
  inputName: _0x3b1994,
  inputCount: _0x4e3a15,
} = {}) {
  return formatComfyUiComponentLabel({
    nodeId: _0x501ca8,
    nodeTitle: _0x5636ef,
    classType: _0x10c205,
    inputName: _0x3b1994,
    inputCount: _0x4e3a15,
  });
}
function createComponentKey(_0x2a6c64, _0x410492, _0x2d38c2) {
  return [_0x2a6c64, _0x410492, _0x2d38c2]
    ['map']((_0x3c2cfa) => normalizeText(_0x3c2cfa)['toLowerCase']())
    ['join']('::');
}
function getComfyUiNodeTitle(_0x180c77 = {}) {
  return normalizeText(
    _0x180c77?.['_meta']?.['title'] ||
      _0x180c77?.['_meta']?.['name'] ||
      _0x180c77?.['title'] ||
      _0x180c77?.['name'] ||
      _0x180c77?.['label'],
  );
}
function createComponentId(_0x386407, _0x216554) {
  const _0x266a72 = sanitizeIdentifierPart(_0x386407?.['nodeId'], 'node_' + _0x216554),
    _0x3c7995 = sanitizeIdentifierPart(_0x386407?.['inputName'], 'value');
  return 'comfyui_' + _0x266a72 + '_' + _0x3c7995 + '_' + _0x216554;
}
function createSlotId(_0x209a80, _0x522a4f, _0xfcb624) {
  const _0x54d1c8 = sanitizeIdentifierPart(_0x522a4f?.['nodeId'], 'node_' + _0xfcb624),
    _0x12bf82 = sanitizeIdentifierPart(_0x522a4f?.['inputName'], _0x209a80);
  return 'comfyui_' + _0x209a80 + '_' + _0x54d1c8 + '_' + _0x12bf82 + '_' + _0xfcb624;
}
function normalizeComponentKind(_0x4e7cb8, _0x252361 = 'param') {
  const _0x4682f0 = String(_0x4e7cb8 || '')
    ['trim']()
    ['toLowerCase']();
  return COMPONENT_KINDS['has'](_0x4682f0) ? _0x4682f0 : _0x252361;
}
function normalizeControlType(_0x2c2623, _0x4496ab = 'text') {
  const _0x5c76d5 = String(_0x2c2623 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x5c76d5 === 'integer' || _0x5c76d5 === 'number') return 'stepper';
  if (_0x5c76d5 === 'decimal') return 'float';
  if (_0x5c76d5 === 'boolean' || _0x5c76d5 === 'bool') return 'toggle';
  return CONTROL_TYPES['has'](_0x5c76d5) ? _0x5c76d5 : _0x4496ab;
}
function normalizeBooleanDefault(_0x329a0a) {
  const _0x2f7960 = String(_0x329a0a ?? '')
    ['trim']()
    ['toLowerCase']();
  return (
    _0x329a0a === !![] ||
    _0x2f7960 === 'true' ||
    _0x2f7960 === '1' ||
    _0x2f7960 === 'yes' ||
    _0x2f7960 === 'on'
  );
}
function normalizeIntegerDefault(_0x1e3944) {
  const _0xf761a1 = Number(_0x1e3944);
  return Number['isFinite'](_0xf761a1) ? Math['trunc'](_0xf761a1) : 0x0;
}
function normalizeFloatDefault(_0x1c51dd) {
  const _0x28182d = Number(_0x1c51dd);
  return Number['isFinite'](_0x28182d) ? _0x28182d : 0x0;
}
function normalizeDefaultValueForControl(_0x46f3e2, _0x4fc357) {
  const _0x2b7595 = normalizeControlType(_0x46f3e2);
  if (_0x2b7595 === 'toggle') return normalizeBooleanDefault(_0x4fc357);
  if (_0x2b7595 === 'stepper') return normalizeIntegerDefault(_0x4fc357);
  if (_0x2b7595 === 'float') return normalizeFloatDefault(_0x4fc357);
  return String(_0x4fc357 ?? '');
}
function normalizeOrderValue(_0x368839, _0x10f9b5) {
  const _0x595af8 = Number(_0x368839);
  return Number['isFinite'](_0x595af8) ? _0x595af8 : _0x10f9b5;
}
function normalizePreviewPlacement(_0x5a3e9d) {
  return String(_0x5a3e9d || '')['trim']() === 'home' ? 'home' : 'advanced';
}
function getNodeTransformForControl(_0x4f3a45) {
  const _0xe59594 = normalizeControlType(_0x4f3a45);
  if (_0xe59594 === 'toggle') return 'boolean';
  if (_0xe59594 === 'stepper') return 'integer';
  if (_0xe59594 === 'float') return 'number';
  return '';
}
function getUiSchemaTypeForControl(_0x5d206b) {
  const _0x3e90f2 = normalizeControlType(_0x5d206b);
  return _0x3e90f2 === 'float' ? 'stepper' : _0x3e90f2;
}
function getFloatStep(_0x1c72a1) {
  const _0x3185ef = String(_0x1c72a1 ?? '')['trim'](),
    _0x2b7490 = _0x3185ef['match'](/\.(\d+)/),
    _0xd62a82 = _0x2b7490 ? Math['max'](0x1, _0x2b7490[0x1]['length']) : 0x2;
  return Number('0.' + '0'['repeat'](Math['max'](0x0, _0xd62a82 - 0x1)) + '1');
}
function normalizeOptionList(_0x2797e5 = [], _0x10ec51 = null) {
  if (!Array['isArray'](_0x2797e5)) return [];
  return _0x2797e5['map']((_0x4b2e9d) =>
    String(_0x4b2e9d || '')
      ['trim']()
      ['toLowerCase'](),
  )['filter']((_0x1a5ab5, _0x275e2b, _0xda7219) => {
    if (!_0x1a5ab5 || _0xda7219['indexOf'](_0x1a5ab5) !== _0x275e2b) return ![];
    return !_0x10ec51 || _0x10ec51['has'](_0x1a5ab5);
  });
}
function pickAllowedValue(_0x3abe45, _0x551927, _0x2df01f) {
  const _0x52857d = String(_0x3abe45 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x551927['includes'](_0x52857d) ? _0x52857d : _0x2df01f;
}
function normalizeComponentOverride(_0x36969c, _0x3e4960) {
  const _0x5973a2 = inferComponentConfig(_0x3e4960),
    _0x1629c5 = normalizeOptionList(_0x5973a2['componentKindOptions'], COMPONENT_KINDS),
    _0x2f76f8 = normalizeOptionList(_0x5973a2['controlTypeOptions'], CONTROL_TYPES),
    _0x87c23 = _0x5973a2['componentKind'] || 'param',
    _0x299b6c = normalizeControlType(_0x5973a2['controlType']),
    _0x2fd18c = normalizeComponentKind(_0x36969c?.['componentKind'], _0x87c23);
  let _0xde2d8a =
    _0x5973a2['componentKindLocked'] === !![]
      ? _0x87c23
      : pickAllowedValue(_0x2fd18c, _0x1629c5['length'] ? _0x1629c5 : [_0x2fd18c], _0x87c23);
  const _0x2e00a9 = normalizeControlType(_0x36969c?.['controlType'], _0x299b6c);
  let _0x3cc48e =
    _0xde2d8a === 'prompt'
      ? 'prompt'
      : _0x5973a2['controlTypeLocked'] === !![]
        ? _0x299b6c
        : pickAllowedValue(_0x2e00a9, _0x2f76f8['length'] ? _0x2f76f8 : [_0x299b6c], _0x299b6c);
  return (
    _0x3cc48e === 'prompt' &&
      !_0x5973a2['componentKindLocked'] &&
      _0x1629c5['includes']('prompt') &&
      (_0xde2d8a = 'prompt'),
    {
      label: normalizeText(_0x36969c?.['label'], _0x3e4960['label']),
      description: normalizeText(_0x36969c?.['description'], _0x3e4960['label']),
      componentKind: _0xde2d8a,
      componentKindLocked: _0x5973a2['componentKindLocked'] === !![],
      componentKindOptions: _0x1629c5['length'] ? _0x1629c5 : [_0xde2d8a],
      controlType: _0x3cc48e,
      controlTypeLocked: _0x5973a2['controlTypeLocked'] === !![],
      controlTypeOptions: _0x2f76f8,
      inputOrder: normalizeOrderValue(_0x36969c?.['inputOrder'], _0x3e4960['index']),
      homeParamOrder: normalizeOrderValue(_0x36969c?.['homeParamOrder'], _0x3e4960['index']),
      advancedParamOrder: normalizeOrderValue(_0x36969c?.['advancedParamOrder'], _0x3e4960['index']),
      previewPlacement: normalizePreviewPlacement(_0x36969c?.['previewPlacement']),
      footerGroupId: String(_0x36969c?.['footerGroupId'] || '')['trim'](),
      footerGroupLabel: String(_0x36969c?.['footerGroupLabel'] || '参数组')['trim'](),
      footerGroupDescription: String(_0x36969c?.['footerGroupDescription'] || '')['trim'](),
      required: _0x36969c?.['required'] !== ![],
      defaultValue: normalizeDefaultValueForControl(
        _0x3cc48e,
        _0x36969c?.['defaultValue'] === undefined ? _0x3e4960['value'] : _0x36969c['defaultValue'],
      ),
    }
  );
}
function buildComponentOverrideMap(_0x49c1c2 = []) {
  const _0x58f0c4 = new Map();
  if (!Array['isArray'](_0x49c1c2)) return _0x58f0c4;
  return (
    _0x49c1c2['forEach']((_0x3abe90) => {
      const _0xee7667 = Number(_0x3abe90?.['index']);
      if (!Number['isInteger'](_0xee7667) || _0xee7667 < 0x0) return;
      _0x58f0c4['set'](_0xee7667, _0x3abe90);
    }),
    _0x58f0c4
  );
}
function collectComponentDraftItems(_0x2ad246) {
  const _0x9b6537 = [];
  return (
    sortNodeEntries(_0x2ad246)['forEach'](([_0x59cba4, _0x31dfe1]) => {
      const _0x200643 = normalizeText(_0x31dfe1?.['class_type'] || _0x31dfe1?.['classType']),
        _0x7ba20 = getComfyUiNodeTitle(_0x31dfe1),
        _0x5e85e1 = Object['entries'](_0x31dfe1['inputs'] || {})['filter'](
          ([_0x34377e, _0x2b62fc]) =>
            !isComfyUiMediaUiInputName(_0x34377e) &&
            !isConnectionValue(_0x2b62fc) &&
            isScalarValue(_0x2b62fc),
        );
      _0x5e85e1['forEach'](([_0x3edac1, _0x197709]) => {
        const _0x24e955 = _0x9b6537['length'],
          _0x48a16a = {
            index: _0x24e955,
            nodeId: String(_0x59cba4),
            nodeTitle: _0x7ba20,
            classType: _0x200643,
            inputName: _0x3edac1,
            inputCount: _0x5e85e1['length'],
            value: _0x197709,
            componentKey: createComponentKey(_0x59cba4, _0x200643, _0x3edac1),
            label: createComponentLabel({
              nodeId: _0x59cba4,
              nodeTitle: _0x7ba20,
              classType: _0x200643,
              inputName: _0x3edac1,
              inputCount: _0x5e85e1['length'],
            }),
          },
          _0x39db54 = inferComponentConfig(_0x48a16a);
        _0x9b6537['push']({
          ..._0x48a16a,
          componentKind: _0x39db54['componentKind'],
          componentKindLocked: _0x39db54['componentKindLocked'] === !![],
          componentKindOptions: _0x39db54['componentKindOptions'] || ['param'],
          controlType: _0x39db54['controlType'],
          controlTypeLocked: _0x39db54['controlTypeLocked'] === !![],
          controlTypeOptions: _0x39db54['controlTypeOptions'] || [],
          defaultValue: String(_0x197709 ?? ''),
        });
      });
    }),
    _0x9b6537
  );
}
export function createComfyUiWorkflowComponentDrafts(_0x21e28d) {
  const _0x2cb494 = parseComfyUiWorkflowApiInput(_0x21e28d);
  return { parsed: _0x2cb494, components: collectComponentDraftItems(_0x2cb494['workflow']) };
}
function buildInputSlotCounts(_0x531a5b) {
  return _0x531a5b['reduce']((_0x24d5a5, _0x3fb956) => {
    const _0x2393e9 = String(_0x3fb956?.['kind'] || '')['trim']();
    if (!_0x2393e9) return _0x24d5a5;
    return ((_0x24d5a5[_0x2393e9] = (_0x24d5a5[_0x2393e9] || 0x0) + 0x1), _0x24d5a5);
  }, {});
}
export function compileComfyUiWorkflowComponents(_0x52b9a1, _0x2fdfeb, _0x4ea117 = [], _0x1ecac2 = {}) {
  const _0x56e967 = normalizeComponentSelectionMode(_0x1ecac2['componentSelectionMode']),
    _0x45cd1d =
      _0x56e967 === 'manual'
        ? new Set(
            (Array['isArray'](_0x4ea117) ? _0x4ea117 : [])
              ['map']((_0x5e85a7) => Number(_0x5e85a7?.['index']))
              ['filter']((_0xad57b6) => Number['isInteger'](_0xad57b6) && _0xad57b6 >= 0x0),
          )
        : null,
    _0x21b286 = buildComponentOverrideMap(_0x4ea117),
    _0x4d98be = collectComponentDraftItems(_0x52b9a1['workflow'])
      ['filter']((_0x39b08e) => !_0x45cd1d || _0x45cd1d['has'](Number(_0x39b08e['index'])))
      ['map']((_0x288b11) => ({
        item: _0x288b11,
        component: normalizeComponentOverride(_0x21b286['get'](_0x288b11['index']), _0x288b11),
      })),
    _0x10ec20 = getParameterFooterFields(
      _0x4d98be['map'](({ item: _0x117c29, component: _0x281800 }) => ({
        ..._0x281800,
        index: _0x117c29['index'],
      })),
    ),
    _0x4c2411 = [],
    _0x16a023 = [],
    _0x1d1cb4 = [];
  let _0x31bc5c = ![],
    _0x7f00aa = '';
  _0x4d98be['forEach'](({ item: _0x2656e9, component: _0x5322f4 }) => {
    const _0x62fead = _0x2656e9['index'],
      _0x1fd68 = _0x5322f4['label'],
      _0x3700f7 = _0x5322f4['description'] || _0x1fd68,
      _0x1341a8 = _0x5322f4['componentKind'];
    if (MEDIA_COMPONENT_KINDS['has'](_0x1341a8)) {
      const _0x5cca3d = createSlotId(_0x1341a8, _0x2656e9, _0x62fead);
      (_0x4c2411['push']({
        id: _0x5cca3d,
        kind: _0x1341a8,
        label: _0x1fd68,
        description: _0x3700f7,
        required: _0x5322f4['required'],
        displayOrder: _0x5322f4['inputOrder'],
        customAiAppComponentIndex: _0x2656e9['index'],
        comfyUiComponentIndex: _0x2656e9['index'],
      }),
        _0x1d1cb4['push']({
          nodeId: _0x2656e9['nodeId'],
          inputName: _0x2656e9['inputName'],
          source: _0x1341a8 + 'Input',
          field: _0x5cca3d,
          slot: _0x5cca3d,
          required: _0x5322f4['required'],
          missingMessage: '请接入' + _0x1fd68,
          description: _0x3700f7,
        }));
      return;
    }
    if (_0x1341a8 === 'prompt') {
      _0x31bc5c = !![];
      !_0x7f00aa && (_0x7f00aa = normalizeText(_0x21b286['get'](_0x2656e9['index'])?.['description']));
      _0x1d1cb4['push']({
        nodeId: _0x2656e9['nodeId'],
        inputName: _0x2656e9['inputName'],
        source: 'prompt',
        defaultValue: _0x5322f4['defaultValue'],
        includeEmpty: !![],
        description: _0x3700f7,
      });
      return;
    }
    const _0x2ce802 = createComponentId(_0x2656e9, _0x62fead),
      _0x543c43 = normalizeControlType(_0x5322f4['controlType']),
      _0x3a5dee = getUiSchemaTypeForControl(_0x543c43),
      _0x5c6054 = normalizeDefaultValueForControl(_0x543c43, _0x5322f4['defaultValue']),
      _0x40430e = getNodeTransformForControl(_0x543c43);
    (_0x16a023['push']({
      id: _0x2ce802,
      type: _0x3a5dee,
      placement: _0x10ec20['has'](_0x2656e9['index']) ? 'mode' : 'advanced',
      ...(_0x10ec20['has'](_0x2656e9['index'])
        ? { ..._0x10ec20['get'](_0x2656e9['index']) }
        : { displayOrder: _0x5322f4['advancedParamOrder'] }),
      label: _0x1fd68,
      defaultValue: _0x5c6054,
      description: _0x3700f7,
      customAiAppComponentIndex: _0x2656e9['index'],
      comfyUiComponentIndex: _0x2656e9['index'],
      ...(_0x3a5dee === 'stepper'
        ? {
            step: _0x543c43 === 'float' ? getFloatStep(_0x5c6054) : 0x1,
            ...(_0x543c43 === 'float' ? { valueType: 'float' } : {}),
          }
        : {}),
    }),
      _0x1d1cb4['push']({
        nodeId: _0x2656e9['nodeId'],
        inputName: _0x2656e9['inputName'],
        source: 'param',
        field: _0x2ce802,
        defaultValue: _0x5c6054,
        ...(_0x40430e ? { transform: _0x40430e } : {}),
        description: _0x3700f7,
      }));
  });
  const _0x2a1065 = buildInputSlotCounts(_0x4c2411),
    _0x260b25 = Array['from'](
      new Set([...(_0x31bc5c ? ['text'] : []), ..._0x4c2411['map']((_0x42fe90) => _0x42fe90['kind'])]),
    ),
    _0x8eafef = _0x4c2411['map']((_0x391f5d, _0x55e5ad) => ({ ..._0x391f5d, _sourceOrder: _0x55e5ad }))
      ['sort']((_0xed1cc, _0x256785) => {
        const _0x1def14 =
          normalizeOrderValue(_0xed1cc['displayOrder'], _0xed1cc['_sourceOrder']) -
          normalizeOrderValue(_0x256785['displayOrder'], _0x256785['_sourceOrder']);
        if (_0x1def14 !== 0x0) return _0x1def14;
        return _0xed1cc['_sourceOrder'] - _0x256785['_sourceOrder'];
      })
      ['map'](({ _sourceOrder: _0x34e3bf, ..._0x66f713 }, _0x42aa04) => ({
        ..._0x66f713,
        displayOrder: _0x42aa04,
      })),
    _0x1a25c2 = _0x16a023['sort']((_0x195d75, _0x582688) => {
      const _0x3de4d1 = String(_0x195d75?.['placement'] || '')['localeCompare'](
        String(_0x582688?.['placement'] || ''),
      );
      if (_0x3de4d1 !== 0x0) return _0x3de4d1;
      return (
        normalizeOrderValue(_0x195d75?.['displayOrder'], Number['MAX_SAFE_INTEGER']) -
        normalizeOrderValue(_0x582688?.['displayOrder'], Number['MAX_SAFE_INTEGER'])
      );
    }),
    _0x513a8b = normalizeText(_0x1ecac2['promptHelpTooltip']);
  return {
    fixedSlots: _0x8eafef,
    uiFields: _0x1a25c2,
    inputSlots: {
      allowedKinds: _0x260b25['slice'](),
      minByKind: { ..._0x2a1065 },
      maxByKind: { ..._0x2a1065 },
      fixedSlots: _0x8eafef,
    },
    capabilities: {
      inputKinds: _0x260b25['slice'](),
      outputType: _0x2fdfeb,
      fixedAssetSlots: _0x8eafef['map']((_0x2ba05e) => _0x2ba05e['id']),
    },
    mapping: { workflow: _0x52b9a1['workflow'], inputs: _0x1d1cb4 },
    help: _0x513a8b || _0x7f00aa ? { tooltip: _0x513a8b || _0x7f00aa } : null,
    prompt: { emptyPolicy: 'allow' },
  };
}
function classTypeLooksLikeOutput(_0x2ce973, _0x22c26e) {
  const _0x5d0881 = String(_0x22c26e || '')['toLowerCase']();
  if (_0x2ce973 === 'video')
    return (
      _0x5d0881['includes']('video') ||
      _0x5d0881['includes']('vhs') ||
      _0x5d0881['includes']('webp') ||
      _0x5d0881['includes']('gif')
    );
  if (_0x2ce973 === 'audio') return _0x5d0881['includes']('audio') || _0x5d0881['includes']('sound');
  return (
    _0x5d0881['includes']('saveimage') ||
    _0x5d0881['includes']('previewimage') ||
    _0x5d0881['includes']('image')
  );
}
function inferOutputNodes(_0x1919b3, _0x25dbb2) {
  return sortNodeEntries(_0x1919b3)
    ['filter'](([, _0x46c387]) =>
      classTypeLooksLikeOutput(_0x25dbb2, _0x46c387?.['class_type'] || _0x46c387?.['classType']),
    )
    ['map'](([_0x1c91aa]) => String(_0x1c91aa));
}
function buildResultConfig(_0x5f2f3c, _0x3a8303) {
  const _0x1caddf = inferOutputNodes(_0x5f2f3c, _0x3a8303);
  if (_0x3a8303 === 'video')
    return {
      outputType: 'video',
      taskIdPath: 'prompt_id',
      resultPaths: ['videos[].url', 'video_urls[]', 'results[].videoUrl', 'results[].url'],
      ...(_0x1caddf['length'] ? { outputNodes: _0x1caddf } : {}),
    };
  if (_0x3a8303 === 'audio')
    return {
      outputType: 'audio',
      taskIdPath: 'prompt_id',
      resultPaths: ['audios[].url', 'audio_urls[]', 'results[].audioUrl', 'results[].url'],
      ...(_0x1caddf['length'] ? { outputNodes: _0x1caddf } : {}),
    };
  return {
    outputType: 'image',
    taskIdPath: 'prompt_id',
    resultPaths: ['images[].url', 'image_urls[]', 'results[].imageUrl', 'results[].url'],
    ...(_0x1caddf['length'] ? { outputNodes: _0x1caddf } : {}),
  };
}
function buildComfyUiSystemUiFields(_0x4d2b68) {
  if (_0x4d2b68 !== 'image') return [];
  return [COMFYUI_GENERATION_COUNT_FIELD];
}
function isComfyUiSystemUiField(_0x3b65ba) {
  return _0x3b65ba?.['comfyUiSystemField'] === !![];
}
function getComfyUiWorkflowImageMenuGroup(_0xebdc2a) {
  return _0xebdc2a === 'cloud' ? 'comfyUiCloudWorkflow' : 'comfyUiLocalWorkflow';
}
function getComfyUiWorkflowImageMenuIconKind(_0x134d79) {
  return _0x134d79 === 'cloud' ? 'comfyUiCloudWorkflowBadge' : 'comfyUiLocalWorkflowBadge';
}
function getComfyUiWorkflowImageMenuSubtitle(_0x3f438c, _0x58c2cb = '') {
  const _0x4c8155 = normalizeText(_0x58c2cb);
  if (_0x4c8155 && _0x4c8155 !== 'ComfyUI cloud workflow' && _0x4c8155 !== 'ComfyUI local workflow')
    return _0x4c8155;
  return _0x3f438c === 'cloud' ? 'ComfyUI 云端工作流' : 'ComfyUI 本地工作流';
}
function buildModelExtensions(
  _0x460ac9,
  _0x36b87e,
  _0x1136da,
  _0x5c4be9 = '',
  _0x27b273 = '',
  _0x2a4142 = {},
) {
  const _0xb620b6 = normalizeText(_0x5c4be9),
    _0x144893 = Boolean(_0xb620b6),
    _0x198414 = normalizeBaseUrlMode(_0x2a4142['baseUrlMode']),
    _0x2dda52 = normalizeComponentSelectionMode(_0x2a4142['componentSelectionMode']),
    _0x23cf04 = {
      comfyUiWorkflow: {
        workflowId: _0x36b87e,
        kind: _0x460ac9,
        appKey: _0xb620b6,
        name: _0x1136da,
        description: normalizeText(_0x27b273),
        baseUrlMode: _0x198414,
        componentSelectionMode: _0x2dda52,
        isSavedApp: _0x144893,
      },
    };
  return (
    _0x144893 &&
      _0x460ac9 === 'image' &&
      (_0x23cf04['imageMenu'] = {
        group: getComfyUiWorkflowImageMenuGroup(_0x198414),
        order: 0x3e7,
        title: _0x1136da,
        subtitle: getComfyUiWorkflowImageMenuSubtitle(_0x198414, _0x27b273),
        iconKind: getComfyUiWorkflowImageMenuIconKind(_0x198414),
      }),
    _0x144893 &&
      _0x460ac9 === 'video' &&
      (_0x23cf04['videoMenu'] = {
        role: 'comfyUiWorkflow',
        group: getComfyUiWorkflowImageMenuGroup(_0x198414),
        order: 0x3e7,
        label: _0x1136da,
        subtitle: getComfyUiWorkflowImageMenuSubtitle(_0x198414, _0x27b273),
        iconKind: getComfyUiWorkflowImageMenuIconKind(_0x198414),
      }),
    _0x144893 &&
      _0x460ac9 === 'audio' &&
      (_0x23cf04['audioMenu'] = {
        group: getComfyUiWorkflowImageMenuGroup(_0x198414),
        order: 0x3e7,
        label: _0x1136da,
        subtitle: getComfyUiWorkflowImageMenuSubtitle(_0x198414, _0x27b273),
        iconKind: getComfyUiWorkflowImageMenuIconKind(_0x198414),
      }),
    _0x23cf04
  );
}
export function buildComfyUiWorkflowManifestBundle({
  input: _0x4be3c3,
  kind: kind = 'image',
  components: components = [],
  displayName: displayName = COMFYUI_WORKFLOW_DISPLAY_NAME,
  description: description = '',
  appKey: appKey = '',
  baseUrlMode: baseUrlMode = 'local',
  componentSelectionMode: componentSelectionMode = 'auto',
  promptHelpTooltip: promptHelpTooltip = '',
} = {}) {
  const _0x245cda = parseComfyUiWorkflowApiInput(_0x4be3c3),
    _0x134d81 = normalizeOutputKind(kind),
    _0xe09155 = normalizeBaseUrlMode(baseUrlMode),
    _0x31f727 = normalizeComponentSelectionMode(componentSelectionMode),
    _0x29b399 = normalizeText(displayName, COMFYUI_WORKFLOW_DISPLAY_NAME),
    _0x1f5cfd =
      normalizeText(description) ||
      (_0xe09155 === 'cloud' ? 'ComfyUI cloud workflow' : 'ComfyUI local workflow'),
    _0x42d819 = normalizeText(promptHelpTooltip),
    _0x344f4c = createStableHash(
      JSON['stringify']({
        kind: _0x134d81,
        appKey: normalizeText(appKey),
        description: _0x1f5cfd,
        promptHelpTooltip: _0x42d819,
        baseUrlMode: _0xe09155,
        componentSelectionMode: _0x31f727,
        workflow: _0x245cda['workflow'],
        components: components,
      }),
    ),
    _0x301104 = 'comfyui-' + _0x134d81 + '-' + _0x344f4c,
    _0x2a04ea = 'comfyui/workflow-' + _0x134d81 + '-' + _0x344f4c,
    _0xc93c41 = 'comfyui.workflow.' + _0x134d81 + '.' + _0x344f4c + '.v1',
    _0x8a7144 = compileComfyUiWorkflowComponents(_0x245cda, _0x134d81, components, {
      componentSelectionMode: _0x31f727,
      promptHelpTooltip: _0x42d819,
    }),
    _0x1513c5 = [...buildComfyUiSystemUiFields(_0x134d81), ..._0x8a7144['uiFields']];
  return buildManifestDraftBundle({
    sourceId: 'comfyui-workflow:' + _0x134d81 + ':' + _0x344f4c,
    modelId: _0x2a04ea,
    executionId: _0xc93c41,
    provider: 'comfyui',
    adapterType: 'workflow',
    kind: _0x134d81,
    outputType: _0x134d81,
    displayName: _0x29b399,
    description: _0x1f5cfd,
    workflowId: _0x301104,
    submitMode: 'comfyui-prompt',
    queryMode: 'comfyui-history',
    mapping: _0x8a7144['mapping'],
    uiFields: _0x1513c5,
    inputSlots: _0x8a7144['inputSlots'],
    help: _0x8a7144['help'],
    prompt: _0x8a7144['prompt'],
    capabilities: _0x8a7144['capabilities'],
    modelExtensions: buildModelExtensions(_0x134d81, _0x301104, _0x29b399, appKey, _0x1f5cfd, {
      baseUrlMode: _0xe09155,
      componentSelectionMode: _0x31f727,
    }),
    executionExtensions: { comfyui: { baseUrlMode: _0xe09155, componentSelectionMode: _0x31f727 } },
    result: buildResultConfig(_0x245cda['workflow'], _0x134d81),
  });
}
export function summarizeComfyUiWorkflowBundle(_0x4d8442) {
  const _0x479864 = _0x4d8442?.['models']?.[0x0] || {},
    _0x344677 = _0x4d8442?.['executions']?.[0x0] || {},
    _0x1fca8a = Array['isArray'](_0x479864?.['inputSlots']?.['fixedSlots'])
      ? _0x479864['inputSlots']['fixedSlots']
      : [],
    _0x462350 = Array['isArray'](_0x479864?.['uiSchema']?.['fields']) ? _0x479864['uiSchema']['fields'] : [],
    _0x3b86eb = _0x462350['filter']((_0x482e78) => !isComfyUiSystemUiField(_0x482e78)),
    _0x5a17ec = Array['isArray'](_0x344677?.['mapping']?.['inputs']) ? _0x344677['mapping']['inputs'] : [];
  return {
    workflowId: _0x344677['workflowId'] || '',
    kind: _0x479864['kind'] || _0x344677['kind'] || '',
    modelId: _0x479864['modelId'] || '',
    displayName: _0x479864['displayName'] || '',
    baseUrlMode:
      _0x344677['extensions']?.['comfyui']?.['baseUrlMode'] ||
      _0x479864['extensions']?.['comfyUiWorkflow']?.['baseUrlMode'] ||
      'local',
    componentSelectionMode:
      _0x344677['extensions']?.['comfyui']?.['componentSelectionMode'] ||
      _0x479864['extensions']?.['comfyUiWorkflow']?.['componentSelectionMode'] ||
      'auto',
    slotCount: _0x1fca8a['length'],
    paramCount: _0x3b86eb['length'],
    mappingCount: _0x5a17ec['length'],
    slots: _0x1fca8a['map']((_0x3c95c8) => ({
      id: _0x3c95c8['id'],
      kind: _0x3c95c8['kind'],
      label: _0x3c95c8['label'] || _0x3c95c8['id'],
      required: _0x3c95c8['required'] === !![],
    })),
    params: _0x3b86eb['map']((_0x45b200) => ({
      id: _0x45b200['id'],
      label: _0x45b200['label'] || _0x45b200['id'],
      type: _0x45b200['type'] || 'text',
      placement: _0x45b200['placement'] || 'advanced',
      variant: _0x45b200['variant'] || '',
    })),
  };
}
