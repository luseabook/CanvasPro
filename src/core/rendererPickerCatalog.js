import { getAIGenerationDefaultSizeByType, getNodeDefaultSize } from '../services/fileService.js';
import { getNodeCreationMenuItem } from '../modules/nodeCreationMenuCatalog.js';
import { t } from '../i18n/index.js';
function createGenerationPickerItem(_0x552c56, _0x5e0b4a, _0x494c3b) {
  const _0x4b948a = getAIGenerationDefaultSizeByType(_0x552c56);
  return {
    type: _0x552c56,
    label: t('coreUi.renderer.picker.items.' + _0x5e0b4a),
    defaultLabel: t('coreUi.renderer.picker.defaults.' + _0x494c3b),
    width: _0x4b948a['width'],
    height: _0x4b948a['height'],
  };
}
export function getRendererPickerNodeTypes() {
  const _0x260b08 = getNodeCreationMenuItem('storyboard'),
    _0x408376 = getNodeDefaultSize('storyboard');
  return [
    createGenerationPickerItem('ai-text', 'aiText', 'aiText'),
    createGenerationPickerItem('ai-image', 'aiImage', 'aiImage'),
    createGenerationPickerItem('ai-video', 'aiVideo', 'aiVideo'),
    createGenerationPickerItem('ai-audio', 'aiAudio', 'aiAudio'),
    {
      type: 'storyboard',
      label: _0x260b08?.['label'] || '宫格图',
      defaultLabel: _0x260b08?.['defaultName'] || _0x260b08?.['label'] || '宫格图',
      width: _0x408376['width'],
      height: _0x408376['height'],
    },
  ];
}
