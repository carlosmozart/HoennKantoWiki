// Renderizacao das secoes da ficha de um Pokemon.
//
// Tudo aqui le do dataset local (data/pokemon/<id>.json e data/moves.json).
// Antes cada uma destas secoes disparava requisicoes proprias para a PokeAPI:
// a tabela de golpes sozinha fazia uma busca por golpe, ate ~130 por ficha.

import { TYPE_TRANSLATIONS, GEN3_TYPE_CATEGORIES, TYPE_CHART_GEN3, GEN3_TYPES, STATS_MAP } from '../core/types.js';
import { getGolpes, getResumo } from '../core/dataset.js';

const SPRITE = (id) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const SPRITE_ITEM = (nome) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${nome}.png`;

const el = {
    stats: () => document.querySelector('.pokemon-stats'),
    matchups: () => document.querySelector('.matchups-container'),
    evolucoes: () => document.querySelector('.evolution-container'),
    locais: () => document.querySelector('.encounters-container'),
    golpes: (tipo) => document.querySelector(`#table-moves-${tipo} tbody`),
};

const escapar = (s) => String(s).replace(/"/g, '&quot;');
const capitalizar = (s) => s.replace(/-/g, ' ');

// ==========================================
// STATUS BASE
// ==========================================
export function renderStats(stats) {
    const alvo = el.stats();
    if (!alvo) return;

    const MAX = 255;
    alvo.innerHTML = Object.entries(stats).map(([chave, valor]) => {
        const nome = STATS_MAP[chave] || chave;
        const pct = Math.min((valor / MAX) * 100, 100);
        return `
            <div class="stat-row">
                <span class="stat-label">${nome}</span>
                <span class="stat-value">${valor}</span>
                <div class="stat-bar"><div class="stat-fill stat-${nome.toLowerCase()}" style="width:0%; transition: width 1s ease-out;" data-width="${pct}%"></div></div>
            </div>`;
    }).join('');

    // Animacao das barras a partir do zero
    requestAnimationFrame(() => {
        alvo.querySelectorAll('.stat-fill').forEach((b) => {
            b.style.width = b.getAttribute('data-width');
        });
    });
}

// ==========================================
// FRAQUEZAS E VANTAGENS
// ==========================================
export function renderMatchups(tipos) {
    const alvo = el.matchups();
    if (!alvo) return;

    const mult = {};
    GEN3_TYPES.forEach((t) => (mult[t] = 1));
    tipos.forEach((t) => {
        const relacoes = TYPE_CHART_GEN3[t];
        if (!relacoes) return;
        for (const atacante in relacoes) mult[atacante] *= relacoes[atacante];
    });

    const classe = (m) =>
        m === 4 ? 'mult-4' : m === 2 ? 'mult-2' : m === 0.5 ? 'mult-05' : m === 0.25 ? 'mult-025' : 'mult-0';

    const html = Object.entries(mult)
        .filter(([, m]) => m !== 1)
        .map(([tipo, m]) => `
            <div class="matchup-item badge-${tipo} ${classe(m)}">
                <span>${TYPE_TRANSLATIONS[tipo]}</span>
                <span class="matchup-mult">x${m}</span>
            </div>`)
        .join('');

    alvo.innerHTML = html || '<span>Dano normal para tudo.</span>';
}

// ==========================================
// CADEIA EVOLUTIVA
// ==========================================
function textoDoMetodo(evo, versionGroup) {
    const extra = [];
    if (evo.turno) extra.push(evo.turno === 'day' ? 'Dia' : 'Noite');
    if (evo.genero === 1) extra.push('Fêmea');
    if (evo.genero === 2) extra.push('Macho');
    const sufixo = extra.length ? ` (${extra.join(', ')})` : '';

    if (evo.gatilho === 'use-item' && evo.item) {
        let img = `<img src="${SPRITE_ITEM(evo.item)}" alt="" style="width:20px; vertical-align:middle;">`;
        const dicionario = window.TRANSLATIONS?.item_locations?.[evo.item];
        let local = '';
        if (dicionario) {
            local = typeof dicionario === 'object'
                ? (dicionario[versionGroup] || dicionario.emerald || '')
                : dicionario;
        }
        if (local.trim()) {
            img = `<div class="tooltip-container" style="position:relative; display:inline-block; cursor:help;">
                    ${img}<span class="tooltip-bubble">${local}</span>
                   </div>`;
        }
        return `Item ${img} <br><span style="text-transform: capitalize;">${capitalizar(evo.item)}</span>`;
    }
    if (evo.gatilho === 'trade') {
        if (evo.itemSegurado) {
            const img = `<img src="${SPRITE_ITEM(evo.itemSegurado)}" alt="" style="width:20px; vertical-align:middle;">`;
            return `Troca c/ ${img} <span style="text-transform:capitalize;">${capitalizar(evo.itemSegurado)}</span>`;
        }
        return 'Troca';
    }
    if (evo.nivel) return `Nível ${evo.nivel}${sufixo}`;
    if (evo.felicidade) return `Felicidade${sufixo}`;
    if (evo.beleza) return 'Beleza';
    return 'Level up';
}

export async function renderEvolutions(evolucoes, versionGroup) {
    const alvo = el.evolucoes();
    if (!alvo) return;

    if (!evolucoes || evolucoes.length === 0) {
        alvo.innerHTML = '<span>Sem evolução.</span>';
        return;
    }

    const nomes = await Promise.all(
        evolucoes.flatMap((e) => [getResumo(e.de), getResumo(e.para)])
    );

    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    evolucoes.forEach((evo, i) => {
        const de = nomes[i * 2];
        const para = nomes[i * 2 + 1];
        html += `
            <div style="display:flex; align-items:center; justify-content:center; gap:10px; background:var(--stat-bar-bg); padding:10px; border-radius:10px;">
                <div class="evo-item" role="button" tabindex="0" data-poke="${evo.de}">
                    <img src="${SPRITE(evo.de)}" class="evo-img" alt="" loading="lazy" decoding="async">
                    <span class="evo-name">${de ? de.nome : evo.de}</span>
                </div>
                <div style="font-size:0.7rem; color:var(--text-muted); text-align:center; font-weight:bold;">
                    <div>➔</div>
                    <div>${textoDoMetodo(evo, versionGroup)}</div>
                </div>
                <div class="evo-item" role="button" tabindex="0" data-poke="${evo.para}">
                    <img src="${SPRITE(evo.para)}" class="evo-img" alt="" loading="lazy" decoding="async">
                    <span class="evo-name">${para ? para.nome : evo.para}</span>
                </div>
            </div>`;
    });
    alvo.innerHTML = html + '</div>';

    // Sem onclick inline: tambem acessivel por teclado
    alvo.querySelectorAll('.evo-item[data-poke]').forEach((item) => {
        const ir = () => { window.location.hash = `pokemon/${item.dataset.poke}`; };
        item.addEventListener('click', ir);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); }
        });
    });
}

