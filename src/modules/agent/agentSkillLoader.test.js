import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deleteInstalledAgentSkill,
  installAgentSkillFromFolder,
  openInstalledAgentSkillsRoot,
  refreshInstalledAgentSkills,
  saveManagedAgentSkill,
} from './agentSkillLoader.js';

function makeBridge(over = {}) {
  const calls = [];
  const value = (key, fallback) => (key in over ? over[key] : fallback);
  const bridge = {
    agentSkills: {
      isAvailable: () => value('available', true),
      list: async (...args) => {
        calls.push(['list', args]);
        if ('listThrows' in over) throw over.listThrows;
        return value('list', { packages: [{ id: 'a' }, { id: 'b' }], rootPath: '/skills' });
      },
      openRoot: async (...args) => {
        calls.push(['openRoot', args]);
        return value('openRoot', { success: true, canceled: false });
      },
      installFromFolder: async (...args) => {
        calls.push(['installFromFolder', args]);
        return value('install', { success: true, canceled: false, skillId: 'new-skill' });
      },
      saveManaged: async (...args) => {
        calls.push(['saveManaged', args]);
        return value('save', { success: true, canceled: false, skillId: 'managed' });
      },
      deleteInstalled: async (...args) => {
        calls.push(['deleteInstalled', args]);
        return value('remove', { success: true, canceled: false, skillId: 'gone' });
      },
    },
  };
  return { bridge, calls };
}

function makeRegistry(over = {}) {
  const seen = [];
  const registry = {
    seen,
    replaceInstalledPackages: (packages, meta) => {
      seen.push([packages, meta]);
      if ('refresh' in over && over.refresh === 'throw') throw new Error('registry exploded');
      return value(over, 'refresh', {
        available: true,
        loaded: packages.length,
        rootPath: (meta && meta.rootPath) || '',
        diagnostics: [],
      });
    },
    getState: () => value(over, 'state', { installedCount: 7, rootPath: '/previous' }),
  };
  return registry;
}

function value(source, key, fallback) {
  return key in source ? source[key] : fallback;
}

test('四个写入口在缺少 registry 时抛 TypeError，openRoot 不要求 registry', async () => {
  const { bridge } = makeBridge();
  for (const fn of [
    refreshInstalledAgentSkills,
    installAgentSkillFromFolder,
    saveManagedAgentSkill,
    deleteInstalledAgentSkill,
  ]) {
    await assert.rejects(() => fn({ bridge }), TypeError);
    await assert.rejects(() => fn({ registry: {}, bridge }), TypeError);
    await assert.rejects(() => fn({ registry: { replaceInstalledPackages: null }, bridge }), TypeError);
  }
  await assert.doesNotReject(() => openInstalledAgentSkillsRoot({ bridge }));
  await assert.doesNotReject(() => openInstalledAgentSkillsRoot());
});

// 端口现状：Node 环境里没有 window，默认 desktopBridge 判定为不可用，因此全部走降级分支。
test('默认 desktopBridge 在离线环境判定为不可用', async () => {
  assert.equal(globalThis.window, undefined);
  const registry = makeRegistry();
  assert.deepEqual(await refreshInstalledAgentSkills({ registry }), {
    available: false,
    loaded: 0,
    rootPath: '',
    diagnostics: [],
  });
  assert.deepEqual(registry.seen, []);
  assert.deepEqual(await openInstalledAgentSkillsRoot(), {
    success: false,
    canceled: false,
    errorCode: 'SKILL_FOLDER_OPEN_UNAVAILABLE',
  });
  assert.deepEqual(await installAgentSkillFromFolder({ registry }), {
    success: false,
    canceled: false,
    errorCode: 'SKILL_IMPORT_UNAVAILABLE',
  });
  assert.deepEqual(await saveManagedAgentSkill({ registry, definition: { id: 'x' } }), {
    success: false,
    canceled: false,
    errorCode: 'SKILL_SAVE_UNAVAILABLE',
  });
  assert.deepEqual(await deleteInstalledAgentSkill({ registry, request: { id: 'x' } }), {
    success: false,
    canceled: false,
    errorCode: 'SKILL_DELETE_UNAVAILABLE',
  });
});

