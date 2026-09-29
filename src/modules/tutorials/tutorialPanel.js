import { fetchTutorialContent } from '../../../api/tutorialContentApi.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { openExternalLink } from '../../services/externalLinkService.js';
import { createBundledTutorialCatalog, getTutorialPlayback } from './tutorialCatalog.js';
import { readTutorialCache, writeTutorialCache } from './tutorialContentCache.js';
import { createTutorialReleaseNotes } from './tutorialReleaseNotes.js';
import { createTutorialTabs } from './tutorialTabs.js';
let activePanel = null;
export function showCanvasTutorialPanel(
  _0x3548b6 = [],
  _0x65cfc7 = [],
  { tutorialId: tutorialId = '' } = {},
) {
  if (activePanel) {
    activePanel['focus']();
    return;
  }
  let _0x527819;
  try {
    _0x527819 = window['localStorage'];
  } catch {}
  const _0x226313 = readTutorialCache(_0x527819);
  let _0x4994ca = _0x226313 || createBundledTutorialCatalog(_0x3548b6, _0x65cfc7),
    _0x420a09 = _0x226313 ? 'cache' : 'bundled',
    _0x432799 = tutorialId ? 'guide' : null,
    _0x5c7f41 = Boolean(tutorialId),
    _0x14336c = tutorialId,
    _0x860ea3 = null,
    _0x122864 = null,
    _0x5c45e1 = ![],
    _0x14a26e = () => {};
  const _0x6e31a3 = document['createElement']('div');
  _0x6e31a3['className'] = 'tutorial-backdrop';
  const _0x235276 = document['createElement']('section');
  ((_0x235276['className'] = 'tutorial-panel'),
    _0x235276['setAttribute']('role', 'dialog'),
    _0x235276['setAttribute']('aria-modal', 'true'),
    _0x235276['setAttribute']('aria-labelledby', 'canvasTutorialTitle'),
    (_0x235276['tabIndex'] = -0x1),
    (_0x235276['innerHTML'] =
      '<header class="tutorial-header"><div><h2 id="canvasTutorialTitle">使用教程</h2><p>教程、玩法与版本动态</p></div><button type="button" aria-label="关闭使用教程" data-action="close">×</button></header>\n    <div class="tutorial-tabs-scroll"><div class="tutorial-tabs" role="tablist" aria-label="教程分类"></div></div><div class="tutorial-content" role="tabpanel" tabindex="0"></div>\n    <footer class="tutorial-status"><span role="status"></span><button type="button" data-action="refresh">刷新内容</button></footer>'),
    _0x6e31a3['append'](_0x235276),
    document['body']['append'](_0x6e31a3));
  const _0x569546 = _0x235276['querySelector']('.tutorial-content'),
    _0x19b481 = _0x235276['querySelector']('[role="status"]'),
    _0x361cf4 = _0x235276['querySelector']('[data-action="refresh"]');
  activePanel = _0x235276;
  const _0x10d3ee = createTutorialReleaseNotes({ storage: _0x527819, external: _0x17566c }),
    _0x5a39b8 = createTutorialTabs(_0x235276['querySelector']('.tutorial-tabs'));
  function _0x4b61ef(_0x4e14d8, _0x46b6d3, _0x74ded5 = '') {
    const _0x4d569d = document['createElement'](_0x4e14d8);
    return ((_0x4d569d['className'] = _0x46b6d3), (_0x4d569d['textContent'] = _0x74ded5), _0x4d569d);
  }
  function _0xbfb2c(_0x1e019d, _0x55dccc) {
    const _0xe213d3 = _0x4b61ef('button', 'tutorial-action', _0x1e019d);
    return ((_0xe213d3['type'] = 'button'), _0xe213d3['addEventListener']('click', _0x55dccc), _0xe213d3);
  }
  async function _0x17566c(_0x56cbfe) {
    try {
      await openExternalLink(_0x56cbfe);
    } catch {
      if (!_0x5c45e1) _0x19b481['textContent'] = '打开链接失败，请重试';
    }
  }
  function _0x2af9b() {
    for (const _0x19c06a of _0x569546['querySelectorAll']('video, iframe')) {
      if (_0x19c06a['tagName'] === 'VIDEO') _0x19c06a['pause']();
      _0x19c06a['removeAttribute']('src');
      if (_0x19c06a['tagName'] === 'VIDEO') _0x19c06a['load']();
    }
    _0x569546['replaceChildren']();
  }
  function _0x3a0335() {
    (_0x10d3ee['unmount'](), _0x2af9b(), (_0x569546['scrollTop'] = 0x0));
    !_0x4994ca['categories']['some']((_0x5b42e9) => _0x5b42e9['id'] === _0x432799) &&
      ((_0x432799 = _0x4994ca['categories'][0x0]['id']), (_0x860ea3 = null));
    if (_0x14336c && _0x420a09 !== 'bundled') {
      const _0x24801b = _0x4994ca['guides']['find']((_0x5ba5e4) => _0x5ba5e4['id'] === _0x14336c);
      _0x24801b && ((_0x860ea3 = _0x24801b), (_0x14336c = ''));
    }
    (_0x5a39b8['update'](_0x4994ca['categories'], _0x432799),
      (_0x569546['id'] = 'tutorial-tab-content'),
      _0x569546['setAttribute']('aria-labelledby', 'tutorial-tab-' + _0x432799));
    if (_0x860ea3) {
      (_0x569546['append'](
        _0xbfb2c('←\x20返回教程列表', () => {
          ((_0x860ea3 = null), _0x3a0335(), _0x569546['focus']());
        }),
      ),
        _0x569546['append'](_0x4b61ef('h3', 'tutorial-video-title', _0x860ea3['title'])));
      const _0x5e421f = getTutorialPlayback(_0x860ea3['videoUrl']);
      if (_0x5e421f['type'] === 'youtube') {
        const _0x33d459 = _0xbfb2c('', () => void _0x17566c(_0x860ea3['videoUrl']));
        ((_0x33d459['className'] = 'tutorial-player tutorial-youtube-preview'),
          _0x33d459['setAttribute']('aria-label', '在浏览器中观看 ' + _0x860ea3['title']));
        const _0xb4b7e5 = _0x4b61ef('img', '');
        ((_0xb4b7e5['alt'] = _0x860ea3['title']),
          (_0xb4b7e5['src'] = _0x5e421f['thumbnailUrl']),
          _0x33d459['append'](_0xb4b7e5, _0x4b61ef('span', 'tutorial-youtube-preview-play', '▶')),
          _0x569546['append'](_0x33d459));
      } else {
        if (_0x5e421f['type'] !== 'external') {
          const _0x5155c6 = _0x4b61ef(_0x5e421f['type'], 'tutorial-player');
          (_0x5e421f['type'] === 'video'
            ? ((_0x5155c6['controls'] = !![]),
              (_0x5155c6['playsInline'] = !![]),
              (_0x5155c6['preload'] = 'metadata'))
            : (_0x5155c6['setAttribute']('aria-label', _0x860ea3['title']),
              (_0x5155c6['allow'] = 'fullscreen; picture-in-picture'),
              (_0x5155c6['allowFullscreen'] = !![]),
              (_0x5155c6['referrerPolicy'] = 'no-referrer')),
            (_0x5155c6['src'] = _0x5e421f['url']),
            _0x569546['append'](_0x5155c6));
        }
      }
      (_0x569546['append'](_0x4b61ef('p', 'tutorial-description', _0x860ea3['description'])),
        _0x569546['append'](
          _0xbfb2c(
            _0x5e421f?.['type'] === 'external' ? '在浏览器中打开教程 ↗' : '在浏览器中观看 ↗',
            () => void _0x17566c(_0x860ea3['videoUrl']),
          ),
        ));
      return;
    }
    if (_0x432799 === 'updates') {
      _0x10d3ee['mount'](_0x569546);
      return;
    }
    const _0x1dc86b = _0x432799 === 'guide',
      _0x496e0e = _0x1dc86b
        ? _0x4994ca['guides']
        : _0x4994ca['tutorials']['filter']((_0x5bf1d4) => _0x5bf1d4['category'] === _0x432799),
      _0x565917 = _0x4b61ef(
        'div',
        _0x4994ca['categories']['find']((_0x3739ac) => _0x3739ac['id'] === _0x432799)?.['layout'] === 'grid'
          ? 'tutorial-list\x20tutorial-play-grid'
          : 'tutorial-list',
      );
    if (!_0x496e0e['length'])
      _0x565917['append'](
        _0x4b61ef('p', 'tutorial-empty', _0x1dc86b ? '接入指南暂未开放' : '暂无教程，敬请期待'),
      );
    for (const _0x41a1c5 of _0x496e0e) {
      const _0x1f86de = getTutorialPlayback(_0x41a1c5['videoUrl']),
        _0x271c9c = _0xbfb2c('', () => {
          ((_0x14336c = ''), (_0x860ea3 = _0x41a1c5), _0x3a0335(), _0x569546['focus']());
        });
      _0x271c9c['className'] = 'tutorial-card';
      const _0x5bdc52 = _0x4b61ef('span', 'tutorial-poster'),
        _0x204776 = _0x41a1c5['coverUrl'] || _0x1f86de?.['thumbnailUrl'];
      if (_0x204776) {
        const _0x5874bf = _0x4b61ef('img', '');
        ((_0x5874bf['alt'] = ''),
          (_0x5874bf['loading'] = 'lazy'),
          (_0x5874bf['src'] = _0x204776),
          _0x5874bf['addEventListener']('error', () => _0x5874bf['remove'](), { once: !![] }),
          _0x5bdc52['append'](_0x5874bf));
      }
      _0x5bdc52['append'](_0x4b61ef('span', 'tutorial-play', _0x1f86de?.['type'] === 'external' ? '↗' : '▶'));
      if (_0x41a1c5['duration'])
        _0x5bdc52['append'](_0x4b61ef('span', 'tutorial-duration', _0x41a1c5['duration']));
      const _0x3fd9f9 = _0x4b61ef('span', 'tutorial-copy');
      _0x3fd9f9['append'](_0x4b61ef('strong', 'tutorial-card-title', _0x41a1c5['title']));
      if (_0x41a1c5['description'])
        _0x3fd9f9['append'](_0x4b61ef('span', 'tutorial-description', _0x41a1c5['description']));
      (_0x271c9c['append'](_0x5bdc52, _0x3fd9f9, _0x4b61ef('span', 'tutorial-arrow', '›')),
        _0x565917['append'](_0x271c9c));
    }
    _0x569546['append'](_0x565917);
  }
  async function _0x1967e2() {
    _0x122864?.['abort']();
    const _0x589cf8 = new AbortController();
    ((_0x122864 = _0x589cf8),
      (_0x361cf4['disabled'] = !![]),
      (_0x19b481['textContent'] = '正在获取最新内容…'));
    try {
      const _0x43b24c = await fetchTutorialContent({ signal: _0x589cf8['signal'] });
      if (_0x5c45e1 || _0x122864 !== _0x589cf8) return;
      ((_0x4994ca = _0x43b24c), (_0x420a09 = 'server'));
      if (!_0x5c7f41) _0x432799 = null;
      !_0x4994ca['categories']['some']((_0xfafeb5) => _0xfafeb5['id'] === _0x432799) &&
        ((_0x432799 = _0x4994ca['categories'][0x0]['id']), (_0x860ea3 = null));
      _0x5a39b8['update'](_0x4994ca['categories'], _0x432799);
      const _0x39578a = writeTutorialCache(_0x527819, _0x43b24c);
      if (!_0x860ea3 && _0x432799 !== 'updates') _0x3a0335();
      _0x19b481['textContent'] = _0x39578a ? '内容已更新' : '内容已更新，本机缓存不可用';
    } catch {
      if (_0x5c45e1 || _0x122864 !== _0x589cf8) return;
      _0x19b481['textContent'] =
        _0x420a09 === 'bundled' ? '暂时无法连接，正在显示内置教程' : '暂时无法连接，正在显示上次获取的内容';
    } finally {
      if (!_0x5c45e1 && _0x122864 === _0x589cf8) _0x361cf4['disabled'] = ![];
    }
  }
  function _0x136a23() {
    if (_0x5c45e1) return;
    ((_0x5c45e1 = !![]),
      _0x122864?.['abort'](),
      _0x10d3ee['close'](),
      _0x5a39b8['close'](),
      _0x2af9b(),
      _0x6e31a3['remove'](),
      _0x14a26e(),
      (activePanel = null));
  }
  (_0x235276['addEventListener']('click', (_0x6e9ab4) => {
    const _0x1faf7d = _0x6e9ab4['target']['closest']('button');
    if (_0x1faf7d?.['dataset']['action'] === 'close') _0x136a23();
    if (_0x1faf7d?.['dataset']['action'] === 'refresh') {
      if (_0x432799 === 'updates') void _0x10d3ee['reload']();
      else void _0x1967e2();
    }
    _0x1faf7d?.['dataset']['tab'] &&
      ((_0x14336c = ''),
      (_0x5c7f41 = !![]),
      (_0x432799 = _0x1faf7d['dataset']['tab']),
      (_0x860ea3 = null),
      _0x3a0335());
  }),
    _0x235276['querySelector']('.tutorial-tabs')['addEventListener']('keydown', (_0x108f38) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](_0x108f38['key'])) return;
      _0x108f38['preventDefault']();
      const _0x2cc526 = [..._0x235276['querySelectorAll']('[data-tab]')],
        _0x10eeb7 = _0x2cc526['findIndex']((_0x48f033) => _0x48f033['dataset']['tab'] === _0x432799),
        _0x2f6674 =
          _0x108f38['key'] === 'Home'
            ? 0x0
            : _0x108f38['key'] === 'End'
              ? _0x2cc526['length'] - 0x1
              : (_0x10eeb7 + (_0x108f38['key'] === 'ArrowRight' ? 0x1 : _0x2cc526['length'] - 0x1)) %
                _0x2cc526['length'];
      (_0x2cc526[_0x2f6674]['click'](), _0x2cc526[_0x2f6674]['focus']());
    }),
    _0x6e31a3['addEventListener']('click', (_0xbb11cf) => {
      if (_0xbb11cf['target'] === _0x6e31a3) _0x136a23();
    }),
    _0x3a0335(),
    (_0x14a26e = beginModalInteraction({
      root: _0x235276,
      onClose: _0x136a23,
      preferredSelector: '[aria-selected="true"]',
    })),
    void _0x1967e2());
}
