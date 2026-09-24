import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeStoryAssetPublicDescriptionText,
  sanitizeStoryAssetPublicPromptText,
  stripStoryAssetInternalEvidenceMetadata,
} from './storyAssetPublicText.js';

test('stripStoryAssetInternalEvidenceMetadata returns empty string for non-strings', () => {
  assert.equal(stripStoryAssetInternalEvidenceMetadata(null), '');
  assert.equal(stripStoryAssetInternalEvidenceMetadata(12), '');
});

test('stripStoryAssetInternalEvidenceMetadata removes PP-UIE candidate and evidence prefixes', () => {
  assert.equal(
    stripStoryAssetInternalEvidenceMetadata('PP-UIE 本地候选：张三\n证据原文：他走进来'),
    '他走进来',
  );
  assert.equal(stripStoryAssetInternalEvidenceMetadata('candidateAssets: 张三\n身材高大'), '身材高大');
});

test('stripStoryAssetInternalEvidenceMetadata removes the fallback diagnostic sentence', () => {
  assert.equal(
    stripStoryAssetInternalEvidenceMetadata('模型细化结果不完整，已使用剧本证据建立基础可生成设定。黑色长发'),
    '黑色长发',
  );
});

test('stripStoryAssetInternalEvidenceMetadata normalises trailing spaces and blank lines', () => {
  assert.equal(stripStoryAssetInternalEvidenceMetadata('a   \nb'), 'a\nb');
  assert.equal(stripStoryAssetInternalEvidenceMetadata('a\n\n\n\nb'), 'a\n\nb');
});

test('sanitizeStoryAssetPublicDescriptionText drops empty section labels only', () => {
  assert.equal(sanitizeStoryAssetPublicDescriptionText('剧本事实：\n身穿红衣\n视觉补全：\n'), '身穿红衣');
  assert.equal(sanitizeStoryAssetPublicDescriptionText('剧本事实：身穿红衣'), '剧本事实：身穿红衣');
});

test('sanitizeStoryAssetPublicPromptText removes inline section labels', () => {
  assert.equal(
    sanitizeStoryAssetPublicPromptText('剧本事实：身穿红衣，视觉补全：长发飘逸'),
    '身穿红衣，长发飘逸',
  );
});

test('sanitizeStoryAssetPublicPromptText removes client background instructions and dangling commas', () => {
  assert.equal(sanitizeStoryAssetPublicPromptText('白色背景，背景由客户端统一添加。'), '白色背景');
});

test('sanitizeStoryAssetPublicPromptText removes the keep-original-style boilerplate', () => {
  assert.equal(
    sanitizeStoryAssetPublicPromptText('保留原视频的视觉风格、场景和道具。赛博朋克城市'),
    '赛博朋克城市',
  );
});

test('sanitizeStoryAssetPublicPromptText removes evidence lines and collapses newlines', () => {
  assert.equal(sanitizeStoryAssetPublicPromptText('证据原文：xxx\n红衣'), '红衣');
  assert.equal(sanitizeStoryAssetPublicPromptText('a\n\nb'), 'a\nb');
  assert.equal(sanitizeStoryAssetPublicPromptText(undefined), '');
});
