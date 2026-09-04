// Correções editoriais são separadas dos arquivos gerados pela PokéAPI.
export function mergeEditorial(base, changes) {
    if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return changes ?? base;
    const result = { ...base };
    for (const [key, value] of Object.entries(changes)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
        result[key] = value && typeof value === 'object' && !Array.isArray(value)
            ? mergeEditorial(base?.[key] || {}, value) : value;
    }
    return result;
}

export function correctedPokemon(base, corrections) {
    const correction = corrections.find(item => item.pokemonId === base.id);
    if (!correction) return base;
    return { ...mergeEditorial(base, correction.changes), editorTranslations: correction.translations };
}
