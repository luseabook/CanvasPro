import { subscribeGenerationCompleteNotificationClicks } from '../../services/completionNotificationService.js';
import { REPLACEMENT_STUDIO_MODE_ID } from '../workspaceStudioModes.js';
export function createCompletionNavigation({
  canvasTabs: canvasTabs,
  store: store,
  viewport: viewport,
  requestWorkspaceMode: requestWorkspaceMode,
  replacementStudio: replacementStudio,
  prepareReplacement: prepareReplacement = async () => {},
  subscribe: subscribe = subscribeGenerationCompleteNotificationClicks,
  showToast: showToast = () => {},
} = {}) {
  let enabled = false,
    promise = Promise.resolve();
  async function run(value) {
    if (enabled) return false;
    if (value.source === 'replacement-studio') {
      (await replacementStudio.whenReady(), await prepareReplacement());
      if (enabled || !requestWorkspaceMode(REPLACEMENT_STUDIO_MODE_ID)) return false;
      return replacementStudio.navigateToTaskResult(value);
    }
    const item = canvasTabs.getMultiDataSnapshot({ captureVisualSnapshot: false }),
      list = (item.canvases || []).filter((state) => {
        if (value.canvasId && state.id !== value.canvasId) return false;
        if (
          value.projectId &&
          canvasTabs.getCanvasProjectContext(state.id)?.projectId !== value.projectId
        )
          return false;
        const list2 = state.nodes || [];
        return Array.isArray(list2)
          ? list2.some((key) => key.id === value.nodeId)
          : Boolean(list2[value.nodeId]);
      });
    if (list.length !== 1) return (showToast('对应的画布节点已删除或项目已关闭。', 'warn'), false);
    if (!requestWorkspaceMode('canvas')) return false;
    const index = list[0].id;
    await canvasTabs.switchTo(index);
    if (enabled || canvasTabs.getActiveCanvasId() !== index) return false;
    if (!store.getState().nodes?.[value.nodeId]) return false;
    return (
      store.setSelectedNodes([value.nodeId]),
      viewport.focusNode(value.nodeId, 96, 500, { maxZoom: 1.15 })
    );
  }
  const run2 = subscribe((result) => {
    if (!['canvas', 'replacement-studio'].includes(result?.source)) return;
    promise = promise.then(() => run(result)).catch(() => {
      if (!enabled) showToast('无法打开任务结果，请从对应工作区查看。', 'warn');
      return false;
    });
  });
  return {
    whenIdle: () => promise,
    destroy() {
      ((enabled = true), run2());
    },
  };
}
