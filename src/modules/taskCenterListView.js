import { startLoading, stopLoading } from './loadingOverlay.js';
function element(_0x5dab18, _0xfdd9db) {
  const _0x48c981 = document['createElement'](_0x5dab18);
  return ((_0x48c981['className'] = _0xfdd9db), _0x48c981);
}
export function syncTaskElements(_0x44d569, _0x8c52d2) {
  const _0x5bd45e = new Set(_0x8c52d2);
  for (const _0x4d7de3 of [..._0x44d569['children']]) {
    if (!_0x5bd45e['has'](_0x4d7de3)) _0x44d569['removeChild'](_0x4d7de3);
  }
  _0x8c52d2['forEach']((_0x5ba9b0, _0x39bd0d) => {
    if (_0x44d569['children'][_0x39bd0d] !== _0x5ba9b0)
      _0x44d569['insertBefore'](_0x5ba9b0, _0x44d569['children'][_0x39bd0d] || null);
  });
}
export function createTaskCardView(_0x1d3925) {
  const _0x5cfb76 = element('article', 'v2-task-card');
  _0x5cfb76['dataset']['taskId'] = _0x1d3925;
  const _0x4e1539 = element('div', 'v2-task-card-header'),
    _0x3c9bb3 = element('div', 'v2-task-card-main'),
    _0x2f37cb = element('div', 'v2-task-card-title'),
    _0x1fad64 = element('div', 'v2-task-card-context'),
    _0x4b26ab = element('div', 'v2-task-card-meta'),
    _0x1b7368 = element('span', 'v2-task-status'),
    _0x152687 = element('div', 'v2-task-progress'),
    _0x2615bf = element('div', 'v2-task-progress-fill'),
    _0x979eb4 = element('div', 'v2-task-card-error'),
    _0x5957c1 = element('div', 'v2-task-card-context'),
    _0x566fac = element('div', 'v2-task-card-actions'),
    _0x468905 = new Map(),
    _0x446172 = element('div', 'v2-task-thumbnail'),
    _0x1e14d2 = element('img', 'v2-task-thumbnail-image');
  ((_0x1e14d2['alt'] = ''),
    (_0x1e14d2['decoding'] = 'async'),
    (_0x1e14d2['draggable'] = ![]),
    (_0x1e14d2['hidden'] = !![]));
  const _0x145314 = element('span', 'v2-task-thumbnail-fallback');
  _0x145314['setAttribute']('aria-hidden', 'true');
  const _0x39d08e = element('span', 'v2-task-thumbnail-count'),
    _0x2b9eb8 = { wrap: _0x446172, image: _0x1e14d2, src: '' };
  return (
    _0x446172['append'](_0x145314, _0x1e14d2, _0x39d08e),
    _0x152687['append'](_0x2615bf),
    _0x3c9bb3['append'](_0x2f37cb, _0x1fad64, _0x4b26ab),
    _0x4e1539['append'](_0x446172, _0x3c9bb3, _0x1b7368),
    _0x5cfb76['append'](_0x4e1539, _0x152687, _0x979eb4, _0x5957c1, _0x566fac),
    {
      card: _0x5cfb76,
      thumbnail: _0x2b9eb8,
      update(_0x1fed94) {
        ((_0x446172['hidden'] = !_0x1fed94['thumbnail']),
          (_0x2b9eb8['src'] = _0x1fed94['thumbnail']?.['src'] || ''),
          _0x446172['setAttribute']('aria-label', _0x1fed94['thumbnailLabel'] || ''),
          _0x446172['setAttribute']('role', 'img'),
          (_0x145314['textContent'] =
            { image: '▧', video: '▷', audio: '♫', text: '≡' }[_0x1fed94['thumbnail']?.['kind']] || '▧'),
          (_0x39d08e['textContent'] =
            _0x1fed94['thumbnail']?.['count'] > 0x1 ? String(_0x1fed94['thumbnail']['count']) : ''),
          (_0x39d08e['hidden'] = !_0x39d08e['textContent']),
          (_0x2f37cb['textContent'] = _0x1fed94['title']),
          (_0x1fad64['textContent'] = _0x1fed94['context']),
          (_0x1fad64['hidden'] = !_0x1fed94['context']),
          (_0x4b26ab['textContent'] = _0x1fed94['meta']),
          (_0x1b7368['textContent'] = _0x1fed94['statusLabel']),
          (_0x1b7368['className'] = 'v2-task-status v2-task-status--' + _0x1fed94['status']),
          (_0x979eb4['textContent'] = _0x1fed94['error']),
          (_0x979eb4['hidden'] = !_0x1fed94['error']),
          (_0x5957c1['textContent'] = _0x1fed94['remoteId'] ? 'API ID: ' + _0x1fed94['remoteId'] : ''),
          (_0x5957c1['hidden'] = !_0x1fed94['remoteId']),
          _0x5cfb76['setAttribute']('aria-busy', String(_0x1fed94['active'])),
          (_0x152687['hidden'] = !_0x1fed94['active']),
          _0x152687['setAttribute']('role', 'progressbar'),
          _0x152687['setAttribute']('aria-label', _0x1fed94['statusLabel']));
        _0x1fed94['active'] && _0x1fed94['progress'] === null
          ? ((_0x2615bf['hidden'] = !![]),
            _0x152687['removeAttribute']('aria-valuenow'),
            startLoading(_0x152687))
          : (stopLoading(_0x152687),
            (_0x2615bf['hidden'] = ![]),
            (_0x2615bf['style']['width'] = Math['round']((_0x1fed94['progress'] || 0x0) * 0x64) + '%'),
            _0x152687['setAttribute'](
              'aria-valuenow',
              String(Math['round']((_0x1fed94['progress'] || 0x0) * 0x64)),
            ));
        const _0x4d50d5 = _0x1fed94['actions']['map']((_0x41d92e) => {
          let _0x4e753e = _0x468905['get'](_0x41d92e['id']);
          !_0x4e753e &&
            ((_0x4e753e = element('button', 'v2-task-card-action')),
            (_0x4e753e['type'] = 'button'),
            (_0x4e753e['dataset']['taskAction'] = _0x41d92e['id']),
            (_0x4e753e['dataset']['taskId'] = _0x1d3925),
            _0x468905['set'](_0x41d92e['id'], _0x4e753e));
          _0x4e753e['className'] =
            'v2-task-card-action' + (_0x41d92e['danger'] ? ' v2-task-card-action--danger' : '');
          if (_0x4e753e['textContent'] !== _0x41d92e['label']) _0x4e753e['textContent'] = _0x41d92e['label'];
          ((_0x4e753e['disabled'] = _0x41d92e['pending'] === !![]),
            _0x4e753e['setAttribute']('aria-busy', String(_0x41d92e['pending'] === !![])),
            (_0x4e753e['dataset']['localPath'] = _0x41d92e['localPath'] || ''));
          if (_0x41d92e['pending']) startLoading(_0x4e753e);
          else stopLoading(_0x4e753e);
          return _0x4e753e;
        });
        (syncTaskElements(_0x566fac, _0x4d50d5), (_0x566fac['hidden'] = !_0x4d50d5['length']));
      },
    }
  );
}
