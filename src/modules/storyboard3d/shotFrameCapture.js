import { getActiveStoryboard3DScene } from './projectModel.js';
import { Storyboard3DSceneRuntime } from './sceneRuntime.js';
import { sampleStoryboard3DShotAnimation } from './shotAnimation.js';
import { resolveStoryboardExportDimensions } from './storyboardExport.js';
export async function captureDirectorShotFrame({
  project: project,
  sceneId: sceneId,
  shotId: shotId,
  time: time = 0,
  width: width,
  height: height,
  importedModelResolver: importedModelResolver,
  windowObject: windowObject = globalThis['window'],
}) {
  const project2 = structuredClone(project),
    sceneId2 = project2['scenes']['find']((value) => value['id'] === sceneId),
    aspectRatio = sceneId2?.['shots']['find']((item) => item['id'] === shotId);
  if (!aspectRatio) throw new Error('截图对应镜头不存在。');
  const box = resolveStoryboardExportDimensions({ aspectRatio: aspectRatio['camera']['aspectRatio'] });
  ((width ||= box['width']),
    (height ||= box['height']),
    (project2['activeSceneId'] = sceneId2['id']),
    (sceneId2['activeShotId'] = aspectRatio['id']));
  const storyboard3DSceneRuntime = new Storyboard3DSceneRuntime({
    container: windowObject['document']['createElement']('div'),
    importedModelResolver: importedModelResolver,
  });
  try {
    return (
      (storyboard3DSceneRuntime['timelinePreviewActive'] = true),
      storyboard3DSceneRuntime['sync']({ project: project2, sceneId: sceneId2['id'] }),
      storyboard3DSceneRuntime['resize'](width, height),
      await storyboard3DSceneRuntime['waitForCaptureReady']({}),
      storyboard3DSceneRuntime['previewTimelineSample'](
        sampleStoryboard3DShotAnimation(aspectRatio['animation'], time, {
          camera: aspectRatio['camera'],
          objects: sceneId2['objects'],
          objectTransforms: Object['fromEntries'](
            sceneId2['objects']['map']((key) => [key['id'], key['transform']]),
          ),
        }),
      ),
      storyboard3DSceneRuntime['renderNow'](),
      {
        blob: await storyboard3DSceneRuntime['captureBlob']({ includeEditorOverlays: false }),
        width: width,
        height: height,
      }
    );
  } finally {
    storyboard3DSceneRuntime['dispose']();
  }
}
export async function renderStoryboard3DShotFrame({
  shot: shot,
  width: width2,
  height: height2,
  runtime: runtime,
  getProject: getProject,
  getEditorState: getEditorState,
  getHost: getHost,
  windowObject: windowObject2,
} = {}) {
  if (!runtime) throw new Error('3D 离屏渲染器尚未就绪。');
  const project3 = structuredClone(getProject()),
    sceneId3 =
      project3['scenes']['find']((index) => index['id'] === shot?.['sceneId']) ||
      getActiveStoryboard3DScene(project3),
    enabled = sceneId3?.['shots']?.['find']((result) => result['id'] === shot?.['id']);
  if (!sceneId3 || !enabled) throw new Error('找不到需要渲染的镜头。');
  ((project3['activeSceneId'] = sceneId3['id']),
    (sceneId3['activeShotId'] = enabled['id']),
    (enabled['camera'] = structuredClone(shot['camera'])),
    runtime['resize'](
      Math['max'](64, Number(width2) || 1920),
      Math['max'](64, Number(height2) || 1080),
    ),
    runtime['sync']({
      project: project3,
      sceneId: sceneId3['id'],
      selectedObjectIds: [],
      activeTool: 'select',
    }),
    runtime['renderNow']());
  try {
    await runtime['waitForCaptureReady']?.({});
    const data = await runtime['captureBlob']({ includeEditorOverlays: false }),
      handler = windowObject2?.['createImageBitmap'] || globalThis['createImageBitmap'];
    if (typeof handler === 'function') return handler(data);
    const enabled2 = windowObject2?.['URL'] || globalThis['URL'],
      handler2 = windowObject2?.['Image'];
    if (!handler2 || !enabled2?.['createObjectURL']) throw new Error('当前环境无法解码离屏渲染结果。');
    const options = enabled2['createObjectURL'](data);
    return await new Promise((handler3, handler4) => {
      const target = new handler2();
      ((target['onload'] = () => {
        ((target['close'] = () => enabled2['revokeObjectURL'](options)), handler3(target));
      }),
        (target['onerror'] = () => {
          (enabled2['revokeObjectURL'](options), handler4(new Error('离屏渲染结果解码失败。')));
        }),
        (target['src'] = options));
    });
  } finally {
    if (!runtime['disposed']) {
      const project4 = getProject(),
        selectedObjectIds = getEditorState();
      runtime['sync']({
        project: project4,
        sceneId: project4['activeSceneId'],
        selectedObjectIds: selectedObjectIds['selectedObjectIds'],
        activeTool: selectedObjectIds['activeTool'],
      });
      const box2 = getHost()?.['getBoundingClientRect']?.();
      (runtime['resize'](
        Math['max'](1, Math['round'](box2?.['width'] || 1)),
        Math['max'](1, Math['round'](box2?.['height'] || 1)),
      ),
        runtime['renderNow']());
    }
  }
}
