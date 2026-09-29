import { resolveGenerationInputImageUrl } from "../services/imageReferenceUrlService.js";
import {
  resolveCanvasAudioUrl,
  resolveCanvasVideoUrl,
} from "../services/canvasMediaLocalService.js";
import { localPathToUrl } from "../utils/localMediaPath.js";
import { resolveEffectiveInputKind } from "./modelInputPolicy.js";
const TYPE_LABELS = Object.freeze({
  text: "文本",
  image: "图片",
  video: "视频",
  audio: "音频",
});
let _assetMentionRefs = [],
  _assetMentionRefMap = new Map(),
  _assetMentionRegistryRevision = 0;
const _assetMentionRegistryListeners = new Set();
let _assetMentionLibrarySettings = {
  categories: [],
  displayNames: {},
  parents: {},
};
function normalizeText(_0x526ca6) {
  return String(_0x526ca6 || "").trim();
}
function normalizeAssetType(_0xc43189) {
  const _0x5b90ac = normalizeText(_0xc43189).toLowerCase();
  if (!_0x5b90ac) return "";
  if (
    _0x5b90ac === "text" ||
    _0x5b90ac === "source-text" ||
    _0x5b90ac === "ai-text"
  )
    return "text";
  if (
    _0x5b90ac === "image" ||
    _0x5b90ac === "source-image" ||
    _0x5b90ac === "ai-image"
  )
    return "image";
  if (
    _0x5b90ac === "video" ||
    _0x5b90ac === "source-video" ||
    _0x5b90ac === "ai-video"
  )
    return "video";
  if (
    _0x5b90ac === "audio" ||
    _0x5b90ac === "source-audio" ||
    _0x5b90ac === "ai-audio"
  )
    return "audio";
  if (_0x5b90ac.includes("text")) return "text";
  if (_0x5b90ac.includes("video")) return "video";
  if (_0x5b90ac.includes("audio")) return "audio";
  if (_0x5b90ac.includes("image")) return "image";
  return "";
}
function normalizeCategoryList(_0x44b1ed) {
  const _0x2dba39 = [],
    _0x1376a8 = new Set();
  for (const _0x120e53 of Array.isArray(_0x44b1ed) ? _0x44b1ed : []) {
    const _0x411a47 = normalizeText(_0x120e53),
      _0x4152b4 = _0x411a47.toLocaleLowerCase();
    if (!_0x411a47 || _0x1376a8.has(_0x4152b4)) continue;
    (_0x1376a8.add(_0x4152b4), _0x2dba39.push(_0x411a47));
  }
  return _0x2dba39;
}
function normalizeCategoryRecord(_0x2a49b4) {
  const _0x16aaa1 = {};
  for (const [_0x168b23, _0x26efdb] of Object.entries(
    _0x2a49b4 && typeof _0x2a49b4 === "object" ? _0x2a49b4 : {},
  )) {
    const _0x28fe16 = normalizeText(_0x168b23),
      _0x2dd46a = normalizeText(_0x26efdb);
    if (_0x28fe16 && _0x2dd46a) _0x16aaa1[_0x28fe16] = _0x2dd46a;
  }
  return _0x16aaa1;
}
function areLibrarySettingsEqual(_0x12a88c, _0x46371f) {
  if (_0x12a88c.categories.length !== _0x46371f.categories.length) return false;
  if (
    _0x12a88c.categories.some(
      (_0x361720, _0x25b648) => _0x361720 !== _0x46371f.categories[_0x25b648],
    )
  )
    return false;
  const _0x279309 = (_0x79e7f1, _0x2b73ef) => {
    const _0x2adc84 = Object.entries(_0x79e7f1).sort(
        ([_0xc1ab95], [_0x146cff]) => _0xc1ab95.localeCompare(_0x146cff),
      ),
      _0x43f417 = Object.entries(_0x2b73ef).sort(([_0x1b754b], [_0x1acd37]) =>
        _0x1b754b.localeCompare(_0x1acd37),
      );
    return (
      _0x2adc84.length === _0x43f417.length &&
      _0x2adc84.every(
        ([_0x33c8ae, _0x392c3c], _0x20c969) =>
          _0x33c8ae === _0x43f417[_0x20c969]?.[0] &&
          _0x392c3c === _0x43f417[_0x20c969]?.[1],
      )
    );
  };
  return (
    _0x279309(_0x12a88c.displayNames, _0x46371f.displayNames) &&
    _0x279309(_0x12a88c.parents, _0x46371f.parents)
  );
}
function toUsableUrl(_0x37f919) {
  const _0x43f15b = normalizeText(_0x37f919);
  if (!_0x43f15b) return "";
  if (/^(?:https?:|blob:|data:|\/)/i.test(_0x43f15b)) return _0x43f15b;
  if (/^[a-z][a-z0-9+.-]*:/i.test(_0x43f15b)) return "";
  return localPathToUrl(_0x43f15b) || "/" + _0x43f15b.replace(/^\/+/, "");
}
function firstUsableUrl(..._0x59bbc8) {
  for (const _0x4971ed of _0x59bbc8) {
    const _0x449099 = toUsableUrl(_0x4971ed);
    if (_0x449099) return _0x449099;
  }
  return "";
}
function pickResultItem(_0x1194fd, _0x2aeb38) {
  if (!Array.isArray(_0x1194fd) || _0x1194fd.length === 0) return null;
  const _0x488765 = Number(_0x2aeb38),
    _0x4b9346 = Number.isFinite(_0x488765)
      ? Math.max(0, Math.trunc(_0x488765))
      : 0;
  return _0x1194fd[Math.min(_0x4b9346, _0x1194fd.length - 1)] || null;
}
function getTextContent(_0x11c2e0 = {}, _0x1dd12e = {}) {
  return normalizeText(
    _0x11c2e0.outputText ||
      _0x11c2e0.text ||
      _0x11c2e0.content ||
      _0x11c2e0.prompt ||
      _0x1dd12e.text ||
      _0x1dd12e.content ||
      _0x1dd12e.prompt ||
      _0x11c2e0.label ||
      _0x1dd12e.name,
  );
}
function resolveRefUrl(_0x25ef83, _0x2fd6c6 = {}, _0x56c80f = {}) {
  if (_0x25ef83 === "image")
    return (
      resolveGenerationInputImageUrl(_0x2fd6c6) ||
      firstUsableUrl(
        _0x56c80f.url,
        _0x56c80f.src,
        _0x56c80f.thumbSrc,
        _0x2fd6c6.originalLocalPath,
        _0x2fd6c6.localPath,
        _0x2fd6c6.imageUrl,
        _0x2fd6c6.sourceUrl,
        _0x2fd6c6.src,
        _0x2fd6c6.url,
        _0x2fd6c6.thumbUrl,
      )
    );
  if (_0x25ef83 === "video") {
    const _0x5b2209 = pickResultItem(
      _0x2fd6c6.videos,
      _0x2fd6c6.mainVideoIndex,
    );
    return (
      resolveCanvasVideoUrl(_0x2fd6c6) ||
      firstUsableUrl(
        _0x56c80f.url,
        _0x56c80f.src,
        _0x2fd6c6.localPath,
        _0x2fd6c6.videoUrl,
        _0x2fd6c6.src,
        _0x2fd6c6.url,
        _0x5b2209?.localPath,
        _0x5b2209?.videoUrl,
      )
    );
  }
  if (_0x25ef83 === "audio")
    return (
      resolveCanvasAudioUrl(_0x2fd6c6) ||
      firstUsableUrl(
        _0x56c80f.url,
        _0x56c80f.src,
        _0x2fd6c6.localPath,
        _0x2fd6c6.audioUrl,
        _0x2fd6c6.src,
        _0x2fd6c6.url,
      )
    );
  return "";
}
function resolveThumbUrl(_0x1e8d54, _0x157a47 = {}, _0x861618 = {}) {
  const _0x365ba6 = firstUsableUrl(
    _0x861618.thumbSrc,
    _0x861618.thumbUrl,
    _0x861618.thumbnailUrl,
    _0x861618.coverUrl,
    _0x157a47.thumbLocalPath,
    _0x157a47.thumbUrl,
    _0x157a47.thumbnailUrl,
    _0x157a47.coverUrl,
    _0x157a47.displayLocalPath,
  );
  if (_0x365ba6 || (_0x1e8d54 !== "image" && _0x1e8d54 !== "video"))
    return _0x365ba6;
  return firstUsableUrl(
    _0x1e8d54 === "image" ? _0x157a47.originalLocalPath : "",
    _0x1e8d54 === "image" ? _0x157a47.localPath : "",
    _0x1e8d54 === "image" ? _0x157a47.imageUrl : "",
  );
}
function buildAssetMentionRefs(_0x46b7f6) {
  if (!_0x46b7f6 || typeof _0x46b7f6 !== "object") return [];
  const _0x4f7383 = normalizeText(_0x46b7f6.id);
  if (!_0x4f7383) return [];
  const _0x2460aa = Array.isArray(_0x46b7f6.items),
    _0x3ccab0 = Array.isArray(_0x46b7f6.nodes);
  if (!_0x2460aa && !_0x3ccab0) return [];
  const _0x68278f = _0x2460aa
      ? _0x46b7f6.items
      : _0x46b7f6.nodes.map((_0x39a016) => ({
          nodeData: _0x39a016,
          type: _0x39a016?.type,
        })),
    _0x26b943 = normalizeText(_0x46b7f6.name),
    _0x17b1b4 = normalizeText(_0x46b7f6.category),
    _0x5481d8 = [];
  return (
    _0x68278f.forEach((_0xe0dda1, _0x4f26ff) => {
      if (!_0xe0dda1 || typeof _0xe0dda1 !== "object") return;
      const _0x1b8e46 =
          _0xe0dda1.nodeData && typeof _0xe0dda1.nodeData === "object"
            ? _0xe0dda1.nodeData
            : _0xe0dda1,
        _0x5afc35 =
          resolveEffectiveInputKind(_0x1b8e46) ||
          normalizeAssetType(_0xe0dda1.type || _0x1b8e46.type);
      if (!_0x5afc35) return;
      const _0x58c265 =
          normalizeText(_0xe0dda1.name || _0x1b8e46.name || _0x1b8e46.label) ||
          _0x26b943 ||
          "" + (TYPE_LABELS[_0x5afc35] || "素材") + (_0x4f26ff + 1),
        _0x26042f =
          _0x5afc35 === "text" ? getTextContent(_0x1b8e46, _0xe0dda1) : "",
        _0x47d103 =
          _0x5afc35 === "text"
            ? ""
            : resolveRefUrl(_0x5afc35, _0x1b8e46, _0xe0dda1),
        _0x14a003 = resolveThumbUrl(_0x5afc35, _0x1b8e46, _0xe0dda1);
      if (_0x5afc35 === "text" ? !_0x26042f : !_0x47d103) return;
      _0x5481d8.push({
        origin: "asset",
        assetId: _0x4f7383,
        assetName: _0x26b943,
        category: _0x17b1b4,
        assetCategory: _0x17b1b4,
        itemIndex: _0x4f26ff,
        type: _0x5afc35,
        name: _0x58c265,
        label: _0x58c265,
        insertLabel: _0x58c265,
        content: _0x26042f,
        url: _0x47d103,
        thumbUrl: _0x14a003,
        nodeData: _0x1b8e46,
      });
    }),
    _0x5481d8
  );
}
function notifyRegistryChange() {
  ((_assetMentionRegistryRevision += 1),
    _assetMentionRegistryListeners.forEach((_0x4add17) => {
      try {
        _0x4add17(_assetMentionRegistryRevision);
      } catch (_0x5c775c) {
        console.warn("[assetMentionRegistry] listener failed", _0x5c775c);
      }
    }));
  if (
    typeof window !== "undefined" &&
    typeof window.dispatchEvent === "function"
  )
    try {
      window.dispatchEvent(
        new CustomEvent("asset-mention-registry-change", {
          detail: { revision: _assetMentionRegistryRevision },
        }),
      );
    } catch {}
}
function rebuildIndex(_0x3886ef) {
  ((_assetMentionRefs = Array.isArray(_0x3886ef) ? _0x3886ef : []),
    (_assetMentionRefMap = new Map()),
    _assetMentionRefs.forEach((_0x3a6535) => {
      _assetMentionRefMap.set(
        _0x3a6535.assetId + ":" + _0x3a6535.itemIndex,
        _0x3a6535,
      );
    }),
    notifyRegistryChange());
}
export function getAssetMentionRegistryRevision() {
  return _assetMentionRegistryRevision;
}
export function getAssetMentionLibrarySettings() {
  return {
    categories: [..._assetMentionLibrarySettings.categories],
    displayNames: { ..._assetMentionLibrarySettings.displayNames },
    parents: { ..._assetMentionLibrarySettings.parents },
  };
}
export function setAssetMentionLibrarySettings({
  categories: categories = [],
  displayNames: displayNames = {},
  parents: parents = {},
} = {}) {
  const _0x1919f6 = {
    categories: normalizeCategoryList(categories),
    displayNames: normalizeCategoryRecord(displayNames),
    parents: normalizeCategoryRecord(parents),
  };
  if (areLibrarySettingsEqual(_assetMentionLibrarySettings, _0x1919f6))
    return false;
  return (
    (_assetMentionLibrarySettings = _0x1919f6),
    notifyRegistryChange(),
    true
  );
}
export function subscribeAssetMentionRegistry(_0x149c42) {
  if (typeof _0x149c42 !== "function") return () => {};
  return (
    _assetMentionRegistryListeners.add(_0x149c42),
    () => {
      _assetMentionRegistryListeners.delete(_0x149c42);
    }
  );
}
export function setAssetMentionAssets(_0x1f7ce5 = []) {
  const _0x13bb43 = [];
  ((Array.isArray(_0x1f7ce5) ? _0x1f7ce5 : []).forEach((_0x370a16) => {
    _0x13bb43.push(...buildAssetMentionRefs(_0x370a16));
  }),
    rebuildIndex(_0x13bb43));
}
export function upsertAssetMentionAsset(_0x20a1b7) {
  if (!_0x20a1b7 || typeof _0x20a1b7 !== "object") return;
  const _0x2fd0b7 = normalizeText(_0x20a1b7.id);
  if (!_0x2fd0b7) return;
  const _0x14610b = _assetMentionRefs.filter(
    (_0x1496dd) => _0x1496dd.assetId !== _0x2fd0b7,
  );
  (_0x14610b.push(...buildAssetMentionRefs(_0x20a1b7)),
    rebuildIndex(_0x14610b));
}
export function removeAssetMentionAsset(_0x5401e5) {
  const _0x117819 = normalizeText(_0x5401e5);
  if (!_0x117819) return;
  rebuildIndex(
    _assetMentionRefs.filter((_0x810d04) => _0x810d04.assetId !== _0x117819),
  );
}
export function resolveAssetMentionRef({
  assetId: assetId = "",
  itemIndex: itemIndex = 0,
} = {}) {
  return (
    _assetMentionRefMap.get(normalizeText(assetId) + ":" + Number(itemIndex)) ||
    null
  );
}
export function getAssetMentionCandidates({
  query: query = "",
  allowedTypes: allowedTypes = null,
} = {}) {
  const _0x27b9b6 = normalizeText(query).replace(/^@+/, "").toLowerCase(),
    _0x3b88c1 =
      Array.isArray(allowedTypes) && allowedTypes.length
        ? new Set(allowedTypes)
        : null;
  return _assetMentionRefs.filter((_0x4fdcab) => {
    if (_0x3b88c1 && !_0x3b88c1.has(_0x4fdcab.type)) return false;
    if (!_0x27b9b6) return true;
    const _0x43c51b = [
      _0x4fdcab.name,
      _0x4fdcab.assetName,
      _0x4fdcab.category,
      TYPE_LABELS[_0x4fdcab.type],
      _0x4fdcab.label,
      _0x4fdcab.insertLabel,
    ]
      .join(" ")
      .toLowerCase();
    return _0x43c51b.includes(_0x27b9b6);
  });
}
export function _resetAssetMentionRegistryForTests() {
  ((_assetMentionLibrarySettings = {
    categories: [],
    displayNames: {},
    parents: {},
  }),
    rebuildIndex([]));
}
