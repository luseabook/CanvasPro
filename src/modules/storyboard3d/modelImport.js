const MODEL_FORMATS = Object['freeze']({
  glb: Object['freeze']({
    extension: 'glb',
    mimeTypes: ['model/gltf-binary', 'application/octet-stream'],
    parserId: 'gltf',
  }),
  gltf: Object['freeze']({
    extension: 'gltf',
    mimeTypes: ['model/gltf+json', 'application/json'],
    parserId: 'gltf',
  }),
  fbx: Object['freeze']({ extension: 'fbx', mimeTypes: ['application/octet-stream'], parserId: 'fbx' }),
  obj: Object['freeze']({
    extension: 'obj',
    mimeTypes: ['text/plain', 'application/octet-stream'],
    parserId: 'obj',
  }),
  stl: Object['freeze']({
    extension: 'stl',
    mimeTypes: ['model/stl', 'application/sla', 'application/octet-stream'],
    parserId: 'stl',
  }),
});
export {
  STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES,
  getStoryboard3DModelImportCapability,
} from './gltfImportAdapter.js';
export const STORYBOARD_3D_MODEL_FORMATS = Object['freeze'](Object['keys'](MODEL_FORMATS));
export const STORYBOARD_3D_MODEL_ACCEPT = '.glb,.gltf,.fbx,.obj,.stl';
export const DEFAULT_MODEL_IMPORT_MAX_BYTES = 0x100 * 0x400 * 0x400;
function extensionOf(_0x25e692) {
  const _0xe530b1 = String(_0x25e692 || '')
    ['trim']()
    ['toLowerCase']()
    ['match'](/\.([a-z0-9]+)$/);
  return _0xe530b1?.[0x1] || '';
}
export function detectStoryboard3DModelFormat(_0x205177) {
  const _0x504e6e = extensionOf(_0x205177?.['name'] || _0x205177?.['fileName']);
  if (MODEL_FORMATS[_0x504e6e]) return _0x504e6e;
  const _0xcd595a = String(_0x205177?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x1d1db7 = Object['entries'](MODEL_FORMATS)['filter'](([, _0x45df5b]) =>
      _0x45df5b['mimeTypes']['includes'](_0xcd595a),
    );
  return _0x1d1db7['length'] === 0x1 ? _0x1d1db7[0x0][0x0] : '';
}
export function validateStoryboard3DModelSource(
  _0x5c7eac,
  { maxBytes: maxBytes = DEFAULT_MODEL_IMPORT_MAX_BYTES } = {},
) {
  const _0x204580 = [],
    _0x40381b = String(_0x5c7eac?.['name'] || '')['trim'](),
    _0x2868c7 = Number(_0x5c7eac?.['size']),
    _0x9268b9 = detectStoryboard3DModelFormat(_0x5c7eac);
  if (!_0x40381b) _0x204580['push']({ code: 'MODEL_FILE_NAME_REQUIRED', message: '模型文件缺少名称。' });
  if (!_0x9268b9)
    _0x204580['push']({ code: 'MODEL_FORMAT_UNSUPPORTED', message: '仅支持 GLB、GLTF、FBX、OBJ 和 STL。' });
  if (!Number['isFinite'](_0x2868c7) || _0x2868c7 <= 0x0)
    _0x204580['push']({ code: 'MODEL_FILE_EMPTY', message: '模型文件为空。' });
  return (
    Number['isFinite'](_0x2868c7) &&
      _0x2868c7 > maxBytes &&
      _0x204580['push']({
        code: 'MODEL_FILE_TOO_LARGE',
        message: '模型文件不能超过 ' + Math['round'](maxBytes / 0x400 / 0x400) + '\x20MB。',
      }),
    typeof _0x5c7eac?.['arrayBuffer'] !== 'function' &&
      _0x204580['push']({ code: 'MODEL_FILE_UNREADABLE', message: '当前文件对象不可读取。' }),
    { ok: _0x204580['length'] === 0x0, format: _0x9268b9, errors: _0x204580 }
  );
}
function ascii(_0x4ca149, _0x586af4 = 0x0, _0x54c049 = _0x4ca149['length']) {
  return new TextDecoder('utf-8', { fatal: ![] })['decode'](_0x4ca149['subarray'](_0x586af4, _0x54c049));
}
function inspectGlb(_0x4afe2a) {
  if (_0x4afe2a['byteLength'] < 0x14) return ![];
  const _0x1431b7 = new DataView(_0x4afe2a['buffer'], _0x4afe2a['byteOffset'], _0x4afe2a['byteLength']),
    _0x4b378a = _0x1431b7['getUint32'](0x8, !![]),
    _0xda25da = _0x1431b7['getUint32'](0xc, !![]);
  if (
    _0x1431b7['getUint32'](0x0, !![]) !== 0x46546c67 ||
    _0x1431b7['getUint32'](0x4, !![]) !== 0x2 ||
    _0x4b378a !== _0x4afe2a['byteLength'] ||
    _0x1431b7['getUint32'](0x10, !![]) !== 0x4e4f534a ||
    0x14 + _0xda25da > _0x4afe2a['byteLength']
  )
    return ![];
  try {
    const _0x4b9505 = JSON['parse'](ascii(_0x4afe2a, 0x14, 0x14 + _0xda25da)['trim']());
    return String(_0x4b9505?.['asset']?.['version'] || '')['startsWith']('2');
  } catch {
    return ![];
  }
}
function inspectGltf(_0x20ac1f) {
  try {
    const _0x319bc6 = JSON['parse'](ascii(_0x20ac1f));
    return String(_0x319bc6?.['asset']?.['version'] || '')['startsWith']('2');
  } catch {
    return ![];
  }
}
function inspectObj(_0x5c4d83) {
  const _0x1e1ff0 = ascii(_0x5c4d83, 0x0, Math['min'](_0x5c4d83['length'], 0x2 * 0x400 * 0x400));
  return /^\s*v\s+[-+\d.]/m['test'](_0x1e1ff0) && /^\s*f\s+\S+/m['test'](_0x1e1ff0);
}
function inspectFbx(_0xadd8e4) {
  const _0x3f4546 = ascii(_0xadd8e4, 0x0, Math['min'](_0xadd8e4['length'], 0x400));
  return _0x3f4546['startsWith']('Kaydara FBX Binary') || _0x3f4546['includes']('FBXHeaderExtension');
}
function inspectStl(_0x1970de) {
  if (_0x1970de['byteLength'] >= 0x54) {
    const _0x2e3403 = new DataView(_0x1970de['buffer'], _0x1970de['byteOffset'], _0x1970de['byteLength']),
      _0x5a3fe9 = _0x2e3403['getUint32'](0x50, !![]);
    if (0x54 + _0x5a3fe9 * 0x32 === _0x1970de['byteLength']) return !![];
  }
  const _0x35d5b0 = ascii(_0x1970de, 0x0, Math['min'](_0x1970de['length'], 0x1000));
  return /^\s*solid\b/i['test'](_0x35d5b0) && /\bfacet\s+normal\b/i['test'](_0x35d5b0);
}
export async function inspectStoryboard3DModelFile(_0x290b0c, _0x237eac = {}) {
  const _0x6a4d0 = validateStoryboard3DModelSource(_0x290b0c, _0x237eac);
  if (!_0x6a4d0['ok']) return _0x6a4d0;
  const _0x33add7 = new Uint8Array(await _0x290b0c['arrayBuffer']()),
    _0x2a7d89 = { glb: inspectGlb, gltf: inspectGltf, obj: inspectObj, fbx: inspectFbx, stl: inspectStl },
    _0x1892b9 = _0x2a7d89[_0x6a4d0['format']](_0x33add7);
  if (!_0x1892b9)
    return {
      ok: ![],
      format: _0x6a4d0['format'],
      errors: [
        {
          code: 'MODEL_CONTENT_INVALID',
          message: '文件内容不是有效的 ' + _0x6a4d0['format']['toUpperCase']() + ' 模型。',
        },
      ],
    };
  return {
    ok: !![],
    format: _0x6a4d0['format'],
    byteLength: _0x33add7['byteLength'],
    parserId: MODEL_FORMATS[_0x6a4d0['format']]['parserId'],
    errors: [],
  };
}
function finiteBounds(_0x348e87) {
  return [
    _0x348e87?.['min']?.['x'],
    _0x348e87?.['min']?.['y'],
    _0x348e87?.['min']?.['z'],
    _0x348e87?.['max']?.['x'],
    _0x348e87?.['max']?.['y'],
    _0x348e87?.['max']?.['z'],
  ]['every']((_0x3c2cda) => Number['isFinite'](Number(_0x3c2cda)));
}
export const STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY = 'storyboard3dNormalization';
export function setStoryboard3DModelNormalization(_0x3fec82, _0x3257da) {
  if (!_0x3fec82 || typeof _0x3fec82 !== 'object') return _0x3fec82;
  _0x3fec82['userData'] =
    _0x3fec82['userData'] && typeof _0x3fec82['userData'] === 'object' ? _0x3fec82['userData'] : {};
  if (_0x3257da?.['status'] !== 'ready')
    return (delete _0x3fec82['userData'][STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY], _0x3fec82);
  return (
    (_0x3fec82['userData'][STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY] = {
      status: 'ready',
      uniformScale: Math['max'](0.000001, Number(_0x3257da['uniformScale']) || 0x1),
      translation: {
        x: Number(_0x3257da['translation']?.['x']) || 0x0,
        y: Number(_0x3257da['translation']?.['y']) || 0x0,
        z: Number(_0x3257da['translation']?.['z']) || 0x0,
      },
    }),
    _0x3fec82
  );
}
export function readStoryboard3DModelNormalization(_0x219711) {
  const _0x5e1c75 = _0x219711?.['userData']?.[STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY];
  if (_0x5e1c75?.['status'] !== 'ready') return null;
  return {
    status: 'ready',
    uniformScale: Math['max'](0.000001, Number(_0x5e1c75['uniformScale']) || 0x1),
    translation: {
      x: Number(_0x5e1c75['translation']?.['x']) || 0x0,
      y: Number(_0x5e1c75['translation']?.['y']) || 0x0,
      z: Number(_0x5e1c75['translation']?.['z']) || 0x0,
    },
  };
}
export function createStoryboard3DModelNormalizationPlan(_0x271c4c, { targetSize: targetSize = 0x2 } = {}) {
  if (!finiteBounds(_0x271c4c))
    return {
      status: 'awaiting-bounds',
      targetSize: Math['max'](0.1, Number(targetSize) || 0x2),
      operations: ['measure-bounds', 'uniform-scale', 'center-xz', 'place-on-ground'],
    };
  const _0x511095 = {
      x: Number(_0x271c4c['min']['x']),
      y: Number(_0x271c4c['min']['y']),
      z: Number(_0x271c4c['min']['z']),
    },
    _0x429e8c = {
      x: Number(_0x271c4c['max']['x']),
      y: Number(_0x271c4c['max']['y']),
      z: Number(_0x271c4c['max']['z']),
    },
    _0x2a8b10 = {
      x: Math['max'](0x0, _0x429e8c['x'] - _0x511095['x']),
      y: Math['max'](0x0, _0x429e8c['y'] - _0x511095['y']),
      z: Math['max'](0x0, _0x429e8c['z'] - _0x511095['z']),
    },
    _0x5982b5 = Math['max'](_0x2a8b10['x'], _0x2a8b10['y'], _0x2a8b10['z']);
  if (_0x5982b5 <= 1e-8) throw new Error('Model\x20bounds\x20have\x20no\x20measurable\x20size.');
  const _0x4d1fbb = Math['max'](0.1, Number(targetSize) || 0x2) / _0x5982b5;
  return {
    status: 'ready',
    targetSize: Math['max'](0.1, Number(targetSize) || 0x2),
    uniformScale: _0x4d1fbb,
    translation: {
      x: -((_0x511095['x'] + _0x429e8c['x']) / 0x2) * _0x4d1fbb || 0x0,
      y: -_0x511095['y'] * _0x4d1fbb || 0x0,
      z: -((_0x511095['z'] + _0x429e8c['z']) / 0x2) * _0x4d1fbb || 0x0,
    },
    sourceBounds: { min: _0x511095, max: _0x429e8c, size: _0x2a8b10 },
    operations: ['uniform-scale', 'center-xz', 'place-on-ground'],
  };
}
export async function importStoryboard3DModelFile(
  _0x1d8c48,
  {
    parsers: parsers = {},
    relatedFiles: relatedFiles = [],
    targetSize: targetSize = 0x2,
    maxBytes: maxBytes = DEFAULT_MODEL_IMPORT_MAX_BYTES,
    signal: _0x5c60d9,
    onProgress: _0x44104a,
  } = {},
) {
  const _0x379686 = await inspectStoryboard3DModelFile(_0x1d8c48, { maxBytes: maxBytes });
  if (!_0x379686['ok']) {
    const _0x3fa1f9 = new Error(
      _0x379686['errors']['map']((_0x34b4d2) => _0x34b4d2['message'])['join']('\x20'),
    );
    ((_0x3fa1f9['code'] = _0x379686['errors'][0x0]?.['code'] || 'MODEL_IMPORT_INVALID'),
      (_0x3fa1f9['details'] = _0x379686));
    throw _0x3fa1f9;
  }
  const _0x41c2d7 = parsers[_0x379686['parserId']] || parsers[_0x379686['format']];
  if (typeof _0x41c2d7 !== 'function') {
    const _0x5ae7e6 = new Error('缺少 ' + _0x379686['format']['toUpperCase']() + '\x20模型解析器。');
    ((_0x5ae7e6['code'] = 'MODEL_PARSER_UNAVAILABLE'), (_0x5ae7e6['format'] = _0x379686['format']));
    throw _0x5ae7e6;
  }
  const _0x206ddf = createStoryboard3DModelResourceMap([_0x1d8c48, ...relatedFiles]),
    _0xf546de = await _0x41c2d7(_0x1d8c48, {
      format: _0x379686['format'],
      resources: _0x206ddf,
      signal: _0x5c60d9,
      onProgress: _0x44104a,
      onWorkerProgress: _0x44104a,
    }),
    _0x332732 = createStoryboard3DModelNormalizationPlan(_0xf546de?.['bounds'], { targetSize: targetSize });
  return { format: _0x379686['format'], parsed: _0xf546de, normalization: _0x332732 };
}
export function createStoryboard3DModelResourceMap(_0x31a330 = []) {
  const _0x2b1c24 = new Map();
  for (const _0x19c0df of _0x31a330) {
    const _0x1a4eb1 = String(_0x19c0df?.['webkitRelativePath'] || _0x19c0df?.['name'] || '')['replaceAll'](
        '\x5c',
        '/',
      ),
      _0x27f01f = _0x1a4eb1['split']('/')
        ['filter']((_0x12f787) => _0x12f787 && _0x12f787 !== '.' && _0x12f787 !== '..')
        ['join']('/');
    if (!_0x27f01f) continue;
    (_0x2b1c24['set'](_0x27f01f, _0x19c0df),
      _0x2b1c24['set'](_0x27f01f['split']('/')['at'](-0x1), _0x19c0df));
  }
  return _0x2b1c24;
}
export function pickStoryboard3DModelFiles({
  documentObject: documentObject = globalThis['document'],
  multiple: multiple = ![],
} = {}) {
  if (!documentObject?.['createElement']) return Promise['reject'](new Error('File picker is unavailable.'));
  return new Promise((_0x141a3a) => {
    const _0x2cb755 = documentObject['createElement']('input');
    ((_0x2cb755['type'] = 'file'),
      (_0x2cb755['accept'] = STORYBOARD_3D_MODEL_ACCEPT),
      (_0x2cb755['multiple'] = multiple === !![]),
      _0x2cb755['addEventListener']('change', () => _0x141a3a([...(_0x2cb755['files'] || [])]), {
        once: !![],
      }),
      _0x2cb755['addEventListener']('cancel', () => _0x141a3a([]), { once: !![] }),
      _0x2cb755['click']());
  });
}
