import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../src/manifests/index.js';
import { isAdaptiveRatioLabel, resolveProviderRatioPayload } from '../imageRatioPolicy.js';
import { ApiError } from '../errors/index.js';
import { buildBodyFromMapping } from './modelApiMappingEngine.js';
import {
  getModelApiBodyResolver,
  getModelApiEndpointResolver,
  normalizeApimartNanoBanana2Resolution,
  normalizeApimartGptImage2Resolution,
} from './modelApiResolvers/index.js';
function normalizeManifestOptionKey(_0x4c59c3) {
  return String(_0x4c59c3 || '')
    .trim()
    .toLowerCase();
}
function findVideoAspectRatioField(_0x18246c) {
  return (Array.isArray(_0x18246c?.uiSchema?.fields) ? _0x18246c.uiSchema.fields : []).find(
    (_0x25c9a2) => String(_0x25c9a2?.id || '').trim() === 'aspectRatio',
  );
}
function pickFirstConcreteVideoAspectRatio(_0x28adb4) {
  const _0x3a7f64 = findVideoAspectRatioField(_0x28adb4),
    _0x3e20ce = Array.isArray(_0x3a7f64?.options) ? _0x3a7f64.options : [];
  for (const _0x3e1084 of _0x3e20ce) {
    const _0x98597d = String(_0x3e1084?.value ?? _0x3e1084 ?? '').trim();
    if (_0x98597d && _0x98597d.includes(':') && !isAdaptiveRatioLabel(_0x98597d)) return _0x98597d;
  }
  return '';
}
function resolvePayloadAspectRatioInput(_0x2ef001 = {}, _0x40204f = null) {
  const _0x51c27f =
    _0x2ef001?.generationParams &&
    typeof _0x2ef001.generationParams === 'object' &&
    !Array.isArray(_0x2ef001.generationParams)
      ? _0x2ef001.generationParams
      : {};
  if (Object.prototype.hasOwnProperty.call(_0x51c27f, 'aspectRatio')) return _0x51c27f.aspectRatio;
  for (const _0x58c142 of ['aspectRatio', 'aspect_ratio', 'size']) {
    if (Object.prototype.hasOwnProperty.call(_0x2ef001 || {}, _0x58c142)) return _0x2ef001[_0x58c142];
  }
  return findVideoAspectRatioField(_0x40204f)?.defaultValue ?? '';
}
function applyVideoAspectRatioExecutionFallback(_0x2fc544 = {}, _0x3287fc = null) {
  if (!findVideoAspectRatioField(_0x3287fc)) return _0x2fc544;
  const _0x5bd9fa = _0x3287fc?.extensions?.ratioPolicy || _0x3287fc?.ratioPolicy || {};
  if (_0x5bd9fa?.preserveAdaptive === true) return _0x2fc544;
  const _0x3d88eb = resolvePayloadAspectRatioInput(_0x2fc544, _0x3287fc);
  if (!isAdaptiveRatioLabel(_0x3d88eb)) return _0x2fc544;
  const _0x2034fe = String(_0x2fc544?.resolvedRatioLabel || '').trim(),
    _0x56d00e =
      _0x2034fe && !isAdaptiveRatioLabel(_0x2034fe)
        ? _0x2034fe
        : pickFirstConcreteVideoAspectRatio(_0x3287fc);
  if (!_0x56d00e) return _0x2fc544;
  return {
    ..._0x2fc544,
    aspectRatio: _0x56d00e,
    resolvedRatioLabel: _0x56d00e,
    generationParams: { ...(_0x2fc544.generationParams || {}), aspectRatio: _0x56d00e },
  };
}
function mergeRootAspectRatioIntoGenerationParams(_0x3681f8 = {}, _0x324e59 = {}) {
  const _0x5b2466 =
      _0x324e59 && typeof _0x324e59 === 'object' && !Array.isArray(_0x324e59) ? { ..._0x324e59 } : {},
    _0x4b234d =
      _0x3681f8?.generationParams &&
      typeof _0x3681f8.generationParams === 'object' &&
      !Array.isArray(_0x3681f8.generationParams)
        ? _0x3681f8.generationParams
        : {};
  if (Object.prototype.hasOwnProperty.call(_0x4b234d, 'aspectRatio')) return _0x5b2466;
  if (String(_0x3681f8?.resolvedRatioLabel || '').trim()) return _0x5b2466;
  return (
    Object.prototype.hasOwnProperty.call(_0x3681f8 || {}, 'aspectRatio') &&
      !isAdaptiveRatioLabel(_0x3681f8.aspectRatio) &&
      (_0x5b2466.aspectRatio = _0x3681f8.aspectRatio),
    _0x5b2466
  );
}
function resolveMappedModelValue(_0x2d7635, _0x143a46) {
  if (!_0x2d7635) return '';
  if (typeof _0x2d7635 === 'string') return _0x2d7635;
  if (typeof _0x2d7635 !== 'object' || Array.isArray(_0x2d7635)) return '';
  const _0x4f0ff7 = String(_0x143a46?.imageSize || '')
      .trim()
      .toUpperCase(),
    _0x2c8b59 = _0x2d7635.byImageSize || {};
  return (_0x4f0ff7 && _0x2c8b59[_0x4f0ff7]) || _0x2d7635.default || _0x2d7635.model || '';
}
export function resolveExecutionModelToken(_0x477d4c, _0x10b049) {
  let _0x5cc91c = _0x477d4c.model || _0x10b049.model || '';
  const _0x24a8bc = normalizeManifestOptionKey(_0x10b049.mode ?? _0x10b049.generationParams?.mode);
  let _0x19c698 = false;
  if (_0x24a8bc && _0x477d4c.modeModels) {
    const _0x461b20 = resolveMappedModelValue(_0x477d4c.modeModels[_0x24a8bc], _0x10b049);
    _0x461b20 && ((_0x5cc91c = _0x461b20), (_0x19c698 = true));
  }
  const _0x5df2ef = normalizeManifestOptionKey(
    _0x10b049.rhModelRoute ?? _0x10b049.generationParams?.rhModelRoute,
  );
  if (_0x5df2ef && _0x477d4c.routeModels) {
    const _0x461555 = resolveMappedModelValue(_0x477d4c.routeModels[_0x5df2ef], _0x10b049);
    _0x461555 && ((_0x5cc91c = _0x461555), (_0x19c698 = true));
  }
  if (_0x477d4c.imageSizeModels && !_0x19c698) {
    const _0x49a048 = String(_0x10b049.imageSize || '')
      .trim()
      .toUpperCase();
    _0x5cc91c = _0x477d4c.imageSizeModels[_0x49a048] || _0x477d4c.imageSizeModels.default || _0x5cc91c;
  }
  return _0x5cc91c;
}
function resolveApiKey(_0xb772bb, _0x2a4023, _0x416d10) {
  const _0x372f10 = _0x416d10.getProviderConfig(_0xb772bb);
  if (_0xb772bb === 'runninghub') return _0x372f10.modelApiKey || _0x2a4023.apiKey;
  return _0x372f10.apiKey || _0x2a4023.apiKey;
}
function throwMissingApiKey(_0x2cfbb2) {
  throw ApiError.authError(_0x2cfbb2, null, 'API Key 未配置（厂商：' + (_0x2cfbb2 || 'unknown') + '）');
}
function getManifestMaxInputCount(_0x555078, _0x1dd418) {
  const _0x547039 = Number(_0x555078?.inputSlots?.maxByKind?.[_0x1dd418]);
  return Number.isFinite(_0x547039) ? Math.max(0, _0x547039) : null;
}
function getImageInputUploadPolicy(_0x2272fa = {}) {
  const _0xccf45d = _0x2272fa.executionManifest?.extensions?.imageInputUpload;
  return _0xccf45d && typeof _0xccf45d === 'object' && !Array.isArray(_0xccf45d) ? _0xccf45d : null;
}
function shouldApplyImageInputUploadPolicy(_0x94b464) {
  if (!_0x94b464) return false;
  const _0x22e1f3 = Array.isArray(_0x94b464.inputKinds)
    ? _0x94b464.inputKinds.map((_0x1bf57c) =>
        String(_0x1bf57c || '')
          .trim()
          .toLowerCase(),
      )
    : ['image'];
  return _0x22e1f3.includes('image');
}
async function resolveConfiguredImageInputUpload(_0x28cdd9, _0x462422, _0x49fcf6, _0xe19491, _0xfd8f87 = {}) {
  const _0x412058 = getImageInputUploadPolicy(_0xfd8f87);
  if (!shouldApplyImageInputUploadPolicy(_0x412058)) return { handled: false, urls: [] };
  const _0x54397e = String(_0x412058.provider || '').trim(),
    _0xe6fdc6 = _0x54397e.toLowerCase().replace(/[\s_-]+/g, '');
  if (_0xe6fdc6 === 'freeimagehost') {
    if (typeof _0xe19491.processInputImages !== 'function')
      throw new Error((_0x28cdd9 || 'modelApi') + ' image input upload is not available');
    const _0x59b3a3 = await _0xe19491.processInputImages(_0x462422, '', {
      applyInputQualityProfile: _0x412058.applyInputQualityProfile !== false,
      provider: 'freeImageHost',
      strictUpload: _0x412058.strictUpload !== false,
    });
    return { handled: true, urls: _0x59b3a3 };
  }
  if (_0xe6fdc6 === 'volcenginefiles') {
    if (typeof _0xe19491.uploadInputsToVolcengineFiles !== 'function')
      throw new Error('Volcengine file upload is not available');
    const _0x5d6966 = await _0xe19491.uploadInputsToVolcengineFiles(_0x462422, _0x49fcf6, {
      baseUrl: _0xfd8f87.baseUrl,
      kind: 'image',
      model: _0xfd8f87.executionManifest?.model,
    });
    return { handled: true, urls: _0x5d6966 };
  }
  throw new Error('Unsupported image input upload provider: ' + _0x54397e);
}
function getMediaInputUploadPolicy(_0x4ef7bd = {}, _0x177000) {
  const _0x469bc1 = String(_0x177000 || '')
      .trim()
      .toLowerCase(),
    _0x450f03 = _0x469bc1 === 'video' ? 'videoInputUpload' : _0x469bc1 === 'audio' ? 'audioInputUpload' : '',
    _0x44e2ab = _0x450f03 ? _0x4ef7bd.executionManifest?.extensions?.[_0x450f03] : null;
  return _0x44e2ab && typeof _0x44e2ab === 'object' && !Array.isArray(_0x44e2ab) ? _0x44e2ab : null;
}
function shouldApplyMediaInputUploadPolicy(_0x401def, _0x24b6a9) {
  if (!_0x401def) return false;
  const _0x6fdaa7 = String(_0x24b6a9 || '')
      .trim()
      .toLowerCase(),
    _0x597303 = Array.isArray(_0x401def.inputKinds)
      ? _0x401def.inputKinds.map((_0x541dd8) =>
          String(_0x541dd8 || '')
            .trim()
            .toLowerCase(),
        )
      : [_0x6fdaa7];
  return _0x597303.includes(_0x6fdaa7);
}
function getUploadProviderConfig(_0x263ec6, _0x23bd81) {
  return typeof _0x263ec6.getProviderConfig === 'function' ? _0x263ec6.getProviderConfig(_0x23bd81) : {};
}
async function resolveConfiguredMediaInputUpload(_0xd04dff, _0x840180, _0x5019f2, _0x52439c, _0x424639 = {}) {
  const _0x4c013a = getMediaInputUploadPolicy(_0x424639, _0x840180);
  if (!shouldApplyMediaInputUploadPolicy(_0x4c013a, _0x840180)) return { handled: false, urls: [] };
  const _0x16a0b8 = String(_0x4c013a.provider || '').trim(),
    _0x2e2fa8 = _0x16a0b8.toLowerCase().replace(/[\s_-]+/g, '');
  if (_0x2e2fa8 !== 'apimart')
    throw new Error('Unsupported ' + _0x840180 + ' input upload provider: ' + _0x16a0b8);
  const _0x484e90 = getUploadProviderConfig(_0x52439c, 'apimart'),
    _0x4edf70 = {
      provider: 'apimart',
      strictUpload: _0x4c013a.strictUpload !== false,
      apiUrl: _0x484e90.apiUrl,
      permanent: _0x4c013a.permanent === true,
      uploadTimeout: _0x4c013a.uploadTimeout,
    };
  if (_0x840180 === 'video') {
    if (typeof _0x52439c.processInputVideos !== 'function')
      throw new Error((_0xd04dff || 'modelApi') + ' video input upload is not available');
    const _0xea83aa = await _0x52439c.processInputVideos(_0x5019f2, _0x484e90.apiKey || '', _0x4edf70);
    return { handled: true, urls: _0xea83aa };
  }
  if (_0x840180 === 'audio') {
    if (typeof _0x52439c.processInputAudios !== 'function')
      throw new Error((_0xd04dff || 'modelApi') + ' audio input upload is not available');
    const _0x456a3a = await _0x52439c.processInputAudios(_0x5019f2, _0x484e90.apiKey || '', _0x4edf70);
    return { handled: true, urls: _0x456a3a };
  }
  throw new Error('Unsupported media input upload kind: ' + _0x840180);
}
async function resolveInputImages(_0x170d44, _0x4f5e4e, _0x422fae, _0x634dad, _0x5c5728 = {}) {
  const _0xe3b622 = getManifestMaxInputCount(_0x5c5728.modelManifest, 'image');
  if (_0xe3b622 === 0) return [];
  const _0x578aee = Array.isArray(_0x4f5e4e.inputUrls) ? _0x4f5e4e.inputUrls : [];
  if (_0x578aee.length === 0) return [];
  const _0x50ce2d = _0xe3b622 === null ? _0x578aee : _0x578aee.slice(0, _0xe3b622),
    _0x1e9b41 = await resolveConfiguredImageInputUpload(
      _0x170d44,
      _0x50ce2d,
      _0x422fae,
      _0x634dad,
      _0x5c5728,
    );
  if (_0x1e9b41.handled) return _0x1e9b41.urls;
  if (_0x170d44 === 'ppio') {
    const _0x11b5fb = _0x634dad.getProviderConfig('grsai'),
      _0x26121e = _0x11b5fb.apiKey || _0x4f5e4e.apiKey,
      _0x5a5a64 = await _0x634dad.processInputImages(_0x50ce2d, _0x26121e, {
        applyInputQualityProfile: true,
        provider: 'grsai',
      });
    if (_0x5a5a64.length === 0) throw new Error('参考素材上传云端失败，无法继续生成');
    return _0x5a5a64;
  }
  if (_0x170d44 === 'volcengine') {
    if (typeof _0x634dad.uploadInputsToVolcengineFiles !== 'function')
      throw new Error('Volcengine file upload is not available');
    return _0x634dad.uploadInputsToVolcengineFiles(_0x50ce2d, _0x422fae, {
      baseUrl: _0x5c5728.baseUrl,
      kind: 'image',
      model: _0x5c5728.executionManifest?.model,
    });
  }
  if (_0x170d44 === 'agnes')
    return _0x634dad.processInputImages(_0x50ce2d, '', {
      applyInputQualityProfile: true,
      provider: 'freeImageHost',
      strictUpload: true,
    });
  return _0x634dad.processInputImages(_0x50ce2d, _0x422fae, {
    applyInputQualityProfile: true,
    provider: _0x170d44,
    strictUpload: _0x170d44 === 'apimart' || _0x170d44 === 'runninghub',
  });
}
function normalizeInputUrlsBySlot(_0x282ac4) {
  if (!_0x282ac4 || typeof _0x282ac4 !== 'object' || Array.isArray(_0x282ac4)) return {};
  return Object.fromEntries(
    Object.entries(_0x282ac4)
      .map(([_0x5ba273, _0x19457f]) => [String(_0x5ba273 || '').trim(), String(_0x19457f || '').trim()])
      .filter(([_0x3b6061, _0x2859a0]) => _0x3b6061 && _0x2859a0),
  );
}
function getOrderedInputSlotEntries(_0x29697e = {}, _0x551066 = null) {
  const _0x1c4e9e = normalizeInputUrlsBySlot(_0x29697e),
    _0x582b5b = Array.isArray(_0x551066?.inputSlots?.fixedSlots) ? _0x551066.inputSlots.fixedSlots : [],
    _0xc51409 = _0x582b5b
      .filter((_0x4ed591) => String(_0x4ed591?.kind || '').trim() === 'image')
      .map((_0x65f2ec) => String(_0x65f2ec?.id || '').trim())
      .filter(Boolean),
    _0xecb243 = new Set(),
    _0x3a57e2 = [];
  return (
    _0xc51409.forEach((_0x151e3c) => {
      const _0x91f687 = _0x1c4e9e[_0x151e3c];
      if (!_0x91f687 || _0xecb243.has(_0x151e3c)) return;
      (_0x3a57e2.push({ slot: _0x151e3c, url: _0x91f687 }), _0xecb243.add(_0x151e3c));
    }),
    Object.entries(_0x1c4e9e).forEach(([_0x5958cc, _0x3ce239]) => {
      if (_0xecb243.has(_0x5958cc)) return;
      (_0x3a57e2.push({ slot: _0x5958cc, url: _0x3ce239 }), _0xecb243.add(_0x5958cc));
    }),
    _0x3a57e2
  );
}
async function resolveInputImagesBySlot(_0x1d8820, _0x1b2ccb, _0x50471b, _0x3539a9, _0x38558c = {}) {
  const _0x28978a = getOrderedInputSlotEntries(_0x1b2ccb?.inputUrlsBySlot, _0x38558c.modelManifest);
  if (_0x28978a.length === 0) return {};
  const _0x2d2d88 = getManifestMaxInputCount(_0x38558c.modelManifest, 'image'),
    _0x3eb55e = _0x2d2d88 === null ? _0x28978a : _0x28978a.slice(0, Math.max(0, _0x2d2d88)),
    _0x362c30 = await resolveInputImages(
      _0x1d8820,
      { ..._0x1b2ccb, inputUrls: _0x3eb55e.map((_0x25143b) => _0x25143b.url) },
      _0x50471b,
      _0x3539a9,
      _0x38558c,
    );
  return Object.fromEntries(
    _0x3eb55e
      .map((_0x3a2631, _0x4ebe25) => [_0x3a2631.slot, String(_0x362c30[_0x4ebe25] || '').trim()])
      .filter(([, _0x5b5090]) => _0x5b5090),
  );
}
function normalizeInputList(_0x3d3e71) {
  return Array.isArray(_0x3d3e71)
    ? _0x3d3e71.map((_0x52d97a) => String(_0x52d97a || '').trim()).filter(Boolean)
    : [];
}
function collectVideoInputUrls(_0x126626) {
  return Array.from(
    new Set(
      [
        String(_0x126626.videoUrl || '').trim(),
        ...normalizeInputList(_0x126626.videos),
        ...normalizeInputList(_0x126626.videoUrls),
      ].filter(Boolean),
    ),
  );
}
function collectAudioInputUrls(_0x364622) {
  return Array.from(
    new Set(
      [
        String(_0x364622.audioUrl || '').trim(),
        ...normalizeInputList(_0x364622.audios),
        ...normalizeInputList(_0x364622.audioUrls),
      ].filter(Boolean),
    ),
  );
}
function collectVideoImageInputUrls(_0x5ad3ac) {
  const _0x4c4c36 = Array.isArray(_0x5ad3ac.images)
    ? _0x5ad3ac.images
    : Array.isArray(_0x5ad3ac.inputUrls)
      ? _0x5ad3ac.inputUrls
      : [];
  return Array.from(new Set(_0x4c4c36.map((_0x28a9b4) => String(_0x28a9b4 || '').trim()).filter(Boolean)));
}
function omitSlotImageUrlsFromVideoInputs(_0xc39e0 = {}) {
  const _0x13bd78 = new Set(
    Object.values(normalizeInputUrlsBySlot(_0xc39e0.inputUrlsBySlot))
      .map((_0x21bf22) => String(_0x21bf22 || '').trim())
      .filter(Boolean),
  );
  if (_0x13bd78.size === 0) return _0xc39e0;
  const _0x1fd76 = (_0x153b4d) =>
    Array.isArray(_0x153b4d)
      ? _0x153b4d.filter((_0x123523) => !_0x13bd78.has(String(_0x123523 || '').trim()))
      : _0x153b4d;
  return { ..._0xc39e0, images: _0x1fd76(_0xc39e0.images), inputUrls: _0x1fd76(_0xc39e0.inputUrls) };
}
const VIDEO_MODEL_API_PROVIDERS = new Set(['agnes', 'apimart', 'runninghub', 'volcengine']);
function getProviderUploadLabel(_0x54d045) {
  const _0x55ebff = String(_0x54d045 || '')
    .trim()
    .toLowerCase();
  if (_0x55ebff === 'agnes') return 'Agnes AI';
  if (_0x55ebff === 'runninghub') return 'RunningHub';
  if (_0x55ebff === 'apimart') return 'APIMART';
  if (_0x55ebff === 'volcengine') return 'Volcengine';
  return _0x55ebff || 'Model API';
}
function isVolcengineContentGenerationMediaUrl(_0xbc2e90) {
  return /^(?:https?:|data:|asset:\/\/)/i.test(String(_0xbc2e90 || '').trim());
}
function getVolcengineContentGenerationMediaLabel(_0x3490cb) {
  if (_0x3490cb === 'image') return '图片';
  if (_0x3490cb === 'video') return '视频';
  if (_0x3490cb === 'audio') return '音频';
  return '素材';
}
function normalizeVolcengineContentGenerationMediaUrls(_0x553af0, _0x50a073) {
  const _0xad3524 = getVolcengineContentGenerationMediaLabel(_0x50a073);
  return normalizeInputList(_0x553af0).map((_0x5a0884) => {
    if (isVolcengineContentGenerationMediaUrl(_0x5a0884)) return _0x5a0884;
    throw new Error(
      '火山方舟 Seedance 2.0 ' +
        _0xad3524 +
        '入参需要公网 URL、Base64 data URI 或 asset:// 素材 ID；当前本地文件不能通过 Files API 作为 content.' +
        _0x50a073 +
        '_url.url 使用',
    );
  });
}
async function resolveVideoInputImages(_0x194414, _0x14a628, _0x134362, _0x22abdd = {}) {
  const _0x41419b = String(_0x22abdd.provider || 'apimart')
      .trim()
      .toLowerCase(),
    _0x3c77e3 = getProviderUploadLabel(_0x41419b),
    _0xffb562 = getManifestMaxInputCount(_0x22abdd.modelManifest, 'image');
  if (_0xffb562 === 0) return [];
  const _0x1fa78f = collectVideoImageInputUrls(_0x194414);
  if (_0x1fa78f.length === 0) return [];
  const _0x485196 = _0xffb562 === null ? _0x1fa78f : _0x1fa78f.slice(0, Math.max(0, _0xffb562)),
    _0x3ebb60 = await resolveConfiguredImageInputUpload(
      _0x41419b,
      _0x485196,
      _0x14a628,
      _0x134362,
      _0x22abdd,
    );
  if (_0x3ebb60.handled)
    return Array.isArray(_0x3ebb60.urls)
      ? _0x3ebb60.urls.map((_0x5e059b) => String(_0x5e059b || '').trim()).filter(Boolean)
      : [];
  if (_0x41419b === 'volcengine') return normalizeVolcengineContentGenerationMediaUrls(_0x485196, 'image');
  if (typeof _0x134362.processInputImages !== 'function')
    throw new Error(_0x3c77e3 + ' image input upload is not available');
  if (_0x41419b === 'agnes') {
    const _0x5b6f4f = await _0x134362.processInputImages(_0x485196, '', {
      applyInputQualityProfile: true,
      provider: 'freeImageHost',
      strictUpload: true,
    });
    return Array.isArray(_0x5b6f4f)
      ? _0x5b6f4f.map((_0x1a9e6c) => String(_0x1a9e6c || '').trim()).filter(Boolean)
      : [];
  }
  const _0x2e4303 = await _0x134362.processInputImages(_0x485196, _0x14a628, {
    applyInputQualityProfile: true,
    provider: _0x41419b,
    strictUpload: true,
  });
  return Array.isArray(_0x2e4303)
    ? _0x2e4303.map((_0x938bf5) => String(_0x938bf5 || '').trim()).filter(Boolean)
    : [];
}
async function resolveInputVideos(_0x393c8e, _0x210fe4, _0x300e22, _0x20e42d = {}) {
  const _0x3ef962 = String(_0x20e42d.provider || 'apimart')
      .trim()
      .toLowerCase(),
    _0x3f50fa = getProviderUploadLabel(_0x3ef962),
    _0x46449f = getManifestMaxInputCount(_0x20e42d.modelManifest, 'video');
  if (_0x46449f === 0) return [];
  const _0x143c83 = collectVideoInputUrls(_0x393c8e);
  if (_0x143c83.length === 0) return [];
  const _0x5e36b1 = _0x46449f === null ? _0x143c83 : _0x143c83.slice(0, _0x46449f),
    _0x55c027 = await resolveConfiguredMediaInputUpload(_0x3ef962, 'video', _0x5e36b1, _0x300e22, _0x20e42d);
  if (_0x55c027.handled)
    return Array.isArray(_0x55c027.urls)
      ? _0x55c027.urls.map((_0x16c47c) => String(_0x16c47c || '').trim()).filter(Boolean)
      : [];
  if (_0x3ef962 === 'volcengine') return normalizeVolcengineContentGenerationMediaUrls(_0x5e36b1, 'video');
  if (typeof _0x300e22.processInputVideos !== 'function')
    throw new Error(_0x3f50fa + ' video input upload is not available');
  const _0x44c2a8 = await _0x300e22.processInputVideos(_0x5e36b1, _0x210fe4, {
    provider: _0x3ef962,
    strictUpload: true,
  });
  if (!Array.isArray(_0x44c2a8) || _0x44c2a8.length === 0)
    throw new Error(_0x3f50fa + ' video upload failed');
  return _0x44c2a8.map((_0x2c02ba) => String(_0x2c02ba || '').trim()).filter(Boolean);
}
async function resolveInputAudios(_0x48245f, _0x12019f, _0x39bedb, _0x4d848a = {}) {
  const _0x335051 = String(_0x4d848a.provider || 'apimart')
      .trim()
      .toLowerCase(),
    _0x2fbf38 = getProviderUploadLabel(_0x335051),
    _0x30eabc = getManifestMaxInputCount(_0x4d848a.modelManifest, 'audio');
  if (_0x30eabc === 0) return [];
  const _0x3b1d0d = collectAudioInputUrls(_0x48245f);
  if (_0x3b1d0d.length === 0) return [];
  const _0x4db3d2 = _0x30eabc === null ? _0x3b1d0d : _0x3b1d0d.slice(0, _0x30eabc),
    _0x4d61ba = await resolveConfiguredMediaInputUpload(_0x335051, 'audio', _0x4db3d2, _0x39bedb, _0x4d848a);
  if (_0x4d61ba.handled)
    return Array.isArray(_0x4d61ba.urls)
      ? _0x4d61ba.urls.map((_0x58a2ca) => String(_0x58a2ca || '').trim()).filter(Boolean)
      : [];
  if (_0x335051 === 'volcengine') return normalizeVolcengineContentGenerationMediaUrls(_0x4db3d2, 'audio');
  if (typeof _0x39bedb.processInputAudios !== 'function')
    throw new Error(_0x2fbf38 + ' audio input upload is not available');
  const _0x330882 = await _0x39bedb.processInputAudios(_0x4db3d2, _0x12019f, {
    provider: _0x335051,
    strictUpload: true,
  });
  if (!Array.isArray(_0x330882) || _0x330882.length === 0)
    throw new Error(_0x2fbf38 + ' audio upload failed');
  return _0x330882.map((_0x29b9d1) => String(_0x29b9d1 || '').trim()).filter(Boolean);
}
function resolveProviderRatioSize(_0x16fb17, { context: _0xded9a1 }) {
  const _0x42ac75 = _0xded9a1.payload || {};
  if (_0x42ac75.suppressAspectRatio) return undefined;
  const _0xffc67c = String(_0x16fb17 || _0x42ac75.resolvedRatioLabel || _0x42ac75.aspectRatio || '')
      .trim()
      .toLowerCase(),
    _0x7f0c45 =
      _0xffc67c === 'auto' || _0xffc67c === 'adaptive' || _0xffc67c === 'default' || _0xffc67c === '自适应',
    _0x1cb7fd = getApimartSeedreamPolicy(_0xded9a1);
  if (_0x1cb7fd.preserveAdaptiveInputRatio === true && _0x7f0c45 && hasSeedreamInputImages(_0xded9a1))
    return 'auto';
  const _0x15ecf2 = _0xded9a1.body?.resolution || _0x42ac75.imageSize || '2K',
    _0x2a9f0e = resolveProviderRatioPayload({
      provider: _0xded9a1.provider,
      model: _0x42ac75.model,
      ratioLabel: _0x16fb17 || _0x42ac75.resolvedRatioLabel || _0x42ac75.aspectRatio,
      imageSize: _0x15ecf2,
      suppressAspectRatio: _0x42ac75.suppressAspectRatio,
    });
  return _0x2a9f0e?.params?.size || undefined;
}
function firstArrayItem(_0x2372ad) {
  if (Array.isArray(_0x2372ad)) return _0x2372ad[0] || undefined;
  return _0x2372ad || undefined;
}
function secondArrayItem(_0x251fb5) {
  if (Array.isArray(_0x251fb5)) return _0x251fb5[1] || undefined;
  return undefined;
}
function normalizeBooleanParam(_0xbe768b) {
  if (_0xbe768b === true || _0xbe768b === false) return _0xbe768b;
  const _0x2749b4 = String(_0xbe768b ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(_0x2749b4)) return true;
  if (['false', '0', 'no', 'off', ''].includes(_0x2749b4)) return false;
  return Boolean(_0xbe768b);
}
function normalizeApimartImageCount(_0x1a2dfd) {
  const _0x34da40 = Number.parseInt(String(_0x1a2dfd ?? '').trim(), 10);
  if (!Number.isFinite(_0x34da40)) return 1;
  return Math.max(1, Math.min(4, _0x34da40));
}
function normalizeApimartQwenImageCount(_0x54f5ba) {
  const _0xea0e7a = Number.parseInt(String(_0x54f5ba ?? '').trim(), 10);
  if (!Number.isFinite(_0xea0e7a)) return 1;
  return Math.max(1, Math.min(6, _0xea0e7a));
}
function normalizeApimartQwenImageResolution(_0x18e579) {
  const _0x495a10 = String(_0x18e579 || '1K')
    .trim()
    .toUpperCase();
  return _0x495a10 === '2K' ? '2K' : '1K';
}
function getApimartSeedreamPolicy(_0x11dfac = {}) {
  const _0x1b7aad = _0x11dfac.executionManifest?.extensions?.apimartSeedream;
  return _0x1b7aad && typeof _0x1b7aad === 'object' && !Array.isArray(_0x1b7aad) ? _0x1b7aad : {};
}
function getVolcengineSeedreamPolicy(_0x3f9bf2 = {}) {
  const _0x4fe608 = _0x3f9bf2.executionManifest?.extensions?.volcengineSeedream;
  return _0x4fe608 && typeof _0x4fe608 === 'object' && !Array.isArray(_0x4fe608) ? _0x4fe608 : {};
}
function normalizeResolutionList(_0x53ff17) {
  return Array.isArray(_0x53ff17)
    ? _0x53ff17
        .map((_0x477339) =>
          String(_0x477339 || '')
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean)
    : [];
}
function normalizeApimartSeedreamResolution(_0x5e5128, { context: _0x9e3497 } = {}) {
  const _0x441f6d = getApimartSeedreamPolicy(_0x9e3497),
    _0x14a7d2 = String(_0x5e5128 || '2K')
      .trim()
      .toUpperCase(),
    _0x574bcd = normalizeResolutionList(_0x441f6d.allowedResolutions);
  return _0x574bcd.includes(_0x14a7d2) ? _0x14a7d2 : '2K';
}
function normalizeVolcengineSeedreamResolution(_0x51fb32, { context: _0x8d5b6e } = {}) {
  const _0x524afc = getVolcengineSeedreamPolicy(_0x8d5b6e),
    _0x4e827a = String(_0x524afc.defaultResolution || '2K')
      .trim()
      .toUpperCase(),
    _0x16ab87 = String(_0x51fb32 || _0x4e827a)
      .trim()
      .toUpperCase(),
    _0x253c50 = normalizeResolutionList(_0x524afc.allowedResolutions);
  return _0x253c50.includes(_0x16ab87) ? _0x16ab87 : _0x4e827a;
}
function hasSeedreamInputImages(_0x18499e = {}) {
  if (Array.isArray(_0x18499e.inputImages) && _0x18499e.inputImages.length > 0) return true;
  const _0x3049ce = _0x18499e.payload || {},
    _0x4a3429 = [
      _0x3049ce.inputUrls,
      _0x3049ce.image_urls,
      _0x3049ce.imageUrls,
      _0x3049ce.image,
      _0x3049ce.images,
    ];
  return _0x4a3429.some((_0x3a1508) =>
    Array.isArray(_0x3a1508)
      ? _0x3a1508.some((_0x234b2a) => String(_0x234b2a || '').trim())
      : String(_0x3a1508 || '').trim(),
  );
}
function hasManifestInputImages(_0x1d5756 = {}) {
  if (Array.isArray(_0x1d5756.inputImages) && _0x1d5756.inputImages.length > 0) return true;
  const _0x27de03 = _0x1d5756.payload || {},
    _0x56f97a = [
      _0x27de03.inputUrls,
      _0x27de03.image_urls,
      _0x27de03.imageUrls,
      _0x27de03.image,
      _0x27de03.images,
    ];
  return (
    _0x56f97a.some((_0x2c8331) =>
      Array.isArray(_0x2c8331)
        ? _0x2c8331.some((_0x2eb668) => String(_0x2eb668 || '').trim())
        : String(_0x2c8331 || '').trim(),
    ) || Object.values(normalizeInputUrlsBySlot(_0x27de03.inputUrlsBySlot)).some(Boolean)
  );
}
function normalizeApimartSeedreamImageCount(_0x4ed19e, { context: _0x22c9c8 } = {}) {
  const _0x249fd5 = getApimartSeedreamPolicy(_0x22c9c8),
    _0x56e0b2 = Number.parseInt(String(_0x4ed19e ?? '').trim(), 10),
    _0x45a601 = Number.isFinite(_0x56e0b2) ? _0x56e0b2 : 1,
    _0x18f946 = Number.parseInt(String(_0x249fd5.maxBatchSize ?? 1).trim(), 10),
    _0x4c55ea = Number.isFinite(_0x18f946) && _0x18f946 >= 1 ? _0x18f946 : 1,
    _0xd225aa = Math.max(1, Math.min(_0x4c55ea, _0x45a601));
  if (!hasSeedreamInputImages(_0x22c9c8)) {
    const _0x49deaf = Number.parseInt(String(_0x249fd5.textToImageBatchSize ?? '').trim(), 10);
    if (Number.isFinite(_0x49deaf) && _0x49deaf >= 1) return Math.min(_0xd225aa, _0x49deaf);
  }
  return _0xd225aa;
}
function normalizeVolcengineSeedreamCountValue(_0x3845a3, _0x360859 = {}) {
  const _0x22b9c9 = getVolcengineSeedreamPolicy(_0x360859),
    _0x28337d = Number.parseInt(String(_0x3845a3 ?? '').trim(), 10),
    _0xc03ad2 = Number.isFinite(_0x28337d) ? _0x28337d : 1,
    _0x43cee6 = Number.parseInt(String(_0x22b9c9.maxBatchSize ?? 1).trim(), 10),
    _0x50f29c = Number.isFinite(_0x43cee6) && _0x43cee6 >= 1 ? _0x43cee6 : 1;
  return Math.max(1, Math.min(_0x50f29c, _0xc03ad2));
}
function normalizeVolcengineSeedreamImageCount(_0x135268, { context: _0xb5752e } = {}) {
  const _0x1e39f6 = normalizeVolcengineSeedreamCountValue(_0x135268, _0xb5752e);
  return _0x1e39f6 > 1 ? _0x1e39f6 : undefined;
}
function resolveVolcengineSeedreamSequentialMode(_0x387edc, { context: _0x539c36 } = {}) {
  const _0xd57890 = normalizeVolcengineSeedreamCountValue(_0x387edc, _0x539c36);
  return _0xd57890 > 1 ? 'auto' : 'disabled';
}
function resolveVolcengineSeedreamSize(_0x29ef88, { context: _0x1ed71f } = {}) {
  const _0x17b417 = _0x1ed71f?.payload || {},
    _0x57e57b = getVolcengineSeedreamPolicy(_0x1ed71f),
    _0x4e61d7 = normalizeVolcengineSeedreamResolution(_0x17b417.imageSize, { context: _0x1ed71f });
  if (_0x17b417.suppressAspectRatio) return _0x4e61d7;
  const _0x4e9e42 = String(_0x29ef88 || _0x17b417.resolvedRatioLabel || _0x17b417.aspectRatio || '').trim(),
    _0x773c7d = _0x4e9e42.toLowerCase(),
    _0x3588ac = !_0x4e9e42 || _0x773c7d === 'auto' || _0x773c7d === 'adaptive' || _0x773c7d === '自适应';
  if (
    _0x57e57b.preserveAdaptiveInputRatio === true &&
    _0x57e57b.supportsAdaptiveSize === true &&
    _0x3588ac &&
    hasSeedreamInputImages(_0x1ed71f)
  )
    return 'adaptive';
  const _0x488a12 = resolveProviderRatioPayload({
      provider: _0x1ed71f.provider,
      model: _0x17b417.model,
      ratioLabel: _0x4e9e42 || _0x17b417.resolvedRatioLabel || _0x17b417.aspectRatio || '1:1',
      imageSize: _0x4e61d7,
      suppressAspectRatio: false,
    }),
    _0x279265 = _0x488a12?.resolvedRatioLabel || '1:1',
    _0x1530ae =
      _0x57e57b.dimensionMapByResolution && typeof _0x57e57b.dimensionMapByResolution === 'object'
        ? _0x57e57b.dimensionMapByResolution[_0x4e61d7]
        : null;
  if (_0x1530ae?.[_0x279265]) return _0x1530ae[_0x279265];
  const _0x175279 = Number(_0x488a12?.params?.width),
    _0x4ed546 = Number(_0x488a12?.params?.height);
  if (Number.isFinite(_0x175279) && _0x175279 > 0 && Number.isFinite(_0x4ed546) && _0x4ed546 > 0)
    return Math.round(_0x175279) + 'x' + Math.round(_0x4ed546);
  return _0x4e61d7;
}
function normalizeApimartWanImageResolution(_0x1a1687, { context: _0xc4c08c } = {}) {
  const _0x43f941 = String(_0x1a1687 || '2K')
      .trim()
      .toUpperCase(),
    _0x3d4857 = String(_0xc4c08c?.modelToken || '')
      .trim()
      .toLowerCase();
  if (_0x43f941 === '1K') return '1K';
  if (_0x43f941 === '4K' && _0x3d4857 === 'wan2.7-image-pro' && !hasManifestInputImages(_0xc4c08c))
    return '4K';
  return '2K';
}
function normalizeApimartVideoResolutionUpper(_0x3228f8) {
  const _0x1bc20f = String(_0x3228f8 || '720P')
    .trim()
    .toUpperCase();
  if (_0x1bc20f === '1080P') return '1080P';
  if (_0x1bc20f === '720P') return '720P';
  if (_0x1bc20f === '540P') return '540P';
  if (_0x1bc20f === '480P') return '480P';
  return '720P';
}
function normalizeApimartVideoResolutionLower(_0x56c6aa) {
  const _0x42aa70 = String(_0x56c6aa || '720p')
    .trim()
    .toLowerCase();
  if (_0x42aa70 === '1080p') return '1080p';
  return '720p';
}
function normalizeApimartVeo3VideoResolution(_0x26c41a) {
  const _0x1353b9 = String(_0x26c41a || '720p')
    .trim()
    .toLowerCase();
  if (_0x1353b9 === '4k') return '4k';
  if (_0x1353b9 === '1080p') return '1080p';
  return '720p';
}
function normalizeApimartViduQ3ModelToken(_0x12eb71 = {}) {
  return String(
    _0x12eb71?.modelToken ||
      _0x12eb71?.body?.model ||
      _0x12eb71?.payload?.generationParams?.mode ||
      _0x12eb71?.payload?.mode ||
      'viduq3-turbo',
  )
    .trim()
    .toLowerCase();
}
function normalizeApimartViduVideoResolution(_0x5218c6, { context: _0x290af0 } = {}) {
  const _0x4001c8 = String(_0x5218c6 || '720p')
      .trim()
      .toLowerCase(),
    _0x52bdff = normalizeApimartViduQ3ModelToken(_0x290af0);
  if (_0x52bdff === 'viduq3-mix') return _0x4001c8 === '1080p' ? '1080p' : '720p';
  if (_0x4001c8 === '540p' || _0x4001c8 === '720p' || _0x4001c8 === '1080p') return _0x4001c8;
  return '720p';
}
function normalizeApimartViduVideoDuration(_0x5027a5, { context: _0x3fd7ac } = {}) {
  const _0x2d847b = normalizeApimartViduQ3ModelToken(_0x3fd7ac),
    _0x1bd1d1 = _0x2d847b === 'viduq3' ? 3 : 1,
    _0x26d9a9 = 16,
    _0x28ee61 = Number(_0x5027a5),
    _0x14d016 = 5,
    _0x95836d = Number.isFinite(_0x28ee61) ? Math.trunc(_0x28ee61) : _0x14d016;
  return Math.min(_0x26d9a9, Math.max(_0x1bd1d1, _0x95836d));
}
function normalizeApimartHailuoVideoResolution(_0x45bf5d) {
  const _0x40be82 = String(_0x45bf5d || '768p')
    .trim()
    .toLowerCase();
  if (_0x40be82 === '512p' || _0x40be82 === '768p' || _0x40be82 === '1080p') return _0x40be82;
  return '768p';
}
function normalizeApimartHailuoVideoDuration(_0x10704a, { context: _0x4e76df } = {}) {
  const _0x272994 = String(
    _0x4e76df?.body?.resolution ||
      _0x4e76df?.payload?.generationParams?.resolution ||
      _0x4e76df?.payload?.resolution ||
      '',
  )
    .trim()
    .toLowerCase();
  if (_0x272994 === '1080p') return 5;
  return Number(_0x10704a) === 10 ? 10 : 5;
}
function normalizeApimartHailuo23VideoResolution(_0x575816) {
  const _0x44a3f9 = String(_0x575816 || '768p')
    .trim()
    .toLowerCase();
  if (_0x44a3f9 === '1080p') return '1080p';
  return '768p';
}
function normalizeApimartHailuo23VideoDuration(_0x1021a3, { context: _0x2aed73 } = {}) {
  const _0x3e678f = String(
    _0x2aed73?.body?.resolution ||
      _0x2aed73?.payload?.generationParams?.resolution ||
      _0x2aed73?.payload?.resolution ||
      '',
  )
    .trim()
    .toLowerCase();
  if (_0x3e678f === '1080p') return 6;
  return Number(_0x1021a3) === 10 ? 10 : 6;
}
function normalizeApimartVideoRatio(_0x455f18) {
  const _0x4d01de = String(_0x455f18 ?? '').trim(),
    _0x3b3197 = _0x4d01de.toLowerCase();
  if (
    !_0x4d01de ||
    _0x3b3197 === 'auto' ||
    _0x3b3197 === 'adaptive' ||
    _0x3b3197 === 'default' ||
    _0x4d01de === '自适应' ||
    _0x4d01de === '默认'
  )
    return undefined;
  return _0x4d01de;
}
const AGNES_IMAGE_SIZE_BY_RATIO = Object.freeze({
    '1:1': '1024x1024',
    '4:3': '1024x768',
    '3:4': '768x1024',
    '3:2': '1024x682',
    '2:3': '682x1024',
    '16:9': '1024x576',
    '9:16': '576x1024',
  }),
  AGNES_VIDEO_DIMENSIONS_BY_RATIO = Object.freeze({
    '1:1': Object.freeze({ width: 0x400, height: 0x400 }),
    '4:3': Object.freeze({ width: 0x400, height: 0x300 }),
    '3:4': Object.freeze({ width: 0x300, height: 0x400 }),
    '3:2': Object.freeze({ width: 0x480, height: 0x300 }),
    '2:3': Object.freeze({ width: 0x300, height: 0x480 }),
    '16:9': Object.freeze({ width: 0x480, height: 0x288 }),
    '9:16': Object.freeze({ width: 0x288, height: 0x480 }),
  });
