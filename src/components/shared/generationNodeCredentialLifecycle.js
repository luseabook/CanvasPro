import { bindModelCredentialButtonState } from '../../modules/modelCredentialUi.js';
export function bindGenerationNodeCredentialLifecycle(_0x3c3003, _0x53140d = () => {}) {
  const _0x268376 = bindModelCredentialButtonState(_0x3c3003?.['btnEl'], {
    syncOnBind: ![],
    onRefresh: () => _0x3c3003?.['_updateSubmitButtonState']?.(),
  });
  return () => {
    (_0x268376(), _0x3c3003?.['_modelCredentialMenuCleanup']?.());
    if (_0x3c3003) _0x3c3003['_modelCredentialMenuCleanup'] = null;
    _0x53140d?.();
  };
}
