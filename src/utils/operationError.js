export function getOperationErrorDetail(value, depth = 0) {
  if (depth > 4 || value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value !== "object") return "";

  for (const key of ["error", "message", "errorMessage", "detail", "reason"]) {
    const detail = getOperationErrorDetail(value[key], depth + 1);
    if (detail) return detail;
  }
  return "";
}

export function createOperationError(message, cause, fallback = "") {
  const error = new Error(
    `${message}：${getOperationErrorDetail(cause) || fallback}`,
    {
      cause,
    },
  );
  for (const key of ["type", "code", "status", "provider", "retryable"]) {
    if (cause?.[key] !== undefined) error[key] = cause[key];
  }
  return error;
}
