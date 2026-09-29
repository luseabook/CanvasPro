import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bindWorkspaceVideoVolumeControls,
  renderWorkspaceVideoPlaybackControls,
  createWorkspaceVideoPlaybackControls,
} from './workspaceVideoPlaybackControls.js';

function makeElement(tagName) {
  const listeners = new Map();
  const element = {
    tagName,
    className: '',
    type: '',
    value: '',
    min: '',
    max: '',
    step: '',
    innerHTML: '',
    textContent: '',
    disabled: false,
    children: [],
    attributes: {},
    classToggles: [],
    classList: {
      toggle(name, on) {
        element.classToggles.push([name, on]);
      },
    },
    style: {
      properties: {},
      setProperty(name, value) {
        this.properties[name] = value;
      },
    },
    appendChild(child) {
      element.children.push(child);
      return child;
    },
    setAttribute(name, value) {
      element.attributes[name] = value;
    },
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      const entries = listeners.get(type) || [];
      const index = entries.indexOf(fn);
      if (index >= 0) entries.splice(index, 1);
    },
    listenerCount(type) {
      return (listeners.get(type) || []).length;
    },
    dispatch(type, event) {
      for (const fn of [...(listeners.get(type) || [])]) fn(event);
    },
  };
  return element;
}

function makeDocument() {
  const created = [];
  return {
    created,
    createElement(tagName) {
      const element = makeElement(tagName);
      created.push(element);
      return element;
    },
  };
}

function media(volume, muted) {
  return { volume, muted };
}

function sliderWithValue(value) {
  const slider = makeElement('input');
  slider.value = value;
  return slider;
}

/* bindWorkspaceVideoVolumeControls */

test('freezes and exposes the volume control surface', () => {
  const controls = bindWorkspaceVideoVolumeControls();
  assert.deepEqual(Object.keys(controls), ['sync', 'setVolumePercent', 'toggleMuted', 'dispose']);
  for (const name of ['sync', 'setVolumePercent', 'toggleMuted', 'dispose']) {
    assert.equal(typeof controls[name], 'function');
  }
  assert.equal(Object.isFrozen(controls), true);
});

test('writes the audible media volume into the slider on creation', () => {
  const slider = makeElement('input');
  const toggle = makeElement('button');
  bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    volumeToggle: toggle,
    getMediaElements: () => [media(0.5, false)],
  });
  assert.equal(slider.value, '50');
  assert.deepEqual(slider.style.properties, { '--story-video-volume-progress': '50%' });
  assert.deepEqual(slider.attributes, { 'aria-valuetext': '50%' });
  assert.deepEqual(toggle.classToggles, [['is-muted', false]]);
  assert.deepEqual(toggle.attributes, { 'aria-pressed': 'false' });
});

test('rounds a fractional media volume to the nearest slider percent', () => {
  const slider = makeElement('input');
  const toggle = makeElement('button');
  bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    volumeToggle: toggle,
    getMediaElements: () => [media(0.335, false)],
  });
  assert.equal(slider.value, '34');
  assert.deepEqual(slider.style.properties, { '--story-video-volume-progress': '34%' });
  assert.deepEqual(slider.attributes, { 'aria-valuetext': '34%' });
  assert.deepEqual(toggle.classToggles, [['is-muted', false]]);
});

test('prefers the first unmuted media element with audible volume', () => {
  const slider = makeElement('input');
  bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => [media(0.5, true), media(0.25, false), media(0.75, false)],
  });
  assert.equal(slider.value, '25');
});

test('skips an unmuted element whose volume is zero', () => {
  const slider = makeElement('input');
  bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => [media(0, false), media(0.4, false)],
  });
  assert.equal(slider.value, '40');
});

test('reports a muted state when no media element is audible', () => {
  const slider = makeElement('input');
  const toggle = makeElement('button');
  bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    volumeToggle: toggle,
    getMediaElements: () => [media(0.6, true), media(0, false)],
  });
  assert.equal(slider.value, '0');
  assert.deepEqual(toggle.classToggles, [['is-muted', true]]);
  assert.equal(toggle.attributes['aria-pressed'], 'true');
});

test('uses the initial slider percent when there is no media', () => {
  const slider = sliderWithValue('30');
  const toggle = makeElement('button');
  bindWorkspaceVideoVolumeControls({ volumeSlider: slider, volumeToggle: toggle });
  assert.equal(slider.value, '30');
  assert.deepEqual(slider.style.properties, { '--story-video-volume-progress': '30%' });
  assert.equal(toggle.attributes['aria-pressed'], 'false');
});

