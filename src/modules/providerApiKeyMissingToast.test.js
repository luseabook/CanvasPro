import test from "node:test";
import assert from "node:assert/strict";

import {
  getProviderApiKeyFieldIds,
  inferProviderIdFromApiKeyMessage,
  isApiKeyConfigurationMessage,
  isApiKeyMissingMessage,
  openProviderApiKeySettings,
  showProviderApiKeyMissingToast,
  showProviderApiKeyMissingToastForError,
} from "./providerApiKeyMissingToast.js";

function withGlobals({ windowObject, documentObject }, run) {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  if (windowObject === undefined) delete globalThis.window;
  else globalThis.window = windowObject;
  if (documentObject === undefined) delete globalThis.document;
  else globalThis.document = documentObject;
  try {
    return run();
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

function emptyDocument() {
  return { getElementById: () => null };
}

test("getProviderApiKeyFieldIds normalizes provider aliases and prioritizes model keys", () => {
  assert.deepEqual(getProviderApiKeyFieldIds({ providerId: "runninghubwf" }), [
    "providerKey-runninghub",
    "providerKey-runninghub-model",
  ]);
  assert.deepEqual(
    getProviderApiKeyFieldIds({ providerId: "runninghub", keyType: "model" }),
    ["providerKey-runninghub-model", "providerKey-runninghub"],
  );
  assert.deepEqual(
    getProviderApiKeyFieldIds({
      providerId: "runninghub",
      adapterType: "modelapi",
    }),
    ["providerKey-runninghub-model", "providerKey-runninghub"],
  );
  assert.deepEqual(
    getProviderApiKeyFieldIds({
      providerId: "runninghub",
      model: "runninghub-model/flux",
    }),
    ["providerKey-runninghub-model", "providerKey-runninghub"],
  );
  assert.deepEqual(
    getProviderApiKeyFieldIds({ providerId: "volcengine-ark" }),
    ["providerKey-volcengine"],
  );
  assert.deepEqual(getProviderApiKeyFieldIds({ provider: "agnes-domestic" }), [
    "providerKey-agnes-domestic",
  ]);
  assert.deepEqual(getProviderApiKeyFieldIds({}), []);
});

test("inferProviderIdFromApiKeyMessage recognizes explicit and provider-specific messages", () => {
  assert.equal(
    inferProviderIdFromApiKeyMessage("\u5382\u5546: agnes API Key 未配置"),
    "agnes",
  );
  assert.equal(
    inferProviderIdFromApiKeyMessage("RunningHub API key missing"),
    "runninghub",
  );
  assert.equal(
    inferProviderIdFromApiKeyMessage("APIMart key is not configured"),
    "apimart",
  );
  assert.equal(
    inferProviderIdFromApiKeyMessage("Volcengine speech API Key invalid"),
    "volcengine-speech",
  );
  assert.equal(
    inferProviderIdFromApiKeyMessage("Volcengine Ark API Key missing"),
    "volcengine",
  );
  assert.equal(
    inferProviderIdFromApiKeyMessage("PPIO API Key missing"),
    "ppio",
  );
  assert.equal(
    inferProviderIdFromApiKeyMessage("OpenAI API Key missing"),
    "openai",
  );
  assert.equal(inferProviderIdFromApiKeyMessage("Something unrelated"), "");
});

test("isApiKeyMissingMessage accepts English and Chinese configuration prompts", () => {
  assert.equal(isApiKeyMissingMessage("API key is not configured"), true);
  assert.equal(isApiKeyMissingMessage("Please enter API Key"), true);
  assert.equal(isApiKeyMissingMessage("Please add an API key"), true);
  assert.equal(isApiKeyMissingMessage("Missing API key"), true);
  assert.equal(
    isApiKeyMissingMessage(
      "The account has not activated the model, please activate the model service",
    ),
    true,
  );
  assert.equal(
    isApiKeyMissingMessage(
      "\u8bf7\u5148\u5728\u8bbe\u7f6e\u4e2d\u586b\u5199 API Key",
    ),
    true,
  );
  assert.equal(isApiKeyMissingMessage("The request failed"), false);
});

test("isApiKeyConfigurationMessage includes missing and invalid credential messages", () => {
  assert.equal(isApiKeyConfigurationMessage("API key invalid"), true);
  assert.equal(isApiKeyConfigurationMessage("API key expired"), true);
  assert.equal(isApiKeyConfigurationMessage("API key unauthorized"), true);
  assert.equal(
    isApiKeyConfigurationMessage("API key authentication failed"),
    true,
  );
  assert.equal(isApiKeyConfigurationMessage("Request timeout"), false);
});

test("showProviderApiKeyMissingToast forwards message, type, duration, and action", () => {
  const calls = [];
  withGlobals(
    {
      windowObject: {
        showToast(...args) {
          calls.push(args);
        },
      },
      documentObject: emptyDocument(),
    },
    () => {
      assert.equal(
        showProviderApiKeyMissingToast("Custom message", {
          type: "error",
          duration: 1234,
        }),
        true,
      );
      assert.equal(calls.length, 1);
      assert.equal(calls[0][0], "Custom message");
      assert.equal(calls[0][1], "error");
      assert.equal(calls[0][2], 1234);
      assert.equal(calls[0][3].actionLabel, "\u53bb\u8bbe\u7f6e");
      assert.equal(typeof calls[0][3].onAction, "function");
    },
  );
});

test("showProviderApiKeyMissingToast uses defaults and opens settings without toast support", () => {
  const calls = [];
  withGlobals(
    {
      windowObject: {
        showToast(...args) {
          calls.push(args);
        },
      },
      documentObject: emptyDocument(),
    },
    () => {
      showProviderApiKeyMissingToast("");
      assert.equal(calls[0][0], "\u8bf7\u5148\u586b\u5199 API Key");
      assert.equal(calls[0][1], "warn");
    },
  );

  withGlobals({ windowObject: {}, documentObject: emptyDocument() }, () => {
    assert.equal(showProviderApiKeyMissingToast("Needs key"), true);
    assert.equal(openProviderApiKeySettings({ providerId: "openai" }), false);
  });
});

test("showProviderApiKeyMissingToastForError filters unrelated and CLI login errors", () => {
  const calls = [];
  withGlobals(
    {
      windowObject: {
        showToast(...args) {
          calls.push(args);
        },
      },
      documentObject: emptyDocument(),
    },
    () => {
      assert.equal(
        showProviderApiKeyMissingToastForError({
          code: "MODEL_CREDENTIAL_MISSING",
          message: "Credential required",
          providerId: "openai",
        }),
        true,
      );
      assert.equal(calls.length, 1);

      assert.equal(
        showProviderApiKeyMissingToastForError({
          type: "AUTH_ERROR",
          message: "API key expired",
          provider: "volcengine",
        }),
        true,
      );
      assert.equal(calls.length, 2);

      assert.equal(
        showProviderApiKeyMissingToastForError({
          keyType: "clilogin",
          code: "MODEL_CREDENTIAL_MISSING",
        }),
        false,
      );
      assert.equal(
        showProviderApiKeyMissingToastForError({
          code: "OTHER",
          message: "Request timeout",
        }),
        false,
      );
      assert.equal(calls.length, 2);
    },
  );
});

test("showProviderApiKeyMissingToastForError reads getUserMessage and original fields", () => {
  const calls = [];
  withGlobals(
    {
      windowObject: {
        showToast(...args) {
          calls.push(args);
        },
      },
      documentObject: emptyDocument(),
    },
    () => {
      const error = {
        getMessage() {},
        getUserMessage() {
          return "RunningHub API key missing";
        },
        providerId: "runninghubwf",
        fieldIds: ["custom-key"],
      };
      assert.equal(showProviderApiKeyMissingToastForError(error), true);
      assert.equal(calls[0][0], "RunningHub API key missing");
      assert.equal(typeof calls[0][3].onAction, "function");
    },
  );
});
