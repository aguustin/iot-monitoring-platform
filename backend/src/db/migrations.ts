import { pool } from "./client";

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS telemetry (
      id          SERIAL PRIMARY KEY,
      device_id   TEXT        NOT NULL,
      location    TEXT        NOT NULL,
      temperature NUMERIC     NOT NULL,
      humidity    NUMERIC     NOT NULL,
      pressure    NUMERIC     NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL
    );
  `);

  console.log("[DB] Tabla telemetry lista.");
}
