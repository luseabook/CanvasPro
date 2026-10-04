import {
  applyOrbitDelta,
  applyPanoramaLookDelta,
  applyPanoramaZoomDelta,
  applySceneDollyDelta,
  applyScenePanDelta,
  applySceneZoomDelta,
} from '../../core/panoramaSceneMath.js';
import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
const MOVE_THRESHOLD = 3;
function hasFiniteQuaternion(box) {
  return (
    Number.isFinite(Number(box?.x)) &&
    Number.isFinite(Number(box?.y)) &&
    Number.isFinite(Number(box?.z)) &&
    Number.isFinite(Number(box?.w))
  );
}
function cloneObjectPose(box2) {
  const scale = Number.isFinite(box2?.scale)
      ? Number(box2.scale) || 1
      : box2?.scale &&
          Number.isFinite(box2.scale.x) &&
          Number.isFinite(box2.scale.y) &&
          Number.isFinite(box2.scale.z)
        ? {
            x: Number(box2.scale.x) || 1,
            y: Number(box2.scale.y) || 1,
            z: Number(box2.scale.z) || 1,
          }
        : 1,
    rotation = {
      x: Number(box2?.rotation?.x) || 0,
      y: Number(box2?.rotation?.y) || 0,
      z: Number(box2?.rotation?.z) || 0,
    },
    x2 = hasFiniteQuaternion(box2?.quaternion)
      ? new threeRuntime['Quaternion'](
          Number(box2.quaternion.x),
          Number(box2.quaternion.y),
          Number(box2.quaternion.z),
          Number(box2.quaternion.w),
        ).normalize()
      : new threeRuntime['Quaternion']().setFromEuler(
          new threeRuntime.Euler(rotation.x, rotation.y, rotation.z, 'XYZ'),
        );
  return {
    position: {
      x: Number(box2?.position?.x) || 0,
      y: Number(box2?.position?.y) || 0,
      z: Number(box2?.position?.z) || 0,
    },
    rotation: rotation,
    quaternion: { x: x2.x, y: x2.y, z: x2.z, w: x2.w },
    fov: Number(box2?.fov) || 58,
    scale: scale,
  };
}
function toScaleVector(box3) {
  if (Number.isFinite(box3)) {
    const x3 = Math.max(0.01, Number(box3) || 1);
    return { x: x3, y: x3, z: x3 };
  }
  if (box3 && Number.isFinite(box3.x) && Number.isFinite(box3.y) && Number.isFinite(box3.z))
    return {
      x: Math.max(0.01, Number(box3.x) || 1),
      y: Math.max(0.01, Number(box3.y) || 1),
      z: Math.max(0.01, Number(box3.z) || 1),
    };
  return { x: 1, y: 1, z: 1 };
}
function toCompatibleScale(value) {
  const box4 = toScaleVector(value),
    item = 0.0001;
  if (Math.abs(box4.x - box4.y) < item && Math.abs(box4.y - box4.z) < item)
    return (box4.x + box4.y + box4.z) / 3;
  return box4;
}
function toVector3(box5) {
  return new threeRuntime['Vector3'](Number(box5?.x) || 0, Number(box5?.y) || 0, Number(box5?.z) || 0);
}
function fromVector3(x4) {
  return { x: x4.x, y: x4.y, z: x4.z };
}
function rotatePoseAroundWorldAxis(key, index, result, data) {
  const toVector32 = toVector3(index);
  if (toVector32.lengthSq() < 1e-8 || !Number.isFinite(result) || Math.abs(result) < 1e-8) {
    const quaternion = hasFiniteQuaternion(key?.quaternion)
      ? {
          x: Number(key.quaternion.x) || 0,
          y: Number(key.quaternion.y) || 0,
          z: Number(key.quaternion.z) || 0,
          w: Number(key.quaternion.w) || 1,
        }
      : undefined;
    return {
      position: {
        x: Number(key?.position?.x) || 0,
        y: Number(key?.position?.y) || 0,
        z: Number(key?.position?.z) || 0,
      },
      rotation: {
        x: Number(key?.rotation?.x) || 0,
        y: Number(key?.rotation?.y) || 0,
        z: Number(key?.rotation?.z) || 0,
      },
      quaternion: quaternion,
    };
  }
  toVector32.normalize();
  const toVector33 = toVector3(data),
    toVector34 = toVector3(key?.position),
    hasFiniteQuaternion2 = hasFiniteQuaternion(key?.quaternion)
      ? new threeRuntime.Quaternion(
          Number(key.quaternion.x) || 0,
          Number(key.quaternion.y) || 0,
          Number(key.quaternion.z) || 0,
          Number(key.quaternion.w) || 1,
        ).normalize()
      : new threeRuntime['Quaternion']().setFromEuler(
          new threeRuntime['Euler'](
            Number(key?.rotation?.x) || 0,
            Number(key?.rotation?.y) || 0,
            Number(key?.rotation?.z) || 0,
            'XYZ',
          ),
        ),
    options = new threeRuntime['Quaternion']().setFromAxisAngle(toVector32, result),
    target = toVector34.sub(toVector33).applyQuaternion(options).add(toVector33),
    x5 = options.clone().multiply(hasFiniteQuaternion2),
    x6 = new threeRuntime['Euler']().setFromQuaternion(x5, 'XYZ');
  return {
    position: fromVector3(target),
    rotation: { x: x6.x, y: x6.y, z: x6.z },
    quaternion: { x: x5.x, y: x5.y, z: x5.z, w: x5.w },
  };
}
function scalePositionAroundPivot(source, next, current, enabled = null) {
  const entry = Number.isFinite(current) ? current : 1,
    toVector35 = toVector3(next),
    toVector36 = toVector3(source),
    record = toVector36.sub(toVector35);
  if (!enabled) return fromVector3(record.multiplyScalar(entry).add(toVector35));
  const toVector37 = toVector3(enabled);
  if (toVector37.lengthSq() < 1e-8) return fromVector3(record.add(toVector35));
  toVector37.normalize();
  const payload = toVector37.clone().multiplyScalar(record.dot(toVector37)),
    handle = record.clone().sub(payload);
  return fromVector3(handle.add(payload.multiplyScalar(entry)).add(toVector35));
}
function getClientRectFromPoints(state, config, scope, input) {
  return {
    left: Math.min(state, scope),
    top: Math.min(config, input),
    right: Math.max(state, scope),
    bottom: Math.max(config, input),
  };
}
function getLocalRectFromPoints(output, value2, value3, value4) {
  return {
    left: Math.min(output, value3),
    top: Math.min(value2, value4),
    width: Math.abs(value3 - output),
    height: Math.abs(value4 - value2),
  };
}
function addVector3Like(box6, box7) {
  return {
    x: (Number(box6?.x) || 0) + (Number(box7?.x) || 0),
    y: (Number(box6?.y) || 0) + (Number(box7?.y) || 0),
    z: (Number(box6?.z) || 0) + (Number(box7?.z) || 0),
  };
}
export function measureSelectionBoxLocalRect(el, value5, value6, value7, value8) {
  const box8 = el?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 },
    value9 = Math.max(1, Number(el?.offsetWidth) || box8.width || 1),
    value10 = Math.max(1, Number(el?.offsetHeight) || box8.height || 1),
    count = box8.width > 0 ? box8.width / value9 : 1,
    count2 = box8.height > 0 ? box8.height / value10 : 1,
    value11 = count > 0 ? count : 1,
    value12 = count2 > 0 ? count2 : 1;
  return {
    left: (Math.min(value5, value7) - box8.left) / value11,
    top: (Math.min(value6, value8) - box8.top) / value12,
    width: Math.abs(value7 - value5) / value11,
    height: Math.abs(value8 - value6) / value12,
  };
}
export class PanoramaSceneInteraction {
  constructor({
    viewportEl: viewportEl,
    overlayEl: overlayEl,
    bridge: bridge,
    getSceneState: getSceneState,
    onViewCommit: onViewCommit,
    onObjectCommit: onObjectCommit,
    onObjectBatchCommit: onObjectBatchCommit,
    onSelectionChange: onSelectionChange,
    onSelectionBatchChange: onSelectionBatchChange,
    onSelectionObjectsChange: onSelectionObjectsChange,
    onSelectionClear: onSelectionClear,
  } = {}) {
    ((this.viewportEl = viewportEl),
      (this.overlayEl = overlayEl || viewportEl),
      (this.bridge = bridge),
      (this.getSceneState = getSceneState),
      (this.onViewCommit = onViewCommit),
      (this.onObjectCommit = onObjectCommit),
      (this.onObjectBatchCommit = onObjectBatchCommit),
      (this.onSelectionChange = onSelectionChange),
      (this.onSelectionBatchChange = onSelectionBatchChange),
      (this.onSelectionObjectsChange = onSelectionObjectsChange),
      (this.onSelectionClear = onSelectionClear),
      (this._gesture = null),
      (this._selectionBoxEl = null),
      (this._clearDraftRafId = null),
      (this._queuedDraftClearTasks = []),
      (this._handlePointerDown = this._handlePointerDown.bind(this)),
      (this._handlePointerMove = this._handlePointerMove.bind(this)),
      (this._handlePointerUp = this._handlePointerUp.bind(this)),
      (this._handlePointerLeave = this._handlePointerLeave.bind(this)),
      (this._handleWheel = this._handleWheel.bind(this)),
      (this._handleContextMenu = this._handleContextMenu.bind(this)));
  }
  ['attach']() {
    if (!this.viewportEl) return;
    (this.viewportEl.addEventListener('pointerdown', this._handlePointerDown),
      this.viewportEl.addEventListener('pointermove', this._handlePointerMove),
      this.viewportEl.addEventListener('pointerup', this._handlePointerUp),
      this.viewportEl.addEventListener('pointercancel', this._handlePointerUp),
      this.viewportEl.addEventListener('pointerleave', this._handlePointerLeave),
      this.viewportEl.addEventListener('wheel', this._handleWheel, { passive: false }),
      this.viewportEl.addEventListener('contextmenu', this._handleContextMenu));
  }
  ['detach']() {
    if (!this.viewportEl) return;
    (this.viewportEl.removeEventListener('pointerdown', this._handlePointerDown),
      this.viewportEl.removeEventListener('pointermove', this._handlePointerMove),
      this.viewportEl.removeEventListener('pointerup', this._handlePointerUp),
      this.viewportEl.removeEventListener('pointercancel', this._handlePointerUp),
      this.viewportEl.removeEventListener('pointerleave', this._handlePointerLeave),
      this.viewportEl.removeEventListener('wheel', this._handleWheel),
      this.viewportEl.removeEventListener('contextmenu', this._handleContextMenu),
      this._cancelQueuedDraftClear(),
      this._clearSelectionBox(),
      this.bridge?.clearGizmoHandleState?.(),
      this._clearGizmoMoveGuideLine(),
      this.bridge?.clearAllDrafts?.());
  }
  ['_isEditing'](value13) {
    return value13?.ui?.isEditing === true;
  }
  ['_isPanoramaMode'](value14) {
    return value14?.type === 'panorama-360';
  }
  ['_syncControlsByMode'](value15) {
    const enabled2 = this.bridge?.controls || this.bridge?._controls;
    if (!enabled2) return;
    ('enablePan' in enabled2 && (enabled2.enablePan = value15 ? false : true),
      'enableRotate' in enabled2 && (enabled2.enableRotate = true));
  }
  ['_stopEvent'](event, event2 = {}) {
    event.stopPropagation();
    if (event2.preventDefault) event.preventDefault();
  }
  ['_createBaseView'](sceneState) {
    if (sceneState.mode === 'panorama') {
      const panoramaView = { ...sceneState.viewport.panoramaView };
      return { kind: 'panorama-default', sceneState: sceneState, panoramaView: panoramaView };
    }
    const currentPose = this.bridge?.readCurrentViewPose?.() || null,
      sceneView = { ...sceneState.viewport.sceneView };
    return { kind: 'scene-default', sceneState: sceneState, sceneView: sceneView, currentPose: currentPose };
  }
  ['_getObjectByPick'](value16, enabled3) {
    if (!enabled3) return null;
    if (enabled3.objectType !== 'cube' && enabled3.objectType !== 'mannequin') return null;
    const list = enabled3.objectType === 'cube' ? value16.cubes : value16.mannequins;
    return list.find((item2) => item2.id === enabled3.objectId) || null;
  }
  ['_getSelectedObject'](value17) {
    const objectType = value17?.selection?.selectedObjectType,
      objectId = value17?.selection?.selectedObjectId;
    if (!objectType || !objectId) return null;
    if (objectType !== 'cube' && objectType !== 'mannequin') return null;
    const list2 = objectType === 'cube' ? value17.cubes : value17.mannequins,
      item3 = list2.find((item4) => item4.id === objectId) || null;
    if (!item3) return null;
    return { objectType: objectType, objectId: objectId, item: item3 };
  }
  ['_findGroupByMember'](value18, value19, enabled4) {
    if (value19 !== 'mannequin' || !enabled4) return null;
    const list3 = Array.isArray(value18?.groups) ? value18.groups : [];
    return (
      list3.find((item5) => Array.isArray(item5.memberIds) && item5.memberIds.includes(enabled4)) || null
    );
  }
  ['_resolveTargetsByIds'](value20, objectType2, value21) {
    const list4 = Array.isArray(value21) ? value21 : [];
    if (!objectType2 || list4.length === 0) return [];
    if (objectType2 !== 'cube' && objectType2 !== 'mannequin') return [];
    const list5 = objectType2 === 'cube' ? value20.cubes : value20.mannequins,
      map = new Set(list4);
    return list5
      .filter((item6) => map.has(item6.id))
      .map((objectId2) => ({ objectType: objectType2, objectId: objectId2.id, item: objectId2 }));
  }
  ['_collectSelectionObjects'](value22) {
    const list6 = Array.isArray(value22?.cubes) ? value22.cubes : [],
      list7 = Array.isArray(value22?.mannequins) ? value22.mannequins : [],
      map2 = new Set(list6.map((item7) => item7.id)),
      map3 = new Set(list7.map((item8) => item8.id)),
      map4 = new Set(),
      list8 = [],
      handler = (objectType3, value23) => {
        if (objectType3 !== 'cube' && objectType3 !== 'mannequin') return;
        const objectId3 = String(value23 || '').trim();
        if (!objectId3) return;
        const enabled5 = objectType3 === 'cube' ? map2.has(objectId3) : map3.has(objectId3);
        if (!enabled5) return;
        const value24 = objectType3 + ':' + objectId3;
        if (map4.has(value24)) return;
        (map4.add(value24), list8.push({ objectType: objectType3, objectId: objectId3 }));
      },
      list9 = Array.isArray(value22?.selection?.selectedObjects) ? value22.selection.selectedObjects : [];
    list9.forEach((item9) => {
      handler(item9?.objectType, item9?.objectId);
    });
    if (list8.length > 0) return list8;
    const value25 = value22?.selection?.selectedGroupId || null;
    if (value25) {
      const value26 = (value22?.groups || []).find((item10) => item10.id === value25);
      if (Array.isArray(value26?.memberIds) && value26.memberIds.length > 0) {
        value26.memberIds.forEach((item11) => {
          handler('mannequin', item11);
        });
        if (list8.length > 0) return list8;
      }
    }
    const enabled6 =
      value22?.selection?.selectedObjectType === 'cube' ||
      value22?.selection?.selectedObjectType === 'mannequin'
        ? value22.selection.selectedObjectType
        : null;
    if (!enabled6) return list8;
    const list10 = Array.isArray(value22?.selection?.selectedObjectIds)
      ? value22.selection.selectedObjectIds
      : [];
    if (list10.length > 0) {
      list10.forEach((item12) => {
        handler(enabled6, item12);
      });
      if (list8.length > 0) return list8;
    }
    return (handler(enabled6, value22?.selection?.selectedObjectId || null), list8);
  }
  ['_getSelectionTargets'](value27) {
    const list11 = this._collectSelectionObjects(value27);
    if (list11.length > 0) {
      const map5 = new Map(
          (Array.isArray(value27?.cubes) ? value27.cubes : []).map((item13) => [item13.id, item13]),
        ),
        map6 = new Map(
          (Array.isArray(value27?.mannequins) ? value27.mannequins : []).map((item14) => [item14.id, item14]),
        );
      return list11
        .map((objectType4) => {
          const item15 =
            objectType4.objectType === 'cube'
              ? map5.get(objectType4.objectId)
              : map6.get(objectType4.objectId);
          if (!item15) return null;
          return { objectType: objectType4.objectType, objectId: objectType4.objectId, item: item15 };
        })
        .filter(Boolean);
    }
    return [];
  }
  ['_ensureSelectionBox']() {
    if (this._selectionBoxEl) return this._selectionBoxEl;
    const value28 = document.createElement('div');
    return (
      (value28.className = 'panorama-scene-selection-box'),
      this.overlayEl?.appendChild(value28),
      (this._selectionBoxEl = value28),
      value28
    );
  }
  ['_updateSelectionBox'](value29, value30, value31, value32) {
    const box9 = getLocalRectFromPoints(value29, value30, value31, value32),
      el2 = this._ensureSelectionBox();
    ((el2.style.left = box9.left + 'px'),
      (el2.style.top = box9.top + 'px'),
      (el2.style.width = box9.width + 'px'),
      (el2.style.height = box9.height + 'px'),
      el2.classList.add('is-visible'));
  }
  ['_getLocalPoint'](event3) {
    const box10 = this.viewportEl?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 },
      value33 = Math.max(1, Number(this.viewportEl?.offsetWidth) || box10.width || 1),
      value34 = Math.max(1, Number(this.viewportEl?.offsetHeight) || box10.height || 1),
      count3 = box10.width > 0 ? box10.width / value33 : 1,
      count4 = box10.height > 0 ? box10.height / value34 : 1,
      value35 = count3 > 0 ? count3 : 1,
      value36 = count4 > 0 ? count4 : 1;
    return {
      x: (event3?.clientX - box10.left) / value35,
      y: (event3?.clientY - box10.top) / value36,
    };
  }
  ['_clearSelectionBox']() {
    (this._selectionBoxEl?.remove(), (this._selectionBoxEl = null));
  }
  ['_queueDraftClear'](value37) {
    if (typeof value37 !== 'function') return;
    this._queuedDraftClearTasks.push(value37);
    if (this._clearDraftRafId != null) return;
    this._clearDraftRafId = requestAnimationFrame(() => {
      this._clearDraftRafId = null;
      const list12 = this._queuedDraftClearTasks.splice(0, this._queuedDraftClearTasks.length);
      list12.forEach((handler2) => {
        try {
          handler2();
        } catch {}
      });
    });
  }
  ['_cancelQueuedDraftClear']() {
    (this._clearDraftRafId != null &&
      (cancelAnimationFrame(this._clearDraftRafId), (this._clearDraftRafId = null)),
      (this._queuedDraftClearTasks.length = 0));
  }
  ['_beginObjectMove'](pointerId, value38, objectType5, value39) {
    const x7 = cloneObjectPose(value39),
      x8 = this.bridge?.intersectGround?.(pointerId.clientX, pointerId.clientY, 0) || {
        x: x7.position.x,
        y: 0,
        z: x7.position.z,
      };
    return {
      type: 'object-move',
      pointerId: pointerId.pointerId,
      startX: pointerId.clientX,
      startY: pointerId.clientY,
      objectType: objectType5.objectType,
      objectId: objectType5.objectId,
      basePose: x7,
      moved: false,
      offset: { x: x8.x - x7.position.x, z: x8.z - x7.position.z },
    };
  }
  ['_beginBatchMove'](pointerId2, value40) {
    const list13 = Array.isArray(value40) ? value40 : [];
    if (list13.length === 0) return null;
    const entries = list13.map((objectType6) => ({
        objectType: objectType6.objectType,
        objectId: objectType6.objectId,
        pose: cloneObjectPose(objectType6.item),
      })),
      x9 = entries.reduce(
        (box11, value41) => {
          return ((box11.x += value41.pose.position.x), (box11.z += value41.pose.position.z), box11);
        },
        { x: 0, z: 0 },
      );
    ((x9.x /= entries.length), (x9.z /= entries.length));
    const x10 = this.bridge?.intersectGround?.(pointerId2.clientX, pointerId2.clientY, 0) || {
      x: x9.x,
      y: 0,
      z: x9.z,
    };
    return {
      type: 'object-move-batch',
      pointerId: pointerId2.pointerId,
      startX: pointerId2.clientX,
      startY: pointerId2.clientY,
      moved: false,
      baseCenter: x9,
      pointerOffset: { x: x10.x - x9.x, z: x10.z - x9.z },
      entries: entries.map((x11) => ({
        ...x11,
        offset: { x: x11.pose.position.x - x9.x, z: x11.pose.position.z - x9.z },
      })),
    };
  }
  ['_beginGizmoMove'](clientX, value42, handleKey) {
    const list14 = this._getSelectionTargets(value42);
    if (!list14.length) return null;
    const from2 = this.bridge?.beginMoveGizmoDrag?.({
      handleKey: handleKey?.handleKey,
      clientX: clientX.clientX,
      clientY: clientX.clientY,
    });
    if (!from2) return null;
    const entries2 = list14.map((objectType7) => ({
      objectType: objectType7.objectType,
      objectId: objectType7.objectId,
      basePose: cloneObjectPose(objectType7.item),
    }));
    return (
      this.bridge?.setGizmoActiveHandle?.(handleKey.handleKey),
      this.bridge?.setGizmoMoveGuideLine?.({
        from: from2?.pivot || { x: 0, y: 0, z: 0 },
        to: from2?.pivot || { x: 0, y: 0, z: 0 },
      }),
      {
        type: 'gizmo-move',
        pointerId: clientX.pointerId,
        startX: clientX.clientX,
        startY: clientX.clientY,
        moved: false,
        handleKey: handleKey.handleKey,
        dragState: from2,
        entries: entries2,
        draftTargets: [],
      }
    );
  }
  ['_clearGizmoMoveGuideLine']() {
    this.bridge?.clearGizmoMoveGuideLine?.();
  }
  ['_beginGizmoRotate'](clientX2, value43, handleKey2) {
    const list15 = this._getSelectionTargets(value43);
    if (!list15.length) return null;
    const dragState = this.bridge?.beginRotateGizmoDrag?.({
      handleKey: handleKey2?.handleKey,
      clientX: clientX2.clientX,
      clientY: clientX2.clientY,
    });
    if (!dragState) return null;
    const entries3 = list15.map((objectType8) => ({
      objectType: objectType8.objectType,
      objectId: objectType8.objectId,
      basePose: cloneObjectPose(objectType8.item),
    }));
    return (
      this.bridge?.setGizmoActiveHandle?.(handleKey2.handleKey),
      {
        type: 'gizmo-rotate',
        pointerId: clientX2.pointerId,
        handleKey: handleKey2.handleKey,
        dragState: dragState,
        entries: entries3,
        moved: false,
        draftTargets: [],
      }
    );
  }
  ['_beginGizmoScale'](clientX3, value44, handleKey3) {
    const list16 = this._getSelectionTargets(value44).filter((item16) => item16.objectType !== 'camera');
    if (!list16.length) return null;
    const dragState2 = this.bridge?.beginScaleGizmoDrag?.({
      handleKey: handleKey3?.handleKey,
      clientX: clientX3.clientX,
      clientY: clientX3.clientY,
    });
    if (!dragState2) return null;
    const entries4 = list16.map((objectType9) => ({
      objectType: objectType9.objectType,
      objectId: objectType9.objectId,
      basePose: cloneObjectPose(objectType9.item),
      baseScale: toScaleVector(objectType9.item?.scale),
    }));
    return (
      this.bridge?.setGizmoActiveHandle?.(handleKey3.handleKey),
      {
        type: 'gizmo-scale',
        pointerId: clientX3.pointerId,
        handleKey: handleKey3.handleKey,
        dragState: dragState2,
        entries: entries4,
        moved: false,
        draftTargets: [],
      }
    );
  }
  ['_updateGizmoHover'](event4) {
    const enabled7 = this.getSceneState?.(),
      value45 = this._isPanoramaMode(enabled7);
    this._syncControlsByMode(value45);
    if (value45 || !enabled7 || !this._isEditing(enabled7) || enabled7.mode !== 'scene') {
      this.bridge?.setGizmoHoverHandle?.(null);
      return;
    }
    const value46 =
        enabled7?.ui?.transformTool ||
        (enabled7?.ui?.activeTool === 'move' ||
        enabled7?.ui?.activeTool === 'rotate' ||
        enabled7?.ui?.activeTool === 'scale'
          ? enabled7.ui.activeTool
          : 'move'),
      list17 = this._getSelectionTargets(enabled7);
    if (!list17.length) {
      this.bridge?.setGizmoHoverHandle?.(null);
      return;
    }
    if (value46 !== 'move' && value46 !== 'rotate' && value46 !== 'scale') {
      this.bridge?.setGizmoHoverHandle?.(null);
      return;
    }
    const value47 = this.bridge?.pickGizmoHandle?.(event4.clientX, event4.clientY) || null;
    this.bridge?.setGizmoHoverHandle?.(value47?.handleKey || null);
  }
  ['_exitActiveCameraOnManualNavigate'](enabled8) {
    if (!enabled8 || enabled8._activeCameraExited) return;
    const args = this.getSceneState?.();
    if (args?.viewport?.activeView !== 'camera' || !args?.viewport?.activeCameraId) {
      enabled8._activeCameraExited = true;
      return;
    }
    (this.onViewCommit?.({
      sceneView: { ...args.viewport.sceneView },
      activeView: 'default',
      activeCameraId: null,
    }),
      (enabled8._activeCameraExited = true));
  }
  ['_resolveSceneNavigateGesture'](event5) {
    const value48 = event5.altKey === true,
      value49 = event5.button === 0,
      value50 = event5.button === 1,
      value51 = event5.button === 2;
    if (value48 && value49) return 'orbit-scene';
    if (value48 && value50) return 'pan';
    if (value48 && value51) return 'dolly';
    if (value50) return 'pan';
    return null;
  }
  ['_handlePointerDown'](pointerId3) {
    const enabled9 = this.getSceneState?.();
    if (!enabled9 || !this._isEditing(enabled9)) return;
    const value52 = this._isPanoramaMode(enabled9);
    (this._syncControlsByMode(value52), this._cancelQueuedDraftClear());
    const enabled10 = pointerId3.button === 0,
      enabled11 = pointerId3.button === 1,
      enabled12 = pointerId3.button === 2,
      value53 = enabled11 && pointerId3.ctrlKey,
      value54 = enabled11 && pointerId3.shiftKey,
      value55 = enabled9.mode === 'scene',
      rect = this.viewportEl.getBoundingClientRect(),
      baseView = this._createBaseView(enabled9);
    (this._stopEvent(pointerId3, { preventDefault: true }), this.viewportEl.focus?.());
    if (value52) {
      if (!enabled10 && !enabled11 && !enabled12) return;
      (this.bridge?.setGizmoHoverHandle?.(null),
        this._clearGizmoMoveGuideLine(),
        this.bridge?.setGizmoActiveHandle?.(null),
        (this._gesture = {
          type: 'look-panorama',
          pointerId: pointerId3.pointerId,
          startX: pointerId3.clientX,
          startY: pointerId3.clientY,
          moved: false,
          rect: rect,
          baseView: baseView,
        }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (value55 && (enabled10 || enabled11 || enabled12)) {
      const type = this._resolveSceneNavigateGesture(pointerId3);
      if (type) {
        (this._clearGizmoMoveGuideLine(),
          this.bridge?.setGizmoActiveHandle?.(null),
          (this._gesture = {
            type: type,
            pointerId: pointerId3.pointerId,
            startX: pointerId3.clientX,
            startY: pointerId3.clientY,
            moved: false,
            rect: rect,
            baseView: baseView,
          }),
          this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
        return;
      }
      if (enabled10) {
        const value56 =
            enabled9?.ui?.mouseTool ||
            (enabled9?.ui?.activeTool === 'box-select' ? 'box-select' : 'navigate'),
          value57 =
            enabled9?.ui?.transformTool ||
            (enabled9?.ui?.activeTool === 'move' ||
            enabled9?.ui?.activeTool === 'rotate' ||
            enabled9?.ui?.activeTool === 'scale'
              ? enabled9.ui.activeTool
              : 'move');
        if (value57 === 'move' || value57 === 'rotate' || value57 === 'scale') {
          const value58 = this.bridge?.pickGizmoHandle?.(pointerId3.clientX, pointerId3.clientY) || null;
          if (value58) {
            if (value57 === 'move') this._gesture = this._beginGizmoMove(pointerId3, enabled9, value58);
            else
              value57 === 'rotate'
                ? (this._gesture = this._beginGizmoRotate(pointerId3, enabled9, value58))
                : (this._gesture = this._beginGizmoScale(pointerId3, enabled9, value58));
            if (this._gesture) {
              this.viewportEl.setPointerCapture?.(pointerId3.pointerId);
              return;
            }
          }
        }
        const objectType10 = this.bridge?.pick?.(pointerId3.clientX, pointerId3.clientY) || null,
          item17 = this._getObjectByPick(enabled9, objectType10),
          list18 = this._getSelectionTargets(enabled9),
          pickedTarget =
            objectType10 && item17
              ? { objectType: objectType10.objectType, objectId: objectType10.objectId, item: item17 }
              : null,
          pickedGroup = pickedTarget
            ? this._findGroupByMember(enabled9, pickedTarget.objectType, pickedTarget.objectId)
            : null;
        let objectType11 = list18;
        if (pickedTarget) {
          if (pickedGroup) {
            const value59 = this._resolveTargetsByIds(enabled9, 'mannequin', pickedGroup.memberIds);
            ((objectType11 = value59),
              this.onSelectionBatchChange?.('mannequin', pickedGroup.memberIds, pickedGroup.id));
          } else {
            const map7 = new Set(
                this._collectSelectionObjects(enabled9).map(
                  (item18) => item18.objectType + ':' + item18.objectId,
                ),
              ),
              value60 = pickedTarget.objectType + ':' + pickedTarget.objectId;
            !(map7.has(value60) && list18.length > 0) &&
              (this.onSelectionChange?.(pickedTarget.objectType, pickedTarget.objectId),
              (objectType11 = [pickedTarget]));
          }
        }
        if (value56 === 'box-select') {
          const startLocalX = this._getLocalPoint(pointerId3);
          ((this._gesture = {
            type: 'selection-box',
            pointerId: pointerId3.pointerId,
            startX: pointerId3.clientX,
            startY: pointerId3.clientY,
            startLocalX: startLocalX.x,
            startLocalY: startLocalX.y,
            keepSelectionOnClick: !!pickedTarget,
            moved: false,
          }),
            this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
          return;
        }
        if (value57 === 'rotate' && pickedTarget) {
          ((this._gesture = {
            type: 'scene-select',
            pointerId: pointerId3.pointerId,
            startX: pointerId3.clientX,
            startY: pointerId3.clientY,
            pickedTarget: pickedTarget,
            pickedGroup: pickedGroup,
            selectionCommittedOnPointerDown: true,
            moved: false,
          }),
            this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
          return;
        }
        if (pickedTarget) {
          ((this._gesture =
            objectType11.length > 1
              ? this._beginBatchMove(pointerId3, objectType11)
              : this._beginObjectMove(
                  pointerId3,
                  enabled9,
                  { objectType: objectType11[0].objectType, objectId: objectType11[0].objectId },
                  objectType11[0].item,
                )),
            this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
          return;
        }
        (this._clearGizmoMoveGuideLine(),
          this.bridge?.setGizmoActiveHandle?.(null),
          (this._gesture = {
            type: 'orbit-scene',
            pointerId: pointerId3.pointerId,
            startX: pointerId3.clientX,
            startY: pointerId3.clientY,
            moved: false,
            clearSelectionOnClick: true,
            rect: rect,
            baseView: baseView,
          }),
          this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
        return;
      }
    }
    if (value53) {
      ((this._gesture = {
        type: 'zoom-middle',
        pointerId: pointerId3.pointerId,
        startY: pointerId3.clientY,
        baseView: baseView,
      }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (value54) {
      ((this._gesture = {
        type: baseView.kind === 'panorama-default' ? 'look-panorama' : 'orbit-scene',
        pointerId: pointerId3.pointerId,
        startX: pointerId3.clientX,
        startY: pointerId3.clientY,
        moved: false,
        rect: rect,
        baseView: baseView,
      }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (enabled11) {
      if (baseView.kind !== 'scene-default') return;
      ((this._gesture = {
        type: 'pan',
        pointerId: pointerId3.pointerId,
        startX: pointerId3.clientX,
        startY: pointerId3.clientY,
        moved: false,
        rect: rect,
        baseView: baseView,
      }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (!enabled10) return;
    const value61 =
        enabled9?.ui?.mouseTool || (enabled9?.ui?.activeTool === 'box-select' ? 'box-select' : 'navigate'),
      value62 =
        enabled9?.ui?.transformTool ||
        (enabled9?.ui?.activeTool === 'move' ||
        enabled9?.ui?.activeTool === 'rotate' ||
        enabled9?.ui?.activeTool === 'scale'
          ? enabled9.ui.activeTool
          : 'move'),
      objectType12 = this.bridge?.pick?.(pointerId3.clientX, pointerId3.clientY) || null,
      item19 = this._getObjectByPick(enabled9, objectType12),
      list19 = this._getSelectionTargets(enabled9),
      pickedTarget2 =
        objectType12 && item19
          ? { objectType: objectType12.objectType, objectId: objectType12.objectId, item: item19 }
          : null,
      pickedGroup2 = pickedTarget2
        ? this._findGroupByMember(enabled9, pickedTarget2.objectType, pickedTarget2.objectId)
        : null;
    let objectType13 = list19;
    if (pickedTarget2) {
      if (pickedGroup2) {
        const value63 = this._resolveTargetsByIds(enabled9, 'mannequin', pickedGroup2.memberIds);
        ((objectType13 = value63),
          this.onSelectionBatchChange?.('mannequin', pickedGroup2.memberIds, pickedGroup2.id));
      } else {
        const map8 = new Set(
            this._collectSelectionObjects(enabled9).map(
              (item20) => item20.objectType + ':' + item20.objectId,
            ),
          ),
          value64 = pickedTarget2.objectType + ':' + pickedTarget2.objectId;
        !(map8.has(value64) && list19.length > 0) &&
          (this.onSelectionChange?.(pickedTarget2.objectType, pickedTarget2.objectId),
          (objectType13 = [pickedTarget2]));
      }
    }
    const value65 = pickedTarget2 ? value62 : value61;
    if (value65 === 'move' && objectType13.length > 0) {
      ((this._gesture =
        objectType13.length > 1
          ? this._beginBatchMove(pointerId3, objectType13)
          : this._beginObjectMove(
              pointerId3,
              enabled9,
              { objectType: objectType13[0].objectType, objectId: objectType13[0].objectId },
              objectType13[0].item,
            )),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (value65 === 'rotate' && objectType13.length > 0) {
      ((this._gesture = {
        type: 'scene-select',
        pointerId: pointerId3.pointerId,
        startX: pointerId3.clientX,
        startY: pointerId3.clientY,
        pickedTarget: pickedTarget2,
        pickedGroup: pickedGroup2,
        selectionCommittedOnPointerDown: true,
        moved: false,
      }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (value65 === 'scale' && objectType13.length > 0) {
      const objectType14 = objectType13.filter((item21) => item21.objectType !== 'camera');
      if (objectType14.length === 0) return;
      if (objectType14.length > 1) {
        const entries5 = objectType14.map((objectType15) => ({
            objectType: objectType15.objectType,
            objectId: objectType15.objectId,
            basePose: cloneObjectPose(objectType15.item),
          })),
          center = entries5.reduce(
            (box12, value66) => {
              return (
                (box12.x += value66.basePose.position.x),
                (box12.z += value66.basePose.position.z),
                box12
              );
            },
            { x: 0, z: 0 },
          );
        ((center.x /= entries5.length),
          (center.z /= entries5.length),
          (this._gesture = {
            type: 'object-scale-batch',
            pointerId: pointerId3.pointerId,
            startX: pointerId3.clientX,
            rect: rect,
            center: center,
            entries: entries5,
            moved: false,
          }));
      } else
        this._gesture = {
          type: 'object-scale',
          pointerId: pointerId3.pointerId,
          startX: pointerId3.clientX,
          objectType: objectType14[0].objectType,
          objectId: objectType14[0].objectId,
          rect: rect,
          basePose: cloneObjectPose(objectType14[0].item),
          moved: false,
        };
      this.viewportEl.setPointerCapture?.(pointerId3.pointerId);
      return;
    }
    if (value65 === 'box-select') {
      pickedTarget2 &&
        (pickedGroup2
          ? this.onSelectionBatchChange?.('mannequin', pickedGroup2.memberIds, pickedGroup2.id)
          : this.onSelectionChange?.(pickedTarget2.objectType, pickedTarget2.objectId));
      ((this._gesture = {
        type: 'selection-box',
        pointerId: pointerId3.pointerId,
        startX: pointerId3.clientX,
        startY: pointerId3.clientY,
        startLocalX: this._getLocalPoint(pointerId3).x,
        startLocalY: this._getLocalPoint(pointerId3).y,
        keepSelectionOnClick: !!pickedTarget2,
        moved: false,
      }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
      return;
    }
    if (value65 === 'navigate') {
      if (objectType12 && item19) {
        objectType13.length > 1
          ? (this._gesture = this._beginBatchMove(pointerId3, objectType13))
          : (this.onSelectionChange?.(objectType12.objectType, objectType12.objectId),
            (this._gesture = this._beginObjectMove(pointerId3, enabled9, objectType12, item19)));
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId);
        return;
      }
      ((this._gesture = {
        type: baseView.kind === 'panorama-default' ? 'look-panorama' : 'orbit-scene',
        pointerId: pointerId3.pointerId,
        startX: pointerId3.clientX,
        startY: pointerId3.clientY,
        rect: rect,
        baseView: baseView,
        moved: false,
      }),
        this.viewportEl.setPointerCapture?.(pointerId3.pointerId));
    }
  }
  ['_handlePointerMove'](event6) {
    if (!this._gesture) {
      this._updateGizmoHover(event6);
      return;
    }
    if (event6.pointerId !== this._gesture.pointerId) return;
    this._stopEvent(event6, { preventDefault: true });
    const sceneView2 = this._gesture;
    if (sceneView2.type === 'orbit-scene') {
      const value67 = event6.clientX - sceneView2.startX,
        value68 = event6.clientY - sceneView2.startY,
        value69 = Math.hypot(value67, value68) >= MOVE_THRESHOLD;
      !sceneView2.moved && value69 && this._exitActiveCameraOnManualNavigate(sceneView2);
      ((sceneView2.moved = sceneView2.moved || value69), this.bridge?.markViewSmoothingWindow?.());
      const args2 = applyOrbitDelta(sceneView2.baseView.sceneView, value67, value68, sceneView2.rect);
      ((sceneView2.draftView = { ...sceneView2.baseView.sceneView, ...args2 }),
        this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: sceneView2.draftView }));
      return;
    }
    if (sceneView2.type === 'look-panorama') {
      const value70 = event6.clientX - sceneView2.startX,
        value71 = event6.clientY - sceneView2.startY,
        value72 = Math.hypot(value70, value71) >= MOVE_THRESHOLD;
      !sceneView2.moved && value72 && this._exitActiveCameraOnManualNavigate(sceneView2);
      ((sceneView2.moved = sceneView2.moved || value72), this.bridge?.markViewSmoothingWindow?.());
      const args3 = applyPanoramaLookDelta(
        sceneView2.baseView.panoramaView,
        value70,
        -value71,
        sceneView2.rect,
      );
      ((sceneView2.draftView = { ...sceneView2.baseView.panoramaView, ...args3 }),
        this.bridge?.setDraftView?.({ kind: 'panorama-default', panoramaView: sceneView2.draftView }));
      return;
    }
    if (sceneView2.type === 'pan') {
      const value73 = event6.clientX - sceneView2.startX,
        value74 = event6.clientY - sceneView2.startY,
        value75 = Math.hypot(value73, value74) >= MOVE_THRESHOLD;
      !sceneView2.moved && value75 && this._exitActiveCameraOnManualNavigate(sceneView2);
      ((sceneView2.moved = sceneView2.moved || value75), this.bridge?.markViewSmoothingWindow?.());
      const args4 = applyScenePanDelta(
        sceneView2.baseView.sceneView,
        sceneView2.baseView.currentPose,
        value73,
        value74,
        sceneView2.rect,
      );
      ((sceneView2.draftView = { ...sceneView2.baseView.sceneView, ...args4 }),
        this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: sceneView2.draftView }));
      return;
    }
    if (sceneView2.type === 'dolly') {
      const value76 = Math.abs(event6.clientY - sceneView2.startY) >= MOVE_THRESHOLD;
      !sceneView2.moved && value76 && this._exitActiveCameraOnManualNavigate(sceneView2);
      sceneView2.moved = sceneView2.moved || value76;
      const value77 = (event6.clientY - sceneView2.startY) * 8;
      this.bridge?.markViewSmoothingWindow?.();
      const args5 = applySceneDollyDelta(sceneView2.baseView.sceneView, value77);
      ((sceneView2.draftView = { ...sceneView2.baseView.sceneView, ...args5 }),
        this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: sceneView2.draftView }));
      return;
    }
    if (sceneView2.type === 'zoom-middle') {
      const value78 = Math.abs(event6.clientY - sceneView2.startY) >= MOVE_THRESHOLD;
      !sceneView2.moved && value78 && this._exitActiveCameraOnManualNavigate(sceneView2);
      sceneView2.moved = sceneView2.moved || value78;
      const value79 = (event6.clientY - sceneView2.startY) * 8;
      this.bridge?.markViewSmoothingWindow?.();
      if (sceneView2.baseView.kind === 'panorama-default') {
        const args6 = applyPanoramaZoomDelta(sceneView2.baseView.panoramaView, value79);
        ((sceneView2.draftView = { ...sceneView2.baseView.panoramaView, ...args6 }),
          this.bridge?.setDraftView?.({ kind: 'panorama-default', panoramaView: sceneView2.draftView }));
      } else {
        const args7 = applySceneZoomDelta(sceneView2.baseView.sceneView, value79);
        ((sceneView2.draftView = { ...sceneView2.baseView.sceneView, ...args7 }),
          this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: sceneView2.draftView }));
      }
      return;
    }
    if (sceneView2.type === 'selection-box') {
      const value80 = event6.clientX - sceneView2.startX,
        value81 = event6.clientY - sceneView2.startY;
      sceneView2.moved = sceneView2.moved || Math.hypot(value80, value81) >= MOVE_THRESHOLD;
      const box13 = this._getLocalPoint(event6);
      this._updateSelectionBox(sceneView2.startLocalX, sceneView2.startLocalY, box13.x, box13.y);
      return;
    }
    if (sceneView2.type === 'scene-select') {
      const value82 = event6.clientX - sceneView2.startX,
        value83 = event6.clientY - sceneView2.startY,
        value84 = Math.hypot(value82, value83) >= MOVE_THRESHOLD;
      sceneView2.moved = sceneView2.moved || value84;
      if (!sceneView2.pickedTarget && value84) {
        const box14 = this._getLocalPoint(event6);
        (this._updateSelectionBox(sceneView2.startLocalX, sceneView2.startLocalY, box14.x, box14.y),
          (sceneView2.type = 'selection-box'),
          (sceneView2.keepSelectionOnClick = false));
      }
      return;
    }
    if (sceneView2.type === 'gizmo-move') {
      const enabled13 = this.bridge?.sampleMoveGizmoDragPoint?.(
        sceneView2.dragState,
        event6.clientX,
        event6.clientY,
      );
      if (!enabled13) return;
      const box15 = this.bridge?.computeMoveGizmoDelta?.(sceneView2.dragState, enabled13);
      if (!box15) return;
      this.bridge?.setGizmoMoveGuideLine?.({
        from: sceneView2.dragState?.pivot || { x: 0, y: 0, z: 0 },
        to: addVector3Like(sceneView2.dragState?.pivot, box15),
      });
      const count5 = Math.hypot(box15.x || 0, box15.y || 0, box15.z || 0);
      ((sceneView2.moved = sceneView2.moved || count5 >= 0.0001),
        (sceneView2.draftTargets = sceneView2.entries.map((x12) => {
          const pose = {
            ...x12.basePose,
            position: {
              x: x12.basePose.position.x + (box15.x || 0),
              y: x12.basePose.position.y + (box15.y || 0),
              z: x12.basePose.position.z + (box15.z || 0),
            },
          };
          return (
            this.bridge?.setDraftObjectTransform?.(x12.objectType, x12.objectId, pose),
            { objectType: x12.objectType, objectId: x12.objectId, pose: pose }
          );
        })));
      return;
    }
    if (sceneView2.type === 'gizmo-rotate') {
      const enabled14 = this.bridge?.sampleMoveGizmoDragPoint?.(
        sceneView2.dragState,
        event6.clientX,
        event6.clientY,
      );
      if (!enabled14) return;
      const value85 = this.bridge?.computeRotateGizmoAngle?.(sceneView2.dragState, enabled14) || 0;
      sceneView2.moved = sceneView2.moved || Math.abs(value85) >= 0.0001;
      if (!sceneView2.dragState?.axisWorld || !sceneView2.dragState?.pivot) return;
      sceneView2.draftTargets = sceneView2.entries.map((objectType16) => {
        const position = rotatePoseAroundWorldAxis(
            objectType16.basePose,
            sceneView2.dragState.axisWorld,
            value85,
            sceneView2.dragState.pivot,
          ),
          pose2 = {
            ...objectType16.basePose,
            position: position.position,
            rotation: position.rotation,
            quaternion: position.quaternion,
          };
        return (
          this.bridge?.setDraftObjectTransform?.(objectType16.objectType, objectType16.objectId, pose2),
          { objectType: objectType16.objectType, objectId: objectType16.objectId, pose: pose2 }
        );
      });
      return;
    }
    if (sceneView2.type === 'gizmo-scale') {
      const enabled15 = this.bridge?.sampleMoveGizmoDragPoint?.(
        sceneView2.dragState,
        event6.clientX,
        event6.clientY,
      );
      if (!enabled15) return;
      const value86 = this.bridge?.computeScaleGizmoFactor?.(sceneView2.dragState, enabled15) || 1;
      sceneView2.moved = sceneView2.moved || Math.abs(value86 - 1) >= 0.0001;
      const value87 = String(sceneView2.dragState?.handleKey || '').slice(-1);
      sceneView2.draftTargets = sceneView2.entries.map((x13) => {
        const box16 = toScaleVector(x13.baseScale);
        let value88 = { ...box16 };
        if (sceneView2.dragState?.mode === 'scale-uniform')
          value88 = {
            x: Math.max(0.01, box16.x * value86),
            y: Math.max(0.01, box16.y * value86),
            z: Math.max(0.01, box16.z * value86),
          };
        else
          (value87 === 'x' || value87 === 'y' || value87 === 'z') &&
            (value88[value87] = Math.max(0.01, box16[value87] * value86));
        const position2 =
            sceneView2.dragState?.mode === 'scale-axis'
              ? {
                  x: x13.basePose.position.x,
                  y: x13.basePose.position.y,
                  z: x13.basePose.position.z,
                }
              : sceneView2.dragState?.pivot
                ? scalePositionAroundPivot(x13.basePose.position, sceneView2.dragState?.pivot, value86, null)
                : {
                    x: x13.basePose.position.x,
                    y: x13.basePose.position.y,
                    z: x13.basePose.position.z,
                  },
          pose3 = { ...x13.basePose, position: position2, scale: toCompatibleScale(value88) };
        return (
          this.bridge?.setDraftObjectTransform?.(x13.objectType, x13.objectId, pose3),
          { objectType: x13.objectType, objectId: x13.objectId, pose: pose3 }
        );
      });
      return;
    }
    if (sceneView2.type === 'object-move') {
      const x14 = this.bridge?.intersectGround?.(event6.clientX, event6.clientY, 0);
      if (x14)
        ((sceneView2.moved = true),
          (sceneView2.draftPose = {
            ...sceneView2.basePose,
            position: {
              x: x14.x - sceneView2.offset.x,
              y: sceneView2.basePose.position.y,
              z: x14.z - sceneView2.offset.z,
            },
          }));
      else {
        const value89 = event6.clientX - sceneView2.startX,
          value90 = event6.clientY - sceneView2.startY;
        ((sceneView2.moved = Math.hypot(value89, value90) >= 1),
          (sceneView2.draftPose = {
            ...sceneView2.basePose,
            position: {
              x: sceneView2.basePose.position.x + value89 * 0.01,
              y: sceneView2.basePose.position.y,
              z: sceneView2.basePose.position.z - value90 * 0.01,
            },
          }));
      }
      this.bridge?.setDraftObjectTransform?.(
        sceneView2.objectType,
        sceneView2.objectId,
        sceneView2.draftPose,
      );
      return;
    }
    if (sceneView2.type === 'object-move-batch') {
      const x15 = this.bridge?.intersectGround?.(event6.clientX, event6.clientY, 0);
      let x16 = sceneView2.baseCenter;
      if (x15)
        ((sceneView2.moved = true),
          (x16 = {
            x: x15.x - sceneView2.pointerOffset.x,
            z: x15.z - sceneView2.pointerOffset.z,
          }));
      else {
        const value91 = event6.clientX - sceneView2.startX,
          value92 = event6.clientY - sceneView2.startY;
        ((sceneView2.moved = Math.hypot(value91, value92) >= 1),
          (x16 = {
            x: sceneView2.baseCenter.x + value91 * 0.01,
            z: sceneView2.baseCenter.z - value92 * 0.01,
          }));
      }
      sceneView2.draftTargets = sceneView2.entries.map((y2) => {
        const pose4 = {
          ...y2.pose,
          position: {
            x: x16.x + y2.offset.x,
            y: y2.pose.position.y,
            z: x16.z + y2.offset.z,
          },
        };
        return (
          this.bridge?.setDraftObjectTransform?.(y2.objectType, y2.objectId, pose4),
          { objectType: y2.objectType, objectId: y2.objectId, pose: pose4 }
        );
      });
      return;
    }
    if (sceneView2.type === 'object-rotate') {
      const value93 = event6.clientX - sceneView2.startX;
      sceneView2.moved = Math.abs(value93) >= 1;
      const y3 =
        sceneView2.basePose.rotation.y -
        (value93 / Math.max(160, sceneView2.rect.width || 1)) * Math.PI * 1.2;
      ((sceneView2.draftPose = {
        ...sceneView2.basePose,
        rotation: { ...sceneView2.basePose.rotation, y: y3 },
      }),
        this.bridge?.setDraftObjectTransform?.(
          sceneView2.objectType,
          sceneView2.objectId,
          sceneView2.draftPose,
        ));
      return;
    }
    if (sceneView2.type === 'object-rotate-batch') {
      const value94 = event6.clientX - sceneView2.startX;
      sceneView2.moved = Math.abs(value94) >= 1;
      const value95 = -(value94 / Math.max(160, sceneView2.rect.width || 1)) * Math.PI * 1.2;
      sceneView2.draftTargets = sceneView2.entries.map((y4) => {
        const value96 = y4.basePose.position.x - sceneView2.center.x,
          value97 = y4.basePose.position.z - sceneView2.center.z,
          value98 = Math.cos(value95),
          value99 = Math.sin(value95),
          value100 = value96 * value98 - value97 * value99,
          value101 = value96 * value99 + value97 * value98,
          pose5 = {
            ...y4.basePose,
            position: {
              x: sceneView2.center.x + value100,
              y: y4.basePose.position.y,
              z: sceneView2.center.z + value101,
            },
            rotation: { ...y4.basePose.rotation, y: y4.basePose.rotation.y + value95 },
          };
        return (
          this.bridge?.setDraftObjectTransform?.(y4.objectType, y4.objectId, pose5),
          { objectType: y4.objectType, objectId: y4.objectId, pose: pose5 }
        );
      });
      return;
    }
    if (sceneView2.type === 'object-scale') {
      const value102 = event6.clientX - sceneView2.startX;
      sceneView2.moved = Math.abs(value102) >= 1;
      const value103 = Math.max(
          0.01,
          Math.min(4, 1 + (value102 / Math.max(120, sceneView2.rect.width || 1)) * 2),
        ),
        box17 = toScaleVector(sceneView2.basePose.scale),
        scale2 = toCompatibleScale({
          x: Math.max(0.01, Math.min(4, box17.x * value103)),
          y: Math.max(0.01, Math.min(4, box17.y * value103)),
          z: Math.max(0.01, Math.min(4, box17.z * value103)),
        });
      ((sceneView2.draftPose = { ...sceneView2.basePose, scale: scale2 }),
        this.bridge?.setDraftObjectTransform?.(
          sceneView2.objectType,
          sceneView2.objectId,
          sceneView2.draftPose,
        ));
      return;
    }
    if (sceneView2.type === 'object-scale-batch') {
      const value104 = event6.clientX - sceneView2.startX;
      sceneView2.moved = Math.abs(value104) >= 1;
      const value105 = Math.max(
        0.01,
        Math.min(4, 1 + (value104 / Math.max(120, sceneView2.rect.width || 1)) * 2),
      );
      sceneView2.draftTargets = sceneView2.entries.map((y5) => {
        const value106 = y5.basePose.position.x - sceneView2.center.x,
          value107 = y5.basePose.position.z - sceneView2.center.z,
          box18 = toScaleVector(y5.basePose.scale),
          pose6 = {
            ...y5.basePose,
            position: {
              x: sceneView2.center.x + value106 * value105,
              y: y5.basePose.position.y,
              z: sceneView2.center.z + value107 * value105,
            },
            scale: toCompatibleScale({
              x: Math.max(0.01, Math.min(4, box18.x * value105)),
              y: Math.max(0.01, Math.min(4, box18.y * value105)),
              z: Math.max(0.01, Math.min(4, box18.z * value105)),
            }),
          };
        return (
          this.bridge?.setDraftObjectTransform?.(y5.objectType, y5.objectId, pose6),
          { objectType: y5.objectType, objectId: y5.objectId, pose: pose6 }
        );
      });
    }
  }
  ['_handlePointerUp'](event7) {
    if (!this._gesture || (event7.pointerId != null && event7.pointerId !== this._gesture.pointerId)) return;
    this._stopEvent(event7, { preventDefault: true });
    const sceneView3 = this._gesture;
    ((this._gesture = null), this.viewportEl.releasePointerCapture?.(sceneView3.pointerId));
    if (sceneView3.type === 'orbit-scene') {
      if (sceneView3.clearSelectionOnClick && !sceneView3.moved) {
        (this.onSelectionClear?.(), this.bridge?.clearDraftView?.());
        return;
      }
      if (!sceneView3.draftView && sceneView3.rect) {
        const value108 = event7.clientX - sceneView3.startX,
          value109 = event7.clientY - sceneView3.startY,
          args8 = applyOrbitDelta(sceneView3.baseView.sceneView, value108, value109, sceneView3.rect);
        sceneView3.draftView = { ...sceneView3.baseView.sceneView, ...args8 };
      }
      sceneView3.draftView
        ? (this.onViewCommit?.({
            sceneView: sceneView3.draftView,
            activeView: 'default',
            activeCameraId: null,
          }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (sceneView3.type === 'look-panorama') {
      if (!sceneView3.draftView && sceneView3.rect) {
        const value110 = event7.clientX - sceneView3.startX,
          value111 = event7.clientY - sceneView3.startY,
          args9 = applyPanoramaLookDelta(
            sceneView3.baseView.panoramaView,
            value110,
            -value111,
            sceneView3.rect,
          );
        sceneView3.draftView = { ...sceneView3.baseView.panoramaView, ...args9 };
      }
      sceneView3.draftView
        ? (this.onViewCommit?.({
            panoramaView: sceneView3.draftView,
            activeView: 'default',
            activeCameraId: null,
          }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (sceneView3.type === 'pan' || sceneView3.type === 'dolly') {
      sceneView3.draftView
        ? (this.onViewCommit?.({
            sceneView: sceneView3.draftView,
            activeView: 'default',
            activeCameraId: null,
          }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (sceneView3.type === 'zoom-middle') {
      sceneView3.draftView
        ? (sceneView3.baseView?.kind === 'panorama-default'
            ? this.onViewCommit?.({
                panoramaView: sceneView3.draftView,
                activeView: 'default',
                activeCameraId: null,
              })
            : this.onViewCommit?.({
                sceneView: sceneView3.draftView,
                activeView: 'default',
                activeCameraId: null,
              }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (sceneView3.type === 'selection-box') {
      this._clearSelectionBox();
      if (!sceneView3.moved) {
        if (sceneView3.keepSelectionOnClick) return;
        this.onSelectionClear?.();
        return;
      }
      const clientRectFromPoints = getClientRectFromPoints(
          sceneView3.startX,
          sceneView3.startY,
          event7.clientX,
          event7.clientY,
        ),
        list20 = this.bridge?.pickObjectsInRect?.(clientRectFromPoints) || [];
      if (list20.length === 0) {
        this.onSelectionClear?.();
        return;
      }
      const value112 = this.getSceneState?.(),
        list21 = [],
        map9 = new Set(),
        value113 = new Set(),
        map10 = new Set(),
        handler3 = (objectType17, objectId4) => {
          if ((objectType17 !== 'mannequin' && objectType17 !== 'cube') || !objectId4) return;
          const value114 = objectType17 + ':' + objectId4;
          if (map9.has(value114)) return;
          (map9.add(value114), list21.push({ objectType: objectType17, objectId: objectId4 }));
        };
      list20.forEach((item22) => {
        if (item22.objectType === 'mannequin')
          (value113.add(item22.objectId), handler3('mannequin', item22.objectId));
        else item22.objectType === 'cube' && (map10.add(item22.objectId), handler3('cube', item22.objectId));
      });
      if (list21.length === 0) {
        this.onSelectionClear?.();
        return;
      }
      const list22 = Array.isArray(value112?.groups) ? value112.groups : [],
        list23 = new Set(value113),
        list24 = [];
      (list22.forEach((item23) => {
        const list25 = Array.isArray(item23?.memberIds) ? item23.memberIds : [];
        if (!list25.some((item24) => list23.has(item24))) return;
        (list24.push(item23), list25.forEach((item25) => list23.add(item25)));
      }),
        list23.forEach((item26) => {
          handler3('mannequin', item26);
        }));
      const activeObjectType = list21.filter((item27) => {
        if (item27.objectType === 'cube') return map10.has(item27.objectId);
        return list23.has(item27.objectId);
      });
      if (activeObjectType.length === 0) {
        this.onSelectionClear?.();
        return;
      }
      const groupId =
        map10.size === 0 &&
        list24.length === 1 &&
        activeObjectType.every((item28) => item28.objectType === 'mannequin') &&
        list24[0].memberIds.length === activeObjectType.length &&
        list24[0].memberIds.every((item29) => list23.has(item29))
          ? list24[0].id
          : null;
      this.onSelectionObjectsChange?.(activeObjectType, {
        activeObjectType: activeObjectType[0].objectType,
        activeObjectId: activeObjectType[0].objectId,
        groupId: groupId,
      });
      return;
    }
    if (sceneView3.type === 'scene-select') {
      if (sceneView3.pickedTarget) {
        if (sceneView3.selectionCommittedOnPointerDown) return;
        sceneView3.pickedGroup
          ? this.onSelectionBatchChange?.(
              'mannequin',
              sceneView3.pickedGroup.memberIds,
              sceneView3.pickedGroup.id,
            )
          : this.onSelectionChange?.(sceneView3.pickedTarget.objectType, sceneView3.pickedTarget.objectId);
      } else this.onSelectionClear?.();
      return;
    }
    if (sceneView3.type === 'gizmo-move') {
      (this._clearGizmoMoveGuideLine(), this.bridge?.setGizmoActiveHandle?.(null));
      const objectType18 = Array.isArray(sceneView3.draftTargets) ? sceneView3.draftTargets : [];
      objectType18.length > 0
        ? (objectType18.length === 1
            ? this.onObjectCommit?.({
                objectType: objectType18[0].objectType,
                objectId: objectType18[0].objectId,
                pose: objectType18[0].pose,
              })
            : this.onObjectBatchCommit?.({ targets: objectType18 }),
          this._queueDraftClear(() => {
            objectType18.forEach((item30) => {
              this.bridge?.clearDraftObjectTransform?.(item30.objectType, item30.objectId);
            });
          }))
        : this.bridge?.clearAllDrafts?.();
      this._updateGizmoHover(event7);
      return;
    }
    if (sceneView3.type === 'gizmo-rotate' || sceneView3.type === 'gizmo-scale') {
      (this._clearGizmoMoveGuideLine(), this.bridge?.setGizmoActiveHandle?.(null));
      const objectType19 = Array.isArray(sceneView3.draftTargets) ? sceneView3.draftTargets : [];
      objectType19.length > 0
        ? (objectType19.length === 1
            ? this.onObjectCommit?.({
                objectType: objectType19[0].objectType,
                objectId: objectType19[0].objectId,
                pose: objectType19[0].pose,
              })
            : this.onObjectBatchCommit?.({ targets: objectType19 }),
          this._queueDraftClear(() => {
            objectType19.forEach((item31) => {
              this.bridge?.clearDraftObjectTransform?.(item31.objectType, item31.objectId);
            });
          }))
        : this.bridge?.clearAllDrafts?.();
      this._updateGizmoHover(event7);
      return;
    }
    if (
      sceneView3.type === 'object-move' ||
      sceneView3.type === 'object-rotate' ||
      sceneView3.type === 'object-scale'
    ) {
      (this.onSelectionChange?.(sceneView3.objectType, sceneView3.objectId),
        this.onObjectCommit?.({
          objectType: sceneView3.objectType,
          objectId: sceneView3.objectId,
          pose: sceneView3.draftPose || sceneView3.basePose,
        }),
        this._queueDraftClear(() =>
          this.bridge?.clearDraftObjectTransform?.(sceneView3.objectType, sceneView3.objectId),
        ));
      return;
    }
    if (
      sceneView3.type === 'object-move-batch' ||
      sceneView3.type === 'object-rotate-batch' ||
      sceneView3.type === 'object-scale-batch'
    ) {
      const targets = Array.isArray(sceneView3.draftTargets) ? sceneView3.draftTargets : [];
      targets.length > 0
        ? (this.onObjectBatchCommit?.({ targets: targets }),
          this._queueDraftClear(() => {
            targets.forEach((item32) => {
              this.bridge?.clearDraftObjectTransform?.(item32.objectType, item32.objectId);
            });
          }))
        : this.bridge?.clearAllDrafts?.();
    }
  }
  ['_handlePointerLeave']() {
    if (
      this._gesture?.type === 'gizmo-move' ||
      this._gesture?.type === 'gizmo-rotate' ||
      this._gesture?.type === 'gizmo-scale'
    )
      return;
    this.bridge?.setGizmoHoverHandle?.(null);
  }
  ['_handleWheel'](event8) {
    const enabled16 = this.getSceneState?.();
    if (!enabled16 || !this._isEditing(enabled16)) return;
    const value115 = this._isPanoramaMode(enabled16);
    (this._syncControlsByMode(value115),
      this._stopEvent(event8, { preventDefault: true }),
      this.bridge?.markViewSmoothingWindow?.());
    if (value115) {
      const args10 = enabled16.viewport.panoramaView;
      this.onViewCommit?.({
        panoramaView: { ...args10, ...applyPanoramaZoomDelta(args10, event8.deltaY) },
        activeView: 'default',
        activeCameraId: null,
      });
      return;
    }
    if (enabled16.mode === 'panorama') {
      const args11 = enabled16.viewport.panoramaView;
      this.onViewCommit?.({
        panoramaView: { ...args11, ...applyPanoramaZoomDelta(args11, event8.deltaY) },
        activeView: 'default',
        activeCameraId: null,
      });
      return;
    }
    const args12 = this._createBaseView(enabled16);
    if (args12.kind !== 'scene-default') return;
    this.onViewCommit?.({
      sceneView: { ...args12.sceneView, ...applySceneZoomDelta(args12.sceneView, event8.deltaY) },
      activeView: 'default',
      activeCameraId: null,
    });
  }
  ['_handleContextMenu'](value116) {
    const enabled17 = this.getSceneState?.();
    if (!enabled17 || !this._isEditing(enabled17)) return;
    this._stopEvent(value116, { preventDefault: true });
  }
}
