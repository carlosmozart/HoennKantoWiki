// Caminhos de sprite, todos locais (img/).
//
// Antes cada tela montava URLs para raw.githubusercontent.com em tempo de
// execucao. Isso deixava a interface dependente de um dominio de terceiros e
// impedia um modo offline de verdade — o que importa para o app Android.
// Os arquivos sao baixados por tools/fetch_sprites.py.

const BASE = './img';

/** Sprite de batalha da Gen 3, na versao de jogo selecionada. */
export function spritePokemon(id, { versao = 'emerald', shiny = false } = {}) {
    return `${BASE}/pokemon/${versao}/${shiny ? 'shiny/' : ''}${id}.png`;
}

/** Arte frontal padrao (usada em evolucoes, listas e equipe). */
export const spriteCheio = (id) => `${BASE}/pokemon/full/${id}.png`;

/** Icone pequeno do modo compacto da Pokedex. */
export const spriteIcone = (id) => `${BASE}/pokemon/icons/${id}.png`;

/**
 * Sprite de item. Aceita o nome como aparece nos dados ("Exp. Share",
 * "Moon Stone") e converte para o padrao de arquivo.
 */
export function spriteItem(nome) {
    return `${BASE}/items/${slugItem(nome)}.png`;
}

export function slugItem(nome) {
    return String(nome)
        .normalize('NFKD').replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[.']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Nem todo item citado nos textos tem sprite (decoracoes de Base Secreta,
// tickets de evento, agrupamentos como "Water/Fire/Leaf Stone").
const SEM_SPRITE = new Set([
    'itemfinder', 'kings-rock', 'aurora-ticket', 'mystic-ticket',
    'lapras-doll', 'snorlax-doll', 'venusaur-doll', 'charizard-doll',
    'blastoise-doll', 'evolution-stones', 'moon-sun-stone',
    'water-fire-leaf-stone', 'mach-acro-bike', 'deep-sea-tooth-scale',
    'protein-iron-calcium-zinc-carbos-hp-up',
]);

export const temSpriteItem = (nome) => !SEM_SPRITE.has(slugItem(nome));

/**
 * <img> de item pronto para uso. Devolve string vazia quando nao ha sprite,
 * para o chamador simplesmente nao renderizar nada.
 */
export function imgItem(nome, { tamanho = 24, classe = '' } = {}) {
    if (!nome || !temSpriteItem(nome)) return '';
    const alt = String(nome).replace(/"/g, '&quot;');
    return `<img src="${spriteItem(nome)}" alt="${alt}" title="${alt}"`
        + ` class="item-sprite ${classe}" width="${tamanho}" height="${tamanho}"`
        + ` loading="lazy" decoding="async" onerror="this.remove()">`;
}

/** Insignia de ginasio (1 a 8). */
export const spriteInsignia = (n) => `${BASE}/badges/${n}.png`;
