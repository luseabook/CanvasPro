import {
  reviewElement,
  reviewTime,
  reviewAvatar,
  colorMemberName,
  appendMentionText,
} from './collaborationReviewDom.js';
export function renderCommentThreads({
  list: list,
  comments: comments,
  session: session,
  reply: reply,
  resolve: resolve,
}) {
  const value = list.scrollTop;
  list.replaceChildren();
  const map = new Map(session.state.members.map((error) => [error.id, error.name]));
  for (const enabled of comments.filter((item) => item.id === item.thread)) {
    const el = reviewElement('section', 'collaboration-comment-thread');
    el.classList.toggle('is-resolved', !!enabled.resolved);
    for (const id2 of [
      enabled,
      ...comments.filter((key) => key.thread === enabled.id && key.id !== enabled.id),
    ]) {
      const el2 = reviewElement('div', 'collaboration-comment-message');
      (el2.classList.toggle('is-mentioned', id2.mentions.includes(session.state.actorId)),
        el2.classList.toggle('is-reply', id2.id !== enabled.id));
      const el3 = reviewElement('div', 'collaboration-chat-meta');
      (el3.append(
        reviewElement('strong', '', map.get(id2.actor) || id2.name),
        reviewElement('time', 'collaboration-subtle', reviewTime(id2.created)),
      ),
        colorMemberName(
          el3.firstChild,
          session.state.members.find((index) => index.id === id2.actor) || {
            id: id2.actor,
          },
        ));
      const reviewElement2 = reviewElement('div', 'collaboration-message-bubble'),
        reviewElement3 = reviewElement('p');
      (appendMentionText(reviewElement3, id2.body, session.state.members, id2.mentions),
        reviewElement2.append(reviewElement3),
        el2.append(
          reviewAvatar(
            session.state.members.find((result) => result.id === id2.actor) || {
              id: id2.actor,
              name: id2.name,
            },
          ),
          el3,
          reviewElement2,
        ),
        el.append(el2));
    }
    const reviewElement4 = reviewElement('div', 'collaboration-actions');
    if (!enabled.resolved) {
      const el4 = reviewElement('button', 'collaboration-button', '回复');
      (el4.addEventListener('click', () => reply(enabled)), reviewElement4.append(el4));
    } else reviewElement4.append(reviewElement('span', 'collaboration-subtle', '已解决'));
    if (
      enabled.actor === session.state.actorId ||
      ['owner', 'admin'].includes(session.state.role)
    ) {
      const el5 = reviewElement(
        'button',
        'collaboration-button',
        enabled.resolved ? '重新打开' : '标记解决',
      );
      (el5.addEventListener('click', () => resolve(enabled, el5)), reviewElement4.append(el5));
    }
    (el.insertBefore(reviewElement4, el.children[1] || null), list.append(el));
  }
  if (!comments.length)
    list.append(reviewElement('p', 'collaboration-subtle', '还没有评论，写下你的建议吧'));
  list.scrollTop = value;
}
