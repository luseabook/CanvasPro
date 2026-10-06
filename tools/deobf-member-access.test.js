import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, applyEdits } from './deobf-member-access.mjs';

const rewrite = (source) => applyEdits(source, plan(source));

test('rewrites static identifier member access', () => {
  assert.equal(rewrite("value['name'] + value[\"$meta\"]"), 'value.name + value.$meta');
});

test('rewrites optional computed access without adding a second dot', () => {
  assert.equal(rewrite("value?.['name']"), 'value?.name');
});

test('preserves dynamic, non-identifier and commented access', () => {
  const source = "value[key] + value['content-type'] + value[/* reason */ 'name']";
  assert.equal(rewrite(source), source);
});

test('preserves array literals in values, returns and call arguments', () => {
  const source = "const value = ['name']; return ['other']; call(['third']);";
  assert.equal(rewrite(source), source);
});

test('preserves computed method declarations', () => {
  const source = "class Value { ['run']() {} async ['load']() {} get ['name']() {} }";
  assert.equal(rewrite(source), source);
});

test('does not rewrite strings, templates, regexes or comments', () => {
  const source = "const a = \"value['name']\"; // value['name']\nconst b = /value['name']/;";
  assert.equal(rewrite(source), source);
});
