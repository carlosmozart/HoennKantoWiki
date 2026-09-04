// TMs, HMs e tutores.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { getMaquinas, getTutores } from '../core/dataset.js';

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

};
