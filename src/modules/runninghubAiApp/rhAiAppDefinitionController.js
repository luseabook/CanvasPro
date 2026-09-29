import { fetchRunningHubDefinition } from '../../../api/runningHubDefinitionApi.js';
import { isRunningHubSource, SOURCE_TYPES } from './rhAiAppSources.js';
import { parseRunningHubAiAppInput } from './rhAiAppImport.js';
import { createRunningHubWorkflowComponentDrafts } from './rhWorkflowImport.js';
import { resolveRunningHubModelApiBaseUrl } from '../runningHubProviderProfiles.js';
export function createRhAiAppDefinitionController(
  _0x275114,
  { fetchDefinition: fetchDefinition = fetchRunningHubDefinition } = {},
) {
  let _0x2a513e = null,
    _0x2d86c8 = null,
    _0x561058 = null,
    _0x363360 = null,
    _0x2c6eb1 = null;
  const _0x34a3b6 = (_0x11b1b7) => {
      const _0x5d6c3a = _0x275114['workflowInputFieldEl']?.['querySelector'](
        '[data-role="workflow-input-shell"]',
      );
      (_0x5d6c3a?.['setAttribute']('aria-busy', String(_0x11b1b7)),
        _0x5d6c3a?.['classList']['toggle']('is-loading', _0x11b1b7));
    },
    _0x10efe0 = (_0x2e8ddd) => {
      if (!_0x2c6eb1) return;
      ((_0x2c6eb1['disabled'] = _0x2e8ddd),
        _0x2c6eb1['setAttribute']('aria-busy', String(_0x2e8ddd)),
        _0x2c6eb1['classList']['toggle']('is-loading', _0x2e8ddd),
        (_0x2c6eb1['querySelector']('span')['textContent'] = _0x2e8ddd ? '正在解析…' : '解析连接'));
    },
    _0x118ceb = {
      syncInputSource() {
        if (!isRunningHubSource(_0x275114['sourceType'])) return;
        const _0x5a816a = _0x275114['_getInputText']();
        let _0x2a79fd;
        try {
          _0x2a79fd = JSON['parse'](_0x5a816a);
        } catch {}
        let _0x118796,
          _0x212c23,
          _0x4a6c76 = _0x275114['runningHubProfileId'];
        if (_0x2a79fd?.['workflow'])
          ((_0x212c23 = createRunningHubWorkflowComponentDrafts(_0x5a816a)['parsed']['workflowId']),
            (_0x118796 = SOURCE_TYPES['runninghubWorkflow']));
        else {
          const _0x6f944a = parseRunningHubAiAppInput(_0x5a816a);
          if (!_0x6f944a['body']['appId'] && !_0x6f944a['body']['aiAppId'] && _0x6f944a['body']['workflowId'])
            return;
          ((_0x212c23 = _0x6f944a['appId']),
            (_0x4a6c76 = _0x6f944a['providerProfileId'] || _0x4a6c76),
            (_0x118796 = SOURCE_TYPES['runninghub']));
        }
        (_0x275114['sourceType'] !== _0x118796 &&
          ((_0x275114['savedAppId'] = ''),
          (_0x275114['componentDrafts'] = []),
          (_0x275114['componentCandidates'] = []),
          (_0x275114['componentDraftKey'] = ''),
          (_0x275114['promptHelpTooltip'] = ''),
          (_0x275114['sourceType'] = _0x118796),
          _0x275114['_syncSourceView']()),
          (_0x275114['definitionReference'] = _0x118ceb['getSavedReference']({
            sourceType: _0x118796,
            runningHubProfileId: _0x4a6c76,
            input: JSON['stringify']({ appId: _0x212c23 }),
          })),
          _0x118ceb['sync']());
      },
      beginFileRead() {
        (_0x118ceb['cancel'](), window['clearTimeout'](_0x275114['parseTimer']));
        const _0x3f3cd6 = {};
        return (
          (_0x2d86c8 = _0x3f3cd6),
          (_0x275114['workflowInputCollapsed'] = ![]),
          _0x275114['_syncWorkflowInputCollapsed'](),
          _0x34a3b6(!![]),
          {
            isCurrent: () => _0x2d86c8 === _0x3f3cd6,
            finish() {
              _0x2d86c8 === _0x3f3cd6 && ((_0x2d86c8 = null), _0x34a3b6(![]));
            },
          }
        );
      },
      getSavedReference(_0x137702) {
        if (!isRunningHubSource(_0x137702['sourceType'])) return '';
        try {
          const _0x5f5790 = JSON['parse'](_0x137702['input']),
            _0x4b8607 = _0x5f5790['workflowId'] || _0x5f5790['appId'];
          if (!/^\d{1,30}$/['test'](String(_0x4b8607 || ''))) return '';
          return (
            resolveRunningHubModelApiBaseUrl(_0x137702['runningHubProfileId']) +
            '/' +
            (_0x137702['sourceType'] === 'runninghub-workflow' ? 'workflow' : 'ai-detail') +
            '/' +
            _0x4b8607
          );
        } catch {
          return '';
        }
      },
      mount() {
        ((_0x561058 = document['createElement']('div')),
          (_0x561058['className'] = 'rh-ai-app-definition'),
          (_0x561058['innerHTML'] =
            '<div class="rh-ai-app-definition-head">\n          <label class="rh-ai-app-label rh-ai-app-input-title" for="rh-definition-reference">RunningHub 链接</label>\n          <div class="rh-ai-app-site-links">\n            <a href="https://www.runninghub.cn/ai-apps?inviteCode=rh-v1312" target="_blank" rel="noopener noreferrer">国内站 <span aria-hidden="true">↗</span></a>\n            <a href="https://www.runninghub.ai/ai-apps?inviteCode=rh-v1312" target="_blank" rel="noopener noreferrer">国际站 <span aria-hidden="true">↗</span></a>\n          </div>\n        </div>\n        <div class="rh-ai-app-definition-row">\n          <input id="rh-definition-reference" data-role="definition-reference" type="text" autocomplete="off" spellcheck="false" />\n          <button type="button" class="rh-ai-app-secondary" data-action="fetch-definition"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12 0l2 5M4 12l2 5a7 7 0 0 0 12 0"/></svg><span>解析连接</span></button>\n        </div>'),
          _0x275114['panel']['querySelector']('[data-role="workbench"]')['prepend'](_0x561058),
          (_0x363360 = _0x561058['querySelector']('input')),
          (_0x2c6eb1 = _0x561058['querySelector']('button')),
          _0x363360['addEventListener']('input', () => {
            (_0x118ceb['cancel'](),
              (_0x275114['definitionReference'] = _0x363360['value']),
              _0x275114['_saveKindState']());
          }),
          _0x363360['addEventListener']('keydown', (_0x22e192) => {
            if (_0x22e192['key'] !== 'Enter' || _0x22e192['isComposing']) return;
            (_0x22e192['preventDefault'](), void _0x118ceb['load']());
          }),
          _0x275114['textarea']['addEventListener']('input', _0x118ceb['cancel']),
          _0x275114['panel']['addEventListener']('input', (_0x995ad3) => {
            if (_0x995ad3['target'] !== _0x363360) _0x118ceb['cancel']();
          }),
          _0x275114['panel']['addEventListener'](
            'click',
            () => {
              if (_0x2d86c8) _0x118ceb['cancel']();
            },
            !![],
          ),
          _0x2c6eb1['addEventListener']('click', () => void _0x118ceb['load']()),
          _0x118ceb['sync']());
      },
      sync() {
        if (!_0x561058) return;
        ((_0x561058['hidden'] = !isRunningHubSource(_0x275114['sourceType'])),
          (_0x363360['placeholder'] = '粘贴 AI 应用或工作流链接，自动识别类型'),
          (_0x363360['value'] = _0x275114['definitionReference'] || ''));
      },
      cancel() {
        ((_0x2d86c8 = null), _0x34a3b6(![]));
        const _0x1f02df = _0x2a513e;
        ((_0x2a513e = null), _0x1f02df?.['abort'](), _0x10efe0(![]));
      },
      async load() {
        if (_0x2a513e || !isRunningHubSource(_0x275114['sourceType'])) return;
        if (!_0x275114['_guardRunningHubAiAppAccess']()) return;
        _0x118ceb['cancel']();
        const _0x15254e = new AbortController();
        _0x2a513e = _0x15254e;
        const _0x105abf = {
            sourceType: _0x275114['sourceType'],
            kind: _0x275114['kind'],
            profileId: _0x275114['runningHubProfileId'],
            reference: _0x363360['value']['trim'](),
          },
          _0x466ff2 = _0x275114['_getInputText']();
        (_0x10efe0(!![]), _0x275114['_setError'](''));
        try {
          const _0x327de2 = await fetchDefinition({
            ..._0x105abf,
            sourceType: 'auto',
            signal: _0x15254e['signal'],
          });
          if (
            _0x2a513e !== _0x15254e ||
            _0x275114['sourceType'] !== _0x105abf['sourceType'] ||
            _0x275114['kind'] !== _0x105abf['kind'] ||
            _0x275114['_getInputText']() !== _0x466ff2
          )
            return;
          (window['clearTimeout'](_0x275114['parseTimer']),
            _0x275114['_clearCurrentDraftIdentity'](),
            (_0x275114['componentDrafts'] = []),
            (_0x275114['componentCandidates'] = []),
            (_0x275114['componentDraftKey'] = ''),
            (_0x275114['sourceType'] = _0x327de2['sourceType']),
            (_0x275114['runningHubProfileId'] = _0x327de2['providerProfileId']),
            (_0x275114['definitionReference'] = _0x105abf['reference']),
            (_0x275114['textarea']['value'] = _0x327de2['input']),
            (_0x275114['appName'] = _0x327de2['name']),
            _0x275114['_syncSourceView'](),
            _0x275114['_parseNow']());
        } catch (_0x12f9d9) {
          if (_0x2a513e !== _0x15254e || _0x15254e['signal']['aborted']) return;
          (_0x275114['_setError'](_0x12f9d9?.['message'] || '获取配置失败，请重试'),
            _0x275114['_saveKindState']());
        } finally {
          _0x2a513e === _0x15254e && ((_0x2a513e = null), _0x10efe0(![]));
        }
      },
    };
  return _0x118ceb;
}
