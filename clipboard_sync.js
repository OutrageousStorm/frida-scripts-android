/**
 * clipboard_sync.js — Sync device clipboard to stdout in real-time
 * Usage: frida -U -f com.any.app -l clipboard_sync.js --no-pause
 */
Java.perform(() => {
    const Context = Java.use('android.content.Context');
    const ClipboardManager = Java.use('android.content.ClipboardManager');
    
    console.log('[+] Clipboard sync active');
    
    ClipboardManager.setPrimaryClip.implementation = function(clip) {
        const text = clip.getItemAt(0).getText();
        console.log(`[CLIPBOARD] ${text}`);
        return this.setPrimaryClip(clip);
    };
});
