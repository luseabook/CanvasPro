export function getAgentStreamingProse(_0x99a40f) {
  const _0x588149 = String(_0x99a40f || ''),
    _0x5328fc = /(?:^|\n)```agent-choice(?:\s|$)/u['exec'](_0x588149);
  if (_0x5328fc) return _0x588149['slice'](0x0, _0x5328fc['index'])['trimEnd']();
  const _0x33f596 = _0x588149['lastIndexOf']('\x0a') + 0x1,
    _0x24388e = _0x588149['slice'](_0x33f596);
  if ('```agent-choice'['startsWith'](_0x24388e)) return _0x588149['slice'](0x0, _0x33f596)['trimEnd']();
  return _0x588149;
}
