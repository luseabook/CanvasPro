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
function getInstalledSkills(_0x191592) {
  return (_0x191592?.['listSkills']?.() || [])
    ['filter']((_0x3220a7) => _0x3220a7['source'] === 'installed')
    ['map']((_0x47743d) => ({ ..._0x47743d, editable: _0x47743d['managedBy'] === 'shuo-canvas' }));
}
export function createAgentSkillPanel({
  registry: _0x2468ba,
  refreshSkills: _0x49b6e1,
  installSkill: _0x4ee24a,
  deleteSkill: _0x382fb0,
  saveSkill: _0x1171bc,
  text: _0xd9913c,
  formatText: _0x4b8408,
  onInsert: _0x40a88e,
  onUse: _0x1c9414,
  onCatalogChange: _0x440d75,
  onNotice: _0x1083fe,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  hydrateDisabledAgentSkillIds({ registry: _0x2468ba, windowObject: windowObject });
  const _0x565b36 = createAgentElement('section', 'agent-custom-panel\x20agent-skill-panel');
  ((_0x565b36['hidden'] = !![]), _0x565b36['setAttribute']('aria-hidden', 'true'));
  const _0x283d3e = createAgentElement('div', 'agent-custom-panel-header'),
    _0x18b761 = createAgentElement('div', 'agent-custom-panel-copy'),
    _0x4d95cf = createAgentElement('div', 'agent-custom-panel-title'),
    _0x1d9ec2 = createAgentElement('div', 'agent-custom-panel-desc');
  _0x18b761['append'](_0x4d95cf, _0x1d9ec2);
  const _0x37d10e = createAgentElement('div', 'agent-skill-header-actions'),
    _0x4fec3b = createAgentButton('agent-icon-btn agent-skill-refresh-btn agent-skill-operation-btn', '', {
      icon: agentIconSvg('refresh'),
    }),
    _0x73a9a1 = createAgentButton('agent-custom-close-btn agent-skill-close-btn', '×');
  _0x283d3e['append'](_0x18b761, _0x37d10e);
  const _0x3354fa = createAgentElement('div', 'agent-skill-root-actions'),
    _0x36b5a9 = createAgentButton('agent-secondary-btn\x20agent-skill-create-btn', _0xd9913c('skillCreate'), {
      icon: agentIconSvg('plus'),
    }),
    _0x42310d = createAgentButton(
      'agent-secondary-btn\x20agent-skill-operation-btn\x20agent-skill-import-btn',
      _0xd9913c('skillImport'),
      { icon: agentIconSvg('upload') },
    ),
    _0x719b7d = [
      [_0x4fec3b, 'refresh'],
      [_0x42310d, 'import'],
    ];
  for (const [_0x24e0ed] of _0x719b7d) {
    _0x24e0ed['appendChild'](createAgentElement('span', 'agent-skill-operation-spinner'));
  }
  (_0x3354fa['append'](_0x36b5a9, _0x42310d), _0x37d10e['append'](_0x3354fa, _0x4fec3b, _0x73a9a1));
  const _0x231c9a = createAgentElement('div', 'agent-skill-list');
  _0x231c9a['setAttribute']('role', 'list');
  const _0x3de7c2 = createAgentSkillEditor({ text: _0xd9913c });
  (_0x719b7d['push']([_0x3de7c2['saveButton'], 'save']),
    _0x565b36['append'](_0x283d3e, _0x231c9a, _0x3de7c2['element']));
  let _0x3860a8 = '',
    _0x56f7cf = 0x0,
    _0x1884ff = '',
    _0x530a65 = '',
    _0x5bc75c = ![];
  const _0x19f923 = createAgentScrollableWheelHandler(_0x231c9a),
    _0x2341ba = createAgentScrollableWheelHandler(_0x3de7c2['element']);
  function _0x4aba7b(_0x455fa3, _0x42764a) {
    ((_0x455fa3['title'] = _0x42764a), _0x455fa3['setAttribute']('aria-label', _0x42764a));
  }
  function _0xa069af() {
    if (_0x5bc75c) return;
    const _0x368db7 = _0x2468ba?.['getState']?.() || {},
      _0x1b3cb2 = getInstalledSkills(_0x2468ba);
    _0x1884ff &&
      !_0x1b3cb2['some']((_0x1ec7c2) => _0x1ec7c2['id'] === _0x1884ff) &&
      ((_0x1884ff = ''), (_0x530a65 = ''));
    _0x231c9a['replaceChildren']();
    _0x1b3cb2['length'] === 0x0 &&
      _0x231c9a['appendChild'](
        createAgentElement('div', 'agent-custom-empty agent-skill-empty', _0xd9913c('skillEmpty')),
      );
    for (const _0x3e96ef of _0x1b3cb2) {
      const _0x1fae34 = createAgentElement('div', 'agent-skill-item');
      ((_0x1fae34['dataset']['agentSkillId'] = _0x3e96ef['id']),
        _0x1fae34['setAttribute']('role', 'listitem'),
        _0x1fae34['classList']['toggle']('is-disabled', _0x3e96ef['enabled'] === ![]));
      const _0x2d5ba = createAgentElement('div', 'agent-skill-item-copy');
      _0x2d5ba['append'](
        createAgentElement('div', 'agent-skill-item-title', _0x3e96ef['title'] || _0x3e96ef['id']),
        createAgentElement('div', 'agent-skill-item-id', '$' + _0x3e96ef['id']),
        createAgentElement('div', 'agent-skill-item-desc', _0x3e96ef['description'] || ''),
      );
      const _0x2fef06 = createAgentElement('div', 'agent-skill-item-actions');
      if (_0x1884ff === _0x3e96ef['id']) {
        const _0x3822eb = createAgentElement('div', 'agent-skill-delete-confirm');
        (_0x3822eb['setAttribute']('role', 'alertdialog'),
          _0x3822eb['setAttribute'](
            'aria-label',
            _0x4b8408('skillDeleteConfirmLabel', { name: _0x3e96ef['title'] || _0x3e96ef['id'] }),
          ));
        const _0x550fbe = createAgentButton(
          'agent-secondary-btn agent-skill-delete-confirm-btn',
          _0xd9913c('skillDeleteConfirm'),
          { disabled: Boolean(_0x3860a8) },
        );
        ((_0x550fbe['dataset']['agentSkillDeleteConfirm'] = _0x3e96ef['id']),
          _0x550fbe['setAttribute'](
            'aria-busy',
            String(_0x3860a8 === 'delete' && _0x530a65 === _0x3e96ef['id']),
          ));
        const _0x12147c = createAgentButton(
          'agent-secondary-btn agent-skill-delete-cancel-btn',
          _0xd9913c('skillDeleteCancel'),
          { disabled: Boolean(_0x3860a8) },
        );
        ((_0x12147c['dataset']['agentSkillDeleteCancel'] = _0x3e96ef['id']),
          _0x3822eb['append'](_0x550fbe, _0x12147c),
          _0x2fef06['appendChild'](_0x3822eb));
      } else {
        const _0x56aeb2 = createAgentButton(
          'agent-icon-btn agent-skill-action-btn agent-skill-insert-btn',
          '',
          {
            title: _0xd9913c('skillInsert'),
            icon: agentIconSvg('wand'),
            disabled: _0x3e96ef['enabled'] === ![],
          },
        );
        _0x56aeb2['dataset']['agentSkillInsert'] = _0x3e96ef['id'];
        const _0x469358 = createAgentButton('agent-skill-toggle-btn', '', {
          title: _0xd9913c(_0x3e96ef['enabled'] === ![] ? 'skillEnable' : 'skillDisable'),
        });
        ((_0x469358['dataset']['agentSkillToggle'] = _0x3e96ef['id']),
          _0x469358['setAttribute']('role', 'switch'),
          _0x469358['setAttribute']('aria-checked', String(_0x3e96ef['enabled'] !== ![])),
          _0x469358['appendChild'](createAgentElement('span', 'agent-skill-toggle-thumb')),
          _0x2fef06['append'](_0x469358, _0x56aeb2));
        if (_0x3e96ef['editable']) {
          const _0x5299dc = createAgentButton(
            'agent-icon-btn\x20agent-skill-action-btn\x20agent-skill-edit-btn',
            '',
            { title: _0xd9913c('skillEdit'), icon: agentIconSvg('edit') },
          );
          ((_0x5299dc['dataset']['agentSkillEdit'] = _0x3e96ef['id']), _0x2fef06['appendChild'](_0x5299dc));
        }
        const _0x340971 = createAgentButton(
          'agent-icon-btn agent-skill-action-btn agent-skill-delete-btn',
          '',
          { title: _0xd9913c('skillDelete'), icon: agentIconSvg('close') },
        );
        ((_0x340971['dataset']['agentSkillDelete'] = _0x3e96ef['id']), _0x2fef06['appendChild'](_0x340971));
      }
      (_0x1fae34['append'](_0x2d5ba, _0x2fef06), _0x231c9a['appendChild'](_0x1fae34));
    }
    (Number(_0x368db7['diagnostics']?.['length'] || 0x0) > 0x0 &&
      _0x231c9a['appendChild'](
        createAgentElement(
          'div',
          'agent-skill-diagnostics',
          _0x4b8408('skillDiagnostics', { count: _0x368db7['diagnostics']['length'] }),
        ),
      ),
      _0x440d75?.());
  }
  function _0x58821d() {
    ((_0x4d95cf['textContent'] = _0xd9913c('skillPanelTitle')),
      (_0x1d9ec2['textContent'] = _0xd9913c('skillPanelDesc')),
      _0x4aba7b(_0x4fec3b, _0xd9913c('skillRefresh')),
      _0x4aba7b(_0x73a9a1, _0xd9913c('skillClose')),
      (_0x42310d['querySelector']('.agent-btn-label')['textContent'] = _0xd9913c('skillImport')),
      (_0x36b5a9['querySelector']('.agent-btn-label')['textContent'] = _0xd9913c('skillCreate')),
      _0x3de7c2['refreshText'](),
      _0xa069af());
  }
  function _0x5e6aa3(_0x13a760 = '') {
    _0x3860a8 = _0x13a760;
    for (const [_0x38e005, _0x50a52a] of _0x719b7d) {
      const _0x1bc67a = _0x13a760 === _0x50a52a;
      ((_0x38e005['disabled'] = Boolean(_0x13a760)),
        _0x38e005['setAttribute']('aria-disabled', String(Boolean(_0x13a760))),
        _0x38e005['setAttribute']('aria-busy', String(_0x1bc67a)),
        _0x38e005['classList']['toggle']('is-loading', _0x1bc67a));
    }
    ((_0x36b5a9['disabled'] = Boolean(_0x13a760)),
      _0x36b5a9['setAttribute']('aria-disabled', String(Boolean(_0x13a760))),
      _0x3de7c2['setBusy'](Boolean(_0x13a760)));
  }
  async function _0xd93941(_0xf0801f, _0x13802d, _0x39ff3f, _0x4ba670) {
    if (_0x3860a8 || typeof _0x13802d !== 'function') return null;
    const _0x559813 = ++_0x56f7cf;
    _0x5e6aa3(_0xf0801f);
    try {
      const _0x5a17cd = await _0x13802d();
      if (_0x5bc75c || _0x559813 !== _0x56f7cf) return _0x5a17cd;
      return (await _0x39ff3f?.(_0x5a17cd), _0x5a17cd);
    } catch (_0x7a8572) {
      if (!_0x5bc75c && _0x559813 === _0x56f7cf) _0x4ba670?.(_0x7a8572);
      return { success: ![], error: _0x7a8572 };
    } finally {
      if (!_0x5bc75c && _0x559813 === _0x56f7cf) {
        _0x5e6aa3('');
        if (_0xf0801f === 'delete') _0xa069af();
      }
    }
  }
  function _0x5e47fa() {
    return _0xd93941(
      'refresh',
      _0x49b6e1,
      (_0x2662a3) => {
        (_0xa069af(),
          _0x2662a3?.['available'] === ![]
            ? _0x1083fe?.(_0xd9913c('skillRefreshFailed'))
            : _0x1083fe?.(_0x4b8408('skillRefreshDone', { count: _0x2662a3?.['loaded'] || 0x0 })));
      },
      () => _0x1083fe?.(_0xd9913c('skillRefreshFailed')),
    );
  }
  function _0x3a8ccb() {
    return _0xd93941(
      'import',
      _0x4ee24a,
      (_0xc901f2) => {
        if (_0xc901f2?.['canceled']) return;
        if (_0xc901f2?.['success'] === !![]) {
          _0xa069af();
          const _0x51ed81 =
            _0xc901f2['scriptsSkipped'] || Number(_0xc901f2['skippedResources'] || 0x0) > 0x0
              ? 'skillImportRestricted'
              : 'skillImportDone';
          _0x1083fe?.(_0x4b8408(_0x51ed81, { name: _0xc901f2['skillId'] || 'Skill' }));
          !_0x565b36['hidden'] &&
            _0xc901f2['skillId'] &&
            _0x231c9a['querySelector']('[data-agent-skill-insert="' + _0xc901f2['skillId'] + '\x22]')?.[
              'focus'
            ]?.();
          return;
        }
        if (_0xc901f2?.['errorCode'] === 'SKILL_REFRESH_AFTER_INSTALL_FAILED')
          _0x1083fe?.(_0xd9913c('skillImportRefreshFailed'));
        else {
          if (_0xc901f2?.['errorCode'] === 'SKILL_ALREADY_INSTALLED')
            _0x1083fe?.(_0xd9913c('skillImportDuplicate'));
          else
            /^(?:SKILL_MD_|SKILL_SOURCE_|INVALID_SKILL|MISSING_SKILL)/['test'](_0xc901f2?.['errorCode'] || '')
              ? _0x1083fe?.(_0xd9913c('skillImportInvalid'))
              : _0x1083fe?.(_0xd9913c('skillImportFailed'));
        }
      },
      () => _0x1083fe?.(_0xd9913c('skillImportFailed')),
    );
  }
  function _0x5bb81a(_0x4d9b76) {
    if (_0x3860a8) return;
    ((_0x1884ff = String(_0x4d9b76 || '')),
      (_0x530a65 = ''),
      _0xa069af(),
      !_0x565b36['hidden'] &&
        _0x1884ff &&
        _0x231c9a['querySelector']('[data-agent-skill-delete-confirm="' + _0x1884ff + '\x22]')?.[
          'focus'
        ]?.());
  }
  function _0xf67f7c(_0x1370ee) {
    if (_0x3860a8 || _0x1884ff !== _0x1370ee) return;
    ((_0x1884ff = ''),
      (_0x530a65 = ''),
      _0xa069af(),
      !_0x565b36['hidden'] &&
        _0x1370ee &&
        _0x231c9a['querySelector']('[data-agent-skill-delete=\x22' + _0x1370ee + '\x22]')?.['focus']?.());
  }
  function _0x530638(_0x38c40e) {
    if (_0x3860a8 || _0x1884ff !== _0x38c40e) return Promise['resolve'](null);
    _0x530a65 = _0x38c40e;
    const _0x5f460b = _0xd93941(
      'delete',
      () => _0x382fb0?.({ id: _0x38c40e, confirmed: !![] }),
      (_0x414bad) => {
        if (_0x414bad?.['success'] === !![]) {
          ((_0x1884ff = ''),
            (_0x530a65 = ''),
            _0xa069af(),
            _0x1083fe?.(_0x4b8408('skillDeleteDone', { name: _0x414bad['skillId'] || _0x38c40e })));
          return;
        }
        ((_0x530a65 = ''),
          _0x414bad?.['errorCode'] === 'SKILL_REFRESH_AFTER_DELETE_FAILED'
            ? ((_0x1884ff = ''), _0xa069af(), _0x1083fe?.(_0xd9913c('skillDeleteRefreshFailed')))
            : _0x1083fe?.(_0xd9913c('skillDeleteFailed')));
      },
      () => {
        ((_0x530a65 = ''), _0x1083fe?.(_0xd9913c('skillDeleteFailed')));
      },
    );
    return (_0xa069af(), _0x5f460b);
  }
  function _0x5455f4({ focusId: focusId = '' } = {}) {
    (_0x3de7c2['close'](),
      (_0x3354fa['hidden'] = ![]),
      (_0x231c9a['hidden'] = ![]),
      focusId &&
        !_0x565b36['hidden'] &&
        _0x231c9a['querySelector']('[data-agent-skill-edit="' + focusId + '\x22]')?.['focus']?.());
  }
  function _0x104084(_0x4e5b21 = null) {
    if (_0x3860a8) return;
    ((_0x3354fa['hidden'] = !![]), (_0x231c9a['hidden'] = !![]), _0x3de7c2['open'](_0x4e5b21));
  }
  function _0x17bbd1() {
    if (_0x3860a8) return;
    (_0x40a88e?.(_0xd9913c('skillCreatePrompt')), _0x3f3b21());
  }
  function _0x49bd2c() {
    const _0x4df4eb = _0x3de7c2['readDefinition']();
    if (!_0x4df4eb['ok'])
      return (
        _0x3de7c2['setError'](_0x4df4eb['message']),
        _0x4df4eb['focus']?.['focus']?.(),
        Promise['resolve']({ success: ![], errorCode: 'SKILL_FORM_INVALID' })
      );
    return (
      _0x3de7c2['setError'](),
      _0xd93941(
        'save',
        () => _0x1171bc?.(_0x4df4eb['definition']),
        (_0x326ae2) => {
          if (_0x326ae2?.['success'] === !![]) {
            (_0xa069af(),
              _0x5455f4({ focusId: _0x326ae2['skillId'] }),
              _0x1083fe?.(_0x4b8408('skillSaveDone', { name: _0x326ae2['skillId'] || 'Skill' })));
            return;
          }
          if (_0x326ae2?.['errorCode'] === 'SKILL_ALREADY_INSTALLED')
            _0x3de7c2['setError'](_0xd9913c('skillSaveDuplicate'));
          else {
            if (_0x326ae2?.['errorCode'] === 'SKILL_NOT_EDITABLE')
              _0x3de7c2['setError'](_0xd9913c('skillSaveReadOnly'));
            else
              _0x326ae2?.['errorCode'] === 'SKILL_REFRESH_AFTER_SAVE_FAILED'
                ? _0x3de7c2['setError'](_0xd9913c('skillSaveRefreshFailed'))
                : _0x3de7c2['setError'](_0xd9913c('skillSaveFailed'));
          }
        },
        () => _0x3de7c2['setError'](_0xd9913c('skillSaveFailed')),
      )
    );
  }
  function _0x157171() {
    (_0x58821d(),
      _0x5455f4(),
      (_0x565b36['hidden'] = ![]),
      _0x565b36['setAttribute']('aria-hidden', 'false'),
      _0x565b36['classList']['add']('is-open'));
  }
  function _0x3f3b21() {
    (_0x5455f4(),
      !_0x3860a8 && ((_0x1884ff = ''), (_0x530a65 = ''), _0xa069af()),
      _0x565b36['classList']['remove']('is-open'),
      _0x565b36['setAttribute']('aria-hidden', 'true'),
      (_0x565b36['hidden'] = !![]));
  }
  return (
    _0x231c9a['addEventListener']('click', (_0x286309) => {
      const _0x9f0e5a = _0x286309['target']?.['closest']?.('[data-agent-skill-delete-confirm]');
      if (_0x9f0e5a) {
        _0x530638(_0x9f0e5a['dataset']['agentSkillDeleteConfirm']);
        return;
      }
      const _0x4ac364 = _0x286309['target']?.['closest']?.('[data-agent-skill-delete-cancel]');
      if (_0x4ac364) {
        _0xf67f7c(_0x4ac364['dataset']['agentSkillDeleteCancel']);
        return;
      }
      const _0x341045 = _0x286309['target']?.['closest']?.('[data-agent-skill-delete]');
      if (_0x341045) {
        _0x5bb81a(_0x341045['dataset']['agentSkillDelete']);
        return;
      }
      if (_0x3860a8) return;
      const _0x1ae0c4 = _0x286309['target']?.['closest']?.('[data-agent-skill-edit]');
      if (_0x1ae0c4) {
        const _0x5ee862 = getInstalledSkills(_0x2468ba)['find'](
          (_0xd910c5) => _0xd910c5['id'] === _0x1ae0c4['dataset']['agentSkillEdit'] && _0xd910c5['editable'],
        );
        if (_0x5ee862) _0x104084(_0x5ee862);
        return;
      }
      const _0x4d58b7 = _0x286309['target']?.['closest']?.('[data-agent-skill-toggle]');
      if (_0x4d58b7) {
        const _0x4fe3d0 = _0x4d58b7['dataset']['agentSkillToggle'],
          _0x1ef9b0 = getInstalledSkills(_0x2468ba)['find']((_0xda7968) => _0xda7968['id'] === _0x4fe3d0);
        setAgentSkillEnabledPreference({
          registry: _0x2468ba,
          skillId: _0x4fe3d0,
          enabled: _0x1ef9b0?.['enabled'] === ![],
          windowObject: windowObject,
        }) && _0xa069af();
        return;
      }
      const _0x2b2851 = _0x286309['target']?.['closest']?.('[data-agent-skill-insert]');
      if (!_0x2b2851 || _0x2b2851['disabled']) return;
      if (typeof _0x1c9414 === 'function') _0x1c9414(_0x2b2851['dataset']['agentSkillInsert']);
      else _0x40a88e?.('$' + _0x2b2851['dataset']['agentSkillInsert'] + '\x20');
      _0x3f3b21();
    }),
    _0x231c9a['addEventListener']('wheel', _0x19f923, { passive: ![] }),
    _0x3de7c2['element']['addEventListener']('wheel', _0x2341ba, { passive: ![], capture: !![] }),
    _0x4fec3b['addEventListener']('click', _0x5e47fa),
    _0x42310d['addEventListener']('click', _0x3a8ccb),
    _0x36b5a9['addEventListener']('click', _0x17bbd1),
    _0x3de7c2['cancelButton']['addEventListener']('click', () => _0x5455f4()),
    _0x3de7c2['saveButton']['addEventListener']('click', _0x49bd2c),
    _0x73a9a1['addEventListener']('click', _0x3f3b21),
    _0x58821d(),
    {
      element: _0x565b36,
      open: _0x157171,
      close: _0x3f3b21,
      render: _0xa069af,
      refresh: _0x5e47fa,
      install: _0x3a8ccb,
      requestDelete: _0x5bb81a,
      confirmDelete: _0x530638,
      save: _0x49bd2c,
      refreshText: _0x58821d,
      destroy() {
        ((_0x5bc75c = !![]),
          (_0x56f7cf += 0x1),
          _0x231c9a['removeEventListener']('wheel', _0x19f923),
          _0x3de7c2['element']['removeEventListener']('wheel', _0x2341ba, !![]),
          _0x5e6aa3(''));
      },
    }
  );
}
export const agentSkillPanelInternals = Object['freeze']({
  getInstalledSkills: getInstalledSkills,
  readDisabledSkillIds: readDisabledAgentSkillIds,
});
