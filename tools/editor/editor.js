import { importImage } from "./media.js";
import { reviewChanges } from "./review.js";
import { initWorkspace } from "./workspace.js";

const $ = (id) => document.getElementById(id);
const clone = (data) => structuredClone(data);
const TYPES = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel'];
const labels = {
  pages:'Páginas',templates:'Modelos de cards',slug:'Endereço da página',menuLabel:'Nome no menu',
  description:'Descrição',visible:'Publicar página',versions:'Jogos (vazio = todos)',cards:'Cards',
  layout:'Disposição',accent:'Cor de destaque',fields:'Campos adicionais',label:'Rótulo',value:'Valor',
  link:'Link',linkLabel:'Texto do link',en:'Inglês (opcional)',pt:'Português',pokemonId:'Número do Pokémon',
  corrections:'Correções',changes:'Dados a corrigir',translations:'Textos por idioma',
  navigation:'Navegação',sections:'Títulos e textos',labels:'Rótulos',placeholders:'Campos de pesquisa',
  nome:'Nome identificador',tipos:'Tipos',altura:'Altura (decímetros)',peso:'Peso (hectogramas)',
  stats:'Status base',evs:'EVs concedidos',habilidades:'Habilidades',gruposOvo:'Grupos de ovo',
  golpes:'Golpes por jogo',evolucoes:'Evoluções',locais:'Encontros',cries:'Áudios',oculta:'Oculta',
  name:'Nome',city:'Cidade / local',type:'Tipo',types:'Tipos',badge:'Insígnia',symbol:'Símbolo',
  sprite:'Imagem do treinador',spriteAlt:'Segunda imagem',spriteLabels:'Nomes das imagens',desc:'Descrição',
  silverReq:'Título da primeira batalha / prata',goldReq:'Título da revanche / ouro',
  silverTeam:'Time inicial / prata',goldTeam:'Time de revanche / ouro',id:'Número do Pokémon',
  level:'Nível',item:'Item equipado',ability:'Habilidade',moves:'Golpes',title:'Título',content:'Texto do guia',
  category:'Categoria',items:'Itens',brain:'Líder',brainTitle:'Título do líder',brainSprite:'Imagem do líder',
  image:'Imagem',ptName:'Nome em português',cost:'Custo',move:'Golpe',location:'Local',
  starterRule:'Variações por inicial',titulo:'Título',regra:'Regra',variacoes:'Variações',seuInicial:'Seu inicial',
  rival:'Inicial do rival',linha:'Linha evolutiva (números)',battleList:'Locais / momentos das batalhas',
  'ruby-sapphire':'Ruby / Sapphire','firered-leafgreen':'FireRed / LeafGreen',emerald:'Emerald',hoenn:'Hoenn',kanto:'Kanto',
  gyms:'Ginásios',e4:'Elite Four',rivals:'Rivais',villains:'Vilões',gifts:'Presentes',events:'Eventos',
  trades:'Trocas',missing:'Inobtíveis',overview:'Visão geral',facilities:'Instalações e líderes',
  shops:'Lojas',tutors:'Tutores',special_pokemon:'Pokémon especiais',stones:'Itens e pedras',
  safari:'Safari Zone',sevii:'Sevii Islands',weakness:'Calculadora de tipos',natures:'Naturezas',
  berries:'Berries / Feebas',ev:'Treinamento de EVs',frontier:'Battle Frontier',bases:'Bases secretas',
};
const label = (key) => labels[key] || key;
const token = location.hash.slice(1) || sessionStorage.getItem('wiki-editor-token') || '';
if (token) sessionStorage.setItem('wiki-editor-token', token);
history.replaceState(null, '', location.pathname);
let catalog, filename, doc, original, revision, schema, sections = [], sectionPath = [], selected = null;
let undoStack = [], redoStack = [], loading = false, sequence = 0, previewSequence = 0, draftTimer, galleryCallback, refreshGallery;
const savedRange = new WeakMap();

function el(tag, attrs = {}, text) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  if (text !== undefined) node.textContent = text;
  return node;
}
function button(text, handler, attrs = {}) {
  return el('button', { type:'button', onclick:handler, ...attrs }, text);
}
function status(text, error = false) {
  $('status').textContent = text;
  $('status').classList.toggle('error', error);
}
async function api(path, body) {
  const result = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET', cache:'no-store',
    headers: { 'X-Editor-Token':token, ...(body ? {'Content-Type':'application/json'} : {}) },
    ...(body ? {body:JSON.stringify(body)} : {}),
  });
  const data = await result.json();
  if (!result.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}
