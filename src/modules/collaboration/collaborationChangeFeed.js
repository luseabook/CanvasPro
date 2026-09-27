export function createCollaborationChangeFeed({
  read: _0x1204eb,
  onChange: _0x3a6ec2,
  onError: _0x135b97,
  signal: _0x5a7daa,
}) {
  let _0x45e85b = null,
    _0x459dcc,
    _0x470761 = ![];
  async function _0x863e18() {
    if (_0x470761 || _0x5a7daa['aborted']) return;
    let _0x1380c5 = 0x0;
    try {
      const _0x2a2af9 = await _0x1204eb(_0x45e85b);
      if (_0x470761 || _0x5a7daa['aborted']) return;
      if (!_0x2a2af9?.['cursor'] || !Array['isArray'](_0x2a2af9['presence'])) throw new Error('协作通知无效');
      const _0x1b5174 = !_0x45e85b || _0x45e85b['graph'] !== _0x2a2af9['cursor']['graph'];
      ((_0x45e85b = _0x2a2af9['cursor']), _0x3a6ec2(_0x2a2af9, _0x1b5174));
    } catch (_0x2a801c) {
      if (!_0x470761 && !_0x5a7daa['aborted']) _0x135b97(_0x2a801c);
      _0x1380c5 = 0x5dc;
    }
    if (!_0x470761 && !_0x5a7daa['aborted']) _0x459dcc = setTimeout(_0x863e18, _0x1380c5);
  }
  return {
    start: _0x863e18,
    stop() {
      ((_0x470761 = !![]), clearTimeout(_0x459dcc));
    },
  };
}
