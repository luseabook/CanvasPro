import { STORY_SCRIPT_MAX_CHARACTERS } from './storyProjectPlanning.js';
import { createStoryWorkspaceChromePresentation } from './storyWorkspaceChromePresentation.js';
export const STORY_COLLABORATION_DIRECTIONS = [
  '悬念推进',
  '人物弧光',
  '情绪共鸣',
  '反转',
  '轻喜剧',
  '克制对白',
];
const escapeHtml = (_0x21031e) =>
  String(_0x21031e ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
export function renderStoryConceptionPage(_0x21b9d6) {
  const _0x10951b = _0x21b9d6['data']['project'],
    _0x2de126 = _0x10951b['collaboration'],
    _0x4ce19e =
      '<button type="button" class="story-secondary-button" data-collaboration-undo disabled>撤销上次采用</button><button type="button" class="story-next-button" data-collaboration-confirm ' +
      (_0x2de126['draft']['trim']() ? '' : 'disabled') +
      '>' +
      (_0x2de126['stage'] === 'writing' ? '确认正文，进入制作' : '另存为新剧本，进入制作') +
      '</button>';
  return (
    '<div class="story-content-page story-script-workflow-page story-conception-page">\n    <div class="story-script-workflow-card">\n      <details class="story-script-accordion" open>\n        <summary><span class="story-script-accordion-summary-row"><span class="story-script-accordion-title">故事构思</span></span></summary>\n        <div class="story-conception-fields">\n          <label class="story-outline-field"><span>剧本名称</span><input data-collaboration-title maxlength="120" aria-label="剧本名称" value="' +
    escapeHtml(_0x10951b['title']) +
    '"></label>\n          <label class="story-outline-field"><span>最初的故事想法</span><textarea data-collaboration-idea aria-label="故事想法" maxlength="5000" rows="3">' +
    escapeHtml(_0x2de126['idea'] || '') +
    '</textarea></label>\n        </div>\n      </details>\n      <details class="story-script-accordion story-collaboration-settings" open>\n        <summary><span class="story-script-accordion-summary-row"><span class="story-script-accordion-title">创作设定</span></span></summary>\n        <div class="story-collaboration-directions" role="group" aria-label="创作方向，可多选">' +
    STORY_COLLABORATION_DIRECTIONS['map'](
      (_0x3233d0) =>
        '<button type="button" class="story-secondary-button" data-collaboration-direction="' +
        _0x3233d0 +
        '\x22\x20aria-pressed=\x22' +
        _0x2de126['directions']['includes'](_0x3233d0) +
        '\x22>' +
        _0x3233d0 +
        '</button>',
    )['join']('') +
    '</div>\n        <label class="story-outline-field"><span>创作要求</span><textarea data-collaboration-brief aria-label="创作要求" rows="3" maxlength="5000" placeholder="受众、篇幅、人物关系、必须保留的设定，以及不希望出现的内容">' +
    escapeHtml(_0x2de126['brief']) +
    '</textarea></label>\n      </details>\n      <details class="story-script-accordion" open>\n        <summary><span class="story-script-accordion-summary-row"><span class="story-script-accordion-title">剧本正文</span><small data-collaboration-status role="status">自动保存</small></span></summary>\n        <label class="story-outline-field"><textarea data-collaboration-draft aria-label="剧本正文" maxlength="' +
    STORY_SCRIPT_MAX_CHARACTERS +
    '" placeholder="在这里写作，或采用右侧 AI 的回复。选中文字后，可以只修改这一段。">' +
    escapeHtml(_0x2de126['draft']) +
    '</textarea></label>\n      </details>\n    </div>\n    ' +
    createStoryWorkspaceChromePresentation()['renderFooter']({
      title: '与\x20AI\x20一起打磨故事',
      hint: '正文由你编辑和确认，确认后继续原有制作流程',
      actionsMarkup: _0x4ce19e,
    }) +
    '\x0a\x20\x20</div>'
  );
}
