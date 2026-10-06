function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function isPresentValue(list) {
  if (list === undefined || list === null) return false;
  if (typeof list === 'string') return list.trim() !== '';
  if (Array.isArray(list)) return list.length > 0;
  return true;
}
export function getPathValue(value, item) {
  const enabled2 = String(item || '').trim();
  if (!enabled2) return undefined;
  return enabled2.split('.').reduce((item2, key) => {
    if (item2 === undefined || item2 === null) return undefined;
    return item2[key];
  }, value);
}
export function setPathValue(index, result, data) {
  const enabled3 = String(result || '').trim();
  if (!enabled3) return index;
  const list2 = enabled3.split('.').filter(Boolean);
  if (list2.length === 0) return index;
  let options = index;
  for (let target = 0; target < list2.length - 1; target += 1) {
    const source = list2[target];
    if (!isPlainObject(options[source])) options[source] = {};
    options = options[source];
  }
  return ((options[list2[list2.length - 1]] = data), index);
}
function normalizeFieldList(next) {
  const current = next?.fields !== undefined ? next.fields : next?.field,
    list3 = Array.isArray(current) ? current : [current];
  return list3.map((item3) => String(item3 || '').trim()).filter(Boolean);
}
function resolveFirstPayloadValue(entry, record) {
  for (const payload of record) {
    const pathValue = getPathValue(entry, payload);
    if (isPresentValue(pathValue)) return pathValue;
  }
  return undefined;
}
function valuesEqual(handle, state) {
  if (typeof state === 'boolean') {
    const config = String(handle ?? '')
      .trim()
      .toLowerCase();
    return handle === state || config === String(state);
  }
  if (typeof state === 'number') return Number(handle) === state;
  return String(handle ?? '').trim() === String(state ?? '').trim();
}
function evaluateWhenRule(enabled4, scope) {
  if (!enabled4 || typeof enabled4 !== 'object') return true;
  const input = enabled4.field ? getPathValue(scope.payload || {}, enabled4.field) : undefined,
    isPresentValue2 = isPresentValue(input);
  if (Object.prototype.hasOwnProperty.call(enabled4, 'exists')) {
    if (Boolean(enabled4.exists) !== isPresentValue2) return false;
  }
  if (enabled4.truthy === true && !Boolean(input)) return false;
  if (enabled4.falsy === true && Boolean(input)) return false;
  if (Object.prototype.hasOwnProperty.call(enabled4, 'equals') && !valuesEqual(input, enabled4.equals))
    return false;
  if (Object.prototype.hasOwnProperty.call(enabled4, 'notEquals') && valuesEqual(input, enabled4.notEquals))
    return false;
  if (Array.isArray(enabled4.in) && !enabled4.in.some((item4) => valuesEqual(input, item4))) return false;
  if (Array.isArray(enabled4.notIn) && enabled4.notIn.some((item5) => valuesEqual(input, item5)))
    return false;
  return true;
}
function shouldApplyEntry(enabled5, output) {
  if (!enabled5?.when) return true;
  if (Array.isArray(enabled5.when)) return enabled5.when.every((item6) => evaluateWhenRule(item6, output));
  return evaluateWhenRule(enabled5.when, output);
}
function normalizeMappingEntries(map) {
  if (Array.isArray(map)) return map;
  if (Array.isArray(map?.entries)) return map.entries;
  return [];
}
function resolveEntrySourceValue(el, value2) {
  const value3 = String(el?.from || '').trim();
  if (value3 === 'prompt') return value2.finalPrompt || '';
  if (value3 === 'param') return resolveFirstPayloadValue(value2.payload || {}, normalizeFieldList(el));
  if (value3 === 'inputImages') return value2.inputImages || [];
  if (value3 === 'inputVideos') return value2.inputVideos || [];
  if (value3 === 'inputAudios') return value2.inputAudios || [];
  if (value3 === 'model') return value2.modelToken || '';
  if (value3 === 'constant')
    return Object.prototype.hasOwnProperty.call(el, 'value') ? el.value : el.defaultValue;
  return undefined;
}
function normalizeTransformList(enabled6) {
  if (!enabled6) return [];
  return Array.isArray(enabled6) ? enabled6 : [enabled6];
}
async function applyTransforms(value4, entry2, context, value5) {
  let value6 = value4;
  for (const name of normalizeTransformList(entry2?.transform)) {
    const spec = typeof name === 'string' ? { name: name } : isPlainObject(name) ? name : { name: '' },
      enabled7 = String(spec.name || '').trim();
    if (!enabled7) continue;
    const run = value5?.[enabled7];
    if (typeof run !== 'function')
      throw new Error('Unsupported model API bodyMapping transform: ' + enabled7);
    value6 = await run(value6, { entry: entry2, context: context, spec: spec });
  }
  return value6;
}
export async function buildBodyFromMapping({
  bodyMapping: bodyMapping,
  context: context2,
  transforms: transforms = {},
}) {
  const body = {},
    mappingEntries = normalizeMappingEntries(bodyMapping),
    value7 = { ...context2, body: body };
  for (const enabled8 of mappingEntries) {
    if (!enabled8?.path || !shouldApplyEntry(enabled8, value7)) continue;
    let entrySourceValue = resolveEntrySourceValue(enabled8, value7);
    !isPresentValue(entrySourceValue) &&
      Object.prototype.hasOwnProperty.call(enabled8, 'defaultValue') &&
      (entrySourceValue = enabled8.defaultValue);
    entrySourceValue = await applyTransforms(entrySourceValue, enabled8, value7, transforms);
    if (enabled8.omitWhenEmpty === true && !isPresentValue(entrySourceValue)) continue;
    setPathValue(body, enabled8.path, entrySourceValue);
  }
  return body;
}
function collectValuesByPath(value8, value9) {
  const list4 = String(value9 || '')
    .trim()
    .split('.')
    .filter(Boolean);
  if (list4.length === 0) return [];
  const run2 = (value10, value11) => {
    if (value10 === undefined || value10 === null) return [];
    if (value11 >= list4.length) return Array.isArray(value10) ? value10 : [value10];
    const list5 = list4[value11];
    if (list5.endsWith('[]')) {
      const value12 = list5.slice(0, -2),
        list6 = value12 ? value10?.[value12] : value10;
      if (!Array.isArray(list6)) return [];
      return list6.flatMap((item7) => run2(item7, value11 + 1));
    }
    return run2(value10?.[list5], value11 + 1);
  };
  return run2(value8, 0).flatMap((item8) => (Array.isArray(item8) ? item8 : [item8]));
}
export function resolveMappedResponseValues(value13, value14 = []) {
  const value15 = Array.isArray(value14) ? value14 : [value14],
    list7 = [];
  for (const value16 of value15) {
    for (const response of collectValuesByPath(value13, value16)) {
      if (response && typeof response === 'object') {
        const value17 =
          response.url ||
          response.imageUrl ||
          response.image_url ||
          response.videoUrl ||
          response.video_url ||
          response.fileUrl;
        if (value17) list7.push(String(value17).trim());
        continue;
      }
      const value18 = String(response ?? '').trim();
      if (value18) list7.push(value18);
    }
  }
  return Array.from(new Set(list7.filter(Boolean)));
}
function normalizeImageMimeType(value19, value20 = 'image/png') {
  const value21 = String(value19 || '')
    .trim()
    .toLowerCase();
  if (/^image\/[a-z0-9.+-]{1,64}$/.test(value21)) return value21;
  const value22 = String(value20 || '')
    .trim()
    .toLowerCase();
  return /^image\/[a-z0-9.+-]{1,64}$/.test(value22) ? value22 : 'image/png';
}
function normalizeImageBase64DataUrl(rawValue, mimeType) {
  const trimmedValue = String(rawValue || '').trim();
  if (/^data:image\/[a-z0-9.+-]{1,64};base64,[a-z0-9+/=_-]+$/i.test(trimmedValue)) return trimmedValue;
  const base64Data = trimmedValue.replace(/\s+/g, '');
  if (!base64Data || !/^[a-z0-9+/=_-]+$/i.test(base64Data)) return '';
  try {
    const headerBytes = atob(base64Data.slice(0, 24).replace(/-/g, '+').replace(/_/g, '/'));
    if (headerBytes.startsWith('ÿØÿ')) mimeType = 'image/jpeg';
    else if (headerBytes.startsWith('PNG\r\n\x1a\n')) mimeType = 'image/png';
    else if (/^GIF8[79]a/.test(headerBytes)) mimeType = 'image/gif';
    else if (headerBytes.startsWith('RIFF') && headerBytes.slice(8, 12) === 'WEBP') mimeType = 'image/webp';
  } catch {}
  return 'data:' + mimeType + ';base64,' + base64Data;
}
export function resolveMappedImageResponseValues(value26, value27 = {}) {
  const args = resolveMappedResponseValues(value26, value27?.resultPaths || value27?.paths),
    list10 = Array.isArray(value27?.base64Paths) ? value27.base64Paths : [],
    list11 = Array.isArray(value27?.base64MimeTypePaths) ? value27.base64MimeTypePaths : [],
    value28 = list11.flatMap((item9) => collectValuesByPath(value26, item9)),
    imageMimeType = normalizeImageMimeType(value27?.base64DefaultMimeType),
    list12 = list10.flatMap((item10) => collectValuesByPath(value26, item10)),
    args2 = list12
      .map((item11, value29) =>
        normalizeImageBase64DataUrl(item11, normalizeImageMimeType(value28[value29], imageMimeType)),
      )
      .filter(Boolean);
  return Array.from(new Set([...args, ...args2]));
}
export function resolveMappedResponseValue(value30, value31 = []) {
  return resolveMappedResponseValues(value30, value31)[0] || '';
}
