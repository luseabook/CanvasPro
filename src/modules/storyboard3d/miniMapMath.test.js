import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStoryboard3DMiniMapCameraMarker,
  createStoryboard3DMiniMapProjection,
  createStoryboard3DMiniMapProjectionFromState,
  computeStoryboard3DMiniMapObjectDrag,
  hitTestStoryboard3DMiniMapObjects,
  moveStoryboard3DMiniMapWindow,
  normalizeStoryboard3DMiniMapState,
  panStoryboard3DMiniMapState,
  projectStoryboard3DTopViewFootprint,
  projectStoryboard3DWorldToMiniMap,
  projectStoryboard3DWorldToMiniMapRatio,
  setStoryboard3DMiniMapExpanded,
  unprojectStoryboard3DMiniMapToWorld,
  zoomStoryboard3DMiniMapState,
} from './miniMapMath.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} != ${b}`);

test('投影默认参数：世界 ±10、视口 240×180、内边距 12、等比缩放取较小轴', () => {
  const p = createStoryboard3DMiniMapProjection();
  assert.deepEqual(p.worldBounds, { minX: -10, maxX: 10, minZ: -10, maxZ: 10 });
  assert.deepEqual(p.viewport, { x: 0, y: 0, width: 240, height: 180 });
  assert.deepEqual(p.worldCenter, { x: 0, z: 0 });
  assert.equal(p.rotation, 0);
  assert.equal(p.originX, 120);
  assert.equal(p.originY, 90);
  close(p.scale, 7.8);
  close(p.contentWidth, 156);
  close(p.contentHeight, 156);
});

test('投影：padding 被夹到不超短边一半，内层宽高至少为 1', () => {
  const p = createStoryboard3DMiniMapProjection({
    viewport: { x: 0, y: 0, width: 240, height: 180 },
    padding: 999,
  });
  close(p.scale, 0.05);
  assert.ok(p.scale > 0);
  const tiny = createStoryboard3DMiniMapProjection({
    viewport: { x: 0, y: 0, width: 2, height: 2 },
    padding: 0,
  });
  assert.ok(tiny.scale > 0);
});

test('投影：maxX 至少比 minX 大 1e-6，非有限值回落默认', () => {
  const p = createStoryboard3DMiniMapProjection({
    worldBounds: { minX: 5, maxX: 5, minZ: Number.NaN, maxZ: 'x' },
  });
  assert.equal(p.worldBounds.minX, 5);
  assert.ok(p.worldBounds.maxX > 5);
  assert.equal(p.worldBounds.minZ, -10);
  assert.equal(p.worldBounds.maxZ, 10);
});

test('世界→迷你图：中心点在视口中心，旋转 90° 会交换两轴跨度', () => {
  const p = createStoryboard3DMiniMapProjection();
  assert.deepEqual(projectStoryboard3DWorldToMiniMap({ x: 0, z: 0 }, p), { x: 120, y: 90 });
  close(projectStoryboard3DWorldToMiniMap({ x: 10, z: 0 }, p).x, 198);
  close(projectStoryboard3DWorldToMiniMap({ x: 10, z: 0 }, p).y, 90);
  close(projectStoryboard3DWorldToMiniMap({ x: 0, z: 10 }, p).y, 168);

  const rotated = createStoryboard3DMiniMapProjection({
    worldBounds: { minX: -10, maxX: 10, minZ: -5, maxZ: 5 },
    rotation: Math.PI / 2,
  });
  close(rotated.scale, 7.8);
  const point = projectStoryboard3DWorldToMiniMap({ x: 0, z: 5 }, rotated);
  close(point.x, 81, 1e-6);
  close(point.y, 90, 1e-6);
});

test('世界→迷你图比率：按视口宽高归一', () => {
  const p = createStoryboard3DMiniMapProjection();
  const ratio = projectStoryboard3DWorldToMiniMapRatio({ x: 0, z: 0 }, p);
  close(ratio.x, 0.5);
  close(ratio.y, 0.5);
  const corner = projectStoryboard3DWorldToMiniMapRatio({ x: 10, z: -10 }, p);
  close(corner.x, 198 / 240);
  close(corner.y, 12 / 180);
});

test('俯视足迹：少于 3 个有效点返回 null，否则给归一化多边形', () => {
  const p = createStoryboard3DMiniMapProjection();
  assert.equal(
    projectStoryboard3DTopViewFootprint(
      [
        { x: 0, z: 0 },
        { x: 1, z: 1 },
      ],
      p,
    ),
    null,
  );
  const foot = projectStoryboard3DTopViewFootprint(
    [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: 10, z: 10 },
    ],
    p,
  );
  assert.ok(foot);
  close(foot.left, (120 - 78 - 0) / 240);
  close(foot.top, (90 - 78 - 0) / 180);
  close(foot.width, 156 / 240);
  close(foot.height, 156 / 180);
  assert.equal(foot.polygon.length, 3);
  close(foot.polygon[0].x, 0);
  close(foot.polygon[0].y, 0);
  close(foot.polygon[1].x, 1);
});

test('迷你图→世界：默认夹到世界边界，可关闭夹取', () => {
  const p = createStoryboard3DMiniMapProjection();
  const inside = unprojectStoryboard3DMiniMapToWorld({ x: 120, y: 90 }, p);
  close(inside.x, 0);
  close(inside.z, 0);
  assert.equal(inside.y, 0);
  const clamped = unprojectStoryboard3DMiniMapToWorld({ x: 1020, y: 90 }, p, { y: 2 });
  close(clamped.x, 10);
  assert.equal(clamped.y, 2);
  const free = unprojectStoryboard3DMiniMapToWorld({ x: 1020, y: 90 }, p, {
    clampToBounds: false,
  });
  close(free.x, 900 / 7.8);
});

