import { getAIGenerationDefaultSizeByType, getNodeDefaultSize } from '../services/fileService.js';
import { getNodeCreationMenuItem } from '../modules/nodeCreationMenuCatalog.js';
import { t } from '../i18n/index.js';
function createGenerationPickerItem(type, value, item) {
  const width = getAIGenerationDefaultSizeByType(type);
  return {
    type: type,
    label: t('coreUi.renderer.picker.items.' + value),
    defaultLabel: t('coreUi.renderer.picker.defaults.' + item),
    width: width['width'],
    height: width['height'],
  };
}
export function getRendererPickerNodeTypes() {
  const label = getNodeCreationMenuItem('storyboard'),
    width2 = getNodeDefaultSize('storyboard');
  return [
    createGenerationPickerItem('ai-text', 'aiText', 'aiText'),
    createGenerationPickerItem('ai-image', 'aiImage', 'aiImage'),
    createGenerationPickerItem('ai-video', 'aiVideo', 'aiVideo'),
    createGenerationPickerItem('ai-audio', 'aiAudio', 'aiAudio'),
    {
      type: 'storyboard',
      label: label?.['label'] || '宫格图',
      defaultLabel: label?.['defaultName'] || label?.['label'] || '宫格图',
      width: width2['width'],
      height: width2['height'],
    },
  ];
}
