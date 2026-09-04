// Grade da Pokedex: filtros, busca, estado vazio e painel.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { getIndice, getEspeciesDoTipo } from '../core/dataset.js';
import { TYPE_TRANSLATIONS } from '../core/types.js';
import { playClickSound } from '../ui/sound.js';

export default {
    updateDashboardStats() {
        // Team size
        const statTeam = document.getElementById('stat-team-size');
        if (statTeam) statTeam.textContent = `${this.state.team.length}/6`;
        
        // Fav count
        const statFav = document.getElementById('stat-fav-count');
        if (statFav) statFav.textContent = this.state.favorites.length;

        // Capturados
        const statCatch = document.getElementById('stat-catch-count');
        const statCatchBar = document.getElementById('stat-catch-bar');
        const caught = this.state.captures.length;
        if (statCatch) statCatch.textContent = `${caught}/386`;
        if (statCatchBar) statCatchBar.style.width = `${(caught / 386) * 100}%`;
        
        // TM count
        let tmCount = 0;
        const tmPrefix = this.getScopedKey('tm-');
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(tmPrefix) && localStorage.getItem(k) === 'true') {
                tmCount++;
            }
        }
        const statTm = document.getElementById('stat-tm-count');
        if (statTm) statTm.textContent = tmCount;

        // Resumo visível mesmo com o painel recolhido
        const digest = document.getElementById('trainer-panel-digest');
        if (digest) {
            digest.textContent =
                `${this.state.captures.length}/386 capturados · ${this.state.team.length}/6 na equipe · ${this.state.favorites.length} favoritos`;
        }
    },


    initDailyChecklist() {
        const checkboxes = document.querySelectorAll('.daily-task-chk');
        if (checkboxes.length === 0) return;

        // Recupera dados salvos
        let savedData = localStorage.getItem('wiki-daily-checklist');
        let dailyState = savedData ? JSON.parse(savedData) : { date: '', tasks: {} };

        // Verifica a data de hoje (Formato YYYY-MM-DD local)
        const todayStr = new Date().toLocaleDateString();

        if (dailyState.date !== todayStr) {
            // Se virou o dia, reseta
            dailyState = { date: todayStr, tasks: {} };
            localStorage.setItem('wiki-daily-checklist', JSON.stringify(dailyState));
        }

        // Aplica o estado visual
        checkboxes.forEach(chk => {
            const task = chk.dataset.task;
            chk.checked = !!dailyState.tasks[task];
            
            chk.addEventListener('change', (e) => {
                dailyState.tasks[task] = e.target.checked;
                localStorage.setItem('wiki-daily-checklist', JSON.stringify(dailyState));
            });
        });
    },

    // Shoal Cave, loteria de Lilycove e Mirage Island são de Hoenn:
    // o relógio e o checklist não valem para FireRed/LeafGreen.

    applyFilters() {
        const termo = this.state.searchTerm || '';
        const tipoPermitido = this.state.typeFilterNames; // null = todos os tipos

        this.dom.gridContainer.querySelectorAll('.grid-card').forEach(card => {
            const nome = card.dataset.name || '';
            const id = String(card.dataset.id);
            const casaBusca = !termo || nome.includes(termo) || id === termo;
            const casaTipo = !tipoPermitido || tipoPermitido.has(nome);
            card.style.display = (casaBusca && casaTipo) ? 'flex' : 'none';
        });

        this.updateEmptyState();
    },

    // Lazy load the first 386 pokemon (Gen 1 to 3)
    async renderGrid() {
        const maxId = 386; // Gen 3 limit
        
        // Indice local: nomes e tipos dos 386, num unico arquivo de ~55 KB
        let pokemonList = [];
        try {
            pokemonList = await getIndice();
        } catch (e) {
            console.error('Falha ao carregar o índice da Pokédex:', e);
        }

        let observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const id = card.dataset.id;
                    if (!card.dataset.loaded) {
                        const isCompact = document.getElementById('pokedex-grid').classList.contains('compact');
                        if (isCompact) {
                            card.querySelector('.poke-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;
                        } else {
                            card.querySelector('.poke-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/${app.state.versionGroup}/${id}.png`;
                        }
                        card.dataset.loaded = 'true';
                    }
                    observer.unobserve(card);
                }
            });
        }, { rootMargin: '200px' });

        const fragment = document.createDocumentFragment();

        // Limpa a grade antes de repopular; sem isso cada re-render duplicava
        // a Pokédex inteira sobre a anterior.
        this.dom.gridContainer.innerHTML = '';

        this.state.statusFilter = this.state.statusFilter || 'all';

        for(let i = 1; i <= maxId; i++) {
            const isCaptured = this.state.captures.includes(i);
            
            if (this.state.statusFilter === 'caught' && !isCaptured) continue;
            if (this.state.statusFilter === 'uncaught' && isCaptured) continue;

            const pName = pokemonList[i-1] ? pokemonList[i-1].nome : '...';
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.dataset.id = i;
            card.dataset.name = pName;
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `${pName}, número ${i}`);
            card.innerHTML = `
                <div class="catch-icon ${isCaptured ? 'captured' : ''}" data-id="${i}" role="button" tabindex="0" aria-pressed="${isCaptured}" title="Marcar como capturado" aria-label="Marcar ${pName} como capturado">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M22 12h-4c0-3-2-4-4-4s-4 1-4 4H2"></path><circle cx="12" cy="12" r="2"></circle></svg>
                </div>
                <span class="grid-card-id">#${String(i).padStart(3, '0')}</span>
                <img src="./images/miss.png" alt="carregando" class="poke-sprite">
                <span class="grid-card-name" style="text-transform: capitalize;">${pName}</span>
            `;
            
            const catchBtn = card.querySelector('.catch-icon');
            catchBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); catchBtn.click(); }
            });
            catchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playClickSound();
                const pokeId = parseInt(catchBtn.dataset.id);
                if (this.state.captures.includes(pokeId)) {
                    this.state.captures = this.state.captures.filter(id => id !== pokeId);
                    catchBtn.classList.remove('captured');
                } else {
                    this.state.captures.push(pokeId);
                    catchBtn.classList.add('captured');
                }
                catchBtn.setAttribute('aria-pressed', String(this.state.captures.includes(pokeId)));
                this.saveScopedData('captures', this.state.captures);
                this.updateDashboardStats();
            });

            card.addEventListener('keydown', (e) => {
                // Espaço rolaria a página; Enter/Espaço abrem o Pokémon
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
            });

            card.addEventListener('click', () => {
                playClickSound();
                window.location.hash = `pokemon/${i}`;
                this.dom.searchInput.value = ''; // Limpa a busca ao entrar num pokemon
                this.state.searchTerm = '';

                // Remove o active de todos os filtros de tipo
                document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
                const btnAll = document.querySelector('.type-filter-btn.type-all');
                if (btnAll) btnAll.classList.add('active');
                this.state.typeFilterNames = null;

                this.applyFilters();
            });
            fragment.appendChild(card);
            observer.observe(card);
        }
        this.dom.gridContainer.appendChild(fragment);
        // A grade foi remontada: reaplica busca e filtro de tipo que estavam ativos
        this.applyFilters();
    },

    // Mensagem quando nenhum card está visível (busca sem resultado ou filtro vazio)
    updateEmptyState() {
        const grid = this.dom.gridContainer;
        let msg = document.getElementById('grid-empty-state');

        const temCards = grid.querySelector('.grid-card:not([style*="display: none"])');
        if (temCards) {
            if (msg) msg.remove();
            return;
        }

        if (!msg) {
            msg = document.createElement('p');
            msg.id = 'grid-empty-state';
            msg.className = 'grid-empty-state';
            grid.appendChild(msg);
        }
        const busca = this.dom.searchInput.value.trim();
        msg.textContent = busca
            ? `Nenhum Pokémon encontrado para "${busca}".`
            : 'Nenhum Pokémon corresponde aos filtros selecionados.';
    },

    async renderTypeFilters() {
        const types = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel'];
        const container = document.getElementById('type-filters');
        if (!container) return;
        
        // Botão "Todos"
        const btnAll = document.createElement('button');
        btnAll.className = 'type-filter-btn type-all active';
        btnAll.textContent = 'Todos';
        btnAll.setAttribute('aria-pressed', 'true');
        btnAll.addEventListener('click', () => {
            playClickSound();
            document.querySelectorAll('.type-filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btnAll.classList.add('active');
            btnAll.setAttribute('aria-pressed', 'true');
            this.state.typeFilterNames = null;
            this.applyFilters();
        });
        container.appendChild(btnAll);

        types.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `type-filter-btn type-${type}`;
            btn.textContent = TYPE_TRANSLATIONS[type] || type.toUpperCase();
            btn.setAttribute('aria-pressed', 'false');
            
            btn.addEventListener('click', async () => {
                playClickSound();
                document.querySelectorAll('.type-filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                try {
                    this.dom.loadingOverlay.classList.remove('hidden');
                    // Via API.getType: fica em cache, então re-filtrar é instantâneo
                    this.state.typeFilterNames = await getEspeciesDoTipo(type);
                } catch(e) {
                    console.error('Falha ao filtrar por tipo:', e);
                    this.state.typeFilterNames = null;
                } finally {
                    this.dom.loadingOverlay.classList.add('hidden');
                }
                this.applyFilters();
            });
            container.appendChild(btn);
        });
    },

};
