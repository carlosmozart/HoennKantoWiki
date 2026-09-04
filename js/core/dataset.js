// Acesso ao dataset local (data/*.json), gerado por tools/build_data.py.
//
// Antes cada ficha de Pokemon disparava uma requisicao para /pokemon, outra
// para /pokemon-species, /encounters, /evolution-chain e ainda uma por golpe
// (ate ~130) e uma por habilidade. Agora e um unico arquivo de ~6 KB, servido
// junto com o site e cacheavel pelo Service Worker.

import { correctedPokemon } from './editorial.js';

const VERSAO = (typeof window !== 'undefined' && window.ASSET_VERSION) || '1';
const BASE = new URL('../../data/', import.meta.url);

// Uma Promise por recurso: chamadas simultaneas compartilham a mesma busca.
const emMemoria = new Map();

function carregar(caminho) {
    if (emMemoria.has(caminho)) return emMemoria.get(caminho);

    const p = fetch(new URL(`${caminho}?v=${VERSAO}`, BASE))
        .then((r) => {
            if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
            return r.json();
        })
        .catch((e) => {
            // Permite nova tentativa numa proxima navegacao
            emMemoria.delete(caminho);
            throw e;
        });

    emMemoria.set(caminho, p);
    return p;
}

// --- Pokedex -----------------------------------------------------------
/** Indice leve: [{ id, nome, tipos, stats }] — grade, busca e filtros. */
export const getIndice = async () => {
    const [index, editorial] = await Promise.all([carregar('pokedex.json'), getPokemonOverrides()]);
    return index.map(pokemon => {
        const corrected = correctedPokemon(pokemon, editorial.corrections);
        return { ...pokemon, nome: corrected.nome, tipos: corrected.tipos, stats: corrected.stats };
    });
};

/** Ficha completa de um Pokemon, com evolucoes e locais ja embutidos. */
export const getPokemon = async (id) => {
    const [pokemon, editorial] = await Promise.all([carregar(`pokemon/${id}.json`), getPokemonOverrides()]);
    return correctedPokemon(pokemon, editorial.corrections);
};

/** Todos os golpes da Gen 3: { nome: { tipo, poder, precisao, pp, classe } }. */
export const getGolpes = () => carregar('moves.json');

/** Descricoes das habilidades: { nome: { desc } }. */
export const getHabilidades = () => carregar('abilities.json');

// --- Conteudo editorial ------------------------------------------------
export const getGinasios = () => carregar('gyms.json');
export const getTutores = () => carregar('tutors.json');
export const getGuias = () => carregar('guides.json');
export const getMaquinas = () => carregar('machines.json');
export const getItensChave = () => carregar('key-items.json');
export const getExtras = () => carregar('extras.json');
export const getFrontier = () => carregar('frontier.json');
export const getPages = () => carregar('pages.json');
export const getInterface = () => carregar('interface.json');
export const getPokemonOverrides = () => carregar('pokemon-overrides.json');

// --- Traducoes ---------------------------------------------------------
/** So o idioma em uso e baixado. */
export const getTraducoes = (lang) => carregar(`i18n/${lang === 'en' ? 'en' : 'pt'}.json`);

// --- Derivados ---------------------------------------------------------

let indicePorId = null;

/** Busca no indice sem refazer o parse a cada chamada. */
export async function getResumo(id) {
    if (!indicePorId) {
        const lista = await getIndice();
        indicePorId = new Map(lista.map((p) => [p.id, p]));
    }
    return indicePorId.get(Number(id)) || null;
}

/**
 * Nomes que devem aparecer ao filtrar por um tipo da Gen 3.
 * Como o indice ja guarda a tipagem da epoca, nao ha caso especial de Fada.
 */
export async function getEspeciesDoTipo(tipo) {
    const lista = await getIndice();
    return new Set(lista.filter((p) => p.tipos.includes(tipo)).map((p) => p.nome));
}

/** Resolve um termo de busca (nome ou numero) para um id. */
export async function resolverBusca(termo) {
    const alvo = String(termo).trim().toLowerCase();
    if (/^\d+$/.test(alvo)) {
        const n = parseInt(alvo, 10);
        return n >= 1 && n <= 386 ? n : null;
    }
    const lista = await getIndice();
    const exato = lista.find((p) => p.nome === alvo);
    if (exato) return exato.id;
    const parcial = lista.find((p) => p.nome.startsWith(alvo));
    return parcial ? parcial.id : null;
}
