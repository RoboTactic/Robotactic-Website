async function list(pool) {
  const { rows } = await pool.query('SELECT section_key, is_visible FROM public_section_visibility');
  return rows;
}

async function isVisible(pool, section) {
  const { rows } = await pool.query('SELECT is_visible FROM public_section_visibility WHERE section_key = $1', [section]);
  return rows[0]?.is_visible === true;
}

async function update(pool, section, visible) {
  const { rows } = await pool.query(`
    INSERT INTO public_section_visibility (section_key, is_visible) VALUES ($1, $2)
    ON CONFLICT (section_key) DO UPDATE SET is_visible = EXCLUDED.is_visible, updated_at = CURRENT_TIMESTAMP
    RETURNING section_key, is_visible
  `, [section, visible]);
  return rows[0];
}

module.exports = { list, isVisible, update };
