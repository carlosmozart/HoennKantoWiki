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
