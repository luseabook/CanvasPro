import { normalizeWebPreviewFaviconUrl, normalizeWebPreviewUrl } from '../src/modules/webPreviewUrl.js';
import { resolveDouyinCurrentPageMedia } from './douyinWebPreviewResolver.js';
const MIN_VIEW_SIZE = 16,
  WEB_PREVIEW_IMAGE_DROP_MIME = 'application/x-ai-canvas-web-preview-image',
  DEFAULT_WEB_PREVIEW_BROWSER_PROFILE_ID = 'default',
  WEB_PREVIEW_PARTITION_PREFIX = 'persist:ai-canvas-web-preview',
  READY_SNAPSHOT_IDLE_DELAY_MS = 180,
  POPUP_REGISTRATION_GRACE_MS = 5000,
  WEB_PREVIEW_IMAGE_EXTRACTION_LIMIT = 120,
  WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT = 40,
  WEB_PREVIEW_EXTRACT_MIN_IMAGE_WIDTH = 96,
  WEB_PREVIEW_EXTRACT_MIN_IMAGE_HEIGHT = 96,
  WEB_PREVIEW_EXTRACT_MIN_IMAGE_AREA = 12000,
  WEB_PREVIEW_SELECTED_TEXT_LIMIT = 5000,
  WEB_PREVIEW_DIRECT_VIDEO_EXTENSION_RE = /\.(?:mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i,
  WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE = /\.(?:m3u8|mpd|m4s)(?:[?#].*)?$/i,
  WEB_PREVIEW_AUTH_POPUP_WIDTH = 520,
  WEB_PREVIEW_AUTH_POPUP_HEIGHT = 680,
  WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH = 360,
  WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT = 420,
  WEB_PREVIEW_AUTH_POPUP_REQUEST_TTL_MS = 10000,
  WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX = '__AI_CANVAS_WEB_PREVIEW_INPUT__:',
  WEB_PREVIEW_CONTEXT_MENU_BRIDGE_DEDUPE_MS = 500,
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
  const value = Math.max(0, Math.round(Number(x || 0) || 0)),
    item = Math.max(0, Math.round(Number(y || 0) || 0));
  return (
    '\n(() => {\n  const nodeId = ' +
    JSON.stringify(toNodeId(nodeId)) +
    ';\n  const tabId = ' +
    JSON.stringify(toTabId(tabId)) +
    ';\n  const contextX = ' +
    value +
    ';\n  const contextY = ' +
    item +
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
function toNodeId(key) {
  return String(key || '').trim();
}
function toTabId(index) {
  return String(index || 'default').trim() || 'default';
}
function normalizeExtractedImageDimension(result) {
  return Math.max(0, Math.round(Number(result || 0) || 0));
}
function hasExtractableImageSize(data, options) {
  const extractedImageDimension = normalizeExtractedImageDimension(data),
    extractedImageDimension2 = normalizeExtractedImageDimension(options);
  if (!extractedImageDimension || !extractedImageDimension2) return true;
  return (
    extractedImageDimension >= WEB_PREVIEW_EXTRACT_MIN_IMAGE_WIDTH &&
    extractedImageDimension2 >= WEB_PREVIEW_EXTRACT_MIN_IMAGE_HEIGHT &&
    extractedImageDimension * extractedImageDimension2 >= WEB_PREVIEW_EXTRACT_MIN_IMAGE_AREA
  );
}
function filterExtractedImageCandidates(list = []) {
  if (!Array.isArray(list)) return [];
  return list.filter((box) => hasExtractableImageSize(box?.width, box?.height));
}
function normalizeExtractedMediaUrl(target) {
  const enabled = String(target || '').trim();
  if (!enabled) return '';
  try {
    const uRL = new URL(enabled);
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.href);
  } catch {
    return '';
  }
}
function isDirectVideoMediaUrl(source) {
  const extractedMediaUrl = normalizeExtractedMediaUrl(source);
  if (!extractedMediaUrl) return false;
  try {
    const uRL2 = new URL(extractedMediaUrl).pathname;
    return (
      WEB_PREVIEW_DIRECT_VIDEO_EXTENSION_RE.test(uRL2) && !WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE.test(uRL2)
    );
  } catch {
    return false;
  }
}
function filterExtractedVideoCandidates(list2 = []) {
  if (!Array.isArray(list2)) return [];
  const map = new Set(),
    list3 = [];
  for (const box2 of list2) {
    const url2 = normalizeExtractedMediaUrl(box2?.url);
    if (!url2 || map.has(url2)) continue;
    let uRL3 = '';
    try {
      uRL3 = new URL(url2).pathname;
    } catch {}
    if (WEB_PREVIEW_STREAM_MEDIA_EXTENSION_RE.test(uRL3)) continue;
    const mimeType = String(box2?.mimeType || '')
        .trim()
        .toLowerCase(),
      sourceType = String(box2?.sourceType || 'media')
        .trim()
        .toLowerCase(),
      enabled2 =
        mimeType.startsWith('video/') ||
        isDirectVideoMediaUrl(url2) ||
        sourceType === 'video' ||
        sourceType === 'video-source' ||
        sourceType === 'source' ||
        sourceType === 'video-resource' ||
        sourceType === 'douyin-detail';
    if (!enabled2) continue;
    (map.add(url2),
      list3.push({
        kind: 'video',
        url: url2,
        title: String(box2?.title || box2?.pageTitle || '网页视频')
          .trim()
          .slice(0, 160),
        pageUrl: normalizeExtractedMediaUrl(box2?.pageUrl),
        pageTitle: String(box2?.pageTitle || '')
          .trim()
          .slice(0, 160),
        nodeId: String(box2?.nodeId || '').trim(),
        tabId: String(box2?.tabId || '').trim(),
        width: Math.max(0, Math.round(Number(box2?.width || 0) || 0)),
        height: Math.max(0, Math.round(Number(box2?.height || 0) || 0)),
        duration: Math.max(0, Number(box2?.duration || 0) || 0),
        sourceType: sourceType.slice(0, 40),
        mimeType: mimeType,
      }));
    if (list3.length >= WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT) break;
  }
  return list3;
}
function mergeExtractedImageCandidates(...args) {
  const map2 = new Set(),
    list4 = [];
  for (const next of args) {
    for (const response of filterExtractedImageCandidates(next)) {
      const url3 = normalizeExtractedMediaUrl(response?.url);
      if (!url3 || map2.has(url3)) continue;
      (map2.add(url3), list4.push({ ...response, url: url3 }));
      if (list4.length >= WEB_PREVIEW_IMAGE_EXTRACTION_LIMIT) return list4;
    }
  }
  return list4;
}
function mergeExtractedVideoCandidates(...args2) {
  const map3 = new Set(),
    list5 = [];
  for (const current of args2) {
    for (const response2 of filterExtractedVideoCandidates(current)) {
      if (!response2?.url || map3.has(response2.url)) continue;
      (map3.add(response2.url), list5.push(response2));
      if (list5.length >= WEB_PREVIEW_VIDEO_EXTRACTION_LIMIT) return list5;
    }
  }
  return list5;
}
function toEntryKey(entry, record = 'default') {
  return toNodeId(entry) + '\n' + toTabId(record);
}
function toBrowserProfileId(payload) {
  const handle = String(payload || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return handle || DEFAULT_WEB_PREVIEW_BROWSER_PROFILE_ID;
}
function toPersistentPartitionId(state) {
  return WEB_PREVIEW_PARTITION_PREFIX + '-' + toBrowserProfileId(state);
}
function isBlankPopupUrl(config) {
  const enabled3 = String(config || '')
    .trim()
    .toLowerCase();
  return (
    !enabled3 ||
    enabled3 === 'about:blank' ||
    enabled3.startsWith('about:blank#') ||
    enabled3.startsWith('about:blank?')
  );
}
function isGoogleAccountsUrl(scope) {
  const webPreviewUrl = normalizeWebPreviewUrl(scope);
  if (!webPreviewUrl) return false;
  try {
    const uRL4 = new URL(webPreviewUrl).hostname.toLowerCase();
    return uRL4 === 'accounts.google.com' || uRL4.startsWith('accounts.google.');
  } catch {
    return false;
  }
}
function shouldUseNativeAuthPopup(input) {
  return isBlankPopupUrl(input) || isGoogleAccountsUrl(input);
}
function normalizeBounds(box3 = {}) {
  const x2 = Math.round(Number(box3.x)),
    y2 = Math.round(Number(box3.y)),
    width = Math.round(Number(box3.width)),
    height = Math.round(Number(box3.height));
  if (
    !Number.isFinite(x2) ||
    !Number.isFinite(y2) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < MIN_VIEW_SIZE ||
    height < MIN_VIEW_SIZE
  )
    return null;
  return { x: x2, y: y2, width: width, height: height };
}
function normalizeZoomFactor(output) {
  const count = Number(output);
  if (!Number.isFinite(count) || count <= 0) return 1;
  return Math.min(5, Math.max(0.25, count));
}
function boundsEqual(box4, box5) {
  return (
    box4?.x === box5?.x && box4?.y === box5?.y && box4?.width === box5?.width && box4?.height === box5?.height
  );
}
function zoomFactorEqual(value2, value3) {
  return Math.abs(Number(value2 || 1) - Number(value3 || 1)) < 0.001;
}
function getViewsPayload(value4) {
  return Array.isArray(value4?.views) ? value4.views : [];
}
function getNavigationState(value5) {
  return { canGoBack: Boolean(value5?.canGoBack?.()), canGoForward: Boolean(value5?.canGoForward?.()) };
}
function createInputBridgeToken() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
}
function getConsoleMessageFromArgs(list6 = []) {
  for (const error of list6) {
    if (typeof error === 'string') return error;
    if (error && typeof error.message === 'string') return error.message;
  }
  return '';
}
function parseWebPreviewInputBridgeMessage(value6 = '') {
  const list7 = String(value6 || '');
  if (!list7.startsWith(WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX)) return null;
  try {
    const value7 = JSON.parse(list7.slice(WEB_PREVIEW_INPUT_BRIDGE_MESSAGE_PREFIX.length));
    if (value7?.type !== 'pan-start-preview' && value7?.type !== 'image-context-menu') return null;
    return value7;
  } catch {
    return null;
  }
}
export function createWebPreviewViewManager({
  WebContentsView: WebContentsView,
  BrowserWindow: BrowserWindow,
  getMainWindow: getMainWindow,
  openExternalUrl: openExternalUrl,
  createContextMenu: createContextMenu,
  logDiagnosticEvent: logDiagnosticEvent,
  resolveDouyinMedia: resolveDouyinMedia = resolveDouyinCurrentPageMedia,
  setTimeoutFn: setTimeoutFn = globalThis.setTimeout?.bind(globalThis),
  clearTimeoutFn: clearTimeoutFn = globalThis.clearTimeout?.bind(globalThis),
  readySnapshotDelayMs: readySnapshotDelayMs = READY_SNAPSHOT_IDLE_DELAY_MS,
} = {}) {
  const count2 = new Map(),
    map4 = new Set(),
    map5 = new Set();
  let value8 = 0;
  function window() {
    const enabled4 = typeof getMainWindow === 'function' ? getMainWindow() : null;
    return enabled4 && !enabled4.isDestroyed?.() ? enabled4 : null;
  }
  function run(nodeId2, args3, tabId2 = '') {
    const enabled5 = window();
    if (!enabled5?.webContents || enabled5.webContents.isDestroyed?.()) return;
    enabled5.webContents.send('webPreview:event', {
      nodeId: nodeId2,
      ...(tabId2 ? { tabId: tabId2 } : {}),
      ...args3,
    });
  }
  function run2(value9, value10, value11 = '') {
    run(
      value9,
      { type: 'blocked', url: String(value10 || ''), message: '浏览器节点仅允许打开 http/https 链接' },
      value11,
    );
  }
  function run3(value12, value13, value14 = '') {
    run(value12, { type: 'navigation-state', ...getNavigationState(value13) }, value14);
  }
  function run4(value15) {
    let value16 = '';
    do {
      ((value8 += 1), (value16 = 'popup-' + Date.now() + '-' + value8));
    } while (count2.has(toEntryKey(value15, value16)));
    return value16;
  }
  function webPreferences(partition) {
    return { nodeIntegration: false, contextIsolation: true, sandbox: true, partition: partition };
  }
  function run5(list8 = []) {
    if (!Array.isArray(list8)) return '';
    for (const value17 of list8) {
      const webPreviewFaviconUrl = normalizeWebPreviewFaviconUrl(value17);
      if (webPreviewFaviconUrl) return webPreviewFaviconUrl;
    }
    return '';
  }
  function run6(enabled6) {
    if (!enabled6?.readySnapshotTimer) return;
    (clearTimeoutFn?.(enabled6.readySnapshotTimer), (enabled6.readySnapshotTimer = null));
  }
  function run7(nodeId3, width2, freezeToken, value18, value19 = '', value20 = width2?.snapshotEpoch || 0) {
    const enabled7 = width2?.view?.webContents;
    if (!enabled7 || enabled7.isDestroyed?.()) return false;
    if (typeof enabled7.capturePage !== 'function') return false;
    const value21 = value19 || width2?.url || width2?.requestedUrl || '';
    let value22 = null;
    try {
      value22 = enabled7.capturePage();
    } catch (error2) {
      return (
        logDiagnosticEvent?.({
          type: 'web_preview.snapshot_failed',
          level: 'warn',
          source: 'main',
          message: 'Web preview snapshot capture failed',
          error: error2,
          context: { nodeId: nodeId3, freezeToken: freezeToken },
        }),
        false
      );
    }
    return (
      Promise.resolve(value22)
        .then((value23) => {
          const dataUrl = value23?.toDataURL?.();
          if (!dataUrl) return;
          if (width2 && width2.snapshotEpoch !== value20) return;
          if (value21 && width2?.requestedUrl && width2.requestedUrl !== value21) return;
          ((width2.hasSnapshot = true),
            (width2.snapshotUrl = value21),
            (width2.snapshotFreezeToken = String(freezeToken || '')),
            run(
              nodeId3,
              {
                type: 'snapshot',
                dataUrl: dataUrl,
                freezeToken: freezeToken,
                width: width2.bounds?.width || 0,
                height: width2.bounds?.height || 0,
              },
              width2.tabId,
            ));
        })
        .catch((error3) => {
          logDiagnosticEvent?.({
            type: 'web_preview.snapshot_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview snapshot capture failed',
            error: error3,
            context: { nodeId: nodeId3, freezeToken: freezeToken },
          });
        })
        .finally(() => {
          value18?.();
        }),
      true
    );
  }
  function run8(value24, response3, value25 = response3?.snapshotEpoch || 0) {
    const enabled8 = response3?.url || response3?.requestedUrl || '';
    if (!response3?.bounds || !enabled8 || response3.readySnapshotPending) return false;
    if (response3.hasSnapshot && response3.snapshotUrl === enabled8) return false;
    response3.readySnapshotPending = true;
    const enabled9 = run7(
      value24,
      response3,
      'ready',
      () => {
        response3.readySnapshotPending = false;
      },
      enabled8,
      value25,
    );
    if (!enabled9) response3.readySnapshotPending = false;
    return enabled9;
  }
  function run9(value26, response4) {
    const enabled10 = response4?.url || response4?.requestedUrl || '';
    if (
      !response4?.loaded ||
      !response4.bounds ||
      !enabled10 ||
      response4.visible !== true ||
      response4.freezeToken ||
      response4.readySnapshotPending ||
      response4.readySnapshotTimer
    )
      return false;
    if (response4.hasSnapshot && response4.snapshotUrl === enabled10) return false;
    if (typeof setTimeoutFn !== 'function') return run8(value26, response4);
    const value27 = response4.snapshotEpoch,
      value28 = Math.max(0, Number(readySnapshotDelayMs) || 0);
    return (
      (response4.readySnapshotTimer = setTimeoutFn(() => {
        response4.readySnapshotTimer = null;
        const response5 = count2.get(toEntryKey(value26, response4.tabId)),
          value29 = response5?.url || response5?.requestedUrl || '';
        if (
          response5 !== response4 ||
          response5.snapshotEpoch !== value27 ||
          value29 !== enabled10 ||
          response5.loaded !== true ||
          response5.visible !== true
        )
          return;
        if (response5.freezeToken) {
          run9(value26, response5);
          return;
        }
        run8(value26, response5, value27);
      }, value28)),
      true
    );
  }
  function run10(nodeId4, value30, tabId3 = '', inputBridgeToken2 = '') {
    if (typeof value30?.executeJavaScript !== 'function') return;
    value30
      .executeJavaScript(
        buildWebPreviewDragBridgeScript({
          nodeId: nodeId4,
          tabId: tabId3,
          inputBridgeToken: inputBridgeToken2,
        }),
        true,
      )
      .catch((error4) => {
        logDiagnosticEvent?.({
          type: 'web_preview.drag_bridge_failed',
          level: 'warn',
          source: 'main',
          message: 'Web preview drag bridge injection failed',
          error: error4,
          context: { nodeId: nodeId4, tabId: tabId3 },
        });
      });
  }
  function run11(value31, value32, value33, box6 = {}, type = WEB_PREVIEW_TEXT_ACTION_PROMPT) {
    const text = String(box6?.selectionText || '').trim();
    if (!text) return false;
    const response6 = count2.get(toEntryKey(value31, value32)),
      pageUrl =
        normalizeWebPreviewUrl(box6?.pageURL) ||
        normalizeWebPreviewUrl(response6?.url) ||
        normalizeWebPreviewUrl(response6?.requestedUrl) ||
        '',
      webSourceTitle = String(value33?.getTitle?.() || '').trim();
    return (
      run(
        value31,
        {
          type: type,
          text: text.slice(0, WEB_PREVIEW_SELECTED_TEXT_LIMIT),
          pageUrl: pageUrl,
          webSourceTitle: webSourceTitle.slice(0, 160),
          contextX: Math.max(0, Math.round(Number(box6?.x || 0) || 0)),
          contextY: Math.max(0, Math.round(Number(box6?.y || 0) || 0)),
        },
        value32,
      ),
      true
    );
  }
  function run12(value34, value35 = {}) {
    const enabled11 = String(value35?.selectionText || '').trim();
    if (!enabled11) return false;
    try {
      if (typeof value34?.copy === 'function') return (value34.copy(), true);
    } catch {}
    return false;
  }
  function x3(value36) {
    return Math.max(0, Math.round(Number(value36 || 0) || 0));
  }
  function run13(event = {}, response7 = null) {
    const pageURL =
      normalizeWebPreviewUrl(event?.pageUrl) ||
      normalizeWebPreviewUrl(event?.sourceUrl) ||
      normalizeWebPreviewUrl(response7?.url) ||
      normalizeWebPreviewUrl(response7?.requestedUrl) ||
      '';
    return {
      mediaType: 'image',
      srcURL: normalizeWebPreviewUrl(event?.url) || '',
      titleText: String(event?.title || event?.alt || '')
        .trim()
        .slice(0, 160),
      pageURL: pageURL,
      frameURL: pageURL,
      x: x3(event?.contextX ?? event?.clientX),
      y: x3(event?.contextY ?? event?.clientY),
    };
  }
  function run14(enabled12, box7 = {}) {
    if (!enabled12) return;
    ((enabled12.lastBridgeImageContextMenuAt = Date.now()),
      (enabled12.lastBridgeImageContextMenuX = x3(box7?.x)),
      (enabled12.lastBridgeImageContextMenuY = x3(box7?.y)));
  }
  function run15(value37, box8 = {}) {
    const enabled13 = Number(value37?.lastBridgeImageContextMenuAt || 0);
    if (!enabled13 || Date.now() - enabled13 > WEB_PREVIEW_CONTEXT_MENU_BRIDGE_DEDUPE_MS) return false;
    const value38 = x3(box8?.x),
      value39 = x3(box8?.y);
    return (
      Math.abs(value38 - x3(value37?.lastBridgeImageContextMenuX)) <= 2 &&
      Math.abs(value39 - x3(value37?.lastBridgeImageContextMenuY)) <= 2
    );
  }
  function run16(nodeId5, tabId4, value40, box9 = {}, box10 = null) {
    const enabled14 = String(box9?.mediaType || '').toLowerCase() === 'image' || Boolean(box10?.url);
    if (!enabled14) return null;
    const url4 = normalizeWebPreviewUrl(box10?.url || box9?.srcURL);
    if (!url4) return null;
    const response8 = count2.get(toEntryKey(nodeId5, tabId4)),
      pageUrl2 =
        normalizeWebPreviewUrl(box10?.pageUrl) ||
        normalizeWebPreviewUrl(box9?.pageURL) ||
        normalizeWebPreviewUrl(box9?.frameURL) ||
        normalizeWebPreviewUrl(response8?.url) ||
        normalizeWebPreviewUrl(response8?.requestedUrl) ||
        '',
      pageTitle = String(box10?.pageTitle || value40?.getTitle?.() || '')
        .trim()
        .slice(0, 160),
      title = String(box10?.title || box10?.alt || box9?.titleText || pageTitle || '网页图片')
        .trim()
        .slice(0, 160),
      box11 = {
        kind: 'image',
        url: url4,
        title: title,
        pageUrl: pageUrl2,
        pageTitle: pageTitle,
        nodeId: nodeId5,
        tabId: tabId4,
        contextX: Math.max(0, Math.round(Number(box9?.x || 0) || 0)),
        contextY: Math.max(0, Math.round(Number(box9?.y || 0) || 0)),
      },
      value41 = Math.max(0, Math.round(Number(box10?.width || 0) || 0)),
      value42 = Math.max(0, Math.round(Number(box10?.height || 0) || 0));
    if (value41) box11.width = value41;
    if (value42) box11.height = value42;
    return box11;
  }
  async function run17(nodeId6, tabId5, value43, x4 = {}) {
    if (typeof value43?.executeJavaScript !== 'function') return null;
    try {
      const value44 = await value43.executeJavaScript(
          buildWebPreviewContextImageProbeScript({
            nodeId: nodeId6,
            tabId: tabId5,
            x: x4?.x,
            y: x4?.y,
          }),
          true,
        ),
        value45 = value44?.image && typeof value44.image === 'object' ? value44.image : value44;
      return run16(nodeId6, tabId5, value43, x4, value45);
    } catch (error5) {
      return (
        logDiagnosticEvent?.({
          type: 'web_preview.context_image_probe_failed',
          level: 'warn',
          source: 'main',
          message: 'Web preview context image probe failed',
          error: error5,
          context: { nodeId: nodeId6, tabId: tabId5 },
        }),
        null
      );
    }
  }
  async function run18(value46, value47, value48, value49 = {}) {
    if (String(value49?.mediaType || '').toLowerCase() !== 'image') return null;
    const value50 = await run17(value46, value47, value48, value49);
    return value50 || run16(value46, value47, value48, value49);
  }
  function run19(value51, value52, args4, type2 = 'send-image-to-canvas') {
    if (!args4) return false;
    return (run(value51, { ...args4, type: type2 }, value52), true);
  }
  async function run20(value53, value54, value55, value56 = {}) {
    if (typeof createContextMenu !== 'function') return;
    const list9 = [],
      value57 = await run18(value53, value54, value55, value56);
    value57 &&
      list9.push(
        {
          label: '加入到画布',
          click: () => run19(value53, value54, value57, 'send-image-to-canvas'),
        },
        {
          label: '反推提示词-创建',
          click: () => run19(value53, value54, value57, 'reverse-image-prompt'),
        },
        {
          label: '反推提示词-生成',
          click: () => run19(value53, value54, value57, 'reverse-image-prompt-generate'),
        },
      );
    const value58 = String(value56?.selectionText || '').trim();
    if (value58) {
      if (list9.length) list9.push({ type: 'separator' });
      list9.push(
        { label: '复制文本', click: () => run12(value55, value56) },
        {
          label: '发送到文本节点',
          submenu: [
            {
              label: '源节点',
              click: () => run11(value53, value54, value55, value56, WEB_PREVIEW_TEXT_ACTION_SOURCE),
            },
            {
              label: '生成文本',
              click: () => run11(value53, value54, value55, value56, WEB_PREVIEW_TEXT_ACTION_PROMPT),
            },
          ],
        },
        {
          label: '发送到图像节点',
          submenu: [
            {
              label: '创建',
              click: () => run11(value53, value54, value55, value56, WEB_PREVIEW_TEXT_ACTION_IMAGE_PROMPT),
            },
            {
              label: '生成',
              click: () =>
                run11(value53, value54, value55, value56, WEB_PREVIEW_TEXT_ACTION_IMAGE_PROMPT_GENERATE),
            },
          ],
        },
        {
          label: '发送到视频节点',
          submenu: [
            {
              label: '创建',
              click: () => run11(value53, value54, value55, value56, WEB_PREVIEW_TEXT_ACTION_VIDEO_PROMPT),
            },
            {
              label: '生成',
              click: () =>
                run11(value53, value54, value55, value56, WEB_PREVIEW_TEXT_ACTION_VIDEO_PROMPT_GENERATE),
            },
          ],
        },
      );
    }
    if (!list9.length) return;
    const value59 = createContextMenu(list9);
    value59?.popup?.({ window: window() });
  }
  function run21(value60, popupTabId, response9, url5) {
    if (!response9?.isPopup || response9.popupOpened || !url5) return false;
    return (
      (response9.popupOpened = true),
      (response9.pendingPopup = false),
      (response9.url = url5),
      (response9.requestedUrl = url5),
      run(value60, { type: 'open-popup', url: url5, popupTabId: popupTabId }, response9.openerTabId || ''),
      true
    );
  }
  function run22(value61, popupTabId2, response10) {
    if (!response10?.isPopup || response10.popupOpened) return false;
    return (
      (response10.popupOpened = true),
      (response10.pendingPopup = true),
      (response10.url = ''),
      (response10.requestedUrl = ''),
      run(
        value61,
        { type: 'open-popup', url: '', popupTabId: popupTabId2, pendingPopup: true },
        response10.openerTabId || '',
      ),
      true
    );
  }
  function overrideBrowserWindowOptions(value62) {
    const parent = window(),
      box12 = {
        parent: parent || undefined,
        modal: false,
        show: true,
        width: WEB_PREVIEW_AUTH_POPUP_WIDTH,
        height: WEB_PREVIEW_AUTH_POPUP_HEIGHT,
        minWidth: WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH,
        minHeight: WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT,
        title: 'Login',
        autoHideMenuBar: true,
        webPreferences: webPreferences(value62),
      },
      box13 = parent?.getBounds?.();
    if (
      box13 &&
      Number.isFinite(box13.x) &&
      Number.isFinite(box13.y) &&
      Number.isFinite(box13.width) &&
      Number.isFinite(box13.height) &&
      box13.width > WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH &&
      box13.height > WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT
    ) {
      const value63 = Math.min(
          WEB_PREVIEW_AUTH_POPUP_WIDTH,
          Math.max(WEB_PREVIEW_AUTH_POPUP_MIN_WIDTH, box13.width - 48),
        ),
        value64 = Math.min(
          WEB_PREVIEW_AUTH_POPUP_HEIGHT,
          Math.max(WEB_PREVIEW_AUTH_POPUP_MIN_HEIGHT, box13.height - 48),
        );
      ((box12.width = value63),
        (box12.height = value64),
        (box12.x = Math.round(box13.x + (box13.width - value63) / 2)),
        (box12.y = Math.round(box13.y + (box13.height - value64) / 2)));
    }
    return box12;
  }
  function run23(handler = () => true) {
    for (const value65 of [...map5]) {
      if (handler(value65)) map5.delete(value65);
    }
    for (const value66 of [...map4]) {
      if (!handler(value66)) continue;
      map4.delete(value66);
      try {
        value66.popupWindow?.isDestroyed?.() !== true && value66.popupWindow?.close?.();
      } catch {}
    }
  }
  function run24() {
    const value67 = Date.now();
    for (const value68 of [...map5]) {
      if (value68.expiresAt <= value67) map5.delete(value68);
    }
  }
  function run25({ nodeId: nodeId7, tabId: tabId6, partition: partition2 }) {
    run24();
    const value69 = {
      nodeId: nodeId7,
      tabId: tabId6,
      partition: partition2,
      expiresAt: Date.now() + WEB_PREVIEW_AUTH_POPUP_REQUEST_TTL_MS,
    };
    return (map5.add(value69), value69);
  }
  function run26({ nodeId: nodeId8, tabId: tabId7, url: url6 }) {
    run24();
    let value70 = null;
    for (const value71 of map5) {
      if (value71.nodeId !== nodeId8 || value71.tabId !== tabId7) continue;
      value70 = value71;
      if (shouldUseNativeAuthPopup(url6)) break;
    }
    if (value70) map5.delete(value70);
    return value70;
  }
  function run27({ nodeId: nodeId9, tabId: tabId8, partition: partition3, webContents: webContents }) {
    webContents.setWindowOpenHandler?.(({ url: url7 } = {}) => {
      const webPreviewUrl2 = normalizeWebPreviewUrl(url7);
      if (!webPreviewUrl2 && !isBlankPopupUrl(url7)) return (run2(nodeId9, url7, tabId8), { action: 'deny' });
      return {
        action: 'allow',
        outlivesOpener: true,
        overrideBrowserWindowOptions: { webPreferences: webPreferences(partition3) },
      };
    });
    const run28 = (event2, value72) => {
        if (isBlankPopupUrl(value72) || normalizeWebPreviewUrl(value72)) return;
        (event2?.preventDefault?.(), run2(nodeId9, value72, tabId8));
      },
      value73 = (value74, value75, ...list10) => {
        const enabled15 = list10.some((item2) => item2 === true);
        if (!enabled15) return;
        run28(value74, value75);
      };
    (webContents.on?.('will-navigate', run28),
      webContents.on?.('will-frame-navigate', value73),
      webContents.on?.('did-fail-load', (value76, errorCode, value77, value78) => {
        run(
          nodeId9,
          {
            type: 'failed',
            url: String(value78 || ''),
            errorCode: errorCode,
            message: String(value77 || 'Login popup load failed'),
          },
          tabId8,
        );
      }));
    const value79 = webContents.session;
    (value79?.setPermissionRequestHandler?.((value80, value81, handler2) => {
      handler2(false);
    }),
      value79?.on?.('will-download', (event3) => {
        event3?.preventDefault?.();
      }));
  }
  function run29({ nodeId: nodeId10, tabId: tabId9, partition: partition4, popupWindow: popupWindow }) {
    const webContents2 = popupWindow?.webContents;
    if (!popupWindow || !webContents2) return false;
    const value82 = { nodeId: nodeId10, tabId: tabId9, popupWindow: popupWindow };
    map4.add(value82);
    const value83 = () => map4.delete(value82);
    return (
      popupWindow.on?.('closed', value83),
      webContents2.on?.('destroyed', value83),
      run27({ nodeId: nodeId10, tabId: tabId9, partition: partition4, webContents: webContents2 }),
      true
    );
  }
  function run30(nodeId11, tabId10, value84, value85 = '') {
    (value84.setWindowOpenHandler?.(({ url: url8 } = {}) => {
      const url9 = normalizeWebPreviewUrl(url8),
        isBlankPopupUrl2 = isBlankPopupUrl(url8);
      if (!url9 && !isBlankPopupUrl2) return (run2(nodeId11, url8, tabId10), { action: 'deny' });
      const value86 = count2.get(toEntryKey(nodeId11, tabId10)),
        tabId11 = run4(nodeId11),
        browserProfileId = value86?.browserProfileId || DEFAULT_WEB_PREVIEW_BROWSER_PROFILE_ID,
        partition5 = value86?.partition || toPersistentPartitionId(browserProfileId);
      if (shouldUseNativeAuthPopup(url8) && typeof BrowserWindow === 'function')
        return (
          run25({ nodeId: nodeId11, tabId: tabId10, partition: partition5 }),
          {
            action: 'allow',
            outlivesOpener: true,
            overrideBrowserWindowOptions: overrideBrowserWindowOptions(partition5),
          }
        );
      if (typeof WebContentsView !== 'function') {
        if (url9) run(nodeId11, { type: 'open-popup', url: url9 }, tabId10);
        return { action: 'deny' };
      }
      return {
        action: 'allow',
        outlivesOpener: true,
        overrideBrowserWindowOptions: { webPreferences: webPreferences(partition5) },
        createWindow: () => {
          const value87 = run31({
            nodeId: nodeId11,
            tabId: tabId11,
            browserProfileId: browserProfileId,
            partition: partition5,
            url: url9 || '',
            openerTabId: tabId10,
          });
          if (url9) run21(nodeId11, tabId11, value87, url9);
          else run22(nodeId11, tabId11, value87);
          return value87.view.webContents;
        },
      };
    }),
      value84.on?.('did-create-window', (popupWindow2, url10 = {}) => {
        const partition6 = run26({ nodeId: nodeId11, tabId: tabId10, url: url10?.url });
        if (!partition6) return;
        run29({
          nodeId: nodeId11,
          tabId: tabId10,
          partition: partition6.partition,
          popupWindow: popupWindow2,
        });
      }));
    const run32 = (event4, value88) => {
        const enabled16 = count2.get(toEntryKey(nodeId11, tabId10));
        if (enabled16?.isPopup && isBlankPopupUrl(value88) && !enabled16.requestedUrl) return;
        if (normalizeWebPreviewUrl(value88)) return;
        (event4?.preventDefault?.(), run2(nodeId11, value88, tabId10));
      },
      value89 = (value90, value91, ...list11) => {
        const enabled17 = list11.some((item3) => item3 === true);
        if (!enabled17) return;
        run32(value90, value91);
      };
    (value84.on?.('will-navigate', run32),
      value84.on?.('will-frame-navigate', value89),
      value84.on?.('dom-ready', () => run10(nodeId11, value84, tabId10, value85)),
      value84.on?.('did-start-loading', () => {
        const response11 = count2.get(toEntryKey(nodeId11, tabId10));
        let url11 = '',
          holdSnapshot = false;
        if (response11) {
          const value92 = response11.url || response11.requestedUrl || '';
          url11 = value92;
          const value93 =
            response11.holdSnapshotOnNextLoadStart === true &&
            response11.hasSnapshot === true &&
            response11.snapshotUrl &&
            response11.snapshotUrl === value92;
          ((holdSnapshot = Boolean(value93)),
            run6(response11),
            (response11.snapshotEpoch += 1),
            (response11.loaded = false),
            holdSnapshot
              ? (response11.snapshotStaleAfterLoad = true)
              : ((response11.hasSnapshot = false),
                (response11.snapshotUrl = ''),
                (response11.snapshotFreezeToken = ''),
                (response11.snapshotStaleAfterLoad = false)),
            (response11.readySnapshotPending = false),
            (response11.holdSnapshotOnNextLoadStart = false));
        }
        run(nodeId11, { type: 'loading', url: url11, holdSnapshot: holdSnapshot }, tabId10);
      }),
      value84.on?.('did-stop-loading', () => {
        (run10(nodeId11, value84, tabId10, value85),
          run(nodeId11, { type: 'loaded' }, tabId10),
          run3(nodeId11, value84, tabId10));
        const value94 = count2.get(toEntryKey(nodeId11, tabId10));
        value94 &&
          ((value94.loaded = true),
          value94.snapshotStaleAfterLoad &&
            ((value94.hasSnapshot = false),
            (value94.snapshotUrl = ''),
            (value94.snapshotFreezeToken = ''),
            (value94.snapshotStaleAfterLoad = false)),
          run9(nodeId11, value94));
      }),
      value84.on?.('did-fail-load', (value95, errorCode2, value96, value97) => {
        run(
          nodeId11,
          {
            type: 'failed',
            url: String(value97 || ''),
            errorCode: errorCode2,
            message: String(value96 || '网页加载失败'),
          },
          tabId10,
        );
      }),
      value84.on?.('did-navigate', (value98, value99) => {
        const response12 = count2.get(toEntryKey(nodeId11, tabId10));
        if (response12?.isPopup && isBlankPopupUrl(value99) && !response12.requestedUrl) return;
        const url12 = normalizeWebPreviewUrl(value99) || String(value99 || ''),
          webPreviewUrl3 = normalizeWebPreviewUrl(url12);
        if (response12 && webPreviewUrl3) {
          if (run21(nodeId11, tabId10, response12, webPreviewUrl3)) return;
          const value100 = response12.pendingPopup === true;
          response12.url = webPreviewUrl3;
          if (value100) response12.requestedUrl = webPreviewUrl3;
          ((response12.loadIssuedUrl = webPreviewUrl3), (response12.pendingPopup = false));
        }
        (run(nodeId11, { type: 'navigated', url: url12 }, tabId10), run3(nodeId11, value84, tabId10));
      }),
      value84.on?.('did-navigate-in-page', (value101, value102, value103) => {
        if (value103 === false) return;
        const response13 = count2.get(toEntryKey(nodeId11, tabId10));
        if (response13?.isPopup && isBlankPopupUrl(value102) && !response13.requestedUrl) return;
        const url13 = normalizeWebPreviewUrl(value102) || String(value102 || ''),
          webPreviewUrl4 = normalizeWebPreviewUrl(url13);
        if (response13 && webPreviewUrl4) {
          if (run21(nodeId11, tabId10, response13, webPreviewUrl4)) return;
          const value104 = response13.pendingPopup === true;
          response13.url = webPreviewUrl4;
          if (value104) response13.requestedUrl = webPreviewUrl4;
          ((response13.loadIssuedUrl = webPreviewUrl4), (response13.pendingPopup = false));
        }
        (run(nodeId11, { type: 'navigated', url: url13 }, tabId10), run3(nodeId11, value84, tabId10));
      }),
      value84.on?.('page-favicon-updated', (value105, value106) => {
        const faviconUrl = run5(value106);
        if (!faviconUrl) return;
        run(nodeId11, { type: 'favicon', faviconUrl: faviconUrl }, tabId10);
      }),
      value84.on?.('context-menu', (value107, value108) => {
        const value109 = count2.get(toEntryKey(nodeId11, tabId10));
        if (run15(value109, value108)) return;
        void run20(nodeId11, tabId10, value84, value108).catch((error6) => {
          logDiagnosticEvent?.({
            type: 'web_preview.context_menu_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview context menu failed',
            error: error6,
            context: { nodeId: nodeId11, tabId: tabId10 },
          });
        });
      }),
      value84.on?.('console-message', (...args5) => {
        const event5 = parseWebPreviewInputBridgeMessage(getConsoleMessageFromArgs(args5));
        if (!event5) return;
        const enabled18 = count2.get(toEntryKey(nodeId11, tabId10));
        if (!enabled18 || event5.token !== enabled18.inputBridgeToken) return;
        if (event5.type === 'image-context-menu') {
          const value110 = run13(event5, enabled18);
          (run14(enabled18, value110),
            void run20(nodeId11, tabId10, value84, value110).catch((error7) => {
              logDiagnosticEvent?.({
                type: 'web_preview.context_menu_failed',
                level: 'warn',
                source: 'main',
                message: 'Web preview context menu failed',
                error: error7,
                context: { nodeId: nodeId11, tabId: tabId10, source: 'bridge' },
              });
            }));
          return;
        }
        const button = Number(event5.button),
          enabled19 = button === 1,
          spaceHeld = button === 0 && (event5.spaceHeld === true || enabled18.canvasSpaceHeld === true);
        if (!enabled19 && !spaceHeld) return;
        run(
          nodeId11,
          {
            type: 'pan-start-preview',
            source: 'web-contents-view',
            button: button,
            spaceHeld: spaceHeld,
            clientX: Math.max(0, Math.round(Number(event5.clientX || 0) || 0)),
            clientY: Math.max(0, Math.round(Number(event5.clientY || 0) || 0)),
          },
          tabId10,
        );
      }),
      value84.on?.('destroyed', () => {
        const toEntryKey2 = toEntryKey(nodeId11, tabId10),
          enabled20 = count2.get(toEntryKey2);
        if (!enabled20 || enabled20.disposing) return;
        const value111 = window();
        try {
          value111?.contentView?.removeChildView?.(enabled20.view);
        } catch {}
        (run6(enabled20), count2.delete(toEntryKey2));
        if (enabled20.isPopup) run(nodeId11, { type: 'closed' }, tabId10);
      }));
    const value112 = value84.session;
    (value112?.setPermissionRequestHandler?.((value113, value114, handler3) => {
      handler3(false);
    }),
      value112?.on?.('will-download', (event6) => {
        event6?.preventDefault?.();
      }));
  }
  function run33({
    nodeId: nodeId12,
    tabId: tabId12,
    browserProfileId: browserProfileId2,
    partition: partition7,
    view: view,
    url: url = '',
    isPopup: isPopup = false,
    openerTabId: openerTabId = '',
    pendingRegistrationUntil: pendingRegistrationUntil = 0,
  }) {
    view.setVisible?.(false);
    const inputBridgeToken3 = createInputBridgeToken(),
      value115 = {
        nodeId: nodeId12,
        tabId: tabId12,
        browserProfileId: browserProfileId2,
        partition: partition7,
        view: view,
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
        inputBridgeToken: inputBridgeToken3,
        isPopup: isPopup,
        openerTabId: openerTabId,
        popupOpened: !isPopup,
        pendingPopup: false,
        disposing: false,
        pendingRegistrationUntil: pendingRegistrationUntil,
      };
    return (
      count2.set(toEntryKey(nodeId12, tabId12), value115),
      run30(nodeId12, tabId12, view.webContents, inputBridgeToken3),
      value115
    );
  }
  function run34(nodeId13, tabId13, value116) {
    if (typeof WebContentsView !== 'function') throw new Error('当前 Electron 环境不支持 WebContentsView');
    const browserProfileId3 = toBrowserProfileId(value116),
      partition8 = toPersistentPartitionId(browserProfileId3),
      view2 = new WebContentsView({ webPreferences: webPreferences(partition8) });
    return run33({
      nodeId: nodeId13,
      tabId: tabId13,
      browserProfileId: browserProfileId3,
      partition: partition8,
      view: view2,
    });
  }
  function run31({
    nodeId: nodeId14,
    tabId: tabId14,
    browserProfileId: browserProfileId4,
    partition: partition9,
    url: url14,
    openerTabId: openerTabId = '',
  }) {
    const browserProfileId5 = toBrowserProfileId(browserProfileId4),
      partition10 = partition9 || toPersistentPartitionId(browserProfileId5),
      view3 = new WebContentsView({ webPreferences: webPreferences(partition10) });
    return run33({
      nodeId: nodeId14,
      tabId: tabId14,
      browserProfileId: browserProfileId5,
      partition: partition10,
      view: view3,
      url: url14,
      isPopup: true,
      openerTabId: openerTabId,
      pendingRegistrationUntil: Date.now() + POPUP_REGISTRATION_GRACE_MS,
    });
  }
  function run35(value117) {
    const enabled21 = count2.get(value117);
    if (!enabled21) return false;
    const value118 = window();
    run23((value119) => value119.nodeId === enabled21.nodeId && value119.tabId === enabled21.tabId);
    try {
      value118?.contentView?.removeChildView?.(enabled21.view);
    } catch {}
    (run6(enabled21),
      (enabled21.attached = false),
      (enabled21.visible = false),
      (enabled21.disposing = true));
    try {
      !enabled21.view?.webContents?.isDestroyed?.() && enabled21.view?.webContents?.destroy?.();
    } catch {}
    return (count2.delete(value117), true);
  }
  function run36(value120, value121 = null) {
    if (value121 !== null && typeof value121 !== 'undefined') return run35(toEntryKey(value120, value121));
    let value122 = false;
    for (const [value123, value124] of [...count2]) {
      if (value124.nodeId === value120 && run35(value123)) value122 = true;
    }
    return value122;
  }
  function run37(value125) {
    const enabled22 = count2.get(value125);
    if (!enabled22) return;
    enabled22.visible !== false && (enabled22.view?.setVisible?.(false), (enabled22.visible = false));
  }
  async function syncViews(options2 = {}) {
    const enabled23 = window();
    if (!enabled23?.contentView) return { ok: false, error: '主窗口尚未就绪' };
    const map6 = new Set(),
      viewsPayload = getViewsPayload(options2);
    let visibleCount = 0,
      value126 = false;
    const list12 = [];
    for (const response14 of viewsPayload) {
      const nodeId15 = toNodeId(response14?.nodeId);
      if (!nodeId15) continue;
      const tabId15 = toTabId(response14?.tabId),
        toEntryKey3 = toEntryKey(nodeId15, tabId15);
      map6.add(toEntryKey3);
      const url15 = normalizeWebPreviewUrl(response14?.webUrl || response14?.url);
      if (!url15) {
        if (response14?.pendingPopup === true) {
          const enabled24 = count2.get(toEntryKey3);
          if (!enabled24?.isPopup || enabled24.requestedUrl) {
            run(nodeId15, { type: 'failed', message: '登录窗口尚未就绪' }, tabId15);
            continue;
          }
          if (response14?.visible === false) {
            run37(toEntryKey3);
            continue;
          }
          const bounds = normalizeBounds(response14?.bounds);
          if (!bounds) {
            run37(toEntryKey3);
            continue;
          }
          enabled24.pendingRegistrationUntil = 0;
          const value127 = Boolean(response14?.selected);
          enabled24.selected !== value127 && ((enabled24.selected = value127), (value126 = true));
          enabled24.canvasSpaceHeld = response14?.canvasSpaceHeld === true;
          !enabled24.attached &&
            (enabled23.contentView.addChildView(enabled24.view),
            (enabled24.attached = true),
            (value126 = true));
          list12.push(toEntryKey3);
          !boundsEqual(enabled24.bounds, bounds) &&
            ((enabled24.bounds = bounds), enabled24.view.setBounds(bounds));
          const zoomFactor = normalizeZoomFactor(response14?.zoomFactor);
          enabled24.pendingZoomFactor = zoomFactor;
          response14?.deferZoomFactor !== true &&
            !zoomFactorEqual(enabled24.zoomFactor, zoomFactor) &&
            ((enabled24.zoomFactor = zoomFactor), enabled24.view.webContents.setZoomFactor?.(zoomFactor));
          enabled24.visible !== true && (enabled24.view.setVisible?.(true), (enabled24.visible = true));
          visibleCount += 1;
          continue;
        }
        (run35(toEntryKey3), run(nodeId15, { type: 'failed', message: '网页地址无效' }, tabId15));
        continue;
      }
      if (response14?.visible === false) {
        const value128 = count2.get(toEntryKey3);
        if (value128) value128.pendingRegistrationUntil = 0;
        run37(toEntryKey3);
        continue;
      }
      const bounds2 = normalizeBounds(response14?.bounds);
      if (!bounds2) {
        run37(toEntryKey3);
        continue;
      }
      const toBrowserProfileId2 = toBrowserProfileId(response14?.browserProfileId),
        toPersistentPartitionId2 = toPersistentPartitionId(toBrowserProfileId2);
      let response15 = count2.get(toEntryKey3);
      response15 &&
        response15.partition !== toPersistentPartitionId2 &&
        (run35(toEntryKey3), (response15 = null), (value126 = true));
      !response15 && ((response15 = run34(nodeId15, tabId15, toBrowserProfileId2)), (value126 = true));
      response15.pendingRegistrationUntil = 0;
      const value129 = Boolean(response14?.selected);
      response15.selected !== value129 && ((response15.selected = value129), (value126 = true));
      response15.canvasSpaceHeld = response14?.canvasSpaceHeld === true;
      !response15.attached &&
        (enabled23.contentView.addChildView(response15.view),
        (response15.attached = true),
        (value126 = true));
      list12.push(toEntryKey3);
      const value130 = String(response14?.freezeToken || '0'),
        value131 = response14?.frozen === true && response15.requestedUrl === url15;
      if (value131) {
        run6(response15);
        response15.freezeToken !== value130 &&
          ((response15.freezeToken = value130), (response15.freezeHiddenWithSnapshot = false));
        const value132 = response15.hasSnapshot === true && response15.snapshotUrl === url15,
          value133 =
            value132 && (response14?.snapshotReady === true || response15.freezeHiddenWithSnapshot === true);
        if (value133)
          ((response15.snapshotPending = false),
            (response15.freezeHiddenWithSnapshot = true),
            run37(toEntryKey3));
        else {
          response15.freezeHiddenWithSnapshot = false;
          !boundsEqual(response15.bounds, bounds2) &&
            ((response15.bounds = bounds2), response15.view.setBounds(bounds2));
          response15.visible !== true && (response15.view.setVisible?.(true), (response15.visible = true));
          const enabled25 =
            response15.hasSnapshot === true &&
            response15.snapshotUrl === url15 &&
            response15.snapshotFreezeToken === value130;
          if (response14?.snapshotHold !== true && response15.snapshotPending !== true && !enabled25) {
            const value134 = run7(
              nodeId15,
              response15,
              value130,
              () => {
                const value135 = count2.get(toEntryKey3);
                if (value135 === response15) value135.snapshotPending = false;
              },
              url15,
            );
            response15.snapshotPending = value134;
          }
        }
        visibleCount += 1;
        continue;
      }
      ((response15.freezeToken = ''),
        (response15.snapshotPending = false),
        (response15.freezeHiddenWithSnapshot = false));
      !boundsEqual(response15.bounds, bounds2) &&
        ((response15.bounds = bounds2), response15.view.setBounds(bounds2));
      const zoomFactor2 = normalizeZoomFactor(response14?.zoomFactor);
      response15.pendingZoomFactor = zoomFactor2;
      response14?.deferZoomFactor !== true &&
        !zoomFactorEqual(response15.zoomFactor, zoomFactor2) &&
        ((response15.zoomFactor = zoomFactor2), response15.view.webContents.setZoomFactor?.(zoomFactor2));
      response15.visible !== true && (response15.view.setVisible?.(true), (response15.visible = true));
      (run9(nodeId15, response15), (visibleCount += 1));
      const enabled26 = response15.url === url15 || response15.loadIssuedUrl === url15,
        enabled27 =
          (response15.requestedUrl !== url15 && !enabled26) ||
          (response15.isPopup &&
            response15.requestedUrl === url15 &&
            response15.loadIssuedUrl !== url15 &&
            response15.loaded !== true);
      !enabled27 && response15.requestedUrl !== url15 && enabled26 && (response15.requestedUrl = url15);
      if (enabled27) {
        (run6(response15),
          (response15.requestedUrl = url15),
          (response15.url = url15),
          (response15.loadIssuedUrl = url15),
          (response15.snapshotEpoch += 1),
          (response15.loaded = false),
          (response15.hasSnapshot = false),
          (response15.snapshotUrl = ''),
          (response15.snapshotFreezeToken = ''),
          (response15.readySnapshotPending = false),
          (response15.holdSnapshotOnNextLoadStart = false),
          (response15.snapshotStaleAfterLoad = false));
        try {
          const promise = response15.view.webContents.loadURL(url15);
          promise &&
            typeof promise.catch === 'function' &&
            void promise.catch((error8) => {
              (logDiagnosticEvent?.({
                type: 'web_preview.load_failed',
                level: 'warn',
                source: 'main',
                message: 'Web preview loadURL failed',
                error: error8,
                context: { nodeId: nodeId15, tabId: tabId15 },
              }),
                run(
                  nodeId15,
                  { type: 'failed', url: url15, message: String(error8?.message || '网页加载失败') },
                  tabId15,
                ));
            });
        } catch (error9) {
          (logDiagnosticEvent?.({
            type: 'web_preview.load_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview loadURL failed',
            error: error9,
            context: { nodeId: nodeId15, tabId: tabId15 },
          }),
            run(
              nodeId15,
              { type: 'failed', url: url15, message: String(error9?.message || '网页加载失败') },
              tabId15,
            ));
        }
      }
    }
    if (value126)
      for (const value136 of list12) {
        const value137 = count2.get(value136);
        value137?.view && value137.attached && enabled23.contentView.addChildView(value137.view);
      }
    const value138 = Date.now();
    for (const value139 of [...count2.keys()]) {
      if (map6.has(value139)) continue;
      const value140 = count2.get(value139);
      if (value140?.pendingRegistrationUntil > value138) continue;
      run35(value139);
    }
    return { ok: true, count: count2.size, visibleCount: visibleCount };
  }
  function disposeViews(options3 = {}) {
    const list13 = Array.isArray(options3?.nodeIds) ? options3.nodeIds.map(toNodeId).filter(Boolean) : [],
      list14 = Array.isArray(options3?.tabIds) ? options3.tabIds.map(toTabId).filter(Boolean) : [];
    let disposed = 0;
    if (list13.length > 0 && list14.length > 0) {
      for (const value141 of list13) {
        for (const value142 of list14) {
          if (run36(value141, value142)) disposed += 1;
        }
      }
      run23((value143) => list13.includes(value143.nodeId) && list14.includes(value143.tabId));
    } else {
      if (list13.length > 0) {
        for (const value144 of list13) {
          for (const [value145, value146] of [...count2]) {
            if (value146.nodeId === value144 && run35(value145)) disposed += 1;
          }
        }
        run23((value147) => list13.includes(value147.nodeId));
      } else {
        for (const value148 of [...count2.keys()]) {
          if (run35(value148)) disposed += 1;
        }
        run23();
      }
    }
    return { ok: true, disposed: disposed };
  }
  function run38(value149, nodeId16, tabId16) {
    return Promise.resolve(
      value149.executeJavaScript(
        buildWebPreviewImageExtractionScript({ nodeId: nodeId16, tabId: tabId16 }),
        true,
      ),
    )
      .then((value150) => ({
        ok: true,
        images: filterExtractedImageCandidates(value150?.images),
        pageUrl: String(value150?.pageUrl || ''),
        pageTitle: String(value150?.pageTitle || ''),
      }))
      .catch((error10) => {
        return (
          logDiagnosticEvent?.({
            type: 'web_preview.extract_images_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview image extraction failed',
            error: error10,
            context: { nodeId: nodeId16, tabId: tabId16 },
          }),
          { ok: false, error: 'extract-failed', images: [] }
        );
      });
  }
  function run39(value151, nodeId17, tabId17) {
    return Promise.resolve(
      value151.executeJavaScript(
        buildWebPreviewVideoExtractionScript({ nodeId: nodeId17, tabId: tabId17 }),
        true,
      ),
    )
      .then((value152) => ({
        ok: true,
        videos: filterExtractedVideoCandidates(value152?.videos),
        douyinDetailApiUrls: Array.isArray(value152?.douyinDetailApiUrls) ? value152.douyinDetailApiUrls : [],
        pageUrl: String(value152?.pageUrl || ''),
        pageTitle: String(value152?.pageTitle || ''),
      }))
      .catch((error11) => {
        return (
          logDiagnosticEvent?.({
            type: 'web_preview.extract_videos_failed',
            level: 'warn',
            source: 'main',
            message: 'Web preview video extraction failed',
            error: error11,
            context: { nodeId: nodeId17, tabId: tabId17 },
          }),
          { ok: false, error: 'extract-failed', videos: [], douyinDetailApiUrls: [] }
        );
      });
  }
  function controlView(options4 = {}) {
    const nodeId18 = toNodeId(options4?.nodeId),
      tabId18 = toTabId(options4?.tabId),
      action = String(options4?.action || '').trim();
    if (!nodeId18) return { ok: false, error: 'missing-node' };
    const response16 = count2.get(toEntryKey(nodeId18, tabId18));
    if (!response16?.view?.webContents || response16.view.webContents.isDestroyed?.())
      return { ok: false, error: 'missing-view' };
    const webContents3 = response16.view.webContents;
    if (action === 'back') {
      if (!webContents3.canGoBack?.())
        return (
          run(nodeId18, { type: 'blocked', message: '没有上一页' }, tabId18),
          { ok: false, error: 'no-history', ...getNavigationState(webContents3) }
        );
      webContents3.goBack?.();
    } else {
      if (action === 'forward') {
        if (!webContents3.canGoForward?.())
          return (
            run(nodeId18, { type: 'blocked', message: '没有下一页' }, tabId18),
            { ok: false, error: 'no-history', ...getNavigationState(webContents3) }
          );
        webContents3.goForward?.();
      } else {
        if (action === 'reload') {
          const value153 = response16.url || response16.requestedUrl || '';
          ((response16.holdSnapshotOnNextLoadStart = Boolean(
            response16.hasSnapshot === true &&
            response16.snapshotUrl &&
            value153 &&
            response16.snapshotUrl === value153,
          )),
            (response16.snapshotStaleAfterLoad = false));
          if (typeof webContents3.reloadIgnoringCache === 'function') webContents3.reloadIgnoringCache();
          else {
            if (typeof webContents3.reload === 'function') webContents3.reload();
            else
              (response16.url || response16.requestedUrl) &&
                void webContents3.loadURL?.(response16.url || response16.requestedUrl);
          }
        } else {
          if (action === 'extract-media') {
            if (typeof webContents3.executeJavaScript !== 'function')
              return { ok: false, error: 'unsupported-action' };
            return Promise.all([
              run38(webContents3, nodeId18, tabId18),
              run39(webContents3, nodeId18, tabId18),
            ]).then(async ([imageResult, videoResult]) => {
              if (imageResult?.ok === false && videoResult?.ok === false)
                return { ok: false, error: 'extract-failed' };
              const pageUrl3 = String(
                  videoResult?.pageUrl ||
                    imageResult?.pageUrl ||
                    response16.url ||
                    response16.requestedUrl ||
                    '',
                ),
                pageTitle2 = String(videoResult?.pageTitle || imageResult?.pageTitle || '');
              let value154 = { images: [], videos: [], detailApiUrls: [], fetchedCount: 0 };
              if (typeof resolveDouyinMedia === 'function')
                try {
                  value154 =
                    (await resolveDouyinMedia({
                      pageUrl: pageUrl3,
                      pageTitle: pageTitle2,
                      nodeId: nodeId18,
                      tabId: tabId18,
                      imageResult: imageResult,
                      videoResult: videoResult,
                      webContents: webContents3,
                      logDiagnosticEvent: logDiagnosticEvent,
                    })) || value154;
                } catch (error12) {
                  logDiagnosticEvent?.({
                    type: 'web_preview.douyin_media_resolve_failed',
                    level: 'warn',
                    source: 'main',
                    message: 'Douyin media resolver failed',
                    error: error12,
                    context: { nodeId: nodeId18, tabId: tabId18, pageUrl: pageUrl3 },
                  });
                }
              return {
                ok: true,
                action: action,
                ...(options4?.tabId ? { tabId: tabId18 } : {}),
                images: mergeExtractedImageCandidates(value154?.images, imageResult?.images),
                videos: mergeExtractedVideoCandidates(value154?.videos, videoResult?.videos),
                pageUrl: pageUrl3,
                pageTitle: pageTitle2,
                douyin: {
                  detailApiUrls: Array.isArray(value154?.detailApiUrls) ? value154.detailApiUrls : [],
                  fetchedCount: Number(value154?.fetchedCount || 0) || 0,
                },
                ...getNavigationState(webContents3),
              };
            });
          } else {
            if (action === 'extract-images') {
              if (typeof webContents3.executeJavaScript !== 'function')
                return { ok: false, error: 'unsupported-action' };
              return run38(webContents3, nodeId18, tabId18).then((error13) =>
                error13.ok === false
                  ? { ok: false, error: error13.error || 'extract-failed' }
                  : {
                      ok: true,
                      action: action,
                      ...(options4?.tabId ? { tabId: tabId18 } : {}),
                      images: error13.images,
                      pageUrl: String(error13.pageUrl || response16.url || response16.requestedUrl || ''),
                      pageTitle: String(error13?.pageTitle || ''),
                      ...getNavigationState(webContents3),
                    },
              );
            } else {
              if (action === 'extract-videos') {
                if (typeof webContents3.executeJavaScript !== 'function')
                  return { ok: false, error: 'unsupported-action' };
                return run39(webContents3, nodeId18, tabId18).then((error14) =>
                  error14.ok === false
                    ? { ok: false, error: error14.error || 'extract-failed' }
                    : {
                        ok: true,
                        action: action,
                        ...(options4?.tabId ? { tabId: tabId18 } : {}),
                        videos: error14.videos,
                        pageUrl: String(error14.pageUrl || response16.url || response16.requestedUrl || ''),
                        pageTitle: String(error14?.pageTitle || ''),
                        ...getNavigationState(webContents3),
                      },
                );
              } else {
                if (action === 'capture-reference') {
                  if (
                    typeof webContents3.executeJavaScript !== 'function' ||
                    typeof webContents3.capturePage !== 'function'
                  )
                    return { ok: false, error: 'unsupported-action' };
                  return Promise.all([
                    Promise.resolve(
                      webContents3.executeJavaScript(buildWebPreviewReferenceSnapshotScript(), true),
                    ),
                    Promise.resolve(webContents3.capturePage()).then(
                      (value155) => value155?.toDataURL?.() || '',
                    ),
                  ])
                    .then(([value156, value157]) => ({
                      ok: true,
                      action: action,
                      ...(options4?.tabId ? { tabId: tabId18 } : {}),
                      pageUrl: String(value156?.pageUrl || response16.url || response16.requestedUrl || ''),
                      pageTitle: String(value156?.pageTitle || webContents3.getTitle?.() || ''),
                      selectedText: String(value156?.selectedText || '').slice(
                        0,
                        WEB_PREVIEW_SELECTED_TEXT_LIMIT,
                      ),
                      screenshotDataUrl: String(value157 || ''),
                      capturedAt: new Date().toISOString(),
                      ...getNavigationState(webContents3),
                    }))
                    .catch((error15) => {
                      return (
                        logDiagnosticEvent?.({
                          type: 'web_preview.capture_reference_failed',
                          level: 'warn',
                          source: 'main',
                          message: 'Web preview reference capture failed',
                          error: error15,
                          context: { nodeId: nodeId18, tabId: tabId18 },
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
      run3(nodeId18, webContents3, tabId18),
      {
        ok: true,
        action: action,
        ...(options4?.tabId ? { tabId: tabId18 } : {}),
        ...getNavigationState(webContents3),
      }
    );
  }
  return {
    syncViews: syncViews,
    disposeViews: disposeViews,
    controlView: controlView,
    getEntryCount: () => count2.size,
    _getEntry: (value158, value159 = 'default') => count2.get(toEntryKey(value158, value159)),
  };
}
