import { bindWorkspacePrices } from '../../components/shared/workspacePriceBindings.js';
import { resolvePersonReplacementVideoParameterPolicy } from './personReplacementProject.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { getWorkspaceAssetAppearances } from '../workspaceAssetAppearance.js';
export function bindPersonReplacementPricing(value, handler) {
  const run = (prompt) => {
    const project = handler(),
      model = project.settings,
      item = project.workspace,
      key =
        item.characterAssetTab === 'scene'
          ? project.scenes?.find((index) => index.id === item.selectedSceneId)
          : project.characters?.find((result) => result.id === item.selectedCharacterId),
      workspaceAssetAppearances = getWorkspaceAssetAppearances(key),
      data =
        workspaceAssetAppearances[item.assetAppearanceIndexes?.[key?.id] || 0] ||
        workspaceAssetAppearances[0],
      shot = project.shots?.find((options) => options.id === item.selectedShotId),
      target = prompt ? 'characterImage' : 'replacementImage';
    return {
      model: model[target + 'ModelId'],
      provider: model[target + 'Provider'],
      providerProfileId: model[target + 'ProviderProfileId'],
      prompt: prompt
        ? data?.prompt || key?.prompt || key?.description || ''
        : shot
          ? buildPersonReplacementPromptPackage({ project: project, shot: shot }).prompt
          : '',
      generationParams: model[target + 'GenerationParams'],
      hasReferences: !prompt,
    };
  };
  return bindWorkspacePrices(value, [
    {
      selector: '.story-asset-generation-actions [data-story-action="generate-asset"]',
      getData: () => run(true),
    },
    {
      selector: '[data-person-replacement-action="generate-replacement-image"]',
      getData: () => run(false),
    },
    {
      selector: '[data-person-replacement-action="generate-replacement-video"]',
      getData: () => {
        const modelId = handler().settings,
          generationParams = resolvePersonReplacementVideoParameterPolicy({
            modelId: modelId.replacementModelId,
            inputMode: modelId.replacementVideoInputMode,
            generationParams: modelId.replacementVideoGenerationParams,
          });
        return {
          model: modelId.replacementModelId,
          providerProfileId: modelId.replacementVideoProviderProfileId,
          generationParams: generationParams.generationParams,
          hasReferences: true,
        };
      },
    },
  ]);
}
