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
    const refresh=async()=>{await Promise.all([page.waitForEvent('framenavigated', frame=>frame.parentFrame()!==null && frame.url().includes('/preview/')),page.locator('#preview').click()]);};
    page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(config.url);
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.frameLocator('#preview-frame').locator('#gyms-container .trainer-card').first().waitFor();
    assert.equal(await page.locator('#document option').count(),12);
    reports.push('12 documentos; primeira previa com cards reais');
    await page.locator('#editor-theme').click();
    assert.equal(await page.locator('html').getAttribute('data-editor-theme'),'dark');
    await page.reload();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    assert.equal(await page.locator('html').getAttribute('data-editor-theme'),'dark');
    await page.screenshot({path:path.join(out,'editor-dark.png'),fullPage:true,animations:'disabled'});
    await page.locator('#editor-theme').click();
    assert.equal(await page.locator('html').getAttribute('data-editor-theme'),'light');
    reports.push('modo escuro/claro e preferencia persistente');
    await page.screenshot({path:path.join(out,'editor-desktop.png'),fullPage:true,animations:'disabled'});

    await page.locator('#document').selectOption('key-items.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.getByLabel('Categoria',{exact:true}).fill('Categoria de teste');
    await refresh();
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
    await refresh();
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
    await refresh();
    await page.frameLocator('#preview-frame').getByText('Card de teste Safari',{exact:true}).waitFor();
    await page.locator('#form .rich .bento-item').last().locator('p').click();
    await page.getByRole('button',{name:'Remover bloco',exact:true}).click();
    await refresh();
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
    await refresh();
    await page.frameLocator('#preview-frame').locator('#gyms-container').getByText('Charmander',{exact:false}).first().waitFor();
    reports.push('seletor de Pokemon atualiza nome e tipos do time');

    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:path.join(out,'editor-mobile.png'),fullPage:true,animations:'disabled'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push('layout sem overflow horizontal a 390px');

    for(const name of ['extras.json','frontier.json','machines.json','tutors.json','i18n/pt.json','i18n/en.json']){
      await page.locator('#document').selectOption(name);
      await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
      assert.ok(!(await page.locator('#status').getAttribute('class')||'').includes('error'),name);
    }
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('#document').selectOption('pages.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#add').click();
    await page.getByLabel('Endereço da página',{exact:true}).fill('guia-personalizado');
    await page.getByLabel('Título',{exact:true}).first().fill('Meu guia personalizado');
    await page.getByLabel('Nome no menu',{exact:true}).first().fill('Guia novo');
    await page.getByRole('button',{name:'Adicionar de modelo',exact:true}).click();
    await page.locator('#template-list').getByRole('button',{name:'Pokémon em destaque',exact:true}).click();
    const cardSection=page.locator('#form fieldset').filter({has:page.locator('.array-header > label',{hasText:'Cards'})}).first();
    await cardSection.locator(':scope > details > summary').first().click();
    await cardSection.getByLabel('Título',{exact:true}).first().fill('Card personalizado');
    await cardSection.getByRole('button',{name:'Escolher',exact:true}).first().click();
    const png=Buffer.from(await page.evaluate(async()=>{
      const canvas=document.createElement('canvas');canvas.width=16;canvas.height=16;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#339955';ctx.fillRect(0,0,16,16);
      return Array.from(new Uint8Array(await (await new Promise(resolve=>canvas.toBlob(resolve))).arrayBuffer()));
    }));
    await page.locator('#image-file').setInputFiles({name:'Nova imagem.png',mimeType:'image/png',buffer:png});
    await page.waitForFunction(()=>document.querySelector('#gallery-status').textContent.includes('Imagem adicionada'));
    await page.locator('#gallery-items button').first().click();
    assert.equal(fs.readdirSync(path.join(config.root,'img/uploads')).length,1);
    await refresh();
    await page.frameLocator('#preview-frame').getByRole('heading',{name:'Meu guia personalizado',exact:true}).waitFor();
    await page.frameLocator('#preview-frame').getByRole('heading',{name:'Card personalizado',exact:true}).waitFor();
    await page.frameLocator('#preview-frame').locator('#custom-navigation').getByRole('link',{name:'Guia novo',exact:true}).waitFor();
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Salvo no projeto.'));
    await refresh();
    await page.frameLocator('#preview-frame').locator('#custom-page-content .custom-card-image').waitFor();
    assert.equal(await page.frameLocator('#preview-frame').locator('#custom-page-content .custom-card-image').evaluate(i=>i.naturalWidth),16);
    reports.push('pagina nova no menu, card de modelo e upload de imagem normalizada');
    await page.screenshot({path:path.join(out,'editor-pages.png'),fullPage:true,animations:'disabled'});

    await page.locator('#section').selectOption({label:'Modelos de cards'});
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.frameLocator('#preview-frame').locator('#custom-page-content .custom-card').waitFor();
    reports.push('previa independente de modelos');

    await page.locator('#document').selectOption('interface.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.getByRole('textbox',{name:'Pokédex',exact:true}).fill('Enciclopédia Pokémon');
    await refresh();
    await page.frameLocator('#preview-frame').getByRole('button',{name:'Enciclopédia Pokémon',exact:true}).waitFor();
    await page.locator('#section').selectOption({label:'Português · Rótulos'});
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#entries').getByRole('button',{name:/Habilidade:/}).click();
    await page.getByRole('textbox',{name:'Habilidade:',exact:true}).fill('Capacidade:');
    await refresh();
    await page.frameLocator('#preview-frame').locator('#gyms-container').getByText('Capacidade:',{exact:true}).first().waitFor();
    reports.push('textos da navegacao e dos cards alterados na previa');

    await page.locator('#document').selectOption('pokemon-overrides.json');
    await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Prévia atualizada'));
    await page.locator('#add').click();
    const translations=page.locator('#form > details').filter({has:page.locator(':scope > summary',{hasText:'Textos por idioma'})});
    await translations.locator(':scope > summary').click();
    const pt=translations.locator('details').filter({has:page.locator(':scope > summary',{hasText:'Português'})});
    await pt.locator(':scope > summary').click();
    await pt.getByLabel('Descrição',{exact:true}).fill('Uma descrição editorial para Bulbasaur.');
    const beforePokemon=fs.readFileSync(path.join(config.root,'data/pokemon/1.json'),'utf8');
    await refresh();
    await page.frameLocator('#preview-frame').locator('.pokemon-description').getByText('Uma descrição editorial para Bulbasaur.',{exact:true}).waitFor();
    await page.locator('#save').click();
    await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Salvo no projeto.'));
    assert.equal(fs.readFileSync(path.join(config.root,'data/pokemon/1.json'),'utf8'),beforePokemon);
    reports.push('correcao da Pokedex aplicada sem alterar o arquivo gerado');
    await page.setViewportSize({width:390,height:844});
    await page.locator('#editor-theme').click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,'editor-dark-mobile.png'),fullPage:true,animations:'disabled'});
    const sw=await page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations()).length);
    assert.equal(sw,0);
    const publicPage=await context.newPage();
    publicPage.on('pageerror',error=>errors.push(error.message));
    await publicPage.goto(config.siteURL+'#page/guia-personalizado');
    await publicPage.locator('#custom-page-content').getByRole('heading',{name:'Meu guia personalizado',exact:true}).waitFor();
    await publicPage.getByRole('button',{name:'Pokédex',exact:true}).click();
    await publicPage.locator('#pokedex-grid .grid-card').first().waitFor();
    await publicPage.goto(config.siteURL+'#pokemon/1');
    await publicPage.locator('.pokemon-description').getByText('Uma descrição editorial para Bulbasaur.',{exact:true}).waitFor();
    const names=await publicPage.evaluate(()=>caches.keys());
    await publicPage.setViewportSize({width:390,height:844});
    await publicPage.goto(config.siteURL+'#page/guia-personalizado');
    await publicPage.locator('#custom-page-content .custom-card').waitFor();
    assert.ok(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    reports.push('site estatico: pagina, menu, Pokedex e layout mobile funcionam sem o servidor do editor');
    await publicPage.screenshot({path:path.join(out,'site-custom-mobile.png'),fullPage:true,animations:'disabled'});
    assert.deepEqual(errors,[]);
    reports.push('demais secoes, zero erros JS e nenhum service worker local');
    console.log(JSON.stringify({ok:true,reports,screenshots:out},null,2));
  }catch(error){
    if(browser){
      const pages=browser.contexts().flatMap(c=>c.pages());
      if(pages[0]){
        console.error('STATUS:',await pages[0].locator('#status').textContent().catch(()=>'?'));
        await pages[0].screenshot({path:path.join(out,'failure.png'),fullPage:true,animations:'disabled'}).catch(()=>{});
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
