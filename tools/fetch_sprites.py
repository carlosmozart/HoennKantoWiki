"""Baixa para o projeto os sprites usados pelo app.

Motivo: o app apontava para raw.githubusercontent.com em tempo de execucao.
Isso quebra o modo offline (e o app Android) e deixa a interface dependente de
um dominio de terceiros. Aqui tudo passa a viver em img/.

Fontes:
  - PokeAPI/sprites (Pokemon, itens, insignias) — repositorio publico
  - Bulbagarden Archives (retratos de treinador), via API oficial

Uso:
  python tools/fetch_sprites.py pokemon   sprites Gen 3 dos 386 (3 versoes)
  python tools/fetch_sprites.py itens     sprites dos itens citados nos dados
  python tools/fetch_sprites.py treinador Nome_Do_Arquivo File:Pagina.png
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(RAIZ)

UA = 'HoennKantoWiki/1.0 (fan wiki; github.com/carlosmozart/HoennKantoWiki)'
SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites'
GRUPOS = ('emerald', 'ruby-sapphire', 'firered-leafgreen')
MAX_ID = 386


def baixa(url, destino):
    """Grava o arquivo se ainda nao existir. Devolve (destino, status)."""
    if os.path.exists(destino):
        return destino, 'ja existe'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            dados = r.read()
    except urllib.error.HTTPError as e:
        return destino, f'HTTP {e.code}'
    except Exception as e:
        return destino, type(e).__name__
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, 'wb') as f:
        f.write(dados)
    return destino, f'{len(dados)} B'


def em_paralelo(tarefas, workers=10):
    with ThreadPoolExecutor(max_workers=workers) as ex:
        return list(ex.map(lambda t: baixa(*t), tarefas))


def resumo(resultados, rotulo):
    novos = [r for r in resultados if r[1].endswith('B')]
    existentes = [r for r in resultados if r[1] == 'ja existe']
    falhas = [r for r in resultados if r not in novos and r not in existentes]
    bytes_ = sum(int(r[1][:-2]) for r in novos)
    print(f'{rotulo}: {len(novos)} novos ({bytes_/1024/1024:.1f} MB), '
          f'{len(existentes)} ja existiam, {len(falhas)} falhas')
    for f in falhas[:10]:
        print(f'   ! {f[0]} -> {f[1]}')
    return falhas


def pokemon():
    """Sprites de batalha da Gen 3 (normal e shiny) + icones do modo compacto."""
    tarefas = []
    for i in range(1, MAX_ID + 1):
        for g in GRUPOS:
            tarefas.append((f'{SPRITES}/pokemon/versions/generation-iii/{g}/{i}.png',
                            f'img/pokemon/{g}/{i}.png'))
            tarefas.append((f'{SPRITES}/pokemon/versions/generation-iii/{g}/shiny/{i}.png',
                            f'img/pokemon/{g}/shiny/{i}.png'))
        # usado na cadeia evolutiva, equipe e listas
        tarefas.append((f'{SPRITES}/pokemon/{i}.png', f'img/pokemon/full/{i}.png'))
        tarefas.append((f'{SPRITES}/pokemon/versions/generation-viii/icons/{i}.png',
                        f'img/pokemon/icons/{i}.png'))
    resumo(em_paralelo(tarefas), 'Pokemon')


def nomes_de_itens():
    """Todo item citado nos dados do projeto, para saber o que baixar."""
    nomes = set()

    def slug(txt):
        return (txt.strip().lower()
                .replace('é', 'e').replace('á', 'a').replace('ó', 'o')
                .replace(' ', '-').replace('.', '').replace("'", ''))

    # itens segurados pelos Pokemon dos treinadores
    gyms = json.load(open('data/gyms.json', encoding='utf-8'))
    for versao in gyms.values():
        for aba in versao.values():
            for t in aba:
                for chave in ('silverTeam', 'goldTeam'):
                    for p in t.get(chave) or []:
                        item = (p.get('item') or '').strip()
                        if item and item.lower() not in ('nenhum', 'none', '-', ''):
                            nomes.add(slug(item))

    # itens de evolucao citados nas fichas
    for i in range(1, MAX_ID + 1):
        caminho = f'data/pokemon/{i}.json'
        if not os.path.exists(caminho):
            continue
        d = json.load(open(caminho, encoding='utf-8'))
        for e in d.get('evolucoes', []):
            for chave in ('item', 'itemSegurado'):
                if e.get(chave):
                    nomes.add(e[chave])

    # itens importantes e das lojas da Battle Frontier
    for arquivo, extrai in (
        ('data/key-items.json', lambda d: [i.get('sprite') for r in d.values() for i in r]),
        ('data/frontier.json', lambda d: [i.get('sprite') for s in (d.get('shops') or []) for i in (s.get('items') or [])]),
    ):
        if os.path.exists(arquivo):
            for s in extrai(json.load(open(arquivo, encoding='utf-8'))):
                if s:
                    nomes.add(s)

    return sorted(n for n in nomes if n)


def itens():
    nomes = nomes_de_itens()
    print(f'{len(nomes)} itens citados nos dados')
    falhas = resumo(em_paralelo([(f'{SPRITES}/items/{n}.png', f'img/items/{n}.png')
                                 for n in nomes]), 'Itens')
    if falhas:
        print('  (nomes sem sprite correspondente no repositorio da PokeAPI)')


def treinador(destino, pagina):
    """Baixa um retrato de treinador do Bulbagarden Archives."""
    api = ('https://bulbapedia.bulbagarden.net/w/api.php?action=query&titles='
           + urllib.parse.quote(pagina) + '&prop=imageinfo&iiprop=url&format=json')
    req = urllib.request.Request(api, headers={'User-Agent': UA})
    d = json.load(urllib.request.urlopen(req, timeout=30))
    for p in d['query']['pages'].values():
        info = p.get('imageinfo')
        if not info:
            print(f'  ! {pagina} nao encontrada')
            return
        alvo, status = baixa(info[0]['url'], f'img/trainers/{destino}')
        print(f'  {destino}: {status}')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'pokemon':
        pokemon()
    elif cmd == 'itens':
        itens()
    elif cmd == 'treinador':
        treinador(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
