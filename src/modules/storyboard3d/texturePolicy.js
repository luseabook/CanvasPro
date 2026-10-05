export const DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION = 4096;
export const DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS = 4096 * 4096;
export const DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES = 64 * 1024 * 1024;
const ownedTextureResources = new WeakMap();
function finitePositiveInteger(value, item = 0) {
  const count = Math['floor'](Number(value));
  return Number['isFinite'](count) && count > 0 ? count : item;
}
function createAbortError(error = 'Texture processing was cancelled') {
  const error2 = new Error(
    String(error?.['message'] || error || 'Texture processing was cancelled'),
  );
  return ((error2['name'] = 'AbortError'), (error2['code'] = 'ABORT_ERR'), error2);
}
function throwIfAborted(key) {
  if (key?.['aborted']) throw createAbortError(key['reason']);
}
function textureSource(index) {
  return index?.['source']?.['data'] ?? index?.['image'] ?? null;
}
function imageDimensions(box) {
  if (Array['isArray'](box))
    return box['reduce']((box2, result) => {
      const box3 = imageDimensions(result);
      if (!box3) return box2;
      if (!box2 || box3['width'] * box3['height'] > box2['width'] * box2['height']) return box3;
      return box2;
    }, null);
  const width = finitePositiveInteger(box?.['naturalWidth'] ?? box?.['videoWidth'] ?? box?.['width']),
    height = finitePositiveInteger(box?.['naturalHeight'] ?? box?.['videoHeight'] ?? box?.['height']);
  return width && height ? { width: width, height: height } : null;
}
function materialTextures(data) {
  const options = new Set(),
    map = new WeakSet(),
    handler = (list, count2 = 0) => {
      if (!list || count2 > 4) return;
      if (list['isTexture']) {
        options['add'](list);
        return;
      }
      if (list instanceof ArrayBuffer || ArrayBuffer['isView'](list)) return;
      if (typeof list !== 'object' || map['has'](list)) return;
      map['add'](list);
      if (Array['isArray'](list)) {
        list['forEach']((target) => handler(target, count2 + 1));
        return;
      }
      Object['values'](list)['forEach']((source) => handler(source, count2 + 1));
    };
  return (handler(data), options);
}
function computeTargetSize(next, current, entry) {
  const record = Math['min'](1, entry['maxDimension'] / next, entry['maxDimension'] / current),
    payload = Math['min'](1, Math['sqrt'](entry['maxPixels'] / (next * current))),
    scale = Math['min'](record, payload);
  return {
    width: Math['max'](1, Math['floor'](next * scale)),
    height: Math['max'](1, Math['floor'](current * scale)),
    scale: scale,
  };
}
export function resolveStoryboard3DTextureLimits({
  renderer: renderer = null,
  policyMaxDimension: policyMaxDimension = DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION,
  policyMaxPixels: policyMaxPixels = DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS,
} = {}) {
  const maxDimension = finitePositiveInteger(renderer?.['capabilities']?.['maxTextureSize']),
    policyMaxDimension2 = finitePositiveInteger(
      policyMaxDimension,
      DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION,
    );
  return {
    maxDimension: maxDimension ? Math['min'](maxDimension, policyMaxDimension2) : policyMaxDimension2,
    maxPixels: finitePositiveInteger(policyMaxPixels, DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS),
    hardwareMaxTextureSize: maxDimension || null,
    policyMaxDimension: policyMaxDimension2,
  };
}
export function inspectStoryboard3DSceneTextures(handle, state = {}) {
  const limits = resolveStoryboard3DTextureLimits(state),
    map2 = new Map(),
    handler2 = (enabled, config) => {
      if (!enabled?.['isTexture']) return;
      if (!map2['has'](enabled)) map2['set'](enabled, []);
      map2['get'](enabled)['push'](config);
    };
  (handler2(handle?.['background'], 'scene.background'),
    handler2(handle?.['environment'], 'scene.environment'),
    handle?.['traverse']?.((error3) => {
      const list2 = Array['isArray'](error3?.['material']) ? error3['material'] : [error3?.['material']];
      list2['filter'](Boolean)['forEach']((scope, input) => {
        materialTextures(scope)['forEach']((output) =>
          handler2(
            output,
            String(error3?.['name'] || error3?.['uuid'] || error3?.['type'] || 'object') +
              '.material[' +
              input +
              ']',
          ),
        );
      });
    }));
  const textures = [...map2['entries']()]['map'](([texture, references], textureIndex) => {
    const textureSource2 = textureSource(texture),
      width2 = imageDimensions(textureSource2);
    if (!width2)
      return {
        texture: texture,
        textureIndex: textureIndex,
        references: references,
        width: null,
        height: null,
        pixelCount: null,
        targetWidth: null,
        targetHeight: null,
        action: 'warning',
        reasons: ['TEXTURE_DIMENSIONS_UNKNOWN'],
      };
    const targetWidth = computeTargetSize(width2['width'], width2['height'], limits),
      action = [];
    return (
      (width2['width'] > limits['maxDimension'] || width2['height'] > limits['maxDimension']) &&
        action['push']('TEXTURE_DIMENSION_EXCEEDS_LIMIT'),
      width2['width'] * width2['height'] > limits['maxPixels'] &&
        action['push']('TEXTURE_PIXEL_COUNT_EXCEEDS_LIMIT'),
      {
        texture: texture,
        textureIndex: textureIndex,
        references: references,
        width: width2['width'],
        height: width2['height'],
        pixelCount: width2['width'] * width2['height'],
        targetWidth: targetWidth['width'],
        targetHeight: targetWidth['height'],
        action: action['length'] ? 'downsample' : 'keep',
        reasons: action,
      }
    );
  });
  return {
    limits: limits,
    textures: textures,
    total: textures['length'],
    oversized: textures['filter']((value2) => value2['action'] === 'downsample')['length'],
    warnings: textures['filter']((value3) => value3['action'] === 'warning')['length'],
  };
}
function closeResource(value4) {
  try {
    value4?.['close']?.();
  } catch {}
}
export function releaseStoryboard3DTexturePolicyResource(el) {
  const enabled2 = ownedTextureResources['get'](el);
  if (!enabled2) return false;
  return (
    ownedTextureResources['delete'](el),
    el?.['removeEventListener']?.('dispose', enabled2['onDispose']),
    closeResource(enabled2['resource']),
    true
  );
}
function ownTextureResource(el2, resource) {
  releaseStoryboard3DTexturePolicyResource(el2);
  const onDispose = () => releaseStoryboard3DTexturePolicyResource(el2);
  (ownedTextureResources['set'](el2, { resource: resource, onDispose: onDispose }),
    el2?.['addEventListener']?.('dispose', onDispose));
}
function defaultCreateCanvas(
  value5,
  value6,
  {
    OffscreenCanvasConstructor: OffscreenCanvasConstructor = globalThis['OffscreenCanvas'],
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  if (typeof OffscreenCanvasConstructor === 'function') return new OffscreenCanvasConstructor(value5, value6);
  const box4 = documentObject?.['createElement']?.('canvas');
  if (!box4) return null;
  return ((box4['width'] = value5), (box4['height'] = value6), box4);
}
async function createDownsampledSource(
  value7,
  resizeWidth,
  resizeHeight,
  {
    signal: signal,
    createImageBitmapFn: createImageBitmapFn = globalThis['createImageBitmap'],
    createCanvas: createCanvas,
    OffscreenCanvasConstructor: OffscreenCanvasConstructor2,
    documentObject: documentObject2,
  } = {},
) {
  const list3 = [];
  if (typeof createImageBitmapFn === 'function')
    try {
      const source2 = await createImageBitmapFn(value7, {
        resizeWidth: resizeWidth,
        resizeHeight: resizeHeight,
        resizeQuality: 'high',
      });
      if (signal?.['aborted']) {
        closeResource(source2);
        throw createAbortError(signal['reason']);
      }
      return { source: source2, ownedResource: source2, method: 'createImageBitmap' };
    } catch (error4) {
      if (error4?.['name'] === 'AbortError') throw error4;
      list3['push'](error4);
    }
  throwIfAborted(signal);
  try {
    const source3 =
      typeof createCanvas === 'function'
        ? await createCanvas(resizeWidth, resizeHeight)
        : defaultCreateCanvas(resizeWidth, resizeHeight, {
            OffscreenCanvasConstructor: OffscreenCanvasConstructor2,
            documentObject: documentObject2,
          });
    if (!source3) throw new Error('Canvas creation is unavailable');
    ((source3['width'] = resizeWidth), (source3['height'] = resizeHeight));
    const ctx = source3['getContext']?.('2d', { alpha: true });
    if (!ctx?.['drawImage']) throw new Error('A drawable 2D canvas context is unavailable');
    (ctx['drawImage'](value7, 0, 0, resizeWidth, resizeHeight), throwIfAborted(signal));
    if (typeof source3['transferToImageBitmap'] === 'function') {
      const source4 = source3['transferToImageBitmap']();
      if (signal?.['aborted']) {
        closeResource(source4);
        throw createAbortError(signal['reason']);
      }
      return { source: source4, ownedResource: source4, method: 'offscreen-canvas' };
    }
    return { source: source3, ownedResource: null, method: 'canvas' };
  } catch (error5) {
    if (error5?.['name'] === 'AbortError') throw error5;
    list3['push'](error5);
  }
  const error6 = new Error('Texture cannot be downsampled in this runtime.');
  ((error6['code'] = 'TEXTURE_DOWNSAMPLE_UNAVAILABLE'), (error6['causes'] = list3));
  throw error6;
}
export async function downsampleStoryboard3DTexture(
  colorSpace,
  { width: width3, height: height2, signal: signal2, ...args } = {},
) {
  if (!colorSpace?.['isTexture']) throw new TypeError('A Three.js texture is required.');
  const textureSource3 = textureSource(colorSpace);
  if (
    !textureSource3 ||
    Array['isArray'](textureSource3) ||
    colorSpace['isCompressedTexture'] ||
    colorSpace['isDataTexture']
  ) {
    const error7 = new Error('Texture source is not a drawable 2D image.');
    error7['code'] = 'TEXTURE_DOWNSAMPLE_UNAVAILABLE';
    throw error7;
  }
  const width4 = finitePositiveInteger(width3),
    height3 = finitePositiveInteger(height2);
  if (!width4 || !height3) throw new TypeError('Positive target dimensions are required.');
  throwIfAborted(signal2);
  const value8 = { colorSpace: colorSpace['colorSpace'], flipY: colorSpace['flipY'] },
    method = await createDownsampledSource(textureSource3, width4, height3, {
      signal: signal2,
      ...args,
    });
  if (signal2?.['aborted']) {
    closeResource(method['ownedResource']);
    throw createAbortError(signal2['reason']);
  }
  try {
    ((colorSpace['image'] = method['source']),
      (colorSpace['colorSpace'] = value8['colorSpace']),
      (colorSpace['flipY'] = value8['flipY']),
      (colorSpace['needsUpdate'] = true));
  } catch (value9) {
    try {
      ((colorSpace['image'] = textureSource3),
        (colorSpace['colorSpace'] = value8['colorSpace']),
        (colorSpace['flipY'] = value8['flipY']));
    } catch {}
    closeResource(method['ownedResource']);
    throw value9;
  }
  if (method['ownedResource']) ownTextureResource(colorSpace, method['ownedResource']);
  else releaseStoryboard3DTexturePolicyResource(colorSpace);
  return { texture: colorSpace, width: width4, height: height3, method: method['method'] };
}
export async function applyStoryboard3DTexturePolicy(
  value10,
  { signal: signal3, onProgress: onProgress, ...args2 } = {},
) {
  throwIfAborted(signal3);
  const inspection = inspectStoryboard3DSceneTextures(value10, args2),
    optimized = [],
    warnings = inspection['textures']
      ['filter']((value11) => value11['action'] === 'warning')
      ['map']((code) => ({
        code: code['reasons'][0],
        texture: code['texture'],
        references: code['references'],
        message:
          'Texture dimensions could not be determined; the texture was kept unchanged.',
      })),
    total = inspection['textures']['filter']((value12) => value12['action'] === 'downsample');
  for (let completed = 0; completed < total['length']; completed += 1) {
    throwIfAborted(signal3);
    const width5 = total[completed];
    try {
      const method2 = await downsampleStoryboard3DTexture(width5['texture'], {
        width: width5['targetWidth'],
        height: width5['targetHeight'],
        signal: signal3,
        ...args2,
      });
      optimized['push']({ ...width5, method: method2['method'] });
    } catch (code2) {
      if (code2?.['name'] === 'AbortError') throw code2;
      warnings['push']({
        code: code2?.['code'] || 'TEXTURE_DOWNSAMPLE_FAILED',
        texture: width5['texture'],
        references: width5['references'],
        message:
          'Texture ' +
          width5['width'] +
          'x' +
          width5['height'] +
          ' exceeds the ' +
          inspection['limits']['maxDimension'] +
          'px / ' +
          inspection['limits']['maxPixels'] +
          ' pixel policy but could not be downsampled.',
        cause: code2,
      });
    }
    onProgress?.({
      completed: completed + 1,
      total: total['length'],
      progress: total['length'] ? (completed + 1) / total['length'] : 1,
    });
  }
  return {
    inspection: inspection,
    optimized: optimized,
    warnings: warnings,
    disposeOwnedResources() {
      optimized['forEach']((value13) => releaseStoryboard3DTexturePolicyResource(value13['texture']));
    },
  };
}
export function validateStoryboard3DImageFile(
  error8,
  { maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES } = {},
) {
  const ok = [],
    enabled3 = String(error8?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    count3 = Number(error8?.['size']);
  if (!String(error8?.['name'] || '')['trim']())
    ok['push']({
      code: 'IMAGE_FILE_NAME_REQUIRED',
      message: 'Image file name is required.',
    });
  if (!enabled3['startsWith']('image/'))
    ok['push']({ code: 'IMAGE_FILE_TYPE_INVALID', message: 'The selected file is not an image.' });
  if (!Number['isFinite'](count3) || count3 <= 0)
    ok['push']({ code: 'IMAGE_FILE_EMPTY', message: 'The image file is empty.' });
  return (
    Number['isFinite'](count3) &&
      count3 > maxBytes &&
      ok['push']({
        code: 'IMAGE_FILE_TOO_LARGE',
        message: 'The image file exceeds ' + Math['round'](maxBytes / 1024 / 1024) + ' MB.',
      }),
    { ok: ok['length'] === 0, errors: ok }
  );
}
async function defaultDecodeImageDimensions(
  value14,
  { createImageBitmapFn: createImageBitmapFn = globalThis['createImageBitmap'], signal: signal4 } = {},
) {
  if (typeof createImageBitmapFn !== 'function') {
    const error9 = new Error('Image dimension decoding is unavailable.');
    error9['code'] = 'IMAGE_DIMENSION_DECODER_UNAVAILABLE';
    throw error9;
  }
  throwIfAborted(signal4);
  const imageBitmapFn = await createImageBitmapFn(value14);
  try {
    throwIfAborted(signal4);
    const imageDimensions2 = imageDimensions(imageBitmapFn);
    if (!imageDimensions2) throw new Error('Decoded image dimensions are unavailable.');
    return imageDimensions2;
  } finally {
    closeResource(imageBitmapFn);
  }
}
export async function preflightStoryboard3DImageFile(
  value15,
  {
    renderer: renderer = null,
    maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES,
    signal: signal5,
    createImageBitmapFn: createImageBitmapFn = globalThis['createImageBitmap'],
    decodeImageDimensions: decodeImageDimensions = defaultDecodeImageDimensions,
    ...args3
  } = {},
) {
  throwIfAborted(signal5);
  const errors = validateStoryboard3DImageFile(value15, { maxBytes: maxBytes }),
    limits2 = resolveStoryboard3DTextureLimits({ renderer: renderer, ...args3 });
  if (!errors['ok'])
    return {
      ok: false,
      action: 'reject',
      errors: errors['errors'],
      warnings: [],
      width: null,
      height: null,
      targetWidth: null,
      targetHeight: null,
      limits: limits2,
    };
  try {
    const box5 = await decodeImageDimensions(value15, {
      signal: signal5,
      createImageBitmapFn: createImageBitmapFn,
    });
    throwIfAborted(signal5);
    const width6 = finitePositiveInteger(box5?.['width']),
      height4 = finitePositiveInteger(box5?.['height']);
    if (!width6 || !height4) throw new Error('Image dimensions are invalid.');
    const targetWidth2 = computeTargetSize(width6, height4, limits2),
      action2 = targetWidth2['width'] !== width6 || targetWidth2['height'] !== height4;
    return {
      ok: true,
      action: action2 ? 'downsample' : 'accept',
      errors: [],
      warnings: action2
        ? [
            {
              code: 'IMAGE_PIXELS_EXCEED_LIMIT',
              message:
                'Image ' +
                width6 +
                'x' +
                height4 +
                ' should be downsampled to ' +
                targetWidth2['width'] +
                'x' +
                targetWidth2['height'] +
                '.',
            },
          ]
        : [],
      width: width6,
      height: height4,
      targetWidth: targetWidth2['width'],
      targetHeight: targetWidth2['height'],
      limits: limits2,
    };
  } catch (code3) {
    if (code3?.['name'] === 'AbortError') throw code3;
    return {
      ok: true,
      action: 'accept-with-warning',
      errors: [],
      warnings: [
        {
          code: code3?.['code'] || 'IMAGE_DIMENSION_READ_FAILED',
          message: 'Image pixel dimensions could not be checked before upload.',
          cause: code3,
        },
      ],
      width: null,
      height: null,
      targetWidth: null,
      targetHeight: null,
      limits: limits2,
    };
  }
}
