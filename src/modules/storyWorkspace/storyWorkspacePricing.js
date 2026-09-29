import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
import { resolveStoryClipVideoGenerationParams } from './storyVideoGenerationSettings.js';
const actions = (_0x16adea) =>
  _0x16adea['map']((_0x407d22) => '[data-story-action="' + _0x407d22 + '\x22]')['join'](',');
export function bindStoryWorkspacePricing(
  _0x257429,
  {
    state: _0x5df97f,
    getSelectedClip: _0x407f4b,
    getSelectedImageData: _0x140eea,
    getVideoReferenceCounts: _0x18ff06,
  },
) {
  const _0x1ee54 = (_0x141081) => ({
    model: _0x5df97f['models'][_0x141081],
    provider: _0x5df97f[_0x141081 + 'Provider'],
    providerProfileId: _0x5df97f[_0x141081 + 'ProviderProfileId'],
    generationParams: _0x5df97f[_0x141081 + 'GenerationParams'] || {},
  });
  return bindWorkspacePrices(_0x257429, [
    {
      selector: '.story-asset-generation-actions [data-story-action="generate-asset"]',
      getData: () => ({ ..._0x1ee54('image'), ..._0x140eea?.() }),
    },
    {
      selector: actions(['generate-clip-video']),
      getData: () => {
        const _0x3519b0 = _0x407f4b();
        return {
          ..._0x1ee54('video'),
          prompt: _0x3519b0?.['prompt'] || '',
          generationParams: resolveStoryClipVideoGenerationParams(
            _0x3519b0,
            _0x5df97f['models']['video'],
            _0x5df97f['videoGenerationParams'],
          ),
          hasReferences: Object['values'](_0x18ff06(_0x3519b0) || {})['some']((_0x161172) => _0x161172 > 0x0),
        };
      },
    },
    {
      selector: actions(['generate-character-voice']),
      getData: () => _0x5df97f['characterVoiceEditor']?.['nodeData'] || {},
    },
  ]);
}
