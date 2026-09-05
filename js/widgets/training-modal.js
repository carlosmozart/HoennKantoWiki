// Ficha de treinamento (EVs e natureza).

import { spritePokemon } from '../core/sprites.js';

import { getResumo } from '../core/dataset.js';

class TrainingManager {
    constructor() {
        this.currentPokemonId = null;
        this.currentPokemonData = null;
        this.natures = {
            'hardy': { name: 'Hardy', up: null, down: null },
            'lonely': { name: 'Lonely', up: 'attack', down: 'defense' },
            'brave': { name: 'Brave', up: 'attack', down: 'speed' },
            'adamant': { name: 'Adamant', up: 'attack', down: 'special_attack' },
            'naughty': { name: 'Naughty', up: 'attack', down: 'special_defense' },
            'bold': { name: 'Bold', up: 'defense', down: 'attack' },
            'docile': { name: 'Docile', up: null, down: null },
            'relaxed': { name: 'Relaxed', up: 'defense', down: 'speed' },
            'impish': { name: 'Impish', up: 'defense', down: 'special_attack' },
            'lax': { name: 'Lax', up: 'defense', down: 'special_defense' },
            'timid': { name: 'Timid', up: 'speed', down: 'attack' },
            'hasty': { name: 'Hasty', up: 'speed', down: 'defense' },
            'serious': { name: 'Serious', up: null, down: null },
            'jolly': { name: 'Jolly', up: 'speed', down: 'special_attack' },
            'naive': { name: 'Naive', up: 'speed', down: 'special_defense' },
            'modest': { name: 'Modest', up: 'special_attack', down: 'attack' },
            'mild': { name: 'Mild', up: 'special_attack', down: 'defense' },
            'quiet': { name: 'Quiet', up: 'special_attack', down: 'speed' },
            'bashful': { name: 'Bashful', up: null, down: null },
            'rash': { name: 'Rash', up: 'special_attack', down: 'special_defense' },
            'calm': { name: 'Calm', up: 'special_defense', down: 'attack' },
            'gentle': { name: 'Gentle', up: 'special_defense', down: 'defense' },
            'sassy': { name: 'Sassy', up: 'special_defense', down: 'speed' },
            'careful': { name: 'Careful', up: 'special_defense', down: 'special_attack' },
            'quirky': { name: 'Quirky', up: null, down: null }
        };
        this.statNames = {
            'hp': 'HP',
            'attack': 'Attack',
            'defense': 'Defense',
            'special_attack': 'Sp. Atk',
            'special_defense': 'Sp. Def',
            'speed': 'Speed'
        };
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('btn-close-training').addEventListener('click', () => {
            this.close();
        });
        document.getElementById('btn-training-to-pokedex').addEventListener('click', () => {
            this.close();
            window.location.hash = `pokemon/${this.currentPokemonId}`;
        });
        document.getElementById('btn-training-shiny').addEventListener('click', () => {
            const member = app.state.team.find(t => t.id === this.currentPokemonId);
            if (!member) return;
            member.shiny = !Boolean(member.shiny);
            this.updateTeamData('shiny', member.shiny);
            this.renderPokemonIdentity(member);
            app.renderTeam?.();
        });
        
        const natureSelect = document.getElementById('training-nature');
        for (const [key, val] of Object.entries(this.natures)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${val.name} ${val.up ? `(+${this.statNames[val.up]}, -${this.statNames[val.down]})` : '(Neutra)'}`;
            natureSelect.appendChild(opt);
        }
        
        natureSelect.addEventListener('change', (e) => {
            this.updateTeamData('nature', e.target.value);
            this.renderCalculatedStats();
        });
    }

    close() {
        const modal = document.getElementById('training-modal');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }

    renderPokemonIdentity(teamMember) {
        const shiny = Boolean(teamMember.shiny);
        const name = this.currentPokemonData.nome || 'Pokémon';
        document.getElementById('training-modal-name').textContent = name.charAt(0).toUpperCase() + name.slice(1);
        const image = document.getElementById('training-modal-img');
        image.src = spritePokemon(this.currentPokemonId, { versao: app.state.versionGroup, shiny });
        image.alt = `${name}${shiny ? ' shiny' : ''}`;
        document.querySelector('.training-card').classList.toggle('is-shiny', shiny);
        document.getElementById('training-shiny-badge').hidden = !shiny;
        document.getElementById('btn-training-shiny').setAttribute('aria-pressed', String(shiny));
    }

    async openTrainingCard(pokemonId) {
        this.currentPokemonId = pokemonId;
        this.currentPokemonData = await getResumo(pokemonId);
        if (!this.currentPokemonData) return;

        const teamMember = app.state.team.find(t => t.id === pokemonId);
        if (!teamMember) return;

        const modal = document.getElementById('training-modal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        this.renderPokemonIdentity(teamMember);
        
        document.getElementById('training-nature').value = teamMember.nature;

        this.renderSliders(teamMember);
        this.renderCalculatedStats();
    }

    updateTeamData(key, value, stat = null) {
        const idx = app.state.team.findIndex(t => t.id === this.currentPokemonId);
        if (idx > -1) {
            if (key === 'nature') {
                app.state.team[idx].nature = value;
            } else if (key === 'evs') {
                app.state.team[idx].evs[stat] = parseInt(value) || 0;
            } else if (key === 'shiny') {
                app.state.team[idx].shiny = Boolean(value);
            }
            app.saveScopedData('team', app.state.team);
        }
    }

    renderSliders(teamMember) {
        const container = document.getElementById('ev-sliders-container');
        container.innerHTML = '';
        
        Object.keys(this.statNames).forEach(stat => {
            const val = teamMember.evs[stat];
            const html = `
                <div class="training-stat-row">
                    <div class="training-stat-label">${this.statNames[stat]}</div>
                    <input type="range" min="0" max="252" value="${val}" class="ev-slider" data-stat="${stat}" aria-label="EV de ${this.statNames[stat]}">
                    <input type="number" min="0" max="252" value="${val}" class="ev-input" data-stat="${stat}" aria-label="Valor de EV de ${this.statNames[stat]}">
                    <div class="calc-stat-display" data-stat="${stat}">0</div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });

