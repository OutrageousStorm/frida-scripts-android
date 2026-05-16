/**
 * database-inspector.js
 * Read and log SQLite database queries from apps
 * Usage: frida -U -f com.example.app -l database-inspector.js --no-pause
 */

setTimeout(function() {
    Java.perform(function() {
        console.log("[Database Inspector] Monitoring SQLite access...\n");

        var SQLiteDatabase = Java.use("android.database.sqlite.SQLiteDatabase");
        var Cursor = Java.use("android.database.sqlite.SQLiteCursor");

        // Hook rawQuery
        SQLiteDatabase.rawQuery.overload("java.lang.String", "[Ljava.lang.String;")
            .implementation = function(sql, selectionArgs) {
                console.log("[SQLite] rawQuery:");
                console.log("  SQL: " + sql);
                if (selectionArgs && selectionArgs.length > 0) {
                    console.log("  Args: [" + selectionArgs.join(", ") + "]");
                }
                return this.rawQuery.call(this, sql, selectionArgs);
            };

        // Hook query
        SQLiteDatabase.query.overload(
            "java.lang.String", "[Ljava.lang.String;", "java.lang.String", 
            "[Ljava.lang.String;", "java.lang.String", "java.lang.String", "java.lang.String"
        ).implementation = function(table, columns, selection, selectionArgs, groupBy, having, orderBy) {
            console.log("[SQLite] query:");
            console.log("  Table: " + table);
            if (columns) console.log("  Columns: [" + columns.join(", ") + "]");
            if (selection) console.log("  WHERE: " + selection);
            if (selectionArgs) console.log("  Args: [" + selectionArgs.join(", ") + "]");
            return this.query.call(this, table, columns, selection, selectionArgs, groupBy, having, orderBy);
        };

        // Hook insert
        SQLiteDatabase.insert.overload("java.lang.String", "java.lang.String", "android.content.ContentValues")
            .implementation = function(table, nullColumnHack, values) {
                console.log("[SQLite] insert into " + table);
                try {
                    var keySet = values.keySet().toArray();
                    for (var i = 0; i < keySet.length; i++) {
                        console.log("  " + keySet[i] + " = " + values.get(keySet[i]));
                    }
                } catch(e) {}
                return this.insert.call(this, table, nullColumnHack, values);
            };

        console.log("[Database Inspector] Ready");
    });
}, 0);
