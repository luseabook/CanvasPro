import { formatStoryVideoPlaybackTime } from './storyVideoPlayback.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { getVideoReplicationDialogueSummary } from '../../domain/storyGeneration/videoReplicationSourceAnalysis.js';
import { REPLICATION_VOICEOVER_KINDS } from '../../domain/storyGeneration/videoReplicationSpeech.js';
import {
  renderStoryReplicationCharacters,
  renderStoryReplicationCharacterSummary,
} from './storyReplicationCharacterPresentation.js';
import { renderStoryReplicationSegments } from './storyReplicationReviewNavigation.js';
const escape = (value) =>
    String(value ?? '')['replace'](
      /[&<>"']/gu,
      (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[item],
    ),
  time = (key) => formatStoryVideoPlaybackTime(key),
  seek = (index, result, data = false) =>
    '<button type="button" data-replication-seek="' +
    Number(index) +
    '"' +
    (data ? ' data-replication-listen' : '') +
    '>' +
    escape(result || time(index)) +
    '</button>',
  field = (options, target, source, next, current, entry = '') =>
    '<label>' +
    escape(options) +
    '<textarea rows="2" data-replication-edit="' +
    target +
    '" data-id="' +
    escape(source) +
    '" data-field="' +
    next +
    '" data-index="' +
    entry +
    '">' +
    escape(current) +
    '</textarea></label>';
export function renderStoryReplicationEvidenceSummary(record) {
  return (
    renderStoryReplicationCharacterSummary(record) +
    ' · ' +
    getVideoReplicationDialogueSummary(record)['label']
  );
}
export function renderStoryReplicationReviewTab(
  payload,
  handle = 'story',
  state = payload['replication']['sourceAnalysis']['events'][0]?.['id'],
) {
  const config = payload['replication']['sourceAnalysis'],
    list = config['events']['filter']((scope) => scope['id'] === state);
  if (handle === 'overview') return field('全片概述', 'story', '', 'synopsis', config['synopsis']);
  if (handle === 'characters') return renderStoryReplicationCharacters(payload, { field: field, seek: seek });
  if (
    handle === 'dialogue' &&
    !list['some']((input) => input['dialogue']['length'] || input['voiceover']?.['length'])
  )
    return '<p class="story-source-empty-frame">本次分析未返回人声文案（对白、解说或独白）。可先回听原片，再用支持音画理解的模型重新分析。</p>';
  return (
    '' +
    list['map'](
      (output) =>
        '<article class="story-source-event" data-replication-event="' +
        escape(output['id']) +
        '">\n      <header>' +
        seek(output['startSec'], time(output['startSec']) + '–' + time(output['endSec'])) +
        (handle === 'dialogue'
          ? ''
          : '<span>' +
            (output['characterIds']
              ['map']((value2) =>
                escape(config['characters']['find']((value3) => value3['id'] === value2)?.['name'] || value2),
              )
              ['join']('、') || '无人出镜') +
            '</span>') +
        '</header>\n      ' +
        (handle === 'dialogue'
          ? ''
          : field('画面与动作', 'event', output['id'], 'visual', output['visual'])) +
        '\n      ' +
        (handle === 'shots'
          ? '<p>原片镜头：' +
            escape(output['camera']) +
            '</p><p>声音描述：' +
            escape(output['sound']) +
            '</p>'
          : ['dialogue', 'voiceover']
              ['flatMap']((value4) =>
                (output[value4] || [])['map'](
                  (response, value5) =>
                    '<div class="story-source-dialogue">\n        <div class="story-source-dialogue-heading">' +
                    seek(response['startSec'] ?? output['startSec'], '回听', true) +
                    '\n        ' +
                    (value4 === 'voiceover'
                      ? '<select aria-label="人声类型" data-replication-edit="voiceover" data-id="' +
                        escape(output['id']) +
                        '" data-index="' +
                        value5 +
                        '" data-field="kind">' +
                        Object['entries'](REPLICATION_VOICEOVER_KINDS)
                          ['map'](
                            ([value6, value7]) =>
                              '<option value="' +
                              value6 +
                              '"' +
                              (response['kind'] === value6 ? ' selected' : '') +
                              '>' +
                              value7 +
                              '</option>',
                          )
                          ['join']('') +
                        '</select>'
                      : '<span>对白</span>') +
                    '\n        <select aria-label="说话人" data-replication-edit="' +
                    value4 +
                    '" data-id="' +
                    escape(output['id']) +
                    '" data-index="' +
                    value5 +
                    '" data-field="speakerId"><option value="">' +
                    (value4 === 'voiceover' ? '独立解说员／未绑定角色' : '说话人待核对') +
                    '</option>' +
                    config['characters']
                      ['map'](
                        (error) =>
                          '<option value="' +
                          escape(error['id']) +
                          '"' +
                          (error['id'] === response['speakerId'] ? ' selected' : '') +
                          '>' +
                          escape(error['name']) +
                          '</option>',
                      )
                      ['join']('') +
                    '</select>\n        <label class="story-source-check"><input type="checkbox" data-replication-edit="' +
                    value4 +
                    '" data-id="' +
                    escape(output['id']) +
                    '" data-index="' +
                    value5 +
                    '" data-field="uncertain"' +
                    (response['uncertain'] ? ' checked' : '') +
                    '>待核对</label>\n        </div><textarea aria-label="' +
                    (value4 === 'voiceover' ? '原语言解说／独白' : '原语言对白') +
                    '" rows="1" data-replication-edit="' +
                    value4 +
                    '" data-id="' +
                    escape(output['id']) +
                    '" data-index="' +
                    value5 +
                    '" data-field="text">' +
                    escape(response['text']) +
                    '</textarea>\n      </div>',
                ),
              )
              ['join']('')) +
        '\n      ' +
        (handle !== 'dialogue' && output['uncertainties']['length']
          ? '<details class="story-source-doubt"><summary>识别备注</summary><p>' +
            output['uncertainties']['map'](escape)['join']('；') +
            '</p></details>'
          : '') +
        '\n    </article>',
    )['join']('')
  );
}
export function renderStoryReplicationReview(value8) {
  return (
    '<section class="story-source-review" data-replication-review aria-label="原视频分析详情">\n    <header class="story-source-review-heading"><div class="story-source-review-title"><strong>' +
    escape(value8['title']) +
    '</strong><small data-replication-review-summary>' +
    renderStoryReplicationEvidenceSummary(value8['replication']['sourceAnalysis']) +
    '</small></div><div class="story-source-actions"><button type="button" data-replication-reanalyze>重新分析</button><button type="button" data-replication-close>返回视频列表</button></div></header>\n    <div class="story-source-review-layout">\n      <aside class="story-source-segment-sidebar"><header>片段列表 <span data-replication-segment-count>' +
    value8['replication']['sourceAnalysis']['events']['length'] +
    '</span></header><nav class="story-source-segments" data-replication-segments aria-label="原片片段">' +
    renderStoryReplicationSegments(value8['replication']['sourceAnalysis']) +
    '</nav></aside>\n      <div class="panel-resize-handle story-source-splitter" data-review-splitter="left" role="separator" aria-orientation="vertical" aria-label="调整片段列表宽度" tabindex="0"></div>\n      <div class="story-source-player"><div class="story-source-video-stage"><video controls playsinline preload="metadata" aria-label="原视频核对播放器"' +
    (value8['sourceVideo']['posterUrl']
      ? ' poster="' + escape(value8['sourceVideo']['posterUrl']) + '"'
      : '') +
    '></video><div data-replication-seeking hidden role="status">' +
    renderStoryGenerationSpinner({ button: true }) +
    '正在定位原片画面</div></div><p>本段人物</p><div class="story-source-cast" data-replication-cast>' +
    renderStoryReplicationCast(value8, value8['replication']['sourceAnalysis']['events'][0]?.['id']) +
    '</div></div>\n      <div class="panel-resize-handle story-source-splitter" data-review-splitter="right" role="separator" aria-orientation="vertical" aria-label="调整播放器与编辑区宽度" tabindex="0"></div>\n      <div class="story-source-details"><header class="story-source-detail-heading"><strong data-replication-segment-heading></strong><small data-replication-segment-time></small></header><nav class="story-source-tabs" role="tablist" aria-label="分析内容">' +
    [
      ['overview', '全片概述'],
      ['story', '片段内容'],
      ['dialogue', '人声文案'],
      ['characters', '人物'],
      ['shots', '镜头'],
    ]
      ['map'](
        ([value9, value10]) =>
          '<button type="button" role="tab" data-replication-tab="' +
          value9 +
          '" aria-selected="' +
          (value9 === 'story') +
          '" tabindex="' +
          (value9 === 'story' ? 0 : -1) +
          '" aria-pressed="' +
          (value9 === 'story') +
          '">' +
          value10 +
          '</button>',
      )
      ['join']('') +
    '</nav>\n      <fieldset class="story-source-fields" data-replication-fields>' +
    renderStoryReplicationReviewTab(value8) +
    '</fieldset><nav class="story-source-segment-pagination" aria-label="片段切换"><button type="button" data-replication-previous>← 上一段</button><button type="button" data-replication-next>下一段 →</button></nav></div>\n    </div>\n    <footer class="story-source-review-footer"><span role="status" data-replication-status></span></footer>\n  </section>'
  );
}
export function renderStoryReplicationCast(value11, value12) {
  const enabled = value11['replication']['sourceAnalysis']['events']['find'](
    (value13) => value13['id'] === value12,
  );
  return value11['replication']['sourceAnalysis']['characters']
    ['filter']((value14) => !enabled || enabled['characterIds']['includes'](value14['id']))
    ['map']((error2) => {
      const value15 = error2['portrait']?.['url'] || error2['frame']?.['url'];
      return (
        '<button type="button" class="story-source-cast-card" data-replication-character-link="' +
        escape(error2['id']) +
        '">' +
        (value15
          ? '<img src="' + escape(value15) + '" alt="' + escape(error2['name']) + '" loading="lazy">'
          : '<span class="story-source-cast-placeholder">待选代表帧</span>') +
        '<span><strong>' +
        escape(error2['name']) +
        '</strong><small>' +
        (error2['role'] === 'main' ? '主角' : error2['role'] === 'supporting' ? '配角' : '待核对') +
        '</small></span></button>'
      );
    })
    ['join']('');
}
export function syncStoryReplicationReviewStatus(
  el,
  value16,
  { busy: busy = false, message: message = '' } = {},
) {
  const value17 = value16['clips']?.['length'] > 0;
  ((el['querySelector']('[data-replication-reanalyze]')['disabled'] = busy),
    (el['querySelector']('[data-replication-fields]')['disabled'] = busy || value17),
    el['querySelector']('[data-replication-review]')['setAttribute']('aria-busy', String(busy)));
  const enabled2 =
    message || (value17 ? '可重新分析原片；已有提示词与生成结果保持不变，需要时再重新生成分镜。' : '');
  ((el['querySelector']('[data-replication-status]')['innerHTML'] =
    '' + (busy ? renderStoryGenerationSpinner({ button: true }) : '') + escape(enabled2)),
    (el['querySelector']('.story-source-review-footer')['hidden'] = !enabled2 && !busy));
}
