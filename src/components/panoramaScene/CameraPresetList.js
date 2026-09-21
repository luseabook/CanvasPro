import { t } from '../../i18n/index.js';
function panoramaSceneText(_0x5afc75, _0x36ef78 = {}) {
  return t('panoramaSceneNode.' + _0x5afc75, _0x36ef78);
}
export function createCameraPresetList() {
  const _0x421f32 = document.createElement('div');
  return ((_0x421f32.className = 'panorama-camera-dock'), (_0x421f32.dataset.uiStop = '1'), _0x421f32);
}
function normalizeCameraSlot(_0x13b070) {
  const _0x273ff9 = Number(_0x13b070);
  if (!Number.isInteger(_0x273ff9)) return null;
  if (_0x273ff9 < 1 || _0x273ff9 > 10) return null;
  return _0x273ff9;
}
function resolveCameraSlotEntries(_0x55ac80 = []) {
  const _0x3c079f = Array.isArray(_0x55ac80) ? _0x55ac80 : [],
    _0x356c3e = new Set(),
    _0x5ec1db = [];
  return (
    _0x3c079f.forEach((_0x3c22ea) => {
      const _0x37f13a = normalizeCameraSlot(_0x3c22ea?.slot);
      if (!_0x37f13a || _0x356c3e.has(_0x37f13a)) return;
      (_0x356c3e.add(_0x37f13a), _0x5ec1db.push({ camera: _0x3c22ea, slot: _0x37f13a }));
    }),
    _0x3c079f.forEach((_0x2307e8) => {
      if (_0x5ec1db.some((_0x2e12bf) => _0x2e12bf.camera?.id === _0x2307e8?.id)) return;
      for (let _0x2279a9 = 1; _0x2279a9 <= 10; _0x2279a9 += 1) {
        if (_0x356c3e.has(_0x2279a9)) continue;
        (_0x356c3e.add(_0x2279a9), _0x5ec1db.push({ camera: _0x2307e8, slot: _0x2279a9 }));
        break;
      }
    }),
    _0x5ec1db.sort((_0x21e763, _0x3d7f0d) => _0x21e763.slot - _0x3d7f0d.slot)
  );
}
function createCameraButton(
  _0x39923a,
  _0x29e3dc,
  { onActivate: _0x1c347d, onDelete: _0x53b317, onContextMenu: _0x280a30 } = {},
) {
  const { camera: _0x29c0fe, slot: _0x5c5e28 } = _0x39923a,
    _0x3e4848 = document.createElement('div');
  ((_0x3e4848.className = 'panorama-camera-dock__item'),
    (_0x3e4848.dataset.cameraId = _0x29c0fe.id),
    (_0x3e4848.dataset.cameraSlot = String(_0x5c5e28)),
    (_0x3e4848.tabIndex = 0));
  const _0x23e801 = _0x5c5e28 >= 1 && _0x5c5e28 <= 9,
    _0x2a6d1b = _0x23e801 ? String(_0x5c5e28) : '';
  _0x3e4848.setAttribute(
    'aria-label',
    _0x29c0fe.name || panoramaSceneText('camera.bookmarkAria', { slot: _0x5c5e28 }),
  );
  const _0x4c40a4 = _0x29e3dc?.viewport?.activeCameraId === _0x29c0fe.id,
    _0x1ffdae =
      _0x29e3dc?.selection?.selectedObjectType === 'camera' &&
      _0x29e3dc?.selection?.selectedObjectId === _0x29c0fe.id;
  (_0x4c40a4 || _0x1ffdae) && _0x3e4848.classList.add('is-active');
  const _0x41ca03 = document.createElement('button');
  ((_0x41ca03.type = 'button'),
    (_0x41ca03.className = 'panorama-camera-dock__activate'),
    _0x41ca03.setAttribute('aria-label', _0x3e4848.getAttribute('aria-label') || ''));
  const _0x2ca157 = document.createElement('span');
  ((_0x2ca157.className = 'panorama-camera-dock__number'),
    (_0x2ca157.textContent = _0x2a6d1b),
    _0x41ca03.appendChild(_0x2ca157));
  const _0x530698 = document.createElement('button');
  return (
    (_0x530698.type = 'button'),
    (_0x530698.className = 'panorama-camera-dock__delete'),
    (_0x530698.textContent = '×'),
    (_0x530698.hidden = true),
    _0x530698.setAttribute('aria-label', panoramaSceneText('camera.deleteBookmark')),
    _0x41ca03.appendChild(_0x530698),
    _0x41ca03.addEventListener('click', (_0x4e1ffe) => {
      (_0x4e1ffe.preventDefault(), _0x4e1ffe.stopPropagation(), _0x1c347d?.(_0x29c0fe.id, _0x5c5e28));
    }),
    _0x41ca03.addEventListener('keydown', (_0x2d1f5c) => {
      if (_0x2d1f5c.key !== 'Enter' && _0x2d1f5c.key !== ' ') return;
      (_0x2d1f5c.preventDefault(), _0x2d1f5c.stopPropagation(), _0x1c347d?.(_0x29c0fe.id, _0x5c5e28));
    }),
    _0x3e4848.addEventListener('click', () => _0x1c347d?.(_0x29c0fe.id, _0x5c5e28)),
    _0x3e4848.addEventListener('keydown', (_0x14ff55) => {
      if (_0x14ff55.key !== 'Enter' && _0x14ff55.key !== ' ') return;
      (_0x14ff55.preventDefault(), _0x1c347d?.(_0x29c0fe.id, _0x5c5e28));
    }),
    _0x3e4848.addEventListener('mouseenter', () => {
      _0x530698.hidden = false;
    }),
    _0x3e4848.addEventListener('mouseleave', () => {
      _0x530698.hidden = true;
    }),
    _0x530698.addEventListener('click', (_0x59f787) => {
      (_0x59f787.preventDefault(), _0x59f787.stopPropagation(), _0x53b317?.(_0x29c0fe.id, _0x5c5e28));
    }),
    _0x3e4848.addEventListener('contextmenu', (_0x5f40b3) => {
      (_0x5f40b3.preventDefault(),
        _0x5f40b3.stopPropagation(),
        _0x280a30?.({
          cameraId: _0x29c0fe.id,
          slot: _0x5c5e28,
          clientX: _0x5f40b3.clientX,
          clientY: _0x5f40b3.clientY,
        }));
    }),
    _0x3e4848.appendChild(_0x41ca03),
    _0x3e4848
  );
}
export function renderCameraPresetList(
  _0x1d9103,
  _0x4cded9,
  { onActivate: _0x4b3ac3, onDelete: _0x1aada1, onContextMenu: _0x2cf25d } = {},
) {
  if (!_0x1d9103) return;
  const _0x27b28a = Array.isArray(_0x4cded9?.cameras) ? _0x4cded9.cameras : [],
    _0x3e667d = resolveCameraSlotEntries(_0x27b28a);
  (_0x1d9103.replaceChildren(),
    _0x1d9103.classList.toggle('is-visible', _0x3e667d.length > 0),
    _0x3e667d.forEach((_0x1d416a) => {
      _0x1d9103.appendChild(
        createCameraButton(_0x1d416a, _0x4cded9, {
          onActivate: _0x4b3ac3,
          onDelete: _0x1aada1,
          onContextMenu: _0x2cf25d,
        }),
      );
    }));
}
