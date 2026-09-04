// Painel recolhivel, rolagem do menu e deteccao de toque.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

export default {
    /**
     * No iOS nao existe prompt de instalacao programatico: o usuario precisa
     * usar Compartilhar > Adicionar a Tela de Inicio. Este passo a passo cobre
     * essa lacuna.
     */
    mostrarInstrucoesIOS() {
        let modal = document.getElementById('ios-install-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ios-install-modal';
            modal.className = 'ios-modal hidden';
            modal.innerHTML = `
                <div class="ios-modal-card" role="dialog" aria-modal="true" aria-labelledby="ios-modal-titulo">
                    <button class="ios-modal-fechar" aria-label="Fechar">&times;</button>
                    <h3 id="ios-modal-titulo">Instalar no iPhone ou iPad</h3>
                    <p>O Safari não oferece um botão automático. Em três passos:</p>
                    <ol>
                        <li>Toque em <strong>Compartilhar</strong> <span class="ios-icone">&#xFE0E;⬆️</span> na barra do Safari.</li>
                        <li>Role e escolha <strong>Adicionar à Tela de Início</strong>.</li>
                        <li>Confirme em <strong>Adicionar</strong>.</li>
                    </ol>
                    <p class="ios-obs">Precisa ser o <strong>Safari</strong> — Chrome e Firefox no iOS não conseguem instalar.</p>
                </div>`;
            document.body.appendChild(modal);

            const fechar = () => modal.classList.add('hidden');
            modal.querySelector('.ios-modal-fechar').addEventListener('click', fechar);
            modal.addEventListener('click', (e) => { if (e.target === modal) fechar(); });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') fechar();
            });
        }
        modal.classList.remove('hidden');
        modal.querySelector('.ios-modal-fechar').focus();
    },

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