test('clamps the initial slider percent to the zero to one range', () => {
  const cases = [
    ['250', '100'],
    ['-5', '0'],
    ['abc', '0'],
    ['', '0'],
    [undefined, '0'],
    ['0', '0'],
    ['100', '100'],
  ];
  for (const [value, expected] of cases) {
    const slider = sliderWithValue(value);
    bindWorkspaceVideoVolumeControls({ volumeSlider: slider });
    assert.equal(slider.value, expected, `slider value ${value}`);
  }
});

test('falls back to the remembered muted element volume', () => {
  const slider = makeElement('input');
  const elements = [media(0.7, true)];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => elements,
  });
  assert.equal(slider.value, '0');
  assert.equal(controls.toggleMuted(), true);
  assert.equal(elements[0].volume, 0.7);
  assert.equal(elements[0].muted, false);
  assert.equal(slider.value, '70');
});

test('restores full volume when nothing else said otherwise', () => {
  const elements = [];
  const controls = bindWorkspaceVideoVolumeControls({ getMediaElements: () => elements });
  elements.push(media(0, true));
  assert.equal(controls.toggleMuted(), true);
  assert.equal(elements[0].volume, 1);
  assert.equal(elements[0].muted, false);
});

test('remembers the audible element volume instead of a muted one', () => {
  const slider = makeElement('input');
  const elements = [media(0.5, true), media(0.25, false)];
  let reads = 0;
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => {
      reads += 1;
      return reads === 1 ? elements : elements.slice(0, 1);
    },
  });
  assert.equal(slider.value, '0');
  assert.equal(controls.setVolumePercent(0), true);
  assert.equal(controls.toggleMuted(), true);
  assert.equal(elements[0].muted, false);
  assert.equal(elements[0].volume, 0.25);
});

test('remembers the loudest fallback volume when every element starts silent', () => {
  const elements = [media(0, false), media(0.7, true)];
  const controls = bindWorkspaceVideoVolumeControls({ getMediaElements: () => elements });
  assert.equal(controls.setVolumePercent(0), true);
  assert.equal(controls.toggleMuted(), true);
  assert.equal(elements[1].muted, false);
  assert.equal(elements[1].volume, 0.7);
});

test('clamps and defaults a custom default volume', () => {
  const cases = [
    [0.4, 0.4],
    [3, 1],
    [-4, 1],
    [0, 1],
    ['x', 1],
    [null, 1],
    [undefined, 1],
    [false, 1],
  ];
  for (const [defaultVolume, expected] of cases) {
    const elements = [];
    const controls = bindWorkspaceVideoVolumeControls({
      defaultVolume,
      getMediaElements: () => elements,
    });
    elements.push(media(0, true));
    controls.toggleMuted();
    assert.equal(elements[0].volume, expected, `default volume ${String(defaultVolume)}`);
  }
});

test('resolves media elements through the getter and drops invalid entries', () => {
  const slider = makeElement('input');
  const first = media(0.9, false);
  const second = media(0.1, false);
  const seen = [];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => {
      seen.push('call');
      return [first, first, null, 7, 'text', () => {}, second];
    },
  });
  assert.equal(slider.value, '90');
  assert.equal(seen.length, 2);
  assert.equal(controls.setVolumePercent(20), true);
  assert.equal(first.volume, 0.2);
  assert.equal(second.volume, 0.2);
  assert.equal(seen.length, 4);
});

test('ignores a media element getter that is not a function', () => {
  for (const getMediaElements of ['nope', null, 42, {}]) {
    const slider = sliderWithValue('44');
    assert.doesNotThrow(() => bindWorkspaceVideoVolumeControls({ volumeSlider: slider, getMediaElements }));
    assert.equal(slider.value, '44');
  }
});

test('does not mutate the media list it reads', () => {
  const first = media(0.5, false);
  const list = Object.freeze([first]);
  const controls = bindWorkspaceVideoVolumeControls({ getMediaElements: () => list });
  assert.equal(controls.setVolumePercent(70), true);
  assert.equal(first.volume, 0.7);
  assert.deepEqual(list, [first]);
});

