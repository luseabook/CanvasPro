const canvasToBlob = (value, item) => new Promise((key) => value.toBlob(key, item)),
  createSceneCanvas = ({ documentRef: documentRef2, naturalW: naturalW, naturalH: naturalH }) => {
    const box = documentRef2.createElement('canvas');
    return ((box.width = naturalW), (box.height = naturalH), box);
  },
  buildEraseInputCanvas = ({
    documentRef: documentRef3,
    loaded: loaded,
    maskCanvas: maskCanvas,
    naturalW: naturalW2,
    naturalH: naturalH2,
  }) => {
    const el = createSceneCanvas({ documentRef: documentRef3, naturalW: naturalW2, naturalH: naturalH2 }),
      ctx = el.getContext('2d');
    ctx.drawImage(loaded, 0, 0, naturalW2, naturalH2);
    const el2 = createSceneCanvas({ documentRef: documentRef3, naturalW: naturalW2, naturalH: naturalH2 }),
      ctx2 = el2.getContext('2d');
    return (
      (ctx2.fillStyle = '#00FF00'),
      ctx2.fillRect(0, 0, naturalW2, naturalH2),
      ctx2.save(),
      (ctx2.globalCompositeOperation = 'destination-in'),
      ctx2.drawImage(maskCanvas, 0, 0),
      ctx2.restore(),
      ctx.drawImage(el2, 0, 0),
      el
    );
  },
  buildRepaintInputCanvas = ({
    documentRef: documentRef4,
    loaded: loaded2,
    maskCanvas: maskCanvas2,
    naturalW: naturalW3,
    naturalH: naturalH3,
  }) => {
    const el3 = createSceneCanvas({ documentRef: documentRef4, naturalW: naturalW3, naturalH: naturalH3 }),
      ctx3 = el3.getContext('2d');
    return (
      ctx3.drawImage(loaded2, 0, 0, naturalW3, naturalH3),
      ctx3.save(),
      (ctx3.globalCompositeOperation = 'destination-out'),
      ctx3.drawImage(maskCanvas2, 0, 0),
      ctx3.restore(),
      el3
    );
  };
export const buildGenerationPayload = async ({
  scene: scene,
  commands: commands,
  promptText: promptText,
  node: node,
  imgUrl: imgUrl,
  model: model,
  provider: provider,
  imageSize: imageSize,
  erasePrompt: erasePrompt,
  loadImage: loadImage,
  createSelectionMaskCanvas: createSelectionMaskCanvas,
  getModelProvider: getModelProvider,
  notify: notify = () => {},
  documentRef: documentRef = null,
  urlApi: urlApi = null,
} = {}) => {
  const documentRef5 = documentRef || globalThis.document,
    index = urlApi || globalThis.URL,
    list = Array.isArray(commands) ? commands : [];
  if (scene === 'erase') {
    if (!list.length) return (notify('请先涂抹要擦除的区域', 'warn'), null);
    const loaded3 = await loadImage(imgUrl),
      naturalW4 = loaded3.naturalWidth || loaded3.width,
      naturalH4 = loaded3.naturalHeight || loaded3.height,
      result = naturalW4 / (node?.width || 1),
      data = naturalH4 / (node?.height || 1),
      maskCanvas3 = createSelectionMaskCanvas(naturalW4, naturalH4, result, data),
      eraseInputCanvas = buildEraseInputCanvas({
        documentRef: documentRef5,
        loaded: loaded3,
        maskCanvas: maskCanvas3,
        naturalW: naturalW4,
        naturalH: naturalH4,
      }),
      blob = await canvasToBlob(eraseInputCanvas, 'image/png');
    if (!blob) throw new Error('擦除输入图导出失败');
    const inputUrl = index.createObjectURL(blob);
    return {
      payload: {
        prompt: erasePrompt,
        model: model,
        provider: provider || getModelProvider(model),
        imageSize: imageSize || '1K',
        batchSize: 1,
        inputUrls: [inputUrl],
        suppressAspectRatio: true,
      },
      inputUrl: inputUrl,
      naturalWidth: naturalW4,
      naturalHeight: naturalH4,
    };
  }
  if (scene === 'repaint') {
    const prompt = String(promptText || '').trim();
    if (!list.length) return (notify('请先选中要重绘的区域', 'warn'), null);
    if (!prompt) return (notify('请输入重绘提示词', 'warn'), null);
    const loaded4 = await loadImage(imgUrl),
      naturalW5 = loaded4.naturalWidth || loaded4.width,
      naturalH5 = loaded4.naturalHeight || loaded4.height,
      options = naturalW5 / (node?.width || 1),
      target = naturalH5 / (node?.height || 1),
      maskCanvas4 = createSelectionMaskCanvas(naturalW5, naturalH5, options, target),
      repaintInputCanvas = buildRepaintInputCanvas({
        documentRef: documentRef5,
        loaded: loaded4,
        maskCanvas: maskCanvas4,
        naturalW: naturalW5,
        naturalH: naturalH5,
      }),
      blob2 = await canvasToBlob(repaintInputCanvas, 'image/png');
    if (!blob2) throw new Error('重绘输入图导出失败');
    const inputUrl2 = index.createObjectURL(blob2);
    return {
      payload: {
        prompt: prompt,
        model: model,
        provider: provider || getModelProvider(model),
        imageSize: imageSize || '1K',
        batchSize: 1,
        inputUrls: [inputUrl2],
        suppressAspectRatio: true,
      },
      inputUrl: inputUrl2,
      naturalWidth: naturalW5,
      naturalHeight: naturalH5,
    };
  }
  return null;
};
