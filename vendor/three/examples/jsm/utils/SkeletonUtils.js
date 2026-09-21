import {
  AnimationClip,
  AnimationMixer,
  Matrix4,
  Quaternion,
  QuaternionKeyframeTrack,
  SkeletonHelper,
  Vector3,
  VectorKeyframeTrack,
} from '../../../three.module.js';
function getBoneName(_0x468153, _0x534b4f) {
  if (_0x534b4f.getBoneName !== undefined) return _0x534b4f.getBoneName(_0x468153);
  return _0x534b4f.names[_0x468153.name];
}
function retarget(_0x53267c, _0x1e5cf3, _0x5992f0 = {}) {
  const _0x284465 = new Quaternion(),
    _0x1d1a37 = new Vector3(),
    _0x1eb880 = new Matrix4(),
    _0x3c4bdd = new Matrix4();
  ((_0x5992f0.preserveBoneMatrix =
    _0x5992f0.preserveBoneMatrix !== undefined ? _0x5992f0.preserveBoneMatrix : true),
    (_0x5992f0.preserveBonePositions =
      _0x5992f0.preserveBonePositions !== undefined ? _0x5992f0.preserveBonePositions : true),
    (_0x5992f0.useTargetMatrix = _0x5992f0.useTargetMatrix !== undefined ? _0x5992f0.useTargetMatrix : false),
    (_0x5992f0.hip = _0x5992f0.hip !== undefined ? _0x5992f0.hip : 'hip'),
    (_0x5992f0.hipInfluence =
      _0x5992f0.hipInfluence !== undefined ? _0x5992f0.hipInfluence : new Vector3(1, 1, 1)),
    (_0x5992f0.scale = _0x5992f0.scale !== undefined ? _0x5992f0.scale : 1),
    (_0x5992f0.names = _0x5992f0.names || {}));
  const _0x55d74d = _0x1e5cf3.isObject3D ? _0x1e5cf3.skeleton.bones : getBones(_0x1e5cf3),
    _0x27dfdc = _0x53267c.isObject3D ? _0x53267c.skeleton.bones : getBones(_0x53267c);
  let _0x4a0d33, _0xbfd538, _0x161dac, _0xcd23fd;
  _0x53267c.isObject3D
    ? _0x53267c.skeleton.pose()
    : ((_0x5992f0.useTargetMatrix = true), (_0x5992f0.preserveBoneMatrix = false));
  if (_0x5992f0.preserveBonePositions) {
    _0xcd23fd = [];
    for (let _0x14e6e7 = 0; _0x14e6e7 < _0x27dfdc.length; _0x14e6e7++) {
      _0xcd23fd.push(_0x27dfdc[_0x14e6e7].position.clone());
    }
  }
  if (_0x5992f0.preserveBoneMatrix) {
    (_0x53267c.updateMatrixWorld(), _0x53267c.matrixWorld.identity());
    for (let _0x5a45d1 = 0; _0x5a45d1 < _0x53267c.children.length; ++_0x5a45d1) {
      _0x53267c.children[_0x5a45d1].updateMatrixWorld(true);
    }
  }
  for (let _0x4f7673 = 0; _0x4f7673 < _0x27dfdc.length; ++_0x4f7673) {
    ((_0x4a0d33 = _0x27dfdc[_0x4f7673]),
      (_0xbfd538 = getBoneName(_0x4a0d33, _0x5992f0)),
      (_0x161dac = getBoneByName(_0xbfd538, _0x55d74d)),
      _0x3c4bdd.copy(_0x4a0d33.matrixWorld),
      _0x161dac &&
        (_0x161dac.updateMatrixWorld(),
        _0x5992f0.useTargetMatrix
          ? _0x1eb880.copy(_0x161dac.matrixWorld)
          : (_0x1eb880.copy(_0x53267c.matrixWorld).invert(), _0x1eb880.multiply(_0x161dac.matrixWorld)),
        _0x1d1a37.setFromMatrixScale(_0x1eb880),
        _0x1eb880.scale(_0x1d1a37.set(1 / _0x1d1a37.x, 1 / _0x1d1a37.y, 1 / _0x1d1a37.z)),
        _0x3c4bdd.makeRotationFromQuaternion(_0x284465.setFromRotationMatrix(_0x1eb880)),
        _0x53267c.isObject3D &&
          _0x5992f0.localOffsets &&
          _0x5992f0.localOffsets[_0x4a0d33.name] &&
          _0x3c4bdd.multiply(_0x5992f0.localOffsets[_0x4a0d33.name]),
        _0x3c4bdd.copyPosition(_0x1eb880)),
      _0xbfd538 === _0x5992f0.hip &&
        ((_0x3c4bdd.elements[12] *= _0x5992f0.scale * _0x5992f0.hipInfluence.x),
        (_0x3c4bdd.elements[13] *= _0x5992f0.scale * _0x5992f0.hipInfluence.y),
        (_0x3c4bdd.elements[14] *= _0x5992f0.scale * _0x5992f0.hipInfluence.z),
        _0x5992f0.hipPosition !== undefined &&
          ((_0x3c4bdd.elements[12] += _0x5992f0.hipPosition.x * _0x5992f0.scale),
          (_0x3c4bdd.elements[13] += _0x5992f0.hipPosition.y * _0x5992f0.scale),
          (_0x3c4bdd.elements[14] += _0x5992f0.hipPosition.z * _0x5992f0.scale))),
      _0x4a0d33.parent
        ? (_0x4a0d33.matrix.copy(_0x4a0d33.parent.matrixWorld).invert(), _0x4a0d33.matrix.multiply(_0x3c4bdd))
        : _0x4a0d33.matrix.copy(_0x3c4bdd),
      _0x4a0d33.matrix.decompose(_0x4a0d33.position, _0x4a0d33.quaternion, _0x4a0d33.scale),
      _0x4a0d33.updateMatrixWorld());
  }
  if (_0x5992f0.preserveBonePositions)
    for (let _0x23e6de = 0; _0x23e6de < _0x27dfdc.length; ++_0x23e6de) {
      ((_0x4a0d33 = _0x27dfdc[_0x23e6de]),
        (_0xbfd538 = getBoneName(_0x4a0d33, _0x5992f0) || _0x4a0d33.name),
        _0xbfd538 !== _0x5992f0.hip && _0x4a0d33.position.copy(_0xcd23fd[_0x23e6de]));
    }
  _0x5992f0.preserveBoneMatrix && _0x53267c.updateMatrixWorld(true);
}
function retargetClip(_0x1c5afa, _0x924cda, _0x20746b, _0x30990b = {}) {
  ((_0x30990b.useFirstFramePosition =
    _0x30990b.useFirstFramePosition !== undefined ? _0x30990b.useFirstFramePosition : false),
    (_0x30990b.fps =
      _0x30990b.fps !== undefined
        ? _0x30990b.fps
        : Math.max(..._0x20746b.tracks.map((_0x462a9e) => _0x462a9e.times.length)) / _0x20746b.duration),
    (_0x30990b.names = _0x30990b.names || []));
  !_0x924cda.isObject3D && (_0x924cda = getHelperFromSkeleton(_0x924cda));
  const _0x1beabe = Math.round(_0x20746b.duration * (_0x30990b.fps / 0x3e8) * 0x3e8),
    _0x100e8d = _0x20746b.duration / (_0x1beabe - 1),
    _0x5f48d1 = [],
    _0x1705e7 = new AnimationMixer(_0x924cda),
    _0x5f52dc = getBones(_0x1c5afa.skeleton),
    _0x2b30c2 = [];
  let _0x1f4fa0, _0x4829d3, _0x42a529, _0x59af86, _0x3a2ea5;
  _0x1705e7.clipAction(_0x20746b).play();
  let _0x30d27b = 0,
    _0x2697ee = _0x1beabe;
  _0x30990b.trim !== undefined
    ? ((_0x30d27b = Math.round(_0x30990b.trim[0] * _0x30990b.fps)),
      (_0x2697ee = Math.min(Math.round(_0x30990b.trim[1] * _0x30990b.fps), _0x1beabe) - _0x30d27b),
      _0x1705e7.update(_0x30990b.trim[0]))
    : _0x1705e7.update(0);
  _0x924cda.updateMatrixWorld();
  for (let _0x3e3fbb = 0; _0x3e3fbb < _0x2697ee; ++_0x3e3fbb) {
    const _0x510a65 = _0x3e3fbb * _0x100e8d;
    retarget(_0x1c5afa, _0x924cda, _0x30990b);
    for (let _0x2694bd = 0; _0x2694bd < _0x5f52dc.length; ++_0x2694bd) {
      ((_0x4829d3 = _0x5f52dc[_0x2694bd]),
        (_0x3a2ea5 = getBoneName(_0x4829d3, _0x30990b) || _0x4829d3.name),
        (_0x42a529 = getBoneByName(_0x3a2ea5, _0x924cda.skeleton)),
        _0x42a529 &&
          ((_0x59af86 = _0x2b30c2[_0x2694bd] = _0x2b30c2[_0x2694bd] || { bone: _0x4829d3 }),
          _0x30990b.hip === _0x3a2ea5 &&
            (!_0x59af86.pos &&
              (_0x59af86.pos = {
                times: new Float32Array(_0x2697ee),
                values: new Float32Array(_0x2697ee * 3),
              }),
            _0x30990b.useFirstFramePosition &&
              (_0x3e3fbb === 0 && (_0x1f4fa0 = _0x4829d3.position.clone()),
              _0x4829d3.position.sub(_0x1f4fa0)),
            (_0x59af86.pos.times[_0x3e3fbb] = _0x510a65),
            _0x4829d3.position.toArray(_0x59af86.pos.values, _0x3e3fbb * 3)),
          !_0x59af86.quat &&
            (_0x59af86.quat = {
              times: new Float32Array(_0x2697ee),
              values: new Float32Array(_0x2697ee * 4),
            }),
          (_0x59af86.quat.times[_0x3e3fbb] = _0x510a65),
          _0x4829d3.quaternion.toArray(_0x59af86.quat.values, _0x3e3fbb * 4)));
    }
    (_0x3e3fbb === _0x2697ee - 2 ? _0x1705e7.update(_0x100e8d - 1e-7) : _0x1705e7.update(_0x100e8d),
      _0x924cda.updateMatrixWorld());
  }
  for (let _0x4985cf = 0; _0x4985cf < _0x2b30c2.length; ++_0x4985cf) {
    ((_0x59af86 = _0x2b30c2[_0x4985cf]),
      _0x59af86 &&
        (_0x59af86.pos &&
          _0x5f48d1.push(
            new VectorKeyframeTrack(
              '.bones[' + _0x59af86.bone.name + '].position',
              _0x59af86.pos.times,
              _0x59af86.pos.values,
            ),
          ),
        _0x5f48d1.push(
          new QuaternionKeyframeTrack(
            '.bones[' + _0x59af86.bone.name + '].quaternion',
            _0x59af86.quat.times,
            _0x59af86.quat.values,
          ),
        )));
  }
  return (_0x1705e7.uncacheAction(_0x20746b), new AnimationClip(_0x20746b.name, -1, _0x5f48d1));
}
function clone(_0x43a138) {
  const _0x315a0b = new Map(),
    _0x5db66b = new Map(),
    _0x4c9b8a = _0x43a138.clone();
  return (
    parallelTraverse(_0x43a138, _0x4c9b8a, function (_0x510236, _0x826a9e) {
      (_0x315a0b.set(_0x826a9e, _0x510236), _0x5db66b.set(_0x510236, _0x826a9e));
    }),
    _0x4c9b8a.traverse(function (_0x8726cf) {
      if (!_0x8726cf.isSkinnedMesh) return;
      const _0x31df2e = _0x8726cf,
        _0x55a90e = _0x315a0b.get(_0x8726cf),
        _0x509891 = _0x55a90e.skeleton.bones;
      ((_0x31df2e.skeleton = _0x55a90e.skeleton.clone()),
        _0x31df2e.bindMatrix.copy(_0x55a90e.bindMatrix),
        (_0x31df2e.skeleton.bones = _0x509891.map(function (_0x5b67a7) {
          return _0x5db66b.get(_0x5b67a7);
        })),
        _0x31df2e.bind(_0x31df2e.skeleton, _0x31df2e.bindMatrix));
    }),
    _0x4c9b8a
  );
}
function getBoneByName(_0x3cf34a, _0x224214) {
  for (let _0x3d9eb3 = 0, _0x4b2b4c = getBones(_0x224214); _0x3d9eb3 < _0x4b2b4c.length; _0x3d9eb3++) {
    if (_0x3cf34a === _0x4b2b4c[_0x3d9eb3].name) return _0x4b2b4c[_0x3d9eb3];
  }
}
function getBones(_0x5e1dcf) {
  return Array.isArray(_0x5e1dcf) ? _0x5e1dcf : _0x5e1dcf.bones;
}
function getHelperFromSkeleton(_0x3f5976) {
  const _0x512c4f = new SkeletonHelper(_0x3f5976.bones[0]);
  return ((_0x512c4f.skeleton = _0x3f5976), _0x512c4f);
}
function parallelTraverse(_0x8665b8, _0x1373ec, _0x403ace) {
  _0x403ace(_0x8665b8, _0x1373ec);
  for (let _0x37b54d = 0; _0x37b54d < _0x8665b8.children.length; _0x37b54d++) {
    parallelTraverse(_0x8665b8.children[_0x37b54d], _0x1373ec.children[_0x37b54d], _0x403ace);
  }
}
export { retarget, retargetClip, clone };
