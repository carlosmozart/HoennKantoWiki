# Aplicativo Android

## Estado atual

Este diretório contém todo o projeto móvel. O site publicado pelo GitHub Pages permanece na raiz do repositório; durante o build, seus dados e recursos são copiados para um pacote Android offline. O editor e os backups não fazem parte do APK.

A partir da raiz do repositório, entre neste diretório. O script gera **dist/web** e um manifesto com tamanho e SHA-256 de cada arquivo:

~~~powershell
cd apps/android
python -B tools/build_web.py
~~~

A pasta é gerada novamente a partir do projeto. O script substitui somente uma saída identificada como sua própria geração. A saída fica ignorada pelo Git; envie as fontes do projeto, não a pasta dist.

O pacote não registra Service Worker: os arquivos instalados no futuro APK devem permanecer juntos na mesma versão. No GitHub Pages, o Service Worker continua ativo.

## O que foi preparado

- Áudios locais em **audio/cries/1.ogg** até **386.ogg**, com fontes registradas em **audio/README.md**.
- Reprodução interrompe o cry anterior e evita disparar duas tentativas de fallback pelo mesmo erro.
- Dados e imagens continuam locais e preservam os sprites das versões dos jogos.
- O mapa usa `data/map-encounters.json`, gerado das fichas locais, sem consultar a PokéAPI durante o uso.
- Fonte, exportação da equipe e compartilhamento funcionam sem internet no pacote Android.
- Testes de navegação pelo histórico, áudio real, reabertura offline e largura de 390 px.
- Atualizações incompletas do shell da PWA são recusadas, preservando o worker anterior.
- A limpeza do cache não apaga caches de outros aplicativos da mesma origem.

## Limites do offline

Na **PWA**, as fichas individuais, sprites e áudios entram no cache conforme forem acessados. Abra as fichas e toque os cries enquanto estiver online antes do teste em modo avião. Não há download completo automático dos 386 Pokémon na instalação. A primeira visita exige conexão.

No **pacote web para Android**, todos os dados, sprites, cries e encontros do mapa estão incluídos. A fonte Oxanium e o html2canvas usado para exportar a equipe também estão locais. A exportação usa o compartilhamento nativo no app.

Os testes no navegador não substituem testes em um aparelho Android/WebView: permissões de áudio, áreas da barra do sistema, teclado, gestos de voltar e instalação precisam de validação no APK.

## Como repetir os testes automatizados

Com Python, Node, Playwright e Microsoft Edge disponíveis:

~~~powershell
cd apps/android
$env:WIKI_PLAYWRIGHT = "$env:TEMP/hoenn-editor-browser-tests/node_modules/playwright"
node tests/native_web_test.cjs
npm run test:navigation
~~~

O caminho WIKI_PLAYWRIGHT deve apontar para uma instalação existente do Playwright. Os testes criam cópias temporárias; não salvam dados no projeto real.

## Estrutura

- `android/`: projeto Gradle aberto pelo Android Studio.
- `native/`: integração JavaScript e estilos exclusivos do aplicativo.
- `tools/`: geração do pacote web, configuração do Java e compilação do APK.
- `tests/`: testes exclusivos do aplicativo.
- `dist/`: saídas geradas localmente e ignoradas pelo Git.

## Compilação

O projeto nativo usa Capacitor 8.5.1 e **dist/web** como **webDir**. A configuração webDir deve apontar para uma pasta que já contenha index.html e os arquivos do app. [Configuração oficial](https://capacitorjs.com/docs/config).

Antes da compilação, preparar Android Studio e Android SDK compatíveis com a versão do Capacitor adotada. A documentação consultada para Capacitor 8 informa Node 22+ e Android Studio 2025.2.1+; o Android Studio fornece o JDK apropriado. [Requisitos oficiais](https://capacitorjs.com/docs/getting-started/environment-setup).

O Android Studio e o SDK foram detectados neste PC. O projeto requer a plataforma API 36; quando necessário, o Gradle a obtém usando as licenças já aceitas pelo SDK Manager. O JDK 21 opcional do projeto fica em `.local/toolchains` e não altera o Java do sistema.

O evento nativo Voltar fecha diálogos e a ficha de treinamento, volta pelo histórico quando existe, abre a tela inicial ao partir de um link direto e encerra somente na tela inicial. [API oficial de App](https://capacitorjs.com/docs/apis/app).

## Roteiro no aparelho

1. Instalar o APK de teste e abrir sem conexão desde a primeira execução.
2. Consultar Pokémon de Kanto e Hoenn, alternar jogo, shiny e idioma.
3. Tocar Charmeleon, Pikachu e outros cries; trocar rapidamente de Pokémon.
4. Navegar por guias, treinadores e páginas próprias; testar Voltar pelo gesto e pelo botão.
5. Digitar buscas, abrir o teclado, girar o aparelho e conferir áreas das barras do sistema.
6. Favoritar, montar equipe, fechar e reabrir para verificar persistência.
7. Instalar uma atualização sobre a anterior e conferir a preservação das preferências e da equipe.

Dentro de `apps/android`, use **Gerar APK de teste.cmd** ou `npm run android:debug`. O APK e seu SHA-256 são gravados em `dist`. Para abrir o projeto no Android Studio, use `npm run android:open`.

A compilação local deste PC pode falhar com **Unable to establish loopback connection** quando a proteção do sistema bloqueia a comunicação local do processo Java. Permita conexões locais para o Java/JDK usado pelo Gradle ou use a tarefa **Android debug APK** na aba Actions do GitHub. Essa tarefa é manual, não publica uma versão e guarda o APK de teste por 14 dias.

O APK 0.1.0 foi instalado e validado com sucesso em um aparelho físico.
