import type { DeviceState } from '../hooks/useSocket';

const RISK_STYLES = {
  high:   { card: 'border-red-500/60 bg-red-950/20',    badge: 'bg-red-500/20 text-red-400 border-red-500/40',    label: 'Alto' },
  medium: { card: 'border-yellow-500/60 bg-yellow-950/20', badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', label: 'Medio' },
  low:    { card: 'border-slate-700 bg-slate-800/60',   badge: '',                                                 label: '' },
};

interface MetricProps {
  label: string;
  value: number;
  unit: string;
  anomaly: boolean;
}

function Metric({ label, value, unit, anomaly }: MetricProps) {
  return (
    <div className={`rounded-lg p-3 ${anomaly ? 'bg-red-500/10' : 'bg-slate-700/50'}`}>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`font-bold text-lg leading-none ${anomaly ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-slate-500 text-xs mt-0.5">{unit}</p>
    </div>
  );
}

interface Props {
  deviceId: string;
  state: DeviceState;
}

export function DeviceCard({ deviceId, state }: Props) {
  const { latest } = state;
  const { temperature, humidity, pressure } = latest.sensors;
  const analysis = latest.analysis;

  const riskLevel = analysis?.risk_level ?? 'low';
  const anomalies = new Set(analysis?.anomalies ?? []);
  const styles = RISK_STYLES[riskLevel];

  return (
    <div className={`rounded-xl border p-5 transition-colors ${styles.card}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-semibold text-base">{deviceId}</h2>
          <p className="text-slate-400 text-sm">{latest.location}</p>
        </div>
        {riskLevel !== 'low' && (
          <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${styles.badge}`}>
            Riesgo {styles.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Metric label="Temperatura" value={temperature.value} unit={temperature.unit} anomaly={anomalies.has('temperature')} />
        <Metric label="Humedad"     value={humidity.value}    unit={humidity.unit}    anomaly={anomalies.has('humidity')} />
        <Metric label="Presión"     value={pressure.value}    unit={pressure.unit}    anomaly={anomalies.has('pressure')} />
      </div>

      <p className="text-slate-500 text-xs mt-3">
        Última lectura: {new Date(latest.timestamp).toLocaleTimeString()}
      </p>
    </div>
  );
}
