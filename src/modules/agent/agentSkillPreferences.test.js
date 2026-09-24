import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_DISABLED_SKILLS_STORAGE_KEY,
  readDisabledAgentSkillIds,
  persistDisabledAgentSkillIds,
  hydrateDisabledAgentSkillIds,
  setAgentSkillEnabledPreference,
  forgetAgentSkillPreference,
} from './agentSkillPreferences.js';

function fakeWindow(raw = '{}', writes = []) {
  return {
    writes,
    localStorage: {
      getItem: (key) => {
        writes.push(['get', key]);
        return raw;
      },
      setItem: (key, value) => {
        writes.push(['set', key, value]);
      },
    },
  };
}

function fakeRegistry(state, impl = {}) {
  const calls = [];
  return {
    calls,
    getState: () => state,
    setSkillEnabled(id, enabled) {
      calls.push(['setSkillEnabled', id, enabled]);
      return impl.setSkillEnabled?.(id, enabled);
    },
    setDisabledSkillIds(ids) {
      calls.push(['setDisabledSkillIds', [...ids]]);
      return impl.setDisabledSkillIds?.(ids);
    },
  };
}

test('存储键为 aiCanvas.agentDisabledSkills.v1', () => {
  assert.equal(AGENT_DISABLED_SKILLS_STORAGE_KEY, 'aiCanvas.agentDisabledSkills.v1');
});

test('readDisabled 归一：trim + 小写 + 去空 + 去重', () => {
  const win = fakeWindow('["  Copy-Writing ", "copy-writing", "", null, "zh-Hans"]');
  assert.deepEqual(readDisabledAgentSkillIds(win), ['copy-writing', 'zh-hans']);
});

test('readDisabled 对非法 JSON / 非数组 / 缺失 localStorage 一律回空集', () => {
  assert.deepEqual(readDisabledAgentSkillIds(fakeWindow('nope{')), []);
  assert.deepEqual(readDisabledAgentSkillIds(fakeWindow('{"a":1}')), []);
  assert.deepEqual(readDisabledAgentSkillIds(fakeWindow('null')), []);
  assert.deepEqual(readDisabledAgentSkillIds({}), []);
  assert.deepEqual(readDisabledAgentSkillIds(undefined), []);
});

test('readDisabled 在 getItem 抛错时被 try/catch 吞掉', () => {
  const win = {
    localStorage: {
      getItem: () => {
        throw new Error('blocked');
      },
    },
  };
  assert.deepEqual(readDisabledAgentSkillIds(win), []);
});

test('persist 写入 getState().disabledSkillIds 的 JSON 并返回真', () => {
  const win = fakeWindow();
  const registry = fakeRegistry({ disabledSkillIds: ['a', 'b'] });
  assert.equal(persistDisabledAgentSkillIds(registry, win), true);
  assert.deepEqual(win.writes, [['set', AGENT_DISABLED_SKILLS_STORAGE_KEY, '["a","b"]']]);
});

test('persist 对缺 getState 的注册表仍写空集；无 localStorage 时静默成功', () => {
  const win = fakeWindow();
  assert.equal(persistDisabledAgentSkillIds({}, win), true);
  assert.deepEqual(win.writes, [['set', AGENT_DISABLED_SKILLS_STORAGE_KEY, '[]']]);
  assert.equal(persistDisabledAgentSkillIds(fakeRegistry({ disabledSkillIds: ['a'] }), {}), true);
});

test('persist 在 setItem 抛错时返回假', () => {
  const win = {
    localStorage: {
      setItem: () => {
        throw new Error('quota');
      },
    },
  };
  assert.equal(persistDisabledAgentSkillIds(fakeRegistry({ disabledSkillIds: [] }), win), false);
});

