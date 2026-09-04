// Cache System
const pokemonCache = new Map();

try {
    const savedCache = localStorage.getItem('pokeWikiApiCache');
    if (savedCache) {
        const parsed = JSON.parse(savedCache);
        for (const [k, v] of Object.entries(parsed)) {
            pokemonCache.set(k, v);
        }
    }
} catch(e) {}

const saveCacheToLocal = () => {
    try {
        const obj = Object.fromEntries(pokemonCache);
        localStorage.setItem('pokeWikiApiCache', JSON.stringify(obj));
    } catch(e) {}
};

// Fetch util
const fetchWithCache = async (url, cacheKey) => {
    if (pokemonCache.has(cacheKey)) return pokemonCache.get(cacheKey);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        
        // Interceptar past_types para reverter o Tipo Fada (Gen 6+) para a Gen 3
        if (data && data.types && data.past_types && data.past_types.length > 0) {
            const oldTypes = data.past_types.find(pt => pt.generation.name === 'generation-v' || pt.generation.name === 'generation-iv');
            if (oldTypes) {
                data.types = oldTypes.types;
            }
        }
        
        pokemonCache.set(cacheKey, data);
        saveCacheToLocal();
        return data;
    } catch (error) {
        return null;
    }
};

// Setup API Base URL
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Endpoints
const API = {
    getPokemon: (id) => fetchWithCache(`${POKEAPI_BASE}/pokemon/${id}`, `poke_${id}`),
    getSpecies: (id) => fetchWithCache(`${POKEAPI_BASE}/pokemon-species/${id}`, `spec_${id}`),
    getType: (name) => fetchWithCache(`${POKEAPI_BASE}/type/${name}`, `type_${name}`),
    getEvolution: (url) => fetchWithCache(url, `evo_${url}`),
    getEncounters: (id) => fetchWithCache(`${POKEAPI_BASE}/pokemon/${id}/encounters`, `enc_${id}`)
};

// Dicionário de Tipos
const TYPE_TRANSLATIONS = {
    normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico",
    grass: "Grama", ice: "Gelo", fighting: "Lutador", poison: "Venenoso",
    ground: "Terrestre", flying: "Voador", psychic: "Psíquico", bug: "Inseto",
    rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio",
    steel: "Metal", fairy: "Fada"
};

const STATS_MAP = {
    hp: "HP", attack: "ATK", defense: "DEF", 
    "special-attack": "SPA", "special-defense": "SPD", speed: "SPE"
};

// Regras Clássicas da Geração 3 (Physical/Special Split)
const GEN3_TYPE_CATEGORIES = {
    normal: "Físico", fighting: "Físico", poison: "Físico", ground: "Físico",
    flying: "Físico", bug: "Físico", rock: "Físico", ghost: "Físico", steel: "Físico",
    fire: "Especial", water: "Especial", grass: "Especial", electric: "Especial",
    psychic: "Especial", ice: "Especial", dragon: "Especial", dark: "Especial",
    fairy: "N/A" // Não existia
};

