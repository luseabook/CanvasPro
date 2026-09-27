import { createCollaborationJournal } from './collaborationJournal.js';
const KEY = 'aicanvas.collaboration.host-canvases.v1';
export function createCollaborationCanvasBinding({
  storage: _0x5e68ce,
  canvasTabs: _0x530470,
  actorId: _0x2eeff7,
  hosting: hosting = !![],
}) {
  const _0x6b54f2 = hosting ? KEY : 'aicanvas.collaboration.guest-canvases.v1',
    _0x1e24d9 = new Map(),
    _0x319d96 = new Map();
  function _0xa8848(_0x1bcb3b) {
    const _0x6f55d = _0x2eeff7() + ':' + _0x1bcb3b;
    if (!_0x1e24d9['has'](_0x6f55d))
      _0x1e24d9['set'](
        _0x6f55d,
        createCollaborationJournal({
          roomId: _0x1bcb3b,
          actorId: _0x2eeff7(),
          clientId: hosting ? 'host-canvas-baseline' : 'guest-canvas-baseline',
        }),
      );
    return { key: _0x6f55d, store: _0x1e24d9['get'](_0x6f55d) };
  }
  function _0x227d5b() {
    try {
      const _0x354c86 = JSON['parse'](_0x5e68ce?.['getItem'](_0x6b54f2) || '{}');
      return _0x354c86 && typeof _0x354c86 === 'object' && !Array['isArray'](_0x354c86) ? _0x354c86 : {};
    } catch {
      return {};
    }
  }
  function _0x3263e2(_0x1b4b60) {
    return _0x530470['getCanvasProjectContext']?.(_0x1b4b60)?.['projectId'] || '';
  }
  async function _0x318142(_0x51eea9) {
    const _0x2274d2 = _0xa8848(_0x51eea9);
    return _0x319d96['get'](_0x2274d2['key']) || (await _0x2274d2['store']['read']());
  }
  return {
    async baseline(_0x159566) {
      return (await _0x318142(_0x159566))?.['hostBase'] || null;
    },
    async mediaBindings(_0x57919d) {
      return (await _0x318142(_0x57919d))?.['mediaBindings'] || [];
    },
    async checkpoint(_0x461531, _0x33ef76, _0x27fee5 = []) {
      const _0x504858 = _0xa8848(_0x461531),
        _0x2c87ec = structuredClone({ hostBase: _0x33ef76, mediaBindings: _0x27fee5 });
      (_0x319d96['set'](_0x504858['key'], _0x2c87ec), await _0x504858['store']['write'](_0x2c87ec));
    },
    async close() {
      await Promise['all']([..._0x1e24d9['values']()]['map']((_0xaebc77) => _0xaebc77['close']()));
    },
    originalAccess(_0x4b9ccd, _0x2dc154) {
      const _0x4572e8 = _0x227d5b()[_0x2eeff7() + ':' + _0x4b9ccd];
      return _0x4572e8 && Object['hasOwn'](_0x4572e8, 'originalAccess')
        ? _0x4572e8['originalAccess']
        : _0x2dc154;
    },
    remember(_0x11a0db, _0x56e2d7, _0x584e88 = null, _0x531b70 = null) {
      const _0x5db6d0 = _0x227d5b(),
        _0x5b9d11 = _0x2eeff7() + ':' + _0x11a0db;
      (delete _0x5db6d0[_0x5b9d11],
        (_0x5db6d0[_0x5b9d11] = {
          roomId: _0x11a0db,
          canvasId: _0x56e2d7,
          projectId: _0x3263e2(_0x56e2d7),
          originalAccess: _0x584e88,
          resume: _0x531b70,
        }),
        _0x5e68ce?.['setItem'](_0x6b54f2, JSON['stringify'](_0x5db6d0)));
    },
    resumeFor(_0x500d0c) {
      const _0x56f87c = this['roomFor'](_0x500d0c);
      return _0x227d5b()[_0x2eeff7() + ':' + _0x56f87c]?.['resume'] || null;
    },
    forget(_0xc0198a) {
      const _0x3a2b39 = _0x227d5b();
      (delete _0x3a2b39[_0x2eeff7() + ':' + _0xc0198a],
        _0x5e68ce?.['setItem'](_0x6b54f2, JSON['stringify'](_0x3a2b39)));
    },
    roomFor(_0x3dd376, _0x4db29a) {
      const _0x4cfb62 = _0x3263e2(_0x3dd376);
      return Object['entries'](_0x227d5b())
        ['reverse']()
        ['find'](
          ([_0x4a82c7, _0x252b6b]) =>
            _0x4a82c7['startsWith'](_0x2eeff7() + ':') &&
            (!_0x4db29a || _0x4db29a['includes'](_0x252b6b['roomId'])) &&
            ((_0x252b6b['canvasId'] === _0x3dd376 &&
              (!_0x252b6b['projectId'] || _0x252b6b['projectId'] === _0x4cfb62)) ||
              (_0x4cfb62 && _0x252b6b['projectId'] === _0x4cfb62)),
        )?.[0x1]?.['roomId'];
    },
    async activate(_0x3c35e1) {
      const _0x4336f4 = _0x227d5b()[_0x2eeff7() + ':' + _0x3c35e1];
      if (!_0x4336f4) return ![];
      if (
        _0x530470['getActiveCanvasId']() === _0x4336f4['canvasId'] &&
        (!_0x4336f4['projectId'] || _0x3263e2(_0x4336f4['canvasId']) === _0x4336f4['projectId'])
      )
        return !![];
      const _0x2eaef6 = _0x530470['getPersistenceRevisionSnapshot']?.()?.['canvases'] || [],
        _0x2e3b4d =
          _0x2eaef6['find'](
            (_0x27b0ad) =>
              _0x27b0ad['id'] === _0x4336f4['canvasId'] &&
              (!_0x4336f4['projectId'] || _0x3263e2(_0x27b0ad['id']) === _0x4336f4['projectId']),
          ) ||
          (_0x4336f4['projectId'] &&
            _0x2eaef6['find']((_0x446203) => _0x3263e2(_0x446203['id']) === _0x4336f4['projectId']));
      if (!_0x2e3b4d) return ![];
      await _0x530470['switchTo'](_0x2e3b4d['id']);
      if (_0x530470['getActiveCanvasId']() !== _0x2e3b4d['id'])
        throw new Error('无法切换到此房间的原画布，请先完成当前画布的操作');
      return !![];
    },
  };
}
