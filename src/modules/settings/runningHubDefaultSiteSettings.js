import {
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  applyRunningHubWorkflowDefaultProfileId,
  getRunningHubWorkflowDefaultProfileId,
  normalizeRunningHubModelApiProfileId,
} from '../runningHubProviderProfiles.js';
const DEFAULT_SITE_BUTTON_SELECTOR = '[data-runninghub-default-site]';
export function createRunningHubDefaultSiteSettings({
  root: root = globalThis['document'],
  onSelectionChange: onSelectionChange,
} = {}) {
  const list = Array['from'](root?.['querySelectorAll']?.(DEFAULT_SITE_BUTTON_SELECTOR) || []);
  let runningHubModelApiProfileId = RUNNINGHUB_DOMESTIC_PROFILE_ID,
    value = false;
  const map = new Map(),
    handler = () => {
      list['forEach']((el) => {
        const runningHubModelApiProfileId2 = normalizeRunningHubModelApiProfileId(
            el?.['dataset']?.['runninghubDefaultSite'],
          ),
          item = runningHubModelApiProfileId2 === runningHubModelApiProfileId;
        (el['classList']?.['toggle']('is-active', item),
          el['setAttribute']?.('aria-pressed', item ? 'true' : 'false'));
      });
    },
    setSelectedProfileId = (key) => {
      return (
        (runningHubModelApiProfileId = normalizeRunningHubModelApiProfileId(key)),
        handler(),
        runningHubModelApiProfileId
      );
    },
    bind = () => {
      (list['forEach']((el2) => {
        if (map['has'](el2)) return;
        const index = () => {
          value = true;
          const result = setSelectedProfileId(el2?.['dataset']?.['runninghubDefaultSite']);
          onSelectionChange?.(result);
        };
        (map['set'](el2, index), el2['addEventListener']?.('click', index));
      }),
        handler());
    },
    destroy = () => {
      (map['forEach']((data, el3) => {
        el3['removeEventListener']?.('click', data);
      }),
        map['clear']());
    },
    loadConfig = (options = {}) =>
      value
        ? runningHubModelApiProfileId
        : setSelectedProfileId(getRunningHubWorkflowDefaultProfileId(options)),
    applyToConfig = (options2 = {}) =>
      applyRunningHubWorkflowDefaultProfileId(options2, runningHubModelApiProfileId);
  return {
    bind: bind,
    destroy: destroy,
    loadConfig: loadConfig,
    applyToConfig: applyToConfig,
    getSelectedProfileId: () => runningHubModelApiProfileId,
    setSelectedProfileId: setSelectedProfileId,
  };
}
