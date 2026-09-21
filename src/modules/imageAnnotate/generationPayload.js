const canvasToBlob = (_0x5811f5, _0x153113) =>
    new Promise((_0x446aac) => _0x5811f5.toBlob(_0x446aac, _0x153113)),
  createSceneCanvas = ({ documentRef: _0x3afde5, naturalW: _0x3c316f, naturalH: _0x35f275 }) => {
    const _0x3cc37a = _0x3afde5.createElement('canvas');
    return ((_0x3cc37a.width = _0x3c316f), (_0x3cc37a.height = _0x35f275), _0x3cc37a);
  },
  buildEraseInputCanvas = ({
    documentRef: _0x173339,
    loaded: _0x20e070,
    maskCanvas: _0x39a58d,
    naturalW: _0x51f4aa,
    naturalH: _0xcb9ac2,
  }) => {
    const _0x58ff3f = createSceneCanvas({ documentRef: _0x173339, naturalW: _0x51f4aa, naturalH: _0xcb9ac2 }),
      _0x1d1d02 = _0x58ff3f.getContext('2d');
    _0x1d1d02.drawImage(_0x20e070, 0, 0, _0x51f4aa, _0xcb9ac2);
    const _0x1fc960 = createSceneCanvas({ documentRef: _0x173339, naturalW: _0x51f4aa, naturalH: _0xcb9ac2 }),
      _0x4747ef = _0x1fc960.getContext('2d');
    return (
      (_0x4747ef.fillStyle = '#00FF00'),
      _0x4747ef.fillRect(0, 0, _0x51f4aa, _0xcb9ac2),
      _0x4747ef.save(),
      (_0x4747ef.globalCompositeOperation = 'destination-in'),
      _0x4747ef.drawImage(_0x39a58d, 0, 0),
      _0x4747ef.restore(),
      _0x1d1d02.drawImage(_0x1fc960, 0, 0),
      _0x58ff3f
    );
  },
  buildRepaintInputCanvas = ({
    documentRef: _0xd5338b,
    loaded: _0xff7995,
    maskCanvas: _0x1e5d17,
    naturalW: _0x222871,
    naturalH: _0x2e8641,
  }) => {
    const _0x56ee16 = createSceneCanvas({ documentRef: _0xd5338b, naturalW: _0x222871, naturalH: _0x2e8641 }),
      _0x591ba0 = _0x56ee16.getContext('2d');
    return (
      _0x591ba0.drawImage(_0xff7995, 0, 0, _0x222871, _0x2e8641),
      _0x591ba0.save(),
      (_0x591ba0.globalCompositeOperation = 'destination-out'),
      _0x591ba0.drawImage(_0x1e5d17, 0, 0),
      _0x591ba0.restore(),
      _0x56ee16
    );
  };
export const buildGenerationPayload = async ({
  scene: _0x18930d,
  commands: _0x19131c,
  promptText: _0x555585,
  node: _0x280c2e,
  imgUrl: _0x3ea5e6,
  model: _0x5c6e9a,
  provider: _0x1884fb,
  imageSize: _0x2fb6b9,
  erasePrompt: _0x3d8be9,
  loadImage: _0x2d7996,
  createSelectionMaskCanvas: _0x52d997,
  getModelProvider: _0x2b82d8,
  notify: notify = () => {},
  documentRef: documentRef = null,
  urlApi: urlApi = null,
} = {}) => {
  const _0x10f86a = documentRef || globalThis.document,
    _0x4e0a5a = urlApi || globalThis.URL,
    _0x5157f8 = Array.isArray(_0x19131c) ? _0x19131c : [];
  if (_0x18930d === 'erase') {
    if (!_0x5157f8.length) return (notify('请先涂抹要擦除的区域', 'warn'), null);
    const _0x406029 = await _0x2d7996(_0x3ea5e6),
      _0x12b1b6 = _0x406029.naturalWidth || _0x406029.width,
      _0x1fecb5 = _0x406029.naturalHeight || _0x406029.height,
      _0xe24405 = _0x12b1b6 / (_0x280c2e?.width || 1),
      _0x288387 = _0x1fecb5 / (_0x280c2e?.height || 1),
      _0x52b247 = _0x52d997(_0x12b1b6, _0x1fecb5, _0xe24405, _0x288387),
      _0x5ee5ca = buildEraseInputCanvas({
        documentRef: _0x10f86a,
        loaded: _0x406029,
        maskCanvas: _0x52b247,
        naturalW: _0x12b1b6,
        naturalH: _0x1fecb5,
      }),
      _0x1687d = await canvasToBlob(_0x5ee5ca, 'image/png');
    if (!_0x1687d) throw new Error('擦除输入图导出失败');
    const _0x3d9bac = _0x4e0a5a.createObjectURL(_0x1687d);
    return {
      payload: {
        prompt: _0x3d8be9,
        model: _0x5c6e9a,
        provider: _0x1884fb || _0x2b82d8(_0x5c6e9a),
        imageSize: _0x2fb6b9 || '1K',
        batchSize: 1,
        inputUrls: [_0x3d9bac],
        suppressAspectRatio: true,
      },
      inputUrl: _0x3d9bac,
      naturalWidth: _0x12b1b6,
      naturalHeight: _0x1fecb5,
    };
  }
  if (_0x18930d === 'repaint') {
    const _0x2782ef = String(_0x555585 || '').trim();
    if (!_0x5157f8.length) return (notify('请先选中要重绘的区域', 'warn'), null);
    if (!_0x2782ef) return (notify('请输入重绘提示词', 'warn'), null);
    const _0x21b47a = await _0x2d7996(_0x3ea5e6),
      _0x2022e5 = _0x21b47a.naturalWidth || _0x21b47a.width,
      _0x913156 = _0x21b47a.naturalHeight || _0x21b47a.height,
      _0x56f79b = _0x2022e5 / (_0x280c2e?.width || 1),
      _0x2e937f = _0x913156 / (_0x280c2e?.height || 1),
      _0x27225b = _0x52d997(_0x2022e5, _0x913156, _0x56f79b, _0x2e937f),
      _0x42a1f8 = buildRepaintInputCanvas({
        documentRef: _0x10f86a,
        loaded: _0x21b47a,
        maskCanvas: _0x27225b,
        naturalW: _0x2022e5,
        naturalH: _0x913156,
      }),
      _0x5219f8 = await canvasToBlob(_0x42a1f8, 'image/png');
    if (!_0x5219f8) throw new Error('重绘输入图导出失败');
    const _0x26fd52 = _0x4e0a5a.createObjectURL(_0x5219f8);
    return {
      payload: {
        prompt: _0x2782ef,
        model: _0x5c6e9a,
        provider: _0x1884fb || _0x2b82d8(_0x5c6e9a),
        imageSize: _0x2fb6b9 || '1K',
        batchSize: 1,
        inputUrls: [_0x26fd52],
        suppressAspectRatio: true,
      },
      inputUrl: _0x26fd52,
      naturalWidth: _0x2022e5,
      naturalHeight: _0x913156,
    };
  }
  return null;
};
