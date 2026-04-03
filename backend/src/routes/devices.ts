import { Router } from "express";
import { pool } from "../db/client";

const router = Router();

// Fila que devuelve la DB → TelemetryPayload shape
function rowToPayload(row: Record<string, unknown>) {
  return {
    device_id: row["device_id"],
    location:  row["location"],
    timestamp: row["recorded_at"],
    sensors: {
      temperature: { value: Number(row["temperature"]), unit: "°C" },
      humidity:    { value: Number(row["humidity"]),    unit: "%" },
      pressure:    { value: Number(row["pressure"]),    unit: "hPa" },
    },
  };
}

// GET /api/devices — última lectura de cada dispositivo
router.get("/", async (_req, res) => {
  const result = await pool.query(`
    SELECT DISTINCT ON (device_id)
      device_id, location, temperature, humidity, pressure, recorded_at
    FROM telemetry
    ORDER BY device_id, recorded_at DESC
  `);
  res.json(result.rows.map(rowToPayload));
});

// GET /api/devices/:id/history?limit=50 — historial de un dispositivo
router.get("/:id/history", async (req, res) => {
  const limit = Math.min(Number(req.query["limit"] ?? 50), 200);

  const result = await pool.query(
    `SELECT device_id, location, temperature, humidity, pressure, recorded_at
     FROM telemetry
     WHERE device_id = $1
     ORDER BY recorded_at DESC
     LIMIT $2`,
    [req.params["id"], limit]
  );

  // Devolver en orden cronológico (más antiguo primero) para el chart
  res.json(result.rows.reverse().map(rowToPayload));
});

export default router;
