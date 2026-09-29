import { extractClientVideoTimelineFrameUrls } from '../videoTimelineThumbnails.js';
export function bindStoryReplicationReviewThumbnails(_0x1c3e4c, _0x4ebc04) {
  const _0x33237a = _0x1c3e4c['querySelector']('[data-replication-segments]'),
    _0x12b47f = _0x4ebc04['replication']['sourceAnalysis'],
    _0x58c556 = new Set();
  let _0x40faf2 = ![],
    _0x5f188b = ![],
    _0x1bfc0d = ![];
  const _0x577477 = () => !_0x40faf2 && _0x4ebc04['replication']['sourceAnalysis'] === _0x12b47f;
  async function _0x2ec39c() {
    if (_0x5f188b || _0x1bfc0d || !_0x577477()) return;
    _0x5f188b = !![];
    try {
      while (_0x58c556['size'] && !_0x1bfc0d && _0x577477()) {
        const _0x5ce034 = [..._0x58c556]['slice'](0x0, 0x6);
        _0x5ce034['forEach']((_0x50a37c) => _0x58c556['delete'](_0x50a37c));
        const _0x311470 = _0x5ce034['map']((_0x1e7c82) => {
          const _0x3d6b6b = _0x12b47f['events']['find'](
            (_0x466a5f) => _0x466a5f['id'] === _0x1e7c82['dataset']['replicationSegment'],
          );
          return (
            _0x3d6b6b['startSec'] + Math['min'](0.25, (_0x3d6b6b['endSec'] - _0x3d6b6b['startSec']) / 0x2)
          );
        });
        try {
          const _0x17ed87 = await extractClientVideoTimelineFrameUrls({
            src: _0x4ebc04['sourceVideo']['videoRef'],
            sampleTimes: _0x311470,
            isCurrent: _0x577477,
          });
          if (!_0x577477()) return;
          _0x5ce034['forEach']((_0x161f95, _0x43ee4b) => {
            if (!_0x17ed87[_0x43ee4b]) return;
            const _0xc41749 = document['createElement']('img');
            ((_0xc41749['alt'] = ''),
              (_0xc41749['src'] = _0x17ed87[_0x43ee4b]),
              _0x161f95['querySelector']('.story-source-segment-frame')['replaceChildren'](_0xc41749));
          });
        } catch {}
      }
    } finally {
      _0x5f188b = ![];
    }
  }
  const _0x426332 = new IntersectionObserver(
    (_0x2960f2) => {
      for (const _0x25d5ba of _0x2960f2) {
        if (!_0x25d5ba['isIntersecting']) {
          _0x58c556['delete'](_0x25d5ba['target']);
          continue;
        }
        if (_0x25d5ba['target']['querySelector']('img')) {
          _0x426332['unobserve'](_0x25d5ba['target']);
          continue;
        }
        (_0x58c556['add'](_0x25d5ba['target']), _0x426332['unobserve'](_0x25d5ba['target']));
      }
      void _0x2ec39c();
    },
    { root: _0x33237a, rootMargin: '120px' },
  );
  return (
    _0x33237a['querySelectorAll']('[data-replication-segment]')['forEach']((_0xb74602) =>
      _0x426332['observe'](_0xb74602),
    ),
    {
      suspend() {
        _0x1bfc0d = !![];
      },
      resume() {
        ((_0x1bfc0d = ![]), void _0x2ec39c());
      },
      destroy() {
        ((_0x40faf2 = !![]), _0x58c556['clear'](), _0x426332['disconnect']());
      },
    }
  );
}
