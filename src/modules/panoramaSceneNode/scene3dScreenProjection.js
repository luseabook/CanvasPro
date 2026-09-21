export function resolveRendererScreenSize(_0x1c7da0) {
  const _0x4efa50 = _0x1c7da0?.getBoundingClientRect?.(),
    _0x5cbc22 = Math.max(
      1,
      Number(_0x4efa50?.width) || Number(_0x1c7da0?.clientWidth) || Number(_0x1c7da0?.width) || 1,
    ),
    _0x86aec5 = Math.max(
      1,
      Number(_0x4efa50?.height) || Number(_0x1c7da0?.clientHeight) || Number(_0x1c7da0?.height) || 1,
    );
  return { width: _0x5cbc22, height: _0x86aec5 };
}
export function projectWorldPointToScreen(_0x9df58b, _0x2ad173, _0x1c7e07) {
  if (!_0x9df58b?.isVector3 || !_0x2ad173) return null;
  (_0x2ad173.updateMatrixWorld?.(), _0x2ad173.updateProjectionMatrix?.());
  const _0x36d5ad = _0x9df58b.clone().project(_0x2ad173);
  if (!Number.isFinite(_0x36d5ad.x) || !Number.isFinite(_0x36d5ad.y) || !Number.isFinite(_0x36d5ad.z))
    return null;
  const { width: _0xdd03db, height: _0x3bc8b8 } = resolveRendererScreenSize(_0x1c7e07);
  return { x: (_0x36d5ad.x + 1) * 0.5 * _0xdd03db, y: (1 - _0x36d5ad.y) * 0.5 * _0x3bc8b8 };
}
export function resolveAxisScreenDragMetric({
  pivot: _0x3ed209,
  axisWorld: _0xcf03fc,
  camera: _0x56de58,
  domElement: _0x2610c3,
  worldDistance: worldDistance = 1,
} = {}) {
  if (!_0x3ed209?.isVector3 || !_0xcf03fc?.isVector3) return null;
  const _0x5a1f9f = projectWorldPointToScreen(_0x3ed209, _0x56de58, _0x2610c3),
    _0x378321 = projectWorldPointToScreen(
      _0x3ed209.clone().add(
        _0xcf03fc
          .clone()
          .normalize()
          .multiplyScalar(Math.max(0.01, Number(worldDistance) || 1)),
      ),
      _0x56de58,
      _0x2610c3,
    );
  if (!_0x5a1f9f || !_0x378321) return null;
  const _0x4b8637 = _0x378321.x - _0x5a1f9f.x,
    _0x22768b = _0x378321.y - _0x5a1f9f.y,
    _0x87afe5 = Math.hypot(_0x4b8637, _0x22768b);
  if (!Number.isFinite(_0x87afe5) || _0x87afe5 < 0.001) return null;
  return {
    axisScreenDirection: { x: _0x4b8637 / _0x87afe5, y: _0x22768b / _0x87afe5 },
    screenReferencePixels: Math.max(32, Math.min(180, _0x87afe5)),
  };
}
