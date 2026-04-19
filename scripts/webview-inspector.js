/**
 * webview-inspector.js
 * Monitor all WebView loads, injections, and JavaScript execution
 * Usage: frida -U -f com.example.app -l scripts/webview-inspector.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[WebView Inspector] Starting...\n");

        var WebView = Java.use("android.webkit.WebView");
        var WebViewClient = Java.use("android.webkit.WebViewClient");
        var WebChromeClient = Java.use("android.webkit.WebChromeClient");

        // Hook loadUrl
        WebView.loadUrl.overload("java.lang.String").implementation = function(url) {
            console.log("[WebView] loadUrl: " + url);
            return this.loadUrl.call(this, url);
        };

        WebView.loadUrl.overload("java.lang.String", "java.util.Map").implementation = function(url, headers) {
            console.log("[WebView] loadUrl: " + url + " (with headers)");
            return this.loadUrl.call(this, url, headers);
        };

        // Hook loadData (inline HTML)
        WebView.loadData.overload("java.lang.String", "java.lang.String", "java.lang.String")
            .implementation = function(data, mimeType, encoding) {
                var preview = data.substring(0, 100).replace(/\n/g, " ");
                console.log("[WebView] loadData: " + mimeType);
                console.log("  Preview: " + preview);
                return this.loadData.call(this, data, mimeType, encoding);
            };

        // Hook evaluateJavascript (JS injection)
        WebView.evaluateJavascript.overload("java.lang.String", "android.webkit.ValueCallback")
            .implementation = function(js, callback) {
                console.log("[WebView] evaluateJavascript:");
                console.log("  Code: " + js.substring(0, 150));
                return this.evaluateJavascript.call(this, js, callback);
            };

        // Hook shouldOverrideUrlLoading
        WebViewClient.shouldOverrideUrlLoading.overload("android.webkit.WebView", "java.lang.String")
            .implementation = function(view, url) {
                console.log("[WebView] shouldOverrideUrlLoading: " + url);
                return this.shouldOverrideUrlLoading.call(this, view, url);
            };

        // Hook onConsoleMessage (JS console.log from page)
        WebChromeClient.onConsoleMessage.overload(
            "java.lang.String", "int", "java.lang.String"
        ).implementation = function(message, lineNumber, sourceID) {
            console.log("[JS Console] [" + sourceID + ":" + lineNumber + "] " + message);
            return this.onConsoleMessage.call(this, message, lineNumber, sourceID);
        };

        console.log("[WebView Inspector] Ready. Monitoring all WebView activity...");
    });
}, 0);
