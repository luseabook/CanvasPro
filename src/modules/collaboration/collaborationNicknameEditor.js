import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
export function createCollaborationNicknameEditor({
  row: row,
  controls: controls,
  element: element,
  button: button,
  run: run,
  actions: actions,
  getState: getState,
  person: person,
}) {
  let value = person['name'],
    enabled = ![],
    enabled2 = ![];
  const item = getState()['session'],
    handler = () =>
      !enabled2 &&
      getState()['session']?.['roomId'] === item['roomId'] &&
      getState()['actorId'] === person['id'],
    el = element('form', 'collaboration-nickname-editor');
  el['hidden'] = !![];
  const el2 = element('input', 'collaboration-input');
  ((el2['maxLength'] = 0x20),
    (el2['required'] = !![]),
    el2['setAttribute']('aria-label', '新的协作昵称'),
    (el2['autocomplete'] = 'off'));
  const el3 = button(
    '',
    () => {
      ((el2['value'] = value), (el['hidden'] = ![]), (el3['hidden'] = !![]), el2['focus'](), el2['select']());
    },
    controls,
    ![],
  );
  (el3['setAttribute']('aria-label', '修改我的协作昵称'), el3['append'](createContextMenuIcon('edit')));
  const key = element('button', 'collaboration-button', '保存');
  key['type'] = 'submit';
  const el4 = element('button', 'collaboration-button', '取消');
  el4['type'] = 'button';
  function run2(enabled3 = ![]) {
    ((el['hidden'] = !![]), (el3['hidden'] = ![]));
    if (enabled3 && handler()) el3['focus']();
  }
  return (
    el4['addEventListener']('click', () => {
      if (!enabled) run2(!![]);
    }),
    el2['addEventListener']('input', () => el2['setCustomValidity']('')),
    el['addEventListener']('keydown', (event) => {
      if (event['isComposing'] || event['keyCode'] === 0xe5) {
        if (event['key'] === 'Enter') event['preventDefault']();
        return;
      }
      if (event['key'] === 'Escape') {
        (event['preventDefault'](), event['stopPropagation']());
        if (!enabled) run2(!![]);
      }
    }),
    el['addEventListener']('submit', async (event2) => {
      event2['preventDefault']();
      if (!handler() || enabled) return;
      const enabled4 = el2['value']['trim']();
      if (!enabled4) {
        (el2['setCustomValidity']('请输入昵称'), el2['reportValidity']());
        return;
      }
      if (enabled4 === value) {
        run2(!![]);
        return;
      }
      await run(
        key,
        async () => {
          ((enabled = !![]), (el2['disabled'] = !![]), (el4['disabled'] = !![]), (el3['disabled'] = !![]));
          try {
            (await actions['renameSelf'](enabled4),
              handler() && ((value = enabled4), (el3['disabled'] = ![]), run2(!el['hidden'])));
          } finally {
            ((enabled = ![]), (el2['disabled'] = ![]), (el4['disabled'] = ![]), (el3['disabled'] = ![]));
          }
        },
        '正在更新昵称…',
      );
    }),
    el['append'](el2, key, el4),
    row['append'](el),
    {
      update(index) {
        value = index;
      },
      close() {
        run2();
      },
      destroy() {
        enabled2 = !![];
      },
    }
  );
}
