import { isNodeType } from '../modules/registry.js';
import { resolveGenerationUiState } from './generationTaskUiState.js';
import { formatRendererNodeTimerText } from './rendererNodePresentation.js';
const DEFAULT_UPDATE_INTERVAL_MS = 0xfa,
  RUNNING_TIMER_STATES = new Set(['idle', 'submitting', 'queued', 'running', 'recovering']);
function hasResolvedMediaValue(_0x3dbc30, _0x1771d7) {
  return !!(
    _0x3dbc30 &&
    typeof _0x3dbc30 === 'object' &&
    _0x1771d7['some']((_0x4887b8) => !!String(_0x3dbc30?.[_0x4887b8] || '')['trim']())
  );
}
function isResolvedSourceMediaNode(_0x4ee21f) {
  if (isNodeType(_0x4ee21f, 'source-audio'))
    return hasResolvedMediaValue(_0x4ee21f, ['src', 'audioUrl', 'localPath', 'resultUrl']);
  if (
    !isNodeType(_0x4ee21f, 'source-video') ||
    !!String(_0x4ee21f?.['rhTaskId'] || _0x4ee21f?.['asyncTaskId'] || _0x4ee21f?.['dreaminaSubmitId'] || '')[
      'trim'
    ]() ||
    _0x4ee21f?.['rhTaskRecovering'] === !![] ||
    _0x4ee21f?.['asyncTaskRecovering'] === !![] ||
    _0x4ee21f?.['dreaminaTaskRecovering'] === !![]
  )
    return ![];
  const _0x3e008c = Array['isArray'](_0x4ee21f?.['videos']) ? _0x4ee21f['videos'] : [];
  return (
    hasResolvedMediaValue(_0x4ee21f, [
      'src',
      'videoUrl',
      'localPath',
      'displayLocalPath',
      'originalLocalPath',
      'resultUrl',
      'capturePreviewUrl',
    ]) ||
    _0x3e008c['some']((_0x34757f) =>
      hasResolvedMediaValue(_0x34757f, [
        'url',
        'videoUrl',
        'localPath',
        'displayLocalPath',
        'originalLocalPath',
        'resultUrl',
        'sourceUrl',
      ]),
    )
  );
}
function isRunningTimerNode(_0x1faf71) {
  if (
    !_0x1faf71?.['generationStartTime'] ||
    _0x1faf71['generationDuration'] != null ||
    isResolvedSourceMediaNode(_0x1faf71)
  )
    return ![];
  return RUNNING_TIMER_STATES['has'](resolveGenerationUiState(_0x1faf71));
}
function defaultRequestFrame(_0x4fa6ea) {
  if (typeof globalThis['requestAnimationFrame'] === 'function')
    return globalThis['requestAnimationFrame'](_0x4fa6ea);
  return (_0x4fa6ea(), null);
}
function defaultCancelFrame(_0x125511) {
  globalThis['cancelAnimationFrame']?.(_0x125511);
}
function setTimerText(_0x3206e0, _0x44ae38) {
  if (_0x3206e0['textContent'] === _0x44ae38) return;
  const _0x33dbad = _0x3206e0['firstChild'];
  _0x33dbad?.['nodeType'] === 0x3 && _0x33dbad === _0x3206e0['lastChild']
    ? (_0x33dbad['data'] = _0x44ae38)
    : (_0x3206e0['textContent'] = _0x44ae38);
}
export function createRendererNodeTimerController({
  getWrapper: _0xc3f4c2,
  now: now = () => Date['now'](),
  requestFrame: requestFrame = defaultRequestFrame,
  cancelFrame: cancelFrame = defaultCancelFrame,
  setTimer: setTimer = (_0x42694b, _0x519308) => globalThis['setTimeout'](_0x42694b, _0x519308),
  clearTimer: clearTimer = (_0x13c4c2) => globalThis['clearTimeout'](_0x13c4c2),
  updateIntervalMs: updateIntervalMs = DEFAULT_UPDATE_INTERVAL_MS,
} = {}) {
  if (typeof _0xc3f4c2 !== 'function')
    throw new TypeError('[rendererNodeTimerController] getWrapper must be a function');
  let _0x4e6a76 = null,
    _0x1e5628 = -0x1,
    _0x6ee357 = null,
    _0x4b5175 = null;
  const _0x2ecad1 = new Set();
  function _0x2ff52d(_0x368997) {
    const _0x17e238 = _0xc3f4c2(_0x368997)?.['__v2_timer_el'];
    if (_0x17e238) {
      _0x17e238['textContent'] = '';
      if (_0x17e238['style']['display'] !== 'none') _0x17e238['style']['display'] = 'none';
    }
    _0x2ecad1['delete'](_0x368997);
    if (_0x2ecad1['size'] === 0x0) _0x4ab945();
  }
  function _0x4ab945() {
    if (_0x6ee357 !== null) cancelFrame(_0x6ee357);
    if (_0x4b5175 !== null) clearTimer(_0x4b5175);
    ((_0x6ee357 = null), (_0x4b5175 = null));
  }
  function _0x1f3c8b(_0x2ae82a = updateIntervalMs) {
    if (_0x2ecad1['size'] === 0x0 || _0x6ee357 !== null || _0x4b5175 !== null) return;
    const _0x4b11d0 = () => {
        _0x4b5175 = null;
        if (_0x2ecad1['size'] === 0x0) return;
        _0x6ee357 = requestFrame(_0x2ac25d);
      },
      _0x521921 = Math['max'](0x0, Number(_0x2ae82a) || 0x0);
    if (_0x521921 > 0x0) _0x4b5175 = setTimer(_0x4b11d0, _0x521921);
    else _0x4b11d0();
  }
  function _0x341f0a(_0x44a1cd, _0x1b42d9) {
    if (isRunningTimerNode(_0x1b42d9)) {
      (_0x2ecad1['add'](_0x44a1cd), _0x1f3c8b(0x0));
      return;
    }
    _0x2ecad1['delete'](_0x44a1cd);
    if (_0x2ecad1['size'] === 0x0) _0x4ab945();
  }
  function _0x4ce687(_0x19a152, _0x18feea) {
    const _0xe5f1a4 = _0xc3f4c2(_0x19a152)?.['__v2_timer_el'];
    if (!_0xe5f1a4) return;
    const _0x1d1bc6 = formatRendererNodeTimerText(_0x18feea, now() - _0x18feea['generationStartTime']);
    setTimerText(_0xe5f1a4, _0x1d1bc6);
    if (_0xe5f1a4['style']['display'] === 'none') _0xe5f1a4['style']['display'] = '';
  }
  function _0x2ac25d() {
    _0x6ee357 = null;
    if (!_0x4e6a76 || _0x2ecad1['size'] === 0x0) return;
    const _0x24e832 = [];
    for (const _0x240f53 of _0x2ecad1) {
      const _0x5e8ec0 = _0x4e6a76['nodes']?.[_0x240f53];
      if (!_0x5e8ec0 || !isRunningTimerNode(_0x5e8ec0)) {
        _0x24e832['push'](_0x240f53);
        continue;
      }
      _0x4ce687(_0x240f53, _0x5e8ec0);
    }
    _0x24e832['forEach']((_0x2418ba) => _0x2ff52d(_0x2418ba));
    if (_0x2ecad1['size'] > 0x0) _0x1f3c8b();
  }
  function _0x490c91(_0x203d06, _0x5e1ce2, { selected: selected = ![] } = {}) {
    const _0x14614c = _0xc3f4c2(_0x203d06)?.['__v2_timer_el'];
    if (_0x14614c) {
      const _0x2c1214 = isRunningTimerNode(_0x5e1ce2),
        _0x4efd31 =
          !isResolvedSourceMediaNode(_0x5e1ce2) && typeof _0x5e1ce2?.['generationDuration'] === 'number',
        _0x1441e5 = _0x2c1214 || _0x4efd31,
        _0x50a31e = _0x2c1214
          ? formatRendererNodeTimerText(_0x5e1ce2, now() - _0x5e1ce2['generationStartTime'])
          : _0x4efd31
            ? formatRendererNodeTimerText(_0x5e1ce2, _0x5e1ce2['generationDuration'])
            : '';
      setTimerText(_0x14614c, _0x50a31e);
      if (_0x1441e5) {
        _0x14614c['style']['color'] = selected ? 'var(--text-primary)' : 'var(--white-40)';
        if (_0x14614c['style']['display'] === 'none') _0x14614c['style']['display'] = '';
      } else _0x14614c['style']['display'] !== 'none' && (_0x14614c['style']['display'] = 'none');
    }
    _0x341f0a(_0x203d06, _0x5e1ce2);
  }
  function _0x5799f1(_0x16a5fd) {
    _0x4e6a76 = _0x16a5fd || null;
    const _0x4653a1 = Number['isFinite'](_0x16a5fd?.['_persistRev'])
      ? _0x16a5fd['_persistRev']
      : Number['isFinite'](_0x16a5fd?.['_nodeCount'])
        ? _0x16a5fd['_nodeCount']
        : 0x0;
    if (_0x4653a1 === _0x1e5628) return;
    _0x1e5628 = _0x4653a1;
    const _0x89665c = _0x16a5fd?.['nodes'] || {};
    for (const _0x5ea751 of [..._0x2ecad1]) {
      if (!isRunningTimerNode(_0x89665c[_0x5ea751])) _0x2ff52d(_0x5ea751);
    }
    for (const [_0xd52e22, _0x4747da] of Object['entries'](_0x89665c)) {
      if (!isRunningTimerNode(_0x4747da)) continue;
      const _0x2d99c9 = String(_0x4747da?.['id'] || _0xd52e22 || '')['trim']();
      _0x2d99c9 && (_0x341f0a(_0x2d99c9, _0x4747da), _0x4ce687(_0x2d99c9, _0x4747da));
    }
    if (_0x2ecad1['size'] > 0x0) _0x1f3c8b(0x0);
  }
  function _0x188843() {
    (_0x4ab945(), _0x2ecad1['clear'](), (_0x1e5628 = -0x1), (_0x4e6a76 = null));
  }
  return {
    clear: _0x188843,
    hideNode: _0x2ff52d,
    renderNode: _0x490c91,
    syncSnapshot: _0x5799f1,
    trackNode: _0x341f0a,
  };
}
