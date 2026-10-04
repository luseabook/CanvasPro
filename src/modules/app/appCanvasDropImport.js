import { hasNodeManagerDragType } from '../nodeManager/nodeManagerDragContract.js';
export async function runAppCanvasFileImport({
  event: event,
  projectId: projectId,
  handleFileDrop: handleFileDrop,
  commit: commit,
} = {}) {
  const value = await handleFileDrop?.(event, projectId || 'default_v2_project');
  if (value) commit?.();
  return value === !![];
}
export function openAppCanvasFilePicker({
  documentObject: documentObject = typeof document === 'undefined' ? null : document,
  projectId: projectId2,
  handleFileDrop: handleFileDrop2,
  commit: commit2,
  clientX: clientX = 0x0,
  clientY: clientY = 0x0,
  onUnsupported: onUnsupported,
  onError: onError,
} = {}) {
  if (
    typeof documentObject?.['createElement'] !== 'function' ||
    typeof documentObject?.['body']?.['appendChild'] !== 'function'
  )
    return ![];
  const el = documentObject['createElement']('input');
  ((el['type'] = 'file'),
    (el['accept'] = 'image/*,video/*,audio/*'),
    (el['multiple'] = !![]),
    (el['style']['position'] = 'fixed'),
    (el['style']['left'] = '-9999px'),
    (el['style']['top'] = '-9999px'),
    (el['style']['opacity'] = '0'));
  let item = ![];
  const run = () => {
    if (item) return;
    ((item = !![]), el['remove']?.());
  };
  (el['addEventListener']?.('cancel', run, { once: !![] }),
    el['addEventListener']?.(
      'change',
      (event2) => {
        const files = Array['from'](event2?.['target']?.['files'] || []);
        run();
        if (files['length'] === 0x0) return;
        const event3 = {
          dataTransfer: { files: files },
          clientX: Number['isFinite'](Number(clientX)) ? Number(clientX) : 0x0,
          clientY: Number['isFinite'](Number(clientY)) ? Number(clientY) : 0x0,
          preventDefault() {},
          stopPropagation() {},
        };
        void runAppCanvasFileImport({
          event: event3,
          projectId: projectId2,
          handleFileDrop: handleFileDrop2,
          commit: commit2,
        })
          ['then']((enabled) => {
            if (!enabled) onUnsupported?.();
          })
          ['catch']((key) => {
            onError?.(key);
          });
      },
      { once: !![] },
    ));
  try {
    return (documentObject['body']['appendChild'](el), el['click'](), !![]);
  } catch (index) {
    return (run(), onError?.(index), ![]);
  }
}
function isCanvasDropBlocked(event4) {
  return Boolean(event4?.['target']?.['closest']?.('[data-ui-stop="1"]'));
}
export function installAppCanvasDropImport({
  targetEl: targetEl,
  handleFileDrop: handleFileDrop3,
  handleWebImageUrlDrop: handleWebImageUrlDrop,
  commit: commit3,
  getCurrentProjectId: getCurrentProjectId,
} = {}) {
  if (!targetEl) return () => {};
  const result = (event5) => {
      if (hasNodeManagerDragType(event5?.['dataTransfer'])) return;
      if (isCanvasDropBlocked(event5)) return;
      event5['preventDefault']();
    },
    async2 = async (event6) => {
      if (hasNodeManagerDragType(event6?.['dataTransfer'])) return;
      if (isCanvasDropBlocked(event6)) return;
      const projectId3 = getCurrentProjectId?.() || 'default_v2_project',
        runAppCanvasFileImport2 = await runAppCanvasFileImport({
          event: event6,
          projectId: projectId3,
          handleFileDrop: handleFileDrop3,
          commit: commit3,
        });
      if (runAppCanvasFileImport2) return;
      const data = await handleWebImageUrlDrop?.(event6, { projectId: projectId3 });
      data && commit3?.();
    };
  return (
    targetEl['addEventListener']('dragover', result),
    targetEl['addEventListener']('drop', async2),
    () => {
      (targetEl['removeEventListener']('dragover', result), targetEl['removeEventListener']('drop', async2));
    }
  );
}