test('re-reads the media elements on every sync', () => {
  const slider = makeElement('input');
  const elements = [media(0.5, false)];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => elements,
  });
  assert.equal(slider.value, '50');
  elements[0].volume = 0.2;
  controls.sync();
  assert.equal(slider.value, '20');
  elements.length = 0;
  controls.sync();
  assert.equal(slider.value, '0');
});

test('setVolumePercent writes the value onto every media element', () => {
  const elements = [media(0.5, false), media(0.9, true)];
  const changes = [];
  const controls = bindWorkspaceVideoVolumeControls({
    getMediaElements: () => elements,
    onChange: () => changes.push('change'),
  });
  assert.equal(controls.setVolumePercent(42), true);
  assert.equal(elements[0].volume, 0.42);
  assert.equal(elements[0].muted, false);
  assert.equal(elements[1].volume, 0.42);
  assert.equal(elements[1].muted, false);
  assert.deepEqual(changes, ['change']);
});

test('setVolumePercent clamps out-of-range and junk input to zero or one', () => {
  const cases = [
    [150, 1],
    [250, 1],
    [-10, 0],
    [0, 0],
    ['abc', 0],
    [NaN, 0],
    [Infinity, 0],
    [undefined, 0],
    [null, 0],
    [100, 1],
  ];
  for (const [input, expected] of cases) {
    const elements = [media(0.5, false)];
    const controls = bindWorkspaceVideoVolumeControls({ getMediaElements: () => elements });
    assert.equal(controls.setVolumePercent(input), true, `input ${String(input)}`);
    assert.ok(elements[0].volume === expected, `input ${String(input)} produced ${elements[0].volume}`);
  }
});

test('zeroing the volume reports muted but keeps the remembered volume', () => {
  const slider = makeElement('input');
  const toggle = makeElement('button');
  const elements = [media(0.8, false)];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    volumeToggle: toggle,
    getMediaElements: () => elements,
  });
  assert.equal(controls.setVolumePercent(0), true);
  assert.equal(elements[0].volume, 0);
  assert.equal(elements[0].muted, false);
  assert.equal(slider.value, '0');
  assert.equal(toggle.attributes['aria-pressed'], 'true');
  assert.equal(controls.toggleMuted(), true);
  assert.equal(elements[0].volume, 0.8);
  assert.equal(elements[0].muted, false);
});

test('toggleMuted mutes every audible media element and keeps its volume', () => {
  const slider = makeElement('input');
  const elements = [media(0.6, false), media(0.3, false)];
  const changes = [];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => elements,
    onChange: () => changes.push('change'),
  });
  assert.equal(controls.toggleMuted(), true);
  assert.equal(elements[0].muted, true);
  assert.equal(elements[0].volume, 0.6);
  assert.equal(elements[1].muted, true);
  assert.equal(elements[1].volume, 0.3);
  assert.equal(slider.value, '0');
  assert.deepEqual(changes, ['change']);
});

test('toggleMuted twice un-mutes back to the remembered volume', () => {
  const slider = makeElement('input');
  const elements = [media(0.6, false), media(0.3, false)];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => elements,
  });
  controls.toggleMuted();
  controls.toggleMuted();
  assert.equal(elements[0].muted, false);
  assert.equal(elements[0].volume, 0.6);
  assert.equal(elements[1].muted, false);
  assert.equal(elements[1].volume, 0.6);
  assert.equal(slider.value, '60');
});

test('toggleMuted also un-mutes elements that were already silent', () => {
  const elements = [media(0, true)];
  const controls = bindWorkspaceVideoVolumeControls({
    defaultVolume: 0.25,
    getMediaElements: () => elements,
  });
  controls.toggleMuted();
  assert.equal(elements[0].muted, false);
  assert.equal(elements[0].volume, 0.25);
});

test('feeds the muted flag through the toggle label getter', () => {
  const toggle = makeElement('button');
  const labels = [];
  const elements = [media(0.3, false)];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeToggle: toggle,
    getMediaElements: () => elements,
    getToggleLabel: (muted) => {
      labels.push(muted);
      return `  ${muted ? '取消静音' : '静音'}  `;
    },
  });
  assert.deepEqual(labels, [false]);
  assert.equal(toggle.attributes['aria-label'], '静音');
  controls.toggleMuted();
  assert.deepEqual(labels, [false, true]);
  assert.equal(toggle.attributes['aria-label'], '取消静音');
});

