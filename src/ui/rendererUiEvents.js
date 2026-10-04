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
function _formatNodeLabelText(value) {
  const list = String(value || '').trim();
  if (!list) return '';
  const item = /^[\x00-\x7F]*$/.test(list);
  if (item && list.length > 20) return list.slice(0, 20) + '...';
  return list;
}
function _escapeHtml(key) {
  return String(key || '').replace(/[&<>"']/g, (index) => {
    if (index === '&') return '&amp;';
    if (index === '<') return '&lt;';
    if (index === '>') return '&gt;';
    if (index === '"') return '&quot;';
    return '&#39;';
  });
}
function _stackHasRendererJs(result) {
  const list2 = _getGuardCallsite(result);
  if (!list2) return false;
  return list2.includes('renderer.js') || list2.includes('/renderer.js') || list2.includes('\\renderer.js');
}
function _getGuardCallsite(data) {
  const options = String(data || '').split('\n');
  for (const list3 of options) {
    if (!list3.includes('at ')) continue;
    const target = list3.match(/\(([^)]+)\)/),
      list4 = (target ? target[1] : list3.replace(/^\s*at\s+/, '')).trim();
    if (!list4.includes('.js')) continue;
    const list5 = list4.replace(/:\d+:\d+$/, '');
    if (
      list5.includes('rendererUiEvents.js') ||
      list5.includes('/rendererUiEvents.js') ||
      list5.includes('\\rendererUiEvents.js')
    )
      continue;
    return list5;
  }
  return '';
}
function _createGuardError() {
  return new Error('[架构守卫] 禁止在 renderer.js 中绑定 DOM 事件，请迁移到 UI 层');
}
export function installRendererEventBindingGuard() {
  if (_guardInstalled) return;
  _guardInstalled = true;
  const source = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (...args) {
    const error = new Error().stack;
    if (_stackHasRendererJs(error)) throw _createGuardError();
    return source.apply(this, args);
  };
  const run = (enabled, next) => {
      if (!enabled) return;
      const configurable = Object.getOwnPropertyDescriptor(enabled, next);
      if (!configurable || typeof configurable.set !== 'function') return;
      Object.defineProperty(enabled, next, {
        configurable: configurable.configurable,
        enumerable: configurable.enumerable,
        get: configurable.get,
        set(current) {
          const error2 = new Error().stack;
          if (_stackHasRendererJs(error2)) throw _createGuardError();
          return configurable.set.call(this, current);
        },
      });
    },
    entry = ['onclick', 'onmouseenter', 'onmouseleave', 'onpointerdown', 'onpointerup', 'onpointermove'];
  for (const record of entry) {
    (run(globalThis.HTMLElement?.prototype, record), run(globalThis.SVGElement?.prototype, record));
  }
}
export function initRendererUiEvents({ wrap: wrap, store: store }) {
  if (_inited) return;
  _inited = true;
  const map = new WeakMap(),
    map2 = new Map(),
    payload = {
      'ms-align-left': 'left',
      'ms-align-h-center': 'h-center',
      'ms-align-right': 'right',
      'ms-align-top': 'top',
      'ms-align-v-center': 'v-center',
      'ms-align-bottom': 'bottom',
      'ms-distribute-h': 'distribute-h',
      'ms-distribute-v': 'distribute-v',
    };
  let el = null,
    value2 = null,
    id = null,
    setTimeout2 = null,
    setTimeout3 = null,
    handle = '',
    setTimeout4 = null,
    box = { x: 0, y: 0 };
  const run2 = () => {
      store?.setAlignPanelVisible?.(false);
    },
    handler = (el2) => {
      const el3 = el2?.closest?.('.v2-node');
      if (!el3) return '';
      return el3.dataset.nodeId || el3.id || '';
    },
    handler2 = (enabled2) => {
      if (!enabled2) return;
      window.v2Renderer?.pinNode?.(enabled2, 'recent-ui');
      const state = map2.get(enabled2);
      if (state) clearTimeout(state);
      const setTimeout5 = setTimeout(() => {
        (map2.delete(enabled2), window.v2Renderer?.unpinNode?.(enabled2, 'recent-ui'));
      }, RENDERER_VIRTUALIZATION_CONFIG.recentPinMs);
      map2.set(enabled2, setTimeout5);
    },
    handler3 = (enabled3) => {
      if (!enabled3) return;
      window.v2Renderer?.pinNode?.(enabled3, 'focus');
    },
    handler4 = (el4, enabled4) => {
      if (!el4 || !enabled4) return;
      setTimeout4 && (clearTimeout(setTimeout4), (setTimeout4 = null));
      handle && handle !== enabled4 && window.v2Renderer?.flushNode?.(handle);
      handle = enabled4;
      const count = Number.parseInt(el4.style.zIndex || '', 10);
      (!Number.isFinite(count) || count < 180) && (el4.style.zIndex = '180');
    },
    handler5 = (config, enabled5) => {
      if (!enabled5) return;
      if (setTimeout4) clearTimeout(setTimeout4);
      setTimeout4 = setTimeout(() => {
        setTimeout4 = null;
        const scope = document.activeElement;
        if (config && scope && config.contains(scope)) return;
        (window.v2Renderer?.unpinNode?.(enabled5, 'focus'),
          handle === enabled5 && ((handle = ''), window.v2Renderer?.flushNode?.(enabled5)));
      }, 0x4b0);
    },
    handler6 = (input, output) => {
      const el5 = document.querySelector('g.connection-group[data-conn-id="' + input + '"]');
      el5 &&
        (output
          ? el5.classList.add('connection-highlighted')
          : el5.classList.remove('connection-highlighted'));
    },
    handler7 = () => {
      (clearTimeout(setTimeout2), clearTimeout(setTimeout3), (setTimeout2 = null), (setTimeout3 = null));
      id && handler6(id, false);
      ((value2 = null), (id = null));
      if (el) el.style.display = 'none';
    },
    handler8 = () => {
      if (el) return el;
      ((el = document.createElement('div')),
        (el.id = 'v2-conn-scissor-btn'),
        (el.className = 'conn-scissor-btn'));
      const value3 = 'http://www.w3.org/2000/svg',
        el6 = document.createElementNS(value3, 'svg');
      (el6.setAttribute('width', '16'),
        el6.setAttribute('height', '16'),
        el6.setAttribute('viewBox', '0 0 24 24'),
        el6.setAttribute('fill', 'none'),
        el6.setAttribute('stroke', 'currentColor'),
        el6.setAttribute('stroke-width', '2.5'),
        el6.setAttribute('stroke-linecap', 'round'),
        el6.setAttribute('stroke-linejoin', 'round'));
      const el7 = document.createElementNS(value3, 'circle');
      (el7.setAttribute('cx', '6'), el7.setAttribute('cy', '6'), el7.setAttribute('r', '3'));
      const el8 = document.createElementNS(value3, 'circle');
      (el8.setAttribute('cx', '6'), el8.setAttribute('cy', '18'), el8.setAttribute('r', '3'));
      const el9 = document.createElementNS(value3, 'line');
      (el9.setAttribute('x1', '20'),
        el9.setAttribute('y1', '4'),
        el9.setAttribute('x2', '8.12'),
        el9.setAttribute('y2', '15.88'));
      const el10 = document.createElementNS(value3, 'line');
      (el10.setAttribute('x1', '14.47'),
        el10.setAttribute('y1', '14.48'),
        el10.setAttribute('x2', '20'),
        el10.setAttribute('y2', '20'));
      const el11 = document.createElementNS(value3, 'line');
      return (
        el11.setAttribute('x1', '8.12'),
        el11.setAttribute('y1', '8.12'),
        el11.setAttribute('x2', '12'),
        el11.setAttribute('y2', '12'),
        el6.appendChild(el7),
        el6.appendChild(el8),
        el6.appendChild(el9),
        el6.appendChild(el10),
        el6.appendChild(el11),
        el.appendChild(el6),
        (el.style.position = 'fixed'),
        (el.style.display = 'none'),
        (el.style.zIndex = '99999'),
        (el.style.transform = 'translate(-50%, -50%)'),
        (el.style.pointerEvents = 'auto'),
        document.body.appendChild(el),
        el.addEventListener('pointerdown', (event) => event.stopPropagation()),
        el.addEventListener('click', (event2) => {
          (event2.stopPropagation(), id && (executeCommand('delete_edge', { id: id }), handler7()));
        }),
        el.addEventListener('mouseenter', () => {
          (clearTimeout(setTimeout3), (setTimeout3 = null));
        }),
        el.addEventListener('mouseleave', () => {
          handler7();
        }),
        el
      );
    },
    handler9 = (value4, value5) => {
      const el12 = handler8();
      ((el12.style.left = value4 + 'px'), (el12.style.top = value5 + 'px'));
    },
    handler10 = (value6) => {
      ((value2 = value6),
        clearTimeout(setTimeout2),
        clearTimeout(setTimeout3),
        (setTimeout3 = null),
        handler8(),
        (setTimeout2 = setTimeout(() => {
          value2 === value6 &&
            ((id = value6), handler6(value6, true), handler9(box.x, box.y), (el.style.display = 'flex'));
        }, 0x3e8)));
    },
    handler11 = (value7, value8) => {
      const value9 = handler8();
      if (value8 && (value8 === value9 || value9.contains(value8))) return;
      if (value2 === value7) value2 = null;
      (clearTimeout(setTimeout2),
        (setTimeout2 = null),
        (setTimeout3 = setTimeout(() => {
          if (id === value7) handler7();
        }, 100)));
    };
  (store?.subscribeRaw &&
    store.subscribeRaw((enabled6) => {
      if (!id) return;
      if (!enabled6?.edges?.[id]) handler7();
    }),
    document.addEventListener(
      'pointerdown',
      (event3) => {
        const value10 = handler(event3.target);
        if (value10) handler2(value10);
        const value11 =
          event3.target?.closest?.('[data-ui-stop="1"]') ||
          event3.target?.closest?.('.node-label[contenteditable="true"]');
        if (value11) event3.stopPropagation();
      },
      true,
    ),
    document.addEventListener(
      'focusin',
      (event4) => {
        const el13 = event4.target?.closest?.('.v2-node'),
          value12 = el13?.dataset?.nodeId || el13?.id || '';
        value12 && (handler3(value12), handler4(el13, value12));
      },
      true,
    ),
    document.addEventListener(
      'focusout',
      (event5) => {
        const el14 = event5.target?.closest?.('.v2-node'),
          value13 = el14?.dataset?.nodeId || el14?.id || '';
        if (value13) handler5(el14, value13);
      },
      true,
    ),
    document.addEventListener('pointerdown', (x2) => {
      const enabled7 = x2.target?.closest?.('.node-label[data-node-id]');
      if (!enabled7) return;
      if (enabled7.getAttribute('contenteditable') === 'true') {
        x2.stopPropagation();
        return;
      }
      map.set(enabled7, { x: x2.clientX, y: x2.clientY });
    }),
    document.addEventListener('keyup', (event6) => {
      if (event6.key === 'Control') handler7();
    }),
    document.addEventListener('click', (x3) => {
      const value14 = x3.target?.closest?.('.v2-pick-connect-banner [data-ui-action="exit-pick-connect"]');
      if (value14) {
        (x3.stopPropagation(), executeCommand('set_pick_connect_mode', { active: false }));
        return;
      }
      const el15 = x3.target?.closest?.('#v2-picker button[data-node-type]');
      if (el15) {
        x3.stopPropagation();
        const value15 = store?.getState?.(),
          x4 = value15?.picker,
          type = el15.dataset.nodeType,
          width = Number(el15.dataset.width) || 0x12c,
          height = Number(el15.dataset.height) || 0x12c,
          label = el15.dataset.defaultLabel || t('coreUi.renderer.defaultNodeNames.node');
        x4 &&
          x4.visible &&
          (executeCommand('create_node', {
            type: type,
            x: x4.x,
            y: x4.y,
            width: width,
            height: height,
            label: label,
            content: '',
          }),
          executeCommand('hide_picker'));
        return;
      }
      const el16 = x3.target?.closest?.('#v2-align-center-panel button[data-ui-action]');
      if (el16) {
        x3.stopPropagation();
        if (el16.disabled) return;
        const mode = payload[el16.dataset.uiAction];
        if (!mode) return;
        const value16 = store?.getState?.();
        if (value16?.ui?.alignFeatureEnabled === false) {
          run2();
          return;
        }
        executeCommand('align_nodes', { mode: mode });
        return;
      }
      const el17 = x3.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (el17) {
        x3.stopPropagation();
        if (el17.disabled) return;
        const value17 = el17.dataset.uiAction;
        if (value17 === 'ms-sync-video-play') {
          const state2 = store?.getState?.(),
            selectedIds = state2?.selectedNodeIds || [];
          selectedIds.length >= 2 && void syncPlaySelectedVideos({ selectedIds: selectedIds, state: state2 });
          return;
        }
        if (value17 === 'ms-run-selected') {
          const state3 = store?.getState?.(),
            selectedIds2 = state3?.selectedNodeIds || [];
          selectedIds2.length > 0 &&
            executeSelectedGenerateButtons({ selectedIds: selectedIds2, state: state3 });
          return;
        }
        if (value17 === 'ms-asset') {
          const list6 = store?.getState?.()?.selectedNodeIds || [];
          list6.length > 0 &&
            import('../modules/AssetManager.js').then(({ assetManager: assetManager }) => {
              assetManager.showCreatePanel(list6, el17);
            });
          return;
        }
        if (value17 === 'ms-group') {
          const ids = store?.getState?.()?.selectedNodeIds || [];
          ids.length >= 2 && executeCommand('group', { ids: ids });
          return;
        }
        if (value17 === 'ms-create-collage') {
          const ids2 = store?.getState?.()?.selectedNodeIds || [];
          ids2.length >= 2 && executeCommand('create_collage_from_selection', { ids: ids2 });
          return;
        }
        if (value17 === 'ms-compose-video') {
          const value18 = store?.getState?.(),
            list7 = value18?.selectedNodeIds || [];
          list7.length >= 2 &&
            import('../modules/VideoComposeController.js').then(
              ({
                composeSelectedAudios: composeSelectedAudios,
                composeSelectedVideos: composeSelectedVideos,
              }) => {
                const selectedMediaComposeKind =
                  getSelectedMediaComposeKind(value18?.nodes || {}, list7) || el17.dataset.composeKind;
                selectedMediaComposeKind === 'audio'
                  ? composeSelectedAudios(list7, el17)
                  : composeSelectedVideos(list7, el17);
              },
            );
          return;
        }
        if (value17 === 'ms-reset-image-size') {
          const ids3 = store?.getState?.()?.selectedNodeIds || [];
          ids3.length > 0 && executeCommand('reset_source_media_size', { ids: ids3 });
          return;
        }
        return;
      }
      !x3.target?.closest?.('#v2-align-center-panel') && run2();
      const el18 = x3.target?.closest?.('#v2-context-menu button[data-cmd]');
      if (el18) {
        x3.stopPropagation();
        const value19 = el18.dataset.cmd,
          value20 = el18.dataset.cmdData;
        let value21 = undefined;
        if (value20)
          try {
            value21 = JSON.parse(value20);
          } catch {}
        value19 && (executeCommand(value19, value21), store?.hideContextMenu?.());
        return;
      }
      const el19 = x3.target?.closest?.('.node-label[data-node-id]');
      if (el19) {
        if (el19.getAttribute('contenteditable') === 'true') return;
        const box2 = map.get(el19) || { x: x3.clientX, y: x3.clientY },
          value22 = x3.clientX - box2.x,
          value23 = x3.clientY - box2.y;
        if (Math.sqrt(value22 * value22 + value23 * value23) > LABEL_RENAME_CLICK_THRESHOLD_PX) return;
        x3.stopPropagation();
        const value24 = el19.dataset.defaultName || t('app.sourceDefaults.node'),
          value25 = el19.dataset.fullName || '',
          el20 = el19.closest('.v2-node');
        ((el19.textContent = value25 || value24), (el19.contentEditable = 'true'));
        if (el20) el20.classList.add(NODE_LABEL_RENAMING_CLASS);
        el19.focus();
      }
    }),
    document.addEventListener('keydown', (event7) => {
      const enabled8 = event7.target?.closest?.('.node-label[data-node-id]');
      if (!enabled8) return;
      if (enabled8.getAttribute('contenteditable') !== 'true') return;
      event7.key === 'Enter' && (event7.preventDefault(), enabled8.blur());
    }),
    document.addEventListener('focusout', (event8) => {
      const el21 = event8.target?.closest?.('.node-label[data-node-id]');
      if (!el21) return;
      if (el21.getAttribute('contenteditable') !== 'true') return;
      const value26 = el21.dataset.defaultName || t('app.sourceDefaults.node'),
        id2 = el21.dataset.nodeId,
        value27 = el21.dataset.isBeta === '1',
        el22 = el21.closest('.v2-node'),
        name =
          el21.innerText
            .trim()
            .replace(/Beta\s*$/i, '')
            .trim() || value26;
      el21.contentEditable = 'false';
      if (el22) el22.classList.remove(NODE_LABEL_RENAMING_CLASS);
      if (id2) executeCommand('rename_node', { id: id2, name: name });
      const _formatNodeLabelText2 = _formatNodeLabelText(name);
      ((el21.dataset.fullName = name), (el21.title = name || t('app.nodeLabel.renameTooltip')));
      if (value27) {
        (el21.replaceChildren(), el21.appendChild(document.createTextNode(_formatNodeLabelText2 || value26)));
        const el23 = document.createElement('span');
        ((el23.className = 'v2-node-beta-pill'), (el23.textContent = 'Beta'), el21.appendChild(el23));
      } else el21.textContent = _formatNodeLabelText2 || value26;
    }),
    document.addEventListener('pointerover', (event9) => {
      const value28 = event9.target?.closest?.('g.connection-group[data-conn-id]');
      if (value28) {
        if (event9.relatedTarget && value28.contains(event9.relatedTarget)) return;
        handler10(value28.getAttribute('data-conn-id'));
        return;
      }
      const el24 = event9.target?.closest?.('#v2-picker button[data-node-type]');
      if (el24) {
        el24.style.background = 'var(--blue-25)';
        return;
      }
      const el25 = event9.target?.closest?.('#v2-context-menu button');
      if (el25) {
        el25.style.background = 'var(--blue-20)';
        return;
      }
      const el26 = event9.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (el26) {
        el26.style.background = 'var(--white-10)';
        return;
      }
    }),
    document.addEventListener('pointerout', (event10) => {
      const value29 = event10.target?.closest?.('g.connection-group[data-conn-id]');
      if (value29) {
        if (event10.relatedTarget && value29.contains(event10.relatedTarget)) return;
        handler11(value29.getAttribute('data-conn-id'), event10.relatedTarget);
        return;
      }
      const el27 = event10.target?.closest?.('#v2-picker button[data-node-type]');
      if (el27) {
        el27.style.background = 'var(--blue-10)';
        return;
      }
      const el28 = event10.target?.closest?.('#v2-context-menu button');
      if (el28) {
        el28.style.background = 'transparent';
        return;
      }
      const el29 = event10.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (el29) {
        el29.style.background = 'transparent';
        return;
      }
    }),
    document.addEventListener('pointermove', (event11) => {
      ((box.x = event11.clientX), (box.y = event11.clientY));
      if (!id || !el || el.style.display === 'none') return;
      handler9(event11.clientX, event11.clientY);
    }),
    wrap?.addEventListener?.('pointerdown', (event12) => {
      const value30 = event12.target?.closest?.('[data-ui-stop="1"]');
      if (value30) event12.stopPropagation();
    }),
    window.addEventListener('v2-align-feature-changed', () => {
      run2();
    }),
    store?.subscribeSelector?.(
      (enabled9) => ({
        enabled: enabled9?.ui?.alignFeatureEnabled !== false,
        alignableCount: getAlignableSelectionNodes(
          enabled9?.nodes || {},
          Array.isArray(enabled9?.selectedNodeIds) ? enabled9.selectedNodeIds : [],
        ).length,
      }),
      ({ enabled: enabled10, alignableCount: alignableCount }) => {
        (!enabled10 || alignableCount < 2) && run2();
      },
    ));
}
