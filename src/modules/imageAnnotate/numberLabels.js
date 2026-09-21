const MIN_NUMBER_LABEL_DIAMETER_PX = 18,
  getFiniteNumber = (_0x4f5a6c, _0x2c4143 = 0) => {
    const _0x224221 = Number(_0x4f5a6c);
    return Number.isFinite(_0x224221) ? _0x224221 : _0x2c4143;
  },
  getFinitePoint = (_0x53550a) => {
    const _0x2c2abb = Number(_0x53550a?.x),
      _0x457280 = Number(_0x53550a?.y);
    if (!Number.isFinite(_0x2c2abb) || !Number.isFinite(_0x457280)) return null;
    return { x: _0x2c2abb, y: _0x457280 };
  },
  getDistanceSq = (_0x448403, _0x416869) => {
    const _0x7cf907 = _0x448403.x - _0x416869.x,
      _0x19a41f = _0x448403.y - _0x416869.y;
    return _0x7cf907 * _0x7cf907 + _0x19a41f * _0x19a41f;
  },
  getDistanceSqToSegment = (_0x4d666c, _0x12c675, _0x1bfffd) => {
    const _0x3d45df = _0x1bfffd.x - _0x12c675.x,
      _0x499247 = _0x1bfffd.y - _0x12c675.y,
      _0x84ec2d = _0x3d45df * _0x3d45df + _0x499247 * _0x499247;
    if (_0x84ec2d <= 0) return getDistanceSq(_0x4d666c, _0x12c675);
    const _0xfc8578 = Math.max(
      0,
      Math.min(
        1,
        ((_0x4d666c.x - _0x12c675.x) * _0x3d45df + (_0x4d666c.y - _0x12c675.y) * _0x499247) / _0x84ec2d,
      ),
    );
    return getDistanceSq(_0x4d666c, {
      x: _0x12c675.x + _0x3d45df * _0xfc8578,
      y: _0x12c675.y + _0x499247 * _0xfc8578,
    });
  },
  getNumberLabelEraseRadius = (_0x4c038c) =>
    Math.max(1, getFiniteNumber(_0x4c038c?.sizeWorld, MIN_NUMBER_LABEL_DIAMETER_PX) * 0.3),
  getEraserRadius = (_0x43b79a) =>
    Math.max(1, getFiniteNumber(_0x43b79a?.sizeWorld, MIN_NUMBER_LABEL_DIAMETER_PX) / 2);
