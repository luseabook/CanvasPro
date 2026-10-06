import { loadPersonReplacementGuideImage } from './personReplacementLocationGuide.js';
import { PERSON_REPLACEMENT_MARKER_COLORS } from './personReplacementPromptMode.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
export async function buildPersonReplacementAnnotatedSource({
  sourceRef: sourceRef,
  people: people = [],
  signal: signal,
} = {}) {
  if (!sourceRef || !people.length) throw new Error('测试模式缺少原图或绑定人物框');
  const personReplacementGuideImage = await loadPersonReplacementGuideImage(
      localPathToUrl(sourceRef) || sourceRef,
      signal,
    ),
    el = document.createElement('canvas');
  ((el.width = personReplacementGuideImage.naturalWidth),
    (el.height = personReplacementGuideImage.naturalHeight));
  try {
    const ctx = el.getContext('2d');
    if (!ctx || !el.width || !el.height) throw new Error('无法绘制测试模式带框原图');
    ctx.drawImage(personReplacementGuideImage, 0, 0);
    const computedStyle = getComputedStyle(document.documentElement),
      handler = (value) => {
        const enabled = computedStyle.getPropertyValue(value).trim();
        if (!enabled) throw new Error('测试模式颜色未初始化：' + value);
        return enabled;
      },
      item = Math.min(el.width, el.height),
      key = Math.max(2, Math.round(item / 180)),
      index = Math.max(12, Math.round(item / 28));
    ((ctx.lineWidth = key),
      (ctx.font = '700 ' + index + 'px Arial, sans-serif'),
      (ctx.textBaseline = 'top'));
    for (const {
      label: label,
      referenceSlot: referenceSlot,
      markerIndex: markerIndex,
      bbox: bbox,
    } of people) {
      const result = bbox.x * el.width,
        data = bbox.y * el.height,
        options = bbox.width * el.width,
        target = bbox.height * el.height;
      ((ctx.strokeStyle = handler(
        PERSON_REPLACEMENT_MARKER_COLORS[markerIndex % PERSON_REPLACEMENT_MARKER_COLORS.length],
      )),
        ctx.strokeRect(
          result + key / 2,
          data + key / 2,
          Math.max(0, options - key),
          Math.max(0, target - key),
        ));
      const source = label + ' → 图' + referenceSlot,
        next = Math.min(el.width, ctx.measureText(source).width + key * 4),
        current = index + key * 4,
        entry = Math.max(0, Math.min(result, el.width - next)),
        record = Math.max(0, Math.min(data, el.height - current));
      ((ctx.fillStyle = ctx.strokeStyle),
        ctx.fillRect(entry, record, next, current),
        (ctx.fillStyle = handler('--canvas-black')),
        ctx.fillText(source, entry + key * 2, record + key * 2, next - key * 4));
    }
    if (signal?.aborted) throw new DOMException('测试模式制图已取消', 'AbortError');
    const enabled2 = el.toDataURL('image/png');
    if (!enabled2.startsWith('data:image/png;base64,')) throw new Error('测试模式带框原图导出失败');
    return { dataUrl: enabled2, width: el.width, height: el.height };
  } finally {
    ((el.width = 0), (el.height = 0));
  }
}
export function applyPersonReplacementAnnotatedSource(args, enabled3) {
  if (!args.annotatedSource) return args;
  if (!enabled3?.dataUrl?.startsWith('data:image/png;base64,'))
    throw new Error('带框原图未生成，已停止提交测试模式');
  return {
    ...args,
    referenceImages: args.referenceImages.map((args2) =>
      args2.role === 'source-keyframe'
        ? { ...args2, originalRef: args.annotatedSource.sourceRef, ref: enabled3.dataUrl }
        : args2,
    ),
  };
}
