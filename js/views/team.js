// Montador de equipes.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { getPokemon, getResumo } from '../core/dataset.js';
import { TYPE_TRANSLATIONS, TYPE_CHART_GEN3, GEN3_TYPES } from '../core/types.js';
import { playClickSound } from '../ui/sound.js';

export default {
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

        // Resumo do indice basta aqui: id, nome, tipos e stats
        const teamResults = await Promise.all(this.state.team.map(t => getResumo(t.id)));
        const teamData = teamResults.filter(Boolean);

        // Render Slots
        grid.innerHTML = '';
        teamData.forEach((p, idx) => {
            const slot = document.createElement('div');
            const primaryType = p.tipos[0];
            slot.className = `team-slot badge-${primaryType}`;
            const sprite = this.getSprite(p.id, false);

            slot.innerHTML = `
                <button class="remove-btn" title="Remover" data-id="${p.id}">X</button>
                <img src="${sprite}" alt="${p.nome}" loading="lazy" decoding="async">
                <span class="team-name">${p.nome}</span>
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

            p.tipos.forEach(tipo => {
                const relations = TYPE_CHART_GEN3[tipo];
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

};
