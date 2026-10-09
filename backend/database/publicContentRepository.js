async function getSiteSettings(pool) {
  const { rows } = await pool.query(`SELECT event_start_at, event_end_at, event_location_ar, event_location_en, general_registration_url, official_email FROM site_settings WHERE id = 1`);
  return rows[0] || null;
}

async function getCompetitions(pool) {
  const { rows } = await pool.query(`
    SELECT id, name_ar, name_en, description_ar, description_en, category_code,
           requirements_ar, requirements_en, audience_type, team_size_min, team_size_max,
           max_teams, start_at, end_at, registration_status, registration_url, image_url,
           is_featured, featured_order
    FROM competitions WHERE status = 'published'
    ORDER BY is_featured DESC, featured_order ASC NULLS LAST, id ASC
  `);
  return rows;
}

async function getWorkshops(pool) {
  const { rows } = await pool.query(`
    SELECT w.id, w.title_ar, w.title_en, w.description_ar, w.description_en, w.image_url,
           w.start_at, w.end_at, w.capacity, w.available_seats, w.registration_status, w.registration_url,
           w.is_featured, w.featured_order, COALESCE(public_speakers.names, '[]'::json) AS speakers
    FROM workshops w
    LEFT JOIN LATERAL (
      SELECT json_agg(s.full_name ORDER BY s.full_name, s.id) AS names
      FROM workshop_speakers ws JOIN speakers s ON s.id = ws.speaker_id
      WHERE ws.workshop_id = w.id AND ws.is_public = TRUE
    ) public_speakers ON TRUE
    WHERE w.status = 'published' ORDER BY w.start_at ASC, w.id ASC
  `);
  return rows;
}

async function getProjects(pool) {
  const { rows } = await pool.query(`
    SELECT p.id, p.name_ar, p.name_en, p.description_ar, p.description_en, p.project_type,
           p.category_id, pc.name_ar AS category_name_ar, pc.name_en AS category_name_en,
           p.image_url, p.team_name, p.team_leader_name, p.project_url, p.video_url,
           p.technologies, p.stage_ar, p.stage_en, p.is_featured, p.featured_order,
           COALESCE(members.items, '[]'::json) AS members
    FROM projects p
    LEFT JOIN project_categories pc ON pc.id = p.category_id AND pc.is_active = TRUE
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('id', pm.id, 'name', pm.name, 'linkedin_url', pm.linkedin_url,
        'x_url', pm.x_url, 'display_order', pm.display_order)
        ORDER BY pm.display_order ASC NULLS LAST, pm.id ASC) AS items
      FROM project_members pm WHERE pm.project_id = p.id
    ) members ON TRUE
    WHERE p.status = 'published'
    ORDER BY p.is_featured DESC, p.featured_order ASC NULLS LAST, p.id DESC
  `);
  return rows;
}

async function getAnnouncements(pool) {
  const { rows } = await pool.query(`
    SELECT id, title_ar, title_en, description_ar, description_en, image_url, link_url, start_at, end_at
    FROM announcements
    WHERE status = 'published' AND (start_at IS NULL OR start_at <= CURRENT_TIMESTAMP)
      AND (end_at IS NULL OR end_at > CURRENT_TIMESTAMP)
    ORDER BY start_at DESC NULLS LAST, id DESC
  `);
  return rows;
}

async function getTimelineEvents(pool, currentOnly = false) {
  const where = currentOnly ? "AND start_at <= CURRENT_TIMESTAMP AND end_at > CURRENT_TIMESTAMP" : "";
  const { rows } = await pool.query(`
    SELECT id, title_ar, title_en, description_ar, description_en, start_at, end_at, location_ar, location_en
    FROM timeline_events WHERE status = 'published' ${where} ORDER BY start_at ASC, id ASC
  `);
  return rows;
}

async function getSponsors(pool) {
  const { rows } = await pool.query(`
    SELECT id, name, description_ar, description_en, logo_url, sponsor_type, level, website_url, display_order
    FROM sponsors WHERE is_active = TRUE ORDER BY display_order ASC NULLS LAST, id ASC
  `);
  return rows;
}

async function getFaqs(pool) {
  const { rows } = await pool.query(`
    SELECT id, question_ar, question_en, answer_ar, answer_en, display_order
    FROM faqs WHERE is_active = TRUE ORDER BY display_order ASC NULLS LAST, id ASC
  `);
  return rows;
}

async function getTeamMembers(pool) {
  const { rows } = await pool.query(`
    SELECT id, name_ar, name_en, role_ar, role_en, bio_ar, bio_en, image_url,
      public_email, contact_url, linkedin_url, x_url, display_order
    FROM event_team_members WHERE status = 'published' ORDER BY display_order ASC, id ASC
  `);
  return rows;
}

module.exports = { getTeamMembers, getSiteSettings, getCompetitions, getWorkshops, getProjects, getAnnouncements, getTimelineEvents, getSponsors, getFaqs };
