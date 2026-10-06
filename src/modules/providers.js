import { getModelManifest } from '../manifests/index.js';
import { translateManifestText } from '../i18n/manifestText.js';
export const APIMART_ROUTE_IDS = Object.freeze({
  DOMESTIC_1: 'domestic1',
  DOMESTIC_2: 'domestic2',
  OVERSEAS: 'overseas',
});
export const APIMART_API_ROUTES = Object.freeze([
  Object.freeze({ id: APIMART_ROUTE_IDS.DOMESTIC_1, label: '国内线路1', apiUrl: 'https://api.apib.ai' }),
  Object.freeze({ id: APIMART_ROUTE_IDS.DOMESTIC_2, label: '国内线路2', apiUrl: 'https://api.aishuch.com' }),
  Object.freeze({ id: APIMART_ROUTE_IDS.OVERSEAS, label: '海外线路', apiUrl: 'https://api.apimart.ai' }),
]);
export const DEFAULT_APIMART_ROUTE_ID = APIMART_ROUTE_IDS.DOMESTIC_1;
export const DEFAULT_APIMART_API_URL =
  APIMART_API_ROUTES.find((item) => item.id === DEFAULT_APIMART_ROUTE_ID)?.apiUrl || 'https://api.apib.ai';
function normalizeRouteApiUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '');
}
export function getApimartRouteById(key) {
  const index = String(key || '').trim();
  return (
    APIMART_API_ROUTES.find((item2) => item2.id === index) ||
    APIMART_API_ROUTES.find((item3) => item3.id === DEFAULT_APIMART_ROUTE_ID)
  );
}
export function getApimartApiUrlForRoute(result) {
  return getApimartRouteById(result)?.apiUrl || DEFAULT_APIMART_API_URL;
}
export function resolveApimartRouteByApiUrl(data) {
  const routeApiUrl = normalizeRouteApiUrl(data);
  if (!routeApiUrl) return null;
  return APIMART_API_ROUTES.find((item4) => normalizeRouteApiUrl(item4.apiUrl) === routeApiUrl) || null;
}
export const getDisplayModelName = (enabled) => {
  if (!enabled) return '';
  const modelManifest = getModelManifest(enabled);
  if (modelManifest?.displayName) return translateManifestText(modelManifest.displayName);
  const options = {
    'minimax/minimax-m2.5-highspeed': 'MiniMax M2.5-highspeed',
    'qwen/qwen3.5-397b-a17b': 'Qwen3.5-397B-A17B',
    'deepseek/deepseek-v3.2': 'DeepSeek-V3.2',
    'moonshotai/kimi-k2.5': 'Kimi K2.5',
    'apimart/gemini-3.1-pro-preview': 'Gemini 3.1 Pro Preview',
    'apimart/gemini-3-flash-preview-nothinking': 'Gemini 3 Flash (No Thinking)',
    'gpt-image-2': 'GPT image 2',
    'gpt-image-2-vip': 'GPT image 2',
    'nano-banana': 'Nanobanana',
    'nano-banana-fast': 'Nanobanana',
    'nano-banana-pro': 'NanobananaPRO',
    'nano-banana-pro-vt': 'NanobananaPRO',
    'nano-banana-pro-cl': 'NanobananaPRO',
    'nano-banana-pro-vip': 'NanobananaPRO',
    'nano-banana-pro-4k-vip': 'NanobananaPRO',
    'nano-banana-2': 'Nanobanana2',
    'nano-banana-2-cl': 'Nanobanana2',
    'nano-banana-2-4k-cl': 'Nanobanana2',
    'apimart/gpt-5.4': 'GPT-5.4',
    'seedance-2.0-fast': 'Seedance 2.0 Fast',
    'seedance-2.0': 'Seedance 2.0',
    'aicanvas/text-lite': 'AICanvas Text Lite',
    'aicanvas/text-pro': 'AICanvas Text Pro',
    'aicanvas/image-lite': 'AICanvas Image Lite',
    'aicanvas/image-pro': 'AICanvas Image Pro',
  };
  return translateManifestText(options[enabled] || enabled);
};
export const GRSAI_API_ROUTES = Object.freeze([
  Object.freeze({ id: 'domestic', apiUrl: 'https://grsai.dakka.com.cn' }),
  Object.freeze({ id: 'global', apiUrl: 'https://grsaiapi.com' }),
]);
export const PROVIDERS_META = {
  grsai: {
    id: 'grsai',
    label: 'GRSAI',
    defaultUrl: GRSAI_API_ROUTES[0].apiUrl,
    apiRoutes: GRSAI_API_ROUTES,
    defaultRouteId: 'domestic',
    logoPath: 'images/grsai.png',
  },
  openai: { id: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com', logoPath: null },
  ppio: { id: 'ppio', label: '派欧云', defaultUrl: 'https://api.ppio.com', logoPath: 'images/ppio.png' },
  apimart: {
    id: 'apimart',
    label: 'APIMart',
    defaultUrl: DEFAULT_APIMART_API_URL,
    apiRoutes: APIMART_API_ROUTES,
    defaultRouteId: DEFAULT_APIMART_ROUTE_ID,
    logoPath: null,
  },
  // 国内 / 国际是两条互不相通的线路：域名不同，而且 API Key 不能互换（跨线路会 401）。
  // 因此把它们定义为两个独立厂商，各自拥有独立的密钥输入框与配置项。
  'agnes-domestic': {
    id: 'agnes-domestic',
    label: 'Agnes AI（国内）',
    defaultUrl: 'https://api.agnes-ai.cn',
    logoPath: null,
  },
  agnes: {
    id: 'agnes',
    label: 'Agnes AI（国际）',
    defaultUrl: 'https://apihub.agnes-ai.com',
    logoPath: null,
  },
  volcengine: {
    id: 'volcengine',
    label: '火山方舟',
    defaultUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    logoPath: 'images/volcengine.svg',
  },
  runninghub: {
    id: 'runninghub',
    taskHistoryUrls: {
      workflow: 'https://www.runninghub.cn/call-api/bill-task',
    },
    label: 'RunningHUB',
    defaultUrl: 'https://www.runninghub.cn',
    logoPath: 'images/RH.png',
  },
  runninghubwf: {
    id: 'runninghubwf',
    taskHistoryUrls: {
      workflow: 'https://www.runninghub.cn/call-api/bill-task',
    },
    label: 'RunningHUB工作流',
    defaultUrl: 'https://www.runninghub.cn',
    logoPath: 'images/RH.png',
  },
  dreamina: { id: 'dreamina', label: '即梦', defaultUrl: '', logoPath: null },
  aicanvas: { id: 'aicanvas', label: 'AICanvas', defaultUrl: '', logoPath: 'images/favicon.svg' },
};
export function getAllProviderIds() {
  return Object.keys(PROVIDERS_META);
}

export function resolveProviderApiRoute(target, source = {}) {
  const next = PROVIDERS_META[target],
    enabled2 = next?.apiRoutes;
  if (!enabled2) return null;
  const current = String(source.apiUrl || '')
      .trim()
      .replace(/\/+$/, ''),
    entry = enabled2.find(
      (record) => normalizeRouteApiUrl(record.apiUrl) === normalizeRouteApiUrl(current),
    );
  if (current) return { apiUrl: current, routeId: entry?.id || '' };
  const payload =
    enabled2.find((handle) => handle.id === source.routeId) ||
    enabled2.find((state) => state.id === next.defaultRouteId);
  return { apiUrl: payload.apiUrl, routeId: payload.id };
}