test('isAvailable 只认真正的 true，bridge 不可用时不触碰 list', async () => {
  const { bridge, calls } = makeBridge({ available: 1 });
  const registry = makeRegistry();
  assert.deepEqual(await refreshInstalledAgentSkills({ registry, bridge }), {
    available: false,
    loaded: 0,
    rootPath: '',
    diagnostics: [],
  });
  assert.deepEqual(calls, []);
});

test('refresh 成功时把 list 响应整体交给 registry 并回传其结果', async () => {
  const { bridge, calls } = makeBridge();
  const registry = makeRegistry();
  const result = await refreshInstalledAgentSkills({ registry, bridge });
  assert.deepEqual(calls, [['list', []]]);
  assert.equal(registry.seen.length, 1);
  assert.deepEqual(registry.seen[0][0], [{ id: 'a' }, { id: 'b' }]);
  assert.equal(registry.seen[0][1].rootPath, '/skills');
  assert.deepEqual(result, { available: true, loaded: 2, rootPath: '/skills', diagnostics: [] });
});

test('list 结果为空或字段缺失时按空包数组刷新', async () => {
  const { bridge } = makeBridge({ list: undefined });
  const registry = makeRegistry();
  const result = await refreshInstalledAgentSkills({ registry, bridge });
  assert.deepEqual(registry.seen[0][0], []);
  assert.deepEqual(registry.seen[0][1], {});
  assert.equal(result.loaded, 0);
  assert.equal(result.rootPath, '');
});

test('list 抛错时回退到 registry 当前状态并给出 SKILL_DISCOVERY_FAILED', async () => {
  const { bridge } = makeBridge({ listThrows: new Error('boom') });
  const registry = makeRegistry();
  assert.deepEqual(await refreshInstalledAgentSkills({ registry, bridge }), {
    available: false,
    loaded: 7,
    rootPath: '/previous',
    diagnostics: [{ ok: false, errorCode: 'SKILL_DISCOVERY_FAILED', message: 'boom' }],
  });
});

test('发现失败诊断没有 getState 时按空状态回退', async () => {
  const { bridge } = makeBridge({ listThrows: new Error('boom') });
  const registry = { replaceInstalledPackages: () => ({ available: true }) };
  assert.deepEqual(await refreshInstalledAgentSkills({ registry, bridge }), {
    available: false,
    loaded: 0,
    rootPath: '',
    diagnostics: [{ ok: false, errorCode: 'SKILL_DISCOVERY_FAILED', message: 'boom' }],
  });
});

test('诊断文案依次回退 Error 字符串化与固定兜底，并截断到 300 字符', async () => {
  const blank = makeBridge({ listThrows: new Error('') });
  const first = await refreshInstalledAgentSkills({ registry: makeRegistry(), bridge: blank.bridge });
  assert.equal(first.diagnostics[0].message, 'Error');

  const thrown = makeBridge({ listThrows: 'plain-reason' });
  const second = await refreshInstalledAgentSkills({ registry: makeRegistry(), bridge: thrown.bridge });
  assert.equal(second.diagnostics[0].message, 'plain-reason');

  const nullish = makeBridge({ listThrows: null });
  const third = await refreshInstalledAgentSkills({ registry: makeRegistry(), bridge: nullish.bridge });
  assert.equal(third.diagnostics[0].message, 'Skill discovery failed');

  const long = makeBridge({ listThrows: new Error('x'.repeat(400)) });
  const fourth = await refreshInstalledAgentSkills({ registry: makeRegistry(), bridge: long.bridge });
  assert.equal(fourth.diagnostics[0].message.length, 300);
});

test('refresh 内部抛错同样按发现失败处理', async () => {
  const { bridge } = makeBridge();
  const registry = makeRegistry({ refresh: 'throw' });
  const result = await refreshInstalledAgentSkills({ registry, bridge });
  assert.equal(result.available, false);
  assert.equal(result.diagnostics[0].message, 'registry exploded');
});

test('openRoot 直通 bridge 结果', async () => {
  const { bridge, calls } = makeBridge({ openRoot: { success: true, path: '/skills' } });
  assert.deepEqual(await openInstalledAgentSkillsRoot({ bridge }), { success: true, path: '/skills' });
  assert.deepEqual(calls, [['openRoot', []]]);
});

