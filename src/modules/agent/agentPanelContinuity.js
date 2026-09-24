export function createAgentPanelContinuity({
  getConversation: _0x14e18a,
  getHistory: _0x32909e,
  getMessageCount: _0x256090,
}) {
  let _0x2d5991 = 0x0,
    _0x2aa545 = ![],
    _0x2ee74c = null;
  function _0x23efac() {
    const _0x3292d2 = _0x14e18a?.();
    return JSON['stringify']([_0x3292d2?.['projectId'] || '', _0x3292d2?.['id'] || '']);
  }
  function _0x2c8b68() {
    return { identity: _0x23efac(), epoch: _0x2d5991 };
  }
  function _0x3ccaac(_0xaac641) {
    return !_0x2aa545 && _0xaac641?.['epoch'] === _0x2d5991 && _0xaac641['identity'] === _0x23efac();
  }
  function _0x140cb7() {
    ((_0x2d5991 += 0x1), (_0x2ee74c = null));
  }
  return {
    capture: _0x2c8b68,
    isCurrent: _0x3ccaac,
    invalidate: _0x140cb7,
    rememberClosed() {
      _0x2ee74c = { identity: _0x23efac(), history: JSON['stringify'](_0x32909e()), count: _0x256090() };
    },
    isSameConversation: () => _0x2ee74c?.['identity'] === _0x23efac(),
    canResume() {
      return (
        !_0x2aa545 &&
        _0x2ee74c?.['identity'] === _0x23efac() &&
        _0x2ee74c['history'] === JSON['stringify'](_0x32909e()) &&
        _0x2ee74c['count'] === _0x256090()
      );
    },
    destroy() {
      ((_0x2aa545 = !![]), _0x140cb7());
    },
  };
}
