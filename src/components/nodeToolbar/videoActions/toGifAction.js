export function bindVideoToGifAction(_0x47874e) {
  const {
      toolbarEl: _0x29692b,
      nodeData: _0x36b280,
      VideoClipController: _0xdb2967,
      VideoKeyingController: _0xa19c04,
      VideoGifController: _0x1e869c,
      _getCurrentVideoUrl: _0x3a0b1d,
      _getCurrentVideoLocalPath: _0x5ae8f6,
      _saveRemoteVideoResult: _0x4e32cf,
      closeToolbarMoreMenu: _0x3c17a9,
    } = _0x47874e,
    _0x57ceac = _0x29692b['querySelector']('.act-to-gif');
  if (!_0x57ceac) return () => {};
  const _0x1063c1 = (_0x5b16d9) => {
    (_0x5b16d9['preventDefault'](),
      _0x5b16d9['stopPropagation'](),
      _0x3c17a9?.(),
      _0xdb2967['exit']({ silent: !![] }),
      _0xa19c04['exit']({ silent: !![] }),
      _0x1e869c['exit']({ silent: !![] }),
      _0x1e869c['init']({
        nodeId: _0x36b280['id'],
        sourceUrl: _0x3a0b1d(),
        sourceLocalPath: _0x5ae8f6(),
        ensureLocalSource: (_0x517553) => _0x4e32cf(_0x517553),
      }));
  };
  return (
    _0x57ceac['addEventListener']('click', _0x1063c1),
    () => _0x57ceac['removeEventListener']('click', _0x1063c1)
  );
}
