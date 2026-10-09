const fields = ['title_ar','title_en','subtitle_ar','subtitle_en','body_ar','body_en','values_ar','values_en','image_url','image_alt_ar','image_alt_en','status'];
async function get(pool, published = false, locked = false) {
  const result = await pool.query(`SELECT id, ${fields.join(', ')} FROM about_page WHERE id = 1${published ? " AND status = 'published'" : ''}${locked ? ' FOR UPDATE' : ''}`);
  if (!result.rows[0]) return null;
  if (published) { const {status, ...record} = result.rows[0]; return record; }
  return result.rows[0];
}
async function update(pool, values) {
  const keys = Object.keys(values);
  const result = await pool.query(`UPDATE about_page SET ${keys.map((key,index)=>`${key} = $${index+1}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING id, ${fields.join(', ')}`, keys.map(key=>['values_ar','values_en'].includes(key)?JSON.stringify(values[key]):values[key]));
  return result.rows[0];
}
module.exports = { fields, get, update };
