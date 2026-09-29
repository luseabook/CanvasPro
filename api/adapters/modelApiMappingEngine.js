function isPlainObject(_0x5f4909) {
  return !!_0x5f4909 && typeof _0x5f4909 === 'object' && !Array.isArray(_0x5f4909);
}
function isPresentValue(_0x494eb2) {
  if (_0x494eb2 === undefined || _0x494eb2 === null) return false;
  if (typeof _0x494eb2 === 'string') return _0x494eb2.trim() !== '';
  if (Array.isArray(_0x494eb2)) return _0x494eb2.length > 0;
  return true;
}
export function getPathValue(_0x1a356e, _0x4eb0a5) {
  const _0x5527bf = String(_0x4eb0a5 || '').trim();
  if (!_0x5527bf) return undefined;
  return _0x5527bf.split('.').reduce((_0x2f2f69, _0x479a3f) => {
    if (_0x2f2f69 === undefined || _0x2f2f69 === null) return undefined;
    return _0x2f2f69[_0x479a3f];
  }, _0x1a356e);
}
export function setPathValue(_0x47ea27, _0x2859a2, _0x13166b) {
  const _0x339f75 = String(_0x2859a2 || '').trim();
  if (!_0x339f75) return _0x47ea27;
  const _0xe34ff0 = _0x339f75.split('.').filter(Boolean);
  if (_0xe34ff0.length === 0) return _0x47ea27;
  let _0x179e63 = _0x47ea27;
  for (let _0x3b8506 = 0; _0x3b8506 < _0xe34ff0.length - 1; _0x3b8506 += 1) {
    const _0x2e4556 = _0xe34ff0[_0x3b8506];
    if (!isPlainObject(_0x179e63[_0x2e4556])) _0x179e63[_0x2e4556] = {};
    _0x179e63 = _0x179e63[_0x2e4556];
  }
  return ((_0x179e63[_0xe34ff0[_0xe34ff0.length - 1]] = _0x13166b), _0x47ea27);
}
function normalizeFieldList(_0x4651e2) {
  const _0x27010a = _0x4651e2?.fields !== undefined ? _0x4651e2.fields : _0x4651e2?.field,
    _0x395e77 = Array.isArray(_0x27010a) ? _0x27010a : [_0x27010a];
  return _0x395e77.map((_0x123d3d) => String(_0x123d3d || '').trim()).filter(Boolean);
}
function resolveFirstPayloadValue(_0x3a8548, _0x19fc61) {
  for (const _0xdf82e7 of _0x19fc61) {
    const _0x4df712 = getPathValue(_0x3a8548, _0xdf82e7);
    if (isPresentValue(_0x4df712)) return _0x4df712;
  }
  return undefined;
}
function valuesEqual(_0x55ced3, _0x40606d) {
  if (typeof _0x40606d === 'boolean') {
    const _0x19fe21 = String(_0x55ced3 ?? '')
      .trim()
      .toLowerCase();
    return _0x55ced3 === _0x40606d || _0x19fe21 === String(_0x40606d);
  }
  if (typeof _0x40606d === 'number') return Number(_0x55ced3) === _0x40606d;
  return String(_0x55ced3 ?? '').trim() === String(_0x40606d ?? '').trim();
}
function evaluateWhenRule(_0x32bf92, _0x32dadf) {
  if (!_0x32bf92 || typeof _0x32bf92 !== 'object') return true;
  const _0x36d594 = _0x32bf92.field ? getPathValue(_0x32dadf.payload || {}, _0x32bf92.field) : undefined,
    _0x32f404 = isPresentValue(_0x36d594);
  if (Object.prototype.hasOwnProperty.call(_0x32bf92, 'exists')) {
    if (Boolean(_0x32bf92.exists) !== _0x32f404) return false;
  }
  if (_0x32bf92.truthy === true && !Boolean(_0x36d594)) return false;
  if (_0x32bf92.falsy === true && Boolean(_0x36d594)) return false;
  if (Object.prototype.hasOwnProperty.call(_0x32bf92, 'equals') && !valuesEqual(_0x36d594, _0x32bf92.equals))
    return false;
  if (
    Object.prototype.hasOwnProperty.call(_0x32bf92, 'notEquals') &&
    valuesEqual(_0x36d594, _0x32bf92.notEquals)
  )
    return false;
  if (Array.isArray(_0x32bf92.in) && !_0x32bf92.in.some((_0x23cdd8) => valuesEqual(_0x36d594, _0x23cdd8)))
    return false;
  if (
    Array.isArray(_0x32bf92.notIn) &&
    _0x32bf92.notIn.some((_0x3084e5) => valuesEqual(_0x36d594, _0x3084e5))
  )
    return false;
  return true;
}
function shouldApplyEntry(_0x4d39a5, _0xa680b6) {
  if (!_0x4d39a5?.when) return true;
  if (Array.isArray(_0x4d39a5.when))
    return _0x4d39a5.when.every((_0x39c7a3) => evaluateWhenRule(_0x39c7a3, _0xa680b6));
  return evaluateWhenRule(_0x4d39a5.when, _0xa680b6);
}
function normalizeMappingEntries(_0x43eafe) {
  if (Array.isArray(_0x43eafe)) return _0x43eafe;
  if (Array.isArray(_0x43eafe?.entries)) return _0x43eafe.entries;
  return [];
}
function resolveEntrySourceValue(_0x44ea51, _0x2e378d) {
  const _0x1e6863 = String(_0x44ea51?.from || '').trim();
  if (_0x1e6863 === 'prompt') return _0x2e378d.finalPrompt || '';
  if (_0x1e6863 === 'param')
    return resolveFirstPayloadValue(_0x2e378d.payload || {}, normalizeFieldList(_0x44ea51));
  if (_0x1e6863 === 'inputImages') return _0x2e378d.inputImages || [];
  if (_0x1e6863 === 'inputVideos') return _0x2e378d.inputVideos || [];
  if (_0x1e6863 === 'inputAudios') return _0x2e378d.inputAudios || [];
  if (_0x1e6863 === 'model') return _0x2e378d.modelToken || '';
  if (_0x1e6863 === 'constant')
    return Object.prototype.hasOwnProperty.call(_0x44ea51, 'value')
      ? _0x44ea51.value
      : _0x44ea51.defaultValue;
  return undefined;
}
function normalizeTransformList(_0x3264a8) {
  if (!_0x3264a8) return [];
  return Array.isArray(_0x3264a8) ? _0x3264a8 : [_0x3264a8];
}
async function applyTransforms(_0x56940d, _0x2a768e, _0x158590, _0x45ef38) {
  let _0x1f1ab2 = _0x56940d;
  for (const _0xafa6f2 of normalizeTransformList(_0x2a768e?.transform)) {
    const _0x59c10b =
        typeof _0xafa6f2 === 'string'
          ? { name: _0xafa6f2 }
          : isPlainObject(_0xafa6f2)
            ? _0xafa6f2
            : { name: '' },
      _0x1cb98f = String(_0x59c10b.name || '').trim();
    if (!_0x1cb98f) continue;
    const _0x38a408 = _0x45ef38?.[_0x1cb98f];
    if (typeof _0x38a408 !== 'function')
      throw new Error('Unsupported model API bodyMapping transform: ' + _0x1cb98f);
    _0x1f1ab2 = await _0x38a408(_0x1f1ab2, { entry: _0x2a768e, context: _0x158590, spec: _0x59c10b });
  }
  return _0x1f1ab2;
}
export async function buildBodyFromMapping({
  bodyMapping: _0xadf0e2,
  context: _0x5899d1,
  transforms: transforms = {},
}) {
  const _0xedd69b = {},
    _0x13b498 = normalizeMappingEntries(_0xadf0e2),
    _0x2deb03 = { ..._0x5899d1, body: _0xedd69b };
  for (const _0x3e4474 of _0x13b498) {
    if (!_0x3e4474?.path || !shouldApplyEntry(_0x3e4474, _0x2deb03)) continue;
    let _0x3fdf10 = resolveEntrySourceValue(_0x3e4474, _0x2deb03);
    !isPresentValue(_0x3fdf10) &&
      Object.prototype.hasOwnProperty.call(_0x3e4474, 'defaultValue') &&
      (_0x3fdf10 = _0x3e4474.defaultValue);
    _0x3fdf10 = await applyTransforms(_0x3fdf10, _0x3e4474, _0x2deb03, transforms);
    if (_0x3e4474.omitWhenEmpty === true && !isPresentValue(_0x3fdf10)) continue;
    setPathValue(_0xedd69b, _0x3e4474.path, _0x3fdf10);
  }
  return _0xedd69b;
}
function collectValuesByPath(_0xb7ee1a, _0x180bb4) {
  const _0x10bc6d = String(_0x180bb4 || '')
    .trim()
    .split('.')
    .filter(Boolean);
  if (_0x10bc6d.length === 0) return [];
  const _0x28d100 = (_0x585093, _0x23185b) => {
    if (_0x585093 === undefined || _0x585093 === null) return [];
    if (_0x23185b >= _0x10bc6d.length) return Array.isArray(_0x585093) ? _0x585093 : [_0x585093];
    const _0x28ac3b = _0x10bc6d[_0x23185b];
    if (_0x28ac3b.endsWith('[]')) {
      const _0x8619d5 = _0x28ac3b.slice(0, -2),
        _0x3a5577 = _0x8619d5 ? _0x585093?.[_0x8619d5] : _0x585093;
      if (!Array.isArray(_0x3a5577)) return [];
      return _0x3a5577.flatMap((_0x54a7f3) => _0x28d100(_0x54a7f3, _0x23185b + 1));
    }
    return _0x28d100(_0x585093?.[_0x28ac3b], _0x23185b + 1);
  };
  return _0x28d100(_0xb7ee1a, 0).flatMap((_0x121dd4) => (Array.isArray(_0x121dd4) ? _0x121dd4 : [_0x121dd4]));
}
export function resolveMappedResponseValues(_0x301424, _0x4f735a = []) {
  const _0x21ba97 = Array.isArray(_0x4f735a) ? _0x4f735a : [_0x4f735a],
    _0xef30af = [];
  for (const _0x1e0dcc of _0x21ba97) {
    for (const _0x4e3177 of collectValuesByPath(_0x301424, _0x1e0dcc)) {
      if (_0x4e3177 && typeof _0x4e3177 === 'object') {
        const _0x3d2d27 =
          _0x4e3177.url ||
          _0x4e3177.imageUrl ||
          _0x4e3177.image_url ||
          _0x4e3177.videoUrl ||
          _0x4e3177.video_url ||
          _0x4e3177.fileUrl;
        if (_0x3d2d27) _0xef30af.push(String(_0x3d2d27).trim());
        continue;
      }
      const _0x8b74f4 = String(_0x4e3177 ?? '').trim();
      if (_0x8b74f4) _0xef30af.push(_0x8b74f4);
    }
  }
  return Array.from(new Set(_0xef30af.filter(Boolean)));
}
function normalizeImageMimeType(_0x5ac923, _0x3acb65 = 'image/png') {
  const _0x49b9ab = String(_0x5ac923 || '')
    .trim()
    .toLowerCase();
  if (/^image\/[a-z0-9.+-]{1,64}$/.test(_0x49b9ab)) return _0x49b9ab;
  const _0x46a30f = String(_0x3acb65 || '')
    .trim()
    .toLowerCase();
  return /^image\/[a-z0-9.+-]{1,64}$/.test(_0x46a30f) ? _0x46a30f : 'image/png';
}
function normalizeImageBase64DataUrl(_0x16c274, _0x2e9ca3) {
  const _0x149151 = String(_0x16c274 || '').trim();
  if (/^data:image\/[a-z0-9.+-]{1,64};base64,[a-z0-9+/=_-]+$/i.test(_0x149151)) return _0x149151;
  const _0x269a65 = _0x149151.replace(/\s+/g, '');
  if (!_0x269a65 || !/^[a-z0-9+/=_-]+$/i.test(_0x269a65)) return '';
  try {
    const _0xc5c351 = atob(_0x269a65.slice(0, 0x18).replace(/-/g, '+').replace(/_/g, '/'));
    if (_0xc5c351.startsWith('ÿØÿ')) _0x2e9ca3 = 'image/jpeg';
    else if (_0xc5c351.startsWith('PNG\r\n\u001a\n')) _0x2e9ca3 = 'image/png';
    else if (/^GIF8[79]a/.test(_0xc5c351)) _0x2e9ca3 = 'image/gif';
    else if (_0xc5c351.startsWith('RIFF') && _0xc5c351.slice(8, 12) === 'WEBP') _0x2e9ca3 = 'image/webp';
  } catch {}
  return 'data:' + _0x2e9ca3 + ';base64,' + _0x269a65;
}
export function resolveMappedImageResponseValues(_0x3fa6e7, _0x5e85e9 = {}) {
  const _0x3f1f0a = resolveMappedResponseValues(
      _0x3fa6e7,
      _0x5e85e9?.['resultPaths'] || _0x5e85e9?.['paths'],
    ),
    _0x3d1464 = Array.isArray(_0x5e85e9?.['base64Paths']) ? _0x5e85e9['base64Paths'] : [],
    _0xc1c619 = Array.isArray(_0x5e85e9?.['base64MimeTypePaths']) ? _0x5e85e9['base64MimeTypePaths'] : [],
    _0x59ff62 = _0xc1c619.flatMap((_0x58d7bf) => collectValuesByPath(_0x3fa6e7, _0x58d7bf)),
    _0x4d66a7 = normalizeImageMimeType(_0x5e85e9?.['base64DefaultMimeType']),
    _0x392059 = _0x3d1464.flatMap((_0x196021) => collectValuesByPath(_0x3fa6e7, _0x196021)),
    _0x274d4f = _0x392059
      .map((_0x2249bd, _0x4f3317) =>
        normalizeImageBase64DataUrl(_0x2249bd, normalizeImageMimeType(_0x59ff62[_0x4f3317], _0x4d66a7)),
      )
      .filter(Boolean);
  return Array.from(new Set([..._0x3f1f0a, ..._0x274d4f]));
}
export function resolveMappedResponseValue(_0x432c0f, _0x210702 = []) {
  return resolveMappedResponseValues(_0x432c0f, _0x210702)[0] || '';
}
