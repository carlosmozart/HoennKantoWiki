// Ponto de entrada. Compoe o objeto `app` a partir dos modulos e inicia tudo.
//
// A composicao por Object.assign mantem os metodos no mesmo objeto, entao cada
// `this` dentro deles continua apontando para o app inteiro. Isso permitiu
// separar o arquivo de 1.700 linhas sem reescrever a logica.

import { initCustomPages } from './views/custom-pages.js';
import state from './core/state.js';
import storage from './core/storage.js';
import router from './core/router.js';
import i18n from './core/i18n.js';

import dom from './ui/dom.js';
import theme from './ui/theme.js';
import layout from './ui/layout.js';

import lifecycle from './app/lifecycle.js';
import events from './app/events.js';

import pokedex from './views/pokedex.js';
import pokemon from './views/pokemon.js';
import team from './views/team.js';
import trainers from './views/trainers.js';
import machines from './views/machines.js';
import guides from './views/guides.js';
import settings from './views/settings.js';

import { initFrontier, renderFrontier } from './views/frontier.js';
import { initExtras, renderExtras } from './views/extras.js';
import { renderKeyItems } from './views/items.js';
import './views/map.js';
import { init as initTraining } from './widgets/training-modal.js';
import { init as initLiveEvents } from './widgets/live-events.js';

// state e dom ja exportam { state: {...} } / { dom: {...} }: entram como os
// demais, sem aninhar.
const app = Object.assign(
    {},
    state,
    dom,
    storage,
    router,
    i18n,
    theme,
    layout,
    lifecycle,
    events,
    pokedex,
    pokemon,
    team,
    trainers,
    machines,
    guides,
    settings,
);

// Modulos convertidos a partir dos arquivos antigos ainda alcancam `app` e
// estes renderizadores pelo objeto global; manter aqui evita reescreve-los.
window.app = app;
window.renderFrontier = renderFrontier;
window.renderExtras = renderExtras;
window.renderKeyItems = renderKeyItems;

document.addEventListener('DOMContentLoaded', () => {
    initCustomPages();
    initFrontier();
    initExtras();
    initTraining();
    initLiveEvents();
    app.init();
});

export default app;
