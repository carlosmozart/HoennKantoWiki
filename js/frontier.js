// Dados estáticos da Battle Frontier (Emerald)
window.FRONTIER_DATA = {
    overview: {
        title: "Battle Frontier",
        desc: "A Battle Frontier é um gigantesco parque de batalhas introduzido em Pokémon Emerald. Após vencer a Elite 4, você recebe o S.S. Ticket para viajar até esta ilha dedicada inteiramente a testar as habilidades dos Treinadores. Ela conta com 7 instalações únicas, cada uma com regras específicas. Ao vencer consecutivamente, você ganha Battle Points (BP) que podem ser trocados por prêmios, e eventualmente enfrenta os temíveis líderes locais: os Frontier Brains.",
        image: "https://www.serebii.net/emerald/frontier.jpg"
    },
    facilities: [
        {
            name: "Battle Tower",
            ptName: "Torre de Batalha",
            desc: "Batalhas tradicionais de 3v3 (Singles) ou 4v4 (Doubles). Teste suas habilidades sem nenhuma regra maluca. O verdadeiro teste clássico de força.",
            brain: "Anabel",
            brainTitle: "Salon Maiden",
            brainSprite: "img/trainers/Emerald_Anabel.png",
            symbol: "Ability Symbol (Símbolo da Habilidade)",
            silverReq: "35 vitórias seguidas",
            silverTeam: [
                { id: 65, level: 50, name: "Alakazam", types: ["psychic"], item: "Brightpowder", ability: "Synchronize", moves: ["Thunderpunch", "Fire Punch", "Ice Punch", "Disable"] },
                { id: 244, level: 50, name: "Entei", types: ["fire"], item: "Lum Berry", ability: "Pressure", moves: ["Fire Blast", "Calm Mind", "Return", "Roar"] },
                { id: 143, level: 50, name: "Snorlax", types: ["normal"], item: "Quick Claw", ability: "Immunity", moves: ["Body Slam", "Belly Drum", "Yawn", "Shadow Ball"] }
            ],
            goldReq: "70 vitórias seguidas",
            goldTeam: [
                { id: 243, level: 50, name: "Raikou", types: ["electric"], item: "Lum Berry", ability: "Pressure", moves: ["Thunderbolt", "Calm Mind", "Reflect", "Rest"] },
                { id: 143, level: 50, name: "Snorlax", types: ["normal"], item: "Chesto Berry", ability: "Immunity", moves: ["Curse", "Return", "Rest", "Shadow Ball"] },
                { id: 381, level: 50, name: "Latios", types: ["dragon", "psychic"], item: "Brightpowder", ability: "Levitate", moves: ["Psychic", "Calm Mind", "Recover", "Dragon Claw"] }
            ]
        },
        {
            name: "Battle Dome",
            ptName: "Cúpula de Batalha",
            desc: "Formato de torneio com chaves eliminatórias. Você vê a equipe de 3 Pokémon do oponente antes da luta e deve escolher estrategicamente apenas 2 para a batalha.",
            brain: "Tucker",
            brainTitle: "Dome Ace",
            brainSprite: "img/trainers/Emerald_Tucker.png",
            symbol: "Tactics Symbol (Símbolo da Tática)",
            silverReq: "5 torneios ganhos (vitória final no 5º)",
            silverTeam: [
                { id: 260, level: 50, name: "Swampert", types: ["water", "ground"], item: "Focus Band", ability: "Torrent", moves: ["Surf", "Earthquake", "Ice Beam", "Counter"] },
                { id: 373, level: 50, name: "Salamence", types: ["dragon", "flying"], item: "Lum Berry", ability: "Intimidate", moves: ["Earthquake", "Brick Break", "Dragon Claw", "Aerial Ace"] },
                { id: 6, level: 50, name: "Charizard", types: ["fire", "flying"], item: "White Herb", ability: "Blaze", moves: ["Overheat", "Rock Slide", "Aerial Ace", "Earthquake"] }
            ],
            goldReq: "10 torneios ganhos (vitória final no 10º)",
            goldTeam: [
                { id: 260, level: 50, name: "Swampert", types: ["water", "ground"], item: "Leftovers", ability: "Torrent", moves: ["Surf", "Earthquake", "Ice Beam", "Mirror Coat"] },
                { id: 380, level: 50, name: "Latias", types: ["dragon", "psychic"], item: "Chesto Berry", ability: "Levitate", moves: ["Thunderbolt", "Psychic", "Calm Mind", "Rest"] },
                { id: 376, level: 50, name: "Metagross", types: ["steel", "psychic"], item: "Quick Claw", ability: "Clear Body", moves: ["Psychic", "Meteor Mash", "Earthquake", "Protect"] }
            ]
        },
        {
            name: "Battle Factory",
            ptName: "Fábrica de Batalha",
            desc: "Você não usa seus próprios Pokémon. Alugue uma equipe de 3 e, a cada vitória, você pode trocar um de seus Pokémon por um do oponente derrotado. Um teste de conhecimento e adaptabilidade.",
            brain: "Noland",
            brainTitle: "Factory Head",
            brainSprite: "img/trainers/Emerald_Noland.png",
            symbol: "Knowledge Symbol (Símbolo do Conhecimento)",
            silverReq: "21 vitórias seguidas",
            silverTeam: [], // Random
            goldReq: "42 vitórias seguidas",
            goldTeam: [] // Random
        },
        {
            name: "Battle Arena",
            ptName: "Arena de Batalha",
            desc: "Cada batalha dura no máximo 3 turnos. Se nenhum Pokémon desmaiar, um juiz decide o vencedor com base em Mind (Ataques Ofensivos), Skill (Precisão) e Body (HP restante).",
            brain: "Greta",
            brainTitle: "Arena Tycoon",
            brainSprite: "img/trainers/Emerald_Greta.png",
            symbol: "Guts Symbol (Símbolo da Garra)",
            silverReq: "27 vitórias seguidas",
            silverTeam: [
                { id: 214, level: 50, name: "Heracross", types: ["bug", "fighting"], item: "Salac Berry", ability: "Swarm", moves: ["Megahorn", "Rock Tomb", "Endure", "Reversal"] },
                { id: 197, level: 50, name: "Umbreon", types: ["dark"], item: "Leftovers", ability: "Synchronize", moves: ["Body Slam", "Confuse Ray", "Psychic", "Faint Attack"] },
                { id: 292, level: 50, name: "Shedinja", types: ["bug", "ghost"], item: "Brightpowder", ability: "Wonder Guard", moves: ["Shadow Ball", "Aerial Ace", "Confuse Ray", "Return"] }
            ],
            goldReq: "56 vitórias seguidas",
            goldTeam: [
                { id: 197, level: 50, name: "Umbreon", types: ["dark"], item: "Chesto Berry", ability: "Synchronize", moves: ["Double-Edge", "Confuse Ray", "Rest", "Psychic"] },
                { id: 94, level: 50, name: "Gengar", types: ["ghost", "poison"], item: "Leftovers", ability: "Levitate", moves: ["Psychic", "Hypnosis", "Dream Eater", "Destiny Bond"] },
                { id: 286, level: 50, name: "Breloom", types: ["grass", "fighting"], item: "Lum Berry", ability: "Effect Spore", moves: ["Spore", "Focus Punch", "Giga Drain", "Headbutt"] }
            ]
        },
        {
            name: "Battle Palace",
            ptName: "Palácio de Batalha",
            desc: "Você não pode dar ordens aos seus Pokémon. Eles batalham por conta própria, baseando-se inteiramente na Natureza (Nature) de cada um para escolherem seus ataques.",
            brain: "Spenser",
            brainTitle: "Palace Maven",
            brainSprite: "img/trainers/Emerald_Spenser.png",
            symbol: "Spirits Symbol (Símbolo do Espírito)",
            silverReq: "21 vitórias seguidas",
            silverTeam: [
                { id: 169, level: 50, name: "Crobat", types: ["poison", "flying"], item: "Brightpowder", ability: "Inner Focus", moves: ["Fly", "Confuse Ray", "Double Team", "Toxic"] },
                { id: 289, level: 50, name: "Slaking", types: ["normal"], item: "Scope Lens", ability: "Truant", moves: ["Earthquake", "Swagger", "Shadow Ball", "Brick Break"] },
                { id: 131, level: 50, name: "Lapras", types: ["water", "ice"], item: "Quick Claw", ability: "Water Absorb", moves: ["Ice Beam", "Horn Drill", "Confuse Ray", "Surf"] }
            ],
            goldReq: "42 vitórias seguidas",
            goldTeam: [
                { id: 59, level: 50, name: "Arcanine", types: ["fire"], item: "White Herb", ability: "Intimidate", moves: ["Overheat", "ExtremeSpeed", "Roar", "Protect"] },
                { id: 289, level: 50, name: "Slaking", types: ["normal"], item: "Scope Lens", ability: "Truant", moves: ["Hyper Beam", "Earthquake", "Shadow Ball", "Yawn"] },
                { id: 245, level: 50, name: "Suicune", types: ["water"], item: "King's Rock", ability: "Pressure", moves: ["Surf", "Blizzard", "Bite", "Calm Mind"] }
            ]
        },
        {
            name: "Battle Pike",
            ptName: "Pique de Batalha",
            desc: "Desafio de sorte (e azar). Você deve escolher entre 3 caminhos em cada sala na forma de um tubo gigante. Você pode encontrar batalhas difíceis, curas completas, alterações de status ou NPCs amigáveis.",
            brain: "Lucy",
            brainTitle: "Pike Queen",
            brainSprite: "img/trainers/Emerald_Lucy.png",
            symbol: "Luck Symbol (Símbolo da Sorte)",
            silverReq: "2 rodadas completas (28 salas)",
            silverTeam: [
                { id: 336, level: 50, name: "Seviper", types: ["poison"], item: "Quick Claw", ability: "Shed Skin", moves: ["Poison Fang", "Giga Drain", "Crunch", "Swagger"] },
                { id: 213, level: 50, name: "Shuckle", types: ["bug", "rock"], item: "Chesto Berry", ability: "Sturdy", moves: ["Toxic", "Sandstorm", "Protect", "Rest"] },
                { id: 350, level: 50, name: "Milotic", types: ["water"], item: "Leftovers", ability: "Marvel Scale", moves: ["Surf", "Ice Beam", "Mirror Coat", "Recover"] }
            ],
            goldReq: "10 rodadas completas (140 salas)",
            goldTeam: [
                { id: 336, level: 50, name: "Seviper", types: ["poison"], item: "Focus Band", ability: "Shed Skin", moves: ["Sludge Bomb", "Earthquake", "Giga Drain", "Swagger"] },
                { id: 208, level: 50, name: "Steelix", types: ["steel", "ground"], item: "Brightpowder", ability: "Rock Head", moves: ["Earthquake", "Rock Slide", "Explosion", "Screech"] },
                { id: 130, level: 50, name: "Gyarados", types: ["water", "flying"], item: "Chesto Berry", ability: "Intimidate", moves: ["Dragon Dance", "Return", "Roar", "Rest"] }
            ]
        },
        {
            name: "Battle Pyramid",
            ptName: "Pirâmide de Batalha",
            desc: "Um calabouço (dungeon). Você entra sem itens de cura na mochila e com a visão limitada. O objetivo é achar a saída em cada andar escuro enquanto encontra itens, luta contra treinadores e sobrevive a Pokémon selvagens.",
            brain: "Brandon",
            brainTitle: "Pyramid King",
            brainSprite: "img/trainers/Emerald_Brandon.png",
            symbol: "Brave Symbol (Símbolo da Bravura)",
            silverReq: "21 andares completos (3 rodadas)",
            silverTeam: [
                { id: 377, level: 50, name: "Regirock", types: ["rock"], item: "Quick Claw", ability: "Clear Body", moves: ["Explosion", "Superpower", "Earthquake", "AncientPower"] },
                { id: 379, level: 50, name: "Registeel", types: ["steel"], item: "Leftovers", ability: "Clear Body", moves: ["Earthquake", "Metal Claw", "Toxic", "Iron Defense"] },
                { id: 378, level: 50, name: "Regice", types: ["ice"], item: "Chesto Berry", ability: "Clear Body", moves: ["Ice Beam", "Amnesia", "Thunder", "Rest"] }
            ],
            goldReq: "70 andares completos (10 rodadas)",
            goldTeam: [
                { id: 144, level: 50, name: "Articuno", types: ["ice", "flying"], item: "Scope Lens", ability: "Pressure", moves: ["Blizzard", "Water Pulse", "Aerial Ace", "Reflect"] },
                { id: 145, level: 50, name: "Zapdos", types: ["electric", "flying"], item: "Lum Berry", ability: "Pressure", moves: ["Thunder", "Detect", "Drill Peck", "Light Screen"] },
                { id: 146, level: 50, name: "Moltres", types: ["fire", "flying"], item: "Brightpowder", ability: "Pressure", moves: ["Fire Blast", "Hyper Beam", "Aerial Ace", "Safeguard"] }
            ]
        }
    ],
    shops: [
        {
            title: "Exchange Service Corner (Kiosk da Esquerda)",
            desc: "Vende grandes bonecos de pelúcia para a Base Secreta (Secret Base).",
            items: [
                { name: "Lapras Doll", cost: "256 BP" },
                { name: "Snorlax Doll", cost: "256 BP" },
                { name: "Venusaur Doll", cost: "256 BP" },
                { name: "Charizard Doll", cost: "256 BP" },
                { name: "Blastoise Doll", cost: "256 BP" }
            ]
        },
        {
            title: "Exchange Service Corner (Kiosk da Direita)",
            desc: "Vende itens competitivos, vitaminas e decorações menores.",
            items: [
                { name: "Protein / Iron / Calcium / Zinc / Carbos / HP Up", cost: "1 BP" },
                { name: "Leftovers", cost: "48 BP" },
                { name: "White Herb", cost: "48 BP" },
                { name: "Mental Herb", cost: "48 BP" },
                { name: "Quick Claw", cost: "48 BP" },
                { name: "Choice Band", cost: "64 BP" },
                { name: "King's Rock", cost: "64 BP" },
                { name: "Focus Band", cost: "64 BP" },
                { name: "Scope Lens", cost: "64 BP" },
                { name: "Brightpowder", cost: "64 BP" }
            ]
        }
    ],
    tutors: [
        {
            title: "Move Tutors (Oeste da Battle Dome)",
            desc: "Duas senhoras ensinam golpes poderosos em troca de Battle Points.",
            items: [
                { name: "Defense Curl", cost: "16 BP" },
                { name: "Snore", cost: "16 BP" },
                { name: "Mud-Slap", cost: "16 BP" },
                { name: "Swift", cost: "16 BP" },
                { name: "Icy Wind", cost: "24 BP" },
                { name: "Endure", cost: "24 BP" },
                { name: "Psych Up", cost: "24 BP" },
                { name: "Ice Punch", cost: "24 BP" },
                { name: "Thunderpunch", cost: "24 BP" },
                { name: "Fire Punch", cost: "24 BP" },
                { name: "Swords Dance", cost: "48 BP" },
                { name: "Body Slam", cost: "48 BP" },
                { name: "Thunder Wave", cost: "48 BP" },
                { name: "Substitute", cost: "48 BP" },
                { name: "Dream Eater", cost: "48 BP" },
                { name: "Rock Slide", cost: "48 BP" },
                { name: "Softboiled", cost: "48 BP" },
                { name: "Seismic Toss", cost: "48 BP" }
            ]
        }
    ],
    special_pokemon: [
        {
            name: "Sudowoodo",
            desc: "Interaja com a estranha árvore balançando na área sudeste do parque e use o item Wailmer Pail (Regador). O Sudowoodo (Lv. 40) te atacará. Só existe um no jogo!",
            id: 185
        },
        {
            name: "Smeargle",
            desc: "Na Artisan Cave (Caverna do Artesão), localizada na área sudeste após surfar perto da árvore do Sudowoodo, você encontrará Smeargles selvagens (Lv. 40-50). É o único local para pegá-los em Emerald.",
            id: 235
        },
        {
            name: "Meowth",
            desc: "Em uma das casas da Battle Frontier, você pode trocar uma Skitty por um Meowth. Única forma de conseguir Meowth nativamente em Emerald.",
            id: 52
        }
    ]
};