function doesEraserCoverNumberLabel(_0x353404, _0x38e081) {
  if (_0x38e081?.type !== 'eraser') return false;
  const _0x510af7 = getFinitePoint(_0x353404);
  if (!_0x510af7) return false;
  const _0x5cb977 = (Array.isArray(_0x38e081?.points) ? _0x38e081.points : [])
    .map(getFinitePoint)
    .filter(Boolean);
  if (!_0x5cb977.length) return false;
  const _0x130eec = getNumberLabelEraseRadius(_0x353404) + getEraserRadius(_0x38e081),
    _0x23970d = _0x130eec * _0x130eec;
  if (_0x5cb977.length === 1) return getDistanceSq(_0x510af7, _0x5cb977[0]) <= _0x23970d;
  for (let _0x4714dd = 1; _0x4714dd < _0x5cb977.length; _0x4714dd += 1) {
    if (getDistanceSqToSegment(_0x510af7, _0x5cb977[_0x4714dd - 1], _0x5cb977[_0x4714dd]) <= _0x23970d)
      return true;
  }
  return false;
}
export function normalizeNumberLabelValue(_0x381cd2, _0x1b5266 = 1) {
  const _0x46a04a = Math.floor(Number(_0x381cd2));
  if (Number.isFinite(_0x46a04a) && _0x46a04a > 0) return _0x46a04a;
  const _0x361b1c = Math.floor(Number(_0x1b5266));
  return Number.isFinite(_0x361b1c) && _0x361b1c > 0 ? _0x361b1c : 1;
}
export function getNextNumberLabelValue(_0x533308 = []) {
  const _0x2ceccd = Array.isArray(_0x533308) ? _0x533308 : [],
    _0x560c7b = new Set();
  _0x2ceccd.forEach((_0x29c0fb, _0x45739b) => {
    if (_0x29c0fb?.type !== 'number-label') return;
    const _0x445c03 = _0x2ceccd
      .slice(_0x45739b + 1)
      .some((_0x421928) => doesEraserCoverNumberLabel(_0x29c0fb, _0x421928));
    if (!_0x445c03) _0x560c7b.add(normalizeNumberLabelValue(_0x29c0fb.number));
  });
  let _0x59a4c4 = 1;
  while (_0x560c7b.has(_0x59a4c4)) _0x59a4c4 += 1;
  return _0x59a4c4;
}
export function drawNumberLabel({
  ctx: _0x290349,
  x: _0x117472,
  y: _0x464f6f,
  number: _0x334872,
  diameter: _0x53444c,
  color: _0x11a020,
  backgroundColor: backgroundColor = '',
} = {}) {
  if (!_0x290349) return false;
  const _0x5efb74 = Number(_0x117472),
    _0xa51d7f = Number(_0x464f6f);
  if (!Number.isFinite(_0x5efb74) || !Number.isFinite(_0xa51d7f)) return false;
  const _0xda9d66 = Math.max(
      MIN_NUMBER_LABEL_DIAMETER_PX,
      Number.isFinite(Number(_0x53444c)) ? Number(_0x53444c) : 0,
    ),
    _0x323ea5 = _0xda9d66 / 2,
    _0x2be87e = String(normalizeNumberLabelValue(_0x334872)),
    _0x4142f8 = _0x2be87e.length <= 2 ? 0.52 : _0x2be87e.length === 3 ? 0.42 : 0.34,
    _0x16c061 = Math.max(10, _0xda9d66 * _0x4142f8),
    _0xc14a5d = Math.max(2, _0xda9d66 * 0.08);
  return (
    _0x290349.save(),
    (_0x290349.globalCompositeOperation = 'source-over'),
    _0x290349.beginPath(),
    _0x290349.arc(_0x5efb74, _0xa51d7f, _0x323ea5, 0, Math.PI * 2),
    backgroundColor &&
      ((_0x290349.globalAlpha = 0.86),
      (_0x290349.fillStyle = backgroundColor),
      _0x290349.fill(),
      (_0x290349.globalAlpha = 1)),
    _0x11a020 &&
      ((_0x290349.strokeStyle = _0x11a020),
      (_0x290349.lineWidth = _0xc14a5d),
      _0x290349.stroke(),
      (_0x290349.fillStyle = _0x11a020)),
    (_0x290349.font = '700 ' + _0x16c061 + 'px sans-serif'),
    (_0x290349.textAlign = 'center'),
    (_0x290349.textBaseline = 'middle'),
    _0x290349.fillText(_0x2be87e, _0x5efb74, _0xa51d7f),
    _0x290349.restore(),
    true
  );
}
export function drawNumberLabelCommand({
  ctx: _0x21c132,
  cmd: _0x3582d3,
  scaleX: scaleX = 1,
  scaleY: scaleY = scaleX,
  defaultColor: defaultColor = '',
  backgroundColor: backgroundColor = '',
} = {}) {
  const _0x2b6ec6 = Number.isFinite(Number(scaleX)) ? Number(scaleX) : 1,
    _0x599e06 = Number.isFinite(Number(scaleY)) ? Number(scaleY) : _0x2b6ec6,
    _0x27cba4 = Math.max(0.001, Math.abs(_0x2b6ec6)),
    _0x38ebdb = Number(_0x3582d3?.sizeWorld);
  return drawNumberLabel({
    ctx: _0x21c132,
    x: Number(_0x3582d3?.x) * _0x2b6ec6,
    y: Number(_0x3582d3?.y) * _0x599e06,
    number: _0x3582d3?.number,
    diameter: Number.isFinite(_0x38ebdb) ? _0x38ebdb * _0x27cba4 : MIN_NUMBER_LABEL_DIAMETER_PX,
    color: _0x3582d3?.color || defaultColor,
    backgroundColor: backgroundColor,
  });
}
