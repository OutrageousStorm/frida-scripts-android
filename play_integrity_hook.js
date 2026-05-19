/**
 * play_integrity_hook.js
 * Hooks Google Play Integrity API calls to log verdicts and optionally patch them
 * 
 * Inspired by: stopping automated bot detection
 * 
 * Usage:
 *   frida -U -f com.target.app -l play_integrity_hook.js --no-pause
 *
 * What it does:
 *   - Hooks IntegrityManager.requestIntegrityToken()
 *   - Logs the integrity verdict JSON when it returns
 *   - Optionally patches the verdict to return MEETS_STRONG_INTEGRITY
 */

'use strict';

const PATCH_VERDICT = false; // Set true to patch verdict responses

Java.perform(() => {
  console.log('[+] Play Integrity hook loaded');

  // Hook IntegrityManager
  try {
    const IntegrityManagerImpl = Java.use('com.google.android.play.core.integrity.IntegrityManagerImpl');
    
    IntegrityManagerImpl.requestIntegrityToken.overload(
      'com.google.android.play.core.integrity.IntegrityTokenRequest'
    ).implementation = function(request) {
      console.log('\n[INTEGRITY] requestIntegrityToken() called');
      console.log('[INTEGRITY] Nonce: ' + request.nonce());
      
      const task = this.requestIntegrityToken(request);
      return task;
    };
  } catch (e) {
    console.log('[!] IntegrityManagerImpl not found: ' + e.message);
  }

  // Hook the token response listener
  try {
    const OnSuccessListener = Java.use('com.google.android.gms.tasks.OnSuccessListener');
    
    // Hook JWT decode to intercept verdict
    const Base64 = Java.use('android.util.Base64');
    const String = Java.use('java.lang.String');
    
    // Monitor all Base64 decode calls for JWT payloads
    Base64.decode.overload('[B', 'int').implementation = function(input, flags) {
      const result = this.decode(input, flags);
      try {
        const decoded = String.$new(result, 'UTF-8');
        if (decoded.includes('deviceIntegrity') || decoded.includes('appIntegrity') || decoded.includes('accountDetails')) {
          console.log('\n[VERDICT] Integrity token payload:');
          console.log(decoded);
          
          if (PATCH_VERDICT) {
            // Patch verdict — replace MEETS_DEVICE_INTEGRITY with MEETS_STRONG_INTEGRITY
            const patched = decoded
              .replace(/"deviceRecognitionVerdict":\s*\[[^\]]*\]/g, 
                       '"deviceRecognitionVerdict":["MEETS_DEVICE_INTEGRITY","MEETS_STRONG_INTEGRITY"]')
              .replace(/"appRecognitionVerdict":\s*"[^"]*"/g,
                       '"appRecognitionVerdict":"PLAY_RECOGNIZED"');
            console.log('[PATCH] Verdict patched to strong integrity');
            return String.$new(patched).getBytes('UTF-8');
          }
        }
      } catch(_) {}
      return result;
    };
  } catch (e) {
    console.log('[!] Base64 hook failed: ' + e.message);
  }

  // Also hook SafetyNet (legacy)
  try {
    const SafetyNetApi = Java.use('com.google.android.gms.safetynet.SafetyNetApi');
    console.log('[+] SafetyNet API found — monitoring attest() calls');
    
    const SafetyNetClient = Java.use('com.google.android.gms.safetynet.SafetyNetClient');
    SafetyNetClient.attest.overload('[B', 'java.lang.String').implementation = function(nonce, apiKey) {
      console.log('\n[SAFETYNET] attest() called');
      console.log('[SAFETYNET] API key: ' + apiKey);
      console.log('[SAFETYNET] Nonce: ' + Java.use('android.util.Base64').encodeToString(nonce, 0));
      return this.attest(nonce, apiKey);
    };
  } catch (e) {
    console.log('[!] SafetyNet not found (may be using Play Integrity only)');
  }

  // Log all HTTP requests to integrity endpoints
  try {
    const URL = Java.use('java.net.URL');
    URL.$init.overload('java.lang.String').implementation = function(url) {
      if (url && (url.includes('play-integrity') || url.includes('safetynet') || url.includes('attestation'))) {
        console.log('[NET] Integrity endpoint: ' + url);
      }
      return this.$init(url);
    };
  } catch(e) {}

  console.log('[+] All hooks active. Waiting for integrity checks...\n');
});
