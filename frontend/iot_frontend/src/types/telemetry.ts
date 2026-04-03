export interface SensorReading {
  value: number;
  unit: string;
}

export interface AnalysisResult {
  device_id: string;
  risk_level: "low" | "medium" | "high";
  anomalies: string[];
  scores: Record<string, number>;
}

export interface TelemetryPayload {
  device_id: string;
  location: string;
  timestamp: string;
  sensors: {
    temperature: SensorReading;
    humidity: SensorReading;
    pressure: SensorReading;
  };
  analysis?: AnalysisResult;
}
