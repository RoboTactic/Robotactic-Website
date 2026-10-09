const TABLES = Object.freeze({
  competitions: "competitions",
  workshops: "workshops",
  projects: "projects",
  announcements: "announcements",
  teams: "competition_teams",
  speakers: "speakers",
  users: "admin_users",
  about: "about_page",
  "team-members": "event_team_members",
});

async function counts(pool, resources) {
  const entries = await Promise.all(resources.map(async (resource) => {
    const table = TABLES[resource];
    const result = await pool.query(`SELECT COUNT(*) AS total FROM ${table}`);
    return [resource, Number(result.rows[0].total)];
  }));
  return Object.fromEntries(entries);
}

module.exports = { counts, TABLES };
