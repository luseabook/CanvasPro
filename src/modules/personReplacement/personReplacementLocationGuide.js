import {
  buildPersonReplacementLocationGuideSvg,
  resolvePersonReplacementLocationGuidePreview,
} from './personReplacementLocationGuideSvg.js';
export function loadPersonReplacementGuideImage(value, el) {
  return new Promise((handler, handler2) => {
    if (typeof globalThis['Image'] !== 'function') {
      handler2(new Error('当前环境无法制作人物定位图'));
      return;
    }
    const image = new Image(),
      handler3 = (item) => {
        (clearTimeout(setTimeout2),
          el?.['removeEventListener']('abort', handler4),
          (image['onload'] = null),
          (image['onerror'] = null));
        if (item) ((image['src'] = ''), handler2(item));
        else handler(image);
      },
      handler4 = () => handler3(new DOMException('人物定位图制作已取消', 'AbortError')),
      setTimeout2 = setTimeout(() => handler3(new Error('人物定位示意图加载超时')), 30000);
    ((image['crossOrigin'] = 'anonymous'),
      (image['onload'] = () => handler3()),
      (image['onerror'] = () => handler3(new Error('无法加载人物定位示意图，未提交人物替换'))),
      el?.['addEventListener']('abort', handler4, { once: !![] }));
    if (el?.['aborted']) {
      handler4();
      return;
    }
    image['src'] = value;
  });
}
export async function buildPersonReplacementLocationGuide({
  frame: frame = {},
  people: people = [],
  signal: signal,
} = {}) {
  if (!people['length']) throw new Error('人物定位图缺少绑定人物');
  const box = buildPersonReplacementLocationGuideSvg({ frame: frame, people: people }),
    personReplacementGuideImage = await loadPersonReplacementGuideImage(
      resolvePersonReplacementLocationGuidePreview(box['dataUrl']),
      signal,
    ),
    box2 = document['createElement']('canvas');
  ((box2['width'] = box['width']), (box2['height'] = box['height']));
  try {
    const ctx = box2['getContext']('2d');
    if (!ctx) throw new Error('无法绘制人物定位图');
    ctx['drawImage'](personReplacementGuideImage, 0, 0);
    const dataUrl = box2['toDataURL']('image/png');
    if (!dataUrl['startsWith']('data:image/png;base64,')) throw new Error('人物定位图 PNG 导出失败');
    return { ...box, dataUrl: dataUrl };
  } finally {
    ((box2['width'] = 0), (box2['height'] = 0));
  }
}
export function applyPersonReplacementLocationGuide(referenceImages, ref) {
  if (!referenceImages['locationGuide']) return referenceImages;
  if (!ref?.['dataUrl']?.['startsWith']('data:image/png;base64,'))
    throw new Error('人物定位图未生成，已停止提交，避免仅凭文字替换');
  return {
    ...referenceImages,
    referenceImages: referenceImages['referenceImages']['map']((args) =>
      args['role'] === 'person-location-guide' ? { ...args, ref: ref['dataUrl'] } : args,
    ),
  };
}
