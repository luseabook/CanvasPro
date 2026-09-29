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
function createEl(_0x35fe8e, _0x155d96 = '', _0x7ee977 = '') {
  const _0x58e5d5 = document['createElement'](_0x35fe8e);
  if (_0x155d96) _0x58e5d5['className'] = _0x155d96;
  if (_0x7ee977) _0x58e5d5['textContent'] = _0x7ee977;
  return _0x58e5d5;
}
export function closeRunningHubMediaUploadGuide() {
  (document['getElementById'](GUIDE_BACKDROP_ID)?.['remove'](),
    document['getElementById'](GUIDE_DIALOG_ID)?.['remove'](),
    document['removeEventListener']('keydown', handleGuideKeydown));
}
function handleGuideKeydown(_0x564647) {
  if (_0x564647['key'] !== 'Escape') return;
  if (!document['getElementById'](GUIDE_DIALOG_ID)) return;
  (_0x564647['preventDefault'](), closeRunningHubMediaUploadGuide());
}
export function openRunningHubModelApiKeySettings() {
  (closeRunningHubMediaUploadGuide(),
    openProviderApiKeySettings({ providerId: 'runninghub', keyType: 'modelApi' }));
}
function appendGuideStep(_0x4bb46b, _0xfe1ca7) {
  const _0x1c2266 = createEl('li', '', _0xfe1ca7);
  _0x4bb46b['appendChild'](_0x1c2266);
}
function showRunningHubGuideDialog({
  ariaLabel: _0x316397,
  headerTitle: _0x2838c5,
  title: _0x57ff8d,
  subtitle: _0x21734b,
  sectionTitle: _0x12bb65,
  steps: _0x888fd4,
  footerTitle: footerTitle = '说明',
  footerText: _0x487bda,
  settingsButtonLabel: settingsButtonLabel = '打开\x20API\x20Key\x20设置',
  settingsButtonPrimary: settingsButtonPrimary = ![],
} = {}) {
  closeRunningHubMediaUploadGuide();
  const _0x39ad1c = createEl('div', 'update-banner-backdrop open');
  ((_0x39ad1c['id'] = GUIDE_BACKDROP_ID), _0x39ad1c['setAttribute']('aria-hidden', 'true'));
  const _0x33ab55 = createEl('section', 'update-banner runninghub-media-upload-guide open');
  ((_0x33ab55['id'] = GUIDE_DIALOG_ID),
    _0x33ab55['setAttribute']('role', 'dialog'),
    _0x33ab55['setAttribute']('aria-modal', 'true'),
    _0x33ab55['setAttribute']('aria-label', _0x316397 || 'RunningHub 配置'));
  const _0x244933 = createEl('div', 'update-banner-header'),
    _0x1c539b = createEl('span', 'update-banner-icon\x20runninghub-media-upload-guide-icon', 'RH');
  _0x1c539b['setAttribute']('aria-hidden', 'true');
  const _0x545382 = createEl('div', 'update-banner-header-title');
  _0x545382['textContent'] = _0x2838c5 || '配置 RunningHub';
  const _0x347d2f = createEl('button', 'update-banner-close', 'x');
  ((_0x347d2f['type'] = 'button'),
    (_0x347d2f['title'] = '关闭'),
    _0x347d2f['setAttribute']('aria-label', '关闭'),
    (_0x347d2f['dataset']['runninghubUploadGuideAction'] = 'close'),
    _0x244933['append'](_0x1c539b, _0x545382, _0x347d2f));
  const _0x4f66cd = createEl('div', 'update-banner-text'),
    _0x24d16b = createEl('div', 'update-banner-title', _0x57ff8d || RUNNINGHUB_MODEL_API_KEY_MISSING_MESSAGE),
    _0x5d0c42 = createEl(
      'div',
      'update-banner-sub',
      _0x21734b || '当前模型需要\x20RunningHub\x20模型\x20API\x20Key\x20才能提交生成。',
    ),
    _0x57d670 = createEl('div', 'update-banner-notes'),
    _0xbd41a2 = createEl('div', 'update-banner-section-title', _0x12bb65 || '按这几步完成设置'),
    _0x3d23ec = createEl('ol', 'update-banner-note-list');
  ((Array['isArray'](_0x888fd4) ? _0x888fd4 : [])['forEach']((_0x580c97) => {
    appendGuideStep(_0x3d23ec, _0x580c97);
  }),
    _0x57d670['append'](_0xbd41a2, _0x3d23ec));
  if (_0x487bda) {
    const _0x37b609 = createEl('div', 'update-banner-note-footer'),
      _0xdbe263 = createEl('div', 'update-banner-note-footer-title', footerTitle),
      _0x2fb37d = createEl('p', 'update-banner-note-paragraph', _0x487bda);
    (_0x37b609['append'](_0xdbe263, _0x2fb37d), _0x57d670['append'](_0x37b609));
  }
  _0x4f66cd['append'](_0x24d16b, _0x5d0c42, _0x57d670);
  const _0x27d937 = createEl('div', 'update-banner-actions'),
    _0x5e8a81 = createEl(
      'button',
      settingsButtonPrimary ? 'update-banner-btn is-primary' : 'update-banner-btn',
      settingsButtonLabel,
    );
  ((_0x5e8a81['type'] = 'button'), (_0x5e8a81['dataset']['runninghubUploadGuideAction'] = 'settings'));
  const _0x568f84 = createEl(
    'button',
    settingsButtonPrimary ? 'update-banner-btn' : 'update-banner-btn is-primary',
    '打开 RunningHub',
  );
  ((_0x568f84['type'] = 'button'),
    (_0x568f84['dataset']['runninghubUploadGuideAction'] = 'open-runninghub'),
    _0x27d937['append'](_0x5e8a81, _0x568f84),
    _0x33ab55['append'](_0x244933, _0x4f66cd, _0x27d937),
    document['body']?.['append'](_0x39ad1c, _0x33ab55),
    _0x39ad1c['addEventListener']('click', closeRunningHubMediaUploadGuide),
    _0x33ab55['addEventListener']('click', (_0x8378e2) => {
      const _0x3ec3bc = _0x8378e2['target']?.['closest']?.('[data-runninghub-upload-guide-action]');
      if (!_0x3ec3bc) return;
      _0x8378e2['preventDefault']();
      const _0x3c7070 = _0x3ec3bc['dataset']['runninghubUploadGuideAction'];
      if (_0x3c7070 === 'close') closeRunningHubMediaUploadGuide();
      if (_0x3c7070 === 'settings') openRunningHubModelApiKeySettings();
      _0x3c7070 === 'open-runninghub' &&
        void openExternalLink(RUNNINGHUB_INVITE_URL, { label: 'RunningHub' })['catch']((_0x517688) => {
          window['showToast']?.(_0x517688?.['message'] || '打开 RunningHub 失败', 'error');
        });
    }),
    document['addEventListener']('keydown', handleGuideKeydown));
}
export function showRunningHubMediaUploadGuide() {
  showRunningHubGuideDialog({
    ariaLabel: 'RunningHub 上传配置',
    headerTitle: '配置 RunningHub 上传',
    title: RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE,
    subtitle: '当前模型需要先把本地视频/音频上传为公网\x20URL，然后再提交给模型\x20API。',
    sectionTitle: '按这几步连接 RunningHub',
    steps: [
      '点击下方按钮打开 RunningHub，并使用推广连接进入。',
      '登录后进入\x20API\x20Key\x20页面，复制可用于上传的\x20API\x20Key。',
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
export function isRunningHubModelApiKeyMissingError(_0x444734) {
  const _0x54b858 = String(_0x444734?.['provider'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x3e3399 = String(_0x444734?.['message'] || _0x444734 || '')['trim']();
  if (_0x54b858 && _0x54b858 !== 'runninghub') return ![];
  if (!/api\s*key/i['test'](_0x3e3399)) return ![];
  if (!/(未配置|not configured|is not configured)/i['test'](_0x3e3399)) return ![];
  return _0x54b858 === 'runninghub' || /runninghub/i['test'](_0x3e3399);
}
export function showRunningHubModelApiKeyMissingToastForError(_0x2b74d3) {
  if (!isRunningHubModelApiKeyMissingError(_0x2b74d3)) return ![];
  return (showRunningHubModelApiKeyMissingToast(), !![]);
}
export function showRunningHubMediaUploadGuideForError(_0x2f36d3) {
  if (!isRunningHubMediaUploadApiKeyMissingError(_0x2f36d3)) return ![];
  return (showRunningHubMediaUploadGuide(), !![]);
}
