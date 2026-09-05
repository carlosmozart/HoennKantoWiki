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
                (attr.name === 'style' && /url|expression|@import|behavior|binding|\\/i.test(attr.value))) node.removeAttribute(attr.name);
        }
    }
    holder.append(...parsed.body.childNodes);
    return holder;
}

let navigation;
let latest = 0;
const available = (page, version) => page.visible && (!page.versions.length || page.versions.includes(version));
const activePage = (slug) => location.hash === '#page/' + slug || location.hash.startsWith('#page/' + slug + '/');
const versionsAllow = (entry, version) => entry.visible !== false && (!entry.versions?.length || entry.versions.includes(version));

function pageLink(entry, lang) {
    const link = element('a', localized(entry,'label',lang), 'nav-btn custom-nav-link');
    link.href = '#page/' + entry.pageSlug;
    link.classList.toggle('active', activePage(entry.pageSlug));
    if (activePage(entry.pageSlug)) link.setAttribute('aria-current','page');
    return link;
}

function navigationEntry(entry, version, lang, targetAvailable) {
    if (!versionsAllow(entry,version)) return null;
    const children = (entry.children || []).filter(child => versionsAllow(child,version) && child.pageSlug && targetAvailable(child.pageSlug));
    if (children.length) {
        const group = element('details','','custom-submenu');
        group.open = children.some(child => activePage(child.pageSlug));
        group.append(element('summary',localized(entry,'label',lang),'custom-submenu-title'));
        const links = element('div','','custom-submenu-links');
        links.append(...children.map(child => pageLink(child,lang)));
        group.append(links);
        return group;
    }
    return entry.pageSlug && targetAvailable(entry.pageSlug) ? pageLink(entry,lang) : null;
}

export async function refreshCustomNavigation() {
    const data = await getPages().catch(() => ({navigation:[],pages:[]}));
    const app = window.app;
    if (!app) return;
    navigation ||= document.querySelector('#custom-navigation');
    if (!navigation) return;
    navigation.replaceChildren();
    const targetAvailable = slug => data.pages.some(page => page.slug === slug && available(page,app.state.versionGroup));
    const referenced = new Set();
    for (const menu of data.navigation || []) if (versionsAllow(menu,app.state.versionGroup)) for (const entry of menu.entries || []) {
        if (!versionsAllow(entry,app.state.versionGroup)) continue;
        if (entry.pageSlug) referenced.add(entry.pageSlug);
        for (const child of entry.children || []) if (versionsAllow(child,app.state.versionGroup) && child.pageSlug) referenced.add(child.pageSlug);
    }
    for (const menu of data.navigation || []) {
        if (!versionsAllow(menu,app.state.versionGroup)) continue;
        const entries = (menu.entries || []).map(entry => navigationEntry(entry,app.state.versionGroup,app.state.lang,targetAvailable)).filter(Boolean);
        if (!entries.length) continue;
        const group = element('details','','custom-menu');
        group.open = entries.some(entry => entry.matches?.('.active') || entry.querySelector?.('.active'));
        group.append(element('summary',localized(menu,'label',app.state.lang),'custom-menu-title'));
        const content = element('div','','custom-menu-content');
        content.append(...entries);group.append(content);navigation.append(group);
    }
    for (const page of data.pages.filter(page => available(page,app.state.versionGroup) && !referenced.has(page.slug))) {
        navigation.append(pageLink({label:localized(page,'menuLabel',app.state.lang) || localized(page,'title',app.state.lang),pageSlug:page.slug},app.state.lang));
    }
    navigation.hidden = !navigation.childElementCount;
}

export async function renderCustomPage(slug, requestedTab = '') {
    const request = ++latest;
    const container = document.getElementById('custom-page-content');
    container.replaceChildren(element('p','Carregando.'));
    const data = await getPages().catch(() => ({pages:[]}));
    if (request !== latest) return;
    const app = window.app, lang = app.state.lang;
    const page = data.pages.find(candidate => candidate.slug === slug && available(candidate,app.state.versionGroup));
    container.replaceChildren();
    if (!page) {
        container.append(element('p',lang === 'en' ? 'Page unavailable for this game.' : 'Página indisponível para este jogo.'));
        return;
    }
    const title = localized(page,'title',lang);
    document.title = title + ' · WikiGen3';
    container.append(element('h2',title),element('p',localized(page,'description',lang)));
    const tabs = (page.tabs || []).filter(tab => tab.visible !== false);
    const selected = tabs.find(tab => tab.tabId === requestedTab) || tabs[0];
    if (tabs.length > 1) {
        const tabList = element('nav','','custom-page-tabs');
        tabList.setAttribute('aria-label',lang === 'en' ? 'Page sections' : 'Seções da página');
        for (const tab of tabs) {
            const link = element('a',localized(tab,'label',lang),'custom-page-tab');
            link.href = '#page/' + page.slug + '/' + tab.tabId;
            if (tab === selected) { link.classList.add('active'); link.setAttribute('aria-current','page'); }
            tabList.append(link);
        }
        container.append(tabList);
    }
    const grid = element('div','','custom-cards-grid');
    for (const card of selected?.cards || []) {
        const layout = ['vertical','horizontal','destaque'].includes(card.layout) ? card.layout : 'vertical';
        const article = element('article','', 'bento-item custom-card custom-card--'+layout);
        article.style.borderTopColor = 'var(--type-'+card.accent+', var(--primary-color))';
        const src = card.image || (card.pokemonId ? spritePokemon(card.pokemonId,{versao:app.state.versionGroup}) : '');
        if (allowedImage(src)) {
            const image = element('img','','custom-card-image');
            image.src = src;image.alt = localized(card,'title',lang);image.loading = 'lazy';image.decoding = 'async';article.append(image);
        }
        const body = element('div','','custom-card-body');
        body.append(element('h3',localized(card,'title',lang)),rich(localized(card,'content',lang)));
        if (card.item) {
            const line = element('div','','custom-item'), image = element('img');
            image.src = spriteItem(card.item);image.alt = '';image.width = 28;image.height = 28;
            image.addEventListener('error',()=>image.remove(),{once:true});line.append(image,element('span',card.item));body.append(line);
        }
        if (card.fields.length) {
            const fields = element('dl','','custom-fields');
            for (const field of card.fields) fields.append(element('dt',localized(field,'label',lang)),element('dd',localized(field,'value',lang)));
            body.append(fields);
        }
        if (allowedLink(card.link)) {
            const link = element('a',localized(card,'linkLabel',lang) || (lang === 'en' ? 'Read more' : 'Saiba mais'),'custom-card-link');
            link.href = card.link;body.append(link);
        }
        article.append(body);grid.append(article);
    }
    container.append(grid);
    refreshCustomNavigation();
}

function rerenderCurrentPage() {
    if (!location.hash.startsWith('#page/')) return;
    const [slug,tabId=''] = location.hash.slice(6).split('/');renderCustomPage(slug,tabId);
}

export function initCustomPages() {
    document.addEventListener('wiki:language',()=>{refreshCustomNavigation();rerenderCurrentPage();});
    document.addEventListener('change',event => {
        if (event.target.id === 'game-version-select') queueMicrotask(()=>{refreshCustomNavigation();rerenderCurrentPage();});
    });
    window.addEventListener('hashchange',refreshCustomNavigation);
}
