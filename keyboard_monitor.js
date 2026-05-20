/**
 * keyboard_monitor.js — Monitor all keyboard input on Android
 * Detects text input, password fields, and sensitive data
 * Usage: frida -U -l keyboard_monitor.js --no-pause
 */
Java.perform(() => {
    const InputMethodManager = Java.use('android.view.inputmethod.InputMethodManager');
    const EditText = Java.use('android.widget.EditText');
    
    // Hook EditText setText() to capture input
    EditText.setText.overload('java.lang.CharSequence').implementation = function(text) {
        console.log('[INPUT] ' + text);
        return this.setText(text);
    };
    
    // Capture password input
    EditText.setInputType.implementation = function(type) {
        if ((type & 0x80) != 0) { // TYPE_TEXT_VARIATION_PASSWORD
            console.log('[PASSWORD_FIELD] Detected');
        }
        return this.setInputType(type);
    };
    
    console.log('[+] Keyboard monitor active');
});
