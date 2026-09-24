import assert from 'node:assert/strict';
import test from 'node:test';
import { STORYBOARD_EXPORT_ASPECT_RATIOS } from './storyboardExport.js';
import {
  Storyboard3DExportController,
  collectStoryboard3DProjectShots,
  createStoryboard3DExportController,
  createStoryboard3DExportGridSlots,
  getActiveStoryboard3DProjectShot,
  normalizeStoryboard3DExportOptions,
  placeStoryboard3DShotInGrid,
  reconcileStoryboard3DExportSelection,
} from './exportController.js';

const firstAspect = Object.keys(STORYBOARD_EXPORT_ASPECT_RATIOS)[0];

function projectFixture() {
  return {
    name: '项目甲',
    activeSceneId: 'sc-2',
    scenes: [
      { id: 'sc-1', name: '开场', shots: [{ id: 's1' }, { id: 's2' }] },
      { id: 'sc-2', name: '高潮', activeShotId: 's4', shots: [{ id: 's3' }, { id: 's4' }] },
    ],
  };
}

test('导出控制器：collectStoryboard3DProjectShots 取活动场景并补场景归属', () => {
  const shots = collectStoryboard3DProjectShots(projectFixture());
  assert.deepEqual(
    shots.map((shot) => [shot.id, shot.sceneId, shot.sceneName, shot.sceneShotIndex]),
    [
      ['s3', 'sc-2', '高潮', 0],
      ['s4', 'sc-2', '高潮', 1],
    ],
  );
  assert.deepEqual(collectStoryboard3DProjectShots({}), []);
  assert.deepEqual(collectStoryboard3DProjectShots({ scenes: [] }), []);
});

test('导出控制器：getActiveStoryboard3DProjectShot 回落首个场景/镜头', () => {
  assert.deepEqual(getActiveStoryboard3DProjectShot(projectFixture()), {
    id: 's4',
    sceneId: 'sc-2',
    sceneName: '高潮',
  });
  const fallback = getActiveStoryboard3DProjectShot({
    scenes: [{ id: 'sc-1', name: '开场', shots: [{ id: 's1' }] }],
  });
  assert.equal(fallback.id, 's1');
  assert.equal(fallback.sceneName, '开场');
  assert.equal(getActiveStoryboard3DProjectShot({ scenes: [] }), null);
  assert.equal(getActiveStoryboard3DProjectShot({ scenes: [{ id: 'sc-1', name: '空场', shots: [] }] }), null);
});

test('导出控制器：normalizeStoryboard3DExportOptions 归一模式/比例/分辨率/宫格', () => {
  assert.ok(Object.hasOwn(STORYBOARD_EXPORT_ASPECT_RATIOS, '16:9'));
  assert.equal(normalizeStoryboard3DExportOptions().mode, 'current-png');
  assert.equal(normalizeStoryboard3DExportOptions({ mode: 'bogus' }).mode, 'current-png');
  assert.equal(normalizeStoryboard3DExportOptions({ mode: 'grid-png' }).mode, 'grid-png');
  assert.equal(normalizeStoryboard3DExportOptions({ aspectRatio: firstAspect }).aspectRatio, firstAspect);
  assert.equal(normalizeStoryboard3DExportOptions({ aspectRatio: 'nope' }).aspectRatio, '16:9');
  assert.equal(normalizeStoryboard3DExportOptions({ resolution: '4K' }).resolution, '4K');
  assert.equal(normalizeStoryboard3DExportOptions({ resolution: '8K' }).resolution, '1080p');

  const fromGrid = normalizeStoryboard3DExportOptions({ gridSize: 16 });
  assert.equal(fromGrid.gridSize, 16);
  assert.equal(fromGrid.columns, 4);
  const fromColumns = normalizeStoryboard3DExportOptions({ columns: 2 });
  assert.equal(fromColumns.gridSize, 4);
  assert.equal(fromColumns.columns, 2);
  assert.equal(normalizeStoryboard3DExportOptions({ gridSize: 5 }).gridSize, 9);
  assert.equal(normalizeStoryboard3DExportOptions().gridSize, 9);
  assert.equal(normalizeStoryboard3DExportOptions().columns, 3);
});

