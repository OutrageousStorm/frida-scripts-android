/**
 * clipboard-monitor.js
 * Log all clipboard read/write operations in real time
 * Usage: frida -U -f com.example.app -l clipboard-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Clipboard Monitor] Active\n");

        var ClipboardManager = Java.use("android.content.ClipboardManager");
        var Context = Java.use("android.content.Context");

        // Hook onPrimaryClipChanged to detect when clipboard is read
        ClipboardManager.onPrimaryClipChanged.implementation = function() {
            try {
                var clip = this.getPrimaryClip();
                if (clip) {
                    var count = clip.getItemCount();
                    for (var i = 0; i < count; i++) {
                        var item = clip.getItemAt(i);
                        var text = item.getText();
                        if (text) {
                            console.log("[CLIPBOARD] READ: " + text.toString());
                        }
                    }
                }
            } catch(e) {}
            return this.onPrimaryClipChanged.call(this);
        };

        // Hook setPrimaryClip to detect writes
        ClipboardManager.setPrimaryClip.implementation = function(clip) {
            try {
                if (clip && clip.getItemCount() > 0) {
                    var item = clip.getItemAt(0);
                    var text = item.getText();
                    if (text) {
                        console.log("[CLIPBOARD] WRITE: " + text.toString());
                    }
                }
            } catch(e) {}
            return this.setPrimaryClip.call(this, clip);
        };

        // Also hook getText() directly
        var ClipData = Java.use("android.content.ClipData");
        try {
            ClipData.getItemAt.overload("int").implementation = function(idx) {
                var item = this.getItemAt.call(this, idx);
                try {
                    if (item.getText()) {
                        console.log("[CLIPBOARD] getItemAt(" + idx + "): " + item.getText());
                    }
                } catch(e) {}
                return item;
            };
        } catch(e) {}

        console.log("[Clipboard Monitor] Ready. Watching clipboard access...");
    });
}, 0);
