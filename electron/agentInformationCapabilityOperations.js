import { lookup } from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

export const AGENT_URL_READER_MAX_BYTES = 1024 * 1024;
export const AGENT_URL_READER_MAX_CHARS = 60000;
export const AGENT_URL_READER_TIMEOUT_MS = 15000;

const MAX_REDIRECTS = 4;
const ALLOWED_PORTS = new Set(['', '80', '443']);
const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.home', '.lan'];

function createCapabilityError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function normalizeHostname(hostname = '') {
  return String(hostname || '')
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '');
}

function isBlockedIpv4(address = '') {
  const octets = String(address).split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return true;
  }
  const [a, b, c] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBlockedIpv6(address = '') {
  const normalized = String(address || '')
    .toLowerCase()
    .split('%')[0];
  if (!normalized || normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('::')) return true;
  const prefix = Number.parseInt(normalized.split(':')[0] || '0', 16);
  return (prefix & 0xe000) !== 0x2000 || normalized.startsWith('2001:db8:');
}

export function isPublicAgentInformationAddress(address = '') {
  const family = net.isIP(String(address || ''));
  if (family === 4) return !isBlockedIpv4(address);
  if (family === 6) return !isBlockedIpv6(address);
  return false;
}

export function normalizeAgentInformationUrl(rawUrl = '') {
  let url;
  try {
    url = new URL(String(rawUrl || '').trim());
  } catch {
    throw createCapabilityError('INVALID_URL', '请输入有效的 HTTP 或 HTTPS URL。');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw createCapabilityError('UNSUPPORTED_URL_PROTOCOL', '仅支持 HTTP 或 HTTPS URL。');
  }
  if (url.username || url.password) {
    throw createCapabilityError('URL_CREDENTIALS_FORBIDDEN', 'URL 不能包含用户名或密码。');
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw createCapabilityError('URL_PORT_FORBIDDEN', 'URL 读取仅允许标准 HTTP/HTTPS 端口。');
  }
  const hostname = normalizeHostname(url.hostname);
  if (
    !hostname ||
    hostname === 'localhost' ||
    BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    throw createCapabilityError('PRIVATE_URL_FORBIDDEN', '不能读取本机或内部网络地址。');
  }
  if (net.isIP(hostname) && !isPublicAgentInformationAddress(hostname)) {
    throw createCapabilityError('PRIVATE_URL_FORBIDDEN', '不能读取私有、保留或本机网络地址。');
  }
  url.hash = '';
  return url;
}

async function resolvePinnedAddress(url, resolveHostname) {
  const hostname = normalizeHostname(url.hostname);
  if (net.isIP(hostname)) return { address: hostname, family: net.isIP(hostname) };
  let resolved;
  try {
    resolved = await resolveHostname(hostname, { all: true, verbatim: true });
  } catch {
    throw createCapabilityError('URL_DNS_FAILED', '无法解析该 URL 的主机名。');
  }
  const candidates = (Array.isArray(resolved) ? resolved : [resolved])
    .map((entry) =>
      typeof entry === 'string'
        ? { address: entry, family: net.isIP(entry) }
        : { address: String(entry?.address || ''), family: Number(entry?.family || 0) },
    )
    .filter((entry) => entry.address && entry.family);
  if (candidates.length === 0) {
    throw createCapabilityError('URL_DNS_FAILED', '无法解析该 URL 的主机名。');
  }
  if (candidates.some((entry) => !isPublicAgentInformationAddress(entry.address))) {
    throw createCapabilityError('PRIVATE_URL_FORBIDDEN', 'URL 解析到了私有、保留或本机网络地址。');
  }
  return candidates[0];
}

function requestPinnedUrl(url, { address, family, signal, timeoutMs, maxBytes } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createCapabilityError('URL_READ_ABORTED', 'URL 读取已取消。'));
      return;
    }
    const transport = url.protocol === 'https:' ? https : http;
    const defaultPort = url.protocol === 'https:' ? 443 : 80;
    const hostHeader = url.port ? url.hostname + ':' + url.port : url.hostname;
    let settled = false;
    let timeoutId = null;
    const finish = (handler, value) => {
      if (settled) return;
      settled = true;
      if (timeoutId) clearTimeout(timeoutId);
      signal?.removeEventListener?.('abort', onAbort);
      handler(value);
    };
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: address,
        family,
        port: Number(url.port || defaultPort),
        path: '' + (url.pathname || '/') + (url.search || ''),
        method: 'GET',
        servername: normalizeHostname(url.hostname),
        rejectUnauthorized: true,
        headers: {
          Host: hostHeader,
          Accept:
            'text/html,application/xhtml+xml,text/plain,application/json,application/xml;q=0.9,*/*;q=0.1',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Canvas-Agent-URL-Reader/1.0',
        },
      },
      (response) => {
        const status = Number(response.statusCode || 0);
        const headers = response.headers || {};
        if (status >= 300 && status < 400 && headers.location) {
          response.resume();
          finish(resolve, { status, headers, body: Buffer.alloc(0) });
          return;
        }
        const chunks = [];
        let totalBytes = 0;
        response.on('data', (chunk) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          totalBytes += buffer.length;
          if (totalBytes > maxBytes) {
            response.destroy(
              createCapabilityError(
                'URL_RESPONSE_TOO_LARGE',
                '网页响应超过 ' + maxBytes + ' 字节限制。',
              ),
            );
            return;
          }
          chunks.push(buffer);
        });
        response.on('end', () =>
          finish(resolve, { status, headers, body: Buffer.concat(chunks) }),
        );
        response.on('error', (error) => finish(reject, error));
      },
    );
    const onAbort = () => request.destroy(createCapabilityError('URL_READ_ABORTED', 'URL 读取已取消。'));
    signal?.addEventListener?.('abort', onAbort, { once: true });
    timeoutId = setTimeout(
      () => request.destroy(createCapabilityError('URL_READ_TIMEOUT', 'URL 读取超时。')),
      timeoutMs,
    );
    request.setTimeout(timeoutMs, () =>
      request.destroy(createCapabilityError('URL_READ_TIMEOUT', 'URL 读取超时。')),
    );
    request.on('error', (error) => finish(reject, error));
    request.end();
  });
}

