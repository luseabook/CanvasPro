import test from "node:test";
import assert from "node:assert/strict";

import { buildGenerationDebugPreview } from "./generationDebugPreview.js";

test("generationDebugPreview: rejects a missing generation payload", () => {
  assert.throws(
    () => buildGenerationDebugPreview(),
    /当前输入尚未构造出生成请求/,
  );
});

test("generationDebugPreview: masks secrets in the prompt and generated input", () => {
  const preview = buildGenerationDebugPreview({
    payload: {
      prompt: "draw a cat",
      apiKey: "secret-key",
      headers: { authorization: "Bearer secret-token" },
    },
  });
  const promptTab = preview.tabs.find((tab) => tab.label === "提示词");
  const inputTab = preview.tabs.find((tab) => tab.label === "生成输入");

  assert.equal(promptTab.content, "draw a cat");
  assert.doesNotMatch(inputTab.content, /secret-key|secret-token/);
  assert.match(inputTab.content, /\*\*\*/);
});

test("generationDebugPreview: falls back to payload input URLs for ordered reference images", () => {
  const preview = buildGenerationDebugPreview({
    payload: {
      prompt: "animate this",
      inputUrls: ["data/uploads/reference-a.png", "output/reference-b.png"],
    },
    notes: "extra debug note",
  });
  const referenceTab = preview.tabs.find((tab) => tab.label === "参考图顺序");
  const notesTab = preview.tabs.find((tab) => tab.label === "预览说明");

  assert.deepEqual(
    referenceTab.images.map(({ src, path }) => ({ src, path })),
    [
      { src: "/data/uploads/reference-a.png", path: "[0].ref" },
      { src: "/output/reference-b.png", path: "[1].ref" },
    ],
  );
  assert.match(notesTab.content, /extra debug note$/);
});

test("generationDebugPreview: accepts prompt package reference image ordering", () => {
  const preview = buildGenerationDebugPreview({
    payload: { prompt: "animate this" },
    promptPackage: {
      referenceImages: [{ slot: 2, ref: "output/second.png" }],
    },
  });
  const referenceTab = preview.tabs.find((tab) => tab.label === "参考图顺序");

  assert.deepEqual(
    referenceTab.images.map(({ src }) => src),
    ["/output/second.png"],
  );
});
