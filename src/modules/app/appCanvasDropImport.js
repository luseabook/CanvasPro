import { hasNodeManagerDragType } from '../nodeManager/nodeManagerDragContract.js';
export async function runAppCanvasFileImport({
  event: _0x5372fc,
  projectId: _0x3eabef,
  handleFileDrop: _0x350435,
  commit: _0x43fa95,
} = {}) {
  const _0x2936e4 = await _0x350435?.(_0x5372fc, _0x3eabef || 'default_v2_project');
  if (_0x2936e4) _0x43fa95?.();
  return _0x2936e4 === !![];
}
export function openAppCanvasFilePicker({
  documentObject: documentObject = typeof document === 'undefined' ? null : document,
  projectId: _0x2574bd,
  handleFileDrop: _0x3d9674,
  commit: _0x3a37ab,
  clientX: clientX = 0x0,
  clientY: clientY = 0x0,
  onUnsupported: _0x224c40,
  onError: _0x568b51,
} = {}) {
  if (
    typeof documentObject?.['createElement'] !== 'function' ||
    typeof documentObject?.['body']?.['appendChild'] !== 'function'
  )
    return ![];
  const _0x5e62b9 = documentObject['createElement']('input');
  ((_0x5e62b9['type'] = 'file'),
    (_0x5e62b9['accept'] = 'image/*,video/*,audio/*'),
    (_0x5e62b9['multiple'] = !![]),
    (_0x5e62b9['style']['position'] = 'fixed'),
    (_0x5e62b9['style']['left'] = '-9999px'),
    (_0x5e62b9['style']['top'] = '-9999px'),
    (_0x5e62b9['style']['opacity'] = '0'));
  let _0x66be97 = ![];
  const _0x4dc919 = () => {
    if (_0x66be97) return;
    ((_0x66be97 = !![]), _0x5e62b9['remove']?.());
  };
  (_0x5e62b9['addEventListener']?.('cancel', _0x4dc919, { once: !![] }),
    _0x5e62b9['addEventListener']?.(
      'change',
      (_0xd763ab) => {
        const _0x22cce1 = Array['from'](_0xd763ab?.['target']?.['files'] || []);
        _0x4dc919();
        if (_0x22cce1['length'] === 0x0) return;
        const _0x31fd18 = {
          dataTransfer: { files: _0x22cce1 },
          clientX: Number['isFinite'](Number(clientX)) ? Number(clientX) : 0x0,
          clientY: Number['isFinite'](Number(clientY)) ? Number(clientY) : 0x0,
          preventDefault() {},
          stopPropagation() {},
        };
        void runAppCanvasFileImport({
          event: _0x31fd18,
          projectId: _0x2574bd,
          handleFileDrop: _0x3d9674,
          commit: _0x3a37ab,
        })
          ['then']((_0x470a93) => {
            if (!_0x470a93) _0x224c40?.();
          })
          ['catch']((_0x363c94) => {
            _0x568b51?.(_0x363c94);
          });
      },
      { once: !![] },
    ));
  try {
    return (documentObject['body']['appendChild'](_0x5e62b9), _0x5e62b9['click'](), !![]);
  } catch (_0x5d185f) {
    return (_0x4dc919(), _0x568b51?.(_0x5d185f), ![]);
  }
}
function isCanvasDropBlocked(_0x2ac9b7) {
  return Boolean(_0x2ac9b7?.['target']?.['closest']?.('[data-ui-stop="1"]'));
}
export function installAppCanvasDropImport({
  targetEl: _0x5a288d,
  handleFileDrop: _0x589f64,
  handleWebImageUrlDrop: _0x2c6e3,
  commit: _0xa67c5a,
  getCurrentProjectId: _0x5e7a6e,
} = {}) {
  if (!_0x5a288d) return () => {};
  const _0x5eff37 = (_0x1a4a45) => {
      if (hasNodeManagerDragType(_0x1a4a45?.['dataTransfer'])) return;
      if (isCanvasDropBlocked(_0x1a4a45)) return;
      _0x1a4a45['preventDefault']();
    },
    _0x34eca4 = async (_0x30e5e6) => {
      if (hasNodeManagerDragType(_0x30e5e6?.['dataTransfer'])) return;
      if (isCanvasDropBlocked(_0x30e5e6)) return;
      const _0x24cd27 = _0x5e7a6e?.() || 'default_v2_project',
        _0x441d26 = await runAppCanvasFileImport({
          event: _0x30e5e6,
          projectId: _0x24cd27,
          handleFileDrop: _0x589f64,
          commit: _0xa67c5a,
        });
      if (_0x441d26) return;
      const _0x525dbc = await _0x2c6e3?.(_0x30e5e6, { projectId: _0x24cd27 });
      _0x525dbc && _0xa67c5a?.();
    };
  return (
    _0x5a288d['addEventListener']('dragover', _0x5eff37),
    _0x5a288d['addEventListener']('drop', _0x34eca4),
    () => {
      (_0x5a288d['removeEventListener']('dragover', _0x5eff37),
        _0x5a288d['removeEventListener']('drop', _0x34eca4));
    }
  );
}
