window.GUIDES_DATA = {
    "weakness": {
        "title": "Calculadora de Fraquezas (Gen 3)",
        "content": `
            <div style="text-align:center;">
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom: 15px;">Selecione os tipos do Pokémon para ver suas fraquezas e resistências. Baseado na Geração 3 (Sem Fada).</p>
                <div style="display:flex; gap:10px; justify-content:center; margin-bottom: 20px;">
                    <select id="calc-type-1" class="input-select" style="text-transform:capitalize;"></select>
                    <select id="calc-type-2" class="input-select" style="text-transform:capitalize;">
                        <option value="none">-- Nenhum (Tipo Único) --</option>
                    </select>
                </div>
                <div id="calc-result" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:10px; text-align:left;">
                    <!-- Preenchido via JS -->
                </div>
            </div>
        `
    },
    "natures": {
        "title": "Guia de Natures (Naturezas)",
        "content": `
            <div style="overflow-x: auto;">
                <table class="moves-table" style="width:100%; text-align:center; min-width:500px;">
                    <thead>
                        <tr><th>Nature</th><th>Aumenta (+10%)</th><th>Diminui (-10%)</th><th>Sabor Favorito (Pokécubo)</th><th>Sabor Detestado</th></tr>
                    </thead>
                    <tbody id="natures-table-body">
                        <!-- Injetado via JS -->
                        <tr><td colspan="5">Carregando...</td></tr>
                    </tbody>
                </table>
            </div>
        `
    },
    "berries": {
        "title": "Guia de Berries & Pokéblocks (Como evoluir Feebas)",
        "content": `
            <div style="text-align:left;">
                <p>O <strong>Feebas</strong> só evolui para <strong>Milotic</strong> quando seu nível de Beleza (Beauty) atinge o máximo (170) e depois ele sobe de nível. Para isso, você precisa alimentá-lo com Pokéblocks azuis feitos a partir de Berries específicas.</p>
                
                <h4 style="color:var(--type-water); margin-top:15px;">Melhores Berries para Beleza:</h4>
                <ul style="color:var(--text-muted); margin-left: 20px;">
                    <li><strong>Pamtre Berry</strong> (A melhor do jogo, mas muito rara. Obtida dizendo "CHALLENGE CONTEST" para a esposa do Berry Master).</li>
                    <li><strong>Cornn Berry</strong> (Excelente alternativa, fácil de conseguir).</li>
                    <li><strong>Kelpsy Berry</strong> (Boa, reduz Attack EVs).</li>
                    <li><strong>Hondew Berry</strong> (Boa, reduz Sp. Atk EVs).</li>
                    <li><strong>Chesto Berry</strong> / <strong>Oran Berry</strong> (Opções de baixo nível para o início do jogo, mas exigem bater os Pokéblocks perfeitamente para atingir 170).</li>
                </ul>

                <h4 style="color:var(--type-water); margin-top:15px;">Dicas de Nature:</h4>
                <p style="color:var(--text-muted);">As Natures do Pokémon afetam quais sabores eles gostam. Natures que <strong>gostam de sabor Seco (Dry)</strong> terão bônus enormes ao comer Pokéblocks azuis, facilitando muito a evolução:</p>
                <ul style="color:var(--text-muted); margin-left: 20px;">
                    <li><strong>Gostam (Recomendado):</strong> Modest, Mild, Rash, Quiet.</li>
                    <li><strong>Não Gostam (Evite):</strong> Adamant, Impish, Careful, Jolly.</li>
                </ul>
            </div>
        `
    },
    "stones": {
        "title": "Guia de Itens de Evolução",
        "content": `
            <div style="overflow-x: auto;">
                <table class="moves-table" style="width:100%; text-align:left; min-width:600px;">
                    <thead>
                        <tr><th>Item</th><th>Evoluções Chaves</th><th>Onde Encontrar (Hoenn)</th><th>Onde Encontrar (Kanto)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><strong>Fire Stone</strong></td><td>Vulpix, Growlithe, Eevee</td><td>Fiery Path</td><td>Celadon Dept. Store, Mt. Ember</td></tr>
                        <tr><td><strong>Water Stone</strong></td><td>Poliwhirl, Shellder, Staryu, Eevee, Lombre</td><td>Abandoned Ship</td><td>Celadon Dept. Store, Seafoam Islands</td></tr>
                        <tr><td><strong>Thunder Stone</strong></td><td>Pikachu, Eevee</td><td>New Mauville</td><td>Celadon Dept. Store, Power Plant</td></tr>
                        <tr><td><strong>Leaf Stone</strong></td><td>Gloom, Weepinbell, Exeggcute, Nuzleaf</td><td>Route 119</td><td>Celadon Dept. Store, Safari Zone</td></tr>
                        <tr><td><strong>Moon Stone</strong></td><td>Nidorina, Nidorino, Clefairy, Jigglypuff, Skitty</td><td>Meteor Falls</td><td>Mt. Moon, Celadon City</td></tr>
                        <tr><td><strong>Sun Stone</strong></td><td>Gloom, Sunkern</td><td>Mossdeep City</td><td>Ruin Valley, Segurado por Solrock selvagem</td></tr>
                        <tr><td><strong>Dragon Scale</strong></td><td>Seadra -> Kingdra</td><td>Segurado por Horsea/Bagon selvagens</td><td>Water Path</td></tr>
                        <tr><td><strong>Metal Coat</strong></td><td>Onix -> Steelix, Scyther -> Scizor</td><td>Segurado por Magnemite selvagens</td><td>Memorial Pillar</td></tr>
                    </tbody>
                </table>
            </div>
        `
    },
    "safari": {
        "title": "Guia da Safari Zone",
        "content": `
            <div style="text-align:left; color:var(--text-muted); font-size: 0.95rem;">
                <p>A Safari Zone é uma área especial onde você captura Pokémon utilizando <strong>Safari Balls</strong> em vez de batalhar. Abaixo você encontra os Pokémon exclusivos e os itens de cada zona.</p>
                
                <h3 style="color:var(--type-grass); margin-top: 25px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Hoenn (Emerald / Ruby & Sapphire)</h3>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table class="moves-table" style="width:100%; text-align:left; min-width:600px;">
                        <thead>
                            <tr><th>Zona / Requisito</th><th>Encontros Notáveis / Exclusivos</th><th>Itens no Chão</th></tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>Área 1 & 2 (Sul)</strong><br><small>Entrada principal</small></td><td>Oddish, Gloom, Doduo, Pikachu, Wobbuffet, Natu, Girafarig.</td><td>Max Potion</td></tr>
                            <tr><td><strong>Área 3 (Norte)</strong><br><small>Requer Acro Bike</small></td><td>Heracross, Phanpy, Xatu, Pinsir.</td><td>Calcium, TM22 (SolarBeam)</td></tr>
                            <tr><td><strong>Área 4 (Nordeste)</strong><br><small>Requer Mach Bike</small></td><td>Rhyhorn, Pinsir, Dodrio.</td><td>Zinc</td></tr>
                            <tr><td><strong>Expansão (Leste/Sudeste)</strong><br><small>Pós-Jogo (Apenas Emerald)</small></td><td><strong>Exclusivos de Johto:</strong> Mareep, Houndour, Aipom, Pineco, Shuckle, Gligar, Snubbull, Teddiursa, Smeargle, Miltank.</td><td>Big Pearl, Rare Candy, Nugget</td></tr>
                        </tbody>
                    </table>
                </div>

                <h3 style="color:var(--type-grass); margin-top: 35px; border-bottom: 1px solid var(--glass-border); padding-bottom: 5px;">Kanto (FireRed / LeafGreen)</h3>
                <div style="overflow-x: auto; margin-top: 15px;">
                    <table class="moves-table" style="width:100%; text-align:left; min-width:600px;">
                        <thead>
                            <tr><th>Zona / Área</th><th>Encontros Notáveis / Exclusivos</th><th>Itens no Chão</th></tr>
                        </thead>
                        <tbody>
                            <tr><td><strong>Center Area</strong><br><small>Entrada</small></td><td>Scyther (FR), Pinsir (LG), Chansey, Exeggcute, Rhyhorn, Dratini (Super Rod).</td><td>Nugget</td></tr>
                            <tr><td><strong>Area 1 (Leste)</strong></td><td>Kangaskhan, Scyther (FR), Pinsir (LG), Doduo, Dragonair.</td><td>Leaf Stone, TM11 (Sunny Day), Max Potion, Full Restore</td></tr>
                            <tr><td><strong>Area 2 (Norte)</strong></td><td>Tauros, Kangaskhan, Chansey, Venomoth.</td><td>Quick Claw, TM47 (Steel Wing), Protein, Calcium</td></tr>
                            <tr><td><strong>Area 3 (Oeste)</strong><br><small>Casa Secreta</small></td><td>Tauros, Kangaskhan, Venomoth, Doduo.</td><td>Gold Teeth, HM03 (Surf), Max Revive, Max Potion, Revive</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div style="background:var(--glass-bg); border:1px solid var(--glass-border); padding:15px; border-radius:12px; margin-top:25px;">
                    <h4 style="color:var(--primary-color); margin-bottom:5px;">💡 Dica de Captura</h4>
                    <p style="font-size:0.85rem; margin:0;">Jogar <strong>Pokéblocks/Bait</strong> (Isca) deixa o Pokémon menos propenso a fugir, mas mais difícil de capturar. Jogar <strong>Lama/Pedra</strong> torna o Pokémon mais fácil de capturar, mas mais propenso a fugir.</p>
                </div>
            </div>
        `

    },
    "sevii": {
        "title": "Guia das Sevii Islands (FRLG)",
        "content": `
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
        `
    }
};