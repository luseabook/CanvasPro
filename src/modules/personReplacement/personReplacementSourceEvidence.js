import { loadPersonReplacementGuideImage } from './personReplacementLocationGuide.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
export async function buildSourceEvidence(value, { signal: signal } = {}) {
  const enabled = value.referenceImages?.find((item) => item.role === 'source-keyframe')?.ref;
  if (!enabled) throw new Error('原人物识别缺少原图');
  const personReplacementGuideImage = await loadPersonReplacementGuideImage(
      localPathToUrl(enabled) || enabled,
      signal,
    ),
    computedStyle = getComputedStyle(document.documentElement),
    handler = (key) => {
      const enabled2 = computedStyle.getPropertyValue(key).trim();
      if (!enabled2) throw new Error('人物识别颜色未初始化：' + key);
      return enabled2;
    },
    index = handler('--canvas-black'),
    result = handler('--canvas-white'),
    list = [];
  for (const { markerLabel: markerLabel, bbox: bbox } of value.bindings) {
    if (signal?.aborted) throw new DOMException('原人物识别已取消', 'AbortError');
    const { x: x, y: y, width: width, height: height } = bbox || {};
    if (
      ![x, y, width, height].every(Number.isFinite) ||
      x < 0 ||
      y < 0 ||
      width <= 0 ||
      height <= 0 ||
      x + width > 1.001 ||
      y + height > 1.001
    )
      throw new Error('人物' + markerLabel + '选框无效，请重新框选');
    const box = document.createElement('canvas');
    ((box.width = 1600), (box.height = 800));
    try {
      const ctx = box.getContext('2d');
      if (
        !ctx ||
        !personReplacementGuideImage.naturalWidth ||
        !personReplacementGuideImage.naturalHeight
      )
        throw new Error('无法绘制原人物识别图');
      ((ctx.fillStyle = index),
        ctx.fillRect(0, 0, box.width, box.height),
        (ctx.fillStyle = result),
        (ctx.font = 'bold 32px Arial'),
        ctx.fillText(markerLabel + ' | FULL FRAME', 20, 45),
        ctx.fillText(markerLabel + ' | BOX CROP', 1080, 45));
      const data = Math.min(
          1040 / personReplacementGuideImage.naturalWidth,
          700 / personReplacementGuideImage.naturalHeight,
        ),
        options = personReplacementGuideImage.naturalWidth * data,
        target = personReplacementGuideImage.naturalHeight * data,
        source = 20,
        next = 80 + (700 - target) / 2;
      (ctx.drawImage(personReplacementGuideImage, source, next, options, target),
        (ctx.strokeStyle = result),
        (ctx.lineWidth = 4),
        ctx.strokeRect(source + x * options, next + y * target, width * options, height * target));
      const current = Math.min(width, 1 - x) * personReplacementGuideImage.naturalWidth,
        entry = Math.min(height, 1 - y) * personReplacementGuideImage.naturalHeight,
        record = Math.min(500 / current, 700 / entry);
      ctx.drawImage(
        personReplacementGuideImage,
        x * personReplacementGuideImage.naturalWidth,
        y * personReplacementGuideImage.naturalHeight,
        current,
        entry,
        1080 + (500 - current * record) / 2,
        80 + (700 - entry * record) / 2,
        current * record,
        entry * record,
      );
      const enabled3 = box.toDataURL('image/png');
      if (!enabled3.startsWith('data:image/png;base64,')) throw new Error('原人物识别图导出失败');
      list.push(enabled3);
    } finally {
      ((box.width = 0), (box.height = 0));
    }
  }
  return list;
}
