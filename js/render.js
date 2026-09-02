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
                <div class="stat-bar"><div class="stat-fill ${colorClass}" style="width: ${pct}%;"></div></div>
            </div>
        `;
    });
    DOM.statsContainer.innerHTML = html;
};

// ==========================================
// MATCHUPS (Fraquezas)
// ==========================================
const renderMatchups = async (types) => {
    DOM.matchupsContainer.innerHTML = '<div class="spinner"></div>';
    
    const typePromises = types.map(t => API.getType(t.type.name));
    const typeResults = await Promise.all(typePromises);
    
    const multiplierMap = {};
    Object.keys(TYPE_TRANSLATIONS).forEach(t => multiplierMap[t] = 1);

    typeResults.forEach(result => {
        if (!result) return;
        const dmg = result.damage_relations;
        dmg.double_damage_from.forEach(t => multiplierMap[t.name] *= 2);
        dmg.half_damage_from.forEach(t => multiplierMap[t.name] *= 0.5);
        dmg.no_damage_from.forEach(t => multiplierMap[t.name] *= 0);
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
                // Tenta pegar a localização do item no dicionário
                if (window.TRANSLATIONS && window.TRANSLATIONS.item_locations && window.TRANSLATIONS.item_locations[det.item.name]) {
                    let locObj = window.TRANSLATIONS.item_locations[det.item.name];
                    let locText = typeof locObj === 'object' ? (locObj[versionGroup] || locObj["emerald"]) : locObj;
                    if (locText && locText.trim() !== "") {
                        itemDisplay += `<br><span style="font-size:0.6rem; color:var(--text-muted);">(${locText})</span>`;
                    }
                }
                const itemImg = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${det.item.name}.png" style="width:20px; vertical-align:middle;">`;
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
                    <img src="${fSprite}" class="evo-img">
                    <span class="evo-name">${link.fromName}</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-muted); text-align:center; font-weight:bold;">
                    <div>➔</div>
                    <div>${link.method}</div>
                </div>
                <div class="evo-item" onclick="app.loadPokemon(${link.toId})">
                    <img src="${tSprite}" class="evo-img">
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
const renderEncounters = async (id, versionGroup) => {
    DOM.encountersContainer.innerHTML = '<div class="spinner"></div>';
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
        const locName = enc.location_area.name.replace(/-/g, ' ');
        // Pega detalhes da versão correta
        let vDetail = enc.version_details.find(v => v.version.name === versionGroup);
        if(!vDetail) vDetail = enc.version_details[0]; // fallback seguro

        html += `
            <div class="encounter-item">
                <span style="text-transform: capitalize;">${locName}</span>
                <span>Max chance: ${vDetail.max_chance}%</span>
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
        const vDetail = m.version_group_details.find(v => v.version_group.name === versionGroup);
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
