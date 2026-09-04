# Hoenn & Kanto Wiki (Gen 3) 🌍

*[Read in English](#english-version-)*

Uma enciclopédia Pokémon focada na Terceira Geração dos jogos (Ruby, Sapphire, Emerald, FireRed e LeafGreen). 
O projeto consome dados diretamente da **PokéAPI** para exibir informações detalhadas, respeitando as mecânicas, tipos e status originais da época (incluindo a separação clássica de golpes Physical/Special e ausência do tipo Fada).

## Funcionalidades

- **Pokédex Completa (Gen 1 a 3):** Lista com os 386 Pokémon das três primeiras gerações.
- **Busca Rápida:** Pesquisa instantânea por nome ou número da Pokédex.
- **Informações Detalhadas:**
  - Status Base e Habilidades (com descrições traduzidas/adaptadas).
  - Vantagens e Fraquezas de tipos (tipagem clássica).
  - Cadeia evolutiva completa.
  - Locais onde encontrar o Pokémon nos jogos.
  - Tabela completa de Ataques (Moveset) separados por Nível, TM/HM, Cruzamento (Egg Moves) e Tutores de Movimentos (Emerald / FRLG).
- **Recursos Interativos:**
  - Alternância de Tema (Claro / Escuro).
  - Visualização da versão *Shiny* dos Pokémon.
  - Reprodução do *Cry* (som) clássico de cada Pokémon.
  - Favoritar Pokémon na Pokédex.

## Tecnologias Utilizadas

- **HTML5, CSS3, JavaScript (Módulos ES)** — sem dependências nem etapa de build
- **PokéAPI** — consumida em tempo de *build*, não em tempo de execução

## Estrutura

```
index.html          único HTML; carrega js/main.js como módulo
css/                style.css (tema e componentes) + layout.css (grid e responsivo)
js/
  main.js           ponto de entrada: compõe o objeto `app` e inicia
  core/             dataset, estado, armazenamento, rotas, idioma, tabela de tipos
  ui/               DOM, tema, layout, som
  views/            uma por seção (pokedex, pokemon, team, trainers, ...)
  widgets/          modal de treinamento e relógio de eventos
data/               dados estáticos (ver abaixo)
tools/              scripts de build (Python/Node), não vão para o site
sw.js               Service Worker (offline)
```

## Dados

O app **não chama a PokéAPI em tempo de execução**. Antes, abrir uma ficha
disparava ~135 requisições (uma por golpe, uma por habilidade, mais espécie,
evolução e locais). Hoje é **um arquivo de ~6 KB**.

```
data/pokedex.json        índice dos 386 (nome, tipos, stats)
data/pokemon/<id>.json   ficha completa, com evoluções e locais embutidos
data/moves.json          golpes da Gen 3
data/abilities.json      habilidades
data/i18n/{pt,en}.json   dicionários (só o idioma em uso é baixado)
data/*.json              ginásios, tutores, guias, itens, TMs, frontier, extras
```

Para regenerar o dataset a partir da PokéAPI:

```bash
python tools/build_data.py        # respostas ficam em cache fora do repo
python tools/update_sw_precache.py  # atualiza a lista do Service Worker
```

A tipagem gravada é a da **Geração 3**: Pokémon reclassificados como Fada
(Clefairy, Gardevoir, Mawile...) voltam ao tipo que tinham na época.

## Hospedagem (GitHub Pages)

Este projeto está hospedado e otimizado para o GitHub Pages.

## Licença

Este projeto é open-source. Os dados e imagens dos Pokémon são de propriedade da Nintendo / The Pokémon Company e são obtidos através da [PokéAPI](https://pokeapi.co/).

---

# English Version 🇬🇧

A Pokémon encyclopedia focused on the Third Generation of games (Ruby, Sapphire, Emerald, FireRed, and LeafGreen). 
The project consumes data directly from **PokéAPI** to display detailed information, respecting the original mechanics, types, and base stats of that era (including the classic Physical/Special move split and the absence of the Fairy type).

## Features

- **Full Pokédex (Gen 1 to 3):** List containing the 386 Pokémon from the first three generations.
- **Quick Search:** Instant search by Pokémon name or Pokédex number.
- **Detailed Information:**
  - Base Stats and Abilities (with adapted/translated descriptions).
  - Type Advantages and Weaknesses (classic typing).
  - Complete evolution chain.
  - Locations on where to find the Pokémon in-game.
  - Complete Move list (Moveset) categorized by Level Up, TM/HM, Breeding (Egg Moves), and Move Tutors (Emerald / FRLG).
- **Interactive Features:**
  - Theme Toggle (Light / Dark Mode).
  - *Shiny* Pokémon sprite viewer.
  - Classic *Cry* (sound) playback for each Pokémon.
  - Favorite Pokémon feature on the Pokédex.

## Technologies Used

- **HTML5, CSS3, JavaScript (ES6)**
- **PokéAPI** (REST API)

## Hosting (GitHub Pages)

This project is hosted and optimized for GitHub Pages.

## License

This project is open-source. Pokémon data and images belong to Nintendo / The Pokémon Company and are fetched via [PokéAPI](https://pokeapi.co/).

## Editor local

Para editar cards, times e textos sem alterar os arquivos manualmente, abra **Iniciar editor.cmd** (Python 3.10+). O editor 2.2 oferece modo claro/escuro, importação de imagens, criação de páginas e modelos, edição de textos da interface e correções persistentes da Pokédex. Inclui prévia, comparação antes de salvar, avisos de rascunhos não salvos e histórico para restaurar backups pelo próprio editor. Inclui também um painel do Git e uma biblioteca que identifica referências das imagens nos arquivos e rascunhos. A publicação continua pelo GitHub Desktop/Git.

Consulte o [guia do editor local](docs/EDITOR-LOCAL.md).

## Preparação para Android

Os 386 cries estão em `audio/cries/`, com reprodução local prioritária. O script `python -B tools/build_android_web.py` prepara `dist/android-web` para o futuro empacotamento Android. Essa pasta não é um APK. Consulte os testes, limites offline e próximas etapas no [guia Android](docs/ANDROID.md).
