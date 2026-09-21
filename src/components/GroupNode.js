import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { executeGroupGenerateButtons } from '../modules/groupExecution.js';
import { collectGroupContainmentReparentOps } from '../modules/groupMembership.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { collectGroupSyncPlayableVideoEntries, syncPlayGroupVideos } from '../modules/videoSyncPlayback.js';
import { onLocaleChange, t } from '../i18n/index.js';
const getStateSnapshot = () =>
  typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
function groupText(_0x396043, _0x822db6 = {}) {
  return t('groupNode.' + _0x396043, _0x822db6);
}
export class GroupNode {
  constructor(_0x3f5816) {
    ((this._data = _0x3f5816),
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
      this._titleEl.addEventListener('pointerdown', (_0x1fe4eb) => _0x1fe4eb.stopPropagation()),
      this._titleEl.addEventListener('keydown', (_0x193a93) => {
        _0x193a93.key === 'Enter' && (_0x193a93.preventDefault(), this._titleEl.blur());
      }),
      this._titleEl.addEventListener('blur', () => {
        (appStore.updateNodeData(this._data.id, { name: this._titleEl.textContent }), commit());
      }),
      this._rootEl.appendChild(this._titleEl));
    const _0x5a7ab6 = document.createElement('div');
    ((_0x5a7ab6.className = 'group-toolbar'),
      (_0x5a7ab6.dataset.groupToolbarFor = this._data.id),
      (_0x5a7ab6.onpointerdown = (_0x49f541) => _0x49f541.stopPropagation()),
      (this._toolbarEl = _0x5a7ab6));
    const _0x1d22a4 = 'http://www.w3.org/2000/svg',
      _0x7b56c = () => {
        const _0x122f02 = document.createElementNS(_0x1d22a4, 'svg');
        return (
          _0x122f02.setAttribute('viewBox', '0 0 24 24'),
          _0x122f02.setAttribute('fill', 'none'),
          _0x122f02.setAttribute('stroke', 'currentColor'),
          _0x122f02.setAttribute('stroke-linecap', 'round'),
          _0x122f02.setAttribute('stroke-linejoin', 'round'),
          _0x122f02
        );
      },
      _0x52fc80 = (_0x25c042, _0x3b6646) => {
        _0x25c042.type = 'button';
        const _0x33520b = groupText(_0x3b6646);
        ((_0x25c042.title = _0x33520b), _0x25c042.setAttribute('aria-label', _0x33520b));
      },
      _0x4144cd = (_0x74ab72, _0x5f581d) => {
        const _0x473a8e = document.createElementNS(_0x1d22a4, 'path');
        return (_0x473a8e.setAttribute('d', _0x5f581d), _0x74ab72.appendChild(_0x473a8e), _0x473a8e);
      },
      _0x247221 = document.createElement('button');
    ((_0x247221.className = 'gt-btn gt-btn-run'),
      _0x52fc80(_0x247221, 'toolbar.runGroup'),
      _0x247221.replaceChildren());
    const _0x54952d = _0x7b56c();
    (_0x54952d.setAttribute('stroke-width', '2'),
      _0x4144cd(_0x54952d, 'M12 3l1.2 4.1L17 8.3l-3.8 1.2L12 13.5l-1.2-4-3.8-1.2 3.8-1.2L12 3z'),
      _0x4144cd(_0x54952d, 'M18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14z'),
      _0x4144cd(_0x54952d, 'M6 13l.8 2.7L9.5 16.5l-2.7.8L6 20l-.8-2.7-2.7-.8 2.7-.8L6 13z'),
      _0x247221.appendChild(_0x54952d),
      (_0x247221.onclick = (_0x59d2ee) => {
        (_0x59d2ee.stopPropagation(), this._runGroup());
      }),
      _0x5a7ab6.appendChild(_0x247221));
    const _0x4295f4 = document.createElement('button');
    ((_0x4295f4.className = 'gt-btn gt-btn-sync-play'),
      _0x52fc80(_0x4295f4, 'toolbar.syncPlay'),
      _0x4295f4.replaceChildren());
    const _0x25ede5 = _0x7b56c();
    _0x25ede5.setAttribute('stroke-width', '2.5');
    const _0x33c0fc = document.createElementNS(_0x1d22a4, 'polygon');
    (_0x33c0fc.setAttribute('points', '5 3 19 12 5 21 5 3'),
      _0x25ede5.appendChild(_0x33c0fc),
      _0x4295f4.appendChild(_0x25ede5),
      (_0x4295f4.style.display = 'none'),
      (_0x4295f4.onclick = (_0x4ffc29) => {
        (_0x4ffc29.stopPropagation(), this._syncPlayGroupVideos());
      }),
      _0x5a7ab6.appendChild(_0x4295f4));
    const _0x528046 = document.createElement('div');
    _0x528046.className = 'gt-color-wrap';
    const _0x505f7a = document.createElement('button');
    ((_0x505f7a.className = 'gt-btn gt-btn-color'),
      _0x52fc80(_0x505f7a, 'toolbar.color'),
      _0x505f7a.replaceChildren());
    const _0x4174c6 = document.createElement('div');
    ((_0x4174c6.className = 'color-dot'),
      (_0x4174c6.style.background = this._data.color || 'var(--indigo)'),
      _0x505f7a.appendChild(_0x4174c6));
    const _0x5cf927 = document.createElement('div');
    _0x5cf927.className = 'gt-color-menu';
    const _0x5fd3e8 = [
      'var(--indigo)',
      'var(--green)',
      'var(--gold)',
      'var(--red)',
      'var(--purple)',
      'var(--group-pink)',
      'var(--group-slate)',
      'var(--cyan)',
    ];
    ((_0x505f7a.onclick = (_0x4d2ba1) => {
      _0x4d2ba1.stopPropagation();
      const _0x4ef1e7 = _0x5cf927.classList.contains('show');
      document
        .querySelectorAll('.gt-color-menu.show')
        .forEach((_0x221b07) => _0x221b07.classList.remove('show'));
      if (!_0x4ef1e7) _0x5cf927.classList.add('show');
    }),
      _0x5fd3e8.forEach((_0x512f9d) => {
        const _0x2db56a = document.createElement('div');
        ((_0x2db56a.className = 'color-option'),
          (_0x2db56a.dataset.groupColor = _0x512f9d),
          (_0x2db56a.style.background = _0x512f9d),
          (_0x2db56a.onclick = (_0x1e3845) => {
            (_0x1e3845.stopPropagation(), this._setColor(_0x512f9d));
          }),
          _0x5cf927.appendChild(_0x2db56a));
      }),
      (this._colorMenuOutsidePointerDown = () => _0x5cf927.classList.remove('show')),
      window.addEventListener('pointerdown', this._colorMenuOutsidePointerDown),
      _0x528046.appendChild(_0x505f7a),
      _0x528046.appendChild(_0x5cf927),
      _0x5a7ab6.appendChild(_0x528046));
    const _0x444307 = document.createElement('button');
    ((_0x444307.className = 'gt-btn gt-btn-workflow'),
      _0x52fc80(_0x444307, 'toolbar.createWorkflow'),
      _0x444307.replaceChildren());
    const _0xf895ed = _0x7b56c();
    _0xf895ed.setAttribute('stroke-width', '1.8');
    const _0x5e0b53 = document.createElementNS(_0x1d22a4, 'rect');
    (_0x5e0b53.setAttribute('x', '3'),
      _0x5e0b53.setAttribute('y', '3'),
      _0x5e0b53.setAttribute('width', '18'),
      _0x5e0b53.setAttribute('height', '18'),
      _0x5e0b53.setAttribute('rx', '2'),
      _0x5e0b53.setAttribute('ry', '2'));
    const _0x35a092 = document.createElementNS(_0x1d22a4, 'line');
    (_0x35a092.setAttribute('x1', '3'),
      _0x35a092.setAttribute('y1', '9'),
      _0x35a092.setAttribute('x2', '21'),
      _0x35a092.setAttribute('y2', '9'));
    const _0x192097 = document.createElementNS(_0x1d22a4, 'line');
    (_0x192097.setAttribute('x1', '9'),
      _0x192097.setAttribute('y1', '21'),
      _0x192097.setAttribute('x2', '9'),
      _0x192097.setAttribute('y2', '9'),
      _0xf895ed.appendChild(_0x5e0b53),
      _0xf895ed.appendChild(_0x35a092),
      _0xf895ed.appendChild(_0x192097),
      _0x444307.appendChild(_0xf895ed),
      (_0x444307.onclick = (_0x1acc5e) => {
        (_0x1acc5e.stopPropagation(), this._requestWorkflow());
      }),
      _0x5a7ab6.appendChild(_0x444307));
    const _0x4a622b = document.createElement('button');
    ((_0x4a622b.className = 'gt-btn gt-btn-ungroup'),
      _0x52fc80(_0x4a622b, 'toolbar.ungroup'),
      _0x4a622b.replaceChildren());
    const _0x4630cd = _0x7b56c();
    _0x4630cd.setAttribute('stroke-width', '2');
    const _0x400862 = document.createElementNS(_0x1d22a4, 'path');
    _0x400862.setAttribute('d', 'M3 6h18');
    const _0x419336 = document.createElementNS(_0x1d22a4, 'path');
    _0x419336.setAttribute('d', 'M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2');
    const _0x26a2e0 = document.createElementNS(_0x1d22a4, 'path');
    _0x26a2e0.setAttribute('d', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6');
    const _0x381e36 = document.createElementNS(_0x1d22a4, 'line');
    (_0x381e36.setAttribute('x1', '10'),
      _0x381e36.setAttribute('y1', '11'),
      _0x381e36.setAttribute('x2', '10'),
      _0x381e36.setAttribute('y2', '17'));
    const _0x1a9bef = document.createElementNS(_0x1d22a4, 'line');
    (_0x1a9bef.setAttribute('x1', '14'),
      _0x1a9bef.setAttribute('y1', '11'),
      _0x1a9bef.setAttribute('x2', '14'),
      _0x1a9bef.setAttribute('y2', '17'),
      _0x4630cd.appendChild(_0x400862),
      _0x4630cd.appendChild(_0x419336),
      _0x4630cd.appendChild(_0x26a2e0),
      _0x4630cd.appendChild(_0x381e36),
      _0x4630cd.appendChild(_0x1a9bef),
      _0x4a622b.appendChild(_0x4630cd),
      (_0x4a622b.onclick = (_0x360bf0) => {
        (_0x360bf0.stopPropagation(), this._ungroup());
      }),
      _0x5a7ab6.appendChild(_0x4a622b),
      this._rootEl.appendChild(_0x5a7ab6),
      this._mountDetachedToolbar(_0x5a7ab6));
    const _0x39c6e = document.createElement('div');
    return (
      (_0x39c6e.className = 'group-resizer'),
      (_0x39c6e.style.pointerEvents = 'auto'),
      _0x39c6e.addEventListener('pointerdown', (_0x32444b) => {
        startNodeResizePreview({
          event: _0x32444b,
          nodeId: this._data.id,
          getNode: () => getStateSnapshot().nodes?.[this._data.id] || this._data,
          getViewport: () => getStateSnapshot().viewport,
          resolveSize: ({ startWidth: _0x3ee4b0, startHeight: _0x571b62, dx: _0x442568, dy: _0x2f1049 }) => ({
            width: Math.max(150, _0x3ee4b0 + _0x442568),
            height: Math.max(100, _0x571b62 + _0x2f1049),
          }),
          applyPatch: (_0x40c3a0) => appStore.updateNodeData(this._data.id, _0x40c3a0),
          onPreview: (_0x4a28cc) => this._syncToolbarPosition(_0x4a28cc.width),
          afterApply: () => this._syncContainedChildren(),
          commit: commit,
          label: 'group-resize',
        });
      }),
      this._rootEl.appendChild(_0x39c6e),
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
    const _0x129ec6 = [
      ['.gt-btn-run', 'toolbar.runGroup'],
      ['.gt-btn-sync-play', 'toolbar.syncPlay'],
      ['.gt-btn-color', 'toolbar.color'],
      ['.gt-btn-workflow', 'toolbar.createWorkflow'],
      ['.gt-btn-ungroup', 'toolbar.ungroup'],
    ];
    for (const _0x1af236 of [this._toolbarEl, this._detachedToolbarEl]) {
      if (!_0x1af236) continue;
      for (const [_0x45f3eb, _0x1e0f08] of _0x129ec6) {
        const _0x4a2ae7 = _0x1af236.querySelector(_0x45f3eb);
        if (!_0x4a2ae7) continue;
        const _0x2c70bb = groupText(_0x1e0f08);
        ((_0x4a2ae7.title = _0x2c70bb), _0x4a2ae7.setAttribute('aria-label', _0x2c70bb));
      }
    }
  }
  ['_mountDetachedToolbar'](_0x4455fe) {
    const _0x5de853 = document.getElementById('v2-canvas');
    if (!_0x5de853) return;
    const _0x30c7e5 = _0x4455fe.cloneNode(true);
    (_0x30c7e5.classList.add('group-toolbar--detached'),
      (_0x30c7e5.onpointerdown = (_0x337370) => _0x337370.stopPropagation()),
      _0x30c7e5.addEventListener('click', (_0x578c83) => this._handleDetachedToolbarClick(_0x578c83)),
      _0x5de853.appendChild(_0x30c7e5),
      (this._detachedToolbarEl = _0x30c7e5),
      this._syncToolbarPosition());
  }
  ['_syncToolbarPosition'](_0x2d1ef8 = null) {
    if (!this._detachedToolbarEl) return;
    const _0x5aefc6 = Number.isFinite(this._data.x) ? this._data.x : 0,
      _0x2c151d = Number.isFinite(this._data.y) ? this._data.y : 0,
      _0x12a415 = Number.isFinite(_0x2d1ef8)
        ? _0x2d1ef8
        : Number.isFinite(this._data.width)
          ? this._data.width
          : 0,
      _0xe6b386 = _0x5aefc6 + this._toolbarPreviewOffsetX + _0x12a415 / 2;
    ((this._detachedToolbarEl.style.left = _0xe6b386 + 'px'),
      (this._detachedToolbarEl.style.top = _0x2c151d + this._toolbarPreviewOffsetY + 'px'));
  }
  ['syncDragPreview']({ dx: dx = 0, dy: dy = 0, active: active = false } = {}) {
    const _0x43eeaf = active && Number.isFinite(dx) ? dx : 0,
      _0x38af0e = active && Number.isFinite(dy) ? dy : 0;
    if (_0x43eeaf === this._toolbarPreviewOffsetX && _0x38af0e === this._toolbarPreviewOffsetY) return;
    ((this._toolbarPreviewOffsetX = _0x43eeaf),
      (this._toolbarPreviewOffsetY = _0x38af0e),
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
    const _0x36a8a2 = visible && selected && singleSelected;
    this._detachedToolbarEl.classList.toggle('is-visible', _0x36a8a2);
    if (!_0x36a8a2) {
      this._toolbarInteractivityRaf !== null &&
        (cancelAnimationFrame(this._toolbarInteractivityRaf), (this._toolbarInteractivityRaf = null));
      this._syncDetachedToolbarInteractivity(false);
      return;
    }
    this._scheduleDetachedToolbarInteractivitySync(_0x36a8a2);
  }
  ['_syncColor'](_0x3e578e) {
    [this._toolbarEl, this._detachedToolbarEl].forEach((_0x4b8a70) => {
      const _0x486cf0 = _0x4b8a70?.querySelector('.color-dot');
      if (_0x486cf0) _0x486cf0.style.background = _0x3e578e;
    });
  }
  ['_closeColorMenus']() {
    document
      .querySelectorAll('.gt-color-menu.show')
      .forEach((_0x1270fc) => _0x1270fc.classList.remove('show'));
  }
  ['_runGroup']() {
    executeGroupGenerateButtons({ groupId: this._data.id });
  }
  ['_syncPlayGroupVideos']() {
    void syncPlayGroupVideos({ groupId: this._data.id, state: getStateSnapshot() });
  }
  ['_syncGroupSyncPlaybackButton'](_0xb5911e = {}) {
    const _0x59951d = collectGroupSyncPlayableVideoEntries(_0xb5911e, this._data.id).length;
    if (_0x59951d === this._lastSyncPlayableVideoCount) return;
    this._lastSyncPlayableVideoCount = _0x59951d;
    const _0x1714a2 = _0x59951d >= 2;
    [this._toolbarEl, this._detachedToolbarEl].forEach((_0x429224) => {
      const _0x2fa678 = _0x429224?.querySelector?.('.gt-btn-sync-play');
      if (!_0x2fa678) return;
      ((_0x2fa678.style.display = _0x1714a2 ? '' : 'none'),
        (_0x2fa678.disabled = !_0x1714a2),
        _0x2fa678.classList.toggle('is-disabled', !_0x1714a2));
    });
  }
  ['_setColor'](_0xa8f28d) {
    (appStore.updateNodeData(this._data.id, { color: _0xa8f28d }), this._closeColorMenus(), commit());
  }
  ['_syncContainedChildren']() {
    const { nodes: _0x5440bb } = getStateSnapshot(),
      _0x472386 = collectGroupContainmentReparentOps(_0x5440bb, [this._data.id]);
    if (_0x472386.length === 0) return false;
    const _0x28bacf = () => {
      _0x472386.forEach(({ nodeId: _0x377698, parentId: _0x3f92ed }) => {
        appStore.groupNodes([_0x377698], _0x3f92ed);
      });
    };
    if (typeof appStore.batch === 'function') return (appStore.batch(_0x28bacf), true);
    return (_0x28bacf(), true);
  }
  ['_requestWorkflow']() {
    window.dispatchEvent(
      new CustomEvent('workflow:create-request', {
        detail: { source: 'group-toolbar', groupId: this._data.id },
      }),
    );
  }
  ['_ungroup']() {
    const { nodes: _0x570545 } = appStore.getState();
    (Object.values(_0x570545).forEach((_0x47dc25) => {
      _0x47dc25.parentId === this._data.id && appStore.updateNodeData(_0x47dc25.id, { parentId: undefined });
    }),
      appStore.deleteNodes([this._data.id]),
      commit());
  }
  ['_handleDetachedToolbarClick'](_0x43814a) {
    const _0x40eb5a = _0x43814a.target;
    if (!(_0x40eb5a instanceof Element)) return;
    const _0x27bde5 = _0x40eb5a.closest(
      '.gt-btn-run, .gt-btn-sync-play, .gt-btn-color, .gt-btn-workflow, .gt-btn-ungroup, .color-option',
    );
    if (!_0x27bde5 || !this._detachedToolbarEl?.contains(_0x27bde5)) return;
    _0x43814a.stopPropagation();
    if (_0x27bde5.classList.contains('color-option')) {
      const _0x18e66f = _0x27bde5.dataset.groupColor || _0x27bde5.style.background;
      if (_0x18e66f) this._setColor(_0x18e66f);
      return;
    }
    if (_0x27bde5.classList.contains('gt-btn-run')) {
      this._runGroup();
      return;
    }
    if (_0x27bde5.classList.contains('gt-btn-sync-play')) {
      this._syncPlayGroupVideos();
      return;
    }
    if (_0x27bde5.classList.contains('gt-btn-workflow')) {
      this._requestWorkflow();
      return;
    }
    if (_0x27bde5.classList.contains('gt-btn-ungroup')) {
      this._ungroup();
      return;
    }
    if (_0x27bde5.classList.contains('gt-btn-color')) {
      const _0x2ba269 = this._detachedToolbarEl.querySelector('.gt-color-menu'),
        _0x105c77 = _0x2ba269?.classList.contains('show');
      this._closeColorMenus();
      if (_0x2ba269 && !_0x105c77) _0x2ba269.classList.add('show');
    }
  }
  ['_syncDetachedToolbarInteractivity'](_0x240a1e) {
    if (!this._detachedToolbarEl) return;
    this._detachedToolbarEl.classList.remove('is-interactive');
    if (!_0x240a1e || !this._toolbarEl) return;
    const _0x117ae4 = Array.from(this._toolbarEl.querySelectorAll('.gt-btn'))
        .map((_0x156d0d) => _0x156d0d.getBoundingClientRect())
        .filter((_0x1d3ebe) => _0x1d3ebe.width > 0 && _0x1d3ebe.height > 0),
      _0x303764 = this._toolbarEl.getBoundingClientRect();
    _0x303764.width > 0 && _0x303764.height > 0 && _0x117ae4.push(_0x303764);
    const _0x21b8be = _0x117ae4.some((_0x26a754) => {
      const _0x331829 = _0x26a754.left + _0x26a754.width / 2,
        _0x386234 = _0x26a754.top + _0x26a754.height / 2,
        _0x128f81 = document.elementFromPoint(_0x331829, _0x386234);
      return _0x128f81 && !this._toolbarEl.contains(_0x128f81);
    });
    this._detachedToolbarEl.classList.toggle('is-interactive', _0x21b8be);
  }
  ['_scheduleDetachedToolbarInteractivitySync'](_0x3cc535) {
    this._syncDetachedToolbarInteractivity(_0x3cc535);
    this._toolbarInteractivityRaf !== null &&
      (cancelAnimationFrame(this._toolbarInteractivityRaf), (this._toolbarInteractivityRaf = null));
    if (typeof requestAnimationFrame !== 'function') return;
    this._toolbarInteractivityRaf = requestAnimationFrame(() => {
      ((this._toolbarInteractivityRaf = null), this._syncDetachedToolbarInteractivity(_0x3cc535));
    });
  }
  ['update'](_0x5cd432) {
    (_0x5cd432.name !== this._data.name &&
      document.activeElement !== this._titleEl &&
      (this._titleEl.textContent = _0x5cd432.name || groupText('defaultName')),
      _0x5cd432.color !== this._data.color && this._syncColor(_0x5cd432.color || 'var(--indigo)'),
      (this._toolbarPreviewOffsetX = 0),
      (this._toolbarPreviewOffsetY = 0),
      (this._data = _0x5cd432),
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
