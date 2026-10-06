import { fetchTutorialContent } from '../../../api/tutorialContentApi.js';
import { beginModalInteraction } from '../../services/modalInteractionScope.js';
import { openExternalLink } from '../../services/externalLinkService.js';
import { createBundledTutorialCatalog, getTutorialPlayback } from './tutorialCatalog.js';
import { readTutorialCache, writeTutorialCache } from './tutorialContentCache.js';
import { createTutorialReleaseNotes } from './tutorialReleaseNotes.js';
import { createTutorialTabs } from './tutorialTabs.js';
let activePanel = null;
export function showCanvasTutorialPanel(list = [], value = [], { tutorialId: tutorialId = '' } = {}) {
  if (activePanel) {
    activePanel.focus();
    return;
  }
  let storage;
  try {
    storage = window.localStorage;
  } catch {}
  const tutorialCache = readTutorialCache(storage);
  let enabled = tutorialCache || createBundledTutorialCatalog(list, value),
    item = tutorialCache ? 'cache' : 'bundled',
    key = tutorialId ? 'guide' : null,
    enabled2 = Boolean(tutorialId),
    index = tutorialId,
    enabled3 = null,
    result = null,
    enabled4 = false,
    handler = () => {};
  const el = document.createElement('div');
  el.className = 'tutorial-backdrop';
  const root = document.createElement('section');
  ((root.className = 'tutorial-panel'),
    root.setAttribute('role', 'dialog'),
    root.setAttribute('aria-modal', 'true'),
    root.setAttribute('aria-labelledby', 'canvasTutorialTitle'),
    (root.tabIndex = -1),
    (root.innerHTML =
      '<header class="tutorial-header"><div><h2 id="canvasTutorialTitle">使用教程</h2><p>教程、玩法与版本动态</p></div><button type="button" aria-label="关闭使用教程" data-action="close">×</button></header>\n    <div class="tutorial-tabs-scroll"><div class="tutorial-tabs" role="tablist" aria-label="教程分类"></div></div><div class="tutorial-content" role="tabpanel" tabindex="0"></div>\n    <footer class="tutorial-status"><span role="status"></span><button type="button" data-action="refresh">刷新内容</button></footer>'),
    el.append(root),
    document.body.append(el));
  const el2 = root.querySelector('.tutorial-content'),
    el3 = root.querySelector('[role="status"]'),
    el4 = root.querySelector('[data-action="refresh"]');
  activePanel = root;
  const tutorialReleaseNotes = createTutorialReleaseNotes({ storage: storage, external: external }),
    tutorialTabs = createTutorialTabs(root.querySelector('.tutorial-tabs'));
  function run(data, options, target = '') {
    const el5 = document.createElement(data);
    return ((el5.className = options), (el5.textContent = target), el5);
  }
  function run2(source, next) {
    const el6 = run('button', 'tutorial-action', source);
    return ((el6.type = 'button'), el6.addEventListener('click', next), el6);
  }
  async function external(current) {
    try {
      await openExternalLink(current);
    } catch {
      if (!enabled4) el3.textContent = '打开链接失败，请重试';
    }
  }
  function run3() {
    for (const entry of el2.querySelectorAll('video, iframe')) {
      if (entry.tagName === 'VIDEO') entry.pause();
      entry.removeAttribute('src');
      if (entry.tagName === 'VIDEO') entry.load();
    }
    el2.replaceChildren();
  }
  function run4() {
    (tutorialReleaseNotes.unmount(), run3(), (el2.scrollTop = 0));
    !enabled.categories.some((record) => record.id === key) &&
      ((key = enabled.categories[0].id), (enabled3 = null));
    if (index && item !== 'bundled') {
      const payload = enabled.guides.find((handle) => handle.id === index);
      payload && ((enabled3 = payload), (index = ''));
    }
    (tutorialTabs.update(enabled.categories, key),
      (el2.id = 'tutorial-tab-content'),
      el2.setAttribute('aria-labelledby', 'tutorial-tab-' + key));
    if (enabled3) {
      (el2.append(
        run2('← 返回教程列表', () => {
          ((enabled3 = null), run4(), el2.focus());
        }),
      ),
        el2.append(run('h3', 'tutorial-video-title', enabled3.title)));
      const response = getTutorialPlayback(enabled3.videoUrl);
      if (response.type === 'youtube') {
        const el7 = run2('', () => void external(enabled3.videoUrl));
        ((el7.className = 'tutorial-player tutorial-youtube-preview'),
          el7.setAttribute('aria-label', '在浏览器中观看 ' + enabled3.title));
        const state = run('img', '');
        ((state.alt = enabled3.title),
          (state.src = response.thumbnailUrl),
          el7.append(state, run('span', 'tutorial-youtube-preview-play', '▶')),
          el2.append(el7));
      } else {
        if (response.type !== 'external') {
          const el8 = run(response.type, 'tutorial-player');
          (response.type === 'video'
            ? ((el8.controls = true), (el8.playsInline = true), (el8.preload = 'metadata'))
            : (el8.setAttribute('aria-label', enabled3.title),
              (el8.allow = 'fullscreen; picture-in-picture'),
              (el8.allowFullscreen = true),
              (el8.referrerPolicy = 'no-referrer')),
            (el8.src = response.url),
            el2.append(el8));
        }
      }
      (el2.append(run('p', 'tutorial-description', enabled3.description)),
        el2.append(
          run2(
            response?.type === 'external' ? '在浏览器中打开教程 ↗' : '在浏览器中观看 ↗',
            () => void external(enabled3.videoUrl),
          ),
        ));
      return;
    }
    if (key === 'updates') {
      tutorialReleaseNotes.mount(el2);
      return;
    }
    const config = key === 'guide',
      list2 = config
        ? enabled.guides
        : enabled.tutorials.filter((scope) => scope.category === key),
      input = run(
        'div',
        enabled.categories.find((output) => output.id === key)?.layout === 'grid'
          ? 'tutorial-list tutorial-play-grid'
          : 'tutorial-list',
      );
    if (!list2.length)
      input.append(run('p', 'tutorial-empty', config ? '接入指南暂未开放' : '暂无教程，敬请期待'));
    for (const value2 of list2) {
      const tutorialPlayback = getTutorialPlayback(value2.videoUrl),
        value3 = run2('', () => {
          ((index = ''), (enabled3 = value2), run4(), el2.focus());
        });
      value3.className = 'tutorial-card';
      const value4 = run('span', 'tutorial-poster'),
        value5 = value2.coverUrl || tutorialPlayback?.thumbnailUrl;
      if (value5) {
        const el9 = run('img', '');
        ((el9.alt = ''),
          (el9.loading = 'lazy'),
          (el9.src = value5),
          el9.addEventListener('error', () => el9.remove(), { once: true }),
          value4.append(el9));
      }
      value4.append(run('span', 'tutorial-play', tutorialPlayback?.type === 'external' ? '↗' : '▶'));
      if (value2.duration) value4.append(run('span', 'tutorial-duration', value2.duration));
      const value6 = run('span', 'tutorial-copy');
      value6.append(run('strong', 'tutorial-card-title', value2.title));
      if (value2.description) value6.append(run('span', 'tutorial-description', value2.description));
      (value3.append(value4, value6, run('span', 'tutorial-arrow', '›')), input.append(value3));
    }
    el2.append(input);
  }
  async function run5() {
    result?.abort();
    const signal = new AbortController();
    ((result = signal), (el4.disabled = true), (el3.textContent = '正在获取最新内容…'));
    try {
      const fetchTutorialContent2 = await fetchTutorialContent({ signal: signal.signal });
      if (enabled4 || result !== signal) return;
      ((enabled = fetchTutorialContent2), (item = 'server'));
      if (!enabled2) key = null;
      !enabled.categories.some((value7) => value7.id === key) &&
        ((key = enabled.categories[0].id), (enabled3 = null));
      tutorialTabs.update(enabled.categories, key);
      const writeTutorialCache2 = writeTutorialCache(storage, fetchTutorialContent2);
      if (!enabled3 && key !== 'updates') run4();
      el3.textContent = writeTutorialCache2 ? '内容已更新' : '内容已更新，本机缓存不可用';
    } catch {
      if (enabled4 || result !== signal) return;
      el3.textContent =
        item === 'bundled' ? '暂时无法连接，正在显示内置教程' : '暂时无法连接，正在显示上次获取的内容';
    } finally {
      if (!enabled4 && result === signal) el4.disabled = false;
    }
  }
  function onClose() {
    if (enabled4) return;
    ((enabled4 = true),
      result?.abort(),
      tutorialReleaseNotes.close(),
      tutorialTabs.close(),
      run3(),
      el.remove(),
      handler(),
      (activePanel = null));
  }
  (root.addEventListener('click', (event) => {
    const el10 = event.target.closest('button');
    if (el10?.dataset.action === 'close') onClose();
    if (el10?.dataset.action === 'refresh') {
      if (key === 'updates') void tutorialReleaseNotes.reload();
      else void run5();
    }
    el10?.dataset.tab &&
      ((index = ''), (enabled2 = true), (key = el10.dataset.tab), (enabled3 = null), run4());
  }),
    root.querySelector('.tutorial-tabs').addEventListener('keydown', (event2) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event2.key)) return;
      event2.preventDefault();
      const list3 = [...root.querySelectorAll('[data-tab]')],
        value8 = list3.findIndex((el11) => el11.dataset.tab === key),
        value9 =
          event2.key === 'Home'
            ? 0
            : event2.key === 'End'
              ? list3.length - 1
              : (value8 + (event2.key === 'ArrowRight' ? 1 : list3.length - 1)) % list3.length;
      (list3[value9].click(), list3[value9].focus());
    }),
    el.addEventListener('click', (event3) => {
      if (event3.target === el) onClose();
    }),
    run4(),
    (handler = beginModalInteraction({
      root: root,
      onClose: onClose,
      preferredSelector: '[aria-selected="true"]',
    })),
    void run5());
}
