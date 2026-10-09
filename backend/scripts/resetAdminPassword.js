const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { connectDatabase, pool } = require('../database/pool');
const { hashPassword, verifyPassword } = require('../utils/passwords');
const { readHidden } = require('../utils/readHidden');

async function main() {
  const prompt = readline.createInterface({ input: stdin, output: stdout });
  try {
    const loginName = (await prompt.question('Existing login name: ')).trim();
    prompt.close();
    if (!/^[a-zA-Z0-9._-]{3,40}$/.test(loginName)) throw new Error('Enter a valid login name.');
    await connectDatabase();
    const account = await pool.query('SELECT id FROM admin_users WHERE login_name = $1 AND is_active = TRUE', [loginName]);
    if (account.rows.length !== 1) throw new Error('No active account with that login name in the configured database.');
    const password = await readHidden('New password (12+ characters): ');
    if (password.length < 12 || password.length > 1024) throw new Error('Password must be between 12 and 1024 characters.');
    const confirmation = await readHidden('Repeat new password: ');
    if (password !== confirmation) throw new Error('Passwords do not match; nothing was changed.');
    const hash = await hashPassword(password);
    if (!await verifyPassword(password, hash)) throw new Error('Password verification failed; nothing was changed.');
    const result = await pool.query('UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND is_active = TRUE RETURNING id', [hash, account.rows[0].id]);
    if (result.rows.length !== 1) throw new Error('Account is no longer active; nothing was changed.');
    stdout.write('Password reset successfully.\n');
  } finally {
    prompt.close();
    await pool.end();
  }
}
main().catch(error => {
  const safeMessages = new Set(['Enter a valid login name.', 'No active account with that login name in the configured database.', 'Password must be between 12 and 1024 characters.', 'Passwords do not match; nothing was changed.', 'Password verification failed; nothing was changed.', 'Account is no longer active; nothing was changed.', 'Password entry cancelled.', 'Run this command in an interactive terminal.']);
  console.error(safeMessages.has(error.message) ? error.message : 'Password reset failed. Check the local database configuration.');
  process.exitCode = 1;
});
