"""Reescreve a lista de precache do Service Worker a partir dos arquivos reais.

Manter essa lista na mao ja causou um modo offline quebrado antes; aqui ela e
derivada do que existe em disco.
"""
import glob
import io
import json
import os
import re

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(RAIZ)

modulos = sorted(f.replace(os.sep, '/') for f in glob.glob('js/**/*.js', recursive=True))

# Dados de uso comum. As fichas individuais (data/pokemon/*.json) ficam de fora
# de proposito: sao 386 arquivos e 2,3 MB, cacheados conforme a navegacao.
dados_comuns = [
    'data/pokedex.json', 'data/moves.json', 'data/abilities.json',
    'data/i18n/pt.json', 'data/gyms.json', 'data/tutors.json',
    'data/guides.json', 'data/machines.json', 'data/key-items.json',
    'data/extras.json', 'data/frontier.json',
    'data/pages.json', 'data/interface.json', 'data/pokemon-overrides.json', 'data/map-encounters.json',
]

# Imagens editoriais dos guias precisam estar prontas na primeira abertura
# offline, junto com o JSON que aponta para elas.
guias = json.load(open('data/guides.json', encoding='utf-8'))
texto_guias = json.dumps(guias, ensure_ascii=False)
imagens_guias = sorted({m.lstrip('./') for m in re.findall(r'(?:\./)?img/[A-Za-z0-9_./-]+', texto_guias)
                        if os.path.isfile(m.lstrip('./'))})

lista = (
    ['./', './index.html', './manifest.json', './css/style.css', './css/layout.css', './css/custom-pages.css']
    + [f'./{m}' for m in modulos]
    + [f'./{d}' for d in dados_comuns]
    + [f'./{imagem}' for imagem in imagens_guias]
    + ['./fonts/Oxanium.ttf', './vendor/html2canvas/html2canvas.min.js', './images/miss.png', './favicons/favicon-16x16.png',
       './favicons/icon-192.png', './favicons/icon-512.png']
)

itens = ',\n'.join(f"  '{c}'" for c in lista)
bloco = f'const ASSETS_TO_CACHE = [\n{itens}\n];'

s = io.open('sw.js', encoding='utf-8').read()
ini = s.index('const ASSETS_TO_CACHE = [')
fim = s.index('];', ini) + 2
io.open('sw.js', 'w', encoding='utf-8').write(s[:ini] + bloco + s[fim:])

print(f'{len(lista)} arquivos no precache ({len(modulos)} modulos, {len(dados_comuns)} JSON, {len(imagens_guias)} imagens de guias)')
