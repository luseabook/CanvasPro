import {
  collectDirectorKeys,
  directorKeyIdentity,
  copyDirectorKeys,
  pasteDirectorKeys,
  deleteDirectorKeys,
  shiftDirectorKeys,
  directorSnapTime,
} from './directorTimelineOperations.js';
import { normalizeStoryboard3DShotAnimation } from './shotAnimation.js';
import { DirectorNumericDrag } from './directorNumericDrag.js';
const selectOptions = (list, value) =>
  list['map'](
    ([item, key]) =>
      '<option value="' +
      item +
      '" ' +
      (item === value ? 'selected' : '') +
      '>' +
      key +
      '</option>',
  )['join']('');
export class DirectorTimelineEditing {
  constructor(index) {
    ((this['timeline'] = index),
      (this['selected'] = new Set()),
      (this['clipboard'] = []),
      (this['zoom'] = 1),
      (this['unit'] = 'seconds'),
      (this['snap'] = !![]),
      (this['numeric'] = new DirectorNumericDrag(index)),
      (this['onDown'] = (result) => this['pointerDown'](result)),
      (this['onWheel'] = (event) => {
        const enabled = event['target']['closest']?.('.storyboard-3d-timeline-tracks');
        if (!enabled || !event['ctrlKey']) return;
        (event['preventDefault'](), event['stopPropagation']());
        const data =
          (event['clientX'] - enabled['getBoundingClientRect']()['left'] + enabled['scrollLeft']) /
          this['zoom'];
        ((this['zoom'] = Math['max'](
          1,
          Math['min'](32, this['zoom'] * (event['deltaY'] > 0 ? 0.8 : 1.25)),
        )),
          this['applyZoom'](),
          (enabled['scrollLeft'] =
            data * this['zoom'] - (event['clientX'] - enabled['getBoundingClientRect']()['left'])));
      }));
  }
  ['context']() {
    return this['timeline']['_context']();
  }
  ['render']() {
    const options = this['timeline']['playbackRate'] || 1;
    return (
      '<div class="storyboard-3d-director-fields storyboard-3d-timeline-editing" data-timeline-editing>\n      <label>倍速<select data-timeline-rate>' +
      selectOptions(
        [0.25, 0.5, 1, 1.5, 2, 4]['map']((target) => [target, target + '×']),
        options,
      ) +
      '</select></label>\n      <label>单位<select data-timeline-unit>' +
      selectOptions(
        [
          ['seconds', '秒'],
          ['frames', '帧'],
          ['milliseconds', '毫秒'],
        ],
        this['unit'],
      ) +
      '</select></label>\n      <button data-storyboard-3d-action="timeline-edit-prev">−1 帧</button><button data-storyboard-3d-action="timeline-edit-next">＋1 帧</button>\n      <button data-storyboard-3d-action="timeline-edit-zoom-out">缩小</button><button data-storyboard-3d-action="timeline-edit-zoom-in">放大</button><button data-storyboard-3d-action="timeline-edit-fit">适配全部</button>\n      <label><input type="checkbox" data-timeline-snap ' +
      (this['snap'] ? 'checked' : '') +
      '>端点吸附</label>\n      <button data-storyboard-3d-action="timeline-edit-select-all">全选帧</button><button data-storyboard-3d-action="timeline-edit-copy">复制</button><button data-storyboard-3d-action="timeline-edit-paste" ' +
      (this['clipboard']['length'] ? '' : 'disabled') +
      '>粘贴</button><button data-storyboard-3d-action="timeline-edit-delete">删除选中</button>\n      <label>批量偏移 / 秒<input type="number" step="0.1" value="0" data-timeline-shift></label>\n      <label>批量看向<select data-timeline-batch-target><option value="">选择目标</option>' +
      (this['context']()
        ['scene']?.['objects']['filter'](
          (source) => source['type'] === 'character' || source['type'] === 'prop',
        )
        ['map'](
          (next, current) =>
            '<option value="' +
            current +
            '">' +
            String(next['name'])['replaceAll']('&', '&amp;')['replaceAll']('<', '&lt;') +
            '</option>',
        )
        ['join']('') || '') +
      '</select></label>\n      <output data-timeline-selected-count>' +
      this['selected']['size'] +
      ' 项选中</output></div>'
    );
  }
  ['identity'](el) {
    return directorKeyIdentity({
      type: el['dataset']['keyframeType'],
      objectId: el['dataset']['objectId'],
      property: el['dataset']['property'],
      keyframeId: el['dataset']['keyframeId'],
    });
  }
  ['mutate'](entry, handler) {
    try {
      (this['timeline']['stopPlayback']({ render: ![] }),
        this['timeline']['_mutateAnimation']('timeline-edit', entry, (record) =>
          normalizeStoryboard3DShotAnimation(handler(record)),
        ),
        this['timeline']['syncPreview']());
    } catch (error) {
      this['timeline']['setMessage']?.(error['message']);
    }
  }
  ['handleClick'](enabled2, payload, handle) {
    if (enabled2 === 'timeline-select-keyframe') {
      const state = this['identity'](payload);
      if (handle?.['shiftKey'] || handle?.['ctrlKey'] || handle?.['metaKey']) {
        if (this['selected']['has'](state)) this['selected']['delete'](state);
        else this['selected']['add'](state);
        return (this['sync'](), !![]);
      }
      return (
        !this['selected']['has'](state) && (this['selected']['clear'](), this['selected']['add'](state)),
        ![]
      );
    }
    if (!enabled2['startsWith']('timeline-edit-')) return ![];
    const { shot: shot } = this['context']();
    if (!shot) return !![];
    const storyboard3DShotAnimation = normalizeStoryboard3DShotAnimation(shot['animation']),
      config = this['timeline']['_timeForShot'](shot);
    switch (enabled2['slice'](14)) {
      case 'prev':
        this['timeline']['_sampleAt'](config - 1 / storyboard3DShotAnimation['fps']);
        break;
      case 'next':
        this['timeline']['_sampleAt'](config + 1 / storyboard3DShotAnimation['fps']);
        break;
      case 'zoom-in':
        this['zoom'] = Math['min'](32, this['zoom'] * 1.5);
        break;
      case 'zoom-out':
        this['zoom'] = Math['max'](1, this['zoom'] / 1.5);
        break;
      case 'fit':
        this['zoom'] = 1;
        break;
      case 'select-all':
        this['selected'] = new Set(
          collectDirectorKeys(storyboard3DShotAnimation)['map'](directorKeyIdentity),
        );
        break;
      case 'copy':
        this['clipboard'] = copyDirectorKeys(storyboard3DShotAnimation, this['selected']);
        break;
      case 'paste':
        this['mutate']('粘贴关键帧', (scope) => pasteDirectorKeys(scope, this['clipboard'], config));
        break;
      case 'delete':
        this['mutate']('删除选中关键帧', (input) => deleteDirectorKeys(input, this['selected']));
        break;
    }
    return (this['timeline']['requestRender']?.(), !![]);
  }
  ['handleChange'](output) {
    const el2 = output['target'];
    if (el2['matches']?.('[data-director-camera-key], [data-director-camera-key-easing]')) {
      const value2 = this['timeline']['selectedKeyframe'];
      if (value2?.['type'] !== 'camera') return !![];
      return (
        this['mutate']('编辑摄像机关键帧', (value3) => {
          const enabled3 = value3['cameraKeyframes']['find'](
            (value4) => value4['id'] === value2['keyframeId'],
          );
          if (!enabled3) return value3;
          if (el2['matches']('[data-director-camera-key-easing]'))
            ((enabled3['easing'] = el2['value']), delete enabled3['easingCurve']);
          else {
            const [value5, value6] = el2['dataset']['directorCameraKey']['split']('-'),
              value7 = Number(el2['value']);
            if (!Number['isFinite'](value7)) return value3;
            if (value6 != null) enabled3['camera'][value5][Number(value6)] = value7;
            else enabled3['camera'][value5] = value5 === 'roll' ? (value7 * Math['PI']) / 180 : value7;
            if (value5 === 'focalLength') delete enabled3['camera']['fov'];
          }
          return value3;
        }),
        !![]
      );
    }
    if (el2['matches']?.('[data-timeline-rate]'))
      return (
        this['timeline']['stopPlayback']({ render: ![] }),
        (this['timeline']['playbackRate'] = Number(el2['value'])),
        !![]
      );
    if (el2['matches']?.('[data-timeline-unit]'))
      return ((this['unit'] = el2['value']), this['sync'](), !![]);
    if (el2['matches']?.('[data-timeline-snap]')) return ((this['snap'] = el2['checked']), !![]);
    if (el2['matches']?.('[data-timeline-shift]'))
      return (
        this['mutate']('批量移动关键帧', (value8) =>
          shiftDirectorKeys(value8, this['selected'], Number(el2['value'])),
        ),
        !![]
      );
    if (el2['matches']?.('[data-timeline-batch-target]') && el2['value'] !== '') {
      const value9 = this['context']()['scene']['objects']['filter'](
        (value10) => value10['type'] === 'character' || value10['type'] === 'prop',
      )[Number(el2['value'])];
      if (value9)
        this['mutate']('批量调整看向', (value11) => {
          return (
            collectDirectorKeys(value11)['forEach']((value12) => {
              if (!this['selected']['has'](directorKeyIdentity(value12))) return;
              if (value12['type'] === 'camera')
                value12['key']['camera']['target'] = value9['transform']['position']['map'](
                  (value13, count) => value13 + (count === 1 ? 1.2 : 0),
                );
              else {
                if (value12['property'] === 'rotation') {
                  const value14 = this['context']()['scene']['objects']['find'](
                    (value15) => value15['id'] === value12['objectId'],
                  );
                  if (value14)
                    value12['key']['value'][1] = Math['atan2'](
                      value9['transform']['position'][0] - value14['transform']['position'][0],
                      value9['transform']['position'][2] - value14['transform']['position'][2],
                    );
                }
              }
            }),
            value11
          );
        });
      return !![];
    }
    return ![];
  }
  ['handleKey'](event2) {
    if (event2['key'] === 'Escape' && this['numeric']['cancel'])
      return (
        this['numeric']['cancel'](),
        event2['preventDefault'](),
        event2['stopImmediatePropagation'](),
        !![]
      );
    if (event2['key'] === 'Escape' && this['timeline']['multiView']['layer']) {
      if (this['timeline']['multiView']['cancel']) this['timeline']['multiView']['cancel']();
      else this['timeline']['multiView']['destroy']();
      return (event2['preventDefault'](), event2['stopImmediatePropagation'](), !![]);
    }
    if (event2['key'] === 'Escape' && this['timeline']['clips']['cancel'])
      return (
        this['timeline']['clips']['cancel'](),
        event2['preventDefault'](),
        event2['stopImmediatePropagation'](),
        !![]
      );
    if (this['timeline']['clips']['handleKey'](event2)) return !![];
    if (event2['key'] === 'Escape' && this['cancelMarquee'])
      return (
        this['cancelMarquee'](),
        event2['preventDefault'](),
        event2['stopImmediatePropagation'](),
        !![]
      );
    if (
      !this['timeline']['isDrawerOpen']() ||
      event2['target']?.['closest']?.('input,textarea,select,[contenteditable=true]')
    )
      return ![];
    const value16 = event2['key']['toLowerCase'](),
      value17 = event2['ctrlKey'] || event2['metaKey'];
    if (
      value17 &&
      ['a', 'c', 'v']['includes'](value16) &&
      event2['target']['closest']?.('[data-storyboard-3d-shot-timeline]')
    )
      this['handleClick']('timeline-edit-' + { a: 'select-all', c: 'copy', v: 'paste' }[value16]);
    else {
      if (
        ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'home', 'end']['includes'](value16) &&
        event2['target']['closest']?.('[data-storyboard-3d-shot-timeline]')
      ) {
        const { shot: shot2 } = this['context']();
        if (!shot2) return ![];
        const args = normalizeStoryboard3DShotAnimation(shot2['animation']),
          value18 = this['timeline']['_timeForShot'](shot2),
          list2 = [
            ...new Set([
              0,
              args['duration'],
              ...collectDirectorKeys(args)['map'](({ key: key2 }) => key2['time']),
              ...args['actionClips']['flatMap']((value19) => [value19['start'], value19['end']]),
            ]),
          ]['sort']((value20, value21) => value20 - value21),
          value22 =
            value16 === 'home'
              ? 0
              : value16 === 'end'
                ? args['duration']
                : value16 === 'arrowup'
                  ? (list2['filter']((value23) => value23 < value18 - 0.00001)['at'](-1) ?? 0)
                  : value16 === 'arrowdown'
                    ? (list2['find']((value24) => value24 > value18 + 0.00001) ?? args['duration'])
                    : value18 +
                      ((value16 === 'arrowleft' ? -1 : 1) * (event2['shiftKey'] ? 10 : 1)) /
                        args['fps'];
        (this['timeline']['stopPlayback']({ render: ![] }), this['timeline']['_sampleAt'](value22));
      } else {
        if (
          (value16 === 'delete' || value16 === 'backspace') &&
          this['selected']['size'] &&
          event2['target']['closest']?.('[data-storyboard-3d-shot-timeline]')
        )
          this['handleClick']('timeline-edit-delete');
        else return ![];
      }
    }
    return (event2['preventDefault'](), event2['stopImmediatePropagation'](), !![]);
  }
  ['snapTime'](value25, value26, value27, enabled4, value28 = []) {
    return directorSnapTime(
      value25,
      value26,
      this['snap'] && !enabled4 ? (value26['duration'] / value27) * 8 : 0,
      value28,
    );
  }
  ['applyZoom']() {
    const value29 = this['timeline']['getRoot']?.()?.['querySelector']('.storyboard-3d-timeline-tracks');
    if (value29) value29['style']['setProperty']('--director-timeline-zoom', this['zoom']);
  }
  ['sync']() {
    const enabled5 = this['timeline']['getRoot']?.();
    if (!enabled5) return;
    this['numeric']['bind'](enabled5);
    enabled5 !== this['root'] &&
      (this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      this['root']?.['removeEventListener']('wheel', this['onWheel'], !![]),
      (this['root'] = enabled5),
      enabled5['addEventListener']('pointerdown', this['onDown'], !![]),
      enabled5['addEventListener']('wheel', this['onWheel'], { capture: !![], passive: ![] }));
    const { shot: shot3 } = this['context']();
    if (!shot3) return;
    const value30 = new Set(collectDirectorKeys(shot3['animation'])['map'](directorKeyIdentity));
    ((this['selected'] = new Set([...this['selected']]['filter']((value31) => value30['has'](value31)))),
      enabled5['querySelectorAll']('[data-keyframe-id]')['forEach']((value32) =>
        value32['classList']['toggle'](
          'is-selected',
          this['selected']['has'](this['identity'](value32)) ||
            value32['dataset']['keyframeId'] === this['timeline']['selectedKeyframe']?.['keyframeId'],
        ),
      ));
    const value33 = enabled5['querySelector']('[data-timeline-selected-count]');
    if (value33) value33['textContent'] = this['selected']['size'] + ' 项选中';
    (this['applyZoom'](),
      enabled5['querySelectorAll']('.storyboard-3d-timeline-ruler > span')['forEach']((el3) => {
        const value34 =
          (parseFloat(el3['style']['getPropertyValue']('--storyboard-3d-tick-position')) / 100) *
          shot3['animation']['duration'];
        el3['querySelector']('strong')['textContent'] =
          this['unit'] === 'frames'
            ? Math['round'](value34 * shot3['animation']['fps']) + 'f'
            : this['unit'] === 'milliseconds'
              ? Math['round'](value34 * 1000) + 'ms'
              : Number(value34['toFixed'](2)) + 's';
      }));
  }
  ['pointerDown'](event3) {
    const enabled6 = event3['target']['closest']?.('.storyboard-3d-timeline-lane');
    if (
      !enabled6 ||
      event3['target']['closest']('button,.storyboard-3d-motion-clip') ||
      event3['button'] !== 0
    )
      return;
    (event3['preventDefault'](), event3['stopImmediatePropagation']());
    const value35 = this['root'],
      el4 = value35['ownerDocument']['defaultView'],
      box = value35['getBoundingClientRect'](),
      value36 = value35['ownerDocument']['createElement']('div');
    ((value36['className'] = 'storyboard-3d-timeline-marquee'), value35['append'](value36));
    const box2 = { x: event3['clientX'], y: event3['clientY'] },
      value37 = new Set(this['selected']),
      value38 = new Set(event3['shiftKey'] ? this['selected'] : []),
      value39 = new el4['AbortController']();
    this['cancelMarquee']?.();
    const run = () => {
      (value39['abort'](), value36['remove'](), (this['cancelMarquee'] = null));
    };
    this['cancelMarquee'] = () => {
      ((this['selected'] = value37), run(), this['sync']());
    };
    const value40 = (value41) => {
      const value42 = Math['min'](box2['x'], value41['clientX']),
        value43 = Math['min'](box2['y'], value41['clientY']),
        value44 = Math['max'](box2['x'], value41['clientX']),
        value45 = Math['max'](box2['y'], value41['clientY']);
      (Object['entries']({
        left: value42 - box['left'],
        top: value43 - box['top'],
        width: value44 - value42,
        height: value45 - value43,
      })['forEach'](([value46, value47]) => {
        value36['style'][value46] = value47 + 'px';
      }),
        (this['selected'] = new Set(value38)),
        value35['querySelectorAll']('[data-keyframe-id]')['forEach']((el5) => {
          const value48 = el5['getBoundingClientRect']();
          if (
            value48['right'] >= value42 &&
            value48['left'] <= value44 &&
            value48['bottom'] >= value43 &&
            value48['top'] <= value45
          )
            this['selected']['add'](this['identity'](el5));
        }),
        this['sync']());
    };
    (el4['addEventListener']('pointermove', value40, { signal: value39['signal'] }),
      el4['addEventListener']('pointerup', run, { once: !![], signal: value39['signal'] }),
      el4['addEventListener']('pointercancel', () => this['cancelMarquee']?.(), {
        once: !![],
        signal: value39['signal'],
      }));
  }
  ['destroy']() {
    (this['cancelMarquee']?.(),
      this['numeric']['destroy'](),
      this['root']?.['removeEventListener']('pointerdown', this['onDown'], !![]),
      this['root']?.['removeEventListener']('wheel', this['onWheel'], !![]),
      (this['root'] = null));
  }
}