function normalizeAgnesRatioLabel(_0x54cbea, _0x2d5ffe = '4:3') {
  const _0x4fd2f6 = String(_0x54cbea || '').trim();
  if (/^\d+x\d+$/i.test(_0x4fd2f6)) return _0x4fd2f6.toLowerCase();
  const _0x1d1fe0 = _0x4fd2f6.replace(/\s+/g, '').replace('：', ':').toLowerCase();
  if (!_0x1d1fe0 || ['auto', 'adaptive', 'default'].includes(_0x1d1fe0)) return _0x2d5ffe;
  const _0x2681db = /^(\d+)[/:x](\d+)$/i.exec(_0x1d1fe0);
  if (!_0x2681db) return _0x2d5ffe;
  return Number(_0x2681db[1]) + ':' + Number(_0x2681db[2]);
}
function normalizeAgnesVideoResolution(_0x3280ec, _0x4c7f9a = {}) {
  const _0x176e18 = String(
    _0x3280ec ||
      _0x4c7f9a?.payload?.generationParams?.resolution ||
      _0x4c7f9a?.payload?.resolution ||
      _0x4c7f9a?.payload?.videoSize ||
      '720P',
  )
    .trim()
    .toUpperCase();
  return _0x176e18 === '1080P' ? '1080P' : '720P';
}
function normalizeAgnesImageSize(_0x1bc49a, { context: _0x472998 } = {}) {
  const _0x40b36a =
      _0x1bc49a ||
      _0x472998?.payload?.resolvedRatioLabel ||
      _0x472998?.payload?.generationParams?.aspectRatio ||
      _0x472998?.payload?.aspectRatio,
    _0x83a2c9 = String(_0x40b36a || '').trim();
  if (/^\d+x\d+$/i.test(_0x83a2c9)) return _0x83a2c9.toLowerCase();
  const _0xc7c4a = normalizeAgnesRatioLabel(_0x40b36a, '4:3');
  return AGNES_IMAGE_SIZE_BY_RATIO[_0xc7c4a] || AGNES_IMAGE_SIZE_BY_RATIO['4:3'];
}
function resolveAgnesVideoDimensions(_0x5ac7f6, _0x2ff9ba = {}) {
  const _0x3c925c =
      _0x5ac7f6 ||
      _0x2ff9ba?.payload?.resolvedRatioLabel ||
      _0x2ff9ba?.payload?.generationParams?.aspectRatio ||
      _0x2ff9ba?.payload?.aspectRatio,
    _0x40b986 = normalizeAgnesRatioLabel(_0x3c925c, '3:2'),
    _0x36e063 = AGNES_VIDEO_DIMENSIONS_BY_RATIO[_0x40b986] || AGNES_VIDEO_DIMENSIONS_BY_RATIO['3:2'];
  if (normalizeAgnesVideoResolution('', _0x2ff9ba) !== '1080P') return _0x36e063;
  return Object.freeze({
    width: Math.round(_0x36e063.width * 1.5),
    height: Math.round(_0x36e063.height * 1.5),
  });
}
function normalizeAgnesVideoWidth(_0x3d2b4e, { context: _0x115ec9 } = {}) {
  return resolveAgnesVideoDimensions(_0x3d2b4e, _0x115ec9).width;
}
function normalizeAgnesVideoHeight(_0xd8bd57, { context: _0x1044dd } = {}) {
  return resolveAgnesVideoDimensions(_0xd8bd57, _0x1044dd).height;
}
function normalizeAgnesVideoNumFrames(_0x13fcb, { spec: _0x342079 } = {}) {
  const _0x64fb8c = Number(_0x13fcb),
    _0x8a1e55 = Number.isFinite(_0x64fb8c) && _0x64fb8c > 0 ? _0x64fb8c : 5,
    _0x177d0b = Number.isFinite(Number(_0x342079?.frameRate)) ? Number(_0x342079.frameRate) : 24,
    _0x2e2fc6 = Number.isFinite(Number(_0x342079?.min)) ? Math.trunc(Number(_0x342079.min)) : 49,
    _0x2a0af1 = Number.isFinite(Number(_0x342079?.max)) ? Math.trunc(Number(_0x342079.max)) : 0x1b9,
    _0x19b2b3 = Math.max(1, _0x2e2fc6),
    _0x212ecb = Math.max(_0x19b2b3, _0x2a0af1),
    _0x5cdeb7 = Math.max(_0x19b2b3, Math.round(_0x8a1e55 * _0x177d0b) + 1),
    _0x21aa53 = Math.min(_0x5cdeb7, _0x212ecb),
    _0x2d159c = Math.round((_0x21aa53 - 1) / 8) * 8 + 1;
  return Math.min(_0x212ecb, Math.max(_0x19b2b3, _0x2d159c));
}
function normalizeApimartOptionalText(_0x448c87) {
  const _0x35c9bd = String(_0x448c87 ?? '').trim(),
    _0x11a962 = _0x35c9bd.toLowerCase();
  if (!_0x35c9bd || _0x11a962 === 'auto' || _0x11a962 === 'none') return undefined;
  return _0x35c9bd;
}
function normalizeApimartOptionalInteger(_0x479c13) {
  const _0x456ca0 = String(_0x479c13 ?? '').trim(),
    _0x1e1d40 = _0x456ca0.toLowerCase();
  if (!_0x456ca0 || _0x1e1d40 === 'auto' || _0x1e1d40 === 'none') return undefined;
  const _0x34b2b2 = Number(_0x456ca0);
  return Number.isFinite(_0x34b2b2) ? Math.trunc(_0x34b2b2) : undefined;
}
function resolveSeedModeValue(_0x1c09b5 = {}, _0x5eae7a = 'seed_mode', _0x4f361c = 'fixed') {
  const _0x9fd799 = String(_0x5eae7a || 'seed_mode').trim(),
    _0x10a7cb =
      _0x1c09b5?.generationParams &&
      typeof _0x1c09b5.generationParams === 'object' &&
      !Array.isArray(_0x1c09b5.generationParams)
        ? _0x1c09b5.generationParams
        : {},
    _0x452184 =
      _0x10a7cb[_0x9fd799] ?? _0x10a7cb.seedMode ?? _0x1c09b5[_0x9fd799] ?? _0x1c09b5.seedMode ?? _0x4f361c,
    _0x58e16d = String(_0x452184 ?? _0x4f361c)
      .trim()
      .toLowerCase();
  return _0x58e16d === 'random' ? 'random' : 'fixed';
}
function generateIntegerSeed(_0x36483e, _0x5d803d) {
  const _0x4c3c60 = Math.min(_0x36483e, _0x5d803d),
    _0x4b32d9 = Math.max(_0x36483e, _0x5d803d);
  return _0x4c3c60 + Math.floor(Math.random() * (_0x4b32d9 - _0x4c3c60 + 1));
}
function normalizeAgnesVideoSeed(_0x48e8ec, { context: _0x1101c3, spec: _0x4ecce6 } = {}) {
  const _0xd2b08 = resolveSeedModeValue(
    _0x1101c3?.payload || {},
    _0x4ecce6?.modeField,
    _0x4ecce6?.defaultMode || 'random',
  );
  if (_0xd2b08 === 'random') {
    const _0xcc3ac3 = Number.isFinite(Number(_0x4ecce6?.min)) ? Math.trunc(Number(_0x4ecce6.min)) : 0,
      _0x42ce66 = Number.isFinite(Number(_0x4ecce6?.max)) ? Math.trunc(Number(_0x4ecce6.max)) : 0x7fffffff;
    return generateIntegerSeed(_0xcc3ac3, _0x42ce66);
  }
  return normalizeApimartOptionalInteger(_0x48e8ec);
}
function normalizeIntegerRange(_0x36eecd, { spec: _0x583cde } = {}) {
  const _0x3c21e5 = Number(_0x36eecd),
    _0x327238 = Number.isFinite(Number(_0x583cde?.fallback)) ? Math.trunc(Number(_0x583cde.fallback)) : 0,
    _0xdaed66 = Number.isFinite(_0x3c21e5) ? Math.trunc(_0x3c21e5) : _0x327238,
    _0x16dbdf = Number.isFinite(Number(_0x583cde?.min)) ? Math.trunc(Number(_0x583cde.min)) : _0xdaed66,
    _0x4976b3 = Number.isFinite(Number(_0x583cde?.max)) ? Math.trunc(Number(_0x583cde.max)) : _0xdaed66;
  return Math.min(Math.max(_0xdaed66, _0x16dbdf), _0x4976b3);
}
function formatAllowedImageCounts(_0x40e80a) {
  if (_0x40e80a.length <= 1) return String(_0x40e80a[0] ?? '');
  if (_0x40e80a.length === 2) return _0x40e80a[0] + ' or ' + _0x40e80a[1];
  return _0x40e80a.slice(0, -1).join(', ') + ', or ' + _0x40e80a.at(-1);
}
function normalizeImageCountOptions(_0x7d6fed, { spec: _0x155965 } = {}) {
  const _0x32e1b6 = (Array.isArray(_0x7d6fed) ? _0x7d6fed : [])
    .map((_0x565738) => String(_0x565738 || '').trim())
    .filter(Boolean);
  if (_0x32e1b6.length === 0) return _0x32e1b6;
  const _0x4d5d4b = (Array.isArray(_0x155965?.allowedCounts) ? _0x155965.allowedCounts : [])
    .map((_0x4fb142) => Number(_0x4fb142))
    .filter((_0x3f570b) => Number.isInteger(_0x3f570b) && _0x3f570b >= 0);
  if (_0x4d5d4b.length === 0 || _0x4d5d4b.includes(_0x32e1b6.length)) return _0x32e1b6;
  const _0x37b0e3 = String(_0x155965?.label || 'This model').trim() || 'This model';
  throw new Error(_0x37b0e3 + ' supports only ' + formatAllowedImageCounts(_0x4d5d4b) + ' reference images');
}
function normalizeApimartKlingVideoMode(_0x17a0cb) {
  const _0x581bd2 = String(_0x17a0cb || '')
    .trim()
    .toLowerCase();
  return _0x581bd2 === 'pro' ? 'pro' : 'std';
}
function normalizeApimartKlingVideoMode4k(_0x33f4ba) {
  const _0x1963e8 = String(_0x33f4ba || '')
    .trim()
    .toLowerCase();
  if (_0x1963e8 === '4k') return '4k';
  return _0x1963e8 === 'pro' ? 'pro' : 'std';
}
function normalizeRunningHubKlingVideoMode(_0x4a4565) {
  return normalizeApimartKlingVideoMode(_0x4a4565);
}
function normalizeRunningHubKlingV3Model(_0x4b1c8a) {
  const _0x4d8119 = String(_0x4b1c8a || '')
    .trim()
    .toLowerCase();
  if (_0x4d8119 === '4k') return '4k';
  if (_0x4d8119 === 'pro') return 'pro';
  return 'std';
}
function normalizeRunningHubKlingV3AspectRatio(_0x3c30c6) {
  const _0x48d9e9 = normalizeApimartVideoRatio(_0x3c30c6);
  return ['16:9', '9:16', '1:1'].includes(_0x48d9e9) ? _0x48d9e9 : undefined;
}
function normalizeRunningHubKlingV3Duration(_0x1aeb14) {
  const _0x4b0e7e = Math.trunc(Number(_0x1aeb14)),
    _0x59f892 = Number.isFinite(_0x4b0e7e) ? _0x4b0e7e : 5;
  return String(Math.min(15, Math.max(3, _0x59f892)));
}
function normalizeRunningHubKlingV3CfgScale(_0x5ac450) {
  const _0x5d6918 = Number(_0x5ac450);
  if (!Number.isFinite(_0x5d6918)) return 0.5;
  return Math.min(1, Math.max(0, Math.round(_0x5d6918 * 10) / 10));
}
function normalizeRunningHubKlingV3ShotType(_0x1a82eb) {
  const _0x39d686 = String(_0x1a82eb || '')
    .trim()
    .toLowerCase();
  return _0x39d686 === 'intelligence' ? 'intelligence' : 'customize';
}
function normalizeRunningHubKlingO3Model(_0x342873) {
  return normalizeRunningHubKlingV3Model(_0x342873);
}
function normalizeRunningHubKlingO3AspectRatio(_0x257aa2) {
  return normalizeRunningHubKlingV3AspectRatio(_0x257aa2);
}
function normalizeRunningHubKlingO3Duration(_0x185192) {
  return normalizeRunningHubKlingV3Duration(_0x185192);
}
function normalizeRunningHubKlingO3ShotType(_0x574d20) {
  return normalizeRunningHubKlingV3ShotType(_0x574d20);
}
function normalizeRunningHubKlingO1AspectRatio(_0x3bad49) {
  const _0x46ddae = String(_0x3bad49 || '9:16').trim();
  return ['16:9', '9:16', '1:1'].includes(_0x46ddae) ? _0x46ddae : '9:16';
}
function normalizeRunningHubKlingO1Duration(_0x94d91d) {
  const _0x502e9b = Number(_0x94d91d);
  return Number.isFinite(_0x502e9b) && Math.trunc(_0x502e9b) === 10 ? '10' : '5';
}
function normalizeRunningHubHailuo02Duration(_0x3861d7) {
  const _0x5c1cc0 = Number(_0x3861d7);
  return Number.isFinite(_0x5c1cc0) && Math.trunc(_0x5c1cc0) === 10 ? '10' : '6';
}
function normalizeRunningHubHailuo23Duration(_0x35fc74) {
  const _0x28f8a7 = Number(_0x35fc74);
  return Number.isFinite(_0x28f8a7) && Math.trunc(_0x28f8a7) === 10 ? '10' : '6';
}
function normalizeRunningHubHappyHorseResolution(_0x23e539) {
  return normalizeApimartVideoResolutionLower(_0x23e539);
}
function normalizeRunningHubHappyHorseAspectRatio(_0x52e7cc) {
  const _0x2fb17b = normalizeApimartVideoRatio(_0x52e7cc);
  return ['16:9', '9:16', '1:1', '4:3', '3:4'].includes(_0x2fb17b) ? _0x2fb17b : undefined;
}
function normalizeRunningHubHappyHorseDuration(_0x14271c) {
  const _0x161173 = Math.trunc(Number(_0x14271c)),
    _0x29fac6 = Number.isFinite(_0x161173) ? _0x161173 : 5;
  return String(Math.min(15, Math.max(3, _0x29fac6)));
}
function normalizeRunningHubHappyHorseAudioSetting(_0x30fc44) {
  const _0x2b81ca = String(_0x30fc44 || '')
    .trim()
    .toLowerCase();
  return _0x2b81ca === 'origin' ? 'origin' : 'auto';
}
function normalizeRunningHubSeedance2Resolution(_0x503510) {
  const _0x1424d3 = String(_0x503510 || '720p')
    .trim()
    .toLowerCase();
  if (_0x1424d3 === 'native1080p') return 'native1080p';
  if (['480p', '720p', '1080p', '2k', '4k'].includes(_0x1424d3)) return _0x1424d3;
  return '720p';
}
function normalizeRunningHubSeedance2Duration(_0x93ec14) {
  const _0x1e359a = Math.trunc(Number(_0x93ec14)),
    _0x3d5636 = Number.isFinite(_0x1e359a) ? _0x1e359a : 5;
  return String(Math.min(15, Math.max(4, _0x3d5636)));
}
function normalizeRunningHubSeedance2Ratio(_0x2bf5bc) {
  const _0x45bde2 = String(_0x2bf5bc ?? '').trim(),
    _0x491d34 = _0x45bde2.toLowerCase();
  if (
    !_0x45bde2 ||
    _0x491d34 === 'auto' ||
    _0x491d34 === 'adaptive' ||
    _0x491d34 === 'default' ||
    _0x45bde2 === '自适应' ||
    _0x45bde2 === '默认'
  )
    return 'adaptive';
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'].includes(_0x45bde2) ? _0x45bde2 : 'adaptive';
}
function normalizeRunningHubVeo3Resolution(_0x2fc724) {
  const _0x34e3e7 = String(_0x2fc724 || '720p')
    .trim()
    .toLowerCase();
  if (_0x34e3e7 === '4k') return '4k';
  if (_0x34e3e7 === '1080p') return '1080p';
  return '720p';
}
function normalizeRunningHubVeo3AspectRatio(_0x41c1ee) {
  const _0xf930c0 = normalizeApimartVideoRatio(_0x41c1ee);
  return ['16:9', '9:16'].includes(_0xf930c0) ? _0xf930c0 : undefined;
}
function normalizeRunningHubVeo3Duration(_0x2296bd) {
  const _0x13ee79 = Math.trunc(Number(_0x2296bd));
  return [4, 6, 8].includes(_0x13ee79) ? String(_0x13ee79) : '8';
}
function normalizeRunningHubWan27Mode(_0x25555c = {}) {
  const _0x1bbbe3 = String(
    _0x25555c?.payload?.generationParams?.wan27_mode ||
      _0x25555c?.payload?.wan27_mode ||
      _0x25555c?.body?.wan27_mode ||
      'image',
  )
    .trim()
    .toLowerCase();
  return _0x1bbbe3 === 'video' || _0x1bbbe3 === 'reference' || _0x1bbbe3 === 'edit' ? _0x1bbbe3 : 'image';
}
function normalizeRunningHubWan27Resolution(_0x3062b9) {
  const _0x38bcde = String(_0x3062b9 || '720P')
    .trim()
    .toUpperCase();
  return _0x38bcde === '1080P' ? '1080P' : '720P';
}
function normalizeRunningHubWan27AspectRatio(_0x3a1a4a) {
  const _0x5b92ca = normalizeApimartVideoRatio(_0x3a1a4a);
  return ['16:9', '9:16', '1:1', '4:3', '3:4'].includes(_0x5b92ca) ? _0x5b92ca : undefined;
}
function normalizeRunningHubWan27Duration(_0x31d563, { context: _0x38fa0b } = {}) {
  const _0x46f8db = Math.trunc(Number(_0x31d563)),
    _0xde1736 = normalizeRunningHubWan27Mode(_0x38fa0b);
  if (_0xde1736 === 'edit') {
    if (_0x46f8db === 0) return '0';
    const _0x458028 = Number.isFinite(_0x46f8db) ? _0x46f8db : 5;
    return String(Math.min(10, Math.max(2, _0x458028)));
  }
  const _0x1a2aca = Number.isFinite(_0x46f8db) ? _0x46f8db : 5;
  return String(Math.min(15, Math.max(5, _0x1a2aca)));
}
function resolveApimartGoogleSearch(_0x12efd9, { context: _0x2ab850 }) {
  const _0x4efd20 = _0x2ab850?.payload || {};
  return normalizeBooleanParam(_0x12efd9) || normalizeBooleanParam(_0x4efd20.google_image_search);
}
function resolveApimartGoogleImageSearch(_0x56cd10, { context: _0xb8e7ba }) {
  const _0x2394ed = _0xb8e7ba?.body || {},
    _0x25b0e1 = _0xb8e7ba?.payload || {};
  return (
    normalizeBooleanParam(_0x56cd10) &&
    normalizeBooleanParam(_0x2394ed.google_search ?? _0x25b0e1.google_search)
  );
}
const BODY_MAPPING_TRANSFORMS = Object.freeze({
  apimartNanoBanana2Resolution: (_0x547033) => normalizeApimartNanoBanana2Resolution(_0x547033),
  apimartGptImage2Resolution: (_0x34afd5) => normalizeApimartGptImage2Resolution(_0x34afd5),
  apimartImageCount: normalizeApimartImageCount,
  apimartQwenImageCount: normalizeApimartQwenImageCount,
  apimartQwenImageResolution: normalizeApimartQwenImageResolution,
  apimartSeedreamResolution: normalizeApimartSeedreamResolution,
  apimartSeedreamImageCount: normalizeApimartSeedreamImageCount,
  volcengineSeedreamSize: resolveVolcengineSeedreamSize,
  volcengineSeedreamImageCount: normalizeVolcengineSeedreamImageCount,
  volcengineSeedreamSequentialMode: resolveVolcengineSeedreamSequentialMode,
  apimartWanImageResolution: normalizeApimartWanImageResolution,
  apimartVideoResolutionUpper: normalizeApimartVideoResolutionUpper,
  apimartVideoResolutionLower: normalizeApimartVideoResolutionLower,
  apimartVeo3VideoResolution: normalizeApimartVeo3VideoResolution,
  apimartViduVideoResolution: normalizeApimartViduVideoResolution,
  apimartViduVideoDuration: normalizeApimartViduVideoDuration,
  apimartHailuoVideoResolution: normalizeApimartHailuoVideoResolution,
  apimartHailuoVideoDuration: normalizeApimartHailuoVideoDuration,
  apimartHailuo23VideoResolution: normalizeApimartHailuo23VideoResolution,
  apimartHailuo23VideoDuration: normalizeApimartHailuo23VideoDuration,
  apimartVideoRatio: normalizeApimartVideoRatio,
  agnesImageSize: normalizeAgnesImageSize,
  agnesVideoWidth: normalizeAgnesVideoWidth,
  agnesVideoHeight: normalizeAgnesVideoHeight,
  agnesVideoNumFrames: normalizeAgnesVideoNumFrames,
  agnesVideoSeed: normalizeAgnesVideoSeed,
  apimartOptionalText: normalizeApimartOptionalText,
  apimartOptionalInteger: normalizeApimartOptionalInteger,
  integerRange: normalizeIntegerRange,
  imageCountOptions: normalizeImageCountOptions,
  apimartKlingVideoMode: normalizeApimartKlingVideoMode,
  apimartKlingVideoMode4k: normalizeApimartKlingVideoMode4k,
  runninghubKlingVideoMode: normalizeRunningHubKlingVideoMode,
  runninghubKlingV3Model: normalizeRunningHubKlingV3Model,
  runninghubKlingV3AspectRatio: normalizeRunningHubKlingV3AspectRatio,
  runninghubKlingV3Duration: normalizeRunningHubKlingV3Duration,
  runninghubKlingV3CfgScale: normalizeRunningHubKlingV3CfgScale,
  runninghubKlingV3ShotType: normalizeRunningHubKlingV3ShotType,
  runninghubKlingO3Model: normalizeRunningHubKlingO3Model,
  runninghubKlingO3AspectRatio: normalizeRunningHubKlingO3AspectRatio,
  runninghubKlingO3Duration: normalizeRunningHubKlingO3Duration,
  runninghubKlingO3ShotType: normalizeRunningHubKlingO3ShotType,
  runninghubKlingO1AspectRatio: normalizeRunningHubKlingO1AspectRatio,
  runninghubKlingO1Duration: normalizeRunningHubKlingO1Duration,
  runninghubHailuo02Duration: normalizeRunningHubHailuo02Duration,
  runninghubHailuo23Duration: normalizeRunningHubHailuo23Duration,
  runninghubHappyHorseResolution: normalizeRunningHubHappyHorseResolution,
  runninghubHappyHorseAspectRatio: normalizeRunningHubHappyHorseAspectRatio,
  runninghubHappyHorseDuration: normalizeRunningHubHappyHorseDuration,
  runninghubHappyHorseAudioSetting: normalizeRunningHubHappyHorseAudioSetting,
  runninghubSeedance2Resolution: normalizeRunningHubSeedance2Resolution,
  runninghubSeedance2Duration: normalizeRunningHubSeedance2Duration,
  runninghubSeedance2Ratio: normalizeRunningHubSeedance2Ratio,
  runninghubVeo3Resolution: normalizeRunningHubVeo3Resolution,
  runninghubVeo3AspectRatio: normalizeRunningHubVeo3AspectRatio,
  runninghubVeo3Duration: normalizeRunningHubVeo3Duration,
  runninghubWan27Resolution: normalizeRunningHubWan27Resolution,
  runninghubWan27AspectRatio: normalizeRunningHubWan27AspectRatio,
  runninghubWan27Duration: normalizeRunningHubWan27Duration,
  apimartGoogleSearch: resolveApimartGoogleSearch,
  apimartGoogleImageSearch: resolveApimartGoogleImageSearch,
  booleanParam: normalizeBooleanParam,
  first: firstArrayItem,
  second: secondArrayItem,
  providerRatioSize: resolveProviderRatioSize,
});
function resolveRequestManifest(_0x3cbe51, _0x576778, _0x1cedfe) {
  let _0x1f3f72 = _0x3cbe51,
    _0x4d23ba = resolveModelExecution(_0x3cbe51.model, { providerHint: _0x576778 });
  if (
    _0x576778 &&
    (!_0x4d23ba?.modelManifest || _0x4d23ba.modelManifest.provider !== _0x576778) &&
    !String(_0x3cbe51.model || '').includes('/')
  ) {
    const _0x2481bc = _0x576778 + '/' + _0x3cbe51.model,
      _0x487696 = resolveModelExecution(_0x2481bc);
    _0x487696?.modelManifest?.provider === _0x576778 &&
      ((_0x4d23ba = _0x487696), (_0x1f3f72 = { ..._0x3cbe51, model: _0x2481bc }));
  }
  _0x4d23ba?.canonicalModelId &&
    _0x4d23ba.canonicalModelId !== String(_0x3cbe51.model || '').trim() &&
    (_0x1f3f72 = { ..._0x3cbe51, model: _0x4d23ba.canonicalModelId });
  const _0x516b20 = _0x4d23ba?.modelManifest,
    _0xd4fc45 = _0x4d23ba?.executionManifest;
  if (
    !_0x516b20 ||
    !_0xd4fc45 ||
    _0x516b20.adapterType !== 'modelApi' ||
    _0xd4fc45.adapterType !== 'modelApi' ||
    _0x516b20.kind !== _0x1cedfe ||
    _0xd4fc45.kind !== _0x1cedfe
  )
    return null;
  const _0x106a86 = _0x516b20.provider;
  if (_0x576778 && _0x106a86 !== _0x576778) return null;
  return {
    provider: _0x106a86,
    modelManifest: _0x516b20,
    executionManifest: _0xd4fc45,
    effectivePayload: _0x1f3f72,
  };
}
export async function buildManifestMappedBody(_0x37aaf4) {
  const _0x587337 = await buildBodyFromMapping({
      bodyMapping: _0x37aaf4.executionManifest.bodyMapping,
      context: _0x37aaf4,
      transforms: BODY_MAPPING_TRANSFORMS,
    }),
    _0x20cc36 = _0x37aaf4.executionManifest.extensions?.bodyResolver;
  if (!_0x20cc36) return _0x587337;
  const _0x29084d = getModelApiBodyResolver(_0x20cc36);
  if (typeof _0x29084d !== 'function') throw new Error('Unsupported model API bodyResolver: ' + _0x20cc36);
  return _0x29084d({ ..._0x37aaf4, currentBody: _0x587337 });
}
function resolveDefaultApiUrl(_0x177364, _0x14db3d, _0x5bfa97) {
  const _0x4c8590 =
    _0x177364 === 'grsai'
      ? String(_0x14db3d.apiUrl || '')
          .replace(/\/v1\/?$/, '')
          .replace(/\/+$/, '')
      : String(_0x14db3d.apiUrl || '').replace(/\/+$/, '');
  return '' + _0x4c8590 + _0x5bfa97.endpoint;
}
export function resolveManifestTaskPolling(_0x9fe3c9, _0x2c18de, _0xf82a49, _0x19c472) {
  const _0x56c9d1 = _0xf82a49.extensions?.taskPolling;
  if (!_0x56c9d1 || typeof _0x56c9d1 !== 'object' || Array.isArray(_0x56c9d1)) return null;
  const _0x27214c = String(_0x2c18de.apiUrl || '')
      .replace(/\/v1\/?$/, '')
      .replace(/\/+$/, ''),
    _0x414da9 = String(_0x56c9d1.urlTemplate || '').trim();
  return {
    method:
      String(_0x56c9d1.method || 'GET')
        .trim()
        .toUpperCase() || 'GET',
    mode: String(_0x56c9d1.mode || 'task-proxy').trim() || 'task-proxy',
    urlTemplate: _0x414da9.replace('{baseUrl}', _0x27214c),
    headersMode: String(_0x56c9d1.headersMode || 'bearer').trim() || 'bearer',
    provider: _0x9fe3c9,
    executionId: _0xf82a49.id,
    modelId: _0x19c472?.modelManifest?.modelId || '',
  };
}
export function resolveManifestApiUrl(_0x3f06cb, _0x153412, _0x4f5af3, _0x4efce8) {
  const _0x1285be = _0x4f5af3.extensions?.endpointResolver;
  if (!_0x1285be) return resolveDefaultApiUrl(_0x3f06cb, _0x153412, _0x4f5af3);
  const _0x44297d = getModelApiEndpointResolver(_0x1285be);
  if (typeof _0x44297d !== 'function')
    throw new Error('Unsupported model API endpointResolver: ' + _0x1285be);
  const _0x40a076 = _0x44297d({
    provider: _0x3f06cb,
    cfg: _0x153412,
    executionManifest: _0x4f5af3,
    ..._0x4efce8,
  });
  if (!_0x40a076) throw new Error('Model API endpointResolver returned empty url: ' + _0x1285be);
  return _0x40a076;
}
export async function buildVideoRequestFromManifest(_0x5967ab, _0x7d5fcf, _0x272451, _0x4d31db = {}) {
  const _0x248d83 = String(_0x4d31db.expectedProvider || '')
      .trim()
      .toLowerCase(),
    _0xea6638 = resolveRequestManifest(_0x5967ab, _0x248d83, 'video');
  if (!_0xea6638) return null;
  const {
    provider: _0x344087,
    modelManifest: _0x15e39d,
    executionManifest: _0x4d3c37,
    effectivePayload: _0x1f9bfa,
  } = _0xea6638;
  if (!VIDEO_MODEL_API_PROVIDERS.has(_0x344087)) return null;
  const _0x4e628e = sanitizeModelUiSchemaParams(_0x15e39d.modelId, _0x1f9bfa.generationParams, {
      includeDefaults: true,
    }),
    _0x2cdd80 = applyVideoAspectRatioExecutionFallback(
      { ..._0x1f9bfa, generationParams: mergeRootAspectRatioIntoGenerationParams(_0x1f9bfa, _0x4e628e) },
      _0x15e39d,
    ),
    _0x395c28 = _0x272451.getProviderConfig(_0x344087),
    _0x1e5c0c = resolveApiKey(_0x344087, _0x2cdd80, _0x272451);
  !_0x1e5c0c && throwMissingApiKey(_0x344087);
  const _0x247647 = _0x4d3c37.extensions?.bodyResolver === 'apimartSeedanceVideo',
    _0x2811f9 = _0x247647
      ? {}
      : await resolveInputImagesBySlot(_0x344087, _0x2cdd80, _0x1e5c0c, _0x272451, {
          modelManifest: _0x15e39d,
          baseUrl: _0x395c28.apiUrl,
          executionManifest: _0x4d3c37,
        }),
    _0x24e78a = Object.keys(_0x2811f9).length > 0,
    _0xd75ace = _0x24e78a
      ? Object.values(_0x2811f9)
          .map((_0x56757b) => String(_0x56757b || '').trim())
          .filter(Boolean)
      : [],
    _0x31a336 =
      !_0x247647 && (!_0x24e78a || _0x344087 === 'runninghub')
        ? await resolveVideoInputImages(
            _0x24e78a && _0x344087 === 'runninghub' ? omitSlotImageUrlsFromVideoInputs(_0x2cdd80) : _0x2cdd80,
            _0x1e5c0c,
            _0x272451,
            {
              modelManifest: _0x4d3c37.extensions?.bodyResolver ? null : _0x15e39d,
              provider: _0x344087,
              baseUrl: _0x395c28.apiUrl,
              executionManifest: _0x4d3c37,
            },
          )
        : [],
    _0x3f3d8e = _0x247647 ? [] : _0x24e78a ? Array.from(new Set([..._0xd75ace, ..._0x31a336])) : _0x31a336,
    _0x58afef = _0x247647
      ? []
      : await resolveInputVideos(_0x2cdd80, _0x1e5c0c, _0x272451, {
          modelManifest: _0x15e39d,
          provider: _0x344087,
          baseUrl: _0x395c28.apiUrl,
          executionManifest: _0x4d3c37,
        }),
    _0x5117c0 = _0x247647
      ? []
      : await resolveInputAudios(_0x2cdd80, _0x1e5c0c, _0x272451, {
          modelManifest: _0x15e39d,
          provider: _0x344087,
          baseUrl: _0x395c28.apiUrl,
          executionManifest: _0x4d3c37,
        }),
    _0x2fdd4c = resolveExecutionModelToken(_0x4d3c37, _0x2cdd80),
    _0x22dabe = {
      provider: _0x344087,
      modelManifest: _0x15e39d,
      executionManifest: _0x4d3c37,
      payload: _0x2cdd80,
      finalPrompt: _0x7d5fcf,
      modelToken: _0x2fdd4c,
      apiKey: _0x1e5c0c,
      ctx: _0x272451,
      finalUrls: _0x3f3d8e,
      finalUrlsBySlot: _0x2811f9,
      inputImages: _0x3f3d8e,
      inputVideos: _0x58afef,
      inputAudios: _0x5117c0,
    },
    _0x5f4ded = await buildManifestMappedBody(_0x22dabe);
  return {
    url: '/api/v2/proxy/image',
    headers: _0x4d3c37.headers || { 'Content-Type': 'application/json' },
    body: {
      apiUrl: resolveManifestApiUrl(_0x344087, _0x395c28, _0x4d3c37, _0x22dabe),
      apiKey: _0x1e5c0c,
      ..._0x5f4ded,
    },
    responseMapping: _0x4d3c37.responseMapping,
    taskPolling: resolveManifestTaskPolling(_0x344087, _0x395c28, _0x4d3c37, _0x22dabe),
    useOpenapiQuery: _0x344087 === 'runninghub',
    adapterTrace: { source: 'manifest', executionId: _0x4d3c37.id, modelId: _0x5967ab.model },
  };
}
export async function buildTextRequestFromManifest(_0x54caa7, _0x4e1b21, _0x56bb6d, _0x4e0467 = {}) {
  const _0x15a9be = String(_0x4e0467.expectedProvider || '')
      .trim()
      .toLowerCase(),
    _0x461c4a = resolveRequestManifest(_0x54caa7, _0x15a9be, 'text');
  if (!_0x461c4a) return null;
  const {
      provider: _0x2a3816,
      modelManifest: _0x5f55e7,
      executionManifest: _0x4990e2,
      effectivePayload: _0x487047,
    } = _0x461c4a,
    _0x14f0dc = _0x56bb6d.getProviderConfig(_0x2a3816),
    _0x467995 = resolveApiKey(_0x2a3816, _0x487047, _0x56bb6d) || _0x14f0dc.apiKey;
  if (!_0x467995) throwMissingApiKey(_0x2a3816);
  const _0x4b8698 = resolveExecutionModelToken(_0x4990e2, _0x487047),
    _0x23b2eb = {
      provider: _0x2a3816,
      modelManifest: _0x5f55e7,
      executionManifest: _0x4990e2,
      payload: _0x487047,
      finalPrompt: _0x4e1b21,
      modelToken: _0x4b8698,
      apiKey: _0x467995,
      ctx: _0x56bb6d,
      inputImages: [],
      inputVideos: [],
      inputAudios: [],
    };
  if (_0x4990e2.endpointMode === 'responses') {
    if (typeof _0x56bb6d.buildVolcengineResponsesUserContent !== 'function')
      throw new Error('responses text manifest requires user content resolver');
    const _0x147ccb =
        typeof _0x56bb6d.resolveChatCompletionInputUrls === 'function'
          ? _0x56bb6d.resolveChatCompletionInputUrls({
              providerId: _0x2a3816,
              mediaPolicy: _0x4990e2.extensions?.chatCompletionInputPolicy,
              inputUrls: _0x487047.inputUrls || [],
              inputImageUrls: _0x487047.inputImageUrls || [],
              inputVideoUrls: _0x487047.inputVideoUrls || [],
            })
          : _0x487047.inputImageUrls || _0x487047.inputUrls || [],
      _0x295ca9 = await _0x56bb6d.buildVolcengineResponsesUserContent(
        _0x4e1b21,
        _0x147ccb,
        _0x467995,
        _0x2a3816,
        {
          mediaPolicy: _0x4990e2.extensions?.chatCompletionInputPolicy,
          inputImageUrls: _0x487047.inputImageUrls || [],
          inputVideoUrls: _0x487047.inputVideoUrls || [],
          baseUrl: _0x14f0dc.apiUrl,
          model: _0x4b8698,
          videoFps: _0x4990e2.extensions?.volcengineFiles?.videoFps,
        },
      );
    return {
      url: '/api/v2/proxy/completions',
      headers: _0x4990e2.headers || { 'Content-Type': 'application/json' },
      body: {
        apiUrl: resolveManifestApiUrl(_0x2a3816, _0x14f0dc, _0x4990e2, _0x23b2eb),
        apiKey: _0x467995,
        model: _0x4b8698,
        stream: false,
        ...(_0x487047.systemPrompt ? { instructions: _0x487047.systemPrompt } : {}),
        input: [{ role: 'user', content: _0x295ca9 }],
      },
      responseMapping: _0x4990e2.responseMapping,
      isProxy: true,
      adapterTrace: { source: 'manifest', executionId: _0x4990e2.id, modelId: _0x487047.model },
    };
  }
  if (_0x4990e2.endpointMode === 'chat-completion') {
    if (typeof _0x56bb6d.buildChatCompletionUserContent !== 'function')
      throw new Error('chat-completion text manifest requires user content resolver');
    const _0x18189e =
        typeof _0x56bb6d.resolveChatCompletionInputUrls === 'function'
          ? _0x56bb6d.resolveChatCompletionInputUrls({
              providerId: _0x2a3816,
              mediaPolicy: _0x4990e2.extensions?.chatCompletionInputPolicy,
              inputUrls: _0x487047.inputUrls || [],
              inputImageUrls: _0x487047.inputImageUrls || [],
              inputVideoUrls: _0x487047.inputVideoUrls || [],
            })
          : _0x487047.inputImageUrls || _0x487047.inputUrls || [],
      _0x17a778 = await _0x56bb6d.buildChatCompletionUserContent(_0x4e1b21, _0x18189e, _0x467995, _0x2a3816, {
        mediaPolicy: _0x4990e2.extensions?.chatCompletionInputPolicy,
        inputImageUrls: _0x487047.inputImageUrls || [],
        inputVideoUrls: _0x487047.inputVideoUrls || [],
      });
    return {
      url: '/api/v2/proxy/completions',
      headers: _0x4990e2.headers || { 'Content-Type': 'application/json' },
      body: {
        apiUrl: resolveManifestApiUrl(_0x2a3816, _0x14f0dc, _0x4990e2, _0x23b2eb),
        apiKey: _0x467995,
        model: _0x4b8698,
        stream: false,
        messages: [
          { role: 'system', content: _0x487047.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: _0x17a778 },
        ],
      },
      responseMapping: _0x4990e2.responseMapping,
      isProxy: true,
      adapterTrace: { source: 'manifest', executionId: _0x4990e2.id, modelId: _0x487047.model },
    };
  }
  const _0x537dbb = Array.isArray(_0x487047.inputImageUrls) ? _0x487047.inputImageUrls : [];
  if (_0x537dbb.length === 0) throw new Error('RunningHub image-to-text manifest requires an image input');
  const _0x2c13c6 = await _0x56bb6d.buildRunningHubTextImageUrl(_0x537dbb, _0x467995);
  if (!_0x2c13c6) throw new Error('RunningHub image-to-text image upload failed');
  return {
    url: '/api/v2/proxy/image',
    headers: _0x4990e2.headers || { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/' + _0x4990e2.model,
      apiKey: _0x467995,
      prompt: _0x4e1b21,
      imageUrl: _0x2c13c6,
    },
    responseMapping: _0x4990e2.responseMapping,
    isProxy: true,
    adapterTrace: { source: 'manifest', executionId: _0x4990e2.id, modelId: _0x487047.model },
  };
}
export async function buildImageRequestFromManifest(_0x39f3e3, _0x88ce33, _0x1a3d58, _0xe0e90 = {}) {
  const _0x4ece81 = String(_0xe0e90.expectedProvider || '')
      .trim()
      .toLowerCase(),
    _0x4836c8 = resolveRequestManifest(_0x39f3e3, _0x4ece81, 'image');
  if (!_0x4836c8) return null;
  const {
    provider: _0x52c3d4,
    modelManifest: _0x444908,
    executionManifest: _0x26bda7,
    effectivePayload: _0x2a7e2b,
  } = _0x4836c8;
  if (!['agnes', 'apimart', 'ppio', 'grsai', 'runninghub', 'volcengine'].includes(_0x52c3d4)) return null;
  const _0x39c55a = _0x1a3d58.getProviderConfig(_0x52c3d4),
    _0x3165f5 = resolveApiKey(_0x52c3d4, _0x39f3e3, _0x1a3d58);
  !_0x3165f5 && throwMissingApiKey(_0x52c3d4);
  const _0x21a50f = await resolveInputImagesBySlot(_0x52c3d4, _0x2a7e2b, _0x3165f5, _0x1a3d58, {
      modelManifest: _0x444908,
      executionManifest: _0x26bda7,
      baseUrl: _0x39c55a.apiUrl,
    }),
    _0x289dbe = Object.keys(_0x21a50f).length > 0,
    _0x2af5f8 = _0x289dbe
      ? Object.values(_0x21a50f)
      : await resolveInputImages(_0x52c3d4, _0x2a7e2b, _0x3165f5, _0x1a3d58, {
          modelManifest: _0x444908,
          executionManifest: _0x26bda7,
          baseUrl: _0x39c55a.apiUrl,
        }),
    _0x500ed8 = resolveExecutionModelToken(_0x26bda7, _0x2a7e2b),
    _0x5575aa = {
      provider: _0x52c3d4,
      modelManifest: _0x444908,
      executionManifest: _0x26bda7,
      payload: _0x2a7e2b,
      finalPrompt: _0x88ce33,
      modelToken: _0x500ed8,
      apiKey: _0x3165f5,
      ctx: _0x1a3d58,
      finalUrls: _0x2af5f8,
      finalUrlsBySlot: _0x21a50f,
      inputImages: _0x2af5f8,
      inputVideos: [],
      inputAudios: [],
    },
    _0x36f39f = await buildManifestMappedBody(_0x5575aa),
    _0x583892 = _0x52c3d4 === 'runninghub';
  return {
    url: '/api/v2/proxy/image',
    headers: _0x26bda7.headers || { 'Content-Type': 'application/json' },
    body: {
      apiUrl: resolveManifestApiUrl(_0x52c3d4, _0x39c55a, _0x26bda7, _0x5575aa),
      apiKey: _0x3165f5,
      ..._0x36f39f,
    },
    responseMapping: _0x26bda7.responseMapping,
    taskPolling: resolveManifestTaskPolling(_0x52c3d4, _0x39c55a, _0x26bda7, _0x5575aa),
    adapterTrace: { source: 'manifest', executionId: _0x26bda7.id, modelId: _0x39f3e3.model },
    ...(_0x583892
      ? {
          isAsync: true,
          taskIdPath: _0x26bda7.responseMapping?.taskIdPath || _0x26bda7.result?.taskIdPath || 'taskId',
          useOpenapiQuery: true,
          pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
          resultExtractor: (_0x273343) => {
            if (_0x273343.status === 'COMPLETED' && Array.isArray(_0x273343.results))
              return _0x273343.results
                .map((_0x3713f5) => _0x3713f5.url || _0x3713f5.imageUrl || _0x3713f5.videoUrl)
                .filter(Boolean);
            return [];
          },
        }
      : {}),
  };
}
