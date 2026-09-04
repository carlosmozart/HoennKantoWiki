// Tema claro/escuro.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { playClickSound } from './sound.js';

export default {
    initTheme() {
        const t = localStorage.getItem('wiki-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', t);
        if (this.dom.themeToggle) this.dom.themeToggle.textContent = t === 'dark' ? 'Alternar Tema ☀️' : 'Alternar Tema 🌙';
        
        if (this.dom.themeToggle) {
            this.dom.themeToggle.addEventListener('click', () => {
                playClickSound();
                const current = document.documentElement.getAttribute('data-theme');
                const novo = current === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', novo);
                localStorage.setItem('wiki-theme', novo);
                this.dom.themeToggle.textContent = novo === 'dark' ? 'Alternar Tema ☀️' : 'Alternar Tema 🌙';
            });
        }
    },

};
