import { RH_VIDEO_DEPTH_MODEL_ID, resolveModelExecution } from '../../../manifests/index.js';
import { t } from '../../../i18n/index.js';
import { showProviderApiKeyMissingToast } from '../../../modules/providerApiKeyMissingToast.js';
import { openVideoDepthEditor } from './videoDepthEditor.js';
function uniqueList(_0x25514e) {
  return Array['from'](
    new Set(_0x25514e['map']((_0x1ff05d) => String(_0x1ff05d || '')['trim']())['filter'](Boolean)),
  );
}
function getDepthVideoActionConfig() {
  const _0x19b4e1 = resolveModelExecution(RH_VIDEO_DEPTH_MODEL_ID),
    _0x55d02d = _0x19b4e1?.['modelManifest']?.['extensions']?.['videoToolbarAction'];
  if (
    !_0x19b4e1?.['modelManifest'] ||
    !_0x19b4e1?.['executionManifest'] ||
    !_0x55d02d?.['action'] ||
    !_0x55d02d?.['taskType'] ||
    !_0x55d02d?.['i18nKey']
  )
    throw new Error('Video depth toolbar manifest extension missing');
  return {
    modelId: _0x19b4e1['modelManifest']['modelId'],
    provider: _0x19b4e1['modelManifest']['provider'],
    adapterType: _0x19b4e1['modelManifest']['adapterType'],
    executionId: _0x19b4e1['executionManifest']['id'],
    instanceType: _0x19b4e1['executionManifest']['instanceType']?.['defaultValue'] || 'default',
    action: String(_0x55d02d['action']),
    taskType: String(_0x55d02d['taskType']),
    i18nKey: String(_0x55d02d['i18nKey']),
    nodeIdPrefix: String(_0x55d02d['nodeIdPrefix'] || 'source-video-result'),
    fileNamePrefix: String(_0x55d02d['fileNamePrefix'] || 'video_result'),
    toolbarTaskOutputTextIncludes: Array['isArray'](_0x55d02d['toolbarTaskOutputTextIncludes'])
      ? _0x55d02d['toolbarTaskOutputTextIncludes']
      : [],
  };
}
function getActionText(_0x39b59b, _0xdd65f1, _0xb490c5 = {}) {
  return t('nodeToolbar.' + _0x39b59b['i18nKey'] + '.' + _0xdd65f1, _0xb490c5);
}
function getOutputText(_0x547cae, _0x38568d, { error: error = '' } = {}) {
  const _0x196f7 = getActionText(_0x547cae, 'outputText', {
    model: getActionText(_0x547cae, 'modelLabel'),
    status: _0x38568d,
  });
  return error
    ? getActionText(_0x547cae, 'outputTextWithError', { outputText: _0x196f7, error: error })
    : _0x196f7;
}
export function bindVideoDepthAction(_0x5539e3) {
  const {
      toolbarEl: _0x2aa014,
      nodeData: _0x3affd6,
      store: _0x55736d,
      submitTask: _0xdc9714,
      generateVideo: _0x4160af,
      createRunningHubTaskStateMachine: _0x2fabb8,
      getProviderConfig: _0x17c23a,
      ensureConfig: _0x5a08a2,
      calcSafeSpawnPosNearNode: _0x4d2557,
      buildSourceMediaNodePayload: _0x483c17,
      getAutoMediaSizeByShortSide: _0x15a8c7,
      buildVideoGenerationFailurePatch: _0x22d6b8,
      buildVideoGenerationResultPatch: _0x8d796c,
      bindRunningHubToolbarTaskButton: _0xa23da0,
      cancelRunningHubResultTask: _0x54d5b0,
      cancelRunningHubRemoteTaskQuietly: _0x41b998,
      findRunningHubToolbarTaskForNode: _0x548172,
      notifyRunningHubToolbarTasksChanged: _0x136a31,
      _getCurrentVideoUrl: _0x8ccc,
      openDepthPanel: openDepthPanel = openVideoDepthEditor,
    } = _0x5539e3,
    _0x5d53e5 = getDepthVideoActionConfig(),
    _0x439792 = _0x2aa014['querySelector']('.act-' + _0x5d53e5['action']);
  if (!_0x439792) return;
  const _0x229a54 = _0x2fabb8(),
    _0x5bc287 = _0x229a54['state'],
    _0x35a6ff = (_0x22213a, _0x3628ce = {}) => getActionText(_0x5d53e5, _0x22213a, _0x3628ce),
    _0x4f4219 = (_0x4a4fe0, _0x3baa84) => getOutputText(_0x5d53e5, _0x4a4fe0, _0x3baa84),
    _0x1c2853 = () => _0x4f4219(_0x35a6ff('status.cancelled'));
  let _0x186ef1 = ![];
  (_0x229a54['bindButton'](_0x439792),
    _0xa23da0({
      button: _0x439792,
      getTask: () =>
        _0x548172(_0x3affd6['id'], {
          models: [_0x5d53e5['modelId']],
          taskTypes: [_0x5d53e5['taskType']],
          outputTextIncludes: uniqueList([
            ..._0x5d53e5['toolbarTaskOutputTextIncludes'],
            _0x35a6ff('modelLabel'),
          ]),
        }),
      cancelTask: (_0x5058a1) =>
        _0x54d5b0(_0x5058a1, {
          name: _0x35a6ff('cancelledName'),
          outputText: _0x1c2853(),
          notifyMessage: _0x35a6ff('cancelledToast'),
        }),
      cancelTooltip: _0x35a6ff('cancelTooltip'),
    }),
    _0x439792['addEventListener']('click', (_0x1dce51) => {
      (_0x1dce51['stopPropagation'](), _0x1dce51['preventDefault']());
      if (_0x186ef1) return;
      if (_0x5bc287['active']) {
        void (async () => {
          try {
            _0x5bc287['outNodeId']
              ? await _0x54d5b0(
                  {
                    outId: _0x5bc287['outNodeId'],
                    taskId: _0x5bc287['taskId'],
                    apiKey: _0x5bc287['apiKey'],
                    providerProfileId: _0x5bc287['providerProfileId'],
                    sourceNodeId: _0x3affd6['id'],
                  },
                  {
                    name: _0x35a6ff('cancelledName'),
                    outputText: _0x1c2853(),
                    notifyMessage: _0x35a6ff('cancelledToast'),
                  },
                )
              : await _0x229a54['cancel']();
          } finally {
            _0x229a54['reset'](_0x439792);
          }
        })();
        return;
      }
      void (async () => {
        let _0x50dc5e;
        const _0x80c44d = globalThis['window']?.['currentProjectId'],
          _0x5bd337 = new AbortController();
        try {
          let _0x215ad0 = _0x55736d['getState']()['nodes']?.[_0x3affd6['id']];
          if (!_0x215ad0) {
            window['showToast']?.(_0x35a6ff('sourceNodeMissing'), 'error');
            return;
          }
          const _0x97955 = _0x8ccc();
          if (!_0x97955) {
            window['showToast']?.(_0x35a6ff('noProcessableVideo'), 'error');
            return;
          }
          ((_0x186ef1 = !![]),
            _0x5539e3['closeToolbarMoreMenu']?.(),
            globalThis['window']?.['v2FocusOnNode']?.(_0x215ad0['id']));
          const _0x322e3c = await openDepthPanel({
            store: _0x55736d,
            sourceNodeId: _0x215ad0['id'],
            videoUrl: _0x97955,
            modelId: _0x5d53e5['modelId'],
            returnFocus: _0x439792,
          });
          if (!_0x322e3c) return;
          _0x215ad0 = _0x55736d['getState']()['nodes']?.[_0x3affd6['id']];
          if (!_0x215ad0) return;
          await _0x5a08a2();
          if (
            window['currentProjectId'] !== _0x80c44d ||
            !_0x55736d['getState']()['nodes']?.[_0x3affd6['id']]
          )
            return;
          _0x50dc5e = Date['now']();
          const _0x4fd025 = _0x17c23a(_0x322e3c['providerProfileId'] || 'runninghubwf') || {},
            _0x268e24 = String(_0x4fd025['apiKey'] || '')['trim'](),
            _0x23c7a1 = String(_0x322e3c['providerProfileId'] || _0x4fd025['providerProfileId'] || '')[
              'trim'
            ](),
            _0x66c174 = String(_0x4fd025['apiUrl'] || '')['trim']();
          if (!_0x268e24) {
            showProviderApiKeyMissingToast(_0x35a6ff('apiKeyMissing'), {
              providerId: _0x23c7a1 || 'runninghubwf',
              type: 'error',
            });
            return;
          }
          const { width: _0x162d23, height: _0x5d264c } = _0x15a8c7(
              _0x215ad0['width'] || 0x12c,
              _0x215ad0['height'] || 0x12c,
            ),
            { x: _0xfd68cb, y: _0x69fa16 } = _0x4d2557(
              _0x55736d['getState']()['nodes'],
              _0x215ad0,
              _0x162d23,
              _0x5d264c,
            ),
            _0x8c362 =
              _0x5d53e5['nodeIdPrefix'] +
              '-' +
              Date['now']() +
              '-' +
              Math['random']()['toString'](0x24)['slice'](0x2, 0x6),
            _0x1fe5b4 = () => _0x5d53e5['fileNamePrefix'] + '_' + Date['now']() + '.mp4',
            _0x319bde = await _0xdc9714(
              {
                sourceNodeId: _0x215ad0['id'],
                trigger: 'toolbar',
                taskType: _0x5d53e5['taskType'],
                provider: _0x5d53e5['provider'],
                adapterType: _0x5d53e5['adapterType'],
                modelId: _0x5d53e5['modelId'],
                executionId: _0x5d53e5['executionId'],
                payload: {
                  apiKey: _0x268e24,
                  provider: _0x5d53e5['provider'],
                  model: _0x5d53e5['modelId'],
                  providerProfileId: _0x23c7a1,
                  rhProviderProfileId: _0x23c7a1,
                  runningHubApiUrl: _0x66c174,
                  videoUrl: _0x97955,
                  generationParams: _0x322e3c['generationParams'],
                  rhInstanceType:
                    _0x322e3c['generationParams']?.['rhInstanceType'] || _0x5d53e5['instanceType'],
                  prompt: '',
                },
                cancellable: !![],
                resumable: !![],
                pauseOnAbort: 'afterTaskId',
                onTaskChange: ({ sourceNodeId: _0x16136d, targetNodeId: _0x2539b3 }) =>
                  _0x136a31({ sourceNodeId: _0x16136d, outId: _0x2539b3 }),
                createTargetNode: ({ startPatch: _0x42bea3, protocolPatch: _0x3bddd2 }) =>
                  _0x483c17({
                    id: _0x8c362,
                    type: 'source-video',
                    x: _0xfd68cb,
                    y: _0x69fa16,
                    width: _0x162d23,
                    height: _0x5d264c,
                    name: _0x35a6ff('processingName'),
                    src: '',
                    localPath: '',
                    fileName: _0x1fe5b4(),
                    ..._0x42bea3,
                    provider: _0x5d53e5['provider'],
                    model: _0x5d53e5['modelId'],
                    rhTaskUseOpenapiQuery: !![],
                    ..._0x3bddd2,
                    outputText: _0x4f4219(_0x35a6ff('status.processing')),
                  }),
                cancel: ({ taskId: _0x75d3a3 }) =>
                  _0x41b998({
                    apiKey: _0x268e24,
                    taskId: _0x75d3a3,
                    label: 'VideoDepth',
                    providerProfileId: _0x23c7a1,
                  }),
                submit: async (_0x2d3a9f, _0x21a327) => {
                  (_0x229a54['activate']({
                    button: _0x439792,
                    apiKey: _0x268e24,
                    providerProfileId: _0x23c7a1,
                    abortController: _0x5bd337,
                    outNodeId: _0x21a327['targetNodeId'],
                  }),
                    _0x55736d['setSelectedNodes']([_0x21a327['targetNodeId']]),
                    window['showToast']?.(_0x35a6ff('uploading'), 'info'));
                  let _0x2c75ef = ![];
                  return _0x4160af(_0x2d3a9f, {
                    signal: _0x21a327['signal'],
                    runningHubWorkflowQueueLease: _0x21a327['runningHubWorkflowQueueLease'],
                    onRunningHubWorkflowQueueChange: _0x21a327['onRunningHubWorkflowQueueChange'],
                    onTaskMeta: ({ taskId: _0xc48750 }) => {
                      const _0x134755 = String(_0xc48750 || '')['trim']();
                      (_0x134755 && (_0x229a54['setTaskId'](_0x134755), _0x21a327['onTaskId']?.(_0x134755)),
                        !_0x2c75ef &&
                          ((_0x2c75ef = !![]), window['showToast']?.(_0x35a6ff('processingToast'), 'info')));
                    },
                  });
                },
                resultBuilder: (_0x4ac426, _0x2a8e44) => ({
                  name: _0x35a6ff('resultName'),
                  ..._0x8d796c(_0x4ac426, { startedAt: _0x2a8e44['startedAt'] }),
                  fileName: _0x1fe5b4(),
                  outputText: _0x4f4219(_0x35a6ff('status.complete')),
                }),
                failureBuilder: (_0x41da07, _0x6cd5d4) => {
                  const _0x50ae6a =
                    _0x41da07 instanceof Error ? _0x41da07['message'] : String(_0x41da07 || '');
                  return {
                    name: _0x35a6ff('failedName'),
                    ..._0x22d6b8({ error: _0x50ae6a, startedAt: _0x6cd5d4['startedAt'] }),
                    fileName: _0x1fe5b4(),
                    outputText: _0x4f4219(_0x35a6ff('status.failed'), { error: _0x50ae6a }),
                  };
                },
                cancelledBuilder: () => ({ name: _0x35a6ff('cancelledName'), outputText: _0x1c2853() }),
              },
              { store: _0x55736d, abortController: _0x5bd337, startedAt: _0x50dc5e },
            );
          if (_0x319bde['status'] === 'success')
            (window['_triggerLocalCacheSave']?.(),
              window['showToast']?.(_0x35a6ff('successToast'), 'success'));
          else {
            if (_0x319bde['status'] === 'failed') {
              const _0x2b2cda =
                _0x319bde['error'] instanceof Error
                  ? _0x319bde['error']['message']
                  : String(_0x319bde['error'] || '');
              window['showToast']?.(_0x35a6ff('failedWithError', { error: _0x2b2cda }), 'error');
            } else
              _0x319bde['status'] === 'cancelled' &&
                window['showToast']?.(_0x35a6ff('cancelledToast'), 'info');
          }
        } catch (_0x2763f3) {
          const _0x1e56fa = _0x2763f3 instanceof Error ? _0x2763f3['message'] : String(_0x2763f3 || ''),
            _0x5d303a =
              _0x5bc287['cancelRequested'] ||
              _0x229a54['isCancelled']() ||
              _0x1e56fa === 'CANCELLED' ||
              _0x1e56fa['includes']('aborted');
          !_0x5d303a && window['showToast']?.(_0x35a6ff('failedWithError', { error: _0x1e56fa }), 'error');
        } finally {
          ((_0x186ef1 = ![]), _0x229a54['reset'](_0x439792));
        }
      })();
    }));
}
