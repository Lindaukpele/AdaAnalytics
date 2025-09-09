import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// ----------------- Database pool -----------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ----------------- GET /api/users -----------------
app.get("/api/users", async (req, res) => {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  const safePage = isNaN(page) || page < 1 ? 1 : page;
  const safeLimit = isNaN(limit) || limit < 1 ? 50 : limit;
  const offset = (safePage - 1) * safeLimit;

  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2",
      [safeLimit, offset]
    );
    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalRows = parseInt(countResult.rows[0].count, 10);

    res.json({
      page: safePage,
      limit: safeLimit,
      totalRows,
      totalPages: Math.ceil(totalRows / safeLimit),
      users: result.rows,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// ----------------- GET /api/users/:id -----------------
app.get("/api/users/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid user ID. Must be an integer." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// ----------------- GET /api/users/search -----------------
app.get("/api/users/search", async (req, res) => {
  let { column, value, page, limit } = req.query;

  if (!column || !value) {
    return res
      .status(400)
      .json({ error: "Column and value query parameters required" });
  }

  column = column.toLowerCase();
  const allowedColumns = ["name", "agency", "location", "genres", "website"];
  if (!allowedColumns.includes(column)) {
    return res.status(400).json({ error: "Invalid column" });
  }

  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);
  const safePage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const safeLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 50 : parsedLimit;
  const offset = (safePage - 1) * safeLimit;

  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE ${column} ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3`,
      [`%${value}%`, safeLimit, offset]
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${column} ILIKE $1`,
      [`%${value}%`]
    );
    const totalRows = parseInt(countResult.rows[0].count, 10);

    res.json({
      page: safePage,
      limit: safeLimit,
      totalRows,
      totalPages: Math.ceil(totalRows / safeLimit),
      users: result.rows,
    });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Error searching users" });
  }
});

// ----------------- Root -----------------
app.get("/", (req, res) => {
  res.send("🚀 Render API is live! Use /api/users endpoints.");
});

// ----------------- Start server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Render API running on port ${PORT}`);
});