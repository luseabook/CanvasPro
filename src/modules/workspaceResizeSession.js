export function beginWorkspaceResizeSession({
  event: _0x8216aa,
  splitter: _0x285cbd,
  layout: _0xef4a0f,
  orientation: orientation = 'horizontal',
  windowObject: windowObject = globalThis['window'],
  body: body = globalThis['document']?.['body'],
  resizingClass: resizingClass = '',
  onRatio: _0x19f7c5,
  onFinish: onFinish = null,
  signal: signal = null,
} = {}) {
  if (!_0x8216aa || !_0x285cbd || !_0xef4a0f || typeof _0x19f7c5 !== 'function' || signal?.['aborted'])
    return ![];
  if (
    _0x8216aa['isPrimary'] === ![] ||
    (Number['isFinite'](_0x8216aa['button']) && _0x8216aa['button'] !== 0x0)
  )
    return ![];
  const _0x5dda33 = _0xef4a0f['getBoundingClientRect']?.(),
    _0x382df0 = orientation === 'vertical',
    _0xb9352a = _0x382df0 ? Number(_0x5dda33?.['height']) : Number(_0x5dda33?.['width']);
  if (!(_0xb9352a > 0x0)) return ![];
  (_0x8216aa['preventDefault']?.(), _0x8216aa['stopPropagation']?.());
  const _0x100708 = _0x8216aa['pointerId'];
  try {
    _0x285cbd['setPointerCapture']?.(_0x100708);
  } catch {}
  _0x285cbd['classList']?.['add']?.('is-active');
  if (resizingClass) body?.['classList']?.['add']?.(resizingClass);
  const _0x1c955e = (_0x625ff7) =>
      !Number['isFinite'](Number(_0x100708)) ||
      !Number['isFinite'](Number(_0x625ff7?.['pointerId'])) ||
      Number(_0x625ff7['pointerId']) === Number(_0x100708),
    _0xf4528b = (_0x37b4b6) => {
      if (!_0x1c955e(_0x37b4b6)) return;
      const _0x4e2a46 = _0x382df0 ? _0x37b4b6?.['clientY'] : _0x37b4b6?.['clientX'],
        _0x190f98 = _0x382df0 ? _0x5dda33['top'] : _0x5dda33['left'];
      _0x19f7c5(((Number(_0x4e2a46) - Number(_0x190f98 || 0x0)) / _0xb9352a) * 0x64, _0x37b4b6);
    },
    _0x29da25 = (_0x23e9ff) => {
      if (!_0x1c955e(_0x23e9ff)) return;
      signal?.['removeEventListener']('abort', _0x3b9076);
      if (resizingClass) body?.['classList']?.['remove']?.(resizingClass);
      _0x285cbd['classList']?.['remove']?.('is-active');
      try {
        _0x285cbd['hasPointerCapture']?.(_0x100708) && _0x285cbd['releasePointerCapture'](_0x100708);
      } catch {}
      (windowObject?.['removeEventListener']?.('pointermove', _0xf4528b),
        windowObject?.['removeEventListener']?.('pointerup', _0x29da25),
        windowObject?.['removeEventListener']?.('pointercancel', _0x29da25),
        onFinish?.(_0x23e9ff));
    },
    _0x3b9076 = () => _0x29da25({ pointerId: _0x100708 });
  return (
    signal?.['addEventListener']('abort', _0x3b9076, { once: !![] }),
    windowObject?.['addEventListener']?.('pointermove', _0xf4528b),
    windowObject?.['addEventListener']?.('pointerup', _0x29da25),
    windowObject?.['addEventListener']?.('pointercancel', _0x29da25),
    !![]
  );
}
export function beginWorkspaceHorizontalResizeSession(_0x2a9679 = {}) {
  return beginWorkspaceResizeSession({ ..._0x2a9679, orientation: 'horizontal' });
}
export function beginWorkspaceVerticalResizeSession(_0x452a59 = {}) {
  return beginWorkspaceResizeSession({ ..._0x452a59, orientation: 'vertical' });
}
