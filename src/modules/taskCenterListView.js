import { startLoading, stopLoading } from './loadingOverlay.js';
function element(value, item) {
  const key = document.createElement(value);
  return ((key.className = item), key);
}
export function syncTaskElements(el, list) {
  const map = new Set(list);
  for (const index of [...el.children]) {
    if (!map.has(index)) el.removeChild(index);
  }
  list.forEach((result, data) => {
    if (el.children[data] !== result) el.insertBefore(result, el.children[data] || null);
  });
}
export function createTaskCardView(options) {
  const card = element('article', 'v2-task-card');
  card.dataset.taskId = options;
  const element2 = element('div', 'v2-task-card-header'),
    element3 = element('div', 'v2-task-card-main'),
    el2 = element('div', 'v2-task-card-title'),
    el3 = element('div', 'v2-task-card-context'),
    el4 = element('div', 'v2-task-card-meta'),
    el5 = element('span', 'v2-task-status'),
    el6 = element('div', 'v2-task-progress'),
    el7 = element('div', 'v2-task-progress-fill'),
    el8 = element('div', 'v2-task-card-error'),
    el9 = element('div', 'v2-task-card-context'),
    el10 = element('div', 'v2-task-card-actions'),
    map2 = new Map(),
    wrap = element('div', 'v2-task-thumbnail'),
    image = element('img', 'v2-task-thumbnail-image');
  ((image.alt = ''), (image.decoding = 'async'), (image.draggable = false), (image.hidden = true));
  const el11 = element('span', 'v2-task-thumbnail-fallback');
  el11.setAttribute('aria-hidden', 'true');
  const el12 = element('span', 'v2-task-thumbnail-count'),
    thumbnail = { wrap: wrap, image: image, src: '' };
  return (
    wrap.append(el11, image, el12),
    el6.append(el7),
    element3.append(el2, el3, el4),
    element2.append(wrap, element3, el5),
    card.append(element2, el6, el8, el9, el10),
    {
      card: card,
      thumbnail: thumbnail,
      update(response) {
        ((wrap.hidden = !response.thumbnail),
          (thumbnail.src = response.thumbnail?.src || ''),
          wrap.setAttribute('aria-label', response.thumbnailLabel || ''),
          wrap.setAttribute('role', 'img'),
          (el11.textContent =
            { image: '▧', video: '▷', audio: '♫', text: '≡' }[response.thumbnail?.kind] || '▧'),
          (el12.textContent =
            response.thumbnail?.count > 1 ? String(response.thumbnail.count) : ''),
          (el12.hidden = !el12.textContent),
          (el2.textContent = response.title),
          (el3.textContent = response.context),
          (el3.hidden = !response.context),
          (el4.textContent = response.meta),
          (el5.textContent = response.statusLabel),
          (el5.className = 'v2-task-status v2-task-status--' + response.status),
          (el8.textContent = response.error),
          (el8.hidden = !response.error),
          (el9.textContent = response.remoteId ? 'API ID: ' + response.remoteId : ''),
          (el9.hidden = !response.remoteId),
          card.setAttribute('aria-busy', String(response.active)),
          (el6.hidden = !response.active),
          el6.setAttribute('role', 'progressbar'),
          el6.setAttribute('aria-label', response.statusLabel));
        response.active && response.progress === null
          ? ((el7.hidden = true), el6.removeAttribute('aria-valuenow'), startLoading(el6))
          : (stopLoading(el6),
            (el7.hidden = false),
            (el7.style.width = Math.round((response.progress || 0) * 100) + '%'),
            el6.setAttribute(
              'aria-valuenow',
              String(Math.round((response.progress || 0) * 100)),
            ));
        const list2 = response.actions.map((target) => {
          let el13 = map2.get(target.id);
          !el13 &&
            ((el13 = element('button', 'v2-task-card-action')),
            (el13.type = 'button'),
            (el13.dataset.taskAction = target.id),
            (el13.dataset.taskId = options),
            map2.set(target.id, el13));
          el13.className =
            'v2-task-card-action' + (target.danger ? ' v2-task-card-action--danger' : '');
          if (el13.textContent !== target.label) el13.textContent = target.label;
          ((el13.disabled = target.pending === true),
            el13.setAttribute('aria-busy', String(target.pending === true)),
            (el13.dataset.localPath = target.localPath || ''));
          if (target.pending) startLoading(el13);
          else stopLoading(el13);
          return el13;
        });
        (syncTaskElements(el10, list2), (el10.hidden = !list2.length));
      },
    }
  );
}
