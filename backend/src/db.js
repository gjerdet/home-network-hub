import bcrypt from "bcryptjs";

export async function initDb(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS docs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS firewalls (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS firewall_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      firewall_id UUID REFERENCES firewalls(id) ON DELETE CASCADE,
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS networks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      data JSONB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS zones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      size INTEGER,
      type TEXT,
      data TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT,
      email TEXT,
      role TEXT DEFAULT 'viewer'
    );
  `);

  // Create default admin if no users exist
  const { rows } = await pool.query("SELECT COUNT(*) FROM users");
  if (parseInt(rows[0].count) === 0) {
    const hash = await bcrypt.hash("admin", 10);
    await pool.query(
      "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
      ["admin", hash, "admin"]
    );
  }
}
