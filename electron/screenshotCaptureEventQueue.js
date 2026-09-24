export const DEFAULT_CAPTURE_EVENT_LIMIT = 8;

export function createBoundedCaptureEventQueue(limit = DEFAULT_CAPTURE_EVENT_LIMIT) {
  const requested = Number(limit),
    maximum =
      Number.isFinite(requested) && requested > 0
        ? Math.floor(requested)
        : DEFAULT_CAPTURE_EVENT_LIMIT,
    events = [];
  return {
    limit: maximum,
    size() {
      return events.length;
    },
    push(event) {
      events.push(event);
      while (events.length > maximum) events.shift();
      return events.length;
    },
    consume() {
      return events.splice(0, events.length);
    },
  };
}
