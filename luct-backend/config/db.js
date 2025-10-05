const { Pool } = require("pg");
require("dotenv").config();

let pool;

if (process.env.DATABASE_URL) {
  // ✅ Production (e.g., Railway)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  // ✅ Local (your pgAdmin / local PostgreSQL)
  pool = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_DATABASE || "your_database_name",
    password: process.env.DB_PASSWORD || "your_password",
    port: process.env.DB_PORT || 5432,
  });
}

module.exports = pool;
