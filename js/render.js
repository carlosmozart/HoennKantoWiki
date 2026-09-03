// Funções de Renderização UI

const DOM = {
    statsContainer: document.querySelector('.pokemon-stats'),
    matchupsContainer: document.querySelector('.matchups-container'),
    evoContainer: document.querySelector('.evolution-container'),
    encountersContainer: document.querySelector('.encounters-container'),
    movesLevel: document.querySelector('#table-moves-level tbody'),
    movesMachine: document.querySelector('#table-moves-machine tbody'),
    movesEgg: document.querySelector('#table-moves-egg tbody'),
    movesTutor: document.querySelector('#table-moves-tutor tbody')
};

// ==========================================
// STATS
// ==========================================
const renderStats = (stats) => {
    let html = '';
    const maxStat = 255;
    stats.forEach(stat => {
        const val = stat.base_stat;
        const name = STATS_MAP[stat.stat.name] || stat.stat.name;
        const pct = Math.min((val / maxStat) * 100, 100);
        const colorClass = `stat-${name.toLowerCase()}`;
        
        html += `
            <div class="stat-row">
                <span class="stat-label">${name}</span>
                <span class="stat-value">${val}</span>
                <div class="stat-bar"><div class="stat-fill ${colorClass}" style="width: 0%; transition: width 1s ease-out;" data-width="${pct}%"></div></div>
            </div>
        `;
    });
    DOM.statsContainer.innerHTML = html;
    
    setTimeout(() => {
        const fills = DOM.statsContainer.querySelectorAll('.stat-fill');
        fills.forEach(fill => {
            fill.style.width = fill.getAttribute('data-width');
        });
    }, 50);
};

// ==========================================
// MATCHUPS (Fraquezas)
// ==========================================
const renderMatchups = (types) => {
    // Usa a tabela fixa da Gen 3 em vez das relações atuais da PokéAPI:
    // elas trariam o tipo Fada e já não têm as resistências do Metal a
    // Fantasma/Sombrio, que ainda valiam em RSE/FRLG.
    const multiplierMap = {};
    GEN3_TYPES.forEach(t => multiplierMap[t] = 1);

    types.forEach(t => {
        // Pokémon reclassificados como Fada eram Normal na Gen 3
        const defType = t.type.name === 'fairy' ? 'normal' : t.type.name;
        const relations = TYPE_CHART_GEN3[defType];
        if (!relations) return;
        for (const attacker in relations) {
            multiplierMap[attacker] *= relations[attacker];
        }
    });

    let html = '';
    for (const [type, mult] of Object.entries(multiplierMap)) {
        if (mult === 1) continue;
        let mClass = mult === 4 ? 'mult-4' : mult === 2 ? 'mult-2' : mult === 0.5 ? 'mult-05' : mult === 0.25 ? 'mult-025' : 'mult-0';
        html += `
            <div class="matchup-item badge-${type} ${mClass}">
                <span>${TYPE_TRANSLATIONS[type]}</span>
                <span class="matchup-mult">x${mult}</span>
            </div>
        `;
    }
    DOM.matchupsContainer.innerHTML = html || '<span>Dano normal para tudo.</span>';
};

