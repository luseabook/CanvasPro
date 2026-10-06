import { renderRequestDebugButton } from '../debugRequestWindow.js';
function escapeHtml(item) {
  return String(item ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;');
}
function normalizeText(key) {
  return String(key ?? '').trim();
}
const STORY_CONTRACT_FIELD_LABELS = Object.freeze({
  protagonistGoal: '主角目标',
  centralConflict: '核心冲突',
  stakes: '失败代价',
  progressionDriver: '推进动力',
  constraints: '约束条件',
  climax: '高潮事件',
  ending: '明确结局',
});
function renderWorkflowLoading(index) {
  return (
    '<div class="story-script-workflow-loading" role="status" aria-live="polite">\n    <span class="storyboard-script-loading-spinner" aria-hidden="true"></span>\n    <span>' +
    escapeHtml(index) +
    '</span>\n  </div>'
  );
}
function renderOutlineField(result, data, options, { singleLine: singleLine = false } = {}) {
  const source = singleLine
    ? '<input type="text" value="' +
      escapeHtml(data || '') +
      '" data-story-outline-field="' +
      escapeHtml(options) +
      '">'
    : '<textarea data-story-outline-field="' +
      escapeHtml(options) +
      '">' +
      escapeHtml(data || '') +
      '</textarea>';
  return (
    '<label class="story-outline-field"><span>' +
    escapeHtml(result) +
    '</span>' +
    source +
    '</label>'
  );
}
function renderSummaryCharacterField(
  next,
  current,
  entry,
  record,
  { multiline: multiline = true, value: value = next?.[entry] || '' } = {},
) {
  const payload =
      'data-story-summary-character-index="' +
      current +
      '" data-story-summary-character-field="' +
      escapeHtml(entry) +
      '" aria-label="' +
      escapeHtml(record) +
      '"',
    handle = multiline
      ? '<textarea ' + payload + '>' + escapeHtml(value) + '</textarea>'
      : '<input type="text" value="' + escapeHtml(value) + '" ' + payload + '>';
  return '<label><b>' + escapeHtml(record) + '：</b>' + handle + '</label>';
}
function renderSummaryCharacters(list = []) {
  if (!list.length) return '';
  return (
    '<div class="story-summary-characters">\n    <span class="story-summary-label">人物小传</span>\n    ' +
    list.map(
      (value2, state) =>
        '<article class="story-summary-character">\n      <input class="story-summary-character-name" type="text" value="' +
        escapeHtml(value2.name || '') +
        '" placeholder="未命名角色" data-story-summary-character-index="' +
        state +
        '" data-story-summary-character-field="name" aria-label="角色姓名">\n      <div class="story-summary-character-fields">\n        ' +
        renderSummaryCharacterField(value2, state, 'roleType', '角色类型', {
          multiline: false,
          value: value2.roleType || '其他角色',
        }) +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'fixedTraits', '剧情固定特征', {
          value: value2.fixedTraits || value2.visualAppearance || '',
        }) +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'coreTags', '核心标签', {
          multiline: false,
          value: Array.isArray(value2.coreTags) ? value2.coreTags.join('、') : '',
        }) +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'profile', '身份背景') +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'motivation', '核心动机') +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'personality', '性格特点') +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'relationships', '角色关系') +
        '\n        ' +
        renderSummaryCharacterField(value2, state, 'arc', '成长弧线') +
        '\n      </div>\n    </article>',
    ).join('') +
    '\n  </div>'
  );
}
function renderStoryContract(options2 = {}) {
  return (
    '<div class="story-summary-characters">\n    <span class="story-summary-label">故事契约</span>\n    <article class="story-summary-character">\n      <div class="story-summary-character-fields">\n        ' +
    Object.entries(STORY_CONTRACT_FIELD_LABELS)
      .map(
        ([config, scope]) =>
          '<label><b>' +
          escapeHtml(scope) +
          '：</b><textarea data-story-contract-field="' +
          escapeHtml(config) +
          '">' +
          escapeHtml(options2?.[config] || '') +
          '</textarea></label>',
      )
      .join('') +
    '\n      </div>\n    </article>\n  </div>'
  );
}
function renderPlotBeats(list2 = []) {
  if (!Array.isArray(list2) || !list2.length) return '';
  return (
    '<div class="story-summary-characters">\n    <span class="story-summary-label">因果剧情节点</span>\n    ' +
    list2.map(
      (input, output) =>
        '<article class="story-summary-character">\n      <input class="story-summary-character-name" type="text" value="' +
        escapeHtml(input?.stage || '') +
        '" data-story-plot-beat-index="' +
        output +
        '" data-story-plot-beat-field="stage" aria-label="剧情阶段">\n      <div class="story-summary-character-fields">\n        <label><b>关键事件：</b><textarea data-story-plot-beat-index="' +
        output +
        '" data-story-plot-beat-field="event">' +
        escapeHtml(input?.event || '') +
        '</textarea></label>\n        <label><b>造成结果：</b><textarea data-story-plot-beat-index="' +
        output +
        '" data-story-plot-beat-field="consequence">' +
        escapeHtml(input?.consequence || '') +
        '</textarea></label>\n      </div>\n    </article>',
    ).join('') +
    '\n  </div>'
  );
}
function renderContinuityFacts(list3 = []) {
  return (
    '<label class="story-outline-field">\n    <span>连续性事实</span>\n    <textarea data-story-continuity-facts placeholder="每行一条，例如关系阶段、承诺、秘密、身份、线索、能力或物品归属">' +
    escapeHtml((Array.isArray(list3) ? list3 : []).join('\n')) +
    '</textarea>\n  </label>'
  );
}
function renderSummary(response = {}) {
  if (response.status === 'generating')
    return renderWorkflowLoading(response.loadingMessage || '正在根据原始创意生成剧本摘要...');
  if (!normalizeText(response.synopsis)) return '<div class="story-inline-empty">剧本摘要尚未生成。</div>';
  return (
    '<div class="story-summary-content">\n    ' +
    (response.isStale
      ? '<div class="story-inline-empty">故事蓝图已修改，现有分集大纲和正文仍然保留；点击“重新运行”后更新下游内容。</div>'
      : '') +
    '\n    <div class="story-summary-meta-grid">\n      <label><span>分集目标</span><strong>' +
    Math.max(1, Math.trunc(Number(response.episodeCount) || 1)) +
    ' 集</strong></label>\n      <label><span>故事类型</span><input type="text" value="' +
    escapeHtml(response.storyType || '') +
    '" data-story-outline-field="story-type"></label>\n      <label><span>目标受众</span><input type="text" value="' +
    escapeHtml(response.targetAudience || '') +
    '" data-story-outline-field="story-target-audience"></label>\n    </div>\n    ' +
    renderOutlineField('一句话故事', response.logline, 'story-logline') +
    '\n    ' +
    renderOutlineField('核心梗', response.coreHook, 'story-core-hook', { singleLine: true }) +
    '\n    ' +
    renderOutlineField('故事梗概', response.synopsis, 'story-summary') +
    '\n    <div class="story-summary-secondary-fields">\n      ' +
    renderOutlineField('故事背景', response.background, 'story-background') +
    '\n      ' +
    renderOutlineField('故事设定', response.setting, 'story-setting') +
    '\n    </div>\n    ' +
    renderStoryContract(response.contract) +
    '\n    ' +
    renderPlotBeats(response.plotBeats) +
    '\n    ' +
    renderContinuityFacts(response.continuityFacts) +
    '\n    ' +
    renderSummaryCharacters(response.characters) +
    '\n  </div>'
  );
}
function renderInlineRegenerationControl({
  target: target = '',
  prompt: prompt = '',
  confirmLabel: confirmLabel = '',
  episodeId: episodeId = '',
  placement: placement = 'heading',
  isConfirming: isConfirming = false,
  disabled: disabled = false,
} = {}) {
  const text = normalizeText(target);
  if (!text) return '';
  const escapeHtml2 = escapeHtml(text),
    text2 = normalizeText(episodeId) ? ' data-story-episode-id="' + escapeHtml(episodeId) + '"' : '';
  if (!isConfirming)
    return (
      '<span class="story-inline-regeneration-control is-' +
      escapeHtml(placement) +
      '">\n      <button type="button" class="story-inline-regeneration-button story-regenerate-button" data-story-action="request-inline-regeneration" data-story-regeneration-target="' +
      escapeHtml2 +
      '"' +
      text2 +
      ' aria-label="' +
      escapeHtml(confirmLabel) +
      '" ' +
      (disabled ? 'disabled' : '') +
      '>' +
      escapeHtml(confirmLabel) +
      '</button>\n    </span>'
    );
  return (
    '<span class="story-inline-regeneration-control is-' +
    escapeHtml(placement) +
    ' is-confirming" data-story-regeneration-confirm="' +
    escapeHtml2 +
    '" role="group" aria-label="' +
    escapeHtml(prompt) +
    '">\n    <span class="story-inline-regeneration-prompt">' +
    escapeHtml(prompt) +
    '</span>\n    <button type="button" class="story-inline-regeneration-button story-regenerate-button is-confirm" data-story-action="confirm-inline-regeneration" data-story-regeneration-target="' +
    escapeHtml2 +
    '"' +
    text2 +
    ' aria-label="' +
    escapeHtml(confirmLabel) +
    '" ' +
    (disabled ? 'disabled' : '') +
    '>确认</button>\n    <button type="button" class="story-inline-regeneration-button story-regenerate-button is-cancel" data-story-action="cancel-inline-regeneration" aria-label="取消重新生成">取消</button>\n  </span>'
  );
}
function renderEpisodeScriptBody(episodeId2 = {}, value3 = 1) {
  if (!episodeId2.scriptFullText) return '';
  return (
    '<label class="story-episode-full-script">\n    <span>完整分场剧本</span>\n    <textarea data-story-episode-script="' +
    escapeHtml(episodeId2.id) +
    '">' +
    escapeHtml(episodeId2.scriptFullText) +
    '</textarea>\n  </label>\n  ' +
    (episodeId2.allowRegeneration
      ? '<div class="story-episode-completed-actions">\n    ' +
        renderInlineRegenerationControl({
          target: 'episode-script:' + episodeId2.id,
          prompt:
            '是否重新生成第 ' +
            value3 +
            ' 集正文？本集及后续正文将更新，共享素材与已有视频保留，受影响分镜需重新生成',
          confirmLabel: '重新生成第 ' + value3 + ' 集正文',
          episodeId: episodeId2.id,
          placement: 'episode',
          ...episodeId2.regeneration,
        }) +
        '\n  </div>'
      : '')
  );
}
function renderEpisodeItem(el = {}) {
  const value4 = Math.max(0, Math.trunc(Number(el.index) || 0)),
    value5 = Math.max(1, Math.trunc(Number(el.number) || value4 + 1)),
    value6 = el.isGenerating
      ? { className: 'is-generating', label: '正在生成' }
      : el.isComplete
        ? { className: 'is-complete', label: '已生成' }
        : null,
    value7 = el.canSelect ? ' data-story-select-script-episode="' + escapeHtml(el.id) + '"' : '';
  return (
    '<details class="story-episode-outline-item ' +
    (el.isComplete ? 'is-complete' : 'is-pending') +
    (el.isSelected ? ' is-checked' : '') +
    '" data-story-outline-section="episode-' +
    escapeHtml(el.id) +
    '" ' +
    (el.isOpen ? 'open' : '') +
    '>\n    <summary' +
    value7 +
    '>\n      <span class="story-episode-outline-number">' +
    (value4 + 1) +
    '.</span>\n      <strong>第 ' +
    value5 +
    ' 集' +
    (el.isComplete && el.title ? ' · ' + escapeHtml(el.title) : '') +
    '</strong>\n      ' +
    (value6
      ? '<span class="story-episode-script-status ' +
        value6.className +
        '">' +
        value6.label +
        '</span>'
      : '') +
    '\n    </summary>\n    <div class="story-episode-outline-body">\n      ' +
    (el.isGenerating
      ? renderWorkflowLoading(el.generationMessage || '正在生成第 ' + value5 + ' 集完整剧本')
      : el.isComplete
        ? renderEpisodeScriptBody(el, value5)
        : '<label class="story-episode-synopsis-field">\n              <span>分集简介</span>\n              <textarea data-story-episode-synopsis="' +
          escapeHtml(el.id) +
          '">' +
          escapeHtml(el.synopsis || '') +
          '</textarea>\n            </label>\n            ' +
          (el.hook
            ? '<label class="story-episode-synopsis-field story-episode-hook-field">\n              <span>结尾钩子</span>\n              <textarea rows="1" data-story-episode-hook="' +
              escapeHtml(el.id) +
              '">' +
              escapeHtml(el.hook) +
              '</textarea>\n            </label>'
            : '') +
          '\n            ' +
          (el.canGenerate
            ? '<div class="story-episode-script-action">\n              <button type="button" class="story-secondary-button" data-story-action="generate-episode-script" data-story-episode-id="' +
              escapeHtml(el.id) +
              '" ' +
              (el.disabled ? 'disabled' : '') +
              '>生成此集</button>\n            </div>'
            : '')) +
    '\n    </div>\n  </details>'
  );
}
function renderEpisodeSection(enabled = {}) {
  if (enabled.isOutlineGenerating)
    return renderWorkflowLoading(enabled.loadingMessage || '正在生成所有分集大纲...');
  const list4 = Array.isArray(enabled.episodes) ? enabled.episodes : [];
  if (!list4.length) return '';
  const value8 = enabled.isUploadedOriginal
    ? '已按原剧本结构导入，正文未扩写'
    : enabled.isStale
      ? '故事蓝图已修改；当前内容保留为旧版本，请先重新运行分集规划'
      : enabled.complete
        ? '完整分集剧本已全部完成'
        : '分集大纲已完成，请按顺序生成正文';
  return (
    '<section class="story-script-episodes-section">\n    <header class="story-script-episodes-heading">\n      <div><h2>共 ' +
    list4.length +
    ' 集</h2><p>' +
    value8 +
    '</p></div>\n      ' +
    (enabled.complete || enabled.isStale
      ? ''
      : '<div class="story-script-selection-actions">\n            <button type="button" class="story-secondary-button" data-story-action="select-all-script-episodes"' +
        (enabled.batchGenerating ? ' disabled' : '') +
        '>' +
        (list4.filter((value9) => value9.canSelect).every((value10) => value10.isSelected)
          ? '取消全选'
          : '全选') +
        '</button>\n            ' +
        (enabled.batchGenerating
          ? '<button type="button" class="story-primary-button" data-story-action="cancel-episode-scripts-batch" aria-label="取消尚未开始的分集" ' +
            (enabled.batchCancelRequested ? 'disabled' : '') +
            '>' +
            (enabled.batchCancelRequested ? '已取消排队' : '取消') +
            '</button>'
          : '<button type="button" class="story-primary-button" data-story-action="generate-episode-scripts-batch" data-story-script-batch-scope="' +
            (enabled.selectionMode ? 'selected' : 'all') +
            '" ' +
            (enabled.busy || !enabled.batchCount ? 'disabled' : '') +
            '>批量生成' +
            (enabled.batchCount ? ' (' + enabled.batchCount + ')' : '') +
            '</button>') +
        '\n          </div>') +
    '\n    </header>\n    <div class="story-episode-outline-list">\n      ' +
    list4.map(renderEpisodeItem).join('') +
    '\n    </div>\n  </section>'
  );
}
function renderOutlineNavigation(options3 = {}) {
  const list5 = Array.isArray(options3.episodeSection?.episodes)
      ? options3.episodeSection.episodes
      : [],
    value11 = list5.length || options3.episodeSection?.isOutlineGenerating;
  return (
    '<aside class="story-outline-nav-shell" data-story-outline-nav aria-label="剧本目录">\n    <button type="button" class="story-outline-nav-trigger" data-story-outline-nav-toggle aria-expanded="false">目录</button>\n    <nav class="story-outline-nav-panel" aria-label="剧本内容导航">\n      <strong>剧本目录</strong>\n      ' +
    (options3.isUploadedOriginal
      ? ''
      : '<button type="button" class="story-outline-nav-section" data-story-outline-nav-target="summary">剧本摘要</button>') +
    '\n      ' +
    (value11
      ? '<div class="story-outline-nav-group">\n        <button type="button" class="story-outline-nav-section" data-story-outline-nav-target="episodes">分集剧本</button>\n        ' +
        (list5.length
          ? '<div class="story-outline-nav-episodes">\n          ' +
            list5.map((value12) => {
              const value13 =
                value12.isComplete && value12.title
                  ? '第 ' + value12.number + ' 集 · ' + value12.title
                  : '第 ' + value12.number + ' 集';
              return (
                '<button type="button" data-story-outline-nav-target="episode-' +
                escapeHtml(value12.id) +
                '"><span>' +
                value12.number +
                '.</span><span>' +
                escapeHtml(value13) +
                '</span></button>'
              );
            }).join('') +
            '\n        </div>'
          : '') +
        '\n      </div>'
      : '') +
    '\n    </nav>\n  </aside>'
  );
}
function renderPlanningPage(prompt2 = {}) {
  const value14 = prompt2.episodeSection || {},
    value15 = prompt2.isUploadedOriginal
      ? '原始剧本'
      : prompt2.isUploadedRewrite
        ? '参考剧本'
        : '原始创意',
    value16 =
      (Array.isArray(value14.episodes) && value14.episodes.length > 0) ||
      value14.isOutlineGenerating;
  return (
    '<div class="story-outline-page story-content-page story-script-workflow-page">\n    ' +
    renderOutlineNavigation(prompt2) +
    '\n    <div class="story-script-workflow-card">\n      <details class="story-script-accordion" data-story-outline-section="original" ' +
    (prompt2.originalOpen ? 'open' : '') +
    '>\n        <summary><span class="story-script-accordion-summary-row"><span class="story-script-accordion-title">' +
    value15 +
    '</span></span></summary>\n        <div class="story-original-creative">' +
    escapeHtml(prompt2.originalCreative || '未记录原始创意') +
    '</div>\n        ' +
    (prompt2.isUploadedRewrite
      ? '<div class="story-rewrite-instruction"><strong>改写要求</strong><p>' +
        escapeHtml(prompt2.rewriteInstruction || '未记录改写要求') +
        '</p></div>'
      : '') +
    '\n      </details>\n      ' +
    (prompt2.isUploadedOriginal
      ? ''
      : '<details class="story-script-accordion" data-story-outline-section="summary" ' +
        (prompt2.summaryOpen ? 'open' : '') +
        '>\n        <summary><span class="story-script-accordion-summary-row">\n          <span class="story-script-accordion-title">剧本摘要</span>\n          ' +
        renderRequestDebugButton('data-story-action="debug-story-summary"') +
        '\n          ' +
        (normalizeText(prompt2.summary?.synopsis) && prompt2.summary?.status !== 'generating'
          ? renderInlineRegenerationControl({
              target: 'summary',
              prompt: '是否重新生成剧本摘要？分集大纲、分集正文和素材将全部清空',
              confirmLabel: '重新生成剧本摘要',
              ...prompt2.summaryRegeneration,
            })
          : '') +
        '\n        </span></summary>\n        ' +
        renderSummary(prompt2.summary) +
        '\n      </details>') +
    '\n      ' +
    (value16
      ? '<details class="story-script-accordion" data-story-outline-section="episodes" ' +
        (prompt2.episodesOpen ? 'open' : '') +
        '>\n        <summary><span class="story-script-accordion-summary-row">\n          <span class="story-script-accordion-title">分集剧本</span>\n          ' +
        (!prompt2.isUploadedOriginal &&
        value14.episodes?.length &&
        ['completed', 'stale'].includes(prompt2.outlineStatus)
          ? renderInlineRegenerationControl({
              target: 'episode-outlines',
              prompt:
                prompt2.outlineStatus === 'stale'
                  ? '是否按修改后的故事蓝图重新运行？分集正文和素材将全部清空'
                  : '是否重新生成分集大纲？分集正文和素材将全部清空',
              confirmLabel: prompt2.outlineStatus === 'stale' ? '重新运行' : '重新生成分集大纲',
              ...prompt2.outlineRegeneration,
            })
          : '') +
        '\n        </span></summary>\n        ' +
        renderEpisodeSection(value14) +
        '\n      </details>'
      : '') +
    '\n    </div>\n    ' +
    (prompt2.footerMarkup || '') +
    '\n  </div>'
  );
}
function renderPlanning(options4 = {}) {
  if (options4.kind === 'episode-item') return renderEpisodeItem(options4.item);
  if (options4.kind === 'episode-section') return renderEpisodeSection(options4.section);
  return renderPlanningPage(options4.page);
}
function renderAssetBreakdown(options5 = {}) {
  const list6 = Array.isArray(options5.episodes) ? options5.episodes : [];
  return (
    '<div class="story-asset-breakdown-page story-content-page" data-story-asset-breakdown>\n    <header class="story-asset-breakdown-heading">\n      <h1>剧本素材拆解</h1>\n    </header>\n    <section class="story-asset-breakdown-card" aria-busy="true">\n      <div class="story-asset-breakdown-list">\n        ' +
    list6.map(
      (value17, count) =>
        '<article class="story-asset-breakdown-episode" data-story-asset-breakdown-episode="' +
        escapeHtml(value17.id) +
        '">\n          <h2 class="story-asset-breakdown-episode-heading">\n            <span>第 ' +
        value17.number +
        ' 集</span>\n            ' +
        (count === 0
          ? '<span class="story-asset-breakdown-inline-status" data-story-asset-breakdown-inline-status role="status" aria-live="polite">\n              <span class="storyboard-script-loading-spinner" aria-hidden="true"></span>\n              <span>剧情解析中</span>\n            </span>'
          : '') +
        '\n          </h2>\n          <p>' +
        escapeHtml(value17.synopsis || '本集剧情大纲待补充。') +
        '</p>\n        </article>',
    ).join('') +
    '\n      </div>\n      <div class="story-asset-breakdown-status" data-story-asset-breakdown-status role="status" aria-live="polite">\n        <span class="storyboard-script-loading-spinner" aria-hidden="true"></span>\n        <span>剧情解析中</span>\n      </div>\n    </section>\n  </div>'
  );
}
export function createStoryScriptPlanningPresentation() {
  return Object.freeze({ renderAssetBreakdown: renderAssetBreakdown, renderPlanning: renderPlanning });
}