// ==========================================
// ONDE ENCONTRAR
// ==========================================
const NOMES_METODO = {
    walk: '🌿 Grama alta',
    surf: '🌊 Surfando',
    'old-rod': '🎣 Vara Velha',
    'good-rod': '🎣 Vara Boa',
    'super-rod': '🎣 Super Vara',
    'rock-smash': '🪨 Rock Smash',
    seaweed: '🌿 Algas',
    static: '⭐ Encontro fixo',
    gift: '🎁 Presente',
    'gift-egg': '🥚 Ovo de presente',
    'npc-trade': '🔄 Troca com NPC',
    'roaming-grass': '🏃 Errante (terra)',
    'roaming-water': '🏃 Errante (água)',
    'devon-scope': '🔎 Devon Scope',
    pokeflute: '🎵 Poké Flute',
    'wailmer-pail': '🪣 Wailmer Pail',
    'feebas-tile-fishing': '🎣 Quadrado do Feebas',
    'colosseum-bonus-disc-jpn': '💿 Bonus Disc (JP)',
    'colosseum-bonus-disc-us': '💿 Bonus Disc (EUA)',
    'pokemon-channel-pal': '📺 Pokémon Channel (PAL)',
};

function formatarLocal(bruto) {
    const partes = bruto.split(' ');
    const principal = [];
    let prefixo = '';
    const sufixo = [];

    partes.forEach((parte) => {
        const p = parte.toLowerCase();
        if (p === 'outside') prefixo = 'Do lado de fora de ';
        else if (p === 'inside') prefixo = 'Dentro de ';
        else if (p === 'fishing') prefixo = 'Pescando em ';
        else if (p === 'surfing') prefixo = 'Surfando em ';
        else if (p === 'water') sufixo.push('(Água)');
        else if (p === 'area') { /* ignorado */ }
        else if (/^b?\d f$/.test(p) || /^b?\df$/.test(p)) {
            sufixo.push(p.startsWith('b') ? `- Subsolo ${p[1]}` : `- ${p[0]}º Andar`);
        } else if (p === 'route') principal.push('Rota');
        else principal.push(parte.charAt(0).toUpperCase() + parte.slice(1));
    });

    let resultado = (prefixo + principal.join(' ')).trim();
    if (sufixo.length) resultado += ' ' + sufixo.join(' ');
    return resultado.replace('de Rota', 'da Rota').replace('em Rota', 'na Rota').trim();
}

