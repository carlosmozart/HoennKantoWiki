// Constantes de tipo da Geracao 3.
// A PokeAPI devolve as relacoes da geracao atual (com Fada, e sem as
// resistencias do Metal a Fantasma/Sombrio); estas tabelas fixam as regras
// validas em RSE/FRLG.

export const TYPE_TRANSLATIONS = {
    normal: "Normal", fire: "Fogo", water: "Água", electric: "Elétrico",
    grass: "Grama", ice: "Gelo", fighting: "Lutador", poison: "Venenoso",
    ground: "Terrestre", flying: "Voador", psychic: "Psíquico", bug: "Inseto",
    rock: "Pedra", ghost: "Fantasma", dragon: "Dragão", dark: "Sombrio",
    steel: "Metal", fairy: "Fada"
};

export const STATS_MAP = {
    hp: "HP", attack: "ATK", defense: "DEF", 
    "special-attack": "SPA", "special-defense": "SPD", speed: "SPE"
};


export const GEN3_TYPE_CATEGORIES = {
    normal: "Físico", fighting: "Físico", poison: "Físico", ground: "Físico",
    flying: "Físico", bug: "Físico", rock: "Físico", ghost: "Físico", steel: "Físico",
    fire: "Especial", water: "Especial", grass: "Especial", electric: "Especial",
    psychic: "Especial", ice: "Especial", dragon: "Especial", dark: "Especial",
    fairy: "N/A" // Não existia
};

export const TYPE_CHART_GEN3 = {
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

/** Os 17 tipos existentes na Gen 3 (sem Fada). */
export const GEN3_TYPES = Object.keys(TYPE_CHART_GEN3);
