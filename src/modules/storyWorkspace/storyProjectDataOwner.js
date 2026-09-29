import { normalizeStoryWorkspaceAssetData } from './storyAssetAppearances.js';
import { createStoryProjectUiState } from './storyProjectSession.js';
import { isStoryProjectTaskTokenCurrent, isStoryProjectTaskTokenLive } from './storyProjectTaskToken.js';
import { createStoryWorkspaceSnapshot } from './storyWorkspacePersistence.js';
const normalizeText = (_0x20e47e) => String(_0x20e47e ?? '')['trim'](),
  cloneData = (_0xc18daf) => JSON['parse'](JSON['stringify'](_0xc18daf)),
  getProjectId = (_0x401b6d) => normalizeText(_0x401b6d?.['project']?.['id']),
  getEntryId = (_0x3b63bd) => normalizeText(_0x3b63bd?.['id'] || _0x3b63bd?.['data']?.['project']?.['id']);
export function createStoryProjectDataOwner({ state: _0x23ce50 } = {}) {
  if (!_0x23ce50 || typeof _0x23ce50 !== 'object')
    throw new TypeError('Story project data requires workspace state.');
  const _0x1a38a3 = new Map();
  function _0x265a37(_0x36b37c) {
    const _0x49d2ac = getProjectId(_0x36b37c);
    if (!_0x49d2ac) return ![];
    return (_0x1a38a3['set'](_0x49d2ac, _0x36b37c), !![]);
  }
  function _0x5c957c(_0x16007d) {
    const _0xc05480 = normalizeText(_0x16007d);
    return (_0x23ce50['projects'] || [])['find']((_0x38cfa8) => getEntryId(_0x38cfa8) === _0xc05480) || null;
  }
  function _0x2b69c9(_0x13cf2a) {
    const _0x2e7e5e = normalizeText(_0x13cf2a);
    if (!_0x2e7e5e) return null;
    if (_0x2e7e5e === getProjectId(_0x23ce50['data'])) return _0x23ce50['data'];
    if (_0x1a38a3['has'](_0x2e7e5e)) return _0x1a38a3['get'](_0x2e7e5e);
    const _0x42ee84 = _0x5c957c(_0x2e7e5e);
    if (!_0x42ee84?.['data']?.['project']) return null;
    const _0x5d8235 = normalizeStoryWorkspaceAssetData(cloneData(_0x42ee84['data']));
    return (_0x265a37(_0x5d8235), _0x5d8235);
  }
  function _0x285441(
    _0x252f81,
    {
      isCurrent: isCurrent = _0x252f81 === _0x23ce50['data'],
      projectTitleEdited: projectTitleEdited = ![],
    } = {},
  ) {
    const _0x5c3b85 = getProjectId(_0x252f81);
    if (!_0x5c3b85) return ![];
    _0x265a37(_0x252f81);
    const _0x296cf7 = (_0x23ce50['projects'] ||= []),
      _0x29f2ad = _0x296cf7['findIndex']((_0x37deaf) => getEntryId(_0x37deaf) === _0x5c3b85),
      _0x55eaa4 = _0x29f2ad >= 0x0 ? _0x296cf7[_0x29f2ad] : {},
      _0x150f32 = {
        ..._0x55eaa4,
        id: _0x5c3b85,
        title: _0x252f81['project']['title'],
        createdAt: Number(_0x55eaa4['createdAt'] || 0x0) || Date['now'](),
        updatedAt: Date['now'](),
        projectTitleEdited: isCurrent
          ? _0x23ce50['projectTitleEdited'] === !![]
          : projectTitleEdited === !![] || _0x55eaa4['projectTitleEdited'] === !![],
        ui:
          isCurrent && _0x23ce50['view'] !== 'home'
            ? createStoryProjectUiState(_0x23ce50)
            : cloneData(_0x55eaa4['ui'] || (isCurrent ? createStoryProjectUiState(_0x23ce50) : {})),
        data: cloneData(_0x252f81),
      };
    if (_0x29f2ad >= 0x0) _0x296cf7[_0x29f2ad] = _0x150f32;
    else _0x296cf7['unshift'](_0x150f32);
    return !![];
  }
  function _0xc0a33d() {
    return _0x23ce50['hasCreatedProject'] === !![] && _0x285441(_0x23ce50['data']);
  }
  function _0xb8b56f(_0x54ec33) {
    return isStoryProjectTaskTokenLive(_0x23ce50, _0x54ec33) && _0x265a37(_0x54ec33['data']);
  }
  function _0x295fa4(_0x56050e) {
    if (!isStoryProjectTaskTokenLive(_0x23ce50, _0x56050e)) return ![];
    return _0x285441(_0x56050e['data'], {
      isCurrent: isStoryProjectTaskTokenCurrent(_0x23ce50, _0x56050e),
      projectTitleEdited: _0x56050e['projectTitleEdited'],
    });
  }
  function _0x479fb8(_0x130e6c) {
    return ((_0x23ce50['data'] = _0x130e6c), _0x265a37(_0x130e6c), _0x130e6c);
  }
  function _0x315abe(_0x22a091, { beforeActivate: beforeActivate = () => {} } = {}) {
    if (!_0x5c957c(_0x22a091)) return null;
    _0xc0a33d();
    const _0x4d3736 = _0x2b69c9(_0x22a091);
    if (!_0x4d3736) return null;
    return (beforeActivate(), _0x479fb8(_0x4d3736), _0x5c957c(_0x22a091));
  }
  function _0x3709e7(_0x2fbca4) {
    const _0xb7d384 = getEntryId(_0x2fbca4);
    if (!_0xb7d384 || !_0x2fbca4?.['data']?.['project']) return ![];
    const _0x3f5ca2 = (_0x23ce50['projects'] ||= []);
    if (_0x5c957c(_0xb7d384)) return ![];
    return (
      _0x265a37(_0x2fbca4['data']),
      _0x3f5ca2['unshift']({ ..._0x2fbca4, id: _0xb7d384, data: cloneData(_0x2fbca4['data']) }),
      !![]
    );
  }
  function _0x1095ba(_0x413305) {
    const _0x37109c = normalizeText(_0x413305),
      _0x1193c1 = _0x23ce50['projects'] || [];
    return (
      (_0x23ce50['projects'] = _0x1193c1['filter']((_0x16f21e) => getEntryId(_0x16f21e) !== _0x37109c)),
      _0x1a38a3['delete'](_0x37109c),
      _0x23ce50['projects']['length'] !== _0x1193c1['length']
    );
  }
  function _0x3b9e24(_0x4ebcb5, { preserveLive: preserveLive = ![] } = {}) {
    if (!preserveLive) _0x1a38a3['clear']();
    _0x23ce50['projects'] = (_0x4ebcb5 || [])['map']((_0x129044) => {
      const _0x36dc5e = getEntryId(_0x129044),
        _0x250eb6 = preserveLive
          ? _0x23ce50['hasCreatedProject'] && _0x36dc5e === getProjectId(_0x23ce50['data'])
            ? _0x23ce50['data']
            : _0x1a38a3['get'](_0x36dc5e)
          : null,
        _0x4f90ba = _0x250eb6 || _0x129044['data'];
      return (_0x265a37(_0x4f90ba), { ..._0x129044, data: _0x4f90ba ? cloneData(_0x4f90ba) : _0x4f90ba });
    });
  }
  function _0x1a170f() {
    const _0x57669e = new Set([
      getProjectId(_0x23ce50['data']),
      ..._0x1a38a3['keys'](),
      ...(_0x23ce50['projects'] || [])['map'](getEntryId),
    ]);
    return [..._0x57669e]['map'](_0x2b69c9)['filter'](Boolean);
  }
  function _0x407117(_0x2fb569) {
    let _0x1f54f5 = ![],
      _0x4c0393 = ![];
    for (const _0x20d4fb of _0x1a170f()) {
      const _0x516c70 = _0x20d4fb === _0x23ce50['data'];
      if (!_0x2fb569(_0x20d4fb, { isCurrent: _0x516c70 })) continue;
      if (!_0x516c70 || _0x23ce50['hasCreatedProject']) _0x285441(_0x20d4fb, { isCurrent: _0x516c70 });
      ((_0x1f54f5 = !![]), (_0x4c0393 ||= _0x516c70));
    }
    return { changed: _0x1f54f5, currentProjectChanged: _0x4c0393 };
  }
  return (
    _0x265a37(_0x23ce50['data']),
    Object['freeze']({
      activate: _0x315abe,
      addEntry: _0x3709e7,
      applyChanges: _0x407117,
      createSnapshot() {
        _0xc0a33d();
        for (const _0x36c8e3 of _0x23ce50['projects'] || []) {
          const _0x6787e1 = _0x2b69c9(getEntryId(_0x36c8e3));
          if (!_0x6787e1 || _0x6787e1 === _0x23ce50['data']) continue;
          ((_0x36c8e3['title'] = _0x6787e1['project']['title']), (_0x36c8e3['data'] = cloneData(_0x6787e1)));
        }
        return createStoryWorkspaceSnapshot(_0x23ce50);
      },
      getAllData: _0x1a170f,
      getData: _0x2b69c9,
      getEntry: _0x5c957c,
      registerTaskData: _0xb8b56f,
      releaseData: (_0x253a3c) => _0x1a38a3['delete'](normalizeText(_0x253a3c)),
      removeEntry: _0x1095ba,
      replaceCurrent: _0x479fb8,
      restoreEntries: _0x3b9e24,
      syncCurrentEntry: _0xc0a33d,
      syncTaskEntry: _0x295fa4,
    })
  );
}
