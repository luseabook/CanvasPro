import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderWorkspaceActionIcon,
  renderWorkspaceConfirmIcon,
  renderWorkspaceDeleteIcon,
  renderWorkspaceSplitIcon,
  renderWorkspaceKeyframeIcon,
  renderWorkspaceUploadIcon,
  renderWorkspaceAddToLibraryIcon,
} from './workspaceActionIcons.js';

const SVG_OPEN =
  '<svg class="story-action-icon story-confirm-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
  '<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">';

test('wraps the confirm glyph in the shared svg shell', () => {
  const svg = renderWorkspaceConfirmIcon();
  assert.equal(svg.startsWith(SVG_OPEN), true);
  assert.equal(svg.endsWith('</g></svg>'), true);
  assert.equal(svg.includes('<path d="m5 12 4 4L19 6"/>'), true);
});

test('names every icon class after its own kind', () => {
  assert.equal(renderWorkspaceConfirmIcon().includes('story-confirm-icon'), true);
  assert.equal(renderWorkspaceDeleteIcon().includes('story-delete-icon'), true);
  assert.equal(renderWorkspaceSplitIcon().includes('story-split-icon'), true);
  assert.equal(renderWorkspaceKeyframeIcon().includes('story-keyframe-icon'), true);
  assert.equal(renderWorkspaceUploadIcon().includes('story-upload-icon'), true);
  assert.equal(renderWorkspaceAddToLibraryIcon().includes('story-addToLibrary-icon'), true);
  assert.equal(renderWorkspaceActionIcon('generate').includes('story-generate-icon'), true);
  assert.equal(renderWorkspaceActionIcon('results').includes('story-results-icon'), true);
  assert.equal(renderWorkspaceActionIcon('unlink').includes('story-unlink-icon'), true);
});

test('emits the glyph that belongs to each kind', () => {
  assert.equal(
    renderWorkspaceActionIcon('generate').includes(
      '<path d="m4 20 11-11 3 3L7 23z" transform="translate(0 -2)"/>',
    ),
    true,
  );
  assert.equal(renderWorkspaceAddToLibraryIcon().includes('<path d="M17 14v6m-3-3h6"/>'), true);
  assert.equal(renderWorkspaceDeleteIcon().includes('<path d="m6 6 12 12M18 6 6 18"/>'), true);
  assert.equal(renderWorkspaceActionIcon('unlink').includes('M3 3l18 18M9 3v3M3 9h3m12 6h3m-6 3v3'), true);
  assert.equal(renderWorkspaceKeyframeIcon().includes('<circle cx="12" cy="12" r="3"/>'), true);
  assert.equal(renderWorkspaceActionIcon('results').includes('<path d="m4 12 8 4 8-4M4 17l8 4 8-4"/>'), true);
  assert.equal(renderWorkspaceSplitIcon().includes('M8 18V6m0 0L5 9m3-3 3 3M16 6v12m0 0-3-3m3 3 3-3'), true);
  assert.equal(
    renderWorkspaceUploadIcon().includes('<path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>'),
    true,
  );
});

test('falls back to the confirm glyph for unknown kinds', () => {
  for (const kind of ['nope', '', null, undefined, 'toString', 'constructor', 0]) {
    const svg = renderWorkspaceActionIcon(kind);
    assert.equal(svg.includes('story-confirm-icon'), true);
    assert.equal(svg.includes('<path d="m5 12 4 4L19 6"/>'), true);
  }
});

test('uses an own property rather than the prototype chain', () => {
  assert.equal(renderWorkspaceActionIcon('valueOf').includes('story-valueOf-icon'), false);
  assert.equal(renderWorkspaceActionIcon('hasOwnProperty').includes('story-confirm-icon'), true);
});
