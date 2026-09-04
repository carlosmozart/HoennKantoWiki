"""Gera o dataset estatico da Geracao 3 a partir da PokeAPI.

Motivo: o app fazia ~1 requisicao por Pokemon, mais uma por golpe e uma por
habilidade, em tempo de execucao. Isso deixava a navegacao dependente da rede,
impedia um modo offline de verdade e inviabilizava o app Android.

Saida em data/:
  pokedex.json          indice leve (grade, busca, filtros, analise de equipe)
  moves.json            todos os golpes da Gen 3
  abilities.json        descricoes das habilidades
  pokemon/<id>.json     ficha completa, ja com evolucao e locais embutidos

Uso: python tools/build_data.py
O cache em disco fica fora do repositorio; re-executar nao gera trafego novo.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_cache import get, get_many

BASE = 'https://pokeapi.co/api/v2'
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SAIDA = os.path.join(RAIZ, 'data')
MAX_ID = 386  # limite da Geracao 3

GRUPOS_GEN3 = ('ruby-sapphire', 'emerald', 'firered-leafgreen')
VERSOES_GEN3 = ('ruby', 'sapphire', 'emerald', 'firered', 'leafgreen')


def tipos_gen3(poke):
    """A PokeAPI devolve a tipagem atual; past_types guarda a anterior."""
    tipos = poke['types']
    for pt in poke.get('past_types', []):
        if pt['generation']['name'] in ('generation-v', 'generation-iv'):
            tipos = pt['types']
            break
    ordenados = sorted(tipos, key=lambda t: t['slot'])
    return [t['type']['name'] for t in ordenados]


def stats_dict(poke):
    return {s['stat']['name']: s['base_stat'] for s in poke['stats']}


def evs_dict(poke):
    return {s['stat']['name']: s['effort'] for s in poke['stats'] if s['effort'] > 0}


def texto(entradas, campo, idiomas=('pt-BR', 'pt', 'en')):
    """Primeiro texto disponivel na ordem de idiomas pedida."""
    for lang in idiomas:
        for e in entradas:
            if e['language']['name'] == lang:
                return e[campo].replace('\n', ' ').replace('\f', ' ').strip()
    return ''


def golpes_gen3(poke):
    """Golpes agrupados por versao: {grupo: [{name, method, level}]}."""
    por_grupo = {g: [] for g in GRUPOS_GEN3}
    for m in poke['moves']:
        nome = m['move']['name']
        for vd in m['version_group_details']:
            grupo = vd['version_group']['name']
            if grupo in por_grupo:
                por_grupo[grupo].append({
                    'n': nome,
                    'm': vd['move_learn_method']['name'],
                    'l': vd['level_learned_at'],
                })
    for g in por_grupo:
        por_grupo[g].sort(key=lambda x: (x['m'], x['l'], x['n']))
    return {g: v for g, v in por_grupo.items() if v}


def cadeia_evolutiva(chain):
    """Achata a cadeia em arestas de -> para, limitadas a Gen 3."""
    arestas = []

    def id_de(url):
        return int(url.rstrip('/').split('/')[-1])

    def visita(no):
        de_id = id_de(no['species']['url'])
        for filho in no['evolves_to']:
            para_id = id_de(filho['species']['url'])
            if para_id <= MAX_ID and de_id <= MAX_ID:
                d = (filho['evolution_details'] or [{}])[0]
                arestas.append({
                    'de': de_id,
                    'para': para_id,
                    'gatilho': (d.get('trigger') or {}).get('name'),
                    'nivel': d.get('min_level'),
                    'item': (d.get('item') or {}).get('name'),
                    'itemSegurado': (d.get('held_item') or {}).get('name'),
                    'felicidade': d.get('min_happiness'),
                    'beleza': d.get('min_beauty'),
                    'turno': d.get('time_of_day') or None,
                    'genero': d.get('gender'),
                    'troca': (d.get('trade_species') or {}).get('name'),
                })
            visita(filho)

    visita(chain)
    return [{k: v for k, v in a.items() if v not in (None, '')} for a in arestas]


def locais_gen3(encontros):
    """Locais por versao da Gen 3, com faixa de nivel e chance."""
    saida = {}
    for enc in encontros or []:
        local = enc['location_area']['name'].replace('-', ' ')
        for vd in enc['version_details']:
            versao = vd['version']['name']
            if versao not in VERSOES_GEN3:
                continue
            for ed in vd['encounter_details']:
                metodo = ed['method']['name']
                registro = saida.setdefault(versao, {}).setdefault(local, {})
                atual = registro.get(metodo)
                dados = {
                    'min': ed['min_level'],
                    'max': ed['max_level'],
                    'chance': ed['chance'],
                }
                if atual is None:
                    registro[metodo] = dados
                else:
                    atual['min'] = min(atual['min'], dados['min'])
                    atual['max'] = max(atual['max'], dados['max'])
                    atual['chance'] = max(atual['chance'], dados['chance'])
    return saida


def main():
    os.makedirs(os.path.join(SAIDA, 'pokemon'), exist_ok=True)
    ids = list(range(1, MAX_ID + 1))

    print(f'1/5 Buscando {len(ids)} Pokemon...')
    pokes = get_many([f'{BASE}/pokemon/{i}' for i in ids])
    print(f'2/5 Buscando especies...')
    especies = get_many([f'{BASE}/pokemon-species/{i}' for i in ids])
    print(f'3/5 Buscando locais de encontro...')
    encontros = get_many([f'{BASE}/pokemon/{i}/encounters' for i in ids])

    # --- Golpes e habilidades referenciados pela Gen 3 ---
    urls_golpes, urls_habs = set(), set()
    for p in pokes:
        if not p:
            continue
        for m in p['moves']:
            if any(vd['version_group']['name'] in GRUPOS_GEN3
                   for vd in m['version_group_details']):
                urls_golpes.add(m['move']['url'])
        for a in p['abilities']:
            urls_habs.add(a['ability']['url'])

    print(f'4/5 Buscando {len(urls_golpes)} golpes e {len(urls_habs)} habilidades...')
    golpes = get_many(sorted(urls_golpes))
    habilidades = get_many(sorted(urls_habs))

    # --- moves.json ---
    mapa_golpes = {}
    for g in golpes:
        if not g:
            continue
        tipo = g['type']['name']
        for pv in g.get('past_values', []):
            pass  # power/accuracy antigos ficam fora do escopo por ora
        mapa_golpes[g['name']] = {
            'tipo': 'normal' if tipo == 'fairy' else tipo,
            'poder': g['power'],
            'precisao': g['accuracy'],
            'pp': g['pp'],
            'classe': g['damage_class']['name'],
            'desc': texto(g['flavor_text_entries'], 'flavor_text'),
        }

    # --- abilities.json ---
    mapa_habs = {}
    for h in habilidades:
        if not h:
            continue
        mapa_habs[h['name']] = {
            'desc': texto(h['flavor_text_entries'], 'flavor_text'),
        }

    # --- cadeias evolutivas (uma busca por cadeia distinta) ---
    urls_cadeias = sorted({e['evolution_chain']['url'] for e in especies if e})
    print(f'5/5 Buscando {len(urls_cadeias)} cadeias evolutivas...')
    cadeias = get_many(urls_cadeias)
    por_url = {u: c for u, c in zip(urls_cadeias, cadeias) if c}

    indice = []
    for i, (p, esp, enc) in enumerate(zip(pokes, especies, encontros), start=1):
        if not p or not esp:
            print(f'  ! faltando dados do #{i}')
            continue

        tipos = tipos_gen3(p)
        stats = stats_dict(p)

        indice.append({
            'id': p['id'],
            'nome': p['name'],
            'tipos': tipos,
            'stats': stats,
        })

        url_cadeia = esp['evolution_chain']['url']
        cadeia = por_url.get(url_cadeia)

        detalhe = {
            'id': p['id'],
            'nome': p['name'],
            'tipos': tipos,
            'stats': stats,
            'evs': evs_dict(p),
            'altura': p['height'],
            'peso': p['weight'],
            'habilidades': [
                {'nome': a['ability']['name'], 'oculta': a['is_hidden']}
                for a in sorted(p['abilities'], key=lambda a: a['slot'])
            ],
            'gruposOvo': [g['name'] for g in esp['egg_groups']],
            'categoria': texto(esp['genera'], 'genus'),
            'descricao': texto(esp['flavor_text_entries'], 'flavor_text'),
            'cries': {
                'legacy': (p.get('cries') or {}).get('legacy'),
                'latest': (p.get('cries') or {}).get('latest'),
            },
            'golpes': golpes_gen3(p),
            'evolucoes': cadeia_evolutiva(cadeia['chain']) if cadeia else [],
            'locais': locais_gen3(enc),
        }

        with open(os.path.join(SAIDA, 'pokemon', f'{p["id"]}.json'), 'w',
                  encoding='utf-8') as f:
            json.dump(detalhe, f, ensure_ascii=False, separators=(',', ':'))

    def escreve(nome, dados):
        caminho = os.path.join(SAIDA, nome)
        with open(caminho, 'w', encoding='utf-8') as f:
            json.dump(dados, f, ensure_ascii=False, separators=(',', ':'))
        return os.path.getsize(caminho)

    t1 = escreve('pokedex.json', indice)
    t2 = escreve('moves.json', mapa_golpes)
    t3 = escreve('abilities.json', mapa_habs)
    detalhes_kb = sum(
        os.path.getsize(os.path.join(SAIDA, 'pokemon', f))
        for f in os.listdir(os.path.join(SAIDA, 'pokemon'))
    )

    print()
    print(f'pokedex.json    {t1/1024:8.1f} KB  ({len(indice)} Pokemon)')
    print(f'moves.json      {t2/1024:8.1f} KB  ({len(mapa_golpes)} golpes)')
    print(f'abilities.json  {t3/1024:8.1f} KB  ({len(mapa_habs)} habilidades)')
    print(f'pokemon/*.json  {detalhes_kb/1024:8.1f} KB  ({len(indice)} arquivos)')
    print(f'TOTAL           {(t1+t2+t3+detalhes_kb)/1024:8.1f} KB')


if __name__ == '__main__':
    main()
