import { AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT, validateAgentDocumentFile } from './agentDocumentInput.js';
function createHiddenFileInput(documentObject, className, accept, multiple = false) {
  const input = documentObject.createElement('input');
  return (
    (input.className = className),
    (input.type = 'file'),
    (input.accept = accept),
    (input.multiple = multiple),
    (input.hidden = true),
    input
  );
}
function documentKey(file = {}) {
  return [file.name, file.size, file.lastModified].map((part) => String(part || '')).join(':');
}
export function createAgentComposerAttachmentController({
  documentObject: documentObject,
  uploadMaterial: uploadMaterial,
  validateDocumentFile: validateDocumentFile,
  normalizeMaterialNode: normalizeMaterialNode,
  addInputRefs: addInputRefs,
  setBusy: setBusy,
  getBusy: getBusy = () => false,
  captureContext: captureContext = () => null,
  isContextCurrent: isContextCurrent = () => true,
  setNotice: setNotice,
  text: text,
  formatText: formatText,
  focusInput: focusInput,
  onDocumentChange: onDocumentChange,
} = {}) {
  const materialInput = createHiddenFileInput(
      documentObject,
      'agent-upload-input',
      'image/*,video/*,audio/*',
    ),
    documentInput = createHiddenFileInput(documentObject, 'agent-document-input', '.txt,.docx,.pdf', true);
  let documentSeq = 0,
    documents = [];
  function getDocumentDisplayRefs() {
    return documents.map(({ id: id, file: file }) => ({
      id: id,
      nodeId: id,
      type: 'external-document',
      kind: 'document',
      name: String(file?.name || 'document'),
      label: String(file?.name || 'document'),
      source: 'document-upload',
    }));
  }
  function clearDocuments({ notify: notify = true } = {}) {
    documents = [];
    if (notify) onDocumentChange?.();
  }
  function consumeDocuments() {
    const snapshot = {
      files: documents.map((entry) => entry.file),
      displayRefs: getDocumentDisplayRefs(),
    };
    return ((documents = []), snapshot);
  }
  function removeDocument(id) {
    const remaining = documents.filter((entry) => entry.id !== String(id || ''));
    if (remaining.length === documents.length) return false;
    return ((documents = remaining), onDocumentChange?.(), true);
  }
  function attachDocuments(files = []) {
    const knownKeys = new Set(documents.map((entry) => documentKey(entry.file)));
    let addedCount = 0;
    for (const file of Array.from(files || [])) {
      const validation = validateAgentDocumentFile(file, validateDocumentFile);
      if (!validation.ok) {
        setNotice?.(validation.error);
        continue;
      }
      const key = documentKey(file);
      if (knownKeys.has(key)) continue;
      if (documents.length >= AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT) {
        setNotice?.(
          formatText?.('documentLimit', { count: AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT }) ||
            text?.('documentLimit'),
        );
        break;
      }
      ((documentSeq += 1),
        documents.push({ id: 'agent-document-' + documentSeq, file: file }),
        knownKeys.add(key),
        (addedCount += 1));
    }
    return (
      addedCount > 0 &&
        (onDocumentChange?.(),
        setNotice?.(formatText?.('documentAttached', { count: addedCount }) || text?.('documentAttached')),
        focusInput?.()),
      addedCount
    );
  }
  async function uploadMaterialFile(file) {
    if (!file || getBusy()) return;
    const context = captureContext();
    if (typeof uploadMaterial !== 'function') {
      setNotice?.(text?.('uploadMaterialMissing'));
      return;
    }
    setBusy?.(true);
    try {
      const uploaded = await uploadMaterial(file);
      if (!isContextCurrent(context)) return;
      const uploadedList = Array.isArray(uploaded) ? uploaded : [uploaded],
        nodes = uploadedList.map(normalizeMaterialNode).filter(Boolean);
      if (nodes.length === 0) {
        setNotice?.(text?.('uploadMaterialFailed'));
        return;
      }
      (addInputRefs?.(nodes), setNotice?.(text?.('uploadMaterialReady')), focusInput?.());
    } catch (error) {
      if (isContextCurrent(context)) setNotice?.(error?.message || text?.('uploadMaterialFailed'));
    } finally {
      if (isContextCurrent(context)) setBusy?.(false);
    }
  }
  return (
    materialInput.addEventListener('change', () => {
      (uploadMaterialFile(materialInput.files?.[0]), (materialInput.value = ''));
    }),
    documentInput.addEventListener('change', () => {
      (attachDocuments(documentInput.files), (documentInput.value = ''));
    }),
    {
      materialInput: materialInput,
      documentInput: documentInput,
      getDocumentDisplayRefs: getDocumentDisplayRefs,
      consumeDocuments: consumeDocuments,
      clearDocuments: clearDocuments,
      removeDocument: removeDocument,
      openMaterialPicker() {
        ((materialInput.value = ''), materialInput.click?.(), setNotice?.(text?.('uploadMaterial')));
      },
      openDocumentPicker() {
        ((documentInput.value = ''), documentInput.click?.(), setNotice?.(text?.('readDocument')));
      },
      uploadMaterialFile: uploadMaterialFile,
    }
  );
}
