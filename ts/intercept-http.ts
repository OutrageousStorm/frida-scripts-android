/**
 * intercept-http.ts -- Intercept HTTP/HTTPS traffic via Frida (TypeScript)
 * Compile: tsc intercept-http.ts --target es2020 --module commonjs
 * Usage: frida -U -f com.example.app -l _agent.js
 */

const Interceptor = Java.use("javax.net.ssl.HttpsURLConnection");

Interceptor.getInputStream.implementation = function() {
    const url = this.getURL().toString();
    const method = this.getRequestMethod();
    
    console.log(`[HTTP] ${method} ${url}`);
    
    const headers = this.getHeaderFields();
    if (headers) {
        Object.keys(headers).forEach((key: string) => {
            console.log(`  ${key}: ${headers[key]}`);
        });
    }
    
    return this.getInputStream();
};

console.log("[HTTP Interceptor] Loaded");
