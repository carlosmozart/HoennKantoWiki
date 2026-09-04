// Instale playwright fora do projeto e informe WIKI_PLAYWRIGHT para executar.
// Usa uma copia temporaria do projeto; nunca salva nos dados de producao.
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.WIKI_PLAYWRIGHT || 'playwright');

(async()=>{
  const fixture=spawn('python',['-B','tools/tests/editor_fixture.py'],{stdio:['pipe','pipe','inherit']});
  let buffer='';
  const config=await new Promise((resolve,reject)=>{
    fixture.stdout.on('data',chunk=>{buffer+=chunk;if(buffer.includes('\n')){try{resolve(JSON.parse(buffer.split('\n')[0]));}catch(e){reject(e);}}});
    fixture.on('exit',code=>reject(new Error('Fixture terminou: '+code)));
  });
  let browser;
  const reports=[];
  const out=path.join(os.tmpdir(),'hoenn-editor-checks');
  fs.mkdirSync(out,{recursive:true});
  try{
    browser=await chromium.launch({headless:true,executablePath:process.env.WIKI_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(config.url);
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.frameLocator('#preview-frame').locator('#gyms-container .trainer-card').first().waitFor();
    assert.equal(await page.locator('#document option').count(),9);
    reports.push('9 documentos; primeira previa com cards reais');
    await page.screenshot({path:path.join(out,'editor-desktop.png'),fullPage:true});

    await page.locator('#document').selectOption('key-items.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.getByLabel('Categoria',{exact:true}).fill('Categoria de teste');
    await page.locator('#preview').click();
    await page.frameLocator('#preview-frame').getByRole('heading',{name:'Categoria de teste',exact:true}).waitFor();
    const before=JSON.parse(fs.readFileSync(path.join(config.root,'data/key-items.json')));
    assert.notEqual(before.hoenn[0].category,'Categoria de teste');
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Salvo no projeto.'));
    assert.equal(JSON.parse(fs.readFileSync(path.join(config.root,'data/key-items.json'))).hoenn[0].category,'Categoria de teste');
    assert.equal(fs.readdirSync(path.join(config.root,'backups')).length,1);
    reports.push('edicao, previa sem escrita, salvamento UTF-8 e backup');

    await page.locator('#duplicate').click();
    assert.equal(await page.locator('#entries button').count(),5);
    await page.locator('#move-down').click();
    await page.locator('#remove').click();
    assert.equal(await page.locator('#entries button').count(),4);
    await page.locator('#undo').click();
    assert.equal(await page.locator('#entries button').count(),5);
    await page.locator('#redo').click();
    assert.equal(await page.locator('#entries button').count(),4);
    await page.locator('#add').click();
    await page.getByLabel('Categoria',{exact:true}).fill('Categoria nova');
    await page.locator('#form').getByRole('button',{name:'+ Adicionar',exact:true}).click();
    await page.locator('#form details').first().locator(':scope > summary').click();
    await page.getByLabel('Nome',{exact:true}).fill('Potion');
    await page.getByRole('textbox',{name:'Descrição',exact:true}).fill('Um novo item adicionado pelo editor.');
    await page.locator('#preview').click();
    await page.frameLocator('#preview-frame').getByText('Um novo item adicionado pelo editor.',{exact:true}).waitFor();
    reports.push('criar/duplicar/reordenar/remover cards e desfazer/refazer');

    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#document').selectOption('key-items.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#entries').getByRole('button',{name:'Categoria nova',exact:true}).waitFor();
    reports.push('rascunho recuperado apos recarregar');

    await page.locator('#document').selectOption('guides.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#section').selectOption({label:'Safari Zone'});
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.getByLabel('Título',{exact:true}).fill('Safari revisado no editor');
    await page.getByRole('button',{name:'+ Card',exact:true}).click();
    await page.locator('#form .rich .bento-item').last().locator('h4').fill('Card de teste Safari');
    await page.locator('#preview').click();
    await page.frameLocator('#preview-frame').getByText('Card de teste Safari',{exact:true}).waitFor();
    await page.locator('#form .rich .bento-item').last().locator('p').click();
    await page.getByRole('button',{name:'Remover bloco',exact:true}).click();
    await page.locator('#preview').click();
    await page.frameLocator('#preview-frame').getByRole('heading',{name:'Safari revisado no editor',exact:true}).waitFor();
    const imageErrors=await page.locator('#form .rich img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).length);
    assert.equal(imageErrors,0);
    reports.push('guia visual: titulo, novo card, remocao de texto e imagens locais');

    await page.locator('#section').selectOption({label:'Calculadora de tipos'});
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.frameLocator('#preview-frame').locator('#calc-type-1').selectOption('fire');
    await page.frameLocator('#preview-frame').locator('#calc-result > div').first().waitFor();
    reports.push('calculadora interativa preservada');

    await page.locator('#document').selectOption('gyms.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#section').selectOption({label:'Emerald · Ginásios'});
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    const team=page.locator('#form fieldset').filter({has:page.locator('.array-header > label',{hasText:'Time inicial / prata'})}).first();
    await team.locator('details > summary').first().click();
    await team.getByRole('button',{name:'Escolher',exact:true}).first().click();
    await page.locator('#gallery-search').fill('charmander');
    await page.locator('#gallery-items button').first().click();
    await page.locator('#preview').click();
    await page.frameLocator('#preview-frame').locator('#gyms-container').getByText('Charmander',{exact:false}).first().waitFor();
    reports.push('seletor de Pokemon atualiza nome e tipos do time');

    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(out,'editor-mobile.png'),fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push('layout sem overflow horizontal a 390px');

    for(const name of ['extras.json','frontier.json','machines.json','tutors.json','i18n/pt.json','i18n/en.json']){
      await page.locator('#document').selectOption(name);
      await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
      assert.ok(!(await page.locator('#status').getAttribute('class')||'').includes('error'),name);
    }
    const sw=await page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length);
    assert.equal(sw,0);
    assert.deepEqual(errors,[]);
    reports.push('demais secoes, zero erros JS e nenhum service worker local');
    console.log(JSON.stringify({ok:true,reports,screenshots:out},null,2));
  }catch(error){
    if(browser){
      const pages=browser.contexts().flatMap(c=>c.pages());
      if(pages[0]){
        console.error('STATUS:',await pages[0].locator('#status').textContent().catch(()=>'?'));
        await pages[0].screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});
      }
    }
    console.error(error);
    process.exitCode=1;
  }finally{
    if(browser)await browser.close();
    fixture.stdin.end();
    await once(fixture,'exit');
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
