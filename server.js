import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ---------------- GET /api/users/search -----------------
app.get("/api/users/search", async (req, res) => {
  const allowedColumns = ["name", "agency", "location", "genres", "website"];
  let { column = "name", value = "", page = 1, limit = 50 } = req.query;

  column = column.toLowerCase();
  if (!allowedColumns.includes(column)) {
    return res.status(400).json({ error: "Invalid column" });
  }

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 50;
  const offset = (page - 1) * limit;

  try {
    const searchValue = value.trim() === "" ? "%" : `%${value}%`;
    const result = await pool.query(
      `SELECT * FROM users WHERE ${column} ILIKE $1 ORDER BY id LIMIT $2 OFFSET $3`,
      [searchValue, limit, offset]
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE ${column} ILIKE $1`,
      [searchValue]
    );

    const totalRows = parseInt(countResult.rows[0].count, 10);

    res.json({
      page,
      limit,
      totalRows,
      totalPages: Math.ceil(totalRows / limit),
      users: result.rows,
    });
  } catch (err) {
    console.error("Error searching users:", err);
    res.status(500).json({ error: "Error searching users" });
  }
});

// ---------------- GET /api/users/all -----------------
app.get("/api/users/all", async (req, res) => {
  let { page = 1, limit = 50 } = req.query;
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 50;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY id LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    const countResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalRows = parseInt(countResult.rows[0].count, 10);

    res.json({
      page,
      limit,
      totalRows,
      totalPages: Math.ceil(totalRows / limit),
      users: result.rows,
    });
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ error: "Error fetching all users" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));