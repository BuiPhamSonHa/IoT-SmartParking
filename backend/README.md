# SmartPark Backend (FastAPI)

Run:
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # mac/linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Check: http://localhost:8080/healthz


## Docker
```bash
docker build -t smartpark-backend .
docker run -p 8080:8080 smartpark-backend
```


## Windows note (timezone)
If you see `ZoneInfoNotFoundError: Asia/Bangkok` on Windows, install tzdata:

```bash
pip install tzdata
```

This project already includes `tzdata` in `requirements.txt`, so a fresh `pip install -r requirements.txt` should fix it.
