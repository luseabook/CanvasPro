import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkspaceAssetHoverPreviewContent,
  consumeWorkspaceWheelDirection,
  isWorkspaceAssetHoverLandscape,
  renderWorkspaceAssetCard,
  renderWorkspaceAssetLoadingOverlay,
  renderWorkspaceAssetTabIcon,
  renderWorkspaceCardAppearanceNavigation,
  renderWorkspaceCardDeleteControl,
  renderWorkspaceCardImageActions,
  renderWorkspaceCardVoiceStatus,
  renderWorkspacePreviewArrow,
  resolveWorkspaceTabTransitionDirection,
  resolveWorkspaceWheelDelta,
} from './workspaceAssetPresentation.js';

test('workspaceAssetPresentation: delete and image action controls escape attributes', () => {
  const deleteHtml = renderWorkspaceCardDeleteControl({
    className: 'custom"',
    ariaLabel: '删除 <素材>',
    actionAttributes: { 'data-id': 'a&b', hidden: false, disabled: true },
    disabled: true,
  });
  assert.match(deleteHtml, /class="[^"]*custom&quot;"/);
  assert.match(deleteHtml, /data-id="a&amp;b"/);
  assert.match(deleteHtml, / disabled/);
  assert.match(deleteHtml, /aria-label="删除 &lt;素材&gt;"/);
  const actions = renderWorkspaceCardImageActions({
    uploadAttributes: { 'data-action': 'upload' },
    generateAttributes: { 'data-action': 'generate' },
  });
  assert.match(actions, /data-action="upload"/);
  assert.match(actions, /data-action="generate"/);
  assert.match(actions, />上传形象</);
  assert.match(actions, />生成形象</);
});

test('workspaceAssetPresentation: hover aspect, wheel normalization and locking are deterministic', () => {
  assert.equal(isWorkspaceAssetHoverLandscape(1600, 900), true);
  assert.equal(isWorkspaceAssetHoverLandscape(900, 1600), false);
  assert.equal(isWorkspaceAssetHoverLandscape('bad', 10), false);
  assert.equal(resolveWorkspaceWheelDelta({ deltaX: 3, deltaY: -8, deltaMode: 1 }), -128);
  assert.equal(resolveWorkspaceWheelDelta({ deltaX: -5, deltaY: 2 }), -5);
  const state = { accumulator: 0, lockedUntil: 0 };
  assert.equal(
    consumeWorkspaceWheelDirection({ deltaY: 10 }, state, { threshold: 24, lockDuration: 100, now: 50 }),
    0,
  );
  assert.equal(
    consumeWorkspaceWheelDirection({ deltaY: 20 }, state, { threshold: 24, lockDuration: 100, now: 50 }),
    1,
  );
  assert.deepEqual(state, { accumulator: 0, lockedUntil: 150 });
  assert.equal(
    consumeWorkspaceWheelDirection({ deltaY: 100 }, state, { threshold: 24, lockDuration: 100, now: 149 }),
    0,
  );
});

test('workspaceAssetPresentation: tab direction and icons cover defaults and unknown values', () => {
  assert.equal(
    resolveWorkspaceTabTransitionDirection('character', 'scene', ['character', 'scene']),
    'forward',
  );
  assert.equal(
    resolveWorkspaceTabTransitionDirection('scene', 'character', ['character', 'scene']),
    'backward',
  );
  assert.equal(resolveWorkspaceTabTransitionDirection('scene', 'scene', ['character', 'scene']), 'none');
  assert.equal(resolveWorkspaceTabTransitionDirection('missing', 'scene', ['character', 'scene']), 'none');
  assert.match(renderWorkspaceAssetTabIcon('missing'), /data-icon="character"/);
  assert.match(renderWorkspaceAssetTabIcon('audio'), /data-icon="audio"/);
});

test('workspaceAssetPresentation: loading overlays and navigation render distinct compact state', () => {
  const full = renderWorkspaceAssetLoadingOverlay({ title: '<生成>', description: '等待&完成' });
  assert.match(full, /<strong>&lt;生成&gt;<\/strong>/);
  assert.match(full, /<small>等待&amp;完成<\/small>/);
  assert.match(full, /storyboard-script-loading-bar/);
  const compact = renderWorkspaceAssetLoadingOverlay({ compact: true, title: 'ignored' });
  assert.match(compact, /is-compact/);
  assert.doesNotMatch(compact, /ignored/);
  const arrows = renderWorkspaceCardAppearanceNavigation({
    attributes: { 'data-card': 'a' },
    previousAttributes: { 'data-workspace-action': 'prev' },
    nextAttributes: { 'data-workspace-action': 'next' },
  });
  assert.match(arrows, /story-appearance-arrow--previous/);
  assert.match(arrows, /story-appearance-arrow--next/);
  assert.match(arrows, /aria-label="上一个形象"/);
  assert.match(
    renderWorkspacePreviewArrow('next', {
      action: 'go',
      label: '下一个',
      className: 'custom',
    }),
    /data-workspace-action="go"/,
  );
});

test('workspaceAssetPresentation: hover preview builds a filtered grid with literals escaped', () => {
  const asset = {
    id: 'asset-1',
    kind: 'character',
    name: '角色<A>',
    baseAppearanceId: 'a1',
    appearances: [
      { id: 'a1', imageUrl: '/data/uploads/a1.png', name: '默认' },
      { id: 'a2', imageUrl: '/data/uploads/a2.png', name: '笑容 & 光' },
      { id: 'a3', imageUrl: '', name: '未生成' },
    ],
  };
  const preview = buildWorkspaceAssetHoverPreviewContent(asset, {
    appearanceId: '',
    selectedAssetId: 'asset-1',
    selectedAppearanceId: 'a2',
    getAppearances: () => asset.appearances,
    hasVoiceReference: () => true,
  });
  assert.equal(preview.appearances.length, 2);
  assert.equal(preview.columns, 2);
  assert.equal(preview.hasVoice, true);
  assert.match(preview.html, /已生成 2\/3/);
  assert.match(preview.html, /is-current/);
  assert.match(preview.html, /笑容 &amp; 光/);
  assert.match(preview.html, /有声音参考/);
  assert.equal(buildWorkspaceAssetHoverPreviewContent(null), null);
});

test('workspaceAssetPresentation: asset cards expose selection, media and shell state', () => {
  const card = renderWorkspaceAssetCard({
    asset: { id: 'a', name: '角色<1>', kind: 'character' },
    appearances: [{ id: 'base', imageUrl: '/data/uploads/base.png', name: '默认' }],
    stats: { total: 1, generated: 1, failed: 0 },
    selectionMode: true,
    checked: true,
    draggable: true,
    promptPreview: '<prompt>',
    deleteControlHtml: '<button>delete</button>',
  });
  assert.match(card, /story-asset-card\s+is-selection-mode\s+is-checked/);
  assert.match(card, /draggable="true"/);
  assert.match(card, /aria-pressed="true"/);
  assert.match(card, /角色&lt;1&gt;/);
  assert.match(card, /&lt;prompt&gt;/);
  assert.match(card, /story-asset-card-shell/);
  assert.match(card, /<button>delete<\/button>/);
  assert.equal(
    renderWorkspaceCardVoiceStatus(true),
    '<span class="workspace-card-voice-status has-reference"><i aria-hidden="true"></i>有声音参考</span>',
  );
});
