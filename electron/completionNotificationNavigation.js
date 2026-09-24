const PENDING_LIMIT = 40;
const CLICK_EVENT_LIMIT = 40;

export function createCompletionNotificationNavigation({
  focusMainWindow: focusMainWindow,
  onClick: onClick,
  logEvent: logEvent,
} = {}) {
  const pending = [];
  const clickEvents = [];
  let sequence = 0;

  function settle(entry) {
    const index = pending.indexOf(entry);
    if (index >= 0) pending.splice(index, 1);
    entry.handled = true;
    entry.release?.(true);
  }

  function activate(entry) {
    if (!entry || entry.handled) return false;
    const release = entry.release;
    entry.release = null;
    settle(entry);
    const { navigation } = entry;
    logEvent?.({
      type: 'notification.generation_complete_clicked',
      source: 'main',
      message: 'Generation completion notification clicked',
      context: { navigation: navigation },
    });
    const logFocusFailed = (error) =>
      logEvent?.({
        type: 'notification.generation_complete_focus_failed',
        level: 'warn',
        source: 'main',
        message: 'Could not focus completion window',
        error: String(error?.message || error),
      });
    try {
      Promise.resolve(focusMainWindow?.()).then((focused) => {
        if (focused === false) logFocusFailed('Window activation returned false');
      }, logFocusFailed);
    } catch (error) {
      logFocusFailed(error);
    }
    release?.(true);
    if (navigation) {
      const event = {
        ...navigation,
        eventId: 'completion-' + Date.now() + '-' + ++sequence,
        createdAt: Date.now(),
      };
      clickEvents.push(event);
      while (clickEvents.length > CLICK_EVENT_LIMIT) clickEvents.shift();
      onClick?.(event);
    }
    return true;
  }

  return {
    remember(navigation, notificationId) {
      const entry = { navigation: navigation, notificationId: notificationId, handled: false, release: null };
      if (navigation) {
        pending.push(entry);
        while (pending.length > PENDING_LIMIT) settle(pending[0]);
      }
      return entry;
    },
    activate: activate,
    activateLatest: () => activate(pending.at(-1)),
    acknowledge({ notificationId: notificationId } = {}) {
      if (typeof notificationId !== 'string' || !notificationId) return { success: false };
      for (const entry of [...pending]) {
        if (entry.notificationId === notificationId) settle(entry);
      }
      return { success: true };
    },
    consumeClickEvents: () => clickEvents.splice(0),
    dispose() {
      for (const entry of [...pending]) settle(entry);
      clickEvents.length = 0;
    },
  };
}
