import { agentIconSvg, createAgentButton, createAgentElement } from './agentPanelElements.js';
import { createAgentScrollableWheelHandler } from './agentScrollableWheel.js';
function listSelectableSkills(value) {
  return (value?.['listSkills']?.() || [])['filter'](
    (item) => item['source'] === 'installed' && item['enabled'] !== ![],
  );
}
function matchesSkillQuery(key, index = '') {
  const enabled = String(index || '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled) return !![];
  return [key['id'], key['title'], key['description']]['some']((result) =>
    String(result || '')
      ['toLowerCase']()
      ['includes'](enabled),
  );
}
export function createAgentSkillPicker({
  registry: registry,
  text: text,
  onSelect: onSelect,
  slashTrigger: slashTrigger = null,
} = {}) {
  const element = createAgentElement('div', 'agent-skill-picker'),
    menu = createAgentElement('div', 'agent-floating-menu\x20agent-skill-picker-menu');
  ((menu['id'] = 'agent-skill-picker-menu'),
    menu['setAttribute']('id', menu['id']),
    menu['setAttribute']('role', 'listbox'),
    (menu['agentPopoverTrigger'] = slashTrigger),
    slashTrigger?.['setAttribute']?.('aria-haspopup', 'listbox'),
    slashTrigger?.['setAttribute']?.('aria-controls', menu['id']),
    element['appendChild'](menu));
  let data = '',
    options = '';
  function run({
    id: id = '',
    title: title = '',
    description: description = '',
    selected: selected = ![],
  } = {}) {
    const el = createAgentButton('agent-menu-item\x20agent-skill-picker-item', '', {
      icon: agentIconSvg(id ? 'skills' : 'check'),
    });
    ((el['dataset']['agentSkillPick'] = id),
      el['setAttribute']('role', 'option'),
      el['setAttribute']('aria-selected', String(selected)),
      el['classList']['toggle']('active', selected));
    const el2 = createAgentElement('span', 'agent-skill-picker-item-copy');
    return (
      el2['appendChild'](createAgentElement('span', 'agent-skill-picker-item-title', title)),
      description &&
        el2['appendChild'](createAgentElement('span', 'agent-skill-picker-item-desc', description)),
      el['appendChild'](el2),
      el
    );
  }
  function run2() {
    const list = listSelectableSkills(registry);
    return list['filter']((target) => matchesSkillQuery(target, data));
  }
  function render() {
    const list2 = run2();
    menu['replaceChildren']();
    for (const id2 of list2) {
      menu['appendChild'](
        run({
          id: id2['id'],
          title: id2['title'] || id2['id'],
          description: id2['description'] || '$' + id2['id'],
          selected: id2['id'] === options,
        }),
      );
    }
    list2['length'] === 0x0 &&
      menu['appendChild'](
        createAgentElement('div', 'agent-custom-empty agent-skill-picker-empty', text('skillPickerEmpty')),
      );
  }
  function openSlash(source = '') {
    ((data = String(source || '')['trim']()), (options = ''), render());
  }
  function moveActive(next = 0x1) {
    const list3 = Array['from'](menu['querySelectorAll']('[data-agent-skill-pick]'))['filter'](
      (el3) => el3['dataset']['agentSkillPick'],
    );
    if (list3['length'] === 0x0) return ![];
    const count = list3['findIndex']((el4) => el4['dataset']['agentSkillPick'] === options),
      count2 = Number(next) < 0x0 ? -0x1 : 0x1;
    let current;
    if (count < 0x0) current = count2 > 0x0 ? 0x0 : list3['length'] - 0x1;
    else current = (count + count2 + list3['length']) % list3['length'];
    return (
      (options = list3[current]['dataset']['agentSkillPick']),
      list3['forEach']((el5, entry) => {
        const record = entry === current;
        (el5['classList']['toggle']('active', record), el5['setAttribute']('aria-selected', String(record)));
      }),
      list3[current]['scrollIntoView']?.({ block: 'nearest' }),
      !![]
    );
  }
  function chooseActive() {
    const list4 = Array['from'](menu['querySelectorAll']('[data-agent-skill-pick]'))['filter'](
        (el6) => el6['dataset']['agentSkillPick'],
      ),
      el7 = list4['find']((el8) => el8['dataset']['agentSkillPick'] === options) || list4[0x0];
    if (!el7) return ![];
    const listSelectableSkills2 = listSelectableSkills(registry)['find'](
      (payload) => payload['id'] === el7['dataset']['agentSkillPick'],
    );
    if (!listSelectableSkills2) return ![];
    return (onSelect?.(listSelectableSkills2), !![]);
  }
  function run3(event) {
    const el9 = event['target']?.['closest']?.('[data-agent-skill-pick]');
    if (!el9 || el9['disabled']) return;
    (event['preventDefault']?.(), event['stopPropagation']?.());
    const listSelectableSkills3 = listSelectableSkills(registry)['find'](
      (handle) => handle['id'] === el9['dataset']['agentSkillPick'],
    );
    if (listSelectableSkills3) onSelect?.(listSelectableSkills3);
  }
  const agentScrollableWheelHandler = createAgentScrollableWheelHandler(menu);
  return (
    menu['addEventListener']('click', run3),
    menu['addEventListener']('wheel', agentScrollableWheelHandler, { passive: ![] }),
    render(),
    {
      element: element,
      menu: menu,
      render: render,
      refreshText: render,
      openSlash: openSlash,
      moveActive: moveActive,
      chooseActive: chooseActive,
      destroy() {
        (menu['removeEventListener']('click', run3),
          menu['removeEventListener']('wheel', agentScrollableWheelHandler));
      },
    }
  );
}
