import {
  normalizePersonReplacementPromptMode,
  PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
  PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
  isPersonReplacementTestModeAvailable,
} from './personReplacementPromptMode.js';
import { isPersonReplacementGenerationTaskActive } from './personReplacementGenerationTaskIdentity.js';
import { resolvePersonReplacementImageGenerationState } from './personReplacementImageGeneration.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { syncPersonReplacementPromptReferenceInputs } from './personReplacementIdentityPresentation.js';
function selectedShot(_0x528cab) {
  return (
    _0x528cab['shots']?.['find'](
      (_0x4720a5) => _0x4720a5['id'] === _0x528cab['workspace']?.['selectedShotId'],
    ) ||
    _0x528cab['shots']?.[0x0] ||
    null
  );
}
function isPromptModeLocked(_0x3dad8a, _0x6cb9aa = []) {
  const _0x22c0ef = selectedShot(_0x3dad8a);
  return (
    !_0x22c0ef ||
    _0x6cb9aa['includes'](_0x22c0ef['id']) ||
    isPersonReplacementGenerationTaskActive(
      resolvePersonReplacementImageGenerationState(_0x3dad8a['workspace'], _0x22c0ef['id']),
    )
  );
}
function modePresentation(_0x47bb44) {
  const _0x458589 = normalizePersonReplacementPromptMode(selectedShot(_0x47bb44)?.['replacementPromptMode']),
    _0x432064 = _0x458589 === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
    _0x53916b = _0x458589 === PERSON_REPLACEMENT_PROMPT_MODE_TEST;
  return {
    positioning: _0x458589 !== PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
    label: _0x53916b
      ? '测试模式'
      : _0x458589 === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL
        ? '手动模式'
        : _0x432064
          ? '指定替换'
          : '全部替换',
    tooltip: _0x53916b
      ? '测试模式仅限开发者：图1叠加人物框和参考图号，不发送独立定位图。点击切换为全部替换。'
      : _0x458589 === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL
        ? '手动模式：直接提交原图和参考图，不添加默认提示词、定位图或\x20AI\x20增强。请自行填写完整提示词，可输入\x20@\x20引用素材。点击切换为' +
          (isPersonReplacementTestModeAvailable() ? '测试模式' : '全部替换') +
          '。'
        : _0x432064
          ? '指定替换：只框选并绑定需要替换的人物，其余人物保持原样。用户提示词作为补充。点击切换为手动模式。'
          : '全部替换：用于一次替换画面中的所有人物。请检查人物框齐全并全部绑定；用户提示词作为补充。点击切换为指定替换。',
  };
}
export function isPersonReplacementManualPromptMode(_0x165873) {
  return selectedShot(_0x165873)?.['replacementPromptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL;
}
export const PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP =
  '手动模式仅使用你填写的提示词，不执行 AI 提示词增强。切回替换模式后恢复增强设置。';
export function renderPersonReplacementPromptModeControl(
  _0x58a2e4,
  { pendingShotIds: pendingShotIds = [] } = {},
) {
  const { positioning: _0x289b6c, label: _0x38e6a9, tooltip: _0x305699 } = modePresentation(_0x58a2e4);
  return (
    '<button type="button" class="story-secondary-button person-replacement-toggle-button person-replacement-prompt-mode-toggle" data-person-replacement-action="toggle-prompt-mode" aria-pressed="' +
    _0x289b6c +
    '" aria-label="' +
    _0x38e6a9 +
    '" data-tooltip="仅对当前选中的片段生效。' +
    _0x305699 +
    '\x22\x20' +
    (isPromptModeLocked(_0x58a2e4, pendingShotIds) ? 'disabled' : '') +
    '>' +
    _0x38e6a9 +
    '</button>'
  );
}
function syncModeButton(_0x41d637, _0x4fbbe8) {
  const { positioning: _0x462ad8, label: _0x58d1d3, tooltip: _0x689bea } = modePresentation(_0x4fbbe8);
  if (_0x41d637['textContent'] !== _0x58d1d3) _0x41d637['textContent'] = _0x58d1d3;
  for (const [_0x27ad02, _0x2232cc] of Object['entries']({
    'aria-pressed': String(_0x462ad8),
    'aria-label': _0x58d1d3,
    'data-tooltip': '仅对当前选中的片段生效。' + _0x689bea,
  })) {
    if (_0x41d637['getAttribute']?.(_0x27ad02) !== _0x2232cc)
      _0x41d637['setAttribute']?.(_0x27ad02, _0x2232cc);
  }
}
export function syncPersonReplacementPromptModeControl(_0x3bc520, _0x1326bb, _0x10bfad = []) {
  const _0x1847f4 = _0x3bc520?.['querySelector']?.(
    '[data-person-replacement-action=\x22toggle-prompt-mode\x22]',
  );
  if (!_0x1847f4) return;
  (syncModeButton(_0x1847f4, _0x1326bb),
    (_0x1847f4['disabled'] = isPromptModeLocked(_0x1326bb, _0x10bfad)),
    syncPersonReplacementPromptReferenceInputs(
      _0x3bc520,
      _0x1326bb,
      buildPersonReplacementPromptPackage({ project: _0x1326bb, shot: selectedShot(_0x1326bb) || {} }),
    ));
  const _0x32f8a1 = _0x3bc520?.['querySelector']?.(
    '[data-person-replacement-action="toggle-prompt-enhancement"]',
  );
  if (_0x32f8a1) {
    const _0xf1f4aa = isPersonReplacementManualPromptMode(_0x1326bb);
    ((_0x32f8a1['disabled'] = _0xf1f4aa || _0x1847f4['disabled']),
      _0x32f8a1['setAttribute'](
        'aria-pressed',
        String(!_0xf1f4aa && _0x1326bb['settings']?.['replacementPromptEnhancementEnabled'] === !![]),
      ),
      _0x32f8a1['setAttribute'](
        'data-tooltip',
        _0xf1f4aa
          ? PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP
          : _0x32f8a1['getAttribute']('data-auto-tooltip') || '使用画布 Agent 当前模型补充替换提示词。',
      ));
  }
}
export function applyPersonReplacementPromptControlAction(_0x4da90a, _0x187808, _0x4a673e, _0x53ffbf = []) {
  if (_0x4a673e['disabled']) return null;
  if (_0x187808 === 'toggle-prompt-enhancement') {
    if (isPersonReplacementManualPromptMode(_0x4da90a)) return null;
    const _0x2f8187 = _0x4da90a['settings']['replacementPromptEnhancementEnabled'] !== !![];
    return (
      _0x4a673e['setAttribute']?.('aria-pressed', String(_0x2f8187)),
      {
        patch: { settings: { ..._0x4da90a['settings'], replacementPromptEnhancementEnabled: _0x2f8187 } },
        reason: 'image-prompt-enhancement',
      }
    );
  }
  if (_0x187808 !== 'toggle-prompt-mode' || isPromptModeLocked(_0x4da90a, _0x53ffbf)) return null;
  const _0x432c04 = selectedShot(_0x4da90a),
    _0x1a677f = normalizePersonReplacementPromptMode(_0x432c04['replacementPromptMode']),
    _0x47f4fe = {
      ..._0x432c04,
      replacementPromptMode:
        _0x1a677f === PERSON_REPLACEMENT_PROMPT_MODE_REGULAR
          ? PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
          : _0x1a677f === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
            ? PERSON_REPLACEMENT_PROMPT_MODE_MANUAL
            : _0x1a677f === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL && isPersonReplacementTestModeAvailable()
              ? PERSON_REPLACEMENT_PROMPT_MODE_TEST
              : PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
    },
    _0x5d537f = _0x4da90a['shots']['map']((_0x11b26c) =>
      _0x11b26c['id'] === _0x432c04['id'] ? _0x47f4fe : _0x11b26c,
    );
  return (
    syncModeButton(_0x4a673e, { ..._0x4da90a, shots: _0x5d537f }),
    { patch: { shots: _0x5d537f }, reason: 'image-prompt-mode' }
  );
}
