import { getPages } from '../core/dataset.js';
import { spritePokemon, spriteItem } from '../core/sprites.js';

const localized = (obj, key, lang) => (lang === 'en' && obj.en?.[key]) || obj[key] || '';
const element = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
};
const allowedImage = (value) => /^(?:\.\/)?(?:img|images)\/[a-z0-9_./ -]+\.(?:png|gif|jpe?g|webp)$/i.test(value || '') && !value.includes('..');
const allowedLink = (value) => /^(?:https?:\/\/|#(?:page|pokemon|guides)\/|#(?:map|guides|gyms|frontier|items|tms|extras)$)/.test(value || '');

function rich(content) {
    const holder = element('div', '', 'custom-rich');
    const parsed = new DOMParser().parseFromString(content || '', 'text/html');
    const tags = new Set('DIV P SPAN STRONG B EM I U S BR HR H2 H3 H4 H5 UL OL LI TABLE THEAD TBODY TFOOT TR TH TD SMALL A IMG BLOCKQUOTE CAPTION SUB SUP'.split(' '));
    for (const node of parsed.body.querySelectorAll('*')) {
        if (!tags.has(node.tagName)) { node.remove(); continue; }
        for (const attr of [...node.attributes]) {
            if (!['class','style','href','src','alt','title','width','height','colspan','rowspan','loading','decoding'].includes(attr.name) ||
                (attr.name === 'src' && !allowedImage(attr.value)) ||
                (attr.name === 'href' && !allowedLink(attr.value)) ||
                (attr.name === 'style' && /url|expression|@import|behavior|binding|\\/i.test(attr.value)))
                node.removeAttribute(attr.name);
        }
    }
    holder.append(...parsed.body.childNodes);
    return holder;
}

let navigation;
let latest = 0;
const available = (page, version) => page.visible && (!page.versions.length || page.versions.includes(version));

export async function refreshCustomNavigation() {
    const data = await getPages().catch(() => ({pages:[]}));
    const app = window.app;
    if (!app) return;
    navigation ||= document.querySelector('#custom-navigation');
    if (!navigation) return;
    navigation.replaceChildren();
    for (const page of data.pages.filter(p => available(p, app.state.versionGroup))) {
        const link = element('a', localized(page,'menuLabel',app.state.lang) || localized(page,'title',app.state.lang), 'nav-btn custom-nav-link');
        link.href = '#page/' + page.slug;
        link.classList.toggle('active', location.hash === link.hash);
        if (location.hash === link.hash) link.setAttribute('aria-current','page');
        navigation.append(link);
    }
    navigation.hidden = !navigation.childElementCount;
}

export async function renderCustomPage(slug) {
    const request = ++latest;
    const container = document.getElementById('custom-page-content');
    container.replaceChildren(element('p','Carregando…'));
    const data = await getPages().catch(() => ({pages:[]}));
    if (request !== latest) return;
    const app = window.app, lang = app.state.lang;
    const page = data.pages.find(p => p.slug === slug && available(p,app.state.versionGroup));
    container.replaceChildren();
    if (!page) {
        container.append(element('p',lang === 'en' ? 'Page unavailable for this game.' : 'Página indisponível para este jogo.'));
        return;
    }
    const title = localized(page,'title',lang);
    document.title = title + ' · WikiGen3';
    container.append(element('h2', title), element('p',localized(page,'description',lang)));
    const grid = element('div','','custom-cards-grid');
    for (const card of page.cards) {
        const layout = ['vertical','horizontal','destaque'].includes(card.layout) ? card.layout : 'vertical';
        const article = element('article','', 'bento-item custom-card custom-card--'+layout);
        article.style.borderTopColor = 'var(--type-'+card.accent+', var(--primary-color))';
        const src = card.image || (card.pokemonId ? spritePokemon(card.pokemonId,{versao:app.state.versionGroup}) : '');
        if (allowedImage(src)) {
            const image = element('img','','custom-card-image');
            image.src = src; image.alt = localized(card,'title',lang);
            image.loading = 'lazy'; image.decoding = 'async'; article.append(image);
        }
        const body = element('div','','custom-card-body');
        body.append(element('h3',localized(card,'title',lang)), rich(localized(card,'content',lang)));
        if (card.item) {
            const line = element('div','','custom-item');
            const image = element('img');
            image.src = spriteItem(card.item); image.alt = ''; image.width = 28; image.height = 28;
            image.addEventListener('error',()=>image.remove(),{once:true});
            line.append(image,element('span',card.item));body.append(line);
        }
        if (card.fields.length) {
            const fields = element('dl','','custom-fields');
            for (const field of card.fields) {
                fields.append(element('dt',localized(field,'label',lang)),element('dd',localized(field,'value',lang)));
            }
            body.append(fields);
        }
        if (allowedLink(card.link)) {
            const a = element('a',localized(card,'linkLabel',lang) || (lang==='en'?'Read more':'Saiba mais'),'custom-card-link');
            a.href = card.link;
            body.append(a);
        }
        article.append(body);grid.append(article);
    }
    container.append(grid);
    refreshCustomNavigation();
}

export function initCustomPages() {
    document.addEventListener('wiki:language', () => {
        refreshCustomNavigation();
        if (location.hash.startsWith('#page/')) renderCustomPage(location.hash.slice(6));
    });
    document.addEventListener('change', event => {
        if (event.target.id === 'game-version-select') queueMicrotask(() => {
            refreshCustomNavigation();
            if (location.hash.startsWith('#page/')) renderCustomPage(location.hash.slice(6));
        });
    });
    window.addEventListener('hashchange', refreshCustomNavigation);
}
