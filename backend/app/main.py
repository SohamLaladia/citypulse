import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import init_db, seed_default_data
from app.config import UPLOAD_DIR, BASE_DIR
from app.routers import auth_router, complaints_router, admin_router, analytics_router, assistant_router, ai_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    if os.getenv("TESTING") != "1":
        try:
            seed_default_data()
        except Exception as e:
            print(f"[Seed Notice] {e}")
    yield

app = FastAPI(
    title="City Pulse API",
    description="AI-Powered Civic Grievance Reporting, Intelligence & Resolution-Tracking Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

for folder in ["css", "js", "assets"]:
    folder_path = BASE_DIR / folder
    if folder_path.exists():
        app.mount(f"/{folder}", StaticFiles(directory=str(folder_path)), name=folder)

app.include_router(ai_router.router)
app.include_router(auth_router.router)
app.include_router(complaints_router.router)
app.include_router(admin_router.router)
app.include_router(analytics_router.router)
app.include_router(assistant_router.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "City Pulse Civic Engine",
        "version": "1.0.0",
        "database": "SQLite PostGIS-compatible Engine Active"
    }

@app.get("/api/config/mapbox-token")
def config_mapbox_token():
    return {"mapbox_token": os.getenv("MAPBOX_TOKEN", "")}

@app.get("/")
def serve_frontend_root():
    index_path = BASE_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "City Pulse API is online. Frontend index not found."}
