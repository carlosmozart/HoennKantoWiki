import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { handleBack } from './navigation.js';

if (Capacitor.isNativePlatform()) {
    document.documentElement.classList.add('native-app');
    App.addListener('backButton', ({canGoBack}) => handleBack({
        canGoBack, exit: () => App.exitApp()
    }));
    App.addListener('appStateChange', ({isActive}) => {
        if (!isActive) window.app?._cryPlayback?.stop();
    });
    window.wikiNative = {
        async shareTeam(dataURL) {
            const path = 'equipe-' + Date.now() + '.png';
            const result = await Filesystem.writeFile({
                path, data: dataURL.split(',')[1], directory: Directory.Cache
            });
            // Keep the temporary file while the receiving app reads it.
            await Share.share({files:[result.uri], dialogTitle:
                window.app?.state.lang === 'en' ? 'Share team' : 'Compartilhar equipe'});
        }
    };
}
