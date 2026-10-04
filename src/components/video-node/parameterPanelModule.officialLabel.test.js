// Behavioral contracts are authoritative. Private identifier spelling/quote-style probes from the decompiled source were removed; rendered output, model data, CSS contracts and browser integration remain tested.
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

// CSS whitespace and declaration formatting are not behavior. Keep selector/property/value assertions.
function assertCssContract(text, pattern, absent = false) {
  let portable = '',
    inClass = false;
  const input = pattern.source;
  for (let index = 0; index < input.length; index++) {
    const char = input[index];
    if (char === '\\') {
      const next = input[++index];
      portable += !inClass && '{}()'.includes(next) ? '\\s*\\' + next + '\\s*' : '\\' + next;
    } else if (char === '[') {
      inClass = true;
      portable += char;
    } else if (char === ']') {
      inClass = false;
      portable += char;
    } else if (!inClass && char === '{') {
      const end = input.indexOf('}', index);
      portable += input.slice(index, end + 1);
      index = end;
    } else if (!inClass && ':;,'.includes(char) && input[index - 1] !== '?')
      portable += '\\s*' + char + '\\s*';
    else portable += char;
  }
  const actual = new RegExp(portable, pattern.flags);
  if (absent) assert.doesNotMatch(text, actual);
  else assert.match(text, actual);
}

