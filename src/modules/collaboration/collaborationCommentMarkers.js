import { worldToScreen } from '../../core/math.js';
import { readNodeGeometryPreview } from '../../core/nodeGeometryPreview.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
const moreMenus = new WeakMap();
function chatButton(_0x13e3a0, _0x392505, _0x23d944) {
  const _0x3183e6 = document['createElement']('button');
  return (
    (_0x3183e6['type'] = 'button'),
    (_0x3183e6['className'] = 'ftb-btn icon-only collaboration-chat-node-add'),
    _0x3183e6['setAttribute']('aria-label', _0x23d944),
    _0x3183e6['append'](createContextMenuIcon('add-to-canvas')),
    _0x3183e6['addEventListener']('pointerdown', (_0x5da5fc) => _0x5da5fc['stopPropagation']()),
    _0x3183e6['addEventListener']('click', (_0xe94bb3) => {
      (_0xe94bb3['stopPropagation'](), _0x13e3a0['addNodes'](_0x392505()));
    }),
    _0x3183e6
  );
}
export function drawCollaborationCommentMarkers({
  state: _0x349794,
  nodes: _0x20a478,
  selected: _0x3efc6a,
  viewport: _0x1fd36e,
  bounds: _0x429288,
  entryFor: _0x4a37b2,
  comments: _0x3d5b7a,
  chat: _0x2cccee,
}) {
  if (!_0x349794) return;
  const _0x3300fc = [...(_0x3efc6a || [])]['filter']((_0x339f76) => _0x20a478[_0x339f76]),
    _0x30cb57 = readNodeGeometryPreview(_0x3d5b7a['nodeId'](), _0x20a478[_0x3d5b7a['nodeId']()]);
  if (_0x30cb57)
    _0x3d5b7a['position'](
      worldToScreen(_0x30cb57['x'] + (_0x30cb57['width'] || 0xc8), _0x30cb57['y'], _0x1fd36e),
    );
  if (_0x3300fc['length'] > 0x1) {
    const _0x56bea1 = document['querySelector']('#v2-multi-select-box .v2-multi-select-tab');
    if (!_0x56bea1 || !_0x2cccee) return;
    const _0x4ee1a7 = _0x4a37b2('chat:selection', 'collaboration-toolbar-actions');
    _0x4ee1a7['dataset']['nodeIds'] = JSON['stringify'](_0x3300fc);
    if (!_0x4ee1a7['firstChild'])
      _0x4ee1a7['append'](
        chatButton(_0x2cccee, () => JSON['parse'](_0x4ee1a7['dataset']['nodeIds']), '将所选节点加入聊天'),
      );
    if (_0x4ee1a7['parentElement'] !== _0x56bea1) _0x56bea1['append'](_0x4ee1a7);
    return;
  }
  const _0x593abf = _0x3300fc[0x0],
    _0x5d6e28 = readNodeGeometryPreview(_0x593abf, _0x20a478[_0x593abf]);
  if (!_0x5d6e28) return;
  const _0x461acf = document['querySelector']('.v2-node[data-node-id="' + CSS['escape'](_0x593abf) + '\x22]'),
    _0x3f01df =
      document['querySelector'](
        '.group-toolbar--detached[data-group-toolbar-for=\x22' + CSS['escape'](_0x593abf) + '\x22]',
      ) || _0x461acf?.['querySelector']('.node-floating-toolbar,\x20.group-toolbar');
  if (!_0x3f01df) return;
  const _0x409cd0 = _0x3f01df['querySelector']('.act-more-tools'),
    _0x379b1c = _0x409cd0?.['parentElement'] || _0x3f01df,
    _0x29047d = _0x4a37b2(
      'comment:' + _0x593abf,
      'collaboration-comment-marker collaboration-toolbar-actions',
    );
  if (_0x29047d['parentElement'] !== _0x379b1c) _0x379b1c['insertBefore'](_0x29047d, _0x409cd0 || null);
  if (!_0x29047d['firstChild']) {
    const _0x5bb34b = document['createElement']('button');
    ((_0x5bb34b['type'] = 'button'),
      (_0x5bb34b['className'] = 'ftb-btn\x20icon-only\x20collaboration-comment-button'),
      _0x5bb34b['append'](createContextMenuIcon('comment'), document['createElement']('span')),
      _0x5bb34b['addEventListener']('pointerdown', (_0x203551) => _0x203551['stopPropagation']()),
      _0x5bb34b['addEventListener']('click', (_0x513e23) => {
        (_0x513e23['stopPropagation'](), _0x3d5b7a['open'](_0x593abf, _0x5bb34b));
        const _0x157518 = document['querySelector'](
          '.v2-node[data-node-id="' + CSS['escape'](_0x593abf) + '\x22]',
        );
        if (_0x157518) {
          const _0x55df69 = _0x157518['getBoundingClientRect']();
          _0x3d5b7a['position']?.({ x: _0x55df69['right'], y: _0x55df69['top'] });
        }
      }),
      _0x29047d['append'](_0x5bb34b));
    if (_0x2cccee)
      _0x29047d['append'](
        chatButton(_0x2cccee, () => [_0x593abf], '将' + (_0x5d6e28['name'] || _0x593abf) + '加入聊天'),
      );
  }
  _0x29047d['dataset']['nodeId'] = _0x593abf;
  const _0x51e0b1 = _0x3f01df['classList']['contains']('group-toolbar');
  for (const _0x2ac636 of _0x29047d['querySelectorAll']('button')) {
    (_0x2ac636['classList']['toggle']('gt-btn', _0x51e0b1),
      _0x2ac636['classList']['toggle']('ftb-btn', !_0x51e0b1),
      _0x2ac636['classList']['toggle']('icon-only', !_0x51e0b1));
  }
  const _0xdf4e52 = _0x349794['review']?.['summaries']?.['find'](
      (_0x58e694) => _0x58e694['node'] === _0x593abf,
    ),
    _0xdde8f6 = _0xdf4e52?.['unresolved'] || 0x0;
  ((_0x29047d['dataset']['status'] = _0xdde8f6 ? 'unresolved' : _0xdf4e52?.['count'] ? 'resolved' : 'empty'),
    (_0x29047d['firstChild']['lastChild']['textContent'] = _0xdde8f6 ? String(_0xdde8f6) : ''),
    _0x29047d['firstChild']['setAttribute'](
      'aria-label',
      (_0x5d6e28['name'] || _0x593abf) + '的评论，' + _0xdde8f6 + '\x20条未解决',
    ));
  if (!_0x2cccee) return;
  _0x29047d['lastChild']['setAttribute']('aria-label', '将' + (_0x5d6e28['name'] || _0x593abf) + '加入聊天');
  const _0x316dee = _0x3f01df['querySelector']('[data-role="more-menu"] .v2-img-toolbar-zone-more');
  if (_0x316dee) moreMenus['set'](_0x3f01df, _0x316dee);
  const _0x57e188 = _0x316dee || moreMenus['get'](_0x3f01df);
  _0x29047d['lastChild']['hidden'] = ![];
  if (_0x57e188) {
    const _0x46326e =
      _0x3f01df['getBoundingClientRect']()['width'] >
      Math['min'](_0x429288['width'], window['innerWidth']) - 0x30;
    _0x29047d['lastChild']['hidden'] = _0x46326e;
    const _0x5db357 = _0x4a37b2('chat:more:' + _0x593abf, 'collaboration-toolbar-overflow');
    if (_0x5db357['parentElement'] !== _0x57e188) _0x57e188['append'](_0x5db357);
    if (!_0x5db357['firstChild'])
      _0x5db357['append'](
        chatButton(_0x2cccee, () => [_0x593abf], '将' + (_0x5d6e28['name'] || _0x593abf) + '加入聊天'),
      );
    _0x5db357['hidden'] = !_0x46326e;
  }
}