test('导出控制器：normalizeStoryboard3DExportOptions 仅对视频模式加时间轴字段并夹取边界', () => {
  const still = normalizeStoryboard3DExportOptions({ mode: 'sequence-png' });
  assert.equal('videoStart' in still, false);
  assert.equal('videoTrack' in still, false);

  const video = normalizeStoryboard3DExportOptions({
    mode: 'sequence-video',
    videoStart: -5,
    videoEnd: 99999,
    videoTrack: '',
  });
  assert.equal(video.videoStart, 0);
  assert.equal(video.videoEnd, 3600);
  assert.equal(video.videoTrack, 'all');

  const cameraOnly = normalizeStoryboard3DExportOptions({
    mode: 'current-video',
    videoStart: 12.5,
    videoEnd: 40,
    videoTrack: 'camera',
  });
  assert.equal(cameraOnly.videoStart, 12.5);
  assert.equal(cameraOnly.videoEnd, 40);
  assert.equal(cameraOnly.videoTrack, 'camera');
});

test('导出控制器：normalizeStoryboard3DExportOptions 开关默认与显式关闭', () => {
  const defaults = normalizeStoryboard3DExportOptions();
  assert.equal(defaults.includeMetadata, true);
  assert.equal(defaults.includeThirds, false);
  assert.equal(defaults.returnToCanvas, true);

  const explicit = normalizeStoryboard3DExportOptions({
    includeMetadata: false,
    includeThirds: 1,
    returnToCanvas: false,
  });
  assert.equal(explicit.includeMetadata, false);
  assert.equal(explicit.includeThirds, true);
  assert.equal(explicit.returnToCanvas, false);
});

test('导出控制器：reconcileStoryboard3DExportSelection 按模式决定选中集合', () => {
  assert.deepEqual(reconcileStoryboard3DExportSelection('grid-png', ['a', 'b'], ['a']), []);
  assert.deepEqual(reconcileStoryboard3DExportSelection('sequence-png', ['a', 'b', 'c'], ['c', 'a']), [
    'c',
    'a',
  ]);
  assert.deepEqual(reconcileStoryboard3DExportSelection('sequence-video', ['a', 'b'], ['zz']), ['a']);
  assert.deepEqual(reconcileStoryboard3DExportSelection('current-png', ['a', 'b'], ['b']), ['b']);
  assert.deepEqual(reconcileStoryboard3DExportSelection('current-jpeg', ['a', 'b'], ['zz']), ['a']);
  assert.deepEqual(reconcileStoryboard3DExportSelection('current-png', [], []), []);
  assert.deepEqual(reconcileStoryboard3DExportSelection('sequence-png', [' a ', 'a'], [' a ']), ['a']);
});

test('导出控制器：createStoryboard3DExportGridSlots 优先放置已编排镜头并补空格', () => {
  assert.deepEqual(createStoryboard3DExportGridSlots(['a', 'b', 'c'], 4, ['c']), ['c', 'a', 'b', '']);
  assert.deepEqual(createStoryboard3DExportGridSlots(['a', 'b'], 4, []), ['a', 'b', '', '']);
  assert.deepEqual(createStoryboard3DExportGridSlots(['a', 'b'], 4, ['zz']), ['a', 'b', '', '']);
  assert.equal(createStoryboard3DExportGridSlots(['a'], 7, []).length, 9);
  assert.deepEqual(createStoryboard3DExportGridSlots([], 4, []), ['', '', '', '']);
});

