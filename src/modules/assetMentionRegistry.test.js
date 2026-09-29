import test from "node:test";
import assert from "node:assert/strict";

import {
  _resetAssetMentionRegistryForTests,
  getAssetMentionCandidates,
  getAssetMentionLibrarySettings,
  setAssetMentionAssets,
  setAssetMentionLibrarySettings,
  subscribeAssetMentionRegistry,
} from "./assetMentionRegistry.js";

test("setAssetMentionLibrarySettings normalizes settings and returns copies", () => {
  _resetAssetMentionRegistryForTests();
  const revisions = [];
  const unsubscribe = subscribeAssetMentionRegistry((revision) =>
    revisions.push(revision),
  );
  try {
    assert.equal(
      setAssetMentionLibrarySettings({
        categories: [" People ", "people", "Characters", ""],
        displayNames: { People: "人物", "": "ignored" },
        parents: { Characters: "People", Empty: "" },
      }),
      true,
    );
    assert.deepEqual(getAssetMentionLibrarySettings(), {
      categories: ["People", "Characters"],
      displayNames: { People: "人物" },
      parents: { Characters: "People" },
    });
    assert.equal(revisions.length, 1);

    const copy = getAssetMentionLibrarySettings();
    copy.categories.push("Mutation");
    copy.displayNames.People = "Changed";
    assert.deepEqual(getAssetMentionLibrarySettings().categories, [
      "People",
      "Characters",
    ]);
    assert.equal(getAssetMentionLibrarySettings().displayNames.People, "人物");

    assert.equal(
      setAssetMentionLibrarySettings({
        categories: ["People", "Characters"],
        displayNames: { People: "人物" },
        parents: { Characters: "People" },
      }),
      false,
    );
    assert.equal(revisions.length, 1);
  } finally {
    unsubscribe();
    _resetAssetMentionRegistryForTests();
  }
});

test("asset refs keep category metadata and search includes it", () => {
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
      ],
    },
  ]);

  assert.equal(getAssetMentionCandidates({ query: "characters" }).length, 1);
  assert.deepEqual(
    getAssetMentionCandidates().map(({ assetId, category, assetCategory }) => ({
      assetId,
      category,
      assetCategory,
    })),
    [
      {
        assetId: "asset-1",
        category: "Characters",
        assetCategory: "Characters",
      },
    ],
  );
});
