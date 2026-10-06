import { publishDirectorMobilePose } from '../../../api/directorMobileClientApi.js';
const token = location.hash.slice(1),
  status = document.querySelector('#status'),
  look = document.querySelector('#look');
let translation = [0, 0, 0],
  rotation = [0, 0, 0],
  origin = null,
  dirty = true,
  sequence = Date.now(),
  sending = false;
const radians = (value) => ((Number(value) || 0) * Math.PI) / 180,
  wrapped = (item) => Math.atan2(Math.sin(item), Math.cos(item));
(document.querySelectorAll('[data-move]').forEach((el) =>
  el.addEventListener('click', () => {
    const [key, index] = el.dataset.move.split(',').map(Number);
    ((translation[key] = Math.max(-100, Math.min(100, translation[key] + index))), (dirty = true));
  }),
),
  document.querySelector('#reset').addEventListener('click', () => {
    ((origin = null), (translation = [0, 0, 0]), (rotation = [0, 0, 0]), (dirty = true));
  }));
let gesture = null,
  gyroEnabled = false;
(look.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  (event.preventDefault(),
    (rotation[event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? 1 : 0] += [
      'ArrowLeft',
      'ArrowUp',
    ].includes(event.key)
      ? 0.03
      : -0.03),
    (rotation = rotation.map(wrapped)),
    (dirty = true));
}),
  look.addEventListener('pointerdown', (x) => {
    ((gesture = { x: x.clientX, y: x.clientY, rotation: [...rotation] }),
      look.setPointerCapture(x.pointerId));
  }),
  look.addEventListener('pointermove', (event2) => {
    if (!gesture) return;
    ((rotation = [
      Math.max(
        -1.5,
        Math.min(1.5, gesture.rotation[0] - (event2.clientY - gesture.y) * 0.005),
      ),
      wrapped(gesture.rotation[1] - (event2.clientX - gesture.x) * 0.005),
      gesture.rotation[2],
    ]),
      (dirty = true));
  }));
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'])
  look.addEventListener(name, () => {
    gesture = null;
  });
document.querySelector('#gyro').addEventListener('click', async () => {
  if (gyroEnabled) return;
  if (!window.isSecureContext) {
    status.textContent = '陀螺仪需要可信 HTTPS 连接；当前可使用触控控制。';
    return;
  }
  try {
    const enabled = window.DeviceOrientationEvent;
    if (!enabled) throw new Error('当前设备不支持方向传感器。');
    if (
      typeof enabled.requestPermission === 'function' &&
      (await enabled.requestPermission()) !== 'granted'
    )
      throw new Error('未获得传感器权限。');
    (window.addEventListener('deviceorientation', (result) => {
      if (result.alpha == null || result.beta == null || result.gamma == null) return;
      const list = [radians(result.beta), radians(result.alpha), radians(result.gamma)];
      ((origin ||= list),
        (rotation = list.map((data, options) => wrapped(data - origin[options]))),
        (dirty = true));
    }),
      (gyroEnabled = true),
      (status.textContent = '陀螺仪已开启，可重新校准零位。'));
  } catch (error) {
    status.textContent = error.message;
  }
});
const timer = setInterval(async () => {
  if (!dirty || sending || !token) return;
  ((sending = true), (dirty = false));
  try {
    await publishDirectorMobilePose(token, { translation: translation, rotation: rotation, seq: ++sequence });
  } catch (error2) {
    status.textContent = error2.message;
  } finally {
    sending = false;
  }
}, 80);
window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
