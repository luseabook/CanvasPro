import { t } from '../../../i18n/index.js';
function videoToolbarText(_0x2524c4, _0x49dbbe = {}) {
  return t('nodeToolbar.video.' + _0x2524c4, _0x49dbbe);
}
export function bindVideoSmartClipAction(_0x34bcb1) {
  const {
      toolbarEl: _0x2cd2ee,
      nodeData: _0x56a477,
      store: _0x4fc964,
      findAvailablePosition: _0x3af376,
      detectScenes: _0x161410,
      getNodeSpawnPrefs: _0x17feef,
      buildSourceMediaNodePayload: _0x14bd8b,
      getAutoMediaSizeByShortSide: _0x1b16d5,
      _getLatestNodeData: _0x1582a2,
    } = _0x34bcb1,
    _0x1c739a = _0x2cd2ee.querySelector('.act-smart-clip');
  _0x1c739a &&
    _0x1c739a.addEventListener('click', async (_0x250289) => {
      _0x250289.stopPropagation();
      const _0x2a3311 = _0x1582a2(),
        _0x5f000f = _0x2a3311.src || _0x2a3311.videoUrl;
      if (!_0x5f000f) {
        window.showToast?.(videoToolbarText('invalidVideoSource'), 'error');
        return;
      }
      const _0x5ea1ca = _0x1c739a.querySelector('svg');
      if (_0x5ea1ca) _0x5ea1ca.classList.add('v2-spinning');
      try {
        window.showToast?.(videoToolbarText('analyzingScenes'), 'info');
        const _0x453d9a = await _0x161410({ videoUrl: _0x5f000f, provider: 'grsai', sensitivity: 0.5 });
        if (_0x453d9a.sceneCount <= 1) {
          window.showToast?.(videoToolbarText('extractNoSegments'), 'info');
          return;
        }
        const { direction: _0x54e986, spacing: _0x2c26f6, avoidOverlap: _0x2d8700 } = _0x17feef(),
          _0x2e1877 = _0x4fc964.getState().nodes[_0x56a477.id];
        if (!_0x2e1877) {
          window.showToast?.(videoToolbarText('sourceNodeMissing'), 'error');
          return;
        }
        const _0x28c132 = [];
        let _0x4ca735 = 0;
        for (let _0x419b8f = 0; _0x419b8f < _0x453d9a.sceneCount; _0x419b8f++) {
          const _0x2601a7 =
              _0x419b8f < _0x453d9a.sceneChanges.length ? _0x453d9a.sceneChanges[_0x419b8f] : 100,
            _0x159bac = _0x54e986 === 'down' ? 'down' : 'right',
            _0x2544ad = Number(_0x2e1877.x) || 0,
            _0x2df62f = Number(_0x2e1877.y) || 0,
            _0x490dd1 = Number(_0x2e1877.width) || 0x200,
            _0x4ca461 = Number(_0x2e1877.height) || 0x120,
            _0x312fc5 = _0x1b16d5(_0x490dd1, _0x4ca461),
            _0x4feae5 = _0x2544ad + _0x490dd1 + _0x2c26f6,
            _0x37e434 =
              _0x159bac === 'down'
                ? _0x2df62f + _0x4ca461 + _0x2c26f6 * (_0x419b8f + 1)
                : _0x2df62f + Math.round((_0x4ca461 - _0x312fc5.height) / 2),
            _0x2035a8 = _0x2d8700
              ? _0x3af376(
                  _0x4fc964.getState().nodes || {},
                  _0x4feae5,
                  _0x37e434,
                  _0x312fc5.width,
                  _0x312fc5.height,
                  _0x2c26f6,
                  _0x159bac,
                )
              : { x: _0x4feae5, y: _0x37e434 },
            _0x4acb5d =
              'source-video-scene-' +
              Date.now() +
              '-' +
              _0x419b8f +
              '-' +
              Math.random().toString(36).slice(2, 6);
          (_0x4fc964.addNode(
            _0x14bd8b({
              id: _0x4acb5d,
              type: 'source-video',
              name: videoToolbarText('sceneNodeName', { index: _0x419b8f + 1 }),
              src: _0x2a3311.src,
              localPath: _0x2a3311.localPath,
              clipStart: _0x4ca735,
              clipEnd: _0x2601a7,
              x: _0x2035a8.x,
              y: _0x2035a8.y,
              width: _0x312fc5.width,
              height: _0x312fc5.height,
              needsAutoResize: false,
            }),
          ),
            _0x28c132.push(_0x4acb5d),
            (_0x4ca735 = _0x2601a7));
        }
        _0x28c132.length > 0 &&
          (_0x4fc964.setSelectedNodes(_0x28c132),
          window.v2FocusOnNodes && window.v2FocusOnNodes([_0x2e1877.id, ..._0x28c132]),
          window.showToast?.(videoToolbarText('sceneNodesCreated', { count: _0x28c132.length }), 'success'));
      } catch (_0x18c4b5) {
        (console.error('智能剪辑失败:', _0x18c4b5),
          window.showToast?.(videoToolbarText('smartClipFailedRetry'), 'error'));
      } finally {
        if (_0x5ea1ca) _0x5ea1ca.classList.remove('v2-spinning');
      }
    });
}
