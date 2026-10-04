import { renderAIGenTextModelSelectorMarkup } from '../../components/aigenText/modelSelector.js';
import { getDisplayModelName } from '../providers.js';
function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
export function renderStoryPlanningTextModelPicker(
  modelId = {},
  item = '',
  { disabled: disabled = ![], className: className = '' } = {},
) {
  if (disabled) return '';
  return (
    '<div class="story-planning-model-picker ' +
    escapeHtml(className) +
    '\x22>\x0a\x20\x20\x20\x20' +
    renderAIGenTextModelSelectorMarkup({
      modelId: modelId['models']?.['text'],
      provider: modelId['textProvider'],
      providerProfileId: modelId['textProviderProfileId'],
      includeRunningHubInternational: !![],
      getDisplayModelName: getDisplayModelName,
      className: 'story-planning-text-model-selector',
    }) +
    '\x0a\x20\x20</div>'
  );
}
