require("dotenv").config();

const { Client } = require("pg");
const { randomBytes } = require("node:crypto");
const { getDatabaseSslOptions } = require("../config/databaseSsl");
const { hashPassword } = require("../utils/passwords");
const seedData = require("../database/seedData");
const publishDemo = process.argv.includes("--publish");
const fullSeed = process.argv.includes("--full");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Set it in backend/.env first.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ...(process.env.DATABASE_SSL === "true"
    ? { ssl: getDatabaseSslOptions() }
    : {}),
  connectionTimeoutMillis: 5000,
});

const publicationFields = {
  project_categories: { is_active: true },
  competitions: { status: "published" },
  workshops: { status: "published" },
  projects: { status: "published" },
  announcements: { status: "published" },
  timeline_events: { status: "published" },
  faqs: { is_active: true },
};

async function insertOrPublish(table, keyColumn, record) {
  const existing = await client.query(
    `SELECT id FROM ${table} WHERE ${keyColumn} = $1 LIMIT 1`,
    [record[keyColumn]],
  );

  if (existing.rowCount) {
    const fields = publishDemo ? publicationFields[table] : null;
    if (!fields) return { inserted: false, published: false };

    const columns = Object.keys(fields);
    const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
    await client.query(
      `UPDATE ${table} SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${columns.length + 1}`,
      [...columns.map((column) => fields[column]), existing.rows[0].id],
    );
    return { inserted: false, published: true };
  }

  const insertRecord = publishDemo
    ? { ...record, ...publicationFields[table] }
    : record;
  const columns = Object.keys(insertRecord);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  await client.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    columns.map((column) => insertRecord[column]),
  );
  return { inserted: true, published: publishDemo };
}

async function insertIfMissingBy(table, keyColumns, record) {
  const where = keyColumns.map((column, index) => `${column} = $${index + 1}`).join(" AND ");
  const result = await client.query(
    `SELECT id FROM ${table} WHERE ${where} LIMIT 1`,
    keyColumns.map((column) => record[column]),
  );
  if (result.rowCount) return false;

  const columns = Object.keys(record);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  await client.query(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
    columns.map((column) => record[column]),
  );
  return true;
}

async function getId(table, keyColumn, keyValue) {
  const result = await client.query(
    `SELECT id FROM ${table} WHERE ${keyColumn} = $1 LIMIT 1`,
    [keyValue],
  );
  return result.rows[0]?.id || null;
}

