const _inflightTasks = new Map();
function normalizeKeyPart(_0x370e8d) {
  return String(_0x370e8d || '').trim();
}
export function buildTaskSingleFlightKey({
  provider: _0x2949fe,
  kind: _0x1341a0,
  taskId: _0x2d8f5d,
  submitId: _0x1ad3fd,
  id: _0x376f33,
} = {}) {
  const _0x3535a0 = normalizeKeyPart(_0x2949fe),
    _0x283655 = normalizeKeyPart(_0x1341a0),
    _0x52b701 = normalizeKeyPart(_0x2d8f5d || _0x1ad3fd || _0x376f33);
  if (!_0x3535a0 || !_0x283655 || !_0x52b701) return '';
  return _0x3535a0 + ':' + _0x283655 + ':' + _0x52b701;
}
export function runTaskSingleFlight(_0x21c049, _0x4ec2f9) {
  if (typeof _0x4ec2f9 !== 'function')
    return Promise.reject(new TypeError('task single-flight factory must be a function'));
  const _0x166be2 = buildTaskSingleFlightKey(_0x21c049);
  if (!_0x166be2) return Promise.resolve().then(() => _0x4ec2f9());
  const _0x32ba59 = _inflightTasks.get(_0x166be2);
  if (_0x32ba59) return _0x32ba59;
  const _0x24f3d2 = Promise.resolve().then(_0x4ec2f9);
  return (
    _inflightTasks.set(_0x166be2, _0x24f3d2),
    _0x24f3d2
      .finally(() => {
        _inflightTasks.get(_0x166be2) === _0x24f3d2 && _inflightTasks.delete(_0x166be2);
      })
      .catch(() => {}),
    _0x24f3d2
  );
}
export function __clearTaskSingleFlightForTest() {
  _inflightTasks.clear();
}
