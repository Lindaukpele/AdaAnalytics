// importCsv.js
import fs from "fs";
import csv from "csv-parser";
import pkg from "pg";

const { Client } = pkg;

const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_LN0caK9xfCTl@ep-crimson-sky-ad4jbazk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

await client.connect();
console.log("✅ Connected to Neon database!");

const rows = [];

// Read CSV
fs.createReadStream("literary_agents_location1.csv")
  .pipe(csv())
  .on("data", (row) => {
  console.log(row); // 👀 check what website looks like
  rows.push([row.name, row.agency, row.location, row.genres, row.website]);
})
  .on("end", async () => {
    console.log(`📄 ${rows.length} rows read from CSV`);

    if (rows.length === 0) {
      console.log("⚠️ No rows found in CSV.");
      await client.end();
      return;
    }

    try {
      // ✅ Bulk insert with ON CONFLICT (skip duplicates by website)
      const values = rows.flat();
      const placeholders = rows
        .map(
          (_, i) =>
            `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
        )
        .join(",");

      const query = `
        INSERT INTO users (name, agency, location, genres, website)
        VALUES ${placeholders}
        ON CONFLICT (website) DO NOTHING
      `;

      await client.query(query, values);
      console.log("✅ CSV import complete (duplicates skipped)!");
    } catch (err) {
      console.error("❌ Error inserting rows:", err);
    } finally {
      await client.end();
    }
  });