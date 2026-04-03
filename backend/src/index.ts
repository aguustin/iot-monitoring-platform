import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import cors from "cors";
import { runMigrations } from "./db/migrations";
import { startMqttClient } from "./mqtt/client";
import devicesRouter from "./routes/devices";

const PORT = Number(process.env["PORT"] ?? 3000);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: "*" },
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/devices", devicesRouter);

io.on("connection", (socket) => {
  console.log(`[WS] Cliente conectado: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[WS] Cliente desconectado: ${socket.id}`);
  });
});

async function main() {
  await runMigrations();
  startMqttClient(io);

  httpServer.listen(PORT, () => {
    console.log(`[HTTP] Servidor corriendo en http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
