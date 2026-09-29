import { test } from "node:test";
import assert from "node:assert/strict";
import { setLocale } from "../i18n/index.js";
import { TEXT_CONTEXT_MENU_TARGET_SELECTOR } from "./textInputContextMenu.js";
import {
  bindWorkspaceEntityContextMenu,
  createWorkspaceEntityContextMenuItems,
  createWorkspaceProjectContextMenuItems,
} from "./workspaceEntityContextMenu.js";

setLocale("en-US", { persist: false, notify: false });

function createEvent(overrides = {}) {
  const calls = [];
  return {
    calls,
    clientX: 12,
    clientY: 34,
    defaultPrevented: false,
    target: { isConnected: true },
    preventDefault: () => calls.push("preventDefault"),
    stopPropagation: () => calls.push("stopPropagation"),
    ...overrides,
  };
}

function createRoot() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (listeners.get(type) === listener) listeners.delete(type);
    },
  };
}

test("builds project actions in stable order and drops unavailable actions", () => {
  const calls = [];
  const items = createWorkspaceProjectContextMenuItems({
    onOpen: () => calls.push("open"),
    onCollect: () => calls.push("collect"),
    onDelete: () => calls.push("delete"),
  });

  assert.deepEqual(
    items.filter((item) => item !== "sep").map((item) => item.label),
    ["Open project", "Collect project", "Delete project"],
  );
  assert.deepEqual(
    items.filter((item) => item !== "sep").map((item) => item.shortcutActionId),
    [
      "context-workspace-open-project",
      "context-workspace-collect-project",
      "context-workspace-delete-project",
    ],
  );
  assert.equal(items.at(-2), "sep");

  for (const item of items) {
    if (item !== "sep") item.action();
  }
  assert.deepEqual(calls, ["open", "collect", "delete"]);
});

test("switches archive labels and collapses empty separator groups", () => {
  const archived = createWorkspaceProjectContextMenuItems({
    archived: true,
    onArchive: () => {},
  });
  assert.equal(archived[0].label, "Unarchive project");
  assert.equal(archived[0].icon, "unarchive");
  assert.equal(
    archived[0].shortcutActionId,
    "context-workspace-unarchive-project",
  );

  const sparse = createWorkspaceProjectContextMenuItems({
    onRename: () => {},
    onDelete: () => {},
  });
  assert.deepEqual(
    sparse.map((item) => item.label || item),
    ["Rename", "sep", "Delete project"],
  );

  assert.deepEqual(createWorkspaceProjectContextMenuItems(), []);
});

test("builds entity actions and normalizes extra separators", () => {
  const calls = [];
  const items = createWorkspaceEntityContextMenuItems({
    onActivate: () => calls.push("activate"),
    extraItems: [
      "sep",
      { label: "Custom", action: () => calls.push("custom") },
      "sep",
    ],
    onDelete: () => calls.push("delete"),
    deleteDisabled: true,
  });

  assert.deepEqual(
    items.map((item) => item.label || item),
    ["View", "sep", "Custom", "sep", "Delete"],
  );
  items[2].action();
  assert.equal(items.at(-1).danger, true);
  assert.equal(items.at(-1).disabled, true);
  assert.deepEqual(calls, ["custom"]);

  const activateOnly = createWorkspaceEntityContextMenuItems({
    onActivate: () => {},
  });
  assert.deepEqual(
    activateOnly.map((item) => item.label),
    ["View"],
  );
});

test("opens a normalized menu and tracks the active instance", () => {
  const root = createRoot();
  const firstMenu = { close: () => {} };
  const secondMenu = { close: () => {} };
  const presentations = [];
  const beforeOpen = [];
  const resolvedEvents = [];
  const event = createEvent({ clientX: "18", clientY: "27" });

  const cleanup = bindWorkspaceEntityContextMenu(root, {
    resolveItems: (received) => {
      resolvedEvents.push(received);
      return [{ label: "One", action() {} }];
    },
    beforeOpen: (received) => beforeOpen.push(received),
    presentMenu: (...args) => {
      presentations.push(args);
      return presentations.length === 1 ? firstMenu : secondMenu;
    },
  });
  const handler = root.listeners.get("contextmenu");

  handler(event);
  assert.deepEqual(resolvedEvents, [event]);
  assert.deepEqual(event.calls, ["preventDefault", "stopPropagation"]);
  assert.equal(presentations.length, 1);
  assert.deepEqual(presentations[0].slice(0, 2), [18, 27]);
  assert.deepEqual(presentations[0][2], [
    { label: "One", action: presentations[0][2][0].action },
  ]);
  assert.deepEqual(presentations[0][3], {
    ensureItemIcons: true,
    ownerElement: event.target,
    ownerRoot: root,
  });
  assert.deepEqual(beforeOpen, [event]);

  handler(createEvent());
  assert.equal(presentations.length, 2);
  assert.equal(root.listeners.has("contextmenu"), true);

  cleanup();
  assert.equal(root.listeners.has("contextmenu"), false);
});

test("resolves the owner safely and ignores editable targets", () => {
  const root = createRoot();
  const presentations = [];
  const resolveItems = [];
  const cleanup = bindWorkspaceEntityContextMenu(root, {
    resolveItems: (event) => {
      resolveItems.push(event);
      return [{ label: "One", action() {} }];
    },
    presentMenu: (...args) => presentations.push(args),
  });
  const handler = root.listeners.get("contextmenu");

  const disconnected = createEvent({ target: { isConnected: false } });
  handler(disconnected);
  assert.equal(presentations[0][3].ownerElement, root);

  const editable = createEvent({
    target: {
      closest: (selector) =>
        selector === TEXT_CONTEXT_MENU_TARGET_SELECTOR ? {} : null,
    },
  });
  handler(editable);
  assert.deepEqual(editable.calls, []);
  assert.deepEqual(resolveItems, [disconnected]);

  cleanup();
});

test("closes the active menu without opening for empty or prevented events", () => {
  const root = createRoot();
  const closed = [];
  const presentations = [];
  let items = [{ label: "One", action() {} }];
  const cleanup = bindWorkspaceEntityContextMenu(root, {
    resolveItems: () => items,
    presentMenu: (...args) => {
      presentations.push(args);
      return { close: () => closed.push("close") };
    },
  });
  const handler = root.listeners.get("contextmenu");

  handler(createEvent());
  items = [];
  handler(createEvent());
  assert.equal(presentations.length, 1);
  assert.deepEqual(closed, ["close"]);

  const beforeOpen = [];
  cleanup();
  const cleanupPrevented = bindWorkspaceEntityContextMenu(root, {
    resolveItems: () => {
      beforeOpen.push("resolve");
      return [{ label: "Two", action() {} }];
    },
    beforeOpen: () => beforeOpen.push("open"),
    presentMenu: () => {
      beforeOpen.push("present");
      return { close() {} };
    },
  });
  root.listeners.get("contextmenu")(createEvent({ defaultPrevented: true }));
  assert.deepEqual(beforeOpen, []);
  cleanupPrevented();
});

test("returns a no-op cleanup for invalid roots or resolvers", () => {
  assert.equal(typeof bindWorkspaceEntityContextMenu(null), "function");
  assert.equal(
    typeof bindWorkspaceEntityContextMenu({}, { resolveItems: () => [] }),
    "function",
  );
  assert.equal(
    typeof bindWorkspaceEntityContextMenu(createRoot(), { resolveItems: null }),
    "function",
  );
});
