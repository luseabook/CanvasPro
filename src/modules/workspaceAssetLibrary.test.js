import test from "node:test";
import assert from "node:assert/strict";

import {
  _resetAssetMentionRegistryForTests,
  setAssetMentionAssets,
  setAssetMentionLibrarySettings,
} from "./assetMentionRegistry.js";
import {
  buildWorkspaceAssetLibraryHierarchy,
  buildWorkspaceAssetLibraryItems,
  createWorkspaceAssetLibraryDisclosure,
  getWorkspaceAssetLibraryMediaLabel,
  getWorkspaceAssetLibrarySelectionOrder,
  handleWorkspaceAssetLibraryImageError,
  renderWorkspaceAssetLibraryGroups,
} from "./workspaceAssetLibrary.js";

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

function createToggleHarness() {
  const attributes = new Map();
  const chevron = {
    classList: createClassList(),
  };
  const content = {
    hidden: true,
    attrs: new Map(),
    images: [],
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    },
    querySelectorAll() {
      return this.images;
    },
  };
  const category = {
    attrs: new Map(),
    setAttribute(name, value) {
      this.attrs.set(name, String(value));
    },
  };
  const toggle = {
    dataset: { workspaceAssetLibraryToggle: "Characters" },
    attrs: attributes,
    classList: createClassList(),
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    querySelector(selector) {
      return selector === ".v2-material-tree-chevron" ? chevron : null;
    },
    closest(selector) {
      if (selector === "[data-workspace-asset-library-toggle]") return toggle;
      if (selector === "[data-workspace-asset-library-category]")
        return category;
      return null;
    },
  };
  category.querySelector = (selector) =>
    selector === "[data-workspace-asset-library-category-content]"
      ? content
      : null;
  return { toggle, category, content, chevron };
}

test("handleWorkspaceAssetLibraryImageError applies a fallback once", () => {
  const attributes = new Map([
    [
      "data-workspace-asset-library-fallback-src",
      "https://example.com/fallback.png",
    ],
    ["src", "https://example.com/broken.png"],
  ]);
  const target = {
    loading: "lazy",
    getAttribute(name) {
      return attributes.get(name) || null;
    },
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
  };

  assert.equal(handleWorkspaceAssetLibraryImageError({ target }), true);
  assert.equal(target.loading, "eager");
  assert.equal(target.getAttribute("src"), "https://example.com/fallback.png");
  assert.equal(
    target.getAttribute("data-workspace-asset-library-fallback-src"),
    null,
  );
  assert.equal(handleWorkspaceAssetLibraryImageError({ target }), false);
});

test("getWorkspaceAssetLibraryMediaLabel falls back to the generic asset label", () => {
  assert.equal(getWorkspaceAssetLibraryMediaLabel("image"), "图片");
  assert.equal(getWorkspaceAssetLibraryMediaLabel(" VIDEO "), "视频");
  assert.equal(getWorkspaceAssetLibraryMediaLabel("unknown"), "素材");
});

test("buildWorkspaceAssetLibraryItems maps registry entries and honors type limits", () => {
  _resetAssetMentionRegistryForTests();
  setAssetMentionAssets([
    {
      id: "asset-1",
      name: "Hero Group",
      category: "Characters",
      items: [
        {
          name: "Hero",
          type: "image",
          url: "https://example.com/hero.png",
          thumbUrl: "https://example.com/hero-thumb.png",
        },
        {
          name: "Source",
          type: "text",
          text: "hello",
        },
      ],
    },
  ]);

  const images = buildWorkspaceAssetLibraryItems({
    allowedTypes: ["image"],
    limit: 1,
  });
  assert.deepEqual(images, [
    {
      id: "library-asset-1-0",
      sourceAssetId: "asset-1",
      sourceItemIndex: 0,
      kind: "library",
      mediaKind: "image",
      category: "Characters",
      assetCategory: "Characters",
      name: "Hero",
      assetName: "Hero Group",
      role: "图片素材",
      occurrences: "来自总素材",
      description: "来自素材组「Hero Group」",
      prompt: "",
      imageUrl: "https://example.com/hero.png",
      thumbnailUrl: "https://example.com/hero-thumb.png",
      sourceUrl: "https://example.com/hero.png",
      isLibraryAsset: true,
    },
  ]);
  assert.equal(
    buildWorkspaceAssetLibraryItems({ allowedTypes: ["text"] }).length,
    1,
  );
  _resetAssetMentionRegistryForTests();
});

