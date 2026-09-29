import test from "node:test";
import assert from "node:assert/strict";

import {
  activateSettingsPane,
  closeSettingsPanel,
  focusSettingsField,
  highlightSettingsField,
  initSettingsPanelEvents,
  openSettingsPanel,
  openSettingsPanelToField,
  toggleSettingsPanel,
} from "./panelSettings.js";

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
  id = "",
  tagName = "div",
  dataset = {},
  classes = [],
  hidden = false,
} = {}) {
  const listeners = new Map();
  const attributes = new Map();
  const element = {
    id,
    tagName,
    dataset: { ...dataset },
    hidden,
    style: {},
    parentElement: null,
    children: [],
    ownerDocument: null,
    classList: createClassList(classes),
    appendChild(child) {
      child.parentElement = element;
      element.children.push(child);
      return child;
    },
    contains(node) {
      return (
        node === element ||
        element.children.some((child) => child.contains(node))
      );
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
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    focus(options) {
      element.focusCalls = [...(element.focusCalls || []), options];
    },
    select() {
      element.selectCalls = (element.selectCalls || 0) + 1;
    },
    scrollIntoView(options) {
      element.scrollCalls = [...(element.scrollCalls || []), options];
    },
    getBoundingClientRect() {
      element.rectReads = (element.rectReads || 0) + 1;
      return {};
    },
    getClientRects() {
      return [{}];
    },
  };
  return element;
}

function createTimerHost() {
  let nextId = 1;
  const timers = new Map();
  const cleared = [];
  return {
    timers,
    cleared,
    setTimeout(callback, delay) {
      const id = nextId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      cleared.push(id);
      timers.delete(id);
    },
    runNext() {
      const entry = timers.entries().next().value;
      if (!entry) return false;
      const [id, timer] = entry;
      timers.delete(id);
      timer.callback();
      return true;
    },
  };
}

function createEnvironment({ withSearchControls = false } = {}) {
  const overlay = createElement({ id: "settingsOverlay", style: {} });
  const modal = createElement({ classes: ["settings-modal"] });
  const avatarMenu = createElement({ id: "avatarMenu", classes: ["open"] });
  const userAvatar = createElement({ id: "userAvatar" });
  const openButton = createElement({ id: "btnOpenSettings" });
  const closeButton = createElement({ id: "btnSettingsClose" });
  const navGeneral = createElement({
    dataset: { pane: "general" },
    classes: ["settings-nav-item", "active"],
  });
  const navApi = createElement({
    dataset: { pane: "api-input" },
    classes: ["settings-nav-item"],
  });
  const paneGeneral = createElement({
    id: "pane-general",
    classes: ["settings-pane", "active"],
  });
  const paneApi = createElement({
    id: "pane-api-input",
    classes: ["settings-pane"],
  });
  const field = createElement({ id: "apiKeyInput" });
  overlay.appendChild(modal);

  const searchInput = createElement({ id: "settingsSearchInput" });
  const searchResults = createElement({ id: "settingsSearchResults" });
  const searchStatus = createElement({ id: "settingsSearchStatus" });
  const searchControls = new Map([
    ["#settingsSearchInput", searchInput],
    ["#settingsSearchResults", searchResults],
    ["#settingsSearchStatus", searchStatus],
  ]);
  overlay.querySelector = (selector) => {
    if (selector === ".settings-modal") return modal;
    if (withSearchControls) return searchControls.get(selector) || null;
    return null;
  };

  const elements = new Map([
    ["settingsOverlay", overlay],
    ["avatarMenu", avatarMenu],
    ["userAvatar", userAvatar],
    ["btnOpenSettings", openButton],
    ["btnSettingsClose", closeButton],
    ["apiKeyInput", field],
  ]);
  const documentListeners = new Map();
  const documentObject = {
    body: createElement(),
    activeElement: null,
    getElementById(id) {
      return elements.get(id) || null;
    },
    querySelector(selector) {
      if (selector === ".settings-nav-item.active") return navGeneral;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === ".settings-nav-item") return [navGeneral, navApi];
      if (selector === ".settings-pane") return [paneGeneral, paneApi];
      if (selector === ".is-settings-field-highlight") return [field];
      return [];
    },
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (documentListeners.get(type) === listener)
        documentListeners.delete(type);
    },
  };
  const windowObject = {
    ...createTimerHost(),
    listeners: new Map(),
    events: [],
    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (this.listeners.get(type) === listener) this.listeners.delete(type);
    },
    dispatchEvent(event) {
      this.events.push(event);
      return true;
    },
  };
  overlay.ownerDocument = documentObject;
  modal.ownerDocument = documentObject;
  documentObject.defaultView = windowObject;
  return {
    overlay,
    modal,
    avatarMenu,
    userAvatar,
    openButton,
    closeButton,
    navGeneral,
    navApi,
    paneGeneral,
    paneApi,
    field,
    searchInput,
    searchResults,
    searchStatus,
    documentObject,
    windowObject,
  };
}

