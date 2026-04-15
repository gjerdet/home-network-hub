import { Router } from "express";

export function networkRoutes(pool) {
  const r = Router();

  // Networks
  r.get("/", async (_, res) => {
    const { rows } = await pool.query("SELECT id, data FROM networks");
    res.json(rows.map(r => ({ ...r.data, id: r.id })));
  });

  r.post("/", async (req, res) => {
    const { id, ...data } = req.body;
    const { rows } = await pool.query("INSERT INTO networks (data) VALUES ($1) RETURNING id", [data]);
    res.json({ ...data, id: rows[0].id });
  });

  r.put("/:id", async (req, res) => {
    const { id, ...data } = req.body;
    await pool.query("UPDATE networks SET data = $1 WHERE id = $2", [data, req.params.id]);
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM networks WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  // Zones
  r.get("/zones", async (_, res) => {
    const { rows } = await pool.query("SELECT id, name FROM zones");
    res.json(rows);
  });

  r.post("/zones", async (req, res) => {
    const { rows } = await pool.query("INSERT INTO zones (name) VALUES ($1) RETURNING id, name", [req.body.name]);
    res.json(rows[0]);
  });

  r.delete("/zones/:id", async (req, res) => {
    await pool.query("DELETE FROM zones WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  return r;
}
