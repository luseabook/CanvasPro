import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
function plainReferenceSlots(value = '') {
  let enabled = 0,
    args = '';
  for (const [enabled2] of String(value)['matchAll'](/<[^>]*>|[^<]+/g)) {
    if (/^<span\b/i['test'](enabled2)) {
      if (enabled || /\bref-pill\b/['test'](enabled2)) enabled++;
    } else {
      if (/^<\/span\s*>/i['test'](enabled2) && enabled) enabled--;
      else {
        if (!enabled && !enabled2['startsWith']('<')) args += enabled2;
      }
    }
  }
  return [...new Set([...args['matchAll'](/图(?:片|像)?\s*(\d+)/gu)]['map']((item) => Number(item[1])))];
}
function referenceKey(enabled3) {
  if (!enabled3) return '';
  if (enabled3['role'] === 'person-location-guide') return enabled3['role'];
  return (
    localPathToUrl(enabled3['originalRef'] || enabled3['ref']) ||
    enabled3['originalRef'] ||
    enabled3['ref'] ||
    ''
  );
}
function captureReferences(key, index, result) {
  const personReplacementPromptPackage = buildPersonReplacementPromptPackage({ project: key, shot: index });
  return result['map']((data) => ({
    slot: data,
    key: referenceKey(
      personReplacementPromptPackage['referenceImages']['find']((options) => options['slot'] === data),
    ),
  }));
}
export function syncPersonReplacementPromptReferences(target, args2) {
  const source = new Map(
    target?.['id'] === args2['id'] ? (target['shots'] || [])['map']((next) => [next['id'], next]) : [],
  );
  return {
    ...args2,
    shots: args2['shots']['map']((args3) => {
      const plainReferenceSlots2 = plainReferenceSlots(args3['imagePrompt']);
      if (!plainReferenceSlots2['length']) {
        if (!args3['imagePromptReferences']) return args3;
        const { imagePromptReferences: imagePromptReferences, ...args4 } = args3;
        return args4;
      }
      const current = source['get'](args3['id']),
        entry = current && current['imagePrompt'] === args3['imagePrompt'],
        record = entry
          ? current['imagePromptReferences'] || captureReferences(target, current, plainReferenceSlots2)
          : current
            ? captureReferences(args2, args3, plainReferenceSlots2)
            : args3['imagePromptReferences'] || captureReferences(args2, args3, plainReferenceSlots2);
      return { ...args3, imagePromptReferences: record };
    }),
  };
}
export function getPersonReplacementPromptReferenceReviewMessage(payload, handle) {
  const state = new Set(plainReferenceSlots(payload?.['imagePrompt'])),
    config = (payload?.['imagePromptReferences'] || [])['filter'](
      ({ slot: slot, key: key2 }) =>
        state['has'](slot) &&
        key2 !== referenceKey(handle['referenceImages']?.['find']((scope) => scope['slot'] === slot)),
    );
  return config['length']
    ? '参考图绑定已变化，请检查并编辑提示词中的' +
        config['map']((input) => '图' + input['slot'])['join']('、') +
        '后再生成，或改用 @ 引用素材。'
    : '';
}
