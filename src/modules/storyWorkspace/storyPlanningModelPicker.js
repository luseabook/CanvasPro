import { renderAIGenTextModelSelectorMarkup } from '../../components/aigenText/modelSelector.js';
import { getDisplayModelName } from '../providers.js';
function escapeHtml(_0x244192) {
  return String(_0x244192 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
export function renderStoryPlanningTextModelPicker(
  _0x25ffb1 = {},
  _0xda0b22 = '',
  { disabled: disabled = ![], className: className = '' } = {},
) {
  if (disabled) return '';
  return (
    '<div class="story-planning-model-picker ' +
    escapeHtml(className) +
    '\x22>\x0a\x20\x20\x20\x20' +
    renderAIGenTextModelSelectorMarkup({
      modelId: _0x25ffb1['models']?.['text'],
      provider: _0x25ffb1['textProvider'],
      providerProfileId: _0x25ffb1['textProviderProfileId'],
      includeRunningHubInternational: !![],
      getDisplayModelName: getDisplayModelName,
      className: 'story-planning-text-model-selector',
    }) +
    '\x0a\x20\x20</div>'
  );
}
