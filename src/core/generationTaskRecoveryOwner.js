import {
  GENERATION_TASK_PROTOCOLS,
  getGenerationTaskProtocolAdapter,
} from './generationTaskProtocolAdapters.js';
import { resolveGenerationUiState, shouldShowGenerationBusyUi } from './generationTaskUiState.js';
const LEGACY_RECOVERY_FIELDS = Object['freeze']({
  [GENERATION_TASK_PROTOCOLS['WORKFLOW']]: Object['freeze']({
    abortController: '_rhResumeAbortController',
    taskId: '_rhResumeTaskId',
    promise: '_rhResumePromise',
  }),
  [GENERATION_TASK_PROTOCOLS['DREAMINA']]: Object['freeze']({
    abortController: '_dreaminaResumeAbortController',
    taskId: '_dreaminaResumeSubmitId',
    promise: '_dreaminaResumePromise',
  }),
  [GENERATION_TASK_PROTOCOLS['ASYNC_MODEL_API']]: Object['freeze']({
    abortController: '_asyncResumeAbortController',
    taskId: '_asyncResumeTaskId',
    promise: '_asyncResumePromise',
  }),
});
function createLane() {
  return { abortController: null, taskId: '', promise: null };
}
function normalizeTaskId(_0x45ae49) {
  return String(_0x45ae49 || '')['trim']();
}
export function createGenerationTaskRecoveryOwner({
  readTaskNode: readTaskNode = () => ({}),
  updateTaskNode: updateTaskNode = () => {},
  persist: persist = () => {},
  onUiStateChange: onUiStateChange = () => {},
  createAbortController: createAbortController = () => new AbortController(),
} = {}) {
  const _0x2de0cc = new Map(
      Object['values'](GENERATION_TASK_PROTOCOLS)['map']((_0x58738f) => [_0x58738f, createLane()]),
    ),
    _0x316268 = (_0x3b03d6) => {
      const _0xb66f9 = getGenerationTaskProtocolAdapter(_0x3b03d6);
      if (!_0xb66f9)
        throw new Error('Unknown\x20generation\x20task\x20recovery\x20protocol:\x20' + _0x3b03d6);
      return { adapter: _0xb66f9, lane: _0x2de0cc['get'](_0xb66f9['id']) };
    },
    _0x58fcac = () => {
      const _0x1299c1 = readTaskNode() || {},
        _0x1b7d20 = resolveGenerationUiState(_0x1299c1);
      return (
        onUiStateChange({ state: _0x1b7d20, busy: shouldShowGenerationBusyUi(_0x1299c1), node: _0x1299c1 }),
        _0x1b7d20
      );
    },
    _0x58e1e8 = (_0x262db3, _0x1f2a22 = {}) => {
      try {
        const _0x1d3cad = persist(_0x262db3, _0x1f2a22);
        _0x1d3cad?.['catch']?.(() => {});
      } catch {}
    },
    _0x429a7a = (_0x22dc88, { resetRecovering: resetRecovering = ![] } = {}) => {
      const { adapter: _0x2a4f4a, lane: _0x3ee017 } = _0x316268(_0x22dc88);
      _0x3ee017['abortController']?.['signal']?.['aborted'] !== !![] &&
        _0x3ee017['abortController']?.['abort']?.();
      ((_0x3ee017['abortController'] = null), (_0x3ee017['taskId'] = ''), (_0x3ee017['promise'] = null));
      if (resetRecovering && readTaskNode()?.[_0x2a4f4a['recoveringField']] === !![]) {
        const _0x140b82 = { [_0x2a4f4a['recoveringField']]: ![] };
        (updateTaskNode(_0x140b82),
          _0x58e1e8(_0x2a4f4a['id'], { type: 'recovering-reset', patch: _0x140b82 }));
      }
      _0x58fcac();
    },
    _0x898f24 = (_0xb3a5d3, _0x27beda, { abortPrevious: abortPrevious = !![] } = {}) => {
      const { adapter: _0x215476, lane: _0x29fba6 } = _0x316268(_0xb3a5d3),
        _0x2d700b = normalizeTaskId(_0x27beda);
      if (_0x2d700b && _0x29fba6['taskId'] === _0x2d700b && _0x29fba6['promise'])
        return { claimed: ![], controller: _0x29fba6['abortController'], promise: _0x29fba6['promise'] };
      if (abortPrevious) _0x429a7a(_0x215476['id']);
      return (
        (_0x29fba6['taskId'] = _0x2d700b),
        (_0x29fba6['abortController'] = createAbortController()),
        _0x58fcac(),
        { claimed: !![], controller: _0x29fba6['abortController'], promise: null }
      );
    },
    _0x5803b7 = (_0x39459a, _0x4811f6) => {
      const { adapter: _0x46513e, lane: _0x2d7582 } = _0x316268(_0x39459a);
      return (
        (_0x2d7582['promise'] = _0x4811f6 || null),
        _0x58e1e8(_0x46513e['id'], { type: 'recovery-start', taskId: _0x2d7582['taskId'] }),
        _0x58fcac(),
        _0x2d7582['promise']
      );
    },
    _0x59d767 = (_0x498bd2, { taskId: taskId = '', controller: controller = null } = {}) => {
      const { adapter: _0x5a682b, lane: _0x4f9eb } = _0x316268(_0x498bd2),
        _0x34404f = normalizeTaskId(taskId);
      if (controller && _0x4f9eb['abortController'] && _0x4f9eb['abortController'] !== controller) return ![];
      if (_0x34404f && _0x4f9eb['taskId'] && _0x4f9eb['taskId'] !== _0x34404f) return ![];
      return (
        (_0x4f9eb['abortController'] = null),
        (_0x4f9eb['taskId'] = ''),
        (_0x4f9eb['promise'] = null),
        _0x58e1e8(_0x5a682b['id'], { type: 'recovery-finish', taskId: _0x34404f }),
        _0x58fcac(),
        !![]
      );
    },
    _0x5450df = (_0x4050b6, _0x3bcaf2 = LEGACY_RECOVERY_FIELDS) => {
      if (!_0x4050b6 || typeof _0x4050b6 !== 'object') return _0x4050b6;
      return (
        Object['entries'](_0x3bcaf2)['forEach'](([_0x82abcf, _0x1bd421]) => {
          const { lane: _0x2def51 } = _0x316268(_0x82abcf);
          Object['entries'](_0x1bd421)['forEach'](([_0x59488d, _0xbb90f2]) => {
            const _0x26cbd5 = Object['getOwnPropertyDescriptor'](_0x4050b6, _0xbb90f2);
            if (_0x26cbd5 && _0x26cbd5['configurable'] === ![]) return;
            if (_0x26cbd5 && 'value' in _0x26cbd5) _0x2def51[_0x59488d] = _0x26cbd5['value'];
            Object['defineProperty'](_0x4050b6, _0xbb90f2, {
              configurable: !![],
              enumerable: ![],
              get: () => _0x2def51[_0x59488d],
              set: (_0x2c898b) => {
                _0x2def51[_0x59488d] = _0x59488d === 'taskId' ? normalizeTaskId(_0x2c898b) : _0x2c898b;
              },
            });
          });
        }),
        _0x4050b6
      );
    };
  return Object['freeze']({
    bindLegacyState: _0x5450df,
    claim: _0x898f24,
    finish: _0x59d767,
    getLane: (_0x18e2f8) => _0x316268(_0x18e2f8)['lane'],
    getUiState: () => resolveGenerationUiState(readTaskNode() || {}),
    isBusy: (_0x1d6f1b = readTaskNode() || {}) => shouldShowGenerationBusyUi(_0x1d6f1b),
    publishUiState: _0x58fcac,
    setPromise: _0x5803b7,
    stop: _0x429a7a,
  });
}
