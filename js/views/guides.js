// Guias praticos, naturezas e calculadora de tipos.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

import { getGuias } from '../core/dataset.js';
import { TYPE_TRANSLATIONS, TYPE_CHART_GEN3 } from '../core/types.js';

export default {
    async renderGuides() {
        const container = document.getElementById('guides-container');
        if (!container) return;

        const tab = this.state.guideTab || 'stones';
        const GUIDES_DATA = await getGuias().catch(() => ({}));
        if (GUIDES_DATA[tab]) {
            const data = GUIDES_DATA[tab];
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
            container.innerHTML = '<p data-ui=labels.text_0c63647006>Guia não encontrado.</p>';
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

};
