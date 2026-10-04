import test from 'node:test';
import assert from 'node:assert/strict';
const originalFetch = globalThis.fetch;
function jsonResponse(value) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => value,
    text: async () => JSON.stringify(value),
  };
}
(test('dreaminaGenApi: submit text2image', async () => {
  try {
    globalThis.fetch = async (item, dom = {}) => {
      (assert.equal(String(item), '/api/v2/dreamina/text2image'),
        assert.equal(String(dom.method || 'GET'), 'POST'));
      const key = JSON.parse(String(dom.body || '{}'));
      return (
        assert.equal(key.prompt, 'cat'),
        jsonResponse({ success: true, submitId: 'sid1', genStatus: 'querying' })
      );
    };
    const { submitDreaminaText2Image: submitDreaminaText2Image } = await import('./dreaminaGenApi.js'),
      index = await submitDreaminaText2Image({ prompt: 'cat' });
    assert.equal(index.submitId, 'sid1');
  } finally {
    globalThis.fetch = originalFetch;
  }
}),
  test('dreaminaGenApi: query_result url includes submitId', async () => {
    try {
      globalThis.fetch = async (result, data = {}) => {
        return (
          assert.match(String(result), /\/api\/v2\/dreamina\/query_result\?submitId=sid2&autoDownload=1$/),
          assert.equal(String(data.method || 'GET'), 'GET'),
          jsonResponse({ success: true, submitId: 'sid2', status: 'pending', outputs: [] })
        );
      };
      const { queryDreaminaResult: queryDreaminaResult } = await import('./dreaminaGenApi.js'),
        response = await queryDreaminaResult('sid2', { autoDownload: true });
      assert.equal(response.status, 'pending');
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: normalizeDreaminaErrorMessage explains CLI request timeout', async () => {
    const { normalizeDreaminaErrorMessage: normalizeDreaminaErrorMessage } =
        await import('./dreaminaGenApi.js'),
      options =
        'do request: Post "https://jimeng.jianying.com/dreamina/cli/v1/image_generate?cli_version=fa7ede2&from=dreamina_cli": context deadline exceeded (Client.Timeout exceeded while awaiting headers)';
    assert.equal(
      normalizeDreaminaErrorMessage(options),
      '即梦官方生成接口响应超时，本次没有拿到任务ID。网页可用不代表 CLI 生成接口稳定，请稍后重试；如果连续出现，请切换网络/代理或重新登录即梦后再试。',
    );
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot pending + waiting => queued', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot } =
        await import('./dreaminaGenApi.js'),
      response2 = normalizeDreaminaTaskSnapshot({
        submitId: 'sid-q1',
        status: 'pending',
        outputs: [],
        raw: { queue_status: 'waiting', queue_idx: 3, queue_length: 12 },
      });
    (assert.equal(response2.status, 'pending'),
      assert.equal(response2.phase, 'queued'),
      assert.equal(response2.label, '排队中'),
      assert.equal(response2.queueIndex, 3),
      assert.equal(response2.queueLength, 12));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot success + empty outputs => syncing', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot2 } =
        await import('./dreaminaGenApi.js'),
      response3 = normalizeDreaminaTaskSnapshot2({
        submitId: 'sid-s1',
        status: 'success',
        outputs: [],
        raw: { queue_status: 'Finish' },
      });
    (assert.equal(response3.status, 'pending'),
      assert.equal(response3.phase, 'syncing'),
      assert.equal(response3.label, '正在同步结果'),
      assert.equal(response3.hasOutputs, false));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot success + outputs => done', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot3 } =
        await import('./dreaminaGenApi.js'),
      response4 = normalizeDreaminaTaskSnapshot3({
        submitId: 'sid-s2',
        status: 'success',
        outputs: [{ localPath: 'output/dreamina/text2video/c.mp4' }],
      });
    (assert.equal(response4.status, 'success'),
      assert.equal(response4.phase, 'done'),
      assert.equal(response4.label, '已完成'),
      assert.equal(response4.hasOutputs, true));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes nested Dreamina image outputs', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot4 } =
        await import('./dreaminaGenApi.js'),
      response5 = normalizeDreaminaTaskSnapshot4({
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
    (assert.equal(response5.status, 'success'),
      assert.equal(response5.phase, 'done'),
      assert.equal(response5.hasOutputs, true),
      assert.equal(response5.outputs[0].url, 'https://example.com/dreamina-result.png'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot raw fail overrides success empty outputs', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot5 } =
        await import('./dreaminaGenApi.js'),
      response6 = normalizeDreaminaTaskSnapshot5({
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
    (assert.equal(response6.status, 'failed'),
      assert.equal(response6.phase, 'failed'),
      assert.equal(response6.failReason, 'generation failed: final generation failed'),
      assert.equal(response6.label, 'generation failed: final generation failed'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes top-level fail aliases', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot6 } =
        await import('./dreaminaGenApi.js'),
      response7 = normalizeDreaminaTaskSnapshot6({
        submitId: 'sid-top-fail',
        status: 'fail',
        outputs: [],
        message: '内容安全审核未通过',
      });
    (assert.equal(response7.status, 'failed'),
      assert.equal(response7.phase, 'failed'),
      assert.equal(response7.failReason, '内容安全审核未通过'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot treats terminal raw message as failed', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot7 } =
        await import('./dreaminaGenApi.js'),
      response8 = normalizeDreaminaTaskSnapshot7({
        submitId: 'sid-raw-message-fail',
        status: 'pending',
        outputs: [],
        raw: { queryResult: { gen_status: 'querying', message: '平台返回：不符合平台规则，不予生成' } },
      });
    (assert.equal(response8.status, 'failed'),
      assert.equal(response8.phase, 'failed'),
      assert.equal(response8.failReason, '平台返回：不符合平台规则，不予生成'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes nested raw data failure', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot8 } =
        await import('./dreaminaGenApi.js'),
      response9 = normalizeDreaminaTaskSnapshot8({
        submitId: 'sid-nested-raw-fail',
        status: 'success',
        outputs: [],
        raw: {
          data: { gen_status: 'failed', message: 'generation failed: final generation failed' },
        },
      });
    (assert.equal(response9.status, 'failed'),
      assert.equal(response9.phase, 'failed'),
      assert.equal(response9.failReason, 'generation failed: final generation failed'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot recognizes raw listTask array failure', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot9 } =
        await import('./dreaminaGenApi.js'),
      response10 = normalizeDreaminaTaskSnapshot9({
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
    (assert.equal(response10.status, 'failed'),
      assert.equal(response10.phase, 'failed'),
      assert.equal(response10.failReason, 'generation failed: final generation failed'));
  }),
  test('dreaminaGenApi: normalizeDreaminaTaskSnapshot keeps non-terminal message pending', async () => {
    const { normalizeDreaminaTaskSnapshot: normalizeDreaminaTaskSnapshot10 } =
        await import('./dreaminaGenApi.js'),
      response11 = normalizeDreaminaTaskSnapshot10({
        submitId: 'sid-raw-message-pending',
        status: 'pending',
        outputs: [],
        raw: { queryResult: { gen_status: 'querying', message: '任务排队中' } },
      });
    (assert.equal(response11.status, 'pending'),
      assert.equal(response11.phase, 'generating'),
      assert.equal(response11.failReason, ''));
  }),
  test('dreaminaGenApi: image generation raw fail throws fail_reason', async () => {
    try {
      globalThis.fetch = async (target, source = {}) => {
        const list = String(target);
        if (list === '/api/v2/dreamina/text2image')
          return (
            assert.equal(String(source.method || 'GET'), 'POST'),
            jsonResponse({ success: true, submitId: 'sid-image-raw-fail' })
          );
        if (list.startsWith('/api/v2/dreamina/query_result?') && list.includes('submitId=sid-image-raw-fail'))
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
        throw new Error('unexpected fetch url: ' + list);
      };
      const { runDreaminaImageGeneration: runDreaminaImageGeneration } = await import('./dreaminaGenApi.js');
      await assert.rejects(
        () => runDreaminaImageGeneration({ prompt: 'blocked', model: 'dreamina/4.1' }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: image generation nested raw data failure throws message', async () => {
    try {
      globalThis.fetch = async (next, current = {}) => {
        const list2 = String(next);
        if (list2 === '/api/v2/dreamina/text2image')
          return (
            assert.equal(String(current.method || 'GET'), 'POST'),
            jsonResponse({ success: true, submitId: 'sid-image-nested-fail' })
          );
        if (
          list2.startsWith('/api/v2/dreamina/query_result?') &&
          list2.includes('submitId=sid-image-nested-fail')
        )
          return jsonResponse({
            success: true,
            submitId: 'sid-image-nested-fail',
            status: 'success',
            outputs: [],
            raw: { data: { status: 'failed', message: 'generation failed: final generation failed' } },
          });
        throw new Error('unexpected fetch url: ' + list2);
      };
      const { runDreaminaImageGeneration: runDreaminaImageGeneration2 } = await import('./dreaminaGenApi.js');
      await assert.rejects(
        () => runDreaminaImageGeneration2({ prompt: 'blocked', model: 'dreamina/4.1' }),
        /generation failed: final generation failed/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: video generation raw fail throws fail_reason', async () => {
    try {
      globalThis.fetch = async (entry, record = {}) => {
        const list3 = String(entry);
        if (list3 === '/api/v2/dreamina/text2video')
          return (
            assert.equal(String(record.method || 'GET'), 'POST'),
            jsonResponse({ success: true, submitId: 'sid-video-raw-fail' })
          );
        if (
          list3.startsWith('/api/v2/dreamina/query_result?') &&
          list3.includes('submitId=sid-video-raw-fail')
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
        throw new Error('unexpected fetch url: ' + list3);
      };
      const { runDreaminaVideoGeneration: runDreaminaVideoGeneration } = await import('./dreaminaGenApi.js');
      await assert.rejects(
        () =>
          runDreaminaVideoGeneration({
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
      globalThis.fetch = async (payload, dom2 = {}) => {
        const list4 = String(payload);
        if (list4 === '/api/v2/dreamina/image2image') {
          const handle = JSON.parse(String(dom2.body || '{}'));
          return (
            assert.equal(handle.prompt, 'edit'),
            assert.deepEqual(handle.images, ['/data/uploads/demo.png']),
            assert.ok(!Object.prototype.hasOwnProperty.call(handle, 'ratio')),
            assert.equal(handle.resolutionType, '4k'),
            assert.equal(handle.modelVersion, '5.0'),
            jsonResponse({ success: true, submitId: 'sid-run-1', genStatus: 'querying' })
          );
        }
        if (list4.startsWith('/api/v2/dreamina/query_result?') && list4.includes('submitId=sid-run-1'))
          return jsonResponse({
            success: true,
            submitId: 'sid-run-1',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/text2image/a.png' }],
          });
        throw new Error('unexpected fetch url: ' + list4);
      };
      const { runDreaminaImageGeneration: runDreaminaImageGeneration3 } = await import('./dreaminaGenApi.js'),
        list5 = await runDreaminaImageGeneration3({
          prompt: 'edit',
          aspectRatio: '自适应',
          imageSize: '4K',
          model: 'dreamina/5.0',
          inputUrls: ['/data/uploads/demo.png'],
        });
      (assert.equal(Array.isArray(list5), true),
        assert.equal(list5.length, 1),
        assert.equal(list5[0].localPath, 'output/dreamina/text2image/a.png'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: text2image + 自适应会提交 1:1', async () => {
    try {
      globalThis.fetch = async (state, dom3 = {}) => {
        const list6 = String(state);
        if (list6 === '/api/v2/dreamina/text2image') {
          const config = JSON.parse(String(dom3.body || '{}'));
          return (
            assert.equal(config.prompt, 'cat'),
            assert.equal(config.ratio, '1:1'),
            assert.equal(config.modelVersion, '4.1'),
            jsonResponse({ success: true, submitId: 'sid-run-2', genStatus: 'querying' })
          );
        }
        if (list6.startsWith('/api/v2/dreamina/query_result?') && list6.includes('submitId=sid-run-2'))
          return jsonResponse({
            success: true,
            submitId: 'sid-run-2',
            status: 'success',
            outputs: [{ url: 'https://example.com/a.png' }],
          });
        throw new Error('unexpected fetch url: ' + list6);
      };
      const { runDreaminaImageGeneration: runDreaminaImageGeneration4 } = await import('./dreaminaGenApi.js'),
        list7 = await runDreaminaImageGeneration4({
          prompt: 'cat',
          aspectRatio: '自适应',
          model: 'dreamina/4.1',
          inputUrls: [],
        });
      (assert.equal(Array.isArray(list7), true),
        assert.equal(list7.length, 1),
        assert.equal(list7[0].sourceUrl, 'https://example.com/a.png'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: buildDreaminaVideoSubmitRequest 在首尾帧模式下路由到 frames2video', async () => {
    const { buildDreaminaVideoSubmitRequest: buildDreaminaVideoSubmitRequest } =
        await import('./dreaminaGenApi.js'),
      dom4 = buildDreaminaVideoSubmitRequest({
        prompt: 'season changes',
        dreaminaRouteMode: 'frames2video',
        model: 'dreamina/3.5pro',
        inputUrls: ['/a.png', '/b.png'],
        duration: 6,
        resolution: '1080p',
      });
    (assert.equal(dom4.taskType, 'frames2video'),
      assert.equal(dom4.url, '/api/v2/dreamina/frames2video'),
      assert.equal(dom4.body.first, '/a.png'),
      assert.equal(dom4.body.last, '/b.png'),
      assert.equal(dom4.body.modelVersion, '3.5pro'),
      assert.equal(dom4.body.videoResolution, '1080p'));
  }),
  test('dreaminaGenApi: 首尾帧单图回退 image2video 时保留 3.0 模型', async () => {
    const { buildDreaminaVideoSubmitRequest: buildDreaminaVideoSubmitRequest2 } =
        await import('./dreaminaGenApi.js'),
      dom5 = buildDreaminaVideoSubmitRequest2({
        prompt: 'camera push in',
        dreaminaRouteMode: 'frames2video',
        model: 'dreamina/3.0',
        inputUrls: ['/a.png'],
        duration: 5,
        resolution: '720p',
      });
    (assert.equal(dom5.taskType, 'image2video'),
      assert.equal(dom5.url, '/api/v2/dreamina/image2video'),
      assert.equal(dom5.body.image, '/a.png'),
      assert.equal(dom5.body.modelVersion, '3.0'),
      assert.equal(dom5.body.videoResolution, '720p'));
  }),
  test('dreaminaGenApi: 首尾帧单图回退 image2video 时保留 seedance 模型', async () => {
    const { buildDreaminaVideoSubmitRequest: buildDreaminaVideoSubmitRequest3 } =
        await import('./dreaminaGenApi.js'),
      dom6 = buildDreaminaVideoSubmitRequest3({
        prompt: 'camera push in',
        dreaminaRouteMode: 'frames2video',
        model: 'dreamina/seedance2.0fast',
        inputUrls: ['/a.png'],
        duration: 5,
        resolution: '720p',
      });
    (assert.equal(dom6.taskType, 'image2video'),
      assert.equal(dom6.url, '/api/v2/dreamina/image2video'),
      assert.equal(dom6.body.image, '/a.png'),
      assert.equal(dom6.body.modelVersion, 'seedance2.0fast'),
      assert.equal(dom6.body.videoResolution, '720p'));
  }),
  test('dreaminaGenApi: Seedance 2.0 VIP 支持 1080p 视频分辨率', async () => {
    const { buildDreaminaVideoSubmitRequest: buildDreaminaVideoSubmitRequest4 } =
        await import('./dreaminaGenApi.js'),
      dom7 = buildDreaminaVideoSubmitRequest4({
        prompt: 'cinematic city sunrise',
        dreaminaRouteMode: 'multimodal2video',
        model: 'dreamina/seedance2.0_vip',
        inputUrls: ['/cover.png'],
        duration: 5,
        resolution: '1080p',
      });
    (assert.equal(dom7.taskType, 'multimodal2video'),
      assert.equal(dom7.url, '/api/v2/dreamina/multimodal2video'),
      assert.equal(dom7.body.modelVersion, 'seedance2.0_vip'),
      assert.equal(dom7.body.videoResolution, '1080p'));
  }),
  test('dreaminaGenApi: buildDreaminaVideoSubmitRequest 全能参考无参考时回退 text2video', async () => {
    const { buildDreaminaVideoSubmitRequest: buildDreaminaVideoSubmitRequest5 } =
        await import('./dreaminaGenApi.js'),
      dom8 = buildDreaminaVideoSubmitRequest5({
        dreaminaRouteMode: 'multimodal2video',
        prompt: 'a boy rides a skateboard in the park',
      });
    (assert.equal(dom8.taskType, 'text2video'),
      assert.equal(dom8.url, '/api/v2/dreamina/text2video'),
      assert.equal(dom8.body.modelVersion, 'seedance2.0fast'));
  }),
  test('dreaminaGenApi: buildDreaminaVideoSubmitRequest 全能参考音频单独使用会报错', async () => {
    const { buildDreaminaVideoSubmitRequest: buildDreaminaVideoSubmitRequest6 } =
      await import('./dreaminaGenApi.js');
    assert.throws(
      () =>
        buildDreaminaVideoSubmitRequest6({ dreaminaRouteMode: 'multimodal2video', audios: ['/music.mp3'] }),
      /音频不能单独使用/,
    );
  }),
  test('dreaminaGenApi: 即梦视频上传时长错误会转成中文', async () => {
    const { normalizeDreaminaErrorMessage: normalizeDreaminaErrorMessage2 } =
        await import('./dreaminaGenApi.js'),
      scope = normalizeDreaminaErrorMessage2(
        'upload resource "C:\\Users\\HASEE\\Desktop\\2.14\\data\\uploads\\dreamina_video_0004 (1).mp4": upload video: duration 15.070 seconds is out of allowed range [2, 15]',
      );
    assert.equal(
      scope,
      '上传源视频失败：“dreamina_video_0004 (1).mp4”时长 15.070 秒，超出即梦允许范围（2-15 秒）。请将视频裁剪到 15 秒以内，建议裁到 14.9 秒后再上传。',
    );
  }),
  test('dreaminaGenApi: 即梦视频上传时长错误支持不同秒数和无文件路径格式', async () => {
    const { normalizeDreaminaErrorMessage: normalizeDreaminaErrorMessage3 } =
        await import('./dreaminaGenApi.js'),
      input = normalizeDreaminaErrorMessage3(
        'upload video: duration 15.4 seconds is out of allowed range [2, 15]',
      );
    assert.equal(
      input,
      '上传源视频失败：源视频时长 15.4 秒，超出即梦允许范围（2-15 秒）。请将视频裁剪到 15 秒以内，建议裁到 14.9 秒后再上传。',
    );
  }),
  test('dreaminaGenApi: 即梦音频上传时长错误会转成中文', async () => {
    const { normalizeDreaminaErrorMessage: normalizeDreaminaErrorMessage4 } =
        await import('./dreaminaGenApi.js'),
      output = normalizeDreaminaErrorMessage4(
        'upload resource "H:\\AI\\Al_Canvas_code\\data\\uploads\\恋人.mp3": upload audio: duration 77.832 seconds is out of allowed range [2, 15]',
      );
    assert.equal(
      output,
      '上传源音频失败：“恋人.mp3”时长 77.832 秒，超出即梦允许范围（2-15 秒）。请将音频裁剪到 15 秒以内后再上传。',
    );
  }),
  test('dreaminaGenApi: runDreaminaVideoGeneration 提交 multimodal2video', async () => {
    try {
      globalThis.fetch = async (value2, dom9 = {}) => {
        const list8 = String(value2);
        if (list8 === '/api/v2/dreamina/multimodal2video') {
          const value3 = JSON.parse(String(dom9.body || '{}'));
          return (
            assert.deepEqual(value3.images, ['/cover.png']),
            assert.deepEqual(value3.videos, ['/ref.mp4']),
            assert.deepEqual(value3.audios, ['/music.mp3']),
            assert.equal(value3.modelVersion, 'seedance2.0fast'),
            assert.equal(value3.videoResolution, '720p'),
            jsonResponse({ success: true, submitId: 'sid-video-1' })
          );
        }
        if (list8.startsWith('/api/v2/dreamina/query_result?') && list8.includes('submitId=sid-video-1'))
          return jsonResponse({
            success: true,
            submitId: 'sid-video-1',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/multimodal2video/a.mp4' }],
          });
        throw new Error('unexpected fetch url: ' + list8);
      };
      const { runDreaminaVideoGeneration: runDreaminaVideoGeneration2 } = await import('./dreaminaGenApi.js'),
        value4 = await runDreaminaVideoGeneration2({
          model: 'dreamina/seedance2.0fast',
          images: ['/cover.png'],
          videos: ['/ref.mp4'],
          audios: ['/music.mp3'],
          aspectRatio: '16:9',
          duration: 5,
        });
      (assert.equal(value4.videoUrl, '/output/dreamina/multimodal2video/a.mp4'),
        assert.equal(value4.localPath, 'output/dreamina/multimodal2video/a.mp4'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: runDreaminaVideoGeneration 首次 success 无 outputs 时会继续轮询', async () => {
    try {
      let count = 0;
      globalThis.fetch = async (value5, dom10 = {}) => {
        const list9 = String(value5);
        if (list9 === '/api/v2/dreamina/text2video') {
          const value6 = JSON.parse(String(dom10.body || '{}'));
          return (
            assert.equal(value6.prompt, 'two people talking'),
            assert.equal(value6.modelVersion, 'seedance2.0fast'),
            jsonResponse({ success: true, submitId: 'sid-video-2' })
          );
        }
        if (list9.startsWith('/api/v2/dreamina/query_result?') && list9.includes('submitId=sid-video-2')) {
          count += 1;
          if (count === 1)
            return jsonResponse({ success: true, submitId: 'sid-video-2', status: 'success', outputs: [] });
          return jsonResponse({
            success: true,
            submitId: 'sid-video-2',
            status: 'success',
            outputs: [{ localPath: 'output/dreamina/text2video/b.mp4' }],
          });
        }
        throw new Error('unexpected fetch url: ' + list9);
      };
      const { runDreaminaVideoGeneration: runDreaminaVideoGeneration3 } = await import('./dreaminaGenApi.js'),
        value7 = await runDreaminaVideoGeneration3({
          model: 'dreamina/seedance2.0fast',
          prompt: 'two people talking',
          aspectRatio: '16:9',
          duration: 4,
        });
      (assert.equal(count, 2),
        assert.equal(value7.videoUrl, '/output/dreamina/text2video/b.mp4'),
        assert.equal(value7.localPath, 'output/dreamina/text2video/b.mp4'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: pollDreaminaUntilDone 会持续回调 onProgress', async () => {
    try {
      const list10 = [];
      globalThis.fetch = async (value8) => {
        const list11 = String(value8);
        if (
          list11.startsWith('/api/v2/dreamina/query_result?') &&
          list11.includes('submitId=sid-progress-1')
        ) {
          if (list10.length === 0)
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
        throw new Error('unexpected fetch url: ' + list11);
      };
      const { pollDreaminaUntilDone: pollDreaminaUntilDone } = await import('./dreaminaGenApi.js'),
        value9 = await pollDreaminaUntilDone('sid-progress-1', {
          intervalMs: 1,
          onProgress: (value10) => {
            list10.push(value10.phase + ':' + value10.label);
          },
        });
      (assert.equal(value9.submitId, 'sid-progress-1'),
        assert.deepEqual(list10, ['queued:排队中', 'done:已完成']));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: pollDreaminaUntilDone 单次查询错误会直接失败', async () => {
    try {
      let value11 = 0;
      globalThis.fetch = async (value12) => {
        const list12 = String(value12);
        if (
          list12.startsWith('/api/v2/dreamina/query_result?') &&
          list12.includes('submitId=sid-transient-1')
        )
          return ((value11 += 1), jsonResponse({ success: false, message: '查询超时，请稍后重试' }));
        throw new Error('unexpected fetch url: ' + list12);
      };
      const { pollDreaminaUntilDone: pollDreaminaUntilDone2 } = await import('./dreaminaGenApi.js');
      (await assert.rejects(
        pollDreaminaUntilDone2('sid-transient-1', { intervalMs: 1, maxWaitMs: 0x1388 }),
        /查询超时，请稍后重试/,
      ),
        assert.equal(value11, 1));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: status failed + 超时原因会直接失败', async () => {
    try {
      let count2 = 0;
      const list13 = [];
      globalThis.fetch = async (value13) => {
        const list14 = String(value13);
        if (
          list14.startsWith('/api/v2/dreamina/query_result?') &&
          list14.includes('submitId=sid-transient-2')
        ) {
          count2 += 1;
          if (count2 === 1)
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
        throw new Error('unexpected fetch url: ' + list14);
      };
      const { pollDreaminaUntilDone: pollDreaminaUntilDone3 } = await import('./dreaminaGenApi.js'),
        response12 = await pollDreaminaUntilDone3('sid-transient-2', {
          intervalMs: 1,
          maxWaitMs: 0x1388,
          onProgress: (response13) => {
            list13.push(response13.status + ':' + response13.phase);
          },
        });
      (assert.equal(count2, 1),
        assert.equal(response12.submitId, 'sid-transient-2'),
        assert.equal(response12.status, 'failed'),
        assert.equal(response12.failReason, '即梦组件执行超时'),
        assert.deepEqual(list13, ['failed:failed']));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: 查询返回错误会直接失败', async () => {
    try {
      let value14 = 0;
      globalThis.fetch = async (value15) => {
        const list15 = String(value15);
        if (
          list15.startsWith('/api/v2/dreamina/query_result?') &&
          list15.includes('submitId=sid-transient-3')
        )
          return ((value14 += 1), jsonResponse({ success: false, message: '网络抖动，请稍后重试' }));
        throw new Error('unexpected fetch url: ' + list15);
      };
      const { pollDreaminaUntilDone: pollDreaminaUntilDone4 } = await import('./dreaminaGenApi.js');
      (await assert.rejects(
        pollDreaminaUntilDone4('sid-transient-3', { intervalMs: 1, maxWaitMs: 0x1388 }),
        (error) => {
          return (assert.match(String(error?.message || ''), /网络抖动，请稍后重试/), true);
        },
      ),
        assert.equal(value14, 1));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }),
  test('dreaminaGenApi: 超时前最终查询会返回即梦失败原文', async () => {
    try {
      let count3 = 0;
      globalThis.fetch = async (value16) => {
        const list16 = String(value16);
        if (
          list16.startsWith('/api/v2/dreamina/query_result?') &&
          list16.includes('submitId=sid-final-fail')
        ) {
          count3 += 1;
          if (count3 === 1)
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
        throw new Error('unexpected fetch url: ' + list16);
      };
      const { pollDreaminaUntilDone: pollDreaminaUntilDone5 } = await import('./dreaminaGenApi.js'),
        response14 = await pollDreaminaUntilDone5('sid-final-fail', { intervalMs: 2, maxWaitMs: 1 });
      (assert.equal(count3, 2),
        assert.equal(response14.status, 'failed'),
        assert.equal(response14.failReason, '平台返回：不符合平台规则，不予生成'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  }));
