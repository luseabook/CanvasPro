import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { createMannequinPosePanel, renderMannequinPosePanel } from './MannequinPosePanel.js';

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
      const attributeName = attributeMatch[1];
      const datasetName = attributeName.startsWith('data-')
        ? attributeName.slice(5).replace(/-([a-z])/g, (_, character) => character.toUpperCase())
        : attributeName;
      const value = element.dataset?.[datasetName] ?? element.attributes?.[attributeName];
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
    this.options = [];
    this.value = '';
    this.disabled = false;
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
    if (this.tagName === 'select' && node.tagName === 'option') this.options.push(node);
    return node;
  }

  addEventListener(type, handler) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(handler);
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

  closest(selector) {
    let node = this;
    while (node) {
      if (matchesSimple(node, selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
}

function installFakeDocument() {
  globalThis.document = {
    createElement(tagName) {
      return new FakeElement(tagName);
    },
  };
}

test('MannequinPosePanel: selected mannequin enables controls and hydrates pose values', () => {
  installFakeDocument();
  const previews = [];
  const panel = createMannequinPosePanel({
    onPreview: (pose) => previews.push(pose),
  });
  renderMannequinPosePanel(panel, {
    selection: { selectedObjectType: 'mannequin', selectedObjectId: 'mannequin-1' },
    mannequins: [
      {
        id: 'mannequin-1',
        poseId: 'wave-left',
        bonePose: { pelvis: { x: Math.PI / 2, y: 0, z: 0 } },
      },
    ],
    customPoses: [{ id: 'custom-1', name: 'Custom One' }],
  });

  const preset = panel.querySelector('.panorama-pose-panel__preset');
  const bone = panel.querySelector('.panorama-pose-panel__bone');
  const sliders = panel.querySelector('.panorama-pose-panel__sliders');
  const xControl = panel.querySelector('[data-pose-axis="x"]');
  const xOutput = panel.querySelector('[data-pose-value="x"]');
  assert.equal(panel.classList.contains('is-disabled'), false);
  assert.equal(panel.dataset.mannequinId, 'mannequin-1');
  assert.equal(preset.value, 'wave-left');
  assert.equal(bone.disabled, false);
  assert.equal(xControl.value, '90');
  assert.equal(xOutput.textContent, '90\u00b0');
  assert.equal(
    preset.options.some((option) => option.value === 'custom-1'),
    true,
  );

  xControl.value = '45';
  sliders.events.get('input')[0]({ target: xControl });
  assert.equal(previews.length, 1);
  assert.ok(Math.abs(previews[0].pelvis.x - Math.PI / 4) < 1e-12);
});

test('MannequinPosePanel: non-mannequin selection disables every control', () => {
  installFakeDocument();
  const panel = createMannequinPosePanel();

  renderMannequinPosePanel(panel, {
    selection: { selectedObjectType: 'camera', selectedObjectId: 'camera-1' },
    mannequins: [{ id: 'mannequin-1', bonePose: {} }],
  });

  assert.equal(panel.classList.contains('is-disabled'), true);
  assert.equal(panel.dataset.mannequinId, '');
  assert.equal(
    panel.querySelectorAll('select, input, button').every((element) => element.disabled === true),
    true,
  );
});