function assertCssSelectorGroup(text, selectors, declarations = /./s) {
  const rules = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  assert.ok(
    rules.some((match) => {
      const actual = new Set(match[1].split(',').map((value) => value.trim()));
      return selectors.every((selector) => actual.has(selector)) && declarations.test(match[2]);
    }),
    'Missing selector group or declarations: ' + selectors.join(', '),
  );
}
function extractMenuModelOrder(item) {
  return Array.from(String(item || '').matchAll(/data-value="([^"]+)"/g)).map((item2) => item2[1]);
}
(test('video parameter panel: 官方即梦和 APIMart 即梦显示名分离', () => {
  const dreaminaOfficialVideoMenuItems = buildDreaminaOfficialVideoMenuItems();
  assert.deepEqual(dreaminaOfficialVideoMenuItems, [
    {
      modelId: 'dreamina/text2video',
      provider: 'dreamina',
      label: '即梦官方',
      subtitle: '无图文生视频，单图图生视频',
      iconHtml: buildDreaminaVideoLogoHTML(20),
      vip: true,
    },
  ]);
  const apimartVideoMenuItemsHtml = buildApimartVideoMenuItemsHtml(
    'apimart/doubao-seedance-2.0-fast',
    'apimart',
  );
  (assert.match(
    apimartVideoMenuItemsHtml,
    /class="floating-menu-item node-menu-item active" data-value="apimart\/doubao-seedance-2\.0-fast" data-provider="apimart" data-apimart-jimeng="1"/,
  ),
    assert.match(apimartVideoMenuItemsHtml, /<div class="fmi-title">即梦视频<\/div>/),
    assert.match(
      apimartVideoMenuItemsHtml,
      /<img src="images\/jimeng\.png" class="node-menu-icon" alt="dreamina">/,
    ),
    assert.match(
      apimartVideoMenuItemsHtml,
      /<div class="fmi-sub">Seedance 系列，文生\/图生\/首尾帧参考素材<\/div>/,
    ),
    assert.match(
      apimartVideoMenuItemsHtml,
      /class="floating-menu-item node-menu-item" data-value="apimart\/happyhorse-1\.0" data-provider="apimart" data-apimart-video-model="1"/,
    ),
    assert.match(apimartVideoMenuItemsHtml, /<div class="fmi-title">HappyHorse 1\.0<\/div>/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/veo3-fast"/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/grok-imagine-1\.0"/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/omni-flash-ext"/),
    assert.match(apimartVideoMenuItemsHtml, /<div class="fmi-title">Gemini Omni Flash<\/div>/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/minimax-hailuo-2\.3"/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/wan2\.7"/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/kling-v3-omni"/),
    assert.match(apimartVideoMenuItemsHtml, /data-value="apimart\/viduq3"/),
    assert.deepEqual(extractMenuModelOrder(apimartVideoMenuItemsHtml), [
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
    assert.doesNotMatch(apimartVideoMenuItemsHtml, /data-value="apimart\/viduq3-turbo"/),
    assert.doesNotMatch(apimartVideoMenuItemsHtml, /data-value="apimart\/viduq3-pro"/),
    assert.doesNotMatch(apimartVideoMenuItemsHtml, /data-value="apimart\/viduq3-mix"/),
    assert.doesNotMatch(apimartVideoMenuItemsHtml, /happyhorse-placeholder/),
    assert.equal(getModelManifest('dreamina/text2video')?.extensions?.videoMenu?.role, 'dreaminaOfficial'),
    assert.equal(
      getModelManifest('apimart/doubao-seedance-2.0-fast')?.extensions?.videoMenu?.role,
      'apimartDreaminaEntry',
    ));
}),
  test('video parameter panel: RunningHub workflow and model API menus stay separate', () => {
    const runningHubVideoWorkflowMenuItems = buildRunningHubVideoWorkflowMenuItems(
        'runninghub-model/kling-video-o1',
      ),
      runningHubVideoModelApiMenuItems = buildRunningHubVideoModelApiMenuItems(
        'runninghub-model/kling-video-o1',
      );
    (assert.doesNotMatch(runningHubVideoWorkflowMenuItems, /runninghub-model\/kling-video-o1/),
      assert.match(runningHubVideoWorkflowMenuItems, /data-provider="runninghubwf"/),
      assert.match(runningHubVideoWorkflowMenuItems, /data-value="runninghub\/2064961300823896065"/),
      assert.match(runningHubVideoWorkflowMenuItems, /data-value="runninghub\/2065463417577762818"/),
      assert.match(runningHubVideoWorkflowMenuItems, /<div class="fmi-title">视频编辑Scail V2<\/div>/),
      assert.match(
        runningHubVideoModelApiMenuItems,
        /class="floating-menu-item node-menu-item active" data-value="runninghub-model\/kling-video-o1" data-provider="runninghub"/,
      ),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/kling-v3"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Kling V3\.0<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/kling-o3"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Kling O3<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/seedance-2\.0"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Seedance 2\.0<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/happyhorse-1\.0"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">HappyHorse 1\.0<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/hailuo-02"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Hailuo 02<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/hailuo-2\.3"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Hailuo 2\.3<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/veo3"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Veo3<\/div>/),
      assert.match(runningHubVideoModelApiMenuItems, /data-value="runninghub-model\/wan2\.7"/),
      assert.match(runningHubVideoModelApiMenuItems, /<div class="fmi-title">Wan 2\.7<\/div>/),
      assert.deepEqual(extractMenuModelOrder(runningHubVideoModelApiMenuItems), [
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
    const renderModelUiSchemaControls2 = renderModelUiSchemaControls(
      'runninghub-model/veo3',
      { rh_veo3_channel: 'lowCost', mode: 'fast' },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls2, /data-ui-schema-field="rh_veo3_channel"/),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-field="mode"/),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-field="generation_type"/),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-primary-field="rh_veo3_channel"/),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-secondary-field="mode"/),
      assert.match(renderModelUiSchemaControls2, /ui-schema-section-pair-label">低价版 · Fast 版 · 首尾帧/),
      assert.equal((renderModelUiSchemaControls2.match(/data-ui-schema-menu-trigger="/g) || []).length, 1),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-value="lowCost"/),
      assert.match(renderModelUiSchemaControls2, /data-ui-schema-value="official"/),
      assert.match(
        renderModelUiSchemaControls2,
        /data-ui-schema-value="reference"[\s\S]*data-ui-schema-disabled="true"/,
      ));
    const renderModelUiSchemaControls3 = renderModelUiSchemaControls(
      'runninghub-model/veo3',
      { rh_veo3_channel: 'official', mode: 'fast' },
      { placement: 'mode' },
    );
    assert.doesNotMatch(
      renderModelUiSchemaControls3,
      /data-ui-schema-value="reference"[\s\S]*data-ui-schema-disabled="true"/,
    );
    const renderModelUiSchemaControls4 = renderModelUiSchemaControls(
      'runninghub-model/veo3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls4, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls4, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls4, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls4, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls5 = renderModelUiSchemaControls(
      'runninghub-model/wan2.7',
      { generationParams: { wan27_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls5, /data-ui-schema-field="wan27_mode"/),
      assert.match(renderModelUiSchemaControls5, /data-ui-schema-value="image"/),
      assert.match(renderModelUiSchemaControls5, /data-ui-schema-value="video"/),
      assert.match(renderModelUiSchemaControls5, /data-ui-schema-value="reference"/),
      assert.match(renderModelUiSchemaControls5, /data-ui-schema-value="edit"/),
      assert.match(renderModelUiSchemaControls5, /参考生视频/));
    const renderModelUiSchemaControls6 = renderModelUiSchemaControls(
      'runninghub-model/wan2.7',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls6, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls6, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls6, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls6, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls7 = renderModelUiSchemaControls(
      'runninghub-model/kling-v3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls7, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls7, /data-ui-schema-value="std"/),
      assert.match(renderModelUiSchemaControls7, /data-ui-schema-value="pro"/),
      assert.match(renderModelUiSchemaControls7, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls7, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls7, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls7, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls8 = renderModelUiSchemaControls(
      'runninghub-model/kling-v3',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls8, /data-ui-schema-field="audio"/),
      assert.match(renderModelUiSchemaControls8, /data-ui-schema-field="cfgScale"/),
      assert.match(renderModelUiSchemaControls8, /data-ui-schema-field="shotType"/),
      assert.match(renderModelUiSchemaControls8, /data-ui-schema-field="negative_prompt"/));
    const renderModelUiSchemaControls9 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      { generationParams: { kling_v3_omni_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls9, /data-ui-schema-field="kling_v3_omni_mode"/),
      assert.doesNotMatch(renderModelUiSchemaControls9, /data-ui-schema-field="resolution"/),
      assert.doesNotMatch(renderModelUiSchemaControls9, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(renderModelUiSchemaControls9, /data-ui-schema-value="image"/),
      assert.match(renderModelUiSchemaControls9, /data-ui-schema-value="reference"/),
      assert.match(renderModelUiSchemaControls9, /data-ui-schema-value="edit"/));
    const renderModelUiSchemaControls10 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls10, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-value="std"/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-value="pro"/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls10, /720P/),
      assert.match(renderModelUiSchemaControls10, /1080P/),
      assert.match(renderModelUiSchemaControls10, /4K/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls10, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls11 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls11, /data-ui-schema-field="audio"/),
      assert.match(renderModelUiSchemaControls11, /data-ui-schema-field="shotType"/),
      assert.doesNotMatch(renderModelUiSchemaControls11, /data-ui-schema-field="keep_original_sound"/));
    const renderModelUiSchemaControls12 = renderModelUiSchemaControls(
      'runninghub-model/kling-o3',
      { generationParams: { kling_v3_omni_mode: 'reference' } },
      { placement: 'advanced' },
    );
    assert.match(renderModelUiSchemaControls12, /data-ui-schema-field="keep_original_sound"/);
    const renderModelUiSchemaControls13 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      { generationParams: { rh_seedance_2_model: 'fast', rh_seedance_2_mode: 'multimodal2video' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls13, /data-ui-schema-field="rh_seedance_2_model"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-field="rh_seedance_2_mode"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-primary-field="rh_seedance_2_model"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-secondary-field="rh_seedance_2_mode"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-value="fast"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-value="standard"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-value="text2video"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-value="image2video"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-value="frames2video"/),
      assert.match(renderModelUiSchemaControls13, /data-ui-schema-value="multimodal2video"/),
      assert.equal((renderModelUiSchemaControls13.match(/data-ui-schema-menu-trigger="/g) || []).length, 1));
    const renderModelUiSchemaControls14 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls14, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-field="aspectRatio"/),
      assert.match(
        renderModelUiSchemaControls14,
        /ui-schema-quality-ratio-label">720p \u00b7 自适应<\/span>/,
      ),
      assert.match(renderModelUiSchemaControls14, /原生输出分辨率/),
      assert.match(renderModelUiSchemaControls14, /超分辨率/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="480p"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="720p"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="native1080p"/),
      assert.doesNotMatch(renderModelUiSchemaControls14, /data-ui-schema-value="none"/),
      assert.doesNotMatch(renderModelUiSchemaControls14, /不超分/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="1080p"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="2k"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-value="21:9"/),
      assert.equal(
        (renderModelUiSchemaControls14.match(/data-ui-schema-field="resolution"/g) || []).length,
        1,
      ),
      assert.equal(
        (renderModelUiSchemaControls14.match(/data-ui-schema-menu-trigger="qualityRatio"/g) || []).length,
        1,
      ),
      assert.match(renderModelUiSchemaControls14, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls15 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      { generationParams: { rh_seedance_2_mode: 'text2video' } },
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls15, /data-ui-schema-field="generateAudio"/),
      assert.match(renderModelUiSchemaControls15, /data-ui-schema-field="webSearch"/),
      assert.match(renderModelUiSchemaControls15, /data-ui-schema-field="realPersonMode"/),
      assert.doesNotMatch(renderModelUiSchemaControls15, /data-ui-schema-field="returnLastFrame"/),
      assert.match(renderModelUiSchemaControls15, /data-ui-schema-field="seed"/));
    const renderModelUiSchemaControls16 = renderModelUiSchemaControls(
      'runninghub-model/seedance-2.0',
      { generationParams: { rh_seedance_2_mode: 'multimodal2video' } },
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls16, /data-ui-schema-field="generateAudio"/),
      assert.match(renderModelUiSchemaControls16, /data-ui-schema-field="realPersonMode"/),
      assert.doesNotMatch(renderModelUiSchemaControls16, /data-ui-schema-field="webSearch"/));
    const renderModelUiSchemaControls17 = renderModelUiSchemaControls(
      'runninghub-model/happyhorse-1.0',
      { generationParams: { happyhorse_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls17, /data-ui-schema-field="happyhorse_mode"/),
      assert.match(renderModelUiSchemaControls17, /data-ui-schema-value="image"/),
      assert.match(renderModelUiSchemaControls17, /data-ui-schema-value="reference"/),
      assert.match(renderModelUiSchemaControls17, /data-ui-schema-value="edit"/));
    const renderModelUiSchemaControls18 = renderModelUiSchemaControls(
      'runninghub-model/happyhorse-1.0',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls18, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls18, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls18, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls18, /data-ui-schema-value="720P"/),
      assert.match(renderModelUiSchemaControls18, /data-ui-schema-value="1080P"/),
      assert.match(renderModelUiSchemaControls18, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls18, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls19 = renderModelUiSchemaControls(
      'runninghub-model/happyhorse-1.0',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls19, /data-ui-schema-field="audio_setting"/),
      assert.match(renderModelUiSchemaControls19, /data-ui-schema-field="seed"/),
      assert.doesNotMatch(renderModelUiSchemaControls19, /data-ui-schema-field="watermark"/));
    const renderModelUiSchemaControls20 = renderModelUiSchemaControls(
      'runninghub-model/hailuo-02',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls20, /data-ui-schema-field="rh_hailuo_02_quality"/),
      assert.doesNotMatch(renderModelUiSchemaControls20, /data-ui-schema-field="aspectRatio"/),
      assert.doesNotMatch(renderModelUiSchemaControls20, /data-ui-schema-value="自适应"/));
    const renderModelUiSchemaControls21 = renderModelUiSchemaControls(
      'runninghub-model/hailuo-2.3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls21, /data-ui-schema-field="rh_hailuo_23_quality"/),
      assert.match(renderModelUiSchemaControls21, /data-ui-schema-value="fastPro"/),
      assert.match(renderModelUiSchemaControls21, /data-ui-schema-field="duration"/),
      assert.doesNotMatch(renderModelUiSchemaControls21, /data-ui-schema-field="aspectRatio"/),
      assert.doesNotMatch(renderModelUiSchemaControls21, /data-ui-schema-value="自适应"/),
      assert.doesNotMatch(runningHubVideoModelApiMenuItems, /data-provider="runninghubwf"/));
  }),
  test('video parameter panel: Volcengine uses Dreamina official style entry', () => {
    const list = buildVolcengineOfficialVideoMenuItems('volcengine/seedance-2.0-fast', 'volcengine');
    (assert.equal(list.length, 1),
      assert.equal(list[0].modelId, 'volcengine/seedance-2.0-fast'),
      assert.equal(list[0].provider, 'volcengine'),
      assert.equal(list[0].label, '火山方舟'),
      assert.equal(list[0].active, true),
      assert.match(list[0].iconHtml, /images\/volcengine\.svg/));
    const dreaminaTaskModelMenuHtml = buildDreaminaTaskModelMenuHtml(
      'volcengine/seedance-2.0-fast',
      'text2video',
      'volcengine',
    );
    (assert.deepEqual(extractMenuModelOrder(dreaminaTaskModelMenuHtml), [
      'volcengine/seedance-2.0-fast',
      'volcengine/seedance-2.0',
      'volcengine/seedance-2.0-mini',
    ]),
      assert.match(dreaminaTaskModelMenuHtml, /data-provider="volcengine"/),
      assert.match(dreaminaTaskModelMenuHtml, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      assert.match(dreaminaTaskModelMenuHtml, /<div class="fmi-title">Seedance 2\.0<\/div>/),
      assert.match(dreaminaTaskModelMenuHtml, /<div class="fmi-title">Seedance 2\.0 Mini<\/div>/));
    const dreaminaParamSchemaFields = buildDreaminaParamSchemaFields({
        routeMode: 'frames2video',
        currentRatio: '自适应',
        currentResolution: '720p',
        currentDuration: 5,
        resolutionOptions: ['480p', '720p'],
      }),
      renderUiSchemaFields2 = renderUiSchemaFields(
        [dreaminaParamSchemaFields.mode],
        { generationParams: { dreaminaRouteMode: 'frames2video' } },
        { sourceId: 'volcengine-dreamina-style' },
      );
    (assert.match(renderUiSchemaFields2, /data-ui-schema-field="dreaminaRouteMode"/),
      assert.match(renderUiSchemaFields2, /data-ui-schema-value="multimodal2video"/),
      assert.match(renderUiSchemaFields2, /data-ui-schema-value="frames2video"/),
      assert.doesNotMatch(renderUiSchemaFields2, /data-ui-schema-value="text2video"/),
      assert.doesNotMatch(renderUiSchemaFields2, /data-ui-schema-value="image2video"/));
    const videoNodeParameterPanelModule = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (key) => key,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard: () => {},
      isVideoVipModel: () => false,
    });
    assert.equal(
      videoNodeParameterPanelModule._getModelIconHTML('volcengine/seedance-2.0-fast', 'volcengine'),
      buildVolcengineVideoLogoHTML(12),
    );
  }),
  test('video parameter panel: 即梦官方当前模型 logo 使用无背景大即梦图标', () => {
    const videoNodeParameterPanelModule2 = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (result) => result,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard: () => {},
      isVideoVipModel: () => false,
    });
    assert.equal(
      videoNodeParameterPanelModule2._getModelIconHTML('dreamina/text2video', 'dreamina'),
      buildDreaminaVideoLogoHTML(12),
    );
  }),
  test('video node state sync keeps modelApi advanced settings visible', () => {
    const model = 'runninghub-model/kling-v3';
    assert.equal(hasModelUiSchema(model, { placement: 'advanced' }), true);
    const markup = renderModelUiSchemaControls(model, { generationParams: {} }, { placement: 'advanced' });
    for (const field of ['cfgScale', 'shotType', 'negative_prompt', 'audio'])
      assert.ok(markup.includes('data-ui-schema-field="' + field + '"'), field);
  }),
  test('APIMart video modelApi schema controls follow each model API', () => {
    const renderModelUiSchemaControls22 = renderModelUiSchemaControls(
      'apimart/veo3-fast',
      { generationParams: { mode: 'quality', generation_type: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls22, /data-ui-schema-field="mode"/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-composite-field="sectionPair"/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-primary-field="mode"/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-secondary-field="generation_type"/),
      assert.match(renderModelUiSchemaControls22, /ui-schema-section-pair-popup/),
      assert.match(renderModelUiSchemaControls22, /ui-schema-section-pair-label">quality · 首尾帧/),
      assert.doesNotMatch(renderModelUiSchemaControls22, /data-ui-schema-value="lite"/),
      assert.doesNotMatch(renderModelUiSchemaControls22, /veo3\.1-lite/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-value="fast"/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-value="quality"/),
      assert.match(
        renderModelUiSchemaControls22,
        /data-tooltip="veo3\.1-fast - 快速生成模型，适用于快速预览和迭代\nveo3\.1-quality - 高质量生成模型，适用于最终制作"/,
      ),
      assert.doesNotMatch(
        renderModelUiSchemaControls22,
        /data-ui-schema-menu-trigger="sectionPair"[^>]*title=/,
      ),
      assert.match(renderModelUiSchemaControls22, /ui-schema-info-tip/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-field="generation_type"/),
      assert.match(renderModelUiSchemaControls22, /data-ui-schema-value="frame"/),
      assert.match(
        renderModelUiSchemaControls22,
        /data-ui-schema-value="reference"[^>]*data-ui-schema-disabled="true"/,
      ),
      assert.doesNotMatch(renderModelUiSchemaControls22, /data-ui-schema-field="duration"/),
      assert.equal((renderModelUiSchemaControls22.match(/data-ui-schema-menu-trigger="/g) || []).length, 1));
    const renderModelUiSchemaControls23 = renderModelUiSchemaControls(
      'apimart/veo3-fast',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls23, /视频分辨率/),
      assert.match(renderModelUiSchemaControls23, /比例/),
      assert.doesNotMatch(
        renderModelUiSchemaControls23,
        /data-ui-schema-menu-trigger="qualityRatio"[^>]*title=/,
      ),
      assert.match(renderModelUiSchemaControls23, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls23, /img-rp-large-adaptive/),
      assert.match(renderModelUiSchemaControls23, /data-ui-schema-value="自适应"/),
      assert.doesNotMatch(renderModelUiSchemaControls23, /data-ui-schema-value="1:1"/),
      assert.match(renderModelUiSchemaControls23, /data-ui-schema-field="duration"/),
      assert.match(renderModelUiSchemaControls23, /data-ui-schema-menu-trigger="duration" disabled/));
    const renderModelUiSchemaControls24 = renderModelUiSchemaControls(
      'apimart/veo3-fast',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls24, /启用 GIF 输出格式/),
      assert.doesNotMatch(renderModelUiSchemaControls24, /official_fallback/));
    const renderModelUiSchemaControls25 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo',
      { generationParams: { duration: 10 } },
      { placement: 'mode' },
    );
    (assert.doesNotMatch(renderModelUiSchemaControls25, /data-ui-schema-field="mode"/),
      assert.doesNotMatch(renderModelUiSchemaControls25, /Hailuo-2\.3/));
    const modelManifest = getModelManifest('apimart/minimax-hailuo');
    (assert.match(modelManifest?.help?.tooltip || '', /Hailuo-02 适用场景/),
      assert.match(modelManifest?.help?.tooltip || '', /\[\[red:放 2 张首尾帧\]\]/),
      assert.match(modelManifest?.help?.tooltip || '', /1080p 只做 5 秒/),
      assert.doesNotMatch(renderModelUiSchemaControls25, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls26 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls26, /视频分辨率/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-value="512p"/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-value="768p"/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-value="1080p"/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-field="duration"/),
      assert.match(renderModelUiSchemaControls26, /data-ui-schema-range-values="5,10"/),
      assert.match(renderModelUiSchemaControls26, /min="0" max="1" step="1" value="0"/),
      assert.match(renderModelUiSchemaControls26, /视频时长（秒）/));
    const renderModelUiSchemaControls27 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls27, /自动优化提示词/),
      assert.match(renderModelUiSchemaControls27, /快速预处理/),
      assert.match(renderModelUiSchemaControls27, /Watermark|添加水印/),
      assert.match(renderModelUiSchemaControls27, /data-ui-schema-field="fast_pretreatment"/));
    const renderModelUiSchemaControls28 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo-2.3',
      { generationParams: { mode: 'fast' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls28, /data-ui-schema-field="mode"/),
      assert.match(renderModelUiSchemaControls28, /data-ui-schema-value="standard"/),
      assert.match(renderModelUiSchemaControls28, /data-ui-schema-value="fast"/),
      assert.match(renderModelUiSchemaControls28, /Fast 版/),
      assert.match(
        getModelManifest('apimart/minimax-hailuo-2.3')?.help?.tooltip || '',
        /Fast 版必须放 1 张首帧/,
      ));
    const renderModelUiSchemaControls29 = renderModelUiSchemaControls(
      'apimart/minimax-hailuo-2.3',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls29, /视频分辨率/),
      assert.doesNotMatch(renderModelUiSchemaControls29, /data-ui-schema-value="512p"/),
      assert.match(renderModelUiSchemaControls29, /data-ui-schema-value="768p"/),
      assert.match(renderModelUiSchemaControls29, /data-ui-schema-value="1080p"/),
      assert.match(renderModelUiSchemaControls29, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls29, /data-ui-schema-value="自适应"/),
      assert.match(renderModelUiSchemaControls29, /data-ui-schema-field="duration"/),
      assert.match(renderModelUiSchemaControls29, /data-ui-schema-range-values="6,10"/));
    const renderModelUiSchemaControls30 = renderModelUiSchemaControls(
        'apimart/happyhorse-1.0',
        {},
        { placement: 'advanced' },
      ),
      renderModelUiSchemaControls31 = renderModelUiSchemaControls(
        'apimart/happyhorse-1.0',
        { generationParams: { happyhorse_mode: 'auto', duration: 5 } },
        { placement: 'mode' },
      );
    (assert.match(renderModelUiSchemaControls31, /data-ui-schema-field="happyhorse_mode"/),
      assert.match(renderModelUiSchemaControls31, /ui-schema-pill-label">模式选择<\/span>/),
      assert.doesNotMatch(renderModelUiSchemaControls31, /data-ui-schema-value="auto"/),
      assert.match(renderModelUiSchemaControls31, /data-ui-schema-value="image"/),
      assert.match(renderModelUiSchemaControls31, /data-ui-schema-value="reference"/),
      assert.match(renderModelUiSchemaControls31, /data-ui-schema-value="edit"/),
      assert.doesNotMatch(renderModelUiSchemaControls31, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls32 = renderModelUiSchemaControls(
      'apimart/happyhorse-1.0',
      {},
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls32, /视频分辨率/),
      assert.match(renderModelUiSchemaControls32, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls32, /data-ui-schema-field="duration"/),
      assert.match(renderModelUiSchemaControls32, /ui-schema-duration-pop/),
      assert.equal(buildModelUiSchemaDefaultParams('apimart/happyhorse-1.0').happyhorse_mode, 'image'),
      assert.equal(
        buildModelUiSchemaDefaultParams('runninghub-model/happyhorse-1.0').happyhorse_mode,
        'image',
      ),
      assert.match(renderModelUiSchemaControls30, /data-ui-schema-field="audio_setting"/),
      assert.match(renderModelUiSchemaControls30, /音频设置/),
      assert.match(renderModelUiSchemaControls30, /data-ui-schema-field="watermark"/),
      assert.doesNotMatch(renderModelUiSchemaControls30, /data-ui-schema-field="prompt_extend"/));
    const renderModelUiSchemaControls33 = renderModelUiSchemaControls(
      'apimart/wan2.7',
      { generationParams: { wan27_mode: 'image' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls33, /data-ui-schema-field="wan27_mode"/),
      assert.match(renderModelUiSchemaControls33, /data-ui-schema-value="image"/),
      assert.match(renderModelUiSchemaControls33, /data-ui-schema-value="video"/),
      assert.match(renderModelUiSchemaControls33, /data-ui-schema-value="reference"/),
      assert.match(renderModelUiSchemaControls33, /data-ui-schema-value="edit"/),
      assert.doesNotMatch(renderModelUiSchemaControls33, /data-ui-schema-field="wan27_reference_input"/),
      assert.doesNotMatch(renderModelUiSchemaControls33, /data-ui-schema-field="wan27_edit_input"/),
      assert.match(renderModelUiSchemaControls33, /图生视频/),
      assert.match(renderModelUiSchemaControls33, /视频续写/),
      assert.match(renderModelUiSchemaControls33, /参考生视频/),
      assert.match(renderModelUiSchemaControls33, /视频编辑/));
    const renderModelUiSchemaControls34 = renderModelUiSchemaControls(
      'apimart/wan2.7',
      { generationParams: { wan27_mode: 'reference' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls34, /data-ui-schema-field="wan27_mode"/),
      assert.doesNotMatch(renderModelUiSchemaControls34, /data-ui-schema-field="wan27_reference_input"/),
      assert.doesNotMatch(renderModelUiSchemaControls34, /data-ui-schema-field="wan27_edit_input"/));
    const renderModelUiSchemaControls35 = renderModelUiSchemaControls(
      'apimart/wan2.7',
      { generationParams: { wan27_mode: 'edit' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls35, /data-ui-schema-field="wan27_mode"/),
      assert.doesNotMatch(renderModelUiSchemaControls35, /data-ui-schema-field="wan27_edit_input"/),
      assert.doesNotMatch(renderModelUiSchemaControls35, /data-ui-schema-field="wan27_reference_input"/));
    const renderModelUiSchemaControls36 = renderModelUiSchemaControls(
      'apimart/wan2.7',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls36, /data-ui-schema-field="negative_prompt"/),
      assert.match(renderModelUiSchemaControls36, /反向提示词/),
      assert.match(renderModelUiSchemaControls36, /模糊、变形、低质量/),
      assert.match(renderModelUiSchemaControls36, /prompt 智能改写/));
    const uiSchemaParamPatch = buildUiSchemaParamPatch(
      { model: 'wan2.7', provider: 'apimart', generationParams: { duration: 6 } },
      'wan27_mode',
      'reference',
    );
    (assert.equal(uiSchemaParamPatch.generationParams.wan27_mode, 'reference'),
      assert.equal(uiSchemaParamPatch.generationParams.duration, 6));
    const renderModelUiSchemaControls37 = renderModelUiSchemaControls(
      'apimart/kling-v3',
      {},
      { placement: 'mode' },
    );
    (assert.doesNotMatch(renderModelUiSchemaControls37, /data-ui-schema-field="duration"/),
      assert.doesNotMatch(renderModelUiSchemaControls37, /data-ui-schema-value="4k"/));
    const renderModelUiSchemaControls38 = renderModelUiSchemaControls(
      'apimart/kling-v3',
      { generationParams: { resolution: 'std', aspectRatio: '自适应' } },
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls38, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls38, /data-ui-schema-field="resolution"/),
      assert.match(renderModelUiSchemaControls38, /data-ui-schema-field="aspectRatio"/),
      assert.match(renderModelUiSchemaControls38, /720P/),
      assert.match(renderModelUiSchemaControls38, /1080P/),
      assert.match(renderModelUiSchemaControls38, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls38, /data-ui-schema-field="duration"/),
      assert.doesNotMatch(renderModelUiSchemaControls38, /Kling V3 模式说明/));
    const renderModelUiSchemaControls39 = renderModelUiSchemaControls(
      'apimart/kling-v3',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls39, /生成有声视频/),
      assert.match(renderModelUiSchemaControls39, /多镜头分镜模式/),
      assert.match(renderModelUiSchemaControls39, /data-ui-schema-field="negative_prompt"/),
      assert.match(renderModelUiSchemaControls39, /模糊, 低画质, 变形/),
      assert.match(renderModelUiSchemaControls39, /data-ui-schema-default-aliases=/),
      assert.match(
        renderModelUiSchemaControls39,
        /data-ui-schema-field="multi_shot"[\s\S]*data-ui-schema-disabled="true"/,
      ));
    const uiSchemaParamPatch2 = buildUiSchemaParamPatch(
      { model: 'apimart/kling-v3', provider: 'apimart', generationParams: {} },
      'negative_prompt',
      'none',
    );
    assert.equal(uiSchemaParamPatch2.generationParams.negative_prompt, '模糊, 低画质, 变形');
    const videoModelApiModelSelectionPatch = buildVideoModelApiModelSelectionPatch(
      { provider: 'apimart', generationParamsByModel: { 'apimart/kling-v3': { negative_prompt: 'none' } } },
      'apimart/kling-v3',
      'apimart',
    );
    assert.equal(videoModelApiModelSelectionPatch.generationParams.negative_prompt, '模糊, 低画质, 变形');
    const el = { value: '' },
      data = {
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
        querySelector(options) {
          if (options === '[data-ui-schema-input]') return el;
          return null;
        },
      };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(target) {
          if (target === '[data-ui-schema-field]') return [data];
          return [];
        },
      },
      { generationParams: { negative_prompt: 'none' } },
    ),
      assert.equal(el.value, '模糊, 低画质, 变形'));
    const renderModelUiSchemaControls40 = renderModelUiSchemaControls(
      'apimart/kling-v3-omni',
      { generationParams: { kling_v3_omni_mode: 'image' } },
      { placement: 'mode' },
    );
    (assert.match(renderModelUiSchemaControls40, /data-ui-schema-field="kling_v3_omni_mode"/),
      assert.match(renderModelUiSchemaControls40, /data-ui-schema-value="image"/),
      assert.match(renderModelUiSchemaControls40, /data-ui-schema-value="reference"/),
      assert.match(renderModelUiSchemaControls40, /data-ui-schema-value="edit"/),
      assert.match(renderModelUiSchemaControls40, /图生视频/),
      assert.match(renderModelUiSchemaControls40, /参考生视频/),
      assert.match(renderModelUiSchemaControls40, /视频编辑/));
    const renderModelUiSchemaControls41 = renderModelUiSchemaControls(
      'apimart/kling-v3-omni',
      { generationParams: { resolution: 'pro', aspectRatio: '16:9' } },
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls41, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls41, /720P/),
      assert.match(renderModelUiSchemaControls41, /1080P/),
      assert.match(renderModelUiSchemaControls41, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls41, /data-ui-schema-field="duration"/));
    const renderModelUiSchemaControls42 = renderModelUiSchemaControls(
      'apimart/kling-v3-omni',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls42, /生成有声视频/),
      assert.match(renderModelUiSchemaControls42, /多镜头分镜模式/),
      assert.match(renderModelUiSchemaControls42, /data-ui-schema-field="negative_prompt"/),
      assert.match(renderModelUiSchemaControls42, /模糊, 低画质, 变形/));
    const renderModelUiSchemaControls43 = renderModelUiSchemaControls(
      'apimart/kling-video-o1',
      {},
      { placement: 'advanced' },
    );
    (assert.match(renderModelUiSchemaControls43, /data-ui-schema-field="keep_original_sound"/),
      assert.match(renderModelUiSchemaControls43, /保留原声/),
      assert.match(renderModelUiSchemaControls43, /编辑视频或特征参考视频/));
    const renderModelUiSchemaControls44 = renderModelUiSchemaControls(
      'apimart/kling-video-o1',
      { generationParams: { resolution: 'pro', aspectRatio: '16:9' } },
      { placement: 'resolution' },
    );
    (assert.match(renderModelUiSchemaControls44, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderModelUiSchemaControls44, /720P/),
      assert.match(renderModelUiSchemaControls44, /1080P/),
      assert.doesNotMatch(renderModelUiSchemaControls44, /data-ui-schema-value="4k"/),
      assert.match(renderModelUiSchemaControls44, /data-ui-schema-type="slider"/),
      assert.match(renderModelUiSchemaControls44, /data-ui-schema-range-values="5,10"/),
      assert.match(renderModelUiSchemaControls44, /ui-schema-duration-slider/),
      assert.match(renderModelUiSchemaControls44, />5S</),
      assert.match(renderModelUiSchemaControls44, />10S</));
    const renderModelUiSchemaControls45 = renderModelUiSchemaControls(
      'apimart/kling-video-o1',
      { generationParams: { duration: 10 } },
      { placement: 'mode' },
    );
    (assert.doesNotMatch(renderModelUiSchemaControls45, /data-ui-schema-type="slider"/),
      assert.doesNotMatch(renderModelUiSchemaControls45, /data-ui-schema-field="duration"/),
      assert.equal(
        resolveModelExecution('apimart/kling-video-o1')?.executionManifest?.extensions?.bodyResolver,
        'apimartKlingO1Video',
      ));
    const list2 = renderModelUiSchemaControls(
      'apimart/viduq3',
      { generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3' } },
      { placement: 'mode' },
    );
    (assert.match(list2, /data-ui-schema-field="vidu_q3_generation_mode"/),
      assert.match(list2, /data-ui-schema-field="mode"/),
      assert.ok(
        list2.indexOf('data-ui-schema-field="mode"') <
          list2.indexOf('data-ui-schema-field="vidu_q3_generation_mode"'),
      ),
      assert.match(list2, /data-ui-schema-value="viduq3-turbo"[^>]*data-ui-schema-disabled="true"/),
      assert.match(list2, /data-ui-schema-value="viduq3"/));
    const list3 = renderModelUiSchemaControls(
      'apimart/viduq3',
      { generationParams: { vidu_q3_generation_mode: 'reference', mode: 'viduq3-mix' } },
      { placement: 'resolution' },
    );
    (assert.match(list3, /data-ui-schema-value="540p"[^>]*data-ui-schema-disabled="true"/),
      assert.match(list3, /data-ui-schema-value="1080p"/),
      assert.match(list3, /data-ui-schema-field="duration"/),
      assert.ok(
        list3.indexOf('data-ui-schema-composite-field="qualityRatio"') <
          list3.indexOf('data-ui-schema-field="duration"'),
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
      ].forEach((item3) => {
        const renderModelUiSchemaControls46 = renderModelUiSchemaControls(item3, {}, { placement: 'mode' }),
          list4 = renderModelUiSchemaControls(item3, {}, { placement: 'resolution' });
        (assert.doesNotMatch(renderModelUiSchemaControls46, /data-ui-schema-field="duration"/, item3),
          assert.match(list4, /data-ui-schema-composite-field="qualityRatio"/, item3),
          assert.match(list4, /data-ui-schema-field="duration"/, item3),
          assert.ok(
            list4.indexOf('data-ui-schema-composite-field="qualityRatio"') <
              list4.indexOf('data-ui-schema-field="duration"'),
            item3,
          ));
      }));
  }),
  test('APIMart added video modelApi controls use shared Chinese schema labels', () => {
    const list5 = [
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
      map = new Set([
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
    list5.forEach((item4) => {
      const modelManifest2 = getModelManifest(item4),
        list6 = modelManifest2?.uiSchema?.fields || [];
      list6.forEach((item5) => {
        (assert.equal(map.has(item5.label), false, item4 + ':' + item5.id),
          (item5.options || []).forEach((el2) => {
            assert.equal(map.has(el2.label), false, item4 + ':' + item5.id + ':' + el2.value);
          }));
      });
      const current = list6.find((item6) => item6.id === 'duration');
      if (current) assert.equal(current.label, '视频时长');
      const entry = list6.find((item7) => item7.id === 'resolution');
      if (entry) assert.equal(entry.label, '视频分辨率');
      const record = list6.find((item8) => item8.id === 'aspectRatio');
      record && (assert.equal(record.label, '比例'), assert.equal(record.displayRole, 'aspectRatio'));
    });
    const run = (payload, handle) =>
      resolveModelExecution(payload)?.executionManifest?.bodyMapping?.find((item9) => item9.path === handle);
    (assert.equal(run('apimart/happyhorse-1.0', 'resolution')?.defaultValue, '1080P'),
      assert.equal(run('apimart/wan2.7', 'resolution')?.defaultValue, '1080P'),
      assert.equal(run('apimart/viduq3', 'audio')?.defaultValue, true),
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
    const panel = createVideoNodeParameterPanelModule({
      store: {},
      api: {},
      getDisplayModelName: (id) => id,
      PROVIDERS_META: {},
      getAIGenerationNodeSize: () => ({}),
      getDisplayedMediaSizeFromNode: () => ({}),
      activateMenuKeyboard() {},
      isVideoVipModel: () => false,
    });
    const markup = panel._buildVideoModelMenuHtml.call({
      _data: { provider: 'apimart', model: 'apimart/kling-v3' },
    });
    for (const text of [
      'RunningHUB工作流',
      'RunningHUB模型',
      'APIMart',
      'data-provider="apimart"',
      'data-provider="runninghubwf"',
    ])
      assert.ok(markup.includes(text), text);
    assert.match(markup, /active[^>]*data-value="apimart\/kling-v3"/);
  }),
  test('Dreamina and APIMart task model menus keep existing HTML contract', () => {
    (assert.deepEqual(
      getDreaminaTaskModelMenuItems('multimodal2video', 'dreamina').map((item10) => item10.model),
      [
        'dreamina/seedance2.0fast_vip',
        'dreamina/seedance2.0_vip',
        'dreamina/seedance2.0fast',
        'dreamina/seedance2.0',
      ],
    ),
      assert.deepEqual(
        getDreaminaTaskModelMenuItems('frames2video', 'dreamina').map((item11) => item11.model),
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
        getDreaminaTaskModelMenuItems('frames2video', 'apimart').map((item12) => item12.model),
        [
          'apimart/doubao-seedance-2.0-fast',
          'apimart/doubao-seedance-2.0',
          'apimart/doubao-seedance-2.0-fast-face',
          'apimart/doubao-seedance-2.0-face',
          'apimart/doubao-seedance-1-5-pro',
          'apimart/doubao-seedance-1-0-pro-quality',
        ],
      ));
    const dreaminaTaskModelMenuHtml2 = buildDreaminaTaskModelMenuHtml(
      'dreamina/seedance2.0fast',
      'multimodal2video',
      'dreamina',
    );
    (assert.match(
      dreaminaTaskModelMenuHtml2,
      /<img src="images\/jimeng\.png" class="node-menu-icon" alt="dreamina">/,
    ),
      assert.match(
        dreaminaTaskModelMenuHtml2,
        /class="floating-menu-item node-menu-item active" data-value="dreamina\/seedance2\.0fast" data-provider="dreamina" data-dreamina-task-model="1"/,
      ),
      assert.match(dreaminaTaskModelMenuHtml2, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      assert.match(
        dreaminaTaskModelMenuHtml2,
        /<div class="fmi-sub">默认推荐，支持文生、图生、首尾帧、全能参考<\/div>/,
      ));
    const dreaminaTaskModelMenuHtml3 = buildDreaminaTaskModelMenuHtml(
      'apimart/doubao-seedance-2.0-fast',
      'multimodal2video',
      'apimart',
    );
    (assert.match(dreaminaTaskModelMenuHtml3, /node-menu-icon-apimart">AM<\/div>/),
      assert.match(
        dreaminaTaskModelMenuHtml3,
        /class="floating-menu-item node-menu-item active" data-value="apimart\/doubao-seedance-2\.0-fast" data-provider="apimart" data-dreamina-task-model="1"/,
      ),
      assert.match(dreaminaTaskModelMenuHtml3, /<div class="fmi-title">Seedance 2\.0 Fast<\/div>/),
      assert.match(
        dreaminaTaskModelMenuHtml3,
        /<div class="fmi-sub">APIMart 快速版，支持文生、图生、首尾帧与参考素材<\/div>/,
      ));
    const dreaminaTaskModelMenuHtml4 = buildDreaminaTaskModelMenuHtml(
      'dreamina/seedance2.0fast',
      'multiframe2video',
      'dreamina',
    );
    (assert.match(
      dreaminaTaskModelMenuHtml4,
      /class="floating-menu-item node-menu-item disabled" data-disabled="true"/,
    ),
      assert.match(dreaminaTaskModelMenuHtml4, /<div class="fmi-title">智能多帧<\/div>/),
      assert.match(dreaminaTaskModelMenuHtml4, /<div class="fmi-sub">暂未开放模型切换<\/div>/),
      assert.doesNotMatch(dreaminaTaskModelMenuHtml2, /style=/),
      assert.doesNotMatch(dreaminaTaskModelMenuHtml3, /style=/),
      assert.doesNotMatch(dreaminaTaskModelMenuHtml4, /style=/));
  }),
  test('video parameter panel: RunningHub instance control is rendered by uiSchema', () => {
    const renderModelUiSchemaControls47 = renderModelUiSchemaControls(
      'runninghub/2054101324521844738',
      { generationParams: { rhInstanceType: 'plus' } },
      { placement: 'instance', variant: 'instanceToggle' },
    );
    (assert.match(renderModelUiSchemaControls47, /data-ui-schema-field="rhInstanceType"/),
      assert.match(renderModelUiSchemaControls47, /rh-vram-btn/),
      assert.match(renderModelUiSchemaControls47, />48G</));
    const uiSchemaParamPatch3 = buildUiSchemaParamPatch(
      {
        model: 'runninghub/2054101324521844738',
        rhInstanceType: 'default',
        generationParams: { rhInstanceType: 'default' },
      },
      'rhInstanceType',
      'plus',
    );
    (assert.equal(Object.prototype.hasOwnProperty.call(uiSchemaParamPatch3, 'rhInstanceType'), false),
      assert.equal(uiSchemaParamPatch3.generationParams.rhInstanceType, 'plus'));
  }),
  test('Dreamina video normal params render through direct uiSchema fields', () => {
    const currentRatio = getDreaminaEffectiveNodeData({
        model: 'dreamina/seedance2.0fast',
        provider: 'dreamina',
        duration: 7,
        aspectRatio: '自适应',
        generationParams: { duration: 6, aspectRatio: '16:9', resolution: '1080p' },
      }),
      dreaminaParamSchemaFields2 = buildDreaminaParamSchemaFields({
        routeMode: 'multimodal2video',
        currentRatio: currentRatio.aspectRatio,
        currentResolution: currentRatio.resolution,
        currentDuration: currentRatio.duration,
        durationRange: { min: 4, max: 10, step: 1 },
        resolutionOptions: ['720p', '1080p'],
      }),
      renderUiSchemaFields3 = renderUiSchemaFields(
        [dreaminaParamSchemaFields2.resolution, dreaminaParamSchemaFields2.aspectRatio],
        currentRatio,
        {
          placement: 'resolution',
        },
      ),
      renderUiSchemaFields4 = renderUiSchemaFields([dreaminaParamSchemaFields2.mode], currentRatio),
      renderUiSchemaFields5 = renderUiSchemaFields([dreaminaParamSchemaFields2.duration], currentRatio);
    (assert.equal(currentRatio.duration, 6),
      assert.equal(currentRatio.aspectRatio, '16:9'),
      assert.match(renderUiSchemaFields4, /multimodal2video/),
      assert.match(renderUiSchemaFields4, /frames2video/),
      assert.doesNotMatch(renderUiSchemaFields4, /multiframe2video/),
      assert.doesNotMatch(renderUiSchemaFields4, /智能多帧/),
      assert.match(renderUiSchemaFields3, /img-rp-quality-area/),
      assert.match(renderUiSchemaFields3, /img-rp-ratio-area/),
      assert.match(renderUiSchemaFields3, /data-ui-schema-composite-field="qualityRatio"/),
      assert.match(renderUiSchemaFields3, /data-ui-schema-field="resolution"/),
      assert.doesNotMatch(renderUiSchemaFields3, /ui-schema-video-resolution-pill/),
      assertCssContract(
        nodeTypesCss,
        /\.video-node \.img-rp-large-adaptive\s*\{[^}]*background:\s*var\(--white-10\)/,
        true,
      ),
      assert.match(renderUiSchemaFields5, /ui-schema-duration-pill/),
      assert.match(renderUiSchemaFields5, /floating-menu ui-schema-popup ui-schema-duration-pop/),
      assert.doesNotMatch(renderUiSchemaFields5, /ui-schema-duration-pop"[^>]*style=/),
      assert.match(renderUiSchemaFields5, /ui-schema-duration-title/),
      assert.match(renderUiSchemaFields5, /ui-schema-duration-bounds/));
    const el3 = {
        textContent: '',
        querySelector() {
          return null;
        },
      },
      state = { value: '' },
      config = {
        dataset: { uiSchemaField: 'duration', uiSchemaDefault: '6' },
        classList: {
          contains(scope) {
            return scope === 'ui-schema-duration-pill';
          },
        },
        querySelectorAll() {
          return [];
        },
        querySelector(output) {
          if (output === '[data-ui-schema-input]') return state;
          if (output === '.ui-schema-duration-label') return el3;
          if (output === '.ui-schema-pill-label') return el3;
          return null;
        },
      };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(value2) {
          if (value2 === '[data-ui-schema-field]') return [config];
          return [];
        },
      },
      { generationParams: { duration: 4 } },
    ),
      assert.equal(el3.textContent, '4S'),
      assert.notEqual(el3.textContent, 'Resolution 4'));
    const dreaminaParamPatch = buildDreaminaParamPatch(currentRatio, {
      duration: 8,
      resolution: '720p',
      aspectRatio: '1:1',
    });
    (assert.equal(Object.prototype.hasOwnProperty.call(dreaminaParamPatch, 'duration'), false),
      assert.equal(Object.prototype.hasOwnProperty.call(dreaminaParamPatch, 'resolution'), false),
      assert.equal(dreaminaParamPatch.generationParams.duration, 8),
      assert.equal(dreaminaParamPatch.generationParams.resolution, '720p'),
      assert.equal(
        dreaminaParamPatch.generationParamsByModel['dreamina/seedance2.0fast'].aspectRatio,
        '1:1',
      ));
  }),
  test('Dreamina/APIMart video model selection restores per-model generation params', () => {
    const dreaminaModelSelectionParamPatch = buildDreaminaModelSelectionParamPatch(
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
      dreaminaModelSelectionParamPatch.generationParamsByModel['dreamina/seedance2.0fast'].dreaminaRouteMode,
      'multimodal2video',
    ),
      assert.equal(
        dreaminaModelSelectionParamPatch.generationParamsByModel['dreamina/seedance2.0fast'].aspectRatio,
        '16:9',
      ),
      assert.equal(
        dreaminaModelSelectionParamPatch.generationParamsByModel['dreamina/seedance2.0fast'].resolution,
        '720p',
      ),
      assert.equal(
        dreaminaModelSelectionParamPatch.generationParamsByModel['dreamina/seedance2.0fast'].duration,
        6,
      ),
      assert.equal(
        dreaminaModelSelectionParamPatch.generationParamsByModel['dreamina/seedance2.0fast']
          .dreaminaModelByRouteMode['dreamina:multimodal2video'],
        'dreamina/seedance2.0',
      ),
      assert.equal(dreaminaModelSelectionParamPatch.generationParams.aspectRatio, '9:16'),
      assert.equal(dreaminaModelSelectionParamPatch.generationParams.duration, 12),
      assert.equal(dreaminaModelSelectionParamPatch.generationParams.resolution, '720p'),
      assert.equal(dreaminaModelSelectionParamPatch.dreaminaRouteMode, 'multimodal2video'),
      assert.equal(dreaminaModelSelectionParamPatch.generationParams.dreaminaRouteMode, 'multimodal2video'));
    const dreaminaModelSelectionParamPatch2 = buildDreaminaModelSelectionParamPatch(
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
    (assert.equal(dreaminaModelSelectionParamPatch2.generationParams.aspectRatio, '21:9'),
      assert.equal(dreaminaModelSelectionParamPatch2.generationParams.resolution, '1080p'),
      assert.equal(dreaminaModelSelectionParamPatch2.generationParams.duration, 11),
      assert.equal(
        dreaminaModelSelectionParamPatch2.generationParamsByModel['apimart/doubao-seedance-2.0-fast']
          .resolution,
        '480p',
      ));
  }),
  test('ordinary APIMart modelApi video selection scopes generation params per model', () => {
    const videoModelApiModelSelectionPatch2 = buildVideoModelApiModelSelectionPatch(
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
    (assert.equal(Object.hasOwn(videoModelApiModelSelectionPatch2.generationParams, 'mode'), false),
      assert.equal(videoModelApiModelSelectionPatch2.generationParams.duration, 5),
      assert.equal(videoModelApiModelSelectionPatch2.generationParams.resolution, '768p'),
      assert.equal(videoModelApiModelSelectionPatch2.generationParams.aspectRatio, '自适应'),
      assert.equal(videoModelApiModelSelectionPatch2.generationParams.prompt_optimizer, true),
      assert.equal(videoModelApiModelSelectionPatch2.generationParams.fast_pretreatment, false),
      assert.equal(videoModelApiModelSelectionPatch2.generationParams.watermark, false),
      assert.equal(
        videoModelApiModelSelectionPatch2.generationParamsByModel['apimart/veo3-fast'].resolution,
        '720p',
      ));
    const videoModelApiModelSelectionPatch3 = buildVideoModelApiModelSelectionPatch(
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
    (assert.equal(Object.hasOwn(videoModelApiModelSelectionPatch3.generationParams, 'mode'), false),
      assert.equal(videoModelApiModelSelectionPatch3.generationParams.duration, 5),
      assert.equal(videoModelApiModelSelectionPatch3.generationParams.resolution, '1080p'),
      assert.equal(videoModelApiModelSelectionPatch3.generationParams.prompt_optimizer, false));
    const videoModelApiModelSelectionPatch4 = buildVideoModelApiModelSelectionPatch(
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
    (assert.equal(Object.hasOwn(videoModelApiModelSelectionPatch4.generationParams, 'mode'), false),
      assert.equal(videoModelApiModelSelectionPatch4.generationParams.duration, 10),
      assert.equal(videoModelApiModelSelectionPatch4.generationParams.resolution, '768p'));
  }),
  test('ordinary APIMart modelApi video selection resets every target schema independently', () => {
    const value3 = [
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
      generationParams = {
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
    for (const model2 of value3) {
      const videoModelApiModelSelectionPatch5 = buildVideoModelApiModelSelectionPatch(
        { model: 'apimart/luma-ray-v2', provider: 'apimart', generationParams: generationParams },
        model2,
        'apimart',
        { model: model2, provider: 'apimart' },
      );
      assert.deepEqual(
        videoModelApiModelSelectionPatch5.generationParams,
        buildModelUiSchemaDefaultParams(model2),
        model2 + ' should start from its own uiSchema defaults',
      );
      const args = new Set((getModelManifest(model2)?.uiSchema?.fields || []).map((item13) => item13.id));
      assert.deepEqual(
        Object.keys(videoModelApiModelSelectionPatch5.generationParams).sort(),
        [...args].sort(),
        model2 + ' should not keep fields from another model',
      );
    }
  }),
  test('Dreamina route mode switch restores the model version selected in that mode', () => {
    const dreaminaModelSelectionParamPatch3 = buildDreaminaModelSelectionParamPatch(
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
    assert.equal(
      dreaminaModelSelectionParamPatch3.dreaminaModelByRouteMode['dreamina:frames2video'],
      'dreamina/3.5pro',
    );
    const dreaminaRouteModeUpdate = buildDreaminaRouteModeUpdate({
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
    (assert.equal(dreaminaRouteModeUpdate.patch.model, 'dreamina/3.5pro'),
      assert.equal(dreaminaRouteModeUpdate.patch.dreaminaRouteMode, 'frames2video'),
      assert.equal(
        dreaminaRouteModeUpdate.patch.dreaminaModelByRouteMode['dreamina:frames2video'],
        'dreamina/3.5pro',
      ),
      assert.equal(
        dreaminaRouteModeUpdate.patch.generationParams.dreaminaModelByRouteMode['dreamina:frames2video'],
        'dreamina/3.5pro',
      ));
  }),
  test('Dreamina task model version switch restores target model params', () => {
    const dreaminaModelSelectionParamPatch4 = buildDreaminaModelSelectionParamPatch(
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
    (assert.equal(dreaminaModelSelectionParamPatch4.dreaminaRouteMode, 'frames2video'),
      assert.equal(dreaminaModelSelectionParamPatch4.generationParams.dreaminaRouteMode, 'frames2video'),
      assert.equal(dreaminaModelSelectionParamPatch4.generationParams.aspectRatio, '9:16'),
      assert.equal(dreaminaModelSelectionParamPatch4.generationParams.duration, 12),
      assert.equal(
        dreaminaModelSelectionParamPatch4.dreaminaModelByRouteMode['dreamina:frames2video'],
        'dreamina/seedance2.0',
      ));
  }),
  test('Dreamina and APIMart provider entry switch keeps remembered route model', () => {
    const aspectRatio = {
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
      model3 = resolveDreaminaRememberedRouteModel(aspectRatio, {
        provider: 'dreamina',
        routeMode: 'multimodal2video',
        taskType: 'multimodal2video',
        fallbackModel: 'dreamina/seedance2.0fast',
      });
    assert.equal(model3, 'dreamina/seedance2.0');
    const aspectRatio2 = buildDreaminaModelSelectionParamPatch(aspectRatio, {
      model: model3,
      provider: 'dreamina',
      taskType: 'multimodal2video',
      fallbackValues: {
        dreaminaRouteMode: 'multimodal2video',
        aspectRatio: aspectRatio.generationParams.aspectRatio,
        resolution: aspectRatio.generationParams.resolution,
        duration: aspectRatio.generationParams.duration,
      },
    });
    (assert.equal(aspectRatio2.generationParams.aspectRatio, '9:16'),
      assert.equal(aspectRatio2.generationParams.duration, 12),
      assert.equal(
        aspectRatio2.generationParamsByModel['apimart/doubao-seedance-1-5-pro'].aspectRatio,
        '16:9',
      ));
    const model4 = resolveDreaminaRememberedRouteModel(
      { ...aspectRatio, model: model3, provider: 'dreamina', ...aspectRatio2 },
      {
        provider: 'apimart',
        routeMode: 'multimodal2video',
        taskType: 'multimodal2video',
        fallbackModel: 'apimart/doubao-seedance-2.0-fast',
      },
    );
    assert.equal(model4, 'apimart/doubao-seedance-1-5-pro');
    const dreaminaModelSelectionParamPatch5 = buildDreaminaModelSelectionParamPatch(
      { ...aspectRatio, model: model3, provider: 'dreamina', ...aspectRatio2 },
      {
        model: model4,
        provider: 'apimart',
        taskType: 'multimodal2video',
        fallbackValues: {
          dreaminaRouteMode: 'multimodal2video',
          aspectRatio: aspectRatio2.generationParams.aspectRatio,
          resolution: aspectRatio2.generationParams.resolution,
          duration: aspectRatio2.generationParams.duration,
        },
      },
    );
    (assert.equal(dreaminaModelSelectionParamPatch5.generationParams.aspectRatio, '16:9'),
      assert.equal(dreaminaModelSelectionParamPatch5.generationParams.duration, 6),
      assert.equal(
        resolveDreaminaRememberedRouteModel(aspectRatio, {
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
      ));
  }),
  test('APIMart target params do not overwrite remembered Dreamina route model', () => {
    const args2 = buildDreaminaModelSelectionParamPatch(
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
    (assert.equal(args2.dreaminaModelByRouteMode['dreamina:multimodal2video'], 'dreamina/seedance2.0'),
      assert.equal(
        args2.generationParams.dreaminaModelByRouteMode['dreamina:multimodal2video'],
        'dreamina/seedance2.0',
      ),
      assert.equal(
        resolveDreaminaRememberedRouteModel(
          {
            model: 'apimart/doubao-seedance-2.0-fast',
            provider: 'apimart',
            dreaminaRouteMode: 'multimodal2video',
            ...args2,
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
    const model = 'runninghub/2041741496667348994';
    const normal = renderModelUiSchemaControls(
      model,
      { generationParams: { rhInstanceType: 'default' } },
      { placement: 'instance' },
    );
    const plus = renderModelUiSchemaControls(
      model,
      { generationParams: { rhInstanceType: 'plus' } },
      { placement: 'instance' },
    );
    assert.match(normal, /rhInstanceType/);
    assert.match(plus, /rhInstanceType/);
    assert.notEqual(normal, plus);
    assert.match(plus, /Plus|PLUS|plus/);
  }),
  test('video prompt placeholder can come from model manifest', () => {
    assert.match(
      getModelManifest('apimart/minimax-hailuo')?.prompt?.placeholder || '',
      /\[推进\]一只猫咪在花园中奔跑/,
    );
    const modelManifest3 = getModelManifest('apimart/veo3-fast');
    (assert.match(
      resolveVideoPromptPlaceholder(modelManifest3, { generationParams: { generation_type: 'frame' } }),
      /首帧到尾帧/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest3, { generationParams: { generation_type: 'reference' } }),
        /参考图主体/,
      ));
    const modelManifest4 = getModelManifest('apimart/happyhorse-1.0');
    (assert.match(
      resolveVideoPromptPlaceholder(modelManifest4, { generationParams: { happyhorse_mode: 'auto' } }),
      /夕阳下的海边公路/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest4, { generationParams: { happyhorse_mode: 'image' } }),
        /首帧图要如何动起来/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest4, { generationParams: { happyhorse_mode: 'reference' } }),
        /@图片1 中的主角/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest4, { generationParams: { happyhorse_mode: 'edit' } }),
        /改写源视频/,
      ));
    const modelManifest5 = getModelManifest('apimart/wan2.7');
    (assert.match(
      resolveVideoPromptPlaceholder(modelManifest5, { generationParams: { wan27_mode: 'image' } }),
      /首帧\/尾帧/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest5, { generationParams: { wan27_mode: 'video' } }),
        /如何续写/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest5, { generationParams: { wan27_mode: 'reference' } }),
        /@图片1、@图片2、@视频1/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest5, { generationParams: { wan27_mode: 'edit' } }),
        /原视频做什么编辑/,
      ),
      assert.match(resolveVideoPromptPlaceholder(getModelManifest('apimart/kling-v3')), /@图片1 到 @图片2/));
    const modelManifest6 = getModelManifest('apimart/kling-v3-omni');
    (assert.match(
      resolveVideoPromptPlaceholder(modelManifest6, { generationParams: { kling_v3_omni_mode: 'image' } }),
      /@图片1 \/ @图片2/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest6, {
          generationParams: { kling_v3_omni_mode: 'reference' },
        }),
        /@图片1、@视频1/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest6, { generationParams: { kling_v3_omni_mode: 'edit' } }),
        /编辑原视频/,
      ),
      assert.match(
        resolveVideoPromptPlaceholder(getModelManifest('apimart/kling-video-o1')),
        /@图片1 中的人物/,
      ));
    const modelManifest7 = getModelManifest('apimart/viduq3');
    (assert.match(
      resolveVideoPromptPlaceholder(modelManifest7, {
        generationParams: { vidu_q3_generation_mode: 'video' },
      }),
      /@图片1 \+ @图片2/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest7, {
          generationParams: { vidu_q3_generation_mode: 'reference' },
        }),
        /@图片1、@图片2/,
      ));
  }),
  test('video prompt input visibility can come from model manifest', () => {
    const modelManifest8 = getModelManifest('runninghub/2060613773890768898');
    (assert.equal(modelManifest8?.prompt?.visible, false),
      assert.equal(shouldShowVideoPromptInput(modelManifest8), false),
      assert.equal(shouldShowVideoPromptInput(getModelManifest('apimart/kling-v3')), true));
  }),
  test('Agnes Video prompt help uses ordinary-language manifest tips', () => {
    const modelManifest9 = getModelManifest('agnes/agnes-video-v2.0');
    (assert.match(
      resolveVideoPromptPlaceholder(modelManifest9, { generationParams: { agnes_video_mode: 'reference' } }),
      /图片里的主体怎么动/,
    ),
      assert.match(
        resolveVideoPromptPlaceholder(modelManifest9, {
          generationParams: { agnes_video_mode: 'keyframes' },
        }),
        /首帧画面怎么动/,
      ));
    const generationNodeHelpTooltip = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'agnes/agnes-video-v2.0',
      nodeData: { generationParams: { agnes_video_mode: 'reference' } },
    });
    (assert.match(generationNodeHelpTooltip, /不上传图片/),
      assert.match(generationNodeHelpTooltip, /上传多张图/),
      assert.doesNotMatch(generationNodeHelpTooltip, /extra_body|keyframes|num_frames/));
    const generationNodeHelpTooltip2 = getGenerationNodeHelpTooltip({
      kind: 'video',
      key: 'agnes/agnes-video-v2.0',
      nodeData: { generationParams: { agnes_video_mode: 'keyframes' } },
    });
    (assert.match(generationNodeHelpTooltip2, /首尾帧用法/),
      assert.match(generationNodeHelpTooltip2, /至少上传首帧图/),
      assert.match(generationNodeHelpTooltip2, /人物保持同一个人/),
      assert.doesNotMatch(generationNodeHelpTooltip2, /extra_body|keyframes|num_frames/));
  }),
  test('video node: subtract subject toggle refreshes refs without rebuilding footer', () => {
    const patches = [true, false].map((value) =>
      buildUiSchemaParamPatch(
        {
          model: 'runninghub/2041741496667348994',
          provider: 'runninghubwf',
          generationParams: { rhSubtractSubject: !value },
        },
        'rhSubtractSubject',
        value,
      ),
    );
    assert.equal(patches[0].generationParams.rhSubtractSubject, true);
    assert.equal(patches[1].generationParams.rhSubtractSubject, false);
    for (const patch of patches) assert.equal(Object.hasOwn(patch, 'model'), false);
  }),
  test('video parameter footer: uses compact pipe separators instead of down chevrons', () => {
    (assertCssContract(
      nodeTypesCss,
      /\.video-node \.prompt-panel-footer \.img-model-pills > :not\(:first-child\)::before/,
    ),
      assertCssContract(nodeTypesCss, /content:\s*"\|"/),
      assertCssContract(nodeTypesCss, /padding-left:\s*18px/),
      assertCssContract(nodeTypesCss, /position:\s*absolute/),
      assertCssContract(nodeTypesCss, /left:\s*5px/),
      assertCssContract(nodeTypesCss, /text-overflow:\s*ellipsis/),
      assertCssContract(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.ui-schema-quality-ratio-label,[\s\S]*?\.video-node \.prompt-panel-footer \.ui-schema-section-pair-label\{width:max-content;min-width:max-content;\}/,
      ));
  }),
  test('Dreamina duration schema popup keeps floating-menu layout semantics', () => {
    (assertCssSelectorGroup(nodeTypesCss, [
      '.ui-schema-pill-menu',
      '.ui-schema-section-menu',
      '.ui-schema-section-pair-pill',
      '.ui-schema-resolution-pill',
      '.ui-schema-duration-pill',
    ]),
      assertCssContract(nodeTypesCss, /\.ui-schema-duration-pop\.show\{display:flex;\}/),
      assertCssSelectorGroup(
        nodeTypesCss,
        ['.video-node .prompt-panel-footer .vid-duration-pop', '.ui-schema-duration-pop'],
        /padding:\s*12px;\s*width:\s*150px;\s*box-sizing:\s*border-box;\s*flex-direction:\s*column;\s*gap:\s*10px;/,
      ),
      assertCssSelectorGroup(
        nodeTypesCss,
        [
          '.video-node .prompt-panel-footer .vid-duration-slider',
          '.ui-schema-range.ui-schema-duration-slider',
        ],
        /width:\s*100%;\s*max-width:\s*100%;\s*min-width:\s*0;\s*accent-color:\s*var\(--blue\);\s*cursor:\s*var\(--link-cursor\);/,
      ));
  }),
  test('video schema parameter menus keep video footer typography', () => {
    (assertCssContract(nodeTypesCss, /\.floating-menu-item \{[\s\S]*?font-size:\s*13px;/),
      assertCssContract(
        nodeTypesCss,
        /\.video-node \.prompt-panel-footer \.ui-schema-pill-menu \.ui-schema-floating-menu \.floating-menu-item\{padding:6px 12px;border-radius:8px;\}/,
      ),
      assertCssContract(nodeTypesCss, /\.ui-schema-section-pair-label/));
  }),
  test('generation node help tooltip supports manifest markdown tables', () => {
    (assertCssContract(
      nodeTypesCss,
      /\.generation-node-help-tooltip-portal\.has-table\{[^}]*width:760px;[^}]*overflow:auto;/,
    ),
      assertCssContract(
        nodeTypesCss,
        /\.generation-node-help-tooltip-portal\.has-table\{[^}]*pointer-events:auto;/,
        true,
      ),
      assertCssContract(
        nodeTypesCss,
        /\.generation-node-help-tooltip-portal\.has-table\.is-open\{pointer-events:auto;\}/,
      ),
      assertCssSelectorGroup(
        nodeTypesCss,
        ['.generation-node-help-table th', '.generation-node-help-table td'],
        /border:\s*1px solid var\(--white-15\)/,
      ));
  }),
  test('RunningHub video advanced panel remains a dropdown below the footer', () => {
    (assertCssContract(nodeTypesCss, /\.rh-vram-adv-panel\s*\{[^}]*top:\s*calc\(100% \+ 8px\)/),
      assertCssContract(nodeTypesCss, /\.rh-vram-adv-panel\s*\{[^}]*bottom:\s*calc\(100% \+ 8px\)/, true));
  }),
  test('RunningHub V5.4 advanced panel keeps old layout and reopens after close', () => {
    assertCssContract(
      nodeTypesCss,
      /\.rh-vram-adv-panel > \.ui-schema-renderer\{[^}]*align-items:stretch;[^}]*width:100%;/,
    );
    const map2 = new Set(['rh-vram-adv-panel', 'show']),
      el4 = {
        style: { display: 'flex' },
        classList: {
          contains(value4) {
            return map2.has(value4);
          },
          remove(value5) {
            map2.delete(value5);
          },
        },
      };
    (closeNodeFooterMenus({
      querySelectorAll(list7) {
        return list7.includes('rh-vram-adv-panel') ? [el4] : [];
      },
    }),
      assert.equal(map2.has('show'), false),
      assert.equal(el4.style.display, ''));
  }),
  test('RunningHub V5.4 advanced settings render from uiSchema with existing classes', () => {
    const model5 = 'runninghub/2041741496667348994';
    (assert.equal(hasModelUiSchema(model5, { placement: 'videoAdvanced' }), true),
      assert.equal(hasModelUiSchema(model5, { placement: 'v54Advanced' }), false));
    const renderModelUiSchemaControls48 = renderModelUiSchemaControls(
      model5,
      {
        model: model5,
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
    (assert.match(renderModelUiSchemaControls48, /data-ui-schema-placement="videoadvanced"/),
      assert.match(renderModelUiSchemaControls48, /data-ui-schema-field="rhSingleControlPreset"/),
      assert.match(renderModelUiSchemaControls48, /rh-vram-adv-row/),
      assert.match(renderModelUiSchemaControls48, /rh-adv-control-line/),
      assert.match(renderModelUiSchemaControls48, /rh-adv-seg-btn/),
      assert.match(renderModelUiSchemaControls48, /data-key="rhSingleControlPreset"/),
      assert.match(
        renderModelUiSchemaControls48,
        /rh-adv-seg-btn active" data-key="rhSingleControlPreset" data-value="stable"/,
      ),
      assert.match(renderModelUiSchemaControls48, /rh-stepper-value/),
      assert.match(renderModelUiSchemaControls48, /aria-valuenow="18"/),
      assert.match(renderModelUiSchemaControls48, /rh-breast-jiggle-slider/),
      assert.match(renderModelUiSchemaControls48, /value="0.35"/),
      assert.match(renderModelUiSchemaControls48, /is-rh-disabled/));
  }),
  test('RunningHub V5.4 default special mode stays unselected when choosing single control', () => {
    const model6 = 'runninghub/2041741496667348994',
      generationParams2 = buildModelUiSchemaDefaultParams(model6);
    (assert.equal(generationParams2.rhSpecialMode, 'none'),
      assert.equal(
        buildVideoWorkflowDisplayParamsPatch(model6, generationParams2, { v54FpsOptions: [16, 24, 30] })
          .rhSpecialMode,
        null,
      ));
    const generationParams3 = buildUiSchemaParamPatch(
      { model: model6, generationParams: generationParams2 },
      'rhSingleControlPreset',
      'stable',
    );
    (assert.equal(generationParams3.generationParams.rhSingleControlPreset, 'stable'),
      assert.equal(generationParams3.generationParams.rhSpecialMode, 'none'));
    const renderModelUiSchemaControls49 = renderModelUiSchemaControls(
      model6,
      { model: model6, generationParams: generationParams3.generationParams },
      { placement: 'videoAdvanced' },
    );
    (assert.match(renderModelUiSchemaControls49, /data-ui-schema-field="rhSpecialMode"/),
      assert.doesNotMatch(renderModelUiSchemaControls49, /data-value="none"/),
      assert.doesNotMatch(
        renderModelUiSchemaControls49,
        /rh-adv-seg-btn active" data-key="rhSpecialMode" data-value="longVideoOverlay"/,
      ),
      assert.doesNotMatch(
        renderModelUiSchemaControls49,
        /rh-adv-seg-btn active" data-key="rhSpecialMode" data-value="cameraMove"/,
      ));
  }),
  test('RunningHub Basic advanced settings render from videoAdvanced uiSchema', () => {
    const model7 = 'runninghub/1971148165531475969';
    assert.equal(hasModelUiSchema(model7, { placement: 'videoAdvanced' }), true);
    const renderModelUiSchemaControls50 = renderModelUiSchemaControls(
      model7,
      { model: model7, generationParams: { rhEnableMask: true } },
      { placement: 'videoAdvanced' },
    );
    (assert.match(renderModelUiSchemaControls50, /data-ui-schema-placement="videoadvanced"/),
      assert.match(renderModelUiSchemaControls50, /data-ui-schema-field="rhEnableMask"/),
      assert.match(renderModelUiSchemaControls50, /data-ui-schema-value-type="boolean"/),
      assert.match(
        renderModelUiSchemaControls50,
        /rh-adv-seg-btn active[^"]*" data-key="rhEnableMask"[^>]*data-ui-schema-value="true"/,
      ),
      assert.doesNotMatch(renderModelUiSchemaControls50, /ui-schema-toggle-group/));
  }),
  test('RunningHub Scail V1 advanced settings render from videoAdvanced uiSchema', () => {
    const model8 = 'runninghub/2064961300823896065';
    assert.equal(hasModelUiSchema(model8, { placement: 'videoAdvanced' }), true);
    const renderModelUiSchemaControls51 = renderModelUiSchemaControls(
      model8,
      {
        model: model8,
        generationParams: {
          rhScail2PersonCount: 3,
          rhScailDetectPrompt: 'person, face',
          rhScail2ReplaceSubject: true,
        },
      },
      { placement: 'videoAdvanced' },
    );
    (assert.match(renderModelUiSchemaControls51, /data-ui-schema-placement="videoadvanced"/),
      assert.match(renderModelUiSchemaControls51, /data-ui-schema-field="rhScail2PersonCount"/),
      assert.match(renderModelUiSchemaControls51, /rh-stepper-value/),
      assert.match(renderModelUiSchemaControls51, /aria-valuenow="3"/),
      assert.match(renderModelUiSchemaControls51, /识别人数不准时再调整/),
      assert.match(renderModelUiSchemaControls51, /data-ui-schema-field="rhScailDetectPrompt"/),
      assert.match(renderModelUiSchemaControls51, /data-ui-schema-type="textarea"/),
      assert.match(renderModelUiSchemaControls51, /默认是 person，如无特殊要求请别进行修改/),
      assert.match(
        renderModelUiSchemaControls51,
        /<textarea class="ui-schema-textarea" data-ui-schema-input="rhScailDetectPrompt">person, face<\/textarea>/,
      ));
    const uiSchemaParamPatch4 = buildUiSchemaParamPatch(
      { model: model8, generationParams: { rhScailDetectPrompt: 'person' } },
      'rhScailDetectPrompt',
      '',
    );
    (assert.equal(uiSchemaParamPatch4.generationParams.rhScailDetectPrompt, ''),
      assert.equal(uiSchemaParamPatch4.generationParamsByModel[model8].rhScailDetectPrompt, ''));
    const el5 = { value: 'person' };
    (syncModelUiSchemaControls(
      {
        querySelectorAll(value6) {
          if (value6 === '[data-ui-schema-field]')
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
                querySelector(value7) {
                  if (value7 === '[data-ui-schema-input]') return el5;
                  return null;
                },
              },
            ];
          return [];
        },
      },
      { generationParams: { rhScailDetectPrompt: '' } },
    ),
      assert.equal(el5.value, ''),
      assert.match(renderModelUiSchemaControls51, /data-ui-schema-field="rhScail2ReplaceSubject"/),
      assert.match(renderModelUiSchemaControls51, /不需要换主体时保持否/),
      assert.match(renderModelUiSchemaControls51, /data-ui-schema-value-type="boolean"/),
      assert.match(
        renderModelUiSchemaControls51,
        /rh-adv-seg-btn active[^"]*" data-key="rhScail2ReplaceSubject"[^>]*data-ui-schema-value="true"/,
      ));
    const renderModelUiSchemaControls52 = renderModelUiSchemaControls(
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
    (assert.match(renderModelUiSchemaControls52, /data-ui-schema-field="rhScailDetectPrompt"/),
      assert.match(renderModelUiSchemaControls52, /默认是 person，如无特殊要求请别进行修改/),
      assert.match(renderModelUiSchemaControls52, /data-ui-schema-field="rhScailV2EnhancedMotionControl"/),
      assert.match(renderModelUiSchemaControls52, /动作不稳定或跟随不足时再开启/));
  }),
  test('RunningHub 视频去字幕V2 advanced settings render from existing uiSchema rows', () => {
    const model9 = 'runninghub/2060613773890768898';
    assert.equal(hasModelUiSchema(model9, { placement: 'videoAdvanced' }), true);
    const renderModelUiSchemaControls53 = renderModelUiSchemaControls(
      model9,
      { model: model9, generationParams: { rhWatermarkRemoveMode: 'mode2', rhRemoveWatermark: true } },
      { placement: 'videoAdvanced' },
    );
    (assert.match(renderModelUiSchemaControls53, /data-ui-schema-placement="videoadvanced"/),
      assert.match(renderModelUiSchemaControls53, /data-ui-schema-field="rhWatermarkRemoveMode"/),
      assert.match(renderModelUiSchemaControls53, /模式选择/),
      assert.match(renderModelUiSchemaControls53, /模式1[\s\S]*动态水印[\s\S]*模式2/),
      assert.match(renderModelUiSchemaControls53, /遮罩参考只有在模式2时才能使用/),
      assert.match(
        renderModelUiSchemaControls53,
        /rh-adv-seg-btn active[^"]*" data-key="rhWatermarkRemoveMode"[^>]*data-ui-schema-value="mode2"/,
      ),
      assert.match(renderModelUiSchemaControls53, /data-ui-schema-field="rhRemoveWatermark"/),
      assert.match(renderModelUiSchemaControls53, /data-ui-schema-value-type="boolean"/),
      assert.match(
        renderModelUiSchemaControls53,
        /rh-adv-seg-btn active[^"]*" data-key="rhRemoveWatermark"[^>]*data-ui-schema-value="true"/,
      ));
  }),
  test('uiSchema text inputs debounce live commits and flush the latest value', async () => {
    const map3 = new Map();
    let value8 = { generationParams: { rhScailDetectPrompt: 'person' } };
    const list8 = [],
      value9 = {
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
        querySelector(value10) {
          if (value10 === '[data-ui-schema-input]') return target2;
          return null;
        },
      },
      target2 = {
        tagName: 'TEXTAREA',
        type: '',
        value: 'person',
        dataset: { uiSchemaInput: 'rhScailDetectPrompt' },
        closest(value11) {
          if (value11 === '[data-ui-schema-input]') return target2;
          if (value11 === '.ui-schema-field' || value11 === '[data-ui-schema-field]') return value9;
          return null;
        },
      },
      value12 = {
        addEventListener(value13, value14) {
          map3.set(value13, value14);
        },
        removeEventListener(value15, value16) {
          if (map3.get(value15) === value16) map3.delete(value15);
        },
        querySelectorAll(value17) {
          if (value17 === '[data-ui-schema-field]') return [value9];
          return [];
        },
      },
      handler = bindUiSchemaFieldControls(value12, {
        getNodeData: () => value8,
        commitFieldValue: (fieldId, value18, args3) => {
          return (
            list8.push({ fieldId: fieldId, value: value18 }),
            (value8 = {
              ...args3,
              generationParams: { ...(args3.generationParams || {}), [fieldId]: value18 },
            }),
            value8
          );
        },
      });
    ((target2.value = 'p'),
      map3.get('input')?.({ type: 'input', target: target2 }),
      (target2.value = 'pe'),
      map3.get('input')?.({ type: 'input', target: target2 }),
      (target2.value = 'per'),
      map3.get('input')?.({ type: 'input', target: target2 }),
      assert.equal(list8.length, 0),
      await new Promise((value19) => setTimeout(value19, 230)),
      assert.deepEqual(list8, [{ fieldId: 'rhScailDetectPrompt', value: 'per' }]),
      (target2.value = ''),
      map3.get('input')?.({ type: 'input', target: target2 }),
      map3.get('change')?.({ type: 'change', target: target2 }),
      assert.equal(list8.at(-1)?.value, ''),
      handler());
  }),
  test('RunningHub commercial digital human advanced settings render motion amplitude', () => {
    const model10 = 'runninghub/2055639633148563458';
    assert.equal(hasModelUiSchema(model10, { placement: 'videoAdvanced' }), true);
    const list9 = renderModelUiSchemaControls(
      model10,
      {
        model: model10,
        generationParams: { rhDigitalHumanMotionAmplitude: '1', rhDigitalHumanSceneMotionAmplitude: '1' },
      },
      { placement: 'videoAdvanced' },
    );
    (assert.match(list9, /data-ui-schema-placement="videoadvanced"/),
      assert.match(list9, /data-ui-schema-field="rhDigitalHumanMotionAmplitude"/),
      assert.match(list9, /数字人动作幅度/),
      assert.match(list9, /data-ui-schema-value="0"[^>]*>普通/),
      assert.match(list9, /data-ui-schema-value="1"[^>]*>较大/),
      assert.match(list9, /data-ui-schema-value="2"[^>]*>强烈/),
      assert.match(list9, /10秒以内动作幅度参数效果更明显/),
      assert.match(list9, /超过10秒后效果会明显减弱/),
      assert.match(
        list9,
        /rh-adv-seg-btn active[^"]*" data-key="rhDigitalHumanMotionAmplitude"[^>]*data-ui-schema-value="1"/,
      ),
      assert.match(list9, /data-ui-schema-field="rhDigitalHumanSceneMotionAmplitude"/),
      assert.match(list9, /画面运动幅度/));
    const value20 = list9.slice(list9.indexOf('data-ui-schema-field="rhDigitalHumanSceneMotionAmplitude"'));
    (assert.match(
      value20,
      /rh-adv-seg-btn active[^"]*" data-key="rhDigitalHumanSceneMotionAmplitude"[^>]*data-ui-schema-value="1"/,
    ),
      assert.doesNotMatch(value20, /data-ui-schema-value="2"[^>]*>强烈/));
  }),
  test('RunningHub video normal params render from videoParams uiSchema', () => {
    const model11 = 'runninghub/2041741496667348994',
      model12 = 'runninghub/2060613773890768898',
      value21 = 'runninghub/1971148165531475969',
      model13 = 'runninghub/2039336644536442882',
      model14 = 'runninghub/2054101324521844738',
      model15 = 'runninghub/2062515720147259393',
      model16 = 'runninghub/2064961300823896065';
    (assert.equal(hasModelUiSchema(model11, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(model12, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(value21, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(model13, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(model14, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(model15, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(model16, { placement: 'videoParams' }), true),
      assert.equal(hasModelUiSchema(model15, { placement: 'resolution' }), false));
    const renderModelUiSchemaControls54 = renderModelUiSchemaControls(
      model11,
      {
        model: model11,
        generationParams: { rhVideoResolution: 0x400, rhVideoFps: 24, rhVideoFrames: 0 },
        rhVideoSourceFrameCount: 123,
      },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24, 30] },
    );
    (assert.match(renderModelUiSchemaControls54, /class="img-ratio-wrap ui-schema-rh-video-params"/),
      assert.match(renderModelUiSchemaControls54, /class="img-pill-btn img-ratio-btn"/),
      assert.match(renderModelUiSchemaControls54, /class="img-ratio-icon-slot"/),
      assert.match(renderModelUiSchemaControls54, />帧数全长·帧率24·分辨率1024</),
      assert.match(renderModelUiSchemaControls54, /data-ui-schema-field="rhVideoResolution"/),
      assert.match(renderModelUiSchemaControls54, /img-rp-quality-segmented rh-video-resolution-seg/),
      assert.match(
        renderModelUiSchemaControls54,
        /rh-v5-res-btn ui-schema-option" data-value="1024" data-ui-schema-value="1024"/,
      ),
      assert.match(
        renderModelUiSchemaControls54,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      assert.match(renderModelUiSchemaControls54, /rh-v5-source-framecount" aria-label="源视频总帧数">123</),
      assert.match(renderModelUiSchemaControls54, /rh-stepper rh-v5-frames-stepper/));
    const renderModelUiSchemaControls55 = renderModelUiSchemaControls(
      model16,
      {
        model: model16,
        generationParams: { rhVideoResolution: 0x340, rhVideoFps: 24, rhVideoFrames: 0x12c },
        rhVideoSourceFrameCount: 0x1c8,
      },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24, 30] },
    );
    (assert.match(renderModelUiSchemaControls55, /class="img-ratio-wrap ui-schema-rh-video-params"/),
      assert.match(renderModelUiSchemaControls55, /data-ui-schema-composite-field="rhVideoParams"/),
      assert.match(renderModelUiSchemaControls55, /data-ui-schema-field="rhVideoResolution"/),
      assert.match(renderModelUiSchemaControls55, /data-ui-schema-field="rhVideoFps"/),
      assert.match(renderModelUiSchemaControls55, /data-ui-schema-field="rhVideoFrames"/),
      assert.match(renderModelUiSchemaControls55, /data-value="832" data-ui-schema-value="832"/),
      assert.match(
        renderModelUiSchemaControls55,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      assert.match(renderModelUiSchemaControls55, /rh-v5-source-framecount"[^>]*>456</),
      assert.match(renderModelUiSchemaControls55, /aria-valuenow="300" tabindex="0">300</),
      assert.match(renderModelUiSchemaControls54, /aria-valuenow="0" tabindex="0">全长</));
    const renderModelUiSchemaControls56 = renderModelUiSchemaControls(
      model12,
      {
        model: model12,
        generationParams: { rhVideoResolution: 0x3c0, rhVideoFps: 24, rhVideoFrames: 0 },
        rhVideoSourceFrameCount: 0x141,
      },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24, 30] },
    );
    (assert.match(renderModelUiSchemaControls56, />帧数全长·帧率24·分辨率960</),
      assert.match(
        renderModelUiSchemaControls56,
        /img-rp-quality-item active rh-v5-res-btn ui-schema-option" data-value="960" data-ui-schema-value="960"/,
      ),
      assert.match(
        renderModelUiSchemaControls56,
        /rh-v5-fps-btn active ui-schema-option" data-value="24" data-ui-schema-value="24"/,
      ),
      assert.match(renderModelUiSchemaControls56, /rh-v5-source-framecount" aria-label="源视频总帧数">321</),
      assert.match(renderModelUiSchemaControls56, /aria-valuenow="0" tabindex="0">全长</),
      assert.match(
        renderModelUiSchemaControls56,
        /img-rp-quality-item  rh-v5-res-btn ui-schema-option" data-value="1600" data-ui-schema-value="1600"/,
      ),
      assert.match(
        renderModelUiSchemaControls56,
        /img-rp-quality-item  rh-v5-res-btn ui-schema-option" data-value="1920" data-ui-schema-value="1920"/,
      ),
      assert.doesNotMatch(renderModelUiSchemaControls56, /dev-mode-only[^>]+data-value="(?:1600|1920)"/));
    const renderModelUiSchemaControls57 = renderModelUiSchemaControls(
      model13,
      { model: model13, generationParams: { rhVideoResolution: 0x500, rhVideoFps: 16, rhVideoSeconds: 6 } },
      { placement: 'videoParams', unwrap: true, rhVideoFpsOptions: [16, 24] },
    );
    (assert.match(renderModelUiSchemaControls57, />秒数6·帧率16·分辨率1280</),
      assert.match(renderModelUiSchemaControls57, /rh-ltx-res-btn ui-schema-option" data-value="1280"/),
      assert.match(renderModelUiSchemaControls57, /rh-ltx-fps-btn active ui-schema-option" data-value="16"/),
      assert.match(renderModelUiSchemaControls57, /rh-stepper rh-ltx-seconds-stepper/),
      assert.match(renderModelUiSchemaControls57, /aria-valuenow="6" tabindex="0">6</));
    const renderModelUiSchemaControls58 = renderModelUiSchemaControls(
      model14,
      {
        model: model14,
        generationParams: { rhVideoResolution: 0x400, rhVideoFrames: 77 },
        rhVideoSourceFrameCount: 88,
      },
      { placement: 'videoParams', unwrap: true },
    );
    (assert.match(renderModelUiSchemaControls58, />帧数77·分辨率1024</),
      assert.doesNotMatch(renderModelUiSchemaControls58, /帧率24·分辨率/),
      assert.match(renderModelUiSchemaControls58, /rh-v5-source-framecount" aria-label="源视频总帧数">88</));
    const list10 = renderModelUiSchemaControls(
      model15,
      {
        model: model15,
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
    (assert.match(list10, /data-ui-schema-field="rhBerniniFunction"/),
      assert.match(list10, /ui-schema-pill-menu/));
    const value22 = list10.slice(0, list10.indexOf('<div class="img-ratio-wrap'));
    (assert.match(value22, /ui-schema-floating-menu-title">功能选择</),
      assert.match(value22, /ui-schema-info-tip/),
      assert.match(value22, /data-tooltip="[^"]*vi2v视频指令到视频/),
      assert.match(value22, /data-tooltip="[^"]*vrc2v视频区域控制到视频/),
      assert.doesNotMatch(value22, /data-tooltip="[^"]*i2v图片生视频/),
      assert.doesNotMatch(value22, /data-tooltip="[^"]*v2v视频到视频/),
      assert.match(value22, /data-ui-schema-value="vi2v"/),
      assert.match(value22, /data-ui-schema-value="rv2v"/),
      assert.match(value22, /data-ui-schema-value="vrc2v"/),
      assert.match(value22, /rv2v参考视频到视频/),
      assert.doesNotMatch(value22, /data-ui-schema-value="i2v"/),
      assert.doesNotMatch(value22, /data-ui-schema-value="r2v"/),
      assert.doesNotMatch(value22, /data-ui-schema-value="v2v"/),
      assert.doesNotMatch(value22, /data-ui-schema-value="mv2v"/),
      assert.doesNotMatch(value22, /data-ui-schema-value="ads2v"/));
    const list11 = renderModelUiSchemaControls(
        model15,
        {
          model: model15,
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
      value23 = list11.slice(0, list11.indexOf('<div class="img-ratio-wrap'));
    (assert.match(value23, /data-ui-schema-value="i2v"/),
      assert.match(value23, /data-ui-schema-value="r2v"/),
      assert.match(value23, /data-tooltip="[^"]*i2v图片生视频/),
      assert.match(value23, /data-tooltip="[^"]*r2v参考主体到视频/),
      assert.doesNotMatch(value23, /data-tooltip="[^"]*v2v视频到视频/),
      assert.doesNotMatch(value23, /data-ui-schema-value="v2v"/),
      assert.doesNotMatch(value23, /data-ui-schema-value="mv2v"/),
      assert.doesNotMatch(value23, /data-ui-schema-value="vi2v"/),
      assert.doesNotMatch(value23, /data-ui-schema-value="rv2v"/),
      assert.doesNotMatch(value23, /data-ui-schema-value="vrc2v"/));
    const list12 = renderModelUiSchemaControls(
        model15,
        {
          model: model15,
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
      value24 = list12.slice(0, list12.indexOf('<div class="img-ratio-wrap'));
    (assert.match(value24, /data-ui-schema-value="v2v"/),
      assert.match(value24, /data-ui-schema-value="mv2v"/),
      assert.doesNotMatch(value24, /data-ui-schema-value="i2v"/),
      assert.doesNotMatch(value24, /data-ui-schema-value="r2v"/),
      assert.doesNotMatch(value24, /data-ui-schema-value="vi2v"/));
    const list13 = renderModelUiSchemaControls(
        model15,
        {
          model: model15,
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
      value25 = list13.slice(0, list13.indexOf('<div class="img-ratio-wrap'));
    (assert.doesNotMatch(value25, /data-ui-schema-field="rhBerniniFunction"/),
      assert.doesNotMatch(value25, /data-ui-schema-value="ads2v"/),
      assert.doesNotMatch(value25, /data-ui-schema-value="i2v"/),
      assert.doesNotMatch(value25, /data-ui-schema-value="rv2v"/),
      assert.match(list10, /data-ui-schema-composite-field="rhVideoParams"/),
      assert.match(list10, />帧数121·帧率24·分辨率832</),
      assert.match(list10, /data-ui-schema-field="rhVideoResolution"/),
      assert.match(list10, /data-ui-schema-field="rhVideoFps"/),
      assert.match(list10, /data-ui-schema-field="rhVideoFrames"/),
      assert.match(list10, /data-ui-schema-field="rhBerniniAspectRatio"/),
      assert.match(list10, /data-ui-schema-value="自适应"/),
      assert.doesNotMatch(
        list10,
        /mv2v多维编辑到视频[\s\S]*v2v视频到视频[\s\S]*rv2v参考视频到视频[\s\S]*vrc2v视频区域控制到视频<\/div>\s*<div class="img-ratio-wrap/,
      ));
    const renderModelUiSchemaControls59 = renderModelUiSchemaControls(
      model15,
      { model: model15, generationParams: { rhInstanceType: 'plus' } },
      { placement: 'instance', variant: 'instanceToggle' },
    );
    (assert.match(renderModelUiSchemaControls59, /data-ui-schema-field="rhInstanceType"/),
      assert.match(renderModelUiSchemaControls59, />48G</),
      assertCssContract(
        nodeTypesCss,
        /\.ui-schema-rh-video-params \.rh-video-resolution-seg\{display:grid;grid-template-columns:repeat\(auto-fit,minmax\(56px,1fr\)\);gap:8px;width:100%;\}/,
      ));
  }),
  test('RunningHub video frame stepper accepts arithmetic input expressions', () => {
    const model17 = 'runninghub/2041741496667348994';
    (assert.equal(evaluateUiSchemaNumberExpression('25/5'), 5),
      assert.equal(evaluateUiSchemaNumberExpression('12 + 8 - 3'), 17),
      assert.equal(evaluateUiSchemaNumberExpression('(6 + 4) * 3'), 30),
      assert.equal(evaluateUiSchemaNumberExpression('7.8/2'), 3.9),
      assert.equal(Number.isNaN(evaluateUiSchemaNumberExpression('25/0')), true),
      assert.equal(Number.isNaN(evaluateUiSchemaNumberExpression('25abc')), true));
    const uiSchemaParamPatch5 = buildUiSchemaParamPatch(
      { model: model17, generationParams: { rhVideoFrames: 77 } },
      'rhVideoFrames',
      Math.trunc(evaluateUiSchemaNumberExpression('25/5')),
    );
    assert.equal(uiSchemaParamPatch5.generationParams.rhVideoFrames, 5);
  }),
  test('RunningHub V5.4 fps options include 30 without advanced mode', () => {
    const value26 = 'runninghub/2041741496667348994';
    (assert.deepEqual(getRhV54FpsOptions(), [16, 24, 30]), assert.equal(normalizeRhV54Fps(30), 30));
    const modelManifest10 = getModelManifest(value26)?.uiSchema?.fields?.find(
      (item14) => item14.id === 'rhVideoFps',
    );
    assert.deepEqual(
      (modelManifest10?.options || []).map((el6) => Number(el6.value)),
      [16, 24, 30],
    );
  }),
  test('RunningHub video footer placement checks are manifest driven', () => {
    const value27 = 'runninghub/2041741496667348994',
      value28 = 'runninghub/2060613773890768898',
      value29 = 'runninghub/1971148165531475969',
      value30 = 'runninghub/2039336644536442882',
      value31 = 'runninghub/2054101324521844738',
      value32 = 'runninghub/video_matting',
      value33 = 'runninghub/2055639633148563458',
      value34 = 'runninghub/2064961300823896065';
    (assert.equal(hasRunningHubVideoWorkflowUiPlacement(value27, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value29, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value28, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value33, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value34, 'videoAdvanced'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value34, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value30, 'videoAdvanced'), false),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value30, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value28, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value31, 'videoParams'), true),
      assert.equal(hasRunningHubVideoWorkflowUiPlacement(value32, 'videoParams'), false),
      assert.deepEqual(
        getRunningHubVideoWorkflowFpsOptions(value30, { v54FpsOptions: [16, 24, 30] }),
        [16, 24],
      ),
      assert.deepEqual(
        getRunningHubVideoWorkflowFpsOptions(value29, { v54FpsOptions: [16, 24, 30] }),
        [16, 24, 30],
      ));
  }),
  test('video parameter panel: LTX2.3 uses existing video parameter UI', () => {
    assertCssContract(nodeTypesCss, /ui-schema-video-advanced-panel/, true);
  }),
  test('video workflow model switch: display params come from target generationParams', () => {
    (assert.deepEqual(
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
    const modelManifest11 = getModelManifest('apimart/veo3-fast'),
      value35 = modelManifest11?.uiSchema?.fields?.find((item15) => item15.id === 'aspectRatio');
    assert.equal(value35?.displayRole, 'aspectRatio');
  }),
  test('RunningHub workflow aspect ratio selection updates existing display size patch', () => {
    const modelManifest12 = getModelManifest('runninghub/2062515720147259393'),
      value36 = modelManifest12?.uiSchema?.fields?.find((item16) => item16.id === 'rhBerniniAspectRatio');
    assert.equal(value36?.displayRole, 'aspectRatio');
  }),
  test('video workflow model selection patch preserves current defaults', () => {
    const value37 = 'runninghub/2041741496667348994',
      value38 = 'runninghub/2060613773890768898',
      value39 = 'runninghub/1971148165531475969',
      value40 = 'runninghub/2039336644536442882',
      value41 = 'runninghub/2054101324521844738',
      value42 = 'runninghub/2047787809091620866',
      value43 = 'runninghub/2064961300823896065',
      videoWorkflowModelSelectionPatch = buildVideoWorkflowModelSelectionPatch(
        {
          frameRate: 16,
          frameCount: 88,
          generationParamsByModel: {
            [value37]: {
              rhVideoResolution: 0x400,
              rhVideoFps: 30,
              rhVideoFrames: 88,
              rhSingleControlPreset: 'stable',
              rhMaskExpand: 12,
            },
          },
        },
        value37,
        { preserveMaskTouchedState: true, v54FpsOptions: [16, 24, 30] },
      );
    (assert.equal(videoWorkflowModelSelectionPatch.rhVideoFps, 30),
      assert.equal(videoWorkflowModelSelectionPatch.rhVideoFrames, 88),
      assert.equal(videoWorkflowModelSelectionPatch.rhVideoResolution, 0x400),
      assert.equal(videoWorkflowModelSelectionPatch.rhSingleControlPreset, 'stable'),
      assert.equal(videoWorkflowModelSelectionPatch.rhMaskExpand, 12),
      assert.equal(videoWorkflowModelSelectionPatch.rhMaskExpandTouched, false),
      assert.equal(videoWorkflowModelSelectionPatch.frameRate, 16),
      assert.equal(videoWorkflowModelSelectionPatch.frameCount, 88));
    const videoWorkflowModelSelectionPatch2 = buildVideoWorkflowModelSelectionPatch(
      {
        generationParamsByModel: {
          [value39]: { rhVideoResolution: 0x400, rhVideoFps: 30, rhVideoFrames: 0, rhEnableMask: true },
        },
      },
      value39,
      { v54FpsOptions: [16, 24, 30] },
    );
    (assert.equal(videoWorkflowModelSelectionPatch2.rhVideoFps, 24),
      assert.equal(videoWorkflowModelSelectionPatch2.rhVideoFrames, 0),
      assert.equal(videoWorkflowModelSelectionPatch2.rhVideoResolution, 0x400),
      assert.equal(videoWorkflowModelSelectionPatch2.rhEnableMask, true));
    const videoWorkflowModelSelectionPatch3 = buildVideoWorkflowModelSelectionPatch({}, value38, {
      v54FpsOptions: [16, 24, 30],
    });
    (assert.equal(videoWorkflowModelSelectionPatch3.rhVideoFps, 24),
      assert.equal(videoWorkflowModelSelectionPatch3.rhVideoFrames, 0),
      assert.equal(videoWorkflowModelSelectionPatch3.rhVideoResolution, 0x3c0),
      assert.equal(videoWorkflowModelSelectionPatch3.frameRate, 24),
      assert.equal(videoWorkflowModelSelectionPatch3.frameCount, 0),
      assert.equal(videoWorkflowModelSelectionPatch3.generationParams.rhWatermarkRemoveMode, 'mode1'),
      assert.equal(videoWorkflowModelSelectionPatch3.generationParams.rhRemoveWatermark, false));
    const videoWorkflowModelSelectionPatch4 = buildVideoWorkflowModelSelectionPatch({}, value43, {
      v54FpsOptions: [16, 24, 30],
    });
    (assert.equal(videoWorkflowModelSelectionPatch4.rhVideoFps, 24),
      assert.equal(videoWorkflowModelSelectionPatch4.rhVideoFrames, 0x12c),
      assert.equal(videoWorkflowModelSelectionPatch4.rhVideoResolution, 0x400),
      assert.equal(videoWorkflowModelSelectionPatch4.frameRate, 24),
      assert.equal(videoWorkflowModelSelectionPatch4.frameCount, 0x12c),
      assert.equal(videoWorkflowModelSelectionPatch4.generationParams.rhScail2PersonCount, 2),
      assert.equal(videoWorkflowModelSelectionPatch4.generationParams.rhScailDetectPrompt, 'person'),
      assert.equal(videoWorkflowModelSelectionPatch4.generationParams.rhScail2ReplaceSubject, false));
    const videoWorkflowModelSelectionPatch5 = buildVideoWorkflowModelSelectionPatch(
      { generationParamsByModel: { [value43]: { rhScailDetectPrompt: '' } } },
      value43,
      { v54FpsOptions: [16, 24, 30] },
    );
    assert.equal(videoWorkflowModelSelectionPatch5.generationParams.rhScailDetectPrompt, '');
    const videoWorkflowModelSelectionPatch6 = buildVideoWorkflowModelSelectionPatch(
      {
        rhLtxMode: 'singing_voice',
        generationParamsByModel: {
          [value40]: { rhVideoResolution: 0x500, rhVideoFps: 16, rhVideoSeconds: 6 },
        },
      },
      value40,
    );
    (assert.equal(videoWorkflowModelSelectionPatch6.rhVideoFps, 16),
      assert.equal(videoWorkflowModelSelectionPatch6.rhVideoSeconds, 6),
      assert.equal(videoWorkflowModelSelectionPatch6.rhVideoResolution, 0x500),
      assert.equal(videoWorkflowModelSelectionPatch6.rhLtxMode, 'singing_voice'));
    const videoWorkflowModelSelectionPatch7 = buildVideoWorkflowModelSelectionPatch(
      { generationParamsByModel: { [value41]: { rhVideoResolution: 0x400, rhVideoFrames: 77 } } },
      value41,
    );
    (assert.equal(videoWorkflowModelSelectionPatch7.rhVideoFps, 24),
      assert.equal(videoWorkflowModelSelectionPatch7.rhVideoFrames, 77),
      assert.equal(videoWorkflowModelSelectionPatch7.rhVideoResolution, 0x400));
    const videoWorkflowModelSelectionPatch8 = buildVideoWorkflowModelSelectionPatch({}, value42);
    (assert.equal(Object.hasOwn(videoWorkflowModelSelectionPatch8, 'rhVideoResolution'), false),
      assert.equal(Object.hasOwn(videoWorkflowModelSelectionPatch8, 'rhVideoFps'), false));
  }),
  test('video workflow params: current display fields are saved into model memory', () => {
    const videoWorkflowGenerationParamsPatch = buildVideoWorkflowGenerationParamsPatch(
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
      videoWorkflowGenerationParamsPatch.generationParamsByModel['runninghub/2039336644536442882']
        .rhVideoResolution,
      0x500,
    ),
      assert.equal(
        videoWorkflowGenerationParamsPatch.generationParamsByModel['runninghub/2039336644536442882']
          .rhVideoFps,
        16,
      ),
      assert.equal(
        videoWorkflowGenerationParamsPatch.generationParamsByModel['runninghub/2039336644536442882']
          .rhVideoSeconds,
        6,
      ),
      assert.notEqual(videoWorkflowGenerationParamsPatch.generationParams.rhVideoSeconds, 6));
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
