export function createAgentScrollableWheelHandler(el) {
  return (event) => {
    const value = Number(event['deltaY'] || event['deltaX'] || 0x0),
      item =
        Number(event['deltaMode']) === 0x1
          ? 0x10
          : Number(event['deltaMode']) === 0x2
            ? Math['max'](0x1, Number(el['clientHeight']) || 0x1)
            : 0x1,
      key = Math['max'](0x0, Number(el['scrollHeight'] || 0x0) - Number(el['clientHeight'] || 0x0)),
      index = Math['max'](0x0, Number(el['scrollTop'] || 0x0)),
      result = Math['min'](key, Math['max'](0x0, index + value * item));
    (result !== index && (event['preventDefault']?.(), (el['scrollTop'] = result)),
      event['stopPropagation']?.());
  };
}
