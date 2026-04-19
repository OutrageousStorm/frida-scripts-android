/**
 * clipboard-monitor.js
 * Log all clipboard reads and writes in real time
 * Usage: frida -U -f com.example.app -l clipboard-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Clipboard Monitor] Active\n");

        var ClipboardManager = Java.use("android.content.ClipboardManager");

        // Hook getText() - app reading clipboard
        ClipboardManager.getText.implementation = function() {
            var result = this.getText.call(this);
            if (result !== null) {
                var text = result.toString().substring(0, 100);
                console.log("[Clipboard READ] " + text);
            }
            return result;
        };

        // Hook setPrimaryClip() - app writing to clipboard
        ClipboardManager.setPrimaryClip.implementation = function(clip) {
            try {
                var item = clip.getItemAt(0);
                var text = item.getText ? item.getText().toString() : item.getUri().toString();
                text = text.substring(0, 100);
                console.log("[Clipboard WRITE] " + text);
            } catch(e) {}
            return this.setPrimaryClip.call(this, clip);
        };

        // Hook clearPrimaryClip()
        ClipboardManager.clearPrimaryClip.implementation = function() {
            console.log("[Clipboard CLEAR]");
            return this.clearPrimaryClip.call(this);
        };

        console.log("[Clipboard Monitor] Watching all clipboard operations...");
    });
}, 0);
