function isMouseInputType(value, item) {
  return value?.['kind'] === 'mouse' && value?.['type'] === item;
}

function mergePendingInput(event, event2) {
  if (isMouseInputType(event, 'mouseMoved') && isMouseInputType(event2, 'mouseMoved')) return { ...event2 };
  if (isMouseInputType(event, 'mouseWheel') && isMouseInputType(event2, 'mouseWheel'))
    return {
      ...event2,
      deltaX: (Number(event['deltaX']) || 0x0) + (Number(event2['deltaX']) || 0x0),
      deltaY: (Number(event['deltaY']) || 0x0) + (Number(event2['deltaY']) || 0x0),
    };
  return null;
}

export function createWebPreviewRemoteInputQueue({ send: send } = {}) {
  if (typeof send !== 'function') throw new TypeError('Web preview remote input sender is required');
  const list = [];
  let key = ![],
    enabled = ![];
  const run = async () => {
    if (key || enabled) return;
    key = !![];
    try {
      while (!enabled && list['length'] > 0x0) {
        const index = list['shift']();
        try {
          await send(index);
        } catch {}
      }
    } finally {
      key = ![];
      if (!enabled && list['length'] > 0x0) void run();
    }
  };
  return {
    enqueue(args = {}) {
      if (enabled || !args || typeof args !== 'object') return ![];
      const result = { ...args },
        count = list['length'] - 0x1,
        data = count >= 0x0 ? mergePendingInput(list[count], result) : null;
      if (data) list[count] = data;
      else list['push'](result);
      return (void run(), !![]);
    },
    dispose() {
      ((enabled = !![]), (list['length'] = 0x0));
    },
  };
}

export const __webPreviewRemoteInputQueueForTest = { mergePendingInput: mergePendingInput };
