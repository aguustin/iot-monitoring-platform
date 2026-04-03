from fastapi import FastAPI
from models import TelemetryPayload, AnalysisResult
from detector import analyze

app = FastAPI(title="IoT AI Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalysisResult)
def analyze_telemetry(payload: TelemetryPayload) -> AnalysisResult:
    sensors = {
        "temperature": payload.sensors.temperature.value,
        "humidity":    payload.sensors.humidity.value,
        "pressure":    payload.sensors.pressure.value,
    }

    result = analyze(payload.device_id, sensors)

    return AnalysisResult(
        device_id=payload.device_id,
        risk_level=result["risk_level"],
        anomalies=result["anomalies"],
        scores=result["scores"],
    )
