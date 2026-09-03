// Helper de som retro
function playClickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
}

const app = {
    state: {
        profiles: JSON.parse(localStorage.getItem('wiki-profiles') || '["default"]'),
        currentProfile: localStorage.getItem('wiki-active-profile') || 'default',
        currentPokemon: null,
        favorites: [],
        team: [],
        captures: [],
        versionGroup: localStorage.getItem('wiki-version-group') || 'emerald', // ruby-sapphire, firered-leafgreen
        isShiny: false,
        lang: 'pt',
        isCompactMode: false,
        gymTab: 'gyms'
    },
    dom: {
        navBtns: document.querySelectorAll('.sidebar .nav-btn'),
        views: document.querySelectorAll('.view-section'),
        gridContainer: document.getElementById('pokedex-grid'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('input-search'),
        versionSelect: document.getElementById('game-version-select'),
        loadingOverlay: document.getElementById('loading-overlay'),
        themeToggle: document.getElementById('theme-toggle'),
        langToggle: document.getElementById('lang-toggle'),
        dynamicBg: document.getElementById('dynamic-bg'),
        
        // Pokemon Profile
        pName: document.querySelector('.pokemon-name'),
        pNum: document.querySelector('.pokemon-number'),
        pCat: document.querySelector('.pokemon-category'),
        pImg: document.querySelector('.pokemon-image'),
        pDesc: document.querySelector('.pokemon-description'),
        pHeight: document.querySelector('.pokemon-height'),
        pWeight: document.querySelector('.pokemon-weight'),
        pAbility: document.querySelector('.pokemon-ability'),
        pEvs: document.querySelector('.pokemon-evs'),
        badge1: document.querySelector('.badge1'),
        badge2: document.querySelector('.badge2'),
        
        btnFav: document.getElementById('btn-fav'),
        btnTeam: document.getElementById('btn-team'),
        btnShiny: document.getElementById('btn-shiny'),
        btnCry: document.getElementById('btn-cry'),
        btnCapture: document.getElementById('btn-capture-profile'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnLayout: document.getElementById('btn-layout')
    },

    getScopedKey(baseKey) {
        return `wiki-${this.state.currentProfile}-${this.state.versionGroup}-${baseKey}`;
    },
    
    saveScopedData(baseKey, data) {
        localStorage.setItem(this.getScopedKey(baseKey), JSON.stringify(data));
    },
    
    loadScopedData(baseKey, defaultVal) {
        const val = localStorage.getItem(this.getScopedKey(baseKey));
        return val ? JSON.parse(val) : defaultVal;
    },
    
    loadGlobalProfileData(baseKey, defaultVal) {
        const val = localStorage.getItem(`wiki-${this.state.currentProfile}-${baseKey}`);
        return val ? JSON.parse(val) : defaultVal;
    },
    
    saveGlobalProfileData(baseKey, data) {
        localStorage.setItem(`wiki-${this.state.currentProfile}-${baseKey}`, JSON.stringify(data));
    },
    
    loadProfileState() {
        this.state.favorites = this.loadGlobalProfileData('favs', []);
        this.state.team = this.loadScopedData('team', []);
        this.state.captures = this.loadScopedData('captures', []);
    },

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
            
            localStorage.setItem('wiki-default-favs', JSON.stringify(oldFavs));
            ['emerald', 'ruby-sapphire', 'firered-leafgreen'].forEach(vg => {
                localStorage.setItem(`wiki-default-${vg}-team`, JSON.stringify(oldTeam));
            });
            
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
    initTrainerPanel() {
        const panel = document.getElementById('trainer-panel');
        if (!panel) return;
        panel.open = localStorage.getItem('wiki-trainer-panel') === 'open';
        panel.addEventListener('toggle', () => {
            localStorage.setItem('wiki-trainer-panel', panel.open ? 'open' : 'closed');
        });
    },

    // Degradê à direita do menu some quando não há mais para rolar
    initNavScroller() {
        const scroller = document.querySelector('.nav-scroller');
        const nav = document.querySelector('.nav-links');
        if (!scroller || !nav) return;

        const update = () => {
            const fim = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
            scroller.classList.toggle('at-end', fim);
        };
        nav.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    },

    initDailyChecklist() {
        const checkboxes = document.querySelectorAll('.daily-task-chk');
        if (checkboxes.length === 0) return;

        // Recupera dados salvos
        let savedData = localStorage.getItem('wiki-daily-checklist');
        let dailyState = savedData ? JSON.parse(savedData) : { date: '', tasks: {} };

        // Verifica a data de hoje (Formato YYYY-MM-DD local)
        const todayStr = new Date().toLocaleDateString();

        if (dailyState.date !== todayStr) {
            // Se virou o dia, reseta
            dailyState = { date: todayStr, tasks: {} };
            localStorage.setItem('wiki-daily-checklist', JSON.stringify(dailyState));
        }

        // Aplica o estado visual
        checkboxes.forEach(chk => {
            const task = chk.dataset.task;
            chk.checked = !!dailyState.tasks[task];
            
            chk.addEventListener('change', (e) => {
                dailyState.tasks[task] = e.target.checked;
                localStorage.setItem('wiki-daily-checklist', JSON.stringify(dailyState));
            });
        });
    },

    // Shoal Cave, loteria de Lilycove e Mirage Island são de Hoenn:
    // o relógio e o checklist não valem para FireRed/LeafGreen.
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

    updateDashboardStats() {
        // Team size
        const statTeam = document.getElementById('stat-team-size');
        if (statTeam) statTeam.textContent = `${this.state.team.length}/6`;
        
        // Fav count
        const statFav = document.getElementById('stat-fav-count');
        if (statFav) statFav.textContent = this.state.favorites.length;

        // Capturados
        const statCatch = document.getElementById('stat-catch-count');
        const statCatchBar = document.getElementById('stat-catch-bar');
        const caught = this.state.captures.length;
        if (statCatch) statCatch.textContent = `${caught}/386`;
        if (statCatchBar) statCatchBar.style.width = `${(caught / 386) * 100}%`;
        
        // TM count
        let tmCount = 0;
        const tmPrefix = this.getScopedKey('tm-');
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(tmPrefix) && localStorage.getItem(k) === 'true') {
                tmCount++;
            }
        }
        const statTm = document.getElementById('stat-tm-count');
        if (statTm) statTm.textContent = tmCount;

        // Resumo visível mesmo com o painel recolhido
        const digest = document.getElementById('trainer-panel-digest');
        if (digest) {
            digest.textContent =
                `${this.state.captures.length}/386 capturados · ${this.state.team.length}/6 na equipe · ${this.state.favorites.length} favoritos`;
        }
    },

    handleRouting() {
        const hash = window.location.hash.replace('#', '');
        if (hash.startsWith('pokemon/')) {
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
        } else if (hash === 'guides') {
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

    bindEvents() {
        // Navegação Lateral
        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                playClickSound();
                window.location.hash = btn.dataset.view === 'pokedex' ? '' : btn.dataset.view;
            });
        });

        window.addEventListener('hashchange', () => this.handleRouting());

        // Botão Voltar ao Topo
        const btnScrollTop = document.getElementById('btn-back-to-top');
        if (btnScrollTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    btnScrollTop.classList.add('show');
                } else {
                    btnScrollTop.classList.remove('show');
                }
            });
            btnScrollTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Sincronização em Nuvem (Cloud Save)
        const btnExportSave = document.getElementById('btn-export-save');
        const btnCopySave = document.getElementById('btn-copy-save');
        const btnImportSave = document.getElementById('btn-import-save');
        const exportOutput = document.getElementById('save-export-output');
        const importInput = document.getElementById('save-import-input');

        if (btnExportSave) {
            btnExportSave.addEventListener('click', () => {
                try {
                    const saveData = {};
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('wiki-')) {
                            saveData[key] = localStorage.getItem(key);
                        }
                    }
                    const jsonStr = JSON.stringify(saveData);
                    const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));
                    exportOutput.value = base64Str;
                    btnCopySave.classList.remove('hidden');
                } catch (e) {
                    alert('Erro ao gerar código: ' + e.message);
                }
            });
        }

        if (btnCopySave) {
            btnCopySave.addEventListener('click', () => {
                exportOutput.select();
                document.execCommand('copy');
                btnCopySave.textContent = '✅ Copiado!';
                setTimeout(() => btnCopySave.textContent = '📋 Copiar Código', 2000);
            });
        }

        if (btnImportSave) {
            btnImportSave.addEventListener('click', () => {
                const code = importInput.value.trim();
                if (!code) return alert('Cole um código primeiro!');
                try {
                    const jsonStr = decodeURIComponent(escape(atob(code)));
                    const saveData = JSON.parse(jsonStr);
                    
                    let imported = 0;
                    for (const key in saveData) {
                        if (key.startsWith('wiki-')) {
                            localStorage.setItem(key, saveData[key]);
                            imported++;
                        }
                    }
                    if (imported > 0) {
                        alert(`Save restaurado com sucesso! ${imported} registros recuperados. A página será recarregada.`);
                        window.location.reload();
                    } else {
                        alert('Código inválido ou vazio.');
                    }
                } catch (e) {
                    alert('Erro ao importar: Código inválido ou corrompido.');
                }
            });
        }

        // Exportar Imagem da Equipe
        const btnExportTeam = document.getElementById('btn-export-team');
        if (btnExportTeam) {
            btnExportTeam.addEventListener('click', async () => {
                const teamGrid = document.getElementById('team-grid');
                if (teamGrid && typeof html2canvas !== 'undefined') {
                    try {
                        const originalStyle = teamGrid.style.cssText;
                        teamGrid.style.background = 'var(--glass-bg)';
                        teamGrid.style.padding = '20px';
                        teamGrid.style.borderRadius = '15px';
                        
                        const canvas = await html2canvas(teamGrid, {
                            backgroundColor: '#1a1a2e',
                            scale: 2
                        });
                        
                        teamGrid.style.cssText = originalStyle;
                        
                        const link = document.createElement('a');
                        link.download = 'minha-equipe-hoenn.png';
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                    } catch (err) {
                        console.error('Erro ao exportar equipe:', err);
                        alert('Houve um erro ao gerar a imagem da equipe.');
                    }
                } else {
                    alert('html2canvas não foi carregado.');
                }
            });
        }

        if (this.dom.btnPrev) {
            this.dom.btnPrev.addEventListener('click', () => {
                if (this.state.currentPokemon && this.state.currentPokemon.id > 1) {
                    playClickSound();
                    window.location.hash = `pokemon/${this.state.currentPokemon.id - 1}`;
                }
            });
        }

        if (this.dom.btnNext) {
            this.dom.btnNext.addEventListener('click', () => {
                if (this.state.currentPokemon && this.state.currentPokemon.id < 386) {
                    playClickSound();
                    window.location.hash = `pokemon/${this.state.currentPokemon.id + 1}`;
                }
            });
        }

        // Abas de Ataques (Moveset)
        document.querySelectorAll('.move-tab-btn[data-target]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = document.getElementById(btn.dataset.target);
                if (!target) return;
                document.querySelectorAll('.move-tab-btn[data-target]').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.move-section').forEach(s => s.classList.remove('active'));
                btn.classList.add('active');
                target.classList.add('active');
            });
        });

        // Abas de Ginásios / Elite 4
        document.querySelectorAll('.btn-gym-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-gym-tab').forEach(b => {
                    b.style.background = 'var(--glass-bg)';
                    b.style.color = 'var(--text-color)';
                });
                btn.style.background = 'var(--primary-surface)';
                btn.style.color = 'var(--primary-on)';
                this.state.gymTab = btn.dataset.tab;
                this.renderGyms();
            });
        });

        // Abas de TMs / Tutores
        document.querySelectorAll('.btn-tm-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-tm-tab').forEach(b => {
                    b.style.background = 'var(--glass-bg)';
                    b.style.color = 'var(--text-color)';
                });
                btn.style.background = 'var(--primary-surface)';
                btn.style.color = 'var(--primary-on)';
                this.state.tmTab = btn.dataset.tab;
                this.renderTMs(); // renderTMs will handle switching views
            });
        });

        // Abas de Guias
        document.querySelectorAll('.btn-guide-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-guide-tab').forEach(b => {
                    b.style.background = 'var(--glass-bg)';
                    b.style.color = 'var(--text-color)';
                });
                btn.style.background = 'var(--primary-surface)';
                btn.style.color = 'var(--primary-on)';
                this.state.guideTab = btn.dataset.tab;
                this.renderGuides();
            });
        });

        // Formulário de Busca (Impede recarregar)
        this.dom.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
        });

        // Busca Parcial Dinâmica no Grid (com Debounce para otimização)
        let searchTimeout;
        this.dom.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.state.searchTerm = e.target.value.trim().toLowerCase();

                // Força a voltar pra view de dashboard quando começa a digitar
                if (this.state.searchTerm.length > 0 && !document.getElementById('view-dashboard').classList.contains('active')) {
                    window.location.hash = '';
                }

                this.applyFilters();
            }, 150); // 150ms delay
        });

        // Status Filters (Todos, Capturados, Não Capturados)
        document.querySelectorAll('.btn-filter-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-filter-status').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'var(--glass-bg)';
                    b.style.color = 'var(--text-color)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--primary-surface)';
                btn.style.color = 'var(--primary-on)';
                this.state.statusFilter = btn.dataset.status;
                this.renderGrid();
            });
        });

        // Seletor de Versão
        this.dom.versionSelect.addEventListener('change', (e) => {
            this.state.versionGroup = e.target.value;
            localStorage.setItem('wiki-version-group', this.state.versionGroup);
            this.loadProfileState(); // Recarrega estado para a nova versão

            this.updateFrontierVisibility();
            this.updateHoennOnlyWidgets();
            
            // Re-render components if they are active
            if (document.getElementById('view-dashboard').classList.contains('active')) {
                this.renderGrid();
                this.updateDashboardStats();
            }
            if (document.getElementById('view-team').classList.contains('active')) {
                this.renderTeam();
            }
            if (document.getElementById('view-tms').classList.contains('active')) {
                this.renderTMs();
            }
            if (this.state.currentPokemon) {
                // Re-render moves and encounters based on new version
                renderMoves(this.state.currentPokemon.moves, this.state.versionGroup);
                renderEncounters(this.state.currentPokemon.id, this.state.versionGroup);
                if (this.state.currentSpecies && this.state.currentSpecies.evolution_chain) {
                    renderEvolutions(this.state.currentSpecies.evolution_chain.url);
                }
            }
            if (document.getElementById('view-gyms').classList.contains('active')) {
                this.renderGyms();
            }
            if (document.getElementById('view-extras') && document.getElementById('view-extras').classList.contains('active')) {
                if (window.renderExtras) window.renderExtras();
            }
            if (document.getElementById('view-guides').classList.contains('active')) {
                this.renderGuides();
            }
            if (document.getElementById('view-items').classList.contains('active')) {
                if (window.renderKeyItems) window.renderKeyItems(this.state.versionGroup);
            }
            if (window.MapManager && document.getElementById('view-map').classList.contains('active')) {
                const region = this.state.versionGroup === 'emerald' || this.state.versionGroup === 'ruby-sapphire' ? 'hoenn' : 'kanto';
                window.MapManager.setRegion(region);
            }
        });

        // Controles de Imagem
        this.dom.btnShiny.addEventListener('click', () => {
            this.state.isShiny = !this.state.isShiny;
            if (this.state.currentPokemon) {
                this.dom.pImg.src = this.getSprite(this.state.currentPokemon, this.state.isShiny);
                this.dom.btnShiny.style.transform = this.state.isShiny ? 'scale(1.2)' : 'scale(1)';
                this.dom.btnShiny.style.background = this.state.isShiny ? 'var(--type-electric)' : 'var(--btn-bg)';
            }
        });

        this.dom.btnFav.addEventListener('click', () => {
            if (!this.state.currentPokemon) return;
            const id = this.state.currentPokemon.id;
            const idx = this.state.favorites.indexOf(id);
            if (idx > -1) {
                this.state.favorites.splice(idx, 1);
            } else {
                this.state.favorites.push(id);
            }
            this.saveGlobalProfileData('favs', this.state.favorites);
            this.updateFavBtn(id);
            this.updateDashboardStats();
        });

        // Alternar Layout Compacto
        this.dom.btnLayout.addEventListener('click', () => {
            playClickSound();
            this.state.isCompactMode = !this.state.isCompactMode;
            localStorage.setItem('wiki-compact', this.state.isCompactMode);
            
            if (this.state.isCompactMode) {
                this.dom.gridContainer.classList.add('compact');
                this.dom.btnLayout.textContent = '💻';
                this.dom.btnLayout.title = "Alternar para Modo Padrão";
            } else {
                this.dom.gridContainer.classList.remove('compact');
                this.dom.btnLayout.textContent = '📱';
                this.dom.btnLayout.title = "Alternar para Modo Compacto";
            }
            
            // Atualiza as imagens já carregadas
            const loadedCards = document.querySelectorAll('.grid-card[data-loaded="true"]');
            loadedCards.forEach(card => {
                const id = card.dataset.id;
                const img = card.querySelector('img');
                if (this.state.isCompactMode) {
                    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;
                } else {
                    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
                }
            });
        });

        this.dom.btnTeam.addEventListener('click', () => {
            if (!this.state.currentPokemon) return;
            playClickSound();
            const id = this.state.currentPokemon.id;
            const idx = this.state.team.findIndex(t => t.id === id);
            if (idx > -1) {
                this.state.team.splice(idx, 1);
            } else {
                if (this.state.team.length >= 6) {
                    alert('Sua equipe já está cheia (máximo de 6 Pokémon)!');
                    return;
                }
                this.state.team.push({
                    id: id,
                    nature: 'hardy',
                    evs: { hp: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 },
                    ivs: { hp: 31, attack: 31, defense: 31, special_attack: 31, special_defense: 31, speed: 31 }
                });
            }
            this.saveScopedData('team', this.state.team);
            this.updateTeamBtn(id);
            this.updateDashboardStats();
        });

        this.dom.btnCry.addEventListener('click', () => {
            if (this.state.currentPokemon) this.playCry(this.state.currentPokemon.id);
        });

        if (this.dom.btnCapture) {
            this.dom.btnCapture.addEventListener('click', () => {
                if (!this.state.currentPokemon) return;
                playClickSound();
                const id = this.state.currentPokemon.id;
                const idx = this.state.captures.indexOf(id);
                if (idx > -1) {
                    this.state.captures.splice(idx, 1);
                } else {
                    this.state.captures.push(id);
                }
                this.saveScopedData('captures', this.state.captures);
                this.updateCaptureBtn(id);
                this.updateDashboardStats();

                // Mantém o ícone do card correspondente em sincronia
                const cardIcon = document.querySelector(`.grid-card[data-id="${id}"] .catch-icon`);
                if (cardIcon) cardIcon.classList.toggle('captured', this.state.captures.includes(id));
            });
        }

        // PWA Install Logic
        let deferredPrompt;
        const installBtn = document.getElementById('btn-install-app');
        if (installBtn) {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installBtn.classList.remove('hidden');
            });
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        installBtn.classList.add('hidden');
                    }
                    deferredPrompt = null;
                }
            });
            window.addEventListener('appinstalled', () => {
                installBtn.classList.add('hidden');
                deferredPrompt = null;
            });
        }

        // Profile Management
        this.renderProfileSelect();
        const profileSelect = document.getElementById('profile-select');
        const btnNewProfile = document.getElementById('btn-new-profile');
        const btnDeleteProfile = document.getElementById('btn-delete-profile');
        
        if (profileSelect) {
            profileSelect.addEventListener('change', (e) => {
                this.state.currentProfile = e.target.value;
                localStorage.setItem('wiki-active-profile', this.state.currentProfile);
                this.loadProfileState();
                
                // Re-render
                if (document.getElementById('view-dashboard').classList.contains('active')) {
                    this.renderGrid();
                    this.updateDashboardStats();
                }
                if (document.getElementById('view-team').classList.contains('active')) {
                    this.renderTeam();
                }
                if (document.getElementById('view-tms').classList.contains('active')) {
                    this.renderTMs();
                }
            });
        }
        
        if (btnNewProfile) {
            btnNewProfile.addEventListener('click', () => {
                const newName = prompt('Digite o nome do novo perfil:');
                if (newName && newName.trim() !== '') {
                    const id = newName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
                    if (this.state.profiles.includes(id)) {
                        alert('Já existe um perfil com esse nome.');
                        return;
                    }
                    this.state.profiles.push(id);
                    localStorage.setItem('wiki-profiles', JSON.stringify(this.state.profiles));
                    
                    this.state.currentProfile = id;
                    localStorage.setItem('wiki-active-profile', this.state.currentProfile);
                    
                    this.renderProfileSelect();
                    profileSelect.value = id;
                    profileSelect.dispatchEvent(new Event('change'));
                }
            });
        }
        
        if (btnDeleteProfile) {
            btnDeleteProfile.addEventListener('click', () => {
                if (this.state.profiles.length <= 1) {
                    alert('Você não pode excluir o único perfil existente.');
                    return;
                }
                if (confirm(`Tem certeza que deseja excluir o perfil "${this.state.currentProfile}"? Todo o progresso deste perfil será perdido.`)) {
                    this.state.profiles = this.state.profiles.filter(p => p !== this.state.currentProfile);
                    localStorage.setItem('wiki-profiles', JSON.stringify(this.state.profiles));
                    
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                        const k = localStorage.key(i);
                        if (k && k.startsWith(`wiki-${this.state.currentProfile}-`)) {
                            localStorage.removeItem(k);
                        }
                    }
                    
                    this.state.currentProfile = this.state.profiles[0];
                    localStorage.setItem('wiki-active-profile', this.state.currentProfile);
                    
                    this.renderProfileSelect();
                    profileSelect.value = this.state.currentProfile;
                    profileSelect.dispatchEvent(new Event('change'));
                }
            });
        }
    },

    renderProfileSelect() {
        const select = document.getElementById('profile-select');
        if (!select) return;
        select.innerHTML = '';
        this.state.profiles.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p === 'default' ? 'Perfil Principal' : p.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (p === this.state.currentProfile) opt.selected = true;
            select.appendChild(opt);
        });
    },

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
            await loadTranslations(lang);
        } catch (e) {
            console.error('Falha ao carregar as traduções:', e);
            return false;
        }

        this.state.lang = lang;
        localStorage.setItem('wiki-lang', lang);
        window.TRANSLATIONS = lang === 'pt' ? window.TRANSLATIONS_PT : window.TRANSLATIONS_EN;
        if (this.dom.langToggle) this.dom.langToggle.textContent = lang === 'pt' ? 'Alternar Idioma USA' : 'Alternar Idioma BRA';
        return true;
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

    renderTMs() {
        const gridTM = document.getElementById('tms-grid');
        const gridTutor = document.getElementById('tutors-container');
        if (!gridTM || !gridTutor) return;

        const tab = this.state.tmTab || 'tms';
        
        if (tab === 'tms') {
            gridTM.classList.remove('hidden');
            gridTutor.classList.add('hidden');
            
            let html = '';
            if (typeof GEN3_MACHINES !== 'undefined') {
                GEN3_MACHINES.forEach(machine => {
                    let desc = "Sem descrição.";
                    if (window.TRANSLATIONS && window.TRANSLATIONS.moves && window.TRANSLATIONS.moves[machine.move]) {
                        desc = window.TRANSLATIONS.moves[machine.move];
                    }
                    
                    let location = "Local desconhecido / Aleatório";
                    if (window.TRANSLATIONS && window.TRANSLATIONS.tm_locations && window.TRANSLATIONS.tm_locations[machine.move]) {
                        const locObj = window.TRANSLATIONS.tm_locations[machine.move];
                        location = locObj[this.state.versionGroup] || locObj["emerald"] || location;
                    }

                    const nameCap = machine.move.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    
                    const isChecked = this.loadScopedData(`tm-${machine.id}`, false) ? 'checked' : '';
                    const opacity = isChecked ? '0.5' : '1';
                    
                    html += `
                        <div class="grid-card machine-card tm-card-${machine.id}" style="opacity: ${opacity}; display:flex; flex-direction:column; gap:8px; padding:15px; border-radius:12px; background:var(--glass-bg); border:1px solid var(--glass-border); box-sizing:border-box; transition: opacity 0.3s;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="display:flex; align-items:center; gap:12px;">
                                    <strong>${machine.id}</strong>
                                    <span class="badge-${machine.type}" style="padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase;">${machine.type}</span>
                                </div>
                                <input type="checkbox" class="tm-checkbox" data-tmid="${machine.id}" ${isChecked} style="width: 20px; height: 20px; cursor: pointer;">
                            </div>
                            <h4 style="margin: 0; font-size: 1.1rem; word-wrap: break-word;">${nameCap}</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin:0; text-align: justify; flex: 1;">${desc}</p>
                            
                            <div style="margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); font-size:0.8rem;">
                                <strong style="color:var(--text-color);">📍 Encontrar:</strong> <span style="color:var(--text-muted);">${location}</span>
                            </div>
                        </div>
                    `;
                });
            }
            gridTM.innerHTML = html;
            
            // Add Checkbox logic
            gridTM.querySelectorAll('.tm-checkbox').forEach(chk => {
                chk.addEventListener('change', (e) => {
                    const tmId = e.target.dataset.tmid;
                    this.saveScopedData(`tm-${tmId}`, e.target.checked);
                    const card = document.querySelector(`.tm-card-${tmId}`);
                    if(card) {
                        card.style.opacity = e.target.checked ? '0.5' : '1';
                    }
                });
            });
        } else {
            // Render Tutors
            gridTM.classList.add('hidden');
            gridTutor.classList.remove('hidden');
            
            let html = '';
            const vg = this.state.versionGroup || 'emerald';
            if (window.MOVE_TUTORS && window.MOVE_TUTORS[vg]) {
                window.MOVE_TUTORS[vg].forEach(cat => {
                    html += `
                        <div class="frontier-team-section" style="margin-top:20px; text-align:left;">
                            <div class="frontier-team-req" style="margin-bottom:10px;">${cat.category}</div>
                            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${cat.desc}</p>
                            <div class="frontier-grid">
                    `;
                    cat.tutors.forEach(t => {
                        let desc = "Sem descrição.";
                        const tMoveLower = t.move.toLowerCase().replace(' ', '-');
                        if (window.TRANSLATIONS && window.TRANSLATIONS.moves && window.TRANSLATIONS.moves[tMoveLower]) {
                            desc = window.TRANSLATIONS.moves[tMoveLower];
                        }
                        
                        let locHtml = t.location ? `<div style="margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.1); font-size:0.8rem;"><strong style="color:var(--text-color);">📍 Encontrar:</strong> <span style="color:var(--text-muted);">${t.location}</span></div>` : '';
                        
                        html += `
                            <div class="grid-card machine-card" style="display:flex; flex-direction:column; gap:8px; padding:15px; border-radius:12px; background:var(--glass-bg); border:1px solid var(--glass-border); box-sizing:border-box;">
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <span class="badge-${t.type}" style="padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase;">${t.type}</span>
                                    <strong style="color:var(--text-color); font-size:0.9rem;">${t.cost}</strong>
                                </div>
                                <h4 style="margin: 0; font-size: 1.1rem; word-wrap: break-word;">${t.move}</h4>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin:0; text-align: justify; flex: 1;">${desc}</p>
                                ${locHtml}
                            </div>
                        `;
                    });
                    html += `</div></div>`;
                });
            } else {
                html = '<p>Dados de tutores não encontrados.</p>';
            }
            gridTutor.innerHTML = html;
        }
    },

    renderGuides() {
        const container = document.getElementById('guides-container');
        if (!container) return;

        const tab = this.state.guideTab || 'stones';
        if (window.GUIDES_DATA && window.GUIDES_DATA[tab]) {
            const data = window.GUIDES_DATA[tab];
            container.innerHTML = `
                <h3 style="color:var(--text-color); margin-bottom:15px;">${data.title}</h3>
                <div style="font-size: 0.95rem; line-height: 1.6;">
                    ${data.content}
                </div>
            `;
            
            // Inicializações Específicas dos Guias
            if (tab === 'natures') {
                this.initNaturesGuide();
            } else if (tab === 'weakness') {
                this.initWeaknessGuide();
            }
        } else {
            container.innerHTML = '<p>Guia não encontrado.</p>';
        }
    },

    initNaturesGuide() {
        const tbody = document.getElementById('natures-table-body');
        if (!tbody) return;
        
        const naturesData = [
            { name: "Hardy", up: "---", down: "---", fav: "---", hate: "---" },
            { name: "Lonely", up: "Attack", down: "Defense", fav: "Spicy", hate: "Sour" },
            { name: "Brave", up: "Attack", down: "Speed", fav: "Spicy", hate: "Sweet" },
            { name: "Adamant", up: "Attack", down: "Sp. Atk", fav: "Spicy", hate: "Dry" },
            { name: "Naughty", up: "Attack", down: "Sp. Def", fav: "Spicy", hate: "Bitter" },
            { name: "Bold", up: "Defense", down: "Attack", fav: "Sour", hate: "Spicy" },
            { name: "Docile", up: "---", down: "---", fav: "---", hate: "---" },
            { name: "Relaxed", up: "Defense", down: "Speed", fav: "Sour", hate: "Sweet" },
            { name: "Impish", up: "Defense", down: "Sp. Atk", fav: "Sour", hate: "Dry" },
            { name: "Lax", up: "Defense", down: "Sp. Def", fav: "Sour", hate: "Bitter" },
            { name: "Timid", up: "Speed", down: "Attack", fav: "Sweet", hate: "Spicy" },
            { name: "Hasty", up: "Speed", down: "Defense", fav: "Sweet", hate: "Sour" },
            { name: "Serious", up: "---", down: "---", fav: "---", hate: "---" },
            { name: "Jolly", up: "Speed", down: "Sp. Atk", fav: "Sweet", hate: "Dry" },
            { name: "Naive", up: "Speed", down: "Sp. Def", fav: "Sweet", hate: "Bitter" },
            { name: "Modest", up: "Sp. Atk", down: "Attack", fav: "Dry", hate: "Spicy" },
            { name: "Mild", up: "Sp. Atk", down: "Defense", fav: "Dry", hate: "Sour" },
            { name: "Quiet", up: "Sp. Atk", down: "Speed", fav: "Dry", hate: "Sweet" },
            { name: "Bashful", up: "---", down: "---", fav: "---", hate: "---" },
            { name: "Rash", up: "Sp. Atk", down: "Sp. Def", fav: "Dry", hate: "Bitter" },
            { name: "Calm", up: "Sp. Def", down: "Attack", fav: "Bitter", hate: "Spicy" },
            { name: "Gentle", up: "Sp. Def", down: "Defense", fav: "Bitter", hate: "Sour" },
            { name: "Sassy", up: "Sp. Def", down: "Speed", fav: "Bitter", hate: "Sweet" },
            { name: "Careful", up: "Sp. Def", down: "Sp. Atk", fav: "Bitter", hate: "Dry" },
            { name: "Quirky", up: "---", down: "---", fav: "---", hate: "---" }
        ];

        let html = '';
        naturesData.forEach(n => {
            const isNeutral = n.up === '---';
            html += `<tr>
                <td style="font-weight:bold; color: ${isNeutral ? 'var(--text-muted)' : 'var(--text-color)'};">${n.name}</td>
                <td style="color:var(--type-grass);">${n.up}</td>
                <td style="color:#ff4757;">${n.down}</td>
                <td style="color:var(--type-electric);">${n.fav}</td>
                <td style="color:var(--type-poison);">${n.hate}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    },

    initWeaknessGuide() {
        const type1 = document.getElementById('calc-type-1');
        const type2 = document.getElementById('calc-type-2');
        const result = document.getElementById('calc-result');
        if (!type1 || !type2 || !result) return;

        // Populate Types (Gen 3)
        const types = [
            "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground",
            "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel"
        ];
        
        const typeOpts = types.map(t => `<option value="${t}">${TYPE_TRANSLATIONS[t] || t}</option>`).join('');
        type1.innerHTML = typeOpts;
        type2.innerHTML += typeOpts;

        const updateCalc = () => {
            const t1 = type1.value;
            const t2 = type2.value === 'none' ? null : type2.value;
            
            const mults = {};
            types.forEach(t => mults[t] = 1);

            if (TYPE_CHART_GEN3[t1]) {
                for (let attacker in TYPE_CHART_GEN3[t1]) {
                    mults[attacker] *= TYPE_CHART_GEN3[t1][attacker];
                }
            }
            if (t2 && TYPE_CHART_GEN3[t2] && t1 !== t2) {
                for (let attacker in TYPE_CHART_GEN3[t2]) {
                    mults[attacker] *= TYPE_CHART_GEN3[t2][attacker];
                }
            }

            let html = '';
            for (let t in mults) {
                const m = mults[t];
                if (m !== 1) {
                    let color = m > 1 ? '#ff4757' : 'var(--type-grass)';
                    if (m === 0) color = 'var(--text-muted)';
                    html += `
                        <div style="background:var(--stat-bar-bg); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                            <span class="pokemon-type-badge badge-${t}">${TYPE_TRANSLATIONS[t] || t}</span>
                            <span style="font-weight:bold; color:${color}; font-size:1.1rem;">x${m}</span>
                        </div>
                    `;
                }
            }
            
            if (html === '') html = '<div style="grid-column: 1 / -1; text-align:center; color:var(--text-muted);">Sem fraquezas ou resistências notáveis.</div>';
            result.innerHTML = html;
        };

        type1.addEventListener('change', updateCalc);
        type2.addEventListener('change', updateCalc);
        updateCalc();
    },

    updateFavBtn(id) {
        if (this.state.favorites.includes(id)) {
            this.dom.btnFav.classList.add('active');
            this.dom.btnFav.textContent = '❤️';
        } else {
            this.dom.btnFav.classList.remove('active');
            this.dom.btnFav.textContent = '🤍';
        }
    },

    updateCaptureBtn(id) {
        if (!this.dom.btnCapture) return;
        const capturado = this.state.captures.includes(id);
        this.dom.btnCapture.classList.toggle('captured', capturado);
        this.dom.btnCapture.title = capturado ? 'Desmarcar captura' : 'Marcar como capturado';
        this.dom.btnCapture.setAttribute('aria-pressed', String(capturado));
    },

    updateTeamBtn(id) {
        if (this.state.team.some(p => p.id === id)) {
            this.dom.btnTeam.classList.add('active');
            this.dom.btnTeam.textContent = '❌';
            this.dom.btnTeam.title = 'Remover da Equipe';
        } else {
            this.dom.btnTeam.classList.remove('active');
            this.dom.btnTeam.textContent = '➕';
            this.dom.btnTeam.title = 'Adicionar à Equipe';
        }
    },

    isTouchDevice() {
        // (pointer: coarse) descreve o ponteiro principal: dá "true" em celular
        // e tablet, e "false" num notebook com tela sensível ao toque + trackpad.
        // A largura só entra como fallback em navegadores sem essa media query.
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').media === '(pointer: coarse)') {
            return window.matchMedia('(pointer: coarse)').matches;
        }
        return window.innerWidth <= 900;
    },

    playCry(id) {
        let legacyUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${id}.ogg`;
        let latestUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
        
        if (this.state.currentPokemon && this.state.currentPokemon.id === id && this.state.currentPokemon.cries) {
            legacyUrl = this.state.currentPokemon.cries.legacy || legacyUrl;
            latestUrl = this.state.currentPokemon.cries.latest || latestUrl;
        }
        
        const audio = new Audio(legacyUrl);
        audio.play().catch(e => {
            console.warn(`Cry legacy indisponível ou corrompido para: ${id}. Tentando o mais recente...`);
            const audioLatest = new Audio(latestUrl);
            audioLatest.play().catch(err => console.warn(`Nenhum cry disponível para: ${id}`));
        });
    },

    getSprite(data, shiny) {
        // Gen 3 official artworks or Emerald animated
        let sprite = null;
        try {
            sprite = shiny ? 
                data.sprites.versions["generation-iii"].emerald.front_shiny : 
                data.sprites.versions["generation-iii"].emerald.front_default;
        } catch(e){}
        
        if(!sprite) {
            sprite = shiny ? data.sprites.front_shiny : data.sprites.front_default;
        }
        return sprite;
    },

    async loadPokemon(query) {
        this.dom.loadingOverlay.classList.remove('hidden');

        // Cada chamada recebe um número; se outra começar enquanto esta espera
        // a rede, a resposta antiga é descartada em vez de sobrescrever a tela.
        const requisicao = (this._loadSeq = (this._loadSeq || 0) + 1);
        const obsoleta = () => requisicao !== this._loadSeq;

        const data = await API.getPokemon(query);
        if (obsoleta()) return;
        if (!data) {
            alert('Pokémon não encontrado!');
            this.dom.loadingOverlay.classList.add('hidden');
            return;
        }

        const species = await API.getSpecies(data.id);
        if (obsoleta()) return;
        this.state.currentPokemon = data;
        
        // Reversão de Tipos para a Regra Clássica (Gen 3)
        // Se past_types existir e a geração de limite for maior ou igual a Gen 3 (ex: generation-v significa que mudou na Gen 6)
        if (data.past_types && data.past_types.length > 0) {
            // A PokeAPI ordena os past_types. Vamos pegar a tipagem válida mais antiga (que cobre a Gen 3)
            const past = data.past_types[0];
            if (past) {
                // Sobrescreve os tipos atuais pelo histórico antigo
                data.types = past.types;
            }
        }

        this.state.isShiny = false;
        this.dom.btnShiny.style.transform = 'scale(1)';
        this.dom.btnShiny.style.background = 'var(--btn-bg)';

        // Switch to Pokemon View
        this.switchView('pokemon');

        // Nav Buttons Visibility
        if (this.dom.btnPrev) this.dom.btnPrev.style.visibility = data.id > 1 ? 'visible' : 'hidden';
        if (this.dom.btnNext) this.dom.btnNext.style.visibility = data.id < 386 ? 'visible' : 'hidden';

        // Update Colors
        const primaryType = data.types[0].type.name;
        this.dom.dynamicBg.className = `badge-${primaryType}`;

        // Basic Info
        this.dom.pName.textContent = data.name;
        this.dom.pNum.textContent = `#${String(data.id).padStart(3, '0')}`;
        this.dom.pHeight.textContent = `${(data.height / 10).toFixed(1)} m`;
        this.dom.pWeight.textContent = `${(data.weight / 10).toFixed(1)} kg`;
        
        const mainAb = data.abilities.find(a => !a.is_hidden) || data.abilities[0];
        if (mainAb) {
            const abName = mainAb.ability.name.replace(/[-]/g, ' ');
            this.dom.pAbility.textContent = abName;
            this.dom.pAbility.style.textTransform = 'capitalize';
            
            // Busca a descrição da Habilidade
            this.dom.pAbility.parentElement.setAttribute('data-tooltip', 'Carregando...');
            fetchWithCache(mainAb.ability.url, `ab_${abName}`).then(abData => {
                let abDesc = "Sem descrição.";
                if (abData && abData.flavor_text_entries) {
                    const engFlavor = abData.flavor_text_entries.find(f => f.language.name === 'en');
                    if (engFlavor) abDesc = engFlavor.flavor_text.replace(/[\n\f]/g, ' ');
                }
                const rawAbName = mainAb.ability.name;
                if (window.TRANSLATIONS && window.TRANSLATIONS.abilities && window.TRANSLATIONS.abilities[rawAbName]) {
                    if (window.TRANSLATIONS.abilities[rawAbName].trim() !== '') {
                        abDesc = window.TRANSLATIONS.abilities[rawAbName];
                    }
                }
                this.dom.pAbility.parentElement.setAttribute('data-tooltip', abDesc.replace(/"/g, '&quot;'));
            });
        } else {
            this.dom.pAbility.textContent = 'N/A';
            this.dom.pAbility.parentElement.removeAttribute('data-tooltip');
        }
        
        // Effort Values (EV Yield)
        let evs = [];
        data.stats.forEach(s => {
            if (s.effort > 0) {
                let statName = s.stat.name;
                if (statName === 'hp') statName = 'HP';
                else if (statName === 'attack') statName = 'Atk';
                else if (statName === 'defense') statName = 'Def';
                else if (statName === 'special-attack') statName = 'Sp.Atk';
                else if (statName === 'special-defense') statName = 'Sp.Def';
                else if (statName === 'speed') statName = 'Spd';
                evs.push(`${s.effort} ${statName}`);
            }
        });
        if (this.dom.pEvs) {
            this.dom.pEvs.textContent = evs.length > 0 ? evs.join(', ') : '0';
        }

        this.updateFavBtn(data.id);
        this.updateTeamBtn(data.id);
        
        this.updateCaptureBtn(data.id);
        
        this.dom.pImg.src = this.getSprite(data, false);

        // Types
        this.dom.badge1.textContent = TYPE_TRANSLATIONS[primaryType] || primaryType;
        this.dom.badge1.className = `pokemon-type-badge badge1 badge-${primaryType}`;
        this.dom.badge1.style.display = 'inline-block';

        if (data.types[1]) {
            const secType = data.types[1].type.name;
            this.dom.badge2.textContent = TYPE_TRANSLATIONS[secType] || secType;
            this.dom.badge2.className = `pokemon-type-badge badge2 badge-${secType}`;
            this.dom.badge2.style.display = 'inline-block';
        } else {
            this.dom.badge2.style.display = 'none';
        }

        // Species Text (Genus and Flavor)
        if (species) {
            // Render Egg Groups
            const eggEl = document.getElementById('egg-groups');
            if (eggEl) {
                if (species.egg_groups && species.egg_groups.length > 0 && !species.egg_groups.find(g => g.name === 'no-eggs')) {
                    const eggTrans = {
                        'monster': 'Monstro', 'water1': 'Água 1', 'bug': 'Inseto', 'flying': 'Voador', 
                        'ground': 'Terrestre', 'fairy': 'Fada', 'plant': 'Planta', 'humanshape': 'Humanoide', 
                        'water3': 'Água 3', 'mineral': 'Mineral', 'indeterminate': 'Amorfo', 'water2': 'Água 2', 
                        'ditto': 'Ditto', 'dragon': 'Dragão', 'no-eggs': 'Sem Ovos'
                    };
                    eggEl.innerHTML = species.egg_groups.map(g => `<span style="background:var(--glass-bg); padding:2px 8px; border-radius:12px; border:1px solid var(--glass-border); text-transform:capitalize;">🥚 ${eggTrans[g.name] || g.name}</span>`).join('');
                } else {
                    eggEl.innerHTML = '<span style="background:var(--glass-bg); padding:2px 8px; border-radius:12px; border:1px solid var(--glass-border);">Sem Ovos</span>';
                }
            }

            const genusPtBr = species.genera.find(g => g.language.name === 'pt-BR');
            const genusEn = species.genera.find(g => g.language.name === 'en');
            let genusText = 'Pokémon';
            if (genusPtBr) {
                genusText = genusPtBr.genus;
            } else if (genusEn) {
                if (window.TRANSLATIONS_PT && window.TRANSLATIONS_PT.genera && window.TRANSLATIONS_PT.genera[genusEn.genus]) {
                    genusText = window.TRANSLATIONS_PT.genera[genusEn.genus];
                } else {
                    genusText = genusEn.genus;
                }
            }
            this.dom.pCat.textContent = genusText;
            
            const flavor = species.flavor_text_entries.find(f => f.language.name === 'pt-BR' || f.language.name === 'pt' || f.language.name === 'es' || f.language.name === 'en');
            let descText = flavor ? flavor.flavor_text.replace(/[\n\f]/g, ' ') : 'Sem descrição';
            
            // Override pela tradução manual, se existir
            if (window.TRANSLATIONS && window.TRANSLATIONS.pokedex && window.TRANSLATIONS.pokedex[data.id]) {
                if (window.TRANSLATIONS.pokedex[data.id].trim() !== '') {
                    descText = window.TRANSLATIONS.pokedex[data.id];
                }
            }
            
            this.dom.pDesc.textContent = descText;
            
            document.title = `${data.name.toUpperCase()} - Hoenn & Kanto Wiki`; // Dynamic Title
            
            this.state.currentSpecies = species;
            renderEvolutions(species.evolution_chain.url);
        }

        // Sub-renders (isolados: uma falha não pode travar a tela de carregamento)
        [
            () => renderStats(data.stats),
            () => renderMatchups(data.types),
            () => renderEncounters(data.id, this.state.versionGroup),
            () => renderMoves(data.moves, this.state.versionGroup)
        ].forEach(fn => {
            try { fn(); } catch (e) { console.error('Falha ao renderizar seção do Pokémon:', e); }
        });

        // O cry só toca sozinho no desktop; no mobile fica a cargo do botão 🔊
        if (!this.isTouchDevice()) this.playCry(data.id);
        this.dom.loadingOverlay.classList.add('hidden');
        window.scrollTo(0,0);
    },

    // Aplica busca e filtro de tipo em conjunto sobre os cards já renderizados.
    // (O filtro de status é aplicado antes, na montagem da grade em renderGrid.)
    applyFilters() {
        const termo = this.state.searchTerm || '';
        const tipoPermitido = this.state.typeFilterNames; // null = todos os tipos

        this.dom.gridContainer.querySelectorAll('.grid-card').forEach(card => {
            const nome = card.dataset.name || '';
            const id = String(card.dataset.id);
            const casaBusca = !termo || nome.includes(termo) || id === termo;
            const casaTipo = !tipoPermitido || tipoPermitido.has(nome);
            card.style.display = (casaBusca && casaTipo) ? 'flex' : 'none';
        });

        this.updateEmptyState();
    },

    // Lazy load the first 386 pokemon (Gen 1 to 3)
    async renderGrid() {
        const maxId = 386; // Gen 3 limit
        
        // Pega todos os nomes primeiro para permitir a busca parcial instantânea
        let pokemonList = [];
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${maxId}`);
            const data = await res.json();
            pokemonList = data.results;
        } catch(e) {}

        let observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const card = entry.target;
                    const id = card.dataset.id;
                    if (!card.dataset.loaded) {
                        const isCompact = document.getElementById('pokedex-grid').classList.contains('compact');
                        if (isCompact) {
                            card.querySelector('.poke-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/icons/${id}.png`;
                        } else {
                            card.querySelector('.poke-sprite').src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/${app.state.versionGroup}/${id}.png`;
                        }
                        card.dataset.loaded = 'true';
                    }
                    observer.unobserve(card);
                }
            });
        }, { rootMargin: '200px' });

        const fragment = document.createDocumentFragment();

        // Limpa a grade antes de repopular; sem isso cada re-render duplicava
        // a Pokédex inteira sobre a anterior.
        this.dom.gridContainer.innerHTML = '';

        this.state.statusFilter = this.state.statusFilter || 'all';

        for(let i = 1; i <= maxId; i++) {
            const isCaptured = this.state.captures.includes(i);
            
            if (this.state.statusFilter === 'caught' && !isCaptured) continue;
            if (this.state.statusFilter === 'uncaught' && isCaptured) continue;

            const pName = pokemonList[i-1] ? pokemonList[i-1].name : '...';
            const card = document.createElement('div');
            card.className = 'grid-card';
            card.dataset.id = i;
            card.dataset.name = pName;
            card.innerHTML = `
                <div class="catch-icon ${isCaptured ? 'captured' : ''}" data-id="${i}" title="Marcar como capturado">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M22 12h-4c0-3-2-4-4-4s-4 1-4 4H2"></path><circle cx="12" cy="12" r="2"></circle></svg>
                </div>
                <span class="grid-card-id">#${String(i).padStart(3, '0')}</span>
                <img src="./images/miss.png" alt="carregando" class="poke-sprite">
                <span class="grid-card-name" style="text-transform: capitalize;">${pName}</span>
            `;
            
            const catchBtn = card.querySelector('.catch-icon');
            catchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playClickSound();
                const pokeId = parseInt(catchBtn.dataset.id);
                if (this.state.captures.includes(pokeId)) {
                    this.state.captures = this.state.captures.filter(id => id !== pokeId);
                    catchBtn.classList.remove('captured');
                } else {
                    this.state.captures.push(pokeId);
                    catchBtn.classList.add('captured');
                }
                this.saveScopedData('captures', this.state.captures);
                this.updateDashboardStats();
            });

            card.addEventListener('click', () => {
                playClickSound();
                window.location.hash = `pokemon/${i}`;
                this.dom.searchInput.value = ''; // Limpa a busca ao entrar num pokemon
                this.state.searchTerm = '';

                // Remove o active de todos os filtros de tipo
                document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
                const btnAll = document.querySelector('.type-filter-btn.type-all');
                if (btnAll) btnAll.classList.add('active');
                this.state.typeFilterNames = null;

                this.applyFilters();
            });
            fragment.appendChild(card);
            observer.observe(card);
        }
        this.dom.gridContainer.appendChild(fragment);
        // A grade foi remontada: reaplica busca e filtro de tipo que estavam ativos
        this.applyFilters();
    },

    // Mensagem quando nenhum card está visível (busca sem resultado ou filtro vazio)
    updateEmptyState() {
        const grid = this.dom.gridContainer;
        let msg = document.getElementById('grid-empty-state');

        const temCards = grid.querySelector('.grid-card:not([style*="display: none"])');
        if (temCards) {
            if (msg) msg.remove();
            return;
        }

        if (!msg) {
            msg = document.createElement('p');
            msg.id = 'grid-empty-state';
            msg.className = 'grid-empty-state';
            grid.appendChild(msg);
        }
        const busca = this.dom.searchInput.value.trim();
        msg.textContent = busca
            ? `Nenhum Pokémon encontrado para "${busca}".`
            : 'Nenhum Pokémon corresponde aos filtros selecionados.';
    },

    async renderTypeFilters() {
        const types = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel'];
        const container = document.getElementById('type-filters');
        if (!container) return;
        
        // Botão "Todos"
        const btnAll = document.createElement('button');
        btnAll.className = 'type-filter-btn type-all active';
        btnAll.textContent = 'Todos';
        btnAll.setAttribute('aria-pressed', 'true');
        btnAll.addEventListener('click', () => {
            playClickSound();
            document.querySelectorAll('.type-filter-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            btnAll.classList.add('active');
            btnAll.setAttribute('aria-pressed', 'true');
            this.state.typeFilterNames = null;
            this.applyFilters();
        });
        container.appendChild(btnAll);

        types.forEach(type => {
            const btn = document.createElement('button');
            btn.className = `type-filter-btn type-${type}`;
            btn.textContent = TYPE_TRANSLATIONS[type] || type.toUpperCase();
            btn.setAttribute('aria-pressed', 'false');
            
            btn.addEventListener('click', async () => {
                playClickSound();
                document.querySelectorAll('.type-filter-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');

                try {
                    this.dom.loadingOverlay.classList.remove('hidden');
                    // Via API.getType: fica em cache, então re-filtrar é instantâneo
                    this.state.typeFilterNames = await getGen3SpeciesOfType(type);
                } catch(e) {
                    console.error('Falha ao filtrar por tipo:', e);
                    this.state.typeFilterNames = null;
                } finally {
                    this.dom.loadingOverlay.classList.add('hidden');
                }
                this.applyFilters();
            });
            container.appendChild(btn);
        });
    },

    async renderTeam() {
        const grid = document.getElementById('team-grid');
        const analysis = document.getElementById('team-analysis');
        if (!grid || !analysis) return;
        
        grid.innerHTML = '<div class="spinner"></div>';
        
        if (this.state.team.length === 0) {
            grid.innerHTML = '<p style="color:var(--text-muted); width: 100%; text-align: center;">Sua equipe está vazia. Volte à Pokédex e adicione alguns Pokémon!</p>';
            analysis.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                grid.innerHTML += `<div class="team-slot empty" onclick="window.location.hash=''"></div>`;
            }
            return;
        }

        const teamPromises = this.state.team.map(t => API.getPokemon(t.id));
        const teamResults = await Promise.all(teamPromises);
        const teamData = teamResults.filter(data => data !== null);

        // Render Slots
        grid.innerHTML = '';
        teamData.forEach((p, idx) => {
            const slot = document.createElement('div');
            const primaryType = p.types[0].type.name;
            slot.className = `team-slot badge-${primaryType}`;
            const sprite = this.getSprite(p, false);
            
            slot.innerHTML = `
                <button class="remove-btn" title="Remover" data-id="${p.id}">X</button>
                <img src="${sprite}" alt="${p.name}" loading="lazy" decoding="async">
                <span class="team-name">${p.name}</span>
            `;
            
            // Go to pokemon profile when clicking the slot
            slot.addEventListener('click', (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    playClickSound();
                    if (window.Training) {
                        window.Training.openTrainingCard(p.id);
                    } else {
                        window.location.hash = `pokemon/${p.id}`;
                    }
                }
            });
            
            // Remove from team button
            slot.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                playClickSound();
                this.state.team = this.state.team.filter(t => t.id !== p.id);
                app.saveScopedData('team', app.state.team);
                this.renderTeam(); // Re-render
            });

            grid.appendChild(slot);
        });

        // Add empty slots
        for (let i = teamData.length; i < 6; i++) {
            const slot = document.createElement('div');
            slot.className = 'team-slot empty';
            slot.addEventListener('click', () => { window.location.hash = ''; });
            grid.appendChild(slot);
        }

        // Calculate Matchups (tabela fixa da Gen 3, sem o tipo Fada)
        analysis.innerHTML = '';
        const typeWeaknessesCount = {};
        GEN3_TYPES.forEach(t => typeWeaknessesCount[t] = 0);

        for (let p of teamData) {
            const pMult = {};
            GEN3_TYPES.forEach(t => pMult[t] = 1);

            p.types.forEach(t => {
                const defType = t.type.name === 'fairy' ? 'normal' : t.type.name;
                const relations = TYPE_CHART_GEN3[defType];
                if (!relations) return;
                for (const attacker in relations) {
                    pMult[attacker] *= relations[attacker];
                }
            });

            for (let t in pMult) {
                if (pMult[t] > 1) {
                    typeWeaknessesCount[t]++;
                }
            }
        }

        let aHtml = '';
        for (let t in typeWeaknessesCount) {
            const count = typeWeaknessesCount[t];
            let cssClass = '';
            if (count >= 3) cssClass = 'weakness-high';
            else if (count === 0 && teamData.length > 0) cssClass = 'resist-high';
            
            aHtml += `
                <div class="team-analysis-item badge-${t} ${cssClass}" title="${count} Pokémon fracos contra ${TYPE_TRANSLATIONS[t]}">
                    <span>${TYPE_TRANSLATIONS[t]}</span>
                    <span class="team-analysis-count">${count}</span>
                </div>
            `;
        }
        analysis.innerHTML = aHtml;
    },

    async renderGyms() {
        const container = document.getElementById('gyms-container');
        if (!container) return;

        container.innerHTML = '<div class="spinner"></div>';

        // Os dados de treinadores só são baixados ao abrir esta aba
        if (!window.GYM_LEADERS) {
            try {
                await loadGymData();
            } catch (e) {
                container.innerHTML = '<p>Não foi possível carregar os dados dos treinadores. Verifique sua conexão.</p>';
                return;
            }
        }
        if (!window.GYM_LEADERS) return;
        
        let vg = this.state.versionGroup;
        const regionData = window.GYM_LEADERS[vg];
        
        if (!regionData) {
            container.innerHTML = '<p>Dados não encontrados.</p>';
            return;
        }

        const tab = this.state.gymTab || 'gyms';
        const leaders = regionData[tab];

        if (!leaders || leaders.length === 0) {
            container.innerHTML = '<p>Nenhum dado disponível.</p>';
            return;
        }

        let html = '<div class="frontier-grid">';
        const badgeMap = {
            "Boulder Badge": 1, "Cascade Badge": 2, "Thunder Badge": 3, "Rainbow Badge": 4, 
            "Soul Badge": 5, "Marsh Badge": 6, "Volcano Badge": 7, "Earth Badge": 8,
            "Stone Badge": 17, "Knuckle Badge": 18, "Dynamo Badge": 19, "Heat Badge": 20, 
            "Balance Badge": 21, "Feather Badge": 22, "Mind Badge": 23, "Rain Badge": 24,
            "Elite Four": "elite", "Champion": "champ"
        };

        const renderTeam = (teamArr, req) => {
            if (!teamArr || teamArr.length === 0) return '';
            let teamHtml = `<div class="frontier-team-section">
                <div class="frontier-team-req">${req}</div>
                <div class="frontier-team-grid">`;
            
            for (let poke of teamArr) {
                const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png`;
                
                let typesHtml = '';
                if (poke.types) {
                    poke.types.forEach(t => {
                        const tName = typeof TYPE_TRANSLATIONS !== 'undefined' && TYPE_TRANSLATIONS[t] ? TYPE_TRANSLATIONS[t] : t;
                        typesHtml += `<span class="pokemon-type-badge badge-${t}">${tName}</span>`;
                    });
                }
                
                let movesHtml = '';
                if (poke.moves) {
                    poke.moves.forEach(m => {
                        movesHtml += `<span class="frontier-move">${m}</span>`;
                    });
                }

                teamHtml += `
                    <div class="frontier-poke-card" onclick="playClickSound(); window.location.hash='pokemon/${poke.id}'" title="Ver Pokédex">
                        <div class="frontier-poke-header">
                            <img src="${spriteUrl}" alt="${poke.name}" loading="lazy">
                            <div class="frontier-poke-info">
                                <div class="frontier-poke-name">${poke.name} <span class="frontier-poke-level">Nv. ${poke.level}</span></div>
                                <div class="frontier-poke-types">${typesHtml}</div>
                            </div>
                        </div>
                        <div class="frontier-poke-details">
                            <div class="detail-row"><strong>Habilidade:</strong> ${poke.ability || '-'}</div>
                            <div class="detail-row"><strong>Item:</strong> ${poke.item || '-'}</div>
                        </div>
                        <div class="frontier-poke-moves">
                            ${movesHtml}
                        </div>
                    </div>
                `;
            }
            teamHtml += `</div></div>`;
            return teamHtml;
        };

        for (let leader of leaders) {
            let badgeImgHtml = '';
            if (badgeMap[leader.badge]) {
                if (badgeMap[leader.badge] === 'elite' || badgeMap[leader.badge] === 'champ') {
                    // Sem imagem de insígnia para E4, ou usar genérica
                } else {
                    badgeImgHtml = `<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/badges/${badgeMap[leader.badge]}.png" alt="${leader.badge}" class="frontier-symbol-img" loading="lazy" decoding="async" style="image-rendering: pixelated;">`;
                }
            }

            const tName = typeof TYPE_TRANSLATIONS !== 'undefined' && TYPE_TRANSLATIONS[leader.type] ? TYPE_TRANSLATIONS[leader.type] : leader.type;
            
            html += `
                <div class="bento-item frontier-facility-card">
                    <div class="frontier-facility-header">
                        <img src="${leader.sprite}" alt="${leader.name}" class="frontier-brain-sprite gym-leader-sprite" loading="lazy" decoding="async" style="max-height: 120px; object-fit: contain;">
                        <div class="frontier-facility-title">
                            <h3>${leader.name}</h3>
                            <div class="frontier-brain-title">${leader.city || ''}</div>
                            <p class="frontier-desc" style="margin-top:10px;">${leader.desc}</p>
                            <div class="frontier-symbol-box" style="${(!leader.symbol && !leader.badge) ? 'display:none;' : ''}">
                                ${badgeImgHtml}
                                <div>
                                    <strong style="color:var(--text-color);">${leader.symbol || leader.badge || ''}</strong><br>
                                    <span class="pokemon-type-badge badge-${leader.type}">${tName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="frontier-teams-container">
                        ${renderTeam(leader.silverTeam, leader.silverReq)}
                        ${renderTeam(leader.goldTeam, leader.goldReq)}
                    </div>
                </div>
            `;
        }
        
        html += '</div>'; // close frontier-grid
        container.innerHTML = html;
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
