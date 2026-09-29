import test from 'node:test';
import assert from 'node:assert/strict';

import {
  apimartGptImage2Image,
  apimartGrokImagineImage,
  apimartGrokImagineImageEndpoint,
  apimartMidjourneyImage,
  customProviderGeminiImage,
  customProviderGeminiImageEndpoint,
  grsaiGptImage2Image,
  grsaiImage,
  normalizeApimartGptImage2Resolution,
  normalizeApimartNanoBanana2Resolution,
  ppioImageSize,
  runninghubImage,
  runninghubImageEndpoint,
} from './imageResolvers.js';

test('imageResolvers: normalizes APIMart and GPT image resolutions', () => {
  assert.equal(normalizeApimartGptImage2Resolution('4k'), '4k');
  assert.equal(normalizeApimartGptImage2Resolution('invalid'), '2k');
  assert.equal(normalizeApimartNanoBanana2Resolution('4k'), '4K');
  assert.equal(normalizeApimartNanoBanana2Resolution('invalid'), '2K');
  assert.deepEqual(
    apimartGptImage2Image({
      currentBody: { model: 'gpt-image-2' },
      payload: { imageSize: '1K' },
    }),
    { model: 'gpt-image-2', resolution: '1k' },
  );
});

test('imageResolvers: selects APIMart Grok edit versus generation mode', () => {
  assert.deepEqual(
    apimartGrokImagineImage({
      currentBody: { model: 'old', image_urls: ['old'], image_url: 'old' },
      finalUrls: [' https://cdn.test/ref.png ', 'ignored'],
    }),
    {
      model: 'grok-imagine-1.5-edit-apimart',
      image_url: 'https://cdn.test/ref.png',
    },
  );
  assert.deepEqual(
    apimartGrokImagineImage({
      currentBody: { model: 'old', image_urls: ['old'], image_url: 'old' },
      finalUrls: [],
    }),
    { model: 'grok-imagine-1.5-apimart' },
  );
  assert.equal(
    apimartGrokImagineImageEndpoint({
      cfg: { apiUrl: 'https://api.test/' },
      executionManifest: { endpoint: '/v1/images/generations' },
      finalUrls: ['ref.png'],
    }),
    'https://api.test/v1/images/edits',
  );
  assert.equal(
    apimartGrokImagineImageEndpoint({
      cfg: { apiUrl: 'https://api.test/' },
      executionManifest: { endpoint: '/custom/generate' },
      finalUrls: [],
    }),
    'https://api.test/custom/generate',
  );
});

test('imageResolvers: builds custom-provider Gemini image requests and endpoints', async () => {
  const body = await customProviderGeminiImage({
    currentBody: {
      model: 'ignored',
      generationConfig: { temperature: 0.2 },
    },
    finalPrompt: 'draw a cat',
    finalUrls: ['https://cdn.test/photo.jpg', 'https://cdn.test/photo', ''],
  });

  assert.deepEqual(body, {
    generationConfig: { temperature: 0.2, responseModalities: ['IMAGE'] },
    contents: [
      {
        role: 'user',
        parts: [
          { text: 'draw a cat' },
          {
            file_data: {
              mime_type: 'image/jpeg',
              file_uri: 'https://cdn.test/photo.jpg',
            },
          },
          {
            file_data: {
              mime_type: 'image/png',
              file_uri: 'https://cdn.test/photo',
            },
          },
        ],
      },
    ],
  });

  assert.equal(
    customProviderGeminiImageEndpoint({
      cfg: { apiUrl: 'https://gateway.test/v1' },
      executionManifest: { endpoint: '/v1beta/models/{model}:generateContent' },
      modelToken: 'gemini/image 2',
    }),
    'https://gateway.test/v1beta/models/gemini%2Fimage%202:generateContent',
  );
  assert.throws(
    () =>
      customProviderGeminiImageEndpoint({
        cfg: { apiUrl: 'https://gateway.test' },
        executionManifest: { endpoint: '/wrong' },
        modelToken: 'model',
      }),
    /Invalid custom provider Gemini image endpoint template/,
  );
});

test('imageResolvers: builds APIMart Midjourney references and optional flags', () => {
  const body = apimartMidjourneyImage({
    currentBody: {
      model: 'ignored',
      prompt: 'old',
      speed: 'TURBO',
      quality: '2',
      seed: '12.9',
      negative_prompt: ' blurry ',
      stylize: '100',
      chaos: '5',
      tile: 'yes',
      draft: 'true',
      hd: '1',
      extra: ' --raw ',
    },
    payload: { midjourneyModel: 'niji-7' },
    finalPrompt: 'draw',
    finalUrls: ['https://cdn.test/ignored.png'],
    finalUrlsBySlot: {
      imageUrl: 'https://cdn.test/ref.png',
      cref: 'https://cdn.test/cref.png',
      sref: 'https://cdn.test/sref.png',
    },
  });

  assert.deepEqual(body, {
    prompt: 'draw',
    version: '7',
    niji: true,
    speed: 'turbo',
    quality: '2',
    image_urls: ['https://cdn.test/ref.png'],
    cref: 'https://cdn.test/cref.png',
    sref: 'https://cdn.test/sref.png',
    seed: 12,
    negative_prompt: 'blurry',
    stylize: 100,
    chaos: 5,
    tile: true,
    draft: true,
    extra: '--raw',
  });
});