test('hydrate 把存储值灌进注册表并透传其返回值', () => {
  const win = fakeWindow('["a"]');
  const registry = fakeRegistry(
    { disabledSkillIds: [] },
    { setDisabledSkillIds: (ids) => ['ret', ids.length] },
  );
  assert.deepEqual(hydrateDisabledAgentSkillIds({ registry, windowObject: win }), ['ret', 1]);
  assert.deepEqual(registry.calls, [['setDisabledSkillIds', ['a']]]);
});

test('hydrate 在注册表缺方法时返回空集', () => {
  assert.deepEqual(hydrateDisabledAgentSkillIds({ registry: {}, windowObject: fakeWindow('["a"]') }), []);
  assert.deepEqual(hydrateDisabledAgentSkillIds({}), []);
});

test('setAgentSkillEnabledPreference 须注册表严格返回 true 才落盘', () => {
  const win = fakeWindow();
  const registry = fakeRegistry({ disabledSkillIds: ['b'] }, { setSkillEnabled: () => true });
  assert.equal(
    setAgentSkillEnabledPreference({ registry, skillId: 'b', enabled: false, windowObject: win }),
    true,
  );
  assert.deepEqual(registry.calls, [['setSkillEnabled', 'b', false]]);
  assert.deepEqual(win.writes, [['set', AGENT_DISABLED_SKILLS_STORAGE_KEY, '["b"]']]);
});

test('setAgentSkillEnabledPreference 在注册表返回假值/缺方法时不落盘', () => {
  const win = fakeWindow();
  const registry = fakeRegistry({ disabledSkillIds: [] }, { setSkillEnabled: () => undefined });
  assert.equal(
    setAgentSkillEnabledPreference({ registry, skillId: 'x', enabled: true, windowObject: win }),
    false,
  );
  assert.deepEqual(win.writes, []);
  assert.equal(setAgentSkillEnabledPreference({ skillId: 'x', enabled: true, windowObject: win }), false);
});

test('forget 归一并剔除该 id 后落盘（状态型注册表）', () => {
  const win = fakeWindow();
  const state = { disabledSkillIds: ['a', 'b'] };
  const registry = {
    getState: () => state,
    setDisabledSkillIds(ids) {
      state.disabledSkillIds = [...ids];
    },
  };
  assert.equal(forgetAgentSkillPreference({ registry, skillId: ' A ', windowObject: win }), true);
  assert.deepEqual(state.disabledSkillIds, ['b']);
  assert.deepEqual(win.writes, [['set', AGENT_DISABLED_SKILLS_STORAGE_KEY, '["b"]']]);
});

test('persist 重读 getState：注册表不回写状态时会落盘旧集合（端口现状）', () => {
  const win = fakeWindow();
  const registry = fakeRegistry({ disabledSkillIds: ['a', 'b'] });
  assert.equal(forgetAgentSkillPreference({ registry, skillId: 'a', windowObject: win }), true);
  assert.deepEqual(registry.calls, [['setDisabledSkillIds', ['b']]]);
  assert.deepEqual(win.writes, [['set', AGENT_DISABLED_SKILLS_STORAGE_KEY, '["a","b"]']]);
});

test('forget 对空 id、非注册表与缺 setDisabledSkillIds 者为假', () => {
  const win = fakeWindow();
  assert.equal(
    forgetAgentSkillPreference({
      registry: fakeRegistry({ disabledSkillIds: [] }),
      skillId: '  ',
      windowObject: win,
    }),
    false,
  );
  assert.equal(
    forgetAgentSkillPreference({
      registry: { getState: () => ({ disabledSkillIds: ['a'] }) },
      skillId: 'a',
      windowObject: win,
    }),
    false,
  );
  assert.deepEqual(win.writes, []);
});

test('forget 在 getState 缺失时按空集剔除仍可成功', () => {
  const calls = [];
  const registry = { setDisabledSkillIds: (ids) => calls.push([...ids]) };
  assert.equal(forgetAgentSkillPreference({ registry, skillId: 'a', windowObject: fakeWindow() }), true);
  assert.deepEqual(calls, [[]]);
});
