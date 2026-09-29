const geometry = new Map(),
  layers = new Map(),
  listeners = new Set();
export function setNodeGeometryPreview(_0x24e948, _0x3c33ed = null) {
  const _0x2f1aac = _0x3c33ed === null ? geometry : layers['get'](_0x3c33ed) || new Map();
  if (_0x3c33ed !== null) layers['set'](_0x3c33ed, _0x2f1aac);
  for (const [_0x6f71a5, _0x390c69] of _0x24e948) {
    const _0x3ce69a = Object['fromEntries'](
      Object['entries'](_0x390c69)['filter'](
        ([_0x537c2b, _0x17a961]) =>
          ['x', 'y', 'width', 'height']['includes'](_0x537c2b) && Number['isFinite'](_0x17a961),
      ),
    );
    _0x2f1aac['set'](_0x6f71a5, _0x3ce69a);
  }
  if (_0x24e948['length']) {
    for (const _0x39d965 of listeners) _0x39d965(_0x3c33ed);
  }
}
export function clearNodeGeometryPreview(_0x652b43, _0x35be38 = null) {
  const _0x3deaca = _0x35be38 === null ? geometry : layers['get'](_0x35be38);
  let _0x478696 = ![];
  for (const _0x4c5871 of _0x652b43) _0x478696 = _0x3deaca?.['delete'](_0x4c5871) || _0x478696;
  if (_0x35be38 !== null && !_0x3deaca?.['size']) layers['delete'](_0x35be38);
  if (_0x478696) {
    for (const _0x36103b of listeners) _0x36103b(_0x35be38);
  }
}
export function readNodeGeometryPreview(_0x36e67b, _0x240c99) {
  const _0x2027bf =
    geometry['get'](_0x36e67b) ||
    [...layers['values']()]['find']((_0x38cba6) => _0x38cba6['has'](_0x36e67b))?.['get'](_0x36e67b);
  return _0x240c99 && _0x2027bf ? { ..._0x240c99, ..._0x2027bf } : _0x240c99;
}
export function readNodeGeometryPreviewEntries(_0x48508a = null) {
  return [...(_0x48508a === null ? geometry : layers['get'](_0x48508a) || [])];
}
export function subscribeNodeGeometryPreview(_0x590036) {
  return (listeners['add'](_0x590036), () => listeners['delete'](_0x590036));
}
