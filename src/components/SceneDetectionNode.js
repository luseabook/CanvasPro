import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { detectScenes } from '../../api/sceneDetectionApi.js';
import { getDisplayModelName, PROVIDERS_META } from '../modules/providers.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import { generateId, findAvailablePosition } from '../core/math.js';
import { getNodeSpawnPrefs } from '../modules/nodeSpawn.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
function sceneDetectionText(value, item = {}) {
  return t('sceneDetectionNode.' + value, item);
}
const _SCENE_DETECTION_NODE_TEMPLATE =
  '\n  <div class="node-card scene-detection-card" style="width: 100%; height: 100%; padding: 16px; background: var(--white-05); border: 1px solid var(--stroke-08); border-radius: 18px; overflow: hidden; position: relative; display: flex; flex-direction: column; pointer-events: auto;">\n    <div class="scene-detection-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">\n      <h3 class="scene-detection-title" style="margin: 0; font-size: 16px; font-weight: 600; color: var(--text-primary);"></h3>\n      <button type="button" class="detect-btn" style="background: var(--blue); color: white; border: none; border-radius: 8px; padding: 6px 12px; font-size: 12px; cursor: var(--link-cursor);">\n      </button>\n    </div>\n    \n    <div class="scene-detection-input" style="margin-bottom: 16px;">\n      <div class="input-label scene-video-source-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;"></div>\n      <div class="ref-bar" style="border: 1px dashed var(--stroke-20); border-radius: 8px; padding: 12px; display: flex; align-items: center; justify-content: center; min-height: 60px;">\n        <div class="ref-placeholder" style="color: var(--text-muted); font-size: 12px;"></div>\n      </div>\n    </div>\n    \n    <div class="scene-detection-settings" style="margin-bottom: 16px;">\n      <div class="input-label scene-sensitivity-label" style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;"></div>\n      <input type="range" class="sensitivity-slider" min="0.1" max="1" step="0.1" value="0.5" style="width: 100%; accent-color: var(--blue);">\n      <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); margin-top: 4px;">\n        <span class="scene-sensitivity-low"></span>\n        <span class="scene-sensitivity-high"></span>\n      </div>\n    </div>\n    \n    <div class="scene-detection-results" style="flex: 1; border: 1px solid var(--stroke-10); border-radius: 8px; padding: 12px; overflow-y: auto; margin-bottom: 16px;">\n      <div class="results-placeholder" style="color: var(--text-muted); font-size: 12px; text-align: center; padding: 20px 0;">\n      </div>\n      <div class="scene-list" style="display: none;">\n        <div class="scene-count" style="font-size: 12px; font-weight: 600; margin-bottom: 8px;"><span class="scene-count-prefix"></span> <span class="count">0</span> <span class="scene-count-suffix"></span></div>\n        <div class="scene-timeline" style="position: relative; height: 40px; background: var(--white-10); border-radius: 4px; margin-bottom: 12px;">\n          <div class="timeline-markers" style="position: absolute; top: 0; left: 0; right: 0; height: 100%; display: flex; align-items: center;"></div>\n        </div>\n        <div class="scene-items" style="display: flex; flex-direction: column; gap: 8px;"></div>\n      </div>\n    </div>\n    \n    <div class="scene-detection-actions" style="display: flex; gap: 8px;">\n      <button type="button" class="auto-clip-btn" style="flex: 1; background: var(--green); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor: var(--link-cursor); display: none;">\n      </button>\n      <button type="button" class="export-btn" style="flex: 1; background: var(--purple); color: white; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; cursor: var(--link-cursor); display: none;">\n      </button>\n    </div>\n  </div>\n';
