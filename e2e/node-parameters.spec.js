import { test, expect } from '@playwright/test';
test('real video node lazily opens grouped model menus and keeps advanced controls across updates', async ({page,baseURL},testInfo) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===baseURL?route.continue():route.abort('blockedbyclient'));
  await page.goto('/');await page.waitForFunction(()=>window._isAppLoaded===true);
  await expect(page.locator('#v2-initial-loader')).toBeHidden();
  await page.evaluate(async()=>{
    const {default:store}=await import('/src/core/stores/appStore.js');
    store.addNode({id:'audit-video-parameters',type:'ai-video',x:160,y:100,width:480,height:340,
      model:'apimart/kling-v3',provider:'apimart',prompt:'',generationParams:{resolution:'1080p',aspectRatio:'16:9',duration:5}});
    store.setSelectedNodes(['audit-video-parameters']);
  });
  const node=page.locator('#audit-video-parameters');
  await expect(node).toBeVisible();
  await node.hover();
  const menu=node.locator('.img-model-menu');
  await expect(menu.locator(':scope > *')).toHaveCount(0);
  await node.locator('.img-model-btn-trigger').click();
  await expect(menu).toBeVisible();
  await expect.poll(()=>menu.locator('[data-provider="apimart"]').count()).toBeGreaterThan(0);
  await expect.poll(()=>menu.locator('[data-provider="runninghubwf"]').count()).toBeGreaterThan(0);
  await node.locator('.img-model-btn-trigger').click();
  await expect(menu).toBeHidden();
  const advanced=node.locator('.rh-adv2-btn');
  await expect(advanced).toBeVisible();
  await advanced.click();
  await expect(node.locator('.rh-vram-adv-panel')).toBeVisible();
  await expect.poll(()=>node.locator('.rh-vram-adv-panel [data-ui-schema-field]').count()).toBeGreaterThan(0);
  await page.evaluate(async()=>{
    const {default:store}=await import('/src/core/stores/appStore.js');
    store.updateNodeData('audit-video-parameters',{generationParams:{resolution:'1080p',aspectRatio:'9:16',duration:10}});
  });
  await expect(advanced).toBeVisible();
  await page.screenshot({path:testInfo.outputPath('video-parameters.png')});
  expect(errors).toEqual([]);
});
