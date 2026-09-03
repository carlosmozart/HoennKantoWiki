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
    },
    "ev": {
        "title": "Melhores Locais para Treinar EVs (Gen 3)",
        "content": `
            <div style="text-align:left;">
                <p style="color:var(--text-muted); font-size:0.9rem;">Para treinar Effort Values de forma eficiente, derrote repetidamente os Pokémon listados abaixo segurando o <strong>Macho Brace</strong> (dobra os EVs ganhos em batalha).</p>
                
                <h3 style="color:var(--type-fire); margin-top:20px; border-bottom: 1px solid var(--glass-border);">Em Hoenn (Ruby / Sapphire / Emerald)</h3>
                <table class="moves-table" style="width:100%; text-align:left; font-size:0.9rem;">
                    <thead><tr><th>Atributo</th><th>Local</th><th>Pokémon Alvo (EVs ganhos)</th></tr></thead>
                    <tbody>
                        <tr><td><strong style="color:var(--type-grass);">HP</strong></td><td>Route 114 (Surf) / Rusturf Tunnel</td><td>Marill (2), Whismur (1)</td></tr>
                        <tr><td><strong style="color:var(--type-fighting);">Attack</strong></td><td>Mt. Pyre (1º andar)</td><td>Shuppet (1)</td></tr>
                        <tr><td><strong style="color:var(--type-rock);">Defense</strong></td><td>Magma Hideout / Route 111 (Deserto)</td><td>Torkoal (2), Geodude (1), Sandshrew (1)</td></tr>
                        <tr><td><strong style="color:var(--type-psychic);">Sp. Atk</strong></td><td>Route 113 (Cinzas)</td><td>Spinda (1), Slugma (1)</td></tr>
                        <tr><td><strong style="color:var(--type-bug);">Sp. Def</strong></td><td>Abandoned Ship (Surf)</td><td>Tentacool (1)</td></tr>
                        <tr><td><strong style="color:var(--type-electric);">Speed</strong></td><td>Route 104 / Altering Cave</td><td>Zigzagoon (1), Taillow (1), Zubat (1)</td></tr>
                    </tbody>
                </table>

                <h3 style="color:var(--type-fire); margin-top:20px; border-bottom: 1px solid var(--glass-border);">Em Kanto (FireRed / LeafGreen)</h3>
                <table class="moves-table" style="width:100%; text-align:left; font-size:0.9rem;">
                    <thead><tr><th>Atributo</th><th>Local</th><th>Pokémon Alvo (EVs ganhos)</th></tr></thead>
                    <tbody>
                        <tr><td><strong style="color:var(--type-grass);">HP</strong></td><td>Three Island (Port / Cape Brink - Surf)</td><td>Slowpoke (1), Dunsparce (1)</td></tr>
                        <tr><td><strong style="color:var(--type-fighting);">Attack</strong></td><td>Mt. Moon (B1F) / Route 1</td><td>Paras (1), Mankey (1)</td></tr>
                        <tr><td><strong style="color:var(--type-rock);">Defense</strong></td><td>Route 21 (Mato) / Mt. Moon</td><td>Tangela (1), Geodude (1)</td></tr>
                        <tr><td><strong style="color:var(--type-psychic);">Sp. Atk</strong></td><td>Pokémon Tower (Andares altos)</td><td>Gastly (1), Haunter (2)</td></tr>
                        <tr><td><strong style="color:var(--type-bug);">Sp. Def</strong></td><td>Kindle Road (Surf)</td><td>Tentacool (1), Tentacruel (2)</td></tr>
                        <tr><td><strong style="color:var(--type-electric);">Speed</strong></td><td>Diglett's Cave</td><td>Diglett (1), Dugtrio (2)</td></tr>
                    </tbody>
                </table>
            </div>
        `
    },
    "frontier": {
        "title": "O Mega Guia do Battle Frontier (Emerald)",
        "content": `
            <div style="text-align:left;">
                <p style="color:var(--text-muted); font-size:0.9rem;">O Battle Frontier é o desafio supremo de Pokémon Emerald. Reúne 7 instalações de batalha, cada uma com regras únicas. Vença rodadas suficientes para enfrentar o Frontier Brain (Líder).</p>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-normal);">Battle Tower</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Batalhas tradicionais sem regalias. Teste de habilidade pura.</p>
                        <small style="color:var(--primary-color);">Brain: Salon Maiden Anabel (Rodada 35 e 70)</small>
                    </div>
                    
                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-water);">Battle Factory</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Lute usando Pokémon alugados! Troque de Pokémon com os perdedores.</p>
                        <small style="color:var(--primary-color);">Brain: Factory Head Noland (Rodada 21 e 42)</small>
                    </div>

                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-fighting);">Battle Arena</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Batalhas de 3 turnos. Se não nocautear, juízes decidem por Mind, Skill e Body.</p>
                        <small style="color:var(--primary-color);">Brain: Arena Tycoon Greta (Rodada 28 e 56)</small>
                    </div>

                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-fire);">Battle Dome</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Torneio estilo chaveamento de 16 treinadores. Mostra o time inimigo antes!</p>
                        <small style="color:var(--primary-color);">Brain: Dome Ace Tucker (Torneio 5 e 10)</small>
                    </div>

                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-poison);">Battle Pike</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Escolha entre 3 portas: cure seu time, enfrente status negativo ou lute contra treinadores.</p>
                        <small style="color:var(--primary-color);">Brain: Pike Queen Lucy (Sala 28 e 140)</small>
                    </div>

                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-grass);">Battle Palace</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Os Pokémon atacam sozinhos baseados na sua Nature!</p>
                        <small style="color:var(--primary-color);">Brain: Palace Maven Spenser (Rodada 21 e 42)</small>
                    </div>

                    <div style="background:rgba(0,0,0,0.3); padding:15px; border-radius:10px; border:1px solid var(--glass-border);">
                        <h4 style="margin:0 0 5px 0; color:var(--type-rock);">Battle Pyramid</h4>
                        <p style="font-size:0.8rem; margin:0; color:var(--text-muted);">Navegue na escuridão sem seus itens regulares, recolhendo itens do chão pelo labirinto.</p>
                        <small style="color:var(--primary-color);">Brain: Pyramid King Brandon (Andar 21 e 70)</small>
                    </div>
                </div>
            </div>
        `
    },
    "bases": {
        "title": "Guia de Bases Secretas (Hoenn)",
        "content": `
            <div style="text-align:left;">
                <p style="color:var(--text-muted); font-size:0.9rem;">As Secret Bases são uma das mecânicas mais amadas de RSE. Use <strong>Secret Power</strong> em árvores grandes, buracos na parede ou moitas para cavar sua base. Abaixo as mais populares:</p>
                
                <h4 style="color:var(--type-ground); margin-top:15px;">Route 119 (As bases perfeitas)</h4>
                <p style="font-size:0.85rem; margin:0;">Essa rota tem 6 moitas perto da cachoeira que só podem ser acessadas com Acro Bike + Surf. O formato interno da maioria delas é de um quadrado duplo limpo, perfeito para decorar sem buracos.</p>

                <h4 style="color:var(--type-ground); margin-top:15px;">Route 111 (Deserto)</h4>
                <p style="font-size:0.85rem; margin:0;">Na subida antes de chegar perto de Fiery Path, existe uma árvore enorme solitária (Tree Base). Uma das bases mais compridas do jogo (estilo corredor com sala no fundo).</p>

                <h4 style="color:var(--type-ground); margin-top:15px;">Route 120 e 121</h4>
                <p style="font-size:0.85rem; margin:0;">Muitas bases em buracos de cavernas. Cuidado: várias possuem buracos grandes no meio da base, obrigando você a comprar <em>Solid Boards</em> (Tábuas) no mercado de Lilycove (apenas nos dias de Liquidação) para transitar entre os cômodos!</p>
                
                <div style="background:rgba(255, 204, 0, 0.1); border-left: 4px solid #f39c12; padding:10px; margin-top:20px; font-size:0.85rem;">
                    <strong>Dica:</strong> Se você misturar os registros da sua fita (Record Mixing), os locais das bases dos seus amigos aparecerão no seu mundo, permitindo que você batalhe contra o time que eles tinham no momento da mistura diariamente!
                </div>
            </div>
        `
    }
};