import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VIDEO_REPLICATION_AUDIO_LANGUAGE_SYSTEM_RULE,
  buildVideoReplicationAudioLanguageRule,
  getVideoReplicationAudioLanguage,
} from './videoReplicationLanguage.js';

test('videoReplicationLanguage: audio language is only exposed in replication mode', () => {
  assert.equal(getVideoReplicationAudioLanguage({}, { sourceMode: 'text-to-video' }), null);
});

test('videoReplicationLanguage: target locale and source language fall back across inputs', () => {
  assert.deepEqual(
    getVideoReplicationAudioLanguage(
      { replication: { sourceAnalysis: { sourceLanguage: 'English' } } },
      { sourceMode: 'video-replication', replication: { targetLocale: 'ja-JP' } },
    ),
    { targetLocale: 'ja-JP', sourceLanguage: 'English' },
  );
  assert.deepEqual(
    getVideoReplicationAudioLanguage({}, { sourceMode: 'video-replication', replication: {} }),
    { targetLocale: 'source', sourceLanguage: '' },
  );
});

test('videoReplicationLanguage: rules are empty without a target and include source details', () => {
  assert.equal(buildVideoReplicationAudioLanguageRule(), '');
  const sourceRule = buildVideoReplicationAudioLanguageRule({
    targetLocale: 'source',
    sourceLanguage: 'English',
  });
  assert.match(sourceRule, /English/);
  const targetRule = buildVideoReplicationAudioLanguageRule({ targetLocale: 'ja-JP' });
  assert.match(targetRule, /ja-JP/);
  assert.doesNotMatch(targetRule, /English/);
  assert.ok(VIDEO_REPLICATION_AUDIO_LANGUAGE_SYSTEM_RULE.length > 40);
});
