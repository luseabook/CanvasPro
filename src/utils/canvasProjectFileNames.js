export const CANVAS_PROJECT_FILE_EXTENSION_RE = /\.(?:aicanvas|aicproj|json)$/i;
export const PROJECT_IMPORT_FILE_EXTENSION_RE = /\.(?:aicanvas|aicproj|json|aicpkg)$/i;
export function isCanvasProjectFileName(value) {
  return CANVAS_PROJECT_FILE_EXTENSION_RE['test'](String(value || ''));
}
export function isProjectImportFileName(item) {
  return PROJECT_IMPORT_FILE_EXTENSION_RE['test'](String(item || ''));
}
export function stripCanvasProjectFileExtension(key) {
  return String(key || '')['replace'](CANVAS_PROJECT_FILE_EXTENSION_RE, '');
}
export function buildUniqueCanvasName(index, result = [], data = {}) {
  const options = String(data?.['fallbackName'] || 'Canvas')['trim']() || 'Canvas',
    target = String(index || '')['trim']() || options,
    map = new Set(
      (Array['isArray'](result) ? result : [])
        ['map']((error) => String(error?.['name'] || '')['trim']())
        ['filter'](Boolean),
    );
  if (!map['has'](target)) return target;
  const source =
    Number['isInteger'](data?.['maxAttempts']) && data['maxAttempts'] > 0 ? data['maxAttempts'] : 1000;
  for (let next = 1; next < source; next += 1) {
    const current = target + '(' + next + ')';
    if (!map['has'](current)) return current;
  }
  return target + ' ' + Date['now']();
}
