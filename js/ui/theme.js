// Tema claro/escuro.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { playClickSound } from './sound.js';

// A barra do sistema (Android/PWA) segue <meta name="theme-color">, que estava
// fixa em #121212 e continuava escura no tema claro.
const CORES_DA_BARRA = { dark: '#121212', light: '#f4f5f7' };

function aplicarTema(tema) {
    document.documentElement.setAttribute('data-theme', tema);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', CORES_DA_BARRA[tema] || CORES_DA_BARRA.dark);
}

export default {
    initTheme() {
        const t = localStorage.getItem('wiki-theme') || 'dark';
        aplicarTema(t);
        if (this.dom.themeToggle) this.dom.themeToggle.textContent = t === 'dark' ? 'Alternar Tema ☀️' : 'Alternar Tema 🌙';

        if (this.dom.themeToggle) {
            this.dom.themeToggle.addEventListener('click', () => {
                playClickSound();
                const current = document.documentElement.getAttribute('data-theme');
                const novo = current === 'dark' ? 'light' : 'dark';
                aplicarTema(novo);
                localStorage.setItem('wiki-theme', novo);
                this.dom.themeToggle.textContent = novo === 'dark' ? 'Alternar Tema ☀️' : 'Alternar Tema 🌙';
            });
        }
    },

};
