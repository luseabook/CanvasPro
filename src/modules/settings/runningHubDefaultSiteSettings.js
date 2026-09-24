import {
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  applyRunningHubWorkflowDefaultProfileId,
  getRunningHubWorkflowDefaultProfileId,
  normalizeRunningHubModelApiProfileId,
} from '../runningHubProviderProfiles.js';
const DEFAULT_SITE_BUTTON_SELECTOR = '[data-runninghub-default-site]';
export function createRunningHubDefaultSiteSettings({
  root: root = globalThis['document'],
  onSelectionChange: _0x24512b,
} = {}) {
  const _0x5910e3 = Array['from'](root?.['querySelectorAll']?.(DEFAULT_SITE_BUTTON_SELECTOR) || []);
  let _0x16d8c0 = RUNNINGHUB_DOMESTIC_PROFILE_ID,
    _0x4d366a = ![];
  const _0x265e6b = new Map(),
    _0x36e7e1 = () => {
      _0x5910e3['forEach']((_0x73e128) => {
        const _0x11bed7 = normalizeRunningHubModelApiProfileId(
            _0x73e128?.['dataset']?.['runninghubDefaultSite'],
          ),
          _0x2adeae = _0x11bed7 === _0x16d8c0;
        (_0x73e128['classList']?.['toggle']('is-active', _0x2adeae),
          _0x73e128['setAttribute']?.('aria-pressed', _0x2adeae ? 'true' : 'false'));
      });
    },
    _0x1d9d01 = (_0x447943) => {
      return ((_0x16d8c0 = normalizeRunningHubModelApiProfileId(_0x447943)), _0x36e7e1(), _0x16d8c0);
    },
    _0x17abe2 = () => {
      (_0x5910e3['forEach']((_0x2fa56c) => {
        if (_0x265e6b['has'](_0x2fa56c)) return;
        const _0x3447cc = () => {
          _0x4d366a = !![];
          const _0x5dd7a9 = _0x1d9d01(_0x2fa56c?.['dataset']?.['runninghubDefaultSite']);
          _0x24512b?.(_0x5dd7a9);
        };
        (_0x265e6b['set'](_0x2fa56c, _0x3447cc), _0x2fa56c['addEventListener']?.('click', _0x3447cc));
      }),
        _0x36e7e1());
    },
    _0x52a10 = () => {
      (_0x265e6b['forEach']((_0x2c17e7, _0x33dbf7) => {
        _0x33dbf7['removeEventListener']?.('click', _0x2c17e7);
      }),
        _0x265e6b['clear']());
    },
    _0xc0dd31 = (_0x445626 = {}) =>
      _0x4d366a ? _0x16d8c0 : _0x1d9d01(getRunningHubWorkflowDefaultProfileId(_0x445626)),
    _0x1e3534 = (_0x352edd = {}) => applyRunningHubWorkflowDefaultProfileId(_0x352edd, _0x16d8c0);
  return {
    bind: _0x17abe2,
    destroy: _0x52a10,
    loadConfig: _0xc0dd31,
    applyToConfig: _0x1e3534,
    getSelectedProfileId: () => _0x16d8c0,
    setSelectedProfileId: _0x1d9d01,
  };
}