const at = (path, data = doc) => path.reduce((obj, key) => obj[key], data);
function schemaAt(path) {
  return path.reduce((s, key) => typeof key === 'number' ? s.items : s.properties[key], schema);
}
function setAt(path, value) {
  if (!path.length) doc = value;
  else at(path.slice(0,-1))[path.at(-1)] = value;
}
const dirty = () => JSON.stringify(doc) !== original;
const draftKey = () => 'wiki-editor-draft:' + catalog.project + ':' + filename;
function persistDraft() {
  if (!filename) return true;
  try {
    if (dirty()) localStorage.setItem(draftKey(), JSON.stringify({revision,data:doc}));
    else localStorage.removeItem(draftKey());
    return true;
  } catch { status('Rascunho não pôde ser guardado no navegador. Exporte uma cópia antes de fechar.', true); return false; }
}
function hasPendingDrafts() {
  if (doc && dirty()) return true;
  if (!catalog) return false;
  try {
    const prefix = 'wiki-editor-draft:' + catalog.project + ':';
    return Object.keys(localStorage).some(key => key.startsWith(prefix) && key !== draftKey());
  } catch { return true; }
}
function updateState() {
  $('dirty').textContent = dirty() ? 'Rascunho não salvo' : 'Sem alterações';
  $('dirty').classList.toggle('changed', dirty());
  $('save').disabled = !dirty() || loading;
  $('undo').disabled = !undoStack.length || loading;
  $('redo').disabled = !redoStack.length || loading;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(persistDraft, 250);
}
function change(action, redraw = false) {
  undoStack.push(clone(doc));
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  action();
  updateState();
  if (redraw) render();
}
function fallback(s, key = '') {
  if ('default' in s) return clone(s.default);
  if (s.types.includes('object')) return Object.fromEntries((s.required || []).map(k => [k, fallback(s.properties[k], k)]));
  if (s.types.includes('array')) return ['types','tipos'].includes(key) ? ['normal'] : [];
  if (s.types.includes('number')) return key === 'id' ? 1 : key === 'level' ? 5 : 0;
  if (s.types.includes('boolean')) return false;
  if (s.types.includes('string')) return key === 'type' ? 'normal' : '';
  return null;
}
function collectSections(data, s, path = []) {
  if (Array.isArray(data)) return [{path, title:path.map(label).join(' · ') || 'Lista'}];
  if (!data || typeof data !== 'object') return [{path, title:path.map(label).join(' · ')}];
  if (path.length && ('content' in data || 'desc' in data || 'title' in data || 'name' in data))
    return [{path, title:path.map(label).join(' · '), single:true}];
  if ((filename === 'interface.json' && path.length === 2) || (filename.startsWith('i18n/') && path.length))
    return [{path, title:path.map(label).join(' · '), dictionary:true}];
  return Object.entries(data).flatMap(([key, value]) => collectSections(value, s.properties[key], [...path,key]));
}
function activeSection() { return sections.find(s => JSON.stringify(s.path) === JSON.stringify(sectionPath)); }
function entryName(value, key) {
  if (typeof value === 'string') return String(key) + ' · ' + value.replace(/<[^>]+>/g,'').slice(0,50);
  if (value?.pokemonId && filename === 'pokemon-overrides.json') return '#'+value.pokemonId+' · '+(catalog.pokemon.find(p=>p.id===value.pokemonId)?.nome || 'Pokémon');
  return value?.name || value?.title || value?.category || value?.move || label(String(key));
}
function entries() {
  const value = at(sectionPath), sec = activeSection();
  if (Array.isArray(value)) return value.map((v,i) => ({key:i, value:v, path:[...sectionPath,i]}));
  if (sec?.dictionary) return Object.entries(value).map(([k,v]) => ({key:k,value:v,path:[...sectionPath,k]}));
  return [{key:sectionPath.at(-1) || 'Conteúdo',value,path:sectionPath}];
}
function currentEntry() { return entries().find(e => JSON.stringify(e.path) === JSON.stringify(selected)); }
function renderList() {
  const list = entries();
  const term = $('search').value.trim().toLowerCase();
  const visible = list.filter(e => (String(e.key) + JSON.stringify(e.value)).toLowerCase().includes(term));
  $('entries').replaceChildren();
  $('count').textContent = list.length + (list.length === 1 ? ' entrada' : ' entradas');
  for (const entry of visible) {
    const b = button('', () => { selected = entry.path; render(); });
    b.classList.toggle('active', JSON.stringify(entry.path) === JSON.stringify(selected));
    if (b.classList.contains('active')) b.setAttribute('aria-current','true');
    if (Number.isInteger(entry.value?.id)) b.append(el('img',{src:'/img/pokemon/icons/'+entry.value.id+'.png', alt:''}));
    b.append(el('span',{},entryName(entry.value,entry.key)));
    $('entries').append(b);
  }
  if (!visible.length) $('entries').append(el('p',{className:'empty'},'Nenhuma entrada encontrada.'));
  const arr = Array.isArray(at(sectionPath)), entry = currentEntry();
  $('add').disabled = !arr || loading;
  for (const id of ['duplicate','remove']) $(id).disabled = !arr || !entry || loading;
  $('move-up').disabled = !arr || !entry || entry.key === 0 || loading;
  $('move-down').disabled = !arr || !entry || entry.key === list.length - 1 || loading;
}
function render() {
  renderList();
  const entry = currentEntry();
  $('title').textContent = entry ? entryName(entry.value,entry.key) : 'Nenhum card nesta seção';
  $('breadcrumb').textContent = catalog.documents[filename] + ' / ' + activeSection().title;
  $('form').replaceChildren();
  if (entry) {
    if(filename === 'pages.json') $('form').append(el('p',{className:'field-help'},'Páginas aparecem no menu após salvar e publicar. Modelos são cópias iniciais: alterações no modelo não modificam cards já criados.'));
    if(filename === 'pokemon-overrides.json') $('form').append(el('p',{className:'field-help'},'Adicione somente os campos que deseja corrigir. Os arquivos gerados continuam intactos; remover esta correção restaura os dados originais.'));
    renderValue($('form'), entry.path, schemaAt(entry.path), entry.key);
  }
  else $('form').append(el('p',{className:'empty'},'Use “Adicionar” para criar o primeiro card.'));
  updateState();
}
function rememberRange(rich) {
  const selection = window.getSelection();
  if (selection.rangeCount && rich.contains(selection.anchorNode) && rich.contains(selection.focusNode))
    savedRange.set(rich, selection.getRangeAt(0).cloneRange());
}
function insertRich(rich, node, wrap = false) {
  const range = savedRange.get(rich);
  if (range && rich.contains(range.commonAncestorContainer)) {
    if (wrap) node.append(range.extractContents());
    else range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node); range.collapse(true);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
  } else rich.append(node);
  rich.focus();
  rich.dispatchEvent(new Event('input', {bubbles:true}));
}
function richField(parent, path, value) {
  const rich = el('div',{className:'rich',contentEditable:'true',role:'textbox','aria-multiline':'true','aria-label':label(path.at(-1))});
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  const tags = new Set('DIV P SPAN STRONG B EM I U S BR HR H2 H3 H4 H5 UL OL LI TABLE THEAD TBODY TFOOT TR TH TD SMALL A IMG SELECT OPTION BLOCKQUOTE CAPTION SUB SUP'.split(' '));
  for (const node of parsed.body.querySelectorAll('*')) {
    if (!tags.has(node.tagName)) {node.remove();continue;}
    for (const attr of [...node.attributes]) {
      const compact = attr.value.replace(/\s+/g,'').toLowerCase();
      if (attr.name.startsWith('on') || ['srcdoc','contenteditable'].includes(attr.name) ||
          (['src','href'].includes(attr.name) && !/^(https?:\/\/|#|(?:\.\/)?(?:img|images)\/)/i.test(attr.value)) ||
          (attr.name==='style' && /url|expression|@import|behavior|binding|\\/.test(compact))) node.removeAttribute(attr.name);
    }
  }
  rich.replaceChildren(...parsed.body.childNodes);
  // Conteudo existente validado pelo servidor; colagens entram como texto.
  rich.addEventListener('input', () => change(() => setAt(path, rich.innerHTML)));
  for (const event of ['keyup','mouseup','focusout']) rich.addEventListener(event, () => rememberRange(rich));
  rich.addEventListener('paste', event => {
    event.preventDefault();
    rememberRange(rich);
    insertRich(rich, document.createTextNode(event.clipboardData.getData('text/plain')));
  });
  rich.addEventListener('drop', event => event.preventDefault());
  const tools = el('div',{className:'rich-tools'});
  const tool = (text, fn) => tools.append(button(text, fn, {onmousedown:event => {rememberRange(rich);event.preventDefault();}}));
  tool('Negrito', () => insertRich(rich, el('strong',{}, (!savedRange.get(rich) || savedRange.get(rich).collapsed) ? 'Texto em destaque' : undefined), true));
  tool('Itálico', () => insertRich(rich, el('em',{}, (!savedRange.get(rich) || savedRange.get(rich).collapsed) ? 'Texto em destaque' : undefined), true));
  tool('+ Parágrafo', () => {savedRange.delete(rich);insertRich(rich, el('p',{},'Escreva seu texto aqui.'));});
  tool('+ Título', () => {savedRange.delete(rich);insertRich(rich, el('h3',{},'Novo título'));});
  tool('+ Lista', () => {const ul = el('ul');ul.append(el('li',{},'Novo item'));savedRange.delete(rich);insertRich(rich,ul);});
  tool('+ Card', () => {
    const card = el('div',{className:'bento-item'});card.append(el('h4',{},'Novo card'),el('p',{},'Descrição do card.'));
    savedRange.delete(rich);insertRich(rich,card);
  });
  tool('+ Imagem', () => openGallery(asset => insertRich(rich,el('img',{src:asset.path,alt:asset.label,width:64,height:64,loading:'lazy'}))));
  tool('Remover card', () => {
    const range = savedRange.get(rich);
    const node = range?.startContainer.nodeType === 1 ? range.startContainer : range?.startContainer.parentElement;
    const card = node?.closest('.bento-item');
    if (card && rich.contains(card) && confirm('Remover este card inteiro?')) {
      change(() => {card.remove();setAt(path,rich.innerHTML);});
    } else if (!card) status('Clique primeiro dentro do card que deseja remover.');
  });
  tool('Remover bloco', () => {
    const range = savedRange.get(rich);
    const node = range?.startContainer.nodeType === 1 ? range.startContainer : range?.startContainer.parentElement;
    const block = node?.closest('p,h2,h3,h4,h5,li,tr,.bento-item');
    if (block && rich.contains(block) && confirm('Remover este bloco de texto/card?')) {
      change(() => {block.remove();setAt(path,rich.innerHTML);});
    } else if (!block) status('Clique primeiro dentro do parágrafo, linha ou card que deseja remover.');
  });
  const advanced = el('details'), source = el('textarea',{className:'rich-source',value,'aria-label':'HTML do conteúdo'});
  advanced.append(el('summary',{},'HTML avançado'));
  advanced.addEventListener('toggle', () => {if (advanced.open) source.value = at(path);});
  source.addEventListener('input', () => {
    change(() => setAt(path, source.value));
    // Nao executar nem inserir HTML arbitrario antes da validacao do servidor.
    status('HTML atualizado no rascunho. Use Atualizar prévia para validar. Reabra o card após validar para edição visual.');
  });
  advanced.append(source);
  parent.append(tools,rich,advanced);
}
function renderValue(parent, path, s, key) {
  const value = at(path);
  if (Array.isArray(value)) {
    const box = el('fieldset'), head = el('div',{className:'array-header'});
    head.append(el('label',{},label(key)),button('+ Adicionar', () => change(() => value.push(fallback(s.items,['types','tipos'].includes(key) ? 'type' : '')), true)));
    if (filename === 'pages.json' && key === 'cards') {
      head.append(button('Adicionar de modelo', () => {
        $('template-list').replaceChildren(...doc.templates.map(template => button(template.title, () => {
          change(() => value.push(clone(template)), true);
          $('template-dialog').close();
        })));
        $('template-dialog').showModal();
      }));
    }
    box.append(head);
    value.forEach((item,i) => {
      const p = [...path,i];
      const actions = el('div',{className:'row-actions'});
      actions.append(
        button('↑', () => change(() => {[value[i-1],value[i]]=[value[i],value[i-1]];},true),{disabled:i===0,'aria-label':'Mover para cima'}),
        button('↓', () => change(() => {[value[i+1],value[i]]=[value[i],value[i+1]];},true),{disabled:i===value.length-1,'aria-label':'Mover para baixo'}),
        button('Duplicar', () => change(() => value.splice(i+1,0,clone(item)),true)),
        button('Remover', () => {if(confirm('Remover esta entrada da lista?')) change(() => value.splice(i,1),true);},{className:'danger'}),
      );
      if (filename === 'pages.json' && key === 'cards') actions.append(button('Guardar como modelo', () => change(() => doc.templates.push(clone(item)), true)));
      if (item && typeof item === 'object') {
        const details = el('details');
        details.append(el('summary',{},entryName(item,i+1)),actions);
        const fields = el('div',{className:'fields'});renderValue(fields,p,s.items,i+1);details.append(fields);box.append(details);
      } else {
        const row = el('div');renderValue(row,p,s.items,['types','tipos'].includes(key) ? 'type' : i+1);row.append(actions);box.append(row);
      }
    });
    if (!value.length) box.append(el('p',{className:'empty'},'Lista vazia. Você pode adicionar entradas.'));
    parent.append(box);return;
  }
  if (value && typeof value === 'object') {
    for (const [field,child] of Object.entries(value)) {
      const p = [...path,field];
      if (child && typeof child === 'object' && !Array.isArray(child)) {
        const details = el('details');
        details.append(el('summary',{},label(field)));
        const wrap = el('div',{className:'fields'});renderValue(wrap,p,s.properties[field],field);details.append(wrap);parent.append(details);
      } else renderValue(parent,p,s.properties[field],field);
    }
    const missing = Object.keys(s.properties || {}).filter(k => !(k in value));
    if (missing.length) {
      const wrap = el('div',{className:'optional-fields'}), select = el('select',{'aria-label':'Campo opcional'});
      missing.forEach(k => select.append(el('option',{value:k},label(k))));
      wrap.append(select,button('Adicionar campo', () => change(() => {value[select.value]=fallback(s.properties[select.value],select.value);},true)));
      parent.append(wrap);
    }
    return;
  }
  const field = el('div',{className:'field'}), id = 'field-' + path.map(String).join('-');
  field.append(el('label',{htmlFor:id},(s.label || label(key))));
  if (key === 'content' || key === 'desc') {
    richField(field,path,value || '');parent.append(field);return;
  }
  let input;
  if (s.enum || key === 'type') {
    input=el('select',{id});
    [...new Set([...(s.enum || TYPES),value])].forEach(t => input.append(el('option',{value:t},t)));
    input.value=value;
  } else if (typeof value === 'boolean') {
    input=el('input',{id,type:'checkbox',checked:value});input.style.width='auto';
  } else {
    const long = typeof value === 'string' && value.length > 90;
    input=el(long ? 'textarea' : 'input',{id,value:value ?? '',...(long ? {} : {type:typeof value === 'number' ? 'number' : 'text'})});
    if (typeof value === 'number') {
      input.step='1';
      if (['id','pokemonId'].includes(key)) {input.min=String(s.minimum ?? 1);input.max='386';}
      if ('minimum' in s) input.min=String(s.minimum);
      if ('maximum' in s) input.max=String(s.maximum);
      if (key === 'level') {input.min='1';input.max='100';}
    }
  }
  input.addEventListener('input', () => {
    const next = typeof value === 'boolean' ? input.checked : typeof value === 'number' ? Number(input.value) : input.value;
    change(() => setAt(path,next));
  });
  const row = el('div',{className:'field-row'});row.append(input);
  if (['id','pokemonId'].includes(key) && typeof value === 'number') {
    if(value) row.append(el('img',{src:'/img/pokemon/full/'+value+'.png',alt:'Sprite do Pokémon'}));
    row.append(button('Escolher', () => openGallery(asset => change(() => {
      setAt(path,asset.id);
      const poke = catalog.pokemon.find(p => p.id === asset.id), obj=at(path.slice(0,-1));
      if ('name' in obj) obj.name=poke.nome.charAt(0).toUpperCase()+poke.nome.slice(1);
      if ('types' in obj) obj.types=clone(poke.tipos);
    },true),'pokemon')));
  } else if (['sprite','spriteAlt','brainSprite','image'].includes(key)) {
    if (value) row.append(el('img',{src:'/'+value.replace(/^\.\//,''),alt:'Imagem selecionada'}));
    row.append(button('Escolher', () => openGallery(asset => change(() => setAt(path,asset.path),true),'assets')));
  }
  field.append(row);
  if (key === 'level' && typeof value === 'string') field.append(el('small',{},'Este card usa nível textual (por exemplo, “Igual”).'));
  parent.append(field);
}
async function openDocument(name, force = false) {
  if (filename && dirty() && !force && !confirm('Trocar de arquivo? Seu rascunho ficará guardado neste navegador.')) {
    $('document').value=filename;return;
  }
  clearTimeout(draftTimer);
  if (!persistDraft()) {$('document').value=filename;return;}
  const request = ++sequence;
  loading=true;$('document').disabled=true;status('Carregando conteúdo…');
  try {
    const result=await api('document/'+name);
    if(request!==sequence)return;
    filename=name;doc=result.data;revision=result.revision;schema=result.schema;
    original=JSON.stringify(doc);undoStack=[];redoStack=[];
    const saved=localStorage.getItem(draftKey());
    if(saved&&!force&&confirm('Existe um rascunho deste conteúdo. Deseja recuperá-lo?')) {
      const draft=JSON.parse(saved);doc=draft.data;revision=draft.revision;
    } else if(force) localStorage.removeItem(draftKey());
    sections=collectSections(doc,schema);
    $('section').replaceChildren(...sections.map((s,i) => el('option',{value:i},s.title)));
    sectionPath=sections[0].path;selected=entries()[0]?.path || null;
    $('search').value='';
    for(const id of ['section','export','import','reload','preview','backups']) $(id).disabled=false;
    $('document').value=filename;
    status('Arquivo aberto. Edições ficam em rascunho até você salvar.');
    render();
    if(filename==='i18n/en.json') status('Dicionário em inglês. Os textos editoriais dos guias mantêm o idioma em que foram escritos.');
    await preview();
  } catch(error) {status(error.message,true);}
  finally {loading=false;$('document').disabled=false;if(doc) {renderList();updateState();}}
}
function context() {
  const group=sectionPath[0], tab=sectionPath[1];
  let version=$('preview-version').value;
  if(['emerald','ruby-sapphire','firered-leafgreen'].includes(group)) version=group;
  if(group==='kanto')version='firered-leafgreen';
  if(group==='hoenn'&&version==='firered-leafgreen')version='emerald';
  if(filename==='frontier.json')version='emerald';
  $('preview-version').value=version;
  const out={version,lang:filename==='i18n/en.json'?'en':'pt',route:'',};
  if(filename==='gyms.json')Object.assign(out,{route:'gyms',gymTab:tab});
  if(filename==='key-items.json')out.route='items';
  if(filename==='guides.json')Object.assign(out,{route:'guides',guideTab:group});
  if(filename==='extras.json')Object.assign(out,{route:'extras',extrasTab:tab==='events'?'gifts':tab});
  if(filename==='frontier.json')Object.assign(out,{route:'frontier',frontierTab:group==='special_pokemon'?'pokemon':group==='tutors'?'shops':group});
  if(filename==='machines.json')Object.assign(out,{route:'tms',tmTab:'tms'});
  if(filename==='tutors.json')Object.assign(out,{route:'tms',tmTab:'tutors'});
  if(filename.startsWith('i18n/'))out.route='pokemon/1';
  if(filename==='interface.json') {out.lang=group;out.route='gyms';}
  if(filename==='pokemon-overrides.json')out.route='pokemon/'+(currentEntry()?.value.pokemonId || 1);
  if(filename==='pages.json') {
    if(group==='templates') {out.route='page/modelo-preview';out.templateIndex=currentEntry()?.key;}
    else {
      const page=currentEntry()?.value;
      out.pageSlug=page?.slug || '';
      out.route=page?'page/'+page.slug:'';
    }
  }
  return out;
}
async function preview() {
  if(!doc)return;
  const request=++previewSequence;
  $('preview').disabled=true;status('Validando e preparando a prévia…');
  try {
    const c=context();
    const result=await api('preview',{name:filename,data:doc,context:c});
    if(request!==previewSequence)return;
    const frame=$('preview-frame');
    const loaded=new Promise(resolve=>{
      const done=()=>{clearTimeout(timer);frame.removeEventListener('load',done);resolve();};
      const timer=setTimeout(done,15000);
      frame.addEventListener('load',done);
    });
    frame.src=result.url+'#'+c.route;
    $('preview-empty').hidden=true;
    await loaded;
    if(request!==previewSequence)return;
    $('wide').disabled=false;
    status('Prévia atualizada com o rascunho. Nenhum arquivo foi gravado.');
  } catch(error){status('Prévia não atualizada: '+error.message,true);}
  finally {if(request===previewSequence)$('preview').disabled=false;}
}
function openGallery(callback, mode='all') {
  galleryCallback=callback;
  const assets=[];
  if(mode!=='assets') for(const p of catalog.pokemon)
    assets.push({label:p.id+' · '+p.nome,id:p.id,path:'img/pokemon/'+$('preview-version').value+'/'+p.id+'.png'});
  if(mode!=='pokemon') for(const path of catalog.assets)
    assets.push({label:path.split('/').at(-1).replace('.png','').replaceAll('_',' '),path});
  const draw=() => {
    const term=$('gallery-search').value.toLowerCase();
    $('gallery-items').replaceChildren(...assets.filter(a=>(a.label+' '+a.path).toLowerCase().includes(term)).slice(0,150).map(asset => {
      const b=button('',()=>{$('gallery').close();galleryCallback(asset);});
      b.append(el('img',{src:'/'+asset.path,alt:'',loading:'lazy'}),el('span',{},asset.label));return b;
    }));
  };
  refreshGallery = () => {
    for(const path of catalog.assets) if(mode !== 'pokemon' && !assets.some(a=>a.path===path)) assets.push({label:path.split('/').at(-1),path});
    draw();
  };
  $('upload-image').hidden=mode==='pokemon';$('gallery-status').textContent='';
  $('gallery-search').value='';$('gallery-search').oninput=draw;draw();$('gallery').showModal();$('gallery-search').focus();
}
$('document').addEventListener('change',()=>openDocument($('document').value));
$('section').addEventListener('change',()=>{sectionPath=sections[Number($('section').value)].path;selected=entries()[0]?.path||null;$('search').value='';render();preview();});
$('search').addEventListener('input',renderList);
$('form').addEventListener('submit',e=>e.preventDefault());
$('preview').onclick=preview;
$('preview-version').onchange=preview;
$('mobile').onclick=()=>{const mobile=$('preview-wrap').classList.toggle('mobile');$('mobile').setAttribute('aria-pressed',String(mobile));};
$('wide').disabled=true;
$('wide').onclick=()=>{if($('preview-frame').getAttribute('src'))window.open($('preview-frame').src,'_blank','noopener');};
function uniquePageSlug(base) {
  const used=new Set(doc.pages.map(page=>page.slug));
  let slug=base,number=2;
  while(used.has(slug))slug=base+'-'+number++;
  return slug;
}
$('add').onclick=()=>change(()=>{
  const list=at(sectionPath),value=fallback(schemaAt(sectionPath).items);
  if(filename==='pages.json' && sectionPath[0]==='pages')value.slug=uniquePageSlug('nova-pagina');
  list.push(value);selected=[...sectionPath,list.length-1];$('search').value='';
},true);
$('duplicate').onclick=()=>change(()=>{const e=currentEntry(),list=at(sectionPath);const value=clone(e.value);if(filename==='pages.json'&&sectionPath[0]==='pages')value.slug=uniquePageSlug(value.slug+'-copia');list.splice(e.key+1,0,value);selected=[...sectionPath,e.key+1];},true);
for(const [id,offset] of [['move-up',-1],['move-down',1]]) $(id).onclick=()=>change(()=>{const e=currentEntry(),list=at(sectionPath),next=e.key+offset;[list[e.key],list[next]]=[list[next],list[e.key]];selected=[...sectionPath,next];},true);
$('remove').onclick=()=>{const e=currentEntry();if(confirm('Remover “'+entryName(e.value,e.key)+'”? Você poderá desfazer antes de salvar.'))change(()=>{at(sectionPath).splice(e.key,1);selected=entries()[Math.max(0,e.key-1)]?.path||null;},true);};
$('undo').onclick=()=>{if(!undoStack.length)return;redoStack.push(clone(doc));doc=undoStack.pop();if(!currentEntry())selected=entries()[0]?.path||null;render();};
$('redo').onclick=()=>{if(!redoStack.length)return;undoStack.push(clone(doc));doc=redoStack.pop();if(!currentEntry())selected=entries()[0]?.path||null;render();};
$('save').onclick=async()=>{
  if(loading || !dirty())return;
  const reviewedName=filename, reviewedRevision=revision, reviewed=clone(doc);
  const accepted=await reviewChanges(JSON.parse(original),reviewed,{
    title:'Revisar antes de salvar',confirmText:'Confirmar e salvar',
    description:'Confira o que será alterado em '+catalog.documents[filename]+'. A versão anterior terá um backup.',label
  });
  if(!accepted)return;
  if(filename!==reviewedName || revision!==reviewedRevision || JSON.stringify(doc)!==JSON.stringify(reviewed)) {
    status('O rascunho mudou. Revise novamente antes de salvar.',true);return;
  }
  loading=true;$('document').disabled=true;$('section').disabled=true;renderList();updateState();
  const snapshot=clone(doc),savedName=filename;
  try {
    const result=await api('save',{name:filename,data:snapshot,revision});
    if(filename===savedName){revision=result.revision;original=JSON.stringify(snapshot);persistDraft();}
    status(result.unchanged?'Arquivo já estava atualizado.':'Salvo no projeto. Backup anterior: '+result.backup);
  } catch(error){status(error.message,true);}
  finally{loading=false;$('document').disabled=false;$('section').disabled=false;renderList();updateState();}
};
$('backups').onclick=async()=>{
  const name=filename;
  $('backup-list').replaceChildren();
  $('backup-status').textContent='Carregando backups.';
  $('backups-dialog').showModal();
  try {
    const result=await api('backups/'+name);
    $('backup-status').textContent=result.backups.length ? result.backups.length+' versões disponíveis para '+catalog.documents[name]+'.' : 'Ainda não há backups deste documento. Eles são criados antes de cada alteração salva.';
    for(const backup of result.backups) {
      const entry=button(new Date(backup.date).toLocaleString('pt-BR')+' · '+Math.ceil(backup.size/1024)+' KB',async()=>{
        entry.disabled=true;
        try {
          const result=await api('backup',{name,id:backup.id});
          const before=clone(doc);
          const accepted=await reviewChanges(before,result.data,{
            title:'Comparar com o backup',confirmText:'Carregar como rascunho',
            description:'Antes: rascunho atual. Depois: backup de '+new Date(backup.date).toLocaleString('pt-BR')+'. Você poderá desfazer a restauração.',label
          });
          if(!accepted)return;
          if(filename!==name || JSON.stringify(doc)!==JSON.stringify(before))throw new Error('O rascunho mudou. Reabra o histórico.');
          change(()=>{doc=result.data;});
          sections=collectSections(doc,schema);
          $('section').replaceChildren(...sections.map((s,i)=>el('option',{value:i},s.title)));
          sectionPath=sections[0].path;selected=entries()[0]?.path||null;
          $('search').value='';render();persistDraft();
          $('backups-dialog').close();
          await preview();
          status('Backup carregado como rascunho. Confira a prévia e clique em Salvar no projeto para restaurar.');
        }catch(error){$('backup-status').textContent=error.message;}
        finally{entry.disabled=false;}
      });
      $('backup-list').append(entry);
    }
  }catch(error){$('backup-status').textContent=error.message;}
};
$('close-backups').onclick=()=>$('backups-dialog').close();
$('export').onclick=()=>{
  persistDraft();
  const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)+'\n'],{type:'application/json'}));
  const a=el('a',{href:url,download:filename.replaceAll('/','-')});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('import').onclick=()=>$('import-file').click();
$('import-file').onchange=async()=>{
  const file=$('import-file').files[0];if(!file)return;
  try {
    if(file.size>2000000)throw new Error('Arquivo muito grande.');
    const data=JSON.parse(await file.text());
    await api('preview',{name:filename,data,context:context()});
    if(confirm('Substituir o rascunho pelo conteúdo importado?')) {
      change(()=>{doc=data;},false);sections=collectSections(doc,schema);selected=entries()[0]?.path||null;render();preview();
    }
  }catch(error){status('Importação recusada: '+error.message,true);}
  finally{$('import-file').value='';}
};
$('reload').onclick=()=>{if(!dirty()||confirm('Descartar o rascunho e reabrir a versão salva no projeto?'))openDocument(filename,true);};
$('help').onclick=e=>{e.preventDefault();$('help-dialog').showModal();};
$('close-help').onclick=()=>$('help-dialog').close();
$('close-gallery').onclick=()=>$('gallery').close();
$('close-template').onclick=()=>$('template-dialog').close();
$('upload-image').onclick=()=>$('image-file').click();
$('image-file').onchange=async()=>{
  const file=$('image-file').files[0];if(!file)return;
  $('upload-image').disabled=true;$('gallery-status').textContent='Importando imagem…';
  try {
    const result=await importImage(file,api);
    if(!catalog.assets.includes(result.path))catalog.assets.push(result.path);
    $('gallery-search').value=result.path.split('/').at(-1);
    refreshGallery?.();
    $('gallery-status').textContent='Imagem adicionada ao projeto. Clique nela para usar e inclua o arquivo no próximo commit.';
  }catch(error){$('gallery-status').textContent=error.message;}
  finally{$('upload-image').disabled=false;$('image-file').value='';}
};
window.addEventListener('beforeunload',event=>{if(loading||hasPendingDrafts()){persistDraft();event.preventDefault();event.returnValue='';}});
window.addEventListener('pagehide',()=>{if(doc)persistDraft();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&doc)persistDraft();});
try {
  catalog=await api('catalog');
  initWorkspace(api,()=>{
    const prefix='wiki-editor-draft:'+catalog.project+':';
    const drafts=[];
    for(const key of Object.keys(localStorage)) {
      if(key.startsWith(prefix)&&key!==draftKey()) {
        try{drafts.push({name:key.slice(prefix.length),data:JSON.parse(localStorage.getItem(key)).data});}catch{}
      }
    }
    if(doc&&dirty())drafts.push({name:filename,data:doc});
    return drafts;
  });
  $('backup-help').textContent='Backups por gravação: '+catalog.backupDir;
  $('document').replaceChildren(...Object.entries(catalog.documents).map(([value,text])=>el('option',{value},text)));
  $('document').disabled=false;
  await openDocument('gyms.json');
} catch(error) {
  status(error.message+' Inicie “Iniciar editor.cmd” e use o endereço que ele abrir.',true);
}
