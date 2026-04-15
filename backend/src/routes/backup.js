import { Router } from "express";

export function backupRoutes(pool) {
  const r = Router();

  r.get("/export", async (_, res) => {
    const [devices, docs, firewalls, rules, networks, zones, files, users] = await Promise.all([
      pool.query("SELECT id, data, created_at, updated_at FROM devices"),
      pool.query("SELECT id, data, created_at, updated_at FROM docs"),
      pool.query("SELECT id, data, created_at, updated_at FROM firewalls"),
      pool.query("SELECT id, firewall_id, data FROM firewall_rules"),
      pool.query("SELECT id, data FROM networks"),
      pool.query("SELECT id, name FROM zones"),
      pool.query("SELECT id, name, size, type, data, created_at FROM files"),
      pool.query("SELECT id, username, display_name, email, role FROM users"),
    ]);

    res.json({
      devices: devices.rows.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at })),
      docs: docs.rows.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at })),
      firewalls: firewalls.rows.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at })),
      firewallRules: rules.rows.map(r => ({ ...r.data, id: r.id, firewallId: r.firewall_id })),
      networks: networks.rows.map(r => ({ ...r.data, id: r.id })),
      zones: zones.rows,
      files: files.rows.map(r => ({ id: r.id, name: r.name, size: r.size, type: r.type, data: r.data, createdAt: r.created_at })),
      users: users.rows.map(r => ({ id: r.id, username: r.username, displayName: r.display_name, email: r.email, role: r.role })),
    });
  });

  r.post("/import", async (req, res) => {
    const data = req.body;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Clear all tables
      await client.query("DELETE FROM firewall_rules; DELETE FROM firewalls; DELETE FROM devices; DELETE FROM docs; DELETE FROM networks; DELETE FROM zones; DELETE FROM files;");

      for (const d of (data.devices || [])) {
        const { id, createdAt, updatedAt, ...rest } = d;
        await client.query("INSERT INTO devices (id, data, created_at, updated_at) VALUES ($1,$2,$3,$4)", [id, rest, createdAt, updatedAt]);
      }
      for (const d of (data.docs || [])) {
        const { id, createdAt, updatedAt, ...rest } = d;
        await client.query("INSERT INTO docs (id, data, created_at, updated_at) VALUES ($1,$2,$3,$4)", [id, rest, createdAt, updatedAt]);
      }
      for (const d of (data.firewalls || [])) {
        const { id, createdAt, updatedAt, ...rest } = d;
        await client.query("INSERT INTO firewalls (id, data, created_at, updated_at) VALUES ($1,$2,$3,$4)", [id, rest, createdAt, updatedAt]);
      }
      for (const d of (data.firewallRules || [])) {
        const { id, firewallId, ...rest } = d;
        await client.query("INSERT INTO firewall_rules (id, firewall_id, data) VALUES ($1,$2,$3)", [id, firewallId, rest]);
      }
      for (const d of (data.networks || [])) {
        const { id, ...rest } = d;
        await client.query("INSERT INTO networks (id, data) VALUES ($1,$2)", [id, rest]);
      }
      for (const z of (data.zones || [])) {
        await client.query("INSERT INTO zones (id, name) VALUES ($1,$2)", [z.id, z.name]);
      }
      for (const f of (data.files || [])) {
        await client.query("INSERT INTO files (id, name, size, type, data, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
          [f.id, f.name, f.size, f.type, f.data, f.createdAt]);
      }

      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  return r;
}
