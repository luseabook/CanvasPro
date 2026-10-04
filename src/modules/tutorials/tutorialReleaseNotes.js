import {
  fetchTutorialReleases,
  normalizeTutorialReleases,
  TUTORIAL_RELEASES_URL,
} from '../../../api/tutorialReleaseNotesApi.js';
const CACHE_KEY = 'aicanvas.tutorial-releases.v1';
export function createTutorialReleaseNotes({ storage: storage, external: external }) {
  let list = [];
  try {
    list = normalizeTutorialReleases(JSON['parse'](storage?.['getItem'](CACHE_KEY) || '[]'));
  } catch {}
  let enabled = null,
    enabled2 = ![],
    value = list['length'] ? '正在显示缓存的更新说明' : '',
    el = null,
    enabled3 = ![];
  const map = new Set(list['slice'](0x0, 0x1)['map']((item) => item['tag_name']));
  function run() {
    if (!el?.['isConnected'] || enabled3) return;
    const key = el['scrollTop'];
    el['replaceChildren']();
    const index = document['createElement']('div');
    index['className'] = 'tutorial-release-source';
    const el2 = document['createElement']('span');
    (el2['setAttribute']('role', 'status'), (el2['textContent'] = value));
    const el3 = document['createElement']('button');
    ((el3['type'] = 'button'),
      (el3['className'] = 'tutorial-action'),
      (el3['textContent'] = 'GitHub\x20全部版本\x20↗'),
      (el3['onclick'] = () => void external(TUTORIAL_RELEASES_URL)),
      index['append'](el2, el3),
      el['append'](index));
    for (const dom of list) {
      const el4 = document['createElement']('details');
      ((el4['className'] = 'tutorial-release'), (el4['open'] = map['has'](dom['tag_name'])));
      const result = document['createElement']('summary'),
        el5 = document['createElement']('strong');
      el5['textContent'] = dom['tag_name'];
      const el6 = document['createElement']('time');
      ((el6['className'] = 'tutorial-description'),
        (el6['textContent'] = dom['published_at']['slice'](0x0, 0xa)),
        result['append'](el5, el6));
      const el7 = document['createElement']('div');
      ((el7['className'] = 'tutorial-notes'),
        (el7['textContent'] = dom['body']),
        el4['append'](result, el7),
        el4['addEventListener']('toggle', () => {
          if (el4['open']) map['add'](dom['tag_name']);
          else map['delete'](dom['tag_name']);
        }),
        el['append'](el4));
    }
    el['scrollTop'] = key;
  }
  async function reload() {
    enabled?.['abort']();
    const signal = new AbortController();
    ((enabled = signal), (value = '正在获取 GitHub 更新说明…'), run());
    try {
      const list2 = await fetchTutorialReleases({ signal: signal['signal'] });
      if (enabled3 || enabled !== signal) return;
      if (!list['length'] && list2['length']) map['add'](list2[0x0]['tag_name']);
      ((list = list2),
        (enabled2 = !![]),
        (value = list['length'] ? '来自\x20GitHub\x20正式发布记录' : '暂无正式发布记录'));
      try {
        storage?.['setItem'](CACHE_KEY, JSON['stringify'](list));
      } catch {}
    } catch {
      if (enabled3 || enabled !== signal) return;
      value = list['length']
        ? 'GitHub\x20暂不可用，显示上次获取的更新说明'
        : 'GitHub 暂不可用，请刷新重试或打开仓库查看';
    } finally {
      !enabled3 && enabled === signal && ((enabled = null), run());
    }
  }
  return {
    mount(data) {
      ((el = data), run());
      if (!enabled2 && !enabled) void reload();
    },
    unmount() {
      el = null;
    },
    reload: reload,
    close() {
      ((enabled3 = !![]), (el = null), enabled?.['abort']());
    },
  };
}
