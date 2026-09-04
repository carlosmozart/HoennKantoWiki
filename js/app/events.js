// Ligacao de eventos da interface.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { spriteIcone, spritePokemon } from '../core/sprites.js';

import { playClickSound } from '../ui/sound.js';
import { resolverBusca } from '../core/dataset.js';
import { renderEvolutions, renderEncounters, renderMoves } from '../views/pokemon-render.js';

export default {
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
            btnCopySave.addEventListener('click', async () => {
                const ok = await (async () => {
                    try {
                        await navigator.clipboard.writeText(exportOutput.value);
                        return true;
                    } catch (e) {
                        // Fallback para navegadores sem Clipboard API ou sem permissão
                        try {
                            exportOutput.select();
                            return document.execCommand('copy');
                        } catch (e2) {
                            return false;
                        }
                    }
                })();
                btnCopySave.textContent = ok ? '✅ Copiado!' : '❌ Copie manualmente';
                setTimeout(() => btnCopySave.textContent = '📋 Copiar Código', 2000);
            });
        }

        if (btnImportSave) {
            btnImportSave.addEventListener('click', () => {
                const code = importInput.value.trim();
                if (!code) return alert('Cole um código primeiro!');
                if (!confirm('Carregar este save vai substituir o progresso salvo neste navegador (capturas, equipes, favoritos e TMs). Deseja continuar?')) return;
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
        // Enter ou clique na lupa: abre o Pokemon que corresponde ao termo.
        // Antes o submit era apenas cancelado, entao buscar por nome parcial e
        // apertar Enter nao fazia absolutamente nada.
        this.dom.searchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const termo = this.dom.searchInput.value.trim();
            if (!termo) return;

            const id = await resolverBusca(termo);
            if (id) {
                this.dom.searchInput.value = '';
                this.state.searchTerm = '';
                this.applyFilters();
                window.location.hash = `pokemon/${id}`;
            } else {
                // Sem correspondencia: mantem a grade filtrada e avisa
                this.updateEmptyState();
            }
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

        // Reabrir os tipos manualmente durante a busca
        const btnTipos = document.getElementById('btn-toggle-tipos');
        if (btnTipos) {
            btnTipos.addEventListener('click', () => {
                const painel = document.querySelector('.filters-panel');
                if (!painel) return;
                painel.classList.toggle('tipos-forcados');
                this.atualizarPainelDeFiltros();
            });
        }

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
                const p = this.state.currentPokemon;
                renderMoves(p.golpes, this.state.versionGroup);
                renderEncounters(p.id, p.locais, this.state.versionGroup);
                renderEvolutions(p.evolucoes, this.state.versionGroup);
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
                this.dom.pImg.src = this.getSprite(this.state.currentPokemon.id, this.state.isShiny);
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
                    img.src = spriteIcone(id);
                } else {
                    img.src = spritePokemon(id, { versao: this.state.versionGroup });
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

        // --- Instalar como aplicativo ---
        // Chrome/Edge/Android disparam beforeinstallprompt e permitem chamar o
        // prompt nativo. O Safari do iOS nunca implementou esse evento: la a
        // instalacao e manual (Compartilhar > Adicionar a Tela de Inicio), e
        // sem este caminho o botao simplesmente nunca aparecia no iPhone.
        let deferredPrompt;
        const installBtn = document.getElementById('btn-install-app');

        const jaInstalado = () =>
            window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;

        const ehIOS = () =>
            /iphone|ipad|ipod/i.test(navigator.userAgent)
            // iPadOS 13+ se identifica como Mac; o toque denuncia o tablet
            || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        if (installBtn) {
            if (ehIOS() && !jaInstalado()) {
                installBtn.classList.remove('hidden');
                installBtn.title = 'Como instalar no iPhone/iPad';
            }

            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installBtn.classList.remove('hidden');
            });

            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') installBtn.classList.add('hidden');
                    deferredPrompt = null;
                    return;
                }
                if (ehIOS()) {
                    this.mostrarInstrucoesIOS();
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

};
