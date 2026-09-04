// Chaves do localStorage, escopo por perfil e versao de jogo.
// Metodos compostos no objeto `app` (js/main.js), por isso `this` continua valido.

export default {
    getScopedKey(baseKey) {
        return `wiki-${this.state.currentProfile}-${this.state.versionGroup}-${baseKey}`;
    },
    
    saveScopedData(baseKey, data) {
        localStorage.setItem(this.getScopedKey(baseKey), JSON.stringify(data));
    },
    
    loadScopedData(baseKey, defaultVal) {
        const val = localStorage.getItem(this.getScopedKey(baseKey));
        return val ? JSON.parse(val) : defaultVal;
    },
    
    loadGlobalProfileData(baseKey, defaultVal) {
        const val = localStorage.getItem(`wiki-${this.state.currentProfile}-${baseKey}`);
        return val ? JSON.parse(val) : defaultVal;
    },
    
    saveGlobalProfileData(baseKey, data) {
        localStorage.setItem(`wiki-${this.state.currentProfile}-${baseKey}`, JSON.stringify(data));
    },
    
    loadProfileState() {
        this.state.favorites = this.loadGlobalProfileData('favs', []);
        this.state.team = this.loadScopedData('team', []);
        this.state.captures = this.loadScopedData('captures', []);
    },

};
