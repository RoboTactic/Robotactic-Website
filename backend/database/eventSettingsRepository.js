async function getStart(pool) {
  const { rows } = await pool.query('SELECT event_start_at FROM site_settings WHERE id = 1');
  return rows[0] || null;
}

async function updateStart(pool, value) {
  const { rows } = await pool.query(`
    UPDATE site_settings SET event_start_at = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1 RETURNING event_start_at
  `, [value]);
  return rows[0] || null;
}

module.exports = { getStart, updateStart };