test('install：取消与非 true 结果原样返回且不刷新', async () => {
  for (const payload of [
    { success: false, canceled: true, errorCode: 'SKILL_IMPORT_CANCELED' },
    { success: 1, skillId: 'x' },
    null,
  ]) {
    const { bridge } = makeBridge({ install: payload });
    const registry = makeRegistry();
    const result = await installAgentSkillFromFolder({ registry, bridge });
    assert.equal(result, payload);
    assert.deepEqual(registry.seen, []);
  }
});

test('install：成功刷新后带上 loaded，并保留 bridge 返回字段', async () => {
  const { bridge, calls } = makeBridge();
  const registry = makeRegistry();
  const result = await installAgentSkillFromFolder({ registry, bridge });
  assert.deepEqual(result, { success: true, canceled: false, skillId: 'new-skill', loaded: 2 });
  assert.deepEqual(
    calls.map((entry) => entry[0]),
    ['installFromFolder', 'list'],
  );
});

test('install：刷新不可用时改写为 SKILL_REFRESH_AFTER_INSTALL_FAILED 且 success=false', async () => {
  const { bridge } = makeBridge({ listThrows: new Error('disk gone') });
  const result = await installAgentSkillFromFolder({ registry: makeRegistry(), bridge });
  assert.equal(result.success, false);
  assert.equal(result.errorCode, 'SKILL_REFRESH_AFTER_INSTALL_FAILED');
  assert.equal(result.skillId, 'new-skill');
  assert.equal(result.loaded, undefined);
});

test('save：三种分支与 definition 缺省空对象', async () => {
  const cancelled = makeBridge({ save: { success: false, canceled: true } });
  const registry = makeRegistry();
  assert.deepEqual(
    await saveManagedAgentSkill({ registry, bridge: cancelled.bridge, definition: { id: 'a' } }),
    {
      success: false,
      canceled: true,
    },
  );
  assert.deepEqual(cancelled.calls, [['saveManaged', [{ id: 'a' }]]]);
  assert.deepEqual(registry.seen, []);

  const defaults = makeBridge();
  await saveManagedAgentSkill({ registry, bridge: defaults.bridge });
  // definition 缺省时以空对象落盘，成功后紧接着刷新一次清单。
  assert.deepEqual(defaults.calls[0], ['saveManaged', [{}]]);
  assert.deepEqual(defaults.calls[1], ['list', []]);

  const ok = makeBridge({ list: { packages: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] } });
  const saved = await saveManagedAgentSkill({
    registry: makeRegistry(),
    bridge: ok.bridge,
    definition: { id: 'b' },
  });
  assert.deepEqual(saved, { success: true, canceled: false, skillId: 'managed', loaded: 3 });
});

test('save：刷新失败时改写为 SKILL_REFRESH_AFTER_SAVE_FAILED', async () => {
  const { bridge } = makeBridge({ listThrows: new Error('nope') });
  const result = await saveManagedAgentSkill({ registry: makeRegistry(), bridge });
  assert.equal(result.errorCode, 'SKILL_REFRESH_AFTER_SAVE_FAILED');
  assert.equal(result.success, false);
});

test('delete：三种分支与 request 缺省空对象', async () => {
  const cancelled = makeBridge({ remove: { success: false, canceled: true, errorCode: 'SKILL_LOCKED' } });
  const registry = makeRegistry();
  assert.deepEqual(await deleteInstalledAgentSkill({ registry, bridge: cancelled.bridge }), {
    success: false,
    canceled: true,
    errorCode: 'SKILL_LOCKED',
  });
  assert.deepEqual(cancelled.calls, [['deleteInstalled', [{}]]]);
  assert.deepEqual(registry.seen, []);

  const ok = makeBridge();
  const removed = await deleteInstalledAgentSkill({
    registry: makeRegistry(),
    bridge: ok.bridge,
    request: { id: 'gone' },
  });
  assert.deepEqual(removed, { success: true, canceled: false, skillId: 'gone', loaded: 2 });
  assert.deepEqual(ok.calls[0], ['deleteInstalled', [{ id: 'gone' }]]);

  const failing = makeBridge({ listThrows: new Error('read only') });
  const failed = await deleteInstalledAgentSkill({ registry: makeRegistry(), bridge: failing.bridge });
  assert.equal(failed.errorCode, 'SKILL_REFRESH_AFTER_DELETE_FAILED');
  assert.equal(failed.success, false);
});
