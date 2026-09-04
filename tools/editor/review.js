// Comparacao textual segura: nenhum HTML do documento e executado.
export function changesBetween(before, after, path = [], out = []) {
  if (JSON.stringify(before) === JSON.stringify(after)) return out;
  const object = value => value !== null && typeof value === 'object';
  if (object(before) && object(after) && Array.isArray(before) === Array.isArray(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)]))
      changesBetween(before[key], after[key], [...path, Array.isArray(after) ? Number(key) : key], out);
  } else out.push({path, before, after});
  return out;
}
export function reviewChanges(before, after, {title, confirmText, description, label}) {
  const dialog = document.getElementById('review-dialog');
  const list = document.getElementById('review-list');
  const changes = changesBetween(before, after);
  document.getElementById('review-title').textContent = title;
  document.getElementById('review-description').textContent = description;
  document.getElementById('review-count').textContent = changes.length + (changes.length === 1 ? ' alteração.' : ' alterações.') + ' Posições nas listas começam em 1; mover cards pode alterar várias posições.';
  const confirm = document.getElementById('confirm-review');
  confirm.textContent = confirmText;
  confirm.disabled = !changes.length;
  list.replaceChildren();
  const node = (tag, text) => {const n = document.createElement(tag); n.textContent = text; return n;};
  const value = v => v === undefined ? '(ausente)' : typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  for (const change of changes.slice(0, 300)) {
    const card = document.createElement('article');
    card.className = 'review-change';
    card.append(node('h3', change.path.map(k => typeof k === 'number' ? '['+(k+1)+']' : label(k)).join(' / ') || 'Documento'));
    const columns = document.createElement('div'); columns.className = 'review-columns';
    for (const [heading, data] of [['Antes', change.before], ['Depois', change.after]]) {
      const column = document.createElement('div');
      column.append(node('strong', heading), node('pre', value(data)));
      columns.append(column);
    }
    card.append(columns); list.append(card);
  }
  if(changes.length > 300) list.append(node('p', 'Exibindo as primeiras 300 alterações. Exporte o rascunho para revisar o documento completo.'));
  return new Promise(resolve => {
    let accepted = false;
    const accept = () => {accepted = true; dialog.close();};
    const cancel = () => dialog.close();
    const close = () => {
      confirm.removeEventListener('click', accept);
      document.getElementById('cancel-review').removeEventListener('click', cancel);
      resolve(accepted);
    };
    confirm.addEventListener('click', accept);
    document.getElementById('cancel-review').addEventListener('click', cancel);
    dialog.addEventListener('close', close, {once:true});
    dialog.showModal();
    document.getElementById('cancel-review').focus();
  });
}
