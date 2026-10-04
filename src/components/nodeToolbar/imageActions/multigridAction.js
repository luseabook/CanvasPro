import { t } from '../../../i18n/index.js';
import { createToolbarActionPopupAnchorPositionGetter } from '../actionMenu.js';
function multigridText(value, item = {}) {
  return t('nodeToolbar.multigrid.' + value, item);
}
export function bindImageMultigridAction(key) {
  const {
      toolbarEl: toolbarEl,
      nodeId: nodeId,
      getStateSnapshot: getStateSnapshot,
      store: store,
      generateId: generateId,
      buildStoryboardNodePayload: buildStoryboardNodePayload,
      computePreparedStoryboardSize: computePreparedStoryboardSize,
      resolveNearestStoryboardAspect: resolveNearestStoryboardAspect,
      calcSafeSpawnPosNearNode: calcSafeSpawnPosNearNode,
      executeGridCrop: executeGridCrop,
      prepareGridCells: prepareGridCells,
    } = key,
    el = toolbarEl.querySelector('.act-multigrid');
  el &&
    el.addEventListener('click', (event) => {
      (event.stopPropagation(), event.preventDefault());
      const el2 = document.querySelector('.v2-multigrid-popup');
      if (el2) {
        const index = el2.__v2MultigridAnchorBtn && el2.__v2MultigridAnchorBtn === el,
          handler =
            typeof el2.__v2MultigridClose === 'function' ? el2.__v2MultigridClose : () => el2.remove();
        handler();
        if (index) return;
      }
      const el3 = document.createElement('div');
      ((el3.className = 'v2-multigrid-popup node-toolbar-action-menu node-toolbar-action-menu--fit'),
        (el3.__v2MultigridAnchorBtn = el));
      const run = createToolbarActionPopupAnchorPositionGetter(el),
        left = run();
      Object.assign(el3.style, {
        position: 'fixed',
        left: left.left + 'px',
        top: left.top + 'px',
        transform: 'translate(-50%, calc(-100% + 10px))',
        opacity: '0',
        pointerEvents: 'none',
      });
      const el4 = document.createElement('div');
      ((el4.className = 'node-toolbar-action-menu-title'),
        (el4.textContent = multigridText('chooseGrid')),
        el3.appendChild(el4));
      const list = [
          {
            id: 'grid-4',
            titleKey: 'grid4Title',
            descKey: 'grid4Desc',
            cols: 2,
            rows: 2,
            svgElements: [
              { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7' } },
              { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '7' } },
              { tag: 'rect', attrs: { x: '14', y: '14', width: '7', height: '7' } },
              { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7' } },
            ],
          },
          {
            id: 'grid-9',
            titleKey: 'grid9Title',
            descKey: 'grid9Desc',
            cols: 3,
            rows: 3,
            svgElements: [
              { tag: 'rect', attrs: { x: '3', y: '3', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '10', y: '3', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '17', y: '3', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '3', y: '10', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '10', y: '10', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '17', y: '10', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '3', y: '17', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '10', y: '17', width: '4', height: '4' } },
              { tag: 'rect', attrs: { x: '17', y: '17', width: '4', height: '4' } },
            ],
          },
          {
            id: 'grid-16',
            titleKey: 'grid16Title',
            descKey: 'grid16Desc',
            cols: 4,
            rows: 4,
            svgElements: [
              { tag: 'path', attrs: { d: 'M3 3h18v18H3z' } },
              { tag: 'path', attrs: { d: 'M7.5 3v18' } },
              { tag: 'path', attrs: { d: 'M12 3v18' } },
              { tag: 'path', attrs: { d: 'M16.5 3v18' } },
              { tag: 'path', attrs: { d: 'M3 7.5h18' } },
              { tag: 'path', attrs: { d: 'M3 12h18' } },
              { tag: 'path', attrs: { d: 'M3 16.5h18' } },
            ],
          },
          {
            id: 'grid-25',
            titleKey: 'grid25Title',
            descKey: 'grid25Desc',
            cols: 5,
            rows: 5,
            svgElements: [
              { tag: 'path', attrs: { d: 'M3 3h18v18H3z' } },
              { tag: 'path', attrs: { d: 'M6.6 3v18' } },
              { tag: 'path', attrs: { d: 'M10.2 3v18' } },
              { tag: 'path', attrs: { d: 'M13.8 3v18' } },
              { tag: 'path', attrs: { d: 'M17.4 3v18' } },
              { tag: 'path', attrs: { d: 'M3 6.6h18' } },
              { tag: 'path', attrs: { d: 'M3 10.2h18' } },
              { tag: 'path', attrs: { d: 'M3 13.8h18' } },
              { tag: 'path', attrs: { d: 'M3 17.4h18' } },
            ],
          },
        ],
        result = 'http://www.w3.org/2000/svg',
        data = 5,
        handler2 = (options, target, source) => {
          const el5 = document.createElementNS(result, 'svg');
          return (
            el5.setAttribute('viewBox', '0 0 24 24'),
            el5.setAttribute('fill', 'none'),
            el5.setAttribute('stroke', 'currentColor'),
            el5.setAttribute('stroke-width', String(options)),
            el5.setAttribute('width', String(target)),
            el5.setAttribute('height', String(source)),
            el5
          );
        },
        handler3 = (el6, next) => {
          for (const enabled of next || []) {
            if (!enabled || !enabled.tag || !enabled.attrs) continue;
            const el7 = document.createElementNS(result, enabled.tag);
            for (const [current, entry] of Object.entries(enabled.attrs)) {
              el7.setAttribute(current, String(entry));
            }
            el6.appendChild(el7);
          }
        },
        handler4 = (el8) => {
          el8.replaceChildren();
          const el9 = handler2(2, 16, 16),
            el10 = document.createElementNS(result, 'path');
          (el10.setAttribute('d', 'M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2'), el9.appendChild(el10));
          const el11 = document.createElement('span');
          ((el11.textContent = multigridText('crop')), el8.appendChild(el9), el8.appendChild(el11));
        },
        handler5 = (el12) => {
          el12.replaceChildren();
          const el13 = handler2(2, 16, 16),
            el14 = document.createElementNS(result, 'path');
          (el14.setAttribute('d', 'M12 5v14M5 12h14'), el13.appendChild(el14));
          const el15 = document.createElement('span');
          ((el15.textContent = multigridText('create')), el12.appendChild(el13), el12.appendChild(el15));
        },
        handler6 = (record, payload) => {
          const width2 = Number(record),
            height2 = Number(payload);
          if (!Number.isFinite(width2) || !Number.isFinite(height2) || width2 <= 0 || height2 <= 0)
            return null;
          return { width: width2, height: height2 };
        },
        handler7 = ({ nodeData: nodeData, cells: cells }) => {
          const handle = Number(nodeData?.mainImageIndex) || 0,
            box = Array.isArray(nodeData?.images) ? nodeData.images[handle] : null,
            list2 = [
              handler6(nodeData?.originalWidth, nodeData?.originalHeight),
              handler6(nodeData?.imageWidth, nodeData?.imageHeight),
              handler6(nodeData?.imgWidth, nodeData?.imgHeight),
              handler6(nodeData?.naturalWidth, nodeData?.naturalHeight),
              handler6(box?.originalWidth, box?.originalHeight),
              handler6(box?.imageWidth, box?.imageHeight),
              handler6(box?.width, box?.height),
              handler6(cells?.[0]?.sourceWidth, cells?.[0]?.sourceHeight),
              handler6(nodeData?.width, nodeData?.height),
            ];
          return list2.find(Boolean) || { width: 1, height: 1 };
        },
        handler8 = async ({ cols: cols, rows: rows }) => {
          const nodeData2 = getStateSnapshot().nodes[nodeId];
          if (!nodeData2) throw new Error(multigridText('nodeMissing'));
          const cells2 = await prepareGridCells({ nodeData: nodeData2, cols: cols, rows: rows });
          handler9();
          const state = getStateSnapshot(),
            nodeData3 = state.nodes[nodeId];
          if (!nodeData3) return;
          const id = generateId('storyboard'),
            sourceWidth = handler7({ nodeData: nodeData3, cells: cells2 }),
            aspectLabel = resolveNearestStoryboardAspect(sourceWidth.width, sourceWidth.height),
            width3 = computePreparedStoryboardSize({
              aspectLabel: aspectLabel,
              cols: cols,
              rows: rows,
              sourceWidth: sourceWidth.width,
              sourceHeight: sourceWidth.height,
            }),
            x = calcSafeSpawnPosNearNode(state.nodes, nodeData3, width3.width, width3.height);
          (store.addNode(
            buildStoryboardNodePayload({
              id: id,
              name: multigridText('storyboardName'),
              x: x.x,
              y: x.y,
              width: width3.width,
              height: width3.height,
              cells: cells2,
              cols: cols,
              rows: rows,
              aspectRatio: aspectLabel,
              isEditing: false,
            }),
          ),
            store.setSelectedNodes([id]),
            window.v2FocusOnNodes && window.v2FocusOnNodes([nodeId, id]),
            window._triggerLocalCacheSave?.(),
            window.showToast?.(multigridText('storyboardCreated'), 'success'));
        },
        handler10 = async ({ cols: cols2, rows: rows2, onBusy: onBusy, onRestore: onRestore }) => {
          const el16 = el?.querySelector('svg');
          (el16?.classList.add('v2-spinning'), onBusy?.());
          try {
            await handler8({ cols: cols2, rows: rows2 });
          } catch (error) {
            console.error('[Storyboard] Create failed:', error);
            const error2 =
              error instanceof Error ? error.message : String(error || multigridText('unknownError'));
            (window.showToast?.(multigridText('storyboardFailed', { error: error2 }), 'error'),
              onRestore?.());
          } finally {
            el16?.classList.remove('v2-spinning');
          }
        };
      let value2 = null,
        handler11 = () => {};
      const run2 = (cols3) => {
          const el17 = document.createElement('div');
          el17.className = 'node-toolbar-action-menu-item node-toolbar-action-grid-item';
          const el18 = document.createElement('div');
          el18.className = 'node-toolbar-action-menu-icon';
          const config = handler2(1.5, 24, 24);
          (handler3(config, cols3.svgElements), el18.appendChild(config), el17.appendChild(el18));
          const el19 = document.createElement('div');
          ((el19.className = 'node-toolbar-action-menu-body'),
            (el19.style.flex = '0 0 auto'),
            (el19.style.minWidth = '64px'));
          const el20 = document.createElement('span');
          ((el20.className = 'node-toolbar-action-menu-item-title'),
            (el20.textContent = multigridText(cols3.titleKey)),
            el19.appendChild(el20));
          const el21 = document.createElement('span');
          ((el21.className = 'node-toolbar-action-menu-item-desc'),
            (el21.textContent = multigridText(cols3.descKey)),
            el19.appendChild(el21),
            el17.appendChild(el19));
          const el22 = document.createElement('div');
          el22.className = 'node-toolbar-action-inline-actions';
          const el23 = document.createElement('button'),
            count = cols3.cols * cols3.rows,
            multigridText2 = multigridText('cropTooltip', { count: count });
          ((el23.type = 'button'),
            el23.setAttribute('aria-label', multigridText2),
            el23.setAttribute('title', multigridText2),
            el23.setAttribute('data-tooltip', multigridText2),
            (el23.className = 'node-toolbar-action-mini-button'),
            handler4(el23),
            (el23.onclick = async (event2) => {
              (event2.stopPropagation(), handler9());
              const nodeData4 = getStateSnapshot().nodes[nodeId];
              if (!nodeData4) {
                window.showToast?.(multigridText('nodeMissing'), 'error');
                return;
              }
              const scope = el23.textContent,
                el24 = el?.querySelector('svg');
              ((el23.textContent = multigridText('cropLoading')),
                (el23.style.pointerEvents = 'none'),
                el24?.classList.add('v2-spinning'));
              try {
                const { newIds: newIds } = await executeGridCrop({
                  nodeData: nodeData4,
                  cols: cols3.cols,
                  rows: cols3.rows,
                });
                newIds.length > 0
                  ? window.showToast?.(multigridText('cropSuccess', { count: newIds.length }), 'success')
                  : window.showToast?.(multigridText('cropEmpty'), 'error');
              } catch (error3) {
                console.error('[GridCrop] Execute failed:', error3);
                const input =
                  error3 instanceof Error ? error3.message : String(error3 || multigridText('unknownError'));
                window.showToast?.(input, 'error');
              } finally {
                ((el23.textContent = scope),
                  (el23.style.pointerEvents = 'auto'),
                  el24?.classList.remove('v2-spinning'));
              }
            }));
          const el25 = document.createElement('button'),
            multigridText3 = multigridText('createTooltip', { cols: cols3.cols, rows: cols3.rows });
          return (
            (el25.type = 'button'),
            el25.setAttribute('aria-label', multigridText3),
            el25.setAttribute('title', multigridText3),
            el25.setAttribute('data-tooltip', multigridText3),
            (el25.className = 'node-toolbar-action-mini-button node-toolbar-action-mini-button--primary'),
            handler5(el25),
            (el25.onclick = async (event3) => {
              event3.stopPropagation();
              if (el25.disabled) return;
              await handler10({
                cols: cols3.cols,
                rows: cols3.rows,
                onBusy: () => {
                  ((el25.disabled = true), (el25.textContent = multigridText('createBusy')));
                },
                onRestore: () => {
                  ((el25.disabled = false), handler5(el25));
                },
              });
            }),
            el22.appendChild(el23),
            el22.appendChild(el25),
            el17.appendChild(el22),
            el17.addEventListener('click', (event4) => {
              event4.stopPropagation();
            }),
            el17
          );
        },
        handler12 = () => {
          const el26 = document.createElement('div');
          el26.className =
            'node-toolbar-action-menu-item node-toolbar-action-grid-item node-toolbar-action-grid-custom';
          const el27 = document.createElement('div');
          el27.className = 'node-toolbar-action-menu-icon';
          const output = handler2(1.5, 24, 24);
          (handler3(output, [
            { tag: 'path', attrs: { d: 'M3 3h18v18H3z' } },
            { tag: 'path', attrs: { d: 'M6.6 3v18' } },
            { tag: 'path', attrs: { d: 'M10.2 3v18' } },
            { tag: 'path', attrs: { d: 'M13.8 3v18' } },
            { tag: 'path', attrs: { d: 'M17.4 3v18' } },
            { tag: 'path', attrs: { d: 'M3 6.6h18' } },
            { tag: 'path', attrs: { d: 'M3 10.2h18' } },
            { tag: 'path', attrs: { d: 'M3 13.8h18' } },
            { tag: 'path', attrs: { d: 'M3 17.4h18' } },
          ]),
            el27.appendChild(output),
            el26.appendChild(el27));
          const el28 = document.createElement('div');
          el28.className = 'node-toolbar-action-menu-body node-toolbar-action-grid-custom-body';
          const el29 = document.createElement('span');
          ((el29.className = 'node-toolbar-action-menu-item-title'),
            (el29.textContent = multigridText('customTitle')),
            el28.appendChild(el29));
          const el30 = document.createElement('span');
          ((el30.className = 'node-toolbar-action-menu-item-desc'),
            (el30.textContent = multigridText('customDesc')),
            el28.appendChild(el30),
            el26.appendChild(el28));
          const el31 = document.createElement('div');
          ((el31.className = 'node-toolbar-action-caret'), (el31.innerHTML = '&gt;'), el26.appendChild(el31));
          let el32 = null,
            setTimeout2 = 0,
            setTimeout3 = 0,
            requestAnimationFrame2 = 0,
            value3 = null;
          const run3 = () => {
              if (!el32) return;
              el32
                .querySelectorAll('.node-toolbar-action-grid-picker-cell')
                .forEach((el33) => el33.classList.remove('is-preview'));
              const el34 = el32.querySelector('.node-toolbar-action-grid-submenu-preview');
              if (el34) el34.textContent = multigridText('chooseSpec');
            },
            handler13 = ({ cols: cols4, rows: rows3, busy: busy = false }) => {
              if (!el32) return;
              el32.querySelectorAll('.node-toolbar-action-grid-picker-cell').forEach((el35) => {
                const value4 = Number(el35.dataset.gridCols) || 0,
                  value5 = Number(el35.dataset.gridRows) || 0;
                el35.classList.toggle('is-preview', value4 <= cols4 && value5 <= rows3);
              });
              const el36 = el32.querySelector('.node-toolbar-action-grid-submenu-preview');
              el36 &&
                (el36.textContent = busy
                  ? multigridText('customBusy', { cols: cols4, rows: rows3 })
                  : multigridText('customPreview', { cols: cols4, rows: rows3 }));
            },
            handler14 = () => {
              if (setTimeout2) clearTimeout(setTimeout2);
              setTimeout2 = 0;
              if (setTimeout3) clearTimeout(setTimeout3);
              setTimeout3 = 0;
              if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
              ((requestAnimationFrame2 = 0),
                value3 && (document.removeEventListener('pointerdown', value3), (value3 = null)));
            },
            handler15 = () => {
              if (!el32) return;
              const el37 = el32;
              ((el32 = null), (value2 = null));
              el3.__v2MultigridSubmenuEl === el37 && (el3.__v2MultigridSubmenuEl = null);
              (el26.classList.remove('is-open'), handler14());
              if (document.body.contains(el37)) el37.remove();
            };
          handler11 = handler15;
          const run4 = () => {
              if (setTimeout3) clearTimeout(setTimeout3);
              setTimeout3 = 0;
            },
            handler16 = () => {
              (run4(), (setTimeout3 = setTimeout(() => handler15(), 160)));
            },
            handler17 = () => {
              if (el32 && document.body.contains(el32)) return el32;
              const el38 = document.querySelector('.v2-multigrid-custom-submenu');
              if (el38) el38.remove();
              ((el32 = document.createElement('div')),
                (el32.className =
                  'v2-multigrid-custom-submenu node-toolbar-action-submenu node-toolbar-action-grid-submenu'),
                (value2 = el32),
                (el3.__v2MultigridSubmenuEl = el32),
                el26.classList.add('is-open'),
                Object.assign(el32.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' }));
              const el39 = document.createElement('div');
              ((el39.className = 'node-toolbar-action-menu-title'),
                (el39.textContent = multigridText('customMenuTitle')),
                el32.appendChild(el39));
              const el40 = document.createElement('div');
              ((el40.className = 'node-toolbar-action-grid-submenu-preview'),
                (el40.textContent = multigridText('chooseSpec')),
                el32.appendChild(el40));
              const el41 = document.createElement('div');
              ((el41.className = 'node-toolbar-action-grid-picker'),
                el41.setAttribute('role', 'grid'),
                el41.setAttribute('aria-label', multigridText('customAria')));
              for (let rows4 = 1; rows4 <= data; rows4 += 1) {
                for (let cols5 = 1; cols5 <= data; cols5 += 1) {
                  const el42 = document.createElement('button');
                  ((el42.type = 'button'),
                    (el42.className = 'node-toolbar-action-grid-picker-cell'),
                    (el42.dataset.gridCols = String(cols5)),
                    (el42.dataset.gridRows = String(rows4)),
                    el42.setAttribute('role', 'gridcell'),
                    el42.setAttribute('aria-label', multigridText('cellAria', { cols: cols5, rows: rows4 })),
                    el42.setAttribute('title', cols5 + '×' + rows4),
                    el42.addEventListener('pointerenter', () => handler13({ cols: cols5, rows: rows4 })),
                    el42.addEventListener('focus', () => handler13({ cols: cols5, rows: rows4 })),
                    el42.addEventListener('click', async (event5) => {
                      event5.stopPropagation();
                      if (el26.classList.contains('is-busy')) return;
                      await handler10({
                        cols: cols5,
                        rows: rows4,
                        onBusy: () => {
                          (el26.classList.add('is-busy'),
                            el41.setAttribute('aria-busy', 'true'),
                            handler13({ cols: cols5, rows: rows4, busy: true }));
                        },
                        onRestore: () => {
                          (el26.classList.remove('is-busy'),
                            el41.removeAttribute('aria-busy'),
                            handler13({ cols: cols5, rows: rows4 }));
                        },
                      });
                    }),
                    el41.appendChild(el42));
                }
              }
              (el41.addEventListener('pointerleave', () => {
                if (!el26.classList.contains('is-busy')) run3();
              }),
                el32.appendChild(el41));
              const value6 = () => {
                if (!el32 || !document.body.contains(el32) || !document.body.contains(el3)) {
                  if (requestAnimationFrame2) cancelAnimationFrame(requestAnimationFrame2);
                  requestAnimationFrame2 = 0;
                  return;
                }
                const box2 = el3.getBoundingClientRect();
                if (box2.width <= 0 || box2.height <= 0) {
                  requestAnimationFrame2 = requestAnimationFrame(value6);
                  return;
                }
                const value7 = 12,
                  value8 = 8,
                  value9 = Math.min(box2.width, window.innerWidth - value8 * 2);
                el32.style.width = value9 + 'px';
                const value10 = Math.min(box2.height, window.innerHeight - value8 * 2);
                ((el32.style.height = 'auto'), (el32.style.maxHeight = value10 + 'px'));
                const count2 = el32.getBoundingClientRect().height,
                  value11 = Math.min(count2 > 0 ? count2 : el32.scrollHeight, value10),
                  value12 = box2.right + value7,
                  value13 = box2.left - value9 - value7,
                  value14 = window.innerWidth - value9 - value8,
                  value15 = window.innerHeight - value11 - value8,
                  value16 = value12 <= value14 ? value12 : Math.max(value8, value13),
                  value17 = Math.max(value8, Math.min(box2.top, Math.max(value8, value15)));
                ((el32.style.left = value16 + 'px'),
                  (el32.style.top = value17 + 'px'),
                  (requestAnimationFrame2 = requestAnimationFrame(value6)));
              };
              return (
                (requestAnimationFrame2 = requestAnimationFrame(value6)),
                el32.addEventListener('pointerenter', (value18) => {
                  if (value18.pointerType !== 'mouse') return;
                  run4();
                }),
                el32.addEventListener('pointerleave', (value19) => {
                  if (value19.pointerType !== 'mouse') return;
                  handler16();
                }),
                document.body.appendChild(el32),
                el32.offsetHeight,
                (el32.style.opacity = '1'),
                (el32.style.pointerEvents = 'auto'),
                (value3 = (event6) => {
                  if (!el32) return;
                  !el32.contains(event6.target) && !el26.contains(event6.target) && handler15();
                }),
                document.addEventListener('pointerdown', value3),
                el32
              );
            };
          ((el26.__v2LastPointerType = 'mouse'),
            el26.addEventListener('pointerdown', (value20) => {
              el26.__v2LastPointerType = value20.pointerType || 'mouse';
            }));
          const run5 = () => {
            run4();
            if (setTimeout2) clearTimeout(setTimeout2);
            setTimeout2 = setTimeout(() => handler17(), 60);
          };
          return (
            el26.addEventListener('pointerenter', (value21) => {
              if (value21.pointerType !== 'mouse') return;
              run5();
            }),
            el26.addEventListener('pointerleave', (value22) => {
              if (value22.pointerType !== 'mouse') return;
              handler16();
            }),
            el26.addEventListener('click', (event7) => {
              event7.stopPropagation();
              if (el26.__v2LastPointerType === 'touch') {
                if (el32 && document.body.contains(el32)) handler15();
                else handler17();
                return;
              }
              handler17();
            }),
            el26
          );
        };
      (list.forEach((item2) => el3.appendChild(run2(item2))),
        el3.appendChild(handler12()),
        document.body.appendChild(el3),
        el3.offsetHeight,
        (el3.style.pointerEvents = 'auto'),
        (el3.style.opacity = '1'),
        (el3.style.transform = 'translate(-50%, -100%)'));
      let requestAnimationFrame3 = 0,
        value23 = null;
      const run6 = () => {
          if (requestAnimationFrame3) cancelAnimationFrame(requestAnimationFrame3);
          ((requestAnimationFrame3 = 0),
            handler11(),
            value23 && (document.removeEventListener('pointerdown', value23), (value23 = null)));
        },
        handler9 = () => {
          if (el3.__v2MultigridClosing) return;
          ((el3.__v2MultigridClosing = true),
            run6(),
            (el3.style.opacity = '0'),
            (el3.style.pointerEvents = 'none'),
            (el3.style.transform = 'translate(-50%, calc(-100% + 10px))'),
            setTimeout(() => el3.remove(), 250));
        };
      el3.__v2MultigridClose = handler9;
      const value24 = () => {
        if (!document.body.contains(el3) || !document.body.contains(el)) {
          run6();
          return;
        }
        if (!run.hasVisibleAnchor()) {
          requestAnimationFrame3 = requestAnimationFrame(value24);
          return;
        }
        const box3 = run();
        ((el3.style.left = box3.left + 'px'),
          (el3.style.top = box3.top + 'px'),
          (requestAnimationFrame3 = requestAnimationFrame(value24)));
      };
      ((requestAnimationFrame3 = requestAnimationFrame(value24)),
        (value23 = (event8) => {
          if (el3.__v2MultigridClosing) return;
          const value25 = value2 || el3.__v2MultigridSubmenuEl,
            enabled2 = el3.contains(event8.target),
            enabled3 = value25 && value25.contains(event8.target);
          if (!enabled2 && !enabled3 && event8.target !== el) handler9();
        }),
        setTimeout(() => document.addEventListener('pointerdown', value23), 10));
    });
}
