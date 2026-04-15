import { Router } from "express";
import bcrypt from "bcryptjs";

export function userRoutes(pool) {
  const r = Router();

  r.get("/", async (_, res) => {
    const { rows } = await pool.query("SELECT id, username, display_name, email, role FROM users");
    res.json(rows.map(r => ({
      id: r.id, username: r.username, displayName: r.display_name,
      email: r.email, role: r.role,
    })));
  });

  r.post("/", async (req, res) => {
    const { username, password, displayName, email, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (username, password, display_name, email, role) VALUES ($1,$2,$3,$4,$5) RETURNING id",
      [username, hash, displayName || null, email || null, role || "viewer"]
    );
    res.json({ id: rows[0].id, username, displayName, email, role });
  });

  r.put("/:id", async (req, res) => {
    const { username, password, displayName, email, role } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET username=$1, password=$2, display_name=$3, email=$4, role=$5 WHERE id=$6",
        [username, hash, displayName, email, role, req.params.id]
      );
    } else {
      await pool.query(
        "UPDATE users SET username=$1, display_name=$2, email=$3, role=$4 WHERE id=$5",
        [username, displayName, email, role, req.params.id]
      );
    }
    res.json({ ok: true });
  });

  r.delete("/:id", async (req, res) => {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  });

  r.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const u = rows[0];
    res.json({ id: u.id, username: u.username, displayName: u.display_name, email: u.email, role: u.role });
  });

  return r;
}
