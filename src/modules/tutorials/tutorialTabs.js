export function createTutorialTabs(_0x111d35) {
  let _0x5c68e0 = '';
  function _0x3e6689() {
    const _0x5bb321 = _0x111d35['querySelector']('[aria-selected="true"]');
    if (!_0x5bb321) return;
    (_0x111d35['style']['setProperty']('--tutorial-tab-x', _0x5bb321['offsetLeft'] + 'px'),
      _0x111d35['style']['setProperty']('--tutorial-tab-y', _0x5bb321['offsetTop'] + 'px'),
      _0x111d35['style']['setProperty']('--tutorial-tab-width', _0x5bb321['offsetWidth'] + 'px'),
      _0x111d35['style']['setProperty']('--tutorial-tab-height', _0x5bb321['offsetHeight'] + 'px'));
  }
  const _0x558ff0 = new ResizeObserver(_0x3e6689);
  return (
    _0x558ff0['observe'](_0x111d35),
    {
      update(_0x10d965, _0x3a19fb) {
        const _0x2fcb9c = JSON['stringify'](
          _0x10d965['map'](({ id: _0x545725, title: _0x2d194d }) => [_0x545725, _0x2d194d]),
        );
        if (_0x5c68e0 !== _0x2fcb9c) {
          const _0x577ea4 = _0x111d35['contains'](document['activeElement']);
          _0x111d35['replaceChildren']();
          for (const _0x5a30e3 of _0x10d965) {
            const _0x1f8d7c = document['createElement']('button');
            ((_0x1f8d7c['type'] = 'button'),
              _0x1f8d7c['setAttribute']('role', 'tab'),
              (_0x1f8d7c['dataset']['tab'] = _0x5a30e3['id']),
              (_0x1f8d7c['textContent'] = _0x5a30e3['title']),
              (_0x1f8d7c['id'] = 'tutorial-tab-' + _0x5a30e3['id']),
              _0x1f8d7c['setAttribute']('aria-controls', 'tutorial-tab-content'),
              _0x111d35['append'](_0x1f8d7c));
          }
          _0x5c68e0 = _0x2fcb9c;
          if (_0x577ea4) _0x111d35['querySelector']('[data-tab=\x22' + _0x3a19fb + '\x22]')?.['focus']();
        }
        for (const _0x399c30 of _0x111d35['children']) {
          const _0x3c1af7 = _0x399c30['dataset']['tab'] === _0x3a19fb;
          (_0x399c30['setAttribute']('aria-selected', String(_0x3c1af7)),
            (_0x399c30['tabIndex'] = _0x3c1af7 ? 0x0 : -0x1));
        }
        _0x3e6689();
      },
      close() {
        _0x558ff0['disconnect']();
      },
    }
  );
}