// Pokemon so obtidos por evento nao aparecem em nenhuma tabela de encontro
const EVENTOS = {
    151: "Mew: Acessível na Faraway Island. É necessário obter o item de evento 'Old Sea Map' em Pokémon Emerald.",
    249: "Lugia: Acessível na Navel Rock. É necessário obter o item de evento 'MysticTicket' em Pokémon Emerald, FireRed ou LeafGreen.",
    250: "Ho-Oh: Acessível na Navel Rock. É necessário obter o item de evento 'MysticTicket' em Pokémon Emerald, FireRed ou LeafGreen.",
    251: 'Celebi: Obtido apenas através do Pokémon Colosseum Bonus Disc (Japão) ou distribuído em eventos da Nintendo.',
    385: 'Jirachi: Obtido transferindo do Pokémon Colosseum Bonus Disc (EUA) ou de Pokémon Channel (Europa/Austrália).',
    386: "Deoxys: Acessível na Birth Island (item de evento 'AuroraTicket'). Suas formas e status variam conforme o jogo (Normal em R/S, Attack em FR, Defense em LG e Speed em Emerald).",
};

const VERSOES_DO_GRUPO = {
    emerald: ['emerald'],
    'ruby-sapphire': ['ruby', 'sapphire'],
    'firered-leafgreen': ['firered', 'leafgreen'],
};

export function renderEncounters(id, locais, versionGroup) {
    const alvo = el.locais();
    if (!alvo) return;

    if (EVENTOS[id]) {
        alvo.innerHTML = `
            <div class="encounter-item" style="display:block; line-height: 1.5;">
                <strong style="color: var(--type-psychic);">⭐ Evento Especial ⭐</strong><br><br>
                <span style="color: var(--text-color);">${EVENTOS[id]}</span>
            </div>`;
        return;
    }

    if (!locais || Object.keys(locais).length === 0) {
        alvo.innerHTML = '<span>Não pode ser encontrado na natureza (selvagem).</span>';
        return;
    }

    // Reune os locais das versoes que compoem o grupo selecionado
    const juntos = {};
    (VERSOES_DO_GRUPO[versionGroup] || []).forEach((versao) => {
        for (const [local, metodos] of Object.entries(locais[versao] || {})) {
            const destino = (juntos[local] = juntos[local] || {});
            for (const [metodo, d] of Object.entries(metodos)) {
                const atual = destino[metodo];
                destino[metodo] = atual
                    ? { min: Math.min(atual.min, d.min), max: Math.max(atual.max, d.max), chance: Math.max(atual.chance, d.chance) }
                    : { ...d };
            }
        }
    });

    if (Object.keys(juntos).length === 0) {
        alvo.innerHTML = '<span>Não encontrado nesta versão específica.</span>';
        return;
    }

    alvo.innerHTML = Object.entries(juntos)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([local, metodos]) => {
            const detalhes = Object.entries(metodos)
                .map(([m, d]) => {
                    const nivel = d.min === d.max ? `Nv ${d.min}` : `Nv ${d.min}-${d.max}`;
                    return `<span style="white-space:nowrap;">${NOMES_METODO[m] || m} · ${nivel} · ${d.chance}%</span>`;
                })
                .join(' ');
            return `
                <div class="encounter-item" style="display:block;">
                    <strong>${formatarLocal(local)}</strong>
                    <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; font-size:0.8rem; color:var(--text-muted);">${detalhes}</div>
                </div>`;
        })
        .join('');
}

