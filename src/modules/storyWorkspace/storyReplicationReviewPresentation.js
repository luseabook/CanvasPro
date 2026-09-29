import { formatStoryVideoPlaybackTime } from './storyVideoPlayback.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { getVideoReplicationDialogueSummary } from '../../domain/storyGeneration/videoReplicationSourceAnalysis.js';
import { REPLICATION_VOICEOVER_KINDS } from '../../domain/storyGeneration/videoReplicationSpeech.js';
import {
  renderStoryReplicationCharacters,
  renderStoryReplicationCharacterSummary,
} from './storyReplicationCharacterPresentation.js';
import { renderStoryReplicationSegments } from './storyReplicationReviewNavigation.js';
const escape = (_0x497bb8) =>
    String(_0x497bb8 ?? '')['replace'](
      /[&<>"']/gu,
      (_0x304ddd) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[_0x304ddd],
    ),
  time = (_0x1e0d50) => formatStoryVideoPlaybackTime(_0x1e0d50),
  seek = (_0x31710c, _0x1e2c50, _0x14b969 = ![]) =>
    '<button type="button" data-replication-seek="' +
    Number(_0x31710c) +
    '\x22' +
    (_0x14b969 ? '\x20data-replication-listen' : '') +
    '>' +
    escape(_0x1e2c50 || time(_0x31710c)) +
    '</button>',
  field = (_0xeef007, _0x242d31, _0x1edb8e, _0x4df479, _0x5036ee, _0x411aec = '') =>
    '<label>' +
    escape(_0xeef007) +
    '<textarea rows="2" data-replication-edit="' +
    _0x242d31 +
    '\x22\x20data-id=\x22' +
    escape(_0x1edb8e) +
    '" data-field="' +
    _0x4df479 +
    '\x22\x20data-index=\x22' +
    _0x411aec +
    '\x22>' +
    escape(_0x5036ee) +
    '</textarea></label>';
export function renderStoryReplicationEvidenceSummary(_0xa3cce2) {
  return (
    renderStoryReplicationCharacterSummary(_0xa3cce2) +
    ' · ' +
    getVideoReplicationDialogueSummary(_0xa3cce2)['label']
  );
}
export function renderStoryReplicationReviewTab(
  _0x3ee25a,
  _0x85ceb2 = 'story',
  _0x1e533d = _0x3ee25a['replication']['sourceAnalysis']['events'][0x0]?.['id'],
) {
  const _0x18d3cf = _0x3ee25a['replication']['sourceAnalysis'],
    _0x4e3e77 = _0x18d3cf['events']['filter']((_0x43d122) => _0x43d122['id'] === _0x1e533d);
  if (_0x85ceb2 === 'overview') return field('全片概述', 'story', '', 'synopsis', _0x18d3cf['synopsis']);
  if (_0x85ceb2 === 'characters')
    return renderStoryReplicationCharacters(_0x3ee25a, { field: field, seek: seek });
  if (
    _0x85ceb2 === 'dialogue' &&
    !_0x4e3e77['some']((_0x1b82e2) => _0x1b82e2['dialogue']['length'] || _0x1b82e2['voiceover']?.['length'])
  )
    return '<p\x20class=\x22story-source-empty-frame\x22>本次分析未返回人声文案（对白、解说或独白）。可先回听原片，再用支持音画理解的模型重新分析。</p>';
  return (
    '' +
    _0x4e3e77['map'](
      (_0x218013) =>
        '<article class="story-source-event" data-replication-event="' +
        escape(_0x218013['id']) +
        '">\n      <header>' +
        seek(_0x218013['startSec'], time(_0x218013['startSec']) + '–' + time(_0x218013['endSec'])) +
        (_0x85ceb2 === 'dialogue'
          ? ''
          : '<span>' +
            (_0x218013['characterIds']
              ['map']((_0x1a85b3) =>
                escape(
                  _0x18d3cf['characters']['find']((_0x147cec) => _0x147cec['id'] === _0x1a85b3)?.['name'] ||
                    _0x1a85b3,
                ),
              )
              ['join']('、') || '无人出镜') +
            '</span>') +
        '</header>\x0a\x20\x20\x20\x20\x20\x20' +
        (_0x85ceb2 === 'dialogue'
          ? ''
          : field('画面与动作', 'event', _0x218013['id'], 'visual', _0x218013['visual'])) +
        '\n      ' +
        (_0x85ceb2 === 'shots'
          ? '<p>原片镜头：' +
            escape(_0x218013['camera']) +
            '</p><p>声音描述：' +
            escape(_0x218013['sound']) +
            '</p>'
          : ['dialogue', 'voiceover']
              ['flatMap']((_0x170a76) =>
                (_0x218013[_0x170a76] || [])['map'](
                  (_0x1b8ba0, _0x27609c) =>
                    '<div\x20class=\x22story-source-dialogue\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-source-dialogue-heading\x22>' +
                    seek(_0x1b8ba0['startSec'] ?? _0x218013['startSec'], '回听', !![]) +
                    '\n        ' +
                    (_0x170a76 === 'voiceover'
                      ? '<select aria-label="人声类型" data-replication-edit="voiceover" data-id="' +
                        escape(_0x218013['id']) +
                        '\x22\x20data-index=\x22' +
                        _0x27609c +
                        '" data-field="kind">' +
                        Object['entries'](REPLICATION_VOICEOVER_KINDS)
                          ['map'](
                            ([_0x5a658e, _0x378cda]) =>
                              '<option value="' +
                              _0x5a658e +
                              '\x22' +
                              (_0x1b8ba0['kind'] === _0x5a658e ? ' selected' : '') +
                              '>' +
                              _0x378cda +
                              '</option>',
                          )
                          ['join']('') +
                        '</select>'
                      : '<span>对白</span>') +
                    '\n        <select aria-label="说话人" data-replication-edit="' +
                    _0x170a76 +
                    '" data-id="' +
                    escape(_0x218013['id']) +
                    '" data-index="' +
                    _0x27609c +
                    '" data-field="speakerId"><option value="">' +
                    (_0x170a76 === 'voiceover' ? '独立解说员／未绑定角色' : '说话人待核对') +
                    '</option>' +
                    _0x18d3cf['characters']
                      ['map'](
                        (_0x3befd0) =>
                          '<option value="' +
                          escape(_0x3befd0['id']) +
                          '\x22' +
                          (_0x3befd0['id'] === _0x1b8ba0['speakerId'] ? '\x20selected' : '') +
                          '>' +
                          escape(_0x3befd0['name']) +
                          '</option>',
                      )
                      ['join']('') +
                    '</select>\n        <label class="story-source-check"><input type="checkbox" data-replication-edit="' +
                    _0x170a76 +
                    '" data-id="' +
                    escape(_0x218013['id']) +
                    '" data-index="' +
                    _0x27609c +
                    '" data-field="uncertain"' +
                    (_0x1b8ba0['uncertain'] ? '\x20checked' : '') +
                    '>待核对</label>\x0a\x20\x20\x20\x20\x20\x20\x20\x20</div><textarea\x20aria-label=\x22' +
                    (_0x170a76 === 'voiceover' ? '原语言解说／独白' : '原语言对白') +
                    '" rows="1" data-replication-edit="' +
                    _0x170a76 +
                    '\x22\x20data-id=\x22' +
                    escape(_0x218013['id']) +
                    '\x22\x20data-index=\x22' +
                    _0x27609c +
                    '\x22\x20data-field=\x22text\x22>' +
                    escape(_0x1b8ba0['text']) +
                    '</textarea>\n      </div>',
                ),
              )
              ['join']('')) +
        '\x0a\x20\x20\x20\x20\x20\x20' +
        (_0x85ceb2 !== 'dialogue' && _0x218013['uncertainties']['length']
          ? '<details\x20class=\x22story-source-doubt\x22><summary>识别备注</summary><p>' +
            _0x218013['uncertainties']['map'](escape)['join']('；') +
            '</p></details>'
          : '') +
        '\n    </article>',
    )['join']('')
  );
}
export function renderStoryReplicationReview(_0x4463fd) {
  return (
    '<section\x20class=\x22story-source-review\x22\x20data-replication-review\x20aria-label=\x22原视频分析详情\x22>\x0a\x20\x20\x20\x20<header\x20class=\x22story-source-review-heading\x22><div\x20class=\x22story-source-review-title\x22><strong>' +
    escape(_0x4463fd['title']) +
    '</strong><small\x20data-replication-review-summary>' +
    renderStoryReplicationEvidenceSummary(_0x4463fd['replication']['sourceAnalysis']) +
    '</small></div><div\x20class=\x22story-source-actions\x22><button\x20type=\x22button\x22\x20data-replication-reanalyze>重新分析</button><button\x20type=\x22button\x22\x20data-replication-close>返回视频列表</button></div></header>\x0a\x20\x20\x20\x20<div\x20class=\x22story-source-review-layout\x22>\x0a\x20\x20\x20\x20\x20\x20<aside\x20class=\x22story-source-segment-sidebar\x22><header>片段列表\x20<span\x20data-replication-segment-count>' +
    _0x4463fd['replication']['sourceAnalysis']['events']['length'] +
    '</span></header><nav class="story-source-segments" data-replication-segments aria-label="原片片段">' +
    renderStoryReplicationSegments(_0x4463fd['replication']['sourceAnalysis']) +
    '</nav></aside>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22panel-resize-handle\x20story-source-splitter\x22\x20data-review-splitter=\x22left\x22\x20role=\x22separator\x22\x20aria-orientation=\x22vertical\x22\x20aria-label=\x22调整片段列表宽度\x22\x20tabindex=\x220\x22></div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-source-player\x22><div\x20class=\x22story-source-video-stage\x22><video\x20controls\x20playsinline\x20preload=\x22metadata\x22\x20aria-label=\x22原视频核对播放器\x22' +
    (_0x4463fd['sourceVideo']['posterUrl']
      ? ' poster="' + escape(_0x4463fd['sourceVideo']['posterUrl']) + '\x22'
      : '') +
    '></video><div data-replication-seeking hidden role="status">' +
    renderStoryGenerationSpinner({ button: !![] }) +
    '正在定位原片画面</div></div><p>本段人物</p><div\x20class=\x22story-source-cast\x22\x20data-replication-cast>' +
    renderStoryReplicationCast(_0x4463fd, _0x4463fd['replication']['sourceAnalysis']['events'][0x0]?.['id']) +
    '</div></div>\n      <div class="panel-resize-handle story-source-splitter" data-review-splitter="right" role="separator" aria-orientation="vertical" aria-label="调整播放器与编辑区宽度" tabindex="0"></div>\n      <div class="story-source-details"><header class="story-source-detail-heading"><strong data-replication-segment-heading></strong><small data-replication-segment-time></small></header><nav class="story-source-tabs" role="tablist" aria-label="分析内容">' +
    [
      ['overview', '全片概述'],
      ['story', '片段内容'],
      ['dialogue', '人声文案'],
      ['characters', '人物'],
      ['shots', '镜头'],
    ]
      ['map'](
        ([_0x46d804, _0x437b9a]) =>
          '<button type="button" role="tab" data-replication-tab="' +
          _0x46d804 +
          '\x22\x20aria-selected=\x22' +
          (_0x46d804 === 'story') +
          '" tabindex="' +
          (_0x46d804 === 'story' ? 0x0 : -0x1) +
          '\x22\x20aria-pressed=\x22' +
          (_0x46d804 === 'story') +
          '\x22>' +
          _0x437b9a +
          '</button>',
      )
      ['join']('') +
    '</nav>\n      <fieldset class="story-source-fields" data-replication-fields>' +
    renderStoryReplicationReviewTab(_0x4463fd) +
    '</fieldset><nav\x20class=\x22story-source-segment-pagination\x22\x20aria-label=\x22片段切换\x22><button\x20type=\x22button\x22\x20data-replication-previous>←\x20上一段</button><button\x20type=\x22button\x22\x20data-replication-next>下一段\x20→</button></nav></div>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20<footer\x20class=\x22story-source-review-footer\x22><span\x20role=\x22status\x22\x20data-replication-status></span></footer>\x0a\x20\x20</section>'
  );
}
export function renderStoryReplicationCast(_0xafe23, _0x30f935) {
  const _0x5962b8 = _0xafe23['replication']['sourceAnalysis']['events']['find'](
    (_0x550be3) => _0x550be3['id'] === _0x30f935,
  );
  return _0xafe23['replication']['sourceAnalysis']['characters']
    ['filter']((_0x3da6ab) => !_0x5962b8 || _0x5962b8['characterIds']['includes'](_0x3da6ab['id']))
    ['map']((_0x19df12) => {
      const _0x12f47b = _0x19df12['portrait']?.['url'] || _0x19df12['frame']?.['url'];
      return (
        '<button type="button" class="story-source-cast-card" data-replication-character-link="' +
        escape(_0x19df12['id']) +
        '\x22>' +
        (_0x12f47b
          ? '<img\x20src=\x22' +
            escape(_0x12f47b) +
            '" alt="' +
            escape(_0x19df12['name']) +
            '" loading="lazy">'
          : '<span class="story-source-cast-placeholder">待选代表帧</span>') +
        '<span><strong>' +
        escape(_0x19df12['name']) +
        '</strong><small>' +
        (_0x19df12['role'] === 'main' ? '主角' : _0x19df12['role'] === 'supporting' ? '配角' : '待核对') +
        '</small></span></button>'
      );
    })
    ['join']('');
}
export function syncStoryReplicationReviewStatus(
  _0x308a70,
  _0x37e36d,
  { busy: busy = ![], message: message = '' } = {},
) {
  const _0x456b78 = _0x37e36d['clips']?.['length'] > 0x0;
  ((_0x308a70['querySelector']('[data-replication-reanalyze]')['disabled'] = busy),
    (_0x308a70['querySelector']('[data-replication-fields]')['disabled'] = busy || _0x456b78),
    _0x308a70['querySelector']('[data-replication-review]')['setAttribute']('aria-busy', String(busy)));
  const _0x1b85dc =
    message || (_0x456b78 ? '可重新分析原片；已有提示词与生成结果保持不变，需要时再重新生成分镜。' : '');
  ((_0x308a70['querySelector']('[data-replication-status]')['innerHTML'] =
    '' + (busy ? renderStoryGenerationSpinner({ button: !![] }) : '') + escape(_0x1b85dc)),
    (_0x308a70['querySelector']('.story-source-review-footer')['hidden'] = !_0x1b85dc && !busy));
}
