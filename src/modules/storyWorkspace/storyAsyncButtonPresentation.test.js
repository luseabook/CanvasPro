import test from 'node:test';
import assert from 'node:assert/strict';
import { renderStoryGenerationSpinner, syncStoryAsyncButton } from './storyAsyncButtonPresentation.js';

function fakeButton({ spinner = false } = {}) {
  const button = {
    attributes: {},
    classes: new Set(),
    html: [],
    spinner: spinner
      ? {
          removed: false,
          remove() {
            this.removed = true;
          },
        }
      : null,
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    classList: {
      toggle: (name, on) => (on ? button.classes.add(name) : button.classes.delete(name)),
    },
    querySelector(selector) {
      assert.equal(selector, '.story-action-button-spinner');
      return this.spinner;
    },
    insertAdjacentHTML(position, html) {
      this.html.push([position, html]);
    },
  };
  return button;
}

test('spinner markup has an optional button class', () => {
  assert.equal(
    renderStoryGenerationSpinner(),
    '<span class="storyboard-script-loading-spinner" aria-hidden="true"></span>',
  );
  assert.equal(
    renderStoryGenerationSpinner({ button: true }),
    '<span class="storyboard-script-loading-spinner story-action-button-spinner" aria-hidden="true"></span>',
  );
});

test('busy buttons get aria-busy and a single spinner', () => {
  const button = fakeButton();
  assert.equal(syncStoryAsyncButton(button, true, { spinnerOnly: true }), true);
  assert.equal(button.attributes['aria-busy'], 'true');
  assert.equal(button.classes.has('is-story-spinner-only'), true);
  assert.deepEqual(button.html, [['afterbegin', renderStoryGenerationSpinner({ button: true })]]);
  const existing = fakeButton({ spinner: true });
  syncStoryAsyncButton(existing, true);
  assert.deepEqual(existing.html, []);
  assert.equal(existing.classes.has('is-story-spinner-only'), false);
});

test('only a literal true counts as busy and idle buttons drop the spinner', () => {
  const button = fakeButton({ spinner: true });
  assert.equal(syncStoryAsyncButton(button, 'yes', { spinnerOnly: true }), false);
  assert.equal(button.attributes['aria-busy'], 'false');
  assert.equal(button.spinner.removed, true);
  assert.equal(syncStoryAsyncButton(null, true), false);
  assert.equal(syncStoryAsyncButton({}, true), true);
});
