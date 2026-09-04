// Estado da aplicacao em memoria.

export default {
    state: {
        profiles: JSON.parse(localStorage.getItem('wiki-profiles') || '["default"]'),
        currentProfile: localStorage.getItem('wiki-active-profile') || 'default',
        currentPokemon: null,
        favorites: [],
        team: [],
        captures: [],
        versionGroup: localStorage.getItem('wiki-version-group') || 'emerald', // ruby-sapphire, firered-leafgreen
        isShiny: false,
        lang: 'pt',
        isCompactMode: false,
        gymTab: 'gyms'
    },
};
