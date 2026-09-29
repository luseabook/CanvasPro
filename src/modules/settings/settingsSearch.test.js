import test from "node:test";
import assert from "node:assert/strict";

import {
  collectSettingsSearchEntries,
  initSettingsSearch,
} from "./settingsSearch.js";

function createClassList(initial = []) {
  const classes = new Set(initial);
  return {
    add(...names) {
      names.forEach((name) => classes.add(name));
    },
    remove(...names) {
      names.forEach((name) => classes.delete(name));
    },
    toggle(name, force) {
      const enabled = force === undefined ? !classes.has(name) : Boolean(force);
      if (enabled) classes.add(name);
      else classes.delete(name);
      return enabled;
    },
    contains(name) {
      return classes.has(name);
    },
  };
}

function matchesSelector(element, selector) {
  const normalized = selector.trim();
  if (normalized === ".settings-pane:not(#pane-search)") {
    return (
      element.classList.contains("settings-pane") &&
      element.id !== "pane-search"
    );
  }
  if (normalized === ".settings-desc[data-i18n]") {
    return (
      element.classList.contains("settings-desc") && "i18n" in element.dataset
    );
  }
  if (normalized.startsWith("#")) return element.id === normalized.slice(1);
  if (normalized.startsWith(".")) {
    if (normalized === ".settings-nav-item.active") {
      return (
        element.classList.contains("settings-nav-item") &&
        element.classList.contains("active")
      );
    }
    return element.classList.contains(normalized.slice(1));
  }
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    const key = normalized
      .slice(1, -1)
      .replace(/^data-/, "")
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return Boolean(element.dataset[key]);
  }
  return false;
}

function matchesAnySelector(element, selector) {
  return selector.split(",").some((part) => matchesSelector(element, part));
}