// ==========================================
// GOLPES
// ==========================================
const METODO_PARA_ABA = { 'level-up': 'level', machine: 'machine', egg: 'egg', tutor: 'tutor' };

export async function renderMoves(golpesPorGrupo, versionGroup) {
    const abas = ['level', 'machine', 'egg', 'tutor'];
    abas.forEach((a) => {
        const t = el.golpes(a);
        if (t) t.innerHTML = '';
    });

    const catalogo = await getGolpes().catch(() => ({}));

    // Fallback: Pokemon de evento nem sempre tem entrada na versao escolhida
    let lista = golpesPorGrupo[versionGroup];
    if (!lista) {
        for (const g of ['emerald', 'ruby-sapphire', 'firered-leafgreen']) {
            if (golpesPorGrupo[g]) { lista = golpesPorGrupo[g]; break; }
        }
    }
    lista = lista || [];

    const porAba = { level: [], machine: [], egg: [], tutor: [] };
    lista.forEach((g) => {
        const aba = METODO_PARA_ABA[g.m];
        if (aba) porAba[aba].push(g);
    });
    porAba.level.sort((a, b) => a.l - b.l);

    for (const aba of abas) {
        const tbody = el.golpes(aba);
        if (!tbody) continue;
        const itens = porAba[aba];
        const mostraNivel = aba === 'level';
        const mostraLocal = aba === 'machine' || aba === 'tutor';

        if (itens.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum ataque encontrado.</td></tr>';
            continue;
        }

        tbody.innerHTML = itens.map((g) => {
            const d = catalogo[g.n] || {};
            const tipo = d.tipo || 'normal';
            let categoria = d.classe === 'status' ? 'Status' : (GEN3_TYPE_CATEGORIES[tipo] || d.classe || '-');

            let desc = d.desc || 'Sem descrição.';
            const traduzido = window.TRANSLATIONS?.moves?.[g.n];
            if (traduzido && traduzido.trim()) desc = traduzido;

            let local = '';
            if (mostraLocal) {
                const dic = aba === 'machine'
                    ? window.TRANSLATIONS?.tm_locations?.[g.n]
                    : window.TRANSLATIONS?.tutor_locations?.[g.n];
                let texto = '-';
                if (dic) {
                    texto = typeof dic === 'object' ? (dic[versionGroup] || dic.emerald || '-') : dic;
                }
                local = `<td>${texto}</td>`;
            }

            return `
                <tr>
                    ${mostraNivel ? `<td>${g.l === 0 ? 'Evo' : g.l}</td>` : ''}
                    <td class="move-name-cell" data-tooltip="${escapar(desc)}">
                        <span style="text-transform: capitalize; font-weight:bold; cursor:help;">${capitalizar(g.n)}</span>
                    </td>
                    <td><span class="pokemon-type-badge badge-${tipo}" style="display:inline-block; padding: 2px 8px;">${TYPE_TRANSLATIONS[tipo] || tipo}</span></td>
                    <td style="text-transform:capitalize;">${categoria}</td>
                    <td>${d.poder ?? '-'}</td>
                    <td>${d.precisao ?? '-'}</td>
                    <td>${d.pp ?? '-'}</td>
                    ${local}
                </tr>`;
        }).join('');
    }
}
