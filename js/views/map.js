// Explorador de regiao com encontros locais da Gen 3.

import { formatarLocal } from './pokemon-render.js';
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

    async localData() {
        if (!this.dataPromise) {
            this.dataPromise = fetch(new URL('../../data/map-encounters.json', import.meta.url))
                .then(response => {
                    if (!response.ok) throw new Error('Map data: '+response.status);
                    return response.json();
                }).catch(error => {this.dataPromise=null;throw error;});
        }
        return this.dataPromise;
    }

    async loadRegionData() {
        const select=document.getElementById('map-location-select');
        if(!select)return;
        const request=this.loadSequence=(this.loadSequence||0)+1;
        const region=this.currentRegion;
        const group=window.app?.state.versionGroup;
        const versions=region==='kanto'?['firered','leafgreen']:
            group==='ruby-sapphire'?['ruby','sapphire']:['emerald'];
        const en=window.app?.state.lang==='en';
        select.replaceChildren(new Option(en?'Loading...':'Carregando...',''));
        select.disabled=true;
        try {
            const data=await this.localData();
            if(request!==this.loadSequence)return;
            this.activeVersions=versions;
            this.locations=[...new Set(versions.flatMap(version=>Object.keys(data[version]||{})))];
            const locations=this.locations.map(value=>({
                value,name:en?value.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()):formatarLocal(value)
            })).sort((a,b)=>a.name.localeCompare(b.name));
            select.replaceChildren(new Option(en?'Select a location...':'Selecione um local...',''),
                ...locations.map(location=>new Option(location.name,location.value)));
            select.disabled=false;
        } catch(error) {
            console.error('Error loading local map',error);
            select.replaceChildren(new Option(en?'Unable to load locations.':'Erro ao carregar locais.',''));
        }
    }

    async exploreLocation() {
        const select=document.getElementById('map-location-select');
        const container=document.getElementById('map-encounters-container');
        if(!select?.value||!container)return;
        const area=select.value;
        const request=this.loadSequence;
        const data=await this.localData();
        if(request!==this.loadSequence||select.value!==area)return;
        const grouped={};
        for(const version of this.activeVersions||[]) {
            for(const [method,pokemon] of Object.entries(data[version]?.[area]||{})) {
                grouped[method] ||= new Map();
                for(const entry of pokemon) {
                    const existing=grouped[method].get(entry.name);
                    if(!existing)grouped[method].set(entry.name,{...entry});
                    else {
                        existing.minLevel=Math.min(existing.minLevel,entry.minLevel);
                        existing.maxLevel=Math.max(existing.maxLevel,entry.maxLevel);
                        // Alternative game versions are not independent encounters.
                        existing.chance=Math.max(existing.chance,entry.chance);
                    }
                }
            }
        }
        this.renderEncounters(grouped,container);
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
