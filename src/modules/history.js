import appStore from '../core/stores/appStore.js';
export function createHistory({ store: _0x4f959a, max: max = 50 } = {}) {
  const _0x26aafc =
      _0x4f959a &&
      (typeof _0x4f959a.getHistorySnapshot === 'function' || typeof _0x4f959a.getState === 'function'),
    _0x144c78 =
      _0x4f959a &&
      (typeof _0x4f959a.loadHistorySnapshot === 'function' || typeof _0x4f959a.loadState === 'function');
  if (!_0x26aafc || !_0x144c78)
    throw new TypeError('[history] createHistory() 需要传入具备 history snapshot/loadState 能力的 store');
  const _0x3a2c33 = Number.isFinite(max) && max > 0 ? Math.floor(max) : 50,
    _0x53a57f = [],
    _0x5371e8 = [],
    _0x51a318 = [];
  function _0x14b0b1() {
    if (typeof _0x4f959a.getHistorySnapshot === 'function') return _0x4f959a.getHistorySnapshot();
    const _0x33fd67 = _0x4f959a.getState();
    return { nodes: _0x33fd67.nodes, edges: _0x33fd67.edges };
  }
  function _0xc2624(_0xfc99e) {
    if (typeof _0x4f959a.loadHistorySnapshot === 'function') {
      _0x4f959a.loadHistorySnapshot(_0xfc99e);
      return;
    }
    const _0x5df6c8 = typeof _0x4f959a.getState === 'function' ? _0x4f959a.getState()?.viewport : undefined;
    _0x4f959a.loadState(_0x5df6c8 ? { ..._0xfc99e, viewport: _0x5df6c8 } : _0xfc99e);
  }
  function _0x4c22fd() {
    const _0x4113f7 = _0x14b0b1();
    (_0x53a57f.push(_0x4113f7),
      _0x53a57f.length > _0x3a2c33 && _0x53a57f.shift(),
      (_0x5371e8.length = 0),
      _0x51a318.forEach((_0x128d86) => {
        try {
          _0x128d86();
        } catch (_0xbe733e) {
          console.error('[history] 存档回调执行异常:', _0xbe733e);
        }
      }));
  }
  function _0x4cc6bc(_0x3ad3f2) {
    typeof _0x3ad3f2 === 'function' && _0x51a318.push(_0x3ad3f2);
  }
  function _0x30b6b2() {
    if (_0x53a57f.length < 2) {
      console.log('[history] 已到达最早的历史记录，无法继续撤销');
      return;
    }
    const _0x3b3410 = _0x53a57f.pop();
    _0x5371e8.push(_0x3b3410);
    const _0x2f6ea2 = _0x53a57f[_0x53a57f.length - 1];
    (_0xc2624(_0x2f6ea2),
      console.log('[history] undo ← undoStack:' + _0x53a57f.length + ' redoStack:' + _0x5371e8.length));
  }
  function _0x1d6a60() {
    if (_0x5371e8.length === 0) {
      console.log('[history] 没有可重做的操作');
      return;
    }
    const _0x378d5c = _0x5371e8.pop();
    (_0x53a57f.push(_0x378d5c),
      _0xc2624(_0x378d5c),
      console.log('[history] redo → undoStack:' + _0x53a57f.length + ' redoStack:' + _0x5371e8.length));
  }
  function _0x120885() {
    return { undoCount: _0x53a57f.length, redoCount: _0x5371e8.length };
  }
  return {
    commit: _0x4c22fd,
    onCommit: _0x4cc6bc,
    undo: _0x30b6b2,
    redo: _0x1d6a60,
    getHistoryInfo: _0x120885,
  };
}
const _defaultHistory = createHistory({ store: appStore, max: 50 });
export function commit() {
  return _defaultHistory.commit();
}
export function onCommit(_0xfd105f) {
  return _defaultHistory.onCommit(_0xfd105f);
}
export function undo() {
  return _defaultHistory.undo();
}
export function redo() {
  return _defaultHistory.redo();
}
export function getHistoryInfo() {
  return _defaultHistory.getHistoryInfo();
}
