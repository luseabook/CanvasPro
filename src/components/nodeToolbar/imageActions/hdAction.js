import { t } from '../../../i18n/index.js';
import { createToolbarActionPopupAnchorPositionGetter } from '../actionMenu.js';
const IMAGE_HD_LEGACY_MODEL_LABEL = 'RH高清放大';
function imageHdText(_0x272bce, _0x1c95c0 = {}) {
  return t('nodeToolbar.imageHd.' + _0x272bce, _0x1c95c0);
}
function uniqueList(_0x324457) {
  return Array.from(new Set(_0x324457.map((_0x7d4110) => String(_0x7d4110 || '').trim()).filter(Boolean)));
}
function imageHdOutputText({ resolution: resolution = '', status: status = '', error: error = '' } = {}) {
  const _0x13d507 = imageHdText('outputText', {
      model: imageHdText('modelLabel'),
      prompt: imageHdText('promptLabel'),
      resolution: resolution,
    }),
    _0x21fe9b = status
      ? imageHdText('outputTextWithStatus', { outputText: _0x13d507, status: status })
      : _0x13d507;
  return error ? imageHdText('outputTextWithError', { outputText: _0x21fe9b, error: error }) : _0x21fe9b;
}
export function bindImageHdAction(_0x35061c) {
  const {
      toolbarEl: _0x273412,
      nodeId: _0x4b2516,
      getNodeData: _0x5d392a,
      _hdTaskMachine: _0xd4f392,
      _hdState: _0x102ed1,
      store: _0xb172b1,
      submitTask: _0x2ee60d,
      buildSourceMediaNodePayload: _0x3a6ba1,
      buildImageGenerationFailurePatch: _0x5cf7a7,
      buildImageGenerationResultPatch: _0x50a214,
      calcDisplaySizeByMedia: _0x57752a,
      runRunninghubWorkflow: _0x37ea35,
      resumeRunninghubWorkflowTask: _0x1d0f57,
      processInputImages: _0x3cdb51,
      getProviderConfig: _0x411d35,
      ensureConfig: _0x536e7e,
      calcSafeSpawnPosNearNode: _0x1bd3cb,
      bindRunningHubToolbarTaskButton: _0x29d8f0,
      cancelRunningHubResultTask: _0x21f984,
      findRunningHubToolbarTaskForNode: _0x39f2fa,
      isRunningHubToolbarTaskCancelled: _0x155829,
      saveRemoteImageResultLocally: _0x3df074,
      extractFirstImageUrl: _0x41a3ba,
      resolveApiInputRatioBasis: _0x3f0ae7,
      resolveFinalResultDisplaySize: _0x563dec,
      createToolbarCancelledError: _0x577b9a,
      isToolbarCancelledError: _0x443bde,
      createLocalSaveFailureError: _0x4c4822,
      isLocalSaveFailure: _0x435ba1,
      throwIfToolbarTaskCancelled: _0x13043f,
      cancelRunningHubRemoteTaskQuietly: _0x22d01e,
      focusToolbarTaskNodes: _0x10b746,
      notifyImageToolbarTaskChange: _0x130501,
      buildClearedImageMediaFields: _0x3f475e,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: _0x19448c,
    } = _0x35061c,
    _0x2a8bac = _0x273412.querySelector('.act-hd');
  _0x2a8bac &&
    (_0xd4f392.bindButton(_0x2a8bac),
    _0x29d8f0({
      button: _0x2a8bac,
      getTask: () =>
        _0x39f2fa(_0x4b2516, {
          models: ['runninghub/2012862147813974018'],
          taskTypes: ['image-hd'],
          outputTextIncludes: uniqueList([IMAGE_HD_LEGACY_MODEL_LABEL, imageHdText('modelLabel')]),
        }),
      cancelTask: async (_0x39308b) => {
        try {
          if (_0x102ed1.active && String(_0x102ed1.outNodeId || '') === _0x39308b.outId)
            try {
              await _0xd4f392.cancel();
            } catch (_0x8140d2) {
              console.warn('[ImageHD] cancel request failed:', _0x8140d2);
            }
          return await _0x21f984(_0x39308b, {
            name: imageHdText('cancelledName'),
            outputText: imageHdOutputText({ status: imageHdText('status.cancelled') }),
            notifyMessage: imageHdText('cancelledToast'),
          });
        } finally {
          _0x102ed1.active &&
            String(_0x102ed1.outNodeId || '') === _0x39308b.outId &&
            _0xd4f392.reset(_0x2a8bac);
        }
      },
      cancelTooltip: imageHdText('cancelTooltip'),
    }),
    _0x2a8bac.addEventListener('click', (_0x5a6815) => {
      (_0x5a6815.stopPropagation(), _0x5a6815.preventDefault());
      if (_0x102ed1.active) {
        (async () => {
          let _0x941820 = null;
          try {
            const _0x5521c0 = _0x102ed1.outNodeId
              ? {
                  outId: _0x102ed1.outNodeId,
                  targetNodeId: _0x102ed1.outNodeId,
                  taskId: _0x102ed1.taskId,
                  apiKey: _0x102ed1.apiKey,
                  sourceNodeId: _0x4b2516,
                }
              : null;
            _0x5521c0
              ? await _0x21f984(_0x5521c0, {
                  name: imageHdText('cancelledName'),
                  outputText: imageHdOutputText({ status: imageHdText('status.cancelled') }),
                  notifyMessage: imageHdText('cancelledToast'),
                })
              : (await _0xd4f392.cancel(), window.showToast?.(imageHdText('taskCancelled'), 'info'));
          } catch (_0x6ec41c) {
            _0x941820 = _0x6ec41c;
          }
          try {
            _0x941820 && console.warn('[ImageHD] cancel request failed:', _0x941820);
          } finally {
            _0xd4f392.reset(_0x2a8bac);
          }
        })();
        return;
      }
      const _0x461ace = document.querySelector('.v2-hd-popup');
      if (_0x461ace) {
        const _0x3a234c = _0x461ace.__v2HdAnchorBtn && _0x461ace.__v2HdAnchorBtn === _0x2a8bac,
          _0x15d156 =
            typeof _0x461ace.__v2HdClose === 'function' ? _0x461ace.__v2HdClose : () => _0x461ace.remove();
        _0x15d156();
        if (_0x3a234c) return;
      }
      const _0x4c3916 = document.createElement('div');
      ((_0x4c3916.className = 'v2-hd-popup node-toolbar-action-menu'),
        (_0x4c3916.__v2HdAnchorBtn = _0x2a8bac));
      const _0x293ed8 = createToolbarActionPopupAnchorPositionGetter(_0x2a8bac),
        _0xcae495 = _0x293ed8();
      Object.assign(_0x4c3916.style, {
        position: 'fixed',
        left: _0xcae495.left + 'px',
        top: _0xcae495.top + 'px',
        transform: 'translate(-50%, calc(-100% + 10px))',
        opacity: '0',
        pointerEvents: 'none',
      });
      const _0x5c370b = document.createElement('div');
      ((_0x5c370b.className = 'node-toolbar-action-menu-title'),
        (_0x5c370b.textContent = imageHdText('choosePlan')),
        _0x4c3916.appendChild(_0x5c370b));
      const _0xc4b31d = [0x500, 0x780, 0xa00],
        _0x3eeffc = () => {
          const _0x3d6bd0 = document.createElement('div');
          _0x3d6bd0.className = 'node-toolbar-action-menu-item';
          const _0x4cfed6 = document.createElement('div');
          _0x4cfed6.className = 'node-toolbar-action-menu-icon';
          const _0x4deb23 = document.createElement('img');
          ((_0x4deb23.className = 'node-toolbar-action-provider-logo'),
            (_0x4deb23.src = 'images/RH.png'),
            (_0x4deb23.alt = 'runninghub'),
            _0x4cfed6.appendChild(_0x4deb23),
            _0x3d6bd0.appendChild(_0x4cfed6));
          const _0x5897ca = document.createElement('div');
          _0x5897ca.className = 'node-toolbar-action-menu-body';
          const _0x1ef721 = document.createElement('span');
          ((_0x1ef721.className = 'node-toolbar-action-menu-item-title'),
            (_0x1ef721.textContent = imageHdText('modelLabel')),
            _0x5897ca.appendChild(_0x1ef721));
          const _0x11cfb9 = document.createElement('span');
          ((_0x11cfb9.className = 'node-toolbar-action-menu-item-desc'),
            (_0x11cfb9.textContent = imageHdText('modelDesc')),
            _0x5897ca.appendChild(_0x11cfb9),
            _0x3d6bd0.appendChild(_0x5897ca));
          const _0x12a695 = document.createElement('div');
          ((_0x12a695.className = 'node-toolbar-action-caret'),
            (_0x12a695.innerHTML = '&gt;'),
            _0x3d6bd0.appendChild(_0x12a695));
          let _0x3cb45b = null,
            _0x2e4f80 = 0,
            _0xb15081 = 0,
            _0x2daffc = 0,
            _0x1a2b81 = null;
          const _0x1107e9 = () => {
              if (_0x2e4f80) clearTimeout(_0x2e4f80);
              _0x2e4f80 = 0;
              if (_0xb15081) clearTimeout(_0xb15081);
              _0xb15081 = 0;
              if (_0x2daffc) cancelAnimationFrame(_0x2daffc);
              ((_0x2daffc = 0),
                _0x1a2b81 && (document.removeEventListener('pointerdown', _0x1a2b81), (_0x1a2b81 = null)));
            },
            _0x11977f = () => {
              if (!_0x3cb45b) return;
              const _0x5dc6f9 = _0x3cb45b;
              _0x3cb45b = null;
              if (_0x4c3916.__v2HdSubmenuEl === _0x5dc6f9) _0x4c3916.__v2HdSubmenuEl = null;
              (_0x3d6bd0.classList.remove('is-open'), _0x1107e9());
              if (document.body.contains(_0x5dc6f9)) _0x5dc6f9.remove();
            },
            _0x3cc49b = () => {
              if (_0xb15081) clearTimeout(_0xb15081);
              _0xb15081 = 0;
            },
            _0x466db2 = () => {
              (_0x3cc49b(), (_0xb15081 = setTimeout(() => _0x11977f(), 160)));
            },
            _0x4983d6 = () => {
              if (_0x3cb45b && document.body.contains(_0x3cb45b)) return _0x3cb45b;
              const _0x179876 = document.querySelector('.v2-hd-submenu');
              if (_0x179876) _0x179876.remove();
              ((_0x3cb45b = document.createElement('div')),
                (_0x3cb45b.className = 'v2-hd-submenu node-toolbar-action-submenu'),
                (_0x4c3916.__v2HdSubmenuEl = _0x3cb45b),
                _0x3d6bd0.classList.add('is-open'),
                Object.assign(_0x3cb45b.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' }));
              const _0x40f6f7 = () => {
                if (!_0x3cb45b || !document.body.contains(_0x3cb45b) || !document.body.contains(_0x3d6bd0)) {
                  if (_0x2daffc) cancelAnimationFrame(_0x2daffc);
                  _0x2daffc = 0;
                  return;
                }
                const _0x3a53ac = _0x3d6bd0.getBoundingClientRect();
                if (_0x3a53ac.width <= 0 || _0x3a53ac.height <= 0) {
                  _0x2daffc = requestAnimationFrame(_0x40f6f7);
                  return;
                }
                const _0x2f3eac = 12,
                  _0x28a461 = 8,
                  _0x52c41b = _0x3cb45b.offsetWidth || 180,
                  _0x384784 = _0x3a53ac.right + _0x2f3eac,
                  _0x2973ac = _0x3a53ac.left - _0x52c41b - _0x2f3eac,
                  _0x32ad09 = window.innerWidth - _0x52c41b - _0x28a461,
                  _0x5c767b = _0x384784 <= _0x32ad09 ? _0x384784 : Math.max(_0x28a461, _0x2973ac);
                ((_0x3cb45b.style.left = _0x5c767b + 'px'),
                  (_0x3cb45b.style.top = _0x3a53ac.top + 'px'),
                  (_0x2daffc = requestAnimationFrame(_0x40f6f7)));
              };
              ((_0x2daffc = requestAnimationFrame(_0x40f6f7)),
                _0x3cb45b.addEventListener('pointerenter', (_0x1a4d1f) => {
                  if (_0x1a4d1f.pointerType !== 'mouse') return;
                  _0x3cc49b();
                }),
                _0x3cb45b.addEventListener('pointerleave', (_0x1fbc75) => {
                  if (_0x1fbc75.pointerType !== 'mouse') return;
                  _0x466db2();
                }));
              const _0xa096d6 = document.createElement('div');
              return (
                (_0xa096d6.className = 'node-toolbar-action-menu-title'),
                (_0xa096d6.textContent = imageHdText('chooseResolution')),
                _0x3cb45b.appendChild(_0xa096d6),
                _0xc4b31d.forEach((_0x1ef574) => {
                  const _0x2b3e89 = document.createElement('div');
                  ((_0x2b3e89.className = 'node-toolbar-action-menu-item node-toolbar-action-submenu-item'),
                    (_0x2b3e89.textContent = _0x1ef574),
                    _0x2b3e89.addEventListener('click', async (_0x613ec5) => {
                      (_0x613ec5.stopPropagation(), _0x11977f(), _0x445311());
                      const _0x47e639 = _0x1ef574,
                        _0x4502e6 = _0x4b2516,
                        _0x40560e = _0x2a8bac.querySelector('svg');
                      if (_0x40560e) _0x40560e.classList.add('v2-spinning');
                      const _0x1763e9 = new AbortController();
                      let _0x21b762 = '',
                        _0x24316f = '',
                        _0x4e67fa = null,
                        _0x42c0e4 = '',
                        _0x3cd94a = '',
                        _0x34426b = '';
                      try {
                        const _0x4041fd = _0x5d392a(),
                          _0x3a696a =
                            _0x4041fd?.localPath ||
                            (_0x4041fd?.images && _0x4041fd.images[_0x4041fd.mainImageIndex || 0]?.localPath),
                          _0x4402c8 = _0x3a696a ? '/' + _0x3a696a : _0x4041fd?.src || _0x4041fd?.sourceUrl;
                        if (!_0x4402c8) {
                          window.showToast?.(imageHdText('noProcessableImage'), 'error');
                          return;
                        }
                        await _0x536e7e();
                        const _0x2f5ba1 = _0x411d35('runninghubwf');
                        _0x24316f = String(_0x2f5ba1?.apiKey || '').trim();
                        if (!_0x24316f) {
                          window.showToast?.(imageHdText('apiKeyMissing'), 'error');
                          return;
                        }
                        const _0x15238e = _0xb172b1.getState().nodes[_0x4502e6] || _0x4041fd;
                        if (!_0x15238e) {
                          window.showToast?.(imageHdText('sourceNodeMissing'), 'error');
                          return;
                        }
                        const _0x1ec266 = await _0x3f0ae7(_0x15238e, _0x4402c8),
                          { width: _0x3f16e9, height: _0x870ea6 } = _0x57752a(
                            _0x1ec266.width,
                            _0x1ec266.height,
                          ),
                          { x: _0x16dbc4, y: _0x198fbd } = _0x1bd3cb(
                            _0xb172b1.getState().nodes,
                            _0x15238e,
                            _0x3f16e9,
                            _0x870ea6,
                          ),
                          _0x49b67d = '2012862147813974018',
                          _0x3d0d0e = 'runninghub/' + _0x49b67d,
                          _0x39b6b0 =
                            'source-image-hd-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                          _0x354bfe = imageHdOutputText({ resolution: _0x47e639 }),
                          _0x11a6b1 = await _0x2ee60d(
                            {
                              sourceNodeId: _0x15238e.id,
                              trigger: 'toolbar',
                              taskType: 'image-hd',
                              provider: 'runninghubwf',
                              adapterType: 'workflow',
                              modelId: _0x3d0d0e,
                              executionId: 'runninghub.image-hd',
                              payload: {
                                apiKey: _0x24316f,
                                imgUrl: _0x4402c8,
                                inputBasis: _0x1ec266,
                                selectedResolution: _0x47e639,
                                outputText: _0x354bfe,
                              },
                              cancellable: true,
                              resumable: true,
                              onTaskChange: _0x130501,
                              createTargetNode: ({
                                startedAt: _0x546881,
                                startPatch: _0x46a309,
                                protocolPatch: _0x325a6e,
                              }) =>
                                _0x3a6ba1({
                                  id: _0x39b6b0,
                                  type: 'source-image',
                                  x: _0x16dbc4,
                                  y: _0x198fbd,
                                  width: _0x3f16e9,
                                  height: _0x870ea6,
                                  needsAutoResize: false,
                                  name: imageHdText('processingName'),
                                  src: '',
                                  outputText: _0x354bfe,
                                  localPath: '',
                                  fileName: 'hd_' + Date.now() + '.jpg',
                                  provider: 'runninghubwf',
                                  model: _0x3d0d0e,
                                  rhTaskUseOpenapiQuery: false,
                                  ..._0x46a309,
                                  ..._0x325a6e,
                                  generationStartTime: _0x546881,
                                  rhTaskStartedAt: _0x546881,
                                }),
                              submit: async (_0x33544d, _0x1ca7a9) => {
                                (_0x10b746(_0x15238e.id, _0x1ca7a9.targetNodeId),
                                  _0xd4f392.activate({
                                    button: _0x2a8bac,
                                    apiKey: _0x24316f,
                                    abortController: _0x1763e9,
                                    outNodeId: _0x1ca7a9.targetNodeId,
                                  }));
                                const _0x56f526 = await _0x3cdb51([_0x33544d.imgUrl], _0x24316f, {
                                  applyInputQualityProfile: true,
                                  provider: 'runninghub',
                                });
                                if (_0x56f526.length === 0) throw new Error(imageHdText('uploadEmpty'));
                                const _0x2852c4 = String(_0x56f526[0] || '').trim();
                                if (!_0x2852c4) throw new Error(imageHdText('uploadFailed'));
                                _0x13043f(_0x1ca7a9.targetNodeId);
                                const _0x27511e = await _0x37ea35(
                                  {
                                    apiKey: _0x24316f,
                                    workflowId: _0x49b67d,
                                    addMetadata: false,
                                    nodeInfoList: [
                                      { nodeId: '416', fieldName: 'image', fieldValue: _0x2852c4 },
                                      { nodeId: '413', fieldName: 'value', fieldValue: _0x47e639 },
                                    ],
                                    instanceType: 'default',
                                    usePersonalQueue: 'false',
                                  },
                                  { signal: _0x1763e9.signal },
                                );
                                _0x21b762 = String(_0x27511e?.data?.taskId || _0x27511e?.taskId || '').trim();
                                if (!_0x21b762) throw new Error(imageHdText('taskIdMissing'));
                                (_0xd4f392.setTaskId(_0x21b762), _0x1ca7a9.onTaskId(_0x21b762));
                                if (_0xd4f392.isCancelled() || _0x155829(_0x1ca7a9.targetNodeId)) {
                                  await _0x22d01e({ apiKey: _0x24316f, taskId: _0x21b762, label: 'ImageHD' });
                                  throw _0x577b9a();
                                }
                                return { taskId: _0x21b762 };
                              },
                              poll: async ({
                                taskId: _0x182327,
                                signal: _0x53cdea,
                                targetNodeId: _0x99465b,
                              }) => {
                                if (_0xd4f392.isCancelled() || _0x155829(_0x99465b)) throw _0x577b9a();
                                const _0x10f7bd = await _0x1d0f57(
                                  { apiKey: _0x24316f, taskId: _0x182327 },
                                  { signal: _0x53cdea, taskKind: 'image' },
                                );
                                if (_0xd4f392.isCancelled() || _0x155829(_0x99465b)) throw _0x577b9a();
                                const _0x1c2838 = _0x41a3ba(_0x10f7bd);
                                if (!_0x1c2838) throw new Error(imageHdText('missingResultImage'));
                                return { resultUrl: _0x1c2838 };
                              },
                              cancel: ({ taskId: _0x29e89d }) =>
                                _0x22d01e({ apiKey: _0x24316f, taskId: _0x29e89d, label: 'ImageHD' }),
                              resultBuilder: async (_0x1aa3ab, _0x18a930) => {
                                const _0x1796b6 = String(_0x1aa3ab?.resultUrl || '').trim();
                                if (!_0x1796b6) throw new Error(imageHdText('missingResultImage'));
                                _0x42c0e4 = _0x1796b6;
                                let _0x5d19e0 = null;
                                try {
                                  _0x5d19e0 = await _0x3df074(_0x1796b6, {
                                    projectId: window.currentProjectId || 'default_v2_project',
                                    includeSrc: true,
                                  });
                                } catch (_0x40d0db) {
                                  console.error('保存图片失败:', _0x40d0db);
                                }
                                ((_0x34426b = _0x5d19e0?.localPath || ''),
                                  (_0x3cd94a = _0x5d19e0?.thumbUrl || _0x1796b6));
                                if (!_0x34426b) throw _0x4c4822();
                                return (
                                  (_0x4e67fa = await _0x563dec(_0x1ec266, {
                                    localPath: _0x34426b,
                                    imageUrl: _0x1796b6,
                                    sourceUrl: _0x1796b6,
                                    thumbUrl: _0x3cd94a,
                                    src: _0x3cd94a || _0x1796b6,
                                  })),
                                  {
                                    name: imageHdText('resultName'),
                                    ..._0x50a214(_0x5d19e0.fields, { startedAt: _0x18a930.startedAt }),
                                    ..._0x5d19e0.fields,
                                    fileName: 'hd_' + Date.now() + '.jpg',
                                    width: _0x4e67fa.width,
                                    height: _0x4e67fa.height,
                                    outputText: _0x354bfe,
                                  }
                                );
                              },
                              failureBuilder: async (_0x58fd63, _0x261ff8) => {
                                const _0x5049ca =
                                  _0x58fd63 instanceof Error
                                    ? _0x58fd63.message
                                    : String(_0x58fd63 || imageHdText('unknownError'));
                                if (_0x435ba1(_0x58fd63))
                                  return (
                                    (_0x4e67fa ||= await _0x563dec(_0x1ec266, {
                                      localPath: _0x34426b,
                                      imageUrl: _0x42c0e4,
                                      sourceUrl: _0x42c0e4,
                                      thumbUrl: _0x3cd94a,
                                      src: _0x3cd94a || _0x42c0e4,
                                    })),
                                    {
                                      name: imageHdText('resultName'),
                                      ..._0x3f475e(),
                                      width: _0x4e67fa.width,
                                      height: _0x4e67fa.height,
                                      outputText: _0x354bfe,
                                      ..._0x5cf7a7({ error: _0x19448c, startedAt: _0x261ff8.startedAt }),
                                      rhStatusMessage: _0x19448c,
                                    }
                                  );
                                return {
                                  name: imageHdText('failedName'),
                                  ..._0x5cf7a7({ error: _0x5049ca, startedAt: _0x261ff8.startedAt }),
                                  outputText: imageHdText('outputTextWithError', {
                                    outputText: _0x354bfe,
                                    error: _0x5049ca,
                                  }),
                                };
                              },
                              cancelledBuilder: () => ({
                                name: imageHdText('cancelledName'),
                                outputText: imageHdOutputText({ status: imageHdText('status.cancelled') }),
                              }),
                            },
                            { abortController: _0x1763e9 },
                          );
                        if (_0x11a6b1.status === 'success')
                          window.showToast?.(imageHdText('successToast'), 'success');
                        else {
                          if (_0x11a6b1.status === 'failed') {
                            if (_0x435ba1(_0x11a6b1.error)) window.showToast?.('⚠️ ' + _0x19448c, 'warn');
                            else {
                              const _0x30117d =
                                _0x11a6b1.error instanceof Error
                                  ? _0x11a6b1.error.message
                                  : String(_0x11a6b1.error || imageHdText('unknownError'));
                              window.showToast?.(
                                imageHdText('failedWithError', { error: _0x30117d }),
                                'error',
                              );
                            }
                          } else
                            _0x11a6b1.status === 'cancelled' &&
                              window.showToast?.(imageHdText('cancelledToast'), 'info');
                        }
                      } catch (_0x11fb46) {
                        const _0xb1b0a3 =
                          _0x11fb46 instanceof Error ? _0x11fb46.message : String(_0x11fb46 || '');
                        _0x443bde(_0x11fb46)
                          ? window.showToast?.(imageHdText('cancelledToast'), 'info')
                          : (console.error('RH高清放大失败:', _0x11fb46),
                            window.showToast?.(
                              imageHdText('failedWithError', { error: _0xb1b0a3 }),
                              'error',
                            ));
                      } finally {
                        if (_0x40560e) _0x40560e.classList.remove('v2-spinning');
                        _0xd4f392.reset(_0x2a8bac);
                      }
                    }),
                    _0x3cb45b.appendChild(_0x2b3e89));
                }),
                document.body.appendChild(_0x3cb45b),
                _0x3cb45b.offsetHeight,
                (_0x3cb45b.style.opacity = '1'),
                (_0x3cb45b.style.pointerEvents = 'auto'),
                (_0x1a2b81 = (_0x455112) => {
                  if (!_0x3cb45b) return;
                  if (!_0x3cb45b.contains(_0x455112.target) && !_0x3d6bd0.contains(_0x455112.target))
                    _0x11977f();
                }),
                document.addEventListener('pointerdown', _0x1a2b81),
                _0x3cb45b
              );
            };
          ((_0x3d6bd0.__v2LastPointerType = 'mouse'),
            _0x3d6bd0.addEventListener('pointerdown', (_0x5f0dd4) => {
              _0x3d6bd0.__v2LastPointerType = _0x5f0dd4.pointerType || 'mouse';
            }));
          const _0x2b9d69 = () => {
            _0x3cc49b();
            if (_0x2e4f80) clearTimeout(_0x2e4f80);
            _0x2e4f80 = setTimeout(() => _0x4983d6(), 60);
          };
          return (
            _0x3d6bd0.addEventListener('pointerenter', (_0x11d165) => {
              if (_0x11d165.pointerType !== 'mouse') return;
              _0x2b9d69();
            }),
            _0x3d6bd0.addEventListener('pointerleave', (_0x52bdd8) => {
              if (_0x52bdd8.pointerType !== 'mouse') return;
              _0x466db2();
            }),
            _0x3d6bd0.addEventListener('click', (_0x458b52) => {
              _0x458b52.stopPropagation();
              if (_0x3d6bd0.__v2LastPointerType === 'touch') {
                if (_0x3cb45b && document.body.contains(_0x3cb45b)) _0x11977f();
                else _0x4983d6();
                return;
              }
              _0x4983d6();
            }),
            _0x3d6bd0
          );
        };
      (_0x4c3916.appendChild(_0x3eeffc()),
        document.body.appendChild(_0x4c3916),
        _0x4c3916.offsetHeight,
        (_0x4c3916.style.pointerEvents = 'auto'),
        (_0x4c3916.style.opacity = '1'),
        (_0x4c3916.style.transform = 'translate(-50%, -100%)'));
      let _0x16483b = 0,
        _0x17fd66 = null;
      const _0x3c3827 = () => {
          if (_0x16483b) cancelAnimationFrame(_0x16483b);
          ((_0x16483b = 0),
            _0x17fd66 && (document.removeEventListener('pointerdown', _0x17fd66), (_0x17fd66 = null)));
        },
        _0x445311 = () => {
          if (_0x4c3916.__v2HdClosing) return;
          ((_0x4c3916.__v2HdClosing = true),
            _0x3c3827(),
            (_0x4c3916.style.opacity = '0'),
            (_0x4c3916.style.pointerEvents = 'none'),
            (_0x4c3916.style.transform = 'translate(-50%, calc(-100% + 10px))'),
            setTimeout(() => _0x4c3916.remove(), 250));
        };
      _0x4c3916.__v2HdClose = _0x445311;
      const _0x3397d0 = () => {
        if (!document.body.contains(_0x4c3916) || !document.body.contains(_0x2a8bac)) {
          _0x3c3827();
          return;
        }
        if (!_0x293ed8.hasVisibleAnchor()) {
          _0x16483b = requestAnimationFrame(_0x3397d0);
          return;
        }
        const _0x23725c = _0x293ed8();
        ((_0x4c3916.style.left = _0x23725c.left + 'px'),
          (_0x4c3916.style.top = _0x23725c.top + 'px'),
          (_0x16483b = requestAnimationFrame(_0x3397d0)));
      };
      ((_0x16483b = requestAnimationFrame(_0x3397d0)),
        (_0x17fd66 = (_0x4aad9e) => {
          if (_0x4c3916.__v2HdClosing) return;
          const _0x679c7a = _0x4c3916.__v2HdSubmenuEl,
            _0x2e052d = _0x4c3916.contains(_0x4aad9e.target),
            _0x191e52 = _0x679c7a && _0x679c7a.contains(_0x4aad9e.target);
          if (!_0x2e052d && !_0x191e52 && _0x4aad9e.target !== _0x2a8bac) _0x445311();
        }),
        setTimeout(() => document.addEventListener('pointerdown', _0x17fd66), 10));
    }));
}
