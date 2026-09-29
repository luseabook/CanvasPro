import { assertCanvasProjectSaveAllowed } from '../services/canvasProjectAccess.js';
const latestSaves = new WeakMap();
export function captureCanvasProjectSaveTransaction({
  manager: _0x4a1282,
  exportSource: _0xda2c48,
  projectContext: _0x175a55,
  rename: rename = ![],
} = {}) {
  assertCanvasProjectSaveAllowed(_0xda2c48['multiData'], _0x4a1282);
  const _0x303f77 = _0xda2c48['multiData']?.['activeCanvasId'],
    _0x2e0277 = Object['freeze']({
      manager: _0x4a1282,
      token: Symbol('canvas-save'),
      canvasId: _0x303f77,
      exportSource: _0xda2c48,
      projectContext: { ...(_0x4a1282?.['getCanvasProjectContext']?.(_0x303f77) || _0x175a55) },
      originalCanvasName: _0x4a1282?.['_canvases']?.['find']((_0x520b10) => _0x520b10['id'] === _0x303f77)?.[
        'name'
      ],
      checkpoint: _0x4a1282?.['captureCanvasSaveCheckpoint']?.(_0x303f77, {
        ...(rename ? { name: _0xda2c48['projectName'] } : {}),
      }),
    });
  if (_0x4a1282) {
    if (!latestSaves['has'](_0x4a1282)) latestSaves['set'](_0x4a1282, new Map());
    latestSaves['get'](_0x4a1282)['set'](_0x303f77, _0x2e0277['token']);
  }
  return _0x2e0277;
}
export function commitCanvasProjectSave(_0x13ad0a, _0x492b0a, { rename: rename = ![] } = {}) {
  const {
      manager: _0x5e13de,
      canvasId: _0x586562,
      checkpoint: _0x1f63a4,
      exportSource: _0x502d2a,
    } = _0x13ad0a,
    _0x1c0f79 = _0x5e13de?.['_canvases']?.['find']((_0x66cd1b) => _0x66cd1b['id'] === _0x586562);
  if (!_0x1c0f79 || latestSaves['get'](_0x5e13de)?.['get'](_0x586562) !== _0x13ad0a['token']) return ![];
  (releaseCanvasProjectSave(_0x13ad0a), _0x5e13de['setCanvasProjectContext']?.(_0x586562, _0x492b0a));
  if (rename && _0x1c0f79['name'] === _0x13ad0a['originalCanvasName'])
    _0x5e13de['renameCanvas']?.(_0x586562, _0x502d2a['projectName']);
  return (
    _0x5e13de['markCanvasClean']?.(_0x586562, { checkpoint: _0x1f63a4 }),
    _0x5e13de['renderTabs']?.(),
    !![]
  );
}
export function releaseCanvasProjectSave(_0x376479) {
  if (!_0x376479) return;
  const _0x4093bd = latestSaves['get'](_0x376479['manager']);
  if (_0x4093bd?.['get'](_0x376479['canvasId']) === _0x376479['token'])
    _0x4093bd['delete'](_0x376479['canvasId']);
}
