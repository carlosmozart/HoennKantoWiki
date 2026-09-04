// Inicializacao e visibilidade dependente da versao.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

export default {
    async init() {
        // Migração de dados antigos para o novo sistema
        const oldTeamStr = localStorage.getItem('wiki-team');
        const oldFavsStr = localStorage.getItem('wiki-favs');
        if (oldTeamStr || oldFavsStr) {
            let oldTeam = oldTeamStr ? JSON.parse(oldTeamStr) : [];
            let oldFavs = oldFavsStr ? JSON.parse(oldFavsStr) : [];
            
            if (oldTeam.length > 0 && typeof oldTeam[0] !== 'object') {
                oldTeam = oldTeam.map(id => ({
                    id: parseInt(id), nature: 'hardy',
                    evs: { hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 },
                    ivs: { hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 }
                }));
            }
            
            // Migração não destrutiva: só preenche o que ainda não existe.
            // Antes, uma chave legada residual zerava os favoritos e copiava o
            // mesmo time para as três versões, apagando o progresso atual.
            if (oldFavs.length > 0 && localStorage.getItem('wiki-default-favs') === null) {
                localStorage.setItem('wiki-default-favs', JSON.stringify(oldFavs));
            }
            if (oldTeam.length > 0) {
                ['emerald', 'ruby-sapphire', 'firered-leafgreen'].forEach(vg => {
                    const chave = `wiki-default-${vg}-team`;
                    if (localStorage.getItem(chave) === null) {
                        localStorage.setItem(chave, JSON.stringify(oldTeam));
                    }
                });
            }

            localStorage.removeItem('wiki-team');
            localStorage.removeItem('wiki-favs');
        }

        this.loadProfileState();
        if (this.dom.versionSelect) this.dom.versionSelect.value = this.state.versionGroup;
        await this.initLang();
        
        // Evaluate compact mode dynamically
        if (localStorage.getItem('wiki-compact') !== null) {
            this.state.isCompactMode = localStorage.getItem('wiki-compact') === 'true';
        } else {
            this.state.isCompactMode = window.innerWidth <= 768;
        }
        
        if (this.state.isCompactMode) {
            this.dom.gridContainer.classList.add('compact');
            this.dom.btnLayout.textContent = '💻';
            this.dom.btnLayout.title = "Alternar para Modo Padrão";
        } else {
            this.dom.btnLayout.textContent = '📱';
            this.dom.btnLayout.title = "Alternar para Modo Compacto";
        }
        this.bindEvents();
        this.initTheme();
        this.updateFrontierVisibility();
        this.updateHoennOnlyWidgets();
        this.updateDashboardStats();
        this.renderTypeFilters();
        this.renderGrid();
        this.initDailyChecklist();
        this.initTrainerPanel();
        this.initNavScroller();
        this.handleRouting();
    },

    // Painel do Treinador: recolhido por padrão, com a escolha do usuário salva

    updateHoennOnlyWidgets() {
        const ehHoenn = this.state.versionGroup !== 'firered-leafgreen';
        ['live-events-slot', 'daily-checklist-container'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', !ehHoenn);
        });
    },

    updateFrontierVisibility() {
        const frontierBtn = document.querySelector('[data-view="frontier"]');
        if (frontierBtn) {
            if (this.state.versionGroup === 'emerald') {
                frontierBtn.style.display = 'block';
            } else {
                frontierBtn.style.display = 'none';
                if (window.location.hash.replace('#', '') === 'frontier') {
                    window.location.hash = ''; // Redirect to pokedex if we hide it while active
                }
            }
        }
    },

};
