import { stripFlowSubtitleOverlays } from './videoReplicationFlowPrompt.js';
const compact = (value) => String(value || '')['replace'](/[\p{P}\p{Z}\s]/gu, '');
export function separateReplicationGeneratedFields(args, item) {
  const compact2 = compact(item),
    handler = (key) =>
      String(key || '')
        ['replace'](/([：:]\s*)[“「"]([^”」"\n]+)[”」"]/gu, (index, result, data, options, target) => {
          const source = target['slice'](0x0, options)
            ['split'](/[。；;\n]/u)
            ['at'](-0x1);
          if (
            /招牌|告示|纸上|纸条|屏幕|字幕|标题|文案|品牌|包装|标识|logo|手机.*显示|文字|写着|写有|标着|印着/iu[
              'test'
            ](source)
          )
            return index;
          const compact3 = compact(data);
          if (compact3['length'] < 0x4 || !compact2['includes'](compact3)) return index;
          return /^[，,。！？；;]/u['test'](target['slice'](options + index['length'])['trim']()) ? '' : '。';
        })
        ['replace'](/([。！？])\1+/gu, '$1'),
    stripFlowSubtitleOverlays2 = stripFlowSubtitleOverlays(handler(args['camera']));
  let stripFlowSubtitleOverlays3 = stripFlowSubtitleOverlays(handler(args['visual']));
  const list = stripFlowSubtitleOverlays3['match'](/[^。\n]+[。\n]?/gu) || [],
    next = list['at'](-0x1);
  return (
    list['length'] > 0x1 &&
      !/[“”「」"]/u['test'](next) &&
      compact(next) &&
      compact(next) === compact(stripFlowSubtitleOverlays2) &&
      (stripFlowSubtitleOverlays3 = list['slice'](0x0, -0x1)['join']('')['trim']()),
    { ...args, visual: stripFlowSubtitleOverlays3, camera: stripFlowSubtitleOverlays2 }
  );
}
