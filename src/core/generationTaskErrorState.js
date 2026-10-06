export function isGenerationAbortError(error) {
  if (!error) return false;
  if (error?.name === 'AbortError') return true;
  return String(error?.message || '').trim() === 'CANCELLED';
}
export function getGenerationErrorMessage(error2, value = '') {
  const item = typeof error2 === 'string' || typeof error2 === 'number' ? error2 : error2?.message,
    key = String(item || '').trim();
  if (key) return key;
  return String(value || '').trim();
}