test('迷你图→世界：旋转为投影旋转的逆变换', () => {
  const p = createStoryboard3DMiniMapProjection({ rotation: Math.PI / 2 });
  const back = unprojectStoryboard3DMiniMapToWorld(projectStoryboard3DWorldToMiniMap({ x: 4, z: -3 }, p), p);
  close(back.x, 4, 1e-6);
  close(back.z, -3, 1e-6);
});

test('相机标记：默认注视点落在 -Z，角度叠加投影旋转', () => {
  const p = createStoryboard3DMiniMapProjection();
  const marker = createStoryboard3DMiniMapCameraMarker({}, p);
  close(marker.x, 120);
  close(marker.y, 90);
  close(marker.angle, -Math.PI / 2);

  const rotated = createStoryboard3DMiniMapProjection({ rotation: Math.PI / 4 });
  const turned = createStoryboard3DMiniMapCameraMarker(
    { position: { x: 0, y: 0, z: 0 }, target: { x: 1, y: 0, z: 0 } },
    rotated,
  );
  close(turned.angle, Math.PI / 4);
});

test('命中测试：跳过不可见、取最近、默认半径 8', () => {
  const p = createStoryboard3DMiniMapProjection();
  const objects = [
    { id: 'far', transform: { position: [10, 0, 0] } },
    { id: 'hit', transform: { position: [0, 0, 0] } },
    { id: 'hidden', transform: { position: [0, 0, 0] }, visible: false },
  ];
  const hit = hitTestStoryboard3DMiniMapObjects({ x: 120, y: 90 }, objects, p);
  assert.equal(hit.objectId, 'hit');
  assert.equal(hit.distance, 0);

  const outside = hitTestStoryboard3DMiniMapObjects({ x: 0, y: 0 }, objects, p, { radius: 4 });
  assert.equal(outside, null);

  const byPosition = hitTestStoryboard3DMiniMapObjects(
    { x: 120, y: 90 },
    [{ id: '', position: { x: 0, z: 0 } }],
    p,
  );
  assert.equal(byPosition.objectId, '');
});

test('对象拖拽：保留 Y 并回写到数组位置', () => {
  const p = createStoryboard3DMiniMapProjection();
  const transform = { position: [0, 3, 0], scale: [1, 1, 1] };
  const next = computeStoryboard3DMiniMapObjectDrag({ x: 198, y: 90 }, { transform }, p);
  close(next.position[0], 10);
  assert.equal(next.position[1], 3);
  close(next.position[2], 0);
  assert.deepEqual(next.scale, [1, 1, 1]);
});

test('窗口移动：按容器尺寸夹取，负容器不产生位移', () => {
  const state = { windowPosition: { x: 5, y: 5 }, width: 240, height: 180 };
  const moved = moveStoryboard3DMiniMapWindow(
    state,
    { x: 10, y: -20 },
    {
      width: 300,
      height: 400,
    },
  );
  assert.deepEqual(moved.windowPosition, { x: 15, y: 0 });
  const pinned = moveStoryboard3DMiniMapWindow(
    state,
    { x: 999, y: 999 },
    {
      width: 100,
      height: 100,
    },
  );
  assert.deepEqual(pinned.windowPosition, { x: 0, y: 0 });
});

test('状态归一化：默认值、夹取区间与折叠布尔', () => {
  assert.deepEqual(normalizeStoryboard3DMiniMapState(), {
    collapsed: false,
    windowPosition: { x: 16, y: 16 },
    width: 240,
    height: 180,
    zoom: 1,
    pan: { x: 0, z: 0 },
  });
  const clamped = normalizeStoryboard3DMiniMapState({
    collapsed: 'yes',
    width: 1,
    height: 9999,
    zoom: 99,
  });
  assert.equal(clamped.collapsed, false);
  assert.equal(clamped.width, 160);
  assert.equal(clamped.height, 480);
  assert.equal(clamped.zoom, 8);
});

test('展开状态：仅严格 true 视为折叠', () => {
  assert.equal(setStoryboard3DMiniMapExpanded({}, true).collapsed, false);
  assert.equal(setStoryboard3DMiniMapExpanded({}, false).collapsed, true);
  assert.equal(setStoryboard3DMiniMapExpanded({ collapsed: true }, 0).collapsed, true);
});

test('缩放：按倍率相乘后夹到 0.25–8，非法倍率回落 1', () => {
  close(zoomStoryboard3DMiniMapState({ zoom: 2 }, 2).zoom, 4);
  close(zoomStoryboard3DMiniMapState({ zoom: 2 }, 'x').zoom, 2);
  close(zoomStoryboard3DMiniMapState({ zoom: 2 }, 0).zoom, 0.25);
  close(zoomStoryboard3DMiniMapState({ zoom: 7 }, 5).zoom, 8);
});

test('平移：按比例尺换算位移', () => {
  const panned = panStoryboard3DMiniMapState(
    { pan: { x: 1, z: 2 } },
    { x: 10, y: -20 },
    {
      scale: 2,
    },
  );
  assert.deepEqual(panned.pan, { x: -4, z: 12 });
  const degenerate = panStoryboard3DMiniMapState({}, { x: 8, y: 8 }, { scale: 0 });
  close(degenerate.pan.x, -8e8);
  close(degenerate.pan.z, -8e8);
});

test('由状态构造投影：平移与缩放改写有效世界边界', () => {
  const p = createStoryboard3DMiniMapProjectionFromState({
    state: { zoom: 2, pan: { x: 1, z: -1 } },
  });
  assert.deepEqual(p.worldBounds, { minX: -4, maxX: 6, minZ: -6, maxZ: 4 });
  close(p.scale, Math.min(216 / 10, 156 / 10));
});
