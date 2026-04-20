import { Router } from "express";

export function deviceRoutes(pool) {
  const r = Router();

  r.get("/", async (_, res) => {
    try {
      const { rows } = await pool.query("SELECT id, data, created_at, updated_at FROM devices ORDER BY created_at");
      res.json(rows.map(r => ({ ...r.data, id: r.id, createdAt: r.created_at, updatedAt: r.updated_at })));
    } catch (e) {
      console.error("GET /devices failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  r.post("/", async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...data } = req.body;
      const { rows } = await pool.query(
        "INSERT INTO devices (data) VALUES ($1) RETURNING id, created_at, updated_at",
        [data]
      );
      res.json({ ...data, id: rows[0].id, createdAt: rows[0].created_at, updatedAt: rows[0].updated_at });
    } catch (e) {
      console.error("POST /devices failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  r.put("/:id", async (req, res) => {
    try {
      const { id, createdAt, updatedAt, ...data } = req.body;
      await pool.query(
        "UPDATE devices SET data = $1, updated_at = now() WHERE id = $2",
        [data, req.params.id]
      );
      res.json({ ok: true });
    } catch (e) {
      console.error("PUT /devices failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  r.delete("/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM devices WHERE id = $1", [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      console.error("DELETE /devices failed:", e);
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}
