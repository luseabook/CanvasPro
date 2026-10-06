function finite(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function clamp(index, result, data) {
  return Math.max(result, Math.min(data, index));
}
function rotateMiniMapVector(x2, options, target = 0) {
  const finite2 = finite(target),
    source = Math.cos(finite2),
    next = Math.sin(finite2);
  return {
    x: x2 * source - options * next,
    z: x2 * next + options * source,
  };
}
export function createStoryboard3DMiniMapProjection({
  worldBounds: worldBounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 },
  viewport: viewport = { x: 0, y: 0, width: 240, height: 180 },
  padding: padding = 12,
  center: center = null,
  rotation: rotation = 0,
} = {}) {
  const x3 = finite(worldBounds.minX, -10),
    x4 = Math.max(x3 + 0.000001, finite(worldBounds.maxX, 10)),
    z2 = finite(worldBounds.minZ, -10),
    z3 = Math.max(z2 + 0.000001, finite(worldBounds.maxZ, 10)),
    viewport2 = {
      x: finite(viewport.x),
      y: finite(viewport.y),
      width: Math.max(1, finite(viewport.width, 240)),
      height: Math.max(1, finite(viewport.height, 180)),
    },
    clamp2 = clamp(finite(padding, 12), 0, Math.min(viewport2.width, viewport2.height) / 2),
    current = Math.max(1, viewport2.width - clamp2 * 2),
    entry = Math.max(1, viewport2.height - clamp2 * 2),
    worldCenter = {
      x: finite(center?.x, (x3 + x4) / 2),
      z: finite(center?.z, (z2 + z3) / 2),
    },
    rotation2 = finite(rotation),
    list = [
      { x: x3, z: z2 },
      { x: x3, z: z3 },
      { x: x4, z: z2 },
      { x: x4, z: z3 },
    ].map((box) =>
      rotateMiniMapVector(box.x - worldCenter.x, box.z - worldCenter.z, rotation2),
    ),
    record = Math.min(...list.map((box2) => box2.x)),
    payload = Math.max(...list.map((box3) => box3.x)),
    handle = Math.min(...list.map((state) => state.z)),
    config = Math.max(...list.map((scope) => scope.z)),
    input = Math.max(0.000001, payload - record),
    output = Math.max(0.000001, config - handle),
    scale = Math.min(current / input, entry / output),
    contentWidth = input * scale,
    contentHeight = output * scale;
  return {
    worldBounds: { minX: x3, maxX: x4, minZ: z2, maxZ: z3 },
    viewport: viewport2,
    scale: scale,
    worldCenter: worldCenter,
    rotation: rotation2,
    originX: viewport2.x + viewport2.width / 2,
    originY: viewport2.y + viewport2.height / 2,
    contentWidth: contentWidth,
    contentHeight: contentHeight,
  };
}
export function projectStoryboard3DWorldToMiniMap(box4, x5) {
  const box5 = rotateMiniMapVector(
    finite(box4?.x) - finite(x5?.worldCenter?.x),
    finite(box4?.z) - finite(x5?.worldCenter?.z),
    x5?.rotation,
  );
  return {
    x: x5.originX + box5.x * x5.scale,
    y: x5.originY + box5.z * x5.scale,
  };
}
export function projectStoryboard3DWorldToMiniMapRatio(value2, value3) {
  const box6 = projectStoryboard3DWorldToMiniMap(value2, value3),
    box7 = value3?.viewport || {},
    value4 = Math.max(1e-8, finite(box7.width, 1)),
    value5 = Math.max(1e-8, finite(box7.height, 1));
  return {
    x: (box6.x - finite(box7.x)) / value4,
    y: (box6.y - finite(box7.y)) / value5,
  };
}
export function projectStoryboard3DTopViewFootprint(value6, value7) {
  const polygon = (Array.isArray(value6) ? value6 : [])
    .map((value8) => projectStoryboard3DWorldToMiniMapRatio(value8, value7))
    .filter((box8) => Number.isFinite(box8.x) && Number.isFinite(box8.y));
  if (polygon.length < 3) return null;
  const left = Math.min(...polygon.map((box9) => box9.x)),
    value9 = Math.max(...polygon.map((box10) => box10.x)),
    top = Math.min(...polygon.map((box11) => box11.y)),
    value10 = Math.max(...polygon.map((box12) => box12.y)),
    width = Math.max(1e-8, value9 - left),
    height = Math.max(1e-8, value10 - top);
  return {
    left: left,
    top: top,
    width: width,
    height: height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    polygon: polygon.map((box13) => ({
      x: (box13.x - left) / width,
      y: (box13.y - top) / height,
    })),
  };
}
export function unprojectStoryboard3DMiniMapToWorld(
  box14,
  box15,
  { y: y = 0, clampToBounds: clampToBounds = true } = {},
) {
  const box16 = {
      x: (finite(box14?.x) - box15.originX) / box15.scale,
      z: (finite(box14?.y) - box15.originY) / box15.scale,
    },
    box17 = rotateMiniMapVector(box16.x, box16.z, -finite(box15?.rotation));
  let x6 = finite(box15?.worldCenter?.x) + box17.x,
    z4 = finite(box15?.worldCenter?.z) + box17.z;
  return (
    clampToBounds &&
      ((x6 = clamp(x6, box15.worldBounds.minX, box15.worldBounds.maxX)),
      (z4 = clamp(z4, box15.worldBounds.minZ, box15.worldBounds.maxZ))),
    { x: x6, y: finite(y), z: z4 }
  );
}
export function createStoryboard3DMiniMapCameraMarker(event, value11) {
  const x7 = event?.position || { x: 0, y: 0, z: 0 },
    box18 = event?.target || { x: x7.x, y: x7.y, z: x7.z - 1 },
    finite3 = finite(box18.x) - finite(x7.x),
    finite4 = finite(box18.z) - finite(x7.z);
  return {
    ...projectStoryboard3DWorldToMiniMap(x7, value11),
    angle: Math.atan2(finite4, finite3) + finite(value11?.rotation),
  };
}
export function hitTestStoryboard3DMiniMapObjects(box19, value12, value13, { radius: radius = 8 } = {}) {
  const value14 = Math.max(1, finite(radius, 8));
  let enabled = null;
  for (const x8 of value12 || []) {
    if (x8?.visible === false) continue;
    const point = projectStoryboard3DWorldToMiniMap(
        {
          x: x8?.transform?.position?.[0] ?? x8?.position?.x,
          z: x8?.transform?.position?.[2] ?? x8?.position?.z,
        },
        value13,
      ),
      distance = Math.hypot(point.x - finite(box19?.x), point.y - finite(box19?.y));
    distance <= value14 &&
      (!enabled || distance < enabled.distance) &&
      (enabled = { objectId: String(x8.id || ''), distance: distance, point: point });
  }
  return enabled;
}
export function computeStoryboard3DMiniMapObjectDrag(value15, args, value16) {
  const y2 = args?.transform?.position || [0, 0, 0],
    box20 = unprojectStoryboard3DMiniMapToWorld(value15, value16, { y: y2[1] });
  return { ...args.transform, position: [box20.x, box20.y, box20.z] };
}
export function moveStoryboard3DMiniMapWindow(value17, box21, box22 = {}) {
  const box23 = normalizeStoryboard3DMiniMapState(value17),
    value18 = Math.max(0, finite(box22.width, box23.width) - box23.width),
    value19 = Math.max(0, finite(box22.height, box23.height) - box23.height);
  return {
    ...box23,
    windowPosition: {
      x: clamp(box23.windowPosition.x + finite(box21?.x), 0, value18),
      y: clamp(box23.windowPosition.y + finite(box21?.y), 0, value19),
    },
  };
}
export function normalizeStoryboard3DMiniMapState(collapsed = {}) {
  return {
    collapsed: collapsed.collapsed === true,
    windowPosition: {
      x: finite(collapsed.windowPosition?.x, 16),
      y: finite(collapsed.windowPosition?.y, 16),
    },
    width: clamp(finite(collapsed.width, 240), 160, 640),
    height: clamp(finite(collapsed.height, 180), 120, 480),
    zoom: clamp(finite(collapsed.zoom, 1), 0.25, 8),
    pan: { x: finite(collapsed.pan?.x), z: finite(collapsed.pan?.z) },
  };
}
export function setStoryboard3DMiniMapExpanded(value20, collapsed2) {
  return { ...normalizeStoryboard3DMiniMapState(value20), collapsed: collapsed2 !== true };
}
export function zoomStoryboard3DMiniMapState(value21, value22) {
  const box24 = normalizeStoryboard3DMiniMapState(value21);
  return {
    ...box24,
    zoom: clamp(box24.zoom * Math.max(0.01, finite(value22, 1)), 0.25, 8),
  };
}
export function panStoryboard3DMiniMapState(value23, box25, box26) {
  const x9 = normalizeStoryboard3DMiniMapState(value23),
    value24 = Math.max(1e-8, finite(box26?.scale, 1));
  return {
    ...x9,
    pan: {
      x: x9.pan.x - finite(box25?.x) / value24,
      z: x9.pan.z - finite(box25?.y) / value24,
    },
  };
}
export function createStoryboard3DMiniMapProjectionFromState({
  worldBounds: worldBounds2,
  viewport: viewport3,
  padding: padding2,
  state: state2,
} = {}) {
  const box27 = normalizeStoryboard3DMiniMapState(state2),
    value25 = {
      minX: finite(worldBounds2?.minX, -10),
      maxX: finite(worldBounds2?.maxX, 10),
      minZ: finite(worldBounds2?.minZ, -10),
      maxZ: finite(worldBounds2?.maxZ, 10),
    },
    minX = (value25.minX + value25.maxX) / 2 + box27.pan.x,
    minZ = (value25.minZ + value25.maxZ) / 2 + box27.pan.z,
    value26 = Math.max(0.000001, (value25.maxX - value25.minX) / 2 / box27.zoom),
    value27 = Math.max(0.000001, (value25.maxZ - value25.minZ) / 2 / box27.zoom);
  return createStoryboard3DMiniMapProjection({
    worldBounds: {
      minX: minX - value26,
      maxX: minX + value26,
      minZ: minZ - value27,
      maxZ: minZ + value27,
    },
    viewport: viewport3,
    padding: padding2,
  });
}