test('keeps the previous aria-label when the toggle label is blank', () => {
  for (const blank of ['', '   ', null, undefined, 0]) {
    const toggle = makeElement('button');
    toggle.setAttribute('aria-label', 'keep');
    bindWorkspaceVideoVolumeControls({
      volumeToggle: toggle,
      getToggleLabel: () => blank,
    });
    assert.equal(toggle.attributes['aria-label'], 'keep', `blank label ${String(blank)}`);
  }
});

test('ignores a toggle label getter that is not a function', () => {
  const toggle = makeElement('button');
  toggle.setAttribute('aria-label', 'keep');
  bindWorkspaceVideoVolumeControls({ volumeToggle: toggle, getToggleLabel: 'nope' });
  assert.equal(toggle.attributes['aria-label'], 'keep');
});

test('uses the slider event value and stops propagation on input', () => {
  const slider = makeElement('input');
  const seen = [];
  const elements = [media(0.1, false)];
  bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    getMediaElements: () => elements,
  });
  slider.dispatch('input', {
    stopPropagation: () => seen.push('stop'),
    currentTarget: { value: '80' },
  });
  assert.deepEqual(seen, ['stop']);
  assert.equal(elements[0].volume, 0.8);
  slider.value = '20';
  slider.dispatch('input', { currentTarget: {} });
  assert.equal(elements[0].volume, 0.2);
  slider.dispatch('input');
  assert.equal(elements[0].volume, 0.2);
  slider.value = '20';
  slider.dispatch('input', { currentTarget: { value: '' } });
  assert.equal(elements[0].volume, 0);
  assert.equal(slider.value, '0');
});

test('toggles the mute state on click and cancels the event', () => {
  const toggle = makeElement('button');
  const seen = [];
  const elements = [media(0.2, false)];
  bindWorkspaceVideoVolumeControls({
    volumeToggle: toggle,
    getMediaElements: () => elements,
  });
  toggle.dispatch('click', {
    preventDefault: () => seen.push('preventDefault'),
    stopPropagation: () => seen.push('stopPropagation'),
  });
  assert.deepEqual(seen, ['preventDefault', 'stopPropagation']);
  assert.equal(elements[0].muted, true);
  toggle.dispatch('click');
  assert.equal(elements[0].muted, false);
});

test('survives controls without optional capabilities', () => {
  const bare = { value: '10', addEventListener() {} };
  assert.doesNotThrow(() =>
    bindWorkspaceVideoVolumeControls({
      volumeSlider: bare,
      volumeToggle: {},
      getMediaElements: () => [media(0.4, false)],
    }),
  );
  assert.equal(bare.value, '40');
  assert.doesNotThrow(() => bindWorkspaceVideoVolumeControls({ volumeSlider: null, volumeToggle: null }));
});

test('registers the listeners up front and removes them on dispose', () => {
  const slider = makeElement('input');
  const toggle = makeElement('button');
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    volumeToggle: toggle,
    getMediaElements: () => [],
  });
  assert.equal(slider.listenerCount('input'), 1);
  assert.equal(toggle.listenerCount('click'), 1);
  controls.dispose();
  assert.equal(slider.listenerCount('input'), 0);
  assert.equal(toggle.listenerCount('click'), 0);
});

test('dispose is idempotent and freezes further updates', () => {
  const slider = makeElement('input');
  const toggle = makeElement('button');
  const changes = [];
  const elements = [media(0.5, false)];
  const controls = bindWorkspaceVideoVolumeControls({
    volumeSlider: slider,
    volumeToggle: toggle,
    getMediaElements: () => elements,
    onChange: () => changes.push('change'),
  });
  controls.dispose();
  assert.doesNotThrow(() => controls.dispose());
  assert.equal(slider.value, '50');
  elements[0].volume = 0.9;
  assert.equal(controls.sync(), undefined);
  assert.equal(slider.value, '50');
  assert.equal(controls.setVolumePercent(20), false);
  assert.equal(controls.toggleMuted(), false);
  assert.equal(elements[0].volume, 0.9);
  assert.deepEqual(changes, []);
  toggle.dispatch('click');
  slider.dispatch('input', { currentTarget: { value: '10' } });
  assert.equal(elements[0].muted, false);
});

