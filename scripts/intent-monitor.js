/**
 * intent-monitor.js
 * Log all Android Intents sent and received
 * Usage: frida -U -f com.example.app -l intent-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Intent Monitor] Active\n");

        var Activity = Java.use("android.app.Activity");
        var Context = Java.use("android.content.Context");

        function logIntent(label, intent) {
            try {
                var action = intent.getAction() || "(no action)";
                var component = intent.getComponent();
                var target = component ? component.flattenToShortString() : "(implicit)";
                var data = intent.getDataString() || "";
                var extras = intent.getExtras();
                console.log("\n[Intent] " + label);
                console.log("  Action:    " + action);
                console.log("  Target:    " + target);
                if (data) console.log("  Data:      " + data);
                if (extras) {
                    var keys = extras.keySet().toArray();
                    for (var i = 0; i < keys.length; i++) {
                        var k = keys[i];
                        try { console.log("  Extra:     " + k + " = " + extras.get(k)); } catch(e) {}
                    }
                }
            } catch(e) {}
        }

        // startActivity
        Activity.startActivity.overload("android.content.Intent").implementation = function(intent) {
            logIntent("startActivity", intent);
            return this.startActivity.call(this, intent);
        };

        // startActivityForResult
        Activity.startActivityForResult.overload("android.content.Intent", "int")
            .implementation = function(intent, requestCode) {
                logIntent("startActivityForResult (code=" + requestCode + ")", intent);
                return this.startActivityForResult.call(this, intent, requestCode);
            };

        // sendBroadcast
        Context.sendBroadcast.overload("android.content.Intent").implementation = function(intent) {
            logIntent("sendBroadcast", intent);
            return this.sendBroadcast.call(this, intent);
        };

        // startService
        Context.startService.overload("android.content.Intent").implementation = function(intent) {
            logIntent("startService", intent);
            return this.startService.call(this, intent);
        };

        console.log("[Intent Monitor] Watching startActivity, sendBroadcast, startService...");
    });
}, 0);
