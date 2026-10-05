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
            '"></label>',
        )
        ['join']('') +
      '</div>\n    <div class="story-source-actions"><button type="button" data-crop-save>保存人物图</button><button type="button" data-crop-close>取消</button></div><span role="status"></span>'),
    (el2['querySelector']('img')['src'] = timeSec['url']),
    card['append'](el2));
  const el3 = el2['querySelector']('.story-source-portrait-image'),
    el4 = el3['querySelector']('img'),
    el5 = el3['querySelector']('span');
  let box = { x: 0, y: 0, width: 1, height: 1 },
    enabled = null,
    value2 = null,
    enabled2 = false,
    enabled3 = false;
  function run() {
    for (const [key, index] of Object['entries'](box)) {
      (el5['style']['setProperty']('--crop-' + key, index * 100 + '%'),
        (el2['querySelector']('[data-crop-value="' + key + '"]')['value'] = String(
          Math['round'](index * 100),
        )));
    }
  }
  function run2() {
    const result = value2;
    ((value2 = null), (enabled = null));
    if (result !== null && el3['hasPointerCapture']?.(result)) el3['releasePointerCapture'](result);
  }
  function destroy() {
    ((enabled2 = true), run2(), el2['remove']());
  }
  (el3['addEventListener']('pointerdown', (x) => {
    if (enabled3 || x['button'] !== 0 || !el4['naturalWidth']) return;
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
      ((box[event['target']['dataset']['cropValue']] = Number(event['target']['value']) / 100), run());
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
        Object['values'](box)['some']((count) => !Number['isFinite'](count) || count < 0) ||
        box['width'] <= 0 ||
        box['height'] <= 0 ||
        box['x'] + box['width'] > 1.000001 ||
        box['y'] + box['height'] > 1.000001
      ) {
        showToast('请在原图范围内框选完整人物。', 'warn');
        return;
      }
      ((enabled3 = true),
        el2['setAttribute']('aria-busy', 'true'),
        (el2['querySelector']('[role=status]')['innerHTML'] =
          renderStoryGenerationSpinner({ button: true }) + '正在保存人物图…'),
        el2['querySelectorAll']('input, [data-crop-save]')['forEach']((el6) => {
          el6['disabled'] = true;
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
        ((enabled3 = false),
          !enabled2 &&
            (el2['setAttribute']('aria-busy', 'false'),
            (el2['querySelector']('[role=status]')['textContent'] = ''),
            el2['querySelectorAll']('input, [data-crop-save]')['forEach']((el7) => {
              el7['disabled'] = false;
            })));
      }
    }),
    run(),
    { destroy: destroy }
  );
}
