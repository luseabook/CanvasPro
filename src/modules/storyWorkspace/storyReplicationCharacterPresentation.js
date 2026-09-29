import {
  REPLICATION_CHARACTER_ROLES,
  REPLICATION_SUBJECT_TYPES,
  getVideoReplicationCharacterRoster,
  getVideoReplicationCharacterSummary,
} from '../../domain/storyGeneration/videoReplicationCharacters.js';
const escape = (_0x149663) =>
    String(_0x149663 ?? '')['replace'](
      /[&<>"']/gu,
      (_0x33fc20) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\x22': '&quot;', '\x27': '&#39;' })[_0x33fc20],
    ),
  options = (_0x20f517, _0x549c3d) =>
    Object['entries'](_0x20f517)
      ['map'](
        ([_0x138eef, _0x258b10]) =>
          '<option value="' +
          _0x138eef +
          '\x22' +
          (_0x549c3d === _0x138eef ? ' selected' : '') +
          '>' +
          _0x258b10 +
          '</option>',
      )
      ['join']('');
export function renderStoryReplicationCharacterSummary(_0x30962e) {
  const _0x5aeed1 = getVideoReplicationCharacterSummary(_0x30962e);
  return (
    '已识别\x20' +
    _0x5aeed1['total'] +
    ' 个角色：' +
    _0x5aeed1['people'] +
    ' 人、' +
    _0x5aeed1['animals'] +
    ' 个动物 · ' +
    _0x5aeed1['main'] +
    '\x20位主角\x20·\x20' +
    _0x5aeed1['uncertain'] +
    ' 位待核对'
  );
}
export function renderStoryReplicationCharacters(_0x5cae55, { field: _0x4f6b4a, seek: _0x57c4f2 }) {
  const _0x18540c = _0x5cae55['replication']['sourceAnalysis'];
  return (
    '<div class="story-source-roster-summary">\n    <div class="story-source-actions"><button type="button" data-replication-add-character>补录当前画面人物</button></div></div>\n    ' +
    getVideoReplicationCharacterRoster(_0x18540c)
      ['map'](
        (_0x1a0413) =>
          '<article class="story-source-character" data-replication-character="' +
          escape(_0x1a0413['id']) +
          '\x22>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-source-character-overview\x22><div>\x0a\x20\x20\x20\x20\x20\x20' +
          (_0x1a0413['portrait']?.['url'] || _0x1a0413['frame']?.['url']
            ? '<img src="' +
              escape(_0x1a0413['portrait']?.['url'] || _0x1a0413['frame']['url']) +
              '\x22\x20alt=\x22' +
              escape(_0x1a0413['name']) +
              '在原片中的代表画面" loading="lazy">'
            : '<p\x20class=\x22story-source-empty-frame\x22>暂无代表画面</p>') +
          '\n      </div><div class="story-source-character-info"><strong data-replication-character-heading>' +
          escape(_0x1a0413['name']) +
          '</strong>\n      <p>' +
          _0x1a0413['eventCount'] +
          ' 个出场片段 · ' +
          _0x1a0413['dialogueCount'] +
          '\x20句对白</p>\x0a\x20\x20\x20\x20\x20\x20<label>角色类型<select\x20data-replication-edit=\x22character\x22\x20data-id=\x22' +
          escape(_0x1a0413['id']) +
          '" data-field="role">' +
          options(REPLICATION_CHARACTER_ROLES, _0x1a0413['role']) +
          '</select></label>\n      ' +
          _0x4f6b4a('称呼', 'character', _0x1a0413['id'], 'name', _0x1a0413['name']) +
          '\n      ' +
          _0x4f6b4a('外观与位置', 'character', _0x1a0413['id'], 'description', _0x1a0413['description']) +
          '\n      </div></div>\n      ' +
          (_0x1a0413['frameError'] ? '<p role="status">' + escape(_0x1a0413['frameError']) + '</p>' : '') +
          '\n      <div class="story-source-actions">' +
          _0x57c4f2(_0x1a0413['representativeTimeSec'], '回看代表画面') +
          '\n        <button type="button" data-replication-capture="' +
          escape(_0x1a0413['id']) +
          '\x22>使用当前帧</button></div>\x0a\x20\x20\x20\x20\x20\x20<details><summary>核对出场片段</summary><div\x20class=\x22story-source-presence\x22>' +
          _0x18540c['events']
            ['map'](
              (_0x1a126f) =>
                '<label><input type="checkbox" data-replication-presence="' +
                escape(_0x1a0413['id']) +
                '" data-event-id="' +
                escape(_0x1a126f['id']) +
                '\x22' +
                (_0x1a126f['characterIds']['includes'](_0x1a0413['id']) ? ' checked' : '') +
                '>' +
                escape(_0x1a126f['startSec']) +
                '–' +
                escape(_0x1a126f['endSec']) +
                '\x20秒</label>' +
                _0x57c4f2(_0x1a126f['startSec'], '回看'),
            )
            ['join']('') +
          '</div></details>\n      <details class="story-source-character-corrections"><summary>修正识别与角色关系</summary><div class="story-source-character-info">\n      <label>主体类别<select data-replication-edit="character" data-id="' +
          escape(_0x1a0413['id']) +
          '" data-field="subjectType">' +
          options(REPLICATION_SUBJECT_TYPES, _0x1a0413['subjectType']) +
          '</select></label>\n      ' +
          _0x4f6b4a(
            '主配角判断依据',
            'character',
            _0x1a0413['id'],
            'roleEvidence',
            _0x1a0413['roleEvidence'],
          ) +
          '\x0a\x20\x20\x20\x20\x20\x20' +
          _0x4f6b4a('身份疑点', 'character', _0x1a0413['id'], 'identityNotes', _0x1a0413['identityNotes']) +
          '\n      <div class="story-source-actions"><label>合并重复角色<select data-replication-merge="' +
          escape(_0x1a0413['id']) +
          '"><option value="">选择同一人物的记录</option>' +
          _0x18540c['characters']
            ['filter']((_0x573a0f) => _0x573a0f['id'] !== _0x1a0413['id'])
            ['map'](
              (_0x2e2316) =>
                '<option value="' +
                escape(_0x2e2316['id']) +
                '\x22>' +
                escape(_0x2e2316['name']) +
                '</option>',
            )
            ['join']('') +
          '</select></label>\n        <button type="button" data-replication-remove-character="' +
          escape(_0x1a0413['id']) +
          '\x22>删除误识别人物</button></div>\x0a\x20\x20\x20\x20\x20\x20</div></details>\x0a\x20\x20\x20\x20</article>',
      )
      ['join']('')
  );
}
