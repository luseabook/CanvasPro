import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { QWEN_IMAGE_21_EDIT_MODEL_ID } from '../../manifests/image/runninghub/qwenImage21EditManifest.js';
import {
  PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementImageSourceRef,
  resolvePersonReplacementTargetCharacterId,
} from './personReplacementProject.js';
import { resolvePersonReplacementImageGenerationState } from './personReplacementImageGeneration.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import {
  getPersonReplacementBoxedPeople,
  resolvePersonReplacementDetectionLabel,
} from './personReplacementSourceIdentity.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { renderAIGenImageModelSelectorMarkup } from '../../components/aigenImage/modelSelector.js';
import { renderWorkspaceAssetLoadingOverlay } from '../workspaceAssetPresentation.js';
import { renderPersonReplacementPreviewArrow } from './personReplacementAssetPresentation.js';
import { renderWorkspaceImageDownloadButton } from '../workspaceImageDownload.js';
import { renderWorkspaceUploadIcon } from '../workspaceActionIcons.js';
import { normalizePersonReplacementLayout } from './personReplacementProjectSession.js';
import { renderPersonReplacementPromptHtml } from './personReplacementPromptMentions.js';
import { resolvePersonReplacementSourcePlaybackRef } from './personReplacementSourcePlayback.js';
import {
  renderPersonReplacementPromptModeControl,
  isPersonReplacementManualPromptMode,
  PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP,
} from './personReplacementPromptControls.js';
import { buildPersonReplacementImageGate } from './personReplacementImageGate.js';
function normalizeText(_0x9393c9) {
  return String(_0x9393c9 ?? '')['trim']();
}
export function syncPersonReplacementImageStageFrame(_0x529a7f) {
  const _0x436e20 = Math['max'](0x0, Number(_0x529a7f?.['naturalWidth']) || 0x0),
    _0x1f8543 = Math['max'](0x0, Number(_0x529a7f?.['naturalHeight']) || 0x0),
    _0x1990f7 = _0x529a7f?.['closest']?.('[data-person-replacement-keyframe-stage]');
  if (!(_0x436e20 > 0x0 && _0x1f8543 > 0x0) || !_0x1990f7?.['style']) return ![];
  (_0x1990f7['style']['setProperty']('--frame-aspect', _0x436e20 + ' / ' + _0x1f8543),
    _0x1990f7['style']['setProperty']('--frame-width', String(_0x436e20)),
    _0x1990f7['style']['setProperty']('--frame-height', String(_0x1f8543)),
    _0x529a7f['setAttribute']?.('width', String(_0x436e20)),
    _0x529a7f['setAttribute']?.('height', String(_0x1f8543)));
  const _0x165805 = _0x1990f7['parentElement'],
    _0x10be8e = _0x165805?.['getBoundingClientRect']?.(),
    _0x41b087 = Math['max'](0x0, Number(_0x165805?.['clientWidth']) || Number(_0x10be8e?.['width']) || 0x0),
    _0x1499bb = Math['max'](0x0, Number(_0x165805?.['clientHeight']) || Number(_0x10be8e?.['height']) || 0x0);
  if (_0x41b087 > 0x0 && _0x1499bb > 0x0) {
    const _0xfa8624 = _0x436e20 / _0x1f8543,
      _0x2305fb = _0x41b087 / _0x1499bb,
      _0x196c7d = _0x2305fb > _0xfa8624 ? _0x1499bb * _0xfa8624 : _0x41b087,
      _0x52adaf = _0x2305fb > _0xfa8624 ? _0x1499bb : _0x41b087 / _0xfa8624;
    (_0x1990f7['style']['setProperty']('width', _0x196c7d + 'px'),
      _0x1990f7['style']['setProperty']('height', _0x52adaf + 'px'));
  }
  return !![];
}
function resolveSelectedShot(_0x12f4f9 = {}) {
  const _0x347b54 = Array['isArray'](_0x12f4f9?.['shots']) ? _0x12f4f9['shots'] : [],
    _0x3b33ed = normalizeText(_0x12f4f9?.['workspace']?.['selectedShotId']);
  return (
    _0x347b54['find']((_0x1d9c8e) => normalizeText(_0x1d9c8e?.['id']) === _0x3b33ed) || _0x347b54[0x0] || null
  );
}
function buildIdentityPresentation({
  project: project = {},
  shot: shot = {},
  boxedPeople: boxedPeople = [],
  duplicateRoleLabels: duplicateRoleLabels = [],
  mappedPersonIds: mappedPersonIds = [],
} = {}) {
  const _0x3333f4 = new Set(duplicateRoleLabels),
    _0x4250bc = new Set(mappedPersonIds),
    _0x9fedb = normalizeText(shot?.['id']);
  return boxedPeople['map']((_0x313e29, _0x193705) => {
    const _0x4512ce = resolvePersonReplacementDetectionLabel(_0x313e29, _0x193705, project, _0x9fedb),
      _0x307e0 = resolvePersonReplacementTargetCharacterId(project, _0x313e29),
      _0x5136f8 = _0x4250bc['has'](normalizeText(_0x313e29?.['id'])),
      _0x3c6eb9 = _0x3333f4['has'](_0x4512ce);
    return {
      person: _0x313e29,
      personId: normalizeText(_0x313e29?.['id']),
      sourceCharacterId: normalizeText(_0x313e29?.['sourceCharacterId']),
      targetCharacterId: _0x307e0,
      label: _0x4512ce,
      mapped: _0x5136f8,
      duplicateRole: _0x3c6eb9,
      eligible: _0x5136f8 && !_0x3c6eb9,
    };
  });
}
function hasProjectDerivedArtifacts(_0x43f932 = {}) {
  const _0x4f7324 = _0x43f932?.['output'] || {};
  return Boolean(
    normalizeText(_0x43f932?.['audio']?.['originalAudioRef']) ||
    normalizeText(_0x4f7324['originalMasterRef']) ||
    normalizeText(_0x4f7324['visualMasterRef']) ||
    normalizeText(_0x4f7324['finalVideoRef']) ||
    normalizeText(_0x4f7324['finalAudioTrack']) ||
    normalizeText(_0x4f7324['composeStatus'])['toLowerCase']() === 'succeeded' ||
    (Array['isArray'](_0x4f7324['composedShotIds']) &&
      _0x4f7324['composedShotIds']['some']((_0xd5e4b9) => normalizeText(_0xd5e4b9))),
  );
}
function buildResultPresentation(_0x4b58ca = {}, _0x364eeb = null) {
  const _0x543052 = getPersonReplacementImageResults(_0x364eeb),
    _0xc4f110 = getPersonReplacementActiveImageResultIndex(_0x364eeb, _0x543052),
    _0x2ad05f = _0x543052[_0xc4f110] || null,
    _0x20de01 =
      resolvePersonReplacementImageResultRef(_0x2ad05f) || normalizeText(_0x364eeb?.['replacementImageRef']),
    _0x4b864c = Boolean(
      getPersonReplacementVideoResults(_0x364eeb)['length'] ||
      normalizeText(_0x364eeb?.['resultVideoRef']) ||
      (normalizeText(_0x364eeb?.['generationStatus']) &&
        normalizeText(_0x364eeb?.['generationStatus'])['toLowerCase']() !== 'pending') ||
      normalizeText(_0x364eeb?.['error']),
    ),
    _0x49bdb0 = hasProjectDerivedArtifacts(_0x4b58ca);
  return {
    results: _0x543052,
    active: _0x2ad05f,
    activeIndex: _0xc4f110,
    activeRef: _0x20de01,
    activePrompt: normalizeText(_0x364eeb?.['imagePrompt']),
    resultPrompt: Object['prototype']['hasOwnProperty']['call'](_0x2ad05f || {}, 'userPrompt')
      ? normalizeText(_0x2ad05f?.['userPrompt'])
      : '',
    hasHistory: _0x543052['length'] > 0x1,
    downstream: {
      shotHasDerivedArtifacts: _0x4b864c,
      projectHasDerivedArtifacts: _0x49bdb0,
      invalidationRequired: _0x4b864c || _0x49bdb0,
    },
  };
}
export function buildPersonReplacementImagePresentation(_0x53ca02 = {}, _0x568af3 = []) {
  const _0xbcc7ee = resolveSelectedShot(_0x53ca02),
    _0x48677a = normalizeText(_0xbcc7ee?.['id']),
    _0x4697d3 = _0xbcc7ee
      ? buildPersonReplacementPromptPackage({ project: _0x53ca02, shot: _0xbcc7ee })
      : null,
    _0x6e875c = _0xbcc7ee ? getPersonReplacementBoxedPeople(_0xbcc7ee) : [],
    _0x1fce66 = buildPersonReplacementImageGate({
      project: _0x53ca02,
      shot: _0xbcc7ee || {},
      promptPackage: _0x4697d3,
    }),
    _0x3e2772 = _0x1fce66['duplicateRoleLabels'],
    _0x4c875a = resolvePersonReplacementImageGenerationState(_0x53ca02?.['workspace'], _0x48677a),
    _0x148393 = new Set(
      (Array['isArray'](_0x568af3) ? _0x568af3 : [])['map'](normalizeText)['filter'](Boolean),
    ),
    _0x157463 = Boolean(
      _0x48677a &&
      ((_0x4c875a['status'] === 'running' && normalizeText(_0x4c875a['shotId']) === _0x48677a) ||
        _0x148393['has'](_0x48677a)),
    );
  return {
    selectedShot: _0xbcc7ee,
    selectedShotId: _0x48677a,
    sourceImageRef: resolvePersonReplacementImageSourceRef(_0xbcc7ee),
    promptPackage: _0x4697d3,
    boxedPeople: _0x6e875c,
    identities: buildIdentityPresentation({
      project: _0x53ca02,
      shot: _0xbcc7ee,
      boxedPeople: _0x6e875c,
      duplicateRoleLabels: _0x3e2772,
      mappedPersonIds: _0x1fce66['mappedPersonIds'],
    }),
    gate: _0x1fce66,
    generation: { state: _0x4c875a, loading: _0x157463 },
    result: buildResultPresentation(_0x53ca02, _0xbcc7ee),
  };
}
function escapeHtml(_0x54f205) {
  return String(_0x54f205 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeMediaUrl(_0x3dd2ed) {
  const _0x55e68c = normalizeText(_0x3dd2ed);
  return _0x55e68c ? localPathToUrl(_0x55e68c) || _0x55e68c : '';
}
function renderPromptEnhancementControl(
  _0x52a4b5 = {},
  { disabled: disabled = ![], pendingShotIds: pendingShotIds = [], model: model = {} } = {},
) {
  const _0x2381e5 = isPersonReplacementManualPromptMode(_0x52a4b5);
  disabled = disabled || _0x2381e5;
  const _0x464edc = !_0x2381e5 && _0x52a4b5['settings']?.['replacementPromptEnhancementEnabled'] === !![],
    _0xd322ab = normalizeText(model['displayName'] || model['modelId']) || '未配置',
    _0x4ffe2b =
      model['supportsImage'] === ![]
        ? '当前画布 Agent 模型“' +
          _0xd322ab +
          '”不支持图片理解。开启增强前，请在画布 Agent 面板切换为支持视觉理解的模型。按钮高亮表示已开启，再次点击关闭。'
        : '开启后，会识别选框中的原人物特征，并按既定绑定直接生成替换指令；同一原图和选框复用识别结果。首次识别会增加等待时间。当前模型：' +
          _0xd322ab +
          '，可在画布 Agent 面板更换。按钮高亮表示已开启，再次点击关闭。';
  return (
    '<div\x20class=\x22person-replacement-prompt-controls\x22>' +
    renderPersonReplacementPromptModeControl(_0x52a4b5, { pendingShotIds: pendingShotIds }) +
    '<button type="button" class="story-secondary-button person-replacement-toggle-button person-replacement-prompt-enhancement-toggle" data-person-replacement-action="toggle-prompt-enhancement" aria-pressed="' +
    _0x464edc +
    '\x22\x20data-auto-tooltip=\x22' +
    escapeHtml(_0x4ffe2b) +
    '" data-tooltip="' +
    escapeHtml(_0x2381e5 ? PERSON_REPLACEMENT_MANUAL_ENHANCEMENT_TOOLTIP : _0x4ffe2b) +
    '\x22\x20' +
    (disabled ? 'disabled' : '') +
    '>AI 提示词增强</button></div>'
  );
}
function renderImageReplacementGenerateButton(
  _0x1941ce,
  {
    presentation: presentation = {},
    shotBatchGenerationActive: shotBatchGenerationActive = ![],
    shotBatchCancelRequested: shotBatchCancelRequested = ![],
  } = {},
) {
  const _0x312b44 = presentation['selectedShot'] || null,
    _0x1f6eef = _0x1941ce['workspace']['shotSelectionMode'] === !![],
    _0x4375ba = Array['isArray'](_0x1941ce['workspace']['selectedShotIds'])
      ? _0x1941ce['workspace']['selectedShotIds']['length']
      : 0x0,
    _0x5dcbad = new Set(
      Array['isArray'](_0x1941ce['workspace']['selectedShotIds'])
        ? _0x1941ce['workspace']['selectedShotIds']['map'](normalizeText)['filter'](Boolean)
        : [],
    ),
    _0x239f08 = _0x1941ce['shots']['some']((_0x30c0d2) => {
      if (!_0x5dcbad['has'](normalizeText(_0x30c0d2['id']))) return ![];
      const _0x43d38f = buildPersonReplacementImagePresentation({
        ..._0x1941ce,
        workspace: { ..._0x1941ce['workspace'], selectedShotId: normalizeText(_0x30c0d2['id']) },
      });
      return !_0x43d38f['gate']['sceneOnly'] && _0x43d38f['gate']['duplicateRoleLabels']['length'] > 0x0;
    }),
    _0x12f5d4 = Boolean(presentation['generation']?.['loading']),
    _0x26ef3d = _0x4375ba ? '\x20(' + _0x4375ba + ')' : '',
    _0x150b74 = _0x1f6eef
      ? shotBatchGenerationActive
        ? shotBatchCancelRequested
          ? '正在停止' + _0x26ef3d
          : '取消运行' + _0x26ef3d
        : '' + (_0x4375ba > 0x1 ? '批量生成替换图' : '生成替换图') + _0x26ef3d
      : _0x12f5d4
        ? '生成中'
        : '生成替换图',
    _0x5eadf0 = _0x1f6eef
      ? !_0x4375ba || _0x239f08 || shotBatchCancelRequested
      : !_0x312b44 || !presentation['gate']?.['eligible'] || _0x12f5d4;
  return (
    '<button type="button" class="story-asset-generate-button" aria-busy="' +
    shotBatchGenerationActive +
    '" data-person-replacement-action="generate-replacement-image" ' +
    (_0x5eadf0 ? 'disabled' : '') +
    '>' +
    _0x150b74 +
    '</button>'
  );
}
function renderImageReplacementPage(
  _0x4240a4,
  _0x5e6df6 = {},
  {
    buildIdentityView: _0x3c5ca1,
    renderShotTimeline: _0x1c7da6,
    renderLayoutSplitter: _0x57b57d,
    renderFooter: _0x5872f3,
    renderSmartDetectTrigger: _0x17bac4,
  },
) {
  const _0x37c41d = buildPersonReplacementImagePresentation(
      _0x4240a4,
      _0x5e6df6['shotBatchGeneratingShotIds'],
    ),
    _0x56dbc3 = _0x37c41d['selectedShot'],
    _0x5efe6c = _0x37c41d['sourceImageRef'],
    _0x327547 = _0x5e6df6['cutEditorOpen'] === !![],
    _0x50d013 = _0x5e6df6['omitShotTimeline'] === !![],
    _0x37e8de = _0x5e6df6['cutEditorSoundEnabled'] === !![],
    _0x2c665c = _0x327547
      ? Array['isArray'](_0x5e6df6['cutEditorDraft'])
        ? _0x5e6df6['cutEditorDraft']['find'](
            (_0x519b7a) => _0x519b7a['shotId'] === normalizeText(_0x5e6df6['cutEditorPreviewShotId']),
          )
        : null
      : null,
    _0x1ded4c = _0x327547
      ? _0x4240a4['shots']['find'](
          (_0x533e2b) => _0x533e2b['id'] === normalizeText(_0x5e6df6['cutEditorPreviewShotId']),
        ) ||
        _0x4240a4['shots']['find'](
          (_0x1ab6a0) => _0x1ab6a0['id'] === normalizeText(_0x2c665c?.['originShotId']),
        ) ||
        _0x56dbc3
      : _0x56dbc3,
    _0x810e8f = _0x327547
      ? _0x4240a4['sources']['find']((_0x216981) => _0x216981['id'] === _0x1ded4c?.['sourceId'])
      : null,
    _0xf743e = resolvePersonReplacementSourcePlaybackRef({
      runtimePreviewRef: _0x4240a4['sourcePreviewRefs']?.[_0x1ded4c?.['sourceId']],
      source: _0x810e8f,
      sourceShot: _0x1ded4c,
    }),
    _0x322d08 = normalizeMediaUrl(_0xf743e),
    _0xaf6e4f = /^aic-local-preview:/iu['test'](_0x322d08) ? 'crossorigin=\x22anonymous\x22\x20' : '',
    _0x58e206 = Boolean(
      _0x327547 && _0x322d08 && normalizeText(_0x5e6df6['cutEditorBufferedMediaRef']) === _0x322d08,
    ),
    _0x381676 = normalizeMediaUrl(_0x1ded4c?.['keyframeRef'] || _0x56dbc3?.['keyframeRef']),
    _0x224e76 = _0x37c41d['generation']['state'],
    _0xf5284b = _0x37c41d['generation']['loading'],
    _0xdc151d = Boolean(
      !isPersonReplacementManualPromptMode(_0x4240a4) &&
      _0xf5284b &&
      _0x4240a4['settings']?.['replacementPromptEnhancementEnabled'] === !![] &&
      !_0x224e76['promptEnhancement'],
    ),
    _0x4d955d =
      normalizeText(
        _0x5e6df6['promptEnhancementModel']?.['displayName'] ||
          _0x5e6df6['promptEnhancementModel']?.['modelId'],
      ) || '画布 Agent 当前模型',
    _0x9f0162 = _0xdc151d
      ? {
          title: 'AI\x20提示词增强中',
          description:
            _0x56dbc3?.['replacementPromptMode'] === 'positioning'
              ? '正在使用' + _0x4d955d + '识别选框中的原人物特征，完成后将自动开始生成替换图。'
              : '正在使用' + _0x4d955d + '分析原图与参考图，完成后将自动开始生成替换图。',
        }
      : !isPersonReplacementManualPromptMode(_0x4240a4) && _0x224e76['promptEnhancement']
        ? { title: '图片生成中', description: '增强提示词已准备完成，正在等待生成结果。' }
        : { title: '图片生成中', description: '正在等待生成结果，完成后会自动显示。' },
    _0x2f4e28 = _0x37c41d['result']['results'],
    _0x54526a = _0x37c41d['result']['activeIndex'],
    _0x3ce486 = _0x37c41d['result']['hasHistory'],
    _0x5b7bfa = _0x3ce486
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-replacement-image-result',
          label: '切换到上一个替换图结果',
          className: 'person-replacement-image-result-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-replacement-image-result',
          label: '切换到下一个替换图结果',
          className: 'person-replacement-image-result-arrow',
        })
      : '',
    _0x14dce9 = _0x327547 ? _0x1ded4c?.['frame'] : _0x56dbc3?.['frame'],
    _0x3aeed4 = Math['max'](0x1, Number(_0x14dce9?.['width']) || 0x10),
    _0x163030 = Math['max'](0x1, Number(_0x14dce9?.['height']) || 0x9),
    _0x5e45bc =
      '--frame-aspect:' +
      _0x3aeed4 +
      ' / ' +
      _0x163030 +
      ';--frame-width:' +
      _0x3aeed4 +
      ';--frame-height:' +
      _0x163030,
    _0x3efa64 = _0x37c41d['boxedPeople'],
    _0x5da6bd = new Set(_0x37c41d['gate']['duplicateRoleLabels']),
    _0x1342b6 = _0x3c5ca1(_0x4240a4, _0x37c41d, { people: _0x3efa64, duplicateRoleLabels: _0x5da6bd }),
    _0x2eafe6 =
      (_0x5da6bd['size']
        ? '<p class="person-replacement-limit-warning person-replacement-role-conflict-warning">同一镜头内角色不能重复：' +
          escapeHtml([..._0x5da6bd]['join']('、')) +
          '。请修改红色框中的角色名。</p>'
        : '') +
      (_0x37c41d['gate']['blockers']['some']((_0x475d43) =>
        ['image-limit', 'reference-review']['includes'](_0x475d43),
      )
        ? '<p class="person-replacement-limit-warning" role="alert"' +
          (_0x37c41d['gate']['blockers']['includes']('reference-review')
            ? '\x20data-person-replacement-reference-review-warning'
            : '') +
          '>' +
          escapeHtml(_0x37c41d['gate']['message']) +
          '</p>'
        : ''),
    _0xb1b084 =
      _0x56dbc3?.['analysisStatus'] === 'failed'
        ? '人物检测失败'
        : _0x56dbc3?.['people']?.['length']
          ? '检测结果缺少人物框'
          : '当前帧未检测到人物（可替换主体）',
    _0x34406d =
      _0x56dbc3?.['analysisStatus'] === 'failed'
        ? _0x56dbc3['error'] || '错误详情未保留，请用原视频新建项目重试后生成诊断包。'
        : '怪物、兽人等人形角色可能被人体模型漏检，可直接框选主体。',
    _0x55e2fb =
      '<div class="person-replacement-detection-empty"><strong>' +
      _0xb1b084 +
      '</strong><span>' +
      escapeHtml(_0x34406d) +
      '</span></div>',
    _0x1768c4 = _0x3efa64['length'] > 0x0,
    _0x1760c3 = _0x1768c4
      ? '<button\x20type=\x22button\x22\x20class=\x22person-replacement-secondary-button\x20person-replacement-clear-people-button\x22\x20data-person-replacement-action=\x22clear-shot-people\x22\x20data-shot-id=\x22' +
        escapeHtml(_0x56dbc3?.['id'] || '') +
        '\x22\x20aria-label=\x22清空全部人物框\x22>清空</button>'
      : '<button type="button" class="person-replacement-secondary-button person-replacement-clear-people-button" aria-hidden="true" tabindex="-1" disabled>清空</button>',
    _0x3fc4a0 =
      'person-replacement-keyframe-display person-replacement-middle-preview-slide' +
      (_0x327547 ? ' is-cut-editor-open' : ''),
    _0xf58c26 = !_0x327547 && !_0x1768c4,
    _0x3c5bf4 = _0x327547
      ? _0x17bac4({
          smartDetectOpen: _0x5e6df6['cutEditorSmartDetectOpen'] === !![],
          smartDetecting: _0x5e6df6['cutEditorSmartDetecting'] === !![],
          disabled: Boolean(_0x5e6df6['cutEditorSubmitting'] || _0x5e6df6['cutEditorSmartDetecting']),
        })
      : _0x1760c3,
    _0x1cb437 =
      '<div class="person-replacement-keyframe-tools' +
      (_0xf58c26 ? ' is-layout-placeholder' : '') +
      '\x22' +
      (_0xf58c26 ? '\x20aria-hidden=\x22true\x22\x20inert' : '') +
      '>' +
      _0x3c5bf4 +
      '</div>',
    _0x453f4a = _0x4240a4['shots']['length'] > 0x1,
    _0x5da1d0 = _0x453f4a
      ? '' +
        renderPersonReplacementPreviewArrow('previous', {
          action: 'previous-shot',
          label: '上一个片段',
          className: 'person-replacement-shot-navigation-arrow',
        }) +
        renderPersonReplacementPreviewArrow('next', {
          action: 'next-shot',
          label: '下一个片段',
          className: 'person-replacement-shot-navigation-arrow',
        })
      : '',
    _0x55f593 = _0x453f4a ? ' aria-label="滚动鼠标滚轮或按左右方向键切换片段"' : '',
    _0x559dfb =
      _0x327547 && _0xf743e
        ? '<div class="' +
          _0x3fc4a0 +
          '\x22>' +
          _0x1cb437 +
          '<div\x20class=\x22person-replacement-keyframe-stage-shell\x22><div\x20class=\x22person-replacement-shot-clip-stage\x22\x20data-person-replacement-shot-cut-preview-stage\x20data-person-replacement-video-playback-stage=\x22cut-editor\x22\x20data-shot-id=\x22' +
          escapeHtml(_0x1ded4c?.['id'] || '') +
          '" style="' +
          _0x5e45bc +
          '\x22><video\x20aria-label=\x22镜头切口预览\x22\x20' +
          _0xaf6e4f +
          'preload=\x22' +
          (_0x58e206 ? 'none' : 'auto') +
          '" playsinline ' +
          (_0x37e8de ? '' : 'muted ') +
          (_0x58e206 ? '' : 'src="' + escapeHtml(_0x322d08) + '\x22\x20') +
          (_0x381676 ? 'poster="' + escapeHtml(_0x381676) + '\x22' : '') +
          ' data-person-replacement-shot-cut-video data-source-id="' +
          escapeHtml(_0x1ded4c?.['sourceId'] || '') +
          '"></video></div></div></div>'
        : _0x5efe6c
          ? '<div class="' +
            _0x3fc4a0 +
            '\x22' +
            (_0x453f4a ? ' data-person-replacement-shot-wheel="true"' : '') +
            '>' +
            _0x1cb437 +
            '<div class="person-replacement-keyframe-stage-shell"><div class="person-replacement-keyframe-stage" data-person-replacement-keyframe-stage data-story-marquee-surface="people" data-shot-id="' +
            escapeHtml(_0x56dbc3?.['id'] || '') +
            '" tabindex="0" aria-keyshortcuts="Control D Delete" style="' +
            _0x5e45bc +
            '\x22' +
            _0x55f593 +
            '><img src="' +
            escapeHtml(normalizeMediaUrl(_0x5efe6c)) +
            '" alt="' +
            (_0x56dbc3?.['imageIterationReferenceRef'] ? '图像1参考图' : '视频首帧') +
            '" width="' +
            _0x3aeed4 +
            '" height="' +
            _0x163030 +
            '\x22>' +
            (_0x3efa64['length'] ? _0x1342b6['detectionBoxesHtml'] : _0x55e2fb) +
            '</div></div>' +
            _0x5da1d0 +
            '</div>'
          : '<div\x20class=\x22person-replacement-inline-empty\x22>视频仍在抽帧或没有可用首帧</div>',
    _0x3c6789 = normalizePersonReplacementLayout(_0x4240a4['workspace']['replacementLayout']),
    _0x8bbcbe =
      '--person-replacement-left-width:' +
      _0x3c6789['left'] +
      '%;--person-replacement-right-width:' +
      _0x3c6789['right'] +
      '%;--person-replacement-center-top:' +
      _0x3c6789['centerTop'] +
      '%;',
    _0x48057d = renderPromptEnhancementControl(_0x4240a4, {
      pendingShotIds: _0x5e6df6['shotBatchGeneratingShotIds'],
      disabled: Boolean(_0xf5284b || _0x5e6df6['shotBatchGenerationActive']),
      model: _0x5e6df6['promptEnhancementModel'],
    });
  return (
    '<div\x20class=\x22person-replacement-production-page\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-four-panel-layout\x22\x20data-person-replacement-layout\x20style=\x22' +
    _0x8bbcbe +
    '">\n       ' +
    _0x1342b6['targetAssetRailHtml'] +
    '\n       ' +
    _0x57b57d('left', _0x3c6789) +
    '\n       <section class="person-replacement-keyframe-panel person-replacement-middle-layout">' +
    _0x559dfb +
    _0x57b57d('center', _0x3c6789) +
    (_0x50d013 ? '' : _0x1c7da6(_0x4240a4, { ..._0x5e6df6, allowCutEditing: !![] })) +
    '</section>\n      ' +
    _0x57b57d('right', _0x3c6789) +
    '\n      <aside class="person-replacement-generation-panel person-replacement-image-generation-panel">\n        <div class="person-replacement-generation-preview ' +
    (_0xf5284b ? 'img-preview-loading' : '') +
    '\x22\x20aria-busy=\x22' +
    _0xf5284b +
    '\x22' +
    (_0x3ce486
      ? ' data-person-replacement-image-result-wheel="true" aria-label="滚动鼠标滚轮切换生成结果"'
      : '') +
    '>\n          <div class="person-replacement-image-preview-slide">\n            ' +
    (_0x37c41d['result']['activeRef']
      ? '<img src="' +
        escapeHtml(normalizeMediaUrl(_0x37c41d['result']['activeRef'])) +
        '" alt="替换结果 ' +
        (_0x54526a + 0x1) +
        '" width="' +
        _0x3aeed4 +
        '" height="' +
        _0x163030 +
        '\x22>'
      : '<span>生成结果显示在这里</span>') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    (_0xf5284b ? renderWorkspaceAssetLoadingOverlay(_0x9f0162) : '') +
    '\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-asset-preview-actions\x20person-replacement-result-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
    renderWorkspaceImageDownloadButton({
      action: 'download-replacement-image',
      enabled: Boolean(_0x37c41d['result']['activeRef']),
      className: 'person-replacement-result-download',
    }) +
    '\n            <button type="button" class="story-upload-replace story-character-voice-upload-button person-replacement-result-upload" data-story-action="upload-replacement-image" aria-label="上传替换图片" ' +
    (!_0x56dbc3 || _0xf5284b ? 'disabled' : '') +
    '>' +
    renderWorkspaceUploadIcon() +
    '</button>\n          </div>\n          ' +
    _0x5b7bfa +
    '\n          ' +
    (_0x2f4e28['length']
      ? '<div\x20class=\x22person-replacement-image-result-meta\x22\x20aria-label=\x22生成结果\x20' +
        (_0x54526a + 0x1) +
        '/' +
        _0x2f4e28['length'] +
        '"><span>' +
        (_0x54526a + 0x1) +
        '/' +
        _0x2f4e28['length'] +
        '</span></div>'
      : '') +
    '\n        </div>\n        ' +
    _0x57b57d('center', _0x3c6789, { label: '调整结果预览与提示词区域高度' }) +
    '\n        <div class="story-asset-detail-copy person-replacement-generation-copy"><div class="story-asset-prompt-field person-replacement-prompt-field"><div class="person-replacement-prompt-field-heading">' +
    _0x1342b6['promptReferenceInputsHtml'] +
    _0x48057d +
    '</div><div\x20class=\x22prompt-input-wrapper\x20is-resizable\x20person-replacement-prompt-input-wrapper\x22><div\x20class=\x22prompt-textarea\x20custom-textarea\x20story-asset-prompt-editor\x20person-replacement-prompt-editor\x22\x20contenteditable=\x22true\x22\x20role=\x22textbox\x22\x20aria-label=\x22图像替换提示词\x22\x20data-placeholder=\x22描述替换效果，输入\x20@\x20引用左侧素材图\x22\x20data-person-replacement-field=\x22image-prompt\x22\x20data-shot-id=\x22' +
    escapeHtml(_0x56dbc3?.['id'] || '') +
    '\x22>' +
    renderPersonReplacementPromptHtml(_0x37c41d['result']['activePrompt']) +
    '</div></div></div>' +
    (_0x37c41d['gate']['overflowPersonIds']['length']
      ? '<p class="person-replacement-limit-warning">单次最多 8 个目标人物</p>'
      : '') +
    (_0x37c41d['gate']['unresolvedOrientationPersonIds']['length']
      ? '<p class="person-replacement-limit-warning person-replacement-orientation-warning">还有 ' +
        _0x37c41d['gate']['unresolvedOrientationPersonIds']['length'] +
        ' 个人物未确认朝向，确认后才能生成。</p>'
      : '') +
    _0x2eafe6 +
    '<div class="story-asset-generation-bar prompt-panel-footer">' +
    renderAIGenImageModelSelectorMarkup({
      modelId: _0x4240a4['settings']['replacementImageModelId'] || PERSON_REPLACEMENT_DEFAULT_IMAGE_MODEL_ID,
      provider: _0x4240a4['settings']['replacementImageProvider'],
      generationParams: _0x4240a4['settings']['replacementImageGenerationParams'] || {},
      providerProfileId: _0x4240a4['settings']['replacementImageProviderProfileId'],
      providerProfileIdByModel: _0x4240a4['settings']['replacementImageProviderProfileIdByModel'],
      showSchemaControls: !![],
      runningHubWorkflowModelIds: [QWEN_IMAGE_21_EDIT_MODEL_ID],
      className: 'story-asset-image-model-selector person-replacement-image-model-selector',
    }) +
    renderRequestDebugButton('data-story-action="debug-generation-image"') +
    renderImageReplacementGenerateButton(_0x4240a4, { presentation: _0x37c41d, ..._0x5e6df6 }) +
    '</div>' +
    (_0x224e76['error']
      ? '<p class="person-replacement-error">' + escapeHtml(_0x224e76['error']) + '</p>'
      : '') +
    '</div>\n      </aside>\n   </div>' +
    _0x5872f3(_0x4240a4, { nextLabel: '进入视频替换' }) +
    '\n  </div>'
  );
}
function cloneFrozenPresentationValue(_0x51c806) {
  if (Array['isArray'](_0x51c806)) return Object['freeze'](_0x51c806['map'](cloneFrozenPresentationValue));
  if (!_0x51c806 || typeof _0x51c806 !== 'object') return _0x51c806;
  return Object['freeze'](
    Object['fromEntries'](
      Object['entries'](_0x51c806)['map'](([_0xeb4b59, _0x925043]) => [
        _0xeb4b59,
        cloneFrozenPresentationValue(_0x925043),
      ]),
    ),
  );
}
function buildReadonlyImagePresentation(_0x136d6b, _0x3a459a) {
  const _0x36281d = buildPersonReplacementImagePresentation(_0x136d6b, _0x3a459a);
  return Object['freeze']({
    selectedShot: _0x36281d['selectedShot'] ? cloneFrozenPresentationValue(_0x36281d['selectedShot']) : null,
    selectedShotId: _0x36281d['selectedShotId'],
    sourceImageRef: _0x36281d['sourceImageRef'],
    promptPackage: _0x36281d['promptPackage']
      ? cloneFrozenPresentationValue(_0x36281d['promptPackage'])
      : null,
    boxedPeople: cloneFrozenPresentationValue(_0x36281d['boxedPeople']),
    identities: cloneFrozenPresentationValue(_0x36281d['identities']),
    gate: cloneFrozenPresentationValue(_0x36281d['gate']),
    generation: cloneFrozenPresentationValue(_0x36281d['generation']),
    result: cloneFrozenPresentationValue(_0x36281d['result']),
  });
}
export function syncPersonReplacementImageGenerationLoading(_0x55b199, _0x360f76) {
  const _0x476962 = _0x55b199?.['querySelector']?.('.person-replacement-generation-preview');
  if (!_0x476962) return;
  const _0x790704 = Boolean(_0x360f76?.['generation']?.['loading']);
  (_0x476962['classList']['toggle']('img-preview-loading', _0x790704),
    _0x476962['setAttribute']('aria-busy', String(_0x790704)));
  const _0x128e68 = _0x476962['querySelector']('.story-asset-loading-overlay');
  if (!_0x790704) _0x128e68?.['remove']();
  else {
    if (!_0x128e68) {
      const _0x144344 = _0x476962['ownerDocument']['createElement']('template');
      ((_0x144344['innerHTML'] = renderWorkspaceAssetLoadingOverlay()),
        _0x476962['append'](_0x144344['content']['firstElementChild']));
    }
  }
}
export function syncPersonReplacementImagePromptGate(_0x23abd9, _0x4a9edb, _0xc6a37a = {}) {
  const _0x57e29c = _0x23abd9?.['querySelector']?.(
      '[data-person-replacement-action=\x22generate-replacement-image\x22]',
    ),
    _0x14445e = _0x23abd9?.['ownerDocument'];
  if (!_0x57e29c || !_0x14445e?.['createElement']) return;
  const _0x2bfa49 = buildReadonlyImagePresentation(_0x4a9edb, _0xc6a37a['shotBatchGeneratingShotIds']),
    _0x50e768 = _0x14445e['createElement']('template');
  ((_0x50e768['innerHTML'] = renderImageReplacementGenerateButton(_0x4a9edb, {
    ..._0xc6a37a,
    presentation: _0x2bfa49,
  })),
    (_0x57e29c['disabled'] = _0x50e768['content']['firstElementChild']['disabled']));
  let _0xcfc35c = _0x23abd9['querySelector']('[data-person-replacement-reference-review-warning]');
  if (!_0x2bfa49['gate']['blockers']['includes']('reference-review')) {
    _0xcfc35c?.['remove']();
    return;
  }
  (!_0xcfc35c &&
    ((_0xcfc35c = _0x14445e['createElement']('p')),
    (_0xcfc35c['className'] = 'person-replacement-limit-warning'),
    _0xcfc35c['setAttribute']('role', 'alert'),
    _0xcfc35c['setAttribute']('data-person-replacement-reference-review-warning', ''),
    _0x57e29c['closest']('.prompt-panel-footer')?.['before'](_0xcfc35c)),
    (_0xcfc35c['textContent'] = _0x2bfa49['gate']['message']));
}
export function createPersonReplacementImagePresentation({
  buildIdentityView: buildIdentityView = () => ({
    detectionBoxesHtml: '',
    promptReferenceInputsHtml: '',
    targetAssetRailHtml: '',
  }),
  renderShotTimeline: renderShotTimeline = () => '',
  renderLayoutSplitter: renderLayoutSplitter = () => '',
  renderFooter: renderFooter = () => '',
  renderSmartDetectTrigger: renderSmartDetectTrigger = () => '',
} = {}) {
  const _0x227fe1 = Object['freeze']({
    buildIdentityView: buildIdentityView,
    renderShotTimeline: renderShotTimeline,
    renderLayoutSplitter: renderLayoutSplitter,
    renderFooter: renderFooter,
    renderSmartDetectTrigger: renderSmartDetectTrigger,
  });
  return Object['freeze']({
    build: buildReadonlyImagePresentation,
    render: (_0x2a38e1, _0x1e1712 = {}) => renderImageReplacementPage(_0x2a38e1, _0x1e1712, _0x227fe1),
    renderGenerateButton: renderImageReplacementGenerateButton,
  });
}
