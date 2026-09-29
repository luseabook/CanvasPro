import { revealModelServiceSettingsField } from "./modelServiceSettingsNavigator.js";
import { beginModalInteraction } from "../../services/modalInteractionScope.js";
import { initSettingsSearch } from "./settingsSearch.js";
import { createFocusNavigation } from "../../utils/focusNavigation.js";
let releaseSettingsInteraction = null,
  settingsSearch = null;
function getSettingsPanelElements() {
  return {
    settingsOverlay: document["getElementById"]("settingsOverlay"),
    avatarMenu: document["getElementById"]("avatarMenu"),
  };
}
function isSettingsPanelOpen(_0x16ba4c) {
  return !!_0x16ba4c && _0x16ba4c["style"]["display"] === "block";
}
const SETTINGS_FIELD_HIGHLIGHT_CLASS = "is-settings-field-highlight",
  fieldHighlightTimers = new WeakMap();
function getTimerHost() {
  return globalThis["window"] || globalThis;
}
function scheduleTimer(_0x3a25b1, _0x1c8fb3 = 0x0) {
  const _0x833b0c = getTimerHost();
  if (typeof _0x833b0c?.["setTimeout"] === "function")
    return _0x833b0c["setTimeout"](_0x3a25b1, _0x1c8fb3);
  return (_0x3a25b1(), null);
}
function clearScheduledTimer(_0x10128c) {
  if (_0x10128c == null) return;
  const _0x59b66f = getTimerHost();
  typeof _0x59b66f?.["clearTimeout"] === "function" &&
    _0x59b66f["clearTimeout"](_0x10128c);
}
function dispatchWebPreviewSettingsSync(_0x5811b3) {
  const _0xbcd927 = globalThis["window"];
  if (!_0xbcd927 || typeof _0xbcd927["dispatchEvent"] !== "function") return;
  const _0x460000 = { reason: _0x5811b3 },
    _0xa694fd =
      typeof globalThis["CustomEvent"] === "function"
        ? new globalThis["CustomEvent"]("web-preview:force-sync", {
            detail: _0x460000,
          })
        : { type: "web-preview:force-sync", detail: _0x460000 };
  _0xbcd927["dispatchEvent"](_0xa694fd);
}
export function activateSettingsPane(_0x28b82a = "api-input") {
  const _0x27fbac = String(_0x28b82a || "")["trim"]();
  if (!_0x27fbac) return ![];
  let _0x9f1f86 = ![];
  return (
    document["querySelectorAll"]?.(".settings-nav-item")?.["forEach"](
      (_0x514589) => {
        const _0x3a28be = _0x514589["dataset"]?.["pane"] === _0x27fbac;
        _0x514589["classList"]["toggle"]("active", _0x3a28be);
        if (_0x3a28be) _0x514589["setAttribute"]?.("aria-current", "page");
        else _0x514589["removeAttribute"]?.("aria-current");
        _0x9f1f86 = _0x9f1f86 || _0x3a28be;
      },
    ),
    document["querySelectorAll"]?.(".settings-pane")?.["forEach"](
      (_0x46a2df) => {
        _0x46a2df["classList"]["toggle"](
          "active",
          _0x46a2df["id"] === "pane-" + _0x27fbac,
        );
      },
    ),
    _0x9f1f86
  );
}
export function highlightSettingsField(
  _0x290f99,
  { duration: duration = 0x1068 } = {},
) {
  if (!_0x290f99?.["classList"]) return ![];
  document["querySelectorAll"]?.("." + SETTINGS_FIELD_HIGHLIGHT_CLASS)?.[
    "forEach"
  ]((_0x1642c8) => {
    if (_0x1642c8 !== _0x290f99)
      _0x1642c8["classList"]["remove"](SETTINGS_FIELD_HIGHLIGHT_CLASS);
  });
  const _0x105395 = fieldHighlightTimers["get"](_0x290f99);
  (clearScheduledTimer(_0x105395),
    _0x290f99["classList"]["remove"](SETTINGS_FIELD_HIGHLIGHT_CLASS));
  typeof _0x290f99["getBoundingClientRect"] === "function" &&
    _0x290f99["getBoundingClientRect"]();
  _0x290f99["classList"]["add"](SETTINGS_FIELD_HIGHLIGHT_CLASS);
  const _0x49d312 = scheduleTimer(() => {
    (_0x290f99["classList"]["remove"](SETTINGS_FIELD_HIGHLIGHT_CLASS),
      fieldHighlightTimers["delete"](_0x290f99));
  }, duration);
  if (_0x49d312 != null) fieldHighlightTimers["set"](_0x290f99, _0x49d312);
  return !![];
}
export function focusSettingsField(_0x18f087, _0x4dec5a = {}) {
  const _0x5a9940 = (Array["isArray"](_0x18f087) ? _0x18f087 : [_0x18f087])
    ["map"]((_0x4f045c) => String(_0x4f045c || "")["trim"]())
    ["filter"](Boolean);
  if (!_0x5a9940["length"]) return ![];
  const _0x151fa3 = _0x5a9940["map"]((_0x269882) =>
    document["getElementById"](_0x269882),
  )["find"](Boolean);
  if (!_0x151fa3) return ![];
  (revealModelServiceSettingsField(_0x151fa3),
    _0x151fa3["scrollIntoView"]?.({ block: "center", behavior: "smooth" }),
    _0x151fa3["focus"]?.());
  if (_0x4dec5a["select"] !== ![]) _0x151fa3["select"]?.();
  if (_0x4dec5a["highlight"] !== ![])
    highlightSettingsField(_0x151fa3, _0x4dec5a);
  return !![];
}
export function openSettingsPanelToField({
  paneName: paneName = "api-input",
  fieldIds: fieldIds = [],
  select: select = !![],
  highlight: highlight = !![],
} = {}) {
  const _0x65de1c = openSettingsPanel();
  if (!_0x65de1c) return ![];
  return (
    settingsSearch?.["clear"](),
    activateSettingsPane(paneName),
    scheduleTimer(() => {
      focusSettingsField(fieldIds, { select: select, highlight: highlight });
    }, 0x0),
    !![]
  );
}
export function openSettingsPanel() {
  const { settingsOverlay: _0x1131a6, avatarMenu: _0x12dd4c } =
    getSettingsPanelElements();
  if (!_0x1131a6) return ![];
  ((_0x1131a6["style"]["display"] = "block"),
    _0x12dd4c?.["classList"]["remove"]("open"));
  if (!releaseSettingsInteraction) {
    const _0x3970e1 =
        _0x1131a6["querySelector"]?.(".settings-modal") || _0x1131a6,
      _0x12e2ad = createFocusNavigation();
    _0x12e2ad["addRoot"](_0x3970e1);
    const _0x266ef9 = beginModalInteraction({
      root: _0x3970e1,
      onClose: closeSettingsPanel,
      returnFocus: document["getElementById"]("userAvatar"),
      preferredSelector: ".settings-nav-item.active",
    });
    releaseSettingsInteraction = () => {
      (_0x12e2ad["destroy"](), _0x266ef9());
    };
  }
  return (dispatchWebPreviewSettingsSync("settings-open"), !![]);
}
export function closeSettingsPanel() {
  const { settingsOverlay: _0x289e55 } = getSettingsPanelElements();
  if (!_0x289e55) return ![];
  (settingsSearch?.["clear"]({ restore: !![] }),
    (_0x289e55["style"]["display"] = "none"),
    releaseSettingsInteraction?.(),
    (releaseSettingsInteraction = null));
  const _0x5483ab = globalThis["window"];
  if (_0x5483ab && typeof _0x5483ab["dispatchEvent"] === "function") {
    const _0x17d4e2 =
      typeof globalThis["CustomEvent"] === "function"
        ? new globalThis["CustomEvent"]("settings-panel-closed")
        : { type: "settings-panel-closed" };
    _0x5483ab["dispatchEvent"](_0x17d4e2);
  }
  return (dispatchWebPreviewSettingsSync("settings-close"), !![]);
}
export function toggleSettingsPanel() {
  const { settingsOverlay: _0x5d622d } = getSettingsPanelElements();
  if (!_0x5d622d) return ![];
  return isSettingsPanelOpen(_0x5d622d)
    ? closeSettingsPanel()
    : openSettingsPanel();
}
export function initSettingsPanelEvents() {
  const _0xd02f7c = document["getElementById"]("btnOpenSettings"),
    _0xf899fd = document["getElementById"]("btnSettingsClose"),
    _0x3d9fbf = document["getElementById"]("settingsOverlay");
  if (!_0xd02f7c || !_0x3d9fbf) return;
  (_0xd02f7c["addEventListener"]("click", (_0x118374) => {
    (_0x118374["stopPropagation"](), openSettingsPanel());
  }),
    _0xf899fd?.["addEventListener"]("click", () => {
      closeSettingsPanel();
    }));
  let _0x982571 = ![],
    _0x2bc33e = ![];
  const _0xbf3946 = () => {
    ((_0x982571 = ![]), (_0x2bc33e = ![]));
  };
  (_0x3d9fbf["addEventListener"]("pointerdown", (_0x56365f) => {
    ((_0x982571 = _0x56365f["target"] === _0x3d9fbf), (_0x2bc33e = ![]));
  }),
    _0x3d9fbf["addEventListener"]("pointerup", (_0x4bd5c0) => {
      _0x2bc33e = _0x982571 && _0x4bd5c0["target"] === _0x3d9fbf;
    }),
    _0x3d9fbf["addEventListener"]("pointercancel", _0xbf3946),
    _0x3d9fbf["addEventListener"]("click", (_0x1adeb9) => {
      const _0x31291c =
        _0x1adeb9["target"] === _0x3d9fbf && _0x982571 && _0x2bc33e;
      (_0xbf3946(), _0x31291c && closeSettingsPanel());
    }));
  const _0x18f523 = document["querySelectorAll"](".settings-nav-item");
  (settingsSearch?.["destroy"](),
    (settingsSearch = initSettingsSearch({
      root: _0x3d9fbf,
      activatePane: activateSettingsPane,
    })),
    activateSettingsPane(
      document["querySelector"]?.(".settings-nav-item.active")?.["dataset"][
        "pane"
      ] || "general",
    ),
    _0x18f523["forEach"]((_0x1e5e86) => {
      _0x1e5e86["addEventListener"]("click", () => {
        (settingsSearch?.["clear"](),
          activateSettingsPane(_0x1e5e86["dataset"]["pane"]));
      });
    }));
}
