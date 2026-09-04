// Extrai os objetos de dados que hoje vivem dentro de arquivos .js e grava
// como JSON em data/. Usa o proprio motor JS para avaliar os literais, entao
// nao ha risco de um parser caseiro interpretar algo errado.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const alvos = [
  { arquivo: 'js/gyms.js',            global: 'GYM_LEADERS',    saida: 'data/gyms.json' },
  { arquivo: 'js/tutors.js',          global: 'MOVE_TUTORS',    saida: 'data/tutors.json' },
  { arquivo: 'js/guides.js',          global: 'GUIDES_DATA',    saida: 'data/guides.json' },
  { arquivo: 'js/tms.js',             global: 'GEN3_MACHINES',  saida: 'data/machines.json' },
  { arquivo: 'js/items.js',           global: 'keyItemsData',   saida: 'data/key-items.json' },
  { arquivo: 'js/extras.js',          global: 'GAME_EXTRAS',    saida: 'data/extras.json' },
  { arquivo: 'js/frontier.js',        global: 'FRONTIER_DATA',  saida: 'data/frontier.json' },
  { arquivo: 'js/translations_pt.js', global: 'TRANSLATIONS_PT', saida: 'data/i18n/pt.json' },
  { arquivo: 'js/translations.js',    global: 'TRANSLATIONS_EN', saida: 'data/i18n/en.json' },
];

mkdirSync('data/i18n', { recursive: true });

for (const { arquivo, global: nome, saida } of alvos) {
  const codigo = readFileSync(arquivo, 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.createContext(sandbox);
  try {
    // `const`/`let` no topo criam binding lexical, invisivel no sandbox:
    // uma atribuicao no fim traz o valor para fora.
    vm.runInContext(`${codigo}
;try{ globalThis.__out = ${nome}; }catch(e){}`,
                    sandbox, { timeout: 10000 });
  } catch (e) {
    // Arquivos que tambem tem codigo de UI podem falhar depois de definir os
    // dados; o que importa e o objeto ja estar no sandbox.
  }
  const dados = sandbox.window[nome] ?? sandbox.__out ?? sandbox[nome];
  if (dados === undefined) {
    console.error(`  ! ${nome} nao encontrado em ${arquivo}`);
    continue;
  }
  writeFileSync(saida, JSON.stringify(dados));
  const kb = (readFileSync(saida).length / 1024).toFixed(1);
  console.log(`  ${saida.padEnd(24)} ${kb.padStart(8)} KB`);
}
