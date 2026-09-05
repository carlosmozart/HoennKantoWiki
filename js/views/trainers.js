// Lideres de ginasio, Elite Four, rivais e vilaes.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { spritePokemon, spriteInsignia, imgItem } from '../core/sprites.js';

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
                container.innerHTML = '<p data-ui=labels.text_3e60596e7a>Não foi possível carregar os dados dos treinadores. Verifique sua conexão.</p>';
                return;
            }
        }
        if (!window.GYM_LEADERS) return;
        
        let vg = this.state.versionGroup;
        const regionData = window.GYM_LEADERS[vg];
        
        if (!regionData) {
            container.innerHTML = '<p data-ui=labels.text_719f96b12a>Dados não encontrados.</p>';
            return;
        }

        const tab = this.state.gymTab || 'gyms';
        const leaders = regionData[tab];

        if (!leaders || leaders.length === 0) {
            container.innerHTML = '<p data-ui=labels.text_600b92b8b5>Nenhum dado disponível.</p>';
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
                const spriteUrl = spritePokemon(poke.id, { versao: vg });
                
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
                    if (!nome || ['-', 'nenhum', 'none'].includes(nome.toLowerCase())) return '<span class="sem-item" data-ui=labels.text_997c23481b>Nenhum</span>';
                    return `${imgItem(nome, { tamanho: 20 })}<span>${nome}</span>`;
                };

                let movesHtml = '';
                if (poke.moves) {
                    poke.moves.forEach(m => {
                        movesHtml += `<span class="frontier-move">${m}</span>`;
                    });
                }

                teamHtml += `
                    <a class="frontier-poke-card" href="#pokemon/${poke.id}" onclick="playClickSound()" title="Ver Pokédex">
                        <div class="frontier-poke-header">
                            <img src="${spriteUrl}" alt="${poke.name}" loading="lazy">
                            <div class="frontier-poke-info">
                                <div class="frontier-poke-name">${poke.name} <span class="frontier-poke-level">Nv. ${poke.level}</span></div>
                                <div class="frontier-poke-types">${typesHtml}</div>
                            </div>
                        </div>
                        <div class="frontier-poke-details">
                            <div class="detail-row"><strong data-ui=labels.text_c2a6efc53e>Habilidade:</strong> ${poke.ability || '-'}</div>
                            <div class="detail-row detail-item"><strong data-ui=labels.text_ab12e73f5e>Item:</strong> ${itemHtml(poke.item)}</div>
                        </div>
                        <div class="frontier-poke-moves">
                            ${movesHtml}
                        </div>
                    </a>
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
                        `<img src="${spritePokemon(id, { versao: vg })}" alt="" loading="lazy" decoding="async">`).join('')}</span>
                </div>`).join('');
            return `<div class="starter-rule">
                        <strong>${r.titulo}</strong>
                        <p>${r.regra}</p>
                        ${linhas}
                    </div>`;
        };

        const listaBatalhas = (t) => {
            if (t.battles?.length) return '';
            if (!t.battleList) return '';
            return `<div class="battle-list">
                        <strong data-ui=labels.text_4a446a8671>Confrontos ao longo do jogo</strong>
                        <ol>${t.battleList.map(b => `<li>${b}</li>`).join('')}</ol>
                    </div>`;
        };

        const batalhasDoRival = (t) => {
            if (!t.battles?.length) return '';
            const iniciais = [...new Set(t.battles[0].variants.map(v => v.playerStarter))];
            const rivais = [...new Set(t.battles.flatMap(b => b.variants.map(v => v.rivalName).filter(Boolean)))];
            const nomeRival = (variant) => variant.rivalName || t.name.replace(/\s*\(.*?\)\s*/g, '');
            const itensDaBatalha = (itens) => {
                if (!itens?.length) return '';
                return `<div class="rival-battle-items">
                    <strong>Itens de batalha:</strong>
                    ${itens.map(item => `<span>${imgItem(item.name, { tamanho: 24 })}${item.name} ×${item.quantity}</span>`).join('')}
                </div>`;
            };

            return `<section class="rival-battle-guide" aria-label="Times de ${t.name} por confronto">
                ${rivais.length > 1 ? `<div class="rival-starter-picker rival-name-picker">
                    <div>
                        <strong>Quem é seu rival?</strong>
                        <small>Você enfrenta o personagem que não escolheu.</small>
                    </div>
                    <div class="rival-starter-buttons" role="group" aria-label="Personagem rival">
                        ${rivais.map((nome, index) => `<button type="button" class="rival-starter-btn rival-name-btn${index === 0 ? ' active' : ''}" data-rival-name="${nome}" aria-pressed="${index === 0}">${nome}</button>`).join('')}
                    </div>
                </div>` : ''}
                <div class="rival-starter-picker">
                    <div>
                        <strong>Qual foi o seu inicial?</strong>
                        <small>O time correto será aplicado a todos os confrontos.</small>
                    </div>
                    <div class="rival-starter-buttons" role="group" aria-label="Inicial escolhido pelo jogador">
                        ${iniciais.map((nome, index) => `<button type="button" class="rival-starter-btn${index === 0 ? ' active' : ''}" data-player-starter="${nome}" aria-pressed="${index === 0}">${nome}</button>`).join('')}
                    </div>
                </div>
                <div class="rival-battle-timeline">
                    ${t.battles.map((battle, index) => `<details class="rival-battle"${index === 0 ? ' open' : ''}>
                        <summary>
                            <span class="rival-battle-number">${index + 1}</span>
                            <span class="rival-battle-heading">
                                <strong>${battle.title.replace(/^\d+\.\s*/, '')}</strong>
                                <small>${battle.location} · Prêmio: ₽${battle.prize}${battle.optional ? ' · Opcional' : ''}</small>
                            </span>
                        </summary>
                        <div class="rival-battle-content">
                            ${battle.note ? `<p class="rival-battle-note">${battle.note}</p>` : ''}
                            ${itensDaBatalha(battle.battleItems)}
                            ${battle.variants.map((variant, variantIndex) => `<div class="rival-variant-panel" data-player-starter="${variant.playerStarter}"${variant.rivalName ? ` data-rival-name="${variant.rivalName}"` : ''}${variantIndex === 0 ? '' : ' hidden'}>
                                ${renderTeam(variant.team, `Seu inicial: ${variant.playerStarter} · Inicial de ${nomeRival(variant)}: ${variant.rivalStarter}`)}
                            </div>`).join('')}
                        </div>
                    </details>`).join('')}
                </div>
            </section>`;
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
                        ${batalhasDoRival(leader)}
                        ${leader.battles?.length ? '' : renderTeam(leader.silverTeam, leader.silverReq)}
                        ${leader.battles?.length ? '' : renderTeam(leader.goldTeam, leader.goldReq)}
                    </div>
                </div>
            `;
        }
        
        html += '</div>'; // close frontier-grid
        container.innerHTML = html;

        container.querySelectorAll('.rival-battle-guide').forEach(guide => {
            const atualizarVariantes = () => {
                const starter = guide.querySelector('.rival-starter-btn[data-player-starter].active')?.dataset.playerStarter;
                const rival = guide.querySelector('.rival-name-btn.active')?.dataset.rivalName;
                guide.querySelectorAll('.rival-variant-panel').forEach(panel => {
                    panel.hidden = panel.dataset.playerStarter !== starter || (rival && panel.dataset.rivalName !== rival);
                });
            };
            guide.querySelectorAll('.rival-starter-btn').forEach(button => {
                button.addEventListener('click', () => {
                    playClickSound();
                    const attr = button.dataset.rivalName ? 'rivalName' : 'playerStarter';
                    const value = button.dataset[attr];
                    guide.querySelectorAll(button.dataset.rivalName ? '.rival-name-btn' : '.rival-starter-btn[data-player-starter]').forEach(candidate => {
                        const selected = candidate.dataset[attr] === value;
                        candidate.classList.toggle('active', selected);
                        candidate.setAttribute('aria-pressed', String(selected));
                    });
                    atualizarVariantes();
                });
            });
            atualizarVariantes();
        });
    }
};
