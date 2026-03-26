/**
 * crypto-hook.js
 * Log all AES, RSA, and DES crypto operations
 * Usage: frida -U -f com.example.app -l crypto-hook.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Crypto Hook] Active. Monitoring cipher operations...\n");

        var Cipher = Java.use("javax.crypto.Cipher");

        // Hook getInstance to log algorithm requests
        Cipher.getInstance.overload("java.lang.String").implementation = function(algo) {
            console.log("[Cipher.getInstance] Algorithm: " + algo);
            return this.getInstance.call(this, algo);
        };

        // Hook doFinal (single-part)
        Cipher.doFinal.overload("[B").implementation = function(input) {
            var mode = this.getAlgorithm();
            var opmode = this.toString().indexOf("encrypt") !== -1 ? "ENCRYPT" : "DECRYPT";
            console.log("\n[Cipher.doFinal] " + mode);
            console.log("  Input  (" + input.length + " bytes): " + bytesToHex(input).substring(0, 64) + (input.length > 32 ? "..." : ""));
            var result = this.doFinal.call(this, input);
            console.log("  Output (" + result.length + " bytes): " + bytesToHex(result).substring(0, 64) + (result.length > 32 ? "..." : ""));
            return result;
        };

        // Hook SecretKeySpec to capture keys
        var SecretKeySpec = Java.use("javax.crypto.spec.SecretKeySpec");
        SecretKeySpec.$init.overload("[B", "java.lang.String").implementation = function(key, algo) {
            console.log("\n[SecretKeySpec] Algorithm: " + algo);
            console.log("  Key (" + key.length + " bytes): " + bytesToHex(key));
            return this.$init.call(this, key, algo);
        };

        // Hook IvParameterSpec to capture IVs
        var IvParameterSpec = Java.use("javax.crypto.spec.IvParameterSpec");
        IvParameterSpec.$init.overload("[B").implementation = function(iv) {
            console.log("[IvParameterSpec] IV: " + bytesToHex(iv));
            return this.$init.call(this, iv);
        };

        // Hook MessageDigest for hashing
        var MessageDigest = Java.use("java.security.MessageDigest");
        MessageDigest.digest.overload("[B").implementation = function(input) {
            var algo = this.getAlgorithm();
            var result = this.digest.call(this, input);
            console.log("[MessageDigest] " + algo + " -> " + bytesToHex(result));
            return result;
        };

        function bytesToHex(bytes) {
            var hex = "";
            for (var i = 0; i < bytes.length; i++) {
                hex += ("0" + (bytes[i] & 0xff).toString(16)).slice(-2);
            }
            return hex;
        }

        console.log("[Crypto Hook] Ready. Waiting for crypto operations...");
    });
}, 0);
