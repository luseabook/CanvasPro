const MODEL_FORMATS = Object.freeze({
  glb: Object.freeze({
    extension: 'glb',
    mimeTypes: ['model/gltf-binary', 'application/octet-stream'],
    parserId: 'gltf',
  }),
  gltf: Object.freeze({
    extension: 'gltf',
    mimeTypes: ['model/gltf+json', 'application/json'],
    parserId: 'gltf',
  }),
  fbx: Object.freeze({ extension: 'fbx', mimeTypes: ['application/octet-stream'], parserId: 'fbx' }),
  obj: Object.freeze({
    extension: 'obj',
    mimeTypes: ['text/plain', 'application/octet-stream'],
    parserId: 'obj',
  }),
  stl: Object.freeze({
    extension: 'stl',
    mimeTypes: ['model/stl', 'application/sla', 'application/octet-stream'],
    parserId: 'stl',
  }),
});
export {
  STORYBOARD_3D_MODEL_IMPORT_CAPABILITIES,
  getStoryboard3DModelImportCapability,
} from './gltfImportAdapter.js';
export const STORYBOARD_3D_MODEL_FORMATS = Object.freeze(Object.keys(MODEL_FORMATS));
export const STORYBOARD_3D_MODEL_ACCEPT = '.glb,.gltf,.fbx,.obj,.stl';
export const DEFAULT_MODEL_IMPORT_MAX_BYTES = 256 * 1024 * 1024;
function extensionOf(value) {
  const item = String(value || '')
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)$/);
  return item?.[1] || '';
}
export function detectStoryboard3DModelFormat(error) {
  const extensionOf2 = extensionOf(error?.name || error?.fileName);
  if (MODEL_FORMATS[extensionOf2]) return extensionOf2;
  const key = String(error?.type || '')
      .trim()
      .toLowerCase(),
    list = Object.entries(MODEL_FORMATS).filter(([, index]) => index.mimeTypes.includes(key));
  return list.length === 1 ? list[0][0] : '';
}
export function validateStoryboard3DModelSource(
  error2,
  { maxBytes: maxBytes = DEFAULT_MODEL_IMPORT_MAX_BYTES } = {},
) {
  const ok = [],
    enabled = String(error2?.name || '').trim(),
    count = Number(error2?.size),
    format = detectStoryboard3DModelFormat(error2);
  if (!enabled) ok.push({ code: 'MODEL_FILE_NAME_REQUIRED', message: '模型文件缺少名称。' });
  if (!format)
    ok.push({ code: 'MODEL_FORMAT_UNSUPPORTED', message: '仅支持 GLB、GLTF、FBX、OBJ 和 STL。' });
  if (!Number.isFinite(count) || count <= 0)
    ok.push({ code: 'MODEL_FILE_EMPTY', message: '模型文件为空。' });
  return (
    Number.isFinite(count) &&
      count > maxBytes &&
      ok.push({
        code: 'MODEL_FILE_TOO_LARGE',
        message: '模型文件不能超过 ' + Math.round(maxBytes / 1024 / 1024) + ' MB。',
      }),
    typeof error2?.arrayBuffer !== 'function' &&
      ok.push({ code: 'MODEL_FILE_UNREADABLE', message: '当前文件对象不可读取。' }),
    { ok: ok.length === 0, format: format, errors: ok }
  );
}
function ascii(list2, result = 0, data = list2.length) {
  return new TextDecoder('utf-8', { fatal: false }).decode(list2.subarray(result, data));
}
function inspectGlb(options) {
  if (options.byteLength < 20) return false;
  const dataView = new DataView(options.buffer, options.byteOffset, options.byteLength),
    target = dataView.getUint32(8, true),
    source = dataView.getUint32(12, true);
  if (
    dataView.getUint32(0, true) !== 0x46546c67 ||
    dataView.getUint32(4, true) !== 2 ||
    target !== options.byteLength ||
    dataView.getUint32(16, true) !== 0x4e4f534a ||
    20 + source > options.byteLength
  )
    return false;
  try {
    const next = JSON.parse(ascii(options, 20, 20 + source).trim());
    return String(next?.asset?.version || '').startsWith('2');
  } catch {
    return false;
  }
}
function inspectGltf(current) {
  try {
    const entry = JSON.parse(ascii(current));
    return String(entry?.asset?.version || '').startsWith('2');
  } catch {
    return false;
  }
}
function inspectObj(list3) {
  const ascii2 = ascii(list3, 0, Math.min(list3.length, 2 * 1024 * 1024));
  return /^\s*v\s+[-+\d.]/m.test(ascii2) && /^\s*f\s+\S+/m.test(ascii2);
}
function inspectFbx(list4) {
  const list5 = ascii(list4, 0, Math.min(list4.length, 1024));
  return list5.startsWith('Kaydara FBX Binary') || list5.includes('FBXHeaderExtension');
}
function inspectStl(list6) {
  if (list6.byteLength >= 84) {
    const dataView2 = new DataView(list6.buffer, list6.byteOffset, list6.byteLength),
      record = dataView2.getUint32(80, true);
    if (84 + record * 50 === list6.byteLength) return true;
  }
  const ascii3 = ascii(list6, 0, Math.min(list6.length, 4096));
  return /^\s*solid\b/i.test(ascii3) && /\bfacet\s+normal\b/i.test(ascii3);
}
export async function inspectStoryboard3DModelFile(payload, handle = {}) {
  const format2 = validateStoryboard3DModelSource(payload, handle);
  if (!format2.ok) return format2;
  const byteLength = new Uint8Array(await payload.arrayBuffer()),
    state = { glb: inspectGlb, gltf: inspectGltf, obj: inspectObj, fbx: inspectFbx, stl: inspectStl },
    enabled2 = state[format2.format](byteLength);
  if (!enabled2)
    return {
      ok: false,
      format: format2.format,
      errors: [
        {
          code: 'MODEL_CONTENT_INVALID',
          message: '文件内容不是有效的 ' + format2.format.toUpperCase() + ' 模型。',
        },
      ],
    };
  return {
    ok: true,
    format: format2.format,
    byteLength: byteLength.byteLength,
    parserId: MODEL_FORMATS[format2.format].parserId,
    errors: [],
  };
}
function finiteBounds(config) {
  return [
    config?.min?.x,
    config?.min?.y,
    config?.min?.z,
    config?.max?.x,
    config?.max?.y,
    config?.max?.z,
  ].every((scope) => Number.isFinite(Number(scope)));
}
export const STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY = 'storyboard3dNormalization';
export function setStoryboard3DModelNormalization(enabled3, response) {
  if (!enabled3 || typeof enabled3 !== 'object') return enabled3;
  enabled3.userData =
    enabled3.userData && typeof enabled3.userData === 'object' ? enabled3.userData : {};
  if (response?.status !== 'ready')
    return (delete enabled3.userData[STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY], enabled3);
  return (
    (enabled3.userData[STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY] = {
      status: 'ready',
      uniformScale: Math.max(0.000001, Number(response.uniformScale) || 1),
      translation: {
        x: Number(response.translation?.x) || 0,
        y: Number(response.translation?.y) || 0,
        z: Number(response.translation?.z) || 0,
      },
    }),
    enabled3
  );
}
export function readStoryboard3DModelNormalization(input) {
  const response2 = input?.userData?.[STORYBOARD_3D_MODEL_NORMALIZATION_USER_DATA_KEY];
  if (response2?.status !== 'ready') return null;
  return {
    status: 'ready',
    uniformScale: Math.max(0.000001, Number(response2.uniformScale) || 1),
    translation: {
      x: Number(response2.translation?.x) || 0,
      y: Number(response2.translation?.y) || 0,
      z: Number(response2.translation?.z) || 0,
    },
  };
}
export function createStoryboard3DModelNormalizationPlan(output, { targetSize: targetSize = 2 } = {}) {
  if (!finiteBounds(output))
    return {
      status: 'awaiting-bounds',
      targetSize: Math.max(0.1, Number(targetSize) || 2),
      operations: ['measure-bounds', 'uniform-scale', 'center-xz', 'place-on-ground'],
    };
  const min = {
      x: Number(output.min.x),
      y: Number(output.min.y),
      z: Number(output.min.z),
    },
    max = {
      x: Number(output.max.x),
      y: Number(output.max.y),
      z: Number(output.max.z),
    },
    size = {
      x: Math.max(0, max.x - min.x),
      y: Math.max(0, max.y - min.y),
      z: Math.max(0, max.z - min.z),
    },
    count2 = Math.max(size.x, size.y, size.z);
  if (count2 <= 1e-8) throw new Error('Model bounds have no measurable size.');
  const uniformScale = Math.max(0.1, Number(targetSize) || 2) / count2;
  return {
    status: 'ready',
    targetSize: Math.max(0.1, Number(targetSize) || 2),
    uniformScale: uniformScale,
    translation: {
      x: -((min.x + max.x) / 2) * uniformScale || 0,
      y: -min.y * uniformScale || 0,
      z: -((min.z + max.z) / 2) * uniformScale || 0,
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
    targetSize: targetSize = 2,
    maxBytes: maxBytes = DEFAULT_MODEL_IMPORT_MAX_BYTES,
    signal: signal,
    onProgress: onProgress,
  } = {},
) {
  const format3 = await inspectStoryboard3DModelFile(value2, { maxBytes: maxBytes });
  if (!format3.ok) {
    const error3 = new Error(format3.errors.map((error4) => error4.message).join(' '));
    ((error3.code = format3.errors[0]?.code || 'MODEL_IMPORT_INVALID'),
      (error3.details = format3));
    throw error3;
  }
  const run = parsers[format3.parserId] || parsers[format3.format];
  if (typeof run !== 'function') {
    const error5 = new Error('缺少 ' + format3.format.toUpperCase() + ' 模型解析器。');
    ((error5.code = 'MODEL_PARSER_UNAVAILABLE'), (error5.format = format3.format));
    throw error5;
  }
  const resources = createStoryboard3DModelResourceMap([value2, ...relatedFiles]),
    parsed = await run(value2, {
      format: format3.format,
      resources: resources,
      signal: signal,
      onProgress: onProgress,
      onWorkerProgress: onProgress,
    }),
    normalization = createStoryboard3DModelNormalizationPlan(parsed?.bounds, { targetSize: targetSize });
  return { format: format3.format, parsed: parsed, normalization: normalization };
}
export function createStoryboard3DModelResourceMap(list7 = []) {
  const map = new Map();
  for (const error6 of list7) {
    const value3 = String(error6?.webkitRelativePath || error6?.name || '').replaceAll(
        '\\',
        '/',
      ),
      enabled4 = value3.split('/')
        .filter((value4) => value4 && value4 !== '.' && value4 !== '..')
        .join('/');
    if (!enabled4) continue;
    (map.set(enabled4, error6), map.set(enabled4.split('/').at(-1), error6));
  }
  return map;
}
export function pickStoryboard3DModelFiles({
  documentObject: documentObject = globalThis.document,
  multiple: multiple = false,
} = {}) {
  if (!documentObject?.createElement) return Promise.reject(new Error('File picker is unavailable.'));
  return new Promise((handler) => {
    const el = documentObject.createElement('input');
    ((el.type = 'file'),
      (el.accept = STORYBOARD_3D_MODEL_ACCEPT),
      (el.multiple = multiple === true),
      el.addEventListener('change', () => handler([...(el.files || [])]), {
        once: true,
      }),
      el.addEventListener('cancel', () => handler([]), { once: true }),
      el.click());
  });
}
