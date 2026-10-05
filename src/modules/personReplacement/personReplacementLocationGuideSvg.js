import { PERSON_REPLACEMENT_MARKER_COLORS } from './personReplacementPromptMode.js';
const escapeXml = (value) =>
  String(value)
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;');
export function buildPersonReplacementLocationGuideSvg({ frame: frame = {}, people: people = [] } = {}) {
  const width = 1200,
    height = Math['max'](
      1,
      Math['round']((width * (Number(frame['height']) || 9)) / (Number(frame['width']) || 16)),
    ),
    item = [0.25, 0.5, 0.75]
      ['map'](
        (key) =>
          '<path d="M' + width * key + ' 0V' + height + ' M0 ' + height * key + 'H' + width + '"/>',
      )
      ['join'](''),
    index = people['map'](({ label: label, bbox: bbox, markerIndex: markerIndex }, result) => {
      const data = Math['round'](bbox['x'] * width),
        options = Math['round'](bbox['y'] * height),
        target =
          'var(' +
          PERSON_REPLACEMENT_MARKER_COLORS[
            (markerIndex ?? result) % PERSON_REPLACEMENT_MARKER_COLORS['length']
          ] +
          ')';
      return (
        '<g data-person-label="' +
        escapeXml(label) +
        '"><rect x="' +
        data +
        '" y="' +
        options +
        '" width="' +
        Math['round'](bbox['width'] * width) +
        '" height="' +
        Math['round'](bbox['height'] * height) +
        '" rx="10" fill="' +
        target +
        '" fill-opacity="0.12" stroke="' +
        target +
        '" stroke-width="8"/><rect x="' +
        data +
        '" y="' +
        options +
        '" width="72" height="72" rx="8" fill="' +
        target +
        '"/><text x="' +
        (data + 36) +
        '" y="' +
        (options + 55) +
        '" text-anchor="middle" fill="var(--canvas-black)" font-family="Arial, sans-serif" font-size="56" font-weight="800">' +
        escapeXml(label) +
        '</text></g>'
      );
    })['join'](''),
    source =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      width +
      '" height="' +
      height +
      '" viewBox="0 0 ' +
      width +
      ' ' +
      height +
      '"><rect width="100%" height="100%" fill="var(--canvas-black)"/><g stroke="var(--canvas-white)" stroke-opacity="0.18" stroke-width="2">' +
      item +
      '</g>' +
      index +
      '</svg>';
  return {
    dataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(source),
    width: width,
    height: height,
    personCount: people['length'],
  };
}
export function resolvePersonReplacementLocationGuidePreview(list) {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return list;
  const computedStyle = getComputedStyle(document['documentElement']),
    decodeURIComponent2 = decodeURIComponent(list['slice'](list['indexOf'](',') + 1))['replace'](
      /var\((--[a-z0-9-]+)\)/g,
      (next, current) => {
        const enabled = computedStyle['getPropertyValue'](current)['trim']();
        if (!enabled) throw new Error('人物定位图颜色未初始化：' + current);
        return escapeXml(enabled);
      },
    );
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(decodeURIComponent2);
}
