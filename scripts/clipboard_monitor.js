/**
 * clipboard_monitor.js
 * Monitor clipboard read/write access in real-time
 */
Java.perform(() => {
  const ClipboardManager = Java.use('android.content.ClipboardManager');
  const PrimaryClip = Java.use('android.content.ClipData');
  console.log('[+] Clipboard monitor active');
  
  ClipboardManager.setPrimaryClip.overload('android.content.ClipData').implementation = function(clip) {
    try {
      const text = clip.getItemAt(0).coerceToText(Java.use('android.app.Activity')).toString();
      console.log('[CLIPBOARD] SET: ' + text.substring(0, 100));
    } catch(e) {}
    return this.setPrimaryClip(clip);
  };
  
  ClipboardManager.getPrimaryClip.implementation = function() {
    const clip = this.getPrimaryClip();
    try {
      const text = clip.getItemAt(0).coerceToText(null).toString();
      console.log('[CLIPBOARD] GET: ' + text.substring(0, 100));
    } catch(e) {}
    return clip;
  };
});
