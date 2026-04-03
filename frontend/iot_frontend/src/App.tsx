import './App.css';
import { useSocket } from './hooks/useSocket';
import { DeviceCard } from './components/DeviceCard';
import { TemperatureChart } from './components/TemperatureChart';

export default function App() {
  const { connected, devices } = useSocket();

  const anomalyCount = Array.from(devices.values()).filter(
    ({ latest }) => latest.analysis && latest.analysis.risk_level !== 'low'
  ).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">IoT Monitoring Platform</h1>
          <p className="text-slate-400 text-sm">{devices.size} dispositivo{devices.size !== 1 ? 's' : ''} activo{devices.size !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {anomalyCount > 0 && (
            <span className="text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/40 rounded-full px-3 py-1">
              {anomalyCount} anomalía{anomalyCount !== 1 ? 's' : ''}
            </span>
          )}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className="text-sm text-slate-400">
              {connected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {devices.size === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <p className="text-lg">Esperando datos de dispositivos...</p>
            <p className="text-sm mt-2">Asegurate de que el simulador y el backend estén corriendo.</p>
          </div>
        ) : (
          <>
            {/* Device cards */}
            <section>
              <h2 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-4">
                Dispositivos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(devices.entries()).map(([deviceId, state]) => (
                  <DeviceCard key={deviceId} deviceId={deviceId} state={state} />
                ))}
              </div>
            </section>

            {/* Temperature chart */}
            <section>
              <h2 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-4">
                Historial
              </h2>
              <TemperatureChart devices={devices} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
