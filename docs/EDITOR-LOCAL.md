# Editor local · WikiGen3 2.1

O editor roda no seu computador. Requer **Python 3.10 ou superior**, sem instalar pacotes, banco de dados ou ferramentas de desenvolvimento adicionais. O site continua sendo publicado como arquivos estáticos no GitHub Pages.

## Abrir e escolher o tema

Dê dois cliques em **Iniciar editor.cmd**, na raiz do projeto. Mantenha o terminal aberto enquanto edita. Pelo terminal:

~~~powershell
python tools/local_editor.py --open
~~~

O botão **Modo escuro / Modo claro**, no cabeçalho, muda o tema do editor. A escolha fica salva neste navegador. Na primeira visita, acompanha a preferência do sistema. O tema da prévia do site é independente.

Para encerrar o servidor, use **Ctrl+C**. Após atualizar o código pelo Git, encerre o servidor antigo e abra o atalho novamente. Se a porta estiver ocupada, use:

~~~powershell
python tools/local_editor.py --open --port 8766
~~~

O serviço aceita conexões apenas em **127.0.0.1** e usa uma sessão local. Abra o endereço completo exibido pelo terminal.

## Fluxo de edição

1. Escolha o conteúdo e a seção/versão do jogo na biblioteca.
2. Edite os campos. Listas, times e configurações adicionais ficam em blocos expansíveis.
3. Use **Adicionar**, **Duplicar**, **Mover**, **Remover**, **Desfazer** e **Refazer**.
4. Nos guias, edite o texto diretamente; a barra insere títulos, parágrafos, listas, cards e imagens.
5. Use **Atualizar prévia** para conferir o rascunho. **Celular** limita a largura a 375 px; **Abrir ampla** abre outra aba.
6. Clique em **Salvar no projeto** para comparar os valores **Antes** e **Depois**. Use **Voltar à edição** para cancelar ou **Confirmar e salvar** para gravar. O editor valida, verifica conflitos e faz backup antes da gravação.

A comparação mostra os campos adicionados, removidos e alterados. Listas usam posições a partir de 1; mover um card pode gerar várias diferenças. Textos HTML são exibidos como código, sem execução. Em documentos com muitas mudanças, são exibidas as primeiras 300 diferenças, com aviso; exporte o rascunho para conferir o conteúdo completo.

Salvar afeta somente o documento aberto. A prévia usa esse rascunho e os demais arquivos já salvos. As 25 prévias mais recentes ficam disponíveis enquanto o servidor estiver aberto. O Service Worker da PWA não é registrado nas prévias.

## Bibliotecas

| Conteúdo | Arquivo | O que editar |
|---|---|---|
| Treinadores e times | data/gyms.json | Ginásios, Elite Four, rivais, vilões, times e retratos |
| Itens importantes | data/key-items.json | Categorias, itens e descrições |
| Guias, Safari e Sevii | data/guides.json | Títulos, textos, imagens e cards dos guias |
| Battle Frontier | data/frontier.json | Instalações, líderes, times, lojas e Pokémon especiais |
| Presentes, trocas e exclusivos | data/extras.json | Cards por jogo |
| TMs/HMs e tutores | data/machines.json e data/tutors.json | Golpes, categorias, tipos e locais |
| Traduções | data/i18n/pt.json e en.json | Valores dos dicionários existentes |
| Páginas e modelos de cards | data/pages.json | Novas páginas no menu e modelos reutilizáveis |
| Textos da interface | data/interface.json | Navegação, cabeçalhos, rótulos, placeholders e mensagens marcadas |
| Correções da Pokédex | data/pokemon-overrides.json | Correções que sobrevivem à regeneração da PokéAPI |

O seletor de Pokémon preenche nome e tipos quando esses campos estão no card. Confira manualmente nível, habilidade, item e golpes depois de trocar o Pokémon.

## Importar imagens

Em um campo de imagem, clique em **Escolher → Importar imagem**. Nos guias, use **+ Imagem → Importar imagem**.

