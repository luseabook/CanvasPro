import {
  REPLICATION_CHARACTER_ROLES,
  REPLICATION_SUBJECT_TYPES,
  getVideoReplicationCharacterRoster,
  getVideoReplicationCharacterSummary,
} from '../../domain/storyGeneration/videoReplicationCharacters.js';
const escape = (value) =>
    String(value ?? '')['replace'](
      /[&<>"']/gu,
      (item) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[item],
    ),
  options = (key, index) =>
    Object['entries'](key)
      ['map'](
        ([result, data]) =>
          '<option value="' +
          result +
          '\x22' +
          (index === result ? ' selected' : '') +
          '>' +
          data +
          '</option>',
      )
      ['join']('');
export function renderStoryReplicationCharacterSummary(target) {
  const videoReplicationCharacterSummary = getVideoReplicationCharacterSummary(target);
  return (
    '已识别\x20' +
    videoReplicationCharacterSummary['total'] +
    ' 个角色：' +
    videoReplicationCharacterSummary['people'] +
    ' 人、' +
    videoReplicationCharacterSummary['animals'] +
    ' 个动物 · ' +
    videoReplicationCharacterSummary['main'] +
    '\x20位主角\x20·\x20' +
    videoReplicationCharacterSummary['uncertain'] +
    ' 位待核对'
  );
}
export function renderStoryReplicationCharacters(source, { field: field, seek: seek }) {
  const next = source['replication']['sourceAnalysis'];
  return (
    '<div class="story-source-roster-summary">\n    <div class="story-source-actions"><button type="button" data-replication-add-character>补录当前画面人物</button></div></div>\n    ' +
    getVideoReplicationCharacterRoster(next)
      ['map'](
        (error) =>
          '<article class="story-source-character" data-replication-character="' +
          escape(error['id']) +
          '\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-source-character-overview\x22><div>\x0a\x20\x20\x20\x20\x20\x20' +
          (error['portrait']?.['url'] || error['frame']?.['url']
            ? '<img src="' +
              escape(error['portrait']?.['url'] || error['frame']['url']) +
              '\x22\x20alt=\x22' +
              escape(error['name']) +
              '在原片中的代表画面" loading="lazy">'
            : '<p\x20class=\x22story-source-empty-frame\x22>暂无代表画面</p>') +
          '\n      </div><div class="story-source-character-info"><strong data-replication-character-heading>' +
          escape(error['name']) +
          '</strong>\n      <p>' +
          error['eventCount'] +
          ' 个出场片段 · ' +
          error['dialogueCount'] +
          '\x20句对白</p>\x0a\x20\x20\x20\x20\x20\x20<label>角色类型<select\x20data-replication-edit=\x22character\x22\x20data-id=\x22' +
          escape(error['id']) +
          '" data-field="role">' +
          options(REPLICATION_CHARACTER_ROLES, error['role']) +
          '</select></label>\n      ' +
          field('称呼', 'character', error['id'], 'name', error['name']) +
          '\n      ' +
          field('外观与位置', 'character', error['id'], 'description', error['description']) +
          '\n      </div></div>\n      ' +
          (error['frameError'] ? '<p role="status">' + escape(error['frameError']) + '</p>' : '') +
          '\n      <div class="story-source-actions">' +
          seek(error['representativeTimeSec'], '回看代表画面') +
          '\n        <button type="button" data-replication-capture="' +
          escape(error['id']) +
          '\x22>使用当前帧</button></div>\x0a\x20\x20\x20\x20\x20\x20<details><summary>核对出场片段</summary><div\x20class=\x22story-source-presence\x22>' +
          next['events']
            ['map'](
              (current) =>
                '<label><input type="checkbox" data-replication-presence="' +
                escape(error['id']) +
                '" data-event-id="' +
                escape(current['id']) +
                '\x22' +
                (current['characterIds']['includes'](error['id']) ? ' checked' : '') +
                '>' +
                escape(current['startSec']) +
                '–' +
                escape(current['endSec']) +
                '\x20秒</label>' +
                seek(current['startSec'], '回看'),
            )
            ['join']('') +
          '</div></details>\n      <details class="story-source-character-corrections"><summary>修正识别与角色关系</summary><div class="story-source-character-info">\n      <label>主体类别<select data-replication-edit="character" data-id="' +
          escape(error['id']) +
          '" data-field="subjectType">' +
          options(REPLICATION_SUBJECT_TYPES, error['subjectType']) +
          '</select></label>\n      ' +
          field('主配角判断依据', 'character', error['id'], 'roleEvidence', error['roleEvidence']) +
          '\x0a\x20\x20\x20\x20\x20\x20' +
          field('身份疑点', 'character', error['id'], 'identityNotes', error['identityNotes']) +
          '\n      <div class="story-source-actions"><label>合并重复角色<select data-replication-merge="' +
          escape(error['id']) +
          '"><option value="">选择同一人物的记录</option>' +
          next['characters']
            ['filter']((entry) => entry['id'] !== error['id'])
            ['map'](
              (error2) =>
                '<option value="' + escape(error2['id']) + '\x22>' + escape(error2['name']) + '</option>',
            )
            ['join']('') +
          '</select></label>\n        <button type="button" data-replication-remove-character="' +
          escape(error['id']) +
          '\x22>删除误识别人物</button></div>\x0a\x20\x20\x20\x20\x20\x20</div></details>\x0a\x20\x20\x20\x20</article>',
      )
      ['join']('')
  );
}
