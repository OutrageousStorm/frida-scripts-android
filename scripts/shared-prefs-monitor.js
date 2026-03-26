/**
 * shared-prefs-monitor.js
 * Monitor all SharedPreferences reads and writes in real time
 * Usage: frida -U -f com.example.app -l shared-prefs-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[SharedPrefs Monitor] Active\n");

        var SharedPreferencesImpl = Java.use("android.app.SharedPreferencesImpl");
        var EditorImpl = Java.use("android.app.SharedPreferencesImpl$EditorImpl");

        // Monitor reads
        ["getString", "getInt", "getLong", "getFloat", "getBoolean"].forEach(function(method) {
            try {
                SharedPreferencesImpl[method].overload("java.lang.String", method === "getString" ? "java.lang.String" : method === "getBoolean" ? "boolean" : method === "getFloat" ? "float" : "int")
                    .implementation = function(key, defVal) {
                        var result = this[method].call(this, key, defVal);
                        if (result !== defVal) {  // only log if not returning default
                            console.log("[SharedPrefs GET] " + key + " = " + result);
                        }
                        return result;
                    };
            } catch(e) {}
        });

        // Monitor writes
        ["putString", "putInt", "putLong", "putFloat", "putBoolean"].forEach(function(method) {
            try {
                EditorImpl[method].overload("java.lang.String",
                    method === "putString" ? "java.lang.String" : method === "putBoolean" ? "boolean" : method === "putFloat" ? "float" : "int"
                ).implementation = function(key, value) {
                    console.log("[SharedPrefs PUT] " + key + " = " + value);
                    return this[method].call(this, key, value);
                };
            } catch(e) {}
        });

        // Monitor removes
        EditorImpl.remove.implementation = function(key) {
            console.log("[SharedPrefs REMOVE] " + key);
            return this.remove.call(this, key);
        };

        EditorImpl.clear.implementation = function() {
            console.log("[SharedPrefs CLEAR ALL]");
            return this.clear.call(this);
        };

        console.log("[SharedPrefs Monitor] Watching all reads and writes...");
    });
}, 0);
