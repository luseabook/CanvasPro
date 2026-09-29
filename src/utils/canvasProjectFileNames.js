export const CANVAS_PROJECT_FILE_EXTENSION_RE = /\.(?:aicanvas|aicproj|json)$/i;
export const PROJECT_IMPORT_FILE_EXTENSION_RE = /\.(?:aicanvas|aicproj|json|aicpkg)$/i;
export function isCanvasProjectFileName(_0x43e4b0) {
  return CANVAS_PROJECT_FILE_EXTENSION_RE['test'](String(_0x43e4b0 || ''));
}
export function isProjectImportFileName(_0x27ef70) {
  return PROJECT_IMPORT_FILE_EXTENSION_RE['test'](String(_0x27ef70 || ''));
}
export function stripCanvasProjectFileExtension(_0x1b1ec5) {
  return String(_0x1b1ec5 || '')['replace'](CANVAS_PROJECT_FILE_EXTENSION_RE, '');
}
export function buildUniqueCanvasName(_0x3b6005, _0x105772 = [], _0xa4e934 = {}) {
  const _0x2b649e = String(_0xa4e934?.['fallbackName'] || 'Canvas')['trim']() || 'Canvas',
    _0x19699c = String(_0x3b6005 || '')['trim']() || _0x2b649e,
    _0xade785 = new Set(
      (Array['isArray'](_0x105772) ? _0x105772 : [])
        ['map']((_0x3cd7c0) => String(_0x3cd7c0?.['name'] || '')['trim']())
        ['filter'](Boolean),
    );
  if (!_0xade785['has'](_0x19699c)) return _0x19699c;
  const _0x4806f4 =
    Number['isInteger'](_0xa4e934?.['maxAttempts']) && _0xa4e934['maxAttempts'] > 0x0
      ? _0xa4e934['maxAttempts']
      : 0x3e8;
  for (let _0xa897bc = 0x1; _0xa897bc < _0x4806f4; _0xa897bc += 0x1) {
    const _0x1b8b12 = _0x19699c + '(' + _0xa897bc + ')';
    if (!_0xade785['has'](_0x1b8b12)) return _0x1b8b12;
  }
  return _0x19699c + '\x20' + Date['now']();
}
