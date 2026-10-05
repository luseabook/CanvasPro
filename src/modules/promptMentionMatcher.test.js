import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchPromptMentions } from './promptMentionMatcher.js';

const nodeCandidate = (label, over = {}) => ({ origin: 'node', nodeId: `node-${label}`, label, ...over });

test('returns no matches when the text has no trigger', () => {
  assert.deepEqual(matchPromptMentions('plain text', [nodeCandidate('foo')]), []);
  assert.deepEqual(matchPromptMentions('plain text'), []);
});

test('matches a labelled candidate directly after the trigger', () => {
  const candidate = nodeCandidate('foo');
  const matches = matchPromptMentions('@foo', [candidate]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].start, 0);
  assert.equal(matches[0].end, 4);
  assert.equal(matches[0].name, 'foo');
  assert.deepEqual(matches[0].candidates, [candidate]);
});

test('accepts the fullwidth trigger and strips leading triggers from labels', () => {
  const fullwidth = matchPromptMentions('＠foo', [nodeCandidate('foo')]);
  assert.equal(fullwidth[0].name, 'foo');
  assert.equal(fullwidth[0].end, 4);
  const stripped = matchPromptMentions('@foo', [nodeCandidate('＠＠foo')]);
  assert.equal(stripped.length, 1);
  assert.equal(stripped[0].name, 'foo');
  assert.equal(stripped[0].candidates.length, 1);
});

test('ignores a trigger that follows an alphanumeric or another trigger', () => {
  assert.deepEqual(matchPromptMentions('a@foo', [nodeCandidate('foo')]), []);
  assert.deepEqual(matchPromptMentions('@@foo', [nodeCandidate('foo')]), []);
  assert.deepEqual(matchPromptMentions('x.@foo', [nodeCandidate('foo')]), []);
  assert.deepEqual(matchPromptMentions('1@foo', [nodeCandidate('foo')]), []);
});

test('ends a match at a word boundary and keeps scanning after it', () => {
  const matches = matchPromptMentions('@foo hello', [nodeCandidate('foo')]);
  assert.equal(matches[0].end, 4);
  assert.equal(matches[0].name, 'foo');
});

test('yields an empty candidate list when nothing in the trie matches', () => {
  const matches = matchPromptMentions('@unknown', [nodeCandidate('foo')]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'unknown');
  assert.equal(matches[0].start, 0);
  assert.equal(matches[0].end, 8);
  assert.deepEqual(matches[0].candidates, []);
});

test('falls back to a plain name when a longer token overruns the trie', () => {
  const matches = matchPromptMentions('@foobar', [nodeCandidate('foo')]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'foobar');
  assert.deepEqual(matches[0].candidates, []);
});

test('treats a han boundary as a word boundary for ascii candidates', () => {
  const matches = matchPromptMentions('@abc三', [nodeCandidate('abc')]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'abc');
  assert.equal(matches[0].end, 4);
  assert.equal(matches[0].candidates.length, 1);
});

test('keeps trailing han characters inside a fallback name', () => {
  const han = matchPromptMentions('@吴三', [nodeCandidate('吴')]);
  assert.equal(han.length, 1);
  assert.equal(han[0].name, '吴三');
  assert.deepEqual(han[0].candidates, []);
  const exact = matchPromptMentions('@吴', [nodeCandidate('吴')]);
  assert.equal(exact[0].name, '吴');
  assert.equal(exact[0].candidates.length, 1);
});

test('finds multiple mentions in order', () => {
  const matches = matchPromptMentions('@foo and @bar', [nodeCandidate('foo'), nodeCandidate('bar')]);
  assert.equal(matches.length, 2);
  assert.deepEqual(
    matches.map((match) => [match.start, match.end, match.name]),
    [
      [0, 4, 'foo'],
      [9, 13, 'bar'],
    ],
  );
});

test('does not rescan the second trigger inside an already-matched token', () => {
  const matches = matchPromptMentions('@foo@foo', [nodeCandidate('foo')]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'foo');
  assert.equal(matches[0].end, 4);
});

test('collects several candidates sharing one label under a single match', () => {
  const first = nodeCandidate('foo', { nodeId: 'a' });
  const second = nodeCandidate('foo', { nodeId: 'b' });
  const matches = matchPromptMentions('@foo', [first, second]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].candidates.length, 2);
});

test('dedupes the same candidate reached through several name fields', () => {
  const candidate = nodeCandidate('foo', { refLabel: 'foo', assetName: 'foo' });
  const matches = matchPromptMentions('@foo', [candidate]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].candidates.length, 1);
});

test('skips pill and missing-asset candidates entirely', () => {
  assert.deepEqual(
    matchPromptMentions('@foo', [nodeCandidate('foo', { pillKind: 'ref' })]).map((m) => m.candidates),
    [[]],
  );
  assert.deepEqual(
    matchPromptMentions('@foo', [nodeCandidate('foo', { missingAsset: true })]).map((m) => m.candidates),
    [[]],
  );
});

test('uses refLabel and assetName when the primary label is empty', () => {
  const refOnly = matchPromptMentions('@scene', [{ origin: 'node', nodeId: 'n1', refLabel: 'scene' }]);
  assert.equal(refOnly[0].candidates.length, 1);
  const assetOnly = matchPromptMentions('@clip', [{ origin: 'node', nodeId: 'n2', assetName: 'clip' }]);
  assert.equal(assetOnly[0].candidates.length, 1);
});

test('keys asset candidates by id and zero-based index', () => {
  const a = { origin: 'asset', assetId: 'A1', label: 'clip' };
  const b = { origin: 'asset', assetId: 'A1', assetIndex: 0, label: 'clip' };
  const c = { origin: 'asset', assetId: 'A1', assetIndex: 2, label: 'clip' };
  const matches = matchPromptMentions('@clip', [a, b, c]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].candidates.length, 2);
  assert.deepEqual(matches[0].candidates.map((entry) => entry.assetIndex ?? 0).sort(), [0, 2]);
});

test('matches names containing digits and underscores', () => {
  const matches = matchPromptMentions('@user_1', [nodeCandidate('user_1')]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'user_1');
  assert.equal(matches[0].candidates.length, 1);
});

test('returns nothing for a lone trigger', () => {
  assert.deepEqual(matchPromptMentions('@', [nodeCandidate('foo')]), []);
  assert.deepEqual(matchPromptMentions('@ ', [nodeCandidate('foo')]), []);
});

test('advances by code point so astral characters stay inside a matched name', () => {
  const candidate = nodeCandidate('a𠀀b');
  const matches = matchPromptMentions('@a𠀀b', [candidate]);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].name, 'a𠀀b');
  assert.equal(matches[0].end, 5);
  assert.equal(matches[0].candidates.length, 1);
});

test('keeps digits, underscores and hyphens attached to a longer token', () => {
  const digit = matchPromptMentions('@foo1', [nodeCandidate('foo')]);
  assert.equal(digit.length, 1);
  assert.equal(digit[0].name, 'foo1');
  assert.deepEqual(digit[0].candidates, []);
  const underscore = matchPromptMentions('@foo_1', [nodeCandidate('foo')]);
  assert.equal(underscore[0].name, 'foo_1');
  assert.deepEqual(underscore[0].candidates, []);
  const hyphen = matchPromptMentions('@foo-bar', [nodeCandidate('foo')]);
  assert.equal(hyphen[0].name, 'foo-bar');
  assert.deepEqual(hyphen[0].candidates, []);
});
