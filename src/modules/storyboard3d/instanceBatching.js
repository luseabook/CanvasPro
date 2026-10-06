import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
export const STORYBOARD_3D_INSTANCE_BATCH_MIN_COUNT = 3;
function finite(value, item = 0) {
  const key = Number(value);
  return Number.isFinite(key) ? key : item;
}
function vector3(index, result) {
  const data = Array.isArray(index) ? index : [];
  return new threeRuntime.Vector3(
    finite(data[0], result[0]),
    finite(data[1], result[1]),
    finite(data[2], result[2]),
  );
}
export function createStoryboard3DInstanceMatrix(box, options = null) {
  const vector32 = vector3(box?.position, [0, 0, 0]),
    box2 = vector3(box?.rotation, [0, 0, 0]),
    box3 = vector3(box?.scale, [1, 1, 1]);
  box3.set(Math.max(0.001, box3.x), Math.max(0.001, box3.y), Math.max(0.001, box3.z));
  const target = new threeRuntime.Matrix4().compose(
    vector32,
    new threeRuntime.Quaternion().setFromEuler(
      new threeRuntime.Euler(box2.x, box2.y, box2.z),
    ),
    box3,
  );
  if (options) target.multiply(options);
  return target;
}
export function findStoryboard3DInstancingTemplate(enabled) {
  if (!enabled?.traverse) return null;
  enabled.updateMatrixWorld?.(true);
  const list = [];
  let source = false;
  enabled.traverse((enabled2) => {
    if (enabled2?.isSkinnedMesh || enabled2?.morphTargetInfluences?.length) source = true;
    if (enabled2?.isMesh && !enabled2.isInstancedMesh) list.push(enabled2);
  });
  if (source || list.length !== 1) return null;
  const geometry = list[0];
  if (!geometry.geometry || !geometry.material) return null;
  return {
    geometry: geometry.geometry,
    material: geometry.material,
    sourceMatrix: geometry.matrixWorld.clone(),
  };
}
export function createStoryboard3DInstanceBatch({
  template: template,
  objects: objects = [],
  tint: tint = '',
  castShadow: castShadow = true,
  receiveShadow: receiveShadow = true,
} = {}) {
  if (!template?.geometry || !template?.material)
    throw new TypeError('An instancing template is required');
  const list2 = Array.isArray(objects) ? objects.filter((next) => next?.id) : [];
  if (list2.length === 0)
    throw new Error('At least one storyboard object is required');
  const list3 = Array.isArray(template.material) ? template.material : [template.material],
    ownedMaterials = [],
    current = list3.map((enabled3) => {
      if (!tint || !enabled3?.clone) return enabled3;
      const entry = enabled3.clone();
      return (entry.color?.set?.(tint), ownedMaterials.push(entry), entry);
    }),
    mesh = new threeRuntime.InstancedMesh(
      template.geometry,
      Array.isArray(template.material) ? current : current[0],
      list2.length,
    );
  return (
    (mesh.name = 'storyboard3d-instance-batch'),
    (mesh.castShadow = castShadow !== false),
    (mesh.receiveShadow = receiveShadow !== false),
    (mesh.userData.storyboardObjectIds = list2.map((record) => record.id)),
    list2.forEach((payload, handle) => {
      mesh.setMatrixAt(
        handle,
        createStoryboard3DInstanceMatrix(payload.transform, template.sourceMatrix),
      );
    }),
    (mesh.instanceMatrix.needsUpdate = true),
    mesh.computeBoundingBox?.(),
    mesh.computeBoundingSphere?.(),
    {
      mesh: mesh,
      objectIds: [...mesh.userData.storyboardObjectIds],
      sourceMatrix: template.sourceMatrix.clone(),
      ownedMaterials: ownedMaterials,
    }
  );
}
export function refreshStoryboard3DInstanceBatchBounds(state) {
  const enabled4 = state?.mesh;
  if (!enabled4) return false;
  return (enabled4.computeBoundingBox?.(), enabled4.computeBoundingSphere?.(), true);
}
export function updateStoryboard3DInstanceTransform(
  enabled5,
  config,
  scope,
  { recomputeBounds: recomputeBounds = true } = {},
) {
  const count = enabled5?.objectIds?.indexOf?.(config) ?? -1;
  if (count < 0 || !enabled5?.mesh?.setMatrixAt) return false;
  (enabled5.mesh.setMatrixAt(count, createStoryboard3DInstanceMatrix(scope, enabled5.sourceMatrix)),
    (enabled5.mesh.instanceMatrix.needsUpdate = true));
  if (recomputeBounds) refreshStoryboard3DInstanceBatchBounds(enabled5);
  return true;
}
export function disposeStoryboard3DInstanceBatch(input) {
  (input?.mesh?.removeFromParent?.(),
    input?.mesh?.dispose?.(),
    (input?.ownedMaterials || []).forEach((output) => output?.dispose?.()));
}
