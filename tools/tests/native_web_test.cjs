const {spawn}=require('node:child_process');
const {once}=require('node:events');
const assert=require('node:assert/strict');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require(process.env.WIKI_PLAYWRIGHT||'playwright');
(async()=>{
 const fixture=spawn('python',['-B','tools/tests/native_fixture.py'],{stdio:['pipe','pipe','inherit']});
 let buffer='',browser;
 const config=await new Promise((resolve,reject)=>{
  fixture.stdout.on('data',b=>{buffer+=b;if(buffer.includes('\n'))resolve(JSON.parse(buffer.split('\n')[0]));});
  fixture.on('exit',code=>reject(new Error('Fixture ended '+code)));
 });
 try {
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const external=[],errors=[];
  await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin!==new URL(config.url).origin){external.push(route.request().url());return route.abort();}
   return route.continue();
  });
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(config.url+'#pokemon/5');
  await page.waitForFunction(()=>window.app?.state.currentPokemon?.id===5);
  await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.fonts.check('16px Oxanium')));
  assert.equal(await page.evaluate(()=>typeof html2canvas),'function');
  await page.evaluate(()=>{
   document.documentElement.classList.add('native-app');
   document.documentElement.style.setProperty('--safe-area-inset-top','32px');
   document.documentElement.style.setProperty('--safe-area-inset-bottom','24px');
  });
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).paddingTop),'32px');
  await page.locator('#btn-team').click();
  await page.evaluate(()=>location.hash='team');
  await page.locator('#team-grid .team-slot:not(.empty)').first().waitFor();
  await page.evaluate(()=>{window.wikiNative={shareTeam:async image=>{window.sharedTeam=image;}};});
  await page.locator('#btn-export-team').click();
  await page.waitForFunction(()=>window.sharedTeam?.startsWith('data:image/png;base64,'));
  assert.ok(await page.evaluate(()=>window.sharedTeam.length>1000));
  await page.evaluate(()=>location.hash='map');
  await page.waitForFunction(()=>document.querySelector('#map-location-select').options.length>20);
  assert.ok(await page.locator('#map-location-select').getByRole('option',{name:/Route|Rota/}).count());
  await page.reload();
  await page.evaluate(()=>location.hash='team');
  await page.locator('#team-grid .team-slot:not(.empty)').first().waitFor();
  assert.equal(await page.evaluate(()=>window.app.state.team[0].id),5);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.evaluate(async()=>(await navigator.serviceWorker.getRegistrations()).length),0);
  // The host antivirus may inject its own script into local HTTP responses.
  const appExternal=external.filter(url=>!new URL(url).hostname.endsWith('.kaspersky-labs.com'));
  assert.deepEqual(appExternal,[]);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(os.tmpdir(),'hoenn-editor-checks/native-web.png'),animations:'disabled'});
  console.log('Native web: local font, offline export, sharing callback, saved team, insets, no external requests or service worker.');
 }finally{if(browser)await browser.close();fixture.stdin.end();await once(fixture,'exit');}
})().catch(e=>{console.error(e);process.exitCode=1;});
