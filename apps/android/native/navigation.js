export function handleBack({canGoBack, exit}, page = window) {
    const dialog = page.document.querySelector('dialog[open]');
    if (dialog) {dialog.close();return;}
    const training = page.document.getElementById('training-modal');
    if (training && page.getComputedStyle(training).display !== 'none') {
        page.document.getElementById('btn-close-training')?.click();return;
    }
    const hash = page.location.hash;
    if (hash && hash !== '#') {
        if (canGoBack) page.history.back();
        else page.location.hash = '';
    } else exit();
}
