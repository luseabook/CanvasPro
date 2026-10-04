export function createToolbarIconButton({
  action: action,
  tooltip: tooltip,
  label: label,
  iconSvg: iconSvg,
  extraClass: extraClass = '',
}) {
  const value = ['ftb-btn', 'icon-only', extraClass, 'act-' + action].filter(Boolean).join(' ');
  return (
    '<button class="' +
    value +
    '" data-tooltip="' +
    tooltip +
    '" aria-label="' +
    label +
    '">' +
    iconSvg +
    '</button>'
  );
}
export function createToolbarDivider() {
  return '<div class="ftb-divider"></div>';
}
export function createToolbarHtml({ toolbarClass: toolbarClass, items: items }) {
  return '<div class="node-floating-toolbar ' + toolbarClass + '">\n    ' + items.join('\n    ') + '\n</div>';
}
