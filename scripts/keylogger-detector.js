/**
 * keylogger-detector.js
 * Detect and block attempts to hook keyboard input (potential spyware)
 * Usage: frida -U -f com.example.app -l keylogger-detector.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Keylogger Detector] Active");

        var InputMethodManager = Java.use("android.view.inputmethod.InputMethodManager");
        var View = Java.use("android.view.View");
        var EditText = Java.use("android.widget.EditText");

        // Monitor all input handling
        View.setOnKeyListener.implementation = function(listener) {
            console.log("[INPUT] setOnKeyListener attached to " + this.getClass().getName());
            console.log("  Listener: " + listener.getClass().getName());
            return this.setOnKeyListener.call(this, listener);
        };

        // Watch for input capture via TextWatcher
        var TextWatcher = Java.use("android.text.TextWatcher");
        EditText.addTextChangedListener.implementation = function(watcher) {
            console.log("[INPUT] TextWatcher attached");
            console.log("  Class: " + watcher.getClass().getName());
            if (watcher.getClass().getName().indexOf("app") !== -1) {
                console.log("  ^ Local app listener (OK)");
            } else {
                console.log("  ^ Third-party listener (SUSPICIOUS)");
            }
            return this.addTextChangedListener.call(this, watcher);
        };

        // Monitor key events globally
        View.onKeyDown.implementation = function(keyCode, event) {
            // Only log arrow/function keys, not every keystroke
            if (keyCode == 23 || keyCode == 66) { // dpad_center, enter
                console.log("[KEYLOG] Key " + keyCode + " pressed in " + this.getClass().getName());
            }
            return this.onKeyDown.call(this, keyCode, event);
        };

        // Watch for native input via JNI (C/C++ spyware often uses this)
        try {
            var Runtime = Java.use("java.lang.Runtime");
            Runtime.loadLibrary.implementation = function(lib) {
                if (lib.indexOf("input") !== -1 || lib.indexOf("key") !== -1 || 
                    lib.indexOf("logger") !== -1 || lib.indexOf("hook") !== -1) {
                    console.log("[WARNING] Suspicious native library loaded: " + lib);
                }
                return this.loadLibrary.call(this, lib);
            };
        } catch(e) {}

        console.log("[Keylogger Detector] Ready. Will alert on input hook attempts.");
    });
}, 0);
