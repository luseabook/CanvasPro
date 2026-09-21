import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { detectScenes } from '../../api/sceneDetectionApi.js';
import { getDisplayModelName, PROVIDERS_META } from '../modules/providers.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import { generateId, findAvailablePosition } from '../core/math.js';
import { getNodeSpawnPrefs } from '../modules/nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
function sceneDetectionText(_0xcce136, _0x451b7c = {}) {
  return t('sceneDetectionNode.' + _0xcce136, _0x451b7c);
}
const _SCENE_DETECTION_NODE_TEMPLATE =
  '\n  <div class="node-card scene-detection-card" style="width: 100%; height: 100%; padding: 16px; background: var(--white-05); border: 1px solid var(--stroke-08); border-radius: 18px; overflow: hidden; position: relative; display: flex; flex-direction: column; pointer-events: auto;">\n    <div class="scene-detection-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">\n      <h3 class="scene-detection-title" style="margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary);"></h3>\n      <button type="button" class="detect-btn" style="background: var(--blue); color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: var(--link-cursor);">\n      </button>\n    </div>\n    \n    <div class="scene-detection-input" style="margin-bottom: 16px;">\n      <div class="input-label scene-video-source-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;"></div>\n      <div class="ref-bar" style="border: 1px dashed var(--stroke-20); border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: center; min-height: 60px;">\n        <div class="ref-placeholder" style="color: var(--text-muted); font-size: 12px;"></div>\n      </div>\n    </div>\n    \n    <div class="scene-detection-settings" style="margin-bottom: 16px;">\n      <div class="input-label scene-sensitivity-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;"></div>\n      <input type="range" class="sensitivity-slider" min="0.1" max="1" step="0.1" value="0.5" style="width: 100%; accent-color: var(--blue);">\n      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">\n        <span class="scene-sensitivity-low"></span>\n        <span class="scene-sensitivity-high"></span>\n      </div>\n    </div>\n    \n    <div class="scene-detection-results" style="flex: 1; border: 1px solid var(--stroke-10); border-radius: 8px; padding: 12px; overflow-y: auto; margin-bottom: 16px;">\n      <div class="results-placeholder" style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px 0;">\n      </div>\n      <div class="scene-list" style="display: none;">\n        <div class="scene-count" style="font-size: 12px; font-weight: 600; margin-bottom: 8px;"><span class="scene-count-prefix"></span> <span class="count">0</span> <span class="scene-count-suffix"></span></div>\n        <div class="scene-timeline" style="position: relative; height: 40px; background: var(--white-10); border-radius: 4px; margin-bottom: 12px;">\n          <div class="timeline-markers" style="position: absolute; top: 0; left: 0; right: 0; height: 100%; display: flex; align-items: center;"></div>\n        </div>\n        <div class="scene-items" style="display: flex; flex-direction: column; gap: 8px;"></div>\n      </div>\n    </div>\n    \n    <div class="scene-detection-actions" style="display: flex; gap: 8px;">\n      <button type="button" class="auto-clip-btn" style="flex: 1; background: var(--green); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor: var(--link-cursor); display: none;">\n      </button>\n      <button type="button" class="export-btn" style="flex: 1; background: var(--purple); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor: var(--link-cursor); display: none;">\n      </button>\n    </div>\n  </div>\n';
