import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  buildModelUiSchemaDefaultParams,
  buildUiSchemaParamPatch,
  evaluateUiSchemaNumberExpression,
  bindUiSchemaFieldControls,
  hasModelUiSchema,
  renderModelUiSchemaControls,
  renderUiSchemaFields,
  syncModelUiSchemaControls,
} from '../aigenImage/uiSchemaRenderer.js';
import {
  buildVideoWorkflowDisplayParamsPatch,
  buildVideoWorkflowGenerationParamsPatch,
  buildVideoWorkflowModelSelectionPatch,
  getRunningHubVideoWorkflowFpsOptions,
  hasRunningHubVideoWorkflowUiPlacement,
} from './runningHubVideoUiSchema.js';
import {
  buildDreaminaModelSelectionParamPatch,
  buildDreaminaParamPatch,
  buildDreaminaParamSchemaFields,
  buildDreaminaRouteModeUpdate,
  getDreaminaEffectiveNodeData,
  resolveDreaminaRememberedRouteModel,
} from './dreaminaParameterSchema.js';
import {
  buildVideoModelApiModelSelectionPatch,
  createVideoNodeParameterPanelModule,
  resolveVideoPromptPlaceholder,
  shouldShowVideoPromptInput,
} from './parameterPanelModule.js';
import {
  buildApimartVideoMenuItemsHtml,
  buildApimartVideoLogoHTML,
  buildDreaminaVideoLogoHTML,
  buildDreaminaOfficialVideoMenuItems,
  buildDreaminaTaskModelMenuHtml,
  buildRunningHubVideoModelApiMenuItems,
  buildRunningHubVideoWorkflowMenuItems,
  buildVolcengineOfficialVideoMenuItems,
  buildVolcengineVideoLogoHTML,
  getDreaminaTaskModelMenuItems,
  getRhV54FpsOptions,
  normalizeRhV54Fps,
} from './parameterPanelModelHelpers.js';
import { closeNodeFooterMenus } from '../shared/nodeFooterControls.js';
import { getGenerationNodeHelpTooltip } from '../generationNodeHelpTip.js';
import { getModelManifest, resolveModelExecution } from '../../manifests/index.js';
const __dirname = dirname(fileURLToPath(import.meta.url)),
  source = readFileSync(join(__dirname, 'parameterPanelModule.js'), 'utf8'),
  uiSchemaRendererSource = readFileSync(join(__dirname, '..', 'aigenImage', 'uiSchemaRenderer.js'), 'utf8'),
  imageUiModuleSource = readFileSync(join(__dirname, '..', 'aigenImage', 'uiModule.impl.js'), 'utf8'),
  uiModuleModelHelpersSource = readFileSync(
    join(__dirname, '..', 'aigenImage', 'uiModuleModelHelpers.js'),
    'utf8',
  ),
  videoNodeSource = readFileSync(join(__dirname, '..', 'AIGenVideoNode.js'), 'utf8'),
  parameterPanelModelHelpersSource = readFileSync(join(__dirname, 'parameterPanelModelHelpers.js'), 'utf8'),
  nodeTypesCss = readFileSync(join(__dirname, '..', '..', '..', 'styles', 'node-types.css'), 'utf8');
