import test from "node:test";
import assert from "node:assert/strict";

import {
  isSubscriptionAccessConfigurationMessage,
  openSubscriptionAccessSettings,
} from "./subscriptionAccessMissingToast.js";

function createClassList() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    toggle: (name, force) => {
      if (force) values.add(name);
      else values.delete(name);
    },
    contains: (name) => values.has(name),
  };
}

function createEventTarget() {
  return {
    addEventListener() {},
    removeEventListener() {},
    contains() {
      return false;
    },
  };
}

function withDom(run) {
  const field = {
    classList: createClassList(),
    focused: false,
    selected: false,
    focus() {
      this.focused = true;
    },
    select() {
      this.selected = true;
    },
    scrollIntoView() {},
    getBoundingClientRect: () => ({ top: 0, left: 0 }),
  };
  const navItem = {
    dataset: { pane: "subscription" },
    classList: createClassList(),
    setAttribute() {},
    removeAttribute() {},
  };
  const pane = { id: "pane-subscription", classList: createClassList() };
  const modal = { ...createEventTarget(), querySelectorAll: () => [] };
  const settingsOverlay = {
    ...createEventTarget(),
    style: {},
    ownerDocument: null,
    querySelector: () => modal,
  };
  const windowObject = {
    setTimeout(callback) {
      callback();
      return 1;
    },
    clearTimeout() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    getComputedStyle: () => ({ visibility: "visible" }),
  };
  const documentObject = {
    activeElement: null,
    defaultView: windowObject,
    documentElement: { contains: () => true },
    getElementById(id) {
      if (id === "settingsOverlay") return settingsOverlay;
      if (id === "subscriptionCdkeyInput") return field;
      return null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".settings-nav-item") return [navItem];
      if (selector === ".settings-pane") return [pane];
      return [];
    },
  };
  settingsOverlay.ownerDocument = documentObject;
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = windowObject;
  globalThis.document = documentObject;
  try {
    return run({ field, navItem });
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

test("subscriptionAccessMissingToast: recognizes Chinese and English subscription prompts", () => {
  assert.equal(
    isSubscriptionAccessConfigurationMessage("请先输入 CDKey 激活订阅"),
    true,
  );
  assert.equal(
    isSubscriptionAccessConfigurationMessage("需要激活授权后才能使用"),
    true,
  );
  assert.equal(
    isSubscriptionAccessConfigurationMessage("VIP subscription required"),
    true,
  );
  assert.equal(
    isSubscriptionAccessConfigurationMessage("Please enter your license"),
    true,
  );
  assert.equal(
    isSubscriptionAccessConfigurationMessage("Request timed out"),
    false,
  );
  assert.equal(isSubscriptionAccessConfigurationMessage(""), false);
});

test("subscriptionAccessMissingToast: opens and focuses the subscription settings field", () => {
  withDom(({ field, navItem }) => {
    assert.equal(openSubscriptionAccessSettings(), true);
    assert.equal(navItem.classList.contains("active"), true);
    assert.equal(field.focused, true);
    assert.equal(field.selected, true);
  });
});
