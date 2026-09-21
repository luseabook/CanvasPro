import { resolveProviderRatioPayload } from '../imageRatioPolicy.js';
import {
  applyApimartPrivateAvatarAssetsToUrls,
  isApimartSeedance2PrivateAvatarModel,
} from './apimartPrivateAvatarAssetResolver.js';
import { normalizeApimartBaseUrl } from '../apimartUploadApi.js';
const APIMART_DIMENSION_TARGET_PIXELS = Object.freeze({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
  }),
  APIMART_DIMENSION_DEFAULT_RESOLUTION = '2K',
  APIMART_DIMENSION_ALIGN = 8,
  APIMART_DIMENSION_MIN = 0x200,
  APIMART_DIMENSION_MAX = 0x2000;
function parseRatioLabel(_0xc834d3) {
  const [_0x36b173, _0x2b9f4a] = String(_0xc834d3 || '1:1').split(':'),
    _0xa6f6c8 = Number.parseFloat(_0x36b173),
    _0xb29903 = Number.parseFloat(_0x2b9f4a);
  if (!(_0xa6f6c8 > 0 && _0xb29903 > 0)) return { w: 1, h: 1 };
  return { w: _0xa6f6c8, h: _0xb29903 };
}
function alignDimension(_0x476bf6) {
  const _0x5af423 = Math.round(Number(_0x476bf6 || 0) / APIMART_DIMENSION_ALIGN) * APIMART_DIMENSION_ALIGN;
  return Math.max(APIMART_DIMENSION_MIN, Math.min(APIMART_DIMENSION_MAX, _0x5af423));
}
function resolveDimensionsByResolutionAndRatio(_0x34043c, _0x50a3c4) {
  const _0x4d706a = String(_0x34043c || '')
      .trim()
      .toUpperCase(),
    _0x42d963 =
      APIMART_DIMENSION_TARGET_PIXELS[_0x4d706a] ||
      APIMART_DIMENSION_TARGET_PIXELS[APIMART_DIMENSION_DEFAULT_RESOLUTION],
    { w: _0x124820, h: _0x2e0598 } = parseRatioLabel(_0x50a3c4),
    _0xe8a056 = _0x124820 / _0x2e0598,
    _0x12e612 = Math.sqrt(_0x42d963 / _0xe8a056),
    _0xbed81c = _0x12e612 * _0xe8a056;
  return { width: alignDimension(_0xbed81c), height: alignDimension(_0x12e612) };
}
function isApimartGptImage2Model(_0x1e1f58) {
  const _0x171ad8 = String(_0x1e1f58 || '')
    .trim()
    .toLowerCase();
  return _0x171ad8 === 'apimart/gpt-image-2' || _0x171ad8 === 'gpt-image-2';
}
function isApimartSeedanceVideoModel(_0x5afdbe) {
  return String(_0x5afdbe || '')
    .trim()
    .replace(/^apimart\//, '')
    .startsWith('doubao-seedance-');
}
function normalizeSeedanceVideoSize(_0x17f4dd) {
  const _0x9c879 = String(_0x17f4dd || '').trim();
  if (!_0x9c879) return '16:9';
  if (_0x9c879 === '自适应' || _0x9c879.toLowerCase() === 'auto') return 'adaptive';
  if (
    _0x9c879 === '1:1' ||
    _0x9c879 === '3:4' ||
    _0x9c879 === '16:9' ||
    _0x9c879 === '4:3' ||
    _0x9c879 === '9:16' ||
    _0x9c879 === '21:9' ||
    _0x9c879 === 'adaptive'
  )
    return _0x9c879;
  return '16:9';
}
function normalizeSeedanceAspectRatio(_0x16b45b) {
  const _0x55ef55 = String(_0x16b45b || '').trim();
  if (
    _0x55ef55 === '1:1' ||
    _0x55ef55 === '3:4' ||
    _0x55ef55 === '16:9' ||
    _0x55ef55 === '4:3' ||
    _0x55ef55 === '9:16' ||
    _0x55ef55 === '21:9'
  )
    return _0x55ef55;
  return '16:9';
}
function isPresentValue(_0x3d6cab) {
  return _0x3d6cab !== undefined && _0x3d6cab !== null && String(_0x3d6cab).trim() !== '';
}
function normalizeGptImage2Resolution(_0x4a897d) {
  const _0x42967a = String(_0x4a897d || '')
    .trim()
    .toUpperCase();
  if (_0x42967a === '1K' || _0x42967a === '2K' || _0x42967a === '4K') return _0x42967a.toLowerCase();
  return '2k';
}
export function normalizeTextModel(_0x3a680e) {
  if (_0x3a680e === 'apimart/gpt-5.4') return 'gpt-5.4-apimart';
  if (String(_0x3a680e || '').startsWith('apimart/')) return String(_0x3a680e).replace(/^apimart\//, '');
  return _0x3a680e;
}
export function getTextProxyApiUrl(_0x5da880) {
  return _0x5da880 + '/v1/chat/completions';
}
export async function buildImageRequest(_0x36deb8, _0x26ce75, _0x1a3175) {
  if (!_0x36deb8.model) throw new Error('未指定模型，无法发起图像生成请求');
  const _0x57ca9c = _0x1a3175.getProviderConfig('apimart'),
    _0x3f8cbe = normalizeApimartBaseUrl(_0x57ca9c.apiUrl),
    _0x4039ae = _0x57ca9c.apiKey || _0x36deb8.apiKey;
  if (!_0x4039ae) throw new Error('API Key 未配置，无法发起图像生成请求');
  const _0x4bf212 = await _0x1a3175.processInputImages(_0x36deb8.inputUrls, _0x4039ae, {
      applyInputQualityProfile: true,
      provider: 'apimart',
      strictUpload: true,
    }),
    _0x3ee19d = {
      'apimart/nano-banana-2': 'gemini-3.1-flash-image-preview',
      'apimart/nano-banana-pro': 'gemini-3-pro-image-preview',
      'apimart/nano-banana-dot': 'gemini-2.5-flash-image-preview',
      'apimart/gpt-image-2': 'gpt-image-2',
      'apimart/seedream-5.0-lite': 'doubao-seedream-5-0-lite',
      'apimart/seedream-4.5': 'doubao-seedance-4-5',
      'apimart/seedream-4.0': 'doubao-seedance-4-0',
    },
    _0x50e561 = _0x3ee19d[_0x36deb8.model] || _0x36deb8.model.replace('apimart/', ''),
    _0x562b3f =
      _0x36deb8.model === 'apimart/seedream-4.0' ||
      _0x36deb8.model === 'apimart/seedream-4.5' ||
      _0x36deb8.model === 'apimart/seedream-5.0-lite';
  let _0x3b5e19 = _0x36deb8.imageSize || '2K';
  (_0x36deb8.model === 'apimart/seedream-4.5' || _0x36deb8.model === 'apimart/seedream-5.0-lite') &&
    _0x3b5e19 === '1K' &&
    (_0x3b5e19 = '2K');
  _0x36deb8.model === 'apimart/seedream-5.0-lite' && _0x3b5e19 === '4K' && (_0x3b5e19 = '3K');
  isApimartGptImage2Model(_0x36deb8.model) && (_0x3b5e19 = normalizeGptImage2Resolution(_0x3b5e19));
  const _0x8cf5c = resolveProviderRatioPayload({
      provider: 'apimart',
      model: _0x36deb8.model,
      ratioLabel: _0x36deb8.resolvedRatioLabel || _0x36deb8.aspectRatio,
      imageSize: _0x3b5e19,
      suppressAspectRatio: _0x36deb8.suppressAspectRatio,
    }),
    _0x54bf3e = { model: _0x50e561, prompt: _0x26ce75, n: 1, ...(!_0x562b3f && { resolution: _0x3b5e19 }) };
  if (!_0x36deb8.suppressAspectRatio && _0x8cf5c?.params?.size) {
    if (_0x562b3f) {
      const _0x58721c = resolveDimensionsByResolutionAndRatio(_0x3b5e19, _0x8cf5c.params.size);
      ((_0x54bf3e.width = _0x58721c.width), (_0x54bf3e.height = _0x58721c.height));
    } else _0x54bf3e.size = _0x8cf5c.params.size;
  }
  return (
    _0x4bf212.length > 0 && (_0x54bf3e.image_urls = _0x4bf212),
    {
      url: '/api/v2/proxy/image',
      headers: { 'Content-Type': 'application/json' },
      body: { apiUrl: _0x3f8cbe + '/v1/images/generations', apiKey: _0x4039ae, ..._0x54bf3e },
    }
  );
}
export async function buildVideoRequest(_0x3428c6, _0x51aef0, _0x4ec97c) {
  if (!_0x3428c6.model) throw new Error('未指定视频模型，无法发起视频生成请求');
  const _0x4d6bf2 = _0x4ec97c.getProviderConfig('apimart'),
    _0x2a5a29 = normalizeApimartBaseUrl(_0x4d6bf2.apiUrl),
    _0xee6367 = _0x4d6bf2.apiKey || _0x3428c6.apiKey;
  if (!_0xee6367) throw new Error('API Key 未配置（厂商：Apimart），无法发起视频生成请求');
  const _0x13e3c2 = {
      'apimart/luma-ray-v2': 'luma-ray-v2',
      'apimart/kling-v1-5': 'kling-v1-5-gen-video',
      'apimart/happyhorse-1.0': 'happyhorse-1.0',
      'apimart/doubao-seedance-2.0-fast': 'doubao-seedance-2.0-fast',
      'apimart/doubao-seedance-2.0': 'doubao-seedance-2.0',
      'apimart/doubao-seedance-2.0-fast-face': 'doubao-seedance-2.0-fast-face',
      'apimart/doubao-seedance-2.0-face': 'doubao-seedance-2.0-face',
      'apimart/doubao-seedance-1-5-pro': 'doubao-seedance-1-5-pro',
      'apimart/doubao-seedance-1-0-pro-fast': 'doubao-seedance-1-0-pro-fast',
      'apimart/doubao-seedance-1-0-pro-quality': 'doubao-seedance-1-0-pro-quality',
    },
    _0x23120f = _0x13e3c2[_0x3428c6.model] || _0x3428c6.model.replace('apimart/', ''),
    _0x14c95a = isApimartSeedanceVideoModel(_0x23120f),
    _0x342706 = _0x23120f.startsWith('doubao-seedance-2.0'),
    _0x806601 = isApimartSeedance2PrivateAvatarModel(_0x23120f),
    _0x4192dc = _0x23120f === 'doubao-seedance-1-5-pro',
    _0x3a392d = _0x23120f.startsWith('doubao-seedance-1-0-pro-'),
    _0x45c7de = _0x23120f === 'doubao-seedance-1-0-pro-fast',
    _0x2202c6 = [];
  if (Array.isArray(_0x3428c6.videos)) _0x2202c6.push(..._0x3428c6.videos);
  if (Array.isArray(_0x3428c6.videoUrls)) _0x2202c6.push(..._0x3428c6.videoUrls);
  const _0x367ec4 = String(_0x3428c6.videoUrl || '').trim();
  if (_0x367ec4) _0x2202c6.unshift(_0x367ec4);
  const _0x124f0b = applyApimartPrivateAvatarAssetsToUrls(
    Array.from(new Set(_0x2202c6.map((_0x28310c) => String(_0x28310c || '').trim()).filter(Boolean))),
    _0x3428c6,
    { sourceKind: 'video', enabled: _0x806601 },
  );
  if (_0x14c95a && !_0x342706 && _0x124f0b.length > 0)
    throw new Error('该 APIMart Seedance 模型暂不支持视频参考');
  const _0x4e4337 =
    _0x124f0b.length > 0 && (!_0x14c95a || _0x342706) && _0x4ec97c.processInputVideos
      ? await _0x4ec97c.processInputVideos(_0x124f0b, _0xee6367, { provider: 'apimart', strictUpload: true })
      : [];
  if (_0x124f0b.length > 0 && _0x4e4337.length <= 0) throw new Error('APIMART 源视频上传失败');
  const _0x317b7d = applyApimartPrivateAvatarAssetsToUrls(
    [
      String(_0x3428c6.first || _0x3428c6.firstFrameUrl || '').trim(),
      String(_0x3428c6.last || _0x3428c6.lastFrameUrl || '').trim(),
    ].filter(Boolean),
    _0x3428c6,
    { sourceKind: 'image', enabled: _0x806601 },
  );
  let _0x1c1e1f = [];
  if (_0x45c7de && _0x317b7d.length > 1)
    throw new Error('Seedance 1.0 Pro Fast 不支持尾帧图，请切换 Quality 模型');
  if (_0x14c95a && _0x317b7d.length > 0 && _0x4ec97c.processInputImages) {
    const _0x3b8f69 = await _0x4ec97c.processInputImages(_0x317b7d, _0xee6367, {
        applyInputQualityProfile: true,
        provider: 'apimart',
        strictUpload: true,
      }),
      _0x5a64fc = String(_0x3b8f69?.[0] || '').trim(),
      _0x10228d = String(_0x3b8f69?.[1] || '').trim();
    _0x1c1e1f = [
      _0x5a64fc ? { url: _0x5a64fc, role: 'first_frame' } : null,
      _0x10228d ? { url: _0x10228d, role: 'last_frame' } : null,
    ].filter(Boolean);
  }
  const _0x3fdf63 = Array.isArray(_0x3428c6.images)
      ? _0x3428c6.images
      : Array.isArray(_0x3428c6.inputUrls)
        ? _0x3428c6.inputUrls
        : [],
    _0x552103 = applyApimartPrivateAvatarAssetsToUrls(_0x3fdf63, _0x3428c6, {
      sourceKind: 'image',
      enabled: _0x806601,
    }),
    _0x30a6b7 = _0x14c95a && _0x1c1e1f.length <= 0,
    _0x524312 =
      _0x30a6b7 && _0x552103.length > 0 && _0x4ec97c.processInputImages
        ? await _0x4ec97c.processInputImages(_0x552103, _0xee6367, {
            applyInputQualityProfile: true,
            provider: 'apimart',
            strictUpload: true,
          })
        : [],
    _0x571e7b = [];
  if (Array.isArray(_0x3428c6.audios)) _0x571e7b.push(..._0x3428c6.audios);
  if (Array.isArray(_0x3428c6.audioUrls)) _0x571e7b.push(..._0x3428c6.audioUrls);
  const _0x385c95 = String(_0x3428c6.audioUrl || '').trim();
  if (_0x385c95) _0x571e7b.unshift(_0x385c95);
  const _0x3ea5cf = applyApimartPrivateAvatarAssetsToUrls(
    Array.from(new Set(_0x571e7b.map((_0xdc33e9) => String(_0xdc33e9 || '').trim()).filter(Boolean))),
    _0x3428c6,
    { sourceKind: 'audio', enabled: _0x806601 },
  );
  if (_0x14c95a && !_0x342706 && _0x3ea5cf.length > 0)
    throw new Error('该 APIMart Seedance 模型暂不支持音频参考');
  const _0x30d867 =
    _0x342706 && _0x3ea5cf.length > 0 && _0x4ec97c.processInputAudios
      ? await _0x4ec97c.processInputAudios(_0x3ea5cf, _0xee6367, { provider: 'apimart', strictUpload: true })
      : [];
  if (_0x14c95a && _0x3ea5cf.length > 0 && _0x30d867.length <= 0) throw new Error('APIMART 源音频上传失败');
  if (_0x14c95a) {
    const _0x38d81a = {
      model: _0x23120f,
      prompt: _0x51aef0,
      duration: _0x3428c6.duration || 5,
      resolution: _0x3428c6.resolution || (_0x3a392d ? '1080p' : '720p'),
    };
    _0x342706
      ? (_0x38d81a.size = normalizeSeedanceVideoSize(_0x3428c6.aspectRatio || _0x3428c6.size))
      : (_0x38d81a.aspect_ratio = normalizeSeedanceAspectRatio(
          _0x3428c6.aspectRatio || _0x3428c6.aspect_ratio,
        ));
    if (isPresentValue(_0x3428c6.seed)) _0x38d81a.seed = _0x3428c6.seed;
    _0x4192dc && (_0x3428c6.audio === true || _0x3428c6.generateAudio === true) && (_0x38d81a.audio = true);
    _0x4192dc && _0x3428c6.camerafixed === true && (_0x38d81a.camerafixed = true);
    if (_0x1c1e1f.length > 0) _0x38d81a.image_with_roles = _0x1c1e1f;
    else {
      if (_0x524312.length > 0) {
        const _0x30dcb0 = _0x342706 ? 9 : _0x4192dc ? 2 : 1;
        _0x38d81a.image_urls = _0x524312.slice(0, _0x30dcb0);
      }
    }
    return (
      _0x342706 &&
        _0x1c1e1f.length <= 0 &&
        _0x4e4337.length > 0 &&
        (_0x38d81a.video_urls = _0x4e4337.slice(0, 3)),
      _0x342706 &&
        _0x1c1e1f.length <= 0 &&
        _0x30d867.length > 0 &&
        (_0x38d81a.audio_urls = _0x30d867.slice(0, 3)),
      {
        url: '/api/v2/proxy/image',
        headers: { 'Content-Type': 'application/json' },
        body: { apiUrl: _0x2a5a29 + '/v1/videos/generations', apiKey: _0xee6367, ..._0x38d81a },
      }
    );
  }
  let _0x4aa6bf = '';
  if (_0x4e4337.length > 0) _0x4aa6bf = String(_0x4e4337[0] || '').trim();
  else {
    if (_0x367ec4 && _0x4ec97c.processInputVideos) {
      const _0x13c427 = await _0x4ec97c.processInputVideos([_0x367ec4], _0xee6367, {
        provider: 'apimart',
        strictUpload: true,
      });
      _0x4aa6bf = String(_0x13c427?.[0] || '').trim();
      if (!_0x4aa6bf) throw new Error('APIMART 源视频上传失败');
    }
  }
  const _0x8335a0 =
      _0x3428c6.inputUrls && _0x3428c6.inputUrls.length > 0 && _0x4ec97c.processInputImages
        ? await _0x4ec97c.processInputImages(_0x3428c6.inputUrls, _0xee6367, {
            applyInputQualityProfile: true,
            provider: 'apimart',
            strictUpload: true,
          })
        : [],
    _0x3ccb1c = {
      model: _0x23120f,
      prompt: _0x51aef0,
      size: _0x3428c6.aspectRatio || '16:9',
      quality: _0x3428c6.videoSize || 'standard',
    };
  if (_0x3428c6.duration) _0x3ccb1c.duration = _0x3428c6.duration;
  if (_0x3428c6.resolution) _0x3ccb1c.resolution = _0x3428c6.resolution;
  if (_0x4aa6bf) _0x3ccb1c.video_url = _0x4aa6bf;
  if (_0x8335a0.length > 0) _0x3ccb1c.image_urls = _0x8335a0;
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: { apiUrl: _0x2a5a29 + '/v1/videos/generations', apiKey: _0xee6367, ..._0x3ccb1c },
  };
}