test("buildWorkspaceAssetLibraryHierarchy nests children and aggregates counts", () => {
  const hierarchy = buildWorkspaceAssetLibraryHierarchy({
    assets: [{ id: "image-1", name: "Hero", category: "Characters" }],
    categories: ["People", "Characters", "Others"],
    displayNames: { People: "人物" },
    parents: { Characters: "People" },
  });

  assert.equal(hierarchy.length, 1);
  assert.equal(hierarchy[0].category, "People");
  assert.equal(hierarchy[0].label, "人物");
  assert.equal(hierarchy[0].count, 1);
  assert.equal(hierarchy[0].children.length, 1);
  assert.equal(hierarchy[0].children[0].category, "Characters");
  assert.equal(hierarchy[0].children[0].assets[0].id, "image-1");
});

test("getWorkspaceAssetLibrarySelectionOrder follows expanded folders", () => {
  setAssetMentionLibrarySettings({
    categories: ["People", "Characters"],
    parents: { Characters: "People" },
  });
  const order = getWorkspaceAssetLibrarySelectionOrder(
    [
      { id: "people-1", category: "People" },
      { id: "character-1", category: "Characters" },
    ],
    {
      isExpanded(category) {
        return ["People", "Characters"].includes(category);
      },
    },
  );

  assert.deepEqual(order, ["character-1", "people-1"]);
  _resetAssetMentionRegistryForTests();
});

test("renderWorkspaceAssetLibraryGroups renders escaped folder metadata and assets", () => {
  const html = renderWorkspaceAssetLibraryGroups({
    assets: [
      { id: "asset-1", name: "Hero", category: "A & B" },
      { id: "asset-2", name: "Other", category: "Other" },
    ],
    expandedCategories: ["A & B"],
    renderAsset: (asset) =>
      `<article data-id="${asset.id}">${asset.name}</article>`,
  });

  assert.equal(html.includes("A &amp; B"), true);
  assert.equal(
    html.includes('data-workspace-asset-library-category="A &amp; B"'),
    true,
  );
  assert.equal(html.includes('aria-expanded="true"'), true);
  assert.equal(
    html.includes('<article data-id="asset-1">Hero</article>'),
    true,
  );
  assert.equal(html.includes("Other"), true);
});

test("workspace asset library disclosure toggles target state and eager-loads images", () => {
  const { toggle, category, content, chevron } = createToggleHarness();
  const image = { loading: "lazy" };
  content.images = [image];
  const disclosure = createWorkspaceAssetLibraryDisclosure();

  assert.equal(disclosure.isExpanded("characters"), false);
  assert.equal(disclosure.toggleFromTarget(toggle), true);
  assert.equal(disclosure.isExpanded("characters"), true);
  assert.deepEqual(disclosure.getExpandedCategories(), ["Characters"]);
  assert.equal(category.attrs.get("aria-expanded"), "true");
  assert.equal(toggle.attrs.get("aria-expanded"), "true");
  assert.equal(chevron.classList.contains("is-open"), true);
  assert.equal(content.hidden, false);
  assert.equal(content.attrs.get("aria-hidden"), "false");
  assert.equal(image.loading, "eager");

  assert.equal(disclosure.toggleFromTarget(toggle), true);
  assert.equal(disclosure.isExpanded("characters"), false);
  assert.equal(content.hidden, true);
  assert.equal(content.attrs.get("aria-hidden"), "true");
  assert.equal(disclosure.toggleFromTarget({}), false);
});
