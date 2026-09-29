import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CUSTOM_APP_FOOTER_LIMIT,
  clearParameterGroup,
  getParameterEntries,
  getParameterFooterFields,
  groupParameters,
  normalizeParameterGroups,
  orderParameterEntries,
} from './parameterLayout.js';

function param(index, homeParamOrder, groupId = '') {
  return {
    index,
    componentKind: 'param',
    previewPlacement: 'home',
    homeParamOrder,
    footerGroupId: groupId,
    footerGroupLabel: groupId ? 'Group ' + groupId : '',
    footerGroupDescription: groupId ? 'Description ' + groupId : '',
  };
}

test('parameterLayout: entries are sorted, grouped, and limited', () => {
  const params = [
    param(1, 30, 'b'),
    param(2, 20),
    param(3, 10, 'a'),
    { index: 4, componentKind: 'text', previewPlacement: 'home' },
    param(5, 40, 'c'),
    param(6, 50, 'd'),
    param(7, 60, 'e'),
  ];
  const groups = getParameterEntries(params);
  assert.equal(CUSTOM_APP_FOOTER_LIMIT, 4);
  assert.equal(groups.length, 4);
  assert.deepEqual(
    groups.map((group) => group.members.map((entry) => entry.index)),
    [[3], [2], [1], [5]],
  );
});

test('parameterLayout: clearing a group removes all group metadata', () => {
  const entry = param(1, 0, 'g');
  clearParameterGroup(entry);
  assert.equal('footerGroupId' in entry, false);
  assert.equal('footerGroupLabel' in entry, false);
  assert.equal('footerGroupDescription' in entry, false);
});

test('parameterLayout: normalization keeps valid groups and clears singleton metadata', () => {
  const first = param(1, 0, 'pair');
  const second = param(2, 1, 'pair');
  const single = param(3, 2, 'single');
  const advanced = { ...param(4, 3, 'advanced'), previewPlacement: 'advanced' };
  normalizeParameterGroups([first, second, single, advanced]);
  assert.equal(first.footerGroupId, 'pair');
  assert.equal(second.footerGroupId, 'pair');
  assert.equal('footerGroupId' in single, false);
  assert.equal('footerGroupId' in advanced, false);
});

test('parameterLayout: ordering rewrites display order across groups', () => {
  const entries = [{ members: [param(1, 99), param(2, 98)] }, { members: [param(3, 97)] }];
  orderParameterEntries(entries);
  assert.deepEqual(
    entries.flatMap((entry) => entry.members.map((member) => member.homeParamOrder)),
    [0, 1, 2],
  );
});

test('parameterLayout: groupParameters moves a source entry into the target group', () => {
  const params = [param(1, 0), param(2, 1)];
  assert.equal(groupParameters(params, 1, 2), true);
  assert.equal(params[0].footerGroupId, 'group-2');
  assert.equal(params[1].footerGroupId, 'group-2');
  assert.deepEqual(
    params.map((entry) => entry.homeParamOrder),
    [1, 0],
  );
  assert.equal(groupParameters(params, 1, 1), false);
});

test('parameterLayout: footer fields include group metadata only for real groups', () => {
  const params = [param(1, 0, 'pair'), param(2, 1, 'pair'), param(3, 2)];
  const fields = getParameterFooterFields(params);
  assert.equal(fields.get(1).footerGroup.id, 'pair');
  assert.equal(fields.get(2).footerGroup.id, 'pair');
  assert.equal('footerGroup' in fields.get(3), false);
});
