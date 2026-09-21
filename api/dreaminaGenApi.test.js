import test from 'node:test';
import assert from 'node:assert/strict';
const originalFetch = globalThis.fetch;
function jsonResponse(_0x3e185d) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => _0x3e185d,
    text: async () => JSON.stringify(_0x3e185d),
  };
}
(test('dreaminaGenApi: submit text2image', async () => {
  try {
    globalThis.fetch = async (_0x238b66, _0x352b1e = {}) => {
      (assert.equal(String(_0x238b66), '/api/v2/dreamina/text2image'),
        assert.equal(String(_0x352b1e.method || 'GET'), 'POST'));
      const _0x2e5977 = JSON.parse(String(_0x352b1e.body || '{}'));
      return (
        assert.equal(_0x2e5977.prompt, 'cat'),
        jsonResponse({ success: true, submitId: 'sid1', genStatus: 'querying' })
      );
    };
    const { submitDreaminaText2Image: _0xe7c518 } = await import('./dreaminaGenApi.js'),
      _0x34c66a = await _0xe7c518({ prompt: 'cat' });
    assert.equal(_0x34c66a.submitId, 'sid1');
  } finally {
    globalThis.fetch = originalFetch;
  }
}),
  test('dreaminaGenApi: query_result url includes submitId', async () => {
    try {
      globalThis.fetch = async (_0x428d1f, _0x25e8dc = {}) => {
        return (
          assert.match(String(_0x428d1f), /\/api\/v2\/dreamina\/query_result\?submitId=sid2&autoDownload=1$/),
          assert.equal(String(_0x25e8dc.method || 'GET'), 'GET'),
          jsonResponse({ success: true, submitId: 'sid2', status: 'pending', outputs: [] })
        );
      };
      const { queryDreaminaResult: _0x235a04 } = await import('./dreaminaGenApi.js'),
        _0x4c0823 = await _0x235a04('sid2', { autoDownload: true });
      assert.equal(_0x4c0823.status, 'pending');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: normalizeDreaminaErrorMessage explains CLI request timeout', async () => {
    const { normalizeDreaminaErrorMessage: _0x5087a } = await import('./dreaminaGenApi.js'),
      _0x13545d =
        'do request: Post "https://jimeng.jianying.com/dreamina/cli/v1/image_generate?cli_version=fa7ede2&from=dreamina_cli": context deadline exceeded (Client.Timeout exceeded while awaiting headers)';
    assert.equal(
      _0x5087a(_0x13545d),
      '即梦官方生成接口响应超时，本次没有拿到任务ID。网页可用不代表 CLI 生成接口稳定，请稍后重试；如果连续出现，请切换网络/代理或重新登录即梦后再试。',
    );
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot pending + waiting => queued', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x19ad08 } = await import('./dreaminaGenApi.js'),
      _0x4632c4 = _0x19ad08({
        submitId: 'sid-q1',
        status: 'pending',
        outputs: [],
        raw: { queue_status: 'waiting', queue_idx: 3, queue_length: 12 },
      });
    (assert.equal(_0x4632c4.status, 'pending'),
      assert.equal(_0x4632c4.phase, 'queued'),
      assert.equal(_0x4632c4.label, '排队中'),
      assert.equal(_0x4632c4.queueIndex, 3),
      assert.equal(_0x4632c4.queueLength, 12));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot success + empty outputs => syncing', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x1617e8 } = await import('./dreaminaGenApi.js'),
      _0x4a98b2 = _0x1617e8({
        submitId: 'sid-s1',
        status: 'success',
        outputs: [],
        raw: { queue_status: 'Finish' },
      });
    (assert.equal(_0x4a98b2.status, 'pending'),
      assert.equal(_0x4a98b2.phase, 'syncing'),
      assert.equal(_0x4a98b2.label, '正在同步结果'),
      assert.equal(_0x4a98b2.hasOutputs, false));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot success + outputs => done', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x2ebf29 } = await import('./dreaminaGenApi.js'),
      _0x330829 = _0x2ebf29({
        submitId: 'sid-s2',
        status: 'success',
        outputs: [{ localPath: 'output/dreamina/text2video/c.mp4' }],
      });
    (assert.equal(_0x330829.status, 'success'),
      assert.equal(_0x330829.phase, 'done'),
      assert.equal(_0x330829.label, '已完成'),
      assert.equal(_0x330829.hasOutputs, true));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes nested Dreamina image outputs', async () => {
    const { normalizeDreaminaTaskSnapshot: _0xe264ec } = await import('./dreaminaGenApi.js'),
      _0x1e214a = _0xe264ec({
        submitId: 'sid-nested-output',
        status: 'success',
        outputs: [],
        raw: {
          queryResult: {
            gen_status: 'success',
            data: { image_list: [{ image_url: 'https://example.com/dreamina-result.png' }] },
          },
        },
      });
    (assert.equal(_0x1e214a.status, 'success'),
      assert.equal(_0x1e214a.phase, 'done'),
      assert.equal(_0x1e214a.hasOutputs, true),
      assert.equal(_0x1e214a.outputs[0].url, 'https://example.com/dreamina-result.png'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot raw fail overrides success empty outputs', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x4e2b86 } = await import('./dreaminaGenApi.js'),
      _0x14bb56 = _0x4e2b86({
        submitId: 'sid-raw-fail',
        status: 'success',
        outputs: [],
        raw: {
          queryResult: {
            gen_status: 'fail',
            fail_reason: 'generation failed: final generation failed',
            queue_info: { queue_status: 'Finish' },
          },
        },
      });
    (assert.equal(_0x14bb56.status, 'failed'),
      assert.equal(_0x14bb56.phase, 'failed'),
      assert.equal(_0x14bb56.failReason, 'generation failed: final generation failed'),
      assert.equal(_0x14bb56.label, 'generation failed: final generation failed'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes top-level fail aliases', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x449336 } = await import('./dreaminaGenApi.js'),
      _0x1d3e4f = _0x449336({
        submitId: 'sid-top-fail',
        status: 'fail',
        outputs: [],
        message: '内容安全审核未通过',
      });
    (assert.equal(_0x1d3e4f.status, 'failed'),
      assert.equal(_0x1d3e4f.phase, 'failed'),
      assert.equal(_0x1d3e4f.failReason, '内容安全审核未通过'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot treats terminal raw message as failed', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x1481b6 } = await import('./dreaminaGenApi.js'),
      _0x1f48da = _0x1481b6({
        submitId: 'sid-raw-message-fail',
        status: 'pending',
        outputs: [],
        raw: { queryResult: { gen_status: 'querying', message: '平台返回：不符合平台规则，不予生成' } },
      });
    (assert.equal(_0x1f48da.status, 'failed'),
      assert.equal(_0x1f48da.phase, 'failed'),
      assert.equal(_0x1f48da.failReason, '平台返回：不符合平台规则，不予生成'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes nested raw data failure', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x1bd810 } = await import('./dreaminaGenApi.js'),
      _0x2418fe = _0x1bd810({
        submitId: 'sid-nested-raw-fail',
        status: 'success',
        outputs: [],
        raw: {
          data: { gen_status: 'failed', message: 'generation failed: final generation failed' },
        },
      });
    (assert.equal(_0x2418fe.status, 'failed'),
      assert.equal(_0x2418fe.phase, 'failed'),
      assert.equal(_0x2418fe.failReason, 'generation failed: final generation failed'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes raw listTask array failure', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x2141fb } = await import('./dreaminaGenApi.js'),
      _0x35cb35 = _0x2141fb({
        submitId: 'sid-list-task-array-fail',
        status: 'success',
        outputs: [],
        raw: {
          listTask: [
            {
              submit_id: 'sid-list-task-array-fail',
              gen_status: 'fail',
              fail_reason: 'generation failed: final generation failed',
            },
          ],
        },
      });
    (assert.equal(_0x35cb35.status, 'failed'),
      assert.equal(_0x35cb35.phase, 'failed'),
      assert.equal(_0x35cb35.failReason, 'generation failed: final generation failed'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot keeps non-terminal message pending', async () => {
    const { normalizeDreaminaTaskSnapshot: _0x10f0e6 } = await import('./dreaminaGenApi.js'),
      _0x570f30 = _0x10f0e6({
        submitId: 'sid-raw-message-pending',
        status: 'pending',
        outputs: [],
        raw: { queryResult: { gen_status: 'querying', message: '任务排队中' } },
      });
    (assert.equal(_0x570f30.status, 'pending'),
      assert.equal(_0x570f30.phase, 'generating'),
      assert.equal(_0x570f30.failReason, ''));
  }),
  test('dreaminaGenApi: image generation raw fail throws fail_reason', async () => {
    try {
      globalThis.fetch = async (_0x2d1467, _0x1d36df = {}) => {
        const _0x5a5e28 = String(_0x2d1467);
        if (_0x5a5e28 === '/api/v2/dreamina/text2image')
          return (
            assert.equal(String(_0x1d36df.method || 'GET'), 'POST'),
            jsonResponse({ success: true, submitId: 'sid-image-raw-fail' })
          );
        if (
          _0x5a5e28.startsWith('/api/v2/dreamina/query_result?') &&
          _0x5a5e28.includes('submitId=sid-image-raw-fail')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-image-raw-fail',
            status: 'success',
            outputs: [],
            raw: {
              queryResult: {
                gen_status: 'fail',
                fail_reason: 'generation failed: final generation failed',
                queue_info: { queue_status: 'Finish' },
              },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x5a5e28);
      };
      const { runDreaminaImageGeneration: _0x142866 } = await import('./dreaminaGenApi.js');
      await assert.rejects(
        () => _0x142866({ prompt: 'blocked', model: 'dreamina/4.1' }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: image generation nested raw data failure throws message', async () => {
    try {
      globalThis.fetch = async (_0x228dfe, _0x544ea9 = {}) => {
        const _0x36600f = String(_0x228dfe);
        if (_0x36600f === '/api/v2/dreamina/text2image')
          return (
            assert.equal(String(_0x544ea9.method || 'GET'), 'POST'),
            jsonResponse({ success: true, submitId: 'sid-image-nested-fail' })
          );
        if (
          _0x36600f.startsWith('/api/v2/dreamina/query_result?') &&
          _0x36600f.includes('submitId=sid-image-nested-fail')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-image-nested-fail',
            status: 'success',
            outputs: [],
            raw: { data: { status: 'failed', message: 'generation failed: final generation failed' } },
          });
        throw new Error('unexpected fetch url: ' + _0x36600f);
      };
      const { runDreaminaImageGeneration: _0x1ca6cd } = await import('./dreaminaGenApi.js');
      await assert.rejects(
        () => _0x1ca6cd({ prompt: 'blocked', model: 'dreamina/4.1' }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: video generation raw fail throws fail_reason', async () => {
    try {
      globalThis.fetch = async (_0x3f8786, _0x14c9fc = {}) => {
        const _0x284f27 = String(_0x3f8786);
        if (_0x284f27 === '/api/v2/dreamina/text2video')
          return (
            assert.equal(String(_0x14c9fc.method || 'GET'), 'POST'),
            jsonResponse({ success: true, submitId: 'sid-video-raw-fail' })
          );
        if (
          _0x284f27.startsWith('/api/v2/dreamina/query_result?') &&
          _0x284f27.includes('submitId=sid-video-raw-fail')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-video-raw-fail',
            status: 'success',
            outputs: [],
            raw: {
              queryResult: {
                gen_status: 'fail',
                fail_reason: 'generation failed: final generation failed',
                queue_info: { queue_status: 'Finish' },
              },
            },
          });
        throw new Error('unexpected fetch url: ' + _0x284f27);
      };
      const { runDreaminaVideoGeneration: _0x319d32 } = await import('./dreaminaGenApi.js');
      await assert.rejects(
        () =>
          _0x319d32({
            prompt: 'blocked',
            model: 'dreamina/seedance2.0fast',
            provider: 'dreamina',
            dreaminaTaskType: 'text2video',
          }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: image2image + 自适应不会提交 ratio', async () => {
    try {
      globalThis.fetch = async (_0xad1b19, _0x51b2e3 = {}) => {
        const _0x19b8e8 = String(_0xad1b19);
        if (_0x19b8e8 === '/api/v2/dreamina/image2image') {
          const _0x1e612d = JSON.parse(String(_0x51b2e3.body || '{}'));
          return (
            assert.equal(_0x1e612d.prompt, 'edit'),
            assert.deepEqual(_0x1e612d.images, ['/data/uploads/demo.png']),
            assert.ok(!Object.prototype.hasOwnProperty.call(_0x1e612d, 'ratio')),
            assert.equal(_0x1e612d.resolutionType, '4k'),
            assert.equal(_0x1e612d.modelVersion, '5.0'),
            jsonResponse({ success: true, submitId: 'sid-run-1', genStatus: 'querying' })
          );
        }
        if (
          _0x19b8e8.startsWith('/api/v2/dreamina/query_result?') &&
          _0x19b8e8.includes('submitId=sid-run-1')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-run-1',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/text2image/a.png' }],
          });
        throw new Error('unexpected fetch url: ' + _0x19b8e8);
      };
      const { runDreaminaImageGeneration: _0x438a1a } = await import('./dreaminaGenApi.js'),
        _0x425519 = await _0x438a1a({
          prompt: 'edit',
          aspectRatio: '自适应',
          imageSize: '4K',
          model: 'dreamina/5.0',
          inputUrls: ['/data/uploads/demo.png'],
        });
      (assert.equal(Array.isArray(_0x425519), true),
        assert.equal(_0x425519.length, 1),
        assert.equal(_0x425519[0].localPath, 'output/dreamina/text2image/a.png'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: text2image + 自适应会提交 1:1', async () => {
    try {
      globalThis.fetch = async (_0x29358f, _0x4795fa = {}) => {
        const _0x446ace = String(_0x29358f);
        if (_0x446ace === '/api/v2/dreamina/text2image') {
          const _0x343cbe = JSON.parse(String(_0x4795fa.body || '{}'));
          return (
            assert.equal(_0x343cbe.prompt, 'cat'),
            assert.equal(_0x343cbe.ratio, '1:1'),
            assert.equal(_0x343cbe.modelVersion, '4.1'),
            jsonResponse({ success: true, submitId: 'sid-run-2', genStatus: 'querying' })
          );
        }
        if (
          _0x446ace.startsWith('/api/v2/dreamina/query_result?') &&
          _0x446ace.includes('submitId=sid-run-2')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-run-2',
            status: 'success',
            outputs: [{ url: 'https://example.com/a.png' }],
          });
        throw new Error('unexpected fetch url: ' + _0x446ace);
      };
      const { runDreaminaImageGeneration: _0x5daf88 } = await import('./dreaminaGenApi.js'),
        _0x1e9d16 = await _0x5daf88({
          prompt: 'cat',
          aspectRatio: '自适应',
          model: 'dreamina/4.1',
          inputUrls: [],
        });
      (assert.equal(Array.isArray(_0x1e9d16), true),
        assert.equal(_0x1e9d16.length, 1),
        assert.equal(_0x1e9d16[0].sourceUrl, 'https://example.com/a.png'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: buildDreaminaVideoSubmitRequest 在首尾帧模式下路由到 frames2video', async () => {
    const { buildDreaminaVideoSubmitRequest: _0x12803f } = await import('./dreaminaGenApi.js'),
      _0x5cdb3a = _0x12803f({
        prompt: 'season changes',
        dreaminaRouteMode: 'frames2video',
        model: 'dreamina/3.5pro',
        inputUrls: ['/a.png', '/b.png'],
        duration: 6,
        resolution: '1080p',
      });
    (assert.equal(_0x5cdb3a.taskType, 'frames2video'),
      assert.equal(_0x5cdb3a.url, '/api/v2/dreamina/frames2video'),
      assert.equal(_0x5cdb3a.body.first, '/a.png'),
      assert.equal(_0x5cdb3a.body.last, '/b.png'),
      assert.equal(_0x5cdb3a.body.modelVersion, '3.5pro'),
      assert.equal(_0x5cdb3a.body.videoResolution, '1080p'));
  }),
  test('dreaminaGenApi: 首尾帧单图回退 image2video 时保留 3.0 模型', async () => {
    const { buildDreaminaVideoSubmitRequest: _0x5bdccd } = await import('./dreaminaGenApi.js'),
      _0x57300e = _0x5bdccd({
        prompt: 'camera push in',
        dreaminaRouteMode: 'frames2video',
        model: 'dreamina/3.0',
        inputUrls: ['/a.png'],
        duration: 5,
        resolution: '720p',
      });
    (assert.equal(_0x57300e.taskType, 'image2video'),
      assert.equal(_0x57300e.url, '/api/v2/dreamina/image2video'),
      assert.equal(_0x57300e.body.image, '/a.png'),
      assert.equal(_0x57300e.body.modelVersion, '3.0'),
      assert.equal(_0x57300e.body.videoResolution, '720p'));
  }),
  test('dreaminaGenApi: 首尾帧单图回退 image2video 时保留 seedance 模型', async () => {
    const { buildDreaminaVideoSubmitRequest: _0x3a4eac } = await import('./dreaminaGenApi.js'),
      _0x30502e = _0x3a4eac({
        prompt: 'camera push in',
        dreaminaRouteMode: 'frames2video',
        model: 'dreamina/seedance2.0fast',
        inputUrls: ['/a.png'],
        duration: 5,
        resolution: '720p',
      });
    (assert.equal(_0x30502e.taskType, 'image2video'),
      assert.equal(_0x30502e.url, '/api/v2/dreamina/image2video'),
      assert.equal(_0x30502e.body.image, '/a.png'),
      assert.equal(_0x30502e.body.modelVersion, 'seedance2.0fast'),
      assert.equal(_0x30502e.body.videoResolution, '720p'));
  }),
  test('dreaminaGenApi: Seedance 2.0 VIP 支持 1080p 视频分辨率', async () => {
    const { buildDreaminaVideoSubmitRequest: _0xa55d69 } = await import('./dreaminaGenApi.js'),
      _0x4a5371 = _0xa55d69({
        prompt: 'cinematic city sunrise',
        dreaminaRouteMode: 'multimodal2video',
        model: 'dreamina/seedance2.0_vip',
        inputUrls: ['/cover.png'],
        duration: 5,
        resolution: '1080p',
      });
    (assert.equal(_0x4a5371.taskType, 'multimodal2video'),
      assert.equal(_0x4a5371.url, '/api/v2/dreamina/multimodal2video'),
      assert.equal(_0x4a5371.body.modelVersion, 'seedance2.0_vip'),
      assert.equal(_0x4a5371.body.videoResolution, '1080p'));
  }),
  test('dreaminaGenApi: buildDreaminaVideoSubmitRequest 全能参考无参考时回退 text2video', async () => {
    const { buildDreaminaVideoSubmitRequest: _0x4130f9 } = await import('./dreaminaGenApi.js'),
      _0x625418 = _0x4130f9({
        dreaminaRouteMode: 'multimodal2video',
        prompt: 'a boy rides a skateboard in the park',
      });
    (assert.equal(_0x625418.taskType, 'text2video'),
      assert.equal(_0x625418.url, '/api/v2/dreamina/text2video'),
      assert.equal(_0x625418.body.modelVersion, 'seedance2.0fast'));
  }),
  test('dreaminaGenApi: buildDreaminaVideoSubmitRequest 全能参考音频单独使用会报错', async () => {
    const { buildDreaminaVideoSubmitRequest: _0x406da4 } = await import('./dreaminaGenApi.js');
    assert.throws(
      () => _0x406da4({ dreaminaRouteMode: 'multimodal2video', audios: ['/music.mp3'] }),
      /音频不能单独使用/,
    );
  }),
  test('dreaminaGenApi: 即梦视频上传时长错误会转成中文', async () => {
    const { normalizeDreaminaErrorMessage: _0x482655 } = await import('./dreaminaGenApi.js'),
      _0x44d054 = _0x482655(
        'upload resource "C:\\Users\\HASEE\\Desktop\\2.14\\data\\uploads\\dreamina_video_0004 (1).mp4": upload video: duration 15.070 seconds is out of allowed range [2, 15]',
      );
    assert.equal(
      _0x44d054,
      '上传源视频失败：“dreamina_video_0004 (1).mp4”时长 15.070 秒，超出即梦允许范围（2-15 秒）。请将视频裁剪到 15 秒以内，建议裁到 14.9 秒后再上传。',
    );
  }),
  test('dreaminaGenApi: 即梦视频上传时长错误支持不同秒数和无文件路径格式', async () => {
    const { normalizeDreaminaErrorMessage: _0x14c31b } = await import('./dreaminaGenApi.js'),
      _0x51457a = _0x14c31b('upload video: duration 15.4 seconds is out of allowed range [2, 15]');
    assert.equal(
      _0x51457a,
      '上传源视频失败：源视频时长 15.4 秒，超出即梦允许范围（2-15 秒）。请将视频裁剪到 15 秒以内，建议裁到 14.9 秒后再上传。',
    );
  }),
  test('dreaminaGenApi: 即梦音频上传时长错误会转成中文', async () => {
    const { normalizeDreaminaErrorMessage: _0x30c56a } = await import('./dreaminaGenApi.js'),
      _0x13a563 = _0x30c56a(
        'upload resource "H:\\AI\\Al_Canvas_code\\data\\uploads\\恋人.mp3": upload audio: duration 77.832 seconds is out of allowed range [2, 15]',
      );
    assert.equal(
      _0x13a563,
      '上传源音频失败：“恋人.mp3”时长 77.832 秒，超出即梦允许范围（2-15 秒）。请将音频裁剪到 15 秒以内后再上传。',
    );
  }),
  test('dreaminaGenApi: runDreaminaVideoGeneration 提交 multimodal2video', async () => {
    try {
      globalThis.fetch = async (_0x4ad94a, _0x33ae87 = {}) => {
        const _0x285cf4 = String(_0x4ad94a);
        if (_0x285cf4 === '/api/v2/dreamina/multimodal2video') {
          const _0x4511db = JSON.parse(String(_0x33ae87.body || '{}'));
          return (
            assert.deepEqual(_0x4511db.images, ['/cover.png']),
            assert.deepEqual(_0x4511db.videos, ['/ref.mp4']),
            assert.deepEqual(_0x4511db.audios, ['/music.mp3']),
            assert.equal(_0x4511db.modelVersion, 'seedance2.0fast'),
            assert.equal(_0x4511db.videoResolution, '720p'),
            jsonResponse({ success: true, submitId: 'sid-video-1' })
          );
        }
        if (
          _0x285cf4.startsWith('/api/v2/dreamina/query_result?') &&
          _0x285cf4.includes('submitId=sid-video-1')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-video-1',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/multimodal2video/a.mp4' }],
          });
        throw new Error('unexpected fetch url: ' + _0x285cf4);
      };
      const { runDreaminaVideoGeneration: _0x42ccb9 } = await import('./dreaminaGenApi.js'),
        _0x503228 = await _0x42ccb9({
          model: 'dreamina/seedance2.0fast',
          images: ['/cover.png'],
          videos: ['/ref.mp4'],
          audios: ['/music.mp3'],
          aspectRatio: '16:9',
          duration: 5,
        });
      (assert.equal(_0x503228.videoUrl, '/output/dreamina/multimodal2video/a.mp4'),
        assert.equal(_0x503228.localPath, 'output/dreamina/multimodal2video/a.mp4'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: runDreaminaVideoGeneration 首次 success 无 outputs 时会继续轮询', async () => {
    try {
      let _0x5c984d = 0;
      globalThis.fetch = async (_0x554b55, _0x26d0ce = {}) => {
        const _0x5bcb53 = String(_0x554b55);
        if (_0x5bcb53 === '/api/v2/dreamina/text2video') {
          const _0x4881bf = JSON.parse(String(_0x26d0ce.body || '{}'));
          return (
            assert.equal(_0x4881bf.prompt, 'two people talking'),
            assert.equal(_0x4881bf.modelVersion, 'seedance2.0fast'),
            jsonResponse({ success: true, submitId: 'sid-video-2' })
          );
        }
        if (
          _0x5bcb53.startsWith('/api/v2/dreamina/query_result?') &&
          _0x5bcb53.includes('submitId=sid-video-2')
        ) {
          _0x5c984d += 1;
          if (_0x5c984d === 1)
            return jsonResponse({ success: true, submitId: 'sid-video-2', status: 'success', outputs: [] });
          return jsonResponse({
            success: true,
            submitId: 'sid-video-2',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/text2video/b.mp4' }],
          });
        }
        throw new Error('unexpected fetch url: ' + _0x5bcb53);
      };
      const { runDreaminaVideoGeneration: _0x17d43e } = await import('./dreaminaGenApi.js'),
        _0x4f25a = await _0x17d43e({
          model: 'dreamina/seedance2.0fast',
          prompt: 'two people talking',
          aspectRatio: '16:9',
          duration: 4,
        });
      (assert.equal(_0x5c984d, 2),
        assert.equal(_0x4f25a.videoUrl, '/output/dreamina/text2video/b.mp4'),
        assert.equal(_0x4f25a.localPath, 'output/dreamina/text2video/b.mp4'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: pollDreaminaUntilDone 会持续回调 onProgress', async () => {
    try {
      const _0x29f5d4 = [];
      globalThis.fetch = async (_0x4b4a68) => {
        const _0x400487 = String(_0x4b4a68);
        if (
          _0x400487.startsWith('/api/v2/dreamina/query_result?') &&
          _0x400487.includes('submitId=sid-progress-1')
        ) {
          if (_0x29f5d4.length === 0)
            return jsonResponse({
              success: true,
              submitId: 'sid-progress-1',
              status: 'pending',
              outputs: [],
              raw: { queue_status: 'waiting', queue_idx: 2, queue_length: 9 },
            });
          return jsonResponse({
            success: true,
            submitId: 'sid-progress-1',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/text2video/d.mp4' }],
          });
        }
        throw new Error('unexpected fetch url: ' + _0x400487);
      };
      const { pollDreaminaUntilDone: _0x4a0b1 } = await import('./dreaminaGenApi.js'),
        _0x26863a = await _0x4a0b1('sid-progress-1', {
          intervalMs: 1,
          onProgress: (_0x27bcd0) => {
            _0x29f5d4.push(_0x27bcd0.phase + ':' + _0x27bcd0.label);
          },
        });
      (assert.equal(_0x26863a.submitId, 'sid-progress-1'),
        assert.deepEqual(_0x29f5d4, ['queued:排队中', 'done:已完成']));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: pollDreaminaUntilDone 单次查询错误会直接失败', async () => {
    try {
      let _0x4a0875 = 0;
      globalThis.fetch = async (_0x896d98) => {
        const _0x5d18a8 = String(_0x896d98);
        if (
          _0x5d18a8.startsWith('/api/v2/dreamina/query_result?') &&
          _0x5d18a8.includes('submitId=sid-transient-1')
        )
          return ((_0x4a0875 += 1), jsonResponse({ success: false, message: '查询超时，请稍后重试' }));
        throw new Error('unexpected fetch url: ' + _0x5d18a8);
      };
      const { pollDreaminaUntilDone: _0x5bfe77 } = await import('./dreaminaGenApi.js');
      (await assert.rejects(
        _0x5bfe77('sid-transient-1', { intervalMs: 1, maxWaitMs: 0x1388 }),
        /查询超时，请稍后重试/,
      ),
        assert.equal(_0x4a0875, 1));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: status failed + 超时原因会直接失败', async () => {
    try {
      let _0x5c39fa = 0;
      const _0x30a72c = [];
      globalThis.fetch = async (_0x43d095) => {
        const _0x4ce8f7 = String(_0x43d095);
        if (
          _0x4ce8f7.startsWith('/api/v2/dreamina/query_result?') &&
          _0x4ce8f7.includes('submitId=sid-transient-2')
        ) {
          _0x5c39fa += 1;
          if (_0x5c39fa === 1)
            return jsonResponse({
              success: true,
              submitId: 'sid-transient-2',
              status: 'failed',
              failReason: '即梦组件执行超时',
              outputs: [],
            });
          return jsonResponse({
            success: true,
            submitId: 'sid-transient-2',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/text2video/f.mp4' }],
          });
        }
        throw new Error('unexpected fetch url: ' + _0x4ce8f7);
      };
      const { pollDreaminaUntilDone: _0x5d3d4b } = await import('./dreaminaGenApi.js'),
        _0x481565 = await _0x5d3d4b('sid-transient-2', {
          intervalMs: 1,
          maxWaitMs: 0x1388,
          onProgress: (_0x1e7d90) => {
            _0x30a72c.push(_0x1e7d90.status + ':' + _0x1e7d90.phase);
          },
        });
      (assert.equal(_0x5c39fa, 1),
        assert.equal(_0x481565.submitId, 'sid-transient-2'),
        assert.equal(_0x481565.status, 'failed'),
        assert.equal(_0x481565.failReason, '即梦组件执行超时'),
        assert.deepEqual(_0x30a72c, ['failed:failed']));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: 查询返回错误会直接失败', async () => {
    try {
      let _0x167953 = 0;
      globalThis.fetch = async (_0x472b8e) => {
        const _0x19f650 = String(_0x472b8e);
        if (
          _0x19f650.startsWith('/api/v2/dreamina/query_result?') &&
          _0x19f650.includes('submitId=sid-transient-3')
        )
          return ((_0x167953 += 1), jsonResponse({ success: false, message: '网络抖动，请稍后重试' }));
        throw new Error('unexpected fetch url: ' + _0x19f650);
      };
      const { pollDreaminaUntilDone: _0x4cc4a3 } = await import('./dreaminaGenApi.js');
      (await assert.rejects(
        _0x4cc4a3('sid-transient-3', { intervalMs: 1, maxWaitMs: 0x1388 }),
        (_0x17be3e) => {
          return (assert.match(String(_0x17be3e?.message || ''), /网络抖动，请稍后重试/), true);
        },
      ),
        assert.equal(_0x167953, 1));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: 超时前最终查询会返回即梦失败原文', async () => {
    try {
      let _0x4bdafb = 0;
      globalThis.fetch = async (_0x9c85d5) => {
        const _0x29da56 = String(_0x9c85d5);
        if (
          _0x29da56.startsWith('/api/v2/dreamina/query_result?') &&
          _0x29da56.includes('submitId=sid-final-fail')
        ) {
          _0x4bdafb += 1;
          if (_0x4bdafb === 1)
            return jsonResponse({
              success: true,
              submitId: 'sid-final-fail',
              status: 'pending',
              outputs: [],
            });
          return jsonResponse({
            success: true,
            submitId: 'sid-final-fail',
            status: 'failed',
            failReason: '平台返回：不符合平台规则，不予生成',
            outputs: [],
          });
        }
        throw new Error('unexpected fetch url: ' + _0x29da56);
      };
      const { pollDreaminaUntilDone: _0x237bd5 } = await import('./dreaminaGenApi.js'),
        _0x2795a7 = await _0x237bd5('sid-final-fail', { intervalMs: 2, maxWaitMs: 1 });
      (assert.equal(_0x4bdafb, 2),
        assert.equal(_0x2795a7.status, 'failed'),
        assert.equal(_0x2795a7.failReason, '平台返回：不符合平台规则，不予生成'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }));
