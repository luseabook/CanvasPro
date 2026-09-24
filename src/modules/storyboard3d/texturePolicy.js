export const DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION = 0x1000;
export const DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS = 0x1000 * 0x1000;
export const DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES = 0x40 * 0x400 * 0x400;
const ownedTextureResources = new WeakMap();
function finitePositiveInteger(_0x506f42, _0x4885c9 = 0x0) {
  const _0x597643 = Math['floor'](Number(_0x506f42));
  return Number['isFinite'](_0x597643) && _0x597643 > 0x0 ? _0x597643 : _0x4885c9;
}
function createAbortError(_0xbb54d4 = 'Texture\x20processing\x20was\x20cancelled') {
  const _0x496bab = new Error(
    String(_0xbb54d4?.['message'] || _0xbb54d4 || 'Texture\x20processing\x20was\x20cancelled'),
  );
  return ((_0x496bab['name'] = 'AbortError'), (_0x496bab['code'] = 'ABORT_ERR'), _0x496bab);
}
function throwIfAborted(_0x56b2d9) {
  if (_0x56b2d9?.['aborted']) throw createAbortError(_0x56b2d9['reason']);
}
function textureSource(_0x410538) {
  return _0x410538?.['source']?.['data'] ?? _0x410538?.['image'] ?? null;
}
function imageDimensions(_0x6ca600) {
  if (Array['isArray'](_0x6ca600))
    return _0x6ca600['reduce']((_0x524a41, _0x484b77) => {
      const _0x3d9d14 = imageDimensions(_0x484b77);
      if (!_0x3d9d14) return _0x524a41;
      if (!_0x524a41 || _0x3d9d14['width'] * _0x3d9d14['height'] > _0x524a41['width'] * _0x524a41['height'])
        return _0x3d9d14;
      return _0x524a41;
    }, null);
  const _0x264324 = finitePositiveInteger(
      _0x6ca600?.['naturalWidth'] ?? _0x6ca600?.['videoWidth'] ?? _0x6ca600?.['width'],
    ),
    _0xac3f0 = finitePositiveInteger(
      _0x6ca600?.['naturalHeight'] ?? _0x6ca600?.['videoHeight'] ?? _0x6ca600?.['height'],
    );
  return _0x264324 && _0xac3f0 ? { width: _0x264324, height: _0xac3f0 } : null;
}
function materialTextures(_0xa374b) {
  const _0x7fd92c = new Set(),
    _0x103110 = new WeakSet(),
    _0x5a56eb = (_0x475752, _0x3bb0b4 = 0x0) => {
      if (!_0x475752 || _0x3bb0b4 > 0x4) return;
      if (_0x475752['isTexture']) {
        _0x7fd92c['add'](_0x475752);
        return;
      }
      if (_0x475752 instanceof ArrayBuffer || ArrayBuffer['isView'](_0x475752)) return;
      if (typeof _0x475752 !== 'object' || _0x103110['has'](_0x475752)) return;
      _0x103110['add'](_0x475752);
      if (Array['isArray'](_0x475752)) {
        _0x475752['forEach']((_0x4eba1a) => _0x5a56eb(_0x4eba1a, _0x3bb0b4 + 0x1));
        return;
      }
      Object['values'](_0x475752)['forEach']((_0xc4cd5f) => _0x5a56eb(_0xc4cd5f, _0x3bb0b4 + 0x1));
    };
  return (_0x5a56eb(_0xa374b), _0x7fd92c);
}
function computeTargetSize(_0x2b2d29, _0x25f0a6, _0x300f3f) {
  const _0x1bb568 = Math['min'](
      0x1,
      _0x300f3f['maxDimension'] / _0x2b2d29,
      _0x300f3f['maxDimension'] / _0x25f0a6,
    ),
    _0x44f26c = Math['min'](0x1, Math['sqrt'](_0x300f3f['maxPixels'] / (_0x2b2d29 * _0x25f0a6))),
    _0x4adae7 = Math['min'](_0x1bb568, _0x44f26c);
  return {
    width: Math['max'](0x1, Math['floor'](_0x2b2d29 * _0x4adae7)),
    height: Math['max'](0x1, Math['floor'](_0x25f0a6 * _0x4adae7)),
    scale: _0x4adae7,
  };
}
export function resolveStoryboard3DTextureLimits({
  renderer: renderer = null,
  policyMaxDimension: policyMaxDimension = DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION,
  policyMaxPixels: policyMaxPixels = DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS,
} = {}) {
  const _0x3f7b5f = finitePositiveInteger(renderer?.['capabilities']?.['maxTextureSize']),
    _0x151f05 = finitePositiveInteger(policyMaxDimension, DEFAULT_STORYBOARD_3D_TEXTURE_MAX_DIMENSION);
  return {
    maxDimension: _0x3f7b5f ? Math['min'](_0x3f7b5f, _0x151f05) : _0x151f05,
    maxPixels: finitePositiveInteger(policyMaxPixels, DEFAULT_STORYBOARD_3D_TEXTURE_MAX_PIXELS),
    hardwareMaxTextureSize: _0x3f7b5f || null,
    policyMaxDimension: _0x151f05,
  };
}
export function inspectStoryboard3DSceneTextures(_0xebaaf2, _0x4fad91 = {}) {
  const _0x4d6802 = resolveStoryboard3DTextureLimits(_0x4fad91),
    _0x3de3c0 = new Map(),
    _0x54dd7c = (_0x16cb4f, _0x200b39) => {
      if (!_0x16cb4f?.['isTexture']) return;
      if (!_0x3de3c0['has'](_0x16cb4f)) _0x3de3c0['set'](_0x16cb4f, []);
      _0x3de3c0['get'](_0x16cb4f)['push'](_0x200b39);
    };
  (_0x54dd7c(_0xebaaf2?.['background'], 'scene.background'),
    _0x54dd7c(_0xebaaf2?.['environment'], 'scene.environment'),
    _0xebaaf2?.['traverse']?.((_0x165570) => {
      const _0x2ec065 = Array['isArray'](_0x165570?.['material'])
        ? _0x165570['material']
        : [_0x165570?.['material']];
      _0x2ec065['filter'](Boolean)['forEach']((_0x4a5861, _0x24d1e6) => {
        materialTextures(_0x4a5861)['forEach']((_0x5b2d5a) =>
          _0x54dd7c(
            _0x5b2d5a,
            String(_0x165570?.['name'] || _0x165570?.['uuid'] || _0x165570?.['type'] || 'object') +
              '.material[' +
              _0x24d1e6 +
              ']',
          ),
        );
      });
    }));
  const _0x80bd58 = [..._0x3de3c0['entries']()]['map'](([_0x40e2e7, _0x3c5279], _0x593305) => {
    const _0x27467e = textureSource(_0x40e2e7),
      _0x178e9c = imageDimensions(_0x27467e);
    if (!_0x178e9c)
      return {
        texture: _0x40e2e7,
        textureIndex: _0x593305,
        references: _0x3c5279,
        width: null,
        height: null,
        pixelCount: null,
        targetWidth: null,
        targetHeight: null,
        action: 'warning',
        reasons: ['TEXTURE_DIMENSIONS_UNKNOWN'],
      };
    const _0x307ab3 = computeTargetSize(_0x178e9c['width'], _0x178e9c['height'], _0x4d6802),
      _0x2c1459 = [];
    return (
      (_0x178e9c['width'] > _0x4d6802['maxDimension'] || _0x178e9c['height'] > _0x4d6802['maxDimension']) &&
        _0x2c1459['push']('TEXTURE_DIMENSION_EXCEEDS_LIMIT'),
      _0x178e9c['width'] * _0x178e9c['height'] > _0x4d6802['maxPixels'] &&
        _0x2c1459['push']('TEXTURE_PIXEL_COUNT_EXCEEDS_LIMIT'),
      {
        texture: _0x40e2e7,
        textureIndex: _0x593305,
        references: _0x3c5279,
        width: _0x178e9c['width'],
        height: _0x178e9c['height'],
        pixelCount: _0x178e9c['width'] * _0x178e9c['height'],
        targetWidth: _0x307ab3['width'],
        targetHeight: _0x307ab3['height'],
        action: _0x2c1459['length'] ? 'downsample' : 'keep',
        reasons: _0x2c1459,
      }
    );
  });
  return {
    limits: _0x4d6802,
    textures: _0x80bd58,
    total: _0x80bd58['length'],
    oversized: _0x80bd58['filter']((_0x354dcc) => _0x354dcc['action'] === 'downsample')['length'],
    warnings: _0x80bd58['filter']((_0x1094b9) => _0x1094b9['action'] === 'warning')['length'],
  };
}
function closeResource(_0x3a9353) {
  try {
    _0x3a9353?.['close']?.();
  } catch {}
}
export function releaseStoryboard3DTexturePolicyResource(_0x392e1c) {
  const _0x351907 = ownedTextureResources['get'](_0x392e1c);
  if (!_0x351907) return ![];
  return (
    ownedTextureResources['delete'](_0x392e1c),
    _0x392e1c?.['removeEventListener']?.('dispose', _0x351907['onDispose']),
    closeResource(_0x351907['resource']),
    !![]
  );
}
function ownTextureResource(_0x8a0c46, _0x3ff4da) {
  releaseStoryboard3DTexturePolicyResource(_0x8a0c46);
  const _0x20571f = () => releaseStoryboard3DTexturePolicyResource(_0x8a0c46);
  (ownedTextureResources['set'](_0x8a0c46, { resource: _0x3ff4da, onDispose: _0x20571f }),
    _0x8a0c46?.['addEventListener']?.('dispose', _0x20571f));
}
function defaultCreateCanvas(
  _0xb9d43,
  _0x3f93fa,
  {
    OffscreenCanvasConstructor: OffscreenCanvasConstructor = globalThis['OffscreenCanvas'],
    documentObject: documentObject = globalThis['document'],
  } = {},
) {
  if (typeof OffscreenCanvasConstructor === 'function')
    return new OffscreenCanvasConstructor(_0xb9d43, _0x3f93fa);
  const _0x3f1b11 = documentObject?.['createElement']?.('canvas');
  if (!_0x3f1b11) return null;
  return ((_0x3f1b11['width'] = _0xb9d43), (_0x3f1b11['height'] = _0x3f93fa), _0x3f1b11);
}
async function createDownsampledSource(
  _0x33a869,
  _0x51a118,
  _0x40ba40,
  {
    signal: _0x5807f3,
    createImageBitmapFn: createImageBitmapFn = globalThis['createImageBitmap'],
    createCanvas: _0x9175d6,
    OffscreenCanvasConstructor: _0x471ebe,
    documentObject: _0x4b5880,
  } = {},
) {
  const _0x4c1c7c = [];
  if (typeof createImageBitmapFn === 'function')
    try {
      const _0x483d3e = await createImageBitmapFn(_0x33a869, {
        resizeWidth: _0x51a118,
        resizeHeight: _0x40ba40,
        resizeQuality: 'high',
      });
      if (_0x5807f3?.['aborted']) {
        closeResource(_0x483d3e);
        throw createAbortError(_0x5807f3['reason']);
      }
      return { source: _0x483d3e, ownedResource: _0x483d3e, method: 'createImageBitmap' };
    } catch (_0x2df075) {
      if (_0x2df075?.['name'] === 'AbortError') throw _0x2df075;
      _0x4c1c7c['push'](_0x2df075);
    }
  throwIfAborted(_0x5807f3);
  try {
    const _0x2966f1 =
      typeof _0x9175d6 === 'function'
        ? await _0x9175d6(_0x51a118, _0x40ba40)
        : defaultCreateCanvas(_0x51a118, _0x40ba40, {
            OffscreenCanvasConstructor: _0x471ebe,
            documentObject: _0x4b5880,
          });
    if (!_0x2966f1) throw new Error('Canvas creation is unavailable');
    ((_0x2966f1['width'] = _0x51a118), (_0x2966f1['height'] = _0x40ba40));
    const _0x1b94fb = _0x2966f1['getContext']?.('2d', { alpha: !![] });
    if (!_0x1b94fb?.['drawImage']) throw new Error('A drawable 2D canvas context is unavailable');
    (_0x1b94fb['drawImage'](_0x33a869, 0x0, 0x0, _0x51a118, _0x40ba40), throwIfAborted(_0x5807f3));
    if (typeof _0x2966f1['transferToImageBitmap'] === 'function') {
      const _0x505b90 = _0x2966f1['transferToImageBitmap']();
      if (_0x5807f3?.['aborted']) {
        closeResource(_0x505b90);
        throw createAbortError(_0x5807f3['reason']);
      }
      return { source: _0x505b90, ownedResource: _0x505b90, method: 'offscreen-canvas' };
    }
    return { source: _0x2966f1, ownedResource: null, method: 'canvas' };
  } catch (_0x30833) {
    if (_0x30833?.['name'] === 'AbortError') throw _0x30833;
    _0x4c1c7c['push'](_0x30833);
  }
  const _0x507ebe = new Error('Texture cannot be downsampled in this runtime.');
  ((_0x507ebe['code'] = 'TEXTURE_DOWNSAMPLE_UNAVAILABLE'), (_0x507ebe['causes'] = _0x4c1c7c));
  throw _0x507ebe;
}
export async function downsampleStoryboard3DTexture(
  _0x3f778d,
  { width: _0xa59772, height: _0x3f9de4, signal: _0x12309f, ..._0x4cc8d7 } = {},
) {
  if (!_0x3f778d?.['isTexture']) throw new TypeError('A Three.js texture is required.');
  const _0x4034c3 = textureSource(_0x3f778d);
  if (
    !_0x4034c3 ||
    Array['isArray'](_0x4034c3) ||
    _0x3f778d['isCompressedTexture'] ||
    _0x3f778d['isDataTexture']
  ) {
    const _0x188b9d = new Error('Texture\x20source\x20is\x20not\x20a\x20drawable\x202D\x20image.');
    _0x188b9d['code'] = 'TEXTURE_DOWNSAMPLE_UNAVAILABLE';
    throw _0x188b9d;
  }
  const _0x1a8960 = finitePositiveInteger(_0xa59772),
    _0x483d0b = finitePositiveInteger(_0x3f9de4);
  if (!_0x1a8960 || !_0x483d0b) throw new TypeError('Positive target dimensions are required.');
  throwIfAborted(_0x12309f);
  const _0x2b15fd = { colorSpace: _0x3f778d['colorSpace'], flipY: _0x3f778d['flipY'] },
    _0x53b921 = await createDownsampledSource(_0x4034c3, _0x1a8960, _0x483d0b, {
      signal: _0x12309f,
      ..._0x4cc8d7,
    });
  if (_0x12309f?.['aborted']) {
    closeResource(_0x53b921['ownedResource']);
    throw createAbortError(_0x12309f['reason']);
  }
  try {
    ((_0x3f778d['image'] = _0x53b921['source']),
      (_0x3f778d['colorSpace'] = _0x2b15fd['colorSpace']),
      (_0x3f778d['flipY'] = _0x2b15fd['flipY']),
      (_0x3f778d['needsUpdate'] = !![]));
  } catch (_0x37843d) {
    try {
      ((_0x3f778d['image'] = _0x4034c3),
        (_0x3f778d['colorSpace'] = _0x2b15fd['colorSpace']),
        (_0x3f778d['flipY'] = _0x2b15fd['flipY']));
    } catch {}
    closeResource(_0x53b921['ownedResource']);
    throw _0x37843d;
  }
  if (_0x53b921['ownedResource']) ownTextureResource(_0x3f778d, _0x53b921['ownedResource']);
  else releaseStoryboard3DTexturePolicyResource(_0x3f778d);
  return { texture: _0x3f778d, width: _0x1a8960, height: _0x483d0b, method: _0x53b921['method'] };
}
export async function applyStoryboard3DTexturePolicy(
  _0x5331aa,
  { signal: _0x3dadc7, onProgress: _0x5f1a1b, ..._0x523324 } = {},
) {
  throwIfAborted(_0x3dadc7);
  const _0x228852 = inspectStoryboard3DSceneTextures(_0x5331aa, _0x523324),
    _0x4bd55b = [],
    _0x468868 = _0x228852['textures']
      ['filter']((_0x97f14c) => _0x97f14c['action'] === 'warning')
      ['map']((_0x89dd21) => ({
        code: _0x89dd21['reasons'][0x0],
        texture: _0x89dd21['texture'],
        references: _0x89dd21['references'],
        message:
          'Texture\x20dimensions\x20could\x20not\x20be\x20determined;\x20the\x20texture\x20was\x20kept\x20unchanged.',
      })),
    _0x400ac3 = _0x228852['textures']['filter']((_0xb92078) => _0xb92078['action'] === 'downsample');
  for (let _0x1a8f07 = 0x0; _0x1a8f07 < _0x400ac3['length']; _0x1a8f07 += 0x1) {
    throwIfAborted(_0x3dadc7);
    const _0x7c2fff = _0x400ac3[_0x1a8f07];
    try {
      const _0x595dda = await downsampleStoryboard3DTexture(_0x7c2fff['texture'], {
        width: _0x7c2fff['targetWidth'],
        height: _0x7c2fff['targetHeight'],
        signal: _0x3dadc7,
        ..._0x523324,
      });
      _0x4bd55b['push']({ ..._0x7c2fff, method: _0x595dda['method'] });
    } catch (_0x10fa4f) {
      if (_0x10fa4f?.['name'] === 'AbortError') throw _0x10fa4f;
      _0x468868['push']({
        code: _0x10fa4f?.['code'] || 'TEXTURE_DOWNSAMPLE_FAILED',
        texture: _0x7c2fff['texture'],
        references: _0x7c2fff['references'],
        message:
          'Texture ' +
          _0x7c2fff['width'] +
          'x' +
          _0x7c2fff['height'] +
          ' exceeds the ' +
          _0x228852['limits']['maxDimension'] +
          'px / ' +
          _0x228852['limits']['maxPixels'] +
          ' pixel policy but could not be downsampled.',
        cause: _0x10fa4f,
      });
    }
    _0x5f1a1b?.({
      completed: _0x1a8f07 + 0x1,
      total: _0x400ac3['length'],
      progress: _0x400ac3['length'] ? (_0x1a8f07 + 0x1) / _0x400ac3['length'] : 0x1,
    });
  }
  return {
    inspection: _0x228852,
    optimized: _0x4bd55b,
    warnings: _0x468868,
    disposeOwnedResources() {
      _0x4bd55b['forEach']((_0x3121e3) => releaseStoryboard3DTexturePolicyResource(_0x3121e3['texture']));
    },
  };
}
export function validateStoryboard3DImageFile(
  _0x418c93,
  { maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES } = {},
) {
  const _0x436189 = [],
    _0x4e5499 = String(_0x418c93?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x2b840f = Number(_0x418c93?.['size']);
  if (!String(_0x418c93?.['name'] || '')['trim']())
    _0x436189['push']({
      code: 'IMAGE_FILE_NAME_REQUIRED',
      message: 'Image\x20file\x20name\x20is\x20required.',
    });
  if (!_0x4e5499['startsWith']('image/'))
    _0x436189['push']({ code: 'IMAGE_FILE_TYPE_INVALID', message: 'The selected file is not an image.' });
  if (!Number['isFinite'](_0x2b840f) || _0x2b840f <= 0x0)
    _0x436189['push']({ code: 'IMAGE_FILE_EMPTY', message: 'The image file is empty.' });
  return (
    Number['isFinite'](_0x2b840f) &&
      _0x2b840f > maxBytes &&
      _0x436189['push']({
        code: 'IMAGE_FILE_TOO_LARGE',
        message: 'The image file exceeds ' + Math['round'](maxBytes / 0x400 / 0x400) + ' MB.',
      }),
    { ok: _0x436189['length'] === 0x0, errors: _0x436189 }
  );
}
async function defaultDecodeImageDimensions(
  _0x404181,
  { createImageBitmapFn: createImageBitmapFn = globalThis['createImageBitmap'], signal: _0x25eea5 } = {},
) {
  if (typeof createImageBitmapFn !== 'function') {
    const _0x51cd6e = new Error('Image\x20dimension\x20decoding\x20is\x20unavailable.');
    _0x51cd6e['code'] = 'IMAGE_DIMENSION_DECODER_UNAVAILABLE';
    throw _0x51cd6e;
  }
  throwIfAborted(_0x25eea5);
  const _0x44982f = await createImageBitmapFn(_0x404181);
  try {
    throwIfAborted(_0x25eea5);
    const _0x43c963 = imageDimensions(_0x44982f);
    if (!_0x43c963) throw new Error('Decoded image dimensions are unavailable.');
    return _0x43c963;
  } finally {
    closeResource(_0x44982f);
  }
}
export async function preflightStoryboard3DImageFile(
  _0x45c75e,
  {
    renderer: renderer = null,
    maxBytes: maxBytes = DEFAULT_STORYBOARD_3D_IMAGE_MAX_BYTES,
    signal: _0x20f859,
    createImageBitmapFn: createImageBitmapFn = globalThis['createImageBitmap'],
    decodeImageDimensions: decodeImageDimensions = defaultDecodeImageDimensions,
    ..._0x389940
  } = {},
) {
  throwIfAborted(_0x20f859);
  const _0x55ee44 = validateStoryboard3DImageFile(_0x45c75e, { maxBytes: maxBytes }),
    _0x465964 = resolveStoryboard3DTextureLimits({ renderer: renderer, ..._0x389940 });
  if (!_0x55ee44['ok'])
    return {
      ok: ![],
      action: 'reject',
      errors: _0x55ee44['errors'],
      warnings: [],
      width: null,
      height: null,
      targetWidth: null,
      targetHeight: null,
      limits: _0x465964,
    };
  try {
    const _0x136d3f = await decodeImageDimensions(_0x45c75e, {
      signal: _0x20f859,
      createImageBitmapFn: createImageBitmapFn,
    });
    throwIfAborted(_0x20f859);
    const _0x34399e = finitePositiveInteger(_0x136d3f?.['width']),
      _0x2e19a6 = finitePositiveInteger(_0x136d3f?.['height']);
    if (!_0x34399e || !_0x2e19a6) throw new Error('Image dimensions are invalid.');
    const _0x1158de = computeTargetSize(_0x34399e, _0x2e19a6, _0x465964),
      _0x1e4840 = _0x1158de['width'] !== _0x34399e || _0x1158de['height'] !== _0x2e19a6;
    return {
      ok: !![],
      action: _0x1e4840 ? 'downsample' : 'accept',
      errors: [],
      warnings: _0x1e4840
        ? [
            {
              code: 'IMAGE_PIXELS_EXCEED_LIMIT',
              message:
                'Image ' +
                _0x34399e +
                'x' +
                _0x2e19a6 +
                '\x20should\x20be\x20downsampled\x20to\x20' +
                _0x1158de['width'] +
                'x' +
                _0x1158de['height'] +
                '.',
            },
          ]
        : [],
      width: _0x34399e,
      height: _0x2e19a6,
      targetWidth: _0x1158de['width'],
      targetHeight: _0x1158de['height'],
      limits: _0x465964,
    };
  } catch (_0x179d7e) {
    if (_0x179d7e?.['name'] === 'AbortError') throw _0x179d7e;
    return {
      ok: !![],
      action: 'accept-with-warning',
      errors: [],
      warnings: [
        {
          code: _0x179d7e?.['code'] || 'IMAGE_DIMENSION_READ_FAILED',
          message: 'Image pixel dimensions could not be checked before upload.',
          cause: _0x179d7e,
        },
      ],
      width: null,
      height: null,
      targetWidth: null,
      targetHeight: null,
      limits: _0x465964,
    };
  }
}
