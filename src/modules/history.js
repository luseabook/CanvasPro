import appStore from '../core/stores/appStore.js';
export function createHistory({ store: store, max: max = 50 } = {}) {
  const enabled =
      store && (typeof store.getHistorySnapshot === 'function' || typeof store.getState === 'function'),
    enabled2 =
      store && (typeof store.loadHistorySnapshot === 'function' || typeof store.loadState === 'function');
  if (!enabled || !enabled2)
    throw new TypeError('[history] createHistory() 需要传入具备 history snapshot/loadState 能力的 store');
  const value = Number.isFinite(max) && max > 0 ? Math.floor(max) : 50,
    undoCount = [],
    redoCount = [],
    list = [];
  function run() {
    if (typeof store.getHistorySnapshot === 'function') return store.getHistorySnapshot();
    const nodes = store.getState();
    return { nodes: nodes.nodes, edges: nodes.edges };
  }
  function run2(args) {
    if (typeof store.loadHistorySnapshot === 'function') {
      store.loadHistorySnapshot(args);
      return;
    }
    const viewport = typeof store.getState === 'function' ? store.getState()?.viewport : undefined;
    store.loadState(viewport ? { ...args, viewport: viewport } : args);
  }
  function commit2() {
    const item = run();
    (undoCount.push(item),
      undoCount.length > value && undoCount.shift(),
      (redoCount.length = 0),
      list.forEach((handler) => {
        try {
          handler();
        } catch (key) {
          console.error('[history] 存档回调执行异常:', key);
        }
      }));
  }
  function onCommit2(index) {
    typeof index === 'function' && list.push(index);
  }
  function undo2() {
    if (undoCount.length < 2) {
      console.log('[history] 已到达最早的历史记录，无法继续撤销');
      return;
    }
    const result = undoCount.pop();
    redoCount.push(result);
    const data = undoCount[undoCount.length - 1];
    (run2(data),
      console.log('[history] undo ← undoStack:' + undoCount.length + ' redoStack:' + redoCount.length));
  }
  function redo2() {
    if (redoCount.length === 0) {
      console.log('[history] 没有可重做的操作');
      return;
    }
    const options = redoCount.pop();
    (undoCount.push(options),
      run2(options),
      console.log('[history] redo → undoStack:' + undoCount.length + ' redoStack:' + redoCount.length));
  }
  function getHistoryInfo2() {
    return { undoCount: undoCount.length, redoCount: redoCount.length };
  }
  return {
    commit: commit2,
    onCommit: onCommit2,
    undo: undo2,
    redo: redo2,
    getHistoryInfo: getHistoryInfo2,
  };
}
const _defaultHistory = createHistory({ store: appStore, max: 50 });
export function commit() {
  return _defaultHistory.commit();
}
export function onCommit(target) {
  return _defaultHistory.onCommit(target);
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

export function resetHistory() {
  return _defaultHistory['reset']();
}

export function createHistoryCheckpoint() {
  return _defaultHistory['createCheckpoint']();
}

export function undoToHistoryCheckpoint(source, next = {}) {
  return _defaultHistory['undoToCheckpoint'](source, next);
}
