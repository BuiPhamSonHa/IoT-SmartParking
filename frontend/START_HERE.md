# START HERE — Chạy SmartPark Admin trên máy mới (Beginner)

## 1) Cần cài gì trước?
- **Node.js (LTS)** + **npm** (đi kèm khi cài Node)
- (Khuyến nghị) **VS Code** để mở code

> Cách kiểm tra đã có Node/npm chưa:
```bash
node -v
npm -v
```
Nếu ra version (ví dụ v20.x) là OK.

## 2) Chạy nhanh nhất (không cần biết gì)
### Windows
- Double click file: **RUN_WINDOWS.bat**
- Chờ nó tự `npm install` xong và chạy `npm run dev`
- Mở link hiển thị (thường: http://localhost:5173)

### macOS / Linux
1) Mở Terminal tại folder dự án
2) Chạy:
```bash
chmod +x RUN_MAC_LINUX.sh
./RUN_MAC_LINUX.sh
```
- Mở link hiển thị (thường: http://localhost:5173)

## 3) Login demo
- Username: `admin`
- Password: `123456`

## 4) Nếu chạy lỗi (rất thường gặp trên máy mới)
### A) Báo "node: command not found" / "npm not recognized"
=> Bạn chưa cài Node.js (LTS) hoặc chưa restart terminal/máy sau khi cài.

### B) Port 5173 bị chiếm
Chạy:
```bash
npm run dev -- --port 5174
```

### C) Muốn reset data demo (xóa localStorage)
- Mở DevTools (F12) → Application → Local Storage
- Xóa các key:
  - `smartpark:auth`
  - `smartpark:kiosks`
  - `smartpark:sessions`
  - `smartpark:pricing`
- Refresh trang


---

## Backend mock (ESP32 -> HTTP)

This project includes a mock backend server in `server/`:

- Start backend:
  - `npm run server`  (http://localhost:8080)

- Start frontend:
  - `npm run dev` (http://localhost:5173)

Or run both together:
- `npm run dev:full`

### ESP32 push (example)
POST `/api/esp32/push`
```json
{
  "kioskId": "k1",
  "direction": "IN",
  "plate": "20A-29839",
  "vehicleType": "CAR",
  "plateImageUrl": "/cameras/cam2.jpg",
  "temperatureC": 35,
  "humidityPct": 70
}
```
