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
