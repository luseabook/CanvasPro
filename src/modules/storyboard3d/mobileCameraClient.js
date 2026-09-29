import { publishDirectorMobilePose } from '../../../api/directorMobileClientApi.js';
const token = location['hash']['slice'](0x1),
  status = document['querySelector']('#status'),
  look = document['querySelector']('#look');
let translation = [0x0, 0x0, 0x0],
  rotation = [0x0, 0x0, 0x0],
  origin = null,
  dirty = !![],
  sequence = Date['now'](),
  sending = ![];
const radians = (_0x17e020) => ((Number(_0x17e020) || 0x0) * Math['PI']) / 0xb4,
  wrapped = (_0x1ec7c3) => Math['atan2'](Math['sin'](_0x1ec7c3), Math['cos'](_0x1ec7c3));
(document['querySelectorAll']('[data-move]')['forEach']((_0x9a3a98) =>
  _0x9a3a98['addEventListener']('click', () => {
    const [_0x235d90, _0xbef028] = _0x9a3a98['dataset']['move']['split'](',')['map'](Number);
    ((translation[_0x235d90] = Math['max'](-0x64, Math['min'](0x64, translation[_0x235d90] + _0xbef028))),
      (dirty = !![]));
  }),
),
  document['querySelector']('#reset')['addEventListener']('click', () => {
    ((origin = null), (translation = [0x0, 0x0, 0x0]), (rotation = [0x0, 0x0, 0x0]), (dirty = !![]));
  }));
let gesture = null,
  gyroEnabled = ![];
(look['addEventListener']('keydown', (_0x284d18) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']['includes'](_0x284d18['key'])) return;
  (_0x284d18['preventDefault'](),
    (rotation[_0x284d18['key'] === 'ArrowLeft' || _0x284d18['key'] === 'ArrowRight' ? 0x1 : 0x0] += [
      'ArrowLeft',
      'ArrowUp',
    ]['includes'](_0x284d18['key'])
      ? 0.03
      : -0.03),
    (rotation = rotation['map'](wrapped)),
    (dirty = !![]));
}),
  look['addEventListener']('pointerdown', (_0x2c41d1) => {
    ((gesture = { x: _0x2c41d1['clientX'], y: _0x2c41d1['clientY'], rotation: [...rotation] }),
      look['setPointerCapture'](_0x2c41d1['pointerId']));
  }),
  look['addEventListener']('pointermove', (_0x2d3e63) => {
    if (!gesture) return;
    ((rotation = [
      Math['max'](
        -1.5,
        Math['min'](1.5, gesture['rotation'][0x0] - (_0x2d3e63['clientY'] - gesture['y']) * 0.005),
      ),
      wrapped(gesture['rotation'][0x1] - (_0x2d3e63['clientX'] - gesture['x']) * 0.005),
      gesture['rotation'][0x2],
    ]),
      (dirty = !![]));
  }));
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
  look['addEventListener'](name, () => {
    gesture = null;
  });
document['querySelector']('#gyro')['addEventListener']('click', async () => {
  if (gyroEnabled) return;
  if (!window['isSecureContext']) {
    status['textContent'] = '陀螺仪需要可信 HTTPS 连接；当前可使用触控控制。';
    return;
  }
  try {
    const _0x30b9cd = window['DeviceOrientationEvent'];
    if (!_0x30b9cd) throw new Error('当前设备不支持方向传感器。');
    if (
      typeof _0x30b9cd['requestPermission'] === 'function' &&
      (await _0x30b9cd['requestPermission']()) !== 'granted'
    )
      throw new Error('未获得传感器权限。');
    (window['addEventListener']('deviceorientation', (_0x128f6c) => {
      if (_0x128f6c['alpha'] == null || _0x128f6c['beta'] == null || _0x128f6c['gamma'] == null) return;
      const _0x2d3016 = [
        radians(_0x128f6c['beta']),
        radians(_0x128f6c['alpha']),
        radians(_0x128f6c['gamma']),
      ];
      ((origin ||= _0x2d3016),
        (rotation = _0x2d3016['map']((_0x5bec11, _0x392fc2) => wrapped(_0x5bec11 - origin[_0x392fc2]))),
        (dirty = !![]));
    }),
      (gyroEnabled = !![]),
      (status['textContent'] = '陀螺仪已开启，可重新校准零位。'));
  } catch (_0x49c1be) {
    status['textContent'] = _0x49c1be['message'];
  }
});
const timer = setInterval(async () => {
  if (!dirty || sending || !token) return;
  ((sending = !![]), (dirty = ![]));
  try {
    await publishDirectorMobilePose(token, { translation: translation, rotation: rotation, seq: ++sequence });
  } catch (_0x192fa4) {
    status['textContent'] = _0x192fa4['message'];
  } finally {
    sending = ![];
  }
}, 0x50);
window['addEventListener']('pagehide', () => clearInterval(timer), { once: !![] });
