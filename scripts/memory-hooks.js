/**
 * memory-hooks.js
 * Monitor memory allocations and track potential memory leaks
 * Usage: frida -U -f com.example.app -l memory-hooks.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Memory Hooks] Starting allocation tracking...\n");

        var allocs = {};
        var totalAllocated = 0;

        // Hook ByteBuffer.allocate
        var ByteBuffer = Java.use("java.nio.ByteBuffer");
        ByteBuffer.allocate.overload("int").implementation = function(size) {
            totalAllocated += size;
            console.log(`[ByteBuffer] Allocated ${size} bytes (total: ${totalAllocated})`);
            return this.allocate.call(this, size);
        };

        // Hook array allocations (byte[], char[], etc)
        var Runtime = Java.use("java.lang.Runtime");
        var origTotalMemory = Runtime.getRuntime().totalMemory;
        Runtime.getRuntime().totalMemory.implementation = function() {
            var total = origTotalMemory.call(this);
            var free = this.freeMemory();
            var used = total - free;
            console.log(`[Memory] Total: ${(total/1024/1024).toFixed(1)}MB, Used: ${(used/1024/1024).toFixed(1)}MB, Free: ${(free/1024/1024).toFixed(1)}MB`);
            return total;
        };

        // Hook ArrayList operations (common memory leak source)
        var ArrayList = Java.use("java.util.ArrayList");
        var addOrig = ArrayList.add.overload("java.lang.Object");
        ArrayList.add.overload("java.lang.Object").implementation = function(obj) {
            if (this.size() > 1000) {
                console.log(`[ArrayList WARNING] Large list detected: ${this.size()} items`);
            }
            return addOrig.call(this, obj);
        };

        // Hook HashMap (another leak source)
        var HashMap = Java.use("java.util.HashMap");
        HashMap.put.overload("java.lang.Object", "java.lang.Object").implementation = function(key, value) {
            if (this.size() % 1000 === 0) {
                console.log(`[HashMap] Size: ${this.size()}`);
            }
            return HashMap.put.call(this, key, value);
        };

        // Monitor garbage collection
        var Runtime = Java.use("java.lang.Runtime");
        var gc = Runtime.getRuntime().gc;
        Runtime.getRuntime().gc.overload().implementation = function() {
            console.log("[GC] Garbage collection triggered");
            return gc.call(this);
        };

        console.log("[Memory Hooks] Ready. Monitoring allocations...");
    });
}, 0);
