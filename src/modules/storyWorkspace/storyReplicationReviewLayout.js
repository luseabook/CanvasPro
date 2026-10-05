import { beginWorkspaceHorizontalResizeSession } from '../workspaceResizeSession.js';
export function bindStoryReplicationReviewLayout(el, box) {
  const layout = el['querySelector']('.story-source-review-layout');
  let signal = null;
  function run(value, item) {
    const key = value === 'left' ? 12 : box['left'] + 20,
      index = value === 'left' ? Math['min'](38, box['right'] - 20) : 75;
    ((box[value] = Math['max'](key, Math['min'](index, item))),
      layout['style']['setProperty']('--review-left', box['left'] + 'fr'),
      layout['style']['setProperty']('--review-middle', box['right'] - box['left'] + 'fr'),
      layout['style']['setProperty']('--review-right', 100 - box['right'] + 'fr'),
      layout['querySelectorAll']('[data-review-splitter]')['forEach']((el2) => {
        const result = el2['dataset']['reviewSplitter'] === 'left';
        (el2['setAttribute']('aria-valuenow', Math['round'](box[el2['dataset']['reviewSplitter']])),
          el2['setAttribute']('aria-valuemin', result ? 12 : box['left'] + 20),
          el2['setAttribute']('aria-valuemax', result ? Math['min'](38, box['right'] - 20) : 75));
      }));
  }
  function run2(event) {
    const splitter = event['target']['closest']('[data-review-splitter]');
    if (!splitter) return;
    (signal?.['abort'](),
      (signal = new AbortController()),
      beginWorkspaceHorizontalResizeSession({
        event: event,
        splitter: splitter,
        layout: layout,
        signal: signal['signal'],
        onRatio: (data) => run(splitter['dataset']['reviewSplitter'], data),
      }));
  }
  function run3(event2) {
    const el3 = event2['target']['closest']('[data-review-splitter]');
    el3 &&
      ['ArrowLeft', 'ArrowRight']['includes'](event2['key']) &&
      (event2['preventDefault'](),
      event2['stopPropagation'](),
      run(
        el3['dataset']['reviewSplitter'],
        box[el3['dataset']['reviewSplitter']] + (event2['key'] === 'ArrowLeft' ? -2 : 2),
      ));
    const args = event2['target']['closest']('.story-source-tabs [data-replication-tab]');
    if (!args || !['ArrowLeft', 'ArrowRight', 'Home', 'End']['includes'](event2['key'])) return;
    (event2['preventDefault'](), event2['stopPropagation']());
    const list = [...args['parentElement']['querySelectorAll']('button')],
      options =
        event2['key'] === 'Home'
          ? 0
          : event2['key'] === 'End'
            ? list['length'] - 1
            : (list['indexOf'](args) + (event2['key'] === 'ArrowLeft' ? -1 : 1) + list['length']) %
              list['length'];
    (list[options]['focus']({ preventScroll: true }), list[options]['click']());
  }
  return (
    run('left', box['left']),
    el['addEventListener']('pointerdown', run2),
    el['addEventListener']('keydown', run3),
    {
      destroy() {
        (signal?.['abort'](),
          el['removeEventListener']('pointerdown', run2),
          el['removeEventListener']('keydown', run3));
      },
    }
  );
}
