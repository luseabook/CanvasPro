import { t } from '../../../i18n/index.js';
import { createToolbarActionPopupAnchorPositionGetter } from '../actionMenu.js';
function autoSubjectText(_0xb2898b, _0x193661 = {}) {
  return t('nodeToolbar.autoSubject.' + _0xb2898b, _0x193661);
}
export function bindImageAutoSubjectAction(_0x46f6fb) {
  const {
      toolbarEl: _0x506bdc,
      nodeId: _0x488149,
      getNodeData: _0x3e8e27,
      store: _0x431765,
      submitTask: _0x2fe358,
      buildSourceMediaNodePayload: _0x1219eb,
      resolveCanvasImagePreviewUrl: _0x17048a,
      localPathToUrl: _0x1a78dc,
      buildImageGenerationFailurePatch: _0x9e53ce,
      buildImageGenerationResultPatch: _0xf88a37,
      calcDisplaySizeByMedia: _0x4175ae,
      runRunninghubAiApp: _0x2020cc,
      resumeRunninghubWorkflowTask: _0x51f36f,
      processInputImages: _0x3c9dc2,
      getProviderConfig: _0x1946fd,
      ensureConfig: _0x5dc319,
      calcSafeSpawnPosNearNode: _0x14c818,
      bindRunningHubToolbarTaskButton: _0x47099a,
      cancelRunningHubResultTask: _0x1e497f,
      findRunningHubToolbarTaskForNode: _0x3343aa,
      isRunningHubToolbarTaskCancelled: _0x5e121b,
      buildToolbarImageFields: _0x2d053e,
      saveRemoteImageResultLocally: _0xc4dac,
      extractFirstImageUrl: _0x1e9cf8,
      parseRhCode: _0x5a3e2a,
      parseRhTaskId: _0x264507,
      resolveApiInputRatioBasis: _0x3427dd,
      resolveFinalResultDisplaySize: _0xcd059f,
      createToolbarCancelledError: _0x29544f,
      isToolbarCancelledError: _0x43a975,
      createLocalSaveFailureError: _0x1eb42e,
      isLocalSaveFailure: _0x63f2bf,
      throwIfToolbarTaskCancelled: _0x13bd59,
      cancelRunningHubRemoteTaskQuietly: _0x4bbc1c,
      focusToolbarTaskNodes: _0x20c73a,
      notifyImageToolbarTaskChange: _0x232be8,
      buildClearedImageMediaFields: _0x2480dd,
      IMAGE_LOCAL_SAVE_FAILURE_MESSAGE: _0x5ce985,
    } = _0x46f6fb,
    _0x428891 = _0x506bdc.querySelector('.act-auto-subject');
  if (_0x428891) {
    const _0x4bf08c = 'rh-matting',
      _0x99974c = 'RH抠图',
      _0xbe6477 = 'runninghub/2042329021530247170',
      _0x56c2d1 = [
        { key: 'transparent', labelKey: 'transparent' },
        { key: 'white', labelKey: 'white' },
        { key: 'black', labelKey: 'black' },
        { key: 'gray', labelKey: 'gray' },
      ],
      _0x3e5cbe = () => autoSubjectText('modeLabel'),
      _0x45b6fb = (_0x22cf3a) => autoSubjectText('backgrounds.' + _0x22cf3a),
      _0x2c0b60 = () => {
        _0x428891.dataset.tooltip = autoSubjectText('buttonTooltip');
      };
    (_0x2c0b60(),
      _0x47099a({
        button: _0x428891,
        getTask: () =>
          _0x3343aa(_0x488149, {
            models: [_0xbe6477],
            taskTypes: ['image-auto-subject'],
            outputTextIncludes: [_0x99974c, _0x3e5cbe()],
          }),
        cancelTask: (_0x5681f0) =>
          _0x1e497f(_0x5681f0, {
            name: autoSubjectText('cancelledName'),
            outputText: autoSubjectText('cancelledOutput', { model: _0x3e5cbe() }),
            notifyMessage: autoSubjectText('cancelledToast'),
          }),
        cancelTooltip: autoSubjectText('cancelTooltip'),
      }));
    let _0x8c232f = null,
      _0x2eb69e = null,
      _0x51de5e = null,
      _0x428568 = 0,
      _0x1ec2fa = 0,
      _0x500b88 = 0,
      _0x5a14a3 = null,
      _0x503c22 = null,
      _0x5e37e6 = null;
    const _0x7d7df7 = () => {
        if (_0x500b88) clearTimeout(_0x500b88);
        _0x500b88 = 0;
        if (_0x1ec2fa) cancelAnimationFrame(_0x1ec2fa);
        ((_0x1ec2fa = 0),
          _0x503c22 && (document.removeEventListener('pointerdown', _0x503c22), (_0x503c22 = null)));
      },
      _0x30c6e3 = () => {
        if (!_0x2eb69e) return;
        const _0x28b885 = _0x2eb69e;
        _0x2eb69e = null;
        if (_0x51de5e) _0x51de5e.classList.remove('is-open');
        _0x7d7df7();
        if (document.body.contains(_0x28b885)) _0x28b885.remove();
        if (_0x51de5e) _0x51de5e.__v2SubjectSubOpen = false;
      },
      _0x222ce7 = () => {
        if (!_0x2eb69e) return;
        _0x2eb69e.querySelectorAll('.v2-subject-bg-item').forEach((_0x41b14b) => {
          ((_0x41b14b.__v2IsActive = false), _0x41b14b.classList.remove('is-active'));
        });
      },
      _0x16b6d4 = () => {
        if (!_0x8c232f) return;
        const _0x55bdeb = _0x8c232f;
        ((_0x8c232f = null), (_0x51de5e = null), _0x30c6e3());
        _0x5a14a3 && (document.removeEventListener('pointerdown', _0x5a14a3), (_0x5a14a3 = null));
        _0x5e37e6 && (_0x506bdc.removeEventListener('pointerdown', _0x5e37e6, true), (_0x5e37e6 = null));
        if (_0x428568) cancelAnimationFrame(_0x428568);
        _0x428568 = 0;
        if (!document.body.contains(_0x55bdeb)) return;
        ((_0x55bdeb.style.opacity = '0'),
          (_0x55bdeb.style.pointerEvents = 'none'),
          (_0x55bdeb.style.transform = 'translate(-50%, calc(-100% + 10px))'),
          setTimeout(() => {
            if (document.body.contains(_0x55bdeb)) _0x55bdeb.remove();
          }, 250));
      },
      _0x5195ec = () => {
        if (_0x500b88) clearTimeout(_0x500b88);
        _0x500b88 = setTimeout(() => _0x30c6e3(), 160);
      },
      _0x5a4834 = () => {
        if (_0x500b88) clearTimeout(_0x500b88);
        _0x500b88 = 0;
      },
      _0x4b555d = (_0x2870d8) => {
        if (_0x2eb69e && document.body.contains(_0x2eb69e)) return (_0x222ce7(), _0x2eb69e);
        const _0xd05b5d = document.querySelector('.v2-subject-submenu');
        if (_0xd05b5d) _0xd05b5d.remove();
        ((_0x2eb69e = document.createElement('div')),
          (_0x2eb69e.className = 'v2-subject-submenu node-toolbar-action-submenu'),
          _0x2870d8.classList.add('is-open'),
          Object.assign(_0x2eb69e.style, { position: 'fixed', opacity: '0', pointerEvents: 'none' }));
        const _0x2bef8a = () => {
          if (!_0x2eb69e || !document.body.contains(_0x2eb69e) || !document.body.contains(_0x2870d8)) {
            if (_0x1ec2fa) cancelAnimationFrame(_0x1ec2fa);
            _0x1ec2fa = 0;
            return;
          }
          const _0x5782be = _0x2870d8.getBoundingClientRect();
          if (_0x5782be.width <= 0 || _0x5782be.height <= 0) {
            _0x1ec2fa = requestAnimationFrame(_0x2bef8a);
            return;
          }
          const _0x293f36 = 12,
            _0x4535d5 = 8,
            _0x5c6f9d = _0x2eb69e.offsetWidth || 180,
            _0x4a0dd1 = _0x5782be.right + _0x293f36,
            _0x544305 = _0x5782be.left - _0x5c6f9d - _0x293f36,
            _0x208151 = window.innerWidth - _0x5c6f9d - _0x4535d5,
            _0x8107a6 = _0x4a0dd1 <= _0x208151 ? _0x4a0dd1 : Math.max(_0x4535d5, _0x544305);
          ((_0x2eb69e.style.left = _0x8107a6 + 'px'),
            (_0x2eb69e.style.top = _0x5782be.top + 'px'),
            (_0x2eb69e.style.transform = 'translate(0, 0)'),
            (_0x1ec2fa = requestAnimationFrame(_0x2bef8a)));
        };
        ((_0x1ec2fa = requestAnimationFrame(_0x2bef8a)),
          _0x2eb69e.addEventListener('pointerenter', (_0x1c12aa) => {
            if (_0x1c12aa.pointerType !== 'mouse') return;
            _0x5a4834();
          }),
          _0x2eb69e.addEventListener('pointerleave', (_0x4a9262) => {
            if (_0x4a9262.pointerType !== 'mouse') return;
            _0x5195ec();
          }));
        const _0x2ba058 = document.createElement('div');
        return (
          (_0x2ba058.className = 'node-toolbar-action-menu-title'),
          (_0x2ba058.textContent = autoSubjectText('chooseBackground')),
          _0x2eb69e.appendChild(_0x2ba058),
          _0x56c2d1.forEach((_0x56c667) => {
            const _0x59c3da = document.createElement('div');
            ((_0x59c3da.className =
              'v2-subject-bg-item node-toolbar-action-menu-item node-toolbar-action-submenu-item'),
              (_0x59c3da.dataset.bgKey = _0x56c667.key),
              (_0x59c3da.textContent = _0x45b6fb(_0x56c667.key)),
              _0x59c3da.addEventListener('click', (_0x4486cc) => {
                _0x4486cc.stopPropagation();
                const _0x4b4777 = { transparent: 0, white: 1, black: 2, gray: 3 },
                  _0x1fb404 = _0x4b4777[_0x56c667.key];
                if (_0x1fb404 === undefined) {
                  window.showToast?.(autoSubjectText('invalidBackground'), 'error');
                  return;
                }
                (_0x30c6e3(),
                  _0x16b6d4(),
                  (async () => {
                    const _0x2ed46c = _0x45b6fb(_0x56c667.key),
                      _0x100e88 = autoSubjectText('outputText', {
                        model: _0x3e5cbe(),
                        background: _0x2ed46c,
                      });
                    let _0x1a9e22 = null,
                      _0xdeabfd = '',
                      _0x144075 = '',
                      _0x28ef63 = '';
                    try {
                      const _0x3254fa = _0x3e8e27() || {},
                        _0x4b1c06 =
                          _0x3254fa?.localPath ||
                          (_0x3254fa?.images && _0x3254fa.images[_0x3254fa.mainImageIndex || 0]?.localPath),
                        _0x510990 = _0x1a78dc(_0x4b1c06) || _0x17048a(_0x3254fa);
                      if (!_0x510990) {
                        window.showToast?.(autoSubjectText('noProcessableImage'), 'error');
                        return;
                      }
                      await _0x5dc319();
                      const _0x3bbea4 = _0x1946fd('runninghubwf'),
                        _0x137356 = String(_0x3bbea4?.apiKey || '').trim();
                      if (!_0x137356) {
                        window.showToast?.(autoSubjectText('apiKeyMissing'), 'error');
                        return;
                      }
                      const _0xe30ff4 = _0x431765.getState().nodes[_0x488149] || _0x3254fa;
                      if (!_0xe30ff4) {
                        window.showToast?.(autoSubjectText('sourceNodeMissing'), 'error');
                        return;
                      }
                      const _0x25d2d1 = await _0x3427dd(_0xe30ff4, _0x510990),
                        { width: _0x28392f, height: _0x5271eb } = _0x4175ae(
                          _0x25d2d1.width,
                          _0x25d2d1.height,
                        ),
                        { x: _0x1d28e6, y: _0x2e47b6 } = _0x14c818(
                          _0x431765.getState().nodes,
                          _0xe30ff4,
                          _0x28392f,
                          _0x5271eb,
                        ),
                        _0x349c14 =
                          'source-image-subject-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                        _0x552aa = await _0x2fe358({
                          sourceNodeId: _0xe30ff4.id,
                          trigger: 'toolbar',
                          taskType: 'image-auto-subject',
                          provider: 'runninghubwf',
                          adapterType: 'workflow',
                          modelId: _0xbe6477,
                          executionId: 'runninghub.image-auto-subject',
                          payload: {
                            apiKey: _0x137356,
                            bgIndex: _0x1fb404,
                            imgUrl: _0x510990,
                            inputBasis: _0x25d2d1,
                            outputText: _0x100e88,
                          },
                          cancellable: true,
                          resumable: true,
                          onTaskChange: _0x232be8,
                          createTargetNode: ({
                            startedAt: _0x2a76ed,
                            startPatch: _0x3b7283,
                            protocolPatch: _0x26ef06,
                          }) =>
                            _0x1219eb({
                              id: _0x349c14,
                              type: 'source-image',
                              x: _0x1d28e6,
                              y: _0x2e47b6,
                              width: _0x28392f,
                              height: _0x5271eb,
                              needsAutoResize: false,
                              name: autoSubjectText('processingName'),
                              src: '',
                              outputText: _0x100e88,
                              localPath: '',
                              fileName: 'subject_' + Date.now() + '.png',
                              provider: 'runninghubwf',
                              model: _0xbe6477,
                              rhTaskUseOpenapiQuery: true,
                              ..._0x3b7283,
                              ..._0x26ef06,
                              generationStartTime: _0x2a76ed,
                              rhTaskStartedAt: _0x2a76ed,
                            }),
                          submit: async (_0x5110fc, _0x226e51) => {
                            _0x20c73a(_0xe30ff4.id, _0x226e51.targetNodeId);
                            const _0x1708ba = await _0x3c9dc2([_0x5110fc.imgUrl], _0x137356, {
                                applyInputQualityProfile: true,
                                provider: 'runninghub',
                              }),
                              _0x440d07 = String(_0x1708ba?.[0] || '').trim();
                            if (!_0x440d07) throw new Error(autoSubjectText('uploadFailed'));
                            _0x13bd59(_0x226e51.targetNodeId);
                            const _0x272b60 = await _0x2020cc(
                                {
                                  apiKey: _0x137356,
                                  appId: '2042329021530247170',
                                  nodeInfoList: [
                                    {
                                      nodeId: '5',
                                      fieldName: 'image',
                                      fieldValue: _0x440d07,
                                      description: '上传图片',
                                    },
                                    {
                                      nodeId: '7',
                                      fieldName: 'index',
                                      fieldValue: _0x1fb404,
                                      description: '背景颜色',
                                    },
                                  ],
                                  instanceType: 'default',
                                  usePersonalQueue: 'false',
                                },
                                { signal: _0x226e51.signal },
                              ),
                              _0x5c2fef = _0x5a3e2a(_0x272b60);
                            if (_0x5c2fef !== null && _0x5c2fef !== 0)
                              throw new Error(
                                String(
                                  _0x272b60?.msg || _0x272b60?.message || autoSubjectText('createTaskFailed'),
                                ),
                              );
                            const _0x39f5c1 = _0x264507(_0x272b60);
                            if (_0x39f5c1) _0x226e51.onTaskId(_0x39f5c1);
                            if (_0x5e121b(_0x226e51.targetNodeId)) {
                              await _0x4bbc1c({ apiKey: _0x137356, taskId: _0x39f5c1, label: 'AutoSubject' });
                              throw _0x29544f();
                            }
                            return _0x39f5c1
                              ? { taskId: _0x39f5c1 }
                              : { result: { resultUrl: _0x1e9cf8(_0x272b60) } };
                          },
                          poll: async ({ taskId: _0x424368, signal: _0x3aea16, targetNodeId: _0x119b77 }) => {
                            const _0x10466c = _0x424368
                                ? await _0x51f36f(
                                    { apiKey: _0x137356, taskId: _0x424368 },
                                    { signal: _0x3aea16, useOpenapiQuery: true, taskKind: 'image' },
                                  )
                                : null,
                              _0x2a643d = _0x1e9cf8(_0x10466c);
                            _0x13bd59(_0x119b77);
                            if (!_0x2a643d) throw new Error(autoSubjectText('missingResultImage'));
                            return { resultUrl: _0x2a643d };
                          },
                          cancel: ({ taskId: _0x46dc35 }) =>
                            _0x4bbc1c({ apiKey: _0x137356, taskId: _0x46dc35, label: 'AutoSubject' }),
                          resultBuilder: async (_0x52fd9d, _0x3e039e) => {
                            const _0x56a60d = String(_0x52fd9d?.resultUrl || '').trim();
                            if (!_0x56a60d) throw new Error(autoSubjectText('missingResultImage'));
                            _0xdeabfd = _0x56a60d;
                            let _0x58b4dd = _0x2d053e({
                              localPath: '',
                              resultUrl: _0x56a60d,
                              thumbUrl: _0x56a60d,
                            });
                            ((_0x144075 = _0x56a60d), (_0x28ef63 = ''));
                            try {
                              const _0x3ae4bc = await _0xc4dac(_0x56a60d, {
                                projectId: window.currentProjectId || 'default_v2_project',
                              });
                              ((_0x58b4dd = _0x3ae4bc.fields),
                                (_0x144075 = _0x3ae4bc.thumbUrl || _0x56a60d),
                                (_0x28ef63 = _0x3ae4bc.localPath || ''));
                            } catch (_0x17d9c0) {
                              console.warn('[AutoSubject] saveRemoteImageLocally failed:', _0x17d9c0);
                            }
                            _0x1a9e22 = await _0xcd059f(_0x25d2d1, {
                              localPath: _0x28ef63,
                              imageUrl: _0x56a60d,
                              sourceUrl: _0x56a60d,
                              thumbUrl: _0x144075,
                              src: _0x144075 || _0x56a60d,
                            });
                            if (!_0x28ef63) throw _0x1eb42e();
                            return (
                              _0x431765.updateNodeData(_0x488149, {
                                subjectDetectMode: _0x4bf08c,
                                subjectDetectBackground: _0x56c667.key,
                              }),
                              {
                                name: autoSubjectText('resultName'),
                                ..._0xf88a37(_0x58b4dd, { startedAt: _0x3e039e.startedAt }),
                                ..._0x58b4dd,
                                fileName: 'subject_' + Date.now() + '.png',
                                width: _0x1a9e22.width,
                                height: _0x1a9e22.height,
                                outputText: _0x100e88,
                              }
                            );
                          },
                          failureBuilder: async (_0x4ce013, _0x2b21a3) => {
                            const _0xb69653 =
                              _0x4ce013 instanceof Error
                                ? _0x4ce013.message
                                : String(_0x4ce013 || autoSubjectText('unknownError'));
                            if (_0x63f2bf(_0x4ce013))
                              return (
                                (_0x1a9e22 ||= await _0xcd059f(_0x25d2d1, {
                                  localPath: _0x28ef63,
                                  imageUrl: _0xdeabfd,
                                  sourceUrl: _0xdeabfd,
                                  thumbUrl: _0x144075,
                                  src: _0x144075 || _0xdeabfd,
                                })),
                                {
                                  name: autoSubjectText('resultName'),
                                  ..._0x2480dd(),
                                  fileName: 'subject_' + Date.now() + '.png',
                                  width: _0x1a9e22.width,
                                  height: _0x1a9e22.height,
                                  outputText: _0x100e88,
                                  ..._0x9e53ce({ error: _0x5ce985, startedAt: _0x2b21a3.startedAt }),
                                  rhStatusMessage: _0x5ce985,
                                }
                              );
                            return {
                              name: autoSubjectText('failedName'),
                              ..._0x9e53ce({ error: _0xb69653, startedAt: _0x2b21a3.startedAt }),
                              outputText: autoSubjectText('outputTextWithError', {
                                outputText: _0x100e88,
                                error: _0xb69653,
                              }),
                            };
                          },
                          cancelledBuilder: () => ({
                            name: autoSubjectText('cancelledName'),
                            outputText: autoSubjectText('cancelledOutput', { model: _0x3e5cbe() }),
                          }),
                        });
                      _0x2c0b60();
                      if (_0x552aa.status === 'success')
                        window.showToast?.(
                          autoSubjectText('completed', { background: _0x2ed46c }),
                          'success',
                        );
                      else {
                        if (_0x552aa.status === 'failed') {
                          if (_0x63f2bf(_0x552aa.error)) window.showToast?.('⚠️ ' + _0x5ce985, 'warn');
                          else {
                            const _0x1ae872 =
                              _0x552aa.error instanceof Error
                                ? _0x552aa.error.message
                                : String(_0x552aa.error || autoSubjectText('unknownError'));
                            window.showToast?.(
                              autoSubjectText('failedWithError', { error: _0x1ae872 }),
                              'error',
                            );
                          }
                        } else
                          _0x552aa.status === 'cancelled' &&
                            window.showToast?.(autoSubjectText('cancelledToast'), 'info');
                      }
                    } catch (_0x517b16) {
                      const _0x886a8d =
                        _0x517b16 instanceof Error
                          ? _0x517b16.message
                          : String(_0x517b16 || autoSubjectText('unknownError'));
                      if (_0x43a975(_0x517b16)) {
                        window.showToast?.(autoSubjectText('cancelledToast'), 'info');
                        return;
                      }
                      window.showToast?.(autoSubjectText('failedWithError', { error: _0x886a8d }), 'error');
                    }
                  })());
              }),
              _0x2eb69e.appendChild(_0x59c3da));
          }),
          document.body.appendChild(_0x2eb69e),
          _0x222ce7(),
          _0x2eb69e.offsetHeight,
          (_0x2eb69e.style.opacity = '1'),
          (_0x2eb69e.style.pointerEvents = 'auto'),
          (_0x503c22 = (_0x50e7a9) => {
            if (!_0x2eb69e) return;
            !_0x2eb69e.contains(_0x50e7a9.target) && !_0x2870d8.contains(_0x50e7a9.target) && _0x30c6e3();
          }),
          document.addEventListener('pointerdown', _0x503c22),
          _0x2eb69e
        );
      },
      _0x11cc3e = () => {
        if (_0x8c232f && document.body.contains(_0x8c232f)) return _0x8c232f;
        const _0x572ac3 = document.querySelector('.v2-hd-popup');
        if (_0x572ac3) {
          if (typeof _0x572ac3.__v2HdClose === 'function') _0x572ac3.__v2HdClose();
          else _0x572ac3.remove();
        }
        const _0x51ad40 = document.querySelector('.v2-subject-popup');
        if (_0x51ad40) {
          if (typeof _0x51ad40.__v2SubjectClose === 'function') _0x51ad40.__v2SubjectClose();
          else _0x51ad40.remove();
        }
        ((_0x8c232f = document.createElement('div')),
          (_0x8c232f.className = 'v2-subject-popup node-toolbar-action-menu'));
        const _0x2408a2 = createToolbarActionPopupAnchorPositionGetter(_0x428891),
          _0x37b9b9 = _0x2408a2();
        Object.assign(_0x8c232f.style, {
          position: 'fixed',
          left: _0x37b9b9.left + 'px',
          top: _0x37b9b9.top + 'px',
          transform: 'translate(-50%, calc(-100% + 10px))',
          opacity: '0',
          pointerEvents: 'none',
        });
        const _0x2f8e7d = document.createElement('div');
        ((_0x2f8e7d.className = 'node-toolbar-action-menu-title'),
          (_0x2f8e7d.textContent = autoSubjectText('chooseMode')),
          _0x8c232f.appendChild(_0x2f8e7d),
          (_0x51de5e = document.createElement('div')),
          (_0x51de5e.className = 'node-toolbar-action-menu-item'));
        const _0xcf5a95 = document.createElement('div');
        _0xcf5a95.className = 'node-toolbar-action-menu-icon';
        const _0x1b2cdf = document.createElement('img');
        ((_0x1b2cdf.className = 'node-toolbar-action-provider-logo'),
          (_0x1b2cdf.src = 'images/RH.png'),
          (_0x1b2cdf.alt = 'runninghub'),
          _0xcf5a95.appendChild(_0x1b2cdf),
          _0x51de5e.appendChild(_0xcf5a95));
        const _0x425f6c = document.createElement('div');
        _0x425f6c.className = 'node-toolbar-action-menu-body';
        const _0x47ec71 = document.createElement('span');
        ((_0x47ec71.className = 'node-toolbar-action-menu-item-title'),
          (_0x47ec71.textContent = _0x3e5cbe()),
          _0x425f6c.appendChild(_0x47ec71));
        const _0x4f539a = document.createElement('span');
        ((_0x4f539a.className = 'node-toolbar-action-menu-item-desc'),
          (_0x4f539a.textContent = autoSubjectText('modeDesc')),
          _0x425f6c.appendChild(_0x4f539a),
          _0x51de5e.appendChild(_0x425f6c));
        const _0x100714 = document.createElement('div');
        ((_0x100714.className = 'node-toolbar-action-caret'),
          (_0x100714.innerHTML = '&gt;'),
          _0x51de5e.appendChild(_0x100714),
          (_0x51de5e.__v2LastPointerType = 'mouse'),
          (_0x51de5e.__v2SubjectSubOpen = false),
          _0x51de5e.addEventListener('pointerdown', (_0x273fd1) => {
            _0x51de5e.__v2LastPointerType = _0x273fd1.pointerType || 'mouse';
          }),
          _0x51de5e.addEventListener('click', (_0x2b1307) => {
            _0x2b1307.stopPropagation();
            if (_0x51de5e.__v2LastPointerType === 'touch') {
              _0x2eb69e && document.body.contains(_0x2eb69e)
                ? _0x30c6e3()
                : (_0x4b555d(_0x51de5e), (_0x51de5e.__v2SubjectSubOpen = true));
              return;
            }
            (_0x4b555d(_0x51de5e), (_0x51de5e.__v2SubjectSubOpen = true));
          }),
          _0x51de5e.addEventListener('pointerenter', (_0x134ecc) => {
            if (_0x134ecc.pointerType !== 'mouse') return;
            (_0x5a4834(), _0x4b555d(_0x51de5e), (_0x51de5e.__v2SubjectSubOpen = true));
          }),
          _0x51de5e.addEventListener('pointerleave', (_0x52316b) => {
            if (_0x52316b.pointerType !== 'mouse') return;
            _0x5195ec();
          }),
          _0x8c232f.appendChild(_0x51de5e),
          document.body.appendChild(_0x8c232f),
          _0x8c232f.offsetHeight,
          (_0x8c232f.style.pointerEvents = 'auto'),
          (_0x8c232f.style.opacity = '1'),
          (_0x8c232f.style.transform = 'translate(-50%, -100%)'),
          (_0x8c232f.__v2SubjectClose = _0x16b6d4));
        const _0x383d30 = () => {
          if (!document.body.contains(_0x8c232f) || !document.body.contains(_0x428891)) {
            if (_0x428568) cancelAnimationFrame(_0x428568);
            _0x428568 = 0;
            return;
          }
          if (!_0x2408a2.hasVisibleAnchor()) {
            _0x428568 = requestAnimationFrame(_0x383d30);
            return;
          }
          const _0x57d7c7 = _0x2408a2();
          ((_0x8c232f.style.left = _0x57d7c7.left + 'px'),
            (_0x8c232f.style.top = _0x57d7c7.top + 'px'),
            (_0x428568 = requestAnimationFrame(_0x383d30)));
        };
        return (
          (_0x428568 = requestAnimationFrame(_0x383d30)),
          (_0x5a14a3 = (_0x285e9b) => {
            if (!_0x8c232f) return;
            const _0x1314b5 = _0x8c232f.contains(_0x285e9b.target),
              _0x54c727 = _0x2eb69e && _0x2eb69e.contains(_0x285e9b.target);
            !_0x1314b5 && !_0x54c727 && _0x285e9b.target !== _0x428891 && _0x16b6d4();
          }),
          (_0x5e37e6 = (_0x361e00) => {
            if (!_0x8c232f) return;
            const _0x2359a6 = _0x361e00.target?.closest?.('.ftb-btn');
            if (!_0x2359a6) return;
            if (_0x2359a6.classList.contains('act-auto-subject')) return;
            _0x16b6d4();
          }),
          setTimeout(() => {
            _0x5a14a3 && document.addEventListener('pointerdown', _0x5a14a3);
          }, 10),
          _0x5e37e6 && _0x506bdc.addEventListener('pointerdown', _0x5e37e6, true),
          _0x8c232f
        );
      };
    _0x428891.addEventListener('click', (_0x5461c3) => {
      (_0x5461c3.stopPropagation(), _0x5461c3.preventDefault());
      if (_0x8c232f && document.body.contains(_0x8c232f)) {
        _0x16b6d4();
        return;
      }
      _0x11cc3e();
    });
  }
}
