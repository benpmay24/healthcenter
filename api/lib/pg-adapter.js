/**
 * PostgreSQL adapter with same async interface as the SQLite wrapper.
 * Converts ? placeholders to $1, $2, ... for pg.
 */

function toPgPlaceholders(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

export function createPgAdapter(pool) {
  return {
    async get(sql, ...params) {
      const pgSql = toPgPlaceholders(sql);
      const result = await pool.query(pgSql, params);
      return result.rows[0] ?? undefined;
    },

    async all(sql, ...params) {
      const pgSql = toPgPlaceholders(sql);
      const result = await pool.query(pgSql, params);
      return result.rows;
    },

    async run(sql, ...params) {
      const isInsert = sql.trim().toUpperCase().startsWith('INSERT');
      const pgSql = isInsert && !/RETURNING\s+/i.test(sql)
        ? toPgPlaceholders(sql) + ' RETURNING id'
        : toPgPlaceholders(sql);
      const result = await pool.query(pgSql, params);
      const rowCount = result.rowCount ?? 0;
      const lastInsertRowid = isInsert && result.rows[0] ? Number(result.rows[0].id) : undefined;
      return { changes: rowCount, lastInsertRowid };
    },
  };
}
