import { showTaskStatusNotification } from '../services/completionNotificationService.js';
import { ACTIVE_TASK_STATUSES } from './taskCenterModel.js';
const WAIT_NOTICE_MS = 0xa * 0x3c * 0x3e8,
  clean = (_0x42e7f7, _0x337bd2) =>
    String(_0x42e7f7 || '')
      ['replace'](/\s+/g, '\x20')
      ['trim']()
      ['slice'](0x0, _0x337bd2);
export function createTaskStatusFeedback({
  notify: notify = showTaskStatusNotification,
  setTimer: setTimer = setTimeout,
  clearTimer: clearTimer = clearTimeout,
  waitMs: waitMs = WAIT_NOTICE_MS,
  mergeMs: mergeMs = 0x258,
  now: now = Date['now'],
} = {}) {
  const _0x4aa706 = now(),
    _0x219ef9 = new Map(),
    _0x3dacbf = new Map();
  let _0x1e6d58 = ![];
  function _0x3100ab(_0x4852d9) {
    if (_0x1e6d58) return;
    try {
      Promise['resolve'](notify(_0x4852d9))['catch'](console['warn']);
    } catch (_0x1c5bf6) {
      console['warn'](_0x1c5bf6);
    }
  }
  function _0x412150(_0x20f2c8) {
    return _0x20f2c8['navigation'] ? { ..._0x20f2c8['navigation'] } : null;
  }
  function _0x380a6d(_0x425b96) {
    const _0x26c426 = JSON['stringify']([_0x425b96['source'], _0x425b96['projectId'], _0x425b96['canvasId']]);
    let _0x5b1508 = _0x3dacbf['get'](_0x26c426);
    (!_0x5b1508 &&
      ((_0x5b1508 = {
        tasks: [],
        timer: setTimer(() => {
          _0x3dacbf['delete'](_0x26c426);
          const _0x1cd755 = _0x5b1508['tasks']['filter']((_0x53f6b2) => _0x53f6b2['status'] === 'failed');
          if (!_0x1cd755['length']) return;
          const _0x1f39fe = _0x1cd755[0x0],
            _0x56b674 = clean(_0x1f39fe['title'], 0x3c) || '生成任务',
            _0x25df22 = clean(_0x1f39fe['error'], 0x78) || '请点击查看任务详情',
            _0x1ca444 = _0x5b1508['tasks']['filter']((_0x8b0f0d) => _0x8b0f0d['status'] === 'complete')[
              'length'
            ];
          _0x3100ab({
            type: 'error',
            navigation: _0x412150(_0x1f39fe),
            body:
              _0x5b1508['tasks']['length'] === 0x1
                ? _0x56b674 + '失败：' + _0x25df22
                : '多项任务已结束：成功\x20' +
                  _0x1ca444 +
                  ' 个，失败 ' +
                  _0x1cd755['length'] +
                  ' 个。' +
                  _0x56b674 +
                  '：' +
                  _0x25df22,
          });
        }, mergeMs),
      }),
      _0x5b1508['timer']?.['unref']?.(),
      _0x3dacbf['set'](_0x26c426, _0x5b1508)),
      _0x5b1508['tasks']['push']({ ..._0x425b96, navigation: _0x412150(_0x425b96) }));
  }
  return {
    observe(_0x2f822e, _0x498c00, { silent: silent = ![] } = {}) {
      if (_0x1e6d58) return;
      const _0x28161b = _0x219ef9['get'](_0x2f822e['taskId']);
      if (ACTIVE_TASK_STATUSES['has'](_0x2f822e['status'])) {
        if (_0x28161b) {
          _0x28161b['task'] = { ..._0x2f822e, navigation: _0x412150(_0x2f822e) };
          return;
        }
        const _0x1a263d = { task: { ..._0x2f822e, navigation: _0x412150(_0x2f822e) }, timer: null };
        ((_0x1a263d['timer'] = setTimer(() => {
          ((_0x1a263d['timer'] = null),
            _0x3100ab({
              type: 'warn',
              navigation: _0x412150(_0x1a263d['task']),
              body:
                (clean(_0x1a263d['task']['title'], 0x3c) || '生成任务') +
                '等待较久，尚未确认完成。点击查看进度，请勿重复提交。',
            }));
        }, waitMs)),
          _0x1a263d['timer']?.['unref']?.(),
          _0x219ef9['set'](_0x2f822e['taskId'], _0x1a263d));
        return;
      }
      _0x28161b && (clearTimer(_0x28161b['timer']), _0x219ef9['delete'](_0x2f822e['taskId']));
      const _0x3a4b06 =
        !_0x498c00 &&
        _0x2f822e['status'] === 'failed' &&
        Number(_0x2f822e['startedAt'] || _0x2f822e['createdAt']) >= _0x4aa706;
      if (silent || (!_0x3a4b06 && !ACTIVE_TASK_STATUSES['has'](_0x498c00?.['status']))) return;
      if (['failed', 'complete']['includes'](_0x2f822e['status'])) _0x380a6d(_0x2f822e);
    },
    destroy() {
      _0x1e6d58 = !![];
      for (const _0x1749b8 of _0x219ef9['values']()) clearTimer(_0x1749b8['timer']);
      for (const _0xe358c1 of _0x3dacbf['values']()) clearTimer(_0xe358c1['timer']);
      (_0x219ef9['clear'](), _0x3dacbf['clear']());
    },
  };
}
