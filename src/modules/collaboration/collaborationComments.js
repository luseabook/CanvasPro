import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { bindTextareaMentions } from '../../components/shared/textareaMentions.js';
import { reviewElement, reviewSendButton } from './collaborationReviewDom.js';
import { renderCommentThreads } from './collaborationCommentThreads.js';
import { updateNodeReference } from './collaborationNodeReference.js';
export function createCollaborationComments({ store: store, getSession: getSession }) {
  const root = reviewElement('div', 'collaboration-comments');
  (root.setAttribute('popover', 'manual'),
    root.setAttribute('role', 'dialog'),
    root.setAttribute('aria-label', '节点评论'));
  const reviewElement2 = reviewElement('div', 'collaboration-heading'),
    el = reviewElement('h3', '', '节点评论'),
    el2 = reviewElement('button', 'collaboration-button', '关闭');
  reviewElement2.append(el, el2);
  const reviewElement3 = reviewElement('div', 'collaboration-comment-node-preview'),
    el3 = reviewElement('p', 'collaboration-feedback');
  el3.setAttribute('role', 'status');
  const list = reviewElement('div', 'collaboration-comment-list');
  list.setAttribute('aria-label', '评论内容');
  const el4 = reviewElement('button', 'collaboration-button', '重新加载评论');
  el4.hidden = true;
  const el5 = reviewElement('form', 'collaboration-comment-composer'),
    el6 = reviewElement('div', 'collaboration-actions'),
    el7 = reviewElement('span'),
    el8 = reviewElement('button', 'collaboration-button', '取消回复');
  (el6.append(el7, el8), (el6.hidden = true));
  const input = reviewElement('textarea', 'collaboration-input');
  ((input.maxLength = 2000),
    (input.rows = 3),
    input.setAttribute('aria-label', '评论内容输入'),
    (input.placeholder = '写下建议，可 @成员'));
  const reviewElement4 = reviewElement('div', 'collaboration-actions'),
    trigger = reviewElement('button', 'collaboration-button', '@成员');
  (trigger.setAttribute('aria-label', '提及成员'), reviewElement4.append(trigger));
  const menu = reviewElement('div');
  menu.setAttribute('aria-label', '提及成员');
  const el9 = reviewElement('button', 'collaboration-button collaboration-primary', '发送');
  ((el9.type = 'submit'),
    reviewSendButton(el9),
    reviewElement4.append(el9),
    el5.append(el6, input, reviewElement4),
    root.append(reviewElement2, reviewElement3, el3, el4, list, el5, menu),
    document.body.append(root));
  const timer = bindTextareaMentions({
    input: input,
    trigger: trigger,
    menu: menu,
    getCandidates(value) {
      return [{ id: '@all', name: '所有人' }, ...(session?.state.members || [])]
        .filter((error) => error.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()))
        .map((id) => ({
          id: id.id,
          name: id.name,
          label: id.id === '@all' ? '@所有人' : id.name,
        }));
    },
    onSelect(error2, { start: start, end: end }) {
      if (enabled || !dom) return;
      const list2 = '@' + error2.name + ' ';
      if (input.value.length - (end - start) + list2.length > 2000) return;
      (input.setRangeText(list2, start, end, 'end'),
        (dom.mentions[error2.id] = error2.name),
        run());
    },
  });
  let session = null,
    nodeId = '',
    item = 0,
    key = -1,
    enabled2 = false,
    enabled = false,
    comments = [],
    index = '',
    handler = () => {},
    enabled3 = null,
    dom = null,
    result = -1,
    data = { x: 0, y: 0 },
    enabled4 = true;
  const map = new Map(),
    handler2 = () => !!nodeId && root.matches(':popover-open');
  function run2(options) {
    return options === item && handler2() && getSession() === session;
  }
  function run() {
    dom && ((dom.body = input.value), (dom.requestId = null));
  }
  function run3() {
    ((input.value = dom.body),
      (el6.hidden = !dom.threadId),
      (el7.textContent = dom.threadId ? '回复 ' + dom.replyName : ''));
  }
  function onClose(restoreFocus = true) {
    (item++, timer.close(), handler({ restoreFocus: restoreFocus }), (handler = () => {}));
    if (root.matches(':popover-open')) root.hidePopover();
    ((nodeId = ''), (enabled2 = false), (enabled = false));
  }
  function position(x = data) {
    ((data = { x: x.x, y: x.y }),
      root.style.setProperty(
        '--comment-left',
        Math.max(8, Math.min(x.x + 10, window.innerWidth - root.offsetWidth - 8)) + 'px',
      ),
      root.style.setProperty(
        '--comment-top',
        Math.max(8, Math.min(x.y, window.innerHeight - root.offsetHeight - 8)) + 'px',
      ));
  }
  function run4() {
    const target = enabled4 || list.scrollHeight - list.clientHeight - list.scrollTop < 40,
      source = JSON.stringify([comments, session.state.members, session.state.role]);
    source !== index &&
      ((index = source),
      renderCommentThreads({
        list: list,
        comments: comments,
        session: session,
        reply(error3) {
          if (enabled) return;
          ((dom.threadId = error3.id),
            (dom.replyName =
              session.state.members.find((next) => next.id === error3.actor)?.name ||
              error3.name),
            (dom.requestId = null),
            run3(),
            input.focus());
        },
        resolve(threadId, current) {
          void run5(current, () =>
            session.review.write('commentResolve', {
              nodeId: nodeId,
              threadId: threadId.id,
              resolved: !threadId.resolved,
            }),
          );
        },
      }));
    position();
    if (target) list.scrollTop = list.scrollHeight;
  }
  async function run6() {
    if (!handler2() || enabled2 || !session?.review) return;
    const entry = item,
      record = nodeId,
      payload = session;
    ((enabled2 = true), (el4.hidden = true));
    !enabled && ((el3.textContent = '正在加载评论…'), el3.classList.add('is-pending'));
    try {
      const handle = await payload.review.readNode(record);
      if (!run2(entry)) return;
      ((comments = handle.comments), (key = handle.revision));
      if (!enabled) el3.textContent = '';
      (run4(), (enabled4 = false));
    } catch (error4) {
      run2(entry) && ((el3.textContent = error4.message), (el4.hidden = false));
    } finally {
      if (run2(entry)) {
        enabled2 = false;
        if (!enabled) el3.classList.remove('is-pending');
        if (el4.hidden && key < session.review.snapshot().revision) void run6();
      }
    }
  }
  async function run5(el10, handler3) {
    if (enabled || !handler2()) return;
    const state = item;
    ((enabled = true),
      (el10.disabled = true),
      el10.setAttribute('aria-busy', 'true'),
      timer.close(),
      (input.disabled = true),
      (el9.disabled = true),
      (trigger.disabled = true),
      (el3.textContent = '正在保存评论…'),
      el3.classList.add('is-pending'));
    try {
      await handler3();
      if (run2(state)) {
        (run3(), await run6());
        if (run2(state) && el4.hidden) el3.textContent = '已保存';
      }
    } catch (error5) {
      if (run2(state)) el3.textContent = error5.message || '保存失败，请重试';
    } finally {
      run2(state) &&
        ((enabled = false),
        (el10.disabled = false),
        el10.removeAttribute('aria-busy'),
        (input.disabled = !store.getStateRaw().nodes[nodeId]),
        (el9.disabled = input.disabled),
        (trigger.disabled = input.disabled),
        el3.classList.remove('is-pending'));
    }
  }
  (input.addEventListener('input', run),
    input.addEventListener('keydown', (event) => {
      event.key === 'Enter' &&
        !event.shiftKey &&
        !event.isComposing &&
        (event.preventDefault(), el5.requestSubmit());
    }),
    el8.addEventListener('click', () => {
      if (enabled) return;
      ((dom.threadId = ''), (dom.requestId = null), run3(), input.focus());
    }),
    el5.addEventListener('submit', (event2) => {
      event2.preventDefault();
      if (!dom.body.trim() || enabled) return;
      const config = session,
        nodeId2 = nodeId,
        body = dom,
        commentId = (body.requestId ||= crypto.randomUUID()),
        scope = {
          nodeId: nodeId2,
          commentId: commentId,
          body: body.body,
          threadId: body.threadId,
          mentions: [
            ...new Set(
              Object.entries(body.mentions)
                .filter(([, output]) => body.body.includes('@' + output))
                .flatMap(([value2]) =>
                  value2 === '@all' ? config.state.members.map((value3) => value3.id) : [value2],
                ),
            ),
          ],
        };
      void run5(el9, async () => {
        await config.review.write('commentAdd', scope);
        if (config === session && nodeId2 === nodeId) enabled4 = true;
        if (body.requestId === commentId)
          Object.assign(body, { body: '', threadId: '', mentions: {}, requestId: null });
      });
    }),
    el4.addEventListener('click', () => void run6()),
    el2.addEventListener('click', () => onClose()));
  const value4 = (event3) => {
    if (handler2() && !root.contains(event3.target) && !enabled3?.contains(event3.target))
      onClose(false);
  };
  document.addEventListener('pointerdown', value4, true);
  function update() {
    getSession() !== session && (onClose(false), (session = getSession()), map.clear(), (result = -1));
    if (!handler2()) return;
    const error6 = store.getStateRaw().nodes[nodeId];
    (updateNodeReference(reviewElement3, error6, nodeId),
      (el.textContent = error6 ? (error6.name || nodeId) + ' · 评论' : '节点已删除 · 评论'));
    if (!enabled) input.disabled = el9.disabled = trigger.disabled = !error6;
    const value5 = JSON.stringify(
      session.state.members.map((error7) => [error7.id, error7.name]),
    );
    menu.dataset.members !== value5 && ((menu.dataset.members = value5), timer.refresh());
    const value6 = session.review.snapshot().revision;
    if (value6 !== result) {
      result = value6;
      if (value6 > key) void run6();
    }
    run4();
  }
  return {
    open(value7, returnFocus) {
      onClose(false);
      if (session !== getSession()) map.clear();
      session = getSession();
      if (!session?.review) return;
      ((nodeId = value7),
        (enabled3 = returnFocus),
        (key = -1),
        (result = -1),
        (comments = []),
        (index = ''),
        (enabled4 = true));
      if (!map.has(value7)) map.set(value7, { body: '', threadId: '', mentions: {}, requestId: null });
      ((dom = map.get(value7)),
        run3(),
        el9.removeAttribute('aria-busy'),
        el3.classList.remove('is-pending'),
        root.showPopover());
      if (returnFocus) {
        const x2 = returnFocus.getBoundingClientRect();
        position({ x: x2.right, y: x2.bottom });
      } else position({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
      ((handler = beginModalInteraction({
        root: root,
        onClose: onClose,
        returnFocus: returnFocus,
        preferredSelector: 'textarea',
      })),
        update(),
        void run6());
    },
    update: update,
    position: position,
    nodeId: () => nodeId,
    destroy() {
      (onClose(false),
        timer.destroy(),
        root.remove(),
        document.removeEventListener('pointerdown', value4, true));
    },
  };
}
