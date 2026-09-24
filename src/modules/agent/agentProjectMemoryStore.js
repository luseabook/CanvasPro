import {
  AGENT_PROJECT_MEMORY_CATEGORIES,
  AGENT_PROJECT_MEMORY_ENTRY_LIMIT,
  AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
  normalizeAgentProjectMemory,
} from './agentProjectMemory.js';
export const AGENT_PROJECT_MEMORY_STORAGE_KEY = 'aicanvas:agent-project-memory:v1';
const MAX_PROJECTS = 0x32;
function cloneJson(_0x10d4f4) {
  return JSON['parse'](JSON['stringify'](_0x10d4f4));
}
function getWindowObject(_0x5769c3) {
  if (_0x5769c3 !== undefined) return _0x5769c3;
  return typeof window !== 'undefined' ? window : null;
}
function normalizeProjectId(_0x5808fb = '') {
  return (
    String(_0x5808fb || '')
      ['trim']()
      ['slice'](0x0, 0xa0) || 'default_v2_project'
  );
}
function normalizeState(_0x5ac4d7 = {}, _0x59559d = Date['now']()) {
  const _0x1c0a2a =
      _0x5ac4d7 && typeof _0x5ac4d7 === 'object' && !Array['isArray'](_0x5ac4d7) ? _0x5ac4d7 : {},
    _0xf27b2c = Object['entries'](_0x1c0a2a['projects'] || {})
      ['map'](([_0x1f5444, _0x904851]) =>
        normalizeAgentProjectMemory(_0x904851, { projectId: _0x1f5444, now: _0x59559d }),
      )
      ['sort']((_0x414ea6, _0x3629c6) => _0x3629c6['updatedAt'] - _0x414ea6['updatedAt'])
      ['slice'](0x0, MAX_PROJECTS);
  return {
    schemaVersion: AGENT_PROJECT_MEMORY_SCHEMA_VERSION,
    projects: Object['fromEntries'](_0xf27b2c['map']((_0x114b44) => [_0x114b44['projectId'], _0x114b44])),
  };
}
export function createAgentProjectMemoryStore({
  windowObject: windowObject = undefined,
  getProjectId: getProjectId = () => 'default_v2_project',
  now: now = () => Date['now'](),
} = {}) {
  const _0x51f094 = getWindowObject(windowObject),
    _0x960db2 = () => {
      try {
        return normalizeProjectId(getProjectId?.());
      } catch {
        return 'default_v2_project';
      }
    },
    _0x46b2fb = () => {
      try {
        const _0x52fbbc = _0x51f094?.['localStorage']?.['getItem']?.(AGENT_PROJECT_MEMORY_STORAGE_KEY);
        return normalizeState(_0x52fbbc ? JSON['parse'](_0x52fbbc) : {}, now());
      } catch {
        return normalizeState({}, now());
      }
    },
    _0x4de562 = (_0x209192) => {
      const _0x442666 = normalizeState(_0x209192, now());
      try {
        _0x51f094?.['localStorage']?.['setItem']?.(
          AGENT_PROJECT_MEMORY_STORAGE_KEY,
          JSON['stringify'](_0x442666),
        );
      } catch {}
      return _0x442666;
    },
    _0x38d3be = () => {
      const _0x1c7041 = _0x960db2();
      return cloneJson(
        normalizeAgentProjectMemory(_0x46b2fb()['projects'][_0x1c7041], { projectId: _0x1c7041 }),
      );
    };
  function _0x89f847(_0x3d03f3 = []) {
    const _0x4ab5cd = _0x46b2fb(),
      _0x3a2c58 = _0x960db2(),
      _0x5f1576 = normalizeAgentProjectMemory(_0x4ab5cd['projects'][_0x3a2c58], { projectId: _0x3a2c58 }),
      _0xedd08d = [];
    for (const _0x2fef08 of Array['isArray'](_0x3d03f3) ? _0x3d03f3 : []) {
      const _0x289f07 = AGENT_PROJECT_MEMORY_CATEGORIES['includes'](_0x2fef08?.['category'])
          ? _0x2fef08['category']
          : 'preferences',
        _0x1dad67 = normalizeAgentProjectMemory(
          { [_0x289f07]: [_0x2fef08?.['value']] },
          { projectId: _0x3a2c58 },
        )[_0x289f07][0x0];
      if (!_0x1dad67) continue;
      const _0x38c1bd = _0x5f1576[_0x289f07]['some'](
        (_0x5ba1d3) => _0x5ba1d3['toLocaleLowerCase']() === _0x1dad67['toLocaleLowerCase'](),
      );
      if (_0x38c1bd) continue;
      ((_0x5f1576[_0x289f07] = [..._0x5f1576[_0x289f07], _0x1dad67]['slice'](
        -AGENT_PROJECT_MEMORY_ENTRY_LIMIT,
      )),
        _0xedd08d['push']({ category: _0x289f07, value: _0x1dad67 }));
    }
    return (
      _0xedd08d['length'] > 0x0 &&
        ((_0x5f1576['updatedAt'] = now()),
        (_0x4ab5cd['projects'][_0x3a2c58] = _0x5f1576),
        _0x4de562(_0x4ab5cd)),
      { memory: cloneJson(_0x5f1576), added: _0xedd08d }
    );
  }
  function _0x145042({ category: category = '', query: query = '' } = {}) {
    const _0x4bc108 = _0x46b2fb(),
      _0x10ed1d = _0x960db2(),
      _0x130424 = normalizeAgentProjectMemory(_0x4bc108['projects'][_0x10ed1d], { projectId: _0x10ed1d }),
      _0x2b61db = AGENT_PROJECT_MEMORY_CATEGORIES['includes'](category)
        ? [category]
        : AGENT_PROJECT_MEMORY_CATEGORIES,
      _0x3a06f8 = String(query || '')
        ['trim']()
        ['toLocaleLowerCase']();
    let _0x8192c1 = 0x0;
    for (const _0x71685b of _0x2b61db) {
      const _0x23cfbf = _0x130424[_0x71685b];
      _0x130424[_0x71685b] = _0x3a06f8
        ? _0x23cfbf['filter']((_0x2c4a4b) => {
            const _0x1d9627 = _0x2c4a4b['toLocaleLowerCase'](),
              _0x5c3fa8 = _0x1d9627['includes'](_0x3a06f8) || _0x3a06f8['includes'](_0x1d9627);
            if (_0x5c3fa8) _0x8192c1 += 0x1;
            return !_0x5c3fa8;
          })
        : [];
      if (!_0x3a06f8) _0x8192c1 += _0x23cfbf['length'];
    }
    return (
      _0x8192c1 > 0x0 &&
        ((_0x130424['updatedAt'] = now()),
        (_0x4bc108['projects'][_0x10ed1d] = _0x130424),
        _0x4de562(_0x4bc108)),
      { memory: cloneJson(_0x130424), removed: _0x8192c1 }
    );
  }
  function _0x274c0e() {
    const _0x525f1f = _0x46b2fb(),
      _0x4b0ecc = _0x960db2(),
      _0x404d3d = normalizeAgentProjectMemory(_0x525f1f['projects'][_0x4b0ecc], { projectId: _0x4b0ecc }),
      _0x43a24b = AGENT_PROJECT_MEMORY_CATEGORIES['reduce'](
        (_0x4b6797, _0x4e773f) => _0x4b6797 + _0x404d3d[_0x4e773f]['length'],
        0x0,
      );
    return (
      delete _0x525f1f['projects'][_0x4b0ecc],
      _0x4de562(_0x525f1f),
      { memory: _0x38d3be(), removed: _0x43a24b }
    );
  }
  return { getMemory: _0x38d3be, remember: _0x89f847, forget: _0x145042, clearMemory: _0x274c0e };
}
