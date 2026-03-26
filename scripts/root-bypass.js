/**
 * root-bypass.js
 * Hide root from Android app detection
 * Covers: file checks, package checks, RootBeer, exec("su"), build props
 * Usage: frida -U -f com.example.app -l root-bypass.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Root Bypass] Starting...");

        var ROOT_PATHS = [
            "/system/app/Superuser.apk", "/sbin/su", "/system/bin/su",
            "/system/xbin/su", "/data/local/xbin/su", "/data/local/bin/su",
            "/system/sd/xbin/su", "/system/bin/failsafe/su", "/data/local/tmp/su",
            "/dev/com.koushikdutta.superuser.daemon", "/system/etc/init.d/99SuperSUDaemon",
            "/data/adb/magisk", "/sbin/.magisk", "/sbin/magisk",
        ];

        var ROOT_PACKAGES = [
            "com.topjohnwu.magisk", "com.noshufou.android.su",
            "eu.chainfire.supersu", "com.koushikdutta.superuser",
            "com.thirdparty.superuser", "com.yellowes.su",
            "com.kingroot.kinguser", "com.kingo.root", "com.smedialink.oneclickroot",
        ];

        // ── 1. File.exists() — block su and magisk paths ─────────────────────
        var File = Java.use("java.io.File");
        File.exists.implementation = function() {
            var path = this.getAbsolutePath();
            for (var i = 0; i < ROOT_PATHS.length; i++) {
                if (path === ROOT_PATHS[i]) {
                    console.log("[Root] Hiding file: " + path);
                    return false;
                }
            }
            return this.exists.call(this);
        };

        // ── 2. PackageManager.getPackageInfo() — hide root apps ──────────────
        var PackageManager = Java.use("android.app.ApplicationPackageManager");
        PackageManager.getPackageInfo.overload("java.lang.String", "int")
            .implementation = function(pkgName, flags) {
                for (var i = 0; i < ROOT_PACKAGES.length; i++) {
                    if (pkgName === ROOT_PACKAGES[i]) {
                        console.log("[Root] Hiding package: " + pkgName);
                        throw Java.use("android.content.pm.PackageManager$NameNotFoundException").$new(pkgName);
                    }
                }
                return this.getPackageInfo.call(this, pkgName, flags);
            };

        // ── 3. Runtime.exec("su") — make it fail ─────────────────────────────
        var Runtime = Java.use("java.lang.Runtime");
        Runtime.exec.overload("java.lang.String").implementation = function(cmd) {
            if (cmd.indexOf("su") !== -1 || cmd.indexOf("which") !== -1) {
                console.log("[Root] Blocking exec: " + cmd);
                cmd = "false"; // always fails
            }
            return this.exec.call(this, cmd);
        };
        Runtime.exec.overload("[Ljava.lang.String;").implementation = function(cmds) {
            for (var i = 0; i < cmds.length; i++) {
                if (cmds[i] && (cmds[i].indexOf("su") !== -1)) {
                    console.log("[Root] Blocking exec array: " + cmds[i]);
                    cmds[i] = "false";
                }
            }
            return this.exec.call(this, cmds);
        };

        // ── 4. System.getProperty for build props ────────────────────────────
        var System = Java.use("java.lang.System");
        System.getProperty.overload("java.lang.String").implementation = function(key) {
            var val = this.getProperty.call(this, key);
            if (key === "ro.build.tags" && val && val.indexOf("test-keys") !== -1) {
                console.log("[Root] Spoofing ro.build.tags");
                return "release-keys";
            }
            return val;
        };

        // ── 5. RootBeer library ───────────────────────────────────────────────
        try {
            var RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
            ["isRooted", "isRootedWithoutBusyBox", "detectRootManagementApps",
             "detectPotentiallyDangerousApps", "checkForBinary", "detectTestKeys",
             "checkForDangerousProps", "checkForRWPaths", "detectRootCloakingApps",
             "checkSuExists", "checkForRootNative"
            ].forEach(function(method) {
                try {
                    RootBeer[method].implementation = function() {
                        console.log("[Root] RootBeer." + method + " -> false");
                        return false;
                    };
                } catch(e) {}
            });
        } catch(e) {}

        console.log("[Root Bypass] Complete.");
    });
}, 0);
