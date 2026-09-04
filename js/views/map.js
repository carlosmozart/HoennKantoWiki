// Explorador de regiao. Encontros vem da PokeAPI so nesta tela.

import { spriteCheio } from '../core/sprites.js';

class MapExplorer {
    constructor() {
        this.locations = [];
        this.currentRegion = 'hoenn'; // 'hoenn' or 'kanto'
        this.init();
    }

    async init() {
        this.bindEvents();
        // Wait a bit for DOM to be fully ready before first load
        setTimeout(() => this.loadRegionData(), 500);
    }

    bindEvents() {
        const btnSearch = document.getElementById('btn-search-location');
        if (btnSearch) {
            btnSearch.addEventListener('click', () => this.exploreLocation());
        }

        const select = document.getElementById('map-location-select');
        if (select) {
            select.addEventListener('change', () => this.exploreLocation());
        }
    }

    setRegion(region) {
        this.currentRegion = region;
        const img = document.getElementById('map-image-display');
        if (img) {
            img.src = region === 'hoenn' ? 'img/Hoenn_Map.png' : 'img/Kanto_Map.png';
        }
        
        const container = document.getElementById('map-encounters-container');
        if (container) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);"><p data-ui=labels.text_d7fd4c1d56>Selecione um local acima para ver os Pokémon.</p></div>';
        }
        
        this.loadRegionData();
    }

    async loadRegionData() {
        const select = document.getElementById('map-location-select');
        if (!select) return;

        select.innerHTML = '<option value="">Carregando locais da PokéAPI...</option>';
        select.disabled = true;

        try {
            const regionId = this.currentRegion === 'hoenn' ? 3 : 1; // Hoenn = 3, Kanto = 1
            const res = await fetch(`https://pokeapi.co/api/v2/region/${regionId}`);
            const data = await res.json();
            
            this.locations = data.locations;
            
            // Sort alphabetically by format Name (e.g. Route 119)
            const sortedLocs = this.locations.map(l => {
                let name = l.name.replace(this.currentRegion + '-', '').replace(/-/g, ' ');
                name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return { name, url: l.url };
            }).sort((a, b) => a.name.localeCompare(b.name));

            let optionsHtml = '<option value="">Selecione um local...</option>';
            sortedLocs.forEach(loc => {
                optionsHtml += `<option value="${loc.url}">${loc.name}</option>`;
            });
            
            select.innerHTML = optionsHtml;
            select.disabled = false;
        } catch (err) {
            console.error("Error loading region data", err);
            select.innerHTML = '<option value="">Erro ao carregar locais.</option>';
        }
    }

    async exploreLocation() {
        const select = document.getElementById('map-location-select');
        const container = document.getElementById('map-encounters-container');
        if (!select || !container || !select.value) return;

        const locUrl = select.value;
        container.innerHTML = '<div class="spinner"></div><p style="text-align:center;" data-ui=labels.text_886f6d44c2>Mapeando área...</p>';

        try {
            // Fetch Location details to get Areas
            const locRes = await fetch(locUrl);
            const locData = await locRes.json();
            
            if (!locData.areas || locData.areas.length === 0) {
                container.innerHTML = '<p style="text-align:center; color:var(--type-fire);" data-ui=labels.text_a89e8098b0>Nenhum Pokémon selvagem encontrado neste local.</p>';
                return;
            }

            // For simplicity, we just fetch the first Area (usually the main one)
            // Or we can fetch all areas and merge them. Let's merge all areas.
            let allEncounters = [];
            for (let area of locData.areas) {
                const areaRes = await fetch(area.url);
                const areaData = await areaRes.json();
                allEncounters = allEncounters.concat(areaData.pokemon_encounters);
            }

            // Deduplicate and group by method
            const groupedEncounters = {};
            const versionAllowed = this.currentRegion === 'hoenn' ? ['emerald', 'ruby', 'sapphire'] : ['firered', 'leafgreen'];

            allEncounters.forEach(enc => {
                // Filter by active version (simplified check for any Gen 3 version allowed in region)
                const validDetails = enc.version_details.filter(vd => versionAllowed.includes(vd.version.name));
                if (validDetails.length === 0) return;

                const pokemonName = enc.pokemon.name;
                const pId = enc.pokemon.url.split('/').filter(Boolean).pop();

                validDetails.forEach(vd => {
                    vd.encounter_details.forEach(detail => {
                        const method = detail.method.name;
                        if (!groupedEncounters[method]) groupedEncounters[method] = new Map();
                        
                        // We store the highest level and max chance for simplicity
                        if (!groupedEncounters[method].has(pokemonName)) {
                            groupedEncounters[method].set(pokemonName, {
                                id: pId,
                                name: pokemonName,
                                minLevel: detail.min_level,
                                maxLevel: detail.max_level,
                                chance: detail.chance
                            });
                        } else {
                            const existing = groupedEncounters[method].get(pokemonName);
                            existing.maxLevel = Math.max(existing.maxLevel, detail.max_level);
                            existing.minLevel = Math.min(existing.minLevel, detail.min_level);
                            existing.chance += detail.chance; // aggregate chances roughly
                        }
                    });
                });
            });

            this.renderEncounters(groupedEncounters, container);

        } catch (err) {
            console.error(err);
            container.innerHTML = '<p style="text-align:center; color:red;" data-ui=labels.text_034c23337f>Erro ao processar os encontros.</p>';
        }
    }

    renderEncounters(groupedEncounters, container) {
        if (Object.keys(groupedEncounters).length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-muted);" data-ui=labels.text_301e4537bc>Nenhum Pokémon disponível nesta versão do jogo.</p>';
            return;
        }

        let html = '';
        
        const methodTranslations = {
            'walk': { name: 'Mato Alto (Andando)', icon: '🌿', color: 'var(--type-grass)' },
            'surf': { name: 'Surfando na Água', icon: '🌊', color: 'var(--type-water)' },
            'old-rod': { name: 'Pescando (Old Rod)', icon: '🎣', color: 'var(--type-normal)' },
            'good-rod': { name: 'Pescando (Good Rod)', icon: '🎣', color: 'var(--type-water)' },
            'super-rod': { name: 'Pescando (Super Rod)', icon: '🎣', color: 'var(--type-water)' },
            'rock-smash': { name: 'Quebrando Pedras', icon: '🪨', color: 'var(--type-fighting)' }
        };

        for (let method in groupedEncounters) {
            const trans = methodTranslations[method] || { name: method.replace(/-/g, ' '), icon: '❓', color: 'var(--text-color)' };
            
            html += `
                <div style="margin-bottom: 25px; background:rgba(0,0,0,0.2); padding:15px; border-radius:10px; border-left:4px solid ${trans.color};">
                    <h3 style="margin-top:0; color:${trans.color}; font-size:1.1rem;">
                        ${trans.icon} ${trans.name}
                    </h3>
                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:15px; margin-top:15px;">
            `;

            const pokes = Array.from(groupedEncounters[method].values());
            pokes.sort((a,b) => b.chance - a.chance); // Sort by encounter rate

            pokes.forEach(p => {
                const pokeName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
                const capChance = p.chance > 100 ? 100 : p.chance; // Prevent overflow from area merging
                
                html += `
                    <div class="bento-item" style="padding:10px; text-align:center; cursor:pointer; display: flex; flex-direction: column; align-items: center;" onclick="playClickSound(); window.location.hash='pokemon/${p.id}'" title="Ver Dex">
                        <img src="${spriteCheio(p.id)}" alt="${p.name}" loading="lazy" decoding="async" style="width:70px; height:70px; filter:drop-shadow(2px 2px 3px rgba(0,0,0,0.4)); margin: 0 auto;">
                        <strong style="display:block; font-size:0.9rem;">${pokeName}</strong>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:5px;">Lv ${p.minLevel}-${p.maxLevel}</div>
                        <div style="font-size:0.8rem; font-weight:bold; color:var(--primary-color); background:rgba(0,0,0,0.4); border-radius:4px; margin-top:5px; padding:2px;">~${capChance}%</div>
                    </div>
                `;
            });

            html += `</div></div>`;
        }

        container.innerHTML = html;
    }
}

function initMapManager() {
    if (!window.MapManager) {
        window.MapManager = new MapExplorer();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMapManager);
} else {
    initMapManager();
}
