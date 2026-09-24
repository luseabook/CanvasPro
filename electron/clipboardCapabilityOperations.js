const MAX_CLIPBOARD_IMAGE_BYTES = 64 * 1024 * 1024;

export function createClipboardCapabilityOperations({
  clipboardApi,
  fileReferencesFormat,
  createClipboardNativeImage,
  normalizeClipboardFileReferences,
  parseClipboardFileReferencesFromText,
} = {}) {
  function readCustomFileReferences() {
    try {
      const buffer = clipboardApi.readBuffer(fileReferencesFormat);
      if (!buffer || buffer.length === 0) return [];
      const parsed = JSON.parse(buffer.toString('utf8'));
      return normalizeClipboardFileReferences(parsed?.files || []);
    } catch {
      return [];
    }
  }
  return {
    writeImage(payload = {}) {
      try {
        const image = createClipboardNativeImage(payload || {});
        if (!image || image.isEmpty()) return { ok: false, reason: 'no-image' };
        const text = String(payload?.text || payload?.absolutePath || payload?.localPath || '').trim();
        if (text) clipboardApi.write({ image, text });
        else clipboardApi.writeImage(image);
        return { ok: true, mimeType: 'image/png' };
      } catch (error) {
        return { ok: false, reason: 'write-failed', error: String(error?.message || error) };
      }
    },
    readImage() {
      try {
        const image = clipboardApi.readImage();
        if (!image || image.isEmpty()) return { ok: false, reason: 'no-image' };
        const png = image.toPNG();
        if (png.length > MAX_CLIPBOARD_IMAGE_BYTES) return { ok: false, reason: 'image-too-large' };
        return { ok: true, mimeType: 'image/png', dataBase64: png.toString('base64') };
      } catch (error) {
        return { ok: false, reason: 'read-failed', error: String(error?.message || error) };
      }
    },
    writeFileReferences(payload = {}) {
      try {
        const files = normalizeClipboardFileReferences(payload?.paths || payload?.files || []);
        if (files.length === 0) return { ok: false, reason: 'no-files', files: [] };
        const paths = files.map((file) => file.path);
        try {
          clipboardApi.writeBuffer(
            fileReferencesFormat,
            Buffer.from(JSON.stringify({ version: 1, files: paths }), 'utf8'),
          );
        } catch {}
        clipboardApi.writeText(paths.join('\n'));
        return { ok: true, files };
      } catch (error) {
        return { ok: false, reason: 'write-failed', error: String(error?.message || error), files: [] };
      }
    },
    readFileReferences() {
      try {
        let files = readCustomFileReferences();
        if (files.length === 0) files = parseClipboardFileReferencesFromText(clipboardApi.readText());
        return { ok: files.length > 0, files };
      } catch (error) {
        return { ok: false, reason: 'read-failed', error: String(error?.message || error), files: [] };
      }
    },
    writeText(payload = {}) {
      try {
        clipboardApi.writeText(String(payload?.text || ''));
        return { ok: true };
      } catch (error) {
        return { ok: false, reason: 'write-failed', error: String(error?.message || error) };
      }
    },
    readText() {
      try {
        return { ok: true, text: clipboardApi.readText() };
      } catch (error) {
        return { ok: false, reason: 'read-failed', error: String(error?.message || error), text: '' };
      }
    },
  };
}