async function seedFullData(counts) {
  const count = (group, inserted) => {
    counts[group] ||= { inserted: 0, published: 0 };
    counts[group].inserted += Number(inserted);
  };

  const setting = await client.query("SELECT id FROM site_settings WHERE id = 1");
  if (!setting.rowCount) {
    await client.query(
      `INSERT INTO site_settings (id, event_start_at, event_end_at, event_location_ar, event_location_en, general_registration_url, official_email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      Object.values(seedData.siteSettings),
    );
    count("siteSettings", true);
  } else {
    count("siteSettings", false);
  }

  for (const record of seedData.adminUsers) {
    const exists = await client.query("SELECT id FROM admin_users WHERE email = $1 LIMIT 1", [record.email]);
    let inserted = false;
    if (!exists.rowCount) {
      const randomUnavailablePassword = randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomUnavailablePassword);
      const insertedUser = await client.query(
        `INSERT INTO admin_users (full_name, login_name, email, phone, role_code, password_hash, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING id`,
        [record.full_name, `demo-${record.role_code.replaceAll("_", "-")}`, record.email, record.phone, record.role_code, passwordHash],
      );
      const defaultScopes = record.role_code === "competition_manager" ? ["competitions", "teams"] : record.role_code === "workshop_manager" ? ["workshops", "speakers"] : [];
      if (defaultScopes.length) await client.query("INSERT INTO admin_user_permissions (user_id, scope) SELECT $1, unnest($2::varchar[])", [insertedUser.rows[0].id, defaultScopes]);
      inserted = true;
    }
    count("adminUsers", inserted);
  }

  for (const record of seedData.teams) {
    const { competition_name_en: competitionName, ...team } = record;
    const competitionId = await getId("competitions", "name_en", competitionName);
    if (!competitionId) throw new Error("A demo competition required by teams is missing.");
    count("teams", await insertIfMissingBy("competition_teams", ["competition_id", "team_name"], {
      ...team,
      competition_id: competitionId,
    }));
  }

  for (const record of seedData.speakers) {
    let speakerId = await getId("speakers", "full_name", record.full_name);
    if (!speakerId) {
      const inserted = await client.query(
        "INSERT INTO speakers (full_name, phone, notes) VALUES ($1, $2, $3) RETURNING id",
        [record.full_name, record.phone, record.notes],
      );
      speakerId = inserted.rows[0].id;
      count("speakers", true);
    } else count("speakers", false);
    for (const title of record.workshops) {
      const workshopId = await getId("workshops", "title_en", title);
      if (!workshopId) throw new Error("A demo workshop required by speakers is missing.");
      const result = await client.query(
        "INSERT INTO workshop_speakers (workshop_id, speaker_id, is_public) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING workshop_id",
        [workshopId, speakerId, publishDemo],
      );
      count("speakerAssignments", Boolean(result.rowCount));
    }
  }

  for (const record of seedData.projectMembers) {
    const { project_name_en: projectName, ...member } = record;
    const projectId = await getId("projects", "name_en", projectName);
    if (!projectId) throw new Error("A demo project required by project members is missing.");
    count("projectMembers", await insertIfMissingBy("project_members", ["project_id", "name"], {
      ...member,
      project_id: projectId,
    }));
  }

  for (const record of seedData.sponsors) {
    const result = await insertOrPublish("sponsors", "name", record);
    count("sponsors", result.inserted);
  }

  for (const record of seedData.contactMessages) {
    count("contactMessages", await insertIfMissingBy("contact_messages", ["email", "subject"], record));
  }
}

async function seedDatabase() {
  let stage = "connecting to PostgreSQL";

  try {
    await client.connect();

    stage = "checking the database schema";
    const schemaCheck = await client.query(`
      SELECT to_regclass('public.competitions') IS NOT NULL AS competitions,
             to_regclass('public.workshops') IS NOT NULL AS workshops,
             to_regclass('public.projects') IS NOT NULL AS projects,
             to_regclass('public.speakers') IS NOT NULL AS speakers
    `);
    if (Object.values(schemaCheck.rows[0]).some((exists) => !exists)) {
      console.error("RoboTactic tables are missing. Run npm run schema or npm run db:migrate first.");
      process.exitCode = 1;
      return;
    }

    await client.query("BEGIN");
    stage = "inserting demo content";
    const counts = {};
    const add = async (group, table, keyColumn, record) => {
      const result = await insertOrPublish(table, keyColumn, record);
      counts[group] ||= { inserted: 0, published: 0 };
      counts[group].inserted += Number(result.inserted);
      counts[group].published += Number(result.published);
    };

    for (const record of seedData.projectCategories) {
      await add("projectCategories", "project_categories", "name_en", record);
    }
    for (const record of seedData.competitions) {
      await add("competitions", "competitions", "name_en", record);
    }
    for (const record of seedData.workshops) {
      await add("workshops", "workshops", "title_en", record);
    }
    for (const record of seedData.projects) {
      const { category_name_en: categoryName, ...project } = record;
      const category = await client.query(
        "SELECT id FROM project_categories WHERE name_en = $1 LIMIT 1",
        [categoryName],
      );
      await add("projects", "projects", "name_en", {
        ...project,
        category_id: category.rows[0]?.id || null,
      });
    }
    for (const record of seedData.announcements) {
      await add("announcements", "announcements", "title_en", record);
    }
    for (const record of seedData.timelineEvents) {
      await add("timelineEvents", "timeline_events", "title_en", record);
    }
    for (const record of seedData.faqs) {
      await add("faqs", "faqs", "question_en", record);
    }

    if (fullSeed) {
      stage = "inserting full demo records";
      await seedFullData(counts);
    }

    await client.query("COMMIT");
    console.log(publishDemo
      ? "Demo seed published. Demo content may now appear in public API responses."
      : "Demo seed completed. Seeded content is draft or inactive.");
    if (fullSeed) {
      console.log("Full mock data added. Demo admin accounts are inactive and have no usable default passwords.");
    }
    for (const [table, count] of Object.entries(counts)) {
      console.log(`${table}: ${count.inserted} inserted, ${count.published} published or activated`);
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "SELF_SIGNED_CERT_IN_CHAIN") {
      console.error("PostgreSQL TLS verification failed. Check DATABASE_SSL_CA_PATH.", error.code);
    } else {
      console.error(`Could not seed the database while ${stage}.`, error.code || "seed_error");
    }
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

seedDatabase();
