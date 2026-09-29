import { renderRequestDebugButton } from '../debugRequestWindow.js';
function escapeHtml(_0x4d7d23) {
  return String(_0x4d7d23 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x3c4ca7) {
  return String(_0x3c4ca7 ?? '')['trim']();
}
const STORY_CONTRACT_FIELD_LABELS = Object['freeze']({
  protagonistGoal: '主角目标',
  centralConflict: '核心冲突',
  stakes: '失败代价',
  progressionDriver: '推进动力',
  constraints: '约束条件',
  climax: '高潮事件',
  ending: '明确结局',
});
function renderWorkflowLoading(_0x1035cf) {
  return (
    '<div class="story-script-workflow-loading" role="status" aria-live="polite">\n    <span class="storyboard-script-loading-spinner" aria-hidden="true"></span>\n    <span>' +
    escapeHtml(_0x1035cf) +
    '</span>\n  </div>'
  );
}
function renderOutlineField(_0x447ca2, _0x5561f0, _0x203211, { singleLine: singleLine = ![] } = {}) {
  const _0x47d97b = singleLine
    ? '<input\x20type=\x22text\x22\x20value=\x22' +
      escapeHtml(_0x5561f0 || '') +
      '" data-story-outline-field="' +
      escapeHtml(_0x203211) +
      '\x22>'
    : '<textarea data-story-outline-field="' +
      escapeHtml(_0x203211) +
      '\x22>' +
      escapeHtml(_0x5561f0 || '') +
      '</textarea>';
  return (
    '<label\x20class=\x22story-outline-field\x22><span>' +
    escapeHtml(_0x447ca2) +
    '</span>' +
    _0x47d97b +
    '</label>'
  );
}
function renderSummaryCharacterField(
  _0x299ca2,
  _0x66ca0d,
  _0x2cf98e,
  _0x2f2f7f,
  { multiline: multiline = !![], value: value = _0x299ca2?.[_0x2cf98e] || '' } = {},
) {
  const _0x209d50 =
      'data-story-summary-character-index="' +
      _0x66ca0d +
      '" data-story-summary-character-field="' +
      escapeHtml(_0x2cf98e) +
      '" aria-label="' +
      escapeHtml(_0x2f2f7f) +
      '\x22',
    _0x10dfab = multiline
      ? '<textarea ' + _0x209d50 + '>' + escapeHtml(value) + '</textarea>'
      : '<input type="text" value="' + escapeHtml(value) + '\x22\x20' + _0x209d50 + '>';
  return '<label><b>' + escapeHtml(_0x2f2f7f) + '：</b>' + _0x10dfab + '</label>';
}
function renderSummaryCharacters(_0x2b1e16 = []) {
  if (!_0x2b1e16['length']) return '';
  return (
    '<div class="story-summary-characters">\n    <span class="story-summary-label">人物小传</span>\n    ' +
    _0x2b1e16['map'](
      (_0x5f3704, _0xe22efd) =>
        '<article\x20class=\x22story-summary-character\x22>\x0a\x20\x20\x20\x20\x20\x20<input\x20class=\x22story-summary-character-name\x22\x20type=\x22text\x22\x20value=\x22' +
        escapeHtml(_0x5f3704['name'] || '') +
        '" placeholder="未命名角色" data-story-summary-character-index="' +
        _0xe22efd +
        '" data-story-summary-character-field="name" aria-label="角色姓名">\n      <div class="story-summary-character-fields">\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'roleType', '角色类型', {
          multiline: ![],
          value: _0x5f3704['roleType'] || '其他角色',
        }) +
        '\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'fixedTraits', '剧情固定特征', {
          value: _0x5f3704['fixedTraits'] || _0x5f3704['visualAppearance'] || '',
        }) +
        '\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'coreTags', '核心标签', {
          multiline: ![],
          value: Array['isArray'](_0x5f3704['coreTags']) ? _0x5f3704['coreTags']['join']('、') : '',
        }) +
        '\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'profile', '身份背景') +
        '\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'motivation', '核心动机') +
        '\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'personality', '性格特点') +
        '\n        ' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'relationships', '角色关系') +
        '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
        renderSummaryCharacterField(_0x5f3704, _0xe22efd, 'arc', '成长弧线') +
        '\n      </div>\n    </article>',
    )['join']('') +
    '\x0a\x20\x20</div>'
  );
}
function renderStoryContract(_0x26b0e9 = {}) {
  return (
    '<div class="story-summary-characters">\n    <span class="story-summary-label">故事契约</span>\n    <article class="story-summary-character">\n      <div class="story-summary-character-fields">\n        ' +
    Object['entries'](STORY_CONTRACT_FIELD_LABELS)
      ['map'](
        ([_0x3d60fe, _0x5a3de6]) =>
          '<label><b>' +
          escapeHtml(_0x5a3de6) +
          '：</b><textarea data-story-contract-field="' +
          escapeHtml(_0x3d60fe) +
          '\x22>' +
          escapeHtml(_0x26b0e9?.[_0x3d60fe] || '') +
          '</textarea></label>',
      )
      ['join']('') +
    '\n      </div>\n    </article>\n  </div>'
  );
}
function renderPlotBeats(_0x29f6f5 = []) {
  if (!Array['isArray'](_0x29f6f5) || !_0x29f6f5['length']) return '';
  return (
    '<div class="story-summary-characters">\n    <span class="story-summary-label">因果剧情节点</span>\n    ' +
    _0x29f6f5['map'](
      (_0x215a2f, _0x42b71c) =>
        '<article class="story-summary-character">\n      <input class="story-summary-character-name" type="text" value="' +
        escapeHtml(_0x215a2f?.['stage'] || '') +
        '\x22\x20data-story-plot-beat-index=\x22' +
        _0x42b71c +
        '" data-story-plot-beat-field="stage" aria-label="剧情阶段">\n      <div class="story-summary-character-fields">\n        <label><b>关键事件：</b><textarea data-story-plot-beat-index="' +
        _0x42b71c +
        '" data-story-plot-beat-field="event">' +
        escapeHtml(_0x215a2f?.['event'] || '') +
        '</textarea></label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<label><b>造成结果：</b><textarea\x20data-story-plot-beat-index=\x22' +
        _0x42b71c +
        '" data-story-plot-beat-field="consequence">' +
        escapeHtml(_0x215a2f?.['consequence'] || '') +
        '</textarea></label>\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</article>',
    )['join']('') +
    '\n  </div>'
  );
}
function renderContinuityFacts(_0x5f3905 = []) {
  return (
    '<label\x20class=\x22story-outline-field\x22>\x0a\x20\x20\x20\x20<span>连续性事实</span>\x0a\x20\x20\x20\x20<textarea\x20data-story-continuity-facts\x20placeholder=\x22每行一条，例如关系阶段、承诺、秘密、身份、线索、能力或物品归属\x22>' +
    escapeHtml((Array['isArray'](_0x5f3905) ? _0x5f3905 : [])['join']('\x0a')) +
    '</textarea>\x0a\x20\x20</label>'
  );
}
function renderSummary(_0x19f691 = {}) {
  if (_0x19f691['status'] === 'generating')
    return renderWorkflowLoading(_0x19f691['loadingMessage'] || '正在根据原始创意生成剧本摘要...');
  if (!normalizeText(_0x19f691['synopsis']))
    return '<div class="story-inline-empty">剧本摘要尚未生成。</div>';
  return (
    '<div class="story-summary-content">\n    ' +
    (_0x19f691['isStale']
      ? '<div class="story-inline-empty">故事蓝图已修改，现有分集大纲和正文仍然保留；点击“重新运行”后更新下游内容。</div>'
      : '') +
    '\n    <div class="story-summary-meta-grid">\n      <label><span>分集目标</span><strong>' +
    Math['max'](0x1, Math['trunc'](Number(_0x19f691['episodeCount']) || 0x1)) +
    ' 集</strong></label>\n      <label><span>故事类型</span><input type="text" value="' +
    escapeHtml(_0x19f691['storyType'] || '') +
    '" data-story-outline-field="story-type"></label>\n      <label><span>目标受众</span><input type="text" value="' +
    escapeHtml(_0x19f691['targetAudience'] || '') +
    '" data-story-outline-field="story-target-audience"></label>\n    </div>\n    ' +
    renderOutlineField('一句话故事', _0x19f691['logline'], 'story-logline') +
    '\n    ' +
    renderOutlineField('核心梗', _0x19f691['coreHook'], 'story-core-hook', { singleLine: !![] }) +
    '\n    ' +
    renderOutlineField('故事梗概', _0x19f691['synopsis'], 'story-summary') +
    '\n    <div class="story-summary-secondary-fields">\n      ' +
    renderOutlineField('故事背景', _0x19f691['background'], 'story-background') +
    '\n      ' +
    renderOutlineField('故事设定', _0x19f691['setting'], 'story-setting') +
    '\n    </div>\n    ' +
    renderStoryContract(_0x19f691['contract']) +
    '\n    ' +
    renderPlotBeats(_0x19f691['plotBeats']) +
    '\n    ' +
    renderContinuityFacts(_0x19f691['continuityFacts']) +
    '\n    ' +
    renderSummaryCharacters(_0x19f691['characters']) +
    '\n  </div>'
  );
}
function renderInlineRegenerationControl({
  target: target = '',
  prompt: prompt = '',
  confirmLabel: confirmLabel = '',
  episodeId: episodeId = '',
  placement: placement = 'heading',
  isConfirming: isConfirming = ![],
  disabled: disabled = ![],
} = {}) {
  const _0x3750d2 = normalizeText(target);
  if (!_0x3750d2) return '';
  const _0x668ef0 = escapeHtml(_0x3750d2),
    _0x47468b = normalizeText(episodeId)
      ? '\x20data-story-episode-id=\x22' + escapeHtml(episodeId) + '\x22'
      : '';
  if (!isConfirming)
    return (
      '<span class="story-inline-regeneration-control is-' +
      escapeHtml(placement) +
      '">\n      <button type="button" class="story-inline-regeneration-button story-regenerate-button" data-story-action="request-inline-regeneration" data-story-regeneration-target="' +
      _0x668ef0 +
      '\x22' +
      _0x47468b +
      ' aria-label="' +
      escapeHtml(confirmLabel) +
      '\x22\x20' +
      (disabled ? 'disabled' : '') +
      '>' +
      escapeHtml(confirmLabel) +
      '</button>\n    </span>'
    );
  return (
    '<span class="story-inline-regeneration-control is-' +
    escapeHtml(placement) +
    ' is-confirming" data-story-regeneration-confirm="' +
    _0x668ef0 +
    '" role="group" aria-label="' +
    escapeHtml(prompt) +
    '">\n    <span class="story-inline-regeneration-prompt">' +
    escapeHtml(prompt) +
    '</span>\n    <button type="button" class="story-inline-regeneration-button story-regenerate-button is-confirm" data-story-action="confirm-inline-regeneration" data-story-regeneration-target="' +
    _0x668ef0 +
    '\x22' +
    _0x47468b +
    ' aria-label="' +
    escapeHtml(confirmLabel) +
    '\x22\x20' +
    (disabled ? 'disabled' : '') +
    '>确认</button>\n    <button type="button" class="story-inline-regeneration-button story-regenerate-button is-cancel" data-story-action="cancel-inline-regeneration" aria-label="取消重新生成">取消</button>\n  </span>'
  );
}
function renderEpisodeScriptBody(_0x29683d = {}, _0x3c2656 = 0x1) {
  if (!_0x29683d['scriptFullText']) return '';
  return (
    '<label class="story-episode-full-script">\n    <span>完整分场剧本</span>\n    <textarea data-story-episode-script="' +
    escapeHtml(_0x29683d['id']) +
    '\x22>' +
    escapeHtml(_0x29683d['scriptFullText']) +
    '</textarea>\n  </label>\n  ' +
    (_0x29683d['allowRegeneration']
      ? '<div\x20class=\x22story-episode-completed-actions\x22>\x0a\x20\x20\x20\x20' +
        renderInlineRegenerationControl({
          target: 'episode-script:' + _0x29683d['id'],
          prompt:
            '是否重新生成第 ' +
            _0x3c2656 +
            ' 集正文？本集及后续正文将更新，共享素材与已有视频保留，受影响分镜需重新生成',
          confirmLabel: '重新生成第 ' + _0x3c2656 + '\x20集正文',
          episodeId: _0x29683d['id'],
          placement: 'episode',
          ..._0x29683d['regeneration'],
        }) +
        '\x0a\x20\x20</div>'
      : '')
  );
}
function renderEpisodeItem(_0x8279f5 = {}) {
  const _0x1007ab = Math['max'](0x0, Math['trunc'](Number(_0x8279f5['index']) || 0x0)),
    _0x41acc2 = Math['max'](0x1, Math['trunc'](Number(_0x8279f5['number']) || _0x1007ab + 0x1)),
    _0x213126 = _0x8279f5['isGenerating']
      ? { className: 'is-generating', label: '正在生成' }
      : _0x8279f5['isComplete']
        ? { className: 'is-complete', label: '已生成' }
        : null,
    _0x2b2d11 = _0x8279f5['canSelect']
      ? ' data-story-select-script-episode="' + escapeHtml(_0x8279f5['id']) + '\x22'
      : '';
  return (
    '<details class="story-episode-outline-item ' +
    (_0x8279f5['isComplete'] ? 'is-complete' : 'is-pending') +
    (_0x8279f5['isSelected'] ? ' is-checked' : '') +
    '\x22\x20data-story-outline-section=\x22episode-' +
    escapeHtml(_0x8279f5['id']) +
    '\x22\x20' +
    (_0x8279f5['isOpen'] ? 'open' : '') +
    '>\n    <summary' +
    _0x2b2d11 +
    '>\x0a\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-episode-outline-number\x22>' +
    (_0x1007ab + 0x1) +
    '.</span>\n      <strong>第 ' +
    _0x41acc2 +
    '\x20集' +
    (_0x8279f5['isComplete'] && _0x8279f5['title'] ? ' · ' + escapeHtml(_0x8279f5['title']) : '') +
    '</strong>\n      ' +
    (_0x213126
      ? '<span\x20class=\x22story-episode-script-status\x20' +
        _0x213126['className'] +
        '\x22>' +
        _0x213126['label'] +
        '</span>'
      : '') +
    '\n    </summary>\n    <div class="story-episode-outline-body">\n      ' +
    (_0x8279f5['isGenerating']
      ? renderWorkflowLoading(_0x8279f5['generationMessage'] || '正在生成第 ' + _0x41acc2 + '\x20集完整剧本')
      : _0x8279f5['isComplete']
        ? renderEpisodeScriptBody(_0x8279f5, _0x41acc2)
        : '<label class="story-episode-synopsis-field">\n              <span>分集简介</span>\n              <textarea data-story-episode-synopsis="' +
          escapeHtml(_0x8279f5['id']) +
          '\x22>' +
          escapeHtml(_0x8279f5['synopsis'] || '') +
          '</textarea>\n            </label>\n            ' +
          (_0x8279f5['hook']
            ? '<label\x20class=\x22story-episode-synopsis-field\x20story-episode-hook-field\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>结尾钩子</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<textarea\x20rows=\x221\x22\x20data-story-episode-hook=\x22' +
              escapeHtml(_0x8279f5['id']) +
              '\x22>' +
              escapeHtml(_0x8279f5['hook']) +
              '</textarea>\n            </label>'
            : '') +
          '\n            ' +
          (_0x8279f5['canGenerate']
            ? '<div class="story-episode-script-action">\n              <button type="button" class="story-secondary-button" data-story-action="generate-episode-script" data-story-episode-id="' +
              escapeHtml(_0x8279f5['id']) +
              '\x22\x20' +
              (_0x8279f5['disabled'] ? 'disabled' : '') +
              '>生成此集</button>\n            </div>'
            : '')) +
    '\n    </div>\n  </details>'
  );
}
function renderEpisodeSection(_0x15e56a = {}) {
  if (_0x15e56a['isOutlineGenerating'])
    return renderWorkflowLoading(_0x15e56a['loadingMessage'] || '正在生成所有分集大纲...');
  const _0x46ccb1 = Array['isArray'](_0x15e56a['episodes']) ? _0x15e56a['episodes'] : [];
  if (!_0x46ccb1['length']) return '';
  const _0x41a693 = _0x15e56a['isUploadedOriginal']
    ? '已按原剧本结构导入，正文未扩写'
    : _0x15e56a['isStale']
      ? '故事蓝图已修改；当前内容保留为旧版本，请先重新运行分集规划'
      : _0x15e56a['complete']
        ? '完整分集剧本已全部完成'
        : '分集大纲已完成，请按顺序生成正文';
  return (
    '<section\x20class=\x22story-script-episodes-section\x22>\x0a\x20\x20\x20\x20<header\x20class=\x22story-script-episodes-heading\x22>\x0a\x20\x20\x20\x20\x20\x20<div><h2>共\x20' +
    _0x46ccb1['length'] +
    ' 集</h2><p>' +
    _0x41a693 +
    '</p></div>\n      ' +
    (_0x15e56a['complete'] || _0x15e56a['isStale']
      ? ''
      : '<div class="story-script-selection-actions">\n            <button type="button" class="story-secondary-button" data-story-action="select-all-script-episodes"' +
        (_0x15e56a['batchGenerating'] ? ' disabled' : '') +
        '>' +
        (_0x46ccb1['filter']((_0x419c64) => _0x419c64['canSelect'])['every'](
          (_0x43b0b6) => _0x43b0b6['isSelected'],
        )
          ? '取消全选'
          : '全选') +
        '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (_0x15e56a['batchGenerating']
          ? '<button type="button" class="story-primary-button" data-story-action="cancel-episode-scripts-batch" aria-label="取消尚未开始的分集" ' +
            (_0x15e56a['batchCancelRequested'] ? 'disabled' : '') +
            '>' +
            (_0x15e56a['batchCancelRequested'] ? '已取消排队' : '取消') +
            '</button>'
          : '<button type="button" class="story-primary-button" data-story-action="generate-episode-scripts-batch" data-story-script-batch-scope="' +
            (_0x15e56a['selectionMode'] ? 'selected' : 'all') +
            '\x22\x20' +
            (_0x15e56a['busy'] || !_0x15e56a['batchCount'] ? 'disabled' : '') +
            '>批量生成' +
            (_0x15e56a['batchCount'] ? '\x20(' + _0x15e56a['batchCount'] + ')' : '') +
            '</button>') +
        '\n          </div>') +
    '\n    </header>\n    <div class="story-episode-outline-list">\n      ' +
    _0x46ccb1['map'](renderEpisodeItem)['join']('') +
    '\n    </div>\n  </section>'
  );
}
function renderOutlineNavigation(_0x3d45ed = {}) {
  const _0x63c928 = Array['isArray'](_0x3d45ed['episodeSection']?.['episodes'])
      ? _0x3d45ed['episodeSection']['episodes']
      : [],
    _0x5564e8 = _0x63c928['length'] || _0x3d45ed['episodeSection']?.['isOutlineGenerating'];
  return (
    '<aside class="story-outline-nav-shell" data-story-outline-nav aria-label="剧本目录">\n    <button type="button" class="story-outline-nav-trigger" data-story-outline-nav-toggle aria-expanded="false">目录</button>\n    <nav class="story-outline-nav-panel" aria-label="剧本内容导航">\n      <strong>剧本目录</strong>\n      ' +
    (_0x3d45ed['isUploadedOriginal']
      ? ''
      : '<button\x20type=\x22button\x22\x20class=\x22story-outline-nav-section\x22\x20data-story-outline-nav-target=\x22summary\x22>剧本摘要</button>') +
    '\n      ' +
    (_0x5564e8
      ? '<div class="story-outline-nav-group">\n        <button type="button" class="story-outline-nav-section" data-story-outline-nav-target="episodes">分集剧本</button>\n        ' +
        (_0x63c928['length']
          ? '<div class="story-outline-nav-episodes">\n          ' +
            _0x63c928['map']((_0x4543e4) => {
              const _0xfbab35 =
                _0x4543e4['isComplete'] && _0x4543e4['title']
                  ? '第\x20' + _0x4543e4['number'] + '\x20集\x20·\x20' + _0x4543e4['title']
                  : '第\x20' + _0x4543e4['number'] + '\x20集';
              return (
                '<button type="button" data-story-outline-nav-target="episode-' +
                escapeHtml(_0x4543e4['id']) +
                '"><span>' +
                _0x4543e4['number'] +
                '.</span><span>' +
                escapeHtml(_0xfbab35) +
                '</span></button>'
              );
            })['join']('') +
            '\n        </div>'
          : '') +
        '\n      </div>'
      : '') +
    '\n    </nav>\n  </aside>'
  );
}
function renderPlanningPage(_0x52ba37 = {}) {
  const _0x224188 = _0x52ba37['episodeSection'] || {},
    _0x45695b = _0x52ba37['isUploadedOriginal']
      ? '原始剧本'
      : _0x52ba37['isUploadedRewrite']
        ? '参考剧本'
        : '原始创意',
    _0x582752 =
      (Array['isArray'](_0x224188['episodes']) && _0x224188['episodes']['length'] > 0x0) ||
      _0x224188['isOutlineGenerating'];
  return (
    '<div class="story-outline-page story-content-page story-script-workflow-page">\n    ' +
    renderOutlineNavigation(_0x52ba37) +
    '\n    <div class="story-script-workflow-card">\n      <details class="story-script-accordion" data-story-outline-section="original" ' +
    (_0x52ba37['originalOpen'] ? 'open' : '') +
    '>\n        <summary><span class="story-script-accordion-summary-row"><span class="story-script-accordion-title">' +
    _0x45695b +
    '</span></span></summary>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-original-creative\x22>' +
    escapeHtml(_0x52ba37['originalCreative'] || '未记录原始创意') +
    '</div>\n        ' +
    (_0x52ba37['isUploadedRewrite']
      ? '<div class="story-rewrite-instruction"><strong>改写要求</strong><p>' +
        escapeHtml(_0x52ba37['rewriteInstruction'] || '未记录改写要求') +
        '</p></div>'
      : '') +
    '\n      </details>\n      ' +
    (_0x52ba37['isUploadedOriginal']
      ? ''
      : '<details class="story-script-accordion" data-story-outline-section="summary" ' +
        (_0x52ba37['summaryOpen'] ? 'open' : '') +
        '>\n        <summary><span class="story-script-accordion-summary-row">\n          <span class="story-script-accordion-title">剧本摘要</span>\n          ' +
        renderRequestDebugButton('data-story-action="debug-story-summary"') +
        '\n          ' +
        (normalizeText(_0x52ba37['summary']?.['synopsis']) &&
        _0x52ba37['summary']?.['status'] !== 'generating'
          ? renderInlineRegenerationControl({
              target: 'summary',
              prompt: '是否重新生成剧本摘要？分集大纲、分集正文和素材将全部清空',
              confirmLabel: '重新生成剧本摘要',
              ..._0x52ba37['summaryRegeneration'],
            })
          : '') +
        '\n        </span></summary>\n        ' +
        renderSummary(_0x52ba37['summary']) +
        '\n      </details>') +
    '\x0a\x20\x20\x20\x20\x20\x20' +
    (_0x582752
      ? '<details class="story-script-accordion" data-story-outline-section="episodes" ' +
        (_0x52ba37['episodesOpen'] ? 'open' : '') +
        '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<summary><span\x20class=\x22story-script-accordion-summary-row\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22story-script-accordion-title\x22>分集剧本</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20' +
        (!_0x52ba37['isUploadedOriginal'] &&
        _0x224188['episodes']?.['length'] &&
        ['completed', 'stale']['includes'](_0x52ba37['outlineStatus'])
          ? renderInlineRegenerationControl({
              target: 'episode-outlines',
              prompt:
                _0x52ba37['outlineStatus'] === 'stale'
                  ? '是否按修改后的故事蓝图重新运行？分集正文和素材将全部清空'
                  : '是否重新生成分集大纲？分集正文和素材将全部清空',
              confirmLabel: _0x52ba37['outlineStatus'] === 'stale' ? '重新运行' : '重新生成分集大纲',
              ..._0x52ba37['outlineRegeneration'],
            })
          : '') +
        '\x0a\x20\x20\x20\x20\x20\x20\x20\x20</span></summary>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
        renderEpisodeSection(_0x224188) +
        '\n      </details>'
      : '') +
    '\n    </div>\n    ' +
    (_0x52ba37['footerMarkup'] || '') +
    '\n  </div>'
  );
}
function renderPlanning(_0x6426c6 = {}) {
  if (_0x6426c6['kind'] === 'episode-item') return renderEpisodeItem(_0x6426c6['item']);
  if (_0x6426c6['kind'] === 'episode-section') return renderEpisodeSection(_0x6426c6['section']);
  return renderPlanningPage(_0x6426c6['page']);
}
function renderAssetBreakdown(_0x5bd8da = {}) {
  const _0x26fa6c = Array['isArray'](_0x5bd8da['episodes']) ? _0x5bd8da['episodes'] : [];
  return (
    '<div class="story-asset-breakdown-page story-content-page" data-story-asset-breakdown>\n    <header class="story-asset-breakdown-heading">\n      <h1>剧本素材拆解</h1>\n    </header>\n    <section class="story-asset-breakdown-card" aria-busy="true">\n      <div class="story-asset-breakdown-list">\n        ' +
    _0x26fa6c['map'](
      (_0x55381a, _0x22f80a) =>
        '<article class="story-asset-breakdown-episode" data-story-asset-breakdown-episode="' +
        escapeHtml(_0x55381a['id']) +
        '">\n          <h2 class="story-asset-breakdown-episode-heading">\n            <span>第 ' +
        _0x55381a['number'] +
        ' 集</span>\n            ' +
        (_0x22f80a === 0x0
          ? '<span class="story-asset-breakdown-inline-status" data-story-asset-breakdown-inline-status role="status" aria-live="polite">\n              <span class="storyboard-script-loading-spinner" aria-hidden="true"></span>\n              <span>剧情解析中</span>\n            </span>'
          : '') +
        '\n          </h2>\n          <p>' +
        escapeHtml(_0x55381a['synopsis'] || '本集剧情大纲待补充。') +
        '</p>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</article>',
    )['join']('') +
    '\n      </div>\n      <div class="story-asset-breakdown-status" data-story-asset-breakdown-status role="status" aria-live="polite">\n        <span class="storyboard-script-loading-spinner" aria-hidden="true"></span>\n        <span>剧情解析中</span>\n      </div>\n    </section>\n  </div>'
  );
}
export function createStoryScriptPlanningPresentation() {
  return Object['freeze']({ renderAssetBreakdown: renderAssetBreakdown, renderPlanning: renderPlanning });
}
