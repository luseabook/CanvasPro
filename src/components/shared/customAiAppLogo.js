const COMFYUI_LOCAL_WORKFLOW_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"></rect><rect x="14" y="4" width="6" height="6" rx="1.5"></rect><rect x="9" y="14" width="6" height="6" rx="1.5"></rect><path d="M10 7h4"></path><path d="m12 10v4"></path></svg>',
  COMFYUI_CLOUD_WORKFLOW_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 18h9.2a4.3 4.3 0 0 0 .6-8.56A6.1 6.1 0 0 0 5.7 11.2 3.45 3.45 0 0 0 7.5 18Z"></path><path d="M9 15h6"></path><path d="m13 13 2 2-2 2"></path></svg>';
function sanitizeClassList(value = '') {
  return String(value || '')
    ['split'](/\s+/)
    ['filter']((item) => /^[a-zA-Z0-9_-]+$/['test'](item))
    ['join'](' ');
}
function buildLogoClassName(key, index = '') {
  return ['custom-ai-app-logo', key, sanitizeClassList(index)]['filter'](Boolean)['join'](' ');
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
