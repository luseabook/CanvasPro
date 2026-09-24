import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCanvasProjectAccess, assertCanvasProjectSaveAllowed } from './canvasProjectAccess.js';

test('normalizeCanvasProjectAccess：非对象一律 null（含数组与字符串）', () => {
  assert.equal(normalizeCanvasProjectAccess(null), null);
  assert.equal(normalizeCanvasProjectAccess(undefined), null);
  assert.equal(normalizeCanvasProjectAccess(0), null);
  assert.equal(normalizeCanvasProjectAccess('shared'), null);
  assert.equal(normalizeCanvasProjectAccess(''), null);
  assert.deepEqual(
    normalizeCanvasProjectAccess([]),
    { badge: '', label: '', canSave: true, saveMessage: '' },
    '数组是 truthy 对象，会走正常归一分支而非 null',
  );
});

test('normalizeCanvasProjectAccess：badge 白名单只认 shared / shared-host', () => {
  assert.equal(normalizeCanvasProjectAccess({ badge: 'shared' }).badge, 'shared');
  assert.equal(normalizeCanvasProjectAccess({ badge: 'shared-host' }).badge, 'shared-host');
  for (const bad of ['Owner', 'SHARED', 'shared ', '', null, undefined, 0, true])
    assert.equal(normalizeCanvasProjectAccess({ badge: bad }).badge, '', String(bad));
});

test('normalizeCanvasProjectAccess：label 截 80、saveMessage 截 180', () => {
  const out = normalizeCanvasProjectAccess({
    label: 'x'.repeat(100),
    saveMessage: 'y'.repeat(200),
  });
  assert.equal(out.label.length, 80);
  assert.equal(out.saveMessage.length, 180);
  assert.equal(normalizeCanvasProjectAccess({ label: 123 }).label, '123', '非字符串走 String()');
  assert.equal(normalizeCanvasProjectAccess({ label: null }).label, '');
});

test('normalizeCanvasProjectAccess：只有严格 false 才关掉 canSave', () => {
  assert.equal(normalizeCanvasProjectAccess({}).canSave, true, '缺省即允许保存');
  assert.equal(normalizeCanvasProjectAccess({ canSave: false }).canSave, false);
  for (const falsy of [0, '', null, undefined])
    assert.equal(normalizeCanvasProjectAccess({ canSave: falsy }).canSave, true, String(falsy));
  assert.equal(normalizeCanvasProjectAccess({ canSave: 'false' }).canSave, true);
});

test('assertCanvasProjectSaveAllowed：优先取 TabManager 的访问态，缺失才回落节点自带', () => {
  const asked = [];
  const manager = {
    getCanvasProjectAccess: (id) => {
      asked.push(id);
      return id === 'a' ? { canSave: true } : null;
    },
  };
  assert.doesNotThrow(() =>
    assertCanvasProjectSaveAllowed({ canvases: [{ id: 'a' }, { id: 'b' }] }, manager),
  );
  assert.deepEqual(asked, ['a', 'b']);

  assert.throws(
    () =>
      assertCanvasProjectSaveAllowed(
        { canvases: [{ id: 'b', projectAccess: { canSave: false, saveMessage: '只读项目' } }] },
        manager,
      ),
    (err) => err.code === 'PROJECT_SAVE_FORBIDDEN' && err.message === '只读项目',
    'manager 返回 null 时回落 projectAccess',
  );
});

test('assertCanvasProjectSaveAllowed：manager 返回真值对象即不再回落，即使没有 canSave 键', () => {
  assert.doesNotThrow(
    () =>
      assertCanvasProjectSaveAllowed(
        { canvases: [{ id: 'a', projectAccess: { canSave: false } }] },
        { getCanvasProjectAccess: () => ({}) },
      ),
    'undefined !== false ⇒ 放行',
  );
});

test('assertCanvasProjectSaveAllowed：空配置与缺 canvases 不抛，saveMessage 空串回落默认文案', () => {
  assert.doesNotThrow(() => assertCanvasProjectSaveAllowed(undefined, undefined));
  assert.doesNotThrow(() => assertCanvasProjectSaveAllowed({}, {}));
  assert.doesNotThrow(() => assertCanvasProjectSaveAllowed({ canvases: [] }, undefined));
  assert.throws(
    () => assertCanvasProjectSaveAllowed({ canvases: [{ id: 'x', projectAccess: { canSave: false } }] }),
    (err) => err.code === 'PROJECT_SAVE_FORBIDDEN' && err.message === '当前项目不允许保存',
  );
});

test('assertCanvasProjectSaveAllowed：命中即抛，后面的节点不再检查', () => {
  let reads = 0;
  const manager = {
    getCanvasProjectAccess: () => ({ canSave: ++reads === 1 ? false : true, saveMessage: '第一个禁' }),
  };
  assert.throws(
    () => assertCanvasProjectSaveAllowed({ canvases: [{ id: '1' }, { id: '2' }, { id: '3' }] }, manager),
    /第一个禁/,
  );
  assert.equal(reads, 1);
});
