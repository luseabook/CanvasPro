import { buildAgentRunSteps } from './agentRunSteps.js';
import { agentPanelText } from './agentPanelText.js';
function createEl(_0x2b4cad, _0xfdaaa3 = '', _0x58697e = '') {
  const _0x52ad30 = document['createElement'](_0x2b4cad);
  if (_0xfdaaa3) _0x52ad30['className'] = _0xfdaaa3;
  if (_0x58697e) _0x52ad30['textContent'] = _0x58697e;
  return _0x52ad30;
}
export function createAgentRunStatusPresentation({ root: _0xb9377f } = {}) {
  function _0x2ea610(_0x210f3c = {}) {
    const _0x4a563c = buildAgentRunSteps({
      runEvents: _0x210f3c['runEvents'] || [],
      currentRun: _0x210f3c['currentRun'] || null,
    });
    (_0xb9377f['replaceChildren'](), (_0xb9377f['hidden'] = _0x4a563c['length'] === 0x0));
    if (_0x4a563c['length'] === 0x0) return;
    const _0x523a77 = createEl('div', 'agent-run-steps-title', agentPanelText('runStepsTitle')),
      _0x2ed1ad = createEl('div', 'agent-run-steps-list');
    _0x2ed1ad['setAttribute']('role', 'list');
    for (const _0x3283ef of _0x4a563c) {
      const _0x2ebf28 = createEl('div', 'agent-run-step');
      ((_0x2ebf28['dataset']['status'] = _0x3283ef['status']), _0x2ebf28['setAttribute']('role', 'listitem'));
      const _0x923eb6 = createEl('span', 'agent-run-step-dot');
      (_0x923eb6['setAttribute']('aria-hidden', 'true'),
        _0x2ebf28['append'](_0x923eb6, createEl('span', 'agent-run-step-label', _0x3283ef['label'])),
        _0x2ed1ad['appendChild'](_0x2ebf28));
    }
    _0xb9377f['append'](_0x523a77, _0x2ed1ad);
  }
  return Object['freeze']({ render: _0x2ea610, destroy() {} });
}
