// Perfis de jogador.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

export default {
    renderProfileSelect() {
        const select = document.getElementById('profile-select');
        if (!select) return;
        select.innerHTML = '';
        this.state.profiles.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p === 'default' ? 'Perfil Principal' : p.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            if (p === this.state.currentProfile) opt.selected = true;
            select.appendChild(opt);
        });
    },

};
