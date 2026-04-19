/**
 * data-exfil-monitor.js
 * Detect and log data exfiltration attempts
 * Usage: frida -U -f com.example.app -l data-exfil-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Data Exfil Monitor] Starting...\n");

        // Clipboard access
        var ClipboardManager = Java.use("android.content.ClipboardManager");
        ClipboardManager.getPrimaryClip.implementation = function() {
            console.log("[EXFIL] Clipboard read attempt");
            return this.getPrimaryClip.call(this);
        };

        // File reads
        var FileInputStream = Java.use("java.io.FileInputStream");
        FileInputStream.$init.overload("java.lang.String").implementation = function(path) {
            var suspicious = ["/data/data/", "/sdcard/", "password", "token", "secret"];
            for (var s of suspicious) {
                if (path.indexOf(s) !== -1) {
                    console.log("[EXFIL] FileInputStream: " + path);
                    break;
                }
            }
            return this.$init.call(this, path);
        };

        // HTTP uploads
        var RequestBody = Java.use("okhttp3.RequestBody");
        try {
            RequestBody.create.overload("[B", "okhttp3.MediaType").implementation = function(bytes, mediaType) {
                if (bytes.length > 1024 * 100) {
                    console.log("[EXFIL] Large upload: " + bytes.length + " bytes");
                }
                return this.create.call(this, bytes, mediaType);
            };
        } catch(e) {}

        // Contact/SMS access
        var ContentResolver = Java.use("android.content.ContentResolver");
        ContentResolver.query.overload("android.net.Uri", "[Ljava.lang.String;", "java.lang.String", "[Ljava.lang.String;", "java.lang.String")
            .implementation = function(uri, proj, sel, args, order) {
                var uriStr = uri.toString();
                if (uriStr.indexOf("contact") !== -1 || uriStr.indexOf("sms") !== -1) {
                    console.log("[EXFIL] Contact/SMS query: " + uriStr);
                }
                return this.query.call(this, uri, proj, sel, args, order);
            };

        console.log("[Data Exfil Monitor] Active.\n");
    });
}, 0);
