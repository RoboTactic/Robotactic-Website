async function workshops(pool) {
  const { rows } = await pool.query("SELECT id, title_ar, title_en FROM workshops ORDER BY start_at DESC, id DESC LIMIT 1000");
  return rows;
}

async function competitions(pool) {
  const { rows } = await pool.query("SELECT id, name_ar, name_en FROM competitions ORDER BY id DESC LIMIT 1000");
  return rows;
}

module.exports = { workshops, competitions };
