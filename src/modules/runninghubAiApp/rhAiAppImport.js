import { buildManifestDraftBundle } from '../../manifests/index.js';
import { inferRunningHubFieldMetadata, getRunningHubFieldOptions } from './rhAiAppFieldMetadata.js';
import { resolveRunningHubSiteProfileIdFromUrl } from '../runningHubProviderProfiles.js';
import { RUNNINGHUB_INSTANCE_OPTIONS, normalizeRunningHubInstanceType } from '../runningHubInstanceTypes.js';
export const RH_AI_APP_DISPLAY_NAME = 'RH AI应用';
export { CUSTOM_APP_FOOTER_LIMIT as RH_AI_APP_FOOTER_PARAM_LIMIT } from '../../domain/customAiApp/parameterLayout.js';
import { getParameterFooterFields } from '../../domain/customAiApp/parameterLayout.js';
const RUNNINGHUB_AI_APP_URL_RE =
    /https?:\/\/(?:www\.)?runninghub\.(?:cn|ai)\/openapi\/v2\/run\/ai-app\/([^'"`\s\\]+)/i,
  DATA_FLAG_RE = /--data(?:-raw|-binary)?\s+/i,
  MEDIA_FIELD_KINDS = new Set(['image', 'video', 'audio']),
  OUTPUT_KINDS = new Set(['image', 'video', 'audio']),
  COMPONENT_KINDS = new Set(['image', 'video', 'audio', 'prompt', 'param']),
  CONTROL_TYPES = new Set(['text', 'textarea', 'stepper', 'float', 'toggle', 'prompt', 'select']),
  TEXT_CONTROL_OPTIONS = Object['freeze'](['text', 'textarea', 'prompt']),
  AMBIGUOUS_ZERO_CONTROL_OPTIONS = Object['freeze'](['text', 'stepper', 'float']),
  TEXT_COMPONENT_KIND_OPTIONS = Object['freeze'](['param', 'prompt']),
  INSTANCE_FIELD = Object['freeze']({
    id: 'rhInstanceType',
    type: 'segmented',
    placement: 'instance',
    label: '显存',
    defaultValue: 'default',
    options: RUNNINGHUB_INSTANCE_OPTIONS,
  });
function normalizeText(_0x52e0af, _0x36c753 = '') {
  const _0x4774b2 = String(_0x52e0af ?? '')['trim']();
  return _0x4774b2 || _0x36c753;
}
function normalizeOutputKind(_0x47812d) {
  const _0xa5544d = String(_0x47812d || '')
    ['trim']()
    ['toLowerCase']();
  return OUTPUT_KINDS['has'](_0xa5544d) ? _0xa5544d : 'image';
}
function normalizeInstanceType(_0x351789) {
  return normalizeRunningHubInstanceType(_0x351789);
}
function sanitizeIdentifierPart(_0x90fc35, _0x444a8b = 'field') {
  const _0x30592a = String(_0x90fc35 || '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/[^a-z0-9_-]+/g, '_')
    ['replace'](/^_+|_+$/g, '');
  return _0x30592a || _0x444a8b;
}
function createStableHash(_0x38fbc0) {
  const _0x1e65bc = String(_0x38fbc0 || '');
  let _0x5f50da = 0x811c9dc5;
  for (let _0x5bdcc7 = 0x0; _0x5bdcc7 < _0x1e65bc['length']; _0x5bdcc7 += 0x1) {
    ((_0x5f50da ^= _0x1e65bc['charCodeAt'](_0x5bdcc7)), (_0x5f50da = Math['imul'](_0x5f50da, 0x1000193)));
  }
  return (_0x5f50da >>> 0x0)['toString'](0x24)['padStart'](0x7, '0')['slice'](0x0, 0x8);
}
function stripCurlLineContinuations(_0x17f080) {
  return String(_0x17f080 || '')['replace'](/\\\r?\n/g, '\x0a');
}
function readQuotedCurlValue(_0x405a78, _0x51eaa1) {
  let _0x35b2e6 = _0x51eaa1;
  while (_0x35b2e6 < _0x405a78['length'] && /\s/['test'](_0x405a78[_0x35b2e6])) _0x35b2e6 += 0x1;
  const _0x1a2557 = _0x405a78[_0x35b2e6];
  if (_0x1a2557 !== '\x27' && _0x1a2557 !== '\x22') {
    const _0x50fa9c = _0x405a78['slice'](_0x35b2e6),
      _0x5ca6c0 = _0x50fa9c['split'](/\r?\n/)[0x0] || _0x50fa9c;
    return _0x5ca6c0['trim']();
  }
  _0x35b2e6 += 0x1;
  let _0x51d1fc = '';
  for (; _0x35b2e6 < _0x405a78['length']; _0x35b2e6 += 0x1) {
    const _0x2fe0e6 = _0x405a78[_0x35b2e6];
    if (_0x2fe0e6 === _0x1a2557) {
      const _0x39b3ca = _0x405a78[_0x35b2e6 - 0x1] === '\x5c';
      if (!_0x39b3ca || _0x1a2557 === '\x27') return _0x51d1fc;
    }
    _0x51d1fc += _0x2fe0e6;
  }
  return _0x51d1fc['trim']();
}
function extractCurlDataPayload(_0x54cfb1) {
  const _0x42652b = stripCurlLineContinuations(_0x54cfb1),
    _0x28cb4f = DATA_FLAG_RE['exec'](_0x42652b);
  if (!_0x28cb4f) return '';
  return readQuotedCurlValue(_0x42652b, _0x28cb4f['index'] + _0x28cb4f[0x0]['length']);
}
function extractFirstJsonObject(_0x3bc354) {
  const _0x4a009f = String(_0x3bc354 || ''),
    _0x1a04be = _0x4a009f['indexOf']('{');
  if (_0x1a04be < 0x0) return '';
  let _0x329df8 = 0x0,
    _0x4f249b = ![],
    _0x3a595a = '',
    _0x25e9d9 = ![];
  for (let _0x19592b = _0x1a04be; _0x19592b < _0x4a009f['length']; _0x19592b += 0x1) {
    const _0x4d3310 = _0x4a009f[_0x19592b];
    if (_0x4f249b) {
      if (_0x25e9d9) {
        _0x25e9d9 = ![];
        continue;
      }
      if (_0x4d3310 === '\x5c') {
        _0x25e9d9 = !![];
        continue;
      }
      _0x4d3310 === _0x3a595a && ((_0x4f249b = ![]), (_0x3a595a = ''));
      continue;
    }
    if (_0x4d3310 === '\x22' || _0x4d3310 === '\x27') {
      ((_0x4f249b = !![]), (_0x3a595a = _0x4d3310));
      continue;
    }
    if (_0x4d3310 === '{') _0x329df8 += 0x1;
    if (_0x4d3310 === '}') {
      _0x329df8 -= 0x1;
      if (_0x329df8 === 0x0) return _0x4a009f['slice'](_0x1a04be, _0x19592b + 0x1);
    }
  }
  return '';
}
function extractAiAppId(_0x58ccbf, _0x1f770a = {}, _0x297605 = '') {
  const _0x15dbaa = normalizeText(_0x297605);
  if (_0x15dbaa) return _0x15dbaa;
  const _0x2ebb30 = String(_0x58ccbf || ''),
    _0x3b2102 = _0x2ebb30['match'](RUNNINGHUB_AI_APP_URL_RE),
    _0x4f0023 = normalizeText(_0x3b2102?.[0x1]);
  if (_0x4f0023) return _0x4f0023;
  return normalizeText(_0x1f770a['appId'] || _0x1f770a['workflowId'] || _0x1f770a['aiAppId']);
}
function parseJsonPayload(_0x56146a) {
  try {
    return JSON['parse'](_0x56146a);
  } catch (_0x2609cd) {
    throw new Error('RH AI应用 JSON 解析失败：' + (_0x2609cd?.['message'] || '格式错误'));
  }
}
export function parseRunningHubAiAppInput(_0x290364, { appId: _0x1b0b5c = '' } = {}) {
  const _0x22c2d4 = String(_0x290364 || '')['trim']();
  if (!_0x22c2d4) throw new Error('请粘贴 RunningHub AI App 的 curl 或 JSON');
  const _0x191b79 =
    (_0x22c2d4['startsWith']('{') ? _0x22c2d4 : '') ||
    extractCurlDataPayload(_0x22c2d4) ||
    extractFirstJsonObject(_0x22c2d4);
  if (!_0x191b79) throw new Error('未找到\x20--data-raw\x20JSON\x20请求体');
  const _0x1468d2 = parseJsonPayload(_0x191b79),
    _0x4670c5 = extractAiAppId(_0x22c2d4, _0x1468d2, _0x1b0b5c);
  if (!_0x4670c5) throw new Error('未找到 RunningHub AI App 的 appId');
  if (!Array['isArray'](_0x1468d2['nodeInfoList']) || _0x1468d2['nodeInfoList']['length'] === 0x0)
    throw new Error('JSON 中缺少 nodeInfoList');
  return {
    appId: _0x4670c5,
    body: _0x1468d2,
    nodeInfoList: _0x1468d2['nodeInfoList'],
    providerProfileId: _0x1468d2['providerProfileId'] || resolveRunningHubSiteProfileIdFromUrl(_0x22c2d4),
    sourceText: _0x22c2d4,
  };
}
function normalizeFieldName(_0x40699d) {
  return String(_0x40699d || '')['trim']();
}
function getFieldKind(_0x5b1fc2) {
  const _0x5907cd = normalizeFieldName(_0x5b1fc2)['toLowerCase']();
  return MEDIA_FIELD_KINDS['has'](_0x5907cd) ? _0x5907cd : '';
}
function getDefaultComponentKind(_0x5ebbc4) {
  const _0x2afe52 = getFieldKind(_0x5ebbc4);
  if (_0x2afe52) return _0x2afe52;
  return String(_0x5ebbc4 || '')
    ['trim']()
    ['toLowerCase']() === 'prompt'
    ? 'prompt'
    : 'param';
}
function createLabelFromDescription(_0x17e491, _0x44ce24, _0x47ae1e) {
  const _0x2aaa9e = normalizeText(_0x17e491),
    _0x5bf728 = normalizeFieldName(_0x44ce24);
  if (!_0x2aaa9e) return _0x47ae1e;
  if (_0x5bf728 && _0x2aaa9e['toLowerCase']()['startsWith'](_0x5bf728['toLowerCase']()))
    return normalizeText(_0x2aaa9e['slice'](_0x5bf728['length']), _0x2aaa9e);
  return _0x2aaa9e;
}
function isBooleanLiteral(_0x3a53d0) {
  const _0x5dc3ba = String(_0x3a53d0 ?? '')
    ['trim']()
    ['toLowerCase']();
  return _0x5dc3ba === 'true' || _0x5dc3ba === 'false';
}
function isIntegerLiteral(_0x1f734d) {
  return /^[+-]?\d+$/['test'](String(_0x1f734d ?? '')['trim']());
}
function isDecimalLiteral(_0x216f51) {
  return /^[+-]?(?:\d+\.\d+|\.\d+)$/['test'](String(_0x216f51 ?? '')['trim']());
}
function isAmbiguousZeroLiteral(_0x524795) {
  return /^[+-]?0+$/['test'](String(_0x524795 ?? '')['trim']());
}
function containsCjkText(_0x69671e) {
  return /[\u3400-\u9fff]/u['test'](String(_0x69671e ?? ''));
}
function looksLikeLongEnglishText(_0x112ec4) {
  const _0x64dfe5 = String(_0x112ec4 ?? '')['trim'](),
    _0x4f9433 = _0x64dfe5['match'](/[A-Za-z][A-Za-z'-]*/g) || [],
    _0x4125d1 = (_0x64dfe5['match'](/[A-Za-z]/g) || [])['length'];
  return _0x4f9433['length'] >= 0x4 || _0x4125d1 >= 0x1c;
}
function looksLikeStructuredText(_0x58ead3) {
  const _0x4b61d1 = String(_0x58ead3 ?? '')['trim']();
  if (!_0x4b61d1) return !![];
  return (
    containsCjkText(_0x4b61d1) ||
    looksLikeLongEnglishText(_0x4b61d1) ||
    _0x4b61d1['length'] > 0x2a ||
    /[\s,.;:!?，。；：！？、]/['test'](_0x4b61d1) ||
    /^[\[{]/['test'](_0x4b61d1)
  );
}
function labelSuggestsPrompt(_0x4f1085, _0x4e5813) {
  const _0x163e39 = String(_0x4f1085 || ''),
    _0x1daf95 = String(_0x4e5813 || '')['toLowerCase']();
  return _0x1daf95 === 'prompt' || /prompt|提示词|描述|文案|动作|内容|台词|歌词/i['test'](_0x163e39);
}
function inferTextControlType(_0x23f280, _0x278bfd, _0x33c8c5) {
  if (labelSuggestsPrompt(_0x278bfd, _0x33c8c5) || looksLikeStructuredText(_0x23f280)) return 'textarea';
  return 'text';
}
function inferComponentConfig(_0x14a35e, _0x4a142b, _0x243279, _0x4057fb = {}) {
  const _0x3c014e = inferRunningHubFieldMetadata(_0x4057fb);
  if (_0x3c014e) return _0x3c014e;
  const _0x25cff5 = String(_0x243279 || '')
      ['trim']()
      ['toLowerCase'](),
    _0x59a199 = getFieldKind(_0x243279);
  if (_0x59a199)
    return {
      componentKind: _0x59a199,
      componentKindLocked: !![],
      componentKindOptions: [_0x59a199],
      controlType: 'text',
      controlTypeLocked: !![],
      controlTypeOptions: [],
    };
  if (_0x25cff5 === 'prompt')
    return {
      componentKind: 'prompt',
      componentKindLocked: !![],
      componentKindOptions: ['prompt'],
      controlType: 'prompt',
      controlTypeLocked: !![],
      controlTypeOptions: [],
    };
  if (_0x25cff5 === 'index')
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: !![],
      controlTypeOptions: ['stepper'],
    };
  if (isBooleanLiteral(_0x14a35e))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'toggle',
      controlTypeLocked: !![],
      controlTypeOptions: ['toggle'],
    };
  if (isDecimalLiteral(_0x14a35e))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'float',
      controlTypeLocked: !![],
      controlTypeOptions: ['float'],
    };
  if (isIntegerLiteral(_0x14a35e))
    return {
      componentKind: 'param',
      componentKindLocked: !![],
      componentKindOptions: ['param'],
      controlType: 'stepper',
      controlTypeLocked: !isAmbiguousZeroLiteral(_0x14a35e),
      controlTypeOptions: isAmbiguousZeroLiteral(_0x14a35e)
        ? AMBIGUOUS_ZERO_CONTROL_OPTIONS['slice']()
        : ['stepper'],
    };
  return {
    componentKind: 'param',
    componentKindLocked: ![],
    componentKindOptions: TEXT_COMPONENT_KIND_OPTIONS['slice'](),
    controlType: inferTextControlType(_0x14a35e, _0x4a142b, _0x243279),
    controlTypeLocked: ![],
    controlTypeOptions: TEXT_CONTROL_OPTIONS['slice'](),
  };
}
function normalizeComponentKind(_0x1c2b72, _0x1a42d4 = 'param') {
  const _0x5c7cd0 = String(_0x1c2b72 || '')
    ['trim']()
    ['toLowerCase']();
  return COMPONENT_KINDS['has'](_0x5c7cd0) ? _0x5c7cd0 : _0x1a42d4;
}
function normalizeControlType(_0x6c4ac6, _0x5ab994 = 'text') {
  const _0x2b10ce = String(_0x6c4ac6 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x2b10ce === 'integer' || _0x2b10ce === 'number') return 'stepper';
  if (_0x2b10ce === 'decimal') return 'float';
  if (_0x2b10ce === 'boolean' || _0x2b10ce === 'bool') return 'toggle';
  return CONTROL_TYPES['has'](_0x2b10ce) ? _0x2b10ce : _0x5ab994;
}
function normalizeBooleanDefault(_0xb70be5) {
  const _0x487140 = String(_0xb70be5 ?? '')
    ['trim']()
    ['toLowerCase']();
  return (
    _0xb70be5 === !![] ||
    _0x487140 === 'true' ||
    _0x487140 === '1' ||
    _0x487140 === 'yes' ||
    _0x487140 === 'on'
  );
}
function normalizeIntegerDefault(_0x323a57) {
  const _0x445b3e = Number(_0x323a57);
  return Number['isFinite'](_0x445b3e) ? Math['trunc'](_0x445b3e) : 0x0;
}
function normalizeFloatDefault(_0x678555) {
  const _0x34e837 = Number(_0x678555);
  return Number['isFinite'](_0x34e837) ? _0x34e837 : 0x0;
}
function normalizeDefaultValueForControl(_0x26c63b, _0x41d31d) {
  const _0x261397 = normalizeControlType(_0x26c63b);
  if (_0x261397 === 'toggle') return normalizeBooleanDefault(_0x41d31d);
  if (_0x261397 === 'stepper') return normalizeIntegerDefault(_0x41d31d);
  if (_0x261397 === 'float') return normalizeFloatDefault(_0x41d31d);
  return String(_0x41d31d ?? '');
}
function normalizeOrderValue(_0x2edbf5, _0x4933f8) {
  const _0x5c56f7 = Number(_0x2edbf5);
  return Number['isFinite'](_0x5c56f7) ? _0x5c56f7 : _0x4933f8;
}
function normalizePreviewPlacement(_0x2f6b74) {
  return String(_0x2f6b74 || '')['trim']() === 'home' ? 'home' : 'advanced';
}
function getNodeTransformForControl(_0x26ab40) {
  const _0x430556 = normalizeControlType(_0x26ab40);
  if (_0x430556 === 'toggle') return 'booleanString';
  if (_0x430556 === 'stepper') return 'integer';
  if (_0x430556 === 'float') return 'number';
  return '';
}
function getUiSchemaTypeForControl(_0x2c6935) {
  const _0x3c2f95 = normalizeControlType(_0x2c6935);
  return _0x3c2f95 === 'float' ? 'stepper' : _0x3c2f95;
}
function getFloatStep(_0x35fde0) {
  const _0x4f58ba = String(_0x35fde0 ?? '')['trim'](),
    _0x101b26 = _0x4f58ba['match'](/\.(\d+)/),
    _0x5cff6b = _0x101b26 ? Math['max'](0x1, _0x101b26[0x1]['length']) : 0x2;
  return Number('0.' + '0'['repeat'](Math['max'](0x0, _0x5cff6b - 0x1)) + '1');
}
function createParamFieldId(_0x58a4d8, _0xe9a929) {
  const _0x1f0796 = sanitizeIdentifierPart(_0x58a4d8?.['nodeId'], 'node_' + _0xe9a929),
    _0x46791e = sanitizeIdentifierPart(_0x58a4d8?.['fieldName'], 'value');
  return 'rh_aiapp_' + _0x1f0796 + '_' + _0x46791e + '_' + _0xe9a929;
}
function createSlotId(_0x3aa601, _0x2c4838, _0x7f952) {
  const _0x2e25a0 = sanitizeIdentifierPart(_0x2c4838?.['nodeId'], 'node_' + _0x7f952);
  return 'rh_aiapp_' + _0x3aa601 + '_' + _0x2e25a0 + '_' + _0x7f952;
}
function buildInputSlotCounts(_0x1eee31) {
  return _0x1eee31['reduce']((_0x2fa17e, _0x5e891d) => {
    const _0x38d1f0 = String(_0x5e891d?.['kind'] || '')['trim']();
    if (!_0x38d1f0) return _0x2fa17e;
    return ((_0x2fa17e[_0x38d1f0] = (_0x2fa17e[_0x38d1f0] || 0x0) + 0x1), _0x2fa17e);
  }, {});
}
function buildResultConfig(_0x2e7c55) {
  if (_0x2e7c55 === 'video')
    return {
      outputType: 'video',
      taskIdPath: 'taskId',
      videoPaths: ['results[].videoUrl', 'results[].url', 'videoUrl', 'url'],
    };
  if (_0x2e7c55 === 'audio')
    return {
      outputType: 'audio',
      taskIdPath: 'taskId',
      audioPaths: ['results[].audioUrl', 'results[].url', 'audioUrl', 'url'],
    };
  return {
    outputType: 'image',
    taskIdPath: 'taskId',
    imagePaths: ['results[].imageUrl', 'results[].url', 'imageUrl', 'url'],
  };
}
export function buildRunningHubCustomAppExtensions(
  _0x3ba145,
  _0x77e054,
  _0x2ded6d,
  _0x32f9bd = '',
  _0x4a9c8a = '',
) {
  const _0x1474c5 = normalizeText(_0x4a9c8a) || 'AI App ' + _0x77e054,
    _0x5e9c9d = normalizeText(_0x32f9bd),
    _0x23ea9d = Boolean(_0x5e9c9d),
    _0x494741 = {
      rhAiApp: {
        appId: _0x77e054,
        kind: _0x3ba145,
        appKey: _0x5e9c9d,
        name: _0x2ded6d,
        description: normalizeText(_0x4a9c8a),
        isSavedApp: _0x23ea9d,
      },
    };
  return (
    _0x23ea9d &&
      _0x3ba145 === 'image' &&
      (_0x494741['imageMenu'] = {
        group: 'rhAiApp',
        order: 0x3e7,
        title: _0x2ded6d,
        subtitle: _0x1474c5,
        icon: 'images/RH.png',
        iconAlt: 'runninghub',
      }),
    _0x23ea9d &&
      _0x3ba145 === 'video' &&
      (_0x494741['videoMenu'] = {
        role: 'rhAiApp',
        group: 'rhAiApp',
        order: 0x3e7,
        label: _0x2ded6d,
        subtitle: _0x1474c5,
      }),
    _0x23ea9d && _0x3ba145 === 'audio' && (_0x494741['audioMenu'] = { group: 'rhAiApp', order: 0x3e7 }),
    _0x494741
  );
}
function normalizeNodeInfoItem(_0x2cda33, _0x288c26) {
  if (!_0x2cda33 || typeof _0x2cda33 !== 'object' || Array['isArray'](_0x2cda33)) return null;
  const _0x49f477 = normalizeText(_0x2cda33['nodeId']),
    _0x236d76 = normalizeFieldName(_0x2cda33['fieldName']);
  if (!_0x49f477 || !_0x236d76) return null;
  return {
    nodeId: _0x49f477,
    fieldName: _0x236d76,
    fieldValue: _0x2cda33['fieldValue'] ?? '',
    fieldType: _0x2cda33['fieldType'],
    fieldData: _0x2cda33['fieldData'],
    description: normalizeText(_0x2cda33['description']),
    index: _0x288c26,
  };
}
export function createRunningHubAiAppComponentDrafts(_0x258238, { appId: appId = '' } = {}) {
  const _0x4cb6a0 = parseRunningHubAiAppInput(_0x258238, { appId: appId });
  return {
    parsed: _0x4cb6a0,
    components: _0x4cb6a0['nodeInfoList']
      ['map'](normalizeNodeInfoItem)
      ['filter'](Boolean)
      ['map']((_0x422f08) => {
        const _0x437572 = getDefaultComponentKind(_0x422f08['fieldName']),
          _0x4f65a8 = createLabelFromDescription(
            _0x422f08['description'],
            _0x422f08['fieldName'],
            _0x422f08['fieldName'],
          ),
          _0x5b1a10 = inferComponentConfig(
            _0x422f08['fieldValue'],
            _0x4f65a8,
            _0x422f08['fieldName'],
            _0x422f08,
          ),
          _0x163b38 = _0x5b1a10['componentKind'] || _0x437572,
          _0x4ef6d3 = {
            index: _0x422f08['index'],
            nodeId: _0x422f08['nodeId'],
            fieldName: _0x422f08['fieldName'],
            description: _0x422f08['description'],
            label: _0x4f65a8,
            componentKind: _0x163b38,
            componentKindLocked: _0x5b1a10['componentKindLocked'] === !![],
            componentKindOptions: _0x5b1a10['componentKindOptions'] || [_0x437572],
            controlType: _0x5b1a10['controlType'],
            controlTypeLocked: _0x5b1a10['controlTypeLocked'] === !![],
            controlTypeOptions: _0x5b1a10['controlTypeOptions'] || [],
            defaultValue: String(_0x422f08['fieldValue'] ?? ''),
            options: getRunningHubFieldOptions(_0x422f08),
          };
        return (
          _0x163b38 === 'param' &&
            ((_0x4ef6d3['previewPlacement'] = 'advanced'),
            (_0x4ef6d3['advancedParamOrder'] = _0x422f08['index'])),
          _0x4ef6d3
        );
      }),
  };
}
function normalizeOptionList(_0x343181 = [], _0x2b4c73 = null) {
  if (!Array['isArray'](_0x343181)) return [];
  return _0x343181['map']((_0x17fa74) =>
    String(_0x17fa74 || '')
      ['trim']()
      ['toLowerCase'](),
  )['filter']((_0x50a13f, _0x2bd0c0, _0x30fb40) => {
    if (!_0x50a13f || _0x30fb40['indexOf'](_0x50a13f) !== _0x2bd0c0) return ![];
    return !_0x2b4c73 || _0x2b4c73['has'](_0x50a13f);
  });
}
function pickAllowedValue(_0xbf99dc, _0x56249e, _0x445817) {
  const _0xffda07 = String(_0xbf99dc || '')
    ['trim']()
    ['toLowerCase']();
  return _0x56249e['includes'](_0xffda07) ? _0xffda07 : _0x445817;
}
function normalizeComponentOverride(_0xbc5452, _0x136a76, _0x5309a5) {
  const _0x417358 = getDefaultComponentKind(_0x136a76['fieldName']),
    _0x485d4d = inferComponentConfig(_0x136a76['fieldValue'], _0x5309a5, _0x136a76['fieldName'], _0x136a76),
    _0x1347ab = normalizeOptionList(_0x485d4d['componentKindOptions'], COMPONENT_KINDS),
    _0x32644e = normalizeOptionList(_0x485d4d['controlTypeOptions'], CONTROL_TYPES),
    _0xc827fd = normalizeControlType(_0x485d4d['controlType']),
    _0xef7e6b = normalizeComponentKind(_0xbc5452?.['componentKind'], _0x485d4d['componentKind'] || _0x417358);
  let _0x5f5905 =
    _0x485d4d['componentKindLocked'] === !![]
      ? _0x485d4d['componentKind']
      : pickAllowedValue(
          _0xef7e6b,
          _0x1347ab['length'] ? _0x1347ab : [_0xef7e6b],
          _0x485d4d['componentKind'] || _0x417358,
        );
  const _0x5c8a72 = normalizeControlType(_0xbc5452?.['controlType'], _0xc827fd);
  let _0x118048 =
    _0x5f5905 === 'prompt'
      ? 'prompt'
      : _0x485d4d['controlTypeLocked'] === !![]
        ? _0xc827fd
        : pickAllowedValue(_0x5c8a72, _0x32644e['length'] ? _0x32644e : [_0xc827fd], _0xc827fd);
  return (
    _0x118048 === 'prompt' &&
      !_0x485d4d['componentKindLocked'] &&
      _0x1347ab['includes']('prompt') &&
      (_0x5f5905 = 'prompt'),
    {
      label: normalizeText(_0xbc5452?.['label'], _0x5309a5),
      description: normalizeText(_0xbc5452?.['description'], _0x136a76['description'] || _0x5309a5),
      componentKind: _0x5f5905,
      componentKindLocked: _0x485d4d['componentKindLocked'] === !![],
      componentKindOptions: _0x1347ab['length'] ? _0x1347ab : [_0x5f5905],
      controlType: _0x118048,
      controlTypeLocked: _0x485d4d['controlTypeLocked'] === !![],
      controlTypeOptions: _0x32644e,
      inputOrder: normalizeOrderValue(_0xbc5452?.['inputOrder'], _0x136a76['index']),
      homeParamOrder: normalizeOrderValue(_0xbc5452?.['homeParamOrder'], _0x136a76['index']),
      advancedParamOrder: normalizeOrderValue(_0xbc5452?.['advancedParamOrder'], _0x136a76['index']),
      previewPlacement: normalizePreviewPlacement(_0xbc5452?.['previewPlacement']),
      footerGroupId: String(_0xbc5452?.['footerGroupId'] || '')['trim'](),
      footerGroupLabel: String(_0xbc5452?.['footerGroupLabel'] || '参数组')['trim'](),
      footerGroupDescription: String(_0xbc5452?.['footerGroupDescription'] || '')['trim'](),
      defaultValue: normalizeDefaultValueForControl(
        _0x118048,
        _0xbc5452?.['defaultValue'] === undefined ? _0x136a76['fieldValue'] : _0xbc5452['defaultValue'],
      ),
    }
  );
}
function buildComponentOverrideMap(_0x9a549c = []) {
  const _0x444a35 = new Map();
  if (!Array['isArray'](_0x9a549c)) return _0x444a35;
  return (
    _0x9a549c['forEach']((_0x55d1a1) => {
      const _0x4eec14 = Number(_0x55d1a1?.['index']);
      if (!Number['isInteger'](_0x4eec14) || _0x4eec14 < 0x0) return;
      _0x444a35['set'](_0x4eec14, _0x55d1a1);
    }),
    _0x444a35
  );
}
function buildManifestParts(_0x287c88, _0x305f56, _0x5ac4f5 = [], _0x4bacb7 = {}) {
  const _0x961699 = [],
    _0x5558d3 = [
      { ...INSTANCE_FIELD, defaultValue: normalizeInstanceType(_0x287c88['body']?.['instanceType']) },
    ],
    _0x1018ac = [];
  let _0x10d65a = ![],
    _0x10035c = '';
  const _0x2e9059 = buildComponentOverrideMap(_0x5ac4f5),
    _0x4a0bf9 = _0x287c88['nodeInfoList']
      ['map'](normalizeNodeInfoItem)
      ['filter'](Boolean)
      ['map']((_0x30efdf, _0x1d8dfe) => {
        const _0x5652bd = createLabelFromDescription(
          _0x30efdf['description'],
          _0x30efdf['fieldName'],
          _0x30efdf['fieldName'],
        );
        return {
          item: _0x30efdf,
          index: _0x1d8dfe,
          component: normalizeComponentOverride(_0x2e9059['get'](_0x30efdf['index']), _0x30efdf, _0x5652bd),
        };
      }),
    _0xd4f988 = getParameterFooterFields(
      _0x4a0bf9['map'](({ component: _0x2d7d22, item: _0x804f7d }) => ({
        ..._0x2d7d22,
        index: _0x804f7d['index'],
      })),
    );
  _0x4a0bf9['forEach'](({ item: _0x434733, index: _0x1a69b9, component: _0x1d61ba }) => {
    const _0x19fc1e = _0x1d61ba['label'],
      _0x3a5f57 = _0x1d61ba['description'] || _0x434733['description'] || _0x19fc1e,
      _0x3d12b6 = _0x1d61ba['componentKind'];
    if (MEDIA_FIELD_KINDS['has'](_0x3d12b6)) {
      const _0x94ff58 = createSlotId(_0x3d12b6, _0x434733, _0x1a69b9);
      (_0x961699['push']({
        id: _0x94ff58,
        kind: _0x3d12b6,
        label: _0x19fc1e,
        description: _0x3a5f57,
        required: !![],
        displayOrder: _0x1d61ba['inputOrder'],
        customAiAppComponentIndex: _0x434733['index'],
        rhAiAppComponentIndex: _0x434733['index'],
      }),
        _0x1018ac['push']({
          nodeId: _0x434733['nodeId'],
          fieldName: _0x434733['fieldName'],
          source: _0x3d12b6 + 'Input',
          field: _0x94ff58,
          slot: _0x94ff58,
          urlField: _0x94ff58,
          required: !![],
          missingMessage: '请接入' + _0x19fc1e,
          description: _0x3a5f57,
        }));
      return;
    }
    if (_0x3d12b6 === 'prompt') {
      _0x10d65a = !![];
      !_0x10035c &&
        (_0x10035c = normalizeText(
          _0x2e9059['get'](_0x434733['index'])?.['description'] || _0x434733['description'],
        ));
      _0x1018ac['push']({
        nodeId: _0x434733['nodeId'],
        fieldName: _0x434733['fieldName'],
        source: 'prompt',
        defaultValue: _0x1d61ba['defaultValue'],
        description: _0x3a5f57 || '提示词',
      });
      return;
    }
    const _0x54901f = createParamFieldId(_0x434733, _0x1a69b9),
      _0x4f1691 = normalizeControlType(_0x1d61ba['controlType']),
      _0x52f82d = getUiSchemaTypeForControl(_0x4f1691),
      _0x3acb60 = normalizeDefaultValueForControl(_0x4f1691, _0x1d61ba['defaultValue']),
      _0x44c5cd = getNodeTransformForControl(_0x4f1691),
      _0x2db905 = _0x1d61ba['previewPlacement'] === 'home' && _0xd4f988['has'](_0x434733['index']);
    (_0x5558d3['push']({
      id: _0x54901f,
      type: _0x52f82d,
      placement: _0x2db905 ? 'mode' : 'advanced',
      ...(_0x2db905
        ? { ..._0xd4f988['get'](_0x434733['index']) }
        : { displayOrder: _0x1d61ba['advancedParamOrder'] }),
      label: _0x19fc1e,
      defaultValue: _0x3acb60,
      description: _0x3a5f57,
      ...(_0x4f1691 === 'select' ? { options: getRunningHubFieldOptions(_0x434733) } : {}),
      customAiAppComponentIndex: _0x434733['index'],
      rhAiAppComponentIndex: _0x434733['index'],
      ...(_0x52f82d === 'stepper'
        ? {
            step: _0x4f1691 === 'float' ? getFloatStep(_0x3acb60) : 0x1,
            ...(_0x4f1691 === 'float' ? { valueType: 'float' } : {}),
          }
        : {}),
    }),
      _0x1018ac['push']({
        nodeId: _0x434733['nodeId'],
        fieldName: _0x434733['fieldName'],
        source: 'param',
        field: _0x54901f,
        defaultValue: _0x3acb60,
        ...(_0x44c5cd ? { transform: _0x44c5cd } : {}),
        description: _0x3a5f57,
      }));
  });
  const _0x1fc0f1 = buildInputSlotCounts(_0x961699),
    _0x3c8585 = Array['from'](
      new Set([...(_0x10d65a ? ['text'] : []), ..._0x961699['map']((_0x5a4ce1) => _0x5a4ce1['kind'])]),
    ),
    _0x1cf9d7 = _0x961699['map']((_0x14eed5, _0x1c64d1) => ({ ..._0x14eed5, _sourceOrder: _0x1c64d1 }))
      ['sort']((_0x2b2eb7, _0x504148) => {
        const _0x2abb4f =
          normalizeOrderValue(_0x2b2eb7['displayOrder'], _0x2b2eb7['_sourceOrder']) -
          normalizeOrderValue(_0x504148['displayOrder'], _0x504148['_sourceOrder']);
        if (_0x2abb4f !== 0x0) return _0x2abb4f;
        return _0x2b2eb7['_sourceOrder'] - _0x504148['_sourceOrder'];
      })
      ['map'](({ _sourceOrder: _0x4785ef, ..._0x5c11c0 }, _0x37ece8) => ({
        ..._0x5c11c0,
        displayOrder: _0x37ece8,
      })),
    _0x5642dc = [
      _0x5558d3[0x0],
      ..._0x5558d3['slice'](0x1)['sort']((_0xc9888e, _0x2c4963) => {
        const _0x3e3645 = String(_0xc9888e?.['placement'] || '')['localeCompare'](
          String(_0x2c4963?.['placement'] || ''),
        );
        if (_0x3e3645 !== 0x0) return _0x3e3645;
        return (
          normalizeOrderValue(_0xc9888e?.['displayOrder'], Number['MAX_SAFE_INTEGER']) -
          normalizeOrderValue(_0x2c4963?.['displayOrder'], Number['MAX_SAFE_INTEGER'])
        );
      }),
    ],
    _0x3fc3a5 = normalizeText(_0x4bacb7['promptHelpTooltip']);
  return {
    fixedSlots: _0x1cf9d7,
    uiFields: _0x5642dc,
    nodeInfoList: _0x1018ac,
    inputSlots: {
      allowedKinds: _0x3c8585['slice'](),
      minByKind: { ..._0x1fc0f1 },
      maxByKind: { ..._0x1fc0f1 },
      fixedSlots: _0x1cf9d7,
    },
    capabilities: {
      inputKinds: _0x3c8585['slice'](),
      outputType: _0x305f56,
      fixedAssetSlots: _0x1cf9d7['map']((_0x141e56) => _0x141e56['id']),
    },
    help: _0x3fc3a5 || _0x10035c ? { tooltip: _0x3fc3a5 || _0x10035c } : null,
    prompt: { emptyPolicy: 'allow', visible: _0x10d65a },
  };
}
export function buildRunningHubAiAppManifestBundle({
  input: _0x4b30e5,
  appId: appId = '',
  kind: kind = 'image',
  components: components = [],
  displayName: displayName = RH_AI_APP_DISPLAY_NAME,
  description: description = '',
  promptHelpTooltip: promptHelpTooltip = '',
  appKey: appKey = '',
} = {}) {
  const _0x582bc6 = parseRunningHubAiAppInput(_0x4b30e5, { appId: appId }),
    _0xb6d935 = normalizeOutputKind(kind),
    _0x53a289 = normalizeText(displayName, RH_AI_APP_DISPLAY_NAME),
    _0x4aa367 = normalizeText(description) || 'RunningHub AI App ' + _0x582bc6['appId'],
    _0x2e866f = normalizeText(promptHelpTooltip),
    _0x5e64ee = createStableHash(
      JSON['stringify']({
        appId: _0x582bc6['appId'],
        appKey: normalizeText(appKey),
        ...(_0x582bc6['body']['providerProfileId']
          ? { providerProfileId: _0x582bc6['body']['providerProfileId'] }
          : {}),
        kind: _0xb6d935,
        description: _0x4aa367,
        promptHelpTooltip: _0x2e866f,
        nodeInfoList: _0x582bc6['nodeInfoList'],
        components: components,
      }),
    ),
    _0x3e0f65 = 'runninghub/ai-app-' + _0xb6d935 + '-' + _0x582bc6['appId'] + '-' + _0x5e64ee,
    _0x36e410 =
      'runninghub.workflow.' + _0xb6d935 + '.ai-app-' + _0x582bc6['appId'] + '-' + _0x5e64ee + '.v1',
    _0xd84b24 = buildManifestParts(_0x582bc6, _0xb6d935, components, { promptHelpTooltip: _0x2e866f });
  return buildManifestDraftBundle({
    sourceId: 'runninghub-ai-app:' + _0xb6d935 + ':' + _0x582bc6['appId'] + ':' + _0x5e64ee,
    modelId: _0x3e0f65,
    executionId: _0x36e410,
    provider: 'runninghubwf',
    adapterType: 'workflow',
    kind: _0xb6d935,
    outputType: _0xb6d935,
    displayName: _0x53a289,
    description: _0x4aa367,
    icon: 'images/RH.png',
    vip: !![],
    appId: _0x582bc6['appId'],
    submitMode: 'openapi-v2-ai-app',
    queryMode: 'openapi-v2-query',
    mapping: { nodeInfoList: _0xd84b24['nodeInfoList'] },
    instanceType: {
      field: 'rhInstanceType',
      defaultValue: normalizeInstanceType(_0x582bc6['body']?.['instanceType']),
    },
    uiFields: _0xd84b24['uiFields'],
    inputSlots: _0xd84b24['inputSlots'],
    help: _0xd84b24['help'],
    prompt: _0xd84b24['prompt'],
    modelExtensions: {
      ...buildRunningHubCustomAppExtensions(_0xb6d935, _0x582bc6['appId'], _0x53a289, appKey, _0x4aa367),
      ...(_0x582bc6['body']['providerProfileId']
        ? { providerProfiles: [_0x582bc6['body']['providerProfileId']] }
        : {}),
    },
    result: buildResultConfig(_0xb6d935),
  });
}
export function summarizeRunningHubAiAppBundle(_0x3ca669) {
  const _0x455e3a = _0x3ca669?.['models']?.[0x0] || {},
    _0x19c3ce = _0x3ca669?.['executions']?.[0x0] || {},
    _0x3748bd = Array['isArray'](_0x455e3a?.['inputSlots']?.['fixedSlots'])
      ? _0x455e3a['inputSlots']['fixedSlots']
      : [],
    _0x1d73e5 = Array['isArray'](_0x455e3a?.['uiSchema']?.['fields']) ? _0x455e3a['uiSchema']['fields'] : [];
  return {
    appId: _0x19c3ce['appId'] || _0x19c3ce['workflowId'] || '',
    kind: _0x455e3a['kind'] || _0x19c3ce['kind'] || '',
    modelId: _0x455e3a['modelId'] || '',
    displayName: _0x455e3a['displayName'] || '',
    slotCount: _0x3748bd['length'],
    paramCount: _0x1d73e5['filter']((_0x2aceab) => _0x2aceab?.['id'] !== 'rhInstanceType')['length'],
    slots: _0x3748bd['map']((_0x1b1150) => ({
      id: _0x1b1150['id'],
      kind: _0x1b1150['kind'],
      label: _0x1b1150['label'] || _0x1b1150['id'],
      required: _0x1b1150['required'] === !![],
    })),
    params: _0x1d73e5['filter']((_0x285610) => _0x285610?.['id'] !== 'rhInstanceType')['map'](
      (_0x1ac300) => ({
        id: _0x1ac300['id'],
        label: _0x1ac300['label'] || _0x1ac300['id'],
        type: _0x1ac300['type'] || 'text',
        placement: _0x1ac300['placement'] || 'advanced',
        variant: _0x1ac300['variant'] || '',
      }),
    ),
  };
}
