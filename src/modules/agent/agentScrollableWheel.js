export function createAgentScrollableWheelHandler(_0x45eff4) {
  return (_0x506703) => {
    const _0x5c3828 = Number(_0x506703['deltaY'] || _0x506703['deltaX'] || 0x0),
      _0x422bc1 =
        Number(_0x506703['deltaMode']) === 0x1
          ? 0x10
          : Number(_0x506703['deltaMode']) === 0x2
            ? Math['max'](0x1, Number(_0x45eff4['clientHeight']) || 0x1)
            : 0x1,
      _0x5e8b58 = Math['max'](
        0x0,
        Number(_0x45eff4['scrollHeight'] || 0x0) - Number(_0x45eff4['clientHeight'] || 0x0),
      ),
      _0x31af03 = Math['max'](0x0, Number(_0x45eff4['scrollTop'] || 0x0)),
      _0x10d025 = Math['min'](_0x5e8b58, Math['max'](0x0, _0x31af03 + _0x5c3828 * _0x422bc1));
    (_0x10d025 !== _0x31af03 && (_0x506703['preventDefault']?.(), (_0x45eff4['scrollTop'] = _0x10d025)),
      _0x506703['stopPropagation']?.());
  };
}
