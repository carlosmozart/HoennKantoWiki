// Battle Frontier: abas, instalacoes e lojas de BP.
// Os dados sairam daqui para data/frontier.json.

import { spriteCheio, imgItem } from '../core/sprites.js';

import { getFrontier } from '../core/dataset.js';

let FRONTIER_DATA = null;

// Gerenciador de Abas da Battle Frontier
export function initFrontier() {
    const tabBtns = document.querySelectorAll('.frontier-main-tab');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFrontierTab(btn.dataset.tab);
        });
    });
}

export async function renderFrontier() {
    FRONTIER_DATA = await getFrontier().catch(() => null);
    if (!FRONTIER_DATA) return;
    // Renderiza a aba ativa inicialmente
    const activeBtn = document.querySelector('.frontier-main-tab.active') || document.querySelector('.frontier-main-tab');
    if (activeBtn) {
        renderFrontierTab(activeBtn.dataset.tab);
    }
};

function renderFrontierTab(tabName) {
    const grid = document.getElementById('frontier-grid');
    if (!grid) return;

    // Reset grid
    grid.innerHTML = '';
    
    // Forçamos o layout do grid para ter 1 coluna e se espalhar inteiro para itens longos
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '20px';

    let html = '';

    if (tabName === 'overview') {
        html += `
            <div class="grid-card bento-item" style="padding: 30px; text-align: center;">
                <h3 style="color:var(--type-electric); margin-bottom:20px; font-size:2rem;">${FRONTIER_DATA.overview.title}</h3>
                <img src="${FRONTIER_DATA.overview.image}" alt="Battle Frontier" loading="lazy" decoding="async" style="width:100%; max-width:900px; height:auto; margin-bottom: 30px; border-radius:15px; box-shadow:0 8px 24px rgba(0,0,0,0.6);">
                <p style="text-align:justify; color:var(--text-color); line-height:1.8; font-size:1.2rem; max-width: 900px; margin: 0 auto;">${FRONTIER_DATA.overview.desc}</p>
            </div>
        `;
    } 
    else if (tabName === 'facilities') {
        FRONTIER_DATA.facilities.forEach(fac => {
            let silverHtml = fac.silverTeam.length === 0 ? '<p style="color:var(--text-muted);font-style:italic;text-align:center;margin-top:10px;">Pokémon Alugados (Rental)</p>' : '';
            let goldHtml = fac.goldTeam.length === 0 ? '<p style="color:var(--text-muted);font-style:italic;text-align:center;margin-top:10px;">Pokémon Alugados (Rental)</p>' : '';

            // Renderizando Cards Detalhados dos Pokémon
            const renderPokeCard = (p) => {
                let typesHtml = p.types.map(t => {
                    let ptName = typeof TYPE_TRANSLATIONS !== 'undefined' ? (TYPE_TRANSLATIONS[t] || t) : t;
                    return `<span class="pokemon-type-badge badge-${t}" style="display:inline-block; font-size:0.65rem; padding: 3px 6px; margin: 2px;">${ptName.toUpperCase()}</span>`;
                }).join('');
                let movesHtml = p.moves.map(m => `<span style="display:inline-block; background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:4px; font-size:0.75rem; margin:2px;">${m}</span>`).join('');
                
                return `
                    <div onclick="playClickSound(); window.location.hash='pokemon/${p.id}'" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.03); border-radius:10px; padding:10px; box-shadow:0 2px 6px rgba(0,0,0,0.4); margin-bottom:10px; transition: transform 0.2s, background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='scale(1.02)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.transform='scale(1)';">
                        <img src="${spriteCheio(p.id)}" alt="${p.name}" loading="lazy" decoding="async" style="width:80px;height:80px; filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.5));" title="${p.name}">
                        <strong style="font-size:1.1rem; margin-bottom:5px;">${p.name}</strong>
                        <div style="margin-bottom:5px;">${typesHtml}</div>
                        <div style="font-size:0.8rem; color:var(--text-color); margin-bottom:5px;">Nv. ${p.level}</div>
                        <div style="font-size:0.8rem; background:rgba(0,0,0,0.2); padding: 4px 8px; border-radius:6px; width:100%; text-align:left; margin-bottom:5px;">
                            <div style="margin-bottom:2px;">🛡️ <strong>Item:</strong> <span style="color:var(--type-electric);">${p.item}</span></div>
                            <div>✨ <strong>Hab:</strong> ${p.ability}</div>
                        </div>
                        <div style="width:100%; text-align:center; margin-top:5px;">
                            ${movesHtml}
                        </div>
                    </div>
                `;
            };

            if (fac.silverTeam.length > 0) {
                silverHtml = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-top:15px;">`;
                fac.silverTeam.forEach(p => {
                    silverHtml += renderPokeCard(p);
                });
                silverHtml += `</div>`;
            }

            if (fac.goldTeam.length > 0) {
                goldHtml = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-top:15px;">`;
                fac.goldTeam.forEach(p => {
                    goldHtml += renderPokeCard(p);
                });
                goldHtml += `</div>`;
            }

            html += `
                <div class="grid-card bento-item" style="padding: 30px;">
                    <div style="display:flex; flex-wrap:wrap; gap:40px; align-items:center;">
                        
                        <div style="text-align:center; min-width: 250px; flex: 1;">
                            <img src="${fac.brainSprite}" alt="${fac.brain}" loading="lazy" decoding="async" style="height: 220px; object-fit: contain; filter: drop-shadow(4px 6px 8px rgba(0,0,0,0.5)); margin-bottom:20px;">
                            <h4 style="color:var(--type-fire); margin:0; font-size:1.3rem; text-transform:uppercase; letter-spacing:1px;">${fac.brainTitle}</h4>
                            <h3 style="margin:5px 0 0 0; font-size:2rem; font-weight:800;">${fac.brain}</h3>
                            
                            <div style="background:var(--stat-bar-bg); padding:12px; border-radius:10px; margin-top:20px; text-align:center; font-size:1.1rem;">
                                <strong>Símbolo (Badge):</strong> <span style="color:#FFF;">${fac.symbol}</span>
                            </div>
                        </div>
                        
                        <div style="flex:2; min-width: 300px;">
                            <h3 style="color:var(--type-electric); margin-bottom:10px; font-size:1.5rem;">${fac.name} <span style="font-size:1.1rem; color:var(--text-muted);">(${fac.ptName})</span></h3>
                            <p style="text-align:justify; font-size:1.05rem; line-height:1.7; margin-bottom:20px; color:var(--text-color);">${fac.desc}</p>
                            
                            <div style="display:flex; flex-direction:column; gap:20px;">
                                <div style="background:rgba(192,192,192,0.1); border:1px solid #C0C0C0; border-radius:12px; padding:20px; width:100%;">
                                    <div style="text-align:center;">
                                        <strong style="color:#C0C0C0; font-size:1.2rem; text-transform:uppercase;">🥈 Desafio de Prata</strong><br>
                                        <span style="font-size:0.95rem; color:var(--text-muted); display:inline-block; margin-top:5px;">${fac.silverReq}</span>
                                    </div>
                                    ${silverHtml}
                                </div>
                                <div style="background:rgba(255,215,0,0.1); border:1px solid #FFD700; border-radius:12px; padding:20px; width:100%;">
                                    <div style="text-align:center;">
                                        <strong style="color:#FFD700; font-size:1.2rem; text-transform:uppercase;">🥇 Desafio de Ouro</strong><br>
                                        <span style="font-size:0.95rem; color:var(--text-muted); display:inline-block; margin-top:5px;">${fac.goldReq}</span>
                                    </div>
                                    ${goldHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    else if (tabName === 'shops') {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">`;
        [...FRONTIER_DATA.shops, ...FRONTIER_DATA.tutors].forEach(shop => {
            let itemsHtml = shop.items.map(i => `
                <tr style="border-bottom: 1px solid var(--glass-border); transition: 0.2s; cursor:default;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:12px; font-weight:600; font-size:1.05rem;"><span style="display:flex; align-items:center; gap:6px;">${imgItem(i.name, { tamanho: 24 })}${i.name}</span></td>
                    <td style="padding:12px; text-align:right; color:var(--type-electric); font-weight:bold; font-size:1.05rem;">${i.cost}</td>
                </tr>
            `).join('');

            html += `
                <div class="grid-card bento-item" style="padding: 25px;">
                    <h3 style="color:var(--type-electric); margin-bottom:10px; font-size:1.3rem;">${shop.title}</h3>
                    <p style="text-align:justify; font-size:1rem; color:var(--text-muted); margin-bottom:20px; line-height:1.5;">${shop.desc}</p>
                    <table style="width:100%; border-collapse:collapse;">
                        ${itemsHtml}
                    </table>
                </div>
            `;
        });
        html += `</div>`;
    }
    else if (tabName === 'pokemon') {
        // Antes cada Pokemon ocupava um card de largura total, empilhados: numa
        // tela grande sobrava espaco vazio e no celular a lista ficava enorme.
        // Agora e uma grade que se ajusta, com o card inteiro clicavel.
        html += '<div class="frontier-especiais">';
        FRONTIER_DATA.special_pokemon.forEach(sp => {
            html += `
                <div class="especial-card" role="button" tabindex="0" data-poke="${sp.id}" title="Ver na Pokédex">
                    <img src="${spriteCheio(sp.id)}" alt="${sp.name}" loading="lazy" decoding="async">
                    <h3>${sp.name}</h3>
                    <p>${sp.desc}</p>
                </div>`;
        });
        html += '</div>';
    }

    grid.innerHTML = html;

    grid.querySelectorAll('.especial-card[data-poke]').forEach(card => {
        const ir = () => { window.location.hash = `pokemon/${card.dataset.poke}`; };
        card.addEventListener('click', ir);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); }
        });
    });

    grid.style.animation = 'none';
    grid.offsetHeight; /* trigger reflow */
    grid.style.animation = 'fadeIn 0.4s ease';
}
