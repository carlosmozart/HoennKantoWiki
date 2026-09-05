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
    // Touch feedback stays transparent while keyboard focus remains visible.
    await page.evaluate(()=>location.hash='');
    await page.locator('#pokedex-grid .grid-card').first().waitFor();
    const tapHighlight=await page.locator('#pokedex-grid .grid-card').first().evaluate(card=>getComputedStyle(card).webkitTapHighlightColor);
    assert.ok(tapHighlight === 'rgba(0, 0, 0, 0)' || tapHighlight === 'transparent');
    // Training cards align on mobile and preserve each member's shiny form.
    await page.evaluate(()=>{
      app.state.team=[{id:5,shiny:true,nature:'hardy',evs:{hp:0,attack:0,defense:0,special_attack:0,special_defense:0,speed:0},ivs:{hp:31,attack:31,defense:31,special_attack:31,special_defense:31,speed:31}}];
      app.saveScopedData('team',app.state.team);
      location.hash='team';
    });
    await page.locator('#team-grid .team-slot-shiny').click();
    await page.locator('#training-modal[aria-hidden="false"] .training-card.is-shiny').waitFor();
    assert.equal(await page.locator('#training-modal-name').innerText(),'Charmeleon');
    assert.ok((await page.locator('#training-modal-img').getAttribute('src')).includes('/emerald/shiny/5.png'));
    assert.equal(await page.locator('#training-shiny-badge').isVisible(),true);
    assert.ok(await page.locator('.training-card').evaluate(card=>card.scrollWidth<=card.clientWidth));
    await page.locator('#btn-training-shiny').click();
    assert.equal(await page.locator('.training-card').evaluate(card=>card.classList.contains('is-shiny')),false);
    assert.ok((await page.locator('#training-modal-img').getAttribute('src')).endsWith('/emerald/5.png'));
    await page.locator('#btn-close-training').click();
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
    // The Elite Four card reuses Blue's verified Champion variants.
    await page.locator('.btn-gym-tab[data-tab="e4"]').click();
    await page.locator('.rival-battle').first().waitFor();
    assert.equal(await page.locator('.rival-battle').count(),2);
    assert.ok(await page.locator('.rival-variant-panel:not([hidden]) .frontier-poke-name',{hasText:'Charizard'}).count());
    await page.locator('.rival-starter-btn[data-player-starter="Charmander"]').click();
    assert.ok(await page.locator('.rival-variant-panel:not([hidden]) .frontier-poke-name',{hasText:'Blastoise'}).count());
    // May and Brendan expose every Emerald encounter and their species differences.
    await page.locator('#game-version-select').selectOption('emerald');
    await page.locator('.btn-gym-tab[data-tab="rivals"]').click();
    await page.locator('.rival-battle').first().waitFor();
    assert.equal(await page.locator('.rival-battle').count(),5);
    await page.locator('.rival-starter-btn[data-player-starter="Torchic"]').click();
    const secondHoennBattle=page.locator('.rival-battle').nth(1);
    await secondHoennBattle.locator('summary').click();
    assert.ok(await secondHoennBattle.locator('.rival-variant-panel:not([hidden]) .frontier-poke-name',{hasText:'Torkoal'}).count());
    await page.locator('.rival-name-btn[data-rival-name="Brendan"]').click();
    assert.ok(await secondHoennBattle.locator('.rival-variant-panel:not([hidden]) .frontier-poke-name',{hasText:'Slugma'}).count());
    // Guide tabs and Safari content follow the selected game.
    await page.evaluate(()=>location.hash='guides');
    await page.waitForFunction(()=>!document.querySelector('.btn-guide-tab[data-tab="regis"]').hidden && document.querySelector('.btn-guide-tab[data-tab="sevii"]').hidden);
    assert.ok(await page.locator('.btn-guide-tab[data-tab="frontier"]:not([hidden])').count());
    assert.equal(await page.locator('.btn-guide-tab[data-tab="sevii"]:not([hidden])').count(),0);
    await page.locator('.btn-guide-tab[data-tab="safari"]').click();
    assert.ok(await page.locator('#guides-container',{hasText:'Área 5 · leste'}).count());
    await page.locator('#game-version-select').selectOption('firered-leafgreen');
    await page.waitForFunction(()=>document.querySelector('.btn-guide-tab[data-tab="regis"]').hidden && !document.querySelector('.btn-guide-tab[data-tab="sevii"]').hidden);
    assert.equal(await page.locator('.btn-guide-tab[data-tab="regis"]:not([hidden])').count(),0);
    assert.ok(await page.locator('.btn-guide-tab[data-tab="sevii"]:not([hidden])').count());
    assert.ok(await page.locator('#guides-container',{hasText:'Secret House'}).count());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:1366,height:900});
    await page.locator('#game-version-select').selectOption('emerald');
    await page.waitForFunction(()=>!document.querySelector('.btn-guide-tab[data-tab="regis"]').hidden);
    await page.locator('.btn-guide-tab[data-tab="regis"]').click();
    await page.locator('.guide-regis .guide-card').first().waitFor();
    assert.equal(await page.locator('.guide-regis .guide-card').count(),3);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,'regis-guide-desktop.png'),animations:'disabled',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    // Versioned editorial pages keep the same route while swapping the correct game content.
    assert.equal(await page.locator('#custom-navigation .custom-nav-link').count(),2);
    await page.evaluate(()=>location.hash='page/roteiro-principal');
    await page.locator('#custom-page-content h2',{hasText:'Emerald'}).waitFor();
    assert.equal(await page.locator('#custom-page-content .custom-card').count(),16);
    assert.ok(await page.locator('#custom-page-content',{hasText:'HM07 Waterfall'}).count());
    await page.locator('#game-version-select').selectOption('ruby-sapphire');
    await page.locator('#custom-page-content h2',{hasText:'Ruby/Sapphire'}).waitFor();
    assert.equal(await page.locator('#custom-page-content .custom-card').count(),15);
    assert.ok(await page.locator('#custom-page-content',{hasText:'Tate & Liza'}).count());
    await page.locator('#game-version-select').selectOption('firered-leafgreen');
    await page.locator('#custom-page-content h2',{hasText:'FireRed/LeafGreen'}).waitFor();
    assert.equal(await page.locator('#custom-page-content .custom-card').count(),15);
    await page.evaluate(()=>location.hash='page/lendarios-eventos');
    await page.locator('#custom-page-content h2',{hasText:'FireRed/LeafGreen'}).waitFor();
    assert.ok(await page.locator('#custom-page-content',{hasText:'Fera lendária errante'}).count());
    assert.ok(await page.locator('#custom-page-content',{hasText:'Mewtwo'}).count());
    await page.locator('#game-version-select').selectOption('emerald');
    await page.locator('#custom-page-content h2',{hasText:'Emerald'}).waitFor();
    assert.ok(await page.locator('#custom-page-content',{hasText:'Faraway Island'}).count());
    assert.ok(await page.locator('#custom-page-content',{hasText:'Birth Island'}).count());
    assert.ok(await page.locator('#custom-page-content',{hasText:'Navel Rock'}).count());
    const ticketImages=page.locator('#custom-page-content img[src$="aurora-ticket.png"], #custom-page-content img[src$="mystic-ticket.png"]');
    assert.equal(await ticketImages.count(),2);
    await ticketImages.last().scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>[...document.querySelectorAll('#custom-page-content img[src$="aurora-ticket.png"], #custom-page-content img[src$="mystic-ticket.png"]')].every(img=>img.complete&&img.naturalWidth>0));
    assert.ok((await ticketImages.evaluateAll(images=>images.map(img=>img.complete&&img.naturalWidth>0))).every(Boolean));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,'legendary-guides-mobile.png'),animations:'disabled',fullPage:true});
    // Editorial links may deep-link directly to a guide tab.
    await page.evaluate(()=>location.hash='guides/regis');
    await page.locator('.btn-guide-tab[data-tab="regis"].active').waitFor();
    assert.equal(await page.locator('.guide-regis .guide-card').count(),3);
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
    const workerSource=fs.readFileSync(worker,'utf8');
    const originalCache=workerSource.match(/const CACHE_NAME = '([^']+)'/)[1];
    fs.writeFileSync(worker,workerSource.replace(originalCache,'pokewiki-test-next'));
    await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
    await page.waitForFunction(async(originalCache)=>{
      const keys=await caches.keys();
      return keys.includes('pokewiki-test-next')&&!keys.includes('pokewiki-obsolete')&&!keys.includes(originalCache);
    },originalCache);
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
    console.log(JSON.stringify({ok:true,checks:['TM/tutor translated type pills and spacing','Blue nine-battle starter variants and item sprite','Blue Elite Four starter variants','May/Brendan Emerald variants','version-specific guides and Safari','Regis desktop guide layout','versioned story and legendary editorial pages','local event-ticket sprites','guide-tab deep links','mobile history back/forward','local cry playback','decode Charmeleon/Pikachu/Deoxys','offline reopen and audio','390px layout','SW update preserves unrelated caches','incomplete update rejected'],decoded},null,2));
  }finally{if(browser)await browser.close();fixture.stdin.end();await once(fixture,'exit');}
})().catch(error=>{console.error(error);process.exitCode=1;});
