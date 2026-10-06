import {
  buildManifestMappedBody,
  resolveManifestApiUrl,
  resolveExecutionModelToken,
} from './ModelApiManifestNormalizer.js';
export async function buildRunningHubPriceRequest(apiUrl) {
  const { modelManifest: modelManifest, executionManifest: executionManifest } = apiUrl.resolved,
    list = apiUrl.kind === 'image' ? [] : apiUrl.references || [],
    inputVideos = (value) =>
      list.filter((item) => item.type === value)
        .map((response) => response.url)
        .filter(Boolean),
    inputImages = inputVideos('image'),
    payload = apiUrl.params,
    key = {
      provider: 'runninghub',
      modelManifest: modelManifest,
      executionManifest: executionManifest,
      payload: payload,
      rawPayload: payload,
      finalPrompt: payload.prompt,
      modelToken: resolveExecutionModelToken(executionManifest, payload),
      inputImages: inputImages,
      finalUrls: inputImages,
      inputVideos: inputVideos('video'),
      inputAudios: inputVideos('audio'),
      finalUrlsBySlot: Object.fromEntries(
        list.filter((index) => index.type === 'image' && index.refSlot).map((response2) => [
          response2.refSlot,
          response2.url,
        ]),
      ),
    },
    manifestMappedBody = await buildManifestMappedBody(key),
    apiUrl2 = resolveManifestApiUrl('runninghub', { apiUrl: apiUrl.baseUrl }, executionManifest, key),
    map = new Set(list.map((response3) => response3.url)),
    handler = (list2) => {
      if (typeof list2 === 'string' && map.has(list2)) return undefined;
      if (Array.isArray(list2)) return list2.map(handler).filter((result) => result !== undefined);
      if (list2 && typeof list2 === 'object')
        return Object.fromEntries(
          Object.entries(list2)
            .map(([data, options]) => [data, handler(options)])
            .filter(([, target]) => target !== undefined),
        );
      return list2;
    };
  return { body: { apiUrl: apiUrl2, ...handler(manifestMappedBody) } };
}
