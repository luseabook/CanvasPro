import { agentIconSvg, createAgentButton, createAgentElement } from './agentPanelElements.js';
import { createAgentScrollableWheelHandler } from './agentScrollableWheel.js';
function listSelectableSkills(_0x34f162) {
  return (_0x34f162?.['listSkills']?.() || [])['filter'](
    (_0x31142e) => _0x31142e['source'] === 'installed' && _0x31142e['enabled'] !== ![],
  );
}
function matchesSkillQuery(_0x477afa, _0x2252ce = '') {
  const _0x159ac1 = String(_0x2252ce || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x159ac1) return !![];
  return [_0x477afa['id'], _0x477afa['title'], _0x477afa['description']]['some']((_0x573ed2) =>
    String(_0x573ed2 || '')
      ['toLowerCase']()
      ['includes'](_0x159ac1),
  );
}
export function createAgentSkillPicker({
  registry: _0x56f43c,
  text: _0x170950,
  onSelect: _0x29ad64,
  slashTrigger: slashTrigger = null,
} = {}) {
  const _0x3464c5 = createAgentElement('div', 'agent-skill-picker'),
    _0x4ce374 = createAgentElement('div', 'agent-floating-menu\x20agent-skill-picker-menu');
  ((_0x4ce374['id'] = 'agent-skill-picker-menu'),
    _0x4ce374['setAttribute']('id', _0x4ce374['id']),
    _0x4ce374['setAttribute']('role', 'listbox'),
    (_0x4ce374['agentPopoverTrigger'] = slashTrigger),
    slashTrigger?.['setAttribute']?.('aria-haspopup', 'listbox'),
    slashTrigger?.['setAttribute']?.('aria-controls', _0x4ce374['id']),
    _0x3464c5['appendChild'](_0x4ce374));
  let _0x5c6b2c = '',
    _0x4ac4e4 = '';
  function _0x377fcc({
    id: id = '',
    title: title = '',
    description: description = '',
    selected: selected = ![],
  } = {}) {
    const _0x5a0717 = createAgentButton('agent-menu-item\x20agent-skill-picker-item', '', {
      icon: agentIconSvg(id ? 'skills' : 'check'),
    });
    ((_0x5a0717['dataset']['agentSkillPick'] = id),
      _0x5a0717['setAttribute']('role', 'option'),
      _0x5a0717['setAttribute']('aria-selected', String(selected)),
      _0x5a0717['classList']['toggle']('active', selected));
    const _0x54cc92 = createAgentElement('span', 'agent-skill-picker-item-copy');
    return (
      _0x54cc92['appendChild'](createAgentElement('span', 'agent-skill-picker-item-title', title)),
      description &&
        _0x54cc92['appendChild'](createAgentElement('span', 'agent-skill-picker-item-desc', description)),
      _0x5a0717['appendChild'](_0x54cc92),
      _0x5a0717
    );
  }
  function _0xd341c1() {
    const _0x4733f4 = listSelectableSkills(_0x56f43c);
    return _0x4733f4['filter']((_0x22fc3f) => matchesSkillQuery(_0x22fc3f, _0x5c6b2c));
  }
  function _0x42b2f8() {
    const _0x3d1fdd = _0xd341c1();
    _0x4ce374['replaceChildren']();
    for (const _0x367505 of _0x3d1fdd) {
      _0x4ce374['appendChild'](
        _0x377fcc({
          id: _0x367505['id'],
          title: _0x367505['title'] || _0x367505['id'],
          description: _0x367505['description'] || '$' + _0x367505['id'],
          selected: _0x367505['id'] === _0x4ac4e4,
        }),
      );
    }
    _0x3d1fdd['length'] === 0x0 &&
      _0x4ce374['appendChild'](
        createAgentElement(
          'div',
          'agent-custom-empty agent-skill-picker-empty',
          _0x170950('skillPickerEmpty'),
        ),
      );
  }
  function _0x48de6d(_0x51af90 = '') {
    ((_0x5c6b2c = String(_0x51af90 || '')['trim']()), (_0x4ac4e4 = ''), _0x42b2f8());
  }
  function _0x158d0b(_0x21baaa = 0x1) {
    const _0x40044f = Array['from'](_0x4ce374['querySelectorAll']('[data-agent-skill-pick]'))['filter'](
      (_0x1f9573) => _0x1f9573['dataset']['agentSkillPick'],
    );
    if (_0x40044f['length'] === 0x0) return ![];
    const _0x480f6c = _0x40044f['findIndex'](
        (_0x4b0e49) => _0x4b0e49['dataset']['agentSkillPick'] === _0x4ac4e4,
      ),
      _0x4f9c0e = Number(_0x21baaa) < 0x0 ? -0x1 : 0x1;
    let _0x40bdee;
    if (_0x480f6c < 0x0) _0x40bdee = _0x4f9c0e > 0x0 ? 0x0 : _0x40044f['length'] - 0x1;
    else _0x40bdee = (_0x480f6c + _0x4f9c0e + _0x40044f['length']) % _0x40044f['length'];
    return (
      (_0x4ac4e4 = _0x40044f[_0x40bdee]['dataset']['agentSkillPick']),
      _0x40044f['forEach']((_0x4bf23a, _0x55ec90) => {
        const _0x16f85a = _0x55ec90 === _0x40bdee;
        (_0x4bf23a['classList']['toggle']('active', _0x16f85a),
          _0x4bf23a['setAttribute']('aria-selected', String(_0x16f85a)));
      }),
      _0x40044f[_0x40bdee]['scrollIntoView']?.({ block: 'nearest' }),
      !![]
    );
  }
  function _0xda274b() {
    const _0x4bae66 = Array['from'](_0x4ce374['querySelectorAll']('[data-agent-skill-pick]'))['filter'](
        (_0x48f3b6) => _0x48f3b6['dataset']['agentSkillPick'],
      ),
      _0x25bb1b =
        _0x4bae66['find']((_0x356f06) => _0x356f06['dataset']['agentSkillPick'] === _0x4ac4e4) ||
        _0x4bae66[0x0];
    if (!_0x25bb1b) return ![];
    const _0x2b68a7 = listSelectableSkills(_0x56f43c)['find'](
      (_0x439b19) => _0x439b19['id'] === _0x25bb1b['dataset']['agentSkillPick'],
    );
    if (!_0x2b68a7) return ![];
    return (_0x29ad64?.(_0x2b68a7), !![]);
  }
  function _0x227f68(_0x2b7cb0) {
    const _0x23271f = _0x2b7cb0['target']?.['closest']?.('[data-agent-skill-pick]');
    if (!_0x23271f || _0x23271f['disabled']) return;
    (_0x2b7cb0['preventDefault']?.(), _0x2b7cb0['stopPropagation']?.());
    const _0x117245 = listSelectableSkills(_0x56f43c)['find'](
      (_0x2967bc) => _0x2967bc['id'] === _0x23271f['dataset']['agentSkillPick'],
    );
    if (_0x117245) _0x29ad64?.(_0x117245);
  }
  const _0x467e93 = createAgentScrollableWheelHandler(_0x4ce374);
  return (
    _0x4ce374['addEventListener']('click', _0x227f68),
    _0x4ce374['addEventListener']('wheel', _0x467e93, { passive: ![] }),
    _0x42b2f8(),
    {
      element: _0x3464c5,
      menu: _0x4ce374,
      render: _0x42b2f8,
      refreshText: _0x42b2f8,
      openSlash: _0x48de6d,
      moveActive: _0x158d0b,
      chooseActive: _0xda274b,
      destroy() {
        (_0x4ce374['removeEventListener']('click', _0x227f68),
          _0x4ce374['removeEventListener']('wheel', _0x467e93));
      },
    }
  );
}
