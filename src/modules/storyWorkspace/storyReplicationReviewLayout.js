import { beginWorkspaceHorizontalResizeSession } from '../workspaceResizeSession.js';
export function bindStoryReplicationReviewLayout(_0x410d9b, _0x3e18aa) {
  const _0x5abcae = _0x410d9b['querySelector']('.story-source-review-layout');
  let _0x8edd5 = null;
  function _0x1164bc(_0x5b1edc, _0x20be99) {
    const _0xaf6557 = _0x5b1edc === 'left' ? 0xc : _0x3e18aa['left'] + 0x14,
      _0x2b36f4 = _0x5b1edc === 'left' ? Math['min'](0x26, _0x3e18aa['right'] - 0x14) : 0x4b;
    ((_0x3e18aa[_0x5b1edc] = Math['max'](_0xaf6557, Math['min'](_0x2b36f4, _0x20be99))),
      _0x5abcae['style']['setProperty']('--review-left', _0x3e18aa['left'] + 'fr'),
      _0x5abcae['style']['setProperty']('--review-middle', _0x3e18aa['right'] - _0x3e18aa['left'] + 'fr'),
      _0x5abcae['style']['setProperty']('--review-right', 0x64 - _0x3e18aa['right'] + 'fr'),
      _0x5abcae['querySelectorAll']('[data-review-splitter]')['forEach']((_0x2ce7f3) => {
        const _0x37c987 = _0x2ce7f3['dataset']['reviewSplitter'] === 'left';
        (_0x2ce7f3['setAttribute'](
          'aria-valuenow',
          Math['round'](_0x3e18aa[_0x2ce7f3['dataset']['reviewSplitter']]),
        ),
          _0x2ce7f3['setAttribute']('aria-valuemin', _0x37c987 ? 0xc : _0x3e18aa['left'] + 0x14),
          _0x2ce7f3['setAttribute'](
            'aria-valuemax',
            _0x37c987 ? Math['min'](0x26, _0x3e18aa['right'] - 0x14) : 0x4b,
          ));
      }));
  }
  function _0x34bd49(_0x44e183) {
    const _0x4c26d7 = _0x44e183['target']['closest']('[data-review-splitter]');
    if (!_0x4c26d7) return;
    (_0x8edd5?.['abort'](),
      (_0x8edd5 = new AbortController()),
      beginWorkspaceHorizontalResizeSession({
        event: _0x44e183,
        splitter: _0x4c26d7,
        layout: _0x5abcae,
        signal: _0x8edd5['signal'],
        onRatio: (_0x30c14c) => _0x1164bc(_0x4c26d7['dataset']['reviewSplitter'], _0x30c14c),
      }));
  }
  function _0x35f97f(_0xffd1fa) {
    const _0x380bda = _0xffd1fa['target']['closest']('[data-review-splitter]');
    _0x380bda &&
      ['ArrowLeft', 'ArrowRight']['includes'](_0xffd1fa['key']) &&
      (_0xffd1fa['preventDefault'](),
      _0xffd1fa['stopPropagation'](),
      _0x1164bc(
        _0x380bda['dataset']['reviewSplitter'],
        _0x3e18aa[_0x380bda['dataset']['reviewSplitter']] + (_0xffd1fa['key'] === 'ArrowLeft' ? -0x2 : 0x2),
      ));
    const _0x447f2b = _0xffd1fa['target']['closest']('.story-source-tabs [data-replication-tab]');
    if (!_0x447f2b || !['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](_0xffd1fa['key'])) return;
    (_0xffd1fa['preventDefault'](), _0xffd1fa['stopPropagation']());
    const _0x496675 = [..._0x447f2b['parentElement']['querySelectorAll']('button')],
      _0x165377 =
        _0xffd1fa['key'] === 'Home'
          ? 0x0
          : _0xffd1fa['key'] === 'End'
            ? _0x496675['length'] - 0x1
            : (_0x496675['indexOf'](_0x447f2b) +
                (_0xffd1fa['key'] === 'ArrowLeft' ? -0x1 : 0x1) +
                _0x496675['length']) %
              _0x496675['length'];
    (_0x496675[_0x165377]['focus']({ preventScroll: !![] }), _0x496675[_0x165377]['click']());
  }
  return (
    _0x1164bc('left', _0x3e18aa['left']),
    _0x410d9b['addEventListener']('pointerdown', _0x34bd49),
    _0x410d9b['addEventListener']('keydown', _0x35f97f),
    {
      destroy() {
        (_0x8edd5?.['abort'](),
          _0x410d9b['removeEventListener']('pointerdown', _0x34bd49),
          _0x410d9b['removeEventListener']('keydown', _0x35f97f));
      },
    }
  );
}
