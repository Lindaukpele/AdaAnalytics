// server.js
import express from "express";
import pkg from "pg";

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// Neon database pool
//const pool = new Pool({
//connectionString:
//  "postgresql://neondb_owner:npg_LN0caK9xfCTl@ep-crimson-sky-ad4jbazk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
//});

// Neon database pool (use DATABASE_URL environment variable in Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(express.json());

// ----------------- GET /users -----------------
// Fetch users with pagination
app.get("/users", async (req, res) => {
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
    res.status(500).send("Error fetching users");
  }
});

// ----------------- GET /users/:id -----------------
// Fetch a single user by ID
app.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    if (result.rows.length === 0) return res.status(404).send("User not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching user");
  }
});

// ----------------- POST /users -----------------
// Add a new user
app.post("/users", async (req, res) => {
  const { name, agency, location, genres, website } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO users (name, agency, location, genres, website)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (website) DO NOTHING
       RETURNING *`,
      [name, agency, location, genres, website]
    );

    if (result.rows.length === 0) return res.status(409).send("User already exists");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding user");
  }
});

// ----------------- GET /users/search -----------------
// Search users by name (case-insensitive) with pagination
app.get("/users/search", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.status(400).send("Name query parameter required");

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
    res.status(500).send("Error searching users");
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("Welcome to AdaAnalytics API! Try /users or /users/search");
});

// ----------------- Start server -----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
