import { Storyboard3DSceneRuntime } from './sceneRuntime.js';
import { normalizeStoryboard3DShotAnimation, sampleStoryboard3DShotAnimation } from './shotAnimation.js';
import { resolveStoryboardExportDimensions } from './storyboardExport.js';
import { createDirectorVideoPlan, sampleDirectorVideoPlan } from './directorVideoPlan.js';
export function recordDirectorCanvas({
  canvas: canvas,
  drawFrame: drawFrame,
  duration: duration,
  fps: fps,
  signal: signal,
  onProgress: onProgress,
  windowObject: windowObject = globalThis.window,
} = {}) {
  const run = windowObject?.MediaRecorder,
    type = ['video/mp4;codecs=avc1.42001E', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8'].find(
      (value) => run?.isTypeSupported?.(value),
    );
  if (!type || !canvas?.captureStream)
    return Promise.reject(new Error('当前浏览器不支持画面录制，请使用 Chrome 或 Edge。'));
  if (signal?.aborted) return Promise.reject(new DOMException('已取消录制', 'AbortError'));
  return new Promise((handler, handler2) => {
    let item,
      key,
      index,
      result,
      data = false,
      enabled = 0,
      options = null;
    const list = [],
      handler3 = () => {
        windowObject.clearTimeout(index);
        if (result != null) windowObject.cancelAnimationFrame?.(result);
        (signal?.removeEventListener('abort', target),
          item?.getTracks().forEach((source) => source.stop()));
      },
      handler4 = (next) => {
        if (data) return;
        ((data = true), handler3());
        if (next) handler2(next);
        else {
          if (!enabled) handler2(new Error('录制没有产生视频数据。'));
          else
            handler({
              blob: new Blob(list, { type: type.split(';')[0] }),
              duration: duration,
              fps: fps,
            });
        }
      },
      handler5 = (current) => {
        ((options ||= current), windowObject.clearTimeout(index));
        if (key?.state && key.state !== 'inactive') key.stop();
        else handler4(options);
      },
      target = () => handler5(new DOMException('已取消录制', 'AbortError'));
    try {
      (drawFrame(0),
        (item = canvas.captureStream(fps)),
        (key = new run(item, {
          mimeType: type,
          videoBitsPerSecond: Math.min(
            32000000,
            Math.max(4000000, canvas.width * canvas.height * fps * 0.12),
          ),
        })),
        (key.ondataavailable = (enabled2) => {
          if (!enabled2.data?.size) return;
          (list.push(enabled2.data), (enabled += enabled2.data.size));
          if (enabled > 512 * 1024 * 1024)
            handler5(new Error('视频超过 512 MB，请分镜头录制或降低分辨率。'));
        }),
        (key.onerror = (entry) => handler5(entry.error || new Error('视频编码失败。'))),
        (key.onstop = () => handler4(options)),
        signal?.addEventListener('abort', target, { once: true }));
      const run2 = (record) => {
        if (windowObject.requestAnimationFrame) result = windowObject.requestAnimationFrame(record);
        else index = windowObject.setTimeout(record, 1000 / fps);
      };
      let payload = 0;
      const run3 = () => item.getVideoTracks?.()[0]?.requestFrame?.(),
        handler6 = () => {
          if (data || options) return;
          const current2 = Math.min(duration, (windowObject.performance.now() - payload) / 1000);
          try {
            (drawFrame(current2),
              run3(),
              onProgress?.({ stage: 'recording', current: current2, total: duration }));
            if (current2 >= duration)
              run2(() => {
                index = windowObject.setTimeout(() => handler5(), 1000 / fps);
              });
            else index = windowObject.setTimeout(handler6, 1000 / fps);
          } catch (handle) {
            handler5(handle);
          }
        };
      ((key.onstart = () => {
        if (data || options) return;
        try {
          (drawFrame(0), run3());
        } catch (state) {
          handler5(state);
          return;
        }
        run2(() => {
          ((payload = windowObject.performance.now()), handler6());
        });
      }),
        key.start(1000));
    } catch (config) {
      handler5(config);
    }
  });
}
export async function renderStoryboard3DShotVideo({
  project: project,
  shot: shot,
  importedModelResolver: importedModelResolver,
  signal: signal2,
  onProgress: onProgress2,
  windowObject: windowObject = globalThis.window,
  ...args
} = {}) {
  const scenes = structuredClone(project),
    sceneId =
      scenes.scenes.find((scope) => scope.id === shot.sceneId) ||
      scenes.scenes.find((input) => input.id === scenes.activeSceneId),
    args2 = sceneId?.shots.find((output) => output.id === shot.id);
  if (!sceneId || !args2) throw new Error('找不到需要录制的镜头。');
  ((scenes.activeSceneId = sceneId.id), (sceneId.activeShotId = shot.id));
  const aspectRatio = resolveStoryboardExportDimensions(args);
  ((args2.camera.aspectRatio = aspectRatio.aspectRatio),
    (args2.animation = normalizeStoryboard3DShotAnimation({ ...args2.animation, loop: false })),
    args2.animation.cameraKeyframes.forEach((value2) => {
      value2.camera.aspectRatio = aspectRatio.aspectRatio;
    }));
  const map =
      args.mode === 'sequence-video'
        ? new Set((args.shots || []).map((value3) => value3.id))
        : new Set([shot.id]),
    value4 = scenes.scenes
      .flatMap((value5) => value5.shots)
      .filter((value6) => map.has(value6.id)),
    plan = createDirectorVideoPlan(sceneId, value4, {
      ...args,
      scenes: scenes.scenes,
      aspectRatio: aspectRatio.aspectRatio,
    });
  if (new Set(plan.segments.map((value7) => value7.scene.id)).size > 1)
    return recordDirectorSceneSequence({
      snapshot: scenes,
      plan: plan,
      dimensions: aspectRatio,
      importedModelResolver: importedModelResolver,
      signal: signal2,
      onProgress: onProgress2,
      windowObject: windowObject,
    });
  const container = windowObject.document.createElement('div'),
    storyboard3DSceneRuntime = new Storyboard3DSceneRuntime({
      container: container,
      importedModelResolver: importedModelResolver,
    });
  try {
    ((storyboard3DSceneRuntime.timelinePreviewActive = true),
      storyboard3DSceneRuntime.sync({
        project: scenes,
        sceneId: sceneId.id,
        selectedObjectIds: [],
        activeTool: 'select',
      }),
      storyboard3DSceneRuntime.resize(aspectRatio.width, aspectRatio.height),
      await storyboard3DSceneRuntime.waitForCaptureReady({ signal: signal2 }));
    const { duration: duration2, fps: fps2 } = plan,
      args3 = await storyboard3DSceneRuntime.withCleanCaptureCanvas((canvas2) =>
        recordDirectorCanvas({
          canvas: canvas2,
          duration: duration2,
          fps: fps2,
          signal: signal2,
          onProgress: onProgress2,
          windowObject: windowObject,
          drawFrame: (value8) => {
            (storyboard3DSceneRuntime.previewTimelineSample(
              sampleDirectorVideoPlan(plan, value8, sceneId),
            ),
              storyboard3DSceneRuntime.renderNow());
          },
        }),
      );
    return { ...args3, width: aspectRatio.width, height: aspectRatio.height };
  } finally {
    storyboard3DSceneRuntime.dispose();
  }
}
async function recordDirectorSceneSequence({
  snapshot: snapshot,
  plan: plan2,
  dimensions: dimensions,
  importedModelResolver: importedModelResolver2,
  signal: signal3,
  onProgress: onProgress3,
  windowObject: windowObject2,
}) {
  const map2 = new Map(),
    map3 = new Map(),
    canvas3 = windowObject2.document.createElement('canvas');
  ((canvas3.width = dimensions.width), (canvas3.height = dimensions.height));
  const ctx = canvas3.getContext('2d');
  if (!ctx) throw new Error('无法创建多场景录制画布。');
  try {
    for (const sceneId2 of plan2.segments) {
      if (map2.has(sceneId2.scene.id)) continue;
      if (signal3?.aborted) throw new DOMException('已取消录制', 'AbortError');
      const storyboard3DSceneRuntime2 = new Storyboard3DSceneRuntime({
        container: windowObject2.document.createElement('div'),
        importedModelResolver: importedModelResolver2,
      });
      (map2.set(sceneId2.scene.id, storyboard3DSceneRuntime2),
        (storyboard3DSceneRuntime2.timelinePreviewActive = true),
        storyboard3DSceneRuntime2.sync({
          project: snapshot,
          sceneId: sceneId2.scene.id,
          selectedObjectIds: [],
          activeTool: 'select',
        }),
        storyboard3DSceneRuntime2.resize(dimensions.width, dimensions.height),
        await storyboard3DSceneRuntime2.waitForCaptureReady({ signal: signal3 }),
        onProgress3?.({ stage: 'preparing', current: 0, total: plan2.duration }));
    }
    const list2 = [...map2],
      handler7 = (value9) =>
        value9 < list2.length
          ? list2[value9][1].withCleanCaptureCanvas((value10) => {
              return (map3.set(list2[value9][0], value10), handler7(value9 + 1));
            })
          : recordDirectorCanvas({
              canvas: canvas3,
              duration: plan2.duration,
              fps: plan2.fps,
              signal: signal3,
              onProgress: onProgress3,
              windowObject: windowObject2,
              drawFrame: (value11) => {
                const value12 =
                    plan2.segments.find((value13) => value11 < value13.end) ||
                    plan2.segments.at(-1),
                  value14 = map2.get(value12.scene.id);
                (value14.previewTimelineSample(sampleDirectorVideoPlan(plan2, value11, value12.scene)),
                  value14.renderNow(),
                  ctx.clearRect(0, 0, canvas3.width, canvas3.height),
                  ctx.drawImage(
                    map3.get(value12.scene.id),
                    0,
                    0,
                    canvas3.width,
                    canvas3.height,
                  ));
              },
            });
    return { ...(await handler7(0)), width: dimensions.width, height: dimensions.height };
  } finally {
    for (const value15 of map2.values()) value15.dispose();
  }
}
