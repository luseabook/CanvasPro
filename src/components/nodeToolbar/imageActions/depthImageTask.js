import { generateImage } from '../../../../api/aiImageApi.js';
import { resolveCanvasImageSourceUrl } from '../../../services/canvasMediaLocalService.js';
import { getImageGenerationResultError } from '../../aigenImage/imageGenerationResultRenderer.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../../manifests/index.js';
import { RH_IMAGE_DEPTH_MODEL_ID } from '../../../manifests/image/runninghub/runningHubImageDepthManifest.js';
import { showProviderApiKeyMissingToast } from '../../../modules/providerApiKeyMissingToast.js';
import { t } from '../../../i18n/index.js';
export const IMAGE_DEPTH_TASK_TYPE = 'image-depth';
export const imageDepthText = (_0x3fdd62) => t('nodeToolbar.imageDepth.' + _0x3fdd62);
export async function submitImageDepthTask(_0x9aa6a4, _0x4cbb2a, _0xb89df8, _0x55c375) {
  const {
      store: _0x31472c,
      ensureConfig: _0x17101c,
      getProviderConfig: _0xb0277a,
      submitTask: _0x53bd5b,
      generateId: _0x1ef408,
      calcSafeSpawnPosNearNode: _0x36bcdd,
      calcDisplaySizeByMedia: _0x2194aa,
      buildSourceMediaNodePayload: _0x2d3381,
      buildImageGenerationResultPatch: _0x40ffd7,
      buildImageGenerationFailurePatch: _0x30a1a4,
      cancelRunningHubRemoteTaskQuietly: _0x324b84,
      notifyImageToolbarTaskChange: _0x1b92ed,
      generateImage: _0x476bfd = generateImage,
    } = _0x9aa6a4,
    _0x45a03c = resolveCanvasImageSourceUrl(
      _0xb89df8['images']?.[_0xb89df8['mainImageIndex'] || 0x0] || _0xb89df8,
    );
  if (!_0x45a03c) throw new Error(imageDepthText('missingImage'));
  const _0x423059 = resolveModelExecution(RH_IMAGE_DEPTH_MODEL_ID);
  if (!_0x423059) throw new Error(imageDepthText('missingWorkflow'));
  const { modelManifest: _0x11bcac, executionManifest: _0x162d5a } = _0x423059,
    _0x2e10e4 = sanitizeModelUiSchemaParams(_0x11bcac['modelId'], _0x4cbb2a['generationParams']);
  await _0x17101c();
  if (!_0x55c375()) return null;
  const _0x4d9b3b = _0xb0277a(_0x4cbb2a['providerProfileId'] || _0x11bcac['provider']) || {},
    _0x369afe = _0x4cbb2a['providerProfileId'] || _0x4d9b3b['providerProfileId'];
  if (!String(_0x4d9b3b['apiKey'] || '')['trim']())
    return (
      showProviderApiKeyMissingToast(imageDepthText('missingKey'), {
        providerId: _0x369afe || _0x11bcac['provider'],
      }),
      null
    );
  const _0x23569f = _0x2194aa(_0xb89df8['width'] || 0x12c, _0xb89df8['height'] || 0x12c),
    _0x1c5a38 = _0x36bcdd(
      (_0x31472c['getStateRaw']?.() || _0x31472c['getState']())['nodes'],
      _0xb89df8,
      _0x23569f['width'],
      _0x23569f['height'],
    ),
    _0x21e7e7 = _0x1ef408('source-image-depth');
  return _0x53bd5b(
    {
      sourceNodeId: _0xb89df8['id'],
      trigger: 'toolbar',
      taskType: IMAGE_DEPTH_TASK_TYPE,
      provider: _0x11bcac['provider'],
      adapterType: _0x11bcac['adapterType'],
      modelId: _0x11bcac['modelId'],
      executionId: _0x162d5a['id'],
      payload: {
        model: _0x11bcac['modelId'],
        provider: _0x11bcac['provider'],
        providerProfileId: _0x369afe,
        apiKey: _0x4d9b3b['apiKey'],
        runningHubApiUrl: _0x4d9b3b['apiUrl'],
        inputUrls: [_0x45a03c],
        prompt: '',
        generationParams: _0x2e10e4,
        ..._0x2e10e4,
      },
      cancellable: !![],
      resumable: !![],
      pauseOnAbort: 'afterTaskId',
      onTaskChange: _0x1b92ed,
      createTargetNode: ({ startPatch: _0x479441, protocolPatch: _0xba3b80 }) =>
        _0x2d3381({
          id: _0x21e7e7,
          type: 'source-image',
          ..._0x1c5a38,
          ..._0x23569f,
          name: imageDepthText('processing'),
          src: '',
          localPath: '',
          provider: _0x11bcac['provider'],
          model: _0x11bcac['modelId'],
          rhTaskUseOpenapiQuery: !![],
          ..._0x479441,
          ..._0xba3b80,
        }),
      submit: async (_0x2e1605, _0x102ba9) => {
        if (_0x55c375()) _0x31472c['setSelectedNodes']([_0x102ba9['targetNodeId']]);
        const _0x35ae71 = await _0x476bfd(_0x2e1605, {
            signal: _0x102ba9['signal'],
            runningHubWorkflowQueueLease: _0x102ba9['runningHubWorkflowQueueLease'],
            onRunningHubWorkflowQueueChange: _0x102ba9['onRunningHubWorkflowQueueChange'],
            onTaskMeta: ({ taskId: _0x549aa3 }) => _0x102ba9['onTaskId']?.(_0x549aa3),
          }),
          _0x134ccd = getImageGenerationResultError(_0x35ae71);
        if (_0x134ccd) throw new Error(_0x134ccd);
        return _0x35ae71;
      },
      cancel: ({ taskId: _0x44cf8b }) =>
        _0x324b84({
          taskId: _0x44cf8b,
          apiKey: _0x4d9b3b['apiKey'],
          providerProfileId: _0x369afe,
          label: 'ImageDepth',
        }),
      resultBuilder: (_0x100bdf, _0x3b8316) => ({
        ..._0x40ffd7(_0x100bdf, { startedAt: _0x3b8316['startedAt'] }),
        name: imageDepthText('result'),
        needsAutoResize: !![],
      }),
      failureBuilder: (_0x5b53a8, _0xb6736c) => ({
        ..._0x30a1a4({ error: _0x5b53a8['message'] || String(_0x5b53a8), startedAt: _0xb6736c['startedAt'] }),
        name: imageDepthText('failed'),
      }),
      cancelledBuilder: () => ({ name: imageDepthText('cancelled') }),
    },
    { store: _0x31472c, isTargetCurrent: _0x55c375 },
  );
}
