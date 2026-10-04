import { extractClientVideoTimelineFrameUrls } from '../videoTimelineThumbnails.js';
export function bindStoryReplicationReviewThumbnails(el, src) {
  const root = el['querySelector']('[data-replication-segments]'),
    value = src['replication']['sourceAnalysis'],
    map = new Set();
  let enabled = ![],
    item = ![],
    enabled2 = ![];
  const isCurrent = () => !enabled && src['replication']['sourceAnalysis'] === value;
  async function run() {
    if (item || enabled2 || !isCurrent()) return;
    item = !![];
    try {
      while (map['size'] && !enabled2 && isCurrent()) {
        const list = [...map]['slice'](0x0, 0x6);
        list['forEach']((key) => map['delete'](key));
        const sampleTimes = list['map']((el2) => {
          const index = value['events']['find'](
            (result) => result['id'] === el2['dataset']['replicationSegment'],
          );
          return index['startSec'] + Math['min'](0.25, (index['endSec'] - index['startSec']) / 0x2);
        });
        try {
          const extractClientVideoTimelineFrameUrls2 = await extractClientVideoTimelineFrameUrls({
            src: src['sourceVideo']['videoRef'],
            sampleTimes: sampleTimes,
            isCurrent: isCurrent,
          });
          if (!isCurrent()) return;
          list['forEach']((el3, data) => {
            if (!extractClientVideoTimelineFrameUrls2[data]) return;
            const options = document['createElement']('img');
            ((options['alt'] = ''),
              (options['src'] = extractClientVideoTimelineFrameUrls2[data]),
              el3['querySelector']('.story-source-segment-frame')['replaceChildren'](options));
          });
        } catch {}
      }
    } finally {
      item = ![];
    }
  }
  const intersectionObserver = new IntersectionObserver(
    (target) => {
      for (const event of target) {
        if (!event['isIntersecting']) {
          map['delete'](event['target']);
          continue;
        }
        if (event['target']['querySelector']('img')) {
          intersectionObserver['unobserve'](event['target']);
          continue;
        }
        (map['add'](event['target']), intersectionObserver['unobserve'](event['target']));
      }
      void run();
    },
    { root: root, rootMargin: '120px' },
  );
  return (
    root['querySelectorAll']('[data-replication-segment]')['forEach']((source) =>
      intersectionObserver['observe'](source),
    ),
    {
      suspend() {
        enabled2 = !![];
      },
      resume() {
        ((enabled2 = ![]), void run());
      },
      destroy() {
        ((enabled = !![]), map['clear'](), intersectionObserver['disconnect']());
      },
    }
  );
}
