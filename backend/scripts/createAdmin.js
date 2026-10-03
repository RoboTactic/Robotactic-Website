const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const { connectDatabase, pool } = require("../database/pool");
const { hashPassword } = require("../utils/passwords");

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") return reject(new Error("Run this command in an interactive terminal."));
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let value = "";
    function onData(key) {
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Admin creation cancelled."));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        if (value.length) { value = value.slice(0, -1); stdout.write("\b \b"); }
      } else if (key >= " ") {
        value += key;
        stdout.write("*");
      }
    }
    function cleanup() {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }
    stdin.on("data", onData);
  });
}

async function main() {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  let client;
  try {
    const fullName = (await prompt.question("Full name: ")).trim();
    const email = (await prompt.question("Email: ")).trim().toLowerCase();
    const roleCode = (await prompt.question("Role (super_admin, competition_manager, workshop_manager): ")).trim();
    prompt.close();
    const password = await readHidden("Password (12+ characters): ");
    if (!fullName || fullName.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid name and email.");
    if (!["super_admin", "competition_manager", "workshop_manager"].includes(roleCode)) throw new Error("Choose one of the supported roles.");
    if (password.length < 12 || password.length > 1024) throw new Error("Password must be between 12 and 1024 characters.");
    await connectDatabase();
    client = await pool.connect();
    const hash = await hashPassword(password);
    await client.query("INSERT INTO admin_users (full_name, email, role_code, password_hash) VALUES ($1, $2, $3, $4)", [fullName, email, roleCode, hash]);
    stdout.write("Admin account created.\n");
  } finally {
    prompt.close();
    client?.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.statusCode ? error.message : "Admin account could not be created. Check local database configuration and try again.");
  process.exitCode = 1;
});
