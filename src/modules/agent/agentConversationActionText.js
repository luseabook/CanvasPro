import { getLocale } from '../../i18n/index.js';
const copy = {
  'zh-CN': {
    retry: '重新回答',
    edit: '编辑提问',
    cancel: '取消',
    save: '保存并重新回答',
    previous: '上一个版本',
    next: '下一个版本',
    version: '回答版本',
    limit: '回答版本已达上限，请发送新消息继续',
  },
  'en-US': {
    retry: 'Regenerate',
    edit: 'Edit question',
    cancel: 'Cancel',
    save: 'Save and regenerate',
    previous: 'Previous version',
    next: 'Next version',
    version: 'Answer version',
    limit: 'Answer version limit reached. Send a new message to continue.',
  },
};
export function agentConversationActionText(value, locale = getLocale()) {
  return copy[String(locale)['startsWith']('en') ? 'en-US' : 'zh-CN'][value] || value;
}
