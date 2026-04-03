"""
Detección de anomalías por Z-score con ventana deslizante.

Para cada sensor de cada dispositivo se mantiene un historial de las
últimas WINDOW_SIZE lecturas. Cuando hay suficientes datos se calcula
el Z-score; si supera el umbral se considera anomalía.

Con menos de MIN_SAMPLES lecturas se usa un fallback basado en umbrales fijos.
"""

from collections import defaultdict, deque
from math import sqrt

WINDOW_SIZE = 30
MIN_SAMPLES = 5
Z_THRESHOLD = 2.5

# Umbrales fijos usados cuando no hay historial suficiente
FIXED_THRESHOLDS: dict[str, tuple[float, float]] = {
    "temperature": (18.0, 30.0),
    "humidity":    (30.0, 70.0),
    "pressure":    (1000.0, 1025.0),
}

# { device_id: { sensor: deque[float] } }
_history: dict[str, dict[str, deque[float]]] = defaultdict(
    lambda: {s: deque(maxlen=WINDOW_SIZE) for s in FIXED_THRESHOLDS}
)


def _z_score(value: float, window: deque[float]) -> float:
    n = len(window)
    if n < MIN_SAMPLES:
        return 0.0
    mean = sum(window) / n
    std = sqrt(sum((v - mean) ** 2 for v in window) / n)
    if std == 0:
        return 0.0
    return abs(value - mean) / std


def _threshold_anomaly(sensor: str, value: float) -> bool:
    lo, hi = FIXED_THRESHOLDS[sensor]
    return value < lo or value > hi


def _risk_level(scores: dict[str, float], anomalies: list[str]) -> str:
    if not anomalies:
        return "low"
    max_score = max(scores[s] for s in anomalies)
    if max_score >= 3.5 or len(anomalies) >= 2:
        return "high"
    return "medium"


def analyze(device_id: str, sensors: dict[str, float]) -> dict:
    """
    Analiza un conjunto de lecturas de sensores para un dispositivo.

    Args:
        device_id: identificador del dispositivo
        sensors: { sensor_name: value }

    Returns:
        dict con anomalies, scores y risk_level
    """
    device_history = _history[device_id]
    scores: dict[str, float] = {}
    anomalies: list[str] = []

    for sensor, value in sensors.items():
        window = device_history[sensor]
        z = _z_score(value, window)

        # Si no hay historial suficiente, usar umbrales fijos
        if len(window) < MIN_SAMPLES:
            is_anomaly = _threshold_anomaly(sensor, value)
            scores[sensor] = 999.0 if is_anomaly else 0.0
        else:
            is_anomaly = z > Z_THRESHOLD
            scores[sensor] = round(z, 3)

        if is_anomaly:
            anomalies.append(sensor)

        # Actualizar historial solo con valores normales
        # para que una anomalía no contamine la ventana
        if not is_anomaly:
            window.append(value)

    return {
        "anomalies": anomalies,
        "scores": scores,
        "risk_level": _risk_level(scores, anomalies),
    }
