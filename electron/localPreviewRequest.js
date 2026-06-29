import path from 'node:path';
import { statSync } from 'node:fs';

const LOCAL_VIRTUAL_MEDIA_PATH_RE = /^(?:\/)?(?:output\/|data\/assets\/|data\/uploads\/)/i;

function normalizeText(value) {
  return String(value || '').trim();
}

function pickVirtualLocalPath(payload = {}) {
  const candidates = [payload.localPath, payload.url, payload.src];
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized && LOCAL_VIRTUAL_MEDIA_PATH_RE.test(normalized)) {
      return normalized;
    }
  }
  return '';
}

export function sanitizeLocalPreviewRequest(payload = {}, { statPath = statSync } = {}) {
  const request = payload && typeof payload === 'object' ? { ...payload } : {};
  const absolutePath = normalizeText(request.path);
  const fallbackLocalPath = pickVirtualLocalPath(request);

  if (!absolutePath || !fallbackLocalPath || !path.isAbsolute(absolutePath)) {
    return request;
  }

  try {
    if (statPath(absolutePath)?.isFile?.()) {
      return request;
    }
  } catch {}

  delete request.path;
  return request;
}
