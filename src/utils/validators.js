export function isValidString(_0x288cfd) {
  return typeof _0x288cfd === 'string' && _0x288cfd.trim().length > 0;
}
export function isValidNumber(_0x45426c, _0x82328c = {}) {
  const { min: _0x453a90, max: _0x463329, integer: integer = false } = _0x82328c;
  if (_0x45426c === null || _0x45426c === undefined || _0x45426c === '') return false;
  const _0x363d0f = Number(_0x45426c);
  if (isNaN(_0x363d0f) || !isFinite(_0x363d0f)) return false;
  if (integer && !Number.isInteger(_0x363d0f)) return false;
  if (_0x453a90 !== undefined && _0x363d0f < _0x453a90) return false;
  if (_0x463329 !== undefined && _0x363d0f > _0x463329) return false;
  return true;
}
export function isValidEmail(_0x2365c2) {
  if (!_0x2365c2) return false;
  const _0x2011b6 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return _0x2011b6.test(_0x2365c2);
}
export function isValidUrl(_0x36466b) {
  if (!_0x36466b) return false;
  try {
    return (new URL(_0x36466b), true);
  } catch {
    return false;
  }
}
export function isValidImageUrl(_0x5654d3) {
  if (!isValidUrl(_0x5654d3)) return false;
  const _0x5ee484 = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'],
    _0x376658 = _0x5654d3.toLowerCase();
  return _0x5ee484.some((_0x1b6fa5) => _0x376658.includes(_0x1b6fa5)) || _0x376658.startsWith('data:image/');
}
export function isValidColor(_0x2d877a) {
  if (!_0x2d877a) return false;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(_0x2d877a)) return true;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/.test(_0x2d877a)) return true;
  if (/^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(\s*,\s*[\d.]+)?\s*\)$/.test(_0x2d877a)) return true;
  const _0x291d71 = ['transparent', 'inherit', 'initial', 'unset'];
  if (_0x291d71.includes(_0x2d877a.toLowerCase())) return true;
  return false;
}
export function isEmptyObject(_0x224035) {
  if (!_0x224035 || typeof _0x224035 !== 'object') return true;
  return Object.keys(_0x224035).length === 0;
}
export function isEmptyArray(_0xe36f2a) {
  return !Array.isArray(_0xe36f2a) || _0xe36f2a.length === 0;
}
export function isBase64(_0x56c973) {
  if (!_0x56c973) return false;
  const _0x69694 = /^[A-Za-z0-9+/]*={0,2}$/;
  return _0x69694.test(_0x56c973) && _0x56c973.length % 4 === 0;
}
export function isDataUrl(_0x52d10a) {
  if (!_0x52d10a) return false;
  return /^data:([\w/+-]+);base64,/.test(_0x52d10a);
}
export function isValidFileType(_0x27ea5f, _0x25be38) {
  if (!_0x27ea5f || !_0x25be38 || !Array.isArray(_0x25be38)) return false;
  const _0x1fa211 = _0x27ea5f.split('.').pop()?.toLowerCase();
  return _0x25be38.map((_0x92581c) => _0x92581c.toLowerCase()).includes(_0x1fa211);
}
export function isValidFileSize(_0x53b9b9, _0xcc8c68) {
  return typeof _0x53b9b9 === 'number' && _0x53b9b9 > 0 && _0x53b9b9 <= _0xcc8c68;
}
export function validateNode(_0x2a4723) {
  const _0x57bf61 = [];
  if (!_0x2a4723) return (_0x57bf61.push('节点数据为空'), { valid: false, errors: _0x57bf61 });
  return (
    (!_0x2a4723.id || typeof _0x2a4723.id !== 'string') && _0x57bf61.push('节点缺少有效 ID'),
    (!_0x2a4723.type || typeof _0x2a4723.type !== 'string') && _0x57bf61.push('节点缺少有效类型'),
    (typeof _0x2a4723.x !== 'number' || isNaN(_0x2a4723.x)) && _0x57bf61.push('节点 X 坐标无效'),
    (typeof _0x2a4723.y !== 'number' || isNaN(_0x2a4723.y)) && _0x57bf61.push('节点 Y 坐标无效'),
    { valid: _0x57bf61.length === 0, errors: _0x57bf61 }
  );
}
export function validateCanvasData(_0x2d1bf4) {
  const _0x50935e = [];
  if (!_0x2d1bf4) return (_0x50935e.push('数据为空'), { valid: false, errors: _0x50935e });
  (!_0x2d1bf4.nodes || typeof _0x2d1bf4.nodes !== 'object') && _0x50935e.push('缺少节点数据');
  (!_0x2d1bf4.edges || !Array.isArray(_0x2d1bf4.edges)) && _0x50935e.push('缺少连线数据');
  if (_0x2d1bf4.viewport) {
    const _0x49bb7f = _0x2d1bf4.viewport;
    if (typeof _0x49bb7f.x !== 'number') _0x50935e.push('视口 X 坐标无效');
    if (typeof _0x49bb7f.y !== 'number') _0x50935e.push('视口 Y 坐标无效');
    if (typeof _0x49bb7f.zoom !== 'number' || _0x49bb7f.zoom <= 0) _0x50935e.push('视口缩放值无效');
  }
  return { valid: _0x50935e.length === 0, errors: _0x50935e };
}
export function firstNonEmpty(..._0x51068b) {
  for (const _0x4d921f of _0x51068b) {
    if (typeof _0x4d921f === 'string' && _0x4d921f.trim()) return _0x4d921f;
  }
  return '';
}
