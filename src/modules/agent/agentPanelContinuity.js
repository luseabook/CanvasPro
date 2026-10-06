export function createAgentPanelContinuity({
  getConversation: getConversation,
  getHistory: getHistory,
  getMessageCount: getMessageCount,
}) {
  let epoch = 0,
    enabled = false,
    value = null;
  function identity() {
    const item = getConversation?.();
    return JSON.stringify([item?.projectId || '', item?.id || '']);
  }
  function capture() {
    return { identity: identity(), epoch: epoch };
  }
  function isCurrent(key) {
    return !enabled && key?.epoch === epoch && key.identity === identity();
  }
  function invalidate() {
    ((epoch += 1), (value = null));
  }
  return {
    capture: capture,
    isCurrent: isCurrent,
    invalidate: invalidate,
    rememberClosed() {
      value = { identity: identity(), history: JSON.stringify(getHistory()), count: getMessageCount() };
    },
    isSameConversation: () => value?.identity === identity(),
    canResume() {
      return (
        !enabled &&
        value?.identity === identity() &&
        value.history === JSON.stringify(getHistory()) &&
        value.count === getMessageCount()
      );
    },
    destroy() {
      ((enabled = true), invalidate());
    },
  };
}
