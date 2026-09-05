// Idioma ativo e carregamento do dicionario correspondente.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { applyInterface } from '../ui/interface.js';
import { getTraducoes } from './dataset.js';
import { playClickSound } from '../ui/sound.js';

export default {
    async initLang() {
        const lang = localStorage.getItem('wiki-lang') || 'pt';
        await this.setLanguage(lang);
        if (this.dom.langToggle) this.dom.langToggle.addEventListener('click', async () => {
            playClickSound();
            const current = this.state.lang;
            this.dom.langToggle.disabled = true;
            let ok = false;
            try {
                ok = await this.setLanguage(current === 'pt' ? 'en' : 'pt');
            } finally {
                this.dom.langToggle.disabled = false;
            }
            if (!ok) {
                alert('Não foi possível baixar o dicionário do outro idioma. Verifique sua conexão.');
                return;
            }
            if (this.state.currentPokemon) {
                // Re-renderiza o pokemon atual para atualizar a linguagem
                this.loadPokemon(this.state.currentPokemon.id);
            }
        });
    },

    async setLanguage(lang) {
        // O dicionário é baixado sob demanda (só um idioma por vez). Se a busca
        // falhar (offline, por exemplo), mantemos o idioma anterior em vez de
        // salvar um estado que deixaria a página sem tradução nenhuma.
        try {
            window.TRANSLATIONS = await getTraducoes(lang);
        } catch (e) {
            console.error('Falha ao carregar as traduções:', e);
            return false;
        }

        this.state.lang = lang;
        // O <html lang> ficava fixo em pt-BR: leitor de tela seguia lendo
        // conteudo em ingles com pronuncia portuguesa.
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
        await applyInterface(lang);
        localStorage.setItem('wiki-lang', lang);
        if (this.dom.langToggle) this.dom.langToggle.textContent = lang === 'pt' ? 'Alternar Idioma USA' : 'Alternar Idioma BRA';
        return true;
    },

};
