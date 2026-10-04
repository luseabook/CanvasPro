import { normalizeStoryEpisodeSpokenTiming } from './storyEpisodeSpokenTiming.js';
import { isStoryContinuousTimelinePromptMode } from '../../src/domain/storyGeneration/promptModes.js';
export function canNormalizeStoryRepairTiming(value, item) {
  return (
    value?.['sourceMode'] !== 'video-replication' &&
    !isStoryContinuousTimelinePromptMode(item?.['promptMode'])
  );
}
export async function validateStoryRepairTiming({ validateClips: validateClips, ...args }) {
  const key = await validateClips(args);
  if (!Array['isArray'](key) || !canNormalizeStoryRepairTiming(args['project'], args['constraints']))
    return key;
  const storyEpisodeSpokenTiming = normalizeStoryEpisodeSpokenTiming(key, {
    maxClipDurationSeconds: args['constraints']?.['sceneMaxSeconds'],
  });
  if (
    storyEpisodeSpokenTiming['length'] === key['length'] &&
    storyEpisodeSpokenTiming['every']((index, result) => index === key[result])
  )
    return key;
  return validateClips({ ...args, clips: storyEpisodeSpokenTiming });
}
export function getStoryRepairResumeCandidates(data, options, target, source) {
  const next = {};
  for (const current of options) {
    if (data['pendingRecheck']?.[current]) next[current] = data['pendingRecheck'][current];
    else {
      if (
        canNormalizeStoryRepairTiming(target, source) &&
        data['repairErrorCodes']?.[current] === 'STORY_LOCAL_TIMING' &&
        data['attemptedClips']?.[current]?.['length']
      )
        next[current] = data['attemptedClips'][current];
    }
  }
  return next;
}
