import { normalizeWebPreviewFaviconUrl, normalizeWebPreviewUrl } from '../src/modules/webPreviewUrl.js';
import { resolveDouyinCurrentPageMedia } from './douyinWebPreviewResolver.js';
const MIN_VIEW_SIZE = 16,
  WEB_PREVIEW_IMAGE_DROP_MIME = 'application/x-ai-canvas-web-preview-image',
  DEFAULT_WEB_PREVIEW_BROWSER_PROFILE_ID = 'default',
  WEB_PREVIEW_PARTITION_PREFIX = 'persist:ai-canvas-web-preview',
  READY_SNAPSHOT_IDLE_DELAY_MS = 180,
  POPUP_REGISTRATION_GRACE_MS = 0x1388,
  WEB_PREVIEW_IMAGE_EXTRACTION_LIMIT = 120,
  WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT = 40,
  WEB_PREVIEW_EXTRACT_MIN_IMAGE_WIDTH = 96,
  WEB_PREVIEW_EXTRACT_MIN_IMAGE_HEIGHT = 96,
  WEB_PREVIEW_EXTRACT_MIN_IMAGE_AREA = 0x2ee0,
  WEB_PREVIEW_SELECTED_TEXT_LIMIT = 0x1388,
  WEB_PREVIEW_DIRECT_VIDEO_EXTENSION_RE = /\.(?:mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i,
  WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE = /\.(?:m3u8|mpd|m4s)(?:[?#].*)?$/i,
  WEB_PREVIEW_AUTH_POPUP_WIDTH = 0x208,
  WEB_PREVIEW_AUTH_POPUP_HEIGHT = 0x2a8,
  WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH = 0x168,
  WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT = 0x1a4,
  WEB_PREVIEW_AUTH_POPUP_REQUEST_TTL_MS = 0x2710,
  WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX = '__AI_CANVAS_WEB_PREVIEW_INPUT__:',
  WEB_PREVIEW_CONTEXT_MENU_BRIDGE_DEDUPE_MS = 0x1f4,
  WEB_PREVIEW_TEXT_ACTION_PROMPT = 'send-selected-text',
  WEB_PREVIEW_TEXT_ACTION_SOURCE = 'send-selected-text-source',
  WEB_PREVIEW_TEXT_ACTION_IMAGE_PROMPT = 'send-selected-text-to-image',
  WEB_PREVIEW_TEXT_ACTION_IMAGE_PROMPT_GENERATE = 'send-selected-text-to-image-generate',
  WEB_PREVIEW_TEXT_ACTION_VIDEO_PROMPT = 'send-selected-text-to-video',
  WEB_PREVIEW_TEXT_ACTION_VIDEO_PROMPT_GENERATE = 'send-selected-text-to-video-generate';
function buildWebPreviewDragBridgeScript({
  nodeId: nodeId = '',
  tabId: tabId = '',
  inputBridgeToken: inputBridgeToken = '',
} = {}) {
  return (
    '\n(() => {\n  const hasDragBridge = !!window.__AI_CANVAS_WEB_PREVIEW_DRAG_BRIDGE__;\n  if (!hasDragBridge) {\n    Object.defineProperty(window, "__AI_CANVAS_WEB_PREVIEW_DRAG_BRIDGE__", {\n      value: true,\n      configurable: false,\n    });\n  }\n  const MIME = ' +
    JSON.stringify(WEB_PREVIEW_IMAGE_DROP_MIME) +
    ';\n  const INPUT_PREFIX = ' +
    JSON.stringify(WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX) +
    ';\n  const INPUT_TOKEN = ' +
    JSON.stringify(String(inputBridgeToken || '')) +
    ';\n  const escapeHtml = (value) => String(value || "").replace(/[&<>"\']/g, (ch) => ({\n    "&": "&amp;",\n    "<": "&lt;",\n    ">": "&gt;",\n    \'"\': "&quot;",\n    "\'": "&#39;",\n  })[ch]);\n  const normalizeUrl = (value) => {\n    try {\n      const url = new URL(String(value || ""), document.baseURI);\n      if (url.protocol !== "http:" && url.protocol !== "https:") return "";\n      url.username = "";\n      url.password = "";\n      return url.href;\n    } catch {\n      return "";\n    }\n  };\n  const parseSrcset = (value) => String(value || "")\n    .split(",")\n    .map((item) => normalizeUrl(item.trim().split(/\\s+/)[0] || ""))\n    .filter(Boolean);\n  const parseCssUrls = (value) => {\n    const urls = [];\n    const text = String(value || "");\n    const re = /url\\((["\']?)(.*?)\\1\\)/g;\n    let match = null;\n    while ((match = re.exec(text))) {\n      const url = normalizeUrl(match[2] || "");\n      if (url) urls.push(url);\n    }\n    return urls;\n  };\n  const getImageUrl = (image) => normalizeUrl(\n    image?.currentSrc ||\n      image?.src ||\n      image?.getAttribute?.("src") ||\n      image?.dataset?.src ||\n      image?.dataset?.original ||\n      image?.dataset?.lazySrc ||\n      parseSrcset(image?.srcset || image?.getAttribute?.("srcset") || "")[0] ||\n      "",\n  );\n  const getElementTitle = (element, fallback = "") =>\n    String(\n      element?.alt ||\n        element?.title ||\n        element?.getAttribute?.("aria-label") ||\n        fallback ||\n        document.title ||\n        "网页图片",\n    ).slice(0, 120);\n  const findImageElement = (target) => {\n    if (!target?.closest) return null;\n    return (\n      target.closest("img") ||\n      target.closest("picture")?.querySelector?.("img") ||\n      target.querySelector?.("img, picture img") ||\n      null\n    );\n  };\n  const findBackgroundImageSource = (target) => {\n    let element = target?.nodeType === 1 ? target : null;\n    for (let i = 0; element && i < 4; i += 1, element = element.parentElement) {\n      const url = parseCssUrls(window.getComputedStyle?.(element)?.backgroundImage || "")[0];\n      if (url) {\n        return {\n          element,\n          url,\n          title: getElementTitle(element),\n          width: Math.max(0, Math.round(Number(element.clientWidth || 0) || 0)),\n          height: Math.max(0, Math.round(Number(element.clientHeight || 0) || 0)),\n        };\n      }\n    }\n    return null;\n  };\n  const findImageSource = (target) => {\n    const image = findImageElement(target);\n    if (image) return { image, element: image, url: getImageUrl(image) };\n    return findBackgroundImageSource(target);\n  };\n  const findContextImageSource = (event) => {\n    const candidates = [];\n    try {\n      const pointElements = document.elementsFromPoint?.(\n        Number(event?.clientX || 0) || 0,\n        Number(event?.clientY || 0) || 0,\n      );\n      if (Array.isArray(pointElements)) candidates.push(...pointElements);\n    } catch {}\n    if (event?.target) candidates.push(event.target);\n    const seen = new Set();\n    for (const element of candidates) {\n      if (!element || seen.has(element)) continue;\n      seen.add(element);\n      const source = findImageSource(element);\n      if (source?.url) return source;\n    }\n    return null;\n  };\n  const buildImagePayload = (source) => {\n    const image = source?.image || null;\n    const element = source?.element || image || null;\n    const url = normalizeUrl(source?.url || getImageUrl(image));\n    if (!url) return null;\n    const title = getElementTitle(image || element, source?.title);\n    const pageUrl = normalizeUrl(location.href);\n    return {\n      kind: "image",\n      url,\n      title,\n      sourceUrl: pageUrl,\n      pageUrl,\n      nodeId: ' +
    JSON.stringify(toNodeId(nodeId)) +
    ',\n      tabId: ' +
    JSON.stringify(toTabId(tabId)) +
    ',\n      width: Math.max(0, Math.round(Number(source?.width || image?.naturalWidth || image?.width || element?.clientWidth || 0) || 0)),\n      height: Math.max(0, Math.round(Number(source?.height || image?.naturalHeight || image?.height || element?.clientHeight || 0) || 0)),\n    };\n  };\n  const emitImageContextMenuRequest = (payload, event) => {\n    if (!payload?.url || !INPUT_TOKEN) return;\n    try {\n      console.info(\n        INPUT_PREFIX +\n          JSON.stringify({\n            ...payload,\n            token: INPUT_TOKEN,\n            type: "image-context-menu",\n            contextX: Math.max(0, Math.round(Number(event?.clientX || 0) || 0)),\n            contextY: Math.max(0, Math.round(Number(event?.clientY || 0) || 0)),\n          }),\n      );\n    } catch {}\n  };\n  if (!window.__AI_CANVAS_WEB_PREVIEW_CONTEXT_IMAGE_BRIDGE__) {\n    Object.defineProperty(window, "__AI_CANVAS_WEB_PREVIEW_CONTEXT_IMAGE_BRIDGE__", {\n      value: true,\n      configurable: false,\n    });\n    const handleContextImageMenu = (event) => {\n      if (event.__AI_CANVAS_WEB_PREVIEW_CONTEXT_IMAGE_HANDLED__) return;\n      const payload = buildImagePayload(findContextImageSource(event));\n      window.__AI_CANVAS_WEB_PREVIEW_LAST_CONTEXT_IMAGE__ = payload\n        ? {\n            ...payload,\n            contextX: Math.max(0, Math.round(Number(event.clientX || 0) || 0)),\n            contextY: Math.max(0, Math.round(Number(event.clientY || 0) || 0)),\n            capturedAt: Date.now(),\n          }\n        : null;\n      if (!payload?.url) return;\n      try {\n        Object.defineProperty(event, "__AI_CANVAS_WEB_PREVIEW_CONTEXT_IMAGE_HANDLED__", {\n          value: true,\n        });\n      } catch {}\n      try { event.preventDefault(); } catch {}\n      try { event.stopPropagation(); } catch {}\n      try { event.stopImmediatePropagation?.(); } catch {}\n      emitImageContextMenuRequest(payload, event);\n    };\n    window.addEventListener("contextmenu", handleContextImageMenu, true);\n    document.addEventListener("contextmenu", handleContextImageMenu, true);\n  }\n  if (!hasDragBridge) {\n    document.addEventListener("dragstart", (event) => {\n      const payloadObject = buildImagePayload(findImageSource(event.target));\n      const url = payloadObject?.url || "";\n      if (!url || !event.dataTransfer) return;\n      const title = payloadObject.title || "网页图片";\n      const payload = JSON.stringify(payloadObject);\n      try { event.dataTransfer.setData(MIME, payload); } catch {}\n      try { event.dataTransfer.setData("text/uri-list", url); } catch {}\n      try { event.dataTransfer.setData("text/plain", url); } catch {}\n      try {\n        event.dataTransfer.setData("text/html", \'<img src="\' + escapeHtml(url) + \'" alt="\' + escapeHtml(title) + \'">\');\n      } catch {}\n      event.dataTransfer.effectAllowed = "copy";\n    }, true);\n  }\n  if (!window.__AI_CANVAS_WEB_PREVIEW_INPUT_BRIDGE__ && INPUT_TOKEN) {\n    Object.defineProperty(window, "__AI_CANVAS_WEB_PREVIEW_INPUT_BRIDGE__", {\n      value: true,\n      configurable: false,\n    });\n    let spaceHeld = false;\n    let lastPanStartAt = 0;\n    let lastPanStartButton = -1;\n    const isSpaceKey = (event) =>\n      event?.code === "Space" ||\n      event?.key === " " ||\n      event?.key === "Spacebar" ||\n      event?.key === "Space";\n    const setSpaceHeld = (held) => {\n      spaceHeld = held === true;\n    };\n    document.addEventListener("keydown", (event) => {\n      if (isSpaceKey(event)) setSpaceHeld(true);\n    }, true);\n    document.addEventListener("keyup", (event) => {\n      if (isSpaceKey(event)) setSpaceHeld(false);\n    }, true);\n    window.addEventListener("blur", () => setSpaceHeld(false), true);\n    const emitPanStartPreview = (event) => {\n      const button = Number(event?.button);\n      const isMiddle = button === 1;\n      const isLeft = button === 0;\n      if (!isMiddle && !isLeft) return;\n      const now = Date.now();\n      if (button === lastPanStartButton && now - lastPanStartAt < 32) return;\n      lastPanStartAt = now;\n      lastPanStartButton = button;\n      try {\n        console.info(\n          INPUT_PREFIX +\n            JSON.stringify({\n              token: INPUT_TOKEN,\n              type: "pan-start-preview",\n              button,\n              spaceHeld: isLeft && spaceHeld === true,\n              buttons: Number(event?.buttons || 0) || 0,\n              clientX: Math.max(0, Math.round(Number(event?.clientX || 0) || 0)),\n              clientY: Math.max(0, Math.round(Number(event?.clientY || 0) || 0)),\n            }),\n        );\n      } catch {}\n    };\n    window.addEventListener("pointerdown", emitPanStartPreview, true);\n    window.addEventListener("mousedown", emitPanStartPreview, true);\n    document.addEventListener("pointerdown", emitPanStartPreview, true);\n    document.addEventListener("mousedown", emitPanStartPreview, true);\n  }\n  return true;\n})()\n'
  );
}
function buildWebPreviewContextImageProbeScript({
  nodeId: nodeId = '',
  tabId: tabId = '',
  x: x = 0,
  y: y = 0,
} = {}) {
  const _0x14b906 = Math.max(0, Math.round(Number(x || 0) || 0)),
    _0x1b55e7 = Math.max(0, Math.round(Number(y || 0) || 0));
  return (
    '\n(() => {\n  const nodeId = ' +
    JSON.stringify(toNodeId(nodeId)) +
    ';\n  const tabId = ' +
    JSON.stringify(toTabId(tabId)) +
    ';\n  const contextX = ' +
    _0x14b906 +
    ';\n  const contextY = ' +
    _0x1b55e7 +
    ';\n  const normalizeUrl = (value) => {\n    try {\n      const url = new URL(String(value || ""), document.baseURI);\n      if (url.protocol !== "http:" && url.protocol !== "https:") return "";\n      url.username = "";\n      url.password = "";\n      return url.href;\n    } catch {\n      return "";\n    }\n  };\n  const pageUrl = normalizeUrl(location.href);\n  const pageTitle = String(document.title || "").slice(0, 160);\n  const parseSrcset = (value) => String(value || "")\n    .split(",")\n    .map((item) => normalizeUrl(item.trim().split(/\\s+/)[0] || ""))\n    .filter(Boolean);\n  const parseCssUrls = (value) => {\n    const urls = [];\n    const text = String(value || "");\n    const re = /url\\((["\']?)(.*?)\\1\\)/g;\n    let match = null;\n    while ((match = re.exec(text))) {\n      const url = normalizeUrl(match[2] || "");\n      if (url) urls.push(url);\n    }\n    return urls;\n  };\n  const getImageUrl = (image) => normalizeUrl(\n    image?.currentSrc ||\n      image?.src ||\n      image?.getAttribute?.("src") ||\n      image?.dataset?.src ||\n      image?.dataset?.original ||\n      image?.dataset?.lazySrc ||\n      parseSrcset(image?.srcset || image?.getAttribute?.("srcset") || "")[0] ||\n      "",\n  );\n  const getElementTitle = (element, fallback = "") =>\n    String(\n      element?.alt ||\n        element?.title ||\n        element?.getAttribute?.("aria-label") ||\n        fallback ||\n        pageTitle ||\n        "网页图片",\n    ).slice(0, 160);\n  const findImageElement = (target) => {\n    if (!target?.closest) return null;\n    return (\n      target.closest("img") ||\n      target.closest("picture")?.querySelector?.("img") ||\n      target.querySelector?.("img, picture img") ||\n      null\n    );\n  };\n  const findBackgroundImageSource = (target) => {\n    let element = target?.nodeType === 1 ? target : null;\n    for (let i = 0; element && i < 4; i += 1, element = element.parentElement) {\n      const url = parseCssUrls(window.getComputedStyle?.(element)?.backgroundImage || "")[0];\n      if (url) {\n        return {\n          element,\n          url,\n          title: getElementTitle(element),\n          width: Math.max(0, Math.round(Number(element.clientWidth || 0) || 0)),\n          height: Math.max(0, Math.round(Number(element.clientHeight || 0) || 0)),\n        };\n      }\n    }\n    return null;\n  };\n  const findImageSource = (target) => {\n    const image = findImageElement(target);\n    if (image) return { image, element: image, url: getImageUrl(image) };\n    return findBackgroundImageSource(target);\n  };\n  const findContextImageSource = () => {\n    const candidates = [];\n    try {\n      const pointElements = document.elementsFromPoint?.(contextX, contextY);\n      if (Array.isArray(pointElements)) candidates.push(...pointElements);\n    } catch {}\n    const seen = new Set();\n    for (const element of candidates) {\n      if (!element || seen.has(element)) continue;\n      seen.add(element);\n      const source = findImageSource(element);\n      if (source?.url) return source;\n    }\n    return null;\n  };\n  const buildImagePayload = (source) => {\n    const image = source?.image || null;\n    const element = source?.element || image || null;\n    const url = normalizeUrl(source?.url || getImageUrl(image));\n    if (!url) return null;\n    return {\n      kind: "image",\n      url,\n      title: getElementTitle(image || element, source?.title),\n      alt: String(image?.alt || "").slice(0, 160),\n      pageUrl,\n      pageTitle,\n      nodeId,\n      tabId,\n      contextX,\n      contextY,\n      width: Math.max(0, Math.round(Number(source?.width || image?.naturalWidth || image?.width || element?.clientWidth || 0) || 0)),\n      height: Math.max(0, Math.round(Number(source?.height || image?.naturalHeight || image?.height || element?.clientHeight || 0) || 0)),\n    };\n  };\n  const stored = window.__AI_CANVAS_WEB_PREVIEW_LAST_CONTEXT_IMAGE__;\n  if (stored?.url) {\n    return {\n      ok: true,\n      image: {\n        ...stored,\n        pageTitle: String(stored.pageTitle || pageTitle || "").slice(0, 160),\n        contextX,\n        contextY,\n      },\n      pageUrl,\n      pageTitle,\n    };\n  }\n  const payload = buildImagePayload(findContextImageSource());\n  return { ok: !!payload, image: payload, pageUrl, pageTitle };\n})()\n'
  );
}
function buildWebPreviewImageExtractionScript({ nodeId: nodeId = '', tabId: tabId = '' } = {}) {
  return (
    '\n(() => {\n  const MAX = ' +
    WEB_PREVIEW_IMAGE_EXTRACTION_LIMIT +
    ';\n  const MIN_WIDTH = ' +
    WEB_PREVIEW_EXTRACT_MIN_IMAGE_WIDTH +
    ';\n  const MIN_HEIGHT = ' +
    WEB_PREVIEW_EXTRACT_MIN_IMAGE_HEIGHT +
    ';\n  const MIN_AREA = ' +
    WEB_PREVIEW_EXTRACT_MIN_IMAGE_AREA +
    ';\n  const nodeId = ' +
    JSON.stringify(toNodeId(nodeId)) +
    ';\n  const tabId = ' +
    JSON.stringify(toTabId(tabId)) +
    ';\n  const normalizeUrl = (value) => {\n    try {\n      const url = new URL(String(value || ""), document.baseURI);\n      if (url.protocol !== "http:" && url.protocol !== "https:") return "";\n      url.username = "";\n      url.password = "";\n      return url.href;\n    } catch {\n      return "";\n    }\n  };\n  const parseSrcset = (value) => String(value || "")\n    .split(",")\n    .map((item) => normalizeUrl(item.trim().split(/\\s+/)[0] || ""))\n    .filter(Boolean);\n  const parseCssUrls = (value) => {\n    const urls = [];\n    const text = String(value || "");\n    const re = /url\\((["\']?)(.*?)\\1\\)/g;\n    let match = null;\n    while ((match = re.exec(text))) {\n      const url = normalizeUrl(match[2]);\n      if (url) urls.push(url);\n    }\n    return urls;\n  };\n  const pageUrl = normalizeUrl(location.href);\n  const pageTitle = String(document.title || "").slice(0, 160);\n  const seen = new Set();\n  const images = [];\n  const hasExtractableSize = (width, height) => {\n    const safeWidth = Math.max(0, Math.round(Number(width || 0) || 0));\n    const safeHeight = Math.max(0, Math.round(Number(height || 0) || 0));\n    if (!safeWidth || !safeHeight) return true;\n    return safeWidth >= MIN_WIDTH && safeHeight >= MIN_HEIGHT && safeWidth * safeHeight >= MIN_AREA;\n  };\n  const push = (url, source = {}) => {\n    const normalizedUrl = normalizeUrl(url);\n    const width = Math.max(0, Math.round(Number(source.width || 0) || 0));\n    const height = Math.max(0, Math.round(Number(source.height || 0) || 0));\n    if (!normalizedUrl || !hasExtractableSize(width, height) || seen.has(normalizedUrl) || images.length >= MAX) return;\n    seen.add(normalizedUrl);\n    images.push({\n      url: normalizedUrl,\n      title: String(source.title || pageTitle || "网页图片").slice(0, 160),\n      alt: String(source.alt || "").slice(0, 160),\n      width,\n      height,\n      pageUrl,\n      pageTitle,\n      nodeId,\n      tabId,\n    });\n  };\n  for (const img of Array.from(document.images || [])) {\n    if (images.length >= MAX) break;\n    const title = img.alt || img.title || img.getAttribute("aria-label") || pageTitle || "网页图片";\n    const source = {\n      title,\n      alt: img.alt || "",\n      width: img.naturalWidth || img.width || img.clientWidth || 0,\n      height: img.naturalHeight || img.height || img.clientHeight || 0,\n    };\n    push(img.currentSrc || img.src || img.getAttribute("src") || img.dataset?.src || "", source);\n    for (const url of parseSrcset(img.srcset || img.getAttribute("srcset") || "")) push(url, source);\n    const picture = img.closest?.("picture");\n    for (const sourceEl of Array.from(picture?.querySelectorAll?.("source[srcset]") || [])) {\n      for (const url of parseSrcset(sourceEl.getAttribute("srcset") || "")) push(url, source);\n    }\n  }\n  for (const el of Array.from(document.querySelectorAll("body *"))) {\n    if (images.length >= MAX) break;\n    let backgroundImage = "";\n    try {\n      backgroundImage = getComputedStyle(el).backgroundImage;\n    } catch {}\n    for (const url of parseCssUrls(backgroundImage)) {\n      if (images.length >= MAX) break;\n      push(url, {\n        title: el.getAttribute?.("aria-label") || el.getAttribute?.("title") || pageTitle || "网页图片",\n        width: el.clientWidth || 0,\n        height: el.clientHeight || 0,\n      });\n    }\n  }\n  return { ok: true, images, pageUrl, pageTitle };\n})()\n'
  );
}
function buildWebPreviewVideoExtractionScript({ nodeId: nodeId = '', tabId: tabId = '' } = {}) {
  return (
    '\n(() => {\n  const MAX = ' +
    WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT +
    ';\n  const DIRECT_VIDEO_RE = ' +
    WEB_PREVIEW_DIRECT_VIDEO_EXTENSION_RE +
    ';\n  const STREAM_MEDIA_RE = ' +
    WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE +
    ';\n  const nodeId = ' +
    JSON.stringify(toNodeId(nodeId)) +
    ';\n  const tabId = ' +
    JSON.stringify(toTabId(tabId)) +
    ';\n  const normalizeUrl = (value) => {\n    try {\n      const url = new URL(String(value || ""), document.baseURI);\n      if (url.protocol !== "http:" && url.protocol !== "https:") return "";\n      url.username = "";\n      url.password = "";\n      return url.href;\n    } catch {\n      return "";\n    }\n  };\n  const isDirectVideoUrl = (value) => {\n    try {\n      return DIRECT_VIDEO_RE.test(new URL(value).pathname);\n    } catch {\n      return false;\n    }\n  };\n  const isStreamMediaUrl = (value) => {\n    try {\n      return STREAM_MEDIA_RE.test(new URL(value).pathname);\n    } catch {\n      return false;\n    }\n  };\n  const pageUrl = normalizeUrl(location.href);\n  const pageTitle = String(document.title || "").slice(0, 160);\n  const seen = new Set();\n  const videos = [];\n  const douyinDetailApiUrls = [];\n  const douyinDetailApiSeen = new Set();\n  const DOUYIN_DETAIL_API_RE = /\\/aweme\\/v1\\/web\\/aweme\\/detail\\//i;\n  const pushDouyinDetailApiUrl = (value) => {\n    const normalizedUrl = normalizeUrl(value);\n    if (!normalizedUrl || douyinDetailApiSeen.has(normalizedUrl)) return;\n    try {\n      const parsed = new URL(normalizedUrl);\n      const host = parsed.hostname.toLowerCase();\n      const isDouyinHost =\n        host === "douyin.com" ||\n        host.endsWith(".douyin.com") ||\n        host === "iesdouyin.com" ||\n        host.endsWith(".iesdouyin.com");\n      if (!isDouyinHost || !DOUYIN_DETAIL_API_RE.test(parsed.pathname)) return;\n      if (!/\\d{15,25}/.test(parsed.searchParams.get("aweme_id") || "")) return;\n    } catch {\n      return;\n    }\n    douyinDetailApiSeen.add(normalizedUrl);\n    douyinDetailApiUrls.push(normalizedUrl);\n  };\n  const finiteNumber = (value) => {\n    const n = Number(value);\n    return Number.isFinite(n) && n > 0 ? n : 0;\n  };\n  const push = (url, source = {}) => {\n    const normalizedUrl = normalizeUrl(url);\n    if (!normalizedUrl || seen.has(normalizedUrl) || videos.length >= MAX) return;\n    if (isStreamMediaUrl(normalizedUrl)) return;\n    const type = String(source.type || "").trim().toLowerCase();\n    const recognizable = Boolean(\n      source.fromVideo ||\n        type.startsWith("video/") ||\n        isDirectVideoUrl(normalizedUrl),\n    );\n    if (!recognizable) return;\n    seen.add(normalizedUrl);\n    videos.push({\n      kind: "video",\n      url: normalizedUrl,\n      title: String(source.title || pageTitle || "网页视频").slice(0, 160),\n      pageUrl,\n      pageTitle,\n      nodeId,\n      tabId,\n      width: Math.max(0, Math.round(finiteNumber(source.width))),\n      height: Math.max(0, Math.round(finiteNumber(source.height))),\n      duration: finiteNumber(source.duration),\n      sourceType: String(source.sourceType || "media").slice(0, 40),\n      mimeType: type,\n    });\n  };\n  for (const video of Array.from(document.querySelectorAll("video"))) {\n    if (videos.length >= MAX) break;\n    const title =\n      video.getAttribute("aria-label") ||\n      video.getAttribute("title") ||\n      video.getAttribute("alt") ||\n      pageTitle ||\n      "网页视频";\n    const source = {\n      fromVideo: true,\n      sourceType: "video",\n      title,\n      width: video.videoWidth || video.clientWidth || 0,\n      height: video.videoHeight || video.clientHeight || 0,\n      duration: video.duration,\n    };\n    push(video.currentSrc || video.src || video.getAttribute("src") || "", source);\n    for (const sourceEl of Array.from(video.querySelectorAll("source[src]"))) {\n      push(sourceEl.getAttribute("src") || "", {\n        ...source,\n        type: sourceEl.getAttribute("type") || "",\n        sourceType: "video-source",\n      });\n    }\n  }\n  for (const sourceEl of Array.from(document.querySelectorAll("source[src]"))) {\n    if (videos.length >= MAX) break;\n    const type = sourceEl.getAttribute("type") || "";\n    if (!String(type).toLowerCase().startsWith("video/")) continue;\n    const media = sourceEl.closest?.("video");\n    push(sourceEl.getAttribute("src") || "", {\n      fromVideo: true,\n      type,\n      sourceType: "source",\n      title: media?.getAttribute?.("title") || pageTitle || "网页视频",\n      width: media?.videoWidth || media?.clientWidth || 0,\n      height: media?.videoHeight || media?.clientHeight || 0,\n      duration: media?.duration,\n    });\n  }\n  for (const link of Array.from(document.querySelectorAll("a[href]"))) {\n    if (videos.length >= MAX) break;\n    const href = link.getAttribute("href") || "";\n    const normalizedUrl = normalizeUrl(href);\n    if (!normalizedUrl || !isDirectVideoUrl(normalizedUrl) || isStreamMediaUrl(normalizedUrl)) continue;\n    push(normalizedUrl, {\n      sourceType: "link",\n      title: link.textContent?.trim() || link.getAttribute("title") || pageTitle || "网页视频",\n    });\n  }\n  for (const el of Array.from(document.querySelectorAll("[data-src], [data-url], [data-video-src]"))) {\n    if (videos.length >= MAX) break;\n    const candidates = [\n      el.getAttribute("data-video-src"),\n      el.getAttribute("data-play-url"),\n      el.getAttribute("data-video-url"),\n      el.getAttribute("data-src"),\n      el.getAttribute("data-url"),\n    ];\n    for (const candidate of candidates) {\n      if (videos.length >= MAX) break;\n      const normalizedUrl = normalizeUrl(candidate);\n      if (!normalizedUrl || !isDirectVideoUrl(normalizedUrl) || isStreamMediaUrl(normalizedUrl)) continue;\n      push(normalizedUrl, {\n        sourceType: "data-attribute",\n        title: el.getAttribute("aria-label") || el.getAttribute("title") || pageTitle || "网页视频",\n        width: el.clientWidth || 0,\n        height: el.clientHeight || 0,\n      });\n    }\n  }\n  for (const resource of Array.from(performance?.getEntriesByType?.("resource") || [])) {\n    if (videos.length >= MAX) break;\n    const normalizedUrl = normalizeUrl(resource?.name);\n    if (!normalizedUrl || isStreamMediaUrl(normalizedUrl)) continue;\n    pushDouyinDetailApiUrl(normalizedUrl);\n    const initiatorType = String(resource?.initiatorType || "").trim().toLowerCase();\n    const fromMediaResource =\n      initiatorType === "video" ||\n      initiatorType === "media" ||\n      initiatorType === "source";\n    if (!fromMediaResource && !isDirectVideoUrl(normalizedUrl)) continue;\n    push(normalizedUrl, {\n      fromVideo: fromMediaResource,\n      sourceType: "video-resource",\n      title: pageTitle || "网页视频",\n    });\n  }\n  const normalizeEmbeddedUrl = (value) =>\n    normalizeUrl(\n      String(value || "")\n        .replace(/\\\\u002[fF]/g, "/")\n        .replace(/\\\\\\//g, "/"),\n    );\n  const embeddedUrlRe = /https?:\\\\?\\/\\\\?\\/[^"\'\\s<>]+/g;\n  for (const script of Array.from(document.scripts || [])) {\n    if (videos.length >= MAX) break;\n    const text = String(script.textContent || "").slice(0, 400000);\n    let match = null;\n    while ((match = embeddedUrlRe.exec(text))) {\n      if (videos.length >= MAX) break;\n      const normalizedUrl = normalizeEmbeddedUrl(match[0]);\n      pushDouyinDetailApiUrl(normalizedUrl);\n      if (!normalizedUrl || !isDirectVideoUrl(normalizedUrl) || isStreamMediaUrl(normalizedUrl)) continue;\n      push(normalizedUrl, {\n        sourceType: "embedded-url",\n        title: pageTitle || "网页视频",\n      });\n    }\n  }\n  const STRUCTURED_VIDEO_SOURCE_TYPE = "structured-data";\n  const DOUYIN_DETAIL_SOURCE_TYPE = "douyin-detail";\n  const STRUCTURED_VIDEO_KEY_RE =\n    /(?:video|play|download|stream|dash|media|aweme|xigua|note|vod|mp4|h264|h265|hevc|url[_-]?list|backup[_-]?urls|masterurl|baseurl|playurl|downloadurl)/i;\n  const STRUCTURED_URL_KEY_RE =\n    /^(?:url|uri|src|source|playurl|play_url|playaddr|play_addr|downloadurl|download_url|downloadaddr|download_addr|masterurl|master_url|baseurl|base_url|mainurl|main_url|file|contenturl)$/i;\n  const NON_VIDEO_ASSET_RE = /.(?:png|jpe?g|webp|gif|bmp|svg|avif|css|js)(?:[?#].*)?$/i;\n  const KNOWN_STATE_KEYS = [\n    "__INITIAL_STATE__",\n    "__NEXT_DATA__",\n    "__NUXT__",\n    "__APOLLO_STATE__",\n    "__INITIAL_PROPS__",\n    "RENDER_DATA",\n    "SIGI_STATE",\n    "SSR_RENDER_DATA",\n  ];\n  const unescapeStructuredUrlText = (value) =>\n    String(value || "")\n      .replace(/\\\\u002[fF]/g, "/")\n      .replace(/\\\\u0026/g, "&")\n      .replace(/\\\\u003[dD]/g, "=")\n      .replace(/\\\\\\//g, "/")\n      .replace(/&amp;/g, "&");\n  const extractUrlsFromText = (value) => {\n    const text = unescapeStructuredUrlText(value).trim();\n    if (!text) return [];\n    const urls = [];\n    const direct = normalizeUrl(text);\n    if (direct) urls.push(direct);\n    const urlRe = /https?:\\/\\/[^"\'\\s<>]+/g;\n    let match = null;\n    while ((match = urlRe.exec(text))) {\n      const url = normalizeUrl(match[0]);\n      if (url) urls.push(url);\n    }\n    return Array.from(new Set(urls));\n  };\n  const isNonVideoAssetUrl = (value) => {\n    try {\n      return NON_VIDEO_ASSET_RE.test(new URL(value).pathname);\n    } catch {\n      return false;\n    }\n  };\n  const hasStructuredVideoContext = (path = []) =>\n    path.some((key) => STRUCTURED_VIDEO_KEY_RE.test(String(key || "")));\n  const readStructuredNumber = (object, keys) => {\n    if (!object || typeof object !== "object") return 0;\n    for (const key of keys) {\n      const value = finiteNumber(object[key]);\n      if (value) return value;\n    }\n    return 0;\n  };\n  const normalizeDouyinDuration = (value) => {\n    const duration = finiteNumber(value);\n    if (!duration) return 0;\n    return duration >= 1000 ? duration / 1000 : duration;\n  };\n  const pickLastStructuredUrl = (items) => {\n    const urls = [];\n    const list = Array.isArray(items) ? items : [items];\n    for (const item of list) {\n      urls.push(...extractUrlsFromText(item));\n    }\n    return urls.filter(Boolean).at(-1) || "";\n  };\n  const readDouyinAddressUrl = (address) => {\n    if (!address) return "";\n    if (typeof address === "string") return pickLastStructuredUrl(address);\n    if (typeof address !== "object") return "";\n    const urlList = Array.isArray(address.url_list)\n      ? address.url_list\n      : Array.isArray(address.urlList)\n        ? address.urlList\n        : [];\n    return (\n      pickLastStructuredUrl(urlList) ||\n      pickLastStructuredUrl(address.url) ||\n      pickLastStructuredUrl(address.uri) ||\n      pickLastStructuredUrl(address.main_url) ||\n      pickLastStructuredUrl(address.mainUrl)\n    );\n  };\n  const hasDouyinVideoAddress = (video) =>\n    Boolean(\n      video &&\n        typeof video === "object" &&\n        (video.play_addr_h264 || video.play_addr_256 || video.play_addr || video.download_addr),\n    );\n  const readDouyinVideoUrl = (video) => {\n    if (!hasDouyinVideoAddress(video)) return "";\n    const sources = [video.play_addr_h264, video.play_addr_256, video.play_addr, video.download_addr];\n    for (const source of sources) {\n      const url = readDouyinAddressUrl(source);\n      if (url) return url;\n    }\n    return "";\n  };\n  const readDouyinTitle = (aweme) =>\n    String(\n      aweme?.desc ||\n        aweme?.item_title ||\n        aweme?.share_info?.share_title ||\n        pageTitle ||\n        "网页视频",\n    )\n      .trim()\n      .slice(0, 160);\n  const pushDouyinAwemeDetail = (aweme) => {\n    if (!aweme || typeof aweme !== "object" || !hasDouyinVideoAddress(aweme.video)) return;\n    const url = readDouyinVideoUrl(aweme.video);\n    if (!url || isStreamMediaUrl(url) || isNonVideoAssetUrl(url)) return;\n    push(url, {\n      fromVideo: true,\n      sourceType: DOUYIN_DETAIL_SOURCE_TYPE,\n      title: readDouyinTitle(aweme),\n      width: readStructuredNumber(aweme.video, ["width", "w", "videoWidth"]),\n      height: readStructuredNumber(aweme.video, ["height", "h", "videoHeight"]),\n      duration: normalizeDouyinDuration(\n        aweme.video.duration || aweme.duration || aweme.video.videoDuration,\n      ),\n    });\n  };\n  const visitedDouyinDetailObjects = new WeakSet();\n  const scanDouyinAwemeDetails = (value, depth = 0) => {\n    if (videos.length >= MAX || depth > 10 || !value || typeof value !== "object") return;\n    if (visitedDouyinDetailObjects.has(value)) return;\n    visitedDouyinDetailObjects.add(value);\n    if (value.aweme_detail) pushDouyinAwemeDetail(value.aweme_detail);\n    if (Array.isArray(value.aweme_list)) {\n      for (const aweme of value.aweme_list) pushDouyinAwemeDetail(aweme);\n    }\n    if (hasDouyinVideoAddress(value.video)) pushDouyinAwemeDetail(value);\n    for (const key of Object.keys(value).slice(0, 180)) {\n      if (videos.length >= MAX) break;\n      const item = value[key];\n      if (item && typeof item === "object") scanDouyinAwemeDetails(item, depth + 1);\n    }\n  };\n  const pushStructuredVideoUrl = (url, source = {}) => {\n    const normalizedUrl = normalizeUrl(url);\n    if (!normalizedUrl || isStreamMediaUrl(normalizedUrl) || isNonVideoAssetUrl(normalizedUrl)) {\n      return;\n    }\n    if (!isDirectVideoUrl(normalizedUrl)) return;\n    push(normalizedUrl, {\n      fromVideo: true,\n      sourceType: STRUCTURED_VIDEO_SOURCE_TYPE,\n      title: source.title || pageTitle || "网页视频",\n      width: source.width || 0,\n      height: source.height || 0,\n      duration: source.duration || 0,\n    });\n  };\n  const visitedStructuredObjects = new WeakSet();\n  let structuredObjectCount = 0;\n  const walkStructuredMedia = (value, path = [], depth = 0, inheritedContext = false) => {\n    if (videos.length >= MAX || structuredObjectCount > 3000 || depth > 10) return;\n    if (typeof value === "string") {\n      const context =\n        inheritedContext ||\n        hasStructuredVideoContext(path) ||\n        STRUCTURED_URL_KEY_RE.test(String(path.at(-1) || ""));\n      if (!context) return;\n      for (const url of extractUrlsFromText(value)) {\n        pushStructuredVideoUrl(url, { hasStructuredVideoContext: context });\n      }\n      return;\n    }\n    if (!value || typeof value !== "object") return;\n    if (visitedStructuredObjects.has(value)) return;\n    visitedStructuredObjects.add(value);\n    structuredObjectCount += 1;\n\n    const keys = Object.keys(value).slice(0, 180);\n    const objectContext =\n      inheritedContext ||\n      hasStructuredVideoContext(path) ||\n      keys.some((key) => STRUCTURED_VIDEO_KEY_RE.test(key));\n    const dimensions = {\n      width: readStructuredNumber(value, ["width", "w", "videoWidth"]),\n      height: readStructuredNumber(value, ["height", "h", "videoHeight"]),\n      duration: readStructuredNumber(value, ["duration", "durationSec", "videoDuration"]),\n    };\n    for (const key of keys) {\n      if (videos.length >= MAX) break;\n      const item = value[key];\n      const nextPath = path.concat(key);\n      const keyContext =\n        objectContext ||\n        STRUCTURED_VIDEO_KEY_RE.test(key) ||\n        STRUCTURED_URL_KEY_RE.test(key);\n      if (typeof item === "string") {\n        if (!keyContext) continue;\n        for (const url of extractUrlsFromText(item)) {\n          pushStructuredVideoUrl(url, {\n            ...dimensions,\n            hasStructuredVideoContext: keyContext,\n          });\n        }\n        continue;\n      }\n      if (item && typeof item === "object") {\n        walkStructuredMedia(item, nextPath, depth + 1, keyContext);\n      }\n    }\n  };\n  const tryParseStructuredJson = (value) => {\n    const text = String(value || "").trim();\n    if (!text) return null;\n    try {\n      return JSON.parse(text);\n    } catch {}\n    try {\n      return JSON.parse(decodeURIComponent(text));\n    } catch {}\n    return null;\n  };\n  const extractJsonValueAt = (text, startIndex) => {\n    let index = Math.max(0, Number(startIndex || 0) || 0);\n    while (index < text.length && /\\s/.test(text[index])) index += 1;\n    const open = text[index];\n    const close = open === "{" ? "}" : open === "[" ? "]" : "";\n    if (!close) return "";\n    let depth = 0;\n    let quote = "";\n    let escaped = false;\n    for (let i = index; i < text.length; i += 1) {\n      const ch = text[i];\n      if (quote) {\n        if (escaped) {\n          escaped = false;\n        } else if (ch === "\\\\") {\n          escaped = true;\n        } else if (ch === quote) {\n          quote = "";\n        }\n        continue;\n      }\n      if (ch === \'"\' || ch === "\'") {\n        quote = ch;\n        continue;\n      }\n      if (ch === open) {\n        depth += 1;\n      } else if (ch === close) {\n        depth -= 1;\n        if (depth === 0) return text.slice(index, i + 1);\n      }\n    }\n    return "";\n  };\n  const scanStructuredScriptText = (value) => {\n    const text = String(value || "").slice(0, 800000);\n    const parsed = tryParseStructuredJson(text);\n    if (parsed) {\n      scanDouyinAwemeDetails(parsed);\n      walkStructuredMedia(parsed, ["script-json"]);\n    }\n    const decodedText = unescapeStructuredUrlText(text);\n    const decoded = decodedText !== text ? tryParseStructuredJson(decodedText) : null;\n    if (decoded) {\n      scanDouyinAwemeDetails(decoded);\n      walkStructuredMedia(decoded, ["script-json-decoded"]);\n    }\n\n    const keyRe =\n      /["\']?(aweme_detail|video_info(?:_v2)?|video|play_addr(?:_h(?:264|265)|_256)?|download_addr|url_list|backup_urls|dash|stream)["\']?\\s*:/gi;\n    let match = null;\n    let scanned = 0;\n    while ((match = keyRe.exec(decodedText)) && scanned < 120 && videos.length < MAX) {\n      scanned += 1;\n      const colonIndex = decodedText.indexOf(":", match.index);\n      const jsonValue = extractJsonValueAt(decodedText, colonIndex + 1);\n      const partial = tryParseStructuredJson(jsonValue);\n      if (partial) {\n        scanDouyinAwemeDetails(partial);\n        walkStructuredMedia(partial, [match[1]]);\n      }\n    }\n  };\n  for (const key of KNOWN_STATE_KEYS) {\n    if (videos.length >= MAX) break;\n    try {\n      const value = window[key];\n      if (typeof value === "string") {\n        const parsed = tryParseStructuredJson(unescapeStructuredUrlText(value));\n        if (parsed) {\n          scanDouyinAwemeDetails(parsed);\n          walkStructuredMedia(parsed, [key]);\n        } else {\n          walkStructuredMedia(value, [key]);\n        }\n      } else if (value && typeof value === "object") {\n        scanDouyinAwemeDetails(value);\n        walkStructuredMedia(value, [key]);\n      }\n    } catch {}\n  }\n  for (const script of Array.from(document.scripts || [])) {\n    if (videos.length >= MAX) break;\n    const type = String(script.type || script.getAttribute?.("type") || "").toLowerCase();\n    const id = String(script.id || "").toLowerCase();\n    const shouldScan =\n      type.includes("json") ||\n      id.includes("data") ||\n      id.includes("state") ||\n      /play_addr|download_addr|url_list|backup_urls|video_info|aweme_detail/i.test(script.textContent || "");\n    if (!shouldScan) continue;\n    scanStructuredScriptText(script.textContent || "");\n  }\n  return { ok: true, videos, douyinDetailApiUrls, pageUrl, pageTitle };\n})()\n'
  );
}
function buildWebPreviewReferenceSnapshotScript() {
  return (
    '\n(() => {\n  const normalizeUrl = (value) => {\n    try {\n      const url = new URL(String(value || ""), document.baseURI);\n      if (url.protocol !== "http:" && url.protocol !== "https:") return "";\n      url.username = "";\n      url.password = "";\n      return url.href;\n    } catch {\n      return "";\n    }\n  };\n  const selectedText = String(window.getSelection?.().toString?.() || "").trim();\n  return {\n    ok: true,\n    pageUrl: normalizeUrl(location.href),\n    pageTitle: String(document.title || "").slice(0, 160),\n    selectedText: selectedText.slice(0, ' +
    WEB_PREVIEW_SELECTED_TEXT_LIMIT +
    '),\n  };\n})()\n'
  );
}
function toNodeId(_0x589926) {
  return String(_0x589926 || '').trim();
}
function toTabId(_0xd65d44) {
  return String(_0xd65d44 || 'default').trim() || 'default';
}
function normalizeExtractedImageDimension(_0x2b270c) {
  return Math.max(0, Math.round(Number(_0x2b270c || 0) || 0));
}
function hasExtractableImageSize(_0x35463f, _0x26eb34) {
  const _0x2be2d7 = normalizeExtractedImageDimension(_0x35463f),
    _0x56f8c4 = normalizeExtractedImageDimension(_0x26eb34);
  if (!_0x2be2d7 || !_0x56f8c4) return true;
  return (
    _0x2be2d7 >= WEB_PREVIEW_EXTRACT_MIN_IMAGE_WIDTH &&
    _0x56f8c4 >= WEB_PREVIEW_EXTRACT_MIN_IMAGE_HEIGHT &&
    _0x2be2d7 * _0x56f8c4 >= WEB_PREVIEW_EXTRACT_MIN_IMAGE_AREA
  );
}
function filterExtractedImageCandidates(_0x7dd748 = []) {
  if (!Array.isArray(_0x7dd748)) return [];
  return _0x7dd748.filter((_0x342fb2) => hasExtractableImageSize(_0x342fb2?.width, _0x342fb2?.height));
}
function normalizeExtractedMediaUrl(_0x11a4b7) {
  const _0x59f658 = String(_0x11a4b7 || '').trim();
  if (!_0x59f658) return '';
  try {
    const _0x83af7e = new URL(_0x59f658);
    if (_0x83af7e.protocol !== 'http:' && _0x83af7e.protocol !== 'https:') return '';
    return ((_0x83af7e.username = ''), (_0x83af7e.password = ''), _0x83af7e.href);
  } catch {
    return '';
  }
}
function isDirectVideoMediaUrl(_0xe62d4d) {
  const _0xfe26d = normalizeExtractedMediaUrl(_0xe62d4d);
  if (!_0xfe26d) return false;
  try {
    const _0x356677 = new URL(_0xfe26d).pathname;
    return (
      WEB_PREVIEW_DIRECT_VIDEO_EXTENSION_RE.test(_0x356677) &&
      !WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE.test(_0x356677)
    );
  } catch {
    return false;
  }
}
function filterExtractedVideoCandidates(_0x34b004 = []) {
  if (!Array.isArray(_0x34b004)) return [];
  const _0x10fc1b = new Set(),
    _0x331d8d = [];
  for (const _0x509da3 of _0x34b004) {
    const _0x28d61f = normalizeExtractedMediaUrl(_0x509da3?.url);
    if (!_0x28d61f || _0x10fc1b.has(_0x28d61f)) continue;
    let _0x2a060a = '';
    try {
      _0x2a060a = new URL(_0x28d61f).pathname;
    } catch {}
    if (WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE.test(_0x2a060a)) continue;
    const _0x305566 = String(_0x509da3?.mimeType || '')
        .trim()
        .toLowerCase(),
      _0xb69fe0 = String(_0x509da3?.sourceType || 'media')
        .trim()
        .toLowerCase(),
      _0xfb0a3 =
        _0x305566.startsWith('video/') ||
        isDirectVideoMediaUrl(_0x28d61f) ||
        _0xb69fe0 === 'video' ||
        _0xb69fe0 === 'video-source' ||
        _0xb69fe0 === 'source' ||
        _0xb69fe0 === 'video-resource' ||
        _0xb69fe0 === 'douyin-detail';
    if (!_0xfb0a3) continue;
    (_0x10fc1b.add(_0x28d61f),
      _0x331d8d.push({
        kind: 'video',
        url: _0x28d61f,
        title: String(_0x509da3?.title || _0x509da3?.pageTitle || '网页视频')
          .trim()
          .slice(0, 160),
        pageUrl: normalizeExtractedMediaUrl(_0x509da3?.pageUrl),
        pageTitle: String(_0x509da3?.pageTitle || '')
          .trim()
          .slice(0, 160),
        nodeId: String(_0x509da3?.nodeId || '').trim(),
        tabId: String(_0x509da3?.tabId || '').trim(),
        width: Math.max(0, Math.round(Number(_0x509da3?.width || 0) || 0)),
        height: Math.max(0, Math.round(Number(_0x509da3?.height || 0) || 0)),
        duration: Math.max(0, Number(_0x509da3?.duration || 0) || 0),
        sourceType: _0xb69fe0.slice(0, 40),
        mimeType: _0x305566,
      }));
    if (_0x331d8d.length >= WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT) break;
  }
  return _0x331d8d;
}
function mergeExtractedImageCandidates(..._0x24522f) {
  const _0x1dbec3 = new Set(),
    _0x14383d = [];
  for (const _0x36f848 of _0x24522f) {
    for (const _0x268507 of filterExtractedImageCandidates(_0x36f848)) {
      const _0x510d3f = normalizeExtractedMediaUrl(_0x268507?.url);
      if (!_0x510d3f || _0x1dbec3.has(_0x510d3f)) continue;
      (_0x1dbec3.add(_0x510d3f), _0x14383d.push({ ..._0x268507, url: _0x510d3f }));
      if (_0x14383d.length >= WEB_PREVIEW_IMAGE_EXTRACTION_LIMIT) return _0x14383d;
    }
  }
  return _0x14383d;
}
function mergeExtractedVideoCandidates(..._0x27b371) {
  const _0x1cbbfe = new Set(),
    _0x69b750 = [];
  for (const _0x11285b of _0x27b371) {
    for (const _0xe7bfe8 of filterExtractedVideoCandidates(_0x11285b)) {
      if (!_0xe7bfe8?.url || _0x1cbbfe.has(_0xe7bfe8.url)) continue;
      (_0x1cbbfe.add(_0xe7bfe8.url), _0x69b750.push(_0xe7bfe8));
      if (_0x69b750.length >= WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT) return _0x69b750;
    }
  }
  return _0x69b750;
}
function toEntryKey(_0x3cd291, _0x5a0876 = 'default') {
  return toNodeId(_0x3cd291) + '\n' + toTabId(_0x5a0876);
}
function toBrowserProfileId(_0x5540b2) {
  const _0x3be42d = String(_0x5540b2 || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return _0x3be42d || DEFAULT_WEB_PREVIEW_BROWSER_PROFILE_ID;
}
function toPersistentPartitionId(_0x1293f0) {
  return WEB_PREVIEW_PARTITION_PREFIX + '-' + toBrowserProfileId(_0x1293f0);
}
function isBlankPopupUrl(_0x4f06d7) {
  const _0x2b3b7b = String(_0x4f06d7 || '')
    .trim()
    .toLowerCase();
  return (
    !_0x2b3b7b ||
    _0x2b3b7b === 'about:blank' ||
    _0x2b3b7b.startsWith('about:blank#') ||
    _0x2b3b7b.startsWith('about:blank?')
  );
}
function isGoogleAccountsUrl(_0x56d664) {
  const _0x114dac = normalizeWebPreviewUrl(_0x56d664);
  if (!_0x114dac) return false;
  try {
    const _0x2e1aac = new URL(_0x114dac).hostname.toLowerCase();
    return _0x2e1aac === 'accounts.google.com' || _0x2e1aac.startsWith('accounts.google.');
  } catch {
    return false;
  }
}
function shouldUseNativeAuthPopup(_0x10430b) {
  return isBlankPopupUrl(_0x10430b) || isGoogleAccountsUrl(_0x10430b);
}
function normalizeBounds(_0x2540fe = {}) {
  const _0x5972a1 = Math.round(Number(_0x2540fe.x)),
    _0x404407 = Math.round(Number(_0x2540fe.y)),
    _0x262634 = Math.round(Number(_0x2540fe.width)),
    _0x3c2364 = Math.round(Number(_0x2540fe.height));
  if (
    !Number.isFinite(_0x5972a1) ||
    !Number.isFinite(_0x404407) ||
    !Number.isFinite(_0x262634) ||
    !Number.isFinite(_0x3c2364) ||
    _0x262634 < MIN_VIEW_SIZE ||
    _0x3c2364 < MIN_VIEW_SIZE
  )
    return null;
  return { x: _0x5972a1, y: _0x404407, width: _0x262634, height: _0x3c2364 };
}
function normalizeZoomFactor(_0xe135b6) {
  const _0x1fa5f1 = Number(_0xe135b6);
  if (!Number.isFinite(_0x1fa5f1) || _0x1fa5f1 <= 0) return 1;
  return Math.min(5, Math.max(0.25, _0x1fa5f1));
}
function boundsEqual(_0x4e7d26, _0x56ee0b) {
  return (
    _0x4e7d26?.x === _0x56ee0b?.x &&
    _0x4e7d26?.y === _0x56ee0b?.y &&
    _0x4e7d26?.width === _0x56ee0b?.width &&
    _0x4e7d26?.height === _0x56ee0b?.height
  );
}
function zoomFactorEqual(_0x376555, _0x218eb0) {
  return Math.abs(Number(_0x376555 || 1) - Number(_0x218eb0 || 1)) < 0.001;
}
function getViewsPayload(_0x10e29c) {
  return Array.isArray(_0x10e29c?.views) ? _0x10e29c.views : [];
}
function getNavigationState(_0x53edee) {
  return { canGoBack: Boolean(_0x53edee?.canGoBack?.()), canGoForward: Boolean(_0x53edee?.canGoForward?.()) };
}
function createInputBridgeToken() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}
function getConsoleMessageFromArgs(_0x2cd3c6 = []) {
  for (const _0x557bbc of _0x2cd3c6) {
    if (typeof _0x557bbc === 'string') return _0x557bbc;
    if (_0x557bbc && typeof _0x557bbc.message === 'string') return _0x557bbc.message;
  }
  return '';
}
function parseWebPreviewInputBridgeMessage(_0x2a9b1b = '') {
  const _0x372f5e = String(_0x2a9b1b || '');
  if (!_0x372f5e.startsWith(WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX)) return null;
  try {
    const _0x1d34ab = JSON.parse(_0x372f5e.slice(WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX.length));
    if (_0x1d34ab?.type !== 'pan-start-preview' && _0x1d34ab?.type !== 'image-context-menu') return null;
    return _0x1d34ab;
  } catch {
    return null;
  }
}
export function createWebPreviewViewManager({
  WebContentsView: _0x355d44,
  BrowserWindow: _0x34553a,
  getMainWindow: _0x56e63b,
  openExternalUrl: _0x2351f8,
  createContextMenu: _0x215916,
  logDiagnosticEvent: _0x58bf66,
  resolveDouyinMedia: resolveDouyinMedia = resolveDouyinCurrentPageMedia,
  setTimeoutFn: setTimeoutFn = globalThis.setTimeout?.bind(globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis.clearTimeout?.bind(globalThis),
  readySnapshotDelayMs: readySnapshotDelayMs = READY_SNAPSHOT_IDLE_DELAY_MS,
} = {}) {
  const _0x1c905a = new Map(),
    _0x12e803 = new Set(),
    _0x3606bd = new Set();
  let _0x5bfabb = 0;
  function _0x5dc532() {
    const _0x5b3516 = typeof _0x56e63b === 'function' ? _0x56e63b() : null;
    return _0x5b3516 && !_0x5b3516.isDestroyed?.() ? _0x5b3516 : null;
  }
  function _0x1d234c(_0x2c25d5, _0x2c1132, _0x107160 = '') {
    const _0x3cab9c = _0x5dc532();
    if (!_0x3cab9c?.webContents || _0x3cab9c.webContents.isDestroyed?.()) return;
    _0x3cab9c.webContents.send('webPreview:event', {
      nodeId: _0x2c25d5,
      ...(_0x107160 ? { tabId: _0x107160 } : {}),
      ..._0x2c1132,
    });
  }
  function _0x2effdd(_0x4f297c, _0x4fadda, _0x19249a = '') {
    _0x1d234c(
      _0x4f297c,
      { type: 'blocked', url: String(_0x4fadda || ''), message: '浏览器节点仅允许打开 http/https 链接' },
      _0x19249a,
    );
  }
  function _0x2086ef(_0x21541e, _0xb4d20d, _0x4408e5 = '') {
    _0x1d234c(_0x21541e, { type: 'navigation-state', ...getNavigationState(_0xb4d20d) }, _0x4408e5);
  }
  function _0x2c7d3b(_0x5f2b12) {
    let _0x12ece = '';
    do {
      ((_0x5bfabb += 1), (_0x12ece = 'popup-' + Date.now() + '-' + _0x5bfabb));
    } while (_0x1c905a.has(toEntryKey(_0x5f2b12, _0x12ece)));
    return _0x12ece;
  }
  function _0x498445(_0x2fe80b) {
    return { nodeIntegration: false, contextIsolation: true, sandbox: true, partition: _0x2fe80b };
  }
  function _0x4e4462(_0x942a0 = []) {
    if (!Array.isArray(_0x942a0)) return '';
    for (const _0x5d2284 of _0x942a0) {
      const _0x32b075 = normalizeWebPreviewFaviconUrl(_0x5d2284);
      if (_0x32b075) return _0x32b075;
    }
    return '';
  }
  function _0x3ffd65(_0x51549d) {
    if (!_0x51549d?.readySnapshotTimer) return;
    (clearTimeoutFn?.(_0x51549d.readySnapshotTimer), (_0x51549d.readySnapshotTimer = null));
  }
  function _0x43c9ed(
    _0x2cf322,
    _0x4dd7a2,
    _0x1b1a02,
    _0x29aa5e,
    _0xca8841 = '',
    _0x5e06ba = _0x4dd7a2?.snapshotEpoch || 0,
  ) {
    const _0x509720 = _0x4dd7a2?.view?.webContents;
    if (!_0x509720 || _0x509720.isDestroyed?.()) return false;
    if (typeof _0x509720.capturePage !== 'function') return false;
    const _0x68023d = _0xca8841 || _0x4dd7a2?.url || _0x4dd7a2?.requestedUrl || '';
    let _0x41ff69 = null;
    try {
      _0x41ff69 = _0x509720.capturePage();
    } catch (_0x15689e) {
      return (
        _0x58bf66?.({
          type: 'web_preview.snapshot_failed',
          level: 'warn',
          source: 'main',
          message: 'Web preview snapshot capture failed',
          error: _0x15689e,
          context: { nodeId: _0x2cf322, freezeToken: _0x1b1a02 },
        }),
        false
      );
    }
    return (
      Promise.resolve(_0x41ff69)
        .then((_0xe625f4) => {
          const _0xa4505c = _0xe625f4?.toDataURL?.();
          if (!_0xa4505c) return;
          if (_0x4dd7a2 && _0x4dd7a2.snapshotEpoch !== _0x5e06ba) return;
          if (_0x68023d && _0x4dd7a2?.requestedUrl && _0x4dd7a2.requestedUrl !== _0x68023d) return;
          ((_0x4dd7a2.hasSnapshot = true),
            (_0x4dd7a2.snapshotUrl = _0x68023d),
            (_0x4dd7a2.snapshotFreezeToken = String(_0x1b1a02 || '')),
            _0x1d234c(
              _0x2cf322,
              {
                type: 'snapshot',
                dataUrl: _0xa4505c,
                freezeToken: _0x1b1a02,
                width: _0x4dd7a2.bounds?.width || 0,
                height: _0x4dd7a2.bounds?.height || 0,
              },
              _0x4dd7a2.tabId,
            ));
        })
        .catch((_0xcd3b2) => {
          _0x58bf66?.({
            type: 'web_preview.snapshot_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview snapshot capture failed',
            error: _0xcd3b2,
            context: { nodeId: _0x2cf322, freezeToken: _0x1b1a02 },
          });
        })
        .finally(() => {
          _0x29aa5e?.();
        }),
      true
    );
  }
  function _0x4bacd8(_0x25a671, _0x4a4b52, _0x9ac552 = _0x4a4b52?.snapshotEpoch || 0) {
    const _0x3bf7de = _0x4a4b52?.url || _0x4a4b52?.requestedUrl || '';
    if (!_0x4a4b52?.bounds || !_0x3bf7de || _0x4a4b52.readySnapshotPending) return false;
    if (_0x4a4b52.hasSnapshot && _0x4a4b52.snapshotUrl === _0x3bf7de) return false;
    _0x4a4b52.readySnapshotPending = true;
    const _0x41c121 = _0x43c9ed(
      _0x25a671,
      _0x4a4b52,
      'ready',
      () => {
        _0x4a4b52.readySnapshotPending = false;
      },
      _0x3bf7de,
      _0x9ac552,
    );
    if (!_0x41c121) _0x4a4b52.readySnapshotPending = false;
    return _0x41c121;
  }
  function _0x48366a(_0x217c4c, _0x2ccba1) {
    const _0x371759 = _0x2ccba1?.url || _0x2ccba1?.requestedUrl || '';
    if (
      !_0x2ccba1?.loaded ||
      !_0x2ccba1.bounds ||
      !_0x371759 ||
      _0x2ccba1.visible !== true ||
      _0x2ccba1.freezeToken ||
      _0x2ccba1.readySnapshotPending ||
      _0x2ccba1.readySnapshotTimer
    )
      return false;
    if (_0x2ccba1.hasSnapshot && _0x2ccba1.snapshotUrl === _0x371759) return false;
    if (typeof setTimeoutFn !== 'function') return _0x4bacd8(_0x217c4c, _0x2ccba1);
    const _0x19b731 = _0x2ccba1.snapshotEpoch,
      _0x4df026 = Math.max(0, Number(readySnapshotDelayMs) || 0);
    return (
      (_0x2ccba1.readySnapshotTimer = setTimeoutFn(() => {
        _0x2ccba1.readySnapshotTimer = null;
        const _0x201b1a = _0x1c905a.get(toEntryKey(_0x217c4c, _0x2ccba1.tabId)),
          _0x26fa29 = _0x201b1a?.url || _0x201b1a?.requestedUrl || '';
        if (
          _0x201b1a !== _0x2ccba1 ||
          _0x201b1a.snapshotEpoch !== _0x19b731 ||
          _0x26fa29 !== _0x371759 ||
          _0x201b1a.loaded !== true ||
          _0x201b1a.visible !== true
        )
          return;
        if (_0x201b1a.freezeToken) {
          _0x48366a(_0x217c4c, _0x201b1a);
          return;
        }
        _0x4bacd8(_0x217c4c, _0x201b1a, _0x19b731);
      }, _0x4df026)),
      true
    );
  }
  function _0x1c562e(_0x2e0d0d, _0x6782a4, _0x126b1c = '', _0x260861 = '') {
    if (typeof _0x6782a4?.executeJavaScript !== 'function') return;
    _0x6782a4
      .executeJavaScript(
        buildWebPreviewDragBridgeScript({ nodeId: _0x2e0d0d, tabId: _0x126b1c, inputBridgeToken: _0x260861 }),
        true,
      )
      .catch((_0x4e81f5) => {
        _0x58bf66?.({
          type: 'web_preview.drag_bridge_failed',
          level: 'warn',
          source: 'main',
          message: 'Web preview drag bridge injection failed',
          error: _0x4e81f5,
          context: { nodeId: _0x2e0d0d, tabId: _0x126b1c },
        });
      });
  }
  function _0x11dc9a(
    _0x10834d,
    _0x38851e,
    _0x2b3ef5,
    _0x590174 = {},
    _0x9a6a75 = WEB_PREVIEW_TEXT_ACTION_PROMPT,
  ) {
    const _0x4cd87a = String(_0x590174?.selectionText || '').trim();
    if (!_0x4cd87a) return false;
    const _0x44236b = _0x1c905a.get(toEntryKey(_0x10834d, _0x38851e)),
      _0x207e51 =
        normalizeWebPreviewUrl(_0x590174?.pageURL) ||
        normalizeWebPreviewUrl(_0x44236b?.url) ||
        normalizeWebPreviewUrl(_0x44236b?.requestedUrl) ||
        '',
      _0x1ad6e0 = String(_0x2b3ef5?.getTitle?.() || '').trim();
    return (
      _0x1d234c(
        _0x10834d,
        {
          type: _0x9a6a75,
          text: _0x4cd87a.slice(0, WEB_PREVIEW_SELECTED_TEXT_LIMIT),
          pageUrl: _0x207e51,
          webSourceTitle: _0x1ad6e0.slice(0, 160),
          contextX: Math.max(0, Math.round(Number(_0x590174?.x || 0) || 0)),
          contextY: Math.max(0, Math.round(Number(_0x590174?.y || 0) || 0)),
        },
        _0x38851e,
      ),
      true
    );
  }
  function _0x3b0073(_0x5b92f3, _0x4a95d3 = {}) {
    const _0x341a95 = String(_0x4a95d3?.selectionText || '').trim();
    if (!_0x341a95) return false;
    try {
      if (typeof _0x5b92f3?.copy === 'function') return (_0x5b92f3.copy(), true);
    } catch {}
    return false;
  }
  function _0x22062d(_0x4efb15) {
    return Math.max(0, Math.round(Number(_0x4efb15 || 0) || 0));
  }
  function _0x1590b6(_0x82a6ad = {}, _0xbada99 = null) {
    const _0x251f1b =
      normalizeWebPreviewUrl(_0x82a6ad?.pageUrl) ||
      normalizeWebPreviewUrl(_0x82a6ad?.sourceUrl) ||
      normalizeWebPreviewUrl(_0xbada99?.url) ||
      normalizeWebPreviewUrl(_0xbada99?.requestedUrl) ||
      '';
    return {
      mediaType: 'image',
      srcURL: normalizeWebPreviewUrl(_0x82a6ad?.url) || '',
      titleText: String(_0x82a6ad?.title || _0x82a6ad?.alt || '')
        .trim()
        .slice(0, 160),
      pageURL: _0x251f1b,
      frameURL: _0x251f1b,
      x: _0x22062d(_0x82a6ad?.contextX ?? _0x82a6ad?.clientX),
      y: _0x22062d(_0x82a6ad?.contextY ?? _0x82a6ad?.clientY),
    };
  }
  function _0x14012e(_0x5dc544, _0x277b8b = {}) {
    if (!_0x5dc544) return;
    ((_0x5dc544.lastBridgeImageContextMenuAt = Date.now()),
      (_0x5dc544.lastBridgeImageContextMenuX = _0x22062d(_0x277b8b?.x)),
      (_0x5dc544.lastBridgeImageContextMenuY = _0x22062d(_0x277b8b?.y)));
  }
  function _0xc484e6(_0x18be15, _0x5592ba = {}) {
    const _0x272c81 = Number(_0x18be15?.lastBridgeImageContextMenuAt || 0);
    if (!_0x272c81 || Date.now() - _0x272c81 > WEB_PREVIEW_CONTEXT_MENU_BRIDGE_DEDUPE_MS) return false;
    const _0x5c2cbf = _0x22062d(_0x5592ba?.x),
      _0x2e38a0 = _0x22062d(_0x5592ba?.y);
    return (
      Math.abs(_0x5c2cbf - _0x22062d(_0x18be15?.lastBridgeImageContextMenuX)) <= 2 &&
      Math.abs(_0x2e38a0 - _0x22062d(_0x18be15?.lastBridgeImageContextMenuY)) <= 2
    );
  }
  function _0x166451(_0xdce18d, _0x2b4599, _0x5767c6, _0x4f046c = {}, _0x496151 = null) {
    const _0xe50aec = String(_0x4f046c?.mediaType || '').toLowerCase() === 'image' || Boolean(_0x496151?.url);
    if (!_0xe50aec) return null;
    const _0x1a34cf = normalizeWebPreviewUrl(_0x496151?.url || _0x4f046c?.srcURL);
    if (!_0x1a34cf) return null;
    const _0x1d464e = _0x1c905a.get(toEntryKey(_0xdce18d, _0x2b4599)),
      _0x42dcc4 =
        normalizeWebPreviewUrl(_0x496151?.pageUrl) ||
        normalizeWebPreviewUrl(_0x4f046c?.pageURL) ||
        normalizeWebPreviewUrl(_0x4f046c?.frameURL) ||
        normalizeWebPreviewUrl(_0x1d464e?.url) ||
        normalizeWebPreviewUrl(_0x1d464e?.requestedUrl) ||
        '',
      _0x271998 = String(_0x496151?.pageTitle || _0x5767c6?.getTitle?.() || '')
        .trim()
        .slice(0, 160),
      _0x461b2b = String(
        _0x496151?.title || _0x496151?.alt || _0x4f046c?.titleText || _0x271998 || '网页图片',
      )
        .trim()
        .slice(0, 160),
      _0x2e1e3b = {
        kind: 'image',
        url: _0x1a34cf,
        title: _0x461b2b,
        pageUrl: _0x42dcc4,
        pageTitle: _0x271998,
        nodeId: _0xdce18d,
        tabId: _0x2b4599,
        contextX: Math.max(0, Math.round(Number(_0x4f046c?.x || 0) || 0)),
        contextY: Math.max(0, Math.round(Number(_0x4f046c?.y || 0) || 0)),
      },
      _0xc93ef5 = Math.max(0, Math.round(Number(_0x496151?.width || 0) || 0)),
      _0x428141 = Math.max(0, Math.round(Number(_0x496151?.height || 0) || 0));
    if (_0xc93ef5) _0x2e1e3b.width = _0xc93ef5;
    if (_0x428141) _0x2e1e3b.height = _0x428141;
    return _0x2e1e3b;
  }
  async function _0x1057ab(_0xcace14, _0x2ac15a, _0x5c9c84, _0x15d0c0 = {}) {
    if (typeof _0x5c9c84?.executeJavaScript !== 'function') return null;
    try {
      const _0x3e231c = await _0x5c9c84.executeJavaScript(
          buildWebPreviewContextImageProbeScript({
            nodeId: _0xcace14,
            tabId: _0x2ac15a,
            x: _0x15d0c0?.x,
            y: _0x15d0c0?.y,
          }),
          true,
        ),
        _0x44c938 = _0x3e231c?.image && typeof _0x3e231c.image === 'object' ? _0x3e231c.image : _0x3e231c;
      return _0x166451(_0xcace14, _0x2ac15a, _0x5c9c84, _0x15d0c0, _0x44c938);
    } catch (_0x395512) {
      return (
        _0x58bf66?.({
          type: 'web_preview.context_image_probe_failed',
          level: 'warn',
          source: 'main',
          message: 'Web preview context image probe failed',
          error: _0x395512,
          context: { nodeId: _0xcace14, tabId: _0x2ac15a },
        }),
        null
      );
    }
  }
  async function _0x1f568d(_0xff0eb9, _0x28b325, _0x127f35, _0x3f5954 = {}) {
    if (String(_0x3f5954?.mediaType || '').toLowerCase() !== 'image') return null;
    const _0xff25 = await _0x1057ab(_0xff0eb9, _0x28b325, _0x127f35, _0x3f5954);
    return _0xff25 || _0x166451(_0xff0eb9, _0x28b325, _0x127f35, _0x3f5954);
  }
  function _0x3d099e(_0x143ee5, _0xd2324a, _0x1b8d64, _0x875e1 = 'send-image-to-canvas') {
    if (!_0x1b8d64) return false;
    return (_0x1d234c(_0x143ee5, { ..._0x1b8d64, type: _0x875e1 }, _0xd2324a), true);
  }
  async function _0x5ad7e3(_0x5f445f, _0x282a4c, _0x1a6073, _0x55562e = {}) {
    if (typeof _0x215916 !== 'function') return;
    const _0x31890 = [],
      _0x453203 = await _0x1f568d(_0x5f445f, _0x282a4c, _0x1a6073, _0x55562e);
    _0x453203 &&
      _0x31890.push(
        {
          label: '加入到画布',
          click: () => _0x3d099e(_0x5f445f, _0x282a4c, _0x453203, 'send-image-to-canvas'),
        },
        {
          label: '反推提示词-创建',
          click: () => _0x3d099e(_0x5f445f, _0x282a4c, _0x453203, 'reverse-image-prompt'),
        },
        {
          label: '反推提示词-生成',
          click: () => _0x3d099e(_0x5f445f, _0x282a4c, _0x453203, 'reverse-image-prompt-generate'),
        },
      );
    const _0x1e1603 = String(_0x55562e?.selectionText || '').trim();
    if (_0x1e1603) {
      if (_0x31890.length) _0x31890.push({ type: 'separator' });
      _0x31890.push(
        { label: '复制文本', click: () => _0x3b0073(_0x1a6073, _0x55562e) },
        {
          label: '发送到文本节点',
          submenu: [
            {
              label: '源节点',
              click: () =>
                _0x11dc9a(_0x5f445f, _0x282a4c, _0x1a6073, _0x55562e, WEB_PREVIEW_TEXT_ACTION_SOURCE),
            },
            {
              label: '生成文本',
              click: () =>
                _0x11dc9a(_0x5f445f, _0x282a4c, _0x1a6073, _0x55562e, WEB_PREVIEW_TEXT_ACTION_PROMPT),
            },
          ],
        },
        {
          label: '发送到图像节点',
          submenu: [
            {
              label: '创建',
              click: () =>
                _0x11dc9a(_0x5f445f, _0x282a4c, _0x1a6073, _0x55562e, WEB_PREVIEW_TEXT_ACTION_IMAGE_PROMPT),
            },
            {
              label: '生成',
              click: () =>
                _0x11dc9a(
                  _0x5f445f,
                  _0x282a4c,
                  _0x1a6073,
                  _0x55562e,
                  WEB_PREVIEW_TEXT_ACTION_IMAGE_PROMPT_GENERATE,
                ),
            },
          ],
        },
        {
          label: '发送到视频节点',
          submenu: [
            {
              label: '创建',
              click: () =>
                _0x11dc9a(_0x5f445f, _0x282a4c, _0x1a6073, _0x55562e, WEB_PREVIEW_TEXT_ACTION_VIDEO_PROMPT),
            },
            {
              label: '生成',
              click: () =>
                _0x11dc9a(
                  _0x5f445f,
                  _0x282a4c,
                  _0x1a6073,
                  _0x55562e,
                  WEB_PREVIEW_TEXT_ACTION_VIDEO_PROMPT_GENERATE,
                ),
            },
          ],
        },
      );
    }
    if (!_0x31890.length) return;
    const _0x27e664 = _0x215916(_0x31890);
    _0x27e664?.popup?.({ window: _0x5dc532() });
  }
  function _0x3d29e9(_0x290681, _0x5898e9, _0x294b26, _0x79c90) {
    if (!_0x294b26?.isPopup || _0x294b26.popupOpened || !_0x79c90) return false;
    return (
      (_0x294b26.popupOpened = true),
      (_0x294b26.pendingPopup = false),
      (_0x294b26.url = _0x79c90),
      (_0x294b26.requestedUrl = _0x79c90),
      _0x1d234c(
        _0x290681,
        { type: 'open-popup', url: _0x79c90, popupTabId: _0x5898e9 },
        _0x294b26.openerTabId || '',
      ),
      true
    );
  }
  function _0x3a3360(_0x3cc126, _0x5f17c2, _0x42c41c) {
    if (!_0x42c41c?.isPopup || _0x42c41c.popupOpened) return false;
    return (
      (_0x42c41c.popupOpened = true),
      (_0x42c41c.pendingPopup = true),
      (_0x42c41c.url = ''),
      (_0x42c41c.requestedUrl = ''),
      _0x1d234c(
        _0x3cc126,
        { type: 'open-popup', url: '', popupTabId: _0x5f17c2, pendingPopup: true },
        _0x42c41c.openerTabId || '',
      ),
      true
    );
  }
  function _0xa8aae3(_0x3ab0b3) {
    const _0xbc3f15 = _0x5dc532(),
      _0x32f241 = {
        parent: _0xbc3f15 || undefined,
        modal: false,
        show: true,
        width: WEB_PREVIEW_AUTH_POPUP_WIDTH,
        height: WEB_PREVIEW_AUTH_POPUP_HEIGHT,
        minWidth: WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH,
        minHeight: WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT,
        title: 'Login',
        autoHideMenuBar: true,
        webPreferences: _0x498445(_0x3ab0b3),
      },
      _0x3bf8b3 = _0xbc3f15?.getBounds?.();
    if (
      _0x3bf8b3 &&
      Number.isFinite(_0x3bf8b3.x) &&
      Number.isFinite(_0x3bf8b3.y) &&
      Number.isFinite(_0x3bf8b3.width) &&
      Number.isFinite(_0x3bf8b3.height) &&
      _0x3bf8b3.width > WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH &&
      _0x3bf8b3.height > WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT
    ) {
      const _0x5178d0 = Math.min(
          WEB_PREVIEW_AUTH_POPUP_WIDTH,
          Math.max(WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH, _0x3bf8b3.width - 48),
        ),
        _0x39cb6d = Math.min(
          WEB_PREVIEW_AUTH_POPUP_HEIGHT,
          Math.max(WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT, _0x3bf8b3.height - 48),
        );
      ((_0x32f241.width = _0x5178d0),
        (_0x32f241.height = _0x39cb6d),
        (_0x32f241.x = Math.round(_0x3bf8b3.x + (_0x3bf8b3.width - _0x5178d0) / 2)),
        (_0x32f241.y = Math.round(_0x3bf8b3.y + (_0x3bf8b3.height - _0x39cb6d) / 2)));
    }
    return _0x32f241;
  }
  function _0x25b490(_0xd39145 = () => true) {
    for (const _0x3859d2 of [..._0x3606bd]) {
      if (_0xd39145(_0x3859d2)) _0x3606bd.delete(_0x3859d2);
    }
    for (const _0x5510ca of [..._0x12e803]) {
      if (!_0xd39145(_0x5510ca)) continue;
      _0x12e803.delete(_0x5510ca);
      try {
        _0x5510ca.popupWindow?.isDestroyed?.() !== true && _0x5510ca.popupWindow?.close?.();
      } catch {}
    }
  }
  function _0x55abeb() {
    const _0x4194e7 = Date.now();
    for (const _0x24036d of [..._0x3606bd]) {
      if (_0x24036d.expiresAt <= _0x4194e7) _0x3606bd.delete(_0x24036d);
    }
  }
  function _0x26304f({ nodeId: _0x22d63f, tabId: _0x3c473a, partition: _0x48ad32 }) {
    _0x55abeb();
    const _0xbb37d4 = {
      nodeId: _0x22d63f,
      tabId: _0x3c473a,
      partition: _0x48ad32,
      expiresAt: Date.now() + WEB_PREVIEW_AUTH_POPUP_REQUEST_TTL_MS,
    };
    return (_0x3606bd.add(_0xbb37d4), _0xbb37d4);
  }
  function _0x5065da({ nodeId: _0x3344ab, tabId: _0x8c8766, url: _0x2e8539 }) {
    _0x55abeb();
    let _0x6d1537 = null;
    for (const _0x43c0a3 of _0x3606bd) {
      if (_0x43c0a3.nodeId !== _0x3344ab || _0x43c0a3.tabId !== _0x8c8766) continue;
      _0x6d1537 = _0x43c0a3;
      if (shouldUseNativeAuthPopup(_0x2e8539)) break;
    }
    if (_0x6d1537) _0x3606bd.delete(_0x6d1537);
    return _0x6d1537;
  }
  function _0x162ea0({ nodeId: _0x52ba67, tabId: _0x24333d, partition: _0x2e0d2a, webContents: _0x22cc2d }) {
    _0x22cc2d.setWindowOpenHandler?.(({ url: _0x4c3701 } = {}) => {
      const _0x1d5c6c = normalizeWebPreviewUrl(_0x4c3701);
      if (!_0x1d5c6c && !isBlankPopupUrl(_0x4c3701))
        return (_0x2effdd(_0x52ba67, _0x4c3701, _0x24333d), { action: 'deny' });
      return {
        action: 'allow',
        outlivesOpener: true,
        overrideBrowserWindowOptions: { webPreferences: _0x498445(_0x2e0d2a) },
      };
    });
    const _0x1bcb5f = (_0x5b4996, _0x408dc3) => {
        if (isBlankPopupUrl(_0x408dc3) || normalizeWebPreviewUrl(_0x408dc3)) return;
        (_0x5b4996?.preventDefault?.(), _0x2effdd(_0x52ba67, _0x408dc3, _0x24333d));
      },
      _0x4df50d = (_0x1829a7, _0x2a068c, ..._0x16c16b) => {
        const _0x344b53 = _0x16c16b.some((_0x2d783f) => _0x2d783f === true);
        if (!_0x344b53) return;
        _0x1bcb5f(_0x1829a7, _0x2a068c);
      };
    (_0x22cc2d.on?.('will-navigate', _0x1bcb5f),
      _0x22cc2d.on?.('will-frame-navigate', _0x4df50d),
      _0x22cc2d.on?.('did-fail-load', (_0xdb9ea6, _0x1ed6df, _0x4e6354, _0x549ffb) => {
        _0x1d234c(
          _0x52ba67,
          {
            type: 'failed',
            url: String(_0x549ffb || ''),
            errorCode: _0x1ed6df,
            message: String(_0x4e6354 || 'Login popup load failed'),
          },
          _0x24333d,
        );
      }));
    const _0x5622f9 = _0x22cc2d.session;
    (_0x5622f9?.setPermissionRequestHandler?.((_0x3f1e70, _0x65bc67, _0x47e2b3) => {
      _0x47e2b3(false);
    }),
      _0x5622f9?.on?.('will-download', (_0x4b3513) => {
        _0x4b3513?.preventDefault?.();
      }));
  }
  function _0x572875({ nodeId: _0x7f24ac, tabId: _0x2a9eaa, partition: _0x39a0b1, popupWindow: _0x502c9a }) {
    const _0x2c4ab0 = _0x502c9a?.webContents;
    if (!_0x502c9a || !_0x2c4ab0) return false;
    const _0x31b714 = { nodeId: _0x7f24ac, tabId: _0x2a9eaa, popupWindow: _0x502c9a };
    _0x12e803.add(_0x31b714);
    const _0x34fcfb = () => _0x12e803.delete(_0x31b714);
    return (
      _0x502c9a.on?.('closed', _0x34fcfb),
      _0x2c4ab0.on?.('destroyed', _0x34fcfb),
      _0x162ea0({ nodeId: _0x7f24ac, tabId: _0x2a9eaa, partition: _0x39a0b1, webContents: _0x2c4ab0 }),
      true
    );
  }
  function _0x353ff1(_0x42a8eb, _0x1b318f, _0x40e4f6, _0x1f23bd = '') {
    (_0x40e4f6.setWindowOpenHandler?.(({ url: _0x31d705 } = {}) => {
      const _0x1daafe = normalizeWebPreviewUrl(_0x31d705),
        _0x2528ab = isBlankPopupUrl(_0x31d705);
      if (!_0x1daafe && !_0x2528ab) return (_0x2effdd(_0x42a8eb, _0x31d705, _0x1b318f), { action: 'deny' });
      const _0x3f10a8 = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f)),
        _0x460f7b = _0x2c7d3b(_0x42a8eb),
        _0xe47a71 = _0x3f10a8?.browserProfileId || DEFAULT_WEB_PREVIEW_BROWSER_PROFILE_ID,
        _0x177c0f = _0x3f10a8?.partition || toPersistentPartitionId(_0xe47a71);
      if (shouldUseNativeAuthPopup(_0x31d705) && typeof _0x34553a === 'function')
        return (
          _0x26304f({ nodeId: _0x42a8eb, tabId: _0x1b318f, partition: _0x177c0f }),
          { action: 'allow', outlivesOpener: true, overrideBrowserWindowOptions: _0xa8aae3(_0x177c0f) }
        );
      if (typeof _0x355d44 !== 'function') {
        if (_0x1daafe) _0x1d234c(_0x42a8eb, { type: 'open-popup', url: _0x1daafe }, _0x1b318f);
        return { action: 'deny' };
      }
      return {
        action: 'allow',
        outlivesOpener: true,
        overrideBrowserWindowOptions: { webPreferences: _0x498445(_0x177c0f) },
        createWindow: () => {
          const _0xaf7251 = _0x275599({
            nodeId: _0x42a8eb,
            tabId: _0x460f7b,
            browserProfileId: _0xe47a71,
            partition: _0x177c0f,
            url: _0x1daafe || '',
            openerTabId: _0x1b318f,
          });
          if (_0x1daafe) _0x3d29e9(_0x42a8eb, _0x460f7b, _0xaf7251, _0x1daafe);
          else _0x3a3360(_0x42a8eb, _0x460f7b, _0xaf7251);
          return _0xaf7251.view.webContents;
        },
      };
    }),
      _0x40e4f6.on?.('did-create-window', (_0x25d916, _0x1f6973 = {}) => {
        const _0x334e63 = _0x5065da({ nodeId: _0x42a8eb, tabId: _0x1b318f, url: _0x1f6973?.url });
        if (!_0x334e63) return;
        _0x572875({
          nodeId: _0x42a8eb,
          tabId: _0x1b318f,
          partition: _0x334e63.partition,
          popupWindow: _0x25d916,
        });
      }));
    const _0x1eb29f = (_0x496851, _0xda85e2) => {
        const _0x1fd1b4 = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        if (_0x1fd1b4?.isPopup && isBlankPopupUrl(_0xda85e2) && !_0x1fd1b4.requestedUrl) return;
        if (normalizeWebPreviewUrl(_0xda85e2)) return;
        (_0x496851?.preventDefault?.(), _0x2effdd(_0x42a8eb, _0xda85e2, _0x1b318f));
      },
      _0x2eff02 = (_0xe5fdb5, _0x22d7c7, ..._0x48f7dd) => {
        const _0x3dbb35 = _0x48f7dd.some((_0x3de78a) => _0x3de78a === true);
        if (!_0x3dbb35) return;
        _0x1eb29f(_0xe5fdb5, _0x22d7c7);
      };
    (_0x40e4f6.on?.('will-navigate', _0x1eb29f),
      _0x40e4f6.on?.('will-frame-navigate', _0x2eff02),
      _0x40e4f6.on?.('dom-ready', () => _0x1c562e(_0x42a8eb, _0x40e4f6, _0x1b318f, _0x1f23bd)),
      _0x40e4f6.on?.('did-start-loading', () => {
        const _0x26765b = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        let _0x4f0084 = '',
          _0xe477a4 = false;
        if (_0x26765b) {
          const _0x449ec5 = _0x26765b.url || _0x26765b.requestedUrl || '';
          _0x4f0084 = _0x449ec5;
          const _0x2d24a6 =
            _0x26765b.holdSnapshotOnNextLoadStart === true &&
            _0x26765b.hasSnapshot === true &&
            _0x26765b.snapshotUrl &&
            _0x26765b.snapshotUrl === _0x449ec5;
          ((_0xe477a4 = Boolean(_0x2d24a6)),
            _0x3ffd65(_0x26765b),
            (_0x26765b.snapshotEpoch += 1),
            (_0x26765b.loaded = false),
            _0xe477a4
              ? (_0x26765b.snapshotStaleAfterLoad = true)
              : ((_0x26765b.hasSnapshot = false),
                (_0x26765b.snapshotUrl = ''),
                (_0x26765b.snapshotFreezeToken = ''),
                (_0x26765b.snapshotStaleAfterLoad = false)),
            (_0x26765b.readySnapshotPending = false),
            (_0x26765b.holdSnapshotOnNextLoadStart = false));
        }
        _0x1d234c(_0x42a8eb, { type: 'loading', url: _0x4f0084, holdSnapshot: _0xe477a4 }, _0x1b318f);
      }),
      _0x40e4f6.on?.('did-stop-loading', () => {
        (_0x1c562e(_0x42a8eb, _0x40e4f6, _0x1b318f, _0x1f23bd),
          _0x1d234c(_0x42a8eb, { type: 'loaded' }, _0x1b318f),
          _0x2086ef(_0x42a8eb, _0x40e4f6, _0x1b318f));
        const _0x3dc90a = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        _0x3dc90a &&
          ((_0x3dc90a.loaded = true),
          _0x3dc90a.snapshotStaleAfterLoad &&
            ((_0x3dc90a.hasSnapshot = false),
            (_0x3dc90a.snapshotUrl = ''),
            (_0x3dc90a.snapshotFreezeToken = ''),
            (_0x3dc90a.snapshotStaleAfterLoad = false)),
          _0x48366a(_0x42a8eb, _0x3dc90a));
      }),
      _0x40e4f6.on?.('did-fail-load', (_0x55d131, _0x23dcea, _0x508011, _0x26301b) => {
        _0x1d234c(
          _0x42a8eb,
          {
            type: 'failed',
            url: String(_0x26301b || ''),
            errorCode: _0x23dcea,
            message: String(_0x508011 || '网页加载失败'),
          },
          _0x1b318f,
        );
      }),
      _0x40e4f6.on?.('did-navigate', (_0x1d7286, _0x56116e) => {
        const _0x3c328e = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        if (_0x3c328e?.isPopup && isBlankPopupUrl(_0x56116e) && !_0x3c328e.requestedUrl) return;
        const _0xbd3f10 = normalizeWebPreviewUrl(_0x56116e) || String(_0x56116e || ''),
          _0x5ae8d8 = normalizeWebPreviewUrl(_0xbd3f10);
        if (_0x3c328e && _0x5ae8d8) {
          if (_0x3d29e9(_0x42a8eb, _0x1b318f, _0x3c328e, _0x5ae8d8)) return;
          const _0x557d51 = _0x3c328e.pendingPopup === true;
          _0x3c328e.url = _0x5ae8d8;
          if (_0x557d51) _0x3c328e.requestedUrl = _0x5ae8d8;
          ((_0x3c328e.loadIssuedUrl = _0x5ae8d8), (_0x3c328e.pendingPopup = false));
        }
        (_0x1d234c(_0x42a8eb, { type: 'navigated', url: _0xbd3f10 }, _0x1b318f),
          _0x2086ef(_0x42a8eb, _0x40e4f6, _0x1b318f));
      }),
      _0x40e4f6.on?.('did-navigate-in-page', (_0x4ed6a4, _0x52850f, _0x277b27) => {
        if (_0x277b27 === false) return;
        const _0x3d4324 = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        if (_0x3d4324?.isPopup && isBlankPopupUrl(_0x52850f) && !_0x3d4324.requestedUrl) return;
        const _0x59ab99 = normalizeWebPreviewUrl(_0x52850f) || String(_0x52850f || ''),
          _0xef71e = normalizeWebPreviewUrl(_0x59ab99);
        if (_0x3d4324 && _0xef71e) {
          if (_0x3d29e9(_0x42a8eb, _0x1b318f, _0x3d4324, _0xef71e)) return;
          const _0x33db1d = _0x3d4324.pendingPopup === true;
          _0x3d4324.url = _0xef71e;
          if (_0x33db1d) _0x3d4324.requestedUrl = _0xef71e;
          ((_0x3d4324.loadIssuedUrl = _0xef71e), (_0x3d4324.pendingPopup = false));
        }
        (_0x1d234c(_0x42a8eb, { type: 'navigated', url: _0x59ab99 }, _0x1b318f),
          _0x2086ef(_0x42a8eb, _0x40e4f6, _0x1b318f));
      }),
      _0x40e4f6.on?.('page-favicon-updated', (_0x13fefe, _0x4dece1) => {
        const _0x10f672 = _0x4e4462(_0x4dece1);
        if (!_0x10f672) return;
        _0x1d234c(_0x42a8eb, { type: 'favicon', faviconUrl: _0x10f672 }, _0x1b318f);
      }),
      _0x40e4f6.on?.('context-menu', (_0x5528fe, _0x4dd48f) => {
        const _0x9d85ea = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        if (_0xc484e6(_0x9d85ea, _0x4dd48f)) return;
        void _0x5ad7e3(_0x42a8eb, _0x1b318f, _0x40e4f6, _0x4dd48f).catch((_0x5cf492) => {
          _0x58bf66?.({
            type: 'web_preview.context_menu_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview context menu failed',
            error: _0x5cf492,
            context: { nodeId: _0x42a8eb, tabId: _0x1b318f },
          });
        });
      }),
      _0x40e4f6.on?.('console-message', (..._0x524db1) => {
        const _0x3e2ff5 = parseWebPreviewInputBridgeMessage(getConsoleMessageFromArgs(_0x524db1));
        if (!_0x3e2ff5) return;
        const _0xeaae87 = _0x1c905a.get(toEntryKey(_0x42a8eb, _0x1b318f));
        if (!_0xeaae87 || _0x3e2ff5.token !== _0xeaae87.inputBridgeToken) return;
        if (_0x3e2ff5.type === 'image-context-menu') {
          const _0xee9309 = _0x1590b6(_0x3e2ff5, _0xeaae87);
          (_0x14012e(_0xeaae87, _0xee9309),
            void _0x5ad7e3(_0x42a8eb, _0x1b318f, _0x40e4f6, _0xee9309).catch((_0x22143d) => {
              _0x58bf66?.({
                type: 'web_preview.context_menu_failed',
                level: 'warn',
                source: 'main',
                message: 'Web preview context menu failed',
                error: _0x22143d,
                context: { nodeId: _0x42a8eb, tabId: _0x1b318f, source: 'bridge' },
              });
            }));
          return;
        }
        const _0x870033 = Number(_0x3e2ff5.button),
          _0x346b62 = _0x870033 === 1,
          _0x5beb5b = _0x870033 === 0 && (_0x3e2ff5.spaceHeld === true || _0xeaae87.canvasSpaceHeld === true);
        if (!_0x346b62 && !_0x5beb5b) return;
        _0x1d234c(
          _0x42a8eb,
          {
            type: 'pan-start-preview',
            source: 'web-contents-view',
            button: _0x870033,
            spaceHeld: _0x5beb5b,
            clientX: Math.max(0, Math.round(Number(_0x3e2ff5.clientX || 0) || 0)),
            clientY: Math.max(0, Math.round(Number(_0x3e2ff5.clientY || 0) || 0)),
          },
          _0x1b318f,
        );
      }),
      _0x40e4f6.on?.('destroyed', () => {
        const _0x2ead5f = toEntryKey(_0x42a8eb, _0x1b318f),
          _0x5606a3 = _0x1c905a.get(_0x2ead5f);
        if (!_0x5606a3 || _0x5606a3.disposing) return;
        const _0x2a0862 = _0x5dc532();
        try {
          _0x2a0862?.contentView?.removeChildView?.(_0x5606a3.view);
        } catch {}
        (_0x3ffd65(_0x5606a3), _0x1c905a.delete(_0x2ead5f));
        if (_0x5606a3.isPopup) _0x1d234c(_0x42a8eb, { type: 'closed' }, _0x1b318f);
      }));
    const _0x47b492 = _0x40e4f6.session;
    (_0x47b492?.setPermissionRequestHandler?.((_0x13bbe0, _0x327868, _0x1a178d) => {
      _0x1a178d(false);
    }),
      _0x47b492?.on?.('will-download', (_0x437b6a) => {
        _0x437b6a?.preventDefault?.();
      }));
  }
  function _0x2ad4a7({
    nodeId: _0x5f0fde,
    tabId: _0x35e0ee,
    browserProfileId: _0x355de2,
    partition: _0x3bfd4d,
    view: _0x545ecb,
    url: url = '',
    isPopup: isPopup = false,
    openerTabId: openerTabId = '',
    pendingRegistrationUntil: pendingRegistrationUntil = 0,
  }) {
    _0x545ecb.setVisible?.(false);
    const _0x168fae = createInputBridgeToken(),
      _0x52fdc8 = {
        nodeId: _0x5f0fde,
        tabId: _0x35e0ee,
        browserProfileId: _0x355de2,
        partition: _0x3bfd4d,
        view: _0x545ecb,
        url: url,
        requestedUrl: url,
        loadIssuedUrl: '',
        attached: false,
        bounds: null,
        visible: false,
        selected: false,
        freezeToken: '',
        snapshotPending: false,
        freezeHiddenWithSnapshot: false,
        readySnapshotPending: false,
        readySnapshotTimer: null,
        holdSnapshotOnNextLoadStart: false,
        snapshotStaleAfterLoad: false,
        snapshotEpoch: 0,
        loaded: false,
        hasSnapshot: false,
        snapshotUrl: '',
        snapshotFreezeToken: '',
        zoomFactor: 1,
        canvasSpaceHeld: false,
        inputBridgeToken: _0x168fae,
        isPopup: isPopup,
        openerTabId: openerTabId,
        popupOpened: !isPopup,
        pendingPopup: false,
        disposing: false,
        pendingRegistrationUntil: pendingRegistrationUntil,
      };
    return (
      _0x1c905a.set(toEntryKey(_0x5f0fde, _0x35e0ee), _0x52fdc8),
      _0x353ff1(_0x5f0fde, _0x35e0ee, _0x545ecb.webContents, _0x168fae),
      _0x52fdc8
    );
  }
  function _0xabe491(_0x2cfd9d, _0x5b5aed, _0x5bd30b) {
    if (typeof _0x355d44 !== 'function') throw new Error('当前 Electron 环境不支持 WebContentsView');
    const _0x2f2c94 = toBrowserProfileId(_0x5bd30b),
      _0x5a6d38 = toPersistentPartitionId(_0x2f2c94),
      _0x47d5ab = new _0x355d44({ webPreferences: _0x498445(_0x5a6d38) });
    return _0x2ad4a7({
      nodeId: _0x2cfd9d,
      tabId: _0x5b5aed,
      browserProfileId: _0x2f2c94,
      partition: _0x5a6d38,
      view: _0x47d5ab,
    });
  }
  function _0x275599({
    nodeId: _0x20108f,
    tabId: _0xa257cc,
    browserProfileId: _0x1ef3e7,
    partition: _0x136719,
    url: _0x4c9509,
    openerTabId: openerTabId = '',
  }) {
    const _0x1da35e = toBrowserProfileId(_0x1ef3e7),
      _0x259073 = _0x136719 || toPersistentPartitionId(_0x1da35e),
      _0x181353 = new _0x355d44({ webPreferences: _0x498445(_0x259073) });
    return _0x2ad4a7({
      nodeId: _0x20108f,
      tabId: _0xa257cc,
      browserProfileId: _0x1da35e,
      partition: _0x259073,
      view: _0x181353,
      url: _0x4c9509,
      isPopup: true,
      openerTabId: openerTabId,
      pendingRegistrationUntil: Date.now() + POPUP_REGISTRATION_GRACE_MS,
    });
  }
  function _0x105729(_0x520b37) {
    const _0x32fb63 = _0x1c905a.get(_0x520b37);
    if (!_0x32fb63) return false;
    const _0x54300c = _0x5dc532();
    _0x25b490((_0x980e3a) => _0x980e3a.nodeId === _0x32fb63.nodeId && _0x980e3a.tabId === _0x32fb63.tabId);
    try {
      _0x54300c?.contentView?.removeChildView?.(_0x32fb63.view);
    } catch {}
    (_0x3ffd65(_0x32fb63),
      (_0x32fb63.attached = false),
      (_0x32fb63.visible = false),
      (_0x32fb63.disposing = true));
    try {
      !_0x32fb63.view?.webContents?.isDestroyed?.() && _0x32fb63.view?.webContents?.destroy?.();
    } catch {}
    return (_0x1c905a.delete(_0x520b37), true);
  }
  function _0x3a676c(_0x633e0b, _0x4ffd44 = null) {
    if (_0x4ffd44 !== null && typeof _0x4ffd44 !== 'undefined')
      return _0x105729(toEntryKey(_0x633e0b, _0x4ffd44));
    let _0x4eb406 = false;
    for (const [_0x3971b2, _0x345564] of [..._0x1c905a]) {
      if (_0x345564.nodeId === _0x633e0b && _0x105729(_0x3971b2)) _0x4eb406 = true;
    }
    return _0x4eb406;
  }
  function _0x327c1e(_0x31262c) {
    const _0x4a2cf8 = _0x1c905a.get(_0x31262c);
    if (!_0x4a2cf8) return;
    _0x4a2cf8.visible !== false && (_0x4a2cf8.view?.setVisible?.(false), (_0x4a2cf8.visible = false));
  }
  async function _0x3b094b(_0x45f938 = {}) {
    const _0x8ed6e0 = _0x5dc532();
    if (!_0x8ed6e0?.contentView) return { ok: false, error: '主窗口尚未就绪' };
    const _0x2c5ad9 = new Set(),
      _0x322874 = getViewsPayload(_0x45f938);
    let _0x1e4fe0 = 0,
      _0x106334 = false;
    const _0x24f220 = [];
    for (const _0x55ca0c of _0x322874) {
      const _0x26df43 = toNodeId(_0x55ca0c?.nodeId);
      if (!_0x26df43) continue;
      const _0x25dde8 = toTabId(_0x55ca0c?.tabId),
        _0xc3d922 = toEntryKey(_0x26df43, _0x25dde8);
      _0x2c5ad9.add(_0xc3d922);
      const _0x532acb = normalizeWebPreviewUrl(_0x55ca0c?.webUrl || _0x55ca0c?.url);
      if (!_0x532acb) {
        if (_0x55ca0c?.pendingPopup === true) {
          const _0x16eb67 = _0x1c905a.get(_0xc3d922);
          if (!_0x16eb67?.isPopup || _0x16eb67.requestedUrl) {
            _0x1d234c(_0x26df43, { type: 'failed', message: '登录窗口尚未就绪' }, _0x25dde8);
            continue;
          }
          if (_0x55ca0c?.visible === false) {
            _0x327c1e(_0xc3d922);
            continue;
          }
          const _0x4da650 = normalizeBounds(_0x55ca0c?.bounds);
          if (!_0x4da650) {
            _0x327c1e(_0xc3d922);
            continue;
          }
          _0x16eb67.pendingRegistrationUntil = 0;
          const _0x169c5d = Boolean(_0x55ca0c?.selected);
          _0x16eb67.selected !== _0x169c5d && ((_0x16eb67.selected = _0x169c5d), (_0x106334 = true));
          _0x16eb67.canvasSpaceHeld = _0x55ca0c?.canvasSpaceHeld === true;
          !_0x16eb67.attached &&
            (_0x8ed6e0.contentView.addChildView(_0x16eb67.view),
            (_0x16eb67.attached = true),
            (_0x106334 = true));
          _0x24f220.push(_0xc3d922);
          !boundsEqual(_0x16eb67.bounds, _0x4da650) &&
            ((_0x16eb67.bounds = _0x4da650), _0x16eb67.view.setBounds(_0x4da650));
          const _0x55865f = normalizeZoomFactor(_0x55ca0c?.zoomFactor);
          _0x16eb67.pendingZoomFactor = _0x55865f;
          _0x55ca0c?.deferZoomFactor !== true &&
            !zoomFactorEqual(_0x16eb67.zoomFactor, _0x55865f) &&
            ((_0x16eb67.zoomFactor = _0x55865f), _0x16eb67.view.webContents.setZoomFactor?.(_0x55865f));
          _0x16eb67.visible !== true && (_0x16eb67.view.setVisible?.(true), (_0x16eb67.visible = true));
          _0x1e4fe0 += 1;
          continue;
        }
        (_0x105729(_0xc3d922), _0x1d234c(_0x26df43, { type: 'failed', message: '网页地址无效' }, _0x25dde8));
        continue;
      }
      if (_0x55ca0c?.visible === false) {
        const _0x2b9b5a = _0x1c905a.get(_0xc3d922);
        if (_0x2b9b5a) _0x2b9b5a.pendingRegistrationUntil = 0;
        _0x327c1e(_0xc3d922);
        continue;
      }
      const _0x1af614 = normalizeBounds(_0x55ca0c?.bounds);
      if (!_0x1af614) {
        _0x327c1e(_0xc3d922);
        continue;
      }
      const _0x15b977 = toBrowserProfileId(_0x55ca0c?.browserProfileId),
        _0x480de7 = toPersistentPartitionId(_0x15b977);
      let _0x3ffe16 = _0x1c905a.get(_0xc3d922);
      _0x3ffe16 &&
        _0x3ffe16.partition !== _0x480de7 &&
        (_0x105729(_0xc3d922), (_0x3ffe16 = null), (_0x106334 = true));
      !_0x3ffe16 && ((_0x3ffe16 = _0xabe491(_0x26df43, _0x25dde8, _0x15b977)), (_0x106334 = true));
      _0x3ffe16.pendingRegistrationUntil = 0;
      const _0x2dff6a = Boolean(_0x55ca0c?.selected);
      _0x3ffe16.selected !== _0x2dff6a && ((_0x3ffe16.selected = _0x2dff6a), (_0x106334 = true));
      _0x3ffe16.canvasSpaceHeld = _0x55ca0c?.canvasSpaceHeld === true;
      !_0x3ffe16.attached &&
        (_0x8ed6e0.contentView.addChildView(_0x3ffe16.view), (_0x3ffe16.attached = true), (_0x106334 = true));
      _0x24f220.push(_0xc3d922);
      const _0x3d52d9 = String(_0x55ca0c?.freezeToken || '0'),
        _0x113f0b = _0x55ca0c?.frozen === true && _0x3ffe16.requestedUrl === _0x532acb;
      if (_0x113f0b) {
        _0x3ffd65(_0x3ffe16);
        _0x3ffe16.freezeToken !== _0x3d52d9 &&
          ((_0x3ffe16.freezeToken = _0x3d52d9), (_0x3ffe16.freezeHiddenWithSnapshot = false));
        const _0x53fdf9 = _0x3ffe16.hasSnapshot === true && _0x3ffe16.snapshotUrl === _0x532acb,
          _0x1c57c1 =
            _0x53fdf9 && (_0x55ca0c?.snapshotReady === true || _0x3ffe16.freezeHiddenWithSnapshot === true);
        if (_0x1c57c1)
          ((_0x3ffe16.snapshotPending = false),
            (_0x3ffe16.freezeHiddenWithSnapshot = true),
            _0x327c1e(_0xc3d922));
        else {
          _0x3ffe16.freezeHiddenWithSnapshot = false;
          !boundsEqual(_0x3ffe16.bounds, _0x1af614) &&
            ((_0x3ffe16.bounds = _0x1af614), _0x3ffe16.view.setBounds(_0x1af614));
          _0x3ffe16.visible !== true && (_0x3ffe16.view.setVisible?.(true), (_0x3ffe16.visible = true));
          const _0x3c8472 =
            _0x3ffe16.hasSnapshot === true &&
            _0x3ffe16.snapshotUrl === _0x532acb &&
            _0x3ffe16.snapshotFreezeToken === _0x3d52d9;
          if (_0x55ca0c?.snapshotHold !== true && _0x3ffe16.snapshotPending !== true && !_0x3c8472) {
            const _0x7c9735 = _0x43c9ed(
              _0x26df43,
              _0x3ffe16,
              _0x3d52d9,
              () => {
                const _0x9eb472 = _0x1c905a.get(_0xc3d922);
                if (_0x9eb472 === _0x3ffe16) _0x9eb472.snapshotPending = false;
              },
              _0x532acb,
            );
            _0x3ffe16.snapshotPending = _0x7c9735;
          }
        }
        _0x1e4fe0 += 1;
        continue;
      }
      ((_0x3ffe16.freezeToken = ''),
        (_0x3ffe16.snapshotPending = false),
        (_0x3ffe16.freezeHiddenWithSnapshot = false));
      !boundsEqual(_0x3ffe16.bounds, _0x1af614) &&
        ((_0x3ffe16.bounds = _0x1af614), _0x3ffe16.view.setBounds(_0x1af614));
      const _0x2179d7 = normalizeZoomFactor(_0x55ca0c?.zoomFactor);
      _0x3ffe16.pendingZoomFactor = _0x2179d7;
      _0x55ca0c?.deferZoomFactor !== true &&
        !zoomFactorEqual(_0x3ffe16.zoomFactor, _0x2179d7) &&
        ((_0x3ffe16.zoomFactor = _0x2179d7), _0x3ffe16.view.webContents.setZoomFactor?.(_0x2179d7));
      _0x3ffe16.visible !== true && (_0x3ffe16.view.setVisible?.(true), (_0x3ffe16.visible = true));
      (_0x48366a(_0x26df43, _0x3ffe16), (_0x1e4fe0 += 1));
      const _0x48cbbb = _0x3ffe16.url === _0x532acb || _0x3ffe16.loadIssuedUrl === _0x532acb,
        _0x2e12b1 =
          (_0x3ffe16.requestedUrl !== _0x532acb && !_0x48cbbb) ||
          (_0x3ffe16.isPopup &&
            _0x3ffe16.requestedUrl === _0x532acb &&
            _0x3ffe16.loadIssuedUrl !== _0x532acb &&
            _0x3ffe16.loaded !== true);
      !_0x2e12b1 && _0x3ffe16.requestedUrl !== _0x532acb && _0x48cbbb && (_0x3ffe16.requestedUrl = _0x532acb);
      if (_0x2e12b1) {
        (_0x3ffd65(_0x3ffe16),
          (_0x3ffe16.requestedUrl = _0x532acb),
          (_0x3ffe16.url = _0x532acb),
          (_0x3ffe16.loadIssuedUrl = _0x532acb),
          (_0x3ffe16.snapshotEpoch += 1),
          (_0x3ffe16.loaded = false),
          (_0x3ffe16.hasSnapshot = false),
          (_0x3ffe16.snapshotUrl = ''),
          (_0x3ffe16.snapshotFreezeToken = ''),
          (_0x3ffe16.readySnapshotPending = false),
          (_0x3ffe16.holdSnapshotOnNextLoadStart = false),
          (_0x3ffe16.snapshotStaleAfterLoad = false));
        try {
          const _0x9c6748 = _0x3ffe16.view.webContents.loadURL(_0x532acb);
          _0x9c6748 &&
            typeof _0x9c6748.catch === 'function' &&
            void _0x9c6748.catch((_0x51a388) => {
              (_0x58bf66?.({
                type: 'web_preview.load_failed',
                level: 'warn',
                source: 'main',
                message: 'Web preview loadURL failed',
                error: _0x51a388,
                context: { nodeId: _0x26df43, tabId: _0x25dde8 },
              }),
                _0x1d234c(
                  _0x26df43,
                  { type: 'failed', url: _0x532acb, message: String(_0x51a388?.message || '网页加载失败') },
                  _0x25dde8,
                ));
            });
        } catch (_0x5a0fa3) {
          (_0x58bf66?.({
            type: 'web_preview.load_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview loadURL failed',
            error: _0x5a0fa3,
            context: { nodeId: _0x26df43, tabId: _0x25dde8 },
          }),
            _0x1d234c(
              _0x26df43,
              { type: 'failed', url: _0x532acb, message: String(_0x5a0fa3?.message || '网页加载失败') },
              _0x25dde8,
            ));
        }
      }
    }
    if (_0x106334)
      for (const _0x3fcb0e of _0x24f220) {
        const _0x78abb9 = _0x1c905a.get(_0x3fcb0e);
        _0x78abb9?.view && _0x78abb9.attached && _0x8ed6e0.contentView.addChildView(_0x78abb9.view);
      }
    const _0x513cbd = Date.now();
    for (const _0x5b7186 of [..._0x1c905a.keys()]) {
      if (_0x2c5ad9.has(_0x5b7186)) continue;
      const _0x1c6ecd = _0x1c905a.get(_0x5b7186);
      if (_0x1c6ecd?.pendingRegistrationUntil > _0x513cbd) continue;
      _0x105729(_0x5b7186);
    }
    return { ok: true, count: _0x1c905a.size, visibleCount: _0x1e4fe0 };
  }
  function _0x553cd7(_0x1bcc5d = {}) {
    const _0x1907c5 = Array.isArray(_0x1bcc5d?.nodeIds)
        ? _0x1bcc5d.nodeIds.map(toNodeId).filter(Boolean)
        : [],
      _0x504920 = Array.isArray(_0x1bcc5d?.tabIds) ? _0x1bcc5d.tabIds.map(toTabId).filter(Boolean) : [];
    let _0x400be3 = 0;
    if (_0x1907c5.length > 0 && _0x504920.length > 0) {
      for (const _0x34ca7f of _0x1907c5) {
        for (const _0x489a0 of _0x504920) {
          if (_0x3a676c(_0x34ca7f, _0x489a0)) _0x400be3 += 1;
        }
      }
      _0x25b490((_0xb819d7) => _0x1907c5.includes(_0xb819d7.nodeId) && _0x504920.includes(_0xb819d7.tabId));
    } else {
      if (_0x1907c5.length > 0) {
        for (const _0x1fb228 of _0x1907c5) {
          for (const [_0xa602ef, _0xd922d8] of [..._0x1c905a]) {
            if (_0xd922d8.nodeId === _0x1fb228 && _0x105729(_0xa602ef)) _0x400be3 += 1;
          }
        }
        _0x25b490((_0x4047e2) => _0x1907c5.includes(_0x4047e2.nodeId));
      } else {
        for (const _0x19f320 of [..._0x1c905a.keys()]) {
          if (_0x105729(_0x19f320)) _0x400be3 += 1;
        }
        _0x25b490();
      }
    }
    return { ok: true, disposed: _0x400be3 };
  }
  function _0x241b14(_0xec8643, _0x1378c7, _0x215305) {
    return Promise.resolve(
      _0xec8643.executeJavaScript(
        buildWebPreviewImageExtractionScript({ nodeId: _0x1378c7, tabId: _0x215305 }),
        true,
      ),
    )
      .then((_0x567774) => ({
        ok: true,
        images: filterExtractedImageCandidates(_0x567774?.images),
        pageUrl: String(_0x567774?.pageUrl || ''),
        pageTitle: String(_0x567774?.pageTitle || ''),
      }))
      .catch((_0x3d63c6) => {
        return (
          _0x58bf66?.({
            type: 'web_preview.extract_images_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview image extraction failed',
            error: _0x3d63c6,
            context: { nodeId: _0x1378c7, tabId: _0x215305 },
          }),
          { ok: false, error: 'extract-failed', images: [] }
        );
      });
  }
  function _0x479d6b(_0x4c1e0f, _0x54ee39, _0x5065a9) {
    return Promise.resolve(
      _0x4c1e0f.executeJavaScript(
        buildWebPreviewVideoExtractionScript({ nodeId: _0x54ee39, tabId: _0x5065a9 }),
        true,
      ),
    )
      .then((_0x402fdf) => ({
        ok: true,
        videos: filterExtractedVideoCandidates(_0x402fdf?.videos),
        douyinDetailApiUrls: Array.isArray(_0x402fdf?.douyinDetailApiUrls)
          ? _0x402fdf.douyinDetailApiUrls
          : [],
        pageUrl: String(_0x402fdf?.pageUrl || ''),
        pageTitle: String(_0x402fdf?.pageTitle || ''),
      }))
      .catch((_0x27318d) => {
        return (
          _0x58bf66?.({
            type: 'web_preview.extract_videos_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview video extraction failed',
            error: _0x27318d,
            context: { nodeId: _0x54ee39, tabId: _0x5065a9 },
          }),
          { ok: false, error: 'extract-failed', videos: [], douyinDetailApiUrls: [] }
        );
      });
  }
  function _0x21c775(_0x4df4da = {}) {
    const _0x1e307c = toNodeId(_0x4df4da?.nodeId),
      _0x4ad2b0 = toTabId(_0x4df4da?.tabId),
      _0x1ecec4 = String(_0x4df4da?.action || '').trim();
    if (!_0x1e307c) return { ok: false, error: 'missing-node' };
    const _0x267105 = _0x1c905a.get(toEntryKey(_0x1e307c, _0x4ad2b0));
    if (!_0x267105?.view?.webContents || _0x267105.view.webContents.isDestroyed?.())
      return { ok: false, error: 'missing-view' };
    const _0x2ed066 = _0x267105.view.webContents;
    if (_0x1ecec4 === 'back') {
      if (!_0x2ed066.canGoBack?.())
        return (
          _0x1d234c(_0x1e307c, { type: 'blocked', message: '没有上一页' }, _0x4ad2b0),
          { ok: false, error: 'no-history', ...getNavigationState(_0x2ed066) }
        );
      _0x2ed066.goBack?.();
    } else {
      if (_0x1ecec4 === 'forward') {
        if (!_0x2ed066.canGoForward?.())
          return (
            _0x1d234c(_0x1e307c, { type: 'blocked', message: '没有下一页' }, _0x4ad2b0),
            { ok: false, error: 'no-history', ...getNavigationState(_0x2ed066) }
          );
        _0x2ed066.goForward?.();
      } else {
        if (_0x1ecec4 === 'reload') {
          const _0x12e63f = _0x267105.url || _0x267105.requestedUrl || '';
          ((_0x267105.holdSnapshotOnNextLoadStart = Boolean(
            _0x267105.hasSnapshot === true &&
            _0x267105.snapshotUrl &&
            _0x12e63f &&
            _0x267105.snapshotUrl === _0x12e63f,
          )),
            (_0x267105.snapshotStaleAfterLoad = false));
          if (typeof _0x2ed066.reloadIgnoringCache === 'function') _0x2ed066.reloadIgnoringCache();
          else {
            if (typeof _0x2ed066.reload === 'function') _0x2ed066.reload();
            else
              (_0x267105.url || _0x267105.requestedUrl) &&
                void _0x2ed066.loadURL?.(_0x267105.url || _0x267105.requestedUrl);
          }
        } else {
          if (_0x1ecec4 === 'extract-media') {
            if (typeof _0x2ed066.executeJavaScript !== 'function')
              return { ok: false, error: 'unsupported-action' };
            return Promise.all([
              _0x241b14(_0x2ed066, _0x1e307c, _0x4ad2b0),
              _0x479d6b(_0x2ed066, _0x1e307c, _0x4ad2b0),
            ]).then(async ([_0x35da39, _0x164471]) => {
              if (_0x35da39?.ok === false && _0x164471?.ok === false)
                return { ok: false, error: 'extract-failed' };
              const _0x533cd8 = String(
                  _0x164471?.pageUrl || _0x35da39?.pageUrl || _0x267105.url || _0x267105.requestedUrl || '',
                ),
                _0x38f44c = String(_0x164471?.pageTitle || _0x35da39?.pageTitle || '');
              let _0x12e192 = { images: [], videos: [], detailApiUrls: [], fetchedCount: 0 };
              if (typeof resolveDouyinMedia === 'function')
                try {
                  _0x12e192 =
                    (await resolveDouyinMedia({
                      pageUrl: _0x533cd8,
                      pageTitle: _0x38f44c,
                      nodeId: _0x1e307c,
                      tabId: _0x4ad2b0,
                      imageResult: _0x35da39,
                      videoResult: _0x164471,
                      webContents: _0x2ed066,
                      logDiagnosticEvent: _0x58bf66,
                    })) || _0x12e192;
                } catch (_0x21e31c) {
                  _0x58bf66?.({
                    type: 'web_preview.douyin_media_resolve_failed',
                    level: 'warn',
                    source: 'main',
                    message: 'Douyin media resolver failed',
                    error: _0x21e31c,
                    context: { nodeId: _0x1e307c, tabId: _0x4ad2b0, pageUrl: _0x533cd8 },
                  });
                }
              return {
                ok: true,
                action: _0x1ecec4,
                ...(_0x4df4da?.tabId ? { tabId: _0x4ad2b0 } : {}),
                images: mergeExtractedImageCandidates(_0x12e192?.images, _0x35da39?.images),
                videos: mergeExtractedVideoCandidates(_0x12e192?.videos, _0x164471?.videos),
                pageUrl: _0x533cd8,
                pageTitle: _0x38f44c,
                douyin: {
                  detailApiUrls: Array.isArray(_0x12e192?.detailApiUrls) ? _0x12e192.detailApiUrls : [],
                  fetchedCount: Number(_0x12e192?.fetchedCount || 0) || 0,
                },
                ...getNavigationState(_0x2ed066),
              };
            });
          } else {
            if (_0x1ecec4 === 'extract-images') {
              if (typeof _0x2ed066.executeJavaScript !== 'function')
                return { ok: false, error: 'unsupported-action' };
              return _0x241b14(_0x2ed066, _0x1e307c, _0x4ad2b0).then((_0xfb719d) =>
                _0xfb719d.ok === false
                  ? { ok: false, error: _0xfb719d.error || 'extract-failed' }
                  : {
                      ok: true,
                      action: _0x1ecec4,
                      ...(_0x4df4da?.tabId ? { tabId: _0x4ad2b0 } : {}),
                      images: _0xfb719d.images,
                      pageUrl: String(_0xfb719d.pageUrl || _0x267105.url || _0x267105.requestedUrl || ''),
                      pageTitle: String(_0xfb719d?.pageTitle || ''),
                      ...getNavigationState(_0x2ed066),
                    },
              );
            } else {
              if (_0x1ecec4 === 'extract-videos') {
                if (typeof _0x2ed066.executeJavaScript !== 'function')
                  return { ok: false, error: 'unsupported-action' };
                return _0x479d6b(_0x2ed066, _0x1e307c, _0x4ad2b0).then((_0x1f4d94) =>
                  _0x1f4d94.ok === false
                    ? { ok: false, error: _0x1f4d94.error || 'extract-failed' }
                    : {
                        ok: true,
                        action: _0x1ecec4,
                        ...(_0x4df4da?.tabId ? { tabId: _0x4ad2b0 } : {}),
                        videos: _0x1f4d94.videos,
                        pageUrl: String(_0x1f4d94.pageUrl || _0x267105.url || _0x267105.requestedUrl || ''),
                        pageTitle: String(_0x1f4d94?.pageTitle || ''),
                        ...getNavigationState(_0x2ed066),
                      },
                );
              } else {
                if (_0x1ecec4 === 'capture-reference') {
                  if (
                    typeof _0x2ed066.executeJavaScript !== 'function' ||
                    typeof _0x2ed066.capturePage !== 'function'
                  )
                    return { ok: false, error: 'unsupported-action' };
                  return Promise.all([
                    Promise.resolve(
                      _0x2ed066.executeJavaScript(buildWebPreviewReferenceSnapshotScript(), true),
                    ),
                    Promise.resolve(_0x2ed066.capturePage()).then(
                      (_0x3be182) => _0x3be182?.toDataURL?.() || '',
                    ),
                  ])
                    .then(([_0x19c577, _0x4e03f7]) => ({
                      ok: true,
                      action: _0x1ecec4,
                      ...(_0x4df4da?.tabId ? { tabId: _0x4ad2b0 } : {}),
                      pageUrl: String(_0x19c577?.pageUrl || _0x267105.url || _0x267105.requestedUrl || ''),
                      pageTitle: String(_0x19c577?.pageTitle || _0x2ed066.getTitle?.() || ''),
                      selectedText: String(_0x19c577?.selectedText || '').slice(
                        0,
                        WEB_PREVIEW_SELECTED_TEXT_LIMIT,
                      ),
                      screenshotDataUrl: String(_0x4e03f7 || ''),
                      capturedAt: new Date().toISOString(),
                      ...getNavigationState(_0x2ed066),
                    }))
                    .catch((_0x3eb877) => {
                      return (
                        _0x58bf66?.({
                          type: 'web_preview.capture_reference_failed',
                          level: 'warn',
                          source: 'main',
                          message: 'Web preview reference capture failed',
                          error: _0x3eb877,
                          context: { nodeId: _0x1e307c, tabId: _0x4ad2b0 },
                        }),
                        { ok: false, error: 'capture-failed' }
                      );
                    });
                } else return { ok: false, error: 'unknown-action' };
              }
            }
          }
        }
      }
    }
    return (
      _0x2086ef(_0x1e307c, _0x2ed066, _0x4ad2b0),
      {
        ok: true,
        action: _0x1ecec4,
        ...(_0x4df4da?.tabId ? { tabId: _0x4ad2b0 } : {}),
        ...getNavigationState(_0x2ed066),
      }
    );
  }
  return {
    syncViews: _0x3b094b,
    disposeViews: _0x553cd7,
    controlView: _0x21c775,
    getEntryCount: () => _0x1c905a.size,
    _getEntry: (_0xae540b, _0xe81c0e = 'default') => _0x1c905a.get(toEntryKey(_0xae540b, _0xe81c0e)),
  };
}
