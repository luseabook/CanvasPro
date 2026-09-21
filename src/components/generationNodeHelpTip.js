import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
  getModelManifest,
} from '../manifests/index.js';
import { RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP } from '../manifests/audio/runninghub/runningHubAudioAdvancedVoiceCloneManifest.js';
import { t } from '../i18n/index.js';
import { translateManifestText } from '../i18n/manifestText.js';
export const ADVANCED_VOICE_CLONE_HELP_TOOLTIP = RH_AUDIO_ADVANCED_VOICE_CLONE_HELP_TOOLTIP;
const HELP_HIGHLIGHT_PATTERN = /\[\[red:([^\]]+)\]\]/g,
  ADVANCED_VOICE_CLONE_ALIASES = [
    RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
    RH_AUDIO_ADVANCED_VOICE_CLONE_RUNNINGHUB_MODEL_ID,
    ...(getModelManifest(RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID)?.subscriptionAliases || []),
    '进阶声音克隆',
  ],
  GENERATION_NODE_HELP_TOOLTIP_MAP = Object.fromEntries(
    ADVANCED_VOICE_CLONE_ALIASES.map((_0x59111d) => [
      'audio:' + String(_0x59111d || '').trim(),
      ADVANCED_VOICE_CLONE_HELP_TOOLTIP,
    ]).filter(([_0xf3cc72]) => _0xf3cc72 !== 'audio:'),
  );
