export function createMentionMenuItem({
  label: label = '',
  subtitle: subtitle = '',
  disabled: disabled = ![],
  hasSubmenu: hasSubmenu = ![],
  compactVisual: compactVisual = ![],
} = {}) {
  const _0x46f666 = document['createElement']('div');
  _0x46f666['className'] =
    'at-mention-item' +
    (disabled ? ' at-mention-disabled disabled' : '') +
    (hasSubmenu ? ' at-mention-has-submenu' : '') +
    (compactVisual ? ' at-mention-compact-visual' : '');
  const _0x4d0867 = document['createElement']('span');
  _0x4d0867['className'] = 'at-mention-copy';
  const _0xcffe66 = document['createElement']('span');
  ((_0xcffe66['className'] = 'at-mention-label'), (_0xcffe66['textContent'] = label));
  const _0x3e43a5 = document['createElement']('span');
  return (
    (_0x3e43a5['className'] = 'at-mention-subtitle'),
    (_0x3e43a5['textContent'] = subtitle),
    (_0x3e43a5['hidden'] = !subtitle),
    _0x4d0867['appendChild'](_0xcffe66),
    _0x4d0867['appendChild'](_0x3e43a5),
    _0x46f666['classList']['toggle']('at-mention-has-subtitle', Boolean(subtitle)),
    { item: _0x46f666, copyEl: _0x4d0867, labelEl: _0xcffe66, subtitleEl: _0x3e43a5 }
  );
}
export function positionMentionMenu(_0x37f2ac, _0x29c19d) {
  const _0x2ba715 = Number(globalThis['window']?.['innerWidth'] || 0x0),
    _0x44e47d = Number(globalThis['window']?.['innerHeight'] || 0x0),
    _0x1eb7dd = 0xc,
    _0x2b461d = 0x5;
  _0x37f2ac['style']['maxHeight'] = '';
  const _0xe8415b = _0x37f2ac['getBoundingClientRect']?.(),
    _0x18e37b = Math['max'](0x0, Number(_0xe8415b?.['width'] || _0x37f2ac['offsetWidth'] || 0x0)),
    _0x5245bd = Math['max'](0x1, Number(_0xe8415b?.['height'] || _0x37f2ac['offsetHeight'] || 0x0));
  let _0x4cb5c2 = Number(_0x29c19d['left'] || 0x0),
    _0x5a66df = Number(_0x29c19d['top'] || 0x0);
  if (_0x2ba715 > 0x0 && _0x18e37b > 0x0)
    _0x4cb5c2 = Math['min'](
      Math['max'](_0x1eb7dd, _0x4cb5c2),
      Math['max'](_0x1eb7dd, _0x2ba715 - _0x1eb7dd - _0x18e37b),
    );
  if (_0x44e47d > 0x0) {
    const _0x23b59f = Math['max'](0x0, _0x44e47d - _0x1eb7dd - _0x5a66df),
      _0x4c447e = Number['isFinite'](_0x29c19d['anchorTop'])
        ? Number(_0x29c19d['anchorTop'])
        : _0x5a66df - _0x2b461d,
      _0x447436 = Math['max'](0x0, _0x4c447e - _0x1eb7dd),
      _0x38abf1 = _0x5245bd > _0x23b59f && _0x447436 > _0x23b59f,
      _0x30a0f2 = Math['max'](0x1, Math['min'](_0x5245bd, _0x38abf1 ? _0x447436 : _0x23b59f));
    ((_0x37f2ac['style']['maxHeight'] = _0x30a0f2 + 'px'),
      (_0x5a66df = _0x38abf1
        ? Math['max'](_0x1eb7dd, _0x4c447e - _0x2b461d - _0x30a0f2)
        : Math['min'](
            Math['max'](_0x1eb7dd, _0x5a66df),
            Math['max'](_0x1eb7dd, _0x44e47d - _0x1eb7dd - _0x30a0f2),
          )));
  }
  ((_0x37f2ac['style']['left'] = _0x4cb5c2 + 'px'), (_0x37f2ac['style']['top'] = _0x5a66df + 'px'));
}
