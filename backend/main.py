from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import requests, admin

app = FastAPI(title="DataVerse DSR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(requests.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "DataVerse DSR API"}


@app.post("/internal/seed")
def run_seed(secret: str):
    if secret != "dataverse-seed-2026":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden")
    from models import Base
    from database import engine
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    import seed as s
    s.seed()
    return {"message": "Database re-created and seeded successfully."}