test('does not mutate the options bag given to the binder', () => {
  const elements = [media(0.5, false)];
  const options = {
    getMediaElements: () => elements,
    defaultVolume: 0.5,
    onChange: () => {},
  };
  const keys = Object.keys(options).sort();
  bindWorkspaceVideoVolumeControls(options);
  assert.deepEqual(Object.keys(options).sort(), keys);
  assert.equal(options.defaultVolume, 0.5);
});

/* renderWorkspaceVideoPlaybackControls */

test('renders the default control markup', () => {
  const html = renderWorkspaceVideoPlaybackControls();
  assert.equal(typeof html, 'string');
  assert.ok(html.startsWith('<div class="video-controls story-video-controls">'));
  assert.ok(html.endsWith('</div>'));
  assert.ok(
    html.includes('<button type="button" class="video-play-btn story-video-play-btn" aria-label="播放视频">'),
  );
  assert.ok(html.includes('story-video-play-icon'));
  assert.ok(html.includes('story-video-pause-icon'));
  assert.ok(html.includes('<span class="video-time-current">0:00</span>'));
  assert.ok(html.includes('<span class="video-time-total">0:00</span>'));
  assert.ok(html.includes('class="media-progress-bar" role="slider" aria-disabled="false" tabindex="0"'));
  assert.ok(
    html.includes('aria-label="视频播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"'),
  );
  assert.ok(html.includes('<div class="media-progress-fill"><div class="media-progress-knob"></div></div>'));
  assert.ok(html.includes('class="story-video-volume-toggle" aria-label="静音视频" aria-pressed="false"'));
  assert.ok(html.includes('class="story-video-volume-slider" min="0" max="100" step="1" value="100"'));
  assert.ok(html.includes('aria-label="视频音量" aria-valuetext="100%"'));
  assert.equal(html.includes('title='), false);
  assert.equal(html.includes(' disabled'), false);
});

test('appends the custom class name to the root class list', () => {
  assert.ok(
    renderWorkspaceVideoPlaybackControls({ className: 'player-x' }).startsWith(
      '<div class="video-controls story-video-controls player-x">',
    ),
  );
  assert.ok(
    renderWorkspaceVideoPlaybackControls({ className: '' }).startsWith(
      '<div class="video-controls story-video-controls">',
    ),
  );
  assert.ok(
    renderWorkspaceVideoPlaybackControls({ className: null }).startsWith(
      '<div class="video-controls story-video-controls">',
    ),
  );
  assert.ok(
    renderWorkspaceVideoPlaybackControls({ className: '  ' }).startsWith(
      '<div class="video-controls story-video-controls   ">',
    ),
  );
});

test('derives labels from the label option', () => {
  const html = renderWorkspaceVideoPlaybackControls({ label: '歌词' });
  assert.ok(html.includes('aria-label="播放歌词"'));
  assert.ok(html.includes('aria-label="歌词播放进度"'));
  assert.ok(html.includes('aria-label="歌词音量"'));
  assert.ok(html.includes('aria-label="静音歌词"'));
});

test('lets explicit labels override the derived ones', () => {
  const html = renderWorkspaceVideoPlaybackControls({
    playLabel: '',
    progressLabel: '进度',
    volumeLabel: '音量',
    volumeToggleLabel: '静音开关',
  });
  assert.ok(html.includes('aria-label=""'));
  assert.ok(html.includes('aria-label="进度"'));
  assert.ok(html.includes('aria-label="音量" aria-valuetext="100%"'));
  assert.ok(html.includes('aria-label="静音开关"'));
});

test('stringifies a nullish label into the derived labels', () => {
  const html = renderWorkspaceVideoPlaybackControls({ label: null });
  assert.ok(html.includes('aria-label="播放null"'));
  assert.ok(html.includes('aria-label="null播放进度"'));
  assert.ok(html.includes('aria-label="null音量"'));
  assert.ok(html.includes('aria-label="静音null"'));
});

test('escapes the class name and every label', () => {
  const html = renderWorkspaceVideoPlaybackControls({
    label: '<b>&"',
    playTitle: "t'x",
  });
  assert.ok(html.includes('aria-label="播放&lt;b&gt;&amp;&quot;"'));
  assert.ok(html.includes('aria-label="&lt;b&gt;&amp;&quot;播放进度"'));
  assert.ok(html.includes('aria-label="&lt;b&gt;&amp;&quot;音量"'));
  assert.ok(html.includes('aria-label="静音&lt;b&gt;&amp;&quot;"'));
  assert.ok(html.includes('title="t&#39;x"'));
  assert.ok(
    renderWorkspaceVideoPlaybackControls({ className: 'x" onload="y' }).startsWith(
      '<div class="video-controls story-video-controls x&quot; onload=&quot;y">',
    ),
  );
});

