import {
  isRunningHubMediaUploadApiKeyMissingError,
  RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE,
} from '../../api/mediaUploadErrors.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { openProviderApiKeySettings, showProviderApiKeyMissingToast } from './providerApiKeyMissingToast.js';
const GUIDE_BACKDROP_ID = 'runninghub-media-upload-guide-backdrop',
  GUIDE_DIALOG_ID = 'runninghub-media-upload-guide',
  RUNNINGHUB_INVITE_URL = 'https://www.runninghub.cn/?inviteCode=rh-v1312',
  RUNNINGHUB_MODEL_API_KEY_MISSING_MESSAGE = '需要配置 RunningHub 模型 API Key',
  RUNNINGHUB_MODEL_API_KEY_MISSING_TOAST = '请先填写 RunningHub 模型 API Key';
function createEl(value, item = '', key = '') {
  const el = document.createElement(value);
  if (item) el.className = item;
  if (key) el.textContent = key;
  return el;
}
export function closeRunningHubMediaUploadGuide() {
  (document.getElementById(GUIDE_BACKDROP_ID)?.remove(),
    document.getElementById(GUIDE_DIALOG_ID)?.remove(),
    document.removeEventListener('keydown', handleGuideKeydown));
}
function handleGuideKeydown(event) {
  if (event.key !== 'Escape') return;
  if (!document.getElementById(GUIDE_DIALOG_ID)) return;
  (event.preventDefault(), closeRunningHubMediaUploadGuide());
}
export function openRunningHubModelApiKeySettings() {
  (closeRunningHubMediaUploadGuide(),
    openProviderApiKeySettings({ providerId: 'runninghub', keyType: 'modelApi' }));
}
function appendGuideStep(el2, index) {
  const el3 = createEl('li', '', index);
  el2.appendChild(el3);
}
function showRunningHubGuideDialog({
  ariaLabel: ariaLabel,
  headerTitle: headerTitle,
  title: title,
  subtitle: subtitle,
  sectionTitle: sectionTitle,
  steps: steps,
  footerTitle: footerTitle = '说明',
  footerText: footerText,
  settingsButtonLabel: settingsButtonLabel = '打开 API Key 设置',
  settingsButtonPrimary: settingsButtonPrimary = false,
} = {}) {
  closeRunningHubMediaUploadGuide();
  const el4 = createEl('div', 'update-banner-backdrop open');
  ((el4.id = GUIDE_BACKDROP_ID), el4.setAttribute('aria-hidden', 'true'));
  const el5 = createEl('section', 'update-banner runninghub-media-upload-guide open');
  ((el5.id = GUIDE_DIALOG_ID),
    el5.setAttribute('role', 'dialog'),
    el5.setAttribute('aria-modal', 'true'),
    el5.setAttribute('aria-label', ariaLabel || 'RunningHub 配置'));
  const el6 = createEl('div', 'update-banner-header'),
    el7 = createEl('span', 'update-banner-icon runninghub-media-upload-guide-icon', 'RH');
  el7.setAttribute('aria-hidden', 'true');
  const el8 = createEl('div', 'update-banner-header-title');
  el8.textContent = headerTitle || '配置 RunningHub';
  const el9 = createEl('button', 'update-banner-close', 'x');
  ((el9.type = 'button'),
    (el9.title = '关闭'),
    el9.setAttribute('aria-label', '关闭'),
    (el9.dataset.runninghubUploadGuideAction = 'close'),
    el6.append(el7, el8, el9));
  const el10 = createEl('div', 'update-banner-text'),
    el11 = createEl('div', 'update-banner-title', title || RUNNINGHUB_MODEL_API_KEY_MISSING_MESSAGE),
    el12 = createEl(
      'div',
      'update-banner-sub',
      subtitle || '当前模型需要 RunningHub 模型 API Key 才能提交生成。',
    ),
    el13 = createEl('div', 'update-banner-notes'),
    el14 = createEl('div', 'update-banner-section-title', sectionTitle || '按这几步完成设置'),
    el15 = createEl('ol', 'update-banner-note-list');
  ((Array.isArray(steps) ? steps : []).forEach((result) => {
    appendGuideStep(el15, result);
  }),
    el13.append(el14, el15));
  if (footerText) {
    const el16 = createEl('div', 'update-banner-note-footer'),
      el17 = createEl('div', 'update-banner-note-footer-title', footerTitle),
      el18 = createEl('p', 'update-banner-note-paragraph', footerText);
    (el16.append(el17, el18), el13.append(el16));
  }
  el10.append(el11, el12, el13);
  const el19 = createEl('div', 'update-banner-actions'),
    el20 = createEl(
      'button',
      settingsButtonPrimary ? 'update-banner-btn is-primary' : 'update-banner-btn',
      settingsButtonLabel,
    );
  ((el20.type = 'button'), (el20.dataset.runninghubUploadGuideAction = 'settings'));
  const el21 = createEl(
    'button',
    settingsButtonPrimary ? 'update-banner-btn' : 'update-banner-btn is-primary',
    '打开 RunningHub',
  );
  ((el21.type = 'button'),
    (el21.dataset.runninghubUploadGuideAction = 'open-runninghub'),
    el19.append(el20, el21),
    el5.append(el6, el10, el19),
    document.body?.append(el4, el5),
    el4.addEventListener('click', closeRunningHubMediaUploadGuide),
    el5.addEventListener('click', (event2) => {
      const el22 = event2.target?.closest?.('[data-runninghub-upload-guide-action]');
      if (!el22) return;
      event2.preventDefault();
      const data = el22.dataset.runninghubUploadGuideAction;
      if (data === 'close') closeRunningHubMediaUploadGuide();
      if (data === 'settings') openRunningHubModelApiKeySettings();
      data === 'open-runninghub' &&
        void openExternalLink(RUNNINGHUB_INVITE_URL, { label: 'RunningHub' }).catch((error) => {
          window.showToast?.(error?.message || '打开 RunningHub 失败', 'error');
        });
    }),
    document.addEventListener('keydown', handleGuideKeydown));
}
export function showRunningHubMediaUploadGuide() {
  showRunningHubGuideDialog({
    ariaLabel: 'RunningHub 上传配置',
    headerTitle: '配置 RunningHub 上传',
    title: RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE,
    subtitle: '当前模型需要先把本地视频/音频上传为公网 URL，然后再提交给模型 API。',
    sectionTitle: '按这几步连接 RunningHub',
    steps: [
      '点击下方按钮打开 RunningHub，并使用推广连接进入。',
      '登录后进入 API Key 页面，复制可用于上传的 API Key。',
      '回到本应用的设置 > API Key > RunningHub。',
      '优先粘贴到“模型 API 密钥”，保存后重新生成。',
    ],
    footerText:
      'RunningHub 上传返回的是临时公网链接，适合本次生成使用；后续可切换到你自己的 Cloudflare R2 存储。',
  });
}
export function showRunningHubModelApiKeyMissingToast() {
  showProviderApiKeyMissingToast(RUNNINGHUB_MODEL_API_KEY_MISSING_TOAST, {
    providerId: 'runninghub',
    keyType: 'modelApi',
  });
}
export function isRunningHubModelApiKeyMissingError(error2) {
  const options = String(error2?.provider || '')
      .trim()
      .toLowerCase(),
    target = String(error2?.message || error2 || '').trim();
  if (options && options !== 'runninghub') return false;
  if (!/api\s*key/i.test(target)) return false;
  if (!/(未配置|not configured|is not configured)/i.test(target)) return false;
  return options === 'runninghub' || /runninghub/i.test(target);
}
export function showRunningHubModelApiKeyMissingToastForError(source) {
  if (!isRunningHubModelApiKeyMissingError(source)) return false;
  return (showRunningHubModelApiKeyMissingToast(), true);
}
export function showRunningHubMediaUploadGuideForError(next) {
  if (!isRunningHubMediaUploadApiKeyMissingError(next)) return false;
  return (showRunningHubMediaUploadGuide(), true);
}
