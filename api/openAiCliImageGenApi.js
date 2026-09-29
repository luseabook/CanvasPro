import { generateImageWithCliProvider } from './cliProviderApi.js';
import { applyCameraAngleToPrompt } from './cameraPromptApi.js';
import { buildCanvasLocalImageFields } from '../src/services/canvasMediaLocalService.js';
import { localPathToUrl, normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { getModelManifest, sanitizeModelUiSchemaParams } from '../src/manifests/index.js';
function resolveImageParameters(_0x789a01, _0x1eb593) {
  const _0x5066ae = getModelManifest(_0x789a01?.['model']);
  if (!_0x5066ae || _0x5066ae['executionId'] !== _0x1eb593?.['id'])
    throw new Error('OpenAI CLI 图片模型与执行配置不匹配');
  return sanitizeModelUiSchemaParams(_0x5066ae['modelId'], {
    ..._0x789a01,
    ..._0x789a01['generationParams'],
  });
}
function buildImagePrompt(_0x46beef, _0x36d0b1, _0x2f4262) {
  const _0xa13e19 = _0x2f4262?.['extensions']?.['promptFields'];
  if (!Array['isArray'](_0xa13e19)) throw new Error('OpenAI CLI 图片执行配置缺少 promptFields');
  const _0x30e397 = _0xa13e19['flatMap'](
    ({ field: _0x406362, template: _0x4f0ea4, omitValues: omitValues = [] }) => {
      const _0x55e53d = _0x36d0b1[_0x406362];
      if (_0x55e53d === undefined) throw new Error('OpenAI CLI 图片参数缺少 ' + _0x406362);
      return omitValues['includes'](_0x55e53d) ? [] : [_0x4f0ea4['replace']('{value}', String(_0x55e53d))];
    },
  );
  return [_0x46beef, ..._0x30e397]['filter'](Boolean)['join']('\x0a\x0a');
}
function resolveCliProvider(_0x916d2 = {}) {
  const _0x31368f = String(_0x916d2?.['extensions']?.['cliProvider'] || '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x31368f) throw new Error('OpenAI CLI 图片执行配置缺少 cliProvider');
  return _0x31368f;
}
function resolveReferenceInputUrls(_0x359057 = {}) {
  const _0x2f63fe = Array['isArray'](_0x359057?.['inputUrls']) ? _0x359057['inputUrls'] : [],
    _0x5d96db = Array['from'](
      new Set(_0x2f63fe['map']((_0x478b9d) => String(_0x478b9d || '')['trim']())['filter'](Boolean)),
    ),
    _0x35dd6b = getModelManifest(_0x359057['model'])?.['inputSlots']?.['maxByKind']?.['image'];
  if (_0x5d96db['length'] > _0x35dd6b)
    throw new Error(
      'OpenAI\x20CLI\x20最多支持\x20' +
        _0x35dd6b +
        ' 张参考图，当前共 ' +
        _0x5d96db['length'] +
        ' 张，请减少图片后再生成。',
    );
  return _0x5d96db;
}
export function buildOpenAiCliImageSubmitRequest(_0x349355 = {}, _0x21e4f1 = '', _0x108dc9 = {}) {
  const _0x867e20 = resolveImageParameters(_0x349355, _0x108dc9),
    _0x43f914 = resolveReferenceInputUrls(_0x349355);
  return {
    url: '/api/v2/cli-providers/generate-image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      provider: resolveCliProvider(_0x108dc9),
      prompt: buildImagePrompt(
        String(_0x21e4f1 || _0x349355?.['prompt'] || '')['trim'](),
        _0x867e20,
        _0x108dc9,
      ),
      ...(_0x43f914['length'] > 0x0 ? { inputUrls: _0x43f914 } : {}),
    },
  };
}
async function materializeEditingImage(_0x5f3619) {
  if (!_0x5f3619['startsWith']('blob:')) return _0x5f3619;
  const _0x5359c5 = await fetch(_0x5f3619);
  if (!_0x5359c5['ok']) throw new Error('OpenAI CLI 编辑参考图读取失败');
  const _0x525b12 = await _0x5359c5['blob']();
  if (_0x525b12['type'] !== 'image/png' || _0x525b12['size'] > 0x14 * 0x400 * 0x400)
    throw new Error('OpenAI CLI 临时编辑参考图仅支持不超过 20 MB 的 PNG');
  const _0x2b8eca = new Uint8Array(await _0x525b12['arrayBuffer']()),
    _0x5dadd0 = [];
  for (let _0x262c10 = 0x0; _0x262c10 < _0x2b8eca['length']; _0x262c10 += 0x8000) {
    _0x5dadd0['push'](String['fromCharCode'](..._0x2b8eca['subarray'](_0x262c10, _0x262c10 + 0x8000)));
  }
  return 'data:image/png;base64,' + btoa(_0x5dadd0['join'](''));
}
export async function runOpenAiCliImageGeneration(_0x1e9001 = {}, _0x2eca2b = {}) {
  const _0x2de318 = applyCameraAngleToPrompt(_0x1e9001?.['prompt'], _0x1e9001?.['cameraAngle'])['trim']();
  if (!_0x2de318) throw new Error('OpenAI CLI 图像生成需要提示词');
  const _0x39d391 = resolveImageParameters(_0x1e9001, _0x2eca2b),
    _0xc17f58 = buildOpenAiCliImageSubmitRequest(_0x1e9001, _0x2de318, _0x2eca2b),
    _0x45443f = { ..._0xc17f58['body'], timeoutMs: _0x1e9001?.['timeoutMs'] };
  if (_0x45443f['inputUrls'])
    _0x45443f['inputUrls'] = await Promise['all'](_0x45443f['inputUrls']['map'](materializeEditingImage));
  const _0x3a844b = _0x39d391['batchSize'],
    _0x513f41 = [];
  let _0x2bed3c;
  for (let _0x223e67 = 0x0; _0x223e67 < _0x3a844b; _0x223e67 += 0x1) {
    try {
      const _0x109256 = await generateImageWithCliProvider(_0x45443f);
      _0x513f41['push'](...normalizeImageResults(_0x109256));
    } catch (_0x8f33b5) {
      if (_0x3a844b === 0x1) throw _0x8f33b5;
      ((_0x2bed3c ??= _0x8f33b5),
        _0x513f41['push']({ error: _0x8f33b5['message'], status: 'failed', retryable: ![] }));
    }
  }
  if (_0x513f41['every']((_0xcc61b0) => _0xcc61b0['status'] === 'failed'))
    throw _0x2bed3c || new Error('OpenAI CLI 图像生成没有可用输出');
  return _0x513f41;
}
function normalizeImageResults(_0x55c701) {
  const _0x337417 = Array['isArray'](_0x55c701?.['images']) ? _0x55c701['images'] : [];
  if (!_0x337417['length']) throw new Error('OpenAI CLI 图像生成完成，但没有可用输出');
  return _0x337417['map']((_0xeda410) => {
    const _0x5f5e94 = normalizeLocalPath(
        _0xeda410?.['localPath'] || _0xeda410?.['imageUrl'] || _0xeda410?.['url'],
      ),
      _0x38c59a = localPathToUrl(_0x5f5e94);
    if (!_0x5f5e94 || !_0x38c59a) throw new Error('OpenAI\x20CLI\x20返回了不安全的本地图片路径');
    return {
      sourceId: null,
      thumbId: null,
      ...buildCanvasLocalImageFields({ ..._0xeda410, localPath: _0x5f5e94 }),
    };
  });
}
