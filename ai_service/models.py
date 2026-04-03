from pydantic import BaseModel


class SensorReading(BaseModel):
    value: float
    unit: str


class Sensors(BaseModel):
    temperature: SensorReading
    humidity: SensorReading
    pressure: SensorReading


class TelemetryPayload(BaseModel):
    device_id: str
    location: str
    timestamp: str
    sensors: Sensors


class AnalysisResult(BaseModel):
    device_id: str
    risk_level: str          # "low" | "medium" | "high"
    anomalies: list[str]     # nombres de sensores anómalos
    scores: dict[str, float] # z-score por sensor
