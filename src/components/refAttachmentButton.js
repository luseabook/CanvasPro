export const PROMPT_ATTACHMENT_BUTTON_TOOLTIP = '添加参考';
function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
export function createPromptAttachmentButtonHTML(options = {}) {
  const escapeHtmlAttr2 = escapeHtmlAttr(options.tooltip || PROMPT_ATTACHMENT_BUTTON_TOOLTIP),
    item = options.stroke || 'var(--text-primary)',
    key = options.fill || 'var(--white-05)',
    index = options.circleFill || item;
  return (
    '<div class="prompt-attachment-btn" title="' +
    escapeHtmlAttr2 +
    '" aria-label="' +
    escapeHtmlAttr2 +
    '">\n            <span class="btn-icon">\n                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="' +
    item +
    '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">\n                    <path d="M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z" fill="' +
    key +
    '" />\n                    <circle cx="20" cy="20" r="2.5" fill="' +
    index +
    '" />\n                    <path d="M12 12 Q 17 12 19 18" stroke-dasharray="3 3" />\n                </svg>\n            </span>\n        </div>'
  );
}