// ==========================================
// EVOLUTION CHAIN
// ==========================================
const parseEvolutionLinks = (node) => {
    let links = [];
    if (!node || !node.evolves_to || node.evolves_to.length === 0) return links;

    const fromId = parseInt(node.species.url.split('/').slice(-2, -1)[0]);
    const fromName = node.species.name;

    node.evolves_to.forEach(evo => {
        const toId = parseInt(evo.species.url.split('/').slice(-2, -1)[0]);
        if (toId > 386) return; // Filtra evoluções Pós-Gen 3 (ex: Leafeon, Glaceon, Sylveon)
        
        const toName = evo.species.name;
        
        let method = "Level up";
        if (evo.evolution_details && evo.evolution_details[0]) {
            const det = evo.evolution_details[0];
            
            // Condições Especiais Adicionais
            let extra = [];
            if (det.time_of_day) extra.push(det.time_of_day === 'day' ? 'Dia' : 'Noite');
            if (det.gender === 1) extra.push('Fêmea');
            if (det.gender === 2) extra.push('Macho');
            const extraStr = extra.length > 0 ? ` (${extra.join(', ')})` : '';

            if (det.trigger.name === 'use-item' && det.item) {
                const itemName = det.item.name.replace(/[-]/g, ' ');
                let itemDisplay = `<span style="text-transform: capitalize;">${itemName}</span>`;
                let locText = "";
                
                // Tenta pegar a localização do item no dicionário usando app.state.versionGroup
                if (window.TRANSLATIONS && window.TRANSLATIONS.item_locations && window.TRANSLATIONS.item_locations[det.item.name]) {
                    let locObj = window.TRANSLATIONS.item_locations[det.item.name];
                    const vGroup = typeof app !== 'undefined' ? app.state.versionGroup : 'emerald';
                    locText = typeof locObj === 'object' ? (locObj[vGroup] || locObj["emerald"]) : locObj;
                }
                
                let itemImg = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${det.item.name}.png" style="width:20px; vertical-align:middle;">`;
                
                if (locText && locText.trim() !== "") {
                    itemImg = `<div class="tooltip-container" style="position:relative; display:inline-block; cursor:help;">
                        ${itemImg}
                        <span class="tooltip-bubble">${locText}</span>
                    </div>`;
                }
                
                method = `Item ${itemImg} <br>${itemDisplay}`;
            } else if (det.trigger.name === 'trade') {
                if (det.held_item) {
                    const heldName = det.held_item.name.replace(/[-]/g, ' ');
                    const heldImg = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${det.held_item.name}.png" style="width:20px; vertical-align:middle;">`;
                    method = `Troca c/ ${heldImg} <span style="text-transform:capitalize;">${heldName}</span>`;
                } else {
                    method = `Troca`;
                }
            } else if (det.min_level) {
                method = `Nível ${det.min_level}${extraStr}`;
            } else if (det.min_happiness) {
                method = `Felicidade${extraStr}`;
            } else if (det.min_beauty) {
                method = `Beleza`;
            }
        }

        links.push({ fromId, fromName, toId, toName, method });
        links = links.concat(parseEvolutionLinks(evo));
    });
    return links;
};

