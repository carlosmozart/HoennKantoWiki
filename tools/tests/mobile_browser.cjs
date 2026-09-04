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
    const out=path.join(os.tmpdir(),'hoenn-editor-checks');fs.mkdirSync(out,{recursive:true});
    await page.screenshot({path:path.join(out,'mobile-offline.png'),animations:'disabled'});
    assert.deepEqual(errors,[]);
    // Updating the worker must keep unrelated same-origin caches.
    await context.setOffline(false);
    await page.evaluate(async()=>{await caches.open('other-app-cache');await caches.open('pokewiki-obsolete');});
    const worker=path.join(config.root,'sw.js');
    fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace('pokewiki-v18','pokewiki-test-next'));
    await page.evaluate(async()=>{await (await navigator.serviceWorker.getRegistration()).update();});
    await page.waitForFunction(async()=>{
      const keys=await caches.keys();
      return keys.includes('pokewiki-test-next')&&!keys.includes('pokewiki-obsolete')&&!keys.includes('pokewiki-v18');
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
    console.log(JSON.stringify({ok:true,checks:['mobile history back/forward','local cry playback','decode Charmeleon/Pikachu/Deoxys','offline reopen and audio','390px layout','SW update preserves unrelated caches','incomplete update rejected'],decoded},null,2));
  }finally{if(browser)await browser.close();fixture.stdin.end();await once(fixture,'exit');}
})().catch(error=>{console.error(error);process.exitCode=1;});
