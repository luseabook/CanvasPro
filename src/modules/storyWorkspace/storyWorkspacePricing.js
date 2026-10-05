import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
import { resolveStoryClipVideoGenerationParams } from './storyVideoGenerationSettings.js';
const actions = (list) => list['map']((value) => '[data-story-action="' + value + '"]')['join'](',');
export function bindStoryWorkspacePricing(
  item,
  {
    state: state,
    getSelectedClip: getSelectedClip,
    getSelectedImageData: getSelectedImageData,
    getVideoReferenceCounts: getVideoReferenceCounts,
  },
) {
  const run = (key) => ({
    model: state['models'][key],
    provider: state[key + 'Provider'],
    providerProfileId: state[key + 'ProviderProfileId'],
    generationParams: state[key + 'GenerationParams'] || {},
  });
  return bindWorkspacePrices(item, [
    {
      selector: '.story-asset-generation-actions [data-story-action="generate-asset"]',
      getData: () => ({ ...run('image'), ...getSelectedImageData?.() }),
    },
    {
      selector: actions(['generate-clip-video']),
      getData: () => {
        const prompt = getSelectedClip();
        return {
          ...run('video'),
          prompt: prompt?.['prompt'] || '',
          generationParams: resolveStoryClipVideoGenerationParams(
            prompt,
            state['models']['video'],
            state['videoGenerationParams'],
          ),
          hasReferences: Object['values'](getVideoReferenceCounts(prompt) || {})['some'](
            (count) => count > 0,
          ),
        };
      },
    },
    {
      selector: actions(['generate-character-voice']),
      getData: () => state['characterVoiceEditor']?.['nodeData'] || {},
    },
  ]);
}
