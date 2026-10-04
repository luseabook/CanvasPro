import { formatStoryVideoPlaybackTime } from './storyVideoPlayback.js';
const escape = (value) =>
  String(value ?? '')['replace'](
    /[&<>"']/gu,
    (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[item],
  );
export function renderStoryReplicationSegments(key, index = key['events'][0x0]?.['id']) {
  return key['events']
    ['map']((result, data) => {
      const options = key['characters']['find'](
        (target) =>
          result['characterIds']['includes'](target['id']) &&
          target['frame']?.['timeSec'] >= result['startSec'] &&
          target['frame']['timeSec'] < result['endSec'],
      );
      return (
        '<button\x20type=\x22button\x22\x20class=\x22story-source-segment\x22\x20data-replication-segment=\x22' +
        escape(result['id']) +
        '" aria-pressed="' +
        (result['id'] === index) +
        '">\n      <span class="story-source-segment-frame">' +
        (options?.['frame']?.['url']
          ? '<img src="' + escape(options['frame']['url']) + '" alt="" loading="lazy">'
          : '<span>' + String(data + 0x1)['padStart'](0x2, '0') + '</span>') +
        '</span>\n      <span class="story-source-segment-copy"><small>' +
        formatStoryVideoPlaybackTime(result['startSec']) +
        ' – ' +
        formatStoryVideoPlaybackTime(result['endSec']) +
        '</small><span data-replication-segment-description>' +
        escape(result['visual'] || '待补充画面描述') +
        '</span></span>\n    </button>'
      );
    })
    ['join']('');
}
export function createStoryReplicationReviewNavigation(el, enabled) {
  let source = enabled['replication']['sourceAnalysis']['events'][0x0]?.['id'];
  const map = new Map(),
    handler = () => el['querySelector']('[data-replication-fields]'),
    handler2 = (next) => source + ':' + next,
    selected = () =>
      enabled['replication']['sourceAnalysis']['events']['find']((current) => current['id'] === source);
  function sync() {
    const list = enabled['replication']['sourceAnalysis']['events'];
    if (!selected()) source = list[0x0]?.['id'];
    const count = list['findIndex']((entry) => entry['id'] === source);
    (el['querySelectorAll']('[data-replication-segment]')['forEach']((el2) => {
      el2['setAttribute']('aria-pressed', String(el2['dataset']['replicationSegment'] === source));
      const record = list['find']((payload) => payload['id'] === el2['dataset']['replicationSegment']),
        el3 = el2['querySelector']('[data-replication-segment-description]');
      if (el3 && record) el3['textContent'] = record['visual'] || '待补充画面描述';
    }),
      (el['querySelector']('[data-replication-segment-heading]')['textContent'] =
        count < 0x0 ? '原片内容' : '片段\x20' + String(count + 0x1)['padStart'](0x2, '0')),
      (el['querySelector']('[data-replication-segment-time]')['textContent'] = selected()
        ? formatStoryVideoPlaybackTime(selected()['startSec']) +
          ' – ' +
          formatStoryVideoPlaybackTime(selected()['endSec'])
        : ''),
      (el['querySelector']('[data-replication-segment-count]')['textContent'] = list['length']),
      (el['querySelector']('[data-replication-previous]')['disabled'] = count <= 0x0),
      (el['querySelector']('[data-replication-next]')['disabled'] =
        count < 0x0 || count >= list['length'] - 0x1));
  }
  return {
    selected: selected,
    sync: sync,
    save(handle) {
      map['set'](handler2(handle), handler()['scrollTop']);
    },
    restore(state) {
      handler()['scrollTop'] = map['get'](handler2(state)) || 0x0;
    },
    select(config) {
      if (
        config === source ||
        !enabled['replication']['sourceAnalysis']['events']['some']((scope) => scope['id'] === config)
      )
        return ![];
      return ((source = config), sync(), !![]);
    },
    adjacent(input) {
      const list2 = enabled['replication']['sourceAnalysis']['events'];
      return list2[list2['findIndex']((output) => output['id'] === source) + input]?.['id'];
    },
    reveal() {
      const el4 = el['querySelector']('[data-replication-segments]'),
        el5 = [...el4['children']]['find']((el6) => el6['dataset']['replicationSegment'] === source);
      if (!el5) return;
      const box = el5['getBoundingClientRect'](),
        box2 = el4['getBoundingClientRect']();
      if (box['top'] < box2['top']) el4['scrollTop'] += box['top'] - box2['top'];
      else {
        if (box['bottom'] > box2['bottom']) el4['scrollTop'] += box['bottom'] - box2['bottom'];
      }
    },
  };
}