function withRuntime(environment, run) {
  const previousDocument = globalThis.document;
  const previousWindow = globalThis.window;
  globalThis.document = environment.documentObject;
  globalThis.window = environment.windowObject;
  try {
    return run();
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

test("activateSettingsPane toggles nav and pane state", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    const { navGeneral, navApi, paneGeneral, paneApi } = environment;
    assert.equal(activateSettingsPane("api-input"), true);
    assert.equal(navGeneral.classList.contains("active"), false);
    assert.equal(navApi.classList.contains("active"), true);
    assert.equal(navApi.getAttribute("aria-current"), "page");
    assert.equal(navGeneral.getAttribute("aria-current"), null);
    assert.equal(paneGeneral.classList.contains("active"), false);
    assert.equal(paneApi.classList.contains("active"), true);

    assert.equal(activateSettingsPane("missing"), false);
    assert.equal(activateSettingsPane(" "), false);
  });
});

test("openSettingsPanel and closeSettingsPanel update the overlay and dispatch lifecycle events", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    assert.equal(openSettingsPanel(), true);
    assert.equal(environment.overlay.style.display, "block");
    assert.equal(environment.avatarMenu.classList.contains("open"), false);
    assert.equal(
      environment.windowObject.events.some(
        (event) => event.type === "web-preview:force-sync",
      ),
      true,
    );

    assert.equal(closeSettingsPanel(), true);
    assert.equal(environment.overlay.style.display, "none");
    assert.equal(
      environment.windowObject.events.some(
        (event) => event.type === "settings-panel-closed",
      ),
      true,
    );
  });
});

test("toggleSettingsPanel opens a closed panel and closes an open one", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    assert.equal(toggleSettingsPanel(), true);
    assert.equal(environment.overlay.style.display, "block");
    assert.equal(toggleSettingsPanel(), true);
    assert.equal(environment.overlay.style.display, "none");
  });
});

test("highlightSettingsField replaces previous highlights and clears after the timer", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    const field = environment.field;
    assert.equal(highlightSettingsField(field, { duration: 25 }), true);
    assert.equal(field.classList.contains("is-settings-field-highlight"), true);
    assert.equal(field.rectReads, 1);
    assert.equal(environment.windowObject.runNext(), true);
    assert.equal(
      field.classList.contains("is-settings-field-highlight"),
      false,
    );
    assert.equal(highlightSettingsField(null), false);
  });
});

test("focusSettingsField uses the first available id and applies select and highlight options", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    assert.equal(focusSettingsField(["missing", "apiKeyInput"]), true);
    assert.deepEqual(environment.field.scrollCalls, [
      { block: "center", behavior: "smooth" },
    ]);
    assert.deepEqual(environment.field.focusCalls, [undefined]);
    assert.equal(environment.field.selectCalls, 1);
    assert.equal(
      environment.field.classList.contains("is-settings-field-highlight"),
      true,
    );
    assert.equal(environment.windowObject.runNext(), true);
    assert.equal(focusSettingsField([]), false);
  });
});

test("openSettingsPanelToField opens the target pane and focuses the field on the next task", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    assert.equal(
      openSettingsPanelToField({
        paneName: "api-input",
        fieldIds: ["apiKeyInput"],
        select: false,
      }),
      true,
    );
    assert.equal(environment.overlay.style.display, "block");
    assert.equal(environment.navApi.classList.contains("active"), true);
    assert.deepEqual(environment.field.focusCalls, undefined);

    assert.equal(environment.windowObject.runNext(), true);
    assert.deepEqual(environment.field.focusCalls, [undefined]);
    assert.equal(environment.field.selectCalls, undefined);
    assert.equal(closeSettingsPanel(), true);
  });
});

test("initSettingsPanelEvents wires open, close, overlay, and navigation controls", () => {
  const environment = createEnvironment();
  withRuntime(environment, () => {
    initSettingsPanelEvents();
    let propagationStopped = 0;
    environment.openButton.dispatch("click", {
      stopPropagation() {
        propagationStopped += 1;
      },
    });
    assert.equal(propagationStopped, 1);
    assert.equal(environment.overlay.style.display, "block");

    environment.closeButton.dispatch("click");
    assert.equal(environment.overlay.style.display, "none");

    environment.overlay.dispatch("pointerdown", {
      target: environment.overlay,
    });
    environment.overlay.dispatch("pointerup", { target: environment.overlay });
    environment.overlay.dispatch("click", { target: environment.overlay });
    assert.equal(environment.overlay.style.display, "none");

    environment.navApi.dispatch("click");
    assert.equal(environment.navApi.classList.contains("active"), true);
    assert.equal(environment.paneApi.classList.contains("active"), true);
    closeSettingsPanel();
  });
});
