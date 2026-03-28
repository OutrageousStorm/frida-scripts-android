/**
 * file-access-monitor.js
 * Monitor file reads and writes by apps
 * Usage: frida -U -f com.example.app -l scripts/file-access-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[File Monitor] Watching file access...\n");

        var File = Java.use("java.io.File");
        var FileInputStream = Java.use("java.io.FileInputStream");
        var FileOutputStream = Java.use("java.io.FileOutputStream");

        // Monitor file existence checks
        File.exists.implementation = function() {
            var path = this.getAbsolutePath();
            if (!path.includes("/proc") && !path.includes("/sys")) {
                console.log("[File.exists] " + path);
            }
            return this.exists.call(this);
        };

        // Monitor file reads
        FileInputStream.$init.overload("java.io.File").implementation = function(f) {
            var path = f.getAbsolutePath();
            if (!path.includes("/proc") && !path.includes("/sys")) {
                console.log("[FileInputStream] READ: " + path);
            }
            return this.$init.call(this, f);
        };

        // Monitor file writes
        FileOutputStream.$init.overload("java.io.File").implementation = function(f) {
            var path = f.getAbsolutePath();
            console.log("[FileOutputStream] WRITE: " + path);
            return this.$init.call(this, f);
        };

        console.log("[File Monitor] Active - watching reads and writes");
    });
}, 0);
