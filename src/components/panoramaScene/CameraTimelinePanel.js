import { normalizeCameraTimeline } from '../../modules/panoramaSceneNode/cameraTimeline.js';
import { t } from '../../i18n/index.js';
function sceneText(_0x2fcf99, _0x445c1c = {}) {
  return t('panoramaSceneNode.cameraTimeline.' + _0x2fcf99, _0x445c1c);
}
function formatTime(_0x433fe8) {
  return Math['max'](0x0, Number(_0x433fe8) || 0x0)['toFixed'](0x2) + 's';
}
function syncStaticText(_0x30bb45, { isPlaying: isPlaying = ![] } = {}) {
  const _0x14611d = _0x30bb45['querySelector']('.panorama-camera-timeline__play');
  _0x14611d &&
    ((_0x14611d['textContent'] = isPlaying ? 'Ⅱ' : '▶'),
    (_0x14611d['title'] = sceneText(isPlaying ? 'pause' : 'play')),
    _0x14611d['setAttribute']('aria-label', sceneText(isPlaying ? 'pauseAria' : 'playAria')));
  const _0x57c451 = _0x30bb45['querySelector']('.panorama-camera-timeline__add');
  _0x57c451 &&
    ((_0x57c451['title'] = sceneText('addKeyframe')),
    _0x57c451['setAttribute']('aria-label', sceneText('addKeyframeAria')));
  const _0x29e01b = _0x30bb45['querySelector']('.panorama-camera-timeline__track');
  if (_0x29e01b) _0x29e01b['setAttribute']('aria-label', sceneText('trackAria'));
  const _0x202a39 = _0x30bb45['querySelector']('.panorama-camera-timeline__duration');
  _0x202a39 &&
    ((_0x202a39['title'] = sceneText('duration')),
    _0x202a39['setAttribute']('aria-label', sceneText('durationAria')));
  const _0x5d2223 = _0x30bb45['querySelector']('.panorama-camera-timeline__fps');
  _0x5d2223 &&
    ((_0x5d2223['title'] = sceneText('fps')), _0x5d2223['setAttribute']('aria-label', sceneText('fpsAria')));
  const _0x30c0c0 = _0x30bb45['querySelector']('.panorama-camera-timeline__loop-text');
  if (_0x30c0c0) _0x30c0c0['textContent'] = sceneText('loop');
}
export function createCameraTimelinePanel({
  onAddKeyframe: _0x114d19,
  onPlayToggle: _0x354684,
  onScrub: _0x31d3be,
  onScrubCommit: _0x35ff0b,
  onDeleteKeyframe: _0x31b27e,
  onSettingsChange: _0x306712,
} = {}) {
  const _0xe8a525 = document['createElement']('div');
  ((_0xe8a525['className'] = 'panorama-camera-timeline'), (_0xe8a525['dataset']['uiStop'] = '1'));
  const _0x29943e = document['createElement']('button');
  ((_0x29943e['type'] = 'button'),
    (_0x29943e['className'] = 'panorama-camera-timeline__icon\x20panorama-camera-timeline__play'));
  const _0x6b72de = document['createElement']('button');
  ((_0x6b72de['type'] = 'button'),
    (_0x6b72de['className'] = 'panorama-camera-timeline__icon\x20panorama-camera-timeline__add'),
    (_0x6b72de['textContent'] = '+'));
  const _0x2a6290 = document['createElement']('output');
  ((_0x2a6290['className'] = 'panorama-camera-timeline__time'), (_0x2a6290['textContent'] = '0.00s'));
  const _0x1bd3c2 = document['createElement']('div');
  _0x1bd3c2['className'] = 'panorama-camera-timeline__track-wrap';
  const _0x1fd6b0 = document['createElement']('input');
  ((_0x1fd6b0['type'] = 'range'),
    (_0x1fd6b0['className'] = 'panorama-camera-timeline__track'),
    (_0x1fd6b0['min'] = '0'),
    (_0x1fd6b0['max'] = '6'),
    (_0x1fd6b0['step'] = '0.01'),
    (_0x1fd6b0['value'] = '0'));
  const _0x48bde7 = document['createElement']('div');
  ((_0x48bde7['className'] = 'panorama-camera-timeline__markers'), _0x1bd3c2['append'](_0x1fd6b0, _0x48bde7));
  const _0x42a15e = document['createElement']('input');
  ((_0x42a15e['type'] = 'number'),
    (_0x42a15e['className'] = 'panorama-camera-timeline__duration'),
    (_0x42a15e['min'] = '0.1'),
    (_0x42a15e['max'] = '3600'),
    (_0x42a15e['step'] = '0.5'),
    (_0x42a15e['value'] = '6'));
  const _0x21a826 = document['createElement']('select');
  ((_0x21a826['className'] = 'panorama-camera-timeline__fps'),
    [0xc, 0x18, 0x19, 0x1e, 0x32, 0x3c]['forEach']((_0x5e1d8a) => {
      const _0x5c4805 = document['createElement']('option');
      ((_0x5c4805['value'] = String(_0x5e1d8a)),
        (_0x5c4805['textContent'] = _0x5e1d8a + ' FPS'),
        _0x21a826['appendChild'](_0x5c4805));
    }));
  const _0x11c0b7 = document['createElement']('label');
  _0x11c0b7['className'] = 'panorama-camera-timeline__loop';
  const _0x4f7a17 = document['createElement']('input');
  _0x4f7a17['type'] = 'checkbox';
  const _0xad9675 = document['createElement']('span');
  return (
    (_0xad9675['className'] = 'panorama-camera-timeline__loop-text'),
    _0x11c0b7['append'](_0x4f7a17, _0xad9675),
    _0xe8a525['append'](_0x29943e, _0x6b72de, _0x2a6290, _0x1bd3c2, _0x42a15e, _0x21a826, _0x11c0b7),
    _0x29943e['addEventListener']('click', () => _0x354684?.()),
    _0x6b72de['addEventListener']('click', () => _0x114d19?.(Number(_0x1fd6b0['value']) || 0x0)),
    _0x1fd6b0['addEventListener']('input', () => {
      const _0x164731 = Number(_0x1fd6b0['value']) || 0x0;
      ((_0x2a6290['textContent'] = formatTime(_0x164731)), _0x31d3be?.(_0x164731));
    }),
    _0x1fd6b0['addEventListener']('change', () => _0x35ff0b?.(Number(_0x1fd6b0['value']) || 0x0)),
    _0x42a15e['addEventListener']('change', () => {
      _0x306712?.({ duration: Number(_0x42a15e['value']) || 0x6 });
    }),
    _0x21a826['addEventListener']('change', () => {
      _0x306712?.({ fps: Number(_0x21a826['value']) || 0x18 });
    }),
    _0x4f7a17['addEventListener']('change', () => {
      _0x306712?.({ loop: _0x4f7a17['checked'] });
    }),
    _0x48bde7['addEventListener']('click', (_0x3ddfe7) => {
      const _0x49dc72 = _0x3ddfe7['target']?.['closest']?.('[data-keyframe-id]');
      if (!_0x49dc72) return;
      if (_0x3ddfe7['shiftKey']) {
        _0x31b27e?.(_0x49dc72['dataset']['keyframeId']);
        return;
      }
      const _0x21d343 = Number(_0x49dc72['dataset']['keyframeTime']) || 0x0;
      ((_0x1fd6b0['value'] = String(_0x21d343)),
        (_0x2a6290['textContent'] = formatTime(_0x21d343)),
        _0x31d3be?.(_0x21d343));
    }),
    _0x48bde7['addEventListener']('contextmenu', (_0x360247) => {
      const _0x4b5e42 = _0x360247['target']?.['closest']?.('[data-keyframe-id]');
      if (!_0x4b5e42) return;
      (_0x360247['preventDefault'](), _0x31b27e?.(_0x4b5e42['dataset']['keyframeId']));
    }),
    syncStaticText(_0xe8a525),
    _0xe8a525
  );
}
export function renderCameraTimelinePanel(
  _0x1962cf,
  _0x64ffc0,
  { currentTime: _0x14942a, isPlaying: _0x265463 } = {},
) {
  if (!_0x1962cf) return;
  const _0x1c1a61 = normalizeCameraTimeline(_0x64ffc0),
    _0x1e9aca = Math['max'](
      0x0,
      Math['min'](
        _0x1c1a61['duration'],
        Number['isFinite'](_0x14942a) ? _0x14942a : _0x1c1a61['currentTime'],
      ),
    ),
    _0x18906e = _0x1962cf['querySelector']('.panorama-camera-timeline__track');
  _0x18906e &&
    ((_0x18906e['max'] = String(_0x1c1a61['duration'])),
    (_0x18906e['step'] = String(0x1 / _0x1c1a61['fps'])),
    (_0x18906e['value'] = String(_0x1e9aca)));
  const _0x57bdf3 = _0x1962cf['querySelector']('.panorama-camera-timeline__time');
  if (_0x57bdf3) _0x57bdf3['textContent'] = formatTime(_0x1e9aca);
  const _0x5c2ab7 = _0x1962cf['querySelector']('.panorama-camera-timeline__duration');
  if (_0x5c2ab7) _0x5c2ab7['value'] = String(_0x1c1a61['duration']);
  const _0x5746cc = _0x1962cf['querySelector']('.panorama-camera-timeline__fps');
  if (_0x5746cc) _0x5746cc['value'] = String(_0x1c1a61['fps']);
  const _0x57a262 = _0x1962cf['querySelector']('.panorama-camera-timeline__loop input');
  if (_0x57a262) _0x57a262['checked'] = _0x1c1a61['loop'];
  syncStaticText(_0x1962cf, { isPlaying: _0x265463 });
  const _0xab3be5 = _0x1962cf['querySelector']('.panorama-camera-timeline__markers');
  _0xab3be5 &&
    _0xab3be5['replaceChildren'](
      ..._0x1c1a61['keyframes']['map']((_0x427bc1) => {
        const _0x158630 = document['createElement']('button');
        ((_0x158630['type'] = 'button'),
          (_0x158630['className'] = 'panorama-camera-timeline__marker'),
          (_0x158630['dataset']['keyframeId'] = _0x427bc1['id']),
          (_0x158630['dataset']['keyframeTime'] = String(_0x427bc1['time'])));
        const _0x1e9143 = Math['round'](_0x427bc1['time'] * _0x1c1a61['fps']),
          _0x314813 = _0x1c1a61['duration'] > 0x0 ? (_0x427bc1['time'] / _0x1c1a61['duration']) * 0x64 : 0x0;
        return (
          _0x158630['style']['setProperty']('--panorama-keyframe-position', _0x314813 + '%'),
          (_0x158630['title'] = sceneText('keyframeTitle', {
            time: formatTime(_0x427bc1['time']),
            frame: _0x1e9143,
          })),
          _0x158630['setAttribute'](
            'aria-label',
            sceneText('keyframeAria', { time: formatTime(_0x427bc1['time']), frame: _0x1e9143 }),
          ),
          _0x158630['classList']['toggle'](
            'is-current',
            Math['abs'](_0x427bc1['time'] - _0x1e9aca) <= 0.5 / _0x1c1a61['fps'],
          ),
          _0x158630
        );
      }),
    );
}
export function setCameraTimelineDisplayTime(_0x22f7a0, _0xe0cb0) {
  if (!_0x22f7a0) return;
  const _0x598e6b = _0x22f7a0['querySelector']('.panorama-camera-timeline__track'),
    _0xbfbfc3 = _0x22f7a0['querySelector']('.panorama-camera-timeline__time');
  if (_0x598e6b) _0x598e6b['value'] = String(_0xe0cb0);
  if (_0xbfbfc3) _0xbfbfc3['textContent'] = formatTime(_0xe0cb0);
}
