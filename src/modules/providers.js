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
  APIMART_API_ROUTES.find((_0x4fb2c9) => _0x4fb2c9.id === DEFAULT_APIMART_ROUTE_ID)?.apiUrl ||
  'https://api.apib.ai';
function normalizeRouteApiUrl(_0x305fa2) {
  return String(_0x305fa2 || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/v1$/i, '');
}
export function getApimartRouteById(_0x420ad4) {
  const _0x2c0d85 = String(_0x420ad4 || '').trim();
  return (
    APIMART_API_ROUTES.find((_0x4b862c) => _0x4b862c.id === _0x2c0d85) ||
    APIMART_API_ROUTES.find((_0x760ceb) => _0x760ceb.id === DEFAULT_APIMART_ROUTE_ID)
  );
}
export function getApimartApiUrlForRoute(_0x2fcf74) {
  return getApimartRouteById(_0x2fcf74)?.apiUrl || DEFAULT_APIMART_API_URL;
}
export function resolveApimartRouteByApiUrl(_0xa46d3a) {
  const _0x308cf8 = normalizeRouteApiUrl(_0xa46d3a);
  if (!_0x308cf8) return null;
  return APIMART_API_ROUTES.find((_0xdb2ef7) => normalizeRouteApiUrl(_0xdb2ef7.apiUrl) === _0x308cf8) || null;
}
export const getDisplayModelName = (_0x13cafe) => {
  if (!_0x13cafe) return '';
  const _0x1ac447 = getModelManifest(_0x13cafe);
  if (_0x1ac447?.displayName) return translateManifestText(_0x1ac447.displayName);
  const _0x464a99 = {
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
  return translateManifestText(_0x464a99[_0x13cafe] || _0x13cafe);
};
export const PROVIDERS_META = {
  grsai: {
    id: 'grsai',
    label: 'GRSAI',
    defaultUrl: 'https://grsai.dakka.com.cn',
    logoPath: 'images/grsai.png',
  },
  openai: { id: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com', logoPath: null },
  ppio: { id: 'ppio', label: '派欧云', defaultUrl: 'https://api.ppio.com', logoPath: 'images/ppio.png' },
  apimart: { id: 'apimart', label: 'APIMart', defaultUrl: DEFAULT_APIMART_API_URL, logoPath: null },
  agnes: { id: 'agnes', label: 'Agnes AI', defaultUrl: 'https://apihub.agnes-ai.com', logoPath: null },
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
