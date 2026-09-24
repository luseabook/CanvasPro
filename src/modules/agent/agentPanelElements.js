export function createAgentElement(_0x1dd04a, _0x3b3f09 = '', _0x51cb4f = '') {
  const _0x277c0b = document['createElement'](_0x1dd04a);
  if (_0x3b3f09) _0x277c0b['className'] = _0x3b3f09;
  if (_0x51cb4f) _0x277c0b['textContent'] = _0x51cb4f;
  return _0x277c0b;
}
export function createAgentButton(
  _0x5eb2ec,
  _0x2a7f91,
  { title: title = '', icon: icon = '', disabled: disabled = ![] } = {},
) {
  const _0x5695fc = createAgentElement('button', _0x5eb2ec);
  _0x5695fc['type'] = 'button';
  title && ((_0x5695fc['title'] = title), _0x5695fc['setAttribute']('aria-label', title));
  icon
    ? ((_0x5695fc['innerHTML'] = icon),
      _0x2a7f91 && _0x5695fc['appendChild'](createAgentElement('span', 'agent-btn-label', _0x2a7f91)))
    : (_0x5695fc['textContent'] = _0x2a7f91);
  _0x5695fc['disabled'] = disabled;
  if (disabled) _0x5695fc['setAttribute']('aria-disabled', 'true');
  return _0x5695fc;
}
export function agentIconSvg(_0x4bbc2b) {
  const _0x1ec22c =
      'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"',
    _0x35f3f1 = {
      plus: '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
      history:
        '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 3v6h-6"></path><path d="M12 7v5l3 2"></path>',
      close: '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>',
      send: '<path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path>',
      stop: '<g class="v2-task-cancel-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></g><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" stroke="none"></rect>',
      cursor: '<path d="m4 4 7.5 16 2.5-6 6-2.5L4 4Z"></path>',
      grid: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
      scan: '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 3h3a2 2 0 0 1 2 2v3"></path><path d="M8 21H5a2 2 0 0 1-2-2v-3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path><path d="M9 12h6"></path>',
      flow: '<path d="M6 3v6"></path><path d="M18 15v6"></path><circle cx="6" cy="15" r="3"></circle><circle cx="18" cy="9" r="3"></circle><path d="M9 15h3a3 3 0 0 0 3-3V9"></path>',
      model: '<path d="M13 2 3 14h8l-1 8 11-14h-8l0-6Z"></path>',
      mode: '<path d="M12 2v4"></path><path d="M12 18v4"></path><path d="m4.93 4.93 2.83 2.83"></path><path d="m16.24 16.24 2.83 2.83"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><path d="m4.93 19.07 2.83-2.83"></path><path d="m16.24 7.76 2.83-2.83"></path>',
      check: '<path d="m20 6-11 11-5-5"></path>',
      upload: '<path d="M12 16V4"></path><path d="m7 9 5-5 5 5"></path><path d="M20 20H4"></path>',
      wand: '<path d="M15 4V2"></path><path d="M15 10v-2"></path><path d="M12 5h2"></path><path d="M18 5h-2"></path><path d="m5 19 14-14"></path><path d="m9 15-4-4"></path>',
      copy: '<rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      skills:
        '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5Z"></path><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5Z"></path>',
      refresh:
        '<path\x20d=\x22M20\x2011a8.1\x208.1\x200\x200\x200-15.5-2M4\x204v5h5\x22></path><path\x20d=\x22M4\x2013a8.1\x208.1\x200\x200\x200\x2015.5\x202M20\x2020v-5h-5\x22></path>',
      folder: '<path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3Z"></path>',
      edit: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>',
    };
  return (
    '<svg class="agent-icon" width="18" height="18" ' +
    _0x1ec22c +
    '>' +
    (_0x35f3f1[_0x4bbc2b] || '') +
    '</svg>'
  );
}
