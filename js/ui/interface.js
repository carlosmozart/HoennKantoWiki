import { getInterface } from '../core/dataset.js';

let dictionary = {};
let observer;
let activeLang = 'pt';
const lookup = (data, path) => path.split('.').reduce((value, key) => value?.[key], data);

export function interfaceText(key, fallback = '', lang = activeLang) {
    const value = lookup(dictionary[lang], key) || lookup(dictionary.pt, key) || fallback;
    const games = {'emerald':'Emerald','ruby-sapphire':'Ruby / Sapphire','firered-leafgreen':'FireRed / LeafGreen'};
    return String(value).replaceAll('{jogo}', games[window.app?.state.versionGroup] || 'Emerald');
}

function applyNode(node) {
    if (!(node instanceof Element)) return;
    const textKey = node.getAttribute('data-ui');
    if (textKey) {
        const value = interfaceText(textKey, node.textContent);
        if (node.textContent !== value) node.textContent = value;
    }
    const placeholderKey = node.getAttribute('data-ui-placeholder');
    if (placeholderKey) node.setAttribute('placeholder', interfaceText(placeholderKey, node.getAttribute('placeholder')));
}

function applyTree(root) {
    applyNode(root);
    root.querySelectorAll?.('[data-ui],[data-ui-placeholder]').forEach(applyNode);
}

export async function applyInterface(lang) {
    dictionary = await getInterface().catch(() => ({}));
    activeLang = lang;
    applyTree(document);
    if (!observer) {
        observer = new MutationObserver(records => {
            for (const record of records) {
                applyNode(record.target.nodeType === 1 ? record.target : record.target.parentElement);
                record.addedNodes.forEach(applyTree);
            }
        });
        observer.observe(document.body, {childList:true,subtree:true,characterData:true});
        document.addEventListener('change', event => {
            if (event.target.id === 'game-version-select') queueMicrotask(() => applyTree(document));
        });
    }
    document.dispatchEvent(new CustomEvent('wiki:language', {detail:lang}));
}
