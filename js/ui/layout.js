// Painel recolhivel, rolagem do menu e deteccao de toque.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

export default {
    initTrainerPanel() {
        const panel = document.getElementById('trainer-panel');
        if (!panel) return;
        panel.open = localStorage.getItem('wiki-trainer-panel') === 'open';
        panel.addEventListener('toggle', () => {
            localStorage.setItem('wiki-trainer-panel', panel.open ? 'open' : 'closed');
        });
    },

    // Degradê à direita do menu some quando não há mais para rolar
    initNavScroller() {
        const scroller = document.querySelector('.nav-scroller');
        const nav = document.querySelector('.nav-links');
        if (!scroller || !nav) return;

        const update = () => {
            const fim = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 4;
            scroller.classList.toggle('at-end', fim);
        };
        nav.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    },


    isTouchDevice() {
        // (pointer: coarse) descreve o ponteiro principal: dá "true" em celular
        // e tablet, e "false" num notebook com tela sensível ao toque + trackpad.
        // A largura só entra como fallback em navegadores sem essa media query.
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').media === '(pointer: coarse)') {
            return window.matchMedia('(pointer: coarse)').matches;
        }
        return window.innerWidth <= 900;
    },

};
