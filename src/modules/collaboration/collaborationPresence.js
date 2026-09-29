import {
  screenToWorld,
  worldToScreen,
  projectPointToViewportEdge,
  spreadViewportBoundaryPoint,
} from '../../core/math.js';
import { loadCursorMetrics } from '../../../api/cursorAssetApi.js';
import { readOffscreenMembers, subscribeCollaborationPreferences } from './collaborationPreferences.js';
import { collaborationMemberColor } from './collaborationMemberColor.js';
import { drawCollaborationMediaStatus } from './collaborationMediaStatus.js';
import { getViewportPanPreview, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../../core/viewportPanPreview.js';
import { readNodeGeometryPreview, subscribeNodeGeometryPreview } from '../../core/nodeGeometryPreview.js';
import { createCollaborationGeometry } from './collaborationGeometry.js';
export function createCollaborationPresence({
  store: _0x2c34e3,
  getSession: _0x4179c7,
  drawComments: drawComments = () => {},
  documentObject: documentObject = document,
  windowObject: windowObject = window,
}) {
  const _0x30aad7 = documentObject['createElement']('div');
  ((_0x30aad7['className'] = 'collaboration-presence'),
    _0x30aad7['setAttribute']('aria-label', '协作成员位置'),
    documentObject['body']['append'](_0x30aad7));
  const _0x423fba = new Map(),
    _0x260685 = createCollaborationGeometry({
      store: _0x2c34e3,
      getSession: _0x4179c7,
      windowObject: windowObject,
    }),
    _0x3cec12 = new Map();
  let _0x1520b4 = null,
    _0x13379b = null,
    _0x65f52 = null,
    _0x2d17c1 = ![],
    _0x54667b = '',
    _0x2b9a01 = readOffscreenMembers();
  const _0x3b3816 = () => ({ ..._0x2c34e3['getStateRaw']()['viewport'], ...getViewportPanPreview() }),
    _0x305b3d = () => {
      const _0x53bfbf = documentObject['querySelector']('.v2-canvas-stage');
      return (
        _0x53bfbf?.['getBoundingClientRect']() || {
          left: 0x0,
          top: 0x0,
          width: windowObject['innerWidth'],
          height: windowObject['innerHeight'],
        }
      );
    };
  function _0x21baac() {
    const _0x27d578 = windowObject['getComputedStyle'](documentObject['documentElement'])['getPropertyValue'](
        '--pointer-cursor-image',
      ),
      _0xfb5c5f = _0x27d578['match'](/url\(["']?([^"')]+)["']?\)/)?.[0x1];
    if (!_0xfb5c5f || _0x54667b === _0xfb5c5f) return;
    ((_0x54667b = _0xfb5c5f),
      void loadCursorMetrics(_0xfb5c5f)
        ['then']((_0xdcb630) => {
          if (_0x2d17c1 || _0x54667b !== _0xfb5c5f) return;
          (_0x30aad7['style']['setProperty']('--member-cursor-width', _0xdcb630['width'] + 'px'),
            _0x30aad7['style']['setProperty']('--member-cursor-height', _0xdcb630['height'] + 'px'),
            _0x30aad7['style']['setProperty']('--member-hotspot-x', _0xdcb630['hotspot']['x'] + 'px'),
            _0x30aad7['style']['setProperty']('--member-hotspot-y', _0xdcb630['hotspot']['y'] + 'px'));
        })
        ['catch'](() => {}));
  }
  const _0x100761 = () => {
      ((_0x65f52 = null), clearTimeout(_0x1520b4), (_0x1520b4 = null), _0x260685['update']());
      const _0xf711f3 = _0x4179c7(),
        _0x391e8e = _0xf711f3?.['state'],
        _0x4ce110 = _0x305b3d();
      _0x30aad7['hidden'] = !_0x391e8e || _0x4ce110['width'] <= 0x0 || _0x4ce110['height'] <= 0x0;
      let _0x167e57 = _0x3b3816();
      if (_0x391e8e?.['locateView']) {
        const _0x5d6882 = _0x391e8e['locateView'];
        ((_0x391e8e['locateView'] = null), (_0x391e8e['followActorId'] = ''));
        const _0x1bce62 = worldToScreen(_0x5d6882['x'], _0x5d6882['y'], {
          ..._0x167e57,
          zoom: _0x5d6882['zoom'],
        });
        (_0x2c34e3['updateViewport'](
          _0x167e57['x'] + _0x4ce110['left'] + _0x4ce110['width'] / 0x2 - _0x1bce62['x'],
          _0x167e57['y'] + _0x4ce110['top'] + _0x4ce110['height'] / 0x2 - _0x1bce62['y'],
          _0x5d6882['zoom'],
        ),
          (_0x167e57 = _0x2c34e3['getStateRaw']()['viewport']));
      }
      const _0x234ab8 = _0x391e8e?.['presence']?.['find'](
        (_0x215585) => _0x215585['actorId'] === _0x391e8e['locateActorId'],
      );
      if (_0x234ab8 && Number['isFinite'](_0x234ab8['x']) && Number['isFinite'](_0x234ab8['y'])) {
        const _0x196452 = worldToScreen(_0x234ab8['x'], _0x234ab8['y'], _0x167e57);
        ((_0x391e8e['locateActorId'] = ''),
          _0x2c34e3['updateViewport'](
            _0x167e57['x'] + _0x4ce110['left'] + _0x4ce110['width'] / 0x2 - _0x196452['x'],
            _0x167e57['y'] + _0x4ce110['top'] + _0x4ce110['height'] / 0x2 - _0x196452['y'],
            _0x167e57['zoom'],
          ),
          (_0x167e57 = _0x2c34e3['getStateRaw']()['viewport']));
      }
      const _0x33baae = _0x391e8e?.['presence']?.['find'](
        (_0x4856ea) =>
          _0x4856ea['actorId'] === _0x391e8e['followActorId'] &&
          _0x4856ea['clientId'] !== _0x391e8e['clientId'] &&
          (!_0x4856ea['expiresAt'] || _0x4856ea['expiresAt'] * 0x3e8 > Date['now']()),
      );
      if (_0x391e8e?.['followActorId'] && !_0x33baae) _0xf711f3['follow']('');
      if (_0x33baae?.['view']) {
        const _0x10a986 = worldToScreen(_0x33baae['view']['x'], _0x33baae['view']['y'], {
            ..._0x167e57,
            zoom: _0x33baae['view']['zoom'],
          }),
          _0x136568 = _0x167e57['x'] + _0x4ce110['left'] + _0x4ce110['width'] / 0x2 - _0x10a986['x'],
          _0x5e1463 = _0x167e57['y'] + _0x4ce110['top'] + _0x4ce110['height'] / 0x2 - _0x10a986['y'];
        if (
          Math['abs'](_0x136568 - _0x167e57['x']) > 0.1 ||
          Math['abs'](_0x5e1463 - _0x167e57['y']) > 0.1 ||
          _0x167e57['zoom'] !== _0x33baae['view']['zoom']
        )
          _0x2c34e3['updateViewport'](_0x136568, _0x5e1463, _0x33baae['view']['zoom']);
        _0x167e57 = _0x2c34e3['getStateRaw']()['viewport'];
      }
      const _0x2c3032 = new Set(),
        _0x587ddf = [],
        _0x1ce377 = (_0x2d03e8, _0x2a957b) => {
          _0x2c3032['add'](_0x2d03e8);
          if (!_0x423fba['has'](_0x2d03e8)) {
            const _0xae704f = documentObject['createElement']('div');
            _0xae704f['className'] = _0x2a957b;
            if (_0x2a957b === 'collaboration-cursor') {
              const _0x4e11a2 = documentObject['createElement']('span');
              _0x4e11a2['className'] = 'collaboration-cursor-shape';
              const _0x286495 = documentObject['createElement']('span');
              _0x286495['className'] = 'collaboration-direction-arrow';
              const _0x4908d4 = documentObject['createElement']('span');
              ((_0x4908d4['className'] = 'collaboration-cursor-name'),
                _0xae704f['append'](_0x4e11a2, _0x286495, _0x4908d4),
                _0xae704f['addEventListener']('click', () =>
                  _0x4179c7()?.['locate'](_0xae704f['dataset']['actorId']),
                ),
                _0xae704f['addEventListener']('keydown', (_0x1a6f42) => {
                  (_0x1a6f42['key'] === 'Enter' || _0x1a6f42['key'] === '\x20') &&
                    (_0x1a6f42['preventDefault'](), _0x4179c7()?.['locate'](_0xae704f['dataset']['actorId']));
                }));
            }
            (_0x30aad7['append'](_0xae704f), _0x423fba['set'](_0x2d03e8, _0xae704f));
          }
          return _0x423fba['get'](_0x2d03e8);
        };
      for (const _0x31d780 of _0x391e8e?.['presence'] || []) {
        if (_0x31d780['clientId'] === _0x391e8e['clientId']) continue;
        if (_0x31d780['expiresAt'] && _0x31d780['expiresAt'] * 0x3e8 < Date['now']()) continue;
        const _0x4de327 = collaborationMemberColor(
            _0x391e8e['members']?.['find']((_0x4e62bf) => _0x4e62bf['id'] === _0x31d780['actorId']) || {
              id: _0x31d780['actorId'],
            },
          ),
          _0x37ae84 = Object['keys'](_0x391e8e['locks'] || {})['filter'](
            (_0x5e9976) =>
              _0x391e8e['locks'][_0x5e9976]['clientId'] === _0x31d780['clientId'] &&
              _0x391e8e['locks'][_0x5e9976]['expiresAt'] * 0x3e8 > Date['now'](),
          );
        for (const _0x569a8a of new Set([...(_0x31d780['selected'] || []), ..._0x37ae84])) {
          const _0x48e808 = readNodeGeometryPreview(
            _0x569a8a,
            _0x2c34e3['getStateRaw']()['nodes'][_0x569a8a],
          );
          if (!_0x48e808 || !_0x48e808['width'] || !_0x48e808['height']) continue;
          const _0x2280aa = _0x1ce377(_0x31d780['clientId'] + ':' + _0x569a8a, 'collaboration-selection'),
            _0x35a0d7 = worldToScreen(_0x48e808['x'], _0x48e808['y'], _0x167e57);
          ((_0x2280aa['style']['transform'] =
            'translate(' + _0x35a0d7['x'] + 'px, ' + _0x35a0d7['y'] + 'px)'),
            (_0x2280aa['style']['width'] = _0x48e808['width'] * _0x167e57['zoom'] + 'px'),
            (_0x2280aa['style']['height'] = _0x48e808['height'] * _0x167e57['zoom'] + 'px'),
            (_0x2280aa['dataset']['member'] = _0x37ae84['includes'](_0x569a8a)
              ? _0x31d780['name'] + ' · 正在编辑'
              : _0x31d780['name']),
            (_0x2280aa['dataset']['nodeId'] = _0x569a8a),
            _0x2280aa['style']['setProperty']('--member-color', _0x4de327));
        }
        if (_0x31d780['x'] == null || _0x31d780['y'] == null) continue;
        const _0x2a061d = _0x1ce377(_0x31d780['clientId'], 'collaboration-cursor'),
          _0x2619a1 = worldToScreen(_0x31d780['x'], _0x31d780['y'], _0x167e57),
          _0x4f75e8 = projectPointToViewportEdge(_0x2619a1, _0x4ce110),
          _0x5c1c35 = _0x4f75e8['outside']
            ? spreadViewportBoundaryPoint(_0x4f75e8, _0x4ce110, _0x587ddf)
            : _0x2619a1;
        ((_0x2a061d['style']['transform'] = 'translate(' + _0x5c1c35['x'] + 'px, ' + _0x5c1c35['y'] + 'px)'),
          _0x2a061d['style']['setProperty']('--member-color', _0x4de327),
          _0x2a061d['style']['setProperty']('--member-direction', _0x4f75e8['angle'] + 'deg'),
          _0x2a061d['classList']['toggle']('is-offscreen', _0x4f75e8['outside']),
          _0x2a061d['classList']['toggle'](
            'is-right',
            _0x5c1c35['x'] > _0x4ce110['left'] + _0x4ce110['width'] / 0x2,
          ),
          _0x2a061d['classList']['toggle'](
            'is-bottom',
            _0x5c1c35['y'] > _0x4ce110['top'] + _0x4ce110['height'] - 0x3c,
          ));
        const _0x1518d3 = _0x2a061d['querySelector']('.collaboration-cursor-name');
        if (_0x1518d3['textContent'] !== _0x31d780['name']) _0x1518d3['textContent'] = _0x31d780['name'];
        ((_0x2a061d['dataset']['member'] = _0x31d780['name']),
          (_0x2a061d['dataset']['actorId'] = _0x31d780['actorId']),
          _0x2a061d['setAttribute']('role', 'button'),
          (_0x2a061d['tabIndex'] = _0x4f75e8['outside'] && _0x2b9a01 ? 0x0 : -0x1),
          _0x2a061d['setAttribute']('aria-label', '定位\x20' + _0x31d780['name']),
          (_0x2a061d['hidden'] = _0x4f75e8['outside'] && !_0x2b9a01));
      }
      const _0xfa0bae = new Set(_0x391e8e?.['editingPending'] || []);
      for (const _0x3ead95 of _0x3cec12['keys']())
        if (!_0xfa0bae['has'](_0x3ead95)) _0x3cec12['delete'](_0x3ead95);
      for (const _0x61087a of _0xfa0bae) {
        if (!_0x3cec12['has'](_0x61087a)) _0x3cec12['set'](_0x61087a, Date['now']());
        if (Date['now']() - _0x3cec12['get'](_0x61087a) < 0xc8) continue;
        const _0x38d18c = readNodeGeometryPreview(_0x61087a, _0x2c34e3['getStateRaw']()['nodes'][_0x61087a]);
        if (_0x38d18c !== _0x2c34e3['getStateRaw']()['nodes'][_0x61087a]) continue;
        if (!_0x38d18c) continue;
        const _0x59db0a = _0x1ce377(
            'editing:' + _0x61087a,
            'collaboration-media-status collaboration-feedback is-pending',
          ),
          _0xc36d35 = worldToScreen(_0x38d18c['x'], _0x38d18c['y'], _0x167e57);
        ((_0x59db0a['style']['transform'] = 'translate(' + _0xc36d35['x'] + 'px, ' + _0xc36d35['y'] + 'px)'),
          (_0x59db0a['textContent'] = '正在获取编辑权限…'),
          _0x59db0a['setAttribute']('role', 'status'));
      }
      (drawCollaborationMediaStatus({
        state: _0x391e8e,
        nodes: _0x2c34e3['getStateRaw']()['nodes'],
        viewport: _0x167e57,
        bounds: _0x4ce110,
        entryFor: _0x1ce377,
        getSession: _0x4179c7,
        documentObject: documentObject,
      }),
        drawComments({
          state: _0x391e8e,
          nodes: _0x2c34e3['getStateRaw']()['nodes'],
          selected: _0x2c34e3['getStateRaw']()['selectedNodeIds'],
          viewport: _0x167e57,
          bounds: _0x4ce110,
          entryFor: _0x1ce377,
        }));
      for (const [_0x49784b, _0x46361d] of _0x423fba)
        !_0x2c3032['has'](_0x49784b) && (_0x46361d['remove'](), _0x423fba['delete'](_0x49784b));
      if (_0xfa0bae['size'] || _0x260685['active']())
        _0x1520b4 = setTimeout(() => {
          if (!_0x2d17c1 && !_0x65f52) _0x65f52 = windowObject['requestAnimationFrame'](_0x100761);
        }, 0xc8);
    },
    _0x4e0b44 = () => {
      if (_0x2d17c1) return;
      const _0x5e5533 = _0x3b3816(),
        _0x438fa3 = _0x305b3d();
      _0x4179c7()?.['setPresence']({
        ...(_0x13379b ? screenToWorld(_0x13379b['x'], _0x13379b['y'], _0x5e5533) : {}),
        view: {
          ...screenToWorld(
            _0x438fa3['left'] + _0x438fa3['width'] / 0x2,
            _0x438fa3['top'] + _0x438fa3['height'] / 0x2,
            _0x5e5533,
          ),
          zoom: _0x5e5533['zoom'],
        },
        selected: [...(_0x2c34e3['getStateRaw']()['selectedNodeIds'] || [])],
      });
      if (!_0x65f52) _0x65f52 = windowObject['requestAnimationFrame'](_0x100761);
    },
    _0x29fc2d = subscribeCollaborationPreferences((_0x11bb27) => {
      ((_0x2b9a01 = _0x11bb27), _0x4e0b44());
    }),
    _0x4d5460 = subscribeNodeGeometryPreview(() => {
      if (!_0x2d17c1 && !_0x65f52) _0x65f52 = windowObject['requestAnimationFrame'](_0x100761);
    }),
    _0x9ca7b6 = new windowObject['MutationObserver'](_0x21baac);
  (_0x9ca7b6['observe'](documentObject['documentElement'], {
    attributes: !![],
    attributeFilter: ['style', 'class'],
  }),
    _0x21baac(),
    windowObject['addEventListener']('resize', _0x4e0b44),
    windowObject['addEventListener'](VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0x4e0b44));
  const _0x1e7a1c = (_0x425e02) => {
    if (!_0x425e02['target']['closest']?.('.v2-canvas-stage')) return;
    ((_0x13379b = { x: _0x425e02['clientX'], y: _0x425e02['clientY'] }),
      _0x4179c7()?.['setPresence'](screenToWorld(_0x13379b['x'], _0x13379b['y'], _0x3b3816())));
  };
  documentObject['addEventListener']('pointermove', _0x1e7a1c, { passive: !![] });
  const _0x48e4ad = (_0x2658d7) => {
      if (
        _0x2658d7['type'] === 'keydown' &&
        ['Shift', 'Control', 'Alt', 'Meta']['includes'](_0x2658d7['key'])
      )
        return;
      const _0x4e3ea2 =
        _0x2658d7['target']['closest']?.('.v2-canvas-stage, [data-node-id]') ||
        (_0x2658d7['type'] === 'keydown' && _0x2658d7['target'] === documentObject['body']);
      if (_0x4e3ea2 && _0x4179c7()?.['state']['followActorId']) _0x4179c7()['follow']('');
    },
    _0x5cc87d = ['pointerdown', 'wheel', 'keydown'];
  for (const _0x3b695f of _0x5cc87d)
    documentObject['addEventListener'](_0x3b695f, _0x48e4ad, { capture: !![], passive: !![] });
  const _0x2d6630 = _0x2c34e3['subscribeSelector'](
    (_0x581790) =>
      [
        _0x581790['_nodesRev'],
        _0x581790['viewport']['x'],
        _0x581790['viewport']['y'],
        _0x581790['viewport']['zoom'],
        _0x581790['viewport']['_screenOriginX'],
        _0x581790['viewport']['_screenOriginY'],
        ...(_0x581790['selectedNodeIds'] || []),
      ]['join'](':'),
    _0x4e0b44,
  );
  return {
    redraw: _0x4e0b44,
    destroy() {
      ((_0x2d17c1 = !![]),
        clearTimeout(_0x1520b4),
        _0x260685['clear'](),
        _0x2d6630(),
        _0x29fc2d(),
        _0x4d5460(),
        _0x9ca7b6['disconnect'](),
        windowObject['removeEventListener']('resize', _0x4e0b44),
        windowObject['removeEventListener'](VIEWPORT_PAN_PREVIEW_FRAME_EVENT, _0x4e0b44),
        documentObject['removeEventListener']('pointermove', _0x1e7a1c));
      for (const _0x5dea3a of _0x5cc87d) documentObject['removeEventListener'](_0x5dea3a, _0x48e4ad, !![]);
      if (_0x65f52) windowObject['cancelAnimationFrame'](_0x65f52);
      for (const _0x3a0a62 of _0x423fba['values']()) _0x3a0a62['remove']();
      (_0x423fba['clear'](), _0x30aad7['remove']());
    },
  };
}
