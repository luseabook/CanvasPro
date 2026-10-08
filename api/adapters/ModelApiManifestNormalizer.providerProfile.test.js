import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImageRequestFromManifest,
  resolveProviderProfileConfig,
} from './ModelApiManifestNormalizer.js';

// Agnes 国内 / 国际是两条互不相通的线路：域名不同、Key 不通用。
// 清单里写死的 provider 只是「主线路」，真正走哪条必须由选中线路决定，
// 否则设置面板里切线路对生成毫无影响（国内档填的 Key 永远用不上）。

const AGNES_IMAGE = 'agnes/agnes-image-2.5-flash';
const DOMESTIC_URL = 'https://api.agnes-ai.cn';
const INTL_URL = 'https://apihub.agnes-ai.com';

const URLS = { agnes: INTL_URL, 'agnes-domestic': DOMESTIC_URL };

function createCtx(keys) {
  return {
    getProviderConfig(providerId) {
      return {
        apiUrl: URLS[providerId] || 'https://example.invalid/v1',
        apiKey: keys[providerId] || '',
      };
    },
  };
}

test('resolveProviderProfileConfig：只有国际线有 Key 时走国际线', () => {
  const config = resolveProviderProfileConfig(
    'agnes',
    { model: AGNES_IMAGE },
    createCtx({ agnes: 'k_intl' }),
  );
  assert.equal(config.apiUrl, INTL_URL);
  assert.equal(config.apiKey, 'k_intl');
});

test('resolveProviderProfileConfig：只有国内线有 Key 时让位给国内线', () => {
  const config = resolveProviderProfileConfig(
    'agnes',
    { model: AGNES_IMAGE },
    createCtx({ 'agnes-domestic': 'k_cn' }),
  );
  assert.equal(config.apiUrl, DOMESTIC_URL);
  assert.equal(config.apiKey, 'k_cn');
});

test('resolveProviderProfileConfig：请求里选中的线路优先（两线都配了 Key）', () => {
  const ctx = createCtx({ agnes: 'k_intl', 'agnes-domestic': 'k_cn' });
  assert.equal(
    resolveProviderProfileConfig('agnes', { model: AGNES_IMAGE }, ctx).apiUrl,
    DOMESTIC_URL,
  );
  assert.equal(
    resolveProviderProfileConfig(
      'agnes',
      { model: AGNES_IMAGE, providerProfileId: 'agnes' },
      ctx,
    ).apiUrl,
    INTL_URL,
  );
});

test('resolveProviderProfileConfig：没声明线路的模型行为不变', () => {
  const ctx = createCtx({});
  const config = resolveProviderProfileConfig('runninghub', { model: 'runninghub-model/x' }, ctx);
  assert.equal(config.apiUrl, 'https://example.invalid/v1');
});

test('buildImageRequestFromManifest：出图请求带上选中线路的域名与 Key', async () => {
  const ctx = createCtx({ 'agnes-domestic': 'k_cn' });
  const request = await buildImageRequestFromManifest(
    { model: AGNES_IMAGE, prompt: 'a red cube' },
    'a red cube',
    ctx,
  );
  assert.equal(request.url, '/api/v2/proxy/image');
  assert.equal(request.body.apiUrl, DOMESTIC_URL + '/v1/images/generations');
  assert.equal(request.body.apiKey, 'k_cn');
  assert.equal(request.body.model, 'agnes-image-2.5-flash');
});

test('buildImageRequestFromManifest：显式选中国际线时改用国际域名', async () => {
  const ctx = createCtx({ agnes: 'k_intl', 'agnes-domestic': 'k_cn' });
  const request = await buildImageRequestFromManifest(
    { model: AGNES_IMAGE, prompt: 'a red cube', providerProfileId: 'agnes' },
    'a red cube',
    ctx,
  );
  assert.equal(request.body.apiUrl, INTL_URL + '/v1/images/generations');
  assert.equal(request.body.apiKey, 'k_intl');
});
