// Ficha de um Pokemon.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { getPokemon, getHabilidades } from '../core/dataset.js';
import { TYPE_TRANSLATIONS } from '../core/types.js';
import { spritePokemon } from '../core/sprites.js';
import { renderStats, renderMatchups, renderEvolutions, renderEncounters, renderMoves } from './pokemon-render.js';

const GRUPOS_OVO = {
    monster: 'Monstro', water1: 'Água 1', water2: 'Água 2', water3: 'Água 3',
    bug: 'Inseto', flying: 'Voador', ground: 'Terrestre', fairy: 'Fada',
    plant: 'Planta', humanshape: 'Humanoide', mineral: 'Mineral',
    indeterminate: 'Amorfo', ditto: 'Ditto', dragon: 'Dragão', 'no-eggs': 'Sem Ovos',
};

const NOMES_EV = {
    hp: 'HP', attack: 'Atk', defense: 'Def',
    'special-attack': 'Sp.Atk', 'special-defense': 'Sp.Def', speed: 'Spd',
};

export default {
    updateFavBtn(id) {
        if (this.state.favorites.includes(id)) {
            this.dom.btnFav.classList.add('active');
            this.dom.btnFav.textContent = '❤️';
        } else {
            this.dom.btnFav.classList.remove('active');
            this.dom.btnFav.textContent = '🤍';
        }
    },

    updateCaptureBtn(id) {
        if (!this.dom.btnCapture) return;
        const capturado = this.state.captures.includes(id);
        this.dom.btnCapture.classList.toggle('captured', capturado);
        this.dom.btnCapture.title = capturado ? 'Desmarcar captura' : 'Marcar como capturado';
        this.dom.btnCapture.setAttribute('aria-pressed', String(capturado));
    },

    updateTeamBtn(id) {
        if (this.state.team.some(p => p.id === id)) {
            this.dom.btnTeam.classList.add('active');
            this.dom.btnTeam.textContent = '❌';
            this.dom.btnTeam.title = 'Remover da Equipe';
        } else {
            this.dom.btnTeam.classList.remove('active');
            this.dom.btnTeam.textContent = '➕';
            this.dom.btnTeam.title = 'Adicionar à Equipe';
        }
    },

    playCry(id) {
        const atual = this.state.currentPokemon;
        const cries = (atual && atual.id === id && atual.cries) || {};
        const BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';

        // O cry "latest" vem primeiro: e o de melhor qualidade e alguns
        // arquivos "legacy" nao tocam. Antes a ordem era a inversa e o
        // fallback nunca disparava, porque play() resolve mesmo quando a
        // decodificacao falha depois — a falha chega pelo evento 'error'.
        const fontes = [
            cries.latest || `${BASE}/latest/${id}.ogg`,
            cries.legacy || `${BASE}/legacy/${id}.ogg`,
        ];

        const tentar = (i) => {
            if (i >= fontes.length) {
                console.warn(`Nenhum cry disponível para: ${id}`);
                return;
            }
            const audio = new Audio();
            audio.addEventListener('error', () => tentar(i + 1), { once: true });
            audio.src = fontes[i];
            audio.play().catch(() => tentar(i + 1));
        };
        tentar(0);
    },

    /** Sprite local da versao de jogo selecionada. */
    getSprite(id, shiny) {
        return spritePokemon(id, { versao: this.state.versionGroup, shiny });
    },

    async loadPokemon(query) {
        this.dom.loadingOverlay.classList.remove('hidden');

        // Cada chamada recebe um número; se outra começar enquanto esta espera,
        // a resposta antiga é descartada em vez de sobrescrever a tela.
        const requisicao = (this._loadSeq = (this._loadSeq || 0) + 1);
        const obsoleta = () => requisicao !== this._loadSeq;

        let data = null;
        try {
            data = await getPokemon(query);
        } catch (e) {
            console.error('Falha ao carregar o Pokémon:', e);
        }
        if (obsoleta()) return;

        if (!data) {
            alert('Pokémon não encontrado!');
            this.dom.loadingOverlay.classList.add('hidden');
            return;
        }

        this.state.currentPokemon = data;
        this.state.isShiny = false;
        this.dom.btnShiny.style.transform = 'scale(1)';
        this.dom.btnShiny.style.background = 'var(--btn-bg)';

        this.switchView('pokemon');

        if (this.dom.btnPrev) this.dom.btnPrev.style.visibility = data.id > 1 ? 'visible' : 'hidden';
        if (this.dom.btnNext) this.dom.btnNext.style.visibility = data.id < 386 ? 'visible' : 'hidden';

        const tipoPrincipal = data.tipos[0];
        this.dom.dynamicBg.className = `badge-${tipoPrincipal}`;

        // --- Identificacao ---
        this.dom.pName.textContent = data.nome;
        this.dom.pNum.textContent = `#${String(data.id).padStart(3, '0')}`;
        this.dom.pHeight.textContent = `${(data.altura / 10).toFixed(1)} m`;
        this.dom.pWeight.textContent = `${(data.peso / 10).toFixed(1)} kg`;
        this.dom.pImg.src = this.getSprite(data.id, false);
        this.dom.pImg.alt = data.nome;

        // --- Habilidade principal, com descricao no tooltip ---
        const habilidade = data.habilidades.find(a => !a.oculta) || data.habilidades[0];
        if (habilidade) {
            this.dom.pAbility.textContent = habilidade.nome.replace(/-/g, ' ');
            this.dom.pAbility.style.textTransform = 'capitalize';
            this.dom.pAbility.parentElement.setAttribute('data-tooltip', 'Carregando...');
            getHabilidades().then(mapa => {
                const traduzida = window.TRANSLATIONS?.abilities?.[habilidade.nome];
                const desc = (traduzida && traduzida.trim())
                    || mapa[habilidade.nome]?.desc
                    || 'Sem descrição.';
                this.dom.pAbility.parentElement.setAttribute('data-tooltip', desc.replace(/"/g, '&quot;'));
            }).catch(() => {});
        } else {
            this.dom.pAbility.textContent = 'N/A';
            this.dom.pAbility.parentElement.removeAttribute('data-tooltip');
        }

        // --- EVs concedidos ---
        const evs = Object.entries(data.evs).map(([k, v]) => `${v} ${NOMES_EV[k] || k}`);
        if (this.dom.pEvs) this.dom.pEvs.textContent = evs.length ? evs.join(', ') : '0';

        this.updateFavBtn(data.id);
        this.updateTeamBtn(data.id);
        this.updateCaptureBtn(data.id);

        // --- Tipos ---
        this.dom.badge1.textContent = TYPE_TRANSLATIONS[tipoPrincipal] || tipoPrincipal;
        this.dom.badge1.className = `pokemon-type-badge badge1 badge-${tipoPrincipal}`;
        this.dom.badge1.style.display = 'inline-block';

        const tipoSecundario = data.tipos[1];
        if (tipoSecundario) {
            this.dom.badge2.textContent = TYPE_TRANSLATIONS[tipoSecundario] || tipoSecundario;
            this.dom.badge2.className = `pokemon-type-badge badge2 badge-${tipoSecundario}`;
            this.dom.badge2.style.display = 'inline-block';
        } else {
            this.dom.badge2.style.display = 'none';
        }

        // --- Grupos de ovo ---
        const eggEl = document.getElementById('egg-groups');
        if (eggEl) {
            const grupos = (data.gruposOvo || []).filter(g => g !== 'no-eggs');
            const pilula = (texto) =>
                `<span style="background:var(--glass-bg); padding:2px 8px; border-radius:12px; border:1px solid var(--glass-border);">${texto}</span>`;
            eggEl.innerHTML = grupos.length
                ? grupos.map(g => pilula(`🥚 ${GRUPOS_OVO[g] || g}`)).join('')
                : pilula('Sem Ovos');
        }

        // --- Categoria e descricao ---
        const traduzidaCat = window.TRANSLATIONS_PT?.genera?.[data.categoria];
        this.dom.pCat.textContent = traduzidaCat || data.categoria || 'Pokémon';

        const traduzidaDesc = window.TRANSLATIONS?.pokedex?.[data.id];
        this.dom.pDesc.textContent = (traduzidaDesc && traduzidaDesc.trim())
            || data.descricao
            || 'Sem descrição';

        document.title = `${data.nome.toUpperCase()} - Hoenn & Kanto Wiki`;

        // --- Secoes (isoladas: uma falha nao pode travar a tela) ---
        const vg = this.state.versionGroup;
        [
            () => renderStats(data.stats),
            () => renderMatchups(data.tipos),
            () => renderEncounters(data.id, data.locais, vg),
            () => renderMoves(data.golpes, vg),
            () => renderEvolutions(data.evolucoes, vg),
        ].forEach(fn => {
            try { fn(); } catch (e) { console.error('Falha ao renderizar seção do Pokémon:', e); }
        });

        // O cry só toca sozinho no desktop; no mobile fica a cargo do botão 🔊
        if (!this.isTouchDevice()) this.playCry(data.id);
        this.dom.loadingOverlay.classList.add('hidden');
        window.scrollTo(0, 0);
    },
};
