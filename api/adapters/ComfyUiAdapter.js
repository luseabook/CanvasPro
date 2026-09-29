import { resolveModelExecution } from '../../src/manifests/index.js';
import {
  buildComfyUiPromptFromManifest,
  getComfyUiPayloadPathValue,
} from './ComfyUiWorkflowMappingAdapter.js';
export const DEFAULT_COMFYUI_BASE_URL = 'http://127.0.0.1:8188';
const COMFYUI_BATCH_SEED_MODULO = 0x100000000,
  CUSTOM_WORKFLOW_MEDIA_INPUT_SOURCES = new Set(['imageInput', 'videoInput', 'audioInput']);
function normalizeText(_0x386e5c, _0x33f23d = '') {
  const _0x1ca84d = String(_0x386e5c ?? '')['trim']();
  return _0x1ca84d || _0x33f23d;
}
export function normalizeComfyUiBaseUrl(_0x563c94) {
  const _0x37ae68 = normalizeText(_0x563c94, DEFAULT_COMFYUI_BASE_URL),
    _0x5e9a4a = /^[a-z][a-z0-9+.-]*:\/\//i['test'](_0x37ae68);
  try {
    const _0x1378e1 = new URL(_0x5e9a4a ? _0x37ae68 : 'http://' + _0x37ae68);
    return (
      (_0x1378e1['search'] = ''),
      (_0x1378e1['hash'] = ''),
      _0x1378e1['toString']()['replace'](/\/+$/, '')
    );
  } catch {
    const _0x3f5286 = _0x37ae68['replace'](/[?#].*$/, '')['replace'](/\/+$/, '');
    if (!_0x3f5286) return DEFAULT_COMFYUI_BASE_URL;
    return _0x5e9a4a ? _0x3f5286 : 'http://' + _0x3f5286;
  }
}
function normalizeBaseUrl(_0x2ba925) {
  return normalizeComfyUiBaseUrl(_0x2ba925);
}
function isPrivateIpv4(_0x3a5dca) {
  const _0x5178d3 = String(_0x3a5dca || '')
    ['split']('.')
    ['map']((_0x357ab2) => Number(_0x357ab2));
  if (_0x5178d3['length'] !== 0x4 || _0x5178d3['some']((_0x2c1987) => !Number['isInteger'](_0x2c1987)))
    return ![];
  const [_0x5aaf80, _0x4d9cc3] = _0x5178d3;
  return (
    _0x5aaf80 === 0xa ||
    _0x5aaf80 === 0x7f ||
    (_0x5aaf80 === 0xac && _0x4d9cc3 >= 0x10 && _0x4d9cc3 <= 0x1f) ||
    (_0x5aaf80 === 0xc0 && _0x4d9cc3 === 0xa8) ||
    (_0x5aaf80 === 0xa9 && _0x4d9cc3 === 0xfe)
  );
}
export function shouldAllowCloudComfyUiBaseUrl(_0x2a4f60) {
  try {
    const _0x32b912 = new URL(normalizeBaseUrl(_0x2a4f60)),
      _0x40a361 = _0x32b912['hostname']['replace'](/^\[|\]$/g, '')['toLowerCase']();
    if (!_0x40a361 || _0x40a361 === 'localhost' || _0x40a361['endsWith']('.localhost')) return ![];
    if (isPrivateIpv4(_0x40a361)) return ![];
    if (_0x40a361 === '::1' || _0x40a361['startsWith']('fc') || _0x40a361['startsWith']('fd')) return ![];
    return !![];
  } catch {
    return ![];
  }
}
function createClientId() {
  return 'aic_' + Date['now']() + '_' + Math['random']()['toString'](0x24)['slice'](0x2, 0xa);
}
function normalizeInteger(_0x1f57f7) {
  const _0x18388b = String(_0x1f57f7 ?? '')['trim']();
  if (!/^-?\d+$/['test'](_0x18388b)) return null;
  const _0x2b89e2 = Number(_0x18388b);
  if (!Number['isFinite'](_0x2b89e2)) return null;
  return Math['trunc'](_0x2b89e2);
}
function isComfyUiSeedInputName(_0x419603) {
  const _0x375d56 = String(_0x419603 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x375d56 === 'seed' || _0x375d56['endsWith']('_seed');
}
function getComfyUiBatchSeedContext(_0x12269d = {}) {
  const _0x5f2ed3 = Number['parseInt'](_0x12269d?.['__aicBatchSize'], 0xa),
    _0x222f2b = Number['parseInt'](_0x12269d?.['__aicBatchIndex'], 0xa);
  if (!Number['isFinite'](_0x5f2ed3) || _0x5f2ed3 <= 0x1) return null;
  if (!Number['isFinite'](_0x222f2b) || _0x222f2b < 0x0) return null;
  const _0x1cc951 = normalizeInteger(_0x12269d?.['__aicBatchSeedNonce']) || 0x0;
  return { batchIndex: _0x222f2b, nonce: _0x1cc951 };
}
function buildComfyUiBatchSeedValue(_0x189686, _0x1b8508) {
  const _0x5f54c9 = normalizeInteger(_0x189686);
  if (_0x5f54c9 === null) return _0x189686;
  const _0x19b956 = _0x1b8508['nonce'] + _0x1b8508['batchIndex'],
    _0x3c5a10 =
      (((_0x5f54c9 + _0x19b956) % COMFYUI_BATCH_SEED_MODULO) + COMFYUI_BATCH_SEED_MODULO) %
      COMFYUI_BATCH_SEED_MODULO;
  return typeof _0x189686 === 'string' ? String(_0x3c5a10) : _0x3c5a10;
}
function createComfyUiMappedSeedKey(_0x3f5c64, _0x460412) {
  return (
    String(_0x3f5c64 || '')['trim']() +
    '::' +
    String(_0x460412 || '')
      ['trim']()
      ['toLowerCase']()
  );
}
function getUserMappedComfyUiSeedInputs(_0x10535f = {}) {
  const _0x1ba231 = Array['isArray'](_0x10535f?.['inputs']) ? _0x10535f['inputs'] : [],
    _0x43481f = new Set();
  return (
    _0x1ba231['forEach']((_0x4bf817) => {
      const _0x4f3e8f = String(_0x4bf817?.['source'] || 'param')['trim'](),
        _0x24a60d = String(_0x4bf817?.['inputName'] || _0x4bf817?.['fieldName'] || '')['trim']();
      if (_0x4f3e8f !== 'param' || !isComfyUiSeedInputName(_0x24a60d)) return;
      _0x43481f['add'](createComfyUiMappedSeedKey(_0x4bf817?.['nodeId'], _0x24a60d));
    }),
    _0x43481f
  );
}
function isCustomComfyUiWorkflowExecution(_0x5dbb45, _0x3f2b5b) {
  return Boolean(_0x5dbb45?.['extensions']?.['comfyUiWorkflow'] || _0x3f2b5b?.['extensions']?.['comfyui']);
}
function relaxCustomWorkflowMediaInputMappings(_0x5c111a = null, { enabled: enabled = ![] } = {}) {
  if (!enabled || !_0x5c111a || typeof _0x5c111a !== 'object' || Array['isArray'](_0x5c111a))
    return _0x5c111a;
  const _0x364081 = Array['isArray'](_0x5c111a['inputs'])
    ? _0x5c111a['inputs']['map']((_0x27a66c) =>
        CUSTOM_WORKFLOW_MEDIA_INPUT_SOURCES['has'](String(_0x27a66c?.['source'] || '')['trim']())
          ? { ..._0x27a66c, required: ![] }
          : _0x27a66c,
      )
    : _0x5c111a['inputs'];
  return { ..._0x5c111a, inputs: _0x364081 };
}
function applyComfyUiBatchSeedOffset(_0x36f222, _0x346edc = {}, _0x5ad8d2 = {}) {
  const _0x568eae = getComfyUiBatchSeedContext(_0x346edc);
  if (!_0x568eae) return _0x36f222;
  const _0x3041cb = getUserMappedComfyUiSeedInputs(_0x5ad8d2);
  return (
    Object['entries'](_0x36f222 || {})['forEach'](([_0x196f40, _0x49397a]) => {
      const _0x5c2873 = _0x49397a?.['inputs'];
      if (!_0x5c2873 || typeof _0x5c2873 !== 'object' || Array['isArray'](_0x5c2873)) return;
      Object['entries'](_0x5c2873)['forEach'](([_0x578b22, _0x1d0d20]) => {
        if (!isComfyUiSeedInputName(_0x578b22)) return;
        if (_0x3041cb['has'](createComfyUiMappedSeedKey(_0x196f40, _0x578b22))) return;
        if (Array['isArray'](_0x1d0d20)) return;
        _0x5c2873[_0x578b22] = buildComfyUiBatchSeedValue(_0x1d0d20, _0x568eae);
      });
    }),
    _0x36f222
  );
}
function getProviderConfig(_0x3bb75b) {
  if (typeof _0x3bb75b?.['getProviderConfig'] !== 'function') return {};
  return _0x3bb75b['getProviderConfig']('comfyui') || {};
}
function normalizeBaseUrlMode(_0x1f559d) {
  const _0x5b137a = String(_0x1f559d?.['extensions']?.['comfyui']?.['baseUrlMode'] || '')
    ['trim']()
    ['toLowerCase']();
  return _0x5b137a === 'cloud' ? 'cloud' : 'local';
}
function resolveComfyUiBaseUrl(_0x563adf, _0x16e06a, _0x11295b) {
  const _0x1133e6 = getProviderConfig(_0x11295b),
    _0x535ce2 =
      _0x563adf?.['comfyuiBaseUrl'] ||
      _0x563adf?.['baseUrl'] ||
      _0x16e06a?.['extensions']?.['comfyui']?.['baseUrl'] ||
      _0x16e06a?.['extensions']?.['comfyui']?.['defaultBaseUrl'];
  if (_0x535ce2) return normalizeBaseUrl(_0x535ce2);
  if (normalizeBaseUrlMode(_0x16e06a) === 'cloud') {
    const _0x4983b1 = _0x1133e6['cloudApiUrl'] || _0x1133e6['cloudBaseUrl'] || '';
    if (!normalizeText(_0x4983b1))
      throw new Error('ComfyUI 云端地址未配置，请先在设置里填写云端 ComfyUI 地址');
    return normalizeBaseUrl(_0x4983b1);
  }
  return normalizeBaseUrl(_0x1133e6['apiUrl'] || _0x1133e6['baseUrl'] || DEFAULT_COMFYUI_BASE_URL);
}
function resolvePayloadValue(_0x331c2c, _0x3f6207 = [], _0x49b4ac = undefined, _0x57650e = ![]) {
  const _0x494dae = Array['isArray'](_0x3f6207) ? _0x3f6207 : [_0x3f6207];
  for (const _0xeca3df of _0x494dae['filter'](Boolean)) {
    const _0x374999 = getComfyUiPayloadPathValue(_0x331c2c, _0xeca3df);
    if (_0x57650e && _0x374999 !== undefined && _0x374999 !== null) return _0x374999;
    if (_0x374999 !== undefined && _0x374999 !== null && String(_0x374999)['trim']() !== '') return _0x374999;
  }
  return _0x49b4ac;
}
function getGenerationParamFallbackFields(_0x29e0fe = []) {
  return _0x29e0fe['filter'](
    (_0x2e44bd) => _0x2e44bd && !String(_0x2e44bd)['startsWith']('generationParams.'),
  )['map']((_0x8f385d) => 'generationParams.' + _0x8f385d);
}
function isComfyUiMediaUiInputName(_0x460075) {
  const _0x5e754f = String(_0x460075 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x5e754f === 'imageui' || _0x5e754f === 'videoui' || _0x5e754f === 'audioui';
}
function normalizeComfyUiSlotKey(_0xc731ec) {
  return String(_0xc731ec ?? '')['trim']();
}
function getComfyUiMediaInputSlotCandidates(_0x46b6f6 = {}) {
  const _0x46f57f = [
    _0x46b6f6?.['field'],
    _0x46b6f6?.['slot'],
    _0x46b6f6?.['urlField'],
    _0x46b6f6?.['inputName'],
    _0x46b6f6?.['fieldName'],
  ];
  return Array['from'](new Set(_0x46f57f['map'](normalizeComfyUiSlotKey)['filter'](Boolean)));
}
function getComfyUiMediaRefUrl(_0x3e8b51, _0x23235f = 'image') {
  if (typeof _0x3e8b51 === 'string') return normalizeText(_0x3e8b51);
  if (!_0x3e8b51 || typeof _0x3e8b51 !== 'object' || Array['isArray'](_0x3e8b51)) return '';
  const _0x2698bf = String(_0x23235f || 'image')
      ['trim']()
      ['toLowerCase'](),
    _0x302a49 =
      _0x2698bf === 'audio'
        ? _0x3e8b51['audioUrl'] || _0x3e8b51['audio']
        : _0x2698bf === 'video'
          ? _0x3e8b51['videoUrl'] || _0x3e8b51['video']
          : _0x3e8b51['imageUrl'] || _0x3e8b51['image'];
  return normalizeText(
    _0x3e8b51['url'] || _0x3e8b51['sourceUrl'] || _0x3e8b51['src'] || _0x3e8b51['value'] || _0x302a49,
  );
}
function getComfyUiMediaRefSlot(_0x4d66fa) {
  if (!_0x4d66fa || typeof _0x4d66fa !== 'object' || Array['isArray'](_0x4d66fa)) return '';
  return normalizeComfyUiSlotKey(
    _0x4d66fa['refSlot'] || _0x4d66fa['slot'] || _0x4d66fa['field'] || _0x4d66fa['id'] || _0x4d66fa['name'],
  );
}
function resolveComfyUiMediaValueFromRefs(_0x379a57 = {}, _0x18334d = {}, _0x4d4cd5 = 'image') {
  const _0x382719 = getComfyUiMediaInputSlotCandidates(_0x18334d),
    _0x293297 = new Set(_0x382719),
    _0x3d0d00 =
      _0x379a57?.['inputUrlsBySlot'] &&
      typeof _0x379a57['inputUrlsBySlot'] === 'object' &&
      !Array['isArray'](_0x379a57['inputUrlsBySlot'])
        ? _0x379a57['inputUrlsBySlot']
        : {};
  for (const _0x5cfae5 of _0x382719) {
    const _0xcf5ed7 = normalizeText(_0x3d0d00[_0x5cfae5]);
    if (_0xcf5ed7) return _0xcf5ed7;
  }
  const _0x3f9f58 = String(_0x4d4cd5 || 'image')
      ['trim']()
      ['toLowerCase'](),
    _0x35fbc0 = [
      _0x379a57?.[_0x3f9f58 + 'Refs'],
      _0x379a57?.[_0x3f9f58 + 's'],
      _0x379a57?.['mediaRefs'],
      _0x379a57?.['inputRefs'],
      _0x379a57?.['assetInputRefs'],
      _0x379a57?.['providerAssetRefs'],
    ]['filter'](Array['isArray']);
  for (const _0x5f0721 of _0x35fbc0) {
    for (const _0x50f2f3 of _0x5f0721) {
      const _0x382752 = getComfyUiMediaRefSlot(_0x50f2f3);
      if (!_0x293297['has'](_0x382752)) continue;
      const _0x4f210d = getComfyUiMediaRefUrl(_0x50f2f3, _0x3f9f58);
      if (_0x4f210d) return _0x4f210d;
    }
  }
  const _0x126bc1 = Math['max'](0x0, Number(_0x18334d?.['inputIndex']) || 0x0);
  for (const _0x1d62b5 of _0x35fbc0) {
    const _0x12202e = getComfyUiMediaRefUrl(_0x1d62b5[_0x126bc1], _0x3f9f58);
    if (_0x12202e) return _0x12202e;
  }
  if (Array['isArray'](_0x379a57?.['inputUrls'])) return normalizeText(_0x379a57['inputUrls'][_0x126bc1]);
  return '';
}
function omitComfyUiMediaUiInputMappings(_0x1a3302 = {}) {
  if (!_0x1a3302 || typeof _0x1a3302 !== 'object' || Array['isArray'](_0x1a3302)) return _0x1a3302;
  let _0x51e907 = _0x1a3302;
  if (Array['isArray'](_0x1a3302['inputs'])) {
    const _0x2d0f5f = _0x1a3302['inputs']['filter'](
      (_0x1357fc) => !isComfyUiMediaUiInputName(_0x1357fc?.['inputName'] || _0x1357fc?.['fieldName']),
    );
    if (_0x2d0f5f['length'] !== _0x1a3302['inputs']['length'])
      _0x51e907 = { ..._0x51e907, inputs: _0x2d0f5f };
  }
  if (Array['isArray'](_0x1a3302['nodeInputs'])) {
    const _0x4c0524 = _0x1a3302['nodeInputs']['filter'](
      (_0x21d813) => !isComfyUiMediaUiInputName(_0x21d813?.['inputName'] || _0x21d813?.['fieldName']),
    );
    _0x4c0524['length'] !== _0x1a3302['nodeInputs']['length'] &&
      (_0x51e907 = { ..._0x51e907, nodeInputs: _0x4c0524 });
  }
  return _0x51e907;
}
async function resolveComfyUiMediaInput(_0x2f8af0, _0x57f5ee, _0xca12ee, _0x21c1f7, _0x50c3a2) {
  if (isComfyUiMediaUiInputName(_0x57f5ee?.['inputName'] || _0x57f5ee?.['fieldName'])) return '';
  const _0x2cd6c9 = String(_0x57f5ee?.['field'] || _0x57f5ee?.['slot'] || _0x57f5ee?.['urlField'] || '')[
      'trim'
    ](),
    _0x14e6df = [_0x2cd6c9, ...(Array['isArray'](_0x57f5ee?.['fields']) ? _0x57f5ee['fields'] : [])][
      'filter'
    ](Boolean),
    _0x23e2a7 = [..._0x14e6df, ...getGenerationParamFallbackFields(_0x14e6df)];
  let _0x3efb70 = resolvePayloadValue(_0x2f8af0, _0x23e2a7, undefined, _0x57f5ee?.['allowEmpty'] === !![]);
  if (
    (_0x3efb70 === undefined || _0x3efb70 === null || String(_0x3efb70)['trim']() === '') &&
    Array['isArray'](_0x2f8af0?.['inputUrls']) &&
    _0xca12ee === 'image'
  ) {
    const _0x31ae1f = Math['max'](0x0, Number(_0x57f5ee?.['inputIndex']) || 0x0);
    _0x3efb70 = _0x2f8af0['inputUrls'][_0x31ae1f];
  }
  (_0x3efb70 === undefined || _0x3efb70 === null || String(_0x3efb70)['trim']() === '') &&
    (_0x3efb70 = resolveComfyUiMediaValueFromRefs(_0x2f8af0, _0x57f5ee, _0xca12ee));
  if (_0x3efb70 === undefined || _0x3efb70 === null || String(_0x3efb70)['trim']() === '') {
    if (_0x57f5ee?.['required'])
      throw new Error(_0x57f5ee['missingMessage'] || 'Missing ComfyUI ' + _0xca12ee + ' input');
    return '';
  }
  if (typeof _0x21c1f7?.['uploadInputToComfyUi'] === 'function')
    return _0x21c1f7['uploadInputToComfyUi'](_0x3efb70, {
      baseUrl: _0x50c3a2,
      kind: _0xca12ee,
      item: _0x57f5ee,
      payload: _0x2f8af0,
    });
  return String(_0x3efb70 || '')['trim']();
}
function normalizeComfyUiOutputType(_0x439b5f, _0xb5b9ef = '') {
  const _0x402acc = String(_0x439b5f || _0xb5b9ef || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x402acc['includes']('video') || _0x402acc === 'gifs' || _0x402acc === 'gif') return 'video';
  if (_0x402acc['includes']('audio')) return 'audio';
  return 'image';
}
function normalizeComfyUiFileItem(_0x3d8d3b, _0x269913, _0x326211) {
  if (!_0x3d8d3b || typeof _0x3d8d3b !== 'object' || Array['isArray'](_0x3d8d3b)) return null;
  const _0x333776 = normalizeText(_0x3d8d3b['filename'] || _0x3d8d3b['name'] || _0x3d8d3b['file']);
  if (!_0x333776) return null;
  return {
    nodeId: String(_0x326211 || ''),
    filename: _0x333776,
    subfolder: normalizeText(_0x3d8d3b['subfolder']),
    type: normalizeText(_0x3d8d3b['type'], 'output'),
    mediaType: normalizeComfyUiOutputType(_0x269913),
    format: normalizeText(_0x3d8d3b['format']),
  };
}
function getComfyUiHistorySnapshot(_0x22789b) {
  if (!_0x22789b || typeof _0x22789b !== 'object' || Array['isArray'](_0x22789b)) return null;
  if (_0x22789b['outputs'] && typeof _0x22789b['outputs'] === 'object') return _0x22789b;
  const _0x10afd9 = Object['values'](_0x22789b)['find'](
    (_0x2ccd0f) => _0x2ccd0f && typeof _0x2ccd0f === 'object' && _0x2ccd0f['outputs'],
  );
  return _0x10afd9 || null;
}
function getComfyUiNodeErrors(_0x511cba) {
  if (!_0x511cba || typeof _0x511cba !== 'object' || Array['isArray'](_0x511cba)) return null;
  if (
    _0x511cba['node_errors'] &&
    typeof _0x511cba['node_errors'] === 'object' &&
    Object['keys'](_0x511cba['node_errors'])['length'] > 0x0
  )
    return _0x511cba['node_errors'];
  if (
    _0x511cba['nodeErrors'] &&
    typeof _0x511cba['nodeErrors'] === 'object' &&
    Object['keys'](_0x511cba['nodeErrors'])['length'] > 0x0
  )
    return _0x511cba['nodeErrors'];
  if (
    _0x511cba['error']?.['node_errors'] &&
    typeof _0x511cba['error']['node_errors'] === 'object' &&
    Object['keys'](_0x511cba['error']['node_errors'])['length'] > 0x0
  )
    return _0x511cba['error']['node_errors'];
  if (
    _0x511cba['error']?.['nodeErrors'] &&
    typeof _0x511cba['error']['nodeErrors'] === 'object' &&
    Object['keys'](_0x511cba['error']['nodeErrors'])['length'] > 0x0
  )
    return _0x511cba['error']['nodeErrors'];
  return null;
}
function normalizeComfyUiStatusText(_0x3c9a6b) {
  if (_0x3c9a6b && typeof _0x3c9a6b === 'object' && !Array['isArray'](_0x3c9a6b))
    return normalizeText(
      _0x3c9a6b['status_str'] ||
        _0x3c9a6b['status'] ||
        _0x3c9a6b['state'] ||
        _0x3c9a6b['phase'] ||
        _0x3c9a6b['message'] ||
        _0x3c9a6b['type'],
    )['toLowerCase']();
  return normalizeText(_0x3c9a6b)['toLowerCase']();
}
function isComfyUiFailureStatus(_0x142327) {
  const _0x4cc1d5 = normalizeComfyUiStatusText(_0x142327);
  return /failed|failure|error|exception|cancelled|canceled/['test'](_0x4cc1d5);
}
function hasComfyUiErrorShape(_0x492f6e) {
  if (!_0x492f6e || typeof _0x492f6e !== 'object' || Array['isArray'](_0x492f6e)) return ![];
  return Boolean(
    _0x492f6e['error'] || getComfyUiNodeErrors(_0x492f6e) || isComfyUiFailureStatus(_0x492f6e['status']),
  );
}
function getComfyUiHistoryErrorSnapshot(_0x2d0ec9) {
  if (!_0x2d0ec9 || typeof _0x2d0ec9 !== 'object' || Array['isArray'](_0x2d0ec9)) return null;
  if (hasComfyUiErrorShape(_0x2d0ec9)) return _0x2d0ec9;
  return (
    Object['values'](_0x2d0ec9)['find'](
      (_0x17521e) =>
        _0x17521e &&
        typeof _0x17521e === 'object' &&
        !Array['isArray'](_0x17521e) &&
        hasComfyUiErrorShape(_0x17521e),
    ) || null
  );
}
function getComfyUiFailureMessage(_0x3caf69) {
  const _0x144227 = _0x3caf69?.['status'];
  return normalizeText(
    _0x3caf69?.['error']?.['message'] ||
      _0x3caf69?.['errorMessage'] ||
      _0x3caf69?.['error_message'] ||
      _0x3caf69?.['message'] ||
      _0x144227?.['message'] ||
      _0x144227?.['status_str'] ||
      _0x3caf69?.['error']?.['type'] ||
      'ComfyUI task failed',
  );
}
export function buildComfyUiViewUrl(_0x4d6ea5, _0x1e9302, _0x5f164a = {}) {
  const _0x19cf2c = normalizeBaseUrl(_0x4d6ea5),
    _0x338854 = _0x5f164a['allowCloudBaseUrl'] ?? shouldAllowCloudComfyUiBaseUrl(_0x19cf2c),
    _0x22d3b0 = new URLSearchParams();
  (_0x22d3b0['set']('baseUrl', _0x19cf2c),
    _0x22d3b0['set']('filename', _0x1e9302['filename']),
    _0x22d3b0['set']('type', _0x1e9302['type'] || 'output'));
  if (_0x1e9302['subfolder']) _0x22d3b0['set']('subfolder', _0x1e9302['subfolder']);
  if (_0x338854) _0x22d3b0['set']('allowCloudBaseUrl', '1');
  return '/api/v2/comfyui/view?' + _0x22d3b0['toString']();
}
export function collectComfyUiOutputFiles(_0x10582e, _0x4c2c46 = {}) {
  const _0x4d874b = getComfyUiHistorySnapshot(_0x10582e),
    _0xd69df8 = _0x4d874b?.['outputs'];
  if (!_0xd69df8 || typeof _0xd69df8 !== 'object' || Array['isArray'](_0xd69df8)) return [];
  const _0x4aa65c = new Set(
      Array['isArray'](_0x4c2c46['outputNodes'])
        ? _0x4c2c46['outputNodes']['map']((_0x23fd9d) => String(_0x23fd9d))
        : [],
    ),
    _0x3cadbb = [];
  return (
    Object['entries'](_0xd69df8)['forEach'](([_0x17170e, _0x49f14d]) => {
      if (_0x4aa65c['size'] > 0x0 && !_0x4aa65c['has'](String(_0x17170e))) return;
      if (!_0x49f14d || typeof _0x49f14d !== 'object' || Array['isArray'](_0x49f14d)) return;
      Object['entries'](_0x49f14d)['forEach'](([_0x28365c, _0x1852fb]) => {
        const _0x29342e = Array['isArray'](_0x1852fb) ? _0x1852fb : [];
        _0x29342e['forEach']((_0x228a78) => {
          const _0x46bfbe = normalizeComfyUiFileItem(_0x228a78, _0x28365c, _0x17170e);
          if (_0x46bfbe) _0x3cadbb['push'](_0x46bfbe);
        });
      });
    }),
    _0x3cadbb
  );
}
export function normalizeComfyUiHistoryResult(
  _0xb86a5b,
  {
    baseUrl: baseUrl = DEFAULT_COMFYUI_BASE_URL,
    resultConfig: resultConfig = {},
    allowCloudBaseUrl: allowCloudBaseUrl = undefined,
  } = {},
) {
  const _0x1dc1b1 = collectComfyUiOutputFiles(_0xb86a5b, resultConfig);
  if (_0x1dc1b1['length'] === 0x0) {
    const _0x48d695 = getComfyUiHistoryErrorSnapshot(_0xb86a5b);
    if (_0x48d695) {
      const _0x349398 = getComfyUiNodeErrors(_0x48d695),
        _0x39db6a = getComfyUiFailureMessage(_0x48d695);
      return {
        status: 'FAILED',
        error: _0x48d695['error'] || _0x39db6a,
        message: _0x39db6a,
        ...(_0x349398 ? { node_errors: _0x349398, nodeErrors: _0x349398 } : {}),
        raw: _0x48d695,
        images: [],
        videos: [],
        audios: [],
        results: [],
      };
    }
    return { status: 'RUNNING', images: [], videos: [], audios: [], results: [] };
  }
  const _0x4bc184 = _0x1dc1b1['map']((_0x51c268) => ({
      ..._0x51c268,
      url: buildComfyUiViewUrl(baseUrl, _0x51c268, { allowCloudBaseUrl: allowCloudBaseUrl }),
    })),
    _0x46d38e = _0x4bc184['filter']((_0x46d3ad) => _0x46d3ad['mediaType'] === 'image'),
    _0x5783e8 = _0x4bc184['filter']((_0x5e6095) => _0x5e6095['mediaType'] === 'video'),
    _0x5f1574 = _0x4bc184['filter']((_0x4de675) => _0x4de675['mediaType'] === 'audio');
  return {
    status: 'COMPLETED',
    images: _0x46d38e,
    image_urls: _0x46d38e['map']((_0x5a10a3) => _0x5a10a3['url']),
    videos: _0x5783e8,
    video_urls: _0x5783e8['map']((_0x1fe3ce) => _0x1fe3ce['url']),
    audios: _0x5f1574,
    audio_urls: _0x5f1574['map']((_0x1f82c9) => _0x1f82c9['url']),
    results: _0x4bc184['map']((_0x18f66c) => ({
      url: _0x18f66c['url'],
      imageUrl: _0x18f66c['mediaType'] === 'image' ? _0x18f66c['url'] : undefined,
      videoUrl: _0x18f66c['mediaType'] === 'video' ? _0x18f66c['url'] : undefined,
      audioUrl: _0x18f66c['mediaType'] === 'audio' ? _0x18f66c['url'] : undefined,
      nodeId: _0x18f66c['nodeId'],
      filename: _0x18f66c['filename'],
      type: _0x18f66c['mediaType'],
    })),
  };
}
async function buildComfyUiWorkflowRequest({
  payload: _0x273fa3,
  finalPrompt: _0x547c08,
  ctx: _0x1439fd,
  expectedKind: _0x60cda4,
}) {
  const _0x3c5a02 = resolveModelExecution(_0x273fa3?.['model'], { providerHint: 'comfyui' }),
    _0x3542ce = _0x3c5a02?.['executionManifest'];
  if (!_0x3542ce || _0x3542ce['provider'] !== 'comfyui' || _0x3542ce['adapterType'] !== 'workflow')
    throw new Error('ComfyUI\x20workflow\x20manifest\x20missing:\x20' + (_0x273fa3?.['model'] || ''));
  if (_0x60cda4 && _0x3542ce['kind'] !== _0x60cda4)
    throw new Error('ComfyUI ' + _0x60cda4 + ' workflow manifest missing: ' + (_0x273fa3?.['model'] || ''));
  const _0x255163 = resolveComfyUiBaseUrl(_0x273fa3, _0x3542ce, _0x1439fd),
    _0x3a0302 = shouldAllowCloudComfyUiBaseUrl(_0x255163),
    _0x47a35a = omitComfyUiMediaUiInputMappings(
      relaxCustomWorkflowMediaInputMappings(_0x3542ce['mapping'], {
        enabled: isCustomComfyUiWorkflowExecution(_0x3c5a02?.['modelManifest'], _0x3542ce),
      }),
    ),
    _0x87159f = await buildComfyUiPromptFromManifest({
      mapping: _0x47a35a,
      payload: _0x273fa3,
      finalPrompt: _0x547c08,
      sourceResolvers: {
        imageInput: ({ item: _0x30b8e9 }) =>
          resolveComfyUiMediaInput(_0x273fa3, _0x30b8e9, 'image', _0x1439fd, _0x255163),
        videoInput: ({ item: _0x10c942 }) =>
          resolveComfyUiMediaInput(_0x273fa3, _0x10c942, 'video', _0x1439fd, _0x255163),
        audioInput: ({ item: _0x37e601 }) =>
          resolveComfyUiMediaInput(_0x273fa3, _0x37e601, 'audio', _0x1439fd, _0x255163),
      },
    });
  applyComfyUiBatchSeedOffset(_0x87159f, _0x273fa3, _0x47a35a);
  const _0x1fe653 = normalizeText(_0x273fa3?.['comfyuiClientId'], createClientId()),
    _0xc16082 = _0x3542ce['result'] || {};
  return {
    url: '/api/v2/comfyui/prompt',
    headers: { 'Content-Type': 'application/json' },
    body: {
      baseUrl: _0x255163,
      prompt: _0x87159f,
      clientId: _0x1fe653,
      ...(_0x3a0302 ? { allowCloudBaseUrl: !![] } : {}),
    },
    isAsync: !![],
    taskIdPath: _0xc16082['taskIdPath'] || 'prompt_id',
    responseMapping: {
      taskIdPath: _0xc16082['taskIdPath'] || 'prompt_id',
      resultPaths: _0xc16082['resultPaths'] || ['images[].url', 'image_urls[]', 'results[].url'],
      statusPath: 'status',
    },
    taskPolling: {
      mode: 'comfyui-history',
      baseUrl: _0x255163,
      allowCloudBaseUrl: _0x3a0302,
      statusPath: 'status',
      resultPaths: _0xc16082['resultPaths'] || ['images[].url', 'image_urls[]', 'results[].url'],
    },
    adapterTrace: {
      source: 'manifest',
      executionId: _0x3542ce['id'],
      modelId: _0x273fa3['model'],
      provider: 'comfyui',
    },
    resultExtractor: (_0x2c37e1) =>
      normalizeComfyUiHistoryResult(_0x2c37e1, {
        baseUrl: _0x255163,
        resultConfig: _0xc16082,
        allowCloudBaseUrl: _0x3a0302,
      }),
  };
}
export async function buildImageRequest(_0x532c33, _0x3476e6, _0x376b40 = {}) {
  return buildComfyUiWorkflowRequest({
    payload: _0x532c33,
    finalPrompt: _0x3476e6,
    ctx: _0x376b40,
    expectedKind: 'image',
  });
}
export async function buildVideoRequest(_0x38abd4, _0x3b4199, _0x5a1a67 = {}) {
  return buildComfyUiWorkflowRequest({
    payload: _0x38abd4,
    finalPrompt: _0x3b4199,
    ctx: _0x5a1a67,
    expectedKind: 'video',
  });
}
export async function buildAudioRequest(_0x5c621a, _0x586114, _0x25f282 = {}) {
  return buildComfyUiWorkflowRequest({
    payload: _0x5c621a,
    finalPrompt: _0x586114,
    ctx: _0x25f282,
    expectedKind: 'audio',
  });
}
