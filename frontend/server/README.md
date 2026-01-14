# Mock SmartPark Backend (ESP32 -> HTTP)

Run:
- `npm run server`

Core endpoint (ESP32 pushes here):
- `POST /api/esp32/push`

Polling endpoint for Frontend:
- `GET /api/state?after=<lastEventId>`

Quick test (generate an event without ESP32):
- `POST /api/debug/generate`
