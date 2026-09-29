import { listModelManifests } from '../manifests/index.js';
export function getImageHdModelIds() {
  return listModelManifests()
    ['filter'](
      (_0x3824f0) =>
        _0x3824f0['kind'] === 'image' &&
        _0x3824f0['adapterType'] === 'workflow' &&
        _0x3824f0['extensions']?.['imageHdMenu']?.['enabled'] === !![],
    )
    ['map']((_0x5b6933) => _0x5b6933['modelId']);
}
