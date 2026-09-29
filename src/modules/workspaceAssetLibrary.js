import {
  getAssetMentionCandidates,
  getAssetMentionLibrarySettings,
} from "./assetMentionRegistry.js";
import {
  DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
  getMaterialFolderAssetCounts,
  getMaterialLibraryGroups,
  normalizeMaterialFolderParents,
} from "./materialLibraryPolicy.js";
const MEDIA_LABELS = Object["freeze"]({
  image: "图片",
  video: "视频",
  audio: "音频",
  text: "文本",
});
function normalizeText(_0x21f09d) {
  return String(_0x21f09d ?? "")["trim"]();
}
function normalizeCategoryKey(_0x33896b) {
  return normalizeText(_0x33896b)["toLocaleLowerCase"]();
}
function escapeHtml(_0x384aa6) {
  return String(_0x384aa6 ?? "")
    ["replaceAll"]("&", "&amp;")
    ["replaceAll"]("<", "&lt;")
    ["replaceAll"](">", "&gt;")
    ["replaceAll"]("\x22", "&quot;")
    ["replaceAll"]("\x27", "&#39;");
}
function resolveAssetCategory(_0x4ee553 = {}) {
  return (
    normalizeText(_0x4ee553["category"] || _0x4ee553["assetCategory"]) || "其他"
  );
}
function formatCategoryLabel(_0x5d8a16) {
  return normalizeText(_0x5d8a16) === "Others"
    ? "其他"
    : normalizeText(_0x5d8a16);
}
function createCategoryValueMap(_0xf9cc93 = {}) {
  return new Map(
    Object["entries"](
      _0xf9cc93 && typeof _0xf9cc93 === "object" ? _0xf9cc93 : {},
    )
      ["map"](([_0x36ded5, _0xc1b715]) => [
        normalizeCategoryKey(_0x36ded5),
        normalizeText(_0xc1b715),
      ])
      ["filter"](([_0x2d2c76, _0x5eacfa]) => _0x2d2c76 && _0x5eacfa),
  );
}
function activateWorkspaceAssetLibraryImages(_0x573cbe) {
  _0x573cbe?.["querySelectorAll"]?.(
    ":scope > .workspace-asset-library-grid [data-workspace-asset-library-image]",
  )?.["forEach"]?.((_0x19285f) => {
    _0x19285f["loading"] = "eager";
  });
}
export function handleWorkspaceAssetLibraryImageError(_0x31878b) {
  const _0x2afa5e = _0x31878b?.["target"],
    _0x34d8c2 = normalizeText(
      _0x2afa5e?.["getAttribute"]?.(
        "data-workspace-asset-library-fallback-src",
      ),
    );
  if (!_0x34d8c2) return ![];
  _0x2afa5e["removeAttribute"]?.("data-workspace-asset-library-fallback-src");
  if (normalizeText(_0x2afa5e["getAttribute"]?.("src")) === _0x34d8c2)
    return ![];
  return (
    (_0x2afa5e["loading"] = "eager"),
    _0x2afa5e["setAttribute"]?.("src", _0x34d8c2),
    !![]
  );
}
export function getWorkspaceAssetLibraryMediaLabel(_0x52c7b3) {
  return (
    MEDIA_LABELS[normalizeText(_0x52c7b3)["toLocaleLowerCase"]()] || "素材"
  );
}
export function buildWorkspaceAssetLibraryItems({
  allowedTypes: allowedTypes = ["image"],
  limit: limit = 0x0,
} = {}) {
  const _0xf0035f = getAssetMentionCandidates({ allowedTypes: allowedTypes }),
    _0x6c2782 =
      Number(limit) > 0x0
        ? _0xf0035f["slice"](0x0, Math["trunc"](Number(limit)))
        : _0xf0035f;
  return _0x6c2782["map"]((_0x38f974) => {
    const _0xf1fd2e = normalizeText(_0x38f974["thumbUrl"]),
      _0x208369 = normalizeText(_0x38f974["url"]) || _0xf1fd2e,
      _0x3e09bd =
        normalizeText(_0x38f974["category"] || _0x38f974["assetCategory"]) ||
        "其他";
    return {
      id: "library-" + _0x38f974["assetId"] + "-" + _0x38f974["itemIndex"],
      sourceAssetId: _0x38f974["assetId"],
      sourceItemIndex: _0x38f974["itemIndex"],
      kind: "library",
      mediaKind: _0x38f974["type"],
      category: _0x3e09bd,
      assetCategory: _0x3e09bd,
      name: _0x38f974["name"] || _0x38f974["assetName"] || "素材",
      assetName: _0x38f974["assetName"] || "未分组素材",
      role: getWorkspaceAssetLibraryMediaLabel(_0x38f974["type"]) + "素材",
      occurrences: "来自总素材",
      description: _0x38f974["assetName"]
        ? "来自素材组「" + _0x38f974["assetName"] + "」"
        : "来自总素材",
      prompt: "",
      imageUrl: _0x208369,
      thumbnailUrl: _0xf1fd2e,
      sourceUrl: _0x208369,
      isLibraryAsset: !![],
    };
  });
}
export function buildWorkspaceAssetLibraryHierarchy({
  assets: assets = [],
  categories: categories = null,
  displayNames: displayNames = null,
  parents: parents = null,
} = {}) {
  const _0x19ee41 = getAssetMentionLibrarySettings(),
    _0x5b2d13 = Array["isArray"](categories)
      ? categories
      : _0x19ee41["categories"],
    _0x5979ae =
      displayNames && typeof displayNames === "object"
        ? displayNames
        : _0x19ee41["displayNames"],
    _0xddfc37 =
      parents && typeof parents === "object" ? parents : _0x19ee41["parents"],
    _0x79785f = (Array["isArray"](assets) ? assets : [])["map"](
      (_0x288de2) => ({
        ..._0x288de2,
        category: resolveAssetCategory(_0x288de2),
      }),
    ),
    _0x1a8c13 = getMaterialLibraryGroups({
      assets: _0x79785f,
      categories: _0x5b2d13["length"]
        ? _0x5b2d13
        : DEFAULT_MATERIAL_LIBRARY_CATEGORIES,
      categoryKey: normalizeCategoryKey,
    }),
    _0x307c54 = normalizeMaterialFolderParents({
      parents: _0xddfc37,
      userCategories: Object["keys"](_0xddfc37 || {}),
      allCategories: _0x1a8c13["map"]((_0x35e625) => _0x35e625["category"]),
      categoryKey: normalizeCategoryKey,
    }),
    _0x51aae1 = createCategoryValueMap(_0x307c54),
    _0x4271b6 = createCategoryValueMap(_0x5979ae),
    _0x38ec66 = getMaterialFolderAssetCounts({
      groups: _0x1a8c13,
      parents: _0x307c54,
      categoryKey: normalizeCategoryKey,
    }),
    _0x210109 = _0x1a8c13["map"]((_0x13bae2) => {
      const _0x420df9 = resolveAssetCategory(_0x13bae2),
        _0x41ffc8 = normalizeCategoryKey(_0x420df9);
      return {
        category: _0x420df9,
        label: _0x4271b6["get"](_0x41ffc8) || formatCategoryLabel(_0x420df9),
        count: _0x38ec66["get"](_0x41ffc8) ?? _0x13bae2["assets"]["length"],
        assets: _0x13bae2["assets"],
        children: [],
      };
    }),
    _0x232a0f = new Map(
      _0x210109["map"]((_0xaf7f6c) => [
        normalizeCategoryKey(_0xaf7f6c["category"]),
        _0xaf7f6c,
      ]),
    ),
    _0x3beb88 = [];
  _0x210109["forEach"]((_0x1dee5c) => {
    const _0x5a6d09 = _0x232a0f["get"](
      normalizeCategoryKey(
        _0x51aae1["get"](normalizeCategoryKey(_0x1dee5c["category"])),
      ),
    );
    if (_0x5a6d09 && _0x5a6d09 !== _0x1dee5c)
      _0x5a6d09["children"]["push"](_0x1dee5c);
    else _0x3beb88["push"](_0x1dee5c);
  });
  const _0x153e8e = (_0x741ac2) => {
    return (
      (_0x741ac2["children"] = _0x741ac2["children"]["filter"](_0x153e8e)),
      _0x741ac2["assets"]["length"] > 0x0 ||
        _0x741ac2["children"]["length"] > 0x0
    );
  };
  return _0x3beb88["filter"](_0x153e8e);
}
export function getWorkspaceAssetLibrarySelectionOrder(_0x3b42d1, _0x3c91a3) {
  const _0x536374 = (_0x1172a5) =>
    _0x1172a5["flatMap"]((_0x30c64d) =>
      _0x3c91a3?.["isExpanded"](_0x30c64d["category"])
        ? [
            ..._0x536374(_0x30c64d["children"]),
            ..._0x30c64d["assets"]["map"]((_0x8a6774) => _0x8a6774["id"]),
          ]
        : [],
    );
  return _0x536374(buildWorkspaceAssetLibraryHierarchy({ assets: _0x3b42d1 }));
}
export function renderWorkspaceAssetLibraryGroups({
  assets: assets = [],
  expandedCategories: expandedCategories = [],
  renderAsset: renderAsset = () => "",
} = {}) {
  const _0x12f43b = new Set(
      (Array["isArray"](expandedCategories) ? expandedCategories : [])
        ["map"](normalizeCategoryKey)
        ["filter"](Boolean),
    ),
    _0x57bb86 = buildWorkspaceAssetLibraryHierarchy({ assets: assets });
  if (!_0x57bb86["length"]) return "";
  const _0x2103fb = (_0x53fac1, _0x5e43d0 = 0x0) => {
    const _0x3cfc5a = _0x53fac1["category"],
      _0x2af28c = escapeHtml(_0x3cfc5a),
      _0x40cb75 = _0x12f43b["has"](normalizeCategoryKey(_0x3cfc5a)),
      _0x3e52bc = _0x53fac1["children"]
        ["map"]((_0x2b4362) => _0x2103fb(_0x2b4362, _0x5e43d0 + 0x1))
        ["join"](""),
      _0x18d9c2 = _0x53fac1["assets"]["length"]
        ? '<div class="story-asset-grid workspace-asset-library-grid">' +
          _0x53fac1["assets"]["map"](renderAsset)["join"]("") +
          "</div>"
        : "";
    return (
      "<section\x20class=\x22v2-material-folder\x20workspace-asset-library-group" +
      (_0x5e43d0 > 0x0 ? " is-nested" : "") +
      "\x22\x20data-workspace-asset-library-category=\x22" +
      _0x2af28c +
      '" role="treeitem" aria-level="' +
      (_0x5e43d0 + 0x1) +
      "\x22\x20aria-expanded=\x22" +
      _0x40cb75 +
      '">\n      <div class="v2-material-folder-row workspace-asset-library-folder-row">\n        <button type="button" class="v2-material-folder-toggle workspace-asset-library-folder-toggle" data-workspace-asset-library-toggle="' +
      _0x2af28c +
      '" aria-expanded="' +
      _0x40cb75 +
      "\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22v2-material-tree-chevron" +
      (_0x40cb75 ? " is-open" : "") +
      '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>\n          <span class="v2-material-folder-icon" aria-hidden="true"><svg viewBox="0 0 28 24"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H11l2.4 2.5h10.1A2.5 2.5 0 0 1 26 8v11.5a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 2 19.5v-14Z" fill="currentColor"/></svg></span>\n          <span class="v2-material-folder-name">' +
      escapeHtml(_0x53fac1["label"]) +
      '</span>\n        </button>\n        <span class="v2-material-folder-count">' +
      _0x53fac1["count"] +
      "</span>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-material-folder-content\x20workspace-asset-library-category-content\x22\x20data-workspace-asset-library-category-content=\x22" +
      _0x2af28c +
      "\x22\x20role=\x22group\x22\x20aria-hidden=\x22" +
      !_0x40cb75 +
      "\x22" +
      (_0x40cb75 ? "" : " hidden") +
      ">\n        " +
      _0x3e52bc +
      _0x18d9c2 +
      "\n      </div>\n    </section>"
    );
  };
  return (
    '<div class="workspace-asset-library-groups" data-workspace-asset-library-groups role="tree" aria-label="总素材分类">\n    ' +
    _0x57bb86["map"]((_0x2ef129) => _0x2103fb(_0x2ef129))["join"]("") +
    "\n  </div>"
  );
}
export function createWorkspaceAssetLibraryDisclosure({
  expandedCategories: expandedCategories = [],
} = {}) {
  const _0x116e94 = new Set(
      (Array["isArray"](expandedCategories) ? expandedCategories : [])
        ["map"](normalizeCategoryKey)
        ["filter"](Boolean),
    ),
    _0x29cc6d = new Map(),
    _0x1e43bc = (_0x2613c6) =>
      _0x116e94["has"](normalizeCategoryKey(_0x2613c6)),
    _0x421b05 = (_0x507016) => {
      const _0x1c85a9 = normalizeText(_0x507016),
        _0x12550f = normalizeCategoryKey(_0x1c85a9);
      if (!_0x12550f) return ![];
      _0x29cc6d["set"](_0x12550f, _0x1c85a9);
      if (_0x116e94["has"](_0x12550f)) _0x116e94["delete"](_0x12550f);
      else _0x116e94["add"](_0x12550f);
      return _0x116e94["has"](_0x12550f);
    };
  return {
    getExpandedCategories: () =>
      [..._0x116e94]["map"](
        (_0x1ec2ea) => _0x29cc6d["get"](_0x1ec2ea) || _0x1ec2ea,
      ),
    isExpanded: _0x1e43bc,
    toggle: _0x421b05,
    toggleFromTarget(_0x12d8d9) {
      const _0xcb5852 = _0x12d8d9?.["closest"]?.(
        "[data-workspace-asset-library-toggle]",
      );
      if (!_0xcb5852) return ![];
      const _0x30c2ca = _0xcb5852["dataset"]?.["workspaceAssetLibraryToggle"],
        _0x974f36 = _0x421b05(_0x30c2ca),
        _0x31bf21 = _0xcb5852["closest"]?.(
          "[data-workspace-asset-library-category]",
        ),
        _0x493913 = _0x31bf21?.["querySelector"]?.(
          "[data-workspace-asset-library-category-content]",
        );
      (_0x31bf21?.["setAttribute"]?.("aria-expanded", String(_0x974f36)),
        _0xcb5852["setAttribute"]?.("aria-expanded", String(_0x974f36)),
        _0xcb5852["querySelector"]?.(".v2-material-tree-chevron")?.[
          "classList"
        ]?.["toggle"]?.("is-open", _0x974f36));
      if (_0x493913) {
        ((_0x493913["hidden"] = !_0x974f36),
          _0x493913["setAttribute"]?.("aria-hidden", String(!_0x974f36)));
        if (_0x974f36) activateWorkspaceAssetLibraryImages(_0x493913);
      }
      return !![];
    },
    render(_0x55e469 = {}) {
      return renderWorkspaceAssetLibraryGroups({
        ..._0x55e469,
        expandedCategories: [..._0x116e94],
      });
    },
  };
}
