# Cries locais

Fonte: [repositório PokeAPI/cries](https://github.com/PokeAPI/cries), diretório cries/pokemon.

Os arquivos 1–386 foram obtidos da coleção **latest**, exceto o Pikachu (25), que usa **legacy**: o arquivo latest/25.ogg da fonte contém MP3 apesar da extensão. A versão legacy utilizada é Ogg/Vorbis válido.

Para repor os arquivos ausentes:

~~~powershell
python -B tools/fetch_cries.py
~~~

O script mantém arquivos Ogg já existentes. O site tenta primeiro o arquivo local e mantém as URLs remotas como fallback. A reprodução usa os áudios mais recentes disponíveis, não necessariamente gravações exclusivas dos cartuchos da geração 3.

Pokémon e seus áudios pertencem aos respectivos titulares Nintendo / Game Freak / The Pokémon Company.
