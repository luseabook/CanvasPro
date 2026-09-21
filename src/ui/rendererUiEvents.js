import { executeCommand } from '../core/interaction.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from '../core/rendererVirtualization.js';
import { getAlignableSelectionNodes } from '../core/math.js';
import { executeSelectedGenerateButtons } from '../modules/groupExecution.js';
import { getSelectedMediaComposeKind } from '../modules/mediaComposeSelection.js';
import { syncPlaySelectedVideos } from '../modules/videoSyncPlayback.js';
import { t } from '../i18n/index.js';
let _inited = false,
  _guardInstalled = false;
const LABEL_RENAME_CLICK_THRESHOLD_PX = 5,
  NODE_LABEL_RENAMING_CLASS = 'is-renaming-label';
function _formatNodeLabelText(_0x5abbe2) {
  const _0x106374 = String(_0x5abbe2 || '').trim();
  if (!_0x106374) return '';
  const _0x206925 = /^[\x00-\x7F]*$/.test(_0x106374);
  if (_0x206925 && _0x106374.length > 20) return _0x106374.slice(0, 20) + '...';
  return _0x106374;
}
function _escapeHtml(_0x1e75d0) {
  return String(_0x1e75d0 || '').replace(/[&<>"']/g, (_0x24e7bb) => {
    if (_0x24e7bb === '&') return '&amp;';
    if (_0x24e7bb === '<') return '&lt;';
    if (_0x24e7bb === '>') return '&gt;';
    if (_0x24e7bb === '"') return '&quot;';
    return '&#39;';
  });
}
function _stackHasRendererJs(_0x419878) {
  const _0x4f7054 = _getGuardCallsite(_0x419878);
  if (!_0x4f7054) return false;
  return (
    _0x4f7054.includes('renderer.js') ||
    _0x4f7054.includes('/renderer.js') ||
    _0x4f7054.includes('\\renderer.js')
  );
}
function _getGuardCallsite(_0x2c36da) {
  const _0x4a4226 = String(_0x2c36da || '').split('\n');
  for (const _0x4bb3ef of _0x4a4226) {
    if (!_0x4bb3ef.includes('at ')) continue;
    const _0x866029 = _0x4bb3ef.match(/\(([^)]+)\)/),
      _0x58d73c = (_0x866029 ? _0x866029[1] : _0x4bb3ef.replace(/^\s*at\s+/, '')).trim();
    if (!_0x58d73c.includes('.js')) continue;
    const _0x18850c = _0x58d73c.replace(/:\d+:\d+$/, '');
    if (
      _0x18850c.includes('rendererUiEvents.js') ||
      _0x18850c.includes('/rendererUiEvents.js') ||
      _0x18850c.includes('\\rendererUiEvents.js')
    )
      continue;
    return _0x18850c;
  }
  return '';
}
function _createGuardError() {
  return new Error('[架构守卫] 禁止在 renderer.js 中绑定 DOM 事件，请迁移到 UI 层');
}
export function installRendererEventBindingGuard() {
  if (_guardInstalled) return;
  _guardInstalled = true;
  const _0x4f9208 = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (..._0x18a6fb) {
    const _0x267842 = new Error().stack;
    if (_stackHasRendererJs(_0x267842)) throw _createGuardError();
    return _0x4f9208.apply(this, _0x18a6fb);
  };
  const _0x2975ce = (_0x4579d2, _0x2aadd5) => {
      if (!_0x4579d2) return;
      const _0x4a2e07 = Object.getOwnPropertyDescriptor(_0x4579d2, _0x2aadd5);
      if (!_0x4a2e07 || typeof _0x4a2e07.set !== 'function') return;
      Object.defineProperty(_0x4579d2, _0x2aadd5, {
        configurable: _0x4a2e07.configurable,
        enumerable: _0x4a2e07.enumerable,
        get: _0x4a2e07.get,
        set(_0x576a2b) {
          const _0x5bdbf1 = new Error().stack;
          if (_stackHasRendererJs(_0x5bdbf1)) throw _createGuardError();
          return _0x4a2e07.set.call(this, _0x576a2b);
        },
      });
    },
    _0x491613 = ['onclick', 'onmouseenter', 'onmouseleave', 'onpointerdown', 'onpointerup', 'onpointermove'];
  for (const _0x5ab79d of _0x491613) {
    (_0x2975ce(globalThis.HTMLElement?.prototype, _0x5ab79d),
      _0x2975ce(globalThis.SVGElement?.prototype, _0x5ab79d));
  }
}
export function initRendererUiEvents({ wrap: _0x5ad16c, store: _0x2a44b2 }) {
  if (_inited) return;
  _inited = true;
  const _0x41568b = new WeakMap(),
    _0x4d862c = new Map(),
    _0x45d296 = {
      'ms-align-left': 'left',
      'ms-align-h-center': 'h-center',
      'ms-align-right': 'right',
      'ms-align-top': 'top',
      'ms-align-v-center': 'v-center',
      'ms-align-bottom': 'bottom',
      'ms-distribute-h': 'distribute-h',
      'ms-distribute-v': 'distribute-v',
    };
  let _0x10f640 = null,
    _0x5eb7eb = null,
    _0x4c8763 = null,
    _0x234068 = null,
    _0x58406d = null,
    _0x1a07d3 = '',
    _0x1be0a7 = null,
    _0x222f1b = { x: 0, y: 0 };
  const _0x2c5927 = () => {
      _0x2a44b2?.setAlignPanelVisible?.(false);
    },
    _0x543b30 = (_0x3f102d) => {
      const _0x2c37e2 = _0x3f102d?.closest?.('.v2-node');
      if (!_0x2c37e2) return '';
      return _0x2c37e2.dataset.nodeId || _0x2c37e2.id || '';
    },
    _0x20f07a = (_0x3325f6) => {
      if (!_0x3325f6) return;
      window.v2Renderer?.pinNode?.(_0x3325f6, 'recent-ui');
      const _0x4b162e = _0x4d862c.get(_0x3325f6);
      if (_0x4b162e) clearTimeout(_0x4b162e);
      const _0x146a18 = setTimeout(() => {
        (_0x4d862c.delete(_0x3325f6), window.v2Renderer?.unpinNode?.(_0x3325f6, 'recent-ui'));
      }, RENDERER_VIRTUALIZATION_CONFIG.recentPinMs);
      _0x4d862c.set(_0x3325f6, _0x146a18);
    },
    _0x2e41fa = (_0x1d8035) => {
      if (!_0x1d8035) return;
      window.v2Renderer?.pinNode?.(_0x1d8035, 'focus');
    },
    _0x269b1e = (_0x49de88, _0x4ca176) => {
      if (!_0x49de88 || !_0x4ca176) return;
      _0x1be0a7 && (clearTimeout(_0x1be0a7), (_0x1be0a7 = null));
      _0x1a07d3 && _0x1a07d3 !== _0x4ca176 && window.v2Renderer?.flushNode?.(_0x1a07d3);
      _0x1a07d3 = _0x4ca176;
      const _0x1a7b00 = Number.parseInt(_0x49de88.style.zIndex || '', 10);
      (!Number.isFinite(_0x1a7b00) || _0x1a7b00 < 180) && (_0x49de88.style.zIndex = '180');
    },
    _0x52f391 = (_0xdf15d9, _0x3ca0e2) => {
      if (!_0x3ca0e2) return;
      if (_0x1be0a7) clearTimeout(_0x1be0a7);
      _0x1be0a7 = setTimeout(() => {
        _0x1be0a7 = null;
        const _0x21b3a1 = document.activeElement;
        if (_0xdf15d9 && _0x21b3a1 && _0xdf15d9.contains(_0x21b3a1)) return;
        (window.v2Renderer?.unpinNode?.(_0x3ca0e2, 'focus'),
          _0x1a07d3 === _0x3ca0e2 && ((_0x1a07d3 = ''), window.v2Renderer?.flushNode?.(_0x3ca0e2)));
      }, 0x4b0);
    },
    _0x6129d1 = (_0x406831, _0x39a615) => {
      const _0x28c863 = document.querySelector('g.connection-group[data-conn-id="' + _0x406831 + '"]');
      _0x28c863 &&
        (_0x39a615
          ? _0x28c863.classList.add('connection-highlighted')
          : _0x28c863.classList.remove('connection-highlighted'));
    },
    _0x1e3ad6 = () => {
      (clearTimeout(_0x234068), clearTimeout(_0x58406d), (_0x234068 = null), (_0x58406d = null));
      _0x4c8763 && _0x6129d1(_0x4c8763, false);
      ((_0x5eb7eb = null), (_0x4c8763 = null));
      if (_0x10f640) _0x10f640.style.display = 'none';
    },
    _0x587c6e = () => {
      if (_0x10f640) return _0x10f640;
      ((_0x10f640 = document.createElement('div')),
        (_0x10f640.id = 'v2-conn-scissor-btn'),
        (_0x10f640.className = 'conn-scissor-btn'));
      const _0x43a2df = 'http://www.w3.org/2000/svg',
        _0x56ec63 = document.createElementNS(_0x43a2df, 'svg');
      (_0x56ec63.setAttribute('width', '16'),
        _0x56ec63.setAttribute('height', '16'),
        _0x56ec63.setAttribute('viewBox', '0 0 24 24'),
        _0x56ec63.setAttribute('fill', 'none'),
        _0x56ec63.setAttribute('stroke', 'currentColor'),
        _0x56ec63.setAttribute('stroke-width', '2.5'),
        _0x56ec63.setAttribute('stroke-linecap', 'round'),
        _0x56ec63.setAttribute('stroke-linejoin', 'round'));
      const _0x15e332 = document.createElementNS(_0x43a2df, 'circle');
      (_0x15e332.setAttribute('cx', '6'),
        _0x15e332.setAttribute('cy', '6'),
        _0x15e332.setAttribute('r', '3'));
      const _0x425a8d = document.createElementNS(_0x43a2df, 'circle');
      (_0x425a8d.setAttribute('cx', '6'),
        _0x425a8d.setAttribute('cy', '18'),
        _0x425a8d.setAttribute('r', '3'));
      const _0x3e2f20 = document.createElementNS(_0x43a2df, 'line');
      (_0x3e2f20.setAttribute('x1', '20'),
        _0x3e2f20.setAttribute('y1', '4'),
        _0x3e2f20.setAttribute('x2', '8.12'),
        _0x3e2f20.setAttribute('y2', '15.88'));
      const _0x2f93e3 = document.createElementNS(_0x43a2df, 'line');
      (_0x2f93e3.setAttribute('x1', '14.47'),
        _0x2f93e3.setAttribute('y1', '14.48'),
        _0x2f93e3.setAttribute('x2', '20'),
        _0x2f93e3.setAttribute('y2', '20'));
      const _0x1b205d = document.createElementNS(_0x43a2df, 'line');
      return (
        _0x1b205d.setAttribute('x1', '8.12'),
        _0x1b205d.setAttribute('y1', '8.12'),
        _0x1b205d.setAttribute('x2', '12'),
        _0x1b205d.setAttribute('y2', '12'),
        _0x56ec63.appendChild(_0x15e332),
        _0x56ec63.appendChild(_0x425a8d),
        _0x56ec63.appendChild(_0x3e2f20),
        _0x56ec63.appendChild(_0x2f93e3),
        _0x56ec63.appendChild(_0x1b205d),
        _0x10f640.appendChild(_0x56ec63),
        (_0x10f640.style.position = 'fixed'),
        (_0x10f640.style.display = 'none'),
        (_0x10f640.style.zIndex = '99999'),
        (_0x10f640.style.transform = 'translate(-50%, -50%)'),
        (_0x10f640.style.pointerEvents = 'auto'),
        document.body.appendChild(_0x10f640),
        _0x10f640.addEventListener('pointerdown', (_0x2a544a) => _0x2a544a.stopPropagation()),
        _0x10f640.addEventListener('click', (_0x5a017b) => {
          (_0x5a017b.stopPropagation(),
            _0x4c8763 && (executeCommand('delete_edge', { id: _0x4c8763 }), _0x1e3ad6()));
        }),
        _0x10f640.addEventListener('mouseenter', () => {
          (clearTimeout(_0x58406d), (_0x58406d = null));
        }),
        _0x10f640.addEventListener('mouseleave', () => {
          _0x1e3ad6();
        }),
        _0x10f640
      );
    },
    _0x4233c5 = (_0x3629eb, _0xa0bd9a) => {
      const _0x3fc138 = _0x587c6e();
      ((_0x3fc138.style.left = _0x3629eb + 'px'), (_0x3fc138.style.top = _0xa0bd9a + 'px'));
    },
    _0x2dd534 = (_0x120280) => {
      ((_0x5eb7eb = _0x120280),
        clearTimeout(_0x234068),
        clearTimeout(_0x58406d),
        (_0x58406d = null),
        _0x587c6e(),
        (_0x234068 = setTimeout(() => {
          _0x5eb7eb === _0x120280 &&
            ((_0x4c8763 = _0x120280),
            _0x6129d1(_0x120280, true),
            _0x4233c5(_0x222f1b.x, _0x222f1b.y),
            (_0x10f640.style.display = 'flex'));
        }, 0x3e8)));
    },
    _0x496f4a = (_0x2a3233, _0x55d368) => {
      const _0x2463ec = _0x587c6e();
      if (_0x55d368 && (_0x55d368 === _0x2463ec || _0x2463ec.contains(_0x55d368))) return;
      if (_0x5eb7eb === _0x2a3233) _0x5eb7eb = null;
      (clearTimeout(_0x234068),
        (_0x234068 = null),
        (_0x58406d = setTimeout(() => {
          if (_0x4c8763 === _0x2a3233) _0x1e3ad6();
        }, 100)));
    };
  (_0x2a44b2?.subscribeRaw &&
    _0x2a44b2.subscribeRaw((_0x40c4ac) => {
      if (!_0x4c8763) return;
      if (!_0x40c4ac?.edges?.[_0x4c8763]) _0x1e3ad6();
    }),
    document.addEventListener(
      'pointerdown',
      (_0x6449e0) => {
        const _0x56e34d = _0x543b30(_0x6449e0.target);
        if (_0x56e34d) _0x20f07a(_0x56e34d);
        const _0x2fe4df =
          _0x6449e0.target?.closest?.('[data-ui-stop="1"]') ||
          _0x6449e0.target?.closest?.('.node-label[contenteditable="true"]');
        if (_0x2fe4df) _0x6449e0.stopPropagation();
      },
      true,
    ),
    document.addEventListener(
      'focusin',
      (_0xb4827e) => {
        const _0x343062 = _0xb4827e.target?.closest?.('.v2-node'),
          _0x133594 = _0x343062?.dataset?.nodeId || _0x343062?.id || '';
        _0x133594 && (_0x2e41fa(_0x133594), _0x269b1e(_0x343062, _0x133594));
      },
      true,
    ),
    document.addEventListener(
      'focusout',
      (_0x11869d) => {
        const _0x56bf3f = _0x11869d.target?.closest?.('.v2-node'),
          _0x79025 = _0x56bf3f?.dataset?.nodeId || _0x56bf3f?.id || '';
        if (_0x79025) _0x52f391(_0x56bf3f, _0x79025);
      },
      true,
    ),
    document.addEventListener('pointerdown', (_0xb26ad6) => {
      const _0x5a2aa0 = _0xb26ad6.target?.closest?.('.node-label[data-node-id]');
      if (!_0x5a2aa0) return;
      if (_0x5a2aa0.getAttribute('contenteditable') === 'true') {
        _0xb26ad6.stopPropagation();
        return;
      }
      _0x41568b.set(_0x5a2aa0, { x: _0xb26ad6.clientX, y: _0xb26ad6.clientY });
    }),
    document.addEventListener('keyup', (_0xcec422) => {
      if (_0xcec422.key === 'Control') _0x1e3ad6();
    }),
    document.addEventListener('click', (_0x233d60) => {
      const _0x17e4d5 = _0x233d60.target?.closest?.(
        '.v2-pick-connect-banner [data-ui-action="exit-pick-connect"]',
      );
      if (_0x17e4d5) {
        (_0x233d60.stopPropagation(), executeCommand('set_pick_connect_mode', { active: false }));
        return;
      }
      const _0x4ba7bd = _0x233d60.target?.closest?.('#v2-picker button[data-node-type]');
      if (_0x4ba7bd) {
        _0x233d60.stopPropagation();
        const _0x407b8d = _0x2a44b2?.getState?.(),
          _0x4b5dae = _0x407b8d?.picker,
          _0x4336dd = _0x4ba7bd.dataset.nodeType,
          _0x25ee08 = Number(_0x4ba7bd.dataset.width) || 0x12c,
          _0x3b6915 = Number(_0x4ba7bd.dataset.height) || 0x12c,
          _0x5f40eb = _0x4ba7bd.dataset.defaultLabel || t('coreUi.renderer.defaultNodeNames.node');
        _0x4b5dae &&
          _0x4b5dae.visible &&
          (executeCommand('create_node', {
            type: _0x4336dd,
            x: _0x4b5dae.x,
            y: _0x4b5dae.y,
            width: _0x25ee08,
            height: _0x3b6915,
            label: _0x5f40eb,
            content: '',
          }),
          executeCommand('hide_picker'));
        return;
      }
      const _0x252aaf = _0x233d60.target?.closest?.('#v2-align-center-panel button[data-ui-action]');
      if (_0x252aaf) {
        _0x233d60.stopPropagation();
        if (_0x252aaf.disabled) return;
        const _0x5f282c = _0x45d296[_0x252aaf.dataset.uiAction];
        if (!_0x5f282c) return;
        const _0x286613 = _0x2a44b2?.getState?.();
        if (_0x286613?.ui?.alignFeatureEnabled === false) {
          _0x2c5927();
          return;
        }
        executeCommand('align_nodes', { mode: _0x5f282c });
        return;
      }
      const _0x4d0950 = _0x233d60.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (_0x4d0950) {
        _0x233d60.stopPropagation();
        if (_0x4d0950.disabled) return;
        const _0x9397aa = _0x4d0950.dataset.uiAction;
        if (_0x9397aa === 'ms-sync-video-play') {
          const _0x28d0ea = _0x2a44b2?.getState?.(),
            _0x15a0e1 = _0x28d0ea?.selectedNodeIds || [];
          _0x15a0e1.length >= 2 && void syncPlaySelectedVideos({ selectedIds: _0x15a0e1, state: _0x28d0ea });
          return;
        }
        if (_0x9397aa === 'ms-run-selected') {
          const _0x4f5917 = _0x2a44b2?.getState?.(),
            _0x589fb4 = _0x4f5917?.selectedNodeIds || [];
          _0x589fb4.length > 0 &&
            executeSelectedGenerateButtons({ selectedIds: _0x589fb4, state: _0x4f5917 });
          return;
        }
        if (_0x9397aa === 'ms-asset') {
          const _0x275ad7 = _0x2a44b2?.getState?.()?.selectedNodeIds || [];
          _0x275ad7.length > 0 &&
            import('../modules/AssetManager.js').then(({ assetManager: _0x167b5e }) => {
              _0x167b5e.showCreatePanel(_0x275ad7, _0x4d0950);
            });
          return;
        }
        if (_0x9397aa === 'ms-group') {
          const _0x150b71 = _0x2a44b2?.getState?.()?.selectedNodeIds || [];
          _0x150b71.length >= 2 && executeCommand('group', { ids: _0x150b71 });
          return;
        }
        if (_0x9397aa === 'ms-create-collage') {
          const _0x1cbb12 = _0x2a44b2?.getState?.()?.selectedNodeIds || [];
          _0x1cbb12.length >= 2 && executeCommand('create_collage_from_selection', { ids: _0x1cbb12 });
          return;
        }
        if (_0x9397aa === 'ms-compose-video') {
          const _0xbff8ad = _0x2a44b2?.getState?.(),
            _0x889736 = _0xbff8ad?.selectedNodeIds || [];
          _0x889736.length >= 2 &&
            import('../modules/VideoComposeController.js').then(
              ({ composeSelectedAudios: _0x508f39, composeSelectedVideos: _0x4f3b7d }) => {
                const _0x1d59bb =
                  getSelectedMediaComposeKind(_0xbff8ad?.nodes || {}, _0x889736) ||
                  _0x4d0950.dataset.composeKind;
                _0x1d59bb === 'audio' ? _0x508f39(_0x889736, _0x4d0950) : _0x4f3b7d(_0x889736, _0x4d0950);
              },
            );
          return;
        }
        if (_0x9397aa === 'ms-reset-image-size') {
          const _0x32bdb0 = _0x2a44b2?.getState?.()?.selectedNodeIds || [];
          _0x32bdb0.length > 0 && executeCommand('reset_source_media_size', { ids: _0x32bdb0 });
          return;
        }
        return;
      }
      !_0x233d60.target?.closest?.('#v2-align-center-panel') && _0x2c5927();
      const _0xd1c131 = _0x233d60.target?.closest?.('#v2-context-menu button[data-cmd]');
      if (_0xd1c131) {
        _0x233d60.stopPropagation();
        const _0x2850b4 = _0xd1c131.dataset.cmd,
          _0x1fd8c1 = _0xd1c131.dataset.cmdData;
        let _0x28c721 = undefined;
        if (_0x1fd8c1)
          try {
            _0x28c721 = JSON.parse(_0x1fd8c1);
          } catch {}
        _0x2850b4 && (executeCommand(_0x2850b4, _0x28c721), _0x2a44b2?.hideContextMenu?.());
        return;
      }
      const _0x491e25 = _0x233d60.target?.closest?.('.node-label[data-node-id]');
      if (_0x491e25) {
        if (_0x491e25.getAttribute('contenteditable') === 'true') return;
        const _0x53bda3 = _0x41568b.get(_0x491e25) || { x: _0x233d60.clientX, y: _0x233d60.clientY },
          _0x3a60fa = _0x233d60.clientX - _0x53bda3.x,
          _0x10cd07 = _0x233d60.clientY - _0x53bda3.y;
        if (Math.sqrt(_0x3a60fa * _0x3a60fa + _0x10cd07 * _0x10cd07) > LABEL_RENAME_CLICK_THRESHOLD_PX)
          return;
        _0x233d60.stopPropagation();
        const _0x3b6b55 = _0x491e25.dataset.defaultName || t('app.sourceDefaults.node'),
          _0x2f12ef = _0x491e25.dataset.fullName || '',
          _0x54179a = _0x491e25.closest('.v2-node');
        ((_0x491e25.textContent = _0x2f12ef || _0x3b6b55), (_0x491e25.contentEditable = 'true'));
        if (_0x54179a) _0x54179a.classList.add(NODE_LABEL_RENAMING_CLASS);
        _0x491e25.focus();
      }
    }),
    document.addEventListener('keydown', (_0x391984) => {
      const _0x398795 = _0x391984.target?.closest?.('.node-label[data-node-id]');
      if (!_0x398795) return;
      if (_0x398795.getAttribute('contenteditable') !== 'true') return;
      _0x391984.key === 'Enter' && (_0x391984.preventDefault(), _0x398795.blur());
    }),
    document.addEventListener('focusout', (_0x83ffc5) => {
      const _0x3b024c = _0x83ffc5.target?.closest?.('.node-label[data-node-id]');
      if (!_0x3b024c) return;
      if (_0x3b024c.getAttribute('contenteditable') !== 'true') return;
      const _0x38c327 = _0x3b024c.dataset.defaultName || t('app.sourceDefaults.node'),
        _0xd75ead = _0x3b024c.dataset.nodeId,
        _0x3d4eee = _0x3b024c.dataset.isBeta === '1',
        _0x1bb79b = _0x3b024c.closest('.v2-node'),
        _0x3406e1 =
          _0x3b024c.innerText
            .trim()
            .replace(/Beta\s*$/i, '')
            .trim() || _0x38c327;
      _0x3b024c.contentEditable = 'false';
      if (_0x1bb79b) _0x1bb79b.classList.remove(NODE_LABEL_RENAMING_CLASS);
      if (_0xd75ead) executeCommand('rename_node', { id: _0xd75ead, name: _0x3406e1 });
      const _0x5891ec = _formatNodeLabelText(_0x3406e1);
      ((_0x3b024c.dataset.fullName = _0x3406e1),
        (_0x3b024c.title = _0x3406e1 || t('app.nodeLabel.renameTooltip')));
      if (_0x3d4eee) {
        (_0x3b024c.replaceChildren(), _0x3b024c.appendChild(document.createTextNode(_0x5891ec || _0x38c327)));
        const _0x4b7d03 = document.createElement('span');
        ((_0x4b7d03.className = 'v2-node-beta-pill'),
          (_0x4b7d03.textContent = 'Beta'),
          _0x3b024c.appendChild(_0x4b7d03));
      } else _0x3b024c.textContent = _0x5891ec || _0x38c327;
    }),
    document.addEventListener('pointerover', (_0x2ad60) => {
      const _0x1c92f7 = _0x2ad60.target?.closest?.('g.connection-group[data-conn-id]');
      if (_0x1c92f7) {
        if (_0x2ad60.relatedTarget && _0x1c92f7.contains(_0x2ad60.relatedTarget)) return;
        _0x2dd534(_0x1c92f7.getAttribute('data-conn-id'));
        return;
      }
      const _0x4a0b03 = _0x2ad60.target?.closest?.('#v2-picker button[data-node-type]');
      if (_0x4a0b03) {
        _0x4a0b03.style.background = 'var(--blue-25)';
        return;
      }
      const _0x5a2ac1 = _0x2ad60.target?.closest?.('#v2-context-menu button');
      if (_0x5a2ac1) {
        _0x5a2ac1.style.background = 'var(--blue-20)';
        return;
      }
      const _0x1fb05a = _0x2ad60.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (_0x1fb05a) {
        _0x1fb05a.style.background = 'var(--white-10)';
        return;
      }
    }),
    document.addEventListener('pointerout', (_0x2d2afb) => {
      const _0x2c91af = _0x2d2afb.target?.closest?.('g.connection-group[data-conn-id]');
      if (_0x2c91af) {
        if (_0x2d2afb.relatedTarget && _0x2c91af.contains(_0x2d2afb.relatedTarget)) return;
        _0x496f4a(_0x2c91af.getAttribute('data-conn-id'), _0x2d2afb.relatedTarget);
        return;
      }
      const _0x37dbbe = _0x2d2afb.target?.closest?.('#v2-picker button[data-node-type]');
      if (_0x37dbbe) {
        _0x37dbbe.style.background = 'var(--blue-10)';
        return;
      }
      const _0x599eb8 = _0x2d2afb.target?.closest?.('#v2-context-menu button');
      if (_0x599eb8) {
        _0x599eb8.style.background = 'transparent';
        return;
      }
      const _0x2865e1 = _0x2d2afb.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (_0x2865e1) {
        _0x2865e1.style.background = 'transparent';
        return;
      }
    }),
    document.addEventListener('pointermove', (_0x461f5e) => {
      ((_0x222f1b.x = _0x461f5e.clientX), (_0x222f1b.y = _0x461f5e.clientY));
      if (!_0x4c8763 || !_0x10f640 || _0x10f640.style.display === 'none') return;
      _0x4233c5(_0x461f5e.clientX, _0x461f5e.clientY);
    }),
    _0x5ad16c?.addEventListener?.('pointerdown', (_0x416911) => {
      const _0x2ba298 = _0x416911.target?.closest?.('[data-ui-stop="1"]');
      if (_0x2ba298) _0x416911.stopPropagation();
    }),
    window.addEventListener('v2-align-feature-changed', () => {
      _0x2c5927();
    }),
    _0x2a44b2?.subscribeSelector?.(
      (_0x110b32) => ({
        enabled: _0x110b32?.ui?.alignFeatureEnabled !== false,
        alignableCount: getAlignableSelectionNodes(
          _0x110b32?.nodes || {},
          Array.isArray(_0x110b32?.selectedNodeIds) ? _0x110b32.selectedNodeIds : [],
        ).length,
      }),
      ({ enabled: _0x30e02b, alignableCount: _0x16e137 }) => {
        (!_0x30e02b || _0x16e137 < 2) && _0x2c5927();
      },
    ));
}
