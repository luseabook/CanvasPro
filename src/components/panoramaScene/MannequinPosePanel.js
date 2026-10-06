import {
  PANORAMA_CHARACTER_BONES,
  listMannequinPosePresets,
  normalizeBonePose,
} from '../../modules/panoramaSceneNode/poseCatalog.js';
import { t } from '../../i18n/index.js';
function sceneText(value, item = {}) {
  return t('panoramaSceneNode.poseEditor.' + value, item);
}
function syncStaticText(el) {
  const el2 = el.querySelector('.panorama-pose-panel__title');
  if (el2) el2.textContent = sceneText('title');
  const el3 = el.querySelector('.panorama-pose-panel__preset');
  if (el3) el3.setAttribute('aria-label', sceneText('presetAria'));
  const el4 = el3?.querySelector?.('[value="custom"]');
  if (el4) el4.textContent = sceneText('custom');
  const el5 = el.querySelector('.panorama-pose-panel__bone');
  el5 &&
    (el5.setAttribute('aria-label', sceneText('boneAria')),
    Array.from(el5.options).forEach((el6) => {
      el6.textContent = sceneText('bones.' + el6.value);
    }));
  const el7 = el.querySelector('.panorama-pose-panel__save');
  if (el7) el7.textContent = sceneText('saveCustom');
}
function syncCustomPoseOptions(el8, key) {
  const el9 = el8.querySelector('.panorama-pose-panel__preset');
  if (!el9) return;
  (el9.querySelectorAll('[data-custom-pose-option]').forEach((el10) => el10.remove()),
    (Array.isArray(key?.customPoses) ? key.customPoses : []).forEach((error) => {
      if (!error?.id || error.id === 'custom') return;
      const el11 = document.createElement('option');
      ((el11.value = error.id),
        (el11.dataset.customPoseOption = '1'),
        (el11.textContent = error.name || sceneText('custom')),
        el9.appendChild(el11));
    }));
}
function selectedMannequin(index) {
  if (index?.selection?.selectedObjectType !== 'mannequin') return null;
  const result = index.selection.selectedObjectId;
  return index.mannequins?.find((data) => data.id === result) || null;
}
function radiansToDegrees(options) {
  return Math.round(((Number(options) || 0) * 180) / Math.PI);
}
function degreesToRadians(target) {
  return ((Number(target) || 0) * Math.PI) / 180;
}
function syncAxisControls(el12) {
  const source = el12.querySelector('.panorama-pose-panel__bone')?.value || 'pelvis',
    next = el12._draftBonePose?.[source] || { x: 0, y: 0, z: 0 };
  el12.querySelectorAll('[data-pose-axis]').forEach((el13) => {
    const current = el13.dataset.poseAxis;
    el13.value = String(radiansToDegrees(next[current]));
    const el14 = el12.querySelector('[data-pose-value="' + current + '"]');
    if (el14) el14.textContent = el13.value + '°';
  });
}
function updateDraftFromControl(el15, el16) {
  const entry = el15.querySelector('.panorama-pose-panel__bone')?.value || 'pelvis',
    record = el16.dataset.poseAxis,
    args = el15._draftBonePose?.[entry] || { x: 0, y: 0, z: 0 };
  el15._draftBonePose = normalizeBonePose({
    ...(el15._draftBonePose || {}),
    [entry]: { ...args, [record]: degreesToRadians(el16.value) },
  });
  const el17 = el15.querySelector('[data-pose-value="' + record + '"]');
  if (el17) el17.textContent = el16.value + '°';
}
export function createMannequinPosePanel({
  onApplyPreset: onApplyPreset,
  onPreview: onPreview,
  onCommit: onCommit,
  onSaveCustom: onSaveCustom,
} = {}) {
  const bones = document.createElement('div');
  ((bones.className = 'panorama-pose-panel'),
    (bones.dataset.uiStop = '1'),
    (bones._draftBonePose = {}));
  const payload = document.createElement('div');
  payload.className = 'panorama-pose-panel__header';
  const handle = document.createElement('strong');
  handle.className = 'panorama-pose-panel__title';
  const el18 = document.createElement('select');
  ((el18.className = 'panorama-pose-panel__preset'),
    el18.append(
      ...listMannequinPosePresets().map((error2) => {
        const el19 = document.createElement('option');
        return ((el19.value = error2.id), (el19.textContent = error2.name), el19);
      }),
    ));
  const el20 = document.createElement('option');
  ((el20.value = 'custom'), el18.appendChild(el20), payload.append(handle, el18));
  const el21 = document.createElement('div');
  el21.className = 'panorama-pose-panel__bone-row';
  const el22 = document.createElement('select');
  ((el22.className = 'panorama-pose-panel__bone'),
    el22.append(
      ...PANORAMA_CHARACTER_BONES.map((state) => {
        const el23 = document.createElement('option');
        return ((el23.value = state), el23);
      }),
    ),
    (el22.value = 'pelvis'),
    el21.appendChild(el22));
  const el24 = document.createElement('div');
  ((el24.className = 'panorama-pose-panel__sliders'),
    ['x', 'y', 'z'].forEach((config) => {
      const scope = document.createElement('label');
      scope.className = 'panorama-pose-panel__axis';
      const el25 = document.createElement('span');
      el25.textContent = config.toUpperCase();
      const el26 = document.createElement('input');
      ((el26.type = 'range'),
        (el26.min = '-180'),
        (el26.max = '180'),
        (el26.step = '1'),
        (el26.value = '0'),
        (el26.dataset.poseAxis = config));
      const el27 = document.createElement('output');
      ((el27.dataset.poseValue = config),
        (el27.textContent = '0°'),
        scope.append(el25, el26, el27),
        el24.appendChild(scope));
    }));
  const el28 = document.createElement('button');
  return (
    (el28.type = 'button'),
    (el28.className = 'panorama-pose-panel__save'),
    bones.append(payload, el21, el24, el28),
    el18.addEventListener('change', () => {
      if (el18.value === 'custom') return;
      onApplyPreset?.(el18.value);
    }),
    el22.addEventListener('change', () => syncAxisControls(bones)),
    el24.addEventListener('input', (event) => {
      const enabled = event.target?.closest?.('[data-pose-axis]');
      if (!enabled) return;
      (updateDraftFromControl(bones, enabled), onPreview?.(bones._draftBonePose));
    }),
    el24.addEventListener('change', (event2) => {
      const enabled2 = event2.target?.closest?.('[data-pose-axis]');
      if (!enabled2) return;
      (updateDraftFromControl(bones, enabled2), onCommit?.(bones._draftBonePose));
    }),
    el28.addEventListener('click', () => {
      onSaveCustom?.({
        name: sceneText('customName', { suffix: Date.now().toString().slice(-4) }),
        bones: bones._draftBonePose,
      });
    }),
    syncStaticText(bones),
    bones
  );
}
export function renderMannequinPosePanel(el29, input) {
  if (!el29) return;
  (syncStaticText(el29), syncCustomPoseOptions(el29, input));
  const edMannequin = selectedMannequin(input);
  ((el29.dataset.mannequinId = edMannequin?.id || ''),
    el29.classList.toggle('is-disabled', !edMannequin),
    el29.querySelectorAll('select, input, button').forEach((el30) => {
      el30.disabled = !edMannequin;
    }));
  if (!edMannequin) return;
  el29._draftBonePose = normalizeBonePose(edMannequin.bonePose);
  const el31 = el29.querySelector('.panorama-pose-panel__preset');
  if (el31) {
    const output =
      edMannequin.poseId === 'custom' && edMannequin.customPoseId
        ? edMannequin.customPoseId
        : edMannequin.poseId || 'neutral';
    el31.value = Array.from(el31.options).some((el32) => el32.value === output)
      ? output
      : 'custom';
  }
  syncAxisControls(el29);
}
