// Itens importantes por regiao. Dados em data/key-items.json.

import { getItensChave } from '../core/dataset.js';

export async function renderKeyItems(versionGroup) {
    const keyItemsData = await getItensChave().catch(() => ({}));
    const container = document.getElementById('view-items-content');
    if (!container) return;
    
    // Emerald / Ruby / Sapphire usam dados da Hoenn. FireRed / LeafGreen usam Kanto.
    const region = (versionGroup === 'emerald' || versionGroup === 'ruby-sapphire') ? 'hoenn' : 'kanto';
    const data = keyItemsData[region];
    
    let html = '';
    
    data.forEach(category => {
        html += `
            <div class="bento-item" style="padding: 20px; background: var(--glass-bg);">
                <h3 style="color: var(--primary-color); margin-bottom: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                    ${category.category}
                </h3>
                <div style="display: flex; flex-direction: column; gap: 15px;">
        `;
        
        category.items.forEach(item => {
            html += `
                    <div class="item-card" style="padding: 10px; background: rgba(0,0,0,0.1); border-radius: 8px;">
                        <h4 style="margin: 0 0 5px 0; color: var(--text-color); font-size: 1.05rem;">📦 ${item.name}</h4>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">${item.desc}</p>
                    </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
