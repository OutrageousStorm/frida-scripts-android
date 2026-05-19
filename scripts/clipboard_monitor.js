/**
 * clipboard_monitor.js -- Monitor all clipboard reads/writes on Android
 * Logs what data apps copy and paste
 * Usage: frida -U -f com.example.app -l clipboard_monitor.js --no-pause
 */

Java.perform(function() {
  console.log("[+] Clipboard monitor loaded");

  var ClipboardManager = Java.use("android.content.ClipboardManager");
  
  // Hook getText (read)
  ClipboardManager.getText.overload().implementation = function() {
    var text = this.getText();
    console.log("[CLIPBOARD] READ: " + text);
    return text;
  };
  
  // Hook setPrimaryClip (write)
  ClipboardManager.setPrimaryClip.overload("android.content.ClipData")
    .implementation = function(clip) {
      var item = clip.getItemAt(0);
      try {
        var text = item.getText();
        console.log("[CLIPBOARD] WRITE: " + text.substring(0, 100));
      } catch(e) {
        console.log("[CLIPBOARD] WRITE: (binary data)");
      }
      return this.setPrimaryClip(clip);
    };
  
  console.log("[+] Monitoring all clipboard activity");
});
