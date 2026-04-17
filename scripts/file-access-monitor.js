/**
 * file-access-monitor.js
 * Monitor all file read/write/delete operations
 * Usage: frida -U -f com.example.app -l file-access-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[File Monitor] Active\n");

        var File = Java.use("java.io.File");

        // File.exists()
        File.exists.implementation = function() {
            var path = this.getAbsolutePath();
            var result = this.exists.call(this);
            if (path.indexOf("data") !== -1 || path.indexOf("sdcard") !== -1) {
                console.log("[FILE] exists: " + path + " -> " + result);
            }
            return result;
        };

        // File.delete()
        File.delete.implementation = function() {
            var path = this.getAbsolutePath();
            var result = this.delete.call(this);
            console.log("[FILE] DELETE: " + path);
            return result;
        };

        // File.length()
        File.length.implementation = function() {
            var path = this.getAbsolutePath();
            var len = this.length.call(this);
            if (path.indexOf("data") !== -1) {
                console.log("[FILE] length: " + path + " (" + len + " bytes)");
            }
            return len;
        };

        // FileInputStream
        var FileInputStream = Java.use("java.io.FileInputStream");
        FileInputStream.$init.overload("java.io.File").implementation = function(f) {
            console.log("[FILE] READ: " + f.getAbsolutePath());
            return this.$init.call(this, f);
        };

        // FileOutputStream
        var FileOutputStream = Java.use("java.io.FileOutputStream");
        FileOutputStream.$init.overload("java.io.File").implementation = function(f) {
            console.log("[FILE] WRITE: " + f.getAbsolutePath());
            return this.$init.call(this, f);
        };
        FileOutputStream.$init.overload("java.io.File", "boolean").implementation = function(f, append) {
            console.log("[FILE] " + (append ? "APPEND" : "WRITE") + ": " + f.getAbsolutePath());
            return this.$init.call(this, f, append);
        };

        console.log("[File Monitor] Watching file operations...");
    });
}, 0);
