export function normalizeCanvasProjectAccess(canSave) {
  if (!canSave || typeof canSave !== 'object') return null;
  return {
    badge: ['shared', 'shared-host']['includes'](canSave['badge']) ? canSave['badge'] : '',
    label: String(canSave['label'] || '')['slice'](0, 80),
    canSave: canSave['canSave'] !== false,
    saveMessage: String(canSave['saveMessage'] || '')['slice'](0, 180),
  };
}
export function assertCanvasProjectSaveAllowed(value, item = globalThis['window']?.['CanvasTabManager']) {
  for (const key of value?.['canvases'] || []) {
    const index = item?.['getCanvasProjectAccess']?.(key['id']) || key['projectAccess'];
    if (index?.['canSave'] === false)
      throw Object['assign'](new Error(index['saveMessage'] || '当前项目不允许保存'), {
        code: 'PROJECT_SAVE_FORBIDDEN',
      });
  }
}
