import { agentIconSvg, createAgentButton, createAgentElement } from './agentPanelElements.js';
import { createAgentScrollableWheelHandler } from './agentScrollableWheel.js';
import { createAgentSkillEditor } from './agentSkillEditor.js';
import {
  AGENT_DISABLED_SKILLS_STORAGE_KEY,
  hydrateDisabledAgentSkillIds,
  readDisabledAgentSkillIds,
  setAgentSkillEnabledPreference,
} from './agentSkillPreferences.js';
export { AGENT_DISABLED_SKILLS_STORAGE_KEY } from './agentSkillPreferences.js';
function getInstalledSkills(value) {
  return (value?.['listSkills']?.() || [])
    ['filter']((item) => item['source'] === 'installed')
    ['map']((editable) => ({ ...editable, editable: editable['managedBy'] === 'shuo-canvas' }));
}
export function createAgentSkillPanel({
  registry: registry,
  refreshSkills: refreshSkills,
  installSkill: installSkill,
  deleteSkill: deleteSkill,
  saveSkill: saveSkill,
  text: text,
  formatText: formatText,
  onInsert: onInsert,
  onUse: onUse,
  onCatalogChange: onCatalogChange,
  onNotice: onNotice,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  hydrateDisabledAgentSkillIds({ registry: registry, windowObject: windowObject });
  const element = createAgentElement('section', 'agent-custom-panel\x20agent-skill-panel');
  ((element['hidden'] = !![]), element['setAttribute']('aria-hidden', 'true'));
  const agentElement = createAgentElement('div', 'agent-custom-panel-header'),
    agentElement2 = createAgentElement('div', 'agent-custom-panel-copy'),
    el = createAgentElement('div', 'agent-custom-panel-title'),
    el2 = createAgentElement('div', 'agent-custom-panel-desc');
  agentElement2['append'](el, el2);
  const agentElement3 = createAgentElement('div', 'agent-skill-header-actions'),
    el3 = createAgentButton('agent-icon-btn agent-skill-refresh-btn agent-skill-operation-btn', '', {
      icon: agentIconSvg('refresh'),
    }),
    el4 = createAgentButton('agent-custom-close-btn agent-skill-close-btn', '×');
  agentElement['append'](agentElement2, agentElement3);
  const el5 = createAgentElement('div', 'agent-skill-root-actions'),
    el6 = createAgentButton('agent-secondary-btn\x20agent-skill-create-btn', text('skillCreate'), {
      icon: agentIconSvg('plus'),
    }),
    el7 = createAgentButton(
      'agent-secondary-btn\x20agent-skill-operation-btn\x20agent-skill-import-btn',
      text('skillImport'),
      { icon: agentIconSvg('upload') },
    ),
    list = [
      [el3, 'refresh'],
      [el7, 'import'],
    ];
  for (const [el8] of list) {
    el8['appendChild'](createAgentElement('span', 'agent-skill-operation-spinner'));
  }
  (el5['append'](el6, el7), agentElement3['append'](el5, el3, el4));
  const el9 = createAgentElement('div', 'agent-skill-list');
  el9['setAttribute']('role', 'list');
  const agentSkillEditor = createAgentSkillEditor({ text: text });
  (list['push']([agentSkillEditor['saveButton'], 'save']),
    element['append'](agentElement, el9, agentSkillEditor['element']));
  let enabled = '',
    key = 0x0,
    index = '',
    result = '',
    enabled2 = ![];
  const agentScrollableWheelHandler = createAgentScrollableWheelHandler(el9),
    agentScrollableWheelHandler2 = createAgentScrollableWheelHandler(agentSkillEditor['element']);
  function run(el10, data) {
    ((el10['title'] = data), el10['setAttribute']('aria-label', data));
  }
  function render() {
    if (enabled2) return;
    const count = registry?.['getState']?.() || {},
      list2 = getInstalledSkills(registry);
    index && !list2['some']((options) => options['id'] === index) && ((index = ''), (result = ''));
    el9['replaceChildren']();
    list2['length'] === 0x0 &&
      el9['appendChild'](
        createAgentElement('div', 'agent-custom-empty agent-skill-empty', text('skillEmpty')),
      );
    for (const name of list2) {
      const el11 = createAgentElement('div', 'agent-skill-item');
      ((el11['dataset']['agentSkillId'] = name['id']),
        el11['setAttribute']('role', 'listitem'),
        el11['classList']['toggle']('is-disabled', name['enabled'] === ![]));
      const agentElement4 = createAgentElement('div', 'agent-skill-item-copy');
      agentElement4['append'](
        createAgentElement('div', 'agent-skill-item-title', name['title'] || name['id']),
        createAgentElement('div', 'agent-skill-item-id', '$' + name['id']),
        createAgentElement('div', 'agent-skill-item-desc', name['description'] || ''),
      );
      const el12 = createAgentElement('div', 'agent-skill-item-actions');
      if (index === name['id']) {
        const el13 = createAgentElement('div', 'agent-skill-delete-confirm');
        (el13['setAttribute']('role', 'alertdialog'),
          el13['setAttribute'](
            'aria-label',
            formatText('skillDeleteConfirmLabel', { name: name['title'] || name['id'] }),
          ));
        const el14 = createAgentButton(
          'agent-secondary-btn agent-skill-delete-confirm-btn',
          text('skillDeleteConfirm'),
          { disabled: Boolean(enabled) },
        );
        ((el14['dataset']['agentSkillDeleteConfirm'] = name['id']),
          el14['setAttribute']('aria-busy', String(enabled === 'delete' && result === name['id'])));
        const el15 = createAgentButton(
          'agent-secondary-btn agent-skill-delete-cancel-btn',
          text('skillDeleteCancel'),
          { disabled: Boolean(enabled) },
        );
        ((el15['dataset']['agentSkillDeleteCancel'] = name['id']),
          el13['append'](el14, el15),
          el12['appendChild'](el13));
      } else {
        const el16 = createAgentButton('agent-icon-btn agent-skill-action-btn agent-skill-insert-btn', '', {
          title: text('skillInsert'),
          icon: agentIconSvg('wand'),
          disabled: name['enabled'] === ![],
        });
        el16['dataset']['agentSkillInsert'] = name['id'];
        const el17 = createAgentButton('agent-skill-toggle-btn', '', {
          title: text(name['enabled'] === ![] ? 'skillEnable' : 'skillDisable'),
        });
        ((el17['dataset']['agentSkillToggle'] = name['id']),
          el17['setAttribute']('role', 'switch'),
          el17['setAttribute']('aria-checked', String(name['enabled'] !== ![])),
          el17['appendChild'](createAgentElement('span', 'agent-skill-toggle-thumb')),
          el12['append'](el17, el16));
        if (name['editable']) {
          const el18 = createAgentButton(
            'agent-icon-btn\x20agent-skill-action-btn\x20agent-skill-edit-btn',
            '',
            { title: text('skillEdit'), icon: agentIconSvg('edit') },
          );
          ((el18['dataset']['agentSkillEdit'] = name['id']), el12['appendChild'](el18));
        }
        const el19 = createAgentButton('agent-icon-btn agent-skill-action-btn agent-skill-delete-btn', '', {
          title: text('skillDelete'),
          icon: agentIconSvg('close'),
        });
        ((el19['dataset']['agentSkillDelete'] = name['id']), el12['appendChild'](el19));
      }
      (el11['append'](agentElement4, el12), el9['appendChild'](el11));
    }
    (Number(count['diagnostics']?.['length'] || 0x0) > 0x0 &&
      el9['appendChild'](
        createAgentElement(
          'div',
          'agent-skill-diagnostics',
          formatText('skillDiagnostics', { count: count['diagnostics']['length'] }),
        ),
      ),
      onCatalogChange?.());
  }
  function refreshText() {
    ((el['textContent'] = text('skillPanelTitle')),
      (el2['textContent'] = text('skillPanelDesc')),
      run(el3, text('skillRefresh')),
      run(el4, text('skillClose')),
      (el7['querySelector']('.agent-btn-label')['textContent'] = text('skillImport')),
      (el6['querySelector']('.agent-btn-label')['textContent'] = text('skillCreate')),
      agentSkillEditor['refreshText'](),
      render());
  }
  function run2(target = '') {
    enabled = target;
    for (const [el20, source] of list) {
      const next = target === source;
      ((el20['disabled'] = Boolean(target)),
        el20['setAttribute']('aria-disabled', String(Boolean(target))),
        el20['setAttribute']('aria-busy', String(next)),
        el20['classList']['toggle']('is-loading', next));
    }
    ((el6['disabled'] = Boolean(target)),
      el6['setAttribute']('aria-disabled', String(Boolean(target))),
      agentSkillEditor['setBusy'](Boolean(target)));
  }
  async function run3(current, handler, entry, record) {
    if (enabled || typeof handler !== 'function') return null;
    const payload = ++key;
    run2(current);
    try {
      const handle = await handler();
      if (enabled2 || payload !== key) return handle;
      return (await entry?.(handle), handle);
    } catch (error) {
      if (!enabled2 && payload === key) record?.(error);
      return { success: ![], error: error };
    } finally {
      if (!enabled2 && payload === key) {
        run2('');
        if (current === 'delete') render();
      }
    }
  }
  function refresh() {
    return run3(
      'refresh',
      refreshSkills,
      (count2) => {
        (render(),
          count2?.['available'] === ![]
            ? onNotice?.(text('skillRefreshFailed'))
            : onNotice?.(formatText('skillRefreshDone', { count: count2?.['loaded'] || 0x0 })));
      },
      () => onNotice?.(text('skillRefreshFailed')),
    );
  }
  function install() {
    return run3(
      'import',
      installSkill,
      (name2) => {
        if (name2?.['canceled']) return;
        if (name2?.['success'] === !![]) {
          render();
          const state =
            name2['scriptsSkipped'] || Number(name2['skippedResources'] || 0x0) > 0x0
              ? 'skillImportRestricted'
              : 'skillImportDone';
          onNotice?.(formatText(state, { name: name2['skillId'] || 'Skill' }));
          !element['hidden'] &&
            name2['skillId'] &&
            el9['querySelector']('[data-agent-skill-insert="' + name2['skillId'] + '\x22]')?.['focus']?.();
          return;
        }
        if (name2?.['errorCode'] === 'SKILL_REFRESH_AFTER_INSTALL_FAILED')
          onNotice?.(text('skillImportRefreshFailed'));
        else {
          if (name2?.['errorCode'] === 'SKILL_ALREADY_INSTALLED') onNotice?.(text('skillImportDuplicate'));
          else
            /^(?:SKILL_MD_|SKILL_SOURCE_|INVALID_SKILL|MISSING_SKILL)/['test'](name2?.['errorCode'] || '')
              ? onNotice?.(text('skillImportInvalid'))
              : onNotice?.(text('skillImportFailed'));
        }
      },
      () => onNotice?.(text('skillImportFailed')),
    );
  }
  function requestDelete(config) {
    if (enabled) return;
    ((index = String(config || '')),
      (result = ''),
      render(),
      !element['hidden'] &&
        index &&
        el9['querySelector']('[data-agent-skill-delete-confirm="' + index + '\x22]')?.['focus']?.());
  }
  function run4(scope) {
    if (enabled || index !== scope) return;
    ((index = ''),
      (result = ''),
      render(),
      !element['hidden'] &&
        scope &&
        el9['querySelector']('[data-agent-skill-delete=\x22' + scope + '\x22]')?.['focus']?.());
  }
  function confirmDelete(id) {
    if (enabled || index !== id) return Promise['resolve'](null);
    result = id;
    const input = run3(
      'delete',
      () => deleteSkill?.({ id: id, confirmed: !![] }),
      (name3) => {
        if (name3?.['success'] === !![]) {
          ((index = ''),
            (result = ''),
            render(),
            onNotice?.(formatText('skillDeleteDone', { name: name3['skillId'] || id })));
          return;
        }
        ((result = ''),
          name3?.['errorCode'] === 'SKILL_REFRESH_AFTER_DELETE_FAILED'
            ? ((index = ''), render(), onNotice?.(text('skillDeleteRefreshFailed')))
            : onNotice?.(text('skillDeleteFailed')));
      },
      () => {
        ((result = ''), onNotice?.(text('skillDeleteFailed')));
      },
    );
    return (render(), input);
  }
  function run5({ focusId: focusId = '' } = {}) {
    (agentSkillEditor['close'](),
      (el5['hidden'] = ![]),
      (el9['hidden'] = ![]),
      focusId &&
        !element['hidden'] &&
        el9['querySelector']('[data-agent-skill-edit="' + focusId + '\x22]')?.['focus']?.());
  }
  function run6(value2 = null) {
    if (enabled) return;
    ((el5['hidden'] = !![]), (el9['hidden'] = !![]), agentSkillEditor['open'](value2));
  }
  function run7() {
    if (enabled) return;
    (onInsert?.(text('skillCreatePrompt')), close());
  }
  function save() {
    const el21 = agentSkillEditor['readDefinition']();
    if (!el21['ok'])
      return (
        agentSkillEditor['setError'](el21['message']),
        el21['focus']?.['focus']?.(),
        Promise['resolve']({ success: ![], errorCode: 'SKILL_FORM_INVALID' })
      );
    return (
      agentSkillEditor['setError'](),
      run3(
        'save',
        () => saveSkill?.(el21['definition']),
        (focusId2) => {
          if (focusId2?.['success'] === !![]) {
            (render(),
              run5({ focusId: focusId2['skillId'] }),
              onNotice?.(formatText('skillSaveDone', { name: focusId2['skillId'] || 'Skill' })));
            return;
          }
          if (focusId2?.['errorCode'] === 'SKILL_ALREADY_INSTALLED')
            agentSkillEditor['setError'](text('skillSaveDuplicate'));
          else {
            if (focusId2?.['errorCode'] === 'SKILL_NOT_EDITABLE')
              agentSkillEditor['setError'](text('skillSaveReadOnly'));
            else
              focusId2?.['errorCode'] === 'SKILL_REFRESH_AFTER_SAVE_FAILED'
                ? agentSkillEditor['setError'](text('skillSaveRefreshFailed'))
                : agentSkillEditor['setError'](text('skillSaveFailed'));
          }
        },
        () => agentSkillEditor['setError'](text('skillSaveFailed')),
      )
    );
  }
  function open() {
    (refreshText(),
      run5(),
      (element['hidden'] = ![]),
      element['setAttribute']('aria-hidden', 'false'),
      element['classList']['add']('is-open'));
  }
  function close() {
    (run5(),
      !enabled && ((index = ''), (result = ''), render()),
      element['classList']['remove']('is-open'),
      element['setAttribute']('aria-hidden', 'true'),
      (element['hidden'] = !![]));
  }
  return (
    el9['addEventListener']('click', (event) => {
      const el22 = event['target']?.['closest']?.('[data-agent-skill-delete-confirm]');
      if (el22) {
        confirmDelete(el22['dataset']['agentSkillDeleteConfirm']);
        return;
      }
      const el23 = event['target']?.['closest']?.('[data-agent-skill-delete-cancel]');
      if (el23) {
        run4(el23['dataset']['agentSkillDeleteCancel']);
        return;
      }
      const el24 = event['target']?.['closest']?.('[data-agent-skill-delete]');
      if (el24) {
        requestDelete(el24['dataset']['agentSkillDelete']);
        return;
      }
      if (enabled) return;
      const el25 = event['target']?.['closest']?.('[data-agent-skill-edit]');
      if (el25) {
        const installedSkills = getInstalledSkills(registry)['find'](
          (output) => output['id'] === el25['dataset']['agentSkillEdit'] && output['editable'],
        );
        if (installedSkills) run6(installedSkills);
        return;
      }
      const el26 = event['target']?.['closest']?.('[data-agent-skill-toggle]');
      if (el26) {
        const skillId = el26['dataset']['agentSkillToggle'],
          enabled3 = getInstalledSkills(registry)['find']((value3) => value3['id'] === skillId);
        setAgentSkillEnabledPreference({
          registry: registry,
          skillId: skillId,
          enabled: enabled3?.['enabled'] === ![],
          windowObject: windowObject,
        }) && render();
        return;
      }
      const el27 = event['target']?.['closest']?.('[data-agent-skill-insert]');
      if (!el27 || el27['disabled']) return;
      if (typeof onUse === 'function') onUse(el27['dataset']['agentSkillInsert']);
      else onInsert?.('$' + el27['dataset']['agentSkillInsert'] + '\x20');
      close();
    }),
    el9['addEventListener']('wheel', agentScrollableWheelHandler, { passive: ![] }),
    agentSkillEditor['element']['addEventListener']('wheel', agentScrollableWheelHandler2, {
      passive: ![],
      capture: !![],
    }),
    el3['addEventListener']('click', refresh),
    el7['addEventListener']('click', install),
    el6['addEventListener']('click', run7),
    agentSkillEditor['cancelButton']['addEventListener']('click', () => run5()),
    agentSkillEditor['saveButton']['addEventListener']('click', save),
    el4['addEventListener']('click', close),
    refreshText(),
    {
      element: element,
      open: open,
      close: close,
      render: render,
      refresh: refresh,
      install: install,
      requestDelete: requestDelete,
      confirmDelete: confirmDelete,
      save: save,
      refreshText: refreshText,
      destroy() {
        ((enabled2 = !![]),
          (key += 0x1),
          el9['removeEventListener']('wheel', agentScrollableWheelHandler),
          agentSkillEditor['element']['removeEventListener']('wheel', agentScrollableWheelHandler2, !![]),
          run2(''));
      },
    }
  );
}
export const agentSkillPanelInternals = Object['freeze']({
  getInstalledSkills: getInstalledSkills,
  readDisabledSkillIds: readDisabledAgentSkillIds,
});