function helpTipText(_0x2ffe36, _0x140b4c = {}) {
  return t('generationNodeHelpTip.' + _0x2ffe36, _0x140b4c);
}
function getHelpConditionFieldValue(_0xab3bb7 = {}, _0x11855c = '') {
  const _0x10e746 = String(_0x11855c || '').trim();
  if (!_0x10e746) return undefined;
  const _0x341844 =
    _0xab3bb7?.generationParams && typeof _0xab3bb7.generationParams === 'object'
      ? _0xab3bb7.generationParams
      : {};
  if (Object.prototype.hasOwnProperty.call(_0x341844, _0x10e746)) return _0x341844[_0x10e746];
  if (Object.prototype.hasOwnProperty.call(_0xab3bb7 || {}, _0x10e746)) return _0xab3bb7[_0x10e746];
  const _0x5894fe = _0x10e746.split('.').filter(Boolean);
  if (_0x5894fe.length <= 1) return undefined;
  let _0x2e293c = _0xab3bb7;
  for (const _0x5d39fa of _0x5894fe) {
    if (!_0x2e293c || typeof _0x2e293c !== 'object') return undefined;
    _0x2e293c = _0x2e293c[_0x5d39fa];
  }
  return _0x2e293c;
}
function helpConditionMatches(_0x1a8dea, _0x3bd108 = {}) {
  if (!_0x1a8dea || typeof _0x1a8dea !== 'object') return false;
  if (Array.isArray(_0x1a8dea.any))
    return _0x1a8dea.any.some((_0x17703d) => helpConditionMatches(_0x17703d, _0x3bd108));
  if (Array.isArray(_0x1a8dea.all))
    return _0x1a8dea.all.every((_0x29645f) => helpConditionMatches(_0x29645f, _0x3bd108));
  const _0x3efa4d = String(_0x1a8dea.field || '').trim();
  if (!_0x3efa4d) return false;
  const _0x146af9 = getHelpConditionFieldValue(_0x3bd108, _0x3efa4d),
    _0x58568d = Array.isArray(_0x1a8dea.values)
      ? _0x1a8dea.values
      : Object.prototype.hasOwnProperty.call(_0x1a8dea, 'value')
        ? [_0x1a8dea.value]
        : [];
  if (_0x58568d.length === 0) return Boolean(_0x146af9);
  return _0x58568d.some(
    (_0x1d6976) => _0x146af9 === _0x1d6976 || String(_0x146af9 ?? '') === String(_0x1d6976 ?? ''),
  );
}
function resolveManifestHelpText(_0x317e89, _0x4c47fb = {}) {
  const _0x556c99 = _0x317e89?.help;
  if (!_0x556c99 || typeof _0x556c99 !== 'object') return '';
  const _0x3c3ddd = Array.isArray(_0x556c99.variants) ? _0x556c99.variants : [];
  for (const _0x3e9acc of _0x3c3ddd) {
    if (_0x3e9acc && typeof _0x3e9acc === 'object' && helpConditionMatches(_0x3e9acc.when, _0x4c47fb)) {
      const _0x53ff1c = String(_0x3e9acc.tooltip || _0x3e9acc.text || '').trim();
      if (_0x53ff1c) return translateManifestText(_0x53ff1c);
    }
  }
  const _0x1eadb9 = String(_0x556c99.tooltip || _0x556c99.text || '').trim();
  return _0x1eadb9 ? translateManifestText(_0x1eadb9) : '';
}
export function getGenerationNodeHelpTooltip({
  kind: kind = '',
  key: key = '',
  model: model = '',
  label: label = '',
  nodeData: nodeData = {},
} = {}) {
  const _0x281739 = String(kind || '').trim(),
    _0x1500eb = [key, model, label].map((_0x53461a) => String(_0x53461a || '').trim()).filter(Boolean);
  for (const _0x55897b of _0x1500eb) {
    const _0x29115f = getModelManifest(_0x55897b),
      _0x5cd376 = resolveManifestHelpText(_0x29115f, nodeData);
    if (_0x5cd376) return _0x5cd376;
    const _0xf74610 = _0x281739 ? _0x281739 + ':' + _0x55897b : '',
      _0x21ea15 =
        (_0xf74610 && GENERATION_NODE_HELP_TOOLTIP_MAP[_0xf74610]) ||
        GENERATION_NODE_HELP_TOOLTIP_MAP[_0x55897b] ||
        '';
    if (_0x21ea15) return translateManifestText(_0x21ea15);
  }
  return '';
}
export function stripGenerationNodeHelpMarkup(_0x450dbf = '') {
  return (
    (HELP_HIGHLIGHT_PATTERN.lastIndex = 0),
    String(_0x450dbf || '').replace(HELP_HIGHLIGHT_PATTERN, '$1')
  );
}
export function createGenerationNodeHelpTipController({
  panel: _0x25bf08,
  getHelpText: _0x14d75c,
  ariaLabel: ariaLabel = helpTipText('ariaLabel'),
} = {}) {
  let _0x2af41b = null,
    _0x318345 = null,
    _0x347bd4 = null;
  const _0x447d20 = () => (typeof _0x14d75c === 'function' ? String(_0x14d75c() || '') : ''),
    _0x3c2224 = (_0x169f44, _0x193796) => {
      const _0x34b296 = String(_0x193796 || '');
      HELP_HIGHLIGHT_PATTERN.lastIndex = 0;
      let _0x5da355 = 0,
        _0x3d4cfc = HELP_HIGHLIGHT_PATTERN.exec(_0x34b296);
      while (_0x3d4cfc) {
        _0x3d4cfc.index > _0x5da355 &&
          _0x169f44.appendChild(document.createTextNode(_0x34b296.slice(_0x5da355, _0x3d4cfc.index)));
        const _0x2c3d77 = document.createElement('span');
        ((_0x2c3d77.className = 'generation-node-help-emphasis'),
          (_0x2c3d77.textContent = _0x3d4cfc[1]),
          _0x169f44.appendChild(_0x2c3d77),
          (_0x5da355 = _0x3d4cfc.index + _0x3d4cfc[0].length),
          (_0x3d4cfc = HELP_HIGHLIGHT_PATTERN.exec(_0x34b296)));
      }
      _0x5da355 < _0x34b296.length &&
        _0x169f44.appendChild(document.createTextNode(_0x34b296.slice(_0x5da355)));
    },
    _0x41c5ee = (_0xe17f0f, _0x5182f5, _0x282ba2 = '') => {
      const _0x534871 = document.createElement('div');
      if (_0x282ba2) _0x534871.className = _0x282ba2;
      return (_0x3c2224(_0x534871, _0x5182f5), _0xe17f0f.appendChild(_0x534871), _0x534871);
    },
    _0x2167f7 = (_0xb1be98, _0x45dafd, _0x48c9cd) => {
      const _0x2afee3 = document.createElement('div');
      _0x2afee3.className = 'generation-node-help-example-line';
      const _0x456569 = document.createElement('span');
      ((_0x456569.className = 'generation-node-help-ref-pill'),
        (_0x456569.textContent = _0x45dafd),
        _0x2afee3.appendChild(_0x456569),
        _0x2afee3.appendChild(document.createTextNode(' ' + _0x48c9cd)),
        _0xb1be98.appendChild(_0x2afee3));
    },
    _0x3eaed0 = (_0x5cca68, _0x404364) => {
      String(_0x404364 || '')
        .split('\n')
        .forEach((_0x3ed5cd, _0x1e40cd) => {
          _0x41c5ee(
            _0x5cca68,
            _0x3ed5cd,
            _0x1e40cd === 0 && /用法$/.test(String(_0x3ed5cd || '').trim())
              ? 'generation-node-help-title'
              : '',
          );
        });
    },
    _0x20d49d = (_0x365f54 = '') =>
      String(_0x365f54 || '')
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((_0x3e8c92) => _0x3e8c92.trim().replace(/^`|`$/g, '')),
    _0x22ceaf = (_0x5f1f0d = '') =>
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(String(_0x5f1f0d || '')),
    _0x880e36 = (_0x1f8462, _0x564e52) => {
      const _0x33f223 = String(_0x564e52 || '').split('\n'),
        _0x1d6f8e = _0x33f223.findIndex((_0x42a9ee, _0x5bb8f5) => {
          if (_0x5bb8f5 === 0 || !_0x22ceaf(_0x42a9ee)) return false;
          return String(_0x33f223[_0x5bb8f5 - 1] || '').includes('|');
        });
      if (_0x1d6f8e < 1) return false;
      _0x33f223.slice(0, _0x1d6f8e - 1).forEach((_0x366663, _0xe13410) => {
        const _0x4d6a80 = String(_0x366663 || '').trim();
        if (!_0x4d6a80) return;
        _0x41c5ee(
          _0x1f8462,
          _0x4d6a80,
          _0xe13410 === 0 && /用法说明$/.test(_0x4d6a80) ? 'generation-node-help-title' : '',
        );
      });
      const _0x113262 = document.createElement('table');
      _0x113262.className = 'generation-node-help-table';
      const _0x57c826 = document.createElement('thead'),
        _0x332364 = document.createElement('tr');
      (_0x20d49d(_0x33f223[_0x1d6f8e - 1]).forEach((_0x276982) => {
        const _0x58cb2b = document.createElement('th');
        (_0x3c2224(_0x58cb2b, _0x276982), _0x332364.appendChild(_0x58cb2b));
      }),
        _0x57c826.appendChild(_0x332364),
        _0x113262.appendChild(_0x57c826));
      const _0x48cdf6 = document.createElement('tbody');
      return (
        _0x33f223.slice(_0x1d6f8e + 1).forEach((_0x304688) => {
          if (!String(_0x304688 || '').includes('|')) return;
          const _0x49ff5d = document.createElement('tr');
          (_0x20d49d(_0x304688).forEach((_0x199541) => {
            const _0x43b7f6 = document.createElement('td');
            (_0x3c2224(_0x43b7f6, _0x199541), _0x49ff5d.appendChild(_0x43b7f6));
          }),
            _0x48cdf6.appendChild(_0x49ff5d));
        }),
        _0x113262.appendChild(_0x48cdf6),
        _0x1f8462.appendChild(_0x113262),
        true
      );
    },
    _0x2e108c = (_0x3c076e, _0x1e6f19) => {
      ((_0x3c076e.textContent = ''), _0x3c076e.classList.remove('has-table'));
      if (_0x880e36(_0x3c076e, _0x1e6f19)) {
        _0x3c076e.classList.add('has-table');
        return;
      }
      if (_0x1e6f19 !== ADVANCED_VOICE_CLONE_HELP_TOOLTIP) {
        _0x3eaed0(_0x3c076e, _0x1e6f19);
        return;
      }
      (_0x41c5ee(_0x3c076e, helpTipText('advancedVoiceClone.title'), 'generation-node-help-title'),
        _0x41c5ee(_0x3c076e, helpTipText('advancedVoiceClone.duration')),
        _0x41c5ee(_0x3c076e, helpTipText('advancedVoiceClone.noAudio')),
        _0x41c5ee(
          _0x3c076e,
          helpTipText('advancedVoiceClone.promptExample'),
          'generation-node-help-muted-line',
        ),
        _0x41c5ee(_0x3c076e, helpTipText('advancedVoiceClone.oneAudio')),
        _0x41c5ee(_0x3c076e, helpTipText('advancedVoiceClone.twoAudio')),
        _0x41c5ee(_0x3c076e, helpTipText('advancedVoiceClone.examples')),
        _0x2167f7(
          _0x3c076e,
          helpTipText('advancedVoiceClone.audio1'),
          helpTipText('advancedVoiceClone.exampleSpeaker1'),
        ),
        _0x2167f7(
          _0x3c076e,
          helpTipText('advancedVoiceClone.audio2'),
          helpTipText('advancedVoiceClone.exampleSpeaker2'),
        ));
      return;
      (_0x41c5ee(_0x3c076e, '进阶声音克隆用法', 'generation-node-help-title'),
        _0x41c5ee(_0x3c076e, '支持 [[red:3~15 秒音频]]'),
        _0x41c5ee(_0x3c076e, '[[red:无音频入参]]时 TTS语音 根据提示词生成随机音色'),
        _0x41c5ee(_0x3c076e, '例：今晚月色真好', 'generation-node-help-muted-line'),
        _0x41c5ee(_0x3c076e, '[[red:1个音频入参]]时 克隆语音'),
        _0x41c5ee(_0x3c076e, '[[red:2个音频入参]]时 多人克隆音色对话'),
        _0x41c5ee(_0x3c076e, '例：'),
        _0x2167f7(_0x3c076e, '@音频1', '你今晚回家吗'),
        _0x2167f7(_0x3c076e, '@音频2', '不回了加班要忙到很晚'));
    },
    _0x24a676 = () => {
      if (!_0x25bf08) return null;
      if (_0x2af41b && _0x2af41b.parentNode === _0x25bf08) return _0x2af41b;
      const _0x13c1be = _0x25bf08.querySelector('.generation-node-help-tip');
      if (_0x13c1be) return ((_0x2af41b = _0x13c1be), _0x13c1be);
      const _0x2a0d4e = document.createElement('button');
      return (
        (_0x2a0d4e.type = 'button'),
        (_0x2a0d4e.className = 'rh-tip generation-node-help-tip'),
        (_0x2a0d4e.textContent = '!'),
        _0x2a0d4e.setAttribute('aria-label', ariaLabel),
        _0x2a0d4e.addEventListener('mouseenter', _0x2aaa2e),
        _0x2a0d4e.addEventListener('mouseleave', _0x4cc3db),
        _0x2a0d4e.addEventListener('focus', _0x2aaa2e),
        _0x2a0d4e.addEventListener('blur', _0x4cc3db),
        _0x2a0d4e.addEventListener('click', (_0x5304d4) => {
          (_0x5304d4.preventDefault(), _0x5304d4.stopPropagation());
        }),
        _0x2a0d4e.addEventListener('pointerdown', (_0x162336) => {
          (_0x162336.preventDefault(), _0x162336.stopPropagation());
        }),
        _0x25bf08.appendChild(_0x2a0d4e),
        (_0x2af41b = _0x2a0d4e),
        _0x2a0d4e
      );
    },
    _0x36cd3e = () => {
      if (_0x318345?.isConnected) return _0x318345;
      const _0xecc3dc = document.createElement('div');
      return (
        (_0xecc3dc.className = 'generation-node-help-tooltip-portal'),
        _0xecc3dc.setAttribute('role', 'tooltip'),
        document.body.appendChild(_0xecc3dc),
        (_0x318345 = _0xecc3dc),
        _0xecc3dc
      );
    },
    _0x17b6af = () => {
      if (!_0x2af41b || !_0x318345) return;
      const _0x1c8e94 = 12,
        _0x3132af = _0x2af41b.getBoundingClientRect(),
        _0x373b35 = _0x318345.offsetWidth || 0x154,
        _0x1dbb98 = _0x318345.offsetHeight || 0,
        _0x1284d5 = Math.max(_0x1c8e94, window.innerWidth - _0x373b35 - _0x1c8e94),
        _0x464eb5 = _0x3132af.right - _0x373b35 + 6,
        _0x52276c = Math.min(Math.max(_0x1c8e94, _0x464eb5), _0x1284d5),
        _0x53c090 = _0x3132af.top - _0x1dbb98 - _0x1c8e94,
        _0xe8f70d = _0x3132af.bottom + _0x1c8e94,
        _0x1a6aa6 = _0x53c090 < _0x1c8e94,
        _0x4896e3 = _0x1a6aa6 ? _0xe8f70d : _0x53c090,
        _0x431420 = Math.min(Math.max(_0x3132af.left + _0x3132af.width / 2 - _0x52276c, 16), _0x373b35 - 16);
      ((_0x318345.style.left = _0x52276c + 'px'),
        (_0x318345.style.top = _0x4896e3 + 'px'),
        _0x318345.classList.toggle('is-below', _0x1a6aa6),
        _0x318345.style.setProperty('--generation-node-help-tooltip-arrow-left', _0x431420 + 'px'));
    },
    _0x2aaa2e = () => {
      const _0x52f572 = _0x447d20();
      if (!_0x52f572 || _0x2af41b?.classList.contains('is-hidden')) return;
      const _0x8666ae = _0x36cd3e();
      (_0x2e108c(_0x8666ae, _0x52f572),
        _0x8666ae.classList.add('is-open'),
        _0x17b6af(),
        !_0x347bd4 &&
          ((_0x347bd4 = () => _0x17b6af()),
          window.addEventListener('scroll', _0x347bd4, true),
          window.addEventListener('resize', _0x347bd4)));
    },
    _0x4cc3db = () => {
      _0x318345?.classList.remove('is-open');
      if (!_0x347bd4) return;
      (window.removeEventListener('scroll', _0x347bd4, true),
        window.removeEventListener('resize', _0x347bd4),
        (_0x347bd4 = null));
    },
    _0x5416f7 = () => {
      const _0x5da5f9 = _0x2af41b || _0x24a676();
      if (!_0x5da5f9) return;
      const _0x2fad32 = _0x447d20(),
        _0x5cb687 = Boolean(_0x2fad32);
      _0x5da5f9.classList.toggle('is-hidden', !_0x5cb687);
      _0x5cb687
        ? _0x5da5f9.setAttribute('data-tooltip', stripGenerationNodeHelpMarkup(_0x2fad32))
        : _0x5da5f9.removeAttribute('data-tooltip');
      _0x25bf08?.classList.toggle('has-generation-node-help-tip', _0x5cb687);
      if (!_0x5cb687) _0x4cc3db();
    },
    _0x55e048 = () => {
      (_0x4cc3db(), _0x318345?.remove(), (_0x318345 = null));
    };
  return { sync: _0x5416f7, remove: _0x55e048 };
}
export function attachGenerationNodeHelpTip(
  _0xd8032e,
  {
    panel: _0x505b37,
    kind: _0x581a2f,
    getKey: _0x40f86b,
    getModel: getModel = _0x40f86b,
    getLabel: _0x41fbfa,
    getNodeData: _0x529d23,
    ariaLabel: _0xc03d21,
  } = {},
) {
  if (!_0xd8032e || !_0x505b37) return null;
  return (
    (_0xd8032e._generationNodeHelpTip = createGenerationNodeHelpTipController({
      panel: _0x505b37,
      getHelpText: () =>
        getGenerationNodeHelpTooltip({
          kind: _0x581a2f,
          key: typeof _0x40f86b === 'function' ? _0x40f86b() : '',
          model: typeof getModel === 'function' ? getModel() : '',
          label: typeof _0x41fbfa === 'function' ? _0x41fbfa() : '',
          nodeData: typeof _0x529d23 === 'function' ? _0x529d23() : {},
        }),
      ariaLabel: _0xc03d21,
    })),
    _0xd8032e._generationNodeHelpTip.sync(),
    _0xd8032e._generationNodeHelpTip
  );
}
