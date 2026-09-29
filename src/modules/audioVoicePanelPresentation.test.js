import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bindAudioVoiceModelSubmenuPosition,
  createAudioVoiceModelIcon,
  createButton,
  createEl,
  iconSvg,
  positionAudioVoiceModelSubmenu,
} from './audioVoicePanelPresentation.js';

function makeElement(name = 'div') {
  const classes = new Set();
  const attrs = {};
  const children = [];
  return {
    tagName: name,
    className: '',
    textContent: '',
    innerHTML: '',
    title: '',
    type: '',
    style: {},
    dataset: {},
    children,
    classList: {
      add(...values) {
        values.forEach((value) => classes.add(value));
      },
      remove(...values) {
        values.forEach((value) => classes.delete(value));
      },
      contains(value) {
        return classes.has(value);
      },
    },
    setAttribute(name, value) {
      attrs[name] = String(value);
    },
    getAttribute(name) {
      return attrs[name] ?? null;
    },
    appendChild(child) {
      children.push(child);
      return child;
    },
  };
}

function withDocument(run) {
  const previous = globalThis.document;
  globalThis.document = {
    createElement(tag) {
      return makeElement(tag);
    },
  };
  try {
    return run();
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
}

test('positionAudioVoiceModelSubmenu positions the submenu to the left', () => {
  const anchor = {
    getBoundingClientRect() {
      return { left: 300, right: 380, top: 100, bottom: 140, width: 80, height: 40 };
    },
  };
  const submenu = {
    style: {},
    offsetWidth: 120,
    offsetHeight: 80,
    scrollHeight: 80,
    getBoundingClientRect() {
      return { width: 120, height: 80 };
    },
  };
  const result = positionAudioVoiceModelSubmenu(anchor, submenu, {
    windowObject: { innerWidth: 800, innerHeight: 600 },
    container: {
      getBoundingClientRect() {
        return { left: 0, top: 0 };
      },
    },
  });

  assert.deepEqual(result, { left: 180, top: 100, width: 120, height: 80 });
  assert.equal(submenu.style.left, '180px');
  assert.equal(submenu.style.top, '100px');
  assert.equal(submenu.style.position, 'absolute');
});

test('bindAudioVoiceModelSubmenuPosition opens on hover and closes after leaving', () => {
  const listeners = new Map();
  const timers = [];
  const anchor = {
    classList: {
      add() {},
      remove() {},
    },
    ownerDocument: { activeElement: null },
    matches() {
      return false;
    },
    contains() {
      return false;
    },
    addEventListener(type, handler) {
      listeners.set(`anchor:${type}`, handler);
    },
    getBoundingClientRect() {
      return { left: 100, right: 160, top: 20, bottom: 50, width: 60, height: 30 };
    },
  };
  const submenu = {
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
    matches() {
      return false;
    },
    contains() {
      return false;
    },
    style: {},
    offsetWidth: 80,
    offsetHeight: 40,
    scrollHeight: 40,
    getBoundingClientRect() {
      return { width: 80, height: 40 };
    },
    addEventListener(type, handler) {
      listeners.set(`submenu:${type}`, handler);
    },
  };
  const windowObject = {
    innerWidth: 800,
    innerHeight: 600,
    setTimeout(callback, delay) {
      timers.push([callback, delay]);
      return timers.length;
    },
    clearTimeout() {},
  };

  bindAudioVoiceModelSubmenuPosition(anchor, submenu, windowObject, {
    container: {
      getBoundingClientRect() {
        return { left: 0, top: 0 };
      },
    },
  });
  listeners.get('anchor:mouseenter')({});
  assert.equal(submenu.style.left, '20px');
  listeners.get('anchor:mouseleave')({ relatedTarget: {} });
  assert.equal(timers.length, 1);
  assert.equal(timers[0][1], 80);
  timers[0][0]();
});

test('createButton renders the icon, label, and accessible name', () => {
  withDocument(() => {
    const button = createButton('test-button', 'Title', 'play', 'Label');
    assert.equal(button.tagName, 'button');
    assert.equal(button.className, 'test-button');
    assert.equal(button.type, 'button');
    assert.equal(button.title, 'Title');
    assert.equal(button.getAttribute('aria-label'), 'Title');
    assert.match(button.innerHTML, /^<svg /);
    assert.equal(button.children.length, 1);
    assert.equal(button.children[0].className, 'audio-voice-btn-label');
    assert.equal(button.children[0].textContent, 'Label');
  });
});

test('createAudioVoiceModelIcon prefers SVG, then image, then badge text', () => {
  withDocument(() => {
    const svgIcon = createAudioVoiceModelIcon({ iconName: 'audio' });
    assert.equal(svgIcon.classList.contains('has-svg-icon'), true);
    assert.match(svgIcon.innerHTML, /^<svg /);

    const imageIcon = createAudioVoiceModelIcon({
      icon: 'images/provider.png',
      iconAlt: 'Provider',
    });
    assert.equal(imageIcon.children.length, 1);
    assert.equal(imageIcon.children[0].src, 'images/provider.png');
    assert.equal(imageIcon.children[0].alt, 'Provider');

    const badge = createAudioVoiceModelIcon({ badgeText: 'RH' });
    assert.equal(badge.textContent, 'RH');
  });
});

test('iconSvg returns a generic wrapper for unknown names', () => {
  const html = iconSvg('missing');
  assert.match(html, /^<svg /);
  assert.match(html, /<\/svg>$/);
  assert.equal(html.includes('<path'), false);
});
