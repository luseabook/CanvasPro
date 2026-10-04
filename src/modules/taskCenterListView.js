import { startLoading, stopLoading } from './loadingOverlay.js';
function element(tagName, className) {
  const node = document['createElement'](tagName);
  return ((node['className'] = className), node);
}
export function syncTaskElements(container, desired) {
  const keep = new Set(desired);
  for (const child of [...container['children']]) {
    if (!keep['has'](child)) container['removeChild'](child);
  }
  desired['forEach']((element, index) => {
    if (container['children'][index] !== element)
      container['insertBefore'](element, container['children'][index] || null);
  });
}
export function createTaskCardView(taskId) {
  const card = element('article', 'v2-task-card');
  card['dataset']['taskId'] = taskId;
  const header = element('div', 'v2-task-card-header'),
    main = element('div', 'v2-task-card-main'),
    title = element('div', 'v2-task-card-title'),
    context = element('div', 'v2-task-card-context'),
    meta = element('div', 'v2-task-card-meta'),
    status = element('span', 'v2-task-status'),
    progress = element('div', 'v2-task-progress'),
    progressFill = element('div', 'v2-task-progress-fill'),
    error = element('div', 'v2-task-card-error'),
    remoteId = element('div', 'v2-task-card-context'),
    actions = element('div', 'v2-task-card-actions'),
    actionButtons = new Map(),
    thumbnail = element('div', 'v2-task-thumbnail'),
    thumbnailImage = element('img', 'v2-task-thumbnail-image');
  ((thumbnailImage['alt'] = ''),
    (thumbnailImage['decoding'] = 'async'),
    (thumbnailImage['draggable'] = ![]),
    (thumbnailImage['hidden'] = !![]));
  const thumbnailFallback = element('span', 'v2-task-thumbnail-fallback');
  thumbnailFallback['setAttribute']('aria-hidden', 'true');
  const thumbnailCount = element('span', 'v2-task-thumbnail-count'),
    thumbnailApi = { wrap: thumbnail, image: thumbnailImage, src: '' };
  return (
    thumbnail['append'](thumbnailFallback, thumbnailImage, thumbnailCount),
    progress['append'](progressFill),
    main['append'](title, context, meta),
    header['append'](thumbnail, main, status),
    card['append'](header, progress, error, remoteId, actions),
    {
      card: card,
      thumbnail: thumbnailApi,
      update(state) {
        ((thumbnail['hidden'] = !state['thumbnail']),
          (thumbnailApi['src'] = state['thumbnail']?.['src'] || ''),
          thumbnail['setAttribute']('aria-label', state['thumbnailLabel'] || ''),
          thumbnail['setAttribute']('role', 'img'),
          (thumbnailFallback['textContent'] =
            { image: '▧', video: '▷', audio: '♫', text: '≡' }[state['thumbnail']?.['kind']] || '▧'),
          (thumbnailCount['textContent'] =
            state['thumbnail']?.['count'] > 0x1 ? String(state['thumbnail']['count']) : ''),
          (thumbnailCount['hidden'] = !thumbnailCount['textContent']),
          (title['textContent'] = state['title']),
          (context['textContent'] = state['context']),
          (context['hidden'] = !state['context']),
          (meta['textContent'] = state['meta']),
          (status['textContent'] = state['statusLabel']),
          (status['className'] = 'v2-task-status v2-task-status--' + state['status']),
          (error['textContent'] = state['error']),
          (error['hidden'] = !state['error']),
          (remoteId['textContent'] = state['remoteId'] ? 'API ID: ' + state['remoteId'] : ''),
          (remoteId['hidden'] = !state['remoteId']),
          card['setAttribute']('aria-busy', String(state['active'])),
          (progress['hidden'] = !state['active']),
          progress['setAttribute']('role', 'progressbar'),
          progress['setAttribute']('aria-label', state['statusLabel']));
        state['active'] && state['progress'] === null
          ? ((progressFill['hidden'] = !![]),
            progress['removeAttribute']('aria-valuenow'),
            startLoading(progress))
          : (stopLoading(progress),
            (progressFill['hidden'] = ![]),
            (progressFill['style']['width'] = Math['round']((state['progress'] || 0x0) * 0x64) + '%'),
            progress['setAttribute'](
              'aria-valuenow',
              String(Math['round']((state['progress'] || 0x0) * 0x64)),
            ));
        const buttons = state['actions']['map']((action) => {
          let button = actionButtons['get'](action['id']);
          !button &&
            ((button = element('button', 'v2-task-card-action')),
            (button['type'] = 'button'),
            (button['dataset']['taskAction'] = action['id']),
            (button['dataset']['taskId'] = taskId),
            actionButtons['set'](action['id'], button));
          button['className'] =
            'v2-task-card-action' + (action['danger'] ? ' v2-task-card-action--danger' : '');
          if (button['textContent'] !== action['label']) button['textContent'] = action['label'];
          ((button['disabled'] = action['pending'] === !![]),
            button['setAttribute']('aria-busy', String(action['pending'] === !![])),
            (button['dataset']['localPath'] = action['localPath'] || ''));
          if (action['pending']) startLoading(button);
          else stopLoading(button);
          return button;
        });
        (syncTaskElements(actions, buttons), (actions['hidden'] = !buttons['length']));
      },
    }
  );
}
