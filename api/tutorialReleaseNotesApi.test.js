import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeTutorialReleases } from './tutorialReleaseNotesApi.js';

test('tutorialReleaseNotesApi: filters drafts and prereleases, then sorts newest first', () => {
  const releases = normalizeTutorialReleases([
    {
      tag_name: 'v1',
      name: '',
      published_at: '2026-01-01T00:00:00Z',
      body: '[previewVideoUrl]: https://example.test/video\nChanges',
    },
    { tag_name: 'draft', draft: true, published_at: '2026-03-01T00:00:00Z' },
    { tag_name: 'preview', prerelease: true, published_at: '2026-04-01T00:00:00Z' },
    { tag_name: 'v2', name: 'Version 2', published_at: '2026-02-01T00:00:00Z', body: '' },
    { tag_name: 42, published_at: '2026-05-01T00:00:00Z' },
  ]);

  assert.deepEqual(releases, [
    { tag_name: 'v2', name: 'Version 2', published_at: '2026-02-01T00:00:00Z', body: '暂无详细说明' },
    { tag_name: 'v1', name: 'v1', published_at: '2026-01-01T00:00:00Z', body: 'Changes' },
  ]);
});

test('tutorialReleaseNotesApi: rejects non-array release payloads', () => {
  assert.throws(() => normalizeTutorialReleases({}), /更新说明格式无效/);
});
