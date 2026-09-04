const $ = id => document.getElementById(id);
const element = (tag, text) => {const node=document.createElement(tag); if(text!==undefined)node.textContent=text;return node;};
export function initWorkspace(api, getDrafts) {
  let assets=[], warnings=[];
  const dialog=$('workspace-dialog');
  const show=tab=>{
    $('sync-panel').hidden=tab!=='sync';$('media-panel').hidden=tab!=='media';
    $('workspace-title').textContent=tab==='sync'?'Sincronização entre PCs':'Biblioteca de imagens';
    if(!dialog.open)dialog.showModal();
  };
  async function refreshGit() {
    $('sync-refresh').disabled=true;$('sync-status').textContent='Consultando o Git local.';
    $('sync-files').replaceChildren();
    try {
      const data=await api('workspace');
      if(!data.available){$('sync-status').textContent=data.message;return;}
      const comparison=data.upstream ? (data.ahead===null ? ' · comparação remota indisponível; faça Fetch' : ' · '+data.ahead+' commit(s) para enviar · '+data.behind+' para receber') : ' · sem branch remota de acompanhamento';
      $('sync-status').textContent='Branch: '+data.branch+comparison+'. '+data.files.length+' arquivo(s) alterado(s).';
      $('sync-fetched').textContent=(data.fetchedAt?'Último Fetch registrado: '+new Date(data.fetchedAt).toLocaleString('pt-BR')+'. ':'Nenhum Fetch registrado. ')+
        'Esta consulta não acessa a rede. Use Fetch no GitHub Desktop para conferir mudanças feitas em outro PC.';
      for(const file of data.files) {
        const item=element('li');
        item.append(element('code',file.status+' '),element('span',file.path+(file.previousPath?' (antes: '+file.previousPath+')':'')));
        $('sync-files').append(item);
      }
      const drafts=getDrafts();
      $('sync-drafts').textContent=drafts.length ? 'Rascunhos deste navegador: '+drafts.map(d=>d.name).join(', ')+'. Salve ou exporte antes de mudar de PC.' : 'Nenhum rascunho pendente neste navegador.';
    }catch(error){$('sync-status').textContent=error.message;}
    finally{$('sync-refresh').disabled=false;}
  }
  function drawMedia() {
    const term=$('media-search').value.trim().toLowerCase(), filter=$('media-filter').value;
    const drafts=getDrafts().map(d=>({...d,text:JSON.stringify(d.data)}));
    const matches=assets.map(asset=>({...asset,drafts:drafts.filter(d=>d.text.includes(asset.path)).map(d=>d.name)}))
      .filter(a=>(a.path.toLowerCase().includes(term))&&
        (filter==='all'||(filter==='uploads'&&a.uploaded)||(filter==='unreferenced'&&a.uploaded&&!a.references.length&&!a.drafts.length)));
    $('media-summary').textContent=matches.length+' imagem(ns). Exibindo até 80 resultados; refine a pesquisa.'+
      (warnings.length?' Não foi possível ler: '+warnings.join(', ')+'. A análise está incompleta.':'');
    $('media-results').replaceChildren();
    for(const asset of matches.slice(0,80)) {
      const card=element('article');card.className='media-card';
      const img=element('img');img.src='/'+asset.path;img.alt='';img.loading='lazy';
      card.append(img,element('strong',asset.path),element('small',Math.ceil(asset.size/1024)+' KB'));
      const details=element('details');details.append(element('summary','Onde é usada'));
      if(asset.references.length) for(const ref of asset.references)details.append(element('p',ref));
      else details.append(element('p',asset.uploaded?'Sem referência direta nos arquivos salvos.':'Sprite do projeto: pode ser carregada pelo número ou nome no código.'));
      for(const name of asset.drafts)details.append(element('p','Rascunho: '+name));
      card.append(details);$('media-results').append(card);
    }
  }
  async function refreshMedia() {
    $('media-refresh').disabled=true;$('media-summary').textContent='Analisando imagens e referências.';
    try {const data=await api('media');assets=data.assets;warnings=data.warnings;drawMedia();}
    catch(error){$('media-summary').textContent=error.message;}
    finally{$('media-refresh').disabled=false;}
  }
  $('workspace-sync').onclick=()=>{show('sync');refreshGit();};
  $('workspace-media').onclick=()=>{show('media');refreshMedia();};
  $('sync-refresh').onclick=refreshGit;$('media-refresh').onclick=refreshMedia;
  $('media-search').oninput=drawMedia;$('media-filter').onchange=drawMedia;
  $('close-workspace').onclick=()=>dialog.close();
}
