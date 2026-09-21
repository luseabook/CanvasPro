import { undo, redo, commit, onCommit, getHistoryInfo } from '../modules/history.js';
import appStore from '../core/stores/appStore.js';
let _canUndo = false,
  _canRedo = false,
  _listeners = [];
function _updateHistoryState() {
  const _0x3c664b = getHistoryInfo(),
    _0x237d63 = _0x3c664b.undoCount >= 2,
    _0x1e4885 = _0x3c664b.redoCount > 0;
  (_0x237d63 !== _canUndo || _0x1e4885 !== _canRedo) &&
    ((_canUndo = _0x237d63), (_canRedo = _0x1e4885), _notifyListeners());
}
function _notifyListeners() {
  _listeners.forEach((_0x11baeb) => {
    try {
      _0x11baeb({ canUndo: _canUndo, canRedo: _canRedo });
    } catch (_0x2d6a71) {
      console.error('[useHistory] 监听者回调执行异常:', _0x2d6a71);
    }
  });
}
export function performUndo() {
  if (!canUndo()) return false;
  return (undo(), _updateHistoryState(), true);
}
export function performRedo() {
  if (!canRedo()) return false;
  return (redo(), _updateHistoryState(), true);
}
export function saveState(_0x18ffe9) {
  (commit(), _updateHistoryState(), _0x18ffe9 && console.log('[useHistory] 已保存状态: ' + _0x18ffe9));
}
export function canUndo() {
  return _canUndo;
}
export function canRedo() {
  return _canRedo;
}
export function getHistoryState() {
  const _0x404abc = getHistoryInfo();
  return { ..._0x404abc, canUndo: _0x404abc.undoCount >= 2, canRedo: _0x404abc.redoCount > 0 };
}
export function subscribeToHistory(_0x2a5ac9) {
  return (
    _listeners.push(_0x2a5ac9),
    _0x2a5ac9({ canUndo: _canUndo, canRedo: _canRedo }),
    () => {
      const _0xc61276 = _listeners.indexOf(_0x2a5ac9);
      _0xc61276 > -1 && _listeners.splice(_0xc61276, 1);
    }
  );
}
export function batchWithHistory(_0x4b676b, _0x4860f8) {
  (appStore.batch(() => {
    _0x4b676b();
  }),
    saveState(_0x4860f8));
}
export function withHistory(_0x389a6a, _0x90b264) {
  return function (..._0x4ce11f) {
    const _0x508c8a = _0x389a6a.apply(this, _0x4ce11f);
    return (saveState(_0x90b264), _0x508c8a);
  };
}
export function onHistoryCommit(_0x51d5f0) {
  return onCommit(_0x51d5f0);
}
export function clearHistory() {
  (commit(), _updateHistoryState());
}
export function initHistoryHook() {
  (saveState('初始状态'),
    onCommit(() => {
      _updateHistoryState();
    }),
    (window.v2History = {
      undo: performUndo,
      redo: performRedo,
      commit: saveState,
      canUndo: () => _canUndo,
      canRedo: () => _canRedo,
      getInfo: getHistoryState,
    }));
}
export function getHistorySnapshot() {
  return { ...getHistoryInfo(), canUndo: _canUndo, canRedo: _canRedo, listenerCount: _listeners.length };
}
