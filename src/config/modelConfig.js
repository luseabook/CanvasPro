import { getModelManifest, getModelsByKind, resolveModelProvider } from '../manifests/index.js';
import { t } from '../i18n/index.js';
function getImageMenuMeta(value) {
  const item = value?.extensions?.imageMenu;
  return item && typeof item === 'object' ? item : null;
}
function buildManifestImageModelItem(id) {
  const name2 = getImageMenuMeta(id) || {};
  return {
    id: id.modelId,
    name: name2.title || id.displayName || id.modelId,
    description: name2.subtitle || id.description || '',
    icon: name2.icon || id.icon,
    vip: id.vip === true,
    devOnly: id.devOnly === true,
  };
}
function getManifestImageModels({ provider: provider, adapterType: adapterType, group: group } = {}) {
  return getModelsByKind('image')
    .filter((item2) => {
      if (provider && item2.provider !== provider) return false;
      if (adapterType && item2.adapterType !== adapterType) return false;
      if (group && getImageMenuMeta(item2)?.group !== group) return false;
      return true;
    })
    .sort((item3, key) => {
      const imageMenuMeta = getImageMenuMeta(item3),
        imageMenuMeta2 = getImageMenuMeta(key);
      return (imageMenuMeta?.order || 0) - (imageMenuMeta2?.order || 0);
    })
    .map(buildManifestImageModelItem);
}
export const IMAGE_MODELS = {
  grsai: {
    name: 'GRSAI',
    icon: 'images/grsai.png',
    get description() {
      return t('imageModelConfig.providers.grsai.description');
    },
    models: getManifestImageModels({ provider: 'grsai', group: 'grsaiModel' }),
  },
  ppio: {
    get name() {
      return t('imageModelConfig.providers.ppio.name');
    },
    icon: 'images/ppio.png',
    get description() {
      return t('imageModelConfig.providers.ppio.description');
    },
    models: getManifestImageModels({ provider: 'ppio' }),
  },
  apimart: {
    name: 'APIMart',
    icon: 'AM',
    get description() {
      return t('imageModelConfig.providers.apimart.description');
    },
    isTextIcon: true,
    models: getManifestImageModels({ provider: 'apimart' }),
  },
  runninghub: {
    name: 'RunningHUB',
    icon: 'images/RH.png',
    get description() {
      return t('imageModelConfig.providers.runninghub.description');
    },
    models: getManifestImageModels({ provider: 'runninghub', adapterType: 'modelApi' }),
  },
  aicanvas: {
    name: 'AICanvas',
    icon: 'images/favicon.svg',
    get description() {
      return t('imageModelConfig.providers.aicanvas.description');
    },
    devOnly: true,
    get models() {
      const description2 = t('imageModelConfig.providers.aicanvas.placeholderImageModel');
      return [
        {
          id: 'aicanvas/image-lite',
          name: 'AICanvas Image Lite',
          description: description2,
          icon: 'images/favicon.svg',
        },
        {
          id: 'aicanvas/image-pro',
          name: 'AICanvas Image Pro',
          description: description2,
          icon: 'images/favicon.svg',
        },
      ];
    },
  },
};
export function getModelDisplayName(index) {
  const modelManifest = getModelManifest(index);
  if (modelManifest?.displayName) return modelManifest.displayName;
  for (const result of Object.values(IMAGE_MODELS)) {
    const error = result.models.find((item4) => item4.id === index);
    if (error) return error.name;
  }
  return index;
}
export function getModelProvider(data) {
  const modelProvider = resolveModelProvider(data, '', {
    allowProviderHint: false,
    allowPrefixInference: false,
  });
  if (modelProvider === 'runninghubwf') return 'runninghub';
  if (modelProvider) return modelProvider;
  return (
    Object.entries(IMAGE_MODELS).find(([, options]) =>
      options.models.some((item5) => item5.id === data),
    )?.[0] || null
  );
}
export function getProviderIconHtml(target, source = 12) {
  const enabled = IMAGE_MODELS[target];
  if (!enabled) return '';
  if (enabled.isTextIcon)
    return (
      '<div style="width:' +
      source +
      'px;height:' +
      source +
      'px;border-radius:2px;background:var(--bg-node);color:var(--text-primary);font-size:7px;font-weight:900;display:flex;align-items:center;justify-content:center;transform:scale(0.85);">' +
      enabled.icon +
      '</div>'
    );
  if (target === 'aicanvas') {
    const next = Math.max(Number(source) || 12, 14);
    return (
      '<img src="' +
      enabled.icon +
      '" style="width:' +
      next +
      'px;height:' +
      next +
      'px;object-fit:contain;border-radius:2px;flex-shrink:0;" alt="' +
      target +
      '">'
    );
  }
  return (
    '<img src="' +
    enabled.icon +
    '" style="width:' +
    source +
    'px;height:' +
    source +
    'px;object-fit:contain;border-radius:2px;flex-shrink:0;background:var(--white-10);padding:2px;" alt="' +
    target +
    '">'
  );
}
