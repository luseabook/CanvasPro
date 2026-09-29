import { createWorkspacePresentationLifecycle } from '../workspacePresentationLifecycle.js';
export function createCanvasWorkspacePresentation({
  root: _0x574b68,
  renderer: _0x3ec695,
  warmup: _0x595e7d,
} = {}) {
  const _0x3ae76a = createWorkspacePresentationLifecycle({ getRoot: () => _0x574b68, initiallyActive: !![] });
  return {
    setPresentationActive(_0x17a154) {
      (_0x3ec695['setPresentationActive'](_0x17a154), _0x595e7d?.['setPresentationActive']?.(_0x17a154));
      if (_0x17a154) _0x3ae76a['activate']();
      else _0x3ae76a['deactivate']();
    },
    destroy() {
      _0x3ae76a['dispose']();
    },
  };
}
