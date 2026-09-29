import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  createCameraTimelinePanel,
  renderCameraTimelinePanel,
  setCameraTimelineDisplayTime,
} from './CameraTimelinePanel.js';

const originalDocument = globalThis.document;

afterEach(() => {
  if (typeof originalDocument === 'undefined') delete globalThis.document;
  else globalThis.document = originalDocument;
});

function matchesSimple(element, selector) {
  return selector.split(',').some((part) => {
    const token = part.trim();
    if (!token) return false;
    if (token.startsWith('.')) {
      return (
        String(element.className || '')
          .split(/\s+/)
          .includes(token.slice(1)) || element.classList?.contains?.(token.slice(1))
      );
    }
    const attributeMatch = token.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    if (attributeMatch) {
      const value = element.dataset?.[attributeMatch[1]] ?? element.attributes?.[attributeMatch[1]];
      return attributeMatch[2] === undefined ? value !== undefined : String(value) === attributeMatch[2];
    }
    return element.tagName === token.toLowerCase();
  });
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.className = '';
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.events = new Map();
    this.style = {
      setProperty(name, value) {
        this[name] = value;
      },
    };
    this.value = '';
    this.checked = false;
    this.classList = {
      add: (value) => {
        const values = new Set(
          String(this.className || '')
            .split(/\s+/)
            .filter(Boolean),
        );
        values.add(value);
        this.className = [...values].join(' ');
      },
      remove: (value) => {
        const values = new Set(
          String(this.className || '')
            .split(/\s+/)
            .filter(Boolean),
        );
        values.delete(value);
        this.className = [...values].join(' ');
      },
      contains: (value) =>
        String(this.className || '')
          .split(/\s+/)
          .includes(value),
      toggle: (value, enabled) => {
        if (enabled) this.classList.add(value);
        else this.classList.remove(value);
      },
    };
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

  appendChild(node) {
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }

  addEventListener(type, handler) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(handler);
  }

  removeEventListener(type, handler) {
    const handlers = this.events.get(type) || [];
    this.events.set(
      type,
      handlers.filter((candidate) => candidate !== handler),
    );
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }

  querySelectorAll(selector) {
    const matches = [];
    const visit = (element) => {
      for (const child of element.children) {
        if (matchesSimple(child, selector)) matches.push(child);
        visit(child);
      }
    };
    visit(this);
    return matches;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function installFakeDocument() {
  globalThis.document = {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
  };
}

test('CameraTimelinePanel: create wires controls and reports normalized values', () => {
  installFakeDocument();
  const events = [];
  const panel = createCameraTimelinePanel({
    onPlayToggle: () => events.push(['play']),
    onAddKeyframe: (time) => events.push(['add', time]),
    onScrub: (time) => events.push(['scrub', time]),
    onScrubCommit: (time) => events.push(['commit', time]),
    onSettingsChange: (patch) => events.push(['settings', patch]),
  });
  const track = panel.querySelector('.panorama-camera-timeline__track');
  const time = panel.querySelector('.panorama-camera-timeline__time');

  track.value = '2.5';
  track.events.get('input')[0]();
  track.events.get('change')[0]();
  panel.querySelector('.panorama-camera-timeline__add').events.get('click')[0]();
  panel.querySelector('.panorama-camera-timeline__play').events.get('click')[0]();

  assert.deepEqual(events, [['scrub', 2.5], ['commit', 2.5], ['add', 2.5], ['play']]);
  assert.equal(time.textContent, '2.50s');
  assert.equal(String(panel.querySelector('.panorama-camera-timeline__duration').value), '6');
  assert.equal(panel.querySelectorAll('option').length, 6);
});

test('CameraTimelinePanel: render clamps display time and marks the active keyframe', () => {
  installFakeDocument();
  const panel = createCameraTimelinePanel();
  renderCameraTimelinePanel(
    panel,
    {
      duration: 10,
      fps: 24,
      currentTime: 1,
      keyframes: [
        { id: 'early', time: 2 },
        { id: 'active', time: 10 },
      ],
    },
    { currentTime: 12, isPlaying: true },
  );

  const track = panel.querySelector('.panorama-camera-timeline__track');
  const markers = panel.querySelector('.panorama-camera-timeline__markers').children;
  assert.equal(track.max, '10');
  assert.equal(track.value, '10');
  assert.equal(panel.querySelector('.panorama-camera-timeline__time').textContent, '10.00s');
  assert.equal(markers.length, 2);
  assert.equal(markers[1].dataset.keyframeId, 'active');
  assert.equal(markers[1].classList.contains('is-current'), true);
  assert.equal(panel.querySelector('.panorama-camera-timeline__play').textContent, '\u2161');
});

test('CameraTimelinePanel: set display time updates the slider and output', () => {
  installFakeDocument();
  const panel = createCameraTimelinePanel();

  setCameraTimelineDisplayTime(panel, 3.25);

  assert.equal(panel.querySelector('.panorama-camera-timeline__track').value, '3.25');
  assert.equal(panel.querySelector('.panorama-camera-timeline__time').textContent, '3.25s');
});
