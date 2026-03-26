/**
 * http-logger.js
 * Log all HTTP/HTTPS requests and responses
 * Covers: OkHttp3, HttpURLConnection, Retrofit
 * Usage: frida -U -f com.example.app -l http-logger.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[HTTP Logger] Active\n");

        // ── OkHttp3 RealCall ─────────────────────────────────────────────────
        try {
            var RealCall = Java.use("okhttp3.internal.connection.RealCall");
            RealCall.execute.implementation = function() {
                var request = this.request();
                var url = request.url().toString();
                var method = request.method();
                var body = "";
                try {
                    if (request.body() !== null) {
                        var Buffer = Java.use("okio.Buffer");
                        var buf = Buffer.$new();
                        request.body().writeTo(buf);
                        body = buf.readUtf8();
                    }
                } catch(e) {}
                console.log("\n[HTTP] >> " + method + " " + url);
                if (body.length > 0) console.log("  Body: " + body.substring(0, 500));

                var response = this.execute.call(this);
                try {
                    var respBody = response.peekBody(1024 * 50);
                    console.log("[HTTP] << " + response.code() + " " + response.message());
                    if (respBody) console.log("  Response: " + respBody.string().substring(0, 500));
                } catch(e) {}
                return response;
            };
        } catch(e) {}

        // ── HttpURLConnection ────────────────────────────────────────────────
        try {
            var URL = Java.use("java.net.URL");
            URL.openConnection.overload().implementation = function() {
                console.log("\n[HTTP] URL.openConnection: " + this.toString());
                return this.openConnection.call(this);
            };
        } catch(e) {}

        // ── WebView requests ─────────────────────────────────────────────────
        try {
            var WebViewClient = Java.use("android.webkit.WebViewClient");
            WebViewClient.shouldInterceptRequest.overload(
                "android.webkit.WebView", "android.webkit.WebResourceRequest"
            ).implementation = function(view, request) {
                console.log("[WebView] " + request.getMethod() + " " + request.getUrl().toString());
                return this.shouldInterceptRequest.call(this, view, request);
            };
        } catch(e) {}

        console.log("[HTTP Logger] Hooks installed. Waiting for requests...");
    });
}, 0);
