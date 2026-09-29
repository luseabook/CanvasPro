import { onLocaleChange, t } from "../../i18n/index.js";
import { isModelProviderPubliclyListed } from "../../manifests/modelCatalogVisibility.js";
import { listFocusableElements } from "../../utils/focusTrap.js";
import { setModelServiceSettingsSearchCards } from "./modelServiceSettingsNavigator.js";
function isSearchable(_0x536e06, _0x5b0c8a) {
  const _0x44c618 = _0x536e06["closest"]("[data-model-service-provider]");
  if (
    _0x44c618 &&
    !isModelProviderPubliclyListed(_0x44c618["dataset"]["modelServiceProvider"])
  )
    return ![];
  for (
    let _0x1aeebb = _0x536e06;
    _0x1aeebb && _0x1aeebb !== _0x5b0c8a;
    _0x1aeebb = _0x1aeebb["parentElement"]
  ) {
    if (
      _0x1aeebb["hidden"] &&
      !_0x1aeebb["classList"]["contains"]("model-service-provider-detail")
    )
      return ![];
    if (
      _0x1aeebb["classList"]["contains"]("dev-mode-only") &&
      !_0x5b0c8a["ownerDocument"]["body"]["classList"]["contains"]("dev-mode")
    )
      return ![];
  }
  return !![];
}
export function collectSettingsSearchEntries(_0x1f5a0a) {
  const _0x186f32 = [];
  return (
    _0x1f5a0a["querySelectorAll"](".settings-pane:not(#pane-search)")[
      "forEach"
    ]((_0x487aa6) => {
      const _0x51bd67 = _0x487aa6["id"]["replace"](/^pane-/, ""),
        _0x2c2d14 =
          _0x487aa6["querySelector"](".settings-pane-title")?.["textContent"][
            "trim"
          ]() || "",
        _0x5961cd =
          _0x487aa6["querySelector"](".settings-pane-body") || _0x487aa6;
      (_0x186f32["push"]({
        paneName: _0x51bd67,
        category: _0x2c2d14,
        title: _0x2c2d14,
        description: "",
        target: _0x5961cd,
      }),
        _0x487aa6["querySelectorAll"](
          ".settings-label, .settings-card-title, .sc-label",
        )["forEach"]((_0x4166e2) => {
          if (!isSearchable(_0x4166e2, _0x487aa6)) return;
          const _0x17e0df =
              _0x487aa6["dataset"]["settingsSearchScope"] === "pane"
                ? _0x5961cd
                : _0x4166e2["closest"](
                    "[data-model-service-provider], .settings-section",
                  ) || _0x5961cd,
            _0xbbfb98 = _0x4166e2["textContent"]["trim"](),
            _0x33aebd = Array["from"](
              _0x17e0df["querySelectorAll"](".settings-desc[data-i18n]"),
            )
              ["map"]((_0xfb8ed5) => _0xfb8ed5["textContent"]["trim"]())
              ["join"]("\x20"),
            _0x1dfe0b = _0x4166e2["closest"](".settings-card")
              ?.["querySelector"](".settings-card-title")
              ?.["textContent"]["trim"](),
            _0x4b8e4d =
              _0x1dfe0b && _0x1dfe0b !== _0xbbfb98
                ? _0x2c2d14 + " · " + _0x1dfe0b
                : _0x2c2d14;
          if (_0xbbfb98)
            _0x186f32["push"]({
              paneName: _0x51bd67,
              category: _0x4b8e4d,
              title: _0xbbfb98,
              description: _0x33aebd,
              target: _0x17e0df,
            });
        }));
    }),
    _0x186f32
  );
}
export function initSettingsSearch({
  root: _0x1809fb,
  activatePane: _0x465537,
}) {
  const _0x784d90 = _0x1809fb?.["querySelector"]?.("#settingsSearchInput"),
    _0x247b97 = _0x1809fb?.["querySelector"]?.("#settingsSearchResults"),
    _0x2eac9f = _0x1809fb?.["querySelector"]?.("#settingsSearchStatus");
  if (!_0x784d90 || !_0x247b97 || !_0x2eac9f) return null;
  let _0x9302c6 = "general",
    _0x298453 = ![],
    _0x1accb0 = ![];
  const _0x39e3e1 = Array["from"](
      _0x1809fb["querySelectorAll"](".settings-pane:not(#pane-search)"),
    ),
    _0x47d487 = new Set(),
    _0x246599 = new Map(),
    _0x4b4992 = () => {
      (_0x47d487["forEach"]((_0x1f15a2) =>
        _0x1f15a2["classList"]["remove"]("is-settings-search-hidden"),
      ),
        _0x47d487["clear"](),
        _0x39e3e1["forEach"]((_0x965331) =>
          _0x965331["classList"]["remove"]("is-settings-search-match"),
        ));
    },
    _0x49193c = (_0x27f5a5, _0x53ccc8) => {
      if (_0x53ccc8["has"](_0x27f5a5)) return;
      for (const _0x2d98ef of _0x27f5a5["children"]) {
        Array["from"](_0x53ccc8)["some"](
          (_0x1ab469) =>
            _0x2d98ef === _0x1ab469 || _0x2d98ef["contains"](_0x1ab469),
        )
          ? _0x49193c(_0x2d98ef, _0x53ccc8)
          : (_0x2d98ef["classList"]["add"]("is-settings-search-hidden"),
            _0x47d487["add"](_0x2d98ef));
      }
    },
    _0xc11e3 = ({ restore: restore = !![] } = {}) => {
      ((_0x784d90["value"] = ""),
        (_0x2eac9f["textContent"] = ""),
        _0x4b4992(),
        _0x1809fb["classList"]["remove"]("is-settings-searching"));
      if (_0x298453) setModelServiceSettingsSearchCards(null);
      if (_0x298453 && restore) _0x465537(_0x9302c6);
      (_0x246599["forEach"](
        ({ top: _0x3f6fec, left: _0x5900e1 }, _0x2afa54) => {
          ((_0x2afa54["scrollTop"] = _0x3f6fec),
            (_0x2afa54["scrollLeft"] = _0x5900e1));
        },
      ),
        _0x246599["clear"](),
        (_0x298453 = ![]));
    },
    _0x1676e7 = () => {
      if (_0x1accb0) return;
      const _0xb92a0d = _0x784d90["value"]["trim"]()["toLocaleLowerCase"]();
      if (!_0xb92a0d) {
        _0xc11e3({ restore: !![] });
        return;
      }
      !_0x298453 &&
        ((_0x9302c6 =
          _0x1809fb["querySelector"](".settings-nav-item.active")?.["dataset"][
            "pane"
          ] || "general"),
        _0x39e3e1["forEach"]((_0x393799) => {
          const _0x571189 = _0x393799["querySelector"](".settings-pane-body");
          if (_0x571189)
            _0x246599["set"](_0x571189, {
              top: _0x571189["scrollTop"],
              left: _0x571189["scrollLeft"],
            });
        }),
        (_0x298453 = !![]));
      const _0x2e81e1 = _0xb92a0d["split"](/\s+/),
        _0x4513c4 = collectSettingsSearchEntries(_0x1809fb)["filter"](
          (_0x36e2bc) => {
            const _0x2efb04 = (_0x36e2bc["category"] +
              "\x20" +
              _0x36e2bc["title"] +
              "\x20" +
              _0x36e2bc["description"])["toLocaleLowerCase"]();
            return _0x2e81e1["every"]((_0x10de7b) =>
              _0x2efb04["includes"](_0x10de7b),
            );
          },
        );
      _0x4b4992();
      const _0x5438d3 = new Set(
        _0x4513c4["map"]((_0x3df175) => _0x3df175["target"]),
      );
      _0x5438d3["forEach"]((_0x1ab87c) => {
        if (
          Array["from"](_0x5438d3)["some"](
            (_0x510b1b) =>
              _0x510b1b !== _0x1ab87c && _0x510b1b["contains"](_0x1ab87c),
          )
        )
          _0x5438d3["delete"](_0x1ab87c);
      });
      const _0x788fd7 = new Set();
      (_0x39e3e1["forEach"]((_0x36ef1b) => {
        const _0x4a2487 = new Set(
          Array["from"](_0x5438d3)["filter"]((_0x912d20) =>
            _0x36ef1b["contains"](_0x912d20),
          ),
        );
        if (!_0x4a2487["size"]) return;
        (_0x36ef1b["classList"]["add"]("is-settings-search-match"),
          _0x36ef1b["querySelectorAll"]("[data-model-service-provider]")[
            "forEach"
          ]((_0x26fb2e) => {
            if (
              Array["from"](_0x4a2487)["some"](
                (_0x1ee7f4) =>
                  _0x1ee7f4 === _0x26fb2e || _0x1ee7f4["contains"](_0x26fb2e),
              )
            )
              _0x788fd7["add"](_0x26fb2e);
          }));
        const _0x3057d4 = _0x36ef1b["querySelector"](".settings-pane-body");
        if (_0x3057d4) _0x49193c(_0x3057d4, _0x4a2487);
      }),
        setModelServiceSettingsSearchCards(_0x788fd7),
        _0x1809fb["classList"]["add"]("is-settings-searching"),
        (_0x247b97["scrollTop"] = 0x0),
        (_0x2eac9f["textContent"] = _0x5438d3["size"]
          ? t("settings.search.count", { count: _0x5438d3["size"] })
          : t("settings.search.empty")),
        _0x465537("search"));
    },
    _0x3d2ced = (_0x29acea) => {
      if (
        _0x29acea["defaultPrevented"] ||
        _0x29acea["isComposing"] ||
        _0x1accb0
      )
        return;
      if (_0x29acea["key"] === "Escape" && _0x298453)
        (_0x29acea["preventDefault"](),
          _0x29acea["stopPropagation"](),
          _0xc11e3({ restore: !![] }),
          _0x784d90["focus"]({ preventScroll: !![] }));
      else
        _0x29acea["key"] === "ArrowDown" &&
          _0x29acea["target"] === _0x784d90 &&
          _0x298453 &&
          (_0x29acea["preventDefault"](),
          listFocusableElements(_0x247b97)[0x0]?.["focus"]());
    },
    _0x3895cc = () => {
      _0x1accb0 = !![];
    },
    _0x2d7ee0 = () => {
      ((_0x1accb0 = ![]), _0x1676e7());
    };
  (_0x784d90["addEventListener"]("input", _0x1676e7),
    _0x784d90["addEventListener"]("compositionstart", _0x3895cc),
    _0x784d90["addEventListener"]("compositionend", _0x2d7ee0),
    _0x784d90["addEventListener"]("keydown", _0x3d2ced),
    _0x247b97["addEventListener"]("keydown", _0x3d2ced));
  const _0x49f3ff = onLocaleChange(() =>
    queueMicrotask(() => {
      if (_0x298453) _0x1676e7();
    }),
  );
  return {
    clear: _0xc11e3,
    destroy() {
      (_0xc11e3({ restore: !![] }),
        _0x784d90["removeEventListener"]("input", _0x1676e7),
        _0x784d90["removeEventListener"]("compositionstart", _0x3895cc),
        _0x784d90["removeEventListener"]("compositionend", _0x2d7ee0),
        _0x784d90["removeEventListener"]("keydown", _0x3d2ced),
        _0x247b97["removeEventListener"]("keydown", _0x3d2ced),
        _0x49f3ff?.());
    },
  };
}
