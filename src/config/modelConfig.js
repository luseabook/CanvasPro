import { getModelManifest, getModelsByKind, resolveModelProvider } from '../manifests/index.js';
import { t } from '../i18n/index.js';
function getImageMenuMeta(_0x25c8b6) {
  const _0x2a0bb6 = _0x25c8b6?.extensions?.imageMenu;
  return _0x2a0bb6 && typeof _0x2a0bb6 === 'object' ? _0x2a0bb6 : null;
}
function buildManifestImageModelItem(_0x20c645) {
  const _0x32d615 = getImageMenuMeta(_0x20c645) || {};
  return {
    id: _0x20c645.modelId,
    name: _0x32d615.title || _0x20c645.displayName || _0x20c645.modelId,
    description: _0x32d615.subtitle || _0x20c645.description || '',
    icon: _0x32d615.icon || _0x20c645.icon,
    vip: _0x20c645.vip === true,
    devOnly: _0x20c645.devOnly === true,
  };
}
function getManifestImageModels({ provider: _0x86bf38, adapterType: _0x3ed9ce, group: _0x360670 } = {}) {
  return getModelsByKind('image')
    .filter((_0x13cd60) => {
      if (_0x86bf38 && _0x13cd60.provider !== _0x86bf38) return false;
      if (_0x3ed9ce && _0x13cd60.adapterType !== _0x3ed9ce) return false;
      if (_0x360670 && getImageMenuMeta(_0x13cd60)?.group !== _0x360670) return false;
      return true;
    })
    .sort((_0x1cfe7a, _0x293d34) => {
      const _0x462afe = getImageMenuMeta(_0x1cfe7a),
        _0x182eca = getImageMenuMeta(_0x293d34);
      return (_0x462afe?.order || 0) - (_0x182eca?.order || 0);
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
      const _0x5d6ecd = t('imageModelConfig.providers.aicanvas.placeholderImageModel');
      return [
        {
          id: 'aicanvas/image-lite',
          name: 'AICanvas Image Lite',
          description: _0x5d6ecd,
          icon: 'images/favicon.svg',
        },
        {
          id: 'aicanvas/image-pro',
          name: 'AICanvas Image Pro',
          description: _0x5d6ecd,
          icon: 'images/favicon.svg',
        },
      ];
    },
  },
};
export function getModelDisplayName(_0x47d7d4) {
  const _0x5040a2 = getModelManifest(_0x47d7d4);
  if (_0x5040a2?.displayName) return _0x5040a2.displayName;
  for (const _0x15d089 of Object.values(IMAGE_MODELS)) {
    const _0x33e2dc = _0x15d089.models.find((_0x53f3b9) => _0x53f3b9.id === _0x47d7d4);
    if (_0x33e2dc) return _0x33e2dc.name;
  }
  return _0x47d7d4;
}
export function getModelProvider(_0x1c5c06) {
  const _0x3c96c9 = resolveModelProvider(_0x1c5c06, '', {
    allowProviderHint: false,
    allowPrefixInference: false,
  });
  if (_0x3c96c9 === 'runninghubwf') return 'runninghub';
  if (_0x3c96c9) return _0x3c96c9;
  return (
    Object.entries(IMAGE_MODELS).find(([, _0x3111fa]) =>
      _0x3111fa.models.some((_0x3b6c73) => _0x3b6c73.id === _0x1c5c06),
    )?.[0] || null
  );
}
export function getProviderIconHtml(_0x2ae5d4, _0x4accb3 = 12) {
  const _0x1160de = IMAGE_MODELS[_0x2ae5d4];
  if (!_0x1160de) return '';
  if (_0x1160de.isTextIcon)
    return (
      '<div style="width:' +
      _0x4accb3 +
      'px;height:' +
      _0x4accb3 +
      'px;border-radius:2px;background:var(--bg-node);color:var(--text-primary);font-size:7px;font-weight:900;display:flex;align-items:center;justify-content:center;transform:scale(0.85);">' +
      _0x1160de.icon +
      '</div>'
    );
  if (_0x2ae5d4 === 'aicanvas') {
    const _0x43753 = Math.max(Number(_0x4accb3) || 12, 14);
    return (
      '<img src="' +
      _0x1160de.icon +
      '" style="width:' +
      _0x43753 +
      'px;height:' +
      _0x43753 +
      'px;object-fit:contain;border-radius:2px;flex-shrink:0;" alt="' +
      _0x2ae5d4 +
      '">'
    );
  }
  return (
    '<img src="' +
    _0x1160de.icon +
    '" style="width:' +
    _0x4accb3 +
    'px;height:' +
    _0x4accb3 +
    'px;object-fit:contain;border-radius:2px;flex-shrink:0;background:var(--white-10);padding:2px;" alt="' +
    _0x2ae5d4 +
    '">'
  );
}