test('导出控制器：placeStoryboard3DShotInGrid 覆盖空参与越界', () => {
  assert.deepEqual(placeStoryboard3DShotInGrid(['a', 'b'], { shotId: '', targetIndex: 1 }), ['a', 'b']);
  assert.deepEqual(placeStoryboard3DShotInGrid(['a', 'b'], { shotId: 'a', targetIndex: 9 }), ['a', 'b']);
  assert.deepEqual(placeStoryboard3DShotInGrid(['a', 'b'], { shotId: 'a', targetIndex: -1 }), ['a', 'b']);
});

test('导出控制器：placeStoryboard3DShotInGrid 在格间互换并在原位保持', () => {
  assert.deepEqual(placeStoryboard3DShotInGrid(['a', 'b', 'c', 'd'], { shotId: 'a', targetIndex: 2 }), [
    'c',
    'b',
    'a',
    'd',
  ]);
  assert.deepEqual(
    placeStoryboard3DShotInGrid(['a', 'b', 'c', 'd'], { shotId: 'a', sourceIndex: 0, targetIndex: 0 }),
    ['a', 'b', 'c', 'd'],
  );
  assert.deepEqual(
    placeStoryboard3DShotInGrid(['a', '', 'c', 'd'], { shotId: 'a', sourceIndex: 0, targetIndex: 1 }),
    ['', 'a', 'c', 'd'],
  );
});

test('导出控制器：placeStoryboard3DShotInGrid 把新镜头放入空位', () => {
  assert.deepEqual(placeStoryboard3DShotInGrid(['a', '', 'c', 'd'], { shotId: 'z', targetIndex: 1 }), [
    'a',
    'z',
    'c',
    'd',
  ]);
  // 源镜头在格内出现多次时按首个匹配交换，其余重复项原样保留。
  assert.deepEqual(placeStoryboard3DShotInGrid(['a', 'a', 'c', 'd'], { shotId: 'a', targetIndex: 3 }), [
    'd',
    'a',
    'c',
    'a',
  ]);
});

test('导出控制器：无 document.body 时 open 不建根节点', () => {
  const controller = createStoryboard3DExportController();
  assert.ok(controller instanceof Storyboard3DExportController);
  assert.equal(controller.open(), null);
  assert.equal(controller.root, null);
  assert.equal(controller.close(), false);
});

test('导出控制器：downloadResult 被包装为逐个文件落盘并汇总计数', async () => {
  const seen = [];
  const controller = new Storyboard3DExportController({
    downloadResult: async (payload, filename, destination) => {
      seen.push([payload, filename, destination]);
    },
  });
  const summary = await controller.downloadResults(
    [
      { blob: 'b1', filename: 'f1.png' },
      { blob: 'b2', filename: 'f2.png' },
    ],
    { destination: 'local' },
  );
  assert.deepEqual(summary, { success: true, canceled: false, count: 2 });
  assert.deepEqual(seen, [
    [{ blob: 'b1' }, 'f1.png', { destination: 'local' }],
    [{ blob: 'b2' }, 'f2.png', { destination: 'local' }],
  ]);
});

test('导出控制器：未注入下载实现时落到默认实现（函数形态）', () => {
  const controller = new Storyboard3DExportController();
  assert.equal(typeof controller.downloadResults, 'function');
  assert.equal(controller.busy, false);
  assert.equal(controller.exportDestinationOpen, false);
  assert.deepEqual(controller.selectedShotIds, []);
  assert.deepEqual(controller.gridSlots, []);
});

test('导出控制器：Escape 关闭对话框且阻止默认行为', () => {
  const controller = new Storyboard3DExportController();
  const events = { prevented: 0, stopped: 0 };
  controller._handleKeyDown({
    key: 'Escape',
    preventDefault: () => (events.prevented += 1),
    stopPropagation: () => (events.stopped += 1),
  });
  assert.equal(events.prevented, 1);
  assert.equal(events.stopped, 1);
});

test('导出控制器：destroy 在无根节点时是安全的空操作', () => {
  const controller = new Storyboard3DExportController();
  assert.doesNotThrow(() => controller.destroy());
  assert.equal(controller.busy, false);
  assert.equal(controller.root, null);
});