// Gerenciador de Abas da Battle Frontier
document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.frontier-main-tab');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFrontierTab(btn.dataset.tab);
        });
    });
});

window.renderFrontier = function() {
    // Renderiza a aba ativa inicialmente
    const activeBtn = document.querySelector('.frontier-main-tab.active') || document.querySelector('.frontier-main-tab');
    if (activeBtn) {
        renderFrontierTab(activeBtn.dataset.tab);
    }
};

function renderFrontierTab(tabName) {
    const grid = document.getElementById('frontier-grid');
    if (!grid) return;

    // Reset grid
    grid.innerHTML = '';
    
    // Forçamos o layout do grid para ter 1 coluna e se espalhar inteiro para itens longos
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '20px';

    let html = '';

    if (tabName === 'overview') {
        html += `
            <div class="grid-card bento-item" style="padding: 30px; text-align: center;">
                <h3 style="color:var(--type-electric); margin-bottom:20px; font-size:2rem;">${window.FRONTIER_DATA.overview.title}</h3>
                <img src="${window.FRONTIER_DATA.overview.image}" style="width:100%; max-width:900px; height:auto; margin-bottom: 30px; border-radius:15px; box-shadow:0 8px 24px rgba(0,0,0,0.6);" alt="Battle Frontier">
                <p style="text-align:justify; color:var(--text-color); line-height:1.8; font-size:1.2rem; max-width: 900px; margin: 0 auto;">${window.FRONTIER_DATA.overview.desc}</p>
            </div>
        `;
    } 
    else if (tabName === 'facilities') {
        window.FRONTIER_DATA.facilities.forEach(fac => {
            let silverHtml = fac.silverTeam.length === 0 ? '<p style="color:var(--text-muted);font-style:italic;text-align:center;margin-top:10px;">Pokémon Alugados (Rental)</p>' : '';
            let goldHtml = fac.goldTeam.length === 0 ? '<p style="color:var(--text-muted);font-style:italic;text-align:center;margin-top:10px;">Pokémon Alugados (Rental)</p>' : '';

            // Renderizando Cards Detalhados dos Pokémon
            const renderPokeCard = (p) => {
                let typesHtml = p.types.map(t => {
                    let ptName = typeof TYPE_TRANSLATIONS !== 'undefined' ? (TYPE_TRANSLATIONS[t] || t) : t;
                    return `<span class="pokemon-type-badge badge-${t}" style="display:inline-block; font-size:0.65rem; padding: 3px 6px; margin: 2px;">${ptName.toUpperCase()}</span>`;
                }).join('');
                let movesHtml = p.moves.map(m => `<span style="display:inline-block; background:rgba(0,0,0,0.2); padding:2px 6px; border-radius:4px; font-size:0.75rem; margin:2px;">${m}</span>`).join('');
                
                return `
                    <div onclick="playClickSound(); window.location.hash='pokemon/${p.id}'" style="cursor:pointer; display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.03); border-radius:10px; padding:10px; box-shadow:0 2px 6px rgba(0,0,0,0.4); margin-bottom:10px; transition: transform 0.2s, background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='scale(1.02)';" onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.transform='scale(1)';">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png" style="width:80px;height:80px; filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.5));" title="${p.name}">
                        <strong style="font-size:1.1rem; margin-bottom:5px;">${p.name}</strong>
                        <div style="margin-bottom:5px;">${typesHtml}</div>
                        <div style="font-size:0.8rem; color:var(--text-color); margin-bottom:5px;">Nv. ${p.level}</div>
                        <div style="font-size:0.8rem; background:rgba(0,0,0,0.2); padding: 4px 8px; border-radius:6px; width:100%; text-align:left; margin-bottom:5px;">
                            <div style="margin-bottom:2px;">🛡️ <strong>Item:</strong> <span style="color:var(--type-electric);">${p.item}</span></div>
                            <div>✨ <strong>Hab:</strong> ${p.ability}</div>
                        </div>
                        <div style="width:100%; text-align:center; margin-top:5px;">
                            ${movesHtml}
                        </div>
                    </div>
                `;
            };

            if (fac.silverTeam.length > 0) {
                silverHtml = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-top:15px;">`;
                fac.silverTeam.forEach(p => {
                    silverHtml += renderPokeCard(p);
                });
                silverHtml += `</div>`;
            }

            if (fac.goldTeam.length > 0) {
                goldHtml = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-top:15px;">`;
                fac.goldTeam.forEach(p => {
                    goldHtml += renderPokeCard(p);
                });
                goldHtml += `</div>`;
            }

            html += `
                <div class="grid-card bento-item" style="padding: 30px;">
                    <div style="display:flex; flex-wrap:wrap; gap:40px; align-items:center;">
                        
                        <div style="text-align:center; min-width: 250px; flex: 1;">
                            <img src="${fac.brainSprite}" alt="${fac.brain}" style="height: 220px; object-fit: contain; filter: drop-shadow(4px 6px 8px rgba(0,0,0,0.5)); margin-bottom:20px;">
                            <h4 style="color:var(--type-fire); margin:0; font-size:1.3rem; text-transform:uppercase; letter-spacing:1px;">${fac.brainTitle}</h4>
                            <h3 style="margin:5px 0 0 0; font-size:2rem; font-weight:800;">${fac.brain}</h3>
                            
                            <div style="background:var(--stat-bar-bg); padding:12px; border-radius:10px; margin-top:20px; text-align:center; font-size:1.1rem;">
                                <strong>Símbolo (Badge):</strong> <span style="color:#FFF;">${fac.symbol}</span>
                            </div>
                        </div>
                        
                        <div style="flex:2; min-width: 300px;">
                            <h3 style="color:var(--type-electric); margin-bottom:10px; font-size:1.5rem;">${fac.name} <span style="font-size:1.1rem; color:var(--text-muted);">(${fac.ptName})</span></h3>
                            <p style="text-align:justify; font-size:1.05rem; line-height:1.7; margin-bottom:20px; color:var(--text-color);">${fac.desc}</p>
                            
                            <div style="display:flex; flex-direction:column; gap:20px;">
                                <div style="background:rgba(192,192,192,0.1); border:1px solid #C0C0C0; border-radius:12px; padding:20px; width:100%;">
                                    <div style="text-align:center;">
                                        <strong style="color:#C0C0C0; font-size:1.2rem; text-transform:uppercase;">🥈 Desafio de Prata</strong><br>
                                        <span style="font-size:0.95rem; color:var(--text-muted); display:inline-block; margin-top:5px;">${fac.silverReq}</span>
                                    </div>
                                    ${silverHtml}
                                </div>
                                <div style="background:rgba(255,215,0,0.1); border:1px solid #FFD700; border-radius:12px; padding:20px; width:100%;">
                                    <div style="text-align:center;">
                                        <strong style="color:#FFD700; font-size:1.2rem; text-transform:uppercase;">🥇 Desafio de Ouro</strong><br>
                                        <span style="font-size:0.95rem; color:var(--text-muted); display:inline-block; margin-top:5px;">${fac.goldReq}</span>
                                    </div>
                                    ${goldHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    else if (tabName === 'shops') {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px;">`;
        [...window.FRONTIER_DATA.shops, ...window.FRONTIER_DATA.tutors].forEach(shop => {
            let itemsHtml = shop.items.map(i => `
                <tr style="border-bottom: 1px solid var(--glass-border); transition: 0.2s; cursor:default;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                    <td style="padding:12px; font-weight:600; font-size:1.05rem;">${i.name}</td>
                    <td style="padding:12px; text-align:right; color:var(--type-electric); font-weight:bold; font-size:1.05rem;">${i.cost}</td>
                </tr>
            `).join('');

            html += `
                <div class="grid-card bento-item" style="padding: 25px;">
                    <h3 style="color:var(--type-electric); margin-bottom:10px; font-size:1.3rem;">${shop.title}</h3>
                    <p style="text-align:justify; font-size:1rem; color:var(--text-muted); margin-bottom:20px; line-height:1.5;">${shop.desc}</p>
                    <table style="width:100%; border-collapse:collapse;">
                        ${itemsHtml}
                    </table>
                </div>
            `;
        });
        html += `</div>`;
    }
    else if (tabName === 'pokemon') {
        window.FRONTIER_DATA.special_pokemon.forEach(sp => {
            html += `
                <div class="grid-card bento-item" style="padding: 25px; display:flex; align-items:flex-start; gap:25px; flex-wrap:wrap;">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${sp.id}.png" style="width:100px; height:100px; background:var(--stat-bar-bg); border-radius:15px; box-shadow:0 4px 10px rgba(0,0,0,0.3);" alt="${sp.name}">
                    <div style="flex:1; min-width: 250px;">
                        <h3 style="margin-bottom:10px; font-size:1.5rem; color:var(--text-color);">${sp.name}</h3>
                        <p style="text-align:left; font-size:1.05rem; color:var(--text-muted); line-height:1.7;">${sp.desc}</p>
                    </div>
                </div>
            `;
        });
    }

    grid.innerHTML = html;
    grid.style.animation = 'none';
    grid.offsetHeight; /* trigger reflow */
    grid.style.animation = 'fadeIn 0.4s ease';
}