export class SceneDetectionNode {
  constructor(_0x4c1dcb) {
    ((this._data = _0x4c1dcb),
      (this.nodeId = _0x4c1dcb.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component'),
      (this._videoSource = null),
      (this._detectionResults = null),
      (this._isDetecting = false),
      (this._sensitivity = 0.5),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const _0x1a0223 = this.el;
    return (
      (_0x1a0223.innerHTML = _SCENE_DETECTION_NODE_TEMPLATE),
      (this._card = _0x1a0223.querySelector('.scene-detection-card')),
      (this._title = _0x1a0223.querySelector('.scene-detection-title')),
      (this._detectBtn = _0x1a0223.querySelector('.detect-btn')),
      (this._videoSourceLabel = _0x1a0223.querySelector('.scene-video-source-label')),
      (this._refBar = _0x1a0223.querySelector('.ref-bar')),
      (this._refPlaceholder = _0x1a0223.querySelector('.ref-placeholder')),
      (this._sensitivityLabel = _0x1a0223.querySelector('.scene-sensitivity-label')),
      (this._sensitivityLow = _0x1a0223.querySelector('.scene-sensitivity-low')),
      (this._sensitivityHigh = _0x1a0223.querySelector('.scene-sensitivity-high')),
      (this._sensitivitySlider = _0x1a0223.querySelector('.sensitivity-slider')),
      (this._resultsContainer = _0x1a0223.querySelector('.scene-detection-results')),
      (this._resultsPlaceholder = _0x1a0223.querySelector('.results-placeholder')),
      (this._sceneList = _0x1a0223.querySelector('.scene-list')),
      (this._sceneCountPrefix = _0x1a0223.querySelector('.scene-count-prefix')),
      (this._sceneCountSuffix = _0x1a0223.querySelector('.scene-count-suffix')),
      (this._sceneCount = _0x1a0223.querySelector('.scene-count .count')),
      (this._timelineMarkers = _0x1a0223.querySelector('.timeline-markers')),
      (this._sceneItems = _0x1a0223.querySelector('.scene-items')),
      (this._autoClipBtn = _0x1a0223.querySelector('.auto-clip-btn')),
      (this._exportBtn = _0x1a0223.querySelector('.export-btn')),
      this._detectBtn.addEventListener('click', () => this._startDetection()),
      this._sensitivitySlider.addEventListener('input', (_0x5d4be9) => {
        this._sensitivity = parseFloat(_0x5d4be9.target.value);
      }),
      this._autoClipBtn.addEventListener('click', () => this._autoClip()),
      this._exportBtn.addEventListener('click', () => this._exportScenes()),
      this._syncLocaleTexts(),
      this._checkVideoInput(),
      _0x1a0223
    );
  }
  ['_checkVideoInput']() {
    const _0x1cd21b = appStore.getIncomingEdges(this.nodeId) || [];
    if (_0x1cd21b.length > 0) {
      const _0x35a6b3 = _0x1cd21b[0],
        _0x5cde0a = appStore.getState().nodes[_0x35a6b3.sourceId];
      _0x5cde0a &&
        (_0x5cde0a.type === 'source-video' || _0x5cde0a.type.includes('video')) &&
        ((this._videoSource = _0x5cde0a),
        (this._refPlaceholder.textContent = _0x5cde0a.name || sceneDetectionText('input.videoSource')),
        (this._refBar.style.borderStyle = 'solid'),
        (this._refBar.style.borderColor = 'var(--blue)'));
    }
  }
  async ['_startDetection']() {
    if (!this._videoSource) {
      window.showToast(sceneDetectionText('toasts.connectVideoFirst'), 'error');
      return;
    }
    if (this._isDetecting) return;
    const _0x20fa38 = this._videoSource.src || this._videoSource.videoUrl;
    if (!_0x20fa38) {
      window.showToast(sceneDetectionText('toasts.invalidVideoSource'), 'error');
      return;
    }
    ((this._isDetecting = true),
      startLoading(this._card),
      (this._detectBtn.textContent = sceneDetectionText('actions.detecting')),
      (this._detectBtn.disabled = true));
    try {
      const _0x2bfc81 = await detectScenes({
        videoUrl: _0x20fa38,
        provider: 'grsai',
        sensitivity: this._sensitivity,
      });
      ((this._detectionResults = _0x2bfc81),
        this._displayResults(_0x2bfc81),
        appStore.updateNodeData(this.nodeId, { sceneDetectionResults: _0x2bfc81 }),
        window.showToast(sceneDetectionText('toasts.detected', { count: _0x2bfc81.sceneCount }), 'success'));
    } catch (_0x2dd53b) {
      (console.error('场景检测失败:', _0x2dd53b),
        window.showToast(sceneDetectionText('toasts.detectFailed'), 'error'));
    } finally {
      ((this._isDetecting = false),
        stopLoading(this._card),
        (this._detectBtn.textContent = sceneDetectionText('actions.startDetection')),
        (this._detectBtn.disabled = false));
    }
  }
  ['_displayResults'](_0x27dcfd) {
    ((this._resultsPlaceholder.style.display = 'none'),
      (this._sceneList.style.display = 'block'),
      (this._autoClipBtn.style.display = 'block'),
      (this._exportBtn.style.display = 'block'),
      (this._sceneCount.textContent = _0x27dcfd.sceneCount),
      (this._timelineMarkers.innerHTML = ''));
    const _0x5843d3 = _0x27dcfd.sceneChanges;
    (_0x5843d3.forEach((_0x346e56, _0x409a8e) => {
      const _0xe85a3f = document.createElement('div');
      ((_0xe85a3f.style.position = 'absolute'),
        (_0xe85a3f.style.left = (_0x346e56 / 100) * 100 + '%'),
        (_0xe85a3f.style.width = '2px'),
        (_0xe85a3f.style.height = '100%'),
        (_0xe85a3f.style.background = 'var(--red)'),
        (_0xe85a3f.style.cursor = 'var(--link-cursor)'),
        (_0xe85a3f.title = sceneDetectionText('timeline.changeAt', { time: this._formatTime(_0x346e56) })),
        this._timelineMarkers.appendChild(_0xe85a3f));
    }),
      (this._sceneItems.innerHTML = ''));
    let _0x3e5da3 = 0;
    for (let _0x381bfe = 0; _0x381bfe < _0x27dcfd.sceneCount; _0x381bfe++) {
      const _0xdfd2eb = _0x381bfe < _0x27dcfd.sceneChanges.length ? _0x27dcfd.sceneChanges[_0x381bfe] : 100,
        _0x4dadad = document.createElement('div');
      ((_0x4dadad.className = 'scene-item'),
        (_0x4dadad.style.display = 'flex'),
        (_0x4dadad.style.justifyContent = 'space-between'),
        (_0x4dadad.style.alignItems = 'center'),
        (_0x4dadad.style.padding = '8px'),
        (_0x4dadad.style.background = 'var(--white-10)'),
        (_0x4dadad.style.borderRadius = '4px'));
      const _0x8db13a = sceneDetectionText('scene.label', { index: _0x381bfe + 1 }),
        _0x5987fd = sceneDetectionText('actions.clip');
      ((_0x4dadad.innerHTML =
        '\n        <div style="font-size: 12px;">' +
        _0x8db13a +
        '</div>\n        <div style="font-size: 11px; color: var(--text-secondary);">' +
        this._formatTime(_0x3e5da3) +
        ' - ' +
        this._formatTime(_0xdfd2eb) +
        '</div>\n        <button type="button" class="clip-btn" data-index="' +
        _0x381bfe +
        '" style="background: var(--blue); color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: var(--link-cursor);">\n          ' +
        _0x5987fd +
        '\n        </button>\n      '),
        this._sceneItems.appendChild(_0x4dadad),
        (_0x3e5da3 = _0xdfd2eb));
    }
    this._sceneItems.querySelectorAll('.clip-btn').forEach((_0x2a18f1) => {
      _0x2a18f1.addEventListener('click', (_0xc860e2) => {
        const _0x236ced = parseInt(_0xc860e2.target.dataset.index);
        this._clipScene(_0x236ced);
      });
    });
  }
  ['_formatTime'](_0x158bf6) {
    const _0x365927 = Math.floor(_0x158bf6 / 60),
      _0x1a10fe = Math.floor(_0x158bf6 % 60);
    return _0x365927 + ':' + _0x1a10fe.toString().padStart(2, '0');
  }
  ['_autoClip']() {
    if (!this._detectionResults) return;
    const _0x5aca05 = this._detectionResults.sceneChanges;
    let _0x56b9b6 = 0;
    for (let _0x227e45 = 0; _0x227e45 < this._detectionResults.sceneCount; _0x227e45++) {
      const _0x3a2943 = _0x227e45 < _0x5aca05.length ? _0x5aca05[_0x227e45] : 100;
      (this._createClipNode(_0x56b9b6, _0x3a2943, _0x227e45 + 1), (_0x56b9b6 = _0x3a2943));
    }
    window.showToast(
      sceneDetectionText('toasts.createdClipNodes', { count: this._detectionResults.sceneCount }),
      'success',
    );
  }
  ['_clipScene'](_0x388c12) {
    if (!this._detectionResults) return;
    const _0x27adc1 = this._detectionResults.sceneChanges;
    let _0xdadaad = 0,
      _0x5702bd = 100;
    for (let _0x18a277 = 0; _0x18a277 <= _0x388c12; _0x18a277++) {
      if (_0x18a277 === _0x388c12) {
        _0x5702bd = _0x18a277 < _0x27adc1.length ? _0x27adc1[_0x18a277] : 100;
        break;
      }
      _0xdadaad = _0x27adc1[_0x18a277];
    }
    (this._createClipNode(_0xdadaad, _0x5702bd, _0x388c12 + 1),
      window.showToast(
        sceneDetectionText('toasts.createdSceneClipNode', { index: _0x388c12 + 1 }),
        'success',
      ));
  }
  ['_createClipNode'](_0x190050, _0x4aae1e, _0x2b734a) {
    if (!this._videoSource) return;
    const { spacing: _0x4d40da, direction: _0x411418, avoidOverlap: _0xbc5502 } = getNodeSpawnPrefs(),
      _0x263d5c = _0x411418 === 'down' ? 'down' : 'right',
      _0x3b121b = Number(this._data.x) || 0,
      _0x48f3ac = Number(this._data.y) || 0,
      _0x3dce47 = Number(this._data.width) || 0x200,
      _0xd2ff5 = Number(this._data.height) || 0x120,
      _0x415cc6 = getAutoMediaSizeByShortSide(_0x3dce47, _0xd2ff5),
      _0xc251e0 = _0x3b121b + _0x3dce47 + _0x4d40da,
      _0x468210 =
        _0x263d5c === 'down'
          ? _0x48f3ac + _0xd2ff5 + _0x4d40da
          : _0x48f3ac + Math.round((_0xd2ff5 - _0x415cc6.height) / 2),
      _0x2813c8 = _0xbc5502
        ? findAvailablePosition(
            appStore.getState().nodes || {},
            _0xc251e0,
            _0x468210,
            _0x415cc6.width,
            _0x415cc6.height,
            _0x4d40da,
            _0x263d5c,
          )
        : { x: _0xc251e0, y: _0x468210 },
      _0x246fa8 = generateId('node');
    (appStore.addNode(
      buildSourceMediaNodePayload({
        id: _0x246fa8,
        type: 'source-video',
        name: sceneDetectionText('scene.label', { index: _0x2b734a }),
        src: this._videoSource.src,
        localPath: this._videoSource.localPath,
        clipStart: _0x190050,
        clipEnd: _0x4aae1e,
        x: _0x2813c8.x,
        y: _0x2813c8.y,
        width: _0x415cc6.width,
        height: _0x415cc6.height,
        needsAutoResize: false,
      }),
    ),
      appStore.addEdge({
        id: generateId('edge'),
        sourceId: this.nodeId,
        targetId: _0x246fa8,
        refSlot: 'scene',
      }));
  }
  ['_exportScenes']() {
    if (!this._detectionResults) return;
    const _0x55088e = {
      videoSource: this._videoSource?.name || sceneDetectionText('export.unknownVideo'),
      sceneCount: this._detectionResults.sceneCount,
      scenes: [],
    };
    let _0x47f1df = 0;
    for (let _0x31cd02 = 0; _0x31cd02 < this._detectionResults.sceneCount; _0x31cd02++) {
      const _0x15a298 =
        _0x31cd02 < this._detectionResults.sceneChanges.length
          ? this._detectionResults.sceneChanges[_0x31cd02]
          : 100;
      (_0x55088e.scenes.push({
        number: _0x31cd02 + 1,
        startTime: _0x47f1df,
        endTime: _0x15a298,
        duration: _0x15a298 - _0x47f1df,
      }),
        (_0x47f1df = _0x15a298));
    }
    const _0x5ef76b = new Blob([JSON.stringify(_0x55088e, null, 2)], { type: 'application/json' }),
      _0x29f410 = URL.createObjectURL(_0x5ef76b),
      _0x37ad64 = document.createElement('a');
    ((_0x37ad64.href = _0x29f410),
      (_0x37ad64.download = 'scenes_' + Date.now() + '.json'),
      _0x37ad64.click(),
      URL.revokeObjectURL(_0x29f410),
      window.showToast(sceneDetectionText('toasts.exported'), 'success'));
  }
  ['update'](_0x561643) {
    ((this._data = _0x561643),
      this._checkVideoInput(),
      _0x561643.sceneDetectionResults &&
        ((this._detectionResults = _0x561643.sceneDetectionResults),
        this._displayResults(_0x561643.sceneDetectionResults)));
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => {
      this._syncLocaleTexts();
      if (this._detectionResults) this._displayResults(this._detectionResults);
    });
  }
  ['_syncLocaleTexts']() {
    if (this._title) this._title.textContent = sceneDetectionText('title');
    (this._detectBtn &&
      (this._detectBtn.textContent = this._isDetecting
        ? sceneDetectionText('actions.detecting')
        : sceneDetectionText('actions.startDetection')),
      this._videoSourceLabel &&
        (this._videoSourceLabel.textContent = sceneDetectionText('input.videoSource')),
      this._refPlaceholder &&
        (this._refPlaceholder.textContent =
          this._videoSource?.name ||
          (this._videoSource
            ? sceneDetectionText('input.videoSource')
            : sceneDetectionText('input.dropVideoHere'))),
      this._sensitivityLabel &&
        (this._sensitivityLabel.textContent = sceneDetectionText('settings.sensitivity')),
      this._sensitivityLow && (this._sensitivityLow.textContent = sceneDetectionText('settings.low')),
      this._sensitivityHigh && (this._sensitivityHigh.textContent = sceneDetectionText('settings.high')),
      this._resultsPlaceholder &&
        (this._resultsPlaceholder.textContent = sceneDetectionText('results.placeholder')),
      this._sceneCountPrefix &&
        (this._sceneCountPrefix.textContent = sceneDetectionText('results.countPrefix')),
      this._sceneCountSuffix &&
        (this._sceneCountSuffix.textContent = sceneDetectionText('results.countSuffix')),
      this._autoClipBtn && (this._autoClipBtn.textContent = sceneDetectionText('actions.autoClip')),
      this._exportBtn && (this._exportBtn.textContent = sceneDetectionText('actions.exportScenes')));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(), (this._unsubscribeLocale = null));
  }
}