// ==========================================
// TABELA DE TIPOS DA GERAÇÃO 3
// ==========================================
// A PokéAPI devolve as relações da geração atual, que incluem o tipo Fada e já
// removeram as resistências do Metal a Fantasma/Sombrio (mudanças da Gen 6).
// Esta tabela fixa as regras válidas em RSE/FRLG.
//
// Formato: TYPE_CHART_GEN3[tipo do defensor][tipo do atacante] = multiplicador.
// Só os valores diferentes de 1 são listados.
const TYPE_CHART_GEN3 = {
    normal:   { fighting: 2, ghost: 0 },
    fire:     { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5 },
    water:    { electric: 2, grass: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
    grass:    { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, electric: 0.5, grass: 0.5, ground: 0.5 },
    ice:      { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
    fighting: { flying: 2, psychic: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
    poison:   { ground: 2, psychic: 2, grass: 0.5, fighting: 0.5, poison: 0.5, bug: 0.5 },
    ground:   { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
    flying:   { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
    psychic:  { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
    bug:      { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
    rock:     { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
    ghost:    { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
    dragon:   { ice: 2, dragon: 2, fire: 0.5, water: 0.5, electric: 0.5, grass: 0.5 },
    dark:     { fighting: 2, bug: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
    // Na Gen 3 o Metal ainda resistia a Fantasma e Sombrio
    steel:    { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5,
                psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, ghost: 0.5, dark: 0.5, poison: 0 }
};

// Os 17 tipos existentes na Geração 3 (sem Fada)
const GEN3_TYPES = Object.keys(TYPE_CHART_GEN3);

// ==========================================
// CARREGAMENTO SOB DEMANDA DE SCRIPTS PESADOS
// ==========================================
// gyms.js (176 KB) e os dicionários de tradução (44/114 KB) eram baixados em
// toda visita, mesmo por quem nunca abre a aba Treinadores ou nunca troca de
// idioma. Este helper busca cada arquivo só quando ele é realmente necessário
// e reaproveita a mesma Promise em chamadas seguintes.
const ASSET_VERSION = window.ASSET_VERSION || '3.6';
const _scriptPromises = new Map();

const loadScript = (src) => {
    if (_scriptPromises.has(src)) return _scriptPromises.get(src);

    const promise = new Promise((resolve, reject) => {
        const tag = document.createElement('script');
        tag.src = `${src}?v=${ASSET_VERSION}`;
        tag.async = false; // preserva a ordem de execução
        tag.onload = () => resolve();
        tag.onerror = () => {
            // Permite uma nova tentativa numa próxima navegação
            _scriptPromises.delete(src);
            reject(new Error(`Falha ao carregar ${src}`));
        };
        document.head.appendChild(tag);
    });

    _scriptPromises.set(src, promise);
    return promise;
};

// Dicionário do idioma ativo (só um dos dois é usado por vez)
const loadTranslations = (lang) =>
    loadScript(lang === 'pt' ? './js/translations_pt.js' : './js/translations.js');

// Dados de líderes, Elite Four, rivais e equipes vilãs
const loadGymData = () => loadScript('./js/gyms.js');

// Pokémon de Gen 1-3 reclassificados como Fada a partir da Gen 6.
// O endpoint /type da PokéAPI lista sempre a tipagem atual, então sem este mapa
// o filtro de tipo da Pokédex deixaria Clefairy fora de "Normal", Gardevoir
// fora de "Psíquico" e assim por diante.
const GEN3_TYPES_BY_FAIRY_SPECIES = {
    'clefairy':   ['normal'],
    'clefable':   ['normal'],
    'jigglypuff': ['normal'],
    'wigglytuff': ['normal'],
    'mr-mime':    ['psychic'],
    'cleffa':     ['normal'],
    'igglybuff':  ['normal'],
    'togepi':     ['normal'],
    'togetic':    ['normal', 'flying'],
    'marill':     ['water'],
    'azumarill':  ['water'],
    'snubbull':   ['normal'],
    'granbull':   ['normal'],
    'ralts':      ['psychic'],
    'kirlia':     ['psychic'],
    'gardevoir':  ['psychic'],
    'azurill':    ['normal'],
    'mawile':     ['steel']
};

// Nomes que devem aparecer ao filtrar a Pokédex por um tipo da Gen 3.
const getGen3SpeciesOfType = async (type) => {
    const data = await API.getType(type);
    if (!data) return null;

    const nomes = new Set(data.pokemon.map(p => p.pokemon.name));

    // Tira quem só é desse tipo hoje e entrega quem era na Gen 3
    for (const [especie, tiposGen3] of Object.entries(GEN3_TYPES_BY_FAIRY_SPECIES)) {
        nomes.delete(especie);
        if (tiposGen3.includes(type)) nomes.add(especie);
    }
    return nomes;
};
