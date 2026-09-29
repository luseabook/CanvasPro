import test from "node:test";
import assert from "node:assert/strict";

import {
  MODEL_SERVICE_CATEGORY_IDS,
  aggregateModelServiceProviderStatus,
  initModelServiceSettingsNavigator,
  modelServiceKindsMatchCategory,
  normalizeModelServiceKinds,
  revealModelServiceSettingsField,
  setModelServiceSettingsSearchCards,
} from "./modelServiceSettingsNavigator.js";

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

function createElement({
  tagName = "div",
  dataset = {},
  classes = [],
  hidden = false,
  id = "",
} = {}) {
  const attributes = new Map();
  const listeners = new Map();
  const children = [];
  const element = {
    tagName,
    dataset: { ...dataset },
    hidden,
    id,
    className: "",
    textContent: "",
    style: {},
    children,
    classList: createClassList(classes),
    append(...nodes) {
      children.push(...nodes);
    },
    appendChild(node) {
      children.push(node);
      return node;
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    dispatch(type, event = {}) {
      listeners.get(type)?.(event);
    },
    click(event = {}) {
      listeners.get("click")?.(event);
    },
    focus() {
      this.focusCalls = (this.focusCalls || 0) + 1;
    },
    querySelector(selector) {
      if (selector === ".settings-card-title") return this.titleElement || null;
      if (selector === ".settings-card-head") return this.headElement || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".settings-provider-status")
        return this.statusElements || [];
      return [];
    },
    closest(selector) {
      if (
        selector === "[data-model-service-provider]" &&
        this.dataset.modelServiceProvider
      ) {
        return this;
      }
      return this.closestElement || null;
    },
  };
  return element;
}

function createStatus(text, tone) {
  return createElement({
    classes: ["settings-provider-status", `settings-provider-status--${tone}`],
  });
}

function createCard(
  provider,
  kinds,
  {
    title = provider,
    route = "international",
    hidden = false,
    statuses = [],
  } = {},
) {
  const card = createElement({
    dataset: {
      modelServiceProvider: provider,
      modelServiceKinds: kinds,
      modelServiceRoute: route,
    },
    hidden,
  });
  const titleElement = createElement();
  titleElement.textContent = title;
  card.titleElement = titleElement;
  card.statusElements = statuses.map(({ text, tone }) => {
    const status = createStatus(text, tone);
    status.textContent = text;
    return status;
  });
  return card;
}

function createCategory(id) {
  return createElement({ dataset: { modelServiceCategory: id } });
}

function createHarness() {
  const browser = createElement();
  const picker = createElement();
  const details = createElement();
  const categories = MODEL_SERVICE_CATEGORY_IDS.map(createCategory);
  const cards = [
    createCard("openai", "text", {
      title: "OpenAI",
      route: "international",
      statuses: [{ text: "Ready", tone: "success" }],
    }),
    createCard("stability", "image", {
      title: "Stability",
      route: "international",
      statuses: [{ text: "Missing key", tone: "unconfigured" }],
    }),
    createCard("ppio", "text", { title: "Hidden provider" }),
  ];
  browser.querySelectorAll = (selector) =>
    selector === "[data-model-service-category]" ? categories : [];
  const elements = new Map([
    ["modelServiceBrowser", browser],
    ["modelServiceProviderPicker", picker],
    ["modelServiceProviderDetails", details],
  ]);
  const documentObject = {
    body: createElement(),
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelectorAll(selector) {
      return selector === "[data-model-service-provider]" ? cards : [];
    },
    createElement(tagName) {
      return createElement({ tagName });
    },
  };
  return { browser, picker, details, categories, cards, documentObject };
}

function collectElements(root, found = []) {
  found.push(root);
  root.children?.forEach((child) => collectElements(child, found));
  return found;
}

test("exposes the supported model service categories", () => {
  assert.deepEqual(MODEL_SERVICE_CATEGORY_IDS, [
    "all",
    "text",
    "image",
    "video",
    "audio",
  ]);
});

test("normalizeModelServiceKinds trims, lowercases, filters, and deduplicates", () => {
  assert.deepEqual(
    normalizeModelServiceKinds([" Text ", "IMAGE", "all", "text", "", "video"]),
    ["text", "image", "video"],
  );
  assert.deepEqual(normalizeModelServiceKinds("text, image audio all"), [
    "text",
    "image",
    "audio",
  ]);
  assert.deepEqual(normalizeModelServiceKinds(null), []);
});

test("modelServiceKindsMatchCategory matches all and exact normalized categories", () => {
  assert.equal(modelServiceKindsMatchCategory([], "all"), true);
  assert.equal(modelServiceKindsMatchCategory([" Text "], "text"), true);
  assert.equal(modelServiceKindsMatchCategory(["image"], "text"), false);
  assert.equal(modelServiceKindsMatchCategory(["video"], "bogus"), false);
});

