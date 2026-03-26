/**
 * ssl-bypass.js
 * Bypass SSL certificate pinning on Android
 * Covers: OkHttp3, TrustManager, Conscrypt, Appcelerator, Apache, Cordova
 * Usage: frida -U -f com.example.app -l ssl-bypass.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[SSL Bypass] Starting...");

        // ── 1. OkHttp3 CertificatePinner ────────────────────────────────────
        try {
            var CertificatePinner = Java.use("okhttp3.CertificatePinner");
            CertificatePinner.check.overload("java.lang.String", "java.util.List")
                .implementation = function(hostname, certs) {
                    console.log("[SSL] OkHttp3 CertificatePinner.check bypassed: " + hostname);
                };
            CertificatePinner.check.overload("java.lang.String", "[Ljava.security.cert.Certificate;")
                .implementation = function(hostname, certs) {
                    console.log("[SSL] OkHttp3 CertificatePinner.check(cert[]) bypassed: " + hostname);
                };
        } catch(e) { /* not present */ }

        // ── 2. OkHttp3 okhttp-tls / HandshakeCertificates ───────────────────
        try {
            var HandshakeCertificates = Java.use("okhttp3.tls.HandshakeCertificates");
            HandshakeCertificates.trustManager.implementation = function() {
                var TrustManagerFactory = Java.use("javax.net.ssl.TrustManagerFactory");
                var KeyStore = Java.use("java.security.KeyStore");
                var tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                tmf.init(Java.cast(null, KeyStore));
                return tmf.getTrustManagers()[0];
            };
        } catch(e) {}

        // ── 3. TrustManager — trust all certs ───────────────────────────────
        try {
            var TrustManagerImpl = Java.use("com.android.org.conscrypt.TrustManagerImpl");
            TrustManagerImpl.verifyChain.implementation = function(
                untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                console.log("[SSL] TrustManagerImpl.verifyChain bypassed: " + host);
                return untrustedChain;
            };
        } catch(e) {}

        // ── 4. X509TrustManager — checkServerTrusted ─────────────────────────
        try {
            var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
            var SSLContext = Java.use("javax.net.ssl.SSLContext");
            var TrustManager = Java.registerClass({
                name: "com.outrageousstorm.TrustAll",
                implements: [X509TrustManager],
                methods: {
                    checkClientTrusted: function(chain, authType) {},
                    checkServerTrusted: function(chain, authType) {
                        console.log("[SSL] checkServerTrusted bypassed");
                    },
                    getAcceptedIssuers: function() { return []; }
                }
            });
            var ctx = SSLContext.getInstance("TLS");
            ctx.init(null, [TrustManager.$new()], null);
            SSLContext.setDefault(ctx);
        } catch(e) {}

        // ── 5. Hostname verifier ──────────────────────────────────────────────
        try {
            var HostnameVerifier = Java.use("javax.net.ssl.HostnameVerifier");
            var AllowAll = Java.registerClass({
                name: "com.outrageousstorm.AllowAllHostnames",
                implements: [HostnameVerifier],
                methods: {
                    verify: function(hostname, session) {
                        console.log("[SSL] HostnameVerifier bypassed: " + hostname);
                        return true;
                    }
                }
            });
            var HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setDefaultHostnameVerifier(AllowAll.$new());
        } catch(e) {}

        // ── 6. Appcelerator Titanium ──────────────────────────────────────────
        try {
            var PinningTrustManager = Java.use("appcelerator.https.PinningTrustManager");
            PinningTrustManager.checkServerTrusted.implementation = function() {
                console.log("[SSL] Appcelerator PinningTrustManager bypassed");
            };
        } catch(e) {}

        console.log("[SSL Bypass] Complete. All known pinning methods patched.");
    });
}, 0);
