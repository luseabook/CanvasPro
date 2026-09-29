import { buildVideoRequest } from './RunningHubAdapter.js';
import { processInputImages } from '../imageUploadApi.js';
export async function buildRunningHubImportedAudioRequest(_0x423720, _0x2b9bc6, _0x2aa2ac, _0x5b263d) {
  const _0x3874c6 = { ..._0x423720, model: _0x2aa2ac['modelManifest']['modelId'] };
  for (const _0x28de18 of [_0x423720['audioRefs'], _0x423720['videoRefs'], _0x423720['imageRefs']]) {
    for (const _0x4c53d1 of Array['isArray'](_0x28de18) ? _0x28de18 : []) {
      if (_0x4c53d1?.['refSlot'] && _0x4c53d1?.['url']) _0x3874c6[_0x4c53d1['refSlot']] = _0x4c53d1['url'];
    }
  }
  const _0x51b87d = await buildVideoRequest(_0x3874c6, _0x2b9bc6, {
    ..._0x5b263d,
    processInputImages: processInputImages,
  });
  return {
    ..._0x51b87d,
    headers: {
      ..._0x51b87d['headers'],
      ...(_0x423720['installId'] ? { 'X-AIC-Install-Id': _0x423720['installId'] } : {}),
    },
    meta: {
      provider: 'runninghubwf',
      adapterType: 'workflow',
      queryMode: _0x2aa2ac['executionManifest']['queryMode'],
      providerProfileId: _0x51b87d['providerProfileId'],
      rhProviderProfileId: _0x51b87d['providerProfileId'],
      apiUrl: _0x51b87d['runningHubApiUrl'],
      audioWorkflowKey: _0x2aa2ac['modelManifest']['modelId'],
      model: _0x2aa2ac['modelManifest']['modelId'],
      executionId: _0x2aa2ac['executionManifest']['id'],
      nodeId: _0x423720['nodeId'] || '',
      installId: _0x423720['installId'] || '',
      prompt: _0x2b9bc6,
    },
  };
}
