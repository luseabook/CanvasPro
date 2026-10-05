import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeDiagnosticEvidence, summarizeBackendLog } from './diagnosticsEvidence.js';

test('summarizeBackendLog reports an empty result for blank input', () => {
  assert.deepEqual(summarizeBackendLog(), {
    detection: 'text-patterns',
    matchedLineCount: 0,
    recentFindings: [],
    notes: [
      'Matches are possible backend problems, not deduplicated failures or root causes.',
      'Line numbers refer to the included server.log; unmarked errors may not match.',
    ],
  });
  assert.deepEqual(summarizeBackendLog(''), summarizeBackendLog());
});

test('summarizeBackendLog counts each matching pattern and records 1-based lines', () => {
  const log = [
    'booting backend',
    '[ERROR] import failed',
    'ValueError: bad payload',
    'CRITICAL: disk full',
    '[WARNING] slow response',
    'Traceback (most recent call last):',
    'spawn error: ENOENT',
    'process exited code=1',
    'all good',
  ].join('\n');
  const summary = summarizeBackendLog(log);
  assert.equal(summary.detection, 'text-patterns');
  assert.equal(summary.matchedLineCount, 7);
  assert.deepEqual(
    summary.recentFindings.map((finding) => finding.line),
    [2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(
    summary.recentFindings[0].excerpt,
    [
      'booting backend',
      '[ERROR] import failed',
      'ValueError: bad payload',
      'CRITICAL: disk full',
      '[WARNING] slow response',
    ].join('\n'),
  );
});

test('summarizeBackendLog ignores a zero exit code but matches a non-zero one', () => {
  const clean = summarizeBackendLog(['server exited code=0', 'helper exited code=0 '].join('\n'));
  assert.equal(clean.matchedLineCount, 0);
  assert.deepEqual(clean.recentFindings, []);
  const failed = summarizeBackendLog(['server exited code=2', 'helper exited code=00'].join('\n'));
  assert.deepEqual(
    failed.recentFindings.map((finding) => finding.line),
    [1, 2],
  );
});

test('summarizeBackendLog keeps only the last 30 findings while counting all matches', () => {
  const log = Array.from({ length: 40 }, (unused, index) => '[ERROR] failure ' + index).join('\n');
  const summary = summarizeBackendLog(log);
  assert.equal(summary.matchedLineCount, 40);
  assert.equal(summary.recentFindings.length, 30);
  assert.equal(summary.recentFindings[0].line, 11);
  assert.equal(summary.recentFindings[29].line, 40);
});

test('summarizeBackendLog caps each excerpt at 1800 characters', () => {
  const long = 'x'.repeat(3000);
  const summary = summarizeBackendLog(long + '\n[ERROR] ' + long);
  assert.equal(summary.matchedLineCount, 1);
  assert.equal(summary.recentFindings[0].excerpt.length, 1800);
});

test('mergeDiagnosticEvidence merges structured logs with incident evidence', () => {
  const first = { ts: '2026-09-24T10:00:00.000Z', type: 'a', launchSessionId: 's1', eventSeq: 1 };
  const second = { ts: '2026-09-24T10:00:02.000Z', type: 'c', launchSessionId: 's1', eventSeq: 3 };
  const incident = {
    precedingEvents: [second],
    event: { ts: '2026-09-24T10:00:03.000Z', type: 'd', launchSessionId: 's1', eventSeq: 4 },
  };
  const merged = mergeDiagnosticEvidence([first, second], [incident]);
  assert.deepEqual(
    merged.map((entry) => entry.type),
    ['a', 'c', 'd'],
  );
  assert.equal(merged[1], second);
  assert.equal(merged[2], incident.event);
});

test('mergeDiagnosticEvidence deduplicates by launchSessionId and eventSeq', () => {
  const structured = { ts: '2026-09-24T10:00:01.000Z', type: 'a', launchSessionId: 's1', eventSeq: 2 };
  const incident = { event: { ...structured, type: 'duplicate' } };
  const merged = mergeDiagnosticEvidence([structured], [incident]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0], structured);
});

test('mergeDiagnosticEvidence falls back to a JSON key without session identifiers', () => {
  const plain = { ts: '2026-09-24T10:00:01.000Z', type: 'a' };
  const merged = mergeDiagnosticEvidence([plain, { ...plain }], []);
  assert.equal(merged.length, 1);
  assert.equal(merged[0], plain);
});

test('mergeDiagnosticEvidence skips entries without a timestamp or a type', () => {
  const merged = mergeDiagnosticEvidence(
    [
      { type: 'no-ts' },
      { ts: '2026-09-24T10:00:00.000Z' },
      null,
      'text',
      { ts: '2026-09-24T10:00:00.000Z', type: 'kept' },
    ],
    [{ precedingEvents: 'not-an-array', event: undefined }, {}],
  );
  assert.deepEqual(
    merged.map((entry) => entry.type),
    ['kept'],
  );
});

test('mergeDiagnosticEvidence orders by timestamp then event sequence', () => {
  const merged = mergeDiagnosticEvidence(
    [
      { ts: '2026-09-24T10:00:00.000Z', type: 'late', launchSessionId: 's', eventSeq: 9 },
      { ts: '2026-09-24T10:00:00.000Z', type: 'early', launchSessionId: 's', eventSeq: 2 },
      { ts: '2026-09-24T09:59:59.000Z', type: 'first', launchSessionId: 's', eventSeq: 8 },
    ],
    [],
  );
  assert.deepEqual(
    merged.map((entry) => entry.type),
    ['first', 'early', 'late'],
  );
});

test('mergeDiagnosticEvidence requires both arguments', () => {
  assert.throws(() => mergeDiagnosticEvidence(), TypeError);
  assert.throws(() => mergeDiagnosticEvidence([]), TypeError);
  assert.deepEqual(mergeDiagnosticEvidence([], []), []);
});
