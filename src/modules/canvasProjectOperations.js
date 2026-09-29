import { loadProjectStrict, resolveCanvasData } from '../services/projectService.js';
import { fetchV2ProjectsFromServer, renameV2ProjectOnServer } from '../../api/projectsV2Api.js';
import { buildUniqueCanvasName, stripCanvasProjectFileExtension } from '../utils/canvasProjectFileNames.js';
import { sanitizeMultiCanvasDataForPersistence } from '../utils/thumbnailPersistence.js';
import { commit as commit_2 } from './history.js';
import { t } from '../i18n/index.js';
const text = (_0x101229) => t('projectDropdown.' + _0x101229),
  normalizeName = (_0x2b67ef) =>
    String(_0x2b67ef || '')
      ['replace'](/\s+/g, '\x20')
      ['trim'](),
  lookupName = (_0x2c56b4) => normalizeName(stripCanvasProjectFileExtension(_0x2c56b4))['toLowerCase']();
export function buildCanvasProjectContext(_0x12f1f7 = {}, _0x329611 = {}) {
  const _0x2fa419 = String(_0x12f1f7['filename'] || _0x329611['filename'] || '')['trim']();
  return {
    projectId: String(
      _0x12f1f7['projectId'] || _0x329611['projectId'] || stripCanvasProjectFileExtension(_0x2fa419),
    )['trim'](),
    filename: _0x2fa419,
    projectName: String(
      _0x12f1f7['projectName'] || _0x329611['projectName'] || stripCanvasProjectFileExtension(_0x2fa419),
    )['trim'](),
    recentId: String(_0x12f1f7['recentId'] || _0x329611['recentId'] || '')['trim'](),
    displayPath: String(_0x12f1f7['displayPath'] || _0x329611['displayPath'] || '')['trim'](),
    lastModified: Number(_0x12f1f7['lastModified'] || _0x329611['lastModified'] || 0x0) || 0x0,
    isTemporary: _0x12f1f7['isTemporary'] === !![],
    workspaceProjectScoped: !![],
  };
}
export function createCanvasProjectOperations({
  getCanvasManager: _0x55242f,
  getActiveProjectContext: getActiveProjectContext = () =>
    _0x55242f?.()?.['getCanvasProjectContext']?.() || {},
  loadProject: loadProject = loadProjectStrict,
  listProjects: listProjects = fetchV2ProjectsFromServer,
  renameProject: renameProject = renameV2ProjectOnServer,
  projectWorkspaceSessions: _0xa80f30,
  renameTemporaryProject: renameTemporaryProject = () => ![],
  applySourceNames: _0x9bb039,
  commit: commit = commit_2,
  onProjectHydrated: _0x32c183,
  requestCacheSave: _0x39380c,
} = {}) {
  let _0x59c7a8 = Promise['resolve']();
  const _0x4be844 = new Map();
  function _0x39eae9(_0x5cb62a) {
    const _0x4584d8 = _0x59c7a8['then'](_0x5cb62a);
    return ((_0x59c7a8 = _0x4584d8['catch'](() => {})), _0x4584d8);
  }
  function _0x307e51() {
    const _0x39083d = _0x55242f?.();
    if (!_0x39083d?.['addCanvas'] || !_0x39083d?.['hydrateActiveCanvasSnapshot'])
      throw new Error('CanvasTabManager is unavailable');
    return _0x39083d;
  }
  async function _0x1a2a26(_0x46eba2, _0x366bd, _0x16c7d2) {
    const _0x58c8e6 = _0x46eba2['getActiveCanvasId']?.() || _0x46eba2['_activeId'];
    if (_0x366bd !== _0x58c8e6 && (await _0x46eba2['switchTo']?.(_0x366bd)) === ![]) return ![];
    return (
      _0x46eba2['setCanvasProjectContext']?.(_0x366bd, {
        ...(_0x46eba2['getCanvasProjectContext']?.(_0x366bd) || {}),
        ..._0x16c7d2,
      }),
      {
        activeCanvasId: _0x366bd,
        canvasName:
          _0x46eba2['_canvases']?.['find']((_0x53cece) => _0x53cece['id'] === _0x366bd)?.['name'] ||
          _0x16c7d2['projectName'] ||
          text('loadedPackageBase'),
        hydratedData: null,
        alreadyOpen: !![],
      }
    );
  }
  async function _0x4cd379(_0xddfdc2, { applySourceNames: _0x197c26 = ![] } = {}) {
    if (!_0xddfdc2 || _0xddfdc2['canceled']) return ![];
    const _0x498279 = _0x307e51(),
      _0x22016c = buildCanvasProjectContext(_0xddfdc2),
      _0x5d6282 = _0x498279['findCanvasIdByProjectIdentity']?.(_0x22016c);
    if (_0x5d6282) return _0x1a2a26(_0x498279, _0x5d6282, _0x22016c);
    const _0x108956 = sanitizeMultiCanvasDataForPersistence(
        _0xddfdc2['multiData'] || resolveCanvasData(_0xddfdc2['data'] || {}),
      ),
      _0x5812ff =
        _0x108956?.['canvases']?.['find']((_0x347457) => _0x347457?.['id'] === _0x108956['activeCanvasId']) ||
        _0x108956?.['canvases']?.[0x0];
    if (!_0x5812ff) throw new Error(text('loadFailed'));
    const _0xc99765 = buildUniqueCanvasName(
        _0xddfdc2['projectName'] ||
          stripCanvasProjectFileExtension(_0xddfdc2['filename']) ||
          _0x5812ff['name'],
        _0x498279['_canvases'] || [],
        { fallbackName: text('loadedPackageBase') },
      ),
      _0x2d53ef = { ..._0x5812ff, name: _0xc99765 };
    if (_0x197c26) _0x9bb039?.(_0x2d53ef);
    if ((await _0x498279['addCanvas']()) === ![]) return ![];
    const _0x5c092a = _0x498279['getActiveCanvasId']?.() || _0x498279['_activeId'];
    if (!_0x5c092a) return ![];
    return (
      _0x498279['renameCanvas']?.(_0x5c092a, _0xc99765),
      _0x498279['hydrateActiveCanvasSnapshot'](_0x2d53ef),
      _0x498279['setCanvasProjectContext']?.(_0x5c092a, {
        ..._0x22016c,
        projectName: _0x22016c['projectName'] || _0xc99765,
      }),
      _0x498279['markCanvasClean']?.(_0x5c092a),
      _0x498279['renderTabs']?.(),
      commit(),
      _0x32c183?.({ activeCanvasId: _0x5c092a, projectContext: _0x22016c }),
      _0x39380c?.(),
      { activeCanvasId: _0x5c092a, canvasName: _0xc99765, hydratedData: _0x108956 }
    );
  }
  function _0x14699d(_0x24accb, _0x6e2ebf, { onProgress: _0x590467 } = {}) {
    const _0x3a626b = String(_0x24accb || '')['trim'](),
      _0x32af91 = stripCanvasProjectFileExtension(_0x3a626b),
      _0x3712f1 = JSON['stringify']([_0x3a626b, String(_0x6e2ebf || _0x32af91)]);
    if (_0x4be844['has'](_0x3712f1)) return _0x4be844['get'](_0x3712f1);
    const _0x414c59 = _0x39eae9(async () => {
      if (!_0x3a626b) throw new Error(text('loadFailed'));
      await _0x590467?.('reading');
      const _0x5b73a9 = _0x307e51(),
        _0x490851 = {
          projectId: _0x32af91,
          filename: _0x3a626b,
          projectName: _0x6e2ebf || _0x32af91,
          isTemporary: ![],
          workspaceProjectScoped: !![],
        },
        _0x5e916b = _0x5b73a9['findCanvasIdByProjectIdentity']?.(_0x490851);
      if (_0x5e916b) return _0x1a2a26(_0x5b73a9, _0x5e916b, _0x490851);
      let _0x193122;
      try {
        _0x193122 = sanitizeMultiCanvasDataForPersistence(await loadProject(_0x3a626b));
      } catch (_0x43dca3) {
        throw new Error(text('loadFailed'), { cause: _0x43dca3 });
      }
      if (!_0x193122?.['canvases']?.['length']) throw new Error(text('loadFailed'));
      return (
        await _0x590467?.('hydrating'),
        _0x4cd379({ ..._0x490851, multiData: _0x193122 }, { applySourceNames: !![] })
      );
    })['finally'](() => _0x4be844['delete'](_0x3712f1));
    return (_0x4be844['set'](_0x3712f1, _0x414c59), _0x414c59);
  }
  function _0x5341c8(_0x3304b5, _0x505389) {
    const _0x5de330 = { ..._0x3304b5 },
      _0x1bd8d6 = normalizeName(_0x505389);
    return _0x39eae9(async () => {
      if (!_0x1bd8d6) throw new Error(text('renameFailed'));
      const _0x219304 = await listProjects(),
        _0x9d2f1 = _0x219304['some'](
          (_0x626148) =>
            String(_0x626148?.['filename'] || '')['trim']() !==
              String(_0x5de330['filename'] || '')['trim']() &&
            [_0x626148?.['name'], _0x626148?.['filename']]['some'](
              (_0x53c625) => lookupName(_0x53c625) === lookupName(_0x1bd8d6),
            ),
        );
      if (_0x9d2f1) throw new Error(text('nameExists'));
      const _0x1b6482 = await renameProject(_0x5de330['filename'], _0x1bd8d6);
      if (!_0x1b6482?.['success']) throw new Error(text('renameFailed'));
      const _0x3b05c2 = _0x55242f?.(),
        _0x523165 = {
          projectId: stripCanvasProjectFileExtension(_0x5de330['filename']),
          filename: _0x5de330['filename'],
          projectName: _0x5de330['name'] || stripCanvasProjectFileExtension(_0x5de330['filename']),
        },
        _0x51980d = _0x3b05c2?.['findCanvasIdByProjectIdentity']?.(_0x523165),
        _0x322b5a = String(_0x1b6482['filename'] || _0x5de330['filename'] || '')['trim']();
      return (
        _0x51980d &&
          (_0x3b05c2['setCanvasProjectContext']?.(_0x51980d, {
            ...(_0x3b05c2['getCanvasProjectContext']?.(_0x51980d) || {}),
            projectId: _0x322b5a ? stripCanvasProjectFileExtension(_0x322b5a) : _0x1bd8d6,
            filename: _0x322b5a,
            projectName: _0x1bd8d6,
            recentId: '',
            displayPath: '',
            lastModified: 0x0,
            isTemporary: ![],
          }),
          _0x3b05c2['renameCanvas']?.(_0x51980d, _0x1bd8d6),
          _0x3b05c2['renderTabs']?.()),
        await _0xa80f30?.['move']?.(_0x5de330['filename'], _0x1b6482['filename'] || _0x1bd8d6, {
          projectName: _0x1bd8d6,
        }),
        { ..._0x1b6482, name: _0x1bd8d6, filename: _0x322b5a }
      );
    });
  }
  function _0xb8f95(_0x1620af) {
    const _0x2374ee = normalizeName(_0x1620af);
    if (!_0x2374ee) return Promise['resolve'](![]);
    const _0x478c3d = getActiveProjectContext(),
      _0x499ca4 = String(_0x478c3d?.['filename'] || _0x478c3d?.['projectId'] || '')['trim']();
    if (_0x478c3d?.['isTemporary'] === !![] || !_0x499ca4)
      return Promise['resolve'](renameTemporaryProject(_0x2374ee));
    return _0x5341c8(
      { filename: _0x499ca4, name: _0x478c3d['projectName'] || stripCanvasProjectFileExtension(_0x499ca4) },
      _0x2374ee,
    )['then']((_0x24a089) => _0x24a089['name']);
  }
  return Object['freeze']({
    openProject: _0x14699d,
    appendProject: (_0x350bf0, _0x50b0bc) => _0x39eae9(() => _0x4cd379(_0x350bf0, _0x50b0bc)),
    renameProject: _0x5341c8,
    renameCurrentProject: _0xb8f95,
  });
}
