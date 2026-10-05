import { renderAIGenTextModelSelectorMarkup } from '../../components/aigenText/modelSelector.js';
import { getDisplayModelName } from '../providers.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
export function renderStoryPlanningTextModelPicker(
  modelId = {},
  item = '',
  { disabled: disabled = false, className: className = '' } = {},
) {
  if (disabled) return '';
  return (
    '<div class="story-planning-model-picker ' +
    escapeHtml(className) +
    '">\n    ' +
    renderAIGenTextModelSelectorMarkup({
      modelId: modelId['models']?.['text'],
      provider: modelId['textProvider'],
      providerProfileId: modelId['textProviderProfileId'],
      includeRunningHubInternational: true,
      getDisplayModelName: getDisplayModelName,
      className: 'story-planning-text-model-selector',
    }) +
    '\n  </div>'
  );
}
