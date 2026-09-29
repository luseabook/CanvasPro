import {
  buildCanvasMcpTools,
  canExposeCanvasCommand,
  describeCanvasMcpModels,
  sanitizeMcpResult,
} from './canvasMcpTools.js';
export function createCanvasMcpSession({
  request: _0x165eec,
  registry: _0x12b311,
  execute: _0x3e0701,
  getBinding: _0x1f61ee,
  listModels: _0x51116e,
  onChange: onChange = () => {},
  owner: owner = crypto['randomUUID'](),
}) {
  let _0x56c9b7 = null,
    _0x3985ac = null,
    _0xa700a6 = 0x0,
    _0x57d4da = ![],
    _0xe2696 = Promise['resolve']();
  const _0x424a19 = (_0x3c8264) =>
    !_0x57d4da && _0x56c9b7 === _0x3c8264 && _0x3c8264['binding'] === _0x1f61ee();
  async function _0x58a754(_0x32f198 = '') {
    _0xa700a6 += 0x1;
    const _0x21c519 = _0x56c9b7;
    ((_0x56c9b7 = null),
      (_0x3985ac = null),
      _0x21c519?.['controller']['abort'](),
      onChange({ enabled: ![], reason: _0x32f198 }));
    if (_0x21c519)
      try {
        await _0x165eec({ action: 'disable', owner: owner, sessionId: _0x21c519['id'] });
      } catch {}
  }
  async function _0x5771ad(_0x51c2fe, _0x5d5ca9) {
    let _0x44ad07;
    if (!_0x424a19(_0x51c2fe)) return;
    try {
      if (_0x5d5ca9['name'] === 'canvas_models')
        _0x44ad07 = { ok: !![], result: describeCanvasMcpModels(_0x51116e(), _0x5d5ca9['arguments']) };
      else {
        const _0x3c52dc = _0x51c2fe['commandIds']['get'](_0x5d5ca9['name']),
          _0x718bef = _0x12b311['list']()['find']((_0x234108) => _0x234108['id'] === _0x3c52dc);
        if (!_0x718bef || !canExposeCanvasCommand(_0x718bef, _0x51c2fe))
          throw new Error('Unauthorized canvas command');
        _0x44ad07 = await _0x3e0701(_0x3c52dc, _0x5d5ca9['arguments']);
      }
      _0x44ad07 = sanitizeMcpResult(_0x44ad07);
      if (JSON['stringify'](_0x44ad07)['length'] > 0x3d090)
        _0x44ad07 = {
          ok: ![],
          errorCode: 'RESULT_TOO_LARGE',
          message: 'Operation may have succeeded. Inspect individual node summaries instead of resubmitting.',
        };
    } catch (_0x30077b) {
      _0x44ad07 = {
        ok: ![],
        errorCode: 'CANVAS_COMMAND_FAILED',
        message: _0x30077b['message'] || String(_0x30077b),
      };
    }
    if (!_0x424a19(_0x51c2fe)) return;
    for (let _0x3fbd07 = 0x0; _0x3fbd07 < 0x2; _0x3fbd07 += 0x1) {
      try {
        await _0x165eec(
          {
            action: 'complete',
            owner: owner,
            sessionId: _0x51c2fe['id'],
            requestId: _0x5d5ca9['requestId'],
            result: _0x44ad07,
          },
          _0x51c2fe['controller']['signal'],
        );
        return;
      } catch (_0x36951e) {
        if (!_0x424a19(_0x51c2fe)) return;
        if (_0x3fbd07 === 0x1) await _0x58a754(_0x36951e['message']);
      }
    }
  }
  async function _0x12f3f9(_0x4c4cbb) {
    while (_0x424a19(_0x4c4cbb)) {
      try {
        const _0x1aedec = await _0x165eec(
          { action: 'poll', owner: owner, sessionId: _0x4c4cbb['id'], binding: _0x4c4cbb['binding'] },
          _0x4c4cbb['controller']['signal'],
        );
        if (!_0x424a19(_0x4c4cbb)) break;
        if (!_0x1aedec['request']) continue;
        const _0x10a855 = _0x1aedec['request'],
          _0x18531a = _0x4c4cbb['tools']['find']((_0x4ee8ea) => _0x4ee8ea['name'] === _0x10a855['name']);
        _0x18531a?.['annotations']?.['readOnlyHint'] ||
        _0x4c4cbb['commandIds']['get'](_0x10a855['name']) === 'generation.cancel'
          ? void _0x5771ad(_0x4c4cbb, _0x10a855)
          : (_0xe2696 = _0xe2696['then'](() => _0x5771ad(_0x4c4cbb, _0x10a855)));
      } catch (_0x16dec1) {
        if (_0x56c9b7 === _0x4c4cbb) await _0x58a754(_0x16dec1['message']);
        return;
      }
    }
    if (_0x56c9b7 === _0x4c4cbb) await _0x58a754('canvasChanged');
  }
  return {
    async enable({ allowGeneration: allowGeneration = ![] } = {}) {
      await _0x58a754();
      if (_0x57d4da) return null;
      const _0x1fd9f1 = _0xa700a6,
        _0xab97de = _0x1f61ee();
      if (!_0xab97de) throw new Error('Open a canvas before connecting');
      const _0x195390 = buildCanvasMcpTools(_0x12b311, { allowGeneration: allowGeneration });
      _0x3985ac = _0xab97de;
      let _0x106ab4;
      try {
        _0x106ab4 = await _0x165eec({
          action: 'enable',
          owner: owner,
          binding: _0xab97de,
          tools: _0x195390['tools'],
          allowGeneration: allowGeneration,
        });
      } finally {
        if (_0x1fd9f1 === _0xa700a6) _0x3985ac = null;
      }
      if (_0x57d4da || _0x1fd9f1 !== _0xa700a6 || _0xab97de !== _0x1f61ee())
        return (await _0x165eec({ action: 'disable', owner: owner, sessionId: _0x106ab4['id'] }), null);
      return (
        (_0x56c9b7 = { ..._0x106ab4, ..._0x195390, controller: new AbortController() }),
        (_0xe2696 = Promise['resolve']()),
        onChange({
          enabled: !![],
          url: _0x106ab4['url'],
          token: _0x106ab4['token'],
          binding: _0xab97de,
          toolCount: _0x195390['tools']['length'] + 0x1,
        }),
        void _0x12f3f9(_0x56c9b7),
        _0x106ab4
      );
    },
    disable: _0x58a754,
    checkBinding() {
      if ((_0x56c9b7 && !_0x424a19(_0x56c9b7)) || (_0x3985ac && _0x3985ac !== _0x1f61ee()))
        void _0x58a754('canvasChanged');
    },
    async destroy() {
      ((_0x57d4da = !![]), await _0x58a754());
    },
  };
}
