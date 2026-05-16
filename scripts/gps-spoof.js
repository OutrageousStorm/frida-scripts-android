/**
 * gps-spoof.js
 * Spoof GPS location to a specific coordinate
 * Usage: frida -U -f com.example.app -l gps-spoof.js --no-pause
 * Set TARGET_LAT and TARGET_LNG below
 */

var TARGET_LAT = 40.7128;  // New York
var TARGET_LNG = -74.0060;
var TARGET_ACCURACY = 5.0;

setTimeout(function() {
    Java.perform(function() {
        console.log("[GPS Spoof] Target: " + TARGET_LAT + ", " + TARGET_LNG);

        // Hook Location class
        var Location = Java.use("android.location.Location");
        
        Location.getLatitude.implementation = function() {
            console.log("[GPS] getLatitude() -> " + TARGET_LAT);
            return TARGET_LAT;
        };
        
        Location.getLongitude.implementation = function() {
            console.log("[GPS] getLongitude() -> " + TARGET_LNG);
            return TARGET_LNG;
        };

        Location.getAccuracy.implementation = function() {
            return TARGET_ACCURACY;
        };

        Location.getAltitude.implementation = function() {
            return 0.0;
        };

        // Hook LocationListener callbacks
        var LocationListener = Java.use("android.location.LocationListener");
        LocationListener.onLocationChanged.implementation = function(loc) {
            console.log("[GPS Callback] Location changed");
            loc.setLatitude(TARGET_LAT);
            loc.setLongitude(TARGET_LNG);
            return this.onLocationChanged.call(this, loc);
        };

        console.log("[GPS Spoof] Active");
    });
}, 0);
