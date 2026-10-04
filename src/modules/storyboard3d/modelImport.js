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
function extensionOf(value) {
  const item = String(value || '')
    ['trim']()
    ['toLowerCase']()
    ['match'](/\.([a-z0-9]+)$/);
  return item?.[0x1] || '';
}
export function detectStoryboard3DModelFormat(error) {
  const extensionOf2 = extensionOf(error?.['name'] || error?.['fileName']);
  if (MODEL_FORMATS[extensionOf2]) return extensionOf2;
  const key = String(error?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    list = Object['entries'](MODEL_FORMATS)['filter'](([, index]) => index['mimeTypes']['includes'](key));
  return list['length'] === 0x1 ? list[0x0][0x0] : '';
}
export function validateStoryboard3DModelSource(
  error2,
  { maxBytes: maxBytes = DEFAULT_MODEL_IMPORT_MAX_BYTES } = {},
) {
  const ok = [],
    enabled = String(error2?.['name'] || '')['trim'](),
    count = Number(error2?.['size']),
    format = detectStoryboard3DModelFormat(error2);
  if (!enabled) ok['push']({ code: 'MODEL_FILE_NAME_REQUIRED', message: '模型文件缺少名称。' });
  if (!format)
    ok['push']({ code: 'MODEL_FORMAT_UNSUPPORTED', message: '仅支持 GLB、GLTF、FBX、OBJ 和 STL。' });
  if (!Number['isFinite'](count) || count <= 0x0)
    ok['push']({ code: 'MODEL_FILE_EMPTY', message: '模型文件为空。' });
  return (
    Number['isFinite'](count) &&
      count > maxBytes &&
      ok['push']({
        code: 'MODEL_FILE_TOO_LARGE',
        message: '模型文件不能超过 ' + Math['round'](maxBytes / 0x400 / 0x400) + '\x20MB。',
      }),
    typeof error2?.['arrayBuffer'] !== 'function' &&
      ok['push']({ code: 'MODEL_FILE_UNREADABLE', message: '当前文件对象不可读取。' }),
    { ok: ok['length'] === 0x0, format: format, errors: ok }
  );
}
function ascii(list2, result = 0x0, data = list2['length']) {
  return new TextDecoder('utf-8', { fatal: ![] })['decode'](list2['subarray'](result, data));
}
function inspectGlb(options) {
  if (options['byteLength'] < 0x14) return ![];
  const dataView = new DataView(options['buffer'], options['byteOffset'], options['byteLength']),
    target = dataView['getUint32'](0x8, !![]),
    source = dataView['getUint32'](0xc, !![]);
  if (
    dataView['getUint32'](0x0, !![]) !== 0x46546c67 ||
    dataView['getUint32'](0x4, !![]) !== 0x2 ||
    target !== options['byteLength'] ||
    dataView['getUint32'](0x10, !![]) !== 0x4e4f534a ||
    0x14 + source > options['byteLength']
  )
    return ![];
  try {
    const next = JSON['parse'](ascii(options, 0x14, 0x14 + source)['trim']());
    return String(next?.['asset']?.['version'] || '')['startsWith']('2');
  } catch {
    return ![];
  }
}
function inspectGltf(current) {
  try {
    const entry = JSON['parse'](ascii(current));
    return String(entry?.['asset']?.['version'] || '')['startsWith']('2');
  } catch {
    return ![];
  }
}
function inspectObj(list3) {
  const ascii2 = ascii(list3, 0x0, Math['min'](list3['length'], 0x2 * 0x400 * 0x400));
  return /^\s*v\s+[-+\d.]/m['test'](ascii2) && /^\s*f\s+\S+/m['test'](ascii2);
}
function inspectFbx(list4) {
  const list5 = ascii(list4, 0x0, Math['min'](list4['length'], 0x400));
  return list5['startsWith']('Kaydara FBX Binary') || list5['includes']('FBXHeaderExtension');
}
function inspectStl(list6) {
  if (list6['byteLength'] >= 0x54) {
    const dataView2 = new DataView(list6['buffer'], list6['byteOffset'], list6['byteLength']),
      record = dataView2['getUint32'](0x50, !![]);
    if (0x54 + record * 0x32 === list6['byteLength']) return !![];
  }
  const ascii3 = ascii(list6, 0x0, Math['min'](list6['length'], 0x1000));
  return /^\s*solid\b/i['test'](ascii3) && /\bfacet\s+normal\b/i['test'](ascii3);
}
export async function inspectStoryboard3DModelFile(payload, handle = {}) {
  const format2 = validateStoryboard3DModelSource(payload, handle);
  if (!format2['ok']) return format2;
  const byteLength = new Uint8Array(await payload['arrayBuffer']()),
    state = { glb: inspectGlb, gltf: inspectGltf, obj: inspectObj, fbx: inspectFbx, stl: inspectStl },
    enabled2 = state[format2['format']](byteLength);
  if (!enabled2)
    return {
      ok: ![],
      format: format2['format'],
      errors: [
        {
          code: 'MODEL_CONTENT_INVALID',
          message: '文件内容不是有效的 ' + format2['format']['toUpperCase']() + ' 模型。',
        },
      ],
    };
  return {
    ok: !![],
    format: format2['format'],
    byteLength: byteLength['byteLength'],
    parserId: MODEL_FORMATS[format2['format']]['parserId'],
    errors: [],
  };
}
function finiteBounds(config) {
  return [
    config?.['min']?.['x'],
    config?.['min']?.['y'],
    config?.['min']?.['z'],
    config?.['max']?.['x'],
    config?.['max']?.['y'],
    config?.['max']?.['z'],
  ]['every']((scope) => Number['isFinite'](Number(scope)));
}
export const STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY = 'storyboard3dNormalization';
export function setStoryboard3DModelNormalization(enabled3, response) {
  if (!enabled3 || typeof enabled3 !== 'object') return enabled3;
  enabled3['userData'] =
    enabled3['userData'] && typeof enabled3['userData'] === 'object' ? enabled3['userData'] : {};
  if (response?.['status'] !== 'ready')
    return (delete enabled3['userData'][STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY], enabled3);
  return (
    (enabled3['userData'][STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY] = {
      status: 'ready',
      uniformScale: Math['max'](0.000001, Number(response['uniformScale']) || 0x1),
      translation: {
        x: Number(response['translation']?.['x']) || 0x0,
        y: Number(response['translation']?.['y']) || 0x0,
        z: Number(response['translation']?.['z']) || 0x0,
      },
    }),
    enabled3
  );
}
export function readStoryboard3DModelNormalization(input) {
  const response2 = input?.['userData']?.[STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY];
  if (response2?.['status'] !== 'ready') return null;
  return {
    status: 'ready',
    uniformScale: Math['max'](0.000001, Number(response2['uniformScale']) || 0x1),
    translation: {
      x: Number(response2['translation']?.['x']) || 0x0,
      y: Number(response2['translation']?.['y']) || 0x0,
      z: Number(response2['translation']?.['z']) || 0x0,
    },
  };
}
export function createStoryboard3DModelNormalizationPlan(output, { targetSize: targetSize = 0x2 } = {}) {
  if (!finiteBounds(output))
    return {
      status: 'awaiting-bounds',
      targetSize: Math['max'](0.1, Number(targetSize) || 0x2),
      operations: ['measure-bounds', 'uniform-scale', 'center-xz', 'place-on-ground'],
    };
  const min = {
      x: Number(output['min']['x']),
      y: Number(output['min']['y']),
      z: Number(output['min']['z']),
    },
    max = {
      x: Number(output['max']['x']),
      y: Number(output['max']['y']),
      z: Number(output['max']['z']),
    },
    size = {
      x: Math['max'](0x0, max['x'] - min['x']),
      y: Math['max'](0x0, max['y'] - min['y']),
      z: Math['max'](0x0, max['z'] - min['z']),
    },
    count2 = Math['max'](size['x'], size['y'], size['z']);
  if (count2 <= 1e-8) throw new Error('Model\x20bounds\x20have\x20no\x20measurable\x20size.');
  const uniformScale = Math['max'](0.1, Number(targetSize) || 0x2) / count2;
  return {
    status: 'ready',
    targetSize: Math['max'](0.1, Number(targetSize) || 0x2),
    uniformScale: uniformScale,
    translation: {
      x: -((min['x'] + max['x']) / 0x2) * uniformScale || 0x0,
      y: -min['y'] * uniformScale || 0x0,
      z: -((min['z'] + max['z']) / 0x2) * uniformScale || 0x0,
    },
    sourceBounds: { min: min, max: max, size: size },
    operations: ['uniform-scale', 'center-xz', 'place-on-ground'],
  };
}
export async function importStoryboard3DModelFile(
  value2,
  {
    parsers: parsers = {},
    relatedFiles: relatedFiles = [],
    targetSize: targetSize = 0x2,
    maxBytes: maxBytes = DEFAULT_MODEL_IMPORT_MAX_BYTES,
    signal: signal,
    onProgress: onProgress,
  } = {},
) {
  const format3 = await inspectStoryboard3DModelFile(value2, { maxBytes: maxBytes });
  if (!format3['ok']) {
    const error3 = new Error(format3['errors']['map']((error4) => error4['message'])['join']('\x20'));
    ((error3['code'] = format3['errors'][0x0]?.['code'] || 'MODEL_IMPORT_INVALID'),
      (error3['details'] = format3));
    throw error3;
  }
  const run = parsers[format3['parserId']] || parsers[format3['format']];
  if (typeof run !== 'function') {
    const error5 = new Error('缺少 ' + format3['format']['toUpperCase']() + '\x20模型解析器。');
    ((error5['code'] = 'MODEL_PARSER_UNAVAILABLE'), (error5['format'] = format3['format']));
    throw error5;
  }
  const resources = createStoryboard3DModelResourceMap([value2, ...relatedFiles]),
    parsed = await run(value2, {
      format: format3['format'],
      resources: resources,
      signal: signal,
      onProgress: onProgress,
      onWorkerProgress: onProgress,
    }),
    normalization = createStoryboard3DModelNormalizationPlan(parsed?.['bounds'], { targetSize: targetSize });
  return { format: format3['format'], parsed: parsed, normalization: normalization };
}
export function createStoryboard3DModelResourceMap(list7 = []) {
  const map = new Map();
  for (const error6 of list7) {
    const value3 = String(error6?.['webkitRelativePath'] || error6?.['name'] || '')['replaceAll'](
        '\x5c',
        '/',
      ),
      enabled4 = value3['split']('/')
        ['filter']((value4) => value4 && value4 !== '.' && value4 !== '..')
        ['join']('/');
    if (!enabled4) continue;
    (map['set'](enabled4, error6), map['set'](enabled4['split']('/')['at'](-0x1), error6));
  }
  return map;
}
export function pickStoryboard3DModelFiles({
  documentObject: documentObject = globalThis['document'],
  multiple: multiple = ![],
} = {}) {
  if (!documentObject?.['createElement']) return Promise['reject'](new Error('File picker is unavailable.'));
  return new Promise((handler) => {
    const el = documentObject['createElement']('input');
    ((el['type'] = 'file'),
      (el['accept'] = STORYBOARD_3D_MODEL_ACCEPT),
      (el['multiple'] = multiple === !![]),
      el['addEventListener']('change', () => handler([...(el['files'] || [])]), {
        once: !![],
      }),
      el['addEventListener']('cancel', () => handler([]), { once: !![] }),
      el['click']());
  });
}