test("aggregateModelServiceProviderStatus returns defaults, passthrough, and summaries", () => {
  assert.equal(aggregateModelServiceProviderStatus([]).tone, "unconfigured");
  assert.deepEqual(
    aggregateModelServiceProviderStatus([{ text: "One", tone: "configured" }]),
    {
      text: "One",
      tone: "configured",
    },
  );
  assert.equal(
    aggregateModelServiceProviderStatus([
      { text: "One", tone: "success" },
      { text: "Two", tone: "success" },
    ]).tone,
    "success",
  );
  assert.equal(
    aggregateModelServiceProviderStatus([
      { text: "One", tone: "success" },
      { text: "Two", tone: "danger" },
    ]).tone,
    "partial",
  );
});

test("aggregateModelServiceProviderStatus uses status priority when none are ready", () => {
  const result = aggregateModelServiceProviderStatus([
    { text: "Unknown", tone: "unknown" },
    { text: "Danger", tone: "danger" },
    { text: "Testing", tone: "testing" },
  ]);
  assert.deepEqual(result, { text: "Testing", tone: "testing" });
});

test("initModelServiceSettingsNavigator requires the browser, picker, and details roots", () => {
  assert.equal(initModelServiceSettingsNavigator(null), null);
  assert.equal(
    initModelServiceSettingsNavigator({ getElementById: () => null }),
    null,
  );
});

test("initModelServiceSettingsNavigator builds provider controls and filters hidden providers", () => {
  const { browser, picker, details, cards, documentObject } = createHarness();
  const navigator = initModelServiceSettingsNavigator(documentObject);
  try {
    assert.ok(navigator);
    assert.equal(browser.classList.contains("is-enhanced"), true);
    assert.equal(picker.children.length, 3);
    assert.equal(details.children.length, 3);
    assert.equal(
      picker.children[0].dataset.modelServiceProviderTarget,
      "openai",
    );
    assert.equal(picker.children[0].classList.contains("is-active"), true);
    assert.equal(picker.children[0].getAttribute("aria-pressed"), "true");
    assert.equal(picker.children[2].hidden, true);
    assert.equal(details.children[0].hidden, false);
    assert.equal(details.children[1].hidden, true);
    assert.equal(
      cards[0].classList.contains("model-service-provider-card"),
      true,
    );
  } finally {
    navigator?.destroy();
  }
});

test("category and search controls update provider visibility", () => {
  const { browser, picker, cards, details, categories, documentObject } =
    createHarness();
  const navigator = initModelServiceSettingsNavigator(documentObject);
  try {
    categories[2].click();
    assert.equal(categories[2].getAttribute("aria-pressed"), "true");
    assert.equal(picker.children[0].hidden, true);
    assert.equal(picker.children[1].hidden, false);
    assert.equal(details.children[0].hidden, true);
    assert.equal(details.children[1].hidden, false);

    navigator.setSearchCards([cards[1]]);
    assert.equal(details.children[0].hidden, true);
    assert.equal(details.children[1].hidden, false);
    assert.equal(cards[1].getAttribute("aria-hidden"), "false");

    navigator.setSearchCards(null);
    assert.equal(details.children[1].hidden, false);
  } finally {
    navigator.destroy();
  }
});

test("revealModelServiceSettingsField activates the owning provider and route", () => {
  const { picker, details, cards, documentObject } = createHarness();
  cards.push(
    createCard("openai", "text", {
      title: "OpenAI Domestic",
      route: "domestic",
      statuses: [{ text: "Missing key", tone: "unconfigured" }],
    }),
  );
  documentObject.querySelectorAll = (selector) =>
    selector === "[data-model-service-provider]" ? cards : [];
  const navigator = initModelServiceSettingsNavigator(documentObject);
  try {
    assert.equal(revealModelServiceSettingsField(cards[3]), true);
    assert.equal(picker.children[0].classList.contains("is-active"), true);
    const routeButtons = collectElements(details).filter(
      (element) => element.dataset.modelServiceRouteTarget === "domestic",
    );
    assert.equal(routeButtons.length, 1);
    assert.equal(routeButtons[0].getAttribute("aria-selected"), "true");
    assert.equal(cards[3].getAttribute("aria-hidden"), "false");
  } finally {
    navigator.destroy();
  }
});

test("field helper functions are safe before initialization", () => {
  assert.equal(revealModelServiceSettingsField(null), false);
  assert.equal(setModelServiceSettingsSearchCards([null]), undefined);
});
