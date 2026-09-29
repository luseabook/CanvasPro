import test from "node:test";
import assert from "node:assert/strict";

import {
  createOperationError,
  getOperationErrorDetail,
} from "./operationError.js";

test("operationError: extracts the first non-empty nested error detail", () => {
  assert.equal(
    getOperationErrorDetail({
      error: { message: "  provider failed  " },
      message: "outer message",
    }),
    "provider failed",
  );
  assert.equal(
    getOperationErrorDetail({ detail: "", reason: "cancelled" }),
    "cancelled",
  );
  assert.equal(getOperationErrorDetail("  trimmed  "), "trimmed");
  assert.equal(getOperationErrorDetail(42), "");
  assert.equal(getOperationErrorDetail(null), "");
});

test("operationError: stops after the supported nesting depth", () => {
  const nested = {
    error: { error: { error: { error: { error: { message: "too deep" } } } } },
  };
  assert.equal(getOperationErrorDetail(nested), "");
});

test("operationError: creates an error with cause metadata and fallback text", () => {
  const cause = {
    message: "request rejected",
    code: "REQUEST_REJECTED",
    status: 400,
    provider: "example",
    retryable: false,
  };
  const error = createOperationError("生成失败", cause);

  assert.equal(error.message, "生成失败：request rejected");
  assert.equal(error.cause, cause);
  assert.equal(error.code, "REQUEST_REJECTED");
  assert.equal(error.status, 400);
  assert.equal(error.provider, "example");
  assert.equal(error.retryable, false);
});

test("operationError: uses fallback text when the cause has no supported detail", () => {
  const error = createOperationError(
    "生成失败",
    { code: "UNKNOWN" },
    "请稍后重试",
  );
  assert.equal(error.message, "生成失败：请稍后重试");
  assert.equal(error.code, "UNKNOWN");
});