export class SceneDetectionNode {
  constructor(key) {
    ((this._data = key),
      (this.nodeId = key.id),
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
    const el = this.el;
    return (
      (el.innerHTML = _SCENE_DETECTION_NODE_TEMPLATE),
      (this._card = el.querySelector('.scene-detection-card')),
      (this._title = el.querySelector('.scene-detection-title')),
      (this._detectBtn = el.querySelector('.detect-btn')),
      (this._videoSourceLabel = el.querySelector('.scene-video-source-label')),
      (this._refBar = el.querySelector('.ref-bar')),
      (this._refPlaceholder = el.querySelector('.ref-placeholder')),
      (this._sensitivityLabel = el.querySelector('.scene-sensitivity-label')),
      (this._sensitivityLow = el.querySelector('.scene-sensitivity-low')),
      (this._sensitivityHigh = el.querySelector('.scene-sensitivity-high')),
      (this._sensitivitySlider = el.querySelector('.sensitivity-slider')),
      (this._resultsContainer = el.querySelector('.scene-detection-results')),
      (this._resultsPlaceholder = el.querySelector('.results-placeholder')),
      (this._sceneList = el.querySelector('.scene-list')),
      (this._sceneCountPrefix = el.querySelector('.scene-count-prefix')),
      (this._sceneCountSuffix = el.querySelector('.scene-count-suffix')),
      (this._sceneCount = el.querySelector('.scene-count .count')),
      (this._timelineMarkers = el.querySelector('.timeline-markers')),
      (this._sceneItems = el.querySelector('.scene-items')),
      (this._autoClipBtn = el.querySelector('.auto-clip-btn')),
      (this._exportBtn = el.querySelector('.export-btn')),
      this._detectBtn.addEventListener('click', () => this._startDetection()),
      this._sensitivitySlider.addEventListener('input', (event) => {
        this._sensitivity = parseFloat(event.target.value);
      }),
      this._autoClipBtn.addEventListener('click', () => this._autoClip()),
      this._exportBtn.addEventListener('click', () => this._exportScenes()),
      this._syncLocaleTexts(),
      this._checkVideoInput(),
      el
    );
  }
  ['_checkVideoInput']() {
    const list = appStore.getIncomingEdges(this.nodeId) || [];
    if (list.length > 0) {
      const index = list[0],
        error = appStore.getState().nodes[index.sourceId];
      error &&
        (error.type === 'source-video' || error.type.includes('video')) &&
        ((this._videoSource = error),
        (this._refPlaceholder.textContent = error.name || sceneDetectionText('input.videoSource')),
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
    const videoUrl = this._videoSource.src || this._videoSource.videoUrl;
    if (!videoUrl) {
      window.showToast(sceneDetectionText('toasts.invalidVideoSource'), 'error');
      return;
    }
    ((this._isDetecting = true),
      startLoading(this._card),
      (this._detectBtn.textContent = sceneDetectionText('actions.detecting')),
      (this._detectBtn.disabled = true));
    try {
      const sceneDetectionResults = await detectScenes({
        videoUrl: videoUrl,
        provider: 'grsai',
        sensitivity: this._sensitivity,
      });
      ((this._detectionResults = sceneDetectionResults),
        this._displayResults(sceneDetectionResults),
        appStore.updateNodeData(this.nodeId, { sceneDetectionResults: sceneDetectionResults }),
        window.showToast(
          sceneDetectionText('toasts.detected', { count: sceneDetectionResults.sceneCount }),
          'success',
        ));
    } catch (result) {
      (console.error('场景检测失败:', result),
        window.showToast(sceneDetectionText('toasts.detectFailed'), 'error'));
    } finally {
      ((this._isDetecting = false),
        stopLoading(this._card),
        (this._detectBtn.textContent = sceneDetectionText('actions.startDetection')),
        (this._detectBtn.disabled = false));
    }
  }
  ['_displayResults'](data) {
    ((this._resultsPlaceholder.style.display = 'none'),
      (this._sceneList.style.display = 'block'),
      (this._autoClipBtn.style.display = 'block'),
      (this._exportBtn.style.display = 'block'),
      (this._sceneCount.textContent = data.sceneCount),
      (this._timelineMarkers.innerHTML = ''));
    const list2 = data.sceneChanges;
    (list2.forEach((item2, options) => {
      const el2 = document.createElement('div');
      ((el2.style.position = 'absolute'),
        (el2.style.left = (item2 / 100) * 100 + '%'),
        (el2.style.width = '2px'),
        (el2.style.height = '100%'),
        (el2.style.background = 'var(--red)'),
        (el2.style.cursor = 'var(--link-cursor)'),
        (el2.title = sceneDetectionText('timeline.changeAt', { time: this._formatTime(item2) })),
        this._timelineMarkers.appendChild(el2));
    }),
      (this._sceneItems.innerHTML = ''));
    let target = 0;
    for (let index2 = 0; index2 < data.sceneCount; index2++) {
      const source = index2 < data.sceneChanges.length ? data.sceneChanges[index2] : 100,
        el3 = document.createElement('div');
      ((el3.className = 'scene-item'),
        (el3.style.display = 'flex'),
        (el3.style.justifyContent = 'space-between'),
        (el3.style.alignItems = 'center'),
        (el3.style.padding = '8px'),
        (el3.style.background = 'var(--white-10)'),
        (el3.style.borderRadius = '4px'));
      const sceneDetectionText2 = sceneDetectionText('scene.label', { index: index2 + 1 }),
        sceneDetectionText3 = sceneDetectionText('actions.clip');
      ((el3.innerHTML =
        '\n        <div style="font-size: 12px;">' +
        sceneDetectionText2 +
        '</div>\n        <div style="font-size: 11px; color: var(--text-secondary);">' +
        this._formatTime(target) +
        ' - ' +
        this._formatTime(source) +
        '</div>\n        <button type="button" class="clip-btn" data-index="' +
        index2 +
        '" style="background: var(--blue); color: white; border: none; border-radius: 4px; padding: 4px 8px; font-size: 10px; cursor: var(--link-cursor);">\n          ' +
        sceneDetectionText3 +
        '\n        </button>\n      '),
        this._sceneItems.appendChild(el3),
        (target = source));
    }
    this._sceneItems.querySelectorAll('.clip-btn').forEach((el4) => {
      el4.addEventListener('click', (event2) => {
        const next = parseInt(event2.target.dataset.index);
        this._clipScene(next);
      });
    });
  }
  ['_formatTime'](current) {
    const entry = Math.floor(current / 60),
      record = Math.floor(current % 60);
    return entry + ':' + record.toString().padStart(2, '0');
  }
  ['_autoClip']() {
    if (!this._detectionResults) return;
    const list3 = this._detectionResults.sceneChanges;
    let payload = 0;
    for (let handle = 0; handle < this._detectionResults.sceneCount; handle++) {
      const state = handle < list3.length ? list3[handle] : 100;
      (this._createClipNode(payload, state, handle + 1), (payload = state));
    }
    window.showToast(
      sceneDetectionText('toasts.createdClipNodes', { count: this._detectionResults.sceneCount }),
      'success',
    );
  }
  ['_clipScene'](index3) {
    if (!this._detectionResults) return;
    const list4 = this._detectionResults.sceneChanges;
    let config = 0,
      scope = 100;
    for (let input = 0; input <= index3; input++) {
      if (input === index3) {
        scope = input < list4.length ? list4[input] : 100;
        break;
      }
      config = list4[input];
    }
    (this._createClipNode(config, scope, index3 + 1),
      window.showToast(sceneDetectionText('toasts.createdSceneClipNode', { index: index3 + 1 }), 'success'));
  }
  ['_createClipNode'](clipStart, clipEnd, index4) {
    if (!this._videoSource) return;
    const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
      output = direction === 'down' ? 'down' : 'right',
      value2 = Number(this._data.x) || 0,
      value3 = Number(this._data.y) || 0,
      value4 = Number(this._data.width) || 512,
      value5 = Number(this._data.height) || 288,
      width = getAutoMediaSizeByShortSide(value4, value5),
      x = value2 + value4 + spacing,
      y = output === 'down' ? value3 + value5 + spacing : value3 + Math.round((value5 - width.height) / 2),
      x2 = avoidOverlap
        ? findAvailablePosition(
            appStore.getState().nodes || {},
            x,
            y,
            width.width,
            width.height,
            spacing,
            output,
          )
        : { x: x, y: y },
      id = generateId('node');
    (appStore.addNode(
      buildSourceMediaNodePayload({
        id: id,
        type: 'source-video',
        name: sceneDetectionText('scene.label', { index: index4 }),
        src: this._videoSource.src,
        localPath: this._videoSource.localPath,
        clipStart: clipStart,
        clipEnd: clipEnd,
        x: x2.x,
        y: x2.y,
        width: width.width,
        height: width.height,
        needsAutoResize: false,
      }),
    ),
      appStore.addEdge({
        id: generateId('edge'),
        sourceId: this.nodeId,
        targetId: id,
        refSlot: 'scene',
      }));
  }
  ['_exportScenes']() {
    if (!this._detectionResults) return;
    const value6 = {
      videoSource: this._videoSource?.name || sceneDetectionText('export.unknownVideo'),
      sceneCount: this._detectionResults.sceneCount,
      scenes: [],
    };
    let startTime = 0;
    for (let number = 0; number < this._detectionResults.sceneCount; number++) {
      const endTime =
        number < this._detectionResults.sceneChanges.length
          ? this._detectionResults.sceneChanges[number]
          : 100;
      (value6.scenes.push({
        number: number + 1,
        startTime: startTime,
        endTime: endTime,
        duration: endTime - startTime,
      }),
        (startTime = endTime));
    }
    const blob = new Blob([JSON.stringify(value6, null, 2)], { type: 'application/json' }),
      value7 = URL.createObjectURL(blob),
      el5 = document.createElement('a');
    ((el5.href = value7),
      (el5.download = 'scenes_' + Date.now() + '.json'),
      el5.click(),
      URL.revokeObjectURL(value7),
      window.showToast(sceneDetectionText('toasts.exported'), 'success'));
  }
  ['update'](value8) {
    ((this._data = value8),
      this._checkVideoInput(),
      value8.sceneDetectionResults &&
        ((this._detectionResults = value8.sceneDetectionResults),
        this._displayResults(value8.sceneDetectionResults)));
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
