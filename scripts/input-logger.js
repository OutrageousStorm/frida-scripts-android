/**
 * input-logger.js
 * Log all user input (text, keys, touches) — for research/debugging
 * Usage: frida -U -f com.example.app -l input-logger.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Input Logger] Starting...\n");

        // ── TextWatcher (EditText input) ──────────────────────────────────
        var TextWatcher = Java.use("android.text.TextWatcher");
        var onTextChanged = Java.use("android.text.TextWatcher").onTextChanged;

        try {
            var EditText = Java.use("android.widget.EditText");
            EditText.setText.overload("java.lang.CharSequence").implementation = function(text) {
                console.log("[EditText.setText] " + text);
                return this.setText.call(this, text);
            };

            EditText.append.overload("java.lang.CharSequence").implementation = function(text) {
                console.log("[EditText.append] " + text);
                return this.append.call(this, text);
            };
        } catch(e) {}

        // ── KeyEvent logging ──────────────────────────────────────────────
        try {
            var InputMethodManager = Java.use("android.view.inputmethod.InputMethodManager");
            InputMethodManager.showSoftInput.implementation = function(view, flags) {
                console.log("[InputMethodManager] showSoftInput");
                return this.showSoftInput.call(this, view, flags);
            };
        } catch(e) {}

        // ── KeyCharacterMap (keyboard input) ──────────────────────────────
        try {
            var KeyEvent = Java.use("android.view.KeyEvent");
            var KeyCharacterMap = Java.use("android.view.KeyCharacterMap");
            
            KeyCharacterMap.getMatch.overload("int", "[I").implementation = function(keyCode, chars) {
                var matched = this.getMatch.call(this, keyCode, chars);
                console.log("[KeyEvent] keyCode=" + keyCode + " matched=" + matched);
                return matched;
            };
        } catch(e) {}

        // ── Touch/Tap logging ─────────────────────────────────────────────
        try {
            var MotionEvent = Java.use("android.view.MotionEvent");
            var View = Java.use("android.view.View");
            
            View.onTouchEvent.overload("android.view.MotionEvent").implementation = function(event) {
                var x = event.getX();
                var y = event.getY();
                var action = event.getAction();
                var actions = ["DOWN", "UP", "MOVE", "CANCEL", "OUTSIDE", "POINTER_DOWN", "POINTER_UP"];
                var actionName = actions[action] || "UNKNOWN";
                console.log("[Touch] " + actionName + " @ (" + x + ", " + y + ")");
                return this.onTouchEvent.call(this, event);
            };
        } catch(e) {}

        // ── Clipboard paste ───────────────────────────────────────────────
        try {
            var ClipboardManager = Java.use("android.content.ClipboardManager");
            ClipboardManager.getPrimaryClip.implementation = function() {
                var clip = this.getPrimaryClip.call(this);
                if (clip && clip.getItemAt(0)) {
                    var text = clip.getItemAt(0).getText();
                    console.log("[Clipboard] Pasted: " + text);
                }
                return clip;
            };
        } catch(e) {}

        console.log("[Input Logger] Hooks installed. Monitoring input...");
    });
}, 0);
