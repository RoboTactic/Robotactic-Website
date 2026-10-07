const { httpError } = require("../utils/httpError");

const speakerSelect = `SELECT s.id, s.full_name, s.phone, s.notes, s.created_at, s.updated_at,
  COALESCE(json_agg(json_build_object('workshop_id', w.id, 'title_ar', w.title_ar,
    'title_en', w.title_en, 'is_public', ws.is_public) ORDER BY w.start_at, w.id)
    FILTER (WHERE w.id IS NOT NULL), '[]'::json) AS workshops
  FROM speakers s
  LEFT JOIN workshop_speakers ws ON ws.speaker_id = s.id
  LEFT JOIN workshops w ON w.id = ws.workshop_id`;

async function list(pool, workshopId) {
  const params = workshopId ? [workshopId] : [];
  const where = workshopId ? " WHERE EXISTS (SELECT 1 FROM workshop_speakers link WHERE link.speaker_id = s.id AND link.workshop_id = $1)" : "";
  const result = await pool.query(`${speakerSelect}${where} GROUP BY s.id ORDER BY s.full_name, s.id LIMIT 500`, params);
  return result.rows;
}

async function get(pool, id) {
  const result = await pool.query(`${speakerSelect} WHERE s.id = $1 GROUP BY s.id`, [id]);
  if (!result.rowCount) throw httpError(404, "Speaker not found.");
  return result.rows[0];
}

async function ensureWorkshop(client, workshopId) {
  const result = await client.query("SELECT 1 FROM workshops WHERE id = $1", [workshopId]);
  if (!result.rowCount) throw httpError(400, "Choose an existing workshop.");
}

async function create(pool, speaker, assignment) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await ensureWorkshop(client, assignment.workshop_id);
    const result = await client.query(
      "INSERT INTO speakers (full_name, phone, notes) VALUES ($1, $2, $3) RETURNING id",
      [speaker.full_name, speaker.phone, speaker.notes],
    );
    await client.query(
      "INSERT INTO workshop_speakers (workshop_id, speaker_id, is_public) VALUES ($1, $2, $3)",
      [assignment.workshop_id, result.rows[0].id, assignment.is_public],
    );
    await client.query("COMMIT");
    return get(pool, result.rows[0].id);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function update(pool, id, values) {
  const columns = Object.keys(values);
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
  const result = await pool.query(
    `UPDATE speakers SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${columns.length + 1} RETURNING id`,
    [...columns.map((column) => values[column]), id],
  );
  if (!result.rowCount) throw httpError(404, "Speaker not found.");
  return get(pool, id);
}

async function remove(pool, id) {
  const result = await pool.query("DELETE FROM speakers WHERE id = $1 RETURNING id", [id]);
  if (!result.rowCount) throw httpError(404, "Speaker not found.");
}

async function addWorkshop(pool, speakerId, assignment) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const speaker = await client.query("SELECT 1 FROM speakers WHERE id = $1", [speakerId]);
    if (!speaker.rowCount) throw httpError(404, "Speaker not found.");
    await ensureWorkshop(client, assignment.workshop_id);
    const result = await client.query(
      "INSERT INTO workshop_speakers (workshop_id, speaker_id, is_public) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING workshop_id",
      [assignment.workshop_id, speakerId, assignment.is_public],
    );
    if (!result.rowCount) throw httpError(409, "Speaker is already assigned to this workshop.");
    await client.query("COMMIT");
    return get(pool, speakerId);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function updateWorkshop(pool, speakerId, workshopId, isPublic) {
  const result = await pool.query(
    "UPDATE workshop_speakers SET is_public = $1, updated_at = CURRENT_TIMESTAMP WHERE speaker_id = $2 AND workshop_id = $3 RETURNING workshop_id",
    [isPublic, speakerId, workshopId],
  );
  if (!result.rowCount) throw httpError(404, "Workshop assignment not found.");
  return get(pool, speakerId);
}

async function removeWorkshop(pool, speakerId, workshopId) {
  const result = await pool.query("DELETE FROM workshop_speakers WHERE speaker_id = $1 AND workshop_id = $2 RETURNING workshop_id", [speakerId, workshopId]);
  if (!result.rowCount) throw httpError(404, "Workshop assignment not found.");
  return get(pool, speakerId);
}

module.exports = { list, get, create, update, remove, addWorkshop, updateWorkshop, removeWorkshop };
