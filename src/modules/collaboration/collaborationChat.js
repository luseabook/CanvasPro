import {
  reviewElement,
  reviewTime,
  reviewAvatar,
  reviewSendButton,
  colorMemberName,
} from './collaborationReviewDom.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
import { createCollaborationChatState } from './collaborationChatState.js';
import { bindCollaborationChatPosition } from './collaborationChatPosition.js';
import { showToast } from '../../services/toastService.js';
import { updateNodeReference } from './collaborationNodeReference.js';
import { bindTextareaMentions } from '../../components/shared/textareaMentions.js';
export function createCollaborationChat({ store: store, getSession: getSession, openNode: openNode }) {
  const root = reviewElement('section', 'collaboration-chat');
  ((root['hidden'] = true),
    root['setAttribute']('aria-label', '协作聊天'),
    root['setAttribute']('popover', 'manual'));
  const el = reviewElement('button', 'collaboration-chat-bubble');
  (el['setAttribute']('aria-label', '展开协作聊天'), el['append'](createContextMenuIcon('comment')));
  const el2 = reviewElement('span', 'collaboration-chat-badge');
  el['append'](el2);
  const el3 = reviewElement('div', 'collaboration-chat-panel'),
    reviewElement2 = reviewElement('div', 'collaboration-chat-header');
  reviewElement2['append'](reviewElement('strong', '', '协作聊天'));
  const el4 = reviewElement('span', 'collaboration-subtle');
  reviewElement2['append'](el4);
  const el5 = reviewElement('button', 'collaboration-button', '收起');
  reviewElement2['append'](el5);
  const el6 = reviewElement('p', 'collaboration-chat-status');
  el6['setAttribute']('role', 'status');
  const el7 = reviewElement('button', 'collaboration-button', '重新加载'),
    el8 = reviewElement('div', 'collaboration-chat-messages');
  (el8['setAttribute']('aria-label', '聊天记录'),
    (el8['tabIndex'] = 0),
    (el8['dataset']['readonlyTextSelectionRoot'] = 'true'));
  const el9 = reviewElement('button', 'collaboration-button', '加载更早消息');
  el8['append'](el9);
  const el10 = reviewElement('p', 'collaboration-subtle', '和成员聊聊，输入 @ 引用节点或提及成员');
  el8['append'](el10);
  const el11 = reviewElement('form', 'collaboration-chat-composer'),
    el12 = reviewElement('div', 'collaboration-chat-refs'),
    input = reviewElement('textarea', 'collaboration-input');
  ((input['maxLength'] = 2000),
    (input['rows'] = 3),
    (input['placeholder'] = '发送消息，@ 节点或成员'),
    input['setAttribute']('aria-label', '聊天消息'));
  const menu = reviewElement('div', 'collaboration-chat-picker');
  ((menu['hidden'] = true), menu['setAttribute']('aria-label', '引用节点或成员'));
  const reviewElement3 = reviewElement('div', 'collaboration-actions'),
    trigger = reviewElement('button', 'collaboration-button', '@ 引用'),
    el13 = reviewElement('button', 'collaboration-button', '加入所选节点'),
    el14 = reviewElement('button', 'collaboration-button collaboration-primary', '发送');
  ((el14['type'] = 'submit'),
    reviewElement3['append'](trigger, el13, el14),
    el11['append'](el12, input, menu, reviewElement3));
  const resizeHandle = reviewElement('div', 'collaboration-chat-resize');
  (resizeHandle['setAttribute']('aria-label', '拖动调整聊天框大小'),
    el3['append'](reviewElement2, el6, el7, el8, el11, resizeHandle),
    root['append'](el, el3),
    document['body']['append'](root));
  const bindCollaborationChatPosition2 = bindCollaborationChatPosition({
    root: root,
    handles: [reviewElement2, el],
    resizeHandle: resizeHandle,
  });
  let enabled = true,
    enabled2 = null,
    value = '',
    item = false;
  const map = new Map(),
    mentions = createCollaborationChatState({
      getSession: getSession,
      onChange: onChange,
      onMention(error) {
        const key = getSession();
        showToast(error['name'] + ' 在协作聊天中提到了你', 'ok', 6000, {
          onClick() {
            if (item || getSession() !== key) return;
            run();
            const run2 = () => {
              if (item || getSession() !== key || !enabled) return;
              const el15 = map['get'](error['id']);
              if (el15)
                el8['scrollTop'] +=
                  el15['getBoundingClientRect']()['top'] -
                  el8['getBoundingClientRect']()['top'] -
                  (el8['clientHeight'] - el15['offsetHeight']) / 2;
            };
            (run2(),
              Promise['allSettled'](root['getAnimations']()['map']((index) => index['finished']))['then'](
                run2,
              ));
          },
        });
      },
    }),
    bindTextareaMentions2 = bindTextareaMentions({
      input: input,
      trigger: trigger,
      menu: menu,
      optionRole: 'button',
      getCandidates(result) {
        const run3 = (data) => String(data)['toLocaleLowerCase']()['includes'](result['toLocaleLowerCase']());
        return [
          ...(run3('所有人') ? [{ id: '@all', kind: 'mentions', label: '@所有人' }] : []),
          ...(enabled2?.['state']['members'] || [])
            ['filter']((error2) => run3(error2['name']))
            ['map']((id2) => ({
              id: id2['id'],
              kind: 'mentions',
              label: '@' + id2['name'],
              visual: reviewAvatar(id2),
            })),
          ...Object['values'](store['getStateRaw']()['nodes'])
            ['filter']((error3) => run3(error3['name'] || error3['id']))
            ['map']((id3) => ({
              id: id3['id'],
              kind: 'nodeIds',
              label: id3['name'] || id3['id'],
            })),
        ];
      },
      onSelect(options, target) {
        const dom = mentions['snapshot'](),
          list = [
            ...new Set([
              ...dom[options['kind']],
              ...(options['id'] === '@all'
                ? enabled2['state']['members']['map']((source) => source['id'])
                : [options['id']]),
            ]),
          ];
        if (list['length'] > 20) return showToast('每条消息最多引用 20 个节点或提及 20 位成员', 'warn');
        const body = target['typed']
          ? dom['body']['slice'](0, target['start']) + dom['body']['slice'](target['end'])
          : dom['body'];
        (mentions['edit']({ [options['kind']]: list, body: body }),
          input['setSelectionRange'](target['start'], target['start']));
      },
    });
  function run4(next) {
    if (!store['getStateRaw']()['nodes'][next]) return showToast('该节点已删除', 'ok');
    openNode(next);
  }
  function onChange(dom2) {
    if (item) return;
    const current = getSession();
    current !== enabled2 &&
      ((enabled2 = current),
      map['clear'](),
      el8['replaceChildren'](el9, el10),
      (value = ''),
      bindTextareaMentions2['close']());
    root['hidden'] = !enabled2;
    if (!enabled2) {
      if (root['matches'](':popover-open')) root['hidePopover']();
      return;
    }
    if (!root['matches'](':popover-open')) root['showPopover']();
    (root['classList']['toggle']('is-collapsed', !enabled),
      (el3['hidden'] = !enabled),
      (el['hidden'] = enabled),
      (el2['hidden'] = !dom2['unread']),
      (el2['textContent'] = dom2['mentioned'] ? '@' : String(Math['min'](dom2['unread'], 99))),
      el['setAttribute'](
        'aria-label',
        dom2['unread']
          ? '展开协作聊天，' + dom2['unread'] + ' 条未读' + (dom2['mentioned'] ? '，有人提及你' : '')
          : '展开协作聊天',
      ),
      (el4['textContent'] = (enabled2['state']['members']?.['length'] || 0) + ' 位成员'),
      (el6['textContent'] =
        dom2['error'] ||
        (dom2['sending']
          ? '正在发送…'
          : dom2['loading']
            ? '正在加载…'
            : enabled2['state']['status'] !== 'online'
              ? '连接未就绪，消息将在发送时尝试连接'
              : '')),
      (el6['hidden'] = !el6['textContent']),
      (el7['hidden'] = !dom2['error'] || dom2['sending']),
      (el7['disabled'] = dom2['loading']),
      (el14['disabled'] = dom2['sending'] || (!dom2['body']['trim']() && !dom2['nodeIds']['length'])),
      el14['setAttribute']('aria-busy', String(dom2['sending'])),
      reviewSendButton(el14, dom2['sending']));
    for (const el16 of [input, trigger, el13]) el16['disabled'] = dom2['sending'];
    if (input['value'] !== dom2['body']) input['value'] = dom2['body'];
    const entry = el8['scrollHeight'] - el8['scrollTop'] - el8['clientHeight'] < 40,
      record = el8['scrollHeight'],
      payload = el8['scrollTop'],
      handle = el10['nextSibling']?.['dataset']['messageId'],
      state = handle && dom2['messages'][0]?.['id'] !== handle;
    let config = el10['nextSibling'];
    for (const id4 of dom2['messages']) {
      let el17 = map['get'](id4['id']);
      if (!el17) {
        ((el17 = reviewElement('article', 'collaboration-chat-message')),
          (el17['dataset']['messageId'] = id4['id']),
          el17['classList']['toggle']('is-self', id4['actor'] === enabled2['state']['actorId']),
          el17['classList']['toggle'](
            'is-mentioned',
            id4['mentions']['includes'](enabled2['state']['actorId']),
          ));
        const el18 = reviewElement('div', 'collaboration-chat-meta');
        (el18['append'](
          reviewElement('strong', '', id4['name']),
          reviewElement('time', '', reviewTime(id4['created'])),
        ),
          (el18['firstChild']['dataset']['memberId'] = id4['actor']));
        const reviewElement4 = reviewElement('div', 'collaboration-message-bubble');
        (reviewElement4['append'](reviewElement('p', '', id4['body'])),
          el17['append'](
            reviewAvatar(
              enabled2['state']['members']?.['find']((scope) => scope['id'] === id4['actor']) || {
                id: id4['actor'],
                name: id4['name'],
              },
            ),
            el18,
            reviewElement4,
          ));
        for (const output of id4['mentions']) {
          const el19 = reviewElement(
            'button',
            'collaboration-chat-mention',
            '@' +
              (enabled2['state']['members']?.['find']((value2) => value2['id'] === output)?.['name'] ||
                '已离开的成员'),
          );
          ((el19['dataset']['memberId'] = output),
            el19['addEventListener']('click', () => {
              const args = mentions['snapshot']();
              if (args['sending']) return;
              if (!enabled2?.['state']['members']?.['some']((value3) => value3['id'] === output))
                return showToast('该成员已离开房间', 'ok');
              const mentions2 = [...new Set([...args['mentions'], output])];
              if (mentions2['length'] > 20) return showToast('每条消息最多提及 20 位成员', 'warn');
              (mentions['edit']({ mentions: mentions2 }), input['focus']({ preventScroll: true }));
            }),
            reviewElement4['append'](el19));
        }
        for (const error4 of id4['nodes']) {
          const el20 = reviewElement('button', 'collaboration-button collaboration-chat-node');
          ((el20['dataset']['nodeId'] = error4['id']),
            (el20['dataset']['referenceName'] = error4['name']),
            el20['addEventListener']('click', () => run4(error4['id'])),
            reviewElement4['append'](el20));
        }
        map['set'](id4['id'], el17);
      }
      if (el17 !== config) el8['insertBefore'](el17, config);
      config = el17['nextSibling'];
    }
    ((el10['hidden'] = !!dom2['messages']['length']),
      (el9['hidden'] = !dom2['hasMore']),
      (el9['disabled'] = dom2['loading']));
    for (const id5 of el8['querySelectorAll']('[data-member-id]'))
      colorMemberName(
        id5,
        enabled2['state']['members']?.['find']((value4) => value4['id'] === id5['dataset']['memberId']) || {
          id: id5['dataset']['memberId'],
        },
      );
    for (const el21 of el8['querySelectorAll']('[data-node-id]'))
      updateNodeReference(
        el21,
        store['getStateRaw']()['nodes'][el21['dataset']['nodeId']],
        el21['dataset']['referenceName'],
        { compact: true },
      );
    if (state) el8['scrollTop'] = payload + el8['scrollHeight'] - record;
    else {
      if (entry) el8['scrollTop'] = el8['scrollHeight'];
    }
    const value5 = JSON['stringify']([
      dom2['nodeIds'],
      dom2['mentions'],
      dom2['sending'],
      dom2['nodeIds']['map']((value6) => store['getStateRaw']()['nodes'][value6]?.['name']),
      enabled2['state']['members'],
    ]);
    if (value5 !== value) {
      ((value = value5), el12['replaceChildren']());
      for (const [value7, value8] of [
        ['nodeIds', dom2['nodeIds']],
        ['mentions', dom2['mentions']],
      ])
        for (const id6 of value8) {
          const error5 = store['getStateRaw']()['nodes'][id6],
            value9 =
              value7 === 'nodeIds'
                ? error5
                  ? error5['name'] || id6
                  : '已删除节点'
                : '@' +
                  (enabled2['state']['members']?.['find']((value10) => value10['id'] === id6)?.['name'] ||
                    '已离开成员');
          if (value7 === 'nodeIds') {
            const el22 = reviewElement('span');
            ((el22['dataset']['nodeId'] = id6), el12['append'](el22));
          } else {
            const el23 = reviewElement('button', 'collaboration-button', value9 + ' ×');
            ((el23['disabled'] = dom2['sending']),
              el23['setAttribute']('aria-label', '移除引用 ' + value9),
              colorMemberName(
                el23,
                enabled2['state']['members']?.['find']((value11) => value11['id'] === id6) || {
                  id: id6,
                },
              ),
              el23['addEventListener']('click', () =>
                mentions['edit']({
                  mentions: mentions['snapshot']()['mentions']['filter']((value12) => value12 !== id6),
                }),
              ),
              el12['append'](el23));
          }
        }
    }
    for (const el24 of el12['querySelectorAll']('[data-node-id]')) {
      const value13 = el24['dataset']['nodeId'];
      updateNodeReference(el24, store['getStateRaw']()['nodes'][value13], '已删除节点', {
        compact: true,
        onOpen: () => run4(value13),
        onRemove: () =>
          mentions['edit']({
            nodeIds: mentions['snapshot']()['nodeIds']['filter']((value14) => value14 !== value13),
          }),
      });
      for (const el25 of el24['querySelectorAll']('button')) el25['disabled'] = dom2['sending'];
    }
    bindCollaborationChatPosition2['place']();
  }
  function run5(borderRadius) {
    if (enabled === borderRadius) return;
    const width = root['getBoundingClientRect']();
    (root['getAnimations']()['forEach']((value15) => value15['cancel']()),
      (enabled = borderRadius),
      bindTextareaMentions2['close'](),
      mentions['setVisible'](borderRadius),
      bindCollaborationChatPosition2['place']());
    const width2 = root['getBoundingClientRect']();
    !matchMedia('(prefers-reduced-motion: reduce)')['matches'] &&
      root['animate'](
        [
          {
            width: width['width'] + 'px',
            height: width['height'] + 'px',
            borderRadius: borderRadius ? '24px' : '16px',
          },
          {
            width: width2['width'] + 'px',
            height: width2['height'] + 'px',
            borderRadius: borderRadius ? '16px' : '24px',
          },
        ],
        { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
  }
  function run() {
    (run5(true), input['focus']({ preventScroll: true }));
  }
  function run6() {
    (run5(false), el['focus']({ preventScroll: true }));
  }
  function addNodes(list2) {
    if (!getSession() || mentions['snapshot']()['sending']) return false;
    const nodeIds = [
      ...new Set([
        ...mentions['snapshot']()['nodeIds'],
        ...list2['filter']((value16) => !!store['getStateRaw']()['nodes'][value16]),
      ]),
    ];
    if (nodeIds['length'] > 20) return (showToast('每条消息最多引用 20 个节点，请分批发送', 'warn'), false);
    return (mentions['edit']({ nodeIds: nodeIds }), run(), true);
  }
  (input['addEventListener']('input', () => mentions['edit']({ body: input['value'] })),
    input['addEventListener']('keydown', (event) => {
      if (event['isComposing']) return;
      event['key'] === 'Enter' && !event['shiftKey'] && (event['preventDefault'](), void mentions['send']());
    }),
    root['addEventListener']('keydown', (event2) => {
      if (event2['key'] === 'Escape') {
        (event2['preventDefault'](), event2['stopPropagation']());
        if (bindTextareaMentions2['isOpen']()) (bindTextareaMentions2['close'](), input['focus']());
        else run6();
      }
    }),
    el11['addEventListener']('submit', (event3) => {
      (event3['preventDefault'](), bindTextareaMentions2['close'](), void mentions['send']());
    }),
    el13['addEventListener']('click', () => addNodes([...(store['getStateRaw']()['selectedNodeIds'] || [])])),
    el['addEventListener']('click', run),
    el5['addEventListener']('click', run6),
    el9['addEventListener']('click', () => void mentions['older']()),
    el7['addEventListener']('click', () => void mentions['refresh']()));
  const run7 = store['subscribeSelector'](
    (value17) => value17['_nodesRev'],
    () => onChange(mentions['snapshot']()),
  );
  return (
    mentions['setVisible'](true),
    {
      update: mentions['sync'],
      addNodes: addNodes,
      isOpen: () => !!getSession() && enabled,
      root: root,
      destroy() {
        ((item = true),
          bindTextareaMentions2['destroy'](),
          mentions['destroy'](),
          run7(),
          bindCollaborationChatPosition2['destroy'](),
          root['remove']());
      },
    }
  );
}
