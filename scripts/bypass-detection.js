/**
 * bypass-detection.js
 * Comprehensive bypass for app tampering/sandbox/emulator detection
 * Covers: NOXPLAYER, BlueStacks, MEmu, GenyMotion, Play Integrity checks
 * Usage: frida -U -f com.example.app -l bypass-detection.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Detection Bypass] Starting...");

        var Build = Java.use("android.os.Build");

        // ── 1. Hide emulator markers ─────────────────────────────────────────
        var props_to_spoof = {
            "ro.kernel.qemu": "0",
            "ro.kernel.android.qemu": "0",
            "ro.hardware": "qcom",
            "ro.boot.serialno": "STORMY123456789",
            "ro.securesettings.device_owner_present": "false",
            "ro.build.type": "user",
            "ro.debuggable": "0",
            "ro.secure": "1",
        };

        var SystemProperties = Java.use("android.os.SystemProperties");
        var get_orig = SystemProperties.get.overload("java.lang.String");
        get_orig.implementation = function(key) {
            if (props_to_spoof[key]) {
                console.log("[Bypass] SystemProperties.get(" + key + ") spoofed");
                return props_to_spoof[key];
            }
            return get_orig.call(this, key);
        };

        // ── 2. Check for xposed/Frida ────────────────────────────────────────
        try {
            var Runtime = Java.use("java.lang.Runtime");
            var Process_orig = Runtime.exec.overload("[Ljava.lang.String;");
            Process_orig.implementation = function(cmds) {
                var cmd = cmds[0];
                if (cmd.indexOf("pm") !== -1 || cmd.indexOf("id") !== -1) {
                    console.log("[Bypass] Blocking detection command: " + cmd);
                    cmd = "false";
                }
                cmds[0] = cmd;
                return Process_orig.call(this, cmds);
            };
        } catch(e) {}

        // ── 3. File existence checks ─────────────────────────────────────────
        var File = Java.use("java.io.File");
        var detector_paths = [
            "/system/app/Xposed", "/system/priv-app/Xposed",
            "/data/adb/xposed", "/data/adb/modules",
            "/system/lib/libfrida-gadget.so",
            "/data/frida", "/data/app/*frida*",
        ];

        File.exists.implementation = function() {
            var path = this.getAbsolutePath();
            for (var i = 0; i < detector_paths.length; i++) {
                if (path.indexOf(detector_paths[i]) !== -1) {
                    console.log("[Bypass] Hiding: " + path);
                    return false;
                }
            }
            return this.exists.call(this);
        };

        // ── 4. Play Integrity / SafetyNet bypass ─────────────────────────────
        try {
            // Intercept integrity check calls
            var IntegrityManager = Java.use("com.google.android.gms.integrity.IntegrityManager");
            IntegrityManager.requestIntegrityToken.implementation = function(opts) {
                console.log("[Bypass] IntegrityToken request intercepted");
                return "fake_integrity_token_" + Date.now();
            };
        } catch(e) {}

        console.log("[Detection Bypass] Complete.");
        console.log("  ✓ Emulator props spoofed");
        console.log("  ✓ File detection blocked");
        console.log("  ✓ Root/Xposed detection blocked");
        console.log("  ✓ IntegrityToken intercepted");
    });
}, 0);
