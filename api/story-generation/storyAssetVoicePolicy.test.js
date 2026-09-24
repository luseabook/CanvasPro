import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_ASSET_VOICE_DESCRIPTION_RULE } from './storyAssetVoicePolicy.js';

test('voice description rule is a non-empty prompt rule string', () => {
  assert.equal(typeof STORY_ASSET_VOICE_DESCRIPTION_RULE, 'string');
  assert.ok(STORY_ASSET_VOICE_DESCRIPTION_RULE.startsWith('voiceDescription 为可选的角色声音设定'));
});

test('voice description rule allows leaving the field empty', () => {
  assert.ok(STORY_ASSET_VOICE_DESCRIPTION_RULE.includes('留空字符串'));
});
