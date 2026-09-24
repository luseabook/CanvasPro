import { createAgentButton, createAgentElement } from './agentPanelElements.js';
const SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
function createField({ className: className = '', multiline: multiline = ![] } = {}) {
  const _0x5a7c22 = createAgentElement(
      'label',
      ('agent-custom-field\x20agent-skill-editor-field\x20' + className)['trim'](),
    ),
    _0x2b8041 = createAgentElement('span', 'agent-custom-label'),
    _0x36eab2 = createAgentElement(
      multiline ? 'textarea' : 'input',
      multiline ? 'agent-custom-textarea' : 'agent-custom-input',
    );
  if (!multiline) _0x36eab2['type'] = 'text';
  return (
    _0x5a7c22['append'](_0x2b8041, _0x36eab2),
    { field: _0x5a7c22, label: _0x2b8041, control: _0x36eab2 }
  );
}
export function createAgentSkillEditor({ text: _0x3ae329 } = {}) {
  const _0x136409 = createAgentElement('div', 'agent-skill-editor');
  _0x136409['hidden'] = !![];
  const _0x3571b2 = createAgentElement('div', 'agent-skill-editor-heading'),
    _0x335181 = createField({ className: 'agent-skill-editor-name' }),
    _0x65e278 = createField({ className: 'agent-skill-editor-title' }),
    _0x53e522 = createField({ multiline: !![], className: 'agent-skill-editor-description' }),
    _0x362865 = createField({ className: 'agent-skill-editor-triggers' }),
    _0x55396b = createField({ multiline: !![], className: 'agent-skill-editor-instructions' });
  ((_0x335181['control']['maxLength'] = 0x40),
    (_0x65e278['control']['maxLength'] = 0x78),
    (_0x53e522['control']['maxLength'] = 0x258),
    (_0x362865['control']['maxLength'] = 0x7d0),
    (_0x55396b['control']['maxLength'] = 0x18 * 0x400));
  const _0x1c51b6 = createAgentElement('div', 'agent-skill-editor-error');
  (_0x1c51b6['setAttribute']('role', 'alert'), (_0x1c51b6['hidden'] = !![]));
  const _0x423c41 = createAgentElement('div', 'agent-skill-editor-actions'),
    _0x17efc9 = createAgentButton('agent-secondary-btn agent-skill-editor-cancel-btn', ''),
    _0x3d3153 = createAgentButton(
      'agent-primary-btn agent-skill-operation-btn agent-skill-editor-save-btn',
      '',
    ),
    _0x3dd90e = createAgentElement('span', 'agent-skill-save-label');
  (_0x3d3153['append'](_0x3dd90e, createAgentElement('span', 'agent-skill-operation-spinner')),
    _0x423c41['append'](_0x17efc9, _0x3d3153),
    _0x136409['append'](
      _0x3571b2,
      _0x335181['field'],
      _0x65e278['field'],
      _0x53e522['field'],
      _0x362865['field'],
      _0x55396b['field'],
      _0x1c51b6,
      _0x423c41,
    ));
  let _0x3903af = 'create';
  function _0x49182e() {
    ((_0x3571b2['textContent'] = _0x3ae329(
      _0x3903af === 'update' ? 'skillEditorEditTitle' : 'skillEditorCreateTitle',
    )),
      (_0x335181['label']['textContent'] = _0x3ae329('skillNameLabel')),
      (_0x335181['control']['placeholder'] = _0x3ae329('skillNamePlaceholder')),
      (_0x65e278['label']['textContent'] = _0x3ae329('skillTitleLabel')),
      (_0x53e522['label']['textContent'] = _0x3ae329('skillDescriptionLabel')),
      (_0x362865['label']['textContent'] = _0x3ae329('skillTriggersLabel')),
      (_0x362865['control']['placeholder'] = _0x3ae329('skillTriggersPlaceholder')),
      (_0x55396b['label']['textContent'] = _0x3ae329('skillInstructionsLabel')),
      (_0x17efc9['textContent'] = _0x3ae329('skillEditorCancel')),
      (_0x3dd90e['textContent'] = _0x3ae329('skillSave')));
  }
  function _0x450363(_0x1d9844 = '') {
    ((_0x1c51b6['textContent'] = _0x1d9844), (_0x1c51b6['hidden'] = !_0x1d9844));
  }
  function _0x3ab66f(_0x19bf5e = null) {
    ((_0x3903af = _0x19bf5e ? 'update' : 'create'),
      (_0x335181['control']['value'] = _0x19bf5e?.['id'] || ''),
      (_0x335181['control']['disabled'] = _0x3903af === 'update'),
      _0x335181['control']['setAttribute']('aria-disabled', String(_0x3903af === 'update')),
      (_0x65e278['control']['value'] = _0x19bf5e?.['title'] || ''),
      (_0x53e522['control']['value'] = _0x19bf5e?.['description'] || ''),
      (_0x362865['control']['value'] = Array['isArray'](_0x19bf5e?.['triggers'])
        ? _0x19bf5e['triggers']['join'](',\x20')
        : ''),
      (_0x55396b['control']['value'] = _0x19bf5e?.['instructions'] || ''),
      _0x450363(),
      _0x49182e(),
      (_0x136409['hidden'] = ![]),
      (_0x3903af === 'update' ? _0x65e278['control'] : _0x335181['control'])['focus']?.());
  }
  function _0x4598a3() {
    ((_0x136409['hidden'] = !![]), _0x450363());
  }
  function _0xe74d09() {
    const _0x341610 = String(_0x335181['control']['value'] || '')
        ['trim']()
        ['toLowerCase'](),
      _0x2c918c = {
        mode: _0x3903af,
        id: _0x341610,
        title: String(_0x65e278['control']['value'] || '')['trim'](),
        description: String(_0x53e522['control']['value'] || '')['trim'](),
        triggers: String(_0x362865['control']['value'] || '')
          ['split'](/[,，\n]/)
          ['map']((_0x29c977) => _0x29c977['trim']())
          ['filter'](Boolean),
        instructions: String(_0x55396b['control']['value'] || '')['trim'](),
      };
    if (!SKILL_ID_PATTERN['test'](_0x341610))
      return { ok: ![], message: _0x3ae329('skillValidationName'), focus: _0x335181['control'] };
    if (!_0x2c918c['description'] || !_0x2c918c['instructions'])
      return {
        ok: ![],
        message: _0x3ae329('skillValidationRequired'),
        focus: _0x2c918c['description'] ? _0x55396b['control'] : _0x53e522['control'],
      };
    return { ok: !![], definition: _0x2c918c };
  }
  return (
    _0x49182e(),
    {
      element: _0x136409,
      saveButton: _0x3d3153,
      cancelButton: _0x17efc9,
      open: _0x3ab66f,
      close: _0x4598a3,
      refreshText: _0x49182e,
      readDefinition: _0xe74d09,
      setError: _0x450363,
      setBusy(_0x5ca5d3) {
        ((_0x17efc9['disabled'] = _0x5ca5d3), _0x17efc9['setAttribute']('aria-disabled', String(_0x5ca5d3)));
      },
    }
  );
}