function extractMenuModelOrder(_0x422cde) {
  return Array.from(String(_0x422cde || '').matchAll(/data-value="([^"]+)"/g)).map((_0xbc8de) => _0xbc8de[1]);
}
(test('video parameter panel: 官方即梦和 APIMart 即梦显示名分离', () => {
  const _0x4bb800 = buildDreaminaOfficialVideoMenuItems();
  assert.deepEqual(_0x4bb800, [
    {
      modelId: 'dreamina/text2video',
      provider: 'dreamina',
      label: '即梦官方',
      subtitle: '无图文生视频，单图图生视频',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: true,
    },
  ]);
  const _0x5cb43c = buildApimartVideoMenuItemsHtml('apimart/doubao-seedance-2.0-fast', 'apimart');
  (assert.match(
    _0x5cb43c,
    /class="floating-menu-item node-menu-item active" data-value="apimart\/doubao-seedance-2\.0-fast" data-provider="apimart" data-apimart-jimeng="1"/,
  ),
    assert.match(_0x5cb43c, /<div class="fmi-title">即梦视频<\/div>/),
    assert.match(_0x5cb43c, /<img src="images\/jimeng\.png" class="node-menu-icon" alt="dreamina">/),
    assert.match(_0x5cb43c, /<div class="fmi-sub">Seedance 系列，文生\/图生\/首尾帧参考素材<\/div>/),
    assert.match(
      _0x5cb43c,
      /class="floating-menu-item node-menu-item" data-value="apimart\/happyhorse-1\.0" data-provider="apimart" data-apimart-video-model="1"/,
    ),
    assert.match(_0x5cb43c, /<div class="fmi-title">HappyHorse 1\.0<\/div>/),
    assert.match(_0x5cb43c, /data-value="apimart\/veo3-fast"/),
    assert.match(_0x5cb43c, /data-value="apimart\/grok-imagine-1\.0"/),
    assert.match(_0x5cb43c, /data-value="apimart\/omni-flash-ext"/),
    assert.match(_0x5cb43c, /<div class="fmi-title">Gemini Omni Flash<\/div>/),
    assert.match(_0x5cb43c, /data-value="apimart\/minimax-hailuo-2\.3"/),
    assert.match(_0x5cb43c, /data-value="apimart\/wan2\.7"/),
    assert.match(_0x5cb43c, /data-value="apimart\/kling-v3-omni"/),
    assert.match(_0x5cb43c, /data-value="apimart\/viduq3"/),
    assert.deepEqual(extractMenuModelOrder(_0x5cb43c), [
      'apimart/doubao-seedance-2.0-fast',
      'apimart/happyhorse-1.0',
      'apimart/veo3-fast',
      'apimart/grok-imagine-1.0',
      'apimart/omni-flash-ext',
      'apimart/wan2.7',
      'apimart/kling-v3-omni',
      'apimart/kling-v3',
      'apimart/kling-video-o1',
      'apimart/minimax-hailuo-2.3',
      'apimart/minimax-hailuo',
      'apimart/viduq3',
    ]),
    assert.doesNotMatch(_0x5cb43c, /data-value="apimart\/viduq3-turbo"/),
    assert.doesNotMatch(_0x5cb43c, /data-value="apimart\/viduq3-pro"/),
    assert.doesNotMatch(_0x5cb43c, /data-value="apimart\/viduq3-mix"/),
    assert.doesNotMatch(_0x5cb43c, /happyhorse-placeholder/),
    assert.match(source, /\.\.\.buildDreaminaOfficialVideoMenuItems\(\)/),
    assert.match(source, /\.\.\.buildVolcengineOfficialVideoMenuItems\(/),
    assert.match(source, /itemsHtml: buildApimartVideoMenuItemsHtml\(/),
    assert.doesNotMatch(source, /const apimartVideoItemsHtml/),
    assert.match(source, /function getDreaminaProviderLabel\(provider\)/),
    assert.match(source, /videoPanelText\("providers\.dreamina"\)/),
    assert.match(source, /videoPanelText\("providers\.volcengine"\)/),
    assert.match(source, /videoPanelText\("providers\.default"\)/),
    assert.match(source, /providerLabel\.textContent = getDreaminaProviderLabel\(dreaminaProvider\)/),
    assert.match(source, /const latestNode = getLatestNodeData\(\)/),
    assert.match(source, /commitDreaminaModelSelection\(\{/),
    assert.match(source, /useModelApiSchemaParams/),
    assert.match(
      source,
      /const modelExecution = this\._resolveModelExecution\(\s*_activeModel,\s*this\._data\.provider,\s*\)/,
    ),
    assert.match(source, /hasModelUiSchema\(modelApiSchemaModelId, \{ placement: "advanced" \}\)/),
    assert.match(source, /const modelApiSchemaModelId = useModelApiSchemaParams/),
    assert.match(source, /modelExecution\?\.canonicalModelId/),
    assert.doesNotMatch(source, /rh-adv-wrap/),
    assert.doesNotMatch(source, /rh-adv-btn/),
    assert.doesNotMatch(source, /rh-adv-panel/),
    assert.match(
      source,
      /renderModelUiSchemaControls\(modelApiSchemaModelId, this\._data,[\s\S]*placement:\s*"mode"/,
    ),
    assert.match(
      source,
      /renderModelUiSchemaControls\(modelApiSchemaModelId, this\._data,[\s\S]*placement:\s*"resolution"/,
    ),
    assert.equal(getModelManifest('dreamina/text2video')?.extensions?.videoMenu?.role, 'dreaminaOfficial'),
    assert.equal(
      getModelManifest('apimart/doubao-seedance-2.0-fast')?.extensions?.videoMenu?.role,
      'apimartDreaminaEntry',
    ),
    assert.doesNotMatch(parameterPanelModelHelpersSource, /getDreaminaStyleVideoAllowedModels/),
    assert.doesNotMatch(source, /getDreaminaStyleVideoAllowedModels/));
}),
  test('video parameter panel: RunningHub workflow and model API menus stay separate', () => {
    const _0x140722 = buildRunningHubVideoWorkflowMenuItems('runninghub-model/kling-video-o1'),
      _0x46d78f = buildRunningHubVideoModelApiMenuItems('runninghub-model/kling-video-o1');
    (assert.doesNotMatch(_0x140722, /runninghub-model\/kling-video-o1/),
      assert.match(_0x140722, /data-provider="runninghubwf"/),
      assert.match(_0x140722, /data-value="runninghub\/2064961300823896065"/),
      assert.match(_0x140722, /data-value="runninghub\/2065463417577762818"/),
      assert.match(_0x140722, /<div class="fmi-title">视频编辑Scail V2<\/div>/),
      assert.match(
        _0x46d78f,
        /class="floating-menu-item node-menu-item active" data-value="runninghub-model\/kling-video-o1" data-provider="runninghub"/,
      ),
      assert.match(_0x46d78f, /data-value="runninghub-model\/kling-v3"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Kling V3\.0<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/kling-o3"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Kling O3<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/seedance-2\.0"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Seedance 2\.0<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/happyhorse-1\.0"/),
      assert.match(_0x46d78f, /<div class="fmi-title">HappyHorse 1\.0<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/hailuo-02"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Hailuo 02<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/hailuo-2\.3"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Hailuo 2\.3<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/veo3"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Veo3<\/div>/),
      assert.match(_0x46d78f, /data-value="runninghub-model\/wan2\.7"/),
      assert.match(_0x46d78f, /<div class="fmi-title">Wan 2\.7<\/div>/),
      assert.deepEqual(extractMenuModelOrder(_0x46d78f), [
        'runninghub-model/seedance-2.0',
        'runninghub-model/happyhorse-1.0',
        'runninghub-model/veo3',
        'runninghub-model/wan2.7',
        'runninghub-model/kling-o3',
        'runninghub-model/kling-v3',
        'runninghub-model/kling-video-o1',
        'runninghub-model/hailuo-2.3',
        'runninghub-model/hailuo-02',
      ]));
    const _0x3a1702 = renderModelUiSchemaControls(
      'runninghub-model/veo3',
      { rh_veo3_channel: 'lowCost', mode: 'fast' },
      { placement: 'mode' },
    );
    (assert.match(_0x3a1702, /data-ui-schema-field="rh_veo3_channel"/),
      assert.match(_0x3a1702, /data-ui-schema-field="mode"/),
      assert.match(_0x3a1702, /data-ui-schema-field="generation_type"/),
      assert.match(_0x3a1702, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(_0x3a1702, /data-ui-schema-primary-field="rh_veo3_channel"/),
      assert.match(_0x3a1702, /data-ui-schema-secondary-field="mode"/),
      assert.match(_0x3a1702, /ui-schema-section-pair-label">低价版 · Fast 版 · 首尾帧/),
      assert.equal((_0x3a1702.match(/data-ui-schema-menu-trigger="/g) || []).length, 1),
      assert.match(_0x3a1702, /data-ui-schema-value="lowCost"/),
      assert.match(_0x3a1702, /data-ui-schema-value="official"/),
      assert.match(_0x3a1702, /data-ui-schema-value="reference"[\s\S]*data-ui-schema-disabled="true"/));
    const _0x3d377a = renderModelUiSchemaControls(
      'runninghub-model/veo3',
      { rh_veo3_channel: 'official', mode: 'fast' },
      { placement: 'mode' },
    );
    assert.doesNotMatch(_0x3d377a, /data-ui-schema-value="reference"[\s\S]*data-ui-schema-disabled="true"/);
    const _0x46cf3d = renderModelUiSchemaControls('runninghub-model/veo3', {}, { placement: 'resolution' });
    (assert.match(_0x46cf3d, /data-ui-schema-field="resolution"/),
      assert.match(_0x46cf3d, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x46cf3d, /data-ui-schema-value="自适应"/),
      assert.match(_0x46cf3d, /data-ui-schema-field="duration"/));
    const _0x2553ac = renderModelUiSchemaControls(
      'runninghub-model/wan2.7',
      { generationParams: { wan27_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(_0x2553ac, /data-ui-schema-field="wan27_mode"/),
      assert.match(_0x2553ac, /data-ui-schema-value="image"/),
      assert.match(_0x2553ac, /data-ui-schema-value="video"/),
      assert.match(_0x2553ac, /data-ui-schema-value="reference"/),
      assert.match(_0x2553ac, /data-ui-schema-value="edit"/),
      assert.match(_0x2553ac, /参考生视频/));
    const _0x3f55a0 = renderModelUiSchemaControls('runninghub-model/wan2.7', {}, { placement: 'resolution' });
    (assert.match(_0x3f55a0, /data-ui-schema-field="resolution"/),
      assert.match(_0x3f55a0, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x3f55a0, /data-ui-schema-value="自适应"/),
      assert.match(_0x3f55a0, /data-ui-schema-field="duration"/));
    const _0x10480f = renderModelUiSchemaControls(
      'runninghub-model/kling-v3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0x10480f, /data-ui-schema-field="resolution"/),
      assert.match(_0x10480f, /data-ui-schema-value="std"/),
      assert.match(_0x10480f, /data-ui-schema-value="pro"/),
      assert.match(_0x10480f, /data-ui-schema-value="4k"/),
      assert.match(_0x10480f, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x10480f, /data-ui-schema-value="自适应"/),
      assert.match(_0x10480f, /data-ui-schema-field="duration"/));
    const _0x1628df = renderModelUiSchemaControls('runninghub-model/kling-v3', {}, { placement: 'advanced' });
    (assert.match(_0x1628df, /data-ui-schema-field="audio"/),
      assert.match(_0x1628df, /data-ui-schema-field="cfgScale"/),
      assert.match(_0x1628df, /data-ui-schema-field="shotType"/),
      assert.match(_0x1628df, /data-ui-schema-field="negative_prompt"/));
    const _0x8d5850 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      { generationParams: { kling_v3_omni_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(_0x8d5850, /data-ui-schema-field="kling_v3_omni_mode"/),
      assert.doesNotMatch(_0x8d5850, /data-ui-schema-field="resolution"/),
      assert.doesNotMatch(_0x8d5850, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(_0x8d5850, /data-ui-schema-value="image"/),
      assert.match(_0x8d5850, /data-ui-schema-value="reference"/),
      assert.match(_0x8d5850, /data-ui-schema-value="edit"/));
    const _0xc15b8 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0xc15b8, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0xc15b8, /data-ui-schema-field="resolution"/),
      assert.match(_0xc15b8, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0xc15b8, /data-ui-schema-value="std"/),
      assert.match(_0xc15b8, /data-ui-schema-value="pro"/),
      assert.match(_0xc15b8, /data-ui-schema-value="4k"/),
      assert.match(_0xc15b8, /720P/),
      assert.match(_0xc15b8, /1080P/),
      assert.match(_0xc15b8, /4K/),
      assert.match(_0xc15b8, /data-ui-schema-value="自适应"/),
      assert.match(_0xc15b8, /data-ui-schema-field="duration"/));
    const _0x5814bd = renderModelUiSchemaControls('runninghub-model/kling-o3', {}, { placement: 'advanced' });
    (assert.match(_0x5814bd, /data-ui-schema-field="audio"/),
      assert.match(_0x5814bd, /data-ui-schema-field="shotType"/),
      assert.doesNotMatch(_0x5814bd, /data-ui-schema-field="keep_original_sound"/));
    const _0x555d87 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      { generationParams: { kling_v3_omni_mode: 'reference' } },
      { placement: 'advanced' },
    );
    assert.match(_0x555d87, /data-ui-schema-field="keep_original_sound"/);
    const _0x3b5ff5 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      { generationParams: { rh_seedance_2_model: 'fast', rh_seedance_2_mode: 'multimodal2video' } },
      { placement: 'mode' },
    );
    (assert.match(_0x3b5ff5, /data-ui-schema-field="rh_seedance_2_model"/),
      assert.match(_0x3b5ff5, /data-ui-schema-field="rh_seedance_2_mode"/),
      assert.match(_0x3b5ff5, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(_0x3b5ff5, /data-ui-schema-primary-field="rh_seedance_2_model"/),
      assert.match(_0x3b5ff5, /data-ui-schema-secondary-field="rh_seedance_2_mode"/),
      assert.match(_0x3b5ff5, /data-ui-schema-value="fast"/),
      assert.match(_0x3b5ff5, /data-ui-schema-value="standard"/),
      assert.match(_0x3b5ff5, /data-ui-schema-value="text2video"/),
      assert.match(_0x3b5ff5, /data-ui-schema-value="image2video"/),
      assert.match(_0x3b5ff5, /data-ui-schema-value="frames2video"/),
      assert.match(_0x3b5ff5, /data-ui-schema-value="multimodal2video"/),
      assert.equal((_0x3b5ff5.match(/data-ui-schema-menu-trigger="/g) || []).length, 1));
    const _0x47bc21 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0x47bc21, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x47bc21, /data-ui-schema-field="resolution"/),
      assert.match(_0x47bc21, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x47bc21, /ui-schema-quality-ratio-label">720p \u00b7 自适应<\/span>/),
      assert.match(_0x47bc21, /原生输出分辨率/),
      assert.match(_0x47bc21, /超分辨率/),
      assert.match(_0x47bc21, /data-ui-schema-value="480p"/),
      assert.match(_0x47bc21, /data-ui-schema-value="720p"/),
      assert.match(_0x47bc21, /data-ui-schema-value="native1080p"/),
      assert.doesNotMatch(_0x47bc21, /data-ui-schema-value="none"/),
      assert.doesNotMatch(_0x47bc21, /不超分/),
      assert.match(_0x47bc21, /data-ui-schema-value="1080p"/),
      assert.match(_0x47bc21, /data-ui-schema-value="2k"/),
      assert.match(_0x47bc21, /data-ui-schema-value="4k"/),
      assert.match(_0x47bc21, /data-ui-schema-value="自适应"/),
      assert.match(_0x47bc21, /data-ui-schema-value="21:9"/),
      assert.equal((_0x47bc21.match(/data-ui-schema-field="resolution"/g) || []).length, 1),
      assert.equal((_0x47bc21.match(/data-ui-schema-menu-trigger="qualityRatio"/g) || []).length, 1),
      assert.match(_0x47bc21, /data-ui-schema-field="duration"/));
    const _0x5f330f = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      { generationParams: { rh_seedance_2_mode: 'text2video' } },
      { placement: 'advanced' },
    );
    (assert.match(_0x5f330f, /data-ui-schema-field="generateAudio"/),
      assert.match(_0x5f330f, /data-ui-schema-field="webSearch"/),
      assert.match(_0x5f330f, /data-ui-schema-field="realPersonMode"/),
      assert.doesNotMatch(_0x5f330f, /data-ui-schema-field="returnLastFrame"/),
      assert.match(_0x5f330f, /data-ui-schema-field="seed"/));
    const _0x302833 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      { generationParams: { rh_seedance_2_mode: 'multimodal2video' } },
      { placement: 'advanced' },
    );
    (assert.match(_0x302833, /data-ui-schema-field="generateAudio"/),
      assert.match(_0x302833, /data-ui-schema-field="realPersonMode"/),
      assert.doesNotMatch(_0x302833, /data-ui-schema-field="webSearch"/));
    const _0x2caabf = renderModelUiSchemaControls(
      'runninghub-model/happyhorse-1.0',
      { generationParams: { happyhorse_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(_0x2caabf, /data-ui-schema-field="happyhorse_mode"/),
      assert.match(_0x2caabf, /data-ui-schema-value="image"/),
      assert.match(_0x2caabf, /data-ui-schema-value="reference"/),
      assert.match(_0x2caabf, /data-ui-schema-value="edit"/));
    const _0x4d1fb3 = renderModelUiSchemaControls(
      'runninghub-model/happyhorse-1.0',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0x4d1fb3, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x4d1fb3, /data-ui-schema-field="resolution"/),
      assert.match(_0x4d1fb3, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x4d1fb3, /data-ui-schema-value="720P"/),
      assert.match(_0x4d1fb3, /data-ui-schema-value="1080P"/),
      assert.match(_0x4d1fb3, /data-ui-schema-value="自适应"/),
      assert.match(_0x4d1fb3, /data-ui-schema-field="duration"/));
    const _0x39fe2c = renderModelUiSchemaControls(
      'runninghub-model/happyhorse-1.0',
      {},
      { placement: 'advanced' },
    );
    (assert.match(_0x39fe2c, /data-ui-schema-field="audio_setting"/),
      assert.match(_0x39fe2c, /data-ui-schema-field="seed"/),
      assert.doesNotMatch(_0x39fe2c, /data-ui-schema-field="watermark"/));
    const _0x5a67f4 = renderModelUiSchemaControls(
      'runninghub-model/hailuo-02',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0x5a67f4, /data-ui-schema-field="rh_hailuo_02_quality"/),
      assert.doesNotMatch(_0x5a67f4, /data-ui-schema-field="aspectRatio"/),
      assert.doesNotMatch(_0x5a67f4, /data-ui-schema-value="自适应"/));
    const _0x33da5e = renderModelUiSchemaControls(
      'runninghub-model/hailuo-2.3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0x33da5e, /data-ui-schema-field="rh_hailuo_23_quality"/),
      assert.match(_0x33da5e, /data-ui-schema-value="fastPro"/),
      assert.match(_0x33da5e, /data-ui-schema-field="duration"/),
      assert.doesNotMatch(_0x33da5e, /data-ui-schema-field="aspectRatio"/),
      assert.doesNotMatch(_0x33da5e, /data-ui-schema-value="自适应"/),
      assert.doesNotMatch(_0x46d78f, /data-provider="runninghubwf"/),
      assert.match(source, /label: "RunningHUB\\u5de5\\u4f5c\\u6d41"/),
      assert.match(source, /label: "RunningHUB\\u6a21\\u578b"/),
      assert.match(source, /id: "runninghub-model"/),
      assert.match(source, /itemsHtml: buildRunningHubVideoModelApiMenuItems\(/));
  }),
  test('video parameter panel: Volcengine uses Dreamina official style entry', () => {
    const _0x20a60e = buildVolcengineOfficialVideoMenuItems('volcengine/seedance-2.0-fast', 'volcengine');
    (assert.match(source, /buildVolcengineOfficialVideoMenuItems\(/),
      assert.doesNotMatch(source, /id: "volcengine-video"/),
      assert.equal(_0x20a60e.length, 1),
      assert.equal(_0x20a60e[0].modelId, 'volcengine/seedance-2.0-fast'),
      assert.equal(_0x20a60e[0].provider, 'volcengine'),
      assert.equal(_0x20a60e[0].label, '火山方舟'),
      assert.equal(_0x20a60e[0].active, true),
      assert.match(_0x20a60e[0].iconHtml, /images\/volcengine\.svg/));
    const _0x359013 = buildDreaminaTaskModelMenuHtml(
      'volcengine/seedance-2.0-fast',
      'text2video',
      'volcengine',
    );
    (assert.deepEqual(extractMenuModelOrder(_0x359013), [
      'volcengine/seedance-2.0-fast',
      'volcengine/seedance-2.0',
      'volcengine/seedance-2.0-mini',
    ]),
      assert.match(_0x359013, /data-provider="volcengine"/),
      assert.match(_0x359013, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      assert.match(_0x359013, /<div class="fmi-title">Seedance 2\.0<\/div>/),
      assert.match(_0x359013, /<div class="fmi-title">Seedance 2\.0 Mini<\/div>/));
    const _0x43f8df = buildDreaminaParamSchemaFields({
        routeMode: 'frames2video',
        currentRatio: '自适应',
        currentResolution: '720p',
        currentDuration: 5,
        resolutionOptions: ['480p', '720p'],
      }),
      _0x49af65 = renderUiSchemaFields(
        [_0x43f8df.mode],
        { generationParams: { dreaminaRouteMode: 'frames2video' } },
        { sourceId: 'volcengine-dreamina-style' },
      );
    (assert.match(_0x49af65, /data-ui-schema-field="dreaminaRouteMode"/),
      assert.match(_0x49af65, /data-ui-schema-value="multimodal2video"/),
      assert.match(_0x49af65, /data-ui-schema-value="frames2video"/),
      assert.doesNotMatch(_0x49af65, /data-ui-schema-value="text2video"/),
      assert.doesNotMatch(_0x49af65, /data-ui-schema-value="image2video"/));
    const _0x14f69f = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (_0xdc4ffd) => _0xdc4ffd,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard: () => {},
      isVideoVipModel: () => false,
    });
    assert.equal(
      _0x14f69f._getModelIconHTML('volcengine/seedance-2.0-fast', 'volcengine'),
      buildVolcengineVideoLogoHTML(12),
    );
  }),
  test('video parameter panel: 即梦官方当前模型 logo 使用无背景大即梦图标', () => {
    const _0x466fea = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (_0x440813) => _0x440813,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard: () => {},
      isVideoVipModel: () => false,
    });
    assert.equal(
      _0x466fea._getModelIconHTML('dreamina/text2video', 'dreamina'),
      buildDreaminaVideoLogoHTML(12),
    );
  }),
  test('video node state sync keeps modelApi advanced settings visible', () => {
    (assert.match(videoNodeSource, /hasModelUiSchema/),
      assert.match(
        videoNodeSource,
        /const showModelApiAdvanced[\s\S]*hasModelUiSchema\(modelApiSchemaModelId, \{ placement: "advanced" \}\)/,
      ),
      assert.match(videoNodeSource, /advBtn\.style\.display = showSchemaAdvanced \? "" : "none"/),
      assert.match(videoNodeSource, /panel && !showSchemaAdvanced/),
      assert.doesNotMatch(videoNodeSource, /advBtn\.style\.display = showRhAdv \? "" : "none"/));
  }),
  test('APIMart video modelApi schema controls follow each model API', () => {
    const _0x4f133f = renderModelUiSchemaControls(
      'apimart/veo3-fast',
      { generationParams: { mode: 'quality', generation_type: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(_0x4f133f, /data-ui-schema-field="mode"/),
      assert.match(_0x4f133f, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(_0x4f133f, /data-ui-schema-primary-field="mode"/),
      assert.match(_0x4f133f, /data-ui-schema-secondary-field="generation_type"/),
      assert.match(_0x4f133f, /ui-schema-section-pair-popup/),
      assert.match(_0x4f133f, /ui-schema-section-pair-label">quality · 首尾帧/),
      assert.doesNotMatch(_0x4f133f, /data-ui-schema-value="lite"/),
      assert.doesNotMatch(_0x4f133f, /veo3\.1-lite/),
      assert.match(_0x4f133f, /data-ui-schema-value="fast"/),
      assert.match(_0x4f133f, /data-ui-schema-value="quality"/),
      assert.match(
        _0x4f133f,
        /data-tooltip="veo3\.1-fast - 快速生成模型，适用于快速预览和迭代\nveo3\.1-quality - 高质量生成模型，适用于最终制作"/,
      ),
      assert.doesNotMatch(_0x4f133f, /data-ui-schema-menu-trigger="sectionPair"[^>]*title=/),
      assert.match(_0x4f133f, /ui-schema-info-tip/),
      assert.match(_0x4f133f, /data-ui-schema-field="generation_type"/),
      assert.match(_0x4f133f, /data-ui-schema-value="frame"/),
      assert.match(_0x4f133f, /data-ui-schema-value="reference"[^>]*data-ui-schema-disabled="true"/),
      assert.doesNotMatch(_0x4f133f, /data-ui-schema-field="duration"/),
      assert.equal((_0x4f133f.match(/data-ui-schema-menu-trigger="/g) || []).length, 1));
    const _0x4672b5 = renderModelUiSchemaControls('apimart/veo3-fast', {}, { placement: 'resolution' });
    (assert.match(_0x4672b5, /视频分辨率/),
      assert.match(_0x4672b5, /比例/),
      assert.doesNotMatch(_0x4672b5, /data-ui-schema-menu-trigger="qualityRatio"[^>]*title=/),
      assert.match(_0x4672b5, /data-ui-schema-value="4k"/),
      assert.match(_0x4672b5, /img-rp-large-adaptive/),
      assert.match(_0x4672b5, /data-ui-schema-value="自适应"/),
      assert.doesNotMatch(_0x4672b5, /data-ui-schema-value="1:1"/),
      assert.match(_0x4672b5, /data-ui-schema-field="duration"/),
      assert.match(_0x4672b5, /data-ui-schema-menu-trigger="duration" disabled/));
    const _0x32f919 = renderModelUiSchemaControls('apimart/veo3-fast', {}, { placement: 'advanced' });
    (assert.match(_0x32f919, /启用 GIF 输出格式/), assert.doesNotMatch(_0x32f919, /official_fallback/));
    const _0x44c057 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo',
      { generationParams: { duration: 10 } },
      { placement: 'mode' },
    );
    (assert.doesNotMatch(_0x44c057, /data-ui-schema-field="mode"/),
      assert.doesNotMatch(_0x44c057, /Hailuo-2\.3/));
    const _0x2d2918 = getModelManifest('apimart/minimax-hailuo');
    (assert.match(_0x2d2918?.help?.tooltip || '', /Hailuo-02 适用场景/),
      assert.match(_0x2d2918?.help?.tooltip || '', /\[\[red:放 2 张首尾帧\]\]/),
      assert.match(_0x2d2918?.help?.tooltip || '', /1080p 只做 5 秒/),
      assert.doesNotMatch(_0x44c057, /data-ui-schema-field="duration"/));
    const _0x72ab9b = renderModelUiSchemaControls('apimart/minimax-hailuo', {}, { placement: 'resolution' });
    (assert.match(_0x72ab9b, /视频分辨率/),
      assert.match(_0x72ab9b, /data-ui-schema-value="512p"/),
      assert.match(_0x72ab9b, /data-ui-schema-value="768p"/),
      assert.match(_0x72ab9b, /data-ui-schema-value="1080p"/),
      assert.match(_0x72ab9b, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x72ab9b, /data-ui-schema-value="自适应"/),
      assert.match(_0x72ab9b, /data-ui-schema-field="duration"/),
      assert.match(_0x72ab9b, /data-ui-schema-range-values="5,10"/),
      assert.match(_0x72ab9b, /min="0" max="1" step="1" value="0"/),
      assert.match(_0x72ab9b, /视频时长（秒）/));
    const _0x5a5b4d = renderModelUiSchemaControls('apimart/minimax-hailuo', {}, { placement: 'advanced' });
    (assert.match(_0x5a5b4d, /自动优化提示词/),
      assert.match(_0x5a5b4d, /快速预处理/),
      assert.match(_0x5a5b4d, /Watermark|添加水印/),
      assert.match(_0x5a5b4d, /data-ui-schema-field="fast_pretreatment"/));
    const _0x1f1a33 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo-2.3',
      { generationParams: { mode: 'fast' } },
      { placement: 'mode' },
    );
    (assert.match(_0x1f1a33, /data-ui-schema-field="mode"/),
      assert.match(_0x1f1a33, /data-ui-schema-value="standard"/),
      assert.match(_0x1f1a33, /data-ui-schema-value="fast"/),
      assert.match(_0x1f1a33, /Fast 版/),
      assert.match(
        getModelManifest('apimart/minimax-hailuo-2.3')?.help?.tooltip || '',
        /Fast 版必须放 1 张首帧/,
      ));
    const _0x445976 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo-2.3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(_0x445976, /视频分辨率/),
      assert.doesNotMatch(_0x445976, /data-ui-schema-value="512p"/),
      assert.match(_0x445976, /data-ui-schema-value="768p"/),
      assert.match(_0x445976, /data-ui-schema-value="1080p"/),
      assert.match(_0x445976, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x445976, /data-ui-schema-value="自适应"/),
      assert.match(_0x445976, /data-ui-schema-field="duration"/),
      assert.match(_0x445976, /data-ui-schema-range-values="6,10"/));
    const _0x117279 = renderModelUiSchemaControls('apimart/happyhorse-1.0', {}, { placement: 'advanced' }),
      _0x59de78 = renderModelUiSchemaControls(
        'apimart/happyhorse-1.0',
        { generationParams: { happyhorse_mode: 'auto', duration: 5 } },
        { placement: 'mode' },
      );
    (assert.match(_0x59de78, /data-ui-schema-field="happyhorse_mode"/),
      assert.match(_0x59de78, /ui-schema-pill-label">模式选择<\/span>/),
      assert.doesNotMatch(_0x59de78, /data-ui-schema-value="auto"/),
      assert.match(_0x59de78, /data-ui-schema-value="image"/),
      assert.match(_0x59de78, /data-ui-schema-value="reference"/),
      assert.match(_0x59de78, /data-ui-schema-value="edit"/),
      assert.doesNotMatch(_0x59de78, /data-ui-schema-field="duration"/));
    const _0x510e0b = renderModelUiSchemaControls('apimart/happyhorse-1.0', {}, { placement: 'resolution' });
    (assert.match(_0x510e0b, /视频分辨率/),
      assert.match(_0x510e0b, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x510e0b, /data-ui-schema-field="duration"/),
      assert.match(_0x510e0b, /ui-schema-duration-pop/),
      assert.equal(buildModelUiSchemaDefaultParams('apimart/happyhorse-1.0').happyhorse_mode, 'image'),
      assert.equal(
        buildModelUiSchemaDefaultParams('runninghub-model/happyhorse-1.0').happyhorse_mode,
        'image',
      ),
      assert.match(_0x117279, /data-ui-schema-field="audio_setting"/),
      assert.match(_0x117279, /音频设置/),
      assert.match(_0x117279, /data-ui-schema-field="watermark"/),
      assert.doesNotMatch(_0x117279, /data-ui-schema-field="prompt_extend"/),
      assert.match(source, /getHappyHorseModeEdgeIdsToRemove/),
      assert.match(source, /fieldId[\s\S]*happyhorse_mode/),
      assert.match(source, /store\.removeEdge\?\.\(edgeId\)/),
      assert.match(uiSchemaRendererSource, /afterCommit\?\.\(fieldId, value/),
      assert.match(source, /manifestHelpVariantsReferenceField/),
      assert.match(source, /manifestFixedSlotVisibilityReferencesField/),
      assert.match(source, /shouldRefreshRefs[\s\S]*_renderRefBar\?\.\(\)/),
      assert.match(source, /shouldSyncHelp[\s\S]*_syncGenerationNodeHelpTip\?\.\(\)/),
      assert.doesNotMatch(source, /fieldKey === "wan27_mode"[\s\S]*_renderFooter\?\.\(footer\)/),
      assert.match(uiSchemaRendererSource, /data-ui-schema-option-label/));
    const _0x2475d7 = renderModelUiSchemaControls(
      'apimart/wan2.7',
      { generationParams: { wan27_mode: 'image' } },
      { placement: 'mode' },
    );
    (assert.match(_0x2475d7, /data-ui-schema-field="wan27_mode"/),
      assert.match(_0x2475d7, /data-ui-schema-value="image"/),
      assert.match(_0x2475d7, /data-ui-schema-value="video"/),
      assert.match(_0x2475d7, /data-ui-schema-value="reference"/),
      assert.match(_0x2475d7, /data-ui-schema-value="edit"/),
      assert.doesNotMatch(_0x2475d7, /data-ui-schema-field="wan27_reference_input"/),
      assert.doesNotMatch(_0x2475d7, /data-ui-schema-field="wan27_edit_input"/),
      assert.match(_0x2475d7, /图生视频/),
      assert.match(_0x2475d7, /视频续写/),
      assert.match(_0x2475d7, /参考生视频/),
      assert.match(_0x2475d7, /视频编辑/));
    const _0x56fb0d = renderModelUiSchemaControls(
      'apimart/wan2.7',
      { generationParams: { wan27_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(_0x56fb0d, /data-ui-schema-field="wan27_mode"/),
      assert.doesNotMatch(_0x56fb0d, /data-ui-schema-field="wan27_reference_input"/),
      assert.doesNotMatch(_0x56fb0d, /data-ui-schema-field="wan27_edit_input"/));
    const _0x519618 = renderModelUiSchemaControls(
      'apimart/wan2.7',
      { generationParams: { wan27_mode: 'edit' } },
      { placement: 'mode' },
    );
    (assert.match(_0x519618, /data-ui-schema-field="wan27_mode"/),
      assert.doesNotMatch(_0x519618, /data-ui-schema-field="wan27_edit_input"/),
      assert.doesNotMatch(_0x519618, /data-ui-schema-field="wan27_reference_input"/));
    const _0x553502 = renderModelUiSchemaControls('apimart/wan2.7', {}, { placement: 'advanced' });
    (assert.match(_0x553502, /data-ui-schema-field="negative_prompt"/),
      assert.match(_0x553502, /反向提示词/),
      assert.match(_0x553502, /模糊、变形、低质量/),
      assert.match(_0x553502, /prompt 智能改写/));
    const _0x344cc3 = buildUiSchemaParamPatch(
      { model: 'wan2.7', provider: 'apimart', generationParams: { duration: 6 } },
      'wan27_mode',
      'reference',
    );
    (assert.equal(_0x344cc3.generationParams.wan27_mode, 'reference'),
      assert.equal(_0x344cc3.generationParams.duration, 6),
      assert.match(source, /getWan27ModeEdgeIdsToRemove/),
      assert.match(source, /fieldKey === "wan27_mode"/),
      assert.doesNotMatch(source, /fieldKey === "wan27_reference_input"/),
      assert.doesNotMatch(source, /fieldKey === "wan27_edit_input"/),
      assert.match(uiSchemaRendererSource, /filterVisibleUiSchemaFields/),
      assert.match(videoNodeSource, /fixedInputVisibilitySig/),
      assert.match(videoNodeSource, /visibilityLayoutKey/),
      assert.match(videoNodeSource, /refModeSig[\s\S]*fixedInputVisibilitySig/));
    const _0x55a762 = renderModelUiSchemaControls('apimart/kling-v3', {}, { placement: 'mode' });
    (assert.doesNotMatch(_0x55a762, /data-ui-schema-field="duration"/),
      assert.doesNotMatch(_0x55a762, /data-ui-schema-value="4k"/));
    const _0x38beb8 = renderModelUiSchemaControls(
      'apimart/kling-v3',
      { generationParams: { resolution: 'std', aspectRatio: '自适应' } },
      { placement: 'resolution' },
    );
    (assert.match(_0x38beb8, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x38beb8, /data-ui-schema-field="resolution"/),
      assert.match(_0x38beb8, /data-ui-schema-field="aspectRatio"/),
      assert.match(_0x38beb8, /720P/),
      assert.match(_0x38beb8, /1080P/),
      assert.match(_0x38beb8, /data-ui-schema-value="4k"/),
      assert.match(_0x38beb8, /data-ui-schema-field="duration"/),
      assert.doesNotMatch(_0x38beb8, /Kling V3 模式说明/));
    const _0x5df755 = renderModelUiSchemaControls('apimart/kling-v3', {}, { placement: 'advanced' });
    (assert.match(_0x5df755, /生成有声视频/),
      assert.match(_0x5df755, /多镜头分镜模式/),
      assert.match(_0x5df755, /data-ui-schema-field="negative_prompt"/),
      assert.match(_0x5df755, /模糊, 低画质, 变形/),
      assert.match(_0x5df755, /data-ui-schema-default-aliases=/),
      assert.match(_0x5df755, /data-ui-schema-field="multi_shot"[\s\S]*data-ui-schema-disabled="true"/));
    const _0x212891 = buildUiSchemaParamPatch(
      { model: 'apimart/kling-v3', provider: 'apimart', generationParams: {} },
      'negative_prompt',
      'none',
    );
    assert.equal(_0x212891.generationParams.negative_prompt, '模糊, 低画质, 变形');
    const _0x1849bd = buildVideoModelApiModelSelectionPatch(
      { provider: 'apimart', generationParamsByModel: { 'apimart/kling-v3': { negative_prompt: 'none' } } },
      'apimart/kling-v3',
      'apimart',
    );
    assert.equal(_0x1849bd.generationParams.negative_prompt, '模糊, 低画质, 变形');
    const _0x5c8fe9 = { value: '' },
      _0x29407e = {
        dataset: {
          uiSchemaField: 'negative_prompt',
          uiSchemaDefault: '模糊, 低画质, 变形',
          uiSchemaDefaultAliases: JSON.stringify(['none']),
        },
        classList: {
          contains() {
            return false;
          },
        },
        querySelectorAll() {
          return [];
        },
        querySelector(_0x8e4c00) {
          if (_0x8e4c00 === '[data-ui-schema-input]') return _0x5c8fe9;
          return null;
        },
      };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(_0x4da3f9) {
          if (_0x4da3f9 === '[data-ui-schema-field]') return [_0x29407e];
          return [];
        },
      },
      { generationParams: { negative_prompt: 'none' } },
    ),
      assert.equal(_0x5c8fe9.value, '模糊, 低画质, 变形'));
    const _0x393b87 = renderModelUiSchemaControls(
      'apimart/kling-v3-omni',
      { generationParams: { kling_v3_omni_mode: 'image' } },
      { placement: 'mode' },
    );
    (assert.match(_0x393b87, /data-ui-schema-field="kling_v3_omni_mode"/),
      assert.match(_0x393b87, /data-ui-schema-value="image"/),
      assert.match(_0x393b87, /data-ui-schema-value="reference"/),
      assert.match(_0x393b87, /data-ui-schema-value="edit"/),
      assert.match(_0x393b87, /图生视频/),
      assert.match(_0x393b87, /参考生视频/),
      assert.match(_0x393b87, /视频编辑/));
    const _0x2bca85 = renderModelUiSchemaControls(
      'apimart/kling-v3-omni',
      { generationParams: { resolution: 'pro', aspectRatio: '16:9' } },
      { placement: 'resolution' },
    );
    (assert.match(_0x2bca85, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x2bca85, /720P/),
      assert.match(_0x2bca85, /1080P/),
      assert.match(_0x2bca85, /data-ui-schema-value="4k"/),
      assert.match(_0x2bca85, /data-ui-schema-field="duration"/));
    const _0x524bbb = renderModelUiSchemaControls('apimart/kling-v3-omni', {}, { placement: 'advanced' });
    (assert.match(_0x524bbb, /生成有声视频/),
      assert.match(_0x524bbb, /多镜头分镜模式/),
      assert.match(_0x524bbb, /data-ui-schema-field="negative_prompt"/),
      assert.match(_0x524bbb, /模糊, 低画质, 变形/),
      assert.match(source, /fieldKey === "kling_v3_omni_mode"/));
    const _0x20d710 = renderModelUiSchemaControls('apimart/kling-video-o1', {}, { placement: 'advanced' });
    (assert.match(_0x20d710, /data-ui-schema-field="keep_original_sound"/),
      assert.match(_0x20d710, /保留原声/),
      assert.match(_0x20d710, /编辑视频或特征参考视频/));
    const _0x38f522 = renderModelUiSchemaControls(
      'apimart/kling-video-o1',
      { generationParams: { resolution: 'pro', aspectRatio: '16:9' } },
      { placement: 'resolution' },
    );
    (assert.match(_0x38f522, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x38f522, /720P/),
      assert.match(_0x38f522, /1080P/),
      assert.doesNotMatch(_0x38f522, /data-ui-schema-value="4k"/),
      assert.match(_0x38f522, /data-ui-schema-type="slider"/),
      assert.match(_0x38f522, /data-ui-schema-range-values="5,10"/),
      assert.match(_0x38f522, /ui-schema-duration-slider/),
      assert.match(_0x38f522, />5S</),
      assert.match(_0x38f522, />10S</));
    const _0x1018be = renderModelUiSchemaControls(
      'apimart/kling-video-o1',
      { generationParams: { duration: 10 } },
      { placement: 'mode' },
    );
    (assert.doesNotMatch(_0x1018be, /data-ui-schema-type="slider"/),
      assert.doesNotMatch(_0x1018be, /data-ui-schema-field="duration"/),
      assert.equal(
        resolveModelExecution('apimart/kling-video-o1')?.executionManifest?.extensions?.bodyResolver,
        'apimartKlingO1Video',
      ));
    const _0xa6e219 = renderModelUiSchemaControls(
      'apimart/viduq3',
      { generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' } },
      { placement: 'mode' },
    );
    (assert.match(_0xa6e219, /data-ui-schema-field="vidu_q3_generation_mode"/),
      assert.match(_0xa6e219, /data-ui-schema-field="mode"/),
      assert.ok(
        _0xa6e219.indexOf('data-ui-schema-field="mode"') <
          _0xa6e219.indexOf('data-ui-schema-field="vidu_q3_generation_mode"'),
      ),
      assert.match(_0xa6e219, /data-ui-schema-value="viduq3-turbo"[^>]*data-ui-schema-disabled="true"/),
      assert.match(_0xa6e219, /data-ui-schema-value="viduq3"/));
    const _0x4c559b = renderModelUiSchemaControls(
      'apimart/viduq3',
      { generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3-mix' } },
      { placement: 'resolution' },
    );
    (assert.match(_0x4c559b, /data-ui-schema-value="540p"[^>]*data-ui-schema-disabled="true"/),
      assert.match(_0x4c559b, /data-ui-schema-value="1080p"/),
      assert.match(_0x4c559b, /data-ui-schema-field="duration"/),
      assert.ok(
        _0x4c559b.indexOf('data-ui-schema-composite-field="qualityRatio"') <
          _0x4c559b.indexOf('data-ui-schema-field="duration"'),
      ),
      [
        'apimart/luma-ray-v2',
        'apimart/veo3-fast',
        'apimart/minimax-hailuo',
        'apimart/minimax-hailuo-2.3',
        'apimart/happyhorse-1.0',
        'apimart/wan2.7',
        'apimart/kling-v1-5',
        'apimart/kling-v3',
        'apimart/kling-v3-omni',
        'apimart/kling-video-o1',
        'apimart/viduq3',
      ].forEach((_0xd2c521) => {
        const _0x30b205 = renderModelUiSchemaControls(_0xd2c521, {}, { placement: 'mode' }),
          _0x3752ec = renderModelUiSchemaControls(_0xd2c521, {}, { placement: 'resolution' });
        (assert.doesNotMatch(_0x30b205, /data-ui-schema-field="duration"/, _0xd2c521),
          assert.match(_0x3752ec, /data-ui-schema-composite-field="qualityRatio"/, _0xd2c521),
          assert.match(_0x3752ec, /data-ui-schema-field="duration"/, _0xd2c521),
          assert.ok(
            _0x3752ec.indexOf('data-ui-schema-composite-field="qualityRatio"') <
              _0x3752ec.indexOf('data-ui-schema-field="duration"'),
            _0xd2c521,
          ));
      }),
      assert.match(source, /resolveVideoModelApiFooterPlacementOrder/),
      assert.match(source, /footerPlacementOrder/),
      assert.match(
        source,
        /useModelApiSchemaParams \? renderModelApiModeBeforeResolution \? "" : modelApiModeControlsHtml \? modelApiModePlacementHtml : "" : `<div class="vid-mode-wrap"/,
      ),
      assert.match(
        source,
        /useDreaminaSchemaParams \|\| useModelApiSchemaParams \? "" : `<div class="vid-duration-wrap"/,
      ),
      assert.ok(
        source.indexOf('renderModelApiModeBeforeResolution ? modelApiModePlacementHtml') <
          source.indexOf('modelApiResolutionControlsHtml ? modelApiResolutionPlacementHtml'),
      ));
  }),
  test('APIMart added video modelApi controls use shared Chinese schema labels', () => {
    const _0x10197f = [
        'apimart/veo3-fast',
        'apimart/grok-imagine-1.0',
        'apimart/omni-flash-ext',
        'apimart/minimax-hailuo-2.3',
        'apimart/happyhorse-1.0',
        'apimart/wan2.7',
        'apimart/kling-v3',
        'apimart/kling-v3-omni',
        'apimart/kling-video-o1',
        'apimart/viduq3',
      ],
      _0x2e3092 = new Set([
        'Duration',
        'Resolution',
        'Ratio',
        'Mode',
        'Audio',
        'Watermark',
        'Seed',
        'Negative Prompt',
        'Prompt Extend',
        'GIF Output',
        'Edit Audio',
        'Shot Type',
        'Standard',
        'Professional',
        'Pro',
        'Single',
        'Multi',
        'Auto',
        'Origin',
      ]);
    _0x10197f.forEach((_0x51e1eb) => {
      const _0x1386a8 = getModelManifest(_0x51e1eb),
        _0x189da3 = _0x1386a8?.uiSchema?.fields || [];
      _0x189da3.forEach((_0x487584) => {
        (assert.equal(_0x2e3092.has(_0x487584.label), false, _0x51e1eb + ':' + _0x487584.id),
          (_0x487584.options || []).forEach((_0x1b9e7f) => {
            assert.equal(
              _0x2e3092.has(_0x1b9e7f.label),
              false,
              _0x51e1eb + ':' + _0x487584.id + ':' + _0x1b9e7f.value,
            );
          }));
      });
      const _0x1e7763 = _0x189da3.find((_0x3bd886) => _0x3bd886.id === 'duration');
      if (_0x1e7763) assert.equal(_0x1e7763.label, '视频时长');
      const _0x43daa3 = _0x189da3.find((_0x176cd9) => _0x176cd9.id === 'resolution');
      if (_0x43daa3) assert.equal(_0x43daa3.label, '视频分辨率');
      const _0x2ace2e = _0x189da3.find((_0x3b3a15) => _0x3b3a15.id === 'aspectRatio');
      _0x2ace2e &&
        (assert.equal(_0x2ace2e.label, '比例'), assert.equal(_0x2ace2e.displayRole, 'aspectRatio'));
    });
    const _0xd5b489 = (_0x3960ef, _0x20b613) =>
      resolveModelExecution(_0x3960ef)?.executionManifest?.bodyMapping?.find(
        (_0x31dd63) => _0x31dd63.path === _0x20b613,
      );
    (assert.equal(_0xd5b489('apimart/happyhorse-1.0', 'resolution')?.defaultValue, '1080P'),
      assert.equal(_0xd5b489('apimart/wan2.7', 'resolution')?.defaultValue, '1080P'),
      assert.equal(_0xd5b489('apimart/viduq3', 'audio')?.defaultValue, true),
      assert.equal(
        resolveModelExecution('apimart/wan2.7')?.executionManifest?.extensions?.bodyResolver,
        'apimartWan27Video',
      ),
      assert.equal(
        resolveModelExecution('apimart/kling-v3-omni')?.executionManifest?.extensions?.bodyResolver,
        'apimartKlingV3OmniVideo',
      ));
  }),
  test('video parameter panel lazy mounts provider model menu', () => {
    (assert.match(source, /_buildVideoModelMenuHtml\(activeModel = ""\)/),
      assert.match(source, /data-lazy-model-menu="video"/),
      assert.match(source, /const ensureVideoModelMenuContent = \(\) =>/),
      assert.match(source, /bindNodeSubmenus\(modelMenu\)/),
      assert.doesNotMatch(source, /const modelMenuHtml = renderNodeModelMenu/),
      assert.doesNotMatch(source, /\$\{modelMenuHtml\}/));
  }),
  test('Dreamina and APIMart task model menus keep existing HTML contract', () => {
    (assert.deepEqual(
      getDreaminaTaskModelMenuItems('multimodal2video', 'dreamina').map((_0x4d0ba9) => _0x4d0ba9.model),
      [
        'dreamina/seedance2.0fast_vip',
        'dreamina/seedance2.0_vip',
        'dreamina/seedance2.0fast',
        'dreamina/seedance2.0',
      ],
    ),
      assert.deepEqual(
        getDreaminaTaskModelMenuItems('frames2video', 'dreamina').map((_0x5bdbaa) => _0x5bdbaa.model),
        [
          'dreamina/seedance2.0fast_vip',
          'dreamina/seedance2.0_vip',
          'dreamina/seedance2.0fast',
          'dreamina/seedance2.0',
          'dreamina/3.5pro',
          'dreamina/3.0',
        ],
      ),
      assert.deepEqual(
        getDreaminaTaskModelMenuItems('frames2video', 'apimart').map((_0x3d8ed5) => _0x3d8ed5.model),
        [
          'apimart/doubao-seedance-2.0-fast',
          'apimart/doubao-seedance-2.0',
          'apimart/doubao-seedance-2.0-fast-face',
          'apimart/doubao-seedance-2.0-face',
          'apimart/doubao-seedance-1-5-pro',
          'apimart/doubao-seedance-1-0-pro-quality',
        ],
      ));
    const _0x2ae3da = buildDreaminaTaskModelMenuHtml(
      'dreamina/seedance2.0fast',
      'multimodal2video',
      'dreamina',
    );
    (assert.match(_0x2ae3da, /<img src="images\/jimeng\.png" class="node-menu-icon" alt="dreamina">/),
      assert.match(
        _0x2ae3da,
        /class="floating-menu-item node-menu-item active" data-value="dreamina\/seedance2\.0fast" data-provider="dreamina" data-dreamina-task-model="1"/,
      ),
      assert.match(_0x2ae3da, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      assert.match(_0x2ae3da, /<div class="fmi-sub">默认推荐，支持文生、图生、首尾帧、全能参考<\/div>/));
    const _0x74b6fa = buildDreaminaTaskModelMenuHtml(
      'apimart/doubao-seedance-2.0-fast',
      'multimodal2video',
      'apimart',
    );
    (assert.match(_0x74b6fa, /node-menu-icon-apimart">AM<\/div>/),
      assert.match(
        _0x74b6fa,
        /class="floating-menu-item node-menu-item active" data-value="apimart\/doubao-seedance-2\.0-fast" data-provider="apimart" data-dreamina-task-model="1"/,
      ),
      assert.match(_0x74b6fa, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      assert.match(
        _0x74b6fa,
        /<div class="fmi-sub">APIMart 快速版，支持文生、图生、首尾帧与参考素材<\/div>/,
      ));
    const _0x54428c = buildDreaminaTaskModelMenuHtml(
      'dreamina/seedance2.0fast',
      'multiframe2video',
      'dreamina',
    );
    (assert.match(_0x54428c, /class="floating-menu-item node-menu-item disabled" data-disabled="true"/),
      assert.match(_0x54428c, /<div class="fmi-title">智能多帧<\/div>/),
      assert.match(_0x54428c, /<div class="fmi-sub">暂未开放模型切换<\/div>/),
      assert.match(source, /taskModelMenu\.innerHTML = buildDreaminaTaskModelMenuHtml\(/),
      assert.doesNotMatch(source, /_buildDreaminaModelMenuHTML/),
      assert.doesNotMatch(_0x2ae3da, /style=/),
      assert.doesNotMatch(_0x74b6fa, /style=/),
      assert.doesNotMatch(_0x54428c, /style=/));
  }),
  test('video parameter panel: RunningHub instance control is rendered by uiSchema', () => {
    const _0x24a03c = renderModelUiSchemaControls(
      'runninghub/2054101324521844738',
      { generationParams: { rhInstanceType: 'plus' } },
      { placement: 'instance', variant: 'instanceToggle' },
    );
    (assert.match(_0x24a03c, /data-ui-schema-field="rhInstanceType"/),
      assert.match(_0x24a03c, /rh-vram-btn/),
      assert.match(_0x24a03c, />48G</));
    const _0x474407 = buildUiSchemaParamPatch(
      {
        model: 'runninghub/2054101324521844738',
        rhInstanceType: 'default',
        generationParams: { rhInstanceType: 'default' },
      },
      'rhInstanceType',
      'plus',
    );
    (assert.equal(Object.prototype.hasOwnProperty.call(_0x474407, 'rhInstanceType'), false),
      assert.equal(_0x474407.generationParams.rhInstanceType, 'plus'));
  }),
  test('Dreamina video normal params render through direct uiSchema fields', () => {
    const _0x4ebafc = getDreaminaEffectiveNodeData({
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        duration: 7,
        aspectRatio: '自适应',
        generationParams: { duration: 6, aspectRatio: '16:9', resolution: '1080p' },
      }),
      _0x3eb319 = buildDreaminaParamSchemaFields({
        routeMode: 'multimodal2video',
        currentRatio: _0x4ebafc.aspectRatio,
        currentResolution: _0x4ebafc.resolution,
        currentDuration: _0x4ebafc.duration,
        durationRange: { min: 4, max: 10, step: 1 },
        resolutionOptions: ['720p', '1080p'],
      }),
      _0x30ecda = renderUiSchemaFields([_0x3eb319.resolution, _0x3eb319.aspectRatio], _0x4ebafc, {
        placement: 'resolution',
      }),
      _0x5eaf69 = renderUiSchemaFields([_0x3eb319.mode], _0x4ebafc),
      _0x43e443 = renderUiSchemaFields([_0x3eb319.duration], _0x4ebafc);
    (assert.equal(_0x4ebafc.duration, 6),
      assert.equal(_0x4ebafc.aspectRatio, '16:9'),
      assert.match(_0x5eaf69, /multimodal2video/),
      assert.match(_0x5eaf69, /frames2video/),
      assert.doesNotMatch(_0x5eaf69, /multiframe2video/),
      assert.doesNotMatch(_0x5eaf69, /智能多帧/),
      assert.match(source, /const useDreaminaSchemaParams = Boolean\(dreaminaState\)/),
      assert.match(
        source,
        /useDreaminaSchemaParams \? "" : rhResolutionControlsHtml \? wrapUiSchemaPlacementControls\(rhResolutionControlsHtml\) : !showRhParams && modelApiResolutionControlsHtml/,
      ),
      assert.match(_0x30ecda, /img-rp-quality-area/),
      assert.match(_0x30ecda, /img-rp-ratio-area/),
      assert.match(_0x30ecda, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(_0x30ecda, /data-ui-schema-field="resolution"/),
      assert.doesNotMatch(_0x30ecda, /ui-schema-video-resolution-pill/),
      assert.doesNotMatch(
        nodeTypesCss,
        /\.video-node \.img-rp-large-adaptive\s*\{[^}]*background:\s*var\(--white-10\)/,
      ),
      assert.match(_0x43e443, /ui-schema-duration-pill/),
      assert.match(_0x43e443, /floating-menu ui-schema-popup ui-schema-duration-pop/),
      assert.doesNotMatch(_0x43e443, /ui-schema-duration-pop"[^>]*style=/),
      assert.match(_0x43e443, /ui-schema-duration-title/),
      assert.match(_0x43e443, /ui-schema-duration-bounds/),
      assert.match(source, /if \(!isDreamina\) \{[\s\S]*?querySelectorAll\("\.img-rp-ratio-item"\)/),
      assert.match(source, /if \(adaptiveBtn && !isDreamina\)/),
      assert.match(source, /buildImageSchemaAspectRatioDisplayPatch/),
      assert.match(source, /_commitDreaminaSchemaAspectRatio\(value, latest\)/),
      assert.match(source, /inputKinds:\s*\["image",\s*"video"\]/),
      assert.match(uiModuleModelHelpersSource, /export function buildImageSchemaAspectRatioDisplayPatch/),
      assert.match(imageUiModuleSource, /buildImageSchemaAspectRatioDisplayPatch/),
      assert.match(source, /store\.updateNodeData\(this\.nodeId, patch\)/),
      assert.doesNotMatch(source, /const applyDreaminaAdaptiveDisplayRatio = \(nw, nh\)/),
      assert.doesNotMatch(source, /_resolveDreaminaAdaptiveRatioDisplayValue/),
      assert.doesNotMatch(source, /_buildDreaminaAspectRatioDisplayPatch/),
      assert.doesNotMatch(source, /_getDreaminaAdaptiveSourceSize/),
      assert.doesNotMatch(source, /pickClosestDreaminaVideoAdaptiveRatio/),
      assert.doesNotMatch(source, /persistAspectRatio:\s*false/));
    const _0x1a9808 = {
        textContent: '',
        querySelector() {
          return null;
        },
      },
      _0x44a537 = { value: '' },
      _0x37c754 = {
        dataset: { uiSchemaField: 'duration', uiSchemaDefault: '6' },
        classList: {
          contains(_0x3c98f5) {
            return _0x3c98f5 === 'ui-schema-duration-pill';
          },
        },
        querySelectorAll() {
          return [];
        },
        querySelector(_0x5d781e) {
          if (_0x5d781e === '[data-ui-schema-input]') return _0x44a537;
          if (_0x5d781e === '.ui-schema-duration-label') return _0x1a9808;
          if (_0x5d781e === '.ui-schema-pill-label') return _0x1a9808;
          return null;
        },
      };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(_0x554e50) {
          if (_0x554e50 === '[data-ui-schema-field]') return [_0x37c754];
          return [];
        },
      },
      { generationParams: { duration: 4 } },
    ),
      assert.equal(_0x1a9808.textContent, '4S'),
      assert.notEqual(_0x1a9808.textContent, 'Resolution 4'));
    const _0x219872 = buildDreaminaParamPatch(_0x4ebafc, {
      duration: 8,
      resolution: '720p',
      aspectRatio: '1:1',
    });
    (assert.equal(Object.prototype.hasOwnProperty.call(_0x219872, 'duration'), false),
      assert.equal(Object.prototype.hasOwnProperty.call(_0x219872, 'resolution'), false),
      assert.equal(_0x219872.generationParams.duration, 8),
      assert.equal(_0x219872.generationParams.resolution, '720p'),
      assert.equal(_0x219872.generationParamsByModel['dreamina/seedance2.0fast'].aspectRatio, '1:1'));
  }),
  test('Dreamina/APIMart video model selection restores per-model generation params', () => {
    const _0x1ba98b = buildDreaminaModelSelectionParamPatch(
      {
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        generationParams: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 6,
        },
        generationParamsByModel: {
          'dreamina/seedance2.0': {
            dreaminaRouteMode: 'frames2video',
            aspectRatio: '9:16',
            resolution: '720p',
            duration: 12,
          },
        },
      },
      {
        model: 'dreamina/seedance2.0',
        provider: 'dreamina',
        taskType: 'multimodal2video',
        fallbackValues: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '1:1',
          resolution: '720p',
          duration: 4,
        },
      },
    );
    (assert.equal(
      _0x1ba98b.generationParamsByModel['dreamina/seedance2.0fast'].dreaminaRouteMode,
      'multimodal2video',
    ),
      assert.equal(_0x1ba98b.generationParamsByModel['dreamina/seedance2.0fast'].aspectRatio, '16:9'),
      assert.equal(_0x1ba98b.generationParamsByModel['dreamina/seedance2.0fast'].resolution, '720p'),
      assert.equal(_0x1ba98b.generationParamsByModel['dreamina/seedance2.0fast'].duration, 6),
      assert.equal(
        _0x1ba98b.generationParamsByModel['dreamina/seedance2.0fast'].dreaminaModelByRouteMode[
          'dreamina:multimodal2video'
        ],
        'dreamina/seedance2.0',
      ),
      assert.equal(_0x1ba98b.generationParams.aspectRatio, '9:16'),
      assert.equal(_0x1ba98b.generationParams.duration, 12),
      assert.equal(_0x1ba98b.generationParams.resolution, '720p'),
      assert.equal(_0x1ba98b.dreaminaRouteMode, 'multimodal2video'),
      assert.equal(_0x1ba98b.generationParams.dreaminaRouteMode, 'multimodal2video'));
    const _0xf3d444 = buildDreaminaModelSelectionParamPatch(
      {
        model: 'apimart/doubao-seedance-2.0-fast',
        provider: 'apimart',
        generationParams: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '1:1',
          resolution: '480p',
          duration: 5,
        },
        generationParamsByModel: {
          'apimart/doubao-seedance-2.0': {
            dreaminaRouteMode: 'multimodal2video',
            aspectRatio: '21:9',
            resolution: '1080p',
            duration: 11,
          },
        },
      },
      {
        model: 'apimart/doubao-seedance-2.0',
        provider: 'apimart',
        taskType: 'multimodal2video',
        fallbackValues: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '16:9',
          resolution: '480p',
          duration: 4,
        },
      },
    );
    (assert.equal(_0xf3d444.generationParams.aspectRatio, '21:9'),
      assert.equal(_0xf3d444.generationParams.resolution, '1080p'),
      assert.equal(_0xf3d444.generationParams.duration, 11),
      assert.equal(_0xf3d444.generationParamsByModel['apimart/doubao-seedance-2.0-fast'].resolution, '480p'),
      assert.doesNotMatch(source, /_buildDreaminaModelSelectionParamPatch\(this\._data/),
      assert.doesNotMatch(source, /resolveDreaminaRememberedRouteModel\(this\._data/));
  }),
  test('ordinary APIMart modelApi video selection scopes generation params per model', () => {
    const _0x3b7188 = buildVideoModelApiModelSelectionPatch(
      {
        model: 'apimart/veo3-fast',
        provider: 'apimart',
        generationParams: {
          mode: 'quality',
          generation_type: 'frame',
          duration: 8,
          resolution: '720p',
          aspectRatio: '9:16',
        },
      },
      'apimart/minimax-hailuo',
      'apimart',
      { model: 'apimart/minimax-hailuo', provider: 'apimart' },
    );
    (assert.equal(Object.hasOwn(_0x3b7188.generationParams, 'mode'), false),
      assert.equal(_0x3b7188.generationParams.duration, 5),
      assert.equal(_0x3b7188.generationParams.resolution, '768p'),
      assert.equal(_0x3b7188.generationParams.aspectRatio, '自适应'),
      assert.equal(_0x3b7188.generationParams.prompt_optimizer, true),
      assert.equal(_0x3b7188.generationParams.fast_pretreatment, false),
      assert.equal(_0x3b7188.generationParams.watermark, false),
      assert.equal(_0x3b7188.generationParamsByModel['apimart/veo3-fast'].resolution, '720p'));
    const _0x1e28d7 = buildVideoModelApiModelSelectionPatch(
      {
        model: 'apimart/veo3-fast',
        provider: 'apimart',
        generationParams: { mode: 'fast', generation_type: 'frame', duration: 8, resolution: '720p' },
        generationParamsByModel: {
          'apimart/minimax-hailuo': { duration: 10, resolution: '1080p', prompt_optimizer: false },
        },
      },
      'apimart/minimax-hailuo',
      'apimart',
      { model: 'apimart/minimax-hailuo', provider: 'apimart' },
    );
    (assert.equal(Object.hasOwn(_0x1e28d7.generationParams, 'mode'), false),
      assert.equal(_0x1e28d7.generationParams.duration, 5),
      assert.equal(_0x1e28d7.generationParams.resolution, '1080p'),
      assert.equal(_0x1e28d7.generationParams.prompt_optimizer, false));
    const _0x3b8f25 = buildVideoModelApiModelSelectionPatch(
      {
        model: 'apimart/veo3-fast',
        provider: 'apimart',
        generationParams: { mode: 'fast', generation_type: 'frame', duration: 8, resolution: '720p' },
        generationParamsByModel: { 'apimart/minimax-hailuo': { duration: 10, resolution: '720p' } },
      },
      'apimart/minimax-hailuo',
      'apimart',
      { model: 'apimart/minimax-hailuo', provider: 'apimart' },
    );
    (assert.equal(Object.hasOwn(_0x3b8f25.generationParams, 'mode'), false),
      assert.equal(_0x3b8f25.generationParams.duration, 10),
      assert.equal(_0x3b8f25.generationParams.resolution, '768p'),
      assert.match(source, /buildVideoModelApiModelSelectionPatch/),
      assert.match(source, /targetExecution\.canonicalModelId/));
  }),
  test('ordinary APIMart modelApi video selection resets every target schema independently', () => {
    const _0x56c0e6 = [
        'apimart/veo3-fast',
        'apimart/grok-imagine-1.0',
        'apimart/omni-flash-ext',
        'apimart/minimax-hailuo',
        'apimart/minimax-hailuo-2.3',
        'apimart/happyhorse-1.0',
        'apimart/wan2.7',
        'apimart/kling-v3',
        'apimart/kling-v3-omni',
        'apimart/kling-video-o1',
        'apimart/viduq3',
      ],
      _0x55ad50 = {
        vidu_q3_generation_mode: 'reference',
        mode: 'quality',
        generation_type: 'reference',
        happyhorse_mode: 'edit',
        duration: 15,
        resolution: '720p',
        aspectRatio: '9:16',
        enable_gif: true,
        prompt_optimizer: false,
        prompt_extend: false,
        audio_setting: 'origin',
        audio: true,
        shot_type: 'multi',
        watermark: true,
        seed: '999',
        negative_prompt: 'blur',
      };
    for (const _0x1e8bcb of _0x56c0e6) {
      const _0x3e5a24 = buildVideoModelApiModelSelectionPatch(
        { model: 'apimart/luma-ray-v2', provider: 'apimart', generationParams: _0x55ad50 },
        _0x1e8bcb,
        'apimart',
        { model: _0x1e8bcb, provider: 'apimart' },
      );
      assert.deepEqual(
        _0x3e5a24.generationParams,
        buildModelUiSchemaDefaultParams(_0x1e8bcb),
        _0x1e8bcb + ' should start from its own uiSchema defaults',
      );
      const _0x3b74de = new Set(
        (getModelManifest(_0x1e8bcb)?.uiSchema?.fields || []).map((_0x59e815) => _0x59e815.id),
      );
      assert.deepEqual(
        Object.keys(_0x3e5a24.generationParams).sort(),
        [..._0x3b74de].sort(),
        _0x1e8bcb + ' should not keep fields from another model',
      );
    }
  }),
  test('Dreamina route mode switch restores the model version selected in that mode', () => {
    const _0x528436 = buildDreaminaModelSelectionParamPatch(
      {
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        dreaminaRouteMode: 'frames2video',
        generationParams: {
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '3:4',
          resolution: '720p',
          duration: 4,
        },
      },
      {
        model: 'dreamina/3.5pro',
        provider: 'dreamina',
        taskType: 'frames2video',
        fallbackValues: {
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '3:4',
          resolution: '720p',
          duration: 4,
        },
      },
    );
    assert.equal(_0x528436.dreaminaModelByRouteMode['dreamina:frames2video'], 'dreamina/3.5pro');
    const _0x3460f9 = buildDreaminaRouteModeUpdate({
      nextRouteMode: 'frames2video',
      baseNodeData: {
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        dreaminaRouteMode: 'multimodal2video',
        generationParams: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 6,
          dreaminaModelByRouteMode: {
            'dreamina:frames2video': 'dreamina/3.5pro',
            'dreamina:multimodal2video': 'dreamina/seedance2.0fast',
          },
        },
      },
      incoming: [
        { id: 'edge-1', sourceId: 'image-1' },
        { id: 'edge-2', sourceId: 'image-2' },
      ],
      nodes: { 'image-1': { type: 'source-image' }, 'image-2': { type: 'source-image' } },
    });
    (assert.equal(_0x3460f9.patch.model, 'dreamina/3.5pro'),
      assert.equal(_0x3460f9.patch.dreaminaRouteMode, 'frames2video'),
      assert.equal(_0x3460f9.patch.dreaminaModelByRouteMode['dreamina:frames2video'], 'dreamina/3.5pro'),
      assert.equal(
        _0x3460f9.patch.generationParams.dreaminaModelByRouteMode['dreamina:frames2video'],
        'dreamina/3.5pro',
      ));
  }),
  test('Dreamina task model version switch restores target model params', () => {
    const _0x18d063 = buildDreaminaModelSelectionParamPatch(
      {
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        dreaminaRouteMode: 'frames2video',
        generationParams: {
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '3:4',
          resolution: '720p',
          duration: 4,
          dreaminaModelByRouteMode: {
            'dreamina:frames2video': 'dreamina/seedance2.0fast',
            'dreamina:multimodal2video': 'dreamina/seedance2.0',
          },
        },
        generationParamsByModel: {
          'dreamina/seedance2.0': {
            dreaminaRouteMode: 'frames2video',
            aspectRatio: '9:16',
            resolution: '720p',
            duration: 12,
          },
        },
      },
      {
        model: 'dreamina/seedance2.0',
        provider: 'dreamina',
        taskType: 'frames2video',
        fallbackValues: {
          dreaminaRouteMode: 'frames2video',
          aspectRatio: '3:4',
          resolution: '720p',
          duration: 4,
        },
      },
    );
    (assert.equal(_0x18d063.dreaminaRouteMode, 'frames2video'),
      assert.equal(_0x18d063.generationParams.dreaminaRouteMode, 'frames2video'),
      assert.equal(_0x18d063.generationParams.aspectRatio, '9:16'),
      assert.equal(_0x18d063.generationParams.duration, 12),
      assert.equal(_0x18d063.dreaminaModelByRouteMode['dreamina:frames2video'], 'dreamina/seedance2.0'),
      assert.doesNotMatch(source, /restoreTargetParams:\s*false/));
  }),
  test('Dreamina and APIMart provider entry switch keeps remembered route model', () => {
    const _0x321810 = {
        model: 'apimart/doubao-seedance-1-5-pro',
        provider: 'apimart',
        dreaminaRouteMode: 'multimodal2video',
        generationParams: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '16:9',
          resolution: '720p',
          duration: 6,
          dreaminaModelByRouteMode: {
            'dreamina:multimodal2video': 'dreamina/seedance2.0',
            'apimart:multimodal2video': 'apimart/doubao-seedance-1-5-pro',
            'apimart:frames2video': 'apimart/doubao-seedance-2.0-face',
          },
        },
        generationParamsByModel: {
          'dreamina/seedance2.0': {
            dreaminaRouteMode: 'multimodal2video',
            aspectRatio: '9:16',
            resolution: '720p',
            duration: 12,
          },
          'apimart/doubao-seedance-2.0-face': {
            dreaminaRouteMode: 'frames2video',
            aspectRatio: '3:4',
            resolution: '1080p',
            duration: 8,
            dreaminaModelByRouteMode: { 'apimart:frames2video': 'apimart/doubao-seedance-2.0-face' },
          },
        },
      },
      _0x38c7fc = resolveDreaminaRememberedRouteModel(_0x321810, {
        provider: 'dreamina',
        routeMode: 'multimodal2video',
        taskType: 'multimodal2video',
        fallbackModel: 'dreamina/seedance2.0fast',
      });
    assert.equal(_0x38c7fc, 'dreamina/seedance2.0');
    const _0x239735 = buildDreaminaModelSelectionParamPatch(_0x321810, {
      model: _0x38c7fc,
      provider: 'dreamina',
      taskType: 'multimodal2video',
      fallbackValues: {
        dreaminaRouteMode: 'multimodal2video',
        aspectRatio: _0x321810.generationParams.aspectRatio,
        resolution: _0x321810.generationParams.resolution,
        duration: _0x321810.generationParams.duration,
      },
    });
    (assert.equal(_0x239735.generationParams.aspectRatio, '9:16'),
      assert.equal(_0x239735.generationParams.duration, 12),
      assert.equal(_0x239735.generationParamsByModel['apimart/doubao-seedance-1-5-pro'].aspectRatio, '16:9'));
    const _0x946d2c = resolveDreaminaRememberedRouteModel(
      { ..._0x321810, model: _0x38c7fc, provider: 'dreamina', ..._0x239735 },
      {
        provider: 'apimart',
        routeMode: 'multimodal2video',
        taskType: 'multimodal2video',
        fallbackModel: 'apimart/doubao-seedance-2.0-fast',
      },
    );
    assert.equal(_0x946d2c, 'apimart/doubao-seedance-1-5-pro');
    const _0x3e03a2 = buildDreaminaModelSelectionParamPatch(
      { ..._0x321810, model: _0x38c7fc, provider: 'dreamina', ..._0x239735 },
      {
        model: _0x946d2c,
        provider: 'apimart',
        taskType: 'multimodal2video',
        fallbackValues: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: _0x239735.generationParams.aspectRatio,
          resolution: _0x239735.generationParams.resolution,
          duration: _0x239735.generationParams.duration,
        },
      },
    );
    (assert.equal(_0x3e03a2.generationParams.aspectRatio, '16:9'),
      assert.equal(_0x3e03a2.generationParams.duration, 6),
      assert.equal(
        resolveDreaminaRememberedRouteModel(_0x321810, {
          provider: 'apimart',
          routeMode: 'frames2video',
          taskType: 'frames2video',
          fallbackModel: 'apimart/doubao-seedance-2.0-fast',
        }),
        'apimart/doubao-seedance-2.0-face',
      ),
      assert.equal(
        resolveDreaminaRememberedRouteModel(
          {
            model: 'dreamina/seedance2.0_vip',
            provider: 'dreamina',
            dreaminaRouteMode: 'multimodal2video',
            generationParams: {
              dreaminaRouteMode: 'multimodal2video',
              aspectRatio: '16:9',
              resolution: '720p',
              duration: 8,
            },
          },
          {
            provider: 'dreamina',
            routeMode: 'multimodal2video',
            taskType: 'multimodal2video',
            fallbackModel: 'dreamina/seedance2.0fast',
          },
        ),
        'dreamina/seedance2.0_vip',
      ),
      assert.equal(
        resolveDreaminaRememberedRouteModel(
          {
            model: 'apimart/doubao-seedance-2.0-fast',
            provider: 'apimart',
            dreaminaRouteMode: 'multimodal2video',
            generationParams: {
              dreaminaRouteMode: 'multimodal2video',
              aspectRatio: '16:9',
              resolution: '720p',
              duration: 8,
            },
            generationParamsByModel: {
              'dreamina/seedance2.0': {
                dreaminaRouteMode: 'multimodal2video',
                aspectRatio: '9:16',
                resolution: '720p',
                duration: 12,
              },
            },
          },
          {
            provider: 'dreamina',
            routeMode: 'multimodal2video',
            taskType: 'multimodal2video',
            fallbackModel: 'dreamina/seedance2.0fast',
          },
        ),
        'dreamina/seedance2.0',
      ),
      assert.equal(
        resolveDreaminaRememberedRouteModel(
          {
            model: 'apimart/doubao-seedance-2.0',
            provider: 'apimart',
            dreaminaRouteMode: 'multimodal2video',
            generationParams: {
              dreaminaRouteMode: 'multimodal2video',
              aspectRatio: '16:9',
              resolution: '720p',
              duration: 8,
            },
          },
          {
            provider: 'dreamina',
            routeMode: 'multimodal2video',
            taskType: 'multimodal2video',
            fallbackModel: 'dreamina/seedance2.0fast',
          },
        ),
        'dreamina/seedance2.0',
      ),
      assert.match(source, /commitDreaminaModelSelection\(\{/),
      assert.doesNotMatch(source, /resolveDreaminaRememberedRouteModel\(this\._data/));
  }),
  test('APIMart target params do not overwrite remembered Dreamina route model', () => {
    const _0x4184a7 = buildDreaminaModelSelectionParamPatch(
      {
        model: 'dreamina/seedance2.0',
        provider: 'dreamina',
        dreaminaRouteMode: 'multimodal2video',
        generationParams: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '9:16',
          resolution: '720p',
          duration: 12,
          dreaminaModelByRouteMode: { 'dreamina:multimodal2video': 'dreamina/seedance2.0' },
        },
        generationParamsByModel: {
          'apimart/doubao-seedance-2.0-fast': {
            dreaminaRouteMode: 'multimodal2video',
            aspectRatio: '16:9',
            resolution: '720p',
            duration: 6,
            dreaminaModelByRouteMode: {
              'dreamina:multimodal2video': 'dreamina/seedance2.0fast',
              'apimart:multimodal2video': 'apimart/doubao-seedance-2.0-fast',
            },
          },
        },
      },
      {
        model: 'apimart/doubao-seedance-2.0-fast',
        provider: 'apimart',
        taskType: 'multimodal2video',
        fallbackValues: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: '9:16',
          resolution: '720p',
          duration: 12,
        },
      },
    );
    (assert.equal(_0x4184a7.dreaminaModelByRouteMode['dreamina:multimodal2video'], 'dreamina/seedance2.0'),
      assert.equal(
        _0x4184a7.generationParams.dreaminaModelByRouteMode['dreamina:multimodal2video'],
        'dreamina/seedance2.0',
      ),
      assert.equal(
        resolveDreaminaRememberedRouteModel(
          {
            model: 'apimart/doubao-seedance-2.0-fast',
            provider: 'apimart',
            dreaminaRouteMode: 'multimodal2video',
            ..._0x4184a7,
          },
          {
            provider: 'dreamina',
            routeMode: 'multimodal2video',
            taskType: 'multimodal2video',
            fallbackModel: 'dreamina/seedance2.0fast',
          },
        ),
        'dreamina/seedance2.0',
      ));
  }),
  test('video node: RunningHub instance label sync uses uiSchema state', () => {
    (assert.match(videoNodeSource, /syncModelUiSchemaControls\(this\.footerEl,\s*schemaNodeData\)/),
      assert.doesNotMatch(videoNodeSource, /\(nodeData\?\.rhInstanceType \|\| "default"\) === "plus"/));
  }),
  test('video prompt placeholder can come from model manifest', () => {
    (assert.match(source, /resolveVideoPromptPlaceholder/),
      assert.match(source, /prompt\?\.variants/),
      assert.match(videoNodeSource, /_syncDreaminaPromptPlaceholder\(nodeData\)/),
      assert.match(
        getModelManifest('apimart/minimax-hailuo')?.prompt?.placeholder || '',
        /\[推进\]一只猫咪在花园中奔跑/,
      ));
    const _0x5a78a9 = getModelManifest('apimart/veo3-fast');
    (assert.match(
      resolveVideoPromptPlaceholder(_0x5a78a9, { generationParams: { generation_type: 'frame' } }),
      /首帧到尾帧/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x5a78a9, { generationParams: { generation_type: 'reference' } }),
        /参考图主体/,
      ));
    const _0x2515d8 = getModelManifest('apimart/happyhorse-1.0');
    (assert.match(
      resolveVideoPromptPlaceholder(_0x2515d8, { generationParams: { happyhorse_mode: 'auto' } }),
      /夕阳下的海边公路/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x2515d8, { generationParams: { happyhorse_mode: 'image' } }),
        /首帧图要如何动起来/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x2515d8, { generationParams: { happyhorse_mode: 'reference' } }),
        /@图片1 中的主角/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x2515d8, { generationParams: { happyhorse_mode: 'edit' } }),
        /改写源视频/,
      ));
    const _0x18cbcc = getModelManifest('apimart/wan2.7');
    (assert.match(
      resolveVideoPromptPlaceholder(_0x18cbcc, { generationParams: { wan27_mode: 'image' } }),
      /首帧\/尾帧/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x18cbcc, { generationParams: { wan27_mode: 'video' } }),
        /如何续写/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x18cbcc, { generationParams: { wan27_mode: 'reference' } }),
        /@图片1、@图片2、@视频1/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x18cbcc, { generationParams: { wan27_mode: 'edit' } }),
        /原视频做什么编辑/,
      ),
      assert.match(resolveVideoPromptPlaceholder(getModelManifest('apimart/kling-v3')), /@图片1 到 @图片2/));
    const _0x59d368 = getModelManifest('apimart/kling-v3-omni');
    (assert.match(
      resolveVideoPromptPlaceholder(_0x59d368, { generationParams: { kling_v3_omni_mode: 'image' } }),
      /@图片1 \/ @图片2/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x59d368, { generationParams: { kling_v3_omni_mode: 'reference' } }),
        /@图片1、@视频1/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x59d368, { generationParams: { kling_v3_omni_mode: 'edit' } }),
        /编辑原视频/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(getModelManifest('apimart/kling-video-o1')),
        /@图片1 中的人物/,
      ));
    const _0xc91607 = getModelManifest('apimart/viduq3');
    (assert.match(
      resolveVideoPromptPlaceholder(_0xc91607, { generationParams: { vidu_q3_generation_mode: 'video' } }),
      /@图片1 \+ @图片2/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(_0xc91607, {
          generationParams: { vidu_q3_generation_mode: 'reference' },
        }),
        /@图片1、@图片2/,
      ));
  }),
  test('video prompt input visibility can come from model manifest', () => {
    const _0x27614b = getModelManifest('runninghub/2060613773890768898');
    (assert.equal(_0x27614b?.prompt?.visible, false),
      assert.equal(shouldShowVideoPromptInput(_0x27614b), false),
      assert.equal(shouldShowVideoPromptInput(getModelManifest('apimart/kling-v3')), true),
      assert.match(videoNodeSource, /_syncPromptInputVisibility\(nodeData\)/),
      assert.match(videoNodeSource, /shouldShowVideoPromptInput\(resolved\?\.modelManifest\)/));
  }),
  test('Agnes Video prompt help uses ordinary-language manifest tips', () => {
    const _0x2a2bd7 = getModelManifest('agnes/agnes-video-v2.0');
    (assert.match(
      resolveVideoPromptPlaceholder(_0x2a2bd7, { generationParams: { agnes_video_mode: 'reference' } }),
      /图片里的主体怎么动/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(_0x2a2bd7, { generationParams: { agnes_video_mode: 'keyframes' } }),
        /首帧画面怎么动/,
      ));
    const _0x143b7d = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'agnes/agnes-video-v2.0',
      nodeData: { generationParams: { agnes_video_mode: 'reference' } },
    });
    (assert.match(_0x143b7d, /不上传图片/),
      assert.match(_0x143b7d, /上传多张图/),
      assert.doesNotMatch(_0x143b7d, /extra_body|keyframes|num_frames/));
    const _0x1fb081 = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'agnes/agnes-video-v2.0',
      nodeData: { generationParams: { agnes_video_mode: 'keyframes' } },
    });
    (assert.match(_0x1fb081, /首尾帧用法/),
      assert.match(_0x1fb081, /至少上传首帧图/),
      assert.match(_0x1fb081, /人物保持同一个人/),
      assert.doesNotMatch(_0x1fb081, /extra_body|keyframes|num_frames/));
  }),
  test('video node: subtract subject toggle refreshes refs without rebuilding footer', () => {
    const _0xe50fc2 = videoNodeSource.match(/const footerSig = [^\n]+;/)?.[0] || '';
    (assert.ok(_0xe50fc2),
      assert.doesNotMatch(_0xe50fc2, /rhSubtractSubject/),
      assert.match(
        videoNodeSource,
        /const subtractSubjectSig = String\(nodeData\?\.rhSubtractSubject \|\| ""\);[\s\S]*subtractSubjectSig !== this\._lastSubtractSubjectSig[\s\S]*this\._renderRefBar\(\);/,
      ),
      assert.match(videoNodeSource, /syncModelUiSchemaControls\(this\.footerEl,\s*schemaNodeData\)/));
  }),
  test('video parameter footer: uses compact pipe separators instead of down chevrons', () => {
    (assert.doesNotMatch(
      source,
      /<svg width="10" height="10"[^>]*stroke-width="2"[^>]*><polyline points="6 9 12 15 18 9"><\/polyline><\/svg>/,
    ),
      assert.match(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.img-model-pills > :not\(:first-child\)::before/,
      ),
      assert.match(nodeTypesCss, /content:\s*"\|"/),
      assert.match(nodeTypesCss, /padding-left:\s*18px/),
      assert.match(nodeTypesCss, /position:\s*absolute/),
      assert.match(nodeTypesCss, /left:\s*5px/),
      assert.match(nodeTypesCss, /text-overflow:\s*ellipsis/),
      assert.match(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.ui-schema-quality-ratio-label,[\s\S]*?\.video-node \.prompt-panel-footer \.ui-schema-section-pair-label\{width:max-content;min-width:max-content;\}/,
      ));
  }),
  test('Dreamina duration schema popup keeps floating-menu layout semantics', () => {
    (assert.match(
      nodeTypesCss,
      /\.ui-schema-pill-menu,\.ui-schema-section-menu,\.ui-schema-section-pair-pill,\.ui-schema-resolution-pill,\.ui-schema-duration-pill,/,
    ),
      assert.match(nodeTypesCss, /\.ui-schema-duration-pop\.show\{display:flex;\}/),
      assert.match(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.vid-duration-pop,[\s\S]*?\.ui-schema-duration-pop\{padding:12px;width:150px;box-sizing:border-box;flex-direction:column;gap:10px;\}/,
      ),
      assert.match(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.vid-duration-slider,[\s\S]*?\.ui-schema-range\.ui-schema-duration-slider\{width:100%;max-width:100%;min-width:0;accent-color:var\(--blue\);cursor:var\(--link-cursor\);\}/,
      ),
      assert.doesNotMatch(source, /vid-duration-pop" style="[^"]*width:150px/),
      assert.match(
        uiSchemaRendererSource,
        /item\.classList\?\.contains\("floating-menu"\)[\s\S]*?item\.style\.display = "";/,
      ),
      assert.match(
        uiSchemaRendererSource,
        /popup\.style\.display = "";[\s\S]*?popup\.classList\.toggle\("show", shouldOpen\)/,
      ));
  }),
  test('video schema parameter menus keep video footer typography', () => {
    (assert.match(nodeTypesCss, /\.floating-menu-item \{[\s\S]*?font-size:\s*13px;/),
      assert.match(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.ui-schema-pill-menu \.ui-schema-floating-menu \.floating-menu-item\{padding:6px 12px;border-radius:8px;\}/,
      ),
      assert.match(nodeTypesCss, /\.ui-schema-section-pair-label/),
      assert.match(
        source,
        /document\.addEventListener\("click", \(\) => \{[\s\S]*?const f = this\.footerEl;[\s\S]*?closeNodeFooterMenus\(f\);/,
      ));
  }),
  test('generation node help tooltip supports manifest markdown tables', () => {
    (assert.match(uiSchemaRendererSource + source, /ui-schema-floating-menu/),
      assert.match(
        readFileSync(join(__dirname, '..', 'generationNodeHelpTip.js'), 'utf8'),
        /renderMarkdownTableHelpContent[\s\S]*?generation-node-help-table/,
      ),
      assert.match(
        nodeTypesCss,
        /\.generation-node-help-tooltip-portal\.has-table\{[^}]*width:760px;[^}]*overflow:auto;/,
      ),
      assert.doesNotMatch(
        nodeTypesCss,
        /\.generation-node-help-tooltip-portal\.has-table\{[^}]*pointer-events:auto;/,
      ),
      assert.match(
        nodeTypesCss,
        /\.generation-node-help-tooltip-portal\.has-table\.is-open\{pointer-events:auto;\}/,
      ),
      assert.match(
        nodeTypesCss,
        /\.generation-node-help-table th,\.generation-node-help-table td\{[^}]*border:1px solid var\(--white-15\)/,
      ));
  }),
  test('RunningHub video advanced panel remains a dropdown below the footer', () => {
    (assert.match(nodeTypesCss, /\.rh-vram-adv-panel\s*\{[^}]*top:\s*calc\(100% \+ 8px\)/),
      assert.doesNotMatch(nodeTypesCss, /\.rh-vram-adv-panel\s*\{[^}]*bottom:\s*calc\(100% \+ 8px\)/));
  }),
  test('RunningHub V5.4 advanced panel keeps old layout and reopens after close', () => {
    (assert.match(
      nodeTypesCss,
      /\.rh-vram-adv-panel > \.ui-schema-renderer\{[^}]*align-items:stretch;[^}]*width:100%;/,
    ),
      assert.doesNotMatch(source, /isSchemaAdvancedPanel/),
      assert.doesNotMatch(source, /querySelectorAll\("\.rh-adv-seg-btn"\)/),
      assert.doesNotMatch(videoNodeSource, /rh-adv-seg-btn\[data-key/));
    const _0x559970 = new Set(['rh-vram-adv-panel', 'show']),
      _0x1a4dd9 = {
        style: { display: 'flex' },
        classList: {
          contains(_0x2a9afe) {
            return _0x559970.has(_0x2a9afe);
          },
          remove(_0x5cfb73) {
            _0x559970.delete(_0x5cfb73);
          },
        },
      };
    (closeNodeFooterMenus({
      querySelectorAll(_0x1c80a8) {
        return _0x1c80a8.includes('rh-vram-adv-panel') ? [_0x1a4dd9] : [];
      },
    }),
      assert.equal(_0x559970.has('show'), false),
      assert.equal(_0x1a4dd9.style.display, ''));
  }),
  test('RunningHub V5.4 advanced settings render from uiSchema with existing classes', () => {
    const _0x103e52 = 'runninghub/2041741496667348994';
    (assert.equal(hasModelUiSchema(_0x103e52, { placement: 'videoAdvanced' }), true),
      assert.equal(hasModelUiSchema(_0x103e52, { placement: 'v54Advanced' }), false));
    const _0x3ceb38 = renderModelUiSchemaControls(
      _0x103e52,
      {
        model: _0x103e52,
        rhControlMode: 'single',
        generationParams: {
          rhSingleControlPreset: 'stable',
          rhBlendIntoScene: true,
          rhSubtractSubject: true,
          rhMaskExpand: 18,
          rhMaskRect: false,
          rhSpecialMode: 'cameraMove',
          rhBreastJiggle: 0.35,
        },
      },
      { placement: 'videoAdvanced' },
    );
    (assert.doesNotMatch(source, /data-ui-schema-advanced-panel="1"/),
      assert.match(source, /placement:\s*"videoAdvanced"/),
      assert.match(
        source,
        /const schemaSyncNodeData = isDreamina[\s\S]*this\._getRhVideoAdvancedSchemaNodeData\(this\._data\);[\s\S]*syncModelUiSchemaControls\(footer, schemaSyncNodeData\);/,
      ),
      assert.match(_0x3ceb38, /data-ui-schema-placement="videoadvanced"/),
      assert.match(_0x3ceb38, /data-ui-schema-field="rhSingleControlPreset"/),
      assert.match(_0x3ceb38, /rh-vram-adv-row/),
      assert.match(_0x3ceb38, /rh-adv-control-line/),
      assert.match(_0x3ceb38, /rh-adv-seg-btn/),
      assert.match(_0x3ceb38, /data-key="rhSingleControlPreset"/),
      assert.match(_0x3ceb38, /rh-adv-seg-btn active" data-key="rhSingleControlPreset" data-value="stable"/),
      assert.match(_0x3ceb38, /rh-stepper-value/),
      assert.match(_0x3ceb38, /aria-valuenow="18"/),
      assert.match(_0x3ceb38, /rh-breast-jiggle-slider/),
      assert.match(_0x3ceb38, /value="0.35"/),
      assert.match(_0x3ceb38, /is-rh-disabled/));
  }),
  test('RunningHub V5.4 default special mode stays unselected when choosing single control', () => {
    const _0x110d8b = 'runninghub/2041741496667348994',
      _0x2619c5 = buildModelUiSchemaDefaultParams(_0x110d8b);
    (assert.equal(_0x2619c5.rhSpecialMode, 'none'),
      assert.equal(
        buildVideoWorkflowDisplayParamsPatch(_0x110d8b, _0x2619c5, { v54FpsOptions: [16, 24, 30] })
          .rhSpecialMode,
        null,
      ));
    const _0x716afc = buildUiSchemaParamPatch(
      { model: _0x110d8b, generationParams: _0x2619c5 },
      'rhSingleControlPreset',
      'stable',
    );
    (assert.equal(_0x716afc.generationParams.rhSingleControlPreset, 'stable'),
      assert.equal(_0x716afc.generationParams.rhSpecialMode, 'none'));
    const _0x294f53 = renderModelUiSchemaControls(
      _0x110d8b,
      { model: _0x110d8b, generationParams: _0x716afc.generationParams },
      { placement: 'videoAdvanced' },
    );
    (assert.match(_0x294f53, /data-ui-schema-field="rhSpecialMode"/),
      assert.doesNotMatch(_0x294f53, /data-value="none"/),
      assert.doesNotMatch(
        _0x294f53,
        /rh-adv-seg-btn active" data-key="rhSpecialMode" data-value="longVideoOverlay"/,
      ),
      assert.doesNotMatch(
        _0x294f53,
        /rh-adv-seg-btn active" data-key="rhSpecialMode" data-value="cameraMove"/,
      ));
  }),
  test('RunningHub Basic advanced settings render from videoAdvanced uiSchema', () => {
    const _0x476573 = 'runninghub/1971148165531475969';
    assert.equal(hasModelUiSchema(_0x476573, { placement: 'videoAdvanced' }), true);
    const _0x2531f4 = renderModelUiSchemaControls(
      _0x476573,
      { model: _0x476573, generationParams: { rhEnableMask: true } },
      { placement: 'videoAdvanced' },
    );
    (assert.match(_0x2531f4, /data-ui-schema-placement="videoadvanced"/),
      assert.match(_0x2531f4, /data-ui-schema-field="rhEnableMask"/),
      assert.match(_0x2531f4, /data-ui-schema-value-type="boolean"/),
      assert.match(
        _0x2531f4,
        /rh-adv-seg-btn active[^"]*" data-key="rhEnableMask"[^>]*data-ui-schema-value="true"/,
      ),
      assert.doesNotMatch(source, /data-key="rhEnableMask"/),
      assert.doesNotMatch(_0x2531f4, /ui-schema-toggle-group/));
  }),
  test('RunningHub Scail V1 advanced settings render from videoAdvanced uiSchema', () => {
    const _0x518616 = 'runninghub/2064961300823896065';
    assert.equal(hasModelUiSchema(_0x518616, { placement: 'videoAdvanced' }), true);
    const _0x384e44 = renderModelUiSchemaControls(
      _0x518616,
      {
        model: _0x518616,
        generationParams: {
          rhScail2PersonCount: 3,
          rhScailDetectPrompt: 'person, face',
          rhScail2ReplaceSubject: true,
        },
      },
      { placement: 'videoAdvanced' },
    );
    (assert.match(_0x384e44, /data-ui-schema-placement="videoadvanced"/),
      assert.match(_0x384e44, /data-ui-schema-field="rhScail2PersonCount"/),
      assert.match(_0x384e44, /rh-stepper-value/),
      assert.match(_0x384e44, /aria-valuenow="3"/),
      assert.match(_0x384e44, /识别人数不准时再调整/),
      assert.match(_0x384e44, /data-ui-schema-field="rhScailDetectPrompt"/),
      assert.match(_0x384e44, /data-ui-schema-type="textarea"/),
      assert.match(_0x384e44, /默认是 person，如无特殊要求请别进行修改/),
      assert.match(
        _0x384e44,
        /<textarea class="ui-schema-textarea" data-ui-schema-input="rhScailDetectPrompt">person, face<\/textarea>/,
      ));
    const _0xaed742 = buildUiSchemaParamPatch(
      { model: _0x518616, generationParams: { rhScailDetectPrompt: 'person' } },
      'rhScailDetectPrompt',
      '',
    );
    (assert.equal(_0xaed742.generationParams.rhScailDetectPrompt, ''),
      assert.equal(_0xaed742.generationParamsByModel[_0x518616].rhScailDetectPrompt, ''));
    const _0x3b59e7 = { value: 'person' };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(_0x4a66bb) {
          if (_0x4a66bb === '[data-ui-schema-field]')
            return [
              {
                dataset: { uiSchemaField: 'rhScailDetectPrompt', uiSchemaDefault: 'person' },
                classList: {
                  contains() {
                    return false;
                  },
                },
                querySelectorAll() {
                  return [];
                },
                querySelector(_0x4c3772) {
                  if (_0x4c3772 === '[data-ui-schema-input]') return _0x3b59e7;
                  return null;
                },
              },
            ];
          return [];
        },
      },
      { generationParams: { rhScailDetectPrompt: '' } },
    ),
      assert.equal(_0x3b59e7.value, ''),
      assert.match(_0x384e44, /data-ui-schema-field="rhScail2ReplaceSubject"/),
      assert.match(_0x384e44, /不需要换主体时保持否/),
      assert.match(_0x384e44, /data-ui-schema-value-type="boolean"/),
      assert.match(
        _0x384e44,
        /rh-adv-seg-btn active[^"]*" data-key="rhScail2ReplaceSubject"[^>]*data-ui-schema-value="true"/,
      ));
    const _0x33fd7d = renderModelUiSchemaControls(
      'runninghub/2065463417577762818',
      {
        model: 'runninghub/2065463417577762818',
        generationParams: {
          rhScail2PersonCount: 2,
          rhScailDetectPrompt: 'person',
          rhScail2ReplaceSubject: false,
          rhScailV2EnhancedMotionControl: false,
        },
      },
      { placement: 'videoAdvanced' },
    );
    (assert.match(_0x33fd7d, /data-ui-schema-field="rhScailDetectPrompt"/),
      assert.match(_0x33fd7d, /默认是 person，如无特殊要求请别进行修改/),
      assert.match(_0x33fd7d, /data-ui-schema-field="rhScailV2EnhancedMotionControl"/),
      assert.match(_0x33fd7d, /动作不稳定或跟随不足时再开启/),
      assert.doesNotMatch(source, /data-key="rhScail2PersonCount"/),
      assert.doesNotMatch(source, /data-key="rhScail2ReplaceSubject"/));
  }),
  test('RunningHub 视频去字幕V2 advanced settings render from existing uiSchema rows', () => {
    const _0x14de8b = 'runninghub/2060613773890768898';
    assert.equal(hasModelUiSchema(_0x14de8b, { placement: 'videoAdvanced' }), true);
    const _0x3db4e2 = renderModelUiSchemaControls(
      _0x14de8b,
      { model: _0x14de8b, generationParams: { rhWatermarkRemoveMode: 'mode2', rhRemoveWatermark: true } },
      { placement: 'videoAdvanced' },
    );
    (assert.match(_0x3db4e2, /data-ui-schema-placement="videoadvanced"/),
      assert.match(_0x3db4e2, /data-ui-schema-field="rhWatermarkRemoveMode"/),
      assert.match(_0x3db4e2, /模式选择/),
      assert.match(_0x3db4e2, /模式1[\s\S]*动态水印[\s\S]*模式2/),
      assert.match(_0x3db4e2, /遮罩参考只有在模式2时才能使用/),
      assert.match(
        _0x3db4e2,
        /rh-adv-seg-btn active[^"]*" data-key="rhWatermarkRemoveMode"[^>]*data-ui-schema-value="mode2"/,
      ),
      assert.match(_0x3db4e2, /data-ui-schema-field="rhRemoveWatermark"/),
      assert.match(_0x3db4e2, /data-ui-schema-value-type="boolean"/),
      assert.match(
        _0x3db4e2,
        /rh-adv-seg-btn active[^"]*" data-key="rhRemoveWatermark"[^>]*data-ui-schema-value="true"/,
      ),
      assert.doesNotMatch(source, /data-key="rhWatermarkRemoveMode"/),
      assert.doesNotMatch(source, /data-key="rhRemoveWatermark"/));
  }),
  test('uiSchema text inputs debounce live commits and flush the latest value', async () => {
    const _0x155598 = new Map();
    let _0x3f6d6e = { generationParams: { rhScailDetectPrompt: 'person' } };
    const _0x45fb76 = [],
      _0x5d1c19 = {
        dataset: {
          uiSchemaField: 'rhScailDetectPrompt',
          uiSchemaType: 'textarea',
          uiSchemaDefault: 'person',
        },
        classList: {
          contains() {
            return false;
          },
        },
        querySelectorAll() {
          return [];
        },
        querySelector(_0x365cb2) {
          if (_0x365cb2 === '[data-ui-schema-input]') return _0x9e8f15;
          return null;
        },
      },
      _0x9e8f15 = {
        tagName: 'TEXTAREA',
        type: '',
        value: 'person',
        dataset: { uiSchemaInput: 'rhScailDetectPrompt' },
        closest(_0x572df9) {
          if (_0x572df9 === '[data-ui-schema-input]') return _0x9e8f15;
          if (_0x572df9 === '.ui-schema-field' || _0x572df9 === '[data-ui-schema-field]') return _0x5d1c19;
          return null;
        },
      },
      _0x49c143 = {
        addEventListener(_0x315224, _0x3fc0ea) {
          _0x155598.set(_0x315224, _0x3fc0ea);
        },
        removeEventListener(_0x516195, _0x372ba8) {
          if (_0x155598.get(_0x516195) === _0x372ba8) _0x155598.delete(_0x516195);
        },
        querySelectorAll(_0x2a37a5) {
          if (_0x2a37a5 === '[data-ui-schema-field]') return [_0x5d1c19];
          return [];
        },
      },
      _0x169562 = bindUiSchemaFieldControls(_0x49c143, {
        getNodeData: () => _0x3f6d6e,
        commitFieldValue: (_0xb63b7f, _0x14988c, _0x2ac87b) => {
          return (
            _0x45fb76.push({ fieldId: _0xb63b7f, value: _0x14988c }),
            (_0x3f6d6e = {
              ..._0x2ac87b,
              generationParams: { ...(_0x2ac87b.generationParams || {}), [_0xb63b7f]: _0x14988c },
            }),
            _0x3f6d6e
          );
        },
      });
    ((_0x9e8f15.value = 'p'),
      _0x155598.get('input')?.({ type: 'input', target: _0x9e8f15 }),
      (_0x9e8f15.value = 'pe'),
      _0x155598.get('input')?.({ type: 'input', target: _0x9e8f15 }),
      (_0x9e8f15.value = 'per'),
      _0x155598.get('input')?.({ type: 'input', target: _0x9e8f15 }),
      assert.equal(_0x45fb76.length, 0),
      await new Promise((_0x5cb0e5) => setTimeout(_0x5cb0e5, 230)),
      assert.deepEqual(_0x45fb76, [{ fieldId: 'rhScailDetectPrompt', value: 'per' }]),
      (_0x9e8f15.value = ''),
      _0x155598.get('input')?.({ type: 'input', target: _0x9e8f15 }),
      _0x155598.get('change')?.({ type: 'change', target: _0x9e8f15 }),
      assert.equal(_0x45fb76.at(-1)?.value, ''),
      _0x169562());
  }),
  test('RunningHub commercial digital human advanced settings render motion amplitude', () => {
    const _0x11bda0 = 'runninghub/2055639633148563458';
    assert.equal(hasModelUiSchema(_0x11bda0, { placement: 'videoAdvanced' }), true);
    const _0x49286d = renderModelUiSchemaControls(
      _0x11bda0,
      {
        model: _0x11bda0,
        generationParams: { rhDigitalHumanMotionAmplitude: '1', rhDigitalHumanSceneMotionAmplitude: '1' },
      },
      { placement: 'videoAdvanced' },
    );
    (assert.match(_0x49286d, /data-ui-schema-placement="videoadvanced"/),
      assert.match(_0x49286d, /data-ui-schema-field="rhDigitalHumanMotionAmplitude"/),
      assert.match(_0x49286d, /数字人动作幅度/),
      assert.match(_0x49286d, /data-ui-schema-value="0"[^>]*>普通/),
      assert.match(_0x49286d, /data-ui-schema-value="1"[^>]*>较大/),
      assert.match(_0x49286d, /data-ui-schema-value="2"[^>]*>强烈/),
      assert.match(_0x49286d, /10秒以内动作幅度参数效果更明显/),
      assert.match(_0x49286d, /超过10秒后效果会明显减弱/),
      assert.match(
        _0x49286d,
        /rh-adv-seg-btn active[^"]*" data-key="rhDigitalHumanMotionAmplitude"[^>]*data-ui-schema-value="1"/,
      ),
      assert.match(_0x49286d, /data-ui-schema-field="rhDigitalHumanSceneMotionAmplitude"/),
      assert.match(_0x49286d, /画面运动幅度/));
    const _0x3cd919 = _0x49286d.slice(
      _0x49286d.indexOf('data-ui-schema-field="rhDigitalHumanSceneMotionAmplitude"'),
    );
    (assert.match(
      _0x3cd919,
      /rh-adv-seg-btn active[^"]*" data-key="rhDigitalHumanSceneMotionAmplitude"[^>]*data-ui-schema-value="1"/,
    ),
      assert.doesNotMatch(_0x3cd919, /data-ui-schema-value="2"[^>]*>强烈/));
  }),
  test('RunningHub video normal params render from videoParams uiSchema', () => {
    const _0x784206 = 'runninghub/2041741496667348994',
      _0x499a75 = 'runninghub/2060613773890768898',
      _0x57cedb = 'runninghub/1971148165531475969',
      _0x2ccdfc = 'runninghub/2039336644536442882',
      _0x2ac555 = 'runninghub/2054101324521844738',
      _0x128a0e = 'runninghub/2062515720147259393',
      _0x5ea99e = 'runninghub/2064961300823896065';
    (assert.equal(hasModelUiSchema(_0x784206, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x499a75, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x57cedb, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x2ccdfc, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x2ac555, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x128a0e, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x5ea99e, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(_0x128a0e, { placement: 'resolution' }), false));
    const _0x2a4d02 = renderModelUiSchemaControls(
      _0x784206,
      {
        model: _0x784206,
        generationParams: { rhVideoResolution: 0x400, rhVideoFps: 24, rhVideoFrames: 0 },
        rhVideoSourceFrameCount: 123,
      },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24, 30] },
    );
    (assert.match(_0x2a4d02, /class="img-ratio-wrap ui-schema-rh-video-params"/),
      assert.match(_0x2a4d02, /class="img-pill-btn img-ratio-btn"/),
      assert.match(_0x2a4d02, /class="img-ratio-icon-slot"/),
      assert.match(_0x2a4d02, />帧数全长·帧率24·分辨率1024</),
      assert.match(_0x2a4d02, /data-ui-schema-field="rhVideoResolution"/),
      assert.match(_0x2a4d02, /img-rp-quality-segmented rh-video-resolution-seg/),
      assert.match(
        _0x2a4d02,
        /rh-v5-res-btn ui-schema-option" data-value="1024" data-ui-schema-value="1024"/,
      ),
      assert.match(
        _0x2a4d02,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      assert.match(_0x2a4d02, /rh-v5-source-framecount" aria-label="源视频总帧数">123</),
      assert.match(_0x2a4d02, /rh-stepper rh-v5-frames-stepper/));
    const _0x2190bb = renderModelUiSchemaControls(
      _0x5ea99e,
      {
        model: _0x5ea99e,
        generationParams: { rhVideoResolution: 0x340, rhVideoFps: 24, rhVideoFrames: 0x12c },
        rhVideoSourceFrameCount: 0x1c8,
      },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24, 30] },
    );
    (assert.match(_0x2190bb, /class="img-ratio-wrap ui-schema-rh-video-params"/),
      assert.match(_0x2190bb, /data-ui-schema-composite-field="rhVideoParams"/),
      assert.match(_0x2190bb, /data-ui-schema-field="rhVideoResolution"/),
      assert.match(_0x2190bb, /data-ui-schema-field="rhVideoFps"/),
      assert.match(_0x2190bb, /data-ui-schema-field="rhVideoFrames"/),
      assert.match(_0x2190bb, /data-value="832" data-ui-schema-value="832"/),
      assert.match(
        _0x2190bb,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      assert.match(_0x2190bb, /rh-v5-source-framecount"[^>]*>456</),
      assert.match(_0x2190bb, /aria-valuenow="300" tabindex="0">300</),
      assert.match(_0x2a4d02, /aria-valuenow="0" tabindex="0">全长</));
    const _0x3ec22c = renderModelUiSchemaControls(
      _0x499a75,
      {
        model: _0x499a75,
        generationParams: { rhVideoResolution: 0x3c0, rhVideoFps: 24, rhVideoFrames: 0 },
        rhVideoSourceFrameCount: 0x141,
      },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24, 30] },
    );
    (assert.match(_0x3ec22c, />帧数全长·帧率24·分辨率960</),
      assert.match(
        _0x3ec22c,
        /img-rp-quality-item active rh-v5-res-btn ui-schema-option" data-value="960" data-ui-schema-value="960"/,
      ),
      assert.match(
        _0x3ec22c,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      assert.match(_0x3ec22c, /rh-v5-source-framecount" aria-label="源视频总帧数">321</),
      assert.match(_0x3ec22c, /aria-valuenow="0" tabindex="0">全长</),
      assert.match(
        _0x3ec22c,
        /img-rp-quality-item  rh-v5-res-btn ui-schema-option" data-value="1600" data-ui-schema-value="1600"/,
      ),
      assert.match(
        _0x3ec22c,
        /img-rp-quality-item  rh-v5-res-btn ui-schema-option" data-value="1920" data-ui-schema-value="1920"/,
      ),
      assert.doesNotMatch(_0x3ec22c, /dev-mode-only[^>]+data-value="(?:1600|1920)"/));
    const _0x514aba = renderModelUiSchemaControls(
      _0x2ccdfc,
      { model: _0x2ccdfc, generationParams: { rhVideoResolution: 0x500, rhVideoFps: 16, rhVideoSeconds: 6 } },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24] },
    );
    (assert.match(_0x514aba, />秒数6·帧率16·分辨率1280</),
      assert.match(_0x514aba, /rh-ltx-res-btn ui-schema-option" data-value="1280"/),
      assert.match(_0x514aba, /rh-ltx-fps-btn active ui-schema-option" data-value="16"/),
      assert.match(_0x514aba, /rh-stepper rh-ltx-seconds-stepper/),
      assert.match(_0x514aba, /aria-valuenow="6" tabindex="0">6</));
    const _0x5ea215 = renderModelUiSchemaControls(
      _0x2ac555,
      {
        model: _0x2ac555,
        generationParams: { rhVideoResolution: 0x400, rhVideoFrames: 77 },
        rhVideoSourceFrameCount: 88,
      },
      { placement: 'videoParams', unwrap: true },
    );
    (assert.match(_0x5ea215, />帧数77·分辨率1024</),
      assert.doesNotMatch(_0x5ea215, /帧率24·分辨率/),
      assert.match(_0x5ea215, /rh-v5-source-framecount" aria-label="源视频总帧数">88</));
    const _0x561f16 = renderModelUiSchemaControls(
      _0x128a0e,
      {
        model: _0x128a0e,
        rhBerniniInputMode: 'videoImage',
        generationParams: {
          rhBerniniFunction: 'rv2v',
          rhVideoResolution: 0x340,
          rhVideoFps: 24,
          rhVideoFrames: 121,
          rhBerniniAspectRatio: '16:9',
        },
      },
      { placement: 'videoParams', unwrap: true },
    );
    (assert.match(_0x561f16, /data-ui-schema-field="rhBerniniFunction"/),
      assert.match(_0x561f16, /ui-schema-pill-menu/));
    const _0x543599 = _0x561f16.slice(0, _0x561f16.indexOf('<div class="img-ratio-wrap'));
    (assert.match(_0x543599, /ui-schema-floating-menu-title">功能选择</),
      assert.match(_0x543599, /ui-schema-info-tip/),
      assert.match(_0x543599, /data-tooltip="[^"]*vi2v视频指令到视频/),
      assert.match(_0x543599, /data-tooltip="[^"]*vrc2v视频区域控制到视频/),
      assert.doesNotMatch(_0x543599, /data-tooltip="[^"]*i2v图片生视频/),
      assert.doesNotMatch(_0x543599, /data-tooltip="[^"]*v2v视频到视频/),
      assert.match(_0x543599, /data-ui-schema-value="vi2v"/),
      assert.match(_0x543599, /data-ui-schema-value="rv2v"/),
      assert.match(_0x543599, /data-ui-schema-value="vrc2v"/),
      assert.match(_0x543599, /rv2v参考视频到视频/),
      assert.doesNotMatch(_0x543599, /data-ui-schema-value="i2v"/),
      assert.doesNotMatch(_0x543599, /data-ui-schema-value="r2v"/),
      assert.doesNotMatch(_0x543599, /data-ui-schema-value="v2v"/),
      assert.doesNotMatch(_0x543599, /data-ui-schema-value="mv2v"/),
      assert.doesNotMatch(_0x543599, /data-ui-schema-value="ads2v"/));
    const _0x33c83f = renderModelUiSchemaControls(
        _0x128a0e,
        {
          model: _0x128a0e,
          generationParams: {
            rhBerniniInputMode: 'image',
            rhBerniniFunction: 'r2v',
            rhVideoResolution: 0x340,
            rhVideoFps: 24,
            rhVideoFrames: 121,
            rhBerniniAspectRatio: '16:9',
          },
        },
        { placement: 'videoParams', unwrap: true },
      ),
      _0x3e3e08 = _0x33c83f.slice(0, _0x33c83f.indexOf('<div class="img-ratio-wrap'));
    (assert.match(_0x3e3e08, /data-ui-schema-value="i2v"/),
      assert.match(_0x3e3e08, /data-ui-schema-value="r2v"/),
      assert.match(_0x3e3e08, /data-tooltip="[^"]*i2v图片生视频/),
      assert.match(_0x3e3e08, /data-tooltip="[^"]*r2v参考主体到视频/),
      assert.doesNotMatch(_0x3e3e08, /data-tooltip="[^"]*v2v视频到视频/),
      assert.doesNotMatch(_0x3e3e08, /data-ui-schema-value="v2v"/),
      assert.doesNotMatch(_0x3e3e08, /data-ui-schema-value="mv2v"/),
      assert.doesNotMatch(_0x3e3e08, /data-ui-schema-value="vi2v"/),
      assert.doesNotMatch(_0x3e3e08, /data-ui-schema-value="rv2v"/),
      assert.doesNotMatch(_0x3e3e08, /data-ui-schema-value="vrc2v"/));
    const _0x133881 = renderModelUiSchemaControls(
        _0x128a0e,
        {
          model: _0x128a0e,
          generationParams: {
            rhBerniniInputMode: 'video',
            rhBerniniFunction: 'mv2v',
            rhVideoResolution: 0x340,
            rhVideoFps: 24,
            rhVideoFrames: 121,
            rhBerniniAspectRatio: '16:9',
          },
        },
        { placement: 'videoParams', unwrap: true },
      ),
      _0x387b02 = _0x133881.slice(0, _0x133881.indexOf('<div class="img-ratio-wrap'));
    (assert.match(_0x387b02, /data-ui-schema-value="v2v"/),
      assert.match(_0x387b02, /data-ui-schema-value="mv2v"/),
      assert.doesNotMatch(_0x387b02, /data-ui-schema-value="i2v"/),
      assert.doesNotMatch(_0x387b02, /data-ui-schema-value="r2v"/),
      assert.doesNotMatch(_0x387b02, /data-ui-schema-value="vi2v"/));
    const _0x18ca51 = renderModelUiSchemaControls(
        _0x128a0e,
        {
          model: _0x128a0e,
          generationParams: {
            rhBerniniInputMode: 'videoVideo',
            rhBerniniFunction: 'ads2v',
            rhVideoResolution: 0x340,
            rhVideoFps: 24,
            rhVideoFrames: 121,
            rhBerniniAspectRatio: '16:9',
          },
        },
        { placement: 'videoParams', unwrap: true },
      ),
      _0x3eb453 = _0x18ca51.slice(0, _0x18ca51.indexOf('<div class="img-ratio-wrap'));
    (assert.doesNotMatch(_0x3eb453, /data-ui-schema-field="rhBerniniFunction"/),
      assert.doesNotMatch(_0x3eb453, /data-ui-schema-value="ads2v"/),
      assert.doesNotMatch(_0x3eb453, /data-ui-schema-value="i2v"/),
      assert.doesNotMatch(_0x3eb453, /data-ui-schema-value="rv2v"/),
      assert.match(_0x561f16, /data-ui-schema-composite-field="rhVideoParams"/),
      assert.match(_0x561f16, />帧数121·帧率24·分辨率832</),
      assert.match(_0x561f16, /data-ui-schema-field="rhVideoResolution"/),
      assert.match(_0x561f16, /data-ui-schema-field="rhVideoFps"/),
      assert.match(_0x561f16, /data-ui-schema-field="rhVideoFrames"/),
      assert.match(_0x561f16, /data-ui-schema-field="rhBerniniAspectRatio"/),
      assert.match(_0x561f16, /data-ui-schema-value="自适应"/),
      assert.doesNotMatch(
        _0x561f16,
        /mv2v多维编辑到视频[\s\S]*v2v视频到视频[\s\S]*rv2v参考视频到视频[\s\S]*vrc2v视频区域控制到视频<\/div>\s*<div class="img-ratio-wrap/,
      ));
    const _0x505de4 = renderModelUiSchemaControls(
      _0x128a0e,
      { model: _0x128a0e, generationParams: { rhInstanceType: 'plus' } },
      { placement: 'instance', variant: 'instanceToggle' },
    );
    (assert.match(_0x505de4, /data-ui-schema-field="rhInstanceType"/),
      assert.match(_0x505de4, />48G</),
      assert.match(
        nodeTypesCss,
        /\.ui-schema-rh-video-params \.rh-video-resolution-seg\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(56px,1fr\)\);gap:8px;width:100%;\}/,
      ),
      assert.match(
        source,
        /renderModelUiSchemaControls\(_activeModel, rhParamsNodeData,[\s\S]*placement:\s*"videoParams"/,
      ),
      assert.doesNotMatch(source, /v5Panel\.querySelectorAll\("\.rh-v5-fps-btn"\)/),
      assert.doesNotMatch(source, /const ltxPanel = ratioPopup\?\.querySelector\("\.rh-ltx-meta-panel"\)/),
      assert.doesNotMatch(videoNodeSource, /querySelectorAll\("\.rh-v5-fps-btn"\)/),
      assert.doesNotMatch(videoNodeSource, /querySelectorAll\("\.rh-ltx-fps-btn"\)/));
  }),
  test('RunningHub video frame stepper accepts arithmetic input expressions', () => {
    const _0x16fbd9 = 'runninghub/2041741496667348994';
    (assert.equal(evaluateUiSchemaNumberExpression('25/5'), 5),
      assert.equal(evaluateUiSchemaNumberExpression('12 + 8 - 3'), 17),
      assert.equal(evaluateUiSchemaNumberExpression('(6 + 4) * 3'), 30),
      assert.equal(evaluateUiSchemaNumberExpression('7.8/2'), 3.9),
      assert.equal(Number.isNaN(evaluateUiSchemaNumberExpression('25/0')), true),
      assert.equal(Number.isNaN(evaluateUiSchemaNumberExpression('25abc')), true));
    const _0x21bd87 = buildUiSchemaParamPatch(
      { model: _0x16fbd9, generationParams: { rhVideoFrames: 77 } },
      'rhVideoFrames',
      Math.trunc(evaluateUiSchemaNumberExpression('25/5')),
    );
    (assert.equal(_0x21bd87.generationParams.rhVideoFrames, 5),
      assert.match(uiSchemaRendererSource, /input\.type = "text";/),
      assert.match(uiSchemaRendererSource, /const numeric = evaluateUiSchemaNumberExpression\(value\);/));
  }),
  test('RunningHub V5.4 fps options include 30 without advanced mode', () => {
    const _0x1554d2 = 'runninghub/2041741496667348994';
    (assert.deepEqual(getRhV54FpsOptions(), [16, 24, 30]), assert.equal(normalizeRhV54Fps(30), 30));
    const _0x4b9c00 = getModelManifest(_0x1554d2)?.uiSchema?.fields?.find(
      (_0xf4dfc7) => _0xf4dfc7.id === 'rhVideoFps',
    );
    assert.deepEqual(
      (_0x4b9c00?.options || []).map((_0x53f617) => Number(_0x53f617.value)),
      [16, 24, 30],
    );
  }),
  test('RunningHub video footer placement checks are manifest driven', () => {
    const _0x5109b9 = 'runninghub/2041741496667348994',
      _0x51d31c = 'runninghub/2060613773890768898',
      _0x443102 = 'runninghub/1971148165531475969',
      _0x598232 = 'runninghub/2039336644536442882',
      _0x40d1f5 = 'runninghub/2054101324521844738',
      _0xef7179 = 'runninghub/video_matting',
      _0x2ed233 = 'runninghub/2055639633148563458',
      _0x5e4521 = 'runninghub/2064961300823896065';
    (assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x5109b9, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x443102, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x51d31c, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x2ed233, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x5e4521, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x5e4521, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x598232, 'videoAdvanced'), false),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x598232, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x51d31c, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0x40d1f5, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(_0xef7179, 'videoParams'), false),
      assert.deepEqual(
        getRunningHubVideoWorkflowFpsOptions(_0x598232, { v54FpsOptions: [16, 24, 30] }),
        [16, 24],
      ),
      assert.deepEqual(
        getRunningHubVideoWorkflowFpsOptions(_0x443102, { v54FpsOptions: [16, 24, 30] }),
        [16, 24, 30],
      ),
      assert.match(source, /hasRunningHubVideoWorkflowUiPlacement\(\s*_activeModel,\s*"videoAdvanced"/),
      assert.doesNotMatch(source, /const showRhAdv = isRhV54Editor \|\| isRhBasic/),
      assert.match(
        videoNodeSource,
        /hasRunningHubVideoWorkflowUiPlacement\(\s*activeModel,\s*"videoParams"/,
      ));
  }),
  test('video parameter panel: LTX2.3 uses existing video parameter UI', () => {
    (assert.match(uiSchemaRendererSource, /rh-ltx-res-btn/),
      assert.match(uiSchemaRendererSource, /rh-ltx-fps-btn/),
      assert.match(uiSchemaRendererSource, /rh-ltx-seconds-stepper/),
      assert.match(uiSchemaRendererSource, /rh-stepper-value/),
      assert.match(uiSchemaRendererSource, /rh-v5-fps-seg[\s\S]*rh-ltx-fps-btn/),
      assert.doesNotMatch(source, /rh-ltx-res-btn/),
      assert.doesNotMatch(source, /rh-ltx-fps-btn/),
      assert.doesNotMatch(videoNodeSource, /rh-ltx-res-btn/),
      assert.doesNotMatch(videoNodeSource, /rh-ltx-fps-btn/),
      assert.doesNotMatch(source, /rh-ltx-fps-seg/),
      assert.doesNotMatch(source, /rh-ltx-seconds-stepper">[\s\S]{0,240}rh-stepper-btn/),
      assert.doesNotMatch(source, /variant:\s*"advancedRow"/),
      assert.doesNotMatch(source, /ui-schema-number/),
      assert.doesNotMatch(source, /ui-schema-range/),
      assert.doesNotMatch(source, /ui-schema-video-advanced-panel/),
      assert.doesNotMatch(nodeTypesCss, /ui-schema-video-advanced-panel/));
  }),
  test('video workflow model switch: display params come from target generationParams', () => {
    (assert.match(source, /buildVideoWorkflowDisplayParamsPatch/),
      assert.match(source, /buildVideoWorkflowModelSelectionPatch/),
      assert.match(source, /hasDisplayParamChange/),
      assert.match(source, /bindModelUiSchemaControls\(footer/),
      assert.match(source, /buildRhWorkflowFieldPatch\(latest, fieldId, value, schemaPatch\)/),
      assert.match(source, /const commitModelSelection = \(payload\)/),
      assert.match(source, /this\._renderFooter\(footer\)/),
      assert.doesNotMatch(source, /footer\.querySelector\("\.img-model-label"\)\.textContent =/),
      assert.match(videoNodeSource, /const activeModel = String\(nodeData\?\.model \|\| ""\)\.trim\(\)/),
      assert.match(videoNodeSource, /const getLatestNodeData = \(\) =>/),
      assert.match(videoNodeSource, /nodeData = getLatestNodeData\(\) \|\| this\._data \|\| nodeData;/),
      assert.match(videoNodeSource, /const isRhWorkflowForAdaptive = this\._isRunninghubWorkflowModel\(/),
      assert.match(videoNodeSource, /!isRhWorkflowForAdaptive/),
      assert.match(
        source,
        /this\._isRunninghubWorkflowModel\(latestNode\?\.model,\s*latestNode\?\.provider\)/,
      ),
      assert.doesNotMatch(
        source,
        /store\.updateNodeData\(this\.nodeId,\s*\{\s*rhVideo(?:Resolution|Fps|Frames|Seconds):/,
      ),
      assert.doesNotMatch(source, /normalizeRhVideoResolution/),
      assert.doesNotMatch(source, /buildVideoWorkflowGenerationParamsPatch\(\s*n,\s*(?:v|val)/),
      assert.deepEqual(
        buildVideoWorkflowDisplayParamsPatch('runninghub/2039336644536442882', {
          rhVideoResolution: 0x500,
          rhVideoFps: 16,
          rhVideoSeconds: 6,
          rhVideoFrames: 99,
        }),
        { rhVideoFps: 16, rhVideoSeconds: 6, rhVideoResolution: 0x500 },
      ),
      assert.deepEqual(
        buildVideoWorkflowDisplayParamsPatch('runninghub/1971148165531475969', {
          rhVideoResolution: 0x400,
          rhVideoFps: 24,
          rhVideoFrames: 0,
          rhVideoSeconds: 11,
          rhEnableMask: true,
        }),
        { rhVideoFps: 24, rhVideoFrames: 0, rhVideoResolution: 0x400, rhEnableMask: true },
      ));
  }),
  test('video modelApi aspect ratio selection updates existing display size patch', () => {
    const _0x26b4a8 = getModelManifest('apimart/veo3-fast'),
      _0x36a43b = _0x26b4a8?.uiSchema?.fields?.find((_0x392188) => _0x392188.id === 'aspectRatio');
    (assert.equal(_0x36a43b?.displayRole, 'aspectRatio'),
      assert.match(
        source,
        /_buildModelApiAspectRatioDisplayPatch\(\s*latest,\s*fieldId,\s*value,\s*schemaPatch/,
      ),
      assert.match(source, /field\?\.displayRole !== "aspectRatio"/),
      assert.match(source, /resolved\?\.modelManifest\?\.adapterType !== "modelApi"/),
      assert.match(source, /resolved\?\.executionManifest\?\.adapterType !== "modelApi"/),
      assert.match(source, /buildImageSchemaAspectRatioDisplayPatch\(\{/),
      assert.match(source, /applyImageSchemaRatioResizeAnimation\(this,\s*\{/),
      assert.match(source, /aspectRatio:\s*ratioValue/),
      assert.doesNotMatch(source, /latestNodeData\?\.model\s*===\s*"apimart\/veo3-fast"/));
  }),
  test('RunningHub workflow aspect ratio selection updates existing display size patch', () => {
    const _0x13842c = getModelManifest('runninghub/2062515720147259393'),
      _0x5aefcd = _0x13842c?.uiSchema?.fields?.find((_0x54e73a) => _0x54e73a.id === 'rhBerniniAspectRatio');
    (assert.equal(_0x5aefcd?.displayRole, 'aspectRatio'),
      assert.match(
        source,
        /_buildRunningHubWorkflowAspectRatioDisplayPatch\(\s*latest,\s*fieldId,\s*value,\s*schemaPatch/,
      ),
      assert.match(source, /resolved\?\.modelManifest\?\.adapterType !== "workflow"/),
      assert.match(source, /resolved\?\.executionManifest\?\.adapterType !== "workflow"/),
      assert.match(source, /field\?\.displayRole !== "aspectRatio"/),
      assert.match(source, /buildImageSchemaAspectRatioDisplayPatch\(\{/),
      assert.match(source, /applyImageSchemaRatioResizeAnimation\(this,\s*\{/));
  }),
  test('video workflow model selection patch preserves current defaults', () => {
    const _0x4a8d33 = 'runninghub/2041741496667348994',
      _0x44cc29 = 'runninghub/2060613773890768898',
      _0x3c8607 = 'runninghub/1971148165531475969',
      _0x4ed6ca = 'runninghub/2039336644536442882',
      _0x38ddc5 = 'runninghub/2054101324521844738',
      _0x13b587 = 'runninghub/2047787809091620866',
      _0x25aec2 = 'runninghub/2064961300823896065',
      _0x50b862 = buildVideoWorkflowModelSelectionPatch(
        {
          frameRate: 16,
          frameCount: 88,
          generationParamsByModel: {
            [_0x4a8d33]: {
              rhVideoResolution: 0x400,
              rhVideoFps: 30,
              rhVideoFrames: 88,
              rhSingleControlPreset: 'stable',
              rhMaskExpand: 12,
            },
          },
        },
        _0x4a8d33,
        { preserveMaskTouchedState: true, v54FpsOptions: [16, 24, 30] },
      );
    (assert.equal(_0x50b862.rhVideoFps, 30),
      assert.equal(_0x50b862.rhVideoFrames, 88),
      assert.equal(_0x50b862.rhVideoResolution, 0x400),
      assert.equal(_0x50b862.rhSingleControlPreset, 'stable'),
      assert.equal(_0x50b862.rhMaskExpand, 12),
      assert.equal(_0x50b862.rhMaskExpandTouched, false),
      assert.equal(_0x50b862.frameRate, 16),
      assert.equal(_0x50b862.frameCount, 88));
    const _0x523f90 = buildVideoWorkflowModelSelectionPatch(
      {
        generationParamsByModel: {
          [_0x3c8607]: { rhVideoResolution: 0x400, rhVideoFps: 30, rhVideoFrames: 0, rhEnableMask: true },
        },
      },
      _0x3c8607,
      { v54FpsOptions: [16, 24, 30] },
    );
    (assert.equal(_0x523f90.rhVideoFps, 24),
      assert.equal(_0x523f90.rhVideoFrames, 0),
      assert.equal(_0x523f90.rhVideoResolution, 0x400),
      assert.equal(_0x523f90.rhEnableMask, true));
    const _0xd32121 = buildVideoWorkflowModelSelectionPatch({}, _0x44cc29, { v54FpsOptions: [16, 24, 30] });
    (assert.equal(_0xd32121.rhVideoFps, 24),
      assert.equal(_0xd32121.rhVideoFrames, 0),
      assert.equal(_0xd32121.rhVideoResolution, 0x3c0),
      assert.equal(_0xd32121.frameRate, 24),
      assert.equal(_0xd32121.frameCount, 0),
      assert.equal(_0xd32121.generationParams.rhWatermarkRemoveMode, 'mode1'),
      assert.equal(_0xd32121.generationParams.rhRemoveWatermark, false));
    const _0x5e6e09 = buildVideoWorkflowModelSelectionPatch({}, _0x25aec2, { v54FpsOptions: [16, 24, 30] });
    (assert.equal(_0x5e6e09.rhVideoFps, 24),
      assert.equal(_0x5e6e09.rhVideoFrames, 0x12c),
      assert.equal(_0x5e6e09.rhVideoResolution, 0x400),
      assert.equal(_0x5e6e09.frameRate, 24),
      assert.equal(_0x5e6e09.frameCount, 0x12c),
      assert.equal(_0x5e6e09.generationParams.rhScail2PersonCount, 2),
      assert.equal(_0x5e6e09.generationParams.rhScailDetectPrompt, 'person'),
      assert.equal(_0x5e6e09.generationParams.rhScail2ReplaceSubject, false));
    const _0x563025 = buildVideoWorkflowModelSelectionPatch(
      { generationParamsByModel: { [_0x25aec2]: { rhScailDetectPrompt: '' } } },
      _0x25aec2,
      { v54FpsOptions: [16, 24, 30] },
    );
    assert.equal(_0x563025.generationParams.rhScailDetectPrompt, '');
    const _0x403f1d = buildVideoWorkflowModelSelectionPatch(
      {
        rhLtxMode: 'singing_voice',
        generationParamsByModel: {
          [_0x4ed6ca]: { rhVideoResolution: 0x500, rhVideoFps: 16, rhVideoSeconds: 6 },
        },
      },
      _0x4ed6ca,
    );
    (assert.equal(_0x403f1d.rhVideoFps, 16),
      assert.equal(_0x403f1d.rhVideoSeconds, 6),
      assert.equal(_0x403f1d.rhVideoResolution, 0x500),
      assert.equal(_0x403f1d.rhLtxMode, 'singing_voice'));
    const _0x3a6570 = buildVideoWorkflowModelSelectionPatch(
      { generationParamsByModel: { [_0x38ddc5]: { rhVideoResolution: 0x400, rhVideoFrames: 77 } } },
      _0x38ddc5,
    );
    (assert.equal(_0x3a6570.rhVideoFps, 24),
      assert.equal(_0x3a6570.rhVideoFrames, 77),
      assert.equal(_0x3a6570.rhVideoResolution, 0x400));
    const _0x1decdf = buildVideoWorkflowModelSelectionPatch({}, _0x13b587);
    (assert.equal(Object.hasOwn(_0x1decdf, 'rhVideoResolution'), false),
      assert.equal(Object.hasOwn(_0x1decdf, 'rhVideoFps'), false));
  }),
  test('video workflow params: current display fields are saved into model memory', () => {
    const _0x2e0e57 = buildVideoWorkflowGenerationParamsPatch(
      {
        model: 'runninghub/2039336644536442882',
        generationParams: { rhVideoResolution: 0x340, rhVideoFps: 24, rhVideoSeconds: 5 },
        rhVideoResolution: 0x500,
        rhVideoFps: 16,
        rhVideoSeconds: 6,
      },
      'runninghub/1971148165531475969',
    );
    (assert.equal(
      _0x2e0e57.generationParamsByModel['runninghub/2039336644536442882'].rhVideoResolution,
      0x500,
    ),
      assert.equal(_0x2e0e57.generationParamsByModel['runninghub/2039336644536442882'].rhVideoFps, 16),
      assert.equal(_0x2e0e57.generationParamsByModel['runninghub/2039336644536442882'].rhVideoSeconds, 6),
      assert.notEqual(_0x2e0e57.generationParams.rhVideoSeconds, 6));
  }),
  test('RunningHub V5.4 advanced params round-trip through generationParams display patch', () => {
    assert.deepEqual(
      buildVideoWorkflowDisplayParamsPatch(
        'runninghub/2041741496667348994',
        {
          rhVideoResolution: 0x400,
          rhVideoFps: 24,
          rhVideoFrames: 77,
          rhSingleControlPreset: 'stable',
          rhBlendIntoScene: true,
          rhSubtractSubject: false,
          rhMaskExpand: 12,
          rhMaskRect: true,
          rhSpecialMode: 'cameraMove',
          rhBreastJiggle: 0.37,
        },
        { v54FpsOptions: [16, 24, 30] },
      ),
      {
        rhVideoFps: 24,
        rhVideoFrames: 77,
        rhVideoResolution: 0x400,
        rhBlendIntoScene: true,
        rhControlMode: 'single',
        rhSingleControlPreset: 'stable',
        rhSubtractSubject: false,
        rhMaskExpand: 12,
        rhMaskRect: true,
        rhSpecialMode: 'cameraMove',
        rhBreastJiggle: 0.35,
      },
    );
  }));
