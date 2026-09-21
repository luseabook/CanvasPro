import * as PpioAdapter from './adapters/PpioAdapter.js';
import { buildTextRequestFromManifest } from './adapters/ModelApiManifestNormalizer.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { fetchWithTimeout, buildApiUrl } from './apiBase.js';
import { resolveMappedResponseValue } from './adapters/modelApiMappingEngine.js';
import { processInputImages, processInputImagesPreserveOrder, uploadToRunningHub } from './imageUploadApi.js';
import { uploadInputsToVolcengineFiles } from './volcengineFileApi.js';
import { get } from './requester.js';
import { isModelApiModel, normalizeProviderId, resolveModelExecution } from '../src/manifests/index.js';
import { ApiError, parseError, parseNetworkError } from './errors/index.js';
const GENERATION_TIMEOUT = 5 * 60 * 0x3e8,
  IMAGE_MENTION_RE = /@图片\d+/g,
  VIDEO_MENTION_RE = /@视频\d+/g,
  GPT_TEXT_VIDEO_MEDIA_RE = /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp)(?:[?#].*)?$/i,
  GPT_TEXT_AUDIO_MEDIA_RE = /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  GPT_TEXT_UNSUPPORTED_MEDIA_RE =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp|mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  RUNNINGHUB_CONTACT_SHEET_MAX_SIDE_PX = 0x800,
  RUNNINGHUB_CONTACT_SHEET_GAP_PX = 24,
  RUNNINGHUB_CONTACT_SHEET_MIN_CELL_PX = 0x100,
  RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS = Object.freeze({
    background: '--canvas-contact-sheet-bg',
    cellBackground: '--canvas-contact-sheet-cell-bg',
    cellStroke: '--canvas-contact-sheet-cell-stroke',
    badgeBackground: '--canvas-contact-sheet-badge-bg',
    badgeText: '--canvas-contact-sheet-badge-text',
  }),
  RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS = Object.freeze({
    background: 'white',
    cellBackground: 'whitesmoke',
    cellStroke: 'gainsboro',
    badgeBackground: 'midnightblue',
    badgeText: 'white',
  });
function normalizeInputUrls(_0x56aa50) {
  return Array.isArray(_0x56aa50)
    ? _0x56aa50.map((_0x471784) => String(_0x471784 || '').trim()).filter(Boolean)
    : [];
}
function hasUnsupportedGptTextMediaUrl(_0x19ca66) {
  return normalizeInputUrls(_0x19ca66).some((_0x5baace) => GPT_TEXT_UNSUPPORTED_MEDIA_RE.test(_0x5baace));
}
function isLikelyVideoUrl(_0x4ef1bd) {
  return GPT_TEXT_VIDEO_MEDIA_RE.test(String(_0x4ef1bd || '').trim());
}
function isLikelyAudioUrl(_0x46af1a) {
  return GPT_TEXT_AUDIO_MEDIA_RE.test(String(_0x46af1a || '').trim());
}
function hasUnsupportedGptTextAudioUrl(_0x4df4a8) {
  return normalizeInputUrls(_0x4df4a8).some((_0x1ecc1d) => isLikelyAudioUrl(_0x1ecc1d));
}
function splitChatCompletionInputUrls(_0x2d6bcf) {
  const _0x42fc0b = [],
    _0x45784a = [],
    _0x5d6a7f = [];
  for (const _0x824210 of normalizeInputUrls(_0x2d6bcf)) {
    if (isLikelyVideoUrl(_0x824210)) _0x45784a.push(_0x824210);
    else isLikelyAudioUrl(_0x824210) ? _0x5d6a7f.push(_0x824210) : _0x42fc0b.push(_0x824210);
  }
  return { imageUrls: _0x42fc0b, videoUrls: _0x45784a, audioUrls: _0x5d6a7f };
}
function resolveChatCompletionInputUrls({
  providerId: providerId = '',
  mediaPolicy: mediaPolicy = '',
  inputUrls: _0x87ee14,
  inputImageUrls: _0x28b103,
  inputVideoUrls: _0x313de3,
}) {
  const _0x18f7a0 = String(mediaPolicy || '')
      .trim()
      .toLowerCase(),
    _0x1f0221 = normalizeInputUrls(_0x87ee14),
    _0x5efb56 = normalizeInputUrls(_0x28b103),
    _0x48ca04 = normalizeInputUrls(_0x313de3),
    _0x4d6fdd = splitChatCompletionInputUrls(_0x1f0221);
  if (_0x18f7a0 === 'text-only') {
    if (_0x1f0221.length > 0 || _0x5efb56.length > 0 || _0x48ca04.length > 0) {
      const _0x242e85 = formatTextProviderLabel(providerId);
      throw new Error(_0x242e85 + ' 文本模型暂不支持图片、视频或音频参考，请仅输入文本');
    }
    return [];
  }
  if (_0x18f7a0 === 'image-video') {
    if (
      _0x4d6fdd.audioUrls.length > 0 ||
      hasUnsupportedGptTextAudioUrl(_0x5efb56) ||
      hasUnsupportedGptTextAudioUrl(_0x48ca04)
    ) {
      const _0x52aeae = formatTextProviderLabel(providerId);
      throw new Error(_0x52aeae + ' 文本模型暂不支持音频参考，请改用图片或视频参考');
    }
    return {
      inputUrls: _0x1f0221,
      inputImageUrls: _0x5efb56.length > 0 ? _0x5efb56 : _0x4d6fdd.imageUrls,
      inputVideoUrls: _0x48ca04.length > 0 ? _0x48ca04 : _0x4d6fdd.videoUrls,
      allowVideo: true,
      mediaPolicy: _0x18f7a0,
    };
  }
  if (_0x18f7a0 !== 'image-only') return _0x1f0221;
  if (
    _0x48ca04.length > 0 ||
    hasUnsupportedGptTextMediaUrl(_0x1f0221) ||
    hasUnsupportedGptTextMediaUrl(_0x5efb56)
  ) {
    const _0x417ff9 = formatTextProviderLabel(providerId);
    throw new Error(_0x417ff9 + ' 文本模型已统一使用 GPT 图文格式，暂不支持视频或音频参考，请改用图片参考');
  }
  return _0x5efb56.length > 0 ? _0x5efb56 : _0x1f0221;
}
const RUNNINGHUB_POLL_INTERVAL_MS = 0xbb8;
function sleep(_0x386dfa) {
  return new Promise((_0x586abf) => setTimeout(_0x586abf, _0x386dfa));
}
function resolveCssColorValue(_0x2e3cc4, _0x14289c = new Set()) {
  const _0x4018d9 = String(_0x2e3cc4 || '').trim();
  if (!_0x4018d9) return '';
  const _0x1dad00 = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+?)\s*)?\)$/.exec(_0x4018d9);
  if (!_0x1dad00) return _0x4018d9;
  const _0x1c49e6 = _0x1dad00[1],
    _0x1f22ed = (_0x1dad00[2] || '').trim();
  if (_0x14289c.has(_0x1c49e6)) return resolveCssColorValue(_0x1f22ed, _0x14289c);
  return (
    _0x14289c.add(_0x1c49e6),
    readDocumentCssColorToken(_0x1c49e6, _0x14289c) || resolveCssColorValue(_0x1f22ed, _0x14289c)
  );
}
function readDocumentCssColorToken(_0x3da86b, _0x31a221 = new Set()) {
  const _0x335b0b = globalThis?.document?.documentElement,
    _0x3cf67d = globalThis?.getComputedStyle || globalThis?.window?.getComputedStyle;
  if (!_0x335b0b || typeof _0x3cf67d !== 'function') return '';
  const _0x2bb12a = _0x3cf67d(_0x335b0b).getPropertyValue(_0x3da86b).trim();
  if (!_0x2bb12a) return '';
  return resolveCssColorValue(_0x2bb12a, _0x31a221);
}
function getRunningHubContactSheetPalette() {
  return {
    background:
      readDocumentCssColorToken(RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS.background) ||
      RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS.background,
    cellBackground:
      readDocumentCssColorToken(RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS.cellBackground) ||
      RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS.cellBackground,
    cellStroke:
      readDocumentCssColorToken(RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS.cellStroke) ||
      RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS.cellStroke,
    badgeBackground:
      readDocumentCssColorToken(RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS.badgeBackground) ||
      RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS.badgeBackground,
    badgeText:
      readDocumentCssColorToken(RUNNINGHUB_CONTACT_SHEET_COLOR_TOKENS.badgeText) ||
      RUNNINGHUB_CONTACT_SHEET_COLOR_FALLBACKS.badgeText,
  };
}
function pickFirstNonEmptyString(_0x10227d) {
  for (const _0x443803 of _0x10227d) {
    if (typeof _0x443803 === 'string' && _0x443803.trim()) return _0x443803.trim();
  }
  return '';
}
function isRunningHubTextModel(_0x144cc7, _0x174333) {
  return _0x144cc7 === 'runninghub' && isModelApiModel(_0x174333, 'runninghub');
}
const MANIFEST_REQUIRED_TEXT_PROVIDERS = Object.freeze(
  new Set(['agnes', 'apimart', 'grsai', 'ppio', 'runninghub', 'volcengine']),
);
function formatTextProviderLabel(_0x30a825) {
  const _0xaddf0 = normalizeProviderId(_0x30a825);
  if (_0xaddf0 === 'agnes') return 'Agnes AI';
  if (_0xaddf0 === 'apimart') return 'APIMart';
  if (_0xaddf0 === 'grsai') return 'GRSAI';
  if (_0xaddf0 === 'ppio') return 'PPIO';
  if (_0xaddf0 === 'runninghub') return 'RunningHub';
  if (_0xaddf0 === 'volcengine') return 'Volcengine';
  return _0xaddf0 || 'Text';
}
function resolveTextExecution(_0x56a447 = {}, _0x47f0bf = '') {
  const _0x34a3fd = normalizeProviderId(_0x56a447?.provider);
  if (_0x34a3fd === 'custom' || _0x34a3fd === 'openai') return null;
  return resolveModelExecution(_0x47f0bf || _0x56a447?.model, { providerHint: _0x34a3fd });
}
function resolveTextProviderId(_0x37a590 = {}, _0x136d59 = '', _0x35c88f = null) {
  if (_0x37a590.provider === 'custom') return 'openai';
  return normalizeProviderId(_0x35c88f?.modelManifest?.provider || _0x37a590.provider);
}
function isManifestBackedTextExecution(_0xb832f2) {
  return (
    _0xb832f2?.modelManifest?.kind === 'text' &&
    _0xb832f2?.executionManifest?.kind === 'text' &&
    _0xb832f2?.modelManifest?.adapterType === 'modelApi' &&
    _0xb832f2?.executionManifest?.adapterType === 'modelApi'
  );
}
function getTextManifestMissingError(_0x3985da, _0x2bf500 = '') {
  const _0x344bce = formatTextProviderLabel(_0x2bf500);
  if (_0x2bf500) return new Error(_0x344bce + ' text model API manifest missing: ' + _0x3985da);
  return new Error('Text model API manifest missing: ' + _0x3985da);
}
function assertTextManifestResolution(_0x362de8, _0x4e3bc2, _0x3cfdbc) {
  if (isManifestBackedTextExecution(_0x3cfdbc)) return;
  if (!_0x4e3bc2 || MANIFEST_REQUIRED_TEXT_PROVIDERS.has(normalizeProviderId(_0x4e3bc2)))
    throw getTextManifestMissingError(_0x362de8, _0x4e3bc2);
}
function parseRunningHubResponseData(_0x2f1fe4) {
  if (!_0x2f1fe4) return {};
  if (typeof _0x2f1fe4 === 'object') return _0x2f1fe4;
  const _0x804a6b = String(_0x2f1fe4 || '').trim();
  if (!_0x804a6b) return {};
  try {
    return JSON.parse(_0x804a6b);
  } catch {}
  const _0x42dd14 = extractSseJsonSnapshots(_0x804a6b);
  if (_0x42dd14.length > 0) {
    const _0x488b9e = normalizeChatCompletionSnapshots(_0x42dd14);
    if (_0x488b9e) return _0x488b9e;
    for (const _0x4497b4 of _0x42dd14) {
      if (getRunningHubTaskId(_0x4497b4)) return _0x4497b4;
    }
    return _0x42dd14[_0x42dd14.length - 1];
  }
  throw new Error('无法解析 RunningHUB 文本接口响应');
}
function extractSseJsonSnapshots(_0x1c2cc5) {
  const _0x1111ee = String(_0x1c2cc5 || '')
    .split('\n')
    .filter((_0x44ee64) => _0x44ee64.trim().startsWith('data:'));
  if (_0x1111ee.length === 0) return [];
  const _0x146b7f = [];
  for (const _0xb4b102 of _0x1111ee) {
    const _0x565fc1 = String(_0xb4b102 || '')
      .trim()
      .replace(/^data:\s*/, '')
      .trim();
    if (!_0x565fc1 || _0x565fc1 === '[DONE]') continue;
    try {
      _0x146b7f.push(JSON.parse(_0x565fc1));
    } catch {}
  }
  return _0x146b7f;
}
function normalizeChatCompletionSnapshots(_0x1f50c8) {
  const _0x97bc16 = [];
  let _0x4aaa79 = null,
    _0x500bac = '',
    _0x2a7f45 = 'assistant';
  for (const _0xb9c26a of _0x1f50c8 || []) {
    if (!_0xb9c26a || typeof _0xb9c26a !== 'object') continue;
    const _0x5af0f7 = _0xb9c26a.choices || _0xb9c26a.data?.choices || [];
    if (!Array.isArray(_0x5af0f7) || _0x5af0f7.length === 0) continue;
    _0x4aaa79 = _0xb9c26a;
    for (const _0x1330f9 of _0x5af0f7) {
      if (!_0x1330f9 || typeof _0x1330f9 !== 'object') continue;
      if (_0x1330f9.finish_reason) _0x500bac = _0x1330f9.finish_reason;
      if (typeof _0x1330f9.delta?.role === 'string') _0x2a7f45 = _0x1330f9.delta.role || _0x2a7f45;
      if (typeof _0x1330f9.message?.role === 'string') _0x2a7f45 = _0x1330f9.message.role || _0x2a7f45;
      if (typeof _0x1330f9.delta?.content === 'string') _0x97bc16.push(_0x1330f9.delta.content);
      if (typeof _0x1330f9.message?.content === 'string') _0x97bc16.push(_0x1330f9.message.content);
      if (typeof _0x1330f9.text === 'string') _0x97bc16.push(_0x1330f9.text);
    }
  }
  const _0x25a64a = _0x97bc16.join('');
  if (!_0x25a64a) return null;
  return {
    id: _0x4aaa79?.id || '',
    object: 'chat.completion',
    choices: [
      { index: 0, message: { role: _0x2a7f45, content: _0x25a64a }, finish_reason: _0x500bac || 'stop' },
    ],
  };
}
function getRunningHubTaskId(_0x5eb749) {
  return String(
    _0x5eb749?.taskId ||
      _0x5eb749?.task_id ||
      _0x5eb749?.data?.taskId ||
      _0x5eb749?.data?.task_id ||
      _0x5eb749?.data?.id ||
      _0x5eb749?.id ||
      '',
  ).trim();
}
function isChatCompletionResponse(_0x423311) {
  const _0xd66d41 = _0x423311?.choices || _0x423311?.data?.choices;
  if (Array.isArray(_0xd66d41)) return true;
  const _0x1edb54 = String(_0x423311?.object || _0x423311?.data?.object || '');
  return _0x1edb54.startsWith('chat.completion');
}
function stringifyRunningHubReason(_0x473b6d) {
  if (_0x473b6d == null) return '';
  if (typeof _0x473b6d === 'string') return _0x473b6d.trim();
  if (typeof _0x473b6d === 'object') {
    const _0x3d27cb = pickFirstNonEmptyString([
      _0x473b6d.message,
      _0x473b6d.errorMessage,
      _0x473b6d.error,
      _0x473b6d.msg,
      _0x473b6d.reason,
      _0x473b6d.detail,
    ]);
    if (_0x3d27cb) return _0x3d27cb;
    try {
      return JSON.stringify(_0x473b6d);
    } catch {}
  }
  return String(_0x473b6d || '').trim();
}
function getRunningHubTextErrorMessage(_0x27159e, _0x5378db = '文本生成失败') {
  return (
    pickFirstNonEmptyString([
      _0x27159e?.errorMessage,
      _0x27159e?.message,
      _0x27159e?.error,
      _0x27159e?.msg,
      stringifyRunningHubReason(_0x27159e?.failedReason),
      stringifyRunningHubReason(_0x27159e?.reason),
    ]) || _0x5378db
  );
}
function sanitizeGeneratedText(_0x4b10fc) {
  return String(_0x4b10fc || '')
    .replace(/<think>[\s\S]*?<\/think>\n?/g, '')
    .trim();
}
function hasImageMentions(_0x146539) {
  return /@图片\d+/.test(String(_0x146539 || ''));
}
function hasVideoMentions(_0x429199) {
  return /@视频\d+/.test(String(_0x429199 || ''));
}
function resolveInputFetchUrl(_0x2ffe8b) {
  const _0x4caa9e = String(_0x2ffe8b || '').trim();
  if (!_0x4caa9e) return '';
  if (/^(?:https?:|data:|blob:)/i.test(_0x4caa9e)) return _0x4caa9e;
  if (_0x4caa9e.startsWith('/')) return buildApiUrl(_0x4caa9e);
  return _0x4caa9e;
}
function loadCanvasImageFromObjectUrl(_0x4457ef) {
  return new Promise((_0x56e820, _0xa77088) => {
    const _0x19f3ed = globalThis?.Image;
    if (typeof _0x19f3ed !== 'function') {
      _0xa77088(new Error('当前环境不支持图片加载'));
      return;
    }
    const _0x119f0b = new _0x19f3ed();
    ('crossOrigin' in _0x119f0b && (_0x119f0b.crossOrigin = 'anonymous'),
      (_0x119f0b.onload = () => _0x56e820(_0x119f0b)),
      (_0x119f0b.onerror = () => _0xa77088(new Error('图片加载失败'))),
      (_0x119f0b.src = _0x4457ef));
  });
}
async function loadCanvasImageSource(_0x4a47be) {
  const _0x7d8527 = globalThis?.createImageBitmap;
  if (typeof _0x7d8527 === 'function') {
    const _0xd29ca7 = await _0x7d8527(_0x4a47be),
      _0x53d73e = Number(_0xd29ca7?.width || 0),
      _0x317777 = Number(_0xd29ca7?.height || 0);
    if (_0x53d73e > 0 && _0x317777 > 0)
      return { handle: _0xd29ca7, width: _0x53d73e, height: _0x317777, dispose: () => _0xd29ca7?.close?.() };
    _0xd29ca7?.close?.();
  }
  const _0x205809 = globalThis?.URL;
  if (typeof _0x205809?.createObjectURL !== 'function') throw new Error('当前环境不支持多图合成');
  const _0x47dca9 = _0x205809.createObjectURL(_0x4a47be);
  try {
    const _0x2f2be1 = await loadCanvasImageFromObjectUrl(_0x47dca9),
      _0x2520a0 = Number(_0x2f2be1?.naturalWidth || _0x2f2be1?.width || 0),
      _0x112b25 = Number(_0x2f2be1?.naturalHeight || _0x2f2be1?.height || 0);
    if (!(_0x2520a0 > 0 && _0x112b25 > 0)) throw new Error('图片尺寸无效');
    return {
      handle: _0x2f2be1,
      width: _0x2520a0,
      height: _0x112b25,
      dispose: () => _0x205809.revokeObjectURL?.(_0x47dca9),
    };
  } catch (_0x4cc160) {
    _0x205809.revokeObjectURL?.(_0x47dca9);
    throw _0x4cc160;
  }
}
function createCanvasTarget(_0x36a994, _0x46b3c6) {
  const _0xc6cfb5 = globalThis?.OffscreenCanvas;
  if (typeof _0xc6cfb5 === 'function') {
    const _0x4d92aa = new _0xc6cfb5(_0x36a994, _0x46b3c6);
    return {
      canvas: _0x4d92aa,
      toBlob: async () => {
        if (typeof _0x4d92aa.convertToBlob === 'function')
          return await _0x4d92aa.convertToBlob({ type: 'image/png' });
        return null;
      },
    };
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const _0x435a9c = document.createElement('canvas');
    return (
      (_0x435a9c.width = _0x36a994),
      (_0x435a9c.height = _0x46b3c6),
      {
        canvas: _0x435a9c,
        toBlob: async () =>
          await new Promise((_0x689d91) => {
            if (typeof _0x435a9c.toBlob !== 'function') {
              _0x689d91(null);
              return;
            }
            _0x435a9c.toBlob((_0x2b4caf) => _0x689d91(_0x2b4caf), 'image/png');
          }),
      }
    );
  }
  throw new Error('当前环境不支持多图合成');
}
function resolveRunningHubContactSheetGrid(_0x3b33f6) {
  const _0x115198 = Math.max(1, Math.trunc(Number(_0x3b33f6) || 1)),
    _0x2d0ffe = _0x115198 === 2 ? 2 : Math.ceil(Math.sqrt(_0x115198)),
    _0x1b7d23 = Math.ceil(_0x115198 / _0x2d0ffe);
  return { cols: _0x2d0ffe, rows: _0x1b7d23 };
}
function resolveRunningHubContactSheetCellSize(_0x2b5153, _0x2740e1) {
  const _0x4ba7de = RUNNINGHUB_CONTACT_SHEET_MAX_SIDE_PX,
    _0x10bbce = RUNNINGHUB_CONTACT_SHEET_GAP_PX,
    _0x325804 = Math.floor((_0x4ba7de - _0x10bbce * (_0x2b5153 + 1)) / _0x2b5153),
    _0x188f9e = Math.floor((_0x4ba7de - _0x10bbce * (_0x2740e1 + 1)) / _0x2740e1);
  return Math.max(RUNNINGHUB_CONTACT_SHEET_MIN_CELL_PX, Math.min(_0x325804, _0x188f9e));
}
async function composeRunningHubMultiImageBlob(_0x5b9d6b) {
  const _0x513457 = normalizeInputUrls(_0x5b9d6b),
    _0xf87d0d = [];
  for (const _0x31afc9 of _0x513457) {
    try {
      const _0x1967b8 = await get(resolveInputFetchUrl(_0x31afc9), {
          provider: 'remote',
          buildUrl: false,
          responseType: 'blob',
        }),
        _0x3502af = await loadCanvasImageSource(_0x1967b8);
      _0xf87d0d.push({ blob: _0x1967b8, source: _0x3502af });
    } catch {}
  }
  if (_0xf87d0d.length === 0) throw new Error('参考图片处理失败，无法合成多图输入');
  if (_0xf87d0d.length === 1) {
    const _0x3bb13c = _0xf87d0d[0].blob;
    return (_0xf87d0d[0].source?.dispose?.(), _0x3bb13c);
  }
  try {
    const { cols: _0x336e46, rows: _0x31f50b } = resolveRunningHubContactSheetGrid(_0xf87d0d.length),
      _0x171ab7 = RUNNINGHUB_CONTACT_SHEET_GAP_PX,
      _0x42d4e2 = resolveRunningHubContactSheetCellSize(_0x336e46, _0x31f50b),
      _0x5cfa53 = getRunningHubContactSheetPalette(),
      _0x39dc0c = _0x336e46 * _0x42d4e2 + _0x171ab7 * (_0x336e46 + 1),
      _0x1db532 = _0x31f50b * _0x42d4e2 + _0x171ab7 * (_0x31f50b + 1),
      { canvas: _0x666e3, toBlob: _0x4cdb5b } = createCanvasTarget(_0x39dc0c, _0x1db532),
      _0x145b23 = _0x666e3?.getContext?.('2d');
    if (!_0x145b23 || typeof _0x145b23.drawImage !== 'function') throw new Error('当前环境不支持多图合成');
    ((_0x145b23.fillStyle = _0x5cfa53.background), _0x145b23.fillRect?.(0, 0, _0x39dc0c, _0x1db532));
    const _0x437e04 = Math.max(30, Math.round(_0x42d4e2 * 0.14)),
      _0x57330c = Math.max(16, Math.round(_0x437e04 * 0.48));
    _0xf87d0d.forEach((_0x3a251c, _0x4713f4) => {
      const _0x382b5a = Math.floor(_0x4713f4 / _0x336e46),
        _0x268d2c = _0x4713f4 % _0x336e46,
        _0x104617 = _0x171ab7 + _0x268d2c * (_0x42d4e2 + _0x171ab7),
        _0x32d7cb = _0x171ab7 + _0x382b5a * (_0x42d4e2 + _0x171ab7);
      ((_0x145b23.fillStyle = _0x5cfa53.cellBackground),
        _0x145b23.fillRect?.(_0x104617, _0x32d7cb, _0x42d4e2, _0x42d4e2));
      const _0x26b959 = Math.max(1, Number(_0x3a251c.source.width || 1)),
        _0x23ffe3 = Math.max(1, Number(_0x3a251c.source.height || 1)),
        _0x22b9d3 = Math.min(_0x42d4e2 / _0x26b959, _0x42d4e2 / _0x23ffe3),
        _0x3354f4 = Math.max(1, Math.round(_0x26b959 * _0x22b9d3)),
        _0x722afe = Math.max(1, Math.round(_0x23ffe3 * _0x22b9d3)),
        _0xd7b903 = _0x104617 + Math.round((_0x42d4e2 - _0x3354f4) / 2),
        _0x128b53 = _0x32d7cb + Math.round((_0x42d4e2 - _0x722afe) / 2);
      (_0x145b23.drawImage(_0x3a251c.source.handle, _0xd7b903, _0x128b53, _0x3354f4, _0x722afe),
        (_0x145b23.strokeStyle = _0x5cfa53.cellStroke),
        (_0x145b23.lineWidth = 2),
        _0x145b23.strokeRect?.(_0x104617 + 1, _0x32d7cb + 1, _0x42d4e2 - 2, _0x42d4e2 - 2),
        (_0x145b23.fillStyle = _0x5cfa53.badgeBackground),
        _0x145b23.fillRect?.(_0x104617 + 12, _0x32d7cb + 12, _0x437e04, _0x437e04),
        (_0x145b23.fillStyle = _0x5cfa53.badgeText),
        (_0x145b23.font = '600 ' + _0x57330c + 'px sans-serif'),
        (_0x145b23.textAlign = 'center'),
        (_0x145b23.textBaseline = 'middle'),
        _0x145b23.fillText?.(
          String(_0x4713f4 + 1),
          _0x104617 + 12 + _0x437e04 / 2,
          _0x32d7cb + 12 + _0x437e04 / 2,
        ));
    });
    const _0x125dd1 = await _0x4cdb5b();
    if (!_0x125dd1) throw new Error('多图合成失败');
    return _0x125dd1;
  } finally {
    _0xf87d0d.forEach((_0x57e8ae) => {
      _0x57e8ae.source?.dispose?.();
    });
  }
}
async function buildRunningHubTextImageUrl(_0xa7b8d, _0x507f92) {
  const _0x161e06 = normalizeInputUrls(_0xa7b8d);
  if (_0x161e06.length === 0) return '';
  if (_0x161e06.length === 1) {
    const _0x5cfa25 = await processInputImages(_0x161e06, _0x507f92, {
      applyInputQualityProfile: true,
      provider: 'runninghub',
      preferFree: false,
      strictUpload: true,
    });
    return String(_0x5cfa25[0] || '').trim();
  }
  const _0x17b676 = await composeRunningHubMultiImageBlob(_0x161e06);
  return String(await uploadToRunningHub(_0x17b676, _0x507f92)).trim();
}
function mergeAdjacentTextParts(_0x85b3e5, { createTextPart: _0x149623, isTextPart: _0xacd19b }) {
  const _0x27a6b1 = [];
  let _0x1da830 = '';
  const _0x2c66e6 = () => {
    if (!_0x1da830) return;
    (_0x27a6b1.push(_0x149623(_0x1da830)), (_0x1da830 = ''));
  };
  for (const _0x4d992a of _0x85b3e5) {
    if (!_0x4d992a) continue;
    if (_0xacd19b(_0x4d992a)) {
      _0x1da830 += String(_0x4d992a.text || '');
      continue;
    }
    (_0x2c66e6(), _0x27a6b1.push(_0x4d992a));
  }
  return (_0x2c66e6(), _0x27a6b1);
}
function buildPromptMediaParts(
  _0x1ba759,
  _0x2dd911,
  { createTextPart: _0x4b8b03, isTextPart: _0x142fd0 },
  _0x283340 = {},
) {
  const _0x21e25e = String(_0x1ba759 || ''),
    _0x1de7d5 = normalizePromptMediaGroups(_0x2dd911, _0x283340),
    _0x202a6e = _0x1de7d5.some((_0x2557dd) => _0x2557dd.parts.length > 0);
  if (!_0x202a6e) return _0x21e25e ? [_0x4b8b03(_0x21e25e)] : [];
  const _0x2e138b = [],
    _0x5bff19 = new Set(),
    _0x2d9b8e = [];
  for (const _0x2a3333 of _0x1de7d5) {
    _0x2a3333.mentionRe.lastIndex = 0;
    let _0x5614f2;
    while ((_0x5614f2 = _0x2a3333.mentionRe.exec(_0x21e25e))) {
      const _0xef93cd = Number.parseInt(_0x5614f2[0].replace(/\D+/g, ''), 10),
        _0x3c623c = Number.isFinite(_0xef93cd) ? Math.max(0, _0xef93cd - 1) : -1;
      _0x2d9b8e.push({
        index: _0x5614f2.index,
        endIndex: _0x5614f2.index + _0x5614f2[0].length,
        text: _0x5614f2[0],
        group: _0x2a3333,
        mediaIndex: _0x3c623c,
      });
    }
  }
  _0x2d9b8e.sort(
    (_0xd27ea3, _0x5472ab) => _0xd27ea3.index - _0x5472ab.index || _0xd27ea3.endIndex - _0x5472ab.endIndex,
  );
  let _0x11fc44 = 0;
  for (const _0x59831c of _0x2d9b8e) {
    if (_0x59831c.index < _0x11fc44) continue;
    const _0x185897 = _0x21e25e.slice(_0x11fc44, _0x59831c.index);
    _0x185897 && _0x2e138b.push(_0x4b8b03(_0x185897));
    const _0x2ad25b = _0x59831c.group.parts[_0x59831c.mediaIndex];
    (_0x2ad25b
      ? (_0x2e138b.push(_0x2ad25b), _0x5bff19.add(_0x59831c.group.kind + ':' + _0x59831c.mediaIndex))
      : _0x2e138b.push(_0x4b8b03(_0x59831c.text)),
      (_0x11fc44 = _0x59831c.endIndex));
  }
  const _0x299b4a = _0x21e25e.slice(_0x11fc44);
  _0x299b4a && _0x2e138b.push(_0x4b8b03(_0x299b4a));
  _0x1de7d5.forEach((_0x36b726) => {
    _0x36b726.parts.forEach((_0x395aa6, _0x3d142a) => {
      _0x395aa6 && !_0x5bff19.has(_0x36b726.kind + ':' + _0x3d142a) && _0x2e138b.push(_0x395aa6);
    });
  });
  if (_0x2e138b.length === 0) return _0x1de7d5.flatMap((_0x58a424) => _0x58a424.parts.filter(Boolean));
  return mergeAdjacentTextParts(_0x2e138b, { createTextPart: _0x4b8b03, isTextPart: _0x142fd0 });
}
function normalizePromptMediaGroups(_0x11902a, _0x2208d0 = {}) {
  const _0x43a767 =
    Array.isArray(_0x11902a) && _0x11902a.some((_0x432d0c) => _0x432d0c && Array.isArray(_0x432d0c.parts))
      ? _0x11902a
      : [
          {
            kind: 'image',
            mentionRe: IMAGE_MENTION_RE,
            parts: _0x11902a,
            preserveSlots: _0x2208d0?.preserveSlots === true,
          },
        ];
  return _0x43a767.map((_0x4e9f58, _0x95ac75) => {
    const _0x2ba9f1 = _0x4e9f58?.preserveSlots === true || _0x2208d0?.preserveSlots === true,
      _0x37b5c6 = Array.isArray(_0x4e9f58?.parts)
        ? _0x2ba9f1
          ? _0x4e9f58.parts.slice()
          : _0x4e9f58.parts.filter(Boolean)
        : [];
    return {
      kind: String(_0x4e9f58?.kind || 'media' + _0x95ac75),
      mentionRe: _0x4e9f58?.mentionRe || IMAGE_MENTION_RE,
      parts: _0x37b5c6,
    };
  });
}
function normalizeChatCompletionMediaInput(_0x365399, _0x1549e3 = {}) {
  const _0x7dfcaf = _0x365399 && typeof _0x365399 === 'object' && !Array.isArray(_0x365399) ? _0x365399 : {},
    _0x61d5a3 = normalizeInputUrls(_0x7dfcaf.inputUrls !== undefined ? _0x7dfcaf.inputUrls : _0x365399),
    _0x24d366 = String(_0x1549e3.mediaPolicy || _0x7dfcaf.mediaPolicy || '')
      .trim()
      .toLowerCase(),
    _0x200e38 = _0x1549e3.allowVideo === true || _0x7dfcaf.allowVideo === true || _0x24d366 === 'image-video',
    _0x4be5aa = normalizeInputUrls(_0x1549e3.inputImageUrls),
    _0x514a1d = normalizeInputUrls(_0x7dfcaf.inputImageUrls),
    _0x23fbe6 = normalizeInputUrls(_0x1549e3.inputVideoUrls),
    _0x29a58b = normalizeInputUrls(_0x7dfcaf.inputVideoUrls),
    _0x301b6d = splitChatCompletionInputUrls(_0x61d5a3);
  return {
    inputImageUrls:
      _0x4be5aa.length > 0
        ? _0x4be5aa
        : _0x514a1d.length > 0
          ? _0x514a1d
          : _0x200e38
            ? _0x301b6d.imageUrls
            : _0x61d5a3,
    inputVideoUrls: _0x200e38
      ? _0x23fbe6.length > 0
        ? _0x23fbe6
        : _0x29a58b.length > 0
          ? _0x29a58b
          : _0x301b6d.videoUrls
      : [],
  };
}
function resolveChatCompletionVideoUrl(_0x5d8f80, _0x506cb0) {
  const _0xb7b2b4 = String(_0x5d8f80 || '').trim();
  if (!_0xb7b2b4) return '';
  if (normalizeProviderId(_0x506cb0) === 'volcengine') {
    if (/^https?:\/\//i.test(_0xb7b2b4)) return _0xb7b2b4;
    throw new Error('火山方舟视频输入需要公网可访问的视频 URL，当前本地视频无法直接发送');
  }
  return resolveInputFetchUrl(_0xb7b2b4);
}
async function buildVolcengineResponsesUserContent(
  _0x2a4efc,
  _0x75d40a,
  _0x2f2ec5,
  _0x150746,
  _0x2860ce = {},
) {
  const _0x112735 = normalizeChatCompletionMediaInput(_0x75d40a, {
      ..._0x2860ce,
      allowVideo: true,
      mediaPolicy: 'image-video',
    }),
    _0x1a28cf = String(_0x2860ce.model || '').trim(),
    _0xbbb488 =
      _0x112735.inputImageUrls.length > 0
        ? await uploadInputsToVolcengineFiles(_0x112735.inputImageUrls, _0x2f2ec5, {
            baseUrl: _0x2860ce.baseUrl,
            kind: 'image',
            model: _0x1a28cf,
          })
        : [],
    _0xcfc17d =
      _0x112735.inputVideoUrls.length > 0
        ? await uploadInputsToVolcengineFiles(_0x112735.inputVideoUrls, _0x2f2ec5, {
            baseUrl: _0x2860ce.baseUrl,
            kind: 'video',
            model: _0x1a28cf,
            videoFps: _0x2860ce.videoFps ?? 0.3,
          })
        : [],
    _0x406586 = _0xbbb488.map((_0x5d45bf) =>
      String(_0x5d45bf || '').trim() ? { type: 'input_image', file_id: _0x5d45bf } : null,
    ),
    _0x20f29d = _0xcfc17d.map((_0x1f07e7) =>
      String(_0x1f07e7 || '').trim() ? { type: 'input_video', file_id: _0x1f07e7 } : null,
    );
  if (
    hasImageMentions(_0x2a4efc) &&
    _0x112735.inputImageUrls.length > 0 &&
    _0x406586.filter(Boolean).length === 0
  )
    throw new Error('参考图片处理失败，无法映射 @图片 引用');
  if (
    hasVideoMentions(_0x2a4efc) &&
    _0x112735.inputVideoUrls.length > 0 &&
    _0x20f29d.filter(Boolean).length === 0
  )
    throw new Error('参考视频处理失败，无法映射 @视频 引用');
  return buildPromptMediaParts(
    _0x2a4efc,
    [
      { kind: 'image', mentionRe: IMAGE_MENTION_RE, parts: _0x406586, preserveSlots: true },
      { kind: 'video', mentionRe: VIDEO_MENTION_RE, parts: _0x20f29d, preserveSlots: true },
    ],
    {
      createTextPart: (_0x47bbc7) => ({ type: 'input_text', text: _0x47bbc7 }),
      isTextPart: (_0x3b24ca) => !!_0x3b24ca && _0x3b24ca.type === 'input_text',
    },
  );
}
async function buildChatCompletionUserContent(_0x1bab08, _0x1ec058, _0xeb413e, _0x30ed34, _0x36f2c0 = {}) {
  const _0x5259af = normalizeChatCompletionMediaInput(_0x1ec058, _0x36f2c0),
    _0x3ae70a = _0x5259af.inputImageUrls,
    _0x326a44 = _0x5259af.inputVideoUrls,
    _0x2913ac = normalizeProviderId(_0x30ed34),
    _0x2cc906 = _0x2913ac === 'agnes' ? 'freeImageHost' : _0x30ed34,
    _0x486521 = _0x2913ac === 'agnes' ? '' : _0xeb413e,
    _0x1af266 = _0x2913ac !== 'grsai' && _0x2913ac !== 'agnes',
    _0x4b51db =
      _0x3ae70a.length > 0
        ? await processInputImagesPreserveOrder(_0x3ae70a, _0x486521, {
            applyInputQualityProfile: true,
            provider: _0x2cc906,
            preferFree: _0x1af266,
            strictUpload: _0x2913ac === 'agnes',
          })
        : [],
    _0x17cd55 = _0x4b51db.map((_0x342c11) =>
      String(_0x342c11 || '').trim() ? { type: 'image_url', image_url: { url: _0x342c11 } } : null,
    ),
    _0x2ad56a = _0x17cd55.filter(Boolean);
  if (hasImageMentions(_0x1bab08) && _0x3ae70a.length > 0 && _0x2ad56a.length === 0)
    throw new Error('参考图片处理失败，无法映射 @图片 引用');
  const _0x5f28ae = _0x326a44.map((_0x2f65c8) => {
      const _0x364c55 = resolveChatCompletionVideoUrl(_0x2f65c8, _0x30ed34);
      return _0x364c55 ? { type: 'video_url', video_url: { url: _0x364c55 } } : null;
    }),
    _0x5a867d = _0x5f28ae.filter(Boolean);
  if (hasVideoMentions(_0x1bab08) && _0x326a44.length > 0 && _0x5a867d.length === 0)
    throw new Error('参考视频处理失败，无法映射 @视频 引用');
  const _0x16901a = buildPromptMediaParts(
    _0x1bab08,
    [
      { kind: 'image', mentionRe: IMAGE_MENTION_RE, parts: _0x17cd55, preserveSlots: true },
      { kind: 'video', mentionRe: VIDEO_MENTION_RE, parts: _0x5f28ae, preserveSlots: true },
    ],
    {
      createTextPart: (_0x5936de) => ({ type: 'text', text: _0x5936de }),
      isTextPart: (_0x322b26) => !!_0x322b26 && _0x322b26.type === 'text',
    },
  );
  if (_0x16901a.length === 1 && _0x16901a[0]?.type === 'text') return _0x16901a[0].text;
  return _0x16901a.length > 0 ? _0x16901a : String(_0x1bab08 || '');
}
export async function buildGenerateTextRequest(_0x470190) {
  await ensureConfig();
  const _0x10d678 = applyCameraAngleToPrompt(_0x470190.prompt, _0x470190.cameraAngle),
    _0x4cb39e = _0x10d678.length;
  if (_0x4cb39e > 0xc350)
    throw new Error(
      '提示词过长（' +
        _0x4cb39e +
        ' 字符）。为避免接口/代理返回异常，请分段生成：先让模型输出大纲，再按章节逐段生成。',
    );
  const _0x30e23b = _0x470190.model || 'gemini-3.1-pro',
    _0x56eaf3 = resolveTextExecution(_0x470190, _0x30e23b),
    _0x1b6ed0 = resolveTextProviderId(_0x470190, _0x30e23b, _0x56eaf3);
  assertTextManifestResolution(_0x30e23b, _0x1b6ed0, _0x56eaf3);
  const _0x2c0ce2 = getProviderConfig(_0x1b6ed0),
    _0x415db3 = _0x2c0ce2.apiUrl.replace(/\/v1\/?$/, ''),
    _0x191608 = isRunningHubTextModel(_0x1b6ed0, _0x30e23b)
      ? _0x2c0ce2.modelApiKey || _0x470190.apiKey
      : _0x470190.apiKey || _0x2c0ce2.apiKey;
  if (!_0x191608)
    throw ApiError.authError(
      _0x1b6ed0,
      null,
      'API Key 未配置（厂商：' + _0x1b6ed0 + '），无法发起文本生成请求',
    );
  const _0x1e78e5 = normalizeInputUrls(_0x470190.inputUrls),
    _0x429bbe = normalizeInputUrls(_0x470190.inputImageUrls),
    _0x5b3354 = normalizeInputUrls(_0x470190.inputVideoUrls);
  if (isManifestBackedTextExecution(_0x56eaf3)) {
    const _0x100b3b = await buildTextRequestFromManifest(
      {
        ..._0x470190,
        model: _0x30e23b,
        inputUrls: _0x1e78e5,
        inputImageUrls: _0x429bbe,
        inputVideoUrls: _0x5b3354,
      },
      _0x10d678,
      {
        getProviderConfig: getProviderConfig,
        buildRunningHubTextImageUrl: buildRunningHubTextImageUrl,
        resolveChatCompletionInputUrls: resolveChatCompletionInputUrls,
        buildChatCompletionUserContent: buildChatCompletionUserContent,
        buildVolcengineResponsesUserContent: buildVolcengineResponsesUserContent,
      },
      { expectedProvider: _0x1b6ed0 },
    );
    if (_0x100b3b) return _0x100b3b;
    throw getTextManifestMissingError(_0x30e23b, _0x1b6ed0);
  }
  const _0x1d7aab = resolveChatCompletionInputUrls({
      providerId: _0x1b6ed0,
      inputUrls: _0x1e78e5,
      inputImageUrls: _0x429bbe,
      inputVideoUrls: _0x5b3354,
    }),
    _0x587522 = await buildChatCompletionUserContent(_0x10d678, _0x1d7aab, _0x191608, _0x1b6ed0),
    _0x4449ab = {
      model: _0x30e23b,
      stream: false,
      messages: [
        { role: 'system', content: _0x470190.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: _0x587522 },
      ],
    };
  if (_0x1b6ed0 === 'ppio' || _0x1b6ed0 === 'openai' || _0x1b6ed0 === 'grsai') {
    let _0x11629b;
    if (_0x1b6ed0 === 'ppio') _0x11629b = PpioAdapter.getTextProxyApiUrl(_0x415db3);
    else {
      if (
        _0x415db3.includes(':generateContent') ||
        _0x415db3.includes('/v1beta/models') ||
        _0x415db3.endsWith('/chat/completions') ||
        (_0x415db3.includes('/api/') && _0x415db3.split('/api/').length > 1)
      )
        _0x11629b = _0x415db3;
      else {
        if (_0x415db3.endsWith('/api')) _0x11629b = _0x415db3;
        else _0x415db3.endsWith('/v1') ? (_0x11629b = _0x415db3) : (_0x11629b = _0x415db3 + '/v1');
      }
    }
    return {
      url: '/api/v2/proxy/completions',
      headers: { 'Content-Type': 'application/json' },
      body: { apiUrl: _0x11629b, apiKey: _0x191608, ..._0x4449ab },
      isProxy: true,
    };
  }
  let _0x111811;
  if (
    _0x415db3.includes(':generateContent') ||
    _0x415db3.includes('/v1beta/models') ||
    _0x415db3.endsWith('/chat/completions') ||
    (_0x415db3.includes('/api/') && _0x415db3.split('/api/').length > 1)
  )
    _0x111811 = _0x415db3;
  else {
    if (_0x415db3.endsWith('/api')) _0x111811 = _0x415db3 + '/v1/chat/completions';
    else
      _0x415db3.endsWith('/v1')
        ? (_0x111811 = _0x415db3 + '/chat/completions')
        : (_0x111811 = _0x415db3 + '/v1/chat/completions');
  }
  return {
    url: _0x111811,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + _0x191608 },
    body: _0x4449ab,
    isProxy: false,
  };
}
function parseTextResponse(_0x45268f, _0x177193) {
  const _0x2d4bf3 = '',
    _0x4cb795 = _0x45268f.length,
    _0x3e535a = _0x45268f.slice(0, 0x190),
    _0x41c81b = _0x45268f.slice(Math.max(0, _0x4cb795 - 0x190)),
    _0x275e9a = /<!doctype\s+html|<html[\s>]/i.test(_0x3e535a),
    _0x27a1ff = _0x45268f.replace(/^\uFEFF/, '').trim();
  let _0x17e28b;
  try {
    _0x17e28b = JSON.parse(_0x27a1ff);
  } catch (_0xe1f491) {
    const _0x159da1 = _0x27a1ff.indexOf('{'),
      _0x5a213a = _0x27a1ff.lastIndexOf('}');
    if (_0x159da1 !== -1 && _0x5a213a > _0x159da1)
      try {
        _0x17e28b = JSON.parse(_0x27a1ff.slice(_0x159da1, _0x5a213a + 1));
      } catch {}
    if (!_0x17e28b) {
      const _0x3ac539 = _0x27a1ff.split('\n').filter((_0x310078) => _0x310078.trim().startsWith('data:'));
      if (_0x3ac539.length > 0) {
        const _0x52ab27 = _0x3ac539[_0x3ac539.length - 1].replace(/^data:\s*/, '').trim();
        if (_0x52ab27 === '[DONE]') {
          const _0x108c2a = _0x3ac539.filter(
            (_0x4d26d9) => _0x4d26d9.replace(/^data:\s*/, '').trim() !== '[DONE]',
          );
          if (_0x108c2a.length > 0) {
            const _0x3ac4ee = _0x108c2a[_0x108c2a.length - 1].replace(/^data:\s*/, '').trim();
            _0x17e28b = JSON.parse(_0x3ac4ee);
          } else
            throw new ApiError({
              type: 'PARSE_ERROR',
              message: '服务端返回了空响应',
              status: _0x177193,
              retryable: false,
            });
        } else
          try {
            _0x17e28b = JSON.parse(_0x52ab27);
          } catch (_0x5e7c9f) {
            throw new ApiError({
              type: 'PARSE_ERROR',
              message: '无法解析服务端响应: ' + _0x5e7c9f.message,
              status: _0x177193,
              retryable: false,
            });
          }
      } else
        throw new ApiError({
          type: 'PARSE_ERROR',
          message:
            '服务端返回的不是可解析的 JSON。HTTP ' +
            _0x177193 +
            (_0x2d4bf3 ? ' (' + _0x2d4bf3 + ')' : '') +
            '，长度 ' +
            _0x4cb795 +
            '。\n' +
            (_0x275e9a
              ? '响应看起来像 HTML（常见原因：网关/防火墙拦截、API 地址错误、上游返回了错误页）。\n'
              : '') +
            '响应片段(截断)：\n[开头]\n' +
            _0x3e535a +
            '\n[结尾]\n' +
            _0x41c81b,
          status: _0x177193,
          retryable: false,
        });
    }
  }
  return _0x17e28b;
}
function extractTextContent(_0x113eb2, _0x2a296c = null) {
  const _0x3f7b6f = resolveMappedResponseValue(
    _0x113eb2,
    _0x2a296c?.resultPaths || _0x2a296c?.textFields || [],
  );
  if (_0x3f7b6f) return _0x3f7b6f;
  const _0x4bcd7f = _0x113eb2?.choices || _0x113eb2?.data?.choices;
  let _0x490570 = _0x4bcd7f?.[0]?.message?.content;
  !_0x490570 && (_0x490570 = _0x4bcd7f?.[0]?.delta?.content);
  !_0x490570 &&
    _0x113eb2?.data?.candidates?.[0]?.content?.parts?.[0]?.text &&
    (_0x490570 = _0x113eb2.data.candidates[0].content.parts[0].text);
  !_0x490570 &&
    _0x113eb2?.candidates?.[0]?.content?.parts?.[0]?.text &&
    (_0x490570 = _0x113eb2.candidates[0].content.parts[0].text);
  if (!_0x490570) {
    const _0x19485a = Array.isArray(_0x113eb2?.output)
        ? _0x113eb2.output
        : Array.isArray(_0x113eb2?.data?.output)
          ? _0x113eb2.data.output
          : [],
      _0x369795 = _0x19485a.flatMap((_0x3cb72d) =>
        Array.isArray(_0x3cb72d?.content) ? _0x3cb72d.content : [],
      );
    _0x490570 =
      pickFirstNonEmptyString(_0x369795.map((_0x16aa42) => _0x16aa42?.text)) ||
      pickFirstNonEmptyString(_0x369795.map((_0x5adb5) => _0x5adb5?.content)) ||
      pickFirstNonEmptyString([_0x113eb2?.output_text, _0x113eb2?.data?.output_text]);
  }
  if (!_0x490570) {
    const _0x57e164 = Array.isArray(_0x113eb2?.results)
      ? _0x113eb2.results
      : Array.isArray(_0x113eb2?.data?.results)
        ? _0x113eb2.data.results
        : [];
    _0x490570 =
      pickFirstNonEmptyString(_0x57e164.map((_0x56f451) => _0x56f451?.text)) ||
      pickFirstNonEmptyString([
        _0x113eb2?.text,
        _0x113eb2?.output,
        typeof _0x113eb2?.content === 'string' ? _0x113eb2.content : '',
        _0x113eb2?.markdown,
        _0x113eb2?.caption,
        _0x113eb2?.data?.text,
        _0x113eb2?.data?.output,
        typeof _0x113eb2?.data?.content === 'string' ? _0x113eb2.data.content : '',
      ]);
  }
  return _0x490570;
}
async function pollRunningHubTextTask(_0x2f1dac, _0x2a10a0, _0x4cb8cf) {
  const _0x250e5e = Date.now();
  while (Date.now() - _0x250e5e < GENERATION_TIMEOUT) {
    await sleep(RUNNINGHUB_POLL_INTERVAL_MS);
    const _0x306c89 = await fetchWithTimeout(
      buildApiUrl('/api/v2/proxy/image'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: 'https://www.runninghub.cn/openapi/v2/query',
          apiKey: _0x2a10a0,
          taskId: _0x2f1dac,
        }),
      },
      0x7530,
    );
    if (!_0x306c89.ok) {
      const _0x16bc17 = await _0x306c89.text().catch(() => '');
      let _0x127961;
      try {
        _0x127961 = JSON.parse(_0x16bc17);
      } catch {
        _0x127961 = { error: _0x16bc17 };
      }
      throw parseError(_0x4cb8cf, _0x127961, _0x306c89.status);
    }
    const _0x1bb13a = parseRunningHubResponseData(await _0x306c89.text()),
      _0x2b79b9 = Number(_0x1bb13a?.code);
    if (Number.isFinite(_0x2b79b9)) {
      if (_0x2b79b9 === 0x324 || _0x2b79b9 === 0x32d) continue;
      if (_0x2b79b9 !== 0) throw new Error(getRunningHubTextErrorMessage(_0x1bb13a, '文本任务轮询失败'));
    }
    const _0x2294dd = _0x1bb13a?.data && typeof _0x1bb13a.data === 'object' ? _0x1bb13a.data : _0x1bb13a,
      _0x1f9c15 = String(_0x2294dd?.status || '').toUpperCase();
    if (['SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(_0x1f9c15)) return _0x2294dd;
    if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(_0x1f9c15))
      throw new Error(getRunningHubTextErrorMessage(_0x2294dd, '文本任务执行失败'));
  }
  throw new Error('文本任务超时，请稍后重试');
}
export async function generateText(_0x1ad4c0) {
  const _0x1011df = await buildGenerateTextRequest(_0x1ad4c0),
    _0x1e13a7 = _0x1ad4c0?.model || 'gemini-3.1-pro',
    _0x31af19 = resolveTextExecution(_0x1ad4c0, _0x1e13a7),
    _0x59aa2c = resolveTextProviderId(_0x1ad4c0, _0x1e13a7, _0x31af19);
  let _0x57991f;
  try {
    const _0x523a55 = _0x1011df.isProxy ? buildApiUrl(_0x1011df.url) : _0x1011df.url;
    _0x57991f = await fetchWithTimeout(
      _0x523a55,
      { method: 'POST', headers: _0x1011df.headers, body: JSON.stringify(_0x1011df.body) },
      GENERATION_TIMEOUT,
    );
  } catch (_0xe1c088) {
    throw parseNetworkError(_0x59aa2c, _0xe1c088, GENERATION_TIMEOUT);
  }
  if (!_0x57991f.ok) {
    const _0x24c71e = await _0x57991f.text().catch(() => '');
    let _0x22ac76;
    try {
      _0x22ac76 = JSON.parse(_0x24c71e);
    } catch {
      _0x22ac76 = { error: _0x24c71e };
    }
    throw parseError(_0x59aa2c, _0x22ac76, _0x57991f.status);
  }
  const _0x54fa07 = await _0x57991f.text();
  if (isRunningHubTextModel(_0x59aa2c, _0x1ad4c0.model)) {
    const _0x576077 = parseRunningHubResponseData(_0x54fa07),
      _0x30c764 = Number(_0x576077?.code);
    if (Number.isFinite(_0x30c764) && _0x30c764 !== 0)
      throw new Error(getRunningHubTextErrorMessage(_0x576077, '文本任务创建失败'));
    const _0x3e1f01 = extractTextContent(_0x576077, _0x1011df.responseMapping);
    if (_0x3e1f01) return { text: sanitizeGeneratedText(_0x3e1f01) };
    let _0xd17dd4 = _0x576077;
    const _0x5c4bf5 = String(_0x576077?.status || _0x576077?.data?.status || '').toUpperCase(),
      _0x1aef22 = isChatCompletionResponse(_0x576077) ? '' : getRunningHubTaskId(_0x576077);
    if (
      ['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED'].includes(_0x5c4bf5) ||
      (_0x1aef22 && !['SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(_0x5c4bf5))
    ) {
      if (!_0x1aef22) throw new Error('RunningHUB 文本任务创建成功但未返回 taskId');
      _0xd17dd4 = await pollRunningHubTextTask(_0x1aef22, _0x1011df.body.apiKey, _0x59aa2c);
    } else {
      if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(_0x5c4bf5))
        throw new Error(getRunningHubTextErrorMessage(_0x576077, '文本任务创建失败'));
    }
    const _0x4690be = extractTextContent(_0xd17dd4, _0x1011df.responseMapping);
    if (!_0x4690be)
      throw new ApiError({
        type: 'PARSE_ERROR',
        provider: _0x59aa2c,
        message: 'RunningHUB 未返回文本内容',
        raw: _0xd17dd4,
        retryable: false,
      });
    return { text: sanitizeGeneratedText(_0x4690be) };
  }
  const _0x5700c8 = parseTextResponse(_0x54fa07, _0x57991f.status),
    _0x19b11a = extractTextContent(_0x5700c8, _0x1011df.responseMapping);
  if (!_0x19b11a)
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: _0x59aa2c,
      message: '服务端未返回文本内容',
      raw: _0x5700c8,
      retryable: false,
    });
  return { text: sanitizeGeneratedText(_0x19b11a) };
}
