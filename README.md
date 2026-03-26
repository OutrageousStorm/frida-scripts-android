# 💉 Frida Scripts for Android

Drop-in Frida scripts for Android security research. All tested on Android 10–15.

## Usage

```bash
# Attach to running app
frida -U -n "com.example.app" -l scripts/ssl-bypass.js

# Spawn app with script
frida -U -f com.example.app -l scripts/ssl-bypass.js --no-pause

# Multi-script
frida -U -f com.example.app -l scripts/ssl-bypass.js -l scripts/root-bypass.js --no-pause
```

## Scripts

| Script | What it does |
|--------|-------------|
| `ssl-bypass.js` | Bypass all SSL/TLS certificate pinning |
| `root-bypass.js` | Hide root from detection methods |
| `crypto-hook.js` | Log all AES/RSA encryption/decryption operations |
| `intent-monitor.js` | Log all Intents sent/received |
| `api-tracer.js` | Trace all calls to a class or method |
| `keystore-dump.js` | Dump Keystore entries and secrets |
| `shared-prefs-monitor.js` | Watch SharedPreferences reads/writes |
| `http-logger.js` | Log all HTTP/HTTPS requests and responses |

## Requirements
```bash
pip install frida-tools
# frida-server running on device (rooted)
# https://github.com/frida/frida/releases
```
