import test from 'node:test';
import assert from 'node:assert/strict';

import {
  renderStoryVideoReplicationEpisodeRail,
  renderStoryVideoReplicationPage,
  syncStoryVideoReplicationCardElement,
} from './storyVideoReplicationPresentation.js';

function createClassList() {
  const values = new Set();
  return {
    add(value) {
      values.add(value);
    },
    contains(value) {
      return values.has(value);
    },
    toggle(value, force) {
      if (force) values.add(value);
      else values.delete(value);
    },
  };
}

function createNode(overrides = {}) {
  const attributes = new Map();
  return {
    classList: createClassList(),
    dataset: {},
    disabled: false,
    hidden: false,
    textContent: '',
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name) ?? null;
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    querySelector() {
      return null;
    },
    ...overrides,
  };
}

test('storyVideoReplicationPresentation: renders the source-video rail and page states', () => {
  const episodes = [
    {
      id: 'episode-1',
      title: 'First',
      clips: [{ id: 'clip-1' }, { id: 'clip-2' }],
      replication: { status: 'ready', sourceAnalysis: { characters: [] } },
      sourceVideo: { durationSec: 65, videoRef: 'video-1', posterUrl: 'poster.png' },
    },
    {
      id: 'episode-2',
      title: 'Second',
      clips: [],
      replication: { status: 'failed', selectedForAnalysis: true },
      sourceVideo: {},
    },
  ];

  const rail = renderStoryVideoReplicationEpisodeRail(episodes, 'episode-2');
  assert.match(rail, /data-story-replication-episode-rail-list/u);
  assert.match(rail, /data-story-open-episode="episode-1"/u);
  assert.match(rail, /data-story-open-episode="episode-2"/u);

  const page = renderStoryVideoReplicationPage({
    episodes,
    selectionMode: true,
    footerMarkup: '<div data-footer></div>',
  });
  assert.match(page, /data-story-replication-page/u);
  assert.match(page, /data-story-replication-episode-id="episode-1"/u);
  assert.match(page, /data-story-replication-episode-id="episode-2"/u);
  assert.match(page, /data-replication-analyze="selected"/u);
  assert.match(page, /data-footer/u);
  assert.match(page, /aria-busy="false"/u);
});

test('storyVideoReplicationPresentation: synchronizes one card in place', () => {
  const loadingLabel = createNode();
  const loading = createNode({
    querySelector(selector) {
      return selector === '.storyboard-script-loading-label' ? loadingLabel : null;
    },
  });
  const image = createNode();
  const placeholder = createNode();
  const preview = createNode({
    querySelector(selector) {
      if (selector === 'img') return image;
      if (selector === '.story-replication-poster-placeholder') return placeholder;
      return null;
    },
  });
  const actionLabel = createNode();
  const action = createNode({
    querySelector(selector) {
      return selector === '[data-replication-action-label]' ? actionLabel : null;
    },
  });
  const title = createNode();
  const duration = createNode();
  const status = createNode();
  const synopsis = createNode();
  const actions = createNode({
    querySelector(selector) {
      return selector === '[data-story-action="reupload-replication-video"]' ? createNode() : null;
    },
  });
  const handle = createNode();
  const card = createNode({
    querySelector(selector) {
      if (selector === '[data-replication-loading]') return loading;
      if (selector === '[data-story-replication-title]') return title;
      if (selector === '[data-story-replication-duration]') return duration;
      if (selector === '[data-story-replication-status]') return status;
      if (selector === '[data-story-replication-synopsis]') return synopsis;
      if (selector === '[data-story-replication-card-actions]') return actions;
      if (selector === '.story-replication-preview') return preview;
      if (selector === '[data-replication-card-action]') return action;
      if (selector === '[data-story-replication-drag-handle]') return handle;
      return null;
    },
  });

  const episode = {
    id: 'episode-1',
    title: 'First',
    coverUrl: '',
    replication: { status: 'analyzing', sourceAnalysis: { characters: [] } },
    sourceVideo: {
      durationSec: 65,
      videoRef: 'video-1',
      posterUrl: 'poster.png',
    },
  };

  assert.equal(syncStoryVideoReplicationCardElement(card, episode, 0), true);
  assert.equal(card.classList.contains('is-analyzing'), true);
  assert.equal(card.classList.contains('is-splitting'), true);
  assert.equal(card.getAttribute('aria-busy'), 'true');
  assert.equal(loading.hidden, false);
  // 0.8.0 起卡片不再由同步函数写入集数编号（该节点已从模板移除）
  assert.equal(title.textContent, 'First');
  assert.equal(duration.textContent, '01:05');
  assert.equal(preview.disabled, false);
  assert.equal(preview.dataset.storyReplicationEpisodeId, 'episode-1');
  assert.equal(image.getAttribute('src'), 'poster.png');
  assert.equal(image.hidden, false);
  assert.equal(placeholder.hidden, true);
  assert.equal(actionLabel.hidden, false);
  assert.equal(action.dataset.replicationOpen, 'episode-1');
  assert.equal(handle.getAttribute('aria-label').includes('1'), true);
});

