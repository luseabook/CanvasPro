import { post } from './requester.js';

const DEFAULT_FREE_IMAGE_HOST_UPLOAD_URL = 'https://uguu.se/upload';
const FALLBACK_FREE_IMAGE_HOST_UPLOAD_URL = 'https://telegra.ph/upload';
const TELEGRAPH_BASE_URL = 'https://telegra.ph';
const DEFAULT_FILE_NAME = 'image.png';
const DEFAULT_TIMEOUT = 60000;

function buildUploadProxyUrl(uploadUrl) {
  return `/api/v2/proxy/upload?apiUrl=${encodeURIComponent(uploadUrl)}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeUrl(value) {
  const url = String(value || '').trim();
  if (!/^https?:\/\//i.test(url)) return '';
  return url;
}

function normalizeUrlWithBase(value, baseUrl = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const absoluteUrl = normalizeUrl(raw);
  if (absoluteUrl) return absoluteUrl;
  if (!baseUrl) return '';
  try {
    return normalizeUrl(new URL(raw, baseUrl).toString());
  } catch {
    return '';
  }
}

function pickUrlFromRecord(record) {
  if (!isPlainObject(record)) return '';
  return normalizeUrl(
    record.url ||
      record.downloadUrl ||
      record.download_url ||
      record.fileUrl ||
      record.file_url ||
      record.src,
  );
}

function pickUrlFromRecordWithBase(record, baseUrl = '') {
  if (!isPlainObject(record)) return '';
  return normalizeUrlWithBase(
    record.url ||
      record.downloadUrl ||
      record.download_url ||
      record.fileUrl ||
      record.file_url ||
      record.src,
    baseUrl,
  );
}

export function pickFreeImageHostUrl(payload) {
  if (typeof payload === 'string') return normalizeUrl(payload);
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const url = typeof item === 'string' ? normalizeUrl(item) : pickUrlFromRecord(item);
      if (url) return url;
    }
    return '';
  }
  if (!isPlainObject(payload)) return '';

  const directUrl = pickUrlFromRecord(payload);
  if (directUrl) return directUrl;

  const files = Array.isArray(payload.files) ? payload.files : [];
  for (const item of files) {
    const url = typeof item === 'string' ? normalizeUrl(item) : pickUrlFromRecord(item);
    if (url) return url;
  }
  return '';
}

function pickTelegraphUrl(payload) {
  if (typeof payload === 'string') return normalizeUrlWithBase(payload, TELEGRAPH_BASE_URL);
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const url =
        typeof item === 'string'
          ? normalizeUrlWithBase(item, TELEGRAPH_BASE_URL)
          : pickUrlFromRecordWithBase(item, TELEGRAPH_BASE_URL);
      if (url) return url;
    }
    return '';
  }
  if (!isPlainObject(payload)) return '';

  const directUrl = pickUrlFromRecordWithBase(payload, TELEGRAPH_BASE_URL);
  if (directUrl) return directUrl;

  const files = Array.isArray(payload.files) ? payload.files : [];
  for (const item of files) {
    const url =
      typeof item === 'string'
        ? normalizeUrlWithBase(item, TELEGRAPH_BASE_URL)
        : pickUrlFromRecordWithBase(item, TELEGRAPH_BASE_URL);
    if (url) return url;
  }
  return '';
}

function makeImageFormData(file, options = {}, fieldName = 'files[]') {
  const formData = new FormData();
  const fileName = String(options.fileName || file.name || DEFAULT_FILE_NAME).trim() || DEFAULT_FILE_NAME;
  formData.append(fieldName, file, fileName);
  return formData;
}

async function uploadToImageHost(file, options = {}, host = {}) {
  const uploadUrl = host.uploadUrl || DEFAULT_FREE_IMAGE_HOST_UPLOAD_URL;
  const fieldName = host.fieldName || 'files[]';
  const picker = host.pickUrl || pickFreeImageHostUrl;
  const formData = makeImageFormData(file, options, fieldName);
  const targetUrl = options.useProxy === false ? uploadUrl : buildUploadProxyUrl(uploadUrl);
  const response = await post(targetUrl, formData, {
    provider: 'free-image-host',
    buildUrl: options.useProxy === false ? false : true,
    timeout: Number(options.timeout || DEFAULT_TIMEOUT),
    responseType: 'auto',
  });
  const url = picker(response);
  if (!url) throw new Error('免费图床上传失败：未返回可用 URL');
  return url;
}

async function uploadToUguuImageHost(file, options = {}) {
  return uploadToImageHost(file, options, {
    uploadUrl: options.uploadUrl || DEFAULT_FREE_IMAGE_HOST_UPLOAD_URL,
    fieldName: 'files[]',
    pickUrl: pickFreeImageHostUrl,
  });
}

async function uploadToTelegraphImageHost(file, options = {}) {
  return uploadToImageHost(file, options, {
    uploadUrl: FALLBACK_FREE_IMAGE_HOST_UPLOAD_URL,
    fieldName: 'file',
    pickUrl: pickTelegraphUrl,
  });
}

export async function uploadToFreeImageHost(file, options = {}) {
  if (!file) throw new Error('免费图床上传失败：文件不能为空');

  try {
    return await uploadToUguuImageHost(file, options);
  } catch (primaryError) {
    if (options.uploadUrl) throw primaryError;
    try {
      return await uploadToTelegraphImageHost(file, options);
    } catch (fallbackError) {
      const message = fallbackError?.message || primaryError?.message || '未知错误';
      throw new Error(`免费图床上传失败：${message}`);
    }
  }
}

export const 免费图床 = uploadToFreeImageHost;
