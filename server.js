import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// ----------------- Neon database pool -----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ----------------- GET /api/users -----------------
app.get("/api/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );

    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalRows = parseInt(countResult.rows[0].count);

    res.json({
      page,
      limit,
      totalRows,
      totalPages: Math.ceil(totalRows / limit),
      users: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// ----------------- GET /api/users/:id -----------------
app.get("/api/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// ----------------- GET /api/users/search -----------------
app.get("/api/users/search", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Name query parameter required" });

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM users WHERE name ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3",
      [`%${name}%`, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE name ILIKE $1",
      [`%${name}%`]
    );
    const totalRows = parseInt(countResult.rows[0].count);

    res.json({
      page,
      limit,
      totalRows,
      totalPages: Math.ceil(totalRows / limit),
      users: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error searching users" });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 Render API is live! Use /api/users endpoints.");
});

// ----------------- Start server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Render API running on port ${PORT}`);
});