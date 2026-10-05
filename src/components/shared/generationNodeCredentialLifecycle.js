import { bindModelCredentialButtonState } from '../../modules/modelCredentialUi.js';
export function bindGenerationNodeCredentialLifecycle(value, item = () => {}) {
  const run = bindModelCredentialButtonState(value?.['btnEl'], {
    syncOnBind: false,
    onRefresh: () => value?.['_updateSubmitButtonState']?.(),
  });
  return () => {
    (run(), value?.['_modelCredentialMenuCleanup']?.());
    if (value) value['_modelCredentialMenuCleanup'] = null;
    item?.();
  };
}
