// Cache System
const pokemonCache = new Map();

// Fetch util
const fetchWithCache = async (url, cacheKey) => {
    if (pokemonCache.has(cacheKey)) return pokemonCache.get(cacheKey);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        pokemonCache.set(cacheKey, data);
        return data;
    } catch (error) {
        return null;
    }
};

// Endpoints
const API = {
    getPokemon: (id) => fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${id}`, `poke_${id}`),
    getSpecies: (id) => fetchWithCache(`https://pokeapi.co/api/v2/pokemon-species/${id}`, `spec_${id}`),
    getType: (name) => fetchWithCache(`https://pokeapi.co/api/v2/type/${name}`, `type_${name}`),
    getEvolution: (url) => fetchWithCache(url, `evo_${url}`),
    getEncounters: (id) => fetchWithCache(`https://pokeapi.co/api/v2/pokemon/${id}/encounters`, `enc_${id}`)
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
