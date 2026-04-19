/**
 * database-monitor.js
 * Monitor SQLite database reads and writes in real time
 * Usage: frida -U -f com.example.app -l scripts/database-monitor.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Database Monitor] Active\n");

        var DatabaseUtils = Java.use("android.database.DatabaseUtils");
        var SQLiteDatabase = Java.use("android.database.sqlite.SQLiteDatabase");
        var SQLiteQuery = Java.use("android.database.sqlite.SQLiteQuery");

        // Monitor SQLiteDatabase.openDatabase
        SQLiteDatabase.openDatabase.overload(
            "java.lang.String", "android.database.sqlite.SQLiteDatabase$CursorFactory",
            "int", "android.database.DatabaseErrorHandler"
        ).implementation = function(path, factory, flags, handler) {
            console.log("[SQLite] Opening database: " + path);
            return this.openDatabase.call(this, path, factory, flags, handler);
        };

        // Monitor rawQuery (SELECT)
        SQLiteDatabase.rawQuery.overload(
            "java.lang.String", "[Ljava.lang.String;"
        ).implementation = function(sql, selectionArgs) {
            console.log("[SQLite Query] " + sql.substring(0, 100));
            if (selectionArgs && selectionArgs.length > 0) {
                console.log("  Args: " + JSON.stringify(selectionArgs.slice(0, 3)));
            }
            return this.rawQuery.call(this, sql, selectionArgs);
        };

        // Monitor execSQL (INSERT/UPDATE/DELETE)
        SQLiteDatabase.execSQL.overload("java.lang.String").implementation = function(sql) {
            console.log("[SQLite Exec] " + sql.substring(0, 100));
            return this.execSQL.call(this, sql);
        };

        // Monitor query (via ContentProvider)
        SQLiteDatabase.query.overload(
            "java.lang.String", "[Ljava.lang.String;", "java.lang.String",
            "[Ljava.lang.String;", "java.lang.String", "java.lang.String", "java.lang.String"
        ).implementation = function(table, columns, selection, args, groupBy, having, orderBy) {
            var colStr = columns ? columns.slice(0,3).join(",") : "*";
            console.log("[SQLite Table] " + table + " (" + colStr + ")");
            if (selection) console.log("  WHERE: " + selection);
            return this.query.call(this, table, columns, selection, args, groupBy, having, orderBy);
        };

        console.log("[Database Monitor] Hooks ready. Monitoring database operations...");
    });
}, 0);
