// Lideres de ginasio, Elite Four, rivais e vilaes.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { spriteCheio, spriteInsignia, imgItem } from '../core/sprites.js';

import { getGinasios } from '../core/dataset.js';
import { TYPE_TRANSLATIONS } from '../core/types.js';
import { playClickSound } from '../ui/sound.js';

export default {
    async renderGyms() {
        const container = document.getElementById('gyms-container');
        if (!container) return;

        container.innerHTML = '<div class="spinner"></div>';

        // Os dados de treinadores só são baixados ao abrir esta aba
        if (!window.GYM_LEADERS) {
            try {
                window.GYM_LEADERS = await getGinasios();
            } catch (e) {
                container.innerHTML = '<p>Não foi possível carregar os dados dos treinadores. Verifique sua conexão.</p>';
                return;
            }
        }
        if (!window.GYM_LEADERS) return;
        
        let vg = this.state.versionGroup;
        const regionData = window.GYM_LEADERS[vg];
        
        if (!regionData) {
            container.innerHTML = '<p>Dados não encontrados.</p>';
            return;
        }

        const tab = this.state.gymTab || 'gyms';
        const leaders = regionData[tab];

        if (!leaders || leaders.length === 0) {
            container.innerHTML = '<p>Nenhum dado disponível.</p>';
            return;
        }

        let html = '<div class="frontier-grid">';
        const badgeMap = {
            "Boulder Badge": 1, "Cascade Badge": 2, "Thunder Badge": 3, "Rainbow Badge": 4, 
            "Soul Badge": 5, "Marsh Badge": 6, "Volcano Badge": 7, "Earth Badge": 8,
            "Stone Badge": 17, "Knuckle Badge": 18, "Dynamo Badge": 19, "Heat Badge": 20, 
            "Balance Badge": 21, "Feather Badge": 22, "Mind Badge": 23, "Rain Badge": 24,
            "Elite Four": "elite", "Champion": "champ"
        };

        const renderTeam = (teamArr, req) => {
            if (!teamArr || teamArr.length === 0) return '';
            let teamHtml = `<div class="frontier-team-section">
                <div class="frontier-team-req">${req}</div>
                <div class="frontier-team-grid">`;
            
            for (let poke of teamArr) {
                const spriteUrl = `${spriteCheio(poke.id)}`;
                
                let typesHtml = '';
                if (poke.types) {
                    poke.types.forEach(t => {
                        const tName = typeof TYPE_TRANSLATIONS !== 'undefined' && TYPE_TRANSLATIONS[t] ? TYPE_TRANSLATIONS[t] : t;
                        typesHtml += `<span class="pokemon-type-badge badge-${t}">${tName}</span>`;
                    });
                }
                
                // Pokemon que seguram item ganham a sprite ao lado do nome
                const itemHtml = (item) => {
                    const nome = (item || '').trim();
                    if (!nome || ['-', 'nenhum', 'none'].includes(nome.toLowerCase())) return '<span class="sem-item">Nenhum</span>';
                    return `${imgItem(nome, { tamanho: 20 })}<span>${nome}</span>`;
                };

                let movesHtml = '';
                if (poke.moves) {
                    poke.moves.forEach(m => {
                        movesHtml += `<span class="frontier-move">${m}</span>`;
                    });
                }

                teamHtml += `
                    <div class="frontier-poke-card" onclick="playClickSound(); window.location.hash='pokemon/${poke.id}'" title="Ver Pokédex">
                        <div class="frontier-poke-header">
                            <img src="${spriteUrl}" alt="${poke.name}" loading="lazy">
                            <div class="frontier-poke-info">
                                <div class="frontier-poke-name">${poke.name} <span class="frontier-poke-level">Nv. ${poke.level}</span></div>
                                <div class="frontier-poke-types">${typesHtml}</div>
                            </div>
                        </div>
                        <div class="frontier-poke-details">
                            <div class="detail-row"><strong>Habilidade:</strong> ${poke.ability || '-'}</div>
                            <div class="detail-row detail-item"><strong>Item:</strong> ${itemHtml(poke.item)}</div>
                        </div>
                        <div class="frontier-poke-moves">
                            ${movesHtml}
                        </div>
                    </div>
                `;
            }
            teamHtml += `</div></div>`;
            return teamHtml;
        };

        // Blocos extras que so os rivais possuem
        const regraInicial = (t) => {
            const r = t.starterRule;
            if (!r) return '';
            const linhas = r.variacoes.map(v => `
                <div class="starter-row">
                    <span class="starter-seu">${v.seuInicial}</span>
                    <span class="starter-seta">→</span>
                    <span class="starter-rival">${v.rival}</span>
                    <span class="starter-linha">${v.linha.map(id =>
                        `<img src="${spriteCheio(id)}" alt="" loading="lazy" decoding="async">`).join('')}</span>
                </div>`).join('');
            return `<div class="starter-rule">
                        <strong>${r.titulo}</strong>
                        <p>${r.regra}</p>
                        ${linhas}
                    </div>`;
        };

        const listaBatalhas = (t) => {
            if (!t.battleList) return '';
            return `<div class="battle-list">
                        <strong>Confrontos ao longo do jogo</strong>
                        <ol>${t.battleList.map(b => `<li>${b}</li>`).join('')}</ol>
                    </div>`;
        };

        for (let leader of leaders) {
            let badgeImgHtml = '';
            if (badgeMap[leader.badge]) {
                if (badgeMap[leader.badge] === 'elite' || badgeMap[leader.badge] === 'champ') {
                    // Sem imagem de insígnia para E4, ou usar genérica
                } else {
                    badgeImgHtml = `<img src="${spriteInsignia(badgeMap[leader.badge])}" alt="${leader.badge}" class="frontier-symbol-img" loading="lazy" decoding="async" style="image-rendering: pixelated;">`;
                }
            }

            const tName = typeof TYPE_TRANSLATIONS !== 'undefined' && TYPE_TRANSLATIONS[leader.type] ? TYPE_TRANSLATIONS[leader.type] : leader.type;
            
            html += `
                <div class="bento-item frontier-facility-card trainer-card">
                    <div class="frontier-facility-header">
                        <div class="trainer-portraits">
                            <img src="${leader.sprite}" alt="${(leader.spriteLabels || [leader.name])[0]}" class="frontier-brain-sprite gym-leader-sprite" loading="lazy" decoding="async">
                            ${leader.spriteAlt ? `<img src="${leader.spriteAlt}" alt="${(leader.spriteLabels || ['', leader.name])[1]}" class="frontier-brain-sprite gym-leader-sprite" loading="lazy" decoding="async">` : ''}
                        </div>
                        <div class="frontier-facility-title">
                            <h3>${leader.name}</h3>
                            <div class="frontier-brain-title">${leader.city || ''}</div>
                            <p class="frontier-desc" style="margin-top:10px;">${leader.desc}</p>
                            ${regraInicial(leader)}
                            ${listaBatalhas(leader)}
                            <div class="frontier-symbol-box" style="${(!leader.symbol && !leader.badge) ? 'display:none;' : ''}">
                                ${badgeImgHtml}
                                <div>
                                    <strong style="color:var(--text-color);">${leader.symbol || leader.badge || ''}</strong><br>
                                    <span class="pokemon-type-badge badge-${leader.type}">${tName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="frontier-teams-container">
                        ${renderTeam(leader.silverTeam, leader.silverReq)}
                        ${renderTeam(leader.goldTeam, leader.goldReq)}
                    </div>
                </div>
            `;
        }
        
        html += '</div>'; // close frontier-grid
        container.innerHTML = html;
    }
};
