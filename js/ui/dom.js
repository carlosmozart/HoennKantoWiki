// Referencias de DOM resolvidas uma vez no carregamento.

export default {
    dom: {
        navBtns: document.querySelectorAll('.sidebar .nav-btn'),
        views: document.querySelectorAll('.view-section'),
        gridContainer: document.getElementById('pokedex-grid'),
        searchForm: document.getElementById('search-form'),
        searchInput: document.getElementById('input-search'),
        versionSelect: document.getElementById('game-version-select'),
        loadingOverlay: document.getElementById('loading-overlay'),
        themeToggle: document.getElementById('theme-toggle'),
        langToggle: document.getElementById('lang-toggle'),
        dynamicBg: document.getElementById('dynamic-bg'),
        
        // Pokemon Profile
        pName: document.querySelector('.pokemon-name'),
        pNum: document.querySelector('.pokemon-number'),
        pCat: document.querySelector('.pokemon-category'),
        pImg: document.querySelector('.pokemon-image'),
        pDesc: document.querySelector('.pokemon-description'),
        pHeight: document.querySelector('.pokemon-height'),
        pWeight: document.querySelector('.pokemon-weight'),
        pAbility: document.querySelector('.pokemon-ability'),
        pEvs: document.querySelector('.pokemon-evs'),
        badge1: document.querySelector('.badge1'),
        badge2: document.querySelector('.badge2'),
        
        btnFav: document.getElementById('btn-fav'),
        btnTeam: document.getElementById('btn-team'),
        btnShiny: document.getElementById('btn-shiny'),
        btnCry: document.getElementById('btn-cry'),
        btnCapture: document.getElementById('btn-capture-profile'),
        btnPrev: document.getElementById('btn-prev'),
        btnNext: document.getElementById('btn-next'),
        btnLayout: document.getElementById('btn-layout')
    },

};
