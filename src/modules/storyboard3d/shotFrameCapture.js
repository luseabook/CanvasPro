import { getActiveStoryboard3DScene } from './projectModel.js';
import { Storyboard3DSceneRuntime } from './sceneRuntime.js';
import { sampleStoryboard3DShotAnimation } from './shotAnimation.js';
import { resolveStoryboardExportDimensions } from './storyboardExport.js';
export async function captureDirectorShotFrame({
  project: _0x183509,
  sceneId: _0x15b6e8,
  shotId: _0x333714,
  time: time = 0x0,
  width: _0x4ddec4,
  height: _0x17389b,
  importedModelResolver: _0x426e08,
  windowObject: windowObject = globalThis['window'],
}) {
  const _0x1136c2 = structuredClone(_0x183509),
    _0x3adaef = _0x1136c2['scenes']['find']((_0x5eb3f9) => _0x5eb3f9['id'] === _0x15b6e8),
    _0x5885dc = _0x3adaef?.['shots']['find']((_0x488b5d) => _0x488b5d['id'] === _0x333714);
  if (!_0x5885dc) throw new Error('截图对应镜头不存在。');
  const _0x1e27b5 = resolveStoryboardExportDimensions({ aspectRatio: _0x5885dc['camera']['aspectRatio'] });
  ((_0x4ddec4 ||= _0x1e27b5['width']),
    (_0x17389b ||= _0x1e27b5['height']),
    (_0x1136c2['activeSceneId'] = _0x3adaef['id']),
    (_0x3adaef['activeShotId'] = _0x5885dc['id']));
  const _0xd9b176 = new Storyboard3DSceneRuntime({
    container: windowObject['document']['createElement']('div'),
    importedModelResolver: _0x426e08,
  });
  try {
    return (
      (_0xd9b176['timelinePreviewActive'] = !![]),
      _0xd9b176['sync']({ project: _0x1136c2, sceneId: _0x3adaef['id'] }),
      _0xd9b176['resize'](_0x4ddec4, _0x17389b),
      await _0xd9b176['waitForCaptureReady']({}),
      _0xd9b176['previewTimelineSample'](
        sampleStoryboard3DShotAnimation(_0x5885dc['animation'], time, {
          camera: _0x5885dc['camera'],
          objects: _0x3adaef['objects'],
          objectTransforms: Object['fromEntries'](
            _0x3adaef['objects']['map']((_0x59fd3d) => [_0x59fd3d['id'], _0x59fd3d['transform']]),
          ),
        }),
      ),
      _0xd9b176['renderNow'](),
      {
        blob: await _0xd9b176['captureBlob']({ includeEditorOverlays: ![] }),
        width: _0x4ddec4,
        height: _0x17389b,
      }
    );
  } finally {
    _0xd9b176['dispose']();
  }
}
export async function renderStoryboard3DShotFrame({
  shot: _0x117a28,
  width: _0x569dac,
  height: _0xf0ac63,
  runtime: _0x2be93c,
  getProject: _0x492a23,
  getEditorState: _0x6c210e,
  getHost: _0x2480df,
  windowObject: _0x2e2a5c,
} = {}) {
  if (!_0x2be93c) throw new Error('3D 离屏渲染器尚未就绪。');
  const _0x436ca7 = structuredClone(_0x492a23()),
    _0x343085 =
      _0x436ca7['scenes']['find']((_0x15faa1) => _0x15faa1['id'] === _0x117a28?.['sceneId']) ||
      getActiveStoryboard3DScene(_0x436ca7),
    _0x3f54aa = _0x343085?.['shots']?.['find']((_0x348f3b) => _0x348f3b['id'] === _0x117a28?.['id']);
  if (!_0x343085 || !_0x3f54aa) throw new Error('找不到需要渲染的镜头。');
  ((_0x436ca7['activeSceneId'] = _0x343085['id']),
    (_0x343085['activeShotId'] = _0x3f54aa['id']),
    (_0x3f54aa['camera'] = structuredClone(_0x117a28['camera'])),
    _0x2be93c['resize'](
      Math['max'](0x40, Number(_0x569dac) || 0x780),
      Math['max'](0x40, Number(_0xf0ac63) || 0x438),
    ),
    _0x2be93c['sync']({
      project: _0x436ca7,
      sceneId: _0x343085['id'],
      selectedObjectIds: [],
      activeTool: 'select',
    }),
    _0x2be93c['renderNow']());
  try {
    await _0x2be93c['waitForCaptureReady']?.({});
    const _0x466fde = await _0x2be93c['captureBlob']({ includeEditorOverlays: ![] }),
      _0x3d015f = _0x2e2a5c?.['createImageBitmap'] || globalThis['createImageBitmap'];
    if (typeof _0x3d015f === 'function') return _0x3d015f(_0x466fde);
    const _0x167146 = _0x2e2a5c?.['URL'] || globalThis['URL'],
      _0x4ee975 = _0x2e2a5c?.['Image'];
    if (!_0x4ee975 || !_0x167146?.['createObjectURL']) throw new Error('当前环境无法解码离屏渲染结果。');
    const _0x2a5c61 = _0x167146['createObjectURL'](_0x466fde);
    return await new Promise((_0x1d83cb, _0x37c9e3) => {
      const _0xacd039 = new _0x4ee975();
      ((_0xacd039['onload'] = () => {
        ((_0xacd039['close'] = () => _0x167146['revokeObjectURL'](_0x2a5c61)), _0x1d83cb(_0xacd039));
      }),
        (_0xacd039['onerror'] = () => {
          (_0x167146['revokeObjectURL'](_0x2a5c61), _0x37c9e3(new Error('离屏渲染结果解码失败。')));
        }),
        (_0xacd039['src'] = _0x2a5c61));
    });
  } finally {
    if (!_0x2be93c['disposed']) {
      const _0x2a467f = _0x492a23(),
        _0x200825 = _0x6c210e();
      _0x2be93c['sync']({
        project: _0x2a467f,
        sceneId: _0x2a467f['activeSceneId'],
        selectedObjectIds: _0x200825['selectedObjectIds'],
        activeTool: _0x200825['activeTool'],
      });
      const _0x28dfee = _0x2480df()?.['getBoundingClientRect']?.();
      (_0x2be93c['resize'](
        Math['max'](0x1, Math['round'](_0x28dfee?.['width'] || 0x1)),
        Math['max'](0x1, Math['round'](_0x28dfee?.['height'] || 0x1)),
      ),
        _0x2be93c['renderNow']());
    }
  }
}
