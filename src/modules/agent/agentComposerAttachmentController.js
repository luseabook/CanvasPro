import { AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT, validateAgentDocumentFile } from './agentDocumentInput.js';
function createHiddenFileInput(_0x128fb6, _0x25766d, _0x505bf2, _0x2c5108 = ![]) {
  const _0x1572f4 = _0x128fb6['createElement']('input');
  return (
    (_0x1572f4['className'] = _0x25766d),
    (_0x1572f4['type'] = 'file'),
    (_0x1572f4['accept'] = _0x505bf2),
    (_0x1572f4['multiple'] = _0x2c5108),
    (_0x1572f4['hidden'] = !![]),
    _0x1572f4
  );
}
function documentKey(_0x1eceb9 = {}) {
  return [_0x1eceb9['name'], _0x1eceb9['size'], _0x1eceb9['lastModified']]
    ['map']((_0x4d51a8) => String(_0x4d51a8 || ''))
    ['join'](':');
}
export function createAgentComposerAttachmentController({
  documentObject: _0xa31ae,
  uploadMaterial: _0x513e22,
  validateDocumentFile: _0x2a4917,
  normalizeMaterialNode: _0x595259,
  addInputRefs: _0x1a5dcc,
  setBusy: _0x54a691,
  getBusy: getBusy = () => ![],
  captureContext: captureContext = () => null,
  isContextCurrent: isContextCurrent = () => !![],
  setNotice: _0x1dfc98,
  text: _0xeecbee,
  formatText: _0x46a362,
  focusInput: _0x27ccaf,
  onDocumentChange: _0x422520,
} = {}) {
  const _0x3c2ccc = createHiddenFileInput(_0xa31ae, 'agent-upload-input', 'image/*,video/*,audio/*'),
    _0x28bf24 = createHiddenFileInput(_0xa31ae, 'agent-document-input', '.txt,.docx,.pdf', !![]);
  let _0x1cb324 = 0x0,
    _0x9d0b37 = [];
  function _0x4939ac() {
    return _0x9d0b37['map'](({ id: _0x5751e2, file: _0x336e38 }) => ({
      id: _0x5751e2,
      nodeId: _0x5751e2,
      type: 'external-document',
      kind: 'document',
      name: String(_0x336e38?.['name'] || 'document'),
      label: String(_0x336e38?.['name'] || 'document'),
      source: 'document-upload',
    }));
  }
  function _0x4095e9({ notify: notify = !![] } = {}) {
    _0x9d0b37 = [];
    if (notify) _0x422520?.();
  }
  function _0x224393() {
    const _0x1cd098 = { files: _0x9d0b37['map']((_0x3661bc) => _0x3661bc['file']), displayRefs: _0x4939ac() };
    return ((_0x9d0b37 = []), _0x1cd098);
  }
  function _0x1219a7(_0x9b457a) {
    const _0x5cf14d = _0x9d0b37['filter']((_0x3ae32a) => _0x3ae32a['id'] !== String(_0x9b457a || ''));
    if (_0x5cf14d['length'] === _0x9d0b37['length']) return ![];
    return ((_0x9d0b37 = _0x5cf14d), _0x422520?.(), !![]);
  }
  function _0x540e61(_0x211591 = []) {
    const _0x4b9326 = new Set(_0x9d0b37['map']((_0x7b023) => documentKey(_0x7b023['file'])));
    let _0x68e3fa = 0x0;
    for (const _0x218c10 of Array['from'](_0x211591 || [])) {
      const _0x57c0e2 = validateAgentDocumentFile(_0x218c10, _0x2a4917);
      if (!_0x57c0e2['ok']) {
        _0x1dfc98?.(_0x57c0e2['error']);
        continue;
      }
      const _0x243079 = documentKey(_0x218c10);
      if (_0x4b9326['has'](_0x243079)) continue;
      if (_0x9d0b37['length'] >= AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT) {
        _0x1dfc98?.(
          _0x46a362?.('documentLimit', { count: AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT }) ||
            _0xeecbee?.('documentLimit'),
        );
        break;
      }
      ((_0x1cb324 += 0x1),
        _0x9d0b37['push']({ id: 'agent-document-' + _0x1cb324, file: _0x218c10 }),
        _0x4b9326['add'](_0x243079),
        (_0x68e3fa += 0x1));
    }
    return (
      _0x68e3fa > 0x0 &&
        (_0x422520?.(),
        _0x1dfc98?.(_0x46a362?.('documentAttached', { count: _0x68e3fa }) || _0xeecbee?.('documentAttached')),
        _0x27ccaf?.()),
      _0x68e3fa
    );
  }
  async function _0x1c40b9(_0x1f71f4) {
    if (!_0x1f71f4 || getBusy()) return;
    const _0xe485e4 = captureContext();
    if (typeof _0x513e22 !== 'function') {
      _0x1dfc98?.(_0xeecbee?.('uploadMaterialMissing'));
      return;
    }
    _0x54a691?.(!![]);
    try {
      const _0x457bb9 = await _0x513e22(_0x1f71f4);
      if (!isContextCurrent(_0xe485e4)) return;
      const _0x31b97e = Array['isArray'](_0x457bb9) ? _0x457bb9 : [_0x457bb9],
        _0x2d232c = _0x31b97e['map'](_0x595259)['filter'](Boolean);
      if (_0x2d232c['length'] === 0x0) {
        _0x1dfc98?.(_0xeecbee?.('uploadMaterialFailed'));
        return;
      }
      (_0x1a5dcc?.(_0x2d232c), _0x1dfc98?.(_0xeecbee?.('uploadMaterialReady')), _0x27ccaf?.());
    } catch (_0x55c3eb) {
      if (isContextCurrent(_0xe485e4))
        _0x1dfc98?.(_0x55c3eb?.['message'] || _0xeecbee?.('uploadMaterialFailed'));
    } finally {
      if (isContextCurrent(_0xe485e4)) _0x54a691?.(![]);
    }
  }
  return (
    _0x3c2ccc['addEventListener']('change', () => {
      (_0x1c40b9(_0x3c2ccc['files']?.[0x0]), (_0x3c2ccc['value'] = ''));
    }),
    _0x28bf24['addEventListener']('change', () => {
      (_0x540e61(_0x28bf24['files']), (_0x28bf24['value'] = ''));
    }),
    {
      materialInput: _0x3c2ccc,
      documentInput: _0x28bf24,
      getDocumentDisplayRefs: _0x4939ac,
      consumeDocuments: _0x224393,
      clearDocuments: _0x4095e9,
      removeDocument: _0x1219a7,
      openMaterialPicker() {
        ((_0x3c2ccc['value'] = ''), _0x3c2ccc['click']?.(), _0x1dfc98?.(_0xeecbee?.('uploadMaterial')));
      },
      openDocumentPicker() {
        ((_0x28bf24['value'] = ''), _0x28bf24['click']?.(), _0x1dfc98?.(_0xeecbee?.('readDocument')));
      },
      uploadMaterialFile: _0x1c40b9,
    }
  );
}
