# SmartPark — Fullstack Demo (Frontend + FastAPI Backend)

## 1) Requirements
- **Node.js LTS** (for frontend)
- **Python 3.10+** (for backend)

## 2) Run (Windows easiest)
1. Unzip this project
2. Double click: **RUN_ALL_WINDOWS.bat**
3. Open:
- Frontend: http://localhost:5173
- Backend Swagger: http://localhost:8080/docs

## 3) Run (manual)
### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4) Test without ESP32 (Simulator)
Backend provides simulator APIs you can call from **Postman / curl**.

See: `CURL_TESTS.md`


## Bonus: Run with Docker
```bash
docker-compose up --build
```
Then open http://localhost:5173
