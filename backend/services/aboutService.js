const repository = require('../database/aboutRepository');
const { httpError } = require('../utils/httpError');
const nullable = new Set(['subtitle_ar','subtitle_en','image_url','image_alt_ar','image_alt_en']);
function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) throw httpError(400,'A non-empty JSON object is required.');
  const values = {};
  for (const [key,value] of Object.entries(body)) {
    if (!repository.fields.includes(key)) throw httpError(400,'Unsupported About field.');
    if (value === null && nullable.has(key)) { values[key] = null; continue; }
    if (key === 'status') {
      if (!['draft','published','hidden'].includes(value)) throw httpError(400,'Choose a valid publication status.');
      values[key] = value;
    } else if (key.startsWith('values_')) {
      if (!Array.isArray(value) || value.length > 20 || value.some(item=>typeof item !== 'string' || !item.trim() || item.length > 120)) throw httpError(400,'Values must contain up to 20 non-empty lines, each up to 120 characters.');
      values[key] = value.map(item=>item.trim());
    } else {
      if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw httpError(400,'Enter non-empty text up to 4000 characters.');
      if (key === 'image_url') {
        try { if (!['http:','https:'].includes(new URL(value).protocol)) throw new Error(); }
        catch { throw httpError(400,'Use an HTTP or HTTPS image URL.'); }
      }
      values[key] = value.trim();
    }
  }
  return values;
}
async function get(pool) {
  const record = await repository.get(pool);
  if (!record) throw httpError(404,'About content is not initialized. Contact the site administrator.');
  return record;
}
async function update(pool, body) {
  const values = validate(body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await repository.get(client,false,true);
    if (!current) throw httpError(404,'About content is not initialized. Contact the site administrator.');
    const merged = {...current,...values};
    if (merged.image_url && (!merged.image_alt_ar || !merged.image_alt_en)) throw httpError(400,'Provide image alternative text in both languages.');
    const record = await repository.update(client,values);
    await client.query('COMMIT');
    return record;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports = { get, update, validate, publicGet: pool=>repository.get(pool,true) };
