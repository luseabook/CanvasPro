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

export function createPromptAttachmentButtonElement(options = {}) {
  const tooltip = options.tooltip || PROMPT_ATTACHMENT_BUTTON_TOOLTIP,
    stroke = options.stroke || 'var(--text-primary)',
    fill = options.fill || 'var(--white-05)',
    circleFill = options.circleFill || stroke,
    el = document.createElement('div'),
    icon = document.createElement('span'),
    createSvgNode = (tagName) =>
      typeof document.createElementNS === 'function'
        ? document.createElementNS('http://www.w3.org/2000/svg', tagName)
        : document.createElement(tagName),
    svg = createSvgNode('svg'),
    path = createSvgNode('path'),
    dot = createSvgNode('circle'),
    dash = createSvgNode('path');
  (el.classList.add('prompt-attachment-btn'), (el.title = tooltip), el.setAttribute('aria-label', tooltip));
  (icon.classList.add('btn-icon'),
    svg.setAttribute('viewBox', '0 0 24 24'),
    svg.setAttribute('width', '28'),
    svg.setAttribute('height', '28'),
    svg.setAttribute('fill', 'none'),
    svg.setAttribute('stroke', stroke),
    svg.setAttribute('stroke-width', '1.5'),
    svg.setAttribute('stroke-linecap', 'round'),
    svg.setAttribute('stroke-linejoin', 'round'));
  (path.setAttribute('d', 'M4 4l7.07 16.97 2.51-7.39 7.39-2.51L4 4z'), path.setAttribute('fill', fill));
  (dot.setAttribute('cx', '20'), dot.setAttribute('cy', '20'), dot.setAttribute('r', '2.5'), dot.setAttribute('fill', circleFill));
  (dash.setAttribute('d', 'M12 12 Q 17 12 19 18'), dash.setAttribute('stroke-dasharray', '3 3'));
  return (svg.appendChild(path), svg.appendChild(dot), svg.appendChild(dash), icon.appendChild(svg), el.appendChild(icon), el);
}
