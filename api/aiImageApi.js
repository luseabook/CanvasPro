import { saveImage } from '../src/modules/storage.js';
import { compressImage } from '../src/modules/imageUtils.js';
import * as RunningHubAdapter from './adapters/RunningHubAdapter.js';
import {
  buildImageRequestFromManifest,
  resolveManifestTaskPolling,
} from './adapters/ModelApiManifestNormalizer.js';
import { resolveMappedResponseValue, resolveMappedResponseValues } from './adapters/modelApiMappingEngine.js';
import { ensureConfig, getProviderConfig } from './configApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { processInputImages, processInputImagesPreserveOrder } from './imageUploadApi.js';
import { normalizeApimartBaseUrl } from './apimartUploadApi.js';
import { uploadInputsToVolcengineFiles } from './volcengineFileApi.js';
import { cancelRunningHubTask } from './runninghubTaskApi.js';
import {
  runDreaminaImageGeneration,
  pollDreaminaUntilDone,
  normalizeDreaminaTaskSnapshot,
} from './dreaminaGenApi.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../src/utils/localMediaPath.js';
import { isModelApiModel, resolveModelExecution, resolveModelProvider } from '../src/manifests/index.js';
import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import { ApiError, ErrorType, parseError, parseTaskError, parseNetworkError } from './errors/index.js';
const GENERATION_TIMEOUT = 10 * 60 * 0x3e8;
export async function cancelRunningHubImageTask({ apiKey: _0x5b8ee6, taskId: _0x1bc403 } = {}) {
  return cancelRunningHubTask({ apiKey: _0x5b8ee6, taskId: _0x1bc403 });
}
const GENERATION_RETRIES = 2,
  GENERATION_RETRY_DELAY = 0x3e8;
