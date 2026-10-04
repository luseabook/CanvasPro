import { undo, redo, commit, onCommit, getHistoryInfo } from '../modules/history.js';
import appStore from '../core/stores/appStore.js';
let _canUndo = false,
  _canRedo = false,
  _listeners = [];
function _updateHistoryState() {
  const historyInfo = getHistoryInfo(),
    value = historyInfo.undoCount >= 2,
    item = historyInfo.redoCount > 0;
  (value !== _canUndo || item !== _canRedo) && ((_canUndo = value), (_canRedo = item), _notifyListeners());
}
function _notifyListeners() {
  _listeners.forEach((handler) => {
    try {
      handler({ canUndo: _canUndo, canRedo: _canRedo });
    } catch (key) {
      console.error('[useHistory] 监听者回调执行异常:', key);
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
export function saveState(index) {
  (commit(), _updateHistoryState(), index && console.log('[useHistory] 已保存状态: ' + index));
}
export function canUndo() {
  return _canUndo;
}
export function canRedo() {
  return _canRedo;
}
export function getHistoryState() {
  const canUndo2 = getHistoryInfo();
  return { ...canUndo2, canUndo: canUndo2.undoCount >= 2, canRedo: canUndo2.redoCount > 0 };
}
export function subscribeToHistory(handler2) {
  return (
    _listeners.push(handler2),
    handler2({ canUndo: _canUndo, canRedo: _canRedo }),
    () => {
      const result = _listeners.indexOf(handler2);
      result > -1 && _listeners.splice(result, 1);
    }
  );
}
export function batchWithHistory(handler3, data) {
  (appStore.batch(() => {
    handler3();
  }),
    saveState(data));
}
export function withHistory(options, target) {
  return function (...args) {
    const source = options.apply(this, args);
    return (saveState(target), source);
  };
}
export function onHistoryCommit(next) {
  return onCommit(next);
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
