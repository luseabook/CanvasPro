import { normalizedMediaDragRect } from '../../core/math.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
export function createStoryReplicationPortraitEditor({
  card: card,
  character: character,
  capture: capture,
  isActive: isActive,
  onSaved: onSaved,
  showToast: showToast,
}) {
  if (!character['frame']?.['url'])
    return (showToast('请先保存该人物的代表画面，再裁剪人物图。', 'warn'), null);
  const timeSec = character['frame'],
    handler = () => isActive() && character['frame'] === timeSec,
    el = card['ownerDocument'],
    el2 = el['createElement']('section');
  ((el2['className'] = 'story-source-portrait-editor'),
    (el2['innerHTML'] =
      '<strong>拖动框选人物，或输入裁剪百分比</strong><div class="story-source-portrait-image"><img draggable="false" alt="框选原片人物"><span class="story-source-portrait-rect"></span></div>\n    <div class="story-source-portrait-values">' +
      [
        ['x', '左侧'],
        ['y', '顶部'],
        ['width', '宽度'],
        ['height', '高度'],
      ]
        ['map'](
          ([value, item]) =>
            '<label>' +
            item +
            '%<input type="number" min="0" max="100" step="1" data-crop-value="' +
            value +
            '\x22></label>',
        )
        ['join']('') +
      '</div>\x0a\x20\x20\x20\x20<div\x20class=\x22story-source-actions\x22><button\x20type=\x22button\x22\x20data-crop-save>保存人物图</button><button\x20type=\x22button\x22\x20data-crop-close>取消</button></div><span\x20role=\x22status\x22></span>'),
    (el2['querySelector']('img')['src'] = timeSec['url']),
    card['append'](el2));
  const el3 = el2['querySelector']('.story-source-portrait-image'),
    el4 = el3['querySelector']('img'),
    el5 = el3['querySelector']('span');
  let box = { x: 0x0, y: 0x0, width: 0x1, height: 0x1 },
    enabled = null,
    value2 = null,
    enabled2 = ![],
    enabled3 = ![];
  function run() {
    for (const [key, index] of Object['entries'](box)) {
      (el5['style']['setProperty']('--crop-' + key, index * 0x64 + '%'),
        (el2['querySelector']('[data-crop-value=\x22' + key + '\x22]')['value'] = String(
          Math['round'](index * 0x64),
        )));
    }
  }
  function run2() {
    const result = value2;
    ((value2 = null), (enabled = null));
    if (result !== null && el3['hasPointerCapture']?.(result)) el3['releasePointerCapture'](result);
  }
  function destroy() {
    ((enabled2 = !![]), run2(), el2['remove']());
  }
  (el3['addEventListener']('pointerdown', (x) => {
    if (enabled3 || x['button'] !== 0x0 || !el4['naturalWidth']) return;
    ((enabled = { x: x['clientX'], y: x['clientY'] }),
      (value2 = x['pointerId']),
      el3['setPointerCapture'](x['pointerId']),
      x['preventDefault']());
  }),
    el3['addEventListener']('pointermove', (x2) => {
      if (!enabled || enabled3) return;
      ((box = normalizedMediaDragRect(el4['getBoundingClientRect'](), enabled, {
        x: x2['clientX'],
        y: x2['clientY'],
      })),
        run());
    }));
  for (const data of ['pointerup', 'pointercancel', 'lostpointercapture'])
    el3['addEventListener'](data, run2);
  return (
    el2['addEventListener']('input', (event) => {
      if (enabled3 || !event['target']['dataset']['cropValue']) return;
      ((box[event['target']['dataset']['cropValue']] = Number(event['target']['value']) / 0x64), run());
    }),
    el2['addEventListener']('click', async (event2) => {
      if (event2['target']['closest']('[data-crop-close]')) {
        destroy();
        return;
      }
      if (!event2['target']['closest']('[data-crop-save]') || enabled3 || enabled2) return;
      if (!handler()) {
        (showToast('代表画面已变化，请重新打开人物裁剪。', 'warn'), destroy());
        return;
      }
      if (
        Object['values'](box)['some']((count) => !Number['isFinite'](count) || count < 0x0) ||
        box['width'] <= 0x0 ||
        box['height'] <= 0x0 ||
        box['x'] + box['width'] > 1.000001 ||
        box['y'] + box['height'] > 1.000001
      ) {
        showToast('请在原图范围内框选完整人物。', 'warn');
        return;
      }
      ((enabled3 = !![]),
        el2['setAttribute']('aria-busy', 'true'),
        (el2['querySelector']('[role=status]')['innerHTML'] =
          renderStoryGenerationSpinner({ button: !![] }) + '正在保存人物图…'),
        el2['querySelectorAll']('input, [data-crop-save]')['forEach']((el6) => {
          el6['disabled'] = !![];
        }));
      try {
        const options = await capture({
          crop: { ...box },
          timeSec: timeSec['timeSec'] ?? character['representativeTimeSec'],
          isActive: () => !enabled2 && handler(),
        });
        options && !enabled2 && handler() && ((character['portrait'] = options), onSaved(), destroy());
      } catch (error) {
        if (!enabled2) showToast(error?.['message'] || '人物图保存失败。', 'error');
      } finally {
        ((enabled3 = ![]),
          !enabled2 &&
            (el2['setAttribute']('aria-busy', 'false'),
            (el2['querySelector']('[role=status]')['textContent'] = ''),
            el2['querySelectorAll']('input, [data-crop-save]')['forEach']((el7) => {
              el7['disabled'] = ![];
            })));
      }
    }),
    run(),
    { destroy: destroy }
  );
}
