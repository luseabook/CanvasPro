function toFiniteNumber(_0x776dba) {
  const _0x2bee65 = Number(_0x776dba);
  return Number.isFinite(_0x2bee65) ? _0x2bee65 : null;
}
function normalizeEdgeIds(_0x3a9304) {
  if (_0x3a9304 instanceof Set) return new Set(_0x3a9304);
  if (Array.isArray(_0x3a9304)) return new Set(_0x3a9304);
  return new Set();
}
export function previewNodeResizeGeometry(
  { nodeId: _0x7c5ae2, width: _0xcb78ab, height: _0x2e718a } = {},
  {
    snapshot: _0x1acc3a,
    ensureEdgeIndex: _0x2a468e,
    nodeToEdgeIds: _0x1ed83f,
    renderEdgesByIds: _0x5f40d0,
  } = {},
) {
  if (!_0x7c5ae2 || !_0x1acc3a?.nodes?.[_0x7c5ae2]) return false;
  const _0x55ac47 = toFiniteNumber(_0xcb78ab),
    _0x476907 = toFiniteNumber(_0x2e718a);
  if (_0x55ac47 === null || _0x476907 === null) return false;
  const _0x37d382 = _0x1acc3a.edges || {},
    _0x3328fd = Number.isFinite(_0x1acc3a._edgesRev) ? _0x1acc3a._edgesRev : 0;
  _0x2a468e?.(_0x37d382, _0x3328fd);
  const _0x37397c = normalizeEdgeIds(_0x1ed83f?.get?.(_0x7c5ae2));
  if (_0x37397c.size === 0) return true;
  return (
    _0x5f40d0?.(
      _0x37397c,
      {
        ..._0x1acc3a.nodes,
        [_0x7c5ae2]: { ..._0x1acc3a.nodes[_0x7c5ae2], width: _0x55ac47, height: _0x476907 },
      },
      _0x1acc3a,
    ),
    true
  );
}
export function installNodeResizeGeometryPreviewer(_0x51e358, _0x2f48cc, _0x32a59d, _0x48f60c, _0x32a82d) {
  if (!_0x51e358) return false;
  return (
    (_0x51e358.v2Renderer = _0x51e358.v2Renderer || {}),
    (_0x51e358.v2Renderer.previewNodeResizeGeometry = (_0xd75086) =>
      previewNodeResizeGeometry(_0xd75086, {
        snapshot: typeof _0x2f48cc === 'function' ? _0x2f48cc() : null,
        ensureEdgeIndex: _0x32a59d,
        nodeToEdgeIds: _0x48f60c,
        renderEdgesByIds: _0x32a82d,
      })),
    true
  );
}