function getProviderId(_0x1780be) {
  return resolveModelProvider(_0x1780be?.model, _0x1780be?.provider);
}
function resolveModelApiExecutionForPayload(_0xdbbf19, _0x240a7e) {
  const _0xa083fe = String(_0x240a7e || '')
      .trim()
      .toLowerCase(),
    _0x36331d = String(_0xdbbf19?.model || '').trim();
  if (!_0x36331d) return null;
  const _0x526dc9 = resolveModelExecution(_0x36331d, { providerHint: _0xa083fe }),
    _0x21747d = _0x526dc9?.executionManifest;
  if (!_0x21747d || _0x21747d.adapterType !== 'modelApi' || _0x21747d.kind !== 'image') return null;
  return _0x21747d;
}
function resolveImageTaskRuntimeOptions(_0x54cba4 = {}, _0x3df42b = '', _0x3d07a8 = {}) {
  const _0x1e6f49 = String(_0x54cba4?.model || '').trim();
  if (!_0x1e6f49) return _0x3d07a8 || {};
  const _0x4fcbe2 = String(_0x3df42b || getProviderId(_0x54cba4) || '')
      .trim()
      .toLowerCase(),
    _0x3e36a6 = resolveModelExecution(_0x1e6f49, { providerHint: _0x4fcbe2 }),
    _0x4fe281 = _0x3e36a6?.executionManifest;
  if (!_0x4fe281 || _0x4fe281.adapterType !== 'modelApi' || _0x4fe281.kind !== 'image')
    return _0x3d07a8 || {};
  const _0x1b975e = String(_0x4fe281.provider || _0x4fcbe2)
      .trim()
      .toLowerCase(),
    _0x4d1e9a = getProviderConfig(_0x1b975e),
    _0x8fc2b3 = resolveManifestTaskPolling(_0x1b975e, _0x4d1e9a, _0x4fe281, {
      modelManifest: _0x3e36a6?.modelManifest || null,
    });
  return {
    ...(_0x3d07a8 || {}),
    ...(!_0x3d07a8?.responseMapping && _0x4fe281.responseMapping
      ? { responseMapping: _0x4fe281.responseMapping }
      : {}),
    ...(!_0x3d07a8?.taskPolling && _0x8fc2b3 ? { taskPolling: _0x8fc2b3 } : {}),
  };
}
function shouldSubmitProviderBatchOnce(_0x4d847c, _0x39dee0, _0x4ba446) {
  if (!(Number.parseInt(_0x4ba446, 10) > 1)) return false;
  const _0x1e82a7 = resolveModelApiExecutionForPayload(_0x4d847c, _0x39dee0),
    _0x2898ba = _0x1e82a7?.extensions?.batchSubmitMode;
  if (_0x2898ba === 'providerN') return true;
  if (!_0x2898ba || typeof _0x2898ba !== 'object' || Array.isArray(_0x2898ba)) return false;
  if (String(_0x2898ba.type || '').trim() !== 'providerN') return false;
  if (_0x2898ba.requiresInputImages === true) {
    const _0xdf9c48 = [_0x4d847c?.inputUrls, _0x4d847c?.image_urls, _0x4d847c?.imageUrls, _0x4d847c?.images],
      _0x132d12 = _0xdf9c48.some((_0x5dbcb2) =>
        Array.isArray(_0x5dbcb2)
          ? _0x5dbcb2.some((_0x37fd22) => String(_0x37fd22 || '').trim())
          : String(_0x5dbcb2 || '').trim(),
      );
    if (!_0x132d12) return false;
  }
  const _0x2274aa = String(_0x2898ba.field || '').trim();
  if (!_0x2274aa) return true;
  const _0x3c3b5d = Array.isArray(_0x2898ba.values) ? _0x2898ba.values : [_0x2898ba.value],
    _0x1c7ce2 = _0x3c3b5d
      .map((_0x468b04) =>
        String(_0x468b04 ?? '')
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
  if (_0x1c7ce2.length === 0) return true;
  const _0x5c6c47 = String(_0x4d847c?.[_0x2274aa] ?? '')
    .trim()
    .toLowerCase();
  return _0x1c7ce2.includes(_0x5c6c47);
}
function resolveImageGenerationBatchSize(_0x325be1, _0x3b4763) {
  const _0x110625 = parseInt(_0x325be1?.batchSize, 10) || 1,
    _0x586b19 = resolveModelApiExecutionForPayload(_0x325be1, _0x3b4763),
    _0x5ed065 = Number.parseInt(_0x586b19?.extensions?.fixedBatchSize, 10);
  if (Number.isFinite(_0x5ed065) && _0x5ed065 >= 1) return _0x5ed065;
  const _0x5219be = Number.parseInt(_0x586b19?.extensions?.maxBatchSize, 10);
  if (Number.isFinite(_0x5219be) && _0x5219be >= 1) return Math.min(_0x110625, _0x5219be);
  return _0x110625;
}
function isRunningHubOpenApiV2AiApp(_0x169fda) {
  const _0x38bb4f = String(_0x169fda?.model || ''),
    _0x292f8f = resolveModelExecution(_0x38bb4f)?.executionManifest;
  if (
    _0x292f8f?.adapterType === 'workflow' &&
    _0x292f8f?.submitMode === 'openapi-v2-ai-app' &&
    _0x292f8f?.queryMode === 'openapi-v2-query'
  )
    return true;
  return false;
}
function getDreaminaModelVersion(_0x24c3cf) {
  const _0x2333a0 = String(_0x24c3cf?.modelVersion || '').trim();
  if (_0x2333a0) return _0x2333a0;
  const _0xa35214 = String(_0x24c3cf?.model || '').trim();
  if (resolveModelProvider(_0xa35214, _0x24c3cf?.provider) !== 'dreamina') return '';
  const _0x89fe63 = (_0xa35214.split('/')[1] || '').trim();
  return /^(4\.0|4\.1|4\.5|5\.0)$/.test(_0x89fe63) ? _0x89fe63 : '';
}
function getDreaminaAspectRatio(_0x40a3e6, _0x20a625) {
  const _0x11f5e9 = String(_0x40a3e6?.resolvedRatioLabel || '').trim();
  if (_0x11f5e9) return _0x11f5e9;
  const _0x4aa1bb = String(_0x40a3e6?.aspectRatio || '').trim();
  if (!_0x4aa1bb) return '';
  if (_0x4aa1bb === '自适应' || _0x4aa1bb === 'auto') return _0x20a625 ? '' : '1:1';
  return _0x4aa1bb;
}
function buildDreaminaImageSubmitRequest(_0x1cd438, _0x3b52c8) {
  const _0x25ae2e = Array.isArray(_0x1cd438.inputUrls) ? _0x1cd438.inputUrls.filter(Boolean) : [],
    _0x3eeef8 = _0x25ae2e.length > 0,
    _0x2400d8 = getDreaminaModelVersion(_0x1cd438),
    _0x55bc91 = getDreaminaAspectRatio(_0x1cd438, _0x3eeef8),
    _0x9255e4 = String(_0x1cd438.imageSize || '')
      .trim()
      .toLowerCase(),
    _0x4ba18a = { prompt: _0x3b52c8 };
  if (_0x55bc91) _0x4ba18a.ratio = _0x55bc91;
  if (_0x9255e4) _0x4ba18a.resolutionType = _0x9255e4;
  if (_0x2400d8) _0x4ba18a.modelVersion = _0x2400d8;
  if (_0x25ae2e.length > 0)
    return {
      url: '/api/v2/dreamina/image2image',
      headers: { 'Content-Type': 'application/json' },
      body: { ..._0x4ba18a, images: _0x25ae2e },
    };
  return {
    url: '/api/v2/dreamina/text2image',
    headers: { 'Content-Type': 'application/json' },
    body: _0x4ba18a,
  };
}
function getImageExecution(_0x53659b, _0x5d1a9f) {
  return resolveModelExecution(_0x53659b?.model, { providerHint: _0x5d1a9f });
}
function createMissingImageManifestError(_0x1b4a29, _0x49514f) {
  const _0x1e402b = String(_0x1b4a29?.model || '').trim() || '(empty)',
    _0x20839b = String(_0x49514f || '')
      .trim()
      .toLowerCase();
  if (_0x20839b === 'runninghubwf')
    return new Error(
      'RunningHub workflow manifest missing: ' + _0x1e402b + '; RunningHUB request requires a manifest',
    );
  if (_0x20839b === 'runninghub') return new Error('RunningHub model API manifest missing: ' + _0x1e402b);
  const _0x4dcb3f = {
      agnes: 'Agnes AI',
      apimart: 'APIMart',
      grsai: 'GRSAI',
      ppio: 'PPIO',
      volcengine: 'Volcengine',
    },
    _0x36b656 = _0x4dcb3f[_0x20839b];
  if (_0x36b656) return new Error(_0x36b656 + ' image model API manifest missing: ' + _0x1e402b);
  return new Error('Image model API manifest missing: ' + _0x1e402b);
}
function collectDeepMediaUrls(_0x2ff74f, _0x5cf6f8 = 0, _0x3aa199 = new WeakSet()) {
  if (_0x2ff74f === undefined || _0x2ff74f === null || _0x5cf6f8 > 8) return [];
  if (typeof _0x2ff74f === 'string') {
    const _0x8df5ba = _0x2ff74f.trim();
    return /^https?:\/\//i.test(_0x8df5ba) ? [_0x8df5ba] : [];
  }
  if (Array.isArray(_0x2ff74f))
    return _0x2ff74f.flatMap((_0xedcf5a) => collectDeepMediaUrls(_0xedcf5a, _0x5cf6f8 + 1, _0x3aa199));
  if (typeof _0x2ff74f !== 'object') return [];
  if (_0x3aa199.has(_0x2ff74f)) return [];
  _0x3aa199.add(_0x2ff74f);
  const _0x24117e = ['url', 'imageUrl', 'image_url', 'fileUrl', 'file_url', 'downloadUrl', 'download_url'],
    _0x54d6d2 = [];
  for (const _0x121e3e of _0x24117e) {
    _0x54d6d2.push(...collectDeepMediaUrls(_0x2ff74f[_0x121e3e], _0x5cf6f8 + 1, _0x3aa199));
  }
  const _0x531d6e = ['results', 'result', 'images', 'image', 'outputs', 'output', 'data'];
  for (const _0x586c57 of _0x531d6e) {
    _0x54d6d2.push(...collectDeepMediaUrls(_0x2ff74f[_0x586c57], _0x5cf6f8 + 1, _0x3aa199));
  }
  return Array.from(new Set(_0x54d6d2.filter(Boolean)));
}
function extractImageUrls(_0xf639e, _0x395500 = null) {
  const _0x38a7fd = resolveMappedResponseValues(_0xf639e, _0x395500?.resultPaths);
  if (_0x38a7fd.length > 0) return _0x38a7fd;
  const _0x4ac1de = [];
  if (_0xf639e.data?.result?.images && Array.isArray(_0xf639e.data.result.images))
    _0x4ac1de.push(
      ..._0xf639e.data.result.images.map((_0x454836) =>
        Array.isArray(_0x454836.url) ? _0x454836.url[0] : _0x454836.url,
      ),
    );
  else {
    if (_0xf639e.result?.images && Array.isArray(_0xf639e.result.images))
      _0x4ac1de.push(
        ..._0xf639e.result.images.map((_0x2e584b) =>
          Array.isArray(_0x2e584b.url) ? _0x2e584b.url[0] : _0x2e584b.url,
        ),
      );
    else {
      if (_0xf639e.status === 'succeeded' && _0xf639e.results)
        _0x4ac1de.push(..._0xf639e.results.map((_0x18e19c) => _0x18e19c.url));
      else {
        if (_0xf639e.data?.[0]?.url) _0x4ac1de.push(..._0xf639e.data.map((_0x3bd38d) => _0x3bd38d.url));
        else {
          if (_0xf639e.data?.[0]?.fileUrl)
            _0x4ac1de.push(..._0xf639e.data.map((_0x15f776) => _0x15f776.fileUrl));
          else {
            if (_0xf639e.data?.results)
              _0x4ac1de.push(..._0xf639e.data.results.map((_0x32b2b8) => _0x32b2b8.url));
            else {
              if (_0xf639e.data?.[0]?.image)
                _0x4ac1de.push(..._0xf639e.data.map((_0x5403bd) => _0x5403bd.image));
              else {
                if (Array.isArray(_0xf639e.images))
                  _0x4ac1de.push(
                    ..._0xf639e.images.map((_0x166b7d) =>
                      typeof _0x166b7d === 'string' ? _0x166b7d : _0x166b7d.url || _0x166b7d.image_url,
                    ),
                  );
                else {
                  if (Array.isArray(_0xf639e.image_urls))
                    _0x4ac1de.push(
                      ..._0xf639e.image_urls.map((_0x2dd0c2) =>
                        typeof _0x2dd0c2 === 'string' ? _0x2dd0c2 : _0x2dd0c2.url,
                      ),
                    );
                  else {
                    if (Array.isArray(_0xf639e.results))
                      _0x4ac1de.push(
                        ..._0xf639e.results.map(
                          (_0x3f530a) =>
                            _0x3f530a.url || _0x3f530a.imageUrl || _0x3f530a.image_url || _0x3f530a.image,
                        ),
                      );
                    else
                      (_0xf639e.url ||
                        _0xf639e.image_url ||
                        _0xf639e.fileUrl ||
                        _0xf639e.file_url ||
                        _0xf639e.image) &&
                        _0x4ac1de.push(
                          _0xf639e.url ||
                            _0xf639e.image_url ||
                            _0xf639e.fileUrl ||
                            _0xf639e.file_url ||
                            _0xf639e.image,
                        );
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return (
    _0x4ac1de.length === 0 && _0x4ac1de.push(...collectDeepMediaUrls(_0xf639e)),
    Array.from(new Set(_0x4ac1de.filter(Boolean)))
  );
}
function firstNonEmptyText(..._0x46eb4e) {
  for (const _0x5e9a7d of _0x46eb4e) {
    let _0x51951f = '';
    _0x5e9a7d && typeof _0x5e9a7d === 'object'
      ? (_0x51951f =
          firstNonEmptyText(
            _0x5e9a7d.message,
            _0x5e9a7d.errorMessage,
            _0x5e9a7d.error_message,
            _0x5e9a7d.reason,
            _0x5e9a7d.detail,
            _0x5e9a7d.details,
            _0x5e9a7d.msg,
          ) ||
          (() => {
            try {
              return JSON.stringify(_0x5e9a7d);
            } catch {
              return '';
            }
          })())
      : (_0x51951f = String(_0x5e9a7d || '').trim());
    if (_0x51951f) return _0x51951f;
  }
  return '';
}
function pickImageUrlFromResultItem(_0xef44ea) {
  if (typeof _0xef44ea === 'string') {
    const _0x468aa6 = _0xef44ea.trim();
    return /^https?:\/\//i.test(_0x468aa6) ? _0x468aa6 : '';
  }
  if (!_0xef44ea || typeof _0xef44ea !== 'object') return '';
  for (const _0x5fef1 of [
    'url',
    'imageUrl',
    'image_url',
    'fileUrl',
    'file_url',
    'downloadUrl',
    'download_url',
    'image',
  ]) {
    const _0x357a20 = _0xef44ea[_0x5fef1],
      _0x8934b4 = Array.isArray(_0x357a20) ? _0x357a20[0] : _0x357a20,
      _0x4ce6de = String(_0x8934b4 || '').trim();
    if (/^https?:\/\//i.test(_0x4ce6de)) return _0x4ce6de;
  }
  return collectDeepMediaUrls(_0xef44ea)[0] || '';
}
function pickImageResultError(_0x138faa) {
  if (!_0x138faa || typeof _0x138faa !== 'object') return '';
  const _0x296bbc = firstNonEmptyText(
    _0x138faa.error,
    _0x138faa.errorMessage,
    _0x138faa.message,
    _0x138faa.failure_reason,
    _0x138faa.failReason,
    _0x138faa.reason,
    _0x138faa.statusReason,
    _0x138faa?.data?.error,
    _0x138faa?.data?.errorMessage,
    _0x138faa?.data?.message,
    _0x138faa?.data?.failure_reason,
  );
  if (_0x296bbc) return _0x296bbc;
  const _0x211b62 = String(
    _0x138faa.status || _0x138faa.taskStatus || _0x138faa.task_status || _0x138faa.state || '',
  )
    .trim()
    .toLowerCase();
  if (
    [
      'failed',
      'fail',
      'error',
      'rejected',
      'blocked',
      'filtered',
      'content_filtered',
      'content-filtered',
      'sensitive',
      'violation',
    ].includes(_0x211b62)
  )
    return '生成失败';
  return '';
}
function getArrayAtPath(_0x2f763b, _0x5d361c) {
  const _0x586f09 = String(_0x5d361c || '')
    .split('.')
    .filter(Boolean)
    .reduce((_0xd62027, _0xb8cd60) => {
      if (_0xd62027 === undefined || _0xd62027 === null) return undefined;
      return _0xd62027[_0xb8cd60];
    }, _0x2f763b);
  return Array.isArray(_0x586f09) ? _0x586f09 : null;
}
function collectImageResultRecordArrays(_0x3ed400) {
  const _0x109bbe = [],
    _0x161018 = (_0x2582a0) => {
      if (!Array.isArray(_0x2582a0) || _0x109bbe.includes(_0x2582a0)) return;
      _0x109bbe.push(_0x2582a0);
    };
  for (const _0x2b0267 of [
    'data.result.images',
    'result.images',
    'results',
    'data.results',
    'data',
    'images',
    'image_urls',
    'outputs',
    'output.images',
    'output.results',
  ]) {
    _0x161018(getArrayAtPath(_0x3ed400, _0x2b0267));
  }
  return _0x109bbe;
}
function normalizeImageResultRecordItem(_0x147f8e) {
  const _0x340c53 = pickImageUrlFromResultItem(_0x147f8e),
    _0x1b1073 = _0x340c53 ? '' : pickImageResultError(_0x147f8e);
  if (!_0x340c53 && !_0x1b1073) return null;
  return {
    sourceUrl: _0x340c53,
    error: _0x1b1073,
    fullData: _0x147f8e && typeof _0x147f8e === 'object' ? _0x147f8e : undefined,
  };
}
function extractImageResultRecords(_0x16b4ea, _0x1073f1 = null) {
  for (const _0x371610 of collectImageResultRecordArrays(_0x16b4ea)) {
    const _0x3bbd66 = _0x371610.map((_0x9515a3) => normalizeImageResultRecordItem(_0x9515a3)).filter(Boolean);
    if (_0x3bbd66.length > 0) return _0x3bbd66;
  }
  const _0x4f85b1 = resolveMappedResponseValues(_0x16b4ea, _0x1073f1?.resultPaths);
  if (_0x4f85b1.length > 0) return _0x4f85b1.map((_0x2d33fe) => ({ sourceUrl: _0x2d33fe, error: '' }));
  return extractImageUrls(_0x16b4ea, _0x1073f1).map((_0x1058dc) => ({ sourceUrl: _0x1058dc, error: '' }));
}
function hasImageResultOutput(_0x573b1f, _0x1b8686 = null) {
  return extractImageResultRecords(_0x573b1f, _0x1b8686).some((_0x590ce9) =>
    String(_0x590ce9?.sourceUrl || '').trim(),
  );
}
export async function buildGenerateImageRequest(_0x17aa8b) {
  await ensureConfig();
  const _0x397f12 = applyCameraAngleToPrompt(_0x17aa8b.prompt, _0x17aa8b.cameraAngle),
    _0x440597 = getProviderId(_0x17aa8b || {}),
    _0x38193d = getImageExecution(_0x17aa8b, _0x440597),
    _0x3abd2d = _0x38193d?.executionManifest,
    _0x1f239c = _0x38193d?.modelManifest;
  if (_0x3abd2d?.adapterType === 'localRuntime' && _0x3abd2d?.runtime === 'dreaminaImage')
    return buildDreaminaImageSubmitRequest(_0x17aa8b, _0x397f12);
  const _0x154808 = {
    getProviderConfig: getProviderConfig,
    processInputImages: processInputImages,
    processInputImagesPreserveOrder: processInputImagesPreserveOrder,
    uploadInputsToVolcengineFiles: uploadInputsToVolcengineFiles,
  };
  if (_0x3abd2d?.adapterType === 'modelApi') {
    const _0x1c1214 = await buildImageRequestFromManifest(_0x17aa8b, _0x397f12, _0x154808, {
      expectedProvider: _0x1f239c?.provider || _0x440597,
    });
    if (_0x1c1214) return _0x1c1214;
    throw new Error(
      (_0x1f239c?.provider || _0x440597) + ' image model API manifest missing: ' + _0x17aa8b.model,
    );
  }
  if (_0x3abd2d?.adapterType === 'workflow')
    return RunningHubAdapter.buildImageRequest(_0x17aa8b, _0x397f12, _0x154808);
  throw createMissingImageManifestError(_0x17aa8b, _0x440597);
}
function parseResponseData(_0x1a8ba) {
  const _0x82c46c = _0x1a8ba.trim().replace(/^data:\s*/, '');
  try {
    return JSON.parse(_0x82c46c);
  } catch {
    const _0x596484 = extractSseJsonSnapshots(_0x1a8ba);
    if (_0x596484.length > 0) {
      for (const _0xe3162 of _0x596484) {
        if (resolveAsyncImageTaskId(_0xe3162)) return _0xe3162;
      }
      return _0x596484[_0x596484.length - 1];
    }
    throw new ApiError({ type: 'PARSE_ERROR', message: '无法解析服务端响应', retryable: false });
  }
}
function extractSseJsonSnapshots(_0x2b9eb4) {
  const _0x398731 = String(_0x2b9eb4 || '')
    .split('\n')
    .filter((_0x130bb6) => _0x130bb6.trim().startsWith('data:'));
  if (_0x398731.length === 0) return [];
  const _0x4a43b9 = [];
  for (const _0x358416 of _0x398731) {
    const _0x22f883 = String(_0x358416 || '')
      .trim()
      .replace(/^data:\s*/, '')
      .trim();
    if (!_0x22f883 || _0x22f883 === '[DONE]') continue;
    try {
      _0x4a43b9.push(JSON.parse(_0x22f883));
    } catch {}
  }
  return _0x4a43b9;
}
function resolveDirectOutputSnapshotFromRawText(_0x2607f2) {
  const _0x13b956 = extractSseJsonSnapshots(_0x2607f2);
  for (let _0x526ba0 = _0x13b956.length - 1; _0x526ba0 >= 0; _0x526ba0 -= 1) {
    const _0x17a12f = _0x13b956[_0x526ba0];
    if (hasImageResultOutput(_0x17a12f)) return _0x17a12f;
  }
  return null;
}
function extractTaskIdFromRawText(_0xc692c0) {
  const _0x571246 = String(_0xc692c0 || '');
  if (!_0x571246) return '';
  const _0x59a8c4 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"submit_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"submitId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"job_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"jobId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"request_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"requestId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"task"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"job"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"request"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"submit"\s*:\s*"?([a-zA-Z0-9._:-]{8,})"?/i,
    /"id"\s*:\s*"([^"]+)"/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\bsubmit[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\bjob[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /\brequest[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid|job_id|request_id)=([a-zA-Z0-9._:-]+)/i,
    /\bid\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]{8,})["']?/i,
  ];
  for (const _0xd4679a of _0x59a8c4) {
    const _0x257c27 = _0x571246.match(_0xd4679a),
      _0x766694 = String(_0x257c27?.[1] || '').trim();
    if (_0x766694) return _0x766694;
  }
  return '';
}
function extractRunningHubTaskIdFromRawText(_0x13d090) {
  const _0x4b62c6 = String(_0x13d090 || '');
  if (!_0x4b62c6) return '';
  const _0x3edbc0 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)(?:task_id|taskId|taskid)=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const _0xac9aa of _0x3edbc0) {
    const _0x743bad = _0x4b62c6.match(_0xac9aa),
      _0x107b34 = String(_0x743bad?.[1] || '')
        .replace(/,/g, '')
        .trim();
    if (_0x107b34) return _0x107b34;
  }
  return '';
}
function extractTaskIdFromResponseHeaders(_0x2142aa) {
  if (!_0x2142aa || typeof _0x2142aa.get !== 'function') return '';
  const _0x5c6582 = [
    'x-task-id',
    'x-taskid',
    'x-request-id',
    'x-requestid',
    'x-job-id',
    'x-jobid',
    'task-id',
    'taskid',
    'request-id',
    'requestid',
    'job-id',
    'jobid',
  ];
  for (const _0x438841 of _0x5c6582) {
    const _0x2b897a = String(_0x2142aa.get(_0x438841) || '').trim();
    if (_0x2b897a) return _0x2b897a;
  }
  if (typeof _0x2142aa.forEach === 'function') {
    let _0x394846 = '';
    _0x2142aa.forEach((_0x1b752e, _0x223cae) => {
      if (_0x394846) return;
      const _0x2d9bdf = String(_0x223cae || '')
          .trim()
          .toLowerCase(),
        _0x4cd15d = String(_0x1b752e || '').trim();
      if (!_0x4cd15d) return;
      ((_0x2d9bdf.includes('task') && _0x2d9bdf.includes('id')) ||
        (_0x2d9bdf.includes('job') && _0x2d9bdf.includes('id')) ||
        (_0x2d9bdf.includes('request') && _0x2d9bdf.includes('id')) ||
        (_0x2d9bdf.includes('submit') && _0x2d9bdf.includes('id'))) &&
        (_0x394846 = _0x4cd15d);
    });
    if (_0x394846) return _0x394846;
  }
  return '';
}
function normalizeTaskIdValue(_0x33b583) {
  return String(_0x33b583 ?? '')
    .replace(/,/g, '')
    .trim();
}
function resolveRunningHubTaskId(_0x1707ef, _0x55eabf, _0x3bb4a9) {
  const _0x453173 = extractRunningHubTaskIdFromRawText(_0x55eabf);
  if (_0x453173) return _0x453173;
  const _0x4dc34c = Array.isArray(_0x1707ef?.data)
      ? _0x1707ef.data[0]
      : _0x1707ef?.data && typeof _0x1707ef.data === 'object'
        ? _0x1707ef.data
        : null,
    _0x489233 = Array.isArray(_0x1707ef?.results)
      ? _0x1707ef.results[0]
      : _0x1707ef?.results && typeof _0x1707ef.results === 'object'
        ? _0x1707ef.results
        : null,
    _0x3907c2 = _0x1707ef?.result && typeof _0x1707ef.result === 'object' ? _0x1707ef.result : null,
    _0x30f739 = _0x1707ef?.output && typeof _0x1707ef.output === 'object' ? _0x1707ef.output : null,
    _0x91bf1 = _0x1707ef?.response && typeof _0x1707ef.response === 'object' ? _0x1707ef.response : null,
    _0x26c99c = [
      _0x1707ef?.taskId,
      _0x1707ef?.task_id,
      _0x1707ef?.data?.taskId,
      _0x1707ef?.data?.task_id,
      _0x4dc34c?.taskId,
      _0x4dc34c?.task_id,
      _0x3907c2?.taskId,
      _0x3907c2?.task_id,
      _0x30f739?.taskId,
      _0x30f739?.task_id,
      _0x91bf1?.taskId,
      _0x91bf1?.task_id,
      _0x489233?.taskId,
      _0x489233?.task_id,
    ];
  for (const _0x32b7b8 of _0x26c99c) {
    const _0x45f7df = normalizeTaskIdValue(_0x32b7b8);
    if (_0x45f7df) return _0x45f7df;
  }
  return normalizeTaskIdValue(extractTaskIdFromResponseHeaders(_0x3bb4a9));
}
function looksLikeTaskToken(_0x320314) {
  const _0x58fe51 = String(_0x320314 ?? '').trim();
  if (!_0x58fe51) return false;
  if (_0x58fe51.length < 8) return false;
  const _0x54193b = _0x58fe51.toLowerCase();
  if (
    _0x54193b === 'pending' ||
    _0x54193b === 'running' ||
    _0x54193b === 'success' ||
    _0x54193b === 'failed' ||
    _0x54193b === 'queued' ||
    _0x54193b === 'submitted'
  )
    return false;
  return /^[a-zA-Z0-9._:-]+$/.test(_0x58fe51);
}
function resolveAsyncImageTaskIdLoose(_0x5a46a7) {
  if (!_0x5a46a7 || typeof _0x5a46a7 !== 'object') return '';
  const _0x558acf = [
    _0x5a46a7?.data,
    _0x5a46a7?.task,
    _0x5a46a7?.job,
    _0x5a46a7?.request,
    _0x5a46a7?.submit,
    _0x5a46a7?.payload?.task,
    _0x5a46a7?.payload?.task_id,
    _0x5a46a7?.payload?.taskId,
  ];
  for (const _0x1ad7c9 of _0x558acf) {
    if (typeof _0x1ad7c9 === 'string' || typeof _0x1ad7c9 === 'number') {
      const _0x27c883 = String(_0x1ad7c9).trim();
      if (looksLikeTaskToken(_0x27c883)) return _0x27c883;
    }
  }
  const _0x5c9de5 = findFirstDeepValueByKeyPattern(
    _0x5a46a7,
    /^(task|job|request|submit|task_?id|job_?id|request_?id|submit_?id)$/i,
  );
  if (looksLikeTaskToken(_0x5c9de5)) return _0x5c9de5;
  return '';
}
function findFirstDeepValueByKeyPattern(_0x1cac83, _0x1c7d5c, _0x500b33 = 8) {
  if (!_0x1cac83 || typeof _0x1cac83 !== 'object') return '';
  const _0x437fa3 = new WeakSet(),
    _0x4b748a = [{ value: _0x1cac83, depth: 0 }];
  while (_0x4b748a.length > 0) {
    const { value: _0xbfc91, depth: _0x3430ca } = _0x4b748a.shift();
    if (!_0xbfc91 || typeof _0xbfc91 !== 'object') continue;
    if (_0x437fa3.has(_0xbfc91)) continue;
    _0x437fa3.add(_0xbfc91);
    if (_0x3430ca > _0x500b33) continue;
    const _0x3178c8 = Array.isArray(_0xbfc91)
      ? _0xbfc91.map((_0x2aa687, _0x374c6a) => [String(_0x374c6a), _0x2aa687])
      : Object.entries(_0xbfc91);
    for (const [_0x8f276a, _0x4468c8] of _0x3178c8) {
      const _0x227493 = String(_0x8f276a || '')
        .trim()
        .toLowerCase();
      if (_0x1c7d5c.test(_0x227493)) {
        const _0x124e65 = String(_0x4468c8 ?? '').trim();
        if (_0x124e65) return _0x124e65;
      }
      _0x4468c8 &&
        typeof _0x4468c8 === 'object' &&
        _0x4b748a.push({ value: _0x4468c8, depth: _0x3430ca + 1 });
    }
  }
  return '';
}
function extractTaskStatusFromRawText(_0x59fe1e) {
  const _0x4d9ee1 = String(_0x59fe1e || '');
  if (!_0x4d9ee1) return '';
  const _0x5b9536 = [
    /"status"\s*:\s*"([^"]+)"/i,
    /"taskStatus"\s*:\s*"([^"]+)"/i,
    /"task_status"\s*:\s*"([^"]+)"/i,
    /"phase"\s*:\s*"([^"]+)"/i,
    /"state"\s*:\s*"([^"]+)"/i,
    /\bstatus\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
    /\bphase\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
    /\bstate\b\s*[:=]\s*["']?([a-zA-Z_]+)["']?/i,
  ];
  for (const _0x3b57fb of _0x5b9536) {
    const _0x44a805 = _0x4d9ee1.match(_0x3b57fb),
      _0x455a5b = String(_0x44a805?.[1] || '').trim();
    if (_0x455a5b) return _0x455a5b.toLowerCase();
  }
  return '';
}
function resolveAsyncImageTaskId(_0x476682, _0xbc31b7 = null) {
  const _0x36486e = resolveMappedResponseValue(_0x476682, _0xbc31b7?.taskIdPath);
  if (_0x36486e) return _0x36486e;
  const _0x40d055 = Array.isArray(_0x476682?.data)
      ? _0x476682.data[0]
      : _0x476682?.data && typeof _0x476682.data === 'object'
        ? _0x476682.data
        : null,
    _0xe06530 = Array.isArray(_0x476682?.results)
      ? _0x476682.results[0]
      : _0x476682?.results && typeof _0x476682.results === 'object'
        ? _0x476682.results
        : null,
    _0x325c34 = _0x476682?.result && typeof _0x476682.result === 'object' ? _0x476682.result : null,
    _0x584eb5 = _0x476682?.output && typeof _0x476682.output === 'object' ? _0x476682.output : null,
    _0x5f479b = _0x476682?.response && typeof _0x476682.response === 'object' ? _0x476682.response : null,
    _0x31ab01 =
      _0x40d055?.task_id ||
      _0x40d055?.taskId ||
      _0x40d055?.id ||
      _0x325c34?.task_id ||
      _0x325c34?.taskId ||
      _0x325c34?.id ||
      _0x584eb5?.task_id ||
      _0x584eb5?.taskId ||
      _0x584eb5?.id ||
      _0x5f479b?.task_id ||
      _0x5f479b?.taskId ||
      _0x5f479b?.id ||
      _0x476682?.task_id ||
      _0x476682?.taskId ||
      _0x476682?.data?.task_id ||
      _0x476682?.data?.taskId ||
      _0x476682?.data?.id ||
      _0x476682?.id ||
      _0xe06530?.task_id ||
      _0xe06530?.taskId ||
      _0xe06530?.id ||
      findFirstDeepValueByKeyPattern(_0x476682, /^(task_?id|taskid|request_?id|requestid)$/i) ||
      findFirstDeepValueByKeyPattern(_0x476682, /^id$/i) ||
      '';
  return String(_0x31ab01 || '').trim();
}
function resolveApimartTaskIdStrict(_0x484c29) {
  const _0x53ab52 = Array.isArray(_0x484c29?.data)
      ? _0x484c29.data[0]
      : _0x484c29?.data && typeof _0x484c29.data === 'object'
        ? _0x484c29.data
        : null,
    _0x2977e6 = Array.isArray(_0x484c29?.results)
      ? _0x484c29.results[0]
      : _0x484c29?.results && typeof _0x484c29.results === 'object'
        ? _0x484c29.results
        : null,
    _0x38fad9 = _0x484c29?.result && typeof _0x484c29.result === 'object' ? _0x484c29.result : null,
    _0x70e3b2 = _0x484c29?.output && typeof _0x484c29.output === 'object' ? _0x484c29.output : null,
    _0x423a01 = _0x484c29?.response && typeof _0x484c29.response === 'object' ? _0x484c29.response : null,
    _0x1d9595 =
      _0x53ab52?.task_id ||
      _0x53ab52?.taskId ||
      _0x38fad9?.task_id ||
      _0x38fad9?.taskId ||
      _0x70e3b2?.task_id ||
      _0x70e3b2?.taskId ||
      _0x423a01?.task_id ||
      _0x423a01?.taskId ||
      _0x484c29?.task_id ||
      _0x484c29?.taskId ||
      _0x484c29?.data?.task_id ||
      _0x484c29?.data?.taskId ||
      _0x2977e6?.task_id ||
      _0x2977e6?.taskId ||
      findFirstDeepValueByKeyPattern(_0x484c29, /^(task_?id|taskid)$/i) ||
      '';
  return String(_0x1d9595 || '').trim();
}
function collectApimartFallbackTaskIdCandidates(_0x2c1bfa) {
  const _0x3f40ae = [],
    _0x41e82f = (_0x2133f1) => {
      const _0x2ec020 = String(_0x2133f1 || '').trim();
      if (!_0x2ec020 || _0x3f40ae.includes(_0x2ec020)) return;
      _0x3f40ae.push(_0x2ec020);
    },
    _0x5cc2cf = Array.isArray(_0x2c1bfa?.data)
      ? _0x2c1bfa.data[0]
      : _0x2c1bfa?.data && typeof _0x2c1bfa.data === 'object'
        ? _0x2c1bfa.data
        : null,
    _0x2a3689 = Array.isArray(_0x2c1bfa?.results)
      ? _0x2c1bfa.results[0]
      : _0x2c1bfa?.results && typeof _0x2c1bfa.results === 'object'
        ? _0x2c1bfa.results
        : null,
    _0x569040 = _0x2c1bfa?.result && typeof _0x2c1bfa.result === 'object' ? _0x2c1bfa.result : null,
    _0x2bbdf0 = _0x2c1bfa?.output && typeof _0x2c1bfa.output === 'object' ? _0x2c1bfa.output : null,
    _0x409c6f = _0x2c1bfa?.response && typeof _0x2c1bfa.response === 'object' ? _0x2c1bfa.response : null;
  return (
    _0x41e82f(_0x5cc2cf?.id),
    _0x41e82f(_0x569040?.id),
    _0x41e82f(_0x2bbdf0?.id),
    _0x41e82f(_0x409c6f?.id),
    _0x41e82f(_0x2a3689?.id),
    _0x41e82f(_0x2c1bfa?.data?.id),
    _0x41e82f(_0x2c1bfa?.id),
    _0x3f40ae
  );
}
function extractApimartTaskIdFromRawText(_0x27a06b) {
  const _0xfc8711 = String(_0x27a06b || '');
  if (!_0xfc8711) return '';
  const _0xec4282 = [
    /"task_id"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskId"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /"taskid"\s*:\s*"?([a-zA-Z0-9._:-]+)"?/i,
    /\btask[_-]?id\b\s*[:=]\s*["']?([a-zA-Z0-9._:-]+)["']?/i,
    /(?:\?|&)task_id=([a-zA-Z0-9._:-]+)/i,
  ];
  for (const _0x5208ff of _0xec4282) {
    const _0x5c19f6 = _0xfc8711.match(_0x5208ff),
      _0x327d48 = String(_0x5c19f6?.[1] || '').trim();
    if (_0x327d48) return _0x327d48;
  }
  return '';
}
function buildApimartTaskStatusUrl(_0x410d8f, _0x1eef4c = null, _0x53bf47 = '') {
  const _0x3e79ba = String(_0x410d8f || '').trim(),
    _0x315598 = buildManifestPollCandidate(_0x3e79ba, _0x1eef4c);
  if (_0x315598?.url) return _0x315598.url;
  const _0x56e465 = normalizeApimartBaseUrl(_0x53bf47);
  return _0x56e465 + '/v1/tasks/' + encodeURIComponent(_0x3e79ba) + '?language=zh';
}
async function probeApimartTaskIdCandidate(_0x3da37c, _0x10081a, _0x1e60f1 = {}) {
  const _0x27f5b7 = String(_0x3da37c || '').trim();
  if (!_0x27f5b7) return '';
  const _0x41c80c = getProviderConfig('apimart'),
    _0x57d293 = String(_0x10081a?.apiKey || _0x41c80c?.apiKey || '').trim();
  if (!_0x57d293) return '';
  try {
    const _0x23a28b = await requester({
        url:
          '/api/v2/proxy/task?apiUrl=' +
          encodeURIComponent(buildApimartTaskStatusUrl(_0x27f5b7, _0x1e60f1?.taskPolling, _0x41c80c?.apiUrl)),
        method: 'GET',
        headers: { Authorization: 'Bearer ' + _0x57d293 },
        provider: 'apimart',
        timeout: 0x7530,
        signal: _0x1e60f1?.signal,
      }),
      _0x5b4a64 = normalizeTaskSnapshotPayload(_0x23a28b),
      _0x51bfe9 =
        _0x5b4a64 &&
        typeof _0x5b4a64 === 'object' &&
        _0x5b4a64.data &&
        typeof _0x5b4a64.data === 'object' &&
        !Array.isArray(_0x5b4a64.data),
      _0xb10d38 = _0x51bfe9
        ? { ..._0x5b4a64, ..._0x5b4a64.data }
        : normalizeTaskSnapshotPayload(_0x23a28b?.data || _0x23a28b),
      _0x2f43a8 = parseTaskError('apimart', _0xb10d38);
    if (_0x2f43a8) return '';
    return _0x27f5b7;
  } catch {
    return '';
  }
}
async function resolveApimartTaskIdByProbe(_0x5f322c, _0x3c6e83, _0x8e4dfa = {}) {
  const _0x1f11a6 = collectApimartFallbackTaskIdCandidates(_0x5f322c);
  for (const _0x9b4b72 of _0x1f11a6) {
    const _0x84e33f = await probeApimartTaskIdCandidate(_0x9b4b72, _0x3c6e83, _0x8e4dfa);
    if (_0x84e33f) return _0x84e33f;
  }
  return '';
}
function resolveAsyncImageTaskStatus(_0x458a34) {
  const _0x58f96d = Array.isArray(_0x458a34?.data)
      ? _0x458a34.data[0]
      : _0x458a34?.data && typeof _0x458a34.data === 'object'
        ? _0x458a34.data
        : null,
    _0x3d4892 = Array.isArray(_0x458a34?.results)
      ? _0x458a34.results[0]
      : _0x458a34?.results && typeof _0x458a34.results === 'object'
        ? _0x458a34.results
        : null,
    _0x4b7b5c = _0x458a34?.result && typeof _0x458a34.result === 'object' ? _0x458a34.result : null,
    _0x455fbd = _0x458a34?.output && typeof _0x458a34.output === 'object' ? _0x458a34.output : null,
    _0x2f0f21 = _0x458a34?.response && typeof _0x458a34.response === 'object' ? _0x458a34.response : null;
  return String(
    _0x58f96d?.status ||
      _0x458a34?.status ||
      _0x458a34?.taskStatus ||
      _0x458a34?.task_status ||
      _0x458a34?.data?.status ||
      _0x4b7b5c?.status ||
      _0x4b7b5c?.taskStatus ||
      _0x4b7b5c?.task_status ||
      _0x455fbd?.status ||
      _0x455fbd?.taskStatus ||
      _0x455fbd?.task_status ||
      _0x2f0f21?.status ||
      _0x2f0f21?.taskStatus ||
      _0x2f0f21?.task_status ||
      _0x3d4892?.status ||
      _0x458a34?.state ||
      _0x458a34?.phase ||
      findFirstDeepValueByKeyPattern(_0x458a34, /^(task_?status|taskstatus|status|state|phase)$/i) ||
      '',
  )
    .trim()
    .toLowerCase();
}
function normalizeTaskSnapshotPayload(_0x3b56a7) {
  if (_0x3b56a7 && typeof _0x3b56a7 === 'object') return _0x3b56a7;
  const _0x57d92b = String(_0x3b56a7 || '').trim();
  if (!_0x57d92b) return {};
  try {
    return parseResponseData(_0x57d92b);
  } catch {
    try {
      return JSON.parse(_0x57d92b);
    } catch {
      return { rawText: _0x57d92b };
    }
  }
}
function isAsyncTaskTerminalStatus(_0x4df8dd) {
  const _0x38b9d5 = String(_0x4df8dd || '')
    .trim()
    .toLowerCase();
  return [
    'success',
    'succeeded',
    'completed',
    'complete',
    'finished',
    'finish',
    'done',
    'failed',
    'fail',
    'error',
    'cancelled',
    'canceled',
    'idle',
  ].includes(_0x38b9d5);
}
function isAsyncTaskPendingStatus(_0x1d0a3b) {
  const _0x4c7a90 = String(_0x1d0a3b || '')
    .trim()
    .toLowerCase();
  return [
    'submitted',
    'pending',
    'queued',
    'waiting',
    'running',
    'processing',
    'querying',
    'in_progress',
  ].includes(_0x4c7a90);
}
function isAsyncTaskFailureStatus(_0x1a4454) {
  const _0x529f23 = String(_0x1a4454 || '')
    .trim()
    .toLowerCase();
  return ['failed', 'fail', 'error', 'cancelled', 'canceled', 'idle'].includes(_0x529f23);
}
function supportsAsyncImageTaskPolling(_0x32b597, _0x538f69 = {}) {
  const _0x85f5e = String(_0x32b597 || '')
    .trim()
    .toLowerCase();
  if (['apimart', 'ppio', 'grsai'].includes(_0x85f5e)) return true;
  const _0x116e7e = _0x538f69?.taskPolling;
  return !!(_0x116e7e && typeof _0x116e7e === 'object' && String(_0x116e7e.urlTemplate || '').trim());
}
function buildManifestPollCandidate(_0x558cc8, _0x44be81) {
  if (!_0x44be81 || typeof _0x44be81 !== 'object') return null;
  const _0x23ca86 = String(_0x44be81.urlTemplate || '').trim();
  if (!_0x23ca86) return null;
  return {
    method:
      String(_0x44be81.method || 'GET')
        .trim()
        .toUpperCase() || 'GET',
    mode: String(_0x44be81.mode || 'task-proxy').trim() || 'task-proxy',
    url: _0x23ca86.replace('{taskId}', encodeURIComponent(_0x558cc8)),
  };
}
async function pollAsyncImageTask(_0x2e161d, _0x63291e, _0x56e93f, _0x45a1ee = {}) {
  const _0x20873e = String(_0x2e161d || '').trim();
  if (!_0x20873e) throw new Error('缺少异步图片任务 ID');
  const _0x3ec75c = String(_0x56e93f || '')
      .trim()
      .toLowerCase(),
    _0x38311e = getProviderConfig(_0x3ec75c),
    _0x36148e = String(_0x63291e?.apiKey || _0x38311e?.apiKey || '').trim();
  if (!_0x36148e)
    throw ApiError.authError(_0x3ec75c, null, 'API Key 未配置（厂商：' + _0x3ec75c + '），无法轮询任务');
  for (let _0x1f36c9 = 0; _0x1f36c9 < 0x1c2; _0x1f36c9++) {
    if (_0x45a1ee?.signal?.aborted) throw new Error('CANCELLED');
    await new Promise((_0x52c8cb) => setTimeout(_0x52c8cb, 0x7d0));
    if (_0x45a1ee?.signal?.aborted) throw new Error('CANCELLED');
    const _0x73a685 = String(_0x38311e?.apiUrl || '').replace(/\/+$/, ''),
      _0x3cbfb0 = buildManifestPollCandidate(_0x20873e, _0x45a1ee?.taskPolling),
      _0x2bdeb7 =
        _0x3ec75c === 'apimart'
          ? [
              {
                method: 'GET',
                mode: 'task-proxy',
                url: buildApimartTaskStatusUrl(_0x20873e, null, _0x38311e?.apiUrl),
              },
            ]
          : _0x3ec75c === 'ppio'
            ? [{ method: 'GET', mode: 'task-proxy', url: _0x73a685 + '/v1/tasks/' + _0x20873e }]
            : [],
      _0x5461af = _0x3cbfb0 ? [_0x3cbfb0] : _0x2bdeb7;
    if (_0x5461af.length === 0) throw new Error('异步图片任务查询配置缺失（厂商：' + _0x3ec75c + '）');
    try {
      let _0x17745a = null,
        _0x1c166b = null;
      for (const _0xc22e59 of _0x5461af) {
        try {
          _0xc22e59.mode === 'image-proxy'
            ? (_0x17745a = await requester({
                url: '/api/v2/proxy/image',
                method: 'POST',
                provider: _0x3ec75c,
                timeout: 0x7530,
                signal: _0x45a1ee?.signal,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiUrl: _0xc22e59.url, apiKey: _0x36148e, ...(_0xc22e59.body || {}) }),
              }))
            : (_0x17745a = await requester({
                url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0xc22e59.url),
                method: 'GET',
                headers: { Authorization: 'Bearer ' + _0x36148e },
                provider: _0x3ec75c,
                timeout: 0x7530,
                signal: _0x45a1ee?.signal,
              }));
          _0x1c166b = null;
          break;
        } catch (_0x4c7f42) {
          _0x1c166b = _0x4c7f42;
          if (_0x4c7f42 instanceof ApiError) {
            if (
              _0x4c7f42.type === ErrorType.AUTH_ERROR ||
              _0x4c7f42.type === ErrorType.FORBIDDEN ||
              _0x4c7f42.type === ErrorType.INSUFFICIENT_BALANCE ||
              _0x4c7f42.type === ErrorType.MODEL_UNAVAILABLE
            )
              throw _0x4c7f42;
            if (_0x4c7f42.type === ErrorType.INVALID_PARAMS) throw _0x4c7f42;
          }
        }
      }
      if (!_0x17745a) {
        if (_0x1c166b instanceof ApiError) throw _0x1c166b;
        continue;
      }
      const _0x322dbd = normalizeTaskSnapshotPayload(_0x17745a),
        _0x34c1c5 =
          _0x322dbd &&
          typeof _0x322dbd === 'object' &&
          _0x322dbd.data &&
          typeof _0x322dbd.data === 'object' &&
          !Array.isArray(_0x322dbd.data),
        _0x44e5e4 = _0x34c1c5
          ? { ..._0x322dbd, ..._0x322dbd.data }
          : normalizeTaskSnapshotPayload(_0x17745a.data || _0x17745a),
        _0x10ddc3 = hasImageResultOutput(_0x44e5e4, _0x45a1ee?.responseMapping);
      if (_0x10ddc3) return _0x44e5e4;
      const _0x5b6967 = parseTaskError(_0x3ec75c, _0x44e5e4);
      if (_0x5b6967) throw _0x5b6967;
      const _0x5f4eaa = resolveAsyncImageTaskStatus(_0x44e5e4);
      if (['completed', 'succeeded', 'success'].includes(_0x5f4eaa)) return _0x44e5e4;
      if (isAsyncTaskPendingStatus(_0x5f4eaa)) continue;
      if (isAsyncTaskTerminalStatus(_0x5f4eaa)) {
        const _0x17ff53 = String(_0x44e5e4?.rawText || '');
        throw ApiError.taskFailed(
          _0x3ec75c,
          String(
            _0x44e5e4?.error ||
              _0x44e5e4?.errorMessage ||
              _0x44e5e4?.message ||
              extractTaskStatusFromRawText(_0x17ff53) ||
              '任务状态异常',
          ),
        );
      }
    } catch (_0xf6b5e5) {
      if (_0xf6b5e5 instanceof ApiError) {
        if (
          _0xf6b5e5.type === ErrorType.TASK_FAILED ||
          _0xf6b5e5.type === ErrorType.CONTENT_FILTERED ||
          _0xf6b5e5.type === ErrorType.TASK_TIMEOUT ||
          _0xf6b5e5.type === ErrorType.AUTH_ERROR ||
          _0xf6b5e5.type === ErrorType.FORBIDDEN ||
          _0xf6b5e5.type === ErrorType.INVALID_PARAMS ||
          _0xf6b5e5.type === ErrorType.INSUFFICIENT_BALANCE
        )
          throw _0xf6b5e5;
      }
    }
  }
  throw ApiError.taskTimeout(_0x3ec75c);
}
async function pollRunningHubTask(_0x20b7dc, _0x490ec1, _0x1f0d5f, _0x238e11) {
  const _0x5c793e = isModelApiModel(_0x490ec1.model, 'runninghub'),
    _0x50c78b = _0x238e11?.useOpenapiQuery === true || _0x5c793e || isRunningHubOpenApiV2AiApp(_0x490ec1),
    _0x42de28 =
      _0x238e11?.pollIntervalMs === undefined ? 0x7d0 : Math.max(0, Number(_0x238e11.pollIntervalMs) || 0),
    _0x247041 = Math.max(1, Number(_0x238e11?.maxPolls) || 0x1c2),
    _0x3ed48d = _0x238e11?.softTimeout === true,
    _0x3ce276 = getProviderConfig(_0x5c793e ? 'runninghub' : 'runninghubwf'),
    _0x39aca9 = _0x5c793e ? _0x3ce276.modelApiKey || _0x490ec1.apiKey : _0x3ce276.apiKey || _0x490ec1.apiKey;
  for (let _0x1f924b = 0; _0x1f924b < _0x247041; _0x1f924b++) {
    if (_0x238e11?.signal?.aborted) throw new Error('CANCELLED');
    _0x42de28 > 0 && (await new Promise((_0x167036) => setTimeout(_0x167036, _0x42de28)));
    if (_0x238e11?.signal?.aborted) throw new Error('CANCELLED');
    try {
      const _0x10f347 = await requester({
          url: _0x50c78b ? '/api/v2/proxy/image' : '/api/v2/runninghubwf/query',
          method: 'POST',
          provider: _0x1f0d5f,
          timeout: 0x7530,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            _0x50c78b
              ? { apiUrl: 'https://www.runninghub.cn/openapi/v2/query', apiKey: _0x39aca9, taskId: _0x20b7dc }
              : { apiKey: _0x39aca9, taskId: _0x20b7dc },
          ),
        }),
        _0x3ed666 = typeof _0x10f347?.code === 'number' ? _0x10f347.code : null;
      if (_0x3ed666 === 0x324 || _0x3ed666 === 0x32d) continue;
      if (_0x3ed666 !== null && _0x3ed666 !== 0) throw parseError(_0x1f0d5f, _0x10f347, 200);
      if (_0x50c78b && hasImageResultOutput(_0x10f347, _0x238e11?.responseMapping)) return _0x10f347;
      if (_0x3ed666 === 0 && Array.isArray(_0x10f347.data)) {
        const _0x29dc19 = _0x10f347.data.filter((_0x4fb80b) => _0x4fb80b && typeof _0x4fb80b === 'object');
        if (_0x29dc19.length === 0) continue;
        const _0x45454b = _0x29dc19.some((_0x1f8c3f) =>
          hasImageResultOutput(_0x1f8c3f, _0x238e11?.responseMapping),
        );
        if (_0x45454b) return _0x10f347;
        for (const _0x297e83 of _0x29dc19) {
          const _0x35ec0b = parseTaskError(_0x1f0d5f, _0x297e83);
          if (_0x35ec0b) throw _0x35ec0b;
        }
        const _0x5834ca = _0x29dc19
            .map((_0x340ee6) =>
              String(_0x340ee6?.status || _0x340ee6?.taskStatus || _0x340ee6?.task_status || '')
                .trim()
                .toUpperCase(),
            )
            .filter(Boolean),
          _0x22b3a9 = _0x29dc19.find((_0x3f54d1) =>
            ['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(
              String(_0x3f54d1?.status || _0x3f54d1?.taskStatus || _0x3f54d1?.task_status || '')
                .trim()
                .toUpperCase(),
            ),
          );
        if (_0x22b3a9)
          throw ApiError.taskFailed(
            _0x1f0d5f,
            String(_0x22b3a9?.errorMessage || _0x22b3a9?.error || _0x22b3a9?.message || '任务执行失败'),
          );
        if (_0x5834ca.some((_0x36a9ff) => ['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(_0x36a9ff)))
          continue;
        if (
          _0x5834ca.some((_0x14bbe8) =>
            ['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED', 'PROCESSING'].includes(_0x14bbe8),
          )
        )
          continue;
      }
      const _0x29de42 = _0x10f347.data && Object.keys(_0x10f347.data).length > 0 ? _0x10f347.data : _0x10f347,
        _0x3173a2 = hasImageResultOutput(_0x29de42, _0x238e11?.responseMapping);
      if (_0x3173a2) return _0x29de42;
      const _0x32fa6e = parseTaskError(_0x1f0d5f, _0x29de42);
      if (_0x32fa6e) throw _0x32fa6e;
      const _0x423461 = (_0x29de42.status || '').toUpperCase();
      if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED', 'CANCELED'].includes(_0x423461))
        throw ApiError.taskFailed(
          _0x1f0d5f,
          String(_0x29de42?.errorMessage || _0x29de42?.error || _0x29de42?.message || '任务执行失败'),
        );
      if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(_0x423461)) {
        if (!hasImageResultOutput(_0x29de42, _0x238e11?.responseMapping)) continue;
        return _0x29de42;
      }
      if (['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED', 'PROCESSING'].includes(_0x423461)) continue;
    } catch (_0x38324f) {
      if (_0x38324f instanceof ApiError) {
        if (_0x38324f.type === ErrorType.TIMEOUT) continue;
        if (
          _0x38324f.type === ErrorType.TASK_FAILED ||
          _0x38324f.type === ErrorType.TASK_TIMEOUT ||
          _0x38324f.type === ErrorType.AUTH_ERROR ||
          _0x38324f.type === ErrorType.FORBIDDEN ||
          _0x38324f.type === ErrorType.INVALID_PARAMS ||
          _0x38324f.type === ErrorType.CONTENT_FILTERED ||
          _0x38324f.type === ErrorType.INSUFFICIENT_BALANCE ||
          (_0x38324f.provider === 'runninghub' && _0x38324f.code !== null && _0x38324f.code !== undefined)
        )
          throw _0x38324f;
      }
    }
  }
  if (_0x3ed48d)
    return {
      pending: true,
      taskId: String(_0x20b7dc || '').trim(),
      status: 'running',
      message: '任务仍在 RunningHub 生成中',
    };
  throw ApiError.taskTimeout(_0x1f0d5f);
}
async function doGenerateOnce(_0xf091a9, _0x180b1b, _0x369bda) {
  const _0x57e0c4 = await buildGenerateImageRequest(_0xf091a9),
    _0x43916f = _0x57e0c4?.responseMapping || null,
    _0x243f83 = {
      ...(_0x369bda || {}),
      ...(_0x43916f ? { responseMapping: _0x43916f } : {}),
      ...(_0x57e0c4?.taskPolling ? { taskPolling: _0x57e0c4.taskPolling } : {}),
    },
    _0x3b3847 = _0x180b1b === 'runninghubwf' || _0x180b1b === 'runninghub',
    _0x4b445e = String(_0x57e0c4?.body?.apiUrl || ''),
    _0x56408c =
      _0x369bda?.useOpenapiQuery === true ||
      _0x57e0c4?.useOpenapiQuery === true ||
      (_0x180b1b === 'runninghubwf' &&
        _0x57e0c4?.url === '/api/v2/proxy/image' &&
        (typeof _0x57e0c4?.pollUrlBuilder === 'function' || _0x4b445e.includes('/openapi/v2/run/ai-app/'))) ||
      isModelApiModel(_0xf091a9?.model, _0x180b1b) ||
      isRunningHubOpenApiV2AiApp(_0xf091a9),
    _0x3ce503 = !!_0x369bda?.signal && _0x180b1b !== 'runninghubwf',
    _0x127e92 = String(
      _0xf091a9?.installId || globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '',
    ).trim(),
    _0x180970 = {
      ...(_0x57e0c4.headers || { 'Content-Type': 'application/json' }),
      ...(_0x127e92 ? { 'X-AIC-Install-Id': _0x127e92 } : {}),
    },
    _0x24f874 = _0x57e0c4.body;
  let _0x44efd6,
    _0x3ece95 = null;
  try {
    const _0x1cf936 = await requester({
      url: _0x57e0c4.url,
      method: 'POST',
      provider: _0x180b1b,
      timeout: GENERATION_TIMEOUT,
      retries: GENERATION_RETRIES,
      retryDelay: GENERATION_RETRY_DELAY,
      signal: _0x3ce503 ? _0x369bda?.signal : undefined,
      headers: _0x180970,
      body: JSON.stringify(_0x24f874),
      responseType: 'text',
      returnMeta: true,
    });
    ((_0x44efd6 = String(_0x1cf936?.data ?? '')), (_0x3ece95 = _0x1cf936?.headers || null));
  } catch (_0xf260ea) {
    if (_0xf260ea instanceof ApiError) throw _0xf260ea;
    throw parseNetworkError(_0x180b1b, _0xf260ea, GENERATION_TIMEOUT);
  }
  let _0x21eb24 = {},
    _0x2d8e86 = null;
  try {
    _0x21eb24 = parseResponseData(_0x44efd6);
  } catch (_0xea804d) {
    ((_0x2d8e86 = _0xea804d), (_0x21eb24 = {}));
  }
  if (_0x180b1b === 'runninghubwf') {
    const _0x97812c = typeof _0x21eb24?.code === 'number' ? _0x21eb24.code : null;
    if (_0x97812c !== null && _0x97812c !== 0) throw parseError(_0x180b1b, _0x21eb24, 200);
    const _0x26f7ca = resolveRunningHubTaskId(_0x21eb24, _0x44efd6, _0x3ece95);
    if (_0x26f7ca) {
      const _0x37ab4a = _0x180b1b + ':image:' + _0x26f7ca;
      (_0x369bda?.onTaskMeta?.({ taskId: _0x26f7ca, useOpenapiQuery: _0x56408c }),
        _0x369bda?.onTaskId?.(_0x26f7ca));
      const _0xfd23b7 = await pollRunningHubTask(_0x26f7ca, _0xf091a9, _0x180b1b, {
        ..._0x243f83,
        useOpenapiQuery: _0x56408c,
      });
      return processTaskResult(_0xfd23b7, _0x180b1b, { ..._0x243f83, taskKey: _0x37ab4a });
    }
  }
  let _0x4a630c =
      _0x180b1b === 'apimart'
        ? resolveApimartTaskIdStrict(_0x21eb24)
        : resolveAsyncImageTaskId(_0x21eb24, _0x43916f),
    _0x32a839 = resolveAsyncImageTaskStatus(_0x21eb24);
  !_0x4a630c && _0x180b1b !== 'apimart' && (_0x4a630c = resolveAsyncImageTaskIdLoose(_0x21eb24));
  !_0x4a630c &&
    (_0x4a630c =
      _0x180b1b === 'apimart'
        ? extractApimartTaskIdFromRawText(_0x44efd6)
        : extractTaskIdFromRawText(_0x44efd6));
  if (_0x4a630c && _0x180b1b === 'apimart') {
    const _0x5510a8 = await probeApimartTaskIdCandidate(_0x4a630c, _0xf091a9, _0x243f83);
    if (!_0x5510a8) _0x4a630c = '';
  }
  !_0x4a630c &&
    _0x180b1b === 'apimart' &&
    (_0x4a630c = await resolveApimartTaskIdByProbe(_0x21eb24, _0xf091a9, _0x243f83));
  !_0x4a630c && _0x180b1b !== 'apimart' && (_0x4a630c = extractTaskIdFromResponseHeaders(_0x3ece95));
  !_0x32a839 && (_0x32a839 = extractTaskStatusFromRawText(_0x44efd6));
  const _0x873325 = extractImageUrls(_0x21eb24, _0x43916f).length > 0;
  if (
    _0x873325 &&
    (_0x180b1b === 'grsai' || _0x180b1b === 'volcengine') &&
    !isAsyncTaskFailureStatus(_0x32a839)
  )
    return processTaskResult(_0x21eb24, _0x180b1b, _0x243f83);
  if (!_0x873325 && _0x180b1b === 'grsai') {
    const _0xad7a27 = resolveDirectOutputSnapshotFromRawText(_0x44efd6);
    if (_0xad7a27) return processTaskResult(_0xad7a27, _0x180b1b, _0x243f83);
  }
  _0x4a630c && !supportsAsyncImageTaskPolling(_0x180b1b, _0x243f83) && (_0x4a630c = '');
  if (!_0x3b3847 && _0x4a630c && !isAsyncTaskFailureStatus(_0x32a839)) {
    (_0x369bda?.onTaskMeta?.({ taskId: _0x4a630c, provider: _0x180b1b, kind: 'image' }),
      _0x369bda?.onTaskId?.(_0x4a630c));
    if (
      _0x873325 &&
      ['success', 'succeeded', 'completed', 'complete', 'done'].includes(
        String(_0x32a839 || '').toLowerCase(),
      )
    )
      return processTaskResult(_0x21eb24, _0x180b1b, _0x243f83);
    const _0x11fc1c = await pollAsyncImageTask(_0x4a630c, _0xf091a9, _0x180b1b, _0x243f83);
    return processTaskResult(_0x11fc1c, _0x180b1b, _0x243f83);
  }
  if (
    !_0x3b3847 &&
    (_0x180b1b === 'ppio' || _0x180b1b === 'grsai') &&
    (!_0x4a630c || isAsyncTaskPendingStatus(_0x32a839))
  ) {
    const _0x5e10c6 = String(_0x44efd6 || '').slice(0, 0x190);
    let _0x40c02d = {};
    if (_0x3ece95 && typeof _0x3ece95.forEach === 'function') {
      const _0x245cf3 = {};
      (_0x3ece95.forEach((_0x5751ba, _0xaa35f3) => {
        const _0x4366b3 = String(_0xaa35f3 || '').toLowerCase();
        (_0x4366b3.includes('task') ||
          _0x4366b3.includes('job') ||
          _0x4366b3.includes('request') ||
          _0x4366b3.includes('submit')) &&
          (_0x245cf3[_0xaa35f3] = String(_0x5751ba || ''));
      }),
        (_0x40c02d = _0x245cf3));
    }
    console.warn('[aiImageApi] async submit missing taskId', {
      providerId: _0x180b1b,
      asyncTaskStatus: _0x32a839,
      previewText: _0x5e10c6,
      headerSnapshot: _0x40c02d,
      parsedKeys:
        _0x21eb24 && typeof _0x21eb24 === 'object' && !Array.isArray(_0x21eb24)
          ? Object.keys(_0x21eb24).slice(0, 20)
          : [],
    });
  }
  if (_0x2d8e86 && !_0x3b3847) throw _0x2d8e86;
  const _0x41709f = String(_0x21eb24.status || _0x21eb24?.data?.status || '').toUpperCase(),
    _0xa99493 = resolveRunningHubTaskId(_0x21eb24, _0x44efd6, _0x3ece95);
  if (
    _0x3b3847 &&
    _0xa99493 &&
    (!_0x41709f || ['RUNNING', 'PENDING', 'QUEUED', 'SUBMITTED'].includes(_0x41709f))
  ) {
    const _0x50c13c = _0xa99493,
      _0xaacd9c = _0x180b1b + ':image:' + _0x50c13c;
    (_0x369bda?.onTaskMeta?.({ taskId: _0x50c13c, useOpenapiQuery: _0x56408c }),
      _0x369bda?.onTaskId?.(_0x50c13c));
    const _0x59dc05 = await pollRunningHubTask(_0x50c13c, _0xf091a9, _0x180b1b, {
      ..._0x243f83,
      useOpenapiQuery: _0x56408c,
    });
    return processTaskResult(_0x59dc05, _0x180b1b, { ..._0x243f83, taskKey: _0xaacd9c });
  }
  return processTaskResult(_0x21eb24, _0x180b1b, _0x243f83);
}
export async function resumeDreaminaImageTask(_0x3208df, _0x1826dd = {}, _0x343d6c = {}) {
  const _0x412682 = getProviderId(_0x1826dd || {});
  if (_0x412682 !== 'dreamina') throw new Error('仅支持恢复 Dreamina 图片任务');
  const _0x2a53ff = String(_0x3208df || '').trim();
  if (!_0x2a53ff) throw new Error('缺少 Dreamina 提交ID，无法恢复');
  const _0x35df41 = await pollDreaminaUntilDone(_0x2a53ff, { ..._0x343d6c, taskKind: 'image' }),
    _0x45beb5 = normalizeDreaminaTaskSnapshot(_0x35df41, { submitId: _0x2a53ff });
  if (_0x45beb5?.phase === 'failed') throw new Error(_0x45beb5.failReason || '即梦图片任务恢复失败');
  const _0x234b7a = Array.isArray(_0x45beb5?.outputs) ? _0x45beb5.outputs : [];
  if (_0x234b7a.length === 0) throw new Error('即梦图片任务恢复失败：无可用输出');
  const _0x216db0 = _0x234b7a.map((_0x3ff5be) => {
    const _0x31edba = _0x3ff5be.localUrl || _0x3ff5be.url;
    return {
      sourceId: null,
      thumbId: null,
      sourceUrl: _0x3ff5be.url || _0x31edba,
      thumbUrl: _0x31edba,
      imageUrl: _0x31edba,
      localPath: _0x3ff5be.localPath || '',
    };
  });
  return _0x216db0.length === 1 ? _0x216db0[0] : { isBatch: true, images: _0x216db0 };
}
export async function resumeAsyncImageTask(_0x344089, _0xc9fbf2 = {}, _0x18d686 = {}) {
  await ensureConfig();
  const _0x1c31c6 = getProviderId(_0xc9fbf2 || {});
  if (_0x1c31c6 === 'runninghubwf' || _0x1c31c6 === 'runninghub' || _0x1c31c6 === 'dreamina')
    throw new Error('仅支持恢复 APIMart/PPIO/GRSAI 等异步图片任务');
  const _0x2e1749 = String(_0x344089 || '').trim();
  if (!_0x2e1749) throw new Error('缺少异步图片任务ID，无法恢复');
  return runTaskSingleFlight({ provider: _0x1c31c6, kind: 'image', taskId: _0x2e1749 }, async () => {
    const _0x5c3015 = resolveImageTaskRuntimeOptions(_0xc9fbf2 || {}, _0x1c31c6, _0x18d686),
      _0x35553f = await pollAsyncImageTask(_0x2e1749, _0xc9fbf2 || {}, _0x1c31c6, _0x5c3015),
      _0xd388a9 = await processTaskResult(_0x35553f, _0x1c31c6, {
        taskKey: _0x1c31c6 + ':image:' + _0x2e1749,
        ...(_0x5c3015?.responseMapping ? { responseMapping: _0x5c3015.responseMapping } : {}),
      });
    if (_0xd388a9.length === 1 && _0xd388a9[0]?.error)
      throw new Error(_0xd388a9[0].error || '图片任务恢复失败');
    return _0xd388a9.length === 1 ? _0xd388a9[0] : { isBatch: true, images: _0xd388a9 };
  });
}
export async function resumeRunningHubImageTask(_0x5c431f, _0x4a266e, _0x4c6ee5 = {}) {
  const _0x598f9a = getProviderId(_0x4a266e || {});
  if (_0x598f9a !== 'runninghubwf' && _0x598f9a !== 'runninghub')
    throw new Error('仅支持恢复 RunningHub 图片任务');
  const _0xd17812 = String(_0x5c431f || '').trim();
  if (!_0xd17812) throw new Error('缺少 RunningHub 任务ID，无法恢复');
  const _0x257a3f =
    _0x4c6ee5?.useOpenapiQuery === true ||
    isModelApiModel(_0x4a266e?.model, _0x598f9a) ||
    isRunningHubOpenApiV2AiApp(_0x4a266e);
  return runTaskSingleFlight({ provider: _0x598f9a, kind: 'image', taskId: _0xd17812 }, async () => {
    const _0x494fc7 = await pollRunningHubTask(_0xd17812, _0x4a266e || {}, _0x598f9a, {
      ..._0x4c6ee5,
      useOpenapiQuery: _0x257a3f,
    });
    if (_0x494fc7?.pending) return _0x494fc7;
    const _0x3cf615 = await processTaskResult(_0x494fc7, _0x598f9a, {
      taskKey: _0x598f9a + ':image:' + _0xd17812,
    });
    if (_0x3cf615.length === 1 && _0x3cf615[0]?.error)
      throw new Error(_0x3cf615[0].error || '图片任务恢复失败');
    return _0x3cf615.length === 1 ? _0x3cf615[0] : { isBatch: true, images: _0x3cf615 };
  });
}
async function processTaskResult(_0x245695, _0x3beffc, _0x40463f = {}) {
  const _0x40bed4 = extractImageResultRecords(_0x245695, _0x40463f?.responseMapping),
    _0x4a0267 = _0x40bed4.some((_0x4df2e3) => String(_0x4df2e3?.sourceUrl || '').trim()),
    _0x22b620 = _0x40bed4.some((_0x157d82) => String(_0x157d82?.error || '').trim());
  if (!_0x4a0267) {
    if (_0x22b620) return await processImageResultRecords(_0x40bed4, _0x40463f);
    const _0x2f3168 = parseError(_0x3beffc, _0x245695, 200);
    if (_0x2f3168) return [{ error: _0x2f3168.getUserMessage(), fullData: _0x245695 }];
    const _0x6f741a = parseTaskError(_0x3beffc, _0x245695);
    if (_0x6f741a) return [{ error: _0x6f741a.getUserMessage(), fullData: _0x245695 }];
    const _0x365031 =
      _0x245695.error || _0x245695.errorMessage || _0x245695.message || _0x245695.failure_reason;
    if (_0x365031) return [{ error: _0x365031, fullData: _0x245695 }];
    throw new ApiError({
      type: 'PARSE_ERROR',
      provider: _0x3beffc,
      message: '无法从服务器响应中提取图片地址',
      raw: _0x245695,
      retryable: false,
    });
  }
  return await processImageResultRecords(_0x40bed4, _0x40463f);
}
async function processImages(_0x4068e6, _0x573855 = {}) {
  return await processImageResultRecords(
    (Array.isArray(_0x4068e6) ? _0x4068e6 : []).map((_0x2599ff) => ({ sourceUrl: _0x2599ff, error: '' })),
    _0x573855,
  );
}
async function processImageResultRecords(_0x4a8ca7, _0x567406 = {}) {
  const _0x3c21fa = [],
    _0x3ae1aa = window.currentProjectId || 'default_v2_project';
  for (const _0x4c7e62 of Array.isArray(_0x4a8ca7) ? _0x4a8ca7 : []) {
    const _0x252451 = String(_0x4c7e62?.sourceUrl || '').trim(),
      _0x4051ab = String(_0x4c7e62?.error || '').trim();
    if (!_0x252451) {
      _0x4051ab &&
        _0x3c21fa.push({
          sourceUrl: '',
          thumbUrl: '',
          imageUrl: '',
          localPath: '',
          error: _0x4051ab,
          ...(_0x4c7e62?.fullData !== undefined ? { fullData: _0x4c7e62.fullData } : {}),
        });
      continue;
    }
    try {
      const { saveRemoteImageLocallyDetailed: _0x5e2dfd } = await import('../src/modules/project.js'),
        _0x2b38a7 = await _0x5e2dfd(_0x252451, _0x3ae1aa, {
          taskKey: _0x567406?.taskKey,
          dedupeKey: _0x567406?.taskKey ? _0x567406.taskKey + ':' + _0x252451 : undefined,
        }),
        _0x2bbb5a = pickResultLocalPath(_0x2b38a7),
        _0x2ab027 = String(_0x2b38a7?.localUrl || '').trim() || localPathToUrl(_0x2bbb5a);
      _0x3c21fa.push({
        sourceId: null,
        thumbId: null,
        sourceUrl: _0x252451,
        thumbUrl:
          String(_0x2b38a7?.thumbUrl || '').trim() || String(_0x2b38a7?.displayUrl || '').trim() || _0x2ab027,
        imageUrl: String(_0x2b38a7?.displayUrl || '').trim() || _0x2ab027,
        localPath: _0x2bbb5a,
        originalLocalPath: normalizeLocalPath(_0x2b38a7?.originalLocalPath || _0x2b38a7?.localPath),
        displayLocalPath: normalizeLocalPath(_0x2b38a7?.displayLocalPath),
        thumbLocalPath: normalizeLocalPath(_0x2b38a7?.thumbLocalPath),
        originalWidth: Number(_0x2b38a7?.originalWidth || 0) || undefined,
        originalHeight: Number(_0x2b38a7?.originalHeight || 0) || undefined,
      });
    } catch (_0x461b41) {
      _0x3c21fa.push({
        sourceUrl: _0x252451,
        thumbUrl: '',
        imageUrl: '',
        localPath: '',
        error: '保存到本地失败，请重试生成',
      });
    }
  }
  return _0x3c21fa;
}
export async function generateImage(_0x14526f, _0x42ef9b) {
  const _0x43f9f6 = getProviderId(_0x14526f),
    _0x1601f5 = getImageExecution(_0x14526f, _0x43f9f6)?.executionManifest,
    _0x21d9f2 = resolveImageGenerationBatchSize(_0x14526f, _0x43f9f6),
    _0x37f3d0 = shouldSubmitProviderBatchOnce(_0x14526f, _0x43f9f6, _0x21d9f2);
  if (_0x1601f5?.adapterType === 'localRuntime' && _0x1601f5?.runtime === 'dreaminaImage') {
    if (_0x21d9f2 <= 1) {
      const _0x49c469 = await runDreaminaImageGeneration(_0x14526f, _0x42ef9b);
      return _0x49c469.length === 1 ? _0x49c469[0] : { isBatch: true, images: _0x49c469 };
    }
    const _0x6691b7 = [];
    for (let _0x5de78c = 0; _0x5de78c < _0x21d9f2; _0x5de78c++) {
      try {
        const _0x188994 = await runDreaminaImageGeneration(_0x14526f, _0x42ef9b);
        _0x6691b7.push(..._0x188994);
      } catch (_0x91cd0b) {
        _0x6691b7.push({
          error: _0x91cd0b?.message || '即梦图片生成失败',
          status: 'failed',
          retryable: false,
        });
      }
    }
    if (_0x6691b7.length === 1) return _0x6691b7[0];
    return { isBatch: true, images: _0x6691b7 };
  }
  if (_0x21d9f2 <= 1 || _0x37f3d0)
    try {
      const _0x36f8e3 = await doGenerateOnce(_0x14526f, _0x43f9f6, _0x42ef9b),
        _0x40b6f8 = Array.isArray(_0x36f8e3) ? _0x36f8e3 : [_0x36f8e3];
      if (_0x40b6f8.length === 1 && _0x40b6f8[0].error) throw new Error(_0x40b6f8[0].error);
      return _0x40b6f8.length === 1 ? _0x40b6f8[0] : { isBatch: true, images: _0x40b6f8 };
    } catch (_0x20612c) {
      if (_0x20612c instanceof ApiError) throw new Error(_0x20612c.getUserMessage());
      throw _0x20612c;
    }
  const _0x32d3af = [];
  for (let _0x3e0f0b = 0; _0x3e0f0b < _0x21d9f2; _0x3e0f0b++) {
    try {
      const _0x391d99 = await doGenerateOnce(_0x14526f, _0x43f9f6, _0x42ef9b);
      _0x32d3af.push(..._0x391d99);
    } catch (_0x12dcf8) {
      _0x12dcf8 instanceof ApiError
        ? _0x32d3af.push({
            error: _0x12dcf8.getUserMessage(),
            status: 'failed',
            retryable: _0x12dcf8.retryable,
          })
        : _0x32d3af.push({ error: _0x12dcf8.message || '未知错误', status: 'failed', retryable: false });
    }
  }
  if (_0x32d3af.length === 0) throw new Error('批量生成全部失败');
  if (_0x32d3af.length === 1) return _0x32d3af[0];
  return { isBatch: true, images: _0x32d3af };
}
