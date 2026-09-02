// Helper de som retro
function playClickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
}

const app = {
    state: {
        currentPokemon: null,
        favorites: JSON.parse(localStorage.getItem('wiki-favs') || '[]'),
        team: JSON.parse(localStorage.getItem('wiki-team') || '[]'),
        versionGroup: 'emerald', // ruby-sapphire, firered-leafgreen
        isShiny: false,
        lang: 'pt'
    },
    dom: {
        navBtns: document.querySelectorAll('.nav-btn'),
        views: document.querySelectorAll('.view-section'),
        gridContainer: document.getElementById('pokedex-grid'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('input-search'),
        versionSelect: document.getElementById('game-version-select'),
        loadingOverlay: document.getElementById('loading-overlay'),
        themeToggle: document.getElementById('theme-toggle'),
        langToggle: document.getElementById('lang-toggle'),
        dynamicBg: document.getElementById('dynamic-bg'),
        
        // Pokemon Profile
        pName: document.querySelector('.pokemon-name'),
        pNum: document.querySelector('.pokemon-number'),
        pCat: document.querySelector('.pokemon-category'),
        pImg: document.querySelector('.pokemon-image'),
        pDesc: document.querySelector('.pokemon-description'),
        pHeight: document.querySelector('.pokemon-height'),
        pWeight: document.querySelector('.pokemon-weight'),
        pAbility: document.querySelector('.pokemon-ability'),
        pEvs: document.querySelector('.pokemon-evs'),
        badge1: document.querySelector('.badge1'),
        badge2: document.querySelector('.badge2'),
        
        btnFav: document.getElementById('btn-fav'),
        btnTeam: document.getElementById('btn-team'),
        btnShiny: document.getElementById('btn-shiny'),
        btnCry: document.getElementById('btn-cry'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next')
    },

    init() {
        this.initLang();
        this.bindEvents();
        this.initTheme();
        this.renderTypeFilters();
        this.renderGrid();
        this.handleRouting();
    },

    handleRouting() {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('pokemon/')) {
            const id = parseInt(hash.split('/')[1]);
            if (!isNaN(id)) {
                this.loadPokemon(id);
            }
        } else if (hash === 'team') {
            this.switchView('team');
        } else if (hash === 'gyms') {
            this.switchView('gyms');
        } else if (hash === 'tms') {
            this.switchView('tms');
            this.renderTMs();
        } else {
            this.switchView('pokedex');
            document.title = 'Hoenn & Kanto Wiki - RSE / FRLG';
            this.dom.navBtns.forEach(b => b.classList.remove('active'));
            if (this.dom.navBtns[0]) this.dom.navBtns[0].classList.add('active');
        }
    },

    bindEvents() {
        // Navegação Lateral
        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                playClickSound();
                window.location.hash = btn.dataset.view === 'pokedex' ? '' : btn.dataset.view;
            });
        });

        window.addEventListener('hashchange', () => this.handleRouting());

        if (this.dom.btnPrev) {
            this.dom.btnPrev.addEventListener('click', () => {
                if (this.state.currentPokemon && this.state.currentPokemon.id > 1) {
                    playClickSound();
                    window.location.hash = `pokemon/${this.state.currentPokemon.id - 1}`;
                }
            });
        }

        if (this.dom.btnNext) {
            this.dom.btnNext.addEventListener('click', () => {
                if (this.state.currentPokemon && this.state.currentPokemon.id < 386) {
                    playClickSound();
                    window.location.hash = `pokemon/${this.state.currentPokemon.id + 1}`;
                }
            });
        }

        // Abas de Ataques (Moveset)
        document.querySelectorAll('.move-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.move-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.move-section').forEach(s => s.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.target).classList.add('active');
            });
        });

        // Formulário de Busca (Impede recarregar)
        this.dom.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Busca Parcial Dinâmica no Grid (com Debounce para otimização)
        let searchTimeout;
        this.dom.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const val = e.target.value.trim().toLowerCase();
                const cards = document.querySelectorAll('.grid-card');
                
                // Força a voltar pra view de dashboard quando começa a digitar
                if (val.length > 0 && !document.getElementById('view-dashboard').classList.contains('active')) {
                    window.location.hash = '';
                }

                cards.forEach(card => {
                    const name = card.dataset.name || '';
                    const idStr = String(card.dataset.id);
                    if (name.includes(val) || idStr === val) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }, 150); // 150ms delay
        });

        // Seletor de Versão
        this.dom.versionSelect.addEventListener('change', (e) => {
            this.state.versionGroup = e.target.value;
            if (this.state.currentPokemon) {
                // Re-render moves and encounters based on new version
                renderMoves(this.state.currentPokemon.moves, this.state.versionGroup);
                renderEncounters(this.state.currentPokemon.id, this.state.versionGroup);
                if (this.state.currentSpecies && this.state.currentSpecies.evolution_chain) {
                    renderEvolutions(this.state.currentSpecies.evolution_chain.url);
                }
            }
            if (document.getElementById('view-gyms').classList.contains('active')) {
                this.renderGyms();
            }
            if (document.getElementById('view-tms').classList.contains('active')) {
                this.renderTMs();
            }
        });

        // Controles de Imagem
        this.dom.btnShiny.addEventListener('click', () => {
            this.state.isShiny = !this.state.isShiny;
            if (this.state.currentPokemon) {
                this.dom.pImg.src = this.getSprite(this.state.currentPokemon, this.state.isShiny);
                this.dom.btnShiny.style.transform = this.state.isShiny ? 'scale(1.2)' : 'scale(1)';
                this.dom.btnShiny.style.background = this.state.isShiny ? 'var(--type-electric)' : 'var(--btn-bg)';
            }
        });

        this.dom.btnFav.addEventListener('click', () => {
            if (!this.state.currentPokemon) return;
            const id = this.state.currentPokemon.id;
            const idx = this.state.favorites.indexOf(id);
            if (idx > -1) {
                this.state.favorites.splice(idx, 1);
            } else {
                this.state.favorites.push(id);
            }
            localStorage.setItem('wiki-favs', JSON.stringify(this.state.favorites));
            this.updateFavBtn(id);
        });

        this.dom.btnTeam.addEventListener('click', () => {
            if (!this.state.currentPokemon) return;
            playClickSound();
            const id = this.state.currentPokemon.id;
            const idx = this.state.team.indexOf(id);
            if (idx > -1) {
                this.state.team.splice(idx, 1);
            } else {
                if (this.state.team.length >= 6) {
                    alert('Sua equipe já está cheia (máximo de 6 Pokémon)!');
                    return;
                }
                this.state.team.push(id);
            }
            localStorage.setItem('wiki-team', JSON.stringify(this.state.team));
            this.updateTeamBtn(id);
        });

        this.dom.btnCry.addEventListener('click', () => {
            if (this.state.currentPokemon) this.playCry(this.state.currentPokemon.id);
        });
    },

    initTheme() {
        const t = localStorage.getItem('wiki-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', t);
        this.dom.themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
        
        this.dom.themeToggle.addEventListener('click', () => {
            playClickSound();
            const current = document.documentElement.getAttribute('data-theme');
            const novo = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', novo);
            localStorage.setItem('wiki-theme', novo);
            this.dom.themeToggle.textContent = novo === 'dark' ? '☀️' : '🌙';
        });
    },

    initLang() {
        const lang = localStorage.getItem('wiki-lang') || 'pt';
        this.setLanguage(lang);
        this.dom.langToggle.addEventListener('click', () => {
            playClickSound();
            const current = this.state.lang;
            this.setLanguage(current === 'pt' ? 'en' : 'pt');
            if (this.state.currentPokemon) {
                // Re-renderiza o pokemon atual para atualizar a linguagem
                this.loadPokemon(this.state.currentPokemon.id);
            }
        });
    },

    setLanguage(lang) {
        this.state.lang = lang;
        localStorage.setItem('wiki-lang', lang);
        window.TRANSLATIONS = lang === 'pt' ? window.TRANSLATIONS_PT : window.TRANSLATIONS_EN;
        this.dom.langToggle.textContent = lang === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN';
    },

    switchView(viewId) {
        this.dom.views.forEach(v => v.classList.remove('active'));
        // Special mapping if needed, mas aqui dashboard = pokedex, pokemon = hidden
        if (viewId === 'pokedex') {
            document.getElementById('view-dashboard').classList.add('active');
            this.dom.dynamicBg.className = 'bg-default';
        } else if (viewId === 'pokemon') {
            document.getElementById('view-pokemon').classList.add('active');
        } else if (viewId === 'team') {
            document.getElementById('view-team').classList.add('active');
            this.dom.dynamicBg.className = 'bg-default';
            this.renderTeam();
        } else if (viewId === 'gyms') {
            document.getElementById('view-gyms').classList.add('active');
            this.dom.dynamicBg.className = 'bg-default';
            this.renderGyms();
        } else if (viewId === 'tms') {
            document.getElementById('view-tms').classList.add('active');
            this.dom.dynamicBg.className = 'bg-default';
        }
    },

    renderTMs() {
        const grid = document.getElementById('tms-grid');
        if (!grid) return;

        let html = '';
        if (typeof GEN3_MACHINES !== 'undefined') {
            GEN3_MACHINES.forEach(machine => {
                let desc = "Sem descrição.";
                if (window.TRANSLATIONS && window.TRANSLATIONS.moves && window.TRANSLATIONS.moves[machine.move]) {
                    desc = window.TRANSLATIONS.moves[machine.move];
                }
                
                let location = "Local desconhecido / Aleatório";
                if (window.TRANSLATIONS && window.TRANSLATIONS.tm_locations && window.TRANSLATIONS.tm_locations[machine.move]) {
                    const locObj = window.TRANSLATIONS.tm_locations[machine.move];
                    location = locObj[this.state.versionGroup] || locObj["emerald"] || location;
                }

                const nameCap = machine.move.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                
                html += `
                    <div class="grid-card machine-card" style="display:flex; flex-direction:column; gap:8px; padding:15px; border-radius:12px; background:var(--glass-bg); border:1px solid var(--glass-border); box-sizing:border-box;">
                        <div style="display:flex; justify-content:flex-start; align-items:center; gap:12px;">
                            <strong>${machine.id}</strong>
                            <span class="badge-${machine.type}" style="padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase;">${machine.type}</span>
                        </div>
                        <h4 style="margin: 0; font-size: 1.1rem; word-wrap: break-word;">${nameCap}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin:0; text-align: justify; flex: 1;">${desc}</p>
                        
                        <div style="margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); font-size:0.8rem;">
                            <strong style="color:var(--text-color);">📍 Encontrar:</strong> <span style="color:var(--text-muted);">${location}</span>
                        </div>
                    </div>
                `;
            });
        }
        grid.innerHTML = html;
    },

    updateFavBtn(id) {
        if (this.state.favorites.includes(id)) {
            this.dom.btnFav.classList.add('active');
            this.dom.btnFav.textContent = '❤️';
        } else {
            this.dom.btnFav.classList.remove('active');
            this.dom.btnFav.textContent = '🤍';
        }
    },

    updateTeamBtn(id) {
        if (this.state.team.includes(id)) {
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
        let cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${id}.ogg`; // Fallback
        if (this.state.currentPokemon && this.state.currentPokemon.id === id && this.state.currentPokemon.cries) {
            // Usa o cry legacy (Gen 1-5) se existir, por ser uma wiki de Gen 3
            cryUrl = this.state.currentPokemon.cries.legacy || this.state.currentPokemon.cries.latest || cryUrl;
        }
        const audio = new Audio(cryUrl);
        audio.play().catch(e => console.warn(`Cry indisponível: ${id}`));
    },

    getSprite(data, shiny) {
        // Gen 3 official artworks or Emerald animated
        let sprite = null;
        try {
            sprite = shiny ? 
                data.sprites.versions["generation-iii"].emerald.front_shiny : 
                data.sprites.versions["generation-iii"].emerald.front_default;
        } catch(e){}
        
        if(!sprite) {
            sprite = shiny ? data.sprites.front_shiny : data.sprites.front_default;
        }
        return sprite;
    },

    async loadPokemon(query) {
        this.dom.loadingOverlay.classList.remove('hidden');
        
        const data = await API.getPokemon(query);
        if (!data) {
            alert('Pokémon não encontrado!');
            this.dom.loadingOverlay.classList.add('hidden');
            return;
        }
        
        const species = await API.getSpecies(data.id);
        this.state.currentPokemon = data;
        
        // Reversão de Tipos para a Regra Clássica (Gen 3)
        // Se past_types existir e a geração de limite for maior ou igual a Gen 3 (ex: generation-v significa que mudou na Gen 6)
        if (data.past_types && data.past_types.length > 0) {
            // A PokeAPI ordena os past_types. Vamos pegar a tipagem válida mais antiga (que cobre a Gen 3)
            const past = data.past_types[0];
            if (past) {
                // Sobrescreve os tipos atuais pelo histórico antigo
                data.types = past.types;
            }
        }

        this.state.isShiny = false;
        this.dom.btnShiny.style.transform = 'scale(1)';
        this.dom.btnShiny.style.background = 'var(--btn-bg)';

        // Switch to Pokemon View
        this.switchView('pokemon');

        // Nav Buttons Visibility
        if (this.dom.btnPrev) this.dom.btnPrev.style.visibility = data.id > 1 ? 'visible' : 'hidden';
        if (this.dom.btnNext) this.dom.btnNext.style.visibility = data.id < 386 ? 'visible' : 'hidden';

        // Update Colors
        const primaryType = data.types[0].type.name;
        this.dom.dynamicBg.className = `badge-${primaryType}`;

        // Basic Info
        this.dom.pName.textContent = data.name;
        this.dom.pNum.textContent = `#${String(data.id).padStart(3, '0')}`;
        this.dom.pHeight.textContent = `${(data.height / 10).toFixed(1)} m`;
        this.dom.pWeight.textContent = `${(data.weight / 10).toFixed(1)} kg`;
        
        const mainAb = data.abilities.find(a => !a.is_hidden) || data.abilities[0];
        if (mainAb) {
            const abName = mainAb.ability.name.replace(/[-]/g, ' ');
            this.dom.pAbility.textContent = abName;
            this.dom.pAbility.style.textTransform = 'capitalize';
            
            // Busca a descrição da Habilidade
            this.dom.pAbility.parentElement.setAttribute('data-tooltip', 'Carregando...');
            fetchWithCache(mainAb.ability.url, `ab_${abName}`).then(abData => {
                let abDesc = "Sem descrição.";
                if (abData && abData.flavor_text_entries) {
                    const engFlavor = abData.flavor_text_entries.find(f => f.language.name === 'en');
                    if (engFlavor) abDesc = engFlavor.flavor_text.replace(/[\n\f]/g, ' ');
                }
                const rawAbName = mainAb.ability.name;
                if (window.TRANSLATIONS && window.TRANSLATIONS.abilities && window.TRANSLATIONS.abilities[rawAbName]) {
                    if (window.TRANSLATIONS.abilities[rawAbName].trim() !== '') {
                        abDesc = window.TRANSLATIONS.abilities[rawAbName];
                    }
                }
                this.dom.pAbility.parentElement.setAttribute('data-tooltip', abDesc.replace(/"/g, '&quot;'));
            });
        } else {
            this.dom.pAbility.textContent = 'N/A';
            this.dom.pAbility.parentElement.removeAttribute('data-tooltip');
        }
        
        // Effort Values (EV Yield)
        let evs = [];
        data.stats.forEach(s => {
            if (s.effort > 0) {
                let statName = s.stat.name;
                if (statName === 'hp') statName = 'HP';
                else if (statName === 'attack') statName = 'Atk';
                else if (statName === 'defense') statName = 'Def';
                else if (statName === 'special-attack') statName = 'Sp.Atk';
                else if (statName === 'special-defense') statName = 'Sp.Def';
                else if (statName === 'speed') statName = 'Spd';
                evs.push(`${s.effort} ${statName}`);
            }
        });
        if (this.dom.pEvs) {
            this.dom.pEvs.textContent = evs.length > 0 ? evs.join(', ') : '0';
        }

        this.updateFavBtn(data.id);
        this.updateTeamBtn(data.id);
        this.dom.pImg.src = this.getSprite(data, false);

        // Types
        this.dom.badge1.textContent = TYPE_TRANSLATIONS[primaryType] || primaryType;
        this.dom.badge1.className = `pokemon-type-badge badge1 badge-${primaryType}`;
        this.dom.badge1.style.display = 'inline-block';

        if (data.types[1]) {
            const secType = data.types[1].type.name;
            this.dom.badge2.textContent = TYPE_TRANSLATIONS[secType] || secType;
            this.dom.badge2.className = `pokemon-type-badge badge2 badge-${secType}`;
            this.dom.badge2.style.display = 'inline-block';
        } else {
            this.dom.badge2.style.display = 'none';
        }

        // Species Text (Genus and Flavor)
        if (species) {
            const genus = species.genera.find(g => g.language.name === 'pt-BR' || g.language.name === 'en');
            this.dom.pCat.textContent = genus ? genus.genus : 'Pokémon';
            
            const flavor = species.flavor_text_entries.find(f => f.language.name === 'pt-BR' || f.language.name === 'pt' || f.language.name === 'es' || f.language.name === 'en');
            let descText = flavor ? flavor.flavor_text.replace(/[\n\f]/g, ' ') : 'Sem descrição';
            
            // Override pela tradução manual, se existir
            if (window.TRANSLATIONS && window.TRANSLATIONS.pokedex && window.TRANSLATIONS.pokedex[data.id]) {
                if (window.TRANSLATIONS.pokedex[data.id].trim() !== '') {
                    descText = window.TRANSLATIONS.pokedex[data.id];
                }
            }
            
            this.dom.pDesc.textContent = descText;
            
            document.title = `${data.name.toUpperCase()} - Hoenn & Kanto Wiki`; // Dynamic Title
            
            this.state.currentSpecies = species;
            renderEvolutions(species.evolution_chain.url);
        }

        // Sub-renders
        renderStats(data.stats);
        renderMatchups(data.types);
        renderEncounters(data.id, this.state.versionGroup);
        renderMoves(data.moves, this.state.versionGroup);

        this.playCry(data.id);
        this.dom.loadingOverlay.classList.add('hidden');
        window.scrollTo(0,0);
    },

    // Lazy load the first 386 pokemon (Gen 1 to 3)
    async renderGrid() {
        const maxId = 386; // Gen 3 limit
        
        // Pega todos os nomes primeiro para permitir a busca parcial instantânea
        let pokemonList = [];
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${maxId}`);
            const data = await res.json();
            pokemonList = data.results;
        } catch(e) {}

        let observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const id = card.dataset.id;
                    if (!card.dataset.loaded) {
                        card.querySelector('img').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                        card.dataset.loaded = 'true';
                    }
                    observer.unobserve(card);
                }
            });
        }, { rootMargin: '200px' });

        const fragment = document.createDocumentFragment();

        for(let i = 1; i <= maxId; i++) {
            const pName = pokemonList[i-1] ? pokemonList[i-1].name : '...';
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.dataset.id = i;
            card.dataset.name = pName;
            card.innerHTML = `
                <span class="grid-card-id">#${String(i).padStart(3, '0')}</span>
                <img src="./images/miss.png" alt="carregando">
                <span class="grid-card-name" style="text-transform: capitalize;">${pName}</span>
            `;
            card.addEventListener('click', () => {
                playClickSound();
                window.location.hash = `pokemon/${i}`;
                this.dom.searchInput.value = ''; // Limpa a busca ao entrar num pokemon
                
                // Remove o active de todos os filtros de tipo
                document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
                const btnAll = document.querySelector('.type-filter-btn.type-all');
                if (btnAll) btnAll.classList.add('active');
                
                document.querySelectorAll('.grid-card').forEach(c => c.style.display = 'flex');
            });
            fragment.appendChild(card);
            observer.observe(card);
        }
        this.dom.gridContainer.appendChild(fragment);
    },

    async renderTypeFilters() {
        const types = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel'];
        const container = document.getElementById('type-filters');
        if (!container) return;
        
        // Botão "Todos"
        const btnAll = document.createElement('button');
        btnAll.className = 'type-filter-btn type-all active';
        btnAll.textContent = 'ALL';
        btnAll.style.background = '#888';
        btnAll.addEventListener('click', () => {
            playClickSound();
            document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
            btnAll.classList.add('active');
            // Remove search text and show all cards
            this.dom.searchInput.value = '';
            document.querySelectorAll('.grid-card').forEach(c => c.style.display = 'flex');
        });
        container.appendChild(btnAll);

        types.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `type-filter-btn type-${type}`;
            btn.textContent = type.toUpperCase();
            btn.style.background = `var(--type-${type})`;
            
            btn.addEventListener('click', async () => {
                playClickSound();
                document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.dom.searchInput.value = '';
                
                try {
                    this.dom.loadingOverlay.classList.remove('hidden');
                    const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
                    const data = await res.json();
                    const allowedNames = data.pokemon.map(p => p.pokemon.name);
                    
                    document.querySelectorAll('.grid-card').forEach(card => {
                        const cardName = card.dataset.name;
                        if (allowedNames.includes(cardName)) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                } catch(e) {}
                this.dom.loadingOverlay.classList.add('hidden');
            });
            container.appendChild(btn);
        });
    },

    async renderTeam() {
        const grid = document.getElementById('team-grid');
        const analysis = document.getElementById('team-analysis');
        if (!grid || !analysis) return;
        
        grid.innerHTML = '<div class="spinner"></div>';
        
        if (this.state.team.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); width: 100%; text-align: center;">Sua equipe está vazia. Volte à Pokédex e adicione alguns Pokémon!</p>';
            analysis.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                grid.innerHTML += `<div class="team-slot empty" onclick="window.location.hash=''"></div>`;
            }
            return;
        }

        const teamPromises = this.state.team.map(id => API.getPokemon(id));
        const teamResults = await Promise.all(teamPromises);
        const teamData = teamResults.filter(data => data !== null);

        // Render Slots
        grid.innerHTML = '';
        teamData.forEach((p, idx) => {
            const slot = document.createElement('div');
            const primaryType = p.types[0].type.name;
            slot.className = `team-slot badge-${primaryType}`;
            const sprite = this.getSprite(p, false);
            
            slot.innerHTML = `
                <button class="remove-btn" title="Remover" data-id="${p.id}">X</button>
                <img src="${sprite}" alt="${p.name}">
                <span class="team-name">${p.name}</span>
            `;
            
            // Go to pokemon profile when clicking the slot
            slot.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    playClickSound();
                    window.location.hash = `pokemon/${p.id}`;
                }
            });
            
            // Remove from team button
            slot.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                playClickSound();
                this.state.team = this.state.team.filter(tId => tId !== p.id);
                localStorage.setItem('wiki-team', JSON.stringify(this.state.team));
                this.renderTeam(); // Re-render
            });

            grid.appendChild(slot);
        });

        // Add empty slots
        for (let i = teamData.length; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'team-slot empty';
            slot.addEventListener('click', () => { window.location.hash = ''; });
            grid.appendChild(slot);
        }

        // Calculate Matchups
        analysis.innerHTML = '<div class="spinner"></div>';
        const typeWeaknessesCount = {};
        Object.keys(TYPE_TRANSLATIONS).forEach(t => typeWeaknessesCount[t] = 0);
        
        for (let p of teamData) {
            const typePromises = p.types.map(t => API.getType(t.type.name));
            const typeResults = await Promise.all(typePromises);
            
            const pMult = {};
            Object.keys(TYPE_TRANSLATIONS).forEach(t => pMult[t] = 1);
            
            typeResults.forEach(result => {
                if (!result) return;
                const dmg = result.damage_relations;
                dmg.double_damage_from.forEach(t => pMult[t.name] *= 2);
                dmg.half_damage_from.forEach(t => pMult[t.name] *= 0.5);
                dmg.no_damage_from.forEach(t => pMult[t.name] *= 0);
            });
            
            for (let t in pMult) {
                if (pMult[t] > 1) {
                    typeWeaknessesCount[t]++;
                }
            }
        }

        let aHtml = '';
        for (let t in typeWeaknessesCount) {
            const count = typeWeaknessesCount[t];
            let cssClass = '';
            if (count >= 3) cssClass = 'weakness-high';
            else if (count === 0 && teamData.length > 0) cssClass = 'resist-high';
            
            aHtml += `
                <div class="team-analysis-item badge-${t} ${cssClass}" title="${count} Pokémon fracos contra ${TYPE_TRANSLATIONS[t]}">
                    <span>${TYPE_TRANSLATIONS[t]}</span>
                    <span class="team-analysis-count">${count}</span>
                </div>
            `;
        }
        analysis.innerHTML = aHtml;
    },

    async renderGyms() {
        const container = document.getElementById('gyms-container');
        if (!container || !window.GYM_LEADERS) return;
        
        container.innerHTML = '<div class="spinner"></div>';
        
        const vg = this.state.versionGroup;
        const leaders = window.GYM_LEADERS[vg];
        
        if (!leaders) {
            container.innerHTML = '<p>Dados não encontrados.</p>';
            return;
        }

        let html = '';
        const badgeMap = {
            "Boulder Badge": 1, "Cascade Badge": 2, "Thunder Badge": 3, "Rainbow Badge": 4, 
            "Soul Badge": 5, "Marsh Badge": 6, "Volcano Badge": 7, "Earth Badge": 8,
            "Stone Badge": 17, "Knuckle Badge": 18, "Dynamo Badge": 19, "Heat Badge": 20, 
            "Balance Badge": 21, "Feather Badge": 22, "Mind Badge": 23, "Rain Badge": 24
        };

        for (let leader of leaders) {
            let teamHtml = '';
            for (let poke of leader.team) {
                // Uso direto da URL da imagem para evitar 40+ chamadas HTTP simultâneas na PokéAPI e travar a página
                const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`;
                teamHtml += `
                    <div class="gym-poke" onclick="playClickSound(); window.location.hash='pokemon/${poke.id}'">
                        <img src="${spriteUrl}" alt="Poke ${poke.id}" loading="lazy">
                        <span>Nv. ${poke.level}</span>
                    </div>
                `;
            }
            
            let badgeImgHtml = '';
            if (badgeMap[leader.badge]) {
                badgeImgHtml = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${badgeMap[leader.badge]}.png" alt="${leader.badge}" style="height: 40px; image-rendering: pixelated;">`;
            }

            html += `
                <div class="gym-card">
                    <h3>${leader.name}</h3>
                    <span class="gym-city">${leader.city}</span>
                    
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 15px 0;">
                        ${badgeImgHtml}
                        <span class="gym-badge badge-${leader.type}" style="margin:0;">${leader.badge}</span>
                    </div>

                    <img src="${leader.sprite}" class="gym-sprite" alt="${leader.name}">
                    <div class="gym-team">
                        ${teamHtml}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
