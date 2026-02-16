/**
 * Wraps better-sqlite3 to expose the same async interface as the pg adapter.
 */

export function createSqliteAdapter(sqliteDb) {
  return {
    async get(sql, ...params) {
      const row = sqliteDb.prepare(sql).get(...params);
      return row ?? undefined;
    },

    async all(sql, ...params) {
      return sqliteDb.prepare(sql).all(...params);
    },

    async run(sql, ...params) {
      const result = sqliteDb.prepare(sql).run(...params);
      return {
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      };
    },
  };
}
