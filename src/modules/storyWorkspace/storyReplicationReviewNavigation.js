import { formatStoryVideoPlaybackTime } from './storyVideoPlayback.js';
const escape = (_0x39c7cc) =>
  String(_0x39c7cc ?? '')['replace'](
    /[&<>"']/gu,
    (_0x3ef09d) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[_0x3ef09d],
  );
export function renderStoryReplicationSegments(_0x726e1f, _0x599c0b = _0x726e1f['events'][0x0]?.['id']) {
  return _0x726e1f['events']
    ['map']((_0x28c303, _0x1127d7) => {
      const _0x359dff = _0x726e1f['characters']['find'](
        (_0x195b00) =>
          _0x28c303['characterIds']['includes'](_0x195b00['id']) &&
          _0x195b00['frame']?.['timeSec'] >= _0x28c303['startSec'] &&
          _0x195b00['frame']['timeSec'] < _0x28c303['endSec'],
      );
      return (
        '<button\x20type=\x22button\x22\x20class=\x22story-source-segment\x22\x20data-replication-segment=\x22' +
        escape(_0x28c303['id']) +
        '" aria-pressed="' +
        (_0x28c303['id'] === _0x599c0b) +
        '">\n      <span class="story-source-segment-frame">' +
        (_0x359dff?.['frame']?.['url']
          ? '<img src="' + escape(_0x359dff['frame']['url']) + '" alt="" loading="lazy">'
          : '<span>' + String(_0x1127d7 + 0x1)['padStart'](0x2, '0') + '</span>') +
        '</span>\n      <span class="story-source-segment-copy"><small>' +
        formatStoryVideoPlaybackTime(_0x28c303['startSec']) +
        ' – ' +
        formatStoryVideoPlaybackTime(_0x28c303['endSec']) +
        '</small><span data-replication-segment-description>' +
        escape(_0x28c303['visual'] || '待补充画面描述') +
        '</span></span>\n    </button>'
      );
    })
    ['join']('');
}
export function createStoryReplicationReviewNavigation(_0x2efeb1, _0x2f7e0e) {
  let _0x464b5d = _0x2f7e0e['replication']['sourceAnalysis']['events'][0x0]?.['id'];
  const _0x549647 = new Map(),
    _0x59ad5e = () => _0x2efeb1['querySelector']('[data-replication-fields]'),
    _0x193ded = (_0x295c9e) => _0x464b5d + ':' + _0x295c9e,
    _0x9f683e = () =>
      _0x2f7e0e['replication']['sourceAnalysis']['events']['find'](
        (_0x32a87f) => _0x32a87f['id'] === _0x464b5d,
      );
  function _0x3c6a42() {
    const _0x253cc1 = _0x2f7e0e['replication']['sourceAnalysis']['events'];
    if (!_0x9f683e()) _0x464b5d = _0x253cc1[0x0]?.['id'];
    const _0x5e9242 = _0x253cc1['findIndex']((_0x163834) => _0x163834['id'] === _0x464b5d);
    (_0x2efeb1['querySelectorAll']('[data-replication-segment]')['forEach']((_0x27a522) => {
      _0x27a522['setAttribute'](
        'aria-pressed',
        String(_0x27a522['dataset']['replicationSegment'] === _0x464b5d),
      );
      const _0x53d504 = _0x253cc1['find'](
          (_0x1445c0) => _0x1445c0['id'] === _0x27a522['dataset']['replicationSegment'],
        ),
        _0x197f80 = _0x27a522['querySelector']('[data-replication-segment-description]');
      if (_0x197f80 && _0x53d504) _0x197f80['textContent'] = _0x53d504['visual'] || '待补充画面描述';
    }),
      (_0x2efeb1['querySelector']('[data-replication-segment-heading]')['textContent'] =
        _0x5e9242 < 0x0 ? '原片内容' : '片段\x20' + String(_0x5e9242 + 0x1)['padStart'](0x2, '0')),
      (_0x2efeb1['querySelector']('[data-replication-segment-time]')['textContent'] = _0x9f683e()
        ? formatStoryVideoPlaybackTime(_0x9f683e()['startSec']) +
          ' – ' +
          formatStoryVideoPlaybackTime(_0x9f683e()['endSec'])
        : ''),
      (_0x2efeb1['querySelector']('[data-replication-segment-count]')['textContent'] = _0x253cc1['length']),
      (_0x2efeb1['querySelector']('[data-replication-previous]')['disabled'] = _0x5e9242 <= 0x0),
      (_0x2efeb1['querySelector']('[data-replication-next]')['disabled'] =
        _0x5e9242 < 0x0 || _0x5e9242 >= _0x253cc1['length'] - 0x1));
  }
  return {
    selected: _0x9f683e,
    sync: _0x3c6a42,
    save(_0x4832a2) {
      _0x549647['set'](_0x193ded(_0x4832a2), _0x59ad5e()['scrollTop']);
    },
    restore(_0x3be154) {
      _0x59ad5e()['scrollTop'] = _0x549647['get'](_0x193ded(_0x3be154)) || 0x0;
    },
    select(_0x29c95c) {
      if (
        _0x29c95c === _0x464b5d ||
        !_0x2f7e0e['replication']['sourceAnalysis']['events']['some'](
          (_0x525184) => _0x525184['id'] === _0x29c95c,
        )
      )
        return ![];
      return ((_0x464b5d = _0x29c95c), _0x3c6a42(), !![]);
    },
    adjacent(_0x4b7ae2) {
      const _0x1e12cb = _0x2f7e0e['replication']['sourceAnalysis']['events'];
      return _0x1e12cb[_0x1e12cb['findIndex']((_0x1b8027) => _0x1b8027['id'] === _0x464b5d) + _0x4b7ae2]?.[
        'id'
      ];
    },
    reveal() {
      const _0x869a88 = _0x2efeb1['querySelector']('[data-replication-segments]'),
        _0xe41d1f = [..._0x869a88['children']]['find'](
          (_0x466f7d) => _0x466f7d['dataset']['replicationSegment'] === _0x464b5d,
        );
      if (!_0xe41d1f) return;
      const _0x19de17 = _0xe41d1f['getBoundingClientRect'](),
        _0xf33ae2 = _0x869a88['getBoundingClientRect']();
      if (_0x19de17['top'] < _0xf33ae2['top']) _0x869a88['scrollTop'] += _0x19de17['top'] - _0xf33ae2['top'];
      else {
        if (_0x19de17['bottom'] > _0xf33ae2['bottom'])
          _0x869a88['scrollTop'] += _0x19de17['bottom'] - _0xf33ae2['bottom'];
      }
    },
  };
}
