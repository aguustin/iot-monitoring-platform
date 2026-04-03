import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { TelemetryPayload } from '../types/telemetry';

const BACKEND_URL = 'http://localhost:3000';
const MAX_HISTORY = 50;

export interface DeviceState {
  latest: TelemetryPayload;
  history: TelemetryPayload[];
}

async function fetchInitialHistory(): Promise<Map<string, DeviceState>> {
  const map = new Map<string, DeviceState>();

  try {
    const devicesRes = await fetch(`${BACKEND_URL}/api/devices`);
    const devices: TelemetryPayload[] = await devicesRes.json();

    await Promise.all(
      devices.map(async (device) => {
        const histRes = await fetch(
          `${BACKEND_URL}/api/devices/${device.device_id}/history?limit=${MAX_HISTORY}`
        );
        const history: TelemetryPayload[] = await histRes.json();
        map.set(device.device_id, { latest: device, history });
      })
    );
  } catch {
    // Si el backend no está listo, arrancamos con estado vacío
  }

  return map;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [devices, setDevices] = useState<Map<string, DeviceState>>(new Map());

  useEffect(() => {
    fetchInitialHistory().then(setDevices);

    const socket = io(BACKEND_URL);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('telemetry', (payload: TelemetryPayload) => {
      setDevices(prev => {
        const next = new Map(prev);
        const current = next.get(payload.device_id);
        const history = current
          ? [...current.history.slice(-(MAX_HISTORY - 1)), payload]
          : [payload];
        next.set(payload.device_id, { latest: payload, history });
        return next;
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  return { connected, devices };
}