test('renders a title only when playTitle is set', () => {
  assert.ok(
    renderWorkspaceVideoPlaybackControls({ playTitle: '播放<1>' }).includes(
      ' aria-label="播放视频" title="播放&lt;1&gt;">',
    ),
  );
  assert.equal(renderWorkspaceVideoPlaybackControls({ playTitle: '' }).includes('title='), false);
  assert.ok(renderWorkspaceVideoPlaybackControls({ playTitle: ' ' }).includes(' title=" ">'));
});

test('renders boolean and string control attributes', () => {
  const html = renderWorkspaceVideoPlaybackControls({
    controlsAttributes: {
      'data-role': 'player',
      hidden: true,
      gone: false,
      nil: null,
      missing: undefined,
      blank: '',
      zero: 0,
    },
  });
  assert.ok(
    html.startsWith(
      '<div class="video-controls story-video-controls" data-role="player" hidden blank="" zero="0">',
    ),
  );
});

test('places each attribute bag on its own element', () => {
  const html = renderWorkspaceVideoPlaybackControls({
    playAttributes: { 'data-play': '1' },
    currentTimeAttributes: { 'data-cur': '1' },
    progressAttributes: { 'data-prog': '1' },
    progressFillAttributes: { 'data-fill': '1' },
    totalTimeAttributes: { 'data-total': '1' },
    volumeAttributes: { 'data-vol': '1' },
    volumeToggleAttributes: { 'data-vt': '1' },
  });
  assert.ok(html.includes('story-video-play-btn" data-play="1" aria-label='));
  assert.ok(html.includes('<span class="video-time-current" data-cur="1">'));
  assert.ok(html.includes('class="media-progress-bar" data-prog="1" role="slider"'));
  assert.ok(html.includes('<div class="media-progress-fill" data-fill="1">'));
  assert.ok(html.includes('<span class="video-time-total" data-total="1">'));
  assert.ok(html.includes('story-video-volume-toggle" data-vt="1" aria-label='));
  assert.ok(html.includes('story-video-volume-slider" data-vol="1" min="0"'));
});

test('marks a disabled control set', () => {
  const html = renderWorkspaceVideoPlaybackControls({ disabled: true });
  assert.ok(html.includes('aria-disabled="true" tabindex="-1"'));
  assert.ok(html.includes('aria-label="播放视频" disabled>'));
  assert.ok(html.includes('aria-pressed="false" disabled>'));
  assert.ok(html.includes('aria-valuetext="100%" disabled>'));
  assert.equal((html.match(/ disabled>/g) || []).length, 3);
});

test('passes a non-boolean disabled flag straight into the markup', () => {
  const enabled = renderWorkspaceVideoPlaybackControls({ disabled: 0 });
  assert.ok(enabled.includes('aria-disabled="0" tabindex="0"'));
  assert.equal(enabled.includes(' disabled>'), false);
  const truthy = renderWorkspaceVideoPlaybackControls({ disabled: 1 });
  assert.ok(truthy.includes('aria-disabled="1" tabindex="-1"'));
  assert.equal((truthy.match(/ disabled>/g) || []).length, 3);
});

test('injects the slot markup around the controls without escaping it', () => {
  const html = renderWorkspaceVideoPlaybackControls({
    slots: { afterPlay: '<i>a</i>', beforeVolume: '<i>b</i>', afterVolume: '<i>c</i>' },
  });
  assert.ok(html.includes('</button>\n    <i>a</i>\n    <span class="video-time-current"'));
  assert.ok(html.includes('</span>\n    <i>b</i>\n    <div class="story-video-volume-control">'));
  assert.ok(html.includes('</div>\n    <i>c</i>\n  </div>'));
});

test('treats falsy slot values as empty', () => {
  const html = renderWorkspaceVideoPlaybackControls({ slots: { afterPlay: 0, beforeVolume: null } });
  assert.ok(html.includes('</button>\n    \n    <span class="video-time-current"'));
  assert.ok(html.includes('</span>\n    \n    <div class="story-video-volume-control">'));
});

