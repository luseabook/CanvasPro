export function createAgentScrollableWheelHandler(el) {
  return (event) => {
    const value = Number(event.deltaY || event.deltaX || 0),
      item =
        Number(event.deltaMode) === 1
          ? 16
          : Number(event.deltaMode) === 2
            ? Math.max(1, Number(el.clientHeight) || 1)
            : 1,
      key = Math.max(0, Number(el.scrollHeight || 0) - Number(el.clientHeight || 0)),
      index = Math.max(0, Number(el.scrollTop || 0)),
      result = Math.min(key, Math.max(0, index + value * item));
    (result !== index && (event.preventDefault?.(), (el.scrollTop = result)),
      event.stopPropagation?.());
  };
}
