const fs = require('fs');
const file = 'js/guides.js';
let content = fs.readFileSync(file, 'utf8');

const newGuide = `
    },
    "sevii": {
        "title": "Guia das Sevii Islands (FRLG)",
        "content": \`
            <div style="text-align:left; color:var(--text-muted); font-size: 0.95rem;">
                <p>As Sevii Islands são um arquipélago exclusivo de Pokémon FireRed e LeafGreen. As ilhas 1-3 são acessadas após vencer o Ginásio de Cinnabar, enquanto as ilhas 4-7 exigem vencer a Elite 4 e possuir o National Pokédex.</p>
                <div style="text-align:center; margin: 20px 0;">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rainbow-pass.png" alt="Rainbow Pass" style="image-rendering:pixelated; width:60px; filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.5));">
                </div>
                
                <h3 style="color:var(--type-fire); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Knot Island (Ilha 1)</h3>
                <p>O lar da Pokémon Network Center e do Mt. Ember. Lar de Moltres.</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Ponyta, Rapidash, Magmar (LG), Machop, Geodude, Moltres.</li>
                    <li><strong>Itens Importantes:</strong> Ruby (Network Center), Fire Stone.</li>
                </ul>

                <h3 style="color:var(--type-water); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Boon Island (Ilha 2)</h3>
                <p>O lar do Move Maniac e do Game Corner. Não possui áreas de mato alto selvagem, mas é crucial para utilidades.</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Dunsparce (Water Path).</li>
                    <li><strong>Itens Importantes:</strong> Meteorite (Troca), Moon Stone.</li>
                </ul>

                <h3 style="color:var(--type-grass); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Kin Island (Ilha 3)</h3>
                <p>Invadida temporariamente por motoqueiros e lar da assustadora Berry Forest.</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Drowzee, Hypno, Exeggcute, Venonat, Grimer.</li>
                    <li><strong>Itens Importantes:</strong> Full Restore, Max Ether.</li>
                </ul>

                <h3 style="color:var(--type-ice); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Floe Island (Ilha 4)</h3>
                <p>Uma ilha congelada onde vive Lorelei, da Elite Four. Lar da Icefall Cave.</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Swinub, Piloswine, Sneasel (LG), Delibird (FR), Lapras, Seel, Dewgong.</li>
                    <li><strong>Itens Importantes:</strong> HM07 (Waterfall), NeverMeltIce.</li>
                </ul>

                <h3 style="color:var(--type-electric); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Chrono Island (Ilha 5)</h3>
                <p>Uma ilha de ruínas (Resort Gorgeous e Lost Cave). Lar do esconderijo final da Equipe Rocket.</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Togepi (Water Labyrinth Egg), Murkrow (FR), Misdreavus (LG), Sentret, Hoppip.</li>
                    <li><strong>Itens Importantes:</strong> Sapphire (Rocket Warehouse), Up-Grade, Metal Coat.</li>
                </ul>

                <h3 style="color:var(--type-bug); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Fortune Island (Ilha 6)</h3>
                <p>Lar da Altering Cave e do Ruin Valley. Uma ilha repleta de mistérios.</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Yanma, Natu, Wobbuffet, Heracross, Ledyba, Spinarak.</li>
                    <li><strong>Itens Importantes:</strong> Sun Stone, Dragon Scale.</li>
                </ul>

                <h3 style="color:var(--type-psychic); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Quest Island (Ilha 7)</h3>
                <p>A ilha final, lar do Trainer Tower e das misteriosas Sevault Canyons e Tanoby Ruins (Unown).</p>
                <ul style="margin-left:20px; margin-bottom:15px;">
                    <li><strong>Pokémon Notáveis:</strong> Unown (28 formas), Larvitar, Skarmory (FR), Mantine (LG), Phanpy, Onix.</li>
                    <li><strong>Itens Importantes:</strong> King's Rock, Metal Coat, Up-Grade (Trainer Tower), Lucky Punch.</li>
                </ul>
            </div>
        \`
    }
};`;

content = content.replace(/    \}\n\};\s*$/, newGuide);
fs.writeFileSync(file, content);
