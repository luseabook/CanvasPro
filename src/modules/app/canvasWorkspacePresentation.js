import { createWorkspacePresentationLifecycle } from '../workspacePresentationLifecycle.js';
export function createCanvasWorkspacePresentation({ root: root, renderer: renderer, warmup: warmup } = {}) {
  const workspacePresentationLifecycle = createWorkspacePresentationLifecycle({
    getRoot: () => root,
    initiallyActive: !![],
  });
  return {
    setPresentationActive(value) {
      (renderer['setPresentationActive'](value), warmup?.['setPresentationActive']?.(value));
      if (value) workspacePresentationLifecycle['activate']();
      else workspacePresentationLifecycle['deactivate']();
    },
    destroy() {
      workspacePresentationLifecycle['dispose']();
    },
  };
}
