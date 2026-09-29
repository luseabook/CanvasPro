import {
  fetchTutorialReleases,
  normalizeTutorialReleases,
  TUTORIAL_RELEASES_URL,
} from '../../../api/tutorialReleaseNotesApi.js';
const CACHE_KEY = 'aicanvas.tutorial-releases.v1';
export function createTutorialReleaseNotes({ storage: _0x2acae1, external: _0x467834 }) {
  let _0x2d7be6 = [];
  try {
    _0x2d7be6 = normalizeTutorialReleases(JSON['parse'](_0x2acae1?.['getItem'](CACHE_KEY) || '[]'));
  } catch {}
  let _0x2f3c81 = null,
    _0x411aa2 = ![],
    _0x5148a1 = _0x2d7be6['length'] ? '正在显示缓存的更新说明' : '',
    _0x152384 = null,
    _0x3f452e = ![];
  const _0x28d903 = new Set(_0x2d7be6['slice'](0x0, 0x1)['map']((_0x4a8fad) => _0x4a8fad['tag_name']));
  function _0x3d836d() {
    if (!_0x152384?.['isConnected'] || _0x3f452e) return;
    const _0x327405 = _0x152384['scrollTop'];
    _0x152384['replaceChildren']();
    const _0x515dea = document['createElement']('div');
    _0x515dea['className'] = 'tutorial-release-source';
    const _0x2a6478 = document['createElement']('span');
    (_0x2a6478['setAttribute']('role', 'status'), (_0x2a6478['textContent'] = _0x5148a1));
    const _0x1bd7d4 = document['createElement']('button');
    ((_0x1bd7d4['type'] = 'button'),
      (_0x1bd7d4['className'] = 'tutorial-action'),
      (_0x1bd7d4['textContent'] = 'GitHub\x20全部版本\x20↗'),
      (_0x1bd7d4['onclick'] = () => void _0x467834(TUTORIAL_RELEASES_URL)),
      _0x515dea['append'](_0x2a6478, _0x1bd7d4),
      _0x152384['append'](_0x515dea));
    for (const _0x7fdf5b of _0x2d7be6) {
      const _0x37852f = document['createElement']('details');
      ((_0x37852f['className'] = 'tutorial-release'),
        (_0x37852f['open'] = _0x28d903['has'](_0x7fdf5b['tag_name'])));
      const _0x2f40a7 = document['createElement']('summary'),
        _0x5c4873 = document['createElement']('strong');
      _0x5c4873['textContent'] = _0x7fdf5b['tag_name'];
      const _0x71f72b = document['createElement']('time');
      ((_0x71f72b['className'] = 'tutorial-description'),
        (_0x71f72b['textContent'] = _0x7fdf5b['published_at']['slice'](0x0, 0xa)),
        _0x2f40a7['append'](_0x5c4873, _0x71f72b));
      const _0x396a17 = document['createElement']('div');
      ((_0x396a17['className'] = 'tutorial-notes'),
        (_0x396a17['textContent'] = _0x7fdf5b['body']),
        _0x37852f['append'](_0x2f40a7, _0x396a17),
        _0x37852f['addEventListener']('toggle', () => {
          if (_0x37852f['open']) _0x28d903['add'](_0x7fdf5b['tag_name']);
          else _0x28d903['delete'](_0x7fdf5b['tag_name']);
        }),
        _0x152384['append'](_0x37852f));
    }
    _0x152384['scrollTop'] = _0x327405;
  }
  async function _0x597d93() {
    _0x2f3c81?.['abort']();
    const _0x104395 = new AbortController();
    ((_0x2f3c81 = _0x104395), (_0x5148a1 = '正在获取 GitHub 更新说明…'), _0x3d836d());
    try {
      const _0x478c89 = await fetchTutorialReleases({ signal: _0x104395['signal'] });
      if (_0x3f452e || _0x2f3c81 !== _0x104395) return;
      if (!_0x2d7be6['length'] && _0x478c89['length']) _0x28d903['add'](_0x478c89[0x0]['tag_name']);
      ((_0x2d7be6 = _0x478c89),
        (_0x411aa2 = !![]),
        (_0x5148a1 = _0x2d7be6['length'] ? '来自\x20GitHub\x20正式发布记录' : '暂无正式发布记录'));
      try {
        _0x2acae1?.['setItem'](CACHE_KEY, JSON['stringify'](_0x2d7be6));
      } catch {}
    } catch {
      if (_0x3f452e || _0x2f3c81 !== _0x104395) return;
      _0x5148a1 = _0x2d7be6['length']
        ? 'GitHub\x20暂不可用，显示上次获取的更新说明'
        : 'GitHub 暂不可用，请刷新重试或打开仓库查看';
    } finally {
      !_0x3f452e && _0x2f3c81 === _0x104395 && ((_0x2f3c81 = null), _0x3d836d());
    }
  }
  return {
    mount(_0x5b45eb) {
      ((_0x152384 = _0x5b45eb), _0x3d836d());
      if (!_0x411aa2 && !_0x2f3c81) void _0x597d93();
    },
    unmount() {
      _0x152384 = null;
    },
    reload: _0x597d93,
    close() {
      ((_0x3f452e = !![]), (_0x152384 = null), _0x2f3c81?.['abort']());
    },
  };
}