function createElement({
  tagName = "div",
  id = "",
  dataset = {},
  classes = [],
  textContent = "",
  hidden = false,
} = {}) {
  const children = [];
  const listeners = new Map();
  const attributes = new Map();
  const element = {
    tagName,
    id,
    dataset: { ...dataset },
    hidden,
    parentElement: null,
    children,
    textContent,
    value: "",
    scrollTop: 0,
    scrollLeft: 0,
    ownerDocument: null,
    classList: createClassList(classes),
    appendChild(child) {
      child.parentElement = element;
      children.push(child);
      return child;
    },
    append(...nodes) {
      nodes.forEach((node) => element.appendChild(node));
    },
    contains(node) {
      return node === element || children.some((child) => child.contains(node));
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.(event);
    },
    focus(options) {
      element.focusCalls = [...(element.focusCalls || []), options];
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    querySelector(selector) {
      return (
        collectDescendants(element).find((candidate) =>
          matchesAnySelector(candidate, selector),
        ) || null
      );
    },
    querySelectorAll(selector) {
      return collectDescendants(element).filter((candidate) =>
        matchesAnySelector(candidate, selector),
      );
    },
    closest(selector) {
      let current = element;
      while (current) {
        if (matchesAnySelector(current, selector)) return current;
        current = current.parentElement;
      }
      return null;
    },
  };
  return element;
}

function collectDescendants(root, found = []) {
  root.children.forEach((child) => {
    found.push(child);
    collectDescendants(child, found);
  });
  return found;
}

function createHarness() {
  const root = createElement();
  const input = createElement({ tagName: "input", id: "settingsSearchInput" });
  const results = createElement({ id: "settingsSearchResults" });
  const status = createElement({ id: "settingsSearchStatus" });
  const nav = createElement({
    dataset: { pane: "general" },
    classes: ["settings-nav-item", "active"],
  });
  root.append(input, results, status, nav);

  const pane = createElement({
    id: "pane-api-input",
    dataset: { settingsSearchScope: "field" },
    classes: ["settings-pane"],
  });
  const paneTitle = createElement({
    classes: ["settings-pane-title"],
    textContent: "API Input",
  });
  const body = createElement({ classes: ["settings-pane-body"] });
  body.scrollTop = 88;
  const section = createElement({ classes: ["settings-section"] });
  const provider = createElement({
    dataset: { modelServiceProvider: "openai" },
  });
  const card = createElement({ classes: ["settings-card"] });
  const label = createElement({
    classes: ["settings-label"],
    textContent: "API Key",
  });
  const cardTitle = createElement({
    classes: ["settings-card-title"],
    textContent: "OpenAI",
  });
  const description = createElement({
    classes: ["settings-desc"],
    dataset: { i18n: "settings.apiKey.description" },
    textContent: "Provider key",
  });
  card.append(label, cardTitle);
  provider.append(card, description);
  section.appendChild(provider);

  const irrelevant = createElement({ classes: ["settings-section"] });
  const hiddenSection = createElement({
    classes: ["settings-section"],
    hidden: true,
  });
  const hiddenLabel = createElement({
    classes: ["settings-label"],
    textContent: "Hidden section field",
  });
  hiddenSection.appendChild(hiddenLabel);
  const hiddenProvider = createElement({
    dataset: { modelServiceProvider: "ppio" },
  });
  const hiddenProviderLabel = createElement({
    classes: ["settings-label"],
    textContent: "Hidden provider field",
  });
  hiddenProvider.appendChild(hiddenProviderLabel);
  const devOnlyLabel = createElement({
    classes: ["settings-label", "dev-mode-only"],
    textContent: "Dev mode field",
  });
  body.append(section, irrelevant, hiddenSection, hiddenProvider, devOnlyLabel);
  pane.append(paneTitle, body);
  root.appendChild(pane);

  const documentObject = { body: root };
  pane.ownerDocument = documentObject;
  root.ownerDocument = documentObject;
  return {
    root,
    input,
    results,
    status,
    nav,
    pane,
    paneTitle,
    body,
    provider,
    cardTitle,
    label,
    irrelevant,
    documentObject,
  };
}

function createKeyEvent(key, overrides = {}) {
  const calls = { preventDefault: 0, stopPropagation: 0 };
  return {
    event: {
      key,
      target: null,
      defaultPrevented: false,
      isComposing: false,
      preventDefault() {
        calls.preventDefault += 1;
      },
      stopPropagation() {
        calls.stopPropagation += 1;
      },
      ...overrides,
    },
    calls,
  };
}

test("collectSettingsSearchEntries collects pane and field entries with descriptions", () => {
  const { root, body, provider } = createHarness();
  const entries = collectSettingsSearchEntries(root);

  assert.equal(entries.length, 3);
  assert.deepEqual(
    entries.map(({ paneName, title, target }) => ({ paneName, title, target })),
    [
      { paneName: "api-input", title: "API Input", target: body },
      { paneName: "api-input", title: "API Key", target: provider },
      { paneName: "api-input", title: "OpenAI", target: provider },
    ],
  );
  assert.equal(entries[1].category.includes("OpenAI"), true);
  assert.equal(entries[1].description, "Provider key");
});

test("collectSettingsSearchEntries omits hidden, hidden-provider, and dev-only fields", () => {
  const { root } = createHarness();
  const titles = collectSettingsSearchEntries(root).map((entry) => entry.title);

  assert.deepEqual(titles, ["API Input", "API Key", "OpenAI"]);
});

test("initSettingsSearch returns null unless all search controls exist", () => {
  assert.equal(initSettingsSearch({ root: null, activatePane() {} }), null);
  assert.equal(
    initSettingsSearch({
      root: { querySelector: () => null },
      activatePane() {},
    }),
    null,
  );
});

test("initSettingsSearch filters, clears, and restores the previous pane", () => {
  const {
    root,
    input,
    results,
    status,
    body,
    pane,
    irrelevant,
    documentObject,
  } = createHarness();
  const activated = [];
  const search = initSettingsSearch({
    root,
    activatePane: (paneName) => activated.push(paneName),
  });
  try {
    input.value = "api key";
    input.dispatch("input");

    assert.equal(root.classList.contains("is-settings-searching"), true);
    assert.equal(pane.classList.contains("is-settings-search-match"), true);
    assert.equal(
      irrelevant.classList.contains("is-settings-search-hidden"),
      true,
    );
    assert.equal(results.scrollTop, 0);
    assert.notEqual(status.textContent, "");
    assert.deepEqual(activated, ["search"]);

    search.clear();
    assert.equal(input.value, "");
    assert.equal(status.textContent, "");
    assert.equal(root.classList.contains("is-settings-searching"), false);
    assert.equal(pane.classList.contains("is-settings-search-match"), false);
    assert.equal(
      irrelevant.classList.contains("is-settings-search-hidden"),
      false,
    );
    assert.equal(body.scrollTop, 88);
    assert.deepEqual(activated, ["search", "general"]);
  } finally {
    search.destroy();
  }
  assert.equal(documentObject.body, root);
});

test("initSettingsSearch ignores composition input until compositionend", () => {
  const { root, input, status } = createHarness();
  const search = initSettingsSearch({ root, activatePane() {} });
  try {
    input.dispatch("compositionstart");
    input.value = "api";
    input.dispatch("input");
    assert.equal(status.textContent, "");

    input.dispatch("compositionend");
    assert.notEqual(status.textContent, "");
  } finally {
    search.destroy();
  }
});

test("initSettingsSearch clears active search on Escape and restores focus", () => {
  const { root, input, status } = createHarness();
  const search = initSettingsSearch({ root, activatePane() {} });
  try {
    input.value = "api";
    input.dispatch("input");
    const { event, calls } = createKeyEvent("Escape");
    input.dispatch("keydown", event);

    assert.equal(calls.preventDefault, 1);
    assert.equal(calls.stopPropagation, 1);
    assert.equal(input.value, "");
    assert.equal(status.textContent, "");
    assert.deepEqual(input.focusCalls, [{ preventScroll: true }]);
  } finally {
    search.destroy();
  }
});
