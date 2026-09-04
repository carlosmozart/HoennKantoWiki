// Mobile PWA regression checks in a temporary copy, including real audio decoding.
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require(process.env.WIKI_PLAYWRIGHT||'playwright');
(async()=>{
  const fixture=spawn('python',['-B','tools/tests/editor_fixture.py'],{stdio:['pipe','pipe','inherit']});
  let buffer='', browser;
  const config=await new Promise((resolve,reject)=>{
    fixture.stdout.on('data',chunk=>{buffer+=chunk;if(buffer.includes('\n'))resolve(JSON.parse(buffer.split('\n')[0]));});
    fixture.on('exit',code=>reject(new Error('Fixture ended '+code)));
  });
  try {
    browser=await chromium.launch({headless:true,executablePath:process.env.WIKI_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const page=await context.newPage(), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.playedCries=[];
      const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){
        this.addEventListener('playing',()=>window.playedCries.push(this.currentSrc),{once:true});
        return play.call(this);
      };
    });
    await page.goto(config.siteURL+'#pokemon/5');
    await page.waitForFunction(()=>window.app?.state.currentPokemon?.id===5);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await page.reload();
    await page.waitForFunction(()=>window.app?.state.currentPokemon?.id===5);
    // TM/HM and tutor cards reuse the Pokédex type pill and stay readable on mobile.
    await page.evaluate(()=>location.hash='tms');
    await page.locator('#tms-grid .machine-card').first().waitFor();
    const tmVisual=await page.locator('#tms-grid .machine-card').first().evaluate(card=>{
      const pill=card.querySelector('.machine-type-pill');
      const style=getComputedStyle(pill);
      return {type:pill.textContent.trim(),font:style.fontFamily,radius:style.borderRadius,
        gap:getComputedStyle(card.querySelector('.machine-card-identity')).gap,
        fits:card.scrollWidth<=card.clientWidth};
    });
    assert.equal(tmVisual.type,'Lutador');
    assert.ok(tmVisual.font.includes('Oxanium'));
    assert.equal(tmVisual.radius,'20px');
    assert.notEqual(tmVisual.gap,'normal');
    assert.ok(tmVisual.fits);
    const out=path.join(os.tmpdir(),'hoenn-editor-checks');fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'tm-cards-mobile.png'),animations:'disabled'});
    await page.locator('.btn-tm-tab[data-tab="tutors"]').click();
    await page.locator('#tutors-container .machine-card').first().waitFor();
    assert.ok(await page.locator('#tutors-container .machine-type-pill',{hasText:'Lutador'}).count());
    assert.ok(await page.locator('#tutors-container .machine-card-title',{hasText:'Thunder Punch'}).count());
    await page.screenshot({path:path.join(out,'machine-cards-mobile.png'),animations:'disabled',fullPage:true});
    // Blue exposes all nine FRLG battles and updates every team from one starter choice.
    await page.locator('#game-version-select').selectOption('firered-leafgreen');
    await page.evaluate(()=>location.hash='gyms');
    await page.locator('.btn-gym-tab[data-tab="rivals"]').click();
    await page.locator('.rival-battle').first().waitFor();
    assert.equal(await page.locator('.rival-battle').count(),9);
    const champion=page.locator('.rival-battle').nth(7);
    await champion.locator('summary').click();
    assert.ok(await champion.locator('.rival-variant-panel:not([hidden]) .frontier-poke-name',{hasText:'Charizard'}).count());
    await page.locator('.rival-starter-btn[data-player-starter="Charmander"]').click();
    assert.ok(await champion.locator('.rival-variant-panel:not([hidden]) .frontier-poke-name',{hasText:'Blastoise'}).count());
    assert.ok(await champion.locator('.rival-battle-items img[src$="full-restore.png"]').count());
    const blueSprites=await champion.locator('.rival-variant-panel:not([hidden]) .frontier-poke-header img').evaluateAll(images=>images.map(img=>img.getAttribute('src')));
    assert.equal(blueSprites.length,6);
    assert.ok(blueSprites.every(src=>src.includes('/firered-leafgreen/')));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,'blue-rival-mobile.png'),animations:'disabled',fullPage:true});
    await page.evaluate(()=>location.hash='pokemon/5');
    await page.waitForFunction(()=>window.app?.state.currentPokemon?.id===5);
    await page.locator('#btn-cry').click();
    await page.waitForFunction(()=>window.playedCries.some(src=>src.includes('/audio/cries/5.ogg')));
    const decoded=await page.evaluate(async()=>{
      const ctx=new AudioContext();
      try {
        const result=[];
        for(const id of [5,25,386]) {
          const response=await fetch('./audio/cries/'+id+'.ogg');
          const data=await ctx.decodeAudioData(await response.arrayBuffer());
          result.push({id,duration:data.duration});
        }
        return result;
      } finally {await ctx.close();}
    });
    assert.ok(decoded.every(a=>a.duration>0));
    await page.evaluate(()=>location.hash='pokemon/25');
    await page.waitForFunction(()=>window.app.state.currentPokemon?.id===25);
    await page.goBack();
    await page.waitForFunction(()=>window.app.state.currentPokemon?.id===5);
    await page.goForward();
    await page.waitForFunction(()=>window.app.state.currentPokemon?.id===25);
    // Wait for durable caching before simulating airplane mode.
    await page.waitForFunction(async()=>!!(await caches.match('./data/pokemon/25.json',{ignoreSearch:true}))&&!!(await caches.match('./audio/cries/25.ogg')));
    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(()=>window.app?.state.currentPokemon?.id===25);
    await page.locator('#btn-cry').click();
    await page.waitForFunction(()=>window.playedCries.some(src=>src.includes('/audio/cries/25.ogg')));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,'mobile-offline.png'),animations:'disabled'});
    assert.deepEqual(errors,[]);
    // Updating the worker must keep unrelated same-origin caches.
    await context.setOffline(false);
    await page.evaluate(async()=>{await caches.open('other-app-cache');await caches.open('pokewiki-obsolete');});
    const worker=path.join(config.root,'sw.js');
    fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace('pokewiki-v20','pokewiki-test-next'));
    await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
    await page.waitForFunction(async()=>{
      const keys=await caches.keys();
      return keys.includes('pokewiki-test-next')&&!keys.includes('pokewiki-obsolete')&&!keys.includes('pokewiki-v20');
    });
    assert.ok((await page.evaluate(()=>caches.keys())).includes('other-app-cache'));
    await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r.active?.state==='activated'&&!r.installing&&!r.waiting;});
    // A failed shell download must not replace the working service worker.
    fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace('pokewiki-test-next','pokewiki-test-broken').replace("'./manifest.json',","'./missing-critical.json',"));
    fs.utimesSync(worker,new Date(),new Date(Date.now()+2000)); // Distinct HTTP Last-Modified for the second update.
    await page.evaluate(async()=>{
      const registration=await navigator.serviceWorker.getRegistration();
      await new Promise(async(resolve,reject)=>{
        const trace=[];
        const timer=setTimeout(()=>reject(new Error('Update timeout: '+JSON.stringify({trace,active:registration.active?.state,installing:registration.installing?.state}))),15000);
        registration.addEventListener('updatefound',()=>{
          const candidate=registration.installing;trace.push('found:'+candidate?.state);
          candidate.addEventListener('statechange',()=>{
            trace.push(candidate.state);
            if(candidate.state==='redundant'){clearTimeout(timer);resolve();}
            if(candidate.state==='activated'){clearTimeout(timer);reject(new Error('Broken worker activated'));}
          });
        },{once:true});
        try {await navigator.serviceWorker.register('./sw.js?broken-test=1',{scope:'./',updateViaCache:'none'});}catch(error){clearTimeout(timer);reject(error);}
      });
    });
    assert.ok((await page.evaluate(()=>caches.keys())).includes('pokewiki-test-next'));
    console.log(JSON.stringify({ok:true,checks:['TM/tutor translated type pills and spacing','Blue nine-battle starter variants and item sprite','mobile history back/forward','local cry playback','decode Charmeleon/Pikachu/Deoxys','offline reopen and audio','390px layout','SW update preserves unrelated caches','incomplete update rejected'],decoded},null,2));
  }finally{if(browser)await browser.close();fixture.stdin.end();await once(fixture,'exit');}
})().catch(error=>{console.error(error);process.exitCode=1;});
