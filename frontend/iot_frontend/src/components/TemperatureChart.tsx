import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DeviceState } from '../hooks/useSocket';

const DEVICE_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#facc15', '#a78bfa'];

interface Props {
  devices: Map<string, DeviceState>;
}

export function TemperatureChart({ devices }: Props) {
  const deviceIds = Array.from(devices.keys());

  if (deviceIds.length === 0) return null;

  // Construir data para recharts: cada punto es un índice del historial
  const maxLen = Math.max(...Array.from(devices.values()).map(d => d.history.length));

  const data = Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, number | string> = { index: i + 1 };
    for (const [deviceId, state] of devices) {
      const offset = i - (maxLen - state.history.length);
      if (offset >= 0) {
        const reading = state.history[offset];
        if (reading) point[deviceId] = reading.sensors.temperature.value;
      }
    }
    return point;
  });

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
      <h2 className="text-white font-semibold text-base mb-4">
        Temperatura en tiempo real (°C)
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="index" stroke="#475569" tick={{ fontSize: 12 }} />
          <YAxis stroke="#475569" tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#f1f5f9' }}
          />
          <Legend wrapperStyle={{ fontSize: 13, color: '#94a3b8' }} />
          {deviceIds.map((id, idx) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={DEVICE_COLORS[idx % DEVICE_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
