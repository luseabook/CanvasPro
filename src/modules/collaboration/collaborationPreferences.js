const KEY = 'v2-collaboration-offscreen-members',
  ATTENTION_KEY = 'v2-collaboration-host-attention',
  listeners = new Set();
let memoryValue = !![],
  attentionValue = !![];
export function readHostAttention() {
  try {
    if (globalThis['localStorage'])
      attentionValue = globalThis['localStorage']['getItem'](ATTENTION_KEY) !== 'off';
  } catch {}
  return attentionValue;
}
export function bindHostAttentionSettings(el) {
  if (!el || el['dataset']['collaborationBound']) return;
  el['dataset']['collaborationBound'] = 'true';
  const list = [...el['querySelectorAll']('[data-host-attention]')],
    handler = () =>
      list['forEach']((el2) => {
        const value = (el2['dataset']['hostAttention'] === 'on') === readHostAttention();
        (el2['classList']['toggle']('active', value), el2['setAttribute']('aria-pressed', String(value)));
      });
  (list['forEach']((el3) =>
    el3['addEventListener']('click', () => {
      attentionValue = el3['dataset']['hostAttention'] === 'on';
      try {
        globalThis['localStorage']?.['setItem'](ATTENTION_KEY, attentionValue ? 'on' : 'off');
      } catch {}
      handler();
    }),
  ),
    handler());
}
export function readOffscreenMembers() {
  try {
    if (globalThis['localStorage']) memoryValue = globalThis['localStorage']['getItem'](KEY) !== 'off';
  } catch {}
  return memoryValue;
}
export function setOffscreenMembers(enabled) {
  memoryValue = !!enabled;
  try {
    globalThis['localStorage']?.['setItem'](KEY, enabled ? 'on' : 'off');
  } catch {}
  for (const run of listeners) run(!!enabled);
}
export function subscribeCollaborationPreferences(item) {
  return (listeners['add'](item), () => listeners['delete'](item));
}
export function bindCollaborationSettings(el4) {
  if (!el4 || el4['dataset']['collaborationBound']) return;
  el4['dataset']['collaborationBound'] = 'true';
  const list2 = [...el4['querySelectorAll']('[data-offscreen-members]')],
    handler2 = () =>
      list2['forEach']((el5) => {
        const key = (el5['dataset']['offscreenMembers'] === 'on') === readOffscreenMembers();
        (el5['classList']['toggle']('active', key), el5['setAttribute']('aria-pressed', String(key)));
      });
  (list2['forEach']((el6) =>
    el6['addEventListener']('click', () => {
      (setOffscreenMembers(el6['dataset']['offscreenMembers'] === 'on'), handler2());
    }),
  ),
    handler2());
}