test('does not mutate the options given to the renderer', () => {
  const controlsAttributes = { 'data-x': '1' };
  const slots = { afterPlay: '<i></i>' };
  const html = renderWorkspaceVideoPlaybackControls({ controlsAttributes, slots, playTitle: 't' });
  assert.deepEqual(controlsAttributes, { 'data-x': '1' });
  assert.deepEqual(slots, { afterPlay: '<i></i>' });
  assert.ok(html.includes('data-x="1"'));
});

/* createWorkspaceVideoPlaybackControls */

test('returns null when the document cannot create elements', () => {
  assert.equal(createWorkspaceVideoPlaybackControls(null), null);
  assert.equal(createWorkspaceVideoPlaybackControls(undefined), null);
  assert.equal(createWorkspaceVideoPlaybackControls({}), null);
  assert.equal(createWorkspaceVideoPlaybackControls(), null);
});

test('builds the full control element tree', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument());
  assert.deepEqual(Object.keys(controls), [
    'root',
    'playButton',
    'currentTime',
    'progress',
    'progressFill',
    'progressKnob',
    'totalTime',
    'volumeControl',
    'volumeToggle',
    'volume',
  ]);
  assert.equal(controls.root.tagName, 'div');
  assert.equal(controls.root.className, 'video-controls story-video-controls');
  assert.deepEqual(
    controls.root.children.map((child) => child.tagName),
    ['button', 'span', 'div', 'span', 'div'],
  );
  assert.deepEqual(controls.progress.children, [controls.progressFill]);
  assert.deepEqual(controls.progressFill.children, [controls.progressKnob]);
  assert.deepEqual(
    controls.volumeControl.children.map((child) => child.tagName),
    ['button', 'input'],
  );
  assert.equal(controls.volumeControl.children[0], controls.volumeToggle);
  assert.equal(controls.volumeControl.children[1], controls.volume);
  assert.equal(controls.progressKnob.className, 'media-progress-knob');
});

test('sets the class, text and attributes of each control', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), { label: '歌词' });
  assert.equal(controls.playButton.type, 'button');
  assert.equal(controls.playButton.className, 'video-play-btn story-video-play-btn');
  assert.ok(controls.playButton.innerHTML.includes('story-video-play-icon'));
  assert.ok(controls.playButton.innerHTML.includes('story-video-pause-icon'));
  assert.deepEqual(controls.playButton.attributes, { 'aria-label': '播放歌词' });
  assert.equal(controls.currentTime.className, 'video-time-current');
  assert.equal(controls.currentTime.textContent, '0:00');
  assert.deepEqual(controls.currentTime.attributes, {});
  assert.deepEqual(controls.progress.attributes, {
    role: 'slider',
    'aria-disabled': 'false',
    tabindex: '0',
    'aria-label': '歌词播放进度',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '0',
  });
  assert.equal(controls.totalTime.textContent, '0:00');
  assert.equal(controls.totalTime.className, 'video-time-total');
  assert.equal(controls.volumeToggle.type, 'button');
  assert.equal(controls.volumeToggle.className, 'story-video-volume-toggle');
  assert.equal(controls.volumeToggle.innerHTML.includes('stroke-width'), true);
  assert.deepEqual(controls.volumeToggle.attributes, {
    'aria-label': '静音歌词',
    'aria-pressed': 'false',
  });
  assert.equal(controls.volume.type, 'range');
  assert.equal(controls.volume.className, 'story-video-volume-slider');
  assert.equal(controls.volume.min, '0');
  assert.equal(controls.volume.max, '100');
  assert.equal(controls.volume.step, '1');
  assert.equal(controls.volume.value, '100');
  assert.deepEqual(controls.volume.attributes, {
    'aria-label': '歌词音量',
    'aria-valuetext': '100%',
  });
});

test('creates every element through the provided document', () => {
  const doc = makeDocument();
  const controls = createWorkspaceVideoPlaybackControls(doc);
  assert.equal(doc.created.length, 10);
  assert.equal(doc.created[0], controls.root);
  assert.deepEqual(
    doc.created.map((element) => element.tagName),
    ['div', 'button', 'span', 'div', 'div', 'div', 'span', 'div', 'button', 'input'],
  );
});

