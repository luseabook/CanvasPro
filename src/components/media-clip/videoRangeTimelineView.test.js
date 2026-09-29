import test from 'node:test';
import assert from 'node:assert/strict';

import { createVideoRangeTimelineView } from './videoRangeTimelineView.js';

function createDocumentRef() {
  const created = [];
  return {
    created,
    createElement(tagName) {
      const element = {
        tagName,
        className: '',
        dataset: {},
        children: [],
        appendChild(child) {
          element.children.push(child);
          return child;
        },
      };
      created.push(element);
      return element;
    },
  };
}

test('videoRangeTimelineView: requires a document', () => {
  assert.throws(() => createVideoRangeTimelineView({ documentRef: null }), /requires a document/);
});

test('videoRangeTimelineView: builds the track, thumbs, range, handles, and label', () => {
  const documentRef = createDocumentRef();
  const view = createVideoRangeTimelineView({
    documentRef,
    thumbnailCount: 2.9,
  });

  assert.equal(view.trackEl.className, 'v2-video-cliptrack');
  assert.equal(view.trackEl.dataset.videoRangeTimeline, '');
  assert.equal(view.thumbEls.length, 2);
  assert.equal(view.rangeEl.children.length, 3);
  assert.equal(view.rangeEl.children[0], view.selectionEl);
  assert.equal(view.leftHandleEl.dataset.handle, 'left');
  assert.equal(view.rightHandleEl.dataset.handle, 'right');
  assert.equal(view.labelEl.textContent, '0.00s');
  assert.deepEqual(view.trackEl.children, [
    view.thumbsEl,
    view.rangeEl,
    view.playheadEl,
    view.ticksEl,
    view.labelEl,
  ]);
});

test('videoRangeTimelineView: keeps at least one thumb and honors custom label text', () => {
  const documentRef = createDocumentRef();
  const view = createVideoRangeTimelineView({
    documentRef,
    thumbnailCount: 0,
    labelText: '00:12.50',
  });

  assert.equal(view.thumbEls.length, 1);
  assert.equal(view.labelEl.textContent, '00:12.50');
});
