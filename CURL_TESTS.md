# Curl / Postman test (local)

Base URL:
- Backend: `http://localhost:8080`
- API prefix: `/api/v1`

## Health
```bash
curl -s http://localhost:8080/healthz
curl -s http://localhost:8080/api/v1/dashboard
```

## List kiosks
```bash
curl -s http://localhost:8080/api/v1/kiosks
```

## Update pricing
```bash
curl -s -X PUT http://localhost:8080/api/v1/pricing \
  -H "Content-Type: application/json" \
  -d '{
    "freeMinutes": 15,
    "roundingVnd": 1000,
    "ratePerHour": {"MOTORBIKE": 3000, "CAR": 5000, "TRUCK": 8000}
  }'
```

## Simulator — telemetry (random temp/hum + camera)
```bash
curl -s -X POST http://localhost:8080/api/v1/simulator/telemetry \
  -H "Content-Type: application/json" \
  -d '{"kioskId":"k1"}'
```

## Simulator — vehicle entry
```bash
curl -s -X POST http://localhost:8080/api/v1/simulator/vehicle-entry \
  -H "Content-Type: application/json" \
  -d '{"kioskId":"k1","vehicleType":"CAR"}'
```

## Simulator — vehicle exit (calculates fee + stores history)
```bash
curl -s -X POST http://localhost:8080/api/v1/simulator/vehicle-exit \
  -H "Content-Type: application/json" \
  -d '{"kioskId":"k1"}'
```

## Get history (paged)
```bash
curl -s "http://localhost:8080/api/v1/vehicle-sessions?kioskId=k1&status=DONE&page=1&limit=20"
```

## Export CSV
```bash
curl -L "http://localhost:8080/api/v1/vehicle-sessions/export?kioskId=k1" -o smartpark_history.csv
```

## Real device style (ESP32 -> Backend ingest)
> Optional header `X-DEVICE-KEY` if you set `SMARTPARK_DEVICE_KEY`

### Telemetry
```bash
curl -s -X POST http://localhost:8080/api/v1/kiosks/k1/telemetry \
  -H "Content-Type: application/json" \
  -d '{"temperatureC": 33.2, "humidityPct": 65, "smoke": false, "cameraSnapshotUrl": "/cameras/cam2.jpg"}'
```

### Vehicle event (ENTRY)
```bash
curl -s -X POST http://localhost:8080/api/v1/kiosks/k1/vehicle-events \
  -H "Content-Type: application/json" \
  -d '{"type":"ENTRY","plate":"30A-12345","vehicleType":"CAR","cameraSnapshotUrl":"/cameras/cam3.jpg","plateSnapshotUrl":"/cameras/cam6.jpg"}'
```

### Vehicle event (EXIT)
```bash
curl -s -X POST http://localhost:8080/api/v1/kiosks/k1/vehicle-events \
  -H "Content-Type: application/json" \
  -d '{"type":"EXIT","cameraSnapshotUrl":"/cameras/cam4.jpg","plateSnapshotUrl":"/cameras/cam5.jpg"}'
```


### Idempotency (recommended)
When calling vehicle-events, you can include `eventId` to avoid duplicates on retry.



## Multipart / form-data image upload (no URL needed)

### Telemetry with snapshot image (multipart)
```bash
curl -X POST "http://localhost:8080/api/v1/kiosks/k1/telemetry" \
  -H "X-DEVICE-KEY: secret" \
  -F "temperatureC=31.2" \
  -F "humidityPct=70" \
  -F "smoke=false" \
  -F "ts=2026-01-15T10:00:00Z" \
  -F "cameraSnapshot=@./sample_cam.jpg"
```

### Vehicle ENTRY with camera + plate snapshots (multipart)
```bash
curl -X POST "http://localhost:8080/api/v1/kiosks/k1/vehicle-events" \
  -H "X-DEVICE-KEY: secret" \
  -F "type=ENTRY" \
  -F "plate=30A12345" \
  -F "vehicleType=CAR" \
  -F "ts=2026-01-15T10:01:00Z" \
  -F "eventId=evt-entry-001" \
  -F "cameraSnapshot=@./sample_cam.jpg" \
  -F "plateSnapshot=@./sample_plate.jpg"
```

### Vehicle EXIT with snapshots (multipart)
```bash
curl -X POST "http://localhost:8080/api/v1/kiosks/k1/vehicle-events" \
  -H "X-DEVICE-KEY: secret" \
  -F "type=EXIT" \
  -F "ts=2026-01-15T11:01:00Z" \
  -F "eventId=evt-exit-001" \
  -F "cameraSnapshot=@./sample_cam2.jpg" \
  -F "plateSnapshot=@./sample_plate2.jpg"
```

Notes:
- These endpoints still accept legacy JSON with `cameraSnapshotUrl` / `plateSnapshotUrl`.
- When you send files, backend saves them under `backend/media/` (or `/app/media` in Docker) and returns `cameraImageDataUrl` for direct rendering on the dashboard.
