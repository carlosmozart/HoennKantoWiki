# Preparação e testes Android

## Estado atual

O site continua publicado pelo GitHub Pages. Foi preparada uma cópia dos arquivos web para o futuro app Android, com dados, sprites e 386 cries locais. O editor e os backups não fazem parte desse pacote.

O script abaixo gera **dist/android-web** e um manifesto com tamanho e SHA-256 de cada arquivo:

~~~powershell
python -B tools/build_android_web.py
~~~

A pasta é gerada novamente a partir do projeto. O script substitui somente uma saída identificada como sua própria geração. A saída fica ignorada pelo Git; envie as fontes do projeto, não a pasta dist.

O pacote não registra Service Worker: os arquivos instalados no futuro APK devem permanecer juntos na mesma versão. No GitHub Pages, o Service Worker continua ativo.

## O que foi preparado

- Áudios locais em **audio/cries/1.ogg** até **386.ogg**, com fontes registradas em **audio/README.md**.
- Reprodução interrompe o cry anterior e evita disparar duas tentativas de fallback pelo mesmo erro.
- Dados e imagens continuam locais e preservam os sprites das versões dos jogos.
- Testes de navegação pelo histórico, áudio real, reabertura offline e largura de 390 px.
- Atualizações incompletas do shell da PWA são recusadas, preservando o worker anterior.
- A limpeza do cache não apaga caches de outros aplicativos da mesma origem.

## Limites do offline

Na **PWA**, as fichas individuais, sprites e áudios entram no cache conforme forem acessados. Abra as fichas e toque os cries enquanto estiver online antes do teste em modo avião. Não há download completo automático dos 386 Pokémon na instalação. A primeira visita exige conexão.

No **pacote web para Android**, todos os dados, sprites e cries estão incluídos. A fonte Oxanium ainda usa Google Fonts (há fonte alternativa do sistema), e a exportação de imagem da equipe usa html2canvas por CDN; esta função ainda precisa ter sua dependência incluída localmente antes de prometer funcionamento completo em modo avião.

Os testes no navegador não substituem testes em um aparelho Android/WebView: permissões de áudio, áreas da barra do sistema, teclado, gestos de voltar e instalação precisam de validação no APK.

## Como repetir os testes automatizados

Com Python, Node, Playwright e Microsoft Edge disponíveis:

~~~powershell
python -B -m unittest discover -s tools/tests -p "test_*.py" -v
$env:WIKI_PLAYWRIGHT = "$env:TEMP/hoenn-editor-browser-tests/node_modules/playwright"
node tools/tests/editor_browser.cjs
node tools/tests/mobile_browser.cjs
node tools/tests/cries_test.cjs
~~~

O caminho WIKI_PLAYWRIGHT deve apontar para uma instalação existente do Playwright. Os testes criam cópias temporárias; não salvam dados no projeto real.

## Próxima etapa: primeiro APK

O caminho previsto é empacotar o site com Capacitor, usando **dist/android-web** como **webDir**. A configuração webDir deve apontar para uma pasta que já contenha index.html e os arquivos do app. [Configuração oficial](https://capacitorjs.com/docs/config).

Antes da compilação, preparar Android Studio e Android SDK compatíveis com a versão do Capacitor adotada. A documentação consultada para Capacitor 8 informa Node 22+ e Android Studio 2025.2.1+; o Android Studio fornece o JDK apropriado. [Requisitos oficiais](https://capacitorjs.com/docs/getting-started/environment-setup).

Neste PC, o Android SDK não foi encontrado no caminho padrão e o comando adb não estava disponível. Nenhum APK foi compilado nesta etapa.

Na integração nativa, revisar o evento de Voltar do plugin App para respeitar o histórico e encerrar apenas na tela inicial. O teste atual valida o histórico web, não o botão físico. [API oficial de App](https://capacitorjs.com/docs/apis/app).

## Roteiro no aparelho

1. Instalar o APK de teste e abrir sem conexão desde a primeira execução.
2. Consultar Pokémon de Kanto e Hoenn, alternar jogo, shiny e idioma.
3. Tocar Charmeleon, Pikachu e outros cries; trocar rapidamente de Pokémon.
4. Navegar por guias, treinadores e páginas próprias; testar Voltar pelo gesto e pelo botão.
5. Digitar buscas, abrir o teclado, girar o aparelho e conferir áreas das barras do sistema.
6. Favoritar, montar equipe, fechar e reabrir para verificar persistência.
7. Instalar uma atualização sobre a anterior e conferir a preservação das preferências e da equipe.

Pendências para o APK: integração nativa, dependências externas restantes, Android SDK/compilação e testes em aparelho físico.
