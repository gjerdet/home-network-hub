import { Router } from "express";

export function deviceRoutes(pool) {
  const r = Router();

  r.get("/", async (_, res) => {
    const { rows } = await pool.query("SELECT id, data, created_at, updated_at FROM devices ORDER BY created_at");
    res.json(rows.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at })));
  });

  r.post("/", async (req, res) => {
    const { id, createdAt, updatedAt, ...data } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO devices (data) VALUES ($1) RETURNING id, created_at, updated_at",
      [data]
    );
    res.json({ ...data, id: rows[0].id, createdAt: rows[0].created_at, updatedAt: rows[0].updated_at });
  });

  r.put("/:id", async (req, res) => {
    const { id, createdAt, updatedAt, ...data } = req.body;
    await pool.query(
      "UPDATE devices SET data = $1, updated_at = now() WHERE id = $2",
      [data, req.params.id]
    );
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM devices WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  return r;
}
