import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ---- In-memory store (Mock) ----
let nextEventId = 1;

/**
 * Kiosks live on the server to mimic a real IoT backend.
 * You can edit this list to "change test data on BE".
 */
let kiosks = [
  { id: "k1", name: "Kiot 1", temperatureC: 31, humidityPct: 59, updatedAt: new Date().toISOString() },
  { id: "k2", name: "Kiot 2", temperatureC: 33, humidityPct: 62, updatedAt: new Date().toISOString() },
  { id: "k3", name: "Kiot 3", temperatureC: 29, humidityPct: 55, updatedAt: new Date().toISOString() }
];

/**
 * Events are what the ESP32 would send to the backend.
 * FE will poll and "apply" these events to build sessions/history + pricing.
 */
let events = [];

/**
 * Update kiosk sensor snapshot if provided.
 */
function applySensor(kioskId, temperatureC, humidityPct) {
  const idx = kiosks.findIndex((k) => k.id === kioskId);
  if (idx === -1) return;
  const now = new Date().toISOString();
  kiosks[idx] = {
    ...kiosks[idx],
    temperatureC: typeof temperatureC === "number" ? Math.round(temperatureC) : kiosks[idx].temperatureC,
    humidityPct: typeof humidityPct === "number" ? Math.round(humidityPct) : kiosks[idx].humidityPct,
    updatedAt: now
  };
}

function toISO(ts) {
  if (!ts) return new Date().toISOString();
  if (typeof ts === "number") return new Date(ts).toISOString();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}


// ---- Auto sensor updates (mock ESP32 sending sensor packet every 5s) ----
// You can tweak ranges/thresholds here to "test by changing BE numbers".
setInterval(() => {
  kiosks = kiosks.map((k) => {
    const temp = Math.min(45, Math.max(15, k.temperatureC + (Math.random() * 2 - 1)));
    const hum = Math.min(95, Math.max(20, k.humidityPct + (Math.random() * 4 - 2)));
    return { ...k, temperatureC: Math.round(temp), humidityPct: Math.round(hum), updatedAt: new Date().toISOString() };
  });
}, 5000);

// ---- API ----
app.get("/api/health", (req, res) => res.json({ ok: true, serverTime: new Date().toISOString() }));

/** Kiosk CRUD (optional but useful for the Settings page) */
app.get("/api/kiosks", (req, res) => res.json({ kiosks, serverTime: new Date().toISOString() }));

app.post("/api/kiosks", (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "name is required" });
  const id = "k" + Math.random().toString(16).slice(2, 6);
  const now = new Date().toISOString();
  const k = { id, name, temperatureC: 30, humidityPct: 60, updatedAt: now };
  kiosks.push(k);
  res.json({ kiosk: k });
});

app.put("/api/kiosks/:id", (req, res) => {
  const id = req.params.id;
  const name = String(req.body?.name || "").trim();
  const idx = kiosks.findIndex((k) => k.id === id);
  if (idx === -1) return res.status(404).json({ error: "kiosk not found" });
  if (!name) return res.status(400).json({ error: "name is required" });
  kiosks[idx] = { ...kiosks[idx], name };
  res.json({ kiosk: kiosks[idx] });
});

app.delete("/api/kiosks/:id", (req, res) => {
  const id = req.params.id;
  kiosks = kiosks.filter((k) => k.id !== id);
  res.json({ ok: true });
});

/**
 * ESP32 push endpoint (the core of the mock backend)
 * Payload example:
 * {
 *   "kioskId": "k1",
 *   "ts": 1700000123456,
 *   "direction": "IN" | "OUT",        // optional for pure sensor updates
 *   "plate": "20A-29839",
 *   "vehicleType": "CAR",
 *   "plateImageUrl": "/cameras/cam2.jpg", // fake image path
 *   "cameraImageUrl": "/cameras/cam4.jpg",// fake camera frame path
 *   "temperatureC": 31,
 *   "humidityPct": 59
 * }
 */
app.post("/api/esp32/push", (req, res) => {
  const kioskId = String(req.body?.kioskId || "").trim();
  if (!kioskId) return res.status(400).json({ error: "kioskId is required" });

  const direction = req.body?.direction ? String(req.body.direction).toUpperCase() : undefined;
  const plate = req.body?.plate ? String(req.body.plate).trim() : undefined;
  const vehicleType = req.body?.vehicleType ? String(req.body.vehicleType).toUpperCase() : undefined;
  const plateImageUrl = req.body?.plateImageUrl ? String(req.body.plateImageUrl) : undefined;
  const cameraImageUrl = req.body?.cameraImageUrl ? String(req.body.cameraImageUrl) : undefined;

  const temperatureC = typeof req.body?.temperatureC === "number" ? req.body.temperatureC : undefined;
  const humidityPct = typeof req.body?.humidityPct === "number" ? req.body.humidityPct : undefined;

  applySensor(kioskId, temperatureC, humidityPct);

  const tsISO = toISO(req.body?.ts);

  // If direction exists => create an "event"
  if (direction === "IN" || direction === "OUT") {
    const ev = {
      id: nextEventId++,
      ts: tsISO,
      kioskId,
      direction,
      plate,
      vehicleType,
      plateImageUrl,
      cameraImageUrl,
      temperatureC,
      humidityPct
    };
    events.push(ev);
    return res.json({ event: ev });
  }

  return res.json({ ok: true });
});

/** Polling endpoint for FE: returns kiosk snapshot + events after a given id */
app.get("/api/state", (req, res) => {
  const after = Number(req.query.after || 0) || 0;
  const newEvents = events.filter((e) => e.id > after);
  const lastEventId = events.length ? events[events.length - 1].id : after;
  res.json({
    serverTime: new Date().toISOString(),
    kiosks,
    events: newEvents,
    lastEventId
  });
});

/** A helper endpoint to quickly generate test data from FE/Postman */
app.post("/api/debug/generate", (req, res) => {
  const kioskId = String(req.body?.kioskId || "k1");
  const direction = String(req.body?.direction || "IN").toUpperCase();
  const plate = String(req.body?.plate || "20A-29839");
  const vehicleType = String(req.body?.vehicleType || "CAR").toUpperCase();

  const cam = "/cameras/cam" + (1 + Math.floor(Math.random() * 6)) + ".jpg";
  const plateImg = "/cameras/cam" + (1 + Math.floor(Math.random() * 6)) + ".jpg";

  const temp = 20 + Math.floor(Math.random() * 20);
  const hum = 30 + Math.floor(Math.random() * 60);

  applySensor(kioskId, temp, hum);

  const ev = {
    id: nextEventId++,
    ts: new Date().toISOString(),
    kioskId,
    direction: direction === "OUT" ? "OUT" : "IN",
    plate,
    vehicleType,
    plateImageUrl: plateImg,
    cameraImageUrl: cam,
    temperatureC: temp,
    humidityPct: hum
  };
  events.push(ev);
  res.json({ event: ev });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, () => {
  console.log(`Mock SmartPark BE running on http://localhost:${PORT}`);
  console.log(`Endpoints: GET /api/state?after=0, POST /api/esp32/push`);
});
