// Roteamento por hash e troca de secao visivel.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { renderCustomPage } from '../views/custom-pages.js';

export default {
    handleRouting() {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('page/')) {
            this.switchView('custom');
            renderCustomPage(hash.slice(5));
        } else if (hash.startsWith('pokemon/')) {
            const id = parseInt(hash.split('/')[1]);
            if (!isNaN(id)) {
                this.loadPokemon(id);
            }
        } else if (hash === 'team') {
            this.switchView('team');
        } else if (hash === 'gyms') {
            this.switchView('gyms');
        } else if (hash === 'tms') {
            this.switchView('tms');
            this.renderTMs();
        } else if (hash === 'frontier') {
            this.switchView('frontier');
            if (window.renderFrontier) window.renderFrontier();
        } else if (hash === 'extras') {
            this.switchView('extras');
            if (window.renderExtras) window.renderExtras();
        } else if (hash === 'items') {
            this.switchView('items');
            if (window.renderKeyItems) window.renderKeyItems(this.state.versionGroup);
        } else if (hash === 'guides' || hash.startsWith('guides/')) {
            if (hash.startsWith('guides/')) this.state.guideTab = hash.slice(7);
            this.switchView('guides');
            this.renderGuides();
        } else if (hash === 'map') {
            this.switchView('map');
            if (window.MapManager) {
                const region = this.state.versionGroup === 'emerald' || this.state.versionGroup === 'ruby-sapphire' ? 'hoenn' : 'kanto';
                window.MapManager.setRegion(region);
            }
        } else if (hash === 'settings') {
            this.switchView('settings');
        } else {
            this.switchView('pokedex');
            this.updateDashboardStats();
            document.title = 'Hoenn & Kanto Wiki - RSE / FRLG';
        }
    },


    switchView(viewId) {
        this.dom.views.forEach(v => v.classList.remove('active'));

        // Destaque na navegação lateral (a página de um Pokémon mantém a Pokédex ativa)
        const navId = viewId === 'pokemon' ? 'pokedex' : viewId;
        this.dom.navBtns.forEach(b => b.classList.toggle('active', b.dataset.view === navId));

        // Tratar mapeamentos especiais
        if (viewId === 'pokedex') {
            document.getElementById('view-dashboard').classList.add('active');
            this.dom.dynamicBg.className = 'bg-default';
            return;
        }
        
        // Tratar todos os outros dinamicamente
        const target = document.getElementById(`view-${viewId}`);
        if (target) {
            target.classList.add('active');
        }
        
        // Renderizadores e backgrounds específicos
        if (viewId === 'team') {
            this.dom.dynamicBg.className = 'bg-default';
            this.renderTeam();
        } else if (viewId === 'gyms') {
            this.dom.dynamicBg.className = 'bg-default';
            this.renderGyms();
        } else {
            // Default background for others
            if (viewId !== 'pokemon') {
                this.dom.dynamicBg.className = 'bg-default';
            }
        }
    },

};
