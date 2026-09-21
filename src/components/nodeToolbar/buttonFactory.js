export function createToolbarIconButton({
  action: _0x38663c,
  tooltip: _0x1b8d2f,
  label: _0x5ff27b,
  iconSvg: _0x126096,
  extraClass: extraClass = '',
}) {
  const _0x52c639 = ['ftb-btn', 'icon-only', extraClass, 'act-' + _0x38663c].filter(Boolean).join(' ');
  return (
    '<button class="' +
    _0x52c639 +
    '" data-tooltip="' +
    _0x1b8d2f +
    '" aria-label="' +
    _0x5ff27b +
    '">' +
    _0x126096 +
    '</button>'
  );
}
export function createToolbarDivider() {
  return '<div class="ftb-divider"></div>';
}
export function createToolbarHtml({ toolbarClass: _0x12e274, items: _0x41cab2 }) {
  return (
    '<div class="node-floating-toolbar ' + _0x12e274 + '">\n    ' + _0x41cab2.join('\n    ') + '\n</div>'
  );
}
