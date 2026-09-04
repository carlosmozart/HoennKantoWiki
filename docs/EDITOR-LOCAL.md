# Editor local · WikiGen3 1.0

O editor roda no seu computador e grava os JSONs de conteúdo do projeto. Não precisa de conta, senha, banco de dados, Node ou instalação de pacotes. Requer **Python 3.10 ou superior**.

## Abrir

No Windows, dê dois cliques em **Iniciar editor.cmd**, na raiz do projeto. Mantenha a janela do terminal aberta enquanto edita.

Alternativa pelo terminal, na pasta do projeto:

~~~powershell
python tools/local_editor.py --open
~~~

O navegador abre no endereço local com a sessão de edição. Se a porta estiver ocupada:

~~~powershell
python tools/local_editor.py --open --port 8766
~~~

Para encerrar, pressione **Ctrl+C** no terminal. O serviço aceita conexões apenas em **127.0.0.1**. Não altere o endereço para expor esse servidor na rede.

## Editar e salvar

1. Selecione o conteúdo e a seção/versão do jogo na biblioteca.
2. Escolha o card e edite os campos. Times, golpes e itens ficam em listas expansíveis.
3. Use **Adicionar**, **Duplicar**, **Mover** e **Remover** para organizar os cards. **Desfazer/Refazer** recuperam alterações do arquivo aberto.
4. Nos guias, edite o texto diretamente. A barra permite inserir títulos, parágrafos, listas, cards e imagens locais. Para remover um card, clique dentro dele e use **Remover card**.
5. Use **Atualizar prévia**. Ela usa os mesmos renderizadores do site e uma cópia do rascunho em memória; não salva os arquivos. **Celular** limita a largura a 375 px, e **Abrir ampla** abre a prévia em outra aba.
6. Clique em **Salvar no projeto**. O editor valida o conteúdo, verifica se o arquivo mudou externamente, guarda o arquivo anterior em backup e grava a nova versão.

Cada botão Salvar afeta somente o arquivo aberto. Alterações em outros documentos continuam como rascunho até serem salvas.

A prévia inclui apenas o rascunho do documento aberto; os demais conteúdos vêm dos arquivos salvos. Ela não registra o Service Worker da PWA, evitando mostrar versões antigas. As 25 prévias mais recentes ficam disponíveis enquanto o servidor está aberto.

## Conteúdos disponíveis

| Biblioteca | Arquivo | Edição |
|---|---|---|
| Treinadores e times | data/gyms.json | Ginásios, Elite Four, rivais, vilões, times, requisitos e retratos |
| Itens importantes | data/key-items.json | Categorias, itens e descrições |
| Guias, Safari e Sevii | data/guides.json | Títulos, texto formatado, imagens e blocos/cards dos guias existentes |
| Battle Frontier | data/frontier.json | Instalações, líderes, times, lojas, tutores e Pokémon especiais |
| Presentes, trocas e exclusivos | data/extras.json | Cards por jogo e tipo de encontro |
| TMs/HMs e tutores | data/machines.json e data/tutors.json | Entradas, categorias, tipos e locais |
| Traduções | data/i18n/pt.json e en.json | Valores das chaves existentes |

O seletor de Pokémon usa o índice local e preenche nome e tipos. Confira manualmente nível, habilidade, item e golpes após trocar o Pokémon: esses campos não são substituídos automaticamente.

As imagens do seletor já pertencem ao projeto. Nos guias, sprites de Pokémon inseridos pelo editor usam a versão escolhida na prévia. Não há upload de novos arquivos nesta versão.

Os textos editoriais mantêm o idioma em que foram escritos, seguindo o funcionamento atual do site. O editor não traduz automaticamente textos novos.

## Rascunhos e recuperação

Rascunhos são guardados no navegador deste computador. Ao reabrir um documento com rascunho, o editor oferece recuperá-lo. Limpar os dados do navegador apaga esses rascunhos. **Exportar rascunho** baixa uma cópia JSON independente.

Antes de cada gravação com alteração, o arquivo anterior é guardado em:

~~~text
../HoennKantoWiki-backups/editor/AAAAMMDD-HHMMSS-microssegundos-nome-do-arquivo.json
~~~

O caminho completo aparece na mensagem de salvamento e na ajuda do editor.

Para restaurar:

1. Abra o documento correspondente na biblioteca.
2. Use **Importar JSON** e selecione o backup desse documento.
3. Confira a prévia e clique em **Salvar no projeto**. A versão substituída também ganhará um backup.

Se o arquivo mudar em outro programa ou em outra aba, o editor recusa sobrescrevê-lo. Exporte seu rascunho, use **Reabrir arquivo** e reaplique ou importe as mudanças que quiser manter. A importação substitui o conteúdo do documento; não mescla automaticamente versões.

Antes da implementação também foi criado um **ZIP completo do projeto, incluindo .git**, com hashes verificados, em **HoennKantoWiki-backups**, ao lado do repositório. Para recuperar o projeto inteiro, extraia o ZIP em uma pasta separada e confira essa cópia antes de substituir seu diretório de trabalho.

## Publicar pelo GitHub Pages

Salvar no editor não faz commit nem push. Abra o GitHub Desktop, revise os JSONs alterados, faça commit e depois **Push origin**, como já faz para publicar o projeto.

O painel é servido pelo Python em uma rota local. Ele não é carregado pelo index.html público. Os arquivos da ferramenta podem ser versionados no repositório sem criar uma API de edição no GitHub Pages. Nenhuma credencial GitHub é utilizada.

O editor local é uma ferramenta de desenvolvimento. Qualquer pessoa que já tenha acesso à sua sessão do computador ou aos arquivos do projeto pode editá-los; ele não substitui as permissões do Windows.

## Limites desta primeira versão

- Edita os modelos existentes, sem construir páginas ou layouts arbitrários.
- Textos fixos da navegação e do JavaScript não fazem parte da biblioteca.
- A Pokédex gerada, dados de golpes/habilidades e estatísticas não são editáveis aqui, para evitar que uma regeneração apague alterações manuais.
- Guias preservam seu HTML legado. Componentes identificados da calculadora e tabela de naturezas são protegidos. Mudanças avançadas no HTML exigem conferir o comportamento na prévia.
- As chaves de tradução e os modelos dos campos são definidos pelo projeto. Criar um novo modelo de card ou uma nova aba ainda exige código.
- Não publica, autentica pela internet nem sincroniza alterações com Android.

## Estrutura e validação

- tools/local_editor.py: servidor local, sessão, validação, conflitos e gravação atômica.
- tools/editor/: interface e modelos versionados em schema.json. Os modelos permanecem disponíveis mesmo se uma lista for esvaziada.
- tools/tests/: testes isolados, que não gravam nos dados reais.

Teste do servidor, sem dependências:

~~~powershell
python -B -m unittest discover -s tools/tests -p test_local_editor.py -v
~~~

O teste opcional de navegador exige Node, Playwright e Edge/Chromium. O Playwright pode ser instalado fora do repositório; informe o caminho por WIKI_PLAYWRIGHT e, se necessário, o navegador por WIKI_BROWSER:

~~~powershell
$env:WIKI_PLAYWRIGHT = "C:/caminho/temporario/node_modules/playwright"
$env:WIKI_BROWSER = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
node tools/tests/editor_browser.cjs
~~~

Os testes verificam a prévia, criação/edição de cards, rascunhos, backup, conflitos, validação, falha na gravação, interface mobile e componentes dos guias.