test('imageResolvers: computes PPIO dimensions and applies provider extensions', () => {
  assert.deepEqual(
    ppioImageSize({
      currentBody: { model: 'model-1' },
      payload: { model: 'ppio/model-1', imageSize: '1K', aspectRatio: '16:9' },
      modelToken: 'model-1',
      finalUrls: [],
      executionManifest: {
        extensions: {
          ppioImage: {
            optimizePromptOptions: { enabled: true },
            batchSizeField: 'n',
          },
        },
      },
    }),
    {
      model: 'model-1',
      size: '2560x1472',
      optimize_prompt_options: { enabled: true },
    },
  );
  assert.equal(
    ppioImageSize({
      currentBody: {},
      payload: {
        model: 'ppio/model-1',
        suppressImageSize: true,
        batchSize: 3,
      },
      finalUrls: ['https://cdn.test/a.png'],
      executionManifest: {
        extensions: {
          ppioImage: { imageInputField: 'input_images', batchSizeField: 'batch' },
        },
      },
    }).input_images[0],
    'https://cdn.test/a.png',
  );
});

test('imageResolvers: builds GRSAI Nano Banana and GPT Image 2 payloads', () => {
  const nano = grsaiImage({
    payload: {
      model: 'ignored',
      imageSize: '4K',
      resolvedRatioLabel: '16:9',
    },
    finalPrompt: 'draw',
    modelToken: 'grsai/nano-banana-pro-vt',
    finalUrls: ['https://cdn.test/ref.png'],
  });
  assert.equal(nano.model, 'nano-banana-pro-vt');
  assert.equal(nano.imageSize, '2K');
  assert.equal(nano.aspectRatio, '16:9');
  assert.equal(nano.replyType, 'json');

  const gpt = grsaiGptImage2Image({
    payload: {
      model: 'ignored',
      generationParams: { mode: 'edit', imageSize: '2K', aspectRatio: '3:2' },
      resolvedRatioLabel: '3:2',
    },
    finalPrompt: 'edit',
    modelToken: 'grsai/gpt-image-2',
    finalUrls: ['https://cdn.test/ref.png'],
    currentBody: { replyType: 'json' },
    executionManifest: {
      extensions: {
        gptImage2: {
          allowedSizes: ['1K', '2K'],
          defaultSize: '1K',
          pixelSizesByRatio: {
            '1:1': { '1K': '1024x1024', '2K': '2048x2048' },
            '16:9': { '1K': '1536x864', '2K': '3072x1728' },
            '9:16': { '1K': '864x1536', '2K': '1728x3072' },
          },
        },
      },
    },
  });
  assert.deepEqual(gpt, {
    replyType: 'json',
    model: 'gpt-image-2',
    prompt: 'edit',
    images: ['https://cdn.test/ref.png'],
    aspectRatio: '3072x1728',
  });
});

test('imageResolvers: applies RunningHub route policies and endpoints', () => {
  const body = runninghubImage({
    payload: {
      model: 'runninghub-model/test-model',
      imageSize: '2K',
      aspectRatio: '16:9',
      suppressAspectRatio: true,
      negativePrompt: 'bad',
      seed: 7,
      customFlag: 'true',
      generationParams: { seed: 7, customFlag: 'true' },
    },
    finalPrompt: 'draw',
    modelToken: 'runninghub-model/test-model',
    finalUrls: ['https://cdn.test/ref.png'],
    finalUrlsBySlot: { firstFrame: 'https://cdn.test/slot.png' },
    executionManifest: {
      extensions: {
        runningHubImage: {
          textEndpoint: 'text-to-image',
          inputEndpoint: 'image-to-image',
          omitResolution: true,
          omitAspectRatio: true,
          constantParams: { quality: 'high' },
          defaultParams: { outputFormat: 'png' },
          bodyParamTypes: { seed: 'integer', customFlag: 'boolean' },
          inputSlotBodyFields: { firstFrame: 'firstImageUrl' },
        },
      },
    },
  });

  assert.deepEqual(body, {
    prompt: 'draw',
    quality: 'high',
    negativePrompt: 'bad',
    seed: 7,
    firstImageUrl: 'https://cdn.test/slot.png',
    outputFormat: 'png',
    customFlag: true,
  });
  assert.equal(
    runninghubImageEndpoint({
      modelToken: 'runninghub-model/test-model',
      finalUrls: [],
      payload: {},
      executionManifest: {
        extensions: { runningHubImage: { textEndpoint: 'text-to-image' } },
      },
    }),
    'https://www.runninghub.cn/openapi/v2/test-model/text-to-image',
  );
  assert.equal(
    runninghubImageEndpoint({
      modelToken: 'runninghub-model/test-model',
      finalUrls: ['https://cdn.test/ref.png'],
      payload: {},
      executionManifest: {
        extensions: { runningHubImage: { inputEndpoint: 'image-to-image' } },
      },
    }),
    'https://www.runninghub.cn/openapi/v2/test-model/image-to-image',
  );
});
