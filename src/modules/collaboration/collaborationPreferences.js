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
export function bindHostAttentionSettings(_0x32c7f6) {
  if (!_0x32c7f6 || _0x32c7f6['dataset']['collaborationBound']) return;
  _0x32c7f6['dataset']['collaborationBound'] = 'true';
  const _0x411211 = [..._0x32c7f6['querySelectorAll']('[data-host-attention]')],
    _0x34a2d5 = () =>
      _0x411211['forEach']((_0x54cd2d) => {
        const _0x4e1ac0 = (_0x54cd2d['dataset']['hostAttention'] === 'on') === readHostAttention();
        (_0x54cd2d['classList']['toggle']('active', _0x4e1ac0),
          _0x54cd2d['setAttribute']('aria-pressed', String(_0x4e1ac0)));
      });
  (_0x411211['forEach']((_0x12cf99) =>
    _0x12cf99['addEventListener']('click', () => {
      attentionValue = _0x12cf99['dataset']['hostAttention'] === 'on';
      try {
        globalThis['localStorage']?.['setItem'](ATTENTION_KEY, attentionValue ? 'on' : 'off');
      } catch {}
      _0x34a2d5();
    }),
  ),
    _0x34a2d5());
}
export function readOffscreenMembers() {
  try {
    if (globalThis['localStorage']) memoryValue = globalThis['localStorage']['getItem'](KEY) !== 'off';
  } catch {}
  return memoryValue;
}
export function setOffscreenMembers(_0x22360a) {
  memoryValue = !!_0x22360a;
  try {
    globalThis['localStorage']?.['setItem'](KEY, _0x22360a ? 'on' : 'off');
  } catch {}
  for (const _0x10f038 of listeners) _0x10f038(!!_0x22360a);
}
export function subscribeCollaborationPreferences(_0x47b20d) {
  return (listeners['add'](_0x47b20d), () => listeners['delete'](_0x47b20d));
}
export function bindCollaborationSettings(_0x5e159a) {
  if (!_0x5e159a || _0x5e159a['dataset']['collaborationBound']) return;
  _0x5e159a['dataset']['collaborationBound'] = 'true';
  const _0x520840 = [..._0x5e159a['querySelectorAll']('[data-offscreen-members]')],
    _0x13a668 = () =>
      _0x520840['forEach']((_0x43956a) => {
        const _0x23f260 = (_0x43956a['dataset']['offscreenMembers'] === 'on') === readOffscreenMembers();
        (_0x43956a['classList']['toggle']('active', _0x23f260),
          _0x43956a['setAttribute']('aria-pressed', String(_0x23f260)));
      });
  (_0x520840['forEach']((_0x19d1a6) =>
    _0x19d1a6['addEventListener']('click', () => {
      (setOffscreenMembers(_0x19d1a6['dataset']['offscreenMembers'] === 'on'), _0x13a668());
    }),
  ),
    _0x13a668());
}
