import { openDebugRequestWindow, closeDebugRequestWindow } from '../debugRequestWindow.js';
import { maskDebugPayloadSecrets } from '../../utils/debugRequestMasking.js';
import { buildDebugJsonPreview } from '../../utils/debugImagePreview.js';
const STORY_REQUEST_CAPTURE_CODE = 'STORY_REQUEST_DEBUG_CAPTURED';
function cloneSerializableValue(_0x4411c1) {
  return JSON['parse'](JSON['stringify'](_0x4411c1));
}
function countCharacters(_0x41d600 = '') {
  return [...String(_0x41d600 || '')]['length'];
}
function parsePromptObject(_0x5320bd = '') {
  try {
    const _0x2d7f73 = JSON['parse'](String(_0x5320bd || ''));
    return _0x2d7f73 && typeof _0x2d7f73 === 'object' ? _0x2d7f73 : null;
  } catch {
    return null;
  }
}
function formatPromptForPreview(_0x4b8de7 = '') {
  const _0x29f93b = parsePromptObject(_0x4b8de7);
  return _0x29f93b ? JSON['stringify'](_0x29f93b, null, 0x2) : String(_0x4b8de7 || '');
}
function getPromptSectionCharacters(_0x38bafb) {
  if (!_0x38bafb || typeof _0x38bafb !== 'object') return {};
  return Object['fromEntries'](
    Object['entries'](_0x38bafb)['map'](([_0xfe642f, _0x52e44d]) => [
      _0xfe642f,
      countCharacters(JSON['stringify'](_0x52e44d)),
    ]),
  );
}
export async function captureStoryRequestPayload(_0x2ccb97) {
  if (typeof _0x2ccb97 !== 'function') throw new TypeError('调试请求缺少可执行的生成操作。');
  let _0x48c102 = null;
  const _0x90e44c = async (_0x3b8fe8 = {}) => {
    if (!_0x48c102) _0x48c102 = cloneSerializableValue(_0x3b8fe8);
    const _0x4dcbbc = new Error('调试请求已在发送前截获。');
    _0x4dcbbc['code'] = STORY_REQUEST_CAPTURE_CODE;
    throw _0x4dcbbc;
  };
  try {
    await _0x2ccb97(_0x90e44c);
  } catch (_0x175a26) {
    if (_0x48c102) return _0x48c102;
    throw _0x175a26;
  }
  if (_0x48c102) return _0x48c102;
  throw new Error('生成操作没有构造出可调试的 API 请求。');
}
export function buildStoryRequestDebugPreviewModel(
  _0x5dbd4c = {},
  { title: title = '剧本工作室请求调试', subtitle: subtitle = '' } = {},
) {
  const _0x115c38 = maskDebugPayloadSecrets(cloneSerializableValue(_0x5dbd4c || {})),
    _0x273667 = String(_0x115c38?.['prompt'] || ''),
    _0x2d23f5 = String(_0x115c38?.['systemPrompt'] || ''),
    _0x55ea4e = parsePromptObject(_0x273667),
    _0x5b9aa1 = String(_0x55ea4e?.['task'] || ''),
    _0x16e1b3 = Math['max'](0x0, Math['trunc'](Number(_0x55ea4e?.['batch']?.['index']) || 0x0)),
    _0x5691dc = Math['max'](0x0, Math['trunc'](Number(_0x55ea4e?.['batch']?.['total']) || 0x0)),
    _0x54ce25 = Array['isArray'](_0x55ea4e?.['batch']?.['clipPlans'])
      ? _0x55ea4e['batch']['clipPlans']['length']
      : 0x0;
  return {
    title: title,
    subtitle: subtitle,
    task: _0x5b9aa1,
    batchIndex: _0x16e1b3,
    batchTotal: _0x5691dc,
    clipCount: _0x54ce25,
    model: String(_0x115c38?.['model'] || ''),
    provider: String(_0x115c38?.['provider'] || ''),
    structuredOutputName: String(_0x115c38?.['structuredOutput']?.['name'] || ''),
    metrics: {
      promptCharacters: countCharacters(_0x273667),
      systemPromptCharacters: countCharacters(_0x2d23f5),
      requestCharacters: countCharacters(JSON['stringify'](_0x115c38)),
    },
    promptSectionCharacters: getPromptSectionCharacters(_0x55ea4e),
    tabs: [
      { id: 'prompt', label: '用户提示词', content: formatPromptForPreview(_0x273667) },
      { id: 'system', label: '系统提示词', content: _0x2d23f5 },
      { id: 'request', label: '完整请求参数', ...buildDebugJsonPreview(_0x115c38) },
      {
        id: 'sections',
        label: '区块字符统计',
        content: JSON['stringify'](
          Object['fromEntries'](
            Object['entries'](getPromptSectionCharacters(_0x55ea4e))['sort'](
              (_0x45f047, _0x30f403) => _0x30f403[0x1] - _0x45f047[0x1],
            ),
          ),
          null,
          0x2,
        ),
      },
    ],
  };
}
export function closeStoryRequestDebugPreview(_0x4e6174 = globalThis['document']) {
  closeDebugRequestWindow(_0x4e6174);
}
export function openStoryRequestDebugPreview(_0x15c2bd = {}) {
  if (_0x15c2bd['preparePayload'])
    return openDebugRequestWindow({
      ..._0x15c2bd,
      prepare: async () => ({
        tabs: buildStoryRequestDebugPreviewModel(await _0x15c2bd['preparePayload'](), _0x15c2bd)['tabs'],
      }),
    });
  const _0x4179c8 = buildStoryRequestDebugPreviewModel(_0x15c2bd['payload'], _0x15c2bd);
  return openDebugRequestWindow({ ..._0x15c2bd, tabs: _0x4179c8['tabs'] });
}
