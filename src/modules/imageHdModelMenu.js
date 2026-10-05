import { listModelManifests } from '../manifests/index.js';
export function getImageHdModelIds() {
  return listModelManifests()
    ['filter'](
      (value) =>
        value['kind'] === 'image' &&
        value['adapterType'] === 'workflow' &&
        value['extensions']?.['imageHdMenu']?.['enabled'] === true,
    )
    ['map']((item) => item['modelId']);
}
