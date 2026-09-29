import { normalizePersonReplacementWorkspaceProject } from './personReplacementProjectSession.js';
export function refreshPersonReplacementWorkspaceAssets(_0x4a92ec, _0x220c4a) {
  let _0x4c0927;
  try {
    _0x4c0927 = _0x220c4a?.();
  } catch {
    return _0x4a92ec;
  }
  return Array['isArray'](_0x4c0927)
    ? normalizePersonReplacementWorkspaceProject({ ..._0x4a92ec, libraryAssets: _0x4c0927 })
    : _0x4a92ec;
}
export function buildPersonReplacementWorkspaceSnapshot({
  project: _0x226f88,
  libraryProjects: _0x475f72,
  libraryAssets: _0x316ae3,
  sourcePreviewUrls: _0x54e7cb,
  persistenceState: _0x1a670e,
  workspaceView: _0x22364c,
} = {}) {
  const _0x497b8a = new Set(_0x226f88['sources']['map']((_0x9d3227) => _0x9d3227['id']));
  return JSON['parse'](
    JSON['stringify']({
      ..._0x226f88,
      sourcePreviewRefs: Object['fromEntries'](
        [..._0x54e7cb['entries']()]['flatMap'](([_0xfe26d4, _0x2dfaa0]) => {
          const [_0x461531, _0x30a146] = _0xfe26d4['split']('\x1f');
          return _0x461531 === String(_0x226f88['id'] || '')['trim']() && _0x497b8a['has'](_0x30a146)
            ? [[_0x30a146, _0x2dfaa0]]
            : [];
        }),
      ),
      libraryProjects: _0x475f72,
      libraryAssets: _0x316ae3,
      persistenceState: _0x1a670e,
      workspace: { ..._0x226f88['workspace'], view: _0x22364c },
    }),
  );
}
