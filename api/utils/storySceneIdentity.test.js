import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStorySceneIdentityKey,
  normalizeStorySceneHeadingIdentity,
  storySceneIdentitiesOverlap,
} from './storySceneIdentity.js';

test('normalizeStorySceneHeadingIdentity strips scene numbers and time/interior labels', () => {
  assert.equal(normalizeStorySceneHeadingIdentity('第1场 日 内 客厅'), '客厅');
  assert.equal(normalizeStorySceneHeadingIdentity('夜外 · 天台'), '天台');
  assert.equal(normalizeStorySceneHeadingIdentity('1. 教室'), '教室');
});

test('normalizeStorySceneHeadingIdentity strips standalone interior/exterior markers', () => {
  assert.equal(normalizeStorySceneHeadingIdentity('外 街道'), '街道');
});

test('normalizeStorySceneHeadingIdentity keeps place names that start with 内/外 words', () => {
  assert.equal(normalizeStorySceneHeadingIdentity('内 蒙古草原'), '内 蒙古草原');
});

test('normalizeStorySceneHeadingIdentity strips relative-day labels and trailing transitions', () => {
  assert.equal(normalizeStorySceneHeadingIdentity('次日 医院走廊 稍后'), '医院走廊');
  assert.equal(normalizeStorySceneHeadingIdentity('客厅 与此同时'), '客厅');
});

test('normalizeStorySceneHeadingIdentity returns empty string for non-strings', () => {
  assert.equal(normalizeStorySceneHeadingIdentity(null), '');
  assert.equal(normalizeStorySceneHeadingIdentity(42), '');
});

test('getStorySceneIdentityKey lowercases, drops possessive 的 before rooms and punctuation', () => {
  assert.equal(getStorySceneIdentityKey('第2场 日 内 张三的客厅'), '张三客厅');
  assert.equal(getStorySceneIdentityKey('Room 101, Hotel'), 'room101hotel');
  assert.equal(getStorySceneIdentityKey(''), '');
});

test('storySceneIdentitiesOverlap matches identical or contained identities', () => {
  assert.equal(storySceneIdentitiesOverlap('日 内 客厅', '夜 内 客厅'), true);
  assert.equal(storySceneIdentitiesOverlap('张三的客厅', '客厅'), true);
});

test('storySceneIdentitiesOverlap matches on a shared character bigram', () => {
  assert.equal(storySceneIdentitiesOverlap('医院走廊', '走廊尽头'), true);
});

test('storySceneIdentitiesOverlap rejects unrelated or empty identities', () => {
  assert.equal(storySceneIdentitiesOverlap('医院走廊', '学校操场'), false);
  assert.equal(storySceneIdentitiesOverlap('', '客厅'), false);
  assert.equal(storySceneIdentitiesOverlap('客厅', null), false);
});
