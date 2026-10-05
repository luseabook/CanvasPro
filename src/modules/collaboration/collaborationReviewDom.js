export function reviewElement(value, item = '', key = '') {
  const el = document['createElement'](value);
  ((el['className'] = item), (el['textContent'] = key));
  if (value === 'button') el['type'] = 'button';
  return el;
}
export function reviewTime(index) {
  return new Date(index * 1000)['toLocaleString']([], {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
import { collaborationMemberColor } from './collaborationMemberColor.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
export function colorMemberName(el2, result) {
  return (
    el2['classList']['add']('collaboration-member-name'),
    el2['style']['setProperty']('--member-color', collaborationMemberColor(result)),
    el2
  );
}
export function appendMentionText(data, list, list2 = [], list3 = []) {
  const list4 = list2['filter']((error) => list3['includes'](error['id']) && error['name'])['sort'](
    (error2, error3) => error3['name']['length'] - error2['name']['length'],
  );
  let options = '';
  for (let target = 0; target < list['length'];) {
    const error4 =
      list[target] === '@' &&
      list4['find'](
        (error5) =>
          list['startsWith']('@' + error5['name'], target) &&
          !/[\p{L}\p{N}_]/u['test'](list[target + error5['name']['length'] + 1] || ''),
      );
    if (!error4) {
      options += list[target++];
      continue;
    }
    (data['append'](document['createTextNode'](options)),
      (options = ''),
      data['append'](colorMemberName(reviewElement('span', '', '@' + error4['name']), error4)),
      (target += error4['name']['length'] + 1));
  }
  data['append'](document['createTextNode'](options));
}
export function reviewAvatar(error6) {
  const el3 = reviewElement(
    'span',
    'collaboration-message-avatar',
    Array['from'](error6['name'] || '成员')[0],
  );
  return (
    el3['style']['setProperty']('--member-color', collaborationMemberColor(error6)),
    el3['setAttribute']('aria-hidden', 'true'),
    el3
  );
}
export function reviewSendButton(el4, source = false) {
  (el4['setAttribute']('aria-label', source ? '发送中…' : '发送'),
    el4['replaceChildren'](createContextMenuIcon('send')));
}
