"""
IoT Device Simulator
Simula múltiples dispositivos que publican telemetría vía MQTT.

Tópico: iot/devices/{device_id}/telemetry
Payload: JSON con temperatura, humedad, presión y timestamp.
"""

import json
import random
import signal
import sys
import time
import uuid
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

# ── Configuración ─────────────────────────────────────────────────────────────

BROKER_HOST = "localhost"
BROKER_PORT = 1883
PUBLISH_INTERVAL = 2  # segundos entre publicaciones por dispositivo

DEVICES = [
    {"id": "device-001", "location": "warehouse-a"},
    {"id": "device-002", "location": "warehouse-b"},
    {"id": "device-003", "location": "office-1"},
]

# Rangos normales de los sensores
SENSOR_RANGES = {
    "temperature": {"min": 18.0, "max": 30.0, "unit": "°C"},
    "humidity":    {"min": 30.0, "max": 70.0, "unit": "%"},
    "pressure":    {"min": 1000.0, "max": 1025.0, "unit": "hPa"},
}

# Probabilidad de generar un valor anómalo (para probar la IA luego)
ANOMALY_PROBABILITY = 0.05  # 5%

# ── Lógica de sensores ─────────────────────────────────────────────────────────

def generate_reading(sensor: str) -> float:
    """Genera un valor de sensor, con baja probabilidad de anomalía."""
    cfg = SENSOR_RANGES[sensor]

    if random.random() < ANOMALY_PROBABILITY:
        # Anomalía: valor fuera del rango normal
        multiplier = random.choice([0.5, 1.5])
        value = random.uniform(cfg["min"], cfg["max"]) * multiplier
    else:
        value = random.uniform(cfg["min"], cfg["max"])

    return round(value, 2)


def build_payload(device: dict) -> dict:
    return {
        "device_id": device["id"],
        "location": device["location"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sensors": {
            "temperature": {
                "value": generate_reading("temperature"),
                "unit": SENSOR_RANGES["temperature"]["unit"],
            },
            "humidity": {
                "value": generate_reading("humidity"),
                "unit": SENSOR_RANGES["humidity"]["unit"],
            },
            "pressure": {
                "value": generate_reading("pressure"),
                "unit": SENSOR_RANGES["pressure"]["unit"],
            },
        },
    }

# ── MQTT ───────────────────────────────────────────────────────────────────────

def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print(f"[MQTT] Conectado al broker {BROKER_HOST}:{BROKER_PORT}")
    else:
        print(f"[MQTT] Error de conexión, código: {reason_code}")
        sys.exit(1)


def on_disconnect(client, userdata, flags, reason_code, properties):
    if reason_code != 0:
        print(f"[MQTT] Desconexión inesperada (código {reason_code}). Reconectando...")


def create_client() -> mqtt.Client:
    client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id=f"simulator-{uuid.uuid4().hex[:8]}",
    )
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    return client

# ── Main loop ──────────────────────────────────────────────────────────────────

def run():
    client = create_client()

    try:
        client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)
    except ConnectionRefusedError:
        print(f"[ERROR] No se pudo conectar a {BROKER_HOST}:{BROKER_PORT}. ¿Está corriendo el broker?")
        sys.exit(1)

    client.loop_start()

    def shutdown(sig, frame):
        print("\n[SIM] Deteniendo simulador...")
        client.loop_stop()
        client.disconnect()
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print(f"[SIM] Simulando {len(DEVICES)} dispositivos cada {PUBLISH_INTERVAL}s. Ctrl+C para detener.\n")

    while True:
        for device in DEVICES:
            payload = build_payload(device)
            topic = f"iot/devices/{device['id']}/telemetry"
            result = client.publish(topic, json.dumps(payload), qos=1)

            temp = payload["sensors"]["temperature"]["value"]
            hum  = payload["sensors"]["humidity"]["value"]
            print(f"[{device['id']}] → {topic} | temp={temp}°C  hum={hum}%")

        time.sleep(PUBLISH_INTERVAL)


if __name__ == "__main__":
    run()
