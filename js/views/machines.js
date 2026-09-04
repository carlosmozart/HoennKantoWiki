// TMs, HMs e tutores.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { getMaquinas, getTutores } from '../core/dataset.js';
import { TYPE_TRANSLATIONS } from '../core/types.js';

const normalizarGolpe = (nome = '') => nome
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const chaveGolpe = (nome = '') => {
    const chave = normalizarGolpe(nome).toLowerCase();
    return chave === 'softboiled' ? 'soft boiled' : chave;
};

const capitalizarGolpe = (nome = '') => normalizarGolpe(nome)
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
    .join(' ');

const pilulaTipo = (tipo = 'normal') => `
    <span class="pokemon-type-badge machine-type-pill badge-${tipo}">
        ${TYPE_TRANSLATIONS[tipo] || tipo}
    </span>`;

export default {
    async renderTMs() {
        const gridTM = document.getElementById('tms-grid');
        const gridTutor = document.getElementById('tutors-container');
        if (!gridTM || !gridTutor) return;

        const tab = this.state.tmTab || 'tms';
        
        if (tab === 'tms') {
            gridTM.classList.remove('hidden');
            gridTutor.classList.add('hidden');
            
            let html = '';
            const GEN3_MACHINES = await getMaquinas().catch(() => []);
            {
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

                    const nameCap = capitalizarGolpe(machine.move);
                    
                    const isChecked = this.loadScopedData(`tm-${machine.id}`, false) ? 'checked' : '';
                    const opacity = isChecked ? '0.5' : '1';
                    
                    html += `
                        <article class="grid-card machine-card tm-card-${machine.id}" style="opacity: ${opacity};">
                            <div class="machine-card-header">
                                <div class="machine-card-identity">
                                    <strong class="machine-code">${machine.id}</strong>
                                    ${pilulaTipo(machine.type)}
                                </div>
                                <input type="checkbox" class="tm-checkbox" data-tmid="${machine.id}" ${isChecked} aria-label="Marcar ${machine.id} como encontrada">
                            </div>
                            <h3 class="machine-card-title">${nameCap}</h3>
                            <p class="machine-card-description">${desc}</p>
                            
                            <div class="machine-card-meta">
                                <strong data-ui="labels.text_b325505115">📍 Encontrar:</strong>
                                <span>${location}</span>
                            </div>
                        </article>
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
                    this.updateDashboardStats();
                });
            });
        } else {
            // Render Tutors
            gridTM.classList.add('hidden');
            gridTutor.classList.remove('hidden');
            
            let html = '';
            const vg = this.state.versionGroup || 'emerald';
            const MOVE_TUTORS = await getTutores().catch(() => ({}));
            if (MOVE_TUTORS[vg]) {
                MOVE_TUTORS[vg].forEach(cat => {
                    html += `
                        <div class="frontier-team-section" style="margin-top:20px; text-align:left;">
                            <div class="frontier-team-req" style="margin-bottom:10px;">${cat.category}</div>
                            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${cat.desc}</p>
                            <div class="frontier-grid">
                    `;
                    cat.tutors.forEach(t => {
                        let desc = "Sem descrição.";
                        const tMoveKey = chaveGolpe(t.move);
                        if (window.TRANSLATIONS && window.TRANSLATIONS.moves && window.TRANSLATIONS.moves[tMoveKey]) {
                            desc = window.TRANSLATIONS.moves[tMoveKey];
                        }
                        
                        let locHtml = t.location ? `<div class="machine-card-meta"><strong data-ui="labels.text_b325505115">📍 Encontrar:</strong><span>${t.location}</span></div>` : '';
                        
                        html += `
                            <article class="grid-card machine-card">
                                <div class="machine-card-header">
                                    ${pilulaTipo(t.type)}
                                    <strong class="machine-cost">${t.cost}</strong>
                                </div>
                                <h3 class="machine-card-title">${capitalizarGolpe(t.move)}</h3>
                                <p class="machine-card-description">${desc}</p>
                                ${locHtml}
                            </article>
                        `;
                    });
                    html += `</div></div>`;
                });
            } else {
                html = '<p data-ui=labels.text_2f2964c576>Dados de tutores não encontrados.</p>';
            }
            gridTutor.innerHTML = html;
        }
    },

};
