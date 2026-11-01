import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = os.getenv("DATABASE_PATH", str(DATA_DIR / "city_pulse.db"))
JWT_SECRET = os.getenv("JWT_SECRET", "city-pulse-secure-jwt-key-2026-prod-grade")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# AI Service Gateway Key (configured server-side only, never sent to frontend)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Standard Supported Complaint Categories
CATEGORIES = [
    "Roads and potholes",
    "Garbage and sanitation",
    "Water supply and leakage",
    "Streetlights and electricity",
    "Drainage and sewage",
    "Other civic issues"
]

# Municipal Departments
DEPARTMENTS = [
    "Road Infrastructure & Engineering Department",
    "Solid Waste Management Department",
    "Water Supply and Sewerage Board",
    "Electricity Supply and Public Lighting Department",
    "Storm Water Drainage & Sewage Department",
    "Public Works & General Civic Administration"
]

CATEGORY_TO_DEPARTMENT = {
    "Roads and potholes": "Road Infrastructure & Engineering Department",
    "Garbage and sanitation": "Solid Waste Management Department",
    "Water supply and leakage": "Water Supply and Sewerage Board",
    "Streetlights and electricity": "Electricity Supply and Public Lighting Department",
    "Drainage and sewage": "Storm Water Drainage & Sewage Department",
    "Other civic issues": "Public Works & General Civic Administration",
    # Backward compatibility aliases
    "Roads and Potholes": "Road Infrastructure & Engineering Department",
    "Garbage and Sanitation": "Solid Waste Management Department",
    "Water Supply and Leakage": "Water Supply and Sewerage Board",
    "Streetlights and Electrical Infrastructure": "Electricity Supply and Public Lighting Department",
    "Drainage and Waterlogging": "Storm Water Drainage & Sewage Department",
    "Other Civic Infrastructure Issues": "Public Works & General Civic Administration"
}

# Duplicate Detection Settings
DUPLICATE_RADIUS_METERS = 500.0  # 500m radius
DUPLICATE_SIMILARITY_THRESHOLD = 0.55  # Combined score threshold

# Severity Scoring Weights
SEVERITY_WEIGHTS = {
    "safety_risk": 40,        # Public safety hazard: 0 to 40
    "affected_people": 25,    # High footfall / transit corridor: 0 to 25
    "infrastructure_damage": 20, # Structural severity: 0 to 20
    "duration_days": 15       # Days unresolved: 0 to 15
}

# Severity Levels
SEVERITY_LEVELS = {
    "Critical": 75,
    "High": 55,
    "Medium": 35,
    "Low": 0
}
