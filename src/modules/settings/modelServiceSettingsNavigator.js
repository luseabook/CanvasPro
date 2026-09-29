import { onLocaleChange, t } from "../../i18n/index.js";
import { isModelProviderPubliclyListed } from "../../manifests/modelCatalogVisibility.js";
export const MODEL_SERVICE_CATEGORY_IDS = Object["freeze"]([
  "all",
  "text",
  "image",
  "video",
  "audio",
]);
const MODEL_SERVICE_CATEGORY_SET = new Set(MODEL_SERVICE_CATEGORY_IDS),
  PROVIDER_STATUS_TONES = Object["freeze"]([
    "testing",
    "success",
    "partial",
    "configured",
    "unconfigured",
    "deprecated",
    "danger",
  ]),
  PROVIDER_STATUS_CLASSES = PROVIDER_STATUS_TONES["map"](
    (_0x52ba0b) => "settings-provider-status--" + _0x52ba0b,
  );
let activeNavigator = null;
export function normalizeModelServiceKinds(_0x2c0f57) {
  const _0x594b1b = Array["isArray"](_0x2c0f57)
    ? _0x2c0f57
    : String(_0x2c0f57 || "")["split"](/[\s,]+/);
  return Array["from"](
    new Set(
      _0x594b1b["map"]((_0x3c7349) =>
        String(_0x3c7349 || "")
          ["trim"]()
          ["toLowerCase"](),
      )["filter"](
        (_0x527075) =>
          MODEL_SERVICE_CATEGORY_SET["has"](_0x527075) && _0x527075 !== "all",
      ),
    ),
  );
}
export function modelServiceKindsMatchCategory(_0x12fce4, _0x1f0d40 = "all") {
  const _0x1d533f = String(_0x1f0d40 || "all")
    ["trim"]()
    ["toLowerCase"]();
  if (_0x1d533f === "all") return !![];
  return normalizeModelServiceKinds(_0x12fce4)["includes"](_0x1d533f);
}
export function aggregateModelServiceProviderStatus(_0x54aa1f = []) {
  const _0x2f8421 = _0x54aa1f["map"]((_0x303515) => ({
    text: String(_0x303515?.["text"] || "")["trim"](),
    tone: String(_0x303515?.["tone"] || "")
      ["trim"]()
      ["toLowerCase"](),
  }))["filter"]((_0x233071) => _0x233071["text"] || _0x233071["tone"]);
  if (!_0x2f8421["length"])
    return {
      text: t("settings.apiInput.readiness.requiredShort"),
      tone: "unconfigured",
    };
  if (_0x2f8421["length"] === 0x1) return _0x2f8421[0x0];
  const _0x458e8a = _0x2f8421["filter"](
    (_0x507837) => _0x507837["tone"] === "success",
  )["length"];
  if (_0x458e8a === _0x2f8421["length"])
    return {
      text: t("settings.apiInput.catalog.allRoutesReady"),
      tone: "success",
    };
  if (_0x458e8a > 0x0)
    return {
      text: t("settings.apiInput.catalog.routesReady", {
        count: _0x458e8a,
        total: _0x2f8421["length"],
      }),
      tone: "partial",
    };
  const _0x3529a6 = [
      "testing",
      "partial",
      "configured",
      "danger",
      "deprecated",
      "unconfigured",
    ],
    _0x95d52f =
      _0x3529a6["find"]((_0x49a647) =>
        _0x2f8421["some"]((_0x4c7e06) => _0x4c7e06["tone"] === _0x49a647),
      ) || _0x2f8421[0x0]["tone"];
  return (
    _0x2f8421["find"]((_0x207a68) => _0x207a68["tone"] === _0x95d52f) ||
    _0x2f8421[0x0]
  );
}
function readProviderStatusTone(_0x5c4a8f) {
  return (
    PROVIDER_STATUS_TONES["find"]((_0x45d709) =>
      _0x5c4a8f?.["classList"]?.["contains"](
        "settings-provider-status--" + _0x45d709,
      ),
    ) || ""
  );
}
function readCardStatus(_0x2e73e5) {
  const _0x198260 = Array["from"](
    _0x2e73e5?.["querySelectorAll"]?.(".settings-provider-status") || [],
  )
    ["filter"](
      (_0x509107) =>
        !_0x509107["hidden"] &&
        String(_0x509107["textContent"] || "")["trim"](),
    )
    ["map"]((_0x231349) => ({
      text: String(_0x231349["textContent"] || "")["trim"](),
      tone: readProviderStatusTone(_0x231349),
    }));
  return _0x198260["length"]
    ? aggregateModelServiceProviderStatus(_0x198260)
    : null;
}
function getProviderLabel(_0x6bf885, _0x451cae) {
  return (
    String(
      _0x451cae?.["querySelector"]?.(".settings-card-title")?.["textContent"] ||
        "",
    )["trim"]() || _0x6bf885
  );
}
function cloneProviderIcon(_0x53a9c3, _0x14c767) {
  const _0x49577f = _0x14c767?.["querySelector"]?.(".settings-card-head"),
    _0x2229fe = _0x49577f?.["querySelector"]?.(
      ".settings-card-icon, .settings-card-badge, svg",
    ),
    _0x330904 = _0x53a9c3["createElement"]("span");
  ((_0x330904["className"] = "model-service-provider-option-icon"),
    _0x330904["setAttribute"]("aria-hidden", "true"));
  if (_0x2229fe?.["cloneNode"]) {
    const _0x42d783 = _0x2229fe["cloneNode"](!![]);
    (_0x42d783["removeAttribute"]?.("id"), _0x330904["appendChild"](_0x42d783));
  }
  return _0x330904;
}
function getRouteLabel(_0x23455b, _0x4dfa3c) {
  const _0x540f00 = String(
    _0x4dfa3c?.["dataset"]?.["modelServiceRouteLabelI18n"] || "",
  )["trim"]();
  if (_0x540f00) return t(_0x540f00);
  if (_0x23455b === "domestic")
    return t("settings.apiInput.catalog.routeDomestic");
  if (_0x23455b === "international")
    return t("settings.apiInput.catalog.routeInternational");
  return (
    String(
      _0x4dfa3c?.["querySelector"]?.(".settings-card-title")?.["textContent"] ||
        "",
    )["trim"]() || _0x23455b
  );
}
function isCardAvailable(_0x5c53f9, _0x1f6c82) {
  if (!_0x5c53f9 || _0x5c53f9["hidden"]) return ![];
  if (
    !isModelProviderPubliclyListed(
      _0x5c53f9["dataset"]?.["modelServiceProvider"],
    )
  )
    return ![];
  if (
    _0x5c53f9["classList"]?.["contains"]("dev-mode-only") &&
    !_0x1f6c82?.["body"]?.["classList"]?.["contains"]("dev-mode")
  )
    return ![];
  return !![];
}
function createProviderGroup(_0x34ec26, _0x1e51a6, _0x5ae2d5, _0x189f5a) {
  const _0x1154a4 = _0x34ec26["createElement"]("section");
  ((_0x1154a4["className"] = "model-service-provider-detail"),
    (_0x1154a4["dataset"]["modelServiceProviderDetail"] = _0x1e51a6),
    (_0x1154a4["hidden"] = !![]));
  const _0x25c123 = new Map();
  if (_0x5ae2d5["length"] > 0x1) {
    const _0x1c067a = _0x34ec26["createElement"]("div");
    _0x1c067a["className"] = "model-service-detail-route-header";
    const _0x30b254 = _0x34ec26["createElement"]("span");
    ((_0x30b254["className"] = "model-service-detail-route-label"),
      (_0x30b254["dataset"]["i18n"] = "settings.apiInput.catalog.routeLabel"),
      (_0x30b254["textContent"] = t("settings.apiInput.catalog.routeLabel")));
    const _0xd6060c = _0x34ec26["createElement"]("div");
    ((_0xd6060c["className"] = "model-service-detail-route-tabs"),
      _0xd6060c["setAttribute"]("role", "tablist"),
      _0xd6060c["setAttribute"](
        "aria-label",
        t("settings.apiInput.catalog.routeAria"),
      ),
      _0x5ae2d5["forEach"]((_0x2caedf, _0x178d58) => {
        const _0x1f9681 =
            String(_0x2caedf["dataset"]["modelServiceRoute"] || "")["trim"]() ||
            "route-" + (_0x178d58 + 0x1),
          _0x57cf98 = _0x34ec26["createElement"]("button");
        ((_0x57cf98["type"] = "button"),
          (_0x57cf98["className"] = "model-service-detail-route-tab"),
          (_0x57cf98["dataset"]["modelServiceRouteTarget"] = _0x1f9681),
          _0x57cf98["setAttribute"]("role", "tab"),
          _0x57cf98["setAttribute"]("aria-selected", "false"));
        const _0xda59ee =
            _0x2caedf["id"] ||
            "model-service-route-panel-" + _0x1e51a6 + "-" + _0x1f9681,
          _0x382d4e = _0xda59ee + "-tab";
        ((_0x2caedf["id"] = _0xda59ee),
          (_0x57cf98["id"] = _0x382d4e),
          _0x57cf98["setAttribute"]("aria-controls", _0xda59ee),
          _0x2caedf["setAttribute"]("role", "tabpanel"),
          _0x2caedf["setAttribute"]("aria-labelledby", _0x382d4e));
        const _0x5a73e5 = _0x34ec26["createElement"]("span");
        ((_0x5a73e5["className"] = "model-service-detail-route-name"),
          (_0x5a73e5["textContent"] = getRouteLabel(_0x1f9681, _0x2caedf)));
        const _0x4ea6d2 = _0x34ec26["createElement"]("span");
        ((_0x4ea6d2["className"] =
          "settings-provider-status model-service-detail-route-status settings-provider-status--unconfigured"),
          (_0x4ea6d2["textContent"] = t(
            "settings.apiInput.readiness.requiredShort",
          )),
          _0x57cf98["append"](_0x5a73e5, _0x4ea6d2),
          _0xd6060c["appendChild"](_0x57cf98),
          _0x25c123["set"](_0x1f9681, {
            button: _0x57cf98,
            card: _0x2caedf,
            name: _0x5a73e5,
            status: _0x4ea6d2,
          }));
      }),
      _0x1c067a["append"](_0x30b254, _0xd6060c),
      _0x1154a4["appendChild"](_0x1c067a));
  }
  const _0x39605b = _0x34ec26["createElement"]("div");
  return (
    (_0x39605b["className"] = "model-service-provider-card-stage"),
    _0x5ae2d5["forEach"]((_0x43f53d) => {
      (_0x43f53d["classList"]["add"]("model-service-provider-card"),
        _0x39605b["appendChild"](_0x43f53d));
    }),
    _0x1154a4["appendChild"](_0x39605b),
    _0x189f5a["appendChild"](_0x1154a4),
    {
      id: _0x1e51a6,
      cards: _0x5ae2d5,
      kinds: Array["from"](
        new Set(
          _0x5ae2d5["flatMap"]((_0x1a3b9e) =>
            normalizeModelServiceKinds(
              _0x1a3b9e["dataset"]["modelServiceKinds"],
            ),
          ),
        ),
      ),
      wrapper: _0x1154a4,
      routeButtons: _0x25c123,
      activeRouteId: "",
      button: null,
      buttonName: null,
    }
  );
}
function createProviderButton(_0x1d7201, _0x1bd64c, _0x68b445) {
  const _0x11126c = _0x1bd64c["cards"][0x0],
    _0x49de4f = _0x1d7201["createElement"]("button");
  ((_0x49de4f["type"] = "button"),
    (_0x49de4f["className"] = "model-service-provider-option"),
    (_0x49de4f["dataset"]["modelServiceProviderTarget"] = _0x1bd64c["id"]),
    _0x49de4f["setAttribute"]("aria-pressed", "false"));
  _0x11126c["classList"]?.["contains"]("dev-mode-only") &&
    _0x49de4f["classList"]["add"]("dev-mode-only");
  const _0x382f85 = _0x1d7201["createElement"]("span");
  ((_0x382f85["className"] = "model-service-provider-option-name"),
    (_0x382f85["textContent"] = getProviderLabel(_0x1bd64c["id"], _0x11126c)),
    _0x49de4f["append"](cloneProviderIcon(_0x1d7201, _0x11126c), _0x382f85),
    _0x68b445["appendChild"](_0x49de4f),
    (_0x1bd64c["button"] = _0x49de4f),
    (_0x1bd64c["buttonName"] = _0x382f85));
}
function createNavigatorController({
  documentObject: _0x30b0ae,
  browserEl: _0x4b23d5,
  pickerEl: _0x26c33e,
  detailsEl: _0x24aff7,
  groups: _0x56168d,
}) {
  let _0xa6b858 = "all",
    _0xcf43de = "",
    _0x15e4b8 = null;
  const _0x551c07 = [],
    _0x34aa96 = (_0x10d752) =>
      _0x10d752["cards"]["filter"]((_0x3f7fdd) =>
        isCardAvailable(_0x3f7fdd, _0x30b0ae),
      ),
    _0x461c16 = (_0x14ccf2, _0x1488a4) => {
      if (!_0x14ccf2) return;
      ((_0x14ccf2["textContent"] =
        _0x1488a4?.["text"] || t("settings.apiInput.readiness.requiredShort")),
        _0x14ccf2["classList"]["remove"](...PROVIDER_STATUS_CLASSES),
        _0x14ccf2["classList"]["add"](
          "settings-provider-status--" +
            (_0x1488a4?.["tone"] || "unconfigured"),
        ));
    },
    _0x27db0e = (_0x57b753) => {
      const _0x1b24f6 = _0x34aa96(_0x57b753),
        _0x858204 = _0x1b24f6["map"](readCardStatus)["filter"](Boolean),
        _0x1b9cf7 = aggregateModelServiceProviderStatus(_0x858204),
        _0x4a42f0 = String(
          _0x57b753["buttonName"]?.["textContent"] || _0x57b753["id"],
        )["trim"](),
        _0x407e8a =
          String(_0x1b9cf7?.["text"] || "")["trim"]() ||
          t("settings.apiInput.readiness.requiredShort");
      ((_0x57b753["button"]["dataset"]["modelServiceStatus"] =
        _0x1b9cf7?.["tone"] || "unconfigured"),
        (_0x57b753["button"]["dataset"]["tooltip"] =
          _0x4a42f0 + "：" + _0x407e8a),
        _0x57b753["button"]["setAttribute"](
          "aria-label",
          _0x4a42f0 + "，" + _0x407e8a,
        ),
        _0x57b753["button"]["classList"]["toggle"](
          "is-verified",
          _0x1b9cf7?.["tone"] === "success",
        ),
        _0x57b753["routeButtons"]["forEach"](
          ({ card: _0x9b168e, status: _0x561e3d }) => {
            _0x461c16(
              _0x561e3d,
              readCardStatus(_0x9b168e) || {
                text: t("settings.apiInput.readiness.requiredShort"),
                tone: "unconfigured",
              },
            );
          },
        ));
    },
    _0xed3ebc = (_0x409c38, _0x2f2f09 = "") => {
      if (!_0x409c38?.["routeButtons"]?.["size"]) return ![];
      const _0x2fcb5c = Array["from"](_0x409c38["routeButtons"]["entries"]())[
          "filter"
        ](([, _0x43f053]) => isCardAvailable(_0x43f053["card"], _0x30b0ae)),
        _0x46c9f1 =
          _0x2fcb5c["find"](([_0x1e1418]) => _0x1e1418 === _0x2f2f09) ||
          _0x2fcb5c["find"](
            ([_0xc37fec]) => _0xc37fec === _0x409c38["activeRouteId"],
          ) ||
          _0x2fcb5c[0x0];
      if (!_0x46c9f1) return ![];
      return (
        (_0x409c38["activeRouteId"] = _0x46c9f1[0x0]),
        _0x409c38["routeButtons"]["forEach"]((_0x50b179, _0x1fee89) => {
          const _0x3430d9 = _0x1fee89 === _0x409c38["activeRouteId"],
            _0x24d34e = isCardAvailable(_0x50b179["card"], _0x30b0ae);
          ((_0x50b179["button"]["hidden"] = !_0x24d34e),
            _0x50b179["button"]["classList"]["toggle"]("is-active", _0x3430d9),
            _0x50b179["button"]["setAttribute"](
              "aria-selected",
              _0x3430d9 ? "true" : "false",
            ),
            _0x50b179["card"]["classList"]["toggle"](
              "is-route-hidden",
              !_0x3430d9,
            ),
            _0x50b179["card"]["setAttribute"](
              "aria-hidden",
              _0x3430d9 ? "false" : "true",
            ));
        }),
        !![]
      );
    },
    _0x457ac3 = (_0x52d83b) =>
      _0x34aa96(_0x52d83b)["length"] > 0x0 &&
      modelServiceKindsMatchCategory(_0x52d83b["kinds"], _0xa6b858),
    _0x2325ee = () =>
      _0x56168d["find"]((_0x131220) => _0x457ac3(_0x131220)) || null,
    _0x4c002b = (_0x4611e3, _0x253551 = {}) => {
      const _0x180d77 = _0x56168d["find"](
        (_0x276649) => _0x276649["id"] === _0x4611e3,
      );
      if (!_0x180d77 || !_0x34aa96(_0x180d77)["length"]) return ![];
      !modelServiceKindsMatchCategory(_0x180d77["kinds"], _0xa6b858) &&
        _0xeff205("all", { preserveProvider: !![] });
      ((_0xcf43de = _0x180d77["id"]),
        _0x56168d["forEach"]((_0x1dcb83) => {
          const _0x299c8b = _0x1dcb83["id"] === _0xcf43de;
          ((_0x1dcb83["wrapper"]["hidden"] = !_0x299c8b),
            _0x1dcb83["button"]["classList"]["toggle"]("is-active", _0x299c8b),
            _0x1dcb83["button"]["setAttribute"](
              "aria-pressed",
              _0x299c8b ? "true" : "false",
            ));
        }),
        _0xed3ebc(_0x180d77, _0x253551["routeId"]));
      if (_0x253551["focusButton"]) _0x180d77["button"]["focus"]?.();
      return !![];
    },
    _0x2ff0f5 = () => {
      _0x56168d["forEach"]((_0x3e3b0b) => {
        ((_0x3e3b0b["button"]["hidden"] = !_0x457ac3(_0x3e3b0b)),
          _0x3e3b0b["routeButtons"]["forEach"](
            ({ button: _0x33fdbf, card: _0x53c234 }) => {
              _0x33fdbf["hidden"] = !isCardAvailable(_0x53c234, _0x30b0ae);
            },
          ),
          _0x27db0e(_0x3e3b0b));
      });
      if (_0x15e4b8) {
        _0x56168d["forEach"]((_0x40d96b) => {
          const _0x305219 = _0x34aa96(_0x40d96b)["filter"]((_0x11fa16) =>
            _0x15e4b8["has"](_0x11fa16),
          );
          ((_0x40d96b["wrapper"]["hidden"] = !_0x305219["length"]),
            _0x40d96b["cards"]["forEach"]((_0x25472d) => {
              const _0x581e87 = _0x305219["includes"](_0x25472d);
              (_0x25472d["classList"]["toggle"]("is-route-hidden", !_0x581e87),
                _0x25472d["setAttribute"](
                  "aria-hidden",
                  _0x581e87 ? "false" : "true",
                ));
            }));
        });
        return;
      }
      const _0x5398ec = _0x56168d["find"](
        (_0x2e7e92) => _0x2e7e92["id"] === _0xcf43de,
      );
      if (!_0x5398ec || !_0x457ac3(_0x5398ec)) {
        const _0xe47c42 = _0x2325ee();
        if (_0xe47c42) _0x4c002b(_0xe47c42["id"]);
        return;
      }
      _0xed3ebc(_0x5398ec, _0x5398ec["activeRouteId"]);
    };
  function _0xeff205(_0x455533, _0x27391e = {}) {
    const _0x94b719 = MODEL_SERVICE_CATEGORY_SET["has"](_0x455533)
      ? _0x455533
      : "all";
    ((_0xa6b858 = _0x94b719),
      _0x4b23d5["querySelectorAll"]?.("[data-model-service-category]")?.[
        "forEach"
      ]((_0x3a0f8e) => {
        const _0x2c72f3 =
          _0x3a0f8e["dataset"]["modelServiceCategory"] === _0xa6b858;
        (_0x3a0f8e["classList"]["toggle"]("is-active", _0x2c72f3),
          _0x3a0f8e["setAttribute"](
            "aria-pressed",
            _0x2c72f3 ? "true" : "false",
          ));
      }),
      _0x56168d["forEach"]((_0x48fd45) => {
        _0x48fd45["button"]["hidden"] = !_0x457ac3(_0x48fd45);
      }));
    const _0x25c118 = _0x56168d["find"](
      (_0x234149) => _0x234149["id"] === _0xcf43de,
    );
    if (
      !_0x27391e["preserveProvider"] &&
      (!_0x25c118 || !_0x457ac3(_0x25c118))
    ) {
      const _0x5cad76 = _0x2325ee();
      if (_0x5cad76) _0x4c002b(_0x5cad76["id"]);
    }
  }
  const _0x2fdada = (_0x3edb5c) => {
    const _0x267819 = _0x3edb5c?.["closest"]?.("[data-model-service-provider]");
    if (!_0x267819) return ![];
    const _0x113c7d = String(
        _0x267819["dataset"]["modelServiceProvider"] || "",
      )["trim"](),
      _0x42a6d4 = String(_0x267819["dataset"]["modelServiceRoute"] || "")[
        "trim"
      ](),
      _0xb2a5e4 = _0x56168d["find"](
        (_0x341576) => _0x341576["id"] === _0x113c7d,
      );
    if (!_0xb2a5e4) return ![];
    return (
      !modelServiceKindsMatchCategory(_0xb2a5e4["kinds"], _0xa6b858) &&
        _0xeff205("all", { preserveProvider: !![] }),
      _0x4c002b(_0x113c7d, { routeId: _0x42a6d4 })
    );
  };
  (_0x4b23d5["querySelectorAll"]?.("[data-model-service-category]")?.[
    "forEach"
  ]((_0x501dd7) => {
    (_0x501dd7["addEventListener"]("click", () => {
      _0xeff205(_0x501dd7["dataset"]["modelServiceCategory"] || "all");
    }),
      _0x501dd7["addEventListener"]("keydown", (_0x1b94e8) => {
        if (
          !["ArrowLeft", "ArrowRight", "Home", "End"]["includes"](
            _0x1b94e8["key"],
          )
        )
          return;
        const _0x1dd37f = Array["from"](
            _0x4b23d5["querySelectorAll"]("[data-model-service-category]"),
          ),
          _0x4b063b = Math["max"](0x0, _0x1dd37f["indexOf"](_0x501dd7)),
          _0xa27aa7 =
            _0x1b94e8["key"] === "Home"
              ? 0x0
              : _0x1b94e8["key"] === "End"
                ? _0x1dd37f["length"] - 0x1
                : (_0x4b063b +
                    (_0x1b94e8["key"] === "ArrowRight" ? 0x1 : -0x1) +
                    _0x1dd37f["length"]) %
                  _0x1dd37f["length"];
        (_0x1b94e8["preventDefault"](),
          _0x1dd37f[_0xa27aa7]?.["focus"]?.(),
          _0x1dd37f[_0xa27aa7]?.["click"]?.());
      }));
  }),
    _0x56168d["forEach"]((_0x95874c) => {
      (_0x95874c["button"]["addEventListener"]("click", () => {
        _0x4c002b(_0x95874c["id"]);
      }),
        _0x95874c["routeButtons"]["forEach"](
          ({ button: _0x1f119f }, _0x58badd) => {
            _0x1f119f["addEventListener"]("click", () =>
              _0xed3ebc(_0x95874c, _0x58badd),
            );
          },
        ));
      if (typeof globalThis["MutationObserver"] === "function") {
        const _0x4cc65c = new globalThis["MutationObserver"](() => {
          _0x2ff0f5();
        });
        (_0x95874c["cards"]["forEach"]((_0xac0f9c) => {
          _0x4cc65c["observe"](_0xac0f9c, {
            attributes: !![],
            attributeFilter: ["hidden", "class"],
            childList: !![],
            subtree: !![],
            characterData: !![],
          });
        }),
          _0x551c07["push"](_0x4cc65c));
      }
    }));
  if (
    typeof globalThis["MutationObserver"] === "function" &&
    _0x30b0ae["body"]
  ) {
    const _0x5472cb = new globalThis["MutationObserver"](_0x2ff0f5);
    (_0x5472cb["observe"](_0x30b0ae["body"], {
      attributes: !![],
      attributeFilter: ["class"],
    }),
      _0x551c07["push"](_0x5472cb));
  }
  const _0x5d2f20 = onLocaleChange(() => {
    globalThis["queueMicrotask"]?.(() => {
      _0x56168d["forEach"]((_0x27b9cb) => {
        ((_0x27b9cb["buttonName"]["textContent"] = getProviderLabel(
          _0x27b9cb["id"],
          _0x27b9cb["cards"][0x0],
        )),
          _0x27b9cb["routeButtons"]["forEach"](
            ({ card: _0x910076, name: _0x11d8dc }, _0x3a0431) => {
              _0x11d8dc["textContent"] = getRouteLabel(_0x3a0431, _0x910076);
            },
          ),
          _0x27db0e(_0x27b9cb));
      });
    });
  });
  _0x2ff0f5();
  const _0x9235c = _0x2325ee();
  if (_0x9235c) _0x4c002b(_0x9235c["id"]);
  return (
    _0x4b23d5["classList"]["add"]("is-enhanced"),
    {
      activateProvider: _0x4c002b,
      activateRoute: _0xed3ebc,
      revealField: _0x2fdada,
      setCategory: _0xeff205,
      setSearchCards(_0x21430c) {
        ((_0x15e4b8 = _0x21430c === null ? null : new Set(_0x21430c)),
          !_0x15e4b8 &&
            _0x56168d["forEach"]((_0xf5c26a) => {
              (_0xf5c26a["cards"]["forEach"]((_0x27f740) => {
                (_0x27f740["classList"]["remove"]("is-route-hidden"),
                  _0x27f740["removeAttribute"]("aria-hidden"));
              }),
                _0xed3ebc(_0xf5c26a, _0xf5c26a["activeRouteId"]),
                (_0xf5c26a["wrapper"]["hidden"] =
                  _0xf5c26a["id"] !== _0xcf43de));
            }),
          _0x2ff0f5());
      },
      sync: _0x2ff0f5,
      destroy() {
        (_0x551c07["forEach"]((_0x865956) => _0x865956["disconnect"]?.()),
          _0x5d2f20?.());
        if (activeNavigator === this) activeNavigator = null;
      },
    }
  );
}
export function initModelServiceSettingsNavigator(
  _0x5238aa = globalThis["document"],
) {
  if (!_0x5238aa?.["getElementById"]) return null;
  const _0x4ca84a = _0x5238aa["getElementById"]("modelServiceBrowser"),
    _0x3327ba = _0x5238aa["getElementById"]("modelServiceProviderPicker"),
    _0x16a1ce = _0x5238aa["getElementById"]("modelServiceProviderDetails");
  if (!_0x4ca84a || !_0x3327ba || !_0x16a1ce) return null;
  if (activeNavigator) return activeNavigator;
  const _0x2122a0 = Array["from"](
      _0x5238aa["querySelectorAll"]?.("[data-model-service-provider]") || [],
    ),
    _0x571165 = new Map();
  _0x2122a0["forEach"]((_0x2ef320) => {
    const _0x93f839 = String(
      _0x2ef320["dataset"]["modelServiceProvider"] || "",
    )["trim"]();
    if (!_0x93f839) return;
    const _0x590ffa = _0x571165["get"](_0x93f839) || [];
    (_0x590ffa["push"](_0x2ef320), _0x571165["set"](_0x93f839, _0x590ffa));
  });
  const _0x1a80ff = Array["from"](_0x571165["entries"]())["map"](
    ([_0x5d3c1b, _0x53d09e]) =>
      createProviderGroup(_0x5238aa, _0x5d3c1b, _0x53d09e, _0x16a1ce),
  );
  return (
    _0x1a80ff["forEach"]((_0x447f6e) =>
      createProviderButton(_0x5238aa, _0x447f6e, _0x3327ba),
    ),
    (activeNavigator = createNavigatorController({
      documentObject: _0x5238aa,
      browserEl: _0x4ca84a,
      pickerEl: _0x3327ba,
      detailsEl: _0x16a1ce,
      groups: _0x1a80ff,
    })),
    activeNavigator
  );
}
export function revealModelServiceSettingsField(_0x1ff350) {
  return activeNavigator?.["revealField"]?.(_0x1ff350) || ![];
}
export function setModelServiceSettingsSearchCards(_0xdaf99f) {
  activeNavigator?.["setSearchCards"](_0xdaf99f);
}
