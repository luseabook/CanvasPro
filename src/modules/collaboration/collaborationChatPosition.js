const MIN_WIDTH = 360,
  MIN_HEIGHT = 420;
export function bindCollaborationChatPosition({
  root: root,
  handles: handles,
  resizeHandle: resizeHandle,
  storage: storage = globalThis['localStorage'],
  windowObject: windowObject = window,
}) {
  let box = null,
    x = null,
    enabled = ![],
    box2 = null;
  const value = resizeHandle ? [...handles, resizeHandle] : handles;
  try {
    const box3 = JSON['parse'](storage?.['getItem']('collaboration-chat-position'));
    if (Number['isFinite'](box3?.['x']) && Number['isFinite'](box3?.['y'])) box = box3;
  } catch {}
  try {
    const box4 = JSON['parse'](storage?.['getItem']('collaboration-chat-size'));
    if (
      Number['isFinite'](box4?.['width']) &&
      Number['isFinite'](box4?.['height']) &&
      box4['width'] > 0 &&
      box4['height'] > 0
    )
      box2 = {
        width: Math['max'](MIN_WIDTH, box4['width']),
        height: Math['max'](MIN_HEIGHT, box4['height']),
      };
  } catch {}
  function place() {
    if (root['hidden']) return;
    box2 &&
      (root['style']['setProperty']('--chat-width', box2['width'] + 'px'),
      root['style']['setProperty']('--chat-height', box2['height'] + 'px'));
    if (!box) {
      const box5 = document['querySelector']('.sidebar-floating')?.['getBoundingClientRect']();
      box = {
        x: (box5?.['right'] || 64) + 12,
        y: Math['max'](72, box5?.['top'] || 120),
      };
    }
    const box6 = root['getBoundingClientRect']();
    ((box = {
      x: Math['max'](8, Math['min'](box['x'], windowObject['innerWidth'] - box6['width'] - 8)),
      y: Math['max'](8, Math['min'](box['y'], windowObject['innerHeight'] - box6['height'] - 8)),
    }),
      root['style']['setProperty']('--chat-left', box['x'] + 'px'),
      root['style']['setProperty']('--chat-top', box['y'] + 'px'));
  }
  function run(id) {
    if (
      id['button'] !== 0 ||
      (id['target']['closest']('button') && id['currentTarget'] !== id['target']['closest']('button'))
    )
      return;
    (root['getAnimations']()['forEach']((item) => item['finish']()), place(), (enabled = ![]));
    const width = root['getBoundingClientRect']();
    ((x = {
      id: id['pointerId'],
      x: id['clientX'],
      y: id['clientY'],
      origin: { ...box },
      handle: id['currentTarget'],
      resizing: id['currentTarget'] === resizeHandle,
      width: width['width'],
      height: width['height'],
    }),
      root['classList']['toggle']('is-resizing', x['resizing']),
      x['handle']['setPointerCapture'](id['pointerId']),
      id['preventDefault']());
  }
  function run2(event) {
    if (!x || x['id'] !== event['pointerId']) return;
    const key = event['clientX'] - x['x'],
      index = event['clientY'] - x['y'];
    enabled ||= Math['hypot'](key, index) > 4;
    if (!enabled) return;
    if (x['resizing']) {
      const result = Math['min'](MIN_WIDTH, windowObject['innerWidth'] - 16),
        data = Math['min'](MIN_HEIGHT, windowObject['innerHeight'] - 16),
        options = Math['max'](result, windowObject['innerWidth'] - x['origin']['x'] - 8),
        target = Math['max'](data, windowObject['innerHeight'] - x['origin']['y'] - 8);
      box2 = {
        width: Math['min'](options, Math['max'](result, x['width'] + key)),
        height: Math['min'](target, Math['max'](data, x['height'] + index)),
      };
    } else box = { x: x['origin']['x'] + key, y: x['origin']['y'] + index };
    place();
  }
  function run3() {
    if (!x) return;
    const source = x;
    ((x = null), root['classList']['remove']('is-resizing'));
    if (source['handle']['hasPointerCapture'](source['id']))
      source['handle']['releasePointerCapture'](source['id']);
    try {
      storage?.['setItem']('collaboration-chat-position', JSON['stringify'](box));
    } catch {}
    if (box2)
      try {
        storage?.['setItem']('collaboration-chat-size', JSON['stringify'](box2));
      } catch {}
  }
  function run4(event2) {
    enabled && ((enabled = ![]), event2['preventDefault'](), event2['stopImmediatePropagation']());
  }
  for (const el of value) {
    (el['addEventListener']('pointerdown', run),
      el['addEventListener']('pointermove', run2),
      el['addEventListener']('pointerup', run3),
      el['addEventListener']('pointercancel', run3),
      el['addEventListener']('lostpointercapture', run3),
      el['addEventListener']('click', run4, !![]));
  }
  function run5() {
    (root['getAnimations']()['forEach']((next) => next['finish']()), place());
  }
  return (
    windowObject['addEventListener']('resize', run5),
    windowObject['addEventListener']('blur', run3),
    {
      place: place,
      destroy() {
        (run3(),
          windowObject['removeEventListener']('resize', run5),
          windowObject['removeEventListener']('blur', run3));
        for (const el2 of value) {
          (el2['removeEventListener']('pointerdown', run),
            el2['removeEventListener']('pointermove', run2),
            el2['removeEventListener']('pointerup', run3),
            el2['removeEventListener']('pointercancel', run3),
            el2['removeEventListener']('lostpointercapture', run3),
            el2['removeEventListener']('click', run4, !![]));
        }
      },
    }
  );
}