test('disables every interactive control when asked', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), { disabled: true });
  assert.equal(controls.playButton.disabled, true);
  assert.equal(controls.playButton.attributes.disabled, '');
  assert.equal(controls.volumeToggle.disabled, true);
  assert.equal(controls.volumeToggle.attributes.disabled, '');
  assert.equal(controls.volume.disabled, true);
  assert.equal(controls.volume.attributes.disabled, '');
  assert.equal(controls.progress.attributes['aria-disabled'], 'true');
  assert.equal(controls.progress.attributes.tabindex, '-1');
  assert.equal('disabled' in controls.root.attributes, false);
  assert.equal('disabled' in controls.currentTime.attributes, false);
});

test('treats a truthy non-boolean disabled flag as an attribute only', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), { disabled: 1 });
  assert.equal(controls.playButton.disabled, false);
  assert.equal(controls.playButton.attributes.disabled, '');
  assert.equal(controls.volume.disabled, false);
  assert.equal(controls.volume.attributes.disabled, '');
  assert.equal(controls.progress.attributes['aria-disabled'], 'false');
  assert.equal(controls.progress.attributes.tabindex, '-1');
  assert.ok(renderWorkspaceVideoPlaybackControls({ disabled: 1 }).includes('aria-disabled="1"'));
});

test('applies every attribute bag to the matching element', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), {
    className: 'x',
    controlsAttributes: { 'data-a': '1', hidden: true, gone: false, nil: null, zero: 0 },
    playAttributes: { 'data-play': '1' },
    currentTimeAttributes: { 'data-cur': '1' },
    progressAttributes: { 'data-prog': '1' },
    progressFillAttributes: { 'data-fill': '1' },
    totalTimeAttributes: { 'data-total': '1' },
    volumeAttributes: { 'data-vol': '1' },
    volumeToggleAttributes: { 'data-vt': '1' },
  });
  assert.equal(controls.root.className, 'video-controls story-video-controls x');
  assert.deepEqual(controls.root.attributes, { 'data-a': '1', hidden: '', zero: '0' });
  assert.deepEqual(controls.playButton.attributes, { 'aria-label': '播放视频', 'data-play': '1' });
  assert.equal(controls.currentTime.attributes['data-cur'], '1');
  assert.equal(controls.progress.attributes['data-prog'], '1');
  assert.equal(controls.progress.attributes.role, 'slider');
  assert.equal(controls.progressFill.attributes['data-fill'], '1');
  assert.equal(controls.totalTime.attributes['data-total'], '1');
  assert.equal(controls.volume.attributes['data-vol'], '1');
  assert.equal(controls.volumeToggle.attributes['data-vt'], '1');
});

test('sets a title attribute when playTitle is provided', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), { playTitle: '标题' });
  assert.equal(controls.playButton.attributes.title, '标题');
  const plain = createWorkspaceVideoPlaybackControls(makeDocument());
  assert.equal('title' in plain.playButton.attributes, false);
});

test('uses an explicit class name for the root element', () => {
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), { className: 'player-x' });
  assert.equal(controls.root.className, 'video-controls story-video-controls player-x');
});

test('appends slot children in order and skips invalid ones', () => {
  const afterPlay = makeElement('i');
  const beforeVolume = makeElement('u');
  const slotList = Object.freeze([afterPlay, null, 7, 'x']);
  const slots = { afterPlay: slotList, beforeVolume, afterVolume: undefined };
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), { slots });
  assert.deepEqual(
    controls.root.children.map((child) => child.tagName),
    ['button', 'i', 'span', 'div', 'span', 'u', 'div'],
  );
  assert.equal(slotList.length, 4);
  assert.deepEqual(slots.afterVolume, undefined);
});

test('wraps a single non-array slot child', () => {
  const afterVolume = makeElement('b');
  const controls = createWorkspaceVideoPlaybackControls(makeDocument(), {
    slots: { afterVolume },
  });
  assert.equal(controls.root.children[controls.root.children.length - 1], afterVolume);
  assert.ok(controls.root.children.includes(afterVolume));
});

test('does not mutate the options given to the factory', () => {
  const slots = { afterPlay: makeElement('i') };
  const options = {
    className: 'x',
    controlsAttributes: { 'data-a': '1' },
    slots,
    label: '视频',
  };
  const keys = Object.keys(options).sort();
  createWorkspaceVideoPlaybackControls(makeDocument(), options);
  assert.deepEqual(Object.keys(options).sort(), keys);
  assert.deepEqual(options.controlsAttributes, { 'data-a': '1' });
  assert.equal(options.label, '视频');
  assert.deepEqual(Object.keys(slots), ['afterPlay']);
});
