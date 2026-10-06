import { executeCommand } from '../core/interaction.js';
import { RENDERER_VIRTUALIZATION_CONFIG } from '../core/rendererVirtualization.js';
import { liftRendererNodePresentationZIndex } from '../core/rendererNodePresentation.js';
import { getAlignableSelectionNodes, screenToWorld } from '../core/math.js';
import {
  cancelSelectedGenerateButtons,
  executeSelectedGenerateButtons,
  hasActiveSelectedGenerateBatch,
  hasRunningSelectedGenerateNodes,
} from '../modules/groupExecution.js';
import { getSelectedMediaComposeKind } from '../modules/mediaComposeSelection.js';
import { hasMaterialComparisonPair } from '../modules/materialComparisonEntries.js';
import { exportSelectedNodesBatch } from '../modules/nodeBatchExport.js';
import { showContextMenu } from '../modules/interaction/contextMenuPresenter.js';
import { stopActiveSyncVideoPlayback, syncPlaySelectedVideos } from '../modules/videoSyncPlayback.js';
import { t } from '../i18n/index.js';
let _inited = false,
  _guardInstalled = false;
const LABEL_RENAME_CLICK_THRESHOLD_PX = 5,
  NODE_LABEL_RENAMING_CLASS = 'is-renaming-label',
  EDGE_SCISSOR_HOVER_DELAY_MS = 500,
  EDGE_POINTER_HIT_DISABLED_BODY_CLASSES = [
    'is-panning',
    'is-dragging',
    'is-zooming',
    'is-edge-interaction-lite',
  ];