        const inputs = container.querySelectorAll('.ev-input');
        const sliders = container.querySelectorAll('.ev-slider');
        
        const syncValue = (stat, val) => {
            val = Math.min(252, Math.max(0, val));
            // Check max 510
            let currentTotal = 0;
            Object.keys(this.statNames).forEach(s => {
                if (s !== stat) currentTotal += teamMember.evs[s];
            });
            if (currentTotal + val > 510) val = 510 - currentTotal;

            const slider = container.querySelector(`.ev-slider[data-stat="${stat}"]`);
            const input = container.querySelector(`.ev-input[data-stat="${stat}"]`);
            slider.value = val;
            input.value = val;
            
            this.updateTeamData('evs', val, stat);
            this.renderCalculatedStats();
        };

        inputs.forEach(input => {
            input.addEventListener('input', (e) => syncValue(e.target.dataset.stat, parseInt(e.target.value) || 0));
        });
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => syncValue(e.target.dataset.stat, parseInt(e.target.value) || 0));
        });
    }

    // No dataset os stats sao um objeto com chaves hifenizadas
    // ('special-attack'); aqui as chaves usam underscore.
    baseStat(stat) {
        const chave = stat.replace('_', '-');
        return (this.currentPokemonData.stats || {})[chave] || 0;
    }

    renderCalculatedStats() {
        const teamMember = app.state.team.find(t => t.id === this.currentPokemonId);
        if (!teamMember || !this.currentPokemonData) return;

        const level = 50;
        let totalEvs = 0;
        const natureData = this.natures[teamMember.nature] || this.natures.hardy;

        Object.keys(this.statNames).forEach(stat => {
            const ev = teamMember.evs[stat];
            const iv = teamMember.ivs[stat];
            const base = this.baseStat(stat);
            totalEvs += ev;
            
            let calc = 0;
            if (stat === 'hp') {
                calc = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + level + 10;
            } else {
                calc = Math.floor((2 * base + iv + Math.floor(ev / 4)) * level / 100) + 5;
                if (natureData.up === stat) calc = Math.floor(calc * 1.1);
                if (natureData.down === stat) calc = Math.floor(calc * 0.9);
            }

            const display = document.querySelector(`.calc-stat-display[data-stat="${stat}"]`);
            if (display) display.textContent = calc;
            
            const label = display.parentElement.firstElementChild;
            label.style.color = (natureData.up === stat) ? 'var(--stat-fav)' : ((natureData.down === stat) ? 'var(--event-high-tide)' : 'var(--text-color)');
        });

        document.getElementById('ev-total').textContent = `${totalEvs}/510`;
    }
}

export function init() {
    window.Training = new TrainingManager();
}
