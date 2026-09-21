import { t } from '../../../i18n/index.js';
import { createToolbarActionPopupAnchorPositionGetter } from '../actionMenu.js';
function multigridText(_0x47b577, _0x594d63 = {}) {
  return t('nodeToolbar.multigrid.' + _0x47b577, _0x594d63);
}
export function bindImageMultigridAction(_0x1563ca) {
  const {
      toolbarEl: _0x5b3cad,
      nodeId: _0xdf6148,
      getStateSnapshot: _0x4cbef7,
      store: _0x12b21d,
      generateId: _0x57a330,
      buildStoryboardNodePayload: _0x12e84b,
      computePreparedStoryboardSize: _0x58b0ac,
      resolveNearestStoryboardAspect: _0x3236a4,
      calcSafeSpawnPosNearNode: _0x34ec2e,
      executeGridCrop: _0x219928,
      prepareGridCells: _0x34168d,
    } = _0x1563ca,
    _0x28c3dd = _0x5b3cad.querySelector('.act-multigrid');
  _0x28c3dd &&
    _0x28c3dd.addEventListener('click', (_0x815a67) => {
      (_0x815a67.stopPropagation(), _0x815a67.preventDefault());
      const _0x2b9ece = document.querySelector('.v2-multigrid-popup');
      if (_0x2b9ece) {
        const _0x1805fb = _0x2b9ece.__v2MultigridAnchorBtn && _0x2b9ece.__v2MultigridAnchorBtn === _0x28c3dd,
          _0x1029c1 =
            typeof _0x2b9ece.__v2MultigridClose === 'function'
              ? _0x2b9ece.__v2MultigridClose
              : () => _0x2b9ece.remove();
        _0x1029c1();
        if (_0x1805fb) return;
      }
      const _0x3b04be = document.createElement('div');
      ((_0x3b04be.className = 'v2-multigrid-popup node-toolbar-action-menu node-toolbar-action-menu--fit'),
        (_0x3b04be.__v2MultigridAnchorBtn = _0x28c3dd));
      const _0xcf46f8 = createToolbarActionPopupAnchorPositionGetter(_0x28c3dd),
        _0x187c0a = _0xcf46f8();
      Object.assign(_0x3b04be.style, {
        position: 'fixed',
        left: _0x187c0a.left + 'px',
        top: _0x187c0a.top + 'px',
        transform: 'translate(-50%, calc(-100% + 10px))',
        opacity: '0',
        pointerEvents: 'none',
      });
      const _0x219dba = document.createElement('div');
      ((_0x219dba.className = 'node-toolbar-action-menu-title'),
        (_0x219dba.textContent = multigridText('chooseGrid')),
        _0x3b04be.appendChild(_0x219dba));
      const _0xca817e = [
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
        _0x18c3cf = 'http://www.w3.org/2000/svg',
        _0x443f01 = 5,
        _0x49508f = (_0x111c3e, _0x5ab886, _0x3ae7f0) => {
          const _0xa7db27 = document.createElementNS(_0x18c3cf, 'svg');
          return (
            _0xa7db27.setAttribute('viewBox', '0 0 24 24'),
            _0xa7db27.setAttribute('fill', 'none'),
            _0xa7db27.setAttribute('stroke', 'currentColor'),
            _0xa7db27.setAttribute('stroke-width', String(_0x111c3e)),
            _0xa7db27.setAttribute('width', String(_0x5ab886)),
            _0xa7db27.setAttribute('height', String(_0x3ae7f0)),
            _0xa7db27
          );
        },
        _0x11a45d = (_0x5d4d5e, _0xb669b) => {
          for (const _0x347d3d of _0xb669b || []) {
            if (!_0x347d3d || !_0x347d3d.tag || !_0x347d3d.attrs) continue;
            const _0x570b1d = document.createElementNS(_0x18c3cf, _0x347d3d.tag);
            for (const [_0x490fe2, _0x2f772e] of Object.entries(_0x347d3d.attrs)) {
              _0x570b1d.setAttribute(_0x490fe2, String(_0x2f772e));
            }
            _0x5d4d5e.appendChild(_0x570b1d);
          }
        },
        _0x139db3 = (_0x321f11) => {
          _0x321f11.replaceChildren();
          const _0x358fbe = _0x49508f(2, 16, 16),
            _0x2fe967 = document.createElementNS(_0x18c3cf, 'path');
          (_0x2fe967.setAttribute('d', 'M6 2v14a2 2 0 0 0 2 2h14M18 22V8a2 2 0 0 0-2-2H2'),
            _0x358fbe.appendChild(_0x2fe967));
          const _0x350d98 = document.createElement('span');
          ((_0x350d98.textContent = multigridText('crop')),
            _0x321f11.appendChild(_0x358fbe),
            _0x321f11.appendChild(_0x350d98));
        },
        _0x5d42a0 = (_0x52fb16) => {
          _0x52fb16.replaceChildren();
          const _0x19feb3 = _0x49508f(2, 16, 16),
            _0x554be2 = document.createElementNS(_0x18c3cf, 'path');
          (_0x554be2.setAttribute('d', 'M12 5v14M5 12h14'), _0x19feb3.appendChild(_0x554be2));
          const _0x168b27 = document.createElement('span');
          ((_0x168b27.textContent = multigridText('create')),
            _0x52fb16.appendChild(_0x19feb3),
            _0x52fb16.appendChild(_0x168b27));
        },
        _0x1fa3bc = (_0x31e869, _0x20651c) => {
          const _0x3e5b9e = Number(_0x31e869),
            _0x508e6c = Number(_0x20651c);
          if (!Number.isFinite(_0x3e5b9e) || !Number.isFinite(_0x508e6c) || _0x3e5b9e <= 0 || _0x508e6c <= 0)
            return null;
          return { width: _0x3e5b9e, height: _0x508e6c };
        },
        _0x398860 = ({ nodeData: _0x5bfb4e, cells: _0x1fa2f3 }) => {
          const _0x76adb = Number(_0x5bfb4e?.mainImageIndex) || 0,
            _0x589732 = Array.isArray(_0x5bfb4e?.images) ? _0x5bfb4e.images[_0x76adb] : null,
            _0x20e095 = [
              _0x1fa3bc(_0x5bfb4e?.originalWidth, _0x5bfb4e?.originalHeight),
              _0x1fa3bc(_0x5bfb4e?.imageWidth, _0x5bfb4e?.imageHeight),
              _0x1fa3bc(_0x5bfb4e?.imgWidth, _0x5bfb4e?.imgHeight),
              _0x1fa3bc(_0x5bfb4e?.naturalWidth, _0x5bfb4e?.naturalHeight),
              _0x1fa3bc(_0x589732?.originalWidth, _0x589732?.originalHeight),
              _0x1fa3bc(_0x589732?.imageWidth, _0x589732?.imageHeight),
              _0x1fa3bc(_0x589732?.width, _0x589732?.height),
              _0x1fa3bc(_0x1fa2f3?.[0]?.sourceWidth, _0x1fa2f3?.[0]?.sourceHeight),
              _0x1fa3bc(_0x5bfb4e?.width, _0x5bfb4e?.height),
            ];
          return _0x20e095.find(Boolean) || { width: 1, height: 1 };
        },
        _0x35de95 = async ({ cols: _0x4c2c16, rows: _0x260661 }) => {
          const _0x1cd144 = _0x4cbef7().nodes[_0xdf6148];
          if (!_0x1cd144) throw new Error(multigridText('nodeMissing'));
          const _0x28e11f = await _0x34168d({ nodeData: _0x1cd144, cols: _0x4c2c16, rows: _0x260661 });
          _0x15165e();
          const _0x168c55 = _0x4cbef7(),
            _0x3972fe = _0x168c55.nodes[_0xdf6148];
          if (!_0x3972fe) return;
          const _0x11c04e = _0x57a330('storyboard'),
            _0x3aa7d8 = _0x398860({ nodeData: _0x3972fe, cells: _0x28e11f }),
            _0x552c19 = _0x3236a4(_0x3aa7d8.width, _0x3aa7d8.height),
            _0x58cf16 = _0x58b0ac({
              aspectLabel: _0x552c19,
              cols: _0x4c2c16,
              rows: _0x260661,
              sourceWidth: _0x3aa7d8.width,
              sourceHeight: _0x3aa7d8.height,
            }),
            _0x566d54 = _0x34ec2e(_0x168c55.nodes, _0x3972fe, _0x58cf16.width, _0x58cf16.height);
          (_0x12b21d.addNode(
            _0x12e84b({
              id: _0x11c04e,
              name: multigridText('storyboardName'),
              x: _0x566d54.x,
              y: _0x566d54.y,
              width: _0x58cf16.width,
              height: _0x58cf16.height,
              cells: _0x28e11f,
              cols: _0x4c2c16,
              rows: _0x260661,
              aspectRatio: _0x552c19,
              isEditing: false,
            }),
          ),
            _0x12b21d.setSelectedNodes([_0x11c04e]),
            window.v2FocusOnNodes && window.v2FocusOnNodes([_0xdf6148, _0x11c04e]),
            window._triggerLocalCacheSave?.(),
            window.showToast?.(multigridText('storyboardCreated'), 'success'));
        },
        _0x53d1d7 = async ({ cols: _0x446e21, rows: _0x3efb20, onBusy: _0x1672f0, onRestore: _0xda7463 }) => {
          const _0x4e63c3 = _0x28c3dd?.querySelector('svg');
          (_0x4e63c3?.classList.add('v2-spinning'), _0x1672f0?.());
          try {
            await _0x35de95({ cols: _0x446e21, rows: _0x3efb20 });
          } catch (_0x2b69d2) {
            console.error('[Storyboard] Create failed:', _0x2b69d2);
            const _0x3e2223 =
              _0x2b69d2 instanceof Error
                ? _0x2b69d2.message
                : String(_0x2b69d2 || multigridText('unknownError'));
            (window.showToast?.(multigridText('storyboardFailed', { error: _0x3e2223 }), 'error'),
              _0xda7463?.());
          } finally {
            _0x4e63c3?.classList.remove('v2-spinning');
          }
        };
      let _0x1f28ba = null,
        _0x33a835 = () => {};
      const _0x459517 = (_0x2c7106) => {
          const _0x4fd7df = document.createElement('div');
          _0x4fd7df.className = 'node-toolbar-action-menu-item node-toolbar-action-grid-item';
          const _0x41a299 = document.createElement('div');
          _0x41a299.className = 'node-toolbar-action-menu-icon';
          const _0x4eb43f = _0x49508f(1.5, 24, 24);
          (_0x11a45d(_0x4eb43f, _0x2c7106.svgElements),
            _0x41a299.appendChild(_0x4eb43f),
            _0x4fd7df.appendChild(_0x41a299));
          const _0x1167d9 = document.createElement('div');
          ((_0x1167d9.className = 'node-toolbar-action-menu-body'),
            (_0x1167d9.style.flex = '0 0 auto'),
            (_0x1167d9.style.minWidth = '64px'));
          const _0x42af82 = document.createElement('span');
          ((_0x42af82.className = 'node-toolbar-action-menu-item-title'),
            (_0x42af82.textContent = multigridText(_0x2c7106.titleKey)),
            _0x1167d9.appendChild(_0x42af82));
          const _0x244c21 = document.createElement('span');
          ((_0x244c21.className = 'node-toolbar-action-menu-item-desc'),
            (_0x244c21.textContent = multigridText(_0x2c7106.descKey)),
            _0x1167d9.appendChild(_0x244c21),
            _0x4fd7df.appendChild(_0x1167d9));
          const _0x3ded27 = document.createElement('div');
          _0x3ded27.className = 'node-toolbar-action-inline-actions';
          const _0x2e5c4e = document.createElement('button'),
            _0x4e54d3 = _0x2c7106.cols * _0x2c7106.rows,
            _0x38593c = multigridText('cropTooltip', { count: _0x4e54d3 });
          ((_0x2e5c4e.type = 'button'),
            _0x2e5c4e.setAttribute('aria-label', _0x38593c),
            _0x2e5c4e.setAttribute('title', _0x38593c),
            _0x2e5c4e.setAttribute('data-tooltip', _0x38593c),
            (_0x2e5c4e.className = 'node-toolbar-action-mini-button'),
            _0x139db3(_0x2e5c4e),
            (_0x2e5c4e.onclick = async (_0x32dd8b) => {
              (_0x32dd8b.stopPropagation(), _0x15165e());
              const _0x1eb306 = _0x4cbef7().nodes[_0xdf6148];
              if (!_0x1eb306) {
                window.showToast?.(multigridText('nodeMissing'), 'error');
                return;
              }
              const _0x51d07e = _0x2e5c4e.textContent,
                _0xdc8ef2 = _0x28c3dd?.querySelector('svg');
              ((_0x2e5c4e.textContent = multigridText('cropLoading')),
                (_0x2e5c4e.style.pointerEvents = 'none'),
                _0xdc8ef2?.classList.add('v2-spinning'));
              try {
                const { newIds: _0x4d73ba } = await _0x219928({
                  nodeData: _0x1eb306,
                  cols: _0x2c7106.cols,
                  rows: _0x2c7106.rows,
                });
                _0x4d73ba.length > 0
                  ? window.showToast?.(multigridText('cropSuccess', { count: _0x4d73ba.length }), 'success')
                  : window.showToast?.(multigridText('cropEmpty'), 'error');
              } catch (_0x26927a) {
                console.error('[GridCrop] Execute failed:', _0x26927a);
                const _0x8653fa =
                  _0x26927a instanceof Error
                    ? _0x26927a.message
                    : String(_0x26927a || multigridText('unknownError'));
                window.showToast?.(_0x8653fa, 'error');
              } finally {
                ((_0x2e5c4e.textContent = _0x51d07e),
                  (_0x2e5c4e.style.pointerEvents = 'auto'),
                  _0xdc8ef2?.classList.remove('v2-spinning'));
              }
            }));
          const _0x56f8b3 = document.createElement('button'),
            _0x59d243 = multigridText('createTooltip', { cols: _0x2c7106.cols, rows: _0x2c7106.rows });
          return (
            (_0x56f8b3.type = 'button'),
            _0x56f8b3.setAttribute('aria-label', _0x59d243),
            _0x56f8b3.setAttribute('title', _0x59d243),
            _0x56f8b3.setAttribute('data-tooltip', _0x59d243),
            (_0x56f8b3.className =
              'node-toolbar-action-mini-button node-toolbar-action-mini-button--primary'),
            _0x5d42a0(_0x56f8b3),
            (_0x56f8b3.onclick = async (_0x55291f) => {
              _0x55291f.stopPropagation();
              if (_0x56f8b3.disabled) return;
              await _0x53d1d7({
                cols: _0x2c7106.cols,
                rows: _0x2c7106.rows,
                onBusy: () => {
                  ((_0x56f8b3.disabled = true), (_0x56f8b3.textContent = multigridText('createBusy')));
                },
                onRestore: () => {
                  ((_0x56f8b3.disabled = false), _0x5d42a0(_0x56f8b3));
                },
              });
            }),
            _0x3ded27.appendChild(_0x2e5c4e),
            _0x3ded27.appendChild(_0x56f8b3),
            _0x4fd7df.appendChild(_0x3ded27),
            _0x4fd7df.addEventListener('click', (_0x4393f5) => {
              _0x4393f5.stopPropagation();
            }),
            _0x4fd7df
          );
        },
        _0x2a312c = () => {
          const _0x30552f = document.createElement('div');
          _0x30552f.className =
            'node-toolbar-action-menu-item node-toolbar-action-grid-item node-toolbar-action-grid-custom';
          const _0x38b3a7 = document.createElement('div');
          _0x38b3a7.className = 'node-toolbar-action-menu-icon';
          const _0x506554 = _0x49508f(1.5, 24, 24);
          (_0x11a45d(_0x506554, [
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
            _0x38b3a7.appendChild(_0x506554),
            _0x30552f.appendChild(_0x38b3a7));
          const _0x56e990 = document.createElement('div');
          _0x56e990.className = 'node-toolbar-action-menu-body node-toolbar-action-grid-custom-body';
          const _0x4ec659 = document.createElement('span');
          ((_0x4ec659.className = 'node-toolbar-action-menu-item-title'),
            (_0x4ec659.textContent = multigridText('customTitle')),
            _0x56e990.appendChild(_0x4ec659));
          const _0x3da5e8 = document.createElement('span');
          ((_0x3da5e8.className = 'node-toolbar-action-menu-item-desc'),
            (_0x3da5e8.textContent = multigridText('customDesc')),
            _0x56e990.appendChild(_0x3da5e8),
            _0x30552f.appendChild(_0x56e990));
          const _0x3558e5 = document.createElement('div');
          ((_0x3558e5.className = 'node-toolbar-action-caret'),
            (_0x3558e5.innerHTML = '&gt;'),
            _0x30552f.appendChild(_0x3558e5));
          let _0x2cf86e = null,
            _0x2470f0 = 0,
            _0x2332c8 = 0,
            _0x532fba = 0,
            _0x481097 = null;
          const _0x57291d = () => {
              if (!_0x2cf86e) return;
              _0x2cf86e
                .querySelectorAll('.node-toolbar-action-grid-picker-cell')
                .forEach((_0x1636a0) => _0x1636a0.classList.remove('is-preview'));
              const _0x3f8b14 = _0x2cf86e.querySelector('.node-toolbar-action-grid-submenu-preview');
              if (_0x3f8b14) _0x3f8b14.textContent = multigridText('chooseSpec');
            },
            _0x3eb4c3 = ({ cols: _0x3383f2, rows: _0x591221, busy: busy = false }) => {
              if (!_0x2cf86e) return;
              _0x2cf86e.querySelectorAll('.node-toolbar-action-grid-picker-cell').forEach((_0x5e7b82) => {
                const _0x3706c4 = Number(_0x5e7b82.dataset.gridCols) || 0,
                  _0x223104 = Number(_0x5e7b82.dataset.gridRows) || 0;
                _0x5e7b82.classList.toggle('is-preview', _0x3706c4 <= _0x3383f2 && _0x223104 <= _0x591221);
              });
              const _0x3520cf = _0x2cf86e.querySelector('.node-toolbar-action-grid-submenu-preview');
              _0x3520cf &&
                (_0x3520cf.textContent = busy
                  ? multigridText('customBusy', { cols: _0x3383f2, rows: _0x591221 })
                  : multigridText('customPreview', { cols: _0x3383f2, rows: _0x591221 }));
            },
            _0x2b9a30 = () => {
              if (_0x2470f0) clearTimeout(_0x2470f0);
              _0x2470f0 = 0;
              if (_0x2332c8) clearTimeout(_0x2332c8);
              _0x2332c8 = 0;
              if (_0x532fba) cancelAnimationFrame(_0x532fba);
              ((_0x532fba = 0),
                _0x481097 && (document.removeEventListener('pointerdown', _0x481097), (_0x481097 = null)));
            },
            _0x103522 = () => {
              if (!_0x2cf86e) return;
              const _0xd00d = _0x2cf86e;
              ((_0x2cf86e = null), (_0x1f28ba = null));
              _0x3b04be.__v2MultigridSubmenuEl === _0xd00d && (_0x3b04be.__v2MultigridSubmenuEl = null);
              (_0x30552f.classList.remove('is-open'), _0x2b9a30());
              if (document.body.contains(_0xd00d)) _0xd00d.remove();
            };
          _0x33a835 = _0x103522;
          const _0x480d5e = () => {
              if (_0x2332c8) clearTimeout(_0x2332c8);
              _0x2332c8 = 0;
            },
            _0x35b251 = () => {
              (_0x480d5e(), (_0x2332c8 = setTimeout(() => _0x103522(), 160)));
            },
            _0x2631b6 = () => {
              if (_0x2cf86e && document.body.contains(_0x2cf86e)) return _0x2cf86e;
              const _0x69aeca = document.querySelector('.v2-multigrid-custom-submenu');
              if (_0x69aeca) _0x69aeca.remove();
              ((_0x2cf86e = document.createElement('div')),
                (_0x2cf86e.className =
                  'v2-multigrid-custom-submenu node-toolbar-action-submenu node-toolbar-action-grid-submenu'),
                (_0x1f28ba = _0x2cf86e),
                (_0x3b04be.__v2MultigridSubmenuEl = _0x2cf86e),
                _0x30552f.classList.add('is-open'),
                Object.assign(_0x2cf86e.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' }));
              const _0x39fdc8 = document.createElement('div');
              ((_0x39fdc8.className = 'node-toolbar-action-menu-title'),
                (_0x39fdc8.textContent = multigridText('customMenuTitle')),
                _0x2cf86e.appendChild(_0x39fdc8));
              const _0x241c0a = document.createElement('div');
              ((_0x241c0a.className = 'node-toolbar-action-grid-submenu-preview'),
                (_0x241c0a.textContent = multigridText('chooseSpec')),
                _0x2cf86e.appendChild(_0x241c0a));
              const _0x548db9 = document.createElement('div');
              ((_0x548db9.className = 'node-toolbar-action-grid-picker'),
                _0x548db9.setAttribute('role', 'grid'),
                _0x548db9.setAttribute('aria-label', multigridText('customAria')));
              for (let _0x3b60a8 = 1; _0x3b60a8 <= _0x443f01; _0x3b60a8 += 1) {
                for (let _0x5dc8aa = 1; _0x5dc8aa <= _0x443f01; _0x5dc8aa += 1) {
                  const _0x5cd0bf = document.createElement('button');
                  ((_0x5cd0bf.type = 'button'),
                    (_0x5cd0bf.className = 'node-toolbar-action-grid-picker-cell'),
                    (_0x5cd0bf.dataset.gridCols = String(_0x5dc8aa)),
                    (_0x5cd0bf.dataset.gridRows = String(_0x3b60a8)),
                    _0x5cd0bf.setAttribute('role', 'gridcell'),
                    _0x5cd0bf.setAttribute(
                      'aria-label',
                      multigridText('cellAria', { cols: _0x5dc8aa, rows: _0x3b60a8 }),
                    ),
                    _0x5cd0bf.setAttribute('title', _0x5dc8aa + '×' + _0x3b60a8),
                    _0x5cd0bf.addEventListener('pointerenter', () =>
                      _0x3eb4c3({ cols: _0x5dc8aa, rows: _0x3b60a8 }),
                    ),
                    _0x5cd0bf.addEventListener('focus', () =>
                      _0x3eb4c3({ cols: _0x5dc8aa, rows: _0x3b60a8 }),
                    ),
                    _0x5cd0bf.addEventListener('click', async (_0x337c34) => {
                      _0x337c34.stopPropagation();
                      if (_0x30552f.classList.contains('is-busy')) return;
                      await _0x53d1d7({
                        cols: _0x5dc8aa,
                        rows: _0x3b60a8,
                        onBusy: () => {
                          (_0x30552f.classList.add('is-busy'),
                            _0x548db9.setAttribute('aria-busy', 'true'),
                            _0x3eb4c3({ cols: _0x5dc8aa, rows: _0x3b60a8, busy: true }));
                        },
                        onRestore: () => {
                          (_0x30552f.classList.remove('is-busy'),
                            _0x548db9.removeAttribute('aria-busy'),
                            _0x3eb4c3({ cols: _0x5dc8aa, rows: _0x3b60a8 }));
                        },
                      });
                    }),
                    _0x548db9.appendChild(_0x5cd0bf));
                }
              }
              (_0x548db9.addEventListener('pointerleave', () => {
                if (!_0x30552f.classList.contains('is-busy')) _0x57291d();
              }),
                _0x2cf86e.appendChild(_0x548db9));
              const _0x5b2bb9 = () => {
                if (!_0x2cf86e || !document.body.contains(_0x2cf86e) || !document.body.contains(_0x3b04be)) {
                  if (_0x532fba) cancelAnimationFrame(_0x532fba);
                  _0x532fba = 0;
                  return;
                }
                const _0x77bdb3 = _0x3b04be.getBoundingClientRect();
                if (_0x77bdb3.width <= 0 || _0x77bdb3.height <= 0) {
                  _0x532fba = requestAnimationFrame(_0x5b2bb9);
                  return;
                }
                const _0x126521 = 12,
                  _0x5346bd = 8,
                  _0x1ffe9c = Math.min(_0x77bdb3.width, window.innerWidth - _0x5346bd * 2);
                _0x2cf86e.style.width = _0x1ffe9c + 'px';
                const _0x429d07 = Math.min(_0x77bdb3.height, window.innerHeight - _0x5346bd * 2);
                ((_0x2cf86e.style.height = 'auto'), (_0x2cf86e.style.maxHeight = _0x429d07 + 'px'));
                const _0x2d0343 = _0x2cf86e.getBoundingClientRect().height,
                  _0x8d1099 = Math.min(_0x2d0343 > 0 ? _0x2d0343 : _0x2cf86e.scrollHeight, _0x429d07),
                  _0x3172cc = _0x77bdb3.right + _0x126521,
                  _0x3cdd0f = _0x77bdb3.left - _0x1ffe9c - _0x126521,
                  _0x4c3fc0 = window.innerWidth - _0x1ffe9c - _0x5346bd,
                  _0x21fc05 = window.innerHeight - _0x8d1099 - _0x5346bd,
                  _0x38acd9 = _0x3172cc <= _0x4c3fc0 ? _0x3172cc : Math.max(_0x5346bd, _0x3cdd0f),
                  _0x27cac3 = Math.max(_0x5346bd, Math.min(_0x77bdb3.top, Math.max(_0x5346bd, _0x21fc05)));
                ((_0x2cf86e.style.left = _0x38acd9 + 'px'),
                  (_0x2cf86e.style.top = _0x27cac3 + 'px'),
                  (_0x532fba = requestAnimationFrame(_0x5b2bb9)));
              };
              return (
                (_0x532fba = requestAnimationFrame(_0x5b2bb9)),
                _0x2cf86e.addEventListener('pointerenter', (_0x33580c) => {
                  if (_0x33580c.pointerType !== 'mouse') return;
                  _0x480d5e();
                }),
                _0x2cf86e.addEventListener('pointerleave', (_0x44cd92) => {
                  if (_0x44cd92.pointerType !== 'mouse') return;
                  _0x35b251();
                }),
                document.body.appendChild(_0x2cf86e),
                _0x2cf86e.offsetHeight,
                (_0x2cf86e.style.opacity = '1'),
                (_0x2cf86e.style.pointerEvents = 'auto'),
                (_0x481097 = (_0x384817) => {
                  if (!_0x2cf86e) return;
                  !_0x2cf86e.contains(_0x384817.target) &&
                    !_0x30552f.contains(_0x384817.target) &&
                    _0x103522();
                }),
                document.addEventListener('pointerdown', _0x481097),
                _0x2cf86e
              );
            };
          ((_0x30552f.__v2LastPointerType = 'mouse'),
            _0x30552f.addEventListener('pointerdown', (_0x1cd9c1) => {
              _0x30552f.__v2LastPointerType = _0x1cd9c1.pointerType || 'mouse';
            }));
          const _0xbabff9 = () => {
            _0x480d5e();
            if (_0x2470f0) clearTimeout(_0x2470f0);
            _0x2470f0 = setTimeout(() => _0x2631b6(), 60);
          };
          return (
            _0x30552f.addEventListener('pointerenter', (_0x3ecdce) => {
              if (_0x3ecdce.pointerType !== 'mouse') return;
              _0xbabff9();
            }),
            _0x30552f.addEventListener('pointerleave', (_0x3b3427) => {
              if (_0x3b3427.pointerType !== 'mouse') return;
              _0x35b251();
            }),
            _0x30552f.addEventListener('click', (_0x16f3b6) => {
              _0x16f3b6.stopPropagation();
              if (_0x30552f.__v2LastPointerType === 'touch') {
                if (_0x2cf86e && document.body.contains(_0x2cf86e)) _0x103522();
                else _0x2631b6();
                return;
              }
              _0x2631b6();
            }),
            _0x30552f
          );
        };
      (_0xca817e.forEach((_0x561ba7) => _0x3b04be.appendChild(_0x459517(_0x561ba7))),
        _0x3b04be.appendChild(_0x2a312c()),
        document.body.appendChild(_0x3b04be),
        _0x3b04be.offsetHeight,
        (_0x3b04be.style.pointerEvents = 'auto'),
        (_0x3b04be.style.opacity = '1'),
        (_0x3b04be.style.transform = 'translate(-50%, -100%)'));
      let _0x34ea78 = 0,
        _0x4f2f88 = null;
      const _0x50083a = () => {
          if (_0x34ea78) cancelAnimationFrame(_0x34ea78);
          ((_0x34ea78 = 0),
            _0x33a835(),
            _0x4f2f88 && (document.removeEventListener('pointerdown', _0x4f2f88), (_0x4f2f88 = null)));
        },
        _0x15165e = () => {
          if (_0x3b04be.__v2MultigridClosing) return;
          ((_0x3b04be.__v2MultigridClosing = true),
            _0x50083a(),
            (_0x3b04be.style.opacity = '0'),
            (_0x3b04be.style.pointerEvents = 'none'),
            (_0x3b04be.style.transform = 'translate(-50%, calc(-100% + 10px))'),
            setTimeout(() => _0x3b04be.remove(), 250));
        };
      _0x3b04be.__v2MultigridClose = _0x15165e;
      const _0x2117c6 = () => {
        if (!document.body.contains(_0x3b04be) || !document.body.contains(_0x28c3dd)) {
          _0x50083a();
          return;
        }
        if (!_0xcf46f8.hasVisibleAnchor()) {
          _0x34ea78 = requestAnimationFrame(_0x2117c6);
          return;
        }
        const _0x5281d7 = _0xcf46f8();
        ((_0x3b04be.style.left = _0x5281d7.left + 'px'),
          (_0x3b04be.style.top = _0x5281d7.top + 'px'),
          (_0x34ea78 = requestAnimationFrame(_0x2117c6)));
      };
      ((_0x34ea78 = requestAnimationFrame(_0x2117c6)),
        (_0x4f2f88 = (_0x3a0876) => {
          if (_0x3b04be.__v2MultigridClosing) return;
          const _0x30d712 = _0x1f28ba || _0x3b04be.__v2MultigridSubmenuEl,
            _0x52549c = _0x3b04be.contains(_0x3a0876.target),
            _0x1a94f6 = _0x30d712 && _0x30d712.contains(_0x3a0876.target);
          if (!_0x52549c && !_0x1a94f6 && _0x3a0876.target !== _0x28c3dd) _0x15165e();
        }),
        setTimeout(() => document.addEventListener('pointerdown', _0x4f2f88), 10));
    });
}