export function shouldResolvePooledEdgePointerHit({
  target: target,
  canvasEl: canvasEl,
  scissorBtn: scissorBtn = null,
  bodyClassList: bodyClassList = null,
} = {}) {
  if (!target || !canvasEl) return false;
  if (target !== canvasEl && !canvasEl.contains?.(target)) return false;
  if (EDGE_POINTER_HIT_DISABLED_BODY_CLASSES.some((value) => bodyClassList?.contains?.(value)))
    return false;
  if (scissorBtn && (target === scissorBtn || scissorBtn.contains?.(target))) return false;
  if (target.closest?.('g.connection-group[data-conn-id]')) return false;
  if (target.closest?.('.v2-node')) return false;
  if (target.closest?.('[data-ui-stop="1"]')) return false;
  if (target.closest?.('button')) return false;
  if (target.closest?.('input')) return false;
  if (target.closest?.('textarea')) return false;
  if (target.closest?.('select')) return false;
  if (target.closest?.('[contenteditable="true"]')) return false;
  return true;
}
function _formatNodeLabelText(item) {
  const list = String(item || '').trim();
  if (!list) return '';
  const key = /^[\x00-\x7F]*$/.test(list);
  if (key && list.length > 20) return list.slice(0, 20) + '...';
  return list;
}
function _escapeHtml(index) {
  return String(index || '').replace(/[&<>"']/g, (result) => {
    if (result === '&') return '&amp;';
    if (result === '<') return '&lt;';
    if (result === '>') return '&gt;';
    if (result === '"') return '&quot;';
    return '&#39;';
  });
}
function _stackHasRendererJs(data) {
  const list2 = _getGuardCallsite(data);
  if (!list2) return false;
  return (
    list2.includes('renderer.js') ||
    list2.includes('/renderer.js') ||
    list2.includes('\\renderer.js')
  );
}
function _getGuardCallsite(options) {
  const source = String(options || '').split('\n');
  for (const list3 of source) {
    if (!list3.includes('at ')) continue;
    const next = list3.match(/\(([^)]+)\)/),
      list4 = (next ? next[1] : list3.replace(/^\s*at\s+/, '')).trim();
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
  const current = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (...args) {
    const error = new Error().stack;
    if (_stackHasRendererJs(error)) throw _createGuardError();
    return current.apply(this, args);
  };
  const run = (enabled, entry) => {
      if (!enabled) return;
      const configurable = Object.getOwnPropertyDescriptor(enabled, entry);
      if (!configurable || typeof configurable.set !== 'function') return;
      Object.defineProperty(enabled, entry, {
        configurable: configurable.configurable,
        enumerable: configurable.enumerable,
        get: configurable.get,
        set(record) {
          const error2 = new Error().stack;
          if (_stackHasRendererJs(error2)) throw _createGuardError();
          return configurable.set.call(this, record);
        },
      });
    },
    payload = ['onclick', 'onmouseenter', 'onmouseleave', 'onpointerdown', 'onpointerup', 'onpointermove'];
  for (const handle of payload) {
    (run(globalThis.HTMLElement?.prototype, handle),
      run(globalThis.SVGElement?.prototype, handle));
  }
}
export function initRendererUiEvents({
  wrap: wrap,
  store: store,
  canDeleteEdge: canDeleteEdge = () => true,
}) {
  if (_inited) return;
  _inited = true;
  const map = new WeakMap(),
    map2 = new Map(),
    state = {
      'ms-align-left': 'left',
      'ms-align-h-center': 'h-center',
      'ms-align-right': 'right',
      'ms-align-top': 'top',
      'ms-align-v-center': 'v-center',
      'ms-align-bottom': 'bottom',
      'ms-distribute-h': 'distribute-h',
      'ms-distribute-v': 'distribute-v',
      'ms-arrange-grid': 'arrange-grid',
    };
  let value2 = null,
    scissorBtn2 = null,
    value3 = null,
    id = null,
    setTimeout2 = null,
    setTimeout3 = null,
    config = '',
    setTimeout4 = null,
    box = { x: 0, y: 0 };
  const canvasEl2 = document.getElementById('v2-canvas'),
    scope = !!canvasEl2,
    handler = (edgeId, event = null) =>
      typeof canDeleteEdge === 'function'
        ? canDeleteEdge({ edgeId: edgeId, event: event, store: store }) !== false
        : canDeleteEdge !== false,
    handler2 = ({ restoreFocus: restoreFocus = false } = {}) => {
      const input = value2;
      ((value2 = null), input?.close?.({ restoreFocus: restoreFocus }));
    },
    handler3 = () => {
      (handler2(), store?.setAlignPanelVisible?.(false));
    },
    handler4 = (columns = undefined) => {
      const output = store?.getState?.();
      if (output?.ui?.alignFeatureEnabled === false) {
        handler3();
        return;
      }
      executeCommand('align_nodes', { mode: 'arrange-grid', columns: columns });
    },
    handler5 = (restoreTarget, value4, value5) => {
      if (!restoreTarget || restoreTarget.disabled) return;
      (handler2(), restoreTarget.setAttribute('aria-expanded', 'true'));
      let showContextMenu2 = null;
      ((showContextMenu2 = showContextMenu(
        value4,
        value5,
        [
          {
            label: t('coreUi.renderer.align.gridAuto'),
            icon: 'grid',
            shortcutActionId: 'context-align-grid-auto',
            action: () => handler4(),
          },
          'sep',
          ...[2, 3, 4, 5].map((count) => ({
            label: t('coreUi.renderer.align.gridColumns', { count: count }),
            icon: 'grid',
            shortcutActionId: 'context-align-grid-' + count,
            action: () => handler4(count),
          })),
        ],
        {
          ariaLabel: t('coreUi.renderer.align.gridMenu'),
          ensureItemIcons: true,
          includeNodePicker: false,
          restoreTarget: restoreTarget,
          ownerRoot: restoreTarget.ownerDocument || document,
          ownerElement: restoreTarget,
          onClose: () => {
            (restoreTarget.setAttribute('aria-expanded', 'false'),
              value2 === showContextMenu2 && (value2 = null));
          },
        },
      )),
        (value2 = showContextMenu2));
    },
    handler6 = (el) => {
      const el2 = el?.closest?.('.v2-node');
      if (!el2) return '';
      return el2.dataset.nodeId || el2.id || '';
    },
    handler7 = (enabled2) => {
      if (!enabled2) return;
      window.v2Renderer?.pinNode?.(enabled2, 'recent-ui');
      const value6 = map2.get(enabled2);
      if (value6) clearTimeout(value6);
      const setTimeout5 = setTimeout(() => {
        (map2.delete(enabled2), window.v2Renderer?.unpinNode?.(enabled2, 'recent-ui'));
      }, RENDERER_VIRTUALIZATION_CONFIG.recentPinMs);
      map2.set(enabled2, setTimeout5);
    },
    handler8 = (enabled3) => {
      if (!enabled3) return;
      window.v2Renderer?.pinNode?.(enabled3, 'focus');
    },
    handler9 = (enabled4, enabled5) => {
      if (!enabled4 || !enabled5) return;
      (setTimeout4 && (clearTimeout(setTimeout4), (setTimeout4 = null)),
        config && config !== enabled5 && window.v2Renderer?.flushNode?.(config),
        (config = enabled5),
        liftRendererNodePresentationZIndex(enabled4, '180'));
    },
    handler10 = (value7, enabled6) => {
      if (!enabled6) return;
      if (setTimeout4) clearTimeout(setTimeout4);
      setTimeout4 = setTimeout(() => {
        setTimeout4 = null;
        const value8 = document.activeElement;
        if (value7 && value8 && value7.contains(value8)) return;
        (window.v2Renderer?.unpinNode?.(enabled6, 'focus'),
          config === enabled6 && ((config = ''), window.v2Renderer?.flushNode?.(enabled6)));
      }, 1200);
    },
    handler11 = (value9, value10) => {
      window.v2Renderer?.setEdgeInteractionHighlight?.(value9, value10);
      const el3 = document.querySelector('g.connection-group[data-conn-id="' + value9 + '"]');
      el3 &&
        (value10
          ? el3.classList.add('connection-highlighted')
          : el3.classList.remove('connection-highlighted'));
    },
    handler12 = (value11, value12) => {
      window.v2Renderer?.setHoveredEdge?.(value11, value12);
    },
    handler13 = ({ preserveHover: preserveHover = false } = {}) => {
      (clearTimeout(setTimeout2), clearTimeout(setTimeout3), (setTimeout2 = null), (setTimeout3 = null));
      id && handler11(id, false);
      !preserveHover && value3 && (handler12(value3, false), (value3 = null));
      id = null;
      if (scissorBtn2) scissorBtn2.style.display = 'none';
    },
    handler14 = () => {
      if (scissorBtn2) return scissorBtn2;
      ((scissorBtn2 = document.createElement('div')),
        (scissorBtn2.id = 'v2-conn-scissor-btn'),
        (scissorBtn2.className = 'conn-scissor-btn'));
      const value13 = 'http://www.w3.org/2000/svg',
        el4 = document.createElementNS(value13, 'svg');
      (el4.setAttribute('width', '16'),
        el4.setAttribute('height', '16'),
        el4.setAttribute('viewBox', '0 0 24 24'),
        el4.setAttribute('fill', 'none'),
        el4.setAttribute('stroke', 'currentColor'),
        el4.setAttribute('stroke-width', '2.5'),
        el4.setAttribute('stroke-linecap', 'round'),
        el4.setAttribute('stroke-linejoin', 'round'));
      const el5 = document.createElementNS(value13, 'circle');
      (el5.setAttribute('cx', '6'),
        el5.setAttribute('cy', '6'),
        el5.setAttribute('r', '3'));
      const el6 = document.createElementNS(value13, 'circle');
      (el6.setAttribute('cx', '6'),
        el6.setAttribute('cy', '18'),
        el6.setAttribute('r', '3'));
      const el7 = document.createElementNS(value13, 'line');
      (el7.setAttribute('x1', '20'),
        el7.setAttribute('y1', '4'),
        el7.setAttribute('x2', '8.12'),
        el7.setAttribute('y2', '15.88'));
      const el8 = document.createElementNS(value13, 'line');
      (el8.setAttribute('x1', '14.47'),
        el8.setAttribute('y1', '14.48'),
        el8.setAttribute('x2', '20'),
        el8.setAttribute('y2', '20'));
      const el9 = document.createElementNS(value13, 'line');
      return (
        el9.setAttribute('x1', '8.12'),
        el9.setAttribute('y1', '8.12'),
        el9.setAttribute('x2', '12'),
        el9.setAttribute('y2', '12'),
        el4.appendChild(el5),
        el4.appendChild(el6),
        el4.appendChild(el7),
        el4.appendChild(el8),
        el4.appendChild(el9),
        scissorBtn2.appendChild(el4),
        (scissorBtn2.style.position = scope ? 'absolute' : 'fixed'),
        (scissorBtn2.style.display = 'none'),
        (scissorBtn2.style.zIndex = scope ? '9' : '90'),
        (scissorBtn2.style.transform = 'translate(-50%, -50%)'),
        (scissorBtn2.style.pointerEvents = 'auto'),
        (canvasEl2 || document.body).appendChild(scissorBtn2),
        scissorBtn2.addEventListener('pointerdown', (event2) => event2.stopPropagation()),
        scissorBtn2.addEventListener('click', (event3) => {
          (event3.stopPropagation(),
            id &&
              handler(id, event3) &&
              (executeCommand('delete_edge', { id: id }), handler13()));
        }),
        scissorBtn2.addEventListener('mouseenter', () => {
          (clearTimeout(setTimeout3), (setTimeout3 = null));
        }),
        scissorBtn2.addEventListener('mouseleave', () => {
          handler13();
        }),
        scissorBtn2
      );
    },
    handler15 = (value14, value15) => {
      const el10 = handler14();
      if (scope) {
        const value16 =
            store?.getStateRaw?.()?.viewport || store?.getState?.()?.viewport || {},
          box2 = screenToWorld(value14, value15, value16);
        ((el10.style.left = box2.x + 'px'),
          (el10.style.top = box2.y + 'px'));
        return;
      }
      ((el10.style.left = value14 + 'px'), (el10.style.top = value15 + 'px'));
    },
    handler16 = (enabled7, value17 = null) => {
      if (!enabled7) return;
      if (value3 === enabled7) return;
      value3 && handler12(value3, false);
      if (id && id !== enabled7) {
        (handler11(id, false), (id = null));
        if (scissorBtn2) scissorBtn2.style.display = 'none';
      }
      ((value3 = enabled7), handler12(enabled7, true));
      if (!handler(enabled7, value17)) {
        handler13({ preserveHover: true });
        return;
      }
      (clearTimeout(setTimeout2),
        clearTimeout(setTimeout3),
        (setTimeout3 = null),
        handler14(),
        (setTimeout2 = setTimeout(() => {
          value3 === enabled7 &&
            ((id = enabled7),
            handler11(enabled7, true),
            handler15(box.x, box.y),
            (scissorBtn2.style.display = 'flex'));
        }, EDGE_SCISSOR_HOVER_DELAY_MS)));
    },
    handler17 = (value18, value19) => {
      if (scissorBtn2 && value19 && (value19 === scissorBtn2 || scissorBtn2.contains(value19))) return;
      handler12(value18, false);
      if (value3 === value18) value3 = null;
      (clearTimeout(setTimeout2), (setTimeout2 = null));
      if (id !== value18) return;
      setTimeout3 = setTimeout(() => {
        if (id === value18) handler13();
      }, 100);
    };
  (store?.subscribeRaw &&
    store.subscribeRaw((enabled8) => {
      if (!id) return;
      if (!enabled8?.edges?.[id]) handler13();
    }),
    document.addEventListener(
      'pointerdown',
      (event4) => {
        const value20 = handler6(event4.target);
        if (value20) handler7(value20);
        const value21 = event4.target?.closest?.('.node-label[contenteditable="true"]');
        if (value21) event4.stopPropagation();
      },
      true,
    ),
    document.addEventListener(
      'focusin',
      (event5) => {
        const el11 = event5.target?.closest?.('.v2-node'),
          value22 = el11?.dataset?.nodeId || el11?.id || '';
        value22 && (handler8(value22), handler9(el11, value22));
      },
      true,
    ),
    document.addEventListener(
      'focusout',
      (event6) => {
        const el12 = event6.target?.closest?.('.v2-node'),
          value23 = el12?.dataset?.nodeId || el12?.id || '';
        if (value23) handler10(el12, value23);
      },
      true,
    ),
    document.addEventListener('pointerdown', (x2) => {
      const enabled9 = x2.target?.closest?.('.node-label[data-node-id]');
      if (!enabled9) return;
      if (enabled9.getAttribute('contenteditable') === 'true') {
        x2.stopPropagation();
        return;
      }
      map.set(enabled9, { x: x2.clientX, y: x2.clientY });
    }),
    document.addEventListener('keyup', (event7) => {
      if (event7.key === 'Control') handler13();
    }),
    document.addEventListener('click', (loop) => {
      const value24 = loop.target?.closest?.(
        '.v2-pick-connect-banner [data-ui-action="exit-pick-connect"]',
      );
      if (value24) {
        (loop.stopPropagation(), executeCommand('set_pick_connect_mode', { active: false }));
        return;
      }
      const el13 = loop.target?.closest?.('#v2-picker button[data-node-type]');
      if (el13) {
        loop.stopPropagation();
        const value25 = store?.getState?.(),
          x3 = value25?.picker,
          type = el13.dataset.nodeType,
          width = Number(el13.dataset.width) || 300,
          height = Number(el13.dataset.height) || 300,
          label = el13.dataset.defaultLabel || t('coreUi.renderer.defaultNodeNames.node');
        x3 &&
          x3.visible &&
          (executeCommand('create_node', {
            type: type,
            x: x3.x,
            y: x3.y,
            width: width,
            height: height,
            label: label,
            content: '',
          }),
          executeCommand('hide_picker'));
        return;
      }
      const el14 = loop.target?.closest?.('#v2-align-center-panel button[data-ui-action]');
      if (el14) {
        loop.stopPropagation();
        if (el14.disabled) return;
        const mode = state[el14.dataset.uiAction];
        if (!mode) return;
        const value26 = store?.getState?.();
        if (value26?.ui?.alignFeatureEnabled === false) {
          handler3();
          return;
        }
        executeCommand('align_nodes', { mode: mode });
        return;
      }
      const el15 = loop.target?.closest?.('.v2-multi-select-tab button[data-ui-action]');
      if (el15) {
        loop.stopPropagation();
        if (el15.disabled) return;
        const value27 = el15.dataset.uiAction;
        if (value27 === 'ms-sync-video-play') {
          if (stopActiveSyncVideoPlayback()) return;
          const state2 = store?.getState?.(),
            selectedIds = state2?.selectedNodeIds || [];
          selectedIds.length >= 2 &&
            void syncPlaySelectedVideos({
              selectedIds: selectedIds,
              state: state2,
              loop: loop.shiftKey === true,
              shouldStopOnPointerEvent: (event8) =>
                event8?.target?.closest?.(
                  '.v2-multi-select-tab button[data-ui-action="ms-sync-video-play"]',
                ) !== el15,
            });
          return;
        }
        if (value27 === 'ms-run-selected') {
          const state3 = store?.getState?.(),
            selectedIds2 = state3?.selectedNodeIds || [],
            onStateChange = (value28) => {
              const value29 = store?.getState?.(),
                value30 =
                  value28 ||
                  hasRunningSelectedGenerateNodes(
                    value29?.nodes || {},
                    value29?.selectedNodeIds || selectedIds2,
                  ),
                value31 = value30
                  ? t('groupExecution.stopSelected')
                  : t('coreUi.renderer.multiSelect.runSelected');
              ((el15.dataset.batchActive = String(value30)),
                (el15.dataset.tooltip = value31),
                el15.setAttribute('aria-label', value31),
                el15.setAttribute('aria-busy', String(value30)),
                el15.classList.toggle('is-active', value30));
            };
          if (
            hasActiveSelectedGenerateBatch() ||
            hasRunningSelectedGenerateNodes(state3?.nodes || {}, selectedIds2)
          ) {
            (cancelSelectedGenerateButtons({ selectedIds: selectedIds2, state: state3 }), onStateChange(false));
            return;
          }
          selectedIds2.length > 0 &&
            executeSelectedGenerateButtons({
              selectedIds: selectedIds2,
              state: state3,
              onStateChange: onStateChange,
            });
          return;
        }
        if (value27 === 'ms-asset') {
          const list6 = store?.getState?.()?.selectedNodeIds || [];
          list6.length > 0 &&
            import('../modules/AssetManager.js').then(({ assetManager: assetManager }) => {
              assetManager.showLibrarySavePanel([...list6], el15);
            });
          return;
        }
        if (value27 === 'ms-batch-download') {
          const state4 = store?.getState?.() || {};
          void exportSelectedNodesBatch({ state: state4 });
          return;
        }
        if (value27 === 'ms-group') {
          const ids = store?.getState?.()?.selectedNodeIds || [];
          ids.length >= 2 && executeCommand('group', { ids: ids });
          return;
        }
        if (value27 === 'ms-material-comparison') {
          const state5 = store?.getState?.() || {},
            list7 = state5.selectedNodeIds || [],
            value32 = list7.map((value33) => state5.nodes?.[value33]).filter(Boolean);
          if (!hasMaterialComparisonPair(value32)) return;
          ((el15.disabled = true),
            el15.classList.add('is-loading'),
            el15.setAttribute('aria-busy', 'true'),
            import('../modules/materialComparison.js')
              .then(({ openMaterialComparison: openMaterialComparison }) => {
                openMaterialComparison(value32);
              })
              .catch(() => {
                globalThis.window?.showToast?.(
                  t('canvasInteraction.toasts.materialComparisonFailed'),
                  'error',
                );
              })
              .finally(() => {
                ((el15.disabled = false),
                  el15.classList.remove('is-loading'),
                  el15.setAttribute('aria-busy', 'false'));
              }));
          return;
        }
        if (value27 === 'ms-create-collage') {
          const ids2 = store?.getState?.()?.selectedNodeIds || [];
          ids2.length >= 2 && executeCommand('create_collage_from_selection', { ids: ids2 });
          return;
        }
        if (value27 === 'ms-compose-video') {
          const value34 = store?.getState?.(),
            list8 = value34?.selectedNodeIds || [];
          list8.length >= 2 &&
            import('../modules/VideoComposeController.js').then(
              ({ composeSelectedAudios: composeSelectedAudios, composeSelectedVideos: composeSelectedVideos }) => {
                const selectedMediaComposeKind =
                  getSelectedMediaComposeKind(value34?.nodes || {}, list8) ||
                  el15.dataset.composeKind;
                selectedMediaComposeKind === 'audio' ? composeSelectedAudios(list8, el15) : composeSelectedVideos(list8, el15);
              },
            );
          return;
        }
        if (value27 === 'ms-reset-image-size') {
          const ids3 = store?.getState?.()?.selectedNodeIds || [];
          ids3.length > 0 && executeCommand('reset_source_media_size', { ids: ids3 });
          return;
        }
        return;
      }
      !loop.target?.closest?.('#v2-align-center-panel') && handler3();
      const el16 = loop.target?.closest?.('.node-label[data-node-id]');
      if (el16) {
        if (el16.getAttribute('contenteditable') === 'true') return;
        const box3 = map.get(el16) || { x: loop.clientX, y: loop.clientY },
          value35 = loop.clientX - box3.x,
          value36 = loop.clientY - box3.y;
        if (Math.sqrt(value35 * value35 + value36 * value36) > LABEL_RENAME_CLICK_THRESHOLD_PX)
          return;
        loop.stopPropagation();
        const value37 = el16.dataset.defaultName || t('app.sourceDefaults.node'),
          value38 = el16.dataset.fullName || '',
          el17 = el16.closest('.v2-node');
        ((el16.textContent = value38 || value37), (el16.contentEditable = 'true'));
        if (el17) el17.classList.add(NODE_LABEL_RENAMING_CLASS);
        el16.focus();
      }
    }),
    document.addEventListener(
      'contextmenu',
      (event9) => {
        const enabled10 = event9.target?.closest?.(
          '#v2-align-center-panel button[data-ui-action="ms-arrange-grid"]',
        );
        if (!enabled10) return;
        (event9.preventDefault(),
          event9.stopPropagation(),
          event9.stopImmediatePropagation?.(),
          handler5(enabled10, event9.clientX, event9.clientY));
      },
      true,
    ),
    document.addEventListener('keydown', (event10) => {
      const el18 = event10.target?.closest?.(
          '#v2-align-center-panel button[data-ui-action="ms-arrange-grid"]',
        ),
        value39 =
          event10.key === 'ArrowDown' ||
          event10.key === 'ContextMenu' ||
          (event10.key === 'F10' && event10.shiftKey);
      if (el18 && value39) {
        (event10.preventDefault(), event10.stopPropagation());
        const box4 = el18.getBoundingClientRect();
        handler5(el18, box4.left + box4.width / 2, box4.bottom + 8);
        return;
      }
      const enabled11 = event10.target?.closest?.('.node-label[data-node-id]');
      if (!enabled11) return;
      if (enabled11.getAttribute('contenteditable') !== 'true') return;
      event10.key === 'Enter' && (event10.preventDefault(), enabled11.blur());
    }),
    document.addEventListener('focusout', (event11) => {
      const el19 = event11.target?.closest?.('.node-label[data-node-id]');
      if (!el19) return;
      if (el19.getAttribute('contenteditable') !== 'true') return;
      const value40 = el19.dataset.defaultName || t('app.sourceDefaults.node'),
        id2 = el19.dataset.nodeId,
        value41 = el19.dataset.isBeta === '1',
        el20 = el19.closest('.v2-node'),
        name =
          el19.innerText
            .trim()
            .replace(/Beta\s*$/i, '')
            .trim() || value40;
      el19.contentEditable = 'false';
      if (el20) el20.classList.remove(NODE_LABEL_RENAMING_CLASS);
      if (id2) executeCommand('rename_node', { id: id2, name: name });
      const _formatNodeLabelText2 = _formatNodeLabelText(name);
      ((el19.dataset.fullName = name),
        (el19.title = name || t('app.nodeLabel.renameTooltip')));
      if (value41) {
        (el19.replaceChildren(),
          el19.appendChild(document.createTextNode(_formatNodeLabelText2 || value40)));
        const el21 = document.createElement('span');
        ((el21.className = 'v2-node-beta-pill'),
          (el21.textContent = 'Beta'),
          el19.appendChild(el21));
      } else el19.textContent = _formatNodeLabelText2 || value40;
    }),
    document.addEventListener('pointerover', (event12) => {
      const value42 = event12.target?.closest?.('g.connection-group[data-conn-id]');
      if (value42) {
        if (event12.relatedTarget && value42.contains(event12.relatedTarget)) return;
        const value43 = value42.getAttribute('data-conn-id');
        handler16(value43, event12);
        return;
      }
      const el22 = event12.target?.closest?.('#v2-picker button[data-node-type]');
      if (el22) {
        el22.style.background = 'var(--blue-25)';
        return;
      }
    }),
    document.addEventListener('pointerout', (event13) => {
      const value44 = event13.target?.closest?.('g.connection-group[data-conn-id]');
      if (value44) {
        if (event13.relatedTarget && value44.contains(event13.relatedTarget)) return;
        handler17(value44.getAttribute('data-conn-id'), event13.relatedTarget);
        return;
      }
      const el23 = event13.target?.closest?.('#v2-picker button[data-node-type]');
      if (el23) {
        el23.style.background = 'var(--blue-10)';
        return;
      }
    }),
    document.addEventListener('pointermove', (target2) => {
      ((box.x = target2.clientX), (box.y = target2.clientY));
      const value45 = target2.target?.closest?.('g.connection-group[data-conn-id]'),
        enabled12 =
          scissorBtn2 && (target2.target === scissorBtn2 || scissorBtn2.contains?.(target2.target));
      if (value45) handler16(value45.getAttribute('data-conn-id'), target2);
      else {
        if (!enabled12) {
          const shouldResolvePooledEdgePointerHit2 = shouldResolvePooledEdgePointerHit({
              target: target2.target,
              canvasEl: canvasEl2,
              scissorBtn: scissorBtn2,
              bodyClassList: document.body?.classList,
            }),
            value46 = shouldResolvePooledEdgePointerHit2
              ? window.v2Renderer?.hitTestEdgeAtScreenPoint?.(
                  target2.clientX,
                  target2.clientY,
                ) || ''
              : '';
          if (value46) handler16(value46, target2);
          else value3 && handler17(value3, target2.relatedTarget);
        }
      }
      if (!id || !scissorBtn2 || scissorBtn2.style.display === 'none') return;
      handler15(target2.clientX, target2.clientY);
    }),
    wrap?.addEventListener?.('pointerdown', (event14) => {
      const value47 = event14.target?.closest?.('[data-ui-stop="1"]');
      if (value47) event14.stopPropagation();
    }),
    window.addEventListener('v2-align-feature-changed', () => {
      handler3();
    }),
    store?.subscribeSelector?.(
      (enabled13) => ({
        enabled: enabled13?.ui?.alignFeatureEnabled !== false,
        alignableCount: getAlignableSelectionNodes(
          enabled13?.nodes || {},
          Array.isArray(enabled13?.selectedNodeIds) ? enabled13.selectedNodeIds : [],
        ).length,
      }),
      ({ enabled: enabled14, alignableCount: alignableCount }) => {
        (!enabled14 || alignableCount < 2) && handler3();
      },
    ));
}
