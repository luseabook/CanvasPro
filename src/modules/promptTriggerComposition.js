const _compositionTriggerStateByElement = new WeakMap();
export function shouldSkipPromptTriggerForBulkInput(_0x483514) {
  const _0x35da59 = String(_0x483514?.['inputType'] || '');
  if (
    _0x35da59 === 'insertFromPaste' ||
    _0x35da59 === 'insertFromDrop' ||
    _0x35da59 === 'insertReplacementText' ||
    _0x35da59 === 'insertHTML'
  )
    return !![];
  return typeof _0x483514?.['data'] === 'string' && _0x483514['data']['length'] > 0x1;
}
function _getCompositionTriggerState(_0x366f74) {
  let _0x5e7721 = _compositionTriggerStateByElement['get'](_0x366f74);
  if (_0x5e7721) return _0x5e7721;
  return (
    (_0x5e7721 = { pending: new Map(), timer: 0x0 }),
    _0x366f74['addEventListener']('compositionend', () => {
      if (_0x5e7721['timer']) clearTimeout(_0x5e7721['timer']);
      _0x5e7721['timer'] = setTimeout(() => {
        _0x5e7721['timer'] = 0x0;
        const _0x27e6b0 = Array['from'](_0x5e7721['pending']['values']());
        (_0x5e7721['pending']['clear'](), _0x27e6b0['forEach']((_0x26fb6a) => _0x26fb6a()));
      }, 0x0);
    }),
    _compositionTriggerStateByElement['set'](_0x366f74, _0x5e7721),
    _0x5e7721
  );
}
export function deferPromptTriggerUntilCompositionEnd({
  event: _0x487041,
  promptEl: _0x26335d,
  triggerKey: _0x1d9d20,
  onCompositionEnd: _0x1b3ed6,
}) {
  const _0x4cb196 =
      _0x487041?.['isComposing'] === !![] || _0x487041?.['inputType'] === 'insertCompositionText',
    _0x13aaec = _0x26335d ? _compositionTriggerStateByElement['get'](_0x26335d) : null;
  if (!_0x4cb196) return (_0x13aaec?.['pending']['delete'](_0x1d9d20), ![]);
  if (!_0x26335d?.['addEventListener'] || typeof _0x1b3ed6 !== 'function') return !![];
  const _0x3a686b = _0x13aaec || _getCompositionTriggerState(_0x26335d);
  return (
    _0x3a686b['timer'] && (clearTimeout(_0x3a686b['timer']), (_0x3a686b['timer'] = 0x0)),
    _0x3a686b['pending']['set'](_0x1d9d20, _0x1b3ed6),
    !![]
  );
}
