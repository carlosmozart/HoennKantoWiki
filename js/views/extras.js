// Presentes, trocas e exclusivos por versao. Dados em data/extras.json.

import { spriteCheio } from '../core/sprites.js';

import { getExtras } from '../core/dataset.js';

let GAME_EXTRAS = null;

export function initExtras() {
    const tabs = document.querySelectorAll('.extras-main-tab');
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderExtrasTab(btn.dataset.tab);
        });
    });
}

export async function renderExtras() {
    GAME_EXTRAS = await getExtras().catch(() => null);
    if (!GAME_EXTRAS) return;
    const activeBtn = document.querySelector('.extras-main-tab.active') || document.querySelector('.extras-main-tab');
    
    // Atualiza título da seção com base na versão
    const titleEl = document.querySelector('#view-extras h2');
    const descEl = document.querySelector('#view-extras p');
    if (app.state.versionGroup === 'firered-leafgreen') {
        titleEl.textContent = 'Extras de FireRed & LeafGreen';
        descEl.textContent = 'Informações detalhadas sobre Pokémon presenteados (Gifts/Eventos), trocas no jogo (In-Game Trades) e exclusivos (Inobtíveis).';
    } else if (app.state.versionGroup === 'ruby-sapphire') {
        titleEl.textContent = 'Extras de Ruby & Sapphire';
        descEl.textContent = 'Informações detalhadas sobre Pokémon presenteados (Gifts/Eventos), trocas no jogo (In-Game Trades) e exclusivos (Inobtíveis).';
    } else {
        titleEl.textContent = 'Extras do Pokémon Emerald';
        descEl.textContent = 'Informações detalhadas sobre Pokémon presenteados (Gifts/Eventos), trocas no jogo (In-Game Trades) e exclusivos (Inobtíveis).';
    }

    if (activeBtn) {
        renderExtrasTab(activeBtn.dataset.tab);
    }
}

function renderExtrasTab(tabName) {
    const grid = document.getElementById('extras-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
    grid.style.gap = '20px';

    const version = app.state.versionGroup || 'emerald';
    const EXTRAS_DATA = GAME_EXTRAS[version] || GAME_EXTRAS['emerald'];

    let dataList = [];
    if (tabName === 'gifts') {
        dataList = (EXTRAS_DATA.gifts || []).concat(EXTRAS_DATA.events || []);
    } else if (tabName === 'trades') {
        dataList = EXTRAS_DATA.trades || [];
    } else if (tabName === 'missing') {
        dataList = EXTRAS_DATA.missing || [];
    }

    if (!dataList || dataList.length === 0) {
        grid.innerHTML = '<p data-ui=labels.text_7511e35f6e>Nenhum dado encontrado.</p>';
        return;
    }

    let html = '';

    const renderCard = (p) => {
        let typesHtml = '';
        if (p.types) {
            typesHtml = p.types.map(t => {
                let ptName = typeof TYPE_TRANSLATIONS !== 'undefined' ? (TYPE_TRANSLATIONS[t] || t) : t;
                return `<span class="pokemon-type-badge badge-${t}" style="display:inline-block; font-size:0.65rem; padding: 3px 6px; margin: 2px;">${ptName.toUpperCase()}</span>`;
            }).join('');
        }

        let detailsHtml = '';
        if (p.level) detailsHtml += `<div><strong data-ui=labels.text_30eff74c8a>Nível:</strong> ${p.level}</div>`;
        if (p.ability) detailsHtml += `<div><strong data-ui=labels.text_17d2a6ed1e>Hab:</strong> ${p.ability}</div>`;
        if (p.item) detailsHtml += `<div><strong data-ui=labels.text_ab12e73f5e>Item:</strong> ${p.item}</div>`;

        let movesHtml = '';
        if (p.moves && p.moves.length > 0) {
            movesHtml = `<div style="margin-top:8px;">` + p.moves.map(m => `<span style="display:inline-block; background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:4px; font-size:0.75rem; margin:2px;">${m}</span>`).join('') + `</div>`;
        }

        return `
            <div class="bento-item frontier-facility-card" style="padding: 15px; cursor: pointer; transition: transform 0.2s;" onclick="playClickSound(); window.location.hash='pokemon/${p.id}'" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                <div style="display:flex; align-items:center; gap: 15px;">
                    <img src="${spriteCheio(p.id)}" alt="${p.name}" loading="lazy" decoding="async" style="width:96px; height:96px; filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.5));">
                    <div>
                        <h3 style="margin-bottom: 5px; font-size:1.2rem; border-bottom:none;">${p.name}</h3>
                        <div style="margin-bottom: 5px;">${typesHtml}</div>
                        <div style="font-size: 0.85rem; color: var(--text-color);">
                            ${detailsHtml}
                        </div>
                    </div>
                </div>
                ${movesHtml}
                <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid var(--glass-border); font-size: 0.9rem; line-height: 1.4; color: var(--text-color);">
                    ${p.desc}
                </div>
            </div>
        `;
    };

    dataList.forEach(p => {
        html += renderCard(p);
    });

    grid.innerHTML = html;
}
