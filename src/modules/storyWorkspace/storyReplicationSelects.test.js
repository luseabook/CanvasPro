import test from "node:test";
import assert from "node:assert/strict";

import { bindStoryReplicationSelects } from "./storyReplicationSelects.js";
import { bindWorkspaceSelects } from "../workspaceSelects.js";

test("storyReplicationSelects: exposes the shared workspace select binder", () => {
  assert.equal(bindStoryReplicationSelects, bindWorkspaceSelects);
});
