import { getResultText } from './storyTextRequest.js';
import { parseStrictJson } from '../utils/strictJson.js';
export async function completeReplicationMissingClips(partialResponse, value, handler) {
  let item, args;
  try {
    ((item = JSON['parse'](value['prompt'])), (args = parseStrictJson(getResultText(partialResponse))));
  } catch {
    return partialResponse;
  }
  const clips = item['sourceVideoEvidence']?.['segmentPlan'];
  if (!clips?.['length'] || !Array['isArray'](args['clips']) || !args['clips']['length'])
    return partialResponse;
  const map = new Set(clips['map']((key) => key['ref'])),
    map2 = new Map();
  for (const index of args['clips']) {
    if (!map['has'](index['ref']) || map2['has'](index['ref'])) return partialResponse;
    map2['set'](index['ref'], index);
  }
  const list = clips['filter']((result) => !map2['has'](result['ref']));
  if (!list['length']) return partialResponse;
  const map3 = new Set(list['map']((data) => data['ref'])),
    structuredClone2 = structuredClone(value);
  ((item['task'] = 'complete_missing_replication_clips'),
    (item['sourceVideoEvidence']['segmentPlan'] = list));
  if (item['timingContract']?.['clips'])
    item['timingContract']['clips'] = item['timingContract']['clips']['filter']((options) =>
      map3['has'](options['ref']),
    );
  ((item['requirements'] = [
    ...(item['requirements'] || []),
    '上次只返回了\x20' +
      [...map2['keys']()]['join']('、') +
      '。本次只补齐 ' +
      [...map3]['join']('、') +
      '，每个编号恰好一次；已返回片段由程序保留，不要重写或返回。原片时间、人声原文与素材沿用现有证据，不重新分析。',
  ]),
    (structuredClone2['prompt'] = JSON['stringify'](item)));
  const target = structuredClone2['structuredOutput']?.['schema']?.['properties']?.['clips'];
  target &&
    ((target['minItems'] = list['length']),
    (target['maxItems'] = list['length']),
    (target['items']['properties']['ref'] = { type: 'string', enum: [...map3] }));
  const run = (source) =>
    Object['assign'](new Error(source), {
      code: 'REPLICATION_MISSING_CLIPS',
      partialResponse: partialResponse,
      missingClipRefs: [...map3],
    });
  let strictJson;
  try {
    strictJson = parseStrictJson(getResultText(await handler(structuredClone2)));
  } catch (cause) {
    throw Object['assign'](run('缺失片段补生成未完成，已返回片段保留：' + cause['message']), {
      cause: cause,
    });
  }
  if (!Array['isArray'](strictJson['clips']) || strictJson['clips']['length'] !== list['length'])
    throw run('一次补生成后仍缺少片段，已返回内容保留，未继续重试。');
  const map4 = new Map();
  for (const next of strictJson['clips']) {
    if (!map3['has'](next['ref']) || map4['has'](next['ref']))
      throw run('补生成包含重复或非缺失片段编号，未覆盖已返回内容。');
    map4['set'](next['ref'], next);
  }
  const text = JSON['stringify']({
    ...args,
    clips: clips['map']((current) => map2['get'](current['ref']) || map4['get'](current['ref'])),
  });
  return typeof partialResponse === 'string' ? text : { ...partialResponse, text: text };
}