- Aceita PNG, JPEG e WebP, até 8 MB, 4096 pixels por lado e 8 milhões de pixels.
- O navegador converte a imagem para PNG. A imagem convertida também precisa caber em 8 MB.
- O servidor valida a estrutura e os pixels antes de gravar.
- Os arquivos entram em **img/uploads/**, com nome seguro e hash do conteúdo. Imagens existentes não são substituídas.
- Clique na imagem importada para usá-la no campo ou texto.

A importação já grava o arquivo de imagem, mesmo antes de salvar o documento. Inclua as imagens novas no próximo commit. O editor não apaga arquivos de imagem ao remover cards, pois podem estar em uso em outras páginas.

Sprites de Pokémon inseridos nos guias usam a versão selecionada na prévia. Nos cards novos com um número de Pokémon, a sprite acompanha o jogo escolhido pelo visitante.

## Criar páginas e modelos

Escolha **Páginas e modelos de cards → Páginas → Adicionar**.

Defina o título, o nome no menu e um endereço único, por exemplo **meu-guia**. A página terá a rota **#page/meu-guia**. Com **Publicar página** marcado, aparece no menu do site depois de salvar e enviar as mudanças ao GitHub.

A lista **Jogos** restringe a página às versões escolhidas. Vazia, permite todos os jogos. Na prévia do editor, uma página desmarcada ainda pode ser visualizada; no site público ela fica indisponível.

Em **Cards**, crie uma entrada ou clique em **Adicionar de modelo**. Os cards permitem:

- Título, texto formatado, imagem, Pokémon e item.
- Disposição **vertical**, **horizontal** ou **destaque** de largura completa.
- Cor de destaque.
- Link e texto do link.
- Campos adicionais com rótulo e valor.

Em **Modelos de cards**, crie seus próprios modelos com essas opções. **Guardar como modelo**, dentro de um card, copia sua configuração para a biblioteca.

**Modelos são pontos de partida:** mudar o modelo depois não altera os cards já criados. É possível editar, duplicar, ordenar e remover modelos.

Os campos em **Inglês (opcional)** são usados quando o site está em inglês. Se estiverem vazios, o conteúdo em português é exibido.

## Textos da interface

Escolha **Textos da interface**, o idioma e o grupo. Existem 135 entradas para navegação, títulos, textos fixos, rótulos e mensagens das seções.

Os valores são texto simples, sem HTML. O campo inglês vazio usa o português como alternativa. Preserve **{jogo}** quando quiser que o texto mostre automaticamente o nome da versão selecionada.

Esses textos se integram à troca de idioma existente. Conteúdos editoriais antigos continuam no idioma em que foram escritos; não existe tradução automática.

## Corrigir a Pokédex sem perder mudanças

Escolha **Correções da Pokédex → Adicionar**, selecione o Pokémon e expanda:

- **Textos por idioma:** descrição e categoria em português/inglês.
- **Dados a corrigir:** adicione somente os campos necessários, como tipos, status, habilidades, golpes, evoluções ou locais.

O arquivo **data/pokemon-overrides.json** é aplicado sobre os dados originais em tempo de leitura. **tools/build_data.py** não o sobrescreve. Nome, tipos e status corrigidos também são refletidos no índice usado pela busca e pelas listas.

Há uma correção por Pokémon. Removê-la restaura os dados gerados. Tipos precisam pertencer à geração 3; status base devem estar entre 1 e 255. Altura e peso usam as unidades do dataset: decímetros e hectogramas.

As listas substituem a lista original inteira. Objetos, como status, podem conter apenas as propriedades que você deseja corrigir. Textos editoriais por idioma têm prioridade sobre a descrição/categoria existente.

## Rascunhos, backups e outros PCs

Rascunhos ficam neste navegador. Ao reabrir um documento, o editor oferece recuperar o rascunho. Limpar os dados do navegador pode apagá-lo. Use **Exportar rascunho** para obter uma cópia JSON e **Importar JSON** para recuperá-la.

Ao trocar de documento com alterações, o editor pede confirmação e guarda o rascunho. Trocar de card ou seção mantém as edições no mesmo documento. Ao fechar ou recarregar a aba, o aviso considera também rascunhos de outros documentos deste projeto. O navegador controla a aparência desse aviso; exporte os rascunhos antes de limpar dados ou trocar de PC. O campo **HTML avançado** guarda a digitação imediatamente no rascunho, sem precisar sair do campo.

Antes de cada salvamento com alteração, o arquivo anterior fica em:

~~~text
../HoennKantoWiki-backups/editor/AAAAMMDD-HHMMSS-microssegundos-nome-do-arquivo.json
~~~

Para restaurar, abra o documento correspondente e clique em **Histórico de backups**. A lista mostra somente backups desse documento, do mais recente ao mais antigo. Escolha a data, compare com o rascunho atual e clique em **Carregar como rascunho**. Você pode usar **Desfazer**, conferir a prévia ou continuar editando. A restauração só grava no disco depois de **Salvar no projeto → Confirmar e salvar**. A versão substituída também ganha um backup. Backups com conteúdo inválido são recusados; **Importar JSON** continua disponível para cópias externas. Se o arquivo tiver mudado em outro programa ou aba, o editor recusa sobrescrevê-lo; exporte o rascunho, reabra o arquivo e reaplique as mudanças.

Backups completos anteriores às implementações ficam em **HoennKantoWiki-backups**, ao lado do repositório. Extraia um ZIP em uma pasta separada para conferir antes de substituir o diretório de trabalho.

Para mudar de computador:

1. No PC atual, salve os documentos e faça **commit + Push** dos JSONs e imagens novas.
2. No outro PC, clone o projeto ou faça **Fetch/Pull** pelo GitHub Desktop.
3. Com Python instalado, abra **Iniciar editor.cmd**.
4. Antes de voltar ao primeiro PC, repita o fluxo de salvar, commit e Push.

Rascunhos, preferências de tema e backups externos não são sincronizados pelo Git. Para transportar um rascunho sem publicar, exporte ou importe o JSON e transfira também as imagens que ele usa. Evite editar o mesmo arquivo simultaneamente em computadores diferentes.

## Publicação e limites

**Salvar não faz commit nem push.** Revise os arquivos no GitHub Desktop e use **Push origin** quando quiser publicar. Em outro PC, receba as alterações com **Pull**.

O painel não é carregado pelo site público. O GitHub Pages serve os conteúdos publicados sem executar o servidor de edição. Nenhuma credencial GitHub é utilizada pelo editor.

Os modelos combinam opções visuais e campos existentes; não são um construtor de CSS/JavaScript arbitrário. Alterar mecânicas, funções, novas espécies ou tipos de componentes ainda exige código. Alertas de operação e textos sem marca de conteúdo continuam no código.

Os guias antigos preservam seu HTML. A calculadora e tabela de naturezas têm seus identificadores protegidos; confira a prévia após alterações avançadas. Esta versão não inclui administração pela internet nem sincronização automática com Android.

## Verificação técnica

- tools/local_editor.py: servidor, sessão, documentos, conflitos e histórico de backups.
- tools/editor/review.js: comparação antes de salvar ou restaurar, com exibição segura dos valores.
- tools/editor_extensions.py: imagens e validação de páginas/correções.
- tools/editor/: interface, temas e schemas versionados.
- js/ui/interface.js e js/views/custom-pages.js: integração no site estático.
- js/core/editorial.js: aplicação das correções da Pokédex.
- tools/tests/: testes em cópias temporárias, sem alterar os dados reais.

Teste do servidor, sem dependências:

~~~powershell
python -B -m unittest discover -s tools/tests -p test_local_editor.py -v
~~~

O teste opcional de navegador exige Node, Playwright e Edge/Chromium. O Playwright pode ficar fora do repositório:

~~~powershell
$env:WIKI_PLAYWRIGHT = "C:/caminho/temporario/node_modules/playwright"
$env:WIKI_BROWSER = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
node tools/tests/editor_browser.cjs
~~~

A verificação cobre o editor e uma cópia do site servida apenas como arquivos estáticos.
