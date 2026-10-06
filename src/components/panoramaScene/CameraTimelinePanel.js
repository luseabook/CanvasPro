import { normalizeCameraTimeline } from '../../modules/panoramaSceneNode/cameraTimeline.js';
import { t } from '../../i18n/index.js';
function sceneText(value, item = {}) {
  return t('panoramaSceneNode.cameraTimeline.' + value, item);
}
function formatTime(key) {
  return Math.max(0, Number(key) || 0).toFixed(2) + 's';
}
function syncStaticText(el, { isPlaying: isPlaying = false } = {}) {
  const el2 = el.querySelector('.panorama-camera-timeline__play');
  el2 &&
    ((el2.textContent = isPlaying ? 'Ⅱ' : '▶'),
    (el2.title = sceneText(isPlaying ? 'pause' : 'play')),
    el2.setAttribute('aria-label', sceneText(isPlaying ? 'pauseAria' : 'playAria')));
  const el3 = el.querySelector('.panorama-camera-timeline__add');
  el3 &&
    ((el3.title = sceneText('addKeyframe')),
    el3.setAttribute('aria-label', sceneText('addKeyframeAria')));
  const el4 = el.querySelector('.panorama-camera-timeline__track');
  if (el4) el4.setAttribute('aria-label', sceneText('trackAria'));
  const el5 = el.querySelector('.panorama-camera-timeline__duration');
  el5 &&
    ((el5.title = sceneText('duration')), el5.setAttribute('aria-label', sceneText('durationAria')));
  const el6 = el.querySelector('.panorama-camera-timeline__fps');
  el6 && ((el6.title = sceneText('fps')), el6.setAttribute('aria-label', sceneText('fpsAria')));
  const el7 = el.querySelector('.panorama-camera-timeline__loop-text');
  if (el7) el7.textContent = sceneText('loop');
}
export function createCameraTimelinePanel({
  onAddKeyframe: onAddKeyframe,
  onPlayToggle: onPlayToggle,
  onScrub: onScrub,
  onScrubCommit: onScrubCommit,
  onDeleteKeyframe: onDeleteKeyframe,
  onSettingsChange: onSettingsChange,
} = {}) {
  const el8 = document.createElement('div');
  ((el8.className = 'panorama-camera-timeline'), (el8.dataset.uiStop = '1'));
  const el9 = document.createElement('button');
  ((el9.type = 'button'),
    (el9.className = 'panorama-camera-timeline__icon panorama-camera-timeline__play'));
  const el10 = document.createElement('button');
  ((el10.type = 'button'),
    (el10.className = 'panorama-camera-timeline__icon panorama-camera-timeline__add'),
    (el10.textContent = '+'));
  const el11 = document.createElement('output');
  ((el11.className = 'panorama-camera-timeline__time'), (el11.textContent = '0.00s'));
  const index = document.createElement('div');
  index.className = 'panorama-camera-timeline__track-wrap';
  const el12 = document.createElement('input');
  ((el12.type = 'range'),
    (el12.className = 'panorama-camera-timeline__track'),
    (el12.min = '0'),
    (el12.max = '6'),
    (el12.step = '0.01'),
    (el12.value = '0'));
  const el13 = document.createElement('div');
  ((el13.className = 'panorama-camera-timeline__markers'), index.append(el12, el13));
  const el14 = document.createElement('input');
  ((el14.type = 'number'),
    (el14.className = 'panorama-camera-timeline__duration'),
    (el14.min = '0.1'),
    (el14.max = '3600'),
    (el14.step = '0.5'),
    (el14.value = '6'));
  const el15 = document.createElement('select');
  ((el15.className = 'panorama-camera-timeline__fps'),
    [12, 24, 25, 30, 50, 60].forEach((result) => {
      const el16 = document.createElement('option');
      ((el16.value = String(result)), (el16.textContent = result + ' FPS'), el15.appendChild(el16));
    }));
  const data = document.createElement('label');
  data.className = 'panorama-camera-timeline__loop';
  const loop = document.createElement('input');
  loop.type = 'checkbox';
  const options = document.createElement('span');
  return (
    (options.className = 'panorama-camera-timeline__loop-text'),
    data.append(loop, options),
    el8.append(el9, el10, el11, index, el14, el15, data),
    el9.addEventListener('click', () => onPlayToggle?.()),
    el10.addEventListener('click', () => onAddKeyframe?.(Number(el12.value) || 0)),
    el12.addEventListener('input', () => {
      const target = Number(el12.value) || 0;
      ((el11.textContent = formatTime(target)), onScrub?.(target));
    }),
    el12.addEventListener('change', () => onScrubCommit?.(Number(el12.value) || 0)),
    el14.addEventListener('change', () => {
      onSettingsChange?.({ duration: Number(el14.value) || 6 });
    }),
    el15.addEventListener('change', () => {
      onSettingsChange?.({ fps: Number(el15.value) || 24 });
    }),
    loop.addEventListener('change', () => {
      onSettingsChange?.({ loop: loop.checked });
    }),
    el13.addEventListener('click', (event) => {
      const el17 = event.target?.closest?.('[data-keyframe-id]');
      if (!el17) return;
      if (event.shiftKey) {
        onDeleteKeyframe?.(el17.dataset.keyframeId);
        return;
      }
      const source = Number(el17.dataset.keyframeTime) || 0;
      ((el12.value = String(source)), (el11.textContent = formatTime(source)), onScrub?.(source));
    }),
    el13.addEventListener('contextmenu', (event2) => {
      const el18 = event2.target?.closest?.('[data-keyframe-id]');
      if (!el18) return;
      (event2.preventDefault(), onDeleteKeyframe?.(el18.dataset.keyframeId));
    }),
    syncStaticText(el8),
    el8
  );
}
export function renderCameraTimelinePanel(
  el19,
  next,
  { currentTime: currentTime, isPlaying: isPlaying2 } = {},
) {
  if (!el19) return;
  const args = normalizeCameraTimeline(next),
    current = Math.max(
      0,
      Math.min(args.duration, Number.isFinite(currentTime) ? currentTime : args.currentTime),
    ),
    el20 = el19.querySelector('.panorama-camera-timeline__track');
  el20 &&
    ((el20.max = String(args.duration)),
    (el20.step = String(1 / args.fps)),
    (el20.value = String(current)));
  const el21 = el19.querySelector('.panorama-camera-timeline__time');
  if (el21) el21.textContent = formatTime(current);
  const el22 = el19.querySelector('.panorama-camera-timeline__duration');
  if (el22) el22.value = String(args.duration);
  const el23 = el19.querySelector('.panorama-camera-timeline__fps');
  if (el23) el23.value = String(args.fps);
  const entry = el19.querySelector('.panorama-camera-timeline__loop input');
  if (entry) entry.checked = args.loop;
  syncStaticText(el19, { isPlaying: isPlaying2 });
  const record = el19.querySelector('.panorama-camera-timeline__markers');
  record &&
    record.replaceChildren(
      ...args.keyframes.map((payload) => {
        const el24 = document.createElement('button');
        ((el24.type = 'button'),
          (el24.className = 'panorama-camera-timeline__marker'),
          (el24.dataset.keyframeId = payload.id),
          (el24.dataset.keyframeTime = String(payload.time)));
        const frame = Math.round(payload.time * args.fps),
          handle = args.duration > 0 ? (payload.time / args.duration) * 100 : 0;
        return (
          el24.style.setProperty('--panorama-keyframe-position', handle + '%'),
          (el24.title = sceneText('keyframeTitle', {
            time: formatTime(payload.time),
            frame: frame,
          })),
          el24.setAttribute(
            'aria-label',
            sceneText('keyframeAria', { time: formatTime(payload.time), frame: frame }),
          ),
          el24.classList.toggle(
            'is-current',
            Math.abs(payload.time - current) <= 0.5 / args.fps,
          ),
          el24
        );
      }),
    );
}
export function setCameraTimelineDisplayTime(el25, state) {
  if (!el25) return;
  const el26 = el25.querySelector('.panorama-camera-timeline__track'),
    el27 = el25.querySelector('.panorama-camera-timeline__time');
  if (el26) el26.value = String(state);
  if (el27) el27.textContent = formatTime(state);
}
