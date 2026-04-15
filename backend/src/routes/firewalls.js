import { Router } from "express";

export function firewallRoutes(pool) {
  const r = Router();

  // Firewalls
  r.get("/", async (_, res) => {
    const { rows } = await pool.query("SELECT id, data, created_at, updated_at FROM firewalls ORDER BY created_at");
    res.json(rows.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at })));
  });

  r.post("/", async (req, res) => {
    const { id, createdAt, updatedAt, ...data } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO firewalls (data) VALUES ($1) RETURNING id, created_at, updated_at",
      [data]
    );
    res.json({ ...data, id: rows[0].id, createdAt: rows[0].created_at, updatedAt: rows[0].updated_at });
  });

  r.put("/:id", async (req, res) => {
    const { id, createdAt, updatedAt, ...data } = req.body;
    await pool.query("UPDATE firewalls SET data = $1, updated_at = now() WHERE id = $2", [data, req.params.id]);
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM firewalls WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  // Rules
  r.get("/:fwId/rules", async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, firewall_id, data FROM firewall_rules WHERE firewall_id = $1 ORDER BY (data->>'order')::int",
      [req.params.fwId]
    );
    res.json(rows.map(r => ({ ...r.data, id: r.id, firewallId: r.firewall_id })));
  });

  r.post("/:fwId/rules", async (req, res) => {
    const { id, firewallId, ...data } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO firewall_rules (firewall_id, data) VALUES ($1, $2) RETURNING id",
      [req.params.fwId, data]
    );
    res.json({ ...data, id: rows[0].id, firewallId: req.params.fwId });
  });

  r.put("/:fwId/rules/:ruleId", async (req, res) => {
    const { id, firewallId, ...data } = req.body;
    await pool.query("UPDATE firewall_rules SET data = $1 WHERE id = $2", [data, req.params.ruleId]);
    res.json({ ok: true });
  });

  r.delete("/:fwId/rules/:ruleId", async (req, res) => {
    await pool.query("DELETE FROM firewall_rules WHERE id = $1", [req.params.ruleId]);
    res.json({ ok: true });
  });

  return r;
}
