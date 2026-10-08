import * as PpioAdapter from './adapters/PpioAdapter.js';
import {
  buildTextRequestFromManifest,
  resolveProviderProfileConfig,
} from './adapters/ModelApiManifestNormalizer.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { fetchWithTimeout, buildApiUrl } from './apiBase.js';
import { resolveMappedResponseValue } from './adapters/modelApiMappingEngine.js';
import { processInputImages, processInputImagesPreserveOrder, uploadToRunningHub } from './imageUploadApi.js';
import { uploadInputsToVolcengineFiles } from './volcengineFileApi.js';
import { get } from './requester.js';
import { isModelApiModel, normalizeProviderId, resolveModelExecution } from '../src/manifests/index.js';
import { ApiError, parseError, parseNetworkError } from './errors/index.js';
const GENERATION_TIMEOUT = 5 * 60 * 1000,
  IMAGE_MENTION_RE = /@图片\d+/g,
  VIDEO_MENTION_RE = /@视频\d+/g,
  GPT_TEXT_VIDEO_MEDIA_RE = /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp)(?:[?#].*)?$/i,
  GPT_TEXT_AUDIO_MEDIA_RE = /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  GPT_TEXT_UNSUPPORTED_MEDIA_RE =
    /\.(?:mp4|mov|m4v|webm|mkv|avi|mpeg|mpg|3gp|mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i,
  RUNNINGHUB_CONTACT_SHEET_MAX_SIDE_PX = 2048,
  RUNNINGHUB_CONTACT_SHEET_GAP_PX = 24,
  RUNNINGHUB_CONTACT_SHEET_MIN_CELL_PX = 256,
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
function normalizeInputUrls(list) {
  return Array.isArray(list) ? list.map((item) => String(item || '').trim()).filter(Boolean) : [];
}
function hasUnsupportedGptTextMediaUrl(value) {
  return normalizeInputUrls(value).some((item2) => GPT_TEXT_UNSUPPORTED_MEDIA_RE.test(item2));
}
function isLikelyVideoUrl(key) {
  return GPT_TEXT_VIDEO_MEDIA_RE.test(String(key || '').trim());
}
function isLikelyAudioUrl(index) {
  return GPT_TEXT_AUDIO_MEDIA_RE.test(String(index || '').trim());
}
function hasUnsupportedGptTextAudioUrl(result) {
  return normalizeInputUrls(result).some((item3) => isLikelyAudioUrl(item3));
}
function splitChatCompletionInputUrls(data) {
  const imageUrls = [],
    videoUrls = [],
    audioUrls = [];
  for (const options of normalizeInputUrls(data)) {
    if (isLikelyVideoUrl(options)) videoUrls.push(options);
    else isLikelyAudioUrl(options) ? audioUrls.push(options) : imageUrls.push(options);
  }
  return { imageUrls: imageUrls, videoUrls: videoUrls, audioUrls: audioUrls };
}
function resolveChatCompletionInputUrls({
  providerId: providerId = '',
  mediaPolicy: mediaPolicy = '',
  inputUrls: inputUrls,
  inputImageUrls: inputImageUrls,
  inputVideoUrls: inputVideoUrls,
}) {
  const mediaPolicy2 = String(mediaPolicy || '')
      .trim()
      .toLowerCase(),
    inputUrls2 = normalizeInputUrls(inputUrls),
    inputImageUrls2 = normalizeInputUrls(inputImageUrls),
    inputVideoUrls2 = normalizeInputUrls(inputVideoUrls),
    splitChatCompletionInputUrls2 = splitChatCompletionInputUrls(inputUrls2);
  if (mediaPolicy2 === 'text-only') {
    if (inputUrls2.length > 0 || inputImageUrls2.length > 0 || inputVideoUrls2.length > 0) {
      const formatTextProviderLabel2 = formatTextProviderLabel(providerId);
      throw new Error(formatTextProviderLabel2 + ' 文本模型暂不支持图片、视频或音频参考，请仅输入文本');
    }
    return [];
  }
  if (mediaPolicy2 === 'image-video') {
    if (
      splitChatCompletionInputUrls2.audioUrls.length > 0 ||
      hasUnsupportedGptTextAudioUrl(inputImageUrls2) ||
      hasUnsupportedGptTextAudioUrl(inputVideoUrls2)
    ) {
      const formatTextProviderLabel3 = formatTextProviderLabel(providerId);
      throw new Error(formatTextProviderLabel3 + ' 文本模型暂不支持音频参考，请改用图片或视频参考');
    }
    return {
      inputUrls: inputUrls2,
      inputImageUrls: inputImageUrls2.length > 0 ? inputImageUrls2 : splitChatCompletionInputUrls2.imageUrls,
      inputVideoUrls: inputVideoUrls2.length > 0 ? inputVideoUrls2 : splitChatCompletionInputUrls2.videoUrls,
      allowVideo: true,
      mediaPolicy: mediaPolicy2,
    };
  }
  if (mediaPolicy2 !== 'image-only') return inputUrls2;
  if (
    inputVideoUrls2.length > 0 ||
    hasUnsupportedGptTextMediaUrl(inputUrls2) ||
    hasUnsupportedGptTextMediaUrl(inputImageUrls2)
  ) {
    const formatTextProviderLabel4 = formatTextProviderLabel(providerId);
    throw new Error(
      formatTextProviderLabel4 + ' 文本模型已统一使用 GPT 图文格式，暂不支持视频或音频参考，请改用图片参考',
    );
  }
  return inputImageUrls2.length > 0 ? inputImageUrls2 : inputUrls2;
}
const RUNNINGHUB_POLL_INTERVAL_MS = 3000;
function sleep(target) {
  return new Promise((source) => setTimeout(source, target));
}
function resolveCssColorValue(next, map = new Set()) {
  const enabled = String(next || '').trim();
  if (!enabled) return '';
  const enabled2 = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+?)\s*)?\)$/.exec(enabled);
  if (!enabled2) return enabled;
  const current = enabled2[1],
    entry = (enabled2[2] || '').trim();
  if (map.has(current)) return resolveCssColorValue(entry, map);
  return (map.add(current), readDocumentCssColorToken(current, map) || resolveCssColorValue(entry, map));
}
function readDocumentCssColorToken(record, payload = new Set()) {
  const enabled3 = globalThis?.document?.documentElement,
    handler = globalThis?.getComputedStyle || globalThis?.window?.getComputedStyle;
  if (!enabled3 || typeof handler !== 'function') return '';
  const enabled4 = handler(enabled3).getPropertyValue(record).trim();
  if (!enabled4) return '';
  return resolveCssColorValue(enabled4, payload);
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
function pickFirstNonEmptyString(handle) {
  for (const state of handle) {
    if (typeof state === 'string' && state.trim()) return state.trim();
  }
  return '';
}
function isRunningHubTextModel(config, scope) {
  return config === 'runninghub' && isModelApiModel(scope, 'runninghub');
}
const MANIFEST_REQUIRED_TEXT_PROVIDERS = Object.freeze(
  new Set(['agnes', 'apimart', 'grsai', 'ppio', 'runninghub', 'volcengine']),
);
function formatTextProviderLabel(input) {
  const providerId2 = normalizeProviderId(input);
  if (providerId2 === 'agnes') return 'Agnes AI';
  if (providerId2 === 'agnes-domestic') return 'Agnes AI（国内）';
  if (providerId2 === 'apimart') return 'APIMart';
  if (providerId2 === 'grsai') return 'GRSAI';
  if (providerId2 === 'ppio') return 'PPIO';
  if (providerId2 === 'runninghub') return 'RunningHub';
  if (providerId2 === 'volcengine') return 'Volcengine';
  return providerId2 || 'Text';
}
function resolveTextExecution(options2 = {}, output = '') {
  const providerHint = normalizeProviderId(options2?.provider);
  if (providerHint === 'custom' || providerHint === 'openai') return null;
  return resolveModelExecution(output || options2?.model, { providerHint: providerHint });
}
function resolveTextProviderId(options3 = {}, value2 = '', value3 = null) {
  if (options3.provider === 'custom') return 'openai';
  return normalizeProviderId(value3?.modelManifest?.provider || options3.provider);
}
function isManifestBackedTextExecution(value4) {
  return (
    value4?.modelManifest?.kind === 'text' &&
    value4?.executionManifest?.kind === 'text' &&
    value4?.modelManifest?.adapterType === 'modelApi' &&
    value4?.executionManifest?.adapterType === 'modelApi'
  );
}
function getTextManifestMissingError(value5, value6 = '') {
  const formatTextProviderLabel5 = formatTextProviderLabel(value6);
  if (value6) return new Error(formatTextProviderLabel5 + ' text model API manifest missing: ' + value5);
  return new Error('Text model API manifest missing: ' + value5);
}
function assertTextManifestResolution(value7, enabled5, value8) {
  if (isManifestBackedTextExecution(value8)) return;
  if (!enabled5 || MANIFEST_REQUIRED_TEXT_PROVIDERS.has(normalizeProviderId(enabled5)))
    throw getTextManifestMissingError(value7, enabled5);
}
function parseRunningHubResponseData(enabled6) {
  if (!enabled6) return {};
  if (typeof enabled6 === 'object') return enabled6;
  const enabled7 = String(enabled6 || '').trim();
  if (!enabled7) return {};
  try {
    return JSON.parse(enabled7);
  } catch {}
  const list2 = extractSseJsonSnapshots(enabled7);
  if (list2.length > 0) {
    const chatCompletionSnapshots = normalizeChatCompletionSnapshots(list2);
    if (chatCompletionSnapshots) return chatCompletionSnapshots;
    for (const value9 of list2) {
      if (getRunningHubTaskId(value9)) return value9;
    }
    return list2[list2.length - 1];
  }
  throw new Error('无法解析 RunningHUB 文本接口响应');
}
function extractSseJsonSnapshots(value10) {
  const list3 = String(value10 || '')
    .split('\n')
    .filter((item4) => item4.trim().startsWith('data:'));
  if (list3.length === 0) return [];
  const list4 = [];
  for (const value11 of list3) {
    const enabled8 = String(value11 || '')
      .trim()
      .replace(/^data:\s*/, '')
      .trim();
    if (!enabled8 || enabled8 === '[DONE]') continue;
    try {
      list4.push(JSON.parse(enabled8));
    } catch {}
  }
  return list4;
}
function normalizeChatCompletionSnapshots(value12) {
  const list5 = [];
  let id = null,
    finish_reason = '',
    role = 'assistant';
  for (const enabled9 of value12 || []) {
    if (!enabled9 || typeof enabled9 !== 'object') continue;
    const list6 = enabled9.choices || enabled9.data?.choices || [];
    if (!Array.isArray(list6) || list6.length === 0) continue;
    id = enabled9;
    for (const error of list6) {
      if (!error || typeof error !== 'object') continue;
      if (error.finish_reason) finish_reason = error.finish_reason;
      if (typeof error.delta?.role === 'string') role = error.delta.role || role;
      if (typeof error.message?.role === 'string') role = error.message.role || role;
      if (typeof error.delta?.content === 'string') list5.push(error.delta.content);
      if (typeof error.message?.content === 'string') list5.push(error.message.content);
      if (typeof error.text === 'string') list5.push(error.text);
    }
  }
  const content = list5.join('');
  if (!content) return null;
  return {
    id: id?.id || '',
    object: 'chat.completion',
    choices: [
      { index: 0, message: { role: role, content: content }, finish_reason: finish_reason || 'stop' },
    ],
  };
}
function getRunningHubTaskId(value13) {
  return String(
    value13?.taskId ||
      value13?.task_id ||
      value13?.data?.taskId ||
      value13?.data?.task_id ||
      value13?.data?.id ||
      value13?.id ||
      '',
  ).trim();
}
function isChatCompletionResponse(value14) {
  const value15 = value14?.choices || value14?.data?.choices;
  if (Array.isArray(value15)) return true;
  const value16 = String(value14?.object || value14?.data?.object || '');
  return value16.startsWith('chat.completion');
}
function stringifyRunningHubReason(error2) {
  if (error2 == null) return '';
  if (typeof error2 === 'string') return error2.trim();
  if (typeof error2 === 'object') {
    const firstNonEmptyString = pickFirstNonEmptyString([
      error2.message,
      error2.errorMessage,
      error2.error,
      error2.msg,
      error2.reason,
      error2.detail,
    ]);
    if (firstNonEmptyString) return firstNonEmptyString;
    try {
      return JSON.stringify(error2);
    } catch {}
  }
  return String(error2 || '').trim();
}
function getRunningHubTextErrorMessage(error3, value17 = '文本生成失败') {
  return (
    pickFirstNonEmptyString([
      error3?.errorMessage,
      error3?.message,
      error3?.error,
      error3?.msg,
      stringifyRunningHubReason(error3?.failedReason),
      stringifyRunningHubReason(error3?.reason),
    ]) || value17
  );
}
function sanitizeGeneratedText(value18) {
  return String(value18 || '')
    .replace(/<think>[\s\S]*?<\/think>\n?/g, '')
    .trim();
}
function hasImageMentions(value19) {
  return /@图片\d+/.test(String(value19 || ''));
}
function hasVideoMentions(value20) {
  return /@视频\d+/.test(String(value20 || ''));
}
function resolveInputFetchUrl(value21) {
  const enabled10 = String(value21 || '').trim();
  if (!enabled10) return '';
  if (/^(?:https?:|data:|blob:)/i.test(enabled10)) return enabled10;
  if (enabled10.startsWith('/')) return buildApiUrl(enabled10);
  return enabled10;
}
function loadCanvasImageFromObjectUrl(value22) {
  return new Promise((handler2, handler3) => {
    const run = globalThis?.Image;
    if (typeof run !== 'function') {
      handler3(new Error('当前环境不支持图片加载'));
      return;
    }
    const value23 = new run();
    ('crossOrigin' in value23 && (value23.crossOrigin = 'anonymous'),
      (value23.onload = () => handler2(value23)),
      (value23.onerror = () => handler3(new Error('图片加载失败'))),
      (value23.src = value22));
  });
}
async function loadCanvasImageSource(value24) {
  const run2 = globalThis?.createImageBitmap;
  if (typeof run2 === 'function') {
    const handle2 = await run2(value24),
      width = Number(handle2?.width || 0),
      height = Number(handle2?.height || 0);
    if (width > 0 && height > 0)
      return { handle: handle2, width: width, height: height, dispose: () => handle2?.close?.() };
    handle2?.close?.();
  }
  const value25 = globalThis?.URL;
  if (typeof value25?.createObjectURL !== 'function') throw new Error('当前环境不支持多图合成');
  const value26 = value25.createObjectURL(value24);
  try {
    const handle3 = await loadCanvasImageFromObjectUrl(value26),
      width2 = Number(handle3?.naturalWidth || handle3?.width || 0),
      height2 = Number(handle3?.naturalHeight || handle3?.height || 0);
    if (!(width2 > 0 && height2 > 0)) throw new Error('图片尺寸无效');
    return {
      handle: handle3,
      width: width2,
      height: height2,
      dispose: () => value25.revokeObjectURL?.(value26),
    };
  } catch (value27) {
    value25.revokeObjectURL?.(value26);
    throw value27;
  }
}
function createCanvasTarget(value28, value29) {
  const run3 = globalThis?.OffscreenCanvas;
  if (typeof run3 === 'function') {
    const canvas = new run3(value28, value29);
    return {
      canvas: canvas,
      toBlob: async () => {
        if (typeof canvas.convertToBlob === 'function')
          return await canvas.convertToBlob({ type: 'image/png' });
        return null;
      },
    };
  }
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas2 = document.createElement('canvas');
    return (
      (canvas2.width = value28),
      (canvas2.height = value29),
      {
        canvas: canvas2,
        toBlob: async () =>
          await new Promise((handler4) => {
            if (typeof canvas2.toBlob !== 'function') {
              handler4(null);
              return;
            }
            canvas2.toBlob((value30) => handler4(value30), 'image/png');
          }),
      }
    );
  }
  throw new Error('当前环境不支持多图合成');
}
function resolveRunningHubContactSheetGrid(value31) {
  const count = Math.max(1, Math.trunc(Number(value31) || 1)),
    cols = count === 2 ? 2 : Math.ceil(Math.sqrt(count)),
    rows = Math.ceil(count / cols);
  return { cols: cols, rows: rows };
}
function resolveRunningHubContactSheetCellSize(value32, value33) {
  const value34 = RUNNINGHUB_CONTACT_SHEET_MAX_SIDE_PX,
    value35 = RUNNINGHUB_CONTACT_SHEET_GAP_PX,
    value36 = Math.floor((value34 - value35 * (value32 + 1)) / value32),
    value37 = Math.floor((value34 - value35 * (value33 + 1)) / value33);
  return Math.max(RUNNINGHUB_CONTACT_SHEET_MIN_CELL_PX, Math.min(value36, value37));
}
async function composeRunningHubMultiImageBlob(value38) {
  const inputUrls3 = normalizeInputUrls(value38),
    list7 = [];
  for (const value39 of inputUrls3) {
    try {
      const blob = await get(resolveInputFetchUrl(value39), {
          provider: 'remote',
          buildUrl: false,
          responseType: 'blob',
        }),
        source2 = await loadCanvasImageSource(blob);
      list7.push({ blob: blob, source: source2 });
    } catch {}
  }
  if (list7.length === 0) throw new Error('参考图片处理失败，无法合成多图输入');
  if (list7.length === 1) {
    const value40 = list7[0].blob;
    return (list7[0].source?.dispose?.(), value40);
  }
  try {
    const { cols: cols2, rows: rows2 } = resolveRunningHubContactSheetGrid(list7.length),
      value41 = RUNNINGHUB_CONTACT_SHEET_GAP_PX,
      runningHubContactSheetCellSize = resolveRunningHubContactSheetCellSize(cols2, rows2),
      runningHubContactSheetPalette = getRunningHubContactSheetPalette(),
      value42 = cols2 * runningHubContactSheetCellSize + value41 * (cols2 + 1),
      value43 = rows2 * runningHubContactSheetCellSize + value41 * (rows2 + 1),
      { canvas: canvas3, toBlob: toBlob } = createCanvasTarget(value42, value43),
      ctx = canvas3?.getContext?.('2d');
    if (!ctx || typeof ctx.drawImage !== 'function') throw new Error('当前环境不支持多图合成');
    ((ctx.fillStyle = runningHubContactSheetPalette.background), ctx.fillRect?.(0, 0, value42, value43));
    const value44 = Math.max(30, Math.round(runningHubContactSheetCellSize * 0.14)),
      value45 = Math.max(16, Math.round(value44 * 0.48));
    list7.forEach((item5, value46) => {
      const value47 = Math.floor(value46 / cols2),
        value48 = value46 % cols2,
        value49 = value41 + value48 * (runningHubContactSheetCellSize + value41),
        value50 = value41 + value47 * (runningHubContactSheetCellSize + value41);
      ((ctx.fillStyle = runningHubContactSheetPalette.cellBackground),
        ctx.fillRect?.(value49, value50, runningHubContactSheetCellSize, runningHubContactSheetCellSize));
      const value51 = Math.max(1, Number(item5.source.width || 1)),
        value52 = Math.max(1, Number(item5.source.height || 1)),
        value53 = Math.min(
          runningHubContactSheetCellSize / value51,
          runningHubContactSheetCellSize / value52,
        ),
        value54 = Math.max(1, Math.round(value51 * value53)),
        value55 = Math.max(1, Math.round(value52 * value53)),
        value56 = value49 + Math.round((runningHubContactSheetCellSize - value54) / 2),
        value57 = value50 + Math.round((runningHubContactSheetCellSize - value55) / 2);
      (ctx.drawImage(item5.source.handle, value56, value57, value54, value55),
        (ctx.strokeStyle = runningHubContactSheetPalette.cellStroke),
        (ctx.lineWidth = 2),
        ctx.strokeRect?.(
          value49 + 1,
          value50 + 1,
          runningHubContactSheetCellSize - 2,
          runningHubContactSheetCellSize - 2,
        ),
        (ctx.fillStyle = runningHubContactSheetPalette.badgeBackground),
        ctx.fillRect?.(value49 + 12, value50 + 12, value44, value44),
        (ctx.fillStyle = runningHubContactSheetPalette.badgeText),
        (ctx.font = '600 ' + value45 + 'px sans-serif'),
        (ctx.textAlign = 'center'),
        (ctx.textBaseline = 'middle'),
        ctx.fillText?.(String(value46 + 1), value49 + 12 + value44 / 2, value50 + 12 + value44 / 2));
    });
    const enabled11 = await toBlob();
    if (!enabled11) throw new Error('多图合成失败');
    return enabled11;
  } finally {
    list7.forEach((item6) => {
      item6.source?.dispose?.();
    });
  }
}
async function buildRunningHubTextImageUrl(value58, value59) {
  const list8 = normalizeInputUrls(value58);
  if (list8.length === 0) return '';
  if (list8.length === 1) {
    const processInputImages2 = await processInputImages(list8, value59, {
      applyInputQualityProfile: true,
      provider: 'runninghub',
      preferFree: false,
      strictUpload: true,
    });
    return String(processInputImages2[0] || '').trim();
  }
  const composeRunningHubMultiImageBlob2 = await composeRunningHubMultiImageBlob(list8);
  return String(await uploadToRunningHub(composeRunningHubMultiImageBlob2, value59)).trim();
}
function mergeAdjacentTextParts(value60, { createTextPart: createTextPart, isTextPart: isTextPart }) {
  const list9 = [];
  let enabled12 = '';
  const run4 = () => {
    if (!enabled12) return;
    (list9.push(createTextPart(enabled12)), (enabled12 = ''));
  };
  for (const response of value60) {
    if (!response) continue;
    if (isTextPart(response)) {
      enabled12 += String(response.text || '');
      continue;
    }
    (run4(), list9.push(response));
  }
  return (run4(), list9);
}
function buildPromptMediaParts(
  value61,
  value62,
  { createTextPart: createTextPart2, isTextPart: isTextPart2 },
  value63 = {},
) {
  const list10 = String(value61 || ''),
    list11 = normalizePromptMediaGroups(value62, value63),
    enabled13 = list11.some((item7) => item7.parts.length > 0);
  if (!enabled13) return list10 ? [createTextPart2(list10)] : [];
  const list12 = [],
    map2 = new Set(),
    list13 = [];
  for (const group of list11) {
    group.mentionRe.lastIndex = 0;
    let index2;
    while ((index2 = group.mentionRe.exec(list10))) {
      const value64 = Number.parseInt(index2[0].replace(/\D+/g, ''), 10),
        mediaIndex = Number.isFinite(value64) ? Math.max(0, value64 - 1) : -1;
      list13.push({
        index: index2.index,
        endIndex: index2.index + index2[0].length,
        text: index2[0],
        group: group,
        mediaIndex: mediaIndex,
      });
    }
  }
  list13.sort((item8, value65) => item8.index - value65.index || item8.endIndex - value65.endIndex);
  let value66 = 0;
  for (const response2 of list13) {
    if (response2.index < value66) continue;
    const value67 = list10.slice(value66, response2.index);
    value67 && list12.push(createTextPart2(value67));
    const value68 = response2.group.parts[response2.mediaIndex];
    (value68
      ? (list12.push(value68), map2.add(response2.group.kind + ':' + response2.mediaIndex))
      : list12.push(createTextPart2(response2.text)),
      (value66 = response2.endIndex));
  }
  const value69 = list10.slice(value66);
  value69 && list12.push(createTextPart2(value69));
  list11.forEach((item9) => {
    item9.parts.forEach((item10, value70) => {
      item10 && !map2.has(item9.kind + ':' + value70) && list12.push(item10);
    });
  });
  if (list12.length === 0) return list11.flatMap((item11) => item11.parts.filter(Boolean));
  return mergeAdjacentTextParts(list12, { createTextPart: createTextPart2, isTextPart: isTextPart2 });
}
function normalizePromptMediaGroups(parts, preserveSlots = {}) {
  const list14 =
    Array.isArray(parts) && parts.some((item12) => item12 && Array.isArray(item12.parts))
      ? parts
      : [
          {
            kind: 'image',
            mentionRe: IMAGE_MENTION_RE,
            parts: parts,
            preserveSlots: preserveSlots?.preserveSlots === true,
          },
        ];
  return list14.map((mentionRe, value71) => {
    const value72 = mentionRe?.preserveSlots === true || preserveSlots?.preserveSlots === true,
      parts2 = Array.isArray(mentionRe?.parts)
        ? value72
          ? mentionRe.parts.slice()
          : mentionRe.parts.filter(Boolean)
        : [];
    return {
      kind: String(mentionRe?.kind || 'media' + value71),
      mentionRe: mentionRe?.mentionRe || IMAGE_MENTION_RE,
      parts: parts2,
    };
  });
}
function normalizeChatCompletionMediaInput(value73, value74 = {}) {
  const value75 = value73 && typeof value73 === 'object' && !Array.isArray(value73) ? value73 : {},
    inputUrls4 = normalizeInputUrls(value75.inputUrls !== undefined ? value75.inputUrls : value73),
    value76 = String(value74.mediaPolicy || value75.mediaPolicy || '')
      .trim()
      .toLowerCase(),
    inputVideoUrls3 = value74.allowVideo === true || value75.allowVideo === true || value76 === 'image-video',
    inputImageUrls3 = normalizeInputUrls(value74.inputImageUrls),
    list15 = normalizeInputUrls(value75.inputImageUrls),
    list16 = normalizeInputUrls(value74.inputVideoUrls),
    list17 = normalizeInputUrls(value75.inputVideoUrls),
    splitChatCompletionInputUrls3 = splitChatCompletionInputUrls(inputUrls4);
  return {
    inputImageUrls:
      inputImageUrls3.length > 0
        ? inputImageUrls3
        : list15.length > 0
          ? list15
          : inputVideoUrls3
            ? splitChatCompletionInputUrls3.imageUrls
            : inputUrls4,
    inputVideoUrls: inputVideoUrls3
      ? list16.length > 0
        ? list16
        : list17.length > 0
          ? list17
          : splitChatCompletionInputUrls3.videoUrls
      : [],
  };
}
function resolveChatCompletionVideoUrl(value77, value78) {
  const enabled14 = String(value77 || '').trim();
  if (!enabled14) return '';
  if (normalizeProviderId(value78) === 'volcengine') {
    if (/^https?:\/\//i.test(enabled14)) return enabled14;
    throw new Error('火山方舟视频输入需要公网可访问的视频 URL，当前本地视频无法直接发送');
  }
  return resolveInputFetchUrl(enabled14);
}
async function buildVolcengineResponsesUserContent(value79, value80, value81, value82, baseUrl = {}) {
  const chatCompletionMediaInput = normalizeChatCompletionMediaInput(value80, {
      ...baseUrl,
      allowVideo: true,
      mediaPolicy: 'image-video',
    }),
    model = String(baseUrl.model || '').trim(),
    list18 =
      chatCompletionMediaInput.inputImageUrls.length > 0
        ? await uploadInputsToVolcengineFiles(chatCompletionMediaInput.inputImageUrls, value81, {
            baseUrl: baseUrl.baseUrl,
            kind: 'image',
            model: model,
          })
        : [],
    list19 =
      chatCompletionMediaInput.inputVideoUrls.length > 0
        ? await uploadInputsToVolcengineFiles(chatCompletionMediaInput.inputVideoUrls, value81, {
            baseUrl: baseUrl.baseUrl,
            kind: 'video',
            model: model,
            videoFps: baseUrl.videoFps ?? 0.3,
          })
        : [],
    parts3 = list18.map((file_id) =>
      String(file_id || '').trim() ? { type: 'input_image', file_id: file_id } : null,
    ),
    parts4 = list19.map((file_id2) =>
      String(file_id2 || '').trim() ? { type: 'input_video', file_id: file_id2 } : null,
    );
  if (
    hasImageMentions(value79) &&
    chatCompletionMediaInput.inputImageUrls.length > 0 &&
    parts3.filter(Boolean).length === 0
  )
    throw new Error('参考图片处理失败，无法映射 @图片 引用');
  if (
    hasVideoMentions(value79) &&
    chatCompletionMediaInput.inputVideoUrls.length > 0 &&
    parts4.filter(Boolean).length === 0
  )
    throw new Error('参考视频处理失败，无法映射 @视频 引用');
  return buildPromptMediaParts(
    value79,
    [
      { kind: 'image', mentionRe: IMAGE_MENTION_RE, parts: parts3, preserveSlots: true },
      { kind: 'video', mentionRe: VIDEO_MENTION_RE, parts: parts4, preserveSlots: true },
    ],
    {
      createTextPart: (text) => ({ type: 'input_text', text: text }),
      isTextPart: (enabled15) => !!enabled15 && enabled15.type === 'input_text',
    },
  );
}
async function buildChatCompletionUserContent(value83, value84, value85, value86, value87 = {}) {
  const chatCompletionMediaInput2 = normalizeChatCompletionMediaInput(value84, value87),
    list20 = chatCompletionMediaInput2.inputImageUrls,
    list21 = chatCompletionMediaInput2.inputVideoUrls,
    strictUpload = normalizeProviderId(value86),
    provider = strictUpload === 'agnes' ? 'freeImageHost' : value86,
    value88 = strictUpload === 'agnes' ? '' : value85,
    preferFree = strictUpload !== 'grsai' && strictUpload !== 'agnes',
    list22 =
      list20.length > 0
        ? await processInputImagesPreserveOrder(list20, value88, {
            applyInputQualityProfile: true,
            provider: provider,
            preferFree: preferFree,
            strictUpload: strictUpload === 'agnes',
          })
        : [],
    parts5 = list22.map((url) =>
      String(url || '').trim() ? { type: 'image_url', image_url: { url: url } } : null,
    ),
    list23 = parts5.filter(Boolean);
  if (hasImageMentions(value83) && list20.length > 0 && list23.length === 0)
    throw new Error('参考图片处理失败，无法映射 @图片 引用');
  const parts6 = list21.map((item13) => {
      const url2 = resolveChatCompletionVideoUrl(item13, value86);
      return url2 ? { type: 'video_url', video_url: { url: url2 } } : null;
    }),
    list24 = parts6.filter(Boolean);
  if (hasVideoMentions(value83) && list21.length > 0 && list24.length === 0)
    throw new Error('参考视频处理失败，无法映射 @视频 引用');
  const list25 = buildPromptMediaParts(
    value83,
    [
      { kind: 'image', mentionRe: IMAGE_MENTION_RE, parts: parts5, preserveSlots: true },
      { kind: 'video', mentionRe: VIDEO_MENTION_RE, parts: parts6, preserveSlots: true },
    ],
    {
      createTextPart: (text2) => ({ type: 'text', text: text2 }),
      isTextPart: (enabled16) => !!enabled16 && enabled16.type === 'text',
    },
  );
  if (list25.length === 1 && list25[0]?.type === 'text') return list25[0].text;
  return list25.length > 0 ? list25 : String(value83 || '');
}
export async function buildGenerateTextRequest(content2) {
  await ensureConfig();
  const list26 = applyCameraAngleToPrompt(content2.prompt, content2.cameraAngle),
    count2 = list26.length;
  if (count2 > 50000)
    throw new Error(
      '提示词过长（' +
        count2 +
        ' 字符）。为避免接口/代理返回异常，请分段生成：先让模型输出大纲，再按章节逐段生成。',
    );
  const model2 = content2.model || 'gemini-3.1-pro',
    textExecution = resolveTextExecution(content2, model2),
    expectedProvider = resolveTextProviderId(content2, model2, textExecution);
  assertTextManifestResolution(model2, expectedProvider, textExecution);
  // 线路切换（如 Agnes 国内/国际）在这层生效：清单声明的 provider 只是「主线路」，
  // 实际走哪条要看请求里选中的线路，否则设置面板里填的 Key 永远用不上。
  const providerConfig = resolveProviderProfileConfig(
      expectedProvider,
      { ...content2, model: model2 },
      { getProviderConfig: getProviderConfig },
    ),
    list27 = providerConfig.apiUrl.replace(/\/v1\/?$/, ''),
    apiKey = isRunningHubTextModel(expectedProvider, model2)
      ? providerConfig.modelApiKey || content2.apiKey
      : content2.apiKey || providerConfig.apiKey;
  if (!apiKey)
    throw ApiError.authError(
      expectedProvider,
      null,
      'API Key 未配置（厂商：' + expectedProvider + '），无法发起文本生成请求',
    );
  const inputUrls5 = normalizeInputUrls(content2.inputUrls),
    inputImageUrls4 = normalizeInputUrls(content2.inputImageUrls),
    inputVideoUrls4 = normalizeInputUrls(content2.inputVideoUrls);
  if (isManifestBackedTextExecution(textExecution)) {
    const textRequestFromManifest = await buildTextRequestFromManifest(
      {
        ...content2,
        model: model2,
        inputUrls: inputUrls5,
        inputImageUrls: inputImageUrls4,
        inputVideoUrls: inputVideoUrls4,
      },
      list26,
      {
        getProviderConfig: getProviderConfig,
        buildRunningHubTextImageUrl: buildRunningHubTextImageUrl,
        resolveChatCompletionInputUrls: resolveChatCompletionInputUrls,
        buildChatCompletionUserContent: buildChatCompletionUserContent,
        buildVolcengineResponsesUserContent: buildVolcengineResponsesUserContent,
      },
      { expectedProvider: expectedProvider },
    );
    if (textRequestFromManifest) return textRequestFromManifest;
    throw getTextManifestMissingError(model2, expectedProvider);
  }
  const chatCompletionInputUrls = resolveChatCompletionInputUrls({
      providerId: expectedProvider,
      inputUrls: inputUrls5,
      inputImageUrls: inputImageUrls4,
      inputVideoUrls: inputVideoUrls4,
    }),
    content3 = await buildChatCompletionUserContent(
      list26,
      chatCompletionInputUrls,
      apiKey,
      expectedProvider,
    ),
    body = {
      model: model2,
      stream: false,
      messages: [
        { role: 'system', content: content2.systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: content3 },
      ],
    };
  if (expectedProvider === 'ppio' || expectedProvider === 'openai' || expectedProvider === 'grsai') {
    let apiUrl;
    if (expectedProvider === 'ppio') apiUrl = PpioAdapter.getTextProxyApiUrl(list27);
    else {
      if (
        list27.includes(':generateContent') ||
        list27.includes('/v1beta/models') ||
        list27.endsWith('/chat/completions') ||
        (list27.includes('/api/') && list27.split('/api/').length > 1)
      )
        apiUrl = list27;
      else {
        if (list27.endsWith('/api')) apiUrl = list27;
        else list27.endsWith('/v1') ? (apiUrl = list27) : (apiUrl = list27 + '/v1');
      }
    }
    return {
      url: '/api/v2/proxy/completions',
      headers: { 'Content-Type': 'application/json' },
      body: { apiUrl: apiUrl, apiKey: apiKey, ...body },
      isProxy: true,
    };
  }
  let url3;
  if (
    list27.includes(':generateContent') ||
    list27.includes('/v1beta/models') ||
    list27.endsWith('/chat/completions') ||
    (list27.includes('/api/') && list27.split('/api/').length > 1)
  )
    url3 = list27;
  else {
    if (list27.endsWith('/api')) url3 = list27 + '/v1/chat/completions';
    else
      list27.endsWith('/v1')
        ? (url3 = list27 + '/chat/completions')
        : (url3 = list27 + '/v1/chat/completions');
  }
  return {
    url: url3,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
    body: body,
    isProxy: false,
  };
}
function parseTextResponse(list28, status) {
  const value89 = '',
    value90 = list28.length,
    value91 = list28.slice(0, 400),
    value92 = list28.slice(Math.max(0, value90 - 400)),
    value93 = /<!doctype\s+html|<html[\s>]/i.test(value91),
    list29 = list28.replace(/^\uFEFF/, '').trim();
  let enabled17;
  try {
    enabled17 = JSON.parse(list29);
  } catch (value94) {
    const value95 = list29.indexOf('{'),
      value96 = list29.lastIndexOf('}');
    if (value95 !== -1 && value96 > value95)
      try {
        enabled17 = JSON.parse(list29.slice(value95, value96 + 1));
      } catch {}
    if (!enabled17) {
      const list30 = list29.split('\n').filter((item14) => item14.trim().startsWith('data:'));
      if (list30.length > 0) {
        const value97 = list30[list30.length - 1].replace(/^data:\s*/, '').trim();
        if (value97 === '[DONE]') {
          const list31 = list30.filter((item15) => item15.replace(/^data:\s*/, '').trim() !== '[DONE]');
          if (list31.length > 0) {
            const value98 = list31[list31.length - 1].replace(/^data:\s*/, '').trim();
            enabled17 = JSON.parse(value98);
          } else
            throw new ApiError({
              type: 'PARSE_ERROR',
              message: '服务端返回了空响应',
              status: status,
              retryable: false,
            });
        } else
          try {
            enabled17 = JSON.parse(value97);
          } catch (error4) {
            throw new ApiError({
              type: 'PARSE_ERROR',
              message: '无法解析服务端响应: ' + error4.message,
              status: status,
              retryable: false,
            });
          }
      } else
        throw new ApiError({
          type: 'PARSE_ERROR',
          message:
            '服务端返回的不是可解析的 JSON。HTTP ' +
            status +
            (value89 ? ' (' + value89 + ')' : '') +
            '，长度 ' +
            value90 +
            '。\n' +
            (value93
              ? '响应看起来像 HTML（常见原因：网关/防火墙拦截、API 地址错误、上游返回了错误页）。\n'
              : '') +
            '响应片段(截断)：\n[开头]\n' +
            value91 +
            '\n[结尾]\n' +
            value92,
          status: status,
          retryable: false,
        });
    }
  }
  return enabled17;
}
function extractTextContent(response3, value99 = null) {
  const mappedResponseValue = resolveMappedResponseValue(
    response3,
    value99?.resultPaths || value99?.textFields || [],
  );
  if (mappedResponseValue) return mappedResponseValue;
  const value100 = response3?.choices || response3?.data?.choices;
  let firstNonEmptyString2 = value100?.[0]?.message?.content;
  !firstNonEmptyString2 && (firstNonEmptyString2 = value100?.[0]?.delta?.content);
  !firstNonEmptyString2 &&
    response3?.data?.candidates?.[0]?.content?.parts?.[0]?.text &&
    (firstNonEmptyString2 = response3.data.candidates[0].content.parts[0].text);
  !firstNonEmptyString2 &&
    response3?.candidates?.[0]?.content?.parts?.[0]?.text &&
    (firstNonEmptyString2 = response3.candidates[0].content.parts[0].text);
  if (!firstNonEmptyString2) {
    const list32 = Array.isArray(response3?.output)
        ? response3.output
        : Array.isArray(response3?.data?.output)
          ? response3.data.output
          : [],
      list33 = list32.flatMap((item16) => (Array.isArray(item16?.content) ? item16.content : []));
    firstNonEmptyString2 =
      pickFirstNonEmptyString(list33.map((response4) => response4?.text)) ||
      pickFirstNonEmptyString(list33.map((item17) => item17?.content)) ||
      pickFirstNonEmptyString([response3?.output_text, response3?.data?.output_text]);
  }
  if (!firstNonEmptyString2) {
    const list34 = Array.isArray(response3?.results)
      ? response3.results
      : Array.isArray(response3?.data?.results)
        ? response3.data.results
        : [];
    firstNonEmptyString2 =
      pickFirstNonEmptyString(list34.map((response5) => response5?.text)) ||
      pickFirstNonEmptyString([
        response3?.text,
        response3?.output,
        typeof response3?.content === 'string' ? response3.content : '',
        response3?.markdown,
        response3?.caption,
        response3?.data?.text,
        response3?.data?.output,
        typeof response3?.data?.content === 'string' ? response3.data.content : '',
      ]);
  }
  return firstNonEmptyString2;
}
async function pollRunningHubTextTask(taskId, apiKey2, value101) {
  const value102 = Date.now();
  while (Date.now() - value102 < GENERATION_TIMEOUT) {
    await sleep(RUNNINGHUB_POLL_INTERVAL_MS);
    const response6 = await fetchWithTimeout(
      buildApiUrl('/api/v2/proxy/image'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: 'https://www.runninghub.cn/openapi/v2/query',
          apiKey: apiKey2,
          taskId: taskId,
        }),
      },
      30000,
    );
    if (!response6.ok) {
      const error5 = await response6.text().catch(() => '');
      let value103;
      try {
        value103 = JSON.parse(error5);
      } catch {
        value103 = { error: error5 };
      }
      throw parseError(value101, value103, response6.status);
    }
    const runningHubResponseData = parseRunningHubResponseData(await response6.text()),
      count3 = Number(runningHubResponseData?.code);
    if (Number.isFinite(count3)) {
      if (count3 === 804 || count3 === 813) continue;
      if (count3 !== 0)
        throw new Error(getRunningHubTextErrorMessage(runningHubResponseData, '文本任务轮询失败'));
    }
    const response7 =
        runningHubResponseData?.data && typeof runningHubResponseData.data === 'object'
          ? runningHubResponseData.data
          : runningHubResponseData,
      value104 = String(response7?.status || '').toUpperCase();
    if (['SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(value104)) return response7;
    if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(value104))
      throw new Error(getRunningHubTextErrorMessage(response7, '文本任务执行失败'));
  }
  throw new Error('文本任务超时，请稍后重试');
}
export async function generateText(value105) {
  const headers = await buildGenerateTextRequest(value105),
    value106 = value105?.model || 'gemini-3.1-pro',
    textExecution2 = resolveTextExecution(value105, value106),
    provider2 = resolveTextProviderId(value105, value106, textExecution2);
  let response8;
  try {
    const value107 = headers.isProxy ? buildApiUrl(headers.url) : headers.url;
    response8 = await fetchWithTimeout(
      value107,
      { method: 'POST', headers: headers.headers, body: JSON.stringify(headers.body) },
      GENERATION_TIMEOUT,
    );
  } catch (value108) {
    throw parseNetworkError(provider2, value108, GENERATION_TIMEOUT);
  }
  if (!response8.ok) {
    const error6 = await response8.text().catch(() => '');
    let value109;
    try {
      value109 = JSON.parse(error6);
    } catch {
      value109 = { error: error6 };
    }
    throw parseError(provider2, value109, response8.status);
  }
  const value110 = await response8.text();
  if (isRunningHubTextModel(provider2, value105.model)) {
    const response9 = parseRunningHubResponseData(value110),
      count4 = Number(response9?.code);
    if (Number.isFinite(count4) && count4 !== 0)
      throw new Error(getRunningHubTextErrorMessage(response9, '文本任务创建失败'));
    const extractTextContent2 = extractTextContent(response9, headers.responseMapping);
    if (extractTextContent2) return { text: sanitizeGeneratedText(extractTextContent2) };
    let raw = response9;
    const value111 = String(response9?.status || response9?.data?.status || '').toUpperCase(),
      isChatCompletionResponse2 = isChatCompletionResponse(response9) ? '' : getRunningHubTaskId(response9);
    if (
      ['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED'].includes(value111) ||
      (isChatCompletionResponse2 && !['SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(value111))
    ) {
      if (!isChatCompletionResponse2) throw new Error('RunningHUB 文本任务创建成功但未返回 taskId');
      raw = await pollRunningHubTextTask(isChatCompletionResponse2, headers.body.apiKey, provider2);
    } else {
      if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(value111))
        throw new Error(getRunningHubTextErrorMessage(response9, '文本任务创建失败'));
    }
    const extractTextContent3 = extractTextContent(raw, headers.responseMapping);
    if (!extractTextContent3)
      throw new ApiError({
        type: 'PARSE_ERROR',
        provider: provider2,
        message: 'RunningHUB 未返回文本内容',
        raw: raw,
        retryable: false,
      });
    return { text: sanitizeGeneratedText(extractTextContent3) };
  }
  const raw2 = parseTextResponse(value110, response8.status),
    extractTextContent4 = extractTextContent(raw2, headers.responseMapping);
  if (!extractTextContent4)
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: provider2,
      message: '服务端未返回文本内容',
      raw: raw2,
      retryable: false,
    });
  return { text: sanitizeGeneratedText(extractTextContent4) };
}