function getHeader(headers = {}, name = '') {
  const value = headers[String(name || '').toLowerCase()];
  return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function decodeBody(body, contentType = '') {
  const charset = String(contentType).match(/charset\s*=\s*["']?([^;\s"']+)/i)?.[1] || 'utf-8';
  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    return new TextDecoder('utf-8').decode(body);
  }
}

function decodeHtmlEntities(text = '') {
  const named = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return String(text).replace(
    /&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
    (match, entity) => {
      if (entity[0] !== '#') return named[entity.toLowerCase()] || match;
      const radix = entity[1]?.toLowerCase() === 'x' ? 16 : 10;
      const digits = radix === 16 ? entity.slice(2) : entity.slice(1);
      const codePoint = Number.parseInt(digits, radix);
      try {
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
      } catch {
        return match;
      }
    },
  );
}

function normalizeExtractedText(text = '') {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractAgentInformationHtml(html = '') {
  const source = String(html || '');
  const title = normalizeExtractedText(
    decodeHtmlEntities(
      source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, ' ') || '',
    ),
  );
  const content = normalizeExtractedText(
    decodeHtmlEntities(
      source
        .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, ' ')
        .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<(?:br|hr)\b[^>]*>/gi, '\n')
        .replace(
          /<\/(?:address|article|aside|blockquote|dd|div|dl|dt|footer|form|h[1-6]|header|li|main|nav|ol|p|pre|section|table|tr|ul)>/gi,
          '\n',
        )
        .replace(/<[^>]+>/g, ' '),
    ),
  );
  return { title, content };
}

function isSupportedTextContentType(contentType = '') {
  const mime = String(contentType || '').split(';')[0].trim().toLowerCase();
  return (
    !mime ||
    mime.startsWith('text/') ||
    ['application/json', 'application/ld+json', 'application/xhtml+xml', 'application/xml'].includes(
      mime,
    )
  );
}

export function createAgentInformationCapabilityOperations({
  resolveHostname = lookup,
  requestUrl = requestPinnedUrl,
  timeoutMs = AGENT_URL_READER_TIMEOUT_MS,
  maxBytes = AGENT_URL_READER_MAX_BYTES,
  maxChars = AGENT_URL_READER_MAX_CHARS,
} = {}) {
  async function readUrl(payload = {}) {
    let url = normalizeAgentInformationUrl(payload.url);
    const requestedUrl = url.toString();
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const pinned = await resolvePinnedAddress(url, resolveHostname);
      const response = await requestUrl(url, {
        ...pinned,
        signal: payload.signal,
        timeoutMs,
        maxBytes,
      });
      if (response.status >= 300 && response.status < 400) {
        const location = getHeader(response.headers, 'location');
        if (!location) throw createCapabilityError('URL_REDIRECT_INVALID', '网页返回了无效重定向。');
        if (redirectCount === MAX_REDIRECTS) {
          throw createCapabilityError('URL_TOO_MANY_REDIRECTS', '网页重定向次数过多。');
        }
        url = normalizeAgentInformationUrl(new URL(location, url).toString());
        continue;
      }
      if (response.status < 200 || response.status >= 300) {
        throw createCapabilityError(
          'URL_HTTP_ERROR',
          '网页请求失败（HTTP ' + (response.status || 0) + '）。',
        );
      }
      const contentType = getHeader(response.headers, 'content-type');
      const contentEncoding = getHeader(response.headers, 'content-encoding').trim().toLowerCase();
      if (contentEncoding && contentEncoding !== 'identity') {
        throw createCapabilityError(
          'UNSUPPORTED_URL_CONTENT_ENCODING',
          '网页返回了不支持的内容编码：' + contentEncoding + '。',
        );
      }
      if (!isSupportedTextContentType(contentType)) {
        throw createCapabilityError(
          'UNSUPPORTED_URL_CONTENT_TYPE',
          '当前仅支持网页和文本 URL，暂不支持 ' + (contentType || '该文件类型') + '。',
        );
      }
      const body = decodeBody(response.body, contentType);
      const extracted = /(?:text\/html|application\/xhtml\+xml)/i.test(contentType)
        ? extractAgentInformationHtml(body)
        : { title: '', content: normalizeExtractedText(body) };
      if (!extracted.content) {
        throw createCapabilityError('URL_CONTENT_EMPTY', '网页没有可读取的正文内容。');
      }
      const truncated = extracted.content.length > maxChars;
      return {
        success: true,
        source: {
          requestedUrl,
          finalUrl: url.toString(),
          title: extracted.title,
          contentType: contentType.split(';')[0].trim().toLowerCase(),
          content: truncated ? extracted.content.slice(0, maxChars) : extracted.content,
          byteLength: response.body.length,
          truncated,
          trust: 'untrusted_external',
        },
      };
    }
    throw createCapabilityError('URL_TOO_MANY_REDIRECTS', '网页重定向次数过多。');
  }
  return { readUrl };
}

export const __agentInformationCapabilityForTest = Object.freeze({
  requestPinnedUrl,
});
