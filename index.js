// index.js
import pg from "pg";

const { Client } = pg;

// Use your Neon connection string
const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_LN0caK9xfCTl@ep-crimson-sky-ad4jbazk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function main() {
  try {
    await client.connect();
    console.log("✅ Connected to Neon database!");

    // Test query
    const res = await client.query("SELECT NOW()");
    console.log("Current time:", res.rows[0]);

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.end();
  }
}

main();