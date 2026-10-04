export function resolveRendererScreenSize(el) {
  const box = el?.getBoundingClientRect?.(),
    width = Math.max(1, Number(box?.width) || Number(el?.clientWidth) || Number(el?.width) || 1),
    height = Math.max(1, Number(box?.height) || Number(el?.clientHeight) || Number(el?.height) || 1);
  return { width: width, height: height };
}
export function projectWorldPointToScreen(enabled, enabled2, value) {
  if (!enabled?.isVector3 || !enabled2) return null;
  (enabled2.updateMatrixWorld?.(), enabled2.updateProjectionMatrix?.());
  const box2 = enabled.clone().project(enabled2);
  if (!Number.isFinite(box2.x) || !Number.isFinite(box2.y) || !Number.isFinite(box2.z)) return null;
  const { width: width2, height: height2 } = resolveRendererScreenSize(value);
  return { x: (box2.x + 1) * 0.5 * width2, y: (1 - box2.y) * 0.5 * height2 };
}
export function resolveAxisScreenDragMetric({
  pivot: pivot,
  axisWorld: axisWorld,
  camera: camera,
  domElement: domElement,
  worldDistance: worldDistance = 1,
} = {}) {
  if (!pivot?.isVector3 || !axisWorld?.isVector3) return null;
  const box3 = projectWorldPointToScreen(pivot, camera, domElement),
    box4 = projectWorldPointToScreen(
      pivot.clone().add(
        axisWorld
          .clone()
          .normalize()
          .multiplyScalar(Math.max(0.01, Number(worldDistance) || 1)),
      ),
      camera,
      domElement,
    );
  if (!box3 || !box4) return null;
  const x = box4.x - box3.x,
    y = box4.y - box3.y,
    count = Math.hypot(x, y);
  if (!Number.isFinite(count) || count < 0.001) return null;
  return {
    axisScreenDirection: { x: x / count, y: y / count },
    screenReferencePixels: Math.max(32, Math.min(180, count)),
  };
}
