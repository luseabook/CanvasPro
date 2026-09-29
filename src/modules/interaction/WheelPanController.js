import { setCanvasMediaSchedulerPaused } from '../canvasMediaScheduler.js';
const WHEEL_PAN_END_DELAY_MS = 0xa0,
  WHEEL_PAN_MEDIA_RESUME_DELAY_MS = 0x78,
  WHEEL_PAN_MEDIA_PAUSE_SOURCE = 'wheel-pan',
  WHEEL_PAN_PREVIEW_OWNER = 'wheel-pan';
export function createWheelPanController({
  store: _0x2588d0,
  scheduleTimer: scheduleTimer = (_0x215fdd, _0x418a54) => setTimeout(_0x215fdd, _0x418a54),
  clearScheduledTimer: clearScheduledTimer = (_0x46986f) => clearTimeout(_0x46986f),
  requestFrame: requestFrame = (_0x11a0dc) =>
    typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(_0x11a0dc)
      : setTimeout(_0x11a0dc, 0x0),
  cancelFrame: cancelFrame = (_0x47810a) =>
    typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(_0x47810a) : clearTimeout(_0x47810a),
  viewportPreview: _0x3c9e12,
} = {}) {
  if (
    typeof _0x3c9e12?.['acquire'] !== 'function' ||
    typeof _0x3c9e12?.['update'] !== 'function' ||
    typeof _0x3c9e12?.['commit'] !== 'function'
  )
    throw new TypeError('[WheelPanController] viewportPreview is required');
  let _0xd0f335 = 0x0,
    _0xf39b66 = 0x0,
    _0x3465e1,
    _0x1b6fc8 = ![],
    _0x13f791 = 0x0,
    _0x215f6c = ![];
  function _0x2cc751() {
    (_0xf39b66 && (clearScheduledTimer(_0xf39b66), (_0xf39b66 = 0x0)),
      setCanvasMediaSchedulerPaused(!![], { bypassPriority: 0x3e8, source: WHEEL_PAN_MEDIA_PAUSE_SOURCE }));
  }
  function _0x4360c0() {
    if (_0xf39b66) clearScheduledTimer(_0xf39b66);
    _0xf39b66 = scheduleTimer(() => {
      ((_0xf39b66 = 0x0), setCanvasMediaSchedulerPaused(![], { source: WHEEL_PAN_MEDIA_PAUSE_SOURCE }));
    }, WHEEL_PAN_MEDIA_RESUME_DELAY_MS);
  }
  function _0x16537() {
    if (_0xd0f335) clearScheduledTimer(_0xd0f335);
    const _0xe13afe = scheduleTimer(() => {
      if (_0xd0f335 !== _0xe13afe) return;
      ((_0xd0f335 = 0x0), _0x48995c());
    }, WHEEL_PAN_END_DELAY_MS);
    _0xd0f335 = _0xe13afe;
  }
  function _0x5d07be(_0x3aff36) {
    const _0x5c3664 = typeof window !== 'undefined' ? window : null,
      _0x321945 =
        typeof _0x5c3664?.['_v2UpdateSidePlusNow'] === 'function'
          ? _0x5c3664['_v2UpdateSidePlusNow']
          : _0x5c3664?.['_v2UpdateSidePlus'];
    if (typeof _0x321945 !== 'function') return;
    const _0x373bf9 = Number(_0x5c3664?.['_lastMx']) || 0x0,
      _0x30d826 = Number(_0x5c3664?.['_lastMy']) || 0x0;
    _0x321945(_0x373bf9, _0x30d826, { pointerTarget: _0x3aff36 });
  }
  function _0x5057cd() {
    _0x13f791 && (cancelFrame(_0x13f791), (_0x13f791 = 0x0));
    if (!_0x1b6fc8) return ![];
    const _0x3f9a02 = _0x3465e1;
    return ((_0x3465e1 = undefined), (_0x1b6fc8 = ![]), _0x5d07be(_0x3f9a02), !![]);
  }
  function _0x1a1adb() {
    if (_0x13f791) cancelFrame(_0x13f791);
    ((_0x13f791 = 0x0), (_0x3465e1 = undefined), (_0x1b6fc8 = ![]));
  }
  function _0x6c4787(_0x5a2fc2) {
    ((_0x3465e1 = _0x5a2fc2), (_0x1b6fc8 = !![]));
    if (_0x13f791) return;
    const _0x5c9a5b = requestFrame(() => {
      if (_0x13f791 !== _0x5c9a5b) return;
      ((_0x13f791 = 0x0), _0x5057cd());
    });
    _0x13f791 = _0x5c9a5b;
  }
  function _0x48995c() {
    if (!_0x215f6c) return null;
    _0x215f6c = ![];
    _0xd0f335 && (clearScheduledTimer(_0xd0f335), (_0xd0f335 = 0x0));
    const _0x28eea3 = typeof window !== 'undefined' ? window : null,
      _0x39a2fe = _0x3c9e12['commit'](WHEEL_PAN_PREVIEW_OWNER);
    return (
      _0x39a2fe
        ? (_0x28eea3?.['_v2FlushMinimapViewportPreview']?.(_0x39a2fe),
          _0x2588d0['updateViewport'](_0x39a2fe['x'], _0x39a2fe['y'], _0x39a2fe['zoom']),
          _0x2588d0['markViewportPersist']?.(),
          _0x5057cd())
        : _0x1a1adb(),
      _0x28eea3?.['v2Renderer']?.['releaseViewportInteractionBusy']?.(),
      _0x4360c0(),
      _0x39a2fe
    );
  }
  function _0x402004(_0x431e00, _0x3677f4, _0x495c38) {
    const _0x5cecb8 = Number(_0x431e00),
      _0x1ac15c = Number(_0x3677f4),
      _0x37cb6b = Number['isFinite'](_0x5cecb8) ? _0x5cecb8 : 0x0,
      _0x84e26d = Number['isFinite'](_0x1ac15c) ? _0x1ac15c : 0x0;
    if (_0x37cb6b === 0x0 && _0x84e26d === 0x0) return ![];
    const _0x4a3f97 =
        (typeof _0x2588d0?.['getStateRaw'] === 'function' && _0x2588d0['getStateRaw']()) ||
        (typeof _0x2588d0?.['getState'] === 'function' && _0x2588d0['getState']()) ||
        {},
      _0x4d0210 = _0x3c9e12['acquire'](WHEEL_PAN_PREVIEW_OWNER, _0x4a3f97['viewport']);
    if (!_0x4d0210) return ![];
    const _0x2adcac = typeof window !== 'undefined' ? window : null;
    (_0x2adcac?.['v2Renderer']?.['markViewportInteractionBusy']?.(), _0x2cc751());
    const _0x1ff87a = _0x4d0210,
      _0x1b1938 = {
        ..._0x1ff87a,
        x: _0x1ff87a['x'] - _0x37cb6b,
        y: _0x1ff87a['y'] - _0x84e26d,
        zoom: _0x1ff87a['zoom'],
      };
    return (
      _0x3c9e12['update'](WHEEL_PAN_PREVIEW_OWNER, _0x1b1938),
      _0x2adcac?.['_v2ScheduleMinimapViewportPreview']?.(_0x1b1938),
      (_0x215f6c = !![]),
      _0x16537(),
      _0x6c4787(_0x495c38),
      !![]
    );
  }
  return { handleWheelPan: _0x402004, settleWheelPan: _0x48995c };
}
