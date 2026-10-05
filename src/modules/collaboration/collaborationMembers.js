import { collaborationMemberColor } from './collaborationMemberColor.js';
import { createCollaborationSelect } from './collaborationSelect.js';
import { createCollaborationNicknameEditor } from './collaborationNicknameEditor.js';
const ROLES = { owner: '房主', admin: '管理员', editor: '可编辑', viewer: '只读' };
export function onlineCollaborationActors(response, value) {
  const item = new Set(
    (response?.['presence'] || [])
      ['filter']((enabled) => !enabled['expiresAt'] || enabled['expiresAt'] * 1000 > Date['now']())
      ['map']((key) => key['actorId']),
  );
  if (response && value && !['offline', 'blocked']['includes'](response['status'])) item['add'](value);
  return item;
}
export function createCollaborationMembers({
  root: root,
  element: element,
  button: button,
  run: run,
  actions: actions,
  confirmAction: confirmAction,
  getState: getState,
}) {
  let index = '';
  const map = new Map();
  function render(result) {
    const data = result['session'],
      options = JSON['stringify']([data?.['roomId'], result['actorId'], data?.['role'], data?.['members']]);
    if (options !== index) {
      index = options;
      const map2 = new Set((data?.['members'] || [])['map']((target) => target['id']));
      for (const [source, next] of map)
        !map2['has'](source) &&
          (next['nickname']?.['destroy'](),
          next['permission']?.['destroy'](),
          next['row']['remove'](),
          map['delete'](source));
      for (const person of data?.['members'] || []) {
        const key2 = JSON['stringify']([
            data['roomId'],
            result['actorId'],
            data['role'],
            person['id'] === result['actorId'] ? { ...person, name: undefined } : person,
          ]),
          error = map['get'](person['id']);
        if (error?.['key'] === key2) {
          error['name'] !== person['name'] &&
            ((error['label']['textContent'] = person['name'] + '（你）'),
            (error['avatar']['textContent'] = person['name']['slice'](0, 1)),
            (error['name'] = person['name']),
            error['nickname']?.['update'](person['name']));
          continue;
        }
        (error?.['nickname']?.['destroy'](),
          map['get'](person['id'])?.['permission']?.['destroy'](),
          map['get'](person['id'])?.['row']['remove']());
        const row = element('div', 'collaboration-member');
        row['style']['setProperty']('--member-color', collaborationMemberColor(person));
        const enabled2 = person['id'] === result['actorId'],
          label = element(
            'span',
            'collaboration-member-name',
            '' + person['name'] + (enabled2 ? '（你）' : ''),
          ),
          online = element('span', 'collaboration-member-online');
        online['setAttribute']('role', 'img');
        const controls = element('div', 'collaboration-member-actions'),
          avatar = element('span', 'collaboration-avatar', person['name']['slice'](0, 1));
        row['append'](avatar, label, online, controls);
        const enabled3 =
          !enabled2 &&
          person['role'] !== 'owner' &&
          (data['role'] === 'owner' || (data['role'] === 'admin' && person['role'] !== 'admin'));
        if (!enabled3)
          controls['append'](element('span', 'collaboration-member-role', ROLES[person['role']]));
        let follow, permission;
        if (!enabled2) {
          ((follow = button(
            '跟随',
            () =>
              actions['follow'](
                getState()['session']?.['followActorId'] === person['id'] ? '' : person['id'],
              ),
            controls,
            ![],
          )),
            follow['setAttribute']('aria-label', '跟随 ' + person['name']));
          if (enabled3) {
            const el = element('select', 'collaboration-input');
            el['setAttribute']('aria-label', person['name'] + '的权限');
            for (const current of data['role'] === 'owner'
              ? ['admin', 'editor', 'viewer']
              : ['editor', 'viewer']) {
              const el2 = element('option', '', ROLES[current]);
              ((el2['value'] = current), el['append'](el2));
            }
            ((el['value'] = person['role']),
              controls['append'](el),
              (permission = createCollaborationSelect(el, person['name'] + '的权限')),
              el['addEventListener']('change', async () => {
                const entry = await run(permission['trigger'], async () => {
                  try {
                    await actions['member'](person['id'], el['value']);
                  } catch (record) {
                    ((el['value'] = person['role']), permission['sync']());
                    throw record;
                  }
                });
                entry === ![] && ((el['value'] = person['role']), permission['sync']());
              }));
            const el3 = button(
              '移除',
              () =>
                confirmAction('移除 ' + person['name'] + ' 并使现有邀请信息失效？', () =>
                  actions['remove'](person['id']),
                ),
              controls,
            );
            (el3['classList']['add']('collaboration-danger'),
              el3['setAttribute']('aria-label', '移除 ' + person['name']));
          }
        }
        const nickname = enabled2
          ? createCollaborationNicknameEditor({
              row: row,
              controls: controls,
              element: element,
              button: button,
              run: run,
              actions: actions,
              getState: getState,
              person: person,
            })
          : null;
        map['set'](person['id'], {
          online: online,
          follow: follow,
          permission: permission,
          nickname: nickname,
          avatar: avatar,
          label: label,
          row: row,
          key: key2,
          name: person['name'],
        });
      }
      (data?.['members'] || [])['forEach']((payload, handle) => {
        const state = map['get'](payload['id'])['row'];
        if (root['children'][handle] !== state) root['insertBefore'](state, root['children'][handle] || null);
      });
    }
    const map3 = onlineCollaborationActors(data, result['actorId']);
    for (const [config, error2] of map) {
      const enabled4 = map3['has'](config),
        enabled5 = data['followActorId'] === config;
      (error2['isOnline'] !== enabled4 &&
        ((error2['online']['dataset']['online'] = String(enabled4)),
        error2['online']['setAttribute']('aria-label', enabled4 ? '在线' : '离线')),
        error2['follow'] &&
          (error2['isOnline'] !== enabled4 || error2['following'] !== enabled5) &&
          ((error2['follow']['disabled'] = !enabled5 && !enabled4),
          (error2['follow']['textContent'] = enabled5 ? '中止跟随' : '跟随'),
          error2['follow']['setAttribute']('aria-pressed', String(enabled5)),
          error2['follow']['setAttribute'](
            'aria-label',
            error2['follow']['textContent'] + ' ' + error2['name'],
          )),
        (error2['isOnline'] = enabled4),
        (error2['following'] = enabled5));
    }
    return map3['size'];
  }
  return {
    render: render,
    close() {
      for (const scope of map['values']()) {
        (scope['permission']?.['close'](), scope['nickname']?.['close']());
      }
    },
    destroy() {
      for (const input of map['values']()) {
        (input['permission']?.['destroy'](), input['nickname']?.['destroy']());
      }
      map['clear']();
    },
  };
}
