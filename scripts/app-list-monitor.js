/**
 * app-list-monitor.js
 * Monitor app installations and uninstallations in real time
 * Usage: frida -U -f com.android.systemui -l scripts/app-list-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[App Monitor] Active\n");

        var PackageManager = Java.use("android.app.ApplicationPackageManager");
        
        // Hook getPackageInfo for uninstall checks
        PackageManager.getPackageInfo.overload("java.lang.String", "int")
            .implementation = function(pkgName, flags) {
                try {
                    return this.getPackageInfo.call(this, pkgName, flags);
                } catch(e) {
                    if (e.toString().indexOf("NameNotFoundException") !== -1) {
                        console.log("[App Uninstall] " + pkgName);
                    }
                    throw e;
                }
            };

        // Monitor pm install via installd
        try {
            var PMS = Java.use("com.android.server.pm.PackageManagerService");
            PMS.installStage.implementation = function() {
                console.log("[App Install] Package installation initiated");
                return this.installStage.apply(this, arguments);
            };
        } catch(e) {}

        console.log("[App Monitor] Watching package changes...");
    });
}, 0);
