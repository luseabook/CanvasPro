import { reviewElement, reviewTime } from './collaborationReviewDom.js';
const LABELS = {
  create: '新增了',
  update: '修改了',
  delete: '删除了',
  generating: '开始生成',
  generationEnd: '结束生成',
  comment: '评论了',
  resolve: '解决了评论：',
  reopen: '重新打开评论：',
  chat: '发送了聊天消息',
};
export function createCollaborationActivity({ root: root, getState: getState, actions: actions }) {
  const el = reviewElement('details', 'collaboration-activity'),
    reviewElement2 = reviewElement('summary', '', '协作动态');
  reviewElement2['tabIndex'] = 0;
  const el2 = reviewElement('p', 'collaboration-feedback');
  el2['setAttribute']('role', 'status');
  const el3 = reviewElement('button', 'collaboration-button', '重试加载');
  el3['addEventListener']('click', () => actions['refreshReview']?.());
  const el4 = reviewElement('div', 'collaboration-activity-list');
  (el4['setAttribute']('aria-label', '最近协作动态'),
    el['append'](reviewElement2, el2, el3, el4),
    root['append'](el));
  let value = '',
    item = '';
  const map = new Map();
  el['addEventListener']('toggle', () => {
    if (el['open']) render();
  });
  function render() {
    const key = getState(),
      enabled = key['session']?.['review'];
    item !== key['session']?.['roomId'] &&
      ((item = key['session']?.['roomId']),
      (value = ''),
      (el['open'] = false),
      map['clear'](),
      el4['replaceChildren']());
    if (!el['open']) return;
    const index = !!enabled?.['loading'] && enabled['revision'] < 0,
      result = enabled?.['error'] || (index ? '正在加载动态…' : '最近 100 条操作');
    if (el2['textContent'] !== result) el2['textContent'] = result;
    (el2['classList']['toggle']('is-pending', index),
      (el3['hidden'] = !enabled?.['error']),
      (el3['disabled'] = !!enabled?.['loading']));
    const data = JSON['stringify'](enabled?.['activities'] || []);
    if (value !== data) {
      value = data;
      const count = el4['scrollTop'],
        options = el4['getBoundingClientRect']()['top'],
        el5 =
          count > 0
            ? [...el4['children']]['find']((el6) => el6['getBoundingClientRect']()['bottom'] > options)
            : null,
        target = el5?.['getBoundingClientRect']()['top'],
        map2 = new Set();
      let el7 = el4['firstChild'];
      for (const error of enabled?.['activities'] || []) {
        map2['add'](error['seq']);
        let el8 = map['get'](error['seq']);
        if (!el8) {
          ((el8 = reviewElement('div', 'collaboration-activity-item')),
            el8['classList']['toggle']('is-mentioned', error['mentions']?.['includes'](key['actorId'])),
            el8['append'](
              reviewElement('span', '', error['name'] + ' ' + (LABELS[error['kind']] || '操作了')),
            ));
          for (const error2 of error['nodes']) {
            const el9 = reviewElement(
              'button',
              'collaboration-button collaboration-text-action',
              error2['name'],
            );
            ((el9['dataset']['nodeId'] = error2['id']),
              (el9['disabled'] = actions['hasReviewNode'] ? !actions['hasReviewNode'](error2['id']) : true),
              el9['addEventListener']('click', () =>
                actions['openReviewNode']?.(
                  error2['id'],
                  ['comment', 'resolve', 'reopen']['includes'](error['kind']),
                ),
              ),
              el8['append'](el9));
          }
          (el8['append'](reviewElement('time', 'collaboration-subtle', reviewTime(error['created']))),
            map['set'](error['seq'], el8));
        }
        if (el8 !== el7) el4['insertBefore'](el8, el7);
        el7 = el8['nextSibling'];
      }
      while (el7) {
        const source = el7['nextSibling'];
        (el7['remove'](), (el7 = source));
      }
      for (const next of map['keys']()) if (!map2['has'](next)) map['delete'](next);
      if (!el4['childElementCount'])
        el4['append'](reviewElement('p', 'collaboration-subtle', '还没有协作动态'));
      el4['scrollTop'] = el5?.['isConnected']
        ? el4['scrollTop'] + el5['getBoundingClientRect']()['top'] - target
        : count;
    }
    for (const el10 of el4['querySelectorAll']('button[data-node-id]')) {
      const current = !actions['hasReviewNode']?.(el10['dataset']['nodeId']);
      if (el10['disabled'] !== current) el10['disabled'] = current;
    }
  }
  return { render: render };
}