const renderEvolutions = async (chainUrl) => {
    DOM.evoContainer.innerHTML = '<div class="spinner"></div>';
    const chainData = await API.getEvolution(chainUrl);
    if (!chainData) {
        DOM.evoContainer.innerHTML = '<span>Erro ao carregar.</span>';
        return;
    }

    const links = parseEvolutionLinks(chainData.chain);
    if (links.length === 0) {
        DOM.evoContainer.innerHTML = '<span>Sem evolução.</span>';
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    for (let link of links) {
        const fData = await API.getPokemon(link.fromId);
        const tData = await API.getPokemon(link.toId);
        const fSprite = fData ? fData.sprites.front_default : '';
        const tSprite = tData ? tData.sprites.front_default : '';

        html += `
            <div style="display:flex; align-items:center; justify-content:center; gap:10px; background:var(--stat-bar-bg); padding:10px; border-radius:10px;">
                <div class="evo-item" onclick="app.loadPokemon(${link.fromId})">
                    <img src="${fSprite}" class="evo-img" alt="" loading="lazy" decoding="async">
                    <span class="evo-name">${link.fromName}</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-muted); text-align:center; font-weight:bold;">
                    <div>➔</div>
                    <div>${link.method}</div>
                </div>
                <div class="evo-item" onclick="app.loadPokemon(${link.toId})">
                    <img src="${tSprite}" class="evo-img" alt="" loading="lazy" decoding="async">
                    <span class="evo-name">${link.toName}</span>
                </div>
            </div>
        `;
    }
    html += '</div>';
    DOM.evoContainer.innerHTML = html;
};

// ==========================================
// ENCOUNTERS (Locais)
// ==========================================
// Helper para traduzir áreas dinamicamente
const formatLocationName = (rawName) => {
    let parts = rawName.split('-');
    let mainParts = [];
    let prefix = '';
    let suffix = [];

    parts.forEach(part => {
        let p = part.toLowerCase();
        if (p === 'outside') prefix = 'Do lado de fora de ';
        else if (p === 'inside') prefix = 'Dentro de ';
        else if (p === 'fishing') prefix = 'Pescando em ';
        else if (p === 'surfing') prefix = 'Surfando em ';
        else if (p === 'water') suffix.push('(Água)');
        else if (p === 'area') { /* ignore */ }
        else if (p === '1f') suffix.push('- 1º Andar');
        else if (p === '2f') suffix.push('- 2º Andar');
        else if (p === '3f') suffix.push('- 3º Andar');
        else if (p === '4f') suffix.push('- 4º Andar');
        else if (p === '5f') suffix.push('- 5º Andar');
        else if (p === '6f') suffix.push('- 6º Andar');
        else if (p === '7f') suffix.push('- 7º Andar');
        else if (p === 'b1f') suffix.push('- Subsolo 1');
        else if (p === 'b2f') suffix.push('- Subsolo 2');
        else if (p === 'b3f') suffix.push('- Subsolo 3');
        else if (p === 'b4f') suffix.push('- Subsolo 4');
        else if (p === 'route') mainParts.push('Rota');
        else {
            mainParts.push(part.charAt(0).toUpperCase() + part.slice(1));
        }
    });

    let mainName = mainParts.join(' ');
    let result = prefix + mainName;
    if (suffix.length > 0) result += ' ' + suffix.join(' ');
    
    // Ajustes de preposição e gramática
    result = result.replace('de Rota', 'da Rota');
    result = result.replace('em Rota', 'na Rota');
    
    return result.trim();
};

const renderEncounters = async (id, versionGroup) => {
    DOM.encountersContainer.innerHTML = '<div class="spinner"></div>';
    
    // Hardcode para Pokémon de Evento Especial (Mythicals/Legendaries de Evento da Gen 3)
    const eventPokemon = {
        151: "Mew: Acessível na Faraway Island. É necessário obter o item de evento 'Old Sea Map' em Pokémon Emerald.",
        249: "Lugia: Acessível na Navel Rock. É necessário obter o item de evento 'MysticTicket' em Pokémon Emerald, FireRed ou LeafGreen.",
        250: "Ho-Oh: Acessível na Navel Rock. É necessário obter o item de evento 'MysticTicket' em Pokémon Emerald, FireRed ou LeafGreen.",
        251: "Celebi: Obtido apenas através do Pokémon Colosseum Bonus Disc (Japão) ou distribuído em eventos da Nintendo.",
        385: "Jirachi: Obtido transferindo do Pokémon Colosseum Bonus Disc (EUA) ou de Pokémon Channel (Europa/Austrália).",
        386: "Deoxys: Acessível na Birth Island (item de evento 'AuroraTicket'). Suas formas e status variam conforme o jogo (Normal em R/S, Attack em FR, Defense em LG e Speed em Emerald)."
    };
    
    if (eventPokemon[id]) {
        DOM.encountersContainer.innerHTML = `
            <div class="encounter-item" style="display:block; line-height: 1.5;">
                <strong style="color: var(--type-psychic);">⭐ Evento Especial ⭐</strong><br><br>
                <span style="color: var(--text-color);">${eventPokemon[id]}</span>
            </div>
        `;
        return;
    }

    const encData = await API.getEncounters(id);
    
    if (!encData || encData.length === 0) {
        DOM.encountersContainer.innerHTML = '<span>Não pode ser encontrado na natureza (selvagem).</span>';
        return;
    }

    // Filtrar pela versão do jogo escolhida (ex: emerald, ruby-sapphire)
    const validEncounters = encData.filter(enc => 
        enc.version_details.some(v => v.version.name === versionGroup || 
        // Lidar com grupos de versão
        (versionGroup === 'ruby-sapphire' && (v.version.name === 'ruby' || v.version.name === 'sapphire')) ||
        (versionGroup === 'firered-leafgreen' && (v.version.name === 'firered' || v.version.name === 'leafgreen'))
    ));

    if (validEncounters.length === 0) {
        DOM.encountersContainer.innerHTML = '<span>Não encontrado nesta versão específica.</span>';
        return;
    }

    let html = '';
    validEncounters.forEach(enc => {
        const locName = formatLocationName(enc.location_area.name);
        // Pega detalhes da versão correta
        let vDetail = enc.version_details.find(v => v.version.name === versionGroup);
        if(!vDetail) vDetail = enc.version_details[0]; // fallback seguro

        html += `
            <div class="encounter-item">
                <span>${locName}</span>
                <span>Chance máxima: ${vDetail.max_chance}%</span>
            </div>
        `;
    });
    DOM.encountersContainer.innerHTML = html;
};

// ==========================================
// MOVESET (Ataques)
// ==========================================
const renderMoves = (moves, versionGroup) => {
    DOM.movesLevel.innerHTML = '';
    DOM.movesMachine.innerHTML = '';
    DOM.movesEgg.innerHTML = '';
    DOM.movesTutor.innerHTML = '';

    const levels = [], machines = [], eggs = [], tutors = [];

    moves.forEach(m => {
        // Encontra o detalhe de versão correspondente à geração 3
        let vDetail = m.version_group_details.find(v => v.version_group.name === versionGroup);
        
        // Fallback para Pokémon Especiais (como Deoxys) onde a PokeAPI não mapeia perfeitamente todas as versões
        if (!vDetail) {
            const isHoenn = versionGroup === 'emerald' || versionGroup === 'ruby-sapphire';
            if (isHoenn) {
                vDetail = m.version_group_details.find(v => v.version_group.name === 'ruby-sapphire' || v.version_group.name === 'emerald');
            } else {
                vDetail = m.version_group_details.find(v => v.version_group.name === 'firered-leafgreen');
            }
            if (!vDetail) {
                vDetail = m.version_group_details.find(v => ['ruby-sapphire', 'emerald', 'firered-leafgreen'].includes(v.version_group.name));
            }
        }
        if (!vDetail) return;

        const moveData = {
            name: m.move.name.replace(/[-]/g, ' '),
            method: vDetail.move_learn_method.name,
            level: vDetail.level_learned_at,
            url: m.move.url
        };

        if (moveData.method === 'level-up') levels.push(moveData);
        else if (moveData.method === 'machine') machines.push(moveData);
        else if (moveData.method === 'egg') eggs.push(moveData);
        else if (moveData.method === 'tutor') tutors.push(moveData);
    });

    // Ordenar levels
    levels.sort((a,b) => a.level - b.level);

    const renderTable = (array, container, tableType) => {
        const showLevel = tableType === 'level';
        const showLocation = tableType === 'machine' || tableType === 'tutor';

        if(array.length === 0) {
            container.innerHTML = `<tr><td colspan="${showLocation ? '7' : '7'}" style="text-align:center;">Nenhum ataque encontrado.</td></tr>`;
            return;
        }
        
        let html = '';
        array.forEach(m => {
            html += `
                <tr>
                    ${showLevel ? `<td>${m.level === 0 ? 'Evo' : m.level}</td>` : ''}
                    <td style="text-transform: capitalize; font-weight:bold;">${m.name}</td>
                    <td><span class="matchup-mult">...</span></td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    ${showLocation ? `<td>-</td>` : ''}
                </tr>
            `;
        });
        container.innerHTML = html;
        
        // Carregar detalhes dos moves assincronamente pra não travar a tela principal
        array.forEach((m, index) => {
            // Reutilizando fetchWithCache exportado indiretamente por uma das urls
            fetchWithCache(m.url, `move_${m.name}`).then(moveDetails => {
                if(!moveDetails) return;
                const tr = container.children[index];
                // A tabela pode ter sido reconstruída (troca rápida de Pokémon ou
                // de versão) enquanto este fetch estava em voo.
                if (!tr) return;
                
                // --- REGRA GEN 3: REVERTER TIPO FADA PARA NORMAL ---
                let typeName = moveDetails.type.name;
                if (typeName === 'fairy') {
                    typeName = 'normal';
                }
                
                const power = moveDetails.power || '-';
                const acc = moveDetails.accuracy || '-';
                const pp = moveDetails.pp || '-';
                
                // --- REGRA GEN 3: CATEGORIA POR TIPO ---
                let dClass = moveDetails.damage_class ? moveDetails.damage_class.name : '-';
                if (dClass === 'physical' || dClass === 'special') {
                    dClass = GEN3_TYPE_CATEGORIES[typeName] || dClass;
                } else if (dClass === 'status') {
                    dClass = 'Status';
                }
                
                // Pegando a descrição e verificando a tradução
                let moveDesc = "Sem descrição.";
                if (moveDetails.flavor_text_entries) {
                    const engDesc = moveDetails.flavor_text_entries.find(f => f.language.name === 'en');
                    if (engDesc) moveDesc = engDesc.flavor_text.replace(/[\n\f]/g, ' ');
                }
                
                // Sobrescreve pela tradução se existir
                if (window.TRANSLATIONS && window.TRANSLATIONS.moves && window.TRANSLATIONS.moves[m.name]) {
                    if (window.TRANSLATIONS.moves[m.name].trim() !== '') {
                        moveDesc = window.TRANSLATIONS.moves[m.name];
                    }
                }
                
                // Location Lookup
                let locationHtml = '';
                if (showLocation) {
                    let locText = "Desconhecido";
                    let rawLoc = null;
                    if (tableType === 'machine' && window.TRANSLATIONS && window.TRANSLATIONS.tm_locations) {
                        rawLoc = window.TRANSLATIONS.tm_locations[m.name];
                    } else if (tableType === 'tutor' && window.TRANSLATIONS && window.TRANSLATIONS.tutor_locations) {
                        rawLoc = window.TRANSLATIONS.tutor_locations[m.name];
                    }
                    
                    if (rawLoc) {
                        if (typeof rawLoc === 'object') {
                            locText = rawLoc[versionGroup];
                            if (!locText || locText.trim() === '') locText = rawLoc["emerald"] || "Desconhecido";
                        } else {
                            locText = rawLoc;
                        }
                    }
                    
                    locationHtml = `<td>${locText}</td>`;
                }
                
                tr.innerHTML = `
                    ${showLevel ? `<td>${m.level === 0 ? 'Evo' : m.level}</td>` : ''}
                    <td class="move-name-cell" data-tooltip="${moveDesc.replace(/"/g, '&quot;')}">
                        <span style="text-transform: capitalize; font-weight:bold; cursor:help;">${m.name}</span>
                    </td>
                    <td><span class="pokemon-type-badge badge-${typeName}" style="display:inline-block; padding: 2px 8px;">${TYPE_TRANSLATIONS[typeName] || typeName}</span></td>
                    <td style="text-transform:capitalize;">${dClass}</td>
                    <td>${power}</td>
                    <td>${acc}</td>
                    <td>${pp}</td>
                    ${locationHtml}
                `;
            });
        });
    };

    renderTable(levels, DOM.movesLevel, 'level');
    renderTable(machines, DOM.movesMachine, 'machine');
    renderTable(eggs, DOM.movesEgg, 'egg');
    renderTable(tutors, DOM.movesTutor, 'tutor');
};
