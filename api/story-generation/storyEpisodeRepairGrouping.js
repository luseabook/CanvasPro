import { normalizeStoryPromptMode } from '../../src/domain/storyGeneration/promptModes.js';
const text = (value) => String(value ?? '')['trim'](),
  duration = (item) =>
    (item['shots'] || [])['reduce']((key, index) => key + Number(index['durationSec'] || 0), 0);
function sceneIdentity(result, data) {
  const args = new Set();
  for (const options of result['shots'] || []) {
    let enabled = ![];
    for (const target of options['assetUsages'] || []) {
      const source = data['find']((next) =>
        [next['ref'], next['planningRef'], next['id']]['filter'](Boolean)['includes'](target['assetRef']),
      );
      if (source?.['kind'] !== 'scene') continue;
      ((enabled = !![]),
        args['add'](
          (source['id'] || source['ref'] || source['planningRef']) + ':' + (target['appearanceRef'] || ''),
        ));
    }
    if (!enabled) return '';
  }
  return args['size'] === 1 ? [...args][0] : '';
}
export function groupStoryEpisodeRepairClips(
  current,
  {
    promptMode: promptMode = 'seedance-2.0',
    maxSeconds: maxSeconds = 15,
    assets: assets = [],
    rawClips: rawClips = [],
  } = {},
) {
  if (normalizeStoryPromptMode(promptMode, { allowDeveloperModes: !![] }) !== 'seedance-2.0') return current;
  const entry = Math['min'](15, Math['max'](1, Number(maxSeconds) || 15)),
    record = [];
  for (const args2 of current) {
    const args3 = record['at'](-1),
      sceneIdentity2 = sceneIdentity(args2, assets),
      payload =
        rawClips['find']((handle) => handle['ref'] === args2['ref'])?.['startsNewNarrativeBeat'] === !![],
      state = args3 ? duration(args3) + duration(args2) : 0;
    if (
      !args3 ||
      payload ||
      !sceneIdentity2 ||
      sceneIdentity2 !== sceneIdentity(args3, assets) ||
      state > entry + 1e-9 ||
      args3['shots']['length'] + args2['shots']['length'] > 12
    ) {
      record['push'](args2);
      continue;
    }
    record[record['length'] - 1] = {
      ...args3,
      script: [args3['script'], args2['script']]['map'](text)['filter'](Boolean)['join']('\n'),
      creativeIntent: [
        ...new Set([args3['creativeIntent'], args2['creativeIntent']]['map'](text)['filter'](Boolean)),
      ]['join']('；'),
      transition: [...new Set([args3['transition'], args2['transition']]['map'](text)['filter'](Boolean))][
        'join'
      ]('；'),
      shots: [...args3['shots'], ...args2['shots']],
      durationSec: Number(state['toFixed'](3)),
      assetRefs: [...new Set([...(args3['assetRefs'] || []), ...(args2['assetRefs'] || [])])],
    };
  }
  return record;
}
