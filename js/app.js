const app = {
    state: {
        currentPokemon: null,
        favorites: JSON.parse(localStorage.getItem('wiki-favs') || '[]'),
        versionGroup: 'emerald', // ruby-sapphire, firered-leafgreen
        isShiny: false
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
        badge1: document.querySelector('.badge1'),
        badge2: document.querySelector('.badge2'),
        
        btnFav: document.getElementById('btn-fav'),
        btnShiny: document.getElementById('btn-shiny'),
        btnCry: document.getElementById('btn-cry')
    },

    init() {
        this.bindEvents();
        this.initTheme();
        this.renderGrid();
    },

    bindEvents() {
        // Navegação Lateral
        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                this.dom.navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchView(btn.dataset.view);
            });
        });

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

        // Busca Parcial Dinâmica no Grid
        this.dom.searchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim().toLowerCase();
            const cards = document.querySelectorAll('.grid-card');
            
            // Força a voltar pra view de dashboard quando começa a digitar
            if (val.length > 0 && !document.getElementById('view-dashboard').classList.contains('active')) {
                this.switchView('pokedex');
                this.dom.navBtns.forEach(b => b.classList.remove('active'));
                this.dom.navBtns[0].classList.add('active'); // Pokedex tab
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
        });

        // Seletor de Versão
        this.dom.versionSelect.addEventListener('change', (e) => {
            this.state.versionGroup = e.target.value;
            if (this.state.currentPokemon) {
                // Re-render moves and encounters based on new version
                renderMoves(this.state.currentPokemon.moves, this.state.versionGroup);
                renderEncounters(this.state.currentPokemon.id, this.state.versionGroup);
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
            if (this.state.favorites.includes(id)) {
                this.state.favorites = this.state.favorites.filter(f => f !== id);
            } else {
                this.state.favorites.push(id);
            }
            localStorage.setItem('wiki-favs', JSON.stringify(this.state.favorites));
            this.updateFavBtn(id);
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
            const current = document.documentElement.getAttribute('data-theme');
            const novo = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', novo);
            localStorage.setItem('wiki-theme', novo);
            this.dom.themeToggle.textContent = novo === 'dark' ? '☀️' : '🌙';
        });
    },

    switchView(viewId) {
        this.dom.views.forEach(v => v.classList.remove('active'));
        // Special mapping if needed, mas aqui dashboard = pokedex, pokemon = hidden
        if (viewId === 'pokedex') {
            document.getElementById('view-dashboard').classList.add('active');
            this.dom.dynamicBg.className = 'type-normal';
        } else if (viewId === 'pokemon') {
            document.getElementById('view-pokemon').classList.add('active');
        }
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
                if (window.TRANSLATIONS && window.TRANSLATIONS.abilities && window.TRANSLATIONS.abilities[abName]) {
                    if (window.TRANSLATIONS.abilities[abName].trim() !== '') {
                        abDesc = window.TRANSLATIONS.abilities[abName];
                    }
                }
                this.dom.pAbility.parentElement.setAttribute('data-tooltip', abDesc.replace(/"/g, '&quot;'));
            });
        } else {
            this.dom.pAbility.textContent = 'N/A';
            this.dom.pAbility.parentElement.removeAttribute('data-tooltip');
        }
        this.updateFavBtn(data.id);
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
            
            renderEvolutions(species.evolution_chain.url, this.versionGroup);
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
                this.loadPokemon(i);
                this.dom.searchInput.value = ''; // Limpa a busca ao entrar num pokemon
                document.querySelectorAll('.grid-card').forEach(c => c.style.display = 'flex');
            });
            this.dom.gridContainer.appendChild(card);
            observer.observe(card);
        }
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
