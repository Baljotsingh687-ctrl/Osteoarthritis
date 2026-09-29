/**
 * Sensor (IMU) Model Client
 * =========================
 * Adapts the Node/PostgreSQL sensor-session storage model to the Python
 * SENSOR-OA FastAPI contract:
 *
 * POST /analyze-sensor
 * {
 *   "sampling_rate_hz": 100,
 *   "sensors": {
 *      "shin":  [{ t_ms, ax, ay, az, gx, gy, gz }, ...],
 *      "thigh": [{ t_ms, ax, ay, az, gx, gy, gz }, ...]
 *   }
 * }
 *
 * The Python service converts g -> m/s² and deg/s -> rad/s, resamples to 100 Hz,
 * detects strides, extracts 438 features, scales and predicts with the supplied
 * RandomForest model.
 */

const MODEL_VERSION = 'sensor-model-v1';

class SensorServiceError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'SensorServiceError';
    this.isModelService = true;
    this.status = status;
    this.detail = detail;
  }
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function normaliseReading(r) {
  return {
    t_ms: Number(r.t_ms),
    ax: Number(r.ax),
    ay: Number(r.ay),
    az: Number(r.az),
    gx: Number(r.gx),
    gy: Number(r.gy),
    gz: Number(r.gz),
  };
}

function groupReadings(readings) {
  const grouped = { shin: [], thigh: [] };

  for (const r of readings) {
    const location = String(r.sensor_location || '').toLowerCase();

    // Accept common DB/frontend names while keeping the Python API strict.
    const pos =
      location === 'shin' || location === 'shin_left' || location === 'knee_left'
        ? 'shin'
        : location === 'thigh' || location === 'thigh_right' || location === 'upper_leg'
          ? 'thigh'
          : null;

    if (!pos) continue;

    const item = normaliseReading(r);
    const values = [item.t_ms, item.ax, item.ay, item.az, item.gx, item.gy, item.gz];
    if (values.every(Number.isFinite)) grouped[pos].push(item);
  }

  grouped.shin.sort((a, b) => a.t_ms - b.t_ms);
  grouped.thigh.sort((a, b) => a.t_ms - b.t_ms);
  return grouped;
}

function firstNumber(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (isFiniteNumber(v)) return { key: k, value: v };
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) {
      return { key: k, value: Number(v) };
    }
  }
  return null;
}

function normalise(data) {
  const src = data && typeof data === 'object' && data.result && typeof data.result === 'object'
    ? data.result
    : data || {};

  const found = firstNumber(src, [
    'risk_score',
    'probability_koa',
    'probability',
    'confidence',
    'score',
  ]);

  // The actual SENSOR-OA contract exposes risk_score as 0..100.
  if (!found) return null;

  const scaled = found.key === 'risk_score' || found.value > 1
    ? found.value
    : found.value * 100;

  return {
    prediction: src.prediction ?? src.label ?? src.class ?? null,
    sensor_risk_score: Math.round(Math.min(100, Math.max(0, scaled)) * 10) / 10,
    risk_tier: src.risk_tier ?? null,
    confidence: isFiniteNumber(src.confidence) ? src.confidence : null,
    features: src.features ?? null,
    warnings: Array.isArray(src.warnings) ? src.warnings : [],
    prototype: src.prototype ?? true,
    interpretation: src.interpretation ?? null,
    model_version: src.model_version || MODEL_VERSION,
    raw_response: data,
  };
}

/**
 * Send stored sensor readings to the Python SENSOR-OA service.
 *
 * Database rows use sensor_location to distinguish IMUs. The Python API expects
 * sensors.shin and optionally sensors.thigh, so we transform the data here.
 */
async function analyzeSensorReadings(sessionId, readings, options = {}) {
  const url = process.env.SENSOR_API_URL;
  if (!url) {
    throw new SensorServiceError(
      'Sensor analysis is not configured on this server (SENSOR_API_URL is not set)',
      503
    );
  }

  const grouped = groupReadings(readings);
  if (grouped.shin.length === 0) {
    throw new SensorServiceError(
      'No recognised shin readings were found in this sensor session',
      422,
      'Expected sensor_location values such as "shin", "shin_left" or "knee_left".'
    );
  }

  const samplingRate = Number(options.sampling_rate_hz || process.env.SENSOR_SAMPLING_RATE_HZ || 100);

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Required when using an ngrok free browser warning page as the upstream.
    'ngrok-skip-browser-warning': 'true',
  };

  const apiKey = process.env.SENSOR_API_KEY;
  if (apiKey) {
    headers[process.env.SENSOR_API_KEY_HEADER || 'x-api-key'] = apiKey;
  }

  const payload = {
    sampling_rate_hz: samplingRate,
    sensors: {
      shin: grouped.shin,
      ...(grouped.thigh.length ? { thigh: grouped.thigh } : {}),
    },
  };

  // Make the full session timeout configurable.
  const timeoutMs = Number(process.env.SENSOR_API_TIMEOUT_MS || 60000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new SensorServiceError(`Sensor analysis timed out after ${timeoutMs} ms`, 504);
    }
    throw new SensorServiceError(
      'Could not reach the sensor analysis service. Check SENSOR_API_URL / ngrok.',
      503,
      err.message
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (_e) {
    data = null;
  }

  if (!res.ok) {
    const detail =
      (data && (data.detail || data.message || data.error))
        ? JSON.stringify(data.detail || data.message || data.error)
        : text.slice(0, 800);

    throw new SensorServiceError(
      'Sensor analysis service rejected the request',
      res.status === 422 ? 422 : 502,
      `HTTP ${res.status}: ${detail}`
    );
  }

  if (!data) {
    throw new SensorServiceError(
      'Sensor analysis service did not return JSON',
      502,
      text.slice(0, 400)
    );
  }

  const out = normalise(data);
  if (!out) {
    throw new SensorServiceError(
      'Sensor analysis response had no recognisable risk score',
      502,
      JSON.stringify(data).slice(0, 800)
    );
  }

  // Preserve the original session id for callers/logging.
  return { ...out, session_id: sessionId };
}

module.exports = {
  analyzeSensorReadings,
  SensorServiceError,
  MODEL_VERSION,
  groupReadings,
};
