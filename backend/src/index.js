import express from "express";
import cors from "cors";
import pg from "pg";
import { initDb } from "./db.js";
import { deviceRoutes } from "./routes/devices.js";
import { docRoutes } from "./routes/docs.js";
import { firewallRoutes } from "./routes/firewalls.js";
import { networkRoutes } from "./routes/networks.js";
import { userRoutes } from "./routes/users.js";
import { fileRoutes } from "./routes/files.js";
import { backupRoutes } from "./routes/backup.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const pool = new pg.Pool({
  host: process.env.DB_HOST || "db",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "netdocs",
  user: process.env.DB_USER || "netdocs",
  password: process.env.DB_PASSWORD || "netdocs",
});

await initDb(pool);

app.use("/api/devices", deviceRoutes(pool));
app.use("/api/docs", docRoutes(pool));
app.use("/api/firewalls", firewallRoutes(pool));
app.use("/api/networks", networkRoutes(pool));
app.use("/api/users", userRoutes(pool));
app.use("/api/files", fileRoutes(pool));
app.use("/api/backup", backupRoutes(pool));

app.get("/api/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`NetDocs API running on port ${PORT}`));
