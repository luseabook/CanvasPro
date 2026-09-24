import { assertNodeExportSender } from './nodeMediaExportService.js';
import { normalizeMediaTaskHistoryQuery, isHistoryUuid } from '../src/modules/mediaTaskHistoryModel.js';

const onlyKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => keys.includes(key));
export function registerMediaTaskHistoryIpc({ ipcMain, getMediaTaskHistory, getNodeExportWindow, isNodeExportAppUrl }) {
  if (typeof getMediaTaskHistory !== 'function') return; // Original hosts/tests retain their original three channels.
  const assertSender = event => assertNodeExportSender(event, getNodeExportWindow(), isNodeExportAppUrl);
  function handle(name, validate, action) {
    ipcMain.handle(`mediaTaskHistory:${name}`, async (event, payload = {}) => {
      assertSender(event);
      const request = validate(payload), history = getMediaTaskHistory();
      try {
        const data = await action(history, request, () => assertSender(event));
        assertSender(event);
        return { version: 1, ok: true, ...data };
      } catch (error) {
        assertSender(event);
        const status = await history.status();
        assertSender(event);
        return { version: 1, ok: false, status, error: error.historyCode ? error.message : '历史查询或记录操作失败，未确认保存；请读取当前状态，不自动重试' };
      }
    });
  }
  const empty = value => { if (!onlyKeys(value, []) ) throw new Error('历史接口不接受路径或额外参数'); return {}; };
  handle('status', empty, async history => ({ status: await history.status() }));
  handle('read', normalizeMediaTaskHistoryQuery, async (history, query) => ({ ...(await history.read(query)), status: await history.status() }));
  handle('configure', value => {
    if (!onlyKeys(value, ['enabled', 'expectedSession', 'expectedControlRevision']) || typeof value.enabled !== 'boolean' ||
        !isHistoryUuid(value.expectedSession) || !Number.isSafeInteger(value.expectedControlRevision) || value.expectedControlRevision < 0) throw new Error('历史设置参数无效');
    return { enabled: value.enabled, expectedSession: value.expectedSession, expectedControlRevision: value.expectedControlRevision };
  }, async (history, request, assertAllowed) => ({ status: await history.configure(request, { assertAllowed }) }));
  handle('flush', empty, async (history, request, assertAllowed) => ({ status: await history.flush({ assertAllowed }) }));
}
