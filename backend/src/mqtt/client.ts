import mqtt from "mqtt";
import type { Server as SocketServer } from "socket.io";
import "dotenv/config";
import { pool } from "../db/client";
import type { AnalysisResult, TelemetryPayload } from "../types/telemetry.js";

const TOPIC = "iot/devices/+/telemetry";
const AI_SERVICE_URL = process.env["AI_SERVICE_URL"] ?? "http://localhost:8000";

async function callAiService(payload: TelemetryPayload): Promise<AnalysisResult | null> {
  try {
    const res = await fetch(`${AI_SERVICE_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<AnalysisResult>;
  } catch {
    return null;
  }
}

export function startMqttClient(io: SocketServer): void {
  const brokerUrl = `mqtt://${process.env["MQTT_HOST"]}:${process.env["MQTT_PORT"]}`;
  const client = mqtt.connect(brokerUrl);

  client.on("connect", () => {
    console.log(`[MQTT] Conectado a ${brokerUrl}`);
    client.subscribe(TOPIC, (err) => {
      if (err) console.error("[MQTT] Error al suscribirse:", err.message);
      else console.log(`[MQTT] Suscrito a ${TOPIC}`);
    });
  });

  client.on("message", async (topic, buffer) => {
    let payload: TelemetryPayload;

    try {
      payload = JSON.parse(buffer.toString()) as TelemetryPayload;
    } catch {
      console.warn("[MQTT] Payload inválido en", topic);
      return;
    }

    // Llamar al servicio de IA
    const analysis = await callAiService(payload);
    if (analysis) {
      payload.analysis = analysis;
      if (analysis.risk_level !== "low") {
        console.log(`[AI] ${payload.device_id} → risk=${analysis.risk_level} anomalies=[${analysis.anomalies.join(", ")}]`);
      }
    }

    console.log(
      `[MQTT] ${payload.device_id} | ` +
      `temp=${payload.sensors.temperature.value}°C  ` +
      `hum=${payload.sensors.humidity.value}%`
    );

    // Guardar en base de datos
    try {
      await pool.query(
        `INSERT INTO telemetry (device_id, location, temperature, humidity, pressure, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          payload.device_id,
          payload.location,
          payload.sensors.temperature.value,
          payload.sensors.humidity.value,
          payload.sensors.pressure.value,
          payload.timestamp,
        ]
      );
    } catch (err) {
      console.error("[DB] Error al guardar telemetría:", err);
    }

    // Emitir en tiempo real a los clientes WebSocket (con análisis incluido)
    io.emit("telemetry", payload);
  });

  client.on("error", (err) => {
    console.error("[MQTT] Error:", err.message);
  });
}
