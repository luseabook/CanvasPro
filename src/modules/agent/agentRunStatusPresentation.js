import { buildAgentRunSteps } from './agentRunSteps.js';
import { agentPanelText } from './agentPanelText.js';
function createEl(value, item = '', key = '') {
  const el = document.createElement(value);
  if (item) el.className = item;
  if (key) el.textContent = key;
  return el;
}
export function createAgentRunStatusPresentation({ root: root } = {}) {
  function render(runEvents = {}) {
    const list = buildAgentRunSteps({
      runEvents: runEvents.runEvents || [],
      currentRun: runEvents.currentRun || null,
    });
    (root.replaceChildren(), (root.hidden = list.length === 0));
    if (list.length === 0) return;
    const el2 = createEl('div', 'agent-run-steps-title', agentPanelText('runStepsTitle')),
      el3 = createEl('div', 'agent-run-steps-list');
    el3.setAttribute('role', 'list');
    for (const response of list) {
      const el4 = createEl('div', 'agent-run-step');
      ((el4.dataset.status = response.status), el4.setAttribute('role', 'listitem'));
      const el5 = createEl('span', 'agent-run-step-dot');
      (el5.setAttribute('aria-hidden', 'true'),
        el4.append(el5, createEl('span', 'agent-run-step-label', response.label)),
        el3.appendChild(el4));
    }
    root.append(el2, el3);
  }
  return Object.freeze({ render: render, destroy() {} });
}
