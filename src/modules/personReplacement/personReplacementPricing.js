import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
import { resolvePersonReplacementVideoParameterPolicy } from './personReplacementProject.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { getWorkspaceAssetAppearances } from '../workspaceAssetAppearance.js';
export function bindPersonReplacementPricing(_0x16708f, _0x1e10b6) {
  const _0x2f3b87 = (_0x3b5811) => {
    const _0x43b95e = _0x1e10b6(),
      _0x345ecc = _0x43b95e['settings'],
      _0xc91281 = _0x43b95e['workspace'],
      _0x23c23e =
        _0xc91281['characterAssetTab'] === 'scene'
          ? _0x43b95e['scenes']?.['find']((_0xea7c58) => _0xea7c58['id'] === _0xc91281['selectedSceneId'])
          : _0x43b95e['characters']?.['find'](
              (_0x285713) => _0x285713['id'] === _0xc91281['selectedCharacterId'],
            ),
      _0x36677b = getWorkspaceAssetAppearances(_0x23c23e),
      _0x2b0a0f =
        _0x36677b[_0xc91281['assetAppearanceIndexes']?.[_0x23c23e?.['id']] || 0x0] || _0x36677b[0x0],
      _0x5bae1a = _0x43b95e['shots']?.['find'](
        (_0xc9a591) => _0xc9a591['id'] === _0xc91281['selectedShotId'],
      ),
      _0x949853 = _0x3b5811 ? 'characterImage' : 'replacementImage';
    return {
      model: _0x345ecc[_0x949853 + 'ModelId'],
      provider: _0x345ecc[_0x949853 + 'Provider'],
      providerProfileId: _0x345ecc[_0x949853 + 'ProviderProfileId'],
      prompt: _0x3b5811
        ? _0x2b0a0f?.['prompt'] || _0x23c23e?.['prompt'] || _0x23c23e?.['description'] || ''
        : _0x5bae1a
          ? buildPersonReplacementPromptPackage({ project: _0x43b95e, shot: _0x5bae1a })['prompt']
          : '',
      generationParams: _0x345ecc[_0x949853 + 'GenerationParams'],
      hasReferences: !_0x3b5811,
    };
  };
  return bindWorkspacePrices(_0x16708f, [
    {
      selector: '.story-asset-generation-actions\x20[data-story-action=\x22generate-asset\x22]',
      getData: () => _0x2f3b87(!![]),
    },
    {
      selector: '[data-person-replacement-action="generate-replacement-image"]',
      getData: () => _0x2f3b87(![]),
    },
    {
      selector: '[data-person-replacement-action=\x22generate-replacement-video\x22]',
      getData: () => {
        const _0x144236 = _0x1e10b6()['settings'],
          _0x10df14 = resolvePersonReplacementVideoParameterPolicy({
            modelId: _0x144236['replacementModelId'],
            inputMode: _0x144236['replacementVideoInputMode'],
            generationParams: _0x144236['replacementVideoGenerationParams'],
          });
        return {
          model: _0x144236['replacementModelId'],
          providerProfileId: _0x144236['replacementVideoProviderProfileId'],
          generationParams: _0x10df14['generationParams'],
          hasReferences: !![],
        };
      },
    },
  ]);
}
