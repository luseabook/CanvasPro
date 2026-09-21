import { t } from '../i18n/index.js';
const MIN_SELECTION_SIZE = 8,
  ACTION_BAR_WIDTH = 92,
  ACTION_BAR_HEIGHT = 38,
  ACTION_BAR_MARGIN = 10,
  MAGNIFIER_SIZE = 172,
  MAGNIFIER_SAMPLE_SIZE = 56,
  MAGNIFIER_SCALE = 3,
  RESIZE_HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
function normalizeNumber(_0x334ce0, _0x5f12b = 0) {
  const _0x184417 = Number(_0x334ce0);
  return Number.isFinite(_0x184417) ? _0x184417 : _0x5f12b;
}
function clamp(_0x5e162a, _0x167139, _0x3deeba) {
  return Math.min(Math.max(_0x5e162a, _0x167139), _0x3deeba);
}
function getViewportSize() {
  return {
    width: Math.max(1, normalizeNumber(globalThis.window?.innerWidth, 1)),
    height: Math.max(1, normalizeNumber(globalThis.window?.innerHeight, 1)),
  };
}
function getWindowScreenOrigin() {
  const _0x4b403f = globalThis.window || {};
  return {
    x: normalizeNumber(_0x4b403f.screenX ?? _0x4b403f.screenLeft, 0),
    y: normalizeNumber(_0x4b403f.screenY ?? _0x4b403f.screenTop, 0),
  };
}
function getCssTokenValue(_0x441e36, _0x9d097e = '') {
  const _0x26b302 = globalThis.document,
    _0x27dc69 = String(_0x441e36 || '').trim();
  if (!_0x26b302?.documentElement || !_0x27dc69) return _0x9d097e;
  const _0x2b0316 = globalThis
    .getComputedStyle?.(_0x26b302.documentElement)
    ?.getPropertyValue(_0x27dc69)
    ?.trim();
  return _0x2b0316 || _0x9d097e;
}
function normalizeRect(_0xf8d555) {
  const _0x410557 = normalizeNumber(_0xf8d555?.left, 0),
    _0x30531d = normalizeNumber(_0xf8d555?.top, 0),
    _0x4dfa25 = Math.max(0, normalizeNumber(_0xf8d555?.width, 0)),
    _0x28b82b = Math.max(0, normalizeNumber(_0xf8d555?.height, 0));
  return { left: _0x410557, top: _0x30531d, width: _0x4dfa25, height: _0x28b82b };
}
function rectFromPoints(_0x495b5d, _0x3d0a81) {
  return normalizeRect({
    left: Math.min(_0x495b5d.x, _0x3d0a81.x),
    top: Math.min(_0x495b5d.y, _0x3d0a81.y),
    width: Math.abs(_0x3d0a81.x - _0x495b5d.x),
    height: Math.abs(_0x3d0a81.y - _0x495b5d.y),
  });
}
function clampRectToViewport(_0x29b245) {
  const _0xdae2fb = getViewportSize(),
    _0x1e493e = Math.min(Math.max(MIN_SELECTION_SIZE, _0x29b245.width), _0xdae2fb.width),
    _0x30db25 = Math.min(Math.max(MIN_SELECTION_SIZE, _0x29b245.height), _0xdae2fb.height);
  return {
    left: clamp(_0x29b245.left, 0, Math.max(0, _0xdae2fb.width - _0x1e493e)),
    top: clamp(_0x29b245.top, 0, Math.max(0, _0xdae2fb.height - _0x30db25)),
    width: _0x1e493e,
    height: _0x30db25,
  };
}
function applySelectionRect(_0x1c4ffb, _0x2d2d3b) {
  const _0x130fce = normalizeRect(_0x2d2d3b);
  return (
    (_0x1c4ffb.style.left = _0x130fce.left + 'px'),
    (_0x1c4ffb.style.top = _0x130fce.top + 'px'),
    (_0x1c4ffb.style.width = _0x130fce.width + 'px'),
    (_0x1c4ffb.style.height = _0x130fce.height + 'px'),
    _0x1c4ffb.classList.add('is-active'),
    _0x130fce
  );
}
function positionActionBar(_0x4e0f61, _0x5d2d17) {
  const _0x4f6818 = getViewportSize(),
    _0x2e19d6 = Math.min(
      Math.max(ACTION_BAR_MARGIN, _0x5d2d17.left + _0x5d2d17.width - ACTION_BAR_WIDTH),
      Math.max(ACTION_BAR_MARGIN, _0x4f6818.width - ACTION_BAR_WIDTH - ACTION_BAR_MARGIN),
    ),
    _0x178b8e = _0x5d2d17.top + _0x5d2d17.height + ACTION_BAR_MARGIN,
    _0xa85d07 =
      _0x178b8e + ACTION_BAR_HEIGHT <= _0x4f6818.height - ACTION_BAR_MARGIN
        ? _0x178b8e
        : Math.max(ACTION_BAR_MARGIN, _0x5d2d17.top - ACTION_BAR_HEIGHT - ACTION_BAR_MARGIN);
  ((_0x4e0f61.style.left = _0x2e19d6 + 'px'), (_0x4e0f61.style.top = _0xa85d07 + 'px'));
}
function positionMagnifier(_0x2526c2, _0xa55932, _0x16a852) {
  const _0x13a96c = getViewportSize(),
    _0x5cc3f7 = 18;
  let _0x2f80ac = _0xa55932 + _0x5cc3f7,
    _0x578743 = _0x16a852 + _0x5cc3f7;
  (_0x2f80ac + MAGNIFIER_SIZE > _0x13a96c.width - 8 && (_0x2f80ac = _0xa55932 - MAGNIFIER_SIZE - _0x5cc3f7),
    _0x578743 + MAGNIFIER_SIZE > _0x13a96c.height - 8 && (_0x578743 = _0x16a852 - MAGNIFIER_SIZE - _0x5cc3f7),
    (_0x2526c2.style.left = clamp(_0x2f80ac, 8, Math.max(8, _0x13a96c.width - MAGNIFIER_SIZE - 8)) + 'px'),
    (_0x2526c2.style.top = clamp(_0x578743, 8, Math.max(8, _0x13a96c.height - MAGNIFIER_SIZE - 8)) + 'px'));
}
function loadImage(_0x45c728) {
  return new Promise((_0x240703, _0x1989a3) => {
    const _0x5ac4f4 = new Image();
    ((_0x5ac4f4.onload = () => _0x240703(_0x5ac4f4)),
      (_0x5ac4f4.onerror = () => _0x1989a3(new Error('screenshot image failed to load'))),
      (_0x5ac4f4.src = _0x45c728));
  });
}
function canvasToBlob(_0x1df9e4) {
  return new Promise((_0x337f6f) => {
    _0x1df9e4.toBlob((_0x2b168e) => _0x337f6f(_0x2b168e), 'image/png');
  });
}
function mapClientPointToImage(_0x4f602e, _0x296a2d, _0x5b69bd, _0xbfc20a) {
  const _0x3b307e = _0x4f602e.display || {},
    _0x4bb839 = _0x3b307e.bounds || {},
    _0x4a575a = _0x3b307e.imageSize || {},
    _0x5030fa = normalizeNumber(_0x4a575a.width, _0x296a2d.naturalWidth || _0x296a2d.width),
    _0x1a0a52 = normalizeNumber(_0x4a575a.height, _0x296a2d.naturalHeight || _0x296a2d.height),
    _0x5e3644 = _0x5030fa / Math.max(1, normalizeNumber(_0x4bb839.width, globalThis.window?.innerWidth || 1)),
    _0x4ddd2c =
      _0x1a0a52 / Math.max(1, normalizeNumber(_0x4bb839.height, globalThis.window?.innerHeight || 1)),
    _0x420383 = getWindowScreenOrigin(),
    _0x56a6e8 = Math.round((_0x420383.x + _0x5b69bd - normalizeNumber(_0x4bb839.x, 0)) * _0x5e3644),
    _0x37c771 = Math.round((_0x420383.y + _0xbfc20a - normalizeNumber(_0x4bb839.y, 0)) * _0x4ddd2c);
  return {
    x: clamp(_0x56a6e8, 0, Math.max(0, _0x5030fa - 1)),
    y: clamp(_0x37c771, 0, Math.max(0, _0x1a0a52 - 1)),
    screenX: Math.round(_0x420383.x + _0x5b69bd),
    screenY: Math.round(_0x420383.y + _0xbfc20a),
  };
}
async function cropScreenshotToBlob(_0x385f2e, _0x52344b, _0x350d12 = null) {
  const _0x2f3ff1 = _0x350d12 || (await loadImage(_0x385f2e.dataUrl)),
    _0x600397 = mapClientPointToImage(_0x385f2e, _0x2f3ff1, _0x52344b.left, _0x52344b.top),
    _0x223e4c = mapClientPointToImage(
      _0x385f2e,
      _0x2f3ff1,
      _0x52344b.left + _0x52344b.width,
      _0x52344b.top + _0x52344b.height,
    ),
    _0x42bb88 = _0x600397.x,
    _0x32add4 = _0x600397.y,
    _0x4c5eee = Math.max(1, _0x223e4c.x - _0x600397.x),
    _0x575f38 = Math.max(1, _0x223e4c.y - _0x600397.y),
    _0x55abd0 = document.createElement('canvas');
  ((_0x55abd0.width = _0x4c5eee), (_0x55abd0.height = _0x575f38));
  const _0x523adc = _0x55abd0.getContext('2d');
  if (!_0x523adc) return null;
  return (
    _0x523adc.drawImage(_0x2f3ff1, _0x42bb88, _0x32add4, _0x4c5eee, _0x575f38, 0, 0, _0x4c5eee, _0x575f38),
    await canvasToBlob(_0x55abd0)
  );
}
function getPixelRgb(_0x46b082, _0x1555e1) {
  const _0x2ea516 = document.createElement('canvas');
  ((_0x2ea516.width = 1), (_0x2ea516.height = 1));
  const _0x383e5a = _0x2ea516.getContext('2d', { willReadFrequently: true });
  if (!_0x383e5a) return [0, 0, 0];
  return (
    _0x383e5a.drawImage(_0x46b082, _0x1555e1.x, _0x1555e1.y, 1, 1, 0, 0, 1, 1),
    Array.from(_0x383e5a.getImageData(0, 0, 1, 1).data.slice(0, 3))
  );
}
function drawMagnifier({
  magnifier: _0x18f394,
  canvas: _0x4c648e,
  meta: _0x3d8265,
  image: _0x5d3a4c,
  capture: _0x352991,
  event: _0x272796,
}) {
  if (!_0x5d3a4c) return;
  const _0x19eafd = mapClientPointToImage(_0x352991, _0x5d3a4c, _0x272796.clientX, _0x272796.clientY),
    _0x236133 = _0x4c648e.getContext('2d');
  if (!_0x236133) return;
  const _0x5550c5 = MAGNIFIER_SAMPLE_SIZE,
    _0x4c0790 = Math.floor(_0x5550c5 / 2),
    _0x5ce3da = clamp(
      _0x19eafd.x - _0x4c0790,
      0,
      Math.max(0, (_0x5d3a4c.naturalWidth || _0x5d3a4c.width) - _0x5550c5),
    ),
    _0x2e0687 = clamp(
      _0x19eafd.y - _0x4c0790,
      0,
      Math.max(0, (_0x5d3a4c.naturalHeight || _0x5d3a4c.height) - _0x5550c5),
    ),
    _0x50472b = _0x5550c5 * MAGNIFIER_SCALE;
  ((_0x236133.imageSmoothingEnabled = false),
    _0x236133.clearRect(0, 0, _0x4c648e.width, _0x4c648e.height),
    _0x236133.drawImage(_0x5d3a4c, _0x5ce3da, _0x2e0687, _0x5550c5, _0x5550c5, 0, 0, _0x50472b, _0x50472b));
  const _0x4ecad7 = Math.floor(_0x50472b / 2);
  ((_0x236133.strokeStyle = getCssTokenValue('--green', 'limegreen')),
    (_0x236133.lineWidth = 1),
    _0x236133.beginPath(),
    _0x236133.moveTo(_0x4ecad7, 0),
    _0x236133.lineTo(_0x4ecad7, _0x50472b),
    _0x236133.moveTo(0, _0x4ecad7),
    _0x236133.lineTo(_0x50472b, _0x4ecad7),
    _0x236133.stroke());
  const [_0x17c1f0, _0x531059, _0x1a0056] = getPixelRgb(_0x5d3a4c, _0x19eafd);
  ((_0x3d8265.textContent =
    'POS: (' +
    _0x19eafd.screenX +
    ', ' +
    _0x19eafd.screenY +
    ')\nRGB: (' +
    _0x17c1f0 +
    ',' +
    _0x531059 +
    ',' +
    _0x1a0056 +
    ')'),
    positionMagnifier(_0x18f394, _0x272796.clientX, _0x272796.clientY));
}
function buildResizeHandles() {
  return RESIZE_HANDLES.map((_0x5c10af) => {
    const _0x98c860 = document.createElement('div');
    return (
      (_0x98c860.className = 'canvas-screenshot-handle canvas-screenshot-handle--' + _0x5c10af),
      (_0x98c860.dataset.handle = _0x5c10af),
      _0x98c860
    );
  });
}
function resizeRectFromHandle(_0x45e885, _0x1f0865, _0xd3e485, _0x1af317) {
  let _0x1b9285 = _0x45e885.left,
    _0x40e43a = _0x45e885.top,
    _0x5505fe = _0x45e885.width,
    _0x6fcd3d = _0x45e885.height;
  _0x1f0865.includes('w') &&
    ((_0x1b9285 = _0x45e885.left + _0xd3e485), (_0x5505fe = _0x45e885.width - _0xd3e485));
  _0x1f0865.includes('e') && (_0x5505fe = _0x45e885.width + _0xd3e485);
  _0x1f0865.includes('n') &&
    ((_0x40e43a = _0x45e885.top + _0x1af317), (_0x6fcd3d = _0x45e885.height - _0x1af317));
  _0x1f0865.includes('s') && (_0x6fcd3d = _0x45e885.height + _0x1af317);
  const _0x15421d = _0x45e885.left + _0x45e885.width,
    _0x5e06be = _0x45e885.top + _0x45e885.height;
  if (_0x5505fe < MIN_SELECTION_SIZE) {
    if (_0x1f0865.includes('w')) _0x1b9285 = _0x15421d - MIN_SELECTION_SIZE;
    _0x5505fe = MIN_SELECTION_SIZE;
  }
  if (_0x6fcd3d < MIN_SELECTION_SIZE) {
    if (_0x1f0865.includes('n')) _0x40e43a = _0x5e06be - MIN_SELECTION_SIZE;
    _0x6fcd3d = MIN_SELECTION_SIZE;
  }
  return clampRectToViewport({ left: _0x1b9285, top: _0x40e43a, width: _0x5505fe, height: _0x6fcd3d });
}
function removeOverlay(_0xce2f) {
  _0xce2f?.remove?.();
}
export async function startCanvasScreenshot({
  createImageNodeFromBlob: _0x4c0bfd,
  showToast: _0x1248f3,
} = {}) {
  const _0xa48029 = globalThis.window?.electronAPI?.screenshot;
  if (typeof _0xa48029?.captureDisplay !== 'function')
    return (_0x1248f3?.(t('canvasScreenshot.unsupported'), 'warn'), false);
  if (typeof _0x4c0bfd !== 'function')
    return (_0x1248f3?.(t('canvasScreenshot.entryNotReady'), 'error'), false);
  let _0x4b380e = null;
  try {
    _0x4b380e = await _0xa48029.captureDisplay();
  } catch {
    _0x4b380e = null;
  }
  if (!_0x4b380e?.ok || !_0x4b380e.dataUrl)
    return (_0x1248f3?.(t('canvasScreenshot.captureFailed'), 'error'), false);
  const _0x78d3d6 = document.createElement('div');
  ((_0x78d3d6.className = 'canvas-screenshot-overlay is-idle'), (_0x78d3d6.tabIndex = -1));
  const _0x34150e = document.createElement('div');
  _0x34150e.className = 'canvas-screenshot-backdrop';
  const _0x1f930b = document.createElement('div');
  ((_0x1f930b.className = 'canvas-screenshot-hint'),
    (_0x1f930b.textContent = t('canvasScreenshot.hints.selectArea')));
  const _0x19daa1 = document.createElement('div');
  ((_0x19daa1.className = 'canvas-screenshot-selection'), _0x19daa1.append(...buildResizeHandles()));
  const _0x2d0cf0 = document.createElement('div');
  _0x2d0cf0.className = 'canvas-screenshot-actions';
  const _0x236acb = document.createElement('button');
  ((_0x236acb.type = 'button'),
    (_0x236acb.className = 'canvas-screenshot-action canvas-screenshot-action--confirm'),
    _0x236acb.setAttribute('aria-label', t('canvasScreenshot.confirmAria')),
    (_0x236acb.textContent = '✓'));
  const _0x5973f6 = document.createElement('button');
  ((_0x5973f6.type = 'button'),
    (_0x5973f6.className = 'canvas-screenshot-action canvas-screenshot-action--cancel'),
    _0x5973f6.setAttribute('aria-label', t('canvasScreenshot.cancelAria')),
    (_0x5973f6.textContent = '×'),
    _0x2d0cf0.append(_0x236acb, _0x5973f6));
  const _0x40e770 = document.createElement('div');
  _0x40e770.className = 'canvas-screenshot-magnifier';
  const _0x42975c = document.createElement('canvas');
  ((_0x42975c.width = MAGNIFIER_SAMPLE_SIZE * MAGNIFIER_SCALE),
    (_0x42975c.height = MAGNIFIER_SAMPLE_SIZE * MAGNIFIER_SCALE));
  const _0x23035a = document.createElement('div');
  ((_0x23035a.className = 'canvas-screenshot-magnifier-meta'),
    _0x40e770.append(_0x42975c, _0x23035a),
    _0x78d3d6.append(_0x34150e, _0x1f930b, _0x19daa1, _0x2d0cf0, _0x40e770),
    document.body.appendChild(_0x78d3d6),
    _0x78d3d6.focus?.());
  let _0x9d7f6 = 'idle',
    _0x22d9eb = null,
    _0x2cbb24 = null,
    _0xa22426 = null,
    _0x36817a = false,
    _0x2b8882 = null;
  const _0xc56d91 = loadImage(_0x4b380e.dataUrl)
      .then((_0x3ddaa4) => {
        return ((_0x2b8882 = _0x3ddaa4), _0x3ddaa4);
      })
      .catch(() => null),
    _0x30f702 = (_0x28456d) => {
      ((_0x9d7f6 = _0x28456d),
        _0x78d3d6.classList.toggle('is-idle', _0x28456d === 'idle'),
        _0x78d3d6.classList.toggle('is-selecting', _0x28456d === 'selecting'),
        _0x78d3d6.classList.toggle('is-selected', _0x28456d === 'selected'),
        _0x78d3d6.classList.toggle('is-busy', _0x28456d === 'busy'));
    },
    _0x37a10b = () => {
      if (!_0x22d9eb) return;
      ((_0x22d9eb = applySelectionRect(_0x19daa1, _0x22d9eb)),
        positionActionBar(_0x2d0cf0, _0x22d9eb),
        _0x2d0cf0.classList.add('is-active'),
        (_0x1f930b.textContent = t('canvasScreenshot.hints.adjustArea')));
    },
    _0x5dcd91 = () => {
      (globalThis.window?.removeEventListener?.('keydown', _0xf1830f, true),
        _0x78d3d6.removeEventListener('contextmenu', _0xa1a8f3, true),
        removeOverlay(_0x78d3d6));
    },
    _0x126161 = () => {
      ((_0x22d9eb = null),
        (_0xa22426 = null),
        _0x19daa1.classList.remove('is-active'),
        _0x2d0cf0.classList.remove('is-active', 'is-busy'),
        (_0x1f930b.textContent = t('canvasScreenshot.hints.selectArea')),
        _0x30f702('idle'));
    },
    _0x1876b6 = () => _0x5dcd91(),
    _0x5d7a16 = () => {
      if (_0x2cbb24 != null)
        try {
          _0x78d3d6.releasePointerCapture?.(_0x2cbb24);
        } catch {}
      ((_0x2cbb24 = null),
        _0x78d3d6.removeEventListener('pointermove', _0x458167),
        _0x78d3d6.removeEventListener('pointerup', _0x480bdb));
      if (!_0x22d9eb || _0x22d9eb.width < MIN_SELECTION_SIZE || _0x22d9eb.height < MIN_SELECTION_SIZE) {
        (_0x126161(), _0x1248f3?.(t('canvasScreenshot.areaTooSmall'), 'warn'));
        return;
      }
      ((_0x22d9eb = clampRectToViewport(_0x22d9eb)), _0x30f702('selected'), _0x37a10b());
    },
    _0x458167 = (_0x2f93ca) => {
      if (!_0xa22426 || _0x36817a) return;
      const _0x2af8f6 = _0x2f93ca.clientX - _0xa22426.startX,
        _0x547442 = _0x2f93ca.clientY - _0xa22426.startY;
      if (_0xa22426.type === 'select') {
        ((_0x22d9eb = rectFromPoints(
          { x: _0xa22426.startX, y: _0xa22426.startY },
          { x: _0x2f93ca.clientX, y: _0x2f93ca.clientY },
        )),
          applySelectionRect(_0x19daa1, _0x22d9eb));
        return;
      }
      if (_0xa22426.type === 'move') {
        ((_0x22d9eb = clampRectToViewport({
          ..._0xa22426.startRect,
          left: _0xa22426.startRect.left + _0x2af8f6,
          top: _0xa22426.startRect.top + _0x547442,
        })),
          _0x37a10b());
        return;
      }
      _0xa22426.type === 'resize' &&
        ((_0x22d9eb = resizeRectFromHandle(_0xa22426.startRect, _0xa22426.handle, _0x2af8f6, _0x547442)),
        _0x37a10b());
    },
    _0x480bdb = () => {
      _0x5d7a16();
    },
    _0x585b26 = (_0x3cd608, _0x2598bb) => {
      (_0x3cd608.preventDefault(),
        (_0x2cbb24 = _0x3cd608.pointerId),
        (_0xa22426 = { ..._0x2598bb, startX: _0x3cd608.clientX, startY: _0x3cd608.clientY }),
        _0x78d3d6.setPointerCapture?.(_0x3cd608.pointerId),
        _0x78d3d6.addEventListener('pointermove', _0x458167),
        _0x78d3d6.addEventListener('pointerup', _0x480bdb, { once: true }));
    },
    _0x5518ec = async () => {
      if (_0x36817a || _0x9d7f6 !== 'selected' || !_0x22d9eb) return;
      ((_0x36817a = true), _0x30f702('busy'), _0x2d0cf0.classList.add('is-busy'));
      try {
        const _0x4e7d6b = _0x2b8882 || (await _0xc56d91),
          _0x27628f = await cropScreenshotToBlob(_0x4b380e, _0x22d9eb, _0x4e7d6b);
        if (!_0x27628f) throw new Error('empty screenshot crop');
        (await _0x4c0bfd(_0x27628f, 'image/png', {
          name: t('canvasScreenshot.nodeName'),
          typeSlug: 'screenshot',
        }),
          _0x5dcd91(),
          _0x1248f3?.(t('canvasScreenshot.added'), 'success'));
      } catch (_0x36e9a0) {
        (console.warn('[canvasScreenshot] crop failed:', _0x36e9a0),
          _0x5dcd91(),
          _0x1248f3?.(t('canvasScreenshot.addFailed'), 'error'));
      }
    };
  function _0xf1830f(_0x4d911a) {
    if (_0x4d911a.key !== 'Escape') return;
    (_0x4d911a.preventDefault(), _0x4d911a.stopPropagation(), _0x1876b6());
  }
  function _0xa1a8f3(_0x47573b) {
    (_0x47573b.preventDefault(), _0x47573b.stopPropagation());
    if (_0x9d7f6 === 'idle') {
      _0x1876b6();
      return;
    }
    _0x126161();
  }
  return (
    _0x78d3d6.addEventListener('pointermove', (_0x3d05de) => {
      if (_0x9d7f6 !== 'idle' || !_0x2b8882) return;
      drawMagnifier({
        magnifier: _0x40e770,
        canvas: _0x42975c,
        meta: _0x23035a,
        image: _0x2b8882,
        capture: _0x4b380e,
        event: _0x3d05de,
      });
    }),
    _0x78d3d6.addEventListener('pointerdown', (_0x1f6965) => {
      if (_0x1f6965.button === 2) {
        _0x1f6965.preventDefault();
        if (_0x9d7f6 === 'idle') _0x1876b6();
        else _0x126161();
        return;
      }
      if (_0x1f6965.button !== 0 || _0x36817a) return;
      const _0x2d2e12 = _0x1f6965.target?.dataset?.handle || '';
      if (_0x9d7f6 === 'selected' && _0x2d2e12 && _0x22d9eb) {
        _0x585b26(_0x1f6965, { type: 'resize', handle: _0x2d2e12, startRect: { ..._0x22d9eb } });
        return;
      }
      if (_0x9d7f6 === 'selected' && _0x1f6965.target === _0x19daa1 && _0x22d9eb) {
        _0x585b26(_0x1f6965, { type: 'move', startRect: { ..._0x22d9eb } });
        return;
      }
      if (_0x1f6965.target !== _0x78d3d6 && _0x1f6965.target !== _0x34150e) return;
      (_0x2d0cf0.classList.remove('is-active'),
        _0x30f702('selecting'),
        (_0x22d9eb = applySelectionRect(_0x19daa1, {
          left: _0x1f6965.clientX,
          top: _0x1f6965.clientY,
          width: 0,
          height: 0,
        })),
        _0x585b26(_0x1f6965, { type: 'select' }));
    }),
    _0x2d0cf0.addEventListener('pointerdown', (_0x283abc) => {
      _0x283abc.stopPropagation();
    }),
    _0x236acb.addEventListener('click', (_0x66e71e) => {
      (_0x66e71e.preventDefault(), _0x66e71e.stopPropagation(), void _0x5518ec());
    }),
    _0x5973f6.addEventListener('click', (_0x575f3b) => {
      (_0x575f3b.preventDefault(), _0x575f3b.stopPropagation(), _0x1876b6());
    }),
    globalThis.window?.addEventListener?.('keydown', _0xf1830f, true),
    _0x78d3d6.addEventListener('contextmenu', _0xa1a8f3, true),
    true
  );
}
