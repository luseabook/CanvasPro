import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { executeGroupGenerateButtons } from '../modules/groupExecution.js';
import { collectGroupContainmentReparentOps } from '../modules/groupMembership.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { collectGroupSyncPlayableVideoEntries, syncPlayGroupVideos } from '../modules/videoSyncPlayback.js';
import { onLocaleChange, t } from '../i18n/index.js';
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function groupText(value, item = {}) {
  return t('groupNode.' + value, item);
}
export class GroupNode {
  constructor(key) {
    ((this._data = key),
      (this._rootEl = null),
      (this._titleEl = null),
      (this._toolbarEl = null),
      (this._detachedToolbarEl = null),
      (this._colorMenuOutsidePointerDown = null),
      (this._toolbarInteractivityRaf = null),
      (this._toolbarPreviewOffsetX = 0),
      (this._toolbarPreviewOffsetY = 0),
      (this._lastSyncPlayableVideoCount = null),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    ((this._rootEl = document.createElement('div')),
      (this._rootEl.style.width = '100%'),
      (this._rootEl.style.height = '100%'),
      (this._titleEl = document.createElement('div')),
      (this._titleEl.className = 'node-group-title'),
      (this._titleEl.contentEditable = 'true'),
      (this._titleEl.spellcheck = false),
      (this._titleEl.title = groupText('renameTooltip')),
      (this._titleEl.textContent = this._data.name || groupText('defaultName')),
      this._titleEl.addEventListener('pointerdown', (event) => event.stopPropagation()),
      this._titleEl.addEventListener('keydown', (event2) => {
        event2.key === 'Enter' && (event2.preventDefault(), this._titleEl.blur());
      }),
      this._titleEl.addEventListener('blur', () => {
        (appStore.updateNodeData(this._data.id, { name: this._titleEl.textContent }), commit());
      }),
      this._rootEl.appendChild(this._titleEl));
    const el = document.createElement('div');
    ((el.className = 'group-toolbar'),
      (el.dataset.groupToolbarFor = this._data.id),
      (el.onpointerdown = (event3) => event3.stopPropagation()),
      (this._toolbarEl = el));
    const index = 'http://www.w3.org/2000/svg',
      handler = () => {
        const el2 = document.createElementNS(index, 'svg');
        return (
          el2.setAttribute('viewBox', '0 0 24 24'),
          el2.setAttribute('fill', 'none'),
          el2.setAttribute('stroke', 'currentColor'),
          el2.setAttribute('stroke-linecap', 'round'),
          el2.setAttribute('stroke-linejoin', 'round'),
          el2
        );
      },
      handler2 = (el3, result) => {
        el3.type = 'button';
        const groupText2 = groupText(result);
        ((el3.title = groupText2), el3.setAttribute('aria-label', groupText2));
      },
      handler3 = (el4, data) => {
        const el5 = document.createElementNS(index, 'path');
        return (el5.setAttribute('d', data), el4.appendChild(el5), el5);
      },
      el6 = document.createElement('button');
    ((el6.className = 'gt-btn gt-btn-run'), handler2(el6, 'toolbar.runGroup'), el6.replaceChildren());
    const el7 = handler();
    (el7.setAttribute('stroke-width', '2'),
      handler3(el7, 'M12 3l1.2 4.1L17 8.3l-3.8 1.2L12 13.5l-1.2-4-3.8-1.2 3.8-1.2L12 3z'),
      handler3(el7, 'M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z'),
      handler3(el7, 'M6 13l.8 2.7L9.5 16.5l-2.7.8L6 20l-.8-2.7-2.7-.8 2.7-.8L6 13z'),
      el6.appendChild(el7),
      (el6.onclick = (event4) => {
        (event4.stopPropagation(), this._runGroup());
      }),
      el.appendChild(el6));
    const el8 = document.createElement('button');
    ((el8.className = 'gt-btn gt-btn-sync-play'), handler2(el8, 'toolbar.syncPlay'), el8.replaceChildren());
    const el9 = handler();
    el9.setAttribute('stroke-width', '2.5');
    const el10 = document.createElementNS(index, 'polygon');
    (el10.setAttribute('points', '5 3 19 12 5 21 5 3'),
      el9.appendChild(el10),
      el8.appendChild(el9),
      (el8.style.display = 'none'),
      (el8.onclick = (event5) => {
        (event5.stopPropagation(), this._syncPlayGroupVideos());
      }),
      el.appendChild(el8));
    const el11 = document.createElement('div');
    el11.className = 'gt-color-wrap';
    const el12 = document.createElement('button');
    ((el12.className = 'gt-btn gt-btn-color'), handler2(el12, 'toolbar.color'), el12.replaceChildren());
    const el13 = document.createElement('div');
    ((el13.className = 'color-dot'),
      (el13.style.background = this._data.color || 'var(--indigo)'),
      el12.appendChild(el13));
    const el14 = document.createElement('div');
    el14.className = 'gt-color-menu';
    const list = [
      'var(--indigo)',
      'var(--green)',
      'var(--gold)',
      'var(--red)',
      'var(--purple)',
      'var(--group-pink)',
      'var(--group-slate)',
      'var(--cyan)',
    ];
    ((el12.onclick = (event6) => {
      event6.stopPropagation();
      const enabled = el14.classList.contains('show');
      document.querySelectorAll('.gt-color-menu.show').forEach((el15) => el15.classList.remove('show'));
      if (!enabled) el14.classList.add('show');
    }),
      list.forEach((item2) => {
        const el16 = document.createElement('div');
        ((el16.className = 'color-option'),
          (el16.dataset.groupColor = item2),
          (el16.style.background = item2),
          (el16.onclick = (event7) => {
            (event7.stopPropagation(), this._setColor(item2));
          }),
          el14.appendChild(el16));
      }),
      (this._colorMenuOutsidePointerDown = () => el14.classList.remove('show')),
      window.addEventListener('pointerdown', this._colorMenuOutsidePointerDown),
      el11.appendChild(el12),
      el11.appendChild(el14),
      el.appendChild(el11));
    const el17 = document.createElement('button');
    ((el17.className = 'gt-btn gt-btn-workflow'),
      handler2(el17, 'toolbar.createWorkflow'),
      el17.replaceChildren());
    const el18 = handler();
    el18.setAttribute('stroke-width', '1.8');
    const el19 = document.createElementNS(index, 'rect');
    (el19.setAttribute('x', '3'),
      el19.setAttribute('y', '3'),
      el19.setAttribute('width', '18'),
      el19.setAttribute('height', '18'),
      el19.setAttribute('rx', '2'),
      el19.setAttribute('ry', '2'));
    const el20 = document.createElementNS(index, 'line');
    (el20.setAttribute('x1', '3'),
      el20.setAttribute('y1', '9'),
      el20.setAttribute('x2', '21'),
      el20.setAttribute('y2', '9'));
    const el21 = document.createElementNS(index, 'line');
    (el21.setAttribute('x1', '9'),
      el21.setAttribute('y1', '21'),
      el21.setAttribute('x2', '9'),
      el21.setAttribute('y2', '9'),
      el18.appendChild(el19),
      el18.appendChild(el20),
      el18.appendChild(el21),
      el17.appendChild(el18),
      (el17.onclick = (event8) => {
        (event8.stopPropagation(), this._requestWorkflow());
      }),
      el.appendChild(el17));
    const el22 = document.createElement('button');
    ((el22.className = 'gt-btn gt-btn-ungroup'), handler2(el22, 'toolbar.ungroup'), el22.replaceChildren());
    const el23 = handler();
    el23.setAttribute('stroke-width', '2');
    const el24 = document.createElementNS(index, 'path');
    el24.setAttribute('d', 'M3 6h18');
    const el25 = document.createElementNS(index, 'path');
    el25.setAttribute('d', 'M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2');
    const el26 = document.createElementNS(index, 'path');
    el26.setAttribute('d', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6');
    const el27 = document.createElementNS(index, 'line');
    (el27.setAttribute('x1', '10'),
      el27.setAttribute('y1', '11'),
      el27.setAttribute('x2', '10'),
      el27.setAttribute('y2', '17'));
    const el28 = document.createElementNS(index, 'line');
    (el28.setAttribute('x1', '14'),
      el28.setAttribute('y1', '11'),
      el28.setAttribute('x2', '14'),
      el28.setAttribute('y2', '17'),
      el23.appendChild(el24),
      el23.appendChild(el25),
      el23.appendChild(el26),
      el23.appendChild(el27),
      el23.appendChild(el28),
      el22.appendChild(el23),
      (el22.onclick = (event9) => {
        (event9.stopPropagation(), this._ungroup());
      }),
      el.appendChild(el22),
      this._rootEl.appendChild(el),
      this._mountDetachedToolbar(el));
    const el29 = document.createElement('div');
    return (
      (el29.className = 'group-resizer'),
      (el29.style.pointerEvents = 'auto'),
      el29.addEventListener('pointerdown', (event10) => {
        startNodeResizePreview({
          event: event10,
          nodeId: this._data.id,
          getNode: () => getStateSnapshot().nodes?.[this._data.id] || this._data,
          getViewport: () => getStateSnapshot().viewport,
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx2, dy: dy2 }) => ({
            width: Math.max(150, startWidth + dx2),
            height: Math.max(100, startHeight + dy2),
          }),
          applyPatch: (options) => appStore.updateNodeData(this._data.id, options),
          onPreview: (box) => this._syncToolbarPosition(box.width),
          afterApply: () => this._syncContainedChildren(),
          commit: commit,
          label: 'group-resize',
        });
      }),
      this._rootEl.appendChild(el29),
      this._syncColor(this._data.color || 'var(--indigo)'),
      this._syncGroupSyncPlaybackButton(getStateSnapshot().nodes || {}),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      this._rootEl
    );
  }
  ['_syncLocaleTexts']() {
    this._titleEl &&
      ((this._titleEl.title = groupText('renameTooltip')),
      !String(this._data?.name || '').trim() &&
        document.activeElement !== this._titleEl &&
        (this._titleEl.textContent = groupText('defaultName')));
    const target = [
      ['.gt-btn-run', 'toolbar.runGroup'],
      ['.gt-btn-sync-play', 'toolbar.syncPlay'],
      ['.gt-btn-color', 'toolbar.color'],
      ['.gt-btn-workflow', 'toolbar.createWorkflow'],
      ['.gt-btn-ungroup', 'toolbar.ungroup'],
    ];
    for (const el30 of [this._toolbarEl, this._detachedToolbarEl]) {
      if (!el30) continue;
      for (const [source, next] of target) {
        const el31 = el30.querySelector(source);
        if (!el31) continue;
        const groupText3 = groupText(next);
        ((el31.title = groupText3), el31.setAttribute('aria-label', groupText3));
      }
    }
  }
  ['_mountDetachedToolbar'](current) {
    const el32 = document.getElementById('v2-canvas');
    if (!el32) return;
    const el33 = current.cloneNode(true);
    (el33.classList.add('group-toolbar--detached'),
      (el33.onpointerdown = (event11) => event11.stopPropagation()),
      el33.addEventListener('click', (entry) => this._handleDetachedToolbarClick(entry)),
      el32.appendChild(el33),
      (this._detachedToolbarEl = el33),
      this._syncToolbarPosition());
  }
  ['_syncToolbarPosition'](value2 = null) {
    if (!this._detachedToolbarEl) return;
    const record = Number.isFinite(this._data.x) ? this._data.x : 0,
      payload = Number.isFinite(this._data.y) ? this._data.y : 0,
      handle = Number.isFinite(value2) ? value2 : Number.isFinite(this._data.width) ? this._data.width : 0,
      state = record + this._toolbarPreviewOffsetX + handle / 2;
    ((this._detachedToolbarEl.style.left = state + 'px'),
      (this._detachedToolbarEl.style.top = payload + this._toolbarPreviewOffsetY + 'px'));
  }
  ['syncDragPreview']({ dx: dx = 0, dy: dy = 0, active: active = false } = {}) {
    const config = active && Number.isFinite(dx) ? dx : 0,
      scope = active && Number.isFinite(dy) ? dy : 0;
    if (config === this._toolbarPreviewOffsetX && scope === this._toolbarPreviewOffsetY) return;
    ((this._toolbarPreviewOffsetX = config),
      (this._toolbarPreviewOffsetY = scope),
      this._syncToolbarPosition());
  }
  ['syncSelectionState']({
    selected: selected = false,
    singleSelected: singleSelected = false,
    visible: visible = true,
    nodes: nodes = null,
  } = {}) {
    if (!this._detachedToolbarEl) return;
    this._syncGroupSyncPlaybackButton(nodes || getStateSnapshot().nodes || {});
    const enabled2 = visible && selected && singleSelected;
    this._detachedToolbarEl.classList.toggle('is-visible', enabled2);
    if (!enabled2) {
      this._toolbarInteractivityRaf !== null &&
        (cancelAnimationFrame(this._toolbarInteractivityRaf), (this._toolbarInteractivityRaf = null));
      this._syncDetachedToolbarInteractivity(false);
      return;
    }
    this._scheduleDetachedToolbarInteractivitySync(enabled2);
  }
  ['_syncColor'](input) {
    [this._toolbarEl, this._detachedToolbarEl].forEach((el34) => {
      const el35 = el34?.querySelector('.color-dot');
      if (el35) el35.style.background = input;
    });
  }
  ['_closeColorMenus']() {
    document.querySelectorAll('.gt-color-menu.show').forEach((el36) => el36.classList.remove('show'));
  }
  ['_runGroup']() {
    executeGroupGenerateButtons({ groupId: this._data.id });
  }
  ['_syncPlayGroupVideos']() {
    void syncPlayGroupVideos({ groupId: this._data.id, state: getStateSnapshot() });
  }
  ['_syncGroupSyncPlaybackButton'](options2 = {}) {
    const groupSyncPlayableVideoEntries = collectGroupSyncPlayableVideoEntries(
      options2,
      this._data.id,
    ).length;
    if (groupSyncPlayableVideoEntries === this._lastSyncPlayableVideoCount) return;
    this._lastSyncPlayableVideoCount = groupSyncPlayableVideoEntries;
    const enabled3 = groupSyncPlayableVideoEntries >= 2;
    [this._toolbarEl, this._detachedToolbarEl].forEach((el37) => {
      const el38 = el37?.querySelector?.('.gt-btn-sync-play');
      if (!el38) return;
      ((el38.style.display = enabled3 ? '' : 'none'),
        (el38.disabled = !enabled3),
        el38.classList.toggle('is-disabled', !enabled3));
    });
  }
  ['_setColor'](color) {
    (appStore.updateNodeData(this._data.id, { color: color }), this._closeColorMenus(), commit());
  }
  ['_syncContainedChildren']() {
    const { nodes: nodes2 } = getStateSnapshot(),
      list2 = collectGroupContainmentReparentOps(nodes2, [this._data.id]);
    if (list2.length === 0) return false;
    const run = () => {
      list2.forEach(({ nodeId: nodeId, parentId: parentId }) => {
        appStore.groupNodes([nodeId], parentId);
      });
    };
    if (typeof appStore.batch === 'function') return (appStore.batch(run), true);
    return (run(), true);
  }
  ['_requestWorkflow']() {
    window.dispatchEvent(
      new CustomEvent('workflow:create-request', {
        detail: { source: 'group-toolbar', groupId: this._data.id },
      }),
    );
  }
  ['_ungroup']() {
    const { nodes: nodes3 } = appStore.getState();
    (Object.values(nodes3).forEach((item3) => {
      item3.parentId === this._data.id && appStore.updateNodeData(item3.id, { parentId: undefined });
    }),
      appStore.deleteNodes([this._data.id]),
      commit());
  }
  ['_handleDetachedToolbarClick'](event12) {
    const el39 = event12.target;
    if (!(el39 instanceof Element)) return;
    const el40 = el39.closest(
      '.gt-btn-run, .gt-btn-sync-play, .gt-btn-color, .gt-btn-workflow, .gt-btn-ungroup, .color-option',
    );
    if (!el40 || !this._detachedToolbarEl?.contains(el40)) return;
    event12.stopPropagation();
    if (el40.classList.contains('color-option')) {
      const output = el40.dataset.groupColor || el40.style.background;
      if (output) this._setColor(output);
      return;
    }
    if (el40.classList.contains('gt-btn-run')) {
      this._runGroup();
      return;
    }
    if (el40.classList.contains('gt-btn-sync-play')) {
      this._syncPlayGroupVideos();
      return;
    }
    if (el40.classList.contains('gt-btn-workflow')) {
      this._requestWorkflow();
      return;
    }
    if (el40.classList.contains('gt-btn-ungroup')) {
      this._ungroup();
      return;
    }
    if (el40.classList.contains('gt-btn-color')) {
      const el41 = this._detachedToolbarEl.querySelector('.gt-color-menu'),
        enabled4 = el41?.classList.contains('show');
      this._closeColorMenus();
      if (el41 && !enabled4) el41.classList.add('show');
    }
  }
  ['_syncDetachedToolbarInteractivity'](enabled5) {
    if (!this._detachedToolbarEl) return;
    this._detachedToolbarEl.classList.remove('is-interactive');
    if (!enabled5 || !this._toolbarEl) return;
    const list3 = Array.from(this._toolbarEl.querySelectorAll('.gt-btn'))
        .map((el42) => el42.getBoundingClientRect())
        .filter((box2) => box2.width > 0 && box2.height > 0),
      box3 = this._toolbarEl.getBoundingClientRect();
    box3.width > 0 && box3.height > 0 && list3.push(box3);
    const value3 = list3.some((box4) => {
      const value4 = box4.left + box4.width / 2,
        value5 = box4.top + box4.height / 2,
        value6 = document.elementFromPoint(value4, value5);
      return value6 && !this._toolbarEl.contains(value6);
    });
    this._detachedToolbarEl.classList.toggle('is-interactive', value3);
  }
  ['_scheduleDetachedToolbarInteractivitySync'](value7) {
    this._syncDetachedToolbarInteractivity(value7);
    this._toolbarInteractivityRaf !== null &&
      (cancelAnimationFrame(this._toolbarInteractivityRaf), (this._toolbarInteractivityRaf = null));
    if (typeof requestAnimationFrame !== 'function') return;
    this._toolbarInteractivityRaf = requestAnimationFrame(() => {
      ((this._toolbarInteractivityRaf = null), this._syncDetachedToolbarInteractivity(value7));
    });
  }
  ['update'](error) {
    (error.name !== this._data.name &&
      document.activeElement !== this._titleEl &&
      (this._titleEl.textContent = error.name || groupText('defaultName')),
      error.color !== this._data.color && this._syncColor(error.color || 'var(--indigo)'),
      (this._toolbarPreviewOffsetX = 0),
      (this._toolbarPreviewOffsetY = 0),
      (this._data = error),
      this._syncToolbarPosition(),
      this._syncGroupSyncPlaybackButton(getStateSnapshot().nodes || {}));
  }
  ['unmount']() {
    (this._toolbarInteractivityRaf !== null &&
      (cancelAnimationFrame(this._toolbarInteractivityRaf), (this._toolbarInteractivityRaf = null)),
      this._colorMenuOutsidePointerDown &&
        (window.removeEventListener('pointerdown', this._colorMenuOutsidePointerDown),
        (this._colorMenuOutsidePointerDown = null)),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      this._toolbarEl?.isConnected && this._toolbarEl.remove(),
      this._detachedToolbarEl?.isConnected && this._detachedToolbarEl.remove(),
      (this._detachedToolbarEl = null),
      (this._toolbarEl = null),
      (this._titleEl = null),
      (this._rootEl = null));
  }
}
