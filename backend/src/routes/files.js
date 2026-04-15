import { Router } from "express";

export function fileRoutes(pool) {
  const r = Router();

  r.get("/", async (_, res) => {
    const { rows } = await pool.query("SELECT id, name, size, type, created_at FROM files ORDER BY created_at DESC");
    res.json(rows.map(r => ({ id: r.id, name: r.name, size: r.size, type: r.type, createdAt: r.created_at })));
  });

  r.get("/:id", async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM files WHERE id = $1", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    const f = rows[0];
    res.json({ id: f.id, name: f.name, size: f.size, type: f.type, data: f.data, createdAt: f.created_at });
  });

  r.post("/", async (req, res) => {
    const { name, size, type, data } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO files (name, size, type, data) VALUES ($1,$2,$3,$4) RETURNING id, created_at",
      [name, size, type, data]
    );
    res.json({ id: rows[0].id, name, size, type, createdAt: rows[0].created_at });
  });

  r.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM files WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  return r;
}
