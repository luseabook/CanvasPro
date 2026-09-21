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
function hasFiniteQuaternion(_0x17c086) {
  return (
    Number.isFinite(Number(_0x17c086?.x)) &&
    Number.isFinite(Number(_0x17c086?.y)) &&
    Number.isFinite(Number(_0x17c086?.z)) &&
    Number.isFinite(Number(_0x17c086?.w))
  );
}
function cloneObjectPose(_0x4ad729) {
  const _0x15f3c6 = Number.isFinite(_0x4ad729?.scale)
      ? Number(_0x4ad729.scale) || 1
      : _0x4ad729?.scale &&
          Number.isFinite(_0x4ad729.scale.x) &&
          Number.isFinite(_0x4ad729.scale.y) &&
          Number.isFinite(_0x4ad729.scale.z)
        ? {
            x: Number(_0x4ad729.scale.x) || 1,
            y: Number(_0x4ad729.scale.y) || 1,
            z: Number(_0x4ad729.scale.z) || 1,
          }
        : 1,
    _0x37c095 = {
      x: Number(_0x4ad729?.rotation?.x) || 0,
      y: Number(_0x4ad729?.rotation?.y) || 0,
      z: Number(_0x4ad729?.rotation?.z) || 0,
    },
    _0x7603fa = hasFiniteQuaternion(_0x4ad729?.quaternion)
      ? new threeRuntime['Quaternion'](
          Number(_0x4ad729.quaternion.x),
          Number(_0x4ad729.quaternion.y),
          Number(_0x4ad729.quaternion.z),
          Number(_0x4ad729.quaternion.w),
        ).normalize()
      : new threeRuntime['Quaternion']().setFromEuler(
          new threeRuntime.Euler(_0x37c095.x, _0x37c095.y, _0x37c095.z, 'XYZ'),
        );
  return {
    position: {
      x: Number(_0x4ad729?.position?.x) || 0,
      y: Number(_0x4ad729?.position?.y) || 0,
      z: Number(_0x4ad729?.position?.z) || 0,
    },
    rotation: _0x37c095,
    quaternion: { x: _0x7603fa.x, y: _0x7603fa.y, z: _0x7603fa.z, w: _0x7603fa.w },
    fov: Number(_0x4ad729?.fov) || 58,
    scale: _0x15f3c6,
  };
}
function toScaleVector(_0x3b9149) {
  if (Number.isFinite(_0x3b9149)) {
    const _0x5424f8 = Math.max(0.01, Number(_0x3b9149) || 1);
    return { x: _0x5424f8, y: _0x5424f8, z: _0x5424f8 };
  }
  if (
    _0x3b9149 &&
    Number.isFinite(_0x3b9149.x) &&
    Number.isFinite(_0x3b9149.y) &&
    Number.isFinite(_0x3b9149.z)
  )
    return {
      x: Math.max(0.01, Number(_0x3b9149.x) || 1),
      y: Math.max(0.01, Number(_0x3b9149.y) || 1),
      z: Math.max(0.01, Number(_0x3b9149.z) || 1),
    };
  return { x: 1, y: 1, z: 1 };
}
function toCompatibleScale(_0x3570e4) {
  const _0x22f36d = toScaleVector(_0x3570e4),
    _0x2de381 = 0.0001;
  if (Math.abs(_0x22f36d.x - _0x22f36d.y) < _0x2de381 && Math.abs(_0x22f36d.y - _0x22f36d.z) < _0x2de381)
    return (_0x22f36d.x + _0x22f36d.y + _0x22f36d.z) / 3;
  return _0x22f36d;
}
function toVector3(_0x5be6fb) {
  return new threeRuntime['Vector3'](
    Number(_0x5be6fb?.x) || 0,
    Number(_0x5be6fb?.y) || 0,
    Number(_0x5be6fb?.z) || 0,
  );
}
function fromVector3(_0x1ef4af) {
  return { x: _0x1ef4af.x, y: _0x1ef4af.y, z: _0x1ef4af.z };
}
function rotatePoseAroundWorldAxis(_0x45ba24, _0x474304, _0xb62898, _0x3c48f6) {
  const _0xab1535 = toVector3(_0x474304);
  if (_0xab1535.lengthSq() < 1e-8 || !Number.isFinite(_0xb62898) || Math.abs(_0xb62898) < 1e-8) {
    const _0x5bd595 = hasFiniteQuaternion(_0x45ba24?.quaternion)
      ? {
          x: Number(_0x45ba24.quaternion.x) || 0,
          y: Number(_0x45ba24.quaternion.y) || 0,
          z: Number(_0x45ba24.quaternion.z) || 0,
          w: Number(_0x45ba24.quaternion.w) || 1,
        }
      : undefined;
    return {
      position: {
        x: Number(_0x45ba24?.position?.x) || 0,
        y: Number(_0x45ba24?.position?.y) || 0,
        z: Number(_0x45ba24?.position?.z) || 0,
      },
      rotation: {
        x: Number(_0x45ba24?.rotation?.x) || 0,
        y: Number(_0x45ba24?.rotation?.y) || 0,
        z: Number(_0x45ba24?.rotation?.z) || 0,
      },
      quaternion: _0x5bd595,
    };
  }
  _0xab1535.normalize();
  const _0x209605 = toVector3(_0x3c48f6),
    _0x7e659d = toVector3(_0x45ba24?.position),
    _0x3d6d39 = hasFiniteQuaternion(_0x45ba24?.quaternion)
      ? new threeRuntime.Quaternion(
          Number(_0x45ba24.quaternion.x) || 0,
          Number(_0x45ba24.quaternion.y) || 0,
          Number(_0x45ba24.quaternion.z) || 0,
          Number(_0x45ba24.quaternion.w) || 1,
        ).normalize()
      : new threeRuntime['Quaternion']().setFromEuler(
          new threeRuntime['Euler'](
            Number(_0x45ba24?.rotation?.x) || 0,
            Number(_0x45ba24?.rotation?.y) || 0,
            Number(_0x45ba24?.rotation?.z) || 0,
            'XYZ',
          ),
        ),
    _0x47658c = new threeRuntime['Quaternion']().setFromAxisAngle(_0xab1535, _0xb62898),
    _0x38ea56 = _0x7e659d.sub(_0x209605).applyQuaternion(_0x47658c).add(_0x209605),
    _0x2178d1 = _0x47658c.clone().multiply(_0x3d6d39),
    _0x1861fc = new threeRuntime['Euler']().setFromQuaternion(_0x2178d1, 'XYZ');
  return {
    position: fromVector3(_0x38ea56),
    rotation: { x: _0x1861fc.x, y: _0x1861fc.y, z: _0x1861fc.z },
    quaternion: { x: _0x2178d1.x, y: _0x2178d1.y, z: _0x2178d1.z, w: _0x2178d1.w },
  };
}
function scalePositionAroundPivot(_0x37445e, _0x2ff6a3, _0x28f21d, _0x58851d = null) {
  const _0x3a038c = Number.isFinite(_0x28f21d) ? _0x28f21d : 1,
    _0xaf8ec3 = toVector3(_0x2ff6a3),
    _0x87aa2d = toVector3(_0x37445e),
    _0x73f496 = _0x87aa2d.sub(_0xaf8ec3);
  if (!_0x58851d) return fromVector3(_0x73f496.multiplyScalar(_0x3a038c).add(_0xaf8ec3));
  const _0x1f0cb6 = toVector3(_0x58851d);
  if (_0x1f0cb6.lengthSq() < 1e-8) return fromVector3(_0x73f496.add(_0xaf8ec3));
  _0x1f0cb6.normalize();
  const _0x3c454a = _0x1f0cb6.clone().multiplyScalar(_0x73f496.dot(_0x1f0cb6)),
    _0x3d88dc = _0x73f496.clone().sub(_0x3c454a);
  return fromVector3(_0x3d88dc.add(_0x3c454a.multiplyScalar(_0x3a038c)).add(_0xaf8ec3));
}
function getClientRectFromPoints(_0x2e1a88, _0x17143d, _0x3091ac, _0x105772) {
  return {
    left: Math.min(_0x2e1a88, _0x3091ac),
    top: Math.min(_0x17143d, _0x105772),
    right: Math.max(_0x2e1a88, _0x3091ac),
    bottom: Math.max(_0x17143d, _0x105772),
  };
}
function getLocalRectFromPoints(_0xdca47d, _0x262fab, _0x205f0a, _0x421016) {
  return {
    left: Math.min(_0xdca47d, _0x205f0a),
    top: Math.min(_0x262fab, _0x421016),
    width: Math.abs(_0x205f0a - _0xdca47d),
    height: Math.abs(_0x421016 - _0x262fab),
  };
}
function addVector3Like(_0x2c6133, _0xd8f0de) {
  return {
    x: (Number(_0x2c6133?.x) || 0) + (Number(_0xd8f0de?.x) || 0),
    y: (Number(_0x2c6133?.y) || 0) + (Number(_0xd8f0de?.y) || 0),
    z: (Number(_0x2c6133?.z) || 0) + (Number(_0xd8f0de?.z) || 0),
  };
}
export function measureSelectionBoxLocalRect(_0x550218, _0x5e7d4f, _0x2ce117, _0x35c1d3, _0x4f9fee) {
  const _0x46cb32 = _0x550218?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 },
    _0x47090d = Math.max(1, Number(_0x550218?.offsetWidth) || _0x46cb32.width || 1),
    _0x1da2fa = Math.max(1, Number(_0x550218?.offsetHeight) || _0x46cb32.height || 1),
    _0x4deaeb = _0x46cb32.width > 0 ? _0x46cb32.width / _0x47090d : 1,
    _0x519d19 = _0x46cb32.height > 0 ? _0x46cb32.height / _0x1da2fa : 1,
    _0x284d5f = _0x4deaeb > 0 ? _0x4deaeb : 1,
    _0x51021e = _0x519d19 > 0 ? _0x519d19 : 1;
  return {
    left: (Math.min(_0x5e7d4f, _0x35c1d3) - _0x46cb32.left) / _0x284d5f,
    top: (Math.min(_0x2ce117, _0x4f9fee) - _0x46cb32.top) / _0x51021e,
    width: Math.abs(_0x35c1d3 - _0x5e7d4f) / _0x284d5f,
    height: Math.abs(_0x4f9fee - _0x2ce117) / _0x51021e,
  };
}
export class PanoramaSceneInteraction {
  constructor({
    viewportEl: _0x20f219,
    overlayEl: _0x4400fb,
    bridge: _0x41b572,
    getSceneState: _0x53eda1,
    onViewCommit: _0x2555d0,
    onObjectCommit: _0x4f0699,
    onObjectBatchCommit: _0x221ea9,
    onSelectionChange: _0x98b12e,
    onSelectionBatchChange: _0x85e312,
    onSelectionObjectsChange: _0x1c04c4,
    onSelectionClear: _0x3564f8,
  } = {}) {
    ((this.viewportEl = _0x20f219),
      (this.overlayEl = _0x4400fb || _0x20f219),
      (this.bridge = _0x41b572),
      (this.getSceneState = _0x53eda1),
      (this.onViewCommit = _0x2555d0),
      (this.onObjectCommit = _0x4f0699),
      (this.onObjectBatchCommit = _0x221ea9),
      (this.onSelectionChange = _0x98b12e),
      (this.onSelectionBatchChange = _0x85e312),
      (this.onSelectionObjectsChange = _0x1c04c4),
      (this.onSelectionClear = _0x3564f8),
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
  ['_isEditing'](_0x4eb42c) {
    return _0x4eb42c?.ui?.isEditing === true;
  }
  ['_isPanoramaMode'](_0xa61874) {
    return _0xa61874?.type === 'panorama-360';
  }
  ['_syncControlsByMode'](_0x57b63f) {
    const _0x4a5284 = this.bridge?.controls || this.bridge?._controls;
    if (!_0x4a5284) return;
    ('enablePan' in _0x4a5284 && (_0x4a5284.enablePan = _0x57b63f ? false : true),
      'enableRotate' in _0x4a5284 && (_0x4a5284.enableRotate = true));
  }
  ['_stopEvent'](_0x5b0f7d, _0x12350c = {}) {
    _0x5b0f7d.stopPropagation();
    if (_0x12350c.preventDefault) _0x5b0f7d.preventDefault();
  }
  ['_createBaseView'](_0x2f9293) {
    if (_0x2f9293.mode === 'panorama') {
      const _0x10b53e = { ..._0x2f9293.viewport.panoramaView };
      return { kind: 'panorama-default', sceneState: _0x2f9293, panoramaView: _0x10b53e };
    }
    const _0x197ec7 = this.bridge?.readCurrentViewPose?.() || null,
      _0x3a2252 = { ..._0x2f9293.viewport.sceneView };
    return { kind: 'scene-default', sceneState: _0x2f9293, sceneView: _0x3a2252, currentPose: _0x197ec7 };
  }
  ['_getObjectByPick'](_0x111549, _0x25d13d) {
    if (!_0x25d13d) return null;
    if (_0x25d13d.objectType !== 'cube' && _0x25d13d.objectType !== 'mannequin') return null;
    const _0x5c63f9 = _0x25d13d.objectType === 'cube' ? _0x111549.cubes : _0x111549.mannequins;
    return _0x5c63f9.find((_0x304ea6) => _0x304ea6.id === _0x25d13d.objectId) || null;
  }
  ['_getSelectedObject'](_0x4de466) {
    const _0x212026 = _0x4de466?.selection?.selectedObjectType,
      _0x2cf641 = _0x4de466?.selection?.selectedObjectId;
    if (!_0x212026 || !_0x2cf641) return null;
    if (_0x212026 !== 'cube' && _0x212026 !== 'mannequin') return null;
    const _0x5508c8 = _0x212026 === 'cube' ? _0x4de466.cubes : _0x4de466.mannequins,
      _0x15defb = _0x5508c8.find((_0x4f74bc) => _0x4f74bc.id === _0x2cf641) || null;
    if (!_0x15defb) return null;
    return { objectType: _0x212026, objectId: _0x2cf641, item: _0x15defb };
  }
  ['_findGroupByMember'](_0x48c91e, _0x1a68d3, _0x33c7ae) {
    if (_0x1a68d3 !== 'mannequin' || !_0x33c7ae) return null;
    const _0x4006e9 = Array.isArray(_0x48c91e?.groups) ? _0x48c91e.groups : [];
    return (
      _0x4006e9.find(
        (_0x11dc4a) => Array.isArray(_0x11dc4a.memberIds) && _0x11dc4a.memberIds.includes(_0x33c7ae),
      ) || null
    );
  }
  ['_resolveTargetsByIds'](_0x3a6bd5, _0xc87fd9, _0x4f6233) {
    const _0x398be7 = Array.isArray(_0x4f6233) ? _0x4f6233 : [];
    if (!_0xc87fd9 || _0x398be7.length === 0) return [];
    if (_0xc87fd9 !== 'cube' && _0xc87fd9 !== 'mannequin') return [];
    const _0x5e538d = _0xc87fd9 === 'cube' ? _0x3a6bd5.cubes : _0x3a6bd5.mannequins,
      _0x14500a = new Set(_0x398be7);
    return _0x5e538d
      .filter((_0x1c0419) => _0x14500a.has(_0x1c0419.id))
      .map((_0x5dd82b) => ({ objectType: _0xc87fd9, objectId: _0x5dd82b.id, item: _0x5dd82b }));
  }
  ['_collectSelectionObjects'](_0x1179c0) {
    const _0x1ffe17 = Array.isArray(_0x1179c0?.cubes) ? _0x1179c0.cubes : [],
      _0x3ba40a = Array.isArray(_0x1179c0?.mannequins) ? _0x1179c0.mannequins : [],
      _0x5c2740 = new Set(_0x1ffe17.map((_0x39c274) => _0x39c274.id)),
      _0xb7c8f2 = new Set(_0x3ba40a.map((_0x37a745) => _0x37a745.id)),
      _0x572ce1 = new Set(),
      _0x534a5d = [],
      _0x269ab5 = (_0x121a22, _0x2a4a38) => {
        if (_0x121a22 !== 'cube' && _0x121a22 !== 'mannequin') return;
        const _0x4d6907 = String(_0x2a4a38 || '').trim();
        if (!_0x4d6907) return;
        const _0x25d4d3 = _0x121a22 === 'cube' ? _0x5c2740.has(_0x4d6907) : _0xb7c8f2.has(_0x4d6907);
        if (!_0x25d4d3) return;
        const _0xe9af77 = _0x121a22 + ':' + _0x4d6907;
        if (_0x572ce1.has(_0xe9af77)) return;
        (_0x572ce1.add(_0xe9af77), _0x534a5d.push({ objectType: _0x121a22, objectId: _0x4d6907 }));
      },
      _0x49f245 = Array.isArray(_0x1179c0?.selection?.selectedObjects)
        ? _0x1179c0.selection.selectedObjects
        : [];
    _0x49f245.forEach((_0x59b2b5) => {
      _0x269ab5(_0x59b2b5?.objectType, _0x59b2b5?.objectId);
    });
    if (_0x534a5d.length > 0) return _0x534a5d;
    const _0x43e0b8 = _0x1179c0?.selection?.selectedGroupId || null;
    if (_0x43e0b8) {
      const _0x2e1b16 = (_0x1179c0?.groups || []).find((_0x112714) => _0x112714.id === _0x43e0b8);
      if (Array.isArray(_0x2e1b16?.memberIds) && _0x2e1b16.memberIds.length > 0) {
        _0x2e1b16.memberIds.forEach((_0xb4df61) => {
          _0x269ab5('mannequin', _0xb4df61);
        });
        if (_0x534a5d.length > 0) return _0x534a5d;
      }
    }
    const _0x480502 =
      _0x1179c0?.selection?.selectedObjectType === 'cube' ||
      _0x1179c0?.selection?.selectedObjectType === 'mannequin'
        ? _0x1179c0.selection.selectedObjectType
        : null;
    if (!_0x480502) return _0x534a5d;
    const _0x214212 = Array.isArray(_0x1179c0?.selection?.selectedObjectIds)
      ? _0x1179c0.selection.selectedObjectIds
      : [];
    if (_0x214212.length > 0) {
      _0x214212.forEach((_0x21479c) => {
        _0x269ab5(_0x480502, _0x21479c);
      });
      if (_0x534a5d.length > 0) return _0x534a5d;
    }
    return (_0x269ab5(_0x480502, _0x1179c0?.selection?.selectedObjectId || null), _0x534a5d);
  }
  ['_getSelectionTargets'](_0x2dd7c1) {
    const _0x108e21 = this._collectSelectionObjects(_0x2dd7c1);
    if (_0x108e21.length > 0) {
      const _0x2b9038 = new Map(
          (Array.isArray(_0x2dd7c1?.cubes) ? _0x2dd7c1.cubes : []).map((_0x295c8c) => [
            _0x295c8c.id,
            _0x295c8c,
          ]),
        ),
        _0x4d69af = new Map(
          (Array.isArray(_0x2dd7c1?.mannequins) ? _0x2dd7c1.mannequins : []).map((_0x51dc89) => [
            _0x51dc89.id,
            _0x51dc89,
          ]),
        );
      return _0x108e21
        .map((_0x103668) => {
          const _0x21056a =
            _0x103668.objectType === 'cube'
              ? _0x2b9038.get(_0x103668.objectId)
              : _0x4d69af.get(_0x103668.objectId);
          if (!_0x21056a) return null;
          return { objectType: _0x103668.objectType, objectId: _0x103668.objectId, item: _0x21056a };
        })
        .filter(Boolean);
    }
    return [];
  }
  ['_ensureSelectionBox']() {
    if (this._selectionBoxEl) return this._selectionBoxEl;
    const _0x3b3e20 = document.createElement('div');
    return (
      (_0x3b3e20.className = 'panorama-scene-selection-box'),
      this.overlayEl?.appendChild(_0x3b3e20),
      (this._selectionBoxEl = _0x3b3e20),
      _0x3b3e20
    );
  }
  ['_updateSelectionBox'](_0x166b4f, _0x17f739, _0x46417e, _0x2f011b) {
    const _0xf56d46 = getLocalRectFromPoints(_0x166b4f, _0x17f739, _0x46417e, _0x2f011b),
      _0xc2a204 = this._ensureSelectionBox();
    ((_0xc2a204.style.left = _0xf56d46.left + 'px'),
      (_0xc2a204.style.top = _0xf56d46.top + 'px'),
      (_0xc2a204.style.width = _0xf56d46.width + 'px'),
      (_0xc2a204.style.height = _0xf56d46.height + 'px'),
      _0xc2a204.classList.add('is-visible'));
  }
  ['_getLocalPoint'](_0xc38afd) {
    const _0x5ab679 = this.viewportEl?.getBoundingClientRect?.() || { left: 0, top: 0, width: 1, height: 1 },
      _0x112d5a = Math.max(1, Number(this.viewportEl?.offsetWidth) || _0x5ab679.width || 1),
      _0x2d948b = Math.max(1, Number(this.viewportEl?.offsetHeight) || _0x5ab679.height || 1),
      _0x580670 = _0x5ab679.width > 0 ? _0x5ab679.width / _0x112d5a : 1,
      _0x2f97e0 = _0x5ab679.height > 0 ? _0x5ab679.height / _0x2d948b : 1,
      _0x35672b = _0x580670 > 0 ? _0x580670 : 1,
      _0x4d611d = _0x2f97e0 > 0 ? _0x2f97e0 : 1;
    return {
      x: (_0xc38afd?.clientX - _0x5ab679.left) / _0x35672b,
      y: (_0xc38afd?.clientY - _0x5ab679.top) / _0x4d611d,
    };
  }
  ['_clearSelectionBox']() {
    (this._selectionBoxEl?.remove(), (this._selectionBoxEl = null));
  }
  ['_queueDraftClear'](_0x4e3403) {
    if (typeof _0x4e3403 !== 'function') return;
    this._queuedDraftClearTasks.push(_0x4e3403);
    if (this._clearDraftRafId != null) return;
    this._clearDraftRafId = requestAnimationFrame(() => {
      this._clearDraftRafId = null;
      const _0x1cbdd0 = this._queuedDraftClearTasks.splice(0, this._queuedDraftClearTasks.length);
      _0x1cbdd0.forEach((_0x18bb8f) => {
        try {
          _0x18bb8f();
        } catch {}
      });
    });
  }
  ['_cancelQueuedDraftClear']() {
    (this._clearDraftRafId != null &&
      (cancelAnimationFrame(this._clearDraftRafId), (this._clearDraftRafId = null)),
      (this._queuedDraftClearTasks.length = 0));
  }
  ['_beginObjectMove'](_0x4f42a1, _0x45abad, _0x337779, _0x2ccb9a) {
    const _0x2d8fc0 = cloneObjectPose(_0x2ccb9a),
      _0x5ef364 = this.bridge?.intersectGround?.(_0x4f42a1.clientX, _0x4f42a1.clientY, 0) || {
        x: _0x2d8fc0.position.x,
        y: 0,
        z: _0x2d8fc0.position.z,
      };
    return {
      type: 'object-move',
      pointerId: _0x4f42a1.pointerId,
      startX: _0x4f42a1.clientX,
      startY: _0x4f42a1.clientY,
      objectType: _0x337779.objectType,
      objectId: _0x337779.objectId,
      basePose: _0x2d8fc0,
      moved: false,
      offset: { x: _0x5ef364.x - _0x2d8fc0.position.x, z: _0x5ef364.z - _0x2d8fc0.position.z },
    };
  }
  ['_beginBatchMove'](_0x41fb0f, _0x53a631) {
    const _0x2a9b9e = Array.isArray(_0x53a631) ? _0x53a631 : [];
    if (_0x2a9b9e.length === 0) return null;
    const _0x23e12c = _0x2a9b9e.map((_0x54eff1) => ({
        objectType: _0x54eff1.objectType,
        objectId: _0x54eff1.objectId,
        pose: cloneObjectPose(_0x54eff1.item),
      })),
      _0x25b2b4 = _0x23e12c.reduce(
        (_0x536e9e, _0x12540f) => {
          return (
            (_0x536e9e.x += _0x12540f.pose.position.x),
            (_0x536e9e.z += _0x12540f.pose.position.z),
            _0x536e9e
          );
        },
        { x: 0, z: 0 },
      );
    ((_0x25b2b4.x /= _0x23e12c.length), (_0x25b2b4.z /= _0x23e12c.length));
    const _0x4e6fd0 = this.bridge?.intersectGround?.(_0x41fb0f.clientX, _0x41fb0f.clientY, 0) || {
      x: _0x25b2b4.x,
      y: 0,
      z: _0x25b2b4.z,
    };
    return {
      type: 'object-move-batch',
      pointerId: _0x41fb0f.pointerId,
      startX: _0x41fb0f.clientX,
      startY: _0x41fb0f.clientY,
      moved: false,
      baseCenter: _0x25b2b4,
      pointerOffset: { x: _0x4e6fd0.x - _0x25b2b4.x, z: _0x4e6fd0.z - _0x25b2b4.z },
      entries: _0x23e12c.map((_0x33d919) => ({
        ..._0x33d919,
        offset: { x: _0x33d919.pose.position.x - _0x25b2b4.x, z: _0x33d919.pose.position.z - _0x25b2b4.z },
      })),
    };
  }
  ['_beginGizmoMove'](_0x460b34, _0x7d12d5, _0x903fa8) {
    const _0x51b19d = this._getSelectionTargets(_0x7d12d5);
    if (!_0x51b19d.length) return null;
    const _0x569150 = this.bridge?.beginMoveGizmoDrag?.({
      handleKey: _0x903fa8?.handleKey,
      clientX: _0x460b34.clientX,
      clientY: _0x460b34.clientY,
    });
    if (!_0x569150) return null;
    const _0x972e60 = _0x51b19d.map((_0x5ed1a2) => ({
      objectType: _0x5ed1a2.objectType,
      objectId: _0x5ed1a2.objectId,
      basePose: cloneObjectPose(_0x5ed1a2.item),
    }));
    return (
      this.bridge?.setGizmoActiveHandle?.(_0x903fa8.handleKey),
      this.bridge?.setGizmoMoveGuideLine?.({
        from: _0x569150?.pivot || { x: 0, y: 0, z: 0 },
        to: _0x569150?.pivot || { x: 0, y: 0, z: 0 },
      }),
      {
        type: 'gizmo-move',
        pointerId: _0x460b34.pointerId,
        startX: _0x460b34.clientX,
        startY: _0x460b34.clientY,
        moved: false,
        handleKey: _0x903fa8.handleKey,
        dragState: _0x569150,
        entries: _0x972e60,
        draftTargets: [],
      }
    );
  }
  ['_clearGizmoMoveGuideLine']() {
    this.bridge?.clearGizmoMoveGuideLine?.();
  }
  ['_beginGizmoRotate'](_0x17fbeb, _0x570a43, _0x5aaa0f) {
    const _0x37f63a = this._getSelectionTargets(_0x570a43);
    if (!_0x37f63a.length) return null;
    const _0x22dae7 = this.bridge?.beginRotateGizmoDrag?.({
      handleKey: _0x5aaa0f?.handleKey,
      clientX: _0x17fbeb.clientX,
      clientY: _0x17fbeb.clientY,
    });
    if (!_0x22dae7) return null;
    const _0x2acc98 = _0x37f63a.map((_0x166b70) => ({
      objectType: _0x166b70.objectType,
      objectId: _0x166b70.objectId,
      basePose: cloneObjectPose(_0x166b70.item),
    }));
    return (
      this.bridge?.setGizmoActiveHandle?.(_0x5aaa0f.handleKey),
      {
        type: 'gizmo-rotate',
        pointerId: _0x17fbeb.pointerId,
        handleKey: _0x5aaa0f.handleKey,
        dragState: _0x22dae7,
        entries: _0x2acc98,
        moved: false,
        draftTargets: [],
      }
    );
  }
  ['_beginGizmoScale'](_0x10cfda, _0x53aa71, _0x2e45c9) {
    const _0x11aa63 = this._getSelectionTargets(_0x53aa71).filter(
      (_0x156a5f) => _0x156a5f.objectType !== 'camera',
    );
    if (!_0x11aa63.length) return null;
    const _0x2ce367 = this.bridge?.beginScaleGizmoDrag?.({
      handleKey: _0x2e45c9?.handleKey,
      clientX: _0x10cfda.clientX,
      clientY: _0x10cfda.clientY,
    });
    if (!_0x2ce367) return null;
    const _0x598c4f = _0x11aa63.map((_0x49e731) => ({
      objectType: _0x49e731.objectType,
      objectId: _0x49e731.objectId,
      basePose: cloneObjectPose(_0x49e731.item),
      baseScale: toScaleVector(_0x49e731.item?.scale),
    }));
    return (
      this.bridge?.setGizmoActiveHandle?.(_0x2e45c9.handleKey),
      {
        type: 'gizmo-scale',
        pointerId: _0x10cfda.pointerId,
        handleKey: _0x2e45c9.handleKey,
        dragState: _0x2ce367,
        entries: _0x598c4f,
        moved: false,
        draftTargets: [],
      }
    );
  }
  ['_updateGizmoHover'](_0x2328fb) {
    const _0x3ee979 = this.getSceneState?.(),
      _0x3fa166 = this._isPanoramaMode(_0x3ee979);
    this._syncControlsByMode(_0x3fa166);
    if (_0x3fa166 || !_0x3ee979 || !this._isEditing(_0x3ee979) || _0x3ee979.mode !== 'scene') {
      this.bridge?.setGizmoHoverHandle?.(null);
      return;
    }
    const _0x171616 =
        _0x3ee979?.ui?.transformTool ||
        (_0x3ee979?.ui?.activeTool === 'move' ||
        _0x3ee979?.ui?.activeTool === 'rotate' ||
        _0x3ee979?.ui?.activeTool === 'scale'
          ? _0x3ee979.ui.activeTool
          : 'move'),
      _0x242a41 = this._getSelectionTargets(_0x3ee979);
    if (!_0x242a41.length) {
      this.bridge?.setGizmoHoverHandle?.(null);
      return;
    }
    if (_0x171616 !== 'move' && _0x171616 !== 'rotate' && _0x171616 !== 'scale') {
      this.bridge?.setGizmoHoverHandle?.(null);
      return;
    }
    const _0x1dc898 = this.bridge?.pickGizmoHandle?.(_0x2328fb.clientX, _0x2328fb.clientY) || null;
    this.bridge?.setGizmoHoverHandle?.(_0x1dc898?.handleKey || null);
  }
  ['_exitActiveCameraOnManualNavigate'](_0x554abf) {
    if (!_0x554abf || _0x554abf._activeCameraExited) return;
    const _0x1d9192 = this.getSceneState?.();
    if (_0x1d9192?.viewport?.activeView !== 'camera' || !_0x1d9192?.viewport?.activeCameraId) {
      _0x554abf._activeCameraExited = true;
      return;
    }
    (this.onViewCommit?.({
      sceneView: { ..._0x1d9192.viewport.sceneView },
      activeView: 'default',
      activeCameraId: null,
    }),
      (_0x554abf._activeCameraExited = true));
  }
  ['_resolveSceneNavigateGesture'](_0x116b8c) {
    const _0x4d4fd5 = _0x116b8c.altKey === true,
      _0x41e854 = _0x116b8c.button === 0,
      _0x5d35ee = _0x116b8c.button === 1,
      _0x2ab1d2 = _0x116b8c.button === 2;
    if (_0x4d4fd5 && _0x41e854) return 'orbit-scene';
    if (_0x4d4fd5 && _0x5d35ee) return 'pan';
    if (_0x4d4fd5 && _0x2ab1d2) return 'dolly';
    if (_0x5d35ee) return 'pan';
    return null;
  }
  ['_handlePointerDown'](_0x34d63d) {
    const _0x1cfe59 = this.getSceneState?.();
    if (!_0x1cfe59 || !this._isEditing(_0x1cfe59)) return;
    const _0x1f27fd = this._isPanoramaMode(_0x1cfe59);
    (this._syncControlsByMode(_0x1f27fd), this._cancelQueuedDraftClear());
    const _0x192f45 = _0x34d63d.button === 0,
      _0x17c392 = _0x34d63d.button === 1,
      _0x117935 = _0x34d63d.button === 2,
      _0xc2e23 = _0x17c392 && _0x34d63d.ctrlKey,
      _0x79f2e4 = _0x17c392 && _0x34d63d.shiftKey,
      _0x4229a2 = _0x1cfe59.mode === 'scene',
      _0x114690 = this.viewportEl.getBoundingClientRect(),
      _0x249b46 = this._createBaseView(_0x1cfe59);
    (this._stopEvent(_0x34d63d, { preventDefault: true }), this.viewportEl.focus?.());
    if (_0x1f27fd) {
      if (!_0x192f45 && !_0x17c392 && !_0x117935) return;
      (this.bridge?.setGizmoHoverHandle?.(null),
        this._clearGizmoMoveGuideLine(),
        this.bridge?.setGizmoActiveHandle?.(null),
        (this._gesture = {
          type: 'look-panorama',
          pointerId: _0x34d63d.pointerId,
          startX: _0x34d63d.clientX,
          startY: _0x34d63d.clientY,
          moved: false,
          rect: _0x114690,
          baseView: _0x249b46,
        }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (_0x4229a2 && (_0x192f45 || _0x17c392 || _0x117935)) {
      const _0x4a8ebc = this._resolveSceneNavigateGesture(_0x34d63d);
      if (_0x4a8ebc) {
        (this._clearGizmoMoveGuideLine(),
          this.bridge?.setGizmoActiveHandle?.(null),
          (this._gesture = {
            type: _0x4a8ebc,
            pointerId: _0x34d63d.pointerId,
            startX: _0x34d63d.clientX,
            startY: _0x34d63d.clientY,
            moved: false,
            rect: _0x114690,
            baseView: _0x249b46,
          }),
          this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
        return;
      }
      if (_0x192f45) {
        const _0x470165 =
            _0x1cfe59?.ui?.mouseTool ||
            (_0x1cfe59?.ui?.activeTool === 'box-select' ? 'box-select' : 'navigate'),
          _0x49c363 =
            _0x1cfe59?.ui?.transformTool ||
            (_0x1cfe59?.ui?.activeTool === 'move' ||
            _0x1cfe59?.ui?.activeTool === 'rotate' ||
            _0x1cfe59?.ui?.activeTool === 'scale'
              ? _0x1cfe59.ui.activeTool
              : 'move');
        if (_0x49c363 === 'move' || _0x49c363 === 'rotate' || _0x49c363 === 'scale') {
          const _0x1cc5be = this.bridge?.pickGizmoHandle?.(_0x34d63d.clientX, _0x34d63d.clientY) || null;
          if (_0x1cc5be) {
            if (_0x49c363 === 'move') this._gesture = this._beginGizmoMove(_0x34d63d, _0x1cfe59, _0x1cc5be);
            else
              _0x49c363 === 'rotate'
                ? (this._gesture = this._beginGizmoRotate(_0x34d63d, _0x1cfe59, _0x1cc5be))
                : (this._gesture = this._beginGizmoScale(_0x34d63d, _0x1cfe59, _0x1cc5be));
            if (this._gesture) {
              this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId);
              return;
            }
          }
        }
        const _0x4c1dd4 = this.bridge?.pick?.(_0x34d63d.clientX, _0x34d63d.clientY) || null,
          _0x208ff0 = this._getObjectByPick(_0x1cfe59, _0x4c1dd4),
          _0x57c0ce = this._getSelectionTargets(_0x1cfe59),
          _0x3fbc29 =
            _0x4c1dd4 && _0x208ff0
              ? { objectType: _0x4c1dd4.objectType, objectId: _0x4c1dd4.objectId, item: _0x208ff0 }
              : null,
          _0x28bc82 = _0x3fbc29
            ? this._findGroupByMember(_0x1cfe59, _0x3fbc29.objectType, _0x3fbc29.objectId)
            : null;
        let _0x46c9fe = _0x57c0ce;
        if (_0x3fbc29) {
          if (_0x28bc82) {
            const _0x987d56 = this._resolveTargetsByIds(_0x1cfe59, 'mannequin', _0x28bc82.memberIds);
            ((_0x46c9fe = _0x987d56),
              this.onSelectionBatchChange?.('mannequin', _0x28bc82.memberIds, _0x28bc82.id));
          } else {
            const _0x39e203 = new Set(
                this._collectSelectionObjects(_0x1cfe59).map(
                  (_0x169568) => _0x169568.objectType + ':' + _0x169568.objectId,
                ),
              ),
              _0x45e895 = _0x3fbc29.objectType + ':' + _0x3fbc29.objectId;
            !(_0x39e203.has(_0x45e895) && _0x57c0ce.length > 0) &&
              (this.onSelectionChange?.(_0x3fbc29.objectType, _0x3fbc29.objectId), (_0x46c9fe = [_0x3fbc29]));
          }
        }
        if (_0x470165 === 'box-select') {
          const _0x5f4370 = this._getLocalPoint(_0x34d63d);
          ((this._gesture = {
            type: 'selection-box',
            pointerId: _0x34d63d.pointerId,
            startX: _0x34d63d.clientX,
            startY: _0x34d63d.clientY,
            startLocalX: _0x5f4370.x,
            startLocalY: _0x5f4370.y,
            keepSelectionOnClick: !!_0x3fbc29,
            moved: false,
          }),
            this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
          return;
        }
        if (_0x49c363 === 'rotate' && _0x3fbc29) {
          ((this._gesture = {
            type: 'scene-select',
            pointerId: _0x34d63d.pointerId,
            startX: _0x34d63d.clientX,
            startY: _0x34d63d.clientY,
            pickedTarget: _0x3fbc29,
            pickedGroup: _0x28bc82,
            selectionCommittedOnPointerDown: true,
            moved: false,
          }),
            this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
          return;
        }
        if (_0x3fbc29) {
          ((this._gesture =
            _0x46c9fe.length > 1
              ? this._beginBatchMove(_0x34d63d, _0x46c9fe)
              : this._beginObjectMove(
                  _0x34d63d,
                  _0x1cfe59,
                  { objectType: _0x46c9fe[0].objectType, objectId: _0x46c9fe[0].objectId },
                  _0x46c9fe[0].item,
                )),
            this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
          return;
        }
        (this._clearGizmoMoveGuideLine(),
          this.bridge?.setGizmoActiveHandle?.(null),
          (this._gesture = {
            type: 'orbit-scene',
            pointerId: _0x34d63d.pointerId,
            startX: _0x34d63d.clientX,
            startY: _0x34d63d.clientY,
            moved: false,
            clearSelectionOnClick: true,
            rect: _0x114690,
            baseView: _0x249b46,
          }),
          this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
        return;
      }
    }
    if (_0xc2e23) {
      ((this._gesture = {
        type: 'zoom-middle',
        pointerId: _0x34d63d.pointerId,
        startY: _0x34d63d.clientY,
        baseView: _0x249b46,
      }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (_0x79f2e4) {
      ((this._gesture = {
        type: _0x249b46.kind === 'panorama-default' ? 'look-panorama' : 'orbit-scene',
        pointerId: _0x34d63d.pointerId,
        startX: _0x34d63d.clientX,
        startY: _0x34d63d.clientY,
        moved: false,
        rect: _0x114690,
        baseView: _0x249b46,
      }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (_0x17c392) {
      if (_0x249b46.kind !== 'scene-default') return;
      ((this._gesture = {
        type: 'pan',
        pointerId: _0x34d63d.pointerId,
        startX: _0x34d63d.clientX,
        startY: _0x34d63d.clientY,
        moved: false,
        rect: _0x114690,
        baseView: _0x249b46,
      }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (!_0x192f45) return;
    const _0x19a2a7 =
        _0x1cfe59?.ui?.mouseTool || (_0x1cfe59?.ui?.activeTool === 'box-select' ? 'box-select' : 'navigate'),
      _0x1f4230 =
        _0x1cfe59?.ui?.transformTool ||
        (_0x1cfe59?.ui?.activeTool === 'move' ||
        _0x1cfe59?.ui?.activeTool === 'rotate' ||
        _0x1cfe59?.ui?.activeTool === 'scale'
          ? _0x1cfe59.ui.activeTool
          : 'move'),
      _0x370ffd = this.bridge?.pick?.(_0x34d63d.clientX, _0x34d63d.clientY) || null,
      _0x31ce6e = this._getObjectByPick(_0x1cfe59, _0x370ffd),
      _0x3d38fb = this._getSelectionTargets(_0x1cfe59),
      _0x4df79b =
        _0x370ffd && _0x31ce6e
          ? { objectType: _0x370ffd.objectType, objectId: _0x370ffd.objectId, item: _0x31ce6e }
          : null,
      _0x421fa8 = _0x4df79b
        ? this._findGroupByMember(_0x1cfe59, _0x4df79b.objectType, _0x4df79b.objectId)
        : null;
    let _0x193efa = _0x3d38fb;
    if (_0x4df79b) {
      if (_0x421fa8) {
        const _0xea1283 = this._resolveTargetsByIds(_0x1cfe59, 'mannequin', _0x421fa8.memberIds);
        ((_0x193efa = _0xea1283),
          this.onSelectionBatchChange?.('mannequin', _0x421fa8.memberIds, _0x421fa8.id));
      } else {
        const _0x3ec6dd = new Set(
            this._collectSelectionObjects(_0x1cfe59).map(
              (_0x4da906) => _0x4da906.objectType + ':' + _0x4da906.objectId,
            ),
          ),
          _0x28a9de = _0x4df79b.objectType + ':' + _0x4df79b.objectId;
        !(_0x3ec6dd.has(_0x28a9de) && _0x3d38fb.length > 0) &&
          (this.onSelectionChange?.(_0x4df79b.objectType, _0x4df79b.objectId), (_0x193efa = [_0x4df79b]));
      }
    }
    const _0x483c44 = _0x4df79b ? _0x1f4230 : _0x19a2a7;
    if (_0x483c44 === 'move' && _0x193efa.length > 0) {
      ((this._gesture =
        _0x193efa.length > 1
          ? this._beginBatchMove(_0x34d63d, _0x193efa)
          : this._beginObjectMove(
              _0x34d63d,
              _0x1cfe59,
              { objectType: _0x193efa[0].objectType, objectId: _0x193efa[0].objectId },
              _0x193efa[0].item,
            )),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (_0x483c44 === 'rotate' && _0x193efa.length > 0) {
      ((this._gesture = {
        type: 'scene-select',
        pointerId: _0x34d63d.pointerId,
        startX: _0x34d63d.clientX,
        startY: _0x34d63d.clientY,
        pickedTarget: _0x4df79b,
        pickedGroup: _0x421fa8,
        selectionCommittedOnPointerDown: true,
        moved: false,
      }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (_0x483c44 === 'scale' && _0x193efa.length > 0) {
      const _0x3b0974 = _0x193efa.filter((_0x3c4139) => _0x3c4139.objectType !== 'camera');
      if (_0x3b0974.length === 0) return;
      if (_0x3b0974.length > 1) {
        const _0x447c6c = _0x3b0974.map((_0x2cd8ff) => ({
            objectType: _0x2cd8ff.objectType,
            objectId: _0x2cd8ff.objectId,
            basePose: cloneObjectPose(_0x2cd8ff.item),
          })),
          _0x146f5b = _0x447c6c.reduce(
            (_0x1bfd98, _0x54fc60) => {
              return (
                (_0x1bfd98.x += _0x54fc60.basePose.position.x),
                (_0x1bfd98.z += _0x54fc60.basePose.position.z),
                _0x1bfd98
              );
            },
            { x: 0, z: 0 },
          );
        ((_0x146f5b.x /= _0x447c6c.length),
          (_0x146f5b.z /= _0x447c6c.length),
          (this._gesture = {
            type: 'object-scale-batch',
            pointerId: _0x34d63d.pointerId,
            startX: _0x34d63d.clientX,
            rect: _0x114690,
            center: _0x146f5b,
            entries: _0x447c6c,
            moved: false,
          }));
      } else
        this._gesture = {
          type: 'object-scale',
          pointerId: _0x34d63d.pointerId,
          startX: _0x34d63d.clientX,
          objectType: _0x3b0974[0].objectType,
          objectId: _0x3b0974[0].objectId,
          rect: _0x114690,
          basePose: cloneObjectPose(_0x3b0974[0].item),
          moved: false,
        };
      this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId);
      return;
    }
    if (_0x483c44 === 'box-select') {
      _0x4df79b &&
        (_0x421fa8
          ? this.onSelectionBatchChange?.('mannequin', _0x421fa8.memberIds, _0x421fa8.id)
          : this.onSelectionChange?.(_0x4df79b.objectType, _0x4df79b.objectId));
      ((this._gesture = {
        type: 'selection-box',
        pointerId: _0x34d63d.pointerId,
        startX: _0x34d63d.clientX,
        startY: _0x34d63d.clientY,
        startLocalX: this._getLocalPoint(_0x34d63d).x,
        startLocalY: this._getLocalPoint(_0x34d63d).y,
        keepSelectionOnClick: !!_0x4df79b,
        moved: false,
      }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
      return;
    }
    if (_0x483c44 === 'navigate') {
      if (_0x370ffd && _0x31ce6e) {
        _0x193efa.length > 1
          ? (this._gesture = this._beginBatchMove(_0x34d63d, _0x193efa))
          : (this.onSelectionChange?.(_0x370ffd.objectType, _0x370ffd.objectId),
            (this._gesture = this._beginObjectMove(_0x34d63d, _0x1cfe59, _0x370ffd, _0x31ce6e)));
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId);
        return;
      }
      ((this._gesture = {
        type: _0x249b46.kind === 'panorama-default' ? 'look-panorama' : 'orbit-scene',
        pointerId: _0x34d63d.pointerId,
        startX: _0x34d63d.clientX,
        startY: _0x34d63d.clientY,
        rect: _0x114690,
        baseView: _0x249b46,
        moved: false,
      }),
        this.viewportEl.setPointerCapture?.(_0x34d63d.pointerId));
    }
  }
  ['_handlePointerMove'](_0x13618e) {
    if (!this._gesture) {
      this._updateGizmoHover(_0x13618e);
      return;
    }
    if (_0x13618e.pointerId !== this._gesture.pointerId) return;
    this._stopEvent(_0x13618e, { preventDefault: true });
    const _0x170f9b = this._gesture;
    if (_0x170f9b.type === 'orbit-scene') {
      const _0x230e4f = _0x13618e.clientX - _0x170f9b.startX,
        _0x4898e0 = _0x13618e.clientY - _0x170f9b.startY,
        _0x5e10af = Math.hypot(_0x230e4f, _0x4898e0) >= MOVE_THRESHOLD;
      !_0x170f9b.moved && _0x5e10af && this._exitActiveCameraOnManualNavigate(_0x170f9b);
      ((_0x170f9b.moved = _0x170f9b.moved || _0x5e10af), this.bridge?.markViewSmoothingWindow?.());
      const _0x8055bb = applyOrbitDelta(_0x170f9b.baseView.sceneView, _0x230e4f, _0x4898e0, _0x170f9b.rect);
      ((_0x170f9b.draftView = { ..._0x170f9b.baseView.sceneView, ..._0x8055bb }),
        this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: _0x170f9b.draftView }));
      return;
    }
    if (_0x170f9b.type === 'look-panorama') {
      const _0x365ccf = _0x13618e.clientX - _0x170f9b.startX,
        _0x2c3693 = _0x13618e.clientY - _0x170f9b.startY,
        _0x4b88ad = Math.hypot(_0x365ccf, _0x2c3693) >= MOVE_THRESHOLD;
      !_0x170f9b.moved && _0x4b88ad && this._exitActiveCameraOnManualNavigate(_0x170f9b);
      ((_0x170f9b.moved = _0x170f9b.moved || _0x4b88ad), this.bridge?.markViewSmoothingWindow?.());
      const _0xaf61d4 = applyPanoramaLookDelta(
        _0x170f9b.baseView.panoramaView,
        _0x365ccf,
        -_0x2c3693,
        _0x170f9b.rect,
      );
      ((_0x170f9b.draftView = { ..._0x170f9b.baseView.panoramaView, ..._0xaf61d4 }),
        this.bridge?.setDraftView?.({ kind: 'panorama-default', panoramaView: _0x170f9b.draftView }));
      return;
    }
    if (_0x170f9b.type === 'pan') {
      const _0x505945 = _0x13618e.clientX - _0x170f9b.startX,
        _0x551351 = _0x13618e.clientY - _0x170f9b.startY,
        _0x1aa5f9 = Math.hypot(_0x505945, _0x551351) >= MOVE_THRESHOLD;
      !_0x170f9b.moved && _0x1aa5f9 && this._exitActiveCameraOnManualNavigate(_0x170f9b);
      ((_0x170f9b.moved = _0x170f9b.moved || _0x1aa5f9), this.bridge?.markViewSmoothingWindow?.());
      const _0x35bef6 = applyScenePanDelta(
        _0x170f9b.baseView.sceneView,
        _0x170f9b.baseView.currentPose,
        _0x505945,
        _0x551351,
        _0x170f9b.rect,
      );
      ((_0x170f9b.draftView = { ..._0x170f9b.baseView.sceneView, ..._0x35bef6 }),
        this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: _0x170f9b.draftView }));
      return;
    }
    if (_0x170f9b.type === 'dolly') {
      const _0x216999 = Math.abs(_0x13618e.clientY - _0x170f9b.startY) >= MOVE_THRESHOLD;
      !_0x170f9b.moved && _0x216999 && this._exitActiveCameraOnManualNavigate(_0x170f9b);
      _0x170f9b.moved = _0x170f9b.moved || _0x216999;
      const _0x36d2f0 = (_0x13618e.clientY - _0x170f9b.startY) * 8;
      this.bridge?.markViewSmoothingWindow?.();
      const _0x2e3742 = applySceneDollyDelta(_0x170f9b.baseView.sceneView, _0x36d2f0);
      ((_0x170f9b.draftView = { ..._0x170f9b.baseView.sceneView, ..._0x2e3742 }),
        this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: _0x170f9b.draftView }));
      return;
    }
    if (_0x170f9b.type === 'zoom-middle') {
      const _0x45cc1b = Math.abs(_0x13618e.clientY - _0x170f9b.startY) >= MOVE_THRESHOLD;
      !_0x170f9b.moved && _0x45cc1b && this._exitActiveCameraOnManualNavigate(_0x170f9b);
      _0x170f9b.moved = _0x170f9b.moved || _0x45cc1b;
      const _0x345018 = (_0x13618e.clientY - _0x170f9b.startY) * 8;
      this.bridge?.markViewSmoothingWindow?.();
      if (_0x170f9b.baseView.kind === 'panorama-default') {
        const _0x19b8d5 = applyPanoramaZoomDelta(_0x170f9b.baseView.panoramaView, _0x345018);
        ((_0x170f9b.draftView = { ..._0x170f9b.baseView.panoramaView, ..._0x19b8d5 }),
          this.bridge?.setDraftView?.({ kind: 'panorama-default', panoramaView: _0x170f9b.draftView }));
      } else {
        const _0x3071c0 = applySceneZoomDelta(_0x170f9b.baseView.sceneView, _0x345018);
        ((_0x170f9b.draftView = { ..._0x170f9b.baseView.sceneView, ..._0x3071c0 }),
          this.bridge?.setDraftView?.({ kind: 'scene-default', sceneView: _0x170f9b.draftView }));
      }
      return;
    }
    if (_0x170f9b.type === 'selection-box') {
      const _0x1e4986 = _0x13618e.clientX - _0x170f9b.startX,
        _0x370b04 = _0x13618e.clientY - _0x170f9b.startY;
      _0x170f9b.moved = _0x170f9b.moved || Math.hypot(_0x1e4986, _0x370b04) >= MOVE_THRESHOLD;
      const _0x217752 = this._getLocalPoint(_0x13618e);
      this._updateSelectionBox(_0x170f9b.startLocalX, _0x170f9b.startLocalY, _0x217752.x, _0x217752.y);
      return;
    }
    if (_0x170f9b.type === 'scene-select') {
      const _0x2e939a = _0x13618e.clientX - _0x170f9b.startX,
        _0x3222dd = _0x13618e.clientY - _0x170f9b.startY,
        _0x53ab78 = Math.hypot(_0x2e939a, _0x3222dd) >= MOVE_THRESHOLD;
      _0x170f9b.moved = _0x170f9b.moved || _0x53ab78;
      if (!_0x170f9b.pickedTarget && _0x53ab78) {
        const _0x25ab47 = this._getLocalPoint(_0x13618e);
        (this._updateSelectionBox(_0x170f9b.startLocalX, _0x170f9b.startLocalY, _0x25ab47.x, _0x25ab47.y),
          (_0x170f9b.type = 'selection-box'),
          (_0x170f9b.keepSelectionOnClick = false));
      }
      return;
    }
    if (_0x170f9b.type === 'gizmo-move') {
      const _0x2eb90c = this.bridge?.sampleMoveGizmoDragPoint?.(
        _0x170f9b.dragState,
        _0x13618e.clientX,
        _0x13618e.clientY,
      );
      if (!_0x2eb90c) return;
      const _0x342538 = this.bridge?.computeMoveGizmoDelta?.(_0x170f9b.dragState, _0x2eb90c);
      if (!_0x342538) return;
      this.bridge?.setGizmoMoveGuideLine?.({
        from: _0x170f9b.dragState?.pivot || { x: 0, y: 0, z: 0 },
        to: addVector3Like(_0x170f9b.dragState?.pivot, _0x342538),
      });
      const _0x268c3f = Math.hypot(_0x342538.x || 0, _0x342538.y || 0, _0x342538.z || 0);
      ((_0x170f9b.moved = _0x170f9b.moved || _0x268c3f >= 0.0001),
        (_0x170f9b.draftTargets = _0x170f9b.entries.map((_0x76367f) => {
          const _0x30bb9d = {
            ..._0x76367f.basePose,
            position: {
              x: _0x76367f.basePose.position.x + (_0x342538.x || 0),
              y: _0x76367f.basePose.position.y + (_0x342538.y || 0),
              z: _0x76367f.basePose.position.z + (_0x342538.z || 0),
            },
          };
          return (
            this.bridge?.setDraftObjectTransform?.(_0x76367f.objectType, _0x76367f.objectId, _0x30bb9d),
            { objectType: _0x76367f.objectType, objectId: _0x76367f.objectId, pose: _0x30bb9d }
          );
        })));
      return;
    }
    if (_0x170f9b.type === 'gizmo-rotate') {
      const _0x4c1623 = this.bridge?.sampleMoveGizmoDragPoint?.(
        _0x170f9b.dragState,
        _0x13618e.clientX,
        _0x13618e.clientY,
      );
      if (!_0x4c1623) return;
      const _0x1553ce = this.bridge?.computeRotateGizmoAngle?.(_0x170f9b.dragState, _0x4c1623) || 0;
      _0x170f9b.moved = _0x170f9b.moved || Math.abs(_0x1553ce) >= 0.0001;
      if (!_0x170f9b.dragState?.axisWorld || !_0x170f9b.dragState?.pivot) return;
      _0x170f9b.draftTargets = _0x170f9b.entries.map((_0x3e3a0e) => {
        const _0x56af00 = rotatePoseAroundWorldAxis(
            _0x3e3a0e.basePose,
            _0x170f9b.dragState.axisWorld,
            _0x1553ce,
            _0x170f9b.dragState.pivot,
          ),
          _0x10898c = {
            ..._0x3e3a0e.basePose,
            position: _0x56af00.position,
            rotation: _0x56af00.rotation,
            quaternion: _0x56af00.quaternion,
          };
        return (
          this.bridge?.setDraftObjectTransform?.(_0x3e3a0e.objectType, _0x3e3a0e.objectId, _0x10898c),
          { objectType: _0x3e3a0e.objectType, objectId: _0x3e3a0e.objectId, pose: _0x10898c }
        );
      });
      return;
    }
    if (_0x170f9b.type === 'gizmo-scale') {
      const _0x10a882 = this.bridge?.sampleMoveGizmoDragPoint?.(
        _0x170f9b.dragState,
        _0x13618e.clientX,
        _0x13618e.clientY,
      );
      if (!_0x10a882) return;
      const _0x1b5bb6 = this.bridge?.computeScaleGizmoFactor?.(_0x170f9b.dragState, _0x10a882) || 1;
      _0x170f9b.moved = _0x170f9b.moved || Math.abs(_0x1b5bb6 - 1) >= 0.0001;
      const _0xa18c01 = String(_0x170f9b.dragState?.handleKey || '').slice(-1);
      _0x170f9b.draftTargets = _0x170f9b.entries.map((_0x4c34b3) => {
        const _0x52d2a5 = toScaleVector(_0x4c34b3.baseScale);
        let _0x592c8e = { ..._0x52d2a5 };
        if (_0x170f9b.dragState?.mode === 'scale-uniform')
          _0x592c8e = {
            x: Math.max(0.01, _0x52d2a5.x * _0x1b5bb6),
            y: Math.max(0.01, _0x52d2a5.y * _0x1b5bb6),
            z: Math.max(0.01, _0x52d2a5.z * _0x1b5bb6),
          };
        else
          (_0xa18c01 === 'x' || _0xa18c01 === 'y' || _0xa18c01 === 'z') &&
            (_0x592c8e[_0xa18c01] = Math.max(0.01, _0x52d2a5[_0xa18c01] * _0x1b5bb6));
        const _0x4458ab =
            _0x170f9b.dragState?.mode === 'scale-axis'
              ? {
                  x: _0x4c34b3.basePose.position.x,
                  y: _0x4c34b3.basePose.position.y,
                  z: _0x4c34b3.basePose.position.z,
                }
              : _0x170f9b.dragState?.pivot
                ? scalePositionAroundPivot(
                    _0x4c34b3.basePose.position,
                    _0x170f9b.dragState?.pivot,
                    _0x1b5bb6,
                    null,
                  )
                : {
                    x: _0x4c34b3.basePose.position.x,
                    y: _0x4c34b3.basePose.position.y,
                    z: _0x4c34b3.basePose.position.z,
                  },
          _0x3cdcf8 = { ..._0x4c34b3.basePose, position: _0x4458ab, scale: toCompatibleScale(_0x592c8e) };
        return (
          this.bridge?.setDraftObjectTransform?.(_0x4c34b3.objectType, _0x4c34b3.objectId, _0x3cdcf8),
          { objectType: _0x4c34b3.objectType, objectId: _0x4c34b3.objectId, pose: _0x3cdcf8 }
        );
      });
      return;
    }
    if (_0x170f9b.type === 'object-move') {
      const _0x3ef063 = this.bridge?.intersectGround?.(_0x13618e.clientX, _0x13618e.clientY, 0);
      if (_0x3ef063)
        ((_0x170f9b.moved = true),
          (_0x170f9b.draftPose = {
            ..._0x170f9b.basePose,
            position: {
              x: _0x3ef063.x - _0x170f9b.offset.x,
              y: _0x170f9b.basePose.position.y,
              z: _0x3ef063.z - _0x170f9b.offset.z,
            },
          }));
      else {
        const _0x283cdb = _0x13618e.clientX - _0x170f9b.startX,
          _0x237786 = _0x13618e.clientY - _0x170f9b.startY;
        ((_0x170f9b.moved = Math.hypot(_0x283cdb, _0x237786) >= 1),
          (_0x170f9b.draftPose = {
            ..._0x170f9b.basePose,
            position: {
              x: _0x170f9b.basePose.position.x + _0x283cdb * 0.01,
              y: _0x170f9b.basePose.position.y,
              z: _0x170f9b.basePose.position.z - _0x237786 * 0.01,
            },
          }));
      }
      this.bridge?.setDraftObjectTransform?.(_0x170f9b.objectType, _0x170f9b.objectId, _0x170f9b.draftPose);
      return;
    }
    if (_0x170f9b.type === 'object-move-batch') {
      const _0x2b150a = this.bridge?.intersectGround?.(_0x13618e.clientX, _0x13618e.clientY, 0);
      let _0x117abb = _0x170f9b.baseCenter;
      if (_0x2b150a)
        ((_0x170f9b.moved = true),
          (_0x117abb = {
            x: _0x2b150a.x - _0x170f9b.pointerOffset.x,
            z: _0x2b150a.z - _0x170f9b.pointerOffset.z,
          }));
      else {
        const _0x3449df = _0x13618e.clientX - _0x170f9b.startX,
          _0x4395a2 = _0x13618e.clientY - _0x170f9b.startY;
        ((_0x170f9b.moved = Math.hypot(_0x3449df, _0x4395a2) >= 1),
          (_0x117abb = {
            x: _0x170f9b.baseCenter.x + _0x3449df * 0.01,
            z: _0x170f9b.baseCenter.z - _0x4395a2 * 0.01,
          }));
      }
      _0x170f9b.draftTargets = _0x170f9b.entries.map((_0x3c52ab) => {
        const _0x3dd61d = {
          ..._0x3c52ab.pose,
          position: {
            x: _0x117abb.x + _0x3c52ab.offset.x,
            y: _0x3c52ab.pose.position.y,
            z: _0x117abb.z + _0x3c52ab.offset.z,
          },
        };
        return (
          this.bridge?.setDraftObjectTransform?.(_0x3c52ab.objectType, _0x3c52ab.objectId, _0x3dd61d),
          { objectType: _0x3c52ab.objectType, objectId: _0x3c52ab.objectId, pose: _0x3dd61d }
        );
      });
      return;
    }
    if (_0x170f9b.type === 'object-rotate') {
      const _0x5cf0b8 = _0x13618e.clientX - _0x170f9b.startX;
      _0x170f9b.moved = Math.abs(_0x5cf0b8) >= 1;
      const _0x1a4a89 =
        _0x170f9b.basePose.rotation.y -
        (_0x5cf0b8 / Math.max(160, _0x170f9b.rect.width || 1)) * Math.PI * 1.2;
      ((_0x170f9b.draftPose = {
        ..._0x170f9b.basePose,
        rotation: { ..._0x170f9b.basePose.rotation, y: _0x1a4a89 },
      }),
        this.bridge?.setDraftObjectTransform?.(
          _0x170f9b.objectType,
          _0x170f9b.objectId,
          _0x170f9b.draftPose,
        ));
      return;
    }
    if (_0x170f9b.type === 'object-rotate-batch') {
      const _0x2f9fcb = _0x13618e.clientX - _0x170f9b.startX;
      _0x170f9b.moved = Math.abs(_0x2f9fcb) >= 1;
      const _0x4722d3 = -(_0x2f9fcb / Math.max(160, _0x170f9b.rect.width || 1)) * Math.PI * 1.2;
      _0x170f9b.draftTargets = _0x170f9b.entries.map((_0x569964) => {
        const _0x304285 = _0x569964.basePose.position.x - _0x170f9b.center.x,
          _0x896544 = _0x569964.basePose.position.z - _0x170f9b.center.z,
          _0x2bea5a = Math.cos(_0x4722d3),
          _0x52144d = Math.sin(_0x4722d3),
          _0x5133ed = _0x304285 * _0x2bea5a - _0x896544 * _0x52144d,
          _0xbfaea4 = _0x304285 * _0x52144d + _0x896544 * _0x2bea5a,
          _0x9f9b4f = {
            ..._0x569964.basePose,
            position: {
              x: _0x170f9b.center.x + _0x5133ed,
              y: _0x569964.basePose.position.y,
              z: _0x170f9b.center.z + _0xbfaea4,
            },
            rotation: { ..._0x569964.basePose.rotation, y: _0x569964.basePose.rotation.y + _0x4722d3 },
          };
        return (
          this.bridge?.setDraftObjectTransform?.(_0x569964.objectType, _0x569964.objectId, _0x9f9b4f),
          { objectType: _0x569964.objectType, objectId: _0x569964.objectId, pose: _0x9f9b4f }
        );
      });
      return;
    }
    if (_0x170f9b.type === 'object-scale') {
      const _0x3c6a84 = _0x13618e.clientX - _0x170f9b.startX;
      _0x170f9b.moved = Math.abs(_0x3c6a84) >= 1;
      const _0x126fb6 = Math.max(
          0.01,
          Math.min(4, 1 + (_0x3c6a84 / Math.max(120, _0x170f9b.rect.width || 1)) * 2),
        ),
        _0xf571e5 = toScaleVector(_0x170f9b.basePose.scale),
        _0x5a5b8e = toCompatibleScale({
          x: Math.max(0.01, Math.min(4, _0xf571e5.x * _0x126fb6)),
          y: Math.max(0.01, Math.min(4, _0xf571e5.y * _0x126fb6)),
          z: Math.max(0.01, Math.min(4, _0xf571e5.z * _0x126fb6)),
        });
      ((_0x170f9b.draftPose = { ..._0x170f9b.basePose, scale: _0x5a5b8e }),
        this.bridge?.setDraftObjectTransform?.(
          _0x170f9b.objectType,
          _0x170f9b.objectId,
          _0x170f9b.draftPose,
        ));
      return;
    }
    if (_0x170f9b.type === 'object-scale-batch') {
      const _0x1d3211 = _0x13618e.clientX - _0x170f9b.startX;
      _0x170f9b.moved = Math.abs(_0x1d3211) >= 1;
      const _0xc8c88a = Math.max(
        0.01,
        Math.min(4, 1 + (_0x1d3211 / Math.max(120, _0x170f9b.rect.width || 1)) * 2),
      );
      _0x170f9b.draftTargets = _0x170f9b.entries.map((_0x47f338) => {
        const _0x1dca1c = _0x47f338.basePose.position.x - _0x170f9b.center.x,
          _0x307efd = _0x47f338.basePose.position.z - _0x170f9b.center.z,
          _0x3e5cf7 = toScaleVector(_0x47f338.basePose.scale),
          _0x40b692 = {
            ..._0x47f338.basePose,
            position: {
              x: _0x170f9b.center.x + _0x1dca1c * _0xc8c88a,
              y: _0x47f338.basePose.position.y,
              z: _0x170f9b.center.z + _0x307efd * _0xc8c88a,
            },
            scale: toCompatibleScale({
              x: Math.max(0.01, Math.min(4, _0x3e5cf7.x * _0xc8c88a)),
              y: Math.max(0.01, Math.min(4, _0x3e5cf7.y * _0xc8c88a)),
              z: Math.max(0.01, Math.min(4, _0x3e5cf7.z * _0xc8c88a)),
            }),
          };
        return (
          this.bridge?.setDraftObjectTransform?.(_0x47f338.objectType, _0x47f338.objectId, _0x40b692),
          { objectType: _0x47f338.objectType, objectId: _0x47f338.objectId, pose: _0x40b692 }
        );
      });
    }
  }
  ['_handlePointerUp'](_0x5f1723) {
    if (!this._gesture || (_0x5f1723.pointerId != null && _0x5f1723.pointerId !== this._gesture.pointerId))
      return;
    this._stopEvent(_0x5f1723, { preventDefault: true });
    const _0x1ae6f5 = this._gesture;
    ((this._gesture = null), this.viewportEl.releasePointerCapture?.(_0x1ae6f5.pointerId));
    if (_0x1ae6f5.type === 'orbit-scene') {
      if (_0x1ae6f5.clearSelectionOnClick && !_0x1ae6f5.moved) {
        (this.onSelectionClear?.(), this.bridge?.clearDraftView?.());
        return;
      }
      if (!_0x1ae6f5.draftView && _0x1ae6f5.rect) {
        const _0xa7393b = _0x5f1723.clientX - _0x1ae6f5.startX,
          _0x30d689 = _0x5f1723.clientY - _0x1ae6f5.startY,
          _0x2ad8fd = applyOrbitDelta(_0x1ae6f5.baseView.sceneView, _0xa7393b, _0x30d689, _0x1ae6f5.rect);
        _0x1ae6f5.draftView = { ..._0x1ae6f5.baseView.sceneView, ..._0x2ad8fd };
      }
      _0x1ae6f5.draftView
        ? (this.onViewCommit?.({
            sceneView: _0x1ae6f5.draftView,
            activeView: 'default',
            activeCameraId: null,
          }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (_0x1ae6f5.type === 'look-panorama') {
      if (!_0x1ae6f5.draftView && _0x1ae6f5.rect) {
        const _0x1c9f24 = _0x5f1723.clientX - _0x1ae6f5.startX,
          _0x3b297f = _0x5f1723.clientY - _0x1ae6f5.startY,
          _0x4454a8 = applyPanoramaLookDelta(
            _0x1ae6f5.baseView.panoramaView,
            _0x1c9f24,
            -_0x3b297f,
            _0x1ae6f5.rect,
          );
        _0x1ae6f5.draftView = { ..._0x1ae6f5.baseView.panoramaView, ..._0x4454a8 };
      }
      _0x1ae6f5.draftView
        ? (this.onViewCommit?.({
            panoramaView: _0x1ae6f5.draftView,
            activeView: 'default',
            activeCameraId: null,
          }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (_0x1ae6f5.type === 'pan' || _0x1ae6f5.type === 'dolly') {
      _0x1ae6f5.draftView
        ? (this.onViewCommit?.({
            sceneView: _0x1ae6f5.draftView,
            activeView: 'default',
            activeCameraId: null,
          }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (_0x1ae6f5.type === 'zoom-middle') {
      _0x1ae6f5.draftView
        ? (_0x1ae6f5.baseView?.kind === 'panorama-default'
            ? this.onViewCommit?.({
                panoramaView: _0x1ae6f5.draftView,
                activeView: 'default',
                activeCameraId: null,
              })
            : this.onViewCommit?.({
                sceneView: _0x1ae6f5.draftView,
                activeView: 'default',
                activeCameraId: null,
              }),
          this._queueDraftClear(() => this.bridge?.clearDraftView?.()))
        : this.bridge?.clearDraftView?.();
      return;
    }
    if (_0x1ae6f5.type === 'selection-box') {
      this._clearSelectionBox();
      if (!_0x1ae6f5.moved) {
        if (_0x1ae6f5.keepSelectionOnClick) return;
        this.onSelectionClear?.();
        return;
      }
      const _0x57bdec = getClientRectFromPoints(
          _0x1ae6f5.startX,
          _0x1ae6f5.startY,
          _0x5f1723.clientX,
          _0x5f1723.clientY,
        ),
        _0xed7055 = this.bridge?.pickObjectsInRect?.(_0x57bdec) || [];
      if (_0xed7055.length === 0) {
        this.onSelectionClear?.();
        return;
      }
      const _0x6e43b6 = this.getSceneState?.(),
        _0x1e9282 = [],
        _0x4c47ed = new Set(),
        _0x43d661 = new Set(),
        _0x52794c = new Set(),
        _0x5b2dd8 = (_0x875194, _0x4c9a4e) => {
          if ((_0x875194 !== 'mannequin' && _0x875194 !== 'cube') || !_0x4c9a4e) return;
          const _0x55c377 = _0x875194 + ':' + _0x4c9a4e;
          if (_0x4c47ed.has(_0x55c377)) return;
          (_0x4c47ed.add(_0x55c377), _0x1e9282.push({ objectType: _0x875194, objectId: _0x4c9a4e }));
        };
      _0xed7055.forEach((_0x1e096b) => {
        if (_0x1e096b.objectType === 'mannequin')
          (_0x43d661.add(_0x1e096b.objectId), _0x5b2dd8('mannequin', _0x1e096b.objectId));
        else
          _0x1e096b.objectType === 'cube' &&
            (_0x52794c.add(_0x1e096b.objectId), _0x5b2dd8('cube', _0x1e096b.objectId));
      });
      if (_0x1e9282.length === 0) {
        this.onSelectionClear?.();
        return;
      }
      const _0x44d0b4 = Array.isArray(_0x6e43b6?.groups) ? _0x6e43b6.groups : [],
        _0x45a007 = new Set(_0x43d661),
        _0x1ff6a4 = [];
      (_0x44d0b4.forEach((_0x1c9401) => {
        const _0x1c12c8 = Array.isArray(_0x1c9401?.memberIds) ? _0x1c9401.memberIds : [];
        if (!_0x1c12c8.some((_0x3c37ec) => _0x45a007.has(_0x3c37ec))) return;
        (_0x1ff6a4.push(_0x1c9401), _0x1c12c8.forEach((_0x234f6f) => _0x45a007.add(_0x234f6f)));
      }),
        _0x45a007.forEach((_0x51970c) => {
          _0x5b2dd8('mannequin', _0x51970c);
        }));
      const _0x5023bb = _0x1e9282.filter((_0x4a7336) => {
        if (_0x4a7336.objectType === 'cube') return _0x52794c.has(_0x4a7336.objectId);
        return _0x45a007.has(_0x4a7336.objectId);
      });
      if (_0x5023bb.length === 0) {
        this.onSelectionClear?.();
        return;
      }
      const _0x3a7e5b =
        _0x52794c.size === 0 &&
        _0x1ff6a4.length === 1 &&
        _0x5023bb.every((_0x123374) => _0x123374.objectType === 'mannequin') &&
        _0x1ff6a4[0].memberIds.length === _0x5023bb.length &&
        _0x1ff6a4[0].memberIds.every((_0x1f40d7) => _0x45a007.has(_0x1f40d7))
          ? _0x1ff6a4[0].id
          : null;
      this.onSelectionObjectsChange?.(_0x5023bb, {
        activeObjectType: _0x5023bb[0].objectType,
        activeObjectId: _0x5023bb[0].objectId,
        groupId: _0x3a7e5b,
      });
      return;
    }
    if (_0x1ae6f5.type === 'scene-select') {
      if (_0x1ae6f5.pickedTarget) {
        if (_0x1ae6f5.selectionCommittedOnPointerDown) return;
        _0x1ae6f5.pickedGroup
          ? this.onSelectionBatchChange?.(
              'mannequin',
              _0x1ae6f5.pickedGroup.memberIds,
              _0x1ae6f5.pickedGroup.id,
            )
          : this.onSelectionChange?.(_0x1ae6f5.pickedTarget.objectType, _0x1ae6f5.pickedTarget.objectId);
      } else this.onSelectionClear?.();
      return;
    }
    if (_0x1ae6f5.type === 'gizmo-move') {
      (this._clearGizmoMoveGuideLine(), this.bridge?.setGizmoActiveHandle?.(null));
      const _0x2189dc = Array.isArray(_0x1ae6f5.draftTargets) ? _0x1ae6f5.draftTargets : [];
      _0x2189dc.length > 0
        ? (_0x2189dc.length === 1
            ? this.onObjectCommit?.({
                objectType: _0x2189dc[0].objectType,
                objectId: _0x2189dc[0].objectId,
                pose: _0x2189dc[0].pose,
              })
            : this.onObjectBatchCommit?.({ targets: _0x2189dc }),
          this._queueDraftClear(() => {
            _0x2189dc.forEach((_0x46d521) => {
              this.bridge?.clearDraftObjectTransform?.(_0x46d521.objectType, _0x46d521.objectId);
            });
          }))
        : this.bridge?.clearAllDrafts?.();
      this._updateGizmoHover(_0x5f1723);
      return;
    }
    if (_0x1ae6f5.type === 'gizmo-rotate' || _0x1ae6f5.type === 'gizmo-scale') {
      (this._clearGizmoMoveGuideLine(), this.bridge?.setGizmoActiveHandle?.(null));
      const _0x3f51c5 = Array.isArray(_0x1ae6f5.draftTargets) ? _0x1ae6f5.draftTargets : [];
      _0x3f51c5.length > 0
        ? (_0x3f51c5.length === 1
            ? this.onObjectCommit?.({
                objectType: _0x3f51c5[0].objectType,
                objectId: _0x3f51c5[0].objectId,
                pose: _0x3f51c5[0].pose,
              })
            : this.onObjectBatchCommit?.({ targets: _0x3f51c5 }),
          this._queueDraftClear(() => {
            _0x3f51c5.forEach((_0x229fb8) => {
              this.bridge?.clearDraftObjectTransform?.(_0x229fb8.objectType, _0x229fb8.objectId);
            });
          }))
        : this.bridge?.clearAllDrafts?.();
      this._updateGizmoHover(_0x5f1723);
      return;
    }
    if (
      _0x1ae6f5.type === 'object-move' ||
      _0x1ae6f5.type === 'object-rotate' ||
      _0x1ae6f5.type === 'object-scale'
    ) {
      (this.onSelectionChange?.(_0x1ae6f5.objectType, _0x1ae6f5.objectId),
        this.onObjectCommit?.({
          objectType: _0x1ae6f5.objectType,
          objectId: _0x1ae6f5.objectId,
          pose: _0x1ae6f5.draftPose || _0x1ae6f5.basePose,
        }),
        this._queueDraftClear(() =>
          this.bridge?.clearDraftObjectTransform?.(_0x1ae6f5.objectType, _0x1ae6f5.objectId),
        ));
      return;
    }
    if (
      _0x1ae6f5.type === 'object-move-batch' ||
      _0x1ae6f5.type === 'object-rotate-batch' ||
      _0x1ae6f5.type === 'object-scale-batch'
    ) {
      const _0x442f2b = Array.isArray(_0x1ae6f5.draftTargets) ? _0x1ae6f5.draftTargets : [];
      _0x442f2b.length > 0
        ? (this.onObjectBatchCommit?.({ targets: _0x442f2b }),
          this._queueDraftClear(() => {
            _0x442f2b.forEach((_0x524cb9) => {
              this.bridge?.clearDraftObjectTransform?.(_0x524cb9.objectType, _0x524cb9.objectId);
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
  ['_handleWheel'](_0x16bd10) {
    const _0x450590 = this.getSceneState?.();
    if (!_0x450590 || !this._isEditing(_0x450590)) return;
    const _0x4c000c = this._isPanoramaMode(_0x450590);
    (this._syncControlsByMode(_0x4c000c),
      this._stopEvent(_0x16bd10, { preventDefault: true }),
      this.bridge?.markViewSmoothingWindow?.());
    if (_0x4c000c) {
      const _0xd45f67 = _0x450590.viewport.panoramaView;
      this.onViewCommit?.({
        panoramaView: { ..._0xd45f67, ...applyPanoramaZoomDelta(_0xd45f67, _0x16bd10.deltaY) },
        activeView: 'default',
        activeCameraId: null,
      });
      return;
    }
    if (_0x450590.mode === 'panorama') {
      const _0x2671ad = _0x450590.viewport.panoramaView;
      this.onViewCommit?.({
        panoramaView: { ..._0x2671ad, ...applyPanoramaZoomDelta(_0x2671ad, _0x16bd10.deltaY) },
        activeView: 'default',
        activeCameraId: null,
      });
      return;
    }
    const _0x3e864b = this._createBaseView(_0x450590);
    if (_0x3e864b.kind !== 'scene-default') return;
    this.onViewCommit?.({
      sceneView: { ..._0x3e864b.sceneView, ...applySceneZoomDelta(_0x3e864b.sceneView, _0x16bd10.deltaY) },
      activeView: 'default',
      activeCameraId: null,
    });
  }
  ['_handleContextMenu'](_0x27dbb1) {
    const _0x2eff5e = this.getSceneState?.();
    if (!_0x2eff5e || !this._isEditing(_0x2eff5e)) return;
    this._stopEvent(_0x27dbb1, { preventDefault: true });
  }
}
