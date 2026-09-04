"""Camada de busca na PokeAPI com cache em disco.

O cache fica fora do repositorio (scratchpad), entao re-executar o build nao
gera trafego novo. Concorrencia modesta: a PokeAPI e gratuita e pede uso justo.
"""
import json, os, urllib.request, urllib.error, hashlib, time
from concurrent.futures import ThreadPoolExecutor

CACHE_DIR = os.environ.get('POKE_CACHE') or os.path.join(
    os.environ.get('TEMP', '/tmp'), 'pokeapi-cache')
os.makedirs(CACHE_DIR, exist_ok=True)
UA = 'HoennKantoWiki-build/1.0 (https://github.com/carlosmozart/HoennKantoWiki)'


def _path(url):
    return os.path.join(CACHE_DIR, hashlib.sha1(url.encode()).hexdigest() + '.json')


def get(url, tentativas=3):
    p = _path(url)
    if os.path.exists(p):
        with open(p, encoding='utf-8') as f:
            return json.load(f)
    for i in range(tentativas):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            with open(p, 'w', encoding='utf-8') as f:
                json.dump(data, f)
            return data
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(1.5 * (i + 1))
        except Exception:
            time.sleep(1.5 * (i + 1))
    return None


def get_many(urls, workers=6):
    with ThreadPoolExecutor(max_workers=workers) as ex:
        return list(ex.map(get, urls))
