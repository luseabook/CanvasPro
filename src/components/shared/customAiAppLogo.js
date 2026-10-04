const COMFYUI_LOCAL_WORKFLOW_SVG =
    '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20aria-hidden=\x22true\x22><rect\x20x=\x224\x22\x20y=\x224\x22\x20width=\x226\x22\x20height=\x226\x22\x20rx=\x221.5\x22></rect><rect\x20x=\x2214\x22\x20y=\x224\x22\x20width=\x226\x22\x20height=\x226\x22\x20rx=\x221.5\x22></rect><rect\x20x=\x229\x22\x20y=\x2214\x22\x20width=\x226\x22\x20height=\x226\x22\x20rx=\x221.5\x22></rect><path\x20d=\x22M10\x207h4\x22></path><path\x20d=\x22m12\x2010v4\x22></path></svg>',
  COMFYUI_CLOUD_WORKFLOW_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 18h9.2a4.3 4.3 0 0 0 .6-8.56A6.1 6.1 0 0 0 5.7 11.2 3.45 3.45 0 0 0 7.5 18Z"></path><path d="M9 15h6"></path><path d="m13 13 2 2-2 2"></path></svg>';
function sanitizeClassList(value = '') {
  return String(value || '')
    ['split'](/\s+/)
    ['filter']((item) => /^[a-zA-Z0-9_-]+$/['test'](item))
    ['join']('\x20');
}
function buildLogoClassName(key, index = '') {
  return ['custom-ai-app-logo', key, sanitizeClassList(index)]['filter'](Boolean)['join']('\x20');
}
export function renderRunningHubAiAppLogoHtml({ className: className = '' } = {}) {
  return (
    '<span class="' +
    buildLogoClassName('custom-ai-app-logo--runninghub', className) +
    '" aria-hidden="true">RH</span>'
  );
}
export function renderComfyUiLocalWorkflowLogoHtml({ className: className = '' } = {}) {
  return (
    '<span class="' +
    buildLogoClassName('custom-ai-app-logo--comfyui-local', className) +
    '" aria-hidden="true">' +
    COMFYUI_LOCAL_WORKFLOW_SVG +
    '</span>'
  );
}
export function renderComfyUiCloudWorkflowLogoHtml({ className: className = '' } = {}) {
  return (
    '<span class="' +
    buildLogoClassName('custom-ai-app-logo--comfyui-cloud', className) +
    '" aria-hidden="true">' +
    COMFYUI_CLOUD_WORKFLOW_SVG +
    '</span>'
  );
}
export function renderComfyUiGenericWorkflowLogoHtml({ className: className = '' } = {}) {
  return (
    '<span class="' +
    buildLogoClassName('custom-ai-app-logo--comfyui-generic', className) +
    '" aria-hidden="true">C</span>'
  );
}
export function renderComfyUiWorkflowLogoHtmlFromIconKind(result = '', data = {}) {
  const options = String(result || '')['trim']();
  if (options === 'comfyUiCloudWorkflowBadge') return renderComfyUiCloudWorkflowLogoHtml(data);
  if (options === 'comfyUiLocalWorkflowBadge') return renderComfyUiLocalWorkflowLogoHtml(data);
  return renderComfyUiGenericWorkflowLogoHtml(data);
}
