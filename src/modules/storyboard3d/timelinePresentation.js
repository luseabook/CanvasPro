const SCROLLERS = [
    '.storyboard-3d-timeline-grid',
    '.storyboard-3d-timeline-toolbar',
    '.storyboard-3d-timeline-key-editor',
    '.storyboard-3d-director-path-points',
  ],
  controlKey = (_0x3fef7e) =>
    JSON['stringify']({
      tag: _0x3fef7e?.['tagName'],
      data: Object['entries'](_0x3fef7e?.['dataset'] || {})['sort'](([_0x161262], [_0x4da560]) =>
        _0x161262['localeCompare'](_0x4da560),
      ),
      clip: _0x3fef7e?.['closest']?.('[data-director-clip]')?.['dataset']['directorClip'] || '',
    });
export function captureTimelinePresentation(_0x1aa856) {
  const _0x2929bb = _0x1aa856?.['querySelector']?.('[data-storyboard-3d-shot-timeline]');
  if (!_0x2929bb) return null;
  const _0x399fe5 = _0x2929bb['ownerDocument']['activeElement'];
  return {
    shotId: _0x2929bb['dataset']['shotId'],
    details: [..._0x2929bb['querySelectorAll']('details')]['map']((_0x13f01f, _0x285010) => ({
      index: _0x285010,
      text: _0x13f01f['querySelector']('summary')?.['textContent'],
      open: _0x13f01f['open'],
    })),
    scroll: SCROLLERS['map']((_0x1d0b33) => {
      const _0xe16a1b = _0x2929bb['querySelector'](_0x1d0b33);
      return {
        selector: _0x1d0b33,
        top: _0xe16a1b?.['scrollTop'] || 0x0,
        left: _0xe16a1b?.['scrollLeft'] || 0x0,
      };
    }),
    focus: _0x2929bb['contains'](_0x399fe5) ? controlKey(_0x399fe5) : null,
    selection:
      typeof _0x399fe5?.['selectionStart'] === 'number'
        ? [_0x399fe5['selectionStart'], _0x399fe5['selectionEnd']]
        : null,
  };
}
export function restoreTimelinePresentation(_0x355102, _0x2a645c) {
  const _0x15628d = _0x355102?.['querySelector']?.('[data-storyboard-3d-shot-timeline]');
  if (!_0x2a645c || _0x2a645c['shotId'] !== _0x15628d?.['dataset']['shotId']) return;
  const _0x4e2d87 = _0x15628d['querySelectorAll']('details');
  for (const _0x2a5056 of _0x2a645c['details'] || [])
    if (_0x4e2d87[_0x2a5056['index']]?.['querySelector']('summary')?.['textContent'] === _0x2a5056['text'])
      _0x4e2d87[_0x2a5056['index']]['open'] = _0x2a5056['open'];
  (_0x2a645c['focus'] &&
    queueMicrotask(() => {
      const _0x23b04f = _0x355102?.['querySelector']?.('[data-storyboard-3d-shot-timeline]');
      if (_0x23b04f?.['dataset']['shotId'] !== _0x2a645c['shotId']) return;
      const _0xc951bc = [..._0x23b04f['querySelectorAll']('input, select, button, textarea')]['find'](
          (_0x2425c0) => controlKey(_0x2425c0) === _0x2a645c['focus'],
        ),
        _0x290633 = _0x23b04f['ownerDocument']['activeElement'];
      if (
        !_0xc951bc?.['isConnected'] ||
        (_0x290633 !== _0x23b04f['ownerDocument']['body'] && _0x290633 !== _0xc951bc)
      )
        return;
      _0xc951bc['focus']({ preventScroll: !![] });
      if (_0x2a645c['selection'] && typeof _0xc951bc['selectionStart'] === 'number')
        _0xc951bc['setSelectionRange'](..._0x2a645c['selection']);
    }),
    _0x2a645c['scroll']['forEach'](({ selector: _0x28a99c, top: _0x818da8, left: _0x476d1f }) => {
      const _0x157641 = _0x15628d['querySelector'](_0x28a99c);
      _0x157641 && ((_0x157641['scrollTop'] = _0x818da8), (_0x157641['scrollLeft'] = _0x476d1f));
    }));
}
