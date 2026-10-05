import { createAgentButton, createAgentElement } from './agentPanelElements.js';
const SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
function createField({ className: className = '', multiline: multiline = false } = {}) {
  const field = createAgentElement(
      'label',
      ('agent-custom-field agent-skill-editor-field ' + className)['trim'](),
    ),
    label = createAgentElement('span', 'agent-custom-label'),
    control = createAgentElement(
      multiline ? 'textarea' : 'input',
      multiline ? 'agent-custom-textarea' : 'agent-custom-input',
    );
  if (!multiline) control['type'] = 'text';
  return (field['append'](label, control), { field: field, label: label, control: control });
}
export function createAgentSkillEditor({ text: text } = {}) {
  const element = createAgentElement('div', 'agent-skill-editor');
  element['hidden'] = true;
  const el = createAgentElement('div', 'agent-skill-editor-heading'),
    focus = createField({ className: 'agent-skill-editor-name' }),
    field2 = createField({ className: 'agent-skill-editor-title' }),
    field3 = createField({ multiline: true, className: 'agent-skill-editor-description' }),
    field4 = createField({ className: 'agent-skill-editor-triggers' }),
    field5 = createField({ multiline: true, className: 'agent-skill-editor-instructions' });
  ((focus['control']['maxLength'] = 64),
    (field2['control']['maxLength'] = 120),
    (field3['control']['maxLength'] = 600),
    (field4['control']['maxLength'] = 2000),
    (field5['control']['maxLength'] = 24 * 1024));
  const el2 = createAgentElement('div', 'agent-skill-editor-error');
  (el2['setAttribute']('role', 'alert'), (el2['hidden'] = true));
  const agentElement = createAgentElement('div', 'agent-skill-editor-actions'),
    cancelButton = createAgentButton('agent-secondary-btn agent-skill-editor-cancel-btn', ''),
    saveButton = createAgentButton(
      'agent-primary-btn agent-skill-operation-btn agent-skill-editor-save-btn',
      '',
    ),
    el3 = createAgentElement('span', 'agent-skill-save-label');
  (saveButton['append'](el3, createAgentElement('span', 'agent-skill-operation-spinner')),
    agentElement['append'](cancelButton, saveButton),
    element['append'](
      el,
      focus['field'],
      field2['field'],
      field3['field'],
      field4['field'],
      field5['field'],
      el2,
      agentElement,
    ));
  let mode = 'create';
  function refreshText() {
    ((el['textContent'] = text(mode === 'update' ? 'skillEditorEditTitle' : 'skillEditorCreateTitle')),
      (focus['label']['textContent'] = text('skillNameLabel')),
      (focus['control']['placeholder'] = text('skillNamePlaceholder')),
      (field2['label']['textContent'] = text('skillTitleLabel')),
      (field3['label']['textContent'] = text('skillDescriptionLabel')),
      (field4['label']['textContent'] = text('skillTriggersLabel')),
      (field4['control']['placeholder'] = text('skillTriggersPlaceholder')),
      (field5['label']['textContent'] = text('skillInstructionsLabel')),
      (cancelButton['textContent'] = text('skillEditorCancel')),
      (el3['textContent'] = text('skillSave')));
  }
  function setError(enabled = '') {
    ((el2['textContent'] = enabled), (el2['hidden'] = !enabled));
  }
  function open(value = null) {
    ((mode = value ? 'update' : 'create'),
      (focus['control']['value'] = value?.['id'] || ''),
      (focus['control']['disabled'] = mode === 'update'),
      focus['control']['setAttribute']('aria-disabled', String(mode === 'update')),
      (field2['control']['value'] = value?.['title'] || ''),
      (field3['control']['value'] = value?.['description'] || ''),
      (field4['control']['value'] = Array['isArray'](value?.['triggers'])
        ? value['triggers']['join'](', ')
        : ''),
      (field5['control']['value'] = value?.['instructions'] || ''),
      setError(),
      refreshText(),
      (element['hidden'] = false),
      (mode === 'update' ? field2['control'] : focus['control'])['focus']?.());
  }
  function close() {
    ((element['hidden'] = true), setError());
  }
  function readDefinition() {
    const id = String(focus['control']['value'] || '')
        ['trim']()
        ['toLowerCase'](),
      focus2 = {
        mode: mode,
        id: id,
        title: String(field2['control']['value'] || '')['trim'](),
        description: String(field3['control']['value'] || '')['trim'](),
        triggers: String(field4['control']['value'] || '')
          ['split'](/[,，\n]/)
          ['map']((item) => item['trim']())
          ['filter'](Boolean),
        instructions: String(field5['control']['value'] || '')['trim'](),
      };
    if (!SKILL_ID_PATTERN['test'](id))
      return { ok: false, message: text('skillValidationName'), focus: focus['control'] };
    if (!focus2['description'] || !focus2['instructions'])
      return {
        ok: false,
        message: text('skillValidationRequired'),
        focus: focus2['description'] ? field5['control'] : field3['control'],
      };
    return { ok: true, definition: focus2 };
  }
  return (
    refreshText(),
    {
      element: element,
      saveButton: saveButton,
      cancelButton: cancelButton,
      open: open,
      close: close,
      refreshText: refreshText,
      readDefinition: readDefinition,
      setError: setError,
      setBusy(key) {
        ((cancelButton['disabled'] = key), cancelButton['setAttribute']('aria-disabled', String(key)));
      },
    }
  );
}
