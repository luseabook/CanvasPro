export const PROMPT_ATTACHMENT_BUTTON_TOOLTIP = '添加参考';
function escapeHtmlAttr(_0x55ddbe) {
  return String(_0x55ddbe)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
export function createPromptAttachmentButtonHTML(_0x39224b = {}) {
  const _0x47f2af = escapeHtmlAttr(_0x39224b.tooltip || PROMPT_ATTACHMENT_BUTTON_TOOLTIP),
    _0x2753a6 = _0x39224b.stroke || 'var(--text-primary)',
    _0x4d481c = _0x39224b.fill || 'var(--white-05)',
    _0x257693 = _0x39224b.circleFill || _0x2753a6;
  return (
    '<div class="prompt-attachment-btn" title="' +
    _0x47f2af +
    '" aria-label="' +
    _0x47f2af +
    '">\n            <span class="btn-icon">\n                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' +
    _0x2753a6 +
    '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">\n                    <path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="' +
    _0x4d481c +
    '" />\n                    <circle cx="20" cy="20" r="2.5" fill="' +
    _0x257693 +
    '" />\n                    <path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" />\n                </svg>\n            </span>\n        </div>'
  );
}
